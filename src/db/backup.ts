import { z } from 'zod';
import { db, initialize, readSnapshot } from './database';
import { exerciseSchema, foodSchema, goalSchema, journalSchema, mealSchema, profileSchema, templateSchema, weightSchema, workoutSchema, type Snapshot } from '../domain/model';
import { transact } from './commands';

const entitiesSchema = z.object({
  profile: profileSchema, exercises: z.array(exerciseSchema), foods: z.array(foodSchema),
  workouts: z.array(workoutSchema), meals: z.array(mealSchema), journals: z.array(journalSchema),
  goals: z.array(goalSchema), weights: z.array(weightSchema), templates: z.array(templateSchema),
}).strict();
const backupSchema = z.object({
  formatVersion: z.literal(1), databaseVersion: z.literal(1), appVersion: z.string(), exportedAt: z.string().datetime(),
  entities: entitiesSchema,
}).strict();
export type Backup = z.infer<typeof backupSchema>;
export function validateBackup(raw: unknown): Backup {
  const result = backupSchema.parse(raw);
  const data = result.entities;
  if (data.profile.id !== 'local') throw new Error('备份必须包含唯一的本地档案');
  for (const rows of [data.exercises, data.foods, data.workouts, data.meals, data.journals, data.goals, data.weights, data.templates]) {
    if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('备份含重复标识');
  }
  for (const dates of [data.journals.map(j => j.localDate), data.weights.map(w => w.localDate), data.goals.map(g => g.effectiveFrom)]) {
    if (new Set(dates).size !== dates.length) throw new Error('备份含重复日期');
  }
  if (data.workouts.filter(w => w.status === 'draft').length > 1) throw new Error('备份含多个进行中训练');
  const exercises = new Set(data.exercises.map(e => e.id)), foods = new Set(data.foods.map(f => f.id));
  for (const workout of [...data.workouts, ...data.templates]) for (const entry of workout.exercises) if (!exercises.has(entry.exercise.id)) throw new Error('备份的动作引用不完整');
  for (const meal of data.meals) {
    if (new Set(meal.items.map(i => i.id)).size !== meal.items.length) throw new Error('餐食明细含重复标识');
    for (const item of meal.items) if (!foods.has(item.food.id)) throw new Error('备份的食物引用不完整');
  }
  if (data.journals.some(j => j.restDay && data.workouts.some(w => w.localDate === j.localDate))) throw new Error('备份存在休息与训练冲突');
  return result;
}
export async function exportBackup() {
  const { generation: _, ...entities } = await readSnapshot();
  return validateBackup({ formatVersion: 1, databaseVersion: 1, appVersion: __APP_VERSION__, exportedAt: new Date().toISOString(), entities });
}
export async function importBackup(backup: Backup, generation: string) {
  const { entities } = validateBackup(backup);
  await transact(generation, async () => {
    for (const table of db.tables) await table.clear();
    await db.profiles.add(entities.profile);
    for (const name of ['exercises', 'foods', 'workouts', 'meals', 'journals', 'goals', 'weights', 'templates'] as const) await db.table(name).bulkAdd(entities[name]);
    await db.metadata.put({ id: 'generation', value: crypto.randomUUID() });
  });
}
export async function clearData(generation: string) {
  await transact(generation, async () => {
    for (const table of db.tables) await table.clear();
    await initialize();
  });
}
export function backupCounts(data: Omit<Snapshot, 'generation'>) { return `${data.workouts.length} 次训练 · ${data.meals.length} 份餐食 · ${data.weights.length} 条体重`; }
export function downloadJSON(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
