import { GSenseBrowserEngine } from '../src/lib/learningEngine';
import { getLocalInteractionEvents, getLocalOfferedTips, getLocalFeedback } from '../src/lib/supabaseClient';

// Mock localStorage for node test runner
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running G-SENSE Real Interaction Engine & Privacy Tests ===\n');

storageMap.clear();
const engine = new GSenseBrowserEngine();

// Test 1: Configurable Thresholds & Real Repeat Triggers
console.log('Test 1: Configurable Thresholds & Repeat Attempts Trigger...');
engine.clearAllData();
engine.configureThresholds(6000, 2); // Set custom repeat trigger to 2
const thresholds = engine.getThresholds();
assert(thresholds.hesitationThresholdMs === 6000, 'Expected hesitationThresholdMs to be 6000');
assert(thresholds.repeatAttemptsTrigger === 2, 'Expected repeatAttemptsTrigger to be 2');

// 1st attempt
const res1 = engine.recordEvent({
  sessionId: 'test_real_sess',
  screenId: 'checkout_step',
  componentType: 'pay_btn',
  eventType: 'repeat_attempt',
  isSimulation: false,
});
assert(res1.event?.isSimulation === false, 'Event should be marked as real interaction (isSimulation: false)');
assert(res1.suggestion === null, '1st attempt should not trigger suggestion with threshold 2');

// 2nd attempt -> should trigger suggestion
const res2 = engine.recordEvent({
  sessionId: 'test_real_sess',
  screenId: 'checkout_step',
  componentType: 'pay_btn',
  eventType: 'repeat_attempt',
  isSimulation: false,
});
assert(res2.suggestion !== null, '2nd attempt must trigger suggestion under custom threshold 2');
assert(res2.suggestion?.level === 'step_by_step', 'Repeat struggle should offer step-by-step guidance');
assert(Boolean(res2.suggestion?.shortHint), 'Suggestion must include a shortHint');
assert(Boolean(res2.suggestion?.simpleExplanation), 'Suggestion must include a simpleExplanation');
assert(Boolean(res2.suggestion?.steps && res2.suggestion.steps.length > 0), 'Suggestion must include step-by-step steps');
console.log('  ✓ Configurable threshold verified: custom repeat threshold triggered 3-tier guidance.\n');

// Test 2: Frequency Capping & Duplicate Hint Suppression
console.log('Test 2: Cooldown & Duplicate Hint Suppression...');
// Immediate subsequent 3rd attempt on same component should be suppressed by cooldown
const res3 = engine.recordEvent({
  sessionId: 'test_real_sess',
  screenId: 'checkout_step',
  componentType: 'pay_btn',
  eventType: 'repeat_attempt',
  isSimulation: false,
});
assert(res3.suggestion === null, 'Duplicate hint must be suppressed during cooldown window');
console.log('  ✓ Frequency capping verified: duplicate suggestion suppressed during cooldown.\n');

// Test 3: Real Navigation Backtracking Detection
console.log('Test 3: Navigation Backtracking Detection...');
// Clear attempt/cooldown state for clean test
engine.clearAllData();
// User visits Page A
const nav1 = engine.recordEvent({
  sessionId: 'test_real_sess',
  screenId: 'features_page',
  componentType: 'nav_link',
  eventType: 'navigation',
  isSimulation: false,
});
assert(nav1.event?.eventType === 'navigation', 'Initial navigation should be recorded as navigation');

// User visits Page B
const nav2 = engine.recordEvent({
  sessionId: 'test_real_sess',
  screenId: 'downloads_page',
  componentType: 'nav_link',
  eventType: 'navigation',
  isSimulation: false,
});
assert(nav2.event?.eventType === 'navigation', 'Second navigation should be recorded as navigation');

// User returns rapidly to Page A (backtrack)
const nav3 = engine.recordEvent({
  sessionId: 'test_real_sess',
  screenId: 'features_page',
  componentType: 'nav_link',
  eventType: 'navigation',
  isSimulation: false,
});
assert(nav3.event?.eventType === 'backtrack', 'Rapid return to preceding screen must be classified as backtrack');
assert(nav3.event?.isCorrection === true, 'Backtrack event must have isCorrection: true');
assert(nav3.suggestion !== null, 'Backtrack should trigger navigation shortcut suggestion');
console.log('  ✓ Navigation backtracking verified: rapid screen return detected with navigation index tip.\n');

