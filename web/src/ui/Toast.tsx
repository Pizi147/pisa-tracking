import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { HOAN_TAC_MS, giayHoanTacConLai } from '@shared/domain/index.ts';
import { IconDat } from './BieuTuong.tsx';
import { t } from '@shared/i18n/index.ts';

/** PR-YT2 Q5: nút trong toast (ví dụ `Hoàn tác`) — bấm thì chạy `onBam` rồi gỡ toast luôn, không chờ hết `ms`. */
type HanhDong = { nhan: string; onBam: () => void };
/** `het` (mốc hết giờ, ms) chỉ có ở toast Hoàn tác — nút vẽ "Hoàn tác (n)" đếm lùi. */
type Toast = { id: number; kind: 'ok' | 'error' | 'info'; text: string; hanhDong?: HanhDong; key?: string; het?: number };
/** `key` — cùng khoá thì toast MỚI thay toast CŨ (không chồng hai toast của cùng một việc, ví dụ ghi hai vi phạm liên tiếp). */
type PushOpts = { hanhDong?: HanhDong; ms?: number; key?: string; demLui?: boolean };
type Ctx = {
  push: (kind: Toast['kind'], text: string, opts?: PushOpts) => void;
  /** PR-N1 C1: toast chung cho mọi thao tác hoàn tác được — 5 giây, nút "Hoàn tác (n)" đếm lùi. */
  hoanTac: (text: string, onHoanTac: () => void, opts?: { key?: string }) => void;
};

const ToastCtx = createContext<Ctx>({ push: () => {}, hoanTac: () => {} });
export const useToast = () => useContext(ToastCtx);

/** Nhãn nút đếm lùi — tự đổi mỗi giây, dọn bộ đếm khi toast gỡ. */
function DemLui({ nhan, het }: { nhan: string; het: number }) {
  const [bayGio, setBayGio] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setBayGio(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <>{nhan} ({giayHoanTacConLai(het, bayGio)})</>;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string, opts?: PushOpts) => {
    const id = Date.now() + Math.random();
    const ms = opts?.ms ?? (kind === 'error' ? 7000 : 3500);
    const het = opts?.demLui ? Date.now() + ms : undefined;
    setItems((s) => [...(opts?.key ? s.filter((t) => t.key !== opts.key) : s), { id, kind, text, hanhDong: opts?.hanhDong, key: opts?.key, het }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), ms);
  }, []);
  const hoanTac = useCallback((text: string, onHoanTac: () => void, opts?: { key?: string }) => {
    push('ok', text, { ms: HOAN_TAC_MS, key: opts?.key, demLui: true, hanhDong: { nhan: t('Hoàn tác'), onBam: onHoanTac } });
  }, [push]);
  const value = useMemo(() => ({ push, hoanTac }), [push, hoanTac]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="vung-toast fixed bottom-20 md:bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md" role="status" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            /* PR-N1 C1: ok/info trung tính (xanh dương chỉ còn cho ô điểm, A8); lỗi giữ đỏ. */
            className={`card px-4 py-3 shadow-xl text-sm border flex items-center gap-3 ${
              t.kind === 'error' ? 'border-bad-line text-bad' : 'border-[color:var(--line-strong)] text-slate-100'
            }`}
          >
            <span className="flex-1">{t.kind === 'ok' && <IconDat className="mr-1.5 text-slate-400" />}{t.text}</span>
            {t.hanhDong && (
              <button
                type="button"
                className="btn btn-sm btn-ghost shrink-0"
                onClick={() => {
                  t.hanhDong!.onBam();
                  setItems((s) => s.filter((x) => x.id !== t.id));
                }}
              >
                {t.het ? <DemLui nhan={t.hanhDong.nhan} het={t.het} /> : t.hanhDong.nhan}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
