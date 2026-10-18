# G-SENSE Desktop (Windows Architecture)
**Tagline: AdaptiveAssistant**  
*Meaning: G = Good; SENSE = learning interaction patterns.*

---

## 1. Overview & Architectural Guarantees

The **G-SENSE Desktop Application** provides native, local-first interaction pattern assistance for Windows. It features an in-app telemetry engine and an **opt-in Active Window and UI Automation tracker**.

### Strict Privacy Invariants
1. **Zero Text & Keystroke Logging**:
   - The desktop engine **never** installs low-level keyboard hooks (`WH_KEYBOARD` / `WH_KEYBOARD_LL`).
   - It **never** reads typed text, passwords, form values, clipboard contents, private messages, or screen pixels/screenshots.
2. **Opt-In Foreground Tracking (Off by Default)**:
   - Active window monitoring is **disabled by default**. It activates only after explicit user consent in the application interface.
3. **Sensitive Window Auto-Exclusion**:
   - Windows associated with password managers (`1Password`, `Bitwarden`, `KeePass`, `LastPass`), banking/financial portals (`Chase`, `Wells Fargo`, `PayPal`, `Stripe`), authentication screens (`Sign In`, `Log In`, `SSO`), and private browsing (`Incognito`, `InPrivate`) are automatically recognized and excluded from telemetry.
4. **Permitted UI Automation Only**:
   - Only structural interaction controls (`Button`, `TabItem`, `MenuItem`, `Hyperlink`, `CheckBox`) are processed.
   - Text inputs, edit controls, document contents, and password fields are strictly ignored (`FORBIDDEN_CONTROL_TYPES`).
5. **Honest Scope Limitation (No Universal App Claim)**:
   - G-SENSE relies on standard Windows Accessibility and UI Automation APIs (Win32, WPF, WinUI, WinForms).
   - Applications with custom hardware-rendered canvases, custom DirectX/OpenGL games, or proprietary Electron applications with accessibility trees disabled cannot and will not expose UI elements.
6. **Local-First & Full User Control**:
   - All data is stored in `gsense_local.db` (SQLite) on the user's local machine.
   - Users can pause learning, export data as formatted JSON or RFC 4180 CSV, and permanently purge all records at any time.

---

## 2. Directory Structure

```
desktop/
├── app.py               # Tkinter desktop UI with consent toggles, live status, and controls
├── gsense_engine.py     # Core Python learning engine with shared rules and CSV/JSON export
├── window_tracker.py    # Active window monitor & UI Automation element processor
├── storage.py           # Local SQLite database manager for settings and events
├── test_desktop.py      # Automated verification test suite
├── build_windows.py     # PyInstaller standalone executable packaging script
├── requirements.txt     # Python dependencies
└── README.md            # Architecture, setup instructions, and privacy declarations
```

---

## 3. Exact Setup & Running Instructions

### Requirements
- **Operating System**: Windows 10 or Windows 11 (Architecture reference also runs in fallback/mock mode on Linux/macOS).
- **Python**: Python 3.10 or higher.
- Standard Python library (Tkinter and SQLite3 are included with standard Python installations).

### Step 1: Install Dependencies
```bash
cd desktop
pip install -r requirements.txt
```

### Step 2: Run the Desktop Application
```bash
python app.py
```
*(On systems without a graphical display, `python -c "import window_tracker, gsense_engine; print('Desktop modules loaded successfully')"` verifies headless syntax and imports).*

### Step 3: Run the Verification Test Suite
```bash
python test_desktop.py
```
This executes all 8 automated tests:
1. Sensitive window and process filtering (zero password/banking leakage).
2. UI Automation control security boundaries (permitted buttons/tabs allowed; text/edit controls strictly blocked).
3. Active window tracker opt-in default and pause/resume compliance.
4. Learning rules and idle dwell separation (>30s).
5. JSON and RFC 4180 CSV export formatting with privacy guarantees.
6. Full local data purge verification.
7. SQLite persistence, settings store, and startup hydration roundtrip.
8. PyInstaller spec generation and desktop module verification.

### Step 4: Packaging for Windows Standalone Executable (.exe)

#### Option A: Automated GitHub Actions CI (Recommended)
The repository includes a production Windows CI workflow at:
`.github/workflows/windows_build.yml`

On every release tag (`v*`) or manual `workflow_dispatch`, this workflow:
1. Provisions a clean `windows-latest` 64-bit environment.
2. Installs dependencies and runs all verification tests.
3. Compiles the standalone executable via PyInstaller.
4. Computes SHA-256 checksums (`dist/checksums.sha256`).
5. Publishes `GSense-AdaptiveAssistant.exe` as a downloadable GitHub Release artifact.

#### Option B: Local Compilation on Windows 10/11 x64
In a Windows 10/11 environment:
```bash
pip install -r desktop/requirements.txt
python desktop/build_windows.py --build
```
The standalone executable will be output to:
`dist/GSense-AdaptiveAssistant.exe`
