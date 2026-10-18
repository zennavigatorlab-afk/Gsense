import React, { useState } from 'react';
import { AdaptiveSuggestion } from '../types';
import { saveLocalFeedback } from '../lib/supabaseClient';
import { HelpCircle, Check, X, ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react';

interface AdaptiveAssistantOverlayProps {
  suggestion: AdaptiveSuggestion | null;
  onDismiss: () => void;
  onAction?: () => void;
  userId?: string;
}

export const AdaptiveAssistantOverlay: React.FC<AdaptiveAssistantOverlayProps> = ({
  suggestion,
  onDismiss,
  onAction,
  userId,
}) => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackHelpful, setFeedbackHelpful] = useState<boolean | null>(null);

  if (!suggestion) return null;

  const handleFeedback = (helpful: boolean) => {
    setFeedbackHelpful(helpful);
    setFeedbackSent(true);

    saveLocalFeedback({
      id: 'fb_' + Math.random().toString(36).substring(2, 9),
      userId,
      promptId: suggestion.id,
      screenId: 'active_session',
      triggerReason: suggestion.triggerReason,
      wasHelpful: helpful,
      createdAt: new Date().toISOString(),
    });

    setTimeout(() => {
      onDismiss();
      setFeedbackSent(false);
      setFeedbackHelpful(null);
    }, 1800);
  };

  return (
    <div
      role="region"
      aria-label="Adaptive interaction assistant guidance"
      className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-xl border border-blue-200 bg-white p-4 shadow-xl dark:border-blue-900/60 dark:bg-slate-900 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              G-SENSE Guidance
            </span>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {suggestion.title}
            </h4>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Dismiss assistant hint"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Transparent trigger rationale */}
      <div className="mb-3 rounded bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300">Trigger rationale:</span>{' '}
        {suggestion.triggerReason}
      </div>

      {/* Message & Steps */}
      <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
        {suggestion.message}
      </p>

      {suggestion.steps && suggestion.steps.length > 0 && (
        <ol className="mb-3 space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
          {suggestion.steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {idx + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      {/* Action CTA if present */}
      {suggestion.actionText && onAction && (
        <button
          onClick={onAction}
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <span>{suggestion.actionText}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* User Feedback Loop */}
      <div className="border-t border-slate-100 pt-2.5 dark:border-slate-800 flex items-center justify-between text-xs">
        {feedbackSent ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="h-3.5 w-3.5" />
            <span>Thank you! Feedback recorded.</span>
          </div>
        ) : (
          <>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Was this tip helpful?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleFeedback(true)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                aria-label="Mark helpful"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span className="text-[11px]">Yes</span>
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                aria-label="Mark unhelpful"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                <span className="text-[11px]">No</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
