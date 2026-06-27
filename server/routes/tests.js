const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateResult } = require('../core/engine');
const { buildPremiumBaseReport } = require('../services/private-content');
const { resolveLocationsAsync } = require('../services/location-resolver');
const {
  normalizeTestType: normalizeEntitlementTestType,
  orderUnlocksTest: orderHasEntitlement
} = require('../services/entitlements');
const { notifyOperations } = require('../services/notifications');

const router = express.Router();

const TEST_CATALOG = {
  mbti: 'MBTI 性格测试',
  attachment: '恋爱依恋测试',
  tarot: '塔罗牌占卜',
  astrology: '本命星盘解析',
  bazi: '八字命理排盘',
  'human-design': '人类图解析',
  synastry: '双人契合度合盘',
  aura: '灵魂光环测试',
  shadow: '暗影原型测试',
  color: '色彩心理测试',
  enneagram: '九型人格测试',
  jung8: '荣格八维测试',
  darktriad: '黑暗三角测试',
  saboteurs: '内在破坏者测试',
  defense: '心理防御机制测试'
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || process.env.TEST_AI_GEMINI_MODEL || 'gemini-2.5-flash';
const AI_ANALYSIS_CACHE_VERSION = 4;
const PROFESSIONAL_REPORT_VERSION = 'professional-long-v1';
const KNOWN_TESTS = new Set(Object.keys(TEST_CATALOG));

const REPORT_FOCUS = {
  mbti: 'energy direction, information processing, decision style, planning rhythm, work, relationships, and development of less-preferred functions',
  attachment: 'closeness, autonomy, reassurance, conflict cycles, repair, boundaries, and secure-behavior practice',
  tarot: 'the narrative connecting the cards, the user’s question, alternative interpretations, decision criteria, and reversible next steps',
  astrology: 'Sun, Moon, Ascendant, Midheaven, planetary placements, houses, major aspects, internal tensions, relationships, work, and development themes',
  bazi: 'Day Master, pillars, Five Elements, Ten Gods, timing rhythm, strengths, imbalances, relationships, work, and grounded choices',
  'human-design': 'type, strategy, authority, energy sustainability, conditioning, decision rhythm, relationships, work, and practical experiments',
  synastry: 'sources of ease, attraction, friction, communication patterns, emotional safety, boundaries, conflict repair, and shared decisions',
  aura: 'current emotional climate, outward signal, recovery needs, boundaries, relationships, and short-term experiments',
  shadow: 'protective purpose, triggers, blind spots, relational impact, shame-free integration, boundaries, and growth practices',
  color: 'selection order, current needs, avoided feelings, stress context, relationship signals, and changes worth retesting',
  enneagram: 'core motivation, attention pattern, strengths, fixation, stress and growth direction, relationships, work, and practices',
  jung8: 'function hierarchy, evidence from scores, dominant-loop risks, lower-function development, relationships, work, and decisions',
  darktriad: 'confidence, influence, skepticism, control, empathy, trust, boundaries, relational consequences, and transparent alternatives',
  saboteurs: 'protective origin, trigger cycle, predictions, costs, counter-evidence, relationships, work, and behavioral experiments',
  defense: 'protective function, triggers, short-term benefits, long-term costs, emotional awareness, relationships, and alternative responses'
};

function clampText(value, max = 12000) {
  return String(value || '').trim().slice(0, max);
}

function normalizeTestType(raw) {
  return normalizeEntitlementTestType(raw, KNOWN_TESTS);
}

function parseJson(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (e) {
    return fallback;
  }
}

function getCachedAIAnalysis(orderId, testType, locale = 'zh-CN') {
  const row = db.prepare('SELECT result_data FROM results WHERE order_id = ?').get(orderId);
  const resultData = parseJson(row && row.result_data, {});
  const aiAnalyses = resultData && resultData.aiAnalyses && typeof resultData.aiAnalyses === 'object'
    ? resultData.aiAnalyses
    : {};
  const cached = aiAnalyses[`${testType}:${locale}`] || null;
  return cached && cached.cacheVersion === AI_ANALYSIS_CACHE_VERSION ? cached : null;
}

function storeCachedAIAnalysis(orderId, testType, locale, analysis) {
  const row = db.prepare('SELECT result_data FROM results WHERE order_id = ?').get(orderId);
  const resultData = parseJson(row && row.result_data, {});
  const nextData = {
    ...resultData,
    aiAnalyses: {
      ...(resultData.aiAnalyses || {}),
      [`${testType}:${locale}`]: {
        ...analysis,
        cacheVersion: AI_ANALYSIS_CACHE_VERSION
      }
    }
  };

  db.prepare(`
    INSERT OR REPLACE INTO results (order_id, test_type, result_data)
    VALUES (?, ?, ?)
  `).run(orderId, testType, JSON.stringify(nextData));
}

router.get('/locations', async (req, res) => {
  const query = String(req.query.q || '').trim().slice(0, 80);
  const locale = String(req.query.locale || 'zh-CN');
  res.json({ locations: await resolveLocationsAsync(query, 8, locale) });
});

router.get('/astrology/locations', async (req, res) => {
  const query = String(req.query.q || '').trim().slice(0, 80);
  const locale = String(req.query.locale || 'zh-CN');
  res.json({ locations: await resolveLocationsAsync(query, 8, locale) });
});

function buildAIReportPrompt({ testType, resultSummary, baseDeepReport, userInputs, context, locale = 'zh-CN', priorDraft = '' }) {
  const focus = REPORT_FOCUS[testType] || 'the result evidence, strengths, tensions, relationships, decisions, stress patterns, and practical development';
  if (String(locale).toLowerCase().startsWith('en')) {
    return [
      'You are Northstar’s senior report editor. Produce a professional, substantial English long-form report using the base report and the user’s current result.',
      'Requirements:',
      '1. Be warm, precise, evidence-aware, grounded, and editorially polished. Do not sound like marketing copy or a generic AI answer.',
      '2. Do not shame, frighten, diagnose, or make absolute predictions. Do not provide medical, legal, investment, or other professional advice.',
      '3. Translate and integrate the useful meaning of the Chinese base report; do not mention that a translation occurred and do not include Chinese prose in the output.',
      '4. Write 10 to 12 numbered sections with specific, natural headings. Use plain numbered headings such as "01. Executive overview"; do not use Markdown # symbols.',
      '5. Cover: executive overview, evidence used, core pattern, strengths, blind spots, relationships, decisions/work, stress pattern, growth direction, a 30-day action plan, reflection questions, and limits of interpretation.',
      `6. Give special attention to: ${focus}.`,
      '7. Each section must reference concrete clues from the result summary, user input, context, or base report. If evidence is limited, distinguish observation from inference.',
      '8. Write approximately 2,000 to 3,500 English words. Avoid padding, repeated conclusions, mystical certainty, and vague affirmations.',
      '9. Include a practical 30-day plan with weekly actions and 5 tailored reflection questions.',
      '10. Output English only. The report must stand alone and feel suitable for a paid 15–20 minute reading.',
      '',
      `Reading type: ${TEST_CATALOG[testType] || testType}`,
      `Result summary: ${clampText(resultSummary, 2000) || 'Not provided'}`,
      `Base report: ${clampText(baseDeepReport, 6000) || 'Not provided'}`,
      `User input: ${JSON.stringify(userInputs || {}).slice(0, 3000)}`,
      `Context: ${JSON.stringify(context || {}).slice(0, 3000)}`,
      priorDraft
        ? [
            'A previous draft was too short or structurally incomplete. Rewrite it without referring to the previous draft.',
            'Use exactly these 12 numbered headings, each on its own line, in this order:',
            '01. Executive overview',
            '02. Evidence used',
            '03. Core pattern',
            '04. Strengths and resources',
            '05. Blind spots and trade-offs',
            '06. Relationships and communication',
            '07. Decisions and work style',
            '08. Stress pattern',
            '09. Growth direction',
            '10. 30-day action plan',
            '11. Reflection questions',
            '12. Limits of interpretation',
            `Draft to rewrite:\n${clampText(priorDraft, 14000)}`
          ].join('\n')
        : ''
    ].join('\n');
  }
  return [
    '你是 Northstar 的资深报告编辑。请根据完整解读、用户本次结果与输入，撰写一份可独立交付的专业中文长报告。',
    '要求：',
    '1. 语气温和、准确、具体、有编辑质感，不要像营销文案或套模板的 AI 回答。',
    '2. 不要毒舌，不要恐吓，不要绝对化判断，不要提供医学、法律、投资等专业诊断或承诺。',
    '3. 输出 10 到 12 个编号章节，使用“01. 总览”这类纯文本标题，不要使用 Markdown # 号。',
    '4. 必须覆盖：执行摘要、采用的证据、核心模式、优势资源、盲点与代价、关系互动、决策或工作方式、压力模式、成长方向、30 天行动计划、反思问题、解读边界。',
    `5. 本报告尤其要关注：${focus}。`,
    '6. 每一节引用来自结果摘要、用户输入、上下文或完整解读的具体线索；线索不足时明确区分“观察”与“推测”。',
    '7. 正文控制在约 3500 到 5500 个中文字符，不要靠重复、空泛鼓励或神秘化措辞凑长度。',
    '8. 30 天行动计划需要按周给出可执行动作，并提供 5 个贴合本次结果的反思问题。',
    '9. 报告应能独立阅读，达到付费专业长报告的完成度，预计阅读时间约 15–20 分钟。',
    '',
    `测试类型：${TEST_CATALOG[testType] || testType}`,
    `结果摘要：${clampText(resultSummary, 2000) || '未提供'}`,
    `完整解读正文：${clampText(baseDeepReport, 6000) || '未提供'}`,
    `用户输入：${JSON.stringify(userInputs || {}).slice(0, 3000)}`,
    `上下文：${JSON.stringify(context || {}).slice(0, 3000)}`,
    priorDraft
      ? [
          '上一版草稿长度或结构不足。请在不提及上一版的前提下重写。',
          '必须严格使用以下 12 个编号标题，每个标题独占一行并保持顺序：',
          '01. 执行摘要',
          '02. 采用的证据',
          '03. 核心模式',
          '04. 优势与资源',
          '05. 盲点与代价',
          '06. 关系与沟通',
          '07. 决策与工作方式',
          '08. 压力模式',
          '09. 成长方向',
          '10. 30 天行动计划',
          '11. 反思问题',
          '12. 解读边界',
          `需要重写的草稿：\n${clampText(priorDraft, 14000)}`
        ].join('\n')
      : ''
  ].join('\n');
}

function reportMetrics(text, locale) {
  const source = String(text || '').trim();
  const numberedSections = new Set();
  let bracketSections = 0;
  source.split('\n').forEach((line) => {
    const normalized = line.trim();
    const numbered = normalized.match(/^(?:\*{0,2}\s*)?(\d{1,2})[.)、]\s*/);
    if (numbered) {
      const sectionNumber = Number(numbered[1]);
      if (sectionNumber >= 1 && sectionNumber <= 12) numberedSections.add(sectionNumber);
    } else if (/^【[^】]{2,40}】/.test(normalized)) {
      bracketSections += 1;
    }
  });
  const sections = numberedSections.size || bracketSections;
  if (String(locale).toLowerCase().startsWith('en')) {
    const words = source.match(/\b[\p{L}\p{N}’'-]+\b/gu) || [];
    return { length: words.length, unit: 'words', sections };
  }
  const characters = source.match(/[\u3400-\u9fff]/gu) || [];
  return { length: characters.length, unit: 'characters', sections };
}

function meetsProfessionalStandard(text, locale) {
  const metrics = reportMetrics(text, locale);
  const minimum = String(locale).toLowerCase().startsWith('en') ? 1400 : 2400;
  return metrics.length >= minimum && metrics.sections >= 10;
}

async function generateGeminiText(payload) {
  if (!process.env.GEMINI_API_KEY) return null;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(120000),
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: buildAIReportPrompt(payload) }]
        }
      ],
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 8192
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error && data.error.message ? data.error.message : 'Gemini request failed');
  }
  const text = Array.isArray(data.candidates)
    ? data.candidates
      .flatMap((candidate) => candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts : [])
      .map((part) => part.text || '')
      .join('\n')
      .trim()
    : '';
  if (!text) throw new Error('Gemini response was empty');
  return text;
}

