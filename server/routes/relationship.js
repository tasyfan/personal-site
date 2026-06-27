const express = require('express');
const db = require('../db');
const { notifyOperations } = require('../services/notifications');

const router = express.Router();

const MAX_CHAT_CHARS = 12000;
const OPENAI_MODEL = process.env.RELATIONSHIP_AI_MODEL || 'gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || process.env.RELATIONSHIP_AI_GEMINI_MODEL || 'gemini-2.5-flash';
const REQUIRE_PAYMENT = process.env.RELATIONSHIP_AI_REQUIRE_PAYMENT !== 'false';

function requireAdmin(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  const header = req.get('authorization') || '';
  const provided = header.replace(/^Bearer\s+/i, '');

  if (!token) return res.status(503).json({ error: 'Admin token is not configured' });
  if (provided !== token) return res.status(401).json({ error: 'Unauthorized' });

  next();
}

function clampText(value, max = MAX_CHAT_CHARS) {
  return String(value || '').trim().slice(0, max);
}

function normalizeStage(value) {
  const allowed = new Set(['暧昧观察期', '热恋推进期', '稳定磨合期', '冷淡拉扯期', '分手修复期', '长期承诺期', '不确定']);
  const stage = String(value || '不确定').trim();
  return allowed.has(stage) ? stage : '不确定';
}

function parsePayload(row) {
  try {
    return row && row.payload ? JSON.parse(row.payload) : {};
  } catch (e) {
    return {};
  }
}

function orderUnlocksRelationshipAI(orderId) {
  if (!orderId) return false;
  const row = db.prepare('SELECT id, test_type, status, payload FROM orders WHERE id = ?').get(String(orderId));
  if (!row || row.status !== 'paid') return false;

  const payload = parsePayload(row);
  const unlockTests = Array.isArray(payload.unlockTests) ? payload.unlockTests : [];
  const planId = payload.planId || '';
  return row.test_type === 'relationship-ai' ||
    unlockTests.includes('relationship-ai') ||
    ['relationship-ai', 'synastry-ai', 'relationship-plus', 'all-access'].includes(planId);
}

function buildSignals(payload) {
  const english = String(payload.locale || '').toLowerCase().startsWith('en');
  const fields = [
    payload.chatText,
    payload.knownFacts,
    payload.userProfile,
    payload.partnerProfile,
    payload.recentConflict,
    payload.userNeed
  ].map((item) => clampText(item, 3000)).filter(Boolean);

  const lengthScore = Math.min(42, Math.floor(clampText(payload.chatText).length / 180));
  const fieldScore = Math.min(40, fields.length * 8);
  const testScore = Math.min(18, [
    payload.mbti,
    payload.attachment,
    payload.synastry,
    payload.tarot
  ].filter(Boolean).length * 5);

  const score = Math.max(18, Math.min(100, lengthScore + fieldScore + testScore));
  const missing = [];
  if (!payload.chatText || clampText(payload.chatText).length < 80) missing.push(english ? 'More conversation excerpts (optional)' : '更多聊天片段（可选）');
  if (!payload.knownFacts) missing.push(english ? 'Relationship context or known details (optional)' : '关系背景、星座或已知相处细节（可选）');
  if (!payload.attachment) missing.push(english ? 'Attachment style (optional)' : '依恋倾向（可选）');
  if (!payload.mbti) missing.push(english ? 'MBTI or communication style (optional)' : 'MBTI 或沟通倾向（可选）');
  if (!payload.synastry) missing.push(english ? 'Long-term compatibility context (optional)' : '长期契合度资料（可选）');
  if (!payload.userNeed) missing.push(english ? 'The advice you want most (optional)' : '你最想得到的建议（可选）');

  return {
    score,
    level: english
      ? (score >= 76 ? 'Rich context' : score >= 48 ? 'Useful context' : 'Enough to begin')
      : (score >= 76 ? '线索丰富' : score >= 48 ? '建议更具体' : '现在就能开始'),
    missing
  };
}

