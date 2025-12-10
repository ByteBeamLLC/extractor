# Vercel Deployment Fix Guide

This guide documents the fixes applied to resolve React Error #301 and Supabase 406 errors in production.

## Problems Fixed

### 1. React Error #301 - Too Many Re-renders
**Root Cause:** Infinite render loop caused by unstable table instance and effect dependencies.

**Fixes Applied:**
- ✅ Wrapped `useReactTable` in `useMemo` to create stable table instance
- ✅ Memoized all callback props using `useCallback` with stable dependencies
- ✅ Added guards in TableToolbar to prevent duplicate state updates
- ✅ Stabilized all handlers passed to column definitions

**Files Modified:**
- `components/tanstack-grid/TanStackGridSheet.tsx`
- `components/tanstack-grid/headers/TableToolbar.tsx`

### 2. Supabase 406 Error - Not Acceptable
**Root Cause:** Attempting to access `table_state` column before authentication completes, triggering RLS denial.

**Fixes Applied:**
- ✅ Added authentication check before loading table state
- ✅ Suppressed 406 errors in production console
- ✅ Added try-catch around table state loading
- ✅ Created RLS policy migration for documentation

**Files Modified:**
- `lib/supabase/tableState.ts`
- `components/tanstack-grid/TanStackGridSheet.tsx`
- `supabase_migration_table_state_rls.sql` (new)

## Testing Instructions

### Step 1: Apply Supabase Migration (Production Only)

If you haven't already, apply the RLS policy migration to your production Supabase instance:

```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push --db-url "postgresql://[YOUR_PRODUCTION_DB_URL]" < supabase_migration_table_state_rls.sql

# Option 2: Using Supabase Dashboard
# 1. Go to https://app.supabase.com/project/[your-project]/sql
# 2. Copy contents of supabase_migration_table_state_rls.sql
# 3. Paste and run the SQL
```

### Step 2: Local Production Build Test

Test the fixes locally before deploying to Vercel:

```bash
# 1. Set production environment variables
# Create .env.local if you don't have one
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
EOF

# 2. Build the production bundle
npm run build

# 3. Start the production server
npm start

# 4. Open http://localhost:5050 in your browser
```

### Step 3: Manual Testing Checklist

Test these scenarios in your local production build:

#### Basic Grid Operations
- [ ] Create a new schema from template
- [ ] Create a new schema from blank
- [ ] Upload a document and create a job
- [ ] Grid loads without React #301 error
- [ ] No Supabase 406 errors in console

#### Search & Filter Operations
- [ ] Type in search box - no render loop
- [ ] Clear search - no render loop
- [ ] Apply column filters - stable rendering
- [ ] Sort columns - stable rendering
- [ ] Toggle column visibility - stable rendering

#### Authentication Scenarios
- [ ] Load app while logged out - no 406 errors
- [ ] Load app while logged in - table state loads
- [ ] Switch between schemas - state persists correctly
- [ ] Log out - no console errors

#### Advanced Features
- [ ] Expand/collapse detail rows
- [ ] Resize columns
- [ ] Reorder columns via drag & drop
- [ ] Edit cell values
- [ ] Review status updates

### Step 4: Deploy to Vercel

Once local testing passes:

```bash
# Option 1: Deploy via Git
git add .
git commit -m "fix: resolve React #301 and Supabase 406 errors in production

- Memoize table instance to prevent re-creation
- Stabilize all callback props with useCallback
- Add authentication check before loading table state
- Suppress 406 errors in production console
- Update RLS policies for table_state column"

git push origin main  # Or your deployment branch

# Option 2: Deploy via Vercel CLI
vercel --prod
```

### Step 5: Verify Production Deployment

After deploying to Vercel:

1. **Open Browser DevTools** (F12)
2. **Navigate to your Vercel URL**
3. **Check Console Tab** - should see:
   - ✅ No React Error #301
   - ✅ No Supabase 406 errors
   - ✅ App loads and functions normally

4. **Test Key Scenarios:**
   - Create new schema
   - Create new job from template
   - Search functionality
   - All grid operations

## Rollback Plan

If issues occur after deployment:

### Immediate Rollback
```bash
# Via Vercel Dashboard
# 1. Go to Deployments tab
# 2. Find previous working deployment
# 3. Click "Promote to Production"

# Via Vercel CLI
vercel rollback
```

### Code Rollback
```bash
git revert HEAD
git push origin main
```

## Environment Variables Checklist

Ensure these are set in Vercel Dashboard:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Important:** Verify no whitespace or extra characters in values.

## Monitoring After Deployment

Watch for:
1. **Error rate in Vercel logs** - should remain at baseline
2. **Performance metrics** - should improve (fewer re-renders)
3. **User feedback** - no reports of grid crashes
4. **Browser console** - clean, no render loop errors

## Expected Outcomes

After deployment:
- ✅ React #301 error eliminated
- ✅ Supabase 406 errors suppressed (handled gracefully)
- ✅ Grid loads smoothly without crashes
- ✅ New job creation works reliably
- ✅ Search and filter operations remain stable
- ✅ Improved performance (fewer renders)

## Files Changed Summary

### Core Fixes
- `components/tanstack-grid/TanStackGridSheet.tsx` - Memoized table instance and callbacks
- `components/tanstack-grid/headers/TableToolbar.tsx` - Stabilized search effects
- `lib/supabase/tableState.ts` - Enhanced error handling

### New Files
- `supabase_migration_table_state_rls.sql` - RLS policy documentation/migration
- `VERCEL_DEPLOYMENT_FIX_GUIDE.md` - This guide

## Support

If you encounter issues:
1. Check browser console for specific errors
2. Verify environment variables are correct
3. Ensure Supabase migration was applied
4. Review Vercel deployment logs
5. Test locally with production build first

## Technical Details

### React #301 Prevention
The key insight: React's `useReactTable` creates a new table instance on every render unless memoized. This new instance triggers effects that depend on it, causing a cascade of re-renders. By wrapping it in `useMemo` with stable dependencies, we ensure the table instance only changes when actual data or configuration changes.

### Supabase 406 Handling
The 406 error occurs when:
1. User not authenticated yet
2. RLS policy denies access
3. Schema doesn't belong to user

Instead of showing errors, we now:
1. Check authentication before loading
2. Fail silently for unauthenticated users
3. Use default table state as fallback

This provides a better UX while maintaining security.

