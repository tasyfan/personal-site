# AI-to-AI Handover Document: Northstar (北极星命运观测站)

## 1. Project Overview
**Name:** Northstar (北极星命运观测站)
**Type:** SPA Web Application (Single Page Application)
**Target:** A psychological and metaphysical testing platform featuring Tarot, MBTI, Astrology, Bazi, Human Design, etc.
**Key Aesthetic:** "Shadow Work" / Cyber-mysticism. The tone of the test results is uniquely sharp, piercing, and "poison-tongued" (毒舌), avoiding generic positive horoscopes in favor of deep psychological dissection.

## 2. Tech Stack
- **Framework:** Vue 3 (Global script injection, `createSSRApp` / `createApp` via CDN). Vue Router 4 (Hash history).
- **Styling:** Vanilla CSS (`styles.css`). No Tailwind or CSS processors.
- **Build Tool:** None. Pure static files running directly in the browser. 
- **Deployment:** Nginx static hosting. Cache busting is managed manually via querystring versioning (e.g., `app.js?v=141`).

## 3. Architecture & File Structure
- `index.html`: The main entry point. It loads all external libraries (Vue, VueRouter, html2canvas), the data dictionaries (`content/*.js`), and finally `app.js`.
- `app.js`: The monolithic Vue application file (~4000 lines). It contains all Vue components (Home, TarotTest, AstrologyTest, etc.), global directives (`v-reveal`), and the router configuration.
- `styles.css`: Contains all styles, animations (`v-reveal` transitions), and typewriter text formatting (`.deep-text { white-space: pre-wrap !important; }`).
- `background.js`: Handles the interactive canvas background (stars, nebulae, trailing cursor effects).
- `content/*.js`: Contains the raw, hardcoded JSON data and "poison-tongue" content for the tests. These define `window.*_DATA` variables.

## 4. Critical Engineering Quirks (Important for Codex / ChatGPT 5.5)
If you are taking over this codebase, you MUST be aware of the following quirks to avoid breaking the application:

1. **Data Injection via setTimeout:**
   - In `app.js` (around line 19-30), there is a `setTimeout` block that aggressively merges the `window.*_DATA` (from `content/*.js`) into the legacy `let` dictionary variables (like `TAROT_CARDS`, `MBTI_PROFILES`, `ZODIAC_TRAITS`). 
   - **Warning:** Do NOT change these `let` variables to `const` or the injection will throw `TypeError: Assignment to constant variable`.
   - **Warning:** `ZODIAC_TRAITS` is mapped from `ASTROLOGY_DATA.zodiacs` using a string-matching algorithm. `ZODIAC_KEYS` array must exist for `AstrologyTest` to map planets correctly.

2. **LOCATIONS_DATA Fallback:**
   - The Geography data was removed from `app.js` to save space and is now injected dynamically via `index.html` (`window.LOCATIONS_DATA`). 
   - `AstrologyTest` safely falls back: `const data = typeof LOCATIONS_DATA !== 'undefined' ? LOCATIONS_DATA : (window.LOCATIONS_DATA || []);`

3. **Typewriter Effect:**
   - Test results use a character-by-character typewriter effect (`setInterval`) that outputs into a `ref` (`displayedDeepText`) bound to `v-html`. 
   - Because of `v-html`, `\n` characters would normally be ignored by the browser. To fix this, the container uses `white-space: pre-wrap !important;`. If you modify the UI, ensure this CSS rule is maintained, otherwise the deep reports will render as an unreadable wall of text.

4. **Component Registration:**
   - Always ensure global-like components (like `PaymentModal`) are explicitly registered in the local component's `components: { ... }` block (e.g., `components: { PaymentModal }`), otherwise Vue 3 will silently fail to render them when the user clicks a button to open them.

## 5. Next Steps / Current State
The project currently mocks backend connectivity and payment logic. 
- All results are currently pulled from the static `content/` folder.
- If the goal is to fully connect this to a dynamic API backend to generate readings in real-time, you should rip out the `setTimeout` injection logic in `app.js`, and replace `handlePaymentSuccess` functions in each test component to make an actual `fetch()` request to your API, passing the user's `formData`.
