import { z } from 'zod';
import { isValid, parseISO, format } from 'date-fns';
import { equipmentCatalog } from './catalog';
import { comboItemsSchema } from './meal-combo-schema';

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = parseISO(value);
  return isValid(date) && format(date, 'yyyy-MM-dd') === value;
}, '日期无效');
const numeric = z.number().finite().nonnegative();
const optionalNutrition = numeric.nullable();
const metadata = {
  id: z.string().min(1), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), revision: z.number().int().positive(),
};
export const profileSchema = z.object({
  ...metadata, timeZone: z.string().refine(value => { try { new Intl.DateTimeFormat('zh-CN', { timeZone: value }); return true; } catch { return false; } }),
  theme: z.enum(['system', 'light', 'dark']),
}).strict();
export const modes = ['weighted', 'bodyweight', 'assisted', 'timed', 'cardio'] as const;
export const exerciseSchema = z.object({
  ...metadata, name: z.string().trim().min(1), aliases: z.array(z.string()),
  primaryMuscles: z.array(z.string().min(1)).min(1), secondaryMuscles: z.array(z.string()),
  equipment: z.array(z.string()), optionalEquipment: z.array(z.string()),
  mode: z.enum(modes), instructions: z.string(), builtin: z.boolean(), favorite: z.boolean(), archived: z.boolean(),
}).strict().refine(e => new Set(e.primaryMuscles).size === e.primaryMuscles.length && !e.secondaryMuscles.some(m => e.primaryMuscles.includes(m)), '主要与辅助肌群不能重复');
export const foodSchema = z.object({
  ...metadata, name: z.string().trim().min(1), energy: numeric,
  protein: optionalNutrition, carbs: optionalNutrition, fat: optionalNutrition,
  servingName: z.string(), servingGrams: z.number().finite().positive().nullable(),
  favorite: z.boolean(), archived: z.boolean(),
}).strict();
export const setSchema = z.object({
  id: z.string().min(1), kind: z.enum(['work', 'warmup']), completed: z.boolean(),
  reps: z.number().finite().int().positive().nullable(), loadGrams: z.number().finite().int().nonnegative().nullable(),
  assistanceGrams: z.number().finite().int().nonnegative().nullable(),
  durationSeconds: z.number().finite().int().positive().nullable(), distanceMeters: z.number().finite().int().nonnegative().nullable(),
  rpe: z.number().min(1).max(10).nullable(),
}).strict();
export const workoutExerciseSchema = z.object({ id: z.string().min(1), exercise: exerciseSchema, sets: z.array(setSchema) }).strict();
const workoutBase = z.object({
  ...metadata, localDate: dateSchema, timeZone: z.string(), name: z.string().trim().min(1),
  status: z.enum(['draft', 'completed']), startedAt: z.string().datetime(), endedAt: z.string().datetime().nullable(),
  durationSeconds: z.number().finite().int().nonnegative(), note: z.string(), exercises: z.array(workoutExerciseSchema),
}).strict();
export function validSet(set: z.infer<typeof setSchema>, mode: typeof modes[number]) {
  if (mode === 'timed' || mode === 'cardio') return set.durationSeconds !== null && set.durationSeconds > 0;
  if (set.reps === null || set.reps < 1) return false;
  if (mode === 'weighted') return set.loadGrams !== null && set.loadGrams >= 0;
  if (mode === 'assisted') return set.assistanceGrams !== null && set.assistanceGrams >= 0;
  return true;
}
export const workoutSchema = workoutBase.superRefine((w, ctx) => {
  let complete = 0;
  const ids = [w.id];
  for (const e of w.exercises) {
    ids.push(e.id);
    for (const set of e.sets) {
      ids.push(set.id);
      if (set.completed) {
        if (!validSet(set, e.exercise.mode)) ctx.addIssue({ code: 'custom', message: '完成组必须填写有效的次数、重量或时长' });
        else complete++;
      }
    }
  }
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: '训练中的标识重复' });
  if (w.endedAt && w.endedAt < w.startedAt) ctx.addIssue({ code: 'custom', message: '结束时间不能早于开始' });
  if (w.status === 'completed' && (!complete || !w.endedAt)) ctx.addIssue({ code: 'custom', message: '请先完成至少一个有效组再结束训练' });
});
export const mealSchema = z.object({
  ...metadata, localDate: dateSchema, timeZone: z.string(), mealType: z.enum(['早餐', '午餐', '晚餐', '加餐']),
  note: z.string(), items: z.array(z.object({
    id: z.string().min(1), food: foodSchema, grams: z.number().finite().positive().multipleOf(0.1),
    quantity: z.number().finite().positive(), unit: z.string().min(1),
  }).strict()).min(1),
}).strict();
export const journalSchema = z.object({ ...metadata, localDate: dateSchema, dietConfirmed: z.boolean(), restDay: z.boolean(), note: z.string() }).strict();
export const goalSchema = z.object({ ...metadata, effectiveFrom: dateSchema, energy: z.number().finite().positive(), protein: optionalNutrition, carbs: optionalNutrition, fat: optionalNutrition }).strict();
export const weightSchema = z.object({ ...metadata, localDate: dateSchema, timeZone: z.string(), weightGrams: z.number().finite().int().positive(), note: z.string() }).strict();
export const templateSchema = z.object({ ...metadata, name: z.string().trim().min(1), exercises: z.array(workoutExerciseSchema).min(1) }).strict();
export const mealComboSchema = z.object({ ...metadata, name: z.string().trim().min(1).max(120), items: comboItemsSchema }).strict();
export type Profile = z.infer<typeof profileSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Food = z.infer<typeof foodSchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type WorkoutSet = z.infer<typeof setSchema>;
export type Meal = z.infer<typeof mealSchema>;
export type Journal = z.infer<typeof journalSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Weight = z.infer<typeof weightSchema>;
export type Template = z.infer<typeof templateSchema>;
export type MealCombo = z.infer<typeof mealComboSchema>;
export type Snapshot = { profile: Profile; exercises: Exercise[]; foods: Food[]; workouts: Workout[]; meals: Meal[]; journals: Journal[]; goals: Goal[]; weights: Weight[]; templates: Template[]; mealCombos: MealCombo[]; generation: string };
export const muscles = ['胸', '背', '肩', '腿', '臀', '手臂', '核心', '有氧'];
export const equipmentList: string[] = equipmentCatalog.map(item => item.name);
export const modeLabels: Record<Exercise['mode'], string> = { weighted: '负重 × 次数', bodyweight: '徒手 × 次数', assisted: '辅助 × 次数', timed: '力量计时', cardio: '有氧时长' };
export { meta } from './record-meta';
export function blankSet(): WorkoutSet { return { id: crypto.randomUUID(), kind: 'work', completed: false, reps: null, loadGrams: null, assistanceGrams: null, durationSeconds: null, distanceMeters: null, rpe: null }; }
