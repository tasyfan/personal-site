const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();
const ALLOWED_EVENTS = new Set([
  'payment_modal_opened',
  'checkout_created',
  'checkout_redirected',
  'payment_confirmed',
  'report_generated',
  'report_failed',
  'restore_succeeded',
  'restore_failed',
  'support_submitted'
]);

function clamp(value, max) {
  return String(value || '').trim().slice(0, max);
}

function requireAdmin(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  const provided = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(503).json({ error: 'Admin token is not configured' });
  if (provided !== token) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function sanitizeMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const output = {};
  for (const [key, item] of Object.entries(value).slice(0, 12)) {
    const safeKey = clamp(key, 40);
    if (!safeKey) continue;
    if (typeof item === 'number' || typeof item === 'boolean') output[safeKey] = item;
    else output[safeKey] = clamp(item, 160);
  }
  return output;
}

router.post('/event', (req, res) => {
  const eventName = clamp(req.body && req.body.eventName, 50);
  if (!ALLOWED_EVENTS.has(eventName)) return res.status(400).json({ error: 'Unsupported event' });

  db.prepare(`
    INSERT INTO product_events (id, event_name, session_id, order_id, test_type, plan_id, locale, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    eventName,
    clamp(req.body && req.body.sessionId, 80),
    clamp(req.body && req.body.orderId, 120),
    clamp(req.body && req.body.testType, 40),
    clamp(req.body && req.body.planId, 40),
    clamp(req.body && req.body.locale, 20),
    JSON.stringify(sanitizeMetadata(req.body && req.body.metadata))
  );
  res.status(202).json({ accepted: true });
});

router.get('/admin/summary', requireAdmin, (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 180);
  const rows = db.prepare(`
    SELECT event_name, COUNT(*) AS count
    FROM product_events
    WHERE created_at >= datetime('now', ?)
    GROUP BY event_name
  `).all(`-${days} days`);
  const events = Object.fromEntries(rows.map((row) => [row.event_name, row.count]));
  const opened = events.payment_modal_opened || 0;
  const created = events.checkout_created || 0;
  const confirmed = events.payment_webhook_paid || events.payment_confirmed || 0;
  const generated = events.report_generated || 0;
  const operations = db.prepare(`
    SELECT status, issues, checked_at
    FROM operations_checks
    ORDER BY checked_at DESC, id DESC
    LIMIT 1
  `).get() || null;
  const backupRestore = db.prepare(`
    SELECT status, backup_name, details, checked_at
    FROM backup_restore_checks
    ORDER BY checked_at DESC, id DESC
    LIMIT 1
  `).get() || null;
  const dataRetention = db.prepare(`
    SELECT status, details, checked_at
    FROM data_retention_checks
    ORDER BY checked_at DESC, id DESC
    LIMIT 1
  `).get() || null;
  res.json({
    days,
    events,
    operations: operations
      ? {
        status: operations.status,
        issues: (() => {
          try { return JSON.parse(operations.issues || '[]'); } catch (error) { return []; }
        })(),
        checkedAt: operations.checked_at
      }
      : null,
    backupRestore: backupRestore
      ? {
        status: backupRestore.status,
        backupName: backupRestore.backup_name,
        details: (() => {
          try { return JSON.parse(backupRestore.details || '{}'); } catch (error) { return {}; }
        })(),
        checkedAt: backupRestore.checked_at
      }
      : null,
    dataRetention: dataRetention
      ? {
        status: dataRetention.status,
        details: (() => {
          try { return JSON.parse(dataRetention.details || '{}'); } catch (error) { return {}; }
        })(),
        checkedAt: dataRetention.checked_at
      }
      : null,
    rates: {
      checkoutCreation: opened ? Number((created / opened).toFixed(4)) : 0,
      paymentConversion: created ? Number((confirmed / created).toFixed(4)) : 0,
      reportDelivery: confirmed ? Number((generated / confirmed).toFixed(4)) : 0
    }
  });
});

router.get('/admin/alerts', requireAdmin, (req, res) => {
  const status = clamp(req.query.status, 20);
  const allowedStatuses = new Set(['open', 'acknowledged', 'resolved']);
  const params = [];
  let where = '';
  if (allowedStatuses.has(status)) {
    where = 'WHERE status = ?';
    params.push(status);
  }
  const alerts = db.prepare(`
    SELECT id, event_name, severity, status, details, delivery_status, delivery_error, created_at, updated_at
    FROM operations_alerts
    ${where}
    ORDER BY
      CASE severity WHEN 'critical' THEN 0 ELSE 1 END,
      created_at DESC
    LIMIT 200
  `).all(...params).map((row) => ({
    ...row,
    details: (() => {
      try { return JSON.parse(row.details || '{}'); } catch (error) { return {}; }
    })()
  }));
  res.json({ alerts });
});

router.post('/admin/alerts/status', requireAdmin, (req, res) => {
  const id = clamp(req.body && req.body.id, 40);
  const status = clamp(req.body && req.body.status, 20);
  if (!id || !['open', 'acknowledged', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid alert status' });
  }
  const result = db.prepare(`
    UPDATE operations_alerts
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, id);
  if (!result.changes) return res.status(404).json({ error: 'Alert not found' });
  res.json({ updated: true });
});

module.exports = router;
