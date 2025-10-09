import fs from 'fs';
import { createClient } from 'redis';

const client = createClient({
  url: process.env.VALKEY_URL
});

await client.connect();

const exists = await client.exists('accounts');
if (exists) {
  console.log('Data already exists in Redis, skipping seed');
  await client.disconnect();
  process.exit(0);
}

const accounts = JSON.parse(fs.readFileSync('./state/accounts.json', 'utf8'));
const log = JSON.parse(fs.readFileSync('./state/log.json', 'utf8'));
const rates = fs.readFileSync('./state/rates.json', 'utf8');

for (const account of accounts) {
  await client.hSet('accounts', account.id, JSON.stringify(account));
}
for (const entry of log) {
  await client.rPush('log', JSON.stringify(entry));
}
await client.set('rates', rates);

await client.disconnect();

console.log('Seeded Redis with state data');