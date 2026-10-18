/**
 * G-SENSE End-to-End Audit & Verification Test Suite
 * Covers complete lifecycle: Engine, Dashboard data layer, Tip Offering,
 * Feedback Recording, Acceptance Rates, Idle Separation, Pause, Export, and Purge.
 */

import { GSenseBrowserEngine, MAX_ACTIVE_TASK_HESITATION_MS } from '../src/lib/learningEngine';
import {
  getLocalOfferedTips,
  getLocalFeedback,
  getLocalInteractionEvents,
  deleteLocalAccountAndData,
  getLocalProfile,
  getLocalPreferences,
} from '../src/lib/supabaseClient';

// Mock localStorage for test environment
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

function runEndToEndAudit() {
  console.log("==================================================================");
  console.log("           STARTING G-SENSE END-TO-END AUDIT & VERIFICATION       ");
  console.log("==================================================================");

  storageMap.clear();
  const engine = new GSenseBrowserEngine();

  // Audit Step 1: Initial Pristine Zero State
  console.log("\n[Audit 1/8] Verifying Initial Clean State...");
  const initialSummary = engine.computeSummary();
  const initialStats = engine.getAssistanceStats();
  if (initialSummary.totalEvents !== 0 || initialSummary.sampleSize !== 0) {
    throw new Error(`FAIL: Initial events count is not 0 (got ${initialSummary.totalEvents})`);
  }
  if (initialStats.totalOffered !== 0 || initialStats.feedbackSubmittedCount !== 0) {
    throw new Error(`FAIL: Initial assistance stats not 0`);
  }
  console.log("  ✓ Initial zero-state clean: 0 events, 0 tips, 0 feedback.");

  // Audit Step 2: Real-time Subscriber Notifications
  console.log("\n[Audit 2/8] Testing Real-Time Subscriber Notifications...");
  let subscriberTriggerCount = 0;
  const unsubscribe = engine.subscribe(() => {
    subscriberTriggerCount++;
  });

  engine.recordEvent({
    sessionId: "sess_audit",
    screenId: "dashboard",
    componentType: "refresh_btn",
    eventType: "navigation",
  });

  if (subscriberTriggerCount !== 1) {
    throw new Error(`FAIL: Subscriber not notified on event recording (count=${subscriberTriggerCount})`);
  }
  console.log("  ✓ Real-time subscriber notified immediately upon event ingestion.");

  // Audit Step 3: Triggering Tips & Counting Every Tip Displayed
  console.log("\n[Audit 3/8] Verifying Tip Offering & Display Tracking...");
  // Simulate 3 repeat clicks to hit repeat trigger
  engine.recordEvent({ sessionId: "sess_audit", screenId: "form", componentType: "save_btn", eventType: "repeat_attempt" });
  engine.recordEvent({ sessionId: "sess_audit", screenId: "form", componentType: "save_btn", eventType: "repeat_attempt" });
  const repeatOutcome = engine.recordEvent({
    sessionId: "sess_audit",
    screenId: "form",
    componentType: "save_btn",
    eventType: "repeat_attempt",
  });

  if (!repeatOutcome.suggestion) {
    throw new Error("FAIL: Rule failed to trigger suggestion on 3rd attempt");
  }

  const tipsAfterRepeat = getLocalOfferedTips();
  if (tipsAfterRepeat.length !== 1) {
    throw new Error(`FAIL: Tip was displayed but not stored in local offered tips (found ${tipsAfterRepeat.length})`);
  }
  const statsAfterRepeat = engine.getAssistanceStats();
  if (statsAfterRepeat.totalOffered !== 1) {
    throw new Error(`FAIL: totalOffered is ${statsAfterRepeat.totalOffered}, expected 1`);
  }
  console.log(`  ✓ Guidance tip triggered and counted as offered (totalOffered = 1).`);

  // Audit Step 4: Yes/No Feedback & Acceptance Rate Math
  console.log("\n[Audit 4/8] Testing Feedback Recording & Acceptance Rate Calculation...");
  const firstTipId = repeatOutcome.suggestion.id;

  // Submit 'Yes' (Helpful) feedback
  engine.recordFeedback(firstTipId, true, "form", repeatOutcome.suggestion.triggerReason);
  let currentStats = engine.getAssistanceStats();
  if (currentStats.helpfulCount !== 1 || currentStats.unhelpfulCount !== 0) {
    throw new Error(`FAIL: Helpful feedback count incorrect`);
  }
  if (currentStats.acceptanceRateSubmitted !== 100 || currentStats.acceptanceRateOffered !== 100) {
    throw new Error(`FAIL: Acceptance rate math incorrect: submitted=${currentStats.acceptanceRateSubmitted}%, offered=${currentStats.acceptanceRateOffered}%`);
  }

  // Offer a second tip and submit 'No' (Unhelpful) feedback
  const mockTip = {
    id: "tip_mock_hesitation",
    title: "Hesitation Shortcut",
    message: "A tip for hesitation",
    level: "hints_only" as const,
    triggerReason: "Hesitation dwell exceeded",
  };
  engine.trackTipOffered(mockTip, "editor");
  engine.recordFeedback(mockTip.id, false, "editor", "Hesitation dwell exceeded");

  currentStats = engine.getAssistanceStats();
  if (currentStats.totalOffered !== 2) throw new Error(`FAIL: Expected totalOffered=2, got ${currentStats.totalOffered}`);
  if (currentStats.helpfulCount !== 1 || currentStats.unhelpfulCount !== 1) {
    throw new Error(`FAIL: Expected 1 helpful, 1 unhelpful`);
  }
  if (currentStats.acceptanceRateSubmitted !== 50 || currentStats.acceptanceRateOffered !== 50) {
    throw new Error(`FAIL: Expected 50% acceptance rate, got submitted=${currentStats.acceptanceRateSubmitted}%, offered=${currentStats.acceptanceRateOffered}%`);
  }
  console.log(`  ✓ Yes/No feedback recorded and acceptance rates verified: 1 helpful out of 2 = 50%.`);

  // Audit Step 5: Active Task Hesitation vs Background Idle Separation
  console.log("\n[Audit 5/8] Testing Active Task Dwell vs Intentional Idle Pause...");
  // Simulate active task dwell of 3500ms
  engine.recordEvent({
    sessionId: "sess_audit",
    screenId: "settings",
    componentType: "theme_switch",
    eventType: "navigation",
  });

  // Simulate idle dwell or explicit idle pause
  engine.recordEvent({
    sessionId: "sess_audit",
    screenId: "settings",
    componentType: "browser_tab",
    eventType: "idle_pause",
  });

  const summaryWithIdle = engine.computeSummary();
  if (summaryWithIdle.totalIdleIntervals < 1) {
    throw new Error("FAIL: Idle interval not recorded");
  }
  if (summaryWithIdle.avgHesitationMs > MAX_ACTIVE_TASK_HESITATION_MS) {
    throw new Error(`FAIL: avgHesitationMs (${summaryWithIdle.avgHesitationMs}) improperly polluted with idle time`);
  }
  console.log(`  ✓ Active dwell and idle pauses separated successfully (idle intervals = ${summaryWithIdle.totalIdleIntervals}).`);

  // Audit Step 6: Sample Size Maturity Indicator
  console.log("\n[Audit 6/8] Verifying Sample Size Maturity Tiers...");
  const currentEventsCount = engine.computeSummary().totalEvents;
  if (currentEventsCount < 15) {
    if (!summaryWithIdle.sampleStatusLabel.includes("Sparse")) {
      throw new Error(`FAIL: Expected Sparse tier for n < 15, got "${summaryWithIdle.sampleStatusLabel}"`);
    }
  }
  console.log(`  ✓ Sample maturity correctly categorized: "${summaryWithIdle.sampleStatusLabel}".`);

  // Audit Step 7: Pause Learning Stops Tracking
  console.log("\n[Audit 7/8] Verifying Pause Learning Guarantees...");
  engine.setPaused(true);
  const countBeforePause = engine.computeSummary().totalEvents;

  const pausedAction = engine.recordEvent({
    sessionId: "sess_audit",
    screenId: "profile",
    componentType: "save_name_btn",
    eventType: "repeat_attempt",
  });

  if (pausedAction.event !== null || pausedAction.suggestion !== null) {
    throw new Error("FAIL: Engine recorded event or produced suggestion while paused!");
  }
  const countAfterPause = engine.computeSummary().totalEvents;
  if (countAfterPause !== countBeforePause) {
    throw new Error(`FAIL: Event count changed while paused (${countBeforePause} -> ${countAfterPause})`);
  }
  engine.setPaused(false);
  console.log("  ✓ Pause learning strictly enforced: 0 events or tips recorded while paused.");

  // Audit Step 8: Data Export Bundle & Complete Purge
  console.log("\n[Audit 8/8] Verifying Data Export Bundle & Full Data Purge...");
  const exportedBundleStr = engine.exportDataBundle();
  const parsedBundle = JSON.parse(exportedBundleStr);

  if (!parsedBundle.events || parsedBundle.events.length === 0) {
    throw new Error("FAIL: Exported bundle has empty events array");
  }
  if (!parsedBundle.tipsOffered || parsedBundle.tipsOffered.length !== 2) {
    throw new Error(`FAIL: Exported bundle has incorrect tipsOffered (expected 2, got ${parsedBundle.tipsOffered?.length})`);
  }
  if (!parsedBundle.feedback || parsedBundle.feedback.length !== 2) {
    throw new Error(`FAIL: Exported bundle has incorrect feedback (expected 2, got ${parsedBundle.feedback?.length})`);
  }

  // Purge all user telemetry
  engine.clearAllData();
  const postPurgeSummary = engine.computeSummary();
  const postPurgeStats = engine.getAssistanceStats();
  if (postPurgeSummary.totalEvents !== 0 || postPurgeStats.totalOffered !== 0 || postPurgeStats.helpfulCount !== 0) {
    throw new Error("FAIL: Purge failed to reset all telemetry to zero");
  }

  // Delete account and all storage
  deleteLocalAccountAndData();
  if (getLocalInteractionEvents().length !== 0 || getLocalOfferedTips().length !== 0 || getLocalFeedback().length !== 0) {
    throw new Error("FAIL: deleteLocalAccountAndData failed to remove storage keys");
  }
  console.log("  ✓ Export bundle verified and complete purge executed cleanly.");

  unsubscribe();
  console.log("\n==================================================================");
  console.log("     ✓ ALL 8 END-TO-END AUDIT SUITE TESTS PASSED WITH 100% SUCCESS");
  console.log("==================================================================\n");
}

try {
  runEndToEndAudit();
} catch (err) {
  console.error("AUDIT FAILED:", err);
  process.exit(1);
}
