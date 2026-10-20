import { createContext, useContext, useRef, type ReactNode, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import * as Tooltip from '@radix-ui/react-tooltip';
import { X, Info } from 'lucide-react';
import type { Snapshot } from '../domain/model';
export type AppContextValue = { data: Snapshot; run: (action: () => Promise<unknown>, message?: string) => Promise<boolean>; notify: (text: string, error?: boolean) => void };
export const AppContext = createContext<AppContextValue | null>(null);
export function useApp() { const context = useContext(AppContext); if (!context) throw new Error('应用尚未初始化'); return context; }
export function PageTitle({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="page-title"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>;
}
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) { return <div className="empty"><h3>{title}</h3>{children && <p>{children}</p>}{action}</div>; }
export function Metric({ label, value, unit, detail, tone = 'green' }: { label: string; value: ReactNode; unit?: string; detail?: string; tone?: string }) {
  return <article className="metric"><span className="metric-label">{label}</span><div className="metric-value">{value}<small>{unit}</small></div>{detail && <span className="metric-detail">{detail}</span>}</article>;
}
const DialogDepth = createContext(0);
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const depth = useContext(DialogDepth);
  const content = useRef<HTMLDivElement>(null);
  const returnFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  return <DialogDepth.Provider value={depth + 1}><Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="modal-overlay" style={{ zIndex: 60 + depth * 2 }} /><Dialog.Content ref={content} data-replog-dialog aria-describedby={undefined} className={wide ? 'modal wide' : 'modal'} style={{ zIndex: 61 + depth * 2 }} onEscapeKeyDown={event => {
    event.preventDefault();
    const dialogs = document.querySelectorAll('[data-replog-dialog]');
    if (dialogs[dialogs.length - 1] !== content.current) return;
    event.stopImmediatePropagation(); onClose();
  }} onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }} onInteractOutside={event => event.preventDefault()}><div className="modal-heading"><Dialog.Title asChild><h2>{title}</h2></Dialog.Title><Dialog.Close asChild><button type="button" className="icon-button" aria-label="关闭弹窗"><X size={18} /></button></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root></DialogDepth.Provider>;
}
export function Segmented({ value, onChange, items, label }: { value: string; onChange: (value: string) => void; items: { value: string; label: ReactNode }[]; label: string }) {
  return <ToggleGroup.Root type="single" className="segmented" value={value} onValueChange={next => { if (next) onChange(next); }} aria-label={label}>{items.map(item => <ToggleGroup.Item type="button" className={value === item.value ? 'active' : ''} key={item.value} value={item.value}>{item.label}</ToggleGroup.Item>)}</ToggleGroup.Root>;
}
export function MultiToggle({ value, onChange, items, label }: { value: string[]; onChange: (value: string[]) => void; items: string[]; label: string }) {
  return <ToggleGroup.Root type="multiple" className="filter-chips" value={value} onValueChange={onChange} aria-label={label}>{items.map(item => <ToggleGroup.Item type="button" key={item} value={item} className={value.includes(item) ? 'active' : ''}>{item}</ToggleGroup.Item>)}</ToggleGroup.Root>;
}
export function Help({ text, label }: { text: string; label: string }) {
  return <Tooltip.Provider delayDuration={200}><Tooltip.Root><Tooltip.Trigger asChild><button type="button" className="help-button" aria-label={label}><Info size={14} /></button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="tooltip-content" sideOffset={5}>{text}<Tooltip.Arrow /></Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function submit(action: (form: FormData) => void | Promise<void>) { return (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void action(new FormData(event.currentTarget)); }; }
export function num(form: FormData, key: string, nullable = false): number | null {
  const value = String(form.get(key) ?? '').trim();
  if (!value && nullable) return null;
  if (!value) throw new Error('请填写必要的数值');
  const number = Number(value); if (!Number.isFinite(number)) throw new Error('请输入有效数值'); return number;
}
export function value(form: FormData, key: string) { return String(form.get(key) ?? '').trim(); }
export function Actions({ children }: { children: ReactNode }) { return <div className="form-actions">{children}</div>; }
export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button className="button primary" {...props}>{children}</button>; }
