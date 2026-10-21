import { catalogFood, foodCatalog, matchingFoods } from '../domain/food-catalog';
import { makeComboMeal, resolveCombo, type ComboItem } from '../domain/healthy-meals';
import { mealComboSchema, type Meal, type MealCombo } from '../domain/model';
import { saveFood, saveMeal, transact } from './commands';
import { db } from './database';

export async function registerCatalogFoods(keys: string[], generation: string) {
  return transact(generation, async () => {
    const existing = await db.foods.toArray(); let count = 0;
    for (const key of new Set(keys)) {
      const entry = foodCatalog.find(entry => entry.key === key);
      if (!entry) throw new Error('食物目录条目不存在');
      const food = catalogFood(entry);
      // 已有登记（包括归档）不覆盖，也不重新创建同名条目。
      if (existing.some(item => item.id === food.id) || matchingFoods(entry.name, existing.map(item => ({ ...item, archived: false }))).some(item => item.name === entry.name)) continue;
      existing.push(await saveFood(food, generation)); count++;
    }
    return count;
  });
}

export async function saveMealCombo(value: MealCombo, generation: string) {
  const checked = mealComboSchema.parse(value);
  return transact(generation, async () => {
    resolveCombo(checked.items, await db.foods.toArray());
    const old = await db.mealCombos.get(checked.id);
    if (old && old.revision !== checked.revision || !old && checked.revision !== 1) throw new Error('组合餐已被修改或删除，请重新载入');
    const next = { ...checked, revision: old ? old.revision + 1 : 1, updatedAt: new Date().toISOString() };
    await db.mealCombos.put(next); return next;
  });
}

export async function saveRegisteredMeal(name: string, items: ComboItem[], expectedFoods: { id: string; revision: number }[], input: { date: string; timeZone: string; mealType: Meal['mealType']; servings: number }, generation: string) {
  return transact(generation, async () => {
    const foods = await db.foods.toArray();
    for (const item of items) {
      const current = foods.find(food => food.id === item.foodId);
      const expected = expectedFoods.find(food => food.id === item.foodId);
      if (!current || current.archived || !expected || expected.revision !== current.revision) throw new Error('食物登记已变化，请重新载入后确认热量');
    }
    return saveMeal(makeComboMeal(name, items, foods, input), generation);
  });
}
