import type { Exercise } from './model';

export const equipmentCatalog = [
  { name: '哑铃', group: '自由重量', aliases: ['dumbbell'], description: '固定或可调哑铃。双手同时持铃时，记录两只合计重量。' },
  { name: '杠铃', group: '自由重量', aliases: ['barbell'], description: '重量包含杠身和两侧配重；请核对实际杠身重量。' },
  { name: '壶铃', group: '自由重量', aliases: ['kettlebell'], description: '固定重量壶铃，用于摆动、深蹲和推举。记录实际总重量。' },
  { name: '六角杠', group: '自由重量', aliases: ['trap bar', 'hex bar'], description: '站在框内握两侧把手的杠铃。重量包含杠身与配重。' },
  { name: 'T杠', group: '自由重量', aliases: ['t-bar', 'landmine'], description: '一端固定的划船装置，记录加载配重，并保持同机比较。' },
  { name: '训练凳', group: '训练辅助', aliases: ['bench', '平凳', '上斜凳'], description: '平凳或可调凳。卧推、飞鸟和胸托划船需要稳定支撑。' },
  { name: '深蹲架', group: '训练辅助', aliases: ['squat rack', 'power rack'], description: '支持杠铃出入架和安全保护杆，训练前调整挂钩与保护杆高度。' },
  { name: '单杠', group: '训练辅助', aliases: ['pull-up bar'], description: '引体和悬垂动作需要单杠。徒手记录模式不代表无需器械。' },
  { name: '双杠', group: '训练辅助', aliases: ['parallel bars'], description: '用于臂屈伸和支撑。确认宽度与稳定性，控制下降幅度。' },
  { name: '弹力带', group: '训练辅助', aliases: ['resistance band'], description: '拉伸长度改变实际阻力，不将标称阻力作为恒定负重。' },
  { name: '跳绳', group: '训练辅助', aliases: ['jump rope'], description: '按实际跳绳时长记录，间歇和频率可写入备注。' },
  { name: '腹肌轮', group: '训练辅助', aliases: ['ab wheel'], description: '用于抗伸展训练，通过可控推出距离调整难度。' },
  { name: '绳索器械', group: '固定器械', aliases: ['cable', '龙门架', '滑轮'], description: '配重塔搭配长杆、绳把或脚踝带。记录标示值，同机比较。' },
  { name: '固定器械', group: '固定器械', aliases: ['machine', '综合训练器'], description: '通用固定轨迹或辅助器械。传动比不同，标示重量不宜跨机比较。' },
  { name: '史密斯机', group: '固定器械', aliases: ['smith machine'], description: '沿导轨运动的杠铃。可能存在配重抵消，保持本机一致的重量口径。' },
  { name: '推胸机', group: '固定器械', aliases: ['chest press'], description: '固定轨迹推胸，调整座椅使握把位于胸部附近。' },
  { name: '蝴蝶机', group: '固定器械', aliases: ['pec deck', '反向飞鸟机'], description: '支持夹胸或反向飞鸟；先确认器械方向和起始角度。' },
  { name: '腿举机', group: '固定器械', aliases: ['leg press'], description: '坐姿或斜板腿举。记录加载配重，保持同一机器和座椅设置。' },
  { name: '腿屈伸机', group: '固定器械', aliases: ['leg extension'], description: '调整器械转轴与膝关节对齐，胫骨垫位于小腿下端。' },
  { name: '腿弯举机', group: '固定器械', aliases: ['leg curl'], description: '坐姿或俯卧屈膝设备，固定髋部并调整脚踝垫。' },
  { name: '哈克深蹲机', group: '固定器械', aliases: ['hack squat'], description: '背靠垫沿导轨下蹲，脚掌贴稳踏板，预先设置安全挡。' },
  { name: '髋外展机', group: '固定器械', aliases: ['hip abduction'], description: '坐姿向外打开双腿，保持骨盆和躯干稳定。' },
  { name: '髋内收机', group: '固定器械', aliases: ['hip adduction'], description: '坐姿向内合拢双腿，控制起始张开角度。' },
  { name: '牧师凳', group: '训练辅助', aliases: ['preacher bench'], description: '弯举时支撑上臂，避免肩部前探和肘关节被动过伸。' },
  { name: '提踵机', group: '固定器械', aliases: ['calf raise'], description: '坐姿或站姿提踵设备，脚掌支撑稳定并控制脚踝活动范围。' },
  { name: '跑步机', group: '有氧设备', aliases: ['treadmill'], description: '记录时长与距离，速度和坡度可写入训练备注。' },
  { name: '单车', group: '有氧设备', aliases: ['bike', 'spinning', '动感单车'], description: '固定单车或动感单车。设备里程算法不同，优先比较时长。' },
  { name: '划船机', group: '有氧设备', aliases: ['rower', 'rowing machine'], description: '按腿、髋、手臂顺序发力，记录时长与里程。' },
  { name: '椭圆机', group: '有氧设备', aliases: ['elliptical'], description: '连续踩踏设备。握稳把手，记录时长与设备显示距离。' },
  { name: '登楼机', group: '有氧设备', aliases: ['stair climber', '楼梯机'], description: '连续上台阶设备，避免将身体重量完全压在扶手上。' },
] as const;
export const equipmentGroups = ['自由重量', '固定器械', '训练辅助', '有氧设备'] as const;
export type ExerciseFilter = { query?: string; muscles?: string[]; includeSecondary?: boolean; equipment?: string[]; equipmentMatch?: 'uses' | 'available'; equipmentActive?: boolean; bodyweightOnly?: boolean; favorite?: boolean; archived?: boolean; type?: '' | 'strength' | 'cardio' };
export function filterExercises(exercises: Exercise[], filter: ExerciseFilter): Exercise[] {
  const query = (filter.query || '').trim().toLocaleLowerCase(); const gear = filter.equipment || [];
  return exercises.filter(exercise => {
    if (exercise.archived !== Boolean(filter.archived) || (filter.favorite && !exercise.favorite)) return false;
    if (query && ![exercise.name, ...exercise.aliases].some(text => text.toLocaleLowerCase().includes(query))) return false;
    const targets = filter.includeSecondary ? [...exercise.primaryMuscles, ...exercise.secondaryMuscles] : exercise.primaryMuscles;
    if (filter.muscles?.length && !filter.muscles.some(m => targets.includes(m))) return false;
    if (filter.bodyweightOnly && exercise.equipment.length) return false;
    if (filter.type === 'cardio' && exercise.mode !== 'cardio') return false;
    if (filter.type === 'strength' && exercise.mode === 'cardio') return false;
    if (filter.equipmentMatch === 'available' && filter.equipmentActive) return exercise.equipment.every(item => gear.includes(item));
    return !gear.length || gear.some(item => exercise.equipment.includes(item));
  });
}
