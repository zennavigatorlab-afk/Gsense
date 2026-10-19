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
  HardDrive,
  Apple,
  Share,
  PlusSquare,
  Sparkles,
  Info,
  Layers,
  Brain,
  Activity,
  Fingerprint
} from 'lucide-react';
import { PWAInstallButton, InstallGuideModal } from '../components/PWAInstallButton';

interface DownloadsPageProps {
  onNavigate: (page: string) => void;
}

// GitHub repository and workflow references
const GITHUB_REPO_URL = 'https://github.com/zennavigatorlab-afk/Gsense';
const GITHUB_WORKFLOW_RUN_URL = 'https://github.com/zennavigatorlab-afk/Gsense/actions/runs/39244301696';
const GITHUB_ACTIONS_URL = 'https://github.com/zennavigatorlab-afk/Gsense/actions';

// Verified CI build data from GitHub Actions Workflow Run #7 (Commit a3e6be8)
const WINDOWS_CI_VERIFICATION = {
  buildPassed: true,
  runNumber: 7,
  runId: '39244301696',
  commitSha: 'a3e6be8',
  artifactName: 'GSense-AdaptiveAssistant-Windows-x64',
  artifactSizeMb: 11.3,
  artifactExpires: 'November 18, 2026',
  artifactZipSha256: '696990bf2359be1471d369d6e1bced66ffa93bcbadc1d3aa4f0c25cfbb597b3d',
  testsPassed: 8,
  totalDesktopTests: 8,
  binaryName: 'GSense-AdaptiveAssistant.exe',
  releasePublished: false,
};

// Permanent GitHub Release asset URL configuration.
// Verified: GitHub Actions Workflow Run #7 successfully built and uploaded the CI artifact,
// but the 'Publish to GitHub Release' step was skipped (0 releases published).
// Direct permanent release download is null, while the verified GitHub Actions workflow
// artifact is available to logged-in GitHub users on the workflow run page.
const VERIFIED_WINDOWS_RELEASE_URL: string | null = null;

