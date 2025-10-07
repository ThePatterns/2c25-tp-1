import express from "express";

import {
  init as exchangeInit,
  getAccounts,
  setAccountBalance,
  getRates,
  setRate,
  getLog,
  exchange,
} from "./exchange.js";
import { withTransaction } from './utils/database/databaseAdapter.js';

await exchangeInit();

const app = express();
const port = 3000;

app.use(express.json());

// ACCOUNT endpoints

app.get("/accounts", (req, res) => {
  res.json(getAccounts());
});

app.put("/accounts/:id/balance", (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  } else {
    setAccountBalance(accountId, balance);

    res.json(getAccounts());
  }
});

// RATE endpoints

app.get("/rates", async (req, res) => {
  let rates = await getRates();
  res.json(rates);
});

app.put("/rates", async (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  await withTransaction(async (client) => {
    await setRate(req.body, client);
  });

  let rates = await getRates();

  res.json(rates);
});

// LOG endpoint

app.get("/log", async (req, res) => {
  let log = await getLog();
  res.json(log);
});

// EXCHANGE endpoint

app.post("/exchange", async (req, res) => {
  const exchangeRequest = req.body;

  try {
    // Wrap the exchange operation in a transaction
    const exchangeResult = await withTransaction(async (client) => {
      return await exchange(exchangeRequest, client);
    });
    
    res.json(exchangeResult);
  } catch (error) {
    console.error('Exchange error:', error);
    res.status(400).json({ error: error.message || 'Exchange failed' });
  }
});

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
