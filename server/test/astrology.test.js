const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateAstrology, calculateBazi } = require('../core/engine');

const tokyoBirth = {
  date: '1990-01-01',
  time: '09:30',
  timezone: 'Asia/Tokyo',
  latitude: 35.68501691,
  longitude: 139.7514074
};

test('calculates a deterministic full tropical chart from UTC-resolved birth data', () => {
  const result = calculateAstrology(tokyoBirth);
  assert.equal(result.method, 'astronomy-engine-vsop87-novas');
  assert.equal(result.houseSystem, 'whole-sign');
  assert.equal(result.sunSign, '摩羯座');
  assert.equal(result.planets.length, 10);
  assert.equal(result.houses.length, 12);
  assert.ok(Math.abs(result.planets.find((planet) => planet.id === 'sun').longitude - 280.32575) < 0.002);
  assert.ok(Math.abs(result.planets.find((planet) => planet.id === 'moon').longitude - 326.835989) < 0.002);
  assert.ok(Math.abs(result.ascendant.longitude - 325.968118) < 0.002);
  assert.ok(Math.abs(result.midheaven.longitude - 249.3409) < 0.002);
  assert.match(result.utcDateTime, /1990-01-01T00:30:00/);
  assert.ok(result.planets.every((planet) => planet.house >= 1 && planet.house <= 12));
  assert.equal(result.planets.find((planet) => planet.id === 'mercury').retrograde, true);
});

test('rejects incomplete birth data instead of returning a fallback chart', () => {
  assert.throws(() => calculateAstrology({}), /valid birth date/);
  assert.throws(() => calculateAstrology({ date: '1990-01-01' }), /exact birth time/);
});

test('calculates bazi from the selected city timezone and returns localized metadata', () => {
  const result = calculateBazi({
    date: '2003-03-08',
    time: '12:30',
    timezone: 'Asia/Shanghai',
    locationLabel: '荆州 · 湖北省 · 中国'
  });
  assert.equal(result.yearPillar, '癸未');
  assert.equal(result.monthPillar, '乙卯');
  assert.equal(result.dayPillar, '庚辰');
  assert.equal(result.timePillar, '壬午');
  assert.equal(result.dayMaster, '庚');
  assert.equal(result.locationLabel, '荆州 · 湖北省 · 中国');
  assert.equal(result.timezoneLabel, '中国标准时间（UTC+8）');
  assert.match(result.localDateTime, /^2003-03-08T12:30:00/);
});

test('rejects bazi requests without an exact local birth time and timezone', () => {
  assert.throws(() => calculateBazi({ date: '2003-03-08' }), /exact birth time/);
  assert.throws(
    () => calculateBazi({ date: '2003-03-08', time: '12:30', timezone: 'Not\\/A_Zone' }),
    /valid IANA timezone/
  );
});
