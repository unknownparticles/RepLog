import Decimal from 'decimal.js';
import { z } from 'zod';

const finite = z.number().finite();
export const macroSchema = z.object({ protein: finite.min(0).max(100), carbs: finite.min(0).max(100), fat: finite.min(0).max(100) }).refine(values=>values.protein+values.carbs+values.fat<=100.5,'每百克三大营养素总量不能超过约 100 克');
export function energyFromMacros(input: z.infer<typeof macroSchema>) {
  const { protein, carbs, fat } = macroSchema.parse(input);
  return new Decimal(protein).mul(4).add(new Decimal(carbs).mul(4)).add(new Decimal(fat).mul(9)).toNumber();
}
export function portionEnergy(energyPer100g: number, grams: number) {
  finite.nonnegative().parse(energyPer100g); finite.positive().parse(grams);
  return finite.parse(new Decimal(energyPer100g).mul(grams).div(100).toNumber());
}
export const activityLevels = [
  { value: 'sedentary', label: '久坐为主', factor: 1.2 },
  { value: 'light', label: '轻度活动', factor: 1.375 },
  { value: 'moderate', label: '中度活动', factor: 1.55 },
  { value: 'active', label: '高度活动', factor: 1.725 },
  { value: 'very-active', label: '体力劳动 / 很高活动量', factor: 1.9 },
] as const;
export const dailyEnergySchema = z.object({
  weightKg: finite.min(30).max(350), heightCm: finite.min(120).max(230), age: finite.int().min(18).max(100),
  sex: z.enum(['male','female']), activity: z.enum(['sedentary','light','moderate','active','very-active']),
});
export type DailyEnergyInput = z.infer<typeof dailyEnergySchema>;
export function dailyEnergy(input: DailyEnergyInput) {
  const checked = dailyEnergySchema.parse(input);
  const factor = activityLevels.find(level => level.value === checked.activity)!.factor;
  const resting = new Decimal(checked.weightKg).mul(10).add(new Decimal(checked.heightCm).mul(6.25)).sub(checked.age * 5).add(checked.sex === 'male' ? 5 : -161).toNumber();
  if (resting <= 0) throw new Error('输入组合得到非正值，请检查身高、体重和年龄。');
  return { resting, maintenance: new Decimal(resting).mul(factor).toNumber(), factor, method: 'Mifflin–St Jeor' as const };
}
export const exerciseEnergySchema = z.object({ weightKg: finite.min(30).max(350), minutes: finite.positive().max(1440), met: finite.min(1).max(25) });
export function exerciseEnergy(input: z.infer<typeof exerciseEnergySchema>) {
  const { weightKg, minutes, met } = exerciseEnergySchema.parse(input);
  const multiplier = new Decimal(3.5).mul(weightKg).mul(minutes).div(200);
  return { total: multiplier.mul(met).toNumber(), additional: multiplier.mul(met - 1).toNumber(), resting: multiplier.toNumber() };
}
