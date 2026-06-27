;(function () {
  'use strict'

  const SUPPORTED_LOCALES = ['zh-CN', 'en']
  const DEFAULT_LOCALE = 'zh-CN'
  const textOriginals = new WeakMap()
  const textAppliedValues = new WeakMap()
  const attributeOriginals = new WeakMap()
  const subscribers = new Set()
  let observer = null
  let translating = false

  function normalizeLocale(value) {
    const locale = String(value || '').toLowerCase()
    if (locale === 'en' || locale.startsWith('en-')) return 'en'
    return DEFAULT_LOCALE
  }

  function readInitialLocale() {
    const queryLocale = new URLSearchParams(window.location.search).get('lang')
    if (queryLocale) return normalizeLocale(queryLocale)
    try {
      const stored = localStorage.getItem('northstar_locale')
      if (stored) return normalizeLocale(stored)
    } catch (error) {}
    return normalizeLocale(navigator.language)
  }

  let locale = readInitialLocale()

  function getCatalog(targetLocale = locale) {
    return (window.NORTHSTAR_LOCALES && window.NORTHSTAR_LOCALES[targetLocale]) || {}
  }

  function formatDynamicText(value, targetLocale) {
    if (targetLocale !== 'en') return value
    const tokenTranslations = {
      '心理防御机制': 'Psychological Defense',
      '中国标准时间': 'China Standard Time',
      '日本标准时间': 'Japan Standard Time',
      '韩国标准时间': 'Korea Standard Time',
      '参天大树，倔强不屈': 'Towering tree; principled and resilient',
      '藤蔓花草，柔韧圆融': 'Living vine; adaptable and tactful',
      '初升太阳，光芒万丈': 'Rising sun; warm and radiant',
      '人间星火，细腻敏锐': 'Candle flame; subtle and perceptive',
      '高山岩石，沉稳厚重': 'Mountain earth; steady and dependable',
      '田园之土，包容滋养': 'Garden soil; nurturing and inclusive',
      '刀剑利器，刚毅果决': 'Tempered metal; decisive and courageous',
      '珠玉首饰，精致高贵': 'Precious metal; refined and discerning',
      '江河湖海，奔腾不息': 'Ocean water; expansive and dynamic',
      '雨露之水，润物无声': 'Rain water; intuitive and quietly supportive',
      '本命星盘核心': 'Natal Chart Overview',
      '宫位制': 'House System',
      '行星落点': 'Planetary Placements',
      '主要相位': 'Major Aspects',
      '太阳星座深度解读': 'Sun Sign Reading',
      '核心四轴': 'Core Angles',
      '真黄道坐标': 'True Ecliptic Coordinates',
      '按容许度排序': 'Sorted by Orb',
      '生成星盘海报': 'Save Chart Poster',
      '返回探索大厅': 'Back to Explore',
      '你的本命星盘': 'Your Natal Chart',
      '白羊座': 'Aries',
      '金牛座': 'Taurus',
      '双子座': 'Gemini',
      '巨蟹座': 'Cancer',
      '狮子座': 'Leo',
      '处女座': 'Virgo',
      '天秤座': 'Libra',
      '天蝎座': 'Scorpio',
      '射手座': 'Sagittarius',
      '摩羯座': 'Capricorn',
      '水瓶座': 'Aquarius',
      '双鱼座': 'Pisces',
      '白羊': 'Aries',
      '金牛': 'Taurus',
      '双子': 'Gemini',
      '巨蟹': 'Cancer',
      '狮子': 'Leo',
      '处女': 'Virgo',
      '天秤': 'Libra',
      '天蝎': 'Scorpio',
      '射手': 'Sagittarius',
      '摩羯': 'Capricorn',
      '水瓶': 'Aquarius',
      '双鱼': 'Pisces',
      '太阳': 'Sun',
      '月亮': 'Moon',
      '水星': 'Mercury',
      '金星': 'Venus',
      '火星': 'Mars',
      '木星': 'Jupiter',
      '土星': 'Saturn',
      '天王星': 'Uranus',
      '海王星': 'Neptune',
      '冥王星': 'Pluto',
      '上升': 'Ascendant',
      '天顶': 'Midheaven',
      '整宫制': 'Whole Sign Houses',
      '合相': 'Conjunction',
      '六合': 'Sextile',
      '刑相': 'Square',
      '拱相': 'Trine',
      '对冲': 'Opposition',
      '逆行': 'Retrograde',
      '共情': 'Empathy',
      '想象力': 'Imagination',
      '感受力': 'Sensitivity',
      '新月': 'New Moon',
      '峨眉月': 'Waxing Crescent',
      '上弦月': 'First Quarter',
      '盈凸月': 'Waxing Gibbous',
      '满月': 'Full Moon',
      '亏凸月': 'Waning Gibbous',
      '下弦月': 'Last Quarter',
      '残月': 'Waning Crescent',
      '月相': 'Moon Phase',
      '灵感': 'Creativity',
      '清醒度': 'Clarity',
      '特质': 'Key traits',
      '已完成': 'Completed',
      '个问题': ' questions',
      '个深度问题': ' in-depth questions to',
      '探索你最深层的内心密码': 'explore your deeper personality patterns',
      '全面扫描你的认知偏好与心智积淀': 'map your cognitive preferences and thinking patterns',
      '解析你在压力与焦虑时的潜意识防御路径': 'understand your unconscious defenses under stress and anxiety',
      '剖析你在恋爱与亲密关系中的底层逻辑模式': 'understand your underlying patterns in love and intimacy',
      '请根据真实感受回答以下': 'Answer the following',
      '剖析你在恋爱与亲密关系中的': 'understand your patterns in love and intimacy: ',
      '通过': 'Use',
      '模式': 'patterns',
      '了解你的深层动机与行为模式': 'understand your deeper motivations and behavior patterns',
      '了解你在压力下可能出现的操控、防御与自我保护倾向': 'understand control, defense, and self-protection patterns that may appear under stress',
      '了解哪些内在模式可能影响你的成就、关系与稳定感': 'understand which inner patterns may affect achievement, relationships, and stability',
      '可稍后补': 'Can add later',
      '已补充': 'Added',
      '已填写': 'Completed',
      '更新': 'Update',
      '可选': 'Optional',
      '查看解锁方案': 'View Unlock Options',
      '塔罗': 'Tarot',
      '星盘': 'Astrology',
      '八字': 'BaZi',
      '人类图': 'Human Design',
      '光环': 'Aura'
      ,
      '核心策略': 'Core Strategy'
    }
    let output = String(value)
    for (const [source, translated] of Object.entries(tokenTranslations).sort(([left], [right]) => right.length - left.length)) {
      output = output.split(source).join(translated)
    }
    return output
      .replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/g, '$1-$2-$3')
      .replace(/第\s*(\d+)\s*宫/g, 'House $1')
      .replace(/第\s*(\d+)\s*题\s*[\/／]\s*共\s*(\d+)\s*题/g, 'Question $1 of $2')
      .replace(/Completed\s*(\d+)\s*\/\s*(\d+)\s*项/g, 'Completed $1 of $2 items')
      .replace(/Completed\s*(\d+)\s*\/\s*(\d+)/g, 'Completed $1 of $2')
      .replace(/请凭直觉回答以下\s*(\d+)\s* questions，/g, 'Answer the following $1 questions intuitively to ')
      .replace(/请根据真实感受回答以下\s*(\d+)\s* questions,\s*/g, 'Answer the following $1 questions based on your genuine experience to ')
      .replace(/通过\s*(\d+)\s* in-depth questions to,\s*/g, 'Use $1 in-depth questions to ')
      .replace(/Moon Phase:\s*([^·]+)\s*·\s*Sun:/g, 'Moon Phase: $1 · Sun Sign:')
      .replace(/(\d+)\s*分/g, '$1 pts')
      .replace(/容许度\s*([\d.]+)°/g, 'Orb $1°')
      .replace(/UTC\+0\b/g, 'UTC+0')
      .replace(/：/g, ': ')
      .replace(/，/g, ', ')
      .replace(/。/g, '. ')
  }

  function translateText(value, targetLocale = locale) {
    const source = String(value == null ? '' : value)
    if (targetLocale === DEFAULT_LOCALE || !source.trim()) return source
    const catalog = getCatalog(targetLocale)
    const trimmed = source.trim()
    const exact = catalog[trimmed]
    if (exact) {
      const leading = source.match(/^\s*/)?.[0] || ''
      const trailing = source.match(/\s*$/)?.[0] || ''
      return leading + exact + trailing
    }

    let output = source
    const candidates = window.NORTHSTAR_LOCALE_KEYS?.[targetLocale] || Object.keys(catalog)
    for (const key of candidates) {
      if (key.length < 4 || !output.includes(key)) continue
      output = output.split(key).join(catalog[key])
    }
    return formatDynamicText(output, targetLocale)
  }

  function translateTextNode(node) {
    if (!node || !node.parentElement) return
    if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(node.parentElement.tagName)) return
    if (node.parentElement.closest('.site-language-select')) return
    if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue)
    let original = textOriginals.get(node)
    const lastAppliedValue = textAppliedValues.get(node)
    if (node.nodeValue !== original && node.nodeValue !== lastAppliedValue) {
      original = node.nodeValue
      textOriginals.set(node, original)
    }
    const translated = translateText(original)
    textAppliedValues.set(node, translated)
    if (node.nodeValue !== translated) node.nodeValue = translated
  }

  const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt']

  function translateElementAttributes(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return
    let originals = attributeOriginals.get(element)
    if (!originals) {
      originals = {}
      attributeOriginals.set(element, originals)
    }
    for (const name of TRANSLATABLE_ATTRIBUTES) {
      if (!element.hasAttribute(name)) continue
      if (!(name in originals)) originals[name] = element.getAttribute(name)
      const translated = translateText(originals[name])
      if (element.getAttribute(name) !== translated) element.setAttribute(name, translated)
    }
  }

  function localizeInternalLinks(root) {
    const scope = root.querySelectorAll ? root : document
    scope.querySelectorAll('a[href]').forEach(link => {
      const rawHref = link.getAttribute('href')
      if (!rawHref || rawHref.startsWith('#') || /^(?:https?:|mailto:|tel:)/i.test(rawHref)) return
      const url = new URL(rawHref, window.location.href)
      if (url.origin !== window.location.origin) return
      if (locale === 'en') url.searchParams.set('lang', 'en')
      else url.searchParams.delete('lang')
      link.setAttribute('href', url.pathname.replace(/^\//, './') + url.search + url.hash)
    })
  }

  function translateTree(root = document.body) {
    if (!root || translating) return
    translating = true
    try {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root)
        return
      }
      if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return
      if (root.nodeType === Node.ELEMENT_NODE) translateElementAttributes(root)
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
      let node
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node)
        else translateElementAttributes(node)
      }
      localizeInternalLinks(root.nodeType === Node.DOCUMENT_NODE ? document : root)
      document.documentElement.lang = locale
      document.title = locale === 'en'
        ? 'Northstar | See Yourself and Find Clarity in Relationships'
        : '北极星 Northstar | 看见自己，也看见关系里的答案'
      const description = document.querySelector('meta[name="description"]')
      if (description) {
        description.content = locale === 'en'
          ? 'Northstar offers personality, relationship, tarot, astrology, BaZi, Human Design and compatibility readings to help you understand yourself and your relationships.'
          : '北极星 Northstar 提供 MBTI、依恋类型、塔罗、星盘、八字、人类图与双人合盘等内容，陪你整理性格、关系和当下最在意的问题。'
      }
      const englishTitle = 'Northstar | See Yourself and Find Clarity in Relationships'
      const chineseTitle = '北极星 Northstar | 看见自己，也看见关系里的答案'
      const englishDescription = 'Personality, relationship, tarot, astrology, BaZi, Human Design and compatibility readings for clearer self-understanding.'
      const chineseDescription = '从性格、关系、塔罗与命理角度，整理你正在经历的问题。'
      const socialValues = {
        'meta[property="og:title"]': locale === 'en' ? englishTitle : chineseTitle,
        'meta[property="og:description"]': locale === 'en' ? englishDescription : chineseDescription,
        'meta[property="og:url"]': locale === 'en'
          ? 'https://northstar.fantasy-games.org/?lang=en'
          : 'https://northstar.fantasy-games.org/',
        'meta[property="og:locale"]': locale === 'en' ? 'en_US' : 'zh_CN',
        'meta[name="twitter:title"]': locale === 'en' ? englishTitle : chineseTitle,
        'meta[name="twitter:description"]': locale === 'en' ? englishDescription : chineseDescription
      }
      for (const [selector, content] of Object.entries(socialValues)) {
        const element = document.querySelector(selector)
        if (element) element.setAttribute('content', content)
      }
      const canonical = document.querySelector('link[rel="canonical"]')
      if (canonical) {
        canonical.href = locale === 'en'
          ? 'https://northstar.fantasy-games.org/?lang=en'
          : 'https://northstar.fantasy-games.org/'
      }
    } finally {
      translating = false
    }
  }

  function updateUrl(targetLocale) {
    const url = new URL(window.location.href)
    if (targetLocale === DEFAULT_LOCALE) url.searchParams.delete('lang')
    else url.searchParams.set('lang', targetLocale)
    history.replaceState(history.state, '', url.pathname + url.search + url.hash)
  }

  function setLocale(value) {
    const nextLocale = normalizeLocale(value)
    locale = nextLocale
    try {
      localStorage.setItem('northstar_locale', locale)
    } catch (error) {}
    updateUrl(locale)
    translateTree(document.body)
    subscribers.forEach(callback => callback(locale))
    window.dispatchEvent(new CustomEvent('northstar:localechange', { detail: { locale } }))
  }

  function createStandaloneSelector() {
    if (document.querySelector('.site-language-select')) return
    const wrapper = document.createElement('label')
    wrapper.className = 'standalone-language-switcher'
    wrapper.setAttribute('aria-label', 'Language')
    wrapper.innerHTML = [
      `<span>${locale === 'en' ? 'Language' : '语言'}</span>`,
      '<select class="site-language-select">',
      `<option value="zh-CN">${locale === 'en' ? 'Chinese (Simplified)' : '简体中文'}</option>`,
      '<option value="en">English</option>',
      '</select>'
    ].join('')
    const select = wrapper.querySelector('select')
    select.value = locale
    select.addEventListener('change', event => setLocale(event.target.value))
    document.body.appendChild(wrapper)
  }

  function start() {
    translateTree(document.body)
    observer = new MutationObserver(mutations => {
      if (translating) return
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') translateTextNode(mutation.target)
        mutation.addedNodes.forEach(node => translateTree(node))
      }
    })
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })
    window.setTimeout(createStandaloneSelector, 50)
  }

  window.NorthstarI18n = {
    locales: SUPPORTED_LOCALES,
    getLocale: () => locale,
    isEnglish: () => locale === 'en',
    setLocale,
    subscribe(callback) {
      subscribers.add(callback)
      return () => subscribers.delete(callback)
    },
    t: translateText,
    translateTree
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