function makeLocalAnalysis(payload) {
  const signals = buildSignals(payload);
  const chat = clampText(payload.chatText);
  const lowered = chat.toLowerCase();
  const hasDelay = /晚点|忙|没看到|再说|之后|回头|改天|sorry|忙完/.test(chat);
  const hasRepair = /对不起|抱歉|理解|我知道|我们聊聊|可以沟通|想解决/.test(chat);
  const hasPull = /想你|见面|喜欢|在乎|陪你|抱抱|期待/.test(chat);
  const hasBoundary = /压力|累|别逼|空间|冷静|不想说|烦|需要时间/.test(chat);
  const hasCommit = /以后|计划|一起|稳定|见父母|结婚|长期|未来/.test(chat);
  const hasConflict = /吵|争|冷战|分手|失望|生气|崩溃|拉黑|删除/.test(chat);

  let stage = normalizeStage(payload.relationshipStage);
  if (stage === '不确定') {
    if (hasCommit) stage = '长期承诺期';
    else if (hasConflict && hasRepair) stage = '分手修复期';
    else if (hasBoundary || hasDelay) stage = '冷淡拉扯期';
    else if (hasPull) stage = '热恋推进期';
    else stage = '暧昧观察期';
  }

  const english = String(payload.locale || '').toLowerCase().startsWith('en');
  if (english) {
    const stageNames = {
      '暧昧观察期': 'Early Exploration',
      '热恋推进期': 'Growing Connection',
      '稳定磨合期': 'Stable Adjustment',
      '冷淡拉扯期': 'Distance and Uncertainty',
      '分手修复期': 'Repair After Conflict',
      '长期承诺期': 'Long-Term Commitment',
      '不确定': 'Unclear'
    };
    const risks = [];
    if (hasBoundary) risks.push('One person appears to be asking for space or relief from pressure. Repeated questioning may feel intrusive.');
    if (hasDelay) risks.push('Reply timing is inconsistent. Look for a repeated pattern before deciding whether this is ordinary busyness or relationship avoidance.');
    if (hasConflict) risks.push('Recent conflict signals suggest that emotional safety should be repaired before discussing labels or commitment.');
    if (!risks.length) risks.push('There are no obvious high-pressure signals, but consistent actions matter more than affectionate words alone.');
    return {
      provider: 'local',
      confidence: signals,
      stage: stageNames[stage] || 'Unclear',
      summary: `Based on the current information, this relationship is closest to “${stageNames[stage] || 'Unclear'}.” The key question is not the meaning of one message, but whether both people can respond, explain, and repair when pressure appears.`,
      riskSignals: risks,
      nextActions: [
        'Shift the goal from proving whether the other person cares to seeing whether you can communicate consistently.',
        'Use a three-part message: what you observed, how it affected you, and what adjustment you would like.',
        'Avoid repeated testing or rapid follow-ups. If you need clarity, ask directly while leaving room for an honest answer.',
        'Additional context such as attachment style, MBTI, or compatibility can make the advice more specific, but you already have enough information to take one grounded next step.'
      ],
      paidUpsell: 'You can begin with partial information. Adding conversation excerpts or other relationship context later can make the guidance more specific.'
    };
  }

  const risk = [];
  if (hasBoundary) risk.push('一方正在表达空间或压力需求，继续追问容易被理解为逼迫。');
  if (hasDelay) risk.push('回复节奏不稳定，建议区分真实忙碌和关系回避，不要只凭单次延迟下结论。');
  if (hasConflict) risk.push('近期存在冲突信号，需要先修复情绪安全感，再讨论关系定义。');
  if (!risk.length) risk.push('当前没有明显高压信号，但仍建议观察行动一致性，而不是只看甜蜜表达。');

  const suggestions = [
    '先把目标从“确认对方爱不爱”换成“确认你们能否稳定沟通”。',
    '下一次沟通使用三段式表达：我观察到什么、我感受到什么、我希望怎么调整。',
    '避免连续追问和情绪化测试；如果需要确认关系，请给出清晰但不逼迫的选择。',
    '如果之后补充 MBTI、依恋、星座或长期契合度线索，报告会更容易定位触发点；但当前信息已经可以先做阶段判断。'
  ];

  return {
    provider: 'local',
    confidence: signals,
    stage,
    summary: `基于当前资料，这段关系更接近「${stage}」。目前最关键的不是单句聊天的含义，而是双方在压力下是否还能保持回应、解释和修复。`,
    riskSignals: risk,
    nextActions: suggestions,
    paidUpsell: '只知道一部分信息也可以开始分析。后续如果补充聊天记录、星座、依恋类型、MBTI 或合盘资料，建议会更贴近你们的真实互动。'
  };
}

