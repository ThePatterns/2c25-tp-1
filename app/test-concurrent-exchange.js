const baseURL = 'http://localhost:5555';

const exchangeRequest = {
  baseCurrency: 'ARS',
  counterCurrency: 'USD',
  baseAccountId: 'client1',
  counterAccountId: 'client2',
  baseAmount: 44117647.05882  // approx for 30000 USD counter amount
};

Promise.all([
  fetch(`${baseURL}/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exchangeRequest)
  }),
  fetch(`${baseURL}/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exchangeRequest)
  })
]).then(async ([res1, res2]) => {
  const result1 = await res1.json();
  const result2 = await res2.json();
  console.log('Exchange 1 result:', result1);
  console.log('Exchange 2 result:', result2);

  const accountsRes = await fetch(`${baseURL}/accounts`);
  const accounts = await accountsRes.json();
  console.log('Final accounts:', accounts);
}).catch(err => console.error('Error:', err));