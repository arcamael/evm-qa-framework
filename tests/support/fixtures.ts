import { test as base } from '@playwright/test';
import { deployDex, type DeployedDex } from './deploy';
import { takeSnapshot, revertSnapshot } from './snapshot';

// Deploy only once across the suite; each test reverts to this clean state.
let deployed: DeployedDex | undefined;
let cleanSnapshotId: `0x${string}` | undefined;

export const test = base.extend<{ dex: DeployedDex }>({
  dex: async ({}, use) => {
    // One-time deploy + initial clean snapshot.
    if (!deployed) {
      deployed = await deployDex();
      cleanSnapshotId = await takeSnapshot();
    }

    // Run the test against the deployed system.
    await use(deployed);

    // Revert to the clean post-deploy state, then re-snapshot
    // (revert consumes the id, so the next test needs a fresh one).
    if (cleanSnapshotId) {
      await revertSnapshot(cleanSnapshotId);
      cleanSnapshotId = await takeSnapshot();
    }
  },
});

export { expect } from '@playwright/test';