function buildPrompt(payload, signals) {
  const english = String(payload.locale || '').toLowerCase().startsWith('en');
  const systemPrompt = [
    '# 1. Role Definition (核心人设定义)',
    '你是一位收费级别较高的亲密关系分析师与沟通策略顾问。你熟悉依恋理论、关系阶段判断、冲突修复、边界感、沟通节奏和长期契合度分析。',
    '你的风格清醒、具体、有同理心。你可以指出风险和盲点，但不能羞辱用户、攻击对方人格、制造焦虑或使用“骂醒”式表达。',
    '你的目标是帮助用户理解当前关系阶段、识别可验证的行为信号，并给出低压力、可执行、尊重双方边界的下一步建议。',
    '',
    '# 2. 核心诊断引擎：关系信号交叉判断框架',
    '在分析时，你需要基于以下维度进行交叉判定，但输出时请使用普通用户能理解的自然语言：',
    '## [支柱 1] 可得性悖论 (Availability Paradox)',
    '* 判定逻辑：如果用户长期秒回、随时待命、无底线妥协，需要提醒用户恢复自己的节奏和边界。',
    '## [支柱 2] 投资与情绪账本 (AII Investment Model)',
    '* 判定逻辑：观察双方投入是否均衡，包括回复长度、主动次数、解释意愿和线下推进。',
    '## [支柱 3] 稳定性与压力信号',
    '* 判定逻辑：对方冷淡、忽近忽远或提及其他异性时，优先判断其是否在表达不确定、边界、压力或回避，而不是直接归因为恶意。',
    '## [支柱 4] 谨慎表达与关系压力',
    '* 判定逻辑：关系升级节点，对方说“顺其自然”、“怕受伤害”、“我很慢热”时，可能是在表达谨慎或压力。建议用户减少逼问，给出安全且明确的互动空间。',
    '## [支柱 5] 行为动机与需求分析',
    '* 判定逻辑：分析对方行为背后的需求与获益。比如只在深夜倾诉，可能更偏向情绪支持需求，不一定等于稳定关系意愿。',
    '## [支柱 6] 自我价值与双向选择',
    '* 判定逻辑：提醒用户不要过度证明自己，也要观察对方是否有稳定、尊重、负责和愿意沟通的品质。',
    '## [支柱 7] 降低频率与空间修复',
    '* 判定逻辑：当关系进入持续敷衍、反感或分手状态，不建议继续高频找话题。应建议降低频率、停止追问，让双方有空间恢复判断。',
    '## [支柱 8] 自然沟通与表达节奏',
    '* 判定逻辑：沟通建议应自然、简短、可直接发送，不使用操控式话术，不故意制造情绪过山车。',
    '## [支柱 9] 线上亲密与现实行动',
    '* 判定逻辑：如果双方只在线上热络但迟迟不见面，需要提醒用户把判断落到现实互动和持续行动上。',
    '## [支柱 10] 诚实表达与降低内耗',
    '* 判定逻辑：过度试探会增加误会。当用户极度内耗时，建议使用诚实、简短、不压迫的表达来确认关系事实。',
    '## [支柱 11] 逻辑谬误防御 (Logical Fallacies Defense)',
    '* 判定逻辑：识别争吵中是否存在曲解、偷换概念、回避责任或情绪施压。建议用户先澄清事实，再表达边界。',
    '## [支柱 12] 行为纪律与隐性高价值 (Behavioral Discipline)',
    '* 判定逻辑：情绪稳定性（纪律）远比硬价值更吸引人。任何急躁、患得患失或刻意炫富的行为，都是内心匮乏的表现。真正的高价值是“未被急于变现的松弛感”。',
    '## [支柱 13] 玄学侧写与深层人格融合法则 (Metaphysics & Profiling)',
    '* 当用户提供了星座、MBTI、依恋、合盘或其他测试线索时：可以把它们作为辅助假设，但不能把它们当作绝对结论。',
    '* 当用户未提供这些数据时：直接基于聊天记录和关系事实分析即可；可以温和提示“补充线索会让建议更具体”，但不要暗示不补充就无法分析。',
    '',
    '# 3. 输出风格要求（Anti-Jargon Output Protocol）',
    '输出内容时，避免专业黑话和英文缩写。不要使用刺激性或羞辱性词汇。',
    '你必须把判断翻译成通俗、温和、具体的大白话；可以清醒指出风险，但语气要建设性。',
    '',
    '# 4. Output Requirements (强制输出 JSON 格式)',
    '你必须，且只能输出一段严格合法的 JSON 数据，不要带 Markdown 语法标记。结构如下：',
    '{',
    '  "Interest_Score": 0, // (整数 0-10) 基于客观行为，评估对方目前对用户的真实好感度/慢热指数/兴趣度。',
    '  "Power_Dynamic": "", // (字符串) 温和判断当前互动是否均衡：谁更主动、谁更回避、双方是否都有投入。',
    '  "Subtext_Translation": "", // 结合当前资料，用清醒但不羞辱的语气解释近期聊天背后的可能含义，以及用户可以调整的互动方式。如果未提供依恋/玄学数据，可以温和说明补充线索会让建议更具体。',
    '  "Strategic_Direction": "", // (字符串) 给出下一阶段的宏观战术指导。',
    '  "Underlying_Logic": "", // (字符串) 用大白话解释为什么要采取上述战术，如果不这么做，会丧失什么主动权。',
    '  "Reference_Examples": [ // (数组) 提供 2-3 句自然、简短、不压迫的参考话术。',
    '    "",',
    '    ""',
    '  ],',
    '  "System_Warning": "以上话术仅供参考。请结合你们平时的说话习惯进行口语化改写；如果对方出现新的回应，可以带着新信息重新分析。"',
    '}'
  ].join('\n');

  return [
    english
      ? 'IMPORTANT OUTPUT LANGUAGE: Write every user-facing JSON string value in natural, polished English. Do not output Chinese prose. Keep the JSON property names exactly as specified.'
      : '重要：所有面向用户的 JSON 字符串值必须使用自然、清晰的中文。',
    systemPrompt,
    '',
    '【以下是用户提供的真实输入数据】：',
    `资料完整度：${signals.level} ${signals.score}/100`,
    `用户选择阶段：${normalizeStage(payload.relationshipStage)}`,
    `用户诉求：${clampText(payload.userNeed, 1200) || '未填写'}`,
    `双方背景：${clampText(payload.knownFacts, 2000) || '未填写'}`,
    `用户侧画像/性别：${clampText(payload.userProfile, 1200) || '未填写'}`,
    `对方画像/性别：${clampText(payload.partnerProfile, 1200) || '未填写'}`,
    `近期冲突：${clampText(payload.recentConflict, 1200) || '未填写'}`,
    `MBTI 人格数据：${clampText(payload.mbti, 500) || '未填写'}`,
    `依恋类型数据：${clampText(payload.attachment, 500) || '未填写'}`,
    `合盘/星座星盘数据：${clampText(payload.synastry, 800) || '未填写'}`,
    `塔罗牌线索：${clampText(payload.tarot, 500) || '未填写'}`,
    `近期交锋实录（中括号【】内为非文字动作）：\n${clampText(payload.chatText)}`
  ].join('\n');
}

