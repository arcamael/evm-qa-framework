# ADR-0002: Serialized execution now, per-worker isolation for external services

- **Status:** Accepted
- **Date:** 2026-06-07 (updated for Iteration 3)

## Context

The test suite depends on external services that hold mutable state:

- **Anvil** (local EVM chain) — shared, spawned once in Playwright's
  `globalSetup`. Test isolation uses `evm_snapshot` / `evm_revert`, which
  operate on **global chain state**.
- **Postgres** (off-chain indexer store, Iteration 3) — provisioned via
  Testcontainers.

Playwright workers are separate processes. Any state shared across workers
that is reset mid-test (a global `evm_revert`, a `TRUNCATE`) can be clobbered
by a concurrent worker, producing intermittent, order-dependent failures.

## Decision

1. **Run tests with `workers: 1` in all environments** for now, so shared
   global state (the single Anvil chain) is accessed serially and
   snapshot/revert isolation is sound.
2. **Adopt per-worker isolation as the standing model for external
   services.** Each backing service should be isolatable per worker so the
   suite can scale to parallel execution without shared-state hazards.

## Rationale

- Snapshot/revert on a single shared chain is only safe when serialized.
- Postgres (Iteration 3) already follows the target model: each test file
  provisions its **own** Testcontainers Postgres instance (the container is
  the isolation boundary), so it is parallel-ready by construction.
- Establishing one isolation principle across services keeps the
  architecture coherent: every external dependency is per-worker-isolated.

## Consequences

- No parallel speedup today (single worker), but `fullyParallel: true` is
  retained so the config is ready when parallelism is enabled.
- Postgres is already per-worker-isolatable; Anvil is not yet.

## Future work

To enable parallelism, give **each worker its own Anvil instance** on a
per-worker port (e.g. `8545 + testInfo.workerIndex`), moving chain spawn
from `globalSetup` into a worker-scoped fixture — mirroring the per-instance
model Postgres already uses. The Postgres container helper should likewise
key off the worker index when multi-worker is enabled. Both are deferred
until suite runtime justifies the added complexity.
