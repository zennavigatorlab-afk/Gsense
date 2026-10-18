import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  Lock,
  EyeOff,
  Layers,
  ArrowRight
} from 'lucide-react';

interface FeaturesPageProps {
  onNavigate: (page: string) => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Capabilities & Invariants
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
          Personalized interaction assistance, without compromising privacy.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          G-SENSE transforms how software responds to humans. Instead of treating every user identically or tracking invasive text logs, G-SENSE models behavioral dynamics—pauses, repeated attempts, and backtracks—to adapt the UI in real-time.
        </p>
      </div>

      {/* 4 Feature Deep Dives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pillar 1: Non-Textual Pattern Recognition */}
        <div className="rounded-xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Cpu className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            1. Interaction Friction Detection
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The learning engine identifies non-verbal cues in your software interaction:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Hesitation Dwell:</strong> Extended pauses before interacting with a form element or submission trigger.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Repeat Retries:</strong> Consecutive taps or clicks on disabled, slow, or confusing controls.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Correction Loops:</strong> Rapid backtracks and input cancellations indicative of layout ambiguity.</span>
            </li>
          </ul>
        </div>

        {/* Pillar 2: Strict Privacy Boundary */}
        <div className="rounded-xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <EyeOff className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            2. Zero Raw Content Logging
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Unlike generative assistants that upload your sensitive documents, G-SENSE has a structural firewall:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Zero Keystroke Content:</strong> Passwords, search terms, and form inputs are never recorded or transmitted.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>No Screen Scraping:</strong> The engine does not OCR or inspect raw screen pixels.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Anonymous Feature Vectors:</strong> Data points consist purely of component identifiers, attempt counters, and durations.</span>
            </li>
          </ul>
        </div>

        {/* Pillar 3: Adaptive Guidance Spectrum */}
        <div className="rounded-xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Layers className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            3. Dynamic Assistance Spectrum
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Assistance adapts dynamically according to your proven comfort level:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Step-by-Step Mode:</strong> Numbered guidance and checklist sequences for complex, error-prone workflows.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Hints Only:</strong> Brief non-blocking tips triggered only when abnormal hesitation occurs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Minimal / Power-User:</strong> Completely silent interface with all automated prompts suppressed.</span>
            </li>
          </ul>
        </div>

        {/* Pillar 4: Statistical Rigor & Data Sovereignty */}
        <div className="rounded-xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Sliders className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            4. Transparent Calculations
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Every score and recommendation in G-SENSE has a verifiable mathematical origin:
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>No Invented Confidence:</strong> Predictions state explicit sample confidence levels (low, moderate, robust).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>One-Click Export:</strong> Export your complete event history as JSON or CSV at any time.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
              <span><strong>Permanent Purge:</strong> Zero retention lag when you choose to delete your data.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Inspect the algorithm in action
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore the mathematical formulations behind dwell times and repeat-attempt triggers.
          </p>
        </div>
        <button
          onClick={() => onNavigate('how-it-works')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
        >
          <span>Explore How It Works</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
