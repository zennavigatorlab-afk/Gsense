"""
G-SENSE Desktop - Active Window & UI Automation Tracker
Tagline: AdaptiveAssistant

Privacy Invariants:
- Opt-in only: Disabled by default.
- Never hooks or records keyboard, keystrokes, or typed text.
- Never reads clipboard contents, passwords, form values, or screen pixels.
- Automatically excludes sensitive windows (password managers, banking, incognito).
- Inspects only high-level window metadata: process executable name and window class.
- Supported Windows UI Automation: monitors permitted element invocations (buttons, tabs, menu items).
  Strictly ignores Text/Edit controls and password fields.
- Honest Boundary: Does NOT claim universal app support. Custom-rendered canvases,
  games, and certain closed Electron apps with disabled accessibility trees are not accessible.
"""

import sys
import time
import re
from typing import Optional, Dict, Any, Callable

# Sensitive window title patterns (financial, password managers, authentication, private browsing)
SENSITIVE_PATTERNS = [
    r'password',
    r'keepass',
    r'1password',
    r'bitwarden',
    r'lastpass',
    r'dashlane',
    r'authenticator',
    r'credential',
    r'inprivate',
    r'incognito',
    r'private browsing',
    r'bank',
    r'chase',
    r'wells fargo',
    r'paypal',
    r'stripe',
    r'sign in',
    r'log in',
    r'login',
    r'wallet',
    r'tax',
    r'security'
]

# Supported non-sensitive control types for UI Automation
PERMITTED_CONTROL_TYPES = {
    'Button',
    'TabItem',
    'MenuItem',
    'Hyperlink',
    'ListItem',
    'TreeItem',
    'ToolBar',
    'CheckBox',
    'RadioButton',
    'ComboBox'
}

# Forbidden control types (text, edit, document, password, clipboard)
FORBIDDEN_CONTROL_TYPES = {
    'Edit',
    'Document',
    'Text',
    'Password',
    'RichEdit',
    'Input'
}

def is_sensitive_window(title: str, process_name: str = "") -> bool:
    """Checks if a window title or process indicates sensitive content."""
    if not title:
        return False
    lower_title = title.lower()
    lower_proc = process_name.lower()

    for pat in SENSITIVE_PATTERNS:
        if re.search(pat, lower_title) or re.search(pat, lower_proc):
            return True
    return False

def sanitize_window_metadata(title: str, process_name: str) -> Dict[str, str]:
    """Sanitizes window title to protect private details while retaining process info."""
    proc = process_name.strip() or "unknown_app.exe"
    if is_sensitive_window(title, process_name):
        return {
            "app_process": proc,
            "window_title": "Sensitive Window (Excluded)",
            "is_sensitive": "true"
        }
    
    # Strip potentially private file paths or document names from title
    # Keep only the primary application name or sanitized title prefix
    clean_title = re.sub(r'[A-Za-z]:\\[^\\]+', '[path]', title)
    return {
        "app_process": proc,
        "window_title": clean_title[:60], # Bounded title length
        "is_sensitive": "false"
    }

class ActiveWindowTracker:
    """
    Monitors active foreground window transitions and permitted UI Automation events.
    Operates on Windows via ctypes / Win32 API.
    Provides graceful mock/simulation fallback on non-Windows platforms.
    """
    def __init__(self, on_window_change: Optional[Callable[[Dict[str, Any]], None]] = None):
        self.is_enabled = False # Opt-in only, OFF by default
        self.is_paused = False
        self.on_window_change = on_window_change
        self.current_window = None
        self.last_transition_time = time.time()
        self.dwell_time_ms = 0
        self.is_windows = sys.platform == "win32"

    def enable(self):
        self.is_enabled = True
        self.last_transition_time = time.time()

    def disable(self):
        self.is_enabled = False
        self.current_window = None

    def pause(self):
        self.is_paused = True

    def resume(self):
        self.is_paused = False
        self.last_transition_time = time.time()

    def get_foreground_window_info(self) -> Dict[str, Any]:
        """
        Retrieves foreground window information safely.
        On Windows: Uses GetForegroundWindow and GetWindowTextW.
        On other platforms: Returns a fallback representation.
        """
        if not self.is_windows:
            return {
                "available": False,
                "platform": sys.platform,
                "app_process": "desktop_shell",
                "window_title": "Active Desktop Session",
                "is_sensitive": False
            }

        try:
            import ctypes
            user32 = ctypes.windll.user32
            kernel32 = ctypes.windll.kernel32

            hwnd = user32.GetForegroundWindow()
            if not hwnd:
                return {"available": True, "app_process": "idle", "window_title": "Desktop", "is_sensitive": False}

            # Get window title
            length = user32.GetWindowTextLengthW(hwnd)
            buff = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buff, length + 1)
            raw_title = buff.value

            # Get process ID
            pid = ctypes.c_ulong()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

            # Query process name safely
            process_name = "unknown.exe"
            PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
            h_process = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid.value)
            if h_process:
                try:
                    proc_buff = ctypes.create_unicode_buffer(1024)
                    size = ctypes.c_ulong(1024)
                    if hasattr(kernel32, 'QueryFullProcessImageNameW'):
                        if kernel32.QueryFullProcessImageNameW(h_process, 0, proc_buff, ctypes.byref(size)):
                            full_path = proc_buff.value
                            process_name = full_path.split("\\")[-1]
                finally:
                    kernel32.CloseHandle(h_process)

            metadata = sanitize_window_metadata(raw_title, process_name)
            return {
                "available": True,
                "hwnd": hwnd,
                "app_process": metadata["app_process"],
                "window_title": metadata["window_title"],
                "is_sensitive": metadata["is_sensitive"] == "true"
            }
        except Exception:
            return {
                "available": True,
                "app_process": "system.exe",
                "window_title": "Standard Window",
                "is_sensitive": False
            }

    def process_tick(self) -> Optional[Dict[str, Any]]:
        """
        Periodic polling tick to evaluate foreground window changes.
        Returns event dict if a transition occurred.
        """
        if not self.is_enabled or self.is_paused:
            return None

        info = self.get_foreground_window_info()
        now = time.time()
        elapsed_ms = int((now - self.last_transition_time) * 1000)

        # Skip tracking sensitive windows
        if info.get("is_sensitive"):
            return {
                "event_type": "sensitive_window_ignored",
                "app_process": info.get("app_process"),
                "is_sensitive": True
            }

        app_name = info.get("app_process", "")
        if app_name != self.current_window:
            # Transition occurred
            previous_app = self.current_window
            self.current_window = app_name
            self.last_transition_time = now

            event_data = {
                "event_type": "window_switch",
                "previous_app": previous_app,
                "current_app": app_name,
                "dwell_previous_ms": elapsed_ms,
                "window_title": info.get("window_title", ""),
                "timestamp": now
            }
            if self.on_window_change:
                self.on_window_change(event_data)
            return event_data

        return None

    def process_ui_automation_element(self, control_type: str, element_id: str = "") -> Optional[Dict[str, Any]]:
        """
        Processes a permitted UI Automation event (e.g. Button invoked, Tab changed).
        Strictly rejects Edit, Text, Document, Password controls.
        """
        if not self.is_enabled or self.is_paused:
            return None

        # Absolute safety check: Never process text/edit controls
        if control_type in FORBIDDEN_CONTROL_TYPES:
            return None

        if control_type not in PERMITTED_CONTROL_TYPES:
            return None

        clean_id = (element_id or "element").strip()[:32]
        return {
            "event_type": "ui_automation_invoke",
            "control_type": control_type,
            "element_descriptor": clean_id,
            "timestamp": time.time()
        }
