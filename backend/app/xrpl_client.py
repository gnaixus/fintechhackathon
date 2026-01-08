from xrpl.clients import JsonRpcClient
from app.config import XRPL_RPC_URL

client = JsonRpcClient(XRPL_RPC_URL)
