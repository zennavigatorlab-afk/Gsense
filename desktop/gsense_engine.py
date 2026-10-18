"""
G-SENSE Learning Engine - Desktop Core
Tagline: AdaptiveAssistant
Meaning: G = Good; SENSE = learning interaction patterns.

Strict Privacy Invariants:
- Never records raw keystrokes, typed passwords, or message contents.
- Tracks only interaction dynamics: duration, attempt counts, hesitation dwell, navigation backtracks.
- Transparent metrics; no fake emotional or psychic inference.
"""

import time
import math
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

@dataclass
class InteractionEvent:
    event_id: str
    session_id: str
    screen_id: str
    component_type: str
    event_type: str # 'navigation', 'repeat_attempt', 'hesitation_pause', 'correction', 'action_success'
    attempt_count: int = 1
    hesitation_ms: int = 0
    is_correction: bool = False
    timestamp: float = 0.0

@dataclass
class LearningSummary:
    total_events: int
    avg_hesitation_ms: float
    correction_rate: float
    repeat_attempt_rate: float
    confidence_score: float # 0.0 to 1.0 based on statistical sample size
    confidence_label: str   # 'Low (gathering data)', 'Moderate', 'High'
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
        is_correction: bool = False
    ) -> Optional[InteractionEvent]:
        if self.is_paused:
            return None

        now = time.time()
        elapsed_ms = int((now - self._last_interaction_time) * 1000)
        self._last_interaction_time = now

        # Track repeat attempts per screen/component
        key = f"{screen_id}:{component_type}"
        current_attempts = self._current_attempt_map.get(key, 0) + 1
        self._current_attempt_map[key] = current_attempts

        event = InteractionEvent(
            event_id=event_id,
            session_id=session_id,
            screen_id=screen_id,
            component_type=component_type,
            event_type=event_type,
            attempt_count=current_attempts,
            hesitation_ms=elapsed_ms,
            is_correction=is_correction,
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
                avg_hesitation_ms=0.0,
                correction_rate=0.0,
                repeat_attempt_rate=0.0,
                confidence_score=0.0,
                confidence_label="No data collected yet",
                recommended_assistance="hints_only",
                explanation="No interaction data available. Defaulting to standard hints."
            )

        total_hesitation = sum(e.hesitation_ms for e in self.events)
        avg_hesitation = total_hesitation / total

        corrections = sum(1 for e in self.events if e.is_correction or e.event_type == 'correction')
        correction_rate = corrections / total

        repeats = sum(1 for e in self.events if e.attempt_count >= self.repeat_attempts_trigger)
        repeat_rate = repeats / total

        # Confidence based on real sample volume (50 samples for 100% statistical confidence)
        confidence = min(1.0, round(total / 50.0, 2))
        if confidence < 0.35:
            conf_label = "Preliminary (low sample count)"
        elif confidence < 0.75:
            conf_label = "Moderate (stabilizing)"
        else:
            conf_label = "High confidence (robust sample)"

        # Transparent rule logic
        if avg_hesitation > self.hesitation_threshold_ms or repeat_rate > 0.25 or correction_rate > 0.30:
            rec = "step_by_step"
            exp = (
                f"Elevated hesitation (avg {int(avg_hesitation)}ms) or frequent corrections "
                f"({int(correction_rate * 100)}%) detected. Step-by-step guidance recommended."
            )
        elif avg_hesitation < 3500 and correction_rate < 0.10 and repeat_rate < 0.10:
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
            avg_hesitation_ms=round(avg_hesitation, 1),
            correction_rate=round(correction_rate, 4),
            repeat_attempt_rate=round(repeat_rate, 4),
            confidence_score=confidence,
            confidence_label=conf_label,
            recommended_assistance=rec,
            explanation=exp
        )

    def export_data(self) -> str:
        return json.dumps([asdict(e) for e in self.events], indent=2)

    def clear_data(self):
        self.events.clear()
        self._current_attempt_map.clear()
        self._last_interaction_time = time.time()

if __name__ == "__main__":
    engine = GSenseEngine()
    print("G-SENSE Python Learning Engine Initialized.")
    print("Test run: Recording sample interaction sequence...")
    engine.record_event("evt_1", "sess_01", "settings", "toggle", "navigation")
    time.sleep(0.1)
    engine.record_event("evt_2", "sess_01", "settings", "input", "repeat_attempt", is_correction=True)
    summary = engine.compute_summary()
    print(f"Summary: {summary}")
