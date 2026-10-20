import { describe, expect, it } from 'vitest';
import { equipmentCatalog, filterExercises, matchesEquipment } from '../src/domain/catalog';
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
  it('体能器械支持俗称和英文搜索，无器械筛选可找到波比跳', () => {
    for (const [query, name] of [['推雪橇', '推雪橇车'], ['prowler', '推雪橇车'], ['Burpees', '波比跳'], ['立卧撑跳', '波比跳'], ['TRX', '悬挂划船'], ['体能绳', '战绳交替波浪'], ['沙包', '沙袋抱胸深蹲'], ['Swiss Ball', '健身球腿弯举'], ['砸球', '药球砸地'], ['Plyo Box', '跳箱']]) {
      expect(filterExercises(seedExercises, { query }).map(item => item.name)).toContain(name);
    }
    const noGear = filterExercises(seedExercises, { equipment: [], equipmentMatch: 'available', equipmentActive: true });
    expect(noGear.map(item => item.name)).toContain('波比跳');
    expect(noGear.map(item => item.name)).not.toContain('推雪橇车');
    const suspension = filterExercises(seedExercises, { equipment: ['悬挂训练带'], equipmentMatch: 'available', equipmentActive: true });
    expect(suspension.filter(item => item.equipment.length).map(item => item.name)).toEqual(['悬挂划船', '悬挂俯卧撑']);
  });
  it('悍马机与常见固定器械均有对应动作，品牌别名可直接搜索', () => {
    const hammer = equipmentCatalog.filter(item => matchesEquipment(item, '悍马机'));
    expect(hammer.map(item => item.name)).toEqual(['悍马推胸机', '悍马划船机', '悍马高位划船机', '悍马高位下拉机', '悍马推肩机']);
    for (const item of equipmentCatalog.slice(30)) {
      expect(seedExercises.some(exercise => exercise.equipment.includes(item.name))).toBe(true);
    }
    const byChinese = filterExercises(seedExercises, { query: '悍马机' });
    const byEnglish = filterExercises(seedExercises, { query: 'HAMMER-STRENGTH' });
    expect(byChinese.map(item => item.id)).toEqual(byEnglish.map(item => item.id));
    expect(byChinese.map(item => item.name)).toContain('悍马单臂划船');
    expect(filterExercises(seedExercises, { query: '腰带蹲' }).map(item => item.name)).toEqual(['腰带深蹲']);
    expect(filterExercises(seedExercises, { query: '悍马机', equipment: ['悍马推肩机'] }).map(item => item.name)).toEqual(['悍马推肩']);
    expect(filterExercises(seedExercises, { equipment: ['悍马划船机'], equipmentMatch: 'available', equipmentActive: true }).some(item => item.name === '悍马推肩')).toBe(false);
  });
});
