import time
from app.db import db_conn

def save_milestone(*, escrow_tx_hash: str, owner_address: str, offer_sequence: int, fulfillment_b64: str):
    now = int(time.time())
    with db_conn() as conn:
        conn.execute(
            """
            INSERT INTO milestones (escrow_tx_hash, owner_address, offer_sequence, fulfillment_b64, status, created_at)
            VALUES (?, ?, ?, ?, 'LOCKED', ?)
            """,
            (escrow_tx_hash, owner_address, offer_sequence, fulfillment_b64, now),
        )

def get_fulfillment(owner_address: str, offer_sequence: int) -> str | None:
    with db_conn() as conn:
        row = conn.execute(
            """
            SELECT fulfillment_b64
            FROM milestones
            WHERE owner_address = ? AND offer_sequence = ? AND status = 'LOCKED'
            """,
            (owner_address, offer_sequence),
        ).fetchone()
        return row["fulfillment_b64"] if row else None

def mark_released(owner_address: str, offer_sequence: int, released_tx_hash: str):
    now = int(time.time())
    with db_conn() as conn:
        conn.execute(
            """
            UPDATE milestones
            SET status = 'RELEASED', released_tx_hash = ?, released_at = ?
            WHERE owner_address = ? AND offer_sequence = ?
            """,
            (released_tx_hash, now, owner_address, offer_sequence),
        )

def list_milestones():
    with db_conn() as conn:
        rows = conn.execute(
            """
            SELECT escrow_tx_hash, owner_address, offer_sequence, status,
                   created_at, released_tx_hash, released_at
            FROM milestones
            ORDER BY created_at DESC
            """
        ).fetchall()
        return [dict(r) for r in rows]
