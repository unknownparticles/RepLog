import { describe,expect,it } from 'vitest';
import { dailyEnergy, energyFromMacros, exerciseEnergy, portionEnergy } from '../src/domain/calories';

describe('可复核的本地热量计算',()=>{
  it('与 wger 的 Mifflin 测试示例交叉验证，并区分公式系数',()=>{
    const input={weightKg:80,heightCm:180,age:30,activity:'sedentary' as const};
    expect(dailyEnergy({...input,sex:'male'})).toMatchObject({resting:1780,maintenance:2136,factor:1.2});
    expect(dailyEnergy({...input,sex:'female'})).toMatchObject({resting:1614,maintenance:1936.8});
  });
  it('每百克热量按克重换算，4/4/9 只处理已知营养',()=>{
    expect(portionEnergy(120,300)).toBe(360);
    expect(energyFromMacros({protein:10,carbs:20,fat:5})).toBe(165);
    expect(portionEnergy(.1,.1)).toBe(.0001);
    expect(()=>energyFromMacros({protein:null as unknown as number,carbs:20,fat:5})).toThrow();
    expect(()=>energyFromMacros({protein:80,carbs:80,fat:10})).toThrow();
  });
  it('MET 分开总消耗与相较静息的增量，不重复计算静息',()=>{
    expect(exerciseEnergy({weightKg:70,minutes:30,met:6})).toEqual({total:220.5,additional:183.75,resting:36.75});
    expect(exerciseEnergy({weightKg:70,minutes:30,met:1}).additional).toBe(0);
  });
  it('拒绝空值、非有限值及超出本工具适用范围的输入',()=>{
    for(const age of [17,101,20.5])expect(()=>dailyEnergy({weightKg:70,heightCm:175,age,sex:'male',activity:'light'})).toThrow();
    expect(()=>portionEnergy(Infinity,100)).toThrow();expect(()=>portionEnergy(100,0)).toThrow();
    expect(()=>exerciseEnergy({weightKg:70,minutes:30,met:NaN})).toThrow();
  });
});
