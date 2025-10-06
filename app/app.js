import express from "express";
import { init as exchangeInit, getAccounts, setAccountBalance, getRates, setRate, getLog, exchange } from "./exchange.js";
import { withTransaction } from './utils/database/databaseAdapter.js';

const app = express();
const port = process.env.PORT || 3000;

// Initialize the exchange service
let server;
try {
  await exchangeInit();
  console.log('Exchange service initialized successfully');
  
  server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

app.use(express.json());

// ACCOUNT endpoints
// No requiere atomicidad
// Testeada
app.get("/accounts", async (req, res) => {
  try {
    const accounts = await getAccounts();
    res.json(accounts);
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({ error: 'Failed to retrieve accounts' });
  }
});

// Atomicidad implementada porque actualiza el saldo de una cuenta. 
// Sin atomicidad, podrían perderse actualizaciones.
// Testeada
app.put("/accounts/:id/balance", async (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;

  if (!accountId || balance === undefined) {
    return res.status(400).json({ error: "Account ID and balance are required" });
  }

  try {
    // unica operación de actualización atómica en su implementación
    await setAccountBalance(accountId, balance);
    const accounts = await getAccounts();

    res.json(accounts);
  } catch (error) {
    console.error('Error updating account balance:', error);
    res.status(500).json({ error: 'Failed to update account balance' });
  }
});

// RATE endpoints
// No requiere atomicidad, solo es lectura
app.get("/rates", async (req, res) => {
  try {
    const rates = await getRates();
    res.json(rates);
  } catch (error) {
    console.error('Error getting rates:', error);
    res.status(500).json({ error: 'Failed to retrieve exchange rates' });
  }
});

// Atomicidad implementada usando withTransactionporque actualiza tasas de cambio y sus recíprocas. 
// Debe ser atómico para mantener consistencia entre pares de divisas
app.put("/rates", async (req, res) => { 
  try {
    // Usar withTransaction para asegurar atomicidad
    await withTransaction(async (client) => {
      await setRate(req.body, client);
    });
    
    // Obtener las tasas actualizadas después de la transacción exitosa
    const rates = await getRates();
    res.json(rates);
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    res.status(500).json({ 
      error: 'Failed to update exchange rate',
      details: error.message 
    });
  }
});

// LOG endpoint

// No requiere atomicidad
app.get("/log", async (req, res) => {
  try {
    const log = await getLog();
    res.json(log);
  } catch (error) {
    console.error('Error getting transaction log:', error);
    res.status(500).json({ error: 'Failed to retrieve transaction log' });
  }
});

// EXCHANGE endpoint
// FIXME: Revisar implementación que está devolviendo siempre false
// Atomicidad implementada porque realiza múltiples operaciones: actualizar saldo de cuenta origen y destino
// y registrar la transacción. Estas deben de suceder en su totalidad o no sin ser interrumpidas.
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
});

export default app;
