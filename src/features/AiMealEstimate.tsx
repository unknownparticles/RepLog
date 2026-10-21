import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Actions, Button, Field, num, submit, useApp, value } from '../components/ui';
import { configuredMealAI, type MealEstimate, type MealEstimateProvider } from '../services/meal-ai';
import { makeEstimatedMealDraft, saveEstimatedMeal } from '../db/estimated-meal';
import { today } from '../domain/dates';
import { portionEnergy } from '../domain/calories';
import { displayNumber } from '../domain/analytics';
import type { Meal } from '../domain/model';

export function AiMealEstimate({ provider: override }: { provider?: MealEstimateProvider }) {
  const { data, run } = useApp();
  const provider = useMemo(() => override || configuredMealAI(),[override]);
  const [text,setText] = useState(''); const [consent,setConsent] = useState(false);
  const [estimate,setEstimate] = useState<MealEstimate | null>(null);
  const [busy,setBusy] = useState(false); const [saving,setSaving] = useState(false); const [confirmed,setConfirmed] = useState(false);
  const controller = useRef<AbortController | null>(null); const mounted = useRef(true);
  useEffect(() => { mounted.current=true; return () => { mounted.current=false; controller.current?.abort(); }; },[]);
  return <section className="panel ai-meal-panel"><div className="panel-heading"><h2>AI 餐食草稿</h2><span className="badge">{provider.enabled ? '已配置服务' : '尚未配置'}</span></div>
    <Link className="button secondary" to="/healthy-meals">仅匹配已登记食物热量（离线）</Link>
    <p className="form-note">描述食物和大致份量，AI 返回可修改的估算草稿。只有确认后才会记入餐食，未知营养项保留为空。</p>
    {!provider.enabled && <p className="calculator-notice">AI 接口已预留，当前没有连接服务。可继续使用本地计算与手动记餐。</p>}
    <form onSubmit={submit(async () => {
      if (busy || !provider.enabled) return;
      setEstimate(null); setConfirmed(false); setBusy(true); const request = new AbortController(); controller.current=request;
      await run(async () => {
        const result = await provider.estimate({schemaVersion:1,requestId:crypto.randomUUID(),text,locale:'zh-CN'},{consent,signal:request.signal});
        if (mounted.current && !request.signal.aborted) setEstimate(result);
      });
      if (mounted.current) setBusy(false);
    })}>
      <Field label="餐食描述" hint="例如：午餐吃了熟米饭约 150 克、鸡胸肉约 100 克，少量食用油。"><textarea name="description" value={text} maxLength={2000} required disabled={!provider.enabled || busy} onChange={event => { setText(event.target.value); setEstimate(null); setConfirmed(false); setConsent(false); }} /></Field>
      <label className="consent-row"><input type="checkbox" checked={consent} disabled={!provider.enabled || busy} onChange={event => setConsent(event.target.checked)} />我同意将本次餐食描述发送给已配置的 AI 服务。不会发送历史记录或个人档案。</label>
      <Actions>{busy && <button type="button" className="button secondary" onClick={() => controller.current?.abort()}>取消请求</button>}<Button type="submit" disabled={!provider.enabled || !consent || !text.trim() || busy}>{busy ? '正在估算…' : '生成待确认草稿'}</Button></Actions>
    </form>
    {estimate && <form className="estimate-review" onSubmit={submit(async form => {
      if (saving || !confirmed) return;
      setSaving(true);
      const saved = await run(async () => {
        const items = estimate.items.map((item,index) => ({ ...item,name:value(form,`name-${index}`),grams:num(form,`grams-${index}`)!,energyPer100g:num(form,`energy-${index}`)!,proteinPer100g:num(form,`protein-${index}`,true),carbsPer100g:num(form,`carbs-${index}`,true),fatPer100g:num(form,`fat-${index}`,true) }));
        const draft = makeEstimatedMealDraft(items,{date:value(form,'date'),timeZone:data.profile.timeZone,mealType:value(form,'mealType') as Meal['mealType'],provider:estimate.provider});
        await saveEstimatedMeal(draft,data.generation);
      },'已保存人工确认的 AI 估算餐食；当天仍需确认是否记全。');
      if (saved) {setEstimate(null);setConfirmed(false);setText('');setConsent(false);} setSaving(false);
    })} onChange={() => setConfirmed(false)}>
      <div className="panel-heading"><h2>检查并修改结果</h2><span className="badge">{estimate.provider} · 估算</span></div>
      {estimate.warnings.map((warning,index) => <p className="calculator-notice" key={index}>{warning}</p>)}
      {estimate.items.map((item,index) => <fieldset className="estimate-item" key={index}><legend>食物 {index+1}</legend><div className="form-grid"><Field label={`食物 ${index+1} 名称`}><input name={`name-${index}`} defaultValue={item.name} required maxLength={120} /></Field><Field label={`食物 ${index+1} 克重`}><input name={`grams-${index}`} type="number" min="0.1" max="10000" step="0.1" defaultValue={item.grams} required /></Field></div><div className="form-grid"><Field label={`食物 ${index+1} 每百克千卡`}><input name={`energy-${index}`} type="number" min="0" max="1000" step="any" defaultValue={item.energyPer100g} required /></Field>{(['protein','carbs','fat'] as const).map((key,i) => <Field key={key} label={`食物 ${index+1} ${['蛋白质','碳水','脂肪'][i]}克 / 100 克`}><input name={`${key}-${index}`} type="number" min="0" max="100" step="any" defaultValue={item[`${key}Per100g`] ?? ''} /></Field>)}</div><p className="tiny muted">原始草稿约 {displayNumber(portionEnergy(item.energyPer100g,item.grams))} 千卡；以确认的克重和营养值重新计算。</p>{item.assumptions.length>0 && <ul className="estimate-assumptions">{item.assumptions.map((assumption,i) => <li key={i}>{assumption}</li>)}</ul>}</fieldset>)}
      <div className="form-grid"><Field label="餐食归属日期"><input type="date" name="date" defaultValue={today(data.profile.timeZone)} required /></Field><Field label="餐食餐次"><select name="mealType" defaultValue="午餐">{['早餐','午餐','晚餐','加餐'].map(type => <option key={type}>{type}</option>)}</select></Field></div>
      <label className="consent-row"><input type="checkbox" checked={confirmed} onChange={event => {event.stopPropagation();setConfirmed(event.target.checked);}} />我已检查食物、份量和营养数据，确认以估算值记入。</label>
      <Actions><button type="button" className="button secondary" disabled={saving} onClick={() => setEstimate(null)}>放弃草稿</button><Button type="submit" disabled={!confirmed || saving}>{saving ? '保存中…' : '确认并保存餐食'}</Button></Actions>
    </form>}
    <Link className="text-button" to="/nutrition">返回手动记餐</Link>
  </section>;
}
