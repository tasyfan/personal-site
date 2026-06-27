const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.resolve('/Users/fantasy/Desktop/Antigravity-Animation-Design');
const sourceHtml = path.join(sourceDir, 'index.html');
const sourceReadme = path.join(sourceDir, 'README.txt');
const importedDir = path.join(root, 'design-sources', 'antigravity-animation-design');
const threeSource = path.join(root, 'node_modules', 'three', 'build', 'three.min.js');

if (!fs.existsSync(sourceHtml) || !fs.existsSync(sourceReadme)) {
  throw new Error(`Antigravity design package not found at ${sourceDir}`);
}
if (!fs.existsSync(threeSource)) {
  throw new Error('Install three@0.128.0 before importing the Antigravity runtime.');
}

fs.mkdirSync(importedDir, { recursive: true });
fs.copyFileSync(sourceHtml, path.join(importedDir, 'index.html'));
fs.copyFileSync(sourceReadme, path.join(importedDir, 'README.txt'));
fs.copyFileSync(threeSource, path.join(root, 'three.min.js'));

const source = fs.readFileSync(sourceHtml, 'utf8');
const engineStart = source.indexOf('class JA {');
const engineEnd = source.indexOf('// ── Bind Control Panel Events ──');
if (engineStart < 0 || engineEnd < 0 || engineEnd <= engineStart) {
  throw new Error('Could not locate the Antigravity engine boundaries.');
}

let engine = source.slice(engineStart, engineEnd).trim();
engine = engine
  .replace(
    "density: 200,\n      easing: 0.15,\n      scale: 0.45,\n      colorPreset: 'google',",
    "density: window.innerWidth <= 768 ? 105 : 180,\n      easing: 0.15,\n      scale: window.innerWidth <= 768 ? 0.58 : 0.48,\n      colorPreset: 'google',"
  )
  .replace('const dpr = Math.min(2, window.devicePixelRatio || 1);', 'const dpr = Math.min(1.25, window.devicePixelRatio || 1);')
  .replace('antialias: true,', 'antialias: false,')
  .replace('preserveDrawingBuffer: true,', 'preserveDrawingBuffer: false,')
  .replaceAll('new Float32Array(256 * 256 * 4)', 'new Float32Array(128 * 128 * 4)')
  .replaceAll('for (let i = 0; i < 256 * 256; i++)', 'for (let i = 0; i < 128 * 128; i++)')
  .replaceAll('new THREE.DataTexture(texArray, 256, 256,', 'new THREE.DataTexture(texArray, 128, 128,')
  .replace('vec2 simTexCoords = gl_FragCoord.xy / vec2(256.0, 256.0);', 'vec2 simTexCoords = gl_FragCoord.xy / vec2(128.0, 128.0);')
  .replace('const count = Math.min(256 * 256, pointsData.length / 2);', 'const count = Math.min(128 * 128, pointsData.length / 2);')
  .replace('new THREE.DataTexture(textureArray, 256, 256,', 'new THREE.DataTexture(textureArray, 128, 128,')
  .replaceAll('new THREE.WebGLRenderTarget(256, 256, fboOptions)', 'new THREE.WebGLRenderTarget(128, 128, fboOptions)')
  .replace('const a = s % 256;', 'const a = s % 128;')
  .replace('const l = Math.floor(s / 256);', 'const l = Math.floor(s / 128);')
  .replace('uvs[s * 2] = a / 256;', 'uvs[s * 2] = a / 128;')
  .replace('uvs[s * 2 + 1] = l / 256;', 'uvs[s * 2 + 1] = l / 128;')
  .replace('renderMaterial.uniforms.uPixelRatio.value = Math.min(2, pxRatio);', 'renderMaterial.uniforms.uPixelRatio.value = Math.min(1.25, pxRatio);')
  .replace(
    'const selectors = [".control-panel"];',
    "const selectors = ['.site-header', '.hero-copy', '.modal-content', '.report-share-dialog'];"
  )
  .replace(
    "const overlay = document.getElementById('overlay');",
    'const overlay = window;'
  );

const output = `/* Generated from Desktop/Antigravity-Animation-Design.
 * Original source is preserved in design-sources/antigravity-animation-design.
 * Do not edit this generated file directly; run npm run import:antigravity.
 */
;(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || typeof THREE === 'undefined') return;

  try {
${engine.split('\n').map((line) => `    ${line}`).join('\n')}

    initWebGLAntigravityParticles();
    document.documentElement.classList.add('antigravity-ready');
    window.__northstarAntigravity = {
      source: 'Antigravity-Animation-Design V6',
      config: CONFIG
    };
  } catch (error) {
    console.error('Antigravity WebGL initialization failed:', error);
    document.documentElement.classList.add('antigravity-fallback');
  }
})();
`;

fs.writeFileSync(path.join(root, 'antigravity-engine.js'), output);
console.log('Imported Antigravity source and generated antigravity-engine.js');
