// Smoke test: open TTLO with the internet blocked, build the PT0525 sample plan, check the plan,
// check that no trailer part or cargo model overlaps, build the PDF and download a file.
// Run: npm test            (tests the files in ./public)
//      TTLO_URL=https://your-server/ npm test   (tests a deployed copy)
import { chromium } from 'playwright';
import { serve } from './serve.mjs';
const PORT = 8123, fail = [], ok = m => console.log('  ✓ ' + m), bad = m => { fail.push(m); console.log('  ✗ ' + m); };
const BASE = process.env.TTLO_URL || `http://localhost:${PORT}/`, host = new URL(BASE).hostname;
const srv = process.env.TTLO_URL ? null : await serve(PORT);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const external = []; const errors = [];
await page.route('**/*', r => { const u = new URL(r.request().url()); if (u.hostname === host || u.protocol === 'data:' || u.protocol === 'blob:') r.continue(); else { external.push(u.href); r.abort(); } });
page.on('pageerror', e => errors.push(e.message));
await page.addInitScript(() => { window.__holdRender = true; localStorage.clear(); });
await page.goto(BASE); await page.waitForFunction(() => window.__ttlo && window.__ttlo.TRUCKS, null, { timeout: 30000 });
console.log('TTLO smoke test');
await page.evaluate(() => window.__ttlo.showTab('project')); await page.click('#loadSample'); await page.click('#genBtn'); await page.waitForTimeout(1500);
const plan = await page.evaluate(() => { const t = window.__ttlo, all = t.TRUCKS.flatMap(x => x.placed);
  return { trucks: t.TRUCKS.length, lb: t.TRUCKS.filter(x => x.type === 'lb').length, tanks: all.filter(q => q.item.kind === 'tank').length, drums: all.filter(q => q.item.kind === 'drums').length, items: all.length, unplaced: t.state.unplaced.length,
    rollersWithTank: t.TRUCKS.filter(x => x.type === 'lb').every(x => x.placed.some(q => q.item.kind === 'tank') && x.placed.some(q => /roller/i.test(q.item.name))) }; });
plan.trucks === 15 ? ok('PT0525 sample: 15 trucks') : bad(`PT0525 sample: ${plan.trucks} trucks (expected 15)`);
plan.lb === 3 && plan.tanks === 3 && plan.rollersWithTank ? ok('3 Low Beds, each main unit with its rollers') : bad('main units / rollers not on their Low Beds');
plan.drums === 36 ? ok('36 oil drum pallets recognised') : bad(`${plan.drums} drum pallets (expected 36)`);
plan.items === 90 && plan.unplaced === 0 ? ok('all 90 packages planned') : bad(`${plan.items} planned, ${plan.unplaced} not planned`);
const geo = await page.evaluate(() => { const t = window.__ttlo, out = []; for (const x of t.TRUCKS) { t.selectTruck(x); const b = t.bedCheck(), c = t.cargoCheck(); if (b.hits.length || c.length) out.push(x.id); } return out; });
geo.length ? bad('overlaps on ' + geo.join(', ')) : ok('no trailer part or cargo model overlaps on any truck');
const pdf = await page.evaluate(async () => { const t = window.__ttlo; t.openPdf('complete'); await new Promise(r => setTimeout(r, 800)); const b = await t.buildPdfBlob(); return b.size; });
pdf > 100000 ? ok(`PDF built (${Math.round(pdf / 1024)} KB)`) : bad('PDF build failed');
await page.evaluate(() => { document.getElementById('pdfClose') && document.getElementById('pdfClose').click(); window.__ttlo.showTab('projects'); });
const dl = await Promise.all([page.waitForEvent('download', { timeout: 15000 }).catch(() => null), page.evaluate(() => document.getElementById('expBtn').click())]).then(r => r[0]);
dl && /\.ttlo\.json$/.test(dl.suggestedFilename()) ? ok(`browser download works (${dl.suggestedFilename()})`) : bad('project file download did not start');
external.length ? bad('requests to the internet: ' + [...new Set(external)].slice(0, 3).join(', ')) : ok('works with the internet blocked');
errors.length ? bad('page errors: ' + errors.join(' | ')) : ok('no page errors');
await browser.close(); if (srv) srv.close();
console.log(fail.length ? `\n${fail.length} check(s) failed` : '\nAll checks passed'); process.exit(fail.length ? 1 : 0);
