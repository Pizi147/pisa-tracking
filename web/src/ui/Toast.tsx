import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/** PR-YT2 Q5: nút trong toast (ví dụ `Hoàn tác`) — bấm thì chạy `onBam` rồi gỡ toast luôn, không chờ hết `ms`. */
type HanhDong = { nhan: string; onBam: () => void };
type Toast = { id: number; kind: 'ok' | 'error' | 'info'; text: string; hanhDong?: HanhDong; key?: string };
/** `key` — cùng khoá thì toast MỚI thay toast CŨ (không chồng hai toast của cùng một việc, ví dụ ghi hai vi phạm liên tiếp). */
type PushOpts = { hanhDong?: HanhDong; ms?: number; key?: string };
type Ctx = { push: (kind: Toast['kind'], text: string, opts?: PushOpts) => void };

const ToastCtx = createContext<Ctx>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string, opts?: PushOpts) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...(opts?.key ? s.filter((t) => t.key !== opts.key) : s), { id, kind, text, hanhDong: opts?.hanhDong, key: opts?.key }]);
    const ms = opts?.ms ?? (kind === 'error' ? 7000 : 3500);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), ms);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md" role="status" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={`card px-4 py-3 shadow-xl text-sm border flex items-center gap-3 ${
              t.kind === 'error'
                ? 'border-bad-line text-bad'
                : t.kind === 'ok'
                  ? 'border-doing/40 text-doing'
                  : 'border-doing/40 text-doing'
            }`}
          >
            <span className="flex-1">{t.text}</span>
            {t.hanhDong && (
              <button
                type="button"
                className="btn btn-sm btn-ghost shrink-0"
                onClick={() => {
                  t.hanhDong!.onBam();
                  setItems((s) => s.filter((x) => x.id !== t.id));
                }}
              >
                {t.hanhDong.nhan}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
