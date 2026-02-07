
-- Add new transaction type for tier upgrade
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'tier_upgrade';
