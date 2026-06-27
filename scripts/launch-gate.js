const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const baseUrl = String(process.argv[2] || process.env.LAUNCH_BASE_URL || '').replace(/\/+$/, '')
const failures = []
const checks = []

function pass(name, detail = '') {
  checks.push({ name, ok: true, detail })
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail })
  failures.push(`${name}: ${detail}`)
}

function assert(name, condition, detail) {
  if (condition) pass(name, detail)
  else fail(name, detail)
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(10000),
    ...options
  })
  return response
}

function hasSecurityHeaders(response) {
  return response.headers.get('strict-transport-security')?.includes('max-age=')
    && response.headers.get('x-content-type-options')?.includes('nosniff')
    && response.headers.get('x-frame-options')?.includes('DENY')
    && response.headers.get('permissions-policy')?.includes('camera=()')
    && response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'")
}

function checkArtifact() {
  const publicDir = path.join(root, 'dist', 'public')
  const requiredFiles = [
    'index.html',
    'app.js',
    'i18n.js',
    'locales/en.js',
    'terms.html',
    'privacy.html',
    'refund.html',
    'support.html',
    'robots.txt',
    'sitemap.xml'
  ]

  for (const file of requiredFiles) {
    assert(`artifact:${file}`, fs.existsSync(path.join(publicDir, file)), 'required public file')
  }

  const index = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8')
  assert('artifact:english-catalog', index.includes('locales/en.js'), 'English catalog is loaded')
  assert('artifact:i18n-runtime', index.includes('i18n.js'), 'runtime locale handler is loaded')
  assert('artifact:canonical', index.includes('rel="canonical"') && index.includes('hreflang="en"'), 'canonical and language alternates included')
  assert('artifact:social-metadata', index.includes('property="og:image"') && index.includes('name="twitter:card"'), 'Open Graph and social metadata included')
  assert('artifact:structured-data', index.includes('application/ld+json') && index.includes('"@type": "WebSite"'), 'WebSite structured data included')

  const app = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf8')
  const paymentRoute = fs.readFileSync(path.join(root, 'server', 'routes', 'payment.js'), 'utf8')
  const stripeCheckout = fs.readFileSync(path.join(root, 'server', 'payment', 'stripe-checkout.js'), 'utf8')
  assert(
    'artifact:usd-price',
    app.includes('USD &#36;')
      && paymentRoute.includes("const PAYMENT_CURRENCY = 'USD'")
      && stripeCheckout.includes("currency: 'usd'"),
    'public price, order currency, and Stripe Checkout all use USD'
  )
  assert('artifact:receipt', app.includes('Purchase receipt') && app.includes('Print receipt'), 'printable receipt UI included')
}

async function checkProduction() {
  if (!baseUrl) {
    pass('production:skipped', 'set LAUNCH_BASE_URL or pass a URL to verify production')
    return
  }

  const health = await request('/api/health')
  const healthBody = await health.json().catch(() => ({}))
  assert('production:health', health.status === 200 && healthBody.ok === true, `HTTP ${health.status}`)

  const payment = await request('/api/payment/config')
  const paymentBody = await payment.json().catch(() => ({}))
  assert(
    'production:stripe-live',
    payment.status === 200
      && paymentBody.paymentMode === 'live'
      && paymentBody.paymentLive === true
      && paymentBody.providers?.stripe?.ready === true,
    JSON.stringify(paymentBody)
  )
  assert(
    'production:manual-disabled',
    paymentBody.providers?.manual?.ready === false,
    JSON.stringify(paymentBody.providers?.manual || {})
  )

  for (const pathname of ['/', '/terms.html?lang=en', '/privacy.html?lang=en', '/refund.html?lang=en', '/support.html?lang=en']) {
    const response = await request(pathname)
    assert(`production:page:${pathname}`, response.status === 200, `HTTP ${response.status}`)
    assert(`production:security:${pathname}`, hasSecurityHeaders(response), 'required browser security headers')
  }
  for (const pathname of ['/robots.txt', '/sitemap.xml']) {
    const response = await request(pathname)
    assert(`production:discovery:${pathname}`, response.status === 200, `HTTP ${response.status}`)
  }

  const admin = await request('/admin.html')
  assert('production:admin-auth', admin.status === 401, `HTTP ${admin.status}`)
  assert('production:admin-security', hasSecurityHeaders(admin), 'required browser security headers')

  for (const pathname of ['/server/northstar.db', '/server/db.js', '/.git/config', '/node_modules/']) {
    const response = await request(pathname)
    assert(`production:private:${pathname}`, [403, 404].includes(response.status), `HTTP ${response.status}`)
  }
}

async function main() {
  checkArtifact()
  try {
    await checkProduction()
  } catch (error) {
    fail('production:request', error.message)
  }

  for (const check of checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`)
  }

  if (failures.length) {
    console.error(`\nLaunch gate failed with ${failures.length} issue(s).`)
    process.exit(1)
  }
  console.log(`\nLaunch gate passed (${checks.length} checks).`)
}

main()
