# G-SENSE — AdaptiveAssistant

> **Meaning**: **G** = Good; **SENSE** = learning interaction patterns.  
> **Tagline**: AdaptiveAssistant  

G-SENSE is an ethical adaptive interaction assistant that observes friction points, hesitation dwell intervals, repeated attempts, and correction backtracks within application interfaces to provide contextual, non-intrusive step-by-step guidance without ever recording keystroke content, typed passwords, or private messages.

---

## 1. Project File Tree

```
├── .env.example                               # Safe environment variables template
├── .gitignore                                 # Git ignore (protects .env*, node_modules, dist)
├── index.html                                 # HTML5 entry with SEO, OpenGraph & Schema.org JSON-LD
├── metadata.json                              # Applet metadata, camera frame permissions & capabilities
├── package.json                               # Dependencies & npm scripts
├── tsconfig.json                              # TypeScript strict configuration
├── vercel.json                                # Vercel SPA routing and security headers
├── vite.config.ts                             # Vite + React + Tailwind v4 config
│
├── public/
│   ├── robots.txt                             # Crawl rules (disallows private /profile, /dashboard)
│   └── sitemap.xml                            # XML sitemap with canonical endpoints
│
├── src/
│   ├── App.tsx                                # Main app shell with navigation & theme management
│   ├── index.css                              # Tailwind v4 import & font styling
│   ├── main.tsx                               # React root renderer
│   │
│   ├── components/
│   │   ├── AdaptiveAssistantOverlay.tsx       # Non-intrusive guidance card with user feedback loop
│   │   ├── CameraSensingModal.tsx             # Privacy-first optional local presence sensor
│   │   ├── Footer.tsx                         # Architectural footer & copyright
│   │   ├── Logo.tsx                           # Clean SVG brain/circuit symbol with blue accents
│   │   └── Navbar.tsx                         # Strict 3-zone Top Bar Contract navigation
│   │
│   ├── lib/
│   │   ├── learningEngine.ts                  # Client-side G-SENSE rule & statistical learning engine
│   │   └── supabaseClient.ts                  # Supabase client with safe local fallback storage
│   │
│   ├── pages/
│   │   ├── AuthPage.tsx                       # Supabase Google OAuth & email auth
│   │   ├── ContactPage.tsx                    # Contact & inquiry form with validation
│   │   ├── DashboardPage.tsx                  # Human Interaction Analysis Dashboard
│   │   ├── DocumentationPage.tsx              # Setup guides, SQL migrations, Git & Vercel manual
│   │   ├── DownloadsPage.tsx                  # System specifications & platform release statuses
│   │   ├── FeaturesPage.tsx                   # Architectural pillars & guidance spectrum
│   │   ├── HomePage.tsx                       # Hero, live interaction sandbox & trust badges
│   │   ├── HowItWorksPage.tsx                 # Mathematical formulas & decision matrices
│   │   ├── PrivacyPage.tsx                    # Privacy manifesto & interactive data purge controls
│   │   └── ProfilePage.tsx                    # Editable assistance preferences & account deletion
│   │
│   └── types/
│       └── index.ts                           # Domain TypeScript interfaces
│
├── desktop/
│   ├── app.py                                 # Windows desktop Tkinter GUI application
│   ├── build_windows.py                       # Packaging script & PyInstaller spec generator
│   ├── gsense_engine.py                       # Modular Python learning engine
│   ├── README.md                              # Desktop packaging & execution guide
│   ├── requirements.txt                       # Python dependencies
│   └── storage.py                             # Local SQLite database manager
│
├── android/
│   ├── AndroidArchitecture.md                 # Touch interaction & background limits architecture
│   └── InteractionTracker.kt                  # Kotlin reference tracker for in-app gestures
│
├── supabase/
│   └── migrations/
│       └── 20261018000000_gsense_schema.sql  # Supabase tables, RLS policies, indexes & triggers
│
└── test/
    └── engine.test.ts                         # Automated tests for rule engine & privacy invariants
```

---

## 2. Core Architectural Guarantees & Privacy Manifesto

- **Zero Keystroke / Raw Content Logging**: G-SENSE never records typed passwords, search inputs, personal messages, or screen pixels.
- **Permitted Interaction Metadata Only**: The engine records structural features: `screen_id`, `component_type`, `attempt_count`, `hesitation_ms`, `is_correction`, and timestamps.
- **Transparent Mathematical Rules**: Metric calculations ($Hesitation Dwell$, $Correction Rate$, $Repeat Rate$, $Statistical Confidence$) are visible and inspectable.
- **No Hallucinated Scores or Psychic Claims**: Never claims to read emotions, thoughts, or human IQ.
- **User Sovereignty**: Users can pause learning, inspect raw event logs, export data as JSON/CSV, or purge all records permanently at any time.

