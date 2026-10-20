import type { Exercise } from './model';

export type Point = [number, number];
export type Joint = 'head' | 'shoulder' | 'hip' | 'le' | 'lh' | 're' | 'rh' | 'lk' | 'lf' | 'rk' | 'rf';
export type Pose = Record<Joint, Point>;
export type Scene = 'floor' | 'bench' | 'incline' | 'seat' | 'cable' | 'pulldown' | 'pullup' | 'dip' | 'rack' | 'legpress' | 'bike' | 'rower' | 'treadmill' | 'elliptical' | 'stairs' | 'rope' | 'wheel' | 'romanChair' | 'ski';
export type Illustration = { from: Pose; to: Pose; scene: Scene; still?: boolean; name: string };
const front: Pose = { head:[80,19], shoulder:[80,33], hip:[80,66], le:[65,48], lh:[63,69], re:[95,48], rh:[97,69], lk:[70,83], lf:[66,102], rk:[90,83], rf:[94,102] };
const side: Pose = { head:[91,20], shoulder:[87,34], hip:[79,66], le:[92,50], lh:[94,68], re:[83,51], rh:[84,69], lk:[75,85], lf:[86,102], rk:[85,84], rf:[97,102] };
const sitting: Pose = { ...side, head:[78,20], shoulder:[75,34], hip:[71,68], le:[91,47], lh:[105,62], re:[82,47], rh:[95,62], lk:[101,71], lf:[108,101], rk:[91,76], rf:[98,101] };
const lying: Pose = { head:[119,57], shoulder:[105,65], hip:[65,65], le:[93,47], lh:[105,29], re:[112,46], rh:[119,29], lk:[48,83], lf:[47,102], rk:[60,85], rf:[63,102] };
const ground: Pose = { head:[28,81], shoulder:[41,88], hip:[78,91], le:[39,99], lh:[62,99], re:[48,98], rh:[73,98], lk:[105,80], lf:[128,100], rk:[112,86], rf:[137,100] };
const hinge: Pose = { ...side, head:[116,38], shoulder:[107,51], hip:[73,68], le:[105,72], lh:[104,92], re:[96,72], rh:[94,91], lk:[71,86], lf:[82,102], rk:[84,85], rf:[96,102] };
const kneeling: Pose = { head:[106,47], shoulder:[95,59], hip:[64,66], le:[103,76], lh:[112,99], re:[93,77], rh:[101,99], lk:[58,91], lf:[33,99], rk:[70,91], rf:[45,99] };
const pose = (base: Pose, changes: Partial<Pose>): Pose => ({ ...base, ...changes });
const shift = (base: Pose, y: number): Pose => Object.fromEntries(Object.entries(base).map(([key,[x,z]]) => [key,[x,z+y]])) as Pose;
const scene = (name: string, from: Pose, to: Pose, equipment: Scene = 'floor', still = false): Illustration => ({ name, from, to, scene: equipment, still });

