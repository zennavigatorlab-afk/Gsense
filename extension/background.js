/**
 * G-SENSE Chrome Extension - Background Service Worker (Manifest V3)
 * Tagline: AdaptiveAssistant
 *
 * Privacy Invariants:
 * - Never collects raw text, passwords, or input values.
 * - Respects Pause Learning immediately across all tabs.
 * - Strips query parameters and hashes from URLs.
 * - Keeps all metrics strictly local in chrome.storage.local.
 */

// Default clean state
const DEFAULT_METRICS = {
  totalMonitoredPages: 0,
  totalActiveDwellMs: 0,
  totalRepeatClicks: 0,
  totalBacktracks: 0,
  totalIdleIntervals: 0,
};

// URL Sanitizer
function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch (e) {
    return '';
  }
}

// Sensitive URL check
function isSensitiveUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return true;
  const lower = rawUrl.toLowerCase().trim();

  // Internal and non-web protocols
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
  if (blockedPrefixes.some((prefix) => lower.startsWith(prefix))) {
    return true;
  }

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;

    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    // Financial & Auth domains
    const sensitiveDomains = [
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
    if (sensitiveDomains.some((d) => hostname.includes(d))) return true;

    // Sensitive path tokens
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
    if (sensitivePaths.some((p) => pathname.includes(p))) return true;

    return false;
  } catch (e) {
    return true;
  }
}

// Initialize default state on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['gsense_learning_status', 'gsense_metrics', 'gsense_events'], (res) => {
    const updates = {};
    if (!res.gsense_learning_status) {
      updates.gsense_learning_status = 'active';
    }
    if (!res.gsense_metrics) {
      updates.gsense_metrics = { ...DEFAULT_METRICS };
    }
    if (!res.gsense_events) {
      updates.gsense_events = [];
    }
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
});

// Message Listener for content scripts and popup UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  switch (message.type) {
    case 'GSENSE_CHECK_URL': {
      const url = message.url || (sender.tab && sender.tab.url);
      const sensitive = isSensitiveUrl(url);
      chrome.storage.local.get(['gsense_learning_status'], (res) => {
        sendResponse({
          isSensitive: sensitive,
          learningStatus: res.gsense_learning_status || 'active',
        });
      });
      return true; // Keep channel open for async response
    }

    case 'GSENSE_RECORD_EVENT': {
      chrome.storage.local.get(
        ['gsense_learning_status', 'gsense_events', 'gsense_metrics'],
        (res) => {
          // Strict Pause Enforcement
          if (res.gsense_learning_status === 'paused') {
            sendResponse({ status: 'ignored_paused' });
            return;
          }

          const rawEvent = message.event || {};
          const rawUrl = rawEvent.url || (sender.tab && sender.tab.url) || '';

          // Sensitive Exclusion Check
          if (isSensitiveUrl(rawUrl)) {
            sendResponse({ status: 'ignored_sensitive' });
            return;
          }

          const cleanUrl = sanitizeUrl(rawUrl);
          let parsedUrl;
          try {
            parsedUrl = new URL(cleanUrl);
          } catch (e) {
            sendResponse({ status: 'ignored_invalid_url' });
            return;
          }

          // Strict Privacy Check: reject any event attempting to include raw text
          if (rawEvent.text || rawEvent.value || rawEvent.password || rawEvent.input) {
            sendResponse({ status: 'rejected_privacy_violation' });
            return;
          }

          const cleanEvent = {
            id: 'evt_' + Math.random().toString(36).slice(2, 10),
            timestamp: rawEvent.timestamp || Date.now(),
            eventType: rawEvent.eventType || 'interaction',
            domain: parsedUrl.hostname,
            path: parsedUrl.pathname,
            dwellMs: typeof rawEvent.dwellMs === 'number' ? Math.round(rawEvent.dwellMs) : 0,
            attemptCount: typeof rawEvent.attemptCount === 'number' ? rawEvent.attemptCount : 1,
            isBacktrack: Boolean(rawEvent.isBacktrack),
            isIdle: Boolean(rawEvent.isIdle),
          };

          const events = Array.isArray(res.gsense_events) ? res.gsense_events : [];
          events.push(cleanEvent);

          // Bound array size to 500 records to prevent memory/storage bloat
          if (events.length > 500) {
            events.shift();
          }

          // Update aggregated metrics
          const metrics = res.gsense_metrics || { ...DEFAULT_METRICS };
          if (cleanEvent.eventType === 'navigation') {
            metrics.totalMonitoredPages = (metrics.totalMonitoredPages || 0) + 1;
          }
          if (cleanEvent.dwellMs > 0 && !cleanEvent.isIdle) {
            metrics.totalActiveDwellMs = (metrics.totalActiveDwellMs || 0) + cleanEvent.dwellMs;
          }
          if (cleanEvent.eventType === 'repeat_clicks') {
            metrics.totalRepeatClicks = (metrics.totalRepeatClicks || 0) + 1;
          }
          if (cleanEvent.isBacktrack || cleanEvent.eventType === 'backtrack') {
            metrics.totalBacktracks = (metrics.totalBacktracks || 0) + 1;
          }
          if (cleanEvent.isIdle || cleanEvent.eventType === 'idle_pause') {
            metrics.totalIdleIntervals = (metrics.totalIdleIntervals || 0) + 1;
          }

          chrome.storage.local.set({
            gsense_events: events,
            gsense_metrics: metrics,
          });

          sendResponse({ status: 'recorded', eventId: cleanEvent.id });
        }
      );
      return true;
    }

    case 'GSENSE_TOGGLE_LEARNING': {
      chrome.storage.local.get(['gsense_learning_status'], (res) => {
        const nextStatus = res.gsense_learning_status === 'paused' ? 'active' : 'paused';
        chrome.storage.local.set({ gsense_learning_status: nextStatus }, () => {
          sendResponse({ learningStatus: nextStatus });
        });
      });
      return true;
    }

    case 'GSENSE_PURGE_DATA': {
      chrome.storage.local.set(
        {
          gsense_events: [],
          gsense_metrics: { ...DEFAULT_METRICS },
        },
        () => {
          sendResponse({ status: 'purged' });
        }
      );
      return true;
    }

    default:
      sendResponse({ status: 'unknown_type' });
      return false;
  }
});
