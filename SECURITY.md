# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in UniAgent, **please do not open a public issue.**

Instead, email **ricketh137@gmail.com** with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will acknowledge your report within 48 hours and work with you to understand and address the issue before any public disclosure.

## Security Design

- **Private keys never leave the client** — the backend never sees or stores wallet private keys
- **Particle Network credentials are backend-only** — the skill CLI has no access to API keys
- **API key authentication** — all backend endpoints require a valid `x-api-key` header
- **Transaction signing is local** — the skill signs `rootHash` values locally with ethers.js
- **No credential storage** — pending transactions are held in memory with a 5-minute TTL

## Best Practices for Operators

- Set a strong, random `API_SECRET` in your backend `.env`
- Run the backend behind HTTPS in production
- Rotate your Particle Network credentials periodically
- Never commit `.env` files (they are `.gitignore`d by default)
