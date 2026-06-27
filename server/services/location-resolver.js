const cityTimezones = require('city-timezones');
const Pinyin = require('tiny-pinyin');

const COUNTRY_NAMES_ZH = {
  China: '中国',
  Japan: '日本',
  'South Korea': '韩国',
  'United States of America': '美国',
  Canada: '加拿大',
  France: '法国',
  Germany: '德国',
  Italy: '意大利',
  Spain: '西班牙',
  'United Kingdom': '英国',
  Australia: '澳大利亚',
  Singapore: '新加坡',
  Brazil: '巴西',
  Russia: '俄罗斯'
};

const PROVINCE_NAMES_ZH = {
  Beijing: '北京市',
  Tianjin: '天津市',
  Shanghai: '上海市',
  Chongqing: '重庆市',
  Hebei: '河北省',
  Shanxi: '山西省',
  Liaoning: '辽宁省',
  Jilin: '吉林省',
  Heilongjiang: '黑龙江省',
  Jiangsu: '江苏省',
  Zhejiang: '浙江省',
  Anhui: '安徽省',
  Fujian: '福建省',
  Jiangxi: '江西省',
  Shandong: '山东省',
  Henan: '河南省',
  Hubei: '湖北省',
  Hunan: '湖南省',
  Guangdong: '广东省',
  Hainan: '海南省',
  Sichuan: '四川省',
  Guizhou: '贵州省',
  Yunnan: '云南省',
  Shaanxi: '陕西省',
  Gansu: '甘肃省',
  Qinghai: '青海省',
  Taiwan: '台湾省',
  'Inner Mongolia': '内蒙古自治区',
  Guangxi: '广西壮族自治区',
  Tibet: '西藏自治区',
  Ningxia: '宁夏回族自治区',
  Xinjiang: '新疆维吾尔自治区',
  'Hong Kong': '香港特别行政区',
  Macau: '澳门特别行政区'
};

const ENGLISH_CITY_NAMES = {
  Shashi: 'Jingzhou'
};

const CHINESE_PROVINCE_NAMES = {
  北京: '北京市',
  天津: '天津市',
  上海: '上海市',
  重庆: '重庆市',
  河北: '河北省',
  山西: '山西省',
  辽宁: '辽宁省',
  吉林: '吉林省',
  黑龙江: '黑龙江省',
  江苏: '江苏省',
  浙江: '浙江省',
  安徽: '安徽省',
  Fujian: '福建省',
  Jiangxi: '江西省',
  Shandong: '山东省',
  Henan: '河南省',
  Hubei: '湖北省',
  Hunan: '湖南省',
  Guangdong: '广东省',
  Hainan: '海南省',
  Sichuan: '四川省',
  Guizhou: '贵州省',
  Yunnan: '云南省',
  Shaanxi: '陕西省',
  Gansu: '甘肃省',
  Qinghai: '青海省',
  Taiwan: '台湾省',
  内蒙古: '内蒙古自治区',
  广西: '广西壮族自治区',
  西藏: '西藏自治区',
  宁夏: '宁夏回族自治区',
  新疆: '新疆维吾尔自治区',
  香港: '香港特别行政区',
  澳门: '澳门特别行政区'
};

