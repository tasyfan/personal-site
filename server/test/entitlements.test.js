const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildAccessSummary,
  getOrderUnlockTests,
  orderUnlocksTest
} = require('../services/entitlements');

function order(status, payload) {
  return {
    id: 'order_123',
    status,
    test_type: 'payment',
    paid_at: status === 'paid' ? '2026-06-20 00:00:00' : null,
    payload: JSON.stringify(payload)
  };
}

test('paid bundle grants only its server-defined tests', () => {
  const paid = order('paid', {
    planId: 'self-core',
    testType: 'mbti',
    unlockTests: ['mbti', 'attachment']
  });
  assert.deepEqual(getOrderUnlockTests(paid), ['mbti', 'attachment']);
  assert.equal(orderUnlocksTest(paid, 'mbti'), true);
  assert.equal(orderUnlocksTest(paid, 'attachment'), true);
  assert.equal(orderUnlocksTest(paid, 'tarot'), false);
});

test('trial, refunded, and pending orders do not grant premium access', () => {
  assert.equal(orderUnlocksTest(order('paid', { planId: 'trial', testType: 'mbti' }), 'mbti'), false);
  assert.equal(orderUnlocksTest(order('refunded', { planId: 'single', testType: 'mbti' }), 'mbti'), false);
  assert.equal(orderUnlocksTest(order('pending', { planId: 'single', testType: 'mbti' }), 'mbti'), false);
});

test('access summary is suitable for cross-device restoration', () => {
  const summary = buildAccessSummary(order('paid', {
    planId: 'single',
    planName: 'Full Single Reading',
    testType: 'enneagram',
    amount: 9.99,
    currency: 'USD',
    provider: 'stripe'
  }));
  assert.equal(summary.paid, true);
  assert.equal(summary.currency, 'USD');
  assert.deepEqual(summary.unlockTests, ['enneagram']);
});
