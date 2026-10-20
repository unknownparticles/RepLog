import type { Exercise } from './model';
import { meta } from './record-meta';

type Definition = [number, string, string[], string[], string[], string[], Exercise['mode'], string];
const definitions: Definition[] = [
  [111, '战绳交替波浪', ['Alternating Battle Ropes', '战绳波浪'], ['有氧'], ['肩', '手臂', '核心', '腿'], ['战绳'], 'cardio', '检查战绳锚点，双脚站稳，屈髋屈膝并收紧核心。\n双手交替上下摆动，使绳子形成连续波浪，躯干保持稳定。\n按每组实际工作时长记录，休息安排和绳子规格写入训练备注。'],
  [112, '药球砸地', ['Medicine Ball Slam', 'Slam Ball', '砸药球'], ['腿', '核心'], ['肩', '背', '手臂'], ['药球'], 'weighted', '使用允许砸地、低回弹的球，确认前方地面与周围无人。\n双手举球后配合屈髋屈膝向前下方砸地，不追求腰部过伸。\n待球停稳后屈髋屈膝捡起，记录球重和次数，不迎着反弹接球。'],
  [113, '药球坐姿转体', ['Medicine Ball Russian Twist', '药球俄罗斯转体'], ['核心'], ['肩', '手臂'], ['药球'], 'weighted', '坐稳后屈膝、双脚着地，双手持球于胸前，保持背部自然。\n在可控范围内转动躯干，将球移向身体一侧，再转向另一侧，避免用腰部猛甩。\n左右各一次合计一次，记录球重和完整循环次数；有腰部不适时停止。'],
  [114, '沙袋抱胸深蹲', ['Sandbag Bear Hug Squat', '沙袋深蹲'], ['腿', '臀'], ['核心', '手臂'], ['沙袋'], 'weighted', '确认沙袋封口牢固，抱稳于胸前，双脚站稳并收紧核心。\n屈髋屈膝下蹲，膝盖沿脚尖方向移动，沙袋贴近身体。\n推地站起，记录整袋重量和次数，不在底部塌腰或松开沙袋。'],
  [115, '沙袋负重行走', ['Sandbag Carry', '沙袋抱走'], ['有氧', '腿'], ['臀', '核心', '手臂'], ['沙袋'], 'cardio', '抱稳沙袋并确认行走路线平整畅通，保持视线可看清前方。\n收紧核心，以可控小步前行，保持呼吸，不后仰或扭腰。\n记录实际时长和距离，整袋重量及抱持方式写入训练备注。'],
  [116, '悬挂划船', ['Suspension Row', 'TRX Row', '悬吊划船'], ['背'], ['手臂', '核心'], ['悬挂训练带'], 'bodyweight', '检查承重锚点和训练带，握稳手柄，双脚踩实并适度后倾。\n身体保持直线，将胸部拉向手柄，肘部向后，不耸肩或塌腰。\n控制伸臂还原，记录次数；脚位和身体倾角写入备注以保持难度一致。'],
  [117, '悬挂俯卧撑', ['Suspension Push-Up', 'TRX Push-Up', '悬吊俯卧撑'], ['胸'], ['肩', '手臂', '核心'], ['悬挂训练带'], 'bodyweight', '检查承重锚点，握稳手柄，双脚支撑并前倾，先从较直立角度开始。\n保持躯干稳定，屈肘让胸部靠近手柄，不让双手失控外滑。\n平稳推回并记录次数，身体倾角写入备注，不能稳定时减小倾角。'],
  [118, '跳箱', ['Box Jump', '跳箱训练'], ['腿', '臀'], ['核心'], ['跳箱'], 'bodyweight', '确认跳箱稳固防滑，从较低箱高开始，双脚站稳并适度屈髋屈膝。\n摆臂配合蹬地跳上箱面，双脚完整落在箱上，屈膝轻稳落地。\n站稳后逐脚下箱，完成一次计一次；箱高写入备注，不连续反弹下跳。'],
  [119, '健身球腿弯举', ['Stability Ball Leg Curl', 'Swiss Ball Leg Curl', '瑞士球腿弯举'], ['腿', '臀'], ['核心'], ['健身球'], 'bodyweight', '仰卧，双脚跟放在健身球上，双臂撑地辅助稳定。\n抬髋使躯干稳定，屈膝将球滚向臀部，避免腰部过伸。\n控制伸膝将球推出，记录次数；无法稳定时减小幅度。'],
  [120, '健身球卷腹', ['Stability Ball Crunch', 'Swiss Ball Crunch', '瑞士球卷腹'], ['核心'], [], ['健身球'], 'bodyweight', '将中下背稳定放在球上，双脚分开踩实，双手轻放胸前。\n通过躯干屈曲使肋骨靠近骨盆，不用手拉头或借反弹起身。\n缓慢回落至舒适范围，球保持稳定，记录完整卷腹次数。'],
];

export const conditioningExercises: Exercise[] = definitions.map(([id, name, aliases, primaryMuscles, secondaryMuscles, equipment, mode, instructions]) => ({
  ...meta(`builtin-${String(id).padStart(3, '0')}`), name, aliases, primaryMuscles, secondaryMuscles, equipment, mode, instructions,
  optionalEquipment: [], builtin: true, favorite: false, archived: false,
}));
