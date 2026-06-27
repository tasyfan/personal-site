# Northstar Minimum Launch Loop

## Required now

- Public Chinese and English experience, including reversible language switching.
- USD prices and live Stripe Checkout.
- Signed webhook fulfillment and server-authoritative paid access.
- Printable purchase receipt and order-ID purchase restoration.
- Same-device returning customers retain and server-revalidate paid access;
  customers on a new device restore access with the receipt order ID instead
  of purchasing again.
- Refund policy, privacy notice, basic terms, and support request form.
- Admin order/support/alert visibility.
- Health monitoring, database backup, restore verification, and privacy cleanup.

## Price position

- The USD 7.99 launch price for a single report is slightly below Truity's
  published individual assessment pricing starting around USD 9 per test,
  reflecting Northstar's earlier brand stage.
- The USD 14.99-24.99 bundles provide a middle tier between low-cost
  assessments and premium specialist reports.
- The USD 39.99 all-access launch pass remains below premium specialist
  reports while including 16 report types.

Current launch ladder:

- Single professional report: USD 7.99
- Two-report personality bundles: USD 14.99
- Energy and destiny bundles: USD 14.99-19.99
- Four-report deep or relationship bundles: USD 24.99
- Standalone AI relationship analysis: USD 12.99
- All 16 report types: USD 39.99

## Professional report standard

Paid report generation uses `professional-long-v1`:

- 10-12 structured sections
- Target 2,000-3,500 English words or 3,500-5,500 Chinese characters
- Evidence summary, strengths, blind spots, relationships, decisions/work,
  stress pattern, growth direction, 30-day plan, reflection questions, and
  interpretation limits
- A second generation pass when the first draft is too short or incomplete
- Approximately 15-20 minutes reading time
- Publication-style layout with reading progress, chapter navigation, and
  print/PDF support
- Privacy-safe sharing: users can copy a short summary or share/download a
  generated summary image; order IDs and the full paid report are excluded

## Antigravity frontend

- The active frontend design is derived from the imported
  `Antigravity-Animation-Design` V6 package.
- The original desktop delivery is preserved under
  `design-sources/antigravity-animation-design`.
- The public runtime uses a self-hosted Three.js build and a performance-bounded
  128 x 128 GPGPU simulation, with reduced-motion and initialization fallbacks.
- Northstar workflows retain their existing routes, payments, purchase
  restoration, professional reports, and privacy-safe sharing.

## Non-blocking follow-up

- Stripe Tax remains disabled until the operator has a concrete registration
  obligation. A new site does not need to enable automatic tax merely because
  Stripe supports it.
- Replace the generic Northstar operator description with a registered legal
  entity, address, and dedicated support email when those details exist or when
  the target jurisdiction/payment provider requires them.
- External Slack/Sentry notifications, dedicated transactional email, and
  advanced marketing analytics can be added after initial paid-user evidence.

## Final manual proof

The only manual proof that cannot be produced without a real payment method is
one successful USD purchase followed by report access, purchase restoration,
and a refund. Checkout creation, webhook coverage, paid entitlement behavior,
report delivery, and refund code paths are automated and production-verified.
