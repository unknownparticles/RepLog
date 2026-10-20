import { expect, test } from '@playwright/test';

test('器械库、动作说明、双模式器械筛选和自定义动作', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./#/exercises');
  await expect(page.getByRole('heading', { name: '动作库', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/exercises-desktop.png' });
  await page.goto('./#/equipment');
  await expect(page.getByRole('heading', { name: '器械库', exact: true })).toBeVisible();
  await page.getByLabel('搜索器械').fill('smith');
  await expect(page.locator('.equipment-row')).toHaveCount(1);
  await page.getByRole('link', { name: /个相关动作/ }).click();
  await expect(page.getByLabel('使用器械')).toHaveValue('史密斯机');
  await page.getByRole('button', { name: '史密斯卧推', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Smith Bench Press');
  await expect(page.locator('.exercise-guide li')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '重置', exact: true }).click();
  await page.getByLabel('搜索动作').fill('杠铃卧推');
  await page.getByRole('button', { name: '按现有器械匹配', exact: true }).click();
  await page.getByRole('checkbox', { name: '杠铃', exact: true }).check();
  await page.getByRole('button', { name: '显示 0 个动作', exact: true }).click();
  await expect(page.getByRole('heading', { name: '没有符合条件的动作' })).toBeVisible();
  await page.getByRole('button', { name: '现有器械 · 1 项', exact: true }).click();
  await page.getByRole('checkbox', { name: '训练凳', exact: true }).check();
  await page.getByRole('button', { name: '显示 1 个动作', exact: true }).click();
  await expect(page.locator('.exercise-row')).toHaveCount(1);
  await page.getByRole('button', { name: '新建动作', exact: true }).click();
  await page.getByLabel('动作名称').fill('个人弹力带划船');
  await page.getByLabel('别名 / 英文名称').fill('My Band Row');
  await page.getByRole('toolbar', { name: '主要肌群', exact: true }).getByRole('button', { name: '背', exact: true }).click();
  await page.getByRole('toolbar', { name: '辅助肌群', exact: true }).getByRole('button', { name: '手臂', exact: true }).click();
  await page.getByRole('dialog').getByRole('checkbox', { name: '弹力带', exact: true }).check();
  await page.getByLabel('动作说明').fill('检查固定点\n向后划动\n控制回放');
  await page.getByRole('button', { name: '保存动作', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '重置', exact: true }).click();
  await page.getByLabel('搜索动作').fill('my band');
  await expect(page.locator('.exercise-row')).toHaveCount(1);
  await page.getByRole('button', { name: '个人弹力带划船', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('手臂');
  await expect(page.getByRole('dialog')).toContainText('弹力带');
  expect(errors).toEqual([]);
});

test('训练选择器支持嵌套弹窗，手机动作与器械页面无横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('./#/training');
  await page.getByRole('button', { name: '开始训练', exact: true }).click();
  await page.getByRole('button', { name: '选择动作', exact: true }).click();
  await page.getByLabel('搜索动作').fill('杠铃卧推');
  await page.getByRole('button', { name: '杠铃卧推', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '杠铃卧推', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '选择训练动作', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '加入杠铃卧推', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('等待保存…', { exact: true })).toBeHidden();
  for (const route of ['exercises', 'equipment']) {
    await page.goto(`./#/${route}`);
    await expect(page.locator('main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: 'test-results/library-mobile.png' });
});

test('手机搜索悍马系列、按具体机型筛选并完成训练记录', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('./#/equipment');
  await page.getByLabel('搜索器械').fill('悍马机');
  await expect(page.locator('.equipment-row')).toHaveCount(5);
  const chest = page.locator('.equipment-row').filter({ has: page.getByRole('heading', { name: '悍马推胸机', exact: true }) });
  await chest.getByRole('link', { name: '3 个相关动作' }).click();
  await expect(page.getByLabel('使用器械')).toHaveValue('悍马推胸机');
  await expect(page.locator('.exercise-row')).toHaveCount(3);
  await page.getByLabel('使用器械').selectOption('腰带深蹲机');
  await expect(page.locator('.exercise-row')).toHaveCount(1);
  await expect(page.getByRole('button', { name: '腰带深蹲', exact: true })).toBeVisible();
  await page.goto('./#/training');
  await page.getByRole('button', { name: '开始训练', exact: true }).click();
  await page.getByRole('button', { name: '选择动作', exact: true }).click();
  await page.getByLabel('搜索动作').fill('HAMMER-STRENGTH');
  await expect(page.locator('.exercise-row')).toHaveCount(9);
  await page.getByRole('button', { name: '加入悍马平板推胸', exact: true }).click();
  await expect(page.getByRole('img', { name: '悍马平板推胸动作线稿', exact: true })).toBeVisible();
  await page.getByLabel('第1组重量').fill('40');
  await page.getByLabel('第1组次数').fill('10');
  await page.getByRole('button', { name: '第1组标记完成', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '已保存在本地' })).toBeVisible();
  await page.getByRole('button', { name: '完成训练', exact: true }).click();
  await expect(page.locator('.workout-history-row')).toHaveCount(1);
});

test('新增体能器械支持搜索、动作说明和按不同方式完成训练', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/equipment');
  await page.getByLabel('搜索器械').fill('TRX');
  await expect(page.locator('.equipment-row')).toHaveCount(1);
  await page.getByRole('link', { name: '2 个相关动作' }).click();
  await expect(page.locator('.exercise-row')).toHaveCount(2);
  await page.getByRole('button', { name: '悬挂划船', exact: true }).click();
  await expect(page.locator('.exercise-guide li')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await page.goto('./#/training');
  await page.getByRole('button', { name: '开始训练', exact: true }).click();
  for (const [query, name] of [['Prowler', '推雪橇车'], ['Burpees', '波比跳'], ['砸球', '药球砸地']]) {
    await page.getByRole('button', { name: '添加动作', exact: true }).click();
    await page.getByLabel('搜索动作').fill(query);
    await page.getByRole('button', { name: `加入${name}`, exact: true }).click();
    const card = page.locator('.exercise-session').filter({ has: page.getByRole('heading', { name, exact: true }) });
    if (name === '推雪橇车') {
      await card.getByLabel('第1组时长').fill('1');
      await card.getByLabel('第1组距离').fill('0.02');
    } else {
      if (name === '药球砸地') await card.getByLabel('第1组重量').fill('6');
      await card.getByLabel('第1组次数').fill('10');
    }
    await card.getByRole('button', { name: '第1组标记完成', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: '已保存在本地' })).toBeVisible();
  }
  await page.getByRole('button', { name: '完成训练', exact: true }).click();
  await expect(page.locator('.workout-history-row')).toHaveCount(1);
});
