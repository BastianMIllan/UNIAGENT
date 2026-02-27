# Universal Swap — OpenClaw Skill

> Cross-chain token trading skill for [OpenClaw](https://openclaw.ai/) agents.  
> Buy, sell, convert, and transfer any token across 21+ blockchains with natural language.

---

## Overview

This skill enables OpenClaw AI agents to execute cross-chain token trades on behalf of users. It communicates with the UniAgent backend API for transaction creation and routing, while all signing happens locally — private keys never leave the user's machine.

**Supported operations:** Init · Status · Balance · Buy · Sell · Convert · Transfer · History · Preview

---

## How It Works

The user installs this skill in OpenClaw. The agent reads the SKILL.md and knows what to do. The user never touches a terminal.

### Prerequisites (operator-side)

The UniAgent backend must be running. See [`backend/`](../../backend/) for configuration.

```bash
cd backend && npm install && node server.mjs
```

Then install the skill dependencies:

```bash
cd skills/universal-swap && npm install
```

### What Happens When a User Installs the Skill

1. **User installs the skill** in OpenClaw
2. **User asks anything trading-related** ("set up my account", "buy SOL", "check balance")
3. **Agent runs `init` automatically** — generates wallet, creates Universal Account, returns deposit addresses
4. **Agent tells the user** where to send USDC to fund the account
5. **User sends funds**, agent confirms with `balance`
6. **Agent handles all trading** from natural language — user never sees CLI commands

### OpenClaw Config (Alternative)

For advanced users who want to bring their own wallet:

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

---

## User Experience

The user just talks to their agent:

> "Set up my trading account"  
> "Check my balance"  
> "Buy $10 of ARB on Arbitrum"  
> "Sell 0.5 ETH on Base"  
> "Send 50 USDC to 0x... on Polygon"  

The agent reads the SKILL.md, translates the request, and runs the right command. The user never sees the CLI.

### CLI Reference (for agents and developers)

```bash
# Setup (agent runs these automatically on first use)
node cli.mjs init                           # Generate wallet + create Universal Account
node cli.mjs status                         # Diagnostic check (backend, wallet, funds)

# Trading (agent translates natural language → these commands)
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
User installs skill → Agent reads SKILL.md
  │
  ├─▶ First use: agent runs init
  │     ├─▶ Generate wallet → save to .env
  │     ├─▶ Call /init → get deposit addresses
  │     └─▶ Tell user: "Send USDC to 0x... to start trading"
  │
  ├─▶ User funds account
  │
  └─▶ Agent handles trading:
        User: "Buy $10 of ARB on Arbitrum"
          ├─▶ CLI calls POST /buy → gets rootHash
          ├─▶ CLI signs locally (key never leaves machine)
          └─▶ CLI submits → backend broadcasts → done
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

