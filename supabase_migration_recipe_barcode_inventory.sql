-- Migration: Add barcode and inventory fields to recipes table
-- Run this in Supabase SQL Editor

-- Add barcode column (EAN-13 format, 13 digits)
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Add inventory column (JSONB for flexible stock management)
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '{
  "stock_quantity": 0,
  "stock_unit": "portions",
  "min_stock_alert": null,
  "last_stock_update": null
}'::jsonb;

-- Create unique constraint on barcode to prevent duplicates
-- Note: NULL values are allowed (multiple recipes can have no barcode)
ALTER TABLE public.recipes
ADD CONSTRAINT recipes_barcode_unique UNIQUE (barcode);

-- Create index on barcode for quick lookups (the unique constraint already creates an index)
-- CREATE INDEX IF NOT EXISTS recipes_barcode_idx ON public.recipes (barcode);

-- Create index on inventory stock_quantity for low stock queries
CREATE INDEX IF NOT EXISTS recipes_inventory_stock_idx ON public.recipes ((inventory->>'stock_quantity'));

-- Add comment for documentation
COMMENT ON COLUMN public.recipes.barcode IS 'EAN-13 barcode (13 digits with check digit) - must be unique';
COMMENT ON COLUMN public.recipes.inventory IS 'Stock/inventory tracking: stock_quantity, stock_unit, min_stock_alert, last_stock_update';
