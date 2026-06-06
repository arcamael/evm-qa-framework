import { test, expect } from './support/fixtures';
import { publicClient } from './support/client';
import { walletClient, deployerAccount } from './support/wallet';
import * as artifacts from './support/artifacts';
import { getContract, parseEther, isHex, type Hex } from 'viem';
import { ANVIL_CHAIN_ID } from './support/config';

test.describe('JSON-RPC API contract (Iteration 3a)', () => {
  test('eth_chainId returns the expected chain id as a hex quantity', async () => {
    const raw = (await publicClient.request({
      method: 'eth_chainId',
    })) as Hex;
    expect(isHex(raw)).toBe(true);
    expect(Number(BigInt(raw))).toBe(ANVIL_CHAIN_ID);
  });

  test('eth_getBalance returns a non-zero balance for a funded account', async ({
    dex,
  }) => {
    void dex; // ensure chain is deployed/ready
    const raw = (await publicClient.request({
      method: 'eth_getBalance',
      params: [deployerAccount.address, 'latest'],
    })) as Hex;
    expect(isHex(raw)).toBe(true);
    expect(BigInt(raw)).toBeGreaterThan(0n);
  });

  test('eth_blockNumber advances after a transaction is mined', async ({
    dex,
  }) => {
    const before = await publicClient.getBlockNumber({ cacheTime: 0 });

    // Produce a block by sending a real transaction.
    const token = getContract({
      address: dex.dexToken,
      abi: artifacts.dexToken.abi,
      client: walletClient,
    });
    const hash = await token.write.transfer([
      deployerAccount.address,
      parseEther('1'),
    ]);
    await publicClient.waitForTransactionReceipt({ hash });

    const after = await publicClient.getBlockNumber({ cacheTime: 0 });
    expect(after).toBeGreaterThan(before);
  });

  test('eth_getTransactionReceipt returns a well-formed receipt', async ({
    dex,
  }) => {
    const token = getContract({
      address: dex.dexToken,
      abi: artifacts.dexToken.abi,
      client: walletClient,
    });
    const hash = await token.write.transfer([
      deployerAccount.address,
      parseEther('1'),
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Contract: a successful receipt has the expected fields and shape.
    expect(receipt.transactionHash).toBe(hash);
    expect(receipt.status).toBe('success');
    expect(receipt.blockNumber).toBeGreaterThan(0n);
    expect(receipt.from.toLowerCase()).toBe(
      deployerAccount.address.toLowerCase(),
    );
    expect(receipt.gasUsed).toBeGreaterThan(0n);
  });

  test('eth_call reads contract state without a transaction', async ({
    dex,
  }) => {
    // name() via eth_call should return the token name, no tx, no gas spent.
    const name = await publicClient.readContract({
      address: dex.dexToken,
      abi: artifacts.dexToken.abi,
      functionName: 'name',
    });
    expect(name).toBe('Dex Token');
  });

  test('invalid params are rejected (negative API contract)', async () => {
    // eth_getBalance with a malformed address must error, not silently pass.
    await expect(
      publicClient.request({
        method: 'eth_getBalance',
        params: ['0xnot_an_address' as Hex, 'latest'],
      }),
    ).rejects.toThrow();
  });
});
