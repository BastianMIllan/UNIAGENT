<p align="center">
  <img src="GithubBanner.jpg" alt="UniAgent Banner" width="100%" />
</p>

<h1 align="center">UniAgent</h1>

<p align="center">
  <strong>Give your AI agent a wallet. Let it trade across every chain.</strong><br/>
  <em>An OpenClaw skill that enables AI agents to buy, sell, convert, and transfer any token on 21+ blockchains autonomously.</em>
</p>

<p align="center">
  <a href="https://github.com/BastianMIllan/UNIAGENT/actions/workflows/ci.yml"><img src="https://github.com/BastianMIllan/UNIAGENT/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/BastianMIllan/UNIAGENT/releases"><img src="https://img.shields.io/github/v/release/BastianMIllan/UNIAGENT?color=blue&label=release" alt="Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>
  <a href="https://github.com/BastianMIllan/UNIAGENT/stargazers"><img src="https://img.shields.io/github/stars/BastianMIllan/UNIAGENT?style=social" alt="Stars" /></a>
</p>

<p align="center">
  <a href="#why-uniagent">Why UniAgent</a> •
  <a href="#how-agents-use-it">How Agents Use It</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#supported-chains">Chains</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#api-reference">API</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#security">Security</a> •
  <a href="#license">License</a>
</p>

---

## Why UniAgent

AI agents are great at reasoning. They're terrible at DeFi. An agent that wants to buy a token on Arbitrum using funds on Solana would need to understand bridging, DEX routing, gas tokens, chain-specific contract addresses, and slippage — across 21 different blockchains. That's not a prompt engineering problem. That's an infrastructure problem.

**UniAgent solves it.** It's an [OpenClaw](https://openclaw.ai/) skill that gives any AI agent full cross-chain trading capabilities through simple CLI commands. The agent says _"buy $10 of ARB on Arbitrum"_ and UniAgent handles everything else — routing, bridging, gas abstraction — across every supported chain.

- **Agent-native.** Built as an OpenClaw skill from day one. Your agent installs it and immediately gains cross-chain DeFi superpowers.
- **One balance, every chain.** USDC on Arbitrum, ETH on Base, SOL on Solana — all part of a single unified balance the agent can query and spend from.
- **Any token, anywhere.** The agent can buy a memecoin on Solana using USDC sitting on Ethereum. The routing is automatic.
- **Self-custodial.** Private keys never leave the user's machine. The agent signs transactions locally — it never sends keys over the network.

---

## How Agents Use It

### The User Experience

The user installs the skill. That's it. They never touch a terminal. From that point on, they just talk to their agent:

> **User:** "Set up my trading account"  
> **Agent:** runs `init` → generates wallet → creates Universal Account → returns deposit addresses  
> **Agent:** "Your account is ready. Send USDC to 0x7F8a... to start trading."

> **User:** "I just sent $50 USDC"  
> **Agent:** runs `balance` → confirms funds arrived  
> **Agent:** "Got it. $50.00 USDC across your account. What do you want to trade?"

> **User:** "Buy $10 of ARB on Arbitrum"  
> **Agent:** runs `buy --chain arbitrum --token 0x912...548 --amount 10` → signs → submits  
> **Agent:** "Done. Bought $10 of ARB. [Explorer link]"

### What Happens Under the Hood

```
User installs skill → Agent reads SKILL.md
  │
  ├─▶ First interaction: agent runs init
  │     ├─▶ Backend reachable? ✓
  │     ├─▶ Wallet exists? No → generate + save to .env
  │     ├─▶ Call /init → get deposit addresses
  │     └─▶ Tell user where to send USDC
  │
  ├─▶ User funds account
  │
  └─▶ Trading: agent translates natural language → CLI commands
        ├─▶ CLI calls backend → gets rootHash
        ├─▶ CLI signs locally (key never leaves machine)
        └─▶ CLI submits → backend broadcasts → done
```

No bridging knowledge needed. No chain-switching. No manual routing. The agent handles everything.

---

## Agent Capabilities

