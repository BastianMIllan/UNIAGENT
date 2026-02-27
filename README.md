<p align="center">
  <img src="GithubBanner.jpg" alt="UniAgent Banner" width="100%" />
</p>

<h1 align="center">UniAgent</h1>

<p align="center">
  <strong>Give your AI agent a wallet. Let it trade across every chain.</strong><br/>
  <em>An OpenClaw skill that enables AI agents to buy, sell, convert, and transfer any token on 21+ blockchains autonomously.</em>
</p>

<p align="center">
  <a href="#why-uniagent">Why UniAgent</a> •
  <a href="#how-agents-use-it">How Agents Use It</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#supported-chains">Chains</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#api-reference">API</a> •
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

Once installed, an OpenClaw agent can execute cross-chain trades using natural language:

> **User:** "Check my cross-chain balance"  
> **User:** "Buy $10 of ARB on Arbitrum"  
> **User:** "Sell 0.5 ETH on Base"  
> **User:** "Send 50 USDC to 0x... on Polygon"  
> **User:** "Convert $100 to SOL on Solana"  

The agent reads the skill definition, translates the request into a CLI command, and executes it. Under the hood:

```
Agent receives: "Buy $10 of ARB on Arbitrum"
  │
  ├─▶ Translates to: node cli.mjs buy --chain arbitrum --token 0x912...548 --amount 10
  │
  ├─▶ CLI calls backend API → gets transaction rootHash
  ├─▶ CLI signs rootHash locally with user's wallet key
  └─▶ CLI submits signature → backend broadcasts → agent reports success
```

No bridging knowledge needed. No chain-switching. No manual routing. The agent just trades.

---

## Agent Capabilities

| Capability | What the Agent Can Do |
|---|---|
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
- An **EOA wallet** (MetaMask, etc.) with funds on any supported chain

### 1. Clone & Install

```bash
git clone https://github.com/BastianMIllan/UNIAGENT.git
cd UNIAGENT
```

### 2. Configure the Backend

```bash
cd backend
cp .env.example .env    # if .env.example exists, otherwise create .env
```

Edit `backend/.env`:

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

The API will start on `http://localhost:3069`.

### 3. Configure the Skill

```bash
cd ../skills/universal-swap
cp .env.example .env
```

Edit `skills/universal-swap/.env`:

```env
UNIAGENT_API_URL=http://localhost:3069
UNIAGENT_API_KEY=your-random-secret
UA_PRIVATE_KEY=your-wallet-private-key
```

```bash
npm install
```

### 4. Trade

```bash
# Check your unified balance across all chains
node cli.mjs balance

# Buy $10 of ARB on Arbitrum
node cli.mjs buy --chain arbitrum --token 0x912CE59144191C1204E64559FE8253a0e49E6548 --amount 10

# Buy $1 of SOL
node cli.mjs buy --chain solana --token native --amount 1

# Sell 100 tokens on Base
node cli.mjs sell --chain base --token 0xabc...def --amount 100

# Convert to 0.01 ETH on Base
node cli.mjs convert --chain base --asset ETH --amount 0.01

# Send 5 USDT to someone on Arbitrum
node cli.mjs transfer --chain arbitrum --token 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 --amount 5 --to 0x123...abc

# Preview fees without executing
node cli.mjs buy --chain arbitrum --token 0x912CE59144191C1204E64559FE8253a0e49E6548 --amount 10 --preview

# List all supported chains
node cli.mjs chains
```

---

## API Reference

All endpoints are served by the backend (`server.mjs`). Authentication via `x-api-key` header when `API_SECRET` is set.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/chains` | List supported chains and primary assets |
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

## License

This project is licensed under the [MIT License](LICENSE).
