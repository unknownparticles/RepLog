import { expect, test } from '@playwright/test';

test('设置按分组显示，时区可取消和保存，历史记录按需展开', async ({ page }) => {
  await page.goto('./#/settings');
  for (const name of ['目标与身体', '显示与日期', '数据与备份', '应用信息']) {
    await expect(page.getByRole('region', { name, exact: true })).toBeVisible();
  }
  const edit = page.getByRole('button', { name: '修改时区', exact: true });
  await edit.click();
  await page.getByLabel('记录时区（IANA）').fill('Asia/Tokyo');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await edit.click();
  await expect(page.getByLabel('记录时区（IANA）')).toHaveValue('Asia/Shanghai');
  await page.getByLabel('记录时区（IANA）').fill('invalid');
  await page.getByRole('button', { name: '保存时区', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('记录时区（IANA）').fill('Asia/Tokyo');
  await page.getByRole('button', { name: '保存时区', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('region', { name: '显示与日期', exact: true })).toContainText('Asia/Tokyo');
  await page.getByRole('button', { name: '记录今天', exact: true }).click();
  await page.getByLabel('体重（千克）').fill('65.5');
  await page.getByRole('button', { name: '保存体重', exact: true }).click();
  await expect(page.getByRole('button', { name: /删除.*体重/ })).toBeHidden();
  await page.getByText('查看最近体重记录', { exact: true }).click();
  await expect(page.getByRole('button', { name: /删除.*体重/ })).toBeVisible();
  await page.getByRole('button', { name: '深色', exact: true }).click();
  await expect(page.getByRole('button', { name: '深色', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const width of [320, 390, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('手机饮食工具分行排列并沿用所选日期', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('./#/nutrition?date=2026-10-19');
  const date = page.getByLabel('饮食日期');
  const tools = page.getByRole('navigation', { name: '饮食工具' });
  await expect(date).toHaveValue('2026-10-19');
  const dateBounds = await date.boundingBox();
  const toolBounds = await tools.boundingBox();
  expect(toolBounds!.y).toBeGreaterThanOrEqual(dateBounds!.y + dateBounds!.height);
  await expect(tools.getByRole('link', { name: '健康组合餐' })).toHaveAttribute('href', '#/healthy-meals?date=2026-10-19');
  await expect(tools.getByRole('link', { name: '健身食谱' })).toHaveAttribute('href', '#/recipes?date=2026-10-19');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('设置页可检查最新版本，离线提示联网，恢复网络后可重试', async ({ page, context }) => {
  await page.goto('./#/settings');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const app = page.getByRole('region', { name: '应用信息', exact: true });
  await app.getByRole('button', { name: '检查更新', exact: true }).click();
  await expect(app).toContainText('当前已是最新版本。');
  await context.setOffline(true);
  await app.getByRole('button', { name: '检查更新', exact: true }).click();
  await expect(app).toContainText('当前处于离线状态，请联网后检查更新。');
  await context.setOffline(false);
  await app.getByRole('button', { name: '检查更新', exact: true }).click();
  await expect(app).toContainText('当前已是最新版本。');
});
