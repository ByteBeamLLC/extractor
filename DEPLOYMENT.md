Deployment to Vercel

Environment variables (set for Production and Preview):

- GOOGLE_GENERATIVE_AI_API_KEY: Google Generative AI API key.
- GOOGLE_SHEETS_WEBAPP_URL: Google Apps Script Web App endpoint for contact form.
- GOOGLE_SHEETS_SECRET: Optional secret used by your Apps Script.
- NEXT_PUBLIC_BOOKING_URL: Public scheduler URL for the Contact dialog.

Build & framework:

- Framework preset: Next.js
- Build command: next build (default)
- Output: Automatic

Functions (vercel.json):

- api/** functions are configured to run up to 60s with 1024MB memory. Adjust as needed for your plan.

Security headers:

- next.config.mjs adds standard security headers (HSTS, X-Frame-Options, etc.).

Global error handling:

- app/error.tsx and app/not-found.tsx show friendly messages for failures and 404s.

Local development:

1. Copy .env.example to .env and fill values.
2. npm install
3. npm run dev

Notes:

- Do not commit real secrets. .env* is already ignored by .gitignore.
- Client code reads NEXT_PUBLIC_* at build time; ensure it’s set in Vercel before building.

