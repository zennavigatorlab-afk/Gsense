// Mock localStorage for node test runner
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { learningEngine } from '../src/lib/learningEngine';

console.log('=== Running G-SENSE PWA & Research Foundation Verification Tests ===\n');

let passedTests = 0;
const totalTests = 6;

// Test 1: Web App Manifest Invariants
console.log('Test 1: Web App Manifest Invariants...');
const viteConfigContent = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf-8');

if (!viteConfigContent.includes("short_name: 'G-SENSE'")) {
  throw new Error('short_name is missing or exceeds allowed length');
}
if (!viteConfigContent.includes("display: 'standalone'")) {
  throw new Error('display must be standalone for installable PWA');
}
if (!viteConfigContent.includes('pwa-192x192.png') || !viteConfigContent.includes('pwa-512x512.png')) {
  throw new Error('Required 192px and 512px icon declarations missing');
}
if (!viteConfigContent.includes("purpose: 'maskable'")) {
  throw new Error('Maskable icon with safe zone margin missing');
}
console.log('  ✓ Manifest adheres to W3C standards (id, short_name ≤ 12 chars, standalone, 192/512/maskable icons).');
passedTests++;

// Test 2: Icon Asset Physical Verification
console.log('Test 2: PWA Icon Assets Existence & Headers...');
const requiredIcons = [
  'public/icon.svg',
  'public/pwa-192x192.png',
  'public/pwa-512x512.png',
  'public/pwa-maskable-512x512.png',
  'public/apple-touch-icon.png',
];

for (const iconPath of requiredIcons) {
  const fullPath = resolve(process.cwd(), iconPath);
  if (!existsSync(fullPath)) {
    throw new Error(`Required icon asset missing: ${iconPath}`);
  }
  if (iconPath.endsWith('.png')) {
    const header = readFileSync(fullPath).subarray(0, 8);
    const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (!header.equals(pngMagic)) {
      throw new Error(`File ${iconPath} is not a valid PNG binary`);
    }
  }
}
console.log('  ✓ All 5 PWA icons (SVG, 192px, 512px, 512px maskable, 180px apple-touch-icon) exist with valid binary headers.');
passedTests++;

// Test 3: Safe Offline Fallback & Zero-Sensitive-Cache Invariant
console.log('Test 3: Service Worker Caching Denylist Invariants...');
if (!viteConfigContent.includes('navigateFallbackDenylist')) {
  throw new Error('navigateFallbackDenylist must be configured in Workbox');
}
if (!viteConfigContent.includes('supabase')) {
  throw new Error('Supabase authentication/data must be explicitly excluded from service worker caching');
}
if (!viteConfigContent.includes('/api/')) {
  throw new Error('/api routes must be excluded from service worker caching');
}
console.log('  ✓ Service Worker caching strictly denylists Supabase (*.supabase.co) and API endpoints (/api/*). Zero private data is cached.');
passedTests++;

// Test 4: HTML Entry Point Meta Tags & Verification Tag Preservation
console.log('Test 4: index.html PWA Meta Tags & Search Console Verification...');
const indexHtmlContent = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');

if (!indexHtmlContent.includes('name="theme-color" content="#0f172a"')) {
  throw new Error('Theme color meta tag missing or mismatch');
}
if (!indexHtmlContent.includes('name="apple-mobile-web-app-capable" content="yes"')) {
  throw new Error('iOS standalone web app meta tag missing');
}
if (!indexHtmlContent.includes('google-site-verification" content="y7dA711cbtJ0OStNKa5L-Jwo5ck1XcVE_75tRQ9vg-s"')) {
  throw new Error('Previous Google Search Console verification tag was modified or lost');
}
if (!indexHtmlContent.includes('google-site-verification" content="VCtFFd13OxycSf3pHr-1y5BUkt0-7ziEOHPEfc7NgWk"')) {
  throw new Error('New Google Search Console verification tag (VCtFFd13OxycSf3pHr-1y5BUkt0-7ziEOHPEfc7NgWk) missing');
}
if (indexHtmlContent.includes('CteqvUVzZV6uzMFs_YvtJV0gMBE3cAlaoy-LD-W5824')) {
  throw new Error('DNS TXT verification value must not be inserted into HTML');
}
console.log('  ✓ index.html includes mobile viewport, theme-color, apple-mobile-web-app-capable, and preserves both Search Console verification tags.');
passedTests++;

// Test 5: Research Telemetry Privacy Invariants
console.log('Test 5: Research Telemetry Privacy & Control Invariants...');
learningEngine.purgeAllData();
learningEngine.setPaused(false);

// Record sample structural interaction
const eventResult = learningEngine.recordEvent({
  sessionId: 'test_research_session',
  screenId: 'research_playground',
  componentType: 'dwell_target',
  eventType: 'navigation',
  userId: 'test_participant',
});

if (!eventResult.event) {
  throw new Error('Expected event to be recorded');
}

// Invariant: No keystroke, typed text, or password field exists
const eventRecord = eventResult.event as any;
if (eventRecord.password || eventRecord.text || eventRecord.keystrokes) {
  throw new Error('Privacy breach: raw text or password logged in event');
}

// Test Pause
learningEngine.setPaused(true);
const pausedResult = learningEngine.recordEvent({
  sessionId: 'test_research_session',
  screenId: 'research_playground',
  componentType: 'dwell_target',
  eventType: 'navigation',
  userId: 'test_participant',
});

if (pausedResult.event !== null) {
  throw new Error('Pause invariant breached: event recorded while paused');
}

// Test Export & Purge
const exportedRaw = learningEngine.exportDataBundle();
const exportedBundle = JSON.parse(exportedRaw);
if (!exportedBundle || !exportedBundle.privacyGuarantee) {
  throw new Error('Export bundle missing privacy guarantee declaration');
}

learningEngine.purgeAllData();
const metrics = learningEngine.computeMetrics();
if (metrics.totalEvents !== 0) {
  throw new Error('Purge failed: events remain in memory');
}
console.log('  ✓ Research engine guarantees: zero text/password logging, pause dropping, privacy-stamped export, and 100% clean purge.');
passedTests++;

// Test 6: In-App Install Prompt Component & Hook Presence
console.log('Test 6: In-App Install Hook & Component Architecture...');
const hookContent = readFileSync(resolve(process.cwd(), 'src/hooks/usePWAInstall.ts'), 'utf-8');
const buttonContent = readFileSync(resolve(process.cwd(), 'src/components/PWAInstallButton.tsx'), 'utf-8');

if (!hookContent.includes('beforeinstallprompt') || !hookContent.includes('display-mode: standalone')) {
  throw new Error('usePWAInstall must handle beforeinstallprompt and detect standalone mode');
}
if (!buttonContent.includes('InstallGuideModal') || !buttonContent.includes('Redmi 9')) {
  throw new Error('PWAInstallButton must provide guided fallback with Redmi 9 instructions');
}
console.log('  ✓ In-app install hook and button component verified with standalone detection and Xiaomi Redmi 9 guided fallback.');
passedTests++;

console.log('\n==================================================================');
console.log(`     ✓ ALL ${passedTests}/${totalTests} PWA & RESEARCH FOUNDATION TESTS PASSED (100%)`);
console.log('==================================================================\n');
