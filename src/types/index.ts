export type LearningStatus = 'active' | 'paused' | 'disabled';

export type AssistanceLevel = 'step_by_step' | 'hints_only' | 'minimal';

export type InteractionPace = 'relaxed' | 'standard' | 'fast';

export type EventType =
  | 'navigation'
  | 'repeat_attempt'
  | 'hesitation_pause'
  | 'correction'
  | 'action_success'
  | 'assistance_trigger';

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
  timestamp: number;
}

export interface LearningSummary {
  totalEvents: number;
  avgHesitationMs: number;
  correctionRate: number;
  repeatAttemptRate: number;
  confidenceScore: number; // 0.0 to 1.0 (statistical basis)
  confidenceLabel: string;
  recommendedAssistanceLevel: AssistanceLevel;
  explanation: string;
  computedAt: string;
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
