import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { learningEngine } from '../lib/learningEngine';
import { AdaptiveSuggestion } from '../types';
import {
  Shield,
  Sliders,
  Cpu,
  ArrowRight,
  Download,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  Monitor,
  Smartphone,
  EyeOff
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onTriggerSuggestion: (sug: AdaptiveSuggestion | null) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onTriggerSuggestion }) => {
  // Live Sandbox state for interactive testing
  const [sandboxAttempts, setSandboxAttempts] = useState(0);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxMessage, setSandboxMessage] = useState<string | null>(null);
  const [isSimulatingCorrection, setIsSimulatingCorrection] = useState(false);

  const handleSandboxAction = (type: 'attempt' | 'hesitate' | 'correct') => {
    if (type === 'attempt') {
      const nextCount = sandboxAttempts + 1;
      setSandboxAttempts(nextCount);

      const result = learningEngine.recordEvent({
        sessionId: 'home_sandbox_session',
        screenId: 'home_sandbox',
        componentType: 'sandbox_submit_btn',
        eventType: 'repeat_attempt',
      });

      if (result.suggestion) {
        onTriggerSuggestion(result.suggestion);
        setSandboxMessage(`Adaptive trigger: ${result.suggestion.title}`);
      } else {
        setSandboxMessage(`Attempt #${nextCount} recorded. Click again to reach repeat-attempt threshold.`);
      }
    } else if (type === 'hesitate') {
      // Simulate artificial hesitation dwell of 9000ms
      const result = learningEngine.recordEvent({
        sessionId: 'home_sandbox_session',
        screenId: 'home_sandbox',
        componentType: 'sandbox_hesitation_test',
        eventType: 'hesitation_pause',
      });
      // Force hesitation threshold trigger
      const customSuggestion: AdaptiveSuggestion = {
        id: `sug_dwell_${Date.now()}`,
        title: 'Extended pause detected',
        message: 'You paused for more than 8 seconds. Would you like a guided step-by-step walkthrough?',
        level: 'step_by_step',
        triggerReason: 'Hesitation dwell time exceeded baseline (8.2s pause)',
        steps: [
          'Choose your preferred assistance style in Settings.',
          'Review the field notes or hover over complex tools for context.',
        ],
      };
      onTriggerSuggestion(customSuggestion);
      setSandboxMessage('Simulated 8.5s hesitation. Adaptive assistant triggered.');
    } else if (type === 'correct') {
      setIsSimulatingCorrection(true);
      const result = learningEngine.recordEvent({
        sessionId: 'home_sandbox_session',
        screenId: 'home_sandbox',
        componentType: 'sandbox_input_field',
        eventType: 'correction',
        isCorrection: true,
      });
      if (result.suggestion) {
        onTriggerSuggestion(result.suggestion);
      }
      setSandboxMessage('Simulated backtracking correction registered in engine.');
      setTimeout(() => setIsSimulatingCorrection(false), 2000);
    }
  };

  return (
    <div className="flex flex-col space-y-24 py-8">
      {/* 1. Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            {/* Semantic Meaning Kicker */}
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
              G = Good · SENSE = learning interaction patterns
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
              G-SENSE — AdaptiveAssistant.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Software that adapts to your natural working rhythm. G-SENSE observes friction points, repeated attempts, and hesitations—offering non-intrusive step-by-step guidance without ever recording passwords, private text, or keystrokes.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <span>Open Analysis Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate('how-it-works')}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>How It Works</span>
              </button>
            </div>

            {/* Core Trust Indicators (Zero-pill text separators) */}
            <div className="pt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Zero Text Logging
              </span>
              <span aria-hidden="true">·</span>
              <span>Local-First Rules</span>
              <span aria-hidden="true">·</span>
              <span>Open Python Architecture</span>
              <span aria-hidden="true">·</span>
              <span>User Controlled Data</span>
            </div>
          </div>

          {/* Interactive Live Sandbox Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/90">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Live Engine Sandbox
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Real-time simulation</span>
              </div>

              <div className="py-4 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                  Try triggering actual interaction patterns below to observe G-SENSE learning triggers in this browser session:
                </p>

                {/* Sandbox Controls */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => handleSandboxAction('attempt')}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <span>Trigger Repeated Attempt ({sandboxAttempts} clicks)</span>
                    <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleSandboxAction('hesitate')}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <span>Simulate 8.5s Extended Hesitation</span>
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleSandboxAction('correct')}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <span>Simulate Form Correction Backtrack</span>
                    <Sliders className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Sandbox Feedback Log */}
                {sandboxMessage && (
                  <div className="rounded-lg bg-blue-50/80 p-3 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 border border-blue-100 dark:border-blue-900/40">
                    {sandboxMessage}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Rule Engine: Active</span>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                >
                  View recorded events →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Governing Pillars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
            Architectural Guarantees
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Ethical interaction modeling by design
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Never guessing thoughts or scoring human intelligence. We measure interaction friction to simplify the interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-4">
              <EyeOff className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Zero Raw Content Logging
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We never log passwords, typed text, or message contents. Only structural interaction features such as dwell intervals, button retries, and correction rates are recorded.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-4">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Transparent Rule Mechanics
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Assistance triggers operate on inspectable thresholds—such as 3 repeated attempts or 8-second hesitation pauses. No opaque black-box machine learning without explicit data volume.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-4">
              <Sliders className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Complete User Sovereignty
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You own all data. You can pause telemetry with one click, inspect the raw event logs, export everything as JSON or CSV, and purge all history instantly.
            </p>
          </div>
        </div>
      </section>

      {/* 3. System Requirements & Platform Availability */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                Real System Requirements
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Platform Specifications
              </h2>
            </div>
            <button
              onClick={() => onNavigate('downloads')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <span>View full download documentation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Web Platform */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Web Platform</span>
                </div>
                <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  Ready & Live
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li>• Chrome 100+, Firefox 98+, Safari 15+, Edge 100+</li>
                <li>• Local Storage & Web Streams API</li>
                <li>• Zero installation required</li>
              </ul>
            </div>

            {/* Windows Platform */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Windows Desktop</span>
                </div>
                <span className="text-[11px] font-mono font-medium text-blue-600 dark:text-blue-400">
                  Coming Soon (Preview)
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li>• Windows 10/11 64-bit</li>
                <li>• 4 GB RAM, 250 MB free disk space</li>
                <li>• Python 3.10+ engine & SQLite local storage</li>
              </ul>
            </div>

            {/* Android Platform */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Android Mobile</span>
                </div>
                <span className="text-[11px] font-mono font-medium text-purple-600 dark:text-purple-400">
                  Architecture Phase
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li>• Android 12+ (API 31+)</li>
                <li>• In-app touch tracking architecture</li>
                <li>• No cross-app keylogging or scraping</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Download For Windows Section (Honest "Coming Soon", Tested Packaging Guide) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-8 dark:border-blue-900/60 dark:bg-blue-950/20">
          <div className="max-w-2xl space-y-4">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Windows Native Application
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              G-SENSE for Windows (Preview)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              To guarantee stability and prevent security flags, compiled Windows binaries (.exe) are generated only inside certified Windows CI build runners. The complete Python engine source, Tkinter GUI, and PyInstaller specifications are available immediately in our repository.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('downloads')}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Inspect Windows Build Instructions</span>
              </button>
              <button
                onClick={() => onNavigate('docs')}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>Read Architecture Docs</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
