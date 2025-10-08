import { createClient } from 'redis';

let client;

export async function init() {
  client = createClient({ url: process.env.VALKEY_URL });
  await client.connect();
}

export async function getAccounts() {
  const str = await client.get('accounts');
  return str ? JSON.parse(str) : [];
}

export async function getRates() {
  const str = await client.get('rates');
  return str ? JSON.parse(str) : {};
}

export async function getLog() {
  const str = await client.get('log');
  return str ? JSON.parse(str) : [];
}

export async function setAccounts(data) {
  await client.set('accounts', JSON.stringify(data));
}

export async function setRates(data) {
  await client.set('rates', JSON.stringify(data));
}

export async function setLog(data) {
  await client.set('log', JSON.stringify(data));
}