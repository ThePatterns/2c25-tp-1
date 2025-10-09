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

import {
  logRequest,
  logExchangeTransaction,
  logValidationError,
  logSystemError,
  logConfigurationChange,
  logLifecycleEvent,
  logPerformance
} from "./logger.js";

await exchangeInit();

const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    trackApiResponseTime(req.path, req.method, responseTime, res.statusCode);
    logRequest(req, res, responseTime);
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
    const errorMsg = 'Malformed request for account balance update';
    trackError('validation_error', errorMsg, '/accounts/:id/balance');
    logValidationError('validation_error', errorMsg, '/accounts/:id/balance', req.body);
    return res.status(400).json({ error: "Malformed request" });
  } else {
    const startTime = Date.now();
    setAccountBalance(accountId, balance);

    const accounts = getAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      trackAccountBalance(account.currency, balance);
      logConfigurationChange('account_balance_update', {
        account_id: accountId,
        currency: account.currency,
        new_balance: balance,
        old_balance: account.balance
      });
    }

    logPerformance('account_balance_update', Date.now() - startTime, { account_id: accountId });
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
    const errorMsg = 'Malformed request for rate update';
    trackError('validation_error', errorMsg, '/rates');
    logValidationError('validation_error', errorMsg, '/rates', req.body);
    return res.status(400).json({ error: "Malformed request" });
  }

  const startTime = Date.now();
  const newRateRequest = { ...req.body };
  setRate(newRateRequest);

  trackExchangeRate(baseCurrency, counterCurrency, rate);
  logConfigurationChange('exchange_rate_update', {
    base_currency: baseCurrency,
    counter_currency: counterCurrency,
    new_rate: rate
  });

  logPerformance('rate_update', Date.now() - startTime, { 
    base_currency: baseCurrency, 
    counter_currency: counterCurrency 
  });
  
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
    const errorMsg = 'Malformed request for exchange operation';
    trackError('validation_error', errorMsg, '/exchange');
    logValidationError('validation_error', errorMsg, '/exchange', req.body);
    return res.status(400).json({ error: "Malformed request" });
  }

  const exchangeRequest = { ...req.body };
  const startTime = Date.now();
  
  try {
    const exchangeResult = await exchange(exchangeRequest);
    
    trackBusinessMetrics(exchangeResult);
    logExchangeTransaction(exchangeResult, exchangeRequest);
    
    if (exchangeResult.ok) {
      logPerformance('exchange_transaction', Date.now() - startTime, {
        base_currency: baseCurrency,
        counter_currency: counterCurrency,
        amount: baseAmount
      });
      res.status(200).json(exchangeResult);
    } else {
      const errorMsg = exchangeResult.obs || 'Exchange operation failed';
      trackError('exchange_failed', errorMsg, '/exchange');
      logSystemError(new Error(errorMsg), { 
        exchange_request: exchangeRequest,
        exchange_result: exchangeResult 
      });
      res.status(500).json(exchangeResult);
    }
  } catch (error) {
    trackError('exchange_error', error.message, '/exchange');
    logSystemError(error, { 
      exchange_request: exchangeRequest,
      operation: 'exchange_transaction'
    });
    res.status(500).json({ error: "Internal server error", ok: false });
  }
});

app.listen(port, () => {
  console.log(`Exchange API listening on port ${port}`);
  logLifecycleEvent('startup', {
    port: port,
    environment: process.env.DD_ENV || 'development',
    tracing_enabled: TRACING_ENABLED
  });
});

export default app;
