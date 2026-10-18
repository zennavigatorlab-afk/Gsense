import React from 'react';
import { Calculator, ArrowRight, Shield, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (page: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Mathematical & Architectural Foundations
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
          How G-SENSE Learns Interaction Patterns
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          G-SENSE does not rely on opaque black-box deep learning or invasive tracking. We compute transparent, inspectable statistical metrics directly from interaction timings and UI friction points.
        </p>
      </div>

      {/* Step Sequence */}
      <div className="space-y-12">
        {/* Step 1: Permitted Interaction Ingestion */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white font-mono">
              01
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Interaction Signal Ingestion
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            When you interact with the software, G-SENSE intercepts client events at the application layer. The event payload contains strictly structural metadata:
          </p>
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto border border-slate-200 dark:border-slate-800">
            <pre>{`{
  "screen_id": "settings_view",
  "component_type": "save_button",
  "event_type": "repeat_attempt",
  "attempt_count": 3,
  "hesitation_ms": 8420,
  "is_correction": false,
  "timestamp": 1729238400000
}`}</pre>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <Shield className="h-4 w-4" />
            <span>Strict Privacy: No keystroke characters, form values, or passwords are ever captured.</span>
          </div>
        </div>

        {/* Step 2: Mathematical Formulations */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white font-mono">
              02
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Mathematical Metric Extraction
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hesitation Formula */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                Active Task Hesitation Dwell (D_task)
              </h3>
              <div className="font-mono text-xs bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 mb-2">
                D_task = (1 / N_active) * Σ (t_action - t_prev) [where dwell ≤ 30s]
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Measures the mean elapsed dwell duration across active interactions. Prolonged pauses (&gt;30s) or backgrounded browser tabs are classified as intentional idle time and excluded from task dwell.
              </p>
            </div>

            {/* Correction Rate */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                Correction Rate (C_r)
              </h3>
              <div className="font-mono text-xs bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 mb-2">
                C_r = N_corrections / N_total
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The proportion of events that represent input deletions, backtrack navigation, or error clears relative to total observed actions.
              </p>
            </div>

            {/* Repeat Attempt Rate */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                Retry Rate (R_r)
              </h3>
              <div className="font-mono text-xs bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 mb-2">
                R_r = N_retries(attempt ≥ 3) / N_total
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The frequency of rapid repeated attempts (3 or more consecutive tries) on the same control element before receiving completion feedback.
              </p>
            </div>

            {/* Sample Size & Data Maturity Indicator */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                Sample Maturity Indicator (S_m)
              </h3>
              <div className="font-mono text-xs bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 mb-2">
                S_m = min(1.0, N_total / 50)
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Empirical sample indicator: Tracks progression toward the target sample size of 50 events. Under 15 events is categorized as Sparse, 15 to 49 is Preliminary, and 50+ is a Mature Sample.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Adaptation Decision Matrix */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white font-mono">
              03
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Transparent Rule-Based Adaptation Matrix
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            G-SENSE uses transparent rule policies to select the appropriate assistance tier:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950 font-semibold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-4 border-b border-slate-200 dark:border-slate-800">Observed Metrics Condition</th>
                  <th className="py-2.5 px-4 border-b border-slate-200 dark:border-slate-800">Assistance Tier</th>
                  <th className="py-2.5 px-4 border-b border-slate-200 dark:border-slate-800">Interface Behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <td className="py-2.5 px-4 font-mono">D &gt; 8000ms OR R_r &gt; 0.20 OR C_r &gt; 0.25</td>
                  <td className="py-2.5 px-4 font-semibold text-blue-600 dark:text-blue-400">Step-by-Step</td>
                  <td className="py-2.5 px-4">Detailed numbered guidance sequence and expanded input checklists.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono">D &lt; 3500ms AND R_r &lt; 0.08 AND C_r &lt; 0.10</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">Minimal</td>
                  <td className="py-2.5 px-4">Fast-path mode: Non-blocking shortcuts, no proactive tips.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono">All default intermediate conditions</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">Hints Only</td>
                  <td className="py-2.5 px-4">Brief inline contextual tips triggered only on repeat attempts.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Ready to inspect your real interaction analysis?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Open the dashboard to view your live session metrics.
          </p>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
