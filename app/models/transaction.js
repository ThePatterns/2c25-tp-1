import { query } from '../utils/database/databaseAdapter.js';

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

  static async findById(id) {
    const result = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findAll() {
    const result = await query('SELECT * FROM transactions ORDER BY created_at DESC');
    return result.rows;
  }
}

export default Transaction;
