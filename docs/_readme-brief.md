# Brief: write README.md (root) — portfolio pitch

Audience: a senior QA lead / hiring manager skimming this repo from a job
application, across multiple Web3 / crypto QA roles. They have ~30 seconds
to decide if it's impressive. Lead with value, not setup.

Read these before writing (do not invent — inspect):
- CLAUDE.md, docs/ARCHITECTURE.md, docs/adr/*.md
- package.json, playwright.config.ts, .github/workflows/ci.yml
- contracts/src/*.sol, contracts/test/**
- tests/*.spec.ts, tests/support/*.ts

Produce README.md at repo root with this structure:

1. **Title + one-line tagline** — what it is in a single sentence
   (a QA automation framework for EVM/Web3 products, testing a DEX at
   every layer). Role-agnostic — do NOT name any specific company.
2. **Badges** — placeholders for: CI status, license. Use the GitHub
   Actions badge URL pattern for this repo (owner: arcamael).
3. **What this demonstrates** — a short, scannable list of the testing
   surfaces, each one line: contract-level (Foundry unit/fuzz/invariant),
   transaction lifecycle (viem), JSON-RPC API contract, on-chain/off-chain
   SQL reconciliation (Testcontainers). Frame as capabilities, not a diary.
4. **Architecture at a glance** — embed the Mermaid diagram from
   docs/ARCHITECTURE.md (the test-run flow). Link to ARCHITECTURE.md for depth.
5. **Highlights worth a closer look** — 3-4 bullets pointing to the most
   impressive specifics with file links: handler-based invariants with a
   ghost variable; snapshot/revert isolation; reconciliation drift/missing-
   event detection; the documented solvency finding (ADR-0003).
6. **Tech stack** — concise table or list: TypeScript, Playwright, viem,
   Foundry/Anvil, Testcontainers/Postgres, k6 (planned), GitHub Actions.
7. **Quickstart** — prerequisites (Node via .nvmrc, pnpm, Foundry, Docker)
   and `pnpm test`. Mention Docker is required for the reconciliation tests.
8. **Engineering approach** — a short paragraph on the deliberate practices:
   ADRs for decisions, per-worker isolation model, type-check + CI gates,
   and an AI-assisted-but-reviewed workflow (Claude Code directed via briefs,
   output reviewed — point to docs/_architecture-brief.md as evidence).
9. **Project status / roadmap** — honest: what's done (iterations 0-3) and
   what's planned (wallet E2E via Synpress, k6 performance, observability).
   Frame planned items as roadmap, not gaps.

Constraints:
- Accurate to the actual code. Verify file paths exist before linking.
- Concise and scannable — a reviewer skims. Prose where it adds, lists where
  they help. No fluff, no overstatement, no emoji-spam.
- The SUT is deliberately minimal — say so; the value is the test architecture.
- Role-agnostic: NEVER name a specific employer.
- A screenshot of `pnpm test` output will be added manually — leave a clearly
  marked placeholder (e.g. an image link with a TODO comment) where it should go.
