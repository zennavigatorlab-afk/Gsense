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
  isSimulation?: boolean;
  explicitHesitationMs?: number;
  userId?: string;
}

export interface EngineThresholdConfig {
  hesitationThresholdMs: number;
  maxActiveTaskHesitationMs: number;
  repeatAttemptsTrigger: number;
  backtrackWindowMs: number;
  cooldownPeriodMs: number;
  autoSuggestionsEnabled: boolean;
}

export const DEFAULT_MAX_ACTIVE_TASK_HESITATION_MS = 30000; // 30 seconds cutoff distinguishing active dwell from idle/away
export const MAX_ACTIVE_TASK_HESITATION_MS = DEFAULT_MAX_ACTIVE_TASK_HESITATION_MS;
export const TARGET_SAMPLE_SIZE = 50;

export class GSenseBrowserEngine {
  private lastInteractionTime: number = Date.now();
  private attemptMap: Map<string, number> = new Map();
  private isPaused: boolean = false;
  private currentAssistanceLevel: AssistanceLevel = 'hints_only';

  // Configurable, documented thresholds
  private hesitationThresholdMs: number = 8000; // 8s active dwell threshold (pauses never assumed to mean confusion)
  private maxActiveTaskHesitationMs: number = DEFAULT_MAX_ACTIVE_TASK_HESITATION_MS;
  private repeatAttemptsTrigger: number = 3; // 3 retries on same component
  private backtrackWindowMs: number = 15000; // 15s rapid return window
  private cooldownPeriodMs: number = 180000; // 3 minutes cooldown per rule/component to prevent repeated hints
  private autoSuggestionsEnabled: boolean = true; // Master toggle to disable automatic guidance popups

  private navigationHistory: Array<{ screenId: string; timestamp: number }> = [];
  private recentSuggestionTimestamps: Map<string, number> = new Map();
  private dismissedRuleKeys: Set<string> = new Set();

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
          // Reset interaction clock on return so background absence is not treated as in-task hesitation
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

  public setAutoSuggestionsEnabled(enabled: boolean): void {
    this.autoSuggestionsEnabled = enabled;
    this.notify();
  }

  public getAutoSuggestionsEnabled(): boolean {
    return this.autoSuggestionsEnabled;
  }

  /**
   * Configures documented interaction thresholds
   */
  public configureThresholds(
    hesitationMs: number,
    repeatTrigger: number,
    preferredLevel?: AssistanceLevel,
    backtrackWindowMs?: number,
    cooldownPeriodMs?: number,
    autoSuggestionsEnabled?: boolean
  ): void {
    if (hesitationMs && hesitationMs > 0) {
      this.hesitationThresholdMs = hesitationMs;
    }
    if (repeatTrigger && repeatTrigger > 0) {
      this.repeatAttemptsTrigger = repeatTrigger;
    }
    if (preferredLevel) {
      this.currentAssistanceLevel = preferredLevel;
    }
    if (backtrackWindowMs && backtrackWindowMs > 0) {
      this.backtrackWindowMs = backtrackWindowMs;
    }
    if (cooldownPeriodMs && cooldownPeriodMs > 0) {
      this.cooldownPeriodMs = cooldownPeriodMs;
    }
    if (typeof autoSuggestionsEnabled === 'boolean') {
      this.autoSuggestionsEnabled = autoSuggestionsEnabled;
    }
    this.notify();
  }

