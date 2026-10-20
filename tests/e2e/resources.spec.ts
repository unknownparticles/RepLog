import { expect, test } from '@playwright/test';

test.describe('页面资源按需加载', () => {
  test.use({ serviceWorkers: 'block' });
  test('日历不执行训练和图表模块，动作首批只渲染二十四项且搜索覆盖完整目录', async ({ page }) => {
    const scripts: string[] = []; const media: string[] = [];
    page.on('request', request => {
      if (request.resourceType() === 'script') scripts.push(request.url());
      if (/\/media\/exercises\/.*\.(mp4|jpg)/.test(request.url())) media.push(request.url());
    });
    await page.goto('./#/calendar');
    await expect(page.locator('.calendar-grid')).toBeVisible();
    expect(scripts.filter(url => /\/(Training|ExerciseLibrary|Analytics|Settings|CalorieCalculator)-/.test(url))).toEqual([]);
    await page.goto('./#/exercises');
    await expect(page.locator('.exercise-row')).toHaveCount(24);
    await expect(page.locator('.exercise-art animate')).toHaveCount(0);
    await page.getByRole('button', { name: /^加载更多动作/ }).click();
    await expect(page.locator('.exercise-row')).toHaveCount(48);
    await page.getByLabel('搜索动作').fill('Swiss Ball');
    await expect(page.locator('.exercise-row')).toHaveCount(2);
    await expect(page.getByRole('button', { name: '健身球卷腹', exact: true })).toBeVisible();
    await page.getByLabel('搜索动作').fill('');
    await expect(page.locator('.exercise-row')).toHaveCount(48);
    expect(media).toEqual([]);
  });
});

test('首次离线准备后可以断网打开尚未访问的页面和新增动作', async ({ page, context }) => {
  await page.goto('./#/calendar');
  await expect(page.locator('.calendar-grid')).toBeVisible();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  for (const route of ['settings', 'calories', 'training', 'exercises']) {
    await page.goto(`./#/${route}`);
    await expect(page.locator('main h1')).toBeVisible();
  }
  await page.reload();
  await page.getByLabel('搜索动作').fill('Burpees');
  await expect(page.getByRole('button', { name: '波比跳', exact: true })).toBeVisible();
  await page.getByLabel('搜索动作').fill('体能绳');
  await page.getByRole('button', { name: '战绳交替波浪', exact: true }).click();
  await expect(page.locator('.exercise-guide li')).toHaveCount(3);
  await context.setOffline(false);
});
