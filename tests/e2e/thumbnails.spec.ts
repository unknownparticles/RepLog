import { expect, test } from '@playwright/test';
import { seedExercises } from '../../src/domain/seeds';

test('全部动作展示线条缩略图，并支持动画、静态和减少动态效果', async ({ page, context }) => {
  const images: string[] = [];
  page.on('request', request => { if (/\.(?:jpg|png)(?:\?|$)/.test(new URL(request.url()).pathname)) images.push(request.url()); });
  await page.goto('./#/exercises');
  const rows = page.locator('.exercise-row');
  await expect(rows).toHaveCount(24);
  await expect(page.locator('.exercise-row .exercise-art')).toHaveCount(24);
  await expect(page.locator('.catalog-count')).toContainText(`${seedExercises.length} 个`);
  await expect(page.locator('.exercise-row img')).toHaveCount(0);
  const first = rows.first().locator('.exercise-art');
  await expect(first).toHaveAttribute('data-animated','false');
  await expect(page.locator('.exercise-art animate')).toHaveCount(0);
  await page.getByRole('button',{name:'动态缩略图',exact:true}).click();
  await expect(first).toHaveAttribute('data-animated','true');
  expect(await first.locator('animate').count()).toBeGreaterThan(0);
  await page.getByRole('button',{name:'动态缩略图',exact:true}).click();
  await expect(first).toHaveAttribute('data-animated','false');
  await expect(first.locator('animate')).toHaveCount(0);
  await page.getByRole('button',{name:'动态缩略图',exact:true}).click();
  await expect(first).toHaveAttribute('data-animated','true');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(first).toHaveAttribute('data-animated','false');
  await expect(page.locator('.exercise-art animate')).toHaveCount(0);
  while (await page.getByRole('button', { name: /^加载更多动作/ }).count()) await page.getByRole('button', { name: /^加载更多动作/ }).click();
  await expect(rows).toHaveCount(seedExercises.length);
  await expect(page.locator('.exercise-row .exercise-art')).toHaveCount(seedExercises.length);
  await expect(page.locator('.exercise-art animate')).toHaveCount(0);
  await page.screenshot({path:'test-results/line-thumbnails-desktop.png'});
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.exercise-row .exercise-art')).toHaveCount(24);
  await expect(page.getByRole('img',{name:'俯卧撑动作线稿',exact:true})).toBeAttached();
  await context.setOffline(false);
  // 应用图标可能由浏览器加载；动作缩略图不请求照片或视频海报。
  expect(images.filter(url => url.includes('/media/exercises/'))).toEqual([]);
});

test('动作选择器和训练卡片使用线稿，手机宽度正常', async ({ page }) => {
  await page.setViewportSize({width:360,height:800});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('./#/training');
  await page.getByRole('button',{name:'开始训练',exact:true}).click();
  await page.getByRole('button',{name:'选择动作',exact:true}).click();
  await page.getByLabel('搜索动作').fill('俯卧撑');
  await expect(page.getByRole('img',{name:'俯卧撑动作线稿',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'加入俯卧撑',exact:true}).click();
  const illustration = page.locator('.exercise-session-title .exercise-art');
  await expect(illustration).toHaveAttribute('aria-label','俯卧撑动作线稿');
  await expect(illustration).toBeVisible();
  await expect(page.getByText('等待保存…',{exact:true})).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/line-thumbnail-workout-mobile.png'});
});
