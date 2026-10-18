"""
G-SENSE Learning Engine - Desktop Core
Tagline: AdaptiveAssistant
Meaning: G = Good; SENSE = learning interaction patterns.

Strict Privacy Invariants:
- Never records raw keystrokes, typed passwords, or message contents.
- Tracks only interaction dynamics: duration, attempt counts, hesitation dwell, navigation backtracks.
- Transparent metrics; no fake emotional or psychic inference.
- Distinguishes active task dwell from intentional idle intervals (>30s).
"""

import time
import json
import csv
import io
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

MAX_ACTIVE_TASK_HESITATION_MS = 30000

@dataclass
class InteractionEvent:
    event_id: str
    session_id: str
    screen_id: str
    component_type: str
    event_type: str # 'navigation', 'repeat_attempt', 'hesitation_pause', 'correction', 'action_success', 'idle_pause', 'window_switch', 'ui_automation_invoke'
    attempt_count: int = 1
    hesitation_ms: int = 0
    is_correction: bool = False
    is_idle: bool = False
    timestamp: float = 0.0

@dataclass
class LearningSummary:
    total_events: int
    active_task_events: int
    avg_hesitation_ms: float
    total_idle_intervals: int
    correction_rate: float
    repeat_attempt_rate: float
    sample_size: int
    sample_target: int
    sample_status_label: str
    recommended_assistance: str # 'step_by_step', 'hints_only', 'minimal'
    explanation: str

