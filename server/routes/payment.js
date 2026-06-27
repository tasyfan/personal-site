const express = require('express');
const crypto = require('crypto');
const Stripe = require('stripe');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const {
  STRIPE_LOCAL_PAYMENT_METHODS,
  buildStripeCheckoutSession
} = require('../payment/stripe-checkout');
const {
  buildAccessSummary,
  parsePayload
} = require('../services/entitlements');
const {
  getNotificationConfig,
  notifyOperations
} = require('../services/notifications');

const router = express.Router();
const paymentMode = process.env.PAYMENT_MODE || 'disabled';
const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://northstar.fantasy-games.org').replace(/\/$/, '');
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
  : null;
const ORDER_STATUSES = new Set(['pending', 'reviewing', 'paid', 'canceled', 'refunded', 'disputed']);
const WECHAT_NATIVE_PATH = '/v3/pay/transactions/native';
const WECHAT_GATEWAY = process.env.WECHATPAY_GATEWAY || 'https://api.mch.weixin.qq.com';
const ALIPAY_GATEWAY = process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do';
const PAYMENT_CURRENCY = 'USD';
const stripeTaxEnabled = String(process.env.STRIPE_TAX_ENABLED || '').toLowerCase() === 'true';
const taxComplianceStatus = ['pending', 'not-required', 'registered']
  .includes(String(process.env.TAX_COMPLIANCE_STATUS || '').toLowerCase())
  ? String(process.env.TAX_COMPLIANCE_STATUS).toLowerCase()
  : 'pending';

const PLAN_CATALOG = {
  trial: { name: '体验解读', price: 1.99, tests: [] },
  single: { name: '单项完整解读', price: 7.99, tests: null },
  'self-core': { name: '基础人格组合', price: 14.99, tests: ['mbti', 'attachment'] },
  'advanced-personality': { name: '高阶性格探究', price: 14.99, tests: ['enneagram', 'jung8'] },
  'dark-side': { name: '潜意识与防线', price: 24.99, tests: ['shadow', 'darktriad', 'saboteurs', 'defense'] },
  'destiny-map': { name: '命理人生图谱', price: 19.99, tests: ['astrology', 'bazi', 'human-design'] },
  'energy-healing': { name: '能量与运势疗愈', price: 14.99, tests: ['aura', 'tarot', 'color'] },
  'relationship-plus': { name: '双人合盘与 AI 建议', price: 24.99, tests: ['synastry', 'relationship-ai', 'mbti', 'attachment'] },
  'relationship-ai': { name: 'AI 情感分析', price: 12.99, tests: ['relationship-ai'] },
  'all-access': { name: '全站早鸟解锁', price: 39.99, tests: ['mbti', 'attachment', 'relationship-ai', 'tarot', 'astrology', 'bazi', 'human-design', 'synastry', 'aura', 'shadow', 'color', 'enneagram', 'jung8', 'darktriad', 'saboteurs', 'defense'] }
};

const TEST_CATALOG = {
  mbti: 'MBTI 性格测试',
  attachment: '恋爱依恋测试',
  'relationship-ai': 'AI 情感阶段分析',
  tarot: '塔罗牌占卜',
  astrology: '本命星盘解析',
  bazi: '八字命理排盘',
  'human-design': '人类图解析',
  synastry: '双人契合度合盘',
  aura: '灵魂光环测试',
  shadow: '暗影原型测试',
  color: '色彩心理测试',
  enneagram: '九型人格测试',
  jung8: '荣格八维测试',
  darktriad: '黑暗三角测试',
  saboteurs: '内在破坏者测试',
  defense: '心理防御机制测试'
};

const PLAN_NAMES_EN = {
  trial: 'Quick Insight',
  single: 'Full Single Reading',
  'self-core': 'Personality Essentials Bundle',
  'advanced-personality': 'Advanced Personality Bundle',
  'dark-side': 'Shadow & Defense Bundle',
  'destiny-map': 'Destiny Map Bundle',
  'energy-healing': 'Energy & Intuition Bundle',
  'relationship-plus': 'Compatibility + AI Guidance',
  'relationship-ai': 'AI Relationship Analysis',
  'all-access': 'All-Access Pass'
};

const TEST_NAMES_EN = {
  mbti: 'MBTI Personality',
  attachment: 'Attachment Style',
  'relationship-ai': 'AI Relationship Analysis',
  tarot: 'Tarot Reading',
  astrology: 'Natal Chart',
  bazi: 'BaZi Reading',
  'human-design': 'Human Design',
  synastry: 'Relationship Compatibility',
  aura: 'Aura Reading',
  shadow: 'Shadow Archetype',
  color: 'Color Psychology',
  enneagram: 'Enneagram',
  jung8: 'Jungian Cognitive Functions',
  darktriad: 'Dark Triad',
  saboteurs: 'Inner Saboteurs',
  defense: 'Psychological Defense Style'
};

