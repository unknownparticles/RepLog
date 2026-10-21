import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Star, Utensils, Trash2, Pencil, Copy, Check, ArrowRight, ChevronLeft, ChevronRight, BookOpen, ChefHat } from 'lucide-react';
import { Actions, Button, Empty, Field, Metric, Modal, PageTitle, num, submit, useApp, value } from '../components/ui';
import { FoodFields } from './FoodFields';
import { FoodCatalog } from './FoodCatalog';
import { foodAliases, normalizeFoodName } from '../domain/food-catalog';
import { dateSchema, mealSchema, meta, type Food, type Meal } from '../domain/model';
import { daySummary, displayNumber, nutritionValue } from '../domain/analytics';
import { shiftDate, today } from '../domain/dates';
import { journalFor, removeRecord, saveFood, saveJournal, saveMeal } from '../db/commands';

type ItemInput = { id: string; food: Food; quantity: string; unit: '克' | '份' };
export function MealDialog({ date, meal, onClose }: { date: string; meal?: Meal; onClose: () => void }) {
  const { data, run, notify } = useApp();
  const [creating, setCreating] = useState(!data.foods.some(f => !f.archived));
  const [items, setItems] = useState<ItemInput[]>(meal?.items.map(item => ({ id: item.id, food: item.food, quantity: String(item.quantity), unit: item.unit === '克' ? '克' : '份' })) || []);
  const [search, setSearch] = useState(''); const [busy, setBusy] = useState(false);
  const [record] = useState(() => meal || { ...meta(), localDate: date, timeZone: data.profile.timeZone, mealType: '早餐' as const, note: '', items: [] });
  function add(food: Food) { setItems(current => [...current, { id: crypto.randomUUID(), food: structuredClone(food), quantity: food.servingGrams ? '1' : '100', unit: food.servingGrams ? '份' : '克' }]); }
  return <Modal title={creating ? '新建食物' : meal ? '编辑餐食' : '添加餐食'} onClose={onClose} wide>
    {creating ? <><FoodFields onSaved={food => { setCreating(false); add(food); }} /><button className="text-button" onClick={() => setCreating(false)}>返回餐食</button></> : <form onSubmit={submit(async form => {
      setBusy(true);
      await run(async () => {
        if (!items.length) throw new Error('请先添加至少一种食物');
        const next = mealSchema.parse({ ...record, localDate: value(form, 'date'), mealType: value(form, 'type'), note: value(form, 'note'), items: items.map(item => {
          const quantity = Number(item.quantity);
          if (!item.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0) throw new Error('食物数量必须大于零');
          const grams = Math.round(quantity * (item.unit === '份' ? item.food.servingGrams! : 1) * 10) / 10;
          return { id: item.id, food: item.food, grams, quantity, unit: item.unit === '份' ? item.food.servingName || '份' : '克' };
        }) });
        await saveMeal(next, data.generation); onClose();
      }, '餐食已保存，请在记全当天后确认完整'); setBusy(false);
    })}>
      <div className="form-grid"><Field label="归属日期"><input name="date" type="date" defaultValue={record.localDate} required /></Field><Field label="餐次"><select name="type" defaultValue={record.mealType}>{['早餐', '午餐', '晚餐', '加餐'].map(type => <option key={type}>{type}</option>)}</select></Field></div>
      <div className="meal-items">{items.map((item, index) => {
        const grams = Number(item.quantity) * (item.unit === '份' ? item.food.servingGrams! : 1);
        const energy = Number.isFinite(grams) ? nutritionValue(item.food, grams, 'energy') : null;
        return <div className="meal-item-editor" key={item.id}><div><strong>{item.food.name}</strong><small>{displayNumber(energy)} 千卡 · {displayNumber(grams, 1)} 克</small></div><input aria-label={`${item.food.name}数量`} type="number" min="0.1" step="0.1" required value={item.quantity} onChange={e => setItems(items.map((i, n) => n === index ? { ...i, quantity: e.target.value } : i))} /><select aria-label={`${item.food.name}单位`} value={item.unit} onChange={e => setItems(items.map((i, n) => n === index ? { ...i, unit: e.target.value as '克' | '份' } : i))}><option>克</option>{item.food.servingGrams && <option value="份">{item.food.servingName || '份'}</option>}</select><button type="button" className="icon-button danger" aria-label={`移除${item.food.name}`} onClick={() => setItems(items.filter((_, n) => n !== index))}><Trash2 size={16} /></button></div>;
      })}</div>
      <Link className="text-button" to={`/healthy-meals?date=${date}`}>用已登记食物智能匹配与组合</Link>
      <label className="search"><Search size={17} /><input placeholder="搜索本地食物…" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <div className="food-picker">{data.foods.filter(f => !f.archived && foodAliases(f).some(alias => alias.includes(normalizeFoodName(search)))).sort((a, b) => Number(b.favorite) - Number(a.favorite)).map(food => <button type="button" className="food-option" key={food.id} onClick={() => add(food)}><span>{food.favorite && '★ '}{food.name}<small>{food.energy} 千卡 / 100 克</small></span><Plus size={18} /></button>)}</div>
      <button type="button" className="text-button" onClick={() => { if (!items.length || window.confirm('已选择的食物会保留，继续新建食物？')) setCreating(true); }}><Plus size={16} />新建食物</button>
      <Field label="备注（可选）"><textarea name="note" defaultValue={record.note} placeholder="备注" rows={3} /></Field>
      {meal && <p className="form-note">默认使用记录时的营养快照；需采用新标签值时，请移除该食物并重新添加。</p>}
      <Actions><Button disabled={busy} type="submit">{busy ? '正在保存…' : '保存餐食'}</Button></Actions>
    </form>}
  </Modal>;
}

