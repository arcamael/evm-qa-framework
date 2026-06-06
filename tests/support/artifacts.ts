import dexTokenArtifact from '../../contracts/out/DexToken.sol/DexToken.json' with { type: 'json' };
import rewardTokenArtifact from '../../contracts/out/RewardToken.sol/RewardToken.json' with { type: 'json' };
import dexStakingArtifact from '../../contracts/out/DexStaking.sol/DexStaking.json' with { type: 'json' };
import type { Abi, Hex } from 'viem';

interface Artifact {
  abi: Abi;
  bytecode: Hex;
}

/** Normalize a Foundry artifact into the { abi, bytecode } shape viem expects. */
function normalize(raw: {
  abi: unknown;
  bytecode: { object: string };
}): Artifact {
  return {
    abi: raw.abi as Abi,
    bytecode: raw.bytecode.object as Hex,
  };
}

export const dexToken = normalize(dexTokenArtifact);
export const rewardToken = normalize(rewardTokenArtifact);
export const dexStaking = normalize(dexStakingArtifact);
