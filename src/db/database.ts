import Dexie, { type Table } from 'dexie';
import { meta, type Exercise, type Food, type Goal, type Journal, type Meal, type Profile, type Snapshot, type Template, type Weight, type Workout } from '../domain/model';
import { seedExercises } from '../domain/seeds';

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
  metadata!: Table<{ id: string; value: string }, string>;
  constructor(name = `replog:${import.meta.env.BASE_URL}`) {
    super(name);
    this.version(1).stores({
      profiles: 'id', exercises: 'id, name, mode', foods: 'id, name',
      workouts: 'id, localDate, status', meals: 'id, localDate, mealType', journals: 'id, &localDate',
      goals: 'id, &effectiveFrom', weights: 'id, &localDate', templates: 'id', metadata: 'id',
    });
  }
}
export const db = new RepLogDB();
export async function initialize(database = db) {
  await database.transaction('rw', database.tables, async () => {
    if (await database.profiles.count()) return;
    await database.profiles.add({ ...meta('local'), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai', theme: 'system' });
    await database.exercises.bulkAdd(structuredClone(seedExercises));
    await database.metadata.put({ id: 'generation', value: crypto.randomUUID() });
  });
}
export async function readSnapshot(database = db): Promise<Snapshot> {
  return database.transaction('r', database.tables, async () => {
    const [profile, exercises, foods, workouts, meals, journals, goals, weights, templates, generation] = await Promise.all([
      database.profiles.get('local'), database.exercises.toArray(), database.foods.toArray(), database.workouts.toArray(),
      database.meals.toArray(), database.journals.toArray(), database.goals.toArray(), database.weights.toArray(), database.templates.toArray(), database.metadata.get('generation'),
    ]);
    if (!profile || !generation) throw new Error('本地档案未准备好，请刷新后重试');
    return { profile, exercises, foods, workouts, meals, journals, goals, weights, templates, generation: generation.value };
  });
}
