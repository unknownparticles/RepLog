import { createContext, useContext, useEffect, useRef, type ReactNode, type FormEvent } from 'react';
import { X, ArrowUpRight, Inbox } from 'lucide-react';
import type { Snapshot } from '../domain/model';
export type AppContextValue = { data: Snapshot; run: (action: () => Promise<unknown>, message?: string) => Promise<boolean>; notify: (text: string, error?: boolean) => void };
export const AppContext = createContext<AppContextValue | null>(null);
export function useApp() { const context = useContext(AppContext); if (!context) throw new Error('应用尚未初始化'); return context; }
export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}<span className="title-dot">.</span></h1><p>{description}</p></div>{action}</header>;
}
export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) { return <div className="empty"><span className="empty-icon"><Inbox size={24} /></span><h3>{title}</h3><p>{children}</p>{action}</div>; }
export function Metric({ label, value, unit, detail, tone = 'green' }: { label: string; value: ReactNode; unit?: string; detail?: string; tone?: string }) {
  return <article className={`metric ${tone}`}><span className="metric-label">{label}<ArrowUpRight size={15} /></span><div className="metric-value">{value}<small>{unit}</small></div>{detail && <span className="metric-detail">{detail}</span>}</article>;
}
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={wide ? 'modal wide' : 'modal'} onCancel={e => { e.preventDefault(); onClose(); }}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={20} /></button></div>{children}</dialog>;
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
