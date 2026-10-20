import { z } from 'zod';
import { meta, mealSchema, type Food, type Meal } from './model';

export const recipeSource = {
  name: 'HowToCook', repository: 'https://github.com/Anduin2017/HowToCook',
  commit: '0e106eea348c734fe1586f781202994439cf98a5', license: 'Unlicense',
};

// 每百克可食部分的通用估算，生重 / 干重；不代表上游提供或检测值。
export const recipeIngredients = {
  chicken: ['鸡胸肉（生、去皮）', 120, 22.5, 0, 2.6],
  oats: ['燕麦片（干）', 379, 13.2, 67.7, 6.5],
  milk: ['纯牛奶', 61, 3.2, 4.8, 3.3],
  egg: ['鸡蛋（去壳生重）', 143, 12.6, 0.7, 9.5],
  spinach: ['菠菜', 23, 2.9, 3.6, 0.4],
  oil: ['植物油', 900, 0, 0, 100],
  sesameOil: ['芝麻油', 900, 0, 0, 100],
  soy: ['生抽', 53, 8.1, 4.9, 0.6],
  vinegar: ['米醋', 18, 0, 0.6, 0],
  sugar: ['白糖', 400, 0, 100, 0],
  ginger: ['姜', 80, 1.8, 17.8, 0.8],
  garlic: ['大蒜', 149, 6.4, 33.1, 0.5],
  broccoli: ['西兰花', 34, 2.8, 6.6, 0.4],
  shrimp: ['虾仁（生、去壳）', 85, 20.1, 0, 0.5],
  soba: ['荞麦面（干）', 336, 14.4, 70.6, 0.7],
  cucumber: ['黄瓜', 15, 0.7, 3.6, 0.1],
  carrot: ['胡萝卜', 41, 0.9, 9.6, 0.2],
  fish: ['鲈鱼（生、净鱼肉）', 97, 18.4, 0, 2],
  scallion: ['小葱', 32, 1.8, 7.3, 0.2],
  salt: ['盐', 0, 0, 0, 0],
  water: ['水', 0, 0, 0, 0],
} satisfies Record<string, [string, number, number, number, number]>;
export type IngredientKey = keyof typeof recipeIngredients;
export type Recipe = {
  id: string; name: string; category: '主食早餐' | '蛋白配菜' | '蔬菜'; minutes: number;
  vegetarian: boolean; description: string; sourcePath: string; adaptation: string;
  ingredients: { key: IngredientKey; grams: number }[]; steps: string[];
};
export const recipes: Recipe[] = [
  {
    id: 'chicken', name: '凉拌鸡丝', category: '蛋白配菜', minutes: 25, vegetarian: false,
    description: '去皮鸡胸肉搭配清爽醋汁，可配米饭和蔬菜。',
    sourcePath: 'dishes/meat_dish/凉拌鸡丝/凉拌鸡丝.md', adaptation: '原方量化为一人份，减少糖盐；煮肉用姜片与水不计入摄入，酱汁按全部吃完估算。',
    ingredients: [{ key: 'chicken', grams: 200 }, { key: 'sesameOil', grams: 4 }, { key: 'soy', grams: 5 }, { key: 'vinegar', grams: 5 }, { key: 'sugar', grams: 2 }, { key: 'salt', grams: 0.5 }],
    steps: ['鸡胸肉充分解冻，锅中加水和少量姜片，放入鸡胸肉煮开后转中小火。', '根据厚度煮至中心完全熟透，中心温度达到 74℃；捞出稍凉，用干净工具顺纹理撕成细丝。', '把芝麻油、生抽、米醋、糖和盐拌匀，倒入鸡丝混合；姜片和煮肉水丢弃。'],
  },
  {
    id: 'oat-pancake', name: '燕麦鸡蛋饼', category: '主食早餐', minutes: 15, vegetarian: true,
    description: '蛋奶和燕麦做成咸口早餐，加入菠菜增加蔬菜。',
    sourcePath: 'dishes/breakfast/燕麦鸡蛋饼.md', adaptation: '原方牛奶用量存在差异，统一为 100 克；黄油改为定量植物油，鸡蛋按去壳重量计算。',
    ingredients: [{ key: 'oats', grams: 50 }, { key: 'egg', grams: 100 }, { key: 'milk', grams: 100 }, { key: 'spinach', grams: 50 }, { key: 'oil', grams: 3 }],
    steps: ['菠菜洗净切碎；牛奶与燕麦混合，静置至稍微吸水。', '打入鸡蛋，加入菠菜搅拌均匀。', '不粘锅刷上定量植物油，倒入面糊摊平，小火煎约 3 分钟。', '翻面再煎约 2–3 分钟，确认内部蛋液完全凝固再装盘。'],
  },
  {
    id: 'milk-oats', name: '牛奶燕麦配鸡蛋', category: '主食早餐', minutes: 10, vegetarian: true,
    description: '燕麦与牛奶搭配熟鸡蛋，适合作为便捷早餐。',
    sourcePath: 'dishes/breakfast/牛奶燕麦.md', adaptation: '牛奶由体积改为称重，煎蛋改为水煮蛋，不额外加油。',
    ingredients: [{ key: 'oats', grams: 40 }, { key: 'milk', grams: 280 }, { key: 'egg', grams: 50 }],
    steps: ['鸡蛋洗净另锅水煮约 10 分钟至全熟，冷却后剥壳。', '牛奶倒入锅中，加入燕麦，小火搅拌煮熟，具体时间参考燕麦包装。', '燕麦装碗，搭配去壳鸡蛋；份量按所列食材称量。'],
  },
  {
    id: 'soba', name: '蔬菜酱拌荞麦面', category: '主食早餐', minutes: 15, vegetarian: true,
    description: '主食搭配黄瓜胡萝卜，适合配一份蛋白配菜。',
    sourcePath: 'dishes/staple/酱拌荞麦面/酱拌荞麦面.md', adaptation: '荞麦面明确为干重 80 克，蔬菜改为克重；老干妈改为生抽、米醋和定量芝麻油。',
    ingredients: [{ key: 'soba', grams: 80 }, { key: 'cucumber', grams: 100 }, { key: 'carrot', grams: 50 }, { key: 'soy', grams: 8 }, { key: 'vinegar', grams: 10 }, { key: 'sesameOil', grams: 3 }],
    steps: ['黄瓜和胡萝卜洗净切丝，胡萝卜可焯水后沥干。', '按包装说明煮熟称好的干荞麦面，捞出沥水。', '将生抽、米醋、芝麻油调匀，与面条和蔬菜拌匀。'],
  },
  {
    id: 'broccoli', name: '少油蒜蓉西兰花', category: '蔬菜', minutes: 10, vegetarian: true,
    description: '定量用油的蔬菜配菜，搭配主食和蛋白质食物。',
    sourcePath: 'dishes/vegetable_dish/蒜蓉西兰花.md', adaptation: '按一人份蔬菜计算，油减为 3 克，省略蚝油和白糖；焯水不计入摄入。',
    ingredients: [{ key: 'broccoli', grams: 200 }, { key: 'garlic', grams: 8 }, { key: 'soy', grams: 5 }, { key: 'oil', grams: 3 }],
    steps: ['西兰花洗净切小朵，蒜去皮切末。', '沸水中焯西兰花约 2–3 分钟至熟，捞出沥干。', '锅中放定量植物油，小火炒香蒜末，加生抽与少量水煮开。', '淋在西兰花上拌匀。'],
  },
  {
    id: 'shrimp', name: '清煮虾仁', category: '蛋白配菜', minutes: 10, vegetarian: false,
    description: '不额外加油的虾仁，蘸少量生抽和醋。',
    sourcePath: 'dishes/aquatic/白灼虾/白灼虾.md', adaptation: '改用 150 克去壳生虾仁明确可食重量，改为水煮，省略热油蘸汁；姜片与煮虾水不计入摄入。',
    ingredients: [{ key: 'shrimp', grams: 150 }, { key: 'soy', grams: 5 }, { key: 'vinegar', grams: 5 }],
    steps: ['虾仁充分解冻，去虾线后洗净；锅中烧水，可放少量姜片。', '水沸后加入虾仁，煮至完全变色、中心不透明且熟透；时间随大小调整。', '捞出沥干，蘸生抽和米醋调成的汁食用；估算包含全部蘸汁。'],
  },
  {
    id: 'egg-custard', name: '嫩滑蒸蛋', category: '蛋白配菜', minutes: 20, vegetarian: true,
    description: '两颗鸡蛋蒸一碗，适合搭配蔬菜和主食。',
    sourcePath: 'dishes/vegetable_dish/鸡蛋羹/鸡蛋羹.md', adaptation: '鸡蛋按去壳 100 克、水 150 克计量，减少盐和生抽，香油定量；加入的水计入食材份量。',
    ingredients: [{ key: 'egg', grams: 100 }, { key: 'water', grams: 150 }, { key: 'soy', grams: 5 }, { key: 'sesameOil', grams: 2 }, { key: 'salt', grams: 0.5 }],
    steps: ['鸡蛋打散，加入盐和温水搅匀，过滤泡沫。', '装入耐热蒸碗并盖上耐热碟，锅中水沸后中火蒸约 10 分钟，再焖 5 分钟。', '确认蛋液完全凝固、熟透后，淋入定量生抽和芝麻油。'],
  },
  {
    id: 'steamed-fish', name: '葱姜清蒸鲈鱼', category: '蛋白配菜', minutes: 25, vegetarian: false,
    description: '净鱼肉按生重称量，葱姜调味并控制用油。',
    sourcePath: 'dishes/aquatic/清蒸鲈鱼/清蒸鲈鱼.md', adaptation: '整条鱼改为 200 克净鱼肉；豉油改为生抽，植物油减为 3 克；食材按全部食用估算。',
    ingredients: [{ key: 'fish', grams: 200 }, { key: 'ginger', grams: 5 }, { key: 'scallion', grams: 5 }, { key: 'soy', grams: 8 }, { key: 'oil', grams: 3 }],
    steps: ['净鱼肉洗净擦干，姜切丝，葱切段，铺在鱼肉上下。', '蒸锅水烧开后放入鱼肉，大火蒸约 10 分钟，随厚度调整至中心完全熟透。', '出锅淋上生抽，定量油加热后淋在葱姜上；食用时注意鱼刺。'],
  },
];

