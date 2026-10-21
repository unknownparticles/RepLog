import { expect, test, type Page } from '@playwright/test';

async function registerCategory(page: Page, category: string) {
  await page.getByLabel('参考食物分类').selectOption(category);
  await page.getByRole('button', { name: '登记当前分类通用食物', exact: true }).click();
  await expect(page.getByRole('button', { name: '登记当前分类通用食物', exact: true })).toHaveCount(0);
}
async function registerPowder(page: Page, kind: string, brand: string, energy: string, grams: string) {
  const card = page.locator('.catalog-food-row').filter({ has: page.getByRole('heading', { name: kind, exact: true }) });
  await card.getByRole('button', { name: '按标签登记', exact: true }).click();
  const dialog = page.getByRole('dialog').last();
  await expect(dialog.getByLabel('能量（千卡 / 100 克）', { exact: true })).toHaveValue('');
  await dialog.getByLabel('食物名称', { exact: true }).fill(brand);
  await dialog.getByLabel('能量（千卡 / 100 克）', { exact: true }).fill(energy);
  await dialog.getByLabel('蛋白质（克 / 100 克）', { exact: true }).fill(kind === '蛋白粉' ? '80' : '20');
  await dialog.getByLabel('碳水（克 / 100 克）', { exact: true }).fill(kind === '蛋白粉' ? '10' : '70');
  await dialog.getByLabel('脂肪（克 / 100 克）', { exact: true }).fill('2');
  await dialog.getByLabel('可选份量名称', { exact: true }).fill('勺');
  await dialog.getByLabel('每份克重（克）', { exact: true }).fill(grams);
  await dialog.getByRole('button', { name: '保存食物', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
}

test('分类登记蔬果肉类与补剂标签，仅匹配登记热量，保存组合并按份数计入指定餐次', async ({ page }) => {
  await page.goto('./#/foods');
  await page.getByRole('button', { name: '健身食物参考目录', exact: true }).click();
  await registerCategory(page, '蔬菜'); await registerCategory(page, '水果'); await registerCategory(page, '肉蛋鱼虾'); await registerCategory(page, '调味');
  await page.getByLabel('参考食物分类').selectOption('补剂');
  await expect(page.getByRole('button', { name: '登记当前分类通用食物', exact: true })).toHaveCount(0);
  await registerPowder(page, '蛋白粉', '甲牌蛋白粉', '400', '30');
  await registerPowder(page, '增肌粉', '甲牌增肌粉', '380', '50');
  await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await page.getByPlaceholder('搜索食物…', { exact: true }).fill('红萝卜');
  await expect(page.locator('.library-card')).toHaveCount(1); await expect(page.locator('.library-card')).toContainText('胡萝卜');
  await page.goto('./#/healthy-meals?date=2026-10-18');
  await page.getByLabel('要匹配的食物').fill('红萝卜100克，西兰花150克，甲牌蛋白粉1勺，甲牌增肌粉0.5份，盐2克');
  await page.getByRole('button', { name: '匹配到组合', exact: true }).click();
  await expect(page.locator('.combo-row')).toHaveCount(5);
  await expect(page.locator('.combo-totals')).toContainText('307');
  await expect(page.locator('.combo-row').last()).toContainText('0 千卡（登记值）');
  await page.getByLabel('组合餐名称', { exact: true }).fill('训练日组合');
  await page.getByRole('button', { name: '保存组合', exact: true }).click();
  await expect(page.locator('.saved-combo')).toContainText('训练日组合');
  await page.goto('./#/nutrition?date=2026-10-18'); await expect(page.locator('.record-row')).toHaveCount(0);
  await page.locator('main').getByRole('link', { name: '健康组合餐', exact: true }).click();
  await page.getByRole('button', { name: '载入训练日组合', exact: true }).click();
  // 手动从已有食物中增加水果，随后仍可修改用量。
  await page.getByLabel('搜索可组合食物').fill('香蕉');
  await page.locator('.combo-food-picker').getByRole('button').click();
  await expect(page.locator('.combo-row')).toHaveCount(6);
  await page.getByLabel('食物 6 数量', { exact: true }).fill('100');
  await expect(page.locator('.combo-totals')).toContainText('396');
  await page.getByLabel('食用份数', { exact: true }).fill('0.5');
  await expect(page.locator('.combo-totals')).toContainText('198');
  await page.getByLabel('归属日期', { exact: true }).fill('2026-10-19');
  await page.getByLabel('餐次').selectOption('晚餐');
  await page.getByRole('button', { name: '确认计入饮食', exact: true }).click();
  await expect(page).toHaveURL(/nutrition\?date=2026-10-19/);
  await expect(page.locator('.record-row')).toContainText('训练日组合 · 0.5 份');
  await expect(page.locator('.record-row')).toContainText('甲牌蛋白粉 15克');
  await page.reload(); await expect(page.locator('.record-row')).toContainText('香蕉 50克');
});

test('手机离线匹配未登记不算零，未知份量阻止保存，推荐组合不虚构食材', async ({ page, context, baseURL }) => {
  const external: string[] = [];
  page.on('request', request => { if (new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url()); });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('./#/foods'); await page.getByRole('button', { name: '健身食物参考目录', exact: true }).click();
  await registerCategory(page, '蔬菜'); await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller)); await context.setOffline(true);
  await page.goto('./#/healthy-meals?date=2026-10-21'); await page.reload();
  await page.getByLabel('要匹配的食物').fill('胡萝卜100克，西兰花1勺，未登记蛋白粉30克');
  await page.getByRole('button', { name: '匹配到组合', exact: true }).click();
  await expect(page.getByRole('button', { name: '确认计入饮食', exact: true })).toBeDisabled();
  await expect(page.locator('.combo-totals')).toContainText('—');
  await expect(page.locator('.combo-row').nth(1)).toContainText('未登记对应单位的克重');
  await expect(page.locator('.combo-row').nth(2)).toContainText('请选择已登记食物');
  await page.getByRole('button', { name: '移除组合食物3', exact: true }).click();
  await page.getByLabel('食物 2 单位', { exact: true }).selectOption('克');
  await page.getByLabel('食物 2 数量', { exact: true }).fill('150');
  await expect(page.locator('.combo-totals')).toContainText('92');
  await page.getByLabel('食物 1 单位', { exact: true }).selectOption('千克');
  await page.getByLabel('食物 1 数量', { exact: true }).fill('0.05');
  await expect(page.locator('.combo-totals')).toContainText('71.5');
  await page.getByLabel('食物 1 单位', { exact: true }).selectOption('克');
  await page.getByLabel('食物 1 数量', { exact: true }).fill('100');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/healthy-meals-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '确认计入饮食', exact: true }).click();
  await expect(page.locator('.record-row')).toContainText('胡萝卜 100克');
  await page.goto('./#/healthy-meals');
  await page.getByRole('button', { name: '采用鸡胸蔬菜米饭餐', exact: true }).click();
  await expect(page.locator('.combo-row')).toHaveCount(4);
  await expect(page.getByRole('button', { name: '确认计入饮食', exact: true })).toBeDisabled();
  await page.goto('./#/foods'); await expect(page.locator('.library-card')).toHaveCount(10);
  expect(external).toEqual([]); await context.setOffline(false);
});