export function MealList({ date }: { date: string }) {
  const { data, run } = useApp(); const [editing, setEditing] = useState<Meal | null>(null);
  const meals = data.meals.filter(m => m.localDate === date);
  async function copy(meal: Meal) {
    const target = window.prompt('复制到哪一天？请输入日期（年-月-日）', today(data.profile.timeZone));
    if (target === null) return;
    await run(async () => {
      dateSchema.parse(target);
      await saveMeal({ ...meal, ...meta(), localDate: target, timeZone: data.profile.timeZone, items: meal.items.map(i => ({ ...i, id: crypto.randomUUID() })) }, data.generation);
    }, '已复制餐食，目标日期需要重新确认完整');
  }
  return <>{['早餐', '午餐', '晚餐', '加餐'].map((type, index) => {
    const entries = meals.filter(m => m.mealType === type);
    const energy = entries.flatMap(m => m.items).reduce((sum, item) => sum + nutritionValue(item.food, item.grams, 'energy')!, 0);
    return <section className="meal-section" key={type}><div className="meal-section-title"><span className={`meal-symbol meal-${index}`}><Utensils size={17} /></span><h3>{type}</h3><span className="muted">{entries.length ? `${displayNumber(energy)} 千卡` : '未记录'}</span></div>{entries.map(meal => <div className="record-row" key={meal.id}><div className="record-body"><strong>{(meal.note.startsWith('健身食谱 · ') || meal.note.startsWith('健康组合餐 · ')) ? meal.note.split('\n')[0].replace(/^(健身食谱|健康组合餐) · /, '') : meal.items.map(i => i.food.name).join('、')}</strong><small>{meal.items.map(i => `${i.food.name} ${displayNumber(i.grams, 1)}克`).join(' · ')}{meal.note && !(meal.note.startsWith('健身食谱 · ') || meal.note.startsWith('健康组合餐 · ')) && ` · ${meal.note}`}</small></div><div className="row-actions"><button className="icon-button" aria-label={`编辑${type}`} onClick={() => setEditing(meal)}><Pencil size={16} /></button><button className="icon-button" aria-label={`复制${type}`} onClick={() => void copy(meal)}><Copy size={16} /></button><button className="icon-button danger" aria-label={`删除${type}`} onClick={() => { if (window.confirm('确定删除这份餐食？当天的完整确认将取消。')) void run(() => removeRecord('meals', meal, data.generation), '餐食已删除'); }}><Trash2 size={16} /></button></div></div>)}{!entries.length && <p className="meal-placeholder">还没添加餐食</p>}</section>;
  })}{editing && <MealDialog date={date} meal={editing} onClose={() => setEditing(null)} />}</>;
}