async function callGeminiAIReport(payload) {
  const firstDraft = await generateGeminiText(payload);
  if (!firstDraft || meetsProfessionalStandard(firstDraft, payload.locale)) return firstDraft;
  const expanded = await generateGeminiText({ ...payload, priorDraft: firstDraft });
  return expanded || firstDraft;
}

function buildFallbackAnalysis(testType, baseDeepReport, locale = 'zh-CN') {
  const subject = TEST_CATALOG[testType] || testType;
  if (String(locale).toLowerCase().startsWith('en')) {
    return [
      '01. Report status',
      `The live personalized editor is temporarily unavailable. Your paid ${subject} source reading remains unlocked and is shown with this recovery edition so you are not left with an empty result.`,
      '',
      '02. How to use the available evidence',
      'Treat the result as a working hypothesis. Mark the statements supported by recent behavior, the statements that appear only under stress, and the statements that do not fit. This separates useful observation from category-based assumption.',
      '',
      '03. Core pattern',
      'Look for the repeated strategy underneath the label: how you gather information, protect safety, make decisions, and respond when certainty is unavailable. The repeated strategy is usually more useful than the name of the result.',
      '',
      '04. Strengths in context',
      'A strength creates value only in a suitable context. Identify where the pattern improves clarity, consistency, empathy, creativity, or follow-through, and where the same strength becomes rigid through overuse.',
      '',
      '05. Blind spots',
      'Pay attention to what becomes harder to notice when your default strategy is active. Common blind spots include assuming intent, moving too quickly, delaying action, over-explaining, withdrawing, or treating discomfort as proof.',
      '',
      '06. Relationships',
      'Separate facts, interpretations, feelings, needs, and requests. This prevents a result label from becoming a shortcut for judging yourself or another person and turns the reading into a communication tool.',
      '',
      '07. Decisions and work',
      'Use the result to compare your preferred decision rhythm with the demands of the situation. Preserve what helps you think clearly, then deliberately add one missing perspective before committing.',
      '',
      '08. Stress pattern',
      'Record the earliest physical, emotional, and behavioral signs that the pattern is becoming automatic. Earlier recognition gives you more choices than trying to correct the reaction after it has escalated.',
      '',
      '09. Thirty-day practice',
      'Week 1: collect three real examples. Week 2: test one opposite or balancing behavior. Week 3: ask a trusted person what they observe. Week 4: keep the adjustment that improved outcomes and discard what did not.',
      '',
      '10. Reflection questions',
      'What evidence supports this result? When does the pattern help most? What need is it protecting? What does another person experience when it intensifies? What small experiment would produce better evidence?',
      '',
      '11. Limits',
      'This recovery edition is for reflection and entertainment and is not a diagnosis or professional advice. Mood, context, incomplete inputs, and test wording can affect the result.',
      '',
      '12. Next step',
      'Return later and regenerate the live personalized edition. Your paid access remains attached to the server-verified order.'
    ].join('\n');
  }
  return [
    '01. 报告状态',
    `当前个性化长报告生成服务暂时不可用。你已经付款解锁的${subject}基础正文仍然保留，以下恢复版用于保证本次交付不是空白。`,
    '',
    '02. 如何阅读现有证据',
    '先把结果当作一个需要验证的工作假设。分别标记“最近确实发生过”“只在压力下出现”“目前不符合”三类句子，这比全盘接受一个类型名称更有价值。',
    '',
    '03. 核心模式',
    '观察标签背后的重复策略：你怎样收集信息、保护安全感、做决定，以及在不确定时会采取什么动作。真正稳定的模式通常会在不同场景以相似方式出现。',
    '',
    '04. 优势资源',
    '优势只有放在适合的场景里才会产生价值。找出这个模式在哪些时刻提高了清晰度、执行力、共情、创造力或稳定性，同时留意它是否因为使用过度而变得僵化。',
    '',
    '05. 盲点与代价',
    '默认策略启动时，人容易忽略与自己预期不一致的信息。常见信号包括急于判断、拖延行动、过度解释、沉默撤退、猜测他人意图，或把不舒服直接当成危险证据。',
    '',
    '06. 关系互动',
    '把事实、解释、感受、需要和请求分开。这样可以避免用测试标签评价自己或对方，也能把报告转化成更具体的沟通工具。',
    '',
    '07. 决策与行动',
    '比较你习惯的决策节奏与当前问题真正需要的节奏。保留能帮助你思考清楚的部分，再主动加入一个平时容易忽略的角度，然后再做承诺。',
    '',
    '08. 压力模式',
    '记录模式自动化之前最早出现的身体、情绪和行为信号。越早识别，越容易在反应升级之前保留选择空间。',
    '',
    '09. 三十天行动计划',
    '第一周收集三个真实场景；第二周尝试一个与默认反应相反或互补的小动作；第三周询问一位可信任的人看到了什么；第四周保留确实改善结果的调整。',
    '',
    '10. 五个反思问题',
    '哪些事实支持这份结果？它在什么场景最有帮助？它正在保护什么需要？它变强时别人会经历什么？哪一个小实验能带来更可靠的新证据？',
    '',
    '11. 解读边界',
    '这份恢复版用于自我观察与娱乐，不构成心理诊断或其他专业建议。情绪状态、文化背景、输入完整度和题目措辞都可能影响结果。',
    '',
    '12. 下一步',
    '你可以稍后回到本页重新生成在线个性化长报告，服务器已确认的付费权益不会因此失效。'
  ].filter(Boolean).join('\n');
}

