# Datalab Block Type Classification

## Overview
When using **Datalab in accurate mode**, the system now uses the **Marker (Chandra) API** with JSON output format to get accurate block type classification. This provides much better semantic understanding of document structure compared to just OCR text lines.

## Key Changes

### Previous Implementation (OCR Endpoint)
- Used `/api/v1/ocr` endpoint
- Only returned text lines with bounding boxes
- **All blocks were classified as 'TEXT'**
- No semantic understanding of document structure

### New Implementation (Marker/Chandra Endpoint)
- Uses `/api/v1/marker` endpoint with `output_format: 'json'`
- Returns structured blocks with `block_type` classification
- Each block includes:
  - `block_type`: Semantic category
  - `polygon`: Precise boundary coordinates
  - `bbox`: Bounding box coordinates
  - `content`: Extracted text/HTML/markdown
  - `section_hierarchy`: Document structure context

## Supported Block Types

Datalab Marker can classify the following block types:

### Document Structure
- **`Title`** - Document title and main headings
- **`Section-header`** - Section and subsection headers
- **`Page-header`** - Headers that repeat on multiple pages
- **`Page-footer`** - Footers that repeat on multiple pages

### Content Types
- **`Text`** - Regular paragraph text
- **`Caption`** - Image or table captions
- **`Footnote`** - Footnotes and endnotes
- **`List-item`** - Bullet points and numbered lists

### Special Elements
- **`Picture`** - Images and figures (no text extraction)
- **`Table`** - Tables (formatted as HTML)
- **`Formula`** - Mathematical formulas (formatted as LaTeX)

## Implementation Details

### API Call
```typescript
const datalabOutput = await callDatalabChandra({
  file: file_data, 
  file_name: file_name, 
  mime_type: mime_type,
  output_format: 'json',      // Get structured JSON
  mode: 'accurate'             // Use accurate mode
}, { timeout: 600_000 })
```

### Block Extraction
The `extractLayoutBlocks` function processes the JSON output:

1. **Parses JSON Structure**: Handles both array and object formats
2. **Recursively Extracts Blocks**: Traverses nested children
3. **Converts Coordinates**: 
   - Input: `[x1, y1, x2, y2]` or `[[x1,y1], [x2,y2], ...]`
   - Output: `[x, y, width, height]` for rendering
4. **Preserves Type Information**: Maps `block_type` to `type` field

### Example Block Output
```json
{
  "type": "Page-header",
  "content": "Annual Report 2024",
  "bbox": [50, 20, 500, 40],
  "polygon": [50, 20, 550, 20, 550, 60, 50, 60],
  "pageIndex": 0,
  "section_hierarchy": ["Header"]
}
```

## Benefits

### 1. Better Visualization
- Color-code blocks by type in the UI
- Filter/hide specific block types (e.g., page headers)
- Show semantic structure overlay

### 2. Smarter Extraction
- Skip irrelevant content (headers/footers)
- Extract tables with proper formatting
- Identify and handle formulas separately

### 3. Document Understanding
- Preserve document hierarchy
- Identify repeating elements
- Understand document flow

## Color Coding for Block Types

Current block type colors in the viewer:

```typescript
const BLOCK_TYPE_COLORS = {
  TEXT: "#3b82f6",          // Blue - main content
  TITLE: "#ef4444",         // Red - titles/headers
  "Section-header": "#ef4444", // Red - section headers
  "Page-header": "#9333ea",    // Purple - page headers
  "Page-footer": "#9333ea",    // Purple - page footers
  TABLE: "#22c55e",         // Green - tables
  PICTURE: "#f59e0b",       // Orange - images
  FORMULA: "#06b6d4",       // Cyan - formulas
  Caption: "#fbbf24",       // Yellow - captions
  Footnote: "#a3a3a3",      // Gray - footnotes
  "List-item": "#3b82f6",   // Blue - lists
  DEFAULT: "#8b5cf6",       // Purple - fallback
}
```

## PDF Support

For PDFs:
1. Document is processed once with Marker API to get block types
2. PDF pages are rendered separately for visualization
3. Blocks are grouped by `pageIndex` from the API response
4. Page images are displayed with block overlays

## Comparison: dots.ocr vs Datalab Marker

| Feature | dots.ocr | Datalab Marker (Accurate) |
|---------|----------|---------------------------|
| **Block Classification** | Limited (text, table, picture, title) | Comprehensive (11+ types) |
| **Structure Detection** | Basic layout | Full document hierarchy |
| **Headers/Footers** | Not distinguished | Specifically identified |
| **Tables** | Basic detection | HTML formatted output |
| **Formulas** | Text only | LaTeX formatted |
| **Speed** | Fast (~5-10s) | Slower (~15-30s) |
| **Accuracy** | Good | Excellent |

## Usage Recommendations

### Use Datalab Marker (Accurate) for:
- Complex documents with multiple sections
- Documents with repeated headers/footers
- Scientific papers with formulas
- Reports with structured tables
- Documents where block type classification matters

### Use dots.ocr for:
- Simple single-page documents
- Quick extraction needs
- When speed is critical
- Basic text extraction

## Future Enhancements

Potential improvements:
1. **Type-based filtering** in the UI
2. **Smart content extraction** that skips headers/footers
3. **Structural export** (preserve hierarchy in JSON/markdown)
4. **Formula rendering** using LaTeX
5. **Table extraction** with proper cell structure
6. **Section-aware search** across documents

