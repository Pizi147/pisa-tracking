import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Toast = { id: number; kind: 'ok' | 'error' | 'info'; text: string };
type Ctx = { push: (kind: Toast['kind'], text: string) => void };

const ToastCtx = createContext<Ctx>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, kind, text }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), kind === 'error' ? 7000 : 3500);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md" role="status" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={`card px-4 py-3 shadow-xl text-sm border ${
              t.kind === 'error'
                ? 'border-rose-300/40 text-red-200'
                : t.kind === 'ok'
                  ? 'border-sky-300/40 text-sky-200'
                  : 'border-sky-300/40 text-sky-200'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