function parseJsonText(text) {
  const raw = String(text || '').trim();
  const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(jsonText);
}

function normalizeAIResult(provider, parsed, signals) {
  return {
    provider,
    confidence: signals,
    
    // Original layout values for backward compatibility
    stage: parsed.Power_Dynamic || parsed.stage || '不确定',
    summary: parsed.Subtext_Translation || parsed.summary || '',
    riskSignals: Array.isArray(parsed.riskSignals) ? parsed.riskSignals : [parsed.Strategic_Direction || ''],
    nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : (Array.isArray(parsed.Reference_Examples) ? parsed.Reference_Examples : []),
    recommendedTests: Array.isArray(parsed.recommendedTests) ? parsed.recommendedTests : [],
    paidUpsell: parsed.System_Warning || parsed.paidUpsell || '',

    // Premium high-end fields mapped directly
    Interest_Score: parsed.Interest_Score !== undefined ? parsed.Interest_Score : null,
    Power_Dynamic: parsed.Power_Dynamic || null,
    Subtext_Translation: parsed.Subtext_Translation || null,
    Strategic_Direction: parsed.Strategic_Direction || null,
    Underlying_Logic: parsed.Underlying_Logic || null,
    Reference_Examples: Array.isArray(parsed.Reference_Examples) ? parsed.Reference_Examples : null,
    System_Warning: parsed.System_Warning || null
  };
}

