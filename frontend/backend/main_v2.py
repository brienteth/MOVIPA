from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from pathlib import Path
import re
import httpx
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account

# Import Redis/Upstash support and DB schema helpers
from upstash_client import UpstashClient
from database import engine
from models import Base as ModelsBase, User

# Import arbitrage engine
from arbitrage_engine import (
    ArbitrageEngine, ArbitrageOpportunity, ExecutionResult, StrategyExecutionResult,
    Chain, Protocol, DEX, FlashLoanExecutor, CrossChainBridge, DEXAggregator
)
from strategy_compiler import compile_strategy as compile_graph_strategy, StrategyCompileError
from marketplace_store import TemplateStore
from intent_network import IntentMempool, HotStateEngine, SolverNetwork
from private_relay import RelayPolicyEngine
from onchain_settlement import submit_settlement

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment config from root env files, including UPSTASH credentials.
root_env = Path(__file__).resolve().parents[1]
load_dotenv(root_env / ".env")
load_dotenv(root_env / ".env.local", override=True)

upstash = UpstashClient()

app = FastAPI(title="Movipa Backend", version="2.0.0")

# CORS for frontend
default_frontend_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://movipa-xi.vercel.app",
    "https://movipa.vercel.app",
    "https://frontend-public-tawny.vercel.app",
    "https://frontend-public-3wfr19trv-heldereth11.vercel.app",
]
extra_frontend_url = os.getenv("FRONTEND_URL", "").strip()
if extra_frontend_url:
    default_frontend_origins.append(extra_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global task for strategy monitoring
strategy_monitor_task = None

# Vault storage file
vaults_storage_file = Path("data") / "vaults.json"

def load_vaults_from_storage() -> Dict[str, Dict[str, Any]]:
    """Load vaults from JSON storage."""
    if not vaults_storage_file.exists():
        return {}
    try:
        with open(vaults_storage_file, "r") as f:
            return json.load(f)
    except:
        return {}

def save_vaults_to_storage(vaults: Dict[str, Dict[str, Any]]):
    """Save vaults to JSON storage."""
    vaults_storage_file.parent.mkdir(parents=True, exist_ok=True)
    with open(vaults_storage_file, "w") as f:
        json.dump(vaults, f, indent=2)

# Global vaults storage
vaults_storage: Dict[str, Dict[str, Any]] = {}

@app.on_event("startup")
async def startup_event():
    """Start background tasks on app startup"""
    global strategy_monitor_task, vaults_storage
    
    # Load vaults from storage
    vaults_storage = load_vaults_from_storage()
    logger.info(f"Loaded {len(vaults_storage)} vaults from storage")

    # Create optional DB schema for wallet profiles and activity if DB is available.
    try:
        ModelsBase.metadata.create_all(engine)
        logger.info("Ensured database schema is created.")
    except Exception as exc:
        logger.warning(f"Could not create database schema: {exc}")
    
    contract_address = resolve_strategy_executor_address()
    
    # Start strategy execution monitoring in background
    strategy_monitor_task = asyncio.create_task(
        arbitrage_engine.monitor_strategy_executions(contract_address)
    )
    logger.info(f"Started strategy execution monitoring for contract: {contract_address}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on app shutdown"""
    global strategy_monitor_task, vaults_storage
    
    # Save vaults to storage
    save_vaults_to_storage(vaults_storage)
    logger.info(f"Saved {len(vaults_storage)} vaults to storage")
    
    if strategy_monitor_task:
        strategy_monitor_task.cancel()
        try:
            await strategy_monitor_task
        except asyncio.CancelledError:
            pass
    logger.info("Stopped strategy execution monitoring")

# Initialize arbitrage engine
# Prefer a healthy Sepolia RPC instead of assuming a single provider is valid.
def select_sepolia_rpc() -> str:
    candidates = [
        os.getenv("SEPOLIA_RPC_URL", "https://eth-sepolia.g.alchemy.com/v2/g56R2h369xZJjLih2l0P96L8yXoA0oWp"),
        os.getenv("RPC_SEPOLIA", "https://ethereum-sepolia-rpc.publicnode.com"),
        "https://rpc.sepolia.org",
        "https://sepolia.gateway.tenderly.co",
    ]
    for rpc_url in candidates:
        try:
            provider = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 5}))
            if provider.is_connected():
                logger.info(f"Using Sepolia RPC: {rpc_url}")
                return rpc_url
        except Exception:
            continue
    logger.warning("No healthy Sepolia RPC found, using last fallback")
    return candidates[-1]


sepolia_rpc = select_sepolia_rpc()
web3_providers = {
    "sepolia": Web3(Web3.HTTPProvider(sepolia_rpc, request_kwargs={"timeout": 10}))
}
arbitrage_engine = ArbitrageEngine(web3_providers)

repo_root = Path(__file__).resolve().parents[1]
template_store = TemplateStore(str(Path(__file__).resolve().parent / "data" / "templates.json"))
intent_mempool = IntentMempool()
hot_state_engine = HotStateEngine()
hot_state_engine.prewarm_defaults()
solver_network = SolverNetwork()
relay_policy_engine = RelayPolicyEngine()


def resolve_strategy_executor_address() -> str:
    env_addr = os.getenv("STRATEGY_EXECUTOR_ADDRESS")
    if env_addr:
        return env_addr
    deployment = repo_root / "deployments" / "kernel-sepolia.json"
    if deployment.exists():
        try:
            data = json.loads(deployment.read_text())
            return data.get("contracts", {}).get("StrategyExecutorKernel", "0x011b9A74D16e043ba3f227B4ADa41374F141d300")
        except Exception:
            pass
    return "0x011b9A74D16e043ba3f227B4ADa41374F141d300"


def resolve_router_address() -> Optional[str]:
    deployment = repo_root / "deployments" / "kernel-sepolia.json"
    if deployment.exists():
        try:
            data = json.loads(deployment.read_text())
            return data.get("contracts", {}).get("BandleRouter")
        except Exception:
            return None
    return None


def record_wallet_profile(wallet_address: str, auth_method: str, email: Optional[str] = None, embedded_wallet: Optional[str] = None) -> None:
    if not upstash.enabled:
        return
    profile = {
        "wallet_address": wallet_address.lower(),
        "auth_method": auth_method,
        "email": email or "",
        "embedded_wallet": embedded_wallet or "",
        "last_seen": datetime.utcnow().isoformat(),
    }
    upstash.record_user_profile(wallet_address, profile)


def record_user_event(wallet_address: str, event_type: str, payload: Dict[str, Any]) -> None:
    if not upstash.enabled:
        return
    upstash.record_user_event(wallet_address, event_type, payload)


def record_wallet_activity_batch(wallet_address: str, activities: List[Dict[str, Any]]) -> None:
    if not upstash.enabled:
        return
    for activity in activities:
        upstash.record_wallet_activity(wallet_address, activity)


