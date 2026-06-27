const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert/strict')
const { JSDOM } = require('jsdom')

const root = path.resolve(__dirname, '..')
const englishCatalog = fs.readFileSync(path.join(root, 'locales', 'en.js'), 'utf8')
const i18nSource = fs.readFileSync(path.join(root, 'i18n.js'), 'utf8')

function createPage(url = 'https://northstar.example/?lang=en') {
  const dom = new JSDOM(`<!doctype html>
    <html lang="zh-CN">
      <head>
        <title>北极星</title>
        <meta name="description" content="中文说明">
        <meta property="og:title" content="中文标题">
        <meta property="og:description" content="中文说明">
        <meta property="og:url" content="https://northstar.fantasy-games.org/">
        <meta property="og:locale" content="zh_CN">
        <meta name="twitter:title" content="中文标题">
        <meta name="twitter:description" content="中文说明">
        <link rel="canonical" href="https://northstar.fantasy-games.org/">
      </head>
      <body>
        <header>
          <a id="home" href="./">首页</a>
          <a id="privacy" href="./privacy.html">隐私政策</a>
          <label>
            <span>语言</span>
            <select class="site-language-select" aria-label="语言">
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </label>
        </header>
        <main>
          <h1>有些问题，不一定马上有答案。</h1>
          <input placeholder="请输入订单号。">
          <button title="返回首页">恢复购买</button>
        </main>
      </body>
    </html>`, {
    url,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  })

  dom.window.eval(englishCatalog)
  dom.window.eval(i18nSource)
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'))
  return dom
}

function visibleState(window) {
  const document = window.document
  return {
    locale: window.NorthstarI18n.getLocale(),
    htmlLang: document.documentElement.lang,
    title: document.title,
    body: document.body.textContent.replace(/\s+/g, ' ').trim(),
    placeholder: document.querySelector('input').getAttribute('placeholder'),
    buttonTitle: document.querySelector('button').getAttribute('title'),
    privacyHref: document.querySelector('#privacy').getAttribute('href'),
    selectedLocale: document.querySelector('.site-language-select').value,
    storedLocale: window.localStorage.getItem('northstar_locale'),
    query: window.location.search,
    canonical: document.querySelector('link[rel="canonical"]').href,
    ogLocale: document.querySelector('meta[property="og:locale"]').content,
    ogTitle: document.querySelector('meta[property="og:title"]').content
  }
}

test('English can switch back to complete Simplified Chinese state', () => {
  const dom = createPage()
  const { window } = dom

  const english = visibleState(window)
  assert.equal(english.locale, 'en')
  assert.equal(english.htmlLang, 'en')
  assert.match(english.body, /Home/)
  assert.match(english.body, /Privacy Policy/)
  assert.doesNotMatch(english.body, /首页|隐私政策|恢复购买/)
  assert.equal(english.placeholder, 'Enter your order ID.')
  assert.equal(english.buttonTitle, 'Back to Home')
  assert.match(english.privacyHref, /[?&]lang=en/)
  assert.equal(english.canonical, 'https://northstar.fantasy-games.org/?lang=en')
  assert.equal(english.ogLocale, 'en_US')
  assert.match(english.ogTitle, /^Northstar/)

  window.NorthstarI18n.setLocale('zh-CN')
  const chinese = visibleState(window)

  assert.equal(chinese.locale, 'zh-CN')
  assert.equal(chinese.htmlLang, 'zh-CN')
  assert.match(chinese.body, /首页/)
  assert.match(chinese.body, /隐私政策/)
  assert.match(chinese.body, /恢复购买/)
  assert.doesNotMatch(chinese.body, /Privacy Policy|Restore Purchase/)
  assert.equal(chinese.placeholder, '请输入订单号。')
  assert.equal(chinese.buttonTitle, '返回首页')
  assert.doesNotMatch(chinese.privacyHref, /[?&]lang=/)
  assert.equal(chinese.storedLocale, 'zh-CN')
  assert.equal(chinese.query, '')
  assert.equal(chinese.canonical, 'https://northstar.fantasy-games.org/')
  assert.equal(chinese.ogLocale, 'zh_CN')
  assert.match(chinese.ogTitle, /^北极星/)

  dom.window.close()
})

test('Chinese can switch to English and back repeatedly without mixed text', () => {
  const dom = createPage('https://northstar.example/')
  const { window } = dom

  for (let iteration = 0; iteration < 3; iteration += 1) {
    window.NorthstarI18n.setLocale('en')
    const english = visibleState(window)
    assert.equal(english.locale, 'en')
    assert.doesNotMatch(english.body, /首页|隐私政策|恢复购买/)

    window.NorthstarI18n.setLocale('zh-CN')
    const chinese = visibleState(window)
    assert.equal(chinese.locale, 'zh-CN')
    assert.match(chinese.body, /首页/)
    assert.doesNotMatch(chinese.body, /Privacy Policy|Restore Purchase/)
  }

  dom.window.close()
})

test('newly inserted content follows the active locale and remains reversible', async () => {
  const dom = createPage()
  const { window } = dom
  const paragraph = window.document.createElement('p')
  paragraph.textContent = '恢复购买'
  window.document.querySelector('main').appendChild(paragraph)

  await new Promise(resolve => window.setTimeout(resolve, 0))
  assert.equal(paragraph.textContent, 'Restore Purchase')

  window.NorthstarI18n.setLocale('zh-CN')
  assert.equal(paragraph.textContent, '恢复购买')

  dom.window.close()
})
