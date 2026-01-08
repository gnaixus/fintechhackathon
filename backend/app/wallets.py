from xrpl.wallet import generate_faucet_wallet
from app.xrpl_client import client

def create_wallet():
    """
    Demo-only: Creates and funds a new XRPL Testnet wallet.
    In production, users would connect their own wallet and sign client-side.
    """
    wallet = generate_faucet_wallet(client)
    return {"address": wallet.classic_address, "seed": wallet.seed}