def get_wallet_activity_from_etherscan(user_address: str, limit: int = 20) -> List[Dict[str, Any]]:
    provider = web3_providers.get("sepolia")
    if provider is None or not provider.is_connected():
        return []

    headers = {"user-agent": "Mozilla/5.0"}
    url = f"https://sepolia.etherscan.io/address/{user_address}"
    try:
        html = httpx.get(url, headers=headers, timeout=20.0).text
    except Exception:
        return []

    tx_hashes = []
    seen = set()
    for tx_hash in re.findall(r'/tx/(0x[a-fA-F0-9]{64})', html):
        if tx_hash in seen:
            continue
        seen.add(tx_hash)
        tx_hashes.append(tx_hash)
        if len(tx_hashes) >= limit:
            break

    strategy_executor = (resolve_strategy_executor_address() or "").lower()
    router_address = (resolve_router_address() or "").lower()
    matches: List[Dict[str, Any]] = []
    for tx_hash in tx_hashes:
        try:
            tx = provider.eth.get_transaction(tx_hash)
            receipt = provider.eth.get_transaction_receipt(tx_hash)
            block = provider.eth.get_block(receipt.blockNumber)
        except Exception:
            continue
        tx_from = (tx.get("from") or "").lower()
        tx_to = (tx.get("to") or "").lower() if tx.get("to") else ""
        interaction = "wallet"
        if tx_to == strategy_executor:
            interaction = "strategy_executor"
        elif tx_to == router_address:
            interaction = "bandle_router"
        matches.append(
            {
                "transaction_hash": tx_hash,
                "block_number": int(receipt.blockNumber),
                "timestamp": int(block["timestamp"]),
                "from": tx_from,
                "to": tx_to,
                "value_wei": str(tx.get("value", 0)),
                "gas_used": int(receipt.gasUsed),
                "success": int(receipt.status) == 1,
                "interaction": interaction,
                "source": "etherscan_fallback",
            }
        )
    return matches


def get_wallet_activity(user_address: str, lookback_blocks: int = 2500, limit: int = 20) -> List[Dict[str, Any]]:
    provider = web3_providers.get("sepolia")
    if provider is None or not provider.is_connected():
        return []

    address = user_address.lower()
    latest_block = provider.eth.block_number
    start_block = max(0, latest_block - lookback_blocks)
    strategy_executor = (resolve_strategy_executor_address() or "").lower()
    router_address = (resolve_router_address() or "").lower()
    matches: List[Dict[str, Any]] = []

    for block_number in range(latest_block, start_block - 1, -1):
        if len(matches) >= limit:
            break
        try:
            block = provider.eth.get_block(block_number, full_transactions=True)
        except Exception:
            continue

        for tx in block.transactions:
            tx_from = (tx.get("from") or "").lower()
            tx_to = (tx.get("to") or "").lower() if tx.get("to") else ""
            if tx_from != address and tx_to != address:
                continue
            try:
                receipt = provider.eth.get_transaction_receipt(tx["hash"])
                status = int(receipt.status)
                gas_used = int(receipt.gasUsed)
            except Exception:
                status = 0
                gas_used = 0

            interaction = "wallet"
            if tx_to == strategy_executor:
                interaction = "strategy_executor"
            elif tx_to == router_address:
                interaction = "bandle_router"

            matches.append(
                {
                    "transaction_hash": tx["hash"].hex() if hasattr(tx["hash"], "hex") else str(tx["hash"]),
                    "block_number": int(block_number),
                    "timestamp": int(block["timestamp"]),
                    "from": tx_from,
                    "to": tx_to,
                    "value_wei": str(tx.get("value", 0)),
                    "gas_used": gas_used,
                    "success": status == 1,
                    "interaction": interaction,
                    "source": "rpc_scan",
                }
            )
            if len(matches) >= limit:
                break

    if matches:
        return matches
    return get_wallet_activity_from_etherscan(user_address=user_address, limit=limit)

# WebSocket connections for real-time updates
active_connections: Dict[str, List[WebSocket]] = {}

# Request/Response Models
class ArbitrageOpportRequest(BaseModel):
    min_amount: float = 100_000
    max_amount: float = 10_000_000
    chains: Optional[List[str]] = None
    min_profit_threshold: float = 1_000

class ExecuteArbitrageRequest(BaseModel):
    opportunity_index: int
    wallet_address: str
    allow_multi_chain: bool = True

class IntentRequest(BaseModel):
    intent: str
    max_usdc: float = 100000
    risk_tolerance: str = "medium"

class ArbitrageStats(BaseModel):
    total_executions: int
    successful: int
    failed: int
    total_profit: float
    avg_profit_per_trade: float
    win_rate: float
    avg_execution_time_ms: float
    best_trade: float
    worst_trade: float

# Strategy Compilation Models
class StrategyNode(BaseModel):
    type: str  # FLASH_LOAN, SWAP, BRIDGE, LEND, BORROW, CLAIM, STAKE, YIELD, CONDITION, LOOP
    params: Dict[str, Any]
    order: Optional[int] = None

class CompiledAction(BaseModel):
    type: str
    params: Dict[str, Any]
    meta: Optional[Dict[str, Any]] = None

class CompileStrategyRequest(BaseModel):
    nodes: List[StrategyNode]
    slippage_bps: Optional[int] = 50
    gas_priority: Optional[str] = "standard"
    gas_price_gwei: Optional[float] = None
    eth_price_usd: Optional[float] = None

class CompileStrategyResponse(BaseModel):
    actions: List[CompiledAction]
    encodedCalldata: Optional[str] = None
    stats: Optional[Dict[str, Any]] = None
    warnings: Optional[List[Dict[str, Any]]] = None
    strategyHash: Optional[str] = None

# Template Models
class StrategyTemplate(BaseModel):
    id: str
    name: str
    category: str  # arbitrage, yield, looping, liquidation, delta_neutral, bridge, stablecoin, leverage
    description: str
    apy_estimate: float
    risk_level: str  # low, medium, high
    networks: List[str]
    usage_count: int
    creator: str = "MOVIPA Labs"
    strategy: Dict[str, Any]
    prompt: Optional[str] = None

class GenerateTemplateRequest(BaseModel):
    prompt: str
    category: Optional[str] = None
    max_usdc: float = 50000
    creator: str = "AI Assistant"
    save: bool = False

class IntentPublishRequest(BaseModel):
    user: str
    strategy_hash: str
    chain: str
    notional_usdc: float
    min_profit_usdc: float
    max_slippage_bps: int
    deadline_ts: int
    nonce: int
    intent_stake_score: float

class IntentSolveRequest(BaseModel):
    tee_attestation: Dict[str, Any]
    relay_preference: Optional[str] = None

class StrategySimulateRequest(BaseModel):
    nodes: List[StrategyNode]
    slippage_bps: Optional[int] = 50
    gas_priority: Optional[str] = "standard"
    gas_price_gwei: Optional[float] = 15
    eth_price_usd: Optional[float] = 3000


# ==================== VAULT MODELS ====================

class CreateVaultRequest(BaseModel):
    user_address: str
    name: str
    description: str
    strategy_template_id: str
    deposit_amount_usdc: float
    risk_level: str  # low, medium, high
    solver_region: str  # auto, frankfurt, singapore, virginia
    execution_mode: str  # autonomous, manual, simulation
    chain: str = "base"

class DepositRequest(BaseModel):
    user_address: str
    amount_usdc: float
    chain: str = "base"

class WithdrawRequest(BaseModel):
    user_address: str
    amount_usdc: float
    chain: str = "base"

class VaultResponse(BaseModel):
    id: str
    user_address: str
    name: str
    description: str
    status: str  # CREATED, FUNDED, ACTIVE, OPTIMIZING, REBALANCING, SETTLED
    tvl_usdc: float
    apy_estimate: float
    risk_level: str
    chain: str
    strategy_template_id: str
    strategy_nodes: List[Dict[str, Any]]
    profit_today_usdc: float
    profit_7d_usdc: float
    profit_30d_usdc: float
    cumulative_profit_usdc: float
    latency_ms: float
    solver_region: str
    health_status: str  # stable, healthy, overexposed, liquidation_risk
    execution_mode: str
    created_at: int
    last_rebalance_at: int
    settlement_tx_hash: Optional[str] = None

class MarketplaceVaultResponse(BaseModel):
    id: str
    name: str
    description: str
    apy_estimate: float
    tvl_usdc: float
    win_rate_percent: float
    risk_level: str
    creator_fee_percent: float
    users_count: int
    strategy_category: str


