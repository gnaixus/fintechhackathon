from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.wallets import create_wallet
from app.escrows import create_milestone_escrow, approve_milestone
from app.storage import list_milestones
from app.models import (
    CreateWalletResponse,
    CreateMilestoneRequest,
    ApproveMilestoneRequest,
)

# --------------------------------------------------
# App setup
# --------------------------------------------------

app = FastAPI(
    title="XRPL Freelance Milestone Escrow Backend",
    description="Backend for approval-based freelance milestone payments using XRPL Escrow",
    version="1.0.0",
)

# --------------------------------------------------
# CORS (required for website frontend)
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for demo; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Startup: initialize SQLite DB
# --------------------------------------------------

@app.on_event("startup")
def on_startup():
    init_db()

# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "XRPL Freelance Milestone Escrow backend running",
    }

# --------------------------------------------------
# Wallet (demo-only)
# --------------------------------------------------

@app.post("/api/wallet", response_model=CreateWalletResponse)
def new_wallet():
    """
    Demo helper:
    Creates and funds a new XRPL Testnet wallet.
    """
    return create_wallet()

# --------------------------------------------------
# Milestones
# --------------------------------------------------

@app.post("/api/milestone/create")
def create_milestone(req: CreateMilestoneRequest):
    """
    Create a condition-locked escrow for ONE milestone.
    Funds are locked until client approval.
    """
    result = create_milestone_escrow(
        employer_seed=req.employer_seed,
        freelancer_address=req.freelancer_address,
        amount_drops=req.amount_drops,
    )

    return {
        "success": True,
        "milestone": {
            "status": "LOCKED",
            "escrow_tx_hash": result["escrow_tx_hash"],
            "owner_address": result["owner_address"],
            "offer_sequence": result["offer_sequence"],
        },
    }

@app.post("/api/milestone/approve")
def approve_milestone_endpoint(req: ApproveMilestoneRequest):
    """
    Client approval:
    Releases escrow by submitting EscrowFinish with fulfillment.
    """
    result = approve_milestone(
        employer_seed=req.employer_seed,
        owner_address=req.owner_address,
        offer_sequence=req.offer_sequence,
    )

    return {
        "success": True,
        "milestone": {
            "status": "RELEASED",
            "tx_hash": result["tx_hash"],
        },
    }

@app.get("/api/milestones")
def get_milestones():
    """
    List all milestones (for website UI).
    """
    return {
        "milestones": list_milestones()
    }
