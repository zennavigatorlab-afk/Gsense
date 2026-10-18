export type LearningStatus = 'active' | 'paused' | 'disabled';

export type AssistanceLevel = 'step_by_step' | 'hints_only' | 'minimal';

export type InteractionPace = 'relaxed' | 'standard' | 'fast';

export type EventType =
  | 'navigation'
  | 'repeat_attempt'
  | 'hesitation_pause'
  | 'correction'
  | 'action_success'
  | 'assistance_trigger'
  | 'idle_pause';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  learningStatus: LearningStatus;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  assistanceLevel: AssistanceLevel;
  interactionPace: InteractionPace;
  hesitationThresholdMs: number;
  repeatAttemptsTrigger: number;
  cameraSensingEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  updatedAt: string;
}

export interface InteractionEvent {
  id: string;
  userId?: string;
  sessionId: string;
  screenId: string;
  componentType: string;
  eventType: EventType;
  attemptCount: number;
  hesitationMs: number;
  isCorrection: boolean;
  isIdle: boolean; // true if elapsed time exceeded active threshold or tab was inactive
  timestamp: number;
}

export interface LearningSummary {
  totalEvents: number;
  activeTaskEvents: number;
  avgHesitationMs: number; // Excludes idle time (>30s or inactive tab)
  totalIdleIntervals: number;
  correctionRate: number; // (corrections / totalEvents)
  repeatAttemptRate: number; // (retries / totalEvents)
  sampleSize: number; // raw N
  sampleTarget: number; // target N = 50 for mature baseline
  sampleSufficiencyRatio: number; // N / 50 capped at 1.0
  sampleStatusLabel: string; // 'Sparse (Under 15 events)', 'Preliminary (15-49 events)', 'Mature Sample (50+ events)'
  recommendedAssistanceLevel: AssistanceLevel;
  explanation: string;
  computedAt: string;
}

export interface OfferedTipRecord {
  id: string;
  promptId: string;
  title: string;
  triggerReason: string;
  screenId: string;
  offeredAt: string;
  status: 'displayed' | 'accepted' | 'dismissed' | 'unhelpful';
  wasHelpful?: boolean;
}

export interface AssistanceFeedback {
  id: string;
  userId?: string;
  promptId: string;
  screenId: string;
  triggerReason: string;
  wasHelpful: boolean;
  userComment?: string;
  createdAt: string;
}

export interface AdaptiveSuggestion {
  id: string;
  title: string;
  message: string;
  level: AssistanceLevel;
  actionText?: string;
  steps?: string[];
  triggerReason: string;
}