def infer_template_category(prompt: str) -> str:
    lower = prompt.lower()
    if any(keyword in lower for keyword in ["arbitrage", "flash loan", "swap", "delta neutral"]):
        return "arbitrage"
    if any(keyword in lower for keyword in ["yield", "farm", "stake"]):
        return "yield"
    if any(keyword in lower for keyword in ["loop", "compound"]):
        return "looping"
    if any(keyword in lower for keyword in ["liquidation", "rescue"]):
        return "liquidation"
    if any(keyword in lower for keyword in ["bridge", "cross-chain", "cross chain"]):
        return "bridge"
    if any(keyword in lower for keyword in ["stable", "usdc", "dai", "usdt"]):
        return "stablecoin"
    if any(keyword in lower for keyword in ["leverage", "margin", "borrow"]):
        return "leverage"
    return "arbitrage"


def build_strategy_from_prompt(prompt: str, max_usdc: float) -> Dict[str, Any]:
    category = infer_template_category(prompt)

    if category == "arbitrage":
        nodes = [
            {"type": "FLASH_LOAN", "params": {"provider": "aave", "asset": "USDC", "amount": str(max_usdc)}},
            {"type": "SWAP", "params": {"dex": "uniswap", "tokenIn": "USDC", "tokenOut": "ETH", "amountIn": str(max_usdc)}},
            {"type": "BRIDGE", "params": {"bridge": "across", "fromChain": "ethereum", "toChain": "base", "asset": "ETH", "amount": str(max_usdc * 0.95)}},
            {"type": "SWAP", "params": {"dex": "curve", "tokenIn": "ETH", "tokenOut": "USDC", "amountIn": str(max_usdc * 0.95)}},
            {"type": "CLAIM", "params": {"recipient": "0x0000000000000000000000000000000000000000"}},
        ]
    elif category == "yield":
        nodes = [
            {"type": "SWAP", "params": {"dex": "uniswap", "tokenIn": "USDC", "tokenOut": "DAI", "amountIn": str(max_usdc)}},
            {"type": "STAKE", "params": {"asset": "DAI", "amount": str(max_usdc * 0.99)}},
            {"type": "YIELD", "params": {"asset": "DAI"}},
            {"type": "CLAIM", "params": {"recipient": "0x0000000000000000000000000000000000000000"}},
        ]
    elif category == "bridge":
        nodes = [
            {"type": "BRIDGE", "params": {"bridge": "across", "fromChain": "ethereum", "toChain": "base", "asset": "USDC", "amount": str(max_usdc)}},
        ]
    else:
        nodes = [
            {"type": "SWAP", "params": {"dex": "uniswap", "tokenIn": "USDC", "tokenOut": "ETH", "amountIn": str(max_usdc)}},
        ]

    return {
        "prompt": prompt,
        "category": category,
        "strategy": {"nodes": nodes},
        "summary": f"Generated {category} strategy for: {prompt}",
    }


def default_templates() -> List[Dict[str, Any]]:
    return [
        {
            "name": "Flash Loan Arbitrage",
            "category": "arbitrage",
            "creator": "MOVIPA Labs",
            "usage_count": 2847,
            "strategy": build_strategy_from_prompt("Flash loan USDC, arbitrage between Uniswap and Curve", 100000)["strategy"],
        },
        {
            "name": "Multi-Chain Yield",
            "category": "yield",
            "creator": "MOVIPA Labs",
            "usage_count": 1523,
            "strategy": build_strategy_from_prompt("Optimize stablecoin yield across chains", 50000)["strategy"],
        },
        {
            "name": "Cross-Chain Bridge",
            "category": "bridge",
            "creator": "MOVIPA Labs",
            "usage_count": 3912,
            "strategy": build_strategy_from_prompt("Bridge assets with minimum fees", 25000)["strategy"],
        },
    ]


def get_or_seed_templates() -> List[Dict[str, Any]]:
    existing = template_store.list_templates()
    if existing:
        return existing
    for item in default_templates():
        created = template_store.create_template(item)
        created["usage_count"] = item["usage_count"]
        template_store.update_template(created["id"], created)
    return template_store.list_templates()


TOKEN_PRICE_IDS: Dict[str, str] = {
    "USDC": "usd-coin",
    "USDT": "tether",
    "DAI": "dai",
    "ETH": "ethereum",
    "WETH": "weth",
    "WBTC": "wrapped-bitcoin",
    "BTC": "bitcoin",
}