class GSenseEngine:
    def __init__(self, hesitation_threshold_ms: int = 8000, repeat_attempts_trigger: int = 3):
        self.hesitation_threshold_ms = hesitation_threshold_ms
        self.repeat_attempts_trigger = repeat_attempts_trigger
        self.is_paused = False
        self.events: List[InteractionEvent] = []
        self._last_interaction_time: float = time.time()
        self._current_attempt_map: Dict[str, int] = {}

    def pause_learning(self):
        """Pause interaction event collection."""
        self.is_paused = True

    def resume_learning(self):
        """Resume interaction event collection."""
        self.is_paused = False
        self._last_interaction_time = time.time()

    def record_event(
        self,
        event_id: str,
        session_id: str,
        screen_id: str,
        component_type: str,
        event_type: str,
        is_correction: bool = False,
        hesitation_override_ms: Optional[int] = None
    ) -> Optional[InteractionEvent]:
        if self.is_paused:
            return None

        now = time.time()
        if hesitation_override_ms is not None:
            raw_elapsed_ms = hesitation_override_ms
        else:
            raw_elapsed_ms = int((now - self._last_interaction_time) * 1000)
        self._last_interaction_time = now

        is_idle = raw_elapsed_ms > MAX_ACTIVE_TASK_HESITATION_MS or event_type == 'idle_pause'
        hesitation_ms = min(raw_elapsed_ms, MAX_ACTIVE_TASK_HESITATION_MS) if is_idle else raw_elapsed_ms

        # Track repeat attempts per screen/component
        key = f"{screen_id}:{component_type}"
        current_attempts = self._current_attempt_map.get(key, 0) + 1
        self._current_attempt_map[key] = current_attempts

        event = InteractionEvent(
            event_id=event_id,
            session_id=session_id,
            screen_id=screen_id,
            component_type=component_type,
            event_type='idle_pause' if (is_idle and event_type != 'action_success') else event_type,
            attempt_count=current_attempts,
            hesitation_ms=hesitation_ms,
            is_correction=is_correction,
            is_idle=is_idle,
            timestamp=now
        )
        self.events.append(event)
        return event

    def reset_component_attempts(self, screen_id: str, component_type: str):
        key = f"{screen_id}:{component_type}"
        if key in self._current_attempt_map:
            self._current_attempt_map[key] = 0

    def compute_summary(self) -> LearningSummary:
        """
        Compute transparent statistical indicators.
        Never hallucinates scores or claims to understand emotional states.
        """
        total = len(self.events)
        if total == 0:
            return LearningSummary(
                total_events=0,
                active_task_events=0,
                avg_hesitation_ms=0.0,
                total_idle_intervals=0,
                correction_rate=0.0,
                repeat_attempt_rate=0.0,
                sample_size=0,
                sample_target=50,
                sample_status_label="No data collected yet",
                recommended_assistance="hints_only",
                explanation="No interaction data available. Defaulting to standard hints."
            )

        active_events = [e for e in self.events if not e.is_idle and e.hesitation_ms <= MAX_ACTIVE_TASK_HESITATION_MS]
        active_count = len(active_events)
        total_idle = sum(1 for e in self.events if e.is_idle or e.hesitation_ms > MAX_ACTIVE_TASK_HESITATION_MS)

        total_active_hesitation = sum(e.hesitation_ms for e in active_events)
        avg_hesitation = total_active_hesitation / active_count if active_count > 0 else 0.0

        corrections = sum(1 for e in self.events if e.is_correction or e.event_type == 'correction')
        correction_rate = corrections / total

        repeats = sum(1 for e in self.events if e.attempt_count >= self.repeat_attempts_trigger)
        repeat_rate = repeats / total

        # Sample maturity label
        if total < 15:
            status_label = f"Sparse ({total} < 15 events - Insufficient data)"
        elif total < 50:
            status_label = f"Preliminary Sample ({total} of 50 events - Stabilizing)"
        else:
            status_label = f"Mature Sample ({total} >= 50 events - Empirical baseline)"

        # Transparent rule logic
        if avg_hesitation > self.hesitation_threshold_ms or repeat_rate > 0.20 or correction_rate > 0.25:
            rec = "step_by_step"
            exp = (
                f"Elevated active task hesitation (avg {int(avg_hesitation)}ms) or frequent retries "
                f"({int(repeat_rate * 100)}%) detected. Step-by-step guidance recommended."
            )
        elif active_count >= 5 and avg_hesitation < 3500 and correction_rate < 0.10 and repeat_rate < 0.08:
            rec = "minimal"
            exp = (
                f"Fast, low-friction interactions observed (avg {int(avg_hesitation)}ms dwell). "
                "Minimal guidance keeps workflows unobtrusive."
            )
        else:
            rec = "hints_only"
            exp = "Balanced interaction pace detected. Non-intrusive contextual hints active."

        return LearningSummary(
            total_events=total,
            active_task_events=active_count,
            avg_hesitation_ms=round(avg_hesitation, 1),
            total_idle_intervals=total_idle,
            correction_rate=round(correction_rate, 4),
            repeat_attempt_rate=round(repeat_rate, 4),
            sample_size=total,
            sample_target=50,
            sample_status_label=status_label,
            recommended_assistance=rec,
            explanation=exp
        )

    def export_data(self) -> str:
        """Export JSON formatted bundle with privacy guarantees."""
        summary = self.compute_summary()
        bundle = {
            "app": "G-SENSE Desktop",
            "version": "1.0.0",
            "privacy_guarantees": {
                "zero_keystroke_logging": True,
                "zero_password_logging": True,
                "zero_clipboard_access": True,
                "zero_screen_capture": True,
                "local_storage_only": True
            },
            "summary": asdict(summary),
            "events": [asdict(e) for e in self.events]
        }
        return json.dumps(bundle, indent=2)

    def export_csv(self) -> str:
        """Export RFC 4180 CSV of recorded interaction events."""
        output = io.StringIO()
        fieldnames = [
            'event_id',
            'session_id',
            'screen_id',
            'component_type',
            'event_type',
            'attempt_count',
            'hesitation_ms',
            'is_correction',
            'is_idle',
            'timestamp'
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames, lineterminator='\r\n')
        writer.writeheader()
        for e in self.events:
            writer.writerow(asdict(e))
        return output.getvalue()

    def clear_data(self):
        """Purges all in-memory events and counters."""
        self.events.clear()
        self._current_attempt_map.clear()
        self._last_interaction_time = time.time()

if __name__ == "__main__":
    engine = GSenseEngine()
    print("G-SENSE Python Learning Engine Initialized.")
    print("Test run: Recording sample interaction sequence...")
    engine.record_event("evt_1", "sess_demo", "main_screen", "button_submit", "repeat_attempt")
    engine.record_event("evt_2", "sess_demo", "main_screen", "button_submit", "correction", is_correction=True)
    summary = engine.compute_summary()
    print("Summary:", summary)
    csv_sample = engine.export_csv()
    print(f"CSV Header Preview: {csv_sample.splitlines()[0]}")
