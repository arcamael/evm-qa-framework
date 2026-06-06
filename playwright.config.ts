import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for the EVM QA framework.
 * See https://playwright.dev/docs/test-configuration.
 *
 * Iteration 1 tests are RPC-level (viem against a local Anvil chain),
 * so there is no browser project yet. Browser projects (for Synpress
 * wallet E2E) are added in Iteration 4.
 */
export default defineConfig({
  testDir: './tests',
  /* Spin a local Anvil chain up/down around the whole suite. */
  globalSetup: './tests/support/global-setup.ts',
  globalTeardown: './tests/support/global-teardown.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Single worker: tests share one Anvil chain and use global evm_revert,
     which is not safe across parallel worker processes. See ADR-0002. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  use: {
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
  },

  /* Chain-level tests (no browser). Browser projects return in Iteration 4. */
  projects: [
    {
      name: 'chain',
    },
  ],
});