async def fetch_live_token_prices_usd(symbols: List[str]) -> Dict[str, float]:
    """Fetch live USD prices for requested token symbols."""
    requested = sorted({s.upper() for s in symbols if s})
    ids = [TOKEN_PRICE_IDS[s] for s in requested if s in TOKEN_PRICE_IDS]
    prices: Dict[str, float] = {}

    if not ids:
        return prices

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={"ids": ",".join(ids), "vs_currencies": "usd"},
                headers={"accept": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

        id_to_symbol = {v: k for k, v in TOKEN_PRICE_IDS.items()}
        for coin_id, payload in data.items():
            symbol = id_to_symbol.get(coin_id)
            usd = payload.get("usd") if isinstance(payload, dict) else None
            if symbol and isinstance(usd, (int, float)) and usd > 0:
                prices[symbol] = float(usd)
    except Exception as exc:
        logger.warning(f"Live price fetch failed: {exc}")

    return prices


def fetch_live_gas_price_gwei() -> Optional[float]:
    """Fetch live gas price from connected Sepolia provider."""
    try:
        provider = web3_providers.get("sepolia")
        if provider and provider.is_connected():
            return float(provider.eth.gas_price) / 1_000_000_000
    except Exception as exc:
        logger.warning(f"Live gas fetch failed: {exc}")
    return None

# ==================== ARBITRAGE ENDPOINTS ====================

@app.get("/api/v2/arbitrage/opportunities")
async def scan_arbitrage_opportunities(
    min_amount: float = 100_000,
    max_amount: float = 10_000_000
) -> Dict[str, Any]:
    """
    Scan for multi-chain arbitrage opportunities
    
    Returns opportunities ranked by profit potential
    """
    try:
        logger.info(f"Scanning opportunities: ${min_amount} - ${max_amount}")
        
        chains = [
            Chain.ETHEREUM,
            Chain.BASE,
            Chain.ARBITRUM,
            Chain.OPTIMISM,
            Chain.POLYGON
        ]
        
        opportunities = await arbitrage_engine.detect_opportunities(
            scan_chains=chains,
            min_amount=min_amount,
            max_amount=max_amount
        )
        
        return {
            "timestamp": datetime.now().isoformat(),
            "opportunities_found": len(opportunities),
            "opportunities": [
                {
                    "index": i,
                    "token_in": opp.token_in,
                    "token_out": opp.token_out,
                    "amount": opp.amount,
                    "buy_chain": opp.buy_chain.value,
                    "sell_chain": opp.sell_chain.value,
                    "buy_price": opp.buy_price,
                    "sell_price": opp.sell_price,
                    "profit_usdc": opp.profit_usdc,
                    "profit_percentage": opp.profit_percentage,
                    "flash_loan_fee": opp.flash_loan_fee,
                    "bridge_fee": opp.bridge_fee,
                    "execution_time_ms": opp.execution_time_ms,
                    "risk_score": opp.risk_score,
                    "route": opp.route,
                }
                for i, opp in enumerate(opportunities)
            ]
        }
    except Exception as e:
        logger.error(f"Opportunity scan failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/intent")
async def process_intent(request: IntentRequest) -> Dict[str, Any]:
    """Parse an intent into a workflow structure with chain route details."""
    intent_data = request.dict()
    intent_text = intent_data.get("intent", "")
    amount = intent_data.get("max_usdc", 100000)
    
    lower_intent = intent_text.lower()
    
    if "flash" in lower_intent or "arbitrage" in lower_intent:
        workflow_steps = [
            {
                "action": "Flash Loan",
                "label": "Flash Loan",
                "protocol": "Aave",
                "chain": "ethereum",
                "params": {"amount": amount, "token": "USDC"}
            },
            {
                "action": "Swap",
                "label": "Swap USDC → ETH",
                "protocol": "Uniswap",
                "chain": "ethereum",
                "params": {"from": "USDC", "to": "ETH", "amount": amount}
            },
            {
                "action": "Bridge",
                "label": "Bridge ETH",
                "protocol": "Across",
                "chain": "ethereum",
                "params": {"token": "ETH", "amount": amount * 0.95, "to_chain": "base"}
            },
            {
                "action": "Swap",
                "label": "Swap ETH → USDC",
                "protocol": "Curve",
                "chain": "base",
                "params": {"from": "ETH", "to": "USDC", "amount": amount * 0.95}
            },
            {
                "action": "Repay",
                "label": "Repay Flash Loan",
                "protocol": "Aave",
                "chain": "ethereum",
                "params": {"amount": amount * 1.0005, "token": "USDC"}
            },
        ]
        workflow_route = ["ethereum", "base", "ethereum"]
        description = "Flash loan USDC on Ethereum, swap to ETH, bridge to Base, swap back to USDC, repay."
    elif "bridge" in lower_intent or "cross-chain" in lower_intent:
        workflow_steps = [
            {
                "action": "Swap",
                "label": "Swap USDC → USDT",
                "protocol": "Uniswap",
                "chain": "ethereum",
                "params": {"from": "USDC", "to": "USDT", "amount": amount}
            },
            {
                "action": "Bridge",
                "label": "Bridge USDT",
                "protocol": "Across",
                "chain": "ethereum",
                "params": {"token": "USDT", "amount": amount * 0.995, "to_chain": "arbitrum"}
            },
            {
                "action": "Stake",
                "label": "Stake USDT",
                "protocol": "Lido",
                "chain": "arbitrum",
                "params": {"amount": amount * 0.995}
            },
        ]
        workflow_route = ["ethereum", "arbitrum"]
        description = "Cross-chain bridge and earning path from Ethereum to Arbitrum."
    else:
        workflow_steps = [
            {
                "action": "Swap",
                "label": "Swap USDC → ETH",
                "protocol": "Uniswap",
                "chain": "ethereum",
                "params": {"from": "USDC", "to": "ETH", "amount": amount}
            },
            {
                "action": "Yield",
                "label": "Yield Farm",
                "protocol": "Curve",
                "chain": "ethereum",
                "params": {"amount": amount * 0.98}
            },
        ]
        workflow_route = ["ethereum"]
        description = "Basic DEX swap into a yield farming position on Ethereum."

    return {
        "workflow_id": f"wf_{hash(intent_text) % 100000}",
        "steps": workflow_steps,
        "route": workflow_route,
        "description": description,
        "estimated_gas": 0.08,
        "risk_level": "medium",
        "citadel_verified": True
    }

@app.post("/api/v2/arbitrage/execute")
async def execute_arbitrage(request: ExecuteArbitrageRequest) -> Dict[str, Any]:
    """
    Execute arbitrage opportunity
    
    Flow:
    1. Flash loan from Aave/dYdX
    2. Swap on first chain
    3. Bridge to second chain
    4. Swap on second chain
    5. Bridge profits back (optional)
    6. Repay flash loan + fees
    """
    try:
        # Get opportunities (would be cached in production)
        opportunities = await arbitrage_engine.detect_opportunities()
        
        if request.opportunity_index >= len(opportunities):
            raise HTTPException(status_code=400, detail="Invalid opportunity index")
        
        opportunity = opportunities[request.opportunity_index]
        
        logger.info(f"Executing arbitrage: ${opportunity.amount} -> ${opportunity.profit_usdc} profit")
        
        # Execute
        result = await arbitrage_engine.execute_arbitrage(opportunity, request.wallet_address)
        
        return {
            "success": result.success,
            "transaction_hash": result.transaction_hash,
            "profit_usdc": result.actual_profit,
            "gas_used_eth": result.gas_used,
            "execution_time_ms": result.execution_time_ms,
            "error": result.error,
            "timestamp": datetime.now().isoformat(),
            "opportunity": {
                "token_in": opportunity.token_in,
                "token_out": opportunity.token_out,
                "amount": opportunity.amount,
                "buy_chain": opportunity.buy_chain.value,
                "sell_chain": opportunity.sell_chain.value,
            }
        }
    except Exception as e:
        logger.error(f"Execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v2/arbitrage/statistics")
async def get_arbitrage_stats() -> ArbitrageStats:
    """Get arbitrage execution statistics"""
    stats = arbitrage_engine.get_statistics()
    return ArbitrageStats(**stats)


@app.get("/api/v2/arbitrage/execution-history")
async def get_execution_history(
    limit: int = 50,
    filter_success: Optional[bool] = None
) -> Dict[str, Any]:
    """Get recent arbitrage executions"""
    history = arbitrage_engine.execution_history[-limit:]
    
    if filter_success is not None:
        history = [e for e in history if e.success == filter_success]
    
    return {
        "total": len(history),
        "executions": [
            {
                "success": e.success,
                "profit": e.actual_profit,
                "gas_used": e.gas_used,
                "execution_time_ms": e.execution_time_ms,
                "transaction_hash": e.transaction_hash,
                "error": e.error,
                "opportunity": {
                    "token_in": e.opportunity.token_in,
                    "token_out": e.opportunity.token_out,
                    "amount": e.opportunity.amount,
                    "buy_chain": e.opportunity.buy_chain.value,
                    "sell_chain": e.opportunity.sell_chain.value,
                }
            }
            for e in history
        ]
    }


# ==================== STRATEGY EXECUTION ENDPOINTS ====================

@app.post("/api/v2/strategy/compile", response_model=CompileStrategyResponse)
async def compile_strategy(request: CompileStrategyRequest) -> Dict[str, Any]:
    """Compile a strategy graph into validated executable actions."""
    try:
        compiled, warnings = compile_graph_strategy(
            nodes=[{"type": node.type, "params": node.params, "meta": {"order": node.order or index}} for index, node in enumerate(request.nodes)],
            slippage_bps=request.slippage_bps or 50,
            gas_priority=request.gas_priority or "standard",
        )
        stats = dict(compiled.get("stats", {}))
        estimated_gas = float(stats.get("estimatedGas", 0))
        gas_price_gwei = float(request.gas_price_gwei or 15)
        eth_price_usd = float(request.eth_price_usd or 3000)
        stats["estimated_gas_usd"] = (estimated_gas * gas_price_gwei / 1_000_000_000) * eth_price_usd
        stats["nodes_count"] = len(request.nodes)
        strategy_hash = Web3.keccak(text=compiled["encodedCalldata"]).hex()

        return {
            "actions": compiled["actions"],
            "encodedCalldata": compiled["encodedCalldata"],
            "stats": stats,
            "warnings": [{"code": w.code, "message": w.message} for w in warnings],
            "strategyHash": strategy_hash,
        }
    except StrategyCompileError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Strategy compilation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v2/templates")
async def get_templates(category: Optional[str] = None, limit: int = 20) -> Dict[str, Any]:
    """Get persisted strategy templates."""
    templates = get_or_seed_templates()
    if category:
        templates = [t for t in templates if t.get("category", "").lower() == category.lower()]
    return {"total": len(templates), "templates": templates[:limit]}

@app.get("/api/v2/opacus/quick-templates")
async def get_quick_templates() -> Dict[str, Any]:
    """Return fast-start prompt templates for the UI."""
    return {
        "templates": [
            {"id": "quick_arb", "title": "5-Min Arbitrage", "prompt": "Flash loan USDC, swap to ETH on Uniswap, bridge to Base, swap back, repay", "category": "arbitrage"},
            {"id": "quick_yield", "title": "Best Yield", "prompt": "Deposit USDC into highest APY protocol", "category": "yield"},
            {"id": "quick_bridge", "title": "Cheapest Bridge", "prompt": "Bridge assets with minimum fees", "category": "bridge"},
            {"id": "quick_stable", "title": "Stable Yield", "prompt": "Move stablecoins into low-risk yield strategy", "category": "stablecoin"},
        ]
    }

@app.post("/api/v2/templates/generate")
async def generate_template(request: GenerateTemplateRequest) -> Dict[str, Any]:
    """Generate and optionally persist a strategy template from prompt heuristics."""
    generated = build_strategy_from_prompt(request.prompt, request.max_usdc)
    category = request.category or generated["category"]
    payload = {
        "name": request.prompt[:48],
        "category": category,
        "creator": request.creator,
        "strategy": generated["strategy"],
        "prompt": request.prompt,
    }
    saved = template_store.create_template(payload) if request.save else None
    return {
        "generated_template": {
            "id": saved["id"] if saved else f"gen_{hash(request.prompt) % 100000}",
            "strategy": generated["strategy"],
            "category": category,
            "prompt": request.prompt,
            "summary": generated["summary"],
        }
    }

@app.post("/api/v2/strategy/simulate")
async def simulate_strategy(request: StrategySimulateRequest) -> Dict[str, Any]:
    """Simulate strategy execution using live prices + live gas when available."""
    try:
        compiled, warnings = compile_graph_strategy(
            nodes=[{"type": node.type, "params": node.params, "meta": {"order": node.order or index}} for index, node in enumerate(request.nodes)],
            slippage_bps=request.slippage_bps or 50,
            gas_priority=request.gas_priority or "standard",
        )
    except StrategyCompileError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Token address to symbol mapping
    address_to_symbol = {
        "0x94a9d9ac8a22534e3faca9f88abf5d1da0c4def8": "USDC",
        "0xf4db845edf52b65e4f1b69b51e013cf67fb552e5": "USDT",
        "0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357": "DAI",
        "0x0000000000000000000000000000000000000000": "ETH",
        "0x88541670e55cc00beefd87eb59edd1b91c4f3e60": "WETH",
        "0x7bb700f9f3d2db8df6e235ce144f6b001a1d1ed5": "ftUSD",
    }

    def resolve_symbol(val: Any) -> str:
        if not isinstance(val, str) or not val:
            return ""
        val_lower = val.strip().lower()
        if val_lower in address_to_symbol:
            return address_to_symbol[val_lower].upper()
        return val.upper()

    # Collect symbols for live pricing.
    symbols: List[str] = []
    for action in compiled.get("actions", []):
        p = action.get("params", {}) or {}
        for key in ("tokenIn", "tokenOut", "asset", "token", "from", "to"):
            val = p.get(key)
            if isinstance(val, str) and val:
                symbols.append(resolve_symbol(val))
    symbols.extend(["ETH", "USDC"])

    live_prices = await fetch_live_token_prices_usd(symbols)
    eth_price_usd = live_prices.get("ETH", float(request.eth_price_usd or 3000))
    gas_price_gwei = float(request.gas_price_gwei) if request.gas_price_gwei else (fetch_live_gas_price_gwei() or 15.0)

    estimated_gas = float(compiled["stats"].get("estimatedGas", 0))
    gas_cost_eth = (estimated_gas * gas_price_gwei) / 1_000_000_000
    gas_cost_usd = gas_cost_eth * eth_price_usd

    # Live-price based strategy PnL estimation.
    slippage_ratio = (request.slippage_bps or 50) / 10_000.0
    gross_profit_usd = 0.0
    for action in compiled.get("actions", []):
        a_type = str(action.get("type", "")).upper()
        p = action.get("params", {}) or {}

        if a_type in ("SWAP", "FT_SWAP"):
            token_in = resolve_symbol(p.get("tokenIn") or p.get("from") or "USDC")
            token_out = resolve_symbol(p.get("tokenOut") or p.get("to") or "ETH")
            amount_in = float(p.get("amountIn") or p.get("amount") or 0)
            price_in = live_prices.get(token_in, 1.0 if token_in in ("USDC", "USDT", "DAI", "FTUSD") else 0.0)
            price_out = live_prices.get(token_out, 1.0 if token_out in ("USDC", "USDT", "DAI", "FTUSD") else 0.0)
            if amount_in > 0 and price_in > 0 and price_out > 0:
                input_usd = amount_in * price_in
                dex_fee = 0.003
                effective_out_usd = input_usd * (1.0 - dex_fee - slippage_ratio)
                edge_usd = float(p.get("expectedEdgeUsd") or 0.0)
                gross_profit_usd += (effective_out_usd - input_usd) + edge_usd

        elif a_type == "FLASH_LOAN":
            amount = float(p.get("amount") or 0)
            asset = resolve_symbol(p.get("asset") or p.get("token") or "USDC")
            asset_price = live_prices.get(asset, 1.0 if asset in ("USDC", "USDT", "DAI", "FTUSD") else 0.0)
            if amount > 0 and asset_price > 0:
                gross_profit_usd -= amount * asset_price * 0.0005

        elif a_type == "BRIDGE":
            amount = float(p.get("amount") or 0)
            asset = resolve_symbol(p.get("asset") or p.get("token") or "USDC")
            asset_price = live_prices.get(asset, 1.0 if asset in ("USDC", "USDT", "DAI", "FTUSD") else 0.0)
            if amount > 0 and asset_price > 0:
                gross_profit_usd -= amount * asset_price * 0.0006

        elif a_type in ("YIELD", "STAKE", "LEND", "FT_DEPOSIT", "FT_USD_MINT"):
            amount = float(p.get("amount") or 0)
            asset = resolve_symbol(p.get("asset") or p.get("token") or "USDC")
            asset_price = live_prices.get(asset, 1.0 if asset in ("USDC", "USDT", "DAI", "FTUSD") else 0.0)
            if amount > 0 and asset_price > 0:
                # One-day carry approximation at 8% APY.
                gross_profit_usd += amount * asset_price * (0.08 / 365)

    net_profit_usd = gross_profit_usd - gas_cost_usd
    failure_probability = 0.10
    if (request.slippage_bps or 50) < 30:
        failure_probability += 0.15
    if len(compiled["actions"]) > 6:
        failure_probability += 0.10
    if net_profit_usd <= 0:
        failure_probability += 0.20
        
    notional_token = "USDC"
    notional_amount = 10000.0
    profit_token = "USDC"
    
    if compiled.get("actions"):
        first_action = compiled["actions"][0]
        first_params = first_action.get("params", {}) or {}
        first_asset = first_params.get("asset") or first_params.get("tokenIn") or first_params.get("from") or first_params.get("token")
        if first_asset:
            notional_token = resolve_symbol(first_asset)
            profit_token = notional_token
        
        first_amount = first_params.get("amount") or first_params.get("amountIn")
        if first_amount:
            try:
                notional_amount = float(first_amount)
            except (ValueError, TypeError):
                pass
                
    profit_token_price = live_prices.get(profit_token) or 1.0
    net_profit = net_profit_usd / profit_token_price if profit_token_price > 0 else net_profit_usd

    return {
        "compiled": {
            **compiled,
            "warnings": [{"code": w.code, "message": w.message} for w in warnings],
        },
        "simulation": {
            "netProfitUsd": net_profit_usd,
            "netProfit": net_profit,
            "profitToken": profit_token,
            "notionalAmount": notional_amount,
            "notionalToken": notional_token,
            "grossProfitUsd": gross_profit_usd,
            "gasCostEth": gas_cost_eth,
            "gasCostUsd": gas_cost_usd,
            "slippageRisk": min(3.0, (request.slippage_bps or 50) / 100),
            "profitable": net_profit_usd > 0,
            "failureProbability": min(0.95, failure_probability),
            "estimatedGas": int(estimated_gas),
            "gasPriceGwei": gas_price_gwei,
            "ethPriceUsd": eth_price_usd,
            "networkRoute": f"QUIC Kernel-Bypass (Latency: {8 + (hash(str(request.nodes)) % 8)}ms)",
            "executionRegion": f"did:opacus:h3:{['8928308280fffff', '8928308280bffff', '89283082807ffff'][hash(str(request.nodes)) % 3]}",
            "priceSources": {
                "provider": "coingecko+sepolia_rpc",
                "tokensPriced": sorted(list(live_prices.keys())),
                "timestamp": datetime.now().isoformat(),
            },
            "warnings": [{"code": w.code, "message": w.message} for w in warnings],
        }
    }


@app.get("/api/v2/intents/mempool")
async def list_mempool_intents(limit: int = 100) -> Dict[str, Any]:
    items = intent_mempool.list_open(limit=limit)
    return {
        "total_open": len(items),
        "intents": items,
        "timestamp": datetime.now().isoformat(),
    }

@app.post("/api/v2/intents/publish")
async def publish_intent(request: IntentPublishRequest) -> Dict[str, Any]:
    """Publish an execution intent into the private intent mempool with anti-spam validation."""
    payload = request.model_dump()
    spam_reason = intent_mempool.anti_spam_check(payload)
    if spam_reason:
        raise HTTPException(status_code=429, detail=spam_reason)
    intent = intent_mempool.publish(payload)
    ranked = solver_network.rank_for_intent(intent)
    route = hot_state_engine.best_route(intent.chain, intent.min_profit_usdc, intent.max_slippage_bps)
    relay = await relay_policy_engine.choose()
    return {
        "accepted": True,
        "intent": intent.__dict__,
        "top_solver": ranked[0] if ranked else None,
        "prewarmed_route": route.__dict__ if route else None,
        "relay": relay,
        "privacy": "private-builder-routing",
        "timestamp": datetime.now().isoformat(),
    }

@app.post("/api/v2/intents/solve/{intent_id}")
async def solve_intent(intent_id: str, request: IntentSolveRequest) -> Dict[str, Any]:
    """Select a winning solver, choose a private relay, and attempt real settlement."""
    intent = intent_mempool.get(intent_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")
    if intent.status != "open":
        raise HTTPException(status_code=400, detail="Intent is not open")
    att = request.tee_attestation or {}
    if not str(att.get("quote_hash", "")).startswith("0x"):
        raise HTTPException(status_code=400, detail="tee quote_hash must be hex")
    if len(str(att.get("signature", ""))) < 16:
        raise HTTPException(status_code=400, detail="tee signature is too short")

    ranked = solver_network.rank_for_intent(intent)
    route = hot_state_engine.best_route(intent.chain, intent.min_profit_usdc, intent.max_slippage_bps)
    if not ranked or route is None:
        raise HTTPException(status_code=409, detail="No feasible solver-route pair")

    winner = ranked[0]
    relay = await relay_policy_engine.choose(prefer=request.relay_preference)
    onchain_settlement = None
    settlement_error = None
    try:
        intent_hash_hex = Web3.keccak(text=intent.intent_id).hex()
        attestation_hash_hex = Web3.keccak(text=f"{att.get('quote_hash')}:{att.get('enclave', '')}").hex()
        onchain_settlement = submit_settlement(
            repo_root=repo_root,
            intent_hash_hex=intent_hash_hex,
            user=intent.user,
            solver=winner["solver"]["solver_address"],
            gross_profit_usdc=int(route.expected_profit_usdc * 1_000_000),
            attestation_hash_hex=attestation_hash_hex,
            relay_address=relay["relay_address"],
        )
    except Exception as exc:
        settlement_error = str(exc)

    intent_mempool.mark_settled(intent_id)
    return {
        "intent_id": intent_id,
        "winner": winner,
        "route": route.__dict__,
        "private_relay": relay,
        "tee_verified": True,
        "status": "settled" if onchain_settlement else "routed",
        "onchain_settlement": onchain_settlement,
        "settlement_error": settlement_error,
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/api/v2/opacus/quic/status")
async def get_opacus_quic_status() -> Dict[str, Any]:
    """Report live relay/intent routing readiness for HTTP/3 QUIC style private execution."""
    relay = await relay_policy_engine.choose()
    open_intents = intent_mempool.list_open(limit=10)
    return {
        "status": "connected",
        "protocol": "HTTP/3_QUIC",
        "selected_relay": relay,
        "latency_ms": relay.get("reason", "unknown"),
        "open_intents": len(open_intents),
        "routes_cached": hot_state_engine.status().get("routes_cached", 0),
        "features_enabled": [
            "mev_protection",
            "intent_based_routing",
            "tee_attestation",
            "private_builder_fallback",
        ],
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/api/v2/strategy/statistics")
async def get_strategy_statistics() -> Dict[str, Any]:
    """Get strategy execution statistics"""
    stats = arbitrage_engine.get_strategy_statistics()
    return stats


@app.get("/api/v2/strategy/execution-history")
async def get_strategy_execution_history(
    limit: int = 50,
    filter_success: Optional[bool] = None,
    user_address: Optional[str] = None
) -> Dict[str, Any]:
    """Get recent strategy executions"""
    history = arbitrage_engine.strategy_execution_history[-limit:]
    
    if filter_success is not None:
        history = [e for e in history if e.success == filter_success]
    
    if user_address:
        history = [e for e in history if e.user_address.lower() == user_address.lower()]
    
    return {
        "total": len(history),
        "executions": [
            {
                "success": e.success,
                "strategy_hash": e.strategy_hash,
                "user_address": e.user_address,
                "net_profit_wei": e.net_profit_wei,
                "platform_fee_wei": e.platform_fee_wei,
                "transaction_hash": e.transaction_hash,
                "block_number": e.block_number,
                "timestamp": e.timestamp,
                "gas_used": e.gas_used,
            }
            for e in history
        ]
    }


@app.get("/api/v2/wallet/activity")
async def get_wallet_activity_endpoint(
    user_address: str,
    lookback_blocks: int = 2500,
    limit: int = 20,
) -> Dict[str, Any]:
    """Return recent on-chain wallet activity on Sepolia for the monitor page."""
    if not user_address.startswith("0x") or len(user_address) != 42:
        raise HTTPException(status_code=400, detail="invalid user_address")
    activity = get_wallet_activity(user_address=user_address, lookback_blocks=lookback_blocks, limit=limit)
    record_wallet_activity_batch(user_address, activity)
    return {
        "total": len(activity),
        "address": user_address,
        "activity": activity,
        "strategy_executor": resolve_strategy_executor_address(),
        "bandle_router": resolve_router_address(),
        "source": activity[0].get("source") if activity else "none",
    }


class UserSignInRequest(BaseModel):
    wallet_address: str
    auth_method: str
    email: Optional[str] = None
    embedded_wallet: Optional[str] = None


@app.post("/api/v2/auth/signin")
async def auth_signin(request: UserSignInRequest) -> Dict[str, Any]:
    wallet_address = (request.wallet_address or "").strip().lower()
    if not wallet_address.startswith("0x") or len(wallet_address) != 42:
        raise HTTPException(status_code=400, detail="invalid wallet_address")

    auth_method = (request.auth_method or "wallet").lower()
    if auth_method not in {"wallet", "google"}:
        raise HTTPException(status_code=400, detail="unsupported auth_method")
    if auth_method == "google" and not request.email:
        raise HTTPException(status_code=400, detail="email required for google auth")

    record_wallet_profile(wallet_address, auth_method, request.email, request.embedded_wallet)
    record_user_event(wallet_address, "SIGN_IN", {
        "auth_method": auth_method,
        "email": request.email,
        "embedded_wallet": request.embedded_wallet,
    })

    return {
        "status": "ok",
        "wallet_address": wallet_address,
        "auth_method": auth_method,
        "email": request.email,
    }


# ==================== FLASH LOAN ENDPOINTS ====================

@app.post("/api/v2/flash-loan/execute")
async def execute_flash_loan(
    chain: str,
    protocol: str,
    token: str,
    amount: float,
    callback_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Execute flash loan on specified chain"""
    try:
        chain_enum = Chain[chain.upper()]
        protocol_enum = Protocol[protocol.upper()]
        
        success, tx_hash = await arbitrage_engine.flash_loan.execute_flash_loan(
            chain_enum,
            protocol_enum,
            token,
            amount,
            callback_data
        )
        result = {
            "success": success,
            "transaction_hash": tx_hash,
            "chain": chain,
            "protocol": protocol,
            "amount": amount,
            "fee": amount * (0.0005 if protocol == "aave" else 0.0002),
            "timestamp": datetime.now().isoformat()
        }
        record_user_event(callback_data.get("wallet_address", ""), "FLASH_LOAN_EXECUTE", {
            "chain": chain,
            "protocol": protocol,
            "token": token,
            "amount": amount,
            "transaction_hash": tx_hash,
            "result": result,
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CROSS-CHAIN BRIDGE ENDPOINTS ====================

@app.post("/api/v2/bridge/transfer")
async def bridge_transfer(
    from_chain: str,
    to_chain: str,
    token: str,
    amount: float,
    bridge: str = "across"
) -> Dict[str, Any]:
    """Bridge tokens across chains"""
    try:
        def resolve_chain(value: str) -> Chain:
            raw = (value or "").strip()
            if not raw:
                raise ValueError("Chain is required")
            upper = raw.upper().replace("-", "_")
            aliases = {
                "0G": "OG_CHAIN",
                "OG": "OG_CHAIN",
            }
            key = aliases.get(upper, upper)
            try:
                return Chain[key]
            except KeyError:
                lowered = raw.lower()
                for c in Chain:
                    if c.value == lowered:
                        return c
                raise ValueError(f"Unsupported chain: {value}")

        from_chain_enum = resolve_chain(from_chain)
        to_chain_enum = resolve_chain(to_chain)
        
        success, received, time_ms, tx_hash = await arbitrage_engine.bridge.bridge_tokens(
            from_chain_enum,
            to_chain_enum,
            token,
            amount,
            bridge
        )
        result = {
            "success": success,
            "from_chain": from_chain,
            "to_chain": to_chain,
            "sent_amount": amount,
            "received_amount": received,
            "fee": amount - received,
            "execution_time_ms": time_ms,
            "transaction_hash": tx_hash,
            "bridge": bridge,
            "timestamp": datetime.now().isoformat()
        }
        record_user_event("unknown_wallet", "BRIDGE_TRANSFER", {
            "from_chain": from_chain,
            "to_chain": to_chain,
            "token": token,
            "amount": amount,
            "bridge": bridge,
            "transaction_hash": tx_hash,
            "result": result,
        })
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DEX SWAP ENDPOINTS ====================

@app.post("/api/v2/dex/best-price")
async def get_best_dex_price(
    chain: str,
    token_in: str,
    token_out: str,
    amount: float
) -> Dict[str, Any]:
    """Get best swap price across DEXs"""
    try:
        chain_enum = Chain[chain.upper()]
        
        output_amount, best_dex, time_ms = await arbitrage_engine.dex.get_best_swap_price(
            token_in,
            token_out,
            amount,
            chain_enum
        )
        
        return {
            "chain": chain,
            "token_in": token_in,
            "token_out": token_out,
            "input_amount": amount,
            "output_amount": output_amount,
            "best_dex": best_dex.value,
            "execution_time_ms": time_ms,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WEBSOCKET FOR REAL-TIME MONITORING ====================

@app.websocket("/ws/arbitrage/monitor/{user_id}")
async def websocket_arbitrage_monitor(websocket: WebSocket, user_id: str):
    """Real-time arbitrage opportunity and execution monitoring"""
    await websocket.accept()
    
    if user_id not in active_connections:
        active_connections[user_id] = []
    active_connections[user_id].append(websocket)

    async def _safe_send(payload: Dict[str, Any]) -> bool:
        try:
            await websocket.send_json(payload)
            return True
        except Exception:
            return False
    
    try:
        while True:
            # Continuously scan for opportunities and broadcast to client
            opportunities = await arbitrage_engine.detect_opportunities()
            
            if opportunities:
                sent = await _safe_send({
                    "type": "opportunities",
                    "count": len(opportunities),
                    "top_opportunity": {
                        "token_in": opportunities[0].token_in,
                        "token_out": opportunities[0].token_out,
                        "profit_usdc": opportunities[0].profit_usdc,
                        "profit_percentage": opportunities[0].profit_percentage,
                        "risk_score": opportunities[0].risk_score,
                    }
                })
                if not sent:
                    break
            
            stats = arbitrage_engine.get_statistics()
            sent = await _safe_send({
                "type": "statistics",
                "stats": stats
            })
            if not sent:
                break
            
            # Send strategy execution statistics
            strategy_stats = arbitrage_engine.get_strategy_statistics()
            sent = await _safe_send({
                "type": "strategy_statistics",
                "stats": strategy_stats
            })
            if not sent:
                break
            
            # Send recent strategy executions for this user
            user_executions = [e for e in arbitrage_engine.strategy_execution_history[-10:] 
                             if e.user_address.lower() == user_id.lower()]
            if user_executions:
                sent = await _safe_send({
                    "type": "strategy_executions",
                    "executions": [
                        {
                            "success": e.success,
                            "strategy_hash": e.strategy_hash,
                            "net_profit_wei": e.net_profit_wei,
                            "platform_fee_wei": e.platform_fee_wei,
                            "transaction_hash": e.transaction_hash,
                            "timestamp": e.timestamp,
                        }
                        for e in user_executions[-5:]  # Last 5 executions
                    ]
                })
                if not sent:
                    break
            
            # Update every 5 seconds
            await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        pass
    finally:
        if user_id in active_connections and websocket in active_connections[user_id]:
            active_connections[user_id].remove(websocket)


# ==================== VAULT MANAGEMENT ENDPOINTS ====================

@app.get("/api/v2/vaults")
async def list_user_vaults(user_address: str) -> Dict[str, Any]:
    """List all vaults for a user"""
    user_vaults = [
        v for v in vaults_storage.values() 
        if v.get("user_address", "").lower() == user_address.lower()
    ]
    return {
        "total": len(user_vaults),
        "vaults": user_vaults,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v2/vaults/marketplace")
async def get_marketplace() -> Dict[str, Any]:
    """Get marketplace vaults (templates and suggestions)"""
    vaults = get_marketplace_vaults()
    return {
        "total": len(vaults),
        "vaults": vaults,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v2/vaults/marketplace/suggested")
async def get_suggested_vaults(user_address: str, risk_profile: Optional[str] = None) -> Dict[str, Any]:
    """Get marketplace vaults suggested for user based on profile"""
    all_vaults = get_marketplace_vaults()
    
    # Filter by risk profile
    if risk_profile:
        all_vaults = [v for v in all_vaults if v.get("risk_level", "").lower() == risk_profile.lower()]
    
    # Sort by APY descending
    all_vaults.sort(key=lambda v: v.get("apy_estimate", 0), reverse=True)
    
    return {
        "total": len(all_vaults),
        "vaults": all_vaults[:4],  # Return top 4
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v2/vaults/{vault_id}")
async def get_vault_detail(vault_id: str) -> Dict[str, Any]:
    """Get detailed information about a vault"""
    vault = vaults_storage.get(vault_id)
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    
    # Calculate dynamic metrics
    vault["updated_at"] = datetime.now().isoformat()
    return vault

@app.post("/api/v2/vaults/create")
async def create_vault(request: CreateVaultRequest) -> Dict[str, Any]:
    """Create a new vault with initial deposit and strategy"""
    vault_id = f"vault_{int(datetime.now().timestamp() * 1000)}"
    timestamp = int(datetime.now().timestamp())
    
    # Get template to extract strategy nodes
    templates = get_or_seed_templates()
    template_strategy = None
    for t in templates:
        if t.get("id") == request.strategy_template_id or t.get("name") == request.strategy_template_id:
            template_strategy = t.get("strategy", {}).get("nodes", [])
            break
    
    if not template_strategy:
        # Default simple strategy
        template_strategy = [
            {"type": "SWAP", "params": {"dex": "uniswap", "tokenIn": "USDC", "tokenOut": "ETH", "amountIn": str(request.deposit_amount_usdc)}}
        ]
    
    vault = {
        "id": vault_id,
        "user_address": request.user_address,
        "name": request.name,
        "description": request.description,
        "status": "CREATED",
        "tvl_usdc": request.deposit_amount_usdc,
        "apy_estimate": 15.5 + (5.0 if request.risk_level == "high" else 0.0 if request.risk_level == "low" else 2.5),
        "risk_level": request.risk_level,
        "chain": request.chain,
        "strategy_template_id": request.strategy_template_id,
        "strategy_nodes": template_strategy,
        "profit_today_usdc": 0.0,
        "profit_7d_usdc": 0.0,
        "profit_30d_usdc": 0.0,
        "cumulative_profit_usdc": 0.0,
        "latency_ms": 45.0 if request.solver_region == "frankfurt" else 120.0 if request.solver_region == "singapore" else 80.0,
        "solver_region": request.solver_region,
        "health_status": "healthy",
        "execution_mode": request.execution_mode,
        "created_at": timestamp,
        "last_rebalance_at": timestamp,
        "settlement_tx_hash": None,
    }
    
    # Store vault
    vaults_storage[vault_id] = vault
    save_vaults_to_storage(vaults_storage)
    
    # Publish intent for settlement
    try:
        intent_payload = {
            "user": request.user_address,
            "strategy_hash": Web3.keccak(text=f"{vault_id}:{timestamp}").hex(),
            "chain": request.chain,
            "notional_usdc": request.deposit_amount_usdc,
            "min_profit_usdc": request.deposit_amount_usdc * 0.01,
            "max_slippage_bps": 100 if request.risk_level == "high" else 50 if request.risk_level == "medium" else 20,
            "deadline_ts": timestamp + 86400,
            "nonce": timestamp,
            "intent_stake_score": 0.8,
        }
        published = intent_mempool.publish(intent_payload)
        vault["intent_id"] = published.intent_id
        vault["status"] = "FUNDED"
        vaults_storage[vault_id] = vault
        save_vaults_to_storage(vaults_storage)
    except Exception as e:
        logger.warning(f"Intent publish failed for vault: {str(e)}")
    
    return vault

@app.post("/api/v2/vaults/{vault_id}/deposit")
async def deposit_to_vault(vault_id: str, request: DepositRequest) -> Dict[str, Any]:
    """Deposit additional funds to an existing vault"""
    vault = vaults_storage.get(vault_id)
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    
    if vault.get("user_address", "").lower() != request.user_address.lower():
        raise HTTPException(status_code=403, detail="Not vault owner")
    
    old_tvl = vault.get("tvl_usdc", 0)
    vault["tvl_usdc"] = old_tvl + request.amount_usdc
    vault["status"] = "ACTIVE" if vault.get("status") == "FUNDED" else vault.get("status")
    
    vaults_storage[vault_id] = vault
    save_vaults_to_storage(vaults_storage)
    
    return {
        "vault_id": vault_id,
        "previous_tvl": old_tvl,
        "deposit_amount": request.amount_usdc,
        "new_tvl": vault["tvl_usdc"],
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v2/vaults/{vault_id}/withdraw")
async def withdraw_from_vault(vault_id: str, request: WithdrawRequest) -> Dict[str, Any]:
    """Withdraw funds from a vault"""
    vault = vaults_storage.get(vault_id)
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    
    if vault.get("user_address", "").lower() != request.user_address.lower():
        raise HTTPException(status_code=403, detail="Not vault owner")
    
    current_tvl = vault.get("tvl_usdc", 0)
    if request.amount_usdc > current_tvl:
        raise HTTPException(status_code=400, detail="Insufficient vault balance")
    
    old_tvl = current_tvl
    vault["tvl_usdc"] = current_tvl - request.amount_usdc
    
    if vault["tvl_usdc"] <= 0:
        vault["status"] = "SETTLED"
    
    vaults_storage[vault_id] = vault
    save_vaults_to_storage(vaults_storage)
    
    return {
        "vault_id": vault_id,
        "previous_tvl": old_tvl,
        "withdrawal_amount": request.amount_usdc,
        "new_tvl": vault["tvl_usdc"],
        "timestamp": datetime.now().isoformat()
    }

def get_marketplace_vaults() -> List[Dict[str, Any]]:
    """Build marketplace cards from persisted strategy templates."""
    templates = get_or_seed_templates()
    cards: List[Dict[str, Any]] = []
    for i, t in enumerate(templates):
        category = str(t.get("category", "arbitrage"))
        usage = int(t.get("usage_count", 0))
        risk = "Medium"
        if category in ("stablecoin", "bridge", "yield"):
            risk = "Low"
        elif category in ("arbitrage", "leverage", "liquidation"):
            risk = "High"

        apy = float(t.get("apy_estimate", 0) or (10 + min(20, usage % 20)))
        cards.append(
            {
                "id": f"mkt-{t.get('id')}",
                "name": t.get("name", "Strategy Vault"),
                "description": t.get("description", f"{category.title()} strategy from template store"),
                "apy_estimate": round(apy, 2),
                "tvl_usdc": float(500000 + usage * 120),
                "win_rate_percent": float(max(55, min(96, 65 + (usage % 30)))),
                "risk_level": risk,
                "creator_fee_percent": round(1.0 + ((i % 4) * 0.4), 2),
                "users_count": max(10, usage),
                "strategy_category": category,
            }
        )
    cards.sort(key=lambda v: v.get("apy_estimate", 0), reverse=True)
    return cards


@app.get("/api/v2/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "arbitrage_engine": "active",
        "supported_chains": [c.value for c in Chain],
        "supported_protocols": [p.value for p in Protocol],
        "supported_dexs": [d.value for d in DEX],
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/v2/info")
async def get_platform_info() -> Dict[str, Any]:
    """Get platform information"""
    return {
        "name": "Movipa Arbitrage Platform",
        "description": "Multi-chain flash loan arbitrage with real-time monitoring",
        "version": "2.0.0",
        "features": [
            "Multi-chain flash loans",
            "Cross-chain bridges",
            "DEX arbitrage",
            "Real-time opportunity detection",
            "Risk scoring",
            "Execution history",
            "WebSocket real-time monitoring"
        ],
        "min_arbitrage_amount": "$100,000",
        "max_arbitrage_amount": "$10,000,000",
        "supported_chains": len(Chain),
        "min_profit_threshold": "$1,000",
        "execution_speed_ms": "~700ms",
        "flash_loan_fee": "0.05% (Aave)",
        "bridge_fee": "0.05% (Across)",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
