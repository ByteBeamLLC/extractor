# Regression Test Checklist for New Job Flow

This document provides a manual verification checklist to ensure the grid loads correctly after creating a new job and that React error #301 is resolved.

## Prerequisites

1. Build the production version: `npm run build`
2. Start the production server: `npm start`
3. Have a test account ready with schema creation permissions

## Test Steps

### Test 1: Create New Schema with Template

- [ ] Navigate to the application
- [ ] Create a new schema
- [ ] Select a template (or choose blank)
- [ ] **Verify**: Grid loads without React error #301
- [ ] **Verify**: No console errors about "Too many re-renders"
- [ ] **Verify**: Grid displays correctly with columns and data

### Test 2: Create New Job from Template

- [ ] With an existing schema open
- [ ] Create a new job (upload document or create manually)
- [ ] **Verify**: Grid updates to show the new job
- [ ] **Verify**: No React error #301 appears
- [ ] **Verify**: Grid remains stable and responsive

### Test 3: Search Functionality

- [ ] With grid loaded, use the search bar
- [ ] Type a search query
- [ ] **Verify**: Search results appear correctly
- [ ] **Verify**: No excessive re-renders (check React DevTools)
- [ ] **Verify**: Clearing search works without errors

### Test 4: Filter and Sort

- [ ] Apply column filters
- [ ] Sort columns
- [ ] **Verify**: Filters and sorting work correctly
- [ ] **Verify**: No render loops or errors
- [ ] **Verify**: Reset functionality works

### Test 5: Table State Persistence (if enabled)

- [ ] Apply filters, sorting, and column visibility changes
- [ ] Refresh the page
- [ ] **Verify**: Table state is restored (if persistence enabled)
- [ ] **Verify**: If persistence is disabled or fails (406), grid still works with defaults

### Test 6: Production Build Verification

- [ ] Run `npm run build`
- [ ] Run `npm start`
- [ ] Repeat Test 1 and Test 2
- [ ] **Verify**: No React error #301 in production build
- [ ] **Verify**: Grid functionality works as expected

## Expected Results

✅ All tests should pass without React error #301
✅ Grid should load and remain stable
✅ No console errors about excessive re-renders
✅ Search, filter, and sort should work correctly
✅ Table state persistence should work or fail gracefully

## Notes

- If table-state persistence returns 406 errors, the grid should continue to work with default settings
- All fixes should be transparent to the user (no visible changes except stability)
- Check browser console for any errors or warnings

## Automated Test (Future)

When a test framework is added to the project, create an automated test that:
1. Mocks the Supabase client
2. Simulates creating a new job
3. Verifies the grid renders without errors
4. Checks that table state persistence handles 406 errors gracefully

