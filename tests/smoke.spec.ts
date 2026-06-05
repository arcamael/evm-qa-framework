import { test, expect } from '@playwright/test';

test('harness smoke: runner executes and assertions work', async () => {
  expect(1 + 1).toBe(2);
});
