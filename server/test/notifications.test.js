const fs = require('fs')
const os = require('os')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert/strict')

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'northstar-notifications-'))
process.env.NORTHSTAR_DB_PATH = path.join(tempDir, 'notifications.db')
delete process.env.SUPPORT_NOTIFICATION_WEBHOOK_URL

const db = require('../db')
const { notifyOperations } = require('../services/notifications')

test('actionable events persist when no external webhook is configured', async () => {
  const result = await notifyOperations('payment_failed', {
    orderId: 'ORDER-123',
    customerEmail: 'private@example.com',
    message: 'private support text',
    paymentStatus: 'failed'
  })

  assert.equal(result.delivered, false)
  assert.equal(result.reason, 'not-configured')
  assert.match(result.alertId, /^ALT-/)

  const alert = db.prepare('SELECT * FROM operations_alerts WHERE id = ?').get(result.alertId)
  assert.equal(alert.event_name, 'payment_failed')
  assert.equal(alert.severity, 'warning')
  assert.equal(alert.status, 'open')
  assert.equal(alert.delivery_status, 'not_delivered')
  const details = JSON.parse(alert.details)
  assert.equal(details.orderId, 'ORDER-123')
  assert.equal(details.paymentStatus, 'failed')
  assert.equal(details.customerEmail, undefined)
  assert.equal(details.message, undefined)
})

test('non-actionable success notifications do not create inbox noise', async () => {
  const result = await notifyOperations('payment_succeeded', { orderId: 'ORDER-PAID' })
  assert.equal(result.alertId, null)
  const count = db.prepare("SELECT COUNT(*) AS count FROM operations_alerts WHERE event_name = 'payment_succeeded'").get().count
  assert.equal(count, 0)
})

test.after(() => {
  db.close()
  fs.rmSync(tempDir, { recursive: true, force: true })
})
