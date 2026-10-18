import React from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  Globe,
  Terminal,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DownloadsPageProps {
  onNavigate: (page: string) => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ onNavigate }) => {
  const handleDownloadSpec = () => {
    const specContent = `# G-SENSE PyInstaller Spec
# Run: pyinstaller GSense.spec --clean
# See desktop/build_windows.py in the repository
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
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Distribution & Platforms
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
          Deploy and Run G-SENSE
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          G-SENSE is engineered with a strict distinction between web, desktop, and mobile runtime architectures. We never provide broken links or fake executable wrappers.
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 1. Web Application */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live / Ready
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Web Application
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              The full G-SENSE adaptive assistant engine running natively in modern web browsers via JavaScript and HTML5.
            </p>

            <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">System Requirements:</div>
              <div>• Chrome 100+, Firefox 98+, Safari 15+, Edge 100+</div>
              <div>• JavaScript enabled & Web Storage</div>
              <div>• Instant zero-install deployment</div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <span>Use Web Version Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Windows Desktop */}
        <div className="rounded-xl border border-blue-200 bg-white p-6 dark:border-blue-900/60 dark:bg-slate-900 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Monitor className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Coming Soon (Preview)
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Windows Desktop Software
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Native desktop background assistant written in Python with Tkinter UI, permission-based interaction capture, and SQLite storage.
            </p>

            <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">System Requirements:</div>
              <div>• Windows 10 / Windows 11 (64-bit)</div>
              <div>• 4 GB RAM, 250 MB free disk space</div>
              <div>• Python 3.10+ (for source execution)</div>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <button
              onClick={() => onNavigate('docs')}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Inspect Windows CI & Build Specs</span>
            </button>
            <div className="text-[11px] text-center text-slate-500 dark:text-slate-400">
              CI Workflow: <code>.github/workflows/windows_build.yml</code>
            </div>
          </div>
        </div>

        {/* 3. Android Application */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Architecture Phase
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Android Application
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Architecture for touch-interaction learning scoped exclusively inside the app. Respects Android battery and background execution limits.
            </p>

            <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Target Requirements:</div>
              <div>• Android 12+ (API Level 31+)</div>
              <div>• Jetpack Compose & Kotlin Coroutines</div>
              <div>• Zero cross-app keylogging / Accessibility abuse</div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onNavigate('docs')}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>Read Android Architecture</span>
            </button>
          </div>
        </div>
      </div>

      {/* Windows CI & Source Build Callout */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Windows Standalone Build Workflow & GitHub CI</span>
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          G-SENSE uses an automated GitHub Actions CI workflow running on <code>windows-latest</code> to verify tests, compile 64-bit binaries via PyInstaller, and generate downloadable release artifacts:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto space-y-1">
            <div className="text-blue-400 font-bold mb-2"># Automated GitHub Actions Workflow</div>
            <div>File: .github/workflows/windows_build.yml</div>
            <div>Target: Windows 64-bit (x86_64)</div>
            <div>Artifact: GSense-AdaptiveAssistant.exe</div>
            <div>Checksum: dist/checksums.sha256</div>
          </div>
          <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto space-y-1">
            <div className="text-blue-400 font-bold mb-2"># Local Windows Build Commands</div>
            <div>cd desktop</div>
            <div>pip install -r requirements.txt</div>
            <div>python build_windows.py --build</div>
            <div># Output placed in: dist/GSense-AdaptiveAssistant.exe</div>
          </div>
        </div>
      </div>
    </div>
  );
};
