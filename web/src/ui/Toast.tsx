import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { HOAN_TAC_MS, giayHoanTacConLai, themToast } from '@shared/domain/index.ts';
import { IconDat } from './BieuTuong.tsx';
import { NUT_DONG } from './KhungPanel.tsx';
import { t } from '@shared/i18n/index.ts';
import { cauHuy } from '../lib/api.ts';

/** PR-YT2 Q5: nút trong toast (ví dụ `Hoàn tác`) — bấm thì chạy `onBam` rồi gỡ toast luôn, không chờ hết `ms`. */
type HanhDong = { nhan: string; onBam: () => void };
/** `het` — mốc hết giờ (ms); `demLui` — nút vẽ "Hoàn tác (n)" đếm lùi. */
type Toast = { id: number; kind: 'ok' | 'error' | 'info'; text: string; hanhDong?: HanhDong; key?: string; het: number; demLui?: boolean };
/** `key` — cùng khoá thì toast MỚI thay toast CŨ (không chồng hai toast của cùng một việc, ví dụ ghi hai vi phạm liên tiếp). */
type PushOpts = { hanhDong?: HanhDong; ms?: number; key?: string; demLui?: boolean };
type Ctx = {
  push: (kind: Toast['kind'], text: string, opts?: PushOpts) => void;
  /** PR-N1 C1: toast chung cho mọi thao tác hoàn tác được — 10 giây (`HOAN_TAC_MS`), nút "Hoàn tác (n)" đếm lùi. */
  hoanTac: (text: string, onHoanTac: () => void, opts?: { key?: string; ms?: number }) => void;
};

const ToastCtx = createContext<Ctx>({ push: () => {}, hoanTac: () => {} });
export const useToast = () => useContext(ToastCtx);

/** Esc của lớp phủ (panel, hộp thoại, menu, hộp chọn) thắng — toast chỉ nhận Esc khi không có lớp nào. */
const LOP_PHU = '[aria-modal="true"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';
/** Gạt ngang quá ngần này (px) thì bỏ hộp. */
const NGUONG_GAT = 80;

/** Nhãn nút đếm lùi — tự đổi mỗi giây; đang giữ (`dung` = ms còn lại) thì đứng số. */
function DemLui({ nhan, het, dung }: { nhan: string; het: number; dung: number | null }) {
  const [bayGio, setBayGio] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setBayGio(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <>{nhan} ({giayHoanTacConLai(dung === null ? het : bayGio + dung, bayGio)})</>;
}

/**
 * TOAST-GON (chủ SP 21/11): một hộp — ✕ tắt, gạt ngang (chuột / vuốt) để bỏ; rê chuột hoặc focus thì đứng giờ.
 * Tắt hộp chỉ ẩn thông báo: thao tác đã lưu, Hoàn tác vẫn ở dải tại chỗ / Lịch sử như trước.
 */
function HopToast({ x, bo }: { x: Toast; bo: () => void }) {
  const [re, setRe] = useState(false);
  const [fo, setFo] = useState(false);
  const [het, setHet] = useState(x.het);
  const [dung, setDung] = useState<number | null>(null);
  const [dx, setDx] = useState(0);
  const goc = useRef<number | null>(null);
  const boRef = useRef(bo);
  boRef.current = bo;
  const giu = re || fo;
  useEffect(() => {
    if (!giu) {
      const h = setTimeout(() => boRef.current(), Math.max(0, het - Date.now()));
      return () => clearTimeout(h);
    }
    const con = het - Date.now();
    setDung(con);
    return () => { setDung(null); setHet(Date.now() + con); };
  }, [giu, het]);

  return (
    <div
      /* PR-N1 C1: ok/info trung tính (xanh dương chỉ còn cho ô điểm, A8); lỗi giữ đỏ. */
      className={`card flex items-center gap-3 border py-3 pl-4 pr-2 text-sm shadow-xl ${goc.current === null ? 'transition-[transform,opacity] duration-150 motion-reduce:transition-none' : ''} ${
        x.kind === 'error' ? 'border-bad-line text-bad' : 'touch-pan-y select-none border-[color:var(--line-strong)] text-slate-100'
      }`}
      style={dx ? { transform: `translateX(${dx}px)`, opacity: Math.max(0.3, 1 - Math.abs(dx) / 240) } : undefined}
      onPointerEnter={() => setRe(true)}
      onPointerLeave={() => setRe(false)}
      onFocus={() => setFo(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFo(false); }}
      onPointerDown={(e) => {
        /* Hộp lỗi không gạt: chữ (mã lỗi) phải bôi chọn để chép được — tắt bằng ✕ / Esc. */
        if (x.kind === 'error' || e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
        goc.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => { if (goc.current !== null) setDx(e.clientX - goc.current); }}
      onPointerUp={(e) => {
        if (goc.current === null) return;
        const xa = Math.abs(e.clientX - goc.current) >= NGUONG_GAT;
        goc.current = null;
        if (xa) bo(); else setDx(0);
      }}
      onPointerCancel={() => { goc.current = null; setDx(0); }}
    >
      <span className="flex-1">{x.kind === 'ok' && <IconDat className="mr-1.5 text-slate-400" />}{x.text}</span>
      {x.hanhDong && (
        <button
          type="button"
          className="btn btn-sm btn-ghost shrink-0"
          onClick={() => { x.hanhDong!.onBam(); bo(); }}
        >
          {x.demLui ? <DemLui nhan={x.hanhDong.nhan} het={het} dung={dung} /> : x.hanhDong.nhan}
        </button>
      )}
      <button type="button" className={`${NUT_DONG} -my-1.5 max-sm:-my-2.5`} onClick={bo} aria-label={t('Đóng')}>✕</button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string, opts?: PushOpts) => {
    if (kind === 'error' && text === cauHuy()) return;   // người dùng tự đóng hộp xác nhận — không phải lỗi
    const id = Date.now() + Math.random();
    const het = Date.now() + (opts?.ms ?? (kind === 'error' ? 7000 : 3500));
    setItems((s) => themToast(s, { id, kind, text, hanhDong: opts?.hanhDong, key: opts?.key, het, demLui: opts?.demLui }));
  }, []);
  const hoanTac = useCallback((text: string, onHoanTac: () => void, opts?: { key?: string; ms?: number }) => {
    push('ok', text, { ms: opts?.ms ?? HOAN_TAC_MS, key: opts?.key, demLui: true, hanhDong: { nhan: t('Hoàn tác'), onBam: onHoanTac } });
  }, [push]);
  const value = useMemo(() => ({ push, hoanTac }), [push, hoanTac]);
  const co = items.length > 0;
  useEffect(() => {
    if (!co) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector(LOP_PHU)) return;
      setItems((s) => s.slice(0, -1));   // Esc bỏ hộp mới nhất
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [co]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="vung-toast fixed bottom-20 md:bottom-4 right-4 z-[100] flex max-w-[min(28rem,calc(100vw-2rem))] flex-col gap-2" role="status" aria-live="polite">
        {items.map((x) => <HopToast key={x.id} x={x} bo={() => setItems((s) => s.filter((y) => y.id !== x.id))} />)}
      </div>
    </ToastCtx.Provider>
  );
}
