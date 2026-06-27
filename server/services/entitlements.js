const PLAN_UNLOCKS = Object.freeze({
  trial: [],
  single: [],
  'self-core': ['mbti', 'attachment'],
  'advanced-personality': ['enneagram', 'jung8'],
  'dark-side': ['shadow', 'darktriad', 'saboteurs', 'defense'],
  'destiny-map': ['astrology', 'bazi', 'human-design'],
  'energy-healing': ['aura', 'tarot', 'color'],
  'relationship-plus': ['synastry', 'relationship-ai', 'mbti', 'attachment'],
  'relationship-ai': ['relationship-ai'],
  'all-access': [
    'mbti',
    'attachment',
    'relationship-ai',
    'tarot',
    'astrology',
    'bazi',
    'human-design',
    'synastry',
    'aura',
    'shadow',
    'color',
    'enneagram',
    'jung8',
    'darktriad',
    'saboteurs',
    'defense'
  ],
  'astro-tarot': ['astrology', 'tarot'],
  'synastry-ai': ['synastry', 'relationship-ai'],
  relationship: ['synastry', 'mbti', 'attachment', 'astrology', 'tarot']
});

function parsePayload(row) {
  try {
    return row && row.payload ? JSON.parse(row.payload) : {};
  } catch (error) {
    return {};
  }
}

function normalizeTestType(raw, knownTests = null) {
  const value = String(raw || '')
    .replace(/^#\/?/, '')
    .replace(/-result$/, '')
    .split(/[/?#]/)[0];
  if (!value) return '';
  if (knownTests && !knownTests.has(value)) return '';
  return value;
}

function getOrderUnlockTests(order, knownTests = null) {
  const payload = parsePayload(order);
  if (payload.planId === 'trial') return [];

  const requested = Array.isArray(payload.unlockTests) ? payload.unlockTests : [];
  const catalog = Object.prototype.hasOwnProperty.call(PLAN_UNLOCKS, payload.planId)
    ? PLAN_UNLOCKS[payload.planId]
    : [];
  const orderedTestType = normalizeTestType(payload.testType || order && order.test_type, knownTests);

  return [...new Set([
    ...requested,
    ...catalog,
    ...(orderedTestType ? [orderedTestType] : [])
  ].map((item) => normalizeTestType(item, knownTests)).filter(Boolean))];
}

function orderUnlocksTest(order, testType, knownTests = null) {
  if (!order || order.status !== 'paid') return false;
  const normalized = normalizeTestType(testType, knownTests);
  return normalized ? getOrderUnlockTests(order, knownTests).includes(normalized) : false;
}

function buildAccessSummary(order, knownTests = null) {
  const payload = parsePayload(order);
  const paid = Boolean(order && order.status === 'paid' && payload.planId !== 'trial');
  return {
    orderId: order && order.id || '',
    status: order && order.status || 'missing',
    paid,
    provider: payload.provider || order && order.provider || '',
    planId: payload.planId || '',
    planName: payload.planName || '',
    amount: Number(payload.amount || 0),
    currency: payload.currency || 'USD',
    testType: normalizeTestType(payload.testType || order && order.test_type, knownTests),
    unlockTests: paid ? getOrderUnlockTests(order, knownTests) : [],
    paidAt: order && order.paid_at || payload.paidAt || ''
  };
}

module.exports = {
  PLAN_UNLOCKS,
  parsePayload,
  normalizeTestType,
  getOrderUnlockTests,
  orderUnlocksTest,
  buildAccessSummary
};
