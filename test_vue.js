const { createSSRApp } = require('vue');
const fs = require('fs');

global.window = { onerror: null, LOCATIONS_DATA: [] };
global.document = {
  createElement: () => ({}),
  documentElement: { scrollTop: 0, scrollHeight: 0 }
};
global.IntersectionObserver = class { observe() {} disconnect() {} };
global.console = console;
global.Vue = require('vue');
global.VueRouter = { 
  createRouter: () => ({ push: () => {} }), 
  createWebHashHistory: () => ({}),
  useRouter: () => ({ push: () => {} }),
  useRoute: () => ({})
};
global.LOCATIONS_DATA = [];

let appJs = fs.readFileSync('/Users/fantasy/Documents/Codex/2026-06-01/cli/outputs/personal-site/app.js', 'utf-8');
appJs = appJs.replace("app.mount('#app')", "global.AstrologyTest = AstrologyTest;");

eval(appJs);

const app = createSSRApp(global.AstrologyTest);
const { renderToString } = require('vue/server-renderer');

renderToString(app).then(html => {
  console.log("SUCCESS RENDER");
}).catch(err => {
  console.error("RENDER ERROR:", err);
});