function normalizeLocale(value) {
  return String(value || '').toLowerCase().startsWith('en') ? 'en' : 'zh-CN';
}

function requireAdmin(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  const header = req.get('authorization') || '';
  const provided = header.replace(/^Bearer\s+/i, '');

  if (!token) return res.status(503).json({ error: 'Admin token is not configured' });
  if (provided !== token) return res.status(401).json({ error: 'Unauthorized' });

  next();
}

function normalizeTestType(raw) {
  const value = String(raw || 'tarot').replace(/^#\/?/, '').replace(/-result$/, '').split(/[/?#]/)[0];
  return TEST_CATALOG[value] ? value : 'tarot';
}

function buildOrderPayload(req) {
  const testType = normalizeTestType(req.body && req.body.testType);
  const planId = PLAN_CATALOG[req.body && req.body.planId] ? req.body.planId : 'single';
  const plan = PLAN_CATALOG[planId];
  const unlockTests = Array.isArray(plan.tests) ? plan.tests : [testType];
  const provider = 'stripe';
  const locale = normalizeLocale(req.body && req.body.locale);

  return {
    source: 'payment-modal',
    testType,
    planId,
    planName: locale === 'en' ? PLAN_NAMES_EN[planId] : plan.name,
    amount: plan.price,
    currency: PAYMENT_CURRENCY,
    provider,
    locale,
    unlockTests,
    relatedOrderId: req.body && req.body.relatedOrderId ? String(req.body.relatedOrderId).slice(0, 120) : '',
    createdFrom: req.get('origin') || siteUrl,
    returnPath: req.body && req.body.returnPath ? String(req.body.returnPath).slice(0, 160) : ''
  };
}

function describeOrderScope(payload) {
  const unlockTests = Array.isArray(payload.unlockTests) ? payload.unlockTests : [];
  const names = payload.locale === 'en' ? TEST_NAMES_EN : TEST_CATALOG;
  if (!unlockTests.length) {
    return payload.locale === 'en'
      ? `${names[payload.testType] || 'Current reading'} quick insight`
      : `${names[payload.testType] || '当前测试'}体验解读`;
  }
  return unlockTests.map((id) => names[id] || id).join(' / ');
}

function updateOrderPayload(orderId, patch) {
  const row = db.prepare('SELECT payload FROM orders WHERE id = ?').get(orderId);
  const payload = { ...parsePayload(row), ...patch };
  db.prepare("UPDATE orders SET payload = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(JSON.stringify(payload), orderId);
  return payload;
}

function setOrderStatus(orderId, status, patch = {}) {
  if (!ORDER_STATUSES.has(status)) throw new Error(`Unsupported order status: ${status}`);
  if (patch && Object.keys(patch).length) updateOrderPayload(orderId, patch);
  const payload = patch || {};
  db.prepare(`
    UPDATE orders
    SET status = ?,
        provider = COALESCE(?, provider),
        gateway_event_id = COALESCE(?, gateway_event_id),
        gateway_trade_no = COALESCE(?, gateway_trade_no),
        paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, CURRENT_TIMESTAMP) ELSE paid_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    status,
    payload.provider || null,
    payload.gatewayEventId || payload.stripeEventId || null,
    payload.gatewayTradeNo || payload.stripePaymentIntent || payload.wechatTransactionId || payload.alipayTradeNo || null,
    status,
    orderId
  );
}

function markOrderPaid(orderId, patch = {}) {
  setOrderStatus(orderId, 'paid', patch);
}

function findStripeOrderByPaymentIntent(paymentIntent) {
  if (!paymentIntent) return null;
  return db.prepare(`
    SELECT *
    FROM orders
    WHERE gateway_trade_no = ?
       OR json_extract(payload, '$.stripePaymentIntent') = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(paymentIntent, paymentIntent);
}

function stripeObjectId(value) {
  return value && typeof value === 'object' ? value.id || '' : value || '';
}

function recordPaymentEvent({ id, provider, orderId = '', eventType = '', payload = {} }) {
  if (!id) return { duplicate: false };
  const result = db.prepare(`
    INSERT OR IGNORE INTO payment_events (id, provider, order_id, event_type, payload)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, provider, orderId, eventType, JSON.stringify(payload));
  return { duplicate: result.changes === 0 };
}

function getPaymentConfigStatus() {
  const stripeReady = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  const wechatWebhookReady = !!(process.env.WECHATPAY_PLATFORM_PUBLIC_KEY && process.env.WECHATPAY_API_V3_KEY);
  const alipayWebhookReady = !!process.env.ALIPAY_PUBLIC_KEY;
  const wechatPrepayReady = !!(
    process.env.WECHATPAY_APPID &&
    process.env.WECHATPAY_MCH_ID &&
    process.env.WECHATPAY_MCH_SERIAL_NO &&
    process.env.WECHATPAY_PRIVATE_KEY
  );
  const alipayPrepayReady = !!(process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY);

  return {
    paymentMode,
    siteUrl,
    tax: {
      complianceStatus: taxComplianceStatus,
      decisionConfirmed: taxComplianceStatus !== 'pending',
      stripeTaxEnabled,
      productTaxCodeConfigured: Boolean(process.env.STRIPE_PRODUCT_TAX_CODE),
      ready: taxComplianceStatus === 'not-required'
        || (taxComplianceStatus === 'registered' && stripeTaxEnabled)
    },
    providers: {
      manual: { ready: false, mode: 'disabled-for-usd' },
      stripe: {
        ready: stripeReady,
        checkoutReady: !!process.env.STRIPE_SECRET_KEY,
        webhookReady: !!process.env.STRIPE_WEBHOOK_SECRET,
        configurationMode: 'dashboard-dynamic',
        localPaymentMethods: STRIPE_LOCAL_PAYMENT_METHODS,
        missing: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'].filter((key) => !process.env[key])
      },
      wechat: {
        ready: false,
        webhookReady: wechatWebhookReady,
        prepayReady: wechatPrepayReady,
        missing: [
          'WECHATPAY_APPID',
          'WECHATPAY_MCH_ID',
          'WECHATPAY_MCH_SERIAL_NO',
          'WECHATPAY_PRIVATE_KEY',
          'WECHATPAY_PLATFORM_PUBLIC_KEY',
          'WECHATPAY_API_V3_KEY'
        ].filter((key) => !process.env[key]),
        note: 'Disabled because this checkout is priced in USD; native WeChat Pay orders require CNY.'
      },
      alipay: {
        ready: false,
        webhookReady: alipayWebhookReady,
        prepayReady: alipayPrepayReady,
        missing: ['ALIPAY_APP_ID', 'ALIPAY_PRIVATE_KEY', 'ALIPAY_PUBLIC_KEY'].filter((key) => !process.env[key]),
        note: 'Disabled because this checkout is priced in USD; direct Alipay precreate remains a CNY flow.'
      }
    }
  };
}

function timingSafeVerify(signature, expected) {
  const a = Buffer.from(String(signature || ''), 'base64');
  const b = Buffer.from(String(expected || ''), 'base64');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function normalizePrivateKey(value) {
  return String(value || '').replace(/\\n/g, '\n');
}

function jsonResponseError(status, body) {
  const error = new Error(body && (body.sub_msg || body.message || body.msg) ? (body.sub_msg || body.message || body.msg) : `Gateway request failed: ${status}`);
  error.status = status;
  error.gatewayBody = body;
  return error;
}

function signWechatMessage(method, requestPath, body) {
  const mchid = process.env.WECHATPAY_MCH_ID;
  const serialNo = process.env.WECHATPAY_MCH_SERIAL_NO;
  const privateKey = normalizePrivateKey(process.env.WECHATPAY_PRIVATE_KEY);
  if (!process.env.WECHATPAY_APPID) throw new Error('WECHATPAY_APPID is not configured');
  if (!mchid) throw new Error('WECHATPAY_MCH_ID is not configured');
  if (!serialNo) throw new Error('WECHATPAY_MCH_SERIAL_NO is not configured');
  if (!privateKey) throw new Error('WECHATPAY_PRIVATE_KEY is not configured');

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const message = `${method}\n${requestPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = crypto.createSign('RSA-SHA256').update(message).sign(privateKey, 'base64');
  const authorization = [
    'WECHATPAY2-SHA256-RSA2048',
    `mchid="${mchid}"`,
    `nonce_str="${nonce}"`,
    `timestamp="${timestamp}"`,
    `serial_no="${serialNo}"`,
    `signature="${signature}"`
  ].join(' ');

  return { authorization };
}

function verifyWechatResponse(headers, rawBody) {
  const publicKey = process.env.WECHATPAY_PLATFORM_PUBLIC_KEY;
  if (!publicKey) return true;
  const timestamp = headers.get('Wechatpay-Timestamp');
  const nonce = headers.get('Wechatpay-Nonce');
  const signature = headers.get('Wechatpay-Signature');
  if (!timestamp || !nonce || !signature) throw new Error('Missing WeChat Pay response signature headers');

  const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
  return crypto.createVerify('RSA-SHA256').update(message).verify(publicKey, signature, 'base64');
}

async function createWechatNativeOrder(orderId, payload, req) {
  const body = JSON.stringify({
    appid: process.env.WECHATPAY_APPID,
    mchid: process.env.WECHATPAY_MCH_ID,
    description: payload.planName,
    out_trade_no: orderId,
    notify_url: `${siteUrl}/api/payment/webhook/wechat`,
    amount: {
      total: Math.round(payload.amount * 100),
      currency: 'CNY'
    },
    attach: payload.planId,
    scene_info: {
      payer_client_ip: req.ip || '127.0.0.1'
    }
  });
  const { authorization } = signWechatMessage('POST', WECHAT_NATIVE_PATH, body);
  const response = await fetch(`${WECHAT_GATEWAY}${WECHAT_NATIVE_PATH}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorization
    },
    body
  });
  const rawBody = await response.text();
  const data = rawBody ? JSON.parse(rawBody) : {};
  if (!response.ok) throw jsonResponseError(response.status, data);
  if (!verifyWechatResponse(response.headers, rawBody)) throw new Error('Invalid WeChat Pay response signature');
  if (!data.code_url) throw new Error('WeChat Pay response missing code_url');

  const qrImageDataUrl = await QRCode.toDataURL(data.code_url, { margin: 1, width: 260 });
  updateOrderPayload(orderId, {
    provider: 'wechat',
    wechatCodeUrl: data.code_url,
    gatewayTradeNo: orderId,
    prepayCreatedAt: new Date().toISOString()
  });
  return { codeUrl: data.code_url, qrImageDataUrl };
}

function alipayTimestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function signAlipayParams(params) {
  const privateKey = normalizePrivateKey(process.env.ALIPAY_PRIVATE_KEY);
  if (!process.env.ALIPAY_APP_ID) throw new Error('ALIPAY_APP_ID is not configured');
  if (!privateKey) throw new Error('ALIPAY_PRIVATE_KEY is not configured');
  const content = Object.keys(params)
    .filter((key) => key !== 'sign' && params[key] !== undefined && params[key] !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createSign('RSA-SHA256').update(content, 'utf8').sign(privateKey, 'base64');
}

async function createAlipayPrecreateOrder(orderId, payload) {
  const bizContent = {
    out_trade_no: orderId,
    total_amount: Number(payload.amount).toFixed(2),
    subject: payload.planName,
    body: describeOrderScope(payload),
    timeout_express: '2h'
  };
  const params = {
    app_id: process.env.ALIPAY_APP_ID,
    method: 'alipay.trade.precreate',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: alipayTimestamp(),
    version: '1.0',
    notify_url: `${siteUrl}/api/payment/webhook/alipay`,
    biz_content: JSON.stringify(bizContent)
  };
  params.sign = signAlipayParams(params);

  const response = await fetch(ALIPAY_GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams(params)
  });
  const data = await response.json();
  const result = data.alipay_trade_precreate_response || {};
  if (!response.ok || result.code !== '10000') throw jsonResponseError(response.status, result);
  if (!result.qr_code) throw new Error('Alipay response missing qr_code');

  const qrImageDataUrl = await QRCode.toDataURL(result.qr_code, { margin: 1, width: 260 });
  updateOrderPayload(orderId, {
    provider: 'alipay',
    alipayQrCode: result.qr_code,
    gatewayTradeNo: orderId,
    prepayCreatedAt: new Date().toISOString()
  });
  return { codeUrl: result.qr_code, qrImageDataUrl };
}

function verifyWechatSignature(req, rawBody) {
  const publicKey = process.env.WECHATPAY_PLATFORM_PUBLIC_KEY;
  const apiV3Key = process.env.WECHATPAY_API_V3_KEY;
  if (!publicKey) throw new Error('WECHATPAY_PLATFORM_PUBLIC_KEY is not configured');
  if (!apiV3Key) throw new Error('WECHATPAY_API_V3_KEY is not configured');

  const timestamp = req.get('Wechatpay-Timestamp');
  const nonce = req.get('Wechatpay-Nonce');
  const signature = req.get('Wechatpay-Signature');
  if (!timestamp || !nonce || !signature) throw new Error('Missing WeChat Pay signature headers');

  const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
  return crypto.createVerify('RSA-SHA256').update(message).verify(publicKey, signature, 'base64');
}

function decryptWechatResource(resource) {
  if (!resource || !resource.ciphertext || !resource.nonce) {
    throw new Error('Missing WeChat encrypted resource');
  }
  const key = Buffer.from(process.env.WECHATPAY_API_V3_KEY, 'utf8');
  if (key.length !== 32) throw new Error('WECHATPAY_API_V3_KEY must be 32 bytes');

  const ciphertext = Buffer.from(resource.ciphertext, 'base64');
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const encrypted = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(resource.nonce, 'utf8'));
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
  }
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  return JSON.parse(decrypted);
}

function verifyAlipaySignature(params) {
  const publicKey = process.env.ALIPAY_PUBLIC_KEY;
  if (!publicKey) throw new Error('ALIPAY_PUBLIC_KEY is not configured');
  const sign = params.sign;
  if (!sign) throw new Error('Missing Alipay sign');

  const content = Object.keys(params)
    .filter((key) => key !== 'sign' && key !== 'sign_type' && params[key] !== undefined && params[key] !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createVerify('RSA-SHA256').update(content, 'utf8').verify(publicKey, sign, 'base64');
}

router.post('/create-intent', async (req, res) => {
  if (paymentMode === 'disabled') {
    return res.status(503).json({ error: 'Payment is not configured' });
  }
  if (req.body && req.body.planId === 'trial') {
    return res.status(400).json({ error: 'This legacy preview product is no longer available for purchase' });
  }

  const payload = buildOrderPayload(req);
  const orderId = uuidv4();

  db.prepare('INSERT INTO orders (id, test_type, payload, provider) VALUES (?, ?, ?, ?)')
    .run(orderId, 'payment', JSON.stringify(payload), payload.provider);

  if (payload.provider === 'stripe') {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    try {
      const session = await stripe.checkout.sessions.create(buildStripeCheckoutSession({
        orderId,
        payload,
        description: describeOrderScope(payload),
        siteUrl,
        automaticTax: stripeTaxEnabled,
        productTaxCode: process.env.STRIPE_PRODUCT_TAX_CODE || ''
      }));

      updateOrderPayload(orderId, {
        provider: 'stripe',
        stripeSessionId: session.id,
        stripePaymentStatus: session.payment_status
      });

      return res.json({ orderId, status: 'pending', paymentMode, provider: 'stripe', checkoutUrl: session.url });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Stripe checkout creation failed' });
    }
  }

  if (payload.provider === 'wechat' || payload.provider === 'alipay') {
    const config = getPaymentConfigStatus().providers[payload.provider];
    if (!config.prepayReady) {
      return res.status(503).json({
        orderId,
        status: 'pending',
        paymentMode,
        provider: payload.provider,
        gatewayConfigured: false,
        missing: config.missing,
        message: 'Official prepay is not fully configured. Use manual review until merchant credentials are added.'
      });
    }

    try {
      const result = payload.provider === 'wechat'
        ? await createWechatNativeOrder(orderId, payload, req)
        : await createAlipayPrecreateOrder(orderId, payload);
      return res.json({
        orderId,
        status: 'pending',
        paymentMode,
        provider: payload.provider,
        gatewayConfigured: true,
        qrCodeUrl: result.codeUrl,
        qrImageDataUrl: result.qrImageDataUrl
      });
    } catch (error) {
      console.error(error);
      return res.status(502).json({
        orderId,
        error: `${payload.provider} prepay failed`,
        message: error.message
      });
    }
  }

  res.json({ orderId, status: 'pending', paymentMode, provider: 'manual' });
});

router.post('/webhook/stripe', (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook is not configured' });
  }

  const signature = req.get('stripe-signature');
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook signature failed:', error.message);
    return res.status(400).json({ error: 'Invalid Stripe signature' });
  }

  const supportedEvents = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired',
    'charge.refunded',
    'charge.dispute.created',
    'charge.dispute.closed'
  ]);

  if (supportedEvents.has(event.type)) {
    const object = event.data.object;
    const isCheckoutEvent = event.type.startsWith('checkout.session.');
    const paymentIntent = stripeObjectId(object.payment_intent);
    const matchedOrder = isCheckoutEvent ? null : findStripeOrderByPaymentIntent(paymentIntent);
    const orderId = isCheckoutEvent
      ? object.metadata && object.metadata.orderId
      : matchedOrder && matchedOrder.id;
    const eventRecord = recordPaymentEvent({
      id: event.id,
      provider: 'stripe',
      orderId,
      eventType: event.type,
      payload: {
        id: event.id,
        type: event.type,
        objectId: object.id,
        sessionId: isCheckoutEvent ? object.id : '',
        paymentIntent,
        paymentStatus: isCheckoutEvent ? object.payment_status : ''
      }
    });
    if (eventRecord.duplicate) return res.json({ received: true, duplicate: true });

    const paymentSucceeded = event.type === 'checkout.session.async_payment_succeeded'
      || (event.type === 'checkout.session.completed' && object.payment_status === 'paid');

    if (orderId && paymentSucceeded) {
      const customerEmail = object.customer_details && object.customer_details.email || '';
      markOrderPaid(orderId, {
        provider: 'stripe',
        stripeEventId: event.id,
        stripeSessionId: object.id,
        stripePaymentIntent: paymentIntent,
        stripeCustomerId: stripeObjectId(object.customer),
        customerEmail,
        customerCountry: object.customer_details
          && object.customer_details.address
          && object.customer_details.address.country || '',
        gatewayTradeNo: paymentIntent || object.id,
        stripePaymentStatus: object.payment_status,
        paidAt: new Date().toISOString()
      });
      db.prepare(`
        INSERT INTO product_events (id, event_name, session_id, order_id, test_type, plan_id, locale, metadata)
        VALUES (?, 'payment_webhook_paid', '', ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        orderId,
        object.metadata && object.metadata.testType || '',
        object.metadata && object.metadata.planId || '',
        object.metadata && object.metadata.locale || '',
        JSON.stringify({
          amount: Number(object.amount_total || 0) / 100,
          currency: String(object.currency || '').toUpperCase()
        })
      );
      void notifyOperations('payment_succeeded', {
        orderId,
        amount: Number(object.amount_total || 0) / 100,
        currency: String(object.currency || '').toUpperCase(),
        planId: object.metadata && object.metadata.planId || '',
        testType: object.metadata && object.metadata.testType || '',
        customerEmail
      });
    } else if (
      orderId &&
      (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired')
    ) {
      setOrderStatus(orderId, 'canceled', {
        provider: 'stripe',
        stripeEventId: event.id,
        stripeSessionId: object.id,
        stripePaymentStatus: object.payment_status,
        canceledAt: new Date().toISOString()
      });
      if (event.type === 'checkout.session.async_payment_failed') {
        void notifyOperations('payment_failed', {
          orderId,
          sessionId: object.id,
          paymentStatus: object.payment_status
        });
      }
    } else if (orderId && event.type === 'charge.refunded') {
      const refundPatch = {
        provider: 'stripe',
        stripeEventId: event.id,
        stripeChargeId: object.id,
        stripeRefunded: object.refunded === true,
        stripeAmountRefunded: Number(object.amount_refunded || 0),
        stripeChargeAmount: Number(object.amount || 0),
        refundedAt: new Date().toISOString()
      };
      if (object.refunded === true || Number(object.amount_refunded || 0) >= Number(object.amount || 0)) {
        setOrderStatus(orderId, 'refunded', refundPatch);
        void notifyOperations('payment_refunded', {
          orderId,
          chargeId: object.id,
          amountRefunded: Number(object.amount_refunded || 0) / 100,
          currency: String(object.currency || '').toUpperCase()
        });
      } else {
        updateOrderPayload(orderId, { ...refundPatch, partialRefund: true });
      }
    } else if (orderId && event.type === 'charge.dispute.created') {
      setOrderStatus(orderId, 'disputed', {
        provider: 'stripe',
        stripeEventId: event.id,
        stripeDisputeId: object.id,
        stripeDisputeStatus: object.status || '',
        disputedAt: new Date().toISOString()
      });
      void notifyOperations('payment_disputed', {
        orderId,
        disputeId: object.id,
        status: object.status || '',
        amount: Number(object.amount || 0) / 100,
        currency: String(object.currency || '').toUpperCase()
      });
    } else if (orderId && event.type === 'charge.dispute.closed') {
      const nextStatus = object.status === 'won' ? 'paid' : 'refunded';
      setOrderStatus(orderId, nextStatus, {
        provider: 'stripe',
        stripeEventId: event.id,
        stripeDisputeId: object.id,
        stripeDisputeStatus: object.status || '',
        disputeClosedAt: new Date().toISOString()
      });
    }
  }

  res.json({ received: true });
});

router.post('/webhook/wechat', (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {});
  try {
    if (!verifyWechatSignature(req, rawBody)) {
      return res.status(401).json({ code: 'SIGN_ERROR', message: 'Invalid signature' });
    }

    const data = JSON.parse(rawBody);
    const resource = data.resource ? decryptWechatResource(data.resource) : data;
    const orderId = resource.out_trade_no;
    if (!orderId) return res.status(400).json({ code: 'PARAM_ERROR', message: 'Missing out_trade_no' });
    const eventId = data.id || resource.transaction_id || `${orderId}:${resource.trade_state || 'UNKNOWN'}`;
    const eventRecord = recordPaymentEvent({
      id: `wechat:${eventId}`,
      provider: 'wechat',
      orderId,
      eventType: data.event_type || resource.trade_state || '',
      payload: { eventId, tradeState: resource.trade_state, transactionId: resource.transaction_id || '' }
    });
    if (eventRecord.duplicate) return res.json({ code: 'SUCCESS', message: '成功' });

    if (resource.trade_state === 'SUCCESS') {
      markOrderPaid(orderId, {
        provider: 'wechat',
        gatewayEventId: `wechat:${eventId}`,
        gatewayTradeNo: resource.transaction_id || '',
        wechatTransactionId: resource.transaction_id || '',
        paidAt: new Date().toISOString()
      });
    }
    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('WeChat Pay webhook failed:', error.message);
    res.status(400).json({ code: 'FAIL', message: error.message });
  }
});

router.post('/webhook/alipay', (req, res) => {
  try {
    const params = req.body || {};
    if (!verifyAlipaySignature(params)) {
      return res.status(401).send('failure');
    }

    const orderId = params.out_trade_no;
    if (!orderId) return res.status(400).send('failure');
    const eventId = params.notify_id || params.trade_no || `${orderId}:${params.trade_status || 'UNKNOWN'}`;
    const eventRecord = recordPaymentEvent({
      id: `alipay:${eventId}`,
      provider: 'alipay',
      orderId,
      eventType: params.trade_status || '',
      payload: { notifyId: params.notify_id || '', tradeStatus: params.trade_status || '', tradeNo: params.trade_no || '' }
    });
    if (eventRecord.duplicate) return res.send('success');

    if (params.trade_status === 'TRADE_SUCCESS' || params.trade_status === 'TRADE_FINISHED') {
      markOrderPaid(orderId, {
        provider: 'alipay',
        gatewayEventId: `alipay:${eventId}`,
        gatewayTradeNo: params.trade_no || '',
        alipayTradeNo: params.trade_no || '',
        paidAt: new Date().toISOString()
      });
    }
    res.send('success');
  } catch (error) {
    console.error('Alipay webhook failed:', error.message);
    res.status(400).send('failure');
  }
});

// Development only. Never enable PAYMENT_MODE=mock on a public host.
router.post('/mock-webhook', (req, res) => {
  if (paymentMode !== 'mock') {
    return res.status(404).json({ error: 'Not Found' });
  }

  const { orderId } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  markOrderPaid(orderId, { provider: 'mock', paidAt: new Date().toISOString() });
  res.json({ success: true, message: 'Order marked as paid (MOCK)' });
});

router.post('/notify-paid', (req, res) => {
  if (paymentMode === 'disabled') {
    return res.status(503).json({ error: 'Payment is not configured' });
  }

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'paid') return res.json({ status: 'paid' });

  const payload = parsePayload(order);
  if (payload.provider === 'stripe') {
    return res.json({ status: order.status, provider: 'stripe', checkoutUrl: payload.checkoutUrl || '' });
  }
  if ((payload.provider === 'wechat' || payload.provider === 'alipay') && payload.prepayCreatedAt) {
    return res.json({ status: order.status, provider: payload.provider, message: 'Waiting for provider webhook' });
  }

  db.prepare("UPDATE orders SET status = 'reviewing', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'").run(orderId);
  res.json({ status: 'reviewing', message: 'Payment verification submitted' });
});

router.post('/admin/mark-paid', requireAdmin, (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  markOrderPaid(orderId, { adminMarkedPaidAt: new Date().toISOString() });
  res.json({ success: true, status: 'paid' });
});

router.post('/admin/cancel', requireAdmin, (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  setOrderStatus(orderId, 'canceled', { canceledAt: new Date().toISOString() });
  res.json({ success: true, status: 'canceled' });
});

router.post('/admin/refund', requireAdmin, async (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'refunded') return res.json({ success: true, status: 'refunded', duplicate: true });
  if (order.status !== 'paid' && order.status !== 'disputed') {
    return res.status(409).json({ error: `Order cannot be refunded from status ${order.status}` });
  }

  const payload = parsePayload(order);
  const paymentIntent = payload.stripePaymentIntent || order.gateway_trade_no;
  if ((payload.provider || order.provider) !== 'stripe' || !paymentIntent) {
    return res.status(409).json({ error: 'This order does not have a refundable Stripe payment intent' });
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent,
      reason: 'requested_by_customer',
      metadata: { orderId }
    }, {
      idempotencyKey: `northstar-refund-${orderId}`
    });
    recordPaymentEvent({
      id: `stripe-refund:${refund.id}`,
      provider: 'stripe',
      orderId,
      eventType: 'refund.created',
      payload: { refundId: refund.id, paymentIntent, status: refund.status }
    });
    setOrderStatus(orderId, 'refunded', {
      provider: 'stripe',
      stripeRefundId: refund.id,
      stripeRefundStatus: refund.status,
      refundedAt: new Date().toISOString()
    });
    res.json({ success: true, status: 'refunded', refundId: refund.id, refundStatus: refund.status });
  } catch (error) {
    console.error('Stripe refund failed:', error.message);
    res.status(502).json({ error: 'Stripe refund failed', message: error.message });
  }
});

