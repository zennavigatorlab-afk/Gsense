import React, { useState, useEffect } from 'react';
import { learningEngine } from '../lib/learningEngine';
import { getLocalFeedback, getLocalInteractionEvents } from '../lib/supabaseClient';
import { InteractionEvent, LearningSummary, AssistanceFeedback } from '../types';
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
  Database
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  userId?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, userId }) => {
  const [summary, setSummary] = useState<LearningSummary>(learningEngine.computeSummary());
  const [events, setEvents] = useState<InteractionEvent[]>(getLocalInteractionEvents());
  const [feedbackList, setFeedbackList] = useState<AssistanceFeedback[]>(getLocalFeedback());
  const [isPaused, setIsPaused] = useState<boolean>(learningEngine.getIsPaused());
  const [showFormulaModal, setShowFormulaModal] = useState<string | null>(null);

  const refreshData = () => {
    setSummary(learningEngine.computeSummary());
    setEvents(getLocalInteractionEvents());
    setFeedbackList(getLocalFeedback());
    setIsPaused(learningEngine.getIsPaused());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleTogglePause = () => {
    const next = !isPaused;
    learningEngine.setPaused(next);
    setIsPaused(next);
  };

  const handlePurge = () => {
    if (window.confirm('Are you sure you want to permanently delete all recorded interaction data?')) {
      learningEngine.clearAllData();
      refreshData();
    }
  };

  const handleExportJson = () => {
    const data = learningEngine.exportEventsAsJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsense-interactions-${Date.now()}.json`;
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

  const handleSimulateQuickEvent = (type: 'nav' | 'repeat' | 'hesitation' | 'correction') => {
    if (type === 'nav') {
      learningEngine.recordEvent({
        sessionId: 'manual_dashboard_session',
        screenId: 'dashboard',
        componentType: 'quick_nav_test',
        eventType: 'navigation',
      });
    } else if (type === 'repeat') {
      learningEngine.recordEvent({
        sessionId: 'manual_dashboard_session',
        screenId: 'dashboard',
        componentType: 'button_retry',
        eventType: 'repeat_attempt',
      });
    } else if (type === 'hesitation') {
      learningEngine.recordEvent({
        sessionId: 'manual_dashboard_session',
        screenId: 'dashboard',
        componentType: 'timer_dwell',
        eventType: 'hesitation_pause',
      });
    } else if (type === 'correction') {
      learningEngine.recordEvent({
        sessionId: 'manual_dashboard_session',
        screenId: 'dashboard',
        componentType: 'input_field',
        eventType: 'correction',
        isCorrection: true,
      });
    }
    refreshData();
  };

  const helpfulCount = feedbackList.filter((f) => f.wasHelpful).length;
  const unhelpfulCount = feedbackList.filter((f) => !f.wasHelpful).length;
  const totalFeedback = feedbackList.length;
  const acceptanceRate =
    totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0;

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
                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5 text-amber-600" /> : <Pause className="h-3.5 w-3.5 text-slate-500" />}
            <span>{isPaused ? 'Resume Learning' : 'Pause Learning'}</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={events.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={events.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePurge}
            disabled={events.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Purge Data</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Observed Events</span>
            <Database className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.totalEvents}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Real in-app interactions recorded
          </div>
        </div>

        {/* Avg Hesitation Dwell */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Avg Hesitation Dwell</span>
            <button
              onClick={() => setShowFormulaModal('hesitation')}
              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="View calculation formula"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.avgHesitationMs} <span className="text-sm font-sans font-normal text-slate-400">ms</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Pause between consecutive actions
          </div>
        </div>

        {/* Correction Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Correction Rate</span>
            <button
              onClick={() => setShowFormulaModal('correction')}
              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="View calculation formula"
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

        {/* Statistical Confidence */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Statistical Confidence</span>
            <button
              onClick={() => setShowFormulaModal('confidence')}
              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="View calculation formula"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {(summary.confidenceScore * 100).toFixed(0)} <span className="text-sm font-sans font-normal text-slate-400">%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {summary.confidenceLabel}
          </div>
        </div>
      </div>

      {/* Formula Explanation Callout if opened */}
      {showFormulaModal && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 dark:text-blue-200">
              {showFormulaModal === 'hesitation' && 'Calculation: Hesitation Dwell (ms)'}
              {showFormulaModal === 'correction' && 'Calculation: Correction Rate'}
              {showFormulaModal === 'confidence' && 'Calculation: Statistical Confidence Score'}
            </span>
            <button
              onClick={() => setShowFormulaModal(null)}
              className="text-blue-700 dark:text-blue-300 hover:underline font-medium"
            >
              Close
            </button>
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            {showFormulaModal === 'hesitation' &&
              'Calculated as the arithmetic mean: Σ(time_since_last_action) / N. Reflects natural reading and decision dwell time.'}
            {showFormulaModal === 'correction' &&
              'Calculated as: (Total corrections & backtracks) / N. High values indicate confusing instructions or UI friction.'}
            {showFormulaModal === 'confidence' &&
              'Calculated as: min(1.0, N / 50). Empirically requires at least 50 real events before model predictions stabilize into high confidence.'}
          </p>
        </div>
      )}

      {/* Recommended Assistance Engine Evaluation */}
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

        {/* User Assistance Feedback Metrics */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Total Assistance Tips Offered</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {totalFeedback}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Helpful Confirmations</span>
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {helpfulCount}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">User Acceptance Rate</span>
            <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
              {acceptanceRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Raw Event Log or Empty State */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Observed Event Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing the latest interaction events stored in local browser memory.
            </p>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 mr-1">Simulate event:</span>
            <button
              onClick={() => handleSimulateQuickEvent('nav')}
              className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              + Navigation
            </button>
            <button
              onClick={() => handleSimulateQuickEvent('repeat')}
              className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              + Retry
            </button>
            <button
              onClick={() => handleSimulateQuickEvent('correction')}
              className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              + Correction
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
                  <th className="py-2.5 px-4 text-center">Correction</th>
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
                      {evt.isCorrection ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Yes</span>
                      ) : (
                        <span className="text-slate-400">-</span>
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
