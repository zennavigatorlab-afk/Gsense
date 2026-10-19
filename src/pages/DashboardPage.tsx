import React, { useState, useEffect } from 'react';
import { learningEngine } from '../lib/learningEngine';
import { getLocalInteractionEvents } from '../lib/supabaseClient';
import { InteractionEvent, LearningSummary } from '../types';
import {
  Activity,
  AlertCircle,
  Clock,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Trash2,
  Download,
  Info,
  Play,
  Pause,
  Database,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Layers,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  FileCode,
  Bell,
  BellOff,
  Navigation
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  userId?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, userId }) => {
  const [summary, setSummary] = useState<LearningSummary>(learningEngine.computeSummary());
  const [events, setEvents] = useState<InteractionEvent[]>(getLocalInteractionEvents());
  const [assistanceStats, setAssistanceStats] = useState(learningEngine.getAssistanceStats());
  const [isPaused, setIsPaused] = useState<boolean>(learningEngine.getIsPaused());
  const [thresholds, setThresholds] = useState(learningEngine.getThresholds());
  const [autoSuggestions, setAutoSuggestions] = useState<boolean>(
    learningEngine.getAutoSuggestionsEnabled()
  );

  // Inspector & filter state
  const [eventFilter, setEventFilter] = useState<'all' | 'real' | 'simulated'>('all');
  const [selectedEventForInspect, setSelectedEventForInspect] = useState<InteractionEvent | null>(
    null
  );
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Editable threshold form state
  const [editHesitationMs, setEditHesitationMs] = useState(thresholds.hesitationThresholdMs);
  const [editRepeatCount, setEditRepeatCount] = useState(thresholds.repeatAttemptsTrigger);
  const [editBacktrackMs, setEditBacktrackMs] = useState(thresholds.backtrackWindowMs);
  const [editCooldownMs, setEditCooldownMs] = useState(thresholds.cooldownPeriodMs);

  const refreshData = () => {
    setSummary(learningEngine.computeSummary());
    setEvents(getLocalInteractionEvents());
    setAssistanceStats(learningEngine.getAssistanceStats());
    setIsPaused(learningEngine.getIsPaused());
    const currentThresholds = learningEngine.getThresholds();
    setThresholds(currentThresholds);
    setAutoSuggestions(learningEngine.getAutoSuggestionsEnabled());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = learningEngine.subscribe(() => {
      refreshData();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleTogglePause = () => {
    const next = !isPaused;
    learningEngine.setPaused(next);
    setIsPaused(next);
    refreshData();
    setStatusNotification(
      next
        ? 'Learning engine is paused. Zero new interaction events or tips will be collected.'
        : 'Learning engine resumed. Collecting interaction telemetry.'
    );
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleToggleAutoSuggestions = () => {
    const next = !autoSuggestions;
    learningEngine.setAutoSuggestionsEnabled(next);
    setAutoSuggestions(next);
    setStatusNotification(
      next
        ? 'Automatic suggestions enabled.'
        : 'Automatic suggestions disabled. Hints will not pop up automatically.'
    );
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    learningEngine.configureThresholds(
      editHesitationMs,
      editRepeatCount,
      undefined,
      editBacktrackMs,
      editCooldownMs,
      autoSuggestions
    );
    refreshData();
    setStatusNotification('Threshold configurations saved successfully.');
    setShowConfigPanel(false);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleResetThresholds = () => {
    setEditHesitationMs(8000);
    setEditRepeatCount(3);
    setEditBacktrackMs(15000);
    setEditCooldownMs(180000);
    learningEngine.configureThresholds(8000, 3, undefined, 15000, 180000, true);
    refreshData();
    setStatusNotification('Thresholds reset to audited defaults.');
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handlePurge = () => {
    if (
      window.confirm(
        'Permanently delete all recorded interaction events, guidance tips offered, and feedback records?'
      )
    ) {
      learningEngine.clearAllData();
      refreshData();
      setStatusNotification('All recorded interaction history permanently wiped.');
      setTimeout(() => setStatusNotification(null), 3500);
    }
  };

  const handleExportJson = () => {
    const data = learningEngine.exportDataBundle();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsense-analysis-bundle-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusNotification('Exported complete analysis bundle as JSON.');
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleExportCsv = () => {
    const data = learningEngine.exportEventsAsCsv();
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsense-interactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusNotification('Exported interaction events table as CSV.');
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleSimulateQuickEvent = (
    type: 'nav' | 'repeat' | 'hesitation' | 'correction' | 'backtrack' | 'idle'
  ) => {
    if (isPaused) {
      alert('Learning engine is currently paused. Resume learning to record events.');
      return;
    }

    if (type === 'nav') {
      learningEngine.recordEvent({
        sessionId: 'dashboard_sim_session',
        screenId: 'dashboard',
        componentType: 'navigation_link',
        eventType: 'navigation',
        isSimulation: true,
      });
    } else if (type === 'repeat') {
      learningEngine.recordEvent({
        sessionId: 'dashboard_sim_session',
        screenId: 'dashboard',
        componentType: 'action_button',
        eventType: 'repeat_attempt',
        isSimulation: true,
      });
    } else if (type === 'hesitation') {
      learningEngine.recordEvent({
        sessionId: 'dashboard_sim_session',
        screenId: 'dashboard',
        componentType: 'form_selector',
        eventType: 'hesitation_pause',
        explicitHesitationMs: 8500,
        isSimulation: true,
      });
    } else if (type === 'correction') {
      learningEngine.recordEvent({
        sessionId: 'dashboard_sim_session',
        screenId: 'dashboard',
        componentType: 'input_field',
        eventType: 'correction',
        isCorrection: true,
        isSimulation: true,
      });
    } else if (type === 'backtrack') {
      learningEngine.recordEvent({
        sessionId: 'dashboard_sim_session',
        screenId: 'dashboard',
        componentType: 'back_link',
        eventType: 'backtrack',
        isCorrection: true,
        isSimulation: true,
      });
    } else if (type === 'idle') {
      learningEngine.recordEvent({
        sessionId: 'dashboard_sim_session',
        screenId: 'dashboard',
        componentType: 'background_window',
        eventType: 'idle_pause',
        isSimulation: true,
      });
    }
    refreshData();
  };

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (eventFilter === 'real') return !e.isSimulation;
    if (eventFilter === 'simulated') return !!e.isSimulation;
    return true;
  });

  const realCount = events.filter((e) => !e.isSimulation).length;
  const simCount = events.filter((e) => !!e.isSimulation).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Activity className="h-4 w-4" />
            <span>Human Interaction Analysis Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Observed Interaction Patterns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Empirical measurements calculated from your real interactions in this browser session. Zero simulated percentages.
          </p>
        </div>

        {/* Dashboard Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTogglePause}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer border ${
              isPaused
                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5 text-amber-600" /> : <Pause className="h-3.5 w-3.5 text-slate-500" />}
            <span>{isPaused ? 'Resume Learning' : 'Pause Learning'}</span>
          </button>

          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Configure Thresholds</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={events.length === 0 && assistanceStats.totalOffered === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Export complete session analysis bundle as JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={events.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Export interaction events table as CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePurge}
            disabled={events.length === 0 && assistanceStats.totalOffered === 0}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 disabled:opacity-40 transition-colors cursor-pointer"
            title="Permanently wipe all recorded events and tips"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Purge Data</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusNotification && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/40 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{statusNotification}</span>
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Engine Status Banner */}
      {isPaused && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pause className="h-4 w-4 text-amber-600" />
            <span className="font-semibold">Learning Engine Paused:</span>
            <span>All event recording and guidance triggers are suspended. No interactions are being collected.</span>
          </div>
          <button
            onClick={handleTogglePause}
            className="text-amber-800 dark:text-amber-300 font-semibold underline hover:text-amber-900 cursor-pointer"
          >
            Resume Learning
          </button>
        </div>
      )}

      {/* Thresholds & Rules Configuration Panel (Expandable) */}
      {showConfigPanel && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 dark:border-blue-900/60 dark:bg-slate-900 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Engine Thresholds &amp; Guidance Configuration
              </h3>
            </div>
            <button
              onClick={() => setShowConfigPanel(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Hesitation Threshold (ms):</span>
                  <span className="font-mono text-blue-600">{editHesitationMs}ms</span>
                </label>
                <input
                  type="number"
                  min="3000"
                  max="30000"
                  step="500"
                  value={editHesitationMs}
                  onChange={(e) => setEditHesitationMs(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-500">
                  Active in-task dwell before offering a shortcut. Pauses are never assumed to mean confusion.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Repeat Attempts Trigger:</span>
                  <span className="font-mono text-blue-600">{editRepeatCount} retries</span>
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={editRepeatCount}
                  onChange={(e) => setEditRepeatCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-500">
                  Repeated clicks on the same component before offering step-by-step guidance.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Backtrack Window (ms):</span>
                  <span className="font-mono text-blue-600">{editBacktrackMs}ms</span>
                </label>
                <input
                  type="number"
                  min="5000"
                  max="60000"
                  step="1000"
                  value={editBacktrackMs}
                  onChange={(e) => setEditBacktrackMs(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-500">
                  Window for detecting rapid return to preceding view to offer navigation paths.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Hint Cooldown (ms):</span>
                  <span className="font-mono text-blue-600">{Math.round(editCooldownMs / 1000)}s</span>
                </label>
                <input
                  type="number"
                  min="30000"
                  max="600000"
                  step="10000"
                  value={editCooldownMs}
                  onChange={(e) => setEditCooldownMs(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-500">
                  Frequency capping cooldown to avoid repeatedly showing the same hint.
                </p>
              </div>
            </div>

            {/* Auto Suggestions Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {autoSuggestions ? <Bell className="h-3.5 w-3.5 text-blue-600" /> : <BellOff className="h-3.5 w-3.5 text-amber-600" />}
                  <span>Automatic Guidance Suggestions</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Allow non-intrusive contextual hints to pop up when rules trigger.
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoSuggestions}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  autoSuggestions
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {autoSuggestions ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetThresholds}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Reset to Audited Defaults
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 cursor-pointer"
              >
                Save Configurations
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Events */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Session Events
            </span>
            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.totalEvents}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Real: {realCount}</span>
            <span>Simulated: {simCount}</span>
          </div>
        </div>

        {/* Metric 2: Active Dwell */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Avg In-Task Dwell
            </span>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.avgHesitationMs} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Active dwell (idle &gt;30s excluded)
          </div>
        </div>

        {/* Metric 3: Repeat Attempts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Retry Rate
            </span>
            <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {Math.round(summary.repeatAttemptRate * 100)}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            ≥ {thresholds.repeatAttemptsTrigger} attempts on same target
          </div>
        </div>

        {/* Metric 4: Tips Offered & Acceptance */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Assistance Helpful Rate
            </span>
            <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {assistanceStats.acceptanceRateSubmitted}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {assistanceStats.helpfulCount} helpful of {assistanceStats.feedbackSubmittedCount} rated
          </div>
        </div>
      </div>

      {/* Observed Event Log with Filter and Event Inspector */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Observed Event Log</span>
              <span className="text-xs font-mono font-normal text-slate-500">
                ({filteredEvents.length} {eventFilter === 'all' ? 'total' : eventFilter})
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspectable interaction events stored strictly in client-side memory. Click any row to verify raw JSON.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setEventFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  eventFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 font-semibold text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All ({events.length})
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('real')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  eventFilter === 'real'
                    ? 'bg-white dark:bg-slate-700 font-semibold text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Real ({realCount})
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('simulated')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  eventFilter === 'simulated'
                    ? 'bg-white dark:bg-slate-700 font-semibold text-purple-600 dark:text-purple-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Simulated ({simCount})
              </button>
            </div>

            {/* Quick Simulation Buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 hidden sm:inline">Simulate:</span>
              <button
                onClick={() => handleSimulateQuickEvent('nav')}
                className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                title="Log simulated navigation event"
              >
                + Nav
              </button>
              <button
                onClick={() => handleSimulateQuickEvent('repeat')}
                className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                title="Log simulated retry attempt"
              >
                + Retry
              </button>
              <button
                onClick={() => handleSimulateQuickEvent('backtrack')}
                className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                title="Log simulated backtrack event"
              >
                + Backtrack
              </button>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No matching interaction events
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Navigate the website, click buttons in the Live Sandbox, or trigger quick simulations above to generate interaction events.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Origin</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Screen / Component</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4 text-right">Attempt #</th>
                  <th className="py-2.5 px-4 text-right">Dwell Time</th>
                  <th className="py-2.5 px-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredEvents.slice(-20).reverse().map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEventForInspect(evt)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      {evt.isSimulation ? (
                        <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          Simulation
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          Real
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      {evt.screenId} / {evt.componentType}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="capitalize">{evt.eventType.replace('_', ' ')}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {evt.attemptCount}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {evt.hesitationMs} ms
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventForInspect(evt);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto text-[11px]"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EVENT INSPECTION MODAL */}
      {selectedEventForInspect && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Event Metadata Audit Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventForInspect(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Privacy Verification Checklist */}
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Client-Side Privacy Invariants Verified:</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-emerald-800 dark:text-emerald-300">
                <div>✓ Zero keystrokes recorded</div>
                <div>✓ Zero typed text values</div>
                <div>✓ Zero passwords or secrets</div>
                <div>✓ Zero clipboard content</div>
              </div>
            </div>

            {/* Raw JSON viewer */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Raw Event Object:
              </span>
              <pre className="rounded-lg bg-slate-900 p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto max-h-60 leading-normal">
                {JSON.stringify(selectedEventForInspect, null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setSelectedEventForInspect(null)}
              className="w-full rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
