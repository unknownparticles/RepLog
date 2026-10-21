import Dexie from 'dexie';
import { beforeEach, describe, expect, it } from 'vitest';
import { foodCatalog, catalogFood, foodAliases, matchingFoods } from '../src/domain/food-catalog';
import { comboNutrition, makeComboMeal, matchedLineGrams, parseRegisteredFoods, scaledComboItems } from '../src/domain/healthy-meals';
import { meta } from '../src/domain/model';
import { db, initialize, readSnapshot, RepLogDB } from '../src/db/database';
import { journalFor, saveFood, saveJournal } from '../src/db/commands';
import { registerCatalogFoods, saveMealCombo, saveRegisteredMeal } from '../src/db/healthy-meals';
import { clearData, exportBackup, importBackup, validateBackup } from '../src/db/backup';

const food = (key: string) => catalogFood(foodCatalog.find(entry => entry.key === key)!);
const input = { date: '2026-10-21', timeZone: 'Asia/Shanghai', mealType: '晚餐' as const, servings: 1 };
beforeEach(async () => { await db.delete(); await db.open(); await initialize(); });

describe('参考食物与严格登记匹配', () => {
  it('蔬果肉类可登记，补剂没有虚构通用值；登记不覆盖个人修改和归档', async () => {
    expect(foodCatalog.filter(entry => entry.category === '蔬菜').length).toBeGreaterThanOrEqual(10);
    expect(foodCatalog.filter(entry => entry.category === '水果').length).toBeGreaterThanOrEqual(7);
    for (const key of ['protein-powder', 'mass-gainer']) expect(() => food(key)).toThrow('产品标签');
    const { generation } = await readSnapshot();
    expect(await registerCatalogFoods(['carrot', 'broccoli', 'salt', 'carrot'], generation)).toBe(3);
    const previous = await db.foods.get(food('carrot').id);
    const edited = await saveFood({ ...previous!, energy: 90, archived: true }, generation);
    expect(await registerCatalogFoods(['carrot'], generation)).toBe(0);
    expect(await db.foods.get(edited.id)).toEqual(edited);
    expect(await db.foods.count()).toBe(3);
    await expect(registerCatalogFoods(['apple', 'protein-powder'], generation)).rejects.toThrow('产品标签');
    expect(await db.foods.count()).toBe(3);
  });
  it('别名、克与千克、零热量盐和品牌补剂严格按已登记值计算', () => {
    const powder = { ...food('milk'), ...meta(), name: '甲牌蛋白粉', energy: 410, protein: 78, carbs: 9, fat: 5, servingName: '勺', servingGrams: 32 };
    const gainer = { ...powder, ...meta(), name: '甲牌增肌粉', energy: 390, protein: 25, carbs: 65, fat: 3, servingGrams: 50 };
    const foods = [food('carrot'), food('broccoli'), food('salt'), powder, gainer];
    const lines = parseRegisteredFoods('红萝卜100克，西兰花0.15kg；甲牌蛋白粉1勺\n甲牌增肌粉0.5份，盐2g', foods);
    expect(lines).toHaveLength(5); expect(lines.every(line => line.foodId)).toBe(true);
    const items = lines.map(line => ({ foodId: line.foodId, grams: matchedLineGrams(line, foods.find(food => food.id === line.foodId)!) }));
    expect(items.map(item => item.grams)).toEqual([100, 150, 32, 25, 2]);
    // 41 + 34×1.5 + 410×.32 + 390×.25，盐为已知零。
    expect(comboNutrition(items, foods).energy.value).toBeCloseTo(320.7);
    expect(comboNutrition(items, foods).energy.known).toBe(true);
    expect(parseRegisteredFoods('鸡胸肉（生、去皮）150克，米饭（熟）100克', [food('chicken'), food('rice')])).toHaveLength(2);
  });
  it('未登记、品牌歧义、部分名称、生熟差异、未知数量均不自动采用；归档不参与匹配', () => {
    const a = { ...food('milk'), ...meta(), name: '甲牌蛋白粉' };
    const b = { ...a, ...meta(), name: '乙牌蛋白粉' };
    const lines = parseRegisteredFoods('蛋白粉30克，增肌粉50克，熟鸡胸肉100克，胡萝卜少许', [a, b, food('chicken'), { ...food('carrot'), archived: true }]);
    expect(lines.every(line => !line.foodId)).toBe(true);
    expect(lines[0].candidates).toHaveLength(2);
    expect(lines[3].candidates).toHaveLength(0);
    expect(matchingFoods('胡萝卜', [])).toHaveLength(0);
    expect(foodAliases(food('carrot'))).toContain('红萝卜');
    const duplicate = [{ ...a, name: '蛋白粉' }, { ...b, name: '蛋白粉' }];
    expect(parseRegisteredFoods('蛋白粉30克', duplicate)[0].foodId).toBe('');
    const carrot = food('carrot');
    for (const quantity of [0, -1, NaN, Infinity, null]) expect(() => matchedLineGrams({ quantity, unit: '克' }, carrot)).toThrow();
    expect(() => matchedLineGrams({ quantity: 1, unit: '勺' }, carrot)).toThrow('克重');
    expect(() => makeComboMeal('非法', [{ foodId: '不存在', grams: 100 }], [], input)).toThrow();
    expect(() => scaledComboItems([{ foodId: carrot.id, grams: 10000 }], 10)).toThrow();
    expect(() => scaledComboItems([{ foodId: carrot.id, grams: 0.01 }], 10)).toThrow();
  });
  it('未知营养仍为未知，预览与入账按相同份量舍入计算', () => {
    const carrot = { ...food('carrot'), protein: null };
    const items = [{ foodId: carrot.id, grams: 70.1 }];
    const scaled = scaledComboItems(items, 0.3);
    const totals = comboNutrition(scaled, [carrot]);
    expect(totals.protein).toEqual({ value: 0, known: false });
    const meal = makeComboMeal('测试组合', items, [carrot], { ...input, servings: 0.3 });
    expect(meal.items[0].grams).toBe(21);
    expect(meal.items[0].food.energy * meal.items[0].grams / 100).toBe(totals.energy.value);
    expect(meal.items[0].food.protein).toBeNull();
  });
});

