// Rebuilds sitemap.xml from the public pages + issues/issues.json.
// Run after publishing a new issue:  node scripts/sitemap.js
const fs = require('fs');
const path = require('path');

const BASE = 'https://thetradingpaper.pages.dev';
const root = path.join(__dirname, '..');
const today = new Date().toISOString().slice(0, 10);

const pages = [
  { loc: '/', priority: '1.0', changefreq: 'daily', lastmod: today },
  { loc: '/meportfolio/', priority: '0.7', changefreq: 'daily', lastmod: today },
  { loc: '/learning.html', priority: '0.7', changefreq: 'weekly' },
  { loc: '/dividends.html', priority: '0.6', changefreq: 'weekly' },
  { loc: '/ai.html', priority: '0.8', changefreq: 'monthly' },
  { loc: '/alerts.html', priority: '0.7', changefreq: 'weekly', lastmod: today },
];

const issues = JSON.parse(fs.readFileSync(path.join(root, 'issues', 'issues.json'), 'utf8'));
issues.forEach((it) => {
  pages.push({ loc: '/' + it.file.replace(/^\//, ''), priority: '0.6', changefreq: 'yearly', lastmod: it.date });
});

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + pages.map((p) => '  <url><loc>' + esc(BASE + p.loc) + '</loc>'
    + (p.lastmod ? '<lastmod>' + p.lastmod + '</lastmod>' : '')
    + '<changefreq>' + p.changefreq + '</changefreq><priority>' + p.priority + '</priority></url>').join('\n')
  + '\n</urlset>\n';

fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
console.log('sitemap.xml: ' + pages.length + ' URLs');
