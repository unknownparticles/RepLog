import { useEffect, useRef, useState } from 'react';
import type { Exercise } from '../domain/model';
import { illustrationFor, type Joint, type Point, type Pose, type Scene } from '../domain/exercise-illustrations';

function Motion({ attribute, from, to, enabled }: { attribute: string; from: number; to: number; enabled: boolean }) {
  if (!enabled || from === to) return null;
  return <animate attributeName={attribute} values={`${from};${from};${to};${to};${from};${from}`} keyTimes="0;0.12;0.45;0.57;0.9;1" dur="3.2s" repeatCount="indefinite" />;
}
function Segment({ a, b, endA = a, endB = b, motion, className }: { a: Point; b: Point; endA?: Point; endB?: Point; motion: boolean; className?: string }) {
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={className}><Motion attribute="x1" from={a[0]} to={endA[0]} enabled={motion} /><Motion attribute="y1" from={a[1]} to={endA[1]} enabled={motion} /><Motion attribute="x2" from={b[0]} to={endB[0]} enabled={motion} /><Motion attribute="y2" from={b[1]} to={endB[1]} enabled={motion} /></line>;
}
function Dot({ at, end = at, radius, motion, className }: { at: Point; end?: Point; radius: number; motion: boolean; className?: string }) {
  return <circle cx={at[0]} cy={at[1]} r={radius} className={className}><Motion attribute="cx" from={at[0]} to={end[0]} enabled={motion} /><Motion attribute="cy" from={at[1]} to={end[1]} enabled={motion} /></circle>;
}
const offset = ([x,y]: Point, dx: number, dy: number): Point => [x+dx,y+dy];
const middle = ([x,y]: Point,[a,b]: Point): Point => [(x+a)/2,(y+b)/2];

