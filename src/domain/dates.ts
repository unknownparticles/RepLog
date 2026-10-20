import { addDays, addMonths, addQuarters, addWeeks, addYears, eachDayOfInterval, endOfMonth, endOfQuarter, endOfWeek, endOfYear, format, parseISO, startOfMonth, startOfQuarter, startOfWeek, startOfYear } from 'date-fns';
import { TZDate } from '@date-fns/tz';
export type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';
export const periodLabels: Record<Period, string> = { day: '日', week: '周', month: '月', quarter: '季度', year: '年度' };
export const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
export function today(timeZone: string, now = new Date()) { return format(new TZDate(now, timeZone), 'yyyy-MM-dd'); }
export function shiftDate(date: string, amount: number) { return dateKey(addDays(parseISO(date), amount)); }
export function range(period: Period, anchor: string): [string, string] {
  const date = parseISO(anchor);
  switch (period) {
    case 'day': return [anchor, anchor];
    case 'week': return [dateKey(startOfWeek(date, { weekStartsOn: 1 })), dateKey(endOfWeek(date, { weekStartsOn: 1 }))];
    case 'month': return [dateKey(startOfMonth(date)), dateKey(endOfMonth(date))];
    case 'quarter': return [dateKey(startOfQuarter(date)), dateKey(endOfQuarter(date))];
    case 'year': return [dateKey(startOfYear(date)), dateKey(endOfYear(date))];
  }
}
export function days(start: string, end: string) { return start > end ? [] : eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map(dateKey); }
export function shiftPeriod(period: Period, date: string, amount: number) { return dateKey(({ day: addDays, week: addWeeks, month: addMonths, quarter: addQuarters, year: addYears }[period])(parseISO(date), amount)); }
export function comparisonRanges(period: Period, anchor: string, now: string) {
  const current = range(period, anchor);
  const previous = range(period, shiftPeriod(period, current[0], -1));
  if (current[0] > now) return null;
  if (current[1] < now || period === 'day') return { current, previous };
  const count = Math.min(days(current[0], now).length, days(previous[0], previous[1]).length);
  return { current: [current[0], shiftDate(current[0], count - 1)] as [string, string], previous: [previous[0], shiftDate(previous[0], count - 1)] as [string, string] };
}
export function periodTitle(period: Period, anchor: string) {
  const date = parseISO(anchor);
  if (period === 'year') return `${format(date, 'yyyy')} 年`;
  if (period === 'quarter') return `${format(date, 'yyyy')} 年 · 第 ${Math.floor(date.getMonth() / 3) + 1} 季度`;
  if (period === 'month') return `${format(date, 'yyyy')} 年 ${format(date, 'M')} 月`;
  if (period === 'day') return `${format(date, 'M')} 月 ${format(date, 'd')} 日`;
  const [a, b] = range(period, anchor); return `${a} — ${b}`;
}
