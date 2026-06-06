import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvilChain } from './client';
import { RPC_URL, DEPLOYER } from './config';

/** Anvil account #0 as a viem account (signs transactions). */
export const deployerAccount = privateKeyToAccount(DEPLOYER.privateKey);

/** A wallet client that signs and sends transactions as the deployer. */
export const walletClient = createWalletClient({
  account: deployerAccount,
  chain: anvilChain,
  transport: http(RPC_URL),
});
