# Universal Swap — OpenClaw Skill

> Cross-chain token trading skill for [OpenClaw](https://openclaw.ai/) agents.  
> Buy, sell, convert, and transfer any token across 21+ blockchains with natural language.

---

## Overview

This skill enables OpenClaw AI agents to execute cross-chain token trades on behalf of users. It communicates with the UniAgent backend API for transaction creation and routing, while all signing happens locally — private keys never leave the user's machine.

**Supported operations:** Balance lookup · Buy · Sell · Convert · Transfer · History · Preview

---

## Setup

### 1. Start the Backend

The backend must be running before using the skill. See [`backend/`](../../backend/) for configuration.

```bash
cd backend && npm install && node server.mjs
```

### 2. Configure Environment

Add to your OpenClaw config (`~/.openclaw/openclaw.json`):

```json
{
  "skills": {
    "entries": {
      "universal-swap": {
        "enabled": true,
        "env": {
          "UA_PRIVATE_KEY": "your-wallet-private-key",
          "UNIAGENT_API_URL": "http://localhost:3069",
          "UNIAGENT_API_KEY": ""
        }
      }
    }
  }
}
```

Or configure directly in `skills/universal-swap/.env`.

### 3. Install Dependencies

```bash
cd skills/universal-swap && npm install
```

---

## Usage

### As an OpenClaw Agent

Simply talk to your agent:

> "Check my cross-chain balance"  
> "Buy $10 of ARB on Arbitrum"  
> "Sell 0.5 ETH on Base"  
> "Send 50 USDC to 0x... on Polygon"  
> "Convert $100 to SOL on Solana"

### CLI Commands

```bash
node cli.mjs balance
node cli.mjs buy --chain arbitrum --token 0x912...548 --amount 10
node cli.mjs sell --chain base --token 0xabc...def --amount 100
node cli.mjs convert --chain base --asset ETH --amount 0.01
node cli.mjs transfer --chain arbitrum --token 0xFd0...bb9 --amount 5 --to 0x123...abc
node cli.mjs history
node cli.mjs chains
```

Add `--preview` to any trade command to inspect fees before executing.

---

## Supported Chains

Ethereum · BNB Chain · Base · Arbitrum · Avalanche · Optimism · Polygon · Solana · Linea · Sonic · Berachain · Mantle · Monad · Merlin · HyperEVM · Blast · Manta · Mode · Plasma · X Layer · Conflux

---

## How It Works

```
Agent: "Buy $10 of ARB on Arbitrum"
  │
  ├─▶ CLI calls POST /buy on backend
  │     └─▶ Backend creates transaction, returns rootHash
  │
  ├─▶ CLI signs rootHash locally with user's wallet key
  │
  └─▶ CLI calls POST /submit with signature
        └─▶ Backend broadcasts → user receives ARB tokens
```

---

## Configuration

Edit `config.json`:

| Parameter | Default | Description |
|---|---|---|
| `slippageBps` | `100` | Slippage tolerance in basis points (100 = 1%) |
| `universalGas` | `true` | Use PARTI token for gas abstraction |
| `defaultSourceTokens` | `[]` | Restrict source assets (e.g., `["USDC"]`) |
| `preferredChains` | `["arbitrum","base","solana"]` | Preferred chains for routing |

---

## Security

- Private keys are **never transmitted** — signing happens exclusively on the user's machine.
- Always use `--preview` for large trades to verify fees and routing before execution.
- Keep your `.env` file secure and never commit it to version control.

---

## License

MIT

