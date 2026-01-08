import os

# XRPL Testnet JSON-RPC endpoint
XRPL_RPC_URL = os.getenv("XRPL_RPC_URL", "https://s.altnet.rippletest.net:51234")

# SQLite DB path (default: backend/data.db)
DB_PATH = os.getenv("DB_PATH")  # can be None; db.py will default if None
