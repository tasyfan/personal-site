const test = require('node:test');
const assert = require('node:assert/strict');
const { formatTimezoneLabel, resolveLocations } = require('../services/location-resolver');

function first(query) {
  return resolveLocations(query)[0];
}

test('recognizes common Shanghai spelling variants as the same city', () => {
  for (const query of ['上海', '上海市', 'Shanghai', 'shanghai', 'SHANGHAI CITY', 'Ｓｈａｎｇｈａｉ']) {
    const result = first(query);
    assert.ok(result, `expected a match for ${query}`);
    assert.equal(result.city, 'Shanghai');
    assert.equal(result.timezone, 'Asia/Shanghai');
    assert.equal(result.latitude, 31.21645245);
    assert.equal(result.longitude, 121.4365047);
  }
});

test('recognizes simplified, traditional, local, and alternate global city names', () => {
  const cases = [
    ['臺北市', 'Taipei', 'Asia/Taipei'],
    ['東京都', 'Tokyo', 'Asia/Tokyo'],
    ['서울', 'Seoul', 'Asia/Seoul'],
    ['München', 'Munich', 'Europe/Berlin'],
    ['纽约市', 'New York', 'America/New_York'],
    ['São Paulo', 'Sao Paulo', 'America/Sao_Paulo']
  ];

  for (const [query, city, timezone] of cases) {
    const result = first(query);
    assert.ok(result, `expected a match for ${query}`);
    assert.equal(result.city, city);
    assert.equal(result.timezone, timezone);
  }
});

test('returns localized labels for known Chinese aliases', () => {
  assert.equal(first('上海市').label, '上海 · 中国');
  assert.equal(first('东京').label, '东京 · 日本');
  assert.equal(first('荆州市').label, '荆州 · 湖北省 · 中国');
  assert.equal(first('荆州市').city, 'Shashi');
  assert.equal(first('荆州市').timezone, 'Asia/Shanghai');
});

test('formats technical timezone identifiers as user-facing local time labels', () => {
  assert.equal(formatTimezoneLabel('Asia/Shanghai', 480), '中国标准时间（UTC+8）');
  assert.equal(formatTimezoneLabel('Asia/Tokyo', 540), '日本标准时间（UTC+9）');
  assert.equal(formatTimezoneLabel('America/New_York', -240), '当地时间（UTC-4）');
  assert.equal(formatTimezoneLabel('Asia/Shanghai', 480, 'en'), 'China Standard Time (UTC+8)');
  assert.equal(formatTimezoneLabel('Asia/Tokyo', 540, 'en-US'), 'Japan Standard Time (UTC+9)');
});

test('returns English city labels when the requested locale is English', () => {
  const tokyo = resolveLocations('Tokyo', 8, 'en')[0];
  const jingzhou = resolveLocations('Jingzhou', 8, 'en')[0];
  assert.equal(tokyo.label, 'Tokyo · Japan');
  assert.equal(tokyo.timezoneLabel, 'Japan Standard Time');
  assert.equal(jingzhou.label, 'Jingzhou · Hubei · China');
  assert.equal(jingzhou.timezoneLabel, 'China Standard Time');
});
