const { generateResult } = require('./server/core/engine');

try {
    const bazi = generateResult('bazi', { date: '1990-05-15', time: '14:30' });
    console.log('Bazi:', bazi);
    
    const astro = generateResult('astrology', { date: '1990-05-15', time: '14:30' });
    console.log('Astro:', astro);
} catch (e) {
    console.error(e);
}
