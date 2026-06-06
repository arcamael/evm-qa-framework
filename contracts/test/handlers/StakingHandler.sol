// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DexToken} from "../../src/DexToken.sol";
import {DexStaking} from "../../src/DexStaking.sol";

/// @notice Drives DexStaking with bounded, sensible random actions so
///         invariant fuzzing explores meaningful states (not just reverts).
contract StakingHandler is Test {
    DexToken internal stakeToken;
    DexStaking internal staking;

    address[] internal actors;
    uint256 internal constant MAX_ACTION = 100_000 ether;

    /// Sum of all tokens this handler has staked minus withdrawn.
    /// The invariant test cross-checks this against on-chain state.
    uint256 public ghost_netStaked;

    constructor(DexToken _stakeToken, DexStaking _staking, address[] memory _actors) {
        stakeToken = _stakeToken;
        staking = _staking;
        actors = _actors;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function stake(uint256 actorSeed, uint256 amount) public {
        address actor = _actor(actorSeed);
        amount = bound(amount, 1, MAX_ACTION);
        if (stakeToken.balanceOf(actor) < amount) return;

        vm.startPrank(actor);
        stakeToken.approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();

        ghost_netStaked += amount;
    }

    function withdraw(uint256 actorSeed, uint256 amount) public {
        address actor = _actor(actorSeed);
        uint256 staked = staking.balanceOf(actor);
        if (staked == 0) return;
        amount = bound(amount, 1, staked);

        vm.prank(actor);
        staking.withdraw(amount);

        ghost_netStaked -= amount;
    }

    function claim(uint256 actorSeed) public {
        address actor = _actor(actorSeed);
        // Claims may revert when accrued rewards exceed the contract's
        // remaining reward funding (solvency guard in DexStaking). Under
        // aggressive time-warping this is expected; Foundry discards the
        // reverting calls. See ADR-0003.
        vm.prank(actor);
        staking.claimReward();
    }

    function advanceTime(uint256 dt) public {
        dt = bound(dt, 1, 7 days);
        vm.warp(block.timestamp + dt);
    }
}
