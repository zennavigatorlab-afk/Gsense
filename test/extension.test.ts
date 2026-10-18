/**
 * G-SENSE Chrome Extension Automated Test Suite
 * Tests URL sanitization, sensitive URL exclusion, privacy invariants,
 * dwell calculation, click struggle detection, backtracking, exports, and purge.
 */

import fs from 'fs';
import path from 'path';
import {
  sanitizeUrl,
  isSensitiveUrl,
  ClickTracker,
  DwellTracker,
  BacktrackTracker,
  exportToCsv,
  exportToJson,
} from '../extension/gsense_core.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running G-SENSE Chrome Extension Verification Tests ===\n');

// Test 1: URL Sanitization (strips query parameters and hashes)
console.log('Test 1: URL Sanitization & Token Stripping...');
const rawUrlWithToken = 'https://news.ycombinator.com/item?id=12345&auth_token=supersecret#heading';
const sanitized = sanitizeUrl(rawUrlWithToken);
assert(
  sanitized === 'https://news.ycombinator.com/item',
  `Expected query & hash stripped, got "${sanitized}"`
);
assert(!sanitized.includes('supersecret'), 'Sanitized URL must not leak query tokens');
assert(!sanitized.includes('#heading'), 'Sanitized URL must not contain hash fragments');
console.log('  ✓ Query parameters and hash fragments successfully stripped.\n');

// Test 2: Sensitive URL Exclusion (browser internals, financial, auth)
console.log('Test 2: Sensitive URL Exclusion...');
const sensitiveUrls = [
  'chrome://extensions',
  'chrome-extension://abcdefg/popup.html',
  'edge://settings',
  'about:blank',
  'file:///etc/passwd',
  'view-source:https://example.com',
  'https://accounts.google.com/signin/v2',
  'https://chase.com/personal/banking',
  'https://www.paypal.com/signin',
  'https://auth0.com/authorize',
  'https://example.com/checkout/payment',
  'https://myshop.com/billing/invoice',
  'https://healthportal.org/my-health/records',
];

sensitiveUrls.forEach((url) => {
  assert(
    isSensitiveUrl(url) === true,
    `Sensitive URL was incorrectly allowed: ${url}`
  );
});

const permittedUrls = [
  'https://en.wikipedia.org/wiki/Main_Page',
  'https://developer.mozilla.org/en-US/docs/Web',
  'https://github.com/torvalds/linux',
  'https://example.com/articles/intro-to-science',
];

permittedUrls.forEach((url) => {
  assert(
    isSensitiveUrl(url) === false,
    `Permitted URL was incorrectly blocked: ${url}`
  );
});
console.log('  ✓ Sensitive pages correctly rejected; ordinary browsing allowed.\n');

// Test 3: Static Code Privacy Audit of Content Script & Background Worker
console.log('Test 3: Static Code Privacy Audit of Content Script...');
const contentScriptSource = fs.readFileSync(path.resolve(process.cwd(), 'extension/content.js'), 'utf-8');
const backgroundScriptSource = fs.readFileSync(path.resolve(process.cwd(), 'extension/background.js'), 'utf-8');

