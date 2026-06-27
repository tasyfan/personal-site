const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function clamp(value, max = 1200) {
  return String(value || '').trim().slice(0, max);
}

const ACTIONABLE_EVENTS = new Set([
  'payment_failed',
  'payment_refunded',
  'payment_disputed',
  'support_ticket_created',
  'test_ai_provider_failed',
  'relationship_ai_provider_failed',
  'server_request_error',
  'operations_monitor_failed',
  'operations_monitor_crashed',
  'backup_restore_verification_failed',
  'data_retention_failed'
]);

function severityFor(eventName) {
  if (['payment_disputed', 'server_request_error', 'operations_monitor_failed', 'operations_monitor_crashed', 'backup_restore_verification_failed', 'data_retention_failed'].includes(eventName)) {
    return 'critical';
  }
  return 'warning';
}

function sanitizeDetails(details = {}) {
  const safeDetails = {};
  for (const [key, value] of Object.entries(details).slice(0, 20)) {
    const safeKey = clamp(key, 50);
    if (!safeKey || /(?:email|contact|message|chat|token|secret|password)/i.test(safeKey)) continue;
    safeDetails[safeKey] = typeof value === 'number' || typeof value === 'boolean'
      ? value
      : clamp(value);
  }
  return safeDetails;
}

function createAlert(eventName, details) {
  if (!ACTIONABLE_EVENTS.has(eventName)) return null;
  const existing = db.prepare(`
    SELECT id
    FROM operations_alerts
    WHERE event_name = ?
      AND details = ?
      AND status = 'open'
      AND created_at >= datetime('now', '-10 minutes')
    ORDER BY created_at DESC
    LIMIT 1
  `).get(eventName, JSON.stringify(details));
  if (existing) return existing.id;

  const id = `ALT-${uuidv4().slice(0, 8).toUpperCase()}`;
  db.prepare(`
    INSERT INTO operations_alerts (id, event_name, severity, details)
    VALUES (?, ?, ?, ?)
  `).run(id, eventName, severityFor(eventName), JSON.stringify(details));
  return id;
}

function updateDelivery(id, delivered, error = '') {
  if (!id) return;
  db.prepare(`
    UPDATE operations_alerts
    SET delivery_status = ?,
        delivery_error = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(delivered ? 'delivered' : 'not_delivered', clamp(error, 500), id);
}

function getNotificationConfig() {
  return {
    configured: Boolean(process.env.SUPPORT_NOTIFICATION_WEBHOOK_URL),
    timeoutMs: Math.max(Number(process.env.NOTIFICATION_TIMEOUT_MS || 5000), 1000),
    persistentInbox: true
  };
}

async function notifyOperations(eventName, details = {}) {
  const safeEventName = clamp(eventName, 80);
  const safeDetails = sanitizeDetails(details);
  const alertId = createAlert(safeEventName, safeDetails);
  const url = process.env.SUPPORT_NOTIFICATION_WEBHOOK_URL;
  if (!url) {
    updateDelivery(alertId, false, 'not-configured');
    return { delivered: false, reason: 'not-configured', alertId };
  }

  const payload = {
    text: `[Northstar] ${safeEventName}`,
    event: safeEventName,
    details: safeDetails,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(getNotificationConfig().timeoutMs)
    });
    if (!response.ok) throw new Error(`notification returned ${response.status}`);
    updateDelivery(alertId, true);
    return { delivered: true, alertId };
  } catch (error) {
    console.error('Operations notification failed:', error.message);
    updateDelivery(alertId, false, error.message);
    return { delivered: false, reason: error.message, alertId };
  }
}

module.exports = {
  getNotificationConfig,
  notifyOperations,
  sanitizeDetails,
  severityFor
};
