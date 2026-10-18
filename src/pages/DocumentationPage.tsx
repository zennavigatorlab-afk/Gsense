import React, { useState } from 'react';
import {
  FileText,
  Database,
  Code,
  Github,
  Server,
  Search,
  Check,
  Copy,
  Terminal,
  ShieldAlert,
  Smartphone,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'supabase' | 'github' | 'vercel' | 'gsc' | 'windows' | 'pwa_android'>('quickstart');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sqlMigrationCode = `-- ==============================================================================
-- G-SENSE Database Schema & Row-Level Security (RLS) Migrations
-- Migration: 20261018000000_gsense_schema.sql
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  learning_status TEXT DEFAULT 'active' CHECK (learning_status IN ('active', 'paused', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  assistance_level TEXT DEFAULT 'balanced' CHECK (assistance_level IN ('step_by_step', 'hints_only', 'minimal')),
  interaction_pace TEXT DEFAULT 'standard' CHECK (interaction_pace IN ('relaxed', 'standard', 'fast')),
  hesitation_threshold_ms INTEGER DEFAULT 8000,
  repeat_attempts_trigger INTEGER DEFAULT 3,
  camera_sensing_enabled BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- 3. Interaction Events Table (Zero raw text/passwords)
CREATE TABLE IF NOT EXISTS public.interaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  screen_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  component_type TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  hesitation_ms INTEGER DEFAULT 0,
  is_correction BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own events"
  ON public.interaction_events FOR ALL USING (auth.uid() = user_id);

-- 4. Learning Summaries Table
CREATE TABLE IF NOT EXISTS public.learning_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  total_events_analyzed INTEGER DEFAULT 0,
  avg_hesitation_ms NUMERIC(10, 2) DEFAULT 0,
  correction_rate NUMERIC(5, 4) DEFAULT 0,
  repeat_attempt_rate NUMERIC(5, 4) DEFAULT 0,
  confidence_score NUMERIC(5, 4) DEFAULT 0,
  recommended_assistance_level TEXT
);

ALTER TABLE public.learning_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own summaries"
  ON public.learning_summaries FOR ALL USING (auth.uid() = user_id);

-- 5. Assistance Feedback Table
CREATE TABLE IF NOT EXISTS public.assistance_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL,
  screen_id TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  was_helpful BOOLEAN NOT NULL,
  user_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.assistance_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback"
  ON public.assistance_feedback FOR ALL USING (auth.uid() = user_id);`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Developer & Engineering Manual
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
          Technical Documentation
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Comprehensive guides covering the local development environment, Supabase database schemas, GitHub version control, Vercel edge deployment, and Google Search Console verification.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'quickstart', label: '1. Quickstart & Local Run' },
          { id: 'supabase', label: '2. Supabase SQL & RLS' },
          { id: 'github', label: '3. GitHub Upload Guide' },
          { id: 'vercel', label: '4. Vercel Deployment' },
          { id: 'gsc', label: '5. Google Search Console' },
          { id: 'windows', label: '6. Windows Desktop & CI Build' },
          { id: 'pwa_android', label: '7. Android PWA & Mobile Installation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Quickstart */}
      {activeTab === 'quickstart' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Running G-SENSE Locally
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Execute the following shell commands to install dependencies, run the test suite, and launch the Vite development server:
            </p>
            <div className="relative rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
              <button
                onClick={() =>
                  handleCopy(
                    'quickstart_cmd',
                    `npm install\nnpm test\nnpm run dev`
                  )
                }
                className="absolute top-3 right-3 rounded bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                title="Copy commands"
              >
                {copiedKey === 'quickstart_cmd' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <code>
                # 1. Install dependencies<br />
                npm install<br /><br />
                # 2. Run engine automated test suite<br />
                npm test<br /><br />
                # 3. Start local development server on port 3000<br />
                npm run dev
              </code>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Environment Variables (.env.local)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Create a <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.env.local</code> file in the project root:
            </p>
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
              <code>
                APP_URL="http://localhost:3000"<br />
                VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"<br />
                VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
              </code>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Security Rule: Never place the Supabase service_role key into client environment variables.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Supabase */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Supabase Database Migrations
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Located at: <code className="font-mono">supabase/migrations/20261018000000_gsense_schema.sql</code>
                </p>
              </div>
              <button
                onClick={() => handleCopy('sql', sqlMigrationCode)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {copiedKey === 'sql' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedKey === 'sql' ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>

            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 max-h-96 overflow-y-auto">
              <pre>{sqlMigrationCode}</pre>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200">How to apply in Supabase:</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to your Supabase Project Dashboard (<code className="font-mono">supabase.com</code>).</li>
                <li>Navigate to the <strong>SQL Editor</strong> tab on the left sidebar.</li>
                <li>Click <strong>New query</strong> and paste the migration SQL above.</li>
                <li>Click <strong>Run</strong>. All 5 tables with Row-Level Security policies will be provisioned.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: GitHub */}
      {activeTab === 'github' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Uploading G-SENSE to GitHub
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Follow these commands to push the project repository to GitHub:
            </p>
            <div className="relative rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
              <button
                onClick={() =>
                  handleCopy(
                    'gh_cmd',
                    `git init\ngit add .\ngit commit -m "feat: complete initial release of G-SENSE AdaptiveAssistant"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/g-sense.git\ngit push -u origin main`
                  )
                }
                className="absolute top-3 right-3 rounded bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                title="Copy Git commands"
              >
                {copiedKey === 'gh_cmd' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <code>
                # Initialize Git repository<br />
                git init<br /><br />
                # Stage all source files (.gitignore prevents secrets or node_modules)<br />
                git add .<br /><br />
                # Commit project files<br />
                git commit -m "feat: complete initial release of G-SENSE AdaptiveAssistant"<br /><br />
                # Set default branch to main<br />
                git branch -M main<br /><br />
                # Attach your GitHub remote repository<br />
                git remote add origin https://github.com/YOUR_USERNAME/g-sense.git<br /><br />
                # Push main branch<br />
                git push -u origin main
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Vercel */}
      {activeTab === 'vercel' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Deploying G-SENSE to Vercel
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              G-SENSE is pre-configured with a root <code className="font-mono">vercel.json</code> supporting SPA URL rewrites and security response headers.
            </p>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="font-semibold text-slate-900 dark:text-white">Step-by-step Vercel Import:</div>
              <ol className="list-decimal list-inside space-y-2">
                <li>Visit <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">vercel.com/new</a> and log in.</li>
                <li>Import your GitHub repository (<code className="font-mono">YOUR_USERNAME/g-sense</code>).</li>
                <li>Framework Preset: Vercel will automatically detect <strong>Vite</strong>.</li>
                <li>Build Command: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">npm run build</code></li>
                <li>Output Directory: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">dist</code></li>
                <li>Configure Environment Variables:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-500 dark:text-slate-400">
                    <li><code className="font-mono">VITE_SUPABASE_URL</code></li>
                    <li><code className="font-mono">VITE_SUPABASE_ANON_KEY</code></li>
                    <li><code className="font-mono">APP_URL</code> (Your Vercel domain e.g. <code className="font-mono">https://g-sense.vercel.app</code>)</li>
                  </ul>
                </li>
                <li>Click <strong>Deploy</strong>.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Google Search Console */}
      {activeTab === 'gsc' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Google Search Console (GSC) Integration Guide
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The public website includes canonical tags, OpenGraph metadata, a valid <code className="font-mono">sitemap.xml</code>, and <code className="font-mono">robots.txt</code> with indexing prevention on private profile pages.
            </p>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="font-semibold text-slate-900 dark:text-white">Verification & Submission Procedure:</div>
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google Search Console</a>.</li>
                <li>Click <strong>Add Property</strong> and select <strong>Domain</strong> (or URL Prefix with your production HTTPS URL).</li>
                <li>Verify ownership:
                  <ul className="list-disc list-inside ml-4 mt-1 text-slate-500 dark:text-slate-400">
                    <li><strong>DNS Verification (Recommended):</strong> Add the TXT record provided by Google to your domain registrar (e.g., Cloudflare, Namecheap, Google Domains).</li>
                    <li><strong>HTML Tag:</strong> Place the provided meta tag into <code className="font-mono">index.html</code>.</li>
                  </ul>
                </li>
                <li>Once verified, navigate to <strong>Sitemaps</strong> in the left sidebar.</li>
                <li>Enter <code className="font-mono text-blue-600 dark:text-blue-400">sitemap.xml</code> and click <strong>Submit</strong>.</li>
                <li>Use the <strong>URL Inspection</strong> tool to inspect <code className="font-mono">https://your-domain.com/</code> and request indexing once live.</li>
              </ol>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400">
              Honest status: Google Search Console requires domain ownership verification and active web crawling; pages cannot be marked as indexed until domain verification is completed by the domain administrator.
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Windows Desktop & CI Build */}
      {activeTab === 'windows' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Windows Desktop Architecture & CI Packaging
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The G-SENSE Desktop software provides native interaction pattern assistance for Windows. It features a local Tkinter UI, SQLite persistence, and an opt-in active-window tracker with UI Automation support.
            </p>

            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-xs space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white">Privacy Invariants:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                <li><strong>Zero Keystroke / Text Logging:</strong> Never hooks keyboard, reads input fields, passwords, or clipboard.</li>
                <li><strong>Sensitive Window Auto-Exclusion:</strong> Financial portals, password managers, and private browsing are dropped.</li>
                <li><strong>Permitted UI Automation Only:</strong> Only buttons, tabs, and menu items are inspected; edit controls are strictly blocked.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">Automated GitHub Actions CI Workflow:</div>
              <div className="relative rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
                <code>
                  # Workflow File: .github/workflows/windows_build.yml<br />
                  # Runner: windows-latest (x86_64)<br />
                  # Steps: checkout -&gt; setup python 3.11 -&gt; run test_desktop.py (8/8) -&gt; build via PyInstaller<br />
                  # Artifact: dist/GSense-AdaptiveAssistant.exe (with SHA-256 checksum)<br />
                  # Triggers: push to main/master, tags (v*), PRs, or workflow_dispatch
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">Local Run & Verification Commands:</div>
              <div className="relative rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
                <button
                  onClick={() =>
                    handleCopy(
                      'win_cmd',
                      `cd desktop\npip install -r requirements.txt\npython test_desktop.py\npython app.py\npython build_windows.py --build`
                    )
                  }
                  className="absolute top-3 right-3 rounded bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                  title="Copy commands"
                >
                  {copiedKey === 'win_cmd' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <code>
                  cd desktop<br />
                  pip install -r requirements.txt<br />
                  python test_desktop.py          # Runs all 8 verification tests<br />
                  python app.py                   # Launches Tkinter GUI<br />
                  python build_windows.py --build # Builds 64-bit EXE on Windows host
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Android PWA & Mobile Installation */}
      {activeTab === 'pwa_android' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Android PWA Installation &amp; Mobile Interaction Research
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                G-SENSE provides full Progressive Web App (PWA) support compliant with the W3C Web App Manifest specification, service worker offline shell caching, and standalone display mode across supported Android browsers (Google Chrome, Brave, Edge).
              </p>
            </div>

            {/* Step-by-Step for Xiaomi Redmi 9 & Chrome on Android */}
            <div className="rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Installation Steps for Xiaomi Redmi 9 (Chrome on Android / MIUI)</span>
              </h3>

              <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-mono text-[11px] font-bold">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Open in Google Chrome:</strong> Launch Google Chrome on your Redmi 9 and open your live G-SENSE deployment URL (e.g. <code>https://gsense.vercel.app/</code>).
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-mono text-[11px] font-bold">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Trigger Install:</strong> Tap the <strong>Install PWA</strong> button in the navigation bar, or tap Chrome&apos;s three vertical dots (<strong>⋮</strong>) in the top-right corner and select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-mono text-[11px] font-bold">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Confirm Installation:</strong> Tap <strong>Install</strong> on the browser confirmation modal. Android will create a standalone launcher icon with the official G-SENSE adaptive synapse mark.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-mono text-[11px] font-bold">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">MIUI Permission Check (Redmi 9):</strong> If MIUI does not automatically place the icon on your home screen, go to your phone&apos;s <em>Settings &gt; Apps &gt; Manage Apps &gt; Chrome &gt; Other Permissions</em>, and ensure <strong>&quot;Home screen shortcuts&quot;</strong> is set to <strong>Always allow</strong>.
                  </div>
                </li>
              </ol>
            </div>

            {/* Offline Fallback & Cache Scoping */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Service Worker Caching &amp; Offline Fallback Architecture
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                The service worker is configured via <code>vite-plugin-pwa</code> using Google Workbox. It precaches the static application shell (HTML, CSS, JS chunks, and brand icon assets) and caches Google Fonts via a <code>CacheFirst</code> strategy.
              </p>
              <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Privacy Invariant: Zero Sensitive Caching</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  The Service Worker explicitly bypasses caching for all API routes (<code>/api/*</code>) and Supabase database/auth requests (<code>*.supabase.co</code>). User profiles, authentication tokens, and private telemetry are NEVER saved in the browser&apos;s service worker cache.
                </p>
              </div>
            </div>

            {/* Known Limitations */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Known Limitations &amp; Security Boundaries</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50 dark:bg-slate-950">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">
                    1. Sandbox Isolation (No Cross-App Snooping)
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    The PWA runs strictly inside the secure browser sandbox. It cannot track touches or inputs in other Android applications. In accordance with user privacy invariants, G-SENSE never accesses other apps, keystrokes, passwords, clipboard, or notifications.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50 dark:bg-slate-950">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">
                    2. Background Execution &amp; Doze Mode
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Android power management suspends Web Workers and timers when the PWA is backgrounded. G-SENSE uses the Page Visibility API to freeze dwell clocks so that backgrounding does not skew cognitive hesitation metrics.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50 dark:bg-slate-950">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">
                    3. MIUI Aggressive RAM Reclamation
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    On devices like the Redmi 9 with 3GB/4GB RAM, MIUI may aggressively discard background tabs. G-SENSE saves all consented profile states to <code>localStorage</code> immediately to ensure zero state loss upon app resume.
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50 dark:bg-slate-950">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">
                    4. iOS Safari Installation Flow
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    WebKit on iOS does not support the Chromium <code>beforeinstallprompt</code> event. iOS users must use the native Safari Share sheet &gt; &quot;Add to Home Screen&quot;. In-app guidance is provided automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
