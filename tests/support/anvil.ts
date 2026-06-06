import { spawn, type ChildProcess } from 'node:child_process';
import { ANVIL_PORT, RPC_URL } from './config';

let anvilProcess: ChildProcess | undefined;

/** Poll the RPC endpoint until Anvil responds or we time out. */
async function waitForAnvil(timeoutMs = 10_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_chainId',
          params: [],
        }),
      });
      if (res.ok) return;
    } catch {
      // not up yet — keep polling
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Anvil did not become ready within ${timeoutMs}ms`);
}

export async function startAnvil(): Promise<void> {
  anvilProcess = spawn('anvil', ['--port', String(ANVIL_PORT)], {
    stdio: 'ignore',
  });
  anvilProcess.on('error', (err) => {
    throw new Error(`Failed to spawn anvil: ${err.message}`);
  });
  await waitForAnvil();
}

export async function stopAnvil(): Promise<void> {
  if (anvilProcess) {
    anvilProcess.kill('SIGTERM');
    anvilProcess = undefined;
  }
}
