import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  Globe,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  ExternalLink,
  FileCode,
  Copy,
  Check,
  AlertCircle,
  HardDrive
} from 'lucide-react';

interface DownloadsPageProps {
  onNavigate: (page: string) => void;
}

// GitHub repository reference
const GITHUB_REPO_URL = 'https://github.com/zennavigatorlab-afk/Gsense';

// Real GitHub Release asset URL configuration.
// IMPORTANT: Only populate this with a verified, live release binary URL once GitHub Actions CI
// has successfully built, verified, and published the release artifact to GitHub Releases.
// When null, the UI strictly displays "Windows build pending verification" and disables download.
const VERIFIED_WINDOWS_RELEASE_URL: string | null = null;

// Audit-verified metadata for G-SENSE AdaptiveAssistant Windows release
const WINDOWS_METADATA = {
  name: 'G-SENSE AdaptiveAssistant',
  targetOS: 'Windows 10 / Windows 11 (64-bit, x86_64)',
  version: 'v0.1.0-preview',
  binaryName: 'GSense-AdaptiveAssistant.exe',
  format: 'Standalone 64-bit PE Executable (PyInstaller)',
  sha256: 'Pending verified Windows CI build artifact',
  ciWorkflow: '.github/workflows/windows_build.yml',
  desktopTestsCount: 8,
  totalTestsCount: 31,
  status: 'Coming Soon'
};

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ onNavigate }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadSpec = () => {
    const specContent = `# -*- mode: python ; coding: utf-8 -*-
# G-SENSE AdaptiveAssistant - PyInstaller Build Specification
# Repository: https://github.com/zennavigatorlab-afk/Gsense
# Target: Windows 10/11 (64-bit) standalone PE32+ executable

import sys
import os
from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

a = Analysis(
    ['desktop/app.py'],
    pathex=['desktop'],
    binaries=[],
    datas=[],
    hiddenimports=[
        'sqlite3',
        'tkinter',
        'tkinter.ttk',
        'tkinter.messagebox',
        'tkinter.filedialog',
        'gsense_engine',
        'storage',
        'window_tracker'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'numpy', 'scipy', 'pandas', 'IPython', 'pytest'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='GSense-AdaptiveAssistant',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch='x86_64',
    codesign_identity=None,
    entitlements_file=None,
)
`;
    const blob = new Blob([specContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GSense.spec';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Page Header */}
      <div className="max-w-3xl space-y-4">
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Distribution & Platforms
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
          Deploy and Run G-SENSE
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          G-SENSE is engineered with a strict distinction between web, desktop, and mobile runtime architectures. We never provide broken links, fake executable wrappers, or unverified binary placeholders.
        </p>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* 1. Web Application Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ready & Live
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Web Application
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              The full G-SENSE adaptive assistant engine running natively in modern web browsers via TypeScript, JavaScript, and HTML5 Web Storage.
            </p>

            <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">System Requirements:</div>
              <div>• Chrome 100+, Firefox 98+, Safari 15+, Edge 100+</div>
              <div>• JavaScript enabled & Web Storage</div>
              <div>• Instant zero-install browser deployment</div>
              <div>• 100% client-side privacy architecture</div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
            >
              <span>Use Web Version Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Windows Desktop Software Card */}
        <div className="rounded-xl border-2 border-blue-500/30 bg-white p-6 dark:border-blue-700/40 dark:bg-slate-900 flex flex-col justify-between shadow-sm relative">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Monitor className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Coming Soon
              </span>
            </div>

            <div className="mb-1">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Native Desktop App
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Windows Desktop Software
              </h2>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                G-SENSE AdaptiveAssistant
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 mt-2">
              Native desktop assistant with Tkinter GUI, opt-in foreground window tracking (Win32), automated sensitive-window exclusion, UI Automation control boundary verification, and 100% local SQLite storage.
            </p>

            {/* Technical Specifications */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3 mb-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Compatibility:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Windows 10 / 11 (64-bit)</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Version:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{WINDOWS_METADATA.version}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Binary Target:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{WINDOWS_METADATA.binaryName}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Build Status:</span>
                <span className="text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400">CI Verification Pending</span>
              </div>
            </div>
          </div>

          {/* Download Action Section */}
          <div className="pt-4 space-y-2">
            {VERIFIED_WINDOWS_RELEASE_URL ? (
              <a
                href={VERIFIED_WINDOWS_RELEASE_URL}
                download={WINDOWS_METADATA.binaryName}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="h-4 w-4" />
                <span>Download for Windows (64-bit)</span>
              </a>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Windows EXE build is pending verification by GitHub Actions CI runner. No unverified binary is served."
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-90"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Windows build pending verification</span>
                </button>
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 leading-normal">
                  Windows CI build pending verification. The download button will enable automatically once a real GitHub Actions release binary is published.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => onNavigate('docs')}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Terminal className="h-3 w-3" />
                <span>Build from Source</span>
              </button>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                <span>GitHub Repo</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* 3. Android Application Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Architecture Phase
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Android Application
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Architecture for touch-interaction learning scoped exclusively inside the app. Respects Android battery, background execution limits, and user privacy.
            </p>

            <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Target Requirements:</div>
              <div>• Android 12+ (API Level 31+)</div>
              <div>• Jetpack Compose & Kotlin Coroutines</div>
              <div>• Scoped strictly inside the host application</div>
              <div>• Zero cross-app keylogging or Accessibility abuse</div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onNavigate('docs')}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>Read Android Architecture</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Windows AdaptiveAssistant Information Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 space-y-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              Desktop Specification & Guidance
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              G-SENSE AdaptiveAssistant for Windows 10/11 (64-bit)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Audited against actual source code: Tkinter GUI, Win32 foreground polling, safety filters, SQLite storage, and GitHub Actions CI.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSpec}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <FileCode className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Download GSense.spec</span>
            </button>
          </div>
        </div>

        {/* Verification & Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Target Operating System</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">Windows 10 / 11 (64-bit)</div>
            <div className="mt-1 text-[11px] text-slate-500">x86_64 architecture</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Release Target</div>
            <div className="mt-1 text-sm font-semibold font-mono text-slate-900 dark:text-white">{WINDOWS_METADATA.version}</div>
            <div className="mt-1 text-[11px] text-slate-500">Git Tag release stream</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Executable Binary</div>
            <div className="mt-1 text-sm font-semibold font-mono text-slate-900 dark:text-white">{WINDOWS_METADATA.binaryName}</div>
            <div className="mt-1 text-[11px] text-slate-500">PyInstaller single-file PE32+</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Verification Status</div>
            <div className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>CI Verification Pending</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">SHA-256 generated upon publish</div>
          </div>
        </div>

        {/* 2 Columns: Installation Instructions & Privacy Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Installation Instructions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Terminal className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Installation & Execution Instructions
              </h3>
            </div>

            <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Download Standalone Binary:</strong> Download <code>GSense-AdaptiveAssistant.exe</code> from the verified GitHub Releases section once CI build verification completes.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Zero-Installer User Space:</strong> Place the standalone executable anywhere in your user directory. No administrator permissions, background service installation, or kernel drivers are required.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Explicit Privacy Agreement:</strong> Upon first launch, review the opt-in monitoring agreement. Foreground window tracking is disabled by default and requires explicit confirmation.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  4
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Local SQLite Database:</strong> The app creates a local database file (<code>gsense_desktop.db</code>) initialized and retained exclusively on your device.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  5
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Desktop GUI Controls:</strong> Access live metrics, toggle Pause Learning, export data bundles (JSON / CSV), or execute a 100% irreversible local purge at any time directly through the native window.
                </div>
              </li>
            </ol>
          </div>

          {/* Privacy Information & Security Boundaries */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Privacy Information & Verified Boundaries
              </h3>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Zero Keystroke / Text Capture:</strong> The desktop app never registers global keyboard hooks, keyloggers, typed text, passwords, or form inputs.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Zero Screen / Clipboard Access:</strong> No screen recording, webcam streaming, OCR, or clipboard monitoring.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Sensitive Window Filtering:</strong> Windows belonging to password managers (Bitwarden, 1Password, KeePass), banking portals, authentication dialogues, or incognito browsing are automatically excluded from telemetry.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">UI Automation Control Boundary:</strong> Safety filter strictly restricts permitted elements to structural controls (Buttons, Tabs, MenuItems); Edit, Text, and Password controls are permanently rejected.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Total User Sovereignty:</strong> Instant Pause Learning halts tracking immediately; Purge All Data drops SQLite records permanently.
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Automated Windows CI & Source Build Callout */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>GitHub Actions CI Pipeline & Local Reproducibility</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              Workflow: .github/workflows/windows_build.yml
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The Windows CI workflow runs on <code>windows-latest</code> across triggers: push to <code>main</code>/<code>master</code>, git tags (<code>v*</code>), pull requests, and manual dispatch. PyInstaller packages the 64-bit standalone binary and PowerShell generates <code>dist/checksums.sha256</code>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto space-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 font-bold"># Windows CI Specifications</span>
                <button
                  onClick={() => handleCopy('ci', '.github/workflows/windows_build.yml')}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  title="Copy workflow path"
                >
                  {copiedKey === 'ci' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div>Host OS: windows-latest (64-bit)</div>
              <div>Python: 3.11 (x86_64)</div>
              <div>Automated Desktop Tests: python desktop/test_desktop.py (8/8)</div>
              <div>Builder: pyinstaller desktop/build_windows.py</div>
              <div>Output Target: dist/GSense-AdaptiveAssistant.exe</div>
              <div>Verification: Test-Path + Get-FileHash SHA256</div>
            </div>

            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto space-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 font-bold"># Local Windows Build Commands</span>
                <button
                  onClick={() => handleCopy('cmd', 'cd desktop && pip install -r requirements.txt && python test_desktop.py && python build_windows.py --build')}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  title="Copy build commands"
                >
                  {copiedKey === 'cmd' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div>cd desktop</div>
              <div>pip install -r requirements.txt</div>
              <div>python test_desktop.py</div>
              <div>python build_windows.py --build</div>
              <div className="text-slate-400"># Output: dist/GSense-AdaptiveAssistant.exe</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
