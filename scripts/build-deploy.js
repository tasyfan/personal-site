const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist', 'server-bundle');

function copy(source, target, options = {}) {
  const name = path.basename(source);
  if (
    (options.exclude && options.exclude.has(name))
    || /^\.env(?:\.|$)/.test(name)
    || /\.(?:db|sqlite|log)$/i.test(name)
  ) return;
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const name of fs.readdirSync(source)) {
      copy(path.join(source, name), path.join(target, name), options);
    }
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

copy(path.join(root, 'server'), path.join(output, 'server'), {
  exclude: new Set(['node_modules', 'northstar.db', 'test'])
});
copy(path.join(root, 'content'), path.join(output, 'content'));
copy(path.join(root, 'admin.html'), path.join(output, 'admin.html'));
copy(path.join(root, 'DEPLOYMENT.md'), path.join(output, 'DEPLOYMENT.md'));
copy(path.join(root, 'PAYMENT_SETUP.md'), path.join(output, 'PAYMENT_SETUP.md'));
copy(path.join(root, 'SECURITY.md'), path.join(output, 'SECURITY.md'));
copy(path.join(root, 'MVP_LAUNCH_STATUS.md'), path.join(output, 'MVP_LAUNCH_STATUS.md'));

console.log(`Server deployment bundle created at ${output}`);
