"""
G-SENSE Windows Build & Packaging Script
Prepares standalone executable using PyInstaller.

Requirements:
- Windows 10/11 x64 build machine
- Python 3.10+
- pyinstaller >= 6.0
"""

import sys
import subprocess
import os

def build_windows_binary():
    print("=" * 60)
    print("G-SENSE Desktop Build & Packaging Utility")
    print("=" * 60)

    # Check platform
    if sys.platform != "win32":
        print(f"[!] Warning: Current host platform is '{sys.platform}'.")
        print("    Native Windows PE binaries (.exe) can only be linked and code-signed")
        print("    on a Windows host or Windows CI runner (e.g. GitHub Actions windows-latest).")
        print("    Generating packaging spec file for target environment...")

    spec_content = """# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['sqlite3', 'tkinter', 'gsense_engine', 'storage'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'numpy', 'scipy'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='GSense-AdaptiveAssistant',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
"""
    with open("GSense.spec", "w", encoding="utf-8") as f:
        f.write(spec_content)
    print("[✓] Created PyInstaller specification: GSense.spec")
    print("\nTo build the standalone installer on Windows:")
    print("  1. pip install -r requirements.txt")
    print("  2. pip install pyinstaller")
    print("  3. pyinstaller GSense.spec --clean")
    print("  Output will be available in dist/GSense-AdaptiveAssistant.exe")

if __name__ == "__main__":
    build_windows_binary()
