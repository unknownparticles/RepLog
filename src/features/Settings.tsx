import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Download, Upload, ShieldCheck, Smartphone, Info, Check, Trash2, Target, Scale, ExternalLink, Sun, Moon, Monitor, Clock, ChevronRight } from 'lucide-react';
import { Actions, Button, Field, Modal, PageTitle, num, submit, useApp, value } from '../components/ui';
import { goalSchema, profileSchema, meta } from '../domain/model';
import { goalFor, displayNumber } from '../domain/analytics';
import { today } from '../domain/dates';
import { removeRecord, saveGoal, saveProfile } from '../db/commands';
import { backupCounts, clearData, downloadJSON, exportBackup, importBackup, validateBackup, type Backup } from '../db/backup';
import { WeightDialog } from './Calendar';

function SettingRow({ icon, title, description, children }: { icon?: ReactNode; title: string; description?: ReactNode; children?: ReactNode }) {
  return <div className="setting-row">{icon && <span className="setting-icon">{icon}</span>}<div className="setting-copy"><h3>{title}</h3>{description && <div className="setting-description">{description}</div>}</div>{children && <div className="setting-control">{children}</div>}</div>;
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export function SettingsPage({ offlineReady, registerError }: { offlineReady: boolean; registerError: boolean }) {
  const { data, run, notify } = useApp(); const now = today(data.profile.timeZone); const goal = goalFor(data.goals, now);
  const [timeZoneOpen, setTimeZoneOpen] = useState(false);
  const [timeZoneError, setTimeZoneError] = useState('');
  const [goalOpen, setGoalOpen] = useState(false); const [weightOpen, setWeightOpen] = useState(false); const [restore, setRestore] = useState<Backup | null>(null); const [busy, setBusy] = useState(false); const [clearOpen, setClearOpen] = useState(false); const [install, setInstall] = useState<InstallEvent | null>(null); const [persistent, setPersistent] = useState<boolean | null>(null); const [storage, setStorage] = useState<StorageEstimate | null>(null); const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handler = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    void navigator.storage?.persisted?.().then(setPersistent); void navigator.storage?.estimate?.().then(setStorage);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const weights = [...data.weights].sort((a, b) => b.localDate.localeCompare(a.localDate));
  const latestWeight = weights[0];
  return <div className="settings-page"><PageTitle title="设置" description="让记录更适合你，管理偏好与本机数据。" />
    <div className="settings-groups">
      <section className="settings-group" aria-labelledby="settings-body">
        <div className="settings-group-heading"><h2 id="settings-body">目标与身体</h2><p>管理每日营养目标和体重。</p></div>
        <div className="settings-card">
          <SettingRow icon={<Target size={20} />} title="营养目标" description={<><span className="goal-highlight">{goal ? `${displayNumber(goal.energy)} 千卡 / 天` : '— 千卡 / 天'}</span>{!goal && <span className="setting-meta">未设置营养目标</span>}{goal && <span className="setting-meta">蛋白质 {goal.protein ?? '—'}g · 碳水 {goal.carbs ?? '—'}g · 脂肪 {goal.fat ?? '—'}g</span>}</>}>
            <button className="button secondary" onClick={() => setGoalOpen(true)}>设置目标</button>
          </SettingRow>
          <div className="settings-supplement"><Link className="settings-link" to="/calories?tab=daily">估算适合我的目标<ChevronRight size={16} /></Link>
            {data.goals.length > 0 && <details><summary>目标历史（{data.goals.length} 个版本）</summary><div className="history-list">{[...data.goals].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)).map(g => <div key={g.id}><span>{g.effectiveFrom} 起</span><strong>{g.energy} 千卡</strong></div>)}</div></details>}
          </div>
          <SettingRow icon={<Scale size={20} />} title="体重记录" description={latestWeight ? <>{displayNumber(latestWeight.weightGrams / 1000, 3)} kg<span className="setting-meta">最近记录于 {latestWeight.localDate}</span></> : '暂无记录，添加今天的体重。'}>
            <button className="button secondary" onClick={() => setWeightOpen(true)}>记录今天</button>
          </SettingRow>
          {weights.length > 0 && <div className="settings-supplement"><details><summary>查看最近体重记录</summary><div className="weight-preview">{weights.slice(0, 5).map(w => <div className="record-row" key={w.id}><span>{w.localDate}</span><strong>{displayNumber(w.weightGrams / 1000, 3)} kg</strong><button className="icon-button danger" aria-label={`删除${w.localDate}体重`} onClick={() => { if (window.confirm('确定删除这次体重记录？')) void run(() => removeRecord('weights', w, data.generation), '体重记录已删除'); }}><Trash2 size={16} /></button></div>)}</div><Link className="settings-link" to="/analytics">查看体重趋势<ChevronRight size={16} /></Link></details></div>}
        </div>
      </section>
      <section className="settings-group" aria-labelledby="settings-display">
        <div className="settings-group-heading"><h2 id="settings-display">显示与日期</h2><p>选择外观和每天记录使用的时区。</p></div>
        <div className="settings-card">
          <SettingRow icon={<Sun size={20} />} title="显示主题" description="立即应用，也可跟随系统切换。">
            <div className="theme-options" role="group" aria-label="显示主题">{([['system', '跟随系统', Monitor], ['light', '浅色', Sun], ['dark', '深色', Moon]] as const).map(([theme, label, Icon]) => <button key={theme} aria-pressed={data.profile.theme === theme} className={`button ${data.profile.theme === theme ? 'complete' : 'secondary'}`} onClick={() => void run(() => saveProfile({ ...data.profile, theme }, data.generation))}><Icon size={16} />{label}</button>)}</div>
          </SettingRow>
          <SettingRow icon={<Clock size={20} />} title="记录时区" description={data.profile.timeZone}>
            <button className="button secondary" onClick={() => { setTimeZoneError(''); setTimeZoneOpen(true); }}>修改时区</button>
          </SettingRow>
          <SettingRow title="记录单位与周起始日" description="千克 / 克 / 千卡 / 分钟 / 公里 · 周一起始" />
        </div>
      </section>
      <section className="settings-group" aria-labelledby="settings-data">
        <div className="settings-group-heading"><h2 id="settings-data">数据与备份</h2><p>数据保存在当前浏览器，换设备或清理前请先备份。</p></div>
        <div className="settings-card">
          <SettingRow icon={<Download size={20} />} title="导出完整备份" description="保存训练、餐食、体重和目标，备份文件请妥善保管。">
            <button className="button primary" onClick={() => void run(async () => downloadJSON(await exportBackup(), `RepLog-${now}-v${__APP_VERSION__}.json`), '备份已生成')}><Download size={16} />导出完整备份</button>
          </SettingRow>
          <SettingRow icon={<Upload size={20} />} title="从备份恢复" description="选择备份文件，确认后替换本机记录。">
            <button className="button secondary" onClick={() => input.current?.click()}><Upload size={16} />从备份恢复</button>
          </SettingRow>
          <input hidden type="file" accept="application/json,.json" ref={input} onChange={event => { const file = event.target.files?.[0]; if (!file) return; void run(async () => { if (file.size > 20 * 1024 * 1024) throw new Error('备份文件不能超过 20 MiB'); const checked = validateBackup(JSON.parse(await file.text())); setRestore(checked); }); event.target.value = ''; }} />
          <SettingRow icon={<ShieldCheck size={20} />} title="本机存储" description={<>已使用 {storage?.usage == null ? '—' : `${displayNumber(storage.usage / 1024, 1)} KiB`}<span className="setting-meta">{persistent === null ? '当前浏览器未提供持久存储状态' : persistent ? '已允许持久存储' : '尚未允许持久存储，建议定期备份'}</span></>}>
            {persistent === false && <button className="button secondary" onClick={() => void run(async () => { const granted = await navigator.storage.persist(); setPersistent(granted); notify(granted ? '浏览器已允许持久存储' : '浏览器未允许持久存储，仍可正常使用，请定期备份'); })}>申请持久存储</button>}
          </SettingRow>
        </div>
      </section>
      <section className="settings-group" id="about" aria-labelledby="settings-app">
        <div className="settings-group-heading"><h2 id="settings-app">应用信息</h2><p>安装到主屏幕，随时开始记录。</p></div>
        <div className="settings-card">
          <SettingRow icon={<Smartphone size={20} />} title="安装与离线" description="完成首次离线准备后，断网也能使用。">
            <span className={`badge ${offlineReady ? 'green' : ''}`}>{offlineReady ? '离线已就绪' : registerError ? '准备失败' : '正在准备'}</span>
          </SettingRow>
          <div className="settings-supplement">{install ? <Button onClick={() => void run(async () => { await install.prompt(); const choice = await install.userChoice; if (choice.outcome === 'accepted') setInstall(null); })}><Download size={17} />安装 RepLog</Button> : <details><summary>查看安装方法</summary><div className="install-instructions"><p><strong>iPhone / iPad</strong><span>Safari → 分享 → 添加到主屏幕</span></p><p><strong>Android / 电脑</strong><span>浏览器菜单 → 安装应用（如该平台支持）</span></p></div></details>}{registerError && <button className="button secondary" onClick={() => location.reload()}>重新准备离线资源</button>}</div>
          <SettingRow icon={<Info size={20} />} title="关于 RepLog" description="个人训练与饮食记录"><span className="version-badge" data-testid="app-version">v{__APP_VERSION__}</span></SettingRow>
          <div className="settings-supplement"><details><summary>版本详情与素材署名</summary><div className="detail-list"><p><span>构建提交</span><code>{__BUILD_SHA__}</code></p><p><span>构建时间</span><strong>{new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short', timeZone: data.profile.timeZone }).format(new Date(__BUILD_TIME__))}</strong></p><p><span>数据格式 / 数据库</span><strong>2 / 2</strong></p><p><span>部署方式</span><strong>GitHub Pages · 静态 PWA</strong></p></div><a className="settings-link" href={`${import.meta.env.BASE_URL}media/exercises/ATTRIBUTION.md`} target="_blank" rel="noopener noreferrer">查看动作视频素材署名<ExternalLink size={16} /></a></details></div>
        </div>
      </section>
      <section className="settings-danger" aria-labelledby="settings-danger-title"><div><h2 id="settings-danger-title">清空本机数据</h2><p>删除当前浏览器的全部个人记录，请先导出备份。</p></div><button className="button danger-outline" onClick={() => setClearOpen(true)}><Trash2 size={16} />清空本机数据</button></section>
    </div>
    {timeZoneOpen && <Modal title="修改记录时区" onClose={() => setTimeZoneOpen(false)}><form onSubmit={submit(async form => {
      const timeZone = value(form, 'timeZone');
      if (!profileSchema.shape.timeZone.safeParse(timeZone).success) { setTimeZoneError('请输入有效的时区，例如 Asia/Shanghai。'); return; }
      const saved = await run(() => saveProfile({ ...data.profile, timeZone }, data.generation), '时区已更新，历史日期保持不变');
      if (saved) setTimeZoneOpen(false);
    })}><Field label="记录时区（IANA）" hint="例如 Asia/Shanghai。修改后仅影响今天边界和新记录。"><input name="timeZone" defaultValue={data.profile.timeZone} aria-invalid={!!timeZoneError} aria-describedby={timeZoneError ? 'timezone-error' : undefined} onChange={() => setTimeZoneError('')} required /></Field>{timeZoneError && <p id="timezone-error" role="alert" className="form-note text-danger">{timeZoneError}</p>}<Actions><button className="button secondary" type="button" onClick={() => setTimeZoneOpen(false)}>取消</button><Button type="submit">保存时区</Button></Actions></form></Modal>}
    {goalOpen && <Modal title="设置营养目标" onClose={() => setGoalOpen(false)}><form onSubmit={submit(async form => {
      await run(async () => {
        const date = value(form, 'date'); const existing = data.goals.find(g => g.effectiveFrom === date);
        if (existing && !window.confirm(`这一天已有 ${existing.energy} 千卡目标，修订将影响当天至下一目标生效前的分析。继续？`)) return;
        await saveGoal(goalSchema.parse({ ...(existing || meta()), effectiveFrom: date, energy: num(form, 'energy'), protein: num(form, 'protein', true), carbs: num(form, 'carbs', true), fat: num(form, 'fat', true) }), data.generation); setGoalOpen(false);
      }, '营养目标已保存');
    })}><Field label="生效日期"><input name="date" type="date" defaultValue={now} required /></Field><Field label="每日能量目标（千卡）"><input name="energy" type="number" min="1" step="any" defaultValue={goal?.energy} required /></Field><div className="form-grid"><Field label="蛋白质目标（克，可选）"><input name="protein" type="number" min="0" step="any" defaultValue={goal?.protein ?? ''} /></Field><Field label="碳水目标（克，可选）"><input name="carbs" type="number" min="0" step="any" defaultValue={goal?.carbs ?? ''} /></Field><Field label="脂肪目标（克，可选）"><input name="fat" type="number" min="0" step="any" defaultValue={goal?.fat ?? ''} /></Field></div><p className="form-note">新目标按生效日期保存，之前日期继续使用原目标。</p><Actions><Button type="submit">保存目标</Button></Actions></form></Modal>}
    {weightOpen && <WeightDialog date={now} onClose={() => setWeightOpen(false)} />}
    {restore && <Modal title="确认恢复备份" onClose={() => { if (!busy) setRestore(null); }}><div className="notice"><ShieldCheck size={22} /><div><strong>文件验证通过</strong><p>{backupCounts(restore.entities)}</p></div></div><p>来源版本 v{restore.appVersion} · {restore.exportedAt.slice(0, 10)}</p><p className="form-note">这会替换当前全部本地数据。建议先导出当前备份；取消不会改变任何记录。</p><Actions><button disabled={busy} className="button secondary" onClick={() => setRestore(null)}>取消</button><Button disabled={busy} onClick={() => { setBusy(true); void run(async () => { await importBackup(restore, data.generation); setRestore(null); }, '备份已恢复').finally(() => setBusy(false)); }}>{busy ? '正在恢复…' : '确认替换并恢复'}</Button></Actions></Modal>}
    {clearOpen && <Modal title="清空本机数据" onClose={() => setClearOpen(false)}><form onSubmit={submit(async form => {
      if (value(form, 'confirmation') !== '清空全部数据') { notify('请输入“清空全部数据”以继续', true); return; }
      if (!window.confirm('最后确认：所有本地训练、饮食、目标和体重都会被清除。是否继续？')) return;
      await run(async () => { await clearData(data.generation); setClearOpen(false); }, '本机数据已清空');
    })}><p className="form-note">此操作会清空当前站点的所有个人记录，请先导出备份。</p><Field label="请输入“清空全部数据”"><input name="confirmation" autoComplete="off" required /></Field><Actions><button className="button danger-outline" type="submit">清空全部数据</button></Actions></form></Modal>}
  </div>;
}
