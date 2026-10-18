"""
G-SENSE Windows Desktop Architecture Application
Tkinter / Native cross-platform desktop UI implementation.
Features:
- Live pattern engine controls (Pause, Resume, Clear, Export)
- Interaction monitor toggles (Permission-based, opt-in)
- Startup setting toggle (Disabled by default)
- Safe exit and status reporting
"""

import sys
import os
import json
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from gsense_engine import GSenseEngine
from storage import DesktopStorage

class GSenseDesktopApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("G-SENSE — AdaptiveAssistant Desktop")
        self.root.geometry("640x520")
        self.root.minsize(580, 480)

        self.engine = GSenseEngine()
        self.storage = DesktopStorage()

        self._init_ui()
        self._load_stored_settings()

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
            text="G-SENSE AdaptiveAssistant",
            font=("Segoe UI", 14, "bold"),
            fg="#F8FAFC",
            bg="#1E293B"
        )
        title_lbl.pack(anchor="w")

        sub_lbl = tk.Label(
            header,
            text="Transparent interaction pattern learning. Zero keystroke/password logging.",
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
            text=" Engine Status ",
            font=("Segoe UI", 10, "bold"),
            fg="#E2E8F0",
            bg="#1E293B",
            padx=12,
            pady=10
        )
        status_card.pack(fill=tk.X, pady=(0, 12))

        self.status_var = tk.StringVar(value="Active: Learning within G-SENSE boundaries")
        self.status_lbl = tk.Label(
            status_card,
            textvariable=self.status_var,
            font=("Segoe UI", 9),
            fg="#38BDF8",
            bg="#1E293B"
        )
        self.status_lbl.pack(anchor="w")

        self.metrics_var = tk.StringVar(value="Events recorded: 0 | Confidence: No data collected yet")
        metrics_lbl = tk.Label(
            status_card,
            textvariable=self.metrics_var,
            font=("Segoe UI", 9),
            fg="#CBD5E1",
            bg="#1E293B"
        )
        metrics_lbl.pack(anchor="w", pady=(4, 0))

        # Permissions & Options Panel
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
            text="Allow in-app navigation and pause timing telemetry",
            variable=self.track_perm_var,
            command=self._on_permission_toggle,
            bg="#1E293B",
            fg="#F8FAFC",
            selectcolor="#0F172A",
            activebackground="#1E293B",
            activeforeground="#F8FAFC"
        )
        chk_track.pack(anchor="w")

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
        chk_startup.pack(anchor="w", pady=(4, 0))

        # Interactive Simulation / Test actions inside Desktop App
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
        btn_correct.pack(side=tk.LEFT)

        # Bottom Action Bar
        bottom_bar = tk.Frame(self.root, bg="#1E293B", padx=16, pady=12)
        bottom_bar.pack(fill=tk.X, side=tk.BOTTOM)

        btn_pause = tk.Button(
            bottom_bar,
            text="Pause Learning",
            command=self._toggle_pause,
            bg="#334155",
            fg="white",
            relief=tk.FLAT,
            padx=12,
            pady=6
        )
        btn_pause.pack(side=tk.LEFT, padx=(0, 8))
        self.btn_pause = btn_pause

        btn_export = tk.Button(
            bottom_bar,
            text="Export JSON",
            command=self._export_data,
            bg="#334155",
            fg="white",
            relief=tk.FLAT,
            padx=12,
            pady=6
        )
        btn_export.pack(side=tk.LEFT, padx=(0, 8))

        btn_clear = tk.Button(
            bottom_bar,
            text="Purge Data",
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

    def _on_permission_toggle(self):
        if not self.track_perm_var.get():
            self.engine.pause_learning()
            self.status_var.set("Telemetry Disabled: No events recorded")
        else:
            self.engine.resume_learning()
            self.status_var.set("Active: Learning within G-SENSE boundaries")

    def _on_startup_toggle(self):
        val = "true" if self.startup_var.get() else "false"
        self.storage.set_setting("run_at_startup", val)

    def _toggle_pause(self):
        if self.engine.is_paused:
            self.engine.resume_learning()
            self.btn_pause.config(text="Pause Learning")
            self.status_var.set("Active: Learning within G-SENSE boundaries")
        else:
            self.engine.pause_learning()
            self.btn_pause.config(text="Resume Learning")
            self.status_var.set("Paused by user request")

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
            from dataclasses import asdict
            self.storage.save_event(asdict(event))

        summary = self.engine.compute_summary()
        self.metrics_var.set(
            f"Events recorded: {summary.total_events} | Avg Dwell: {int(summary.avg_hesitation_ms)}ms | "
            f"Confidence: {summary.confidence_label}"
        )

    def _export_data(self):
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

    def _clear_data(self):
        if messagebox.askyesno("Confirm Purge", "Permanently delete all recorded desktop interaction data?"):
            self.engine.clear_data()
            self.storage.purge_all()
            self.metrics_var.set("Events recorded: 0 | Confidence: No data collected yet")
            messagebox.showinfo("G-SENSE", "All local data has been purged.")

def main():
    root = tk.Tk()
    app = GSenseDesktopApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
