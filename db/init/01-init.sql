-- Crear la tabla de cuentas
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(255) PRIMARY KEY,
    currency VARCHAR(3) NOT NULL,
    balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

-- Crear la tabla de tasas de cambio
CREATE TABLE IF NOT EXISTS exchange_rates (
    base_currency VARCHAR(3) NOT NULL,
    counter_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(20, 8) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (base_currency, counter_currency)
);

-- Crear la tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(255) PRIMARY KEY,
    base_account_id VARCHAR(255) NOT NULL,
    counter_account_id VARCHAR(255) NOT NULL,
    base_amount DECIMAL(20, 8) NOT NULL,
    counter_amount DECIMAL(20, 8) NOT NULL,
    exchange_rate DECIMAL(20, 8) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (counter_account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Insertar datos iniciales de cuentas
INSERT INTO accounts (id, currency, balance) VALUES 
    ('1', 'ARS', 120000000.00),
    ('2', 'USD', 60000.00),
    ('3', 'EUR', 40000.00),
    ('4', 'BRL', 60000.00)
ON CONFLICT (id) DO NOTHING;

-- Insertar tasas de cambio iniciales
-- Tasas ARS
INSERT INTO exchange_rates (base_currency, counter_currency, rate) VALUES 
    ('ARS', 'BRL', 0.00360),
    ('ARS', 'EUR', 0.00057),
    ('ARS', 'USD', 0.00068),
    -- Tasas BRL
    ('BRL', 'ARS', 277.30),
    -- Tasas EUR
    ('EUR', 'ARS', 1741.00),
    -- Tasas USD
    ('USD', 'ARS', 1469.00)
ON CONFLICT (base_currency, counter_currency) 
DO UPDATE SET rate = EXCLUDED.rate;