// Test 4: False-Positive Edge Cases (Idle Away time > 30s vs Active Dwell)
console.log('Test 4: False-Positive Edge Cases (Idle time separation)...');
engine.clearAllData();
engine.configureThresholds(8000, 3);

// Case A: User paused for 45 seconds (> 30s maxActiveTaskHesitationMs, e.g. stepped away)
const idleEvent = engine.recordEvent({
  sessionId: 'test_real_sess',
  screenId: 'reading_docs',
  componentType: 'doc_view',
  eventType: 'hesitation_pause',
  explicitHesitationMs: 45000,
  isSimulation: false,
});
assert(idleEvent.event?.isIdle === true, 'Dwells > 30s must be marked as isIdle: true');
assert(idleEvent.suggestion === null, 'Idle/away time must NOT falsely trigger in-task hesitation hints');

// Case B: Active dwell within window (8.5s)
const activeDwellEvent = engine.recordEvent({
  sessionId: 'test_real_sess',
  screenId: 'complex_form',
  componentType: 'form_panel',
  eventType: 'hesitation_pause',
  explicitHesitationMs: 8500,
  isSimulation: false,
});
assert(activeDwellEvent.event?.isIdle === false, '8.5s active dwell must be marked isIdle: false');
assert(activeDwellEvent.suggestion !== null, 'Active dwell >= 8s must offer respectful shortcut');
assert(
  Boolean(activeDwellEvent.suggestion?.triggerReason.includes('not assumed to indicate confusion')),
  'Trigger reason must clearly state pauses are not assumed to mean confusion'
);
console.log('  ✓ False-positive edge cases verified: >30s idle time correctly separated from active dwell.\n');

// Test 5: Disable Automatic Suggestions Toggle
console.log('Test 5: Disable Automatic Suggestions Toggle...');
engine.clearAllData();
engine.setAutoSuggestionsEnabled(false);
assert(engine.getAutoSuggestionsEnabled() === false, 'autoSuggestionsEnabled should be false');

// Trigger 3 attempts that would normally trigger guidance
engine.recordEvent({ sessionId: 's1', screenId: 's', componentType: 'c', eventType: 'repeat_attempt' });
engine.recordEvent({ sessionId: 's1', screenId: 's', componentType: 'c', eventType: 'repeat_attempt' });
const disabledResult = engine.recordEvent({ sessionId: 's1', screenId: 's', componentType: 'c', eventType: 'repeat_attempt' });
assert(disabledResult.event !== null, 'Event should still be recorded for analysis');
assert(disabledResult.suggestion === null, 'No suggestion popup must be generated when autoSuggestionsEnabled is false');

// Re-enable and verify
engine.setAutoSuggestionsEnabled(true);
assert(engine.getAutoSuggestionsEnabled() === true, 'autoSuggestionsEnabled should be true');
console.log('  ✓ User control verified: automatic suggestions can be fully disabled.\n');

// Test 6: Real vs Simulated Event Accounting
console.log('Test 6: Real vs Simulated Event Accounting...');
engine.clearAllData();
engine.recordEvent({ sessionId: 's1', screenId: 'view', componentType: 'b1', eventType: 'navigation', isSimulation: false });
engine.recordEvent({ sessionId: 's1', screenId: 'view', componentType: 'b2', eventType: 'navigation', isSimulation: false });
engine.recordEvent({ sessionId: 's1', screenId: 'view', componentType: 'b3', eventType: 'repeat_attempt', isSimulation: true });

const summary = engine.computeSummary();
assert(summary.totalEvents === 3, 'Expected 3 total events');
assert(summary.realEventsCount === 2, `Expected 2 real events, got ${summary.realEventsCount}`);
assert(summary.simulatedEventsCount === 1, `Expected 1 simulated event, got ${summary.simulatedEventsCount}`);
console.log('  ✓ Event segregation verified: real interactions cleanly separated from simulations.\n');

// Test 7: Strict Pause and Complete Deletion
console.log('Test 7: Pause Enforcement & Complete Deletion Verification...');
// Test Pause stops collection
engine.setPaused(true);
assert(engine.getIsPaused() === true, 'Engine must report paused');
const pausedRes = engine.recordEvent({ sessionId: 's1', screenId: 'view', componentType: 'b1', eventType: 'navigation' });
assert(pausedRes.event === null, 'Engine must drop events completely while paused');

