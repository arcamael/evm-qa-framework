import { createPublicClient, http, defineChain } from 'viem';
import { RPC_URL, ANVIL_CHAIN_ID } from './config';

/** Local Anvil chain definition for viem. */
export const anvilChain = defineChain({
  id: ANVIL_CHAIN_ID,
  name: 'Anvil',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
});

/** A read-only viem client for asserting on-chain state. */
export const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(RPC_URL),
});
