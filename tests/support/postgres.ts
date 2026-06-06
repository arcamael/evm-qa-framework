import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

let container: StartedPostgreSqlContainer | undefined;

/**
 * Start a disposable Postgres container and return a connected client.
 * Each call yields an isolated database — the container itself is the
 * isolation boundary, which is what makes this parallel-ready: under
 * multiple workers, each worker spins up its own container (see ADR-0002).
 */
export async function startPostgres(): Promise<{
  client: Client;
  connectionUri: string;
}> {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const connectionUri = container.getConnectionUri();

  const client = new Client({ connectionString: connectionUri });
  await client.connect();

  return { client, connectionUri };
}

export async function stopPostgres(client?: Client): Promise<void> {
  if (client) {
    await client.end();
  }
  if (container) {
    await container.stop();
    container = undefined;
  }
}
