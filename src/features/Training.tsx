import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUp, Check, ChevronLeft, Clock, Copy, Dumbbell, Play, Plus, Search, Star, Trash2 } from 'lucide-react';
import { Actions, Button, Empty, Field, Modal, PageTitle, submit, useApp, value } from '../components/ui';
import { blankSet, dateSchema, equipmentList, exerciseSchema, meta, modeLabels, muscles, validSet, type Exercise, type Workout, type WorkoutSet } from '../domain/model';
import { today } from '../domain/dates';
import { displayNumber, workoutMetrics } from '../domain/analytics';
import { journalFor, removeRecord, saveExercise, saveJournal, saveTemplate, saveWorkout } from '../db/commands';

function newWorkout(date: string, timeZone: string): Workout { return { ...meta(), localDate: date, timeZone, name: '今日训练', status: 'draft', startedAt: new Date().toISOString(), endedAt: null, durationSeconds: 0, note: '', exercises: [] }; }

function ExerciseForm({ source, onClose }: { source?: Exercise; onClose: () => void }) {
  const { data, run } = useApp(); const [selected, setSelected] = useState<string[]>(source?.primaryMuscles || []); const [equipment, setEquipment] = useState<string[]>(source?.equipment || []);
  return <Modal title={source?.builtin ? '复制为个人动作' : source ? '编辑个人动作' : '新建个人动作'} onClose={onClose}><form onSubmit={submit(async form => {
    await run(async () => {
      const item = exerciseSchema.parse({ ...(source && !source.builtin ? source : { ...meta(), favorite: false, archived: false, builtin: false, aliases: [], secondaryMuscles: [], optionalEquipment: [] }),
        name: value(form, 'name'), primaryMuscles: selected, secondaryMuscles: (source?.secondaryMuscles || []).filter(m => !selected.includes(m)), equipment, mode: value(form, 'mode'), instructions: value(form, 'instructions'),
      }); await saveExercise(item, data.generation); onClose();
    }, '动作已保存');
  })}><Field label="动作名称"><input name="name" autoFocus defaultValue={source ? source.name + (source.builtin ? '（个人）' : '') : ''} required /></Field><Field label="记录模式"><select name="mode" defaultValue={source?.mode || 'weighted'}>{Object.entries(modeLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></Field><div className="field"><span>主要肌群（至少一项）</span><div className="checkbox-tags">{muscles.map(m => <label key={m}><input type="checkbox" checked={selected.includes(m)} onChange={e => setSelected(e.target.checked ? [...selected, m] : selected.filter(i => i !== m))} />{m}</label>)}</div></div><div className="field"><span>必需器械（不选表示徒手）</span><div className="checkbox-tags">{equipmentList.map(item => <label key={item}><input type="checkbox" checked={equipment.includes(item)} onChange={e => setEquipment(e.target.checked ? [...equipment, item] : equipment.filter(i => i !== item))} />{item}</label>)}</div></div><Field label="动作要点"><textarea name="instructions" defaultValue={source?.instructions} placeholder="记录适合自己的动作提示…" /></Field><Actions><Button type="submit">保存动作</Button></Actions></form></Modal>;
}

export function ExerciseCatalog({ choose }: { choose?: (exercise: Exercise) => void }) {
  const { data, run } = useApp(); const [search, setSearch] = useState(''); const [selected, setSelected] = useState<string[]>([]); const [equipment, setEquipment] = useState<string[]>([]); const [bodyweight, setBodyweight] = useState(false); const [favorites, setFavorites] = useState(false); const [archived, setArchived] = useState(false); const [mode, setMode] = useState(''); const [details, setDetails] = useState<Exercise | null>(null); const [editing, setEditing] = useState<Exercise | 'new' | null>(null);
  const entries = data.exercises.filter(e => e.archived === archived && (!favorites || e.favorite) && (!selected.length || selected.some(m => e.primaryMuscles.includes(m))) && (!bodyweight || !e.equipment.length) && (!equipment.length || e.equipment.every(item => equipment.includes(item))) && (!mode || (mode === 'cardio' ? e.mode === 'cardio' : e.mode !== 'cardio')) && [e.name, ...e.aliases].some(name => name.toLowerCase().includes(search.toLowerCase())));
  return <><div className="toolbar"><label className="search"><Search size={17} /><input aria-label="搜索动作" placeholder="搜索动作或别名…" value={search} onChange={e => setSearch(e.target.value)} /></label><button className={`button ${favorites ? 'complete' : 'secondary'}`} onClick={() => setFavorites(!favorites)}><Star size={16} />收藏</button><button className="button secondary" onClick={() => setEditing('new')}><Plus size={17} />自建动作</button></div><div className="filter-chips">{muscles.map(m => <button className={selected.includes(m) ? 'active' : ''} key={m} onClick={() => setSelected(selected.includes(m) ? selected.filter(i => i !== m) : [...selected, m])}>{m}</button>)}<select aria-label="动作类型" value={mode} onChange={e => setMode(e.target.value)}><option value="">所有类型</option><option value="strength">力量</option><option value="cardio">有氧</option></select></div><details className="equipment-filter"><summary>按可用器械筛选 {equipment.length ? `· 已选 ${equipment.length} 项` : '· 不筛选'}</summary><p className="tiny muted">动作所需器械须全部可用；同一主要肌群筛选为“任一符合”。</p><div className="checkbox-tags"><label><input type="checkbox" checked={bodyweight} onChange={e => setBodyweight(e.target.checked)} />仅徒手</label>{equipmentList.map(item => <label key={item}><input type="checkbox" checked={equipment.includes(item)} onChange={e => setEquipment(e.target.checked ? [...equipment, item] : equipment.filter(i => i !== item))} />{item}</label>)}</div></details>
    <div className="catalog-count"><span>{entries.length} 个动作</span><button className="text-button muted" onClick={() => setArchived(!archived)}>{archived ? '返回可用动作' : '查看已归档'}</button></div>
    {entries.length ? <div className="library-grid exercise-grid">{entries.map(exercise => <article className="library-card" key={exercise.id}><div className="library-top"><span className={`square-icon ${exercise.mode === 'cardio' ? 'blue' : 'green'}`}><Dumbbell size={22} /></span><button className={`icon-button ${exercise.favorite ? 'starred' : ''}`} aria-label={`${exercise.favorite ? '取消收藏' : '收藏'}${exercise.name}`} onClick={() => void run(() => saveExercise({ ...exercise, favorite: !exercise.favorite }, data.generation))}><Star size={18} fill={exercise.favorite ? 'currentColor' : 'none'} /></button></div><button className="card-title-button" onClick={() => setDetails(exercise)}>{exercise.name}</button><p>{modeLabels[exercise.mode]}</p><div className="tags">{exercise.primaryMuscles.map(m => <span className="muscle-tag" key={m}>{m}</span>)}<span>{exercise.equipment.join(' + ') || '徒手'}</span></div><div className="card-bottom"><button className="text-button muted" onClick={() => setDetails(exercise)}>动作详情<ArrowRight size={14} /></button>{choose && !archived && <button className="text-button" onClick={() => choose(exercise)}><Plus size={15} />加入</button>}</div></article>)}</div> : <Empty title="没有找到符合的动作" action={<button className="button secondary" onClick={() => { setSearch(''); setSelected([]); setEquipment([]); setBodyweight(false); setFavorites(false); setMode(''); }}>清除筛选</button>}>试试调整筛选，或创建自己的动作。</Empty>}
    {details && <Modal title={details.name} onClose={() => setDetails(null)}><div className="detail-list"><p><span>主要肌群</span><strong>{details.primaryMuscles.join('、')}</strong></p><p><span>辅助肌群</span><strong>{details.secondaryMuscles.join('、') || '无'}</strong></p><p><span>必需器械</span><strong>{details.equipment.join(' + ') || '徒手'}</strong></p><p><span>记录方式</span><strong>{modeLabels[details.mode]}</strong></p></div><p className="form-note">{details.instructions}</p><Actions><button className="button secondary" onClick={() => { setEditing(details); setDetails(null); }}><Copy size={16} />{details.builtin ? '复制为个人动作' : '编辑动作'}</button>{!details.builtin && <button className="button secondary" onClick={() => void run(async () => { await saveExercise({ ...details, archived: !details.archived }, data.generation); setDetails(null); }, details.archived ? '动作已恢复' : '动作已归档')}>{details.archived ? '恢复动作' : '归档动作'}</button>}</Actions></Modal>}
    {editing && <ExerciseForm source={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
  </>;
}
export function ExercisesPage() { return <><PageTitle eyebrow="FIND YOUR MOVEMENT" title="动作库" description="找到适合的动作，练出自己的节奏。" /><ExerciseCatalog /></>; }

export function TrainingPage() {
  const { data, run } = useApp(); const [params] = useSearchParams(); const navigate = useNavigate(); const [date, setDate] = useState(params.get('date') || today(data.profile.timeZone));
  const draft = data.workouts.find(w => w.status === 'draft'); const history = [...data.workouts].filter(w => w.status === 'completed').sort((a, b) => b.localDate.localeCompare(a.localDate));
  async function start(templateId?: string) {
    await run(async () => {
      dateSchema.parse(date);
      if (draft) { navigate(`/workouts/${draft.id}`); return; }
      const journal = journalFor(date, data.journals);
      if (journal.restDay) { if (!window.confirm('这一天已标记为休息日，取消休息并开始训练？')) return; await saveJournal({ ...journal, restDay: false }, data.generation); }
      const workout = newWorkout(date, data.profile.timeZone);
      if (templateId) {
        const template = data.templates.find(t => t.id === templateId)!;
        if (template.exercises.some(e => data.exercises.find(ex => ex.id === e.exercise.id)?.archived)) throw new Error('模板中有已归档动作。请先在动作库恢复，或使用新训练替换。');
        workout.name = template.name; workout.exercises = template.exercises.map(entry => ({ ...entry, id: crypto.randomUUID(), sets: entry.sets.map(set => ({ ...set, id: crypto.randomUUID(), completed: false })) }));
      }
      await saveWorkout(workout, data.generation); navigate(`/workouts/${workout.id}`);
    });
  }
  return <><PageTitle eyebrow="SHOW UP FOR YOURSELF" title="每一次，都算数" description="不追求一次练得完美，先让每一次努力被看见。" action={<Link className="button secondary" to="/exercises">浏览动作库<ArrowRight size={16} /></Link>} />
    <div className="training-hero"><div><span className="eyebrow">{draft ? 'KEEP YOUR MOMENTUM' : 'READY WHEN YOU ARE'}</span><h2>{draft ? '接着练，不用从头来。' : '今天，也为自己动一下。'}</h2><p>{draft ? `${draft.localDate} · ${draft.name} · 已自动保存草稿` : '从空白训练开始，或使用熟悉的模板。'}</p><div className="hero-actions"><input type="date" aria-label="训练日期" value={date} onChange={e => setDate(e.target.value)} /><Button onClick={() => void start()}><Play size={17} />{draft ? '继续训练' : '开始训练'}</Button></div></div><Dumbbell className="hero-dumbbell" size={130} strokeWidth={1} /></div>
    {data.templates.length > 0 && <section className="panel"><div className="panel-heading"><h2>我的训练模板</h2><span className="muted">熟悉的动作，新的进步</span></div><div className="template-list">{data.templates.map(template => <div key={template.id} className="record-row"><div className="record-body"><strong>{template.name}</strong><small>{template.exercises.length} 个动作</small></div><button className="button secondary small" onClick={() => void start(template.id)}>使用模板</button><button className="icon-button danger" aria-label={`删除模板${template.name}`} onClick={() => { if (window.confirm('确定删除这个模板？历史训练不受影响。')) void run(() => removeRecord('templates', template, data.generation)); }}><Trash2 size={16} /></button></div>)}</div></section>}
    <section className="panel"><div className="panel-heading"><h2>训练足迹 <small>{history.length} 次</small></h2><Clock size={18} className="muted" /></div>{history.length ? history.map(workout => <Link className="workout-history-row" key={workout.id} to={`/workouts/${workout.id}`}><span className="square-icon green"><Dumbbell size={22} /></span><div><h3>{workout.name}</h3><small>{workout.localDate} · {workout.exercises.length} 个动作 · {workoutMetrics([workout]).sets} 组正式力量</small></div><span className="badge green">已完成</span><ArrowRight size={18} /></Link>) : <Empty title="下一次训练，从这里开始" action={<button className="text-button" onClick={() => void start()}>开始第一份训练记录<ArrowRight size={15} /></button>}>记录动作、重量和次数，慢慢看见自己的变化。</Empty>}</section>
  </>;
}

export function WorkoutPage() {
  const { id } = useParams(); const { data } = useApp(); const workout = data.workouts.find(w => w.id === id);
  return workout ? <WorkoutEditor key={id} initial={workout} /> : <Empty title="找不到这次训练" action={<Link to="/training" className="button primary">回到训练</Link>}>记录可能已被删除或替换。</Empty>;
}

function WorkoutEditor({ initial }: { initial: Workout }) {
  const { data, run, notify } = useApp(); const navigate = useNavigate(); const [workout, setWorkout] = useState(() => structuredClone(initial));
  const [picker, setPicker] = useState(false); const [dirty, setDirty] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const edits = useRef(0); const inFlight = useRef(false); const [generation] = useState(data.generation);
  const allowLeave = useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !allowLeave.current && (dirty || saving) && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('当前有未保存输入，离开会丢失这些输入。确定离开？')) blocker.proceed(); else blocker.reset();
    }
  }, [blocker]);
  function change(next: Workout) { edits.current++; setWorkout(next); setDirty(true); }
  useEffect(() => {
    if (!dirty || error || inFlight.current) return;
    const timer = setTimeout(async () => {
      const sequence = edits.current; inFlight.current = true; setSaving(true);
      try {
        const saved = await saveWorkout(workout, generation);
        setWorkout(current => ({ ...current, revision: saved.revision, updatedAt: saved.updatedAt }));
        if (edits.current === sequence) setDirty(false);
      } catch (err) { setError(err instanceof Error ? err.message : '保存失败，输入仍保留'); }
      finally { inFlight.current = false; setSaving(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [workout, dirty, error, generation]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty || saving) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);
  function updateSet(entryId: string, setId: string, fields: Partial<WorkoutSet>) {
    change({ ...workout, exercises: workout.exercises.map(e => e.id === entryId ? { ...e, sets: e.sets.map(s => s.id === setId ? { ...s, ...fields } : s) } : e) });
  }
  function addExercise(exercise: Exercise) {
    const history = [...data.workouts].filter(w => w.status === 'completed').sort((a, b) => b.localDate.localeCompare(a.localDate)).flatMap(w => w.exercises).find(e => e.exercise.id === exercise.id);
    change({ ...workout, exercises: [...workout.exercises, { id: crypto.randomUUID(), exercise: structuredClone(exercise), sets: history?.sets.length ? history.sets.map(set => ({ ...set, id: crypto.randomUUID(), completed: false })) : [blankSet()] }] }); setPicker(false);
  }
  async function finish() {
    if (saving || inFlight.current) { notify('正在保存上一笔输入，请稍后再试。', true); return; }
    await run(async () => {
      const endedAt = new Date().toISOString();
      const next = { ...workout, status: 'completed' as const, endedAt, durationSeconds: workout.durationSeconds || Math.max(0, Math.round((Date.now() - new Date(workout.startedAt).getTime()) / 1000)) };
      const saved = await saveWorkout(next, generation); allowLeave.current = true; setDirty(false); setWorkout(saved); navigate('/training');
    }, '训练完成，给今天的坚持一个肯定！');
  }
  const metric = workoutMetrics([{ ...workout, status: 'completed' }]);
  return <><PageTitle eyebrow={workout.status === 'draft' ? 'YOUR WORKOUT IN PROGRESS' : 'YOUR TRAINING JOURNAL'} title={workout.status === 'draft' ? '专注当下这一组' : '这一次的训练记录'} description="用自己的节奏，一组一组往前走。" action={<Link className="button secondary" to="/training"><ChevronLeft size={16} />训练列表</Link>} />
    <section className="panel"><div className="workout-meta"><Field label="训练名称"><input value={workout.name} onChange={e => change({ ...workout, name: e.target.value })} /></Field><Field label="归属日期"><input type="date" value={workout.localDate} onChange={e => { if (dateSchema.safeParse(e.target.value).success) change({ ...workout, localDate: e.target.value }); }} /></Field><Field label="会话时长（分钟）"><input type="number" min="0" step="1" value={workout.durationSeconds ? workout.durationSeconds / 60 : ''} placeholder="结束时自动预填" onChange={e => change({ ...workout, durationSeconds: Math.round(Number(e.target.value) * 60) })} /></Field></div><div className="workout-status"><span className={error ? 'text-danger' : 'text-green'} role="status">{error ? '尚未保存：' + error : saving ? '正在保存…' : dirty ? '等待保存…' : '✓ 已保存在本地'}</span>{error && <><button className="text-button" onClick={() => setError('')}>重试</button><button className="text-button" onClick={() => { if (window.confirm('重新载入将放弃当前页面未保存输入。继续？')) location.reload(); }}>重新载入</button></>}<span className="muted">{metric.sets} 正式力量组 · {displayNumber(metric.volume)} kg 负重训练量</span></div></section>
    {workout.exercises.map((entry, index) => {
      const timed = entry.exercise.mode === 'timed' || entry.exercise.mode === 'cardio';
      const past = [...data.workouts].filter(w => w.status === 'completed' && w.id !== workout.id).sort((a, b) => b.localDate.localeCompare(a.localDate)).find(w => w.exercises.some(e => e.exercise.id === entry.exercise.id));
      return <section className="panel exercise-session" key={entry.id}><div className="panel-heading"><div className="exercise-session-title"><span className="exercise-order">{String(index + 1).padStart(2, '0')}</span><div><h2>{entry.exercise.name}</h2><span className="muted tiny">{entry.exercise.primaryMuscles.join(' · ')} · {modeLabels[entry.exercise.mode]}{past ? ` · 上次 ${past.localDate}` : ' · 首次记录'}</span></div></div><div className="row-actions"><button className="icon-button" aria-label={`上移动作${entry.exercise.name}`} disabled={index === 0} onClick={() => { const next = [...workout.exercises]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; change({ ...workout, exercises: next }); }}><ArrowUp size={16} /></button><button className="icon-button" aria-label={`下移动作${entry.exercise.name}`} disabled={index === workout.exercises.length - 1} onClick={() => { const next = [...workout.exercises]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; change({ ...workout, exercises: next }); }}><ArrowDown size={16} /></button><button className="icon-button danger" aria-label={`移除动作${entry.exercise.name}`} onClick={() => { if (window.confirm('确定移除这个动作和当前组次？')) change({ ...workout, exercises: workout.exercises.filter(e => e.id !== entry.id) }); }}><Trash2 size={16} /></button></div></div>
        {entry.exercise.mode === 'weighted' && <p className="input-hint">重量输入器械总外部负重。双持哑铃请合计两只，不含体重。</p>}
        <div className="set-table-wrap"><table className="set-table"><thead><tr><th>组</th><th>类型</th>{timed ? <><th>时长（分）</th>{entry.exercise.mode === 'cardio' && <th>距离（km）</th>}</> : <>{entry.exercise.mode !== 'bodyweight' && <th>{entry.exercise.mode === 'assisted' ? '辅助重量' : '总重量'}（kg）</th>}<th>次数</th></>}<th>用力程度</th><th>完成</th><th /></tr></thead><tbody>{entry.sets.map((set, setIndex) => {
          const numeric = (key: keyof WorkoutSet, factor = 1) => ({ value: set[key] === null ? '' : Number(set[key]) / factor, onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateSet(entry.id, set.id, { [key]: e.target.value === '' ? null : Number(e.target.value) * factor }) });
          return <tr key={set.id} className={set.completed ? 'finished-set' : ''}><td>{setIndex + 1}</td><td><select aria-label={`第${setIndex + 1}组类型`} value={set.kind} onChange={e => updateSet(entry.id, set.id, { kind: e.target.value as 'work' | 'warmup' })}><option value="work">正式</option><option value="warmup">热身</option></select></td>{timed ? <><td><input aria-label={`第${setIndex + 1}组时长`} type="number" min="0.0166667" step="any" {...numeric('durationSeconds', 60)} /></td>{entry.exercise.mode === 'cardio' && <td><input aria-label={`第${setIndex + 1}组距离`} type="number" min="0" step="0.001" {...numeric('distanceMeters', 1000)} /></td>}</> : <>{entry.exercise.mode !== 'bodyweight' && <td><input aria-label={`第${setIndex + 1}组重量`} type="number" min="0" step="0.001" {...numeric(entry.exercise.mode === 'assisted' ? 'assistanceGrams' : 'loadGrams', 1000)} /></td>}<td><input aria-label={`第${setIndex + 1}组次数`} type="number" min="1" step="1" {...numeric('reps')} /></td></>}<td><input aria-label={`第${setIndex + 1}组用力程度`} type="number" min="1" max="10" step="0.5" placeholder="可选" {...numeric('rpe')} /></td><td><button className={`set-check ${set.completed ? 'checked' : ''}`} aria-label={`第${setIndex + 1}组${set.completed ? '取消完成' : '标记完成'}`} aria-pressed={set.completed} onClick={() => { if (!set.completed && !validSet(set, entry.exercise.mode)) { notify('请先填写有效的重量、次数或时长，再完成这一组。', true); return; } updateSet(entry.id, set.id, { completed: !set.completed }); }}><Check size={18} /></button></td><td><button className="icon-button danger" aria-label={`删除第${setIndex + 1}组`} onClick={() => change({ ...workout, exercises: workout.exercises.map(e => e.id === entry.id ? { ...e, sets: e.sets.filter(s => s.id !== set.id) } : e) })}><Trash2 size={14} /></button></td></tr>;
        })}</tbody></table></div><button className="add-set" onClick={() => { const previous = entry.sets.at(-1); const set = previous ? { ...previous, id: crypto.randomUUID(), completed: false } : blankSet(); change({ ...workout, exercises: workout.exercises.map(e => e.id === entry.id ? { ...e, sets: [...e.sets, set] } : e) }); }}><Plus size={16} />添加一组</button>
      </section>;
    })}
    {!workout.exercises.length && <div className="panel"><Empty title="先选一个今天想练的动作" action={<Button onClick={() => setPicker(true)}><Plus size={17} />选择动作</Button>}>按部位或器械找到动作，开始记录第一组。</Empty></div>}
    <div className="workout-actions"><button className="button secondary" onClick={() => setPicker(true)}><Plus size={17} />添加动作</button><button className="button secondary" disabled={dirty || saving || !workout.exercises.length} onClick={() => { const name = window.prompt('给这个模板起个名字', workout.name); if (name) void run(() => saveTemplate({ ...meta(), name, exercises: workout.exercises.map(e => ({ ...e, sets: e.sets.map(s => ({ ...s, completed: false })) })) }, generation), '训练模板已保存'); }}><Copy size={16} />存为模板</button><button className="button danger-outline" disabled={saving} onClick={() => { if (window.confirm(workout.status === 'draft' ? '确定放弃这份训练草稿？' : '确定删除这次已完成训练？')) void run(async () => { await removeRecord('workouts', workout, generation); allowLeave.current = true; setDirty(false); navigate('/training'); }, '训练已删除'); }}><Trash2 size={16} />{workout.status === 'draft' ? '放弃' : '删除'}</button>{workout.status === 'draft' && <Button disabled={saving || !!error} onClick={() => void finish()}><Check size={17} />完成训练</Button>}</div>
    {picker && <Modal title="选择训练动作" onClose={() => setPicker(false)} wide><ExerciseCatalog choose={addExercise} /></Modal>}
  </>;
}