router.get('/admin/config', requireAdmin, (req, res) => {
  res.json({
    config: {
      ...getPaymentConfigStatus(),
      notifications: getNotificationConfig()
    }
  });
});

router.get('/config', (req, res) => {
  const config = getPaymentConfigStatus();
  res.json({
    paymentMode: config.paymentMode,
    paymentLive: config.paymentMode === 'live' && Object.entries(config.providers)
      .some(([name, provider]) => name !== 'manual' && provider.ready),
    providers: Object.fromEntries(
      Object.entries(config.providers).map(([name, provider]) => [name, { ready: provider.ready }])
    )
  });
});

router.get('/admin/stats', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT status, payload FROM orders').all();
  const stats = {
    total: rows.length,
    pending: 0,
    reviewing: 0,
    paid: 0,
    canceled: 0,
    refunded: 0,
    disputed: 0,
    revenue: 0,
    refundedRevenue: 0,
    netRevenue: 0,
    currency: 'USD',
    byProvider: {},
    byCurrency: {}
  };

  for (const row of rows) {
    stats[row.status] = (stats[row.status] || 0) + 1;
    const payload = parsePayload(row);
    const provider = payload.provider || 'manual';
    const currency = String(payload.currency || 'UNKNOWN').toUpperCase();
    stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1;
    stats.byCurrency[currency] = stats.byCurrency[currency] || {
      paidOrders: 0,
      disputedOrders: 0,
      refundedOrders: 0,
      gross: 0,
      refunded: 0,
      net: 0
    };
    const currencyStats = stats.byCurrency[currency];
    const amount = Number(payload.amount || 0);
    if (row.status === 'paid' || row.status === 'disputed' || row.status === 'refunded') {
      currencyStats.gross += amount;
    }
    if (row.status === 'paid') currencyStats.paidOrders += 1;
    if (row.status === 'disputed') currencyStats.disputedOrders += 1;
    if (row.status === 'refunded') {
      currencyStats.refundedOrders += 1;
      currencyStats.refunded += amount;
    }
  }

  for (const currencyStats of Object.values(stats.byCurrency)) {
    currencyStats.gross = Number(currencyStats.gross.toFixed(2));
    currencyStats.refunded = Number(currencyStats.refunded.toFixed(2));
    currencyStats.net = Number((currencyStats.gross - currencyStats.refunded).toFixed(2));
  }
  const usd = stats.byCurrency.USD || { gross: 0, refunded: 0, net: 0 };
  stats.revenue = usd.gross;
  stats.refundedRevenue = usd.refunded;
  stats.netRevenue = usd.net;
  res.json({ stats });
});

