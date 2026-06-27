const fs = require('fs')
const os = require('os')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const { REQUIRED_TABLES, verifyRestoredDatabase } = require('../services/backup-restore-verifier')

test('verifies an isolated backup with the required schema', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'northstar-restore-test-'))
  const dbPath = path.join(tempDir, 'backup.db')
  const db = new Database(dbPath)
  for (const table of REQUIRED_TABLES) {
    db.exec(`CREATE TABLE ${table} (id INTEGER PRIMARY KEY)`)
  }
  db.close()

  const result = verifyRestoredDatabase(dbPath)
  assert.equal(result.integrity, 'ok')
  assert.equal(result.foreignKeyIssues, 0)
  assert.deepEqual(Object.keys(result.counts).sort(), [...REQUIRED_TABLES].sort())
  fs.rmSync(tempDir, { recursive: true, force: true })
})

test('rejects a backup missing required tables', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'northstar-restore-test-'))
  const dbPath = path.join(tempDir, 'broken.db')
  const db = new Database(dbPath)
  db.exec('CREATE TABLE orders (id INTEGER PRIMARY KEY)')
  db.close()

  assert.throws(() => verifyRestoredDatabase(dbPath), /Missing required tables/)
  fs.rmSync(tempDir, { recursive: true, force: true })
})
