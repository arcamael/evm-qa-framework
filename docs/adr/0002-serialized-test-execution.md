# ADR-0002: Serialized test execution (single worker)

- **Status:** Accepted
- **Date:** 2026-06-07

## Context

Tests share a single Anvil chain spawned in Playwright's `globalSetup`.
Isolation between tests relies on `evm_snapshot` / `evm_revert`, which
operate on **global chain state**. Playwright workers are separate
processes, and per-test deploy/snapshot bookkeeping lives in module-level
state that is therefore per-worker, not shared.

With `fullyParallel: true` and multiple workers, two workers running
deploy-and-snapshot tests against the same chain would corrupt each
other's state: one worker's `evm_revert` rolls back the shared chain
underneath another worker, and duplicate deploys advance nonces
unexpectedly. This is currently latent (only one spec performs
deploy/snapshot), but would surface as intermittent, order-dependent
failures as soon as a second such spec is added.

## Decision

Run tests with `workers: 1` in all environments.

## Rationale

- Snapshot/revert isolation is only sound on a single shared chain when
  access is serialized.
- The suite is chain-bound, not CPU-bound, so single-worker execution is
  an acceptable performance trade today.
- Simple and bulletproof; no risk of heisenbugs.

## Consequences

- No parallel speedup as the suite grows.
- `fullyParallel: true` is retained (harmless with one worker) so the
  config is ready if parallelism is reintroduced.

## Future work (Option B)

To regain parallelism, give **each worker its own Anvil instance** on a
per-worker port (e.g. `8545 + testInfo.workerIndex`), moving chain spawn
from `globalSetup` into a worker-scoped fixture. Each worker then has a
fully isolated chain, making snapshot/revert safe under parallelism.
This is deferred until suite runtime justifies the added complexity, and
will be recorded in its own ADR when implemented.
