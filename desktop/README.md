# G-SENSE Desktop (Windows Architecture)

This folder contains the native Windows desktop implementation and architecture of **G-SENSE — AdaptiveAssistant**.

## Core Architectural Guarantees
1. **Local-First Processing**: Interaction features are tracked and analyzed locally in `gsense_local.db` (SQLite).
2. **Zero Text/Password Logging**: The engine never logs keystroke text, typed credentials, clipboard data, or private screen content.
3. **Explicit Permissions**: Learning can be paused, inspected, exported, and purged at any moment from the UI.
4. **Startup Opt-In**: Automatic execution on Windows startup is **disabled by default**. Users can toggle it only with explicit consent.

## Running Locally
Requirements: Python 3.10 or higher.

```bash
# Run the Desktop UI
python app.py

# Run standalone engine unit test
python gsense_engine.py
```

## Packaging for Windows (.exe)
To compile a native `.exe` binary:
```bash
pip install -r requirements.txt
python build_windows.py
pyinstaller GSense.spec --clean
```
The binary will be generated in `dist/GSense-AdaptiveAssistant.exe`.
