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
- Interactive data grid for viewing extracted results
- Contact form integration with Google Sheets
- Transform builder for data manipulation with Gemini AI and calculator tool
- Visual column grouping with spanning headers for organizing related fields
- Modern responsive UI with dark/light theme support

## Environment Setup
The application requires the following environment variables:
- `GOOGLE_GENERATIVE_AI_API_KEY`: Required for AI-powered extraction
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