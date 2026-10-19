import React, { useState } from 'react';
import { UserProfile, UserPreferences, AssistanceLevel, InteractionPace } from '../types';
import {
  saveLocalPreferences,
  saveLocalProfile,
  deleteUserAccount,
  isSupabaseConfigured,
  purgeLocalData
} from '../lib/supabaseClient';
import { learningEngine } from '../lib/learningEngine';
import {
  User,
  Sliders,
  Shield,
  Camera,
  Trash2,
  CheckCircle2,
  Save,
  LogOut,
  Download,
  AlertTriangle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';

interface ProfilePageProps {
  profile: UserProfile;
  preferences: UserPreferences;
  onUpdateProfile: (p: UserProfile) => void;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onSignOut: () => void;
  onNavigate: (page: string) => void;
  onOpenCameraModal: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  preferences,
  onUpdateProfile,
  onUpdatePreferences,
  onSignOut,
  onNavigate,
  onOpenCameraModal,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [assistanceLevel, setAssistanceLevel] = useState<AssistanceLevel>(preferences.assistanceLevel);
  const [interactionPace, setInteractionPace] = useState<InteractionPace>(preferences.interactionPace);
  const [hesitationThresholdMs, setHesitationThresholdMs] = useState(preferences.hesitationThresholdMs);
  const [repeatAttemptsTrigger, setRepeatAttemptsTrigger] = useState(preferences.repeatAttemptsTrigger);
  const [learningStatus, setLearningStatus] = useState(profile.learningStatus);
  const [autoSuggestionsEnabled, setAutoSuggestionsEnabled] = useState(
    typeof preferences.autoSuggestionsEnabled === 'boolean'
      ? preferences.autoSuggestionsEnabled
      : learningEngine.getAutoSuggestionsEnabled()
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProfile: UserProfile = {
      ...profile,
      displayName,
      learningStatus,
    };
    saveLocalProfile(updatedProfile);
    onUpdateProfile(updatedProfile);

    const updatedPrefs: UserPreferences = {
      ...preferences,
      assistanceLevel,
      interactionPace,
      hesitationThresholdMs,
      repeatAttemptsTrigger,
      autoSuggestionsEnabled,
      updatedAt: new Date().toISOString(),
    };
    saveLocalPreferences(updatedPrefs);
    onUpdatePreferences(updatedPrefs);

    // Update engine runtime thresholds
    learningEngine.configureThresholds(
      hesitationThresholdMs,
      repeatAttemptsTrigger,
      assistanceLevel,
      undefined,
      undefined,
      autoSuggestionsEnabled
    );
    learningEngine.setPaused(learningStatus === 'paused');
    learningEngine.setAutoSuggestionsEnabled(autoSuggestionsEnabled);

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleExportData = () => {
    const data = learningEngine.exportEventsAsJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsense_profile_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteNotice(null);

    if (
      !window.confirm(
        'Confirm Account Deletion:\nAre you sure you want to permanently delete your profile, preferences, and all collected interaction patterns? This action cannot be reversed.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteUserAccount();
      if (!result.success) {
        setDeleteError(result.error || result.message || 'Failed to complete server-side account deletion.');
        setIsDeleting(false);
        return;
      }

      learningEngine.clearAllData();
      setDeleteNotice(result.message);
      setTimeout(() => {
        onSignOut();
        onNavigate('home');
      }, 1500);
    } catch (err: any) {
      setDeleteError(err?.message || 'An unexpected error occurred during account deletion.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              User Profile &amp; Adaptation Preferences
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {profile.email} · Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Backend & Cloud Sync Architecture Status */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4.5 dark:border-slate-800 dark:bg-slate-900/60 text-xs space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">
            Storage &amp; Cloud Sync Architecture
          </span>
          {isSupabaseConfigured() ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Supabase Cloud Sync Active
            </span>
          ) : (
            <span className="font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
              Local-First / Demo Mode (No Cloud Sync)
            </span>
          )}
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {isSupabaseConfigured()
            ? 'Your profile and adaptation preferences sync securely to Supabase using Row-Level Security. Interaction events are calculated locally in your browser first; only structural telemetry syncs to your personal cloud record. Sensitive inputs are never captured.'
            : 'G-SENSE is operating in local-first demo mode. Your profile, custom thresholds, and interaction pattern logs remain strictly on this device in browser localStorage and do NOT sync across devices or to any remote server.'}
        </p>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{deleteError}</span>
        </div>
      )}

      {deleteNotice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{deleteNotice}</span>
        </div>
      )}

      {savedNotice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Profile and adaptive assistance preferences saved successfully!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Identity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Identity Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Registered Email (Read Only)
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Adaptive Assistance Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Assistance Style Preferences
            </h2>
          </div>

          {/* Assistance Level Segmented Choices */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Assistance Guidance Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'step_by_step',
                  title: 'Step-by-Step',
                  desc: 'Numbered checklists & explicit instructions on complex tasks.',
                },
                {
                  id: 'hints_only',
                  title: 'Hints Only',
                  desc: 'Unobtrusive contextual hints triggered after retries or hesitation.',
                },
                {
                  id: 'minimal',
                  title: 'Minimal / Silent',
                  desc: 'Power-user mode: no proactive prompts or guides.',
                },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setAssistanceLevel(item.id as AssistanceLevel)}
                  className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    assistanceLevel === item.id
                      ? 'border-blue-600 bg-blue-50/60 text-slate-900 dark:border-blue-400 dark:bg-blue-950/40 dark:text-white ring-1 ring-blue-600 dark:ring-blue-400'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-xs mb-1">{item.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interaction Pace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hesitation Threshold ({hesitationThresholdMs / 1000} seconds)
              </label>
              <input
                type="range"
                min="2000"
                max="20000"
                step="1000"
                value={hesitationThresholdMs}
                onChange={(e) => setHesitationThresholdMs(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Fast (2s)</span>
                <span>Standard (8s)</span>
                <span>Patient (20s)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Repeat Attempt Trigger ({repeatAttemptsTrigger} consecutive tries)
              </label>
              <input
                type="range"
                min="2"
                max="6"
                step="1"
                value={repeatAttemptsTrigger}
                onChange={(e) => setRepeatAttemptsTrigger(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>2 attempts</span>
                <span>3 (standard)</span>
                <span>6 attempts</span>
              </div>
            </div>
          </div>

          {/* Camera Sensing Toggle */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Optional Camera Presence Sensing</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Privacy-first local canvas pixel motion estimation. Never saves video. Disabled by default.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCameraModal}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Configure Camera
            </button>
          </div>

          {/* Automatic Guidance Toggle */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Automatic Guidance Suggestions
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {autoSuggestionsEnabled
                  ? 'Non-intrusive contextual hints appear automatically when interaction friction rules trigger.'
                  : 'Automatic popups are disabled. You can still inspect patterns manually in the Dashboard.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoSuggestionsEnabled(!autoSuggestionsEnabled)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                autoSuggestionsEnabled
                  ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <span>{autoSuggestionsEnabled ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>

          {/* Learning Status Switch */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Interaction Learning Engine State
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {learningStatus === 'active'
                  ? 'Currently collecting interaction friction telemetry.'
                  : 'Engine paused: no interactions are being recorded.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLearningStatus(learningStatus === 'active' ? 'paused' : 'active')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                learningStatus === 'active'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              {learningStatus === 'active' ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-amber-600" />
                  <span>Pause Learning</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Activate Learning</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Submit Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Section 3: Data Sovereignty & Account Deletion */}
      <div className="rounded-xl border border-rose-200 bg-white p-6 dark:border-rose-950/60 dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <Trash2 className="h-4 w-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Data Portability & Account Purge
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          You hold exclusive ownership of your records. You may export all stored interaction patterns as JSON or permanently wipe your account and all telemetry records.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Interaction History (JSON)</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Account & Erase All Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
