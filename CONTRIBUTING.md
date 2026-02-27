# Contributing to UniAgent

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your feature or fix

```bash
git checkout -b feat/your-feature-name
```

## Project Structure

```
backend/          → Express API server (Particle Network wrapper)
skills/           → OpenClaw skill definitions
  universal-swap/ → Cross-chain trading CLI
```

## Development Setup

### Backend

```bash
cd backend
cp .env.example .env    # Fill in your Particle Network credentials
npm install
node server.mjs
```

### Skill CLI

```bash
cd skills/universal-swap
cp .env.example .env    # Point to your running backend
npm install
node cli.mjs --help
```

## Code Style

- **ESM modules** — use `import`/`export`, not `require`
- **Descriptive names** — `buildChainMap()` not `bcm()`
- **Error handling** — always catch and return meaningful messages
- **No secrets in code** — everything sensitive goes in `.env`

## Making Changes

1. Keep changes focused — one feature or fix per PR
2. Test your changes against a running backend
3. Update documentation if you add or change commands
4. Update `SKILL.md` if CLI arguments change

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Write a clear PR title and description
3. Reference any related issues
4. PRs require passing CI checks before merge

## Adding New Chains or Assets

If Particle Network adds support for new chains:

1. Update `CHAIN_MAP` in `backend/server.mjs`
2. Update the chains table in `README.md`
3. Update `SKILL.md` supported chains list
4. Test with `node cli.mjs chains`

## Adding New Commands

1. Add the endpoint in `backend/server.mjs`
2. Add the CLI command in `skills/universal-swap/cli.mjs`
3. Document the command in `SKILL.md`
4. Add API docs to the root `README.md`

## Reporting Issues

- Use the **Bug Report** template for bugs
- Use the **Feature Request** template for ideas
- Include reproduction steps, expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
