-- Enable Row Level Security on schema_templates table
-- This ensures users can only access their own saved templates

ALTER TABLE schema_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for schema_templates
-- Users can only perform all operations (SELECT, INSERT, UPDATE, DELETE) on templates they own
CREATE POLICY "Templates are user-scoped"
  ON schema_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

