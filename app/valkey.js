import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let client;
let accounts = [];
let rates = {};
let log = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function init() {
  client = createClient({ url: process.env.VALKEY_URL });
  await client.connect();

  // Load data from Valkey, fallback to JSON files
  const accStr = await client.get('accounts');
  accounts = accStr ? JSON.parse(accStr) : await loadFromFile('./state/accounts.json');

  const ratStr = await client.get('rates');
  rates = ratStr ? JSON.parse(ratStr) : await loadFromFile('./state/rates.json');

  const logStr = await client.get('log');
  log = logStr ? JSON.parse(logStr) : await loadFromFile('./state/log.json');

  // Schedule periodic saves
  scheduleSave();
}

async function loadFromFile(fileName) {
  const filePath = path.join(__dirname, fileName);
  try {
    const raw = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err);
    return fileName.includes('accounts') || fileName.includes('log') ? [] : {};
  }
}

function scheduleSave() {
  setInterval(async () => {
    await client.set('accounts', JSON.stringify(accounts));
    await client.set('rates', JSON.stringify(rates));
    await client.set('log', JSON.stringify(log));
  }, 1000); // Save every second for simplicity
}

export function getAccounts() {
  return accounts;
}

export function getRates() {
  return rates;
}

export function getLog() {
  return log;
}