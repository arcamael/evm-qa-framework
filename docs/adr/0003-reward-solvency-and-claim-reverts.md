# ADR-0003: Reward solvency and expected claim reverts under fuzzing

- **Status:** Accepted
- **Date:** 2026-06-07

## Context

The invariant suite drives `DexStaking` with random call sequences,
including `advanceTime` jumps of up to 7 days, repeated tens of thousands
of times. With `rewardRate = 1 RWD/sec` and the staking contract funded
with a fixed amount of reward tokens, accrued rewards quickly exceed the
contract's reward balance over long simulated time spans.

A probe confirmed this: after 30 simulated days a sole staker accrues
~2,592,000 RWD against a 1,000,000 RWD funding. `claimReward()` then fails
at `rewardToken.transfer(...)` with "reward transfer failed".

This caused ~89% of `claim` calls to revert during invariant runs.

## Decision

Treat these claim reverts as **expected, correct behavior**, not a defect.

## Rationale

- The contract refusing to transfer more reward tokens than it holds is a
  solvency guarantee, not a bug. It is precisely what
  `invariant_rewardSolvency` asserts must always hold.
- Foundry discards reverting calls and continues exploring state, so the
  reverts do not weaken the invariant coverage (96k+ non-reverting calls
  still exercise the system per run).
- Artificially funding the contract with unbounded rewards to avoid the
  reverts would hide the very solvency property worth testing.

## Consequences

- The invariant handler's `claim` is left unguarded but documented; reverts
  under extreme time-warping are accepted.
- A future enhancement could add a reward-replenishment mechanism (e.g. a
  `notifyRewardAmount`-style top-up, as in the full Synthetix design) and a
  corresponding invariant that claims always succeed while solvent. Deferred
  as out of scope for the minimal SUT.