| Capability | What the Agent Can Do |
|---|---|
| **Account Setup** | _"Set up my trading account"_ — `init` generates wallet, creates Universal Account, shows deposit addresses |
| **Status Check** | _"Is my account ready?"_ — `status` checks backend, wallet, balance in one shot |
| **Cross-Chain Buy** | _"Buy $5 of SOL"_ — Spend from unified balance to purchase any token on any chain |
| **Cross-Chain Sell** | _"Sell 100 PEPE on Base"_ — Sell any token, proceeds return to unified balance |
| **Asset Conversion** | _"Convert $50 to ETH on Base"_ — Move between USDC, ETH, SOL, BNB, BTC, USDT |
| **Cross-Chain Transfer** | _"Send 5 USDT to 0x... on Arbitrum"_ — Transfer tokens to any address on any chain |
| **Balance Query** | _"What's my balance?"_ — View aggregated holdings across all 21 chains |
| **Fee Preview** | _"Preview buying $100 of ETH"_ — Inspect fees and routing before executing |
| **Transaction History** | _"Show my recent trades"_ — Full audit trail of all operations |

**Primary Assets:** `USDC` · `USDT` · `ETH` · `SOL` · `BNB` · `BTC`

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        AI AGENT (OpenClaw)                        │
│                                                                  │
│   "Buy $10 of ARB on Arbitrum"                                   │
│    ↓                                                             │
│   Reads SKILL.md → runs: node cli.mjs buy --chain arbitrum ...   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SKILL CLI (cli.mjs)                          │
│                                                                  │
│   • Calls UniAgent backend API via HTTP                          │
│   • Signs transactions locally with user's wallet key            │
│   • Private key NEVER leaves the machine                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     UNIAGENT BACKEND                             │
│                                                                  │
│   Express.js API Server (server.mjs)                             │
│   • Holds infrastructure credentials securely                    │
│   • Creates transactions via Universal Accounts SDK              │
│   • Returns rootHash for client-side signing                     │
│   • Broadcasts signed transactions on behalf of agents           │
│   • Stores pending transactions in memory (5 min TTL)            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   UNIVERSAL ACCOUNTS LAYER                       │
│                                                                  │
│   • Aggregates liquidity across 21+ blockchains                  │
│   • Finds optimal cross-chain routes automatically               │
│   • Handles bridging, swapping, and gas abstraction              │
└──────────────────────────────────────────────────────────────────┘
```

**Key principle:** The agent never touches infrastructure credentials or blockchain complexity. It just executes CLI commands. The backend handles all routing, and the user's wallet key stays local.

---

## Supported Chains

| Chain | CLI Name | Chain ID | | Chain | CLI Name | Chain ID |
|---|---|---|---|---|---|---|
| Ethereum | `ethereum` | 1 | | Linea | `linea` | 59144 |
| BNB Chain | `bnb` | 56 | | Sonic | `sonic` | 146 |
| Base | `base` | 8453 | | Berachain | `berachain` | 80094 |
| Arbitrum | `arbitrum` | 42161 | | Mantle | `mantle` | 5000 |
| Avalanche | `avalanche` | 43114 | | Monad | `monad` | 143 |
| Optimism | `optimism` | 10 | | Merlin | `merlin` | 4200 |
| Polygon | `polygon` | 137 | | HyperEVM | `hyperevm` | 999 |
| Solana | `solana` | 101 | | Blast | `blast` | 81457 |
| Manta | `manta` | 169 | | Mode | `mode` | 34443 |
| Plasma | `plasma` | 9745 | | X Layer | `xlayer` | 196 |
| Conflux | `conflux` | 1030 | | | | |

---

## Quickstart

### Prerequisites

- **Node.js** ≥ 18
- **USDC** (or any supported asset) on any chain — to fund your account

### 1. Clone & Install

```bash
git clone https://github.com/BastianMIllan/UNIAGENT.git
cd UNIAGENT
```

### 2. Start the Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your Particle Network credentials:

```env
PARTICLE_PROJECT_ID=your-project-id
PARTICLE_CLIENT_KEY=your-client-key
PARTICLE_APP_ID=your-app-uuid
PORT=3069
API_SECRET=your-random-secret
```

```bash
npm install
node server.mjs
```

### 3. Install the Skill

```bash
cd ../skills/universal-swap
npm install
```

That's it for manual setup. **From this point, the agent handles everything.**

When a user installs the skill and talks to their agent, the agent:
1. Runs `init` automatically — generates wallet, creates Universal Account
2. Shows the user their deposit addresses (EVM + Solana)
3. Waits for the user to fund the account with USDC
4. Confirms balance, then executes whatever the user asks

The user never runs CLI commands. The agent reads the SKILL.md and knows exactly what to do.

### What the User Sees

```
User: "I want to start trading"
Agent: "Setting up your account..."
Agent: "Done! Your deposit address is 0x7F8a9B... — send USDC there from any chain."

