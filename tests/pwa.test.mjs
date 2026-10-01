import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
test('demo inventory CRUD, persisted stock, mobile layout, and offline PWA reload', async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
 const context = await browser.newContext();
 const page = await context.newPage();
 const errors = []; page.on('pageerror',error => errors.push(error.message));
 try {
  await page.goto(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4173');
  await page.getByText('Mode demo', { exact: false }).waitFor();
  await page.getByRole('button',{name:'Inventaris',exact:true}).first().click();
  await page.getByRole('button',{name:'Tambah Item',exact:true}).click();
  await page.locator('select').last().selectOption({index:1});
  await page.getByPlaceholder('Contoh: KK-006').fill('SMOKE-001');
  await page.getByPlaceholder('Nama produk').fill('Produk Smoke Test');
  await page.getByRole('button',{name:'Simpan Item'}).click();
  const row = page.getByRole('row').filter({hasText:'Produk Smoke Test'});
  await row.waitFor();
  await row.getByRole('button',{name:'In',exact:true}).click();
  await page.getByPlaceholder('Masukkan jumlah').fill('5');
  await page.getByRole('button',{name:'Simpan Stok Masuk'}).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('inventory-data-demo')).items.some(x => x.sku === 'SMOKE-001' && x.currentStock === 5));
  await row.getByRole('button',{name:'Out',exact:true}).click();
  await page.getByPlaceholder('Masukkan jumlah').fill('6');
  await page.getByRole('button',{name:'Simpan Stok Keluar'}).click();
  await page.getByRole('alert').filter({hasText:'Stok tidak mencukupi'}).waitFor();
  await page.reload();
  await page.getByRole('button',{name:'Inventaris',exact:true}).first().click();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('inventory-data-demo')).items.find(x => x.sku === 'SMOKE-001').currentStock),5);
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
  await page.getByText('Mode demo',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Inventaris',exact:true}).last().click();
  await page.getByText('Produk Smoke Test',{exact:true}).last().waitFor();
  assert.deepEqual(errors,[]);
 } finally { await browser.close(); }
});
