import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Smartphone, Share, PlusSquare, X, Info, Apple, Monitor, AlertCircle } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'card' | 'inline';
  label?: string;
  className?: string;
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  label,
  className = '',
  onInstalled,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'android' | 'ios' | 'desktop'>('android');

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
            initialPlatform={guidePlatform}
            onClose={() => setShowGuideModal(false)}
          />
        )}
      </>
    );
  }

  // Card or Inline variant
  const buttonText = label || (isInstallable
    ? 'Install G-SENSE App'
    : isAndroid
    ? 'Install G-SENSE App (Android)'
    : isIOS
    ? 'Install G-SENSE App (iOS Safari)'
    : 'Install G-SENSE App');

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>{buttonText}</span>
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
            <span>Installation guide for Android, iOS & Desktop</span>
          </button>
        )}
      </div>

      {showGuideModal && (
        <InstallGuideModal
          initialPlatform={guidePlatform}
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </>
  );
};

interface InstallGuideModalProps {
  initialPlatform?: 'android' | 'ios' | 'desktop';
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ initialPlatform = 'android', onClose }) => {
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>(initialPlatform);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Install G-SENSE App
              </h3>
              <p className="text-[11px] text-slate-500">Progressive Web App installation instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setPlatform('android')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              platform === 'android'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatform('ios')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              platform === 'ios'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Apple className="h-3.5 w-3.5" />
            <span>iPhone / iPad</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatform('desktop')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              platform === 'desktop'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Tab Content: Android */}
        {platform === 'android' && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">
                Compatible Android Phones & Tablets:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Chrome / Samsung Internet</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Works across compatible Android devices, including <strong>Samsung Galaxy</strong>, <strong>Google Pixel</strong>, <strong>Xiaomi Redmi</strong> (including Redmi 9 / MIUI / HyperOS), <strong>OnePlus</strong>, <strong>Motorola</strong>, and other supported Android devices.
            </p>
            <ol className="space-y-2 list-decimal list-inside bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <li>
                Open <strong>Google Chrome</strong> (or Samsung Internet) on your Android device.
              </li>
              <li>
                Tap the <strong>three dots (⋮)</strong> menu in the upper-right corner.
              </li>
              <li>
                Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
              </li>
              <li>
                Confirm by tapping <strong>Install</strong>.
              </li>
              <li className="text-[11px] text-slate-500 dark:text-slate-400">
                <em>Xiaomi Redmi / MIUI note:</em> If shortcuts are blocked, grant <em>&quot;Home screen shortcuts&quot;</em> in <em>Settings &gt; Apps &gt; Manage Apps &gt; Chrome &gt; Other Permissions</em>.
              </li>
            </ol>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[11px] text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
              Once added, G-SENSE launches in standalone fullscreen app mode without URL bars, providing quick home screen access with offline asset caching.
            </div>
          </div>
        )}

        {/* Tab Content: iOS */}
        {platform === 'ios' && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium text-slate-900 dark:text-white">
              Installation steps on iPhone & iPad (Safari):
            </p>
            <ol className="space-y-2.5 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">1.</span>
                <span>Open this site in <strong>Apple Safari</strong> on your iPhone or iPad.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">2.</span>
                <span className="leading-relaxed">
                  Tap the <strong className="inline-flex items-center text-blue-600 dark:text-blue-400 mx-1"><Share className="h-3.5 w-3.5 inline mr-0.5" /> Share</strong> button in the bottom toolbar (on iPhone) or top bar (on iPad).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">3.</span>
                <span className="leading-relaxed">
                  Scroll down the share sheet and tap <strong className="inline-flex items-center text-slate-900 dark:text-white mx-1"><PlusSquare className="h-3.5 w-3.5 inline mr-0.5" /> Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">4.</span>
                <span>Tap <strong>Add</strong> in the top-right corner to place G-SENSE on your home screen.</span>
              </li>
            </ol>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
              <strong>Note:</strong> On iOS, third-party browsers (Chrome, Firefox iOS) cannot install PWAs directly to the home screen due to iOS WebKit platform rules; Safari is recommended for installation.
            </div>
          </div>
        )}

        {/* Tab Content: Desktop */}
        {platform === 'desktop' && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium text-slate-900 dark:text-white">
              Installation steps on Desktop (Google Chrome, Microsoft Edge, Brave):
            </p>
            <ol className="space-y-2 list-decimal list-inside bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <li>
                Click the <strong>Install icon (monitor with down arrow)</strong> on the right side of the URL address bar.
              </li>
              <li>
                Or open the browser menu (<strong>⋮</strong> or <strong>…</strong>) and click <strong>&quot;Install G-SENSE&quot;</strong>.
              </li>
              <li>
                Confirm in the prompt to launch G-SENSE in an isolated, borderless application window.
              </li>
            </ol>
          </div>
        )}

        {/* Realistic Availability Notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
          <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            <strong>Device & Browser Note:</strong> Installation steps and availability vary by browser engine, operating system, and security settings. Not every browser or mobile device supports PWA installation (e.g. in-app social media browsers or private tabs).
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