function Equipment({ scene, exercise, from, to, motion }: { scene: Scene; exercise: Exercise; from: Pose; to: Pose; motion: boolean }) {
  const cable = exercise.equipment.includes('绳索器械');
  const band = exercise.equipment.includes('弹力带');
  return <g className="art-equipment" strokeWidth="1.5">
    <path d="M12 104H148" className="art-ground" />
    {scene === 'bench' && <path d={exercise.id === 'builtin-025' ? 'M17 75H52M22 75V102M47 75V102' : 'M48 74H132M56 74V102M124 74V102'} />}
    {scene === 'incline' && <path d="M49 80L121 33M51 81V102M108 43V102M46 102H116" />}
    {scene === 'seat' && <path d="M58 71H103M62 71V101M98 71V101M59 70V39" />}
    {exercise.equipment.some(name => name.startsWith('悍马')) && <><path d="M136 102V20M126 102H148M128 80H144" /><Segment a={[136,27]} b={from.rh} endB={to.rh} motion={motion} /><Segment a={[130,33]} b={from.lh} endB={to.lh} motion={motion} /><circle cx="136" cy="78" r="7" /></>}
    {exercise.equipment.includes('胸托T杠机') && <path d="M40 101L72 60M64 60H81M60 102H126M119 102V70" />}
    {exercise.equipment.includes('腰带深蹲机') && <><path d="M43 104H125M43 104V62H57" /><Segment a={from.hip} b={[80,104]} endA={to.hip} motion={motion} /></>}
    {exercise.equipment.includes('钟摆深蹲机') && <path d="M35 102V12H124M38 12L85 36M29 102H49" />}
    {scene === 'romanChair' && <path d="M47 100L78 66H89M75 67L107 102M44 102H116" />}
    {scene === 'ski' && <><path d="M143 102V7H120M136 102H151" /><Segment a={[127,9]} b={from.rh} endB={to.rh} motion={motion} /><Segment a={[119,9]} b={from.lh} endB={to.lh} motion={motion} /></>}
    {scene === 'pulldown' && <><path d="M19 101V9H141V101M58 74H96M64 74V101M92 74V101" /><Segment a={[80,9]} b={middle(from.lh,from.rh)} endB={middle(to.lh,to.rh)} motion={motion} /><Segment a={from.lh} b={from.rh} endA={to.lh} endB={to.rh} motion={motion} /></>}
    {scene === 'pullup' && <><path d="M33 102V13H127V102M26 102H42M119 102H137" />{exercise.mode === 'assisted' && <path d="M27 93H48V65H34M33 70H44M33 77H44M33 84H44" />}</>}
    {scene === 'dip' && <path d="M39 63H61M99 63H121M49 63V103M111 63V103" />}
    {scene === 'legpress' && <><path d="M25 49L60 88H87M30 50V103M63 89V103M92 93L140 38" /><Segment a={offset(from.lf,-9,-7)} b={offset(from.rf,7,7)} endA={offset(to.lf,-9,-7)} endB={offset(to.rf,7,7)} motion={motion} /></>}
    {(scene === 'cable' || cable) && scene !== 'pulldown' && <>
      <path d="M148 101V13H137M140 84H150M140 91H150M140 98H150" />
      <Dot at={[142,19]} radius={3} motion={false} />
      <Segment a={[142,19]} b={from.rh} endB={to.rh} motion={motion} />
      {exercise.id === 'builtin-006' && <><path d="M12 101V15H23" /><Segment a={[19,20]} b={from.lh} endB={to.lh} motion={motion} /></>}
    </>}
    {band && <Segment a={[139,98]} b={from.rh} endB={to.rh} motion={motion} className="art-band" />}
    {scene === 'rower' && exercise.equipment.includes('划船机') && <><path d="M22 100H144M49 86H76M55 86V100M133 77V100" /><circle cx="140" cy="85" r="11" /><Segment a={[135,77]} b={from.rh} endB={to.rh} motion={motion} /></>}
    {scene === 'bike' && <><circle cx="37" cy="90" r="13" /><circle cx="122" cy="90" r="13" /><path d="M37 90L58 65L82 88L122 90L111 49M82 88L105 57M49 63H68M108 45H126" /><circle cx="82" cy="88" r="7" /></>}
    {scene === 'treadmill' && <path d="M25 104H136M128 104V48H108M118 103V99" />}
    {scene === 'elliptical' && <><circle cx="126" cy="88" r="12" /><path d="M28 104H141M122 88L113 33H104M127 88L133 38H141M52 96L119 90M34 101L119 96" /></>}
    {scene === 'stairs' && <path d="M23 104H49V92H79V79H113V66H141" />}
    {scene === 'rope' && <path d="M63 65C10 12 9 22 12 53C15 117 145 117 148 53C151 22 150 12 97 65" className="art-band" />}
    {scene === 'wheel' && <><Dot at={middle(from.lh,from.rh)} end={middle(to.lh,to.rh)} radius={7} motion={motion} /><Segment a={offset(middle(from.lh,from.rh),-10,0)} b={offset(middle(from.lh,from.rh),10,0)} endA={offset(middle(to.lh,to.rh),-10,0)} endB={offset(middle(to.lh,to.rh),10,0)} motion={motion} /></>}
    {(exercise.equipment.includes('史密斯机') || exercise.equipment.includes('深蹲架')) && <path d="M34 102V13M132 102V13M29 27H39M127 27H137M29 75H39M127 75H137" />}
  </g>;
}

function HandWeight({ at, end, motion, kettlebell = false }: { at: Point; end: Point; motion: boolean; kettlebell?: boolean }) {
  return <g className="art-weight" strokeWidth="1.9">
    {kettlebell ? <><Dot at={offset(at,0,6)} end={offset(end,0,6)} radius={5} motion={motion} /><Dot at={at} end={end} radius={3} motion={motion} /></> : <>
      <Segment a={offset(at,-5,0)} b={offset(at,5,0)} endA={offset(end,-5,0)} endB={offset(end,5,0)} motion={motion} />
      <Segment a={offset(at,-6,-4)} b={offset(at,-6,4)} endA={offset(end,-6,-4)} endB={offset(end,-6,4)} motion={motion} />
      <Segment a={offset(at,6,-4)} b={offset(at,6,4)} endA={offset(end,6,-4)} endB={offset(end,6,4)} motion={motion} />
    </>}
  </g>;
}