// Resume and test Deletion
engine.setPaused(false);
engine.clearAllData();
const postPurgeSummary = engine.computeSummary();
assert(postPurgeSummary.totalEvents === 0, 'Total events must be 0 after clearAllData');
assert(getLocalInteractionEvents().length === 0, 'Local events storage must be empty');
assert(getLocalOfferedTips().length === 0, 'Offered tips storage must be empty');
assert(getLocalFeedback().length === 0, 'Feedback storage must be empty');
console.log('  ✓ Data sovereignty verified: pause halts recording; clearAllData completely empties storage.\n');

// Test 8: Repeat-Attempt Detection Window, Expiration, Success Reset & Navigation Reset
console.log('Test 8: Repeat-Attempt Window, Expiration, Success Reset & Navigation Reset...');
engine.clearAllData();
engine.configureThresholds(8000, 3, undefined, undefined, undefined, true, 5000); // 5000ms repeat window

const baseTime = 1000000;
// Step 1: Sequential attempts within the window
const a1 = engine.recordEvent({
  sessionId: 's1',
  screenId: 'form_screen',
  componentType: 'save_btn',
  eventType: 'repeat_attempt',
  explicitTimestamp: baseTime,
});
assert(a1.event?.attemptCount === 1, `Expected attempt 1, got ${a1.event?.attemptCount}`);

const a2 = engine.recordEvent({
  sessionId: 's1',
  screenId: 'form_screen',
  componentType: 'save_btn',
  eventType: 'repeat_attempt',
  explicitTimestamp: baseTime + 2000, // +2s (within 5s window)
});
assert(a2.event?.attemptCount === 2, `Expected attempt 2, got ${a2.event?.attemptCount}`);

// Step 2: Expiration outside documented time window (+7s > 5s window)
const aExpired = engine.recordEvent({
  sessionId: 's1',
  screenId: 'form_screen',
  componentType: 'save_btn',
  eventType: 'repeat_attempt',
  explicitTimestamp: baseTime + 9000, // +7s since last attempt
});
assert(aExpired.event?.attemptCount === 1, `Expected expired attempt to reset to 1, got ${aExpired.event?.attemptCount}`);

// Step 3: Success Reset
const a3 = engine.recordEvent({
  sessionId: 's1',
  screenId: 'form_screen',
  componentType: 'save_btn',
  eventType: 'repeat_attempt',
  explicitTimestamp: baseTime + 10000,
});
assert(a3.event?.attemptCount === 2, `Expected attempt 2, got ${a3.event?.attemptCount}`);

// Action success on same component
engine.recordEvent({
  sessionId: 's1',
  screenId: 'form_screen',
  componentType: 'save_btn',
  eventType: 'action_success',
  explicitTimestamp: baseTime + 11000,
});

// Next attempt should start fresh at 1
const aAfterSuccess = engine.recordEvent({
  sessionId: 's1',
  screenId: 'form_screen',
  componentType: 'save_btn',
  eventType: 'repeat_attempt',
  explicitTimestamp: baseTime + 12000,
});
assert(aAfterSuccess.event?.attemptCount === 1, `Expected attempt count 1 after success reset, got ${aAfterSuccess.event?.attemptCount}`);

// Step 4: Navigation Reset across screens
engine.recordEvent({
  sessionId: 's1',
  screenId: 'page_alpha',
  componentType: 'filter_dropdown',
  eventType: 'repeat_attempt',
  explicitTimestamp: baseTime + 13000,
});
engine.recordEvent({
  sessionId: 's1',
  screenId: 'page_alpha',
  componentType: 'filter_dropdown',
  eventType: 'repeat_attempt',
  explicitTimestamp: baseTime + 14000,
});

// Navigate to page_beta
engine.recordEvent({
  sessionId: 's1',
  screenId: 'page_beta',
  componentType: 'nav_bar',
  eventType: 'navigation',
  explicitTimestamp: baseTime + 15000,
});

// Return to page_alpha and click filter_dropdown -> should reset to 1
const aAfterNav = engine.recordEvent({
  sessionId: 's1',
  screenId: 'page_alpha',
  componentType: 'filter_dropdown',
  eventType: 'repeat_attempt',
  explicitTimestamp: baseTime + 16000,
});
assert(aAfterNav.event?.attemptCount === 1, `Expected attempt count 1 after navigation reset, got ${aAfterNav.event?.attemptCount}`);
console.log('  ✓ Repeat-attempt window, expiration, success reset, and navigation reset verified.\n');

console.log('==================================================================');
console.log('     ✓ ALL 8/8 REAL ADAPTIVE ENGINE UPGRADE TESTS PASSED (100%)');
console.log('==================================================================\n');
