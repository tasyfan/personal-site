# Northstar Walkthrough

## Migration

- Migrated into workspace on 2026-06-13.
- Source path before migration: `/Users/fantasy/Documents/Codex/2026-06-01/cli/outputs/personal-site`.
- New path: `/Users/fantasy/Desktop/codex-workspace/project001_northstar`.

## Current State

- Frontend entry: `index.html`
- Main app: `app.js`
- Styles: `styles.css`
- Static build output: `dist/public`
- Backend: `server/index.js`
- Payment routes: `server/routes/payment.js`
- Admin page: `admin.html`

## Verification Checklist

Run before claiming changes are complete:

```bash
npm run check:syntax
npm run build:static
npm --prefix server audit --omit=dev
```

For deployed changes, verify:

```bash
curl -fsSL https://northstar.fantasy-games.org/index.html
curl -sS https://northstar.fantasy-games.org/api/payment/admin/config
```

The admin config endpoint should return `401` unless called with `Authorization: Bearer ADMIN_TOKEN`.

## 2026-06-19 Accurate Natal Chart

- Replaced the astrology hash/approximation path with deterministic astronomical calculations.
- Planetary longitudes use the bundled MIT-licensed Astronomy Engine implementation (VSOP87 / NOVAS, approximately ±1 arcminute).
- Birth time is converted through the selected IANA timezone with Luxon, including historical daylight-saving rules.
- City search resolves latitude, longitude, and timezone through `city-timezones`; users can edit all three values for locations not present in the city index.
- The chart returns Sun, Moon, Mercury through Pluto, retrograde state, Ascendant, Midheaven, Whole Sign houses, and major aspects.
- Missing date, exact time, timezone, or coordinates now fails explicitly; it never returns a random fallback chart.
- Numerical regression fixtures were cross-checked against Swiss Ephemeris and are covered by `server/test/astrology.test.js`.

## 2026-06-13 Relationship AI

Added AI 情感阶段分析:

- New page: `/#/relationship-ai`
- New backend route: `server/routes/relationship.js`
- New API: `POST /api/relationship/analyze`
- New payment plan id: `relationship-ai`
- Backend requires a server-verifiable paid order by default; direct unpaid calls return `402 RELATIONSHIP_AI_PAYMENT_REQUIRED`.
- AI provider order is Gemini first, OpenAI second, local fallback last. Admin config exposes whether Gemini/OpenAI keys are configured without revealing secrets.
- Payment modal includes a manual-review option so live sites without Stripe/WeChat/Alipay merchant credentials can still create real server orders for admin confirmation.
- Paid reports now use `POST /api/tests/:type/ai-analysis` for server-verified Gemini personal analysis. The fixed deep report remains the fallback and AI output is cached per paid order.
- Relationship AI copy is intentionally low-pressure: partial clues are enough to start, and other tests are optional enhancements rather than prerequisites.
- Added cross-links from Home, attachment result, and synastry result.
- Added setup doc: `RELATIONSHIP_AI_SETUP.md`
- Verification screenshots: `verification/relationship-ai-desktop.png`, `verification/relationship-ai-mobile.png`

## 2026-06-13 Added 6 New Psychological & Metaphysical Tests

We have successfully integrated six new tests:
1. **色彩心理测试 (Lüscher Color Test)**: Interactive color ranking using a grid of 8 color blocks, analyzing stress, focus, and emotional blockages.
2. **九型人格测试 (Enneagram Test)**: 18-question questionnaire evaluating the nine personality profiles.
3. **荣格八维测试 (Jungian 8 Cognitive Functions)**: 16-question assessment of cognitive functions (Ni, Ne, Si, Se, Ti, Te, Fi, Fe).
4. **黑暗三角测试 (Dark Triad Test)**: 12-question measurement of Machiavellianism, Narcissism, and Psychopathy.
5. **内在破坏者测试 (Inner Saboteurs Test)**: 15-question evaluation identifying self-sabotage mental patterns.
6. **心理防御机制测试 (Ego Defense Mechanisms)**: 12 situational questions mapping stress response defense mechanisms.

### Key Modifications:
- **`index.html`**: Loaded script tags for the six new content files under `content/`.
- **`app.js`**: Registered the 6 new tests under `TEST_CATALOG`, added homepage menu navigation cards, implemented test/result Vue components, and added 12 new routes.
- **`server/core/engine.js`**: Implemented backend scoring logic for all 6 tests.
- **`server/routes/tests.js` & `server/routes/payment.js`**: Configured pricing, unlocking mappings, and catalog lists.

