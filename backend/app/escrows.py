from xrpl.models.transactions import EscrowCreate, EscrowFinish
from xrpl.transaction import submit_and_wait
from xrpl.wallet import Wallet

from app.xrpl_client import client
from app.conditions import generate_condition_pair
from app.storage import save_milestone, get_fulfillment, mark_released

def create_milestone_escrow(employer_seed: str, freelancer_address: str, amount_drops: str):
    """
    Creates a condition-locked escrow for a milestone.
    Stores the fulfillment in SQLite so approval works after reload.
    """
    employer_wallet = Wallet(seed=employer_seed, sequence=0)

    condition_b64, fulfillment_b64 = generate_condition_pair()

    escrow_tx = EscrowCreate(
        account=employer_wallet.classic_address,
        destination=freelancer_address,
        amount=amount_drops,
        condition=condition_b64,
    )

    resp = submit_and_wait(escrow_tx, client, employer_wallet)

    owner_address = employer_wallet.classic_address

    offer_sequence = resp.result.get("Sequence")
    if offer_sequence is None:
        offer_sequence = resp.result.get("tx_json", {}).get("Sequence")
    if offer_sequence is None:
        raise RuntimeError("Could not determine OfferSequence/Sequence for created escrow.")

    offer_sequence = int(offer_sequence)

    save_milestone(
        escrow_tx_hash=resp.result["hash"],
        owner_address=owner_address,
        offer_sequence=offer_sequence,
        fulfillment_b64=fulfillment_b64,
    )

    return {
        "escrow_tx_hash": resp.result["hash"],
        "owner_address": owner_address,
        "offer_sequence": offer_sequence,
    }

def approve_milestone(employer_seed: str, owner_address: str, offer_sequence: int):
    """
    Releases escrow by submitting EscrowFinish with the stored fulfillment.
    """
    employer_wallet = Wallet(seed=employer_seed, sequence=0)

    fulfillment_b64 = get_fulfillment(owner_address, int(offer_sequence))
    if not fulfillment_b64:
        raise RuntimeError("No stored fulfillment found (already released, or wrong owner/sequence).")

    finish_tx = EscrowFinish(
        account=employer_wallet.classic_address,
        owner=owner_address,
        offer_sequence=int(offer_sequence),
        fulfillment=fulfillment_b64,
    )

    resp = submit_and_wait(finish_tx, client, employer_wallet)

    mark_released(owner_address, int(offer_sequence), resp.result["hash"])

    return {"tx_hash": resp.result["hash"]}
