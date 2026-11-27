/* Focused re-checks after the SVG height fix + rebuild:
 * 1. Simulation auto-advance (correct button name "Play simulation").
 * 2. Calculator output value moves when DAU changes.
 * 3. Design Lab add-node via palette aria-label.
 * 4. No console errors on lesson pages. */
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:3100';
const SHELL = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell';
const out = {};
const browser = await chromium.launch({ executablePath: SHELL, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 1. Simulation auto-advance
try {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  await page.goto(BASE + '/learn/l1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  out.lessonConsoleErrors = errors;
  await page.getByRole('button', { name: 'Play simulation' }).click();
  await page.waitForTimeout(6500);
  out.simStepAfterPlay = await page.locator('text=/Step \\d+ of 6/').first().textContent().catch(() => null);
  await page.getByRole('button', { name: 'Pause simulation' }).click().catch(() => {});
} catch (e) { out.simError = String(e).slice(0, 200); }

// 2. Calculator
try {
  await page.goto(BASE + '/calculator', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const readPeak = async () => {
    const el = page.locator('text=Peak RPS').first();
    const card = el.locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
    return (await card.textContent())?.replace(/\s+/g, ' ').trim() ?? null;
  };
  out.calcPeakBefore = await readPeak();
  const dau = page.locator('input[type="number"]').first();
  await dau.fill('2000000');
  await page.waitForTimeout(400);
  out.calcPeakAfter = await readPeak();
} catch (e) { out.calcError = String(e).slice(0, 200); }

// 3. Design Lab add node
try {
  await page.goto(BASE + '/design-lab', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  out.labNodesBefore = await page.locator('.react-flow__node').count();
  const addBtn = page.getByRole('button', { name: /Add .* to the canvas/ }).first();
  out.labFirstAddLabel = await addBtn.getAttribute('aria-label');
  await addBtn.click();
  await page.waitForTimeout(700);
  out.labNodesAfter = await page.locator('.react-flow__node').count();
  // Save round-trip: save, clear, check project listed
  await page.getByRole('button', { name: /save/i }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  out.labSaved = await page.evaluate(() => localStorage.getItem('sds-lab-projects'));
} catch (e) { out.labError = String(e).slice(0, 200); }

await browser.close();
console.log(JSON.stringify(out, null, 2));