describe('组合保存、入账、迁移与备份', () => {
  it('保存组合不入账，复用时用最新标签；历史快照不改变，食物过时禁止提交', async () => {
    const { generation } = await readSnapshot();
    const carrot = await saveFood(food('carrot'), generation);
    const items = [{ foodId: carrot.id, grams: 100 }];
    const combo = await saveMealCombo({ ...meta(), name: '我的餐', items }, generation);
    expect(await db.meals.count()).toBe(0);
    await saveJournal({ ...journalFor(input.date, []), dietConfirmed: true }, generation);
    const first = await saveRegisteredMeal(combo.name, items, [carrot], input, generation);
    expect((await readSnapshot()).journals[0].dietConfirmed).toBe(false);
    const changed = await saveFood({ ...carrot, energy: 99 }, generation);
    await expect(saveRegisteredMeal(combo.name, items, [carrot], input, generation)).rejects.toThrow('登记已变化');
    const second = await saveRegisteredMeal(combo.name, items, [changed], input, generation);
    expect(second.items[0].food.energy).toBe(99);
    expect((await db.meals.get(first.id))?.items[0].food.energy).toBe(41);
    expect(await db.foods.count()).toBe(1);
    const saved = await saveMealCombo({ ...combo, name: '改名' }, generation);
    await expect(saveMealCombo(combo, generation)).rejects.toThrow('已被修改');
    expect(saved.revision).toBe(2);
    const archived = await saveFood({ ...changed, archived: true }, generation);
    await expect(saveRegisteredMeal(combo.name, items, [archived], input, generation)).rejects.toThrow('登记已变化');
  });
  it('新版备份包含组合并验证引用，旧版备份转换为空组合列表，恢复后旧页面拒绝写入', async () => {
    const { generation } = await readSnapshot(); const carrot = await saveFood(food('carrot'), generation);
    await saveMealCombo({ ...meta(), name: '备份组合', items: [{ foodId: carrot.id, grams: 80 }] }, generation);
    const backup = await exportBackup(); expect(backup.formatVersion).toBe(2);
    expect(backup.entities.mealCombos).toHaveLength(1);
    const broken = structuredClone(backup); broken.entities.foods = [];
    expect(() => validateBackup(broken)).toThrow('组合餐的食物引用');
    await importBackup(backup, generation);
    const restored = await readSnapshot(); expect(restored.mealCombos).toEqual(backup.entities.mealCombos);
    await expect(saveMealCombo({ ...meta(), name: '旧页面', items: [{ foodId: carrot.id, grams: 80 }] }, generation)).rejects.toThrow('恢复或清空');
    const { mealCombos: _, ...legacyEntities } = backup.entities;
    const legacy = validateBackup({ ...backup, formatVersion: 1, databaseVersion: 1, entities: legacyEntities });
    expect(legacy.entities.mealCombos).toEqual([]);
    await importBackup(legacy, restored.generation);
    expect((await readSnapshot()).foods).toHaveLength(1); expect((await readSnapshot()).mealCombos).toHaveLength(0);
    await clearData((await readSnapshot()).generation); expect(await db.mealCombos.count()).toBe(0);
  });
  it('旧数据库无损升级增加组合表，原食物、代际与修订保留', async () => {
    const name = `migration-${crypto.randomUUID()}`;
    const legacy = new Dexie(name);
    legacy.version(1).stores({ profiles: 'id', exercises: 'id, name, mode', foods: 'id, name', workouts: 'id, localDate, status', meals: 'id, localDate, mealType', journals: 'id, &localDate', goals: 'id, &effectiveFrom', weights: 'id, &localDate', templates: 'id', metadata: 'id' });
    await legacy.open(); const carrot = { ...food('carrot'), revision: 7 };
    await legacy.table('foods').add(carrot); await legacy.table('metadata').put({ id: 'generation', value: 'old-generation' }); legacy.close();
    const current = new RepLogDB(name);
    try { await current.open(); expect(await current.foods.get(carrot.id)).toEqual(carrot); expect(await current.mealCombos.count()).toBe(0); expect((await current.metadata.get('generation'))?.value).toBe('old-generation'); }
    finally { await current.delete(); }
  });
  it('餐食写入失败不遗留记录，不取消已记全状态，且不创建新食物', async () => {
    const { generation } = await readSnapshot(); const carrot = await saveFood(food('carrot'), generation);
    await saveJournal({ ...journalFor(input.date, []), dietConfirmed: true }, generation);
    const fail = () => { throw new Error('模拟失败'); }; db.meals.hook('creating', fail);
    try { await expect(saveRegisteredMeal('组合', [{ foodId: carrot.id, grams: 100 }], [carrot], input, generation)).rejects.toThrow('模拟失败'); }
    finally { db.meals.hook('creating').unsubscribe(fail); }
    expect(await db.meals.count()).toBe(0); expect(await db.foods.count()).toBe(1); expect((await readSnapshot()).journals[0].dietConfirmed).toBe(true);
  });
});