export const recipeServingsSchema = z.number().finite().min(0.1).max(10).multipleOf(0.1);
export function recipeSourceUrl(recipe: Recipe) {
  return `${recipeSource.repository}/blob/${recipeSource.commit}/${recipe.sourcePath.split('/').map(encodeURIComponent).join('/')}`;
}
export function scaledIngredients(recipe: Recipe, servings: number) {
  recipeServingsSchema.parse(servings);
  return recipe.ingredients.map(item => ({ ...item, grams: Math.round(item.grams * servings * 10) / 10 }));
}
export function recipeNutrition(recipe: Recipe, servings = 1) {
  return scaledIngredients(recipe, servings).reduce((total, item) => {
    const [, energy, protein, carbs, fat] = recipeIngredients[item.key];
    return { energy: total.energy + energy * item.grams / 100, protein: total.protein + protein * item.grams / 100, carbs: total.carbs + carbs * item.grams / 100, fat: total.fat + fat * item.grams / 100 };
  }, { energy: 0, protein: 0, carbs: 0, fat: 0 });
}
export function recipeFoods(recipe: Recipe): Food[] {
  return recipe.ingredients.map(({ key }) => {
    const [name, energy, protein, carbs, fat] = recipeIngredients[key];
    return { ...meta(`recipe-ingredient-${key}`), name: `${name}（食谱估算）`, energy, protein, carbs, fat, servingName: '', servingGrams: null, favorite: false, archived: false };
  });
}
export function makeRecipeMeal(recipe: Recipe, input: { date: string; timeZone: string; mealType: Meal['mealType']; servings: number }): Meal {
  const foods = recipeFoods(recipe);
  return mealSchema.parse({
    ...meta(), localDate: input.date, timeZone: input.timeZone, mealType: input.mealType,
    note: `健身食谱 · ${recipe.name} · ${input.servings} 份\n营养为通用食材估算，按可食生重 / 干重及所列用油计算，非成品熟重。\n改编：${recipe.adaptation}\n来源：${recipeSource.name}（${recipeSource.license}）\n${recipeSourceUrl(recipe)}`,
    items: scaledIngredients(recipe, input.servings).map((item, index) => ({ id: crypto.randomUUID(), food: foods[index], grams: item.grams, quantity: item.grams, unit: '克' })),
  });
}
