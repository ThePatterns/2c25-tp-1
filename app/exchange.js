import { nanoid } from "nanoid";
import { initDatabase } from "./utils/database/databaseAdapter.js";
import Account from "./models/account.js";
import ExchangeRate from "./models/exchangeRate.js";
import Transaction from "./models/transaction.js";

// Initialize the exchange service
export async function init() {
  try {
    await initDatabase();
    console.log('Exchange service initialized with database');
  } catch (error) {
    console.error('Failed to initialize exchange service:', error);
    throw error;
  }
}

// Returns all internal accounts
export async function getAccounts() {
  return Account.findAll();
}

// Sets balance for an account
export async function setAccountBalance(accountId, balance) {
  return Account.updateBalance(accountId, balance);
}

// Returns all current exchange rates
export async function getRates() {
  return ExchangeRate.findAll();
}

// Returns the whole transaction log
export async function getLog() {
  return Transaction.findAll();
}
/**
 * @returns {Promise<boolean>} True if successful
 * @throws {Error} If required parameters are missing or operation fails
 */
export async function setRate(rateRequest, client) {
  const { baseCurrency, counterCurrency, rate } = rateRequest;

  if (!baseCurrency || !counterCurrency || rate === undefined) {
    throw new Error("Base currency, counter currency, and rate are required");
  }

  try {
    // Check if the rate exists first, using FOR UPDATE lock if in transaction
    const findMethod = client ? ExchangeRate.findByCurrenciesWithLock : ExchangeRate.findByCurrencies;
    const existingRate = await findMethod(baseCurrency, counterCurrency, client);
    
    // Update or create the rate
    if (existingRate) {
      await ExchangeRate.updateRate(baseCurrency, counterCurrency, rate, client);
    } else {
      await ExchangeRate.createRate(baseCurrency, counterCurrency, rate, client);
    }

    // Update reciprocal rate if it's a different currency pair
    if (baseCurrency !== counterCurrency) {
      try {
        const reciprocalRate = 1 / rate;
        const reciprocalExists = await findMethod(counterCurrency, baseCurrency, client);
        
        if (reciprocalExists) {
          await ExchangeRate.updateRate(counterCurrency, baseCurrency, reciprocalRate, client);
        } else {
          await ExchangeRate.createRate(counterCurrency, baseCurrency, reciprocalRate, client);
        }
      } catch (error) {
        console.warn(`Could not update reciprocal rate for ${counterCurrency}/${baseCurrency}:`, error);
        // Re-throw if we're in a transaction to ensure rollback
        if (client) throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in setRate:', error);
    throw error;
  }
}

/**
 * Executes an atomic exchange operation between accounts
 * @param {Object} exchangeRequest - The exchange request object
 * @param {Object} [client] - Optional database client for transactions
 * @returns {Promise<Object>} The exchange result
 */
export async function exchange(exchangeRequest, client) {
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId: clientBaseAccountId,
    counterAccountId: clientCounterAccountId,
    baseAmount,
  } = exchangeRequest;

  if (!baseCurrency || !counterCurrency || !clientBaseAccountId || !clientCounterAccountId || baseAmount === undefined) {
    throw new Error('Missing required fields in exchange request');
  }

  if (baseAmount <= 0) {
    throw new Error('Base amount must be positive');
  }

  // Get the exchange rate with lock if in transaction
  const rate = await ExchangeRate.findByCurrenciesWithLock(baseCurrency, counterCurrency, client);
  if (!rate) {
    throw new Error(`No exchange rate available for ${baseCurrency} to ${counterCurrency}`);
  }
  
  const exchangeRate = rate.rate;
  const counterAmount = baseAmount * exchangeRate;

  // Find our internal accounts for the currencies
  const baseAccount = await Account.findByCurrencyWithLock(baseCurrency, client);
  const counterAccount = await Account.findByCurrencyWithLock(counterCurrency, client);

  // Construct the result object
  const exchangeResult = {
    id: nanoid(),
    ts: new Date(),
    ok: false,
    request: exchangeRequest,
    exchangeRate: exchangeRate,
    counterAmount: 0.0,
    obs: null,
  };

  try {
    // Check if we have enough funds in the counter account
    if (counterAccount.balance < counterAmount) {
      exchangeResult.obs = "Not enough funds on counter currency account";
      return exchangeResult;
    }

    // Simulate both transfers
    await simulateTransfer();
    await simulateTransfer();
    
    // Perform the exchange in a single transaction
    // 1. Transfer from client's account to our account (base currency)
    if (clientBaseAccountId !== baseAccount.id) {
      await Account.transferFunds(
        clientBaseAccountId,  // from: client's account
        baseAccount.id,       // to: our account
        baseAmount,           // amount
        client               // transaction client
      );
    }

    // 2. Transfer from our account to client's account (counter currency)
    if (counterAccount.id !== clientCounterAccountId) {
      await Account.transferFunds(
        counterAccount.id,      // from: our account
        clientCounterAccountId, // to: client's account
        counterAmount,          // amount
        client                 // transaction client
      );
    }

    // Record the transaction
    await Transaction.recordTransaction(
      clientBaseAccountId,
      clientCounterAccountId,
      baseAmount,
      baseCurrency,
      counterCurrency,
      exchangeRate,
      client
    );

    // Update the result for success
    exchangeResult.ok = true;
    exchangeResult.counterAmount = counterAmount;
    
    return exchangeResult;
    
  } catch (error) {
    console.error('Exchange failed:', error);
    exchangeResult.obs = error.message || 'Exchange operation failed';
    return exchangeResult;
  }
}

/**
 * Simulates a transfer with a random delay between 200-400ms
 * @param {string} fromAccountId - Source account ID
 * @param {string} toAccountId - Destination account ID
 * @param {number} amount - Amount to transfer
 * @returns {Promise<boolean>} Always resolves to true after delay
 */
async function simulateTransfer() {
  const min = 200;  // Minimum delay in ms
  const max = 400;   // Maximum delay in ms
  const delay = Math.random() * (max - min) + min;
  
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), delay);
  });
}
