const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const sourcePath = process.env.NORTHSTAR_DB_PATH
  ? path.resolve(process.env.NORTHSTAR_DB_PATH)
  : path.resolve(__dirname, '../northstar.db');
const backupDir = path.resolve(process.env.BACKUP_DIR || '/opt/northstar/backups');
const retentionDays = Math.max(Number(process.env.BACKUP_RETENTION_DAYS || 30), 1);

function stamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

async function main() {
  if (!fs.existsSync(sourcePath)) throw new Error(`Database not found: ${sourcePath}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const target = path.join(backupDir, `northstar-auto-${stamp()}.db`);
  const db = new Database(sourcePath, { readonly: true, fileMustExist: true });
  try {
    await db.backup(target);
  } finally {
    db.close();
  }

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const name of fs.readdirSync(backupDir)) {
    if (!/^northstar-auto-\d{8}T\d{6}Z\.db$/.test(name)) continue;
    const filePath = path.join(backupDir, name);
    if (fs.statSync(filePath).mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
      removed += 1;
    }
  }

  console.log(JSON.stringify({ backup: target, bytes: fs.statSync(target).size, removed }));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
