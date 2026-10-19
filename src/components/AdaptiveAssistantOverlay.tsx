import React, { useState } from 'react';
import { AdaptiveSuggestion } from '../types';
import { learningEngine } from '../lib/learningEngine';
import {
  HelpCircle,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Lightbulb,
  FileText,
  ListOrdered,
  BellOff
} from 'lucide-react';

interface AdaptiveAssistantOverlayProps {
  suggestion: AdaptiveSuggestion | null;
  onDismiss: () => void;
  onAction?: () => void;
  userId?: string;
  onFeedbackSubmitted?: () => void;
}

export const AdaptiveAssistantOverlay: React.FC<AdaptiveAssistantOverlayProps> = ({
  suggestion,
  onDismiss,
  onAction,
  userId,
  onFeedbackSubmitted,
}) => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackHelpful, setFeedbackHelpful] = useState<boolean | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'hint' | 'explanation' | 'steps'>('hint');
  const [disabledNotice, setDisabledNotice] = useState(false);

  if (!suggestion) return null;

  const handleFeedback = (helpful: boolean) => {
    setFeedbackHelpful(helpful);
    setFeedbackSent(true);

    learningEngine.recordFeedback(
      suggestion.id,
      helpful,
      'active_session',
      suggestion.triggerReason,
      userId
    );

    if (onFeedbackSubmitted) {
      onFeedbackSubmitted();
    }

    setTimeout(() => {
      onDismiss();
      setFeedbackSent(false);
      setFeedbackHelpful(null);
    }, 1500);
  };

  const handleDismiss = () => {
    learningEngine.recordTipDismissed(suggestion.id, suggestion.ruleKey);
    if (onFeedbackSubmitted) {
      onFeedbackSubmitted();
    }
    onDismiss();
  };

  const handleDisableAutoSuggestions = () => {
    learningEngine.setAutoSuggestionsEnabled(false);
    learningEngine.recordTipDismissed(suggestion.id, suggestion.ruleKey);
    setDisabledNotice(true);
    setTimeout(() => {
      onDismiss();
      setDisabledNotice(false);
    }, 1800);
  };

  return (
    <div
      role="region"
      aria-label="Adaptive interaction assistant guidance"
      className="fixed bottom-6 right-6 z-50 w-full max-w-md rounded-2xl border border-blue-200/90 bg-white p-5 shadow-2xl dark:border-blue-900/60 dark:bg-slate-900 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                G-SENSE Adaptive Guidance
              </span>
              <span className="text-[10px] text-slate-400 font-mono">· Rule Triggered</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {suggestion.title}
            </h4>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Dismiss assistant hint"
          title="Dismiss this hint"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Transparent Trigger Rationale (Never guesses emotion) */}
      <div className="mb-3 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Trigger rule:</span>{' '}
        {suggestion.triggerReason}
      </div>

      {/* 3 Guidance Depth Options (Short Hint, Simpler Explanation, Step-by-Step Help) */}
      <div className="mb-3 flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 text-[11px] font-medium">
        <button
          type="button"
          onClick={() => setSelectedFormat('hint')}
          className={`flex-1 py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
            selectedFormat === 'hint'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lightbulb className="h-3 w-3" />
          <span>Short Hint</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFormat('explanation')}
          className={`flex-1 py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
            selectedFormat === 'explanation'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="h-3 w-3" />
          <span>Explanation</span>
        </button>

        {suggestion.steps && suggestion.steps.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedFormat('steps')}
            className={`flex-1 py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
              selectedFormat === 'steps'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListOrdered className="h-3 w-3" />
            <span>Step-by-Step</span>
          </button>
        )}
      </div>

      {/* Content depending on selected format */}
      <div className="min-h-[52px] mb-3 text-xs leading-relaxed">
        {selectedFormat === 'hint' && (
          <p className="text-slate-700 dark:text-slate-200">
            {suggestion.shortHint || suggestion.message}
          </p>
        )}

        {selectedFormat === 'explanation' && (
          <p className="text-slate-600 dark:text-slate-300">
            {suggestion.simpleExplanation || suggestion.message}
          </p>
        )}

        {selectedFormat === 'steps' && suggestion.steps && (
          <ol className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
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
      </div>

      {/* Action CTA if present */}
      {suggestion.actionText && onAction && (
        <button
          onClick={onAction}
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
        >
          <span>{suggestion.actionText}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* User Controls & Feedback Loop */}
      <div className="border-t border-slate-100 pt-2.5 dark:border-slate-800 space-y-2 text-xs">
        {disabledNotice ? (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
            <BellOff className="h-3.5 w-3.5" />
            <span>Automatic suggestions disabled. You can re-enable anytime in Settings.</span>
          </div>
        ) : feedbackSent ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
            <Check className="h-3.5 w-3.5" />
            <span>Thank you! Feedback recorded ({feedbackHelpful ? 'Yes, Helpful' : 'No, Not Helpful'}).</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Was this guidance helpful?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleFeedback(true)}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                aria-label="Mark helpful"
              >
                <ThumbsUp className="h-3 w-3 text-emerald-600" />
                <span className="text-[11px] font-medium">Yes</span>
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-slate-700 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                aria-label="Mark unhelpful"
              >
                <ThumbsDown className="h-3 w-3 text-rose-600" />
                <span className="text-[11px] font-medium">No</span>
              </button>
            </div>
          </div>
        )}

        {/* User sovereignty action: Disable automatic suggestions */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/60 text-[11px] text-slate-400">
          <button
            type="button"
            onClick={handleDisableAutoSuggestions}
            className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline cursor-pointer flex items-center gap-1"
          >
            <BellOff className="h-3 w-3" />
            <span>Turn off automatic suggestions</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
