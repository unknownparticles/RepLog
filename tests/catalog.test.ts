import { describe, expect, it } from 'vitest';
import { equipmentCatalog, filterExercises } from '../src/domain/catalog';
import { exerciseSchema } from '../src/domain/model';
import { seedExercises } from '../src/domain/seeds';

describe('动作和器械目录', () => {
  it('完整动作具有独立标识、英文检索名、分步说明和可识别器械', () => {
    expect(seedExercises.length).toBeGreaterThanOrEqual(80);
    expect(new Set(seedExercises.map(e => e.id)).size).toBe(seedExercises.length);
    expect(new Set(seedExercises.map(e => e.name)).size).toBe(seedExercises.length);
    for (const exercise of seedExercises) {
      expect(exerciseSchema.safeParse(exercise).success).toBe(true);
      expect(exercise.aliases.length).toBeGreaterThan(0);
      expect(exercise.instructions.split('\n').length).toBeGreaterThanOrEqual(3);
      for (const name of exercise.equipment) expect(equipmentCatalog.some(e => e.name === name)).toBe(true);
    }
    expect(seedExercises[0].id).toBe('builtin-001'); expect(seedExercises[36].name).toBe('划船机');
  });
  it('按使用器械查询可发现全部相关动作，而现有器械匹配需要全部必需器械', () => {
    const uses = filterExercises(seedExercises, { equipment: ['杠铃'], equipmentMatch: 'uses' });
    expect(uses.some(e => e.name === '杠铃卧推')).toBe(true);
    const onlyBar = filterExercises(seedExercises, { equipment: ['杠铃'], equipmentMatch: 'available', equipmentActive: true });
    expect(onlyBar.some(e => e.name === '杠铃卧推')).toBe(false);
    expect(onlyBar.some(e => e.name === '传统硬拉')).toBe(true);
    const withBench = filterExercises(seedExercises, { equipment: ['杠铃', '训练凳'], equipmentMatch: 'available', equipmentActive: true });
    expect(withBench.some(e => e.name === '杠铃卧推')).toBe(true);
  });
  it('无可用器械时只匹配真正无需器械动作，徒手引体仍需要单杠', () => {
    const result = filterExercises(seedExercises, { equipment: [], equipmentMatch: 'available', equipmentActive: true });
    expect(result.some(e => e.name === '俯卧撑')).toBe(true);
    expect(result.some(e => e.name === '引体向上')).toBe(false);
    expect(result.every(e => !e.equipment.length)).toBe(true);
  });
  it('辅助肌群检索与英文、类型、器械筛选可以组合', () => {
    expect(filterExercises(seedExercises, { query: 'BENCH PRESS', muscles: ['手臂'] }).some(e => e.name === '杠铃卧推')).toBe(false);
    expect(filterExercises(seedExercises, { query: 'BENCH PRESS', muscles: ['手臂'], includeSecondary: true, equipment: ['杠铃'], type: 'strength' }).some(e => e.name === '杠铃卧推')).toBe(true);
    expect(filterExercises(seedExercises, { query: 'BENCH PRESS', type: 'cardio' })).toHaveLength(0);
  });
});
