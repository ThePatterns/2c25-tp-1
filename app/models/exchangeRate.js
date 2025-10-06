import { query } from '../utils/database/databaseAdapter.js';

class ExchangeRate {
  static async findAll() {
    const result = await query('SELECT * FROM exchange_rates');
    return result.rows;
  }

  /**
   * Find exchange rate by currencies
   * @param {string} baseCurrency - Base currency code
   * @param {string} counterCurrency - Counter currency code
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Object|null>} Exchange rate or null if not found
   */
  static async findByCurrencies(baseCurrency, counterCurrency, client) {
    const queryText = 'SELECT * FROM exchange_rates WHERE base_currency = $1 AND counter_currency = $2';
    const values = [baseCurrency, counterCurrency];
    
    const result = client 
      ? await client.query(queryText, values)
      : await query(queryText, values);
      
    return result.rows[0] || null;
  }

  /**
   * Find exchange rate by currencies with FOR UPDATE lock
   * @param {string} baseCurrency - Base currency code
   * @param {string} counterCurrency - Counter currency code
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Object|null>} Exchange rate or null if not found
   */
  static async findByCurrenciesWithLock(baseCurrency, counterCurrency, client = null) {
    const queryText = `
      SELECT * FROM exchange_rates 
      WHERE base_currency = $1 AND counter_currency = $2
      FOR UPDATE`;
    const values = [baseCurrency, counterCurrency];
    
    try {
      const result = client 
        ? await client.query(queryText, values)
        : await query(queryText, values);
        
      if (!result.rows || result.rows.length === 0) {
        throw new Error(`Exchange rate from ${baseCurrency} to ${counterCurrency} not found`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in findByCurrenciesWithLock:', error);
      throw error;
    }
  }

  /**
   * Update an existing exchange rate
   * @param {string} baseCurrency - Base currency code
   * @param {string} counterCurrency - Counter currency code
   * @param {number} newRate - New exchange rate
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Object>} Updated exchange rate
   */
  static async updateRate(baseCurrency, counterCurrency, newRate, client) {
    const queryText = `
      UPDATE exchange_rates 
      SET rate = $3, updated_at = CURRENT_TIMESTAMP 
      WHERE base_currency = $1 AND counter_currency = $2 
      RETURNING *`;
    
    const values = [baseCurrency, counterCurrency, newRate];
    
    const result = client 
      ? await client.query(queryText, values)
      : await query(queryText, values);
      
    if (result.rows.length === 0) {
      throw new Error(`Exchange rate ${baseCurrency}/${counterCurrency} not found for update`);
    }
    
    return result.rows[0];
  }

  /**
   * Create a new exchange rate
   * @param {string} baseCurrency - Base currency code
   * @param {string} counterCurrency - Counter currency code
   * @param {number} rate - Exchange rate
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Object>} Created exchange rate
   */
  static async createRate(baseCurrency, counterCurrency, rate, client) {
    const queryText = `
      INSERT INTO exchange_rates (base_currency, counter_currency, rate)
      VALUES ($1, $2, $3)
      ON CONFLICT (base_currency, counter_currency) 
      DO UPDATE SET rate = EXCLUDED.rate, updated_at = CURRENT_TIMESTAMP
      RETURNING *`;
      
    const values = [baseCurrency, counterCurrency, rate];
    
    const result = client 
      ? await client.query(queryText, values)
      : await query(queryText, values);
      
    return result.rows[0];
  }
}

export default ExchangeRate;
