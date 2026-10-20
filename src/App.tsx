import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Activity, CalendarDays, Dumbbell, Utensils, ChartNoAxesCombined, Settings, Check, CloudOff, Leaf, X, RefreshCw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ZodError } from 'zod';
import { readSnapshot } from './db/database';
import { AppContext } from './components/ui';
import { CalendarPage, DayPage } from './features/Calendar';
import { TrainingPage, WorkoutPage, ExercisesPage } from './features/Training';
import { NutritionPage, FoodsPage } from './features/Nutrition';
import { SettingsPage } from './features/Settings';
const AnalyticsPage = lazy(() => import('./features/Analytics'));
const navigation = [
  { to: '/calendar', label: '日历', icon: CalendarDays }, { to: '/training', label: '训练', icon: Dumbbell },
  { to: '/nutrition', label: '饮食', icon: Utensils }, { to: '/analytics', label: '分析', icon: ChartNoAxesCombined }, { to: '/settings', label: '我的', icon: Settings },
];

export function App() {
  const [databaseError, setDatabaseError] = useState('');
  const data = useLiveQuery(async () => { try { return await readSnapshot(); } catch (error) { setDatabaseError(String(error)); return undefined; } }, []);
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [cached, setCached] = useState(false);
  const [registerError, setRegisterError] = useState(false);
  const previousGeneration = useRef<string | null>(null);
  const { offlineReady: [offlineReady], needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({ onRegisterError: () => setRegisterError(true) });
  const route = useLocation();
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), toast.error ? 9000 : 4000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    if ('serviceWorker' in navigator && 'caches' in window) void navigator.serviceWorker.ready.then(async () => {
      setCached(Boolean(await caches.match(new URL(`${import.meta.env.BASE_URL}index.html`, location.origin).href, { ignoreSearch: true })));
    });
  }, []);
  useEffect(() => { if (data) document.documentElement.dataset.theme = data.profile.theme; }, [data?.profile.theme]);
  useEffect(() => {
    if (!data) return;
    if (previousGeneration.current && previousGeneration.current !== data.generation) setToast({ text: '本地数据已恢复或清空，页面已重新载入最新记录。', error: false });
    previousGeneration.current = data.generation;
  }, [data?.generation]);
  useEffect(() => { window.scrollTo(0, 0); }, [route.pathname]);
  const notify = (text: string, error = false) => setToast({ text, error });
  async function run(action: () => Promise<unknown>, message?: string) {
    try { await action(); if (message) notify(message); return true; }
    catch (error) { notify(error instanceof ZodError ? '请检查输入：' + error.issues.map(i => i.message).slice(0, 3).join('；') : error instanceof Error ? error.message : '操作失败，请重试。', true); return false; }
  }
  if (!data) return <div className="boot"><Activity size={32} /><p>{databaseError || '正在读取你的记录…'}</p>{databaseError && <button onClick={() => location.reload()}>刷新重试</button>}</div>;
  const active = route.pathname.startsWith('/workouts') || route.pathname === '/exercises' ? '/training' : route.pathname === '/foods' ? '/nutrition' : route.pathname.startsWith('/day') ? '/calendar' : route.pathname;
  return <AppContext.Provider value={{ data, run, notify }}><div className="app-shell">
    <aside className="sidebar"><NavLink className="brand" to="/calendar"><span className="brand-mark"><Activity size={24} strokeWidth={2.6} /></span><span>RepLog<span className="brand-tag">健身日历</span></span></NavLink>
      <span className="nav-caption">你的每日节奏</span><nav aria-label="主导航">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={active === to ? 'nav-item selected' : 'nav-item'}><Icon size={20} /><span>{label}</span>{active === to && <span className="nav-dot" />}</NavLink>)}</nav>
      <div className="sidebar-note"><Leaf size={24} /><p>每一份坚持<br /><strong>都有迹可循。</strong></p><small>慢慢来，也在向前。</small></div>
      <NavLink to="/settings#about" className="sidebar-version">RepLog <span>v{__APP_VERSION__}</span></NavLink>
    </aside>
    <div className="main-shell"><div className="topbar"><span className="topbar-title">记录日常，看见改变</span><div className="topbar-right"><span className="storage-status">{online ? <Check size={14} /> : <CloudOff size={14} />}{offlineReady || cached ? '离线可用 · 本地保存' : registerError ? '离线准备失败' : '本地保存'}</span><NavLink to="/settings" className="avatar" aria-label="我的设置">我</NavLink></div></div>
      {needRefresh && <div className="update-banner"><RefreshCw size={16} /><span>新版本已准备好。请先保存当前输入，再更新。</span><button onClick={() => { if (window.confirm('确定已保存当前输入？更新会重新载入页面，已保存的训练草稿将保留。')) void updateServiceWorker(true); }}>更新应用</button></div>}
      <main><Suspense fallback={<div className="empty">正在准备分析图表…</div>}><Routes key={data.generation}>
        <Route path="/" element={<Navigate to="/calendar" replace />} /><Route path="/calendar" element={<CalendarPage />} /><Route path="/day/:date" element={<DayPage />} />
        <Route path="/training" element={<TrainingPage />} /><Route path="/exercises" element={<ExercisesPage />} /><Route path="/workouts/:id" element={<WorkoutPage />} />
        <Route path="/nutrition" element={<NutritionPage />} /><Route path="/foods" element={<FoodsPage />} /><Route path="/analytics" element={<AnalyticsPage />} /><Route path="/settings" element={<SettingsPage offlineReady={offlineReady || cached} registerError={registerError} />} />
        <Route path="*" element={<div className="empty"><h1>这一页还没有记录</h1><NavLink to="/calendar" className="button primary">回到日历</NavLink></div>} />
      </Routes></Suspense></main><footer className="app-footer"><span>RepLog · 认真生活，好好记录</span><span>v{__APP_VERSION__} · 数据仅保存在当前浏览器</span></footer>
    </div>
    <nav className="mobile-nav" aria-label="手机导航">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={active === to ? 'selected' : ''}><Icon size={21} /><span>{label}</span></NavLink>)}</nav>
    {toast && <div className={`toast ${toast.error ? 'error' : ''}`} role={toast.error ? 'alert' : 'status'}>{toast.error ? <Activity size={18} /> : <Check size={18} />}<span>{toast.text}</span><button onClick={() => setToast(null)} aria-label="关闭提示"><X size={16} /></button></div>}
  </div></AppContext.Provider>;
}
