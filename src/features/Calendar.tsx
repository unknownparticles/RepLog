import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { addDays, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Coffee, Dumbbell, Flame, Plus, Scale, Sprout, Utensils } from 'lucide-react';
import { Actions, Button, Empty, Field, Metric, Modal, PageTitle, num, submit, useApp, value } from '../components/ui';
import { aggregate, daySummary, displayNumber } from '../domain/analytics';
import { dateKey, days, periodTitle, range, shiftPeriod, today, type Period } from '../domain/dates';
import { dateSchema, meta, weightSchema } from '../domain/model';
import { journalFor, saveJournal, saveWeight } from '../db/commands';
import { MealDialog, MealList } from './Nutrition';

export function WeightDialog({ date, onClose }: { date: string; onClose: () => void }) {
  const { data, run } = useApp(); const existing = data.weights.find(w => w.localDate === date); const [busy, setBusy] = useState(false);
  return <Modal title="记录体重" onClose={onClose}><form onSubmit={submit(async form => {
    setBusy(true);
    await run(async () => {
      if (existing && !window.confirm(`当日已有 ${existing.weightGrams / 1000} 千克，确定替换？`)) return;
      await saveWeight(weightSchema.parse({ ...(existing || meta()), localDate: date, timeZone: data.profile.timeZone, weightGrams: Math.round(num(form, 'weight')! * 1000), note: value(form, 'note') }), data.generation); onClose();
    }, '体重已保存'); setBusy(false);
  })}><p className="form-note">{date} · 每天保留一个体重值，方便观察长期趋势。</p><Field label="体重（千克）"><input autoFocus name="weight" type="number" step="0.001" min="0.001" defaultValue={existing ? existing.weightGrams / 1000 : ''} required placeholder="例如：65.5" /></Field><Field label="备注"><input name="note" defaultValue={existing?.note} placeholder="例如：晨起空腹" /></Field><Actions><Button disabled={busy} type="submit">保存体重</Button></Actions></form></Modal>;
}

