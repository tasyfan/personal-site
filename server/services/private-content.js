const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CONTENT_FILES = {
  mbti: ['mbti.js', 'MBTI_DATA'],
  attachment: ['attachment.js', 'ATTACHMENT_DATA'],
  tarot: ['tarot.js', 'TAROT_DATA'],
  astrology: ['astrology.js', 'ASTROLOGY_DATA'],
  bazi: ['bazi.js', 'BAZI_DATA'],
  'human-design': ['hd.js', 'HD_DATA'],
  synastry: ['synastry.js', 'SYNASTRY_DATA'],
  aura: ['aura.js', 'AURA_DATA'],
  shadow: ['shadow.js', 'SHADOW_DATA'],
  color: ['color.js', 'COLOR_DATA'],
  enneagram: ['enneagram.js', 'ENNEAGRAM_DATA'],
  jung8: ['jung8.js', 'JUNG8_DATA'],
  darktriad: ['darktriad.js', 'DARKTRIAD_DATA'],
  saboteurs: ['saboteurs.js', 'SABOTEURS_DATA'],
  defense: ['defense.js', 'DEFENSE_DATA']
};

const contentDir = process.env.PRIVATE_CONTENT_DIR || path.resolve(__dirname, '../../content');
const cache = new Map();

function loadContent(testType) {
  if (cache.has(testType)) return cache.get(testType);
  const entry = CONTENT_FILES[testType];
  if (!entry) return null;

  const [fileName, globalName] = entry;
  const filePath = path.join(contentDir, fileName);
  const source = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: filePath, timeout: 1000 });
  const data = sandbox.window[globalName] || null;
  cache.set(testType, data);
  return data;
}

const ENGLISH_REPORT_LENSES = {
  mbti: {
    title: 'Personality pattern',
    strength: 'how you gather energy, make judgments, and turn decisions into action',
    tension: 'the gap between the style that feels natural to you and what a situation asks you to practice',
    relationship: 'whether other people experience your clarity as reassuring, distant, intense, or flexible',
    practice: 'choose one interaction this week where you deliberately use the opposite of your default preference'
  },
  attachment: {
    title: 'Attachment pattern',
    strength: 'how you seek closeness, reassurance, autonomy, and emotional safety',
    tension: 'the moment when a reasonable need turns into pursuit, withdrawal, testing, or silence',
    relationship: 'the cycle created between your protective response and the other person’s response',
    practice: 'name one need directly before using a familiar protective strategy'
  },
  tarot: {
    title: 'Tarot reflection',
    strength: 'the sequence linking what shaped the situation, what is active now, and what choice is opening next',
    tension: 'the difference between using the cards to organize a decision and asking them to remove uncertainty',
    relationship: 'how the symbols may reflect expectations, fears, or unfinished conversations around the question',
    practice: 'turn the strongest card message into one reversible action you can take within seven days'
  },
  astrology: {
    title: 'Natal chart pattern',
    strength: 'the relationship between outward identity, emotional needs, instinctive responses, and social direction',
    tension: 'the parts of the chart that want different things at the same time',
    relationship: 'how your need for recognition, safety, communication, and freedom may be read by others',
    practice: 'observe one recurring situation through both your public response and your private emotional response'
  },
  bazi: {
    title: 'BaZi pattern',
    strength: 'your preferred rhythm for using effort, support, structure, and adaptability',
    tension: 'the point where persistence becomes over-control or flexibility becomes drift',
    relationship: 'how your timing and responsibility style affect cooperation and expectations',
    practice: 'separate one current decision into what should be advanced now and what should be allowed to mature'
  },
  'human-design': {
    title: 'Human Design pattern',
    strength: 'the conditions in which your decisions and energy tend to feel more sustainable',
    tension: 'the pressure to act from urgency, comparison, or another person’s pace',
    relationship: 'how your decision rhythm may differ from people who expect immediate certainty',
    practice: 'test your stated strategy and authority on one low-risk decision, then record the bodily result'
  },
  synastry: {
    title: 'Compatibility pattern',
    strength: 'where two people create ease, stimulation, stability, or useful contrast',
    tension: 'the difference between strong attraction and low-friction cooperation',
    relationship: 'the repeated loop formed when each person protects a different need',
    practice: 'replace one assumption about the other person with a direct, specific question'
  },
  aura: {
    title: 'Current-state pattern',
    strength: 'the emotional tone and level of openness you may be showing right now',
    tension: 'the difference between your outward presentation and what actually needs recovery or expression',
    relationship: 'how people may respond to the energy you are currently signaling',
    practice: 'protect one block of time for the kind of recovery your result points toward'
  },
  shadow: {
    title: 'Shadow pattern',
    strength: 'the protective intelligence behind a response you may usually judge or hide',
    tension: 'the moment when protection becomes automatic and starts narrowing your options',
    relationship: 'how an unspoken fear may appear as control, distance, pleasing, criticism, or self-erasure',
    practice: 'notice the trigger one step earlier and name the fear without acting on it immediately'
  },
  color: {
    title: 'Color-selection pattern',
    strength: 'the needs you are moving toward and the feelings you may be placing at a distance',
    tension: 'the difference between a temporary emotional climate and a fixed statement about personality',
    relationship: 'how current stress or hope may be shaping what feels attractive, safe, or irritating',
    practice: 'repeat the selection after a meaningful change in mood and compare what moved'
  },
  enneagram: {
    title: 'Motivation pattern',
    strength: 'the core concern that organizes attention, effort, and self-protection',
    tension: 'the point where a useful strength becomes compulsive because it is defending identity',
    relationship: 'what you may ask others to confirm without saying it directly',
    practice: 'do one small action that is valuable even if it does not reinforce your usual self-image'
  },
  jung8: {
    title: 'Cognitive-function pattern',
    strength: 'the mental tools you trust first when noticing information and making decisions',
    tension: 'the imbalance created when a preferred function is overused and a weaker one is ignored',
    relationship: 'why another person’s way of reasoning may feel slow, vague, rigid, or overly personal to you',
    practice: 'use one lower-ranked function deliberately in a low-stakes task'
  },
  darktriad: {
    title: 'Interpersonal strategy pattern',
    strength: 'the ways confidence, skepticism, influence, and emotional distance can protect your position',
    tension: 'the point where self-protection begins to reduce trust or mutuality',
    relationship: 'how control, image management, or detachment may affect psychological safety',
    practice: 'choose one situation where transparent intent is more useful than strategic ambiguity'
  },
  saboteurs: {
    title: 'Inner-saboteur pattern',
    strength: 'the original protective purpose behind an inner voice that now creates friction',
    tension: 'the difference between useful caution and a rule that blocks action before evidence appears',
    relationship: 'how the inner voice may influence conflict, reassurance, boundaries, or follow-through',
    practice: 'write the saboteur’s prediction, then test it with the smallest safe counterexample'
  },
  defense: {
    title: 'Defense-style pattern',
    strength: 'the method your mind uses to preserve safety, dignity, or continuity under pressure',
    tension: 'the point where an automatic defense hides information you need in order to respond well',
    relationship: 'how others may misread protection as indifference, hostility, denial, or over-explanation',
    practice: 'pause long enough to identify the feeling underneath the defense before choosing a response'
  }
};

