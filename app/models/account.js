import { query } from '../utils/database/databaseAdapter.js';

class Account {
  static async findAll() {
    const result = await query('SELECT * FROM accounts');
    return result.rows;
  }

  /**
   * Find account by ID
   * @param {string} id - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Object|null>} Account or null if not found
   */
  static async findById(id, client = null) {
    const queryText = 'SELECT * FROM accounts WHERE id = $1';
    const values = [id];
    
    try {
      const result = client 
        ? await client.query(queryText, values)
        : await query(queryText, values);
        
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  /**
   * Find account by currency
   * @param {string} currency - Currency code
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Object|null>} Account or null if not found
   */
  static async findByCurrency(currency, client = null) {
    const queryText = 'SELECT * FROM accounts WHERE currency = $1';
    const values = [currency];
    
    try {
      const result = client 
        ? await client.query(queryText, values)
        : await query(queryText, values);
        
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in findByCurrency:', error);
      throw error;
    }
  }

  static async findByCurrencyWithLock(currency, client = null) {
    const queryText = 'SELECT * FROM accounts WHERE currency = $1 FOR UPDATE';
    const values = [currency];
    
    try {
      // Use the provided client if in a transaction, otherwise use the default query function
      const result = client 
        ? await client.query(queryText, values)
        : await query(queryText, values);
        
      if (!result.rows || result.rows.length === 0) {
        throw new Error(`Account with currency ${currency} not found`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in findByCurrencyWithLock:', error);
      throw error;
    }
  }
  
  /**
   * Update account balance
   * @param {string} id - Account ID
   * @param {number} newBalance - New balance
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Object>} Updated account
   */
  static async updateBalance(id, newBalance, client = null) {
    const queryText = `
      UPDATE accounts 
      SET balance = $1, 
          updated_at = NOW() 
      WHERE id = $2 
      RETURNING *`;
    const values = [newBalance, id];

    try {
      const result = client
        ? await client.query(queryText, values)
        : await query(queryText, values);

      if (result.rows.length === 0) {
        throw new Error('Account not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in updateBalance:', error);
      throw error;
    }
  }
}

export default Account;
