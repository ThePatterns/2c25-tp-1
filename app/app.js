const TRACING_ENABLED = process.env.DD_TRACING_ENABLED === 'true' || process.env.DD_ENABLED === 'true';

if (TRACING_ENABLED) {
  const tracer = (await import('dd-trace')).default;
  tracer.init();
}

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

import {
  trackApiResponseTime,
  trackError,
  trackBusinessMetrics,
  trackExchangeRate,
  trackAccountBalance
} from "./metrics.js";

await exchangeInit();

const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    trackApiResponseTime(req.path, req.method, responseTime, res.statusCode);
  });
  
  next();
});

// ACCOUNT endpoints

app.get("/accounts", (req, res) => {
  res.json(getAccounts());
});

app.put("/accounts/:id/balance", (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;

  if (!accountId || !balance) {
    trackError('validation_error', 'Malformed request for account balance update', '/accounts/:id/balance');
    return res.status(400).json({ error: "Malformed request" });
  } else {
    setAccountBalance(accountId, balance);

    const accounts = getAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      trackAccountBalance(account.currency, balance);
    }

    res.json(accounts);
  }
});

// RATE endpoints

app.get("/rates", (req, res) => {
  res.json(getRates());
});

app.put("/rates", (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  if (!baseCurrency || !counterCurrency || !rate) {
    trackError('validation_error', 'Malformed request for rate update', '/rates');
    return res.status(400).json({ error: "Malformed request" });
  }

  const newRateRequest = { ...req.body };
  setRate(newRateRequest);

  trackExchangeRate(baseCurrency, counterCurrency, rate);

  res.json(getRates());
});

// LOG endpoint

app.get("/log", (req, res) => {
  res.json(getLog());
});

// EXCHANGE endpoint

app.post("/exchange", async (req, res) => {
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId,
    counterAccountId,
    baseAmount,
  } = req.body;

  if (
    !baseCurrency ||
    !counterCurrency ||
    !baseAccountId ||
    !counterAccountId ||
    !baseAmount
  ) {
    trackError('validation_error', 'Malformed request for exchange operation', '/exchange');
    return res.status(400).json({ error: "Malformed request" });
  }

  const exchangeRequest = { ...req.body };
  
  try {
    const exchangeResult = await exchange(exchangeRequest);
    
    trackBusinessMetrics(exchangeResult);
    
    if (exchangeResult.ok) {
      res.status(200).json(exchangeResult);
    } else {
      trackError('exchange_failed', exchangeResult.obs || 'Exchange operation failed', '/exchange');
      res.status(500).json(exchangeResult);
    }
  } catch (error) {
    trackError('exchange_error', error.message, '/exchange');
    res.status(500).json({ error: "Internal server error", ok: false });
  }
});

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