const bench = scene('卧推', pose(lying,{le:[87,67],lh:[99,56],re:[117,65],rh:[127,54]}), lying, 'bench');
const incline = scene('上斜推', pose(lying,{head:[115,26],shoulder:[102,39],hip:[69,69],le:[88,46],lh:[102,25],re:[116,48],rh:[127,28]}), pose(lying,{head:[115,26],shoulder:[102,39],hip:[69,69],le:[94,22],lh:[95,6],re:[117,23],rh:[119,7]}), 'incline');
const shoulder = scene('肩上推举', pose(front,{le:[57,40],lh:[57,20],re:[103,40],rh:[103,20]}), pose(front,{le:[65,17],lh:[69,5],re:[95,17],rh:[91,5]}));
const lateral = scene('侧平举', front, pose(front,{le:[51,32],lh:[29,34],re:[109,32],rh:[131,34]}));
const curl = scene('弯举', side, pose(side,{le:[92,50],lh:[107,35],re:[83,51],rh:[97,38]}));
const squat = scene('深蹲', side, pose(side,{head:[95,40],shoulder:[90,54],hip:[65,77],le:[97,68],lh:[111,58],re:[89,68],rh:[103,58],lk:[97,79],lf:[88,102],rk:[91,87],rf:[101,102]}));
const deadlift = scene('髋铰链', hinge, side);
const lunge = scene('分腿蹲', pose(side,{hip:[79,61],lk:[109,73],lf:[118,102],rk:[55,80],rf:[43,102]}), pose(side,{head:[88,40],shoulder:[84,54],hip:[78,82],le:[90,72],lh:[93,91],re:[80,73],rh:[82,92],lk:[111,83],lf:[118,102],rk:[52,98],rf:[43,102]}));
const row = scene('俯身划船', hinge, pose(hinge,{le:[90,47],lh:[94,66],re:[81,50],rh:[85,70]}));
const seatedRow = scene('坐姿划船', pose(sitting,{le:[102,46],lh:[125,54],re:[96,50],rh:[119,58],lk:[104,80],lf:[135,98],rk:[99,87],rf:[129,101]}), pose(sitting,{le:[58,50],lh:[83,58],re:[54,56],rh:[78,64],lk:[104,80],lf:[135,98],rk:[99,87],rf:[129,101]}), 'rower');
const pulldown = scene('高位下拉', pose(sitting,{le:[60,21],lh:[51,9],re:[94,21],rh:[106,9]}), pose(sitting,{le:[57,52],lh:[54,35],re:[98,49],rh:[109,34]}), 'pulldown');
const pullup = scene('引体向上', pose(front,{head:[80,41],shoulder:[80,54],hip:[80,83],le:[60,32],lh:[48,14],re:[100,32],rh:[112,14],lk:[69,96],lf:[55,103],rk:[91,96],rf:[105,103]}), pose(front,{head:[80,17],shoulder:[80,31],hip:[80,61],le:[54,29],lh:[48,14],re:[106,29],rh:[112,14],lk:[70,78],lf:[59,91],rk:[90,78],rf:[102,91]}), 'pullup');
const pushup = scene('俯卧撑', {head:[123,48],shoulder:[113,61],hip:[78,75],le:[109,80],lh:[108,101],re:[120,81],rh:[121,101],lk:[50,88],lf:[28,102],rk:[53,91],rf:[34,102]}, {head:[123,74],shoulder:[111,84],hip:[77,89],le:[97,97],lh:[108,101],re:[122,97],rh:[121,101],lk:[49,96],lf:[28,102],rk:[53,98],rf:[34,102]});
const dip = scene('双杠臂屈伸', pose(front,{head:[80,17],shoulder:[80,31],hip:[80,59],le:[60,46],lh:[54,64],re:[100,46],rh:[106,64],lk:[66,78],lf:[75,96],rk:[93,78],rf:[101,96]}), pose(front,{head:[80,35],shoulder:[80,49],hip:[80,78],le:[59,57],lh:[54,64],re:[101,57],rh:[106,64],lk:[67,94],lf:[78,104],rk:[94,94],rf:[105,104]}), 'dip');
const bridge = scene('臀桥', ground, pose(ground,{hip:[78,64],lk:[109,77],rk:[115,84]}));
const hipThrust = scene('臀推', pose(ground,{head:[28,59],shoulder:[40,68],hip:[78,86]}), pose(ground,{head:[28,59],shoulder:[40,68],hip:[79,63],lk:[110,77],rk:[117,83]}), 'bench');
const legExtension = scene('腿屈伸', sitting, pose(sitting,{lf:[131,73],rf:[124,81]}), 'seat');
const legCurl = scene('腿弯举', pose(lying,{head:[124,58],shoulder:[113,67],hip:[80,67],le:[117,83],lh:[133,84],re:[124,78],rh:[139,79],lk:[54,73],lf:[30,79],rk:[61,77],rf:[36,84]}), pose(lying,{head:[124,58],shoulder:[113,67],hip:[80,67],le:[117,83],lh:[133,84],re:[124,78],rh:[139,79],lk:[54,73],lf:[48,47],rk:[61,77],rf:[58,52]}), 'bench');
const seatedCurl = scene('坐姿腿弯举', pose(sitting,{lf:[133,72],rf:[126,80]}), pose(sitting,{lf:[90,97],rf:[81,99]}), 'seat');
const legPress = scene('腿举', pose(sitting,{head:[35,42],shoulder:[43,54],hip:[64,82],le:[52,71],lh:[69,88],re:[45,75],rh:[63,92],lk:[78,56],lf:[105,40],rk:[85,65],rf:[112,49]}), pose(sitting,{head:[35,42],shoulder:[43,54],hip:[64,82],le:[52,71],lh:[69,88],re:[45,75],rh:[63,92],lk:[95,57],lf:[120,28],rk:[102,63],rf:[127,36]}), 'legpress');
const overhead = scene('过顶臂屈伸', pose(front,{le:[63,14],lh:[74,35],re:[97,14],rh:[85,36]}), pose(front,{le:[63,14],lh:[69,2],re:[97,14],rh:[91,2]}));
const triceps = scene('下压', pose(side,{le:[93,50],lh:[114,43],re:[85,54],rh:[105,48]}), pose(side,{le:[93,50],lh:[98,73],re:[85,54],rh:[90,77]}), 'cable');
const fly = scene('飞鸟', pose(front,{le:[51,38],lh:[28,47],re:[109,38],rh:[132,47]}), pose(front,{le:[66,43],lh:[76,46],re:[94,43],rh:[84,46]}), 'cable');
const reverseFly = scene('反向飞鸟', pose(front,{le:[66,43],lh:[76,46],re:[94,43],rh:[84,46]}), pose(front,{le:[51,38],lh:[28,47],re:[109,38],rh:[132,47]}), 'seat');
const floorRaise = scene('仰卧举腿', pose(ground,{lk:[106,95],lf:[135,100],rk:[112,99],rf:[143,102]}), pose(ground,{lk:[91,64],lf:[98,34],rk:[100,68],rf:[111,38]}));
const crunch = scene('卷腹', pose(ground,{le:[30,91],lh:[27,74],re:[39,94],rh:[34,79]}), pose(ground,{head:[49,57],shoulder:[54,69],le:[42,75],lh:[47,53],re:[51,81],rh:[56,58]}));
const deadBug = scene('死虫', pose(ground,{le:[46,65],lh:[47,40],re:[54,70],rh:[57,48],lk:[90,64],lf:[116,65],rk:[100,67],rf:[125,70]}), pose(ground,{le:[23,77],lh:[6,69],re:[54,70],rh:[57,48],lk:[90,64],lf:[116,65],rk:[109,83],rf:[138,92]}));
const birdDog = scene('鸟狗', kneeling, pose(kneeling,{le:[118,56],lh:[142,53],lk:[42,65],lf:[16,64]}));
const running = scene('跑步', pose(side,{le:[101,44],lh:[113,30],re:[74,48],rh:[62,60],lk:[105,78],lf:[103,100],rk:[59,79],rf:[49,63]}), pose(side,{le:[77,48],lh:[63,59],re:[103,45],rh:[117,31],lk:[61,79],lf:[50,63],rk:[107,77],rf:[104,100]}));
const walking = scene('快走', pose(side,{le:[96,50],lh:[107,63],re:[77,51],rh:[69,66],lk:[92,83],lf:[111,100],rk:[69,84],rf:[54,102]}), pose(side,{le:[79,51],lh:[68,64],re:[98,50],rh:[109,62],lk:[70,83],lf:[54,101],rk:[94,83],rf:[113,101]}));
const cycling = scene('骑行', {head:[89,24],shoulder:[80,36],hip:[59,60],le:[99,48],lh:[115,43],re:[90,52],rh:[109,48],lk:[88,66],lf:[91,88],rk:[65,79],rf:[76,99]}, {head:[89,24],shoulder:[80,36],hip:[59,60],le:[99,48],lh:[115,43],re:[90,52],rh:[109,48],lk:[65,79],lf:[76,99],rk:[88,66],rf:[91,88]}, 'bike');
const calf = scene('提踵', side, shift(side,-6));
const plank = scene('平板支撑', pose(pushup.from,{le:[106,98],lh:[130,100],re:[113,99],rh:[138,101]}), pose(pushup.from,{le:[106,98],lh:[130,100],re:[113,99],rh:[138,101]}), 'floor', true);
const sidePlank = scene('侧平板支撑', {head:[122,42],shoulder:[111,56],hip:[79,75],le:[107,78],lh:[115,101],re:[112,31],rh:[116,9],lk:[51,89],lf:[29,101],rk:[53,91],rf:[34,103]}, {head:[122,42],shoulder:[111,56],hip:[79,75],le:[107,78],lh:[115,101],re:[112,31],rh:[116,9],lk:[51,89],lf:[29,101],rk:[53,91],rf:[34,103]}, 'floor', true);
const pallof = scene('抗旋转支撑', pose(side,{le:[107,39],lh:[127,43],re:[104,47],rh:[125,49]}), pose(side,{le:[107,39],lh:[127,43],re:[104,47],rh:[125,49]}), 'cable', true);

