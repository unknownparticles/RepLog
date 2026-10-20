import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChefHat, Clock, ExternalLink, Search } from 'lucide-react';
import { Actions, Button, Empty, Field, Metric, Modal, PageTitle, num, submit, useApp, value } from '../components/ui';
import { displayNumber } from '../domain/analytics';
import { dateSchema, type Meal } from '../domain/model';
import { today } from '../domain/dates';
import { recipeIngredients, recipeNutrition, recipes, recipeServingsSchema, recipeSourceUrl, scaledIngredients, type Recipe } from '../domain/recipes';
import { saveRecipeMeal } from '../db/recipe-meal';

function RecipeDetails({ recipe, date, onClose }: { recipe: Recipe; date: string; onClose: () => void }) {
  const { data, run } = useApp(); const navigate = useNavigate();
  const [servings, setServings] = useState('1'); const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const parsed = recipeServingsSchema.safeParse(servings.trim() ? Number(servings) : NaN);
  const amount = parsed.success ? parsed.data : null;
  const totals = amount === null ? null : recipeNutrition(recipe, amount);
  return <Modal title={recipe.name} onClose={onClose} wide>
    <p className="form-note">{recipe.description}</p>
    <form onSubmit={submit(async form => {
      if (saving.current) return;
      saving.current = true; setBusy(true);
      try {
        await run(async () => {
          const target = dateSchema.parse(value(form, 'date'));
          await saveRecipeMeal(recipe, { date: target, timeZone: data.profile.timeZone, mealType: value(form, 'mealType') as Meal['mealType'], servings: recipeServingsSchema.parse(num(form, 'servings')) }, data.generation);
          onClose(); navigate(`/nutrition?date=${target}`);
        }, '食谱已计入饮食，营养为估算；请在记全当天后确认完整');
      } finally { saving.current = false; setBusy(false); }
    })}>
      <div className="form-grid"><Field label="归属日期"><input name="date" type="date" defaultValue={date} required /></Field><Field label="餐次"><select name="mealType" defaultValue={recipe.category === '主食早餐' ? '早餐' : '午餐'}>{['早餐', '午餐', '晚餐', '加餐'].map(type => <option key={type}>{type}</option>)}</select></Field></div>
      <Field label="食用份数" hint="0.1–10 份，步进 0.1；食材与营养随份数换算。"><input name="servings" type="number" min="0.1" max="10" step="0.1" value={servings} onChange={e => setServings(e.target.value)} required /></Field>
      {!parsed.success && <p className="form-note" role="alert">请输入 0.1–10 之间、最多一位小数的份数。</p>}
      <div className="metrics four recipe-totals" aria-live="polite"><Metric label="估算能量" value={totals ? displayNumber(totals.energy, 1) : '—'} unit="千卡" />{(['protein', 'carbs', 'fat'] as const).map((key, index) => <Metric key={key} label={['蛋白质', '碳水', '脂肪'][index]} value={totals ? displayNumber(totals[key], 1) : '—'} unit="克" />)}</div>
      <section className="recipe-section"><h3>食材{amount !== null && ` · ${amount} 份`}</h3><p className="form-note">按可食生重 / 干重称量，含所列油和调料；不按成品熟重换算。</p><ul className="recipe-ingredients">{(amount === null ? recipe.ingredients : scaledIngredients(recipe, amount)).map(item => <li key={item.key}><span>{recipeIngredients[item.key][0]}</span><strong>{amount === null ? '—' : `${displayNumber(item.grams, 1)} 克`}</strong></li>)}</ul></section>
      <section className="recipe-section"><h3>制作步骤 · 约 {recipe.minutes} 分钟</h3><p className="form-note">时间为一份参考，多份制作请调整锅具和加热时间。</p><ol className="recipe-steps">{recipe.steps.map(step => <li key={step}>{step}</li>)}</ol></section>
      <section className="recipe-section recipe-source"><h3>来源与调整</h3><p>{recipe.adaptation}</p><p>营养由本地通用食材数值估算，品牌、烹调损耗和实际吃下的酱汁会影响结果。入账后可编辑食材克重。</p><a className="text-button" href={recipeSourceUrl(recipe)} target="_blank" rel="noopener noreferrer">查看 HowToCook 原食谱（Unlicense）<ExternalLink size={14} /></a></section>
      <Actions><Button type="submit" disabled={busy || amount === null}>{busy ? '正在保存…' : '确认计入饮食'}</Button></Actions>
    </form>
  </Modal>;
}

