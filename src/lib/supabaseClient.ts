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

export interface DeleteAccountResult {
  success: boolean;
  mode: 'supabase' | 'local';
  message: string;
  error?: string;
}

/**
 * Secure account deletion flow:
 * - If Supabase is configured and user is authenticated:
 *     1. Calls server-side /api/delete-account with verified session token
 *     2. Or invokes delete_user_account RPC / cascades user records via RLS
 *     3. Signs out of Supabase auth
 *     4. Wipes local cache
 *     5. Returns success: false if server deletion could not be completed
 * - If in local demo mode:
 *     Wipes local cache and reports local data removal
 */
export const deleteUserAccount = async (): Promise<DeleteAccountResult> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        return {
          success: false,
          mode: 'supabase',
          message: 'Failed to verify session for account deletion.',
          error: sessionError.message,
        };
      }

      if (!session || !session.user) {
        deleteLocalAccountAndData();
        return {
          success: true,
          mode: 'local',
          message: 'No active cloud session found. Local profile and browser records were permanently purged.',
        };
      }

      const userId = session.user.id;
      let serverDeleted = false;

      // 1. Try server-side deletion endpoint (/api/delete-account)
      try {
        const response = await fetch('/api/delete-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            serverDeleted = true;
          }
        }
      } catch {
        // Fallback to direct RPC or RLS deletes below
      }

      // 2. If server endpoint was unreachable, try Supabase RPC delete_user_account()
      if (!serverDeleted) {
        const { error: rpcError } = await supabase.rpc('delete_user_account');
        if (!rpcError) {
          serverDeleted = true;
        } else {
          // 3. Fall back to deleting user's associated records via RLS
          const [fb, ls, ev, pr, pf] = await Promise.all([
            supabase.from('assistance_feedback').delete().eq('user_id', userId),
            supabase.from('learning_summaries').delete().eq('user_id', userId),
            supabase.from('interaction_events').delete().eq('user_id', userId),
            supabase.from('user_preferences').delete().eq('user_id', userId),
            supabase.from('profiles').delete().eq('id', userId),
          ]);

          if (!fb.error && !ls.error && !ev.error && !pr.error && !pf.error) {
            serverDeleted = true;
          } else {
            const err = fb.error || ls.error || ev.error || pr.error || pf.error;
            return {
              success: false,
              mode: 'supabase',
              message: 'Failed to delete account records from Supabase database.',
              error: err?.message,
            };
          }
        }
      }

      // 4. Sign out and wipe local storage
      await supabase.auth.signOut().catch(() => {});
      deleteLocalAccountAndData();

      return {
        success: true,
        mode: 'supabase',
        message: 'Your Supabase account and all associated cloud interaction records have been permanently deleted.',
      };
    } catch (err: any) {
      return {
        success: false,
        mode: 'supabase',
        message: 'An unexpected error occurred during account deletion.',
        error: err?.message || String(err),
      };
    }
  }

  // Local fallback / demo mode
  deleteLocalAccountAndData();
  return {
    success: true,
    mode: 'local',
    message: 'Local profile, preferences, and all browser interaction patterns have been permanently wiped from this device.',
  };
};