function compactEnglishSignal(value, fallback) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 420) : fallback;
}

function buildEnglishBaseReport(testType, { resultSummary, userInputs, context }) {
  const lens = ENGLISH_REPORT_LENSES[testType] || ENGLISH_REPORT_LENSES.mbti;
  const result = compactEnglishSignal(resultSummary, 'The available result points to a recognizable but still incomplete pattern.');
  const inputSignal = compactEnglishSignal(
    JSON.stringify(userInputs || {}).replace(/[{}[\]"]/g, ' '),
    'Only limited background information was provided.'
  );
  const contextSignal = compactEnglishSignal(
    JSON.stringify(context || {}).replace(/[{}[\]"]/g, ' '),
    'There is not enough context to treat any single interpretation as definitive.'
  );

  return [
    `## ${lens.title}: what stands out`,
    `Your current result is: ${result} This is best used as a working description, not a permanent label. The most useful lens is ${lens.strength}. Notice which parts feel immediately familiar, which parts fit only under stress, and which parts do not match your lived experience. A strong report should help you observe choices more clearly; it should not pressure you to accept every sentence as truth.`,
    '',
    '## The useful side of this pattern',
    `This pattern can be an advantage when it gives you a repeatable way to notice information, protect what matters, and move through uncertainty. Your available input includes: ${inputSignal} Read that evidence alongside the result instead of treating the category alone as proof. The practical question is not “Is this type good or bad?” It is “When does this response help me act with more clarity, and when does it reduce my options?”`,
    '',
    '## Where friction can appear',
    `The central tension is ${lens.tension}. Under pressure, people often exaggerate the strategy that normally works for them. That can create short-term relief while making the next conversation or decision harder. Use the result to identify the earliest observable sign: a change in tone, urgency, avoidance, perfectionism, over-explaining, or a sudden need to control the outcome. Catching the pattern earlier creates room for choice.`,
    '',
    '## Relationships and communication',
    `In relationships, pay attention to ${lens.relationship}. The relevant context currently available is: ${contextSignal} This does not establish another person’s intention. It shows where expectations may be colliding. Before drawing a conclusion, separate facts, interpretations, feelings, and requests. That simple separation usually produces a more accurate and more humane reading of what is happening.`,
    '',
    '## A grounded experiment',
    `For the next seven days, ${lens.practice}. Keep the experiment small enough that you can reverse it. Record what you expected, what you did, what happened, and what you learned. If the result is useful, it should improve your ability to predict your own reactions and communicate your needs—not make you feel trapped by a category.`,
    '',
    '## Keep the conclusion proportionate',
    'This report is for reflection and entertainment. It is not a psychological diagnosis, medical advice, legal advice, financial advice, or a prediction that removes your agency. Current mood, incomplete information, cultural context, and the wording of a test can all affect the result. Keep what helps you notice a real pattern, question what does not fit, and use important decisions to gather better evidence rather than relying on a single reading.'
  ].join('\n');
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '');
}

function collectDeepEntries(value, pathParts = [], entries = []) {
  if (!value || typeof value !== 'object') return entries;

  if (typeof value.deep === 'string' && value.deep.trim()) {
    entries.push({
      text: value.deep.trim(),
      identities: [
        ...pathParts,
        value.id,
        value.type,
        value.name,
        value.title,
        value.en
      ].filter((item) => item !== undefined && item !== null && String(item).trim())
    });
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === 'deep') continue;
    if (child && typeof child === 'object') {
      collectDeepEntries(child, [...pathParts, key], entries);
    }
  }
  return entries;
}

function scoreIdentity(identity, signals) {
  const token = normalize(identity);
  if (!token || token.length < 2) return 0;
  if (signals.includes(token)) return 100 + token.length;

  let score = 0;
  for (let index = 0; index < token.length - 1; index += 1) {
    if (signals.includes(token.slice(index, index + 2))) score += 2;
  }
  return score;
}

function buildTarotReport(data, context) {
  const cards = Array.isArray(context && context.cards) ? context.cards : [];
  if (!data || !data.cards || !cards.length) return '';

  const sourceCards = Object.values(data.cards);
  return cards.map((card) => {
    const source = sourceCards.find((item) => item.name === card.card);
    if (!source) return '';
    const orientation = card.orientation === '逆位' ? 'reversed' : 'upright';
    const text = source[orientation];
    return text
      ? `【${card.position || '牌位'} · ${card.card}${card.orientation || ''}】\n${text}`
      : '';
  }).filter(Boolean).join('\n\n');
}

function buildColorReport(data, userInputs) {
  const selections = Array.isArray(userInputs && userInputs.selections)
    ? userInputs.selections
    : [];
  if (!data || !data.interpretations || !selections.length) return '';

  return selections.slice(0, 8).map((id, index) => {
    const item = data.interpretations[id];
    if (!item) return '';
    const color = Array.isArray(data.colors)
      ? data.colors.find((candidate) => candidate.id === id)
      : null;
    const position = data.positions && data.positions[index + 1];
    return [
      `【第 ${index + 1} 顺位${color ? ` · ${color.name}` : ''}】${position ? `\n${position}` : ''}`,
      item.meaning ? `基本释义：${item.meaning}` : '',
      item.deep || ''
    ].filter(Boolean).join('\n');
  }).filter(Boolean).join('\n\n');
}

function buildPremiumBaseReport(testType, { resultSummary, userInputs, context, locale = 'zh-CN' }) {
  if (String(locale).toLowerCase().startsWith('en')) {
    return buildEnglishBaseReport(testType, { resultSummary, userInputs, context });
  }
  const data = loadContent(testType);
  if (!data) return '';
  if (testType === 'tarot') return buildTarotReport(data, context);
  if (testType === 'color') return buildColorReport(data, userInputs);

  const signals = normalize(JSON.stringify({ resultSummary, userInputs, context }));
  const ranked = collectDeepEntries(data)
    .map((entry) => ({
      ...entry,
      score: entry.identities.reduce(
        (total, identity) => total + scoreIdentity(identity, signals),
        0
      )
    }))
    .sort((a, b) => b.score - a.score);

  const selected = ranked.find((entry) => entry.score > 0) || ranked[0];
  return selected ? selected.text : '';
}

module.exports = {
  buildPremiumBaseReport,
  loadContent
};
