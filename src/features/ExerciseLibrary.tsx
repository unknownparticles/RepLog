import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Copy, Dumbbell, Plus, Search, SlidersHorizontal, Star, X, Check, Play } from 'lucide-react';
import { Actions, Button, Empty, Field, Modal, MultiToggle, PageTitle, Segmented, submit, useApp, value } from '../components/ui';
import { equipmentCatalog, equipmentGroups, filterExercises, type ExerciseFilter } from '../domain/catalog';
import { equipmentList, exerciseSchema, meta, modeLabels, muscles, type Exercise } from '../domain/model';
import { saveExercise } from '../db/commands';
import { ExerciseDemo } from '../components/ExerciseDemo';
import { exerciseMedia, mediaFor } from '../domain/exercise-media';
import { ExerciseIllustration } from '../components/ExerciseIllustration';

function LibraryNav({ current }: { current: 'exercises' | 'equipment' }) {
  return <nav className="library-nav" aria-label="训练资料"><Link to="/exercises" aria-current={current === 'exercises' ? 'page' : undefined}>动作</Link><Link to="/equipment" aria-current={current === 'equipment' ? 'page' : undefined}>器械</Link></nav>;
}

function EquipmentChoices({ selected, onChange, exclude = [] }: { selected: string[]; onChange: (items: string[]) => void; exclude?: string[] }) {
  return <div className="equipment-choices">{equipmentGroups.map(group => <fieldset key={group}><legend>{group}</legend><div className="checkbox-tags">{equipmentCatalog.filter(item => item.group === group && !exclude.includes(item.name)).map(item => <label key={item.name}><input type="checkbox" checked={selected.includes(item.name)} onChange={event => onChange(event.target.checked ? [...selected, item.name] : selected.filter(name => name !== item.name))} />{item.name}</label>)}</div></fieldset>)}</div>;
}

