const Database = require('better-sqlite3');

const REQUIRED_TABLES = [
  'orders',
  'results',
  'payment_events',
  'support_requests',
  'product_events',
  'operations_checks',
  'operations_alerts'
];

function verifyRestoredDatabase(filePath) {
  const db = new Database(filePath, { readonly: true, fileMustExist: true });
  try {
    const integrity = db.pragma('integrity_check', { simple: true });
    if (integrity !== 'ok') throw new Error(`SQLite integrity_check returned ${integrity}`);

    const foreignKeyIssues = db.pragma('foreign_key_check');
    if (foreignKeyIssues.length) {
      throw new Error(`SQLite foreign_key_check returned ${foreignKeyIssues.length} issue(s)`);
    }

    const tables = new Set(db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
    `).all().map((row) => row.name));
    const missingTables = REQUIRED_TABLES.filter((name) => !tables.has(name));
    if (missingTables.length) throw new Error(`Missing required tables: ${missingTables.join(', ')}`);

    const counts = {};
    for (const table of REQUIRED_TABLES) {
      counts[table] = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
    }
    return { integrity, foreignKeyIssues: 0, counts };
  } finally {
    db.close();
  }
}

module.exports = {
  REQUIRED_TABLES,
  verifyRestoredDatabase
};