User: "I sent $50 USDC"
Agent: "Confirmed. $50.00 balance. What do you want to trade?"

User: "Buy $10 of ARB on Arbitrum"
Agent: "Done. Bought $10 of ARB. Transaction: universalx.app/activity/details?id=..."
```

### CLI Reference (for agents and developers)

```bash
# Setup
node cli.mjs init                           # Generate wallet + create Universal Account
node cli.mjs status                         # Diagnostic check (backend, wallet, funds)
node cli.mjs balance                        # Show addresses + unified balance

# Trading
node cli.mjs buy --chain arbitrum --token 0x912...548 --amount 10
node cli.mjs sell --chain base --token 0xabc...def --amount 100
node cli.mjs convert --chain base --asset ETH --amount 0.01
node cli.mjs transfer --chain arbitrum --token 0xFd0...bb9 --amount 5 --to 0x123...abc

# Info
node cli.mjs history                        # Transaction history
node cli.mjs chains                         # List supported chains

# Add --preview to any trade command to inspect fees before executing
```

---

## API Reference

All endpoints are served by the backend (`server.mjs`). Authentication via `x-api-key` header when `API_SECRET` is set.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/chains` | List supported chains and primary assets |
| `POST` | `/init` | Initialize Universal Account — returns deposit addresses |
| `POST` | `/balance` | Get Universal Account addresses and unified balance |
| `POST` | `/buy` | Create a buy transaction (returns `rootHash` to sign) |
| `POST` | `/sell` | Create a sell transaction |
| `POST` | `/convert` | Convert between primary assets |
| `POST` | `/transfer` | Transfer tokens to another address |
| `POST` | `/submit` | Submit a locally-signed transaction for broadcast |
| `POST` | `/history` | Get transaction history |

### Request/Response Examples

<details>
<summary><strong>POST /buy</strong></summary>

**Request:**
```json
{
  "ownerAddress": "0xYourWalletAddress",
  "chain": "arbitrum",
  "token": "0x912CE59144191C1204E64559FE8253a0e49E6548",
  "amountInUSD": "10"
}
```

**Response:**
```json
{
  "rootHash": "0xabc123...",
  "preview": {
    "totalFeeUSD": "0.12",
    "gasFeeUSD": "0.08",
    "serviceFeeUSD": "0.02",
    "lpFeeUSD": "0.02",
    "steps": 2
  },
  "message": "Sign the rootHash with your wallet and POST to /submit"
}
```
</details>

<details>
<summary><strong>POST /submit</strong></summary>

**Request:**
```json
{
  "rootHash": "0xabc123...",
  "signature": "0xdef456..."
}
```

**Response:**
```json
{
  "transactionId": "tx_789...",
  "explorerUrl": "https://universalx.app/activity/details?id=tx_789...",
  "fees": {
    "totalUSD": "0.12",
    "gasUSD": "0.08"
  }
}
```
</details>

<details>
<summary><strong>POST /init</strong> — Initialize Universal Account</summary>

**Request:**
```json
{
  "ownerAddress": "0xYourWalletAddress"
}
```

**Response:**
```json
{
  "ownerAddress": "0xYourWalletAddress",
  "smartAccountAddresses": {
    "evm": "0xSmartAccountAddress",
    "solana": "SolanaSmartAccountAddress"
  },
  "totalBalanceUSD": 0,
  "assets": [],
  "funded": false,
  "instructions": {
    "step1": "Your Universal Account is ready.",
    "step2": "To start trading, deposit USDC to your smart account address on any supported chain.",
    "evmDeposit": "Send USDC/USDT/ETH to: 0xSmartAccountAddress",
    "solanaDeposit": "Send USDC/SOL to: SolanaSmartAccountAddress",
    "step3": "Once funded, use 'balance' to verify, then 'buy', 'sell', 'convert', or 'transfer' to trade.",
    "supportedDepositAssets": ["USDC", "USDT", "ETH", "SOL", "BNB", "BTC"]
  }
}
```
</details>

