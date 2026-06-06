import { publicClient } from './client';
import { walletClient, deployerAccount } from './wallet';
import * as artifacts from './artifacts';
import { parseEther, getContract, type Address } from 'viem';

export interface DeployedDex {
  dexToken: Address;
  rewardToken: Address;
  dexStaking: Address;
}

/**
 * Deploys the full DEX SUT to the connected chain and wires it:
 * mirrors the manual cast choreography (deploy x3 -> fund rewards).
 *
 * Returns the deployed contract addresses.
 */
export async function deployDex(): Promise<DeployedDex> {
  const initialSupply = parseEther('1000000'); // 1,000,000 tokens (18 decimals)

  // 1. Deploy DexToken (forge create DexToken --constructor-args ...)
  const dexTokenHash = await walletClient.deployContract({
    abi: artifacts.dexToken.abi,
    bytecode: artifacts.dexToken.bytecode,
    args: [initialSupply],
  });
  const dexTokenAddr = (
    await publicClient.waitForTransactionReceipt({ hash: dexTokenHash })
  ).contractAddress!;

  // 2. Deploy RewardToken
  const rewardTokenHash = await walletClient.deployContract({
    abi: artifacts.rewardToken.abi,
    bytecode: artifacts.rewardToken.bytecode,
    args: [initialSupply],
  });
  const rewardTokenAddr = (
    await publicClient.waitForTransactionReceipt({ hash: rewardTokenHash })
  ).contractAddress!;

  // 3. Deploy DexStaking(stakingToken, rewardToken, rewardRate)
  const rewardRate = parseEther('1'); // 1 RWD/sec across all stakers
  const dexStakingHash = await walletClient.deployContract({
    abi: artifacts.dexStaking.abi,
    bytecode: artifacts.dexStaking.bytecode,
    args: [dexTokenAddr, rewardTokenAddr, rewardRate],
  });
  const dexStakingAddr = (
    await publicClient.waitForTransactionReceipt({ hash: dexStakingHash })
  ).contractAddress!;

  // 4. Fund the staking contract with reward tokens
  //    (cast send RewardToken "transfer(address,uint256)" DexStaking ...)
  const reward = getContract({
    address: rewardTokenAddr,
    abi: artifacts.rewardToken.abi,
    client: walletClient,
  });
  const fundHash = await reward.write.transfer([
    dexStakingAddr,
    parseEther('100000'),
  ]);
  await publicClient.waitForTransactionReceipt({ hash: fundHash });

  return {
    dexToken: dexTokenAddr,
    rewardToken: rewardTokenAddr,
    dexStaking: dexStakingAddr,
  };
}
