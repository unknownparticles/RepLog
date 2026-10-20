import { expect, test } from '@playwright/test';
import manifest from '../../public/media/exercises/manifest.json' with { type: 'json' };

test('真人视频播放、慢放、完整下载及离线重开', async ({ page, context, baseURL }) => {
  const foreignRequests: string[] = [];
  page.on('request', request => { if (new URL(request.url()).origin !== new URL(baseURL!).origin && !request.url().startsWith('blob:')) foreignRequests.push(request.url()); });
  await page.goto('./#/exercises');
  await page.getByRole('checkbox', { name: '仅有示范', exact: true }).check();
  await expect(page.locator('.exercise-row')).toHaveCount(manifest.length);
  await page.getByLabel('搜索动作').fill('杠铃卧推');
  await page.getByRole('button', { name: '杠铃卧推', exact: true }).click();
  const video = page.getByLabel('杠铃卧推示范视频');
  await expect(video).toHaveAttribute('preload', 'none');
  expect(await video.evaluate(element => (element as HTMLVideoElement).autoplay)).toBe(false);
  expect(await video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true);
  await page.getByRole('button', { name: '播放杠铃卧推示范', exact: true }).click();
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime), { timeout: 15000 }).toBeGreaterThan(0);
  await page.getByLabel('示范播放速度').selectOption('0.5');
  expect(await video.evaluate(element => (element as HTMLVideoElement).playbackRate)).toBe(.5);
  await page.getByRole('button', { name: '保存供离线', exact: true }).click();
  await expect(page.getByText('已保存，可离线播放', { exact: true })).toBeVisible();
  await video.evaluate(element => (element as HTMLVideoElement).pause());
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  const media = manifest.find(item => item.exerciseId === 'builtin-001')!;
  const asset = `${new URL(baseURL!).pathname}${media.video}?v=${media.sha256.slice(0, 12)}`;
  const ranged = await page.evaluate(async url => {
    const response = await fetch(url, { headers: { Range: 'bytes=0-1023' } });
    return { status: response.status, bytes: (await response.arrayBuffer()).byteLength, range: response.headers.get('Content-Range') };
  }, asset);
  expect(ranged.status).toBe(206); expect(ranged.bytes).toBe(1024); expect(ranged.range).toMatch(/^bytes 0-1023\//);
  await page.reload();
  await page.getByLabel('搜索动作').fill('杠铃卧推');
  await page.getByRole('button', { name: '杠铃卧推', exact: true }).click();
  await expect(page.getByLabel('杠铃卧推示范视频')).toHaveAttribute('src', /^blob:/);
  await expect(page.getByText('已保存，可离线播放', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '播放杠铃卧推示范', exact: true }).click();
  await expect.poll(() => page.getByLabel('杠铃卧推示范视频').evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/exercise-demo.png' });
  await context.setOffline(false);
  expect(foreignRequests).toEqual([]);
});

test.describe('示范失败回退', () => {
  test.use({ serviceWorkers: 'block' });
  test('损坏的缓存不显示离线保存成功', async ({ page, baseURL }) => {
    await page.goto('./#/exercises');
    const media = manifest.find(item => item.exerciseId === 'builtin-001')!;
    await page.evaluate(async ({ media, base }) => {
      const cache = await caches.open(`replog-exercise-media-v1-${encodeURIComponent(base)}`);
      await cache.put(`${base}${media.video}?v=${media.sha256.slice(0, 12)}`, new Response('损坏的视频', { headers: { 'Content-Type': 'video/mp4' } }));
      await cache.put(`${base}${media.poster}?v=${media.posterSha256.slice(0, 12)}`, new Response('损坏的海报', { headers: { 'Content-Type': 'image/jpeg' } }));
    }, { media, base: new URL(baseURL!).pathname });
    await page.getByLabel('搜索动作').fill('杠铃卧推');
    await page.getByRole('button', { name: '杠铃卧推', exact: true }).click();
    await expect.poll(() => page.evaluate(async ({ media, base }) => {
      const cache = await caches.open(`replog-exercise-media-v1-${encodeURIComponent(base)}`);
      return Boolean(await cache.match(`${base}${media.video}?v=${media.sha256.slice(0, 12)}`));
    }, { media, base: new URL(baseURL!).pathname })).toBe(false);
    await expect(page.getByRole('button', { name: '保存供离线', exact: true })).toBeVisible();
    await expect(page.getByText('已保存，可离线播放', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('杠铃卧推示范视频')).not.toHaveAttribute('src', /^blob:/);
  });
  test('加载失败不影响训练保存，缺素材的动作保留说明', async ({ page }) => {
    await page.route('**/media/exercises/*.mp4*', route => route.abort('failed'));
    await page.goto('./#/training');
    await page.getByRole('button', { name: '开始训练', exact: true }).click();
    await page.getByRole('button', { name: '选择动作', exact: true }).click();
    await page.getByLabel('搜索动作').fill('杠铃卧推');
    await page.getByRole('button', { name: '加入杠铃卧推', exact: true }).click();
    await expect(page.getByText('等待保存…', { exact: true })).toBeHidden();
    await page.getByRole('button', { name: '查看示范', exact: true }).click();
    await page.getByRole('button', { name: '播放杠铃卧推示范', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('示范暂时无法');
    await expect(page.locator('.exercise-demo+.guide-heading')).toHaveText('动作说明');
    await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
    await page.getByLabel('第1组重量').fill('20');
    await page.getByLabel('第1组次数').fill('10');
    await page.getByRole('button', { name: '第1组标记完成' }).click();
    await expect(page.getByRole('status').filter({ hasText: '已保存在本地' })).toBeVisible();
    await page.goto('./#/exercises');
    await page.getByLabel('搜索动作').fill('俯卧撑');
    await page.getByRole('button', { name: '俯卧撑', exact: true }).click();
    await expect(page.getByText('暂无对应视频示范，可参考动作说明。', { exact: true })).toBeVisible();
    await expect(page.locator('video')).toHaveCount(0);
  });
});
