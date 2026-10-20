import Decimal from 'decimal.js';
import { dateKey, days, range, type Period } from './dates';
import { parseISO, startOfWeek } from 'date-fns';
import type { Food, Goal, Snapshot, Workout } from './model';
export type Nutrient = 'energy' | 'protein' | 'carbs' | 'fat';
export const nutrientKeys: Nutrient[] = ['energy', 'protein', 'carbs', 'fat'];
export const displayNumber = (n: number | null | undefined, decimals = 0) => n == null ? '—' : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: decimals }).format(n);
export const nutritionValue = (food: Food, grams: number, nutrient: Nutrient) => food[nutrient] == null ? null : new Decimal(food[nutrient]!).mul(grams).div(100).toNumber();
export function goalFor(goals: Goal[], date: string) { return goals.filter(g => g.effectiveFrom <= date).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]; }
export function workoutMetrics(workouts: Workout[]) {
  let sets = 0, volume = 0, weightedSets = 0, cardioSeconds = 0, distanceMeters = 0;
  const muscles: Record<string, number> = {};
  for (const workout of workouts.filter(w => w.status === 'completed')) for (const entry of workout.exercises) for (const set of entry.sets) {
    if (!set.completed || set.kind !== 'work') continue;
    if (entry.exercise.mode === 'cardio') { cardioSeconds += set.durationSeconds || 0; distanceMeters += set.distanceMeters || 0; continue; }
    sets++;
    for (const muscle of entry.exercise.primaryMuscles) muscles[muscle] = (muscles[muscle] || 0) + 1 / entry.exercise.primaryMuscles.length;
    if (entry.exercise.mode === 'weighted') { volume = new Decimal(volume).add(new Decimal(set.loadGrams || 0).div(1000).mul(set.reps || 0)).toNumber(); weightedSets++; }
  }
  const finished = workouts.filter(w => w.status === 'completed');
  return { sets, volume: weightedSets ? volume : null, weightedSets, muscles, cardioSeconds, distanceMeters, count: finished.length, trainingDays: new Set(finished.map(w => w.localDate)).size, durationSeconds: finished.reduce((sum, w) => sum + w.durationSeconds, 0) };
}
export function daySummary(data: Snapshot, date: string) {
  const items = data.meals.filter(m => m.localDate === date).flatMap(m => m.items);
  const nutrition = Object.fromEntries(nutrientKeys.map(key => {
    const values = items.map(i => nutritionValue(i.food, i.grams, key));
    return [key, { value: values.reduce<number>((sum, value) => new Decimal(sum).add(value || 0).toNumber(), 0), known: values.every(v => v !== null) }];
  })) as Record<Nutrient, { value: number; known: boolean }>;
  const journal = data.journals.find(j => j.localDate === date);
  const diet = journal?.dietConfirmed ? 'complete' : items.length ? 'partial' : 'empty';
  const workouts = data.workouts.filter(w => w.localDate === date);
  return { date, items, nutrition, journal, diet, workouts, ...workoutMetrics(workouts), goal: goalFor(data.goals, date), weight: data.weights.find(w => w.localDate === date) };
}
export function aggregate(data: Snapshot, start: string, end: string, now: string) {
  const dates = days(start, end < now ? end : now);
  const summaries = dates.map(date => daySummary(data, date));
  const complete = summaries.filter(day => day.diet === 'complete');
  const energy = summaries.reduce((sum, day) => new Decimal(sum).add(day.nutrition.energy.value).toNumber(), 0);
  const eligible = complete.filter(day => day.goal);
  const achieved = eligible.filter(day => day.nutrition.energy.value >= day.goal!.energy * .9 && day.nutrition.energy.value <= day.goal!.energy * 1.1).length;
  const completed = data.workouts.filter(w => w.localDate >= start && w.localDate <= end && w.localDate <= now);
  const measurements = data.weights.filter(w => w.localDate >= start && w.localDate <= end && w.localDate <= now).sort((a, b) => a.localDate.localeCompare(b.localDate));
  return { summaries, energy, completeDays: complete.length, elapsedDays: dates.length, average: complete.length ? complete.reduce((sum, day) => new Decimal(sum).add(day.nutrition.energy.value).toNumber(), 0) / complete.length : null,
    coverage: dates.length ? complete.length / dates.length : null, targetDays: eligible.length, achieved, achievement: eligible.length ? achieved / eligible.length : null,
    rests: summaries.filter(d => d.journal?.restDay).length,
    unknownTrainingDays: summaries.filter(d => !d.count && !d.journal?.restDay).length,
    latestWeight: measurements.at(-1), ...workoutMetrics(completed) };
}
export function buckets(data: Snapshot, period: Period, anchor: string, now: string) {
  const [start, end] = range(period, anchor);
  const groups = new Map<string, string[]>();
  for (const day of days(start, end)) {
    let key = day;
    if (period === 'year') key = day.slice(0, 7);
    if (period === 'quarter') key = dateKey(startOfWeek(parseISO(day), { weekStartsOn: 1 }));
    const group = groups.get(key) || []; group.push(day); groups.set(key, group);
  }
  return [...groups.entries()].map(([key, dates]) => {
    const stats = aggregate(data, dates[0], dates.at(-1)!, now);
    const recorded = stats.summaries.some(d => d.diet !== 'empty');
    const targetDates = stats.summaries.filter(d => d.goal);
    return { key, start: dates[0], end: dates.at(-1)!, label: period === 'year' ? `${Number(key.slice(5))}月` : period === 'quarter' ? `${dates[0].slice(5)}起` : dayLabel(key), stats,
      energy: recorded ? stats.energy : null, target: targetDates.length ? targetDates.reduce((sum, d) => sum + d.goal!.energy, 0) : null, targetCoverage: targetDates.length,
    };
  });
}
const dayLabel = (day: string) => day.slice(5).replace('-', '/');
