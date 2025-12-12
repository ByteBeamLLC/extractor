-- Migration: Add input_documents column to extraction_jobs table
-- This column stores metadata about multi-input documents for extraction jobs

-- Add the input_documents column
ALTER TABLE extraction_jobs
ADD COLUMN IF NOT EXISTS input_documents JSONB DEFAULT NULL;

-- Add a comment explaining the column's purpose
COMMENT ON COLUMN extraction_jobs.input_documents IS 
'Stores metadata about input documents for multi-document extraction jobs. Structure: { [fieldId]: { fieldId, fileName, fileUrl, uploadedAt, textValue, mimeType, inputType } }';

-- Create an index for queries that filter by input_documents
-- (optional, uncomment if you need to query by specific input document fields)
-- CREATE INDEX IF NOT EXISTS idx_extraction_jobs_input_documents ON extraction_jobs USING GIN (input_documents);

