import Dexie, { type Table } from 'dexie';
import type { Exercise, Food, Goal, Journal, Meal, MealCombo, Profile, Snapshot, Template, Weight, Workout } from '../domain/model';
import { meta } from '../domain/record-meta';
import { seedExercises, SEED_VERSION } from '../domain/seeds';

export class RepLogDB extends Dexie {
  profiles!: Table<Profile, string>;
  exercises!: Table<Exercise, string>;
  foods!: Table<Food, string>;
  workouts!: Table<Workout, string>;
  meals!: Table<Meal, string>;
  journals!: Table<Journal, string>;
  goals!: Table<Goal, string>;
  weights!: Table<Weight, string>;
  templates!: Table<Template, string>;
  mealCombos!: Table<MealCombo, string>;
  metadata!: Table<{ id: string; value: string }, string>;
  constructor(name = `replog:${import.meta.env.BASE_URL}`) {
    super(name);
    this.version(1).stores({
      profiles: 'id', exercises: 'id, name, mode', foods: 'id, name',
      workouts: 'id, localDate, status', meals: 'id, localDate, mealType', journals: 'id, &localDate',
      goals: 'id, &effectiveFrom', weights: 'id, &localDate', templates: 'id', metadata: 'id',
    });
    this.version(2).stores({ mealCombos: 'id, name' });
  }
}
export const db = new RepLogDB();
export async function initialize(database = db) {
  await database.transaction('rw', database.tables, async () => {
    if (!await database.profiles.count()) {
      await database.profiles.add({ ...meta('local'), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai', theme: 'system' });
      await database.metadata.put({ id: 'generation', value: crypto.randomUUID() });
    }
    if ((await database.metadata.get('exercise-seed-version'))?.value !== SEED_VERSION) {
      for (const seed of seedExercises) {
        const existing = await database.exercises.get(seed.id);
        if (existing && !existing.builtin) continue;
        await database.exercises.put(existing ? { ...seed, createdAt: existing.createdAt, favorite: existing.favorite, archived: existing.archived, revision: existing.revision + 1, updatedAt: new Date().toISOString() } : structuredClone(seed));
      }
      await database.metadata.put({ id: 'exercise-seed-version', value: SEED_VERSION });
    }
  });
}
export async function readSnapshot(database = db): Promise<Snapshot> {
  return database.transaction('r', database.tables, async () => {
    const [profile, exercises, foods, workouts, meals, journals, goals, weights, templates, mealCombos, generation] = await Promise.all([
      database.profiles.get('local'), database.exercises.toArray(), database.foods.toArray(), database.workouts.toArray(),
      database.meals.toArray(), database.journals.toArray(), database.goals.toArray(), database.weights.toArray(), database.templates.toArray(), database.mealCombos.toArray(), database.metadata.get('generation'),
    ]);
    if (!profile || !generation) throw new Error('本地档案未准备好，请刷新后重试');
    return { profile, exercises, foods, workouts, meals, journals, goals, weights, templates, mealCombos, generation: generation.value };
  });
}