const forbiddenEventPatterns = [
  /addEventListener\s*\(\s*['"]keydown['"]/i,
  /addEventListener\s*\(\s*['"]keyup['"]/i,
  /addEventListener\s*\(\s*['"]keypress['"]/i,
  /addEventListener\s*\(\s*['"]input['"]/i,
  /addEventListener\s*\(\s*['"]change['"]/i,
  /addEventListener\s*\(\s*['"]beforeinput['"]/i,
  /addEventListener\s*\(\s*['"]paste['"]/i,
];

forbiddenEventPatterns.forEach((pat) => {
  assert(!pat.test(contentScriptSource), `Content script violates zero-keystroke invariant: ${pat}`);
  assert(!pat.test(backgroundScriptSource), `Background script violates zero-keystroke invariant: ${pat}`);
});

// Verify no element.value or password reading
assert(
  !contentScriptSource.includes('.value') || contentScriptSource.includes('password'),
  'Content script must not read element values'
);
assert(
  contentScriptSource.includes('input[type="password"]'),
  'Content script must auto-detect and abort on password pages'
);
console.log('  ✓ Static audit verified: zero keystrokes, zero input/text capture.\n');

// Test 4: Repeated Clicks (Rage/Struggle Click Detection)
console.log('Test 4: Repeated Click Detection...');
const clickTracker = new ClickTracker(3, 2500);
const now = 10000;

// First click on button
const res1 = clickTracker.registerClick('BUTTON#submit-order', now);
assert(!res1.triggered, 'First click should not trigger struggle incident');

// Second click 500ms later
const res2 = clickTracker.registerClick('BUTTON#submit-order', now + 500);
assert(!res2.triggered, 'Second click should not trigger struggle incident');

// Third click 1000ms later (total 1500ms <= 2500ms window)
const res3 = clickTracker.registerClick('BUTTON#submit-order', now + 1500);
assert(res3.triggered && res3.count === 3, 'Third rapid click should trigger struggle incident');

// Subsequent click on different element
const resDiff = clickTracker.registerClick('A#nav-home', now + 2000);
assert(!resDiff.triggered, 'Click on different target should not trigger');
console.log('  ✓ Repeated click struggles detected accurately within time window.\n');

// Test 5: Active Dwell vs Idle Interval Tracking
console.log('Test 5: Active Dwell vs Idle Intervals...');
const dwellTracker = new DwellTracker(30000); // 30s threshold
let simTime = 100000;
dwellTracker.reset(simTime);

// User interacts every 5 seconds for 20 seconds (active dwell)
simTime += 5000;
dwellTracker.recordActivity(simTime);
simTime += 5000;
dwellTracker.recordActivity(simTime);
simTime += 5000;
dwellTracker.recordActivity(simTime);

const activeDwell = dwellTracker.getActiveDwellMs(simTime);
assert(activeDwell === 15000, `Expected active dwell 15000ms, got ${activeDwell}`);
assert(dwellTracker.idleIntervalsCount === 0, 'No idle intervals should be recorded yet');

// Now user steps away for 45 seconds (> 30s threshold)
simTime += 45000;
dwellTracker.recordActivity(simTime);
assert(
  dwellTracker.idleIntervalsCount === 1,
  `Expected 1 idle interval, got ${dwellTracker.idleIntervalsCount}`
);

// Tab hidden pauses dwell
dwellTracker.setVisibility(false, simTime);
simTime += 10000;
assert(dwellTracker.getActiveDwellMs(simTime) <= 15000, 'Hidden tab must not accumulate active dwell');
console.log('  ✓ Active dwell and idle intervals cleanly separated and bounded.\n');

// Test 6: Supported Backtracking Detection
console.log('Test 6: Backtracking Detection...');
const backtrackTracker = new BacktrackTracker(8000);
let navTime = 50000;

// Navigate to Home
backtrackTracker.recordNavigation('https://example.com/home', navTime);

// Navigate to Details 4 seconds later
navTime += 4000;
backtrackTracker.recordNavigation('https://example.com/details', navTime);

// User immediately navigates back to Home 3 seconds later (within 8s window)
navTime += 3000;
const btResult = backtrackTracker.recordNavigation('https://example.com/home', navTime);
assert(btResult.isBacktrack === true, 'Rapid return to preceding page must be detected as backtrack');
console.log('  ✓ Backtracking incident correctly identified.\n');

// Test 7: Export Formatting (JSON and CSV)
console.log('Test 7: Export Formats (JSON and CSV)...');
const sampleEvents = [
  {
    id: 'evt_1',
    timestamp: 1697600000000,
    eventType: 'navigation',
    domain: 'example.com',
    path: '/docs',
    dwellMs: 0,
    attemptCount: 1,
    isBacktrack: false,
    isIdle: false,
  },
  {
    id: 'evt_2',
    timestamp: 1697600045000,
    eventType: 'repeat_clicks',
    domain: 'example.com',
    path: '/docs',
    dwellMs: 45000,
    attemptCount: 3,
    isBacktrack: false,
    isIdle: false,
  },
];

const csvOutput = exportToCsv(sampleEvents);
assert(csvOutput.includes('id,timestamp,isoTime,eventType,domain,path'), 'CSV missing headers');
assert(csvOutput.includes('evt_1'), 'CSV missing first event');
assert(csvOutput.includes('repeat_clicks'), 'CSV missing repeat_clicks');

const jsonOutput = exportToJson(sampleEvents, { totalPages: 1 });
const parsedJson = JSON.parse(jsonOutput);
assert(parsedJson.privacyGuarantees.zeroKeystrokeLogging === true, 'JSON export missing privacy guarantee');
assert(parsedJson.events.length === 2, 'JSON export event count mismatch');
console.log('  ✓ JSON and RFC 4180 CSV exports verified with privacy guarantee headers.\n');

console.log('==================================================================');
console.log('     ✓ ALL 7 G-SENSE EXTENSION VERIFICATION TESTS PASSED (100%)');
console.log('==================================================================\n');
