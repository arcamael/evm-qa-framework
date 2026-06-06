import { test, expect } from './support/fixtures';
import { publicClient } from './support/client';
import { walletClient, deployerAccount } from './support/wallet';
import * as artifacts from './support/artifacts';
import { getContract, parseEther } from 'viem';

test.describe('staking transaction lifecycle (Iteration 1b)', () => {
  test('stake: approve then stake, asserting receipt, state delta, and event', async ({
    dex,
  }) => {
    const stakeAmount = parseEther('1000');

    const token = getContract({
      address: dex.dexToken,
      abi: artifacts.dexToken.abi,
      client: walletClient,
    });
    const staking = getContract({
      address: dex.dexStaking,
      abi: artifacts.dexStaking.abi,
      client: walletClient,
    });

    // --- Pre-state: capture balances before staking ---
    const userTokenBefore = (await token.read.balanceOf([
      deployerAccount.address,
    ])) as bigint;
    const stakedBefore = (await staking.read.balanceOf([
      deployerAccount.address,
    ])) as bigint;
    const totalStakedBefore = (await staking.read.totalStaked()) as bigint;

    // --- 1. SUBMIT: approve the staking contract to pull tokens ---
    const approveHash = await token.write.approve([dex.dexStaking, stakeAmount]);
    const approveReceipt = await publicClient.waitForTransactionReceipt({
      hash: approveHash,
    });
    expect(approveReceipt.status).toBe('success');

    // --- 1. SUBMIT: stake ---
    const stakeHash = await staking.write.stake([stakeAmount]);

    // --- 2. RECEIPT: mined successfully ---
    const stakeReceipt = await publicClient.waitForTransactionReceipt({
      hash: stakeHash,
    });
    expect(stakeReceipt.status).toBe('success');

    // --- 3. STATE DELTA: balances changed by exactly stakeAmount ---
    const userTokenAfter = (await token.read.balanceOf([
      deployerAccount.address,
    ])) as bigint;
    const stakedAfter = (await staking.read.balanceOf([
      deployerAccount.address,
    ])) as bigint;
    const totalStakedAfter = (await staking.read.totalStaked()) as bigint;

    expect(userTokenBefore - userTokenAfter).toBe(stakeAmount); // tokens left wallet
    expect(stakedAfter - stakedBefore).toBe(stakeAmount); // recorded as staked
    expect(totalStakedAfter - totalStakedBefore).toBe(stakeAmount); // pool grew

    // --- 4. EVENT: Staked(user, amount) emitted with correct args ---
    const stakedEvents = await publicClient.getContractEvents({
      address: dex.dexStaking,
      abi: artifacts.dexStaking.abi,
      eventName: 'Staked',
      fromBlock: stakeReceipt.blockNumber,
      toBlock: stakeReceipt.blockNumber,
    });
    expect(stakedEvents).toHaveLength(1);
    const ev = stakedEvents[0] as unknown as {
      args: { user: string; amount: bigint };
    };
    expect(ev.args.user.toLowerCase()).toBe(
      deployerAccount.address.toLowerCase(),
    );
    expect(ev.args.amount).toBe(stakeAmount);
  });
});
