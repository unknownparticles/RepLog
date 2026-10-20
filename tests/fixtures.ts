import { meta, blankSet, type Food, type Meal, type Snapshot, type Workout } from '../src/domain/model';
import { seedExercises } from '../src/domain/seeds';
export const sampleFood = (energy = 120, protein: number | null = 4): Food => ({ ...meta(), name: '测试食物', energy, protein, carbs: 10, fat: null, servingName: '份', servingGrams: 150, favorite: false, archived: false });
export function sampleSnapshot(): Snapshot {
  return { profile: { ...meta('local'), timeZone: 'Asia/Shanghai', theme: 'system' }, exercises: structuredClone(seedExercises), foods: [], meals: [], workouts: [], journals: [], goals: [], weights: [], templates: [], generation: 'test' };
}
export function meal(date: string, food: Food, grams = 100): Meal { return { ...meta(), localDate: date, timeZone: 'Asia/Shanghai', mealType: '午餐', note: '', items: [{ id: crypto.randomUUID(), food, grams, quantity: grams, unit: '克' }] }; }
export function workout(): Workout {
  return { ...meta(), name: '测试训练', localDate: '2026-10-20', timeZone: 'Asia/Shanghai', status: 'completed', startedAt: '2026-10-20T10:00:00.000Z', endedAt: '2026-10-20T11:00:00.000Z', durationSeconds: 3600, note: '', exercises: [{ id: crypto.randomUUID(), exercise: structuredClone(seedExercises[0]), sets: [{ ...blankSet(), completed: true, loadGrams: 50000, reps: 10 }, { ...blankSet(), completed: true, loadGrams: 50000, reps: 10 }, { ...blankSet(), kind: 'warmup', completed: true, loadGrams: 20000, reps: 10 }] }] };
}
