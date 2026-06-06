import { publicClient } from './client';

/** Capture full chain state; returns a snapshot id. */
export async function takeSnapshot(): Promise<`0x${string}`> {
  return publicClient.request({
    method: 'evm_snapshot' as any,
    params: [] as any,
  }) as Promise<`0x${string}`>;
}

/**
 * Revert chain to a snapshot id.
 * Note: a snapshot id is consumed on revert and cannot be reused —
 * callers must take a fresh snapshot after reverting.
 */
export async function revertSnapshot(id: `0x${string}`): Promise<boolean> {
  return publicClient.request({
    method: 'evm_revert' as any,
    params: [id] as any,
  }) as Promise<boolean>;
}
