import { estimatedFoodSchema, type EstimatedFood } from '../services/meal-ai';
import { dateSchema, meta, type Meal, type Food } from '../domain/model';
import { saveFood, saveMeal, transact } from './commands';

export type EstimatedMealDraft = { meal: Meal; foods: Food[] };
export function makeEstimatedMealDraft(items: EstimatedFood[], input: { date: string; timeZone: string; mealType: Meal['mealType']; provider: string }): EstimatedMealDraft {
  dateSchema.parse(input.date);
  if (!items.length || items.length > 20) throw new Error('餐食草稿需要一至二十个食物。');
  const checked = items.map(item => estimatedFoodSchema.parse(item));
  const foods: Food[] = checked.map(item => ({ ...meta(), name:item.name, energy:item.energyPer100g, protein:item.proteinPer100g, carbs:item.carbsPer100g, fat:item.fatPer100g, servingName:'', servingGrams:null, favorite:false, archived:false }));
  const details = checked.map(item => `${item.name}：${item.assumptions.join('；') || '未提供额外假设'}`).join('\n');
  return { foods, meal:{ ...meta(), localDate:input.date, timeZone:input.timeZone, mealType:input.mealType, note:`AI 估算（已人工确认）· ${input.provider}\n${details}`, items:checked.map((item,index) => ({id:crypto.randomUUID(),food:foods[index],grams:item.grams,quantity:item.grams,unit:'克'})) } };
}
export async function saveEstimatedMeal(draft: EstimatedMealDraft, generation: string) {
  return transact(generation,async () => {
    for (const food of draft.foods) await saveFood(food,generation);
    return saveMeal(draft.meal,generation);
  });
}
