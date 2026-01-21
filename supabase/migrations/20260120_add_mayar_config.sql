-- Add new app_config keys for payment gateway selection and Mayar settings
INSERT INTO app_config (key, value, description) VALUES
  ('payment_gateway', 'midtrans', 'Active payment gateway: midtrans or mayar'),
  ('mayar_api_url', 'https://api.mayar.club/hl/v1', 'Mayar API Base URL (Staging: api.mayar.club, Production: api.mayar.id)'),
  ('mayar_redirect_url', 'https://digitalsquad.id/payment-success', 'Redirect URL after Mayar payment')
ON CONFLICT (key) DO NOTHING;

-- Add mayar_id column to transactions table for storing Mayar transaction reference
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mayar_id TEXT;

-- Add payment_gateway column to track which gateway was used for each transaction
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'midtrans';

-- Add mayar_payment_url column to store the payment link for pending transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mayar_payment_url TEXT;

-- Create index for faster lookups by mayar_id
CREATE INDEX IF NOT EXISTS idx_transactions_mayar_id ON transactions(mayar_id);
