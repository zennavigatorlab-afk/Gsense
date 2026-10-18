import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, AlertTriangle, ShieldCheck, CheckCircle2, Eye, X } from 'lucide-react';

interface CameraSensingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
}

export const CameraSensingModal: React.FC<CameraSensingModalProps> = ({
  isOpen,
  onClose,
  isEnabled,
  onToggleEnabled,
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localMotionValue, setLocalMotionValue] = useState<number>(0);
  const [motionLabel, setMotionLabel] = useState<string>('Calibrating local presence...');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setStreamActive(false);
    prevFrameDataRef.current = null;
  };

  const startCameraStream = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);
      onToggleEnabled(true);
      startMotionAnalysis();
    } catch (err: any) {
      console.warn('Camera sensing access error:', err);
      let msg = err.message || 'Permission denied or camera device unavailable.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was declined by the user or restricted by the browser/iFrame.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No video capture hardware device was found on this system.';
      }
      setErrorMsg(msg);
      setStreamActive(false);
      onToggleEnabled(false);
    }
  };

  const startMotionAnalysis = () => {
    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx && video.readyState >= 2) {
        canvas.width = 64;
        canvas.height = 48;
        ctx.drawImage(video, 0, 0, 64, 48);

        const imgData = ctx.getImageData(0, 0, 64, 48);
        const data = imgData.data;

        if (prevFrameDataRef.current) {
          const prev = prevFrameDataRef.current;
          let diffSum = 0;
          const pixelCount = data.length / 4;

          for (let i = 0; i < data.length; i += 4) {
            // Simple grayscale delta
            const currentGray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const prevGray = (prev[i] + prev[i + 1] + prev[i + 2]) / 3;
            diffSum += Math.abs(currentGray - prevGray);
          }

          const avgDelta = diffSum / pixelCount;
          setLocalMotionValue(Math.round(avgDelta * 10) / 10);

          if (avgDelta < 2.0) {
            setMotionLabel('Stationary / Engaged at screen');
          } else if (avgDelta < 7.0) {
            setMotionLabel('Normal interaction movement');
          } else {
            setMotionLabel('Rapid movement detected');
          }
        }

        prevFrameDataRef.current = new Uint8ClampedArray(data);
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  const handleDisableImmediate = () => {
    stopCameraStream();
    onToggleEnabled(false);
  };

  useEffect(() => {
    if (isOpen && isEnabled && !streamActive) {
      startCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Optional Camera Sensing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Privacy-first local presence detection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Camera Viewport or Permissions State */}
        <div className="my-5 space-y-4">
          {streamActive ? (
            <div className="space-y-3">
              {/* Visible Camera-Active Indicator */}
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold">Camera Active (Strictly Local)</span>
                </div>
                <span className="text-[11px] font-mono">No network transmission</span>
              </div>

              {/* Local video preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black border border-slate-200 dark:border-slate-800">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Local computation overlay */}
                <div className="absolute bottom-2 left-2 rounded bg-black/75 px-2 py-1 text-[11px] font-mono text-white backdrop-blur-xs">
                  <span>Presence state: {motionLabel}</span>
                  <span className="text-slate-400"> (Δ {localMotionValue})</span>
                </div>
              </div>

              <button
                onClick={handleDisableImmediate}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                <CameraOff className="h-4 w-4" />
                <span>Disable Camera Immediately</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {errorMsg ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="font-semibold">Hardware or Permission Notice</div>
                      <div className="mt-1 text-slate-700 dark:text-slate-300">{errorMsg}</div>
                      <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        Note: G-SENSE is 100% operational without a camera. Touch, mouse, and keyboard interaction patterns provide all core adaptation features.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Camera Privacy & Architecture Invariants</span>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-400">
                    <li>Camera is <strong>disabled by default</strong> and never turns on automatically.</li>
                    <li><strong>No photos or videos</strong> are saved to disk or transmitted to any server.</li>
                    <li>Only local canvas pixel differencing is used to detect presence or stillness.</li>
                    <li><strong>Never identifies people</strong> and never claims to read emotions or thoughts.</li>
                  </ul>
                </div>
              )}

              <button
                onClick={startCameraStream}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                <span>Request Permission & Enable Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Client-side HTML5 Canvas API</span>
          <button onClick={onClose} className="hover:underline text-slate-600 dark:text-slate-300 cursor-pointer">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
