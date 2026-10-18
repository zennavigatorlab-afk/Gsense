import {
  InteractionEvent,
  LearningSummary,
  AssistanceLevel,
  AdaptiveSuggestion,
  EventType,
  OfferedTipRecord,
  AssistanceFeedback,
} from '../types';
import {
  getLocalInteractionEvents,
  saveLocalInteractionEvent,
  purgeLocalData,
  getLocalOfferedTips,
  saveLocalOfferedTip,
  updateLocalOfferedTipFeedback,
  getLocalFeedback,
  saveLocalFeedback,
} from './supabaseClient';

export interface RecordOptions {
  sessionId: string;
  screenId: string;
  componentType: string;
  eventType: EventType;
  isCorrection?: boolean;
  userId?: string;
}

export const MAX_ACTIVE_TASK_HESITATION_MS = 30000; // 30 seconds cutoff distinguishing active dwell from idle/away
export const TARGET_SAMPLE_SIZE = 50;

export class GSenseBrowserEngine {
  private lastInteractionTime: number = Date.now();
  private attemptMap: Map<string, number> = new Map();
  private isPaused: boolean = false;
  private currentAssistanceLevel: AssistanceLevel = 'hints_only';
  private hesitationThresholdMs: number = 8000;
  private repeatAttemptsTrigger: number = 3;
  private wasTabBackgrounded: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.lastInteractionTime = Date.now();
    this.attachLifecycleListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.warn('G-SENSE listener update error:', err);
      }
    }
  }

  private attachLifecycleListeners(): void {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.wasTabBackgrounded = true;
        } else if (document.visibilityState === 'visible') {
          // Reset interaction clock on return so background time is not treated as task hesitation
          this.lastInteractionTime = Date.now();
        }
      });

      window.addEventListener('blur', () => {
        this.wasTabBackgrounded = true;
      });

      window.addEventListener('focus', () => {
        this.lastInteractionTime = Date.now();
      });
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (!paused) {
      this.lastInteractionTime = Date.now();
      this.wasTabBackgrounded = false;
    }
    this.notify();
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public configureThresholds(
    hesitationMs: number,
    repeatTrigger: number,
    preferredLevel?: AssistanceLevel
  ): void {
    this.hesitationThresholdMs = hesitationMs;
    this.repeatAttemptsTrigger = repeatTrigger;
    if (preferredLevel) {
      this.currentAssistanceLevel = preferredLevel;
    }
    this.notify();
  }

  /**
   * Records a permitted interaction event.
   * Strict privacy invariant: Never records keystroke content, typed passwords, or input values.
   */
  public recordEvent(options: RecordOptions): {
    event: InteractionEvent | null;
    suggestion: AdaptiveSuggestion | null;
  } {
    // 1. Strict pause check: stops all collection
    if (this.isPaused) {
      return { event: null, suggestion: null };
    }

    const now = Date.now();
    const rawElapsedMs = Math.max(0, now - this.lastInteractionTime);
    this.lastInteractionTime = now;

    // Distinguish active task dwell from intentional idle time / background absence
    const isIdle =
      this.wasTabBackgrounded ||
      rawElapsedMs > MAX_ACTIVE_TASK_HESITATION_MS ||
      options.eventType === 'idle_pause';

    // Reset background flag after registering the transition
    this.wasTabBackgrounded = false;

    // Cap hesitationMs for active task dwell analysis
    const hesitationMs = isIdle
      ? Math.min(rawElapsedMs, MAX_ACTIVE_TASK_HESITATION_MS)
      : rawElapsedMs;

    const targetKey = `${options.screenId}:${options.componentType}`;
    const previousAttempts = this.attemptMap.get(targetKey) || 0;
    const currentAttempt = previousAttempts + 1;
    this.attemptMap.set(targetKey, currentAttempt);

    const event: InteractionEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      userId: options.userId,
      sessionId: options.sessionId,
      screenId: options.screenId,
      componentType: options.componentType,
      eventType: isIdle && options.eventType !== 'action_success' ? 'idle_pause' : options.eventType,
      attemptCount: currentAttempt,
      hesitationMs,
      isCorrection: !!options.isCorrection,
      isIdle,
      timestamp: now,
    };

    saveLocalInteractionEvent(event);

    // Evaluate transparent rule-based triggers
    const suggestion = this.evaluateImmediateAssistance(event, hesitationMs, currentAttempt, isIdle);

    if (suggestion) {
      // Auto-record offered tip to guarantee every displayed tip is counted
      this.trackTipOffered(suggestion, options.screenId);
    }

    this.notify();
    return { event, suggestion };
  }

  /**
   * Manually track a guidance tip offer (e.g. from homepage sandbox or manual triggers)
   * to guarantee every guidance tip actually displayed is counted.
   */
  public trackTipOffered(suggestion: AdaptiveSuggestion, screenId: string = 'active_session'): void {
    const tipRecord: OfferedTipRecord = {
      id: 'tip_' + Math.random().toString(36).substring(2, 9),
      promptId: suggestion.id,
      title: suggestion.title,
      triggerReason: suggestion.triggerReason,
      screenId,
      offeredAt: new Date().toISOString(),
      status: 'displayed',
    };
    saveLocalOfferedTip(tipRecord);
    this.notify();
  }

  /**
   * Record Yes/No user feedback for a guidance tip
   */
  public recordFeedback(
    promptId: string,
    wasHelpful: boolean,
    screenId: string = 'active_session',
    triggerReason: string = 'Rule evaluation',
    userId?: string
  ): void {
    const feedback: AssistanceFeedback = {
      id: 'fb_' + Math.random().toString(36).substring(2, 9),
      userId,
      promptId,
      screenId,
      triggerReason,
      wasHelpful,
      createdAt: new Date().toISOString(),
    };
    saveLocalFeedback(feedback);
    updateLocalOfferedTipFeedback(
      promptId,
      wasHelpful ? 'accepted' : 'unhelpful',
      wasHelpful
    );
    this.notify();
  }

  public recordTipDismissed(promptId: string): void {
    updateLocalOfferedTipFeedback(promptId, 'dismissed', false);
    this.notify();
  }

  public getAssistanceStats(): {
    totalOffered: number;
    helpfulCount: number;
    unhelpfulCount: number;
    feedbackSubmittedCount: number;
    dismissedCount: number;
    acceptanceRateSubmitted: number; // helpful / submitted * 100
    acceptanceRateOffered: number;   // helpful / totalOffered * 100
  } {
    const offeredTips = getLocalOfferedTips();
    const feedbackList = getLocalFeedback();

    const helpfulCount = feedbackList.filter((f) => f.wasHelpful).length;
    const unhelpfulCount = feedbackList.filter((f) => !f.wasHelpful).length;
    const feedbackSubmittedCount = helpfulCount + unhelpfulCount;
    const dismissedCount = offeredTips.filter((t) => t.status === 'dismissed').length;
    const totalOffered = offeredTips.length;

    const acceptanceRateSubmitted =
      feedbackSubmittedCount > 0
        ? Math.round((helpfulCount / feedbackSubmittedCount) * 100)
        : 0;

    const acceptanceRateOffered =
      totalOffered > 0 ? Math.round((helpfulCount / totalOffered) * 100) : 0;

    return {
      totalOffered,
      helpfulCount,
      unhelpfulCount,
      feedbackSubmittedCount,
      dismissedCount,
      acceptanceRateSubmitted,
      acceptanceRateOffered,
    };
  }

  public resetAttemptCounter(screenId: string, componentType: string): void {
    this.attemptMap.delete(`${screenId}:${componentType}`);
  }

  /**
   * Transparent trigger evaluation
   */
  private evaluateImmediateAssistance(
    event: InteractionEvent,
    hesitationMs: number,
    attemptCount: number,
    isIdle: boolean
  ): AdaptiveSuggestion | null {
    // 1. Trigger on repeat attempts (user retrying a button or form >= repeatAttemptsTrigger times)
    if (attemptCount >= this.repeatAttemptsTrigger) {
      return {
        id: `sug_repeat_${Date.now()}`,
        title: 'Need a hand with this step?',
        message: `We noticed you tried this action ${attemptCount} times. Here is a simplified hint to guide you.`,
        level: 'step_by_step',
        actionText: 'Review step-by-step guidance',
        triggerReason: `Repeated attempt threshold reached (${attemptCount} attempts on ${event.componentType})`,
        steps: [
          'Verify all required inputs are completed.',
          'Check that network connection is active.',
          'Review the field notes or use auto-filled defaults.',
        ],
      };
    }

    // 2. Trigger on prolonged ACTIVE task hesitation (only if not idle absence)
    if (!isIdle && hesitationMs >= this.hesitationThresholdMs && event.eventType !== 'action_success') {
      return {
        id: `sug_hesitation_${Date.now()}`,
        title: 'Helpful shortcut available',
        message: 'You have been on this step for a moment. Would you like a concise tip or shortcut?',
        level: 'hints_only',
        actionText: 'Show tip',
        triggerReason: `Task hesitation dwell exceeded (${Math.round(hesitationMs / 1000)}s active pause)`,
      };
    }

    // 3. Trigger on frequent corrections
    if (event.isCorrection) {
      return {
        id: `sug_correction_${Date.now()}`,
        title: 'Form validation tip',
        message: 'A correction was just made. Would you like to enable field-level explanatory labels?',
        level: 'hints_only',
        actionText: 'Enable inline guidance',
        triggerReason: 'Correction event registered on component',
      };
    }

    return null;
  }

  /**
   * Computes mathematical summary over recorded interaction events.
   * Never generates arbitrary percentage confidence or claims emotional detection.
   */
  public computeSummary(): LearningSummary {
    const events = getLocalInteractionEvents();
    const total = events.length;

    if (total === 0) {
      return {
        totalEvents: 0,
        activeTaskEvents: 0,
        avgHesitationMs: 0,
        totalIdleIntervals: 0,
        correctionRate: 0,
        repeatAttemptRate: 0,
        sampleSize: 0,
        sampleTarget: TARGET_SAMPLE_SIZE,
        sampleSufficiencyRatio: 0,
        sampleStatusLabel: 'No interaction data recorded yet',
        recommendedAssistanceLevel: 'hints_only',
        explanation: 'No interaction events found. Start using the application to collect real usage metrics.',
        computedAt: new Date().toISOString(),
      };
    }

    // Filter active task dwell events (excluding background absences and idle > 30s)
    const activeEvents = events.filter((e) => !e.isIdle && e.hesitationMs <= MAX_ACTIVE_TASK_HESITATION_MS);
    const activeCount = activeEvents.length;
    const totalIdleIntervals = events.filter(
      (e) => e.isIdle || e.hesitationMs > MAX_ACTIVE_TASK_HESITATION_MS || e.eventType === 'idle_pause'
    ).length;

    const totalActiveHesitation = activeEvents.reduce((sum, e) => sum + (e.hesitationMs || 0), 0);
    const avgHesitation = activeCount > 0 ? Math.round(totalActiveHesitation / activeCount) : 0;

    const corrections = events.filter((e) => e.isCorrection || e.eventType === 'correction').length;
    const correctionRate = parseFloat((corrections / total).toFixed(4));

    const repeats = events.filter((e) => (e.attemptCount || 1) >= this.repeatAttemptsTrigger).length;
    const repeatAttemptRate = parseFloat((repeats / total).toFixed(4));

    // Sample size indicator (n / 50 events target)
    const sampleSufficiencyRatio = parseFloat(Math.min(1.0, total / TARGET_SAMPLE_SIZE).toFixed(2));
    let sampleStatusLabel = 'Sparse (Under 15 events - Insufficient data for stable inference)';
    if (total >= TARGET_SAMPLE_SIZE) {
      sampleStatusLabel = `Mature Sample (${total} ≥ 50 events - Calibrated on empirical data)`;
    } else if (total >= 15) {
      sampleStatusLabel = `Preliminary Sample (${total} of 50 events - Patterns stabilizing)`;
    }

    // Transparent rule logic for recommendation
    let recommended: AssistanceLevel = 'hints_only';
    let explanation =
      'Balanced interaction cadence observed. Contextual hints provide optimal support.';

    if (avgHesitation > this.hesitationThresholdMs || repeatAttemptRate > 0.2 || correctionRate > 0.25) {
      recommended = 'step_by_step';
      explanation = `Elevated task hesitation (${avgHesitation}ms active avg) or retry rate (${Math.round(
        repeatAttemptRate * 100
      )}%). Step-by-step guidance suggested.`;
    } else if (activeCount >= 5 && avgHesitation < 3000 && correctionRate < 0.1 && repeatAttemptRate < 0.08) {
      recommended = 'minimal';
      explanation = `Fast, low-friction interactions (${avgHesitation}ms avg dwell). Minimal guidance prevents interruptions.`;
    }

    return {
      totalEvents: total,
      activeTaskEvents: activeCount,
      avgHesitationMs: avgHesitation,
      totalIdleIntervals,
      correctionRate,
      repeatAttemptRate,
      sampleSize: total,
      sampleTarget: TARGET_SAMPLE_SIZE,
      sampleSufficiencyRatio,
      sampleStatusLabel,
      recommendedAssistanceLevel: recommended,
      explanation,
      computedAt: new Date().toISOString(),
    };
  }

  public exportDataBundle(): string {
    const events = getLocalInteractionEvents();
    const offeredTips = getLocalOfferedTips();
    const feedback = getLocalFeedback();
    const summary = this.computeSummary();
    const stats = this.getAssistanceStats();

    const bundle = {
      appName: 'G-SENSE',
      tagline: 'AdaptiveAssistant',
      meaning: 'G = Good; SENSE = learning interaction patterns',
      privacyGuarantee: '100% Client-Side. Zero raw text, zero keystroke logging, zero passwords, zero remote transmission without explicit user export.',
      exportedAt: new Date().toISOString(),
      summary,
      assistanceStats: stats,
      totalEventsCount: events.length,
      events,
      tipsOfferedCount: offeredTips.length,
      tipsOffered: offeredTips,
      feedbackCount: feedback.length,
      feedback,
    };
    return JSON.stringify(bundle, null, 2);
  }

  public computeMetrics() {
    const summary = this.computeSummary();
    const stats = this.getAssistanceStats();
    return {
      totalEvents: summary.totalEvents,
      totalOffered: stats.totalOffered,
      maturityTier: summary.sampleStatusLabel,
      sampleSize: summary.sampleSize,
      summary,
      stats,
    };
  }

  public purgeAllData(): void {
    this.clearAllData();
  }

  public exportEventsAsJson(): string {
    return this.exportDataBundle();
  }

  public exportEventsAsCsv(): string {
    const events = getLocalInteractionEvents();
    if (events.length === 0) {
      return 'id,session_id,screen_id,component_type,event_type,attempt_count,hesitation_ms,is_correction,is_idle,timestamp\n';
    }

    const headers = [
      'id',
      'session_id',
      'screen_id',
      'component_type',
      'event_type',
      'attempt_count',
      'hesitation_ms',
      'is_correction',
      'is_idle',
      'timestamp',
    ];
    const rows = events.map((e) =>
      [
        e.id,
        e.sessionId,
        e.screenId,
        e.componentType,
        e.eventType,
        e.attemptCount,
        e.hesitationMs,
        e.isCorrection ? 'true' : 'false',
        e.isIdle ? 'true' : 'false',
        new Date(e.timestamp).toISOString(),
      ].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  public clearAllData(): void {
    purgeLocalData();
    this.attemptMap.clear();
    this.lastInteractionTime = Date.now();
    this.wasTabBackgrounded = false;
    this.notify();
  }
}

export const learningEngine = new GSenseBrowserEngine();