export function JournalPanel({ date, compact = false }: { date: string; compact?: boolean }) {
  const { data, run } = useApp(); const day = daySummary(data, date); const [mealOpen, setMealOpen] = useState(false); const [weightOpen, setWeightOpen] = useState(false);
  const goal = day.goal?.energy; const progress = goal ? Math.min(100, day.nutrition.energy.value / goal * 100) : 0;
  const workouts = day.workouts.filter(w => w.status === 'completed');
  return <section className={`panel journal-panel ${compact ? 'compact' : ''}`}><div className="panel-heading"><div><span className="eyebrow">DAILY JOURNAL</span><h2>{format(parseISO(date), 'M 月 d 日')} <small>{['周日', '周一', '周二', '周三', '周四', '周五', '周六'][parseISO(date).getDay()]}</small></h2></div><span className={`badge ${day.diet === 'complete' ? 'green' : ''}`}>{day.diet === 'complete' ? '饮食已记全' : day.diet === 'partial' ? '饮食部分记录' : '饮食未记录'}</span></div>
    <div className="nutrition-overview"><span className="round-icon orange"><Flame size={23} /></span><div><span className="muted">已记录摄入</span><div className="nutrition-number">{day.diet === 'empty' ? '—' : displayNumber(day.nutrition.energy.value)}<small> 千卡</small></div></div><span className="goal-text">{goal ? `目标 ${displayNumber(goal)}` : <Link to="/settings">设置目标<ArrowRight size={13} /></Link>}</span></div>
    <div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="macro-row">{(['protein', 'carbs', 'fat'] as const).map((key, i) => <div key={key}><i className={`macro-dot dot-${i}`} /><span>{['蛋白质', '碳水', '脂肪'][i]}</span><strong>{day.diet === 'empty' ? '—' : displayNumber(day.nutrition[key].value, 1)}<small>g{day.nutrition[key].known ? '' : '*'}</small></strong></div>)}</div>
    {!day.nutrition.protein.known || !day.nutrition.carbs.known || !day.nutrition.fat.known ? <p className="tiny muted">* 存在未知营养项，显示已知小计。</p> : null}
    <div className="journal-section"><div className="section-heading"><h3><Utensils size={17} />餐食</h3><button className="text-button" onClick={() => setMealOpen(true)}><Plus size={15} />添加</button></div>{compact ? day.items.length ? <div className="compact-foods">{data.meals.filter(m => m.localDate === date).map(m => <div key={m.id}><span className="meal-type">{m.mealType}</span><span>{m.items.map(i => i.food.name).join('、')}</span></div>)}</div> : <div className="journal-placeholder"><Coffee size={23} /><p>给今天的每一餐留个记录</p></div> : <MealList date={date} />}</div>
    <div className="journal-section"><div className="section-heading"><h3><Dumbbell size={17} />训练</h3><Link className="text-button" to={`/training?date=${date}`}><Plus size={15} />{day.workouts.some(w => w.status === 'draft') ? '继续' : '添加'}</Link></div>{day.workouts.length ? <div className="compact-workouts">{day.workouts.map(w => <Link key={w.id} to={`/workouts/${w.id}`}><span className="square-icon green"><Dumbbell size={18} /></span><div><strong>{w.name}</strong><small>{w.exercises.length} 个动作 · {w.status === 'completed' ? '已完成' : '进行中'}</small></div><ArrowRight size={16} /></Link>)}</div> : <div className="journal-placeholder"><Sprout size={23} /><p>{day.journal?.restDay ? '今天是休息日，好好恢复。' : '记录一次训练，或给自己一个休息日。'}</p></div>}
      {!day.workouts.length && <button className="text-button muted" onClick={() => void run(() => saveJournal({ ...journalFor(date, data.journals), restDay: !day.journal?.restDay }, data.generation), day.journal?.restDay ? '已取消休息标记' : '已标记为休息日')}><Check size={14} />{day.journal?.restDay ? '取消休息标记' : '标记为休息日'}</button>}
    </div>
    <div className="journal-section weight-row"><span><Scale size={17} />体重</span><button className="text-button" onClick={() => setWeightOpen(true)}>{day.weight ? `${displayNumber(day.weight.weightGrams / 1000, 3)} kg` : '添加记录'}<Plus size={14} /></button></div>
    {!compact && <Field label="当日随记"><textarea key={date} defaultValue={day.journal?.note} placeholder="状态、感受，或一点小进步…" onBlur={event => { if (event.target.value !== (day.journal?.note || '')) void run(() => saveJournal({ ...journalFor(date, data.journals), note: event.target.value }, data.generation), '随记已保存'); }} /></Field>}
    {compact && <Link className="journal-detail-link" to={`/day/${date}`}>查看当日完整记录<ArrowRight size={16} /></Link>}
    {mealOpen && <MealDialog date={date} onClose={() => setMealOpen(false)} />}{weightOpen && <WeightDialog date={date} onClose={() => setWeightOpen(false)} />}
  </section>;
}

