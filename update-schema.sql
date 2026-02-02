-- Add new columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add new columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS description TEXT;