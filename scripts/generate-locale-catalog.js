const fs = require('fs');
const path = require('path');
const vm = require('vm');
const babelParser = require('@babel/parser');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'dist', 'public');
const outputPath = path.join(root, 'locales', 'en.js');
const delimiter = '\n|||NORTHSTAR_SPLIT|||\n';

const manualTranslations = {
  // Bazi terms corrections
  "八字排盘失败，请检查出生信息后重试。": "BaZi chart generation failed, please check your birth details and try again.",
  "正在排布四柱八字...": "Calculating Four Pillars and BaZi chart...",
  "八字排盘服务未返回结果": "BaZi chart service returned no results",
  "的八字日主：": "'s BaZi Day Master:",
  "的八字报告": "'s BaZi Report",

  // Synastry terms corrections
  "双人合盘": "Synastry",
  "合盘报告": "Synastry Report",
  "双人合盘结果：": "Synastry Chart Results:",
  "查看合盘解锁方案": "View Synastry Unlocking Options",
  "完成合盘后，可以继续补充聊天记录、相处背景或其他测试结果，让 AI 帮你看当前关系阶段和下一步沟通方式。只知道一部分也可以开始，补充项不是必填。": "After generating the synastry chart, you can continue to add chat records, relationship background, or other test results, and let AI help you see the current relationship stage and the next step of communication. You can start with partial information; supplementary fields are optional.",
  "✧ 生成双人合盘海报": "✧ Generate Compatibility Poster",

  // Astrology terms corrections
  "空灵疗愈的颂钵或手碟": "Singing bowl or handpan for ethereal healing",
  "计算上升点与整宫制宫位...": "Calculating Ascendant and Whole Sign houses...",
  "识别主要相位并生成星盘...": "Identifying major aspects and generating natal chart...",
  "本次未识别到容许度内的主要相位。": "No major aspects within tolerance were found.",
  "读取太阳、月亮与行星星历...": "Reading Sun, Moon, and planetary ephemeris...",
  "MBTI,依恋类型,AI情感分析,聊天记录分析,星盘,八字,人类图,塔罗牌,人格测试,关系分析,双人合盘,北极星": "MBTI, attachment style, AI emotional analysis, chat history analysis, natal chart, BaZi, Human Design, tarot cards, personality test, relationship analysis, compatibility reading, Northstar",

  // Privacy.html polished translations
  "北极星仅在提供测试、生成报告、处理订单和客服请求所必需的范围内处理信息。下面说明我们会用到哪些信息、怎么使用、以及你可以如何管理。": "Northstar processes information only as needed to provide tests, generate reports, fulfill orders, and respond to support requests. This policy explains what information we collect, how we use it, and how you can manage it.",
  "为了保障安全而记录的基础访问日志，例如访问时间、IP 地址和错误信息。": "Basic security logs, such as access time, IP address, and error information.",
  "用于计算免费结果、在付款后生成完整报告、完成订单核验、处理退款与售后、保障系统安全和排查故障。我们不会出售你的个人信息，也不会将聊天文本用于公开展示。": "We use this information to calculate free results, generate paid reports, verify orders, process refunds and support requests, secure our system, and troubleshoot errors. We do not sell personal information or publish chat text.",
  "支付环节可能由 Stripe 处理；部分个性化报告可能调用受控的 AI 服务。我们仅传输完成当前操作必需的内容，付费内容在验证订单后解锁查看。": "Payments may be processed by Stripe, and some personalized reports may use controlled AI services. We transmit only the information needed to complete the current operation and verify the order to unlock paid content.",
  "订单和支付记录按履约、对账及法定义务所需期限保存。已解决或关闭的客服工单在最后更新 90 天后移除联系方式和问题正文；产品分析数据以及已解决的运营记录在 180 天后删除。我们采用权限控制、安全验证、流量防护和非公开存储等防护措施，但互联网服务不存在绝对安全。": "Order and payment records are retained as required for fulfillment, reconciliation, and legal obligations. Contact details and issue text are removed from resolved or closed support tickets 90 days after the last update. Product analytics and resolved operational records are deleted after 180 days. We use access controls, security verification, traffic protection, and private storage, but no internet service can guarantee absolute security.",
  "你可以通过<a href=\"./support.html\">客服工单</a>申请查询、更正、删除相关信息，或要求我们停止某些非必需的信息处理。为防止冒用，我们可能要求核对订单号或其他必要信息。": "You can use a <a href=\"./support.html\">support ticket</a> to request access, correction, or deletion of relevant information, or to ask us to stop certain non-essential information processing. To prevent impersonation, we may ask you to verify an order ID or other necessary information.",
  "运营者：Northstar 独立开发者团队。联系渠道：<a href=\"mailto:tasyfan264@gmail.com\">tasyfan264@gmail.com</a> 或 <a href=\"./support.html\">在线客服工单</a>。涉及隐私删除请求时，请在工单类别中选择“隐私与数据”。": "Operator: Northstar independent developer team. Contact: <a href=\"mailto:tasyfan264@gmail.com\">tasyfan264@gmail.com</a> or <a href=\"./support.html\">online support ticket</a>. For privacy deletion requests, choose “Privacy & Data” as the support category.",

  // Refund.html polished translations
  "数字报告在支付确认后会立即生成或解锁。付款前请核对项目、价格和解锁范围。": "Digital reports are generated or unlocked immediately after payment is confirmed. Review the item, price, and included content before purchasing.",
  "付款成功后，经多次尝试仍无法生成或交付报告。": "After successful payment, the report could not be generated or delivered despite multiple attempts.",
  "如果报告已成功交付，仅因为个人感受与期待不符，或未仔细阅读服务说明，通常不支持退款；法律另有强制规定的除外。": "If the report has been successfully delivered, refunds are generally not supported solely due to personal feelings, mismatch with expectations, or failure to carefully read the service description; unless otherwise mandatory by law.",
  "遇到临时的网络故障或报告生成故障，我们可能先提供重新生成、恢复访问或补发报告；若仍无法交付，再执行退款。": "In the event of a temporary network failure or report generation failure, we may first provide regeneration, restored access, or a replacement report; if delivery is still not possible, a refund will be processed.",

  // Terms.html polished translations
  "北极星提供人格、自我探索、关系整理及娱乐性命理内容。测试结果和 AI 生成内容是参考材料，不是心理诊断、医疗建议、法律意见、投资建议、婚姻决策或对未来的保证。": "Northstar provides personality, self-exploration, relationship, and entertainment-based metaphysical content. Test results and AI-generated content are for reference only. They are not psychological diagnoses, medical or legal advice, investment advice, marriage counseling, or guarantees about the future.",
  "“本命星盘解析”使用天文算法计算行星黄经、上升点和整宫制宫位；结果准确性依赖用户填写的出生日期、精确的出生时间、地点坐标。星盘解读、八字、塔罗和人类图等内容属于文化与娱乐体验，请勿据此作出重大决定。": "The Natal Chart uses astronomical calculations for planetary longitude, the Ascendant, and Whole Sign Houses. Accuracy depends on the birth date, exact birth time, and birth location coordinates. Astrology, BaZi, tarot, and Human Design readings are cultural and entertainment experiences and should not be used as the sole basis for major decisions.",
  "你应保证提交信息合法且有权提供。不得上传他人的账号密码、身份证件、完整支付信息或未经授权的私密聊天内容。报告仅供购买者个人阅读，未经许可不得批量复制、转售、使用爬虫抓取数据，或通过技术手段绕过付费限制。": "You must have the legal right to provide any information you submit. Do not upload another person’s passwords, identity documents, complete payment information, or private conversations without authorization. Reports are for the purchaser’s personal use and may not be copied in bulk, resold, scraped using crawlers, or accessed by bypassing payment restrictions.",
  "具体价格、解锁范围和支付方式以付款页面为准。付款成功以支付平台确认及服务器订单记录为准。由于网络传输延迟，浏览器跳转或截图不一定能反映实际支付状态。": "Prices, included content, and payment methods are shown at checkout. A payment is considered successful only after payment platform confirmation and our server order record. Due to network latency, a browser redirect or screenshot alone may not reflect the actual payment status.",
  "运营者：Northstar 独立开发者团队。售后、投诉和数据请求均可通过 <a href=\"mailto:tasyfan264@gmail.com\">tasyfan264@gmail.com</a> 或 <a href=\"./support.html\">在线客服工单</a> 提交。": "Operator: Northstar independent developer team. Support, complaints, and data requests can be submitted through <a href=\"mailto:tasyfan264@gmail.com\">tasyfan264@gmail.com</a> or an <a href=\"./support.html\">online support ticket</a>.",

  // Support.html polished translations
  "客服渠道：": "Support Channels:",
  "联系邮箱：": "Contact Email:",
  "也可以通过下面的表单提交工单，我们通常 24 小时内回复。": "You can also submit a ticket using the form below. We typically respond within 24 hours.",

  "✦ 纯享图腾": "✦ Immersive View",
  "✦ 返回报告": "✦ Back to Report",

  '北极星': 'Northstar',
  '命运观测站': 'Self & Relationship Observatory',
  '首页': 'Home',
  '测试大厅': 'Explore',
  '主导航': 'Main navigation',
  '语言': 'Language',
  '用户协议与免责声明': 'Terms & Disclaimer',
  '隐私政策': 'Privacy Policy',
  '退款规则': 'Refund Policy',
  '客服与售后': 'Support',
  '保留所有权利': 'All rights reserved',
  '看见真实的自己': 'See Your Authentic Self',
  '看见关系里的答案': 'Find Clarity in Your Relationships',
  '先看看有哪些内容': 'Explore Readings',
  '✦ 先看看有哪些内容': '✦ Explore Readings',
  '✦ NORTHSTAR · 给犹豫的人一点参照 ✦': '✦ NORTHSTAR · A CLEARER VIEW OF SELF AND RELATIONSHIPS ✦',
  '浏览全部分析': 'Explore All Assessments',
  '恢复已购报告': 'Restore Purchased Reports',
  '分析主题': 'Assessment Topics',
  '专业报告': 'Professional Report',
  '预计阅读': 'Reading Time',
  '10–12 章': '10–12 Chapters',
  '15–20 分钟': '15–20 Minutes',
  '完成付款后，访问权由服务器记录；再次进入或更换设备时可通过订单号恢复。': 'After payment, your access is stored securely on the server. Use your order ID to restore reports when you return or switch devices.',
  '选择一个想先看清的问题': 'Choose What You Want to Understand First',
  '每个模块都可以先完成基础测试；付款后获得结构化专业长报告，并可长期恢复访问。': 'Complete any assessment first, then unlock a structured professional report with long-term purchase restoration.',
  '测试结果': 'Your Result',
  '人格测评': 'Personality Assessment',
  '真实星历计算': 'Astronomical Chart Calculation',
  '今日提示': 'Daily Guidance',
  '今天的小提示': 'A Small Note for Today',
  '直觉': 'Intuition',
  '灵感': 'Creativity',
  '清醒度': 'Clarity',
  '今日小物': 'Today’s Crystal',
  '✧ 今日一句': '✧ Today’s Reflection',
  '✦ 北极星 · 自我与关系分析平台': '✦ Northstar · Self & Relationship Readings',
  'MBTI 性格测试': 'MBTI Personality',
  '恋爱依恋测试': 'Attachment Style',
  'AI 情感阶段分析': 'AI Relationship Stage Analysis',
  '塔罗牌占卜': 'Tarot Reading',
  '本命星盘解析': 'Natal Chart',
  '你的本命星盘': 'Your Natal Chart',
  '核心四轴': 'Core Angles',
  '太阳 月亮 上升 天顶': 'Sun · Moon · Ascendant · Midheaven',
  '天顶 MC': 'Midheaven (MC)',
  '感受力': 'Sensitivity',
  '行星落点': 'Planetary Placements',
  '真黄道坐标 · 整宫制': 'True Ecliptic Coordinates · Whole Sign Houses',
  '主要相位': 'Major Aspects',
  '按容许度排序': 'Sorted by Orb',
  '✨ 完整内容已打开': '✨ Full Report',
  '返回探索大厅': 'Back to Explore',
  '八字命理排盘': 'BaZi Reading',
  '人类图解析': 'Human Design',
  '双人契合度合盘': 'Relationship Compatibility',
  '灵魂光环测试': 'Aura Reading',
  '暗影原型测试': 'Shadow Archetype',
  '色彩心理测试': 'Color Psychology',
  '九型人格测试': 'Enneagram',
  '荣格八维测试': 'Jungian Cognitive Functions',
  '黑暗三角测试': 'Dark Triad',
  '内在破坏者测试': 'Inner Saboteurs',
  '心理防御机制测试': 'Psychological Defense Style',
  '八字命盘': 'BaZi',
  '你的八字命盘': 'Your BaZi Chart',
  '开始八字排盘': 'Generate BaZi Chart',
  '✦ 基础命元 (日主)': '✦ Core Day Master',
  '✦ 查看完整八字解读': '✦ View the Full BaZi Reading',
  '包含日主特点、阶段节奏、适合留意的选择方向，以及更完整的命盘说明。': 'Explore your Day Master, life rhythms, useful decision patterns, and the structure of your full BaZi chart.',
  '重新排盘': 'Create Another Chart',
  '北极星玄学档案库': 'Northstar Archive',
  '未知': 'Not calculated',
  '当前价格': 'Current price',
  '当前价格 USD $9.99': 'Current price USD $9.99',
  '正在解析内心密码...': 'Analyzing your personality patterns...',
  '✧ 生成我的性格报告': '✧ Generate My Personality Report',
  '正在生成依恋报告...': 'Generating your attachment report...',
  '✧ 查看我的依恋类型': '✧ View My Attachment Style',
  '正在推演色彩磁场...': 'Analyzing your color profile...',
  '✧ 生成我的色彩报告': '✧ Generate My Color Report',
  '正在生成九型人格报告...': 'Generating your Enneagram report...',
  '✧ 生成我的九型人格报告': '✧ Generate My Enneagram Report',
  '正在推演八维天线...': 'Analyzing your cognitive functions...',
  '✧ 生成我的荣格八维报告': '✧ Generate My Cognitive Functions Report',
  '正在生成分析结果...': 'Generating your analysis...',
  '✧ 生成我的黑暗三角报告': '✧ Generate My Dark Triad Report',
  '✧ 生成我的破坏者报告': '✧ Generate My Inner Saboteurs Report',
  '正在扫描自我防线...': 'Analyzing your defense patterns...',
  '✧ 生成我的防御机制报告': '✧ Generate My Defense Style Report',
  '外倾 (E)': 'Extraversion (E)',
  '内倾 (I)': 'Introversion (I)',
  '感觉 (S)': 'Sensing (S)',
  '直觉 (N)': 'Intuition (N)',
  '思考 (T)': 'Thinking (T)',
  '情感 (F)': 'Feeling (F)',
  '判断 (J)': 'Judging (J)',
  '感知 (P)': 'Perceiving (P)',
  '特质：': 'Key traits: ',
  '查看上线方案': 'View Options',
  '返回首页': 'Back to Home',
  '重新测试': 'Take Again',
  '保存海报': 'Save Poster',
  '跳过动画，直接显示全文': 'Skip animation and show full report',
  '正在整理内容...': 'Preparing your report...',
  '中国标准时间': 'China Standard Time',
  '日本标准时间': 'Japan Standard Time',
  '韩国标准时间': 'Korea Standard Time',
  '当地时间': 'Local Time',
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
  '逆行': 'Retrograde',
  '整宫制': 'Whole Sign Houses',
  '合相': 'Conjunction',
  '六合': 'Sextile',
  '刑相': 'Square',
  '拱相': 'Trine',
  '对冲': 'Opposition',
  '过去': 'Past',
  '现在': 'Present',
  '未来': 'Future',
  '完整内容': 'Full Report',
  '体验解读': 'Quick Insight',
  '适合社媒入口先试一下，只看快速提示，不含完整解读和本次结果补充。': 'A low-cost preview with a concise insight. The full report and personalized follow-up are not included.',
  '单项完整解读': 'Full Single Reading',
  '只看当前这一份，不用一次买太多。': 'Unlock the complete report for the reading you are viewing now.',
  '基础人格组合': 'Personality Essentials Bundle',
  '先看性格和依恋，适合整理“我是什么样的人，我在关系里会怎样”。': 'Combine personality and attachment style to understand who you are and how you relate to others.',
  '高阶性格探究': 'Advanced Personality Bundle',
  '适合想更细看动机、思考方式和反复卡住之处的人。': 'A deeper look at motivation, cognitive patterns, and recurring blocks.',
  '潜意识与防线': 'Shadow & Defense Bundle',
  '看看压力、防备和内在拉扯，不做吓人的判断。': 'Understand stress responses, defenses, and inner conflict without fear-based labels.',
  '命理人生图谱': 'Destiny Map Bundle',
  '从星盘、八字和人类图里，看人生节奏和选择偏好。': 'Combine astrology, BaZi, and Human Design to explore life rhythms and decision patterns.',
  '能量与运势疗愈': 'Energy & Intuition Bundle',
  '适合看最近状态：情绪、直觉、行动感和卡住的地方。': 'Explore your current emotional climate, intuition, momentum, and areas that feel stuck.',
  '双人合盘与 AI 建议': 'Compatibility + AI Guidance',
  '适合认真看一段关系：合盘、聊天线索、MBTI 和依恋一起参考。': 'A deeper relationship view combining compatibility, conversation context, MBTI, and attachment.',
  'AI 情感分析': 'AI Relationship Analysis',
  '把聊天和背景放进来，看看现在像处在哪个阶段。': 'Use conversation and relationship context to understand your current stage and next steps.',
  '全站早鸟解锁': 'All-Access Pass',
  '上线早鸟价，适合想慢慢把所有完整解读都看完的人。': 'Unlock every complete reading and return whenever you want.',
  'Stripe 官方支付': 'Secure Stripe Checkout',
  '微信支付': 'WeChat Pay',
  '支付宝': 'Alipay',
  '转账确认': 'Manual Transfer',
  '去 Stripe 安全付款': 'Continue to Secure Stripe Checkout',
  '选择你想看的内容': 'Choose Your Reading',
  '正在查看：': 'Selected: ',
  '会解锁：': 'Includes: ',
  '支付确认后就能看，之后也可以回来继续读': 'Your report unlocks after payment and remains available on this device.',
  '订单号：': 'Order ID: ',
  '订单生成中...': 'Creating order...',
  '恢复购买': 'Restore Purchase',
  '购买凭证': 'Purchase Receipt',
  '商品': 'Product',
  '金额': 'Amount',
  '付款时间': 'Paid At',
  '打印凭证': 'Print Receipt',
  '粘贴订单号': 'Paste your order ID',
  '请输入订单号。': 'Enter your order ID.',
  '正在查询购买记录...': 'Checking your purchase...',
  '购买权益已恢复到当前设备。': 'Purchase restored on this device.',
  '恢复购买失败。': 'Purchase restoration failed.',
  '付款仍在确认中，请稍后再试。': 'Payment is still being confirmed. Please try again shortly.',
  '未找到该订单对应的有效付费权益。': 'No active paid purchase was found for that order ID.',
  '该订单当前已不具备有效报告访问权。': 'This order no longer has active report access.',
  '该订单当前不具备有效报告访问权。': 'This order does not currently have active report access.',
  '支付已确认，报告方案已解锁，并已在当前设备恢复访问。': 'Payment confirmed. Your report access has been restored on this device.',
  '订单号已复制。请保存它，以便在其他设备恢复访问。': 'Order ID copied. Keep it to restore access on another device.',
  '正在确认订单...': 'Confirming your order...',
  '等待支付确认': 'Waiting for Payment Confirmation',
  '订单确认未完成': 'Payment Could Not Be Confirmed',
  '返回重试': 'Try Again',
  '支付返回': 'Payment Return',
  '订单状态确认': 'Confirm Order Status',
  '刷新状态': 'Refresh Status',
  '中国': 'China',
  '日本': 'Japan',
  '美国': 'United States',
  '法国': 'France',
  '德国': 'Germany',
  '英国': 'United Kingdom',
  '将进入 Stripe 官方中文付款页，页面会展示当前账户与设备可用的银行卡、Apple Pay、Link 等方式。支付完成后会自动返回并解锁。': 'You will continue to Stripe’s secure checkout in English. Available cards, Apple Pay, Link and other eligible methods will appear based on your device and region. After payment, you will return automatically and your purchase will unlock.',
  '北极星 Northstar 提供 MBTI、依恋类型、塔罗、星盘、八字、人类图与双人合盘等内容，陪你整理性格、关系和当下最在意的问题。': 'Northstar offers personality, relationship, tarot, astrology, BaZi, Human Design and compatibility readings to help you understand yourself and the questions that matter most right now.',
  '有些问题，不一定马上有答案。你可以从性格、依恋、塔罗、星盘、八字、人类图或双人合盘里，先找到一个能对照自己的角度。': 'Some questions do not have immediate answers. Start with personality, attachment, tarot, astrology, BaZi, Human Design or compatibility, and find a perspective that helps you see yourself more clearly.'
  ,
  '← 返回北极星': '← Back to Northstar',
  '联系客服': 'Contact Support',
  '申请售后': 'Request Support',
  '更新日期：2026年6月19日': 'Last updated: June 19, 2026',
  '使用北极星即表示你理解并同意以下规则。付费前请同时阅读': 'By using Northstar, you understand and agree to these terms. Before purchasing, please also read the ',
  '1. 服务性质': '1. Nature of the Service',
  '北极星提供人格、自我观察、关系整理及娱乐性命理内容。测试结果和 AI 生成内容是参考材料，不是心理诊断、医疗建议、法律意见、投资建议、婚姻决策或对未来的保证。': 'Northstar provides personality, self-reflection, relationship, and entertainment-based metaphysical content. Test results and AI-generated content are for reference only. They are not psychological diagnoses, medical or legal advice, investment advice, marriage counseling, or guarantees about the future.',
  '2. 星座与命理内容': '2. Astrology and Metaphysical Content',
  '“本命星盘解析”使用天文算法计算行星黄经、上升点和整宫制宫位；结果准确性依赖用户填写的出生日期、准确时间、地点坐标与历史时区。星盘解读、八字、塔罗和人类图等内容属于文化与娱乐体验，请勿据此作出重大决定。': 'The Natal Chart uses astronomical calculations for planetary longitude, the Ascendant, and Whole Sign Houses. Accuracy depends on the birth date, exact time, coordinates, and historical time zone supplied by the user. Astrology, BaZi, tarot, and Human Design readings are cultural and entertainment experiences and should not be used as the sole basis for major decisions.',
  '3. 账户与内容使用': '3. Acceptable Use',
  '你应保证提交信息合法且有权提供。不得上传他人的账号密码、身份证件、完整支付信息或未经授权的私密聊天内容。报告仅供购买者个人阅读，未经许可不得批量复制、转售、抓取或绕过付费校验。': 'You must have the legal right to provide any information you submit. Do not upload another person’s passwords, identity documents, complete payment information, or private conversations without authorization. Reports are for the purchaser’s personal use and may not be copied in bulk, resold, scraped, or accessed by bypassing payment verification.',
  '4. 付费与交付': '4. Payment and Delivery',
  '具体价格、解锁范围和支付方式以付款页面为准。付款成功以支付机构签名回调及服务器订单状态为准。浏览器跳转或截图不能单独证明付款成功。': 'Prices, included content, and payment methods are shown at checkout. A payment is considered successful only after a verified payment-provider callback and a paid server order status. A browser redirect or screenshot alone does not prove payment.',
  '5. AI 内容限制': '5. AI Content Limitations',
  'AI 可能产生不准确、遗漏或不适合你具体情况的内容。请结合现实情况独立判断；如出现危机、伤害风险或持续心理困扰，应及时联系可信任的人或专业机构。': 'AI-generated content may be inaccurate, incomplete, or unsuitable for your circumstances. Use your own judgment. If you are experiencing a crisis, risk of harm, or ongoing psychological distress, contact a trusted person or qualified professional promptly.',
  '6. 服务调整': '6. Service Changes',
  '我们可能为安全、合规或产品改进调整功能，但不会无故剥夺已完成订单对应的合理访问权益。发生故障时，将优先恢复服务、重新生成报告或按退款规则处理。': 'We may adjust features for security, compliance, or product improvements. We will not unreasonably remove access associated with a completed order. If a service failure occurs, we will prioritize restoring access, regenerating the report, or applying the Refund Policy.',
  '7. 联系': '7. Contact',
  '运营方：Northstar 北极星项目运营者。售后、投诉和数据请求均可通过': 'Operator: Northstar. Support, complaints, and data requests can be submitted through an ',
  '在线客服工单': 'online support ticket',
  '客服工单': 'support ticket',
  '提交。': '.',
  '1. 我们处理的信息': '1. Information We Process',
  '北极星仅在提供测试、生成报告、处理订单和客服请求所必需的范围内处理信息。本政策说明我们收集什么、为什么使用，以及你可以如何管理相关信息。': 'Northstar processes information only as needed to provide tests, generate reports, fulfill orders, and respond to support requests. This policy explains what we collect, why we use it, and how you can manage it.',
  '你主动填写的测试答案、出生日期和时间、地区、关系背景或聊天文本。': 'Test answers, birth date and time, location, relationship context, or chat text that you choose to provide.',
  '订单编号、金额、支付渠道和支付状态。银行卡等支付凭证由 Stripe 等支付机构直接处理，北极星不保存完整卡号。': 'Order ID, amount, payment provider, and payment status. Payment credentials are processed directly by providers such as Stripe; Northstar does not store full card numbers.',
  '客服工单中的联系方式、订单号和问题说明。': 'Contact details, order IDs, and issue descriptions submitted in support tickets.',
  '为保障安全产生的基础访问日志，例如访问时间、IP 地址和错误信息。': 'Basic security logs, such as access time, IP address, and error information.',
  '2. 使用目的': '2. How We Use Information',
  '用于计算免费结果、在付款后生成完整报告、完成订单核验、处理退款与售后、保障接口安全和排查故障。我们不会出售你的个人信息，也不会将聊天文本用于公开展示。': 'We use this information to calculate free results, generate paid reports, verify orders, process refunds and support requests, secure our services, and troubleshoot errors. We do not sell personal information or publish chat text.',
  '3. 敏感信息提醒': '3. Sensitive Information',
  '关系分析可能涉及聊天记录和个人经历。请先删除真实姓名、手机号、住址、身份证件、账号密码及无关第三人的信息。不要上传违法内容或你无权提供的信息。': 'Relationship analysis may involve private conversations and personal experiences. Remove real names, phone numbers, home addresses, identity documents, passwords, and information about unrelated third parties before submitting. Do not upload unlawful content or information you are not authorized to provide.',
  '4. 第三方服务': '4. Third-Party Services',
  '支付环节可能由 Stripe 处理；部分个性化报告可能调用受控的 AI 服务。我们仅传输完成当前请求所需要的内容，并通过服务端订单校验限制未付款访问。': 'Payments may be processed by Stripe, and some personalized reports may use controlled AI services. We transmit only the information needed to complete the current request and use server-side order verification to restrict unpaid access.',
  '5. 保存期限与安全': '5. Retention and Security',
  '订单和支付记录按履约、对账及法定义务所需期限保存；客服和分析数据在目的完成后按需删除或去标识化。我们采用访问控制、签名回调、限流和非公开存储等措施，但互联网服务不存在绝对安全。': 'Order and payment records are retained as needed for fulfillment, reconciliation, and legal obligations. Support and analysis data is deleted or de-identified when no longer needed. We use access controls, signed callbacks, rate limits, and private storage, but no internet service can guarantee absolute security.',
  '订单和支付记录按履约、对账及法定义务所需期限保存。已解决或关闭的客服工单在最后更新 90 天后移除联系方式和问题正文；产品分析数据以及已解决的运营记录在 180 天后删除。我们采用访问控制、签名回调、限流和非公开存储等措施，但互联网服务不存在绝对安全。': 'Order and payment records are retained as required for fulfillment, reconciliation, and legal obligations. Contact details and issue text are removed from resolved or closed support tickets 90 days after the last update. Product analytics and resolved operational records are deleted after 180 days. We use access controls, signed callbacks, rate limits, and private storage, but no internet service can guarantee absolute security.',
  '6. 你的权利': '6. Your Rights',
  '你可以通过': 'You can use a ',
  '申请查询、更正、删除相关信息，或撤回非履约必需的处理授权。为防止冒用，我们可能要求核对订单号或其他必要信息。': 'to request access, correction, or deletion of relevant information, or to withdraw consent for processing that is not required to fulfill an order. To prevent impersonation, we may ask you to verify an order ID or other necessary information.',
  '7. 未成年人': '7. Children',
  '本服务不面向不满十四周岁的未成年人。未成年人使用前应取得监护人同意，不应提交敏感个人信息。': 'This service is not intended for children under 14. Minors must obtain a guardian’s consent before use and should not submit sensitive personal information.',
  '8. 联系方式': '8. Contact',
  '运营方：Northstar 北极星项目运营者。联系渠道：': 'Operator: Northstar. Contact: ',
  '。涉及隐私删除请求时，请在工单类别中选择“隐私与数据”。': '. For privacy deletion requests, choose “Privacy & Data” as the support category.',
  '涉及隐私删除请求时，请在工单类别中选择“隐私与数据”。': 'For privacy deletion requests, choose “Privacy & Data” as the support category.',
  '退款与售后规则': 'Refund and Support Policy',
  '数字报告在支付确认后会立即生成或开放。付款前请核对项目、价格和解锁范围。': 'Digital reports are generated or unlocked immediately after payment is confirmed. Review the item, price, and included content before purchasing.',
  '1. 可申请退款的情形': '1. When You May Request a Refund',
  '重复扣款或同一订单被重复支付。': 'You were charged more than once for the same order.',
  '付款成功后，服务器在合理重试后仍无法交付对应报告。': 'Payment succeeded, but the server could not deliver the report after reasonable retry attempts.',
  '报告内容为空、严重损坏或与所购项目明显不符，且无法通过重新生成修复。': 'The report is empty, materially corrupted, or clearly different from the purchased item and cannot be fixed by regeneration.',
  '经核实属于未经授权的支付。': 'The payment is verified as unauthorized.',
  '2. 通常不支持退款的情形': '2. When Refunds Are Generally Not Available',
  '完整数字报告已经成功交付后，仅因个人主观感受、与期待不符、未仔细阅读服务说明，通常不支持无理由退款；法律另有强制规定的除外。': 'After a complete digital report has been successfully delivered, refunds are generally not available solely because the content did not match personal expectations or the service description was not read carefully, except where applicable law requires otherwise.',
  '3. 申请方式': '3. How to Request a Refund',
  '请在付款后七日内通过': 'Within seven days of payment, submit a ',
  '提交订单号、支付时间、问题说明和可证明故障的截图。无需提供完整银行卡号、密码或验证码。': ' with your order ID, payment time, issue description, and screenshots showing the problem. Never provide a full card number, password, or verification code.',
  '4. 处理时限': '4. Review Time',
  '我们通常在三个工作日内完成初步核查。退款获批后将原路退回，到账时间取决于支付机构和发卡行。': 'We usually complete an initial review within three business days. Approved refunds are returned to the original payment method; posting time depends on the payment provider and card issuer.',
  '5. 优先修复': '5. Service Recovery First',
  '对于临时网络或生成故障，我们可能先提供重新生成、恢复访问或补发报告；若仍无法交付，再执行退款。': 'For temporary network or generation failures, we may first regenerate the report, restore access, or reissue it. If delivery still fails, we will process a refund.',
  '问题类型': 'Issue Type',
  '支付与订单': 'Payment & Orders',
  '退款申请': 'Refund Request',
  '报告故障': 'Report Problem',
  '隐私与数据': 'Privacy & Data',
  '其他': 'Other',
  '联系方式': 'Contact Information',
  '订单号（如有）': 'Order ID (if available)',
  '问题说明': 'Issue Description',
  '提交客服工单': 'Submit Support Ticket',
  '请留下可联系到你的邮箱、微信号或其他方式。不要填写密码、验证码或完整银行卡信息。': 'Provide an email address or another way for us to contact you. Never submit passwords, verification codes, or complete card information.',
  '邮箱、微信号或其他可联系方式': 'Email address or another contact method',
  '例如支付完成页显示的订单号': 'For example, the order ID shown after payment',
  '请说明发生时间、页面和具体问题': 'Describe when and where the issue occurred and what happened',
  '正在提交...': 'Submitting...',
  '提交失败': 'Submission failed',
  '提交失败，请稍后重试。': 'Submission failed. Please try again later.',
  '工单编号：': 'Ticket ID: ',
  '专业长报告 · 10–12 个结构化章节 · 约 15–20 分钟阅读 · 包含个性化证据与行动计划。': 'Professional long report · 10–12 structured sections · approximately 15–20 minutes to read · personalized evidence and action plan.',
  '当前主题的专业长报告，约 15–20 分钟阅读，含个性化分析与行动建议。': 'A professional long report for this reading, with personalized analysis, evidence, and practical recommendations.',
  '上线价，一次解锁全站 16 类专业长报告，并可长期恢复访问。': 'Launch price for all 16 professional long reports, with long-term purchase restoration.',
  '两份专业长报告，整理“我是什么样的人，我在关系里会怎样”。': 'Two professional long reports covering your personality and relationship patterns.',
  'NORTHSTAR 专业长报告': 'NORTHSTAR PROFESSIONAL REPORT',
  '个结构化章节 · 预计阅读': 'structured sections · estimated reading time',
  '上线价 USD $7.99': 'Launch price USD $7.99',
  '上线价': 'Launch price',
  '分钟': 'minutes'
};