---

## 3. Local Run Instructions

### Prerequisites
- Node.js 18+ or Node.js 22+
- npm 9+

### Execution Commands
```bash
# 1. Install dependencies
npm install

# 2. Run engine automated test suite
npm test

# 3. Launch local development server
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 4. Supabase Setup & SQL Migrations

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Open `supabase/migrations/20261018000000_gsense_schema.sql` and execute the script.
4. Copy your Project URL and anon public key from **Project Settings > API**.
5. Create `.env.local` in your root folder:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key"
   ```
*Note: If no Supabase environment variables are provided, G-SENSE gracefully uses local browser storage without crashing.*

---

## 5. GitHub Upload Instructions

```bash
# Initialize git repository
git init

# Stage all files (node_modules, .env.local, and dist are safely excluded by .gitignore)
git add .

# Commit files
git commit -m "feat: complete functional release of G-SENSE AdaptiveAssistant"

# Set branch name to main
git branch -M main

# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/g-sense.git

# Push to GitHub
git push -u origin main
```

---

## 6. Vercel Deployment Instructions

1. Push your repository to GitHub.
2. Sign in to [vercel.com](https://vercel.com) and click **Add New > Project**.
3. Import your `g-sense` GitHub repository.
4. Framework preset will automatically detect **Vite**.
5. Build Command: `npm run build` | Output Directory: `dist`.
6. Add your Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `APP_URL`
7. Click **Deploy**. Vercel will build and host the application with SPA routing handled by `vercel.json`.

---

## 7. Google Search Console Integration

1. Go to [search.google.com/search-console](https://search.google.com/search-console).
2. Add Property (Domain or URL Prefix for your live production URL).
3. Complete DNS verification via TXT record at your registrar.
4. Submit `sitemap.xml` under the **Sitemaps** panel.
5. Review crawl status and indexing using the **URL Inspection** tool.
*(Note: Private authenticated pages such as `/profile` and data export routes are explicitly disallowed in `/public/robots.txt`)*.

---

## 8. Test Execution & Results

Automated test suite (`test/engine.test.ts`):
- **Test 1**: Empty state computation without division-by-zero errors -> **PASSED**
- **Test 2**: Privacy invariants (zero text or password logging) -> **PASSED**
- **Test 3**: Repeat attempt detection & threshold triggering -> **PASSED**
- **Test 4**: Statistical confidence score bounded in [0, 1] range -> **PASSED**
- **Test 5**: User pause compliance (zero telemetry while paused) -> **PASSED**
- **Test 6**: Data export as valid JSON and complete memory purge -> **PASSED**

---

## 9. Working Features & Current Limitations

### Working & Tested Features
- [x] Original G-SENSE SVG logo with brain/circuit styling and blue accents.
- [x] Responsive official website with Home, Features, How It Works, Downloads, Docs, Privacy, Contact, Sign In, and Profile pages.
- [x] Strict Top Bar Contract navigation with Light/Dark mode switcher.
- [x] Live interactive sandbox on the homepage for testing repeated attempts, pauses, and corrections.
- [x] Client-side TypeScript learning engine and modular Python desktop learning engine.
- [x] Functional Human Interaction Analysis Dashboard computing real dwell times, repeat rates, correction ratios, and statistical confidence.
- [x] Non-intrusive adaptive assistant guidance overlay with user feedback loop (`Was this helpful? Yes / No`).
- [x] Supabase authentication with Google sign-in, email auth, and resilient local fallback mode.
- [x] Privacy-first optional camera sensing module with local HTML5 canvas differencing and immediate disable.
- [x] Full data sovereignty: Pause learning, export JSON/CSV, purge records, and delete account.
- [x] Production Supabase migration script with Row Level Security policies.
- [x] SEO configuration: sitemap.xml, robots.txt, OpenGraph, Twitter cards, and Schema.org WebApplication structured data.

### Transparent Platform Limitations
- **Windows Executable**: Windows PE binaries (`.exe`) require a native Windows host or Windows CI runner (such as GitHub Actions `windows-latest`) to compile and sign. Source code, Python GUI (`app.py`), and PyInstaller spec (`GSense.spec`) are included.
- **Android App**: Currently in Architecture and Reference Design phase (`android/InteractionTracker.kt` and `android/AndroidArchitecture.md`). Cross-app surveillance is intentionally blocked by Android security sandboxes.
- **Search Console Indexing**: Google Search Console indexing requires an active domain owner to complete DNS verification and wait for Google's crawler.
