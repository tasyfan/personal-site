# Northstar Deployment

The minimum launch scope and intentionally deferred items are recorded in
`MVP_LAUNCH_STATUS.md`. Tax automation and formal operator details are not
deployment blockers until an actual jurisdiction, registration obligation, or
payment-provider requirement makes them necessary.

## Static public directory

Do not publish the project root. Build and publish only:

```sh
npm run build:static
```

Use `dist/public` as the Nginx `root`. It intentionally excludes `.git/`, `server/`, `node_modules/`, package lock files, SQLite databases, and handover notes.

## Server

Run the API from the private `server/` directory:

```sh
cd server
npm ci --omit=dev
NODE_ENV=production \
PAYMENT_MODE=live \
PUBLIC_SITE_URL='https://northstar.fantasy-games.org' \
CORS_ORIGINS='https://northstar.fantasy-games.org' \
ADMIN_TOKEN='replace-with-long-random-token' \
ADMIN_PAGE_PASSWORD='replace-with-a-different-long-random-password' \
STRIPE_SECRET_KEY='sk_live_...' \
STRIPE_WEBHOOK_SECRET='whsec_...' \
TAX_COMPLIANCE_STATUS='pending' \
npm start
```

For a complete backend handoff bundle, run:

```sh
npm run build:deploy
```

Deploy `dist/server-bundle/server`, `dist/server-bundle/content`, and
`dist/server-bundle/admin.html` together. The private `content` directory is
required for paid report delivery and must not be placed under the Nginx public
root.

Production payment modes:

- `live`: creates Stripe Checkout Sessions and fulfills only through signed webhooks.
- `disabled`: payment actions are rejected.
- `mock`: local development only. Never enable on a public host.

The default mode is `disabled`. Production must set `PAYMENT_MODE=live`
explicitly.

## Operations

- Open `/admin.html` and enter `ADMIN_TOKEN` to review orders, refunds, support
  tickets, and the 30-day purchase funnel.
- The authenticated admin alert inbox persists payment failures, refunds,
  disputes, AI-provider failures, unhandled server errors, monitor failures,
  and support tickets even when no external notification service is configured.
- Optionally configure `SUPPORT_NOTIFICATION_WEBHOOK_URL` to mirror alerts to
  Slack, Discord, or an automation webhook. Sensitive contact, message, token,
  secret, and password fields are excluded from persisted and external alert
  payloads.
- Install `deploy/systemd/northstar-backup.service` and
  `deploy/systemd/northstar-backup.timer`. They create a consistent daily
  SQLite backup in `/opt/northstar/backups` and retain 30 days by default.
- Test restoration before launch and periodically afterward.
- Monitor `/api/payment/config`; production is ready only when
  `paymentLive=true` and Stripe reports `ready=true`.
- Monitor `/api/health` for API process availability.
- Install and enable `deploy/systemd/northstar-monitor.service` and
  `deploy/systemd/northstar-monitor.timer`. The monitor runs every ten minutes
  and checks API health, SQLite integrity, backup freshness, stale support
  tickets, report failures, and payment failures/disputes.
- Install and enable `deploy/systemd/northstar-restore-check.service` and
  `deploy/systemd/northstar-restore-check.timer`. The weekly job copies the
  latest automatic backup into an isolated temporary directory, runs SQLite
  integrity and foreign-key checks, verifies required tables, records the
  result in the admin dashboard, and creates an operations alert on failure.
- Install and enable `deploy/systemd/northstar-data-retention.service` and
  `deploy/systemd/northstar-data-retention.timer`. The daily job anonymizes
  resolved support contact and message fields after 90 days and deletes old
  product analytics and resolved operational records after 180 days. It does
  not delete order or payment records.
- Subscribe the Stripe webhook to Checkout completion/failure/expiry,
  `charge.refunded`, and dispute events.

## Required production checks

Run the complete release gate before and after deployment:

```sh
npm run check:launch
npm run check:launch:production
```

The gate builds the public artifact, checks premium-content isolation,
validates the English catalog, verifies repeated Chinese/English switching,
runs backend tests and dependency audit, and confirms the production health,
Stripe live configuration, legal/support pages, admin authentication, and
private-path protection.

On the production server, also verify Stripe account and webhook readiness:

```sh
cd /opt/northstar/server
npm run check:stripe-readiness
```

This read-only check verifies that charges and payouts are enabled, account
details are submitted, and the live site webhook covers checkout completion,
asynchronous payment, expiry, refund, and dispute events.

These must return `403` or `404`:

```sh
curl -I https://northstar.fantasy-games.org/server/northstar.db
curl -I https://northstar.fantasy-games.org/server/db.js
curl -I https://northstar.fantasy-games.org/.git/config
curl -I https://northstar.fantasy-games.org/node_modules/
```

The TLS Nginx sample is in `deploy/nginx/northstar.production.conf`.
