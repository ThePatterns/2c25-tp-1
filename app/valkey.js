import { createClient } from 'redis';

let client;

export async function init() {
  client = createClient({ url: process.env.VALKEY_URL });
  await client.connect();
}

export async function getAccounts() {
  const data = await client.hGetAll('accounts');
  return Object.values(data).map(s => JSON.parse(s));
}

export async function getRates() {
  const str = await client.get('rates');
  return str ? JSON.parse(str) : {};
}

export async function getLog() {
  const logs = await client.lRange('log', 0, -1);
  return logs.map(s => JSON.parse(s));
}

export async function setAccounts(data) {
  for (const account of data) {
    await client.hSet('accounts', account.id, JSON.stringify(account));
  }
}

export async function getAccount(accountId) {
  const str = await client.hGet('accounts', accountId);
  return str ? JSON.parse(str) : null;
}

export async function setAccount(accountId, account) {
  await client.hSet('accounts', accountId, JSON.stringify(account));
}

export async function setRates(data) {
  await client.set('rates', JSON.stringify(data));
}

export async function setLog(data) {
  await client.set('log', JSON.stringify(data));
}

export async function appendLog(entry) {
  await client.rPush('log', JSON.stringify(entry));
}