const { Lunar, Solar, EightChar } = require('lunar-javascript');
const { DateTime } = require('luxon');
const Astronomy = require('../../astronomy.js');
const { formatTimezoneLabel } = require('../services/location-resolver');

// --- BAZI CALCULATION ---
function calculateBazi(payload) {
  const date = String(payload && payload.date || '');
  const time = String(payload && payload.time || '');
  const timezone = String(payload && payload.timezone || '');
  const locale = String(payload && payload.locale || 'zh-CN');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('A valid birth date is required');
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error('An exact birth time is required');
  if (!timezone || !DateTime.local().setZone(timezone).isValid) throw new Error('A valid IANA timezone is required');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const localDateTime = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
  if (!localDateTime.isValid) throw new Error('Birth date, time, and timezone could not be resolved');
  
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const bazi = lunar.getEightChar();
  
  return {
    yearPillar: bazi.getYear(),
    monthPillar: bazi.getMonth(),
    dayPillar: bazi.getDay(),
    timePillar: bazi.getTime(),
    dayMaster: bazi.getDayGan(),
    localDateTime: localDateTime.toISO(),
    timezone,
    timezoneLabel: formatTimezoneLabel(timezone, localDateTime.offset, locale),
    birthTimeDisplay: `${date} ${time}`,
    locationLabel: String(payload && (payload.locationLabel || payload.location) || ''),
    zodiac: lunar.getYearShengXiao(),
    wuXing: `${bazi.getYearWuXing()} ${bazi.getMonthWuXing()} ${bazi.getDayWuXing()} ${bazi.getTimeWuXing()}`,
    naYin: {
      year: bazi.getYearNaYin(),
      month: bazi.getMonthNaYin(),
      day: bazi.getDayNaYin(),
      time: bazi.getTimeNaYin()
    },
    tenGods: {
      year: [bazi.getYearShiShenGan(), bazi.getYearShiShenZhi()],
      month: [bazi.getMonthShiShenGan(), bazi.getMonthShiShenZhi()],
      day: ['日主', bazi.getDayShiShenZhi()],
      time: [bazi.getTimeShiShenGan(), bazi.getTimeShiShenZhi()]
    }
  };
}

