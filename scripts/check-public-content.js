const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const publicContentDir = path.join(root, 'dist', 'public', 'content');
const violations = [];

function scan(value, pathParts = []) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const itemPath = [...pathParts, key];
    if (key === 'deep' && typeof child === 'string' && child.trim()) {
      violations.push(itemPath.join('.'));
    } else if (key === 'deep' && child && typeof child === 'object') {
      const text = JSON.stringify(child).replace(/[{}[\]",:]/g, '').trim();
      if (text) violations.push(itemPath.join('.'));
    }
    scan(child, itemPath);
  }
}

for (const fileName of fs.readdirSync(publicContentDir)) {
  if (!fileName.endsWith('.js')) continue;
  const filePath = path.join(publicContentDir, fileName);
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox, { filename: filePath, timeout: 1000 });
  for (const [globalName, data] of Object.entries(sandbox.window)) {
    scan(data, [fileName, globalName]);
  }
}

const appSource = fs.readFileSync(path.join(root, 'dist', 'public', 'app.js'), 'utf8');
const knownPremiumPhrases = [
  '世界牌——大阿尔卡那的最后一张',
  '你的理智是一座坚固的堡垒',
  '命理源流初勘',
  '核心人格解码'
];
for (const phrase of knownPremiumPhrases) {
  if (appSource.includes(phrase)) violations.push(`app.js contains premium phrase: ${phrase}`);
}

if (violations.length) {
  console.error(`Public premium-content check failed:\n${violations.join('\n')}`);
  process.exit(1);
}

console.log('Public artifact contains no non-empty premium deep fields.');
