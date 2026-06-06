/**
 * Central test configuration.
 * Anvil exposes deterministic accounts and a fixed RPC endpoint,
 * which makes these safe to hardcode for local/CI testing.
 */
export const ANVIL_PORT = 8545;
export const RPC_URL = `http://127.0.0.1:${ANVIL_PORT}`;
export const ANVIL_CHAIN_ID = 31337;

/** Anvil's well-known test account #0 (publicly known key — local testing only). */
export const DEPLOYER = {
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  privateKey:
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
} as const;

/**
 * Deterministic deploy addresses on a fresh Anvil chain,
 * given the deploy order DexToken -> RewardToken -> DexStaking.
 */
export const CONTRACTS = {
  dexToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  rewardToken: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  dexStaking: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
} as const;
