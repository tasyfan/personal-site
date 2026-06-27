const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.resolve(__dirname, '..')
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const engineSource = fs.readFileSync(path.join(root, 'antigravity-engine.js'), 'utf8')
const styleSource = fs.readFileSync(path.join(root, 'styles.css'), 'utf8')
const buildSource = fs.readFileSync(path.join(root, 'scripts', 'build-static.js'), 'utf8')

test('the desktop Antigravity design source is preserved in the project', () => {
  assert.ok(fs.existsSync(path.join(root, 'design-sources', 'antigravity-animation-design', 'index.html')))
  assert.ok(fs.existsSync(path.join(root, 'design-sources', 'antigravity-animation-design', 'README.txt')))
})

test('the public frontend loads the self-hosted Antigravity runtime', () => {
  assert.match(indexSource, /id="antigravityCanvas"/)
  assert.match(indexSource, /src="\.\/three\.min\.js"/)
  assert.match(indexSource, /src="\.\/antigravity-engine\.js\?v=1"/)
  assert.match(buildSource, /'antigravity-engine\.js'/)
  assert.match(buildSource, /'three\.min\.js'/)
})

test('the production runtime is performance bounded and has a motion fallback', () => {
  assert.match(engineSource, /128 \* 128/)
  assert.match(engineSource, /Math\.min\(1\.25, window\.devicePixelRatio/)
  assert.match(engineSource, /prefers-reduced-motion: reduce/)
  assert.match(engineSource, /antigravity-fallback/)
  assert.doesNotMatch(indexSource, /param-density|btn-copy|control-panel/)
})

test('Northstar surfaces use the Antigravity glass design system', () => {
  assert.match(styleSource, /ANTIGRAVITY DESIGN SYSTEM/)
  assert.match(styleSource, /\.antigravity-brief-panel/)
  assert.match(styleSource, /\.block-grid article,[\s\S]*backdrop-filter: blur\(22px\)/)
  assert.match(styleSource, /html\.antigravity-ready #antigravityCanvas/)
})
