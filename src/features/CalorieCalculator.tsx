import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Actions, Button, Field, Metric, PageTitle, Segmented, num, submit, useApp, value } from '../components/ui';
import { activityLevels, dailyEnergy, energyFromMacros, exerciseEnergy, portionEnergy, type DailyEnergyInput } from '../domain/calories';
import { displayNumber } from '../domain/analytics';
import { meta } from '../domain/model';
import { saveGoal } from '../db/commands';
import { today } from '../domain/dates';
import { AiMealEstimate } from './AiMealEstimate';

function FoodCalculator() {
  const { run } = useApp(); const [mode,setMode]=useState('label');
  const [result,setResult]=useState<{energy:number;per100g:number;grams:number}|null>(null);
  return <section className="panel"><div className="panel-heading"><h2>食物热量换算</h2><Segmented value={mode} onChange={next=>{setMode(next);setResult(null);}} label="食物计算方式" items={[{value:'label',label:'营养标签'},{value:'macros',label:'三大营养素'}]} /></div>
    <form onChange={()=>setResult(null)} onSubmit={submit(async form => { await run(async () => {
      const grams=num(form,'grams')!;
      const per100g=mode==='label' ? value(form,'unit')==='kj' ? num(form,'energy')!/4.184 : num(form,'energy')! : energyFromMacros({protein:num(form,'protein')!,carbs:num(form,'carbs')!,fat:num(form,'fat')!});
      setResult({energy:portionEnergy(per100g,grams),per100g,grams});
    }); })}>
      {mode==='label' ? <div className="form-grid"><Field label="每百克能量"><input name="energy" type="number" min="0" step="any" required /></Field><Field label="标签能量单位"><select name="unit"><option value="kcal">千卡（kcal）</option><option value="kj">千焦（kJ）</option></select></Field></div> : <><p className="form-note">按每百克蛋白质 × 4 + 碳水 × 4 + 脂肪 × 9 估算。三项必须已知；标签值已知时优先用标签。</p><div className="form-grid">{['蛋白质','碳水','脂肪'].map((name,index)=><Field key={name} label={`${name}（克 / 100 克）`}><input name={['protein','carbs','fat'][index]} type="number" min="0" max="100" step="any" required /></Field>)}</div></>}
      <Field label="食用克重（克）"><input name="grams" type="number" min="0.1" step="0.1" defaultValue="100" required /></Field><Actions><Button type="submit">计算食物热量</Button></Actions>
    </form>
    {result && <div className="calculation-result" role="status"><Metric label="这份食物约含" value={displayNumber(result.energy,1)} unit="千卡" detail={`${displayNumber(result.grams,1)} 克 × ${displayNumber(result.per100g,2)} 千卡 / 100 克`} /><p className="form-note">换算值不自动记入摄入。可在食物库录入每百克营养后添加餐食；三大营养素估算可能与含纤维、糖醇或酒精的标签值不同。</p><Link className="button secondary" to="/foods">打开食物库</Link></div>}
  </section>;
}
function DailyCalculator() {
  const {data,run}=useApp(); const now=today(data.profile.timeZone);
  const weight=[...data.weights].sort((a,b)=>b.localDate.localeCompare(a.localDate))[0];
  const [result,setResult]=useState<ReturnType<typeof dailyEnergy>|null>(null); const [busy,setBusy]=useState(false);
  return <section className="panel"><div className="panel-heading"><h2>每日能量需求估算</h2><span className="badge">Mifflin–St Jeor</span></div><p className="form-note">成人基础估算。这里的“静息代谢”是公式估计值；维持热量包含所选活动水平，不代表实际测量。</p>
    <form onChange={()=>setResult(null)} onSubmit={submit(async form => {await run(async()=>setResult(dailyEnergy({weightKg:num(form,'weight')!,heightCm:num(form,'height')!,age:num(form,'age')!,sex:value(form,'sex') as DailyEnergyInput['sex'],activity:value(form,'activity') as DailyEnergyInput['activity']})));})}>
      <div className="form-grid"><Field label="体重（千克）"><input name="weight" type="number" min="30" max="350" step="0.1" defaultValue={weight ? weight.weightGrams/1000 : ''} required /></Field><Field label="身高（厘米）"><input name="height" type="number" min="120" max="230" step="0.1" required /></Field><Field label="年龄（岁）"><input name="age" type="number" min="18" max="100" step="1" required /></Field><Field label="公式性别系数"><select name="sex"><option value="male">男性系数（+5）</option><option value="female">女性系数（−161）</option></select></Field></div><Field label="日常活动水平"><select name="activity">{activityLevels.map(level=><option value={level.value} key={level.value}>{level.label} · {level.factor}</option>)}</select></Field><Actions><Button type="submit">估算每日需求</Button></Actions>
    </form>
    {result && <div className="calculation-result"><div className="metrics calculator-metrics" role="status"><Metric label="静息代谢估算" value={displayNumber(result.resting)} unit="千卡 / 日" /><Metric label="每日维持热量估算" value={displayNumber(result.maintenance)} unit="千卡 / 日" detail={`静息代谢 × ${result.factor}`} /></div><p className="form-note">活动系数已包含日常运动，不再直接加上运动计算器的结果。以下目标可自行修改，保存前不会改变已有设置。</p>
      <form onSubmit={submit(async form=>{if(busy)return;setBusy(true);await run(async()=>{
        const date=value(form,'date');const existing=data.goals.find(goal=>goal.effectiveFrom===date);
        if(existing && !window.confirm(`该日期已有 ${existing.energy} 千卡目标。确认修订该生效日期后的目标？`))return;
        await saveGoal({...(existing||meta()),effectiveFrom:date,energy:num(form,'target')!,protein:existing?.protein??null,carbs:existing?.carbs??null,fat:existing?.fat??null},data.generation);
      },'营养目标已保存');setBusy(false);})}><div className="form-grid"><Field label="准备保存的每日目标（千卡）"><input name="target" type="number" min="1" step="1" key={result.maintenance} defaultValue={Math.round(result.maintenance)} required /></Field><Field label="目标生效日期"><input name="date" type="date" defaultValue={now} required /></Field></div><Actions><Button type="submit" disabled={busy}><Save size={15} />确认保存为营养目标</Button></Actions></form>
    </div>}
  </section>;
}
function ExerciseCalculator() {
  const {run}=useApp();const [result,setResult]=useState<ReturnType<typeof exerciseEnergy>|null>(null);
  return <section className="panel"><div className="panel-heading"><h2>运动消耗估算</h2><span className="badge">MET</span></div><p className="form-note">填写对应活动的 MET 值。MET × 3.5 × 体重（kg）÷ 200 × 时长（分钟）。不根据力量组数或吨位推测 MET。</p><form onChange={()=>setResult(null)} onSubmit={submit(async form=>{await run(async()=>setResult(exerciseEnergy({weightKg:num(form,'weight')!,minutes:num(form,'minutes')!,met:num(form,'met')!})));})}><div className="form-grid"><Field label="本次体重（千克）"><input name="weight" type="number" min="30" max="350" step="0.1" required /></Field><Field label="运动时长（分钟）"><input name="minutes" type="number" min="0.1" max="1440" step="0.1" required /></Field><Field label="活动 MET 值" hint="按具体活动与强度查表填写，1 MET 约为静息水平。"><input name="met" type="number" min="1" max="25" step="0.1" required /></Field></div><a className="text-button" href="https://pacompendium.com/" target="_blank" rel="noopener noreferrer">查阅活动 MET 表</a><Actions><Button type="submit">估算运动消耗</Button></Actions></form>
    {result && <div className="calculation-result"><div className="metrics calculator-metrics" role="status"><Metric label="该时段总消耗估算" value={displayNumber(result.total,1)} unit="千卡" detail="包含同时段静息消耗" /><Metric label="较静息多消耗估算" value={displayNumber(result.additional,1)} unit="千卡" detail="以 MET − 1 计算" /></div><p className="form-note">仅供粗略比较。结果不自动扣减摄入、改写训练记录或叠加到每日维持热量。</p></div>}
  </section>;
}
export function CalorieCalculatorPage() {
  const [params,setParams]=useSearchParams();const current=params.get('tab');const tab=['food','daily','exercise','ai'].includes(current||'') ? current! : 'food';
  return <><PageTitle title="热量计算" description="本地换算食物热量、估算每日需求与运动消耗。" action={<Link className="button secondary" to="/nutrition"><ArrowLeft size={16} />饮食记录</Link>} /><div className="calculator-tabs"><Segmented label="热量工具" value={tab} onChange={value=>setParams({tab:value})} items={[{value:'food',label:'食物热量'},{value:'daily',label:'每日需求'},{value:'exercise',label:'运动消耗'},{value:'ai',label:'AI 餐食'}]} /></div><div className="calculator-content">{tab==='food' ? <FoodCalculator/> : tab==='daily' ? <DailyCalculator/> : tab==='exercise' ? <ExerciseCalculator/> : <AiMealEstimate/>}</div></>;
}