function decodeLiteral(value) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

function addValue(values, raw) {
  const value = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!value || !/[\u3400-\u9fff]/u.test(value)) return;
  if (value.length > 900 || value.includes('${') || /^[\w-]+:\s/.test(value)) return;
  if (
    /(?:document\.|getElementById|addEventListener|function\s*\(|\bconst\b|\blet\b|\breturn\b|=>|;\s*[a-z_$])/i.test(value)
    || /(?:\{\s*id:|\btrait:|\binvert:|\bclass=|\bv-model=|\b@click=)/i.test(value)
  ) return;
  values.add(value);
}

function extractFromJavaScript(source, values) {
  function processLiteral(rawLiteral) {
    const literal = decodeLiteral(rawLiteral);
    if (!literal.includes('<')) addValue(values, literal);
    if (literal.includes('<')) {
      for (const textMatch of literal.matchAll(/>([^<>{}]*[\u3400-\u9fff][^<>{}]*)</gu)) {
        addValue(values, textMatch[1]);
      }
      for (const attrMatch of literal.matchAll(/(?:placeholder|aria-label|title|alt)="([^"]*[\u3400-\u9fff][^"]*)"/gu)) {
        addValue(values, attrMatch[1]);
      }
    }
  }

  const ast = babelParser.parse(source, {
    sourceType: 'script',
    allowReturnOutsideFunction: true
  });
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node.type === 'StringLiteral') processLiteral(node.value);
    if (node.type === 'TemplateElement') processLiteral(node.value && node.value.cooked || '');
    for (const [key, child] of Object.entries(node)) {
      if (['loc', 'start', 'end', 'extra'].includes(key)) continue;
      walk(child);
    }
  }
  walk(ast.program);
}

