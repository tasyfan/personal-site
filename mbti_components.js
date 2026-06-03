  // ─── MBTI DATABASE ──────────────────────────────────────────
  const MBTI_QUESTIONS = [
    { id: 1, trait: 'E_I', text: '在社交聚会中，我通常会主动开启话题，而不是等待别人来找我。' },
    { id: 2, trait: 'E_I', text: '经过一天漫长的工作后，我更倾向于独处来恢复精力。', invert: true },
    { id: 3, trait: 'E_I', text: '我喜欢结交新朋友，并且很容易在陌生环境中融入人群。' },
    { id: 4, trait: 'S_N', text: '在处理问题时，我更相信实际的经验和确凿的数据，而不是直觉。' },
    { id: 5, trait: 'S_N', text: '我经常会花很多时间思考宇宙的奥秘、人生的意义或未来的可能性。', invert: true },
    { id: 6, trait: 'S_N', text: '我更喜欢一步一步、有条理地完成任务，而不是随时跳跃着处理。' },
    { id: 7, trait: 'T_F', text: '在做决定时，逻辑和客观事实比个人情感或他人的感受更重要。' },
    { id: 8, trait: 'T_F', text: '当朋友遇到困难时，我通常首先提供情感上的安慰，而不是分析如何解决问题。', invert: true },
    { id: 9, trait: 'T_F', text: '如果某人的观点在逻辑上是错误的，即使会让他不高兴，我也倾向于指出。' },
    { id: 10, trait: 'J_P', text: '我喜欢提前规划好我的日程，而不是随性而为。' },
    { id: 11, trait: 'J_P', text: '在截止日期前，我常常拖延，习惯在最后一刻集中精力完成工作。', invert: true },
    { id: 12, trait: 'J_P', text: '我喜欢把工作区域整理得井井有条，因为混乱会让我感到焦虑。' }
  ]

  const MBTI_PROFILES = {
    INTJ: { name: '建筑师', en: 'Architect', desc: '富有想象力和战略性的思想家，一切皆在计划之中。', deep: '作为INTJ，你的核心驱动力是“理解并重构世界的运作方式”。你拥有极其罕见的独立思考能力，这使得你在人群中显得既孤独又强大。你的主导功能是内倾直觉（Ni），它让你能轻易洞察事物的本质和未来趋势。在职场上，你是天生的战略家，能迅速找到系统漏洞并提供优化方案；但在人际关系中，你可能会因为过于看重逻辑而忽略他人的情感需求。你这一生的核心课题是：学会在理性的堡垒之外，拥抱情感的不可控性。当你将同理心与你的战略头脑结合时，你将爆发出改变世界的力量。' },
    INTP: { name: '逻辑学家', en: 'Logician', desc: '具有创造力的发明家，对知识有着不可遏制的渴望。', deep: '作为INTP，你的大脑就像一台永不休眠的超级计算机，时刻在分析、解构和重组接收到的信息。你的主导功能内倾思考（Ti）赋予了你对逻辑一致性的极致追求。你对“为什么”的执着，让你在科学、哲学或技术领域往往能有突破性见解。然而，你可能会陷入“分析瘫痪”，在脑海中构筑了宏大的理论，却迟迟未能将其付诸实践。你的灵魂课题是：学会将抽象的理论落地。宇宙建议你，不要等到计划完美无缺才开始行动，因为真正的真理，往往在试错的行动中才会显现。' },
    ENTJ: { name: '指挥官', en: 'Commander', desc: '大胆、富有想象力且意志强大的领导者，总能找到或创造解决方法。', deep: '作为ENTJ，你天生散发着掌控全局的王者气场。外倾思考（Te）作为你的主导功能，让你在面对复杂局面时能够迅速制定战略、分配资源并高效执行。你是天生的领导者，不畏惧挑战，甚至渴望在克服困难中证明自己的价值。然而，你追求效率的极致，有时会让你在他人眼中显得冷酷无情。你的深层潜意识中隐藏着对“失控”的恐惧。你的灵魂课题是：理解“脆弱”并非软弱，而是建立深度连接的桥梁。当你学会放下掌控欲，倾听他人的心声时，你的领导力将从“令人敬畏”升华为“令人追随”。' },
    ENTP: { name: '辩论家', en: 'Debater', desc: '聪明好奇的思想者，无法抗拒智力上的挑战。', deep: '作为ENTP，你是一个思维跳跃、永远在寻找新奇事物的“创意发电机”。外倾直觉（Ne）让你能轻易看到不同事物之间的隐秘联系，你总能在别人觉得无路可走时提出另类的解决方案。你喜欢辩论，不是为了赢，而是为了在思想的碰撞中寻找真理的火花。但这种对“新鲜感”的追求，容易让你陷入三分钟热度的陷阱，留下许多未完成的项目。你的灵魂课题是：培养持久的专注力和责任感。当你能将你那惊艳的创意坚持执行到底时，你将成为真正的革新者。' },
    INFJ: { name: '提倡者', en: 'Advocate', desc: '安静而神秘，同时鼓舞人心且不知疲倦的理想主义者。', deep: '作为INFJ，你是16型人格中最稀有的类型之一。你拥有深邃的内倾直觉（Ni）和强烈的外倾情感（Fe），这让你成为了一面“人类情感的镜子”。你能够轻易感知他人的痛苦与渴望，并天生拥有一种想要治愈世界、引导他人走向美好的使命感。然而，你过于敏锐的感知力也容易让你承载过多的负能量，甚至在满足他人期待中迷失自己。你的灵魂课题是：建立健康的心理边界。请记住，你不需要拯救所有人。当你学会将那份深沉的爱先给予自己时，你治愈他人的力量才会源源不断。' },
    INFP: { name: '调停者', en: 'Mediator', desc: '诗意、善良、无私的人，总是致力于帮助正义的事业。', deep: '作为INFP，你的内心是一个充满诗意、童话与理想主义的绚丽宇宙。内倾情感（Fi）是你灵魂的核心，你所有的选择都基于强烈的个人价值观和对“真善美”的追求。你对他人的痛苦有着极强的共情能力，是天生的治愈者和倾听者。但现实世界的残酷和功利，常常会让你感到受伤和格格不入，导致你想要退缩回自己的内心城堡。你的灵魂课题是：学会在不完美的现实中，找到你理想落地的土壤。不要害怕冲突，你的温柔中蕴含着改变世界的坚定力量。' },
    ENFJ: { name: '主人公', en: 'Protagonist', desc: '富有魅力、鼓舞人心的领导者，有使听众着迷的能力。', deep: '作为ENFJ，你是天生的“引路人”。外倾情感（Fe）让你在人群中如鱼得水，你总能敏锐地察觉到团队的氛围，并用你的热情和愿景将大家凝聚在一起。你最大的快乐来自于看到他人在你的帮助下成长和发光。但这种对“他人认可”的依赖，也可能成为你的软肋。你可能会为了维持和谐而压抑自己真实的需求，甚至过度干涉他人的生活。你的灵魂课题是：学会分辨“帮助”与“控制”的边界，并学会在没有掌声的时候，依然能坚定地肯定自己的价值。' },
    ENFP: { name: '竞选者', en: 'Campaigner', desc: '热情、有创造力、爱交际的自由灵魂，总能找到微笑的理由。', deep: '作为ENFP，你就像是一阵充满生命力的微风。外倾直觉（Ne）让你对世界充满了无尽的好奇，你总能发现生活中的美好与可能性。你的热情极具感染力，能够轻易点燃他人的希望。然而，你不喜欢被规则束缚，害怕无聊和重复，这使得你在面对枯燥但必要的现实事务（如财务、日常琐事）时常常感到挣扎。你的灵魂课题是：在追求自由与承担责任之间找到平衡。当你能为你的奇思妙想打下坚实的现实基础时，你的创造力将不再只是火花，而是燎原之火。' },
    ISTJ: { name: '物流师', en: 'Logistician', desc: '实际且注重事实的人，可靠性不容怀疑。', deep: '作为ISTJ，你是社会的“定海神针”。内倾感觉（Si）让你高度尊重传统、规则和过往的经验。你务实、严谨、极其可靠，只要是你承诺的事情，无论多困难你都会坚持完成。你相信辛勤工作和秩序的力量。然而，你对“既定规则”的执着，可能会让你在面对突发变化或需要创新时显得有些僵化。你的深层恐惧是混乱和失控。你的灵魂课题是：学会在秩序之外，拥抱变化带来的生机。当你允许生活中偶尔出现意料之外的惊喜时，你会发现世界比你想象的更宽广。' },
    ISFJ: { name: '守卫者', en: 'Defender', desc: '非常专注且温暖的保护者，随时准备保护他们爱的人。', deep: '作为ISFJ，你的灵魂散发着一种安静而持久的温暖。你拥有强大的内倾感觉（Si）和外倾情感（Fe），这让你成为一个极其细腻、体贴的照顾者。你总是能记住身边人的喜好和细节，默默地为他们提供支持。你是家庭和团队中最坚实的后盾。但你的默默付出往往容易被理所当然地接受，而你不善于表达自己的需求，最终可能积累成内心的委屈。你的灵魂课题是：学会为自己发声。大声说出你的需要并不会破坏和谐，反而会让真正爱你的人懂得如何去爱你。' },
    ESTJ: { name: '总经理', en: 'Executive', desc: '出色的管理者，在管理事物或人的方面无与伦比。', deep: '作为ESTJ，你是天生的“秩序建立者”。外倾思考（Te）让你在任何混乱的环境中，都能迅速理清头绪，制定出高效的标准操作流程（SOP）。你为人正直、讲求效率，是推动社会机器高效运转的重要力量。但你对效率和结果的极度看重，有时会让你显得缺乏人情味，甚至对那些不如你高效的人表现出急躁和评判。你的灵魂课题是：理解人类情感的复杂性。当你学会用同理心去管理，而不是仅仅用规则去约束时，你将从一个“管理者”蜕变为一个真正的“领袖”。' },
    ESFJ: { name: '执政官', en: 'Consul', desc: '极有同情心、爱交际、受欢迎的人，总是热心提供帮助。', deep: '作为ESFJ，你是连接人与人之间的“超级黏合剂”。外倾情感（Fe）让你在社交场合中游刃有余，你天生就知道如何让身边的每一个人感到舒适和被重视。你乐于助人，极度重视家庭和社群的和谐。然而，你的自我价值感很大程度上建立在他人的评价之上。如果你感受到被孤立或付出没有得到回报，你会陷入深深的焦虑和失落。你的灵魂课题是：建立不依赖于外界评价的内在自我价值。当你学会为了自己而活，而不是为了满足所有人的期待时，你的笑容将更加纯粹。' },
    ISTP: { name: '鉴赏家', en: 'Virtuoso', desc: '大胆实际的实验者，掌握所有工具的使用。', deep: '作为ISTP，你是一个“行动派的分析师”。内倾思考（Ti）加上外倾感觉（Se），让你拥有极强的动手能力和危机处理能力。你喜欢拆解事物，了解它们是如何运作的，然后再把它们组装起来。你对理论不感兴趣，你只关心“这东西在现实中管用吗”。你随性、独立，像一匹孤狼，难以被规则驯服。但你的这种冷峻和难以捉摸，有时会让关心你的人感到被拒之门外。你的灵魂课题是：学会在关系中保持稳定。当你愿意向他人敞开心扉，分享你内心的世界时，你将获得比独自探索更深层的满足感。' },
    ISFP: { name: '探险家', en: 'Adventurer', desc: '灵活有魅力的艺术家，时刻准备探索和体验新事物。', deep: '作为ISFP，你的灵魂就是一件艺术品。内倾情感（Fi）让你拥有极其丰富敏感的内心世界，而外倾感觉（Se）则让你对当下的美学体验有着极致的追求。你可能不善言辞，但你擅长通过艺术、穿搭或生活方式来表达真实的自我。你追求当下的快乐与和谐，极度厌恶冲突。但这种对“活在当下”的执着，可能会让你逃避对未来的长期规划。你的灵魂课题是：学会在享受当下的同时，为未来打下基础。当你拥有了现实的保障，你那颗追求美的灵魂将获得更大的自由。' },
    ESTP: { name: '企业家', en: 'Entrepreneur', desc: '聪明、精力充沛、非常敏锐的人，真正享受生活在边缘。', deep: '作为ESTP，你是一个“活在当下、寻求刺激”的冒险家。外倾感觉（Se）让你对周围环境有着惊人的敏锐度，你总能迅速捕捉到机会，并在千钧一发之际做出反应。你喜欢成为焦点，享受风险带来的肾上腺素飙升。你是天生的推销员和破局者。但你追求即时满足的倾向，常常让你在遇到需要长期耐心积累的任务时选择放弃。你的灵魂课题是：学会延迟满足。当你能将你那惊人的爆发力，转化为持久的战略执行力时，你将成就一番非凡的事业。' },
    ESFP: { name: '表演者', en: 'Entertainer', desc: '自发、精力充沛、热情的艺人，生活在他们周围永不无聊。', deep: '作为ESFP，你是天生的“舞台中心”。你拥有极强的外倾感觉（Se）和内倾情感（Fi），这让你不仅懂得如何享受生活，更懂得如何让身边的人一起快乐。你的热情、幽默和感染力，能瞬间点亮任何一个沉闷的房间。你讨厌教条和束缚，只希望每一天都充满欢笑。然而，当你面临深刻的痛苦或复杂的长期问题时，你可能会选择用娱乐和狂欢来逃避。你的灵魂课题是：学会面对和拥抱负面情绪。当你能够勇敢地凝视人生的阴影，你的快乐将不再是逃避的避风港，而是真正治愈人心的阳光。' }
  }

  // ─── MBTI TEST PAGE ───────────────────────────────────────
  const MBTITest = defineComponent({
    name: 'MBTITestPage',
    setup() {
      const router = useRouter()
      const currentQuestionIndex = ref(0)
      const answers = reactive({})
      const isCompleting = ref(false)

      const progress = computed(() => {
        return Math.min(100, (Object.keys(answers).length / MBTI_QUESTIONS.length) * 100)
      })

      const selectAnswer = (qId, value) => {
        answers[qId] = value
        AudioSynth.playHover()
        
        // Auto advance to next question
        if (currentQuestionIndex.value < MBTI_QUESTIONS.length - 1) {
          setTimeout(() => {
            currentQuestionIndex.value++
            // scroll into view
            const el = document.getElementById('q-' + MBTI_QUESTIONS[currentQuestionIndex.value].id)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
        MBTI_QUESTIONS, currentQuestionIndex, answers, progress, isCompleting,
        selectAnswer, finishTest
      }
    },
    template: \`
      <main class="mbti-test section">
        <div class="test-header" v-reveal>
          <p class="section-kicker">PERSONALITY ASSESSMENT</p>
          <h2>MBTI 性格原型解析</h2>
          <p class="lede">请凭直觉回答以下 12 个问题，探索你最深层的灵魂密码。</p>
        </div>

        <div class="mbti-progress-container" v-reveal>
          <div class="mbti-progress-bar">
            <div class="mbti-progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="mbti-progress-text">已完成 {{ Object.keys(answers).length }} / {{ MBTI_QUESTIONS.length }}</div>
        </div>

        <div class="questions-list">
          <div
            v-for="(q, index) in MBTI_QUESTIONS"
            :key="q.id"
            :id="'q-' + q.id"
            class="question-card"
            :class="{ active: index === currentQuestionIndex, answered: answers[q.id] !== undefined }"
            v-show="index <= currentQuestionIndex + 1"
          >
            <p class="question-text">{{ q.id }}. {{ q.text }}</p>
            <div class="scale-options">
              <div class="scale-btn agree size-1" :class="{ selected: answers[q.id] === 3 }" @click="selectAnswer(q.id, 3)"></div>
              <div class="scale-btn agree size-2" :class="{ selected: answers[q.id] === 2 }" @click="selectAnswer(q.id, 2)"></div>
              <div class="scale-btn agree size-3" :class="{ selected: answers[q.id] === 1 }" @click="selectAnswer(q.id, 1)"></div>
              <div class="scale-btn neutral size-3" :class="{ selected: answers[q.id] === 0 }" @click="selectAnswer(q.id, 0)"></div>
              <div class="scale-btn disagree size-3" :class="{ selected: answers[q.id] === -1 }" @click="selectAnswer(q.id, -1)"></div>
              <div class="scale-btn disagree size-2" :class="{ selected: answers[q.id] === -2 }" @click="selectAnswer(q.id, -2)"></div>
              <div class="scale-btn disagree size-1" :class="{ selected: answers[q.id] === -3 }" @click="selectAnswer(q.id, -3)"></div>
            </div>
            <div class="scale-labels">
              <span class="label-agree">完全同意</span>
              <span class="label-disagree">完全反对</span>
            </div>
          </div>
        </div>

        <div class="action-area" v-if="Object.keys(answers).length === MBTI_QUESTIONS.length" style="margin-top: 40px;">
          <button class="primary-action" @click="finishTest" :disabled="isCompleting">
            {{ isCompleting ? '正在解析灵魂密码...' : '✧ 生成我的性格报告' }}
          </button>
        </div>
      </main>
    \`
  })

  // ─── MBTI RESULT PAGE ─────────────────────────────────────
  const MBTIResult = defineComponent({
    name: 'MBTIResultPage',
    components: { PaymentModal },
    setup() {
      const router = useRouter()
      const showPayment = ref(false)
      const hasPaid = ref(false)
      const displayedDeepText = ref('')
      const isTyping = ref(false)

      if (!store.mbtiResult) {
        router.push('/mbti')
        return { showPayment, hasPaid, typeData: ref(null), p: ref({}), displayedDeepText, isTyping, handlePaymentSuccess: () => {}, generatePoster: () => {}, restartTest: () => {} }
      }

      const { type, percentages } = store.mbtiResult
      const typeData = ref({ type, ...MBTI_PROFILES[type] })
      const p = ref(percentages)

      const startTypewriter = (fullText) => {
        isTyping.value = true
        displayedDeepText.value = ''
        let i = 0
        const interval = setInterval(() => {
          if (i < fullText.length) {
            displayedDeepText.value += fullText.charAt(i)
            i++
            const container = document.documentElement
            container.scrollTop = container.scrollHeight
          } else {
            clearInterval(interval)
            isTyping.value = false
          }
        }, 30) // slightly faster for MBTI
      }

      const handlePaymentSuccess = () => {
        showPayment.value = false
        hasPaid.value = true
        
        const intro = \`系统已接通潜意识深层数据库。\\n正在为您生成【\${typeData.value.type} \${typeData.value.name}】的专属深度分析报告...\\n\\n\`
        const body = typeData.value.deep
        
        startTypewriter(intro + body)
      }

      const generatePoster = async () => {
        const posterEl = document.getElementById('mbti-poster-dom')
        if (!posterEl) return
        try {
          const canvas = await html2canvas(posterEl, { scale: 2, useCORS: true, backgroundColor: '#16213e' })
          const imgUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = \`Northstar_MBTI_\${typeData.value.type}.png\`
          link.href = imgUrl
          link.click()
        } catch (error) {
          console.error("Failed to generate poster:", error)
          alert("海报生成失败，请重试。")
        }
      }

      const restartTest = () => {
        store.mbtiResult = null
        router.push('/mbti')
      }

      return {
        showPayment, hasPaid, typeData, p, displayedDeepText, isTyping,
        handlePaymentSuccess, generatePoster, restartTest
      }
    },
    template: \`
      <main class="result-page section">
        <div v-reveal>
          <p class="section-kicker">PERSONALITY TYPE</p>
          <div class="mbti-type-title">
            <h2>{{ typeData.type }}</h2>
            <p>{{ typeData.name }} - {{ typeData.en }}</p>
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
              <h3>✦ 解锁高阶人格使用说明书</h3>
              <p>包含：核心原动力分析、致命性格弱点破解、天命职业指南、灵魂伴侣匹配。</p>
              <div class="price">¥ 9.90 <span class="original-price">¥ 39.90</span></div>
              <p class="price-hint">限时 1 折 · 今日已有 {{ Math.floor(Math.random() * 300 + 200) }} 人解锁</p>
              <button class="primary-action pay-btn" @click="showPayment = true">
                立即解锁完整报告
              </button>
            </div>
          </div>

          <div class="deep-content" :class="{ 'is-blurred': !hasPaid }" v-if="!hasPaid">
            <h3>✦ 深度灵魂使用说明（高阶解析）</h3>
            <div class="reading-block deep-block">
              <p class="reading-text deep-text">{{ typeData.deep }}</p>
            </div>
          </div>
          
          <div class="deep-content ai-mode" v-if="hasPaid">
            <h3 style="color:var(--blue);margin-bottom:16px;">
              <span class="qr-icon" style="font-size:18px;">✨</span> AI 大模型深度推演中...
            </h3>
            <div class="reading-block deep-block ai-response" style="min-height:300px;">
              <p class="reading-text deep-text" style="white-space:pre-wrap;">{{ displayedDeepText }}<span class="typewriter-cursor" v-if="isTyping"></span></p>
            </div>
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
            <div class="poster-brand">✧ Northstar MBTI ✧</div>
            <div class="poster-title">灵魂切片·人格原理解析</div>
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
    \`
  })
