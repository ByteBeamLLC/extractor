#!/bin/bash

# Production Build Test Script
# This script helps test the React #301 and Supabase 406 fixes locally

set -e  # Exit on error

echo "🔍 Testing Production Build for Vercel Deployment Fixes"
echo "========================================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found!"
    echo "Please create .env.local with your production Supabase credentials:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key"
    echo ""
    exit 1
fi

echo "✅ Found .env.local"
echo ""

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next
echo "✅ Clean complete"
echo ""

# Run production build
echo "🏗️  Building production bundle..."
echo "This may take a few minutes..."
echo ""

if npm run build; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📋 Testing Checklist:"
    echo ""
    echo "1. Run: npm start"
    echo "2. Open: http://localhost:5050"
    echo "3. Open Browser DevTools (F12) → Console tab"
    echo ""
    echo "4. Test these scenarios:"
    echo "   ☐ Create new schema from template"
    echo "   ☐ Create new schema from blank"
    echo "   ☐ Upload document and create job"
    echo "   ☐ Search in grid (type and clear)"
    echo "   ☐ Apply column filters"
    echo "   ☐ Sort columns"
    echo "   ☐ Resize and reorder columns"
    echo ""
    echo "5. Verify NO errors appear:"
    echo "   ✓ No React Error #301 (Too many re-renders)"
    echo "   ✓ No Supabase 406 errors in console"
    echo ""
    echo "6. If all tests pass, proceed with deployment!"
    echo ""
    echo "📖 See VERCEL_DEPLOYMENT_FIX_GUIDE.md for detailed instructions"
    echo ""
else
    echo ""
    echo "❌ Build failed!"
    echo "Please fix the errors above before deploying."
    echo ""
    exit 1
fi

