import { init, exchange, getAccounts } from './exchange.js';

describe('Exchange Concurrency Test', () => {
  beforeAll(async () => {
    await init();
  });

  test('concurrent exchanges reducing USD account by 60000 each', async () => {
    const initialUSDBalance = getAccounts().find(acc => acc.currency === 'USD').balance;
    expect(initialUSDBalance).toBe(60000);

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

    console.log('Result 1:', result1);
    console.log('Result 2:', result2);
    console.log('Final USD balance:', finalUSDBalance);

    // Both should succeed since transfer is mocked to true
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);

    // But balance should be -60000, demonstrating race condition
    expect(finalUSDBalance).toBe(-60000);
  });
});