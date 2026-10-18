import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  UserProfile,
  UserPreferences,
  InteractionEvent,
  AssistanceFeedback,
  OfferedTipRecord,
} from '../types';

const getEnvVar = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-supabase-project') || supabaseAnonKey.includes('placeholder')) {
    return false;
  }
  return true;
};

// Initialize client if credentials are provided
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Local Fallback Storage Keys for offline / local-first storage
const LOCAL_PROFILE_KEY = 'gsense_local_profile';
const LOCAL_PREFS_KEY = 'gsense_local_prefs';
const LOCAL_EVENTS_KEY = 'gsense_local_events';
const LOCAL_FEEDBACK_KEY = 'gsense_local_feedback';
const LOCAL_OFFERED_TIPS_KEY = 'gsense_local_offered_tips';

export const getLocalProfile = (): UserProfile => {
  const cached = localStorage.getItem(LOCAL_PROFILE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  const defaultProfile: UserProfile = {
    id: 'local_user_' + Math.random().toString(36).substring(2, 9),
    email: 'user@example.com',
    displayName: 'Local User',
    learningStatus: 'active',
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(defaultProfile));
  return defaultProfile;
};

export const saveLocalProfile = (profile: UserProfile): void => {
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
};

export const getLocalPreferences = (userId: string): UserPreferences => {
  const cached = localStorage.getItem(LOCAL_PREFS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  const defaultPrefs: UserPreferences = {
    userId,
    assistanceLevel: 'hints_only',
    interactionPace: 'standard',
    hesitationThresholdMs: 8000,
    repeatAttemptsTrigger: 3,
    cameraSensingEnabled: false,
    theme: 'system',
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(defaultPrefs));
  return defaultPrefs;
};

export const saveLocalPreferences = (prefs: UserPreferences): void => {
  localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));
};

export const getLocalInteractionEvents = (): InteractionEvent[] => {
  const cached = localStorage.getItem(LOCAL_EVENTS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return [];
};

export const saveLocalInteractionEvent = (event: InteractionEvent): void => {
  const events = getLocalInteractionEvents();
  events.push(event);
  // Keep last 1500 events locally to prevent browser storage overload
  if (events.length > 1500) {
    events.splice(0, events.length - 1500);
  }
  localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events));
};

export const getLocalOfferedTips = (): OfferedTipRecord[] => {
  const cached = localStorage.getItem(LOCAL_OFFERED_TIPS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return [];
};

export const saveLocalOfferedTip = (tip: OfferedTipRecord): void => {
  const tips = getLocalOfferedTips();
  const existingIdx = tips.findIndex((t) => t.id === tip.id);
  if (existingIdx >= 0) {
    tips[existingIdx] = { ...tips[existingIdx], ...tip };
  } else {
    tips.push(tip);
  }
  if (tips.length > 500) {
    tips.splice(0, tips.length - 500);
  }
  localStorage.setItem(LOCAL_OFFERED_TIPS_KEY, JSON.stringify(tips));
};

export const updateLocalOfferedTipFeedback = (
  promptId: string,
  status: 'accepted' | 'dismissed' | 'unhelpful',
  wasHelpful?: boolean
): void => {
  const tips = getLocalOfferedTips();
  // Find the most recent tip matching this promptId
  for (let i = tips.length - 1; i >= 0; i--) {
    if (tips[i].promptId === promptId || tips[i].id === promptId) {
      tips[i].status = status;
      tips[i].wasHelpful = wasHelpful;
      break;
    }
  }
  localStorage.setItem(LOCAL_OFFERED_TIPS_KEY, JSON.stringify(tips));
};

export const getLocalFeedback = (): AssistanceFeedback[] => {
  const cached = localStorage.getItem(LOCAL_FEEDBACK_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return [];
};

export const saveLocalFeedback = (fb: AssistanceFeedback): void => {
  const all = getLocalFeedback();
  all.push(fb);
  localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(all));
};

export const purgeLocalData = (): void => {
  localStorage.removeItem(LOCAL_EVENTS_KEY);
  localStorage.removeItem(LOCAL_FEEDBACK_KEY);
  localStorage.removeItem(LOCAL_OFFERED_TIPS_KEY);
};

export const deleteLocalAccountAndData = (): void => {
  localStorage.removeItem(LOCAL_PROFILE_KEY);
  localStorage.removeItem(LOCAL_PREFS_KEY);
  localStorage.removeItem(LOCAL_EVENTS_KEY);
  localStorage.removeItem(LOCAL_FEEDBACK_KEY);
  localStorage.removeItem(LOCAL_OFFERED_TIPS_KEY);
};
