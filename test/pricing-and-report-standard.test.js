const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.resolve(__dirname, '..')
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8')
const paymentSource = fs.readFileSync(path.join(root, 'server', 'routes', 'payment.js'), 'utf8')
const reportSource = fs.readFileSync(path.join(root, 'server', 'routes', 'tests.js'), 'utf8')

const expectedPrices = {
  single: 7.99,
  'self-core': 14.99,
  'advanced-personality': 14.99,
  'dark-side': 24.99,
  'destiny-map': 19.99,
  'energy-healing': 14.99,
  'relationship-plus': 24.99,
  'relationship-ai': 12.99,
  'all-access': 39.99
}

test('frontend and server use the same launch prices', () => {
  for (const [planId, price] of Object.entries(expectedPrices)) {
    const serverPattern = new RegExp(`['"]?${planId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?\\s*:\\s*\\{[^}]*price:\\s*${String(price).replace('.', '\\.')}`)
    const frontendPattern = new RegExp(`id:\\s*['"]${planId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"][\\s\\S]{0,180}?price:\\s*${String(price).replace('.', '\\.')}`)
    assert.match(paymentSource, serverPattern, `server price mismatch for ${planId}`)
    assert.match(appSource, frontendPattern, `frontend price mismatch for ${planId}`)
  }
})

test('the disabled quick insight product is not shown in the purchase catalog', () => {
  const productCatalog = appSource.slice(
    appSource.indexOf('const PRODUCT_PLANS = ['),
    appSource.indexOf('const PLAN_BY_ID =')
  )
  assert.doesNotMatch(productCatalog, /id:\s*['"]trial['"]/)
  assert.doesNotMatch(productCatalog, /originalPrice:\s*\d/)
})

test('professional reports use a long structured standard and invalidate old browser caches', () => {
  assert.match(reportSource, /10 to 12 numbered sections/)
  assert.match(reportSource, /2,000 to 3,500 English words/)
  assert.match(reportSource, /3500 到 5500 个中文字符/)
  assert.match(reportSource, /maxOutputTokens:\s*8192/)
  assert.match(reportSource, /priorDraft/)
  assert.match(reportSource, /professional-long-v1/)
  assert.match(reportSource, /metrics\.sections >= 10/)
  assert.match(reportSource, /const numberedSections = new Set\(\)/)
  assert.match(reportSource, /numberedSections\.size \|\| bracketSections/)
  assert.match(appSource, /AI_REPORT_CACHE_VERSION = 'v5-professional'/)
  assert.match(appSource, /NORTHSTAR PROFESSIONAL REPORT/)
  assert.match(appSource, /NORTHSTAR 专业长报告/)
})

test('paid reports use the polished private sharing surface', () => {
  const reportInstances = appSource.match(/<professional-report/g) || []
  assert.ok(reportInstances.length >= 15, 'all paid result families should use the professional report component')
  assert.match(appSource, /name:\s*'ProfessionalReport'/)
  assert.match(appSource, /app\.component\('professional-report', ProfessionalReport\)/)
  assert.match(appSource, /navigator\.canShare\(\{ files: \[shareFile\.value\] \}\)/)
  assert.match(appSource, /html2canvas\(shareCardEl\.value/)
  assert.match(appSource, /完整付费正文仍保持私密/)
  assert.match(appSource, /const safeShareUrl = computed/)
})
