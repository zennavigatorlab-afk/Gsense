"""
Automated Test Suite for G-SENSE Desktop Module
Tests:
1. Sensitive window title and process filtering (zero password/banking leakage)
2. UI Automation control filter (only permitted controls; strictly forbids text/edit/password)
3. Active window tracker lifecycle (opt-in by default, pause/resume)
4. GSenseEngine learning rules, dwell separation, sample maturity
5. JSON and RFC 4180 CSV export formatting
6. Full local data purge verification
7. SQLite persistence & settings store hydration roundtrip
8. Windows build spec generation & desktop module import verification
"""

import sys
import os
import json
import csv

# Ensure UTF-8 output encoding across Windows consoles (CP1252 / OEM charmap safety)
os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["PYTHONUTF8"] = "1"
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# Add current folder to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from window_tracker import (
    is_sensitive_window,
    sanitize_window_metadata,
    ActiveWindowTracker,
    PERMITTED_CONTROL_TYPES,
    FORBIDDEN_CONTROL_TYPES
)
from gsense_engine import GSenseEngine, InteractionEvent

def assert_true(condition, msg):
    if not condition:
        print(f"[FAIL] {msg}")
        sys.exit(1)

def run_tests():
    print("=== Running G-SENSE Desktop Automated Verification Tests ===\n")

    # Test 1: Sensitive Window Detection
    print("Test 1: Sensitive Window & Process Filtering...")
    sensitive_samples = [
        ("KeePass - Database.kdbx", "keepass.exe"),
        ("1Password - Vault", "1password.exe"),
        ("Chase Online Banking - Chrome", "chrome.exe"),
        ("PayPal: Summary - Edge", "msedge.exe"),
        ("Sign in to your account", "browser.exe"),
        ("Private Browsing - Firefox", "firefox.exe"),
        ("New Incognito Tab", "chrome.exe"),
        ("Bitwarden Password Manager", "bitwarden.exe")
    ]
    for title, proc in sensitive_samples:
        assert_true(is_sensitive_window(title, proc) is True, f"Failed to detect sensitive window: {title}")

    normal_samples = [
        ("Untitled - Notepad", "notepad.exe"),
        ("Visual Studio Code", "code.exe"),
        ("Downloads", "explorer.exe"),
        ("Calculator", "calc.exe"),
        ("G-SENSE - AdaptiveAssistant Desktop", "python.exe")
    ]
    for title, proc in normal_samples:
        assert_true(is_sensitive_window(title, proc) is False, f"Incorrectly flagged normal window: {title}")
    print("  [PASS] Sensitive windows (passwords, banking, private browsing) successfully excluded.\n")

    # Test 2: UI Automation Permitted vs Forbidden Controls
    print("Test 2: UI Automation Control Security Boundaries...")
    tracker = ActiveWindowTracker()
    tracker.enable()

    # Forbidden text/edit/password controls MUST return None (zero text logging)
    for bad_ctrl in FORBIDDEN_CONTROL_TYPES:
        res = tracker.process_ui_automation_element(bad_ctrl, "username_field")
        assert_true(res is None, f"Forbidden control type was processed: {bad_ctrl}")

    # Permitted structural controls MUST be allowed
    permitted_samples = ["Button", "TabItem", "MenuItem", "CheckBox"]
    for good_ctrl in permitted_samples:
        res = tracker.process_ui_automation_element(good_ctrl, "btn_submit")
        assert_true(res is not None, f"Permitted control type was rejected: {good_ctrl}")
        assert_true("text" not in res, "Event must not contain text values")
        assert_true("value" not in res, "Event must not contain form values")
    print("  [PASS] UI Automation verified: strictly permits buttons/tabs; blocks text and edit controls.\n")

    # Test 3: Opt-in Invariant
    print("Test 3: Active Window Tracker Opt-in Invariant...")
    default_tracker = ActiveWindowTracker()
    assert_true(default_tracker.is_enabled is False, "Active window tracker must be disabled by default")
    default_tracker.pause()
    assert_true(default_tracker.is_paused is True, "Pause state must be respected")
    default_tracker.resume()
    assert_true(default_tracker.is_paused is False, "Resume state must be respected")
    print("  [PASS] Opt-in default and pause/resume compliance verified.\n")

    # Test 4: Learning Rules & Dwell Separation
    print("Test 4: Learning Rules & Idle Separation...")
    engine = GSenseEngine()
    engine.record_event("evt_1", "sess", "doc_screen", "button", "navigation", hesitation_override_ms=2500)
    engine.record_event("evt_2", "sess", "doc_screen", "button", "repeat_attempt", hesitation_override_ms=3000)
    # Simulate an idle gap > 30s
    engine.record_event("evt_3", "sess", "doc_screen", "button", "idle_pause", hesitation_override_ms=45000)

    summary = engine.compute_summary()
    assert_true(summary.total_events == 3, f"Expected 3 events, got {summary.total_events}")
    assert_true(summary.total_idle_intervals == 1, f"Expected 1 idle interval, got {summary.total_idle_intervals}")
    assert_true(summary.active_task_events == 2, f"Expected 2 active events, got {summary.active_task_events}")
    assert_true("Sparse" in summary.sample_status_label, f"Expected Sparse sample status, got {summary.sample_status_label}")
    print("  [PASS] Active dwell accurately separated from idle pauses (>30s).\n")

    # Test 5: CSV & JSON Exports
    print("Test 5: Export Formatting (JSON & CSV)...")
    json_str = engine.export_data()
    parsed_json = json.loads(json_str)
    assert_true(parsed_json["privacy_guarantees"]["zero_keystroke_logging"] is True, "Missing privacy guarantee in JSON")
    assert_true(len(parsed_json["events"]) == 3, "JSON event count mismatch")

    csv_str = engine.export_csv()
    csv_reader = list(csv.reader(csv_str.splitlines()))
    header = csv_reader[0]
    assert_true("event_id" in header and "component_type" in header, "Invalid CSV headers")
    assert_true(len(csv_reader) == 4, f"Expected header + 3 rows in CSV, got {len(csv_reader)}")
    print("  [PASS] JSON and RFC 4180 CSV exports verified with privacy declarations.\n")

    # Test 6: Purge All Data
    print("Test 6: Full Local Data Purge...")
    engine.clear_data()
    assert_true(len(engine.events) == 0, "Events not purged from memory")
    cleared_summary = engine.compute_summary()
    assert_true(cleared_summary.total_events == 0, "Summary not reset to zero")
    print("  [PASS] Full data purge verified.\n")

    # Test 7: SQLite Persistence & Startup Hydration Roundtrip
    print("Test 7: SQLite Local Storage Persistence & Hydration...")
    from storage import DesktopStorage
    import tempfile
    import gc

    temp_db = os.path.join(tempfile.gettempdir(), f"test_gsense_{os.getpid()}.db")
    if os.path.exists(temp_db):
        try:
            os.remove(temp_db)
        except OSError:
            pass

    test_storage = DesktopStorage(db_path=temp_db)
    test_storage.set_setting("run_at_startup", "true")
    test_storage.set_setting("optin_window_tracking", "true")
    assert_true(test_storage.get_setting("run_at_startup") == "true", "Failed to retrieve setting")

    test_storage.save_event({
        "event_id": "test_evt_101",
        "session_id": "test_sess",
        "screen_id": "desktop_main",
        "component_type": "nav_button",
        "event_type": "navigation",
        "attempt_count": 1,
        "hesitation_ms": 1200,
        "is_correction": False,
        "timestamp": 123456789.0
    })
    saved_events = test_storage.get_all_events()
    assert_true(len(saved_events) == 1, "Expected 1 saved event in SQLite")
    assert_true(saved_events[0]["id"] == "test_evt_101", "Event ID mismatch in SQLite")

    test_storage.purge_all()
    assert_true(len(test_storage.get_all_events()) == 0, "Expected 0 events after SQLite purge")
    del test_storage
    gc.collect()
    if os.path.exists(temp_db):
        try:
            os.remove(temp_db)
        except OSError:
            pass
    print("  [PASS] SQLite persistence, settings store, and purge roundtrip verified.\n")

    # Test 8: Windows Build Spec Generation & Module Verification
    print("Test 8: PyInstaller Spec Generation & Desktop Module Verification...")
    from build_windows import verify_modules, generate_spec_file
    assert_true(verify_modules() is True, "Module verification failed")
    spec_path = generate_spec_file()
    assert_true(os.path.exists(spec_path), f"PyInstaller spec not generated: {spec_path}")
    with open(spec_path, "r", encoding="utf-8") as f:
        spec_text = f.read()
    assert_true("GSense-AdaptiveAssistant" in spec_text, "Missing executable name in spec")
    assert_true("window_tracker" in spec_text, "Missing window_tracker hiddenimport in spec")
    print("  [PASS] Desktop packaging spec generation and module imports verified.\n")

    print("==================================================================")
    print("     [PASS] ALL 8 G-SENSE DESKTOP VERIFICATION TESTS PASSED (100%)")
    print("==================================================================\n")

if __name__ == "__main__":
    run_tests()