// 每个内置动作都有明确映射；相近模式共享线稿，器械由动作本身决定。
const definitions: Array<[number[], Illustration]> = [
  [[1,2,38,43],bench], [[3,39],incline],
  [[4],scene('哑铃飞鸟',pose(lying,{le:[77,53],lh:[54,56],re:[132,53],rh:[150,56]}),lying,'bench')],
  [[5],pushup], [[6],fly], [[7,49],row], [[8],{...row,from:pose(row.from,{le:[116,64],lh:[126,75]}),to:pose(row.to,{le:[116,64],lh:[126,75]}),scene:'bench'}], [[9,45,47],pulldown], [[10,83],seatedRow], [[11,12],pullup],
  [[13,53],shoulder], [[14,54],lateral],
  [[15],scene('俯身飞鸟',pose(hinge,{le:[100,71],lh:[96,90],re:[114,71],rh:[121,90]}),pose(hinge,{le:[81,45],lh:[57,45],re:[132,45],rh:[151,43]}))],
  [[16],scene('面拉',pose(side,{le:[113,39],lh:[139,38],re:[110,45],rh:[135,44]}),pose(side,{le:[64,40],lh:[82,30],re:[66,48],rh:[84,38]}),'cable')],
  [[17,18,22,56,57],squat], [[19],legPress], [[20],legExtension], [[21],legCurl], [[23,58],lunge], [[24,50,51],deadlift], [[25],hipThrust], [[26],bridge],
  [[27,66,67,68,69,70],curl], [[28],triceps], [[29,42],dip], [[30],plank], [[31],sidePlank], [[32,75],crunch], [[33],deadBug], [[34],running],
  [[35],{...running,scene:'treadmill'}], [[36],cycling], [[37],seatedRow],
  [[40],scene('器械推胸',pose(sitting,{le:[71,43],lh:[91,41],re:[63,51],rh:[84,48]}),pose(sitting,{le:[101,40],lh:[127,43],re:[96,47],rh:[122,50]}),'seat')],
  [[41],{...fly,scene:'seat'}], [[44],reverseFly],
  [[46],scene('直臂下压',pose(side,{le:[108,28],lh:[130,18],re:[103,34],rh:[124,24]}),pose(side,{le:[103,52],lh:[112,73],re:[96,57],rh:[104,77]}),'cable')],
  [[48],{...row,scene:'incline'}], [[52],{...shoulder,from:pose(shoulder.from,{lk:[104,78],lf:[107,102],rk:[56,78],rf:[53,102]}),to:pose(shoulder.to,{lk:[104,78],lf:[107,102],rk:[56,78],rf:[53,102]}),scene:'seat'}],
  [[55],scene('前平举',side,pose(side,{le:[111,35],lh:[135,35],re:[103,43],rh:[127,43]}))],
  [[59],seatedCurl], [[60],calf], [[61],scene('坐姿提踵',sitting,pose(sitting,{lk:[101,66],lf:[108,96],rk:[91,71],rf:[98,96]}),'seat')],
  [[62],scene('髋外展',pose(front,{hip:[80,66],lk:[72,80],lf:[69,101],rk:[88,80],rf:[91,101]}),pose(front,{hip:[80,66],lk:[50,78],lf:[39,99],rk:[110,78],rf:[121,99]}),'seat')],
  [[63],scene('髋内收',pose(front,{hip:[80,66],lk:[50,78],lf:[39,99],rk:[110,78],rf:[121,99]}),pose(front,{hip:[80,66],lk:[72,80],lf:[69,101],rk:[88,80],rf:[91,101]}),'seat')],
  [[64],scene('后踢腿',side,pose(side,{rk:[61,72],rf:[36,78]}),'cable')], [[65],{...bridge,from:pose(bridge.from,{rk:[96,67],rf:[113,43]}),to:pose(bridge.to,{rk:[95,43],rf:[113,21]})}],
  [[71],overhead], [[72],scene('仰卧臂屈伸',pose(lying,{le:[97,38],lh:[119,40],re:[111,37],rh:[132,40]}),lying,'bench')],
  [[73],scene('悬垂举腿',pullup.from,pose(pullup.from,{lk:[106,81],lf:[133,82],rk:[111,88],rf:[140,90]}),'pullup')], [[74],floorRaise], [[76],pallof], [[77],birdDog],
  [[78],{...walking,scene:'elliptical'}], [[79],walking],
  [[80],scene('登阶',pose(side,{lk:[99,69],lf:[109,78],rk:[66,84],rf:[56,101]}),pose(shift(side,-10),{lk:[75,77],lf:[77,91],rk:[104,57],rf:[111,77]}),'stairs')],
  [[81],scene('跳绳',front,shift(front,-9),'rope')],
  [[82],scene('壶铃摆动',pose(hinge,{lh:[90,92],rh:[94,91]}),pose(side,{le:[108,36],lh:[131,38],re:[104,43],rh:[127,42]}))],
  [[84],scene('腹肌轮',kneeling,pose(kneeling,{head:[120,65],shoulder:[110,76],hip:[72,80],le:[125,84],lh:[142,98],re:[117,86],rh:[135,98]}),'wheel')],
];
export const illustrationRegistry = new Map<string, Illustration>(definitions.flatMap(([ids,drawing]) => ids.map(id => [`builtin-${String(id).padStart(3,'0')}`,drawing] as const)));
const machineDrawings: Array<[number[], Illustration]> = [
  [[85,86,87], {...illustrationRegistry.get('builtin-040')!, name: '分动器械推胸'}],
  [[88,93,98,108], {...seatedRow, name: '胸托器械划船', scene: 'seat'}],
  [[89], {...pulldown, name: '高位器械划船', scene: 'seat'}],
  [[90,91], {...pulldown, name: '分动器械下拉', scene: 'seat'}],
  [[92,95], {...shoulder, name: '器械推肩', scene: 'seat'}],
  [[94], pulldown], [[96], {...lateral, name: '器械侧平举', scene: 'seat'}],
  [[97], scene('器械直臂后拉', pose(sitting,{le:[92,16],lh:[112,6],re:[82,22],rh:[101,12]}), pose(sitting,{le:[94,57],lh:[110,76],re:[84,62],rh:[99,81]}),'seat')],
  [[99,100], {...squat, name: '器械深蹲'}], [[101], hipThrust],
  [[102], scene('器械后踢腿', side, pose(side,{rk:[61,72],rf:[36,78]}),'seat')],
  [[103], scene('站姿屈膝', side, pose(side,{rf:[61,69]}),'seat')],
  [[104], {...deadlift, name: '罗马椅髋伸展', scene: 'romanChair'}],
  [[105], scene('器械卷腹', sitting, pose(sitting,{head:[99,37],shoulder:[94,49],le:[105,59],lh:[113,76],re:[98,66],rh:[104,82]}),'seat')],
  [[106], scene('滑雪推进', pose(side,{le:[104,17],lh:[117,6],re:[96,22],rh:[108,11]}), hinge,'ski')],
  [[107], {...cycling, name: '风阻骑行'}],
];
for (const [ids, drawing] of machineDrawings) for (const id of ids) illustrationRegistry.set(`builtin-${String(id).padStart(3,'0')}`, drawing);
const custom = scene('自定义动作',front,front,'floor',true);
export function illustrationFor(exercise: Pick<Exercise,'id'|'builtin'>): Illustration {
  return exercise.builtin ? illustrationRegistry.get(exercise.id) || custom : custom;
}
