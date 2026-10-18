/**
 * G-SENSE Learning Engine Automated Test Suite
 * Tests rule transparency, sample size bounding, and privacy invariants.
 */

import { GSenseBrowserEngine } from '../src/lib/learningEngine';

// Mock localStorage for node test runner
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

function runTests() {
  console.log("=== Running G-SENSE Learning Engine Tests ===");
  storageMap.clear();

  const engine = new GSenseBrowserEngine();

  // Test 1: Empty state computation
  console.log("Test 1: Empty state computation...");
  const emptySummary = engine.computeSummary();
  if (emptySummary.totalEvents !== 0) throw new Error("Expected 0 events for empty state");
  if (emptySummary.confidenceScore !== 0) throw new Error("Expected confidence 0 for empty state");
  console.log("✓ Empty state handled correctly without NaN or division by zero.");

  // Test 2: Event recording without private text
  console.log("Test 2: Event recording privacy invariants...");
  const recordResult = engine.recordEvent({
    sessionId: "sess_test_1",
    screenId: "settings",
    componentType: "theme_toggle",
    eventType: "navigation",
  });
  if (!recordResult.event) throw new Error("Event recording failed");
  if ((recordResult.event as any).typedText || (recordResult.event as any).password) {
    throw new Error("PRIVACY VIOLATION: Private text or password detected in event payload!");
  }
  console.log("✓ Event recorded strictly with interaction metadata. No keystroke content.");

  // Test 3: Repeat attempt detection
  console.log("Test 3: Repeat attempt counting...");
  engine.recordEvent({
    sessionId: "sess_test_1",
    screenId: "form_modal",
    componentType: "submit_btn",
    eventType: "repeat_attempt",
  });
  engine.recordEvent({
    sessionId: "sess_test_1",
    screenId: "form_modal",
    componentType: "submit_btn",
    eventType: "repeat_attempt",
  });
  const thirdAttempt = engine.recordEvent({
    sessionId: "sess_test_1",
    screenId: "form_modal",
    componentType: "submit_btn",
    eventType: "repeat_attempt",
  });
  if (thirdAttempt.event?.attemptCount !== 3) {
    throw new Error(`Expected attemptCount 3, got ${thirdAttempt.event?.attemptCount}`);
  }
  if (!thirdAttempt.suggestion) {
    throw new Error("Expected adaptive suggestion to trigger on 3rd attempt");
  }
  console.log(`✓ Triggered adaptive guidance correctly: "${thirdAttempt.suggestion.title}"`);

  // Test 4: Statistical bounding of confidence score
  console.log("Test 4: Statistical confidence bounding...");
  const currentSummary = engine.computeSummary();
  if (currentSummary.confidenceScore < 0 || currentSummary.confidenceScore > 1.0) {
    throw new Error(`Confidence score ${currentSummary.confidenceScore} out of [0, 1] bounds!`);
  }
  console.log(`✓ Confidence score properly bounded: ${currentSummary.confidenceScore} (${currentSummary.confidenceLabel})`);

  // Test 5: Pause and resume learning
  console.log("Test 5: Pause learning compliance...");
  engine.setPaused(true);
  const pausedResult = engine.recordEvent({
    sessionId: "sess_test_1",
    screenId: "profile",
    componentType: "name_field",
    eventType: "navigation",
  });
  if (pausedResult.event !== null) {
    throw new Error("Engine recorded an event while paused!");
  }
  engine.setPaused(false);
  console.log("✓ Engine strictly drops telemetry when paused by user.");

  // Test 6: Export and purge
  console.log("Test 6: Data export and purge...");
  const exported = engine.exportEventsAsJson();
  const parsed = JSON.parse(exported);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Export returned invalid or empty array");
  }
  engine.clearAllData();
  const postPurgeSummary = engine.computeSummary();
  if (postPurgeSummary.totalEvents !== 0) {
    throw new Error("Failed to purge all data");
  }
  console.log("✓ Data export and complete purge verified.");

  console.log("\n================================================");
  console.log("ALL 6 G-SENSE ENGINE TESTS PASSED SUCCESSFULLY!");
  console.log("================================================\n");
}

try {
  runTests();
} catch (err) {
  console.error("Test execution failed:", err);
  process.exit(1);
}
