# G-SENSE Chrome Extension (Manifest V3)
**Tagline: AdaptiveAssistant**  
*Meaning: G = Good; SENSE = learning interaction patterns.*

---

## 1. Overview & Purpose
The **G-SENSE Chrome Extension** extends the G-SENSE AdaptiveAssistant architecture to ordinary web browsing. It monitors permitted high-level interaction metadata—such as active-tab dwell duration, repeated button/link clicks (struggles), and rapid backtracking (dead ends)—to understand user interaction patterns and provide assistive guidance without recording raw text or private content.

### Strict Privacy Invariants
1. **Zero Keystrokes & Zero Text Logging**:
   - The extension **never** registers `keydown`, `keyup`, `keypress`, `input`, `change`, `beforeinput`, or `paste` event listeners.
   - The extension **never** reads `element.value`, `element.textContent`, or form inputs.
2. **Automatic Exclusion of Sensitive Pages**:
   - Privileged browser protocols (`chrome://`, `chrome-extension://`, `edge://`, `about:`, `file://`, `view-source:`) are excluded.
   - Banking, financial, and authentication services (`login.*`, `auth.*`, `bank.*`, `paypal.com`, `stripe.com`, `accounts.google.com`, etc.) are excluded.
   - Sensitive URL paths (`/login`, `/signin`, `/signup`, `/password`, `/checkout`, `/payment`, `/billing`, `/2fa`, `/my-health`) are ignored.
3. **Password Page Auto-Abort**:
   - If any `<input type="password">` is detected on a page, the content script immediately aborts all execution.
4. **URL Sanitization**:
   - Strips all query parameters (`?token=...`, `?key=...`, `?search=...`) and hash fragments (`#access_token=...`). Only sanitized protocol, domain, and clean pathname are retained.
5. **Camera Completely Off**:
   - The extension does not request camera permissions and never accesses media devices.
6. **Local-First Storage**:
   - All events and metrics remain strictly within the user's browser in `chrome.storage.local`. No external telemetry or telemetry servers.

---

## 2. Installation Instructions (Google Chrome / Chromium)

### Step 1: Open Chrome Extensions Settings
1. Open Google Chrome (or any Chromium browser like Brave, Edge, or Kiwi Browser on Android).
2. In the address bar, navigate to:  
   `chrome://extensions/`

### Step 2: Enable Developer Mode
1. In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.

### Step 3: Load Unpacked Extension
1. Click the **Load unpacked** button in the top-left toolbar.
2. In the file picker dialog, select the `extension` folder inside this repository:
   ```
   <project-root>/extension
   ```
3. Click **Select Folder** (or **Open**).

### Step 4: Verify & Pin
1. You will see **G-SENSE — AdaptiveAssistant** appear in your extension list with version `1.0.0`.
2. Click the puzzle-piece icon in the Chrome toolbar and pin **G-SENSE** for quick access.
3. Click the extension icon to open the popup dashboard.

---

## 3. Extension Architecture (Manifest V3)

```
extension/
├── manifest.json         # Manifest V3 configuration with minimal permissions
├── background.js         # Service worker: manages storage & privacy validation
├── content.js            # Content script: tracks permitted interaction metadata
├── gsense_core.js        # Core algorithms, sanitizers, and export generators
├── popup.html            # Extension popup UI
├── popup.js              # Controller for live metrics, pause toggle, export, & purge
├── popup.css             # Light/dark responsive styles with subtle blue accents
├── icons/                # Extension icon assets (16x16, 48x48, 128x128 PNG & SVG)
└── README.md             # Architecture, instructions, and privacy guarantees
```

### Manifest Permissions
- `"storage"`: Storing pause/active state and bounded local interaction records.
- `"activeTab"`: Allowing the popup to inspect the active tab's domain for privacy status.
- Host permissions: `["http://*/*", "https://*/*"]` for ordinary websites.

---

## 4. Permitted Interaction Metrics & Exact Formulas

1. **Active Tab Dwell (`active_dwell`)**:
   - **Formula**: $\text{Active Dwell} = \sum (\text{Active Duration while visible and focused})$.
   - Pauses immediately when `document.visibilityState === 'hidden'` or window blurs.
   - If no user interaction (scroll, click, mousemove) occurs for more than 30 seconds, that interval is recorded as an `idle_pause`, not active dwell.
2. **Repeated Clicks (`repeat_clicks`)**:
   - **Formula**: $\ge 3$ clicks on the exact same button or link element within a 2.5-second sliding window.
   - Indicates struggling with an unresponsive control or unconfirmed action.
   - Only records structural element tag (e.g. `BUTTON` or `[role="button"]`), never element contents or inputs.
3. **Backtracking (`backtrack`)**:
   - **Formula**: Immediate return to a preceding page via history back / popstate within 8 seconds of page load.
   - Indicates confusion, dead ends, or disorientation.

---

## 5. Controls & User Rights

- **Pause / Resume Learning**:
  - One-click toggle in the popup UI immediately halts all event collection across all active tabs without requiring page reloads.
- **Export JSON**:
  - Generates a full structured JSON file containing metadata, verification guarantees, and all recorded interaction events.
- **Export CSV**:
  - Exports an RFC 4180 compliant CSV table suitable for spreadsheet analysis.
- **Purge All Data**:
  - Completely wipes all records and counters from `chrome.storage.local`.

---

## 6. Honest Limitations & Operational Boundaries

1. **Manifest V3 Service Worker Lifecycle**:
   - In Manifest V3, background service workers are suspended when idle to conserve system RAM and CPU. The extension handles this gracefully by storing all persistent state in `chrome.storage.local`.
2. **Cross-Origin iframes**:
   - Content scripts cannot inspect cross-origin `<iframe>` elements due to browser sandbox security policies.
3. **Browser Boundary**:
   - The Chrome extension only operates within the browser context. For OS-level interaction tracking (e.g. Windows desktop applications), refer to the separate `desktop/` Python module.
4. **Android Limitations**:
   - Standard Google Chrome on Android does not support desktop extensions. To test on Android, use Chromium-based mobile browsers that support extension loading (such as Kiwi Browser or Firefox Nightly).
