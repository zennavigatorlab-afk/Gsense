import React, { useState } from 'react';
import { learningEngine } from '../lib/learningEngine';
import { deleteLocalAccountAndData, purgeLocalData } from '../lib/supabaseClient';
import {
  ShieldCheck,
  EyeOff,
  Trash2,
  Download,
  AlertOctagon,
  CheckCircle2,
  Lock,
  Pause,
  Play
} from 'lucide-react';

interface PrivacyPageProps {
  onNavigate: (page: string) => void;
  onSignOut?: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate, onSignOut }) => {
  const [isPaused, setIsPaused] = useState<boolean>(learningEngine.getIsPaused());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleTogglePause = () => {
    const next = !isPaused;
    learningEngine.setPaused(next);
    setIsPaused(next);
    setStatusMessage(
      next
        ? 'Interaction learning is now paused. No events will be recorded.'
        : 'Interaction learning resumed.'
    );
  };

  const handleExportJson = () => {
    const data = learningEngine.exportEventsAsJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsense_privacy_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Exported all recorded interaction data as JSON.');
  };

  const handlePurgeHistory = () => {
    if (window.confirm('Delete all recorded interaction history from local storage?')) {
      learningEngine.clearAllData();
      purgeLocalData();
      setStatusMessage('All local interaction history has been permanently wiped.');
    }
  };

  const handleDeleteAll = () => {
    if (
      window.confirm(
        'PERMANENT ACCOUNT & DATA DELETION:\nAre you sure you want to delete your profile, preferences, and all recorded interaction telemetry?'
      )
    ) {
      learningEngine.clearAllData();
      deleteLocalAccountAndData();
      if (onSignOut) {
        onSignOut();
      }
      setStatusMessage('Account and all associated records have been completely purged.');
      setTimeout(() => {
        onNavigate('home');
      }, 1500);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Trust, Transparency & Compliance
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
          Privacy Policy & Data Sovereignty
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          G-SENSE is architected around a fundamental principle: software can learn to assist you without spying on what you type, read, or think.
        </p>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs font-medium text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Comparison: What We Never Record vs What We Record */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* NEVER */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-6 dark:border-rose-950/60 dark:bg-rose-950/20 space-y-4">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <EyeOff className="h-5 w-5" />
            <h2 className="text-base font-bold uppercase tracking-wider">
              What G-SENSE Never Records
            </h2>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li>• <strong>Passwords & Credentials:</strong> We never capture form text fields or password characters.</li>
            <li>• <strong>Personal Messages & Keystrokes:</strong> No keylogging, clipboard access, or document text extraction.</li>
            <li>• <strong>Cross-App Surveillance:</strong> Scoped strictly within permitted G-SENSE boundaries.</li>
            <li>• <strong>Biometric Identity or Emotion Guessing:</strong> No facial recognition or psychic emotional inference.</li>
          </ul>
        </div>

        {/* PERMITTED FEATURES */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 dark:border-emerald-950/60 dark:bg-emerald-950/20 space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-base font-bold uppercase tracking-wider">
              What G-SENSE Permittedly Observes
            </h2>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li>• <strong>Navigation Events:</strong> Screen transitions and component IDs.</li>
            <li>• <strong>Hesitation Timers:</strong> Milliseconds elapsed between user clicks to detect friction.</li>
            <li>• <strong>Repeat Attempts:</strong> Consecutive retries on specific buttons or form submissions.</li>
            <li>• <strong>Correction Signals:</strong> Backtrack actions to estimate layout clarity.</li>
          </ul>
        </div>
      </div>

      {/* Interactive Sovereignty Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Your Privacy Controls
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Execute real data sovereignty actions directly on your session data:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pause / Resume */}
          <button
            onClick={handleTogglePause}
            className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between ${
              isPaused
                ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Learning Status</span>
              {isPaused ? <Play className="h-4 w-4 text-amber-600" /> : <Pause className="h-4 w-4 text-slate-500" />}
            </div>
            <div className="text-sm font-semibold">{isPaused ? 'Resume Learning' : 'Pause Learning'}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {isPaused ? 'Currently inactive' : 'Active and collecting'}
            </div>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-left transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Data Portability</span>
              <Download className="h-4 w-4 text-slate-500" />
            </div>
            <div className="text-sm font-semibold">Export JSON File</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Download your complete event history
            </div>
          </button>

          {/* Purge Interactions */}
          <button
            onClick={handlePurgeHistory}
            className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-left transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Telemetry Wipe</span>
              <Trash2 className="h-4 w-4 text-slate-500" />
            </div>
            <div className="text-sm font-semibold">Purge Interaction Logs</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Clear all events while keeping profile
            </div>
          </button>

          {/* Delete Account */}
          <button
            onClick={handleDeleteAll}
            className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-left transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Account Deletion</span>
              <AlertOctagon className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              Delete Account & All Data
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
              Permanent irreversible purge
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
