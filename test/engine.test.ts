/**
 * G-SENSE Learning Engine Automated Test Suite
 * Validates:
 * 1. Empty state computations
 * 2. Privacy invariants (zero keystroke/password logging)
 * 3. Total assistance tips offered tracking (counts every displayed tip)
 * 4. Yes/No feedback recording and acceptance rate math
 * 5. Active task hesitation vs intentional idle time distinction
 * 6. Sample size & data maturity indicator (not an arbitrary confidence percentage)
 * 7. Strict pause learning enforcement
 * 8. Data export bundle and complete purge execution
 */

import { GSenseBrowserEngine, MAX_ACTIVE_TASK_HESITATION_MS } from '../src/lib/learningEngine';
import { getLocalOfferedTips, getLocalFeedback, getLocalInteractionEvents } from '../src/lib/supabaseClient';

// Mock localStorage for node test runner
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

function runTests() {
  console.log("=== Running G-SENSE Learning Engine Verification Tests ===");
  storageMap.clear();

  const engine = new GSenseBrowserEngine();

  // Test 1: Empty state computation
  console.log("Test 1: Empty state computation...");
  const emptySummary = engine.computeSummary();
  if (emptySummary.totalEvents !== 0) throw new Error("Expected 0 events for empty state");
  if (emptySummary.sampleSize !== 0) throw new Error("Expected sampleSize 0 for empty state");
  if (emptySummary.avgHesitationMs !== 0) throw new Error("Expected avgHesitationMs 0 for empty state");
  if (emptySummary.sampleSufficiencyRatio !== 0) throw new Error("Expected sampleSufficiencyRatio 0");
  console.log("✓ Empty state handled correctly without NaN or division by zero.");

  // Test 2: Privacy invariants (zero typed text or credentials)
  console.log("Test 2: Event recording privacy invariants...");
  const recordResult = engine.recordEvent({
    sessionId: "sess_test_1",
    screenId: "settings",
    componentType: "theme_toggle",
    eventType: "navigation",
  });
  if (!recordResult.event) throw new Error("Event recording failed");
  if ((recordResult.event as any).typedText || (recordResult.event as any).password || (recordResult.event as any).value) {
    throw new Error("PRIVACY VIOLATION: Private text or password detected in event payload!");
  }
  console.log("✓ Event recorded strictly with structural interaction metadata. No keystrokes or passwords.");

  // Test 3: Total guidance tips actually displayed are tracked
  console.log("Test 3: Tracking every assistance tip offered...");
  const initialOfferedCount = engine.getAssistanceStats().totalOffered;
  
  // Trigger repeat attempts until tip triggers
  engine.recordEvent({ sessionId: "sess_test_1", screenId: "form_modal", componentType: "submit_btn", eventType: "repeat_attempt" });
  engine.recordEvent({ sessionId: "sess_test_1", screenId: "form_modal", componentType: "submit_btn", eventType: "repeat_attempt" });
  const repeatTriggerResult = engine.recordEvent({
    sessionId: "sess_test_1",
    screenId: "form_modal",
    componentType: "submit_btn",
    eventType: "repeat_attempt",
  });

  if (!repeatTriggerResult.suggestion) {
    throw new Error("Expected adaptive guidance suggestion to trigger on 3rd attempt");
  }

  const postTriggerOffered = engine.getAssistanceStats().totalOffered;
  if (postTriggerOffered <= initialOfferedCount) {
    throw new Error(`Expected totalOffered to increase when tip displayed. Was: ${initialOfferedCount}, now: ${postTriggerOffered}`);
  }
  console.log(`✓ Guidance tip correctly counted upon display. Total tips offered: ${postTriggerOffered}`);

  // Test 4: Yes/No feedback and acceptance rate calculation
  console.log("Test 4: User feedback and acceptance rate calculation...");
  const promptId = repeatTriggerResult.suggestion.id;

  // Record 'Yes' (Helpful) feedback
  engine.recordFeedback(promptId, true, "form_modal", "Repeat attempt trigger");
  let stats = engine.getAssistanceStats();
  if (stats.helpfulCount !== 1) throw new Error(`Expected 1 helpful feedback, got ${stats.helpfulCount}`);
  if (stats.acceptanceRateSubmitted !== 100) throw new Error(`Expected 100% acceptance on submitted, got ${stats.acceptanceRateSubmitted}%`);

  // Record another tip and 'No' (Unhelpful) feedback
  const mockTip2 = {
    id: "sug_mock_2",
    title: "Second Tip",
    message: "Test message",
    level: "hints_only" as const,
    triggerReason: "Test trigger",
  };
  engine.trackTipOffered(mockTip2, "form_modal");
  engine.recordFeedback(mockTip2.id, false, "form_modal", "Test trigger");

  stats = engine.getAssistanceStats();
  if (stats.totalOffered !== 2) throw new Error(`Expected 2 total offered, got ${stats.totalOffered}`);
  if (stats.feedbackSubmittedCount !== 2) throw new Error(`Expected 2 feedback submitted, got ${stats.feedbackSubmittedCount}`);
  if (stats.helpfulCount !== 1) throw new Error(`Expected 1 helpful feedback, got ${stats.helpfulCount}`);
  if (stats.acceptanceRateSubmitted !== 50) throw new Error(`Expected 50% acceptance on submitted, got ${stats.acceptanceRateSubmitted}%`);
  if (stats.acceptanceRateOffered !== 50) throw new Error(`Expected 50% acceptance on offered, got ${stats.acceptanceRateOffered}%`);
  console.log(`✓ Feedback recorded and acceptance rate verified: 1/2 = 50%`);

  // Test 5: Distinguishing intentional idle time from task hesitation
  console.log("Test 5: Distinguishing active task dwell from intentional idle time...");
  // Simulate active task dwell of 4000ms
  const activeEvent = engine.recordEvent({
    sessionId: "sess_test_1",
    screenId: "editor",
    componentType: "select_menu",
    eventType: "navigation",
  });
  if (activeEvent.event?.isIdle !== false) {
    throw new Error("Active task interaction under 30s was incorrectly flagged as idle!");
  }

  // Simulate explicit idle pause or dwell > 30s
  const idleEvent = engine.recordEvent({
    sessionId: "sess_test_1",
    screenId: "editor",
    componentType: "background_window",
    eventType: "idle_pause",
  });
  if (idleEvent.event?.isIdle !== true) {
    throw new Error("Idle pause event was not flagged as isIdle!");
  }

  const currentSummary = engine.computeSummary();
  if (currentSummary.totalIdleIntervals < 1) {
    throw new Error("Expected at least 1 idle interval recorded");
  }
  if (currentSummary.avgHesitationMs > MAX_ACTIVE_TASK_HESITATION_MS) {
    throw new Error(`avgHesitationMs (${currentSummary.avgHesitationMs}) improperly included idle time exceeding 30s!`);
  }
  console.log(`✓ Active task dwell separated from background idle intervals. Total idle intervals: ${currentSummary.totalIdleIntervals}`);

  // Test 6: Sample size indicator (not an arbitrary percentage)
  console.log("Test 6: Sample size & maturity indicator...");
  if (typeof currentSummary.sampleSize !== "number") throw new Error("sampleSize missing");
  if (currentSummary.sampleSize !== currentSummary.totalEvents) throw new Error("sampleSize does not match totalEvents");
  if (!currentSummary.sampleStatusLabel.includes("Sample") && !currentSummary.sampleStatusLabel.includes("Sparse")) {
    throw new Error(`Expected descriptive sample status label, got: "${currentSummary.sampleStatusLabel}"`);
  }
  console.log(`✓ Sample maturity verified: ${currentSummary.sampleSize}/50 events (${currentSummary.sampleStatusLabel})`);

  // Test 7: Strict pause compliance
  console.log("Test 7: Pause learning compliance...");
  engine.setPaused(true);
  const pausedResult = engine.recordEvent({
    sessionId: "sess_test_1",
    screenId: "profile",
    componentType: "input_name",
    eventType: "navigation",
  });
  if (pausedResult.event !== null || pausedResult.suggestion !== null) {
    throw new Error("Engine recorded an event or triggered a tip while paused!");
  }
  engine.setPaused(false);
  console.log("✓ Engine strictly drops all telemetry while paused.");

  // Test 8: Data bundle export and complete purge
  console.log("Test 8: Data bundle export and complete purge...");
  const exported = engine.exportDataBundle();
  const parsed = JSON.parse(exported);
  if (!parsed.events || !Array.isArray(parsed.events)) throw new Error("Export missing events array");
  if (!parsed.tipsOffered || !Array.isArray(parsed.tipsOffered)) throw new Error("Export missing tipsOffered array");
  if (!parsed.feedback || !Array.isArray(parsed.feedback)) throw new Error("Export missing feedback array");
  if (parsed.tipsOffered.length !== 2) throw new Error(`Expected 2 exported tips, got ${parsed.tipsOffered.length}`);

  // Purge all data
  engine.clearAllData();
  const postPurgeSummary = engine.computeSummary();
  const postPurgeStats = engine.getAssistanceStats();
  const remainingEvents = getLocalInteractionEvents();
  const remainingTips = getLocalOfferedTips();
  const remainingFeedback = getLocalFeedback();

  if (postPurgeSummary.totalEvents !== 0 || remainingEvents.length !== 0) {
    throw new Error("Purge failed to erase interaction events!");
  }
  if (postPurgeStats.totalOffered !== 0 || remainingTips.length !== 0) {
    throw new Error("Purge failed to erase offered tips!");
  }
  if (postPurgeStats.feedbackSubmittedCount !== 0 || remainingFeedback.length !== 0) {
    throw new Error("Purge failed to erase feedback records!");
  }
  console.log("✓ Complete purge verified: 0 events, 0 offered tips, 0 feedback remaining.");

  console.log("\n========================================================");
  console.log("ALL 8 G-SENSE ENGINE VERIFICATION TESTS PASSED (100%)!");
  console.log("========================================================\n");
}

try {
  runTests();
} catch (err) {
  console.error("Test execution failed:", err);
  process.exit(1);
}
