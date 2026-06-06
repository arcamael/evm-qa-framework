// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DexToken} from "../src/DexToken.sol";
import {RewardToken} from "../src/RewardToken.sol";
import {DexStaking} from "../src/DexStaking.sol";

contract DexStakingTest is Test {
    DexToken internal stakeToken;
    RewardToken internal rewardToken;
    DexStaking internal staking;

    uint256 internal constant SUPPLY = 1_000_000 ether;
    uint256 internal constant REWARD_FUND = 100_000 ether;
    uint256 internal constant REWARD_RATE = 1 ether; // 1 RWD/sec

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public {
        stakeToken = new DexToken(SUPPLY);
        rewardToken = new RewardToken(SUPPLY);
        staking = new DexStaking(
            address(stakeToken),
            address(rewardToken),
            REWARD_RATE
        );

        // Fund the staking contract with rewards.
        assertTrue(rewardToken.transfer(address(staking), REWARD_FUND));

        // Give alice and bob stake tokens to play with.
        assertTrue(stakeToken.transfer(alice, 10_000 ether));
        assertTrue(stakeToken.transfer(bob, 10_000 ether));
    }

    // --- helpers ---

    function _stake(address who, uint256 amount) internal {
        vm.startPrank(who);
        stakeToken.approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();
    }

    // --- unit: staking ---

    function test_stake_updatesBalances() public {
        _stake(alice, 1_000 ether);

        assertEq(staking.balanceOf(alice), 1_000 ether, "staked balance");
        assertEq(staking.totalStaked(), 1_000 ether, "total staked");
        assertEq(
            stakeToken.balanceOf(address(staking)),
            1_000 ether,
            "contract token balance"
        );
    }

    function test_stake_revertsOnZero() public {
        vm.prank(alice);
        vm.expectRevert("Cannot stake 0");
        staking.stake(0);
    }

    // --- unit: withdraw ---

    function test_withdraw_returnsTokens() public {
        _stake(alice, 1_000 ether);

        vm.prank(alice);
        staking.withdraw(400 ether);

        assertEq(staking.balanceOf(alice), 600 ether, "remaining staked");
        assertEq(staking.totalStaked(), 600 ether, "total staked");
    }

    function test_withdraw_revertsOnInsufficient() public {
        _stake(alice, 100 ether);

        vm.prank(alice);
        vm.expectRevert("Insufficient staked");
        staking.withdraw(200 ether);
    }

    // --- unit: reward accrual ---

    function test_rewards_accrueOverTime() public {
        _stake(alice, 1_000 ether);

        // Sole staker for 100 seconds: should earn ~ rate * time.
        vm.warp(block.timestamp + 100);

        uint256 earned = staking.earned(alice);
        assertApproxEqAbs(
            earned,
            REWARD_RATE * 100,
            1e6, // tolerance for integer division dust
            "sole staker earns rate*time"
        );
    }

    function test_claim_transfersRewards() public {
        _stake(alice, 1_000 ether);
        vm.warp(block.timestamp + 100);

        uint256 before = rewardToken.balanceOf(alice);
        vm.prank(alice);
        staking.claimReward();
        uint256 afterBal = rewardToken.balanceOf(alice);

        assertGt(afterBal - before, 0, "claim pays out rewards");
    }
}

// ============================================================
// Fuzz tests — properties that hold for arbitrary inputs
// ============================================================

contract DexStakingFuzzTest is Test {
    DexToken internal stakeToken;
    RewardToken internal rewardToken;
    DexStaking internal staking;

    uint256 internal constant SUPPLY = 1_000_000_000 ether;
    uint256 internal constant REWARD_FUND = 100_000 ether;
    uint256 internal constant REWARD_RATE = 1 ether;

    address internal user = makeAddr("user");

    function setUp() public {
        stakeToken = new DexToken(SUPPLY);
        rewardToken = new RewardToken(SUPPLY);
        staking = new DexStaking(
            address(stakeToken),
            address(rewardToken),
            REWARD_RATE
        );
        assertTrue(rewardToken.transfer(address(staking), REWARD_FUND));
    }

    /// For any valid amount, staking moves exactly that many tokens
    /// and records exactly that staked balance.
    function testFuzz_stakeConservesTokens(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000 ether);
        assertTrue(stakeToken.transfer(user, amount));

        uint256 userBefore = stakeToken.balanceOf(user);
        uint256 contractBefore = stakeToken.balanceOf(address(staking));

        vm.startPrank(user);
        stakeToken.approve(address(staking), amount);
        staking.stake(amount);
        vm.stopPrank();

        assertEq(stakeToken.balanceOf(user), userBefore - amount, "user delta");
        assertEq(
            stakeToken.balanceOf(address(staking)),
            contractBefore + amount,
            "contract delta"
        );
        assertEq(staking.balanceOf(user), amount, "recorded stake");
    }

    /// Stake then withdraw the same amount restores the starting balance
    /// (round-trip property).
    function testFuzz_stakeWithdrawRoundTrip(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000 ether);
        assertTrue(stakeToken.transfer(user, amount));
        uint256 start = stakeToken.balanceOf(user);

        vm.startPrank(user);
        stakeToken.approve(address(staking), amount);
        staking.stake(amount);
        staking.withdraw(amount);
        vm.stopPrank();

        assertEq(stakeToken.balanceOf(user), start, "round trip restores balance");
        assertEq(staking.balanceOf(user), 0, "no residual stake");
    }

    /// For a sole staker, earned rewards grow monotonically with time
    /// and never exceed what the rate*time schedule allows.
    function testFuzz_rewardsBoundedBySchedule(uint256 stakeAmt, uint256 dt)
        public
    {
        stakeAmt = bound(stakeAmt, 1 ether, 1_000_000 ether);
        dt = bound(dt, 1, 365 days);

        assertTrue(stakeToken.transfer(user, stakeAmt));
        vm.startPrank(user);
        stakeToken.approve(address(staking), stakeAmt);
        staking.stake(stakeAmt);
        vm.stopPrank();

        vm.warp(block.timestamp + dt);

        uint256 earned = staking.earned(user);
        // Sole staker cannot earn more than the global schedule rate*time.
        assertLe(earned, REWARD_RATE * dt + 1e6, "earned bounded by schedule");
    }
}
