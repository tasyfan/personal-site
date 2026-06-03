const fs = require('fs');
const jsCode = fs.readFileSync('astronomy.browser.js', 'utf8');

// Simulate a browser environment
const fakeWindow = {};
const fakeContext = { window: fakeWindow };

// Evaluate the script
try {
    const fn = new Function('window', 'module', 'exports', 'define', 'global', 'self', jsCode);
    fn(fakeWindow, undefined, undefined, undefined, undefined, fakeWindow);
    console.log("Exported keys in fakeWindow:", Object.keys(fakeWindow));
    
    if (fakeWindow.Astronomy) {
        const time = fakeWindow.Astronomy.MakeTime(new Date("2000-03-08T12:00:00+08:00"));
        const lon = fakeWindow.Astronomy.EclipticLongitude(fakeWindow.Astronomy.Body.Sun, time);
        console.log("Sun Longitude for 2000-03-08:", lon);
        console.log("Zodiac index:", Math.floor(lon / 30) % 12);
    } else {
        console.log("fakeWindow.Astronomy is undefined!");
    }
} catch (e) {
    console.error("Evaluation error:", e);
}
