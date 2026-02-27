---
name: universal-swap
description: Trade ANY token on ANY supported chain using USDC (or other primary assets) via cross-chain Universal Accounts. Buy, sell, convert, transfer tokens cross-chain without manual bridging.
user-invocable: true
metadata: {"openclaw":{"emoji":"🔄","requires":{"bins":["node"],"env":["UA_PRIVATE_KEY","UNIAGENT_API_URL"]},"primaryEnv":"UA_PRIVATE_KEY"}}
---

# Universal Swap — Cross-Chain Token Trading

Trade **any token** on **any supported chain** using your unified balance (USDC, USDT, ETH, SOL, BNB, BTC) powered by Universal Accounts.

## Setup

1. Set these environment variables (or configure in `openclaw.json` under `skills.entries.universal-swap.env`):
   - `UA_PRIVATE_KEY` — The private key of the EOA wallet that owns the Universal Account
   - `UNIAGENT_API_URL` — The backend API URL (default: `http://localhost:3069`)
   - `UNIAGENT_API_KEY` — (Optional) API key if the backend requires authentication

2. Install dependencies:
   ```bash
   cd {baseDir} && npm install
   ```

## Available Commands

Run all commands from `{baseDir}` using `node`:

### Check Balance
```bash
cd {baseDir} && node cli.mjs balance
```
Shows your Universal Account addresses (EVM + Solana) and unified balance across all chains.

### Buy a Token (Spend USDC/primary assets → Get target token)
```bash
cd {baseDir} && node cli.mjs buy --chain <chainName> --token <tokenAddress> --amount <amountInUSD>
```
Buy any token on any supported chain by specifying its contract address and USD amount. Your USDC/USDT/ETH/SOL across all chains will be auto-routed.

**Examples:**
```bash
# Buy $10 of USDT on Arbitrum
cd {baseDir} && node cli.mjs buy --chain arbitrum --token 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 --amount 10

# Buy $5 of ARB token on Arbitrum
cd {baseDir} && node cli.mjs buy --chain arbitrum --token 0x912CE59144191C1204E64559FE8253a0e49E6548 --amount 5

# Buy $1 of a Solana token (use Solana mint address)
cd {baseDir} && node cli.mjs buy --chain solana --token 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN --amount 1

# Buy $0.50 of SOL
cd {baseDir} && node cli.mjs buy --chain solana --token native --amount 0.50

# Buy $2 of ETH on Base
cd {baseDir} && node cli.mjs buy --chain base --token native --amount 2
```

### Sell a Token (Sell token → Receive primary assets)
```bash
cd {baseDir} && node cli.mjs sell --chain <chainName> --token <tokenAddress> --amount <tokenAmount>
```
Sell a specific amount of a token you hold. The proceeds go back to your primary asset balance.

**Examples:**
```bash
# Sell 0.1 ARB on Arbitrum
cd {baseDir} && node cli.mjs sell --chain arbitrum --token 0x912CE59144191C1204E64559FE8253a0e49E6548 --amount 0.1

# Sell 100 tokens of a Solana memecoin
cd {baseDir} && node cli.mjs sell --chain solana --token 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN --amount 100
```

### Convert Primary Assets
```bash
cd {baseDir} && node cli.mjs convert --chain <chainName> --asset <USDC|USDT|ETH|SOL|BNB|BTC> --amount <amount>
```
Convert between primary assets (e.g., move USDC to ETH on a specific chain).

**Examples:**
```bash
# Convert to 10 USDC on Arbitrum
cd {baseDir} && node cli.mjs convert --chain arbitrum --asset USDC --amount 10

# Convert to 0.01 ETH on Base
cd {baseDir} && node cli.mjs convert --chain base --asset ETH --amount 0.01
```

### Transfer Tokens
```bash
cd {baseDir} && node cli.mjs transfer --chain <chainName> --token <tokenAddress> --amount <amount> --to <receiverAddress>
```
Send tokens to another address on any chain.

**Examples:**
```bash
# Send 5 USDT to someone on Arbitrum
cd {baseDir} && node cli.mjs transfer --chain arbitrum --token 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 --amount 5 --to 0x1234...abcd
```

### Preview Transaction (Dry Run)
```bash
cd {baseDir} && node cli.mjs buy --chain <chainName> --token <tokenAddress> --amount <amountInUSD> --preview
```
Add `--preview` to any buy/sell/convert/transfer command to see fees and route details without executing.

### Transaction History
```bash
cd {baseDir} && node cli.mjs history [--page <n>] [--size <n>]
```

## Supported Chains

| Chain       | Name for CLI  | Chain ID |
|-------------|---------------|----------|
| Ethereum    | `ethereum`    | 1        |
| BNB Chain   | `bnb`         | 56       |
| Base        | `base`        | 8453     |
| Arbitrum    | `arbitrum`    | 42161    |
| Avalanche   | `avalanche`   | 43114    |
| Optimism    | `optimism`    | 10       |
| Polygon     | `polygon`     | 137      |
| Solana      | `solana`      | 101      |
| Linea       | `linea`       | 59144    |
| Sonic       | `sonic`       | 146      |
| Berachain   | `berachain`   | 80094    |
| Mantle      | `mantle`      | 5000     |
| Monad       | `monad`       | 143      |
| Merlin      | `merlin`      | 4200     |
| HyperEVM   | `hyperevm`    | 999      |
| Blast      | `blast`       | 81457    |
| Manta      | `manta`       | 169      |
| Mode       | `mode`        | 34443    |
| Plasma     | `plasma`      | 9745     |
| X Layer    | `xlayer`      | 196      |
| Conflux    | `conflux`     | 1030     |

## Primary Assets (Deep Liquidity)
These are used as source for swaps: **USDC, USDT, ETH, BTC, SOL, BNB**

## How It Works
The skill communicates with a backend API that handles all cross-chain trading logic. When you buy a token:
1. The backend identifies which primary assets you hold across all chains
2. It finds the optimal route (may involve cross-chain bridging under the hood)
3. The skill signs the transaction locally with your wallet key (it never leaves your machine)
4. The backend broadcasts the signed transaction
5. You receive the target token — no manual bridging needed

## Tips
- Use `native` as the token address for native tokens (ETH, SOL, BNB, etc.)
- The `--amount` for `buy` is always in USD
- The `--amount` for `sell` is in the token's own units
- The `--amount` for `convert` is in the target asset's units
- Always `--preview` first for large trades to check fees
- Slippage is set to 1% by default; adjust in `config.json`
