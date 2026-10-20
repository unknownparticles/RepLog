import { createContext, useContext } from 'react';
import type { Snapshot } from '../domain/model';

export type AppContextValue = { data: Snapshot; run: (action: () => Promise<unknown>, message?: string) => Promise<boolean>; notify: (text: string, error?: boolean) => void };
export const AppContext = createContext<AppContextValue | null>(null);
export function useApp() { const context = useContext(AppContext); if (!context) throw new Error('应用尚未初始化'); return context; }
