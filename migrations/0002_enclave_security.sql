-- Migration: Remove encrypted keys, add enclave session tracking
-- Date: 2026-01-03
-- Description: Updates session_accounts table for enclave-based key management

-- Step 1: Add new session_account_id column (unique identifier for enclave lookups)
ALTER TABLE session_accounts
  ADD COLUMN IF NOT EXISTS session_account_id TEXT UNIQUE;

-- Step 2: Remove encrypted_private_key column (keys now stored only in enclave memory)
ALTER TABLE session_accounts
  DROP COLUMN IF EXISTS encrypted_private_key;

-- Step 3: Clean up existing sessions (they used old encrypted key approach)
-- You may want to back these up first if needed
DELETE FROM session_accounts WHERE session_account_id IS NULL;

-- Step 4: Ensure deploy_params is NOT NULL (required for smart account creation)
ALTER TABLE session_accounts
  ALTER COLUMN deploy_params SET NOT NULL;

-- Step 5: Make session_account_id NOT NULL
ALTER TABLE session_accounts
  ALTER COLUMN session_account_id SET NOT NULL;

-- Verify final schema:
-- \d session_accounts

-- Expected schema after migration:
-- session_accounts:
--   id                 SERIAL PRIMARY KEY
--   session_account_id TEXT NOT NULL UNIQUE
--   address            TEXT NOT NULL UNIQUE
--   user_address       TEXT NOT NULL
--   adapter_id         TEXT NOT NULL
--   deploy_params      JSONB NOT NULL
--   created_at         TIMESTAMP NOT NULL DEFAULT NOW()
