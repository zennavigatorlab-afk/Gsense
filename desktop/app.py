"""
G-SENSE Windows Desktop Architecture Application
Tkinter / Native cross-platform desktop UI implementation.
Features:
- Live pattern engine controls (Pause, Resume, Clear, Export JSON/CSV)
- Opt-in Active Window & UI Automation tracking (Disabled by default)
- Automatic exclusion of sensitive windows (passwords, banking, private browsing)
- Startup setting toggle (Disabled by default)
- Safe exit and status reporting
"""

import sys
import os
import json
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from dataclasses import asdict
from gsense_engine import GSenseEngine, InteractionEvent
from storage import DesktopStorage
from window_tracker import ActiveWindowTracker, is_sensitive_window

class GSenseDesktopApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("G-SENSE — AdaptiveAssistant Desktop")
        self.root.geometry("680x560")
        self.root.minsize(600, 500)

        self.engine = GSenseEngine()
        self.storage = DesktopStorage()
        self.window_tracker = ActiveWindowTracker(on_window_change=self._on_window_event)

        self._init_ui()
        self._load_stored_settings()
        self._start_tracker_poll()

    def _init_ui(self):
        # Configure theme styling
        self.root.configure(bg="#0F172A")
        style = ttk.Style()
        style.theme_use("clam")

        # Header Frame
        header = tk.Frame(self.root, bg="#1E293B", padx=16, pady=14)
        header.pack(fill=tk.X)

        title_lbl = tk.Label(
            header,
            text="G-SENSE AdaptiveAssistant — Desktop",
            font=("Segoe UI", 14, "bold"),
            fg="#F8FAFC",
            bg="#1E293B"
        )
        title_lbl.pack(anchor="w")

        sub_lbl = tk.Label(
            header,
            text="Privacy-first interaction pattern learning. Zero keystroke, clipboard, or screen capture.",
            font=("Segoe UI", 9),
            fg="#94A3B8",
            bg="#1E293B"
        )
        sub_lbl.pack(anchor="w")

        # Main Content
        content = tk.Frame(self.root, bg="#0F172A", padx=16, pady=16)
        content.pack(fill=tk.BOTH, expand=True)

        # Status Panel
        status_card = tk.LabelFrame(
            content,
            text=" Engine & Active Window Status ",
            font=("Segoe UI", 10, "bold"),
            fg="#E2E8F0",
            bg="#1E293B",
            padx=12,
            pady=10
        )
        status_card.pack(fill=tk.X, pady=(0, 12))

        self.status_var = tk.StringVar(value="Active: Local in-app learning boundaries")
        self.status_lbl = tk.Label(
            status_card,
            textvariable=self.status_var,
            font=("Segoe UI", 9, "bold"),
            fg="#38BDF8",
            bg="#1E293B"
        )
        self.status_lbl.pack(anchor="w")

        self.window_var = tk.StringVar(value="Active Window Tracker: Disabled (Opt-in required)")
        self.window_lbl = tk.Label(
            status_card,
            textvariable=self.window_var,
            font=("Segoe UI", 9),
            fg="#CBD5E1",
            bg="#1E293B"
        )
        self.window_lbl.pack(anchor="w", pady=(2, 0))

        self.metrics_var = tk.StringVar(value="Events recorded: 0 | Confidence: No data collected yet")
        metrics_lbl = tk.Label(
            status_card,
            textvariable=self.metrics_var,
            font=("Segoe UI", 9),
            fg="#94A3B8",
            bg="#1E293B"
        )
        metrics_lbl.pack(anchor="w", pady=(4, 0))

        # Privacy & Permission Settings Panel
        perm_card = tk.LabelFrame(
            content,
            text=" Privacy & Permission Settings ",
            font=("Segoe UI", 10, "bold"),
            fg="#E2E8F0",
            bg="#1E293B",
            padx=12,
            pady=10
        )
        perm_card.pack(fill=tk.X, pady=(0, 12))

        self.track_perm_var = tk.BooleanVar(value=True)
        chk_track = tk.Checkbutton(
            perm_card,
            text="Allow internal in-app telemetry (hesitation, pauses, retry clicks)",
            variable=self.track_perm_var,
            command=self._on_permission_toggle,
            bg="#1E293B",
            fg="#F8FAFC",
            selectcolor="#0F172A",
            activebackground="#1E293B",
            activeforeground="#F8FAFC"
        )
        chk_track.pack(anchor="w")

        # Opt-in Active Window & UI Automation Tracking
        self.window_track_var = tk.BooleanVar(value=False)
        chk_window_track = tk.Checkbutton(
            perm_card,
            text="Enable Active Window & UI Automation Tracking (Opt-in, Off by default)",
            variable=self.window_track_var,
            command=self._on_window_track_toggle,
            bg="#1E293B",
            fg="#F8FAFC",
            selectcolor="#0F172A",
            activebackground="#1E293B",
            activeforeground="#F8FAFC"
        )
        chk_window_track.pack(anchor="w", pady=(2, 0))

        self.startup_var = tk.BooleanVar(value=False)
        chk_startup = tk.Checkbutton(
            perm_card,
            text="Run G-SENSE at Windows startup (Disabled by default)",
            variable=self.startup_var,
            command=self._on_startup_toggle,
            bg="#1E293B",
            fg="#F8FAFC",
            selectcolor="#0F172A",
            activebackground="#1E293B",
            activeforeground="#F8FAFC"
        )
        chk_startup.pack(anchor="w", pady=(2, 0))

        # Test Actions / Simulated Interactions
        sim_card = tk.LabelFrame(
            content,
            text=" Test Interaction in App ",
            font=("Segoe UI", 10, "bold"),
            fg="#E2E8F0",
            bg="#1E293B",
            padx=12,
            pady=10
        )
        sim_card.pack(fill=tk.X, pady=(0, 12))

        btn_row = tk.Frame(sim_card, bg="#1E293B")
        btn_row.pack(fill=tk.X)

        btn_nav = tk.Button(
            btn_row,
            text="Simulate Navigation",
            command=lambda: self._simulate_event("nav_button", "navigation"),
            bg="#2563EB",
            fg="white",
            relief=tk.FLAT,
            padx=10,
            pady=5
        )
        btn_nav.pack(side=tk.LEFT, padx=(0, 8))

        btn_repeat = tk.Button(
            btn_row,
            text="Simulate Repeat Attempt",
            command=lambda: self._simulate_event("submit_button", "repeat_attempt"),
            bg="#475569",
            fg="white",
            relief=tk.FLAT,
            padx=10,
            pady=5
        )
        btn_repeat.pack(side=tk.LEFT, padx=(0, 8))

        btn_correct = tk.Button(
            btn_row,
            text="Simulate Correction",
            command=lambda: self._simulate_event("form_input", "correction", is_correction=True),
            bg="#475569",
            fg="white",
            relief=tk.FLAT,
            padx=10,
            pady=5
        )
        btn_correct.pack(side=tk.LEFT, padx=(0, 8))

        btn_uia = tk.Button(
            btn_row,
            text="Simulate UI Automation Click",
            command=lambda: self._simulate_uia_event("Button", "save_toolbar_button"),
            bg="#0D9488",
            fg="white",
            relief=tk.FLAT,
            padx=10,
            pady=5
        )
        btn_uia.pack(side=tk.LEFT)

        # Bottom Action Bar
        bottom_bar = tk.Frame(self.root, bg="#1E293B", padx=16, pady=12)
        bottom_bar.pack(fill=tk.X, side=tk.BOTTOM)

        self.btn_pause = tk.Button(
            bottom_bar,
            text="Pause Learning",
            command=self._toggle_pause,
            bg="#334155",
            fg="white",
            relief=tk.FLAT,
            padx=12,
            pady=6
        )
        self.btn_pause.pack(side=tk.LEFT, padx=(0, 8))

        btn_export_json = tk.Button(
            bottom_bar,
            text="Export JSON",
            command=self._export_json,
            bg="#334155",
            fg="white",
            relief=tk.FLAT,
            padx=12,
            pady=6
        )
        btn_export_json.pack(side=tk.LEFT, padx=(0, 8))

        btn_export_csv = tk.Button(
            bottom_bar,
            text="Export CSV",
            command=self._export_csv,
            bg="#334155",
            fg="white",
            relief=tk.FLAT,
            padx=12,
            pady=6
        )
        btn_export_csv.pack(side=tk.LEFT, padx=(0, 8))

        btn_clear = tk.Button(
            bottom_bar,
            text="Purge All Data",
            command=self._clear_data,
            bg="#991B1B",
            fg="white",
            relief=tk.FLAT,
            padx=12,
            pady=6
        )
        btn_clear.pack(side=tk.LEFT)

        btn_exit = tk.Button(
            bottom_bar,
            text="Exit",
            command=self.root.quit,
            bg="#1E293B",
            fg="#94A3B8",
            relief=tk.FLAT,
            padx=12,
            pady=6
        )
        btn_exit.pack(side=tk.RIGHT)

    def _load_stored_settings(self):
        startup = self.storage.get_setting("run_at_startup", "false")
        self.startup_var.set(startup.lower() == "true")
        window_optin = self.storage.get_setting("optin_window_tracking", "false")
        if window_optin.lower() == "true":
            self.window_track_var.set(True)
            self.window_tracker.enable()
            self.window_var.set("Active Window Tracker: Enabled (Monitoring non-sensitive windows)")

        # Hydrate learning engine with persisted SQLite records from prior sessions
        stored_events = self.storage.get_all_events()
        for ev in stored_events:
            self.engine.events.append(InteractionEvent(
                event_id=ev.get("id", ""),
                session_id=ev.get("session_id", ""),
                screen_id=ev.get("screen_id", ""),
                component_type=ev.get("component_type", ""),
                event_type=ev.get("event_type", "interaction"),
                attempt_count=ev.get("attempt_count", 1),
                hesitation_ms=ev.get("hesitation_ms", 0),
                is_correction=bool(ev.get("is_correction")),
                timestamp=ev.get("timestamp", 0.0)
            ))
        self._update_metrics_display()

    def _on_permission_toggle(self):
        if not self.track_perm_var.get():
            self.engine.pause_learning()
            self.status_var.set("Telemetry Disabled: No events recorded")
        else:
            self.engine.resume_learning()
            self.status_var.set("Active: Local in-app learning boundaries")

    def _on_window_track_toggle(self):
        enabled = self.window_track_var.get()
        if enabled:
            msg = (
                "Opt-in Consent for Active Window Tracking:\n\n"
                "• G-SENSE will monitor active foreground application names (e.g. explorer.exe, code.exe) "
                "and permitted UI Automation clicks (buttons, tabs).\n"
                "• It will NEVER record keystrokes, typed text, passwords, clipboard, or screen contents.\n"
                "• Sensitive windows (password managers, banking, incognito) are automatically excluded.\n\n"
                "Do you wish to enable active window tracking?"
            )
            if messagebox.askyesno("G-SENSE Permission Consent", msg):
                self.window_tracker.enable()
                self.storage.set_setting("optin_window_tracking", "true")
                self.window_var.set("Active Window Tracker: Enabled (Monitoring non-sensitive windows)")
            else:
                self.window_track_var.set(False)
        else:
            self.window_tracker.disable()
            self.storage.set_setting("optin_window_tracking", "false")
            self.window_var.set("Active Window Tracker: Disabled (Opt-in required)")

    def _on_startup_toggle(self):
        val = "true" if self.startup_var.get() else "false"
        self.storage.set_setting("run_at_startup", val)

    def _toggle_pause(self):
        if self.engine.is_paused:
            self.engine.resume_learning()
            self.window_tracker.resume()
            self.btn_pause.config(text="Pause Learning")
            self.status_var.set("Active: Local in-app learning boundaries")
        else:
            self.engine.pause_learning()
            self.window_tracker.pause()
            self.btn_pause.config(text="Resume Learning")
            self.status_var.set("Paused by user request")

    def _on_window_event(self, event_data: dict):
        if self.engine.is_paused or not self.window_track_var.get():
            return
        event = self.engine.record_event(
            event_id=f"evt_win_{len(self.engine.events)+1}",
            session_id="desktop_win_session",
            screen_id=event_data.get("current_app", "unknown"),
            component_type="active_window",
            event_type="window_switch",
            hesitation_override_ms=min(event_data.get("dwell_previous_ms", 0), 30000)
        )
        if event:
            self.storage.save_event(asdict(event))
            self._update_metrics_display()

    def _simulate_uia_event(self, control_type: str, element_id: str):
        if not self.window_track_var.get() or self.engine.is_paused:
            messagebox.showinfo("G-SENSE", "Active Window & UI Automation tracking is not enabled or paused.")
            return

        uia_data = self.window_tracker.process_ui_automation_element(control_type, element_id)
        if uia_data:
            event = self.engine.record_event(
                event_id=f"evt_uia_{len(self.engine.events)+1}",
                session_id="desktop_uia_session",
                screen_id="active_app",
                component_type=f"uia_{control_type.lower()}",
                event_type="ui_automation_invoke"
            )
            if event:
                self.storage.save_event(asdict(event))
                self._update_metrics_display()
                messagebox.showinfo("UI Automation Event", f"Recorded permitted {control_type} click ({element_id}). Zero text recorded.")

    def _simulate_event(self, component: str, event_type: str, is_correction: bool = False):
        if not self.track_perm_var.get() or self.engine.is_paused:
            messagebox.showinfo("G-SENSE", "Learning is currently paused or disabled by permission.")
            return

        event = self.engine.record_event(
            event_id=f"evt_{len(self.engine.events)+1}",
            session_id="desktop_local_session",
            screen_id="desktop_main",
            component_type=component,
            event_type=event_type,
            is_correction=is_correction
        )
        if event:
            self.storage.save_event(asdict(event))
            self._update_metrics_display()

    def _update_metrics_display(self):
        summary = self.engine.compute_summary()
        self.metrics_var.set(
            f"Events recorded: {summary.total_events} | Avg Dwell: {int(summary.avg_hesitation_ms)}ms | "
            f"Maturity: {summary.sample_status_label.split(' - ')[0]}"
        )

    def _start_tracker_poll(self):
        if self.window_track_var.get() and not self.engine.is_paused:
            event = self.window_tracker.process_tick()
            if event and event.get("event_type") == "window_switch":
                self.window_var.set(f"Active Window: {event.get('current_app')} ({event.get('window_title')})")
            elif event and event.get("is_sensitive"):
                self.window_var.set("Active Window: Sensitive Window (Telemetry Excluded)")
        self.root.after(1500, self._start_tracker_poll)

    def _export_json(self):
        data = self.engine.export_data()
        file_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json")],
            initialfile="gsense_desktop_data.json"
        )
        if file_path:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(data)
            messagebox.showinfo("Export Successful", f"Saved {len(self.engine.events)} records to {file_path}")

    def _export_csv(self):
        data = self.engine.export_csv()
        file_path = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv")],
            initialfile="gsense_desktop_data.csv"
        )
        if file_path:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(data)
            messagebox.showinfo("Export Successful", f"Saved {len(self.engine.events)} records to {file_path}")

    def _clear_data(self):
        if messagebox.askyesno("Confirm Purge", "Permanently delete all recorded desktop interaction data?"):
            self.engine.clear_data()
            self.storage.purge_all()
            self._update_metrics_display()
            messagebox.showinfo("G-SENSE", "All local data has been purged.")

def main():
    root = tk.Tk()
    app = GSenseDesktopApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