async function callGemini(payload, signals) {
  if (!process.env.GEMINI_API_KEY) return null;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(payload, signals) }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
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
    : '';
  if (!text) throw new Error('Gemini response was empty');

  return normalizeAIResult('gemini', parseJsonText(text), signals);
}

async function callOpenAI(payload, signals) {
  if (!process.env.OPENAI_API_KEY) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: String(payload.locale || '').toLowerCase().startsWith('en')
            ? 'Return valid JSON only, with all user-facing string values in natural English. Do not use Markdown.'
            : '你只输出合法 JSON，不要输出 Markdown。'
        },
        {
          role: 'user',
          content: buildPrompt(payload, signals)
        }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error && data.error.message ? data.error.message : 'OpenAI request failed');
  }

  const text = data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';
  if (!text) throw new Error('OpenAI response was empty');

  return normalizeAIResult('openai', parseJsonText(text), signals);
}

router.post('/analyze', async (req, res) => {
  const orderId = clampText(req.body && req.body.orderId, 120);
  const english = String(req.body && req.body.locale || '').toLowerCase().startsWith('en');
  if (REQUIRE_PAYMENT && !orderUnlocksRelationshipAI(orderId)) {
    return res.status(402).json({
      error: 'RELATIONSHIP_AI_PAYMENT_REQUIRED',
      message: english
        ? 'Please unlock AI Relationship Analysis before generating the full report.'
        : '请先完成 AI 情感阶段分析解锁，再生成完整报告。'
    });
  }

  const payload = {
    locale: english ? 'en' : 'zh-CN',
    chatText: clampText(req.body && req.body.chatText),
    knownFacts: clampText(req.body && req.body.knownFacts, 3000),
    userProfile: clampText(req.body && req.body.userProfile, 1600),
    partnerProfile: clampText(req.body && req.body.partnerProfile, 1600),
    recentConflict: clampText(req.body && req.body.recentConflict, 1600),
    userNeed: clampText(req.body && req.body.userNeed, 1200),
    relationshipStage: normalizeStage(req.body && req.body.relationshipStage),
    mbti: clampText(req.body && req.body.mbti, 800),
    attachment: clampText(req.body && req.body.attachment, 800),
    synastry: clampText(req.body && req.body.synastry, 1200),
    tarot: clampText(req.body && req.body.tarot, 800)
  };

  if (!payload.chatText && !payload.knownFacts) {
    return res.status(400).json({ error: 'chatText or knownFacts is required' });
  }

  const signals = buildSignals(payload);
  let result;
  try {
    result = await callGemini(payload, signals);
    if (!result) result = await callOpenAI(payload, signals);
  } catch (error) {
    console.error('Relationship AI failed:', error.message);
    void notifyOperations('relationship_ai_provider_failed', {
      orderId,
      locale: payload.locale,
      message: error.message
    });
  }
  if (!result) result = makeLocalAnalysis(payload);

  if (orderId) {
    db.prepare(`
      INSERT OR REPLACE INTO results (order_id, test_type, result_data)
      VALUES (?, ?, ?)
    `).run(orderId, 'relationship-ai', JSON.stringify({
      provider: result.provider,
      confidence: result.confidence,
      stage: result.stage,
      result
    }));
  }

  res.json({ result });
});

router.get('/admin/config', requireAdmin, (req, res) => {
  res.json({
    config: {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      geminiModel: GEMINI_MODEL,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      openaiModel: OPENAI_MODEL,
      model: process.env.GEMINI_API_KEY ? GEMINI_MODEL : OPENAI_MODEL,
      paymentRequired: REQUIRE_PAYMENT
    }
  });
});

module.exports = router;
