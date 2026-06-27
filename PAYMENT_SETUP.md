# Northstar Payment Setup

## Current Mode

The backend supports:

- Manual QR verification
- Stripe Checkout Sessions
- Stripe signed webhook fulfillment
- WeChat Pay v3 Native Pay prepay, signed notification verification, and AES-GCM resource decryption
- Alipay face-to-face `alipay.trade.precreate` prepay and RSA2 asynchronous notification verification
- Payment event idempotency through `payment_events`
- Order audit fields: `provider`, `paid_at`, `gateway_event_id`, `gateway_trade_no`, `updated_at`

Admin configuration status endpoint:

```text
GET https://northstar.fantasy-games.org/api/payment/admin/config
Authorization: Bearer ADMIN_TOKEN
```

This endpoint reports whether each provider is ready and which environment variables are still missing.

## Stripe

Set these in `/opt/northstar/server/.env`:

```ini
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_SITE_URL=https://northstar.fantasy-games.org
```

The application uses Stripe Checkout dynamic payment methods. Do not hard-code
`payment_method_types` unless a specific account-level restriction requires it.

In Stripe Dashboard, open:

```text
Settings -> Payment methods
https://dashboard.stripe.com/settings/payment_methods
```

Enable:

- Cards
- Apple Pay
- Link
- Other USD-compatible methods required for the target market

Stripe only displays methods that are eligible for the account, transaction
currency, customer, and device. Northstar creates one-time Checkout Sessions in
USD. Checkout uses English for English users and Chinese for Chinese users.

## Returning customers

- On the same browser and device, paid entitlements and their server order IDs
  remain stored locally. On later visits the site rechecks those order IDs
  against `/api/payment/access/:orderId` and does not ask the customer to pay
  again while the order remains paid.
- Refunded, disputed, or missing orders are removed from local entitlement
  state after the server check.
- On another device, in private browsing, or after browser storage is cleared,
  the customer can use **Restore Purchase** and enter the order ID shown on the
  payment receipt. No second payment is required.
- Northstar currently has no account login, so it does not claim automatic
  cross-device restoration by identity.

## Launch prices and report delivery

The server is authoritative for all prices:

- Single report: USD 7.99
- Personality bundles: USD 14.99
- Destiny Map: USD 19.99
- Energy & Intuition: USD 14.99
- Compatibility + AI Guidance: USD 24.99
- AI Relationship Analysis: USD 12.99
- All Access: USD 39.99

Paid reports use the `professional-long-v1` standard with 10-12 sections and a
target reading time of approximately 15-20 minutes. Browser report caches are
versioned so users receive the new long-report format after this release.
The report reader includes chapter navigation, reading progress, print/PDF,
and privacy-safe summary sharing. Shared images and copied summaries do not
contain the order ID or the complete paid report.

## Tax decision

Do not enable tax collection until the operator has identified its registration
obligations and added applicable registrations in Stripe Tax.

Set one explicit production status:

```sh
TAX_COMPLIANCE_STATUS=pending
# or: TAX_COMPLIANCE_STATUS=not-required
# or: TAX_COMPLIANCE_STATUS=registered
```

When registrations are active in Stripe and the status is `registered`, enable
automatic calculation:

```sh
STRIPE_TAX_ENABLED=true
STRIPE_PRODUCT_TAX_CODE=txcd_...
```

Checkout then enables `automatic_tax`; Stripe collects the minimum customer
location fields required for calculation. Keep `STRIPE_TAX_ENABLED` unset or
false while the decision is pending.
Payment methods are managed dynamically in Stripe Dashboard.

Checkout creates a Stripe Customer and collects the customer's email and
billing-country information. The signed payment webhook stores these fields in
the private order payload so support can verify a purchase. The payment-return
page also provides a printable receipt containing the product, amount, payment
time, and recovery order ID.

In Stripe Dashboard, enable successful-payment email receipts:

```text
Settings -> Customer emails -> Successful payments
```

This Dashboard setting is external to the codebase and must be confirmed on the
live Stripe account.

Stripe webhook URL:

```text
https://northstar.fantasy-games.org/api/payment/webhook/stripe
```

Required event:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
charge.refunded
charge.dispute.created
charge.dispute.closed
```

Keep fulfillment webhook-driven. A browser redirect alone must never mark an
order paid.

### Stripe test checklist

1. Enable cards, Apple Pay, Link, and any other USD-compatible methods needed in Stripe test mode.
2. Start the server with Stripe test keys and `PAYMENT_MODE=live`.
3. Create an order from the payment modal and confirm the Stripe Checkout page
   shows USD and uses the user's selected site language.
4. Forward Stripe events to
   `/api/payment/webhook/stripe` with Stripe CLI or a public test endpoint.
5. Confirm the order changes to `paid` only after a signed successful event.
6. From `/admin.html`, run a test-mode refund and confirm the order becomes
   `refunded` and `/api/payment/access/:orderId` no longer restores access.

## WeChat Pay v3

The direct WeChat Pay flow remains implemented for future CNY pricing, but it is
disabled while the active catalog and checkout currency are USD.

Set these after merchant onboarding:

```ini
WECHATPAY_APPID=wx...
WECHATPAY_MCH_ID=1230000109
WECHATPAY_MCH_SERIAL_NO=merchant_api_certificate_serial_no
WECHATPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
WECHATPAY_PLATFORM_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
WECHATPAY_API_V3_KEY=32_byte_api_v3_key_here
```

Optional:

```ini
WECHATPAY_GATEWAY=https://api.mch.weixin.qq.com
```

WeChat Pay notify URL:

```text
https://northstar.fantasy-games.org/api/payment/webhook/wechat
```

The backend calls WeChat Pay v3 Native Pay `/v3/pay/transactions/native`, returns a generated QR image to the frontend, verifies `Wechatpay-Signature`, decrypts `resource` with API v3 key, and marks the order paid only when `trade_state` is `SUCCESS`.

## Alipay

The direct Alipay precreate flow remains implemented for future CNY pricing, but
it is disabled while the active catalog and checkout currency are USD.

Set this after Alipay merchant onboarding:

```ini
ALIPAY_APP_ID=2021...
ALIPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

Optional:

```ini
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
```

Alipay notify URL:

```text
https://northstar.fantasy-games.org/api/payment/webhook/alipay
```

The backend calls `alipay.trade.precreate`, returns a generated QR image to the frontend, verifies RSA2 asynchronous notification signatures, and marks the order paid only for `TRADE_SUCCESS` or `TRADE_FINISHED`.

## Admin

Admin URL:

```text
https://northstar.fantasy-games.org/admin.html
```

Use `ADMIN_TOKEN` from `/opt/northstar/server/.env`.

The admin page supports Stripe full refunds, support-ticket status updates, and
30-day checkout/report-delivery funnel metrics. Protect it with Cloudflare
Access, a VPN, or an IP allowlist in addition to the API token when practical.

Use a separate `ADMIN_PAGE_PASSWORD`; do not reuse `ADMIN_TOKEN`.
