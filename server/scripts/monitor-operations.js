const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { notifyOperations } = require('../services/notifications');

const dbPath = process.env.NORTHSTAR_DB_PATH
  ? path.resolve(process.env.NORTHSTAR_DB_PATH)
  : path.resolve(__dirname, '../northstar.db');
const backupDir = path.resolve(process.env.BACKUP_DIR || '/opt/northstar/backups');
const healthUrl = process.env.HEALTHCHECK_URL || 'http://127.0.0.1:3001/api/health';

function latestBackup() {
  if (!fs.existsSync(backupDir)) return null;
  const files = fs.readdirSync(backupDir)
    .filter((name) => /^northstar-auto-\d{8}T\d{6}Z\.db$/.test(name))
    .map((name) => {
      const filePath = path.join(backupDir, name);
      return { name, filePath, mtimeMs: fs.statSync(filePath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  return files[0] || null;
}

async function main() {
  const issues = [];
  let db = null;
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok !== true) issues.push(`API health check failed (${response.status})`);
  } catch (error) {
    issues.push(`API health check failed (${error.message})`);
  }

  if (!fs.existsSync(dbPath)) {
    issues.push('Database file is missing');
  } else {
    db = new Database(dbPath, { fileMustExist: true });
    try {
      const quickCheck = db.pragma('quick_check', { simple: true });
      if (quickCheck !== 'ok') issues.push(`SQLite quick_check returned ${quickCheck}`);
      const staleSupport = db.prepare(`
        SELECT COUNT(*) AS count
        FROM support_requests
        WHERE status IN ('open', 'in_progress')
          AND created_at < datetime('now', '-24 hours')
      `).get().count;
      if (staleSupport > 0) issues.push(`${staleSupport} support ticket(s) are older than 24 hours`);

      const recentReportFailures = db.prepare(`
        SELECT COUNT(*) AS count
        FROM product_events
        WHERE event_name = 'report_failed'
          AND created_at >= datetime('now', '-30 minutes')
      `).get().count;
      if (recentReportFailures >= 3) {
        issues.push(`${recentReportFailures} report failures occurred in the last 30 minutes`);
      }

      const recentWebhookFailures = db.prepare(`
        SELECT COUNT(*) AS count
        FROM payment_events
        WHERE event_type IN ('checkout.session.async_payment_failed', 'charge.dispute.created')
          AND created_at >= datetime('now', '-60 minutes')
      `).get().count;
      if (recentWebhookFailures >= 2) {
        issues.push(`${recentWebhookFailures} payment failure/dispute events occurred in the last hour`);
      }

      const latestRestoreCheck = db.prepare(`
        SELECT status, checked_at
        FROM backup_restore_checks
        ORDER BY checked_at DESC, id DESC
        LIMIT 1
      `).get();
      if (!latestRestoreCheck) {
        issues.push('No backup restore verification has been recorded');
      } else if (latestRestoreCheck.status !== 'ok') {
        issues.push(`Latest backup restore verification is ${latestRestoreCheck.status}`);
      } else {
        const restoreAge = db.prepare(`
          SELECT (julianday('now') - julianday(?)) * 24 AS hours
        `).get(latestRestoreCheck.checked_at).hours;
        if (restoreAge > 192) issues.push(`Latest backup restore verification is ${restoreAge.toFixed(1)} hours old`);
      }

      const latestRetentionCheck = db.prepare(`
        SELECT status, checked_at
        FROM data_retention_checks
        ORDER BY checked_at DESC, id DESC
        LIMIT 1
      `).get();
      if (!latestRetentionCheck) {
        issues.push('No data retention cleanup has been recorded');
      } else if (latestRetentionCheck.status !== 'ok') {
        issues.push(`Latest data retention cleanup is ${latestRetentionCheck.status}`);
      } else {
        const retentionAge = db.prepare(`
          SELECT (julianday('now') - julianday(?)) * 24 AS hours
        `).get(latestRetentionCheck.checked_at).hours;
        if (retentionAge > 36) issues.push(`Latest data retention cleanup is ${retentionAge.toFixed(1)} hours old`);
      }
    } catch (error) {
      issues.push(`Database operational check failed (${error.message})`);
    }
  }

  const backup = latestBackup();
  if (!backup) {
    issues.push('No automatic database backup was found');
  } else {
    const ageHours = (Date.now() - backup.mtimeMs) / 3_600_000;
    if (ageHours > 36) issues.push(`Latest automatic backup is ${ageHours.toFixed(1)} hours old`);
  }

  if (issues.length) {
    if (db) {
      db.prepare(`
        INSERT INTO operations_checks (status, issues)
        VALUES ('failed', ?)
      `).run(JSON.stringify(issues));
      db.close();
    }
    await notifyOperations('operations_monitor_failed', {
      issueCount: issues.length,
      issues: issues.join(' | '),
      host: process.env.PUBLIC_SITE_URL || 'northstar'
    });
    console.error(JSON.stringify({ ok: false, issues }));
    process.exitCode = 1;
    return;
  }

  if (db) {
    db.prepare(`
      INSERT INTO operations_checks (status, issues)
      VALUES ('ok', '[]')
    `).run();
    db.prepare(`
      DELETE FROM operations_checks
      WHERE checked_at < datetime('now', '-90 days')
    `).run();
    db.prepare(`
      UPDATE operations_alerts
      SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
      WHERE event_name IN ('operations_monitor_failed', 'operations_monitor_crashed')
        AND status IN ('open', 'acknowledged')
    `).run();
    db.close();
  }
  console.log(JSON.stringify({
    ok: true,
    healthUrl,
    database: dbPath,
    latestBackup: backup && backup.name
  }));
}

main().catch(async (error) => {
  await notifyOperations('operations_monitor_crashed', { error: error.message });
  console.error(error.message);
  process.exitCode = 1;
});
