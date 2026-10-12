/**
 * NHẬN XÉT (PR-HSM, YC-13.5; OV-4b: cả L/R). Không bắt buộc, ≤ 1000 ký tự; không phải điểm — lưu không hỏi lý do, không đổi "Nhập
 * bởi". Lưu qua đúng đường ghi điểm (`save(k, { nhanXet })` → `PUT /attempts/:id/scores/:skill`). Nhập cùng điểm: hộp nhập điểm.
 *
 *   ONhanXet    Nằm ở: Test › một lượt MT (hồ sơ Mock) → khối "Nhận xét" (Listening · Reading · Writing Task 1 · Task 2 · Speaking).
 */
import { useEffect, useRef, useState } from 'react';
import { NHAN_XET_TOI_DA } from '@shared/domain/index.ts';

/** Đếm ký tự chỉ hiện khi đã gần trần (> 800) — không làm rối lúc gõ vài câu. */
function Dem({ n }: { n: number }) {
  if (n <= 800) return null;
  return <span className={`tabular-nums ${n >= NHAN_XET_TOI_DA ? 'text-bad' : 'text-slate-500'}`}>{n}/{NHAN_XET_TOI_DA}</span>;
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
        <span className="shrink-0 whitespace-nowrap font-medium text-slate-300">{nhan}</span>
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
        value={nhap} placeholder="Ví dụ: Nghe phần 3 còn chậm, cần luyện thêm dạng điền bảng"
        onChange={(e) => { sua.current = true; setNhap(e.target.value); if (tt !== 'dang') setTt('idle'); }}
        onBlur={() => void luu()}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void luu(); } }} />
    </label>
  );
}
