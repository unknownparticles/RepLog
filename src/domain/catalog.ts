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
  { name: '悍马推胸机', group: '固定器械', aliases: ['Hammer Strength Chest Press', '悍马机', '挂片式推胸机', '分动式推胸机'], description: '挂片式分动推胸设备，有平板、上斜和下斜机型。按实际机型选择动作，双臂同时训练记录两侧配重合计，单侧训练记录本侧配重。' },
  { name: '悍马划船机', group: '固定器械', aliases: ['Hammer Strength Row', '悍马机', '挂片式划船机', '分动式划船机'], description: '挂片式分动水平划船设备。调整胸垫与座椅，保持胸部支撑；双侧记录合计配重，单臂记录本侧配重。' },
  { name: '悍马高位划船机', group: '固定器械', aliases: ['Hammer Strength High Row', '悍马机', '高拉背机', '挂片式高位划船'], description: '从斜上方向躯干拉动的分动器械，与水平划船和垂直下拉机分别记录。按本机加载配重比较进步。' },
  { name: '悍马高位下拉机', group: '固定器械', aliases: ['Hammer Strength Lat Pulldown', '悍马机', '悍马拉背机', '挂片式下拉机'], description: '挂片式分动下拉设备，按机型选择正握或反握。双臂记录两侧配重合计，单臂记录本侧配重。' },
  { name: '悍马推肩机', group: '固定器械', aliases: ['Hammer Strength Shoulder Press', '悍马机', '挂片式肩推机', '分动式推肩机'], description: '挂片式分动肩部推举设备。调整座椅使握把位于肩部附近，双臂同时训练时记录两侧配重合计。' },
  { name: '坐姿划船机', group: '固定器械', aliases: ['Seated Row Machine', '低位划船机', '器械划船'], description: '坐姿固定轨迹划船设备，可带胸垫。按设备标示配重记录，保持同一握法和座椅设置。' },
  { name: '高位下拉机', group: '固定器械', aliases: ['Lat Pulldown Machine', '拉背机', '下拉器'], description: '带大腿固定垫的高位下拉设备。固定双腿，按本机配重标示记录，不与分动挂片机直接比较重量。' },
  { name: '肩推机', group: '固定器械', aliases: ['Shoulder Press Machine', '推肩机', '器械肩推'], description: '固定轨迹坐姿肩推设备。调整座椅和起始位置，背部贴垫，控制下放深度。' },
  { name: '侧平举机', group: '固定器械', aliases: ['Lateral Raise Machine', '肩外展机'], description: '上臂或肘部抵住垫子的肩外展设备。调整转轴高度，控制抬起和回落，不耸肩借力。' },
  { name: '直臂后拉机', group: '固定器械', aliases: ['Pullover Machine', '器械普尔奥弗', '背阔肌后拉机'], description: '以肩部伸展完成下拉的后拉设备。按设备要求固定躯干和手臂，不把动作变成屈肘划船。' },
  { name: '胸托T杠机', group: '固定器械', aliases: ['Chest Supported T-Bar Row', '胸托划船机', '胸垫T杠'], description: '带胸垫和脚踏的T杠划船设备。胸部保持贴垫，记录实际加载配重，按握法区分动作。' },
  { name: '腰带深蹲机', group: '固定器械', aliases: ['Belt Squat Machine', '腰带蹲', '腰带式深蹲机'], description: '通过腰带连接负重的深蹲设备。固定腰带并确认释放机构，记录本机加载配重。' },
  { name: '钟摆深蹲机', group: '固定器械', aliases: ['Pendulum Squat', '摆臂深蹲机'], description: '沿摆臂轨迹下蹲的器械。调整安全挡，背肩贴垫，保持同一机器与踏板脚位。' },
  { name: '臀推机', group: '固定器械', aliases: ['Hip Thrust Machine', 'Glute Drive', '臀桥机', '翘臀机'], description: '以髋部伸展推动负重的设备。将保护垫或固定带放在髋部，记录挂片或配重塔的外部负重。' },
  { name: '臀后踢机', group: '固定器械', aliases: ['Glute Kickback Machine', '后蹬腿机', '后踢腿机'], description: '单腿向后蹬的臀部训练设备。支撑侧站稳、骨盆固定，按每侧记录次数。' },
  { name: '站姿腿弯举机', group: '固定器械', aliases: ['Standing Leg Curl', '单腿腿弯举机'], description: '站姿单腿屈膝设备。膝关节对齐转轴，固定大腿，左右侧分别记录。' },
  { name: '罗马椅', group: '训练辅助', aliases: ['Roman Chair', 'Back Extension Bench', '山羊挺身凳', '背部伸展凳'], description: '用于髋铰链和背部伸展的支撑凳。垫子位于髋部下方，避免顶部过度后仰；徒手与负重变式分开记录。' },
  { name: '卷腹机', group: '固定器械', aliases: ['Abdominal Crunch Machine', '腹肌机', '腹部屈曲机'], description: '固定轨迹卷腹设备。调整座椅和支撑垫，通过躯干屈曲完成动作，避免只用手臂拉动。' },
  { name: '滑雪机', group: '有氧设备', aliases: ['SkiErg', 'Ski Erg', '滑雪测功仪'], description: '双手拉动绳把模拟滑雪推进。记录实际时长和设备显示距离，阻力档位可写入备注。' },
  { name: '风阻单车', group: '有氧设备', aliases: ['Air Bike', 'Assault Bike', '风扇车'], description: '手脚配合推动风扇产生阻力的单车。记录时长与设备距离，间歇工作和休息时间可写入备注。' },
  { name: '雪橇车', group: '训练辅助', aliases: ['sled', 'prowler', '力量雪橇', '推雪橇车'], description: '在平整训练道上推动的负重雪橇。确认路线畅通，记录时长和距离；车体与加载配重、地面材质写入训练备注，保持同车同场地比较。' },
  { name: '战绳', group: '训练辅助', aliases: ['Battle Rope', 'Battle Ropes', '体能绳'], description: '固定锚点的粗绳，用于交替或双臂波浪。确认锚点牢固、周围无人，按实际工作时长记录。' },
  { name: '药球', group: '自由重量', aliases: ['Medicine Ball', 'Slam Ball', '重力球', '砸球'], description: '用于负重转体或抛砸的球。砸地必须选用允许砸地、低回弹的球，记录球体实际重量。' },
  { name: '沙袋', group: '自由重量', aliases: ['Sandbag', '力量沙袋', '训练沙包'], description: '可抱持或抓握的负重训练袋。检查提手与封口，记录整袋实际重量；行走时注明距离和时长。' },
  { name: '悬挂训练带', group: '训练辅助', aliases: ['TRX', 'Suspension Trainer', '悬吊带', '悬挂带'], description: '固定锚点的双手柄训练带。使用可承重的牢固锚点，以脚位和身体倾角调整难度，按徒手次数记录。' },
  { name: '跳箱', group: '训练辅助', aliases: ['Plyo Box', 'Plyometric Box', '跳跃箱'], description: '稳定防滑的平台。选择能轻稳落地的高度，跳上后逐脚下箱；箱高写入训练备注。' },
  { name: '健身球', group: '训练辅助', aliases: ['Stability Ball', 'Swiss Ball', '瑞士球', '瑜伽球'], description: '充气大球，用于卷腹和腿弯举等稳定性训练。检查充气与承重，保持地面防滑，球径写入备注。' },
] as const;
export const equipmentGroups = ['自由重量', '固定器械', '训练辅助', '有氧设备'] as const;
export type ExerciseFilter = { query?: string; muscles?: string[]; includeSecondary?: boolean; equipment?: string[]; equipmentMatch?: 'uses' | 'available'; equipmentActive?: boolean; bodyweightOnly?: boolean; favorite?: boolean; archived?: boolean; type?: '' | 'strength' | 'cardio' };
const searchKey = (text: string) => text.trim().toLocaleLowerCase().replace(/[\s-]+/g, '');
export function matchesEquipment(item: typeof equipmentCatalog[number], query: string) {
  const key = searchKey(query);
  return [item.name, ...item.aliases].some(text => searchKey(text).includes(key));
}
export function filterExercises(exercises: Exercise[], filter: ExerciseFilter): Exercise[] {
  const query = searchKey(filter.query || ''); const gear = filter.equipment || [];
  const matchingEquipment = new Set<string>(query ? equipmentCatalog.filter(item => matchesEquipment(item, query)).map(item => item.name) : []);
  return exercises.filter(exercise => {
    if (exercise.archived !== Boolean(filter.archived) || (filter.favorite && !exercise.favorite)) return false;
    if (query && ![exercise.name, ...exercise.aliases].some(text => searchKey(text).includes(query)) && !exercise.equipment.some(name => matchingEquipment.has(name))) return false;
    const targets = filter.includeSecondary ? [...exercise.primaryMuscles, ...exercise.secondaryMuscles] : exercise.primaryMuscles;
    if (filter.muscles?.length && !filter.muscles.some(m => targets.includes(m))) return false;
    if (filter.bodyweightOnly && exercise.equipment.length) return false;
    if (filter.type === 'cardio' && exercise.mode !== 'cardio') return false;
    if (filter.type === 'strength' && exercise.mode === 'cardio') return false;
    if (filter.equipmentMatch === 'available' && filter.equipmentActive) return exercise.equipment.every(item => gear.includes(item));
    return !gear.length || gear.some(item => exercise.equipment.includes(item));
  });
}
