import { startAnvil } from './anvil';

export default async function globalSetup() {
  await startAnvil();
}
