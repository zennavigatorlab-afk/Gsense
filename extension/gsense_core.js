/**
 * G-SENSE Extension Core Logic & Privacy Invariants
 * Tagline: AdaptiveAssistant
 *
 * Privacy Guarantees:
 * 1. Zero Keystroke / Raw Text Collection: Never collect typed text, passwords, form values, or private messages.
 * 2. Strict URL Sanitization: Strips all query parameters (?token=...) and hash fragments (#access_token=...).
 * 3. Sensitive Page Exclusion: Automatically ignores browser internals, banking, payment, and authentication flows.
 * 4. Local-First: All records remain strictly in local browser storage (chrome.storage.local).
 * 5. Camera Off: Never requests or accesses camera or media devices.
 */

// Permitted event types for assistive pattern recognition
export const EVENT_TYPES = {
  NAVIGATION: 'navigation',
  ACTIVE_DWELL: 'active_dwell',
  REPEAT_CLICKS: 'repeat_clicks',
  BACKTRACK: 'backtrack',
  IDLE_PAUSE: 'idle_pause',
};

// URL Sanitization: extracts only protocol, hostname, and pathname.
// Strips all query strings, credentials, and hash fragments.
export function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl);
    // Return strictly protocol + hostname + pathname
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch (e) {
    return '';
  }
}

