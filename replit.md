# Bytebeam Extractor - Project Documentation

## Overview
Bytebeam Extractor is an AI-powered document and image data extraction platform built with Next.js. The application allows users to upload documents (PDF, DOCX, images) and extract structured data using Google's Generative AI.

## Project Architecture
- **Frontend**: Next.js 14 with React, Tailwind CSS, and Radix UI components
- **Backend**: Next.js API routes for document processing and AI extraction
- **AI Integration**: Google Generative AI (@ai-sdk/google) for data extraction
- **Document Processing**: PDF parsing and DOCX support via mammoth and pdf-parse
- **UI Components**: Extensive use of Radix UI components for modern interface
- **Spreadsheet Integration**: AG Grid and Handsontable for data visualization

## Key Features
- Document upload and processing (PDF, DOCX, images)
- AI-powered data extraction with customizable schemas
- **Pharma E-Commerce Content Generation Agent**: Specialized agent for pharmaceutical product data extraction
  - OCR-based drug information extraction from product labels and documents
  - Saudi FDA database integration for drug matching and enrichment
  - Automated extraction of drug details (description, composition, usage, side effects, etc.)
- Interactive data grid for viewing extracted results
- Contact form integration with Google Sheets
- Transform builder for data manipulation with Gemini AI tools:
  - **Calculator Tool**: Performs mathematical calculations and expressions
  - **Web Search Tool**: Searches the web for current information using Tavily API
- Visual column grouping with spanning headers for organizing related fields
- Modern responsive UI with dark/light theme support

## Environment Setup
The application requires the following environment variables:
- `GOOGLE_GENERATIVE_AI_API_KEY`: Required for AI-powered extraction
- `TAVILY_API_KEY`: Required for web search functionality in transform tool
- `GOOGLE_SHEETS_WEBAPP_URL`: For contact form submissions
- `GOOGLE_SHEETS_SECRET`: Optional secret for Apps Script
- `NEXT_PUBLIC_BOOKING_URL`: Public scheduler URL for contact dialog

## Development Configuration
- **Server**: Configured to run on port 5000 with hostname 0.0.0.0 for Replit compatibility
- **Next.js**: Modified to include cache control headers and allow all hosts for proxy environment
- **TypeScript**: Build errors ignored for development convenience

## Deployment Configuration
- **Target**: Autoscale deployment for stateless web application
- **Build**: `npm run build`
- **Run**: `npm start`

## Recent Changes
### 2025-10-10 (Type-Aware Transformations)
- Implemented type-aware result formatting for transformation fields
- Transformations now respect field type definitions (string, number, list, object, table, etc.)
- Tool results (web search, calculator) are automatically formatted according to field schema
- Added `generateObject` with Zod schema validation for structured types
- Comprehensive edge case handling:
  - Empty results return appropriate empty values ([] for lists, {} for objects)
  - Partial data handled gracefully with schema.partial() for objects
  - Validation errors fall back to text representation
- Backward compatible: Fields without type info use legacy text formatting
- Example: Web search for stores now returns structured array of {name, url, price} instead of text

### 2025-10-10 (Transformation Field Dependencies)
- Implemented comprehensive transformation dependency system with cycle detection and topological sort
- Transformations can now reference other transformation fields as inputs using `{Field Name}` syntax
- Dependency graph automatically determines execution order using wave-based processing
- Added cycle detection to prevent circular dependencies between transformations
- Implemented error propagation - when a transformation fails, dependent transformations are blocked
- UI updated to show transformation fields as available inputs in transform builder
- Visual indicators show dependency relationships and blocked states
- Supports both name-based `{Field}` and ID-based structured references for maximum compatibility
- All resolution, validation, and execution logic handles dual name/ID lookup strategy

### 2025-10-10 (Web Search Tool Integration)
- Added Tavily web search API integration to the transform tool
- LLM can now browse the web for current information, facts, and real-time data
- Web search tool works alongside calculator tool for enhanced AI capabilities
- Configured TAVILY_API_KEY environment variable for secure API access
- Search results include titles, URLs, and content snippets with up to 5 results per query

### 2025-09-30 (Pharma E-Commerce Content Generation Agent)
- Added agent type selector to switch between "Standard Extraction" and "Pharma E-Commerce Content Generation"
- Implemented pharma API endpoint (/api/pharma/extract) with:
  - Google Gemini OCR for drug information extraction from images and documents
  - Saudi FDA database search integration (https://sdi.sfda.gov.sa/home/DrugSearch)
  - Intelligent drug matching based on extracted identifiers (name, generic name, manufacturer)
  - Detailed drug information extraction (description, composition, how to use, indication, side effects, properties, storage, review)
- Created specialized pharma results display component with structured sections
- Modified upload flow to allow pharma uploads without requiring schema definition
- Added processing states and error handling specific to pharma workflow

### 2025-09-30 (Visual Column Grouping)
- Completely redesigned field grouping as visual-only feature with spanning headers
- Implemented AG Grid column groups to display related fields under shared headers
- Added VisualGroup type to SchemaDefinition for tracking visual grouping metadata
- Modified grouping workflow to keep fields as separate columns (not merged objects)
- Right-click context menu on column headers opens grouping dialog
- Checkbox-based field selection in grouping dialog with auto-selection
- Automatic cleanup of visual groups when fields are deleted
- Fields remain independent while showing visual organization through spanning headers

### 2025-09-24
- Imported from GitHub and configured for Replit environment
- Updated Next.js configuration for Replit proxy compatibility
- Added cache control headers to prevent caching issues
- Configured development workflow on port 5000
- Set up deployment configuration for production
- Fixed field popup overflow issue in transformation builder modal
- Updated AG Grid API calls for compatibility
- Implemented Gemini AI transformation with automatic calculator tool integration
- Fixed structured data handling for proper JSON context passing

## Project Status
✅ Project successfully imported and configured for Replit
✅ Development server running and functional
✅ All dependencies installed and working
✅ Deployment configuration completed