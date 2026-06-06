# Brief: write docs/ARCHITECTURE.md

You are documenting THIS repository's architecture. Read the actual code
before writing — do not invent. Files to read first:
- CLAUDE.md, docs/adr/0001-ts-unified-web3-qa-stack.md
- package.json, tsconfig.json, playwright.config.ts, .github/workflows/ci.yml
- contracts/src/*.sol, contracts/foundry.toml
- tests/support/*.ts (config, anvil, client, wallet, artifacts, deploy,
  snapshot, fixtures, global-setup, global-teardown)
- tests/*.spec.ts

Produce docs/ARCHITECTURE.md (~2-3 pages) with these sections:

1. Overview — what this framework is (a QA automation framework for a DEX
   on an EVM chain) and its guiding principle (engineering value is in the
   test architecture; the SUT is deliberately minimal).
2. System-under-test (SUT) — the three contracts and how they relate
   (DexToken stake, RewardToken reward, DexStaking = Synthetix accumulator).
3. Layered architecture — walk the layers bottom-up: local chain (Anvil),
   chain lifecycle (global setup/teardown + readiness poll), clients
   (viem public + wallet), artifacts/ABI loading, deploy helper,
   test isolation (snapshot/revert fixture), test specs.
4. Test isolation deep-dive — explain evm_snapshot/evm_revert, deploy-once,
   why a snapshot id is consumed on revert (must re-snapshot).
5. Key design decisions — reference ADR-0001 (TS-unified stack); explain
   pretest forge build (no ABI drift), tsc --noEmit gate, slimmed browser
   matrix, CI ordering (build before type-check).
6. CI pipeline — the GitHub Actions steps and why they're ordered that way.
7. How to run — prerequisites (Node, pnpm, Foundry) and `pnpm test`.

Constraints:
- Accurate to the actual code. If unsure, inspect the file, don't guess.
- Include ONE diagram as a Mermaid flowchart showing the layers and the
  flow of a test run (chain spawn -> deploy -> snapshot -> test -> revert).
- Prose over bullet-spam; a senior reviewer is the audience.
- Do not overstate; the SUT is minimal by design — say so.
