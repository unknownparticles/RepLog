import { beforeEach, describe, expect, it } from 'vitest';
import { db, initialize, readSnapshot } from '../src/db/database';
import { exportBackup, importBackup, validateBackup, clearData } from '../src/db/backup';
import { journalFor, removeRecord, saveExercise, saveFood, saveJournal, saveMeal, saveWorkout } from '../src/db/commands';
import { meta } from '../src/domain/model';
import { sampleFood, meal, workout } from './fixtures';
import { makeEstimatedMealDraft, saveEstimatedMeal } from '../src/db/estimated-meal';
import { seedExercises, SEED_VERSION } from '../src/domain/seeds';

beforeEach(async () => { await db.delete(); await db.open(); await initialize(); });
describe('本地事务与恢复', () => {
  it('AI 仅在确认后入账，保留来源、未知营养，并原子回滚食物与餐食', async () => {
    const data=await readSnapshot();
    const candidate={name:'估算米饭',grams:150,energyPer100g:116,proteinPer100g:null,carbsPer100g:25,fatPer100g:null,assumptions:['按熟重估算']};
    const draft=makeEstimatedMealDraft([candidate],{date:'2026-10-20',timeZone:'Asia/Shanghai',mealType:'午餐',provider:'测试代理'});
    expect((await readSnapshot()).meals).toHaveLength(0);
    await saveJournal({...journalFor('2026-10-20',[]),dietConfirmed:true},data.generation);
    await saveEstimatedMeal(draft,data.generation);
    const saved=await readSnapshot();expect(saved.meals[0].note).toContain('测试代理');expect(saved.meals[0].items[0].food.protein).toBeNull();
    expect(saved.journals[0].dietConfirmed).toBe(false);
    const failed=makeEstimatedMealDraft([{...candidate,name:'第二种食物'}],{date:'2026-10-21',timeZone:'Asia/Shanghai',mealType:'午餐',provider:'测试代理'});
    const fail=()=>{throw new Error('模拟餐食写入失败');};db.meals.hook('creating',fail);
    try{await expect(saveEstimatedMeal(failed,data.generation)).rejects.toThrow('模拟餐食写入失败');}finally{db.meals.hook('creating').unsubscribe(fail);}
    expect((await readSnapshot()).foods).toHaveLength(1);expect((await readSnapshot()).meals).toHaveLength(1);
  });
  it('旧版种子更新保留收藏、自建动作和历史快照，重复初始化不重复升级', async () => {
    const before = await readSnapshot(); const old = { ...before.exercises[0], favorite: true, instructions: '旧版说明' };
    await db.exercises.put(old);
    const history = workout(); history.exercises[0].exercise = structuredClone(old);
    await saveWorkout(history, before.generation);
    const custom = await saveExercise({ ...old, ...meta(), name: '个人卧推', builtin: false }, before.generation);
    await db.metadata.put({ id: 'exercise-seed-version', value: '1' });
    await initialize(); const after = await readSnapshot();
    const updated = after.exercises.find(e => e.id === old.id)!;
    expect(updated.favorite).toBe(true); expect(updated.instructions).not.toBe('旧版说明');
    expect(after.exercises.find(e => e.id === custom.id)).toEqual(custom);
    expect(after.workouts[0].exercises[0].exercise.instructions).toBe('旧版说明');
    await initialize(); expect((await db.exercises.get(old.id))?.revision).toBe(updated.revision);
  });
  it('初始化幂等，动作种子覆盖并且不污染用户食物库', async () => { await initialize(); const data = await readSnapshot(); expect(data.exercises.length).toBeGreaterThanOrEqual(30); expect(data.foods).toHaveLength(0); expect(await db.profiles.count()).toBe(1); });
  it('升级旧版目录补齐器械动作并保留归档、收藏和已有训练', async () => {
    const before = await readSnapshot();
    const original = before.exercises.find(item => item.id === 'builtin-001')!;
    await db.exercises.put({ ...original, favorite: true, archived: true });
    await db.exercises.bulkDelete(seedExercises.filter(item => Number(item.id.slice(8)) >= 85).map(item => item.id));
    const history = workout(); await saveWorkout(history, before.generation);
    await db.metadata.put({ id: 'exercise-seed-version', value: '2' });
    await initialize();
    const after = await readSnapshot();
    expect(after.exercises).toHaveLength(seedExercises.length);
    expect(after.exercises.find(item => item.name === '悍马平板推胸')?.id).toBe('builtin-085');
    expect(after.exercises.find(item => item.id === original.id)).toMatchObject({ favorite: true, archived: true });
    expect(after.workouts).toEqual([history]);
    expect(after.generation).toBe(before.generation);
    expect((await db.metadata.get('exercise-seed-version'))?.value).toBe(SEED_VERSION);
    await initialize(); expect(await db.exercises.count()).toBe(seedExercises.length);
  });
  it('旧版本并发写入被拒绝，历史餐食保留食物快照', async () => {
    const { generation } = await readSnapshot(); const food = await saveFood(sampleFood(), generation);
    await saveMeal(meal('2026-10-20', food), generation);
    await saveFood({ ...food, energy: 999 }, generation);
    await expect(saveFood({ ...food, name: '过时修改' }, generation)).rejects.toThrow('其他页面');
    expect((await readSnapshot()).meals[0].items[0].food.energy).toBe(120);
  });
  it('增删餐食撤销完整确认，删除最后食物不视为零摄入', async () => {
    let data = await readSnapshot(); const food = await saveFood(sampleFood(), data.generation); const entry = await saveMeal(meal('2026-10-20', food), data.generation);
    await saveJournal({ ...journalFor('2026-10-20', []), dietConfirmed: true }, data.generation);
    await removeRecord('meals', entry, data.generation); data = await readSnapshot(); expect(data.journals[0].dietConfirmed).toBe(false); expect(data.meals).toHaveLength(0);
  });
  it('全局只允许一个草稿，休息与训练互斥', async () => {
    const data = await readSnapshot(); const w = workout(); w.status = 'draft'; w.endedAt = null; await saveWorkout(w, data.generation);
    await expect(saveWorkout({ ...w, id: crypto.randomUUID() }, data.generation)).rejects.toThrow('现有训练');
    await expect(saveJournal({ ...journalFor(w.localDate, []), restDay: true }, data.generation)).rejects.toThrow('已有训练');
  });
  it('完整备份可恢复，旧页面代际标识不能覆盖恢复后的库', async () => {
    const original = await readSnapshot(); await saveFood(sampleFood(), original.generation); const backup = await exportBackup();
    await importBackup(backup, original.generation); const restored = await readSnapshot(); expect(restored.foods).toHaveLength(1); expect(restored.generation).not.toBe(original.generation);
    await expect(saveFood(sampleFood(), original.generation)).rejects.toThrow('恢复或清空');
  });
  it('非法备份与引用在触碰原库前被拒绝', async () => {
    const backup = await exportBackup(); expect(() => validateBackup({ ...backup, formatVersion: 999 })).toThrow();
    backup.entities.meals = [meal('2026-10-20', sampleFood())]; expect(() => validateBackup(backup)).toThrow('食物引用');
    expect((await readSnapshot()).meals).toHaveLength(0);
  });
  it('导入中途失败时回滚，保留完整旧库', async () => {
    const original = await readSnapshot(); const oldFood = await saveFood(sampleFood(), original.generation); const backup = await exportBackup();
    backup.entities.foods[0].name = '模拟写入故障';
    const fail = (_key: unknown, value: { name: string }) => { if (value.name === '模拟写入故障') throw new Error('配额不足'); };
    db.foods.hook('creating', fail);
    try { await expect(importBackup(backup, original.generation)).rejects.toThrow('配额不足'); }
    finally { db.foods.hook('creating').unsubscribe(fail); }
    const after = await readSnapshot(); expect(after.foods).toEqual([oldFood]); expect(after.generation).toBe(original.generation);
  });
  it('清空后重新初始化且原页面不能回写', async () => {
    const old = await readSnapshot(); await saveFood(sampleFood(), old.generation); await clearData(old.generation); const next = await readSnapshot(); expect(next.foods).toHaveLength(0); expect(next.exercises.length).toBeGreaterThan(30); expect(next.generation).not.toBe(old.generation);
  });
});
