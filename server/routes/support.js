const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { notifyOperations } = require('../services/notifications');

const router = express.Router();
const SUPPORT_STATUSES = new Set(['open', 'in_progress', 'resolved', 'closed']);

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

router.post('/', async (req, res) => {
  const english = String(req.body && req.body.locale || '').toLowerCase().startsWith('en');
  const contact = clamp(req.body && req.body.contact, 160);
  const category = clamp(req.body && req.body.category, 40) || 'other';
  const orderId = clamp(req.body && req.body.orderId, 120);
  const message = clamp(req.body && req.body.message, 3000);

  if (!contact || !message) {
    return res.status(400).json({
      error: english ? 'Please provide contact information and an issue description.' : '请填写联系方式和问题说明。'
    });
  }

  const id = `SUP-${uuidv4().slice(0, 8).toUpperCase()}`;
  db.prepare(`
    INSERT INTO support_requests (id, contact, category, order_id, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, contact, category, orderId, message);

  void notifyOperations('support_ticket_created', {
    ticketId: id,
    contact,
    category,
    orderId,
    message
  });

  res.status(201).json({
    id,
    message: english
      ? 'Your support ticket has been submitted. Save the ticket ID; our team will contact you using the information provided.'
      : '工单已提交。请保存工单编号，运营人员会通过你留下的方式联系。'
  });
});

router.get('/admin', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT id, contact, category, order_id, message, status, created_at, updated_at
    FROM support_requests
    ORDER BY created_at DESC
    LIMIT 200
  `).all();
  res.json({ requests: rows });
});

router.post('/admin/status', requireAdmin, (req, res) => {
  const id = clamp(req.body && req.body.id, 40);
  const status = clamp(req.body && req.body.status, 30);
  if (!id || !SUPPORT_STATUSES.has(status)) {
    return res.status(400).json({ error: 'A valid ticket id and status are required' });
  }
  const result = db.prepare(`
    UPDATE support_requests
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, id);
  if (!result.changes) return res.status(404).json({ error: 'Support ticket not found' });
  res.json({ success: true, id, status });
});

module.exports = router;
