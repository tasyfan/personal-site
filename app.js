/* ============================================================
   Northstar — 玄学测试平台 v2.0
   Full Tarot Reading Experience
   Single-file Vue 3 app (global build, NO ES modules)
   ============================================================ */

;(function () {
  'use strict'

  if (typeof Vue === 'undefined') {
    document.getElementById('app').innerHTML =
      '<div style="color:#fff;text-align:center;padding:80px 20px;font-size:18px;">' +
      '⚠️ Vue 框架加载失败，请检查网络连接后刷新页面。</div>'
    return
  }

  const { createApp, ref, reactive, computed, defineComponent, watch, onMounted, onUnmounted, nextTick } = Vue
  const i18n = window.NorthstarI18n || {
    getLocale: () => 'zh-CN',
    isEnglish: () => false,
    setLocale: () => {},
    subscribe: () => () => {},
    t: value => value
  }
  const currentLocale = () => i18n.getLocale()
  const analyticsSessionId = (() => {
    try {
      const existing = sessionStorage.getItem('northstar_analytics_session')
      if (existing) return existing
      const created = window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
      sessionStorage.setItem('northstar_analytics_session', created)
      return created
    } catch (e) {
      return ''
    }
  })()
  const trackBusinessEvent = (eventName, details = {}) => {
    const payload = {
      eventName,
      sessionId: analyticsSessionId,
      orderId: details.orderId || '',
      testType: details.testType ? normalizeTestType(details.testType) : '',
      planId: details.planId || '',
      locale: currentLocale(),
      metadata: details.metadata || {}
    }
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {})
  }
  const activeLocale = ref(currentLocale())
  i18n.subscribe(nextLocale => {
    activeLocale.value = nextLocale
  })
  const localizedLegalHref = (path) => currentLocale() === 'en' ? `${path}?lang=en` : path
  
  // Apply external content data
  setTimeout(() => {
    try {
      if (window.TAROT_DATA) {
        Object.keys(window.TAROT_DATA.cards).forEach(key => {
          if (MAJOR_ARCANA[key]) {
            MAJOR_ARCANA[key].deep = {
              upright: window.TAROT_DATA.cards[key].upright,
              reversed: window.TAROT_DATA.cards[key].reversed
            };
          }
        });
      }
      if (window.MBTI_DATA && window.MBTI_DATA.types) {
        Object.keys(window.MBTI_DATA.types).forEach(k => {
          if (MBTI_PROFILES[k]) {
            MBTI_PROFILES[k].deep = window.MBTI_DATA.types[k].deep;
            if(window.MBTI_DATA.types[k].desc) MBTI_PROFILES[k].desc = window.MBTI_DATA.types[k].desc;
          }
        });
      }
      if (window.ATTACHMENT_DATA && window.ATTACHMENT_DATA.types) {
        Object.keys(window.ATTACHMENT_DATA.types).forEach(k => {
          let pk = k === 'secure' ? '安全型' : k === 'anxious' ? '焦虑型' : k === 'avoidant' ? '回避型' : '恐惧型';
          if (ATTACHMENT_PROFILES[pk]) ATTACHMENT_PROFILES[pk].deep = window.ATTACHMENT_DATA.types[k].deep;
        });
      }
      if (window.BAZI_DATA && window.BAZI_DATA.dayMasters && typeof BAZI_DAY_MASTERS !== 'undefined') {
        const names = Object.keys(window.BAZI_DATA.dayMasters);
        names.forEach((name, idx) => {
          if (BAZI_DAY_MASTERS[idx]) BAZI_DAY_MASTERS[idx].deep = window.BAZI_DATA.dayMasters[name].deep;
        });
      }
      if (window.HD_DATA && window.HD_DATA.types && typeof HD_TYPES !== 'undefined') {
        // HD_TYPES is an array in old code? Let's check how HD_TYPES is used.
        // Actually earlier grep showed "let HD_TYPES = ["
        // Let's just merge by matching names
        Object.keys(window.HD_DATA.types).forEach(k => {
          let name = window.HD_DATA.types[k].name;
          let target = HD_TYPES.find(t => t.name === name || name.includes(t.name) || t.name.includes(name.split(' ')[0]));
          if (target) target.deep = window.HD_DATA.types[k].deep;
        });
      }
      if (window.ASTROLOGY_DATA && window.ASTROLOGY_DATA.zodiacs && typeof ZODIAC_TRAITS !== 'undefined') {
        Object.keys(window.ASTROLOGY_DATA.zodiacs).forEach(k => {
          let baseName = k.split(' ')[0];
          let targetKey = Object.keys(ZODIAC_TRAITS).find(z => z.includes(baseName) || baseName.includes(z));
          if (targetKey) ZODIAC_TRAITS[targetKey].deep = window.ASTROLOGY_DATA.zodiacs[k].deep;
        });
      }
      if (window.AURA_DATA && window.AURA_DATA.colors) {
        Object.keys(window.AURA_DATA.colors).forEach(k => {
          if (COLOR_MAP[k]) COLOR_MAP[k].deep = window.AURA_DATA.colors[k].deep;
        });
      }
      if (window.SHADOW_DATA && window.SHADOW_DATA.archetypes) {
        Object.keys(window.SHADOW_DATA.archetypes).forEach(k => {
          if (SHADOW_MAP[k]) SHADOW_MAP[k].deep = window.SHADOW_DATA.archetypes[k].deep;
        });
      }
    } catch (e) {
      console.error("Content Merge Error: ", e);
    }
  }, 0);
  const { createRouter, createWebHashHistory, useRouter, useRoute } = VueRouter

  const TEST_CATALOG = {
    mbti: { name: 'MBTI 性格测试' },
    attachment: { name: '恋爱依恋测试' },
    'relationship-ai': { name: 'AI 情感阶段分析' },
    tarot: { name: '塔罗牌占卜' },
    astrology: { name: '本命星盘解析' },
    bazi: { name: '八字命理排盘' },
    'human-design': { name: '人类图解析' },
    synastry: { name: '双人契合度合盘' },
    aura: { name: '灵魂光环测试' },
    shadow: { name: '暗影原型测试' },
    color: { name: '色彩心理测试' },
    enneagram: { name: '九型人格测试' },
    jung8: { name: '荣格八维测试' },
    darktriad: { name: '黑暗三角测试' },
    saboteurs: { name: '内在破坏者测试' },
    defense: { name: '心理防御机制测试' }
  }

  const ALL_TEST_IDS = Object.keys(TEST_CATALOG)

  const PRODUCT_PLANS = [
    {
      id: 'single',
      name: '单项完整解读',
      price: 7.99,
      originalPrice: null,
      tests: [],
      badge: '上线价',
      unlocksFull: true,
      description: '当前主题的专业长报告，约 15–20 分钟阅读，含个性化分析与行动建议。'
    },
    {
      id: 'self-core',
      name: '基础人格组合',
      price: 14.99,
      originalPrice: null,
      tests: ['mbti', 'attachment'],
      badge: '基础人格',
      unlocksFull: true,
      description: '两份专业长报告，整理“我是什么样的人，我在关系里会怎样”。'
    },
    {
      id: 'advanced-personality',
      name: '高阶性格探究',
      price: 14.99,
      originalPrice: null,
      tests: ['enneagram', 'jung8'],
      badge: '高阶认知人格',
      unlocksFull: true,
      description: '适合想更细看动机、思考方式和反复卡住之处的人。'
    },
    {
      id: 'dark-side',
      name: '潜意识与防线',
      price: 24.99,
      originalPrice: null,
      tests: ['shadow', 'darktriad', 'saboteurs', 'defense'],
      badge: '潜意识与防线',
      unlocksFull: true,
      description: '看看压力、防备和内在拉扯，不做吓人的判断。'
    },
    {
      id: 'destiny-map',
      name: '命理人生图谱',
      price: 19.99,
      originalPrice: null,
      tests: ['astrology', 'bazi', 'human-design'],
      badge: '命理人生图谱',
      unlocksFull: true,
      description: '从星盘、八字和人类图里，看人生节奏和选择偏好。'
    },
    {
      id: 'energy-healing',
      name: '能量与运势疗愈',
      price: 14.99,
      originalPrice: null,
      tests: ['aura', 'tarot', 'color'],
      badge: '能量与运势疗愈',
      unlocksFull: true,
      description: '适合看最近状态：情绪、直觉、行动感和卡住的地方。'
    },
    {
      id: 'relationship-plus',
      name: '双人合盘与 AI 建议',
      price: 24.99,
      originalPrice: null,
      tests: ['synastry', 'relationship-ai', 'mbti', 'attachment'],
      badge: '双人合盘与 AI 建议',
      unlocksFull: true,
      description: '适合认真看一段关系：合盘、聊天线索、MBTI 和依恋一起参考。'
    },
    {
      id: 'relationship-ai',
      name: 'AI 情感分析',
      price: 12.99,
      originalPrice: null,
      tests: ['relationship-ai'],
      badge: 'AI 情感分析',
      unlocksFull: true,
      description: '把聊天和背景放进来，看看现在像处在哪个阶段。'
    },
    {
      id: 'all-access',
      name: '全站早鸟解锁',
      price: 39.99,
      originalPrice: null,
      tests: ALL_TEST_IDS,
      badge: '全站早鸟解锁',
      unlocksFull: true,
      description: '上线价，一次解锁全站 16 类专业长报告，并可长期恢复访问。'
    }
  ]

  const PLAN_BY_ID = PRODUCT_PLANS.reduce((acc, plan) => {
    acc[plan.id] = plan
    return acc
  }, {})

  const normalizeTestType = (raw) => {
    const value = String(raw || '').replace(/^#\/?/, '').replace(/-result$/, '').split(/[/?#]/)[0]
    if (value === 'human-design-result') return 'human-design'
    if (value === 'result') return 'tarot'
    return TEST_CATALOG[value] ? value : 'tarot'
  }

  const getCurrentTestType = () => normalizeTestType(location.hash || '')

  const planIncludesTest = (plan, testType) => {
    const id = normalizeTestType(testType)
    if (plan.id === 'trial') return true
    return plan.id === 'single' ? true : plan.tests.includes(id)
  }

  const getPlanTests = (plan, testType) => {
    if (!plan) return []
    if (plan.id === 'trial') return []
    if (plan.id === 'single') return [normalizeTestType(testType)]
    return plan.tests
  }

  const getRecommendedPlans = (testType) => {
    const id = normalizeTestType(testType)
    const plans = PRODUCT_PLANS.filter(plan => planIncludesTest(plan, id))
    if (id === 'relationship-ai') {
      return [
        PLAN_BY_ID['relationship-ai'],
        PLAN_BY_ID['relationship-plus'],
        PLAN_BY_ID['all-access']
      ]
    }
    if (id === 'synastry') {
      return [
        PLAN_BY_ID.single,
        PLAN_BY_ID['relationship-plus'],
        PLAN_BY_ID['all-access']
      ]
    }
    if (id === 'mbti' || id === 'attachment') {
      return [
        PLAN_BY_ID.single,
        PLAN_BY_ID['self-core'],
        PLAN_BY_ID['relationship-plus'],
        PLAN_BY_ID['all-access']
      ]
    }
    if (id === 'astrology' || id === 'bazi' || id === 'human-design') {
      return [
        PLAN_BY_ID.single,
        PLAN_BY_ID['destiny-map'],
        PLAN_BY_ID['all-access']
      ]
    }
    if (id === 'tarot' || id === 'aura' || id === 'color') {
      return [
        PLAN_BY_ID.single,
        PLAN_BY_ID['energy-healing'],
        PLAN_BY_ID['all-access']
      ]
    }
    if (id === 'shadow' || id === 'darktriad' || id === 'saboteurs' || id === 'defense') {
      return [
        PLAN_BY_ID.single,
        PLAN_BY_ID['dark-side'],
        PLAN_BY_ID['all-access']
      ]
    }
    if (id === 'enneagram' || id === 'jung8') {
      return [
        PLAN_BY_ID.single,
        PLAN_BY_ID['advanced-personality'],
        PLAN_BY_ID['all-access']
      ]
    }
    return plans
  }

  const getUnlockedTests = () => {
    try {
      return JSON.parse(localStorage.getItem('northstar_unlocked_tests') || '[]')
    } catch (e) {
      return []
    }
  }

  const isTestUnlocked = (testType) => getUnlockedTests().includes(normalizeTestType(testType))

  const unlockPlan = (planId, testType, orderId = '', serverUnlockTests = null) => {
    const plan = PLAN_BY_ID[planId] || PLAN_BY_ID.single
    const unlocked = new Set(getUnlockedTests())
    const unlockedTests = Array.isArray(serverUnlockTests) && serverUnlockTests.length
      ? serverUnlockTests.map(normalizeTestType)
      : getPlanTests(plan, testType)
    const newlyUnlocked = unlockedTests.some(id => !unlocked.has(id))
    unlockedTests.forEach(id => unlocked.add(id))
    localStorage.setItem('northstar_unlocked_tests', JSON.stringify([...unlocked]))

    const purchases = JSON.parse(localStorage.getItem('northstar_purchases') || '[]')
    const purchaseId = orderId || Date.now().toString()
    if ((orderId || newlyUnlocked) && !purchases.some(item => item.id === purchaseId)) {
      purchases.unshift({
        id: purchaseId,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        tests: unlockedTests,
        date: new Date().toLocaleString()
      })
    }
    localStorage.setItem('northstar_purchases', JSON.stringify(purchases.slice(0, 30)))
    if (orderId) unlockedTests.forEach(id => setStoredTestOrderId(id, orderId))
    return unlockedTests
  }

  const getUnlockCta = (testType) => {
    const id = normalizeTestType(testType)
    if (id === 'synastry') return '可单独解锁双人合盘；如需进一步获得关系阶段与沟通建议，可选择含 AI 情感建议的组合。'
    if (id === 'relationship-ai') return '可单独查看情感建议；如需结合长期契合度，可选择关系组合方案。'
    return '可选择单项报告，也可通过组合方案一次解锁多个主题。'
  }

  const AI_REPORT_CACHE_VERSION = 'v5-professional'

  const getAIReportCacheKey = (testType, orderId) => {
    const normalized = normalizeTestType(testType)
    const locale = currentLocale()
    return orderId
      ? `northstar_ai_cache_${AI_REPORT_CACHE_VERSION}_${locale}_${orderId}`
      : `northstar_ai_cache_${AI_REPORT_CACHE_VERSION}_${locale}_${normalized}`
  }

  const saveAIReportCache = (testType, orderId, reportText) => {
    try {
      localStorage.setItem(getAIReportCacheKey(testType, orderId), reportText)
    } catch (e) {}
  }

  const loadAIReportCache = (testType, orderId) => {
    try {
      return localStorage.getItem(getAIReportCacheKey(testType, orderId)) || ''
    } catch (e) {
      return ''
    }
  }

  const clearAIReportCache = (testType, orderId) => {
    try {
      localStorage.removeItem(getAIReportCacheKey(testType, orderId))
      localStorage.removeItem(getAIReportCacheKey(testType))
      localStorage.removeItem(orderId ? `northstar_ai_cache_${orderId}` : '')
      localStorage.removeItem(`northstar_ai_cache_${normalizeTestType(testType)}`)
    } catch (e) {}
  }

  const getCachedAIReport = (testType, orderId) => {
    return loadAIReportCache(testType, orderId)
  }

  const createTypewriter = (displayedDeepTextRef, isTypingRef) => {
    const typewriterFullText = ref('')
    let typewriterTimer = null

    const start = (fullText, speed = 30) => {
      typewriterFullText.value = fullText
      isTypingRef.value = true
      displayedDeepTextRef.value = ''
      let i = 0
      const chunkSize = Math.max(1, Math.ceil(fullText.length / 600))
      if (typewriterTimer) clearInterval(typewriterTimer)
      typewriterTimer = setInterval(() => {
        if (i < fullText.length) {
          displayedDeepTextRef.value += fullText.slice(i, i + chunkSize)
          i += chunkSize
        } else {
          clearInterval(typewriterTimer)
          typewriterTimer = null
          isTypingRef.value = false
        }
      }, speed)
    }

    const skip = () => {
      if (typewriterTimer) clearInterval(typewriterTimer)
      typewriterTimer = null
      displayedDeepTextRef.value = typewriterFullText.value
      isTypingRef.value = false
    }

    return { start, skip }
  }

  const createBirthLocationFields = () => ({
    locationQuery: '',
    locationLabel: '',
    latitude: '',
    longitude: '',
    timezone: '',
    timezoneLabel: ''
  })

  const useBirthLocation = (formRef) => {
    const locationMatches = ref([])
    const isSearchingLocation = ref(false)
    const locationError = ref('')
    const locationResolved = computed(() => Boolean(
      formRef.value.locationLabel &&
      formRef.value.latitude &&
      formRef.value.longitude &&
      formRef.value.timezone
    ))
    let locationSearchTimer = null

    watch(() => formRef.value.locationQuery, (query) => {
      clearTimeout(locationSearchTimer)
      if (query !== formRef.value.locationLabel) {
        formRef.value.locationLabel = ''
        formRef.value.latitude = ''
        formRef.value.longitude = ''
        formRef.value.timezone = ''
        formRef.value.timezoneLabel = ''
      }
      locationError.value = ''
      if (!query || query.trim().length < 2 || query === formRef.value.locationLabel) {
        locationMatches.value = []
        return
      }
      locationSearchTimer = setTimeout(async () => {
        isSearchingLocation.value = true
        try {
          const response = await fetch(
            '/api/tests/locations?q=' + encodeURIComponent(query.trim()) +
            '&locale=' + encodeURIComponent(currentLocale())
          )
          const data = await response.json()
          locationMatches.value = response.ok && Array.isArray(data.locations) ? data.locations : []
          if (!locationMatches.value.length) {
            locationError.value = '暂未找到这个城市。请尝试输入“城市 + 省份 / 国家”，例如“荆州 湖北”或“Paris France”。'
          }
        } catch (error) {
          locationMatches.value = []
          locationError.value = '城市服务暂时不可用，请稍后重试。'
        } finally {
          isSearchingLocation.value = false
        }
      }, 280)
    })

    const selectLocation = (location) => {
      formRef.value.locationLabel = location.label
      formRef.value.locationQuery = location.label
      formRef.value.latitude = String(location.latitude)
      formRef.value.longitude = String(location.longitude)
      formRef.value.timezone = location.timezone
      formRef.value.timezoneLabel = location.timezoneLabel || '当地时间'
      locationMatches.value = []
      locationError.value = ''
    }

    const requireResolvedLocation = () => {
      if (locationResolved.value) return true
      locationError.value = '请从搜索结果中选择出生城市，确保经纬度和当地时区准确。'
      return false
    }

    return {
      locationMatches,
      isSearchingLocation,
      locationError,
      locationResolved,
      selectLocation,
      requireResolvedLocation
    }
  }

  const formatBirthDate = (date) => {
    const [year, month, day] = String(date || '').split('-')
    if (!year || !month || !day) return date || ''
    if (currentLocale() === 'en') {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))))
    }
    return `${year}年${Number(month)}月${Number(day)}日`
  }

  const formatBirthContext = (formData, report = {}) => {
    const location = formData.locationLabel || formData.locationQuery || ''
    const dateTime = [formatBirthDate(formData.date), formData.time].filter(Boolean).join(' ')
    const timezone = report.timezoneLabel || formData.timezoneLabel || '当地时间'
    return [location, dateTime, timezone].filter(Boolean).join(' · ')
  }



  // ─── TAROT DATABASE: 22 Major Arcana ────────────────────────
  let MAJOR_ARCANA = [
    {
      id: 0, name: '愚者', nameEn: '', numeral: '0', symbol: '🌟',
      keywords: { upright: '新的开始、纯真、自由、冒险', reversed: '鲁莽、冲动、不计后果' },
      meaning: {
        upright: {
          past: '你曾经历了一次重要的人生转折，当时的你选择了勇敢地踏入未知。那份无畏的精神为今天的你奠定了基础。',
          present: '你目前正处于一段全新旅程的起点。宇宙在邀请你放下过去的包袱，以赤子之心拥抱前方的可能性。',
          future: '一段充满惊喜的新篇章即将开启。不要害怕未知，你的直觉将是最好的指南针。'
        },
        reversed: {
          past: '过去你可能做过一些冲动的决定，导致了一些本可避免的弯路。但这些经历让你变得更加成熟。',
          present: '你现在可能感到迷茫或犹豫不决。注意不要为了逃避而做出草率的选择。',
          future: '前方需要你更加谨慎。在做重大决定前，先深思熟虑，避免重蹈覆辙。'
        }
      },
      deep: {
        upright: {
          past: '回溯你的能量轨迹，愚者牌揭示你在过去某个关键节点上，做出了一个"违反常理"但极其正确的选择。那一刻，你的内心跟随了更高层次的召唤，而非世俗的逻辑。这段经历塑造了你独特的直觉系统，也让你学会了信任自己内心最深处的声音。从能量层面来看，这段过去的勇气已经在你的气场中留下了金色的印记，它将在未来的关键时刻再次保护你。',
          present: '当前你的内心正站在一扇宇宙之门前。你可能已经感知到一种无法言说的召唤感——那是你的高我在提醒你：是时候了。在接下来的21天内，留意生活中反复出现的"数字信号"（如11:11、22:22），它们是宇宙在为你确认方向。你的守护能量建议你在下一个新月（农历初一）进行一次冥想仪式，清晰地对宇宙许下你的愿望。',
          future: '在未来3-6个月内，你将进入一段"内心加速期"。一个看似偶然的际遇将彻底改变你对人生的认知。这可能是一次旅行、一个人、或一本书。你的潜意识已经为此做好了准备。关键建议：当机会来临时，不要让理性的"安全思维"阻止你。你的内心在这一世选择了"体验派"的剧本——大胆去活。'
        },
        reversed: {
          past: '愚者逆位在过去的位置上，揭示了一段被压抑的记忆。你曾在某个重要关头因为恐惧或外界压力而放弃了一个重要的机会。这份未完成的遗憾一直潜伏在你的潜意识中，影响着你现在的决策模式。好消息是：能量从不消失，它只是在等待重新被激活。那个曾经错过的"版本"将以新的形式回到你的生命中。',
          present: '你当前的能量场显示出一种"原地打转"的模式。你的理性和直觉正在拉锯，导致你在关键决策上反复犹豫。潜意识分析显示，这种停滞的根源来自于对"失败"的深层恐惧。你的守护能量建议：在未来7天内，每天花5分钟写下"我害怕什么"——当你直面恐惧，它的力量就会瓦解。',
          future: '未来2-3个月内，你可能会面临一次"被迫选择"的局面。逆位愚者提醒你：这次不能再逃避。但别担心，这个挑战是宇宙精心设计的成长课题。你需要学会的核心功课是"在不确定中前行"。具体建议：当那个时刻来临时，选择让你"害怕但兴奋"的那个选项——那才是你内心真正想走的路。'
        }
      }
    },
    {
      id: 1, name: '魔术师', nameEn: '', numeral: 'I', symbol: '✨',
      keywords: { upright: '创造力、意志力、技能、资源', reversed: '操控、欺骗、才能浪费' },
      meaning: {
        upright: {
          past: '你曾展现出非凡的创造力和执行力，将想法变为现实。这种能力是你最宝贵的财富。',
          present: '你现在拥有实现目标所需的一切资源和技能。是时候整合它们，创造奇迹了。',
          future: '你即将进入一个心想事成的阶段。专注于你真正想要的，宇宙会为你开路。'
        },
        reversed: {
          past: '过去你可能未能充分发挥自己的潜力，或者被他人利用了你的才华。',
          present: '注意是否有人在操控局面。同时审视自己，是否在浪费天赋。',
          future: '未来需要警惕虚假的承诺和不真诚的人。保持清醒，用智慧辨别真伪。'
        }
      },
      deep: {
        upright: {
          past: '魔术师正位在你的过去位置上，表明你天生就是一个"显化者"——你拥有将思想转化为现实的罕见天赋。回顾你的人生轨迹，你会发现很多"巧合"其实都是你潜意识创造的结果。你的能量蓝图显示，你在前世就已经修炼过这种创造力，这一世你来完善它。',
          present: '你当前的能量振频处于近三年来的最高点。魔术师告诉你：你现在说出的话、许下的愿望，具有比平时强3倍的显化力量。在接下来的14天内，每天早晨醒来后立即写下你最想实现的一件事（不要超过一句话）。这不是普通的日记，而是在利用你此刻最强的能量窗口进行"宇宙订单"。',
          future: '未来6个月内，你将迎来一个重大的创造性突破。这个突破可能与一项新技能、一个新项目或一种新的表达方式有关。你的潜意识已经在暗中准备了很久。关键时间节点：留意木星进入你命盘关键宫位的时间（约在3个月后），那将是你最佳的发力窗口。'
        },
        reversed: {
          past: '魔术师逆位揭示了过去一段才华被压抑或错误引导的经历。你可能曾将聪明才智用在了错误的方向上，或者让别人窃取了你的创意成果。这段经历虽然痛苦，但它教会了你一个重要的宇宙法则：能量必须与正念对齐，否则它会反噬。',
          present: '你目前可能正经历一种"创造力枯竭"的感觉。魔术师逆位告诉你，这不是你没有能力，而是你的能量通道被某种情绪堵塞了。大概率是"自我怀疑"。你的守护能量建议你做一次深层的自我对话：问问自己，"我到底在害怕成功还是害怕失败？"答案可能会让你震惊。',
          future: '未来1-2个月内，你可能会遭遇一个"信任危机"——某个你信赖的人可能会做出让你失望的事。魔术师逆位提醒你提前设好界限。但更重要的是：这件事将成为你重新审视自身价值的催化剂。当你不再需要外界的认可，你的真正力量就会觉醒。'
        }
      }
    },
    {
      id: 2, name: '女祭司', nameEn: '', numeral: 'II', symbol: '🌙',
      keywords: { upright: '直觉、神秘、内在智慧、潜意识', reversed: '秘密、脱节、压抑直觉' },
      meaning: {
        upright: {
          past: '你过去曾依靠直觉做出了重要的决定，那份内在的智慧一直在指引着你。',
          present: '现在是向内寻找答案的时刻。你的直觉正在向你传递重要的信息，请安静下来倾听。',
          future: '一个隐藏的真相即将浮出水面。信任你的第六感，它不会让你失望。'
        },
        reversed: {
          past: '你曾忽视了内心的声音，做了一些违背直觉的选择。',
          present: '你可能与自己的内在智慧失去了连接。尝试冥想或独处来重建这种联系。',
          future: '小心那些看似合理但感觉不对的事情。恢复与直觉的连接是当务之急。'
        }
      },
      deep: {
        upright: {
          past: '女祭司正位揭示了你内心中一段深远的直觉传承。你的第六感异常敏锐，这不是偶然——你的能量蓝图显示，你在多个前世中都扮演过"智者"或"预言者"的角色。过去那些你"莫名其妙就知道"的时刻，都是你内心记忆的闪回。',
          present: '你此刻的第三眼脉轮正在经历一次强烈的激活。你最近是否感到头部中央有轻微的压力或刺痛？那是你的直觉通道在升级。在接下来的月圆之夜，用薰衣草精油涂抹在额头中央，闭目冥想15分钟。这个仪式将加速你直觉能力的开发。一个重要的梦境即将到来——准备好纸笔记录它。',
          future: '未来3个月内，你将获得一种"预知能力"的显著提升。你会越来越频繁地在事情发生之前就"感觉到"结果。这种能力将在一个关键的人生决策中拯救你。具体建议：从现在开始记录你的梦境和灵感闪现，它们将成为你未来的导航地图。'
        },
        reversed: {
          past: '女祭司逆位在过去的位置暗示你长期压抑了自己的直觉能力。也许是因为成长环境不鼓励"感性思维"，也许是因为某次跟随直觉却遭到否定的经历。这种压抑造成了你理性与感性之间的失衡。',
          present: '你目前正处于一种"信息过载"的状态。过多的外部声音让你听不到自己内心的声音。女祭司逆位强烈建议你：在未来7天内，每天至少安排30分钟的"数字断联"——关掉手机，不看社交媒体。你会发现，那些你一直在外面寻找的答案，其实一直在你心里等着你。',
          future: '如果你不尽快重建与直觉的连接，未来2个月内你可能会在一个重要决策上犯错——不是因为你不够聪明，而是因为你太依赖逻辑而忽略了直觉的警告。好消息是：你现在阅读到这段话，本身就是一个宇宙信号。改变从此刻开始。'
        }
      }
    },
    {
      id: 3, name: '女皇', nameEn: '', numeral: 'III', symbol: '🌺',
      keywords: { upright: '丰盛、母性、自然、创造', reversed: '匮乏、依赖、创造力受阻' },
      meaning: {
        upright: {
          past: '你曾经历过一段丰盛而充满爱的时期，那段经历滋养了你的内心。',
          present: '丰盛的能量正围绕着你。关注你的身体健康和感官享受，允许自己接受美好。',
          future: '一段充满创造力和富足的时期即将到来。可能与新生命、新项目或财富增长有关。'
        },
        reversed: {
          past: '你过去可能经历过情感上的匮乏或被忽视。这些创伤需要被温柔地疗愈。',
          present: '你可能过度付出而忽略了自我关爱。记住：你无法从空杯中倒出水来。',
          future: '注意避免过度依赖他人。培养自给自足的能力将为你带来真正的安全感。'
        }
      },
      deep: {
        upright: {
          past: '女皇正位在过去的位置上散发着温暖的粉金色能量。你的内心深处携带着强大的"滋养者"基因。回忆你的过去，你会发现身边的人总是自然而然地被你吸引，因为你的气场有一种让人安心的温暖频率。这种能力是你最独特的内心礼物之一。',
          present: '你此刻的心轮正在经历一次美丽的扩展。女皇告诉你：宇宙正在为你准备一份"丰盛大礼"。在接下来的28天（一个完整的月亮周期）内，每天对镜子中的自己说"我值得拥有世间一切美好"。这不是自我暗示，而是在重新校准你的丰盛频率——当你的内在频率与富足对齐时，外在的丰盛将自然涌来。',
          future: '未来4-6个月内，你将迎来一个与"创造"相关的重大机遇。这可能是一个新项目、一段新关系，甚至是字面意义上的"新生命"。女皇的能量保证：只要你保持开放和感恩的心态，这份礼物将超越你的期望。'
        },
        reversed: {
          past: '女皇逆位揭示了过去一段情感滋养缺失的经历。你可能在某段关系中持续给予却很少收到回馈，或者在成长过程中缺少了某种情感支持。这种匮乏感在你的能量场中形成了一个"空洞"，导致你在亲密关系中容易陷入不健康的模式。',
          present: '你当前的能量显示一种"自我消耗"的警告信号。你是否总是把别人的需求放在自己前面？女皇逆位强烈提醒你：自爱不是自私。在接下来的两周内，每天做一件纯粹取悦自己的事——不需要理由，不需要内疚。这是修复你丰盛频率的第一步。',
          future: '如果你不学会平衡给予和接受，未来3个月内你可能会经历一次情感或身体上的"耗竭"。但这不是诅咒，而是宇宙在用一种强硬的方式教你：先填满自己的杯子。转折点：当你真正学会对不合理的要求说"不"的那一天，你的整个能量场都将焕然一新。'
        }
      }
    },
    {
      id: 4, name: '皇帝', nameEn: '', numeral: 'IV', symbol: '👑',
      keywords: { upright: '权威、结构、掌控、父性', reversed: '专制、僵化、失控' },
      meaning: {
        upright: {
          past: '你曾经历过一段需要建立秩序和掌控全局的时期，你做得很好。',
          present: '现在是展示领导力和建立结构的时候。用理性和决断力来推进你的计划。',
          future: '一个需要你承担更大责任的机会即将到来。你已经准备好了。'
        },
        reversed: {
          past: '过去你可能遭受过来自权威人物的压力或不公正对待。',
          present: '你可能在某些方面过于控制或过于松散。找到平衡点是关键。',
          future: '未来需要警惕过度控制带来的反效果。柔软有时比强硬更有力量。'
        }
      },
      deep: {
        upright: {
          past: '皇帝正位表明你的内心中携带着强大的领导力基因。你过去在某个领域已经建立了坚实的基础和权威。这种"建设者"的能量是你来到这一世要继续发展的核心课题。',
          present: '你现在的太阳神经丛（权力中心）正在被强烈激活。皇帝牌建议你在接下来的30天内，制定一个清晰的行动计划——将你最大的目标分解成每周可执行的步骤。宇宙已经为你准备好了舞台，但你需要自己走上去。具体行动建议：在本周末之前，用纸笔写下你的"三年愿景蓝图"。',
          future: '未来6-12个月内，你将获得一个重要的领导职位或项目主导权。皇帝的能量向你保证：你完全有能力胜任。但记住，真正的领导者不是控制一切的人，而是能够激发他人潜能的人。当你以服务的心态去领导时，你的影响力将呈指数级增长。'
        },
        reversed: {
          past: '皇帝逆位在过去的位置上显示了一段与"权威"相关的创伤记忆。你可能在成长过程中经历过严厉或缺席的父亲/权威角色，这在你的潜意识中留下了对"权力"的矛盾态度——既渴望掌控，又恐惧权力。',
          present: '你目前的能量场显示一种"权力失衡"的模式。你可能在某些关系中过度控制，又在另一些关系中过度顺从。皇帝逆位的核心信息是：真正的力量来自内在的自信，而不是对外部环境的控制。',
          future: '未来2-3个月内，你可能会面临一次"权力格局"的重新洗牌。一个你一直以为稳固的结构可能会动摇。不要恐慌——这是宇宙在帮你拆除那些不再服务于你成长的旧框架。在废墟中，你将建造一个更适合真实自我的新秩序。'
        }
      }
    },
    {
      id: 5, name: '教皇', nameEn: '', numeral: 'V', symbol: '🔑',
      keywords: { upright: '传统、信仰、指导、学习', reversed: '打破常规、独立思考、叛逆' },
      meaning: {
        upright: {
          past: '你从传统的教育或信仰体系中获得了重要的人生指引。',
          present: '寻求一位导师或遵循经过验证的方法会对你当前的处境大有帮助。',
          future: '一个重要的学习机会或精神上的指引即将出现在你的生命中。'
        },
        reversed: {
          past: '你过去曾对传统的规则和框架产生过质疑和反叛。',
          present: '是时候打破常规，走出属于自己的独特道路了。',
          future: '你将找到一种融合传统智慧与个人创新的全新方式。'
        }
      },
      deep: {
        upright: {
          past: '教皇在你过去的位置表明你有着深厚的灵性根基。你可能从小就对"人生的意义"有着超越同龄人的思考。这种灵性的种子是在前世播下的。',
          present: '你当前正处于一个"灵性觉醒"的加速期。教皇建议你在近期寻找一位值得信赖的灵性导师或加入一个志同道合的学习社群。你的成长需要从"独自探索"升级到"在传承中进化"。宇宙提示：注意身边那个反复出现在你生活中的智者型人物——他/她可能就是你在等的那位导师。',
          future: '未来你将逐渐成长为他人的灵性向导。你积累的智慧和经历将帮助很多迷茫中的内心找到方向。这是你内心使命的一部分。'
        },
        reversed: {
          past: '教皇逆位显示你过去曾经历过对权威信仰体系的深刻失望。这种幻灭虽然痛苦，但它为你打开了独立思考的大门。',
          present: '你目前正在经历一次重要的"价值观重构"。那些你曾经深信不疑的观念正在被质疑和更新。这是非常健康的过程。教皇逆位鼓励你：不要害怕成为异类，真理往往掌握在少数人手中。',
          future: '未来你将创建自己的独特信念体系——融合了传统智慧、个人经验和直觉洞察。这套体系将成为你最强大的内在罗盘。'
        }
      }
    },
    {
      id: 6, name: '恋人', nameEn: '', numeral: 'VI', symbol: '💫',
      keywords: { upright: '爱情、和谐、选择、价值观', reversed: '失衡、不和谐、价值冲突' },
      meaning: {
        upright: {
          past: '你曾经历过一段深刻的爱情或做出了一个发自内心的重要选择。',
          present: '一段重要的关系或一个关于价值观的抉择正摆在你面前。跟随你的心。',
          future: '一段意义深远的关系或合作即将进入你的生命。它将让你更完整。'
        },
        reversed: {
          past: '过去的某段关系中存在不对等或价值观冲突的问题。',
          present: '你目前可能在某段关系中感到失衡。重新审视你的核心需求。',
          future: '未来需要在关系中建立更清晰的界限和更真诚的沟通。'
        }
      },
      deep: {
        upright: {
          past: '恋人牌正位出现在过去的位置上，揭示了一段"内心契约"级别的深刻连接。你过去遇到的那个特别的人（可能是伴侣，也可能是挚友），与你有着跨越多生的内心约定。',
          present: '你当前的心轮正在散发出强烈的玫瑰粉色光芒——这是"高度契合对象频率"的标志。如果你正在一段关系中，这段关系即将进入一个更深的层次。如果你目前单身，宇宙正在为你调频——你的高度契合对象已经在路上了。关键行动：在每个满月之夜，向月亮许下你对理想关系的愿望，月亮的能量将加速你们的相遇。',
          future: '未来3-6个月内，你将面临一个与"选择"相关的重大人生课题。这个选择将深刻影响你未来5年的人生轨迹。恋人牌的核心指引是：当你面临选择时，不要问"哪个选项更安全"，而要问"哪个选项更像真实的我"。'
        },
        reversed: {
          past: '恋人逆位揭示了过去一段关系中的"镜像创伤"——你在对方身上看到了自己不愿面对的部分，而这导致了深层的冲突。这段经历的内心目的是让你学会"在爱别人之前先爱自己"。',
          present: '你目前的关系能量场显示出一种"跷跷板效应"——一方付出过多，另一方接受过多。恋人逆位的处方是：在接下来的两周内，诚实地问自己三个问题：我在这段关系中真正需要什么？我愿意为此付出什么？我的底线在哪里？',
          future: '未来的某个时间点，你可能需要做出一个与关系相关的艰难决定。恋人逆位的忠告是：一段让你持续感到消耗而非滋养的关系，无论外表多么完美，都不是你内心真正需要的。'
        }
      }
    },
    {
      id: 7, name: '战车', nameEn: '', numeral: 'VII', symbol: '⚡',
      keywords: { upright: '意志力、胜利、决心、行动', reversed: '失去方向、自大、挫败' },
      meaning: {
        upright: {
          past: '你曾通过强大的意志力和决心克服了重大困难。这份力量仍在你身上。',
          present: '现在是全力以赴的时刻！集中精力朝目标冲刺，胜利就在前方。',
          future: '你即将在一场重要的挑战中取得胜利。保持专注和自律。'
        },
        reversed: {
          past: '过去你可能在某些方面用力过猛，导致方向偏离或精力耗尽。',
          present: '你可能感到力量分散或方向不明确。先停下来重新校准目标。',
          future: '未来需要避免盲目前进。先确认方向正确，再全力以赴。'
        }
      },
      deep: {
        upright: {
          past: '战车正位在过去的位置上闪耀着火焰般的橙色能量。你的内心中有着"战士"的原型——面对困难时你不会退缩，反而会被激发出更强的斗志。回想过去那些"不可能完成"的挑战，你都一一征服了。',
          present: '你当前的火元素能量处于高峰期。战车牌发出了一个明确的信号：下一个30天是你的"胜利窗口"。无论你目前在推进什么项目、追求什么目标，现在是加速冲刺的最佳时机。具体建议：将你的核心目标写在一张红色的纸上，放在办公桌最醒目的位置——红色的频率将持续激活你的行动力。',
          future: '未来2-4个月内，你将迎来一个"突破性胜利"。这个胜利不仅是外在成就的里程碑，更是你内在自信的一次质变。战车的承诺：只要你保持专注和自律，没有什么能阻止你。'
        },
        reversed: {
          past: '战车逆位揭示了过去一段"猛冲猛打"后的挫败经历。你可能曾因为过于执着于某个目标而忽视了身边的警示信号，最终在距离终点不远处翻车。',
          present: '你目前的能量显示出一种"马力十足但方向盘失灵"的状态。你有强大的行动力，但缺乏清晰的战略方向。战车逆位的关键忠告：在接下来重新上路之前，先花一整天的时间做一次彻底的"目标审计"——你追求的这个目标，真的是你自己想要的，还是别人期望你追求的？',
          future: '未来如果你不修正方向，可能会经历一次"无效努力"的挫败感。但如果你愿意在出发前做好规划，同样的能量将带你到达一个比原计划更好的目的地。宇宙的提示是：慢下来不等于停下来。'
        }
      }
    },
    {
      id: 8, name: '力量', nameEn: '', numeral: 'VIII', symbol: '🦁',
      keywords: { upright: '勇气、耐心、内在力量、温柔', reversed: '自我怀疑、软弱、失去信心' },
      meaning: {
        upright: {
          past: '你曾用温柔和耐心战胜了内心的恐惧，展现了真正的勇气。',
          present: '你拥有比你想象中更强大的内在力量。以温柔而坚定的方式面对当前的挑战。',
          future: '你将学会以柔克刚。真正的力量不是对抗，而是驯化内心的野兽。'
        },
        reversed: {
          past: '过去你可能在某些时刻对自己的能力产生了严重的怀疑。',
          present: '你目前可能正与内心的恐惧或自卑感作斗争。请对自己温柔一些。',
          future: '重建自信是你下一阶段的核心功课。相信自己，你比你以为的更强大。'
        }
      },
      deep: {
        upright: {
          past: '力量牌正位在过去的位置揭示了你内心深处一段"驯化恐惧"的英雄旅程。你曾在某个关键时刻选择了面对而非逃避——那一刻你的内心完成了一次重要的进化。这份勇气已经成为你内心DNA的一部分。',
          present: '你现在正被宇宙考验"柔性领导力"。力量牌告诉你：这个阶段不需要你去"打败"任何人或任何事，而是需要你用无条件的接纳来转化困境。在接下来的21天中，每当你感到愤怒或恐惧时，把手放在心口，深呼吸三次，对自己说"我选择用爱来回应"。这个简单的仪式将彻底改变你应对压力的方式。',
          future: '未来3个月内，你将经历一次"以柔克刚"的典范事件——一个看似无法解决的难题，将在你温柔而坚定的态度下自然化解。这次经历将成为你人生哲学的一个重要转折点。'
        },
        reversed: {
          past: '力量逆位在过去显示一段"自信崩塌"的经历。某个事件或某个人的话语深深打击了你对自己的信心。这个创伤至今仍在你的潜意识中活跃，每当你面临重要机会时，它就会跳出来说"你不行"。',
          present: '你目前的内在批评声音过于强大。力量逆位的核心信息是：你对自己的苛刻程度，已经超过了任何外部压力源。你的守护能量发出了一个温柔但紧急的请求：请像对待你最爱的人那样对待自己。',
          future: '未来的一个重要转折将来自于你对自己的重新定义。当你不再用"我能做到什么"来定义自己的价值，而是用"我是谁"来定义时，你将解锁前所未有的力量。'
        }
      }
    },
    {
      id: 9, name: '隐者', nameEn: '', numeral: 'IX', symbol: '🏔️',
      keywords: { upright: '内省、独处、指引、智慧', reversed: '孤立、逃避、固执' },
      meaning: {
        upright: {
          past: '你过去经历的一段独处时光给了你深刻的自我认知和内在平静。',
          present: '现在是退后一步、向内探索的时刻。答案不在外面的喧嚣中，而在你的内心深处。',
          future: '一段有意义的独处或内省期将带给你改变人生的洞察。'
        },
        reversed: {
          past: '过去你可能因为过度孤立而错失了重要的人际连接。',
          present: '你目前可能过于封闭自己。适度的社交和分享对你的成长很重要。',
          future: '未来需要在独处和社交之间找到健康的平衡。'
        }
      },
      deep: {
        upright: {
          past: '隐者在过去的位置上散发着深邃的靛蓝色光芒。你的内心在这一世之前已经经历了大量的"内在修行"。那些你感到与世界格格不入的时刻，其实是你的内心频率高于周围环境的表现。',
          present: '你目前正进入一个重要的"内心退隐期"。隐者建议你在近期安排一次"静修"——至少24小时远离所有社交和数字设备。在这段静默中，你将接收到一个来自更高维度的重要信息。最佳时间：选择一个下雨天，待在安静的室内，点一支白色蜡烛，让思绪自由流淌。',
          future: '未来你将成为许多人的"灯塔"——不是通过大声疾呼，而是通过你的存在本身。你安静的力量将吸引那些迷失方向的内心来到你身边。'
        },
        reversed: {
          past: '隐者逆位显示过去一段自我封闭的时期走得太远了。你可能以"保护自己"为由，切断了许多有价值的人际连接。',
          present: '你目前可能正在"假装独立"——表面上一个人也过得很好，但内心深处其实渴望真实的连接。隐者逆位温柔地提醒你：承认脆弱不是软弱，敞开心扉也不等于放弃自我。试着向一个信任的人分享你真实的感受。',
          future: '未来如果你愿意打开那扇门，一个真正理解你的内心将走进你的生命。但前提是你要先学会从安全的隐居状态中走出来。'
        }
      }
    },
    {
      id: 10, name: '命运之轮', nameEn: '', numeral: 'X', symbol: '☸️',
      keywords: { upright: '命运转折、好运、周期、机遇', reversed: '逆境、抗拒改变、命运考验' },
      meaning: {
        upright: {
          past: '你过去经历了一次重大的命运转折，它彻底改变了你的人生轨迹。',
          present: '你正处于一个重要的转折点。命运之轮正在转动，好运即将降临。',
          future: '一次意想不到的好运或机遇将在未来出现。准备好迎接改变。'
        },
        reversed: {
          past: '你过去可能经历过一段逆境或厄运，但那是命运的磨练。',
          present: '你目前可能正经历一些挫折。记住：轮子总是在转的，低谷之后必有高峰。',
          future: '一些外在环境的变化可能超出你的控制。学会在变化中找到内心的平静。'
        }
      },
      deep: {
        upright: {
          past: '命运之轮正位在过去的位置上，表明你的人生轨迹中存在一个重要的"命运节点"——一个看似偶然的事件，实际上是宇宙精心安排的转折。回想你人生中最大的"意外"——那不是运气，那是命运。',
          present: '你此刻正站在命运之轮的最高点附近。一个重要的好运周期正在到来。命运之轮的密码是：在接下来的40天内，保持高度警觉，留意任何"不寻常的巧合"——重复出现的数字、突然想起的某个人、无缘无故收到的一条消息。这些都是命运在向你发射信号弹。最关键的时间窗口：本月的15日至22日之间，一个改变命运的机遇将以出人意料的形式出现。',
          future: '未来半年内，你的人生将经历一次"量级跃迁"——从一个阶段跳跃到一个全新的、更高的阶段。这种跃迁不是循序渐进的，而是突然的、戏剧性的。命运之轮的承诺：你已经为此准备了很久（虽然你的显意识可能不知道），所以当它发生时，勇敢地迎接它。'
        },
        reversed: {
          past: '命运之轮逆位揭示了过去一段你感觉"被命运抛弃"的经历。但这段低谷的内心意义在于：它迫使你发展出了一套只有在逆境中才能锻造的生存智慧。这套智慧将在未来的某个关键时刻成为你最大的武器。',
          present: '你目前可能感到运势不佳，事事不顺。命运之轮逆位的深层信息是：轮子从未停止转动——你正在经历的是从低谷向上攀升的前奏。就像弹弓被拉得越紧，弹射力越大一样，当前的压力正在为你积蓄一次强力的反弹。耐心。',
          future: '命运之轮逆位在未来的位置上预示一些不可控的外部变化即将到来。你无法阻止轮子的转动，但你可以选择自己站在轮子的哪个位置。核心建议：提前准备好你的备用方案，在变化来临时你将不慌不忙。'
        }
      }
    },
    {
      id: 11, name: '正义', nameEn: '', numeral: 'XI', symbol: '⚖️',
      keywords: { upright: '公正、真相、因果、决断', reversed: '不公、逃避责任、偏见' },
      meaning: {
        upright: {
          past: '你过去做出了一个公正的决定，或者经历了因果报应的验证。',
          present: '一个需要你做出公正决断的时刻已经到来。以真相为准绳。',
          future: '正义终将到来。你过去种下的因，将在未来结出相应的果。'
        },
        reversed: {
          past: '你过去可能遭受过不公正的对待，那份委屈至今仍在影响你。',
          present: '你目前可能在回避某个需要面对的真相。勇敢面对，虽然痛苦但最终会解脱。',
          future: '未来需要特别注意法律和合同方面的事务。确保一切公平透明。'
        }
      },
      deep: {
        upright: {
          past: '正义牌在过去位置揭示了一个重要的因果链条。你过去种下的善因正在积累，准备在未来开花结果。',
          present: '你目前面临的某个境况，实际上是宇宙的"因果结算"。正义牌建议你以完全诚实的态度面对当前的一切。在接下来的14天内，审视你生活中是否存在任何"未清理的账目"——无论是物质层面还是情感层面。清理它们，你的能量场将变得异常轻盈。',
          future: '未来3-4个月内，一个你一直等待的"公正结果"将到来。如果你过去一直在正直地行事，这个结果将超出你的预期。正义的天平永远在运作，只是有时候它需要时间。'
        },
        reversed: {
          past: '正义逆位暗示过去你遭受过一次深刻的不公正对待，而且当时你可能因为某些原因选择了沉默。这份未被释放的愤怒和委屈仍在你的能量体中制造干扰。',
          present: '你目前可能正在面对一个"不公平"的局面。正义逆位的信息是：虽然外部环境可能不公，但你可以选择不让它腐蚀你的内在平衡。最实用的建议：如果涉及法律或合同事务，务必在本周内咨询专业人士。',
          future: '真相终将大白。一个你以为已经翻篇的过去事件，可能会在未来以新的形式重新浮现——这次，正义将得到彰显。'
        }
      }
    },
    {
      id: 12, name: '倒吊人', nameEn: '', numeral: 'XII', symbol: '🔮',
      keywords: { upright: '牺牲、换位思考、顿悟、等待', reversed: '拖延、固执己见、无谓牺牲' },
      meaning: {
        upright: {
          past: '你过去做出了一次重要的牺牲或放弃，换来了深刻的领悟。',
          present: '试着用全新的角度看待当前的困境。有时候，放下比抓紧更需要勇气。',
          future: '一段等待和沉淀的时期将带给你意想不到的启示。耐心是你的超能力。'
        },
        reversed: {
          past: '你过去可能在某件事上拖延太久，错过了最佳时机。',
          present: '你目前可能在做无谓的牺牲。重新评估：这些付出真的有必要吗？',
          future: '未来需要学会何时该坚持、何时该放手。不是所有的等待都有意义。'
        }
      },
      deep: {
        upright: {
          past: '倒吊人正位在过去显示了一段"主动悬置"的深刻经历。你曾在某个关键时刻选择了放弃短期利益来换取长远的成长。这个选择当时让所有人不理解，但现在回看，它是你人生中最明智的决定之一。',
          present: '你此刻正被宇宙要求"暂停"。倒吊人的核心教导是：有时候不行动本身就是最有力的行动。在接下来的12天中，对任何重大决策采取"观望"态度——不是因为你没有答案，而是因为更好的答案还在酝酿中。用这段时间改变你看问题的角度——倒吊人是倒着看世界的，尝试颠覆你一直以来的假设。',
          future: '未来某个时刻，你将经历一次深刻的"顿悟"——那种"原来如此"的感觉将彻底刷新你对某个长期困扰的理解。这个顿悟不是思考出来的，而是在你放空的某个瞬间自然降临的。'
        },
        reversed: {
          past: '倒吊人逆位暗示过去你在某些关系或项目中做出了不必要的牺牲——不是出于爱或智慧，而是出于内疚或讨好。这种模式消耗了你大量的生命能量。',
          present: '你目前可能正在一种"卡住"的状态中。既不想继续当前的路径，又害怕改变。倒吊人逆位的解药是：给自己设定一个"最后期限"——不是让宇宙来决定何时改变，而是你主动选择何时翻牌。',
          future: '未来你需要学会区分"有意义的等待"和"害怕行动的借口"。有一件你一直拖延的事，请在两周内做出决定——任何决定都好过没有决定。'
        }
      }
    },
    {
      id: 13, name: '死神', nameEn: '', numeral: 'XIII', symbol: '🌑',
      keywords: { upright: '终结、转变、新生、蜕变', reversed: '抗拒改变、停滞、执念' },
      meaning: {
        upright: {
          past: '你过去经历了一次深刻的结束，但它为新的开始创造了空间。',
          present: '一个旧的阶段正在走向终结。不要恐惧，因为结束是新生的前奏。',
          future: '一次重大的转变即将到来。它会摧毁旧的，但也会带来更好的。'
        },
        reversed: {
          past: '你过去一直在抗拒一个必须面对的结束，这让你在原地停留了太久。',
          present: '你目前对某种改变有着强烈的抗拒。但抗拒只会延长痛苦。',
          future: '学会优雅地告别不再服务于你的一切。蜕变虽然痛苦，但蝴蝶从不怀念毛虫的日子。'
        }
      },
      deep: {
        upright: {
          past: '死神牌在过去的位置上并不代表不幸——恰恰相反，它表明你已经完成了一次重要的内心蜕变。你曾经历的那次"终结"（可能是关系、工作或信念系统的瓦解），实际上是你内心进化的必经之路。',
          present: '你目前正处于一次"内心蜕皮"的关键期。死神牌的核心信息是：那些让你感到痛苦的、正在瓦解的旧结构，不是在"惩罚"你，而是在为你腾出空间。在接下来的一个月圆周期中，主动清理你生活中所有"虽然不坏但已经不再让你兴奋"的东西——旧衣服、旧物件、甚至旧的思维模式。物理层面的清理会加速内心层面的蜕变。',
          future: '未来2-3个月内，一扇你一直以为关死的门将重新打开——但它通向的不再是过去的旧房间，而是一个全新的维度。死神牌的承诺：凤凰涅槃后的你，将比之前任何版本的自己都更加强大、美丽、自由。'
        },
        reversed: {
          past: '死神逆位显示你过去拒绝放手的某样东西，至今仍在你的能量场中制造阻滞。这可能是一段已经结束的关系、一个不再适合你的身份标签，或一种过时的信念。',
          present: '你目前正经历一种"僵局"——你知道某些东西需要改变，但你紧紧抓住不放。死神逆位温柔但坚定地提醒你：紧握一把沙子只会让它流失得更快。尝试做一个"放手仪式"：写下你想放下的东西，然后安全地烧掉那张纸。象征性的行动具有强大的能量转化力量。',
          future: '如果你继续抗拒改变，宇宙可能会以一种更"戏剧性"的方式来推动你前进。与其被动等待那一天，不如现在就主动拥抱变化。'
        }
      }
    },
    {
      id: 14, name: '节制', nameEn: '', numeral: 'XIV', symbol: '🌈',
      keywords: { upright: '平衡、耐心、调和、中庸', reversed: '极端、失衡、过度' },
      meaning: {
        upright: {
          past: '你过去在一段动荡中找到了平衡和和谐，这种能力让你受益至今。',
          present: '现在需要你保持耐心和中庸之道。不要走极端，找到各方面的平衡点。',
          future: '一段和谐而充实的时期正在到来。各方面的事物将以完美的节奏展开。'
        },
        reversed: {
          past: '你过去可能在某些方面走向了极端，导致生活失去了平衡。',
          present: '你目前的某些行为模式可能过于极端。审视一下：哪里需要调整？',
          future: '未来需要特别注意生活的平衡。过度工作或过度放纵都会带来问题。'
        }
      },
      deep: {
        upright: {
          past: '节制牌在过去的位置显示你的内心掌握着"炼金术"的古老智慧——将对立的元素融合成更高阶的存在。你过去那些看似矛盾的经历，实际上都在为你锻造一种独特的"融合能力"。',
          present: '你此刻的能量体正在经历一次精妙的"重新校准"。节制牌的处方是：在接下来的两周中，有意识地平衡你的四大生命维度——身体（运动/饮食）、头脑（学习/思考）、情感（关系/表达）、灵性（冥想/自省）。每天在每个维度至少投入20分钟。当这四个维度达到平衡时，你将体验到一种前所未有的内在和谐与外在流动。',
          future: '未来4-5个月内，你将成为身边人眼中"活得最通透"的那个人。节制的能量将赋予你一种罕见的智慧：在任何对立中找到统一，在任何混乱中看到秩序。'
        },
        reversed: {
          past: '节制逆位揭示了过去一段"失衡期"——你可能在某个方向上投入了过多的精力而忽视了其他同样重要的生命领域。这种失衡的后果可能至今仍在你的生活中回响。',
          present: '你目前的生活中存在一个明显的"短板"——某个你一直忽视的领域正在拖累你的整体状态。节制逆位的关键提问：你的生活中，哪个部分如果你今天不改善，三年后你会后悔？那就是你现在最需要投入的方向。',
          future: '未来的和谐取决于你当下的调整。节制逆位的最终忠告：完美的平衡不是一个终点，而是一个需要持续维护的过程。从今天开始，每天问自己"我今天对自己和对世界是否公平？"'
        }
      }
    },
    {
      id: 15, name: '恶魔', nameEn: '', numeral: 'XV', symbol: '🔥',
      keywords: { upright: '束缚、诱惑、执念、物质', reversed: '解脱、觉醒、打破枷锁' },
      meaning: {
        upright: {
          past: '你曾被某种执念或不健康的关系模式所束缚，那段经历虽然黑暗但教会了你很多。',
          present: '审视你当前的生活，有什么在无形中束缚着你？觉察是解脱的第一步。',
          future: '一个与诱惑或执念相关的考验即将到来。保持警觉，不要被表面的光鲜所迷惑。'
        },
        reversed: {
          past: '你曾经从一段束缚性的关系或模式中成功解脱，这需要巨大的勇气。',
          present: '你正在经历一个觉醒的过程，看清了一直束缚你的真相。',
          future: '自由即将到来。你将打破那些看不见的枷锁，迎来真正的解放。'
        }
      },
      deep: {
        upright: {
          past: '恶魔牌在过去的位置揭示了一段你被某种"隐形枷锁"束缚的经历——可能是一段有毒的关系、一种成瘾行为、或一种深植于潜意识的限制性信念。重要的认知是：那些枷锁一直是虚幻的——你随时可以选择离开。',
          present: '你当前的能量场中存在一个"盲点"——一个你以为无法改变但实际上完全在你掌控之中的领域。恶魔牌邀请你做一次勇敢的自我审视：你生活中的哪个"我必须"其实是"我选择"？当你把"我不得不做这份工作"改为"我选择做这份工作"时，你的整个能量场都将发生转变。因为"不得不"是枷锁，"选择"是自由。',
          future: '未来一个月内，你将面临一个关于"自由vs安全"的选择。恶魔牌的忠告：真正的安全不是来自于紧抓不放，而是来自于你知道无论发生什么，你都有能力重新站起来。'
        },
        reversed: {
          past: '恶魔逆位在过去的位置上散发着金色的解脱之光。你曾经做出了一个艰难但正确的决定——从一种不健康的束缚中走出来。那次解脱的勇气，是你内心最闪耀的时刻之一。',
          present: '你目前正在经历一次重要的"觉醒"——那些曾经控制你的恐惧和执念正在失去它们的力量。恶魔逆位的好消息是：你已经走出了最黑暗的隧道。继续前行，光明就在前方。',
          future: '未来你将帮助其他仍在黑暗中的人找到出路。你的亲身经历将成为最有力的灯塔。恶魔逆位的祝福：你从束缚中获得的智慧，将成为你最珍贵的经验积累。'
        }
      }
    },
    {
      id: 16, name: '塔', nameEn: '', numeral: 'XVI', symbol: '⚡',
      keywords: { upright: '突变、崩塌、顿悟、真相', reversed: '恐惧改变、延迟的灾难、内在转变' },
      meaning: {
        upright: {
          past: '你过去经历了一次突如其来的剧变。它虽然摧毁了旧的结构，但也释放了真实的你。',
          present: '一个你一直回避的真相正在浮出水面。虽然震撼，但它将带来真正的解放。',
          future: '一次突然的变化即将到来。它可能让你措手不及，但它是必要的突破。'
        },
        reversed: {
          past: '你过去可能一直在预感某种灾难，导致长期处于焦虑状态。',
          present: '你可能正在竭力维持一个已经摇摇欲坠的结构。问问自己：它值得挽救吗？',
          future: '通过主动做出调整，你可以避免一次更剧烈的崩塌。提前改变好过被迫改变。'
        }
      },
      deep: {
        upright: {
          past: '塔牌在过去位置上所揭示的那次"崩塌事件"，是你内心成长历程中最重要的催化剂。那些在废墟中的日子虽然痛苦，但它们铸就了一个更真实、更坚韧的你。',
          present: '你当前的某个"建筑"——可能是一段关系、一种世界观、或一个人生计划——正在显示裂缝。塔牌的信息并不是"它一定会崩塌"，而是"如果它的基础不够坚实，那么让它倒下比硬撑更明智"。在接下来的两周内审视你生活中最大的"假象"——那些你明知不真实但一直在维护的东西。主动拆除它们比等它们自己崩溃要好得多。',
          future: '未来可能有一个震惊性的事件或消息到来。但塔牌有一个鲜为人知的秘密：塔顶被雷击中时，同时也被照亮了。那道闪电带来的不只是破坏，更是一瞬间照亮一切的真相之光。'
        },
        reversed: {
          past: '塔逆位显示你过去一直生活在"灾难恐惧"的阴影中——总觉得好日子随时会结束。这种焦虑可能源于童年时期的某次不稳定经历。',
          present: '好消息：你当前害怕的那个"最坏的情况"发生的概率远低于你的想象。塔逆位在这个位置实际上是一种安慰——真正的崩塌已经以更温和的方式完成了，你只是还没意识到。那些你以为"不可或缺"的东西，悄然离开后你的生活其实变得更好了。',
          future: '未来的变化将以一种更温和、更渐进的方式发生。你有时间来准备和适应。塔逆位的核心信息：与其害怕失去，不如思考"如果我没有了X，我的人生会变成什么样？"你可能会惊喜地发现，答案比你预期的好得多。'
        }
      }
    },
    {
      id: 17, name: '星星', nameEn: '', numeral: 'XVII', symbol: '⭐',
      keywords: { upright: '希望、信念、灵感、治愈', reversed: '失去希望、信心危机、迷失' },
      meaning: {
        upright: {
          past: '你过去经历了一段充满希望和灵感的时期。那份光芒至今仍在照耀你。',
          present: '希望之星正在你的头顶闪耀。无论当前处境如何，请相信：一切都会好起来的。',
          future: '一段治愈和重生的时期即将到来。你将找到内心的平静和人生的方向。'
        },
        reversed: {
          past: '你过去可能经历过一段丧失希望的黑暗时期。但你挺过来了。',
          present: '你目前可能感到迷茫和失落。但请记住：即使在最黑暗的夜晚，星星依然在闪烁。',
          future: '重新找到信念是你的当务之急。当你再次相信自己时，奇迹就会发生。'
        }
      },
      deep: {
        upright: {
          past: '星星牌在过去的位置散发着清澈的银蓝色光芒。你的内心深处携带着"治愈者"的印记——你过去的经历，尤其是那些痛苦的部分，都在为你积累一种罕见的治愈能量。',
          present: '你此刻正被宇宙的"恩典之光"笼罩。星星牌是整副塔罗中最吉祥的牌之一——它告诉你：你过去的伤痛正在被转化为智慧，你的祈祷已经被宇宙听到了。在接下来的一个月中，每晚睡前花3分钟仰望星空（即使看不到星星也没关系，用心去感知），这个简单的仪式将强化你与宇宙指引的连接。一个你一直在等待的"信号"将在星空下到来。',
          future: '未来6个月内，你将进入一个"灵性丰收期"——过去所有的付出、坚持和眼泪，都将以最美丽的方式获得回报。星星的承诺：你的未来比你敢想象的还要光明。'
        },
        reversed: {
          past: '星星逆位揭示了过去一段"信念崩塌"的经历。你曾深信的某些事被证明是虚幻的，这让你一度对一切美好失去了信任。',
          present: '你目前可能正在经历一种"意义缺失"的感觉。星星逆位的核心处方是：你不需要"找到"人生的意义——你需要"创造"它。从做一件小而具体的善事开始：帮助一个陌生人、写一封感谢信、照顾一棵植物。当你开始向世界注入善意时，意义感会自然回归。',
          future: '信念将被重建。星星逆位在未来的位置实际上暗示：你即将经历的不是"找回旧的信念"，而是建立一套全新的、经过试炼的、更加坚固的信念体系。这一次，没有什么能再动摇它。'
        }
      }
    },
    {
      id: 18, name: '月亮', nameEn: '', numeral: 'XVIII', symbol: '🌙',
      keywords: { upright: '幻觉、直觉、潜意识、不安', reversed: '清明、走出迷雾、释放恐惧' },
      meaning: {
        upright: {
          past: '你过去可能经历过一段迷茫和困惑的时期，事物的真相被蒙蔽。',
          present: '事情并非表面看到的那样。信任你的直觉，但也要警惕幻觉的欺骗。',
          future: '一段需要你穿越迷雾的旅程即将开始。保持警觉，直觉将是你的灯塔。'
        },
        reversed: {
          past: '你过去终于看清了一个一直困扰你的真相，走出了迷雾。',
          present: '你正在从困惑中走出来。那些曾经让你不安的东西正在失去它们的力量。',
          future: '清明即将到来。一个长期困扰你的谜团将被解开。'
        }
      },
      deep: {
        upright: {
          past: '月亮牌在过去的位置上散发着幽蓝的微光。你过去经历的某段迷茫期，实际上是你的潜意识在进行一次深层的"重新编程"。表面上你感到困惑和不安，但在水面之下，你的内心正在完成一次重要的升级。',
          present: '你当前的直觉力正处于一个非常敏感的阶段——你能感知到很多信息，但还不太能分辨哪些是真实的信号、哪些是恐惧的投射。月亮牌的训练方法：在接下来的14天中，每天临睡前写下三个直觉感受（不需要合理化），两周后回顾它们——你会发现有超过60%的直觉是准确的。这将帮助你校准你的"内在雷达"。',
          future: '未来2个月内，一个一直隐藏在水面下的秘密将浮出水面。月亮牌提前告诉你：当真相到来时，它可能与你的想象不同，但它将比谎言更加温柔。'
        },
        reversed: {
          past: '月亮逆位表明你过去成功地穿越了一段"黑暗之夜"——在那段看不到出路的日子里，你没有放弃，最终迎来了黎明。',
          present: '你目前正在逐渐走出一段迷雾期。月亮逆位的好消息是：那些你曾经害怕的"怪兽"，在阳光下不过是影子。你正在恢复你的判断力和清明感。继续保持这个方向。',
          future: '清明的时代即将到来。那些模糊的、不确定的、让你焦虑的事情，都将在未来一个月内获得清晰的答案。月亮逆位的祝福：当月光消散，阳光将揭示一个比你预期更美好的现实。'
        }
      }
    },
    {
      id: 19, name: '太阳', nameEn: '', numeral: 'XIX', symbol: '☀️',
      keywords: { upright: '成功、喜悦、活力、光明', reversed: '暂时的挫折、内在孩童受伤' },
      meaning: {
        upright: {
          past: '你曾经历过一段充满阳光和欢乐的时光。那份纯粹的快乐是你内心最珍贵的记忆。',
          present: '阳光正照耀着你！享受当下的美好，展现你最真实的自我。一切都在最好的状态中。',
          future: '巨大的成功和喜悦即将到来。你将进入人生中最光辉灿烂的时期之一。'
        },
        reversed: {
          past: '你过去的某段快乐时光可能因为某些原因蒙上了阴影。',
          present: '你的内在小孩可能受了伤。找回那份纯真的快乐是当前的重要课题。',
          future: '快乐终将回归。暂时的阴云遮不住永恒的太阳。'
        }
      },
      deep: {
        upright: {
          past: '太阳牌在过去的位置上绽放着金色的温暖光芒！你内心中携带的"光明使者"频率是非常强大的——你过去那些让别人快乐的时刻、你的笑声、你的温暖，都在你身边的人心中种下了光明的种子。',
          present: '你此刻的能量场正在散发出一种"黄金频率"——这是极为罕见的吉兆。太阳牌是整副塔罗中最强大的正面牌之一。它告诉你：无论你现在正在做什么、追求什么、期待什么——放心大胆地去做！宇宙正在全力支持你。在接下来的30天内，你的显化能力将达到顶峰。一个重要建议：每天早晨让阳光照在你的脸上至少5分钟，感受它的温暖——这不仅是在补充维生素D，更是在接收宇宙为你充电的黄金能量。',
          future: '未来6个月内，你将迎来人生的"高光时刻"——一个让你骄傲、让爱你的人为你欢呼的重大成就。太阳牌的保证：这份成功是你应得的，是你过去所有努力和坚持的丰盛回报。不要怀疑，不要退缩。你的时代已经到来。'
        },
        reversed: {
          past: '太阳逆位揭示了你过去一段"被遮蔽的快乐"——也许你曾拥有快乐但不被允许充分表达，或者快乐总是伴随着内疚感。你的内在小孩渴望纯粹的、无条件的快乐。',
          present: '你目前可能在用"成年人的责任"压抑着内心那个想要玩耍、想要笑、想要无忧无虑的自己。太阳逆位温柔地提醒你：快乐不是奖励，它是权利。在这周内做一件让你"纯粹开心"的事——不是因为有用，仅仅因为快乐本身。',
          future: '未来的快乐将以一种更柔和、更持久的方式到来。它不会像烟花那样短暂而热烈，而会像日出那样温暖而持久。太阳逆位的祝福：你值得快乐，纯粹的、不需要理由的快乐。'
        }
      }
    },
    {
      id: 20, name: '审判', nameEn: '', numeral: 'XX', symbol: '🎺',
      keywords: { upright: '觉醒、重生、召唤、自我实现', reversed: '自我否定、逃避使命、内疚' },
      meaning: {
        upright: {
          past: '你过去经历了一次深刻的觉醒，它让你重新认识了自己。',
          present: '一个来自内心深处的召唤正在响起。是时候做出那个你一直知道需要做的决定了。',
          future: '一次脱胎换骨的重生即将到来。你将以全新的身份迎接新的人生阶段。'
        },
        reversed: {
          past: '你过去可能忽视了一个重要的内在召唤，选择了更安全的道路。',
          present: '你目前可能在回避一个深层的自我审视。正视自己的真相，才能获得真正的自由。',
          future: '一个关于自我接纳的重要功课即将到来。放下对自己的苛责。'
        }
      },
      deep: {
        upright: {
          past: '审判牌在过去的位置上发出了一声悠远的号角。你的内心在过去的某个时刻经历了一次"大觉醒"——你突然明白了自己来到这个世界的真正目的。那一刻的清明感可能很短暂，但它种下的种子已经在生长。',
          present: '你此刻正在经历一次内心层面的"最终审判"——不是来自外部的审判，而是你的高我在审视你是否活出了自己的真实使命。审判牌发出了一个紧急而神圣的召唤：你知道自己真正想做什么、真正想成为什么样的人。停止假装不知道。在接下来的一周内写一封"给未来自己的信"——描述你5年后理想中的一天从早到晚是什么样的。写得越详细越好。这封信将成为你内心导航的GPS坐标。',
          future: '未来12个月内，你将经历一次"凤凰涅槃"式的重生。旧的身份将被蜕去，一个更真实、更强大、更符合内心使命的"你"将站起来。审判牌的庄严承诺：这次重生不是终点，而是你真正人生的开始。'
        },
        reversed: {
          past: '审判逆位揭示了过去一个你"选择了安全而非真实"的时刻。你听到了内心的召唤，但因为恐惧或世俗的顾虑而选择了忽视它。那个未被回应的召唤至今仍在你的潜意识中回响。',
          present: '你目前可能正在与一种"我本可以"的遗憾感作斗争。审判逆位的核心信息是：内心的召唤没有过期日。你现在回应它，永远不晚。但你需要先原谅自己过去的犹豫——那不是懦弱，那是你当时能做到的最好选择。',
          future: '第二次召唤即将到来——宇宙不会放弃你。这一次，你将拥有更多的勇气和智慧来回应它。审判逆位在未来位置的祝福：你的内心使命正在等你回家。'
        }
      }
    },
    {
      id: 21, name: '世界', nameEn: '', numeral: 'XXI', symbol: '🌍',
      keywords: { upright: '完成、圆满、成就、整合', reversed: '未完成、缺乏闭合、半途而废' },
      meaning: {
        upright: {
          past: '你过去成功地完成了一个重要的人生阶段，达到了一种圆满的状态。',
          present: '你正处于一个重大成就的顶峰。享受这份圆满，你值得。',
          future: '一个宏大的人生周期即将完美收官。所有的碎片都将归位，拼成完整的画面。'
        },
        reversed: {
          past: '你过去可能在某个重要的目标面前止步了，留下了未完成的遗憾。',
          present: '你可能感到距离目标只差最后一步。不要放弃，终点就在眼前。',
          future: '完成未竟之事将为你打开全新的大门。回去把那件事做完。'
        }
      },
      deep: {
        upright: {
          past: '世界牌——大阿尔卡那的最后一张——在你过去的位置上闪耀着彩虹般的光芒。你的内心已经完成了一个宏大的生命周期。回望你的过去，你会发现所有看似散乱的经历实际上构成了一幅完美的拼图——每一块都不可或缺。',
          present: '你此刻正站在一个"宇宙级别"的里程碑上。世界牌出现在你的牌阵中，这是极其罕见和珍贵的吉兆。它意味着你的某个长期目标、某段修行、或某个人生阶段正在达到圆满。在接下来的一个月内，做一次正式的"感恩仪式"——列出你人生中最感恩的30件事（每天写一件）。这个仪式将锁定你当前的高频能量，让它成为你未来的基石。',
          future: '未来一年内，你将经历一次"大团圆"——所有曾经分散的力量、离散的关系和未完成的梦想，都将以一种戏剧性的方式汇聚在一起。世界牌的终极承诺：你来到这个世界的使命正在被实现，而这仅仅是一个更宏大旅程的起点。当一个世界完成，另一个更广阔的世界将为你打开。'
        },
        reversed: {
          past: '世界逆位在过去的位置上显示了一个"差一步就圆满"的遗憾。你过去曾非常接近完成某个重要的目标或关闭某个生命周期，但因为某些原因在最后关头停下了。',
          present: '你目前可能感到一种"未完成感"——好像生活中有一块重要的拼图一直缺失。世界逆位的处方是：回溯你的人生，找到那件"未完成的事"。它可能是一个未道的歉意、一个未追完的梦、一段未正式结束的关系。完成它——不是为了别人，而是为了让你的内心获得它需要的"闭合"。',
          future: '世界逆位在未来位置的核心信息是：圆满不是终点，而是新起点的前奏。你即将完成的这个周期，将为一个更宏大的冒险腾出空间。勇敢地画上句号吧——因为每一个"完"字的背后，都跟着一个"新"字。'
        }
      }
    }
  ]

  // ─── Shared State (simple reactive store) ───────────────────
  const store = reactive({
    isPatternActive: false, // 粒子图案是否处于激活状态
    isImmersive: false,     // 是否处于沉浸纯享图腾模式
    homePhase: 'hero', // 'hero', 'warping', 'menu'
    question: '',
    selectedCards: [],   // [{card, isReversed, position}]
    mbtiResult: null,
    attachmentResult: null,
    async createOrder(testType, payload) {
      try {
        const res = await fetch('/api/tests/' + testType + '/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '计算服务暂时不可用')
        return data;
      } catch(e) {
        console.error(e);
        throw e;
      }
    },
    async fetchResult(orderId) {
      try {
        const res = await fetch('/api/tests/result/' + orderId);
        const data = await res.json();
        return data;
      } catch(e) { console.error(e); return null; }
    }
  })

  // ─── Utility: shuffle array ─────────────────────────────────
  function shuffleArray(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // ─── Web Audio API Synthesizer ──────────────────────────────
  const AudioSynth = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (AudioContext) {
          this.ctx = new AudioContext()
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume()
      }
    },
    playHover() {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0, this.ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.1)
    },
    playShuffle() {
      if (!this.ctx) return
      const bufferSize = this.ctx.sampleRate * 0.15 // 150ms noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1000
      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15)
      noise.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)
      noise.start()
    },
    playFlip() {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(150, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.3)
    }
  }

  // ─── PaymentModal Component (Personal QR Code Flow) ───────────

  // ─── ARCHIVE HELPER ──────────────────────────────────────────
  const ARCHIVE_TEST_TYPES = {
    Tarot: 'tarot',
    MBTI: 'mbti',
    Attachment: 'attachment',
    Bazi: 'bazi',
    'Human Design': 'human-design',
    Astrology: 'astrology',
    Aura: 'aura',
    Shadow: 'shadow',
    Color: 'color',
    Enneagram: 'enneagram',
    Jung8: 'jung8',
    DarkTriad: 'darktriad',
    Saboteurs: 'saboteurs',
    Defense: 'defense'
  }

  const markTestCompleted = (testType) => {
    const normalized = normalizeTestType(testType)
    try {
      const completed = JSON.parse(localStorage.getItem('northstar_completed_tests') || '{}')
      completed[normalized] = new Date().toISOString()
      localStorage.setItem('northstar_completed_tests', JSON.stringify(completed))
    } catch (e) {}
  }

  const hasCompletedTestMarker = (testType) => {
    try {
      const completed = JSON.parse(localStorage.getItem('northstar_completed_tests') || '{}')
      return Boolean(completed[normalizeTestType(testType)])
    } catch (e) {
      return false
    }
  }

  const saveToArchive = (type, title, data) => {
    try {
      const archives = JSON.parse(localStorage.getItem('northstar_archives') || '[]')
      archives.unshift({
        id: Date.now().toString(),
        type, title, data,
        date: new Date().toLocaleDateString()
      })
      localStorage.setItem('northstar_archives', JSON.stringify(archives))
      if (ARCHIVE_TEST_TYPES[type]) markTestCompleted(ARCHIVE_TEST_TYPES[type])
    } catch(e) {}
  }

  const ARCHIVE_TYPE_LABELS = {
    Tarot: '塔罗',
    MBTI: '人格',
    Attachment: '依恋',
    Bazi: '八字',
    'Human Design': '人类图',
    Astrology: '星盘',
    Aura: '光环',
    Shadow: '阴影',
    Synastry: '双人合盘',
    RelationshipAI: '情感分析',
    Color: '色彩心理',
    Enneagram: '九型人格',
    Jung8: '认知功能',
    DarkTriad: '深层人格',
    Saboteurs: '内在阻碍',
    Defense: '心理防御'
  }

  const getArchiveTypeLabel = (type) => ARCHIVE_TYPE_LABELS[type] || type || '报告'

  const RELATIONSHIP_REFERENCE_FIELDS = [
    { field: 'mbti', label: 'MBTI', testType: 'mbti', archiveType: 'MBTI', route: '/mbti' },
    { field: 'attachment', label: '依恋类型', testType: 'attachment', archiveType: 'Attachment', route: '/attachment' },
    { field: 'tarot', label: '塔罗', testType: 'tarot', archiveType: 'Tarot', route: '/tarot' },
    { field: 'astrology', label: '星盘', testType: 'astrology', archiveType: 'Astrology', route: '/astrology' },
    { field: 'bazi', label: '八字', testType: 'bazi', archiveType: 'Bazi', route: '/bazi' },
    { field: 'humanDesign', label: '人类图', testType: 'human-design', archiveType: 'Human Design', route: '/human-design' },
    { field: 'aura', label: '光环', testType: 'aura', archiveType: 'Aura', route: '/aura' },
    { field: 'shadow', label: '暗影原型', testType: 'shadow', archiveType: 'Shadow', route: '/shadow' },
    { field: 'color', label: '色彩心理', testType: 'color', archiveType: 'Color', route: '/color' },
    { field: 'enneagram', label: '九型人格', testType: 'enneagram', archiveType: 'Enneagram', route: '/enneagram' },
    { field: 'jung8', label: '荣格八维', testType: 'jung8', archiveType: 'Jung8', route: '/jung8' },
    { field: 'darktriad', label: '黑暗三角', testType: 'darktriad', archiveType: 'DarkTriad', route: '/darktriad' },
    { field: 'saboteurs', label: '内在破坏者', testType: 'saboteurs', archiveType: 'Saboteurs', route: '/saboteurs' },
    { field: 'defense', label: '心理防御机制', testType: 'defense', archiveType: 'Defense', route: '/defense' }
  ]


  const getArchiveEntries = () => {
    try {
      const entries = JSON.parse(localStorage.getItem('northstar_archives') || '[]')
      return Array.isArray(entries) ? entries : []
    } catch (e) {
      return []
    }
  }

  const getLatestArchive = (types) => {
    const wanted = Array.isArray(types) ? types : [types]
    return getArchiveEntries().find(item => wanted.includes(item.type))
  }

  const compactArchiveText = (archive, maxLength = 140) => {
    if (!archive) return ''
    return String(archive.title || archive.data || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength)
  }

  const cleanArchiveTitle = (archive, patterns = []) => {
    let text = compactArchiveText(archive, 80)
    patterns.forEach(pattern => {
      text = text.replace(pattern, '')
    })
    return text.trim()
  }

  const sanitizeReferenceValue = (value) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim()
    if (!text || /undefined|null|NaN/i.test(text)) return ''
    if (['本命星盘报告', '人类图报告', '星盘关键词'].includes(text)) return ''
    return text
  }

  const compactArchiveResultText = (archive, maxLength = 140) => {
    if (!archive) return ''
    const preferred = sanitizeReferenceValue(archive.data) || sanitizeReferenceValue(archive.title)
    return preferred.slice(0, maxLength)
  }

  const getRelationshipReferenceLines = (source) => {
    return RELATIONSHIP_REFERENCE_FIELDS
      .map(item => {
        const value = sanitizeReferenceValue(source && source[item.field])
        return value ? `${item.label}：${value}` : ''
      })
      .filter(Boolean)
  }

  const getResultDrafts = () => {
    try {
      const drafts = JSON.parse(localStorage.getItem('northstar_result_drafts') || '{}')
      return drafts && typeof drafts === 'object' ? drafts : {}
    } catch (e) {
      return {}
    }
  }

  const saveResultDraft = (testType, data) => {
    try {
      const drafts = getResultDrafts()
      drafts[normalizeTestType(testType)] = {
        data,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem('northstar_result_drafts', JSON.stringify(drafts))
    } catch (e) {}
  }

  const loadResultDraft = (testType) => {
    const draft = getResultDrafts()[normalizeTestType(testType)]
    return draft && draft.data ? draft.data : null
  }

  const clearResultDraft = (testType) => {
    try {
      const drafts = getResultDrafts()
      delete drafts[normalizeTestType(testType)]
      localStorage.setItem('northstar_result_drafts', JSON.stringify(drafts))
    } catch (e) {}
  }

  const getCurrentTestResultValue = (item) => {
    if (item.field === 'mbti') return store.mbtiResult?.type || ''
    if (item.field === 'attachment') return store.attachmentResult?.type || ''
    if (item.field === 'tarot' && store.selectedCards && store.selectedCards.length) {
      return store.selectedCards.map(card => `${card.card.name}${card.isReversed ? '逆位' : '正位'}`).join('、')
    }
    return ''
  }

  const summarizeResultDraft = (item, draft) => {
    if (!draft) return ''
    if (item.field === 'mbti') return draft.type || ''
    if (item.field === 'attachment') return draft.type || ''
    if (item.field === 'astrology') {
      const report = draft.report || draft.result || draft
      return [report.sunSign, report.moonSign, report.ascSign].filter(Boolean).join(' / ')
    }
    if (item.field === 'humanDesign') return draft.result?.name || draft.name || ''
    if (item.field === 'bazi') return draft.result?.title || draft.result?.name || draft.title || ''
    if (item.field === 'aura') return draft.result?.title || draft.title || ''
    if (item.field === 'shadow') return draft.result?.name || draft.name || ''
    return draft.result?.name || draft.result?.title || draft.dominant || draft.name || draft.title || ''
  }

  const hasRelationshipReferenceEvidence = (item) => {
    return Boolean(
      getCurrentTestResultValue(item) ||
      loadResultDraft(item.testType) ||
      hasCompletedTestMarker(item.testType)
    )
  }

  const buildSynastryAutofill = () => {
    return RELATIONSHIP_REFERENCE_FIELDS.map(item => {
      const currentValue = getCurrentTestResultValue(item)
      const draft = loadResultDraft(item.testType)
      if (!currentValue && !draft && !hasCompletedTestMarker(item.testType)) {
        return { ...item, value: '' }
      }
      const archive = getLatestArchive(item.archiveType)
      let value = currentValue || summarizeResultDraft(item, draft) || compactArchiveResultText(archive)
      if (item.field === 'mbti') {
        const mbtiFromArchive = compactArchiveResultText(archive, 80).match(/\b[EI][SN][TF][JP]\b/i)
        value = currentValue || (mbtiFromArchive ? mbtiFromArchive[0].toUpperCase() : value)
      }
      if (item.field === 'attachment') {
        value = currentValue || summarizeResultDraft(item, draft) || cleanArchiveTitle(archive, [/\s*依恋完整解读$/])
      }
      return { ...item, value: sanitizeReferenceValue(value) }
    }).filter(item => item.value)
  }

  const getStoredTestOrderId = (testType) => {
    try {
      const orders = JSON.parse(localStorage.getItem('northstar_paid_order_ids') || '{}')
      return orders[normalizeTestType(testType)] || ''
    } catch (e) {
      return ''
    }
  }

  const setStoredTestOrderId = (testType, orderId) => {
    if (!orderId || String(orderId).startsWith('MANUAL-')) return
    try {
      const orders = JSON.parse(localStorage.getItem('northstar_paid_order_ids') || '{}')
      orders[normalizeTestType(testType)] = orderId
      localStorage.setItem('northstar_paid_order_ids', JSON.stringify(orders))
    } catch (e) {}
  }

  const revokeStoredOrderAccess = (orderId) => {
    if (!orderId) return
    try {
      const orders = JSON.parse(localStorage.getItem('northstar_paid_order_ids') || '{}')
      const revokedTests = Object.entries(orders)
        .filter(([, storedOrderId]) => storedOrderId === orderId)
        .map(([testType]) => normalizeTestType(testType))
      for (const testType of revokedTests) delete orders[testType]
      localStorage.setItem('northstar_paid_order_ids', JSON.stringify(orders))
      const unlocked = getUnlockedTests().filter(testType => !revokedTests.includes(normalizeTestType(testType)))
      localStorage.setItem('northstar_unlocked_tests', JSON.stringify(unlocked))
    } catch (e) {}
  }

  const applyServerAccess = (access, fallbackOrderId = '') => {
    if (!access || access.paid !== true || !access.planId) return false
    const orderId = access.orderId || fallbackOrderId
    unlockPlan(
      access.planId,
      access.testType || (access.unlockTests && access.unlockTests[0]) || 'tarot',
      orderId,
      access.unlockTests || []
    )
    return true
  }

  const restorePurchaseAccess = async (orderId) => {
    const normalizedOrderId = String(orderId || '').trim()
    if (!normalizedOrderId) throw new Error(currentLocale() === 'en' ? 'Enter your order ID.' : '请输入订单号。')
    const res = await fetch('/api/payment/access/' + encodeURIComponent(normalizedOrderId), {
      headers: { Accept: 'application/json' }
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !applyServerAccess(data, normalizedOrderId)) {
      const english = currentLocale() === 'en'
      if (data.status === 'refunded' || data.status === 'disputed') {
        throw new Error(english ? 'This order no longer has active report access.' : '该订单当前已不具备有效报告访问权。')
      }
      if (data.status === 'pending' || data.status === 'reviewing') {
        throw new Error(english ? 'Payment is still being confirmed. Please try again shortly.' : '付款仍在确认中，请稍后再试。')
      }
      throw new Error(english ? 'No active paid purchase was found for that order ID.' : '未找到该订单对应的有效付费权益。')
    }
    return data
  }

  const refreshStoredPurchaseAccess = async () => {
    let orderIds = []
    try {
      const orders = JSON.parse(localStorage.getItem('northstar_paid_order_ids') || '{}')
      orderIds = [...new Set(Object.values(orders).filter(Boolean))]
    } catch (e) {
      return
    }
    await Promise.allSettled(orderIds.map(async orderId => {
      try {
        const res = await fetch('/api/payment/access/' + encodeURIComponent(orderId), {
          headers: { Accept: 'application/json' }
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.paid === true) {
          applyServerAccess(data, orderId)
        } else if (res.status === 403 || res.status === 404) {
          revokeStoredOrderAccess(orderId)
        }
      } catch (error) {
        // Preserve the last known local state while the network is unavailable.
      }
    }))
  }

  window.setTimeout(refreshStoredPurchaseAccess, 0)

  const buildAIReportText = (baseDeepReport, aiText, fallbackUsed) => {
    const intro = fallbackUsed
      ? '【本次结果补充】\n这段补充暂时没有写出来。你已解锁的完整内容如下，稍后可以再试一次。'
      : '【本次结果补充】\n这段内容会参考你这次的答案和结果来写，作为完整解读之外的补充。'
    return [baseDeepReport, intro, aiText].filter(Boolean).join('\n\n')
  }

  const hashText = (value) => {
    const text = typeof value === 'string' ? value : JSON.stringify(value || '')
    let hash = 2166136261
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
  }

  const pickVariant = (list, seed, offset = 0) => list[(seed + offset) % list.length]

  const extractReadingSignals = (value) => {
    if (!value || typeof value !== 'object') return []
    const pairs = Object.entries(value)
      .filter(([key, item]) => item !== null && item !== undefined && key !== 'deep' && key !== 'desc')
      .map(([key, item]) => {
        if (typeof item === 'number') return { key, label: key, value: item }
        if (typeof item === 'boolean') return { key, label: key, value: item ? 1 : 0 }
        if (typeof item === 'string' && item.trim()) return { key, label: item.trim().slice(0, 18), value: item.length }
        if (Array.isArray(item)) return { key, label: key, value: item.length }
        if (typeof item === 'object') return { key, label: key, value: Object.keys(item).length }
        return null
      })
      .filter(Boolean)

    return pairs
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 3)
      .map(item => item.label || item.key)
  }

  const buildReadingAngle = ({ testType, seed, resultSummary, userInputs, context }) => {
    const result = String(resultSummary || '').replace(/\s+/g, ' ').trim()
    const signals = [
      ...extractReadingSignals(userInputs),
      ...extractReadingSignals(context)
    ].filter(Boolean)
    const resultLine = result
      ? `本次主线落在「${result.slice(0, 36)}」附近。`
      : '本次主线更适合从你的选择顺序和分数倾向里观察。'
    const signalLine = signals.length
      ? '这份解读结合了本次输入与结果结构，不会把某一个字段单独当作结论。'
      : '系统主要参考了你在本次测试里的选择节奏和结果归类。'
    const anglesByType = {
      mbti: ['你的报告重点不是四个字母本身，而是能量来源、判断方式和行动节奏之间的组合。', '这次更值得看的是你在理性判断和关系感受之间如何分配权重。'],
      attachment: ['这份结果会更关注你在靠近、确认、撤退之间的真实节奏。', '这次的关键不在于给关系下结论，而在于看见你不安时最需要什么回应。'],
      tarot: ['这组牌面更像一次阶段复盘：过去的惯性、现在的卡点和下一步的选择被放在一起看。', '这次牌面适合用来整理问题，而不是替你做决定。'],
      astrology: ['这次星盘阅读会把外在表达、内在需求和安全感来源放在同一张图里看。', '如果报告里出现矛盾感，通常说明你的不同星体位置正在拉扯同一件事。'],
      bazi: ['这份八字解读更适合看行动节奏和资源使用方式，而不是把未来说死。', '本次重点是看你何时适合推进，何时更适合蓄力和调整。'],
      'human-design': ['这次人类图更适合看决策节奏：你适合主动推进、等待回应，还是先观察环境。', '本次重点不是改变自己，而是识别哪些场景让你自然有力。'],
      synastry: ['合盘阅读会把两个人的吸引、摩擦和沟通成本分开看。', '这份结果更适合回答“怎么相处更顺”，而不是简单判断合不合。'],
      aura: ['光环结果更像近期状态扫描，会受到当下压力、期待和恢复程度影响。', '这次重点是看你外在呈现和内在需求是否一致。'],
      shadow: ['暗影原型更适合看防御动作：你在受伤、紧张或失控感出现时会如何保护自己。', '这次重点不是评价好坏，而是识别某个反复出现的保护姿势。'],
      color: ['色彩排序更像当下情绪气候，它会随压力、关系和身体状态变化。', '这次重点是看你正在靠近哪种需要，又暂时回避哪种感受。'],
      enneagram: ['九型结果更适合看核心动机：你最想守住什么，又最怕失去什么。', '这份报告会把动机、压力反应和成长方向连起来看。'],
      jung8: ['八维阅读不能只看最高分，低分功能也会影响你在压力下的反应。', '这次重点是看你习惯调用哪种功能，又在哪些功能上容易消耗。'],
      darktriad: ['这类结果更适合看人际策略的硬度，以及控制感需求是否过强。', '本次重点是把防御策略看清楚，而不是给人格下定论。'],
      saboteurs: ['内在破坏者往往是旧保护策略，本次重点是看它何时过度启动。', '这份结果更适合当作压力反应地图，而不是给自己贴负面标签。'],
      defense: ['防御机制说明你在不安时优先保护什么：自尊、安全感、距离，还是秩序。', '本次重点是给自己多几个反应选择，而不是完全取消防御。']
    }
    const closing = [
      '接下来最值得做的，是把报告里最有触动的一句放回最近一件具体小事里验证。',
      '如果某段内容让你停顿，可以先不急着认同它，记录下它对应的场景和身体感受。',
      '这份结果不需要一次读完；隔一天再看仍然准确的部分，通常更接近真正的重点。',
      '建议把它当成一张观察地图：先找反复出现的线索，再决定要调整哪一个动作。'
    ]
    const angle = pickVariant(anglesByType[testType] || ['这份报告更适合帮助你整理线索，而不是把你固定成某一种样子。'], seed, 5)
    return [resultLine, signalLine, angle, pickVariant(closing, seed, 13)].join('\n')
  }

  const buildLocalReadingNote = ({ testType, resultSummary, userInputs, context }) => {
    const seed = hashText({ testType, resultSummary, userInputs, context })
    const titles = [
      '【本次阅读注记】',
      '【这次结果里值得多看一眼的地方】',
      '【给这份结果的一点补充】',
      '【这份结果的个人化提示】',
      '【本次线索组合】',
      '【你的专属阅读切口】'
    ]
    const openings = [
      '这份结果最值得留意的，不是某个单独标签，而是几个线索放在一起时呈现出的方向。',
      '如果只看结论，容易把自己放进一个固定框里；但你的答案里其实有更细的层次。',
      '这次结果更像是一张当前状态的截图，它提醒你先看见正在反复出现的感受和选择。',
      '这份解读可以作为参照，但真正有价值的部分，是你读到哪一句时停顿了一下。'
    ]
    const focusByType = {
      mbti: ['留意你在做决定时更依赖效率、感受、经验还是可能性。', '如果某个维度分数接近，说明你不是单一风格，而是在不同场景里切换。'],
      attachment: ['留意你在靠近和后退之间的节奏，这往往比类型名称更能说明问题。', '真正重要的不是“我是哪一型”，而是你在不安时最想确认什么。'],
      tarot: ['三张牌更适合看作一组叙事：过去留下的惯性、现在的卡点，以及下一步可以调整的方向。', '牌面不是替你做决定，而是把你已经感受到的矛盾摆到桌面上。'],
      astrology: ['星盘更适合用来看长期习惯：你如何表达、如何防备，又如何寻找安全感。', '如果某些描述让你觉得矛盾，那可能正是不同星体位置同时拉扯的地方。'],
      bazi: ['八字适合看节奏，不适合把未来说死；重点是现在更适合稳住、调整还是主动推进。', '同一个日主在不同阶段会有不同表现，所以这份结果更像方向感，而不是判词。'],
      'human-design': ['人类图的重点是决策节奏：什么事情适合等回应，什么事情需要先告知。', '与其急着改变自己，不如先观察哪些场合让你明显消耗，哪些场合让你自然有力。'],
      synastry: ['合盘不是给关系打分，而是看两个人在哪些地方容易顺、哪些地方需要多解释。', '如果分数很好，也仍然需要沟通；如果分数一般，也不代表没有经营空间。'],
      aura: ['光环结果更接近近期状态，不必把它当成固定性格。', '如果主色和辅色看起来反差大，说明你外在表现和内在需求可能不完全一致。'],
      shadow: ['暗影结果不是给你贴负面标签，而是指出受伤或防备时容易出现的保护动作。', '真正值得看的，是这个原型在什么时候会被触发，而不是它听起来有多强烈。'],
      color: ['色彩排序反映的是当下偏好和压力出口，过一段时间重新做，结果可能会变化。', '排在前面的颜色通常代表你正在靠近的需要，排在后面的颜色则可能是你暂时不想面对的部分。'],
      enneagram: ['九型更适合看核心在意点：你到底怕失去什么，又习惯用什么方式证明自己。', '如果你对相邻类型也有共鸣，说明你的状态可能正处在压力或成长方向的切换里。'],
      jung8: ['八维结果适合看功能强弱，不适合只看最高分；低分功能往往也在影响你的选择。', '真正有用的是观察：你遇到压力时，会退回哪个熟悉功能里。'],
      darktriad: ['这类结果要温和地看，它更多是在提醒你的人际防御和控制感需求。', '分数不等于人格定论，更像是在提醒哪些策略用多了会让关系变硬。'],
      saboteurs: ['内在破坏者通常不是敌人，它曾经可能保护过你，只是现在方式有些过度。', '你不需要立刻消灭这个声音，先学会辨认它什么时候出现。'],
      defense: ['防御机制不是缺点，它说明你在不安时会先用什么方式保护自尊和安全感。', '成熟的调整不是不用防御，而是多给自己几个可选择的反应。']
    }
    const actions = [
      '接下来可以选一个最有触动的句子，观察它在现实生活里对应哪一件具体小事。',
      '建议不要急着把整份结果全盘接受，先记录三个“像我”和一个“不太像我”的地方。',
      '如果你准备继续探索，优先从最近一周最频繁出现的情绪或关系场景开始。',
      '读完后可以先放一天，再回来看哪些内容仍然让你觉得准确；那通常才是更重要的线索。'
    ]
    const focus = focusByType[testType] || ['把这份结果当成一次整理，而不是对自己的最终定义。']
    return [
      pickVariant(titles, seed),
      buildReadingAngle({ testType, seed, resultSummary, userInputs, context }),
      '',
      pickVariant(openings, seed, 3),
      pickVariant(focus, seed, 7),
      pickVariant(actions, seed, 11)
    ].join('\n')
  }

  const addLocalReadingNote = (baseDeepReport, options = {}) => {
    const text = String(baseDeepReport || '').trim()
    if (
      !text ||
      text.includes('【本次阅读注记】') ||
      text.includes('【这次结果里值得多看一眼的地方】') ||
      text.includes('【给这份结果的一点补充】') ||
      text.includes('【这份结果的个人化提示】') ||
      text.includes('【本次线索组合】') ||
      text.includes('【你的专属阅读切口】')
    ) return text
    return [text, buildLocalReadingNote(options)].filter(Boolean).join('\n\n')
  }

  const generatePaidAIReport = async ({ testType, orderId, resultSummary, baseDeepReport, userInputs, context }) => {
    const normalized = normalizeTestType(testType)
    const serverOrderId = orderId || getStoredTestOrderId(normalized)
    
    // Check cache first
    const cachedText = loadAIReportCache(normalized, serverOrderId)
    if (cachedText) {
      return cachedText
    }

    if (!serverOrderId || String(serverOrderId).startsWith('MANUAL-')) {
      return buildAIReportText(
        '',
        '完整报告需要一笔服务器已确认的订单。请完成付款确认后再试。',
        true
      )
    }

    try {
      const res = await fetch('/api/tests/' + encodeURIComponent(normalized) + '/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: serverOrderId,
          testType: normalized,
          resultSummary,
          userInputs,
          context,
          locale: currentLocale()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || '补充内容生成失败')
      if (!data.baseReport && !data.analysisText) throw new Error('完整报告正文暂不可用')
      const reportHeader = currentLocale() === 'en'
        ? [
          'NORTHSTAR PROFESSIONAL REPORT',
          `${data.reportMeta?.sections || '10+'} structured sections · approximately ${data.reportMeta?.estimatedReadMinutes || '15–20'} minutes to read`,
          ''
        ].join('\n')
        : [
          'NORTHSTAR 专业长报告',
          `${data.reportMeta?.sections || '10+'} 个结构化章节 · 预计阅读 ${data.reportMeta?.estimatedReadMinutes || '15–20'} 分钟`,
          ''
        ].join('\n')
      const reportBody = currentLocale() === 'en'
        ? (data.fallbackUsed
          ? [data.baseReport, 'PERSONALIZED FOLLOW-UP STATUS', data.analysisText].filter(Boolean).join('\n\n')
          : data.analysisText)
        : buildAIReportText(data.baseReport, data.analysisText, data.fallbackUsed)
      const finalReport = [reportHeader, reportBody].filter(Boolean).join('\n')
      
      // Save successful generation to cache
      saveAIReportCache(normalized, serverOrderId, finalReport)
      trackBusinessEvent('report_generated', {
        orderId: serverOrderId,
        testType: normalized,
        metadata: {
          provider: data.provider || 'unknown',
          fallbackUsed: data.fallbackUsed === true,
          reportVersion: data.reportMeta?.version || '',
          reportLength: data.reportMeta?.length || 0,
          reportSections: data.reportMeta?.sections || 0
        }
      })
      return finalReport
    } catch (e) {
      trackBusinessEvent('report_failed', {
        orderId: serverOrderId,
        testType: normalized,
        metadata: { reason: e.message || 'unknown' }
      })
      return buildAIReportText(
        '',
        '完整报告暂时无法从服务器读取。请稍后重试；如已付款，可提交客服工单并附上订单号。',
        true
      )
    }
  }

  const ProfessionalReport = defineComponent({
    name: 'ProfessionalReport',
    props: {
      text: { type: String, default: '' },
      title: { type: String, default: '' },
      resultLabel: { type: String, default: '' },
      isTyping: { type: Boolean, default: false }
    },
    emits: ['skip'],
    setup(props, { emit }) {
      const articleEl = ref(null)
      const shareCardEl = ref(null)
      const shareOpen = ref(false)
      const shareStatus = ref('')
      const shareFile = ref(null)
      const shareDataUrl = ref('')
      const sharePreparing = ref(false)
      const readingProgress = ref(0)
      const tocOpen = ref(false)
      const isEnglish = computed(() => activeLocale.value === 'en')

      const cleanText = computed(() => String(props.text || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\r/g, '')
        .trim())

      const parsedReport = computed(() => {
        const lines = cleanText.value.split('\n')
        const sections = []
        let reportHeading = props.title || (isEnglish.value ? 'Professional report' : '专业长报告')
        let reportMeta = ''
        let currentSection = null
        let paragraph = []

        const flushParagraph = () => {
          const value = paragraph.join(' ').replace(/\s+/g, ' ').trim()
          if (value) {
            if (!currentSection) {
              currentSection = {
                id: 'report-opening',
                number: '00',
                title: isEnglish.value ? 'Opening note' : '阅读说明',
                paragraphs: []
              }
            }
            currentSection.paragraphs.push(value)
          }
          paragraph = []
        }

        const flushSection = () => {
          flushParagraph()
          if (currentSection && currentSection.paragraphs.length) sections.push(currentSection)
          currentSection = null
        }

        lines.forEach((rawLine) => {
          const line = rawLine.trim()
          if (!line) {
            flushParagraph()
            return
          }
          if (/^NORTHSTAR\s+/i.test(line)) {
            reportHeading = line.replace(/^NORTHSTAR\s+/i, '').trim()
            return
          }
          if (/structured sections|个结构化章节|minutes to read|预计阅读/i.test(line)) {
            reportMeta = line
            return
          }
          const numberedCandidate = line.match(/^(?:\*{0,2}\s*)?(\d{1,2})[.)、]\s*(.+?)(?:\*{0,2})$/)
          const numbered = numberedCandidate &&
            numberedCandidate[2].length <= 80 &&
            !/[?？]$/.test(numberedCandidate[2])
            ? numberedCandidate
            : null
          const bracketed = line.match(/^【([^】]{2,80})】$/)
          if (numbered || bracketed) {
            flushSection()
            const number = numbered ? numbered[1].padStart(2, '0') : String(sections.length + 1).padStart(2, '0')
            const heading = numbered ? numbered[2] : bracketed[1]
            currentSection = {
              id: `report-section-${number}-${sections.length}`,
              number,
              title: heading.trim(),
              paragraphs: []
            }
            return
          }
          paragraph.push(line)
        })
        flushSection()

        if (!sections.length && cleanText.value) {
          sections.push({
            id: 'report-section-01',
            number: '01',
            title: isEnglish.value ? 'Your reading' : '你的完整解读',
            paragraphs: [cleanText.value]
          })
        }
        return { reportHeading, reportMeta, sections }
      })

      const readingMinutes = computed(() => {
        if (!cleanText.value) return 0
        if (isEnglish.value) {
          const words = cleanText.value.match(/\b[\p{L}\p{N}’'-]+\b/gu) || []
          return Math.max(1, Math.ceil(words.length / 190))
        }
        const characters = cleanText.value.match(/[\u3400-\u9fff]/gu) || []
        return Math.max(1, Math.ceil(characters.length / 350))
      })

      const shareSummary = computed(() => {
        const firstParagraph = parsedReport.value.sections
          .flatMap(section => section.paragraphs)
          .find(Boolean) || ''
        const compact = firstParagraph.replace(/\s+/g, ' ').trim()
        return compact.length > 220 ? `${compact.slice(0, 217)}...` : compact
      })

      const shareHighlights = computed(() => parsedReport.value.sections
        .filter(section => section.number !== '00')
        .slice(0, 3)
        .map(section => section.title))

      const safeShareUrl = computed(() => {
        const base = `${window.location.origin}${window.location.pathname}`
        return isEnglish.value ? `${base}?lang=en` : base
      })

      const updateProgress = () => {
        const el = articleEl.value
        if (!el) return
        const rect = el.getBoundingClientRect()
        const start = window.scrollY + rect.top - 160
        const end = start + el.offsetHeight - window.innerHeight * 0.55
        const range = Math.max(1, end - start)
        readingProgress.value = Math.max(0, Math.min(100, Math.round(((window.scrollY - start) / range) * 100)))
      }

      const scrollToSection = (id) => {
        const target = document.getElementById(id)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        tocOpen.value = false
      }

      const copyText = async (value) => {
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(value)
            return
          } catch (error) {
            // Fall through to the selection-based copy path for browsers that
            // expose Clipboard API but deny it outside a direct permission grant.
          }
        }
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const copied = document.execCommand('copy')
        textarea.remove()
        if (!copied) throw new Error('Copy command was rejected')
      }

      const copyShareSummary = async () => {
        const text = [
          props.resultLabel || parsedReport.value.reportHeading,
          shareSummary.value,
          safeShareUrl.value
        ].filter(Boolean).join('\n\n')
        try {
          await copyText(text)
          shareStatus.value = isEnglish.value ? 'Share summary copied.' : '分享摘要已复制。'
          trackBusinessEvent('report_share_copied', { metadata: { surface: 'professional-report' } })
        } catch (error) {
          shareStatus.value = isEnglish.value ? 'Copy failed. Please try again.' : '复制失败，请重试。'
        }
      }

      const prepareShareImage = async () => {
        if (shareFile.value || sharePreparing.value || !shareCardEl.value || typeof html2canvas === 'undefined') return
        sharePreparing.value = true
        shareStatus.value = isEnglish.value ? 'Preparing share image...' : '正在生成分享图...'
        try {
          const canvas = await html2canvas(shareCardEl.value, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#080816'
          })
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95))
          if (!blob) throw new Error('Image creation failed')
          shareFile.value = new File([blob], 'northstar-report-summary.png', { type: 'image/png' })
          shareDataUrl.value = canvas.toDataURL('image/png')
          shareStatus.value = isEnglish.value ? 'Share image is ready.' : '分享图已准备好。'
        } catch (error) {
          console.error('Report share image preparation failed:', error)
          shareStatus.value = isEnglish.value ? 'Could not create the image. Please try again.' : '分享图生成失败，请重试。'
        } finally {
          sharePreparing.value = false
        }
      }

      const openShare = () => {
        shareOpen.value = true
        shareStatus.value = ''
        nextTick(prepareShareImage)
      }

      const shareImage = async () => {
        if (!shareFile.value) {
          shareStatus.value = isEnglish.value ? 'The image is still being prepared.' : '分享图仍在生成，请稍候。'
          return
        }
        try {
          const sharePayload = {
            title: props.resultLabel || parsedReport.value.reportHeading,
            text: isEnglish.value
              ? 'My Northstar report summary. The full paid report remains private.'
              : '我的 Northstar 报告摘要，完整付费正文仍保持私密。',
            files: [shareFile.value]
          }
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [shareFile.value] })) {
            await navigator.share(sharePayload)
            shareStatus.value = isEnglish.value ? 'Share sheet opened.' : '已打开系统分享。'
          } else {
            const link = document.createElement('a')
            link.download = 'northstar-report-summary.png'
            link.href = shareDataUrl.value
            link.click()
            shareStatus.value = isEnglish.value ? 'Share image downloaded.' : '分享图已下载。'
          }
          trackBusinessEvent('report_share_image', { metadata: { surface: 'professional-report' } })
        } catch (error) {
          if (error && error.name === 'AbortError') {
            shareStatus.value = ''
            return
          }
          if (shareDataUrl.value) {
            const link = document.createElement('a')
            link.download = 'northstar-report-summary.png'
            link.href = shareDataUrl.value
            link.click()
            shareStatus.value = isEnglish.value ? 'Share image downloaded.' : '分享图已下载。'
            trackBusinessEvent('report_share_image', { metadata: { surface: 'professional-report', fallback: 'download' } })
            return
          }
          console.error('Report share image failed:', error)
          shareStatus.value = isEnglish.value ? 'Could not create the image. Please try again.' : '分享图生成失败，请重试。'
        }
      }

      const printReport = () => {
        trackBusinessEvent('report_printed', { metadata: { surface: 'professional-report' } })
        window.print()
      }

      onMounted(() => {
        window.addEventListener('scroll', updateProgress, { passive: true })
        window.addEventListener('resize', updateProgress)
        nextTick(updateProgress)
      })
      onUnmounted(() => {
        window.removeEventListener('scroll', updateProgress)
        window.removeEventListener('resize', updateProgress)
      })
      watch(() => props.text, () => nextTick(updateProgress))

      return {
        articleEl,
        shareCardEl,
        shareOpen,
        shareStatus,
        sharePreparing,
        readingProgress,
        tocOpen,
        isEnglish,
        parsedReport,
        readingMinutes,
        shareSummary,
        shareHighlights,
        scrollToSection,
        copyShareSummary,
        openShare,
        shareImage,
        printReport,
        emit
      }
    },
    template: `
      <section class="professional-report" :class="{ 'is-generating': isTyping }">
        <div class="professional-report-progress" aria-hidden="true">
          <span :style="{ width: readingProgress + '%' }"></span>
        </div>

        <header class="professional-report-cover">
          <div>
            <p class="professional-report-kicker">NORTHSTAR · {{ isEnglish ? 'PRIVATE EDITION' : '私人专属版' }}</p>
            <h3>{{ parsedReport.reportHeading }}</h3>
            <p v-if="resultLabel" class="professional-report-result">{{ resultLabel }}</p>
          </div>
          <div class="professional-report-meta" v-if="text">
            <span>{{ parsedReport.sections.length }} {{ isEnglish ? 'sections' : '个章节' }}</span>
            <span>{{ readingMinutes }} {{ isEnglish ? 'min read' : '分钟阅读' }}</span>
            <span>{{ isEnglish ? 'Private by default' : '默认私密' }}</span>
          </div>
        </header>

        <div class="professional-report-toolbar" v-if="text && !isTyping">
          <button type="button" class="report-toolbar-button" @click="tocOpen = !tocOpen">
            {{ isEnglish ? 'Contents' : '章节目录' }}
          </button>
          <button type="button" class="report-toolbar-button" @click="printReport">
            {{ isEnglish ? 'Print / PDF' : '打印 / PDF' }}
          </button>
          <button type="button" class="report-toolbar-button is-primary" @click="openShare">
            {{ isEnglish ? 'Share summary' : '分享摘要' }}
          </button>
        </div>

        <button v-if="isTyping" type="button" class="professional-report-skip" @click="$emit('skip')">
          {{ isEnglish ? 'Show the complete report now' : '直接显示完整报告' }}
        </button>

        <div v-if="!text" class="professional-report-loading">
          <span></span>
          <p>{{ isEnglish ? 'Preparing your professional report...' : '正在整理你的专业长报告...' }}</p>
        </div>

        <div v-else class="professional-report-layout">
          <aside class="professional-report-toc" :class="{ 'is-open': tocOpen }">
            <p>{{ isEnglish ? 'In this report' : '本报告目录' }}</p>
            <button
              v-for="section in parsedReport.sections"
              :key="'toc-' + section.id"
              type="button"
              @click="scrollToSection(section.id)"
            >
              <span>{{ section.number }}</span>
              {{ section.title }}
            </button>
          </aside>

          <article ref="articleEl" class="professional-report-article">
            <section
              v-for="section in parsedReport.sections"
              :id="section.id"
              :key="section.id"
              class="professional-report-section"
            >
              <div class="professional-report-section-heading">
                <span>{{ section.number }}</span>
                <h4>{{ section.title }}</h4>
              </div>
              <p v-for="(paragraph, index) in section.paragraphs" :key="section.id + '-' + index">
                {{ paragraph }}
              </p>
            </section>
            <footer class="professional-report-footer">
              <strong>Northstar</strong>
              <span>{{ isEnglish ? 'A reflection tool, not a diagnosis or prediction.' : '用于自我整理，不构成诊断或确定性预测。' }}</span>
            </footer>
          </article>
        </div>

        <div v-if="shareOpen" class="report-share-backdrop" @click.self="shareOpen = false">
          <section class="report-share-dialog" role="dialog" aria-modal="true" :aria-label="isEnglish ? 'Share report summary' : '分享报告摘要'">
            <button type="button" class="report-share-close" @click="shareOpen = false" :aria-label="isEnglish ? 'Close' : '关闭'">×</button>
            <p class="professional-report-kicker">{{ isEnglish ? 'SAFE TO SHARE' : '隐私安全分享' }}</p>
            <h3>{{ isEnglish ? 'Share the insight, keep the report private' : '分享洞察，保留完整报告隐私' }}</h3>
            <p class="report-share-note">
              {{ isEnglish ? 'The image contains a short summary only. It never includes your order number or the full paid report.' : '分享图只包含简短摘要，不会包含订单号或完整付费正文。' }}
            </p>

            <div class="report-share-preview">
              <p>{{ resultLabel || parsedReport.reportHeading }}</p>
              <strong>{{ shareSummary }}</strong>
              <span>northstar.fantasy-games.org</span>
            </div>

            <div class="report-share-actions">
              <button type="button" class="primary-action" :disabled="sharePreparing" @click="shareImage">
                {{ sharePreparing ? (isEnglish ? 'Preparing image...' : '正在生成图片...') : (isEnglish ? 'Share image' : '分享图片') }}
              </button>
              <button type="button" class="secondary-action" @click="copyShareSummary">
                {{ isEnglish ? 'Copy summary' : '复制分享文案' }}
              </button>
            </div>
            <p class="report-share-status" aria-live="polite">{{ shareStatus }}</p>
          </section>
        </div>

        <div ref="shareCardEl" class="report-share-card" aria-hidden="true">
          <div class="report-share-card-brand">NORTHSTAR</div>
          <p>{{ isEnglish ? 'MY REPORT SUMMARY' : '我的报告摘要' }}</p>
          <h2>{{ resultLabel || parsedReport.reportHeading }}</h2>
          <div class="report-share-card-rule"></div>
          <blockquote>{{ shareSummary }}</blockquote>
          <div class="report-share-card-highlights">
            <span v-for="highlight in shareHighlights" :key="highlight">{{ highlight }}</span>
          </div>
          <footer>
            <span>northstar.fantasy-games.org</span>
            <span>{{ isEnglish ? 'Full report kept private' : '完整报告保持私密' }}</span>
          </footer>
        </div>
      </section>
    `
  })


  const PaymentModal = defineComponent({
    name: 'PaymentModal',
    props: ['orderId', 'testType', 'planId'],
    emits: ['close', 'success'],
    setup(props, { emit }) {
      const step = ref('scan')        // 'scan' | 'processing' | 'reviewing' | 'error'
      const payMethod = ref('stripe')
      const todayCount = ref(Math.floor(Math.random() * 280 + 320))
      const relatedOrderId = ref(props.orderId || '')
      const localOrderId = ref('')
      const paymentMessage = ref('')
      const acceptedTerms = ref(false)
      const checkoutUrl = ref('')
      const gatewayQrImage = ref('')
      const gatewayQrCodeUrl = ref('')
      const paymentConfig = ref({
        paymentMode: 'disabled',
        paymentLive: false,
        providers: {
          stripe: { ready: false },
          wechat: { ready: false },
          alipay: { ready: false },
          manual: { ready: false }
        }
      })
      const activeTestType = computed(() => normalizeTestType(props.testType || getCurrentTestType()))
      const availablePlans = computed(() => getRecommendedPlans(activeTestType.value))
      const selectedPlanId = ref(props.planId || availablePlans.value[0]?.id || 'single')
      const selectedPlan = computed(() => PLAN_BY_ID[selectedPlanId.value] || PLAN_BY_ID.single)
      const selectedPlanTests = computed(() => getPlanTests(selectedPlan.value, activeTestType.value))
      const isEnglish = computed(() => activeLocale.value === 'en')
      const selectedPlanTestNames = computed(() => {
        if (selectedPlan.value && selectedPlan.value.unlocksFull === false) {
          const testName = i18n.t(TEST_CATALOG[activeTestType.value]?.name || '当前测试')
          return isEnglish.value
            ? `${testName} Quick Insight (full report not included)`
            : `${testName}体验解读（不含完整解读）`
        }
        return selectedPlanTests.value
          .map(id => isEnglish.value ? i18n.t(TEST_CATALOG[id]?.name || id) : (TEST_CATALOG[id]?.name || id))
          .join(' / ')
      })
      const paymentActionLabel = computed(() => {
        if (isEnglish.value) {
          if (payMethod.value === 'stripe') return '✦ Continue to Secure Stripe Checkout'
          return gatewayQrImage.value ? '✦ Check My Payment' : '✦ Submit Payment Confirmation'
        }
        return payMethod.value === 'stripe'
          ? '✦ 去 Stripe 安全付款'
          : (gatewayQrImage.value ? '✦ 我已付款，帮我查一下' : '✦ 我已付款，提交确认')
      })
      let pollTimer = null

      const finishPaidFlow = (orderId) => {
        const plan = selectedPlan.value
        if (plan && plan.unlocksFull === false) {
          try {
            const trials = JSON.parse(localStorage.getItem('northstar_trial_purchases') || '[]')
            trials.unshift({
              id: orderId || Date.now().toString(),
              testType: activeTestType.value,
              planName: plan.name,
              price: plan.price,
              date: new Date().toLocaleString()
            })
            localStorage.setItem('northstar_trial_purchases', JSON.stringify(trials.slice(0, 30)))
          } catch (e) {}
          emit('close')
          return
        }
        unlockPlan(plan.id, activeTestType.value, orderId, selectedPlanTests.value)
        emit('success', { ...plan, orderId })
      }

      const isPaymentLive = computed(() => {
        const config = window.NORTHSTAR_CONFIG || {}
        return paymentConfig.value.paymentLive === true
          || config.paymentLive === true
          || new URLSearchParams(window.location.search).get('livePayments') === '1'
      })

      const providerReady = (provider) => {
        if (new URLSearchParams(window.location.search).get('livePayments') === '1') return true
        return paymentConfig.value.providers?.[provider]?.ready === true
      }

      const refreshPaymentConfig = async () => {
        try {
          const res = await fetch('/api/payment/config', { headers: { Accept: 'application/json' } })
          if (!res.ok) return
          const data = await res.json()
          paymentConfig.value = data
          if ((data.paymentLive || isEnglish.value) && providerReady('stripe')) payMethod.value = 'stripe'
        } catch (e) {
          console.error('Payment configuration unavailable:', e)
        }
      }

      const demoPaymentsEnabled = () => {
        const config = window.NORTHSTAR_CONFIG || {}
        return config.demoPayments === true || new URLSearchParams(window.location.search).get('demoPayments') === '1'
      }

      const resetIntent = () => {
        localOrderId.value = ''
        checkoutUrl.value = ''
        gatewayQrImage.value = ''
        gatewayQrCodeUrl.value = ''
        paymentMessage.value = ''
      }

      const createPaymentIntent = async () => {
        if (!isPaymentLive.value) return ''
        if (localOrderId.value) return localOrderId.value
        try {
          const res = await fetch('/api/payment/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testType: activeTestType.value,
              planId: selectedPlan.value.id,
              planName: selectedPlan.value.name,
              amount: selectedPlan.value.price,
              unlockTests: selectedPlanTests.value,
              provider: payMethod.value,
              locale: currentLocale(),
              relatedOrderId: relatedOrderId.value,
              returnPath: location.hash || '#/'
            })
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(data.message || data.error || '支付订单创建失败')
          localOrderId.value = data.orderId
          checkoutUrl.value = data.checkoutUrl || ''
          gatewayQrImage.value = data.qrImageDataUrl || ''
          gatewayQrCodeUrl.value = data.qrCodeUrl || ''
          trackBusinessEvent('checkout_created', {
            orderId: data.orderId,
            testType: activeTestType.value,
            planId: selectedPlan.value.id,
            metadata: { provider: data.provider || payMethod.value, amount: selectedPlan.value.price }
          })
          if (data.provider === 'stripe' && !checkoutUrl.value) {
            paymentMessage.value = '当前 Stripe 通道暂不可用，请选择其他支付方式。'
          } else if ((data.provider === 'wechat' || data.provider === 'alipay') && gatewayQrImage.value) {
            paymentMessage.value = '已生成支付二维码，支付完成后系统会自动确认订单。'
          } else {
            paymentMessage.value = '已创建安全订单。付款后提交确认，订单通过核验后将自动解锁。'
          }
        } catch (e) {
          if (payMethod.value === 'stripe') throw e
          localOrderId.value = ''
          gatewayQrImage.value = ''
          gatewayQrCodeUrl.value = ''
          paymentMessage.value = '支付订单创建失败，请稍后重试或联系 Northstar 客服。'
          throw e
        }
        return localOrderId.value
      }

      const stopPolling = () => {
        if (pollTimer) {
          clearInterval(pollTimer)
          pollTimer = null
        }
      }

      const pollPaymentStatus = () => {
        stopPolling()
        pollTimer = setInterval(async () => {
          try {
            if (!localOrderId.value) return
            const res = await fetch('/api/payment/status/' + encodeURIComponent(localOrderId.value))
            if (!res.ok) return
            const data = await res.json()
            if (data.status === 'paid') {
              stopPolling()
              finishPaidFlow(localOrderId.value)
            }
          } catch (e) {
            console.error(e)
          }
        }, 3000)
      }

      onMounted(async () => {
        trackBusinessEvent('payment_modal_opened', {
          testType: activeTestType.value,
          planId: selectedPlan.value.id
        })
        await refreshPaymentConfig()
      })

      onUnmounted(stopPolling)

      const checkPaymentStatus = async () => {
        if (!isPaymentLive.value) return
        step.value = 'processing'

        if (demoPaymentsEnabled()) {
          setTimeout(() => { finishPaidFlow(localOrderId.value) }, 800)
          return
        }

        try {
          const orderId = await createPaymentIntent()
          if (payMethod.value === 'stripe') {
            if (!checkoutUrl.value) throw new Error('Stripe Checkout 未返回跳转链接')
            trackBusinessEvent('checkout_redirected', {
              orderId,
              testType: activeTestType.value,
              planId: selectedPlan.value.id,
              metadata: { provider: 'stripe' }
            })
            window.location.assign(checkoutUrl.value)
            return
          }
          const res = await fetch('/api/payment/notify-paid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(data.message || data.error || '支付核验提交失败')
          step.value = 'reviewing'
          paymentMessage.value = data.status === 'paid'
            ? '支付已确认，正在解锁报告。'
            : '订单确认已提交。本窗口会在支付确认后自动解锁报告。'
            if (data.status === 'paid') {
              trackBusinessEvent('payment_confirmed', {
                orderId,
                testType: activeTestType.value,
                planId: selectedPlan.value.id
              })
              finishPaidFlow(orderId)
          } else {
            pollPaymentStatus()
          }
        } catch (e) {
          console.error(e)
          step.value = 'error'
          paymentMessage.value = e.message || '支付确认失败，请稍后重试或联系 Northstar 客服。'
        }
      }

      watch(selectedPlanId, () => {
        resetIntent()
        if (isPaymentLive.value && payMethod.value !== 'stripe') createPaymentIntent().catch(console.error)
      })
      watch(payMethod, () => {
        resetIntent()
        if (isPaymentLive.value && payMethod.value !== 'stripe') createPaymentIntent().catch(console.error)
      })

      return {
        step, payMethod, todayCount, localOrderId, paymentMessage, acceptedTerms, checkoutUrl, gatewayQrImage, gatewayQrCodeUrl,
        activeTestType, availablePlans, selectedPlanId, selectedPlan, selectedPlanTestNames,
        TEST_CATALOG, isPaymentLive, paymentConfig, providerReady, isEnglish, paymentActionLabel,
        checkPaymentStatus, localizedLegalHref
      }
    },
    template: `
      <div class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal-content payment-modal-v2">
          <button class="close-btn" @click="$emit('close')">×</button>

          <div v-if="step === 'scan'" class="payment-step">
            <div class="payment-header">
              <span class="payment-icon">💎</span>
              <h3>选择你想看的内容</h3>
              <p class="payment-subtitle">正在查看：<strong>{{ TEST_CATALOG?.[activeTestType]?.name || '完整内容' }}</strong></p>
            </div>

            <div class="plan-list">
              <button
                v-for="plan in availablePlans"
                :key="plan.id"
                class="plan-option"
                :class="{ selected: selectedPlanId === plan.id }"
                @click="selectedPlanId = plan.id"
              >
                <span class="plan-option-main">
                  <span class="plan-option-name">{{ plan.name }}</span>
                  <span class="plan-option-desc">{{ plan.description }}</span>
                </span>
                <span class="plan-option-price">USD &#36;{{ plan.price.toFixed(2) }}</span>
              </button>
            </div>

            <p class="payment-subtitle" style="margin: 8px 0 16px;">会解锁：{{ selectedPlanTestNames }}</p>
            <div class="payment-subtitle" style="margin: 0 0 16px; padding: 12px 14px; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;">
              <template v-if="isEnglish">Professional long report · 10–12 structured sections · approximately 15–20 minutes to read · personalized evidence and action plan.</template>
              <template v-else>专业长报告 · 10–12 个结构化章节 · 约 15–20 分钟阅读 · 包含个性化证据与行动计划。</template>
            </div>

            <div v-if="!isPaymentLive" class="prelaunch-payment-note">
              <span class="prelaunch-badge">即将开放</span>
              <h4>完整解读与套餐购买正在接入中</h4>
              <p>当前版本可以先体验基础测试结果。正式支付通道开放后，完整解读、本次结果补充和套餐解锁会在这里直接启用。</p>
            </div>

            <template v-else>
            <div class="qr-labels" style="justify-content: center; margin-bottom: 16px; flex-wrap: wrap;">
              <span v-if="providerReady('stripe')" class="qr-label" 
                    :class="{ stripe: payMethod === 'stripe' }" 
                    @click="payMethod = 'stripe'" 
                    style="cursor: pointer; transition: 0.3s; font-size: 14px; padding: 6px 20px;"
                    :style="{ opacity: payMethod === 'stripe' ? 1 : 0.4, border: payMethod === 'stripe' ? '' : '1px solid rgba(255,255,255,0.2)' }">
                Stripe 官方支付
              </span>
              <span v-if="!isEnglish && providerReady('wechat')" class="qr-label" 
                    :class="{ wechat: payMethod === 'wechat' }" 
                    @click="payMethod = 'wechat'" 
                    style="cursor: pointer; transition: 0.3s; font-size: 14px; padding: 6px 20px;"
                    :style="{ opacity: payMethod === 'wechat' ? 1 : 0.4, border: payMethod === 'wechat' ? '' : '1px solid rgba(255,255,255,0.2)' }">
                微信支付
              </span>
              <span v-if="!isEnglish && providerReady('alipay')" class="qr-label" 
                    :class="{ alipay: payMethod === 'alipay' }" 
                    @click="payMethod = 'alipay'" 
                    style="cursor: pointer; transition: 0.3s; font-size: 14px; padding: 6px 20px;"
                    :style="{ opacity: payMethod === 'alipay' ? 1 : 0.4, border: payMethod === 'alipay' ? '' : '1px solid rgba(255,255,255,0.2)' }">
                支付宝
              </span>
              <span v-if="!isEnglish && providerReady('manual') && paymentConfig.paymentMode !== 'live'" class="qr-label" 
                    :class="{ manual: payMethod === 'manual' }" 
                    @click="payMethod = 'manual'" 
                    style="cursor: pointer; transition: 0.3s; font-size: 14px; padding: 6px 20px;"
                    :style="{ opacity: payMethod === 'manual' ? 1 : 0.4, border: payMethod === 'manual' ? '' : '1px solid rgba(255,255,255,0.2)' }">
                转账确认
              </span>
            </div>

            <div class="qr-display" style="margin-top: 0;" v-if="!isEnglish && payMethod !== 'stripe'">
              <div class="qr-frame">
                <img :key="payMethod + gatewayQrImage" :src="gatewayQrImage || (payMethod === 'wechat' ? './wechat_qr.jpg' : (payMethod === 'alipay' ? './alipay_qr.jpg' : './pay_qr.jpg'))" alt="收款码" class="qr-image" onerror="this.onerror=null; this.src='./pay_qr.jpg';" />
              </div>
              <p class="payment-subtitle" style="margin-top: 10px;" v-if="gatewayQrImage">动态支付二维码 · 支付后自动确认</p>
              <p class="payment-subtitle" style="margin-top: 10px;" v-else>{{ paymentMessage || '当前显示转账确认收款码' }}</p>
            </div>
            <div class="payment-subtitle" v-else style="margin: 18px 0; padding: 14px; border: 1px solid rgba(66,133,244,0.25); border-radius: 10px; background: rgba(66,133,244,0.08);">
              <template v-if="isEnglish">You will continue to Stripe’s secure checkout in English. Available cards, Apple Pay, Link and other eligible methods will appear based on your device and region. After payment, you will return automatically and your purchase will unlock.</template>
              <template v-else>将进入 Stripe 官方中文付款页，页面会展示当前账户与设备可用的银行卡、Apple Pay、Link 等方式。支付完成后会自动返回并解锁。</template>
            </div>

            <div class="price-display">
              <span class="price-current">USD &#36;{{ selectedPlan.price.toFixed(2) }}</span>
              <span class="prelaunch-badge">{{ isEnglish ? 'Launch price' : '上线价' }}</span>
            </div>
            <p class="price-hint">支付确认后就能看，之后也可以回来继续读</p>

            <label class="payment-consent">
              <input type="checkbox" v-model="acceptedTerms" />
              <span v-if="isEnglish">I have read and agree to the <a :href="localizedLegalHref('./terms.html')" target="_blank">Terms & Disclaimer</a>, <a :href="localizedLegalHref('./privacy.html')" target="_blank">Privacy Policy</a>, and <a :href="localizedLegalHref('./refund.html')" target="_blank">Refund Policy</a>. I understand that digital reports are generated immediately after payment.</span>
              <span v-else>我已阅读并同意 <a :href="localizedLegalHref('./terms.html')" target="_blank">用户协议</a>、<a :href="localizedLegalHref('./privacy.html')" target="_blank">隐私政策</a>和<a :href="localizedLegalHref('./refund.html')" target="_blank">退款规则</a>，并确认数字报告付款后立即生成。</span>
            </label>

            <button class="primary-action pay-confirm-btn" :disabled="!acceptedTerms" @click="checkPaymentStatus">
              {{ paymentActionLabel }}
            </button>
            <p style="font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 15px; text-align: center;">
              <template v-if="isEnglish">Order ID: {{ localOrderId || 'created when you continue' }}</template>
              <template v-else>订单号：{{ localOrderId || '点击付款后生成' }}</template>
            </p>
            </template>

            <button v-if="!isPaymentLive" class="primary-action pay-confirm-btn" @click="$emit('close')">
              继续体验基础结果
            </button>
          </div>

          <div v-else-if="step === 'processing'" class="payment-step processing">
            <div class="spinner"></div>
            <h3 style="margin-top:20px;">正在确认订单...</h3>
            <p class="payment-subtitle" style="margin-top:10px;">确认过程中请保持当前页面打开</p>
          </div>

          <div v-else-if="step === 'reviewing'" class="payment-step processing">
            <div class="spinner"></div>
            <h3 style="margin-top:20px;">等待支付确认</h3>
            <p class="payment-subtitle" style="margin-top:10px;">{{ paymentMessage }}</p>
            <p style="font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 15px;">订单号：{{ localOrderId }}</p>
          </div>

          <div v-else-if="step === 'error'" class="payment-step processing">
            <h3 style="margin-top:20px;">订单确认未完成</h3>
            <p class="payment-subtitle" style="margin-top:10px;">{{ paymentMessage }}</p>
            <button class="secondary-action" @click="step = 'scan'" style="margin-top:20px;">返回重试</button>
          </div>
        </div>
      </div>
    `
  })

  const PaymentReturn = defineComponent({
    name: 'PaymentReturnPage',
    setup() {
      const route = useRoute()
      const router = useRouter()
      const status = ref('checking')
      const isEnglish = computed(() => activeLocale.value === 'en')
      const message = ref(currentLocale() === 'en' ? 'Confirming your payment...' : '正在确认支付结果...')
      const orderId = computed(() => route.query.orderId || '')
      const access = ref(null)
      let checkTimer = null

      const checkOrder = async () => {
        if (!orderId.value) {
          status.value = 'error'
          message.value = isEnglish.value ? 'The order ID is missing.' : '缺少订单号，无法确认订单状态。'
          return
        }
        try {
          const res = await fetch('/api/payment/status/' + encodeURIComponent(orderId.value))
          if (!res.ok) throw new Error(isEnglish.value ? 'The order could not be found.' : '订单不存在或暂时无法查询')
          const data = await res.json()
          access.value = data
          if (data.status === 'paid') {
            if (checkTimer) {
              clearInterval(checkTimer)
              checkTimer = null
            }
            if (data.planId === 'trial') {
              try {
                const trials = JSON.parse(localStorage.getItem('northstar_trial_purchases') || '[]')
                if (!trials.some(item => item.id === orderId.value)) {
                  trials.unshift({
                    id: orderId.value,
                    testType: data.testType || 'tarot',
                    planName: data.planName || '体验解读',
                    price: Number(data.amount || 0),
                    date: new Date().toLocaleString()
                  })
                  localStorage.setItem('northstar_trial_purchases', JSON.stringify(trials.slice(0, 30)))
                }
              } catch (e) {}
              status.value = 'paid'
              message.value = isEnglish.value
                ? 'Your Quick Insight payment is confirmed.'
                : '体验付款已确认，可以返回原页面查看本次快速提示。'
              return
            }
            applyServerAccess(data, orderId.value)
            trackBusinessEvent('payment_confirmed', {
              orderId: orderId.value,
              testType: data.testType,
              planId: data.planId,
              metadata: { source: 'payment_return' }
            })
            status.value = 'paid'
            message.value = isEnglish.value
              ? 'Payment confirmed. Your report access has been restored on this device.'
              : '支付已确认，报告方案已解锁，并已在当前设备恢复访问。'
          } else if (data.status === 'canceled' || data.status === 'refunded' || data.status === 'disputed') {
            if (checkTimer) {
              clearInterval(checkTimer)
              checkTimer = null
            }
            status.value = 'error'
            message.value = isEnglish.value
              ? 'This order does not currently have active report access.'
              : '该订单当前不具备有效报告访问权。'
          } else {
            status.value = 'pending'
            message.value = isEnglish.value
              ? 'Payment is still syncing. This page will update automatically.'
              : '订单状态仍在同步中，页面会自动更新。'
            if (!checkTimer) checkTimer = setInterval(checkOrder, 2500)
          }
        } catch (e) {
          status.value = 'error'
          message.value = e.message || (isEnglish.value ? 'Order confirmation failed.' : '订单确认失败。')
        }
      }

      const copyOrderId = async () => {
        if (!orderId.value || !navigator.clipboard) return
        await navigator.clipboard.writeText(orderId.value)
        message.value = isEnglish.value
          ? 'Order ID copied. Keep it to restore access on another device.'
          : '订单号已复制。请保存它，以便在其他设备恢复访问。'
      }

      const printReceipt = () => window.print()

      onMounted(checkOrder)
      watch(orderId, () => {
        if (checkTimer) {
          clearInterval(checkTimer)
          checkTimer = null
        }
        status.value = 'checking'
        checkOrder()
      })
      onUnmounted(() => {
        if (checkTimer) clearInterval(checkTimer)
      })

      return { orderId, status, message, access, isEnglish, checkOrder, copyOrderId, printReceipt, router }
    },
    template: `
      <main class="section" style="min-height: 70vh; display: grid; place-items: center;">
        <div class="deep-result-container" style="max-width: 620px; min-height: auto; text-align: center;">
          <p class="section-kicker">{{ isEnglish ? 'Payment return' : '支付返回' }}</p>
          <h2 style="font-size: 36px;">{{ isEnglish ? 'Order confirmation' : '订单状态确认' }}</h2>
          <p class="lede" style="margin: 0 auto 18px;">{{ message }}</p>
          <p class="mono" style="font-size: 12px; color: var(--muted); margin-bottom: 10px;">{{ isEnglish ? 'Order ID' : '订单号' }}: {{ orderId || '-' }}</p>
          <p v-if="status === 'paid'" class="payment-subtitle" style="margin-bottom: 24px;">
            {{ isEnglish ? 'Save this order ID. It is your recovery key for purchases made without an account.' : '请保存订单号。未登录购买时，它就是跨设备恢复权益的凭证。' }}
          </p>
          <div v-if="status === 'paid' && access" class="payment-subtitle" style="margin: 0 auto 24px; padding: 16px; max-width: 460px; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; text-align: left;">
            <p><strong>{{ isEnglish ? 'Purchase receipt' : '购买凭证' }}</strong></p>
            <p>{{ isEnglish ? 'Product' : '商品' }}: {{ access.planName || access.planId }}</p>
            <p>{{ isEnglish ? 'Amount' : '金额' }}: {{ access.currency || 'USD' }} &#36;{{ Number(access.amount || 0).toFixed(2) }}</p>
            <p>{{ isEnglish ? 'Paid at' : '付款时间' }}: {{ access.paidAt || '-' }}</p>
            <p>{{ isEnglish ? 'Order ID' : '订单号' }}: {{ orderId }}</p>
          </div>
          <div class="actions" style="justify-content: center;">
            <button v-if="status !== 'paid'" class="primary-action" @click="checkOrder">{{ isEnglish ? 'Refresh status' : '刷新状态' }}</button>
            <button v-if="status === 'paid'" class="primary-action" @click="copyOrderId">{{ isEnglish ? 'Copy order ID' : '复制订单号' }}</button>
            <button v-if="status === 'paid'" class="secondary-action" @click="printReceipt">{{ isEnglish ? 'Print receipt' : '打印凭证' }}</button>
            <button class="secondary-action" @click="router.push('/')">{{ isEnglish ? 'Return home' : '返回首页' }}</button>
          </div>
        </div>
      </main>
    `
  })

  const RestorePurchase = defineComponent({
    name: 'RestorePurchasePage',
    setup() {
      const router = useRouter()
      const isEnglish = computed(() => activeLocale.value === 'en')
      const orderId = ref('')
      const status = ref('idle')
      const message = ref('')
      const restoredTests = ref([])

      const restore = async () => {
        status.value = 'loading'
        message.value = isEnglish.value ? 'Checking your purchase...' : '正在查询购买记录...'
        restoredTests.value = []
        try {
          const access = await restorePurchaseAccess(orderId.value)
          trackBusinessEvent('restore_succeeded', {
            orderId: orderId.value,
            testType: access.testType,
            planId: access.planId
          })
          restoredTests.value = access.unlockTests || []
          status.value = 'success'
          message.value = isEnglish.value
            ? 'Purchase restored on this device.'
            : '购买权益已恢复到当前设备。'
        } catch (error) {
          trackBusinessEvent('restore_failed', {
            orderId: orderId.value,
            metadata: { reason: error.message || 'unknown' }
          })
          status.value = 'error'
          message.value = error.message || (isEnglish.value ? 'Purchase restoration failed.' : '恢复购买失败。')
        }
      }

      const testLabel = (id) => isEnglish.value
        ? i18n.t(TEST_CATALOG[id]?.name || id)
        : (TEST_CATALOG[id]?.name || id)
      const orderPlaceholder = computed(() => isEnglish.value ? 'Paste your order ID' : '粘贴订单号')

      return { router, isEnglish, orderId, status, message, restoredTests, restore, testLabel, orderPlaceholder }
    },
    template: `
      <main class="section" style="min-height: 70vh; display: grid; place-items: center;">
        <div class="deep-result-container" style="max-width: 680px; min-height: auto;">
          <p class="section-kicker">{{ isEnglish ? 'Purchase recovery' : '购买恢复' }}</p>
          <h2 style="font-size: 36px;">{{ isEnglish ? 'Restore report access' : '恢复报告访问权' }}</h2>
          <p class="lede">
            {{ isEnglish
              ? 'Enter the order ID shown after payment. A valid paid order restores its report access on this device.'
              : '输入付款完成后显示的订单号。服务器确认订单有效后，会在当前设备恢复对应报告权限。' }}
          </p>
          <label class="form-group" style="display: block; margin: 24px 0 14px;">
            <span>{{ isEnglish ? 'Order ID' : '订单号' }}</span>
            <input v-model.trim="orderId" maxlength="120" autocomplete="off" :placeholder="orderPlaceholder" @keydown.enter="restore" />
          </label>
          <button class="primary-action" :disabled="status === 'loading' || !orderId" @click="restore">
            {{ status === 'loading' ? (isEnglish ? 'Checking...' : '查询中...') : (isEnglish ? 'Restore purchase' : '恢复购买') }}
          </button>
          <p v-if="message" :class="{ error: status === 'error' }" style="margin-top: 18px;">{{ message }}</p>
          <div v-if="status === 'success'" style="margin-top: 18px;">
            <p>{{ isEnglish ? 'Restored reports:' : '已恢复的报告：' }}</p>
            <p class="payment-subtitle">{{ restoredTests.map(testLabel).join(' / ') }}</p>
            <button class="secondary-action" style="margin-top: 14px;" @click="router.push('/')">{{ isEnglish ? 'Choose a report' : '返回选择报告' }}</button>
          </div>
        </div>
      </main>
    `
  })

  const Home = defineComponent({
    name: 'HomePage',
    setup() {
      const heroVisual = ref(null)
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const onMouseMove = (e) => {
        if (store.homePhase !== 'hero') return
        if (heroVisual.value && !reduceMotion) {
          const x = (e.clientX / window.innerWidth - 0.5) * 40
          const y = (e.clientY / window.innerHeight - 0.5) * -40
          heroVisual.value.style.transform =
            'perspective(1000px) rotateY(' + x + 'deg) rotateX(' + y + 'deg) scale3d(1.02, 1.02, 1.02)'
        }
      }
      const onMouseLeave = () => {
        if (store.homePhase !== 'hero') return
        if (heroVisual.value && !reduceMotion) {
          heroVisual.value.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)'
          heroVisual.value.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }
      }
      const onMouseEnter = () => {
        if (store.homePhase !== 'hero') return
        if (heroVisual.value && !reduceMotion) heroVisual.value.style.transition = 'none'
      }

      // Cosmic Energy Data Generation
      const getDailyEnergy = () => {
        const today = new Date()
        let personalSeed = 0
        let hasArchive = false
        
        try {
          const archives = JSON.parse(localStorage.getItem('northstar_archives') || '[]')
          if (archives.length > 0) {
            hasArchive = true
            // Generate a personal seed based on their first archive title
            const str = archives[0].title
            for(let i=0; i<str.length; i++) {
              personalSeed = Math.imul(31, personalSeed) + str.charCodeAt(i) | 0
            }
          }
        } catch(e) {}

        const baseSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
        const seed = baseSeed + personalSeed
        
        // Pseudo-random based on date + personal seed
        const pseudoRandom = (offset) => Math.abs(Math.sin(seed + offset))
        
        const moonPhases = ['新月', '峨眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月']
        const phaseIndex = Math.floor(pseudoRandom(1) * 8)
        
        const zodiacs = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼']
        const currentZodiac = zodiacs[today.getMonth()]
        
        const dailyQuotes = [
            "今日宜向内收敛能量，不要试图去说服任何人。",
            "今天适合减少无效社交，把注意力放回自己的节奏。",
            "今日塔罗指引：【愚人正位】—— 适合尝试新的开始，但也要保留基本判断。",
            "财运暗涌，留意下午3点后收到的灵感或信息。",
            "今天适合进行10分钟冥想或独处整理，你会更容易听见自己的真实需要。",
            "某个旧人或旧事可能再次出现，适合用更成熟的方式完成告别或修复。",
            "今日塔罗指引：【女祭司正位】—— 保持高贵的沉默，答案已经在你心中。",
            "今日宜破局：打破一项你坚持了很久的无效习惯。",
            "今天适合真实表达，不必把所有脆弱都藏起来。",
            "今日塔罗指引：【命运之轮正位】—— 变化正在发生，保持弹性比强行控制更重要。"
        ]
        const quoteIndex = Math.floor(pseudoRandom(99) * dailyQuotes.length)
        const fortuneQuote = hasArchive ? dailyQuotes[quoteIndex] : "完成任意一份内容后，这里会给你更贴近自己的每日提示。"

        return {
          moonPhase: moonPhases[phaseIndex],
          sunSign: currentZodiac,
          intuition: Math.floor(pseudoRandom(2) * 40 + 60),
          creativity: Math.floor(pseudoRandom(3) * 50 + 50),
          clarity: Math.floor(pseudoRandom(4) * 60 + 40),
          crystal: ['紫水晶', '月光石', '黑曜石', '拉长石', '粉晶', '钛晶', '绿幽灵', '海蓝宝'][Math.floor(pseudoRandom(5) * 8)],
          fortune: fortuneQuote,
          hasArchive: hasArchive
        }
      }
      const energy = Vue.ref(getDailyEnergy())

      const startWarp = () => {
        // 彻底移除所有延时机制，利用 Vue 自带的 out-in 渐变实现瞬间且丝滑的切换
        store.homePhase = 'menu'
        nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
      }

      const router = useRouter()

      return { heroVisual, onMouseMove, onMouseLeave, onMouseEnter, startWarp, store, energy, router }
    },
    template: `
      <main id="top" class="home-container">
        <transition name="menu-reveal" mode="out-in">
          
          <div v-if="store.homePhase === 'hero' || store.homePhase === 'warping'" key="hero-state">
            <section class="hero" :class="{'is-warping-text': store.homePhase === 'warping'}" aria-labelledby="hero-title">
              <div class="hero-copy" :style="{ opacity: store.homePhase === 'hero' ? 1 : 0, transition: 'opacity 1s ease', pointerEvents: store.homePhase === 'hero' ? 'auto' : 'none' }">
                <p class="eyebrow" v-reveal>NORTHSTAR · PERSONAL INSIGHT ENGINE</p>
                <h1 id="hero-title" v-reveal style="transition-delay: 0.1s">看见真实的自己<br>看见关系里的答案</h1>
                <p class="lede" v-reveal style="transition-delay: 0.2s">
                  有些问题，不一定马上有答案。你可以从性格、依恋、塔罗、星盘、八字、人类图或双人合盘里，先找到一个能对照自己的角度。
                </p>
                <div class="actions" v-reveal style="transition-delay: 0.3s">
                  <button class="primary-action warp-btn" @click="startWarp">浏览全部分析</button>
                  <button class="secondary-action" @click="router.push('/restore-purchase')">恢复已购报告</button>
                </div>
              </div>

              <aside class="antigravity-brief-panel" v-reveal style="transition-delay: 0.35s;">
                <div class="antigravity-panel-header">
                  <span class="antigravity-live-dot"></span>
                  <div>
                    <strong>Northstar Analysis System</strong>
                    <small>Private reports · persistent access</small>
                  </div>
                </div>
                <div class="antigravity-panel-divider"></div>
                <dl class="antigravity-panel-stats">
                  <div><dt>分析主题</dt><dd>16</dd></div>
                  <div><dt>专业报告</dt><dd>10–12 章</dd></div>
                  <div><dt>预计阅读</dt><dd>15–20 分钟</dd></div>
                </dl>
                <div class="antigravity-panel-divider"></div>
                <p>全站终身早鸟解锁 (All-Access Lifetime Pass) 现仅需 USD $39.99。完成付款后，访问权由服务器记录；再次进入或更换设备时可通过订单号恢复。</p>
                <div class="antigravity-signal">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
              </aside>
            </section>

            <section id="vision" class="section cosmic-dashboard" v-if="store.homePhase === 'hero'">
              <div v-reveal class="dashboard-header">
                <p class="section-kicker">今日提示</p>
                <h2>今天的小提示</h2>
                <p class="dashboard-subtitle">月相: {{ energy.moonPhase }} · 太阳: {{ energy.sunSign }}</p>
              </div>
              
              <div class="dashboard-grid" v-reveal style="transition-delay: 0.2s">
                <div class="energy-card">
                  <div class="energy-label"><span>直觉</span><span>{{ energy.intuition }}%</span></div>
                  <div class="energy-track"><div class="energy-fill" :style="{ width: energy.intuition + '%' }"></div></div>
                </div>
                <div class="energy-card">
                  <div class="energy-label"><span>灵感</span><span>{{ energy.creativity }}%</span></div>
                  <div class="energy-track"><div class="energy-fill" :style="{ width: energy.creativity + '%' }"></div></div>
                </div>
                <div class="energy-card">
                  <div class="energy-label"><span>清醒度</span><span>{{ energy.clarity }}%</span></div>
                  <div class="energy-track"><div class="energy-fill" :style="{ width: energy.clarity + '%' }"></div></div>
                </div>
                <div class="energy-meta" style="display: flex; flex-direction: column; gap: 15px;">
                  <div class="meta-item" style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="meta-title">今日小物</span>
                    <span class="meta-value">{{ energy.crystal }}</span>
                  </div>
                  <div class="meta-item" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border-left: 3px solid #ff7e5f;">
                    <span class="meta-title" style="display: block; margin-bottom: 5px; color: #ff7e5f;">✧ 今日一句</span>
                    <span class="meta-value" style="font-size: 14px; line-height: 1.5; color: rgba(255,255,255,0.9); font-weight: normal;">{{ energy.fortune }}</span>
                  </div>
                </div>
              </div>
              <div class="dashboard-actions" style="text-align: center; margin-top: 30px;" v-reveal style="transition-delay: 0.3s;">
                <button class="secondary-action" @click="router.push('/archive')" style="font-size: 14px; padding: 10px 20px;">
                  ✦ 查看已保存内容 ✦
                </button>
              </div>
            </section>
          </div>

          <section id="blocks" class="section block-grid centered-menu" aria-label="内容模块" v-else-if="store.homePhase === 'menu'" key="menu-state">
          <header class="antigravity-menu-intro" v-reveal>
            <p class="section-kicker">NORTHSTAR · ANALYSIS MODULES</p>
            <h2>选择一个想先看清的问题</h2>
            <p>每个模块都可以先完成基础测试；全站终身早鸟解锁 (All-Access Lifetime Pass) 现仅需 USD $39.99（单项完整解读 USD $7.99）。付款后获得结构化专业长报告，并可长期恢复访问。</p>
          </header>
          <article v-reveal style="cursor: pointer;" @click="$router.push('/mbti')">
            <span class="block-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);"></span>
            <h3>MBTI 性格测试</h3>
            <p>看看你习惯怎么做决定、怎么表达，又在哪些场合最容易累。</p>
          </article>
          <article v-reveal style="cursor: pointer; transition-delay: 0.05s;" @click="$router.push('/attachment')">
            <span class="block-icon" style="background: linear-gradient(135deg, #ff9a9e, #fecfef);"></span>
            <h3>恋爱依恋测试</h3>
            <p>适合想弄懂“为什么我一靠近就焦虑，或一认真就想退”的人。</p>
          </article>
          <article v-reveal style="transition-delay: 0.1s; cursor: pointer;" @click="$router.push('/tarot')">
            <span class="block-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7);"></span>
            <h3>塔罗牌占卜</h3>
            <p>把最近纠结的事放进三张牌里，换一个角度看它。</p>
          </article>
          <article v-reveal style="transition-delay: 0.15s; cursor: pointer;" @click="$router.push('/astrology')">
            <span class="block-icon" style="background: linear-gradient(135deg, #fa709a, #fee140);"></span>
            <h3>本命星盘解析</h3>
            <p>用真实星历计算太阳、月亮、上升、行星落点、宫位与主要相位。</p>
          </article>
          <article v-reveal style="transition-delay: 0.2s; cursor: pointer;" @click="$router.push('/bazi')">
            <span class="block-icon" style="background: linear-gradient(135deg, #f83600, #f9d423);"></span>
            <h3>八字命理排盘</h3>
            <p>用传统命理看阶段节奏：什么时候适合稳，什么时候适合动。</p>
          </article>
          <article v-reveal style="transition-delay: 0.25s; cursor: pointer;" @click="$router.push('/human-design')">
            <span class="block-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);"></span>
            <h3>人类图解析</h3>
            <p>看看你的决策方式、能量节奏，以及哪些事不必硬扛。</p>
          </article>
          <article v-reveal style="transition-delay: 0.3s; cursor: pointer;" @click="$router.push('/synastry')">
            <span class="block-icon" style="background: linear-gradient(135deg, #ff0844, #ffb199);"></span>
            <h3>双人契合度合盘</h3>
            <p>适合两个人一起看：哪里合拍，哪里容易误会，怎么相处更顺。</p>
          </article>

          <article v-reveal style="transition-delay: 0.35s; cursor: pointer;" @click="$router.push('/aura')">
            <span class="block-icon" style="background: linear-gradient(135deg, #96fbc4, #f9f586);"></span>
            <h3>灵魂光环测试</h3>
            <p>从当前状态出发，看看你给人的感觉和最近需要补的能量。</p>
          </article>
          <article v-reveal style="transition-delay: 0.4s; cursor: pointer;" @click="$router.push('/shadow')">
            <span class="block-icon" style="background: linear-gradient(135deg, #243949, #517fa4);"></span>
            <h3>暗影原型测试</h3>
            <p>不是吓人，是看看你在受伤或防备时会变成什么样。</p>
          </article>
          <article v-reveal style="transition-delay: 0.45s; cursor: pointer;" @click="$router.push('/color')">
            <span class="block-icon" style="background: linear-gradient(135deg, #fbc2eb, #a6c1ee);"></span>
            <h3>色彩心理测试</h3>
            <p>按直觉排颜色，看看最近的压力、需要和情绪出口。</p>
          </article>
          <article v-reveal style="transition-delay: 0.5s; cursor: pointer;" @click="$router.push('/enneagram')">
            <span class="block-icon" style="background: linear-gradient(135deg, #84fab0, #8fd3f4);"></span>
            <h3>九型人格测试</h3>
            <p>看你最在意什么，也看你为什么总在同一个地方卡住。</p>
          </article>
          <article v-reveal style="transition-delay: 0.55s; cursor: pointer;" @click="$router.push('/jung8')">
            <span class="block-icon" style="background: linear-gradient(135deg, #a1c4fd, #c2e9fb);"></span>
            <h3>荣格八维测试</h3>
            <p>更细地看你的思考、直觉、感受和行动功能。</p>
          </article>
          <article v-reveal style="transition-delay: 0.6s; cursor: pointer;" @click="$router.push('/darktriad')">
            <span class="block-icon" style="background: linear-gradient(135deg, #cfd9df, #e2ebf0);"></span>
            <h3>黑暗三角测试</h3>
            <p>温和地看见控制欲、自我保护和人际策略里的灰色部分。</p>
          </article>
          <article v-reveal style="transition-delay: 0.65s; cursor: pointer;" @click="$router.push('/saboteurs')">
            <span class="block-icon" style="background: linear-gradient(135deg, #fccd04, #ffb347);"></span>
            <h3>内在破坏者测试</h3>
            <p>看看哪些内在声音总在关键时刻拖住你。</p>
          </article>
          <article v-reveal style="transition-delay: 0.7s; cursor: pointer;" @click="$router.push('/defense')">
            <span class="block-icon" style="background: linear-gradient(135deg, #fdcbf1, #e6dee9);"></span>
            <h3>心理防御机制测试</h3>
            <p>用日常冲突情境，看你遇到不安时最常用哪种保护方式。</p>
          </article>
          </section>
          
        </transition>
      </main>
    `
  })

  // ─── Tarot Test Page ────────────────────────────────────────
  const POSITIONS = ['过去', '现在', '未来']

  const TarotTest = defineComponent({
    name: 'TarotTestPage',
    setup() {
      const router = useRouter()
      const phase = ref('question')  // question → shuffle → pick → reveal → done
      const question = ref('')
      const deck = ref([])
      const selected = ref([])       // indices into deck
      const revealedCount = ref(0)
      const isShuffling = ref(false)

      // Initialize deck
      const initDeck = () => {
        deck.value = shuffleArray(MAJOR_ARCANA).slice(0, 12).map(card => ({
          card,
          isReversed: Math.random() < 0.35,  // 35% chance of reversed
          flipped: false,
          selected: false
        }))
      }

      const startReading = () => {
        AudioSynth.init()
        AudioSynth.playShuffle()
        store.question = question.value.trim() || '我近期的整体运势如何？'
        isShuffling.value = true
        initDeck()
        phase.value = 'shuffle'

        // Shuffling animation duration
        setTimeout(() => {
          isShuffling.value = false
          phase.value = 'pick'
        }, 2000)
      }

      const selectedCount = computed(() => selected.value.length)

      const playHover = () => {
        if (phase.value === 'pick') AudioSynth.playHover()
      }

      const pickCard = (index) => {
        if (phase.value !== 'pick') return
        const item = deck.value[index]
        if (item.selected) {
          // Deselect
          item.selected = false
          selected.value = selected.value.filter(i => i !== index)
          AudioSynth.playHover()
        } else if (selectedCount.value < 3) {
          item.selected = true
          selected.value.push(index)
          AudioSynth.playHover()
        }
      }

      const revealCards = () => {
        if (selectedCount.value !== 3) return
        phase.value = 'reveal'
        revealedCount.value = 0

        // Reveal cards one by one with delay
        selected.value.forEach((deckIndex, i) => {
          setTimeout(() => {
            AudioSynth.playFlip()
            deck.value[deckIndex].flipped = true
            revealedCount.value++
          }, 600 * (i + 1))
        })
      }

      const goToResult = () => {
        store.selectedCards = selected.value.map((deckIndex, i) => ({
          card: deck.value[deckIndex].card,
          isReversed: deck.value[deckIndex].isReversed,
          position: POSITIONS[i]
        }))
        router.push('/result')
      }

      return {
        phase, question, deck, selected, selectedCount,
        revealedCount, isShuffling,
        startReading, pickCard, playHover, revealCards, goToResult,
        POSITIONS, store
      }
    },
    template: `
      <main class="tarot-test section">
        <!-- Phase 1: Ask Question -->
        <div v-if="phase === 'question'" class="question-phase">
          <div class="test-header" v-reveal>
            <p class="section-kicker">塔罗解读</p>
            <h2>塔罗牌占卜</h2>
            <p class="lede">在开始抽牌之前，请先在心中默念你当前最困惑的问题，然后将它写在下方。</p>
          </div>
          <div class="question-input-area" v-reveal style="transition-delay: 0.1s">
            <textarea
              v-model="question"
              class="question-textarea"
              rows="3"
              placeholder="例如：我近期的事业方向是什么？我和TA的感情走向如何？"
              maxlength="200"
            ></textarea>
            <p class="input-hint">也可以留空，我们将为您解读整体运势</p>
            <button class="primary-action" @click="startReading">
              ✧ 开始洗牌
            </button>
          </div>
        </div>

        <!-- Phase 2: Shuffling -->
        <div v-if="phase === 'shuffle'" class="shuffle-phase">
          <div class="shuffle-animation">
            <div class="shuffle-cards">
              <div v-for="i in 5" :key="i" class="shuffle-card" :style="{ animationDelay: (i * 0.12) + 's' }">
                <span class="card-pattern">✧</span>
              </div>
            </div>
            <p class="shuffle-text">正在洗牌，请专注于你的问题...</p>
            <p class="shuffle-question">"{{ store.question }}"</p>
          </div>
        </div>

        <!-- Phase 3: Pick Cards -->
        <div v-if="phase === 'pick'" class="pick-phase">
          <div class="test-header" v-reveal>
            <p class="section-kicker">选择牌面</p>
            <h2>凭直觉抽取 3 张牌</h2>
            <p class="lede">它们将分别代表你的<strong>过去</strong>、<strong>现在</strong>与<strong>未来</strong>。</p>
          </div>

          <div class="card-grid" v-reveal style="transition-delay: 0.1s">
            <div
              v-for="(item, index) in deck"
              :key="index"
              class="tarot-card"
              :class="{ selected: item.selected }"
              @click="pickCard(index)"
              @mouseenter="playHover"
            >
              <div class="card-inner">
                <div class="card-front">
                  <span class="card-numeral">{{ index + 1 }}</span>
                  <span class="card-pattern">✧</span>
                  <span class="card-label">Northstar</span>
                </div>
                <div class="card-back">
                  <span class="card-position-tag" v-if="item.selected">
                    {{ POSITIONS[selected.indexOf(index)] }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="action-area" v-reveal style="transition-delay: 0.2s">
            <p class="status-text">已抽取 {{ selectedCount }} / 3 张</p>
            <button class="primary-action" :disabled="selectedCount !== 3" @click="revealCards">
              ✧ 翻开命运之牌
            </button>
          </div>
        </div>

        <!-- Phase 4: Reveal -->
        <div v-if="phase === 'reveal'" class="reveal-phase">
          <div class="test-header">
            <p class="section-kicker">牌面揭晓</p>
            <h2>命运之牌正在揭晓...</h2>
          </div>

          <div class="reveal-cards">
            <div
              v-for="(deckIndex, i) in selected"
              :key="i"
              class="reveal-card-wrapper"
              :class="{ revealed: deck[deckIndex].flipped }"
              :style="{ animationDelay: (i * 0.6) + 's' }"
            >
              <div class="reveal-position">{{ POSITIONS[i] }}</div>
              <div class="reveal-card" :class="{ flipped: deck[deckIndex].flipped, reversed: deck[deckIndex].isReversed && deck[deckIndex].flipped }">
                <div class="reveal-card-inner">
                  <div class="reveal-front">
                    <span class="card-pattern">✧</span>
                  </div>
                  <div class="reveal-back-face">
                    <span class="reveal-symbol">{{ deck[deckIndex].card.symbol }}</span>
                    <span class="reveal-numeral">{{ deck[deckIndex].card.numeral }}</span>
                    <span class="reveal-name">{{ deck[deckIndex].card.name }}</span>
                    
                    <span class="reveal-orientation" v-if="deck[deckIndex].isReversed">逆位</span>
                    <span class="reveal-orientation upright-tag" v-else>正位</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="action-area" v-if="revealedCount >= 3" style="margin-top: 40px;">
            <button class="primary-action" @click="goToResult">
              ✧ 查看完整解读
            </button>
          </div>
        </div>
      </main>
    `
  })

  // ─── Result Page ────────────────────────────────────────────
  const Result = defineComponent({
    name: 'ResultPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const showPayment = ref(false)
      const orderId = ref(null)
      const hasPaid = ref(isTestUnlocked('tarot'))

      if (!store.selectedCards.length) {
        const draft = loadResultDraft('tarot')
        if (draft && Array.isArray(draft.selectedCards) && draft.selectedCards.length) {
          store.question = draft.question || ''
          store.selectedCards = draft.selectedCards
        }
      }

      // If no cards selected, redirect
      if (!store.selectedCards.length) {
        router.push('/tarot')
        return { showPayment, hasPaid, cards: ref([]), question: ref('') }
      }

      const cards = ref(store.selectedCards)
      const question = ref(store.question)
      const displayedDeepText = ref('')
      const isTyping = ref(false)

      const getKeywords = (item) => {
        return item.isReversed ? item.card.keywords.reversed : item.card.keywords.upright
      }

      const getMeaning = (item) => {
        const dir = item.isReversed ? 'reversed' : 'upright'
        const pos = item.position === '过去' ? 'past' : item.position === '现在' ? 'present' : 'future'
        return item.card.meaning[dir][pos]
      }

      const getDeepMeaning = (item) => {
        const dir = item.isReversed ? 'reversed' : 'upright'
        const pos = item.position === '过去' ? 'past' : item.position === '现在' ? 'present' : 'future'
        if (typeof item.card.deep[dir] === 'string') return item.card.deep[dir];
        return item.card.deep[dir][pos];
      }

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 50)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        unlockPlan(plan && plan.id, 'tarot')
        setStoredTestOrderId('tarot', plan && plan.orderId)
        hasPaid.value = true
        
        // Assemble AI text
        const intro = `基于您的问题：「${question.value}」以及您抽到的三张牌（${cards.value.map(c => c.card.name + (c.isReversed ? '逆位' : '正位')).join('、')}），宇宙的深层指引如下：\n\n`
        const body = cards.value.map(c => `【${c.position}位置 - ${c.card.name}${c.isReversed ? '逆位' : '正位'}】\n${getDeepMeaning(c)}`).join('\n\n')
        
        const fullText = await generatePaidAIReport({
          testType: 'tarot',
          orderId: plan && plan.orderId,
          resultSummary: cards.value.map(c => `${c.position}:${c.card.name}${c.isReversed ? '逆位' : '正位'}`).join(' / '),
          baseDeepReport: intro + body,
          userInputs: { question: question.value },
          context: { cards: cards.value.map(c => ({ position: c.position, card: c.card.name, orientation: c.isReversed ? '逆位' : '正位' })) }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('tarot') })
        }, 0)
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('poster-dom')
        if (!posterEl) return
        
        // Use html2canvas
        try {
          // Add a loading state if needed
          const canvas = await html2canvas(posterEl, {
            scale: 2, // High resolution
            useCORS: true,
            backgroundColor: '#16213e'
          })
          
          const imgUrl = canvas.toDataURL('image/png')
          
          // Trigger download
          const link = document.createElement('a')
          link.download = 'Northstar_Tarot_Reading.png'
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const restartTest = () => {
        clearResultDraft('tarot')
        clearAIReportCache('tarot')
        store.selectedCards = []
        store.question = ''
        router.push('/tarot')
      }

      return {
        showPayment, hasPaid, cards, question, displayedDeepText, isTyping,
        handlePaymentSuccess, getKeywords, getMeaning, getDeepMeaning, generatePoster, restartTest, skipTypewriter
      }
    },
    template: `
      <main class="result-page section">
        <div v-reveal>
          <p class="section-kicker">解读结果</p>
          <h2>命运交响：你的塔罗启示</h2>
          <p class="result-question" v-if="question">你的问题：「{{ question }}」</p>
        </div>

        <!-- Card Summary -->
        <div class="result-cards-row" v-reveal style="transition-delay: 0.1s">
          <div v-for="item in cards" :key="item.card.id" class="result-card-item">
            <div class="result-card-visual" :class="{ 'is-reversed-visual': item.isReversed }">
              <span class="result-card-symbol">{{ item.card.symbol }}</span>
              <span class="result-card-numeral">{{ item.card.numeral }}</span>
            </div>
            <div class="result-card-label">
              <span class="result-position-tag">{{ item.position }}</span>
              <span class="result-card-name">{{ item.card.name }}</span>
              
              <span class="result-orientation" :class="item.isReversed ? 'reversed-text' : 'upright-text'">
                {{ item.isReversed ? '逆位 ↓' : '正位 ↑' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Free Reading -->
        <div class="reading-section" v-reveal style="transition-delay: 0.2s">
          <h3>✦ 基础牌面解析</h3>
          <div v-for="item in cards" :key="'free-' + item.card.id" class="reading-block">
            <div class="reading-block-header">
              <span class="reading-position">{{ item.position }}</span>
              <span class="reading-card-name">{{ item.card.symbol }} {{ item.card.name }}（{{ item.isReversed ? '逆位' : '正位' }}）</span>
            </div>
            <p class="reading-keywords">关键词：{{ getKeywords(item) }}</p>
            <p class="reading-text">{{ getMeaning(item) }}</p>
          </div>
        </div>

        <!-- Deep Reading / Paywall -->
        <div class="deep-result-container" v-reveal style="transition-delay: 0.3s">
          <div class="paywall-overlay" v-if="!hasPaid">
            <div class="paywall-content">
              <h3>✦ 查看完整塔罗解读</h3>
              <p>包含三张牌的完整牌意、当下阻力、可尝试的行动方向，以及一段根据本次牌面补写的说明。</p>
              <div class="price">上线价 USD $7.99</div>
              <div class="price-all" style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; margin-bottom: 8px;">全站终身解锁 (All-Access Pass): USD $39.99</div>
              <p class="price-hint">支付开放后可查看完整解读，并附上本次结果补充</p>
              <button class="primary-action pay-btn" @click="showPayment = true">查看上线方案</button>
            </div>
          </div>

          <div class="deep-content" :class="{ 'is-blurred': !hasPaid }" v-if="!hasPaid">
            <h3>✦ 完整牌面说明</h3>
            <div v-for="item in cards" :key="'deep-' + item.card.id" class="reading-block deep-block">
              <div class="reading-block-header">
                <span class="reading-position">{{ item.position }}</span>
                <span class="reading-card-name">{{ item.card.symbol }} {{ item.card.name }}（{{ item.isReversed ? '逆位' : '正位' }}）· 深层解析</span>
              </div>
              <p class="reading-text deep-text">{{ getDeepMeaning(item) }}</p>
            </div>
          </div>
          
          <!-- AI Typewriter Effect (Shown after payment) -->
          <div class="deep-content ai-mode" v-if="hasPaid">
            <professional-report
              :text="displayedDeepText"
              :is-typing="isTyping"
              title="塔罗专业长报告"
              :result-label="question ? '关于「' + question + '」的三牌解读' : '三牌塔罗解读'"
              @skip="skipTypewriter"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="result-actions" v-reveal style="transition-delay: 0.4s">
          <button class="primary-action" @click="generatePoster" v-if="hasPaid && !isTyping">
            ✧ 保存专属内心海报
          </button>
          <button class="secondary-action" @click="restartTest">重新抽牌</button>
          <router-link class="secondary-action" to="/">返回首页</router-link>
        </div>

        <!-- Hidden Poster DOM -->
        <div id="poster-dom" class="poster-container" v-if="hasPaid">
          <div class="poster-header">
            <div class="poster-brand">✧ 北极星 · 塔罗占卜 ✧</div>
            <div class="poster-title">潜意识之境·命运启示</div>
            <div class="poster-question" v-if="question">「{{ question }}」</div>
          </div>
          
          <div class="poster-cards">
            <div v-for="item in cards" :key="'poster-'+item.card.id" class="poster-card-item">
              <div class="poster-card-visual" :class="{ 'is-reversed': item.isReversed }">
                <span class="poster-card-symbol">{{ item.card.symbol }}</span>
              </div>
              <div class="poster-card-info">
                <div class="poster-card-pos">{{ item.position }}</div>
                <div class="poster-card-name">
                  {{ item.card.name }} {{ item.isReversed ? '逆位' : '正位' }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="poster-reading">
            <div class="poster-reading-title">✧ 完整解读摘要 ✧</div>
            <div class="poster-reading-text">{{ displayedDeepText }}</div>
          </div>
          
          <div class="poster-footer">
            <div class="poster-footer-text">
              本报告由 Northstar 独家生成<br>
              探索潜意识，预见未知的自我
            </div>
            <div class="poster-qr">
              扫码<br>开启<br>你的旅程
            </div>
          </div>
        </div>

        <PaymentModal
          v-if="showPayment"
          @close="showPayment = false"
          @success="handlePaymentSuccess"
        />
      </main>
    `
  })

  // ─── MBTI DATABASE ──────────────────────────────────────────
  const MBTI_QUESTIONS = [
    // E_I
    { id: 1, trait: 'E_I', text: '在社交聚会中，我通常会主动开启话题，而不是等待别人来找我。' },
    { id: 2, trait: 'E_I', text: '经过一天漫长的工作后，我更倾向于独处来恢复精力。', invert: true },
    { id: 3, trait: 'E_I', text: '我喜欢结交新朋友，并且很容易在陌生环境中融入人群。' },
    { id: 4, trait: 'E_I', text: '我更喜欢通过写信息或邮件交流，而不是直接打电话。', invert: true },
    { id: 5, trait: 'E_I', text: '在团队会议中，我常常是第一个发言表达想法的人。' },
    { id: 6, trait: 'E_I', text: '我享受成为众人瞩目焦点的感觉。' },
    { id: 7, trait: 'E_I', text: '相比于热闹的派对，我更喜欢只有两三个挚友的小聚会。', invert: true },
    { id: 8, trait: 'E_I', text: '即使和不熟悉的人待在一起，我也能轻松地找到共同话题。' },
    { id: 9, trait: 'E_I', text: '连续几天的社交活动会让我感到极其疲惫。', invert: true },
    { id: 10, trait: 'E_I', text: '我喜欢那种充满活力和喧闹的工作环境。' },
    { id: 11, trait: 'E_I', text: '我倾向于在脑海里反复斟酌想法，而不是大声说出来与人讨论。', invert: true },
    { id: 12, trait: 'E_I', text: '周末如果没有人约我出去，我会感到很无聊。' },
    { id: 13, trait: 'E_I', text: '在做决定之前，我喜欢听取许多人的意见并进行讨论。' },
    { id: 14, trait: 'E_I', text: '当我和一大群人在一起时，我会觉得自己的能量被耗尽了。', invert: true },
    { id: 15, trait: 'E_I', text: '我很容易与刚认识的人建立起热络的连接。' },
    { id: 16, trait: 'E_I', text: '在陌生人面前，我能自如地表达自己，不会感到局促。' },
    { id: 17, trait: 'E_I', text: '在参加大型活动后，我常常需要一整天的时间来独处充电。', invert: true },
    { id: 18, trait: 'E_I', text: '我喜欢处于活跃、充满刺激的人际互动中心。' },
    { id: 19, trait: 'E_I', text: '在嘈杂的环境中，我更容易感到分心和疲惫。', invert: true },
    { id: 20, trait: 'E_I', text: '我通常是个充满热情且主动交往的人。' },

    // S_N
    { id: 21, trait: 'S_N', text: '在处理问题时，我更相信实际的经验和确凿的数据，而不是直觉。' },
    { id: 22, trait: 'S_N', text: '我经常会花很多时间思考宇宙的奥秘、人生的意义或未来的可能性。', invert: true },
    { id: 23, trait: 'S_N', text: '我更喜欢一步一步、有条理地完成任务，而不是随时跳跃着处理。' },
    { id: 24, trait: 'S_N', text: '我常常沉浸在自己的幻想和白日梦中，以至于忽略了周围发生的事情。', invert: true },
    { id: 25, trait: 'S_N', text: '相比于抽象的理论，我更喜欢能够立即应用到现实生活中的实用知识。' },
    { id: 26, trait: 'S_N', text: '当阅读一本书或看电影时，我更关注字面上的细节，而不是背后的隐喻。' },
    { id: 27, trait: 'S_N', text: '我很容易将看似不相关的事物联系起来，发现它们之间的隐藏模式。', invert: true },
    { id: 28, trait: 'S_N', text: '我擅长记住具体的日期、事件细节和人的相貌。' },
    { id: 29, trait: 'S_N', text: '如果某件事物运转良好，我就没有兴趣去探究它背后的复杂原理。' },
    { id: 30, trait: 'S_N', text: '我常常对“未来可能发生什么”比“现在正在发生什么”更感兴趣。', invert: true },
    { id: 31, trait: 'S_N', text: '我更倾向于遵循经过验证的传统方法，而不是尝试未经测试的新鲜事物。' },
    { id: 32, trait: 'S_N', text: '我喜欢用生动、具象的语言描述事物，而不是使用抽象的概念。' },
    { id: 33, trait: 'S_N', text: '在谈话中，我常常偏离主题，天马行空地聊到其他地方。', invert: true },
    { id: 34, trait: 'S_N', text: '我更看重事物的实用价值，而不是它的象征意义。' },
    { id: 35, trait: 'S_N', text: '我经常有预感或强烈的直觉，并且这些直觉往往是准确的。', invert: true },
    { id: 36, trait: 'S_N', text: '我更喜欢做具体、落地的工作，而不是策划宏观、长远的愿景。' },
    { id: 37, trait: 'S_N', text: '我经常被新奇、创新的想法所吸引，即使它们看起来不太切合实际。', invert: true },
    { id: 38, trait: 'S_N', text: '我非常关注周围物理环境的细节变化（如光线、布置等）。' },
    { id: 39, trait: 'S_N', text: '我更喜欢用隐喻和比喻来表达我的想法，而不是平铺直叙。', invert: true },
    { id: 40, trait: 'S_N', text: '我常常觉得纯粹的学术理论或哲学探讨非常迷人。', invert: true },

    // T_F
    { id: 41, trait: 'T_F', text: '在做决定时，逻辑和客观事实比个人情感或他人的感受更重要。' },
    { id: 42, trait: 'T_F', text: '当朋友遇到困难时，我通常首先提供情感上的安慰，而不是分析如何解决问题。', invert: true },
    { id: 43, trait: 'T_F', text: '如果某人的观点在逻辑上是错误的，即使会让他不高兴，我也倾向于指出。' },
    { id: 44, trait: 'T_F', text: '我很容易受到周围人情绪的感染。', invert: true },
    { id: 45, trait: 'T_F', text: '在辩论中，我认为赢得逻辑上的胜利比保持和气更重要。' },
    { id: 46, trait: 'T_F', text: '在评估一个项目是否成功时，我更看重客观的数据指标，而不是团队的感受。' },
    { id: 47, trait: 'T_F', text: '如果必须在“做一个正确但过于理性的人”和“做一个充满同情心但可能犯错的人”之间选择，我更倾向于后者。', invert: true },
    { id: 48, trait: 'T_F', text: '我通常能将个人的感情与工作或决策完全剥离开来。' },
    { id: 49, trait: 'T_F', text: '如果我的决定会让某些人受到伤害，我会感到非常内疚，甚至改变决定。', invert: true },
    { id: 50, trait: 'T_F', text: '我认为“公平和公正”比“仁慈和宽恕”更加重要。' },
    { id: 51, trait: 'T_F', text: '相比于被认为是一个“聪明、有逻辑”的人，我更希望被认为是一个“善良、温暖”的人。', invert: true },
    { id: 52, trait: 'T_F', text: '当别人情绪失控时，我依然能保持冷静和理性。' },
    { id: 53, trait: 'T_F', text: '为了避免发生冲突或伤害他人的感情，我有时会选择隐藏真实的自己。', invert: true },
    { id: 54, trait: 'T_F', text: '我认为那些让感情凌驾于理智之上的人是软弱或不专业的。' },
    { id: 55, trait: 'T_F', text: '在一段关系中，情感的共鸣和支持比智力上的匹配更让我看重。', invert: true },
    { id: 56, trait: 'T_F', text: '我擅长冷静分析问题的原因并找出逻辑上的因果关系。' },
    { id: 57, trait: 'T_F', text: '我很容易同情别人的遭遇，并倾向于站在他们的情感立场看问题。', invert: true },
    { id: 58, trait: 'T_F', text: '在面临道德选择时，我会严格遵循逻辑原则而非主观情感。' },
    { id: 59, trait: 'T_F', text: '我常常会被电影或书籍中的情感桥段感动得流泪。', invert: true },
    { id: 60, trait: 'T_F', text: '我觉得关怀和理解他人的精神世界比保持绝对的理性更重要。', invert: true },

    // J_P
    { id: 61, trait: 'J_P', text: '我喜欢提前规划好我的日程，而不是随性而为。' },
    { id: 62, trait: 'J_P', text: '在截止日期前，我常常拖延，习惯在最后一刻集中精力完成工作。', invert: true },
    { id: 63, trait: 'J_P', text: '我喜欢把工作区域整理得井井有条，因为混乱会让我感到焦虑。' },
    { id: 64, trait: 'J_P', text: '对于周末或假期，我更喜欢不安排具体计划，走到哪算哪。', invert: true },
    { id: 65, trait: 'J_P', text: '我通常会列出每日的待办事项清单，并享受将其划掉的成就感。' },
    { id: 66, trait: 'J_P', text: '比起完成任务带来的解脱感，我更享受探索新可能性的过程。', invert: true },
    { id: 67, trait: 'J_P', text: '做决定后，我不喜欢再去重新思考或推翻它。' },
    { id: 68, trait: 'J_P', text: '我喜欢保持选项开放，以便随时根据新情况调整计划。', invert: true },
    { id: 69, trait: 'J_P', text: '如果某人的迟到打乱了我的计划，我会感到非常恼火。' },
    { id: 70, trait: 'J_P', text: '我的工作方式常常是一阵一阵的爆发，而不是每天稳定、持续地输出。', invert: true },
    { id: 71, trait: 'J_P', text: '在开始一项任务之前，我必须先清楚地知道最终目标和具体步骤。' },
    { id: 72, trait: 'J_P', text: '我很容易在处理一件事的时候被另一件有趣的事分心。', invert: true },
    { id: 73, trait: 'J_P', text: '我认为“今日事今日毕”是生活中非常重要的准则。' },
    { id: 74, trait: 'J_P', text: '如果需要严格按照时间表行事，我会感到被束缚和压抑。', invert: true },
    { id: 75, trait: 'J_P', text: '在我看来，一个混乱或未完结的状态是难以忍受的，我需要及时的“闭环”。' },
    { id: 76, trait: 'J_P', text: '我通常会提前准备好所有需要的材料，绝不临场发挥。' },
    { id: 77, trait: 'J_P', text: '我更喜欢顺其自然、走一步看一步，不喜欢把未来的路线定死。', invert: true },
    { id: 78, trait: 'J_P', text: '按部就班地生活能让我感到安心和踏实。', invert: true },
    { id: 79, trait: 'J_P', text: '我经常在最后一刻改变主意，因为发现了更好的选择。', invert: true },
    { id: 80, trait: 'J_P', text: '按时完成工作并画上完美的句号对我来说至关重要。' }
  ]

  let MBTI_PROFILES = {
    INTJ: { name: '建筑师', en: 'Architect', desc: '富有想象力和战略性的思想家，一切皆在计划之中。', deep: '【核心人格解码】作为INTJ，你的主导功能是内倾直觉（Ni），辅助功能是外倾思考（Te）。这意味着你拥有极其罕见的“战略透视”能力——你能同时看到事物的本质与未来趋势，并迅速制定出最优路径。你的大脑像一台精密的国际象棋引擎，永远在推演后续的五步棋。这种能力让你在人群中既显得孤独又无比强大。\n\n【潜意识驱动力】你的第三功能内倾情感（Fi）和劣势功能外倾感觉（Se）揭示了你内心深处的秘密：你其实比任何人都渴望被理解，但你的高标准让你很难找到“配得上”与你交心的人。你的潜意识驱动力是“证明自己的愿景是正确的”，这让你在被质疑时格外痛苦。\n\n【职场天命指南】最佳赛道：战略咨询、人工智能、投资分析、建筑设计、科学研究。你天生适合需要长期独立深度思考的岗位，讨厌没有意义的社交和会议。你的赚钱天赋在于“看到别人看不到的趋势”——无论是投资、创业还是技术革新。理想工作环境：高自主权、结果导向、远离办公室政治。\n\n【高度契合对象图谱】最佳高度契合对象：ENFP（竞选者）和ENTP（辩论家）。ENFP能用温暖和热情融化你理性的外壳，而ENTP能在智力上与你旗鼓相当。你在关系中需要的是一个既尊重你独处空间、又能偶尔把你拉出思维迷宫的人。避开过度依赖型的伴侣——窒息感是你的关系杀手。\n\n【核心盲点与破解】你最大的盲区是“情感盲”——你容易把他人的情感需求视为“不理性”而忽略。破解方法：每天花5分钟问自己“今天身边的人感受如何”，刻意训练共情肌肉。\n\n【本月能量预测】本月你的Ni直觉将异常敏锐，可能会收到一个关于未来方向的重要灵感。建议在月中前将它落地为具体计划——否则它会和其他被搁置的想法一样消散。' },
    INTP: { name: '逻辑学家', en: 'Logician', desc: '具有创造力的发明家，对知识有着不可遏制的渴望。', deep: '【核心人格解码】作为INTP，你的主导功能内倾思考（Ti）赋予了你对逻辑一致性的极致追求。你的大脑就像一台永不休眠的超级计算机，时刻在分析、解构和重组接收到的信息。辅助功能外倾直觉（Ne）又给了你跳跃性的创造力——你能在看似毫无关联的概念之间找到隐秘的联系，这种能力让你在科学、哲学或编程领域往往能产生突破性的洞见。\n\n【潜意识驱动力】你的劣势功能外倾情感（Fe）揭示了一个秘密：你其实非常在意他人的看法，只是你用“我不在乎”来掩饰这种脆弱。你的潜意识驱动力是“寻找宇宙运行的终极逻辑”——这种对真理的执着既是你的天赋，也是让你在凌晨三点还在想问题的诅咒。\n\n【职场天命指南】最佳赛道：软件架构师、数据科学家、哲学教授、量化分析师、独立游戏开发者。你需要一个允许“探索性思考”的环境，讨厌僵化的流程和无意义的汇报。你的赚钱天赋在于“将复杂问题简化为优雅的解决方案”。警告：远离销售和行政类工作，那会慢慢杀死你的内心。\n\n【高度契合对象图谱】最佳高度契合对象：ENTJ（指挥官）和ENFJ（主人公）。ENTJ能帮你把脑海中的理论变为现实，ENFJ则能教会你如何与自己的情感和解。你需要一个既欣赏你的智慧、又不会因为你的心不在焉而受伤的伴侣。\n\n【核心盲点与破解】你最大的敌人是“分析瘫痪”——你会在脑海中构建了宏大的理论体系，却迟迟无法迈出第一步。破解方法：设定72小时行动法则——任何想法如果72小时内没有开始执行，就强制启动最小可行版本。\n\n【本月能量预测】本月适合深入钻研一个你长期感兴趣的课题。你的Ne功能将带来一次顿悟时刻，但请立刻记录下来——你的短期记忆远不如你的长期洞察力可靠。' },
    ENTJ: { name: '指挥官', en: 'Commander', desc: '大胆、富有想象力且意志强大的领导者，总能找到或创造解决方法。', deep: '【核心人格解码】作为ENTJ，你天生散发着掌控全局的王者气场。外倾思考（Te）作为你的主导功能，让你在面对复杂局面时能够迅速制定战略、分配资源并高效执行。辅助功能内倾直觉（Ni）又赋予你精准的预判力——你总能提前看到别人看不到的趋势。你是16型人格中最具领导力的类型，天生就是为了指挥千军万马而来。\n\n【潜意识驱动力】你的劣势功能内倾情感（Fi）是你内心深处最柔软的角落。你潜意识中最大的恐惧是失控和“被证明是无能的”。这驱使你不断追求更高的效率和更大的权力，但也让你在极端情况下变得专制和不近人情。理解这一点，是你走向成熟的关键。\n\n【职场天命指南】最佳赛道：CEO、创业者、投资银行家、管理咨询师、律师事务所合伙人。你天生适合站在权力的顶端做决策。你的赚钱天赋在于“整合资源、优化系统、创造规模效应”。忠告：不要只做管理者，要做愿景缔造者——前者让人服从，后者让人追随。\n\n【高度契合对象图谱】最佳高度契合对象：INFP（调停者）和INTP（逻辑学家）。INFP的温柔和理想主义能治愈你内心深处不愿示人的脆弱，INTP的智慧深度能让你在思想上找到真正的对手。你需要一个不被你的气场吓退、敢于挑战你的人。\n\n【核心盲点与破解】你最大的盲区是“把人当棋子”——你容易在追求目标时忽略团队成员的情感需求。破解方法：每周安排一次不谈工作的一对一沟通，真诚地问对方“你最近感觉怎么样”。\n\n【本月能量预测】本月你的Te效率将达到巅峰，是推进重大项目的黄金期。但宇宙也提醒你：在做出一个重要决定之前，花30分钟独处，听听你内心那个微弱但重要的Fi声音。' },
    ENTP: { name: '辩论家', en: 'Debater', desc: '聪明好奇的思想者，无法抗拒智力上的挑战。', deep: '【核心人格解码】作为ENTP，你是宇宙的“创意发电机”。外倾直觉（Ne）让你能轻易看到不同事物之间的隐秘联系和无限可能性，辅助功能内倾思考（Ti）则让你能对这些灵感进行严密的逻辑验证。你喜欢辩论，不是为了赢，而是为了在思想的碰撞中寻找真理的火花。你的大脑永远在产生新想法，速度之快连你自己都来不及消化。\n\n【潜意识驱动力】你的劣势功能内倾感觉（Si）暴露了你的深层恐惧：你害怕被困在一成不变的生活中，害怕重复和无聊比死亡更让你恐惧。这驱使你不断寻找新鲜感和刺激，但也让你很难在一件事上坚持到底。你潜意识中最渴望的其实是“被认真对待”——你希望别人看到你狂放不羁外表下真正的深度。\n\n【职场天命指南】最佳赛道：创业者、产品经理、风险投资人、编剧、辩护律师、脱口秀演员。你适合任何需要“从0到1”的创造性工作，但不适合“从1到100”的重复性执行。你的赚钱天赋在于“发现别人看不到的商业机会”。理想模式：同时运营2-3个有趣的项目，保持新鲜感。\n\n【高度契合对象图谱】最佳高度契合对象：INTJ（建筑师）和INFJ（提倡者）。INTJ能与你进行深层次的智力对弈并帮你把疯狂的想法落地，INFJ则能看穿你的伪装、触碰到你真实的内心。你需要一个既能跟上你思维速度、又能包容你永远在变的人。\n\n【核心盲点与破解】你最大的敌人是“三分钟热度”——你的Ne功能让你产生了100个好主意，但你可能一个都没执行到底。破解方法：选择你最兴奋的那一个，给自己设定90天挑战，不到90天不准放弃。\n\n【本月能量预测】本月你将遇到一个能激发你强烈好奇心的人或项目。这一次，尝试不要只停留在“纸上谈兵”阶段——宇宙正在测试你是否准备好从空想家进化为实干家。' },
    INFJ: { name: '提倡者', en: 'Advocate', desc: '安静而神秘，同时鼓舞人心且不知疲倦的理想主义者。', deep: '【核心人格解码】作为INFJ，你是16型人格中最稀有的类型。你拥有深邃的内倾直觉（Ni）和强烈的外倾情感（Fe），这让你成为了一面“人类情感的镜子”——你能够轻易感知他人深层的痛苦与渴望，甚至在对方开口之前就已经知道他们想说什么。你天生拥有一种想要治愈世界的使命感，你的存在本身就是一种安慰。\n\n【潜意识驱动力】你的劣势功能外倾感觉（Se）是你的阿喀琉斯之踵。你的潜意识驱动力是“找到自己存在的终极意义”——这种对意义的执着让你活得比大多数人都深刻，但也让你容易陷入存在主义焦虑。在压力下，你可能会突然从圣人模式切换到自我放纵模式，这是你的Se在绝望中的呐喊。\n\n【职场天命指南】最佳赛道：心理咨询师、作家、社会工作者、非营利组织创始人、UX设计师、人力资源总监。你的天赋在于“理解人性”——任何需要洞察人心的职业都是你的黄金赛道。你的赚钱方式不是靠竞争，而是靠创造深层价值。忠告：远离高压销售和缺乏人情味的企业文化，那会消耗你的内心。\n\n【高度契合对象图谱】最佳高度契合对象：ENTP（辩论家）和ENFP（竞选者）。ENTP能用智识的火花打开你封闭的内心世界，ENFP的乐观和热情则能把你从过度思考的深渊中拉出来。你需要一个既能给你深度、又不会让你感到窒息的人。\n\n【核心盲点与破解】你最大的盲区是“救世主情结”——你容易把所有人的痛苦都扛在自己肩上，直到你自己崩溃。破解方法：学会说不。设立一个“情感能量表”，当电量低于30%时，强制进入自我充电模式。\n\n【本月能量预测】本月你的直觉力将达到年度峰值。一个反复出现在你梦中或脑海中的画面，很可能是你的Ni在向你传递关于未来的重要信息。花时间用日记记录它。' },
    INFP: { name: '调停者', en: 'Mediator', desc: '诗意、善良、无私的人，总是致力于帮助正义的事业。', deep: '【核心人格解码】作为INFP，你的内心是一个充满诗意、童话与理想主义的绚丽宇宙。内倾情感（Fi）是你内心的核心引擎，你所有的人生选择都基于你强烈的个人价值观和对真善美的追求。辅助功能外倾直觉（Ne）则赋予你丰富的想象力——你能在平凡的事物中发现非凡的美好。你对他人的痛苦有着极强的共情能力，是这个喧嚣世界中稀缺的温暖。\n\n【潜意识驱动力】你的劣势功能外倾思考（Te）是你的隐秘伤口。你潜意识中最害怕的是“被这个功利的世界证明自己是无用的”。你渴望自己的理想能改变世界，但又常常觉得自己的力量太渺小。这种矛盾让你在现实的残酷面前选择退缩回内心的城堡——但请记住，退缩从来不会让痛苦消失。\n\n【职场天命指南】最佳赛道：作家、诗人、心理治疗师、插画师、独立音乐人、博物馆策展人、社会企业家。你不适合高压竞争和只看KPI的环境，你的天赋在于“将内心的感受转化为触动他人内心的作品”。赚钱建议：不要追逐高薪但无意义的工作，找到一份能让你的价值观和收入同时实现的事业。\n\n【高度契合对象图谱】最佳高度契合对象：ENTJ（指挥官）和ENFJ（主人公）。ENTJ能帮你把美好的理想落地为现实成果，ENFJ则能用行动力和热情感染你走出舒适区。你需要一个足够强大到能保护你、又足够温柔到能理解你的人。\n\n【核心盲点与破解】你最大的敌人是“逃避型完美主义”——你因为害怕做得不够好而选择不开始。破解方法：接受完成比完美更重要。今天就开始写/画/做那个你拖了很久的项目，哪怕只是5分钟。\n\n【本月能量预测】本月你的创造力将迎来一次爆发。一个长久以来萦绕在你心中的创作灵感正在成熟——如果你不把它表达出来，它会变成一种无形的焦虑。拿起笔，打开画板，让你的内心说话。' },
    ENFJ: { name: '主人公', en: 'Protagonist', desc: '富有魅力、鼓舞人心的领导者，有使听众着迷的能力。', deep: '【核心人格解码】作为ENFJ，你是天生的“内心引路人”。外倾情感（Fe）让你在人群中如鱼得水，你总能敏锐地察觉到团队中每个人的情绪温度，并用你的热情和愿景将大家凝聚在一起。辅助功能内倾直觉（Ni）又赋予了你对人性深层动机的洞察力——你不仅能读懂别人的情绪，还能读懂他们连自己都没意识到的需求。\n\n【潜意识驱动力】你的劣势功能内倾思考（Ti）揭示了你最隐秘的恐惧：你害怕被孤立、不被需要。你的潜意识驱动力是“通过帮助他人来证明自己的价值”——当你不被感谢或认可时，你内心深处会产生强烈的挫败感。你需要学会区分真正的关爱和为了被需要而付出。\n\n【职场天命指南】最佳赛道：人力资源总监、教育培训师、公益组织负责人、品牌营销总监、政治家、心理咨询师。你的天赋在于“激励他人发挥最大潜力”。你的领导力不是靠权威，而是靠人格魅力和使命感。赚钱方式：建立一个你真心信仰的事业，让你的热情感染每一个利益相关者。\n\n【高度契合对象图谱】最佳高度契合对象：INFP（调停者）和INTP（逻辑学家）。INFP能与你分享同样深度的情感世界，INTP则能用冷静的逻辑帮你在情感泛滥时恢复理智。你需要一个愿意接受你的照顾、但也会反过来照顾你的人。\n\n【核心盲点与破解】你最大的盲区是“过度干涉”——你对他人的关心有时会越界，变成一种无形的控制。破解方法：在想给别人建议之前，先问一句“你需要我的建议，还是只需要我倾听？”\n\n【本月能量预测】本月你的社交影响力将显著提升。一个重要的人际关系将出现转机——可能是修复一段裂痕，也可能是建立一个改变你人生轨迹的新连接。主动出击。' },
    ENFP: { name: '竞选者', en: 'Campaigner', desc: '热情、有创造力、爱交际的自由内心，总能找到微笑的理由。', deep: '【核心人格解码】作为ENFP，你就像一阵充满生命力的微风。外倾直觉（Ne）让你对世界充满了无尽的好奇和可能性思维，辅助功能内倾情感（Fi）则赋予你极其真诚的价值观——你不是肤浅的社交蝴蝶，你的热情背后是对人类真善美的深层信仰。你的感染力极其强大，能够轻易点燃他人心中熄灭已久的希望之火。\n\n【潜意识驱动力】你的劣势功能内倾感觉（Si）揭示了你的深层恐惧：你害怕被困在日复一日的单调中，害怕自由被剥夺。你潜意识中最渴望的是“活出一个有意义且不被定义的人生”。这驱使你不断尝试新事物，但也让你在需要稳定和坚持的时刻感到焦虑和自我怀疑。\n\n【职场天命指南】最佳赛道：品牌策划、社交媒体运营、旅行博主、创意导演、心理戏剧治疗师、初创企业联合创始人。你天生适合需要“想象力+人际连接”的角色。你的赚钱天赋在于“用故事和情感打动人心”。忠告：找一个靠谱的ISTJ或ESTJ搭档来帮你处理财务和行政——你的才华不应该被Excel表格困住。\n\n【高度契合对象图谱】最佳高度契合对象：INTJ（建筑师）和INFJ（提倡者）。INTJ的深度和战略眼光能成为你最坚实的锚，INFJ则能与你在内心层面产生罕见的共振。你需要一个既能欣赏你的多变、又能给你安全感的人。\n\n【核心盲点与破解】你最大的敌人是“选择困难和半途而废”——太多的可能性让你难以做出承诺。破解方法：给自己一个“人生主线任务”，无论途中遇到多少有趣的支线，永远不要放弃那条主线。\n\n【本月能量预测】本月你的社交磁场将异常强大，可能会遇到一个与你内心频率极其契合的人。但宇宙提醒你：不要急着做出承诺，先花时间验证这份连接的深度——是真正的共振，还是只是新鲜感。' },
    ISTJ: { name: '物流师', en: 'Logistician', desc: '实际且注重事实的人，可靠性不容怀疑。', deep: '【核心人格解码】作为ISTJ，你是社会的“定海神针”。内倾感觉（Si）作为你的主导功能，让你高度尊重传统、规则和过往的经验。辅助功能外倾思考（Te）又赋予你极强的执行力和条理性。你务实、严谨、极其可靠——如果世界上只剩下一种你可以信赖的人格类型，那一定是ISTJ。你是诺言的守护者，秩序的捍卫者。\n\n【潜意识驱动力】你的劣势功能外倾直觉（Ne）揭示了你深层的恐惧：你害怕混乱、不确定性和失控。你的潜意识驱动力是“建立一个绝对可靠、不会崩塌的世界”。这让你在危机中成为最值得信赖的人，但也让你在面对需要创新和冒险的情境时显得保守甚至固执。\n\n【职场天命指南】最佳赛道：审计师、法官、军事指挥官、外科医生、数据库管理员、品质控制经理。你天生适合需要“零错误”的高精度工作。你的赚钱天赋在于“用纪律和坚持积累长期复利”——你可能不会一夜暴富，但你的财富增长曲线是最稳定的。理想环境：明确的职责边界、清晰的晋升路径。\n\n【高度契合对象图谱】最佳高度契合对象：ESFP（表演者）和ESTP（企业家）。ESFP的活力和幽默能为你严谨的生活注入色彩，ESTP的冒险精神则能帮你偶尔跳出舒适区。你需要一个能让你放松下来的人，而不是另一个和你一样严肃的人。\n\n【核心盲点与破解】你最大的盲区是“过度依赖经验”——当世界发生范式转移时，过去的经验可能会变成陷阱。破解方法：每月强制自己尝试一件你从未做过的事情，训练你的适应力。\n\n【本月能量预测】本月适合整理和优化你的长期资产（财务、技能、人脉）。你的Si功能将帮你发现一个被忽视的细节，它可能为你省下一大笔钱或避免一个重大风险。' },
    ISFJ: { name: '守卫者', en: 'Defender', desc: '非常专注且温暖的保护者，随时准备保护他们爱的人。', deep: '【核心人格解码】作为ISFJ，你的内心散发着一种安静而持久的温暖。内倾感觉（Si）让你拥有极其精细的记忆力——你能记住每一个重要的人的生日、喜好甚至无意间提到过的愿望。外倾情感（Fe）则让你天生懂得如何让身边的人感到被呵护和珍视。你是家庭和团队中最坚实的后盾，是在混乱中默默守护一切的无名英雄。\n\n【潜意识驱动力】你的劣势功能外倾直觉（Ne）暴露了你内心最深的恐惧：你害怕变化、失去和被抛弃。你的潜意识驱动力是“通过无条件的付出来确保自己被需要”——但这种模式的危险在于，你可能会在付出中完全失去自我，直到某一天突然情绪崩溃。\n\n【职场天命指南】最佳赛道：护士、幼教老师、图书管理员、行政总管、家庭医生、社工、室内设计师。你的天赋在于“用细致入微的关怀创造安全感”。你不适合高对抗性的竞争环境，但在任何需要耐心和细心的岗位上，你都是无可替代的。赚钱建议：不要低估你的价值，学会为你的付出标价。\n\n【高度契合对象图谱】最佳高度契合对象：ESTP（企业家）和ESFP（表演者）。ESTP的果断和冒险精神能帮你打破过度保守的模式，ESFP的快乐感染力则能让你学会享受当下。你需要一个愿意主动表达感恩、让你感到被看见的人。\n\n【核心盲点与破解】你最大的盲区是“委屈型付出”——你默默做了所有的事却不表达需求，直到积怨爆发。破解方法：养成“即时表达”的习惯——每当你觉得委屈时，在24小时内温和但明确地说出来。\n\n【本月能量预测】本月是时候为自己做一件纯粹取悦自己的事了。你的Fe功能一直在为他人服务——宇宙建议你这个月花一整天的时间，只做你自己想做的事。不需要理由，不需要向任何人解释。' },
    ESTJ: { name: '总经理', en: 'Executive', desc: '出色的管理者，在管理事物或人的方面无与伦比。', deep: '【核心人格解码】作为ESTJ，你是天生的“秩序建立者”。外倾思考（Te）让你在任何混乱的环境中都能迅速理清头绪，制定出高效的标准操作流程。辅助功能内倾感觉（Si）又赋予你对规则和传统的深度尊重——你相信经过时间验证的方法论就是最好的方法论。你为人正直、讲求效率，是推动社会高效运转的核心支柱。\n\n【潜意识驱动力】你的劣势功能内倾情感（Fi）是你铠甲上唯一的缝隙。你的潜意识驱动力是“被尊重和认可为有能力的人”。当你的权威被挑战或你的付出没有得到应有的尊重时，你会感到深深的愤怒——但你很少承认这份愤怒背后其实是受伤。\n\n【职场天命指南】最佳赛道：运营总监、项目经理、银行经理、军事将领、学校校长、供应链管理。你天生适合需要“建立系统和维护秩序”的岗位。你的赚钱天赋在于“用流程和规范创造规模化效益”。你是最擅长把混乱变成有序的人，这在任何行业都价值连城。\n\n【高度契合对象图谱】最佳高度契合对象：ISFP（探险家）和INFP（调停者）。ISFP的艺术感和随性能为你严谨的生活增添色彩，INFP的深度情感世界则能帮你打开自己尘封已久的内心。你需要一个能让你卸下坚强外壳的人。\n\n【核心盲点与破解】你最大的盲区是“规则至上主义”——你可能会因为过度追求效率而伤害到不同节奏的人。破解方法：在要求别人遵守规则之前，先问自己“这个规则的目的是什么？有没有更好的方式？”\n\n【本月能量预测】本月你的组织能力将被委以重任。一个需要你来收拾残局或搭建框架的机会即将出现——这是你发光的时刻。但记得在忙碌中留出时间给家人，他们是你最大的动力来源。' },
    ESFJ: { name: '执政官', en: 'Consul', desc: '极有同情心、爱交际、受欢迎的人，总是热心提供帮助。', deep: '【核心人格解码】作为ESFJ，你是连接人与人之间的“超级黏合剂”。外倾情感（Fe）作为你的主导功能，让你在社交场合中游刃有余——你天生就知道如何让身边的每一个人感到舒适和被重视。辅助功能内倾感觉（Si）则让你极度重视传统、家庭仪式和人际关系中的承诺。你是社群中的太阳，每个人都感受到你温暖的光芒。\n\n【潜意识驱动力】你的劣势功能内倾思考（Ti）揭示了你最脆弱的一面：你的自我价值感很大程度上建立在他人的评价和反馈之上。你的潜意识驱动力是“被喜欢和被需要”。当你感受到被孤立、被拒绝或你的付出没有得到认可时，你会陷入深深的自我怀疑——是不是我做得不够好？\n\n【职场天命指南】最佳赛道：活动策划师、公关经理、护理主管、社区运营、客户关系总监、婚礼策划师。你的天赋在于“创造温暖且有组织的社交体验”。你的赚钱方式应该围绕“服务人、连接人、温暖人”展开。忠告：不要委屈自己去做冷冰冰的数据分析或独自面对电脑的工作——你的能量来自于与人的互动。\n\n【高度契合对象图谱】最佳高度契合对象：ISTP（鉴赏家）和ISFP（探险家）。ISTP的冷静和独立能让你在情绪泛滥时恢复冷静，ISFP的温柔和艺术感则能与你的审美产生美丽的共振。你需要一个不只是接受你的照顾、还会反过来默默守护你的人。\n\n【核心盲点与破解】你最大的盲区是“为了和谐而压抑真实感受”——你可能会为了不让别人不开心而委屈自己，最终积累成怨恨。破解方法：练习温和的坦诚——用“我感觉...”开头的句式表达自己的真实需求。\n\n【本月能量预测】本月你在某个社交场合将成为绝对的焦点人物。你的Fe磁场将吸引一个重要的人走向你——无论是事业上的贵人还是情感上的知音。保持你最真实的样子，不要刻意讨好。' },
    ISTP: { name: '鉴赏家', en: 'Virtuoso', desc: '大胆实际的实验者，掌握所有工具的使用。', deep: '【核心人格解码】作为ISTP，你是一个“行动派的分析师”。内倾思考（Ti）赋予你极其精密的内部逻辑引擎，外倾感觉（Se）则让你拥有惊人的动手能力和对物理世界的直觉。你喜欢拆解事物——了解它们是如何运作的，然后用更好的方式把它们组装起来。你对空洞的理论不感兴趣，你只关心一个问题：“这东西在现实中管用吗？”\n\n【潜意识驱动力】你的劣势功能外倾情感（Fe）是你最不擅长面对的领域。你的潜意识驱动力是“保持绝对的自主权和行动自由”。你随性、独立，像一匹孤狼——任何试图控制你的行为都会触发你最强烈的抵抗。但你很少承认的是：你的这种冷峻和难以捉摸，其实是因为你害怕深层情感连接带来的脆弱感。\n\n【职场天命指南】最佳赛道：工程师、飞行员、外科医生、汽车技师、特种兵、极限运动教练、法医鉴定师。你天生适合需要“冷静判断+精准操作”的高压环境。你的赚钱天赋在于“用一双巧手解决别人解决不了的问题”。忠告：你可以不上班，但你不能没有事做——找到一个让你手和大脑同时兴奋的事业。\n\n【高度契合对象图谱】最佳高度契合对象：ESFJ（执政官）和ENFJ（主人公）。ESFJ的温暖和稳定能给你一个安全的港湾，ENFJ则能用情感智慧帮你打开你紧闭的心门。你需要一个不会强迫你表达感情、但会在你准备好时耐心等待的人。\n\n【核心盲点与破解】你最大的盲区是“情感逃避”——当关系中出现需要深入沟通的问题时，你的第一反应是离开而不是面对。破解方法：下次想逃的时候，强制自己留下5分钟。你会发现，脆弱并没有你想象中那么可怕。\n\n【本月能量预测】本月你的Se功能将把你引向一次令人兴奋的动手体验——可能是学一项新技能、修理一个复杂装置、或尝试一项极限运动。跟随你身体的直觉，它比你的理性更知道你需要什么。' },
    ISFP: { name: '探险家', en: 'Adventurer', desc: '灵活有魅力的艺术家，时刻准备探索和体验新事物。', deep: '【核心人格解码】作为ISFP，你的内心就是一件行走的艺术品。内倾情感（Fi）让你拥有极其丰富且敏感的内心世界——你的情感深度远超外表所展现的那份安静。外倾感觉（Se）则让你对当下的美学体验有着极致的追求：你对颜色、光影、音乐、食物的感知力，是大多数人难以企及的。你可能不善言辞，但你擅长通过艺术、穿搭或生活方式来表达真实的自我。\n\n【潜意识驱动力】你的劣势功能外倾直觉（Ne）暗示了你的深层恐惧：你害怕失去个人身份认同，害怕被迫成为别人期待的样子。你的潜意识驱动力是“活出最真实的自我”——这让你极度排斥虚伪和做作。但当现实世界要求你妥协时，你会陷入内心的挣扎和沉默的反抗。\n\n【职场天命指南】最佳赛道：摄影师、时尚设计师、花艺师、纹身师、音乐制作人、自然保护工作者、瑜伽教练。你适合任何能让你“用感官创造美”的工作。你的赚钱天赋在于“将个人审美变现为独特的产品或体验”。忠告：不要把自己塞进格子间——你的创造力需要自由呼吸的空间。\n\n【高度契合对象图谱】最佳高度契合对象：ESTJ（总经理）和ENTJ（指挥官）。ESTJ的务实和条理能帮你在现实世界中站稳脚跟，ENTJ的远见和执行力则能帮你把艺术梦想变为事业版图。你需要一个欣赏你的独特、同时能给你实际支持的人。\n\n【核心盲点与破解】你最大的盲区是“逃避规划”——你太沉浸于当下的美好而忽略了未来的准备。破解方法：每月花一个小时做一次简单的未来规划——不需要详细到每一天，只需要一个大方向就好。\n\n【本月能量预测】本月你的审美直觉将异常敏锐。一个与美有关的机会正在向你靠近——可能是一个创作灵感、一次旅行、或一段让你心动的邂逅。放下手机，用你的五感去感受这个世界。' },
    ESTP: { name: '企业家', en: 'Entrepreneur', desc: '聪明、精力充沛、非常敏锐的人，真正享受生活在边缘。', deep: '【核心人格解码】作为ESTP，你是一个“活在当下、寻求刺激”的冒险家。外倾感觉（Se）作为你的主导功能，让你对周围环境有着惊人的感知力和反应速度——你总能在千钧一发之际做出正确的判断。辅助功能内倾思考（Ti）则赋予了你冷静的分析能力。你不靠理论，靠实战；你不靠计划，靠直觉。你是派对上的焦点，也是危机中最冷静的那个人。\n\n【潜意识驱动力】你的劣势功能内倾直觉（Ni）暴露了你最不愿面对的恐惧：你害怕错过当下的精彩，害怕静下来面对内心深处那些关于人生意义的问题。你的潜意识驱动力是“通过征服外部世界来证明自己的价值”。你喜欢成为赢家——无论是在商场、赌场还是感情场。\n\n【职场天命指南】最佳赛道：销售总监、股票交易员、消防员、急诊医生、运动员、谈判专家、房地产经纪人。你天生适合高风险高回报、需要快速决策的环境。你的赚钱天赋在于“在别人犹豫时果断出手”。忠告：赚到的钱要学会存和投资——你的Se功能会诱惑你把钱花在即时享受上。\n\n【高度契合对象图谱】最佳高度契合对象：ISFJ（守卫者）和ISTJ（物流师）。ISFJ的稳定和温暖能给你一个值得回归的家，ISTJ的纪律性则能帮你把短期的爆发力转化为长期的积累。你需要一个不会限制你自由、但会在你飞得太高时轻轻拉住你的人。\n\n【核心盲点与破解】你最大的敌人是“即时满足依赖症”——你追求短期刺激而忽略长期建设。破解方法：为自己设定一个需要至少1年才能达成的大目标，并每月检查进度。学会享受延迟满足带来的更深层成就感。\n\n【本月能量预测】本月你的行动力和好运气将形成罕见的共振——一个让你心跳加速的机会即将出现。这一次不要只是享受刺激的过程，更要思考如何把这次胜利转化为长期的资源和积累。' },
    ESFP: { name: '表演者', en: 'Entertainer', desc: '自发、精力充沛、热情的艺人，生活在他们周围永不无聊。', deep: '【核心人格解码】作为ESFP，你是天生的“舞台中心”和“快乐制造机”。你拥有极强的外倾感觉（Se）和内倾情感（Fi），这让你不仅懂得如何全身心享受每一个当下，更懂得如何让身边的所有人都感受到快乐。你的热情、幽默和感染力，能瞬间点亮任何一个沉闷的房间——你走到哪里，派对就跟到哪里。\n\n【潜意识驱动力】你的劣势功能内倾直觉（Ni）是你内心深处不愿触碰的角落。你的潜意识驱动力是“永远活在快乐中，远离一切痛苦”。你害怕安静、害怕独处、害怕面对内心深处那些关于人生意义和死亡的沉重问题。你用欢笑和热闹来填满那些可能让你感到空虚的缝隙——但你知道，这不是长久之计。\n\n【职场天命指南】最佳赛道：演员、主持人、导游、时尚博主、活动策划、调酒师、健身教练、儿童教育。你天生适合任何“站在舞台上”的工作。你的赚钱天赋在于“用个人魅力和感染力创造商业价值”。忠告：你的天赋是稀缺的，不要低估它的商业价值——学会给你的快乐和创意标价。\n\n【高度契合对象图谱】最佳高度契合对象：ISTJ（物流师）和ISFJ（守卫者）。ISTJ的沉稳和可靠能为你提供一个安全的基地，ISFJ的体贴和细腻则能让你在疲惫时被温柔地接住。你需要一个能欣赏你的光芒、但也能在你卸下面具后依然爱你的人。\n\n【核心盲点与破解】你最大的盲区是“用快乐逃避痛苦”——当生活给你出难题时，你的第一反应是转移注意力而不是正面应对。破解方法：每周给自己一个小时的安静独处时间——关掉手机，面对自己的内心。你会发现，黑暗并没有你想象的那么可怕。\n\n【本月能量预测】本月你将成为某个重要场合的内心人物。你的Se魅力将吸引一个重要的贵人——但宇宙提醒你，在展示你闪闪发光的一面的同时，也试着展露一些真实的脆弱。真正的连接，来自于真实，而不仅仅是快乐。' }
  }

  // ─── MBTI TEST PAGE ───────────────────────────────────────
  const MBTITest = defineComponent({
    name: 'MBTITestPage',
    setup() {
      const router = useRouter()
      const currentQuestionIndex = ref(0)
      const answers = reactive({})
      const isCompleting = ref(false)
      const isTransitioning = ref(false)
      const currentQ = computed(() => MBTI_QUESTIONS[currentQuestionIndex.value])

      const answeredCount = computed(() => Object.keys(answers).length)
      const progress = computed(() => {
        return Math.min(100, (answeredCount.value / MBTI_QUESTIONS.length) * 100)
      })

      const selectAnswer = (qId, value) => {
        if (isTransitioning.value) return
        answers[qId] = value
        AudioSynth.playHover()
        
        // Auto advance to next question
        if (currentQuestionIndex.value < MBTI_QUESTIONS.length - 1) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value++
            isTransitioning.value = false
          }, 300)
        }
      }

      const prevQuestion = () => {
        if (currentQuestionIndex.value > 0 && !isTransitioning.value) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value--
            isTransitioning.value = false
          }, 300)
        }
      }

      const finishTest = () => {
        isCompleting.value = true
        
        // Calculate scores
        let scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
        
        MBTI_QUESTIONS.forEach(q => {
          let score = answers[q.id] || 0
          if (q.invert) score = score * -1
          
          if (q.trait === 'E_I') {
            if (score > 0) scores.E += score; else scores.I += Math.abs(score)
          } else if (q.trait === 'S_N') {
            if (score > 0) scores.S += score; else scores.N += Math.abs(score)
          } else if (q.trait === 'T_F') {
            if (score > 0) scores.T += score; else scores.F += Math.abs(score)
          } else if (q.trait === 'J_P') {
            if (score > 0) scores.J += score; else scores.P += Math.abs(score)
          }
        })

        // Add base values to avoid 0
        Object.keys(scores).forEach(k => scores[k] += 1)

        const type = 
          (scores.E >= scores.I ? 'E' : 'I') +
          (scores.S >= scores.N ? 'S' : 'N') +
          (scores.T >= scores.F ? 'T' : 'F') +
          (scores.J >= scores.P ? 'J' : 'P')
          
        const percentages = {
          E_I: Math.round((scores.E / (scores.E + scores.I)) * 100),
          S_N: Math.round((scores.S / (scores.S + scores.N)) * 100),
          T_F: Math.round((scores.T / (scores.T + scores.F)) * 100),
          J_P: Math.round((scores.J / (scores.J + scores.P)) * 100)
        }

        store.mbtiResult = { type, percentages }
        
        setTimeout(() => {
          router.push('/mbti-result')
        }, 1000)
      }

      return {
        MBTI_QUESTIONS, currentQuestionIndex, answers, progress, isCompleting, answeredCount, currentQ,
        selectAnswer, prevQuestion, finishTest
      }
    },
    template: `
      <main class="mbti-test section">
        <div class="test-header" v-reveal>
          <p class="section-kicker">人格测评</p>
          <h2>MBTI 性格测试</h2>
          <p class="lede">请凭直觉回答以下 {{ MBTI_QUESTIONS.length }} 个问题，探索你最深层的内心密码。</p>
        </div>

        <div class="mbti-progress-container" v-reveal>
          <div class="mbti-progress-bar">
            <div class="mbti-progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="mbti-progress-text">已完成 {{ answeredCount }} / {{ MBTI_QUESTIONS.length }}</div>
        </div>

        <div class="questions-list">
          <transition name="slide-up" mode="out-in">
            <div
              :key="'q-' + currentQ.id"
              class="question-card active"
            >
              <p class="question-text">{{ currentQ.id }}. {{ currentQ.text }}</p>
              <div class="scale-options">
                <div class="scale-btn agree size-1" :class="{ selected: answers[currentQ.id] === 3 }" @click="selectAnswer(currentQ.id, 3)"></div>
                <div class="scale-btn agree size-2" :class="{ selected: answers[currentQ.id] === 2 }" @click="selectAnswer(currentQ.id, 2)"></div>
                <div class="scale-btn agree size-3" :class="{ selected: answers[currentQ.id] === 1 }" @click="selectAnswer(currentQ.id, 1)"></div>
                <div class="scale-btn neutral size-3" :class="{ selected: answers[currentQ.id] === 0 }" @click="selectAnswer(currentQ.id, 0)"></div>
                <div class="scale-btn disagree size-3" :class="{ selected: answers[currentQ.id] === -1 }" @click="selectAnswer(currentQ.id, -1)"></div>
                <div class="scale-btn disagree size-2" :class="{ selected: answers[currentQ.id] === -2 }" @click="selectAnswer(currentQ.id, -2)"></div>
                <div class="scale-btn disagree size-1" :class="{ selected: answers[currentQ.id] === -3 }" @click="selectAnswer(currentQ.id, -3)"></div>
              </div>
              <div class="scale-labels">
                <span class="label-agree">完全同意</span>
                <span class="label-disagree">完全反对</span>
              </div>
              <div class="back-btn-container" style="text-align: center; margin-top: 30px; height: 40px;">
                 <button v-if="currentQuestionIndex > 0" class="secondary-action" @click="prevQuestion" :disabled="isTransitioning" style="font-size: 14px; padding: 8px 16px; min-width: 120px; border: none; background: transparent; color: #888; text-decoration: underline;">⬅ 返回上一题</button>
              </div>
            </div>
          </transition>
        </div>

        <div class="action-area" v-if="answeredCount === MBTI_QUESTIONS.length" style="margin-top: 40px;">
          <button class="primary-action" @click="finishTest" :disabled="isCompleting">
            {{ isCompleting ? '正在解析内心密码...' : '✧ 生成我的性格报告' }}
          </button>
        </div>
      </main>
    `
  })

  // ─── MBTI RESULT PAGE ─────────────────────────────────────
  const MBTIResult = defineComponent({
    name: 'MBTIResultPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const showPayment = ref(false)
      const orderId = ref(null)
      const hasPaid = ref(isTestUnlocked('mbti'))
      const displayedDeepText = ref('')
      const isTyping = ref(false)

      if (!store.mbtiResult) {
        const draft = loadResultDraft('mbti')
        if (draft && draft.type && draft.percentages) store.mbtiResult = draft
      }

      if (!store.mbtiResult) {
        router.push('/mbti')
        return { showPayment, hasPaid, typeData: ref({ type: '', name: '', en: '', desc: '', deep: '' }), p: ref({ E_I:0, S_N:0, T_F:0, J_P:0 }), displayedDeepText, isTyping, handlePaymentSuccess: () => {}, generatePoster: () => {}, restartTest: () => {} }
      }

      const { type, percentages } = store.mbtiResult
      const typeData = ref({ type, ...MBTI_PROFILES[type] })
      const p = ref(percentages)

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        unlockPlan(plan && plan.id, 'mbti')
        setStoredTestOrderId('mbti', plan && plan.orderId)
        hasPaid.value = true
        
        const intro = `正在整理【${typeData.value.type} ${typeData.value.name}】的完整解读...\n\n`
        const body = typeData.value.deep
        
        saveToArchive('MBTI', typeData.value.type + ' 人格完整解读', body)
        const fullText = await generatePaidAIReport({
          testType: 'mbti',
          orderId: plan && plan.orderId,
          resultSummary: `${typeData.value.type} ${typeData.value.name}，E/I ${p.value.E_I}/${100 - p.value.E_I}，S/N ${p.value.S_N}/${100 - p.value.S_N}，T/F ${p.value.T_F}/${100 - p.value.T_F}，J/P ${p.value.J_P}/${100 - p.value.J_P}`,
          baseDeepReport: intro + body,
          userInputs: { type: typeData.value.type, percentages: p.value },
          context: { profile: typeData.value }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('mbti') })
        }, 0)
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('mbti-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_MBTI_${typeData.value.type}.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const restartTest = () => {
        clearResultDraft('mbti')
        clearAIReportCache('mbti')
        store.mbtiResult = null
        router.push('/mbti')
      }

      onMounted(() => {
        window.__northstarFx?.setPattern('text', typeData.value.type)
        store.isPatternActive = true
      })
      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
        store.isPatternActive = false
        store.isImmersive = false
      })

      return {
        showPayment, hasPaid, typeData, p, displayedDeepText, isTyping,
        handlePaymentSuccess, generatePoster, restartTest, skipTypewriter
      }
    },
    template: `
      <main class="result-page section">
        <div v-reveal>
          <p class="section-kicker">人格类型</p>
          <div class="mbti-type-title">
            <h2>{{ typeData.type }}</h2>
            <p>{{ typeData.name }}</p>
          </div>
        </div>

        <div class="reading-section" v-reveal style="transition-delay: 0.1s">
          <h3>✦ 核心倾向剖析</h3>
          <p style="margin-bottom: 30px; text-align: center; color: var(--text-muted);">{{ typeData.desc }}</p>
          
          <div class="trait-container">
            <div class="trait-header"><span>外倾 (E) {{ p.E_I }}%</span><span>{{ 100 - p.E_I }}% 内倾 (I)</span></div>
            <div class="trait-bar-bg"><div class="trait-bar-fill" :style="{ width: p.E_I + '%' }"></div></div>
          </div>
          <div class="trait-container">
            <div class="trait-header"><span>感觉 (S) {{ p.S_N }}%</span><span>{{ 100 - p.S_N }}% 直觉 (N)</span></div>
            <div class="trait-bar-bg"><div class="trait-bar-fill" :style="{ width: p.S_N + '%' }"></div></div>
          </div>
          <div class="trait-container">
            <div class="trait-header"><span>思考 (T) {{ p.T_F }}%</span><span>{{ 100 - p.T_F }}% 情感 (F)</span></div>
            <div class="trait-bar-bg"><div class="trait-bar-fill" :style="{ width: p.T_F + '%' }"></div></div>
          </div>
          <div class="trait-container">
            <div class="trait-header"><span>判断 (J) {{ p.J_P }}%</span><span>{{ 100 - p.J_P }}% 感知 (P)</span></div>
            <div class="trait-bar-bg"><div class="trait-bar-fill" :style="{ width: p.J_P + '%' }"></div></div>
          </div>
        </div>

        <div class="deep-result-container" v-reveal style="transition-delay: 0.2s">
          <div class="paywall-overlay" v-if="!hasPaid">
            <div class="paywall-content">
              <h3>✦ 查看完整人格解读</h3>
              <p>包含你的性格重点、容易卡住的地方、适合的工作方式和关系相处提醒。</p>
              <div class="price">上线价 USD $7.99</div>
              <div class="price-all" style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; margin-bottom: 8px;">全站终身解锁 (All-Access Pass): USD $39.99</div>
              <p class="price-hint">支付开放后可查看完整解读，并附上本次结果补充</p>
              <button class="primary-action pay-btn" @click="showPayment = true">查看上线方案</button>
            </div>
          </div>

          <div class="deep-content" :class="{ 'is-blurred': !hasPaid }" v-if="!hasPaid">
            <h3>✦ 完整人格说明</h3>
            <div class="reading-block deep-block">
              <p class="reading-text deep-text">{{ typeData.deep }}</p>
            </div>
          </div>
          
          <div class="deep-content ai-mode" v-if="hasPaid">
            <professional-report
              :text="displayedDeepText"
              :is-typing="isTyping"
              title="MBTI 专业人格报告"
              :result-label="typeData.type + ' · ' + typeData.name"
              @skip="skipTypewriter"
            />
          </div>
        </div>

        <div class="result-actions" v-reveal style="transition-delay: 0.3s">
          <button class="primary-action" @click="generatePoster" v-if="hasPaid && !isTyping">
            ✧ 保存专属人格海报
          </button>
          <button class="secondary-action" @click="restartTest">重新测试</button>
          <router-link class="secondary-action" to="/">返回首页</router-link>
        </div>

        <!-- Hidden Poster DOM -->
        <div id="mbti-poster-dom" class="poster-container" v-if="hasPaid">
          <div class="poster-header">
            <div class="poster-brand">✧ 北极星 · MBTI人格 ✧</div>
            <div class="poster-title">内心切片·人格原理解析</div>
          </div>
          
          <div class="mbti-type-title" style="margin-top: 30px; margin-bottom: 20px;">
            <h2 style="font-size:64px; color:var(--blue); margin-bottom:5px;">{{ typeData.type }}</h2>
            <p style="font-size:24px; color:#fff;">{{ typeData.name }}</p>
          </div>
          
          <div class="poster-reading">
            <div class="poster-reading-title">✧ 专属高阶说明书 ✧</div>
            <div class="poster-reading-text">{{ displayedDeepText }}</div>
          </div>
          
          <div class="poster-footer">
            <div class="poster-footer-text">
              本报告由 Northstar 独家生成<br>
              探索潜意识，预见未知的自我
            </div>
            <div class="poster-qr">
              扫码<br>开启<br>你的旅程
            </div>
          </div>
        </div>

        <PaymentModal
          v-if="showPayment"
          @close="showPayment = false"
          @success="handlePaymentSuccess"
        />
      </main>
    `
  })


  // ─── ATTACHMENT DATABASE ──────────────────────────────────────────
  const ATTACHMENT_QUESTIONS = [
    { id: 1, trait: 'avoidance', text: '我不愿意告诉伴侣我内心深处的感受。' },
    { id: 2, trait: 'anxiety', text: '我常常担心伴侣不再爱我了。' },
    { id: 3, trait: 'avoidance', text: '我发现自己很容易与伴侣亲近。', invert: true },
    { id: 4, trait: 'anxiety', text: '我极其渴望与伴侣融为一体，但这有时会把他们吓跑。' },
    { id: 5, trait: 'avoidance', text: '当伴侣想要与我建立非常亲密的关系时，我会感到不自在。' },
    { id: 6, trait: 'anxiety', text: '我时常害怕自己会被抛弃。' },
    { id: 7, trait: 'avoidance', text: '当伴侣过于靠近我时，我往往会本能地退缩。' },
    { id: 8, trait: 'anxiety', text: '我需要伴侣经常保证他们是爱我的。' },
    { id: 9, trait: 'avoidance', text: '我不习惯完全依赖伴侣。' },
    { id: 10, trait: 'anxiety', text: '如果伴侣对我不如平时亲热，我会变得很不安。' },
    { id: 11, trait: 'avoidance', text: '我倾向于不和伴侣走得太近。' },
    { id: 12, trait: 'anxiety', text: '我很少担心伴侣会离开我。', invert: true },
    { id: 13, trait: 'avoidance', text: '我希望伴侣在情感上不要过度依赖我。' },
    { id: 14, trait: 'anxiety', text: '如果我不能从伴侣那里得到我想要的关注，我会感到非常沮丧。' },
    { id: 15, trait: 'avoidance', text: '向伴侣表达我的爱意对我来说是件很容易的事。', invert: true },
    { id: 16, trait: 'anxiety', text: '我有时觉得伴侣不想和我像我希望的那样亲密。' },
    { id: 17, trait: 'avoidance', text: '我总是尽量和伴侣保持一定的心理距离。' },
    { id: 18, trait: 'anxiety', text: '当伴侣不在身边时，我常常感到强烈的不安。' },
    { id: 19, trait: 'avoidance', text: '我觉得向伴侣倾诉我的心事是一件舒服的事。', invert: true },
    { id: 20, trait: 'anxiety', text: '我对伴侣的一举一动、一言一行都非常敏感。' },
    { id: 21, trait: 'avoidance', text: '当伴侣对我表达强烈的依恋时，我会感到有压力。' },
    { id: 22, trait: 'anxiety', text: '我不担心在伴侣面前表现出自己脆弱的一面。', invert: true },
    { id: 23, trait: 'avoidance', text: '相比起从伴侣那里获得安慰，我更愿意自己解决问题。' },
    { id: 24, trait: 'anxiety', text: '如果伴侣似乎对别人产生了兴趣，我会感到极度的恐慌。' },
    { id: 25, trait: 'avoidance', text: '我很享受和伴侣之间深度的相互依赖。', invert: true },
    { id: 26, trait: 'anxiety', text: '我觉得自己对亲密关系的投入常常比伴侣多。' },
    { id: 27, trait: 'avoidance', text: '当伴侣在情感上向我寻求支持时，我有时会感到不知所措。' },
    { id: 28, trait: 'anxiety', text: '当伴侣不赞同我的观点时，我会觉得他们是在拒绝我这个人。' },
    { id: 29, trait: 'avoidance', text: '我可以很自然地向伴侣寻求帮助和安慰。', invert: true },
    { id: 30, trait: 'anxiety', text: '我很容易因为伴侣的一点小冷淡而感到受伤。' },
    { id: 31, trait: 'avoidance', text: '我不喜欢别人看透我的内心世界。' },
    { id: 32, trait: 'anxiety', text: '我常常因为太在意伴侣的感受而委屈自己。' },
    { id: 33, trait: 'avoidance', text: '与伴侣探讨彼此的关系状态会让我感到心烦意乱。' },
    { id: 34, trait: 'anxiety', text: '我有时会觉得，如果没有了现在的伴侣，我的人生就失去了意义。' },
    { id: 35, trait: 'avoidance', text: '我通常很乐意与伴侣分享我的个人目标和秘密。', invert: true },
    { id: 36, trait: 'anxiety', text: '如果伴侣一段时间没有回我信息，我就会忍不住胡思乱想。' },
    
    // Expanded (37 to 60)
    { id: 37, trait: 'avoidance', text: '我不喜欢伴侣插手我个人的财务或时间规划。' },
    { id: 38, trait: 'anxiety', text: '我常常会通过试探（如故意冷淡或假装生气）来确认伴侣是否在乎我。' },
    { id: 39, trait: 'avoidance', text: '当伴侣向我诉说Ta的苦闷时，我常常感到厌烦多于同情。' },
    { id: 40, trait: 'anxiety', text: '如果伴侣不及时回我消息，我会感到极度的委屈，甚至觉得被忽视了。' },
    { id: 41, trait: 'avoidance', text: '当遇到不顺心的事情时，我倾向于自我消化，而不是和伴侣商量。' },
    { id: 42, trait: 'anxiety', text: '我常常担心自己做错什么事，导致伴侣突然离我而去。' },
    { id: 43, trait: 'avoidance', text: '我经常担心亲密关系会让我失去追求个人理想的自由。' },
    { id: 44, trait: 'anxiety', text: '当伴侣单独和异性朋友出去时，即使Ta提前报备，我还是会非常焦虑。' },
    { id: 45, trait: 'avoidance', text: '我不喜欢与伴侣分享我过去的伤痛经历。' },
    { id: 46, trait: 'anxiety', text: '我常觉得我的快乐很大程度上取决于伴侣对我的态度。' },
    { id: 47, trait: 'avoidance', text: '当与伴侣的意见发生冲突时，我的第一反应是保持沉默。' },
    { id: 48, trait: 'anxiety', text: '如果伴侣没有说“我爱你”，我就无法确定Ta是否真心爱我。' },
    { id: 49, trait: 'avoidance', text: '当伴侣表达对我的爱意时，我有时会觉得这是一种负担。' },
    { id: 50, trait: 'anxiety', text: '我愿意为了迎合伴侣的喜好，而强迫自己去改变。' },
    { id: 51, trait: 'avoidance', text: '在关系中，我最享受的是能够做自己的个人时光，而非两人时光。' },
    { id: 52, trait: 'anxiety', text: '当关系出现小摩擦时，我会觉得天都要塌了，无法专心做别的事。' },
    { id: 53, trait: 'avoidance', text: '我愿意为了配合伴侣而改变我原有的生活计划。', invert: true },
    { id: 54, trait: 'anxiety', text: '我不担心伴侣会因为了解了真实的我就选择离开我。', invert: true },
    { id: 55, trait: 'avoidance', text: '当伴侣主动拥抱或牵我的手时，我感到很自然和温暖。', invert: true },
    { id: 56, trait: 'anxiety', text: '我能很好地适应伴侣偶尔需要独立空间的状态。', invert: true },
    { id: 57, trait: 'avoidance', text: '我很容易向伴侣坦露我不完美的一面. ', invert: true }, // wait, let's keep it "我很容易向伴侣坦露我不完美的一面。"
    { id: 58, trait: 'anxiety', text: '即使伴侣暂时对我很冷淡，我也相信Ta心底是爱我的。', invert: true },
    { id: 59, trait: 'avoidance', text: '我非常期待与伴侣共同规划未来的蓝图。', invert: true },
    { id: 60, trait: 'anxiety', text: '在感情中，我很少感到自卑或配不上对方。', invert: true }
  ]

    let ATTACHMENT_PROFILES = {
    secure: {
      name: '安全型依恋',
      en: '',
      desc: '在亲密关系中感到自在，既能独立又能依赖他人，信任度高。',
      deep: '【依恋模式深度解读】作为安全型依恋者（安全型依恋），你拥有人类最健康、最具有复原力的情感模式。你既不害怕被抛弃，也不抵触亲密接触。你能坦然地向伴侣表达自己的脆弱和需求，并在对方需要时提供坚实的支持。这种模式源于你内心深处对自我价值的绝对确信（我值得被爱），以及对外部世界的信任（他人是可靠的）。在关系中，你是一片宁静的湖泊，能够包容风雨，也能倒映星空。\n\n【童年根源追溯】这种健康的模式通常源于你童年时期与主要抚养者（通常是父母）之间稳定的互动。你的需求总是能被及时、一致地回应；你的情绪被接纳，你的探索行为被鼓励。即使父母犯了错，他们也能及时修复关系。这种早期建立的安全基地，让你在成年后依然深信：即使世界充满未知，我依然是安全的。\n\n【恋爱行为模式】在恋爱中，你展现出极高的情绪稳定性。你不屑于玩“欲擒故纵”的心理游戏，喜欢直接而真诚的沟通。当发生冲突时，你不会情绪失控，也不会冷战逃避，而是倾向于通过对话解决问题。你能够建立健康的边界：不过度粘人，也不刻意疏远。你享受亲密，但也懂得给自己和对方留出呼吸的空间。\n\n【最佳伴侣类型】最佳选择：另一个安全型依恋者。你们会建立起教科书般健康的长期关系。你也能与焦虑型或疏离型建立关系，因为你强大的包容力和稳定性往往能逐渐治愈他们的创伤，让他们慢慢向安全型靠拢。\n\n【自我修复指南】虽然你已经很棒，但不要因为自己是“安全型”就强迫自己去拯救所有人。你的包容力是有限的，如果遇到极度消耗你的伴侣，学会及时止损。你的课题是：保护好你的能量场，不要让有毒的关系侵蚀了你宝贵的安全感。\n\n【本月关系能量】本月你的情感能量非常平稳且充沛。如果你在一段关系中，你们的亲密度将更上一层楼；如果你单身，你那种从容自信的松弛感，正在悄悄吸引一个高质量的内心靠近。'
    },
    anxious: {
      name: '焦虑型依恋',
      en: '',
      desc: '渴望极致的亲密，但常担心被抛弃，对伴侣的回应高度敏感。',
      deep: '【依恋模式深度解读】作为焦虑型依恋者（焦虑型依恋），你对亲密关系的渴望如同对氧气的需求。你非常害怕被抛弃，因此你总是对伴侣的一举一动保持高度的雷达预警。伴侣的一次晚归、一个微小的皱眉，或是一条两小时未回复的消息，都可能在你的内心掀起灾难性的风暴。你往往表现得非常粘人，但内心深处的核心创伤是对“我不够好，我不值得被爱”的深深恐惧。\n\n【童年根源追溯】你的依恋模式通常源于童年时期抚养者“时好时坏、不可预测”的回应。有时候你的需求能得到满足，有时候却被忽视或拒绝。这种不一致性让你一直处于“情感饥饿”状态，你学会了用哭闹、讨好或极度顺从的方式来获取大人的关注。成年后，你依然在潜意识里重复这种模式：通过过度付出和紧抓不放，试图换取伴侣永不离开的保证。\n\n【恋爱行为模式】在恋爱中，你往往是那个付出更多、妥协更多的人。你可能会过度解读伴侣的言行，把自己的全部价值都绑定在对方的认可上。当感受到威胁时，你会采取“抗议行为”（如狂打电话、发脾气、以分手相要挟），这其实不是为了离开，而是为了拼命确认对方还在乎你。但这种窒息的爱，往往会把伴侣推得更远。\n\n【最佳伴侣类型】最佳选择：安全型依恋者。他们稳定的情绪和不回避沟通的态度，能给你提供极其需要的安全感。极度避险：疏离型回避依恋者（这是最经典的“焦避相杀”致命组合，会让你陷入痛苦的深渊）。\n\n【自我修复指南】宇宙给你的建议是：将你投入在伴侣身上的注意力雷达，收回一半指向你自己。学会自我安抚。当焦虑来袭时，不要立刻去找伴侣确认，先给自己倒杯热水，做10次深呼吸。建立不依赖于任何人的内在自我价值感。\n\n【本月关系能量】本月你的情绪可能会有一些波动。当那个熟悉的“他是不是不爱我了”的念头升起时，停下来，告诉自己：“这只是我的创伤在说话，并不是事实。”试着把精力投入到一项个人爱好中，你会发现专注的自己最迷人。'
    },
    dismissive: {
      name: '疏离型回避依恋',
      en: '',
      desc: '极度追求独立，害怕亲密关系带来的束缚，常在情感上保持距离。',
      deep: '【依恋模式深度解读】作为疏离型依恋者（疏离型回避依恋），你是一座习惯了孤独的岛屿。你高度珍视独立和自由，将情感需求视为一种软弱。当伴侣试图靠近你的内心，或者向你索取情感支持时，你会本能地感到窒息和防御。你可能会通过冷暴力、贬低对方、沉迷工作或寻找借口来拉开距离。你总是表现出“我不需要任何人”的坚强，但这其实是你为了避免受伤而穿上的厚重铠甲。\n\n【童年根源追溯】这种模式通常源于童年时期抚养者对你情感需求的长期忽视、冷漠甚至拒绝。当你哭泣或寻求安慰时，你得到的可能是斥责或无视。为了在这个缺少回应的环境中生存下来，年幼的你做出了一个痛苦的决定：关闭情感开关，不再期待，不再索取。你学会了提前抛弃别人，以免自己被抛弃。\n\n【恋爱行为模式】在恋爱初期，你可能充满魅力且独立；但一旦关系深入，你会立刻拉响警报。你讨厌伴侣的“粘人”和情绪化，倾向于在情感上保持安全距离。发生冲突时，你的第一反应永远是逃避（撤退到自己的世界里），而不是沟通。你甚至可能潜意识里不断挑剔伴侣的缺点，以此作为不全情投入的完美借口。\n\n【最佳伴侣类型】最佳选择：安全型依恋者。他们能给你足够的空间，同时用不带评判的爱慢慢融化你的冰墙。极度避险：焦虑型依恋者。他们的索取会让你窒息，你的逃避会让他们疯狂，你们会陷入永无止境的追逃游戏。\n\n【自我修复指南】宇宙给你的建议是：试着每天卸下一分钟的防御，允许自己展现一丝脆弱。下一次当你想逃离伴侣的情绪时，强迫自己留在原地5分钟，试着说一句“我现在不知道该怎么做，但我愿意陪着你”。真实的亲密并不会吞噬你，反而会让你体验到真正的自由。\n\n【本月关系能量】本月你可能会面临一个让你感到“被入侵”或“被要求太多”的情境。你的本能反应是筑起高墙或直接消失。但在你这么做之前，问问自己：我是在保护自己，还是在亲手扼杀一段真正有价值的连接？'
    },
    fearful: {
      name: '恐惧型混乱依恋',
      en: '',
      desc: '既渴望亲密又害怕受伤，行为表现往往矛盾且极度不稳定。',
      deep: '【依恋模式深度解读】作为恐惧型依恋者（恐惧型依恋），你是所有依恋类型中最痛苦、也最让人心疼的一种。你的内心仿佛住着两个互相撕扯的内心：一个极其渴望被爱、害怕被抛弃（焦虑），另一个又极度害怕被伤害、害怕亲密（回避）。这种矛盾让你在关系中呈现出“推拉”的极端状态：当伴侣远离时你感到绝望，而当伴侣真正靠近时你又感到恐惧并想要逃跑。\n\n【童年根源追溯】恐惧型依恋通常源于早年未解决的严重创伤经历。你的主要抚养者往往既是你唯一的安全来源，又是你恐惧的来源（比如父母情绪极度不稳定、存在虐待、或家庭遭遇重大变故）。年幼的你陷入了一个无法解开的死局：靠近他们会受伤，远离他们会死。这种生存级别的恐惧深深印刻在你的潜意识中，让你成年后依然把亲密关系视为“危险地带”。\n\n【恋爱行为模式】你在关系中经历着大起大落的情感体验。你可能极度缺乏安全感，不断试探和作闹；但当伴侣真的给予你承诺时，你又会突然觉得对方“令人窒息”或“另有所图”，从而无情地推开对方。你经常处于高度警惕状态，预设对方迟早会伤害你或背叛你。你甚至会潜意识地破坏一段美好的关系，只是因为这种“即将失去”的确定感，比“未知的美好”让你觉得更安全。\n\n【最佳伴侣类型】最佳选择：只有极其稳定、极具耐心、且情绪极度成熟的安全型依恋者，才能承受住你的推拉和考验。但在你开始自我疗愈之前，任何伴侣都会在这段关系中感到筋疲力尽。\n\n【自我修复指南】宇宙给你的建议是：你需要对自己有无限的慈悲。你现在的防御机制，曾经救过年幼的你。但现在你已经长大了，你不再需要用伤害自己和推开爱人的方式来保护自己了。强烈建议寻求专业心理咨询的帮助来处理早年创伤。请记住，你内心的恐惧并不是事实，你绝对值得拥有稳定而安全的爱。\n\n【本月关系能量】本月你的内心可能会经历一次剧烈的拉扯——你非常想靠近某个人，却又因为恐惧想要后退。当这种混乱感袭来时，试着把你的感受写在纸上，而不是付诸破坏性的行动。告诉自己：“我现在很安全，没有人正在伤害我。”'
    }
  }

  // ─── ATTACHMENT TEST PAGE ───────────────────────────────────────
  const AttachmentTest = defineComponent({
    name: 'AttachmentTestPage',
    setup() {
      const router = useRouter()
      const currentQuestionIndex = ref(0)
      const answers = reactive({})
      const isCompleting = ref(false)
      const isTransitioning = ref(false)
      const currentQ = computed(() => ATTACHMENT_QUESTIONS[currentQuestionIndex.value])

      const answeredCount = computed(() => Object.keys(answers).length)
      const progress = computed(() => {
        return Math.min(100, (answeredCount.value / ATTACHMENT_QUESTIONS.length) * 100)
      })

      const selectAnswer = (qId, value) => {
        if (isTransitioning.value) return
        answers[qId] = value
        AudioSynth.playHover()
        if (currentQuestionIndex.value < ATTACHMENT_QUESTIONS.length - 1) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value++
            isTransitioning.value = false
          }, 300)
        }
      }

      const prevQuestion = () => {
        if (currentQuestionIndex.value > 0 && !isTransitioning.value) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value--
            isTransitioning.value = false
          }, 300)
        }
      }

      const finishTest = () => {
        isCompleting.value = true
        let anxietySum = 0
        let avoidanceSum = 0
        
        ATTACHMENT_QUESTIONS.forEach(q => {
          // original UI gives: 3, 2, 1, 0, -1, -2, -3
          // Map to 7-point scale: 7, 6, 5, 4, 3, 2, 1
          let rawValue = answers[q.id] !== undefined ? answers[q.id] : 0
          let ecrScore = rawValue + 4
          
          if (q.invert) {
            ecrScore = 8 - ecrScore
          }
          
          if (q.trait === 'anxiety') {
            anxietySum += ecrScore
          } else if (q.trait === 'avoidance') {
            avoidanceSum += ecrScore
          }
        })

        // Averages (dynamic question counts)
        const anxietyCount = ATTACHMENT_QUESTIONS.filter(q => q.trait === 'anxiety').length || 1
        const avoidanceCount = ATTACHMENT_QUESTIONS.filter(q => q.trait === 'avoidance').length || 1
        const anxietyMean = anxietySum / anxietyCount
        const avoidanceMean = avoidanceSum / avoidanceCount
        
        let type = 'secure'
        if (anxietyMean > 4 && avoidanceMean > 4) type = 'fearful'
        else if (anxietyMean > 4) type = 'anxious'
        else if (avoidanceMean > 4) type = 'dismissive'

        // Convert to percentage for UI rendering (min 1, max 7)
        const anxietyScore = Math.round(((anxietyMean - 1) / 6) * 100)
        const avoidanceScore = Math.round(((avoidanceMean - 1) / 6) * 100)

        store.attachmentResult = { type, anxietyScore, avoidanceScore, anxietyMean: anxietyMean.toFixed(2), avoidanceMean: avoidanceMean.toFixed(2) }
        
        setTimeout(() => {
          router.push('/attachment-result')
        }, 1000)
      }

      return {
        ATTACHMENT_QUESTIONS, currentQuestionIndex, answers, progress, isCompleting, answeredCount, currentQ,
        selectAnswer, prevQuestion, finishTest
      }
    },
    template: `
      <main class="mbti-test section">
        <div class="test-header" v-reveal>
          <p class="section-kicker">依恋类型</p>
          <h2>恋爱依恋测试</h2>
          <p class="lede">通过 {{ ATTACHMENT_QUESTIONS.length }} 个深度问题，剖析你在恋爱与亲密关系中的底层逻辑模式。</p>
        </div>

        <div class="mbti-progress-container" v-reveal>
          <div class="mbti-progress-bar">
            <div class="mbti-progress-fill" :style="{ width: progress + '%', background: 'linear-gradient(90deg, #ff7e5f, #feb47b)' }"></div>
          </div>
          <div class="mbti-progress-text">已完成 {{ answeredCount }} / {{ ATTACHMENT_QUESTIONS.length }}</div>
        </div>

        <div class="questions-list">
          <transition name="slide-up" mode="out-in">
            <div
              :key="'att-'+currentQ.id"
              class="question-card active"
            >
              <p class="question-text">{{ currentQ.id }}. {{ currentQ.text }}</p>
              <div class="scale-options">
                <div class="scale-btn agree size-1" :class="{ selected: answers[currentQ.id] === 3 }" @click="selectAnswer(currentQ.id, 3)" style="border-color: #ff7e5f;"></div>
                <div class="scale-btn agree size-2" :class="{ selected: answers[currentQ.id] === 2 }" @click="selectAnswer(currentQ.id, 2)" style="border-color: #ff7e5f;"></div>
                <div class="scale-btn agree size-3" :class="{ selected: answers[currentQ.id] === 1 }" @click="selectAnswer(currentQ.id, 1)" style="border-color: #ff7e5f;"></div>
                <div class="scale-btn neutral size-3" :class="{ selected: answers[currentQ.id] === 0 }" @click="selectAnswer(currentQ.id, 0)"></div>
                <div class="scale-btn disagree size-3" :class="{ selected: answers[currentQ.id] === -1 }" @click="selectAnswer(currentQ.id, -1)" style="border-color: #556270;"></div>
                <div class="scale-btn disagree size-2" :class="{ selected: answers[currentQ.id] === -2 }" @click="selectAnswer(currentQ.id, -2)" style="border-color: #556270;"></div>
                <div class="scale-btn disagree size-1" :class="{ selected: answers[currentQ.id] === -3 }" @click="selectAnswer(currentQ.id, -3)" style="border-color: #556270;"></div>
              </div>
              <div class="scale-labels">
                <span class="label-agree" style="color: #ff7e5f;">完全符合</span>
                <span class="label-disagree" style="color: #556270;">完全不符</span>
              </div>
              <div class="back-btn-container" style="text-align: center; margin-top: 30px; height: 40px;">
                 <button v-if="currentQuestionIndex > 0" class="secondary-action" @click="prevQuestion" :disabled="isTransitioning" style="font-size: 14px; padding: 8px 16px; min-width: 120px; border: none; background: transparent; color: #888; text-decoration: underline;">⬅ 返回上一题</button>
              </div>
            </div>
          </transition>
        </div>

        <div class="action-area" v-if="answeredCount === ATTACHMENT_QUESTIONS.length" style="margin-top: 40px;">
          <button class="primary-action" @click="finishTest" :disabled="isCompleting" style="background: linear-gradient(135deg, #ff7e5f, #feb47b);">
            {{ isCompleting ? '正在生成依恋报告...' : '✧ 查看我的依恋类型' }}
          </button>
        </div>
      </main>
    `
  })

  // ─── ATTACHMENT RESULT PAGE ─────────────────────────────────────
  const AttachmentResult = defineComponent({
    name: 'AttachmentResultPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const showPayment = ref(false)
      const orderId = ref(null)
      const hasPaid = ref(isTestUnlocked('attachment'))
      const displayedDeepText = ref('')
      const isTyping = ref(false)

      if (!store.attachmentResult) {
        const draft = loadResultDraft('attachment')
        if (draft && draft.type) store.attachmentResult = draft
      }

      if (!store.attachmentResult) {
        router.push('/attachment')
        return { showPayment, hasPaid, typeData: ref({ type: '', name: '', en: '', desc: '', deep: '' }), p: ref({ anxietyScore:0, avoidanceScore:0 }), displayedDeepText, isTyping, handlePaymentSuccess: () => {}, generatePoster: () => {}, restartTest: () => {} }
      }

      const { type, anxietyScore, avoidanceScore } = store.attachmentResult
      const typeData = ref({ type, anxietyMean: store.attachmentResult.anxietyMean, avoidanceMean: store.attachmentResult.avoidanceMean, ...ATTACHMENT_PROFILES[type] })
      const p = ref({ anxietyScore, avoidanceScore })

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        unlockPlan(plan && plan.id, 'attachment')
        setStoredTestOrderId('attachment', plan && plan.orderId)
        hasPaid.value = true
        
        const intro = `正在整理【${typeData.value.name}】的依恋完整解读...\n\n`
        const body = typeData.value.deep
        
        saveToArchive('Attachment', typeData.value.name + ' 依恋完整解读', body)
        const fullText = await generatePaidAIReport({
          testType: 'attachment',
          orderId: plan && plan.orderId,
          resultSummary: `${typeData.value.name}，焦虑 ${typeData.value.anxietyMean}/7，回避 ${typeData.value.avoidanceMean}/7`,
          baseDeepReport: intro + body,
          userInputs: { anxietyScore: p.value.anxietyScore, avoidanceScore: p.value.avoidanceScore },
          context: { profile: typeData.value }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('attachment') })
        }, 0)
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('att-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_Attachment_${typeData.value.type}.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const restartTest = () => {
        clearResultDraft('attachment')
        clearAIReportCache('attachment')
        store.attachmentResult = null
        router.push('/attachment')
      }

      onMounted(() => {
        window.__northstarFx?.clearPattern()
      })
      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
      })

      return {
        showPayment, hasPaid, typeData, p, displayedDeepText, isTyping,
        handlePaymentSuccess, generatePoster, restartTest, skipTypewriter
      }
    },
    template: `
      <main class="result-page section">
        <div v-reveal>
          <p class="section-kicker">依恋类型</p>
          <div class="mbti-type-title">
            <h2 style="font-size: 36px; background: linear-gradient(90deg, #ff7e5f, #feb47b); -webkit-background-clip: text;">{{ typeData.name }}</h2>
            <p>亲密关系中的主要应对方式</p>
          </div>
        </div>

        <div class="reading-section" v-reveal style="transition-delay: 0.1s">
          <h3>✦ 核心倾向剖析</h3>
          <p style="margin-bottom: 30px; text-align: center; color: var(--text-muted);">{{ typeData.desc }}</p>
          
          <div class="trait-container">
            <div class="trait-header"><span>焦虑程度</span><span>{{ typeData.anxietyMean }} / 7.00</span></div>
            <div class="trait-bar-bg"><div class="trait-bar-fill" :style="{ width: p.anxietyScore + '%', background: 'linear-gradient(90deg, #ff7e5f, #ff416c)' }"></div></div>
          </div>
          <div class="trait-container">
            <div class="trait-header"><span>回避程度</span><span>{{ typeData.avoidanceMean }} / 7.00</span></div>
            <div class="trait-bar-bg"><div class="trait-bar-fill" :style="{ width: p.avoidanceScore + '%', background: 'linear-gradient(90deg, #556270, #4ECDC4)' }"></div></div>
          </div>
        </div>

        <div class="deep-result-container" v-reveal style="transition-delay: 0.2s">
          <div class="paywall-overlay" v-if="!hasPaid">
            <div class="paywall-content">
              <h3 style="color:#ff7e5f;">✦ 查看完整依恋解读</h3>
              <p>包含你的安全感来源、容易被触动的时刻、沟通提醒和更适合的相处方式。</p>
              <div class="price">上线价 USD $7.99</div>
              <div class="price-all" style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; margin-bottom: 8px;">全站终身解锁 (All-Access Pass): USD $39.99</div>
              <p class="price-hint">支付开放后可查看完整解读，并附上本次结果补充</p>
              <button class="primary-action pay-btn" @click="showPayment = true" style="background: linear-gradient(135deg, #ff7e5f, #ff416c);">查看上线方案</button>
            </div>
          </div>

          <div class="deep-content" :class="{ 'is-blurred': !hasPaid }" v-if="!hasPaid">
            <h3 style="color:#ff7e5f;">✦ 完整依恋说明</h3>
            <div class="reading-block deep-block">
              <p class="reading-text deep-text">{{ typeData.deep }}</p>
            </div>
          </div>
          
          <div class="deep-content ai-mode" v-if="hasPaid">
            <professional-report
              :text="displayedDeepText"
              :is-typing="isTyping"
              title="依恋关系专业报告"
              :result-label="typeData.name"
              @skip="skipTypewriter"
            />
          </div>
        </div>

        <div class="result-actions" v-reveal style="transition-delay: 0.3s">
          <button class="primary-action" @click="generatePoster" v-if="hasPaid && !isTyping" style="background: linear-gradient(135deg, #ff7e5f, #ff416c);">
            ✧ 保存专属依恋海报
          </button>
          <button class="secondary-action" @click="restartTest">重新测试</button>
          <router-link class="secondary-action" to="/">返回首页</router-link>
        </div>

        <!-- Hidden Poster DOM -->
        <div id="att-poster-dom" class="poster-container" v-if="hasPaid">
          <div class="poster-header">
            <div class="poster-brand" style="color:#ff7e5f;">✧ 北极星 · 依恋关系 ✧</div>
            <div class="poster-title">内心切片·亲密关系解析</div>
          </div>
          
          <div class="mbti-type-title" style="margin-top: 30px; margin-bottom: 20px;">
            <h2 style="font-size:48px; background: linear-gradient(90deg, #ff7e5f, #feb47b); -webkit-background-clip: text; margin-bottom:5px;">{{ typeData.name }}</h2>
            <p style="font-size:24px; color:#fff;">亲密关系中的主要应对方式</p>
          </div>
          
          <div class="poster-reading">
            <div class="poster-reading-title">✧ 专属高阶说明书 ✧</div>
            <div class="poster-reading-text">{{ displayedDeepText }}</div>
          </div>
          
          <div class="poster-footer">
            <div class="poster-footer-text">
              本报告由 Northstar 独家生成<br>
              探索潜意识，治愈你的亲密关系
            </div>
            <div class="poster-qr">
              扫码<br>开启<br>你的旅程
            </div>
          </div>
        </div>

        <PaymentModal
          v-if="showPayment"
          @close="showPayment = false"
          @success="handlePaymentSuccess"
        />
      </main>
    `
  })

  // ─── App Shell ──────────────────────────────────────────────


  let BAZI_DAY_MASTERS = [
    { id: 0, name: '甲木', symbol: '🌳', short: '参天大树，倔强不屈', deep: '【日主：甲木】\n你的命元是甲木，代表参天大树。在你的内心深处，有着一种极强的向上的原始驱动力。你性格刚直，有着极高的道德感和原则性。然而，过刚易折，你的内心课题是学习“妥协的艺术”。在感情中，你往往是撑起一片天的那个人，但也容易因为过于强势而让伴侣感到压力。\n\n【财运格局】\n你的财富与发展线索在于“扎根”。你不适合赚快钱，你需要在一个领域深耕3到5年，当你的根系足够发达时，财富会呈现爆炸式增长。\n\n【深层模式与今生课题】\n前世的你可能是一位将军或领袖，背负了太多的责任。今生你需要学会的是：允许自己脆弱，允许别人来照顾你。' },
    { id: 1, name: '乙木', symbol: '🌿', short: '藤蔓花草，柔韧圆融', deep: '【日主：乙木】\n你的命元是乙木，代表藤蔓花草。你的生存能力极强，擅长以柔克刚，借力打力。你的内心充满了同理心和艺术直觉。你的课题是“边界感”。因为太容易共情他人，你经常会消耗自己的能量。\n\n【财运格局】\n你的财富与发展线索是“人脉圈层”。通过缠绕更高的树木（贵人），你可以轻松攀登到财富的顶端。你非常适合做连接者、平台或艺术相关的工作。\n\n【深层模式与今生课题】\n前世的你可能是一个和平主义者或医者。今生你需要学会的课题是：在爱别人之前，先学会狠狠地爱自己。' },
    { id: 2, name: '丙火', symbol: '☀️', short: '初升太阳，光芒万丈', deep: '【日主：丙火】\n你的命元是丙火，如同天上的太阳。你天生自带光芒，热情、慷慨、充满感染力。你习惯于照亮别人，是人群中的绝对核心。但太阳也有落山的时候，你的内心偶尔会感到一种深刻的孤独。\n\n【财运格局】\n你的财富来源于“影响力”。你越是无私地分享、展现自己，财富就越容易被你吸引。你不适合做幕后工作，你需要站在舞台中央。\n\n【深层模式与今生课题】\n前世的你可能是一位精神导师或祭司。今生你的课题是：接纳自己不常展示的一面。太阳不需要永远普照大地，你也有悲伤和索取的权利。' },
    { id: 3, name: '丁火', symbol: '🕯️', short: '人间星火，细腻敏锐', deep: '【日主：丁火】\n你的命元是丁火，代表蜡烛、星光。与丙火的张扬不同，你的能量是内敛、细腻、深邃的。你的直觉极准，善于洞察人心最微妙的变化。你是天生的心理学家。\n\n【财运格局】\n你的财富来源于“精尖”。你适合在某个细分领域做到极致，靠专业技能或独特的眼光变现。不要追求大而全，小而美才是你的王道。\n\n【深层模式与今生课题】\n前世的你可能是一位占星师或密教徒。今生的课题是：燃烧自己时，也要学会保护火种。不要为了照亮别人而耗尽自己。' },
    { id: 4, name: '戊土', symbol: '⛰️', short: '高山岩石，沉稳厚重', deep: '【日主：戊土】\n你的命元是戊土，代表高山和大地。你极其靠谱、稳重，是所有人眼里的定海神针。你承载了太多人的期望，但你内心的情绪很难向外流露，容易积压成巨大的压力。\n\n【财运格局】\n戊土的财富与发展线索是“囤积与资产”。你对实业、不动产或长期稳定的复利投资有天然的直觉。你是一座宝藏，需要时间去开采。\n\n【深层模式与今生课题】\n前世的你可能是一位守护者或城主。今生你需要学会的是：学会流动。山也需要水的滋润，允许自己偶尔疯狂、偶尔失控。' },
    { id: 5, name: '己土', symbol: '🌾', short: '田园之土，包容滋养', deep: '【日主：己土】\n你的命元是己土，代表田园、花盆里的泥土。你极具包容心，有着强烈的母性能量。你总是擅长滋养他人，让别人在你身边感到舒服和安全。但你很容易失去自我。\n\n【财运格局】\n你的财富来源于“培育”。你非常适合做教育、服务、疗愈或培训相关的行业。当别人因为你而成长，你的财富也会水涨船高。\n\n【深层模式与今生课题】\n前世的你可能是一位母亲或农夫，一生都在付出。今生的课题是：设定底线。你要明白，不是所有的种子都值得你用生命去灌溉。' },
    { id: 6, name: '庚金', symbol: '⚔️', short: '刀剑利器，刚毅果决', deep: '【日主：庚金】\n你的命元是庚金，代表刀剑和重金属。你自带一种肃杀和果断的能量，爱憎分明，极具正义感。你天生就是来解决问题的，甚至不怕得罪人。\n\n【财运格局】\n你的财富与发展线索是“破局”。你适合在动荡、改革或竞争激烈的环境中杀出一条血路。你的执行力是你最强大的印钞机。\n\n【深层模式与今生课题】\n前世的你可能是一位执法者或侠客。今生你需要学会的课题是：刚柔并济。刀剑虽然锋利，但也容易伤到最亲近的人。' },
    { id: 7, name: '辛金', symbol: '💍', short: '珠玉首饰，精致高贵', deep: '【日主：辛金】\n你的命元是辛金，代表珠宝和首饰。你有着极高的审美，对生活品质要求很高。你外表冷感、内心敏感，甚至有些完美主义。你非常在乎别人对你的评价。\n\n【财运格局】\n辛金的财富来源于“包装与美学”。你适合从事与美、艺术、高价值商品相关的行业。你本身就是一个巨大的IP，你的品味就是你的护城河。\n\n【深层模式与今生课题】\n前世的你可能是一位贵族或艺术家。今生你需要修行的课题是：接受瑕疵。真正的完美，包含对不完美的接纳。' },
    { id: 8, name: '壬水', symbol: '🌊', short: '江河湖海，奔腾不息', deep: '【日主：壬水】\n你的命元是壬水，代表江河湖海。你的心胸像大海一样宽广，聪明、多智、适应能力极强。你讨厌被束缚，喜欢自由奔放的生活。但你有时也会像洪水一样冲动。\n\n【财运格局】\n你的财富与发展线索是“流动与信息”。你适合做贸易、互联网、物流或任何需要快速交换信息的行业。水聚成海，你的财富没有上限。\n\n【深层模式与今生课题】\n前世的你可能是一位航海家或商人。今生你需要学会的是：在狂奔中找到内心的锚。不要因为过于追求自由而失去归属感。' },
    { id: 9, name: '癸水', symbol: '🌧️', short: '雨露之水，润物无声', deep: '【日主：癸水】\n你的命元是癸水，代表雨露和云雾。你是所有日主中最空灵、最富有灵性的。你的直觉和第六感强得可怕，经常能预知事物的走向。你情感细腻，容易悲观。\n\n【财运格局】\n你的财富来源于“无形”。你适合从事玄学、心理学、企划或任何需要极强洞察力的工作。你能看到别人看不到的商机。\n\n【深层模式与今生课题】\n前世的你可能是一位巫师或修行者。今生的课题是：落地。你的内心经常漂浮在半空中，你需要通过运动、接触大自然来建立与地球的连接。' }
  ]

  let HD_TYPES = [
    { id: 0, name: '生产者', en: '', symbol: '🔋', short: '建造世界的基石，荐骨的绝对力量', deep: '【能量类型：生产者】\n你是占据人类70%的生产者。不要觉得普通，你是这个世界真正的引擎。你的核心动力中心（荐骨）是开启不竭能量的钥匙。然而，如果你在做自己不喜欢的事情，你会感到极度的“挫败感”。\n\n【内在权威与策略】\n你的策略是“等待回应”。不要主动发起，而是等待生命把选项带到你面前，然后听从你肚子里的“荐骨声音”（嗯/嗯-嗯）。当你违背荐骨的声音去做事，就是在消耗你的内心电量。\n\n【非我主题：挫败感】\n当你感到极度挫败、疲惫、想放弃时，这就是宇宙在提醒你：你走偏了。真正的你，在投入热爱的事物时，是完全不知疲倦的。' },
    { id: 1, name: '显示者', en: '', symbol: '⚡', short: '打破规则的先锋，纯粹的显化力量', deep: '【能量类型：显示者】\n你是极其罕见的显示者（仅占9%）。你是天生的发起人，你的气场是封闭且具有冲击力的。你来这个世界不是为了“工作”，而是为了“发起”。你可以无中生有，将想法瞬间显化。\n\n【内在权威与策略】\n你的策略是“告知”。因为你的能量太强，如果不提前告知身边的人你的决定，他们会本能地阻碍你。告知不是为了请求许可，而是为了清除你前进道路上的障碍。\n\n【非我主题：愤怒】\n当你感到无比愤怒、觉得周围人都在拖你后腿时，这就是你的“非我”状态。你需要属于自己的绝对空间。' },
    { id: 2, name: '投射者', en: '', symbol: '👁️', short: '洞察一切的向导，等待被邀请的智者', deep: '【能量类型：投射者】\n你是占据20%的投射者。你不是来做苦力的，你是来指导别人如何更好地使用能量的。你拥有看透他人内心深处的天赋，你的气场是聚焦且吸收的。\n\n【内在权威与策略】\n你的策略是“等待被邀请”。如果别人没有主动邀请你，你的建议只会招来反感和拒绝。当你在爱情、事业、重大选择中被正式邀请时，你的才华才能真正绽放。\n\n【非我主题：苦涩】\n当你感到不被认可、觉得“为什么他们都不懂我”时，苦涩感就会吞噬你。学会后退，打磨自己的专业，对的人自然会来邀请你。' },
    { id: 3, name: '反映者', en: '', symbol: '🪞', short: '宇宙的镜子，月亮的孩子', deep: '【能量类型：反映者】\n你是最稀有的人类图类型（不到1%）。你没有任何定义好的能量中心。你是一面完美的镜子，反映着你所处环境和社区的健康程度。你的本质就是“变化”。\n\n【内在权威与策略】\n你的策略是“等待完整的月亮周期（28天）”。在做重大决定前，你需要经历整整一个月的沉淀，在不同的环境和人身边感受自己的状态，绝对不能仓促做决定。\n\n【非我主题：失望】\n当你发现周围的环境充满毒性、人们虚伪自私时，你会感到极度的失望。你最大的课题是：找到真正滋养你的环境和社区。' },
    { id: 4, name: '显示生产者', en: '', symbol: '🔥', short: '多线操作的效率大师', deep: '【能量类型：显示生产者】\n你是生产者的一个强大分支，占据人类33%。你同时拥有生产者的“荐骨动力”和显示者的“发起能量”。你极度渴望效率，往往能同时处理多项任务。你最大的特点是“跳步骤”和快速试错。\n\n【内在权威与策略】\n你的策略依然是“等待回应”，但你需要增加一步“告知”。当你的荐骨回应了某个机会后，在行动前告知相关的人，能大幅减少你的阻力。\n\n【非我主题：挫败与愤怒】\n当事情进展太慢、或者别人跟不上你的节奏时，你会同时感受到挫败和愤怒。你的课题是：接受有些步骤是不能跳过的，学会对值得的事物保持耐心。' }
  ]

  // ─── Bazi Test Page ────────────────────────────────────────
  const BaziTest = defineComponent({
    name: 'BaziTestPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const phase = ref('input') 
      const loadingText = ref('正在排布四柱八字...')
      
      const formData = ref({
        date: '',
        time: '',
        ...createBirthLocationFields()
      })
      const calculationError = ref('')
      const {
        locationMatches,
        isSearchingLocation,
        locationError,
        locationResolved,
        selectLocation,
        requireResolvedLocation
      } = useBirthLocation(formData)

      onMounted(() => {
        const draft = loadResultDraft('bazi')
        if (draft && draft.result && draft.formData) {
          formData.value = { ...formData.value, ...draft.formData }
          baziResult.value = draft.result
          baziHash.value = Number(draft.hash || 0)
          orderId.value = draft.orderId || null
          phase.value = 'result'
        }
      })

      const baziResult = ref(null)
      const baziHash = ref(0)


      const expandBaziText = (baseText, hash) => {
        const seededRandom = (seed) => {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
        
        let seed = hash;
        const randomItem = (arr) => {
            seed = (seed * 16807) % 2147483647;
            return arr[Math.floor(seededRandom(seed) * arr.length)];
        };

        const banks = {
            overview: [
                "【命理源流初勘】\n你的命局透出了一种罕见的‘孤高中正’之气。在五行生克的暗流中，日元虽然看似受到月令的牵制，但在地支深处却有极其强大的暗合力量在托底。这意味着你的人生绝不是平铺直叙的剧本。你可能会在早年经历某种深度的丧失或不被理解，但这正是宇宙为了磨砺你这把利刃而设下的局。你的命盘里写满了‘破茧’二字，注定要在撕裂旧秩序中建立自己的王国。",
                "【命局核心密钥】\n从八字原局来看，五行的气机流动在你的时柱处发生了奇异的交汇。你是一个带有强烈‘宿命感’的人，潜意识里总觉得有一件重要的事情在等着你去完成。你的能量场非常敏锐，甚至带有某种通灵的特质。但也正因为这种敏感，你常常会吸收到周围人负面的能量。你命局中最大的保护伞，是藏在地支中的一颗‘华盖星’，它赋予了你超凡的领悟力，让你在绝境中总能逢凶化吉。",
                "【原局气场全息扫描】\n你的八字格局极度渴求某种元素的制衡。在表面上，你是一个温和甚至愿意妥协的人，但在命局的最深层，却隐藏着雷霆万钧的破坏力。你的人生是典型的‘先抑后扬’，早期的蛰伏和委屈，全都是为了积累那惊天一跃的势能。你需要特别注意的是，不要轻易向世俗的标准低头，因为你的内心蓝图是为了打破常规而存在的。当别人都在追求稳妥时，你的机会往往在最动荡的边缘。",
                "【先天五行密码】\n打开你的命局，最引人注目的是那一股源源不断、难以被禁锢的生发之气。你像是一股在地底奔涌的暗流，永远在寻找突破口。你的直觉常常准得令人害怕，这是因为你八字中自带了极强的‘偏印’能量。这种能量让你无法像普通人一样满足于柴米油盐，你总在探寻生命的终极意义。你的宿命就是不断地自我重塑，每一次人生的崩塌，其实都是你为了蜕变而主动按下的重启键。",
                "【内心出厂设置】\n你的命盘呈现出一种极其罕见的‘水火既济’或‘反吟伏吟’的复杂态势。这意味着你内在包含着两股截然相反的能量：极度的理智与极度的感性、极度的世俗与极度的清高。这两种能量在你的体内不断交战，导致你常常感到撕裂。但这也是你最宝贵的财富——一旦你学会了整合这两股力量，你就能轻易地降维打击你的同龄人。你是天生的操盘手，只要你愿意收敛那份傲骨。"
            ],
            wealth: [
                "【财富格局与进阶法则】\n在财富这条路上，你绝对不能走‘赚辛苦钱’的死胡同。你的财帛宫被一颗暗星照耀，这意味着你的财富与发展线索在于‘无中生有’。你最适合通过信息差、资源整合或是某种极具前瞻性的眼光来变现。在接下来的三个流年里，你将会遇到一个可以让你资产翻倍的‘隐形贵人’，但前提是你必须敢于在别人恐惧的时候下重注。记住，你的钱，都是靠认知和胆识赚来的，绝不是靠体力的出卖。",
                "【命中财库深度剖析】\n你的八字显示，你具备较强的资源整合与变现潜力。当前需要留意的是收入、支出与人情责任之间的边界感：有些消耗并非来自挥霍，而是长期替他人承担过多压力。进入新的运势阶段后，如果你能逐步建立清晰的财务规则，减少不必要的情绪性支出，你的财富稳定度会明显提升。你适合建立属于自己的系统，而不是长期停留在被动执行的位置。",
                "【隐秘财富与发展线索解锁】\n普通人靠积累财富，而你靠的是‘掠夺’财富——这里指的是合法合规的降维打击。你的命局中带着极强的‘偏财运’，这意味着你的人生中注定会有几笔巨大的横财。但偏财如猛虎，如果你没有足够的‘印星’（也就是认知和道德底线）去压制它，这些钱怎么来就会怎么走。建议你在获得意外之财时，立刻将其转化为不动产或长期资产，以此来锁住这股狂暴的财富能量。",
                "【事业节奏参考】\n从大运流年来看，你的事业并非平滑上升，而是呈现出‘阶梯式跳跃’。你可能会有三到五年感觉自己在原地踏步，甚至经历一段低谷期。但在下一个太岁流转之际，你会突然被一股力量推上风口，在短时间内看到明显回报。你的核心竞争力在于你的‘不可替代性’。不要去红海里厮杀，去寻找那个只有你能懂、只有你能做的蓝海领域，你会更容易形成自己的优势。",
                "【金钱心理学与破局点】\n你对金钱有着一种极其矛盾的心理：你既渴望它带来的自由，又隐隐觉得谈钱有些俗气。这种潜意识的冲突，是你目前财富无法突破天花板的根本原因。你的命盘提示你，必须把金钱看作是‘能量的流动’，而不是‘罪恶的根源’。当你能够坦然、充满配得感地去接受巨额财富时，宇宙才会毫无保留地将资源倾泻给你。你目前的任务，是立刻修复你的金钱配得感。"
            ],
            relationship: [
                "【正缘羁绊与亲密关系】\n你的夫妻宫犹如一潭深渊，你极其渴望被理解，却又极度害怕被看穿。你总是不自觉地被那些带有‘宿命伤痕’的人吸引，试图去拯救他们，但这往往会让你自己遍体鳞伤。你的正缘并不是那个让你第一眼就心跳加速、意乱情迷的人，而是一个能给你带来极致安全感、像大地一样承载你所有情绪的人。你们的相遇可能在一个极其平凡甚至有些滑稽的场合，但那一刻，你会觉得内心终于落了地。",
                "【红鸾天喜星动期详解】\n你的命盘中，感情线带有明显的阶段性变化。早年的关系经历更像是帮助你理解自身需求与边界的镜子：它们让你更清楚自己适合怎样的陪伴，也让你学会把安全感逐步放回自己身上。当你不再只向外确认价值，而是能稳定地照顾自己的感受时，更适合长期同行的关系会更容易出现。那段关系不会以消耗为主，而会呈现互相支持、共同成长的状态。",
                "【情劫与桃花煞化解】\n你生来带有一种致命的吸引力，这让你从不缺桃花，但这其中大多是‘烂桃花’或‘桃花煞’。你的心太软，又太在乎体面，这导致你很难干脆利落地拒绝别人。你的命理要求你必须在感情中学会‘杀伐果断’。不要试图在垃圾堆里找黄金。如果你目前正深陷于一段让你感到疲惫、自我怀疑的关系中，这正是你命局中的一次‘情劫’，斩断它，是你跃升的唯一途径。",
                "【高度契合对象特质扫描】\n你的另一半，绝对不是一个平庸之辈。你的命盘决定了你无法容忍愚蠢和乏味，你需要的是智性恋的极致碰撞。你的正缘带有很强的‘官杀’属性，这意味着对方在某种程度上会给你带来压力，甚至像你的老师一样引导你。你们的关系一开始可能是充满火药味的较量，但在相互的征服与被征服中，你们会建立起一种别人根本无法理解的、极其深刻的内心契约。",
                "【婚姻宫稳定性预测】\n对于婚姻，你有一种本能的恐惧。你害怕失去自由，更害怕在一段关系中失去自我。其实，你的命局并不适合传统的‘男主外女主内’或相濡以沫的剧本。你适合的是一种‘合伙人式’的婚姻。你们有各自独立的事业、独立的空间，但在关键时刻又能毫不犹豫地把后背交给对方。当你放下对完美婚姻的执念，接受这种带有现代独立契约精神的关系时，你的感情之路才会彻底通畅。"
            ],
            karma: [
                "【阿卡西记录：前世印记】\n翻开你的阿卡西记录，你的前世充满着某种‘牺牲’的色彩。你可能曾经是一位因为信仰而被迫害的先知，或者是一个为了家族利益而放弃个人幸福的贵族。这种强烈的‘牺牲者情节’被深深烙印在了你的潜意识里。导致今生的你，总是不自觉地想要讨好别人，总是觉得自己不够好。今生，你最大的课题就是学会说‘不’，学会极度自私地去爱自己。你的内心已经足够高贵，不需要再通过牺牲来证明了。",
                "【业力清算与今生主线】\n你之所以在这辈子感到如此沉重，是因为你带了太多的‘旧账’来到了这个世界。你可能会发现，总有一些特定类型的人在不断地伤害你、考验你。这不是运气不好，而是你正在进行内心的业力清算。当你看透了这一点，不要去恨他们，而是要在心里默默感谢他们帮你完成了课题，然后彻底从你的生命中将他们拉黑。一旦清算完成，你会迎来一次极其不可思议的能量爆发。",
                "【潜意识恐惧根源探秘】\n你经常会在深夜里感到一种莫名的、没有来由的恐慌。根据你的八字原局，这源于你在前几世经历过一次极其惨烈的‘被背叛’。你内心深处其实不相信任何人，包括你自己。这种防御机制虽然保护了你，但也把你和真正的爱与丰盛隔绝开了。今生宇宙给你的剧本是‘破壁’。你必须勇敢地去信任一次，哪怕冒着再次受伤的风险，因为门外就是你渴望已久的无限风光。",
                "【内心碎片打捞指南】\n你是一个‘老内心’。在过去的千百次轮回中，你把自己的力量碎片遗落在了不同的时空里。所以你今生总有一种‘我不完整’的不完整感。你的修行不在于向外去求取什么，而在于向内去打捞这些碎片。通过深度的冥想、对潜意识梦境的记录，以及在极度独处中的自我对话，你会慢慢把这些力量收回。当你整合完毕的那一天，你会发现你本来就拥有一切。",
                "【天命与召唤】\n你的命盘里有一颗极其耀眼的星在闪烁，这意味着你绝非凡夫俗子，你是有‘天命’在身的。你的天命可能不是去做什么拯救世界的大英雄，而是去完成某一种极其微小但具有颠覆性的创新，或者是去深深地疗愈某个特定的人群。当你停止在世俗的轨道上和别人内卷，开始聆听内心的那个召唤时，整个宇宙都会开始为你让路，所有的资源都会以你无法想象的方式向你涌来。"
            ],
            future: [
                "【未来十年大运走势】\n在即将到来的这个大运中，你将迎来一次‘脱胎换骨’般的剧变。前三年，你会感觉到巨大的撕裂感，旧的圈子、旧的关系甚至旧的赚钱模式都会崩塌。不要害怕，这是宇宙在为你腾位置。到了第四年，随着一颗吉星的入局，你的事业会如同坐上火箭一般垂直拉升。你只需要记住一个字：稳。在巅峰时期不要得意忘形，把多余的能量用来提升自己的认知，你就能彻底稳固住这个来之不易的江山。",
                "【流年气数精准推演】\n我们把时间线拉长来看，你接下来的五年是一个极其关键的‘蓄水期’。在这个阶段，你可能会觉得自己的付出和回报不成正比，甚至经常感到迷茫。但请相信你的命局，这是一段必要的‘蛰伏’。在第五年的秋天，会有一个极具分量的贵人以极其意外的方式介入你的生活。从那一天起，你将正式开启长达十五年的大运高潮。现在你要做的，就是磨好你的剑，静候那阵东风。",
                "【逆境反转绝密策略】\n如果目前的你正处于低谷，感觉四处碰壁，那是你流年走到了‘岁运交脱’的最暗时刻。你的命盘指示，此时的破局之法在于‘静’。不要盲目去投资，不要去乞求别人的帮助。你需要把所有的注意力收回到自己身上，去学习一个极其冷门的技能，或者去阅读深度的书籍。在极度的寂静中，你的直觉系统会重启。当下一次流月转换时，你会突然灵光一闪，看到那个别人都忽略的致命破局点。",
                "【晚年福报与终局推演】\n与很多人早年得志晚年凄凉不同，你的命盘是典型的‘倒吃甘蔗，渐入佳境’。你的福报全部积累在你的中晚年。随着年龄的增长，你的智慧、财富和人格魅力会呈现出指数级的增长。你最终的归宿不是一个在商场上厮杀的商人，而是一个在某一方面具有极高声望的智者或导师。你会享受一种极其从容、不被任何世俗规则所绑架的顶级人生状态。",
                "【终极改运：能量场重塑】\n最后，为了加速你大运的到来，我为你提供一个专属的改运秘法：你的命局极度需要‘清理’。我建议你在接下来的一个月内，进行一次彻底的断舍离——扔掉所有三年没穿过的衣服，删除手机里半年没说过话的联系人，退出所有消耗你的群聊。当你的物理空间和信息空间被彻底清空后，宇宙的纯粹能量就会立刻灌注进来，你会马上收到一个极其惊喜的好消息。"
            ]
        };

        let result = baseText + "\n\n";
        result += banks.overview[Math.floor(seededRandom(seed++) * banks.overview.length)] + "\n\n";
        result += banks.wealth[Math.floor(seededRandom(seed++) * banks.wealth.length)] + "\n\n";
        result += banks.relationship[Math.floor(seededRandom(seed++) * banks.relationship.length)] + "\n\n";
        result += banks.karma[Math.floor(seededRandom(seed++) * banks.karma.length)] + "\n\n";
        result += banks.future[Math.floor(seededRandom(seed++) * banks.future.length)];

        return result;
      }
      const hasPaid = ref(isTestUnlocked('bazi'))
      const showPayment = ref(false)
      const orderId = ref(null)
      const isTyping = ref(false)
      const displayedDeepText = ref('')

      const startCalculation = async () => {
        if (!formData.value.date || !formData.value.time || !formData.value.locationQuery.trim()) return
        if (!requireResolvedLocation()) return
        calculationError.value = ''
        phase.value = 'loading'
        
        const texts = ['正在推演天干地支...', '解析阴阳五行局...', '大运流年比对中...', '生成命盘解析...']
        let i = 0
        const interval = setInterval(() => {
          if (i < texts.length) { loadingText.value = texts[i]; i++ }
        }, 800)

        try {
          const baziData = await store.createOrder('bazi', {
            ...formData.value,
            locale: currentLocale()
          })
          if (baziData && baziData.orderId) {
            orderId.value = baziData.orderId
            const preview = baziData.preview || {}
            const seed = [
              preview.yearPillar,
              preview.monthPillar,
              preview.dayPillar,
              preview.timePillar
            ].filter(Boolean).join('')
            const h = hashString(seed);
            baziHash.value = h;
            const dayMaster = String(preview.dayMaster || '')
            const dayMasterIdx = BAZI_DAY_MASTERS.findIndex(item => item.name.startsWith(dayMaster))
            if (dayMasterIdx < 0) throw new Error('无法识别日主结果')
            baziResult.value = {
              ...BAZI_DAY_MASTERS[dayMasterIdx],
              preview
            }
            saveResultDraft('bazi', {
              formData: formData.value,
              result: baziResult.value,
              hash: baziHash.value,
              orderId: orderId.value
            })
          } else throw new Error('八字排盘服务未返回结果')
        } catch (e) {
          console.error(e)
          calculationError.value = e && e.message ? e.message : '八字排盘失败，请检查出生信息后重试。'
          phase.value = 'input'
          clearInterval(interval)
          return
        }

        setTimeout(() => {
          clearInterval(interval)
          phase.value = 'result'
        }, 4000)
      }

      const hashString = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 1000000007;
        return hash;
      }

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        unlockPlan(plan && plan.id, 'bazi')
        setStoredTestOrderId('bazi', plan && plan.orderId)
        hasPaid.value = true
        showPayment.value = false
        isTyping.value = true
        displayedDeepText.value = ''
        saveToArchive('Bazi', formData.value.name + '的八字报告', expandBaziText(baziResult.value.deep, baziHash.value));
        
        const baseText = expandBaziText(baziResult.value.deep, baziHash.value)
        const fullText = await generatePaidAIReport({
          testType: 'bazi',
          orderId: plan && plan.orderId,
          resultSummary: `${formData.value.name || '用户'}的八字日主：${baziResult.value.name}`,
          baseDeepReport: baseText,
          userInputs: formData.value,
          context: { result: baziResult.value }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value && baziResult.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('bazi') })
        }, 0)
      }

      
      const generatePoster = async () => {
        const posterEl = document.getElementById('bazi-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_Bazi_${baziResult.value.name}.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const getWuXingType = (name) => {
        if (!name) return 'wood';
        if (name.includes('木')) return 'wood';
        if (name.includes('火')) return 'fire';
        if (name.includes('土')) return 'earth';
        if (name.includes('金')) return 'metal';
        if (name.includes('水')) return 'water';
        return 'wood';
      };

      watch(phase, (newPhase) => {
        if (newPhase === 'result' && baziResult.value) {
          window.__northstarFx?.setPattern('wuxing', getWuXingType(baziResult.value.name))
          store.isPatternActive = true
        } else if (newPhase === 'input') {
          window.__northstarFx?.clearPattern()
          store.isPatternActive = false
          store.isImmersive = false
        }
      })

      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
        store.isPatternActive = false
        store.isImmersive = false
      })

      return {
        phase, formData, loadingText, startCalculation,
        baziResult,
        hasPaid, showPayment, handlePaymentSuccess, isTyping, displayedDeepText, orderId,
        generatePoster,
        locationMatches, isSearchingLocation, locationError, locationResolved, selectLocation,
        calculationError, formatBirthContext,
        restart: () => {
          clearResultDraft('bazi')
          clearAIReportCache('bazi')
          phase.value = 'input'
        },
        skipTypewriter
      }
    },
    template: `
      <main class="astro-test section">
        <transition name="fade" mode="out-in">
          
          <div v-if="phase === 'input'" key="input" class="astro-input-container">
            <div class="test-header" v-reveal>
              <p class="section-kicker">八字命盘</p>
              <h2>八字命理排盘</h2>
              <p class="lede" style="margin: 0 auto;">结合出生日期、时间与地点，整理你的命盘结构与人生节奏</p>
            </div>
            
            <div class="form-wrapper">
              <div class="input-group">
                <label>出生日期 (阳历) *</label>
                <input type="date" v-model="formData.date" class="astro-input" />
              </div>
              <div class="input-group">
                <label>出生时间 *</label>
                <input type="time" v-model="formData.time" class="astro-input" />
              </div>
              <div class="input-group location-search-group">
                <label>出生城市 *</label>
                <input type="search" v-model="formData.locationQuery" class="astro-input" autocomplete="off" placeholder="例如：荆州、东京、Paris" />
                <div class="location-search-status" v-if="isSearchingLocation">正在查找城市...</div>
                <div class="location-search-status resolved" v-else-if="locationResolved">已识别：{{ formData.locationLabel }}</div>
                <div class="location-suggestions" v-if="locationMatches.length">
                  <button type="button" v-for="location in locationMatches" :key="location.label + location.latitude" @click="selectLocation(location)">
                    <strong>{{ location.label }}</strong>
                    <span>{{ location.timezoneLabel }}</span>
                  </button>
                </div>
              </div>
              <p class="form-error" v-if="locationError || calculationError">{{ locationError || calculationError }}</p>
              <button class="primary-action full-width" :disabled="!formData.date || !formData.time || !formData.locationQuery.trim()" @click="startCalculation">开始八字排盘</button>
            </div>
          </div>

          <div v-else-if="phase === 'loading'" key="loading" class="astro-loading-container">
            <div class="astro-spinner">
              <div class="spinner-ring outer"></div>
              <div class="spinner-ring inner"></div>
              <div class="spinner-center"></div>
            </div>
            <h3 class="loading-title">{{ loadingText }}</h3>
          </div>

          <div v-else-if="phase === 'result'" key="result" class="astro-result-container">
            <h2 class="result-title">你的八字命盘</h2>
            <p class="result-context">{{ formatBirthContext(formData, baziResult.preview || {}) }}</p>
            
            <div class="reading-section">
              <h3>✦ 基础命元 (日主)</h3>
              <div class="reading-block">
                <div class="reading-block-header">
                  <span class="reading-card-name">{{ baziResult.symbol }} {{ baziResult.name }}</span>
                </div>
                <p class="reading-keywords">特质：{{ baziResult.short }}</p>
              </div>
            </div>

            <div class="deep-result-container">
              <div class="paywall-overlay" v-if="!hasPaid">
                <div class="paywall-content">
                  <h3>✦ 查看完整八字解读</h3>
                  <p>包含日主特点、阶段节奏、适合留意的选择方向，以及更完整的命盘说明。</p>
                  <div class="price">上线价 USD $7.99</div>
                  <div class="price-all" style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; margin-bottom: 8px;">全站终身解锁 (All-Access Pass): USD $39.99</div>
                  <button class="primary-action pay-btn" @click="showPayment = true">查看上线方案</button>
                </div>
              </div>

              <div class="deep-content ai-mode" v-if="hasPaid">
                <professional-report
                  :text="displayedDeepText"
                  :is-typing="isTyping"
                  title="八字命盘专业报告"
                  :result-label="baziResult?.name || '个人命盘解读'"
                  @skip="skipTypewriter"
                />
              </div>
            </div>

            <div class="result-actions">
              <button class="secondary-action" @click="restart">重新排盘</button>
              <router-link class="secondary-action" to="/">返回首页</router-link>
            </div>

            <PaymentModal v-if="showPayment" :orderId="orderId" @close="showPayment = false" @success="handlePaymentSuccess" />
          </div>

        </transition>
      
        <div id="bazi-poster-dom" style="position: absolute; left: -9999px; width: 375px; padding: 40px; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; border-radius: 20px; font-family: 'PingFang SC', sans-serif;">
          <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 20px; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #ff7e5f; letter-spacing: 4px;">北极星命盘报告</p>
            <h1 style="font-size: 32px; margin: 10px 0;">{{ baziResult?.name || '未知' }}</h1>
            <p style="font-size: 16px; color: rgba(255,255,255,0.6);">{{ baziResult?.element || '' }}</p>
          </div>
          <div style="font-size: 18px; line-height: 1.6; text-align: justify;">
            "{{ baziResult?.keywords?.join(' · ') || '' }}"
          </div>
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.3);">
            <p>北极星玄学档案库</p>
          </div>
        </div>

        <div class="action-area" v-if="hasPaid && !isTyping" style="margin-top: 40px;">
          <button class="primary-action" @click="generatePoster" style="background: linear-gradient(135deg, #ffd700, #ff8c00); color: #000;">
            ✧ 生成我的命局海报
          </button>
        </div>
    
      </main>
    `
  })

  // ─── Human Design Test Page ──────────────────────────────────
  const HumanDesignTest = defineComponent({
    name: 'HumanDesignTestPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const phase = ref('input') 
      const loadingText = ref('计算能量图谱...')
      
      const formData = ref({
        date: '',
        time: '',
        ...createBirthLocationFields()
      })
      const calculationError = ref('')
      const {
        locationMatches,
        isSearchingLocation,
        locationError,
        locationResolved,
        selectLocation,
        requireResolvedLocation
      } = useBirthLocation(formData)

      onMounted(() => {
        const draft = loadResultDraft('human-design')
        if (draft && draft.result && draft.formData) {
          formData.value = { ...formData.value, ...draft.formData }
          hdResult.value = draft.result
          hdHash.value = Number(draft.hash || 0)
          phase.value = 'result'
        }
      })

      const hdResult = ref(null)
      const hdHash = ref(0)


      const expandHDText = (baseText, hash) => {
        const seededRandom = (seed) => {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
        
        let seed = hash * 2;

        const banks = {
            centers: [
                "【九大能量中心透视】\n在你的能量蓝图中，最引人瞩目的是你那个完全敞开、没有任何定义的能量中心。这是一个极具欺骗性的存在——你常常在这个领域感到极度缺乏自信，试图拼命去证明自己。但实际上，这是你最伟大智慧的发源地。当你停止用借来的能量去表演，开始只是像一面镜子一样观察周围人的情绪与欲望时，你将获得惊人的洞察力。你不是来参与这场游戏的，你是来成为这个领域最顶级的裁判的。",
                "【核心动力源解析】\n你的能量场中，有一个极度强大且被完全点亮的动力中心。这股能量像是一个核反应堆，只要你处于‘做自己热爱的事情’的状态，你的精力就是无限的。但它的陷阱在于，如果你被社会的条条框框所绑架，去做了你内心深处根本不认可的事，这股庞大的能量就会反噬你，导致你出现严重的拖延、暴怒甚至免疫系统崩溃。学会尊重这股狂暴的生命力，是你的首要任务。",
                "【能量场的磁力效应】\n你的出厂设计决定了你是一个极其强烈的‘磁铁’。你的某些能量中心散发着一种让人无法抗拒的频率，这意味着你经常会在不知不觉中吸引别人来向你倾诉，甚至把他们的责任推给你。你需要建立极其严格的能量边界。你的课题是学会坚定地拒绝那些试图持续消耗你能量的人。只有当你把能量完全留给自己时，你的光芒才能真正照耀到那些值得的人。",
                "【未定义中心的深渊】\n你那几个空白的能量中心，就像是深不见底的黑洞。在非我状态下，你会疯狂地吸收别人的恐惧、焦虑和悲伤，然后把它们误认为是自己的情绪。这导致你经常莫名其妙地感到精疲力尽。你需要每天给自己安排至少一个小时的‘能量排毒期’，彻底远离人群，甚至关掉手机。在绝对的孤独中，把那些不属于你的振频从你的脊椎里排遣出去，这是你保持理智的唯一方式。",
                "【直觉与逻辑的交锋】\n在你的设计图中，直觉中心和逻辑中心正在发生剧烈的碰撞。你经常会在瞬间产生一个极其准确的直觉判断，但下一秒，你的大脑就会跳出来用各种逻辑去否定它。这导致了你人生中大量的错失与后悔。人类图给你的终极忠告是：你的头脑是用来观察世界和启发他人的，它绝对不能用来为你自己做决定。当面临重大抉择时，闭上你的大脑，去感受你身体的哪个部位在发热或是紧缩。"
            ],
            channels: [
                "【潜能觉醒：隐秘通道】\n你有一条极其罕见且极具突变能量的通道。这条通道赋予了你在绝境中强行撕开一条生路的能力。你天生就是旧秩序的破坏者，不要试图去迎合主流社会的价值观，那会让你窒息。当你能够毫无保留地展现出你那带有攻击性甚至有些疯狂的原创力时，那些真正属于你的资源和追随者才会到来。你的成功，注定是建立在无数人的不解和争议之上的。",
                "【天赋基因：炼金术士】\n在你的基因编码中，潜藏着一种类似‘炼金术’的天赋。你能够把别人眼里的垃圾、废料，通过你独特的视角和重新组合，转化为价值连城的黄金。你极具洞察本质的能力，能够一眼看穿事物的漏洞。但你要小心你语言的锋芒，你那不加修饰的真话常常会像刀子一样刺伤别人。学会把你的锐利包装在幽默或者温和的建议中，是你事业腾飞的关键催化剂。",
                "【通道连结：魔法网络】\n你的能量通道在你的体系内形成了一个极其复杂的闭环。这让你成为了一个完全自给自足的能量宇宙。你其实根本不需要外界的认同和指导，你所有的答案都在你自己的身体里。你最大的阻力来自于你的‘不耐心’。你太快看到了结局，却无法忍受过程的缓慢。学会与时间做朋友，把你的能量锚定在‘当下’的每一个微小动作上，你的宏大蓝图自然会显化。",
                "【天赋封印与解锁】\n你有一部分极其强大的天赋闸门，目前正处于被‘封印’的状态。这种封印来源于你童年时期某次因为‘表达真实的自己’而遭到的严厉打压。从那以后，你学会了隐藏自己的光芒。要想解除这个封印，你需要进行一次深度的内在小孩疗愈。你需要在一场极度的崩溃或愤怒中，把你被压抑的真实声音狂野地嘶吼出来。当那扇门被重新踢开，你的创造力将如同火山一般喷发。",
                "【喉轮与表达的艺术】\n你的通道直接连结或间接指向了你的喉咙中心。这意味着你的声音、你的文字具有改变现实的魔法力量。你是一个天生的显化者或导师。但是，如果你说出的话并不是出于你的内在权威，而是为了讨好别人，你的喉咙中心就会迅速萎缩，甚至引发甲状腺相关的健康问题。你要么保持高贵的沉默，要么就只说那些能震碎虚伪面具的绝对真理。"
            ],
            cross: [
                "【轮回交叉：意识觉醒】\n在本次投生中，你背负的轮回交叉（内心使命）极其厚重。你不是来这个世界上享乐的，你是作为‘意识的催化剂’被派遣到地球上的。你的存在本身，就是为了打破周围人虚假的幻象，逼迫他们面对真实的自己。因为这个原因，你可能会经历被人排挤或不被理解的孤独岁月。但这正是你的荣耀。当你能够坦然接受自己这个‘唤醒者’的身份时，你的孤独将转化为无可匹敌的力量。",
                "【内心使命：业力终结者】\n你的轮回交叉显示，你是你们家族乃至更庞大业力网络中的‘终结者’。你承担了清理几代人遗传下来的创伤和执念的重任。这也是为什么你的人生充满了那么多常人无法理解的戏剧性冲突。不要去抱怨命运的不公，因为你是唯一一个有足够高维能量去斩断这根诅咒链条的内心。当你完成了这个课题，你不仅解救了自己，更解放了无数个与你相连的内心。",
                "【轮回羁绊：爱与边界】\n你今生的核心课题，是在‘无条件的爱’与‘清晰而坚定的边界’之间找到平衡。你的轮回交叉让你天生具有一种极其广大的慈悲心，你总是想去拯救那些支离破碎的人。但宇宙要让你明白的真相是：你无法拯救任何人，除非他们自己决定醒来。你的使命是闪闪发光，成为一座灯塔，而不是跳进狂风巨浪中去当救生员。保护好你的火种，才是最大的慈悲。",
                "【天命之旅：在混沌中建构】\n你的内心蓝图是一场在废墟上建立新王国的史诗。你的轮回交叉赋予了你一眼看破旧有系统腐朽之处的能力，同时也给了你构建新秩序的智慧。在这个过程中，你必将遭遇旧势力的强烈反扑。你需要学习的不是如何战斗，而是如何‘不战而屈人之兵’。利用你的设计中自带的神秘感染力，让那些原本反对你的人，最终心甘情愿地成为你新秩序的建设者。",
                "【化身十字：精神的桥梁】\n你被设计成了一座连接物质世界与精神高维空间的桥梁。你一方面极度清醒、接地气，能够处理极其复杂的世俗事务；另一方面，你的内心深处又与宇宙的源头保持着神秘的链接。你最大的痛苦往往来源于试图在这两者之间二选一。其实，你的使命就是同时活在这两个维度里。你可以穿着高定西装在会议室里运筹帷幄，也可以在深夜里与宇宙的星辰对话，这就是你的终极形态。"
            ],
            strategy: [
                "【非我制约深度清理指南】\n你目前面临的最大障碍，就是你脑海中那个喋喋不休、试图控制一切的‘头脑’。为了清理掉这些非我制约，我给你一个极端的建议：在接下来的7天里，在任何非致命的小事上，完全违背你大脑的逻辑分析，纯粹依靠身体第一秒的反应（直觉或内脏感）去做决定。你会发现，虽然大脑在尖叫恐惧，但事情的走向却出奇的顺利。这就是找回内在权威的第一步。",
                "【排毒法则：告别消耗源】\n你的身体是一台极其精密的能量检测仪。当你和某人在一起，或者做某件事时，如果你的身体感到沉重、紧绷、想要逃离，那就立刻停止！不要用‘道德’、‘责任’或者‘面子’来逼迫自己留下来。你的基因设计是不允许你委曲求全的。每一次妥协，都在你的细胞里积攒毒素。从今天开始，把‘这让我开心吗’作为你衡量一切事物的唯一终极标准。",
                "【觉知训练：旁观者模式】\n当剧烈的情绪波涛袭来（无论是极度的狂喜还是深深的绝望），千万不要在这个时候做任何决定。你需要开启‘旁观者模式’。想象你的意识升到了天花板上，静静地看着下面那个正在情绪中挣扎的肉体。告诉自己：‘这只是一股正在穿过我身体的化学物质浪潮，它不是我。’当这股浪潮退去，水面重新恢复平静时，那个从心底浮现出来的答案，才是你真正的内在权威。",
                "【能量校准：回到出厂设置】\n为了剥离掉社会强加给你的层层制约，你需要找到一种只属于你的‘复位方式’。对你而言，可能是在深夜的高速公路上漫无目的地开车，可能是连续听3个小时某种特定频率的白噪音，也可能是在大雨中疯狂地跑一场。你需要这种带有仪式感的、甚至在别人看来有些怪异的行为，来把你散落在各处的能量场强行收回体内。定期进行复位，你将刀枪不入。",
                "【终极真理：放下控制权】\n人类图给你的最后一道箴言是：你这辈子所有的痛苦，都来源于你试图去‘主导’生命的方向。你的设计是完美的，宇宙早就为你铺好了一条毫不费力的顺流之路。你需要做的，只是坐在乘客的位置上，看着窗外的风景，等待正确的邀请、回应或者直觉的指引出现。当你彻底放下对人生的控制欲，彻底臣服于你内在的设计时，你梦寐以求的自由和丰盛，就会在下一秒奇迹般地降临。"
            ]
        };

        let result = baseText + "\n\n";
        result += banks.centers[Math.floor(seededRandom(seed++) * banks.centers.length)] + "\n\n";
        result += banks.channels[Math.floor(seededRandom(seed++) * banks.channels.length)] + "\n\n";
        result += banks.cross[Math.floor(seededRandom(seed++) * banks.cross.length)] + "\n\n";
        result += banks.strategy[Math.floor(seededRandom(seed++) * banks.strategy.length)];

        return result;
      }
      const hasPaid = ref(isTestUnlocked('human-design'))
      const showPayment = ref(false)
      const orderId = ref(null)
      const isTyping = ref(false)
      const displayedDeepText = ref('')

      const startCalculation = () => {
        if (!formData.value.date || !formData.value.time || !formData.value.locationQuery.trim()) return
        if (!requireResolvedLocation()) return
        calculationError.value = ''
        phase.value = 'loading'
        
        const texts = ['回溯出生前88天太阳弧...', '定位64卦能量中心...', '生成人体曼陀罗...', '分析人生角色与通道...']
        let i = 0
        const interval = setInterval(() => {
          if (i < texts.length) { loadingText.value = texts[i]; i++ }
        }, 800)

        setTimeout(() => {
          clearInterval(interval)
          generateReport()
          phase.value = 'result'
        }, 4000)
      }

      const hashString = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 1000000007;
        return hash;
      }

      const generateReport = () => {
        const seed = [
          formData.value.date,
          formData.value.time,
          formData.value.latitude,
          formData.value.longitude,
          formData.value.timezone
        ].join('|');
        const h = hashString(seed);
        hdHash.value = h;
        
        // Use a different prime multiplier to ensure variety from Bazi
        const typeIdx = (h * 13) % 5; 
        hdResult.value = HD_TYPES[typeIdx];
        saveResultDraft('human-design', {
          formData: formData.value,
          result: hdResult.value,
          hash: hdHash.value,
          orderId: orderId.value
        })
        if (hasPaid.value) {
          setTimeout(() => {
            handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('human-design') })
          }, 0)
        }
      }

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        unlockPlan(plan && plan.id, 'human-design')
        setStoredTestOrderId('human-design', plan && plan.orderId)
        hasPaid.value = true
        showPayment.value = false
        isTyping.value = true
        displayedDeepText.value = ''
        saveToArchive('Human Design', formData.value.name + '的人类图报告', expandHDText(hdResult.value.deep, hdHash.value));
        
        const baseText = expandHDText(hdResult.value.deep, hdHash.value)
        const fullText = await generatePaidAIReport({
          testType: 'human-design',
          orderId: plan && plan.orderId,
          resultSummary: `${formData.value.name || '用户'}的人类图类型：${hdResult.value.name}`,
          baseDeepReport: baseText,
          userInputs: formData.value,
          context: { result: hdResult.value }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value && hdResult.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('human-design') })
        }, 0)
      }

      
      const generatePoster = async () => {
        const posterEl = document.getElementById('hd-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_HD_${hdResult.value.name}.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      return {
        phase, formData, loadingText, startCalculation,
        hdResult,
        hasPaid, showPayment, handlePaymentSuccess, isTyping, displayedDeepText, orderId,
        generatePoster,
        locationMatches, isSearchingLocation, locationError, locationResolved, selectLocation,
        calculationError, formatBirthContext,
        restart: () => {
          clearResultDraft('human-design')
          clearAIReportCache('human-design')
          phase.value = 'input'
        },
        skipTypewriter
      }
    },
    template: `
      <main class="astro-test section">
        <transition name="fade" mode="out-in">
          
          <div v-if="phase === 'input'" key="input" class="astro-input-container">
            <div class="test-header" v-reveal>
              <p class="section-kicker">人类图</p>
              <h2>人类图解析</h2>
              <p class="lede" style="margin: 0 auto;">结合西方占星与东方易经，找到你唯一的出厂设置</p>
            </div>
            
            <div class="form-wrapper">
              <div class="input-group">
                <label>出生日期 (阳历) *</label>
                <input type="date" v-model="formData.date" class="astro-input" />
              </div>
              <div class="input-group">
                <label>出生时间 *</label>
                <input type="time" v-model="formData.time" class="astro-input" />
              </div>
              <div class="input-group location-search-group">
                <label>出生城市 *</label>
                <input type="search" v-model="formData.locationQuery" class="astro-input" autocomplete="off" placeholder="例如：荆州、东京、Paris" />
                <div class="location-search-status" v-if="isSearchingLocation">正在查找城市...</div>
                <div class="location-search-status resolved" v-else-if="locationResolved">已识别：{{ formData.locationLabel }}</div>
                <div class="location-suggestions" v-if="locationMatches.length">
                  <button type="button" v-for="location in locationMatches" :key="location.label + location.latitude" @click="selectLocation(location)">
                    <strong>{{ location.label }}</strong>
                    <span>{{ location.timezoneLabel }}</span>
                  </button>
                </div>
              </div>
              <p class="form-error" v-if="locationError || calculationError">{{ locationError || calculationError }}</p>
              <button class="primary-action full-width" :disabled="!formData.date || !formData.time || !formData.locationQuery.trim()" @click="startCalculation">生成人类图</button>
            </div>
          </div>

          <div v-else-if="phase === 'loading'" key="loading" class="astro-loading-container">
            <div class="astro-spinner">
              <div class="spinner-ring outer"></div>
              <div class="spinner-ring inner"></div>
              <div class="spinner-center"></div>
            </div>
            <h3 class="loading-title">{{ loadingText }}</h3>
          </div>

          <div v-else-if="phase === 'result'" key="result" class="astro-result-container">
            <h2 class="result-title">你的人类图设计</h2>
            <p class="result-context">{{ formatBirthContext(formData) }}</p>
            
            <div class="reading-section">
              <h3>✦ 基础能量类型</h3>
              <div class="reading-block">
                <div class="reading-block-header">
                  <span class="reading-card-name">{{ hdResult.symbol }} {{ hdResult.name }}</span>
                </div>
                <p class="reading-keywords">特质：{{ hdResult.short }}</p>
              </div>
            </div>

            <div class="deep-result-container">
              <div class="paywall-overlay" v-if="!hasPaid">
                <div class="paywall-content">
                  <h3>✦ 查看完整人类图解读</h3>
                  <p>包含你的类型、决策方式、能量中心状态，以及更适合自己的行动节奏。</p>
                  <div class="price">上线价 USD $7.99</div>
                  <div class="price-all" style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; margin-bottom: 8px;">全站终身解锁 (All-Access Pass): USD $39.99</div>
                  <button class="primary-action pay-btn" @click="showPayment = true">查看上线方案</button>
                </div>
              </div>

              <div class="deep-content ai-mode" v-if="hasPaid">
                <professional-report
                  :text="displayedDeepText"
                  :is-typing="isTyping"
                  title="人类图专业报告"
                  :result-label="hdResult?.name || '个人能量设计解读'"
                  @skip="skipTypewriter"
                />
              </div>
            </div>

            <div class="result-actions">
              <button class="secondary-action" @click="restart">重新生成</button>
              <router-link class="secondary-action" to="/">返回首页</router-link>
            </div>

            <PaymentModal v-if="showPayment" :orderId="orderId" @close="showPayment = false" @success="handlePaymentSuccess" />
          </div>

        </transition>
      
        <div id="hd-poster-dom" style="position: absolute; left: -9999px; width: 375px; padding: 40px; background: linear-gradient(135deg, #2a0845, #6441A5); color: white; border-radius: 20px; font-family: 'PingFang SC', sans-serif;">
          <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 20px; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #ffb88e; letter-spacing: 4px;">人类图报告</p>
            <h1 style="font-size: 32px; margin: 10px 0;">{{ hdResult?.name || '未知' }}</h1>
            <p style="font-size: 16px; color: rgba(255,255,255,0.6);">能量类型设计图</p>
          </div>
          <div style="font-size: 18px; line-height: 1.6; text-align: justify;">
            核心策略: {{ hdResult?.strategy || '' }}
          </div>
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.3);">
            <p>北极星玄学档案库</p>
          </div>
        </div>

        <div class="action-area" v-if="hasPaid && !isTyping" style="margin-top: 40px;">
          <button class="primary-action" @click="generatePoster" style="background: linear-gradient(135deg, #ffb88e, #ea5753); color: #fff;">
            ✧ 生成我的人类图海报
          </button>
        </div>
    
      </main>
    `
  })

  const App = defineComponent({
    name: 'AppShell',
    setup() {
      const setLanguage = event => i18n.setLocale(event.target.value)
      const route = useRoute()
      
      // 当路由改变时，自动退出纯享模式并重置图腾激活标志
      watch(() => route.path, () => {
        store.isImmersive = false
        store.isPatternActive = false
      })

      const shellLabels = computed(() => activeLocale.value === 'en'
        ? {
            homeAria: 'Northstar home',
            brand: 'Northstar',
            brandSub: 'Insight Observatory',
            navAria: 'Main navigation',
            home: 'Home',
            lobby: 'Test Lobby',
            language: 'Language',
            chinese: 'Chinese (Simplified)',
            immersivePeek: '✦ Immersive View',
            immersiveBack: '✦ Back to Report'
          }
        : {
            homeAria: '北极星首页',
            brand: '北极星',
            brandSub: '命运观测站',
            navAria: '主导航',
            home: '首页',
            lobby: '测试大厅',
            language: '语言',
            chinese: '简体中文',
            immersivePeek: '✦ 纯享图腾',
            immersiveBack: '✦ 返回报告'
          })
      return { store, route, locale: activeLocale, shellLabels, setLanguage, localizedLegalHref }
    },
    methods: {
      comingSoon() {
        alert('该模块正在升级中，敬请期待！')
      },
      goToBlocks() {
        store.homePhase = 'menu'
        if (this.$route.path !== '/') {
          this.$router.push('/')
        }
      }
    },
    template: `
      <div :class="['app-wrapper', { 'immersive-active': store.isImmersive }]">
        <header class="site-header">
          <router-link to="/" class="brand" :aria-label="shellLabels.homeAria">
            <span class="brand-star">✦</span>
            <span class="brand-text">{{ shellLabels.brand }}</span>
            <span class="brand-sub">{{ shellLabels.brandSub }}</span>
          </router-link>
          <nav class="nav" :aria-label="shellLabels.navAria">
            <router-link to="/" @click="store.homePhase = 'hero'">{{ shellLabels.home }}</router-link>
            <a href="#" @click.prevent="goToBlocks">{{ shellLabels.lobby }}</a>
          </nav>
          <label class="language-switcher">
            <span class="sr-only">{{ shellLabels.language }}</span>
            <select class="site-language-select" :value="locale" @change="setLanguage" :aria-label="shellLabels.language">
              <option value="zh-CN">{{ shellLabels.chinese }}</option>
              <option value="en">English</option>
            </select>
          </label>
        </header>
        <router-view v-slot="{ Component }">
          <transition name="menu-reveal" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
        <footer class="footer">
          <span>✦ 北极星 · 自我与关系分析平台</span>
          <span class="footer-links">
            <a :href="localizedLegalHref('./terms.html')">用户协议与免责声明</a>
            <a :href="localizedLegalHref('./privacy.html')">隐私政策</a>
            <a :href="localizedLegalHref('./refund.html')">退款规则</a>
            <a :href="localizedLegalHref('./support.html')">客服与售后</a>
            <router-link to="/restore-purchase">恢复购买</router-link>
          </span>
          <span>© 2026 保留所有权利</span>
        </footer>

        <!-- 沉浸式图腾纯享背景遮罩 (点击全屏空白处返回报告) -->
        <div v-if="store.isImmersive" class="immersive-overlay" @click="store.isImmersive = false"></div>

        <!-- 浮动“纯享图腾/沉浸观星”按钮 (常规状态展示，供用户切入) -->
        <button v-if="store.isPatternActive && !store.isImmersive" class="immersive-trigger-btn" @click="store.isImmersive = true">
          {{ shellLabels.immersivePeek }}
        </button>

        <!-- “返回报告”控制栏 (沉浸模式下浮现于屏幕最下方中央) -->
        <div v-if="store.isImmersive" class="immersive-control-container">
          <button class="immersive-exit-btn" @click="store.isImmersive = false">
            {{ shellLabels.immersiveBack }}
          </button>
        </div>
      </div>
    `
  })


  // ─── Astrology Test Page ──────────────────────────────────────
  let ZODIAC_TRAITS = {};
  setTimeout(() => {
    if (window.ASTROLOGY_DATA && window.ASTROLOGY_DATA.zodiacs) {
      const zKeys = ["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"];
      zKeys.forEach(k => {
        const fullKey = Object.keys(window.ASTROLOGY_DATA.zodiacs).find(x => x.includes(k));
        if (fullKey) {
          ZODIAC_TRAITS[k] = window.ASTROLOGY_DATA.zodiacs[fullKey];
        } else {
          ZODIAC_TRAITS[k] = { desc: "神秘特质", deep: "星象被迷雾遮蔽" };
        }
      });
    }
  }, 0);
  const SUN_SIGN_PROFILES = [
    { sign: '摩羯座', start: 1222, end: 119, range: '12月22日－1月19日', element: '土象', modality: '开创', keywords: ['目标感', '责任感', '长期主义'] },
    { sign: '水瓶座', start: 120, end: 218, range: '1月20日－2月18日', element: '风象', modality: '固定', keywords: ['独立思考', '边界感', '创新'] },
    { sign: '双鱼座', start: 219, end: 320, range: '2月19日－3月20日', element: '水象', modality: '变动', keywords: ['共情', '想象力', '感受力'] },
    { sign: '白羊座', start: 321, end: 419, range: '3月21日－4月19日', element: '火象', modality: '开创', keywords: ['行动力', '直接', '开拓'] },
    { sign: '金牛座', start: 420, end: 520, range: '4月20日－5月20日', element: '土象', modality: '固定', keywords: ['稳定', '耐心', '感官体验'] },
    { sign: '双子座', start: 521, end: 621, range: '5月21日－6月21日', element: '风象', modality: '变动', keywords: ['好奇心', '表达', '适应力'] },
    { sign: '巨蟹座', start: 622, end: 722, range: '6月22日－7月22日', element: '水象', modality: '开创', keywords: ['照顾', '安全感', '记忆'] },
    { sign: '狮子座', start: 723, end: 822, range: '7月23日－8月22日', element: '火象', modality: '固定', keywords: ['创造力', '自尊', '感染力'] },
    { sign: '处女座', start: 823, end: 922, range: '8月23日－9月22日', element: '土象', modality: '变动', keywords: ['分析', '秩序', '改进'] },
    { sign: '天秤座', start: 923, end: 1023, range: '9月23日－10月23日', element: '风象', modality: '开创', keywords: ['平衡', '审美', '协作'] },
    { sign: '天蝎座', start: 1024, end: 1122, range: '10月24日－11月22日', element: '水象', modality: '固定', keywords: ['洞察', '深度', '韧性'] },
    { sign: '射手座', start: 1123, end: 1221, range: '11月23日－12月21日', element: '火象', modality: '变动', keywords: ['探索', '坦率', '意义感'] }
  ];

  const getSunSignProfile = (date) => {
    const parts = String(date || '').split('-').map(Number);
    if (parts.length !== 3 || !parts[1] || !parts[2]) return null;
    const dateKey = parts[1] * 100 + parts[2];
    return SUN_SIGN_PROFILES.find(profile => (
      profile.start > profile.end
        ? dateKey >= profile.start || dateKey <= profile.end
        : dateKey >= profile.start && dateKey <= profile.end
    )) || null;
  };



  // ─── BAZI DATABASE ────────────────────────────────────────



  const AstrologyTest = defineComponent({
    name: 'AstrologyTestPage',
    setup() {
      const router = useRouter()
      const phase = ref('input') 
      const formData = ref({
        date: '',
        time: '',
        ...createBirthLocationFields()
      })
      const loadingText = ref('正在把出生时间转换为 UTC...')
      const report = ref(null)
      const isGenerating = ref(false)
      const calculationError = ref('')
      const {
        locationMatches,
        isSearchingLocation,
        locationError,
        locationResolved,
        selectLocation,
        requireResolvedLocation
      } = useBirthLocation(formData)

      const startCalculation = async () => {
        if (!formData.value.date || !formData.value.time || !formData.value.locationQuery.trim()) return;
        if (!requireResolvedLocation()) return
        calculationError.value = ''
        phase.value = 'loading'
        
        const texts = ['转换历史时区与夏令时...', '读取太阳、月亮与行星星历...', '计算上升点与整宫制宫位...', '识别主要相位并生成星盘...']
        let i = 0
        const interval = setInterval(() => {
          if (i < texts.length) {
            loadingText.value = texts[i]
            i++
          }
        }, 650)

        try {
          const response = await fetch('/api/tests/astrology/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: formData.value.date,
              time: formData.value.time,
              location: formData.value.locationLabel || formData.value.locationQuery,
              latitude: Number(formData.value.latitude),
              longitude: Number(formData.value.longitude),
              timezone: formData.value.timezone,
              locale: currentLocale()
            })
          })
          const data = await response.json()
          if (!response.ok || !data.preview) throw new Error(data.error || '星盘计算失败')
          orderId.value = data.orderId
          generateReport(data.preview)
          phase.value = 'result'
          if (isTestUnlocked('astrology')) {
            handlePaymentSuccess({ id: 'single', orderId: data.orderId })
          } else {
            showPayment.value = true
          }
        } catch (error) {
          calculationError.value = error && error.message ? error.message : '星盘计算失败，请检查出生信息后重试。'
          phase.value = 'input'
        } finally {
          clearInterval(interval)
        }
      }

      const generateReport = (chart) => {
        const profile = SUN_SIGN_PROFILES.find(item => item.sign === chart.sunSign) || {};
        const trait = ZODIAC_TRAITS[chart.sunSign] || {};
        report.value = {
          ...chart,
          ...profile,
          sign: chart.sunSign,
          summary: trait.desc || '',
          deep: trait.deep || ''
        }
        saveResultDraft('astrology', {
          formData: formData.value,
          report: report.value
        })
      }

      const downloadPoster = () => {
        const posterEl = document.getElementById('astral-poster')
        if (!posterEl) return
        
        isGenerating.value = true
        posterEl.style.display = 'block' // make visible for canvas
        
        setTimeout(() => {
          html2canvas(posterEl, { 
            scale: 2, 
            backgroundColor: '#050505',
            useCORS: true
          }).then(canvas => {
            const link = document.createElement('a')
            link.download = `Northstar_Astral_Blueprint_${formData.value.date}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
            posterEl.style.display = 'none'
            isGenerating.value = false
          }).catch(err => {
            console.error('Canvas error:', err)
            posterEl.style.display = 'none'
            isGenerating.value = false
            alert("生成海报失败，请重试")
          })
        }, 100)
      }

      const goHome = () => {
        router.push('/')
      }

      const showPayment = ref(false)
      const orderId = ref(null)
      const hasPaid = ref(isTestUnlocked('astrology'))
      const isTyping = ref(false)
      const displayedDeepText = ref('')
      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)

      const handlePaymentSuccess = async (plan) => {
        if (!report.value) return
        unlockPlan(plan && plan.id, 'astrology')
        setStoredTestOrderId('astrology', plan && plan.orderId)
        hasPaid.value = true
        showPayment.value = false
        isTyping.value = true
        displayedDeepText.value = ''
        const planetLines = report.value.planets.map(planet =>
          `${planet.name}：${planet.sign} ${planet.degree} · 第${planet.house}宫${planet.retrograde ? ' · 逆行' : ''}`
        ).join('\n')
        const aspectLines = report.value.aspects.slice(0, 12).map(aspect =>
          `${aspect.from} ${aspect.type} ${aspect.to}（容许度 ${aspect.orb}°）`
        ).join('\n')
        
        const baseText = `【本命星盘核心】\n太阳：${report.value.sunSign}\n月亮：${report.value.moonSign}\n上升：${report.value.ascendant.sign} ${report.value.ascendant.degree}\n天顶：${report.value.midheaven.sign} ${report.value.midheaven.degree}\n宫位制：整宫制\n\n【行星落点】\n${planetLines}\n\n【主要相位】\n${aspectLines || '本次未识别到容许度内的主要相位。'}\n\n【太阳星座深度解读：${report.value.sign}】\n${report.value.deep}`;
        
        const fullText = await generatePaidAIReport({
          testType: 'astrology',
          orderId: plan && plan.orderId,
          resultSummary: `太阳${report.value.sunSign} 月亮${report.value.moonSign} 上升${report.value.ascendant.sign}`,
          baseDeepReport: baseText,
          userInputs: formData.value,
          context: report.value
        })

        saveToArchive('Astrology', '本命星盘报告', fullText);
        startTypewriter(fullText);
      }

      const signMap = {
        '白羊座': 'Aries', '金牛座': 'Taurus', '双子座': 'Gemini', '巨蟹座': 'Cancer',
        '狮子座': 'Leo', '处女座': 'Virgo', '天秤座': 'Libra', '天蝎座': 'Scorpio',
        '射手座': 'Sagittarius', '摩羯座': 'Capricorn', '水瓶座': 'Aquarius', '双鱼座': 'Pisces'
      };

      watch(phase, (newPhase) => {
        if (newPhase === 'result' && report.value) {
          const engSign = signMap[report.value.sign] || report.value.sign
          window.__northstarFx?.setPattern('constellation', engSign)
          store.isPatternActive = true
        } else if (newPhase === 'input') {
          window.__northstarFx?.clearPattern()
          store.isPatternActive = false
          store.isImmersive = false
        }
      }, { immediate: true })

      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
        store.isPatternActive = false
        store.isImmersive = false
      })

      const restartTest = () => {
        localStorage.removeItem('northstar_draft_astrology')
        report.value = null
        displayedDeepText.value = ''
        phase.value = 'input'
      }

      // ─── 恢复草稿与付费长报告逻辑 ───
      onMounted(() => {
        const draft = loadResultDraft('astrology')
        if (draft && draft.report && draft.formData) {
          formData.value = { ...formData.value, ...draft.formData }
          report.value = draft.report
          phase.value = 'result'
          if (hasPaid.value) {
            setTimeout(() => {
              handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('astrology') })
            }, 0)
          } else {
            showPayment.value = true
          }
        }
      })

      return { 
        phase, formData, loadingText, report, startCalculation, goHome, downloadPoster, isGenerating,
        showPayment, hasPaid, isTyping, displayedDeepText, handlePaymentSuccess, orderId,
        locationMatches, isSearchingLocation, selectLocation, calculationError, locationResolved,
        locationError, formatBirthContext, restartTest
      }
    },
    template: `
      <main class="test-container astro-test">
        <transition name="fade" mode="out-in">
          
          <!-- Input Phase -->
          <div v-if="phase === 'input'" key="input" class="astro-input-container">
            <div class="test-header" v-reveal>
              <p class="section-kicker">真实星历计算</p>
              <h2>生成你的本命星盘</h2>
              <p class="lede" style="margin: 0 auto;">输入准确的出生日期、时间和地点，计算太阳、月亮、行星、上升点、宫位与主要相位。</p>
            </div>
            
            <div class="form-wrapper" v-reveal style="transition-delay: 0.1s">
              <div class="input-group">
                <label>出生日期 *</label>
                <input type="date" v-model="formData.date" class="astro-input" />
              </div>
              <div class="input-group">
                <label>出生时间 *</label>
                <input type="time" v-model="formData.time" class="astro-input" />
              </div>
              <div class="input-group location-search-group">
                <label>出生城市 *</label>
                <input type="search" v-model="formData.locationQuery" class="astro-input" autocomplete="off" placeholder="例如：北京、东京、上海" />
                <div class="location-search-status" v-if="isSearchingLocation">正在查找城市...</div>
                <div class="location-search-status resolved" v-else-if="locationResolved">已识别：{{ formData.locationLabel }}</div>
                <div class="location-suggestions" v-if="locationMatches.length">
                  <button type="button" v-for="location in locationMatches" :key="location.label + location.latitude" @click="selectLocation(location)">
                    <strong>{{ location.label }}</strong>
                    <span>{{ location.timezoneLabel }}</span>
                  </button>
                </div>
              </div>
              <p class="form-error" v-if="locationError || calculationError">{{ locationError || calculationError }}</p>
              
              <button class="primary-action full-width" 
                      :disabled="!formData.date || !formData.time || !formData.locationQuery.trim()" 
                      @click="startCalculation">精确计算本命星盘</button>
            </div>
          </div>

          <!-- Loading Phase -->
          <div v-else-if="phase === 'loading'" key="loading" class="astro-loading-container">
            <div class="astro-spinner">
              <div class="spinner-ring outer"></div>
              <div class="spinner-ring inner"></div>
              <div class="spinner-center"></div>
            </div>
            <h3 class="loading-title">{{ loadingText }}</h3>
            <p class="loading-sub">使用真实星历计算，不生成随机结果</p>
          </div>

          <!-- Result Phase -->
          <div v-else-if="phase === 'result'" key="result" class="astro-result-container">
            <div class="test-header" v-reveal>
              <p class="section-kicker">你的本命星盘</p>
              <h2>太阳 {{ report.sunSign }} · 月亮 {{ report.moonSign }} · 上升 {{ report.ascendant.sign }}</h2>
              <p class="lede" style="margin: 0 auto;">{{ formatBirthContext(formData, report) }}</p>
            </div>

            <section class="astro-section" v-reveal style="transition-delay: 0.1s">
              <h3 class="section-title">核心四轴 <span>太阳 月亮 上升 天顶</span></h3>
              <div class="planet-grid">
                <div class="planet-card">
                  <span class="planet-name">太阳</span>
                  <strong class="planet-sign">{{ report.sunSign }}</strong>
                </div>
                <div class="planet-card">
                  <span class="planet-name">月亮</span>
                  <strong class="planet-sign">{{ report.moonSign }}</strong>
                </div>
                <div class="planet-card">
                  <span class="planet-name">上升</span>
                  <strong class="planet-sign">{{ report.ascendant.sign }} {{ report.ascendant.degree }}</strong>
                </div>
                <div class="planet-card">
                  <span class="planet-name">天顶 MC</span>
                  <strong class="planet-sign">{{ report.midheaven.sign }} {{ report.midheaven.degree }}</strong>
                </div>
              </div>
              <div class="sun-sign-summary">
                <p>{{ report.summary }}</p>
                <div class="sun-sign-keywords">
                  <span v-for="keyword in report.keywords" :key="keyword">{{ keyword }}</span>
                </div>
              </div>
            </section>

            <section class="astro-section" v-reveal>
              <h3 class="section-title">行星落点 <span>真黄道坐标 · 整宫制</span></h3>
              <div class="planet-position-table">
                <div class="planet-position-row" v-for="planet in report.planets" :key="planet.id">
                  <strong>{{ planet.name }}</strong>
                  <span>{{ planet.sign }} {{ planet.degree }}</span>
                  <span>第 {{ planet.house }} 宫</span>
                  <span class="retrograde-badge" v-if="planet.retrograde">逆行</span>
                </div>
              </div>
            </section>

            <section class="astro-section" v-if="report.aspects.length" v-reveal>
              <h3 class="section-title">主要相位 <span>按容许度排序</span></h3>
              <div class="aspect-grid">
                <div class="aspect-card" v-for="aspect in report.aspects.slice(0, 12)" :key="aspect.from + aspect.type + aspect.to">
                  <strong>{{ aspect.from }} {{ aspect.type }} {{ aspect.to }}</strong>
                  <span>容许度 {{ aspect.orb }}°</span>
                </div>
              </div>
            </section>

            <!-- Paywall / Deep Content -->
            <div class="deep-result-container" style="margin-top: 40px;">
              <div class="paywall-overlay" v-if="!hasPaid">
                <div class="paywall-content">
                  <h3>✦ 查看完整星盘解读</h3>
                  <p>包含性格底色、情绪运行、关系盲点和成长提示。</p>
                  <div class="price">上线价 USD $7.99</div>
                  <div class="price-all" style="font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; margin-bottom: 8px;">全站终身解锁 (All-Access Pass): USD $39.99</div>
                  <button class="primary-action pay-btn" @click="showPayment = true">查看上线方案</button>
                </div>
              </div>

              <div class="deep-content ai-mode" v-if="hasPaid">
                 <professional-report
                   :text="displayedDeepText"
                   :is-typing="isTyping"
                   title="本命星盘专业报告"
                   result-label="个人星盘深度解读"
                 />
              </div>
            </div>

            <PaymentModal v-if="showPayment" :orderId="orderId" @close="showPayment = false" @success="handlePaymentSuccess" />

            <!-- Actions -->
            <div class="actions" v-reveal style="transition-delay: 0.4s; margin-top: 60px; justify-content: center; gap: 20px; flex-wrap: wrap;">
               <button class="primary-action" :disabled="isGenerating" @click="downloadPoster">
                  {{ isGenerating ? '正在生成海报...' : '生成星盘海报' }}
               </button>
               <button class="secondary-action" @click="restartTest">重新测试</button>
               <button class="secondary-action" @click="goHome">返回探索大厅</button>
            </div>
          </div>
        </transition>

        <!-- Hidden Poster Template -->
        <div v-if="report" id="astral-poster" class="astral-poster">
           <div class="poster-border">
             <div class="poster-header">
                <h2>本命星盘报告</h2>
                <p>北极星自我探索报告</p>
             </div>
             
             <div class="poster-chart">
                <div class="astral-wheel"></div>
                <div class="astral-center-info">
                   <div class="ac-item"><span>太阳</span><strong>{{ report.sunSign }}</strong></div>
                   <div class="ac-item"><span>月亮</span><strong>{{ report.moonSign }}</strong></div>
                   <div class="ac-item"><span>上升</span><strong>{{ report.ascendant.sign }}</strong></div>
                </div>
             </div>
             
             <div class="poster-details">
                <div class="pd-row"><span>出生时间</span><span>{{ formData.date }} {{ formData.time }}</span></div>
                <div class="pd-row"><span>出生地点</span><span>{{ formData.locationLabel || formData.locationQuery }}</span></div>
             </div>
             
             <div class="poster-footer">
                <p>星空不只在远方，也映在每个人的内在秩序里。</p>
             </div>
           </div>
        </div>

      </main>
    `
  })


  
  // ─── AURA TEST PAGE ─────────────────────────────────────────
  const AURA_QUESTIONS = [
    { text: '走进一个空无一人的房间，你首先会被什么吸引？', options: [ { text: '窗外透进来的光束', color: 'yellow' }, { text: '角落里静止的植物', color: 'green' }, { text: '空气中微妙的温度变化', color: 'blue' }, { text: '地板上的阴影与纹理', color: 'purple' } ] },
    { text: '如果可以把自己的情绪实体化，你觉得它最像：', options: [ { text: '熊熊燃烧的营火', color: 'red' }, { text: '缓缓流动的深水', color: 'blue' }, { text: '自由穿梭的微风', color: 'yellow' }, { text: '坚固厚实的晶石', color: 'green' } ] },
    { text: '当你感到极度疲惫时，哪种场景能让你最快回血？', options: [ { text: '在热闹的音乐节里疯狂出汗', color: 'red' }, { text: '独自一人在海边看海浪发呆', color: 'blue' }, { text: '和两三个挚友在咖啡馆深度对谈', color: 'orange' }, { text: '睡在一个完全黑暗安静的房间', color: 'purple' } ] },
    { text: '在一段完美的关系里，你最看重的是什么？', options: [ { text: '绝对的激情与同步的行动力', color: 'red' }, { text: '内心深处的相互理解与包容', color: 'blue' }, { text: '能够共同成长、探索未知', color: 'yellow' }, { text: '稳固的安全感与日常陪伴', color: 'green' } ] },
    { text: '如果宇宙只给你一种魔法，你希望是：', options: [ { text: '读心术：看透所有的真实想法', color: 'purple' }, { text: '治愈术：抚平一切伤痛', color: 'green' }, { text: '时间跃迁：回到过去或去往未来', color: 'blue' }, { text: '显化术：让想象瞬间变成现实', color: 'orange' } ] },
    { text: '当你置身于森林中，你首先听到的声音是：', options: [ { text: '踩在落叶上的清脆声', color: 'orange' }, { text: '远处传来的流水声', color: 'blue' }, { text: '树叶在风中沙沙作响', color: 'yellow' }, { text: '某种不知名动物的低鸣', color: 'purple' } ] },
    { text: '朋友遇到挫折向你倾诉，你的第一反应是：', options: [ { text: '立刻帮TA分析问题并给出解决方案', color: 'red' }, { text: '给TA一个大大的拥抱，静静陪伴', color: 'green' }, { text: '带TA去吃顿好的，或者出去嗨', color: 'orange' }, { text: '引导TA换个角度思考，寻找深层意义', color: 'purple' } ] },
    { text: '如果你是一座建筑，你会是：', options: [ { text: '一座历史悠久、充满藏书的古老城堡', color: 'purple' }, { text: '一座四面透明、阳光充足的玻璃房', color: 'yellow' }, { text: '一座依山傍水、融于自然的木屋', color: 'green' }, { text: '一座现代感十足、功能齐全的摩天大楼', color: 'red' } ] },
    { text: '当你在处理一项复杂的工作时，你的工作台通常是：', options: [ { text: '井井有条，每个物品都有固定的位置', color: 'green' }, { text: '看似杂乱，但我总能精准找到需要的东西', color: 'orange' }, { text: '只放最必要的几件东西，极其极简', color: 'blue' }, { text: '摆满了各种能给我灵感的小物件', color: 'yellow' } ] },
    { text: '面对突如其来的变化，你的内心独白更接近：', options: [ { text: '“太棒了，终于有新鲜事发生了！”', color: 'orange' }, { text: '“有点慌，但我能迅速调整计划。”', color: 'red' }, { text: '“无所谓，顺其自然吧。”', color: 'blue' }, { text: '“这背后一定有什么更深的寓意。”', color: 'purple' } ] },
    { text: '当看见晴朗夜空里的满月，你更容易联想到：', options: [ { text: '某种照亮前路的指引', color: 'yellow' }, { text: '月光下的平静湖面', color: 'blue' }, { text: '远古神话里的神秘力量', color: 'purple' }, { text: '月亮散发的温暖光晕', color: 'orange' } ] },
    { text: '如果要选择一种乐器来代表你，你会是：', options: [ { text: '节奏强烈的架子鼓', color: 'red' }, { text: '优雅悠长的古筝或小提琴', color: 'blue' }, { text: '清脆欢快的吉他', color: 'yellow' }, { text: '空灵疗愈的颂钵或手碟', color: 'green' } ] },
    { text: '你最喜欢的季节感觉是：', options: [ { text: '骄阳似火、充满汗水的盛夏', color: 'red' }, { text: '秋高气爽、落叶丰收的秋天', color: 'orange' }, { text: '万物复苏、微风拂面的初春', color: 'green' }, { text: '雪花纷飞、万籁寂静的深冬', color: 'blue' } ] },
    { text: '当你置身于美术馆，你更可能在一幅怎样的画作前驻足？', options: [ { text: '色彩强烈、冲击力极强的抽象油画', color: 'red' }, { text: '线条柔和、意境深远的写意山水画', color: 'blue' }, { text: '色彩明快、充满童趣的印象派插画', color: 'yellow' }, { text: '充满宗教神秘感或象征主义的古典名画', color: 'purple' } ] },
    { text: '当你在路边看到一只无家可归的小猫，你首先会：', options: [ { text: '心疼不已，立刻想买猫罐头喂它', color: 'green' }, { text: '在安全距离蹲下，温和地用眼神和它打招呼', color: 'blue' }, { text: '觉得它非常可爱，拍张照片分享给朋友', color: 'yellow' }, { text: '直接伸手去逗它，试图和它玩耍', color: 'orange' } ] },
    { text: '你觉得哪种生活状态最能形容你最近的节奏？', options: [ { text: '拼命奔跑，充满目标和斗志', color: 'red' }, { text: '悠闲自得，享受生活的每一刻慢节奏', color: 'green' }, { text: '头脑风暴，不断有新的思路和火花', color: 'yellow' }, { text: '沉思静养，更多在反思和梳理内心', color: 'purple' } ] },
    { text: '当你要向他人展示自己的想法时，你更倾向于：', options: [ { text: '用饱满的热情和强烈的感染力去打动对方', color: 'red' }, { text: '用客观的数据、清晰的幻灯片和图表说服对方', color: 'blue' }, { text: '用幽默的段子和创意故事让大家在笑声中理解', color: 'orange' }, { text: '用充满隐喻和概念性的比喻引导对方自己去悟', color: 'purple' } ] },
    { text: '如果你能拥有一座私人花园，你希望它是：', options: [ { text: '种满奇花异草、色彩斑斓的异域花园', color: 'orange' }, { text: '鸟语花香、充满绿植和秋千的疗愈庄园', color: 'green' }, { text: '有精致日式枯山水和茶室的禅意庭院', color: 'purple' }, { text: '视野开阔、阳光洒在草坪上的欧式阳光房', color: 'yellow' } ] },
    { text: '在你看来，人生的终极追求是：', options: [ { text: '轰轰烈烈地赢一次，实现宏大抱负', color: 'red' }, { text: '找到内心的伴侣，体验无条件的爱与理解', color: 'blue' }, { text: '永无止境地探索世界的多元与智慧', color: 'yellow' }, { text: '身体健康，内心平和且无病无痛', color: 'green' } ] },
    { text: '当你看到美丽的日落霞光，你内心的情感是：', options: [ { text: '“大自然太壮美了，我也想去追逐这光芒。”', color: 'red' }, { text: '“终于结束了忙碌的一天，真舒服啊。”', color: 'green' }, { text: '感到一种淡淡的忧伤，感叹美好的短暂', color: 'purple' }, { text: '“明天一定又是美好且充满创造力的一天！”', color: 'orange' } ] },
    { text: '走进一片未知的迷雾，你第一反应是：', options: [ { text: '兴奋，觉得是一场新冒险的开始', color: 'red' }, { text: '警惕，先站在边缘观察雾气的流动', color: 'blue' }, { text: '释放，感觉迷雾能隐蔽自己的情绪', color: 'purple' }, { text: '温暖，伸出手去触碰这湿润的空气', color: 'green' } ] },
    { text: '如果你被要求在一片寂静的画布上画第一笔，你会画：', options: [ { text: '粗犷鲜艳的红色线条', color: 'red' }, { text: '温暖流动的黄色圆圈', color: 'yellow' }, { text: '细腻柔和的绿色树叶', color: 'green' }, { text: '神秘深邃的紫色斑点', color: 'purple' } ] },
    { text: '在古老的遗迹中，你发现了一个发光的石碑，你觉得这光芒代表：', options: [ { text: '远古的警示与危险', color: 'red' }, { text: '被遗忘的文明智慧', color: 'yellow' }, { text: '某种纯净的疗愈能量', color: 'green' }, { text: '开启异时空的法阵', color: 'purple' } ] },
    { text: '当被问及“你认为爱是什么颜色”，你的第一直觉是：', options: [ { text: '充满激情的火焰红', color: 'red' }, { text: '温暖包容的橘黄光', color: 'orange' }, { text: '宁静治愈的森林绿', color: 'green' }, { text: '纯净深邃的海洋蓝', color: 'blue' } ] },
    { text: '如果你的思维是一条河，你觉得它正流向：', options: [ { text: '奔腾咆哮的大瀑布', color: 'red' }, { text: '阳光普照的开阔湖泊', color: 'yellow' }, { text: '绕过森林的静谧溪流', color: 'blue' }, { text: '汇入神秘大洋的深水', color: 'purple' } ] },
    { text: '你在一座古老图书馆的地下室发现了一本发黄的日记，你最希望里面写着：', options: [ { text: '宝藏的埋藏地点与路线', color: 'orange' }, { text: '某个重大的历史未解之谜', color: 'yellow' }, { text: '撰写者的感人爱情故事', color: 'blue' }, { text: '某种能与自然对话的秘术', color: 'purple' } ] },
    { text: '当你凝视着燃烧的蜡烛，最让你着迷的是：', options: [ { text: '火苗跳跃时的力量与炽热', color: 'red' }, { text: '烛光周围那一圈温暖的橙光', color: 'orange' }, { text: '蜡烛静静融化的流淌感', color: 'blue' }, { text: '烟雾升腾时的虚无与神秘', color: 'purple' } ] },
    { text: '如果有一只小鸟飞落在你肩膀上，你觉得它想传达：', options: [ { text: '一个新奇的冒险邀请', color: 'orange' }, { text: '某种古老智慧的启示', color: 'yellow' }, { text: '纯粹的情感陪伴与安慰', color: 'green' }, { text: '某种不可言说的天启', color: 'purple' } ] },
    { text: '当你漫步在清晨的森林，哪种感受最让你舒适？', options: [ { text: '阳光透过树梢洒在脸上的温暖', color: 'orange' }, { text: '脚踩在湿润泥土上的踏实感', color: 'green' }, { text: '呼吸着带有泥土芬芳的空气', color: 'blue' }, { text: '四周静谧、万物尚未苏醒的宁静', color: 'purple' } ] },
    { text: '如果在梦里你能够变成一种自然现象，你希望是：', options: [ { text: '席卷大地的狂风暴雨', color: 'red' }, { text: '划破夜空的耀眼流星', color: 'yellow' }, { text: '滋润万物的绵绵细雨', color: 'green' }, { text: '笼罩山谷的静谧晨雾', color: 'purple' } ] }
  ]

  let COLOR_MAP = {
    'red': { name: '流金红', hex: '#ff416c', desc: '炽热、行动力、生命张力' },
    'orange': { name: '晨曦橙', hex: '#ff7b00', desc: '创造力、丰盛、显化' },
    'yellow': { name: '极光黄', hex: '#f6d365', desc: '智慧、乐观、好奇心' },
    'green': { name: '愈创绿', hex: '#11998e', desc: '疗愈、平衡、同理心' },
    'blue': { name: '深邃蓝', hex: '#2193b0', desc: '直觉、冷静、沟通' },
    'purple': { name: '迷雾紫', hex: '#8e44ad', desc: '灵性、神秘、潜意识' }
  }

  const AuraTest = defineComponent({
    name: 'AuraTestPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const phase = ref('question')
      const currentQuestionIndex = ref(0)
      const colorScores = ref({ red: 0, orange: 0, yellow: 0, green: 0, blue: 0, purple: 0 })
      const hasPaid = ref(isTestUnlocked('aura'))
      const showPayment = ref(false)
      const orderId = ref(getStoredTestOrderId('aura') || null)
      const isTyping = ref(false)
      const displayedDeepText = ref('')
      const auraResult = ref(null)

      const currentQ = computed(() => AURA_QUESTIONS[currentQuestionIndex.value])
      const answeredCount = computed(() => {
        let count = currentQuestionIndex.value
        if (selectedAnswer.value !== null) count += 1
        return count
      })
      const progress = computed(() => (answeredCount.value / AURA_QUESTIONS.length) * 100)

      const selectedAnswer = ref(null)
      const selectAnswer = (color) => {
        if (selectedAnswer.value !== null) return // prevent double click
        selectedAnswer.value = color
        colorScores.value[color]++
        setTimeout(() => {
          if (currentQuestionIndex.value < AURA_QUESTIONS.length - 1) {
            currentQuestionIndex.value++
            selectedAnswer.value = null
          } else {
            finishTest()
          }
        }, 400)
      }

      const finishTest = () => {
        phase.value = 'loading'
        setTimeout(() => {
          generateResult()
          phase.value = 'result'
          setTimeout(() => {
            if (hasPaid.value) {
              handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('aura') })
            } else {
              showPayment.value = true
            }
          }, 1500)
        }, 2000)
      }

      const generateResult = () => {
        const sorted = Object.entries(colorScores.value).sort((a, b) => b[1] - a[1])
        const primary = sorted[0][0]
        const secondary = sorted[1][1] > 0 ? sorted[1][0] : sorted[2][0]
        
        auraResult.value = {
          colors: [COLOR_MAP[primary], COLOR_MAP[secondary]],
          title: `${COLOR_MAP[primary].name} × ${COLOR_MAP[secondary].name}`
        }
        saveResultDraft('aura', {
          result: auraResult.value,
          scores: colorScores.value
        })
      }

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        setStoredTestOrderId('aura', plan && plan.orderId)
        hasPaid.value = true
        saveToArchive('Aura', auraResult.value.title)
        const deepReport = await generatePaidAIReport({
          testType: 'aura',
          orderId: plan && plan.orderId,
          resultSummary: auraResult.value.title,
          userInputs: colorScores.value,
          context: auraResult.value
        })
        startTypewriter(deepReport)
      }

      const startTypewriter = (fullText) => {
        isTyping.value = true
        let i = 0
        const chunkSize = Math.max(1, Math.ceil(fullText.length / 600))
        const speed = 30
        const type = () => {
          if (i < fullText.length) {
            displayedDeepText.value += fullText.slice(i, i + chunkSize)
            i += chunkSize
            setTimeout(type, speed)
          } else {
            isTyping.value = false
          }
        }
        type()
      }

      return {
        AURA_QUESTIONS, currentQuestionIndex, progress, answeredCount, currentQ, phase,
        auraResult, hasPaid, showPayment, isTyping, displayedDeepText,
        selectedAnswer, selectAnswer, handlePaymentSuccess
      }
    },
    template: `
      <main class="aura-page section" style="min-height: 80vh;">
        <transition name="fade" mode="out-in">
          
          <div v-if="phase === 'question'" key="q" class="test-container" style="max-width: 600px; margin: 0 auto; text-align: center;">
            <div class="test-header" v-reveal>
              <p class="section-kicker">灵魂光环</p>
              <h2>灵魂光环测试</h2>
              <p class="lede" style="margin: 0 auto;">凭借直觉回答，测算你当下的内心光谱与能量频率。</p>
            </div>
                        <div class="mbti-progress-container" style="margin-top: 30px; margin-bottom: 30px;">
              <div class="mbti-progress-bar">
                <div class="mbti-progress-fill" :style="{ width: progress + '%', background: 'linear-gradient(90deg, #b9935a, #e7dfa4)' }"></div>
              </div>
              <div class="mbti-progress-text" style="text-align: center; margin-top: 10px;">已完成 {{ answeredCount }} / {{ AURA_QUESTIONS.length }}</div>
            </div>
            <transition name="slide-up" mode="out-in">
              <div class="question-card active" :key="'q-' + currentQuestionIndex">
                <h3 style="margin-bottom: 30px; font-size: 22px;">{{ currentQ.text }}</h3>
                <div class="options-grid" style="display: flex; flex-direction: column; gap: 15px;">
                  <button v-for="(opt, idx) in currentQ.options" :key="idx" 
                          class="premium-option-btn" 
                          :class="{ selected: selectedAnswer === opt.color }"
                          @click="selectAnswer(opt.color)">
                    {{ opt.text }}
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <div v-else-if="phase === 'loading'" key="loading" class="astro-loading-container" style="padding: 100px 0;">
            <div class="astro-spinner">
              <div class="spinner-ring outer"></div>
              <div class="spinner-ring inner"></div>
              <div class="spinner-center"></div>
            </div>
            <h3 class="loading-title">正在扫描能量场频率...</h3>
          </div>

          <div v-else-if="phase === 'result'" key="result" class="result-page">
            <div v-reveal style="text-align: center;">
              <p class="section-kicker">你的光环</p>
              <div class="aura-visual" :style="{ background: 'linear-gradient(135deg, ' + auraResult.colors[0].hex + ', ' + auraResult.colors[1].hex + ')', width: '200px', height: '200px', margin: '0 auto 30px', borderRadius: '50%', filter: 'blur(15px)', opacity: 0.8, transform: 'scale(1.2)' }"></div>
              <div class="mbti-type-title" style="position: relative; z-index: 2;">
                <h2 style="font-size: 40px; margin-bottom: 10px;">{{ auraResult.title }}</h2>
                <p style="font-size: 18px; color: var(--muted);">主导能量: {{ auraResult.colors[0].desc }}</p>
              </div>
            </div>

            <PaymentModal v-if="showPayment" @close="showPayment = false" @success="handlePaymentSuccess" />

            <div class="reading-section" v-if="hasPaid" v-reveal style="position: relative; z-index: 2;">
              <professional-report
                :text="displayedDeepText"
                :is-typing="isTyping"
                title="光环能量专业报告"
                :result-label="auraResult.title"
              />
            </div>
          </div>
        </transition>
      </main>
    `
  })

  // ─── 阴影人格测试页 ─────────────────────────────────────────
  const SHADOW_QUESTIONS = [
    {
      text: '如果在梦里你一直被追赶，你觉得追你的是什么？',
      options: [
        { text: '一个看不清脸的巨大黑影', shadow: 'orphan' },
        { text: '一群面目可憎的野兽', shadow: 'warrior' },
        { text: '一个和我长得一模一样的人', shadow: 'martyr' },
        { text: '某种无形但极度压抑的重力', shadow: 'wanderer' },
        { text: '一只总在暗处观察我的眼睛', shadow: 'magician' },
        { text: '一个熟悉却始终无法靠近的人', shadow: 'lover' }
      ]
    },
    {
      text: '当一段很好的关系突然结束时，你脑海里冒出的第一个念头是：',
      options: [
        { text: '“果然，没有人会永远陪着我。”', shadow: 'orphan' },
        { text: '“我是不是又该先强硬一点保护自己？”', shadow: 'warrior' },
        { text: '“我明明已经付出了那么多，为什么？”', shadow: 'martyr' },
        { text: '“终于解脱了，我又可以一个人了。”', shadow: 'wanderer' },
        { text: '“如果我早点看清局面，就不会这样。”', shadow: 'magician' },
        { text: '“是不是我不够特别，所以才留不住？”', shadow: 'lover' }
      ]
    },
    {
      text: '在团队中，最让你感到痛苦的时刻是：',
      options: [
        { text: '被大家忽视，仿佛我不存在', shadow: 'orphan' },
        { text: '需要不断对抗，才不会被人压过去', shadow: 'warrior' },
        { text: '所有脏活累活都丢给我，还没人感激', shadow: 'martyr' },
        { text: '被强行分配了极其死板的固定角色', shadow: 'wanderer' },
        { text: '大家的效率极低，而我又不得不收拾残局', shadow: 'magician' },
        { text: '团队冷冰冰的，没有任何人情味和归属感', shadow: 'lover' }
      ]
    },
    {
      text: '如果让你在一间密室里待上三天，你最害怕的是：',
      options: [
        { text: '没有任何通讯设备，与外界彻底断联', shadow: 'orphan' },
        { text: '房间里的灯忽明忽暗，随时可能陷入未知', shadow: 'warrior' },
        { text: '除了我之外还有一个不断向我索取的人', shadow: 'martyr' },
        { text: '房间很小，且门被从外面死死锁住', shadow: 'wanderer' },
        { text: '无法获得任何信息和书本，思维彻底停滞', shadow: 'magician' },
        { text: '没有香薰、音乐或任何舒适的物质享受', shadow: 'lover' }
      ]
    },
    {
      text: '你内心深处最不愿承认的一个事实是：',
      options: [
        { text: '我其实非常渴望被拯救', shadow: 'orphan' },
        { text: '我经常用愤怒来掩饰我的恐惧', shadow: 'warrior' },
        { text: '我用讨好换来的爱都不是真爱', shadow: 'martyr' },
        { text: '我所谓的独立，其实是在逃避承诺', shadow: 'wanderer' },
        { text: '我用聪明和理智，在筑起与人交往的围墙', shadow: 'magician' },
        { text: '我把强烈的情绪波动，误认为是最深沉的爱', shadow: 'lover' }
      ]
    },
    {
      text: '如果要选择一个动物作为你的守护灵，你更倾向于：',
      options: [
        { text: '一只躲在角落里寻求抚摸的小猫', shadow: 'orphan' },
        { text: '一只随时警惕、保护领地的大狗', shadow: 'warrior' },
        { text: '一只默默耕耘、任劳任怨的黄牛', shadow: 'martyr' },
        { text: '一只飞翔在高空、居无定所的孤鹰', shadow: 'wanderer' },
        { text: '一只在暗处冷静观察、充满智慧的猫头鹰', shadow: 'magician' },
        { text: '一只依赖花朵、在花丛中翩翩起舞的彩蝶', shadow: 'lover' }
      ]
    },
    {
      text: '你最难容忍伴侣或亲密朋友的哪种行为？',
      options: [
        { text: '逐渐冷淡或突然不再回复我的消息', shadow: 'orphan' },
        { text: '在言语上表现出对我的否定或挑衅', shadow: 'warrior' },
        { text: '觉得我给的关心多余，或者抗拒我的体贴', shadow: 'martyr' },
        { text: '试图彻底绑定我的时间，干涉我的日常规律', shadow: 'wanderer' },
        { text: '做事毫无章法、总是出错，让让我不得不收拾残局', shadow: 'magician' }, // wait, let's keep it "让我不得不收拾残局"
        { text: '宁愿打游戏或做别的事，也不愿意花时间陪伴我', shadow: 'lover' }
      ]
    },
    {
      text: '在一艘即将沉没的游轮上，你的第一反应是：',
      options: [
        { text: '害怕自己被别人丢下，拼命寻找可以依靠的救生艇', shadow: 'orphan' },
        { text: '安全开路或强行接管，确保自己有生存机会', shadow: 'warrior' },
        { text: '尽力去帮助老人和小孩，哪怕自己留到最后', shadow: 'martyr' },
        { text: '趁乱找一个无人的角落，独自面对大洋的冰冷', shadow: 'wanderer' },
        { text: '迅速研究游轮的结构图和求生路线，冷静规避风险', shadow: 'magician' },
        { text: '紧紧抱住身边最重要的人，觉得能一起面对也是种安慰', shadow: 'lover' }
      ]
    },
    {
      text: '当有人送你一份非常贵重的礼物时，你内心的第一感受是：',
      options: [
        { text: '受宠若惊，觉得我不配得到这么好的东西', shadow: 'orphan' },
        { text: '怀疑对方是不是有什么企图，想以此来制约我', shadow: 'warrior' },
        { text: '压力巨大，立刻思考该怎么买一份更贵的礼物回赠', shadow: 'martyr' },
        { text: '觉得有负担，害怕这代表着关系要进一步绑定', shadow: 'wanderer' },
        { text: '分析这个礼物的商业价值以及对方的潜意识意图', shadow: 'magician' },
        { text: '极其兴奋，觉得这证明了自己在对方心里无可替代', shadow: 'lover' }
      ]
    },
    {
      text: '你最害怕自己的人生最终走向哪种结局？',
      options: [
        { text: '孤苦无依，生病时身边连一个倒水的人都没有', shadow: 'orphan' },
        { text: '彻底被磨平棱角，成为一个毫无血性的平庸顺民', shadow: 'warrior' },
        { text: '耗尽了一生为别人操心，最后却没人真正感激我', shadow: 'martyr' },
        { text: '被钉在一个死板的工作或关系里，直到生命尽头', shadow: 'wanderer' },
        { text: '糊里糊涂地度过一生，甚至没看懂人生的底层规律', shadow: 'magician' },
        { text: '情感麻木，失去对爱、浪漫和激情的感知力', shadow: 'lover' }
      ]
    },
    {
      text: '当身边的人对你表现出极大的期待时，你往往会：',
      options: [
        { text: '感到惶恐，害怕自己做不好会被彻底放弃', shadow: 'orphan' },
        { text: '被激发斗志，想要向他们证明我绝对是第一', shadow: 'warrior' },
        { text: '毫无保留地燃烧自己，宁可累垮也不能让他们失望', shadow: 'martyr' },
        { text: '感到沉重的窒息感，本能地想要往后退开', shadow: 'wanderer' },
        { text: '评估这些期待背后的筹码，理性地与之划分界限', shadow: 'magician' },
        { text: '感到甜蜜，觉得自己的存在终于有了核心价值', shadow: 'lover' }
      ]
    },
    {
      text: '如果面前有一扇写着“禁忌”的大门，你更可能：',
      options: [
        { text: '站在门外等别人来，害怕进去会遇到危险被丢下', shadow: 'orphan' },
        { text: '直接一脚踹开，觉得没有什么规矩可以限制我', shadow: 'warrior' },
        { text: '提醒其他人注意安全，并守在大门口防止别人受伤', shadow: 'martyr' },
        { text: '绕过这扇门，继续去探索其他更广阔的荒野', shadow: 'wanderer' },
        { text: '在不触发任何警报的情况下，巧妙地研究其锁具原理', shadow: 'magician' },
        { text: '寻找钥匙并试图和伴侣一起牵手推开它，体验刺激', shadow: 'lover' }
      ]
    },
    {
      text: '你最喜欢的独处状态是：',
      options: [
        { text: '抱紧被子在房间里看悲剧电影，流点眼泪', shadow: 'orphan' },
        { text: '在健身房疯狂流汗，或者戴上耳机听重金属音乐', shadow: 'warrior' },
        { text: '一边整理房间一边叹气，把垃圾分类做得极度完美', shadow: 'martyr' },
        { text: '开车去没有方向的高速公路，听着音乐随风漂流', shadow: 'wanderer' },
        { text: '安静地看书、刷科技视频或研究某样复杂的技能', shadow: 'magician' },
        { text: '精心布置房间的香薰、灯光，享受舒适感官体验', shadow: 'lover' }
      ]
    },
    {
      text: '在一段充满张力的辩论中，你最容易因为什么而失控？',
      options: [
        { text: '对方表现出对我的嘲笑，让我感觉自己是个局外人', shadow: 'orphan' },
        { text: '对方态度极其强硬且试图从气势上压倒我', shadow: 'warrior' },
        { text: '对方曲解了我的好意，把我的付出说得一文不值', shadow: 'martyr' },
        { text: '辩论被强行终止，或者规则限制了我的自由表达', shadow: 'wanderer' },
        { text: '对方逻辑混乱、偷换概念且固执己见，毫无理性', shadow: 'magician' },
        { text: '对方指责我只在乎辩论结果，却一点不在乎他们的感受', shadow: 'lover' }
      ]
    },
    {
      text: '当你被邀请进入一个高级社交派对时，你的表现更接近：',
      options: [
        { text: '默默待在无人关注的角落，等有熟人来找我说话', shadow: 'orphan' },
        { text: '举止强硬大方，随时准备在智力或地位较量中获胜', shadow: 'warrior' },
        { text: '帮助服务生整理杯碟，或者照顾那些落单尴尬的人', shadow: 'martyr' },
        { text: '快速转一圈并拿点食物，然后在露台上看夜景享受清静', shadow: 'wanderer' },
        { text: '冷静观察人群的站位和社交层级，推演各方的利益关系', shadow: 'magician' },
        { text: '寻找全场最瞩目或最特别的人，并试图与对方建立深刻交谈', shadow: 'lover' }
      ]
    },
    {
      text: '如果你被允许在荒岛上带一样东西，你绝对不考虑带什么？',
      options: [
        { text: '一个能随时联系到熟人的无线电台', shadow: 'orphan' },
        { text: '一把防身和捕猎用的生存军刀', shadow: 'warrior' },
        { text: '一箱能分给岛上其他潜在求生者的备用药品', shadow: 'martyr' },
        { text: '一顶舒适、将自己完全与自然隔离开的密封帐篷', shadow: 'wanderer' },
        { text: '一本记载了荒岛所有动植物毒性和生存技能的厚书', shadow: 'magician' },
        { text: '一张印有爱人或家庭照片的精致相框', shadow: 'lover' }
      ]
    },
    {
      text: '当你面临重大的财务损失时，你最本能的内耗方式是：',
      options: [
        { text: '“我太倒霉了，为什么不幸的事情总是发生在我身上。”', shadow: 'orphan' },
        { text: '“都是因为别人不专业或背叛，我一定要让他们付出代价。”', shadow: 'warrior' },
        { text: '“要是我当初不为他们出这笔钱就好了，但我当时无法拒绝。”', shadow: 'martyr' },
        { text: '“无所谓了，金钱是世俗的束缚，大不了重头再来。”', shadow: 'wanderer' },
        { text: '“我的财务模型出现了致命漏洞，我必须疯狂计算出补救公式。”', shadow: 'magician' },
        { text: '“钱没了没关系，只要我的伴侣和朋友还在我身边爱着我。”', shadow: 'lover' }
      ]
    },
    {
      text: '如果让你选择一种完全逃避现实的方式，你最倾向于：',
      options: [
        { text: '躺在床上疯狂刷短视频，直到精疲力竭睡去', shadow: 'orphan' },
        { text: '去玩那种充满暴力和杀伐感的大型对抗电子游戏', shadow: 'warrior' },
        { text: '疯狂帮家人或室友做家务、整理房间，以忙碌来麻木自己', shadow: 'martyr' },
        { text: '买一张没有目的地的单程车票，直接在荒野里消失几天', shadow: 'wanderer' },
        { text: '通宵研究某种深奥冷门的技术、算法或哲学理论', shadow: 'magician' },
        { text: '沉迷于酒精、甜食或与暧昧对象通宵聊天寻找即时温暖', shadow: 'lover' }
      ]
    },
    {
      text: '在一段充满猜忌的感情中，你的表现更像是：',
      options: [
        { text: '卑微地不断询问和求证，生怕有一点风吹草动就被抛弃', shadow: 'orphan' },
        { text: '直接掀翻桌子，强硬查岗，或者用同样的出轨行为来报复', shadow: 'warrior' },
        { text: '更加倍地迎合和付出，试图用自己的感动来换取对方的忠诚', shadow: 'martyr' },
        { text: '立刻关闭心门，冷漠对待对方，随时准备无痛抽身', shadow: 'wanderer' },
        { text: '暗中查阅对方的行踪记录、手机聊天记录，冷静取证', shadow: 'magician' },
        { text: '情绪极度崩溃，在爱与恨、粘人与作闹之间反复疯狂拉扯', shadow: 'lover' }
      ]
    },
    {
      text: '如果必须要抛弃一种你身上现有的品质，你最先放弃：',
      options: [
        { text: '我对人际关系的敏感与细腻', shadow: 'orphan' },
        { text: '我敢于捍卫底线的强硬与锋芒', shadow: 'warrior' },
        { text: '我乐于助人、不计回报的善良', shadow: 'martyr' },
        { text: '我追求自由、不受拘束的随性', shadow: 'wanderer' },
        { text: '我冷静、客观分析问题的理智', shadow: 'magician' },
        { text: '我全情投入、渴望浪漫的激情', shadow: 'lover' }
      ]
    },
    {
      text: '当你听到别人在背后议论你的缺点时，你最可能：',
      options: [
        { text: '内心极其受伤，觉得果然大家都讨厌我，独自垂泪', shadow: 'orphan' },
        { text: '直接当面戳穿对方，用极其锋利的言语给对方一个教训', shadow: 'warrior' },
        { text: '觉得委屈，心想“我对你们那么好，你们却在背后这么说我”', shadow: 'martyr' },
        { text: '耸耸肩，觉得无所谓，反正这些人和我毫无瓜葛，直接拉黑', shadow: 'wanderer' },
        { text: '理性评估他们议论的准确性，在心里默默拉起防卫网', shadow: 'magician' },
        { text: '感到恐慌，害怕人际圈子破裂，立刻想办法挽回形象', shadow: 'lover' }
      ]
    },
    {
      text: '当关系中出现意见分歧，你最习惯的防御模式是：',
      options: [
        { text: '“都是我的错，我总是那个破坏气氛的人。”', shadow: 'orphan' },
        { text: '“这没有商量余地，必须按照我的标准来。”', shadow: 'warrior' },
        { text: '“我退让就是了，只要你们觉得高兴就好。”', shadow: 'martyr' },
        { text: '“我们可以根据历史数据和客观逻辑来推导哪种方案更优。”', shadow: 'magician' },
        { text: '“只要你还在乎我，什么方案我都愿意迁就你。”', shadow: 'lover' }
      ]
    },
    {
      text: '对于“命运”这个概念，你的潜意识核心解读是：',
      options: [
        { text: '命运常常带来无法解释的变化，我需要先保护好自己', shadow: 'orphan' },
        { text: '命运是个强悍的对手，我来这里就是为了征服和战胜它', shadow: 'warrior' },
        { text: '命运是个需要我用一生去赎罪或奉献才能通关的功课', shadow: 'martyr' },
        { text: '命运是一场没有终点、也不需要目的地的虚无旅行', shadow: 'wanderer' },
        { text: '命运是一串精密的、可以通过数学和逻辑去解密的算法', shadow: 'magician' },
        { text: '命运是一场漫长的寻爱之旅，一切波折都是为了最后的相遇', shadow: 'lover' }
      ]
    },
    {
      text: '当你要独自面对一个完全陌生的挑战时，你脑海里的第一画面是：',
      options: [
        { text: '自己是个无助的小孩，在黑暗的森林里迷失哭泣', shadow: 'orphan' },
        { text: '自己是个全副武装的骑士，准备和恶龙决一死战', shadow: 'warrior' },
        { text: '自己正在独自承担很多压力，却不太敢开口求助', shadow: 'martyr' },
        { text: '自己是个风中的旅人，轻松跨过障碍，随时准备随时撤退', shadow: 'wanderer' },
        { text: '自己是个坐在监控室的操纵者，理性计算着所有通关参数', shadow: 'magician' },
        { text: '自己是个在荒漠中苦苦寻水、渴望被绿洲接纳的朝圣者', shadow: 'lover' }
      ]
    },
    
    // Expanded (25 to 36)
    {
      text: '当有人指出你的错误时，你内心的第一反应是：',
      options: [
        { text: '羞愧沮丧，觉得自己总是搞砸事情', shadow: 'orphan' },
        { text: '恼羞成怒，立刻反驳或寻找对方的漏洞来反击', shadow: 'warrior' },
        { text: '委屈难过，觉得对方看不到我平时的努力和付出', shadow: 'martyr' },
        { text: '逃避面对，觉得这不重要，打算找个借口离开现场', shadow: 'wanderer' },
        { text: '冷静分析对方的立场和偏见，在心里将其解构', shadow: 'magician' },
        { text: '担心对方会因为这件事而讨厌我，进而疏远我', shadow: 'lover' }
      ]
    },
    {
      text: '在镜子里看着自己疲惫的双眼，你对自己说得最多的是：',
      options: [
        { text: '“为什么我总是活得这么累，没人能帮我。”', shadow: 'orphan' },
        { text: '“不能停下，我必须更强大，打败所有困难。”', shadow: 'warrior' },
        { text: '“我必须撑住，如果我倒下了，大家该怎么办。”', shadow: 'martyr' },
        { text: '“我想扔下这一切，去一个没人认识我的地方。”', shadow: 'wanderer' },
        { text: '“这只是精力的损耗，我需要重新规划我的时间。”', shadow: 'magician' },
        { text: '“我需要爱，需要被拥抱，这样才能重新活过来。”', shadow: 'lover' }
      ]
    },
    {
      text: '当你发现自己的秘密被公开时，你最倾向于采取哪种行动？',
      options: [
        { text: '躲起来，觉得世界都在对我指指点点，无处容身', shadow: 'orphan' },
        { text: '愤怒反击，找出那个泄密的人，让对方付出代价', shadow: 'warrior' },
        { text: '扮演受害者，强调自己受到的伤害，以此赢得同情', shadow: 'martyr' },
        { text: '连夜打包离开这个圈子，重新开始新生活', shadow: 'wanderer' },
        { text: '理性公关，控制舆论风向，把负面影响降到最低', shadow: 'magician' },
        { text: '寻找最信任的人倾诉，希望在对方的抚慰下平复情绪', shadow: 'lover' }
      ]
    },
    {
      text: '如果人生是一场戏，你觉得自己常常在扮演：',
      options: [
        { text: '被命运捉弄、无能为力的悲情配角', shadow: 'orphan' },
        { text: '披荆斩棘、与反派斗智斗勇的铁血战士', shadow: 'warrior' },
        { text: '默默奉献、为主角牺牲一切的无私配角', shadow: 'martyr' },
        { text: '游离在主线剧情之外、随时离场的旁观者', shadow: 'wanderer' },
        { text: '掌握底层逻辑、在幕后操纵局势的隐秘法师', shadow: 'magician' },
        { text: '执着于寻找真爱、在爱恨情仇中沉浮的感性主角', shadow: 'lover' }
      ]
    },
    {
      text: '当听到一个非常有吸引力但高风险的计划时，你首先关注的是：',
      options: [
        { text: '“我能行吗？万一被抛弃在半路上怎么办。”', shadow: 'orphan' },
        { text: '“这是一个战胜对手、确立统治地位的绝佳机会。”', shadow: 'warrior' },
        { text: '“如果成功了，我能为身边的人带来什么利益。”', shadow: 'martyr' },
        { text: '“这是否会限制我的自由，让我被长期绑定。”', shadow: 'wanderer' },
        { text: '“它的底层模型和逻辑漏洞在哪里，我该如何规避。”', shadow: 'magician' },
        { text: '“和谁一起合作？过程中是否充满激情和共鸣。”', shadow: 'lover' }
      ]
    },
    {
      text: '如果在旅途中，你和同伴彻底迷路了，你会：',
      options: [
        { text: '感到绝望，觉得我们被困在荒野中，没人会来救我们', shadow: 'orphan' },
        { text: '强行接管指挥权，要求大家跟紧我，共同冲出困境', shadow: 'warrior' },
        { text: '主动承担最重的行李，安抚大家的焦虑情绪', shadow: 'martyr' },
        { text: '拿出指南针、地图，理性分析地理位置和自救方案', shadow: 'magician' },
        { text: '紧紧挨着同伴，觉得只要大家团结温情地待在一起就好', shadow: 'lover' }
      ]
    },
    {
      text: '当别人向你表达爱意时，你内心的第一反应是：',
      options: [
        { text: '惶恐不安，怀疑对方是在开玩笑，迟早会离开我', shadow: 'orphan' },
        { text: '警惕，觉得这是一种示好，目的是为了获得我的资源', shadow: 'warrior' },
        { text: '觉得有压力，思考自己该怎么做才能配得上这份好', shadow: 'martyr' },
        { text: '想要后退，害怕被这份感情束缚，失去自己的空间', shadow: 'wanderer' },
        { text: '理性分析对方的动机、性格匹配度以及感情的可行性', shadow: 'magician' },
        { text: '沉醉其中，迫不及待地想要全情投入，体验被爱的浪漫', shadow: 'lover' }
      ]
    },
    {
      text: '你在一个派对上被大家冷落了，你的第一反应是：',
      options: [
        { text: '委屈和难堪，觉得自己被边缘化，不该来这里', shadow: 'orphan' },
        { text: '愤怒，觉得这里的人傲慢浅薄，暗下决心要在事业上超越他们', shadow: 'warrior' },
        { text: '主动去找那些看起来同样落单的人，去倒茶或服务他们', shadow: 'martyr' },
        { text: '觉得清静，端着酒杯默默退场，去外面吹风', shadow: 'wanderer' },
        { text: '静静观察大家的社交群落，推演他们的社会阶层和利益关系', shadow: 'magician' },
        { text: '感到痛苦，试图通过展现幽默或华丽的打扮重新夺回大家的关注', shadow: 'lover' }
      ]
    },
    {
      text: '你最不能容忍在关系中发生什么？',
      options: [
        { text: '被冷落或在不知情的情况下被冷暴力抛弃', shadow: 'orphan' },
        { text: '被对方羞辱、压制，处于极度被动卑微的地位', shadow: 'warrior' },
        { text: '对方觉得我的付出毫无价值，甚至觉得我烦', shadow: 'martyr' },
        { text: '被彻底绑定，没有任何属于我个人的时间和隐私', shadow: 'wanderer' },
        { text: '对方毫无理性，做事颠三倒四，完全无法沟通', shadow: 'magician' },
        { text: '关系变得平淡死板，失去任何激情、惊喜和浪漫', shadow: 'lover' }
      ]
    },
    {
      text: '如果你被赋予重构社会规则的权力，你的核心目标是：',
      options: [
        { text: '建立一个完美的社会保障体系，让所有弱者都有依靠', shadow: 'orphan' },
        { text: '确立绝对的法制与效率，让劣质、懒惰的人无处遁形', shadow: 'warrior' },
        { text: '倡导无私奉献与互助，鼓励每个人为了集体利益牺牲部分自我', shadow: 'martyr' },
        { text: '取消一切国界、制度和绑定，让每个人都拥有绝对的行动自由', shadow: 'wanderer' },
        { text: '建立完美的数字和逻辑模型，让机器和算法自动调节社会结构', shadow: 'magician' },
        { text: '倡导情感教育，打破冷冰冰的商业契约，建立有温度的情感社群', shadow: 'lover' }
      ]
    },
    {
      text: '当看见路边一个孤独的流浪汉在弹吉他，你更容易产生哪种共鸣？',
      options: [
        { text: '联想到自己，觉得自己也是在这个荒凉世界里漂泊的弃儿', shadow: 'orphan' },
        { text: '觉得他在用这种对抗的方式向冰冷的世俗宣战，充满傲骨', shadow: 'warrior' },
        { text: '忍不住想把身上的零钱都给他，甚至想买点热食温暖他', shadow: 'martyr' },
        { text: '羡慕他的潇洒，觉得抛弃世俗身份、在街头流浪是一种真正的自由', shadow: 'wanderer' },
        { text: '被琴声中的忧伤所感动，沉浸在旋律带来的悲剧美学里', shadow: 'lover' }
      ]
    },
    {
      text: '在你看来，人的一生最大的悲哀是：',
      options: [
        { text: '活在冷眼和遗弃中，从未感受过被偏爱、被接纳的滋味', shadow: 'orphan' },
        { text: '碌碌无为、被人踩在脚底，没有留下任何战胜命运的痕迹', shadow: 'warrior' },
        { text: '倾尽了心力去爱别人，最终却被说成是自作多情、令人窒息', shadow: 'martyr' },
        { text: '像个拉磨的驴一样被困在家庭和工作的枷锁里，直到生命油尽灯枯', shadow: 'wanderer' },
        { text: '糊里糊涂地过完一生，从未窥见过世界的本质和真理', shadow: 'magician' },
        { text: '情感干涸，在一个冷冰冰、毫无激情的婚姻或圈子里虚度年华', shadow: 'lover' }
      ]
    }
  ]

  let SHADOW_MAP = {
    'orphan': { name: '孤儿 (The Orphan)', desc: '核心恐惧：被遗弃。你用一层坚固的防备来保护自己，但其实内心深处极其渴求安全感。' },
    'warrior': { name: '毁灭者 (The Destroyer)', desc: '核心恐惧：被伤害。你用刚强的外表和对抗的姿态来保护自己，用愤怒来掩饰恐惧。' },
    'martyr': { name: '殉道者 (The Martyr)', desc: '核心恐惧：不被需要。你试图通过无私的付出来换取安全感，容易产生委屈情绪。' },
    'wanderer': { name: '流浪者 (The Wanderer)', desc: '核心恐惧：被束缚。你总是用逃避来拒绝真正的深度连接，害怕承担现实重担。' },
    'magician': { name: '黑魔法师 (The Dark Magician)', desc: '核心恐惧：失控。你聪明且极具洞察力，但容易把天赋过度用于对局面的掌控上。' },
    'lover': { name: '瘾君子 (The Addicted Lover)', desc: '核心恐惧：平庸与冷漠。你对极致的感情和戏剧张力充满向往，极难忍受内心的孤独。' }
  }

  const ShadowTest = defineComponent({
    name: 'ShadowTestPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const phase = ref('question')
      const currentQuestionIndex = ref(0)
      const shadowScores = ref({ orphan: 0, warrior: 0, martyr: 0, wanderer: 0, magician: 0, lover: 0 })
      const hasPaid = ref(isTestUnlocked('shadow'))
      const showPayment = ref(false)
      const orderId = ref(getStoredTestOrderId('shadow') || null)
      const isTyping = ref(false)
      const displayedDeepText = ref('')
      const shadowResult = ref(null)

      const currentQ = computed(() => SHADOW_QUESTIONS[currentQuestionIndex.value])
      const answeredCount = computed(() => {
        let count = currentQuestionIndex.value
        if (selectedAnswer.value !== null) count += 1
        return count
      })
      const progress = computed(() => (answeredCount.value / SHADOW_QUESTIONS.length) * 100)

      const selectedAnswer = ref(null)
      const selectAnswer = (shadow) => {
        if (selectedAnswer.value !== null) return
        selectedAnswer.value = shadow
        shadowScores.value[shadow]++
        setTimeout(() => {
          if (currentQuestionIndex.value < SHADOW_QUESTIONS.length - 1) {
            currentQuestionIndex.value++
            selectedAnswer.value = null
          } else {
            finishTest()
          }
        }, 400)
      }

      const finishTest = () => {
        phase.value = 'loading'
        setTimeout(() => {
          generateResult()
          phase.value = 'result'
          setTimeout(() => {
            if (hasPaid.value) {
              handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('shadow') })
            } else {
              showPayment.value = true
            }
          }, 1500)
        }, 2500)
      }

      const generateResult = () => {
        const sorted = Object.entries(shadowScores.value).sort((a, b) => b[1] - a[1])
        const primary = sorted[0][0]
        shadowResult.value = SHADOW_MAP[primary]
        saveResultDraft('shadow', {
          result: shadowResult.value,
          scores: shadowScores.value
        })
      }

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        setStoredTestOrderId('shadow', plan && plan.orderId)
        hasPaid.value = true
        saveToArchive('Shadow', shadowResult.value.name)
        const deepReport = await generatePaidAIReport({
          testType: 'shadow',
          orderId: plan && plan.orderId,
          resultSummary: shadowResult.value.name,
          userInputs: shadowScores.value,
          context: shadowResult.value
        })
        startTypewriter(deepReport)
      }

      const startTypewriter = (fullText) => {
        isTyping.value = true
        let i = 0
        const chunkSize = Math.max(1, Math.ceil(fullText.length / 600))
        const speed = 35
        const type = () => {
          if (i < fullText.length) {
            displayedDeepText.value += fullText.slice(i, i + chunkSize)
            i += chunkSize
            setTimeout(type, speed)
          } else {
            isTyping.value = false
          }
        }
        type()
      }

      return {
        SHADOW_QUESTIONS, currentQuestionIndex, progress, answeredCount, currentQ, phase,
        shadowResult, hasPaid, showPayment, isTyping, displayedDeepText,
        selectedAnswer, selectAnswer, handlePaymentSuccess
      }
    },
    template: `
      <main class="shadow-page section" style="min-height: 80vh;">
        <transition name="fade" mode="out-in">
          
          <div v-if="phase === 'question'" key="q" class="test-container" style="max-width: 600px; margin: 0 auto; text-align: center;">
            <div class="test-header" v-reveal>
              <p class="section-kicker">阴影人格</p>
              <h2>暗影原型测试</h2>
              <p class="lede" style="margin: 0 auto;">基于荣格心理学，直面你内心深处最不愿承认的核心恐惧。</p>
            </div>
            <div class="mbti-progress-container" style="margin-top: 30px; margin-bottom: 30px;">
              <div class="mbti-progress-bar">
                <div class="mbti-progress-fill" :style="{ width: progress + '%', background: 'linear-gradient(90deg, #556270, #2c3e50)' }"></div>
              </div>
              <div class="mbti-progress-text" style="text-align: center; margin-top: 10px;">已完成 {{ answeredCount }} / {{ SHADOW_QUESTIONS.length }}</div>
            </div>
            <transition name="slide-up" mode="out-in">
              <div class="question-card active" :key="'q-' + currentQuestionIndex">
                <h3 style="margin-bottom: 30px; font-size: 22px;">{{ currentQ.text }}</h3>
                <div class="options-grid" style="display: flex; flex-direction: column; gap: 15px;">
                  <button v-for="(opt, idx) in currentQ.options" :key="idx" 
                          class="premium-option-btn" 
                          :class="{ selected: selectedAnswer === opt.shadow }"
                          @click="selectAnswer(opt.shadow)">
                    {{ opt.text }}
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <div v-else-if="phase === 'loading'" key="loading" class="loading-state">
            <div class="spinner" style="border-top-color: #111;"></div>
            <p class="loading-text">正在整理暗影原型结果...</p>
          </div>

          <div v-else-if="phase === 'result'" key="result" class="result-page">
            <div v-reveal style="text-align: center;">
              <p class="section-kicker">你的阴影</p>
              <div class="mbti-type-title">
                <h2 style="font-size: 36px; background: linear-gradient(90deg, #111, #555); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">{{ shadowResult.name }}</h2>
                <p style="font-size: 18px; margin-top: 15px; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.6;">{{ shadowResult.desc }}</p>
              </div>
            </div>

            <PaymentModal v-if="showPayment" @close="showPayment = false" @success="handlePaymentSuccess" />

            <div class="reading-section" v-if="hasPaid" v-reveal style="border-left-color: #333; background: #fafafa;">
              <professional-report
                :text="displayedDeepText"
                :is-typing="isTyping"
                title="暗影原型专业报告"
                :result-label="shadowResult.name"
              />
            </div>
          </div>
        </transition>
      </main>
    `
  })


  // ─── ARCHIVE PAGE ─────────────────────────────────────────
  const ArchivePage = defineComponent({
    name: 'ArchivePage',
    setup() {
      const archives = ref([])
      const router = useRouter()

      onMounted(() => {
        try {
          archives.value = JSON.parse(localStorage.getItem('northstar_archives') || '[]')
        } catch(e) {}
      })

      const viewArchive = (arc) => {
        arc.expanded = !arc.expanded;
      }

      const clearArchive = () => {
        if(confirm('确定要清空所有档案吗？')) {
          localStorage.removeItem('northstar_archives')
          archives.value = []
        }
      }

      return { archives, viewArchive, clearArchive, getArchiveTypeLabel }
    },
    template: `
      <main class="archive-page section" style="min-height: 80vh;">
        <div class="test-header" v-reveal>
          <p class="section-kicker">灵魂档案</p>
          <h2>我的星象馆</h2>
          <p class="lede">这里保存着你已解锁的报告，方便后续回看与对照。</p>
        </div>
        
        <div class="archive-list" style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
          <div v-if="archives.length === 0" style="text-align: center; color: rgba(255,255,255,0.4); padding: 50px;">
            当前还没有已保存报告。完成任意测试后，可以在这里回看结果。
          </div>
          <div v-else>
            <div v-for="arc in archives" :key="arc.id" class="archive-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 20px; padding: 20px; cursor: pointer; transition: all 0.3s;" @click="viewArchive(arc)">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 12px; color: #ff7e5f; letter-spacing: 2px; margin-bottom: 5px;">{{ getArchiveTypeLabel(arc.type) }}</div>
                  <div style="font-size: 20px; font-weight: 600;">{{ arc.title }}</div>
                </div>
                <div style="color: rgba(255,255,255,0.4); font-size: 14px;">{{ arc.date }}</div>
              </div>
              
              <div v-if="arc.expanded" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); white-space: pre-wrap; line-height: 1.8; font-size: 15px; color: rgba(255,255,255,0.8);">
                {{ arc.data }}
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
              <button @click="clearArchive" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.5); padding: 8px 16px; border-radius: 20px; cursor: pointer;">清空档案</button>
            </div>
          </div>
        </div>
      </main>
    `
  })

  // ─── SYNASTRY TEST (双人合盘) ─────────────────────────────
  const SynastryTest = defineComponent({
    name: 'SynastryTestPage',
    components: { PaymentModal },
    setup() {
      const formDataA = ref({ name: '', date: '', time: '', ...createBirthLocationFields() })
      const formDataB = ref({ name: '', date: '', time: '', ...createBirthLocationFields() })
      const locationA = useBirthLocation(formDataA)
      const locationB = useBirthLocation(formDataB)
      const formError = ref('')
      const optionalInfo = ref({
        relationshipStage: '不确定',
        knownFacts: '',
        chatText: '',
        userProfile: '',
        partnerProfile: '',
        recentConflict: '',
        userNeed: '',
        mbti: '',
        attachment: '',
        astrology: '',
	        bazi: '',
	        humanDesign: '',
	        aura: '',
	        shadow: '',
	        tarot: '',
	        color: '',
	        enneagram: '',
	        jung8: '',
	        darktriad: '',
	        saboteurs: '',
	        defense: ''
	      })
      const phase = ref('form') // form, loading, result
      const loadingText = ref('')
      
      const synResult = ref(null)
      const synHash = ref(0)
      
      const hasPaid = ref(isTestUnlocked('synastry'))
      const showPayment = ref(false)
      const showAIAdvicePayment = ref(false)
      const orderId = ref(getStoredTestOrderId('synastry') || null)
      const aiOrderId = ref(localStorage.getItem('northstar_relationship_ai_order_id') || '')
      const hasRelationshipAI = ref(isTestUnlocked('relationship-ai'))
      const aiResult = ref(null)
      const aiLoading = ref(false)
      const aiErrorMessage = ref('')
      const isTyping = ref(false)
      const displayedDeepText = ref('')

      const referenceFields = RELATIONSHIP_REFERENCE_FIELDS
      const optionalAutofillItems = computed(() => buildSynastryAutofill())
      const filledReferenceCount = computed(() => getRelationshipReferenceLines(optionalInfo.value).length)

      const importAvailableReferences = () => {
        buildSynastryAutofill().forEach(item => {
          if (!sanitizeReferenceValue(optionalInfo.value[item.field])) {
            optionalInfo.value[item.field] = item.value
          }
        })
      }

      onMounted(() => {
        try {
          const saved = JSON.parse(localStorage.getItem('northstar_synastry_optional_info') || '{}')
          if (saved && typeof saved === 'object') {
            const migrationVersion = Number(localStorage.getItem('northstar_synastry_reference_version') || 0)
            if (migrationVersion < 2) {
              referenceFields.forEach(item => {
                if (!hasRelationshipReferenceEvidence(item)) saved[item.field] = ''
              })
              localStorage.setItem('northstar_synastry_reference_version', '2')
            }
            optionalInfo.value = { ...optionalInfo.value, ...saved }
          }
        } catch (e) {}
        importAvailableReferences()
      })

      watch(optionalInfo, value => {
        try {
          localStorage.setItem('northstar_synastry_optional_info', JSON.stringify(value))
        } catch (e) {}
      }, { deep: true })

      const buildRelationshipPayload = () => {
        const o = optionalInfo.value
        const synastrySummary = synResult.value
          ? `双人合盘结果：${synResult.value.score}% · ${synResult.value.title}\n${synResult.value.deep}`
          : ''
	        const extraBackground = [
	          o.knownFacts,
	          ...getRelationshipReferenceLines(o)
	        ].filter(Boolean).join('\n')
        return {
          locale: currentLocale(),
          relationshipStage: o.relationshipStage,
          chatText: o.chatText,
          knownFacts: extraBackground,
          userProfile: o.userProfile,
          partnerProfile: o.partnerProfile,
          recentConflict: o.recentConflict,
          userNeed: o.userNeed,
          mbti: o.mbti,
          attachment: o.attachment,
          synastry: synastrySummary,
          tarot: o.tarot
        }
      }

      const expandSynastryText = (hash, nameA, nameB) => {
        const seededRandom = (seed) => {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
        let seed = hash;
        
        const banks = {
            karmic: [
                `【深层联结追踪】\n${nameA} 与 ${nameB} 的关系中存在明显的熟悉感与牵引力。你们容易在短时间内感到彼此并不陌生，也容易因为对方的某些反应触发自己长期以来的关系课题。这类连接的价值，不在于制造戏剧性，而在于帮助双方更清楚地看见自己的需求、边界与安全感模式。`,
                `【互动张力分析】\n从你们的资料组合来看，这段关系既有吸引，也有较强的情绪张力。${nameA} 可能更倾向于推动关系变化，而 ${nameB} 更重视稳定与承接。只要双方愿意把冲突转化为沟通，而不是用沉默或试探互相消耗，这段关系会带来很强的成长价值。`,
                `【关系发展线索】\n当 ${nameA} 与 ${nameB} 的信息叠加时，你们更像是彼此关系模式的镜子。对方会放大你们平时不容易看见的表达习惯、亲密需求与防御方式。若能保持真实而不急于控制结果，这段关系有机会从强烈吸引走向更稳定的理解。`
            ],
            complement: [
                `【优势互补度】\n你们的互补主要体现在行动节奏和情绪支持上。${nameA} 可能更容易带来方向感与推动力，${nameB} 则更擅长稳定关系氛围、承接细节和情绪。若双方都能认可对方的优势，而不是要求对方变成自己期待的样子，关系会更容易进入合作状态。`,
                `【心智协作方式】\n你们的互补不只体现在生活习惯，也体现在看待问题的角度。${nameA} 更适合提出方向和愿景，${nameB} 更适合补足执行细节与现实判断。遇到分歧时，与其争论谁更正确，不如把差异转化为分工：一个负责打开可能性，一个负责让计划更可落地。`
            ],
            minefield: [
                `【核心沟通风险】\n这段关系最大的隐患，在于你们对“安全感”的定义可能不同。当冲突发生时，${nameA} 可能倾向于先安静下来整理情绪，而 ${nameB} 可能更需要及时回应和确认。建议提前约定冷静规则，例如：“我需要半小时整理情绪，但我没有要离开这段关系。”`,
                `【控制感与边界】\n你们都可能在关系中有较强的自主性和自尊心，因此冲突时容易进入“谁先让步”的僵局。真正有帮助的不是争夺控制权，而是把问题拆成事实、感受、需求和下一步。只要双方愿意保留彼此的边界，这段关系的张力可以转化为更成熟的协作。`
            ]
        };

        let result = "";
        result += banks.karmic[Math.floor(seededRandom(seed++) * banks.karmic.length)] + "\n\n";
        result += banks.complement[Math.floor(seededRandom(seed++) * banks.complement.length)] + "\n\n";
        result += banks.minefield[Math.floor(seededRandom(seed++) * banks.minefield.length)];

        return result;
      }

      const hashString = (str) => {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) + hash) + str.charCodeAt(i);
        }
        return hash >>> 0;
      }

      const startCalculation = () => {
        formError.value = ''
        const requiredA = formDataA.value.name && formDataA.value.date && formDataA.value.time
        const requiredB = formDataB.value.name && formDataB.value.date && formDataB.value.time
        if (!requiredA || !requiredB) {
          formError.value = '请完整填写双方的姓名、出生日期和出生时间。'
          return
        }
        const resolvedA = locationA.requireResolvedLocation()
        const resolvedB = locationB.requireResolvedLocation()
        if (!resolvedA || !resolvedB) {
          formError.value = '请分别从搜索结果中选择双方的出生城市。'
          return
        }
        aiResult.value = null
        aiErrorMessage.value = ''
        phase.value = 'loading'
        
        const texts = ['正在整理双方基础信息...', '正在生成关系模型...', '正在分析互动线索...', '正在计算契合度结果...']
        let i = 0
        loadingText.value = texts[i]
        const intv = setInterval(() => {
          i++
          if (i < texts.length) {
            loadingText.value = texts[i]
          } else {
            clearInterval(intv)
            generateReport()
            phase.value = 'result'
            setTimeout(() => {
              if (hasPaid.value) {
                handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('synastry') })
              } else {
                showPayment.value = true
              }
            }, 1500)
          }
        }, 800)
      }

      const generateReport = () => {
        const seedA = [
          formDataA.value.name,
          formDataA.value.date,
          formDataA.value.time,
          formDataA.value.latitude,
          formDataA.value.longitude,
          formDataA.value.timezone
        ].join('|');
        const seedB = [
          formDataB.value.name,
          formDataB.value.date,
          formDataB.value.time,
          formDataB.value.latitude,
          formDataB.value.longitude,
          formDataB.value.timezone
        ].join('|');
        const hA = hashString(seedA);
        const hB = hashString(seedB);
        synHash.value = (hA + hB) >>> 0;
        
        // Compute pseudo-random score between 65 and 99
        let score = (synHash.value % 35) + 65; 
        
        const adjectives = ['高度契合对象', '深层拉扯', '互补关系', '稳定搭档', '强吸引组合'];
        const adj = adjectives[synHash.value % adjectives.length];
        
        synResult.value = {
            score: score,
            title: adj,
            deep: expandSynastryText(synHash.value, formDataA.value.name, formDataB.value.name)
        }
      }

      const startTypewriter = (fullText) => {
        isTyping.value = true
        displayedDeepText.value = ''
        let i = 0
        const chunkSize = Math.max(1, Math.ceil(fullText.length / 600))
        const interval = setInterval(() => {
          if (i < fullText.length) {
            displayedDeepText.value += fullText.slice(i, i + chunkSize)
            i += chunkSize
            const container = document.documentElement
            container.scrollTop = container.scrollHeight
          } else {
            clearInterval(interval)
            isTyping.value = false
          }
        }, 20)
      }

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        if (plan && plan.orderId) {
          orderId.value = plan.orderId
          setStoredTestOrderId('synastry', plan.orderId)
        }
        const unlockedTests = getPlanTests(plan || PLAN_BY_ID.single, 'synastry')
        if (unlockedTests.includes('relationship-ai') && plan && plan.orderId) {
          hasRelationshipAI.value = true
          aiOrderId.value = plan.orderId
          localStorage.setItem('northstar_relationship_ai_order_id', plan.orderId)
        }
        hasPaid.value = true
        const fullText = await generatePaidAIReport({
          testType: 'synastry',
          orderId: plan && plan.orderId,
          resultSummary: `${formDataA.value.name || 'A'} 与 ${formDataB.value.name || 'B'}，契合度 ${synResult.value.score}%`,
          userInputs: { personA: formDataA.value, personB: formDataB.value, optionalInfo: optionalInfo.value },
          context: synResult.value
        })
        saveToArchive('Synastry', `${formDataA.value.name} 与 ${formDataB.value.name} 合盘报告`, `契合度：${synResult.value.score}%\n\n${fullText}`);
        startTypewriter(fullText);
      }

      const handleAIAdvicePaymentSuccess = (plan) => {
        showAIAdvicePayment.value = false
        if (plan && plan.orderId) {
          aiOrderId.value = plan.orderId
          localStorage.setItem('northstar_relationship_ai_order_id', plan.orderId)
        }
        unlockPlan(plan && plan.id, 'relationship-ai')
        hasRelationshipAI.value = true
        runEmbeddedRelationshipAnalysis()
      }

      const runEmbeddedRelationshipAnalysis = async () => {
        const payload = buildRelationshipPayload()
        if (!payload.chatText.trim() && !payload.knownFacts.trim() && !payload.userProfile.trim() && !payload.partnerProfile.trim()) {
          aiErrorMessage.value = '请至少补充聊天记录、关系背景或双方状态中的一项。'
          return
        }
        if (!hasRelationshipAI.value || !aiOrderId.value) {
          showAIAdvicePayment.value = true
          return
        }
        aiLoading.value = true
        aiErrorMessage.value = ''
        aiResult.value = null
        try {
          const res = await fetch('/api/relationship/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, orderId: aiOrderId.value })
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.message || data.error || '情感建议生成失败')
          aiResult.value = data.result
          localStorage.setItem('northstar_relationship_ai_result', JSON.stringify(data.result))
          localStorage.setItem('northstar_relationship_ai_form', JSON.stringify(payload))
          saveToArchive('RelationshipAI', `AI 情感建议 · ${data.result.stage || '关系分析'}`, [
            data.result.summary || data.result.Subtext_Translation || '',
            ...(data.result.riskSignals || []),
            ...(data.result.nextActions || [])
          ].filter(Boolean).join('\n\n'))
        } catch (error) {
          aiErrorMessage.value = error.message || '情感建议生成失败，请稍后再试。'
        } finally {
          aiLoading.value = false
        }
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('syn-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_Synastry_${formDataA.value.name}_${formDataB.value.name}.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      watch(phase, (newPhase) => {
        if (newPhase === 'result') {
          window.__northstarFx?.setPattern('text', '❤')
          store.isPatternActive = true
        } else if (newPhase === 'form') {
          window.__northstarFx?.clearPattern()
          store.isPatternActive = false
          store.isImmersive = false
        }
      })

      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
        store.isPatternActive = false
        store.isImmersive = false
      })

      return {
        formDataA, formDataB, optionalInfo, referenceFields, optionalAutofillItems, phase, loadingText, synResult,
        filledReferenceCount, importAvailableReferences,
        hasPaid, showPayment, showAIAdvicePayment, hasRelationshipAI, aiOrderId, aiResult, aiLoading, aiErrorMessage,
        isTyping, displayedDeepText, formError,
        locationMatchesA: locationA.locationMatches,
        isSearchingLocationA: locationA.isSearchingLocation,
        locationErrorA: locationA.locationError,
        locationResolvedA: locationA.locationResolved,
        selectLocationA: locationA.selectLocation,
        locationMatchesB: locationB.locationMatches,
        isSearchingLocationB: locationB.isSearchingLocation,
        locationErrorB: locationB.locationError,
        locationResolvedB: locationB.locationResolved,
        selectLocationB: locationB.selectLocation,
        formatBirthContext,
        startCalculation, handlePaymentSuccess, handleAIAdvicePaymentSuccess, runEmbeddedRelationshipAnalysis, generatePoster
      }
    },
    template: `
      <main class="synastry-page section" style="min-height: 80vh;">
        <transition name="fade" mode="out-in">
          
          <!-- Phase 1: FORM -->
          <div v-if="phase === 'form'" key="form">
            <div class="test-header" v-reveal>
              <p class="section-kicker">双人合盘</p>
              <h2>双人契合度合盘</h2>
              <p class="lede">填一点你们已知的信息，先看看哪里合拍、哪里容易误会。</p>
            </div>
            <div class="test-form" v-reveal style="transition-delay: 0.1s; max-width: 800px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 30px;">
              <div style="flex: 1; min-width: 300px; background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,126,95,0.3);">
                <h3 style="color: #ff7e5f; margin-bottom: 20px;">✧ 你</h3>
                <div class="input-group">
                  <label>姓名 / 昵称</label>
                  <input type="text" v-model="formDataA.name" placeholder="输入姓名" class="astro-input">
                </div>
                <div class="input-group">
                  <label>出生日期 (阳历)</label>
                  <input type="date" v-model="formDataA.date" class="astro-input">
                </div>
                <div class="input-group">
                  <label>出生时间</label>
                  <input type="time" v-model="formDataA.time" class="astro-input">
                </div>
                <div class="input-group location-search-group">
                  <label>出生城市</label>
                  <input type="search" v-model="formDataA.locationQuery" class="astro-input" autocomplete="off" placeholder="例如：荆州、东京、Paris">
                  <div class="location-search-status" v-if="isSearchingLocationA">正在查找城市...</div>
                  <div class="location-search-status resolved" v-else-if="locationResolvedA">已识别：{{ formDataA.locationLabel }}</div>
                  <div class="location-suggestions" v-if="locationMatchesA.length">
                    <button type="button" v-for="location in locationMatchesA" :key="location.label + location.latitude" @click="selectLocationA(location)">
                      <strong>{{ location.label }}</strong>
                      <span>{{ location.timezoneLabel }}</span>
                    </button>
                  </div>
                </div>
                <p class="form-error" v-if="locationErrorA">{{ locationErrorA }}</p>
              </div>
              <div style="flex: 1; min-width: 300px; background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid rgba(254,180,123,0.3);">
                <h3 style="color: #feb47b; margin-bottom: 20px;">✧ 对方</h3>
                <div class="input-group">
                  <label>姓名 / 昵称</label>
                  <input type="text" v-model="formDataB.name" placeholder="输入姓名" class="astro-input">
                </div>
                <div class="input-group">
                  <label>出生日期 (阳历)</label>
                  <input type="date" v-model="formDataB.date" class="astro-input">
                </div>
                <div class="input-group">
                  <label>出生时间</label>
                  <input type="time" v-model="formDataB.time" class="astro-input">
                </div>
                <div class="input-group location-search-group">
                  <label>出生城市</label>
                  <input type="search" v-model="formDataB.locationQuery" class="astro-input" autocomplete="off" placeholder="例如：荆州、东京、Paris">
                  <div class="location-search-status" v-if="isSearchingLocationB">正在查找城市...</div>
                  <div class="location-search-status resolved" v-else-if="locationResolvedB">已识别：{{ formDataB.locationLabel }}</div>
                  <div class="location-suggestions" v-if="locationMatchesB.length">
                    <button type="button" v-for="location in locationMatchesB" :key="location.label + location.latitude" @click="selectLocationB(location)">
                      <strong>{{ location.label }}</strong>
                      <span>{{ location.timezoneLabel }}</span>
                    </button>
                  </div>
                </div>
                <p class="form-error" v-if="locationErrorB">{{ locationErrorB }}</p>
              </div>

              <section class="synastry-reference-panel">
                <div class="synastry-reference-heading">
                  <div>
                    <p class="section-kicker">其他测试线索</p>
                    <h3>补充你已经知道的结果</h3>
                    <p>已完成的测试会自动带入对应位置，也可以手动填写或修改。没有这些线索也能完成契合度测试。</p>
                  </div>
                  <div class="synastry-reference-status">
                    已填写 {{ filledReferenceCount }} / {{ referenceFields.length }} 项
                  </div>
                </div>

                <div class="insight-chip-row" v-if="optionalAutofillItems.length">
                  <button
                    v-for="item in optionalAutofillItems"
                    :key="item.field"
                    type="button"
                    class="insight-chip ready"
                    @click="optionalInfo[item.field] = item.value"
                  >
                    {{ optionalInfo[item.field] ? '更新' : '导入' }} · {{ item.label }}
                  </button>
                </div>

                <div class="synastry-reference-grid">
                  <label class="synastry-reference-field" v-for="item in referenceFields" :key="item.field">
                    <span>{{ item.label }}</span>
                    <input
                      v-model="optionalInfo[item.field]"
                      class="astro-input"
                      :placeholder="'填写' + item.label + '结果（可选）'"
                    >
                  </label>
                </div>
              </section>

              <div style="width: 100%; text-align: center; margin-top: 20px;">
                <p class="form-error" v-if="formError">{{ formError }}</p>
                <button class="primary-action" @click="startCalculation" style="background: linear-gradient(135deg, #ff7e5f, #feb47b);">
                  ✦ 看看我们合不合拍
                </button>
              </div>
            </div>
          </div>

          <!-- Phase 2: LOADING -->
          <div v-else-if="phase === 'loading'" key="loading" class="loading-state">
            <div class="spinner"></div>
            <p class="loading-text">{{ loadingText }}</p>
          </div>

          <!-- Phase 3: RESULT -->
          <div v-else-if="phase === 'result'" key="result" class="result-page">
            <div v-reveal>
              <p class="section-kicker">关系报告</p>
              <div class="mbti-type-title">
                <h2 style="font-size: 48px; background: linear-gradient(90deg, #ff7e5f, #feb47b); -webkit-background-clip: text;">{{ synResult.score }}%</h2>
                <p style="font-size: 20px; margin-top: 10px; color: #feb47b;">{{ synResult.title }}</p>
              </div>
              <div class="synastry-birth-context">
                <p><strong>{{ formDataA.name }}</strong> · {{ formatBirthContext(formDataA) }}</p>
                <p><strong>{{ formDataB.name }}</strong> · {{ formatBirthContext(formDataB) }}</p>
              </div>
            </div>

            <PaymentModal v-if="showPayment" test-type="synastry" @close="showPayment = false" @success="handlePaymentSuccess" />

            <div class="synastry-result-actions" v-if="!hasPaid">
              <div class="synastry-price-info" style="margin-bottom: 12px; font-size: 14px; color: rgba(255,255,255,0.7); text-align: center; width: 100%;">单项完整合盘: USD $7.99 | 合盘+AI 建议: USD $24.99 | 全站终身早鸟解锁 (All-Access Pass): USD $39.99</div>
              <button class="primary-action" @click="showPayment = true">查看合盘解锁方案</button>
              <button class="secondary-action" @click="showAIAdvicePayment = true">合盘 + AI 情感建议方案</button>
            </div>

            <div class="reading-section" v-if="hasPaid" v-reveal>
              <professional-report
                :text="displayedDeepText"
                :is-typing="isTyping"
                title="双人关系专业报告"
                :result-label="formDataA.name + ' × ' + formDataB.name"
              />
            </div>

            <div id="syn-poster-dom" class="poster-container" v-if="hasPaid" style="position: absolute; left: -9999px; width: 375px; padding: 40px; background: linear-gradient(135deg, #16213e, #0f3460); color: white; border-radius: 20px; font-family: 'PingFang SC', sans-serif;">
              <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 20px; margin-bottom: 20px;">
                <p style="font-size: 14px; color: #ff7e5f; letter-spacing: 4px;">北极星双人合盘</p>
                <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin: 20px 0;">
                    <div style="font-size: 24px; font-weight: bold;">{{ formDataA.name }}</div>
                    <div style="font-size: 20px; color: #ff7e5f;">❤️</div>
                    <div style="font-size: 24px; font-weight: bold;">{{ formDataB.name }}</div>
                </div>
                <div style="font-size: 64px; font-weight: 800; background: linear-gradient(135deg, #ff7e5f, #feb47b); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    {{ synResult.score }}%
                </div>
                <p style="font-size: 18px; color: rgba(255,255,255,0.8); margin-top: 10px;">{{ synResult.title }}</p>
              </div>
              <div style="margin-top: 30px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.3);">
                <p>北极星玄学双人合盘</p>
              </div>
            </div>

            <section class="synastry-insight-panel" style="margin-top: 32px;">
              <div>
                <h3>AI 情感建议</h3>
                <p>完成合盘后，可以继续补充聊天记录、相处背景或其他测试结果，让 AI 帮你看当前关系阶段和下一步沟通方式。只知道一部分也可以开始，补充项不是必填。</p>
              </div>

              <div class="two-col-fields">
                <div class="input-group">
                  <label>当前关系阶段</label>
	                  <select v-model="optionalInfo.relationshipStage" class="astro-input">
	                    <option value="不确定">不确定</option>
	                    <option value="暧昧观察期">暧昧观察期</option>
	                    <option value="热恋推进期">热恋推进期</option>
	                    <option value="稳定磨合期">稳定磨合期</option>
	                    <option value="冷淡拉扯期">冷淡拉扯期</option>
	                    <option value="分手修复期">分手修复期</option>
	                    <option value="长期承诺期">长期承诺期</option>
	                  </select>
	                </div>
	                <div class="input-group">
	                  <label>你想得到的建议</label>
	                  <input v-model="optionalInfo.userNeed" class="astro-input" placeholder="例如要不要主动、怎么回复、是否继续投入。">
	                </div>
	              </div>

	              <div class="input-group">
	                <label>聊天记录</label>
	                <textarea v-model="optionalInfo.chatText" class="astro-input relationship-textarea tall" placeholder="粘贴双方最近的对话。可以隐去真实姓名、手机号、地址等隐私信息。"></textarea>
	              </div>

	              <div class="input-group">
	                <label>关系背景</label>
	                <textarea v-model="optionalInfo.knownFacts" class="astro-input relationship-textarea compact" placeholder="例如认识多久、是否在一起、谁主动更多；也可以写星座、MBTI、依恋倾向等已知信息。"></textarea>
	              </div>

	              <div class="two-col-fields">
	                <div class="input-group">
	                  <label>你的状态 / 画像</label>
	                  <textarea v-model="optionalInfo.userProfile" class="astro-input relationship-textarea compact" placeholder="你的性格、担心点、表达方式。"></textarea>
	                </div>
	                <div class="input-group">
	                  <label>对方状态 / 画像</label>
	                  <textarea v-model="optionalInfo.partnerProfile" class="astro-input relationship-textarea compact" placeholder="对方的性格、回应节奏、压力来源。"></textarea>
	                </div>
	              </div>

	              <div class="input-group">
                <label>最近一次卡住的点</label>
                <textarea v-model="optionalInfo.recentConflict" class="astro-input relationship-textarea compact" placeholder="例如冷淡、争吵、突然不回、关系定义不清。"></textarea>
              </div>

              <div class="relationship-paywall" v-if="!hasRelationshipAI">
                <h3>可选升级：AI 情感建议</h3>
                <p>如果你想在合盘之外继续看聊天阶段、风险信号和下一步沟通话术，可以选择包含 AI 情感建议的方案。</p>
              </div>

              <button class="primary-action relationship-run-btn" @click="runEmbeddedRelationshipAnalysis" :disabled="aiLoading">
                {{ aiLoading ? '正在整理...' : (hasRelationshipAI && aiOrderId ? '生成 AI 情感建议' : '查看 AI 情感建议方案') }}
              </button>
              <p class="relationship-error" v-if="aiErrorMessage">{{ aiErrorMessage }}</p>

              <div class="relationship-result" v-if="aiResult">
                <p class="section-kicker">情感报告 · {{ ['openai', 'gemini'].includes(aiResult.provider) ? '深度关系分析' : '基础分析' }}</p>
                <template v-if="aiResult.Interest_Score !== undefined && aiResult.Interest_Score !== null">
                  <div class="premium-analysis-container">
                    <div class="premium-analysis-header">
                      <div class="interest-score-card">
                        <div class="score-ring">
                          <span class="score-num">{{ aiResult.Interest_Score }}</span>
                          <span class="score-label">好感指数</span>
                        </div>
                      </div>
                      <div class="power-dynamic-card">
                        <h4>当前互动局势</h4>
                        <div class="power-badge">{{ aiResult.Power_Dynamic }}</div>
                      </div>
                    </div>
                    <div class="analysis-section-block">
                      <h4>聊天潜台词</h4>
                      <p class="relationship-summary">{{ aiResult.Subtext_Translation }}</p>
                    </div>
                    <div class="relationship-result-grid">
                      <div>
                        <h4>下一步方向</h4>
                        <p class="strategic-text">{{ aiResult.Strategic_Direction }}</p>
                      </div>
                      <div>
                        <h4>底层逻辑</h4>
                        <p class="logic-text">{{ aiResult.Underlying_Logic }}</p>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <h3>当前阶段：{{ aiResult.stage }}</h3>
                  <p class="relationship-summary">{{ aiResult.summary }}</p>
                  <div class="relationship-result-grid">
                    <div>
                      <h4>风险信号</h4>
                      <ul><li v-for="item in aiResult.riskSignals" :key="item">{{ item }}</li></ul>
                    </div>
                    <div>
                      <h4>下一步建议</h4>
                      <ul><li v-for="item in aiResult.nextActions" :key="item">{{ item }}</li></ul>
                    </div>
                  </div>
                </template>
              </div>
            </section>

            <PaymentModal
              v-if="showAIAdvicePayment"
              test-type="relationship-ai"
              plan-id="relationship-plus"
              @close="showAIAdvicePayment = false"
              @success="handleAIAdvicePaymentSuccess"
            />

            <div class="action-area" v-if="hasPaid && !isTyping" style="margin-top: 40px;">
              <button class="primary-action" @click="generatePoster" style="background: linear-gradient(135deg, #ff7e5f, #feb47b); color: #fff;">
                ✧ 生成双人合盘海报
              </button>
            </div>
          </div>
        </transition>
      </main>
    `
  })

  



  const RelationshipAI = defineComponent({
    name: 'RelationshipAIPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const form = ref({
        relationshipStage: '不确定',
        knownFacts: '',
        userProfile: '',
        partnerProfile: '',
        recentConflict: '',
        userNeed: '',
	        chatText: '',
	        mbti: '',
	        attachment: '',
	        synastry: '',
	        tarot: '',
	        astrology: '',
	        bazi: '',
	        humanDesign: '',
	        aura: '',
	        shadow: '',
	        color: '',
	        enneagram: '',
	        jung8: '',
	        darktriad: '',
	        saboteurs: '',
	        defense: ''
	      })
      const result = ref(null)
      const loading = ref(false)
      const showPayment = ref(false)
      const hasPaid = ref(isTestUnlocked('relationship-ai'))
      const analysisOrderId = ref(localStorage.getItem('northstar_relationship_ai_order_id') || '')
      const errorMessage = ref('')

      onMounted(() => {
        // Load cached Relationship AI result & form fields
        try {
          const cachedForm = localStorage.getItem('northstar_relationship_ai_form')
          const cachedResult = localStorage.getItem('northstar_relationship_ai_result')
          if (cachedForm) form.value = { ...form.value, ...JSON.parse(cachedForm) }
          if (cachedResult) result.value = JSON.parse(cachedResult)
        } catch (e) {}

	        if (store.mbtiResult && !form.value.mbti) form.value.mbti = `${store.mbtiResult.type} ${store.mbtiResult.name || ''}`.trim()
	        if (store.attachmentResult && !form.value.attachment) form.value.attachment = `${store.attachmentResult.type} ${store.attachmentResult.anxietyMean || ''}/${store.attachmentResult.avoidanceMean || ''}`.trim()
	        RELATIONSHIP_REFERENCE_FIELDS.forEach(item => {
	          if (form.value[item.field] !== undefined) {
	            form.value[item.field] = sanitizeReferenceValue(form.value[item.field])
	          }
	        })
	        buildSynastryAutofill().forEach(item => {
	          if (form.value[item.field] !== undefined && !form.value[item.field]) {
	            form.value[item.field] = item.value
	          }
	        })
	        try {
          const archives = JSON.parse(localStorage.getItem('northstar_archives') || '[]')
          const syn = archives.find(item => item.type === 'Synastry')
          const tarot = archives.find(item => item.type === 'Tarot')
          if (syn && !form.value.synastry) form.value.synastry = String(syn.title || '').slice(0, 300)
          if (tarot && !form.value.tarot) form.value.tarot = String(tarot.title || '').slice(0, 300)
        } catch (e) {}
      })

	      const evidenceItems = computed(() => [
	        { id: 'chat', label: '聊天记录', ready: form.value.chatText.trim().length >= 80, route: '' },
	        { id: 'facts', label: '关系背景', ready: !!form.value.knownFacts.trim(), route: '' },
	        { id: 'need', label: '核心诉求', ready: !!form.value.userNeed.trim(), route: '' },
	        { id: 'synastry', label: '相处契合线索', ready: !!form.value.synastry.trim(), route: '/synastry' },
	        ...RELATIONSHIP_REFERENCE_FIELDS.map(item => ({
	          id: item.field,
	          label: item.label,
	          ready: !!String(form.value[item.field] || '').trim(),
	          route: item.route
	        }))
	      ])

      const readyCount = computed(() => evidenceItems.value.filter(item => item.ready).length)
      const confidenceScore = computed(() => Math.min(100, Math.max(18, readyCount.value * 12 + Math.floor(form.value.chatText.length / 220))))
      const confidenceLabel = computed(() => {
        if (confidenceScore.value >= 76) return '线索很丰富'
        if (confidenceScore.value >= 48) return '可以细化建议'
        return '现在就能开始'
      })
      const previewText = computed(() => {
        if (confidenceScore.value >= 76) return '你提供的线索已经比较丰富，报告会更容易给出具体话术和行动建议。'
        if (confidenceScore.value >= 48) return '这些信息已经足够分析大方向；后续想到更多细节，可以再补充。'
        return '只知道一些聊天片段、星座、MBTI 或依恋倾向也可以开始。更多资料只是让建议更具体，不是门槛。'
      })

      const openOptionalTest = (item) => {
        if (!item.route) return
        const ok = confirm(`是否现在跳转到「${item.label}」相关测试页？\n\n这是可选增强线索，不补充也可以继续做 AI 情感分析。`)
        if (ok) router.push(item.route)
      }

      const handlePaymentSuccess = (plan) => {
        showPayment.value = false
        if (plan && plan.orderId) {
          analysisOrderId.value = plan.orderId
          localStorage.setItem('northstar_relationship_ai_order_id', plan.orderId)
        }
        unlockPlan(plan && plan.id, 'relationship-ai')
        hasPaid.value = true
        runAnalysis()
      }

	      const runAnalysis = async () => {
	        const referenceLines = getRelationshipReferenceLines(form.value)
	        if (!form.value.chatText.trim() && !form.value.knownFacts.trim() && !referenceLines.length) {
	          errorMessage.value = '请至少填写聊天记录、关系背景或任一测试线索。'
	          return
	        }
        if (!hasPaid.value) {
          showPayment.value = true
          return
        }
        if (!analysisOrderId.value) {
          hasPaid.value = false
          errorMessage.value = '需要完成一次服务器可验证的解锁订单后，才能生成情感建议。'
          showPayment.value = true
          return
        }
	        loading.value = true
	        errorMessage.value = ''
	        result.value = null
	        try {
	          const payload = {
	            ...form.value,
	            locale: currentLocale(),
	            knownFacts: [
	              form.value.knownFacts,
	              referenceLines.length ? `可参考测试结果：\n${referenceLines.join('\n')}` : ''
	            ].filter(Boolean).join('\n\n')
	          }
	          const res = await fetch('/api/relationship/analyze', {
	            method: 'POST',
	            headers: { 'Content-Type': 'application/json' },
	            body: JSON.stringify({ ...payload, orderId: analysisOrderId.value })
	          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || '分析失败')
          result.value = data.result
          
          // Save result & form to localStorage cache
          localStorage.setItem('northstar_relationship_ai_result', JSON.stringify(data.result))
          localStorage.setItem('northstar_relationship_ai_form', JSON.stringify(form.value))

          saveToArchive('RelationshipAI', `AI 情感阶段分析 · ${data.result.stage}`, [
            data.result.summary,
            ...(data.result.riskSignals || []),
            ...(data.result.nextActions || [])
          ].join('\n\n'))
        } catch (error) {
          errorMessage.value = error.message || '分析失败，请稍后再试。'
        } finally {
          loading.value = false
        }
      }

      const copyToClipboard = (text) => {
        if (!text) return
        navigator.clipboard.writeText(text).then(() => {
          alert('话术已复制到剪贴板，可直接发给对方！')
        }).catch(err => {
          console.error('Copy failed:', err)
        })
      }

      return {
        router, form, result, loading, showPayment, hasPaid, analysisOrderId, errorMessage,
        evidenceItems, readyCount, confidenceScore, confidenceLabel, previewText,
        runAnalysis, handlePaymentSuccess, openOptionalTest, copyToClipboard
      }
    },
    template: `
      <main class="relationship-ai-page section">
        <div class="relationship-ai-hero" v-reveal>
          <p class="section-kicker">情感分析</p>
          <h2>AI 情感建议</h2>
          <p class="lede">不用等到完全了解对方才开始。你可以只贴一段聊天，或写下星座、MBTI、依恋倾向和已知的相处细节；信息多一点，建议会更具体，但不是必填作业。</p>
        </div>

        <section class="relationship-ai-grid">
          <div class="relationship-ai-form" v-reveal style="transition-delay: 0.05s;">
            <div class="input-group">
              <label>你觉得现在处于哪个阶段</label>
              <select v-model="form.relationshipStage" class="astro-input">
                <option value="不确定">不确定</option>
                <option value="暧昧观察期">暧昧观察期</option>
                <option value="热恋推进期">热恋推进期</option>
                <option value="稳定磨合期">稳定磨合期</option>
                <option value="冷淡拉扯期">冷淡拉扯期</option>
                <option value="分手修复期">分手修复期</option>
                <option value="长期承诺期">长期承诺期</option>
              </select>
            </div>
            <div class="input-group">
              <label>聊天记录</label>
              <textarea v-model="form.chatText" class="astro-input relationship-textarea tall" placeholder="粘贴双方最近的对话。可以隐去真实姓名、手机号、地址等隐私信息。"></textarea>
            </div>
            <div class="input-group">
              <label>已知背景</label>
              <textarea v-model="form.knownFacts" class="astro-input relationship-textarea" placeholder="例如认识多久、是否在一起、谁主动更多；也可以写星座、MBTI、依恋倾向等你已经知道的信息。"></textarea>
            </div>
            <div class="two-col-fields">
              <div class="input-group">
                <label>你的状态 / 画像</label>
                <textarea v-model="form.userProfile" class="astro-input relationship-textarea compact" placeholder="你的性格、担心点、表达方式。"></textarea>
              </div>
              <div class="input-group">
                <label>对方状态 / 画像</label>
                <textarea v-model="form.partnerProfile" class="astro-input relationship-textarea compact" placeholder="对方的性格、回应节奏、压力来源。"></textarea>
              </div>
            </div>
            <div class="input-group">
              <label>最近一次卡住的点</label>
              <textarea v-model="form.recentConflict" class="astro-input relationship-textarea compact" placeholder="例如冷淡、争吵、突然不回、关系定义不清。"></textarea>
            </div>
            <div class="input-group">
              <label>你最想得到什么建议</label>
              <input v-model="form.userNeed" class="astro-input" placeholder="例如要不要主动、怎么回复、是否继续投入。">
            </div>

	            <div class="relationship-test-bridges">
	              <p class="section-kicker">可选测试线索</p>
	              <div class="two-col-fields">
	                <input v-model="form.mbti" class="astro-input" placeholder="MBTI 线索">
	                <input v-model="form.attachment" class="astro-input" placeholder="依恋类型线索">
	                <input v-model="form.synastry" class="astro-input" placeholder="相处契合线索，可留空">
	                <input v-model="form.tarot" class="astro-input" placeholder="关系塔罗线索">
	                <input v-model="form.astrology" class="astro-input" placeholder="星盘线索">
	                <input v-model="form.bazi" class="astro-input" placeholder="八字线索">
	                <input v-model="form.humanDesign" class="astro-input" placeholder="人类图线索">
	                <input v-model="form.aura" class="astro-input" placeholder="光环线索">
	                <input v-model="form.shadow" class="astro-input" placeholder="暗影原型线索">
	                <input v-model="form.color" class="astro-input" placeholder="色彩心理线索">
	                <input v-model="form.enneagram" class="astro-input" placeholder="九型人格线索">
	                <input v-model="form.jung8" class="astro-input" placeholder="荣格八维线索">
	                <input v-model="form.darktriad" class="astro-input" placeholder="黑暗三角线索">
	                <input v-model="form.saboteurs" class="astro-input" placeholder="内在破坏者线索">
	                <input v-model="form.defense" class="astro-input" placeholder="心理防御机制线索">
	              </div>
	            </div>
          </div>

          <aside class="relationship-ai-side" v-reveal style="transition-delay: 0.1s;">
            <div class="confidence-card">
              <span class="section-kicker">可选线索</span>
              <h3>{{ confidenceLabel }}</h3>
              <div class="confidence-meter"><div :style="{ width: confidenceScore + '%' }"></div></div>
              <p>{{ previewText }}</p>
            </div>

            <div class="insight-chip-row">
              <button
                v-for="item in evidenceItems"
                :key="item.id"
                class="insight-chip"
                :class="{ ready: item.ready }"
                type="button"
                @click="openOptionalTest(item)"
              >
                {{ item.ready ? '已补充' : (item.route ? '可稍后补' : '可选') }} · {{ item.label }}
              </button>
            </div>

            <div class="relationship-paywall" v-if="!hasPaid">
              <h3>解锁专业关系报告 (USD $12.99 起)</h3>
              <p>付款后会根据你提供的聊天和背景，整理现在的相处状态、需要留意的地方，以及下一步怎么说更合适。全站终身解锁 (All-Access Pass) 现仅需 USD $39.99。</p>
              <button class="primary-action" @click="showPayment = true">查看上线方案</button>
            </div>

            <button class="primary-action relationship-run-btn" @click="runAnalysis" :disabled="loading">
              {{ loading ? '正在整理...' : (hasPaid ? '生成情感建议' : '查看解锁方案') }}
            </button>
            <p class="payment-subtitle" v-if="analysisOrderId">已绑定解锁订单：{{ analysisOrderId }}</p>
            <p class="relationship-error" v-if="errorMessage">{{ errorMessage }}</p>
          </aside>
        </section>

        <section class="relationship-result" v-if="result" v-reveal>
          <p class="section-kicker">情感报告 · {{ ['openai', 'gemini'].includes(result.provider) ? '深度关系分析' : '基础分析' }}</p>
          
          <template v-if="result.Interest_Score !== undefined && result.Interest_Score !== null">
            <div class="premium-analysis-container">
              <!-- Score and Dynamic Header -->
              <div class="premium-analysis-header">
                <div class="interest-score-card">
                  <div class="score-ring">
                    <span class="score-num">{{ result.Interest_Score }}</span>
                    <span class="score-label">好感指数</span>
                  </div>
                </div>
                <div class="power-dynamic-card">
                  <h4>当前博弈局势</h4>
                  <div class="power-badge">{{ result.Power_Dynamic }}</div>
                </div>
              </div>

              <!-- Subtext Translation -->
              <div class="analysis-section-block">
                <h4>潜台词深度解密</h4>
                <div class="subtext-content-box">
                  <p class="relationship-summary" style="margin: 0; line-height: 1.7; font-size: 15px;">{{ result.Subtext_Translation }}</p>
                </div>
              </div>

              <!-- Strategic Grid -->
              <div class="relationship-result-grid" style="margin-top: 0;">
                <div>
                  <h4>下一步战略方向</h4>
                  <p class="strategic-text" style="margin: 0; line-height: 1.6;">{{ result.Strategic_Direction }}</p>
                </div>
                <div>
                  <h4>心理学底层逻辑</h4>
                  <p class="logic-text" style="margin: 0; line-height: 1.6;">{{ result.Underlying_Logic }}</p>
                </div>
              </div>

              <!-- Reference Examples (Bubbles) -->
              <div class="analysis-section-block" v-if="result.Reference_Examples && result.Reference_Examples.length">
                <h4>实战参考回复话术 <span style="font-size:12px; font-weight:normal; opacity:0.6;">(点击即可复制)</span></h4>
                <div class="chat-bubbles-container">
                  <div 
                    v-for="(phrase, i) in result.Reference_Examples" 
                    :key="i" 
                    class="chat-bubble-reply"
                    @click="copyToClipboard(phrase)"
                  >
                    {{ phrase }}
                  </div>
                </div>
              </div>

              <!-- System Warning -->
              <div class="premium-warning-box" v-if="result.System_Warning">
                <p style="margin: 0;">{{ result.System_Warning }}</p>
              </div>
            </div>
          </template>

          <template v-else>
            <!-- Original Fallback Layout -->
            <h3>当前阶段：{{ result.stage }}</h3>
            <p class="relationship-summary">{{ result.summary }}</p>
            <div class="relationship-result-grid">
              <div>
                <h4>风险信号</h4>
                <ul><li v-for="item in result.riskSignals" :key="item">{{ item }}</li></ul>
              </div>
              <div>
                <h4>下一步建议</h4>
                <ul><li v-for="item in result.nextActions" :key="item">{{ item }}</li></ul>
              </div>
            </div>
          </template>

          <div class="relationship-next-tests">
            <p v-if="!result.Interest_Score">{{ result.paidUpsell }}</p>
            <router-link class="secondary-action" to="/attachment">可选补依恋</router-link>
            <router-link class="secondary-action" to="/tarot">抽关系塔罗</router-link>
            <router-link class="secondary-action" to="/synastry">看长期契合度</router-link>
          </div>
        </section>

        <PaymentModal
          v-if="showPayment"
          test-type="relationship-ai"
          plan-id="relationship-ai"
          @close="showPayment = false"
          @success="handlePaymentSuccess"
        />
      </main>
    `
  })

  


  // ─── Color Test & Result ──────────────────────────────────
  const ColorTest = defineComponent({
    name: 'ColorTestPage',
    setup() {
      const router = useRouter()
      const availableColors = ref([...window.COLOR_DATA.colors])
      const selections = ref([])
      const isCompleting = ref(false)

      const selectColor = (color) => {
        selections.value.push(color)
        availableColors.value = availableColors.value.filter(c => c.id !== color.id)
        AudioSynth.playHover()
      }

      const resetSelection = () => {
        availableColors.value = [...window.COLOR_DATA.colors]
        selections.value = []
      }

      const finishTest = () => {
        isCompleting.value = true
        const result = {
          selections: selections.value.map(c => c.id)
        }
        saveResultDraft('color', result)
        setTimeout(() => {
          router.push('/color-result')
        }, 1000)
      }

      return { availableColors, selections, selectColor, resetSelection, finishTest, isCompleting }
    },
    template: `
      <main class="color-test section">
        <div class="test-header" v-reveal>
          <p class="section-kicker">色彩心理</p>
          <h2>色彩心理测试</h2>
          <p class="lede">请凭第一直觉，依次选择你【最喜欢】的颜色，直至选完所有 8 种颜色。</p>
        </div>

        <div class="color-selections-bar" v-reveal v-if="selections.length > 0" style="margin-top:20px;">
          <p class="payment-subtitle" style="margin-bottom: 10px;">已选择顺序：</p>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <div v-for="(col, idx) in selections" :key="col.id" :style="{ backgroundColor: col.hex }" style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: bold; border: 2px solid rgba(255,255,255,0.4);">
              {{ idx + 1 }}
            </div>
          </div>
        </div>

        <div class="color-grid" v-reveal v-if="availableColors.length > 0" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; max-width: 500px; margin: 30px auto;">
          <div
            v-for="col in availableColors"
            :key="col.id"
            :style="{ backgroundColor: col.hex }"
            @click="selectColor(col)"
            style="aspect-ratio: 1; border-radius: 8px; cursor: pointer; transition: 0.3s; border: 2px solid rgba(255,255,255,0.1);"
            class="color-block"
          ></div>
        </div>

        <div class="action-area" style="margin-top: 40px; display: flex; gap: 15px; justify-content: center;">
          <button v-if="selections.length > 0" class="secondary-action" @click="resetSelection" :disabled="isCompleting">重新选择</button>
          <button v-if="selections.length === 8" class="primary-action" @click="finishTest" :disabled="isCompleting">
            {{ isCompleting ? '正在推演色彩磁场...' : '✧ 生成我的色彩报告' }}
          </button>
        </div>
      </main>
    `
  })

  const ColorResult = defineComponent({
    name: 'ColorResultPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const showPayment = ref(false)
      const hasPaid = ref(isTestUnlocked('color'))
      const displayedDeepText = ref('')
      const isTyping = ref(false)

      const draft = loadResultDraft('color')
      if (!draft || !draft.selections) {
        router.push('/color')
        return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess: () => {}, generatePoster: () => {}, restartTest: () => {} }
      }

      const orderId = ref(draft.orderId || null)
      const selections = draft.selections
      const colorObjects = selections.map(id => window.COLOR_DATA.colors.find(c => c.id === id)).filter(Boolean)

      onMounted(async () => {
        if (draft && !orderId.value) {
          try {
            const orderData = await store.createOrder('color', { selections: draft.selections })
            if (orderData && orderData.orderId) {
              orderId.value = orderData.orderId
              draft.orderId = orderData.orderId
              saveResultDraft('color', draft)
            }
          } catch (e) {
            console.error(e)
          }
        }
      })

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        unlockPlan(plan && plan.id, 'color')
        setStoredTestOrderId('color', plan && plan.orderId)
        hasPaid.value = true

        const intro = `系统已成功接通色彩潜意识光谱。\n正在为您呈现最真实的色彩性格解读...\n\n`
        let body = ''
        for (let i = 0; i < 4; i++) {
          const colId = selections[i]
          const interpretation = window.COLOR_DATA.interpretations[colId]
          body += `【第 ${i + 1} 顺位：${colorObjects[i].name}】—— ${window.COLOR_DATA.positions[i + 1]}\n`
          body += `基本释义：${interpretation.meaning}\n`
          body += `${interpretation.deep}\n\n`
        }

        saveToArchive('Color', '色彩心理完整解读', body)
        const fullText = await generatePaidAIReport({
          testType: 'color',
          orderId: plan && plan.orderId,
          resultSummary: `色彩顺序：${colorObjects.map(c => c.name).join(' > ')}`,
          baseDeepReport: intro + body,
          userInputs: { selections },
          context: { selections }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('color') })
        }, 0)
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('color-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_Color.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const restartTest = () => {
        clearResultDraft('color')
        clearAIReportCache('color')
        router.push('/color')
      }

      onMounted(() => {
        window.__northstarFx?.clearPattern()
      })
      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
      })

      return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess, colorObjects, generatePoster, restartTest, skipTypewriter, orderId }
    },
    template: `
      <main class="result-page section">
        <div v-reveal>
          <p class="section-kicker">测试结果</p>
          <h2>色彩心理测试报告</h2>
          <p class="lede">你的色彩心理排序已完成。</p>
        </div>

        <section class="test-summary" v-reveal style="margin-top: 30px;">
          <h3>你的色彩排序选择</h3>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
            <div v-for="(col, idx) in colorObjects" :key="col.id" style="display: flex; flex-direction: column; align-items: center; gap: 5px; width: 60px;">
              <div :style="{ backgroundColor: col.hex }" style="width: 50px; height: 50px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1);"></div>
              <span style="font-size: 12px; color: rgba(255,255,255,0.6);">{{ idx + 1 }}. {{ col.name }}</span>
            </div>
          </div>
        </section>

        <section class="report-content" style="margin-top: 40px;">
          <div class="paywall-overlay" v-if="!hasPaid" v-reveal>
            <div class="paywall-card">
              <h3>✦ 查看完整色彩解读 ✦</h3>
              <p>会说明你前几位颜色对应的当下心境、真实需要、压力来源，以及可以怎么照顾自己。</p>
              <button class="primary-action" @click="showPayment = true">查看上线方案</button>
            </div>
          </div>

          <div class="deep-content" :class="{ 'is-blurred': !hasPaid }" v-if="!hasPaid" v-reveal>
            <div class="deep-section">
              <h4>【第 1 顺位 - 核心基本心态】</h4>
              <p>这里有你对宁静与归属感的绝对渴求。你当前极力寻找能够信任的关系，以至于你用温柔的沉默防御着一切可能的矛盾与虚伪...</p>
            </div>
          </div>

          <div class="deep-content ai-mode" v-if="hasPaid" v-reveal style="position: relative;">
            <div class="deep-section">
              <professional-report
                :text="displayedDeepText"
                :is-typing="isTyping"
                title="色彩心理专业报告"
                result-label="当下色彩心理轨迹"
                @skip="skipTypewriter"
              />
              <div class="action-area" v-if="hasPaid && !isTyping" style="margin-top: 20px; display:flex; gap:10px; justify-content:center;">
                <button class="secondary-action" @click="restartTest">重新测试</button>
              </div>
            </div>
          </div>
        </section>

        <PaymentModal
          v-if="showPayment"
          :orderId="orderId"
          @close="showPayment = false"
          @success="handlePaymentSuccess"
        />
      </main>
    `
  })

  // ─── Enneagram Test & Result ──────────────────────────────
  const EnneagramTest = defineComponent({
    name: 'EnneagramTestPage',
    setup() {
      const router = useRouter()
      const currentQuestionIndex = ref(0)
      const answers = reactive({})
      const isCompleting = ref(false)
      const isTransitioning = ref(false)
      const currentQ = computed(() => window.ENNEAGRAM_DATA.questions[currentQuestionIndex.value])
      const answeredCount = computed(() => Object.keys(answers).length)
      const progress = computed(() => Math.min(100, (answeredCount.value / window.ENNEAGRAM_DATA.questions.length) * 100))

      const selectAnswer = (qId, value) => {
        if (isTransitioning.value) return
        answers[qId] = value
        AudioSynth.playHover()
        if (currentQuestionIndex.value < window.ENNEAGRAM_DATA.questions.length - 1) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value++
            isTransitioning.value = false
          }, 300)
        }
      }

      const prevQuestion = () => {
        if (currentQuestionIndex.value > 0 && !isTransitioning.value) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value--
            isTransitioning.value = false
          }, 300)
        }
      }

      const finishTest = async () => {
        isCompleting.value = true
        const res = await fetch('/api/tests/enneagram/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        })
        const data = await res.json()
        
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
        
        saveResultDraft('enneagram', { dominant, scores, answers, orderId: data.orderId })
        setTimeout(() => {
          router.push('/enneagram-result')
        }, 1000)
      }

      return { questions: window.ENNEAGRAM_DATA.questions, currentQuestionIndex, answers, progress, isCompleting, answeredCount, currentQ, selectAnswer, prevQuestion, finishTest }
    },
    template: `
      <main class="enneagram-test section">
        <div class="test-header" v-reveal>
          <p class="section-kicker">人格测评</p>
          <h2>九型人格测试</h2>
          <p class="lede">请根据真实感受回答以下 {{ questions.length }} 个问题，了解你的深层动机与行为模式。</p>
        </div>

        <div class="mbti-progress-container" v-reveal>
          <div class="mbti-progress-bar">
            <div class="mbti-progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="mbti-progress-text">已完成 {{ answeredCount }} / {{ questions.length }}</div>
        </div>

        <div class="questions-list">
          <transition name="slide-up" mode="out-in">
            <div :key="'q-' + currentQ.id" class="question-card active">
              <p class="question-text">{{ currentQ.id }}. {{ currentQ.text }}</p>
              <div class="scale-options">
                <div class="scale-btn agree size-1" :class="{ selected: answers[currentQ.id] === 3 }" @click="selectAnswer(currentQ.id, 3)"></div>
                <div class="scale-btn agree size-2" :class="{ selected: answers[currentQ.id] === 2 }" @click="selectAnswer(currentQ.id, 2)"></div>
                <div class="scale-btn agree size-3" :class="{ selected: answers[currentQ.id] === 1 }" @click="selectAnswer(currentQ.id, 1)"></div>
                <div class="scale-btn neutral size-3" :class="{ selected: answers[currentQ.id] === 0 }" @click="selectAnswer(currentQ.id, 0)"></div>
                <div class="scale-btn disagree size-3" :class="{ selected: answers[currentQ.id] === -1 }" @click="selectAnswer(currentQ.id, -1)"></div>
                <div class="scale-btn disagree size-2" :class="{ selected: answers[currentQ.id] === -2 }" @click="selectAnswer(currentQ.id, -2)"></div>
                <div class="scale-btn disagree size-1" :class="{ selected: answers[currentQ.id] === -3 }" @click="selectAnswer(currentQ.id, -3)"></div>
              </div>
              <div class="scale-labels">
                <span class="label-agree">完全同意</span>
                <span class="label-disagree">完全反对</span>
              </div>
              <div class="back-btn-container" style="text-align: center; margin-top: 30px; height: 40px;">
                <button v-if="currentQuestionIndex > 0" class="secondary-action" @click="prevQuestion" style="font-size: 14px; padding: 8px 16px; border:none; background:transparent; color:#888; text-decoration:underline;">⬅ 返回上一题</button>
              </div>
            </div>
          </transition>
        </div>

        <div class="action-area" v-if="answeredCount === questions.length" style="margin-top: 40px;">
          <button class="primary-action" @click="finishTest" :disabled="isCompleting">
            {{ isCompleting ? '正在生成九型人格报告...' : '✧ 生成我的九型人格报告' }}
          </button>
        </div>
      </main>
    `
  })

  const EnneagramResult = defineComponent({
    name: 'EnneagramResultPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const showPayment = ref(false)
      const hasPaid = ref(isTestUnlocked('enneagram'))
      const displayedDeepText = ref('')
      const isTyping = ref(false)

      const draft = loadResultDraft('enneagram')
      if (!draft || !draft.dominant) {
        router.push('/enneagram')
        return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess: () => {}, generatePoster: () => {}, restartTest: () => {} }
      }

      const orderId = ref(draft.orderId || null)
      const dominant = draft.dominant
      const typeData = ref({ type: dominant, ...window.ENNEAGRAM_DATA.profiles[dominant] })

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        unlockPlan(plan && plan.id, 'enneagram')
        setStoredTestOrderId('enneagram', plan && plan.orderId)
        hasPaid.value = true

        const intro = `正在生成【${typeData.value.name}】的深度人格报告...\n\n`
        const body = typeData.value.deep

        saveToArchive('Enneagram', typeData.value.name + ' 完整解读', body)
        const fullText = await generatePaidAIReport({
          testType: 'enneagram',
          orderId: plan && plan.orderId,
          resultSummary: `九型人格主导：${typeData.value.name}`,
          baseDeepReport: intro + body,
          userInputs: { dominant },
          context: { profile: typeData.value }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('enneagram') })
        }, 0)
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('enneagram-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_Enneagram_${dominant}.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const restartTest = () => {
        clearResultDraft('enneagram')
        clearAIReportCache('enneagram')
        router.push('/enneagram')
      }

      onMounted(() => {
        window.__northstarFx?.clearPattern()
      })
      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
      })

      return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess, typeData, generatePoster, restartTest, skipTypewriter, orderId }
    },
    template: `
      <main class="result-page section">
        <div v-reveal>
          <p class="section-kicker">测试结果</p>
          <h2>九型人格报告</h2>
          <p class="lede">你的主导类型是：<strong>{{ typeData.name }}</strong></p>
          <p class="lede-desc" style="color: rgba(255,255,255,0.6); max-width:600px; margin: 10px auto;">{{ typeData.desc }}</p>
        </div>

        <section class="report-content" style="margin-top: 40px;">
          <div class="paywall-overlay" v-if="!hasPaid" v-reveal>
            <div class="paywall-card">
              <h3>✦ 查看完整九型解读 ✦</h3>
              <p>会说明你最在意什么、压力下容易怎么反应，以及在人际和亲密关系里可以怎么调整。</p>
              <button class="primary-action" @click="showPayment = true">查看上线方案</button>
            </div>
          </div>

          <div class="deep-content" :class="{ 'is-blurred': !hasPaid }" v-if="!hasPaid" v-reveal>
            <div class="deep-section">
              <h4>【核心动机画像】</h4>
              <p>完整报告会从你的主导类型出发，整理你最在意的安全感、价值感和关系位置，并说明压力下哪些反应容易被放大...</p>
            </div>
          </div>

          <div class="deep-content ai-mode" v-if="hasPaid" v-reveal style="position: relative;">
            <div class="deep-section">
              <professional-report
                :text="displayedDeepText"
                :is-typing="isTyping"
                title="九型人格专业报告"
                :result-label="typeData.name"
                @skip="skipTypewriter"
              />
              <div class="action-area" v-if="hasPaid && !isTyping" style="margin-top: 20px; display:flex; gap:10px; justify-content:center;">
                <button class="secondary-action" @click="restartTest">重新测试</button>
              </div>
            </div>
          </div>
        </section>

        <PaymentModal
          v-if="showPayment"
          :orderId="orderId"
          @close="showPayment = false"
          @success="handlePaymentSuccess"
        />
      </main>
    `
  })

  // ─── Jungian 8 Cognitive Functions Test & Result ──────────
  const Jung8Test = defineComponent({
    name: 'Jung8TestPage',
    setup() {
      const router = useRouter()
      const currentQuestionIndex = ref(0)
      const answers = reactive({})
      const isCompleting = ref(false)
      const isTransitioning = ref(false)
      const currentQ = computed(() => window.JUNG8_DATA.questions[currentQuestionIndex.value])
      const answeredCount = computed(() => Object.keys(answers).length)
      const progress = computed(() => Math.min(100, (answeredCount.value / window.JUNG8_DATA.questions.length) * 100))

      const selectAnswer = (qId, value) => {
        if (isTransitioning.value) return
        answers[qId] = value
        AudioSynth.playHover()
        if (currentQuestionIndex.value < window.JUNG8_DATA.questions.length - 1) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value++
            isTransitioning.value = false
          }, 300)
        }
      }

      const prevQuestion = () => {
        if (currentQuestionIndex.value > 0 && !isTransitioning.value) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value--
            isTransitioning.value = false
          }, 300)
        }
      }

      const finishTest = async () => {
        isCompleting.value = true
        const res = await fetch('/api/tests/jung8/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        })
        const data = await res.json()
        
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
        
        saveResultDraft('jung8', { dominant, scores, answers, orderId: data.orderId })
        setTimeout(() => {
          router.push('/jung8-result')
        }, 1000)
      }

      return { questions: window.JUNG8_DATA.questions, currentQuestionIndex, answers, progress, isCompleting, answeredCount, currentQ, selectAnswer, prevQuestion, finishTest }
    },
    template: `
      <main class="enneagram-test section">
        <div class="test-header" v-reveal>
          <p class="section-kicker">认知功能</p>
          <h2>荣格八维认知测试</h2>
          <p class="lede">请凭直觉回答以下 {{ questions.length }} 个问题，全面扫描你的认知偏好与心智积淀。</p>
        </div>

        <div class="mbti-progress-container" v-reveal>
          <div class="mbti-progress-bar">
            <div class="mbti-progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="mbti-progress-text">已完成 {{ answeredCount }} / {{ questions.length }}</div>
        </div>

        <div class="questions-list">
          <transition name="slide-up" mode="out-in">
            <div :key="'q-' + currentQ.id" class="question-card active">
              <p class="question-text">{{ currentQ.id }}. {{ currentQ.text }}</p>
              <div class="scale-options">
                <div class="scale-btn agree size-1" :class="{ selected: answers[currentQ.id] === 3 }" @click="selectAnswer(currentQ.id, 3)"></div>
                <div class="scale-btn agree size-2" :class="{ selected: answers[currentQ.id] === 2 }" @click="selectAnswer(currentQ.id, 2)"></div>
                <div class="scale-btn agree size-3" :class="{ selected: answers[currentQ.id] === 1 }" @click="selectAnswer(currentQ.id, 1)"></div>
                <div class="scale-btn neutral size-3" :class="{ selected: answers[currentQ.id] === 0 }" @click="selectAnswer(currentQ.id, 0)"></div>
                <div class="scale-btn disagree size-3" :class="{ selected: answers[currentQ.id] === -1 }" @click="selectAnswer(currentQ.id, -1)"></div>
                <div class="scale-btn disagree size-2" :class="{ selected: answers[currentQ.id] === -2 }" @click="selectAnswer(currentQ.id, -2)"></div>
                <div class="scale-btn disagree size-1" :class="{ selected: answers[currentQ.id] === -3 }" @click="selectAnswer(currentQ.id, -3)"></div>
              </div>
              <div class="scale-labels">
                <span class="label-agree">完全同意</span>
                <span class="label-disagree">完全反对</span>
              </div>
              <div class="back-btn-container" style="text-align: center; margin-top: 30px; height: 40px;">
                <button v-if="currentQuestionIndex > 0" class="secondary-action" @click="prevQuestion" style="font-size: 14px; padding: 8px 16px; border:none; background:transparent; color:#888; text-decoration:underline;">⬅ 返回上一题</button>
              </div>
            </div>
          </transition>
        </div>

        <div class="action-area" v-if="answeredCount === questions.length" style="margin-top: 40px;">
          <button class="primary-action" @click="finishTest" :disabled="isCompleting">
            {{ isCompleting ? '正在推演八维天线...' : '✧ 生成我的荣格八维报告' }}
          </button>
        </div>
      </main>
    `
  })

  const Jung8Result = defineComponent({
    name: 'Jung8ResultPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const showPayment = ref(false)
      const hasPaid = ref(isTestUnlocked('jung8'))
      const displayedDeepText = ref('')
      const isTyping = ref(false)

      const draft = loadResultDraft('jung8')
      if (!draft || !draft.dominant || !draft.scores) {
        router.push('/jung8')
        return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess: () => {}, generatePoster: () => {}, restartTest: () => {}, scores: {} }
      }

      const orderId = ref(draft.orderId || null)
      const dominant = draft.dominant
      const scores = draft.scores
      const typeData = ref({ type: dominant, ...window.JUNG8_DATA.profiles[dominant] })

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        unlockPlan(plan && plan.id, 'jung8')
        setStoredTestOrderId('jung8', plan && plan.orderId)
        hasPaid.value = true

        const intro = `系统已完成你的荣格八维认知模型。\n正在整理认知功能说明...\n\n`
        const body = typeData.value.deep

        saveToArchive('Jung8', typeData.value.name + ' 完整解读', body)
        const fullText = await generatePaidAIReport({
          testType: 'jung8',
          orderId: plan && plan.orderId,
          resultSummary: `荣格八维第一主导：${typeData.value.name}，分数分布：${JSON.stringify(scores)}`,
          baseDeepReport: intro + body,
          userInputs: { dominant, scores },
          context: { profile: typeData.value }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('jung8') })
        }, 0)
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('jung8-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_Jung8_${dominant}.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const restartTest = () => {
        clearResultDraft('jung8')
        clearAIReportCache('jung8')
        router.push('/jung8')
      }

      onMounted(() => {
        window.__northstarFx?.clearPattern()
      })
      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
      })

      return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess, typeData, generatePoster, restartTest, scores, skipTypewriter, orderId }
    },
    template: `
      <main class="result-page section">
        <div v-reveal>
          <p class="section-kicker">测试结果</p>
          <h2>荣格八维认知报告</h2>
          <p class="lede">你的第一主导认知功能是：<strong>{{ typeData.name }}</strong></p>
          <p class="lede-desc" style="color: rgba(255,255,255,0.6); max-width:600px; margin: 10px auto;">{{ typeData.desc }}</p>
        </div>

        <section class="test-summary" v-reveal style="margin-top: 30px; max-width: 500px; margin-left: auto; margin-right: auto;">
          <h3>你的八大认知功能强度</h3>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px; text-align: left;">
            <div v-for="(score, func) in scores" :key="func" class="energy-card">
              <div class="energy-label" style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:5px;">
                <span>{{ func === 'Ni' ? '内倾直觉' : func === 'Ne' ? '外倾直觉' : func === 'Si' ? '内倾感觉' : func === 'Se' ? '外倾感觉' : func === 'Ti' ? '内倾思考' : func === 'Te' ? '外倾思考' : func === 'Fi' ? '内倾情感' : '外倾情感' }}</span>
                <span>{{ score }} 分</span>
              </div>
              <div class="energy-track" style="background: rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden;">
                <div class="energy-fill" :style="{ width: Math.max(0, Math.min(100, (score + 6) * 8.3)) + '%' }" style="background: linear-gradient(90deg, #4facfe, #00f2fe); height:100%;"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="report-content" style="margin-top: 40px;">
          <div class="paywall-overlay" v-if="!hasPaid" v-reveal>
            <div class="paywall-card">
              <h3>✦ 查看完整八维解读 ✦</h3>
              <p>会说明你更常用哪些认知功能、适合发挥的场景，以及容易忽略的另一面。</p>
              <button class="primary-action" @click="showPayment = true">查看上线方案</button>
            </div>
          </div>

          <div class="deep-content" :class="{ 'is-blurred': !hasPaid }" v-if="!hasPaid" v-reveal>
            <div class="deep-section">
              <h4>【核心能力优势与定位】</h4>
              <p>作为以此认知为主导的人，你在感知外界和处理内在逻辑时拥有一种天然的过滤网。这种认知逻辑非常罕见且极具特权，但也导致你在其他的劣势功能上面临心理卡点...</p>
            </div>
          </div>

          <div class="deep-content ai-mode" v-if="hasPaid" v-reveal style="position: relative;">
            <div class="deep-section">
              <professional-report
                :text="displayedDeepText"
                :is-typing="isTyping"
                title="荣格八维专业报告"
                :result-label="typeData.name"
                @skip="skipTypewriter"
              />
              <div class="action-area" v-if="hasPaid && !isTyping" style="margin-top: 20px; display:flex; gap:10px; justify-content:center;">
                <button class="secondary-action" @click="restartTest">重新测试</button>
              </div>
            </div>
          </div>
        </section>

        <PaymentModal
          v-if="showPayment"
          :orderId="orderId"
          @close="showPayment = false"
          @success="handlePaymentSuccess"
        />
      </main>
    `
  })

  // ─── Dark Triad Test & Result ─────────────────────────────
  const DarkTriadTest = defineComponent({
    name: 'DarkTriadTestPage',
    setup() {
      const router = useRouter()
      const currentQuestionIndex = ref(0)
      const answers = reactive({})
      const isCompleting = ref(false)
      const isTransitioning = ref(false)
      const currentQ = computed(() => window.DARKTRIAD_DATA.questions[currentQuestionIndex.value])
      const answeredCount = computed(() => Object.keys(answers).length)
      const progress = computed(() => Math.min(100, (answeredCount.value / window.DARKTRIAD_DATA.questions.length) * 100))

      const selectAnswer = (qId, value) => {
        if (isTransitioning.value) return
        answers[qId] = value
        AudioSynth.playHover()
        if (currentQuestionIndex.value < window.DARKTRIAD_DATA.questions.length - 1) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value++
            isTransitioning.value = false
          }, 300)
        }
      }

      const prevQuestion = () => {
        if (currentQuestionIndex.value > 0 && !isTransitioning.value) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value--
            isTransitioning.value = false
          }, 300)
        }
      }

      const finishTest = async () => {
        isCompleting.value = true
        const res = await fetch('/api/tests/darktriad/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        })
        const data = await res.json()
        
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
        
        saveResultDraft('darktriad', { dominant, scores, answers, orderId: data.orderId })
        setTimeout(() => {
          router.push('/darktriad-result')
        }, 1000)
      }

      return { questions: window.DARKTRIAD_DATA.questions, currentQuestionIndex, answers, progress, isCompleting, answeredCount, currentQ, selectAnswer, prevQuestion, finishTest }
    },
    template: `
      <main class="enneagram-test section">
        <div class="test-header" v-reveal>
          <p class="section-kicker">深层人格</p>
          <h2>黑暗三角人格测试</h2>
          <p class="lede">请根据真实感受回答以下 {{ questions.length }} 个问题，了解你在压力下可能出现的操控、防御与自我保护倾向。</p>
        </div>

        <div class="mbti-progress-container" v-reveal>
          <div class="mbti-progress-bar">
            <div class="mbti-progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="mbti-progress-text">已完成 {{ answeredCount }} / {{ questions.length }}</div>
        </div>

        <div class="questions-list">
          <transition name="slide-up" mode="out-in">
            <div :key="'q-' + currentQ.id" class="question-card active">
              <p class="question-text">{{ currentQ.id }}. {{ currentQ.text }}</p>
              <div class="scale-options">
                <div class="scale-btn agree size-1" :class="{ selected: answers[currentQ.id] === 3 }" @click="selectAnswer(currentQ.id, 3)"></div>
                <div class="scale-btn agree size-2" :class="{ selected: answers[currentQ.id] === 2 }" @click="selectAnswer(currentQ.id, 2)"></div>
                <div class="scale-btn agree size-3" :class="{ selected: answers[currentQ.id] === 1 }" @click="selectAnswer(currentQ.id, 1)"></div>
                <div class="scale-btn neutral size-3" :class="{ selected: answers[currentQ.id] === 0 }" @click="selectAnswer(currentQ.id, 0)"></div>
                <div class="scale-btn disagree size-3" :class="{ selected: answers[currentQ.id] === -1 }" @click="selectAnswer(currentQ.id, -1)"></div>
                <div class="scale-btn disagree size-2" :class="{ selected: answers[currentQ.id] === -2 }" @click="selectAnswer(currentQ.id, -2)"></div>
                <div class="scale-btn disagree size-1" :class="{ selected: answers[currentQ.id] === -3 }" @click="selectAnswer(currentQ.id, -3)"></div>
              </div>
              <div class="scale-labels">
                <span class="label-agree">完全同意</span>
                <span class="label-disagree">完全反对</span>
              </div>
              <div class="back-btn-container" style="text-align: center; margin-top: 30px; height: 40px;">
                <button v-if="currentQuestionIndex > 0" class="secondary-action" @click="prevQuestion" style="font-size: 14px; padding: 8px 16px; border:none; background:transparent; color:#888; text-decoration:underline;">⬅ 返回上一题</button>
              </div>
            </div>
          </transition>
        </div>

        <div class="action-area" v-if="answeredCount === questions.length" style="margin-top: 40px;">
          <button class="primary-action" @click="finishTest" :disabled="isCompleting">
            {{ isCompleting ? '正在生成分析结果...' : '✧ 生成我的黑暗三角报告' }}
          </button>
        </div>
      </main>
    `
  })

  const DarkTriadResult = defineComponent({
    name: 'DarkTriadResultPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const showPayment = ref(false)
      const hasPaid = ref(isTestUnlocked('darktriad'))
      const displayedDeepText = ref('')
      const isTyping = ref(false)

      const draft = loadResultDraft('darktriad')
      if (!draft || !draft.dominant || !draft.scores) {
        router.push('/darktriad')
        return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess: () => {}, generatePoster: () => {}, restartTest: () => {}, scores: {} }
      }

      const orderId = ref(draft.orderId || null)
      const dominant = draft.dominant
      const scores = draft.scores
      const typeData = ref({ type: dominant, ...window.DARKTRIAD_DATA.profiles[dominant] })

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        unlockPlan(plan && plan.id, 'darktriad')
        setStoredTestOrderId('darktriad', plan && plan.orderId)
        hasPaid.value = true

        const intro = `正在为你生成黑暗三角人格报告...\n\n`
        const body = typeData.value.deep

        saveToArchive('DarkTriad', typeData.value.name + ' 完整解读', body)
        const fullText = await generatePaidAIReport({
          testType: 'darktriad',
          orderId: plan && plan.orderId,
          resultSummary: `黑暗三角第一主导倾向：${typeData.value.name}，分数分布：${JSON.stringify(scores)}`,
          baseDeepReport: intro + body,
          userInputs: { dominant, scores },
          context: { profile: typeData.value }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('darktriad') })
        }, 0)
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('darktriad-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_DarkTriad_${dominant}.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const restartTest = () => {
        clearResultDraft('darktriad')
        clearAIReportCache('darktriad')
        router.push('/darktriad')
      }

      onMounted(() => {
        window.__northstarFx?.clearPattern()
      })
      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
      })

      return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess, typeData, generatePoster, restartTest, scores, skipTypewriter, orderId }
    },
    template: `
      <main class="result-page section">
        <div v-reveal>
          <p class="section-kicker">测试结果</p>
          <h2>黑暗三角人格报告</h2>
          <p class="lede">你的最突出倾向是：<strong>{{ typeData.name }}</strong></p>
          <p class="lede-desc" style="color: rgba(255,255,255,0.6); max-width:600px; margin: 10px auto;">{{ typeData.desc }}</p>
        </div>

        <section class="test-summary" v-reveal style="margin-top: 30px; max-width: 500px; margin-left: auto; margin-right: auto;">
          <h3>你的暗黑三角倾向程度</h3>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px; text-align: left;">
            <div v-for="(score, func) in scores" :key="func" class="energy-card">
              <div class="energy-label" style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:5px;">
                <span>{{ func === 'mach' ? '马基雅维利主义倾向' : func === 'narc' ? '自恋特质倾向' : '低共情冲动倾向' }}</span>
                <span>{{ score }} 分</span>
              </div>
              <div class="energy-track" style="background: rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden;">
                <div class="energy-fill" :style="{ width: Math.max(0, Math.min(100, (score + 12) * 4.16)) + '%' }" style="background: linear-gradient(90deg, #ff416c, #ff4b2b); height:100%;"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="report-content" style="margin-top: 40px;">
          <div class="paywall-overlay" v-if="!hasPaid" v-reveal>
            <div class="paywall-card">
              <h3>✦ 查看完整黑暗三角解读 ✦</h3>
              <p>会用更温和的方式说明你的自我保护、控制感需求和人际策略，不把结果当成标签。</p>
              <button class="primary-action" @click="showPayment = true">查看上线方案</button>
            </div>
          </div>

          <div class="deep-content" :class="{ 'is-blurred': !hasPaid }" v-if="!hasPaid" v-reveal>
            <div class="deep-section">
              <h4>【倾向模式解析】</h4>
              <p>在你的内心深处，世界是一个需要不断计算与控制的利益棋盘。为了防止受到伤害，你关闭了对脆弱性的容忍，这让你能够保持绝对冷静，但这也将人世的温暖隔离在外...</p>
            </div>
          </div>

          <div class="deep-content ai-mode" v-if="hasPaid" v-reveal style="position: relative;">
            <div class="deep-section">
              <professional-report
                :text="displayedDeepText"
                :is-typing="isTyping"
                title="黑暗三角专业报告"
                :result-label="typeData.name"
                @skip="skipTypewriter"
              />
              <div class="action-area" v-if="hasPaid && !isTyping" style="margin-top: 20px; display:flex; gap:10px; justify-content:center;">
                <button class="secondary-action" @click="restartTest">重新测试</button>
              </div>
            </div>
          </div>
        </section>

        <PaymentModal
          v-if="showPayment"
          :orderId="orderId"
          @close="showPayment = false"
          @success="handlePaymentSuccess"
        />
      </main>
    `
  })

  // ─── Inner Saboteurs Test & Result ────────────────────────
  const SaboteursTest = defineComponent({
    name: 'SaboteursTestPage',
    setup() {
      const router = useRouter()
      const currentQuestionIndex = ref(0)
      const answers = reactive({})
      const isCompleting = ref(false)
      const isTransitioning = ref(false)
      const currentQ = computed(() => window.SABOTEURS_DATA.questions[currentQuestionIndex.value])
      const answeredCount = computed(() => Object.keys(answers).length)
      const progress = computed(() => Math.min(100, (answeredCount.value / window.SABOTEURS_DATA.questions.length) * 100))

      const selectAnswer = (qId, value) => {
        if (isTransitioning.value) return
        answers[qId] = value
        AudioSynth.playHover()
        if (currentQuestionIndex.value < window.SABOTEURS_DATA.questions.length - 1) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value++
            isTransitioning.value = false
          }, 300)
        }
      }

      const prevQuestion = () => {
        if (currentQuestionIndex.value > 0 && !isTransitioning.value) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value--
            isTransitioning.value = false
          }, 300)
        }
      }

      const finishTest = async () => {
        isCompleting.value = true
        const res = await fetch('/api/tests/saboteurs/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        })
        const data = await res.json()
        
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
        
        saveResultDraft('saboteurs', { dominant, scores, answers, orderId: data.orderId })
        setTimeout(() => {
          router.push('/saboteurs-result')
        }, 1000)
      }

      return { questions: window.SABOTEURS_DATA.questions, currentQuestionIndex, answers, progress, isCompleting, answeredCount, currentQ, selectAnswer, prevQuestion, finishTest }
    },
    template: `
      <main class="enneagram-test section">
        <div class="test-header" v-reveal>
          <p class="section-kicker">内在阻碍模式</p>
          <h2>内在破坏者测试</h2>
          <p class="lede">请根据真实感受回答以下 {{ questions.length }} 个问题，了解哪些内在模式可能影响你的成就、关系与稳定感。</p>
        </div>

        <div class="mbti-progress-container" v-reveal>
          <div class="mbti-progress-bar">
            <div class="mbti-progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="mbti-progress-text">已完成 {{ answeredCount }} / {{ questions.length }}</div>
        </div>

        <div class="questions-list">
          <transition name="slide-up" mode="out-in">
            <div :key="'q-' + currentQ.id" class="question-card active">
              <p class="question-text">{{ currentQ.id }}. {{ currentQ.text }}</p>
              <div class="scale-options">
                <div class="scale-btn agree size-1" :class="{ selected: answers[currentQ.id] === 3 }" @click="selectAnswer(currentQ.id, 3)"></div>
                <div class="scale-btn agree size-2" :class="{ selected: answers[currentQ.id] === 2 }" @click="selectAnswer(currentQ.id, 2)"></div>
                <div class="scale-btn agree size-3" :class="{ selected: answers[currentQ.id] === 1 }" @click="selectAnswer(currentQ.id, 1)"></div>
                <div class="scale-btn neutral size-3" :class="{ selected: answers[currentQ.id] === 0 }" @click="selectAnswer(currentQ.id, 0)"></div>
                <div class="scale-btn disagree size-3" :class="{ selected: answers[currentQ.id] === -1 }" @click="selectAnswer(currentQ.id, -1)"></div>
                <div class="scale-btn disagree size-2" :class="{ selected: answers[currentQ.id] === -2 }" @click="selectAnswer(currentQ.id, -2)"></div>
                <div class="scale-btn disagree size-1" :class="{ selected: answers[currentQ.id] === -3 }" @click="selectAnswer(currentQ.id, -3)"></div>
              </div>
              <div class="scale-labels">
                <span class="label-agree">完全同意</span>
                <span class="label-disagree">完全反对</span>
              </div>
              <div class="back-btn-container" style="text-align: center; margin-top: 30px; height: 40px;">
                <button v-if="currentQuestionIndex > 0" class="secondary-action" @click="prevQuestion" style="font-size: 14px; padding: 8px 16px; border:none; background:transparent; color:#888; text-decoration:underline;">⬅ 返回上一题</button>
              </div>
            </div>
          </transition>
        </div>

        <div class="action-area" v-if="answeredCount === questions.length" style="margin-top: 40px;">
          <button class="primary-action" @click="finishTest" :disabled="isCompleting">
            {{ isCompleting ? '正在生成分析结果...' : '✧ 生成我的破坏者报告' }}
          </button>
        </div>
      </main>
    `
  })

  const SaboteursResult = defineComponent({
    name: 'SaboteursResultPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const showPayment = ref(false)
      const hasPaid = ref(isTestUnlocked('saboteurs'))
      const displayedDeepText = ref('')
      const isTyping = ref(false)

      const draft = loadResultDraft('saboteurs')
      if (!draft || !draft.dominant || !draft.scores) {
        router.push('/saboteurs')
        return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess: () => {}, generatePoster: () => {}, restartTest: () => {}, scores: {} }
      }

      const orderId = ref(draft.orderId || null)
      const dominant = draft.dominant
      const scores = draft.scores
      const typeData = ref({ type: dominant, ...window.SABOTEURS_DATA.profiles[dominant] })

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        unlockPlan(plan && plan.id, 'saboteurs')
        setStoredTestOrderId('saboteurs', plan && plan.orderId)
        hasPaid.value = true

        const intro = `正在整理内在模式完整解读...\n\n`
        const body = typeData.value.deep

        saveToArchive('Saboteurs', typeData.value.name + ' 完整解读', body)
        const fullText = await generatePaidAIReport({
          testType: 'saboteurs',
          orderId: plan && plan.orderId,
          resultSummary: `主要内在破坏者：${typeData.value.name}，倾向分数：${JSON.stringify(scores)}`,
          baseDeepReport: intro + body,
          userInputs: { dominant, scores },
          context: { profile: typeData.value }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('saboteurs') })
        }, 0)
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('saboteurs-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_Saboteurs_${dominant}.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const restartTest = () => {
        clearResultDraft('saboteurs')
        clearAIReportCache('saboteurs')
        router.push('/saboteurs')
      }

      onMounted(() => {
        window.__northstarFx?.clearPattern()
      })
      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
      })

      return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess, typeData, generatePoster, restartTest, scores, skipTypewriter, orderId }
    },
    template: `
      <main class="result-page section">
        <div v-reveal>
          <p class="section-kicker">测试结果</p>
          <h2>内在破坏者报告</h2>
          <p class="lede">你的主要内在模式是：<strong>{{ typeData.name }}</strong></p>
          <p class="lede-desc" style="color: rgba(255,255,255,0.6); max-width:600px; margin: 10px auto;">{{ typeData.desc }}</p>
        </div>

        <section class="test-summary" v-reveal style="margin-top: 30px; max-width: 500px; margin-left: auto; margin-right: auto;">
          <h3>内在模式强度分布</h3>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px; text-align: left;">
            <div v-for="(score, func) in scores" :key="func" class="energy-card">
              <div class="energy-label" style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:5px;">
                <span>{{ func === 'controller' ? '控制型保护模式' : func === 'pleaser' ? '迎合型保护模式' : func === 'stickler' ? '完美校准型保护模式' : func === 'rational' ? '超理智防御模式' : '受伤叙事型保护模式' }}</span>
                <span>{{ score }} 分</span>
              </div>
              <div class="energy-track" style="background: rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden;">
                <div class="energy-fill" :style="{ width: Math.max(0, Math.min(100, (score + 9) * 5.55)) + '%' }" style="background: linear-gradient(90deg, #e65c00, #F9D423); height:100%;"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="report-content" style="margin-top: 40px;">
          <div class="paywall-overlay" v-if="!hasPaid" v-reveal>
            <div class="paywall-card">
              <h3>✦ 查看完整内在模式解读 ✦</h3>
              <p>会帮你看见哪些内在声音总在拖住你，以及可以从哪里开始松动。</p>
              <button class="primary-action" @click="showPayment = true">查看上线方案</button>
            </div>
          </div>

          <div class="deep-content" :class="{ 'is-blurred': !hasPaid }" v-if="!hasPaid" v-reveal>
            <div class="deep-section">
              <h4>【自动化保护模式】</h4>
              <p>完整报告会帮你看见某个反复出现的内在声音：它原本可能是在保护你，但当它过度启动时，也会影响行动、亲密和自我信任...</p>
            </div>
          </div>

          <div class="deep-content ai-mode" v-if="hasPaid" v-reveal style="position: relative;">
            <div class="deep-section">
              <professional-report
                :text="displayedDeepText"
                :is-typing="isTyping"
                title="内在破坏者专业报告"
                :result-label="typeData.name"
                @skip="skipTypewriter"
              />
              <div class="action-area" v-if="hasPaid && !isTyping" style="margin-top: 20px; display:flex; gap:10px; justify-content:center;">
                <button class="secondary-action" @click="restartTest">重新测试</button>
              </div>
            </div>
          </div>
        </section>

        <PaymentModal
          v-if="showPayment"
          :orderId="orderId"
          @close="showPayment = false"
          @success="handlePaymentSuccess"
        />
      </main>
    `
  })

  // ─── Ego Defense Mechanisms Test & Result ──────────────────
  const DefenseTest = defineComponent({
    name: 'DefenseTestPage',
    setup() {
      const router = useRouter()
      const currentQuestionIndex = ref(0)
      const answers = reactive({})
      const isCompleting = ref(false)
      const isTransitioning = ref(false)
      const currentQ = computed(() => window.DEFENSE_DATA.questions[currentQuestionIndex.value])
      const answeredCount = computed(() => Object.keys(answers).length)
      const progress = computed(() => Math.min(100, (answeredCount.value / window.DEFENSE_DATA.questions.length) * 100))

      const selectAnswer = (qId, value) => {
        if (isTransitioning.value) return
        answers[qId] = value
        AudioSynth.playHover()
        if (currentQuestionIndex.value < window.DEFENSE_DATA.questions.length - 1) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value++
            isTransitioning.value = false
          }, 300)
        }
      }

      const prevQuestion = () => {
        if (currentQuestionIndex.value > 0 && !isTransitioning.value) {
          isTransitioning.value = true
          setTimeout(() => {
            currentQuestionIndex.value--
            isTransitioning.value = false
          }, 300)
        }
      }

      const finishTest = async () => {
        isCompleting.value = true
        const res = await fetch('/api/tests/defense/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        })
        const data = await res.json()
        
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
        
        saveResultDraft('defense', { dominant, scores, answers, orderId: data.orderId })
        setTimeout(() => {
          router.push('/defense-result')
        }, 1000)
      }

      return { questions: window.DEFENSE_DATA.questions, currentQuestionIndex, answers, progress, isCompleting, answeredCount, currentQ, selectAnswer, prevQuestion, finishTest }
    },
    template: `
      <main class="enneagram-test section">
        <div class="test-header" v-reveal>
          <p class="section-kicker">心理防御机制</p>
          <h2>心理防御机制测试</h2>
          <p class="lede">请凭直觉回答以下 {{ questions.length }} 个问题，解析你在压力与焦虑时的潜意识防御路径。</p>
        </div>

        <div class="mbti-progress-container" v-reveal>
          <div class="mbti-progress-bar">
            <div class="mbti-progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="mbti-progress-text">已完成 {{ answeredCount }} / {{ questions.length }}</div>
        </div>

        <div class="questions-list">
          <transition name="slide-up" mode="out-in">
            <div :key="'q-' + currentQ.id" class="question-card active">
              <p class="question-text">{{ currentQ.id }}. {{ currentQ.text }}</p>
              <div class="scale-options">
                <div class="scale-btn agree size-1" :class="{ selected: answers[currentQ.id] === 3 }" @click="selectAnswer(currentQ.id, 3)"></div>
                <div class="scale-btn agree size-2" :class="{ selected: answers[currentQ.id] === 2 }" @click="selectAnswer(currentQ.id, 2)"></div>
                <div class="scale-btn agree size-3" :class="{ selected: answers[currentQ.id] === 1 }" @click="selectAnswer(currentQ.id, 1)"></div>
                <div class="scale-btn neutral size-3" :class="{ selected: answers[currentQ.id] === 0 }" @click="selectAnswer(currentQ.id, 0)"></div>
                <div class="scale-btn disagree size-3" :class="{ selected: answers[currentQ.id] === -1 }" @click="selectAnswer(currentQ.id, -1)"></div>
                <div class="scale-btn disagree size-2" :class="{ selected: answers[currentQ.id] === -2 }" @click="selectAnswer(currentQ.id, -2)"></div>
                <div class="scale-btn disagree size-1" :class="{ selected: answers[currentQ.id] === -3 }" @click="selectAnswer(currentQ.id, -3)"></div>
              </div>
              <div class="scale-labels">
                <span class="label-agree">完全同意</span>
                <span class="label-disagree">完全反对</span>
              </div>
              <div class="back-btn-container" style="text-align: center; margin-top: 30px; height: 40px;">
                <button v-if="currentQuestionIndex > 0" class="secondary-action" @click="prevQuestion" style="font-size: 14px; padding: 8px 16px; border:none; background:transparent; color:#888; text-decoration:underline;">⬅ 返回上一题</button>
              </div>
            </div>
          </transition>
        </div>

        <div class="action-area" v-if="answeredCount === questions.length" style="margin-top: 40px;">
          <button class="primary-action" @click="finishTest" :disabled="isCompleting">
            {{ isCompleting ? '正在扫描自我防线...' : '✧ 生成我的防御机制报告' }}
          </button>
        </div>
      </main>
    `
  })

  const DefenseResult = defineComponent({
    name: 'DefenseResultPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const showPayment = ref(false)
      const hasPaid = ref(isTestUnlocked('defense'))
      const displayedDeepText = ref('')
      const isTyping = ref(false)

      const draft = loadResultDraft('defense')
      if (!draft || !draft.dominant || !draft.scores) {
        router.push('/defense')
        return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess: () => {}, generatePoster: () => {}, restartTest: () => {}, scores: {} }
      }

      const orderId = ref(draft.orderId || null)
      const dominant = draft.dominant
      const scores = draft.scores
      const typeData = ref({ type: dominant, ...window.DEFENSE_DATA.profiles[dominant] })

      const typewriter = createTypewriter(displayedDeepText, isTyping)
      const startTypewriter = (fullText) => typewriter.start(fullText, 30)
      const skipTypewriter = typewriter.skip

      const handlePaymentSuccess = async (plan) => {
        showPayment.value = false
        unlockPlan(plan && plan.id, 'defense')
        setStoredTestOrderId('defense', plan && plan.orderId)
        hasPaid.value = true

        const intro = `正在为你生成心理防御机制报告...\n\n`
        const body = typeData.value.deep

        saveToArchive('Defense', typeData.value.name + ' 完整解读', body)
        const fullText = await generatePaidAIReport({
          testType: 'defense',
          orderId: plan && plan.orderId,
          resultSummary: `主要心理防御机制：${typeData.value.name}，分数分布：${JSON.stringify(scores)}`,
          baseDeepReport: intro + body,
          userInputs: { dominant, scores },
          context: { profile: typeData.value }
        })
        startTypewriter(fullText)
      }

      if (hasPaid.value) {
        setTimeout(() => {
          handlePaymentSuccess({ id: 'single', orderId: getStoredTestOrderId('defense') })
        }, 0)
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('defense-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `Northstar_Defense_${dominant}.png`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const restartTest = () => {
        clearResultDraft('defense')
        clearAIReportCache('defense')
        router.push('/defense')
      }

      onMounted(() => {
        window.__northstarFx?.clearPattern()
      })
      onUnmounted(() => {
        window.__northstarFx?.clearPattern()
      })

      return { showPayment, hasPaid, displayedDeepText, isTyping, handlePaymentSuccess, typeData, generatePoster, restartTest, scores, skipTypewriter, orderId }
    },
    template: `
      <main class="result-page section">
        <div v-reveal>
          <p class="section-kicker">测试结果</p>
          <h2>心理防御机制报告</h2>
          <p class="lede">你的主要心理防御机制是：<strong>{{ typeData.name }}</strong></p>
          <p class="lede-desc" style="color: rgba(255,255,255,0.6); max-width:600px; margin: 10px auto;">{{ typeData.desc }}</p>
        </div>

        <section class="test-summary" v-reveal style="margin-top: 30px; max-width: 500px; margin-left: auto; margin-right: auto;">
          <h3>你的六大心理防御得分</h3>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px; text-align: left;">
            <div v-for="(score, func) in scores" :key="func" class="energy-card">
              <div class="energy-label" style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:5px;">
                <span>{{ func === 'projection' ? '投射机制防线' : func === 'rationalization' ? '合理化机制防线' : func === 'regression' ? '退行机制防线' : func === 'formation' ? '反向形成防线' : func === 'denial' ? '否认机制防线' : '升华机制防线' }}</span>
                <span>{{ score }} 分</span>
              </div>
              <div class="energy-track" style="background: rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden;">
                <div class="energy-fill" :style="{ width: Math.max(0, Math.min(100, (score + 6) * 8.3)) + '%' }" style="background: linear-gradient(90deg, #11998e, #38ef7d); height:100%;"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="report-content" style="margin-top: 40px;">
          <div class="paywall-overlay" v-if="!hasPaid" v-reveal>
            <div class="paywall-card">
              <h3>✦ 查看完整防御机制解读 ✦</h3>
              <p>会说明你遇到不安时常用的保护方式，它帮了你什么，又可能让你错过什么。</p>
              <button class="primary-action" @click="showPayment = true">查看上线方案</button>
            </div>
          </div>

          <div class="deep-content" :class="{ 'is-blurred': !hasPaid }" v-if="!hasPaid" v-reveal>
            <div class="deep-section">
              <h4>【防御机制解析】</h4>
              <p>当你遇到难以接受或者引发剧烈焦虑的现实时，你的潜意识会自动升起这道屏障来扭曲或者重新解释现实，以此保护自尊不受伤害，但这道防线也成为了你直面真实自我的隔板...</p>
            </div>
          </div>

          <div class="deep-content ai-mode" v-if="hasPaid" v-reveal style="position: relative;">
            <div class="deep-section">
              <professional-report
                :text="displayedDeepText"
                :is-typing="isTyping"
                title="心理防御专业报告"
                :result-label="typeData.name"
                @skip="skipTypewriter"
              />
              <div class="action-area" v-if="hasPaid && !isTyping" style="margin-top: 20px; display:flex; gap:10px; justify-content:center;">
                <button class="secondary-action" @click="restartTest">重新测试</button>
              </div>
            </div>
          </div>
        </section>

        <PaymentModal
          v-if="showPayment"
          :orderId="orderId"
          @close="showPayment = false"
          @success="handlePaymentSuccess"
        />
      </main>
    `
  })

  // ─── Router ─────────────────────────────────────────────────
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: Home },
      { path: '/tarot', component: TarotTest },
      { path: '/result', component: Result },
      { path: '/mbti', component: MBTITest },
      { path: '/mbti-result', component: MBTIResult },
      { path: '/attachment', component: AttachmentTest },
      { path: '/relationship-ai', component: RelationshipAI },
      { path: '/synastry', component: SynastryTest },
      { path: '/attachment-result', component: AttachmentResult },
      { path: '/astrology', component: AstrologyTest },
      { path: '/bazi', component: BaziTest },
      { path: '/human-design', component: HumanDesignTest },
      { path: '/aura', component: AuraTest },
      { path: '/shadow', component: ShadowTest },
      { path: '/payment-return', component: PaymentReturn },
      { path: '/restore-purchase', component: RestorePurchase },
      { path: '/archive', component: ArchivePage },
      { path: '/color', component: ColorTest },
      { path: '/color-result', component: ColorResult },
      { path: '/enneagram', component: EnneagramTest },
      { path: '/enneagram-result', component: EnneagramResult },
      { path: '/jung8', component: Jung8Test },
      { path: '/jung8-result', component: Jung8Result },
      { path: '/darktriad', component: DarkTriadTest },
      { path: '/darktriad-result', component: DarkTriadResult },
      { path: '/saboteurs', component: SaboteursTest },
      { path: '/saboteurs-result', component: SaboteursResult },
      { path: '/defense', component: DefenseTest },
      { path: '/defense-result', component: DefenseResult }
    ],
    scrollBehavior() { return { top: 0 } }
  })

  // ─── Create & Mount ─────────────────────────────────────────
  const app = createApp(App)
  app.config.errorHandler = (err, vm, info) => {
    console.error('[Northstar Vue Error]', err, info);
  };
  app.component('professional-report', ProfessionalReport)
  app.directive('reveal', {
    mounted(el) {
      el.classList.add('reveal')
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('active')
            obs.unobserve(entry.target)
          }
        })
      }, { threshold: 0.1 })
      observer.observe(el)
    }
  })
  app.use(router)
  app.mount('#app')
  console.log('[Northstar] App v2.0 mounted ✓')
})()
