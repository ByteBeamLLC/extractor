# Bridge Handoff & Email Deep Link Runbook

## Overview

Two cross-subdomain flows use opaque server-side tokens:

1. **Handwriting bridge** (`bsn_` tokens, 30min TTL) — marketing parsli.co to app.parsli.co
2. **Email continuation** (`ect_` tokens, 7-day TTL) — notification emails to app.parsli.co

Both follow the same security model: SHA-256 hashed at rest, single-use via atomic UPDATE, service-role only access.

## Architecture

```
Marketing (parsli.co)           App (app.parsli.co)
   BridgeChat                      /api/bridge-sessions/create
      |                                  |
      | POST /api/bridge-sessions        | returns {token: bsn_...}
      |                                  |
      | openAuthDialog({bridgeToken})    |
      |                                  |
      +---> Google OAuth connect --------+---> callback (HMAC-verified state)
                                               |
                                               | ?handoff=bsn_...
                                               v
                                         DocumentDetailView
                                               |
                                         POST /api/bridge-sessions/{token}/consume
                                               |
                                         useDocumentChat hydrates + auto-fires
```

## Tables

| Table | PK | TTL | Purpose |
|-------|-----|------|---------|
| `bridge_sessions` | `token_hash` (text, SHA-256 hex) | 30 min (`expires_at`) | Cross-subdomain handoff |
| `email_continuation_tokens` | `token_hash` (text, SHA-256 hex) | 7 days (`expires_at`) | Email deep link auto-auth |
| `account_migrations` | `id` (uuid) | permanent | Audit log for anon-to-permanent migrations |

## Cleanup Cron

**Route:** `/api/cron/cleanup-bridge-sessions`
**Schedule:** Daily at 03:00 UTC (`vercel.json`)
**Behavior:**
- Deletes `bridge_sessions` rows expired > 24h ago
- Deletes `email_continuation_tokens` rows expired > 30 days ago

## Common Issues

### User reports "link expired" on email CTA

1. Check `email_continuation_tokens` for the user's token:
   ```sql
   SELECT * FROM email_continuation_tokens
   WHERE user_id = '<user_id>'
   ORDER BY created_at DESC LIMIT 5;
   ```
2. If `consumed_at` is set — token was already used (single-use). User needs to log in manually.
3. If `expires_at` < now() — token expired (7-day TTL). User needs to log in manually.
4. If no row found — token was purged by cleanup cron (>30 days past expiry).

### Bridge handoff doesn't hydrate chat

1. Check `bridge_sessions` for the token:
   ```sql
   SELECT * FROM bridge_sessions
   WHERE anon_user_id = '<anon_user_id>'
   ORDER BY created_at DESC LIMIT 5;
   ```
2. If `consumed_at` is set but `payload` is empty — the BridgeChat didn't include messages in the payload.
3. If no row found — 30min TTL expired before user completed OAuth. User's parser+document still exist; they just lose the chat seed.

### Migration failed — user stuck on anonymous tier

1. Check `account_migrations`:
   ```sql
   SELECT * FROM account_migrations
   WHERE anon_user_id = '<anon_user_id>'
   ORDER BY created_at DESC;
   ```
2. If `success = false` — the `migrate_anonymous_user_data` RPC failed. The anon user was NOT deleted (safe). Check `error_message`.
3. Manual fix: run the migration function directly:
   ```sql
   SELECT migrate_anonymous_user_data('<anon_user_id>', '<new_user_id>');
   ```
4. Then delete the orphaned anon user via Supabase dashboard.

### HMAC state verification fails ("invalid_state" error)

1. Check that `STATE_SIGNING_SECRET` is set in Vercel environment variables.
2. If it was recently rotated, any in-flight OAuth flows (started before rotation) will fail. Users just need to retry.
3. State has a 15-minute TTL — if the user took >15 min on the Google consent screen, the state expired.

## Monitoring

### Key Mixpanel Events

| Event | Meaning | Alert if |
|-------|---------|----------|
| `bridge_session_created` | User typed follow-up in bridge chat | Volume drops to 0 |
| `bridge_session_consumed` | User completed OAuth + landed in app | Consumed/Created ratio < 30% |
| `bridge_session_rejected` | Token expired or already used | Rejected/Created ratio > 50% |
| `email_continue_success` | User clicked email CTA + got authed | Volume drops to 0 |
| `email_continue_rejected` | Token expired, user not found, or session failed | Rejected rate > 20% |
| `anonymous_converted` | Anon user data migrated to permanent account | Volume drops to 0 |

### Database Queries

```sql
-- Bridge conversion rate (last 7 days)
SELECT
  COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) AS consumed,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) / NULLIF(COUNT(*), 0), 1) AS pct
FROM bridge_sessions
WHERE created_at > now() - interval '7 days';

-- Email continuation conversion rate (last 7 days)
SELECT
  COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) AS consumed,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE consumed_at IS NOT NULL) / NULLIF(COUNT(*), 0), 1) AS pct
FROM email_continuation_tokens
WHERE created_at > now() - interval '7 days';

-- Failed migrations
SELECT * FROM account_migrations
WHERE success = false
ORDER BY created_at DESC LIMIT 10;
```
