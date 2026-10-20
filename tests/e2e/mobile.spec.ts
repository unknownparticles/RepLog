import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('手机快捷记录沿用所选日期，周月视图保留选择并支持返回今天', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T04:00:00Z') });
  await page.goto('./#/calendar');
  await expect(page.locator('.calendar-day')).toHaveCount(7);
  await page.getByRole('button', { name: /2026-10-19，/ }).click();
  await page.getByRole('button', { name: /记录体重/ }).click();
  await page.getByLabel('体重（千克）').fill('65.5');
  await page.getByRole('button', { name: '保存体重', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '月', exact: true }).click();
  await expect(page.locator('.calendar-day')).toHaveCount(42);
  await expect(page.getByRole('button', { name: /2026-10-19，/ })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: /记录体重/ })).toContainText('65.5 kg');
  await page.getByRole('button', { name: /记录餐食/ }).click();
  if (await page.getByRole('dialog', { name: '新建食物' }).isVisible()) await page.getByRole('button', { name: '返回餐食' }).click();
  await expect(page.getByLabel('归属日期')).toHaveValue('2026-10-19');
  await page.getByRole('button', { name: '关闭弹窗' }).click();
  await page.getByRole('button', { name: '今天', exact: true }).click();
  await expect(page.getByRole('button', { name: /2026-10-20，/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /记录体重/ })).not.toContainText('65.5 kg');
});

test('手机组次直接填写和完成，首页可恢复草稿，训练导航保持选中', async ({ page }) => {
  await page.goto('./#/training');
  await page.getByRole('button', { name: '开始训练', exact: true }).click();
  await expect(page).toHaveURL(/#\/workouts\//);
  const workoutUrl = page.url();
  const nav = page.getByRole('navigation', { name: '手机导航' });
  await expect(nav.getByRole('link', { name: '训练', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: '选择动作', exact: true }).click();
  await page.getByLabel('搜索动作').fill('杠铃卧推');
  await page.getByRole('button', { name: '加入杠铃卧推', exact: true }).click();
  await page.getByLabel('第1组重量').fill('50');
  await page.getByLabel('第1组次数').fill('10');
  await page.getByRole('button', { name: '第1组标记完成' }).click();
  await expect(page.getByRole('button', { name: '第1组取消完成' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').filter({ hasText: '已保存在本地' })).toBeVisible();
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const selector of ['.set-card', '.set-card-inputs', '.workout-primary-actions']) {
      expect(await page.locator(selector).first().evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    const actions = await page.locator('.workout-primary-actions').boundingBox();
    const navigation = await nav.boundingBox();
    expect(actions!.y + actions!.height).toBeLessThan(navigation!.y);
  }
  await nav.getByRole('link', { name: '日历', exact: true }).click();
  await page.getByRole('link', { name: '继续训练', exact: true }).click();
  await expect(page).toHaveURL(workoutUrl);
  await expect(page.getByLabel('第1组重量')).toHaveValue('50');
  await expect(page.getByRole('button', { name: '第1组取消完成' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '完成训练', exact: true }).click();
  await expect(page.locator('.workout-history-row')).toHaveCount(1);
});

test('窄屏与深色模式下弹层保持在可视区内，关闭后恢复入口焦点', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('button', { name: '深色', exact: true }).click();
  await page.goto('./#/calendar');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const trigger = page.getByRole('button', { name: /记录体重/ });
  await trigger.click();
  await page.setViewportSize({ width: 320, height: 480 });
  const dialog = page.getByRole('dialog', { name: '记录体重' });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(480);
  await page.getByLabel('体重（千克）').fill('66');
  await page.getByRole('button', { name: '保存体重', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText('66 kg');
});
