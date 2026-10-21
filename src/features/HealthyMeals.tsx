import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Actions, Button, Empty, Field, Metric, PageTitle, submit, useApp, value } from '../components/ui';
import { dateSchema, meta, type Food, type Meal, type MealCombo } from '../domain/model';
import { today } from '../domain/dates';
import { displayNumber } from '../domain/analytics';
import { comboNutrition, healthyMealIdeas, matchedLineGrams, parseRegisteredFoods, scaledComboItems, type ComboItem } from '../domain/healthy-meals';
import { foodAliases, normalizeFoodName } from '../domain/food-catalog';
import { recipeServingsSchema } from '../domain/recipes';
import { saveMealCombo, saveRegisteredMeal } from '../db/healthy-meals';
import { removeRecord } from '../db/commands';

type Row = { id: string; foodId: string; name: string; quantity: string; unit: string };
function rowFromItem(item: ComboItem): Row { return { id: crypto.randomUUID(), foodId: item.foodId, name: '', quantity: String(item.grams), unit: '克' }; }
function checkedRow(row: Row, foods: Food[]) {
  const food = foods.find(food => food.id === row.foodId && !food.archived);
  if (!food) throw new Error('请选择已登记食物；未登记、同名或部分匹配需手动确认');
  return { foodId: food.id, grams: matchedLineGrams({ quantity: row.quantity.trim() ? Number(row.quantity) : null, unit: row.unit }, food) };
}

