import StatsD from 'hot-shots';

const statsd = new StatsD({
  host: process.env.DD_AGENT_HOST || 'localhost',
  port: 8125,
  prefix: 'arvault.',
  tags: {
    service: 'exchange-service',
    env: process.env.DD_ENV || 'development'
  }
});

export function trackVolumeByCurrency(currency, amount, operation) {
  const tags = {
    currency: currency,
    operation: operation
  };
  
  statsd.gauge('volume.by_currency', amount, tags);
  statsd.increment('volume.operations_count', 1, tags);
}

export function trackNetVolume(currency, amount, operation) {
  const netAmount = operation === 'buy' ? amount : -amount;
  const tags = {
    currency: currency,
    operation: operation
  };
  
  statsd.gauge('volume.net', netAmount, tags);
}

export function trackExchangeTransaction(baseCurrency, counterCurrency, baseAmount, counterAmount, success) {
  const tags = {
    base_currency: baseCurrency,
    counter_currency: counterCurrency,
    success: success.toString()
  };
  
  statsd.increment('exchange.transactions', 1, tags);
  statsd.gauge('exchange.base_amount', baseAmount, tags);
  statsd.gauge('exchange.counter_amount', counterAmount, tags);
  
  if (success) {
    statsd.increment('exchange.successful_transactions', 1, tags);
  } else {
    statsd.increment('exchange.failed_transactions', 1, tags);
  }
}

export function trackExchangeRate(baseCurrency, counterCurrency, rate) {
  const tags = {
    base_currency: baseCurrency,
    counter_currency: counterCurrency
  };
  
  statsd.gauge('exchange.rate', rate, tags);
}

export function trackAccountBalance(currency, balance) {
  const tags = {
    currency: currency
  };
  
  statsd.gauge('account.balance', balance, tags);
}

export function trackApiResponseTime(endpoint, method, responseTime, statusCode) {
  const tags = {
    endpoint: endpoint,
    method: method,
    status_code: statusCode.toString()
  };
  
  statsd.timing('api.response_time', responseTime, tags);
  statsd.increment('api.requests', 1, tags);
}

export function trackError(errorType, errorMessage, endpoint) {
  const tags = {
    error_type: errorType,
    endpoint: endpoint || 'unknown'
  };
  
  statsd.increment('errors.count', 1, tags);
  statsd.event('Error occurred', errorMessage, {
    alert_type: 'error',
    ...tags
  });
}

export function trackBusinessMetrics(exchangeResult) {
  const { request, counterAmount, ok } = exchangeResult;
  const { baseCurrency, counterCurrency, baseAmount } = request;
  
  if (ok) {
    trackVolumeByCurrency(baseCurrency, baseAmount, 'sell');
    trackVolumeByCurrency(counterCurrency, counterAmount, 'buy');

    trackNetVolume(baseCurrency, baseAmount, 'sell');
    trackNetVolume(counterCurrency, counterAmount, 'buy');
  }

  trackExchangeTransaction(baseCurrency, counterCurrency, baseAmount, counterAmount, ok);
}

export default statsd;
