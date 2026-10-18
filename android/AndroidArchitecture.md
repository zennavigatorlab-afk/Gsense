# G-SENSE Android Architecture Design Specification

## 1. Project Status
- **Current State**: Architecture & Reference Design Phase (Not yet compiled as an APK/AAB).
- **Target OS**: Android 12+ (API level 31+) with Jetpack Compose UI.

## 2. In-App Learning vs. Cross-App Boundaries
- **Strict In-App Scope**: G-SENSE learns interaction patterns *strictly inside the G-SENSE application*.
- **No Cross-App Monitoring**: Android platform security (SELinux policies, app sandboxing, and Play Store policies) strictly prohibits background keylogging or cross-application telemetry. G-SENSE will **never** claim unrestricted cross-app monitoring or request deceptive Accessibility Services.

## 3. Interaction Signals Recorded
Within G-SENSE activities/composables:
1. **Touch Cadence**: Milliseconds between consecutive taps or gestures.
2. **Hesitation Dwell**: Extended pauses before pressing action buttons or confirming workflows.
3. **Multi-Tap / Retries**: Repeated taps on unresponsive or slow-loading targets.
4. **Correction Swipes & Back Navigations**: Back-button navigation immediately after an action.

## 4. Android Background Restrictions & Battery Policy
- **Respecting Doze Mode & App Standby Buckets**: G-SENSE relies on standard Android Lifecycle observers (`LifecycleEventObserver`).
- When the app is in the background, all event collection is suspended automatically.
- No continuous wake-locks or battery-draining background services are executed.
- Cloud sync (optional, via Supabase) uses Android Jetpack `WorkManager` with `NetworkType.CONNECTED` constraints to batch data during unmetered or charging intervals.

## 5. User Controls
- In-app toggle: "Enable touch interaction optimization".
- Instant data wipe: Clears SQLite Room database locally.