  public getThresholds(): EngineThresholdConfig & {
    descriptions: Record<keyof EngineThresholdConfig, string>;
  } {
    return {
      hesitationThresholdMs: this.hesitationThresholdMs,
      maxActiveTaskHesitationMs: this.maxActiveTaskHesitationMs,
      repeatAttemptsTrigger: this.repeatAttemptsTrigger,
      backtrackWindowMs: this.backtrackWindowMs,
      cooldownPeriodMs: this.cooldownPeriodMs,
      autoSuggestionsEnabled: this.autoSuggestionsEnabled,
      descriptions: {
        hesitationThresholdMs:
          'Active in-task dwell threshold in ms (default 8000ms). Pauses are natural and never assumed to mean confusion.',
        maxActiveTaskHesitationMs:
          'Cutoff distinguishing active in-task dwell from away/idle time (default 30000ms). Dwells over 30s are marked idle.',
        repeatAttemptsTrigger:
          'Number of repeated clicks/attempts on the same component within a session window (default 3).',
        backtrackWindowMs:
          'Window in ms for detecting rapid navigation return to the previous screen (default 15000ms).',
        cooldownPeriodMs:
          'Cooldown interval in ms before the same rule/component can trigger another guidance tip (default 180000ms / 3 min).',
        autoSuggestionsEnabled:
          'Whether non-intrusive automatic guidance popups are shown when thresholds are met (default true).',
      },
    };
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
    const rawElapsedMs =
      typeof options.explicitHesitationMs === 'number'
        ? Math.max(0, options.explicitHesitationMs)
        : Math.max(0, now - this.lastInteractionTime);
    this.lastInteractionTime = now;

    // Distinguish active task dwell from intentional idle time / background absence
    const isIdle =
      this.wasTabBackgrounded ||
      rawElapsedMs > this.maxActiveTaskHesitationMs ||
      options.eventType === 'idle_pause';

    // Reset background flag after registering the transition
    this.wasTabBackgrounded = false;

    // Cap hesitationMs for active task dwell analysis
    const hesitationMs = isIdle
      ? Math.min(rawElapsedMs, this.maxActiveTaskHesitationMs)
      : rawElapsedMs;

    // Detect navigation backtracking (returning to preceding page within backtrack window)
    let effectiveEventType: EventType = options.eventType;
    let isCorrection = !!options.isCorrection;

    if (options.eventType === 'navigation') {
      const historyLen = this.navigationHistory.length;
      if (historyLen >= 2) {
        const lastStep = this.navigationHistory[historyLen - 1];
        const priorStep = this.navigationHistory[historyLen - 2];
        if (
          options.screenId === priorStep.screenId &&
          now - lastStep.timestamp <= this.backtrackWindowMs
        ) {
          effectiveEventType = 'backtrack';
          isCorrection = true;
        }
      }
      this.navigationHistory.push({ screenId: options.screenId, timestamp: now });
      if (this.navigationHistory.length > 15) {
        this.navigationHistory.shift();
      }
    }

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
      eventType: isIdle && effectiveEventType !== 'action_success' ? 'idle_pause' : effectiveEventType,
      attemptCount: currentAttempt,
      hesitationMs,
      isCorrection,
      isIdle,
      isSimulation: !!options.isSimulation,
      timestamp: now,
    };

    saveLocalInteractionEvent(event);

    // Evaluate transparent rule-based triggers
    const suggestion = this.evaluateImmediateAssistance(
      event,
      hesitationMs,
      currentAttempt,
      isIdle
    );

    if (suggestion) {
      // Auto-record offered tip to guarantee every displayed tip is counted
      this.trackTipOffered(suggestion, options.screenId);
    }

