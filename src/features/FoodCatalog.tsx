import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Empty, Field, Modal, useApp } from '../components/ui';
import { foodCatalog, foodCategories, catalogFood, matchingFoods, type CatalogFood } from '../domain/food-catalog';
import { registerCatalogFoods } from '../db/healthy-meals';
import { FoodFields } from './FoodFields';

export function FoodCatalog({ onClose }: { onClose: () => void }) {
  const { data, run } = useApp();
  const [category, setCategory] = useState('蔬菜'); const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CatalogFood | null>(null); const [busy, setBusy] = useState(false);
  const entries = foodCatalog.filter(entry => entry.category === category && [entry.name, ...entry.aliases].join(' ').includes(search.trim()));
  const registered = (entry: CatalogFood) => data.foods.some(food => food.id === `fitness-food-${entry.key}`) || matchingFoods(entry.name, data.foods.map(food => ({ ...food, archived: false }))).some(food => food.name === entry.name);
  return <Modal title="健身食物参考目录" onClose={onClose} wide>
    <p className="form-note">通用食物提供每百克可食部分的估算，确认登记后才能匹配。补剂请按具体品牌标签填写。</p>
    <div className="form-grid"><Field label="参考食物分类"><select value={category} onChange={e => { setCategory(e.target.value); setSearch(''); }}>{foodCategories.map(category => <option key={category}>{category}</option>)}</select></Field><Field label="搜索参考食物"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="例如：胡萝卜" /></Field></div>
    {entries.some(entry => entry.nutrition && !registered(entry)) && <button className="button secondary" disabled={busy} onClick={() => {
      setBusy(true); void run(async () => { await registerCatalogFoods(entries.filter(entry => entry.nutrition && !registered(entry)).map(entry => entry.key), data.generation); }, '已登记本类通用食物，可在食物库修改营养值').finally(() => setBusy(false));
    }}>登记当前分类通用食物</button>}
    <div className="catalog-food-list">{entries.map(entry => <article className="catalog-food-row" key={entry.key}><div><h3>{entry.name}</h3><p>{entry.nutrition ? `${entry.nutrition[0]} 千卡 · 蛋白 ${entry.nutrition[1]} 克 / 100 克` : '待填写产品营养标签'}</p><p>{entry.note}</p></div>{registered(entry) ? <span className="badge">已登记（含归档）</span> : <Button onClick={() => setEditing(entry)}>{entry.nutrition ? '查看并登记' : '按标签登记'}</Button>}</article>)}</div>
    {!entries.length && <Empty title="没有匹配的参考食物">可在食物库手动登记。</Empty>}
    <p className="form-note">目录含蔬菜、水果、肉蛋鱼虾、奶豆、主食与调味；所有数值可按实际标签修改。</p>
    <Link className="text-button" to="/healthy-meals" onClick={onClose}>使用已登记食物组合健康餐</Link>
    {editing && <Modal title={`登记${editing.name}`} onClose={() => setEditing(null)}><p className="form-note">{editing.note}</p><FoodFields initial={editing.nutrition ? catalogFood(editing) : { name: editing.name }} onSaved={() => setEditing(null)} /></Modal>}
  </Modal>;
}