const LOCATION_ALIASES = [
  ['Beijing', '北京', ['北京', '北京市', 'beijing', 'peking']],
  ['Shanghai', '上海', ['上海', '上海市', 'shanghai']],
  ['Guangzhou', '广州', ['广州', '广州市', '廣州', '廣州市', 'guangzhou', 'canton']],
  ['Shenzhen', '深圳', ['深圳', '深圳市', 'shenzhen']],
  ['Chengdu', '成都', ['成都', '成都市', 'chengdu']],
  ['Chongqing', '重庆', ['重庆', '重庆市', '重慶', '重慶市', 'chongqing']],
  ['Hangzhou', '杭州', ['杭州', '杭州市', 'hangzhou']],
  ['Nanjing', '南京', ['南京', '南京市', 'nanjing', 'nanking']],
  ['Wuhan', '武汉', ['武汉', '武汉市', '武漢', '武漢市', 'wuhan']],
  ["Xi'an", '西安', ['西安', '西安市', "xi'an", 'xian', 'xi an']],
  ['Tianjin', '天津', ['天津', '天津市', 'tianjin', 'tientsin']],
  ['Suzhou', '苏州', ['苏州', '苏州市', '蘇州', '蘇州市', 'suzhou']],
  ['Changsha', '长沙', ['长沙', '长沙市', '長沙', '長沙市', 'changsha']],
  ['Zhengzhou', '郑州', ['郑州', '郑州市', '鄭州', '鄭州市', 'zhengzhou']],
  ['Qingdao', '青岛', ['青岛', '青岛市', '青島', '青島市', 'qingdao', 'tsingtao']],
  ['Xiamen', '厦门', ['厦门', '厦门市', '廈門', '廈門市', 'xiamen', 'amoy']],
  ['Fuzhou', '福州', ['福州', '福州市', 'fuzhou']],
  ['Jinan', '济南', ['济南', '济南市', '濟南', '濟南市', 'jinan']],
  ['Shenyang', '沈阳', ['沈阳', '沈阳市', '瀋陽', '瀋陽市', 'shenyang', 'mukden']],
  ['Dalian', '大连', ['大连', '大连市', '大連', '大連市', 'dalian']],
  ['Harbin', '哈尔滨', ['哈尔滨', '哈尔滨市', '哈爾濱', '哈爾濱市', 'harbin']],
  ['Changchun', '长春', ['长春', '长春市', '長春', '長春市', 'changchun']],
  ['Kunming', '昆明', ['昆明', '昆明市', 'kunming']],
  ['Nanning', '南宁', ['南宁', '南宁市', '南寧', '南寧市', 'nanning']],
  ['Haikou', '海口', ['海口', '海口市', 'haikou']],
  ['Sanya', '三亚', ['三亚', '三亚市', '三亞', '三亞市', 'sanya']],
  ['Guiyang', '贵阳', ['贵阳', '贵阳市', '貴陽', '貴陽市', 'guiyang']],
  ['Hefei', '合肥', ['合肥', '合肥市', 'hefei']],
  ['Nanchang', '南昌', ['南昌', '南昌市', 'nanchang']],
  ['Shashi', '荆州', ['荆州', '荆州市', '荊州', '荊州市', 'jingzhou', 'jing zhou', 'shashi']],
  ['Shijiazhuang', '石家庄', ['石家庄', '石家庄市', '石莊', '石莊市', 'shijiazhuang']],
  ['Taiyuan', '太原', ['太原', '太原市', 'taiyuan']],
  ['Lanzhou', '兰州', ['兰州', '兰州市', '蘭州', '蘭州市', 'lanzhou']],
  ['Urumqi', '乌鲁木齐', ['乌鲁木齐', '乌鲁木齐市', '烏魯木齊', '烏魯木齊市', 'urumqi', 'wulumuqi']],
  ['Lhasa', '拉萨', ['拉萨', '拉萨市', '拉薩', '拉薩市', 'lhasa']],
  ['Hohhot', '呼和浩特', ['呼和浩特', '呼和浩特市', 'hohhot', 'huhehaote']],
  ['Yinchuan', '银川', ['银川', '银川市', '銀川', '銀川市', 'yinchuan']],
  ['Xining', '西宁', ['西宁', '西宁市', '西寧', '西寧市', 'xining']],
  ['Hong Kong', '香港', ['香港', '香港特别行政区', '香港特別行政區', 'hong kong', 'hongkong']],
  ['Macau', '澳门', ['澳门', '澳门特别行政区', '澳門', '澳門特別行政區', 'macau', 'macao']],
  ['Taipei', '台北', ['台北', '台北市', '臺北', '臺北市', 'taipei']],
  ['Tokyo', '东京', ['东京', '东京都', '東京', '東京都', 'tokyo']],
  ['Osaka', '大阪', ['大阪', '大阪市', '大阪府', 'osaka']],
  ['Seoul', '首尔', ['首尔', '首尔市', '首爾', '首爾市', '서울', 'seoul']],
  ['Singapore', '新加坡', ['新加坡', '新加坡市', 'singapore']],
  ['Paris', '巴黎', ['巴黎', 'paris']],
  ['London', '伦敦', ['伦敦', '倫敦', 'london']],
  ['New York', '纽约', ['纽约', '纽约市', '紐約', '紐約市', 'new york', 'new york city', 'nyc']],
  ['Los Angeles', '洛杉矶', ['洛杉矶', '洛杉磯', 'los angeles', 'la']],
  ['San Francisco', '旧金山', ['旧金山', '舊金山', '圣弗朗西斯科', 'san francisco', 'sf']],
  ['Munich', '慕尼黑', ['慕尼黑', 'munich', 'münchen', 'munchen']],
  ['Cologne', '科隆', ['科隆', 'cologne', 'köln', 'koln']],
  ['Vienna', '维也纳', ['维也纳', '維也納', 'vienna', 'wien']],
  ['Rome', '罗马', ['罗马', '羅馬', 'rose', 'roma']],
  ['Moscow', '莫斯科', ['莫斯科', 'moscow', 'москва', 'moskva']],
  ['Sao Paulo', '圣保罗', ['圣保罗', '聖保羅', 'sao paulo', 'são paulo']]
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .replace(/[，、/]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function aliasKey(value) {
  return normalizeText(value)
    .toLocaleLowerCase('en-US')
    .replace(/[.'’_-]+/g, '')
    .replace(/\s+/g, '')
    .replace(/(?:特别行政区|特別行政區|自治州|地区|地區|市|city|municipality)$/iu, '');
}

const ALIAS_INDEX = new Map();
for (const [canonical, displayName, aliases] of LOCATION_ALIASES) {
  for (const alias of [canonical, displayName, ...aliases]) {
    ALIAS_INDEX.set(aliasKey(alias), { canonical, displayName });
  }
}

function scoreMatch(item, canonical) {
  const city = normalizeText(item.city).toLocaleLowerCase('en-US');
  const target = normalizeText(canonical).toLocaleLowerCase('en-US');
  if (city === target) return 3;
  if (city.startsWith(target) || target.startsWith(city)) return 2;
  return 1;
}

function stripCitySuffix(value) {
  return normalizeText(value).replace(/(?:特别行政区|特別行政區|自治州|地区|地區|市)$/u, '');
}

function isEnglishLocale(locale) {
  return String(locale || '').toLowerCase().startsWith('en');
}

function formatTimezoneLabel(timezone, utcOffsetMinutes = null, locale = 'zh-CN') {
  const hasOffset = utcOffsetMinutes !== null && utcOffsetMinutes !== undefined && utcOffsetMinutes !== '';
  const offset = hasOffset ? Number(utcOffsetMinutes) : NaN;
  const offsetText = Number.isFinite(offset)
    ? `UTC${offset >= 0 ? '+' : '-'}${Math.floor(Math.abs(offset) / 60)}${Math.abs(offset) % 60 ? `:${String(Math.abs(offset) % 60).padStart(2, '0')}` : ''}`
    : '';
  const known = isEnglishLocale(locale) ? {
    'Asia/Shanghai': 'China Standard Time',
    'Asia/Hong_Kong': 'Hong Kong Time',
    'Asia/Macau': 'Macau Time',
    'Asia/Taipei': 'Taipei Time',
    'Asia/Tokyo': 'Japan Standard Time',
    'Asia/Seoul': 'Korea Standard Time',
    'Asia/Singapore': 'Singapore Standard Time'
  } : {
    'Asia/Shanghai': '中国标准时间',
    'Asia/Hong_Kong': '香港时间',
    'Asia/Macau': '澳门时间',
    'Asia/Taipei': '台北时间',
    'Asia/Tokyo': '日本标准时间',
    'Asia/Seoul': '韩国标准时间',
    'Asia/Singapore': '新加坡标准时间'
  };
  const name = known[timezone] || (isEnglishLocale(locale) ? 'Local Time' : '当地时间');
  if (!offsetText) return name;
  return isEnglishLocale(locale) ? `${name} (${offsetText})` : `${name}（${offsetText}）`;
}

function createLocationResult({
  city,
  displayName,
  province,
  provinceDisplay,
  country,
  countryDisplay,
  latitude,
  longitude,
  timezone,
  locale = 'zh-CN'
}) {
  const english = isEnglishLocale(locale);
  const cleanCity = english
    ? normalizeText(ENGLISH_CITY_NAMES[city] || displayName || city)
    : stripCitySuffix(displayName || city);
  const cleanProvince = normalizeText(
    english
      ? province
      : (provinceDisplay !== undefined 
          ? (PROVINCE_NAMES_ZH[provinceDisplay] || CHINESE_PROVINCE_NAMES[provinceDisplay] || provinceDisplay) 
          : (PROVINCE_NAMES_ZH[province] || province))
  );
  const cleanCountry = normalizeText(
    english
      ? country
      : (countryDisplay !== undefined 
          ? (COUNTRY_NAMES_ZH[countryDisplay] || countryDisplay) 
          : (COUNTRY_NAMES_ZH[country] || country))
  );
  const parts = [cleanCity];
  if (cleanProvince && stripCitySuffix(cleanProvince) !== cleanCity) parts.push(cleanProvince);
  if (cleanCountry) parts.push(cleanCountry);
  return {
    label: parts.filter(Boolean).join(' · '),
    city,
    displayName: cleanCity,
    province: province || '',
    provinceDisplay: cleanProvince,
    country: country || '',
    countryDisplay: cleanCountry,
    latitude: Number(latitude),
    longitude: Number(longitude),
    timezone,
    timezoneLabel: formatTimezoneLabel(timezone, null, locale)
  };
}

function stripProvincePrefix(query) {
  let clean = query;
  for (const prov of Object.keys(CHINESE_PROVINCE_NAMES)) {
    const fullProv = CHINESE_PROVINCE_NAMES[prov];
    if (clean.startsWith(fullProv)) {
      clean = clean.substring(fullProv.length);
      break;
    }
    if (clean.startsWith(prov)) {
      clean = clean.substring(prov.length);
      break;
    }
  }
  return clean.trim();
}

function translatePinyinToChinese(englishName, query) {
  if (!query || !/[\u4e00-\u9fa5]/.test(query)) return englishName;
  const targetPinyin = englishName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!targetPinyin) return englishName;

  // Try substring matching in the query
  for (let len = query.length; len >= 1; len--) {
    for (let start = 0; start <= query.length - len; start++) {
      const sub = query.substring(start, start + len);
      if (/[\u4e00-\u9fa5]/.test(sub)) {
        const subPinyin = Pinyin.convertToPinyin(sub, '', true).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (subPinyin === targetPinyin) {
          return sub;
        }
      }
    }
  }
  return englishName;
}

function resolveLocations(rawQuery, limit = 8, locale = 'zh-CN') {
  const query = normalizeText(rawQuery).slice(0, 80);
  if (query.length < 2) return [];

  const stripped = stripProvincePrefix(query);
  const alias = ALIAS_INDEX.get(aliasKey(stripped)) || ALIAS_INDEX.get(aliasKey(query));

  let searchKey = stripped;
  if (/[\u4e00-\u9fa5]/.test(stripped)) {
    searchKey = Pinyin.convertToPinyin(stripped, ' ', true);
  }

  const canonical = alias ? alias.canonical : searchKey.replace(/\s+(?:city|municipality)$/iu, '');
  const matches = cityTimezones.findFromCityStateProvince(canonical)
    .sort((left, right) => {
      const accuracy = scoreMatch(right, canonical) - scoreMatch(left, canonical);
      return accuracy || Number(right.pop || 0) - Number(left.pop || 0);
    })
    .slice(0, limit)
    .map((item) => {
      const exactCity = scoreMatch(item, canonical) === 3;
      let cityName = item.city;
      let countryName = item.country;
      let provinceName = item.province;
      
      if (!isEnglishLocale(locale)) {
        if (alias && exactCity) {
          cityName = alias.displayName;
        } else {
          cityName = translatePinyinToChinese(item.city, query);
        }
        countryName = COUNTRY_NAMES_ZH[item.country] || item.country;
        provinceName = PROVINCE_NAMES_ZH[item.province] || item.province;
      }
      const finalProvinceName = [item.city, canonical]
        .some(value => normalizeText(item.province).toLocaleLowerCase('en-US') === normalizeText(value).toLocaleLowerCase('en-US'))
        ? ''
        : provinceName;
      return createLocationResult({
        city: item.city,
        displayName: cityName,
        province: item.province || '',
        provinceDisplay: finalProvinceName,
        country: item.country || '',
        countryDisplay: countryName,
        latitude: Number(item.lat),
        longitude: Number(item.lng),
        timezone: item.timezone,
        locale
      });
    });

  return matches;
}

const remoteCache = new Map();

function mapOpenMeteoLocation(item, locale, originalQuery) {
  const isChina = item.country === '中国' || item.country_code === 'CN';
  
  let cityName = item.name;
  if (isChina && !isEnglishLocale(locale)) {
    const queryChinese = translatePinyinToChinese(item.name, originalQuery);
    if (queryChinese !== item.name) {
      cityName = queryChinese;
    } else if (item.admin2 && /[\u4e00-\u9fa5]/.test(item.admin2)) {
      cityName = stripCitySuffix(item.admin2);
    } else if (item.name && /[\u4e00-\u9fa5]/.test(item.name)) {
      cityName = stripCitySuffix(item.name);
    }
  }

  return createLocationResult({
    city: item.name,
    displayName: cityName,
    province: item.admin1 || '',
    provinceDisplay: isChina ? (CHINESE_PROVINCE_NAMES[item.admin1] || item.admin1 || '') : (item.admin1 || ''),
    country: item.country || '',
    countryDisplay: isChina ? '中国' : (COUNTRY_NAMES_ZH[item.country] || item.country || ''),
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: isChina ? 'Asia/Shanghai' : item.timezone,
    locale
  });
}

async function fetchOpenMeteLocations(query, limit, locale) {
  const stripped = stripProvincePrefix(query);
  let searchKey = stripped;
  if (/[\u4e00-\u9fa5]/.test(stripped)) {
    searchKey = Pinyin.convertToPinyin(stripped, '', true);
  }

  const cacheKey = `${locale}:${searchKey}`;
  const cached = remoteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.locations.slice(0, limit);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2800);
  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', searchKey);
    url.searchParams.set('count', String(Math.min(Math.max(limit, 1), 10)));
    url.searchParams.set('language', isEnglishLocale(locale) ? 'en' : 'zh');
    url.searchParams.set('format', 'json');
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Northstar/1.0 location-resolver' }
    });
    if (!response.ok) return [];
    const payload = await response.json();
    const locations = Array.isArray(payload.results)
      ? payload.results
        .filter(item => {
          if (!item || !item.name || !Number.isFinite(item.latitude) || !Number.isFinite(item.longitude) || !item.timezone) {
            return false;
          }
          const isChinaItem = item.country_code === 'CN' || item.country === '中国';
          if (isChinaItem) {
            const ascii = item.name.toLowerCase().replace(/[^a-z]/g, '');
            const isMajor = ALIAS_INDEX.has(ascii) || ['beijing', 'shanghai', 'tianjin', 'chongqing', 'guangzhou', 'shenzhen', 'chengdu', 'hangzhou', 'wuhan', 'xian'].includes(ascii);
            if (isMajor) {
              const isCorrectProvince = item.admin1 && (
                item.admin1.toLowerCase().includes(ascii) || 
                (ascii === 'peking' && item.admin1.toLowerCase().includes('beijing'))
              );
              if (!isCorrectProvince && (!item.population || item.population < 50000)) {
                return false;
              }
            }
          }
          return true;
        })
        .map(item => mapOpenMeteoLocation(item, locale, query))
      : [];
    remoteCache.set(cacheKey, {
      locations,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });
    return locations.slice(0, limit);
  } catch (error) {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function dedupeLocations(locations, limit) {
  const seen = new Set();
  return locations.filter(item => {
    const key = `${item.label}|${item.timezone}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

async function resolveLocationsAsync(rawQuery, limit = 8, locale = 'zh-CN') {
  const query = normalizeText(rawQuery).slice(0, 80);
  if (query.length < 2) return [];
  const simplifiedQuery = stripCitySuffix(query);
  const [remotePrimary, local] = await Promise.all([
    fetchOpenMeteLocations(query, limit, locale),
    Promise.resolve(resolveLocations(query, limit, locale))
  ]);
  const remote = remotePrimary.length || simplifiedQuery === query
    ? remotePrimary
    : await fetchOpenMeteLocations(simplifiedQuery, limit, locale);
  const alias = ALIAS_INDEX.get(aliasKey(query));
  const preferredLocal = alias
    ? local.filter(item => aliasKey(item.city) === aliasKey(alias.canonical))
    : local;
  const prioritizeLocal = Boolean(
    (alias && preferredLocal[0] && preferredLocal[0].timezone.startsWith('Asia/')) ||
    (preferredLocal[0] && preferredLocal[0].timezone.startsWith('Asia/') && /[\u4e00-\u9fa5]/.test(query))
  );
  return dedupeLocations(prioritizeLocal ? [...preferredLocal, ...remote] : [...remote, ...preferredLocal], limit);
}

module.exports = {
  aliasKey,
  formatTimezoneLabel,
  normalizeText,
  resolveLocations,
  resolveLocationsAsync
};