    this.notify();
    return { event, suggestion };
  }

  /**
   * Manually track a guidance tip offer
   */
  public trackTipOffered(suggestion: AdaptiveSuggestion, screenId: string = 'active_session'): void {
    const tipRecord: OfferedTipRecord = {
      id: 'tip_' + Math.random().toString(36).substring(2, 9),
      promptId: suggestion.id,
      ruleKey: suggestion.ruleKey,
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

  public recordTipDismissed(promptId: string, ruleKey?: string): void {
    if (ruleKey) {
      this.dismissedRuleKeys.add(ruleKey);
    }
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

  private isRuleInCooldown(ruleKey: string): boolean {
    const now = Date.now();
    const lastTriggered = this.recentSuggestionTimestamps.get(ruleKey) || 0;
    if (now - lastTriggered < this.cooldownPeriodMs) {
      return true;
    }
    if (this.dismissedRuleKeys.has(ruleKey)) {
      // If user dismissed this specific hint recently, respect the cooldown
      return true;
    }
    return false;
  }

  private markRuleTriggered(ruleKey: string): void {
    this.recentSuggestionTimestamps.set(ruleKey, Date.now());
  }

  /**
   * Transparent rule-based assistance trigger evaluation.
   * Avoids repeating recent suggestions (frequency capping / cooldown).
   * Strictly avoids emotional guessing ("confused", "frustrated"); uses objective interaction telemetry.
   */
  private evaluateImmediateAssistance(
    event: InteractionEvent,
    hesitationMs: number,
    attemptCount: number,
    isIdle: boolean
  ): AdaptiveSuggestion | null {
    // 0. If user disabled automatic suggestions, never pop up automatic hints
    if (!this.autoSuggestionsEnabled) {
      return null;
    }

    // 1. Trigger on repeat attempts (user retrying a button or form >= repeatAttemptsTrigger times)
    if (attemptCount >= this.repeatAttemptsTrigger) {
      const ruleKey = `repeat:${event.screenId}:${event.componentType}`;
      if (!this.isRuleInCooldown(ruleKey)) {
        this.markRuleTriggered(ruleKey);
        return {
          id: `sug_repeat_${Date.now()}`,
          ruleKey,
          title: 'Guidance for this action',
          message: `This action was selected ${attemptCount} times in succession. Here are progressive options to assist you:`,
          shortHint: 'Check field requirements or reload default values to ensure the action can complete.',
          simpleExplanation:
            'When an action is repeated several times, it usually means an underlying prerequisite or validation requirement was not satisfied.',
          level: 'step_by_step',
          actionText: 'Review step-by-step guidance',
          triggerReason: `Repeated attempt threshold reached (${attemptCount} attempts on ${event.componentType})`,
          steps: [
            'Confirm all required fields are filled with valid values.',
            'Check that network connection is active and responsive.',
            'Review field notes or reset to default configurations.',
          ],
        };
      }
    }

    // 2. Trigger on rapid navigation return (backtracking)
    if (event.eventType === 'backtrack') {
      const ruleKey = `backtrack:${event.screenId}`;
      if (!this.isRuleInCooldown(ruleKey)) {
        this.markRuleTriggered(ruleKey);
        return {
          id: `sug_backtrack_${Date.now()}`,
          ruleKey,
          title: 'Navigation shortcut',
          message:
            'You quickly returned to this view. Would you like a direct index to locate a specific feature?',
          shortHint: 'Use the top navigation bar to jump directly to Features, Dashboard, Docs, or Downloads.',
          simpleExplanation:
            'Quickly returning to a previous view often indicates the target screen did not contain what you were seeking. G-SENSE provides direct navigation paths.',
          level: 'hints_only',
          actionText: 'Explore navigation index',
          triggerReason: `Rapid navigation return detected (returned to ${event.screenId} within ${Math.round(
            this.backtrackWindowMs / 1000
          )}s)`,
          steps: [
            'Click Features for interactive capabilities.',
            'Click Dashboard for real-time interaction metrics.',
            'Click Docs for API specifications and schema migrations.',
          ],
        };
      }
    }

    // 3. Trigger on prolonged ACTIVE task hesitation (only if not idle absence)
    // NOTE: Pauses are never assumed to indicate confusion.
    if (!isIdle && hesitationMs >= this.hesitationThresholdMs && event.eventType !== 'action_success') {
      const ruleKey = `pause:${event.screenId}`;
      if (!this.isRuleInCooldown(ruleKey)) {
        this.markRuleTriggered(ruleKey);
        return {
          id: `sug_hesitation_${Date.now()}`,
          ruleKey,
          title: 'Helpful shortcut & reference',
          message:
            'You have been in this view for a moment. A concise tip or reference is available whenever you are ready.',
          shortHint: 'Take your time. Keyboard shortcuts and contextual documentation are always accessible.',
          simpleExplanation:
            'Pauses are normal when reading or considering options. G-SENSE offers shortcuts without rushing your workflow.',
          level: 'hints_only',
          actionText: 'Show reference shortcut',
          triggerReason: `Task dwell exceeded threshold (${Math.round(
            hesitationMs / 1000
          )}s active pause; pauses are natural and not assumed to indicate confusion)`,
          steps: [
            'Read documentation notes in the Docs tab for details.',
            'Adjust your interaction pace anytime in Settings.',
            'Dismiss this hint if you are simply taking time to read.',
          ],
        };
      }
    }

    // 4. Trigger on frequent corrections
    if (event.isCorrection && event.eventType !== 'backtrack') {
      const ruleKey = `correction:${event.screenId}:${event.componentType}`;
      if (!this.isRuleInCooldown(ruleKey)) {
        this.markRuleTriggered(ruleKey);
        return {
          id: `sug_correction_${Date.now()}`,
          ruleKey,
          title: 'Input assistance',
          message:
            'A field correction occurred. Inline guidance labels can help clarify expected formatting.',
          shortHint: 'Check field placeholder text and input constraints for correct formatting.',
          simpleExplanation:
            'Field corrections indicate potential ambiguity in interface labels. Inline helpers reduce validation friction.',
          level: 'hints_only',
          actionText: 'Review field format',
          triggerReason: `Correction event registered on ${event.componentType}`,
          steps: [
            'Review expected formats (e.g. valid UUIDs or positive integers).',
            'Use standard presets where available.',
            'Save your changes to persist configuration.',
          ],
        };
      }
    }

    return null;
  }

  /**
   * Computes mathematical summary over recorded interaction events.
   * Separates real interactions from simulations.
   * Never generates arbitrary percentage confidence or claims emotional detection.
   */
  public computeSummary(): LearningSummary {
    const events = getLocalInteractionEvents();
    const total = events.length;
    const realEventsCount = events.filter((e) => !e.isSimulation).length;
    const simulatedEventsCount = events.filter((e) => !!e.isSimulation).length;

    if (total === 0) {
      return {
        totalEvents: 0,
        realEventsCount: 0,
        simulatedEventsCount: 0,
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
    const activeEvents = events.filter((e) => !e.isIdle && e.hesitationMs <= this.maxActiveTaskHesitationMs);
    const activeCount = activeEvents.length;
    const totalIdleIntervals = events.filter(
      (e) => e.isIdle || e.hesitationMs > this.maxActiveTaskHesitationMs || e.eventType === 'idle_pause'
    ).length;

    const totalActiveHesitation = activeEvents.reduce((sum, e) => sum + (e.hesitationMs || 0), 0);
    const avgHesitation = activeCount > 0 ? Math.round(totalActiveHesitation / activeCount) : 0;

    const corrections = events.filter((e) => e.isCorrection || e.eventType === 'correction' || e.eventType === 'backtrack').length;
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
      'Balanced interaction cadence observed. Contextual hints provide optimal support without interruption.';

    if (avgHesitation > this.hesitationThresholdMs || repeatAttemptRate > 0.2 || correctionRate > 0.25) {
      recommended = 'step_by_step';
      explanation = `Elevated task dwell (${avgHesitation}ms active avg) or retry rate (${Math.round(
        repeatAttemptRate * 100
      )}%). Step-by-step guidance suggested.`;
    } else if (activeCount >= 5 && avgHesitation < 3000 && correctionRate < 0.1 && repeatAttemptRate < 0.08) {
      recommended = 'minimal';
      explanation = `Fast, low-friction interactions (${avgHesitation}ms avg dwell). Minimal guidance prevents interruptions.`;
    }

    return {
      totalEvents: total,
      realEventsCount,
      simulatedEventsCount,
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
    const thresholds = this.getThresholds();

    const bundle = {
      appName: 'G-SENSE',
      tagline: 'AdaptiveAssistant',
      meaning: 'G = Good; SENSE = learning interaction patterns',
      privacyGuarantee:
        '100% Client-Side. Zero raw text, zero keystroke logging, zero passwords, zero remote transmission without explicit user export.',
      exportedAt: new Date().toISOString(),
      thresholds,
      summary,
      assistanceStats: stats,
      totalEventsCount: events.length,
      realEventsCount: summary.realEventsCount,
      simulatedEventsCount: summary.simulatedEventsCount,
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
      realEventsCount: summary.realEventsCount,
      simulatedEventsCount: summary.simulatedEventsCount,
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
      return 'id,session_id,screen_id,component_type,event_type,attempt_count,hesitation_ms,is_correction,is_idle,is_simulation,timestamp\n';
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
      'is_simulation',
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
        e.isSimulation ? 'true' : 'false',
        new Date(e.timestamp).toISOString(),
      ].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  public clearAllData(): void {
    purgeLocalData();
    this.attemptMap.clear();
    this.navigationHistory = [];
    this.recentSuggestionTimestamps.clear();
    this.dismissedRuleKeys.clear();
    this.lastInteractionTime = Date.now();
    this.wasTabBackgrounded = false;
    this.notify();
  }
}

export const learningEngine = new GSenseBrowserEngine();
