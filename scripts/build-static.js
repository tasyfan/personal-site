const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'dist', 'public');

const entries = [
  '.nojekyll',
  'index.html',
  'privacy.html',
  'terms.html',
  'refund.html',
  'support.html',
  'legal.css',
  'robots.txt',
  'sitemap.xml',
  'i18n.js',
  'locales',
  'app.js',
  'styles.css',
  'background.js',
  'antigravity-engine.js',
  'three.min.js',
  'html2canvas.min.js',
  'vue.global.prod.js',
  'vue-router.global.prod.js',
  'wechat_qr.jpg',
  'alipay_qr.jpg',
  'pay_qr.jpg',
  'astral_poster_bg.png',
  'content',
  'public'
];

const forbidden = [
  '.git',
  'server',
  'node_modules',
  'dist',
  'package-lock.json',
  'AI_HANDOVER.md',
  'README.md',
  'admin.html',
  'astronomy.browser.js'
];

function copyEntry(source, target) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const name of fs.readdirSync(source)) {
      copyEntry(path.join(source, name), path.join(target, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function findMatchingBrace(source, start) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function findStringEnd(source, start) {
  const quote = source[start];
  let escaped = false;
  for (let index = start + 1; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === quote) return index;
  }
  return -1;
}

function stripNamedPremiumFunction(source, name) {
  const marker = `const ${name} =`;
  const start = source.indexOf(marker);
  if (start < 0) return source;
  const bodyStart = source.indexOf('{', source.indexOf('=>', start));
  if (bodyStart < 0) return source;
  const bodyEnd = findMatchingBrace(source, bodyStart);
  if (bodyEnd < 0) return source;
  return `${source.slice(0, start)}const ${name} = () => ''${source.slice(bodyEnd + 1)}`;
}

function sanitizeAppSource(source) {
  let output = source;
  for (const name of ['expandBaziText', 'expandHDText', 'expandSynastryText']) {
    output = stripNamedPremiumFunction(output, name);
  }

  const replacements = [];
  const deepPattern = /\bdeep\s*:/g;
  let match;
  while ((match = deepPattern.exec(output))) {
    let valueStart = deepPattern.lastIndex;
    while (/\s/.test(output[valueStart] || '')) valueStart += 1;
    const first = output[valueStart];
    if (first === "'" || first === '"' || first === '`') {
      const end = findStringEnd(output, valueStart);
      if (end > valueStart && end - valueStart > 80) {
        replacements.push([valueStart, end + 1, "''"]);
      }
    } else if (first === '{') {
      const end = findMatchingBrace(output, valueStart);
      if (end > valueStart) {
        replacements.push([valueStart, end + 1, "{ upright: '', reversed: '' }"]);
      }
    }
  }

  for (let index = replacements.length - 1; index >= 0; index -= 1) {
    const [start, end, replacement] = replacements[index];
    output = output.slice(0, start) + replacement + output.slice(end);
  }
  return output;
}

function sanitizeContentFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');

  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: filePath, timeout: 1000 });
  const globalName = Object.keys(sandbox.window)[0];
  const data = sandbox.window[globalName];

  function scrub(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'deep') value[key] = '';
      else if (globalName === 'TAROT_DATA' && (key === 'upright' || key === 'reversed')) value[key] = '';
      else scrub(child);
    }
  }

  scrub(data);
  return `window.${globalName} = ${JSON.stringify(data, null, 2)};\n`;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(root, entry);
  if (!fs.existsSync(source)) continue;
  copyEntry(source, path.join(outDir, entry));
}

fs.writeFileSync(
  path.join(outDir, 'app.js'),
  sanitizeAppSource(fs.readFileSync(path.join(root, 'app.js'), 'utf8'))
);

const publicContentDir = path.join(outDir, 'content');
for (const fileName of fs.readdirSync(path.join(root, 'content'))) {
  if (!fileName.endsWith('.js')) continue;
  fs.writeFileSync(
    path.join(publicContentDir, fileName),
    sanitizeContentFile(path.join(root, 'content', fileName))
  );
}

for (const blocked of forbidden) {
  const target = path.join(outDir, blocked);
  if (fs.existsSync(target)) {
    throw new Error(`Forbidden deploy artifact copied: ${blocked}`);
  }
}

const forbiddenExt = /\.(db|sqlite|env|log|lock)$/i;
function scan(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(outDir, full);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scan(full);
    } else if (forbiddenExt.test(name)) {
      throw new Error(`Forbidden file extension in deploy artifact: ${rel}`);
    }
  }
}

scan(outDir);

console.log(`Static deploy artifact created at ${outDir}`);