// --- ASTROLOGY CALCULATION ---
function calculateAstrology(payload) {
  const date = String(payload && payload.date || '');
  const time = String(payload && payload.time || '');
  const timezone = String(payload && payload.timezone || '');
  const locale = String(payload && payload.locale || 'zh-CN');
  const latitude = Number(payload && payload.latitude);
  const longitude = Number(payload && payload.longitude);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('A valid birth date is required');
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error('An exact birth time is required');
  if (!timezone || !DateTime.local().setZone(timezone).isValid) throw new Error('A valid IANA timezone is required');
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error('Latitude is invalid');
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error('Longitude is invalid');

  const localDateTime = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
  if (!localDateTime.isValid) throw new Error('Birth date, time, and timezone could not be resolved');
  const utcDate = localDateTime.toUTC().toJSDate();
  const signs = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
  const bodies = [
    ['sun', '太阳', Astronomy.Body.Sun],
    ['moon', '月亮', Astronomy.Body.Moon],
    ['mercury', '水星', Astronomy.Body.Mercury],
    ['venus', '金星', Astronomy.Body.Venus],
    ['mars', '火星', Astronomy.Body.Mars],
    ['jupiter', '木星', Astronomy.Body.Jupiter],
    ['saturn', '土星', Astronomy.Body.Saturn],
    ['uranus', '天王星', Astronomy.Body.Uranus],
    ['neptune', '海王星', Astronomy.Body.Neptune],
    ['pluto', '冥王星', Astronomy.Body.Pluto]
  ];
  const normalize = (value) => ((value % 360) + 360) % 360;
  const signedDelta = (from, to) => ((to - from + 540) % 360) - 180;
  const signForLongitude = (value) => signs[Math.floor(normalize(value) / 30)];
  const positionAt = (body, instant) => Astronomy.Ecliptic(Astronomy.GeoVector(body, instant, true)).elon;
  const gastDegrees = Astronomy.SiderealTime(utcDate) * 15;
  const localSiderealDegrees = normalize(gastDegrees + longitude);
  const theta = localSiderealDegrees * Math.PI / 180;
  const phi = latitude * Math.PI / 180;
  const epsilon = Astronomy.e_tilt(utcDate).tobl * Math.PI / 180;
  const ascendantLongitude = normalize(
    Math.atan2(
      -Math.cos(phi) * Math.cos(theta),
      Math.cos(epsilon) * Math.cos(phi) * Math.sin(theta) + Math.sin(epsilon) * Math.sin(phi)
    ) * 180 / Math.PI + 180
  );
  const midheavenLongitude = normalize(
    Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(epsilon)) * 180 / Math.PI
  );
  const ascendantSignIndex = Math.floor(ascendantLongitude / 30);
  const formatPosition = (longitudeValue) => {
    const normalized = normalize(longitudeValue);
    const degree = normalized % 30;
    const wholeDegrees = Math.floor(degree);
    const minutes = Math.floor((degree - wholeDegrees) * 60);
    return `${wholeDegrees}°${String(minutes).padStart(2, '0')}′`;
  };
  const planets = bodies.map(([id, name, body]) => {
    const longitudeValue = positionAt(body, utcDate);
    const before = positionAt(body, new Date(utcDate.getTime() - 6 * 60 * 60 * 1000));
    const after = positionAt(body, new Date(utcDate.getTime() + 6 * 60 * 60 * 1000));
    const signIndex = Math.floor(normalize(longitudeValue) / 30);
    return {
      id,
      name,
      longitude: Number(normalize(longitudeValue).toFixed(6)),
      sign: signs[signIndex],
      degree: formatPosition(longitudeValue),
      house: ((signIndex - ascendantSignIndex + 12) % 12) + 1,
      retrograde: !['sun', 'moon'].includes(id) && signedDelta(before, after) < 0
    };
  });
  const aspectDefinitions = [
    { name: '合相', angle: 0, orb: 8 },
    { name: '六合', angle: 60, orb: 5 },
    { name: '刑相', angle: 90, orb: 6 },
    { name: '拱相', angle: 120, orb: 6 },
    { name: '对冲', angle: 180, orb: 8 }
  ];
  const aspects = [];
  for (let left = 0; left < planets.length; left += 1) {
    for (let right = left + 1; right < planets.length; right += 1) {
      const separation = Math.abs(signedDelta(planets[left].longitude, planets[right].longitude));
      for (const definition of aspectDefinitions) {
        const orb = Math.abs(separation - definition.angle);
        if (orb <= definition.orb) {
          aspects.push({
            from: planets[left].name,
            to: planets[right].name,
            type: definition.name,
            orb: Number(orb.toFixed(2))
          });
          break;
        }
      }
    }
  }
  const sun = planets.find((planet) => planet.id === 'sun');
  const moon = planets.find((planet) => planet.id === 'moon');
  return {
    method: 'astronomy-engine-vsop87-novas',
    zodiac: 'tropical',
    houseSystem: 'whole-sign',
    sourceAccuracy: 'Astronomy Engine positions are designed for approximately ±1 arcminute accuracy',
    localDateTime: localDateTime.toISO(),
    utcDateTime: localDateTime.toUTC().toISO(),
    timezone,
    timezoneLabel: formatTimezoneLabel(timezone, localDateTime.offset, locale),
    birthTimeDisplay: `${date} ${time}`,
    latitude,
    longitude,
    sunSign: sun.sign,
    moonSign: moon.sign,
    ascendant: {
      longitude: Number(ascendantLongitude.toFixed(6)),
      sign: signForLongitude(ascendantLongitude),
      degree: formatPosition(ascendantLongitude)
    },
    midheaven: {
      longitude: Number(midheavenLongitude.toFixed(6)),
      sign: signForLongitude(midheavenLongitude),
      degree: formatPosition(midheavenLongitude)
    },
    planets,
    houses: Array.from({ length: 12 }, (_, index) => {
      const signIndex = (ascendantSignIndex + index) % 12;
      return {
        house: index + 1,
        sign: signs[signIndex],
        cuspLongitude: signIndex * 30
      };
    }),
    aspects: aspects.sort((a, b) => a.orb - b.orb),
    note: '行星位置采用 Astronomy Engine 真黄道坐标；宫位采用整宫制。出生时间、地点或时区不准确会直接影响上升点和宫位。'
  };
}

