import type { Meal } from '../domain/model';
import { makeRecipeMeal, type Recipe } from '../domain/recipes';
import { db } from './database';
import { saveFood, saveMeal, transact } from './commands';

export async function saveRecipeMeal(recipe: Recipe, input: { date: string; timeZone: string; mealType: Meal['mealType']; servings: number }, generation: string) {
  const meal = makeRecipeMeal(recipe, input);
  return transact(generation, async () => {
    // 目录估算作为本次快照；不覆盖用户已编辑或归档的食物。
    for (const item of meal.items) {
      const existing = await db.foods.get(item.food.id);
      if (existing) item.food = { ...item.food, createdAt: existing.createdAt, updatedAt: existing.updatedAt, revision: existing.revision };
      else item.food = await saveFood(item.food, generation);
    }
    return saveMeal(meal, generation);
  });
}
