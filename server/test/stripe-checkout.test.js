const test = require('node:test');
const assert = require('node:assert/strict');
const {
  STRIPE_LOCAL_PAYMENT_METHODS,
  buildStripeCheckoutSession
} = require('../payment/stripe-checkout');

test('creates a USD Checkout Session using dashboard-managed payment methods', () => {
  const session = buildStripeCheckoutSession({
    orderId: 'order_123',
    siteUrl: 'https://northstar.example',
    description: 'MBTI 性格测试',
    payload: {
      amount: 9.99,
      planName: '单项完整解读',
      planId: 'single',
      testType: 'mbti',
      returnPath: '#/mbti-result'
    }
  });

  assert.equal(session.mode, 'payment');
  assert.equal(session.locale, 'zh');
  assert.equal(session.customer_creation, 'always');
  assert.equal(session.billing_address_collection, 'auto');
  assert.deepEqual(session.automatic_tax, { enabled: false });
  assert.equal(session.client_reference_id, 'order_123');
  assert.equal(session.line_items[0].price_data.currency, 'usd');
  assert.equal(session.line_items[0].price_data.unit_amount, 999);
  assert.equal(session.metadata.requestedLocalPaymentMethods, '');
  assert.equal(session.payment_method_types, undefined);
  assert.equal(
    session.success_url,
    'https://northstar.example/#/payment-return?orderId=order_123&provider=stripe'
  );
  assert.equal(session.cancel_url, 'https://northstar.example/#/mbti-result');
});

test('enables Stripe Tax only when explicitly requested', () => {
  const session = buildStripeCheckoutSession({
    orderId: 'order_tax',
    siteUrl: 'https://northstar.example',
    description: 'Digital report',
    automaticTax: true,
    productTaxCode: 'txcd_10103001',
    payload: {
      amount: 9.99,
      planName: 'Full Single Reading',
      planId: 'single',
      testType: 'mbti',
      locale: 'en'
    }
  });

  assert.deepEqual(session.automatic_tax, { enabled: true });
  assert.equal(session.billing_address_collection, 'auto');
  assert.equal(session.customer_creation, 'always');
  assert.equal(session.line_items[0].price_data.product_data.tax_code, 'txcd_10103001');
});

test('uses Stripe dynamic payment methods without requesting CNY-only methods', () => {
  assert.deepEqual(STRIPE_LOCAL_PAYMENT_METHODS, []);
});

test('creates an English Stripe Checkout Session and preserves locale on return', () => {
  const session = buildStripeCheckoutSession({
    orderId: 'order_en',
    payload: {
      amount: 9.99,
      planId: 'single',
      planName: 'Full Single Reading',
      testType: 'astrology',
      returnPath: '#/astrology',
      locale: 'en'
    },
    description: 'Natal Chart',
    siteUrl: 'https://northstar.example'
  });

  assert.equal(session.locale, 'en');
  assert.equal(session.line_items[0].price_data.currency, 'usd');
  assert.equal(session.line_items[0].price_data.unit_amount, 999);
  assert.equal(session.line_items[0].price_data.product_data.name, 'Full Single Reading');
  assert.equal(session.metadata.locale, 'en');
  assert.equal(
    session.success_url,
    'https://northstar.example/?lang=en#/payment-return?orderId=order_en&provider=stripe'
  );
  assert.equal(session.cancel_url, 'https://northstar.example/?lang=en#/astrology');
});