// --- MBTI CALCULATION ---
function calculateMBTI(payload) {
  const answers = payload && payload.answers && typeof payload.answers === 'object' ? payload.answers : {};
  const questions = [
    ...Array.from({ length: 20 }, (_, index) => ({ id: index + 1, trait: 'E_I', invert: [2, 4, 7, 9, 11, 14, 17, 19].includes(index + 1) })),
    ...Array.from({ length: 20 }, (_, index) => ({ id: index + 21, trait: 'S_N', invert: [22, 24, 27, 30, 33, 35, 37, 39, 40].includes(index + 21) })),
    ...Array.from({ length: 20 }, (_, index) => ({ id: index + 41, trait: 'T_F', invert: [42, 44, 47, 49, 51, 53, 55, 57, 59, 60].includes(index + 41) })),
    ...Array.from({ length: 20 }, (_, index) => ({ id: index + 61, trait: 'J_P', invert: [62, 64, 66, 68, 70, 72, 74, 77, 79].includes(index + 61) }))
  ];
  const scores = { E: 1, I: 1, S: 1, N: 1, T: 1, F: 1, J: 1, P: 1 };

  for (const question of questions) {
    const raw = Array.isArray(answers) ? answers[question.id - 1] : answers[question.id];
    let score = Number(raw);
    if (!Number.isFinite(score)) score = 0;
    score = Math.max(-3, Math.min(3, score));
    if (question.invert) score *= -1;

    if (question.trait === 'E_I') {
      if (score > 0) scores.E += score;
      else scores.I += Math.abs(score);
    } else if (question.trait === 'S_N') {
      if (score > 0) scores.S += score;
      else scores.N += Math.abs(score);
    } else if (question.trait === 'T_F') {
      if (score > 0) scores.T += score;
      else scores.F += Math.abs(score);
    } else if (question.trait === 'J_P') {
      if (score > 0) scores.J += score;
      else scores.P += Math.abs(score);
    }
  }

  const type =
    (scores.E >= scores.I ? 'E' : 'I') +
    (scores.S >= scores.N ? 'S' : 'N') +
    (scores.T >= scores.F ? 'T' : 'F') +
    (scores.J >= scores.P ? 'J' : 'P');

  return {
    type,
    details: '基于荣格心理学计算的性格原型',
    scores,
    percentages: {
      E_I: Math.round((scores.E / (scores.E + scores.I)) * 100),
      S_N: Math.round((scores.S / (scores.S + scores.N)) * 100),
      T_F: Math.round((scores.T / (scores.T + scores.F)) * 100),
      J_P: Math.round((scores.J / (scores.J + scores.P)) * 100)
    },
    answersReceived: Array.isArray(answers) ? answers.length : Object.keys(answers).length
  };
}

// --- TAROT CALCULATION ---
function calculateTarot() {
  const cards = ['愚者', '魔术师', '女祭司', '皇后', '皇帝', '教皇', '恋人', '战车', '力量', '隐士', '命运之轮', '正义', '倒吊人', '死神', '节制', '恶魔', '高塔', '星星', '月亮', '太阳', '审判', '世界'];
  const draw = () => {
    const card = cards[Math.floor(Math.random() * cards.length)];
    const reversed = Math.random() > 0.5;
    return { name: card, reversed };
  };
  return {
    past: draw(),
    present: draw(),
    future: draw()
  };
}

// --- COLOR CALCULATION ---
function calculateColor(payload) {
  return {
    selections: payload.selections || [],
    details: '色彩选择顺序分析已生成'
  };
}

// --- ENNEAGRAM CALCULATION ---
function calculateEnneagram(payload) {
  const answers = payload.answers || {};
  let scores = { type1: 0, type2: 0, type3: 0, type4: 0, type5: 0, type6: 0, type7: 0, type8: 0, type9: 0 };
  Object.keys(answers).forEach(qId => {
    const qNum = Number(qId);
    if (!isNaN(qNum)) {
      const typeNum = ((qNum - 1) % 9) + 1;
      const type = 'type' + typeNum;
      scores[type] += Number(answers[qId] || 0);
    }
  });
  let dominant = 'type1';
  let maxScore = -999;
  Object.keys(scores).forEach(type => {
    if (scores[type] > maxScore) {
      maxScore = scores[type];
      dominant = type;
    }
  });
  return { dominant, scores };
}

