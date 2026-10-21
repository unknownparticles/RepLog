import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

test('真实新版本等待确认，取消不刷新，确认更新后保留本机数据', async ({ page, baseURL }) => {
  const root = resolve('dist');
  const base = new URL(baseURL!).pathname;
  let version = 1;
  // 独立站点模拟连续部署，避免改动构建产物或影响其他浏览器用例。
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url!, 'http://localhost').pathname);
      if (!pathname.startsWith(base)) { response.writeHead(404).end(); return; }
      const relative = pathname.slice(base.length) || 'index.html';
      const file = resolve(root, relative);
      if (!file.startsWith(root + sep)) { response.writeHead(404).end(); return; }
      let body = await readFile(file);
      if (relative === 'sw.js') body = Buffer.concat([body, Buffer.from(`\nself.__testVersion = ${version};\n`)]);
      const extension = file.split('.').pop()!;
      const mime: Record<string, string> = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', png: 'image/png' };
      response.writeHead(200, { 'Content-Type': mime[extension] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('测试站点未就绪');
    await page.goto(`http://127.0.0.1:${address.port}${base}#/settings`);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.getByRole('button', { name: '设置目标', exact: true }).click();
    await page.getByLabel('每日能量目标（千卡）').fill('1888');
    await page.getByRole('button', { name: '保存目标', exact: true }).click();
    await expect(page.locator('.goal-highlight')).toContainText('1,888');
    version = 2;
    const app = page.getByRole('region', { name: '应用信息', exact: true });
    await app.getByRole('button', { name: '检查更新', exact: true }).click();
    await expect(app.getByRole('button', { name: '立即更新', exact: true })).toBeVisible();
    expect(await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(true);
    page.once('dialog', dialog => dialog.dismiss());
    await app.getByRole('button', { name: '立即更新', exact: true }).click();
    await expect(app.getByRole('button', { name: '立即更新', exact: true })).toBeVisible();
    expect(await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(true);
    page.once('dialog', dialog => dialog.accept());
    await Promise.all([
      page.waitForEvent('load'),
      app.getByRole('button', { name: '立即更新', exact: true }).click(),
    ]);
    await expect(page.locator('.goal-highlight')).toContainText('1,888');
    await expect(app.getByRole('button', { name: '检查更新', exact: true })).toBeVisible();
    await app.getByRole('button', { name: '检查更新', exact: true }).click();
    await expect(app).toContainText('当前已是最新版本。');
  } finally {
    server.closeAllConnections();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
});
