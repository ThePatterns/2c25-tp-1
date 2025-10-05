import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'exchange-service',
    env: process.env.DD_ENV || 'development',
    version: '1.0.0'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export function logRequest(req, res, responseTime) {
  const logData = {
    type: 'http_request',
    method: req.method,
    url: req.url,
    path: req.path,
    status_code: res.statusCode,
    response_time: responseTime,
    user_agent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    request_id: req.headers['x-request-id'] || 'unknown'
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request with error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
}

export function logExchangeTransaction(exchangeResult, requestData) {
  const { request, counterAmount, ok, id, ts, obs } = exchangeResult;
  const { baseCurrency, counterCurrency, baseAccountId, counterAccountId, baseAmount } = request;

  const logData = {
    type: 'exchange_transaction',
    transaction_id: id,
    timestamp: ts,
    success: ok,
    base_currency: baseCurrency,
    counter_currency: counterCurrency,
    base_account_id: baseAccountId,
    counter_account_id: counterAccountId,
    base_amount: baseAmount,
    counter_amount: counterAmount,
    exchange_rate: exchangeResult.exchangeRate,
    error_message: obs
  };

  if (ok) {
    logger.info('Exchange transaction successful', logData);
  } else {
    logger.error('Exchange transaction failed', logData);
  }
}

export function logValidationError(errorType, message, endpoint, requestData) {
  const logData = {
    type: 'validation_error',
    error_type: errorType,
    message: message,
    endpoint: endpoint,
    request_data: requestData
  };

  logger.warn('Validation error', logData);
}

export function logSystemError(error, context = {}) {
  const logData = {
    type: 'system_error',
    error_message: error.message,
    error_stack: error.stack,
    error_name: error.name,
    context: context
  };

  logger.error('System error', logData);
}

export function logBusinessMetrics(metrics) {
  const logData = {
    type: 'business_metrics',
    metrics: metrics
  };

  logger.info('Business metrics', logData);
}

export function logConfigurationChange(changeType, data) {
  const logData = {
    type: 'configuration_change',
    change_type: changeType,
    data: data
  };

  logger.info('Configuration change', logData);
}

export function logSecurityEvent(eventType, details) {
  const logData = {
    type: 'security_event',
    event_type: eventType,
    details: details,
    severity: 'high'
  };

  logger.warn('Security event', logData);
}

export function logPerformance(operation, duration, metadata = {}) {
  const logData = {
    type: 'performance',
    operation: operation,
    duration: duration,
    metadata: metadata
  };

  if (duration > 1000) {
    logger.warn('Slow operation', logData);
  } else {
    logger.info('Operation completed', logData);
  }
}

export function logLifecycleEvent(event, details = {}) {
  const logData = {
    type: 'lifecycle',
    event: event,
    details: details
  };

  logger.info(`Application ${event}`, logData);
}

export default logger;
