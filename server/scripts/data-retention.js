const Database = require('better-sqlite3');
const path = require('path');
const { notifyOperations } = require('../services/notifications');

const dbPath = process.env.NORTHSTAR_DB_PATH
  ? path.resolve(process.env.NORTHSTAR_DB_PATH)
  : path.resolve(__dirname, '../northstar.db');
const supportDays = Math.max(Number(process.env.SUPPORT_RETENTION_DAYS || 90), 30);
const analyticsDays = Math.max(Number(process.env.ANALYTICS_RETENTION_DAYS || 180), 30);
const operationalDays = Math.max(Number(process.env.OPERATIONS_RETENTION_DAYS || 180), 30);

function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_retention_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL,
      details TEXT,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_data_retention_checks_checked
    ON data_retention_checks(checked_at);
  `);
}

async function main() {
  const db = new Database(dbPath, { fileMustExist: true });
  try {
    ensureSchema(db);
    const run = db.transaction(() => {
      const support = db.prepare(`
        UPDATE support_requests
        SET contact = '[removed]',
            message = '[removed after retention period]',
            updated_at = CURRENT_TIMESTAMP
        WHERE status IN ('resolved', 'closed')
          AND updated_at < datetime('now', ?)
          AND (contact != '[removed]' OR message != '[removed after retention period]')
      `).run(`-${supportDays} days`).changes;

      const productEvents = db.prepare(`
        DELETE FROM product_events
        WHERE created_at < datetime('now', ?)
      `).run(`-${analyticsDays} days`).changes;

      const operationsChecks = db.prepare(`
        DELETE FROM operations_checks
        WHERE checked_at < datetime('now', ?)
      `).run(`-${operationalDays} days`).changes;
      const resolvedAlerts = db.prepare(`
        DELETE FROM operations_alerts
        WHERE status = 'resolved'
          AND updated_at < datetime('now', ?)
      `).run(`-${operationalDays} days`).changes;
      const restoreChecks = db.prepare(`
        DELETE FROM backup_restore_checks
        WHERE checked_at < datetime('now', ?)
      `).run(`-${operationalDays} days`).changes;
      const previousRetentionChecks = db.prepare(`
        DELETE FROM data_retention_checks
        WHERE checked_at < datetime('now', ?)
      `).run(`-${operationalDays} days`).changes;

      return {
        anonymizedSupportRequests: support,
        deletedProductEvents: productEvents,
        deletedOperationsChecks: operationsChecks,
        deletedResolvedAlerts: resolvedAlerts,
        deletedRestoreChecks: restoreChecks,
        deletedRetentionChecks: previousRetentionChecks
      };
    });
    const details = run();
    db.prepare(`
      INSERT INTO data_retention_checks (status, details)
      VALUES ('ok', ?)
    `).run(JSON.stringify({
      supportDays,
      analyticsDays,
      operationalDays,
      ...details
    }));
    console.log(JSON.stringify({ ok: true, ...details }));
  } finally {
    db.close();
  }
}

main().catch(async (error) => {
  try {
    const db = new Database(dbPath, { fileMustExist: true });
    ensureSchema(db);
    db.prepare(`
      INSERT INTO data_retention_checks (status, details)
      VALUES ('failed', ?)
    `).run(JSON.stringify({ error: error.message }));
    db.close();
  } catch (recordError) {
    console.error(`Retention recording failed: ${recordError.message}`);
  }
  await notifyOperations('data_retention_failed', { error: error.message });
  console.error(error.message);
  process.exitCode = 1;
});
