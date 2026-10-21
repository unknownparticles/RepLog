import { z } from 'zod';
import { meta, mealSchema, type Food, type Meal } from './model';
import { foodAliases, matchingFoods, normalizeFoodName } from './food-catalog';

export { comboItemSchema, comboItemsSchema, type ComboItem } from './meal-combo-schema';
import { comboItemSchema, comboItemsSchema, type ComboItem } from './meal-combo-schema';
export type MatchedLine = { text: string; name: string; quantity: number | null; unit: string; foodId: string; candidates: Food[]; issue: string };

export function parseRegisteredFoods(text: string, foods: Food[]): MatchedLine[] {
  if (text.length > 2000) throw new Error('请将餐食描述控制在两千字以内');
  const lines: string[] = []; let depth = 0; let current = '';
  for (const char of text) {
    if ('(（'.includes(char)) depth++;
    if (')）'.includes(char)) depth = Math.max(0, depth - 1);
    if (!depth && /[\n,，、;；+＋]/.test(char)) { lines.push(current); current = ''; }
    else current += char;
  }
  lines.push(current);
  return lines.map(line => line.trim()).filter(Boolean).map(line => {
    // 只有数字及显式的克 / 千克 / 登记份量能换算；不猜测“一点”“一碗”。
    const match = line.normalize('NFKC').match(/^(.+?)\s*([+-]?\d+(?:\.\d+)?)\s*(千克|公斤|kg|克|g|份|勺|杯|碗)$/i);
    const name = match ? match[1].replace(/[:：]\s*$/, '').trim() : line;
    const candidates = matchingFoods(name, foods);
    const exact = candidates.filter(food => foodAliases(food).includes(normalizeFoodName(name)));
    const foodId = exact.length === 1 && candidates.length === 1 ? exact[0].id : '';
    let issue = !match ? '需要填写明确数量和单位，例如 100克 或 1勺' : '';
    if (!candidates.length) issue = '未找到已登记食物，请先登记或手动选择';
    else if (!foodId) issue = '名称存在品牌、规格或生熟差异，请选择具体食物';
    return { text: line, name, quantity: match ? Number(match[2]) : null, unit: match?.[3].toLowerCase() || '克', foodId, candidates, issue };
  });
}

export function matchedLineGrams(line: Pick<MatchedLine, 'quantity' | 'unit'>, food: Food): number {
  if (line.quantity === null || !Number.isFinite(line.quantity) || line.quantity <= 0) throw new Error('请填写大于零的明确数量');
  let grams: number;
  if (['克', 'g'].includes(line.unit)) grams = line.quantity;
  else if (['千克', '公斤', 'kg'].includes(line.unit)) grams = line.quantity * 1000;
  else {
    if (!food.servingGrams || (line.unit !== '份' && line.unit !== food.servingName)) throw new Error('该食物未登记对应单位的克重，请用克或补充每份克重');
    grams = line.quantity * food.servingGrams;
  }
  return comboItemSchema.parse({ foodId: food.id, grams: Math.round(grams * 10) / 10 }).grams;
}

export function resolveCombo(items: ComboItem[], foods: Food[]) {
  return comboItemsSchema.parse(items).map(item => {
    const food = foods.find(food => food.id === item.foodId && !food.archived);
    if (!food) throw new Error('组合中的食物未登记或已归档，请重新选择');
    return { food, grams: item.grams };
  });
}
export function comboNutrition(items: ComboItem[], foods: Food[]) {
  const resolved = resolveCombo(items, foods);
  return Object.fromEntries((['energy', 'protein', 'carbs', 'fat'] as const).map(key => {
    const known = resolved.every(item => item.food[key] !== null);
    const value = resolved.reduce((sum, item) => sum + (item.food[key] ?? 0) * item.grams / 100, 0);
    return [key, { value, known }];
  })) as Record<'energy' | 'protein' | 'carbs' | 'fat', { value: number; known: boolean }>;
}

export function scaledComboItems(items: ComboItem[], servings: number): ComboItem[] {
  z.number().finite().min(0.1).max(10).multipleOf(0.1).parse(servings);
  return comboItemsSchema.parse(comboItemsSchema.parse(items).map(item => ({ ...item, grams: Math.round(item.grams * servings * 10) / 10 })));
}

export function makeComboMeal(name: string, items: ComboItem[], foods: Food[], input: { date: string; timeZone: string; mealType: Meal['mealType']; servings: number }): Meal {
  return mealSchema.parse({ ...meta(), localDate: input.date, timeZone: input.timeZone, mealType: input.mealType,
    note: `健康组合餐 · ${name.trim() || '我的组合'} · ${input.servings} 份\n仅使用已登记食物的营养数据；记录保留确认时快照。`,
    items: resolveCombo(scaledComboItems(items, input.servings), foods).map(({ food, grams }) => {
      return { id: crypto.randomUUID(), food: structuredClone(food), grams, quantity: grams, unit: '克' };
    }),
  });
}

// 自行编写的搭配示例，不复制外站食谱；按已有登记匹配，缺少的食物不会自动创建。
export const healthyMealIdeas = [
  { name: '鸡胸蔬菜米饭餐', description: '蛋白质食物 + 两种蔬菜 + 主食；烹调油和盐另外按实际用量加入。', items: [{ name: '鸡胸肉（生、去皮）', grams: 150 }, { name: '西兰花', grams: 150 }, { name: '胡萝卜', grams: 80 }, { name: '米饭（熟）', grams: 150 }] },
  { name: '牛肉彩蔬糙米餐', description: '瘦肉搭配蔬菜与糙米饭，克重可随全天目标调整。', items: [{ name: '瘦牛肉（生）', grams: 150 }, { name: '甜椒', grams: 100 }, { name: '菠菜', grams: 100 }, { name: '糙米饭（熟）', grams: 150 }] },
  { name: '燕麦奶蛋水果早餐', description: '燕麦、蛋奶与水果搭配；食用前分别煮熟燕麦和鸡蛋。', items: [{ name: '燕麦片（干）', grams: 40 }, { name: '纯牛奶', grams: 250 }, { name: '鸡蛋（去壳生重）', grams: 50 }, { name: '香蕉', grams: 100 }] },
  { name: '豆腐蔬菜红薯餐', description: '豆制品提供蛋白，搭配蔬菜和薯类；使用实际烹调油量。', items: [{ name: '北豆腐', grams: 200 }, { name: '西兰花', grams: 150 }, { name: '白蘑菇', grams: 100 }, { name: '红薯（生）', grams: 150 }] },
];
