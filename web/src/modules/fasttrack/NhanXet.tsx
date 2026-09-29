/**
 * NHẬN XÉT W1/W2/S (PR-HSM, YC-13.5). Không bắt buộc, ≤ 1000 ký tự; không phải điểm — lưu không hỏi lý do, không đổi "Nhập
 * bởi". Lưu qua đúng đường ghi điểm (`save(k, { nhanXet })` → `PUT /attempts/:id/scores/:skill`).
 *
 *   HopNhanXet  Nằm ở: Test › Lịch Test / Nhập điểm cả lớp ở < 640 px → chip W1/W2/S → nút ✎ cạnh ô điểm của từng em.
 *   ONhanXet    Nằm ở: Test › một lượt MT (hồ sơ Mock) → khối "Nhận xét Writing" (Task 1 · Task 2) / "Nhận xét Speaking".
 */
import { useEffect, useRef, useState } from 'react';
import { NHAN_XET_TOI_DA } from '@shared/domain/index.ts';
import { Modal } from '../../ui/Drawer.tsx';

/** Đếm ký tự chỉ hiện khi đã gần trần (> 800) — không làm rối lúc gõ vài câu. */
function Dem({ n }: { n: number }) {
  if (n <= 800) return null;
  return <span className={`tabular-nums ${n >= NHAN_XET_TOI_DA ? 'text-bad' : 'text-slate-500'}`}>{n}/{NHAN_XET_TOI_DA}</span>;
}

/** Bút chì 12 px nét 1.5 (không dùng ký tự ✎ — Inter cỡ nhỏ vẽ nhoè). */
function ButChi() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" className="inline-block shrink-0"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.2 1.8 10.2 3.8 4 10H2V8z" />
    </svg>
  );
}

/** Nút ✎ (vùng bấm 44 px) + hộp nhận xét của một em. Đã có nhận xét thì bút đậm màu `accent`. */
export function HopNhanXet({ tieuDe, giaTri, onLuu }: {
  tieuDe: string; giaTri: string | null; onLuu: (v: string | null) => Promise<boolean>;
}) {
  const [mo, setMo] = useState(false);
  const [nhap, setNhap] = useState(giaTri ?? '');
  const [busy, setBusy] = useState(false);
  const moHop = () => { setNhap(giaTri ?? ''); setMo(true); };
  const luu = async () => {
    setBusy(true);
    const ok = await onLuu(nhap.trim() || null);
    setBusy(false);
    if (ok) setMo(false);          // lỗi: giữ nguyên chữ đã gõ trong hộp (toast đã báo)
  };
  return (
    <>
      <button type="button" onClick={moHop} aria-label={`${giaTri ? 'Sửa' : 'Thêm'} nhận xét — ${tieuDe}`}
        title={giaTri ?? 'Thêm nhận xét'}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${giaTri ? 'text-[color:var(--accent-strong)]' : 'text-slate-500'}`}>
        <ButChi />
      </button>
      <Modal open={mo} onClose={() => !busy && setMo(false)} title={`Nhận xét · ${tieuDe}`} width="max-w-md"
        footer={<>
          <button className="btn" onClick={() => setMo(false)} disabled={busy}>Đóng</button>
          <button className="btn btn-primary" onClick={() => void luu()} disabled={busy || nhap.trim() === (giaTri ?? '')}>
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
        </>}>
        <label className="block">
          <span className="flex items-baseline justify-between text-xs text-slate-400">
            <span>Nhận xét (không bắt buộc)</span><Dem n={nhap.length} />
          </span>
          <textarea className="field mt-1 w-full text-sm" rows={5} maxLength={NHAN_XET_TOI_DA} value={nhap}
            onChange={(e) => setNhap(e.target.value)} />
        </label>
      </Modal>
    </>
  );
}

/**
 * Ô nhận xét tại chỗ của hồ sơ Mock: tự cao theo chữ, lưu khi rời ô hoặc Ctrl+Enter, trạng thái lưu nhỏ bên phải nhãn.
 * Lỗi mạng: giữ chữ đã gõ, hiện "Chưa lưu — thử lại" (bấm để gửi lại).
 */
export function ONhanXet({ nhan, phu, giaTri, onLuu }: {
  nhan: string; phu?: string | null; giaTri: string | null; onLuu: (v: string | null) => Promise<boolean>;
}) {
  const [nhap, setNhap] = useState(giaTri ?? '');
  const [tt, setTt] = useState<'idle' | 'dang' | 'xong' | 'loi'>('idle');
  const o = useRef<HTMLTextAreaElement>(null);
  const sua = useRef(false);
  useEffect(() => { if (!sua.current) setNhap(giaTri ?? ''); }, [giaTri]);
  useEffect(() => {
    const el = o.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [nhap]);
  const luu = async () => {
    if (nhap.trim() === (giaTri ?? '').trim() || tt === 'dang') { sua.current = false; return; }
    setTt('dang');
    const ok = await onLuu(nhap.trim() || null);
    setTt(ok ? 'xong' : 'loi');
    if (ok) sua.current = false;
  };
  return (
    <label className="block min-w-0">
      <span className="flex items-baseline gap-2 text-xs text-slate-400">
        <span className="font-medium text-slate-300">{nhan}</span>
        {phu && <span className="min-w-0 truncate text-slate-500" title={phu}>{phu}</span>}
        <span className="ml-auto flex items-baseline gap-2">
          <Dem n={nhap.length} />
          {tt === 'dang' && <span className="text-slate-500">Đang lưu…</span>}
          {tt === 'xong' && <span className="text-slate-500">Đã lưu</span>}
          {tt === 'loi' && (
            <button type="button" className="appearance-none border-0 bg-transparent p-0 text-xs font-semibold text-bad underline"
              onMouseDown={(e) => e.preventDefault()} onClick={() => void luu()}>Chưa lưu — thử lại</button>
          )}
        </span>
      </span>
      <textarea ref={o} className="field mt-1 w-full resize-none text-sm leading-relaxed" rows={2} maxLength={NHAN_XET_TOI_DA}
        value={nhap} placeholder="Không bắt buộc"
        onChange={(e) => { sua.current = true; setNhap(e.target.value); if (tt !== 'dang') setTt('idle'); }}
        onBlur={() => void luu()}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void luu(); } }} />
    </label>
  );
}