function extractFromHtml(source, values) {
  const visibleSource = source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, '');
  for (const match of visibleSource.matchAll(/>([^<]*[\u3400-\u9fff][^<]*)</gu)) addValue(values, match[1]);
  for (const match of visibleSource.matchAll(/(?:content|placeholder|aria-label|title|alt)="([^"]*[\u3400-\u9fff][^"]*)"/gu)) {
    addValue(values, match[1]);
  }
}

function collectValues() {
  const values = new Set();
  const jsFiles = [
    path.join(publicDir, 'app.js'),
    ...fs.readdirSync(path.join(publicDir, 'content')).map(name => path.join(publicDir, 'content', name))
  ];
  for (const file of jsFiles) extractFromJavaScript(fs.readFileSync(file, 'utf8'), values);
  for (const name of ['index.html', 'terms.html', 'privacy.html', 'refund.html', 'support.html']) {
    extractFromHtml(fs.readFileSync(path.join(publicDir, name), 'utf8'), values);
  }
  Object.keys(manualTranslations).forEach(value => values.add(value));
  return [...values].sort((left, right) => right.length - left.length);
}

async function translateBatch(values) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'zh-CN');
  url.searchParams.set('tl', 'en');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', values.join(delimiter));
  let response = await fetch(url, {
    headers: { 'User-Agent': 'Northstar locale catalog builder' }
  });
  let translated = '';
  if (response.ok) {
    const payload = await response.json();
    translated = (payload[0] || []).map(item => item[0]).join('');
  } else {
    const fallbackUrl = new URL('https://api.mymemory.translated.net/get');
    fallbackUrl.searchParams.set('q', values.join(delimiter));
    fallbackUrl.searchParams.set('langpair', 'zh-CN|en');
    response = await fetch(fallbackUrl, {
      headers: { 'User-Agent': 'Northstar locale catalog builder' }
    });
    if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
    const payload = await response.json();
    if (Number(payload.responseStatus) !== 200) {
      throw new Error(`Fallback translation failed: ${payload.responseStatus}`);
    }
    translated = String(payload.responseData && payload.responseData.translatedText || '');
  }
  const normalized = translated.replace(/\|\|\|\s*NORTHSTAR_SPLIT\s*\|\|\|/gi, '|||NORTHSTAR_SPLIT|||');
  const parts = normalized.split('|||NORTHSTAR_SPLIT|||').map(value => value.trim());
  if (parts.length !== values.length) {
    throw new Error(`Translation split mismatch: expected ${values.length}, received ${parts.length}`);
  }
  return parts;
}

