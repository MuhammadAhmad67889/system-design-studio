/* Verification pass for System Design Studio (production build, port 3100).
 * Checks: HTTP render, console errors, horizontal overflow at 1440 + 390,
 * and click-throughs (lesson steps, quiz, calculator, theme, design lab).
 * Screenshots land in screenshots/desktop + screenshots/mobile. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = 'http://localhost:3100';
const SHELL = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell';
const SHOT = '/home/hatch/workspace/system-design-studio/screenshots';
fs.mkdirSync(`${SHOT}/desktop`, { recursive: true });
fs.mkdirSync(`${SHOT}/mobile`, { recursive: true });

const PAGES = [
  ['home', '/'],
  ['learn', '/learn'],
  ['lesson-l1', '/learn/l1'],
  ['lesson-l2', '/learn/l2'],
  ['lesson-coming-soon', '/learn/l3'],
  ['practice', '/practice'],
  ['quiz', '/practice/quiz'],
  ['design-lab', '/design-lab'],
  ['cheatsheets', '/cheatsheets'],
  ['cheatsheet-detail', '/cheatsheets/caching-patterns'],
  ['case-studies', '/case-studies'],
  ['case-detail', '/case-studies/url-shortener'],
  ['calculator', '/calculator'],
  ['search', '/search?q=cache'],
];

const results = [];
const browser = await chromium.launch({ executablePath: SHELL, args: ['--no-sandbox'] });

async function checkPage(page, name, path, viewport) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  const resp = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
    overWide: [...document.querySelectorAll('*')].filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 3).map((el) => `${el.tagName}.${String(el.className).slice(0, 60)}`),
  }));
  await page.screenshot({ path: `${SHOT}/${viewport}/${name}.png`, fullPage: false });
  results.push({
    page: name, viewport, status: resp?.status(),
    overflow: overflow.scrollW > overflow.innerW,
    scrollW: overflow.scrollW, innerW: overflow.innerW,
    overWide: overflow.overWide, consoleErrors: errors,
  });
}

for (const [name, path] of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try { await checkPage(page, name, path, 'desktop'); } catch (e) { results.push({ page: name, viewport: 'desktop', error: String(e).slice(0, 200) }); }
  await ctx.close();
}
for (const [name, path] of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await ctx.newPage();
  try { await checkPage(page, name, path, 'mobile'); } catch (e) { results.push({ page: name, viewport: 'mobile', error: String(e).slice(0, 200) }); }
  await ctx.close();
}

// ---- Interactions (desktop) ----
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const ix = {};
try {
  // Lesson: step navigation + mark complete
  await page.goto(BASE + '/learn/l1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const stepBefore = await page.locator('text=Step 1 of').first().textContent().catch(() => null);
  await page.getByRole('button', { name: /next step/i }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  const stepAfter = await page.locator('text=Step 2 of').first().textContent().catch(() => null);
  ix.lessonStepNext = { before: stepBefore, after: stepAfter };
  await page.getByRole('button', { name: /mark (as )?complete/i }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  ix.lessonComplete = await page.evaluate(() => localStorage.getItem('sds-progress-v1'));
  // Simulation play: does auto-advance move the step?
  await page.getByRole('button', { name: /^play$/i }).first().click().catch(() => {});
  await page.waitForTimeout(6000);
  ix.simAutoAdvanced = await page.locator('text=Step 3 of').first().textContent().catch(() => null);
  await page.screenshot({ path: `${SHOT}/desktop/lesson-l1-playing.png` });
} catch (e) { ix.lessonError = String(e).slice(0, 200); }

try {
  // Quiz: answer all 10, reach results
  await page.goto(BASE + '/practice/quiz', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  for (let i = 0; i < 10; i++) {
    await page.locator('input[type="radio"]').first().click().catch(() => {});
    await page.getByRole('button', { name: /check answer|submit/i }).first().click().catch(() => {});
    await page.waitForTimeout(300);
    const next = page.getByRole('button', { name: /next question|see results/i }).first();
    if (await next.count()) { await next.click(); await page.waitForTimeout(300); }
  }
  ix.quizResults = await page.locator('text=/score|accuracy|results/i').first().textContent().catch(() => null);
  await page.screenshot({ path: `${SHOT}/desktop/quiz-results.png` });
} catch (e) { ix.quizError = String(e).slice(0, 200); }

try {
  // Calculator: change DAU and watch the output move
  await page.goto(BASE + '/calculator', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const peakBefore = await page.locator('text=/peak/i').first().textContent().catch(() => null);
  const dau = page.locator('input[type="number"]').first();
  await dau.fill('2000000');
  await page.waitForTimeout(400);
  const peakAfter = await page.locator('text=/peak/i').first().textContent().catch(() => null);
  ix.calculator = { peakBefore, peakAfter };
} catch (e) { ix.calcError = String(e).slice(0, 200); }

try {
  // Theme toggle
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /theme|dark|light/i }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  ix.darkMode = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: `${SHOT}/desktop/home-dark.png` });
} catch (e) { ix.themeError = String(e).slice(0, 200); }

try {
  // Design Lab: add a node via the palette + button
  await page.goto(BASE + '/design-lab', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const before = await page.locator('.react-flow__node').count();
  await page.locator('button:has-text("+")').first().click().catch(() => {});
  await page.waitForTimeout(600);
  const after = await page.locator('.react-flow__node').count();
  ix.designLab = { nodesBefore: before, nodesAfter: after };
  await page.screenshot({ path: `${SHOT}/desktop/design-lab.png` });
} catch (e) { ix.labError = String(e).slice(0, 200); }

await browser.close();
console.log(JSON.stringify({ pages: results, interactions: ix }, null, 2));
