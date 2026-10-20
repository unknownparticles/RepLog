import { type Table } from 'dexie';
import { type ZodType } from 'zod';
import { db } from './database';
import { exerciseSchema, foodSchema, goalSchema, journalSchema, mealSchema, meta, profileSchema, templateSchema, weightSchema, workoutSchema, type Exercise, type Food, type Goal, type Journal, type Meal, type Profile, type Template, type Weight, type Workout } from '../domain/model';

type Entity = { id: string; revision: number; updatedAt: string };
export async function transact<T>(generation: string, action: () => Promise<T>): Promise<T> {
  return db.transaction('rw', db.tables, async () => {
    if ((await db.metadata.get('generation'))?.value !== generation) throw new Error('数据已在另一页面恢复或清空，请刷新后再操作');
    return action();
  });
}
async function put<T extends Entity>(table: Table<T, string>, value: T): Promise<T> {
  const previous = await table.get(value.id);
  if (previous && previous.revision !== value.revision) throw new Error('这条记录已在其他页面修改。请重新载入后再编辑；当前输入仍保留。');
  if (!previous && value.revision !== 1) throw new Error('这条记录已被删除，请重新载入');
  const next = { ...value, updatedAt: new Date().toISOString(), revision: previous ? previous.revision + 1 : 1 };
  await table.put(next); return next;
}
async function save<T extends Entity>(table: Table<T, string>, schema: ZodType<T>, value: T, generation: string) {
  const checked = schema.parse(value);
  return transact(generation, () => put(table, checked));
}
export const saveProfile = (value: Profile, generation: string) => save(db.profiles, profileSchema, value, generation);
export const saveFood = (value: Food, generation: string) => save(db.foods, foodSchema, value, generation);
export async function saveExercise(value: Exercise, generation: string) {
  const checked = exerciseSchema.parse(value);
  return transact(generation, async () => {
    const previous = await db.exercises.get(value.id);
    if (previous?.builtin) {
      const { favorite: _a, revision: _b, updatedAt: _c, ...before } = previous;
      const { favorite: _d, revision: _e, updatedAt: _f, ...after } = checked;
      if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('内置动作只读，请复制为个人动作后修改');
    }
    return put(db.exercises, checked);
  });
}
export const saveTemplate = (value: Template, generation: string) => save(db.templates, templateSchema, value, generation);
export async function saveGoal(value: Goal, generation: string) {
  const checked = goalSchema.parse(value);
  return transact(generation, async () => {
    const existing = await db.goals.where('effectiveFrom').equals(value.effectiveFrom).first();
    if (existing && existing.id !== value.id) throw new Error('这一天已有目标，请确认修订原目标');
    return put(db.goals, checked);
  });
}
export const saveWeight = (value: Weight, generation: string) => save(db.weights, weightSchema, value, generation);
export async function saveJournal(value: Journal, generation: string) {
  const checked = journalSchema.parse(value);
  return transact(generation, async () => {
    if (value.restDay && await db.workouts.where('localDate').equals(value.localDate).count()) throw new Error('这一天已有训练，请先移除训练后再标记休息');
    return put(db.journals, checked);
  });
}
async function invalidateDiet(date: string) {
  const journal = await db.journals.where('localDate').equals(date).first();
  if (journal?.dietConfirmed) await put(db.journals, { ...journal, dietConfirmed: false });
}
export async function saveMeal(value: Meal, generation: string) {
  const checked = mealSchema.parse(value);
  return transact(generation, async () => {
    const old = await db.meals.get(value.id);
    for (const item of value.items) if (!await db.foods.get(item.food.id)) throw new Error('食物引用无效，请重新选择');
    const result = await put(db.meals, checked);
    await invalidateDiet(value.localDate);
    if (old && old.localDate !== value.localDate) await invalidateDiet(old.localDate);
    return result;
  });
}
export async function saveWorkout(value: Workout, generation: string) {
  const checked = workoutSchema.parse(value);
  return transact(generation, async () => {
    const journal = await db.journals.where('localDate').equals(value.localDate).first();
    if (journal?.restDay) throw new Error('请先确认取消当日休息标记，再记录训练');
    const draft = await db.workouts.where('status').equals('draft').first();
    if (value.status === 'draft' && draft && draft.id !== value.id) throw new Error('请先继续、结束或放弃现有训练草稿');
    return put(db.workouts, checked);
  });
}
export async function removeRecord(tableName: 'workouts' | 'meals' | 'weights' | 'templates', value: Entity, generation: string) {
  return transact(generation, async () => {
    const table = db.table(tableName);
    const existing = await table.get(value.id);
    if (!existing || existing.revision !== value.revision) throw new Error('记录已变化，请刷新后重试');
    await table.delete(value.id);
    if (tableName === 'meals') await invalidateDiet(existing.localDate);
  });
}
export function journalFor(date: string, journals: Journal[]): Journal { return journals.find(j => j.localDate === date) || { ...meta(), localDate: date, dietConfirmed: false, restDay: false, note: '' }; }