// Audit-verified metadata for G-SENSE AdaptiveAssistant Windows release
const WINDOWS_METADATA = {
  name: 'G-SENSE AdaptiveAssistant',
  targetOS: 'Windows 10 / Windows 11 (64-bit, x86_64)',
  version: 'v0.1.0-preview',
  binaryName: 'GSense-AdaptiveAssistant.exe',
  format: 'Standalone 64-bit PE Executable (PyInstaller)',
  sha256: 'Packaged in artifact (checksums.sha256)',
  artifactDigest: '696990bf2359be1471d369d6e1bced66ffa93bcbadc1d3aa4f0c25cfbb597b3d',
  ciWorkflow: '.github/workflows/windows_build.yml',
  desktopTestsCount: 8,
  totalTestsCount: 44,
  status: 'CI Build Passed — Workflow Artifact Available'
};

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ onNavigate }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios' | 'desktop' | 'matrix'>('android');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<'android' | 'ios' | 'desktop'>('android');

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

  const openGuideModal = (platform: 'android' | 'ios' | 'desktop') => {
    setModalPlatform(platform);
    setShowInstallModal(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Page Header */}
      <div className="max-w-3xl space-y-4">
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Distribution & Runtime Architectures
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
          G-SENSE Downloads & System Specs
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          G-SENSE is engineered with a strict distinction between web, progressive web app, desktop, and mobile runtime architectures. We never provide broken links, fake executable wrappers, or unverified binary placeholders.
        </p>

        {/* Verification Transparency Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-200">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Platform Verification Audit Status</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-700 dark:text-slate-300 pt-1">
            <div>• <strong>Web Assistant:</strong> Verified & Live</div>
            <div>• <strong>PWA Manifest:</strong> W3C Standalone & Verified</div>
            <div>• <strong>Windows Build:</strong> Pending CI Verification</div>
            <div>• <strong>Android Native:</strong> Architecture Phase</div>
          </div>
        </div>
      </div>

      {/* 4 Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {/* 1. Web Application Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Ready & Live
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Web Application
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              The full G-SENSE adaptive assistant running directly in modern web browsers via TypeScript and client-side storage.
            </p>

            <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">System Specs:</div>
              <div>• Chrome 100+, Firefox 98+, Safari 15+, Edge 100+</div>
              <div>• Instant zero-install browser deployment</div>
              <div>• Local-first privacy architecture</div>
              <div>• Full adaptive guidance and metrics</div>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
            >
              <span>Launch Web Assistant Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('add-to-devices-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full text-center text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer py-1"
            >
              Add to Desktop / Mobile guide ↓
            </button>
          </div>
        </div>

        {/* 2. Progressive Web App (PWA) Card */}
        <div className="rounded-xl border-2 border-blue-500/30 bg-white p-5 dark:border-blue-700/40 dark:bg-slate-900 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-mono font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-blue-500" />
                PWA Verified
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Progressive Web App
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Installable app experience for compatible Android devices and iOS Safari with offline cache and standalone display.
            </p>

            <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Target Environments:</div>
              <div>• Android: Chromium-based browsers (Chrome, Samsung Internet)</div>
              <div>• iOS / iPadOS: Safari Add to Home Screen</div>
              <div>• Standalone window, no browser chrome</div>
              <div>• Safe offline fallback (zero private cache)</div>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <PWAInstallButton variant="card" label="Install G-SENSE App" />
            <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">
              Availability depends on browser engine &amp; device settings.
            </p>
          </div>
        </div>

        {/* 3. Windows Desktop App Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Monitor className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                CI Build Passed — Workflow Artifact Available
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Windows Desktop App
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Native desktop assistant with Tkinter GUI, opt-in foreground window tracking (Win32), and 100% local SQLite storage.
            </p>

            <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Verified CI Build Info:</div>
              <div>• Target OS: Windows 10 / 11 (64-bit, x86_64)</div>
              <div>• Version: {WINDOWS_METADATA.version}</div>
              <div>• Binary: {WINDOWS_METADATA.binaryName}</div>
              <div>• CI Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Workflow #7 ({WINDOWS_CI_VERIFICATION.commitSha}) Passed</span></div>
              <div>• Artifact: <span className="font-mono text-[11px]">{WINDOWS_CI_VERIFICATION.artifactName}</span> ({WINDOWS_CI_VERIFICATION.artifactSizeMb} MB)</div>
              <div>• GitHub Artifact Digest: <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate block">{WINDOWS_CI_VERIFICATION.artifactZipSha256}</span></div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5">
            {/* Primary Action: Direct link to verified GitHub Actions Workflow Run #7 Artifact */}
            <a
              href={GITHUB_WORKFLOW_RUN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Download Workflow Artifact (GitHub Actions Run #7)</span>
              <ExternalLink className="h-3 w-3 opacity-80" />
            </a>

            {/* Clear distinction, expiration notice, and digest disclaimer */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/80 dark:border-slate-700/80 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  <strong>Workflow Artifact (Ready &amp; Verified):</strong> Build #7 succeeded on commit <code>{WINDOWS_CI_VERIFICATION.commitSha}</code>. Contains <code>GSense-AdaptiveAssistant.exe</code> and <code>checksums.sha256</code>.
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
                <Clock className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span>
                  <strong>Artifact Expiration Notice:</strong> Retained for 30 days on GitHub Actions (expires {WINDOWS_CI_VERIFICATION.artifactExpires}). Requires GitHub account login to download from the Actions run.
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400">
                <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Digest Clarification:</strong> The SHA-256 digest above is GitHub's artifact archive container digest. The standalone executable checksum is generated by the Windows runner into <code>checksums.sha256</code> inside the archive and has not been independently verified against an extracted file outside CI.
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400">
                <Lock className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Permanent Release:</strong> Direct unauthenticated download will unlock once a release tag (e.g. <code>v0.1.0</code>) is published to GitHub Releases.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => onNavigate('docs')}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Terminal className="h-3 w-3" />
                <span>Build Source</span>
              </button>
              <a
                href={GITHUB_WORKFLOW_RUN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                <span>Workflow #7 Run Page</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* 4. Native Android App Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <Layers className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-mono font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Architecture Phase
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Native Android App
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Native Kotlin architectural research planned for compatible Android phones and tablets. No APK exists yet.
            </p>

            <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Architecture Boundaries:</div>
              <div>• Target: Modern Android (API 31+)</div>
              <div>• Scoped strictly inside the host app</div>
              <div>• Zero cross-app monitoring or Accessibility abuse</div>
              <div>• Zero keystroke, password, or clipboard logging</div>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <button
              onClick={() => onNavigate('research')}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-purple-300 bg-purple-50/60 px-4 py-2.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
            >
              <span>Explore Research Foundation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">
              Native APK is planned, not yet compiled.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Add to Desktop / Mobile — Supported Browsers & Devices Guide */}
      <div id="add-to-devices-section" className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              Installation &amp; Home Screen Guide
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Add to Desktop / Mobile: Practical Instructions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Practical steps for adding G-SENSE to your home screen or desktop across supported browser engines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openGuideModal('android')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install Guide Modal</span>
            </button>
          </div>
        </div>

        {/* Browser Support Disclaimer Alert */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Notice: Installation steps and availability vary by browser, operating system, and device.
            </p>
            <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
              We never promise installation on every mobile device or browser. For example, in-app browsers (inside Instagram, TikTok, Facebook), private/incognito tabs, and browsers lacking Web App Manifest or Service Worker support cannot install PWAs. Standalone PWA features require an HTTPS connection on production origins.
            </p>
          </div>
        </div>

        {/* Interactive Guide Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs">
          <button
            onClick={() => setActiveGuideTab('android')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeGuideTab === 'android'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Android (Chrome &amp; Compatible Devices)</span>
          </button>
          <button
            onClick={() => setActiveGuideTab('ios')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeGuideTab === 'ios'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Apple className="h-3.5 w-3.5" />
            <span>iPhone &amp; iPad (Safari)</span>
          </button>
          <button
            onClick={() => setActiveGuideTab('desktop')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeGuideTab === 'desktop'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Desktop (Chrome, Edge, Brave)</span>
          </button>
          <button
            onClick={() => setActiveGuideTab('matrix')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeGuideTab === 'matrix'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>Browser Compatibility Matrix</span>
          </button>
        </div>

        {/* Tab 1: Android Guide */}
        {activeGuideTab === 'android' && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Compatible Android Phones and Tablets
              </h3>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                Google Chrome, Samsung Internet, Edge on Android
              </span>
            </div>
            <p className="leading-relaxed">
              Designed for standards-compliant Android devices running Chromium-based browsers (e.g. <strong>Google Chrome</strong>, <strong>Samsung Internet</strong>). <em>Note:</em> Physical compatibility across specific hardware models has not been individually certified; PWA installation behavior depends on your browser engine, operating system version, and OEM background management policies.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">1</span>
                  <span>Open Supported Browser</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Open <code>https://gsense.vercel.app/</code> in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your phone or tablet.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">2</span>
                  <span>Trigger Install Action</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Tap Chrome menu (⋮) &gt; <strong>&quot;Install app&quot;</strong>, or on Samsung Internet tap (☰) &gt; <strong>&quot;Add page to&quot;</strong> &gt; <strong>&quot;Home screen&quot;</strong>.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">3</span>
                  <span>OEM / Permission Check</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  On Xiaomi Redmi / MIUI / HyperOS, verify that <em>&quot;Home screen shortcuts&quot;</em> is enabled in <em>Settings &gt; Apps &gt; Chrome &gt; Other permissions</em>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: iOS & iPadOS Guide */}
        {activeGuideTab === 'ios' && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Apple iPhone &amp; iPad Instructions (Safari)
              </h3>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                iOS 15.0+ / iPadOS 15.0+ Safari
              </span>
            </div>
            <p className="leading-relaxed">
              Apple iOS supports PWA installation natively through Safari&apos;s <strong>Add to Home Screen</strong> mechanism. Third-party iOS browsers (Chrome iOS, Firefox iOS) cannot directly add standalone PWAs to the iOS home screen due to Apple WebKit restrictions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">1</span>
                  <span>Open Safari</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Navigate to <code>https://gsense.vercel.app/</code> in <strong>Apple Safari</strong> on your iPhone or iPad.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">2</span>
                  <span>Tap Share Icon</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Tap the <strong className="inline-flex items-center text-blue-600 dark:text-blue-400"><Share className="h-3 w-3 inline mx-0.5" /> Share</strong> icon in the bottom toolbar on iPhone or top navigation bar on iPad.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">3</span>
                  <span>Add to Home Screen</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Scroll down the share sheet, tap <strong className="inline-flex items-center text-slate-900 dark:text-white"><PlusSquare className="h-3 w-3 inline mx-0.5" /> Add to Home Screen</strong>, then tap <strong>Add</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Desktop Browsers Guide */}
        {activeGuideTab === 'desktop' && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Desktop Browsers (Windows, macOS, Linux, ChromeOS)
              </h3>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                Google Chrome, Microsoft Edge, Brave
              </span>
            </div>
            <p className="leading-relaxed">
              Chromium-based desktop browsers support one-click installation into isolated application windows that run without address bars or browser tabs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Method A: Omnibox / Address Bar Icon</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Look at the right side of the URL bar for the install icon (monitor with a downward arrow) and click <strong>&quot;Install G-SENSE&quot;</strong>.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Method B: Browser Menu</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Click the three vertical dots (⋮) in Chrome or (… ) in Edge &gt; <strong>&quot;Save and share&quot;</strong> or <strong>&quot;Apps&quot;</strong> &gt; <strong>&quot;Install G-SENSE&quot;</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Compatibility Matrix */}
        {activeGuideTab === 'matrix' && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Platform &amp; Browser Compatibility Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <th className="p-2.5 font-semibold text-slate-900 dark:text-white">Platform / OS</th>
                    <th className="p-2.5 font-semibold text-slate-900 dark:text-white">Browser</th>
                    <th className="p-2.5 font-semibold text-slate-900 dark:text-white">Install Method</th>
                    <th className="p-2.5 font-semibold text-slate-900 dark:text-white">Support Level</th>
                    <th className="p-2.5 font-semibold text-slate-900 dark:text-white">Known Limitations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">Android</td>
                    <td className="p-2.5">Google Chrome</td>
                    <td className="p-2.5 font-mono">beforeinstallprompt / Menu</td>
                    <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-medium">Full Standalone</td>
                    <td className="p-2.5 text-slate-500">MIUI may require &quot;Home shortcuts&quot; permission</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">Android</td>
                    <td className="p-2.5">Samsung Internet</td>
                    <td className="p-2.5 font-mono">Menu &gt; Add page to</td>
                    <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-medium">Full Standalone</td>
                    <td className="p-2.5 text-slate-500">Requires manual menu selection if banner ignored</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">iOS / iPadOS</td>
                    <td className="p-2.5">Apple Safari</td>
                    <td className="p-2.5 font-mono">Share &gt; Add to Home Screen</td>
                    <td className="p-2.5 text-blue-600 dark:text-blue-400 font-medium">Standalone (WebKit)</td>
                    <td className="p-2.5 text-slate-500">No automated programmatic prompt; requires manual Share tap</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">iOS / iPadOS</td>
                    <td className="p-2.5">Chrome / Firefox iOS</td>
                    <td className="p-2.5 font-mono">Not supported</td>
                    <td className="p-2.5 text-amber-600 dark:text-amber-400 font-medium">Browser Only</td>
                    <td className="p-2.5 text-slate-500">Apple restricts PWA home screen installation to Safari</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">Windows / macOS</td>
                    <td className="p-2.5">Chrome / Edge</td>
                    <td className="p-2.5 font-mono">Omnibox / In-App Button</td>
                    <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-medium">Full Desktop PWA</td>
                    <td className="p-2.5 text-slate-500">Requires HTTPS or localhost origin</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">In-App WebViews</td>
                    <td className="p-2.5">Instagram / Facebook / TikTok</td>
                    <td className="p-2.5 font-mono">Blocked</td>
                    <td className="p-2.5 text-rose-600 dark:text-rose-400 font-medium">Unsupported</td>
                    <td className="p-2.5 text-slate-500">Sandboxed in-app browsers do not support Service Workers or install</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Native Windows Desktop Specification & CI Verification */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 space-y-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              Desktop Specification &amp; Guidance
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
            <div className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>CI Build Passed</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Workflow #7 (Commit a3e6be8)</div>
          </div>
        </div>

        {/* Verified Workflow #7 Artifact Status Panel */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Verified GitHub Actions Build Record: Workflow Run #7
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Executed on <code>windows-latest</code> (x64) for commit <code>{WINDOWS_CI_VERIFICATION.commitSha}</code>
                </p>
              </div>
            </div>
            <a
              href={GITHUB_WORKFLOW_RUN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shrink-0"
            >
              <span>View Workflow Run #7</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-white/80 dark:bg-slate-900/80 p-3 border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Automated Tests</div>
              <div className="font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">8/8 Desktop Tests Passed (100%)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Privacy boundaries &amp; dwell separation verified</div>
            </div>
            <div className="rounded-lg bg-white/80 dark:bg-slate-900/80 p-3 border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Workflow Artifact</div>
              <div className="font-semibold text-slate-900 dark:text-white mt-0.5 font-mono">{WINDOWS_CI_VERIFICATION.artifactName}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{WINDOWS_CI_VERIFICATION.artifactSizeMb} MB zip • Retained until {WINDOWS_CI_VERIFICATION.artifactExpires}</div>
            </div>
            <div className="rounded-lg bg-white/80 dark:bg-slate-900/80 p-3 border border-emerald-100 dark:border-emerald-900/40 sm:col-span-2 lg:col-span-1">
              <div className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Artifact Archive Digest</div>
              <div className="font-mono text-[10px] text-slate-700 dark:text-slate-300 break-all mt-0.5 select-all">{WINDOWS_CI_VERIFICATION.artifactZipSha256}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">GitHub archive container digest (executable checksum inside zip)</div>
            </div>
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
                Windows Execution &amp; CI Invariant
              </h3>
            </div>

            <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">CI Build Passed &amp; Artifact Ready:</strong> The Windows binary was built and verified on a 64-bit Windows runner in GitHub Actions Workflow Run #7 (commit <code>{WINDOWS_CI_VERIFICATION.commitSha}</code>). Logged-in GitHub accounts can download <code>GSense-AdaptiveAssistant-Windows-x64</code> (11.3 MB) from the Actions run page (expires {WINDOWS_CI_VERIFICATION.artifactExpires}). Extract the zip to run <code>GSense-AdaptiveAssistant.exe</code> portably.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Zero Installer Privileges:</strong> When released, <code>GSense-AdaptiveAssistant.exe</code> runs portably in user space without administrator rights or registry pollution.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Explicit Privacy Opt-in:</strong> Active window tracking is disabled by default upon first launch and requires explicit user opt-in.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  4
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Local SQLite Persistence:</strong> Stores all learned interaction aggregates in <code>gsense_desktop.db</code> locally with pause and purge controls.
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
                Privacy Information &amp; Verified Boundaries
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
            </ul>
          </div>
        </div>

        {/* Automated Windows CI & Source Build Callout */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>GitHub Actions CI Pipeline &amp; Local Reproducibility</span>
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

      {/* SECTION 3: Adaptive Interaction Research Section */}
      <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 dark:border-purple-900/40 pb-5">
          <div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              <span>Adaptive Interaction Research Foundation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Directions in Adaptive Human-Computer Interaction
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Investigating respectful, privacy-preserving behavioral signals to assist users experiencing interface friction.
            </p>
          </div>

          <button
            onClick={() => onNavigate('research')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Launch Research Lab &amp; Simulator</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Critical Research Methodology Disclaimer */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
          <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white">
              Academic Note: Research Directions, Not Proven Inventions
            </div>
            <p className="text-[11px] leading-relaxed">
              These topics represent active exploratory research directions grounded in human-computer interaction literature (e.g. Fitts&apos; Law, GOMS, Keystroke-Level Modeling, and Differential Privacy). We explicitly do <strong>not</strong> claim these concepts as novel ungrounded inventions. Real-world efficacy requires empirical validation and rigorous prior-art benchmarking.
            </p>
          </div>
        </div>

        {/* Three Research Directions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Direction A */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                  Direction A
                </span>
                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                In-App Interaction-Pattern Learning
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Detecting hesitation pauses (dwell intervals &gt;8000ms), repeated click attempts, and navigation backtracking strictly inside the G-SENSE application.
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1 pt-1">
                <div>• Distinguishes active task dwell from idle time</div>
                <div>• Zero keystroke or text recording</div>
                <div>• Local-first inference with confidence tiers</div>
              </ul>
            </div>
            <div className="pt-2 text-[11px] font-mono text-purple-700 dark:text-purple-300 border-t border-slate-200 dark:border-slate-800">
              Prior Art: Card et al. (1983) GOMS; Horvitz (1999) Mixed-Initiative
            </div>
          </div>

          {/* Direction B */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                  Direction B
                </span>
                <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Privacy-Preserving Android Signals
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Researching permitted, explicitly consented Android interaction signals without ever collecting private user content or abusing OS privileges.
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1 pt-1">
                <div>• Zero cross-app surveillance or screen capture</div>
                <div>• No keylogger or clipboard accessibility exploitation</div>
                <div>• Explicit consent with instant pause and purge</div>
              </ul>
            </div>
            <div className="pt-2 text-[11px] font-mono text-purple-700 dark:text-purple-300 border-t border-slate-200 dark:border-slate-800">
              Prior Art: Dwork et al. (2006) Differential Privacy; Android CDD
            </div>
          </div>

          {/* Direction C */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                  Direction C
                </span>
                <Fingerprint className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Alternative Human-Computer Communication
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Investigating communication modalities beyond conventional typing, voice, or standard gestures to support diverse motor and cognitive capabilities.
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1 pt-1">
                <div>• Micro-dwell intent sensing (timed fixation)</div>
                <div>• Rhythmic cadence signaling for binary selection</div>
                <div>• Adaptive switch and gaze estimation simulations</div>
              </ul>
            </div>
            <div className="pt-2 text-[11px] font-mono text-purple-700 dark:text-purple-300 border-t border-slate-200 dark:border-slate-800">
              Prior Art: MacKenzie (1992) Fitts&apos; Law; Jacob (1990) Eye Gaze
            </div>
          </div>
        </div>

        {/* User Sovereignty Summary Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-lg bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 text-xs">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
            <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" />
            <span>
              All research prototypes require explicit opt-in consent, support instant pause, and provide complete data export and purge controls.
            </span>
          </div>
          <button
            onClick={() => onNavigate('research')}
            className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer shrink-0"
          >
            Open Interactive Research Lab →
          </button>
        </div>
      </div>

      {/* Guide Modal */}
      {showInstallModal && (
        <InstallGuideModal
          initialPlatform={modalPlatform}
          onClose={() => setShowInstallModal(false)}
        />
      )}
    </div>
  );
};
