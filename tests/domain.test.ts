import { describe, expect, it } from 'vitest';
import { aggregate, daySummary, goalFor, nutritionValue, workoutMetrics } from '../src/domain/analytics';
import { comparisonRanges, days, range, today } from '../src/domain/dates';
import { dateSchema, meta, workoutSchema } from '../src/domain/model';
import { meal, sampleFood, sampleSnapshot, workout } from './fixtures';

describe('营养和训练计算', () => {
  it('按照每百克计算，不将未知营养算成零', () => {
    const food = sampleFood(); expect(nutritionValue(food, 300, 'energy')).toBe(360); expect(nutritionValue(food, 300, 'protein')).toBe(12); expect(nutritionValue(food, 300, 'fat')).toBeNull();
  });
  it('部分记录只参与总和，不进入完整日均值', () => {
    const data = sampleSnapshot(); const food = sampleFood(100); data.foods = [food];
    data.meals = [meal('2026-10-19', food, 1800), meal('2026-10-20', food, 2000), meal('2026-10-21', food, 500)];
    data.journals = ['2026-10-19', '2026-10-20'].map(localDate => ({ ...meta(), localDate, dietConfirmed: true, restDay: false, note: '' }));
    const stats = aggregate(data, '2026-10-19', '2026-10-25', '2026-10-21');
    expect(stats.energy).toBe(4300); expect(stats.average).toBe(1900); expect(stats.coverage).toBe(2 / 3);
    expect(daySummary(data, '2026-10-21').diet).toBe('partial');
  });
  it('明确零摄入进入均值，未来与空白日期不增加分母', () => {
    const data = sampleSnapshot(); data.journals = [{ ...meta(), localDate: '2026-10-20', dietConfirmed: true, restDay: false, note: '' }];
    expect(aggregate(data, '2026-10-20', '2026-10-31', '2026-10-20').average).toBe(0);
    expect(aggregate(data, '2026-10-21', '2026-10-31', '2026-10-20').average).toBeNull();
  });
  it('目标按日期匹配，不使用当前目标覆盖历史', () => {
    const data = sampleSnapshot(); data.goals = [{ ...meta(), effectiveFrom: '2026-10-01', energy: 2000, protein: null, carbs: null, fat: null }, { ...meta(), effectiveFrom: '2026-10-15', energy: 1800, protein: null, carbs: null, fat: null }];
    expect(goalFor(data.goals, '2026-10-14')?.energy).toBe(2000); expect(goalFor(data.goals, '2026-10-15')?.energy).toBe(1800); expect(goalFor(data.goals, '2026-09-01')).toBeUndefined();
  });
  it('正式负重排除热身与草稿，多个主要肌群守恒分配', () => {
    const w = workout(); w.exercises[0].exercise.primaryMuscles = ['腿', '臀'];
    const metrics = workoutMetrics([w]); expect(metrics.volume).toBe(1000); expect(metrics.sets).toBe(2); expect(metrics.muscles).toEqual({ 腿: 1, 臀: 1 });
    expect(workoutMetrics([{ ...w, status: 'draft' }]).count).toBe(0);
    w.exercises[0].exercise.mode = 'bodyweight'; expect(workoutMetrics([w]).volume).toBeNull();
  });
  it('完成训练必须包含有效完成组和合理结束时间', () => {
    const w = workout(); w.exercises[0].sets.forEach(s => s.completed = false); expect(workoutSchema.safeParse(w).success).toBe(false);
    const invalid = workout(); invalid.endedAt = '2026-10-19T00:00:00.000Z'; expect(workoutSchema.safeParse(invalid).success).toBe(false);
  });
  it('有氧时长与力量计时分离，热身和徒手不虚增负重量', () => {
    const w = workout();
    const timed = structuredClone(w.exercises[0]); timed.id = crypto.randomUUID(); timed.exercise.mode = 'timed'; timed.sets = [{ ...timed.sets[0], id: crypto.randomUUID(), durationSeconds: 60 }];
    const cardio = structuredClone(timed); cardio.id = crypto.randomUUID(); cardio.exercise.mode = 'cardio'; cardio.sets = [{ ...timed.sets[0], id: crypto.randomUUID(), durationSeconds: 1800, distanceMeters: 5000 }];
    w.exercises.push(timed, cardio); const result = workoutMetrics([w]);
    expect(result.volume).toBe(1000); expect(result.sets).toBe(3); expect(result.cardioSeconds).toBe(1800); expect(result.distanceMeters).toBe(5000);
  });
});
describe('日期边界与比较窗口', () => {
  it('拒绝非法日期并保留闰日', () => { expect(dateSchema.safeParse('2026-02-29').success).toBe(false); expect(dateSchema.safeParse('2024-02-29').success).toBe(true); expect(days(...range('month', '2024-02-12'))).toHaveLength(29); });
  it('周一作为周起点，季度采用自然季度', () => { expect(range('week', '2027-01-01')).toEqual(['2026-12-28', '2027-01-03']); expect(range('quarter', '2026-05-20')).toEqual(['2026-04-01', '2026-06-30']); });
  it('月中与上月同天数对照，短月截双方共同天数', () => { expect(comparisonRanges('month', '2026-10-20', '2026-10-20')).toEqual({ current: ['2026-10-01', '2026-10-20'], previous: ['2026-09-01', '2026-09-20'] }); expect(comparisonRanges('month', '2024-03-31', '2024-03-31')?.current).toEqual(['2024-03-01', '2024-03-29']); });
  it('时区只决定今天，不改变记录的固定日期', () => { const now = new Date('2026-10-20T00:30:00.000Z'); expect(today('Asia/Shanghai', now)).toBe('2026-10-20'); expect(today('America/Los_Angeles', now)).toBe('2026-10-19'); expect(days('2026-03-07', '2026-03-10')).toHaveLength(4); });
});
