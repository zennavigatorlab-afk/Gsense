import React, { useState, useEffect } from 'react';
import {
  Brain,
  Shield,
  Smartphone,
  Eye,
  Activity,
  Download,
  Trash2,
  Pause,
  Play,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Layers,
  Fingerprint,
  Radio,
  Clock,
  Compass,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { learningEngine } from '../lib/learningEngine';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface ResearchPageProps {
  onNavigate: (page: string) => void;
  userId?: string;
}

export const ResearchPage: React.FC<ResearchPageProps> = ({
  onNavigate,
  userId = 'research_participant',
}) => {
  const [researchConsent, setResearchConsent] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gsense_research_consent') === 'true';
    }
    return false;
  });

  const [isPaused, setIsPaused] = useState<boolean>(() => learningEngine.getIsPaused());
  const [metrics, setMetrics] = useState(() => learningEngine.computeMetrics());
  const [simulationLog, setSimulationLog] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'trigger' | 'privacy' }>>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      text: 'Research telemetry engine initialized. All events scoped strictly to local session memory.',
      type: 'info',
    },
  ]);

  // Dwell simulation state
  const [dwellActive, setDwellActive] = useState(false);
  const [dwellProgress, setDwellProgress] = useState(0);
  const [clickCount, setClickCount] = useState(0);

  // Subscribe to engine state
  useEffect(() => {
    const unsub = learningEngine.subscribe(() => {
      setMetrics(learningEngine.computeMetrics());
      setIsPaused(learningEngine.getIsPaused());
    });
    return () => unsub();
  }, []);

  const handleToggleConsent = (enabled: boolean) => {
    setResearchConsent(enabled);
    localStorage.setItem('gsense_research_consent', enabled ? 'true' : 'false');
    if (!enabled) {
      learningEngine.setPaused(true);
      setIsPaused(true);
      addLog('Research interaction telemetry disabled by participant.', 'privacy');
    } else {
      learningEngine.setPaused(false);
      setIsPaused(false);
      addLog('Participant consent granted. Local-first pattern detection active.', 'info');
    }
  };

  const handleTogglePause = () => {
    const next = !isPaused;
    learningEngine.setPaused(next);
    setIsPaused(next);
    addLog(next ? 'Telemetry paused. Incoming interaction events will be ignored.' : 'Telemetry resumed.', 'info');
  };

  const addLog = (text: string, type: 'info' | 'trigger' | 'privacy') => {
    setSimulationLog((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toLocaleTimeString(),
        text,
        type,
      },
      ...prev.slice(0, 19),
    ]);
  };

  const handleExportData = () => {
    const bundle = learningEngine.exportDataBundle();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(typeof bundle === 'string' ? bundle : JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gsense_research_telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog('Exported local research bundle as JSON.', 'info');
  };

  const handlePurgeData = () => {
    if (window.confirm('Purge all locally stored interaction events and reset metrics? This action is irreversible.')) {
      learningEngine.purgeAllData();
      setMetrics(learningEngine.computeMetrics());
      setClickCount(0);
      addLog('Local telemetry storage completely wiped (0 events remaining).', 'privacy');
    }
  };

  // Direction A Simulator Actions
  const handleSimulateRepeatedClicks = () => {
    if (!researchConsent || isPaused) {
      addLog('Action dropped: Research telemetry is paused or requires consent.', 'privacy');
      return;
    }
    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    const result = learningEngine.recordEvent({
      sessionId: 'research_session_' + userId,
      screenId: 'research_playground',
      componentType: 'sample_action_btn',
      eventType: 'repeat_attempt',
      userId,
    });

    if (result.suggestion) {
      addLog(`[Heuristic Trigger] Repeated attempt cluster detected: "${result.suggestion.title}"`, 'trigger');
    } else {
      addLog(`Recorded interaction event (${nextCount} in sequence). Dwell: ${result.event?.hesitationMs || 0}ms.`, 'info');
    }
  };

  // Direction C Dwell Activation Simulator
  const handleDwellMouseDown = () => {
    if (!researchConsent || isPaused) return;
    setDwellActive(true);
    setDwellProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / 800) * 100));
      setDwellProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setDwellActive(false);
        addLog('[Direction C] Micro-dwell threshold satisfied (800ms intentional hold). Action committed without physical click strike.', 'trigger');
      }
    }, 40);

    const stopDwell = () => {
      clearInterval(interval);
      setDwellActive(false);
      setDwellProgress(0);
      window.removeEventListener('mouseup', stopDwell);
      window.removeEventListener('touchend', stopDwell);
    };

    window.addEventListener('mouseup', stopDwell);
    window.addEventListener('touchend', stopDwell);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Header Section */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            <Brain className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            HCI Research Foundation
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Local-First & Peer-Grounded
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Adaptive Interaction Research
        </h1>
        <p className="mt-3 max-w-4xl text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          G-SENSE explores non-semantic interaction signals to infer cognitive hesitation, detect task friction, and evaluate alternative human-computer communication paradigms. In strict accordance with user privacy, zero keystrokes, passwords, clipboard data, or cross-app inputs are ever monitored.
        </p>
      </div>

      {/* Research Consent & Control Console */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Participant Consent & Local Telemetry Governance
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              All interaction tracking is strictly opt-in, stored only in your local browser runtime, and never transmitted to external servers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={researchConsent}
                onChange={(e) => handleToggleConsent(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {researchConsent ? 'Research Telemetry: Opted-In' : 'Research Telemetry: Opted-Out'}
              </span>
            </label>
          </div>
        </div>

        {/* Live Controls and Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Local Events</span>
            <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {metrics.totalEvents}
            </div>
            <span className="text-[10px] text-slate-500">In-memory telemetry log</span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Assistance Tips Offered</span>
            <div className="mt-1 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {metrics.totalOffered}
            </div>
            <span className="text-[10px] text-slate-500">Rule triggers generated</span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Engine State</span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${isPaused || !researchConsent ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {!researchConsent ? 'Disabled' : isPaused ? 'Paused' : 'Active'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Opt-in adherence</span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Sample Maturity</span>
            <div className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={metrics.maturityTier}>
              {metrics.sampleSize} / 50
            </div>
            <span className="text-[10px] text-slate-500">{metrics.maturityTier.split(' ')[0]} tier</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTogglePause}
              disabled={!researchConsent}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                !researchConsent
                  ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                  : isPaused
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                  : 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'
              }`}
            >
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              <span>{isPaused ? 'Resume Telemetry' : 'Pause Telemetry'}</span>
            </button>

            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Local JSON</span>
            </button>

            <button
              onClick={handlePurgeData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete All Data</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Strict privacy invariant: Zero keystrokes, zero text inputs, zero server uploads</span>
          </div>
        </div>
      </div>

      {/* THREE RESEARCH DIRECTIONS */}
      <div className="space-y-10">
        {/* DIRECTION A */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Direction A — Intra-App Behavioral Signal Detection
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Repeated Attempts, Navigation Flow, and Cognitive Pauses
              </h2>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
              Active Heuristic Model
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>Research Thesis:</strong> User friction in graphical user interfaces manifests as temporal anomalies—clustering of rapid repeated clicks on identical elements, excessive dwell hesitation before commitment actions, and rapid cyclical navigation between views. These can be accurately quantified without reading any semantic input values or typed text.
              </p>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-xs">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Prior-Art Foundations (Not Claimed as Novel):</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                  <li>
                    <strong>Card, Moran, & Newell (1983)</strong> — <em>The Keystroke-Level Model (KLM/GOMS)</em>: Identifies cognitive mental preparation pauses (Operator <em>M</em>, ~1.35s) prior to routine human execution steps.
                  </li>
                  <li>
                    <strong>Horvitz et al. (1998)</strong> — <em>The Lumière Project</em> (Microsoft Research): Inferring user intent and assistance needs using temporal pause distributions and repeated failed attempts.
                  </li>
                  <li>
                    <strong>Fitts (1954)</strong> — <em>Fitts&apos; Law</em>: Rapid repeated corrective strikes correlate directly with target acquisition difficulty and motor interface misalignments.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Concrete G-SENSE Heuristic Thresholds:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-white block">Repeated Strikes</span>
                    <span className="text-[11px] text-slate-500">≥ 3 activations on same target within 5.0s</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-white block">Cognitive Hesitation</span>
                    <span className="text-[11px] text-slate-500">&gt; 4,000ms active dwell before action</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-white block">Idle Separation</span>
                    <span className="text-[11px] text-slate-500">≥ 30.0s pauses classified as idle (no false alarm)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Live Playground */}
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-5 dark:border-blue-900/60 dark:bg-blue-950/20 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Interactive Signal Playground
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Client-Side Runtime</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                  Test intra-app interaction heuristics live. Trigger rapid repeated clicks or pauses to observe real-time classification.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleSimulateRepeatedClicks}
                    disabled={!researchConsent || isPaused}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-3 text-xs font-bold hover:bg-blue-700 transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Click Rapidly to Trigger Repeated-Attempt Rule ({clickCount} clicks)</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!researchConsent || isPaused) return;
                        addLog('Simulated intentional idle timeout (&gt;30s pause). Preserved dwell isolation.', 'info');
                      }}
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      Simulate Idle Pause (&gt;30s)
                    </button>
                    <button
                      onClick={() => {
                        if (!researchConsent || isPaused) return;
                        addLog('Simulated navigation loop (Dashboard -&gt; Docs -&gt; Dashboard in 4s).', 'trigger');
                      }}
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      Simulate Backtracking Loop
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulation Log Stream */}
              <div className="rounded-lg bg-slate-900 text-slate-100 p-3 text-[11px] font-mono max-h-40 overflow-y-auto space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                  Live Event Feed
                </div>
                {simulationLog.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-tight">
                    <span className="text-slate-500 shrink-0">{log.time}</span>
                    <span
                      className={
                        log.type === 'trigger'
                          ? 'text-amber-300 font-semibold'
                          : log.type === 'privacy'
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DIRECTION B */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Direction B — Mobile Sensor &amp; Runtime Boundaries
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Permitted, Consent-Based Android Interaction Signals
              </h2>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
              Sandbox &amp; Privacy Strict
            </span>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              <strong>The Architecture Boundary:</strong> Many mobile tracking tools achieve cross-application monitoring by abusing Android&apos;s <code>AccessibilityService</code> API or requesting elevated device-management permissions. This permits reading third-party text, stealing clipboard items, and logging passwords. <strong>G-SENSE categorically rejects cross-app snooping</strong>. All mobile and PWA telemetry is restricted to the host application sandbox.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Permitted, Non-Intrusive Mobile Web Signals (Standard APIs)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li>
                    <strong>Screen Orientation API:</strong> Adapting reachability layouts dynamically between one-handed portrait thumb zones and two-handed landscape surfaces without tracking motion sensors.
                  </li>
                  <li>
                    <strong>Page Visibility API (<code>document.visibilityState</code>):</strong> Pausing cognitive dwell timers the instant the user switches tabs or locks their phone to eliminate false latency spikes.
                  </li>
                  <li>
                    <strong>Vibration API (<code>navigator.vibrate</code>):</strong> Providing non-visual micro-haptic pulses (e.g. 15ms) on touch boundaries to assist users with motor tremor.
                  </li>
                  <li>
                    <strong>Network Information API (<code>saveData</code>):</strong> Honoring low-bandwidth preferences by compressing offline cache payloads automatically.
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-800 dark:text-red-300 text-xs">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span>Explicitly Banned &amp; Excluded Methods</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li>
                    <strong>Zero Cross-App Monitoring:</strong> No global Android Accessibility scrapers, no overlay windows, no notification listeners.
                  </li>
                  <li>
                    <strong>Zero Keystroke / Text Scraping:</strong> No reading of soft keyboard buffers, search queries, or form inputs.
                  </li>
                  <li>
                    <strong>Zero Clipboard Access:</strong> No programmatic reading of system clipboard contents.
                  </li>
                  <li>
                    <strong>Zero Fingerprinting Sensors:</strong> Ambient light and accelerometer raw channels are avoided to prevent hardware fingerprinting.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* DIRECTION C */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Direction C — Human-System Communication Frontiers
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Alternative Interaction Methods Beyond Text, Speech, and Gestures
              </h2>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
              AAC &amp; Neurotechnology Survey
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>The Accessibility Impasse:</strong> Standard user interfaces assume fluent speech, high-fidelity fine motor dexterity (typing/swiping), and unimpaired vision. When motor fatigue, ALS, cerebral palsy, or situational physical constraints make conventional speech and text impossible, alternative low-bandwidth communication channels are essential.
              </p>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-xs">
                  <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Prior-Art Literature &amp; Research Citations:</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                  <li>
                    <strong>Jacob &amp; Karn (2003)</strong> — <em>Eye Tracking in HCI</em>: Tackling the &quot;Midas Touch&quot; dilemma using intentional micro-dwell thresholds (typically 400ms–800ms) to distinguish visual scanning from purposeful activation.
                  </li>
                  <li>
                    <strong>Simpson (2005)</strong> — <em>Computer Access for People with Disabilities</em>: Single-switch scanning paradigms (linear, row-column, and auditory scanning) utilizing temporal rhythmic cadence.
                  </li>
                  <li>
                    <strong>Wolpaw et al. (2002)</strong> — <em>Brain-Computer Interfaces for Communication and Control</em>: Survey of non-invasive EEG steady-state visual evoked potentials (SSVEP) and P300 event-related potentials for direct neural intent transmission.
                  </li>
                  <li>
                    <strong>Mackay (1998)</strong> — <em>Augmented Interaction</em>: Rhythmic cadence, spatial dwell, and micro-press dynamics as expressive interaction channels.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Three Paradigms Under Ongoing Investigation:
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <span className="font-semibold text-slate-900 dark:text-white">1. Micro-Dwell Intent Commitment:</span>
                    <p className="text-slate-500 mt-0.5">
                      Replacing high-impact finger strikes with steady, low-force contact or gaze dwell verified via an escalating radial progress dial.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <span className="font-semibold text-slate-900 dark:text-white">2. Temporal Rhythmic Cadence (Binary Morse/Switch):</span>
                    <p className="text-slate-500 mt-0.5">
                      Encoding multi-option selection through single-switch rhythm intervals (short vs long dwell), eliminating the need for spatial targeting.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <span className="font-semibold text-slate-900 dark:text-white">3. Local Optical Presence &amp; Head Pose:</span>
                    <p className="text-slate-500 mt-0.5">
                      Extracting rough nodding/orientation angles in local WebAssembly or WebGL shaders without storing facial images or biometric identifiers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-Dwell Prototype Widget */}
            <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Fingerprint className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Micro-Dwell Interactive Prototype
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">800ms Calibrated Hold</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-6">
                  Experience dwell-based intent commitment. Press and hold without clicking hard; observe how the timer discriminates intentional activation from incidental contact.
                </p>

                {/* Dwell Button Target */}
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <button
                    onMouseDown={handleDwellMouseDown}
                    onTouchStart={handleDwellMouseDown}
                    disabled={!researchConsent || isPaused}
                    className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-lg cursor-pointer select-none active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {/* Circular Progress Ring */}
                    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        className="text-indigo-100 dark:text-slate-700"
                        strokeWidth="6"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        className="text-indigo-600 dark:text-indigo-400 transition-all duration-75"
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 * (1 - dwellProgress / 100)}
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="text-center z-10">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {dwellActive ? `${dwellProgress}%` : 'HOLD'}
                      </span>
                      <span className="text-[9px] text-slate-500">Dwell</span>
                    </div>
                  </button>

                  <p className="text-[11px] text-center text-slate-500 max-w-xs">
                    {dwellActive
                      ? 'Holding... releasing now will safely cancel without action.'
                      : 'Press and hold button for 800ms to trigger without forceful click.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-100/60 dark:bg-indigo-950/60 text-[11px] text-indigo-900 dark:text-indigo-200">
                <strong>Next Open Research Question:</strong> Can personalized micro-dwell thresholds self-calibrate dynamically over multi-day sessions to account for diurnal motor fatigue, while strictly preserving zero content logging?
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* PWA Mobile Installation Callout */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Install G-SENSE on Your Android Phone (Redmi 9 / Chrome)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Run G-SENSE as a standalone Progressive Web App on mobile. Experience zero-friction local pattern learning, offline shell execution, and mobile touch signal research right on your device.
          </p>
        </div>

        <div className="shrink-0 w-full md:w-auto">
          <PWAInstallButton variant="card" className="w-full sm:w-64" />
        </div>
      </div>
    </div>
  );
};
