require('dotenv').config()
const Stripe = require('stripe')

const requiredEvents = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.closed'
]

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  if (!process.env.PUBLIC_SITE_URL) {
    throw new Error('PUBLIC_SITE_URL is not configured')
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const siteUrl = new URL(process.env.PUBLIC_SITE_URL)
  const [account, endpoints] = await Promise.all([
    stripe.accounts.retrieve(),
    stripe.webhookEndpoints.list({ limit: 100 })
  ])

  const matchingEndpoints = endpoints.data.filter(endpoint => {
    if (endpoint.status !== 'enabled') return false
    try {
      return new URL(endpoint.url).hostname === siteUrl.hostname
    } catch (error) {
      return false
    }
  })
  const enabledEvents = new Set(matchingEndpoints.flatMap(endpoint => endpoint.enabled_events))
  const wildcard = enabledEvents.has('*')
  const missingEvents = requiredEvents.filter(event => !wildcard && !enabledEvents.has(event))
  const readiness = {
    chargesEnabled: account.charges_enabled === true,
    payoutsEnabled: account.payouts_enabled === true,
    detailsSubmitted: account.details_submitted === true,
    accountCountry: account.country || '',
    settlementCurrency: String(account.default_currency || '').toUpperCase(),
    enabledSiteWebhookEndpoints: matchingEndpoints.length,
    missingEvents
  }

  console.log(JSON.stringify(readiness, null, 2))

  if (
    !readiness.chargesEnabled
    || !readiness.payoutsEnabled
    || !readiness.detailsSubmitted
    || readiness.enabledSiteWebhookEndpoints < 1
    || readiness.missingEvents.length
  ) {
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error(`Stripe readiness check failed: ${error.message}`)
  process.exit(1)
})
