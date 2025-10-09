import { query } from '../utils/database/databaseAdapter.js';
import { nanoid } from 'nanoid';

class Transaction {
  static async create(transactionData) {
    const {
      id,
      base_account_id,
      counter_account_id,
      base_amount,
      counter_amount,
      exchange_rate,
      status = 'PENDING'
    } = transactionData;

    const result = await query(
      `INSERT INTO transactions 
       (id, base_account_id, counter_account_id, base_amount, counter_amount, exchange_rate, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, base_account_id, counter_account_id, base_amount, counter_amount, exchange_rate, status]
    );
    return result.rows[0];
  }

  static async updateStatus(transactionId, status) {
    const result = await query(
      `UPDATE transactions 
       SET status = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [transactionId, status]
    );
    return result.rows[0];
  }

  static async findById(transactionId) {
    const result = await query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
    return result.rows[0];
  }

  static async recordTransaction(
    baseAccountId,
    counterAccountId,
    baseAmount,
    exchangeRate,
    client
  ) {
    const transactionId = nanoid();
    const counterAmount = baseAmount * exchangeRate;
    
    const queryText = `
      INSERT INTO transactions (
        id,
        base_account_id,
        counter_account_id,
        base_amount,
        counter_amount,
        exchange_rate,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED')
      RETURNING *
    `;

    const queryParams = [
      transactionId,
      baseAccountId,
      counterAccountId,
      baseAmount,
      counterAmount,
      exchangeRate
    ];

    // Use the provided client if in a transaction, otherwise create a new connection
    const result = client 
      ? await client.query(queryText, queryParams)
      : await query(queryText, queryParams);

    return result.rows[0];
  }

  static async findAll() {
    const result = await query('SELECT * FROM transactions ORDER BY created_at DESC');
    return result.rows;
  }
}

export default Transaction;
