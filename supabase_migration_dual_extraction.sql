-- Migration: Add dual extraction support (Gemini full-text + Layout blocks)
-- This allows running both extraction methods in parallel and storing results separately

-- Add columns for Gemini full-text extraction
ALTER TABLE public.document_extraction_files
ADD COLUMN IF NOT EXISTS gemini_full_text text,
ADD COLUMN IF NOT EXISTS gemini_extraction_status text NOT NULL DEFAULT 'pending'
  CHECK (gemini_extraction_status IN ('pending', 'processing', 'completed', 'error')),
ADD COLUMN IF NOT EXISTS gemini_error_message text;

-- Add column for layout extraction status (separate from overall status)
ALTER TABLE public.document_extraction_files
ADD COLUMN IF NOT EXISTS layout_extraction_status text NOT NULL DEFAULT 'pending'
  CHECK (layout_extraction_status IN ('pending', 'processing', 'completed', 'error')),
ADD COLUMN IF NOT EXISTS layout_error_message text;

-- Create indexes for the new status columns
CREATE INDEX IF NOT EXISTS document_extraction_files_gemini_status_idx
  ON public.document_extraction_files (gemini_extraction_status);
CREATE INDEX IF NOT EXISTS document_extraction_files_layout_status_idx
  ON public.document_extraction_files (layout_extraction_status);

-- Comment on columns
COMMENT ON COLUMN public.document_extraction_files.gemini_full_text IS 'Full document text extracted by Gemini OCR in markdown format';
COMMENT ON COLUMN public.document_extraction_files.gemini_extraction_status IS 'Status of Gemini full-text extraction';
COMMENT ON COLUMN public.document_extraction_files.gemini_error_message IS 'Error message if Gemini extraction failed';
COMMENT ON COLUMN public.document_extraction_files.layout_extraction_status IS 'Status of layout-based block extraction';
COMMENT ON COLUMN public.document_extraction_files.layout_error_message IS 'Error message if layout extraction failed';
