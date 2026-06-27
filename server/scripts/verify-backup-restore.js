const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');
const { verifyRestoredDatabase } = require('../services/backup-restore-verifier');
const { notifyOperations } = require('../services/notifications');

const liveDbPath = process.env.NORTHSTAR_DB_PATH
  ? path.resolve(process.env.NORTHSTAR_DB_PATH)
  : path.resolve(__dirname, '../northstar.db');
const backupDir = path.resolve(process.env.BACKUP_DIR || '/opt/northstar/backups');

function latestBackup() {
  if (!fs.existsSync(backupDir)) return null;
  return fs.readdirSync(backupDir)
    .filter((name) => /^northstar-auto-\d{8}T\d{6}Z\.db$/.test(name))
    .map((name) => {
      const filePath = path.join(backupDir, name);
      return { name, filePath, mtimeMs: fs.statSync(filePath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs)[0] || null;
}

function recordCheck(status, backupName, details) {
  const db = new Database(liveDbPath, { fileMustExist: true });
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS backup_restore_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL,
        backup_name TEXT,
        details TEXT,
        checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_backup_restore_checks_checked
      ON backup_restore_checks(checked_at);
    `);
    db.prepare(`
      INSERT INTO backup_restore_checks (status, backup_name, details)
      VALUES (?, ?, ?)
    `).run(status, backupName || '', JSON.stringify(details || {}));
    db.prepare(`
      DELETE FROM backup_restore_checks
      WHERE checked_at < datetime('now', '-180 days')
    `).run();
    if (status === 'ok') {
      db.prepare(`
        UPDATE operations_alerts
        SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
        WHERE event_name = 'backup_restore_verification_failed'
          AND status IN ('open', 'acknowledged')
      `).run();
    }
  } finally {
    db.close();
  }
}

async function main() {
  const backup = latestBackup();
  if (!backup) throw new Error('No automatic database backup was found');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'northstar-restore-'));
  const restoredPath = path.join(tempDir, 'restored.db');
  try {
    fs.copyFileSync(backup.filePath, restoredPath);
    const verification = verifyRestoredDatabase(restoredPath);
    recordCheck('ok', backup.name, {
      bytes: fs.statSync(restoredPath).size,
      ...verification
    });
    console.log(JSON.stringify({
      ok: true,
      backup: backup.name,
      restoredBytes: fs.statSync(restoredPath).size,
      counts: verification.counts
    }));
  } catch (error) {
    recordCheck('failed', backup.name, { error: error.message });
    await notifyOperations('backup_restore_verification_failed', {
      backup: backup.name,
      error: error.message
    });
    throw error;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch(async (error) => {
  if (!latestBackup()) {
    try {
      recordCheck('failed', '', { error: error.message });
      await notifyOperations('backup_restore_verification_failed', { error: error.message });
    } catch (recordError) {
      console.error(`Restore verification recording failed: ${recordError.message}`);
    }
  }
  console.error(error.message);
  process.exitCode = 1;
});
