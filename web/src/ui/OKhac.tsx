import { useState } from 'react';
import { kiemGhiRoKhac } from '@shared/domain/index.ts';

type Props = {
  hien: boolean; value: string; onChange: (v: string) => void; nhan?: string;
  goiY?: string; id?: string; loi?: string | null; onBlur?: () => void;
};

/** Ô "Khác" (T13): chọn Khác → ô chữ nhỏ NGAY DƯỚI, tự focus, bắt buộc ≥ 3 ký tự. Lỗi hiện sau khi rời ô hoặc khi form truyền `loi`. */
export function OKhac({ hien, value, onChange, nhan = 'Ghi rõ', goiY = 'Ví dụ: Đi muộn giờ ăn trưa', id, loi, onBlur }: Props) {
  const [daRoi, setDaRoi] = useState(false);
  if (!hien) return null;
  const cau = loi ?? (daRoi ? kiemGhiRoKhac(value) : null);
  return (
    <label className="mt-1.5 block min-w-0">
      <span className="mb-1 block text-[11.5px] font-bold text-slate-200">{nhan}<span className="text-bad"> *</span></span>
      <input id={id} className="field w-full" autoFocus maxLength={200} value={value} placeholder={goiY} aria-invalid={!!cau || undefined}
        onChange={(e) => onChange(e.target.value)} onBlur={() => { setDaRoi(true); onBlur?.(); }} />
      {cau && <span className="mt-1 block text-[11px] text-late">{cau}</span>}
    </label>
  );
}
