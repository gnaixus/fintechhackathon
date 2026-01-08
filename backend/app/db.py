import os
import sqlite3
from contextlib import contextmanager
from app.config import DB_PATH as ENV_DB_PATH

def _default_db_path():
    # backend/app/db.py -> backend/data.db
    app_dir = os.path.dirname(__file__)
    backend_dir = os.path.abspath(os.path.join(app_dir, ".."))
    return os.path.join(backend_dir, "data.db")

DB_PATH = ENV_DB_PATH or _default_db_path()

def init_db():
    # Ensure parent dir exists (usually backend/)
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("""
        CREATE TABLE IF NOT EXISTS milestones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            escrow_tx_hash TEXT NOT NULL,
            owner_address TEXT NOT NULL,
            offer_sequence INTEGER NOT NULL,
            fulfillment_b64 TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'LOCKED',
            created_at INTEGER NOT NULL,
            released_tx_hash TEXT,
            released_at INTEGER
        );
        """)
        conn.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_milestone_owner_seq
        ON milestones(owner_address, offer_sequence);
        """)
        conn.commit()

@contextmanager
def db_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