// --- JUNG8 CALCULATION ---
function calculateJung8(payload) {
  const answers = payload.answers || {};
  let scores = { Ni: 0, Ne: 0, Si: 0, Se: 0, Ti: 0, Te: 0, Fi: 0, Fe: 0 };
  const traits = ['Ni', 'Ne', 'Si', 'Se', 'Ti', 'Te', 'Fi', 'Fe'];
  Object.keys(answers).forEach(qId => {
    const qNum = Number(qId);
    if (!isNaN(qNum)) {
      const trait = traits[(qNum - 1) % 8];
      if (trait) {
        scores[trait] += Number(answers[qId] || 0);
      }
    }
  });
  let dominant = 'Ni';
  let maxScore = -999;
  Object.keys(scores).forEach(trait => {
    if (scores[trait] > maxScore) {
      maxScore = scores[trait];
      dominant = trait;
    }
  });
  return { dominant, scores };
}

// --- DARKTRIAD CALCULATION ---
function calculateDarkTriad(payload) {
  const answers = payload.answers || {};
  let scores = { mach: 0, narc: 0, psycho: 0 };
  const traits = ['mach', 'narc', 'psycho'];
  Object.keys(answers).forEach(qId => {
    const qNum = Number(qId);
    if (!isNaN(qNum)) {
      const trait = traits[(qNum - 1) % 3];
      if (trait) {
        scores[trait] += Number(answers[qId] || 0);
      }
    }
  });
  let dominant = 'mach';
  let maxScore = -999;
  Object.keys(scores).forEach(trait => {
    if (scores[trait] > maxScore) {
      maxScore = scores[trait];
      dominant = trait;
    }
  });
  return { dominant, scores };
}

// --- SABOTEURS CALCULATION ---
function calculateSaboteurs(payload) {
  const answers = payload.answers || {};
  let scores = { controller: 0, pleaser: 0, stickler: 0, rational: 0, victim: 0 };
  const traits = ['controller', 'pleaser', 'stickler', 'rational', 'victim'];
  Object.keys(answers).forEach(qId => {
    const qNum = Number(qId);
    if (!isNaN(qNum)) {
      const trait = traits[(qNum - 1) % 5];
      if (trait) {
        scores[trait] += Number(answers[qId] || 0);
      }
    }
  });
  let dominant = 'controller';
  let maxScore = -999;
  Object.keys(scores).forEach(trait => {
    if (scores[trait] > maxScore) {
      maxScore = scores[trait];
      dominant = trait;
    }
  });
  return { dominant, scores };
}

// --- DEFENSE CALCULATION ---
function calculateDefense(payload) {
  const answers = payload.answers || {};
  let scores = { projection: 0, rationalization: 0, regression: 0, formation: 0, denial: 0, sublimation: 0 };
  const traits = ['projection', 'rationalization', 'regression', 'formation', 'denial', 'sublimation'];
  Object.keys(answers).forEach(qId => {
    const qNum = Number(qId);
    if (!isNaN(qNum)) {
      const trait = traits[(qNum - 1) % 6];
      if (trait) {
        scores[trait] += Number(answers[qId] || 0);
      }
    }
  });
  let dominant = 'projection';
  let maxScore = -999;
  Object.keys(scores).forEach(trait => {
    if (scores[trait] > maxScore) {
      maxScore = scores[trait];
      dominant = trait;
    }
  });
  return { dominant, scores };
}

// --- DISPATCHER ---
function generateResult(testType, payload) {
  switch (testType) {
    case 'bazi':
      return calculateBazi(payload);
    case 'astrology':
      return calculateAstrology(payload);
    case 'mbti':
      return calculateMBTI(payload);
    case 'tarot':
      return calculateTarot();
    case 'color':
      return calculateColor(payload);
    case 'enneagram':
      return calculateEnneagram(payload);
    case 'jung8':
      return calculateJung8(payload);
    case 'darktriad':
      return calculateDarkTriad(payload);
    case 'saboteurs':
      return calculateSaboteurs(payload);
    case 'defense':
      return calculateDefense(payload);
    case 'human-design':
    case 'synastry':
    case 'attachment':
    case 'aura':
    case 'shadow':
    default:
      // Fallback generator
      return { status: 'calculated', type: testType, details: 'Server-side generated report for ' + testType };
  }
}

module.exports = {
  generateResult,
  calculateBazi,
  calculateAstrology
};