export function RecipesPage() {
  const { data } = useApp(); const [params] = useSearchParams();
  const parsed = dateSchema.safeParse(params.get('date'));
  const date = parsed.success ? parsed.data : today(data.profile.timeZone);
  const [search, setSearch] = useState(''); const [category, setCategory] = useState('全部');
  const [protein, setProtein] = useState(false); const [quick, setQuick] = useState(false); const [vegetarian, setVegetarian] = useState(false);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const query = search.trim().toLowerCase();
  const matches = recipes.filter(recipe => (category === '全部' || recipe.category === category)
    && (!protein || recipeNutrition(recipe).protein >= 20) && (!quick || recipe.minutes <= 15) && (!vegetarian || recipe.vegetarian)
    && [recipe.name, recipe.description, ...recipe.ingredients.map(item => recipeIngredients[item.key][0])].join(' ').toLowerCase().includes(query));
  function reset() { setSearch(''); setCategory('全部'); setProtein(false); setQuick(false); setVegetarian(false); }
  return <><PageTitle title="健身食谱" description="从开源中文菜谱精选改编，按份量备餐并记录饮食。" action={<Link className="button secondary" to={`/nutrition?date=${date}`}><ArrowLeft size={16} />饮食记录</Link>} />
    <div className="toolbar"><label className="search"><Search size={18} /><input aria-label="搜索食谱或食材" placeholder="搜索食谱或食材…" value={search} onChange={e => setSearch(e.target.value)} /></label><Field label="食谱分类"><select value={category} onChange={e => setCategory(e.target.value)}>{['全部', '主食早餐', '蛋白配菜', '蔬菜'].map(item => <option key={item}>{item}</option>)}</select></Field></div>
    <div className="filter-chips recipe-filters" role="group" aria-label="食谱筛选"><button aria-pressed={protein} className={protein ? 'active' : ''} onClick={() => setProtein(!protein)}>蛋白 ≥20克/份</button><button aria-pressed={quick} className={quick ? 'active' : ''} onClick={() => setQuick(!quick)}>15分钟内</button><button aria-pressed={vegetarian} className={vegetarian ? 'active' : ''} onClick={() => setVegetarian(!vegetarian)}>蛋奶素可选</button><button onClick={reset}>重置筛选</button></div>
    <p className="form-note">共 {matches.length} 道 · 营养为每份估算，配菜可搭配主食，按自己的全天目标调整。</p>
    {matches.length ? <div className="library-grid recipe-grid">{matches.map(recipe => {
      const nutrition = recipeNutrition(recipe);
      return <article className="library-card recipe-card" key={recipe.id}><div className="library-top"><span className="square-icon"><ChefHat size={22} /></span><span className="badge">{recipe.category}</span></div><h2>{recipe.name}</h2><p>{recipe.description}</p><div className="recipe-meta"><span><Clock size={14} />约 {recipe.minutes} 分钟</span><span>{recipe.vegetarian ? '蛋奶素可选' : '含鱼虾或肉类'}</span></div><p><strong>{displayNumber(nutrition.energy)}</strong> 千卡 / 份（估算）</p><div className="tags"><span>蛋白 {displayNumber(nutrition.protein, 1)}g</span><span>碳水 {displayNumber(nutrition.carbs, 1)}g</span><span>脂肪 {displayNumber(nutrition.fat, 1)}g</span></div><div className="card-bottom"><button className="button secondary" onClick={() => setSelected(recipe)} aria-label={`查看${recipe.name}`}>查看食谱</button></div></article>;
    })}</div> : <div className="panel"><Empty title="没有匹配的食谱" action={<Button onClick={reset}>清除筛选</Button>}>尝试更换食材关键词或放宽筛选条件。</Empty></div>}
    <p className="recipe-attribution">食谱改编自 <a href="https://github.com/Anduin2017/HowToCook" target="_blank" rel="noopener noreferrer">HowToCook</a>（Unlicense）。<a href={`${import.meta.env.BASE_URL}recipes/ATTRIBUTION.md`} target="_blank" rel="noopener noreferrer">来源与授权说明</a></p>
    {selected && <RecipeDetails recipe={selected} date={date} onClose={() => setSelected(null)} />}
  </>;
}
