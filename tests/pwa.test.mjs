import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
test('unauthenticated PWA: no inventory data, correct icons, mobile layout, offline login shell', { timeout: 25000 }, async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
 const context = await browser.newContext();
 await context.addInitScript(() => {
  localStorage.setItem('inventory-data-demo', JSON.stringify({users:[{fullName:'Legacy Demo User'}]}));
 });
 const page = await context.newPage();
 const errors = []; page.on('pageerror',error => errors.push(error.message));
 try {
  await page.goto(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4173');
  await page.getByRole('button',{name:'Masuk',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Inventaris',exact:true}).count(),0);
  assert.equal(await page.getByText('Legacy Demo User').count(),0);
  assert.equal(await page.evaluate(() => localStorage.getItem('inventory-data-demo')),null);
  const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json());
  assert.equal(manifest.display,'standalone');
  for (const icon of manifest.icons) {
   const dimensions = await page.evaluate(src => new Promise((resolve,reject) => { const img = new Image(); img.onload = () => resolve(`${img.naturalWidth}x${img.naturalHeight}`); img.onerror = reject; img.src = src; }),icon.src);
   assert.equal(dimensions,icon.sizes);
  }
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button',{name:'Masuk',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Inventaris',exact:true}).count(),0);
  assert.deepEqual(errors,[]);
 } finally { await browser.close(); }
});
