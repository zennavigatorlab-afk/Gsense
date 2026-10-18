/**
 * G-SENSE Chrome Extension - Content Script (Manifest V3)
 * Tagline: AdaptiveAssistant
 *
 * Strict Privacy Invariants:
 * 1. NEVER attaches keydown, keyup, input, change, or form submission listeners.
 * 2. NEVER reads input values, textContent, innerText, or passwords.
 * 3. Immediately aborts if page contains password fields or matches sensitive patterns.
 * 4. Respects Pause Learning immediately across tabs.
 * 5. Camera is completely OFF and never requested or referenced.
 */

(function () {
  // Sensitive URL Patterns Check
  function isSensitive(url) {
    if (!url || typeof url !== 'string') return true;
    const lower = url.toLowerCase().trim();

    const blockedPrefixes = [
      'chrome://',
      'chrome-extension://',
      'edge://',
      'about:',
      'file://',
      'view-source:',
      'moz-extension://',
      'brave://',
      'opera://',
      'data:',
      'javascript:',
    ];
    if (blockedPrefixes.some((p) => lower.startsWith(p))) return true;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;

      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname.toLowerCase();

      const sensitiveHosts = [
        'bank',
        'chase.com',
        'wellsfargo.com',
        'citibank.com',
        'bankofamerica.com',
        'capitalone.com',
        'paypal.com',
        'stripe.com',
        'venmo.com',
        'coinbase.com',
        'auth0.com',
        'okta.com',
        'accounts.google.com',
        'login.microsoftonline.com',
        'bitwarden.com',
        '1password.com',
        'lastpass.com',
        'login.',
        'signin.',
        'auth.',
        'identity.',
        'sso.',
      ];
      if (sensitiveHosts.some((sh) => host.includes(sh))) return true;

      const sensitivePaths = [
        '/login',
        '/signin',
        '/sign-in',
        '/signup',
        '/sign-up',
        '/auth',
        '/oauth',
        '/password',
        '/reset-password',
        '/forgot-password',
        '/2fa',
        '/mfa',
        '/verify',
        '/checkout',
        '/payment',
        '/billing',
        '/wallet',
        '/security',
        '/account/settings',
        '/my-health',
        '/patient',
      ];
      if (sensitivePaths.some((sp) => path.includes(sp))) return true;

      return false;
    } catch (e) {
      return true;
    }
  }

  const currentUrl = window.location.href;

  // Defense-in-depth: Exclude sensitive pages
  if (isSensitive(currentUrl)) {
    return;
  }

  // Defense-in-depth: If page has any password input, abort immediately
  if (document.querySelector('input[type="password"]')) {
    return;
  }

  let isPaused = false;
  let activeDwellMs = 0;
  let lastActiveTimestamp = Date.now();
  let pageLoadTimestamp = Date.now();
  const IDLE_THRESHOLD_MS = 30000; // 30s threshold distinguishes active dwell from idle pause

  // Repeated click tracking state (target descriptor -> timestamps)
  let lastClickedTarget = null;
  let clickTimestamps = [];

  // Check initial learning status from storage
  chrome.storage.local.get(['gsense_learning_status'], (res) => {
    isPaused = res.gsense_learning_status === 'paused';
    if (!isPaused) {
      recordNavigationEvent();
    }
  });

  // Listen for pause/resume changes dynamically
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.gsense_learning_status) {
      isPaused = changes.gsense_learning_status.newValue === 'paused';
      if (!isPaused) {
        lastActiveTimestamp = Date.now();
      }
    }
  });

  function safeSendEvent(eventData) {
    if (isPaused) return;
    try {
      chrome.runtime.sendMessage({
        type: 'GSENSE_RECORD_EVENT',
        event: {
          ...eventData,
          url: currentUrl,
          timestamp: Date.now(),
        },
      });
    } catch (e) {
      // Background worker might be waking up or extension reloaded
    }
  }

  function recordNavigationEvent() {
    safeSendEvent({
      eventType: 'navigation',
      attemptCount: 1,
      isBacktrack: false,
      isIdle: false,
    });
  }

  // Periodic and event-based dwell accumulation
  function updateDwell(isInteraction = false) {
    if (isPaused) return;
    const now = Date.now();
    const elapsed = now - lastActiveTimestamp;

    if (document.visibilityState === 'visible' && document.hasFocus()) {
      if (elapsed > IDLE_THRESHOLD_MS) {
        // Idle interval occurred
        safeSendEvent({
          eventType: 'idle_pause',
          dwellMs: elapsed,
          isIdle: true,
        });
      } else if (elapsed > 0) {
        activeDwellMs += elapsed;
      }
    }
    lastActiveTimestamp = now;
  }

  // Activity listeners to distinguish active dwell from idle time (throttled)
  let activityThrottle = 0;
  function onUserActive() {
    const now = Date.now();
    if (now - activityThrottle > 2000) {
      activityThrottle = now;
      updateDwell(true);
    }
  }

  window.addEventListener('scroll', onUserActive, { passive: true });
  window.addEventListener('mousemove', onUserActive, { passive: true });

  // Tab visibility changes (pauses dwell when tab is hidden or minimized)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      updateDwell();
    } else {
      lastActiveTimestamp = Date.now();
    }
  });

  window.addEventListener('blur', () => {
    updateDwell();
  });

  window.addEventListener('focus', () => {
    lastActiveTimestamp = Date.now();
  });

  // Repeated Click (Struggle / Retry) Detection
  // PRIVACY INVARIANT: We only check tagName/role. Never inspect values, text, or inputs!
  document.addEventListener(
    'click',
    (e) => {
      onUserActive();
      if (isPaused || !e.target) return;

      const targetEl = e.target;
      const tagName = (targetEl.tagName || '').toUpperCase();

      // If clicked on input/textarea/password, DO NOT examine further
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return;
      }

      // Generate structural non-sensitive descriptor
      let descriptor = tagName;
      if (targetEl.id) {
        descriptor += '#' + targetEl.id.slice(0, 20);
      } else if (targetEl.getAttribute('role')) {
        descriptor += '[role="' + targetEl.getAttribute('role') + '"]';
      }

      const now = Date.now();

      if (lastClickedTarget === descriptor) {
        clickTimestamps = clickTimestamps.filter((t) => now - t <= 2500);
        clickTimestamps.push(now);

        if (clickTimestamps.length >= 3) {
          // 3 rapid clicks on the same structural element within 2.5 seconds
          safeSendEvent({
            eventType: 'repeat_clicks',
            attemptCount: clickTimestamps.length,
            isBacktrack: false,
            isIdle: false,
          });
          clickTimestamps = []; // Reset incident
        }
      } else {
        lastClickedTarget = descriptor;
        clickTimestamps = [now];
      }
    },
    { capture: true, passive: true }
  );

  // Backtracking Detection: popstate or immediate navigation back within 8s
  window.addEventListener('popstate', () => {
    if (isPaused) return;
    const elapsedSinceLoad = Date.now() - pageLoadTimestamp;
    if (elapsedSinceLoad <= 8000) {
      safeSendEvent({
        eventType: 'backtrack',
        dwellMs: elapsedSinceLoad,
        isBacktrack: true,
        isIdle: false,
      });
    }
  });

  // Flush accumulated dwell when leaving page
  window.addEventListener('pagehide', () => {
    updateDwell();
    if (activeDwellMs > 1000) {
      safeSendEvent({
        eventType: 'active_dwell',
        dwellMs: activeDwellMs,
        isBacktrack: false,
        isIdle: false,
      });
    }
  });
})();