// Submit input data and get an Order ID
router.post('/:type/calculate', (req, res) => {
  const { type } = req.params;
  const payload = req.body;
  
  const orderId = uuidv4();
  
  try {
    // 1. Calculate result on the server
    const resultData = generateResult(type, payload);
    
    // 2. Save order as 'pending'
    const insertOrder = db.prepare('INSERT INTO orders (id, test_type, payload) VALUES (?, ?, ?)');
    insertOrder.run(orderId, type, JSON.stringify(payload));
    
    // 3. Save result secretly (locked until paid)
    const insertResult = db.prepare('INSERT INTO results (order_id, test_type, result_data) VALUES (?, ?, ?)');
    insertResult.run(orderId, type, JSON.stringify(resultData));
    
    // Basic calculation preview for frontend rendering
    let preview = null;
    if (type === 'bazi') {
      preview = {
        yearPillar: resultData.yearPillar,
        monthPillar: resultData.monthPillar,
        dayPillar: resultData.dayPillar,
        timePillar: resultData.timePillar,
        dayMaster: resultData.dayMaster,
        zodiac: resultData.zodiac,
        wuXing: resultData.wuXing,
        naYin: resultData.naYin,
        tenGods: resultData.tenGods,
        localDateTime: resultData.localDateTime,
        timezone: resultData.timezone,
        timezoneLabel: resultData.timezoneLabel,
        birthTimeDisplay: resultData.birthTimeDisplay,
        locationLabel: resultData.locationLabel
      };
    } else if (type === 'astrology') {
      preview = {
        ...resultData
      };
    }
    
    res.json({ orderId, status: 'pending', preview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Calculation failed' });
  }
});

// Fetch result (only if paid)
router.get('/result/:orderId', (req, res) => {
  const { orderId } = req.params;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (order.status !== 'paid') {
    return res.status(402).json({ error: 'Payment required' });
  }
  
  const resultRow = db.prepare('SELECT result_data FROM results WHERE order_id = ?').get(orderId);
  res.json({ order, result: JSON.parse(resultRow.result_data) });
});

router.post('/:type/ai-analysis', async (req, res) => {
  const testType = normalizeTestType(req.params.type || req.body.testType);
  if (!testType) return res.status(404).json({ error: 'Unsupported test type' });

  const orderId = clampText(req.body && req.body.orderId, 120);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!orderHasEntitlement(order, testType, KNOWN_TESTS)) {
    const english = String(req.body && req.body.locale || '').toLowerCase().startsWith('en');
    return res.status(402).json({
      error: 'PAYMENT_REQUIRED',
      message: english
        ? 'This personalized follow-up requires a paid order verified by the server.'
        : '本次结果补充需要服务器可验证的已支付订单。'
    });
  }

  const locale = String(req.body && req.body.locale || '').toLowerCase().startsWith('en') ? 'en' : 'zh-CN';
  const forceRefresh = req.body && req.body.forceRefresh === true;
  const cached = forceRefresh ? null : getCachedAIAnalysis(orderId, testType, locale);
  if (cached && cached.baseReport && !cached.fallbackUsed) return res.json(cached);

  const resultSummary = clampText(req.body && req.body.resultSummary, 3000);
  const userInputs = req.body && req.body.userInputs && typeof req.body.userInputs === 'object' ? req.body.userInputs : {};
  const context = req.body && req.body.context && typeof req.body.context === 'object' ? req.body.context : {};
  const baseDeepReport = clampText(buildPremiumBaseReport(testType, {
    resultSummary,
    userInputs,
    context,
    locale
  }));
  const payload = {
    testType,
    resultSummary,
    baseDeepReport,
    userInputs,
    context,
    locale
  };

  const generatedAt = new Date().toISOString();
  let analysisText = '';
  let provider = 'local';
  let fallbackUsed = false;

  try {
    const geminiText = await callGeminiAIReport(payload);
    if (geminiText) {
      analysisText = geminiText;
      provider = 'gemini';
    }
  } catch (error) {
    console.error('Test AI analysis failed:', error.message);
    void notifyOperations('test_ai_provider_failed', {
      orderId,
      testType,
      locale,
      message: error.message
    });
  }

  if (!analysisText) {
    fallbackUsed = true;
    analysisText = buildFallbackAnalysis(testType, baseDeepReport, locale);
  }

  const combinedForMetrics = locale === 'en' && !fallbackUsed
    ? analysisText
    : [baseDeepReport, analysisText].filter(Boolean).join('\n\n');
  const reportMeta = {
    version: PROFESSIONAL_REPORT_VERSION,
    ...reportMetrics(combinedForMetrics, locale),
    professionalStandardMet: meetsProfessionalStandard(combinedForMetrics, locale),
    estimatedReadMinutes: Math.max(
      1,
      Math.ceil(
        reportMetrics(combinedForMetrics, locale).length
        / (locale === 'en' ? 190 : 350)
      )
    )
  };
  const result = { provider, baseReport: baseDeepReport, analysisText, fallbackUsed, generatedAt, reportMeta };
  if (!fallbackUsed) storeCachedAIAnalysis(orderId, testType, locale, result);
  res.json(result);
});

module.exports = router;
