"""
G-SENSE Windows Build & Packaging Utility
Prepares standalone 64-bit executable using PyInstaller.

Requirements for compiling native PE binaries (.exe):
- 64-bit Windows host or GitHub Actions CI runner (windows-latest)
- Python 3.10+ (64-bit)
- PyInstaller >= 6.0
"""

import sys
import os
import argparse
import subprocess
import shutil

DESKTOP_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(DESKTOP_DIR, ".."))

def generate_spec_file(output_spec_path: str = None) -> str:
    """Generates a complete PyInstaller specification file."""
    if output_spec_path is None:
        output_spec_path = os.path.join(DESKTOP_DIR, "GSense.spec")

    app_py_path = os.path.join(DESKTOP_DIR, "app.py").replace("\\", "/")
    desktop_path = DESKTOP_DIR.replace("\\", "/")

    spec_content = f"""# -*- mode: python ; coding: utf-8 -*-
# G-SENSE Standalone Windows Executable Specification

import os
import sys

block_cipher = None
desktop_path = r'{desktop_path}'

a = Analysis(
    ['{app_py_path}'],
    pathex=[desktop_path],
    binaries=[],
    datas=[],
    hiddenimports=[
        'sqlite3',
        'tkinter',
        'tkinter.ttk',
        'tkinter.messagebox',
        'tkinter.filedialog',
        'gsense_engine',
        'storage',
        'window_tracker'
    ],
    hookspath=[],
    hooksconfig={{}},
    runtime_hooks=[],
    excludes=['matplotlib', 'numpy', 'scipy', 'pandas', 'IPython', 'pytest'],
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
    upx=False,
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
    with open(output_spec_path, "w", encoding="utf-8") as f:
        f.write(spec_content)

    # Also keep a copy at repo root for CI workflows executing from root
    root_spec = os.path.join(REPO_ROOT, "GSense.spec")
    if root_spec != output_spec_path:
        with open(root_spec, "w", encoding="utf-8") as f:
            f.write(spec_content)

    return output_spec_path

def verify_modules():
    """Verifies all desktop modules import cleanly."""
    print("[*] Verifying desktop Python modules...")
    sys.path.insert(0, DESKTOP_DIR)
    try:
        import gsense_engine
        import storage
        import window_tracker
        print("  ✓ gsense_engine.py: OK")
        print("  ✓ storage.py: OK")
        print("  ✓ window_tracker.py: OK")
        return True
    except Exception as e:
        print(f"  ❌ Import error: {e}")
        return False

def build_windows_binary(trigger_build: bool = False):
    print("=" * 65)
    print("   G-SENSE Desktop Build & Packaging Utility (x64 Windows)")
    print("=" * 65)

    if not verify_modules():
        sys.exit(1)

    spec_path = generate_spec_file()
    print(f"[✓] Created PyInstaller specification at: {spec_path}")

    # Inspect current platform
    is_windows = sys.platform == "win32"
    if not is_windows:
        print(f"\n[!] Notice: Host platform is '{sys.platform}' (Linux/Unix).")
        print("    Native Windows PE binaries (.exe) require a 64-bit Windows environment")
        print("    to link Win32 runtime libraries and create valid PE headers.")
        print("    The GitHub Actions CI workflow (.github/workflows/windows_build.yml)")
        print("    is configured to automatically compile and release 'GSense-AdaptiveAssistant.exe'.")
        print("\n[✓] Specification generation and pre-flight module verification completed.")
        return 0

    if trigger_build:
        print("\n[*] Host is Windows! Initiating PyInstaller build...")
        pyinstaller_cmd = shutil.which("pyinstaller")
        if not pyinstaller_cmd:
            print("  ❌ PyInstaller not found in PATH. Install with: pip install pyinstaller")
            return 1

        dist_dir = os.path.join(REPO_ROOT, "dist")
        work_dir = os.path.join(REPO_ROOT, "build")
        os.makedirs(dist_dir, exist_ok=True)
        os.makedirs(work_dir, exist_ok=True)

        cmd = [
            pyinstaller_cmd,
            spec_path,
            "--distpath", dist_dir,
            "--workpath", work_dir,
            "--clean",
            "--noconfirm"
        ]
        print(f"    Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, cwd=REPO_ROOT)
        if result.returncode == 0:
            exe_path = os.path.join(dist_dir, "GSense-AdaptiveAssistant.exe")
            alt_exe_path = os.path.join(DESKTOP_DIR, "dist", "GSense-AdaptiveAssistant.exe")
            if not os.path.exists(exe_path) and os.path.exists(alt_exe_path):
                shutil.copy2(alt_exe_path, exe_path)

            if os.path.exists(exe_path):
                size_mb = os.path.getsize(exe_path) / (1024 * 1024)
                print(f"\n[✓] Build Succeeded!")
                print(f"    Output Binary: {exe_path} ({size_mb:.2f} MB)")
                return 0
        print("  ❌ PyInstaller build failed.")
        return result.returncode if result.returncode != 0 else 1

    print("\nTo build manually on a Windows host:")
    print("  1. pip install -r desktop/requirements.txt")
    print("  2. python desktop/build_windows.py --build")
    print("  Output will be placed in dist/GSense-AdaptiveAssistant.exe")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="G-SENSE Windows Build Utility")
    parser.add_argument("--build", action="store_true", help="Run PyInstaller build if on Windows host")
    parser.add_argument("--verify-only", action="store_true", help="Verify modules and exit")
    args = parser.parse_args()

    if args.verify_only:
        sys.exit(0 if verify_modules() else 1)
    else:
        sys.exit(build_windows_binary(trigger_build=args.build))