// Sensitive Page Detection: checks if the URL should be strictly excluded from all telemetry
export function isSensitiveUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return true;

  const lower = rawUrl.toLowerCase().trim();

  // 1. Privileged & internal browser protocols
  const blockedProtocols = [
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
  for (const proto of blockedProtocols) {
    if (lower.startsWith(proto)) return true;
  }

  try {
    const url = new URL(rawUrl);

    // Only allow http: and https:
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return true;
    }

    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    // 2. Sensitive domains (financial, authentication, password managers)
    const sensitiveDomainPatterns = [
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

    for (const pattern of sensitiveDomainPatterns) {
      if (hostname.includes(pattern)) return true;
    }

    // 3. Sensitive pathname tokens (auth, passwords, payments, medical)
    const sensitivePathKeywords = [
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

    for (const keyword of sensitivePathKeywords) {
      if (pathname.includes(keyword)) return true;
    }

    return false;
  } catch (e) {
    // Fail-safe: malformed URLs are considered sensitive
    return true;
  }
}

// Repeated click detector: calculates if clicks on the same target constitute a struggle incident
export class ClickTracker {
  constructor(thresholdCount = 3, windowMs = 2500) {
    this.thresholdCount = thresholdCount;
    this.windowMs = windowMs;
    this.clicks = [];
  }

  registerClick(elementDescriptor, timestamp = Date.now()) {
    // Clean old clicks outside the window
    this.clicks = this.clicks.filter((c) => timestamp - c.timestamp <= this.windowMs);

    // Add current click
    this.clicks.push({ target: elementDescriptor, timestamp });

    // Count recent clicks on identical target
    const countOnSameTarget = this.clicks.filter(
      (c) => c.target === elementDescriptor
    ).length;

    if (countOnSameTarget >= this.thresholdCount) {
      // Trigger detected, clear matched clicks to avoid duplicate triggers for the same incident
      this.clicks = this.clicks.filter((c) => c.target !== elementDescriptor);
      return {
        triggered: true,
        count: countOnSameTarget,
        target: elementDescriptor,
      };
    }

    return { triggered: false, count: countOnSameTarget, target: elementDescriptor };
  }

  reset() {
    this.clicks = [];
  }
}

// Dwell tracker: accurately separates active tab dwell from idle intervals
export class DwellTracker {
  constructor(idleTimeoutMs = 30000) {
    this.idleTimeoutMs = idleTimeoutMs;
    this.activeDwellMs = 0;
    this.idleIntervalsCount = 0;
    this.lastActivityTime = Date.now();
    this.sessionStartTime = Date.now();
    this.isVisible = true;
    this.isTracking = true;
  }

  recordActivity(timestamp = Date.now()) {
    if (!this.isTracking) return;

    if (this.isVisible) {
      const elapsedSinceLast = timestamp - this.lastActivityTime;
      if (elapsedSinceLast > this.idleTimeoutMs) {
        // Was idle for more than idleTimeoutMs
        this.idleIntervalsCount++;
      } else {
        // Active dwell within threshold
        this.activeDwellMs += elapsedSinceLast;
      }
    }
    this.lastActivityTime = timestamp;
  }

  setVisibility(visible, timestamp = Date.now()) {
    if (this.isVisible && !visible) {
      // Transitioning from visible to hidden: record final dwell slice
      const elapsed = timestamp - this.lastActivityTime;
      if (elapsed <= this.idleTimeoutMs) {
        this.activeDwellMs += elapsed;
      } else {
        this.idleIntervalsCount++;
      }
    }
    this.isVisible = visible;
    this.lastActivityTime = timestamp;
  }

  getActiveDwellMs(timestamp = Date.now()) {
    if (!this.isVisible || !this.isTracking) return this.activeDwellMs;
    const elapsed = timestamp - this.lastActivityTime;
    if (elapsed <= this.idleTimeoutMs) {
      return this.activeDwellMs + elapsed;
    }
    return this.activeDwellMs;
  }

  reset(timestamp = Date.now()) {
    this.activeDwellMs = 0;
    this.idleIntervalsCount = 0;
    this.lastActivityTime = timestamp;
    this.sessionStartTime = timestamp;
  }
}

// Backtracking detector: checks if user quickly navigates back within a threshold
export class BacktrackTracker {
  constructor(backtrackWindowMs = 8000) {
    this.backtrackWindowMs = backtrackWindowMs;
    this.historyStack = [];
  }

  recordNavigation(url, timestamp = Date.now()) {
    const clean = sanitizeUrl(url);
    if (!clean) return { isBacktrack: false };

    // Check if the previous entry in stack is this URL or if user returned to a preceding page
    if (this.historyStack.length > 1) {
      const previousPage = this.historyStack[this.historyStack.length - 2];
      const currentPage = this.historyStack[this.historyStack.length - 1];

      if (
        previousPage.url === clean &&
        timestamp - currentPage.timestamp <= this.backtrackWindowMs
      ) {
        // Detected immediate return to prior page within backtrack window
        this.historyStack.pop();
        return {
          isBacktrack: true,
          elapsedMs: timestamp - currentPage.timestamp,
          fromUrl: currentPage.url,
          toUrl: clean,
        };
      }
    }

    this.historyStack.push({ url: clean, timestamp });
    if (this.historyStack.length > 20) {
      this.historyStack.shift();
    }

    return { isBacktrack: false };
  }

  reset() {
    this.historyStack = [];
  }
}

// Formats export data into RFC 4180 compliant CSV
export function exportToCsv(events = []) {
  const headers = [
    'id',
    'timestamp',
    'isoTime',
    'eventType',
    'domain',
    'path',
    'dwellMs',
    'attemptCount',
    'isBacktrack',
    'isIdle',
  ];

  const rows = events.map((ev) => {
    return [
      ev.id || '',
      ev.timestamp || '',
      ev.timestamp ? new Date(ev.timestamp).toISOString() : '',
      ev.eventType || '',
      `"${(ev.domain || '').replace(/"/g, '""')}"`,
      `"${(ev.path || '').replace(/"/g, '""')}"`,
      ev.dwellMs || 0,
      ev.attemptCount || 1,
      ev.isBacktrack ? 'true' : 'false',
      ev.isIdle ? 'true' : 'false',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

// Formats export data into sanitized JSON bundle
export function exportToJson(events = [], metadata = {}) {
  return JSON.stringify(
    {
      app: 'G-SENSE Extension',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      privacyGuarantees: {
        zeroKeystrokeLogging: true,
        zeroPasswordLogging: true,
        zeroFormValueLogging: true,
        cameraTracking: false,
        sanitizedUrlsOnly: true,
      },
      metadata: {
        totalRecords: events.length,
        ...metadata,
      },
      events: events,
    },
    null,
    2
  );
}
