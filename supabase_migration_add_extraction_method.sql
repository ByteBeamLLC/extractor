-- Add extraction_method column to document_extraction_files table
ALTER TABLE public.document_extraction_files 
ADD COLUMN IF NOT EXISTS extraction_method text DEFAULT 'dots.ocr' CHECK (extraction_method IN ('dots.ocr', 'datalab'));

-- Add index for extraction_method for faster filtering
CREATE INDEX IF NOT EXISTS document_extraction_files_extraction_method_idx 
ON public.document_extraction_files (extraction_method);

-- Update existing records to have default extraction_method if null
UPDATE public.document_extraction_files 
SET extraction_method = 'dots.ocr' 
WHERE extraction_method IS NULL;