### Verification Done:
- Run `npm run check:syntax`: Passed successfully.
- Run `npm run build:static`: Assets successfully compiled.
- Run `npm --prefix server audit --omit=dev`: Found 0 vulnerabilities.
- **End-to-End Browser Automation**:
  - Started local server on port 3010.
  - Used Chrome DevTools MCP to navigate to the homepage, click "开启命运观测" and load test components.
  - Fixed a client-side routing crash in the 5 questionnaire tests (Enneagram, Jung8, DarkTriad, Saboteurs, Defense) where the server-side `/calculate` response was being saved without dominant/scores fields, causing Vue rendering exceptions on result redirect.
  - Implemented client-side scoring formulas in the respective `finishTest` methods to save complete local drafts with `dominant` and `scores` properties.
  - Completed Enneagram & Lüscher Color tests via automated browser inputs and verified they successfully compute, redirect to result pages, render previews, and trigger the payment modal without any warnings or runtime errors.
  - Screenshots saved: `screenshot_home.png`, `screenshot_color.png`, `screenshot_enneagram_result.png` under `/Users/fantasy/.gemini/antigravity/browser_recordings/`.

- **Website Copy Correction**:
  - Found and corrected outdated references of "九大" (9) to "十五大" (15) for test counts and dimensions.
  - Updated `index.html` og:description meta tag: changed `九大维度` to `十五大维度`.
  - Updated `app.js` home hero copy: changed `九大测试` to `十五大测试` and updated the listing to explicitly name all 15 tests.
  - Retained "九大能量中心" (9 energy centers) in Human Design context as it is a correct metaphysical definition.
  - Successfully re-built the static project.

- **Package Configurations & Payment Logic**:
  - Added the new tests to existing packages:
    - Added `enneagram`, `jung8`, `darktriad`, `saboteurs`, and `defense` to the **人格关系组合 (self-core)** package.
    - Added `color` to the **能量疗愈组合 (energy-healing)** package.
  - Aligned configs across frontend `app.js` (PRODUCT_PLANS), backend `tests.js` (PLAN_UNLOCKS), and `payment.js` (PLAN_CATALOG).
  - Verified and confirmed the payment/unlock flow:
    1. Unlocks are saved in the client's `localStorage` key `northstar_unlocked_tests` as an array of test IDs.
    2. Any test matching the unlocked list directly triggers the paid state, skipping payment triggers.
    3. Server-side `orderUnlocksTest` checks if the order's `planId` contains the requested test in its definition (via the updated `PLAN_UNLOCKS` dictionary).
    4. Unpurchased tests remain locked on the client, and direct unpaid server calls to their endpoints return `402 PAYMENT_REQUIRED`. This guarantees users do not pay twice, and unbought tests cannot be accessed.

## 2026-06-13 Restructure Packages and Pricing (V2)

Optimized the Northstar platform's package combinations and pricing structure to increase profitability, prevent package cannibalization, and establish clear value positioning:
- **`app.js`**:
  - Re-defined `PRODUCT_PLANS` with V2 prices: `single` (19.9), `self-core` (29.9), `advanced-personality` (34.9), `dark-side` (49.9), `destiny-map` (49.9), `energy-healing` (39.9), `relationship-plus` (59.9), `relationship-ai` (29.9), `all-access` (99.0).
  - Streamlined `relationship-plus` to 4 core tests (removed `astrology` and `tarot`).
  - Aligned `getRecommendedPlans(testType)` overrides to use correct V2 plans and orderings.
- **`server/routes/tests.js`**: Updated `PLAN_UNLOCKS` for V2 packages. Retained legacy plan IDs (`astro-tarot`, `synastry-ai`, `relationship`) for 100% backward compatibility of existing paid orders in the database.
- **`server/routes/payment.js`**: Aligned `PLAN_CATALOG` with V2 package details and prices.
- **Build & Syntax Verification**:
  - Ran `npm run check:syntax`: Passed.
  - Ran `npm run build:static`: Frontend compiled successfully to `dist/public`.
- **E2E Browser Automation**:
  - Launched Node server on port 3010.
  - Used Chrome DevTools MCP to navigate to the Enneagram result page and trigger the payment modal.
  - Verified that the new prices (¥34.9, ¥99.0, ¥19.9) and the correct unlock scopes render correctly in the viewport.
  - Simulated a successful All-Access purchase under demo mode, confirming the modal closes, the static report unlocks immediately, and the client-side `localStorage.northstar_unlocked_tests` is fully populated with all 15 test IDs in one single transaction. Verified that direct unpaid backend requests to AI analysis correctly fail with `402` to secure Gemini API usage.

## 2026-06-14 Premium Redesign & Ambient Background Motion

