import { init, exchange, getAccounts } from './exchange.js';

async function testConcurrency() {
  await init();

  const initialUSDBalance = getAccounts().find(acc => acc.currency === 'USD').balance;
  console.log('Initial USD balance:', initialUSDBalance);

  // Each exchange: ARS to USD, baseAmount such that counterAmount = 60000
  const rate = 0.00068;
  const baseAmount = 60000 / rate; // 88235294.11764706

  const exchangeRequest1 = {
    baseCurrency: 'ARS',
    counterCurrency: 'USD',
    baseAccountId: 'client-ars-1',
    counterAccountId: 'client-usd-1',
    baseAmount: baseAmount
  };

  const exchangeRequest2 = {
    baseCurrency: 'ARS',
    counterCurrency: 'USD',
    baseAccountId: 'client-ars-2',
    counterAccountId: 'client-usd-2',
    baseAmount: baseAmount
  };

  // Run both exchanges concurrently
  const [result1, result2] = await Promise.all([
    exchange(exchangeRequest1),
    exchange(exchangeRequest2)
  ]);

  const finalUSDBalance = getAccounts().find(acc => acc.currency === 'USD').balance;

  console.log('Result 1:', result1.ok, result1.obs);
  console.log('Result 2:', result2.ok, result2.obs);
  console.log('Final USD balance:', finalUSDBalance);

  if (finalUSDBalance === -60000) {
    console.log('Test passed: Race condition detected, balance went negative.');
  } else {
    console.log('Test failed: Unexpected balance.');
  }
}

testConcurrency();
