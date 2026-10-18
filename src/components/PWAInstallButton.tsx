import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Smartphone, Share, PlusSquare, X, Info } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'card' | 'inline';
  className?: string;
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
  onInstalled,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'ios' | 'android' | 'desktop'>('android');

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success && onInstalled) {
        onInstalled();
      }
    } else if (isIOS) {
      setGuidePlatform('ios');
      setShowGuideModal(true);
    } else {
      // Fallback guided manual install
      setGuidePlatform(isAndroid ? 'android' : 'desktop');
      setShowGuideModal(true);
    }
  };

  // If already installed in standalone mode
  if (isInstalled) {
    if (variant === 'navbar') {
      return (
        <span
          title="G-SENSE is installed in standalone mode"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg"
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>App Installed</span>
        </span>
      );
    }
    return (
      <div className={`flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-3 py-2 rounded-lg ${className}`}>
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>G-SENSE is installed and running in Standalone PWA mode.</span>
      </div>
    );
  }

  // Navbar variant
  if (variant === 'navbar') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 rounded-lg border border-blue-600/30 bg-blue-50/80 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors cursor-pointer shrink-0 shadow-2xs ${className}`}
          title="Install G-SENSE as a Progressive Web App"
        >
          <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden xs:inline">Install PWA</span>
        </button>

        {showGuideModal && (
          <InstallGuideModal
            platform={guidePlatform}
            onClose={() => setShowGuideModal(false)}
          />
        )}
      </>
    );
  }

  // Card or Inline variant
  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>
            {isInstallable
              ? 'Install G-SENSE App (PWA)'
              : isAndroid
              ? 'Install on Android (Chrome)'
              : isIOS
              ? 'Install on iPhone / iPad'
              : 'Add to Desktop / Mobile'}
          </span>
        </button>

        {!isInstallable && (
          <button
            type="button"
            onClick={() => {
              setGuidePlatform(isIOS ? 'ios' : isAndroid ? 'android' : 'desktop');
              setShowGuideModal(true);
            }}
            className="w-full text-center text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center justify-center gap-1"
          >
            <Info className="h-3 w-3" />
            <span>How to install on Android (Redmi 9 / Chrome) & iOS</span>
          </button>
        )}
      </div>

      {showGuideModal && (
        <InstallGuideModal
          platform={guidePlatform}
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </>
  );
};

interface InstallGuideModalProps {
  platform: 'ios' | 'android' | 'desktop';
  onClose: () => void;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ platform, onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Smartphone className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Install G-SENSE App (PWA)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {platform === 'android' && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium text-slate-900 dark:text-white">
              Installation steps on Android (Google Chrome & Redmi 9 / MIUI):
            </p>
            <ol className="space-y-2 list-decimal list-inside bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <li>
                Open this website in <strong>Google Chrome</strong> on your Android phone.
              </li>
              <li>
                Tap the <strong>three vertical dots (⋮)</strong> in the top-right corner of Chrome.
              </li>
              <li>
                Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
              </li>
              <li>
                Confirm the prompt by tapping <strong>Install</strong>.
              </li>
              <li className="text-[11px] text-slate-500 dark:text-slate-400">
                <em>Xiaomi / Redmi 9 Note:</em> If prompted by MIUI, ensure <em>&quot;Home screen shortcuts&quot;</em> permission is allowed in Settings &gt; Apps &gt; Chrome &gt; Permissions.
              </li>
            </ol>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[11px] text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
              G-SENSE will appear on your home screen with its official icon, launching in standalone fullscreen app mode without browser address bars.
            </div>
          </div>
        )}

        {platform === 'ios' && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium text-slate-900 dark:text-white">
              Installation steps on iPhone / iPad (Safari):
            </p>
            <ol className="space-y-2 list-decimal list-inside bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <li className="flex items-center gap-1.5">
                <span>1. Tap the</span>
                <span className="inline-flex items-center font-semibold text-blue-600"><Share className="h-3.5 w-3.5 inline" /> Share</span>
                <span>button in the Safari toolbar.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>2. Scroll down and tap</span>
                <span className="inline-flex items-center font-semibold text-slate-900 dark:text-white"><PlusSquare className="h-3.5 w-3.5 inline mr-1" /> Add to Home Screen</span>.
              </li>
              <li>
                3. Tap <strong>Add</strong> in the top-right corner to complete.
              </li>
            </ol>
          </div>
        )}

        {platform === 'desktop' && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium text-slate-900 dark:text-white">
              Installation steps on Chrome / Edge desktop:
            </p>
            <ol className="space-y-2 list-decimal list-inside bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <li>
                Look for the <strong>Install icon (computer/down arrow)</strong> in the right side of the browser URL address bar.
              </li>
              <li>
                Alternatively, click the browser menu (<strong>⋮</strong> or <strong>…</strong>) and select <strong>&quot;Install G-SENSE&quot;</strong>.
              </li>
              <li>
                Click <strong>Install</strong> to run G-SENSE in a distraction-free window.
              </li>
            </ol>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