<details>
<summary><strong>POST /balance</strong></summary>

**Request:**
```json
{
  "ownerAddress": "0xYourWalletAddress"
}
```

**Response:**
```json
{
  "ownerAddress": "0xYourWalletAddress",
  "evmAddress": "0xSmartAccountAddress",
  "solanaAddress": "SolanaSmartAccountAddress",
  "totalBalanceUSD": 142.57,
  "assets": [
    {
      "symbol": "USDC",
      "name": "USD Coin",
      "totalAmount": "100.00",
      "totalAmountInUSD": 100.00,
      "chains": [
        { "chain": "Arbitrum", "chainId": 42161, "amount": "60.00" },
        { "chain": "Base", "chainId": 8453, "amount": "40.00" }
      ]
    }
  ]
}
```
</details>

---

## OpenClaw Integration

UniAgent is built as a native [OpenClaw](https://openclaw.ai/) skill. Once installed, any OpenClaw-compatible AI agent gains full cross-chain trading capabilities without any additional configuration or DeFi knowledge.

### Skill Installation

Copy `skills/universal-swap/` to your OpenClaw workspace:

```bash
cp -r skills/universal-swap ~/.openclaw/workspace/skills/universal-swap
```

Configure environment variables in `openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "universal-swap": {
        "enabled": true,
        "env": {
          "UA_PRIVATE_KEY": "your-wallet-private-key",
          "UNIAGENT_API_URL": "http://localhost:3069",
          "UNIAGENT_API_KEY": "your-api-secret"
        }
      }
    }
  }
}
```

That's it. The agent reads the `SKILL.md` definition and knows exactly what commands are available, what parameters they take, and how to use them. No prompt engineering required.

---

## Project Structure

```
UNIAGENT/
├── backend/
│   ├── server.mjs            # API server — holds infrastructure credentials
│   ├── package.json           # Dependencies (express, helmet, cors, SDK, ethers)
│   ├── .env                   # Server credentials (git-ignored)
│   └── .gitignore
│
├── skills/
│   └── universal-swap/
│       ├── SKILL.md           # OpenClaw AgentSkills definition
│       ├── cli.mjs            # CLI — calls backend API, signs locally
│       ├── config.json        # Slippage, gas, routing preferences
│       ├── package.json       # Dependencies (ethers only)
│       ├── .env.example       # Environment variable template
│       ├── .env               # User config (git-ignored)
│       └── .gitignore
│
├── GithubBanner.jpg           # Repository banner
├── README.md                  # This file
├── LICENSE
└── .gitignore
```

---

## Security

| Principle | Implementation |
|---|---|
| **Self-custodial** | Private keys never leave the user's machine. Signing is local only. |
| **Credential isolation** | Infrastructure credentials exist only on the backend server. |
| **API authentication** | Optional `API_SECRET` protects backend endpoints via `x-api-key` header. |
| **No key transmission** | The CLI sends wallet *addresses* to the backend, never private keys. |
| **Transaction TTL** | Pending unsigned transactions expire after 5 minutes server-side. |
| **Git-ignored secrets** | All `.env` files are excluded from version control. |

> **Always preview large trades** with `--preview` before executing. Start with small amounts.

---

## Configuration

`skills/universal-swap/config.json`:

| Parameter | Default | Description |
|---|---|---|
| `slippageBps` | `100` | Slippage tolerance in basis points (100 = 1%) |
| `universalGas` | `true` | Use PARTI token for gas abstraction |
| `defaultSourceTokens` | `[]` | Restrict source assets (e.g., `["USDC"]`) |
| `preferredChains` | `["arbitrum","base","solana"]` | Preferred chains for routing |

---

## Contributing

We welcome contributions! Check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Setting up the development environment
- Code style and conventions
- Adding new chains, assets, or commands
- Submitting pull requests

---

## License

This project is licensed under the [MIT License](LICENSE).