export function ExerciseIllustration({ exercise, animate = true, className = '' }: { exercise: Exercise; animate?: boolean; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const [visible,setVisible] = useState(false);
  const [reduced,setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [foreground,setForeground] = useState(document.visibilityState !== 'hidden');
  const drawing = illustrationFor(exercise);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    const visibility = () => setForeground(document.visibilityState !== 'hidden');
    preference.addEventListener('change',update); document.addEventListener('visibilitychange',visibility);
    if (!('IntersectionObserver' in window)) setVisible(true);
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => setVisible(entries[0].isIntersecting),{rootMargin:'40px'}) : null;
    if (svg.current) observer?.observe(svg.current);
    return () => { observer?.disconnect(); preference.removeEventListener('change',update); document.removeEventListener('visibilitychange',visibility); };
  },[]);
  const motion = animate && visible && foreground && !reduced && !drawing.still;
  const barOnShoulders = ['builtin-017','builtin-056'].includes(exercise.id);
  const prepare = (base: Pose): Pose => barOnShoulders ? {...base,le:offset(base.shoulder,-8,10),lh:offset(base.shoulder,5,-3),re:offset(base.shoulder,1,13),rh:offset(base.shoulder,15,0)} : exercise.id === 'builtin-018' ? {...base,le:offset(base.shoulder,-2,18),lh:offset(base.shoulder,12,9),re:offset(base.shoulder,8,20),rh:offset(base.shoulder,16,11)} : base;
  const from = prepare(drawing.from), to = prepare(drawing.to);
  const bones: Array<[Joint,Joint]> = [['hip','lk'],['lk','lf'],['shoulder','le'],['le','lh'],['shoulder','hip'],['hip','rk'],['rk','rf'],['shoulder','re'],['re','rh']];
  const barbell = exercise.equipment.some(name => ['杠铃','六角杠','T杠','史密斯机'].includes(name));
  const dumbbell = exercise.equipment.includes('哑铃');
  const center = barOnShoulders ? offset(from.shoulder,0,-3) : middle(from.lh,from.rh);
  const endCenter = barOnShoulders ? offset(to.shoulder,0,-3) : middle(to.lh,to.rh);
  return <svg ref={svg} viewBox="0 0 160 112" role="img" aria-label={`${exercise.name}${exercise.builtin ? '动作线稿' : '自定义动作占位线稿'}`} className={`exercise-art ${className}`} data-animated={motion ? 'true' : 'false'} data-pose={drawing.name} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <title>{exercise.name} · {drawing.name}</title><desc>动作与器械的简化线条示意。</desc>
    <Equipment scene={drawing.scene} exercise={exercise} from={from} to={to} motion={motion} />
    <g className="art-body" strokeWidth="2.6">
      <Segment a={offset(from.head,0,7)} b={from.shoulder} endA={offset(to.head,0,7)} endB={to.shoulder} motion={motion} />
      {bones.map(([a,b],index) => <Segment key={`${a}-${b}`} a={from[a]} b={from[b]} endA={to[a]} endB={to[b]} motion={motion} className={[0,1,2,3].includes(index) ? 'art-secondary' : undefined} />)}
      <Dot at={from.head} end={to.head} radius={5.7} motion={motion} />
    </g>
    {dumbbell && (['builtin-018','builtin-071'].includes(exercise.id) ? <HandWeight at={center} end={endCenter} motion={motion} /> : <><HandWeight at={from.lh} end={to.lh} motion={motion} /><HandWeight at={from.rh} end={to.rh} motion={motion} /></>)}
    {exercise.equipment.includes('壶铃') && <HandWeight at={center} end={endCenter} motion={motion} kettlebell />}
    {barbell && <g className="art-weight" strokeWidth="2"><Segment a={offset(center,-22,0)} b={offset(center,22,0)} endA={offset(endCenter,-22,0)} endB={offset(endCenter,22,0)} motion={motion} /><Segment a={offset(center,-18,-6)} b={offset(center,-18,6)} endA={offset(endCenter,-18,-6)} endB={offset(endCenter,-18,6)} motion={motion} /><Segment a={offset(center,18,-6)} b={offset(center,18,6)} endA={offset(endCenter,18,-6)} endB={offset(endCenter,18,6)} motion={motion} /></g>}
  </svg>;
}