router.get('/admin/orders', requireAdmin, (req, res) => {
  const status = req.query.status ? String(req.query.status).slice(0, 20) : '';
  const provider = req.query.provider ? String(req.query.provider).slice(0, 20) : '';
  const q = req.query.q ? String(req.query.q).slice(0, 80) : '';
  const limit = Math.min(Number(req.query.limit) || 100, 300);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const where = [];
  const params = [];
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (provider) {
    where.push('(provider = ? OR payload LIKE ?)');
    params.push(provider, `%"provider":"${provider}"%`);
  }
  if (q) {
    where.push('(id LIKE ? OR test_type LIKE ? OR gateway_trade_no LIKE ? OR payload LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(`
    SELECT id, test_type, status, payload, created_at, updated_at, paid_at, provider, gateway_event_id, gateway_trade_no
    FROM orders
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const orders = rows.map((row) => ({ ...row, payload: parsePayload(row) }));

  res.json({ orders });
});

router.get('/status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = db.prepare('SELECT id, test_type, status, payload, provider, paid_at FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  res.json(buildAccessSummary(order));
});

router.get('/access/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = db.prepare('SELECT id, test_type, status, payload, provider, paid_at FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const access = buildAccessSummary(order);
  if (!access.paid) {
    return res.status(access.status === 'pending' || access.status === 'reviewing' ? 202 : 403).json(access);
  }
  res.json(access);
});

module.exports = router;
