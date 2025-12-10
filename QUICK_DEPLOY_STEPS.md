# 🚀 Quick Deploy Steps

## Prerequisites
- [ ] You have production Supabase credentials
- [ ] You have access to Vercel deployment
- [ ] All code changes have been pulled

## 3-Step Deployment

### 1️⃣ Test Locally (Optional but Recommended)
```bash
./test-production-build.sh
# If successful, run: npm start
# Test at http://localhost:5050
```

### 2️⃣ Apply Database Migration
Go to [Supabase Dashboard](https://app.supabase.com) → SQL Editor:
```sql
-- Copy and paste contents of supabase_migration_table_state_rls.sql
-- Click "Run"
```

### 3️⃣ Deploy to Vercel
```bash
git add .
git commit -m "fix: resolve React #301 and Supabase 406 errors"
git push origin main
```

## Verify Deployment
1. Open your Vercel URL
2. Press F12 (DevTools) → Console tab
3. Create a new schema
4. Upload a document
5. Use grid search/filter

### ✅ Success Indicators
- No "React Error #301" in console
- No "406" errors from Supabase
- Grid operations work smoothly
- Search doesn't cause crashes

### ❌ If Problems Occur
```bash
# Rollback via Vercel Dashboard
# Go to: Deployments → Find previous version → Promote

# OR use CLI
vercel rollback
```

## Need More Details?
- **Full Guide:** `VERCEL_DEPLOYMENT_FIX_GUIDE.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Test Script:** `./test-production-build.sh`

---

**Estimated Time:** 15-20 minutes  
**Risk Level:** Low (easily reversible)  
**Impact:** Fixes production crashes

