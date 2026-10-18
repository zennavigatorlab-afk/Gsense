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
  ChevronUp
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
  const [showFormulas, setShowFormulas] = useState<boolean>(true);
  const [activeFormulaDetail, setActiveFormulaDetail] = useState<string | null>(null);

  const refreshData = () => {
    setSummary(learningEngine.computeSummary());
    setEvents(getLocalInteractionEvents());
    setAssistanceStats(learningEngine.getAssistanceStats());
    setIsPaused(learningEngine.getIsPaused());
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
  };

  const handlePurge = () => {
    if (
      window.confirm(
        'Permanently delete all recorded interaction events, guidance tips offered, and feedback records?'
      )
    ) {
      learningEngine.clearAllData();
      refreshData();
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
  };

  const handleSimulateQuickEvent = (
    type: 'nav' | 'repeat' | 'hesitation' | 'correction' | 'idle'
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
      });
    } else if (type === 'repeat') {
      learningEngine.recordEvent({
        sessionId: 'dashboard_sim_session',
        screenId: 'dashboard',
        componentType: 'action_button',
        eventType: 'repeat_attempt',
      });
    } else if (type === 'hesitation') {
      learningEngine.recordEvent({
        sessionId: 'dashboard_sim_session',
        screenId: 'dashboard',
        componentType: 'form_selector',
        eventType: 'hesitation_pause',
      });
    } else if (type === 'correction') {
      learningEngine.recordEvent({
        sessionId: 'dashboard_sim_session',
        screenId: 'dashboard',
        componentType: 'input_field',
        eventType: 'correction',
        isCorrection: true,
      });
    } else if (type === 'idle') {
      learningEngine.recordEvent({
        sessionId: 'dashboard_sim_session',
        screenId: 'dashboard',
        componentType: 'background_window',
        eventType: 'idle_pause',
      });
    }
    refreshData();
  };

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
            onClick={handleExportJson}
            disabled={events.length === 0 && assistanceStats.totalOffered === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Export complete session analysis bundle as JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON Bundle</span>
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

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Observed Events */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Observed Events</span>
            <Database className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.totalEvents}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {summary.activeTaskEvents} active · {summary.totalIdleIntervals} idle pauses
          </div>
        </div>

        {/* Avg Task Hesitation Dwell (Excludes Idle) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Task Hesitation Dwell</span>
            <button
              onClick={() => setActiveFormulaDetail('hesitation')}
              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              title="View formula"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.avgHesitationMs} <span className="text-sm font-sans font-normal text-slate-400">ms</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Active pause before action (&le;30s)
          </div>
        </div>

        {/* Correction Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Correction Rate</span>
            <button
              onClick={() => setActiveFormulaDetail('correction')}
              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              title="View formula"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {(summary.correctionRate * 100).toFixed(1)} <span className="text-sm font-sans font-normal text-slate-400">%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Ratio of backtracks to total inputs
          </div>
        </div>

        {/* Sample Size & Data Maturity (Explicit Sample Indicator, not arbitrary percentage) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Sample Maturity</span>
            <button
              onClick={() => setActiveFormulaDetail('sample_size')}
              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              title="View formula"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.sampleSize} <span className="text-sm font-sans font-normal text-slate-400">/ 50</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate" title={summary.sampleStatusLabel}>
            {summary.sampleSize >= 50
              ? 'Mature empirical sample (50+)'
              : summary.sampleSize >= 15
              ? 'Preliminary sample (15-49)'
              : 'Sparse (under 15 events)'}
          </div>
        </div>
      </div>

      {/* Assistance Guidance Tips & User Feedback Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assistance Guidance Tips & Acceptance Feedback
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every guidance tip actually displayed is logged below with real user Yes/No feedback responses.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
          {/* Total Tips Actually Displayed */}
          <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">
              Total Tips Offered
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {assistanceStats.totalOffered}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Every displayed prompt</span>
          </div>

          {/* Feedback Responses Submitted */}
          <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">
              Feedback Submitted
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {assistanceStats.feedbackSubmittedCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {assistanceStats.helpfulCount} Yes · {assistanceStats.unhelpfulCount} No
            </span>
          </div>

          {/* Acceptance Rate (Submitted Feedback) */}
          <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">
              Helpful Feedback Rate
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {assistanceStats.acceptanceRateSubmitted}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Helpful / Submitted Feedback</span>
          </div>

          {/* Acceptance Rate (Total Offered) */}
          <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block mb-1">
              Overall Tip Acceptance
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
              {assistanceStats.acceptanceRateOffered}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Helpful / Total Offered</span>
          </div>
        </div>
      </div>

      {/* Exact Formulas & Methodology Section */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <button
          onClick={() => setShowFormulas(!showFormulas)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Exact Formulas & Metric Definitions
            </span>
          </div>
          {showFormulas ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {showFormulas && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40">
            {/* Formula 1: Task Hesitation */}
            <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="font-bold text-slate-900 dark:text-white">
                1. Average Task Hesitation Dwell
              </div>
              <div className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                Avg Hesitation = (1 / N_active) * &Sigma; (Dwell_i)
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                <strong>Active task dwell only:</strong> Computes the arithmetic mean over interactions where dwell duration &le; 30,000ms and the browser window was active. Pauses &gt; 30s or when the browser tab is hidden/blurred are classified as intentional idle time and excluded from the task hesitation mean.
              </p>
            </div>

            {/* Formula 2: Correction Rate */}
            <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="font-bold text-slate-900 dark:text-white">
                2. Correction Rate
              </div>
              <div className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                Correction Rate = N_corrections / N_total
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                The exact ratio of backtracking events (input deletions, cancellation navigation, clear actions) to the total observed events count N. High rates indicate ambiguity in form field layout or unclear step directions.
              </p>
            </div>

            {/* Formula 3: Retry / Repeat Attempt Rate */}
            <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="font-bold text-slate-900 dark:text-white">
                3. Retry Rate (Repeat Attempt Rate)
              </div>
              <div className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                Retry Rate = N_retries(attempt &ge; 3) / N_total
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                The percentage of actions where the user clicked or submitted the same target component 3 or more consecutive times before receiving a successful outcome state.
              </p>
            </div>

            {/* Formula 4: Sample Maturity */}
            <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="font-bold text-slate-900 dark:text-white">
                4. Sample Size & Data Maturity Indicator
              </div>
              <div className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
                Sample Maturity = min(1.0, N_total / 50)
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                <strong>Sample Sufficiency, not a fabricated percentage:</strong> Measures observed sample count N against the empirical threshold of 50 actions. Under 15 events is categorized as <em>Sparse</em>, 15 to 49 is <em>Preliminary</em>, and 50+ is <em>Mature Sample</em>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current Recommended Adaptation */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              Engine Adaptation Assessment
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Current Recommendation:{' '}
              <span className="text-blue-600 dark:text-blue-400 capitalize">
                {summary.recommendedAssistanceLevel.replace('_', ' ')}
              </span>
            </h3>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Computed: <span className="font-mono">{new Date(summary.computedAt).toLocaleTimeString()}</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
          {summary.explanation}
        </p>
      </div>

      {/* Raw Event Log */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Observed Event Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest interaction events stored in local browser memory.
            </p>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 mr-1">Simulate event:</span>
            <button
              onClick={() => handleSimulateQuickEvent('nav')}
              className="rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              + Nav Action
            </button>
            <button
              onClick={() => handleSimulateQuickEvent('repeat')}
              className="rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              + Retry
            </button>
            <button
              onClick={() => handleSimulateQuickEvent('correction')}
              className="rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              + Correction
            </button>
            <button
              onClick={() => handleSimulateQuickEvent('idle')}
              className="rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              + Idle Pause
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No interaction events recorded yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              To respect your privacy, G-SENSE only records interaction events while active. You can navigate through the app or use the simulation buttons above to record your first real interaction event.
            </p>
            <button
              onClick={() => handleSimulateQuickEvent('nav')}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
            >
              Log First Interaction Event
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Screen / Component</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4 text-right">Attempt #</th>
                  <th className="py-2.5 px-4 text-right">Dwell Time</th>
                  <th className="py-2.5 px-4 text-center">Type Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {events.slice(-15).reverse().map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
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
                      {evt.isIdle ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Idle Pause</span>
                      ) : evt.isCorrection ? (
                        <span className="text-rose-600 dark:text-rose-400 font-medium">Correction</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">Task Dwell</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
