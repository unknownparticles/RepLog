import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, initialize, readSnapshot } from '../src/db/database';
import { clearData, exportBackup, importBackup } from '../src/db/backup';
import { journalFor, saveFood, saveJournal } from '../src/db/commands';
import { saveRecipeMeal } from '../src/db/recipe-meal';
import { makeRecipeMeal, recipeFoods, recipeNutrition, recipes, recipeSource, recipeSourceUrl } from '../src/domain/recipes';
import { foodSchema } from '../src/domain/model';
import manifest from '../resources/recipes/manifest.json';

const input = { date: '2026-10-21', timeZone: 'Asia/Shanghai', mealType: '午餐' as const, servings: 1 };
beforeEach(async () => { await db.delete(); await db.open(); await initialize(); });

describe('食谱来源与份量', () => {
  it('实际引入固定版本原文和许可，每道食谱有对应原文并且标识唯一', () => {
    expect(recipeSource.commit).toBe(manifest.commit);
    expect(new Set(recipes.map(recipe => recipe.id)).size).toBe(recipes.length);
    expect(recipes).toHaveLength(manifest.files.length);
    for (const file of manifest.files) {
      const bytes = readFileSync(`resources/recipes/HowToCook/${file.path}`);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
      expect(recipes.some(recipe => recipe.sourcePath === file.path)).toBe(true);
    }
    expect(readFileSync('public/recipes/LICENSE.txt', 'utf8')).toBe(readFileSync('resources/recipes/HowToCook/LICENSE', 'utf8'));
    for (const recipe of recipes) {
      expect(recipeSourceUrl(recipe)).toContain(`/blob/${manifest.commit}/`);
      recipeFoods(recipe).forEach(food => expect(foodSchema.safeParse(food).success).toBe(true));
      expect(recipe.steps.length).toBeGreaterThan(1);
      expect(recipe.adaptation).toBeTruthy();
    }
  });
  it('独立手算示例、半份营养、边界份量与入账快照一致', () => {
    const chicken = recipes.find(recipe => recipe.id === 'chicken')!;
    expect(recipeNutrition(chicken).energy).toBeCloseTo(287.55);
    expect(recipeNutrition(chicken).protein).toBeCloseTo(45.405);
    expect(recipeNutrition(chicken, 0.5).energy).toBeCloseTo(143.775);
    for (const recipe of recipes) for (const servings of [0.1, 0.5, 1, 10]) {
      const meal = makeRecipeMeal(recipe, { ...input, servings });
      const energy = meal.items.reduce((sum, item) => sum + item.food.energy * item.grams / 100, 0);
      expect(energy).toBeCloseTo(recipeNutrition(recipe, servings).energy);
      expect(meal.items.every(item => item.grams > 0)).toBe(true);
      expect(meal.note).toContain(manifest.commit);
    }
    for (const servings of [0, -1, NaN, Infinity, 0.15, 10.1]) expect(() => makeRecipeMeal(chicken, { ...input, servings })).toThrow();
    expect(() => makeRecipeMeal(chicken, { ...input, date: '2026-02-30' })).toThrow();
  });
});

describe('食谱计入饮食', () => {
  it('只在确认时创建食材，撤销完整确认，重复入账保留个人食物与历史快照，并可备份恢复', async () => {
    const initial = await readSnapshot();
    const recipe = recipes[0];
    makeRecipeMeal(recipe, input);
    expect(await db.foods.count()).toBe(0); expect(await db.meals.count()).toBe(0);
    await saveJournal({ ...journalFor(input.date, []), dietConfirmed: true }, initial.generation);
    const saved = await saveRecipeMeal(recipe, { ...input, servings: 0.5 }, initial.generation);
    expect(saved.localDate).toBe(input.date); expect(saved.mealType).toBe('午餐');
    expect(saved.items[0].grams).toBe(100);
    expect((await readSnapshot()).journals[0].dietConfirmed).toBe(false);
    const food = (await db.foods.get(saved.items[0].food.id))!;
    const edited = await saveFood({ ...food, name: '个人修改', energy: 999, archived: true, favorite: true }, initial.generation);
    const second = await saveRecipeMeal(recipe, input, initial.generation);
    expect(await db.foods.count()).toBe(recipe.ingredients.length);
    expect(await db.foods.get(food.id)).toEqual(edited);
    expect(second.items[0].food.energy).toBe(120);
    expect((await db.meals.get(saved.id))?.items[0].food.energy).toBe(120);
    const backup = await exportBackup(); await importBackup(backup, initial.generation);
    expect((await db.meals.get(saved.id))?.note).toBe(saved.note);
    expect(await db.meals.count()).toBe(2);
  });
  it('写餐食失败时回滚食材和确认状态；清空前的页面不能写回', async () => {
    const { generation } = await readSnapshot();
    await saveJournal({ ...journalFor(input.date, []), dietConfirmed: true }, generation);
    const fail = () => { throw new Error('模拟写入失败'); };
    db.meals.hook('creating', fail);
    try { await expect(saveRecipeMeal(recipes[0], input, generation)).rejects.toThrow('模拟写入失败'); }
    finally { db.meals.hook('creating').unsubscribe(fail); }
    expect(await db.foods.count()).toBe(0); expect(await db.meals.count()).toBe(0);
    expect((await readSnapshot()).journals[0].dietConfirmed).toBe(true);
    await clearData(generation);
    await expect(saveRecipeMeal(recipes[0], input, generation)).rejects.toThrow('恢复或清空');
    expect(await db.foods.count()).toBe(0); expect(await db.meals.count()).toBe(0);
  });
});