Improved website aesthetics and page responsiveness based on modern minimal slate style rules:
- **`styles.css`**:
  - Redesigned the Relationship AI analysis panels (`.relationship-ai-form`, `.relationship-ai-side`, `.relationship-result`) to use high-quality deep-indigo borders (`rgba(138, 79, 255, 0.18)`), dark semi-transparent glassmorphic backdrops (`rgba(10, 10, 20, 0.55)`), and smooth shadows.
  - Updated the "Confidence Meter" and "Confidence Card" to use a soothing gradient (`linear-gradient(90deg, #8a4fff, #00f0ff)`) and elegant violet headings (`#b4a0e5`) replacing the loud orange tones.
  - Refined the "Interest Score Card" and "Power Dynamic Card" with clean borders, a custom glow ring (cyan to purple), and an elegant pill badge for the power status.
  - Styled the practical reply bubbles (`.chat-bubble-reply`) to use a subtle lavender background, smooth hover transitions (`translateY(-2px)`), and a distinct focus layout.
- **`background.js`**:
  - Combined the spring-based mouse gravitational attraction with sinusoidal micro-oscillations (`driftRadius = 12px`, `driftSpeed = 0.008`) for ambient stars (`life === Infinity`).
  - Allowed background stars to drift slowly in circular orbits when the mouse is away, returning smoothly to their drifting home anchors when mouse influence exits, creating a premium living universe background.
- **Build & Verification**:
  - Ran `npm run check:syntax` to verify no JavaScript syntax issues.
  - Ran `npm run build:static` to compile assets to `dist/public`.
  - Bumped version numbers in `index.html` to force browser cache refreshes.

## 2026-06-27 北极星 (Northstar) 整体文案优化与多语言合规性修复

为了解决“语言混乱、文字不通、太像 AI 或模板输出”的整体质量和 Creem 合规性要求，我们实施了以下修改并成功通过了全部验证：

- **修复关系分析 locale 缺失**：
  - 修改了 [app.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/app.js) 的 `runAnalysis` 函数（L7208），在 `payload` 构造中加入 `locale: currentLocale()`。
  - 这保证了在英文模式（`?lang=en`）下调用关系分析接口时，后端能感知并生成纯英文版本的 AI 情感阶段分析报告。
- **专业术语与翻译矫正**：
  - 针对 `locales/en.js` 存在的直译和机翻痕迹，我们在 [generate-locale-catalog.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/scripts/generate-locale-catalog.js) 的 `manualTranslations` 字典中加入了专业的强制对照翻译。
  - 精准纠正了“八字 (BaZi)”、“双人合盘 (Synastry)”、“相位 (Aspects)”、“颂钵 (Singing bowl)”、“手碟 (Handpan)”等命理与声疗术语。
