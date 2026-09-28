import { useEffect, useId, useRef, useState } from 'react';
import { kiemGhiRoKhac } from '@shared/domain/index.ts';

type Props = {
  hien: boolean; value: string; onChange: (v: string) => void; nhan?: string;
  goiY?: string; id?: string; loi?: string | null; onBlur?: () => void;
  /** Không báo lỗi (form sửa: bản ghi cũ chưa đụng tới thì không bắt Ghi rõ). */
  khongBaoLoi?: boolean;
};

/**
 * Ô "Khác" (T13): chọn Khác → ô chữ nhỏ NGAY DƯỚI, bắt buộc ≥ 3 ký tự. Lỗi hiện sau khi rời ô hoặc khi form truyền `loi`.
 * Chỉ tự focus khi VỪA chọn Khác (`hien` false → true); mở form sửa bản ghi đã là Khác thì không nhảy vào ô (Q18, bàn phím điện thoại).
 */
export function OKhac({ hien, value, onChange, nhan = 'Ghi rõ', goiY = 'Ví dụ: Đi muộn giờ ăn trưa', id, loi, onBlur, khongBaoLoi }: Props) {
  const [daRoi, setDaRoi] = useState(false);
  const o = useRef<HTMLInputElement>(null);
  const truoc = useRef(hien);
  const idLoi = useId();
  useEffect(() => { if (hien && !truoc.current) o.current?.focus(); truoc.current = hien; }, [hien]);
  if (!hien) return null;
  const cau = khongBaoLoi ? null : loi ?? (daRoi ? kiemGhiRoKhac(value) : null);
  return (
    <label className="mt-1.5 block min-w-0">
      <span className="mb-1 block text-[11.5px] font-bold text-slate-200">{nhan}<span aria-hidden className="text-bad"> *</span><span className="sr-only"> (bắt buộc)</span></span>
      <input ref={o} id={id} className="field w-full" maxLength={200} value={value} placeholder={goiY} aria-invalid={!!cau || undefined} aria-describedby={cau ? idLoi : undefined}
        onChange={(e) => onChange(e.target.value)} onBlur={() => { setDaRoi(true); onBlur?.(); }} />
      {cau && <span id={idLoi} className="mt-1 block text-[11px] text-late">{cau}</span>}
    </label>
  );
}
