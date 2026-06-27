const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.NORTHSTAR_DB_PATH
  ? path.resolve(process.env.NORTHSTAR_DB_PATH)
  : path.resolve(__dirname, 'northstar.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

// Initialize schemas
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      test_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', or 'paid'
      payload TEXT, -- JSON string of user inputs
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ,paid_at DATETIME
      ,provider TEXT
      ,gateway_event_id TEXT
      ,gateway_trade_no TEXT
    );

    CREATE TABLE IF NOT EXISTS results (
      order_id TEXT PRIMARY KEY,
      test_type TEXT NOT NULL,
      result_data TEXT, -- JSON string of calculated results
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      order_id TEXT,
      event_type TEXT,
      payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS support_requests (
      id TEXT PRIMARY KEY,
      contact TEXT NOT NULL,
      category TEXT NOT NULL,
      order_id TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_events (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      session_id TEXT,
      order_id TEXT,
      test_type TEXT,
      plan_id TEXT,
      locale TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operations_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL,
      issues TEXT,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operations_alerts (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      details TEXT,
      delivery_status TEXT NOT NULL DEFAULT 'pending',
      delivery_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS backup_restore_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL,
      backup_name TEXT,
      details TEXT,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS data_retention_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL,
      details TEXT,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const orderColumns = db.prepare('PRAGMA table_info(orders)').all().map((column) => column.name);
  const migrations = [
    ['updated_at', 'ALTER TABLE orders ADD COLUMN updated_at DATETIME'],
    ['paid_at', 'ALTER TABLE orders ADD COLUMN paid_at DATETIME'],
    ['provider', 'ALTER TABLE orders ADD COLUMN provider TEXT'],
    ['gateway_event_id', 'ALTER TABLE orders ADD COLUMN gateway_event_id TEXT'],
    ['gateway_trade_no', 'ALTER TABLE orders ADD COLUMN gateway_trade_no TEXT']
  ];
  for (const [name, sql] of migrations) {
    if (!orderColumns.includes(name)) db.prepare(sql).run();
  }

  db.prepare("UPDATE orders SET updated_at = COALESCE(updated_at, created_at), provider = COALESCE(provider, json_extract(payload, '$.provider'), 'manual')").run();
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_provider_created ON orders(provider, created_at);
    CREATE INDEX IF NOT EXISTS idx_payment_events_order ON payment_events(order_id);
    CREATE INDEX IF NOT EXISTS idx_support_requests_created ON support_requests(created_at);
    CREATE INDEX IF NOT EXISTS idx_support_requests_status_created ON support_requests(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_product_events_name_created ON product_events(event_name, created_at);
    CREATE INDEX IF NOT EXISTS idx_product_events_order ON product_events(order_id);
    CREATE INDEX IF NOT EXISTS idx_operations_checks_checked ON operations_checks(checked_at);
    CREATE INDEX IF NOT EXISTS idx_operations_alerts_status_created ON operations_alerts(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_operations_alerts_event_created ON operations_alerts(event_name, created_at);
    CREATE INDEX IF NOT EXISTS idx_backup_restore_checks_checked ON backup_restore_checks(checked_at);
    CREATE INDEX IF NOT EXISTS idx_data_retention_checks_checked ON data_retention_checks(checked_at);
  `);
}

initDB();

module.exports = db;