async function buildCatalog() {
  const values = collectValues();
  let existingCatalog = {};
  if (fs.existsSync(outputPath)) {
    const sandbox = { window: {} };
    vm.runInNewContext(fs.readFileSync(outputPath, 'utf8'), sandbox, { timeout: 1000 });
    existingCatalog = sandbox.window.NORTHSTAR_LOCALES?.en || {};
  }
  const catalog = Object.fromEntries(values.filter(value => existingCatalog[value]).map(value => [value, existingCatalog[value]]));
  const pendingValues = values.filter(value => !catalog[value]);
  if (process.argv.includes('--stats') || process.argv.includes('--check')) {
    console.log(JSON.stringify({
      total: values.length,
      existing: Object.keys(catalog).length,
      pending: pendingValues.length,
      sample: pendingValues.slice(0, 80)
    }, null, 2));
    if (process.argv.includes('--check') && pendingValues.length) process.exitCode = 1;
    return;
  }
  let batch = [];
  let length = 0;

  async function flush() {
    if (!batch.length) return;
    const translations = await translateBatch(batch);
    batch.forEach((source, index) => {
      catalog[source] = (translations[index] || source)
        .replace(/\bPolaris\b/g, 'Northstar')
        .replace(/\bhuman chart(s)?\b/gi, 'Human Design')
        .replace(/\bdouble chart(s)?\b/gi, 'compatibility reading');
    });
    process.stdout.write(`Catalogued ${Object.keys(catalog).length}/${values.length}\r`);
    batch = [];
    length = 0;
  }

  for (const value of pendingValues) {
    if (length + value.length + delimiter.length > 350) await flush();
    batch.push(value);
    length += value.length + delimiter.length;
  }
  await flush();

  Object.assign(catalog, manualTranslations);
  const ordered = Object.fromEntries(
    Object.entries(catalog).sort(([left], [right]) => right.length - left.length)
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `window.NORTHSTAR_LOCALES = window.NORTHSTAR_LOCALES || {};\n` +
    `window.NORTHSTAR_LOCALES.en = ${JSON.stringify(ordered, null, 2)};\n` +
    `window.NORTHSTAR_LOCALE_KEYS = window.NORTHSTAR_LOCALE_KEYS || {};\n` +
    `window.NORTHSTAR_LOCALE_KEYS.en = Object.keys(window.NORTHSTAR_LOCALES.en).sort((a, b) => b.length - a.length);\n`
  );
  process.stdout.write(`\nWrote ${Object.keys(ordered).length} translations to ${outputPath}\n`);
}

buildCatalog().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
