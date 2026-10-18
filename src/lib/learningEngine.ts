import {
  InteractionEvent,
  LearningSummary,
  AssistanceLevel,
  AdaptiveSuggestion,
  EventType,
} from '../types';
import {
  getLocalInteractionEvents,
  saveLocalInteractionEvent,
  purgeLocalData,
} from './supabaseClient';

export interface RecordOptions {
  sessionId: string;
  screenId: string;
  componentType: string;
  eventType: EventType;
  isCorrection?: boolean;
  userId?: string;
}

export class GSenseBrowserEngine {
  private lastInteractionTime: number = Date.now();
  private attemptMap: Map<string, number> = new Map();
  private isPaused: boolean = false;
  private currentAssistanceLevel: AssistanceLevel = 'hints_only';
  private hesitationThresholdMs: number = 8000;
  private repeatAttemptsTrigger: number = 3;

  constructor() {
    this.lastInteractionTime = Date.now();
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (!paused) {
      this.lastInteractionTime = Date.now();
    }
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public configureThresholds(hesitationMs: number, repeatTrigger: number, preferredLevel?: AssistanceLevel): void {
    this.hesitationThresholdMs = hesitationMs;
    this.repeatAttemptsTrigger = repeatTrigger;
    if (preferredLevel) {
      this.currentAssistanceLevel = preferredLevel;
    }
  }

  /**
   * Records a permitted interaction event.
   * Strict privacy invariant: Never records keystroke content, typed passwords, or input values.
   */
  public recordEvent(options: RecordOptions): {
    event: InteractionEvent | null;
    suggestion: AdaptiveSuggestion | null;
  } {
    if (this.isPaused) {
      return { event: null, suggestion: null };
    }

    const now = Date.now();
    const hesitationMs = Math.max(0, now - this.lastInteractionTime);
    this.lastInteractionTime = now;

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
      eventType: options.eventType,
      attemptCount: currentAttempt,
      hesitationMs,
      isCorrection: !!options.isCorrection,
      timestamp: now,
    };

    saveLocalInteractionEvent(event);

    // Evaluate transparent rule-based triggers
    const suggestion = this.evaluateImmediateAssistance(event, hesitationMs, currentAttempt);

    return { event, suggestion };
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
    attemptCount: number
  ): AdaptiveSuggestion | null {
    // 1. Trigger on repeat attempts (e.g. user retrying a button or form 3+ times)
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

    // 2. Trigger on prolonged hesitation
    if (hesitationMs >= this.hesitationThresholdMs && event.eventType !== 'action_success') {
      return {
        id: `sug_hesitation_${Date.now()}`,
        title: 'Helpful shortcut available',
        message: 'You have been on this step for a moment. Would you like a concise tip or shortcut?',
        level: 'hints_only',
        actionText: 'Show tip',
        triggerReason: `Hesitation dwell time exceeded (${Math.round(hesitationMs / 1000)}s pause)`,
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
   * Never generates fabricated statistics or claims emotional detection.
   */
  public computeSummary(): LearningSummary {
    const events = getLocalInteractionEvents();
    const total = events.length;

    if (total === 0) {
      return {
        totalEvents: 0,
        avgHesitationMs: 0,
        correctionRate: 0,
        repeatAttemptRate: 0,
        confidenceScore: 0,
        confidenceLabel: 'No interaction data recorded yet',
        recommendedAssistanceLevel: 'hints_only',
        explanation: 'No interaction events found. Start using the application to collect real usage metrics.',
        computedAt: new Date().toISOString(),
      };
    }

    const totalHesitation = events.reduce((sum, e) => sum + (e.hesitationMs || 0), 0);
    const avgHesitation = Math.round(totalHesitation / total);

    const corrections = events.filter((e) => e.isCorrection || e.eventType === 'correction').length;
    const correctionRate = parseFloat((corrections / total).toFixed(4));

    const repeats = events.filter((e) => (e.attemptCount || 1) >= this.repeatAttemptsTrigger).length;
    const repeatAttemptRate = parseFloat((repeats / total).toFixed(4));

    // Confidence is statistically bounded: n / 50 samples gives 100% (1.0) sample saturation
    const confidenceScore = parseFloat(Math.min(1.0, total / 50).toFixed(2));
    let confidenceLabel = 'Preliminary (Low sample count)';
    if (confidenceScore >= 0.7) {
      confidenceLabel = 'High confidence (Robust sample size)';
    } else if (confidenceScore >= 0.35) {
      confidenceLabel = 'Moderate (Sample size growing)';
    }

    // Transparent rule logic for recommendation
    let recommended: AssistanceLevel = 'hints_only';
    let explanation = 'Balanced interaction cadence observed. Contextual hints provide optimal support.';

    if (avgHesitation > this.hesitationThresholdMs || repeatAttemptRate > 0.2 || correctionRate > 0.25) {
      recommended = 'step_by_step';
      explanation = `Elevated hesitation (${avgHesitation}ms avg) or retry rate (${Math.round(
        repeatAttemptRate * 100
      )}%). Step-by-step guidance suggested.`;
    } else if (avgHesitation < 3000 && correctionRate < 0.1 && repeatAttemptRate < 0.08) {
      recommended = 'minimal';
      explanation = `Fast, low-friction interactions (${avgHesitation}ms avg dwell). Minimal guidance prevents interruptions.`;
    }

    return {
      totalEvents: total,
      avgHesitationMs: avgHesitation,
      correctionRate,
      repeatAttemptRate,
      confidenceScore,
      confidenceLabel,
      recommendedAssistanceLevel: recommended,
      explanation,
      computedAt: new Date().toISOString(),
    };
  }

  public exportEventsAsJson(): string {
    const events = getLocalInteractionEvents();
    return JSON.stringify(events, null, 2);
  }

  public exportEventsAsCsv(): string {
    const events = getLocalInteractionEvents();
    if (events.length === 0) return 'id,session_id,screen_id,component_type,event_type,attempt_count,hesitation_ms,is_correction,timestamp\n';
    
    const headers = ['id', 'session_id', 'screen_id', 'component_type', 'event_type', 'attempt_count', 'hesitation_ms', 'is_correction', 'timestamp'];
    const rows = events.map(e => [
      e.id,
      e.sessionId,
      e.screenId,
      e.componentType,
      e.eventType,
      e.attemptCount,
      e.hesitationMs,
      e.isCorrection ? 'true' : 'false',
      new Date(e.timestamp).toISOString()
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  public clearAllData(): void {
    purgeLocalData();
    this.attemptMap.clear();
    this.lastInteractionTime = Date.now();
  }
}

export const learningEngine = new GSenseBrowserEngine();