export function NutritionPage() {
  const { data, run } = useApp(); const [params, setParams] = useSearchParams();
  const now = today(data.profile.timeZone); const parsed = dateSchema.safeParse(params.get('date') || now); const date = parsed.success ? parsed.data : now;
  const [adding, setAdding] = useState(params.get('add') === '1'); const day = daySummary(data, date);
  return <><PageTitle title="饮食记录" description="按餐次记录食物和摄入。" action={<Button onClick={() => setAdding(true)}><Plus size={18} />记录餐食</Button>} />
    <div className="toolbar"><div className="date-switcher"><button className="icon-button" aria-label="前一天" onClick={() => setParams({ date: shiftDate(date, -1) })}><ChevronLeft size={18} /></button><input type="date" aria-label="饮食日期" value={date} onChange={e => { if (dateSchema.safeParse(e.target.value).success) setParams({ date: e.target.value }); }} /><button className="icon-button" aria-label="后一天" onClick={() => setParams({ date: shiftDate(date, 1) })}><ChevronRight size={18} /></button></div><Link className="button secondary" to={`/healthy-meals?date=${date}`}>健康组合餐</Link><Link className="button secondary" to={`/recipes?date=${date}`}><ChefHat size={17} />健身食谱</Link><Link className="button secondary" to="/calories">热量计算</Link><Link className="button secondary" to="/foods"><BookOpen size={17} />食物库<ArrowRight size={16} /></Link></div>
    <div className="metrics four"><Metric label="已记录摄入" value={day.diet === 'empty' ? '—' : displayNumber(day.nutrition.energy.value)} unit="千卡" detail={day.diet === 'complete' ? '已确认全天完整' : '部分记录不代表全天摄入'} tone="orange" />{(['protein', 'carbs', 'fat'] as const).map((key, i) => <Metric key={key} label={['蛋白质', '碳水化合物', '脂肪'][i]} value={day.diet === 'empty' ? '—' : displayNumber(day.nutrition[key].value, 1)} unit="克" detail={!day.nutrition[key].known ? '存在未知项 · 仅为已知小计' : day.goal ? `目标 ${day.goal[key] ?? '未设置'} 克` : '未设置目标'} tone={['green', 'blue', 'purple'][i]} />)}</div>
    <div className="panel"><div className="panel-heading"><h2>当日餐食</h2><button className={`button ${day.diet === 'complete' ? 'complete' : 'secondary'}`} onClick={() => { if (day.diet === 'empty' && !window.confirm('当天没有食物记录，确定确认全天零摄入？')) return; void run(() => saveJournal({ ...journalFor(date, data.journals), dietConfirmed: day.diet !== 'complete' }, data.generation), day.diet === 'complete' ? '已取消完整确认' : '已确认全天饮食记录完整'); }}><Check size={16} />{day.diet === 'complete' ? '已记全 · 点击取消' : '确认全天已记全'}</button></div><MealList date={date} /></div>
    {adding && <MealDialog date={date} onClose={() => { setAdding(false); if (params.has('add')) setParams({ date }); }} />}
  </>;
}

export function FoodsPage() {
  const { data, run } = useApp(); const [search, setSearch] = useState(''); const [editing, setEditing] = useState<Food | 'new' | null>(null); const [favorites, setFavorites] = useState(false); const [catalogOpen, setCatalogOpen] = useState(false);
  const foods = data.foods.filter(f => !f.archived && foodAliases(f).some(alias => alias.includes(normalizeFoodName(search))) && (!favorites || f.favorite));
  return <><PageTitle title="食物库" description="管理常用食物和每百克营养。" action={<Button onClick={() => setEditing('new')}><Plus size={18} />新建食物</Button>} /><div className="toolbar"><button className="button secondary" onClick={() => setCatalogOpen(true)}>健身食物参考目录</button><Link className="button secondary" to="/healthy-meals">组合健康餐</Link><label className="search"><Search size={18} /><input placeholder="搜索食物…" value={search} onChange={e => setSearch(e.target.value)} /></label><button className={`button ${favorites ? 'complete' : 'secondary'}`} onClick={() => setFavorites(!favorites)}><Star size={17} />只看收藏</button></div>
    {foods.length ? <div className="library-grid">{foods.map(food => <article key={food.id} className="library-card"><div className="library-top"><span className="square-icon orange"><Utensils size={22} /></span><button className={`icon-button ${food.favorite ? 'starred' : ''}`} aria-label={`${food.favorite ? '取消收藏' : '收藏'}${food.name}`} onClick={() => void run(() => saveFood({ ...food, favorite: !food.favorite }, data.generation))}><Star size={18} fill={food.favorite ? 'currentColor' : 'none'} /></button></div><h3>{food.name}</h3><p><strong>{food.energy}</strong> 千卡 / 100 克</p><div className="tags"><span>蛋白 {food.protein ?? '未知'}g</span><span>碳水 {food.carbs ?? '未知'}g</span><span>脂肪 {food.fat ?? '未知'}g</span></div><div className="card-bottom"><button className="text-button" onClick={() => setEditing(food)}><Pencil size={14} />编辑</button><button className="text-button muted" onClick={() => { if (window.confirm('归档后不再出现在新增列表，历史餐食会保留。继续？')) void run(() => saveFood({ ...food, archived: true }, data.generation), '食物已归档'); }}>归档</button></div></article>)}</div> : <div className="panel"><Empty title="暂无食物" action={<Button onClick={() => setEditing('new')}>新建第一种食物</Button>}>按食品营养标签录入后，可在餐食中直接选用。</Empty></div>}
    {catalogOpen && <FoodCatalog onClose={() => setCatalogOpen(false)} />}
    {editing && <Modal title={editing === 'new' ? '新建食物' : '编辑食物'} onClose={() => setEditing(null)}><FoodFields food={editing === 'new' ? undefined : editing} onSaved={() => setEditing(null)} /></Modal>}
  </>;
}
