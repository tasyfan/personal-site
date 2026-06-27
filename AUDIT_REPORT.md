# Northstar (北极星命运观测站) 项目专业审计报告

本审计报告由 AI 项目审核员针对 `project001_northstar` 代码库（包括前端页面与后端 Node.js 服务）进行全方位安全、逻辑、架构及用户体验审查后整理生成。

报告共分为：**核心缺陷（致命漏洞）**、**安全隐患**、**性能与体验优化** 以及 **架构与未来演进建议** 四大部分。

> 状态更新（2026-06-20）：本文件保留的是整改前审计快照，不代表当前生产状态。付费正文公开泄露、本地存储作为唯一付费凭证、试用商品无有效交付、管理页公开静态发布、支付退款/争议回调缺失、后台搜索过滤、限流、真实星盘计算、跨设备恢复、客服工单、商业漏斗、健康检查和每日数据库备份等问题均已在后续版本中整改并完成线上验证。当前权威说明请以 `SECURITY.md`、`DEPLOYMENT.md`、`PAYMENT_SETUP.md` 及自动化测试结果为准。

---

## 一、 核心缺陷与致命漏洞（必须修改）

### 1. OpenAI 降级通道完全不可用（接口路径与数据格式错误）
在 [relationship.js (L211-237)](file:///Users/fantasy/Desktop/codex-workspace/project001_northstar/server/routes/relationship.js#L211-L237) 中，OpenAI 的调用逻辑存在多处严重代码编写错误：
- **请求地址错误**：代码请求的是 `https://api.openai.com/v1/responses`（此接口在 OpenAI 官方并不存在），应当为 `https://api.openai.com/v1/chat/completions`。
- **请求负载格式错误**：代码发送的格式为 `{ model: OPENAI_MODEL, input: buildPrompt(...) }`，而 OpenAI 聊天模型（Chat Completion）的官方格式应为 `{ model, messages: [{ role: "user", content: prompt }] }`。此外，`gpt-5.5` 模型为虚构模型，无法通过认证。
- **响应体解析错误**：代码尝试读取 `data.output_text` 或 `data.output`，而 OpenAI 官方返回结构为 `data.choices[0].message.content`。
- **影响**：一旦 Gemini API Key 失效，降级到 OpenAI 的逻辑将抛出 400/404 错误并彻底瘫痪，直接走入本地粗糙 fallback 逻辑。

### 2. 页面刷新导致用户测试数据丢失与报告报错（前端状态未同步）
当前系统虽然在后端设计了 `/api/tests/result/:orderId` 接口用来获取已解锁的报告数据，但前端 Vue 应用在 `app.js` 中**完全没有调用该接口的逻辑**（`fetchResult` 仅在 store 中被定义，未在任何组件内被调用）：
- **逻辑缺陷**：当用户支付成功后，解锁状态保存在浏览器的 `localStorage` 中。一旦用户刷新页面，Tarot/MBTI 等组件由于重新挂载，其内部的 `cards.value`、`question.value` 或 `formData.value` 等临时表单状态全部被清空（变为 `[]` 或 `null`）。
- **严重后果**：
  - **塔罗牌测试**：刷新后 `hasPaid` 依然为真，前端立即触发 `handlePaymentSuccess()`。但因为 `cards.value` 为空，生成的 `baseDeepReport` 和传给后端 AI 的 `resultSummary` 均变成空字符串（如 `“基于您的问题：「」以及您抽到的三张牌（）...”`），直接导致页面报错或渲染出一份毫无意义的空白 AI 报告。
  - **八字测试**：刷新后 `baziResult.value` 被置空。由于存在 `if (hasPaid.value && baziResult.value)` 的判断，用户虽然支付了，但页面刷新后却会被重新带回输入表单阶段，强迫用户重新输入信息并等待 4 秒。

### 3. MBTI 核心算法极其敷衍（伪哈希碰撞）
在 [engine.js (L52-61)](file:///Users/fantasy/Desktop/codex-workspace/project001_northstar/server/core/engine.js#L52-L61) 中，MBTI 的测试结果计算公式为：
```javascript
const hash = payload.answers.join('').length % 16;
return { type: types[hash] };
```
- **逻辑缺陷**：MBTI 的测试题通常是单选题。如果用户完成了固定 10 道或 12 道题，不论其每道题选 A 还是选 B，只要选项字符串长度相同（如每次返回 `"A"` 或 `"B"`，其长度都为 1），最终 `payload.answers.join('').length` 将永远是一个固定值（例如 10）。
- **影响**：这意味着**所有答完题的用户，不论选项如何，算出的 MBTI 结果将是完全相同的一个人格类型**（例如第 10 个索引对应的 `ESTJ`）。这使得 MBTI测试完全沦为摆设，失去产品可信度。

### 4. 占星月亮星座计算为纯随机（资源浪费）
- **逻辑缺陷**：在 [engine.js (L39)](file:///Users/fantasy/Desktop/codex-workspace/project001_northstar/server/core/engine.js#L39) 中，月亮星座是通过一个基于出生年月日时分的简单取模算法随机哈希生成的：
  ```javascript
  const moonIndex = Math.abs((year * 13 + month * 17 + day * 19 + hour + minute) % 12);
  ```
  这根本不是真正的占星算法。然而，页面在前端 `index.html` 中引入了 420KB 的 [astronomy.browser.js](file:///Users/fantasy/Desktop/codex-workspace/project001_northstar/astronomy.browser.js)，但项目实际上从未使用该引擎进行真正的星历表计算，造成无谓的性能负担和假算法穿帮风险。

### 5. 官方微信/支付宝付款码回退至静态收款码漏洞
在 [app.js (L1101-1142)](file:///Users/fantasy/Desktop/codex-workspace/project001_northstar/app.js#L1101-L1142) 中：
- **逻辑缺陷**：若用户带着从 `/calculate` 接口拿到的 `localOrderId` 开启支付弹窗，`createPaymentIntent` 会因为 `if (localOrderId.value) return localOrderId.value` 逻辑直接返回，**不再请求后端 `/api/payment/create-intent`**。
- **影响**：由于未调用 `/create-intent`，后端无法针对本次支付生成官方的动态微信/支付宝支付二维码（`gatewayQrImage` 始终为空）。弹窗会错误地降级展示前端硬编码的静态收款码 `wechat_qr.jpg` / `alipay_qr.jpg`。用户扫静态码付款后，系统根本无法通过支付 Webhook 收到通知，用户屏幕会永久卡在“等待确认”状态，转化率和用户体验将遭受毁灭性打击。

### 6. 管理后台订单搜索与过滤逻辑缺陷
在 [payment.js (L683-690)](file:///Users/fantasy/Desktop/codex-workspace/project001_northstar/server/routes/payment.js#L683-L690) 中：
```javascript
const rows = db.prepare('SELECT ... FROM orders ORDER BY created_at DESC LIMIT ?').all(limit);
const orders = rows.map((row) => ({ ...row, payload: parsePayload(row) }))
  .filter((order) => !status || order.status === status)
  ...
```
- **逻辑缺陷**：系统先从数据库中通过 `LIMIT 100` 获取了最新的 100 条订单，然后才在 JavaScript 内存中对这 100 条记录进行状态、渠道和关键字过滤。
- **影响**：如果系统中总共有 500 条订单，而符合搜索条件（例如某个订单号）的订单处于较早的历史记录中，由于它不在最新的 100 条内，管理员将**永远无法在后台搜索到此订单**。正确的做法应在 SQL 查询层面执行 `WHERE` 过滤和分页。

---

## 二、 安全隐患（Security Vulnerabilities）

### 1. 管理后台页面完全公开暴露
- **安全漏洞**：[admin.html](file:///Users/fantasy/Desktop/codex-workspace/project001_northstar/admin.html) 存放在静态资源根目录中，并被同步打包发布至 `dist/public`。
- **隐患**：这意味着任何人都可以通过浏览器直接访问 `https://domain.com/admin.html` 打开管理后台。虽然 API 接口有 `ADMIN_TOKEN` 校验，但将未授权的 UI 暴露给公众，极大增加了接口被嗅探、爆破和针对性漏洞利用的风险。

### 2. 默认 CORS 配置过于宽松
在 [index.js (L27-34)](file:///Users/fantasy/Desktop/codex-workspace/project001_northstar/server/index.js#L27-L34) 中：
```javascript
if (!origin || NODE_ENV !== 'production' || allowedOrigins.length === 0 || allowedOrigins.includes(origin))
```
- **安全漏洞**：如果环境变量 `CORS_ORIGINS` 未设置，`allowedOrigins.length === 0` 将成立。在生产环境（`production`）下，这会导致系统**允许来自任何域名的跨域请求**。
- **建议**：生产环境下若未显式配置允许跨域的域名列表，应默认拒绝或仅允许同源（Same-Origin）请求。

### 3. 缺乏速率限制（Rate Limiting）防御机制
- **安全漏洞**：无论是前端计算 `/calculate` 还是 AI 分析 `/ai-analysis`，系统均未引入任何限流中间件（例如 `express-rate-limit`）。
- **隐患**：攻击者可通过编写简单的并发脚本，恶意调用 `/calculate` 不断往 SQLite 数据库中插入垃圾订单和计算结果，或反复爆刷 `/ai-analysis` 消耗高昂的 Gemini API 额度，导致数据库磁盘耗尽或 API 账户因欠费封禁（DoS 攻击）。

---

## 三、 性能与用户体验优化（建议优化）

### 1. Vue 代码结构极其臃肿（单文件 app.js 达 5100 余行）
- **维护瓶颈**：当前的前端架构并没有使用 Vite/Webpack 等构建工具，而是将所有的 Vue 组件（Home、Tarot、Astrology、Bazi 等 10 多个大型组件）、路由配置、音乐合成器、全局指令等硬编码在单一的 `app.js` 中。
- **后果**：代码极难维护，多人协作极易产生冲突，单次加载耗时较长，无法利用现代打包工具的 Tree Shaking 和 Code Splitting。

### 2. 简陋的全局错误捕获机制破坏信任度
在 [index.html (L43-47)](file:///Users/fantasy/Desktop/codex-workspace/project001_northstar/index.html#L43-L47) 中，直接通过 `window.onerror` 向页面 body 强行追加纯文本的红色报错 Banner。
- **体验隐患**：这本是临时的调试手段。在生产环境中，一旦由于浏览器插件或无关紧要的第三方统计脚本报错，页面顶部就会出现刺眼的 "Error: ..." 红色提示，极其不专业，会让付费用户产生强烈的系统不安全感。

### 3. 打字机特效（Typewriter）的性能与交互缺陷
在 `app.js` 的各个测试组件中，打字机效果使用 `setInterval` 频繁拼接 `displayedDeepText.value`，且在 Tarot 等测试中每次追加字符都会强制执行：
```javascript
const container = document.documentElement
container.scrollTop = container.scrollHeight
```
- **体验缺陷**：这会剥夺用户的滚动自由度。打字机运行时，用户如果尝试向上滚动屏幕阅读已经生成的前文，视口会被强行拉回底部。
- **性能隐患**：频繁的 DOM 读写操作（`v-html` 频繁解析渲染）会导致手机端 CPU 负载剧增，产生明显卡顿。建议改用 `requestAnimationFrame` 优化，并提供“跳过打字，直接显示全文”的按钮。

---

## 四、 架构演进与未来建议

1. **前后端分离与 Admin 隔离**
   - 应将 `admin.html` 从公共的 `dist/public` 目录中移除，放置在单独的管理服务或通过后端路由进行权限拦截（例如仅当 Cookie 中包含合法的 admin session 时才发送 `admin.html` 静态文件）。
2. **付费测试报告保护机制升级**
   - 正如 `SECURITY.md` 所言，当前系统将完整的深度静态报告随 `content/*.js` 直接下发到了前端。虽然前端通过 `hasPaid` 加了磨砂玻璃滤镜遮挡，但任何懂一点浏览器控制台（F12）的用户都可以直接在 Elements 面板中移除 CSS 滤镜，无需付费便可阅读完整的静态报告。
   - **演进路线**：应将静态报告的文本内容移至后端存储。仅在用户完成支付后，通过 `/api/tests/result/:orderId` 接口安全下发。
3. **真实占星与八字引擎接入**
   - 移除无用的 420KB `astronomy.browser.js` 占星文件。
   - 若要提供真实的月相与本命盘解析，应使用后端的 `lunar-javascript` 进行八字推算，并引入真正的占星天文历（Swiss Ephemeris 或 Node.js 对应的精简星历包）计算行星度数，替代目前纯靠伪哈希碰撞出的“假数据”。

---
*报告结束。本报告仅供项目优化决策参考。*
