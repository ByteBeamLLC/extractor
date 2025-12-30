# Datalab Integration Summary

## Overview
Added support for Datalab as an alternative OCR extraction method alongside dots.ocr. Users can now choose between two extraction methods:
- **dots.ocr**: Fast document layout detection (default)
- **Datalab (Accurate Mode)**: High-accuracy layout detection using Datalab's accurate mode

## Changes Made

### 1. Database Schema (`supabase_migration_workspace_preferences.sql`)
- Added `extraction_method` column to `workspace_preferences` table
- Default value: `'dots.ocr'`
- Constraint: Only allows `'dots.ocr'` or `'datalab'`

### 2. Datalab Library (`lib/datalab.ts`)
- Added `DatalabOCRInput` interface with `mode` parameter support
- Updated `callDatalabOCR` function to accept and pass `mode` parameter
- Supports `'fast'`, `'balanced'`, and `'accurate'` modes
- Accurate mode is used for better layout detection

### 3. Guest Extraction API (`app/api/document-extraction/extract-guest/route.ts`)
- Added `extraction_method` parameter to POST request body
- Validates extraction method (defaults to `'dots.ocr'`)
- Checks for appropriate API keys based on selected method:
  - `REPLICATE_API_TOKEN` for dots.ocr
  - `DATALAB_API_KEY` for datalab
- Implements datalab extraction flow:
  - Uses accurate mode for better results
  - Converts Datalab OCR output to blocks using `extractOCRBlocks`
  - Applies bounding box coordinates same way as dots.ocr
  - Converts bbox from `[x1, y1, x2, y2]` to `[x, y, width, height]` format
  - Creates `originalBbox` in `[x1, y1, x2, y2]` format for compatibility
- Maintains Gemini fallback for both methods when OCR fails

### 4. UI Components

#### ExtractionMethodSelector Component (`components/document-extraction/ExtractionMethodSelector.tsx`)
- New component for selecting extraction method
- Displays method options with icons and descriptions:
  - 🔍 Dots OCR - Fast document layout detection
  - 🎯 Datalab (Accurate) - High-accuracy layout detection
- Stores preference in localStorage
- Compact design suitable for dialog placement
- Exports `useExtractionMethod` hook for easy integration

#### Document Extraction Dashboard (`components/document-extraction/DocumentExtractionDashboard.tsx`)
- Integrated `ExtractionMethodSelector` component
- Added `extractionMethod` state using `useExtractionMethod` hook
- Passes `extraction_method` parameter to extraction API
- Displays selector in upload dialog for easy access when uploading files

## How It Works

### Extraction Flow

1. **User Selects Method**: User chooses between dots.ocr or datalab in the UI
2. **Preference Stored**: Selection is saved to localStorage
3. **File Upload**: When user uploads a document, the selected method is passed to the API
4. **API Processing**:
   - **If dots.ocr**: Uses existing Replicate dots.ocr flow
   - **If datalab**: 
     - Calls Datalab OCR API with `mode: 'accurate'`
     - Converts text_lines to blocks with bounding boxes
     - Applies polygon coordinates if available
   - **If OCR fails**: Falls back to Gemini for direct text extraction
5. **Bounding Box Display**: Both methods produce compatible bbox format for visualization

### Bounding Box Compatibility

Both extraction methods produce blocks with:
- `bbox`: `[x, y, width, height]` format for rendering
- `originalBbox`: `[x1, y1, x2, y2]` format for reference
- `polygon`: Flat array of coordinates for precise boundaries
- These are used identically in `DocumentExtractionViewer` for overlay rendering

### Gemini Fallback

When either OCR method fails:
1. System falls back to direct Gemini extraction
2. Passes entire document (or pages) to Gemini 2.5 Pro
3. Extracts text with preserved formatting
4. Returns as single text block per page
5. No bounding boxes available in fallback mode

## Configuration

### Environment Variables

Add to `.env` file:
```bash
# For dots.ocr
REPLICATE_API_TOKEN=your_replicate_token

# For Datalab
DATALAB_API_KEY=your_datalab_api_key
```

### API Endpoints

- **Datalab OCR**: `https://www.datalab.to/api/v1/ocr`
- **Datalab Marker (Chandra)**: `https://www.datalab.to/api/v1/marker`

## Benefits

1. **User Choice**: Users can select the method that works best for their documents
2. **Better Accuracy**: Datalab's accurate mode provides higher quality for complex layouts
3. **Consistent Interface**: Both methods use the same bounding box format
4. **Reliable Fallback**: Gemini ensures extraction always succeeds
5. **Persistent Preference**: User's choice is remembered across sessions

## Testing

To test the integration:

1. Set both API keys in `.env`
2. Upload a document
3. Try both extraction methods
4. Verify bounding boxes appear correctly
5. Test fallback by temporarily removing API keys

## Future Enhancements

- Add extraction method to user preferences in database (currently localStorage only)
- Support for more Datalab modes (fast, balanced)
- Performance metrics comparison between methods
- Automatic method selection based on document type

