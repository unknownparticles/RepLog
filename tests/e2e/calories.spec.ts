import { expect,test } from '@playwright/test';

test('标签、三大营养素、每日需求与目标、运动计算和离线使用',async({page,context})=>{
  await page.goto('./#/calories');
  await page.getByLabel('每百克能量',{exact:true}).fill('502.08');
  await page.getByLabel('标签能量单位').selectOption('kj');
  await page.getByLabel('食用克重（克）').fill('300');
  await page.getByRole('button',{name:'计算食物热量',exact:true}).click();
  await expect(page.locator('.calculation-result[role=status], .calculation-result [role=status]')).toContainText('360');
  await page.getByRole('radio',{name:'三大营养素',exact:true}).click();
  await page.getByLabel('蛋白质（克 / 100 克）',{exact:true}).fill('10');
  await page.getByLabel('碳水（克 / 100 克）',{exact:true}).fill('20');
  await page.getByLabel('脂肪（克 / 100 克）',{exact:true}).fill('5');
  await page.getByRole('button',{name:'计算食物热量',exact:true}).click();
  await expect(page.locator('.calculation-result[role=status], .calculation-result [role=status]')).toContainText('495');
  await page.getByRole('radio',{name:'每日需求',exact:true}).click();
  await page.getByLabel('体重（千克）',{exact:true}).fill('80');await page.getByLabel('身高（厘米）').fill('180');await page.getByLabel('年龄（岁）').fill('30');
  await page.getByRole('button',{name:'估算每日需求',exact:true}).click();
  await expect(page.locator('.calculation-result[role=status], .calculation-result [role=status]')).toContainText('1,780');await expect(page.locator('.calculation-result[role=status], .calculation-result [role=status]')).toContainText('2,136');
  await page.screenshot({path:'test-results/calorie-daily-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'确认保存为营养目标',exact:true}).click();
  await page.goto('./#/settings');await expect(page.locator('.goal-highlight')).toContainText('2,136');
  await page.goto('./#/calories?tab=exercise');
  await page.getByLabel('本次体重（千克）').fill('70');await page.getByLabel('运动时长（分钟）').fill('30');await page.getByLabel('活动 MET 值').fill('6');
  await page.getByRole('button',{name:'估算运动消耗',exact:true}).click();
  await expect(page.locator('.calculation-result[role=status], .calculation-result [role=status]')).toContainText('220.5');await expect(page.locator('.calculation-result[role=status], .calculation-result [role=status]')).toContainText('183.8');
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();
  await page.getByLabel('本次体重（千克）').fill('70');await page.getByLabel('运动时长（分钟）').fill('30');await page.getByLabel('活动 MET 值').fill('6');
  await page.getByRole('button',{name:'估算运动消耗',exact:true}).click();await expect(page.locator('.calculation-result[role=status], .calculation-result [role=status]')).toContainText('220.5');
  await context.setOffline(false);
});

test('手机 AI 默认关闭且不外发，食物编辑可显式采用宏量营养换算',async({page,baseURL})=>{
  const external:string[]=[];page.on('request',request=>{if(new URL(request.url()).origin!==new URL(baseURL!).origin)external.push(request.url());});
  await page.setViewportSize({width:360,height:800});await page.goto('./#/calories?tab=ai');
  await expect(page.getByRole('button',{name:'生成待确认草稿',exact:true})).toBeDisabled();
  await expect(page.getByText('AI 接口已预留，当前没有连接服务。可继续使用本地计算与手动记餐。',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/calorie-ai-mobile.png'});
  await page.goto('./#/foods');await page.getByRole('button',{name:'新建食物',exact:true}).click();
  await page.getByLabel('食物名称').fill('宏量测试');
  await page.getByLabel('蛋白质（克 / 100 克）',{exact:true}).fill('10');await page.getByLabel('碳水（克 / 100 克）',{exact:true}).fill('20');await page.getByLabel('脂肪（克 / 100 克）',{exact:true}).fill('5');
  await page.getByRole('button',{name:'按三大营养素估算能量',exact:true}).click();
  await expect(page.getByLabel('能量（千卡 / 100 克）',{exact:true})).toHaveValue('165');
  await page.getByRole('button',{name:'保存食物',exact:true}).click();await expect(page.locator('.library-card')).toContainText('165');
  expect(external).toEqual([]);
});
