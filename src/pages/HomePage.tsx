import React, { useState, useEffect } from 'react';
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
  EyeOff,
  Navigation,
  Check,
  AlertCircle,
  Play,
  Pause,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onTriggerSuggestion: (sug: AdaptiveSuggestion | null) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onTriggerSuggestion }) => {
  // Live Sandbox state for real interactive testing
  const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3'>('step1');
  const [realClickCount, setRealClickCount] = useState(0);
  const [stepDwellSeconds, setStepDwellSeconds] = useState(0);
  const [sandboxMessage, setSandboxMessage] = useState<string | null>(null);
  const [recentTriggeredRule, setRecentTriggeredRule] = useState<string | null>(null);
  const [isEnginePaused, setIsEnginePaused] = useState<boolean>(learningEngine.getIsPaused());
  const [sandboxTab, setSandboxTab] = useState<'real' | 'simulation'>('real');

  // Track live active dwell on the current step
  useEffect(() => {
    setStepDwellSeconds(0);
    const interval = setInterval(() => {
      setStepDwellSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeStep]);

  // Synchronize pause state
  useEffect(() => {
    const unsub = learningEngine.subscribe(() => {
      setIsEnginePaused(learningEngine.getIsPaused());
    });
    return () => unsub();
  }, []);

  // 1. REAL INTERACTION: User clicks the interactive task action button
  const handleRealTaskClick = () => {
    if (isEnginePaused) {
      setSandboxMessage('Learning Engine is currently paused. Resume learning to record events.');
      return;
    }

    const nextCount = realClickCount + 1;
    setRealClickCount(nextCount);

    // Call actual engine recordEvent with REAL interaction telemetry (isSimulation: false)
    const result = learningEngine.recordEvent({
      sessionId: 'home_real_session',
      screenId: `home_sandbox_${activeStep}`,
      componentType: 'interactive_action_btn',
      eventType: nextCount >= 3 ? 'repeat_attempt' : 'action_success',
      isSimulation: false,
    });

    if (result.suggestion) {
      onTriggerSuggestion(result.suggestion);
      setRecentTriggeredRule(result.suggestion.triggerReason);
      setSandboxMessage(`Real interaction trigger fired: ${result.suggestion.title}`);
    } else {
      setSandboxMessage(
        `Real Click #${nextCount} recorded. (Threshold: 3 clicks within active window)`
      );
    }
  };

  // 2. REAL INTERACTION: User navigates steps and tests real backtracking
  const handleRealStepNavigate = (nextStep: 'step1' | 'step2' | 'step3') => {
    if (isEnginePaused) {
      setSandboxMessage('Learning Engine is paused.');
      return;
    }

    setActiveStep(nextStep);
    setRealClickCount(0);

    // Record real navigation in actual engine
    const result = learningEngine.recordEvent({
      sessionId: 'home_real_session',
      screenId: `sandbox_${nextStep}`,
      componentType: 'step_nav_button',
      eventType: 'navigation',
      isSimulation: false,
    });

    if (result.suggestion) {
      onTriggerSuggestion(result.suggestion);
      setRecentTriggeredRule(result.suggestion.triggerReason);
      setSandboxMessage(`Real Backtrack Triggered: Returned to ${nextStep}`);
    } else {
      setSandboxMessage(`Navigated to ${nextStep}. Rapid return back will trigger real backtrack analysis.`);
    }
  };

  // 3. REAL INTERACTION: Evaluate prolonged active dwell
  const handleTestRealPause = () => {
    if (isEnginePaused) {
      setSandboxMessage('Learning Engine is paused.');
      return;
    }

    const result = learningEngine.recordEvent({
      sessionId: 'home_real_session',
      screenId: `sandbox_${activeStep}`,
      componentType: 'dwell_zone',
      eventType: 'hesitation_pause',
      explicitHesitationMs: Math.max(stepDwellSeconds * 1000, 8500),
      isSimulation: false,
    });

    if (result.suggestion) {
      onTriggerSuggestion(result.suggestion);
      setRecentTriggeredRule(result.suggestion.triggerReason);
      setSandboxMessage(`Dwell threshold reached (${Math.max(stepDwellSeconds, 8.5)}s). Note: Pauses are natural and not assumed to mean confusion.`);
    } else {
      setSandboxMessage(`Dwell recorded (${stepDwellSeconds}s). Active threshold is 8s.`);
    }
  };

  // 4. SIMULATION SHORTCUTS (Clearly labeled as [Simulation])
  const handleSimulatedAction = (type: 'repeat' | 'pause' | 'backtrack') => {
    if (isEnginePaused) {
      setSandboxMessage('Learning Engine is paused. Resume to record events.');
      return;
    }

    if (type === 'repeat') {
      // Record 3 simulated attempts to meet the repeatAttemptsTrigger threshold
      learningEngine.recordEvent({
        sessionId: 'sim_session',
        screenId: 'sim_sandbox',
        componentType: 'sim_button',
        eventType: 'repeat_attempt',
        isSimulation: true,
      });
      learningEngine.recordEvent({
        sessionId: 'sim_session',
        screenId: 'sim_sandbox',
        componentType: 'sim_button',
        eventType: 'repeat_attempt',
        isSimulation: true,
      });
      const result = learningEngine.recordEvent({
        sessionId: 'sim_session',
        screenId: 'sim_sandbox',
        componentType: 'sim_button',
        eventType: 'repeat_attempt',
        isSimulation: true,
      });

      if (result.suggestion) {
        onTriggerSuggestion(result.suggestion);
        setRecentTriggeredRule(result.suggestion.triggerReason);
        setSandboxMessage('[Simulation] Triggered repeat attempt threshold (3 simulated clicks).');
      }
    } else if (type === 'pause') {
      const result = learningEngine.recordEvent({
        sessionId: 'sim_session',
        screenId: 'sim_sandbox_dwell',
        componentType: 'sim_pause_zone',
        eventType: 'hesitation_pause',
        explicitHesitationMs: 8500,
        isSimulation: true,
      });

      if (result.suggestion) {
        onTriggerSuggestion(result.suggestion);
        setRecentTriggeredRule(result.suggestion.triggerReason);
        setSandboxMessage('[Simulation] Simulated 8.5s active dwell. Adaptive shortcut offered.');
      }
    } else if (type === 'backtrack') {
      // Simulate rapid sequence: Page A -> Page B -> Page A
      learningEngine.recordEvent({
        sessionId: 'sim_session',
        screenId: 'sim_page_a',
        componentType: 'sim_nav',
        eventType: 'navigation',
        isSimulation: true,
      });
      learningEngine.recordEvent({
        sessionId: 'sim_session',
        screenId: 'sim_page_b',
        componentType: 'sim_nav',
        eventType: 'navigation',
        isSimulation: true,
      });
      const result = learningEngine.recordEvent({
        sessionId: 'sim_session',
        screenId: 'sim_page_a',
        componentType: 'sim_nav',
        eventType: 'navigation',
        isSimulation: true,
      });

      if (result.suggestion) {
        onTriggerSuggestion(result.suggestion);
        setRecentTriggeredRule(result.suggestion.triggerReason);
        setSandboxMessage('[Simulation] Rapid backtrack detected (sim_page_a → sim_page_b → sim_page_a).');
      }
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

            {/* Core Trust Indicators */}
            <div className="pt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Zero Text Logging
              </span>
              <span aria-hidden="true">·</span>
              <span>Local-First Rules</span>
              <span aria-hidden="true">·</span>
              <span>Open Architecture</span>
              <span aria-hidden="true">·</span>
              <span>User Sovereignty</span>
            </div>
          </div>

          {/* Interactive Live Sandbox Card (Connected to Real Engine) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/90 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Live Engine Sandbox
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isEnginePaused ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-[11px] font-mono text-slate-500">
                    {isEnginePaused ? 'Paused' : 'Active Engine'}
                  </span>
                </div>
              </div>

              {/* Mode Switcher: Real Interactions vs Simulation Shortcuts */}
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSandboxTab('real')}
                  className={`flex-1 py-1.5 px-2 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    sandboxTab === 'real'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Real Interactions</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSandboxTab('simulation')}
                  className={`flex-1 py-1.5 px-2 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    sandboxTab === 'simulation'
                      ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  <span>Simulation Shortcuts</span>
                </button>
              </div>

              {/* MODE 1: REAL INTERACTIONS */}
              {sandboxTab === 'real' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Interactive Task Workflow:
                      </span>
                      <span className="font-mono text-slate-500">
                        Dwell: {stepDwellSeconds}s (Threshold: 8s)
                      </span>
                    </div>

                    {/* Step Navigation */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRealStepNavigate('step1')}
                        className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors cursor-pointer text-center ${
                          activeStep === 'step1'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Step 1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRealStepNavigate('step2')}
                        className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors cursor-pointer text-center ${
                          activeStep === 'step2'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Step 2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRealStepNavigate('step3')}
                        className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors cursor-pointer text-center ${
                          activeStep === 'step3'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Step 3
                      </button>
                    </div>

                    {/* Step Content & Real Action Button */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRealTaskClick}
                        className="w-full flex items-center justify-between rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Click Task Action ({realClickCount} clicks)</span>
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <p className="text-[10px] text-slate-500">
                        Clicking 3 times in succession triggers the real repeat-attempt rule.
                      </p>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleTestRealPause}
                          className="flex-1 py-1.5 px-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-[11px] font-medium cursor-pointer"
                        >
                          Evaluate Dwell ({stepDwellSeconds}s)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeStep === 'step2') handleRealStepNavigate('step1');
                            else if (activeStep === 'step3') handleRealStepNavigate('step2');
                            else handleRealStepNavigate('step3');
                          }}
                          className="py-1.5 px-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-[11px] font-medium cursor-pointer flex items-center gap-1"
                        >
                          <Navigation className="h-3 w-3 rotate-180" />
                          <span>Backtrack</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: SIMULATION SHORTCUTS */}
              {sandboxTab === 'simulation' && (
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-200">
                    <strong>Simulated Shortcuts:</strong> Immediately triggers rule thresholds. Events are clearly flagged with an <code>isSimulation: true</code> badge in your logs.
                  </div>

                  <button
                    onClick={() => handleSimulatedAction('repeat')}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <span>[Simulate] 3x Repeated Struggle</span>
                    <RotateCcw className="h-3.5 w-3.5 text-purple-600" />
                  </button>

                  <button
                    onClick={() => handleSimulatedAction('pause')}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <span>[Simulate] 8.5s Active Task Dwell</span>
                    <Clock className="h-3.5 w-3.5 text-purple-600" />
                  </button>

                  <button
                    onClick={() => handleSimulatedAction('backtrack')}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <span>[Simulate] Rapid Backtrack (Page B → A)</span>
                    <Navigation className="h-3.5 w-3.5 text-purple-600" />
                  </button>
                </div>
              )}

              {/* Feedback Alert Log */}
              {sandboxMessage && (
                <div className="rounded-lg bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 p-2.5 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{sandboxMessage}</span>
                </div>
              )}

              {/* Footer link to inspect events */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Rule Engine: Connected</span>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Inspect events table</span>
                  <ArrowRight className="h-3 w-3" />
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
            Never guessing thoughts or scoring human emotions. We measure interaction friction to simplify the interface.
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
              Assistance triggers operate on inspectable thresholds—such as 3 repeated attempts or 8-second hesitation pauses. Pauses are never assumed to mean confusion.
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
                <span className="text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400">
                  CI Verification Pending
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <li>• Windows 10/11 64-bit</li>
                <li>• Target: GSense-AdaptiveAssistant.exe</li>
                <li>• Python engine & SQLite local storage</li>
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
                <li>• PWA live now; Native Kotlin architecture</li>
                <li>• In-app touch tracking architecture</li>
                <li>• Zero cross-app keylogging or scraping</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Windows Desktop Section */}
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
