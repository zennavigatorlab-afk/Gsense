"""
G-SENSE Desktop Local Storage
Manages local SQLite database for G-SENSE desktop applet.
Keeps data strictly on the user's local machine unless explicitly synchronized.
All SQLite connections are deterministically closed in finally blocks to prevent file locking across platforms.
"""

import sqlite3
import os
from typing import List, Dict, Any

class DesktopStorage:
    def __init__(self, db_path: str = "gsense_local.db"):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS local_interactions (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    screen_id TEXT NOT NULL,
                    component_type TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    attempt_count INTEGER,
                    hesitation_ms INTEGER,
                    is_correction INTEGER,
                    timestamp REAL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS local_settings (
                    key TEXT PRIMARY KEY,
                    val TEXT
                )
            """)
            conn.commit()
        finally:
            conn.close()

    def save_event(self, event_dict: Dict[str, Any]):
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO local_interactions
                (id, session_id, screen_id, component_type, event_type, attempt_count, hesitation_ms, is_correction, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_dict.get('event_id'),
                event_dict.get('session_id'),
                event_dict.get('screen_id'),
                event_dict.get('component_type'),
                event_dict.get('event_type'),
                event_dict.get('attempt_count', 1),
                event_dict.get('hesitation_ms', 0),
                1 if event_dict.get('is_correction') else 0,
                event_dict.get('timestamp', 0.0)
            ))
            conn.commit()
        finally:
            conn.close()

    def get_all_events(self) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM local_interactions ORDER BY timestamp ASC")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    def purge_all(self):
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM local_interactions")
            conn.commit()
        finally:
            conn.close()

    def set_setting(self, key: str, value: str):
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("INSERT OR REPLACE INTO local_settings (key, val) VALUES (?, ?)", (key, value))
            conn.commit()
        finally:
            conn.close()

    def get_setting(self, key: str, default: str = "") -> str:
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT val FROM local_settings WHERE key = ?", (key,))
            row = cursor.fetchone()
            return row[0] if row else default
        finally:
            conn.close()