function ExerciseForm({ source, onClose }: { source?: Exercise; onClose: () => void }) {
  const { data, run } = useApp();
  const [primary, setPrimary] = useState(source?.primaryMuscles || []);
  const [secondary, setSecondary] = useState(source?.secondaryMuscles || []);
  const [equipment, setEquipment] = useState(source?.equipment || []);
  const [optional, setOptional] = useState(source?.optionalEquipment || []);
  const [busy, setBusy] = useState(false);
  return <Modal title={source?.builtin ? '复制为个人动作' : source ? '编辑动作' : '新建动作'} onClose={onClose} wide><form onSubmit={submit(async form => {
    setBusy(true);
    await run(async () => {
      const item = exerciseSchema.parse({
        ...(source && !source.builtin ? source : { ...meta(), favorite: false, archived: false, builtin: false }),
        name: value(form, 'name'), aliases: value(form, 'aliases').split(/[,，;；\n]/).map(text => text.trim()).filter(Boolean),
        primaryMuscles: primary, secondaryMuscles: secondary.filter(m => !primary.includes(m)),
        equipment, optionalEquipment: optional.filter(name => !equipment.includes(name)), mode: value(form, 'mode'), instructions: value(form, 'instructions'),
      });
      await saveExercise(item, data.generation); onClose();
    }, '动作已保存');
    setBusy(false);
  })}>
    <div className="form-grid"><Field label="动作名称"><input name="name" defaultValue={source ? source.name + (source.builtin ? '（个人）' : '') : ''} required /></Field><Field label="记录方式"><select name="mode" defaultValue={source?.mode || 'weighted'}>{Object.entries(modeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field></div>
    <Field label="别名 / 英文名称" hint="多个名称用逗号分隔，搜索时会一起匹配。"><input name="aliases" defaultValue={source?.aliases.join(', ')} placeholder="例如：平板卧推, Bench Press" /></Field>
    <div className="field"><span>主要肌群</span><MultiToggle value={primary} items={muscles} label="主要肌群" onChange={next => { setPrimary(next); setSecondary(secondary.filter(m => !next.includes(m))); }} /></div>
    <div className="field"><span>辅助肌群</span><MultiToggle value={secondary} items={muscles.filter(m => !primary.includes(m))} label="辅助肌群" onChange={setSecondary} /><small>主要肌群用于分配训练组数，辅助肌群用于检索和说明。</small></div>
    <details className="form-details" open><summary>必需器械 · {equipment.length ? equipment.join('、') : '不选表示无需器械'}</summary><EquipmentChoices selected={equipment} onChange={next => { setEquipment(next); setOptional(optional.filter(name => !next.includes(name))); }} /></details>
    <details className="form-details"><summary>可选配件 · {optional.length || 0} 项</summary><EquipmentChoices selected={optional} onChange={setOptional} exclude={equipment} /></details>
    <Field label="动作说明" hint="每行一个步骤，可补充姿势要点和常见错误。"><textarea name="instructions" rows={5} defaultValue={source?.instructions} placeholder="准备姿势&#10;动作过程&#10;注意事项" /></Field>
    <Actions><button type="button" className="button secondary" onClick={onClose}>取消</button><Button type="submit" disabled={busy}>{busy ? '保存中…' : '保存动作'}</Button></Actions>
  </form></Modal>;
}

function AvailableEquipment({ initial, filter, withMedia, onApply, onClose }: { initial: string[]; filter: ExerciseFilter; withMedia: boolean; onApply: (items: string[]) => void; onClose: () => void }) {
  const { data } = useApp(); const [selected, setSelected] = useState(initial);
  const count = filterExercises(data.exercises, { ...filter, bodyweightOnly: false, equipment: selected, equipmentMatch: 'available', equipmentActive: true }).filter(exercise => !withMedia || mediaFor(exercise)).length;
  return <Modal title="按现有器械匹配" onClose={onClose} wide><p className="form-note">勾选你能使用的器械。仅显示所需器械全部可用的动作；不勾选时只显示无需器械的动作。</p><EquipmentChoices selected={selected} onChange={setSelected} /><Actions><button className="text-button" onClick={() => setSelected([])}>全部清除</button><Button onClick={() => { onApply(selected); onClose(); }}>显示 {count} 个动作</Button></Actions></Modal>;
}

export function ExerciseCatalog({ choose }: { choose?: (exercise: Exercise) => void }) {
  const { data, run } = useApp(); const [params] = useSearchParams();
  const initialEquipment = params.get('equipment');
  const [search, setSearch] = useState(''); const [selected, setSelected] = useState<string[]>([]);
  const [secondary, setSecondary] = useState(false); const [gear, setGear] = useState<string[]>(initialEquipment && equipmentList.includes(initialEquipment) ? [initialEquipment] : []);
  const [withMedia, setWithMedia] = useState(false);
  const [animatedThumbs, setAnimatedThumbs] = useState(true);
  const [available, setAvailable] = useState(false); const [gearOpen, setGearOpen] = useState(false);
  const [favorites, setFavorites] = useState(false); const [archived, setArchived] = useState(false); const [type, setType] = useState<'' | 'strength' | 'cardio'>('');
  const [details, setDetails] = useState<Exercise | null>(null); const [editing, setEditing] = useState<Exercise | 'new' | null>(null);
  const filter: ExerciseFilter = { query: search, muscles: selected, includeSecondary: secondary, equipment: gear.filter(name => name !== '无器械'), bodyweightOnly: gear.includes('无器械'), equipmentMatch: available ? 'available' : 'uses', equipmentActive: available, favorite: favorites, archived, type };
  const entries = filterExercises(data.exercises, filter).filter(exercise => !withMedia || mediaFor(exercise));
  const hasFilter = search || selected.length || gear.length || available || favorites || type || secondary || withMedia;
  function clear() { setSearch(''); setSelected([]); setGear([]); setAvailable(false); setFavorites(false); setType(''); setSecondary(false); setWithMedia(false); }
  return <div className="exercise-catalog">
    <div className="toolbar catalog-toolbar"><label className="search"><Search size={17} /><input aria-label="搜索动作" placeholder="搜索动作名称或英文名" value={search} onChange={event => setSearch(event.target.value)} /></label><button className={`button ${favorites ? 'complete' : 'secondary'}`} aria-pressed={favorites} onClick={() => setFavorites(!favorites)}><Star size={15} />收藏</button><button className={`button ${animatedThumbs ? 'complete' : 'secondary'}`} aria-label="动态缩略图" aria-pressed={animatedThumbs} onClick={() => setAnimatedThumbs(!animatedThumbs)}>{animatedThumbs ? '动态图' : '静态图'}</button><button className="button secondary" onClick={() => setEditing('new')}><Plus size={16} />新建动作</button></div>
    <div className="catalog-filters"><MultiToggle value={selected} onChange={setSelected} items={muscles} label="训练部位" /><label className="inline-checkbox"><input type="checkbox" checked={secondary} onChange={event => setSecondary(event.target.checked)} />包含辅助肌群</label><label className="inline-checkbox"><input type="checkbox" checked={withMedia} onChange={event => setWithMedia(event.target.checked)} />仅有示范</label></div>
    <div className="catalog-filter-row"><select aria-label="动作类型" value={type} onChange={event => setType(event.target.value as typeof type)}><option value="">所有类型</option><option value="strength">力量训练</option><option value="cardio">有氧运动</option></select><select aria-label="使用器械" value={available ? '' : gear[0] || ''} onChange={event => { setAvailable(false); setGear(event.target.value ? [event.target.value] : []); }}><option value="">全部器械</option><option value="无器械">无需器械</option>{equipmentGroups.map(group => <optgroup key={group} label={group}>{equipmentCatalog.filter(e => e.group === group).map(e => <option key={e.name}>{e.name}</option>)}</optgroup>)}</select><button className={`button ${available ? 'complete' : 'secondary'}`} onClick={() => setGearOpen(true)}><SlidersHorizontal size={15} />{available ? `现有器械 · ${gear.length} 项` : '按现有器械匹配'}</button>{hasFilter && <button className="text-button muted" onClick={clear}><X size={14} />重置</button>}</div>
    <div className="catalog-count"><span>{entries.length} 个{archived ? '已归档' : ''}动作{available && ' · 包含无需器械的动作'}</span><button className="text-button muted" onClick={() => setArchived(!archived)}>{archived ? '返回动作库' : '已归档'}</button></div>
    {entries.length ? <div className="exercise-list"><div className="exercise-list-heading"><span>动作</span><span>主要肌群</span><span>器械</span><span>记录方式</span><span /></div>{entries.map(exercise => <article className="exercise-row" key={exercise.id}>
      <div className="exercise-name"><button className="exercise-thumbnail" aria-label={`查看${exercise.name}动作详情`} onClick={() => setDetails(exercise)}><ExerciseIllustration exercise={exercise} animate={animatedThumbs} />{mediaFor(exercise) && <Play className="thumbnail-video-marker" size={15} />}</button><div className="exercise-label"><button className="exercise-title" onClick={() => setDetails(exercise)}>{exercise.name}</button><span>{exercise.aliases[0] || (exercise.builtin ? '' : '自定义动作')}</span></div></div>
      <div className="exercise-muscles">{exercise.primaryMuscles.map(m => <span className="badge" key={m}>{m}</span>)}</div><div className="exercise-equipment">{exercise.equipment.join('、') || '无需器械'}</div><span className="exercise-mode">{modeLabels[exercise.mode]}</span>
      <div className="exercise-row-actions"><button className={`icon-button ${exercise.favorite ? 'starred' : ''}`} aria-label={`${exercise.favorite ? '取消收藏' : '收藏'}${exercise.name}`} onClick={() => void run(() => saveExercise({ ...exercise, favorite: !exercise.favorite }, data.generation))}><Star size={16} fill={exercise.favorite ? 'currentColor' : 'none'} /></button>{choose && !archived ? <button className="button secondary small" aria-label={`加入${exercise.name}`} onClick={() => choose(exercise)}><Plus size={15} />加入</button> : <button className="icon-button" aria-label={`查看${exercise.name}`} onClick={() => setDetails(exercise)}><ArrowRight size={16} /></button>}</div>
    </article>)}</div> : <Empty title="没有符合条件的动作" action={<button className="button secondary" onClick={clear}>清除筛选</button>}>可以调整部位或器械，也可以新建动作。</Empty>}
    {details && <Modal title={details.name} onClose={() => setDetails(null)}><p className="exercise-english">{details.aliases.join(' / ')}</p><ExerciseDemo exercise={details} /><div className="detail-list"><p><span>主要肌群</span><strong>{details.primaryMuscles.join('、')}</strong></p><p><span>辅助肌群</span><strong>{details.secondaryMuscles.join('、') || '无'}</strong></p><p><span>必需器械</span><strong>{details.equipment.join('、') || '无需器械'}</strong></p>{details.optionalEquipment.length > 0 && <p><span>可选配件</span><strong>{details.optionalEquipment.join('、')}</strong></p>}<p><span>记录方式</span><strong>{modeLabels[details.mode]}</strong></p></div><h3 className="guide-heading">动作说明</h3><ol className="exercise-guide">{details.instructions.split('\n').filter(Boolean).map((step, index) => <li key={index}>{step}</li>)}</ol>{details.equipment.some(name => ['史密斯机', '绳索器械', '固定器械'].includes(name)) && <p className="form-note">器械传动比可能不同，训练重量请保持同机一致口径。</p>}<Actions>{choose && !details.archived && <Button onClick={() => { choose(details); setDetails(null); }}><Plus size={16} />加入训练</Button>}<button className="button secondary" onClick={() => { setEditing(details); setDetails(null); }}><Copy size={15} />{details.builtin ? '复制为个人动作' : '编辑动作'}</button>{!details.builtin && <button className="button secondary" onClick={() => void run(async () => { await saveExercise({ ...details, archived: !details.archived }, data.generation); setDetails(null); }, details.archived ? '动作已恢复' : '动作已归档')}>{details.archived ? '恢复' : '归档'}</button>}</Actions></Modal>}
    {editing && <ExerciseForm source={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    {gearOpen && <AvailableEquipment initial={gear.filter(name => equipmentList.includes(name))} filter={filter} withMedia={withMedia} onApply={items => { setAvailable(true); setGear(items); }} onClose={() => setGearOpen(false)} />}
  </div>;
}

export function ExercisesPage() {
  const { data } = useApp();
  return <><PageTitle title="动作库" description={`${data.exercises.filter(e => !e.archived).length} 个动作 · ${exerciseMedia.length} 个视频示范`} action={<Link className="button secondary" to="/training">训练记录<ArrowRight size={16} /></Link>} /><LibraryNav current="exercises" /><ExerciseCatalog /></>;
}

export function EquipmentPage() {
  const { data } = useApp(); const [query, setQuery] = useState(''); const [group, setGroup] = useState('all');
  const entries = equipmentCatalog.filter(item => (group === 'all' || item.group === group) && [item.name, ...item.aliases].some(text => text.toLowerCase().includes(query.trim().toLowerCase())));
  return <><PageTitle title="器械库" description={`${equipmentCatalog.length} 类器械 · 查看使用说明和对应动作`} action={<Link className="button secondary" to="/exercises">动作库<ArrowRight size={16} /></Link>} /><LibraryNav current="equipment" /><div className="toolbar"><label className="search"><Search size={17} /><input aria-label="搜索器械" value={query} placeholder="搜索器械名称或英文名" onChange={event => setQuery(event.target.value)} /></label></div><Segmented label="器械分类" value={group} onChange={setGroup} items={[{ value: 'all', label: '全部' }, ...equipmentGroups.map(value => ({ value, label: value }))]} /><div className="equipment-library">{entries.map(item => {
    const exercises = data.exercises.filter(e => !e.archived && e.equipment.includes(item.name));
    return <article className="equipment-row" key={item.name}><div className="equipment-row-heading"><h2>{item.name}</h2><span className="badge">{item.group}</span></div><span className="exercise-english">{item.aliases[0]}</span><p>{item.description}</p><Link className="text-button" to={`/exercises?equipment=${encodeURIComponent(item.name)}`}>{exercises.length ? `${exercises.length} 个相关动作` : '暂无内置动作 · 可自建'}<ArrowRight size={14} /></Link></article>;
  })}</div>{!entries.length && <Empty title="没有找到对应器械">尝试搜索中文名或英文名。</Empty>}</>;
}
