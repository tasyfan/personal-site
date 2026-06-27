# Northstar Security Notes

## Public deployment boundary

Only `dist/public` may be exposed by Nginx or another static server. The project root contains private implementation files and must never be used as a web root.

Blocked from public deployment:

- `.git/`
- `server/`
- `node_modules/`
- `scripts/`
- `deploy/`
- `*.db`, `*.sqlite`, `*.env`, `*.lock`, `*.log`

## Payment

Production uses Stripe Checkout Sessions with signed webhook fulfillment. Set
`PAYMENT_MODE=live`; the default is `disabled`, so a missing environment setting
cannot accidentally expose a non-functional checkout.

Do not enable `PAYMENT_MODE=mock` on a public host.

Paid access is server-authoritative:

- The public build strips non-empty `deep` report fields.
- Full report text is assembled by `server/services/private-content.js`.
- `/api/tests/:type/ai-analysis` verifies that the order is still `paid`.
- Refunded or disputed orders lose report access immediately.
- The order ID acts as a bearer recovery credential. It must not be published or
  included in screenshots.

`admin.html` is excluded from the public static artifact. The API server serves
it only after HTTP Basic authentication using `ADMIN_PAGE_PASSWORD` (falling
back to `ADMIN_TOKEN`). All data and write endpoints still require
`ADMIN_TOKEN`. Use different long random values for the page password and API
token, and add VPN, Cloudflare Access, or an IP allowlist when possible.

Payment, refund, dispute, AI-provider, server, monitor, and support failures are
persisted in the authenticated admin alert inbox. Production can additionally
configure `SUPPORT_NOTIFICATION_WEBHOOK_URL` so those alerts reach an external
operations channel. Common sensitive fields such as email, contact, message,
token, secret, and password are excluded from alert payloads.

The daily retention job anonymizes resolved support contact and message fields
after 90 days and removes old product analytics and resolved operations records
after 180 days. Order and payment records remain subject to the operator's
accounting and legal retention policy.
