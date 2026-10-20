import type { Exercise } from './model';
import { meta } from './record-meta';
import { additionalExercises, guides, refinedEquipment } from './exercise-guides';
import { machineExercises } from './machine-exercises';
import { conditioningExercises } from './conditioning-exercises';
type Definition = [string, string[], string[], Exercise['mode'], string?, string[]?];
const definitions: Definition[] = [
  ['杠铃卧推', ['胸'], ['杠铃', '训练凳'], 'weighted', '双脚踩稳，肩胛保持稳定，控制下放。', ['肩', '手臂']],
  ['哑铃卧推', ['胸'], ['哑铃', '训练凳'], 'weighted', '双手负重合计输入，手腕保持中立。', ['肩', '手臂']],
  ['上斜哑铃卧推', ['胸'], ['哑铃', '训练凳'], 'weighted'], ['哑铃飞鸟', ['胸'], ['哑铃', '训练凳'], 'weighted'],
  ['俯卧撑', ['胸'], [], 'bodyweight', '保持身体成一直线，按可控幅度完成。', ['手臂', '核心']],
  ['绳索夹胸', ['胸'], ['绳索器械'], 'weighted'],
  ['杠铃划船', ['背'], ['杠铃'], 'weighted'], ['单臂哑铃划船', ['背'], ['哑铃', '训练凳'], 'weighted'],
  ['高位下拉', ['背'], ['绳索器械'], 'weighted'], ['坐姿划船', ['背'], ['绳索器械'], 'weighted'],
  ['引体向上', ['背'], ['单杠'], 'bodyweight'], ['辅助引体向上', ['背'], ['固定器械'], 'assisted'],
  ['哑铃推肩', ['肩'], ['哑铃'], 'weighted'], ['哑铃侧平举', ['肩'], ['哑铃'], 'weighted'],
  ['哑铃俯身飞鸟', ['肩'], ['哑铃'], 'weighted'], ['绳索面拉', ['肩', '背'], ['绳索器械'], 'weighted'],
  ['杠铃深蹲', ['腿', '臀'], ['杠铃', '深蹲架'], 'weighted', '核心收紧，膝盖沿脚尖方向移动，选可控幅度。'],
  ['高脚杯深蹲', ['腿', '臀'], ['哑铃'], 'weighted'], ['腿举', ['腿'], ['固定器械'], 'weighted'],
  ['腿屈伸', ['腿'], ['固定器械'], 'weighted'], ['腿弯举', ['腿'], ['固定器械'], 'weighted'],
  ['徒手深蹲', ['腿', '臀'], [], 'bodyweight'], ['哑铃弓步', ['腿', '臀'], ['哑铃'], 'weighted'],
  ['罗马尼亚硬拉', ['臀', '腿'], ['杠铃'], 'weighted'], ['杠铃臀推', ['臀'], ['杠铃', '训练凳'], 'weighted'],
  ['臀桥', ['臀'], [], 'bodyweight'], ['哑铃弯举', ['手臂'], ['哑铃'], 'weighted'],
  ['绳索下压', ['手臂'], ['绳索器械'], 'weighted'], ['双杠臂屈伸', ['胸', '手臂'], ['双杠'], 'bodyweight'],
  ['平板支撑', ['核心'], [], 'timed'], ['侧平板支撑', ['核心'], [], 'timed'],
  ['卷腹', ['核心'], [], 'bodyweight'], ['死虫', ['核心'], [], 'bodyweight'],
  ['户外跑步', ['有氧'], [], 'cardio'], ['跑步机', ['有氧'], ['跑步机'], 'cardio'],
  ['室内单车', ['有氧'], ['单车'], 'cardio'], ['划船机', ['有氧'], ['划船机'], 'cardio'],
];
export const SEED_VERSION = '5';
const originals: Exercise[] = definitions.map(([name, primaryMuscles, equipment, mode, instructions, secondaryMuscles], index) => ({
  ...meta(`builtin-${String(index + 1).padStart(3, '0')}`), name, primaryMuscles, equipment, mode,
  instructions: instructions || '选择可控制的强度，动作全程保持稳定，出现疼痛时停止。',
  secondaryMuscles: secondaryMuscles || [], optionalEquipment: [], aliases: name.includes('卧推') ? ['bench press'] : [],
  builtin: true, favorite: false, archived: false,
}));
export const seedExercises: Exercise[] = [
  ...originals.map(exercise => {
    const [english, secondaryMuscles, instructions] = guides[exercise.name];
    return { ...exercise, aliases: [english, ...(exercise.name === '杠铃卧推' ? ['平板卧推', 'bench press'] : [])], secondaryMuscles, instructions, equipment: refinedEquipment[exercise.name] || exercise.equipment };
  }),
  ...additionalExercises.map(([name, primaryMuscles, equipment, mode, english, secondaryMuscles, instructions], index) => ({
    ...meta(`builtin-${String(originals.length + index + 1).padStart(3, '0')}`), name, primaryMuscles, equipment, mode, aliases: [english], secondaryMuscles, instructions, optionalEquipment: [], builtin: true, favorite: false, archived: false,
  })),
  ...machineExercises.map(([id, name, primaryMuscles, equipment, mode, english, secondaryMuscles, instructions]) => ({
    ...meta(`builtin-${String(id).padStart(3, '0')}`), name, primaryMuscles, equipment, mode, aliases: [english], secondaryMuscles, instructions,
    optionalEquipment: [], builtin: true, favorite: false, archived: false,
  })),
  {
    ...meta('builtin-109'), name: '推雪橇车', aliases: ['Sled Push', 'Prowler Push', '推雪橇', '雪橇推行'],
    primaryMuscles: ['腿', '臀', '有氧'], secondaryMuscles: ['核心', '肩', '手臂'], equipment: ['雪橇车'], optionalEquipment: [], mode: 'cardio',
    instructions: '确认训练道平整畅通，双手握稳把手，收紧核心并适度前倾。\n保持背部稳定，以连续小步推地向前，不塌腰或耸肩。\n记录实际推行时长和距离；车体及加载配重、地面材质写入训练备注，保持同车同场地比较。',
    builtin: true, favorite: false, archived: false,
  },
  {
    ...meta('builtin-110'), name: '波比跳', aliases: ['Burpee', 'Burpees', '波比', '立卧撑跳', '立卧跳', '波比跳跃'],
    primaryMuscles: ['腿', '胸', '有氧'], secondaryMuscles: ['臀', '核心', '肩', '手臂'], equipment: [], optionalEquipment: [], mode: 'bodyweight',
    instructions: '站稳后屈髋屈膝，双手撑地，双脚后移进入高平板支撑，避免塌腰。\n控制完成一次俯卧撑，双脚收回后起身向上跳，屈膝缓冲落地；保持呼吸和可控节奏。\n完成整个循环计一次；初学者可逐脚后撤和收回、取消俯卧撑或跳跃，并在训练备注注明变式。',
    builtin: true, favorite: false, archived: false,
  },
  ...conditioningExercises,
];
