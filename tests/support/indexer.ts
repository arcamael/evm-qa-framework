import { Client } from 'pg';

/**
 * Minimal off-chain "indexer" schema + helpers.
 *
 * In a real system, an indexer service watches the chain and writes
 * observed events into a database that the app queries. These helpers
 * stand in for that indexer so reconciliation tests can compare the
 * off-chain record against on-chain truth.
 */

/** Create the staking_events table (idempotent). */
export async function initSchema(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS staking_events (
      id            SERIAL PRIMARY KEY,
      staker        TEXT        NOT NULL,
      amount        NUMERIC(78, 0) NOT NULL,
      block_number  BIGINT      NOT NULL,
      tx_hash       TEXT        NOT NULL UNIQUE
    );
  `);
}

/** Record an observed stake event (what the indexer would do). */
export async function indexStakeEvent(
  client: Client,
  ev: { staker: string; amount: bigint; blockNumber: bigint; txHash: string },
): Promise<void> {
  await client.query(
    `INSERT INTO staking_events (staker, amount, block_number, tx_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tx_hash) DO NOTHING`,
    [
      ev.staker.toLowerCase(),
      ev.amount.toString(),
      ev.blockNumber.toString(),
      ev.txHash,
    ],
  );
}

/** Sum of all indexed stake amounts (the off-chain view of total staked). */
export async function sumIndexedStakes(client: Client): Promise<bigint> {
  const res = await client.query(
    `SELECT COALESCE(SUM(amount), 0)::TEXT AS total FROM staking_events`,
  );
  return BigInt(res.rows[0].total);
}
