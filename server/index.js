const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();
const testsRouter = require('./routes/tests');
const paymentRouter = require('./routes/payment');
const relationshipRouter = require('./routes/relationship');
const supportRouter = require('./routes/support');
const analyticsRouter = require('./routes/analytics');
const { notifyOperations } = require('./services/notifications');

const app = express();
const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, '../dist/public');
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_PAGE_PATH = process.env.ADMIN_PAGE_PATH || path.join(__dirname, '../admin.html');
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function createRateLimiter({ windowMs, max, name, skipSafeMethods = true }) {
  const hits = new Map();
  return (req, res, next) => {
    if (skipSafeMethods && (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS')) return next();
    const now = Date.now();
    const key = `${name}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    if (hits.size > 2000) {
      for (const [itemKey, item] of hits.entries()) {
        if (item.resetAt <= now) hits.delete(itemKey);
      }
    }
    next();
  };
}

function secureEquals(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireAdminPage(req, res, next) {
  const password = process.env.ADMIN_PAGE_PASSWORD || process.env.ADMIN_TOKEN;
  if (!password) return res.status(404).send('Not Found');
  const header = req.get('authorization') || '';
  if (!header.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Northstar Operations"');
    return res.status(401).send('Authentication required');
  }
  let provided = '';
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    provided = decoded.slice(decoded.indexOf(':') + 1);
  } catch (error) {
    provided = '';
  }
  if (!secureEquals(provided, password)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Northstar Operations"');
    return res.status(401).send('Authentication required');
  }
  next();
}

const apiWriteLimiter = createRateLimiter({
  name: 'api-write',
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX || 60)
});

const aiLimiter = createRateLimiter({
  name: 'ai',
  windowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.AI_RATE_LIMIT_MAX || 12)
});

const adminLimiter = createRateLimiter({
  name: 'admin',
  windowMs: Number(process.env.ADMIN_RATE_LIMIT_WINDOW_MS || 15 * 60_000),
  max: Number(process.env.ADMIN_RATE_LIMIT_MAX || 120),
  skipSafeMethods: false
});

// Middleware
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  }
}));
app.use((err, req, res, next) => {
  if (err && err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed by CORS' });
  }
  next(err);
});
app.use('/api/payment/webhook/stripe', express.raw({ type: 'application/json', limit: '256kb' }));
app.use('/api/payment/webhook/wechat', express.raw({ type: '*/*', limit: '256kb' }));
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(morgan('dev'));

app.use((req, res, next) => {
  if (/\/(\.git|server|node_modules|scripts|deploy)(\/|$)/.test(req.path) || /\.(db|sqlite|env|log|lock)$/i.test(req.path)) {
    return res.status(404).send('Not Found');
  }
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'northstar-api', timestamp: new Date().toISOString() });
});
app.use('/api/tests', apiWriteLimiter);
app.use('/api/payment/create-intent', apiWriteLimiter);
app.use('/api/payment/notify-paid', apiWriteLimiter);
app.use('/api/support', apiWriteLimiter);
app.use('/api/analytics/event', apiWriteLimiter);
app.use('/api/payment/admin', adminLimiter);
app.use('/api/support/admin', adminLimiter);
app.use('/api/relationship/admin', adminLimiter);
app.use('/api/analytics/admin', adminLimiter);
app.use('/api/tests', (req, res, next) => {
  if (!req.path.endsWith('/ai-analysis')) return next();
  return aiLimiter(req, res, next);
});
app.use('/api/relationship/analyze', aiLimiter);
app.use('/api/tests', testsRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/relationship', relationshipRouter);
app.use('/api/support', supportRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/admin.html', adminLimiter, requireAdminPage, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(ADMIN_PAGE_PATH);
});

app.use((error, req, res, next) => {
  if (!error) return next();
  console.error('Unhandled request error:', error);
  void notifyOperations('server_request_error', {
    method: req.method,
    path: req.path,
    message: error.message || 'Unknown server error'
  });
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Internal server error' });
});

// Static files. PUBLIC_DIR must point to the sanitized dist/public artifact.
app.use(express.static(PUBLIC_DIR, {
  dotfiles: 'ignore',
  index: false,
  maxAge: NODE_ENV === 'production' ? '1h' : 0
}));

// Fallback to index.html for SPA routing if needed
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Serving static files from ${PUBLIC_DIR}`);
});
