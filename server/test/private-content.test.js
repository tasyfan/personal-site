const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPremiumBaseReport } = require('../services/private-content');

test('resolves an MBTI premium report from private content', () => {
  const report = buildPremiumBaseReport('mbti', {
    resultSummary: 'INTJ 建筑师',
    userInputs: { type: 'INTJ' },
    context: { profile: { type: 'INTJ', name: '建筑师' } }
  });
  assert.ok(report.length > 200);
  assert.match(report, /性格底色|关系里的反应|容易卡住/);
});

test('resolves tarot cards using card name and orientation', () => {
  const report = buildPremiumBaseReport('tarot', {
    resultSummary: '过去:愚者正位',
    userInputs: {},
    context: {
      cards: [{ position: '过去', card: '愚者', orientation: '正位' }]
    }
  });
  assert.ok(report.includes('愚者正位'));
  assert.ok(report.length > 80);
});

test('serves an English premium report without Chinese residue', () => {
  const report = buildPremiumBaseReport('mbti', {
    resultSummary: 'INTJ Architect',
    userInputs: { type: 'INTJ' },
    context: { profile: { type: 'INTJ', name: 'Architect' } },
    locale: 'en'
  });
  assert.ok(report.length > 200);
  assert.doesNotMatch(report, /[\u3400-\u9fff]/u);
});
