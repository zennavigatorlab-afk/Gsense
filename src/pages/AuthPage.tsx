import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, saveLocalProfile } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (profile: UserProfile) => void;
  onNavigate: (page: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, onNavigate }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const supabaseActive = isSupabaseConfigured();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setIsLoading(true);

    if (supabaseActive && supabase) {
      try {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: displayName || email.split('@')[0] },
            },
          });
          if (error) throw error;
          if (data.user) {
            setInfoMsg('Account created successfully! Check your email to confirm if required, or sign in.');
            const profile: UserProfile = {
              id: data.user.id,
              email: data.user.email || email,
              displayName: displayName || email.split('@')[0],
              learningStatus: 'active',
              createdAt: new Date().toISOString(),
            };
            onAuthSuccess(profile);
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            const profile: UserProfile = {
              id: data.user.id,
              email: data.user.email || email,
              displayName: data.user.user_metadata?.full_name || email.split('@')[0],
              learningStatus: 'active',
              createdAt: new Date().toISOString(),
            };
            onAuthSuccess(profile);
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local fallback mode when Supabase credentials are pending in .env
      setTimeout(() => {
        const localProfile: UserProfile = {
          id: 'user_' + Math.random().toString(36).substring(2, 9),
          email: email.trim(),
          displayName: displayName.trim() || email.split('@')[0],
          learningStatus: 'active',
          createdAt: new Date().toISOString(),
        };
        saveLocalProfile(localProfile);
        setIsLoading(false);
        onAuthSuccess(localProfile);
      }, 400);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    if (supabaseActive && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      } catch (err: any) {
        setErrorMsg(err.message || 'Google authentication encountered an error.');
      }
    } else {
      // Quick local simulated Google session for offline preview
      const googleProfile: UserProfile = {
        id: 'google_user_' + Math.random().toString(36).substring(2, 9),
        email: 'user.google@example.com',
        displayName: 'Google User',
        avatarUrl: undefined,
        learningStatus: 'active',
        createdAt: new Date().toISOString(),
      };
      saveLocalProfile(googleProfile);
      onAuthSuccess(googleProfile);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {isSignUp ? 'Create your G-SENSE Account' : 'Sign in to G-SENSE'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Supabase Auth with secure Row-Level Security
          </p>
        </div>

        {/* Supabase Status Tag */}
        <div className="mb-6 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Backend state:</span>
          {supabaseActive ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Supabase Connected
            </span>
          ) : (
            <span className="font-mono text-slate-600 dark:text-slate-300">
              Local Dev Mode (Offline Safe)
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer mb-5 shadow-xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative bg-white px-2 text-[11px] uppercase tracking-wider text-slate-400 dark:bg-slate-900">
            or with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle sign in / sign up */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setIsSignUp(false)}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to G-SENSE?{' '}
              <button
                onClick={() => setIsSignUp(true)}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
