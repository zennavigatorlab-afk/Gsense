import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-lg bg-amber-600/95 text-white px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur-xs border border-amber-500/40 animate-fade-in"
    >
      <WifiOff className="h-4 w-4 animate-pulse text-amber-200 shrink-0" />
      <span>Offline Mode — Running with cached application shell. Client-side privacy active.</span>
    </div>
  );
};
