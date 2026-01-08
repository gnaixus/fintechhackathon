from pydantic import BaseModel

# ---- Wallet ----

class CreateWalletResponse(BaseModel):
    address: str
    seed: str

# ---- Milestones ----

class CreateMilestoneRequest(BaseModel):
    employer_seed: str
    freelancer_address: str
    amount_drops: str  # e.g. "1000000" = 1 XRP (drops)

class ApproveMilestoneRequest(BaseModel):
    employer_seed: str
    owner_address: str
    offer_sequence: int
