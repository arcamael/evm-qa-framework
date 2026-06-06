import { test, expect } from '@playwright/test';
import { publicClient } from './support/client';
import { ANVIL_CHAIN_ID } from './support/config';

test.describe('chain connectivity (Iteration 1a)', () => {
  test('reports the expected Anvil chain id', async () => {
    const chainId = await publicClient.getChainId();
    expect(chainId).toBe(ANVIL_CHAIN_ID);
  });

  test('is producing/has blocks (block number is readable)', async () => {
    const blockNumber = await publicClient.getBlockNumber();
    expect(blockNumber).toBeGreaterThanOrEqual(0n);
  });

  test('deployer account has a funded ETH balance', async () => {
    const balance = await publicClient.getBalance({
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    });
    // Anvil funds default accounts with 10,000 ETH.
    expect(balance).toBeGreaterThan(0n);
  });
});
