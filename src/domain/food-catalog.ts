import { meta, type Food } from './model';

export const foodCategories = ['蔬菜', '水果', '肉蛋鱼虾', '奶豆', '主食', '调味', '补剂'] as const;
export type FoodCategory = typeof foodCategories[number];
export type CatalogFood = { key: string; name: string; category: FoodCategory; aliases: string[]; nutrition: [number, number, number, number] | null; note: string };
// 通用参考值，每百克可食部分；必须经用户确认登记后才能参与组合计算。
const entries: [string, string, FoodCategory, number, number, number, number, string[]?, string?][] = [
  ['carrot', '胡萝卜', '蔬菜', 41, 0.9, 9.6, 0.2, ['红萝卜']],
  ['broccoli', '西兰花', '蔬菜', 34, 2.8, 6.6, 0.4, ['绿菜花']],
  ['spinach', '菠菜', '蔬菜', 23, 2.9, 3.6, 0.4],
  ['cucumber', '黄瓜', '蔬菜', 15, 0.7, 3.6, 0.1],
  ['tomato', '番茄', '蔬菜', 18, 0.9, 3.9, 0.2, ['西红柿']],
  ['lettuce', '生菜', '蔬菜', 15, 1.4, 2.9, 0.2],
  ['cabbage', '白菜', '蔬菜', 13, 1.5, 2.2, 0.2],
  ['cauliflower', '菜花', '蔬菜', 25, 1.9, 5, 0.3, ['花菜']],
  ['mushroom', '白蘑菇', '蔬菜', 22, 3.1, 3.3, 0.3, ['口蘑']],
  ['pepper', '甜椒', '蔬菜', 31, 1, 6, 0.3, ['彩椒']],
  ['apple', '苹果', '水果', 52, 0.3, 13.8, 0.2],
  ['banana', '香蕉', '水果', 89, 1.1, 22.8, 0.3],
  ['orange', '橙子', '水果', 47, 0.9, 11.8, 0.1, ['橙']],
  ['kiwi', '猕猴桃', '水果', 61, 1.1, 14.7, 0.5, ['奇异果']],
  ['strawberry', '草莓', '水果', 32, 0.7, 7.7, 0.3],
  ['blueberry', '蓝莓', '水果', 57, 0.7, 14.5, 0.3],
  ['pear', '梨', '水果', 57, 0.4, 15.2, 0.1],
  ['chicken', '鸡胸肉（生、去皮）', '肉蛋鱼虾', 120, 22.5, 0, 2.6, ['鸡胸肉']],
  ['beef', '瘦牛肉（生）', '肉蛋鱼虾', 137, 21, 0, 5.5, ['瘦牛肉']],
  ['pork', '猪里脊（生）', '肉蛋鱼虾', 120, 22, 0, 3.5, ['猪里脊', '猪里脊肉']],
  ['shrimp', '虾仁（生、去壳）', '肉蛋鱼虾', 85, 20.1, 0, 0.5, ['虾仁']],
  ['fish', '鲈鱼（生、净鱼肉）', '肉蛋鱼虾', 97, 18.4, 0, 2, ['鲈鱼']],
  ['salmon', '三文鱼（生、净鱼肉）', '肉蛋鱼虾', 208, 20.4, 0, 13.4, ['三文鱼']],
  ['egg', '鸡蛋（去壳生重）', '肉蛋鱼虾', 143, 12.6, 0.7, 9.5, ['鸡蛋']],
  ['egg-white', '蛋清（生）', '肉蛋鱼虾', 52, 10.9, 0.7, 0.2, ['蛋清', '鸡蛋白']],
  ['milk', '纯牛奶', '奶豆', 61, 3.2, 4.8, 3.3],
  ['yogurt', '原味无糖酸奶', '奶豆', 63, 5.3, 7, 1.6, [], '品牌差异较大，优先修改为包装标签。'],
  ['tofu', '北豆腐', '奶豆', 98, 12.2, 2.6, 4.8],
  ['edamame', '毛豆仁', '奶豆', 121, 11.9, 8.9, 5.2],
  ['oats', '燕麦片（干）', '主食', 379, 13.2, 67.7, 6.5, ['燕麦片', '燕麦']],
  ['rice', '米饭（熟）', '主食', 130, 2.7, 28.2, 0.3, ['熟米饭', '米饭'], '按煮熟后的可食重量计算。'],
  ['brown-rice', '糙米饭（熟）', '主食', 123, 2.7, 25.6, 1, ['糙米饭'], '按煮熟后的可食重量计算。'],
  ['potato', '土豆（生）', '主食', 77, 2, 17.5, 0.1, ['土豆', '马铃薯']],
  ['sweet-potato', '红薯（生）', '主食', 86, 1.6, 20.1, 0.1, ['红薯', '番薯']],
  ['soba', '荞麦面（干）', '主食', 336, 14.4, 70.6, 0.7, ['荞麦面']],
  ['salt', '盐', '调味', 0, 0, 0, 0, ['食盐'], '热量为零也要记录实际用量；热量不代表钠含量。'],
  ['oil', '植物油', '调味', 900, 0, 0, 100, ['食用油']],
  ['sesame-oil', '芝麻油', '调味', 900, 0, 0, 100, ['香油']],
  ['soy', '生抽', '调味', 53, 8.1, 4.9, 0.6],
];
export const foodCatalog: CatalogFood[] = [
  ...entries.map(([key, name, category, energy, protein, carbs, fat, aliases = [], note]) => ({ key, name, category, aliases, nutrition: [energy, protein, carbs, fat] as [number, number, number, number], note: note || '通用营养估算；按可食生重称量，包装食品优先使用标签。' })),
  { key: 'protein-powder', name: '蛋白粉', category: '补剂', aliases: [], nutrition: null, note: '请填写品牌、口味及每百克营养标签；一勺克重按包装填写。' },
  { key: 'mass-gainer', name: '增肌粉', category: '补剂', aliases: [], nutrition: null, note: '各产品配方不同，请填写具体产品营养标签和每份克重。' },
];

export function catalogFood(entry: CatalogFood): Food {
  if (!entry.nutrition) throw new Error('补剂需要按具体产品标签登记，不能使用通用热量');
  const [energy, protein, carbs, fat] = entry.nutrition;
  return { ...meta(`fitness-food-${entry.key}`), name: entry.name, energy, protein, carbs, fat, servingName: '', servingGrams: null, favorite: false, archived: false };
}

export function normalizeFoodName(name: string) {
  return name.normalize('NFKC').toLowerCase().replace(/[\s·・_\-]/g, '').replace(/（/g, '(').replace(/）/g, ')');
}
export function foodAliases(food: Food): string[] {
  const normalized = normalizeFoodName(food.name);
  // 仅对确切的基础食物名扩展别名，保留生熟和品牌差异。
  const base = foodCatalog.find(entry => [entry.name, ...entry.aliases].some(name => normalizeFoodName(name) === normalized)
    || food.id === `fitness-food-${entry.key}` && normalizeFoodName(entry.name) === normalized);
  return [...new Set([food.name, ...(base?.aliases || []), ...(base ? [base.name] : [])].map(normalizeFoodName))];
}
export function matchingFoods(name: string, foods: Food[]): Food[] {
  const query = normalizeFoodName(name);
  if (!query) return [];
  const active = foods.filter(food => !food.archived);
  const exact = active.filter(food => foodAliases(food).includes(query));
  if (exact.length) return exact;
  // 生熟食物、品牌与补剂的部分匹配仅供人工选择，不自动认定相同。
  return active.filter(food => foodAliases(food).some(alias => alias.includes(query) || query.includes(alias)));
}