- **法律与售后政策页面去技术化/去模板化**：
  - 修改了 [support.html](file:///Users/fantasy/Desktop/workspace/project001_northstar/support.html)、[privacy.html](file:///Users/fantasy/Desktop/workspace/project001_northstar/privacy.html)、[refund.html](file:///Users/fantasy/Desktop/workspace/project001_northstar/refund.html) 和 [terms.html](file:///Users/fantasy/Desktop/workspace/project001_northstar/terms.html) 的文案。
  - 移除了“签名回调”、“限流”、“抓取控制”等令人费解的技术黑话，用温和、自然且清晰的语言进行了重构，极大地削弱了 AI 模板感。
  - 在 `manualTranslations` 中同步补全了四个 HTML 修改后句子的精密翻译，防止由于页面文案更改导致字典匹配失败。
  - 客服页面中包含可用的真实服务邮箱 `tasyfan264@gmail.com`，格式清晰。
- **验证与终验结论**：
  - 本地执行 `npm run build:static` 同步修改并运行 `node scripts/generate-locale-catalog.js` 生成全新 `locales/en.js`（共 2343 条翻译）。
  - 运行 `npm run check:syntax` 和 `npm run test:i18n-runtime`，14 项前端及语言切换运行时测试全部通过。
  - 编写并运行了后端 API 集成测试 `scratch/test_relationship_api_i18n.js`，证实接收 `locale=en` 参数时后端返回内容和阶段评定均为纯英文。
  - 运行部署构建 `npm run build:deploy` 成功输出前后台分发包。
  - 执行 `npm run check:launch:production` 进行了 38 项严格的 launch gate 终验（包含 HTTP 响应状态、安全头策略、Robots/Sitemap 连通性、Stripe 付款接口就绪等），全部顺利 PASS。

## 2026-06-27 双鱼座 ♓ 星座图案弧线凹陷方向修正

- **修正双鱼座弧线方向**：
  - 修正了 [background.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/background.js) 中 `Pisces` 分支（L232-248）的二次贝塞尔曲线绘制坐标，将原本向外鼓起的弧线纠正为向内凹陷的 `)(` 结构，完美契合主流双鱼座占星符号 `♓` 的图形特征。
  - 通过调整控制点横坐标，使左半圆弧向内（右）侧凹陷，右半圆弧向内（左）侧凹陷，中央横梁保持水平穿插。
- **验证与测试**：
  - 运行 `npm run check:launch:production` 38项门禁全绿通过。

## 2026-06-27 粒子图腾沉浸观星/纯享模式 (Zen Mode)

- **实现阅读态退避**：
  - 修改了 [background.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/background.js) 中的 `setPattern` 逻辑，在有凝聚图腾状态下将默认 3D WebGL Canvas 的透明度降低至 `0.45`。这样粒子作为舒适温和的星空背景存在，彻底解决了背景过于耀眼遮挡报告前方文字的冲突。
- **构建沉浸纯享图腾交互**：
  - 在 [app.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/app.js) 的根组件 `AppShell` 中引入了全局状态 `store.isPatternActive` 和 `store.isImmersive`。
  - 在 MBTI、八字命理、本命星盘、双人合盘结果页挂载粒子凝聚时，自动联动维护 `store.isPatternActive` 状态。
  - 在 `AppShell` 模板中集成了“✦ 纯享图腾”浮动胶囊控制按钮，点击可将 `store.isImmersive` 置为 `true`。
  - 在 [styles.css](file:///Users/fantasy/Desktop/workspace/project001_northstar/styles.css) 中新增 `.immersive-active` 过渡类。激活后，报告文本和卡片淡出至 `0.02` 并禁用指针事件，背景变全黑，将 3D Canvas 透明度拉满至 `1.0` 并增强亮度，同时提升 `z-index` 以允许用户在全屏幕范围内与 16384 个高致密发光粒子发生引力波鼠标漂移互动。
  - 沉浸模式下，页面底部显示“✦ 返回报告”按钮，同时挂载全屏透明遮罩层 `div.immersive-overlay` 允许用户点击屏幕任意空白处退回报告。
- **多语言字典补全**：
  - 在 [generate-locale-catalog.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/scripts/generate-locale-catalog.js) 字典中补全了 `"✦ 纯享图腾"` ("✦ Immersive View") 和 `"✦ 返回报告"` ("✦ Back to Report") 的双语翻译映射，执行生成器，2350 条词汇字典全部同步。
- **终验通过**：
  - 运行 `npm run check:launch:production`，38项 Launch Gate 指标全部顺利 PASS。

## 2026-06-27 粒子大小与背景亮度优化

- **放大粒子物理尺寸与发光感**：
  - 在 [antigravity-engine.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/antigravity-engine.js) 渲染配置 `CONFIG` (L631) 中，将粒子缩放比例由移动端 `0.58` / PC端 `0.48` 提升至移动端 `0.88` / PC端 `0.72`。
  - 在 WebGL 顶点着色器 (L534) 中修改了 `gl_PointSize` 渲染计算式，将粒子主缩放因子由 `7.0` 增加为 `9.5`，使每个微粒的发光物理直径显著加大，画面粒子感更为致密强劲。
  - 在 WebGL 着色器材质 uniform (L819) 中将极限不透明度 `uAlpha` 由 `0.8` 调高为 `1.0`，使发光能量释放至最饱满态。
- **扩大凝聚图腾整体尺寸**：
  - 在 3D 引擎 (L977-980) 中修改了屏幕视口极限边界计算比例：
    - 垂直高度极限从 `0.65`（65% 可视高）提升至 `0.76`（76% 可视高）；
    - 水平宽度极限从 `0.70`（70% 可用宽）提升至 `0.86`（86% 可用宽）；
    - 将基准半径除数由 `1.575` 调低至 `1.22`。
  - 调整后，星盘、MBTI字母等所有图腾图形的物理覆盖范围**整体放大了约 30%**，在保持安全视口边界防溢出的同时，显得极为饱满壮观。
- **提升背景默认可见度**：
  - 修改了 [background.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/background.js)，将常规凝聚态下的 3D Canvas 透明度由 `0.45` 适度提亮至 **`0.62`**。
  - 配合大幅放大的发光粒子，使得图腾在报告卡片背景后方呈现出清晰、醒目的轮廓与闪烁感，不再黯淡，同时丝毫不影响前台文字的阅读。
- **终验校验**：
  - 38项 Launch Gate 生产大门门禁校验再次全绿 PASS。

## 2026-06-27 粒子图腾“点击引力冲击波 (Shockwave)”交互特效实现

- **GPU 物理与着色器逻辑扩充**：
  - 在 [antigravity-engine.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/antigravity-engine.js) 中，为 Simulation Shader、Render Vertex Shader 以及 Render Fragment Shader 统一增加了 `uPulsePos`、`uPulseRadius` 和 `uPulseStrength` 等 uniform 参量。
  - 在 Simulation 阶段，计算粒子距离脉冲点击点的距离，在扩散的脉冲波阵面（宽度 `0.28`）上施加一个向外的推斥力，将该物理偏置叠加在 `finalPos` 上。
  - 在 Vertex Shader 阶段，冲击波扫过的微粒会额外增加 `16.0 * uPixelRatio` 的物理 PointSize 物理发光直径。
  - 在 Fragment Shader 阶段，将波阵面上的粒子颜色与纯白色 (`vec3(1.0)`) 强力混合，并将透明度 `a` 拔高 `0.4`，使传播阵面亮成一道璀璨的流光斑。
- **全局事件监听与智能过滤**：
  - 在 WebGL 引擎闭包的 `overlay`（即 `window`）上挂载了 `pointerdown` 点击事件处理器。
  - 完美集成了交互元素过滤机制：如果用户点击的是 `BUTTON`、`INPUT`、`A` 等可交互的卡片和按钮，或者报告文字富文本框、支付弹窗等，会自动拦截不予触发，保障基本操作体验不受影响。
  - 当点击在页面大背景或非交互的空白处时，自动捕捉点击视口位置，并将其换算为 3D 相机世界坐标，启动为期 `1.2` 秒的脉冲平滑膨胀衰减动效（冲击波向外以每秒 `4.2` 世界单位扩展，强度从 `1.0` 线性归零）。
- **终验校验**：
  - 38项 Launch Gate 生产门禁全通过。

## 2026-06-27 解决 cameraW 闭包变量作用域错误并成功构建部署包

- **修复 ReferenceError 变量未定义导致交互挂死的故障**：
  - 在 [antigravity-engine.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/antigravity-engine.js) 中，原本 `cameraW` 和 `cameraH` 变量是声明在 `loop()` 循环体内的局部 `const`。
  - 这导致在较早定义的 `pointerdown` 全局监听器被触发计算点击世界坐标时，因为作用域限制直接抛出 `ReferenceError: cameraW is not defined` 异常崩溃，从而使得整个 WebGL 渲染循环挂起死锁，交互失去响应。
  - **修复方案**：将 `cameraW` 和 `cameraH` 提取声明为 `initWebGLAntigravityParticles` 闭包作用域顶层的共享 `let` 变量，并在 `loop()` 内去除 `const` 重新赋值，使其能被闭包中的所有异步事件处理器直接读取并保持最新。
- **构建部署验证**：
  - 重新运行 `npm run check:syntax` 和 `npm run build:static` 确保语法全部通过。
  - 运行 `npm run build:deploy` 成功生成了部署包，包括静态前端资源发布包 `dist/public` 与服务器发布包 `dist/server-bundle`。
  - 38项 Launch Gate 生产门禁测试全部 PASS。

## 2026-06-27 撤销“点击引力冲击波”交互特效，生成最终生产包

- **撤销点击引力冲击波特效**：
  - 在 [antigravity-engine.js](file:///Users/fantasy/Desktop/workspace/project001_northstar/antigravity-engine.js) 中，移除了 Simulation / Render Shaders 里所有的 `uPulsePos`、`uPulseRadius`、`uPulseStrength` 相关的 uniform 声明，并去掉了粒子排挤偏移、高亮白光和发光尺寸放大的着色器代码。
  - 在 `simMaterial` 与 `renderMaterial` 的初始化 uniforms 列表中剔除了这三个 pulse uniforms。
  - 在渲染 `loop()` 中去除了对这些 uniforms 的每帧计算及更新。
  - 移除了注册在 window `overlay` 上的 `pointerdown` 交互过滤监听器，并删除了全局暴露的 `triggerPulse` 接口。
  - 重新将 `cameraH` 与 `cameraW` 恢复为 `loop()` 内的局部 `const` 以保持变量作用域的最佳洁净。
- **最终生产包构建**：
  - 运行 `npm run build:deploy` 顺利输出无该点击特效的最终静态资源包（`dist/public`）和服务器部署包（`dist/server-bundle`）。
  - 38项 Launch Gate 生产测试全部绿牌通过。
