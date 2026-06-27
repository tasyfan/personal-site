const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')
const test = require('node:test')
const assert = require('node:assert/strict')
const Database = require('better-sqlite3')

test('anonymizes resolved support data without deleting open tickets or orders', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'northstar-retention-'))
  const dbPath = path.join(tempDir, 'retention.db')
  execFileSync(process.execPath, ['-e', "require('./db').close()"], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NORTHSTAR_DB_PATH: dbPath }
  })
  const db = new Database(dbPath)
  db.exec(`
    INSERT INTO support_requests (id, contact, category, order_id, message, status, created_at, updated_at) VALUES
      ('resolved-old', 'private@example.com', 'support', '', 'private message', 'resolved', datetime('now', '-120 days'), datetime('now', '-120 days')),
      ('open-old', 'keep@example.com', 'support', '', 'still active', 'open', datetime('now', '-120 days'), datetime('now', '-120 days'));
    INSERT INTO product_events (id, event_name, created_at) VALUES ('old-event', 'test', datetime('now', '-200 days'));
    INSERT INTO operations_checks (id, status, checked_at) VALUES (1, 'ok', datetime('now', '-200 days'));
    INSERT INTO operations_alerts (id, event_name, severity, status, updated_at) VALUES ('old-alert', 'test', 'warning', 'resolved', datetime('now', '-200 days'));
    INSERT INTO backup_restore_checks (id, status, checked_at) VALUES (1, 'ok', datetime('now', '-200 days'));
    INSERT INTO orders (id, test_type) VALUES ('order-kept', 'payment');
  `)
  db.close()

  execFileSync(process.execPath, [path.join(__dirname, '../scripts/data-retention.js')], {
    env: {
      ...process.env,
      NORTHSTAR_DB_PATH: dbPath,
      SUPPORT_RETENTION_DAYS: '90',
      ANALYTICS_RETENTION_DAYS: '180',
      OPERATIONS_RETENTION_DAYS: '180'
    }
  })

  const verified = new Database(dbPath, { readonly: true })
  const resolved = verified.prepare("SELECT contact, message FROM support_requests WHERE id = 'resolved-old'").get()
  const open = verified.prepare("SELECT contact, message FROM support_requests WHERE id = 'open-old'").get()
  assert.deepEqual(resolved, { contact: '[removed]', message: '[removed after retention period]' })
  assert.deepEqual(open, { contact: 'keep@example.com', message: 'still active' })
  assert.equal(verified.prepare('SELECT COUNT(*) AS count FROM product_events').get().count, 0)
  assert.equal(verified.prepare('SELECT COUNT(*) AS count FROM operations_checks').get().count, 0)
  assert.equal(verified.prepare('SELECT COUNT(*) AS count FROM operations_alerts').get().count, 0)
  assert.equal(verified.prepare('SELECT COUNT(*) AS count FROM backup_restore_checks').get().count, 0)
  assert.equal(verified.prepare('SELECT COUNT(*) AS count FROM orders').get().count, 1)
  assert.equal(verified.prepare("SELECT status FROM data_retention_checks ORDER BY id DESC LIMIT 1").get().status, 'ok')
  verified.close()
  fs.rmSync(tempDir, { recursive: true, force: true })
})
