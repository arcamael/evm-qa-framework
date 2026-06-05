# CLAUDE.md

Guidance for AI agents (Claude Code, etc.) working in this repository.

## What this repo is

A **QA automation framework for a decentralized exchange (DEX)** on an EVM
chain, built as a portfolio piece demonstrating senior SDET practice: on-chain
testing, wallet E2E, API/RPC, SQL reconciliation, performance, and CI/CD — all
driven agentically.

The exchange is the **system under test (SUT)**: an EVM chain plus a minimal set
of contracts (token, swap/stake, later a bridge) and a thin dApp UI. The SUT is
**deliberately minimal and built from standard, audited components
(e.g. OpenZeppelin)** — the engineering value lives in the **test
architecture**, not the SUT. Do not expand the SUT beyond what a given test
slice requires.

## Locked tech stack (do not substitute without an ADR)

- Language: **TypeScript** (ESM)
- Test runner / E2E: **Playwright**
- Wallet E2E: **Synpress**
- RPC / chain assertions: **viem**
- Local chain: **Anvil** (Foundry)
- Contract-level tests: **Foundry** (Solidity)
- Load: **k6**
- Package manager: **pnpm**
- CI: **GitHub Actions**

## Working conventions

- **Agile, vertical slices.** Every change ends in a runnable, CI-green state.
  No half-built horizontal layers that do nothing until a later step.
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).
- **One PR per iteration**; keep diffs reviewable.
- **ADRs** in `docs/adr/` record any architectural or stack decision.
- Prefer clarity over cleverness; tests are read more than written.

## Guardrails

- Do not commit secrets, seed phrases, or private keys. Test wallets only,
  local chains only. Never point tests at mainnet with real funds.
- Do not introduce a new language or major dependency without an ADR.
- Keep the SUT minimal; if a test needs more SUT, build the smallest piece.
- Ask before destructive or irreversible actions.

## Current state

Iteration 0 — workbench: repo, Playwright + TS, smoke test, CI, this file.
