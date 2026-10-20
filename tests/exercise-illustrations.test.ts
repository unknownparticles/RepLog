import { describe, expect, it } from 'vitest';
import { illustrationFor, illustrationRegistry } from '../src/domain/exercise-illustrations';
import { seedExercises } from '../src/domain/seeds';

describe('动作线条缩略图', () => {
  it('全部内置动作均有明确线稿映射，不落到自定义占位', () => {
    expect(illustrationRegistry.size).toBe(seedExercises.length);
    for (const exercise of seedExercises) {
      expect(illustrationRegistry.has(exercise.id)).toBe(true);
      expect(illustrationFor(exercise).name).not.toBe('自定义动作');
    }
    expect(new Set([...illustrationRegistry.values()].map(art => art.name)).size).toBeGreaterThan(30);
  });
  it('所有姿态关节坐标有效，并在统一画布内', () => {
    for (const drawing of illustrationRegistry.values()) for (const pose of [drawing.from,drawing.to]) {
      expect(Object.keys(pose)).toHaveLength(11);
      for (const [x,y] of Object.values(pose)) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(160);
        expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(112);
      }
    }
  });
  it('支撑类动作保持静态，循环动作具有不同起止姿态', () => {
    for (const name of ['平板支撑','侧平板支撑','Pallof 抗旋转']) {
      expect(illustrationFor(seedExercises.find(exercise => exercise.name === name)!).still).toBe(true);
    }
    for (const name of ['杠铃卧推','徒手深蹲','俯卧撑','哑铃弯举']) {
      const drawing = illustrationFor(seedExercises.find(exercise => exercise.name === name)!);
      expect(drawing.from).not.toEqual(drawing.to);
    }
  });
  it('个人动作与未知标识使用明确静态占位，不按名称猜测姿势', () => {
    expect(illustrationFor({id:'builtin-001',builtin:false})).toMatchObject({name:'自定义动作',still:true});
    expect(illustrationFor({id:'unknown',builtin:true})).toMatchObject({name:'自定义动作',still:true});
  });
});
