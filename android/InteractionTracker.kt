package com.gsense.adaptiveassistant.learning

import android.os.SystemClock
import java.util.UUID

/**
 * G-SENSE Touch-Interaction Learning Engine (Android In-App Architecture)
 *
 * Privacy Invariants:
 * - Scoped exclusively to the G-SENSE in-app user session.
 * - Does NOT perform cross-app inspection or global Accessibility scraping.
 * - Records touch cadence, hesitation dwell, multi-touch repeats, and correction backtracks.
 * - Zero logging of text inputs or credentials.
 */
data class TouchInteractionEvent(
    val eventId: String = UUID.randomUUID().toString(),
    val screenId: String,
    val componentTag: String,
    val eventType: String, // "tap", "repeat_tap", "hesitation_dwell", "backtrack_navigation"
    val attemptCount: Int = 1,
    val dwellDurationMs: Long = 0,
    val isCorrection: Boolean = false,
    val timestampMs: Long = System.currentTimeMillis()
)

class InteractionTracker(
    private val hesitationThresholdMs: Long = 7000L,
    private val repeatAttemptThreshold: Int = 3
) {
    private var isLearningActive: Boolean = true
    private var lastInteractionClockMs: Long = SystemClock.uptimeMillis()
    private val attemptCounters = mutableMapOf<String, Int>()
    private val eventHistory = mutableListOf<TouchInteractionEvent>()

    fun setLearningActive(active: Boolean) {
        this.isLearningActive = active
        if (active) {
            lastInteractionClockMs = SystemClock.uptimeMillis()
        }
    }

    /**
     * Records a permitted UI interaction within the G-SENSE application.
     */
    fun onComponentTouched(
        screenId: String,
        componentTag: String,
        isBacktrack: Boolean = false
    ): TouchInteractionEvent? {
        if (!isLearningActive) return null

        val nowClock = SystemClock.uptimeMillis()
        val dwellTime = nowClock - lastInteractionClockMs
        lastInteractionClockMs = nowClock

        val key = "$screenId:$componentTag"
        val count = (attemptCounters[key] ?: 0) + 1
        attemptCounters[key] = count

        val eventType = when {
            isBacktrack -> "backtrack_navigation"
            count >= repeatAttemptThreshold -> "repeat_tap"
            dwellTime >= hesitationThresholdMs -> "hesitation_dwell"
            else -> "tap"
        }

        val event = TouchInteractionEvent(
            screenId = screenId,
            componentTag = componentTag,
            eventType = eventType,
            attemptCount = count,
            dwellDurationMs = dwellTime,
            isCorrection = isBacktrack,
            timestampMs = System.currentTimeMillis()
        )

        eventHistory.add(event)
        return event
    }

    fun resetComponentCount(screenId: String, componentTag: String) {
        attemptCounters["$screenId:$componentTag"] = 0
    }

    fun getEventCount(): Int = eventHistory.size

    fun exportHistory(): List<TouchInteractionEvent> = eventHistory.toList()

    fun clearHistory() {
        eventHistory.clear()
        attemptCounters.clear()
        lastInteractionClockMs = SystemClock.uptimeMillis()
    }
}
