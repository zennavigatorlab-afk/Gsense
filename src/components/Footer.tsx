import React from 'react';
import { Logo } from './Logo';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <Logo size={26} showText={true} />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              <strong>G-SENSE</strong> — AdaptiveAssistant. <br />
              <span className="text-slate-600 dark:text-slate-300">Meaning: <strong>G</strong> = Good; <strong>SENSE</strong> = learning interaction patterns.</span><br />
              Personalized, privacy-first interaction guidance without reading raw text, private messages, or passwords.
            </p>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Open architecture · Local-first telemetry · Supabase RLS security
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Application
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('features')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  Features & Pillars
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  How It Works & Math
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  Pattern Analysis Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('research')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-blue-600 dark:text-blue-400 font-medium"
                >
                  Adaptive Interaction Research
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('downloads')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  Downloads &amp; System Specs
                </button>
              </li>
            </ul>
          </div>

          {/* Resources & Privacy */}
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Trust & Deployment
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer font-medium"
                >
                  Privacy Manifesto & Data Deletion
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('docs')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  Documentation & SQL Migrations
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  Contact & Support
                </button>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-600">
                  Target: Web / Win10+ / Android
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-100 dark:border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()} G-SENSE project. Licensed under Apache-2.0.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('privacy')}
              className="hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <button
              onClick={() => onNavigate('docs')}
              className="hover:underline cursor-pointer"
            >
              Vercel & GitHub Guide
            </button>
            <span>·</span>
            <button
              onClick={() => onNavigate('downloads')}
              className="hover:underline cursor-pointer"
            >
              Windows Spec
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
