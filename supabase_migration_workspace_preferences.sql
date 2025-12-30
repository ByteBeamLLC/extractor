-- Migration: Create workspace_preferences table
-- This stores per-user workspace settings including open tabs, view mode, sort order, etc.

CREATE TABLE IF NOT EXISTS workspace_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  view_mode TEXT DEFAULT 'grid',
  sort TEXT DEFAULT 'recent',
  last_opened_schema UUID,
  last_route TEXT DEFAULT '/home',
  open_tabs JSONB DEFAULT '[]'::jsonb,
  extraction_method TEXT DEFAULT 'dots.ocr' CHECK (extraction_method IN ('dots.ocr', 'datalab')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row-Level Security
ALTER TABLE workspace_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only access their own preferences
CREATE POLICY "Users can manage their own workspace preferences"
  ON workspace_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspace_preferences_user_id ON workspace_preferences(user_id);

-- Add comment for documentation
COMMENT ON TABLE workspace_preferences IS 'Stores per-user workspace settings including open tabs, view mode, sort order, and last route';
COMMENT ON COLUMN workspace_preferences.open_tabs IS 'JSONB array of open workspace tabs with schema IDs and metadata';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workspace_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_preferences_updated_at
  BEFORE UPDATE ON workspace_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_preferences_updated_at();

