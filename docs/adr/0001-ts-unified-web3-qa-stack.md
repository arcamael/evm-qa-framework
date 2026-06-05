# ADR-0001: TypeScript-unified Web3 QA stack

- **Status:** Accepted
- **Date:** 2026-06-06

## Context

This repository is a QA automation framework targeting EVM / Web3 products
(chain functionality, wallets, bridges, RPC, smart contracts). Web3 QA spans
multiple layers, and the best tool genuinely differs per layer. Two coherent
stacks were considered:

- **Option 1 — TS-unified:** Playwright/Synpress + viem + Foundry/Anvil, with
  TypeScript orchestrating every QA layer and Solidity confined to the
  contract layer.
- **Option 2 — Python-core hybrid:** pytest + web3.py for RPC/API, Foundry for
  contracts, with Playwright/Synpress bolted on only for wallet E2E.

## Decision

Adopt **Option 1 (TS-unified)**.

## Rationale

- **Synpress is the de-facto wallet E2E tool** and is Playwright-native; there
  is no comparable Python equivalent. The wallet layer is a named requirement,
  so it anchors the language choice toward TypeScript.
- **One orchestration language** across UI, wallet, RPC, and API yields a more
  coherent, deeper artifact than a polyglot mix of comparable breadth.
- **viem** is the modern TypeScript EVM client.
- **Agentic tooling** (Claude Code, Playwright MCP) is most mature in the TS
  ecosystem, reinforcing the framework's agentic-first positioning.
- **Solidity is retained** for contract-level tests via Foundry, honoring the
  EVM scope without fragmenting the QA layer.

## Consequences

- Python (a "nice-to-have") is not the primary language. A thin web3.py module
  may be added later purely as a signal, behind its own ADR if it grows.
- The framework carries TypeScript + Solidity. Foundry/Anvil is a required
  dependency for the local chain and contract tests.
- Wallet E2E depends on Synpress + MetaMask; its setup is isolated in its own
  iteration to de-risk.