export function HealthyMealsPage() {
  const { data, run, notify } = useApp(); const navigate = useNavigate(); const [params] = useSearchParams();
  const parsedDate = dateSchema.safeParse(params.get('date'));
  const date = parsedDate.success ? parsedDate.data : today(data.profile.timeZone);
  const [name, setName] = useState('我的健康餐'); const [text, setText] = useState(''); const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Row[]>([]); const [servings, setServings] = useState('1');
  const [editing, setEditing] = useState<MealCombo | null>(null); const [busy, setBusy] = useState(false); const lock = useRef(false); const editor = useRef<HTMLElement>(null);
  const activeFoods = data.foods.filter(food => !food.archived);
  const visibleFoods = activeFoods.filter(food => foodAliases(food).some(alias => alias.includes(normalizeFoodName(search))));
  const checked = rows.map(row => { try { return { item: checkedRow(row, activeFoods), error: '' }; } catch (error) { return { item: null, error: (error as Error).message }; } });
  const items = checked.flatMap(row => row.item ? [row.item] : []);
  const amount = recipeServingsSchema.safeParse(servings.trim() ? Number(servings) : NaN);
  const complete = rows.length > 0 && rows.length <= 50 && checked.every(row => row.item) && amount.success;
  let totals: ReturnType<typeof comboNutrition> | null = null;
  if (complete) { try { totals = comboNutrition(scaledComboItems(items, amount.data!), activeFoods); } catch { /* 换算后克重超出边界时保留输入，等待用户修正。 */ } }
  const valid = complete && totals !== null;
  function update(id: string, patch: Partial<Row>) { setRows(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row)); }
  function parseText(input: string) {
    try {
      const lines = parseRegisteredFoods(input, activeFoods);
      if (!lines.length) throw new Error('请先填写食物和数量');
      if (lines.length > 50) throw new Error('每份组合最多包含五十项食物');
      setRows(lines.map(line => ({ id: crypto.randomUUID(), foodId: line.foodId, name: line.name, quantity: line.quantity === null ? '' : String(line.quantity), unit: line.unit })));
      editor.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } catch (error) { notify((error as Error).message, true); }
  }
  async function saveCombo() {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await run(async () => {
      if (checked.some(row => row.error)) throw new Error('请先确认所有食物与克重，再保存组合');
      const combo = await saveMealCombo({ ...(editing || meta()), name, items }, data.generation);
      setEditing(combo);
    }, '组合已保存，尚未计入饮食'); } finally { lock.current = false; setBusy(false); }
  }
  function load(combo: MealCombo) { setEditing(combo); setName(combo.name); setRows(combo.items.map(rowFromItem)); setServings('1'); setText(''); editor.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }

  return <><PageTitle title="健康组合餐" description="从已登记食物搭配，按登记营养数据计算并重复使用。" action={<Link className="button secondary" to={`/nutrition?date=${date}`}>饮食记录</Link>} />
    <div className="toolbar"><Link className="button secondary" to="/foods">登记与管理食物</Link><Link className="button secondary" to={`/recipes?date=${date}`}>查看食谱做法</Link><button className="button secondary" onClick={() => { setEditing(null); setRows([]); setName('我的健康餐'); setText(''); setServings('1'); }}>新建组合</button></div>
    <section className="panel"><div className="panel-heading"><h2>智能匹配已登记食物</h2><span className="badge">本地匹配 · 离线可用</span></div>
      <p className="form-note">仅使用食物库已登记且未归档的数据。未匹配不计为零，品牌或生熟名称不明确时需选择；蛋白粉、增肌粉按具体标签。</p>
      <Field label="要匹配的食物" hint="例：胡萝卜100克，西兰花150克，某品牌蛋白粉1勺，盐2克。勺、杯、碗需先登记对应克重。"><textarea value={text} maxLength={2000} rows={3} onChange={e => setText(e.target.value)} /></Field>
      <button className="button secondary" disabled={!text.trim() || busy} onClick={() => {
        if (rows.length && !window.confirm('匹配结果会替换当前组合中的食物，继续？')) return;
        parseText(text);
      }}>匹配到组合</button>
    </section>
    <section className="panel" ref={editor}><h2>{editing ? '编辑已保存组合' : '搭配我的健康餐'}</h2>
      <form onSubmit={submit(async form => {
        if (lock.current) return;
        lock.current = true; setBusy(true);
        try { await run(async () => {
          if (!valid) throw new Error('请先确认所有食物、数量与份数');
          const target = dateSchema.parse(value(form, 'date'));
          await saveRegisteredMeal(name, items, data.foods, { date: target, timeZone: data.profile.timeZone, mealType: value(form, 'mealType') as Meal['mealType'], servings: amount.data! }, data.generation);
          navigate(`/nutrition?date=${target}`);
        }, '已按登记食物计入饮食，请在记全当天后确认完整'); } finally { lock.current = false; setBusy(false); }
      })}>
        <Field label="组合餐名称"><input value={name} onChange={e => setName(e.target.value)} maxLength={120} required /></Field>
        <div className="combo-rows">{rows.map((row, index) => {
          const food = activeFoods.find(food => food.id === row.foodId);
          const customUnit = !['克', 'g', '千克', '公斤', 'kg', '份'].includes(row.unit) ? row.unit : '';
          return <fieldset className="combo-row" key={row.id}><legend>食物 {index + 1}{row.name && ` · ${row.name}`}</legend><div className="combo-row-fields"><Field label={`食物 ${index + 1} 登记条目`}><select aria-label={`食物 ${index + 1} 登记条目`} value={food?.id || ''} onChange={e => update(row.id, { foodId: e.target.value })} required><option value="">请选择已登记食物</option>{activeFoods.map(food => <option value={food.id} key={food.id}>{food.name} · {food.energy}千卡/100克{activeFoods.filter(other => other.name === food.name).length > 1 ? ` · ${food.id.slice(-6)}` : ''}</option>)}</select></Field><Field label={`食物 ${index + 1} 数量`}><input type="number" value={row.quantity} min="0" step="any" required onChange={e => update(row.id, { quantity: e.target.value })} /></Field><Field label={`食物 ${index + 1} 单位`}><select aria-label={`食物 ${index + 1} 单位`} value={row.unit} onChange={e => update(row.id, { unit: e.target.value })}><option value="克">克</option>{['g', '千克', '公斤', 'kg'].filter(unit => unit === row.unit || unit === '千克').map(unit => <option key={unit}>{unit}</option>)}<option value="份">份</option>{[...new Set([customUnit, food?.servingName].filter(unit => unit && !['克', '份', '千克'].includes(unit)))].map(unit => <option key={unit}>{unit}</option>)}</select></Field><button type="button" className="icon-button danger" aria-label={`移除组合食物${index + 1}`} onClick={() => setRows(rows.filter(current => current.id !== row.id))}><Trash2 size={17} /></button></div>
            {checked[index].error ? <p className="form-note" role="alert">{checked[index].error}</p> : <p className="form-note">{displayNumber(checked[index].item!.grams, 1)} 克 · {displayNumber(food!.energy * checked[index].item!.grams / 100, 1)} 千卡（登记值）</p>}
          </fieldset>;
        })}</div>
        {!activeFoods.length && <Empty title="还没有登记食物" action={<Link className="button secondary" to="/foods">去登记食物</Link>}>先登记常用蔬果、肉类和产品标签，再组合餐食。</Empty>}
        <label className="search"><Search size={17} /><input aria-label="搜索可组合食物" value={search} placeholder="搜索可组合的已登记食物…" onChange={e => setSearch(e.target.value)} /></label>
        <div className="combo-food-picker">{visibleFoods.map(food => <button key={food.id} className="food-option" type="button" disabled={rows.length >= 50} onClick={() => setRows(rows => [...rows, rowFromItem({ foodId: food.id, grams: food.servingGrams || 100 })])}><span>{food.name}<small>{food.energy} 千卡 / 100 克</small></span><Plus size={17} /></button>)}</div>
        <div className="form-grid"><Field label="归属日期"><input name="date" type="date" defaultValue={date} required /></Field><Field label="餐次"><select name="mealType" defaultValue="午餐">{['早餐', '午餐', '晚餐', '加餐'].map(type => <option key={type}>{type}</option>)}</select></Field><Field label="食用份数"><input value={servings} min="0.1" max="10" step="0.1" type="number" required onChange={e => setServings(e.target.value)} /></Field></div>
        <p className="form-note">每项数量为组合一份，营养预览按食用份数换算。保存组合不入账，下次载入时使用食物库最新登记值。</p>
        {!amount.success && <p className="form-note" role="alert">食用份数需为 0.1–10，最多一位小数。</p>}
        {complete && !totals && <p className="form-note" role="alert">换算后每项须为 0.1–10000 克，请调整数量或份数。</p>}
        <div className="metrics four combo-totals" aria-live="polite">{(['energy', 'protein', 'carbs', 'fat'] as const).map((key, index) => <Metric key={key} label={['登记热量', '蛋白质', '碳水', '脂肪'][index]} value={totals ? displayNumber(totals[key].value, 1) : '—'} unit={index ? '克' : '千卡'} detail={!totals ? '请确认全部食物和数量' : !totals[key].known ? '有未知项 · 仅已知小计' : '按登记值与实际克重计算'} />)}</div>
        <Actions><button type="button" className="button secondary" disabled={busy || !items.length || checked.some(row => row.error) || !name.trim()} onClick={() => void saveCombo()}>保存组合</button><Button type="submit" disabled={busy || !valid}>{busy ? '正在保存…' : '确认计入饮食'}</Button></Actions>
      </form>
    </section>
    <section className="panel"><div className="panel-heading"><h2>我的组合餐</h2><span className="badge">{data.mealCombos.length} 个</span></div>{data.mealCombos.length ? data.mealCombos.map(combo => <article className="saved-combo" key={combo.id}><div><h3>{combo.name}</h3><p className="form-note">{combo.items.map(item => `${data.foods.find(food => food.id === item.foodId)?.name || '食物已缺失'} ${item.grams}克`).join(' · ')}</p></div><div className="row-actions"><button className="button secondary" onClick={() => load(combo)} aria-label={`载入${combo.name}`}>载入组合</button><button className="icon-button danger" aria-label={`删除${combo.name}`} onClick={() => { if (window.confirm('确定删除这个组合？历史餐食仍保留。')) void run(async () => { await removeRecord('mealCombos', combo, data.generation); if (editing?.id === combo.id) setEditing(null); }, '组合已删除'); }}><Trash2 size={17} /></button></div></article>) : <p className="form-note">把常用搭配保存下来，下次只需调整食用份数。</p>}</section>
    <section className="panel"><h2>健身餐搭配参考</h2><p className="form-note">选择一个搭配作为起点，缺少的食材需先登记，油盐按实际使用补充。营养由你登记的数据计算。</p><div className="meal-ideas">{healthyMealIdeas.map(idea => <article key={idea.name}><h3>{idea.name}</h3><p>{idea.description}</p><p>{idea.items.map(item => `${item.name} ${item.grams}克`).join(' · ')}</p><button className="button secondary" onClick={() => {
        if (rows.length && !window.confirm('参考搭配将替换当前食物，继续？')) return;
        setEditing(null); setName(idea.name); setServings('1'); const description = idea.items.map(item => `${item.name}${item.grams}克`).join('，'); setText(description); parseText(description);
      }} aria-label={`采用${idea.name}`}>匹配已登记食材</button></article>)}</div><p className="form-note">搭配依据：<a href="https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/" target="_blank" rel="noopener noreferrer">NHS 均衡膳食指南</a>与<a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/" target="_blank" rel="noopener noreferrer">国际运动营养学会蛋白质声明</a>。示例由本项目编写，可按个人全天目标调整。</p></section>
  </>;
}
