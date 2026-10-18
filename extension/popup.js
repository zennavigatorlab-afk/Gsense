/**
 * G-SENSE Chrome Extension - Popup Controller
 * Tagline: AdaptiveAssistant
 */

function formatDwell(ms) {
  if (!ms || ms <= 0) return '0m 00s';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

// Download helper using Blob URL
function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

// CSV generator
function generateCsv(events = []) {
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

  const rows = events.map((ev) => [
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
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

// JSON generator
function generateJson(events = [], metrics = {}) {
  return JSON.stringify(
    {
      app: 'G-SENSE Chrome Extension',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      privacyGuarantees: {
        zeroKeystrokeLogging: true,
        zeroPasswordLogging: true,
        zeroFormValueLogging: true,
        cameraTracking: false,
        sanitizedUrlsOnly: true,
      },
      metricsSummary: metrics,
      recordsCount: events.length,
      events: events,
    },
    null,
    2
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const statusPill = document.getElementById('statusPill');
  const statusText = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleLearningBtn');
  const toggleBtnIcon = document.getElementById('toggleBtnIcon');
  const toggleBtnText = document.getElementById('toggleBtnText');

  const currentSiteName = document.getElementById('currentSiteName');
  const currentSiteDesc = document.getElementById('currentSiteDesc');

  const valDwell = document.getElementById('valDwell');
  const valPages = document.getElementById('valPages');
  const valClicks = document.getElementById('valClicks');
  const valBacktracks = document.getElementById('valBacktracks');
  const recordCount = document.getElementById('recordCount');

  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const purgeBtn = document.getElementById('purgeBtn');

  function updateStatusUI(status) {
    if (status === 'paused') {
      statusPill.className = 'status-pill status-paused';
      statusText.textContent = 'Paused';
      toggleBtnIcon.textContent = '▶';
      toggleBtnText.textContent = 'Resume Learning';
      toggleBtn.className = 'btn btn-primary';
    } else {
      statusPill.className = 'status-pill status-active';
      statusText.textContent = 'Active';
      toggleBtnIcon.textContent = '⏸';
      toggleBtnText.textContent = 'Pause Learning';
      toggleBtn.className = 'btn btn-secondary';
    }
  }

  function loadStorageData() {
    chrome.storage.local.get(
      ['gsense_learning_status', 'gsense_metrics', 'gsense_events'],
      (res) => {
        const status = res.gsense_learning_status || 'active';
        updateStatusUI(status);

        const metrics = res.gsense_metrics || {
          totalMonitoredPages: 0,
          totalActiveDwellMs: 0,
          totalRepeatClicks: 0,
          totalBacktracks: 0,
        };
        const events = res.gsense_events || [];

        valDwell.textContent = formatDwell(metrics.totalActiveDwellMs);
        valPages.textContent = metrics.totalMonitoredPages || 0;
        valClicks.textContent = metrics.totalRepeatClicks || 0;
        valBacktracks.textContent = metrics.totalBacktracks || 0;
        recordCount.textContent = `${events.length} records`;
      }
    );
  }

  // Check Current Active Tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0 || !tabs[0].url) {
      currentSiteName.textContent = 'No Active Webpage';
      currentSiteDesc.textContent = 'Open an ordinary website to begin';
      return;
    }

    const rawUrl = tabs[0].url;
    chrome.runtime.sendMessage({ type: 'GSENSE_CHECK_URL', url: rawUrl }, (res) => {
      if (chrome.runtime.lastError || !res) {
        currentSiteName.textContent = 'Extension Active';
        currentSiteDesc.textContent = 'Monitoring permitted metadata';
        return;
      }

      if (res.isSensitive) {
        currentSiteName.textContent = 'Excluded: Sensitive Page';
        currentSiteDesc.textContent = 'No tracking on internal, auth, or banking pages';
      } else {
        try {
          const parsed = new URL(rawUrl);
          currentSiteName.textContent = parsed.hostname;
          currentSiteDesc.textContent = 'Permitted browsing interaction metadata';
        } catch (e) {
          currentSiteName.textContent = 'Web Page';
          currentSiteDesc.textContent = 'Permitted browsing';
        }
      }
    });
  });

  // Toggle Learning Button Handler
  toggleBtn.addEventListener('click', () => {
    chrome.storage.local.get(['gsense_learning_status'], (res) => {
      const current = res.gsense_learning_status || 'active';
      const next = current === 'paused' ? 'active' : 'paused';
      chrome.storage.local.set({ gsense_learning_status: next }, () => {
        updateStatusUI(next);
      });
    });
  });

  // Export JSON Handler
  exportJsonBtn.addEventListener('click', () => {
    chrome.storage.local.get(['gsense_events', 'gsense_metrics'], (res) => {
      const jsonContent = generateJson(res.gsense_events || [], res.gsense_metrics || {});
      const filename = `gsense_export_${new Date().toISOString().slice(0, 10)}.json`;
      triggerDownload(jsonContent, filename, 'application/json');
    });
  });

  // Export CSV Handler
  exportCsvBtn.addEventListener('click', () => {
    chrome.storage.local.get(['gsense_events'], (res) => {
      const csvContent = generateCsv(res.gsense_events || []);
      const filename = `gsense_interactions_${new Date().toISOString().slice(0, 10)}.csv`;
      triggerDownload(csvContent, filename, 'text/csv');
    });
  });

  // Purge Button Handler
  purgeBtn.addEventListener('click', () => {
    const confirmed = confirm(
      'Are you sure you want to delete all recorded interaction data? This cannot be undone.'
    );
    if (!confirmed) return;

    chrome.storage.local.set(
      {
        gsense_events: [],
        gsense_metrics: {
          totalMonitoredPages: 0,
          totalActiveDwellMs: 0,
          totalRepeatClicks: 0,
          totalBacktracks: 0,
          totalIdleIntervals: 0,
        },
      },
      () => {
        loadStorageData();
      }
    );
  });

  // Initial load
  loadStorageData();
});
