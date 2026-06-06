// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DexToken} from "../src/DexToken.sol";
import {RewardToken} from "../src/RewardToken.sol";
import {DexStaking} from "../src/DexStaking.sol";
import {StakingHandler} from "./handlers/StakingHandler.sol";

contract DexStakingInvariants is Test {
    DexToken internal stakeToken;
    RewardToken internal rewardToken;
    DexStaking internal staking;
    StakingHandler internal handler;

    uint256 internal constant SUPPLY = 1_000_000_000 ether;
    uint256 internal constant REWARD_FUND = 1_000_000 ether;
    uint256 internal constant REWARD_RATE = 1 ether;

    function setUp() public {
        stakeToken = new DexToken(SUPPLY);
        rewardToken = new RewardToken(SUPPLY);
        staking = new DexStaking(
            address(stakeToken),
            address(rewardToken),
            REWARD_RATE
        );
        assertTrue(rewardToken.transfer(address(staking), REWARD_FUND));

        // Three funded actors.
        address[] memory actors = new address[](3);
        actors[0] = makeAddr("alice");
        actors[1] = makeAddr("bob");
        actors[2] = makeAddr("carol");
        for (uint256 i = 0; i < actors.length; i++) {
            assertTrue(stakeToken.transfer(actors[i], 1_000_000 ether));
        }

        handler = new StakingHandler(stakeToken, staking, actors);

        // Foundry will call random handler functions in random sequences.
        targetContract(address(handler));
    }

    /// The contract's staking-token balance must always equal totalStaked.
    /// (No tokens created or destroyed by staking accounting.)
    function invariant_contractBalanceMatchesTotalStaked() public view {
        assertEq(
            stakeToken.balanceOf(address(staking)),
            staking.totalStaked(),
            "contract balance == totalStaked"
        );
    }

    /// totalStaked must equal the handler's net staked (stakes - withdrawals).
    function invariant_totalStakedMatchesGhost() public view {
        assertEq(
            staking.totalStaked(),
            handler.ghost_netStaked(),
            "totalStaked == net staked via handler"
        );
    }

    /// The staking contract must never pay out more rewards than it was funded.
    function invariant_rewardSolvency() public view {
        assertLe(
            rewardToken.balanceOf(address(staking)),
            REWARD_FUND,
            "reward balance never exceeds funding"
        );
    }
}
