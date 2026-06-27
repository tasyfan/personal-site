const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert/strict')

const appSource = fs.readFileSync(path.resolve(__dirname, '..', 'app.js'), 'utf8')

test('paid result pages initialize from stored entitlements', () => {
  for (const testType of ['tarot', 'mbti', 'attachment', 'bazi', 'human-design', 'aura', 'shadow', 'synastry', 'relationship-ai', 'color', 'enneagram', 'jung8', 'darktriad', 'saboteurs', 'defense']) {
    assert.match(
      appSource,
      new RegExp(`hasPaid\\s*=\\s*ref\\(isTestUnlocked\\('${testType}'\\)\\)`),
      `${testType} must initialize from persisted access`
    )
  }
})

test('stored paid orders are revalidated against the server on startup', () => {
  assert.match(appSource, /const refreshStoredPurchaseAccess = async/)
  assert.match(appSource, /fetch\('\/api\/payment\/access\/'/)
  assert.match(appSource, /window\.setTimeout\(refreshStoredPurchaseAccess, 0\)/)
  assert.match(appSource, /revokeStoredOrderAccess\(orderId\)/)
})

test('previously paid aura, shadow, and synastry flows do not reopen checkout', () => {
  for (const testType of ['aura', 'shadow', 'synastry']) {
    assert.match(
      appSource,
      new RegExp(`if \\(hasPaid\\.value\\)[\\s\\S]{0,180}getStoredTestOrderId\\('${testType}'\\)`),
      `${testType} should reuse its stored order`
    )
  }
})
