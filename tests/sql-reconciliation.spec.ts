import { test, expect } from './support/fixtures';
import { publicClient } from './support/client';
import { walletClient, deployerAccount } from './support/wallet';
import * as artifacts from './support/artifacts';
import { getContract, parseEther } from 'viem';
import { Client } from 'pg';
import { startPostgres, stopPostgres } from './support/postgres';
import {
  initSchema,
  indexStakeEvent,
  sumIndexedStakes,
} from './support/indexer';

let pg: Client;

test.beforeAll(async () => {
  const started = await startPostgres();
  pg = started.client;
  await initSchema(pg);
});

test.afterAll(async () => {
  await stopPostgres(pg);
});

test.beforeEach(async () => {
  // Reset the off-chain store so each test starts from a clean indexer.
  await pg.query('TRUNCATE staking_events RESTART IDENTITY');
});

test.describe('on-chain vs off-chain reconciliation (Iteration 3b)', () => {

  test('happy path: indexed total matches on-chain totalStaked', async ({
    dex,
  }) => {
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

    const amount = parseEther('1000');
    await token.write.approve([dex.dexStaking, amount]);
    const stakeHash = await staking.write.stake([amount]);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: stakeHash,
    });

    // Read the Staked event and index it (what an indexer would do).
    const events = await publicClient.getContractEvents({
      address: dex.dexStaking,
      abi: artifacts.dexStaking.abi,
      eventName: 'Staked',
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
    });
    expect(events).toHaveLength(1);
    const ev = events[0] as unknown as {
      args: { user: string; amount: bigint };
    };
    await indexStakeEvent(pg, {
      staker: ev.args.user,
      amount: ev.args.amount,
      blockNumber: receipt.blockNumber,
      txHash: stakeHash,
    });

    // Reconcile: off-chain sum must equal on-chain totalStaked.
    const onChainTotal = (await staking.read.totalStaked()) as bigint;
    const offChainTotal = await sumIndexedStakes(pg);
    expect(offChainTotal).toBe(onChainTotal);
  });

  test('drift detection: a wrong indexed amount is caught by reconciliation', async ({
    dex,
  }) => {
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

    const amount = parseEther('1000');
    await token.write.approve([dex.dexStaking, amount]);
    const stakeHash = await staking.write.stake([amount]);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: stakeHash,
    });

    // Simulate an indexer BUG: record the wrong amount (e.g. dropped a digit).
    await indexStakeEvent(pg, {
      staker: deployerAccount.address,
      amount: parseEther('100'), // WRONG: should be 1000
      blockNumber: receipt.blockNumber,
      txHash: stakeHash,
    });

    const onChainTotal = (await staking.read.totalStaked()) as bigint;
    const offChainTotal = await sumIndexedStakes(pg);

    // Reconciliation MUST catch the mismatch.
    expect(offChainTotal).not.toBe(onChainTotal);
  });

  test('missing event detection: unindexed stake leaves off-chain short', async ({
    dex,
  }) => {
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

    const amount = parseEther('500');
    await token.write.approve([dex.dexStaking, amount]);
    await staking.write.stake([amount]);
    // Deliberately do NOT index the event (simulate indexer downtime).

    const onChainTotal = (await staking.read.totalStaked()) as bigint;
    const offChainTotal = await sumIndexedStakes(pg);

    // Off-chain should lag behind on-chain truth.
    expect(offChainTotal).toBeLessThan(onChainTotal);
    expect(offChainTotal).toBe(0n);
  });
});
