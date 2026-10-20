import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChartNoAxesCombined, Info, ArrowRight } from 'lucide-react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, CalendarComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Empty, Metric, PageTitle, useApp } from '../components/ui';
import { aggregate, buckets, daySummary, displayNumber, nutritionValue, workoutMetrics } from '../domain/analytics';
import { comparisonRanges, periodLabels, periodTitle, range, shiftPeriod, today, type Period } from '../domain/dates';
import { dateSchema } from '../domain/model';

echarts.use([BarChart, LineChart, PieChart, HeatmapChart, GridComponent, TooltipComponent, LegendComponent, CalendarComponent, VisualMapComponent, CanvasRenderer]);
type Option = echarts.EChartsCoreOption;
function Chart({ option, label, onPoint, height = 260 }: { option: Option; label: string; onPoint?: (index: number, value: unknown) => void; height?: number }) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const chart = echarts.init(element.current!);
    const text = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
    chart.setOption({ textStyle: { fontFamily: 'system-ui, sans-serif', color: text }, animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches, ...option });
    chart.on('click', (event: unknown) => { const point = event as { dataIndex: number; value: unknown }; onPoint?.(point.dataIndex, point.value); });
    const resize = new ResizeObserver(() => chart.resize()); resize.observe(element.current!);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [option]);
  return <div role="img" aria-label={label} ref={element} style={{ height, width: '100%', minWidth: 0 }} />;
}
const tooltip = { trigger: 'axis', renderMode: 'richText', confine: true };
function lineBar(labels: string[], series: Option['series'], unit: string): Option {
  return { tooltip, legend: { bottom: 0, icon: 'roundRect', itemWidth: 11, itemHeight: 7 }, grid: { top: 28, left: 46, right: 15, bottom: 56 }, xAxis: { type: 'category', data: labels, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#89948e', fontSize: 10 } }, yAxis: { type: 'value', name: unit, nameTextStyle: { color: '#89948e', padding: [0, 0, 5, 0] }, axisLabel: { color: '#89948e', fontSize: 10 }, splitLine: { lineStyle: { color: '#89948e22', type: 'dashed' } } }, series };
}

export default function AnalyticsPage() {
  const { data } = useApp(); const [params, setParams] = useSearchParams(); const navigate = useNavigate();
  const now = today(data.profile.timeZone); const period = Object.hasOwn(periodLabels, params.get('period') || '') ? params.get('period') as Period : 'month';
  const parsed = dateSchema.safeParse(params.get('anchor') || now); const anchor = parsed.success ? parsed.data : now;
  const [heatMode, setHeatMode] = useState<'training' | 'diet'>('training'); const [start, end] = range(period, anchor);
  const stats = aggregate(data, start, end, now); const series = buckets(data, period, anchor, now);
  const comparison = comparisonRanges(period, anchor, now);
  const current = comparison && aggregate(data, ...comparison.current, now); const previous = comparison && aggregate(data, ...comparison.previous, now);
  const enough = current && previous && current.coverage === 1 && previous.coverage === 1;
  const energyDiff = enough ? current.energy - previous.energy : null;
  const labels = series.map(b => b.label);
  const daily = daySummary(data, anchor);
  const mealLabels = ['早餐', '午餐', '晚餐', '加餐'];
  const energyLabels = period === 'day' ? mealLabels : labels;
  const energyData = period === 'day' ? mealLabels.map(type => {
    const meals = data.meals.filter(m => m.localDate === anchor && m.mealType === type);
    return meals.length ? meals.flatMap(m => m.items).reduce((sum, i) => sum + nutritionValue(i.food, i.grams, 'energy')!, 0) : daily.diet === 'complete' ? 0 : null;
  }) : series.map(b => b.energy == null ? null : { value: b.energy, itemStyle: { color: b.stats.completeDays === b.stats.elapsedDays && b.stats.elapsedDays > 0 ? '#de9a56' : '#efd5b5', borderColor: '#de9a56', borderWidth: 1, borderType: 'dashed' } });
  const energyOption = lineBar(energyLabels, [
    { name: '已记录摄入', type: 'bar', data: energyData, barMaxWidth: 23, itemStyle: { color: '#de9a56', borderRadius: [4, 4, 0, 0] } },
    ...(period !== 'day' ? [{ name: '有效目标合计', type: 'line', data: series.map(b => b.target), step: 'end', symbol: 'none', lineStyle: { color: '#76a88d', type: 'dashed', width: 2 }, itemStyle: { color: '#76a88d' }, connectNulls: false }] : []),
  ], '千卡');
  const trainingLabels = period === 'day' ? daily.workouts.filter(w => w.status === 'completed').map(w => w.name) : labels;
  const trainingStats = period === 'day' ? daily.workouts.filter(w => w.status === 'completed').map(w => workoutMetrics([w])) : series.map(b => b.stats);
  const volumeOption = lineBar(trainingLabels, [{ name: '外部负重训练量', type: 'bar', barMaxWidth: 25, data: trainingStats.map(s => s.volume), itemStyle: { color: '#6b9f83', borderRadius: [4, 4, 0, 0] } }], 'kg');
  const muscleEntries = Object.entries(stats.muscles).sort((a, b) => b[1] - a[1]);
  const muscleOption: Option = { color: ['#39795a', '#6e9c77', '#a4bd8e', '#d5dcb6', '#d7a164', '#e3c39d', '#88adb1', '#9c9cbc'], tooltip: { trigger: 'item', renderMode: 'richText', confine: true, valueFormatter: (v: unknown) => `${displayNumber(Number(v), 2)} 组` }, legend: { bottom: 0, icon: 'circle', itemWidth: 8 }, series: [{ type: 'pie', radius: ['48%', '70%'], center: ['50%', '42%'], label: { show: false }, itemStyle: { borderWidth: 4, borderColor: getComputedStyle(document.documentElement).getPropertyValue('--panel').trim(), borderRadius: 7 }, data: muscleEntries.map(([name, value]) => ({ name, value })) }] };
  const weightOption = lineBar(labels, [{ name: '最后测量体重', type: 'line', data: series.map(b => b.stats.latestWeight ? Number((b.stats.latestWeight.weightGrams / 1000).toFixed(3)) : null), connectNulls: false, symbolSize: 7, itemStyle: { color: '#9192b2' }, lineStyle: { color: '#9192b2', width: 2 } }], 'kg');
  const frequencyOption = lineBar(trainingLabels, [{ name: '已记录完成训练', type: 'bar', data: trainingStats.map(s => s.count), barMaxWidth: 25, itemStyle: { color: '#739eae', borderRadius: [4, 4, 0, 0] } }], '次');
  const heatOption: Option = { tooltip: { trigger: 'item', renderMode: 'richText', confine: true }, visualMap: { show: false, min: 0, max: heatMode === 'diet' ? 2 : 4, inRange: { color: ['#e8ece6', '#b8d0bc', '#38845a'] } }, calendar: { range: anchor.slice(0, 4), cellSize: ['auto', 17], top: 36, left: 35, right: 20, bottom: 18, splitLine: { show: false }, itemStyle: { borderWidth: 3, borderColor: getComputedStyle(document.documentElement).getPropertyValue('--panel').trim() }, yearLabel: { show: false }, monthLabel: { nameMap: Array.from({ length: 12 }, (_, i) => `${i + 1}月`), color: '#89948e' }, dayLabel: { firstDay: 1, nameMap: ['日', '一', '二', '三', '四', '五', '六'], color: '#89948e' } }, series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: stats.summaries.map(day => ({ value: [day.date, heatMode === 'diet' ? day.diet === 'complete' ? 2 : day.diet === 'partial' ? 1 : 0 : day.count ? Math.min(4, day.count + 1) : day.journal?.restDay ? 1 : 0], name: `${day.date} · ${heatMode === 'diet' ? day.diet === 'complete' ? '饮食完整' : day.diet === 'partial' ? '部分记录' : '未记录' : day.count ? `${day.count} 次训练` : day.journal?.restDay ? '明确休息' : '未记录'}` })) }] };
  function change(nextPeriod: Period, nextAnchor = anchor) { setParams({ period: nextPeriod, anchor: nextAnchor }); }
  function drill(index: number) { const bucket = series[index]; if (bucket) navigate(`/calendar?date=${bucket.start}&view=${period === 'quarter' ? 'week' : 'month'}`); }
  const hasData = stats.summaries.some(d => d.diet !== 'empty' || d.count || d.weight);
  return <><PageTitle eyebrow="SEE THE BIGGER PICTURE" title="看见积累的力量" description="偶尔回头看看，你比想象中走得更远。" /><div className="analytics-toolbar"><div className="segmented period-tabs">{Object.entries(periodLabels).map(([key, label]) => <button key={key} className={period === key ? 'active' : ''} onClick={() => change(key as Period)}>{label}</button>)}</div><div className="date-switcher"><button className="icon-button" aria-label="上一分析周期" onClick={() => change(period, shiftPeriod(period, anchor, -1))}><ChevronLeft size={18} /></button><strong>{periodTitle(period, anchor)}</strong><button className="icon-button" aria-label="下一分析周期" onClick={() => change(period, shiftPeriod(period, anchor, 1))}><ChevronRight size={18} /></button><button className="text-button" onClick={() => change(period, now)}>本期</button></div></div><p className="period-range">{start} — {end} · 截至 {now} · 图表可点击查看日期</p>
    <div className="metrics four"><Metric label="完成训练" value={stats.count} unit="次" detail={`${stats.trainingDays} 个训练日 · ${stats.rests} 个明确休息日`} /><Metric label="完整日均摄入" value={displayNumber(stats.average)} unit="千卡" detail={`仅统计 ${stats.completeDays} 个已确认完整日`} tone="orange" /><Metric label="饮食记录覆盖" value={stats.coverage === null ? '—' : displayNumber(stats.coverage * 100)} unit="%" detail={`${stats.completeDays} / ${stats.elapsedDays} 个已过自然日`} tone="blue" /><Metric label="最新测量体重" value={displayNumber(stats.latestWeight ? stats.latestWeight.weightGrams / 1000 : null, 1)} unit="kg" detail={stats.latestWeight?.localDate || '本期暂无测量'} tone="purple" /></div>
    <div className="analysis-facts"><span>已记录摄入 <strong>{displayNumber(stats.energy)} 千卡</strong></span><span>正式力量 <strong>{stats.sets} 组</strong></span><span>有氧时长 <strong>{displayNumber(stats.cardioSeconds / 60, 1)} 分钟</strong></span><span>日能量达标 <strong>{stats.achievement === null ? '—' : `${displayNumber(stats.achievement * 100)}%`}</strong><small>（{stats.targetDays} 个有效完整日）</small></span></div>
    {!hasData && <div className="analysis-empty-notice"><ChartNoAxesCombined size={22} /><div><strong>趋势，从第一份记录开始</strong><p>这个周期还没有足够数据。先记一餐或一次训练，图表就会慢慢丰富起来。</p></div><Link to="/calendar" className="text-button">去记录<ArrowRight size={15} /></Link></div>}
    <div className="chart-grid"><section className="panel chart-panel"><div className="panel-heading"><h2>摄入与目标</h2><span className="badge orange">饮食</span></div><p className="chart-description">浅色虚线边框表示含部分记录；目标为已过日期有效目标合计。</p><Chart label="已记录摄入与有效目标趋势图，详细数值见下方数据表" option={energyOption} onPoint={period === 'day' ? () => navigate(`/nutrition?date=${anchor}`) : drill} /></section>
    <section className="panel chart-panel"><div className="panel-heading"><h2>训练部位分布</h2><span className="badge green">正式力量组</span></div><p className="chart-description">按主要肌群均分组数，辅助肌群不重复计入。</p>{muscleEntries.length ? <Chart label="各主要肌群正式组数分布，详细数值见下方数据表" option={muscleOption} /> : <Empty title="还没有正式力量组">完成训练后就能看到部位分布。</Empty>}</section>
    <section className="panel chart-panel"><div className="panel-heading"><h2>负重训练量</h2><span className="badge green">{stats.weightedSets} 个适用组</span></div><p className="chart-description">总外部负重 × 次数，不含热身、徒手、辅助和计时。</p><Chart label="外部负重训练量趋势图" option={volumeOption} onPoint={drill} /></section>
    <section className="panel chart-panel"><div className="panel-heading"><h2>体重的变化</h2><span className="badge purple">体重</span></div><p className="chart-description">汇总桶取最后一次测量；缺测保持空白，不插值。</p><Chart label="最后测量体重趋势图，测量日期见数据表" option={weightOption} onPoint={drill} /></section>
    <section className="panel chart-panel"><div className="panel-heading"><h2>训练频率</h2><span className="badge blue">记录次数</span></div><p className="chart-description">{stats.unknownTrainingDays} 个日期训练状态未知，未记录不代表未运动。</p><Chart label="各日期或周期的已完成训练次数" option={frequencyOption} onPoint={drill} /></section>
    <section className="panel comparison-panel"><div className="panel-heading"><h2>与上一周期对照</h2><Info size={18} className="muted" /></div>{comparison && current && previous ? <><p className="chart-description">{comparison.current.join(' — ')}<br />对照 {comparison.previous.join(' — ')}</p><div className="comparison-row"><span>已记录训练次数</span><strong>{current.count} <small>vs</small> {previous.count}</strong></div><div className="comparison-row"><span>营养摄入总量变化</span><strong>{energyDiff === null ? '样本不足' : `${energyDiff > 0 ? '+' : ''}${displayNumber(energyDiff)} 千卡`}</strong></div><p className="form-note">双方完整日分别 {current.completeDays}/{current.elapsedDays} 与 {previous.completeDays}/{previous.elapsedDays}。仅在两侧饮食覆盖均为 100% 时比较摄入；零基值不计算百分比。</p></> : <p className="form-note">未来周期暂不计算变化。</p>}</section></div>
    {period === 'year' && <section className="panel chart-panel heatmap-panel"><div className="panel-heading"><h2>这一年的坚持</h2><div className="segmented"><button className={heatMode === 'training' ? 'active' : ''} onClick={() => setHeatMode('training')}>训练</button><button className={heatMode === 'diet' ? 'active' : ''} onClick={() => setHeatMode('diet')}>饮食</button></div></div><div className="heatmap-scroll"><div className="heatmap-inner"><Chart label="年度逐日记录热力图" option={heatOption} height={210} onPoint={(_, value) => { if (Array.isArray(value)) navigate(`/day/${value[0]}`); }} /></div></div><p className="tiny muted">浅灰为未记录；浅绿为{heatMode === 'training' ? '明确休息' : '部分记录'}，深绿为{heatMode === 'training' ? '已完成训练' : '已确认完整'}。未来日期留空。</p></section>}
    <details className="panel chart-data"><summary>查看图表原始数据与统计口径</summary><div className="table-scroll"><table><caption>周期汇总（已记录摄入包含部分记录，日均仅用完整日）</caption><thead><tr><th>范围</th><th>摄入 kcal</th><th>目标 kcal / 天数</th><th>完整 / 已过日</th><th>训练次数</th><th>负重量 kg</th><th>体重 kg / 日期</th></tr></thead><tbody>{series.map(b => <tr key={b.key}><td><Link to={`/calendar?date=${b.start}`}>{b.start} — {b.end}</Link></td><td>{displayNumber(b.energy, 2)}</td><td>{displayNumber(b.target)} / {b.targetCoverage}</td><td>{b.stats.completeDays} / {b.stats.elapsedDays}</td><td>{b.stats.count}</td><td>{displayNumber(b.stats.volume, 2)}</td><td>{b.stats.latestWeight ? `${b.stats.latestWeight.weightGrams / 1000} / ${b.stats.latestWeight.localDate}` : '—'}</td></tr>)}</tbody></table></div><div className="muscle-data">{muscleEntries.map(([name, sets]) => <span key={name}>{name}：{displayNumber(sets, 2)} 组</span>)}</div><p className="form-note">完整确认零摄入参与日均；空白不补零。跨午夜训练归开始日，草稿不计分析。能量达标区间为当日目标的 90%～110%。图表仅描述已记录事实，不推断热量缺口或体脂变化。</p></details>
  </>;
}
