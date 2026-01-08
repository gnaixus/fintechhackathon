import base64
import hashlib
import secrets

def generate_condition_pair():
    """
    Generate a (condition_b64, fulfillment_b64) pair.

    We use a simple preimage approach:
      secret = 32 random bytes
      condition = SHA256(secret)

    We store:
      - condition as base64(sha256(secret))
      - fulfillment as base64(secret)

    NOTE: If XRPL rejects EscrowFinish due to crypto-condition encoding,
    we can switch to the XRPL-standard crypto-conditions format.
    For many demos, this simple encoding is enough to show the intended flow.
    """
    secret = secrets.token_bytes(32)
    condition = hashlib.sha256(secret).digest()
    return (
        base64.b64encode(condition).decode("utf-8"),
        base64.b64encode(secret).decode("utf-8"),
    )