export function CalendarPage() {
  const { data } = useApp(); const [params, setParams] = useSearchParams(); const now = today(data.profile.timeZone);
  const parsed = dateSchema.safeParse(params.get('date') || now); const selected = parsed.success ? parsed.data : now;
  const view: Period = params.get('view') === 'week' ? 'week' : 'month';
  const [start, end] = range(view, selected); const stats = aggregate(data, start, end, now);
  const first = view === 'week' ? parseISO(start) : startOfWeek(startOfMonth(parseISO(selected)), { weekStartsOn: 1 });
  const dates = Array.from({ length: view === 'week' ? 7 : 42 }, (_, i) => dateKey(addDays(first, i)));
  function change(date: string, nextView = view) { setParams({ date, view: nextView }); }
  const selectedDay = daySummary(data, selected);
  return <><PageTitle eyebrow="A LITTLE BETTER, EVERY DAY" title="把进步，记在日常" description="每一餐、每一次训练，都是向目标靠近的一步。" action={<Link className="button primary" to={`/training?date=${selected}`}><Plus size={18} />记录训练</Link>} />
    <div className="metrics four"><Metric label="本期训练" value={stats.count} unit="次" detail={`${stats.trainingDays} 个训练日 · ${stats.rests} 个明确休息日`} /><Metric label="完整日均摄入" value={displayNumber(stats.average)} unit="千卡" detail={`${stats.completeDays} 天已记全 · ${stats.elapsedDays} 天已过去`} tone="orange" /><Metric label="正式训练组" value={stats.sets} unit="组" detail="力量训练 · 不含热身与草稿" tone="blue" /><Metric label="最新体重" value={displayNumber(stats.latestWeight ? stats.latestWeight.weightGrams / 1000 : null, 1)} unit="kg" detail={stats.latestWeight?.localDate || '记录一次，开始观察变化'} tone="purple" /></div>
    <div className="calendar-layout"><section className="panel calendar-panel"><div className="calendar-heading"><div className="calendar-navigation"><h2>{periodTitle(view, selected)}</h2><button className="icon-button" aria-label="上一周期" onClick={() => change(shiftPeriod(view, selected, -1))}><ChevronLeft size={18} /></button><button className="icon-button" aria-label="下一周期" onClick={() => change(shiftPeriod(view, selected, 1))}><ChevronRight size={18} /></button></div><div className="calendar-controls"><button className="button small secondary" onClick={() => change(now)}>今天</button><div className="segmented"><button className={view === 'month' ? 'active' : ''} onClick={() => change(selected, 'month')}>月</button><button className={view === 'week' ? 'active' : ''} onClick={() => change(selected, 'week')}>周</button></div></div></div>
      <div className="weekday-row">{['一', '二', '三', '四', '五', '六', '日'].map(d => <span key={d}>周{d}</span>)}</div><div className={`calendar-grid ${view === 'week' ? 'week-view' : ''}`}>{dates.map(date => {
        const day = daySummary(data, date); const outside = view === 'month' && date.slice(0, 7) !== selected.slice(0, 7);
        const status = day.count ? `${day.count}次完成训练` : day.journal?.restDay ? '休息' : day.workouts.length ? '训练进行中' : '训练未记录';
        return <button key={date} className={`calendar-day ${date === selected ? 'selected' : ''} ${date === now ? 'today' : ''} ${outside ? 'outside' : ''}`} aria-label={`${date}，${status}，饮食${day.diet === 'complete' ? '完整' : day.diet === 'partial' ? '部分记录' : '未记录'}${day.diet !== 'empty' ? `，${displayNumber(day.nutrition.energy.value)}千卡` : ''}`} aria-pressed={date === selected} onClick={() => change(date)}><span className="day-number">{Number(date.slice(8))}{date === now && <i />}</span><div className="day-content">{day.count > 0 && <span className="day-workout"><Dumbbell size={12} /><span>{[...new Set(day.workouts.filter(w => w.status === 'completed').flatMap(w => w.exercises.flatMap(e => e.exercise.primaryMuscles)))].slice(0, 2).join(' / ') || '训练'}{day.count > 1 && ` · ${day.count}`}</span></span>}{day.workouts.some(w => w.status === 'draft') && <span className="day-draft">进行中</span>}{day.journal?.restDay && <span className="day-rest"><Sprout size={12} /><span>休息</span></span>}{day.diet !== 'empty' && <span className="day-food"><i className={day.diet === 'complete' ? 'filled' : ''} /><span>{displayNumber(day.nutrition.energy.value)}<small> kcal</small></span></span>}</div></button>;
      })}</div><div className="calendar-legend"><span><i className="legend-green" />完成训练</span><span><i className="legend-orange" />饮食已记全</span><span><i className="legend-outline" />饮食部分记录</span><span className="legend-note">空白表示未记录</span></div>
      <div className="calendar-bottom"><div><LeafMark /><span>记录不必完美，坚持就有意义。</span></div><Link to="/analytics">看看长期变化<ArrowRight size={15} /></Link></div></section><JournalPanel date={selected} compact /></div>
    <div className="gentle-note"><span className="square-icon green"><Sprout size={22} /></span><div><strong>给今天留一点空间</strong><p>{selectedDay.count ? '训练已完成，也别忘了补充营养和休息。' : '训练日认真投入，休息日安心恢复，每一种节奏都值得被记录。'}</p></div></div>
  </>;
}
function LeafMark() { return <Sprout size={17} />; }
export function DayPage() {
  const { date } = useParams();
  if (!dateSchema.safeParse(date).success) return <Empty title="这个日期无效" action={<Link className="button primary" to="/calendar">回到今天</Link>}>请使用有效的年-月-日日期。</Empty>;
  return <><PageTitle eyebrow="ONE DAY AT A TIME" title="当日记录" description={date!} action={<Link className="button secondary" to={`/calendar?date=${date}`}><ChevronLeft size={17} />回到日历</Link>} /><div className="day-detail"><JournalPanel date={date!} /></div></>;
}
