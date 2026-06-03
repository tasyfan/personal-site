const Astronomy = require('./astronomy.browser.js');
console.log("Astronomy Object:", Object.keys(Astronomy).slice(0, 10));

const dObj = new Date(`2000-03-08T12:00:00+08:00`);
const astroTime = Astronomy.MakeTime(dObj);
console.log("Sun Longitude:", Astronomy.EclipticLongitude(Astronomy.Body.Sun, astroTime));
