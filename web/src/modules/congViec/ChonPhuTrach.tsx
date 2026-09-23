import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.ts';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import type { NguoiChon } from '@shared/domain/index.ts';

export type NguoiPhuTrach = 'toi' | 'tat-ca' | number;

/**
 * Ô CHỌN NGƯỜI PHỤ TRÁCH của tab Hỗ trợ học viên (PR-Ra Q1–Q2) — chỉ hiện với QL/QT
 * (`xemNguoiKhac`), GV luôn chỉ xem việc của mình nên không có ô này.
 *
 *   Tôi                  như GV — chỉ việc của chính người xem
 *   Tất cả trong phạm vi  mặc định của QL/QT — việc của mọi người trong phạm vi (Q1)
 *   Chọn giáo viên…       mở `ChonNguoi` (chỉ người trong phạm vi, Q2) — máy chủ dựng lại
 *                         đúng như người đó nhìn thấy rồi lọc theo phạm vi người xem
 */
export function ChonPhuTrach({ value, valueName, onChange }: {
  value: NguoiPhuTrach;
  /** Tên giáo viên đã biết trước (ví dụ vừa chọn từ ô tìm) — tránh phải tra lại. */
  valueName?: string | null;
  onChange: (v: NguoiPhuTrach, name?: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [ten, setTen] = useState<string | null>(valueName ?? null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { setTen(valueName ?? null); }, [valueName]);

  /* Chỉ có ID trên địa chỉ (mở link trực tiếp `?nguoi=12`) thì tra tên một lượt. */
  useEffect(() => {
    if (typeof value !== 'number' || ten) return;
    let huy = false;
    api.get<{ id: number; fullName: string }[]>('/ref/users')
      .then((rows) => { if (!huy) { const r = rows.find((x) => x.id === value); if (r) setTen(r.fullName); } })
      .catch(() => {});
    return () => { huy = true; };
  }, [value, ten]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) { setOpen(false); setPicking(false); } };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const nhan = value === 'toi' ? 'Tôi' : value === 'tat-ca' ? 'Tất cả trong phạm vi' : (ten ?? '…');

  return (
    <div className="relative inline-flex items-center gap-1" ref={box}>
      <button type="button" className="btn btn-sm" aria-haspopup="menu" aria-expanded={open}
        onClick={() => { setOpen((o) => !o); setPicking(false); }}>
        Người phụ trách: {nhan} ▾
      </button>
      {typeof value === 'number' && (
        <button type="button" className="text-slate-500 hover:text-slate-200 text-xs" aria-label="Bỏ chọn giáo viên, về Tất cả trong phạm vi"
          onClick={() => onChange('tat-ca')}>✕</button>
      )}
      {open && !picking && (
        <div role="menu" className="absolute z-30 top-full mt-1 w-56 surface-2 rounded-lg border shadow-xl py-1" style={{ borderColor: 'var(--line-strong)' }}>
          <button type="button" role="menuitem" className="w-full text-left px-3 py-2 hover:bg-white/5 appearance-none bg-transparent border-0 text-sm text-slate-100"
            onClick={() => { onChange('toi'); setOpen(false); }}>Tôi</button>
          <button type="button" role="menuitem" className="w-full text-left px-3 py-2 hover:bg-white/5 appearance-none bg-transparent border-0 text-sm text-slate-100"
            onClick={() => { onChange('tat-ca'); setOpen(false); }}>Tất cả trong phạm vi</button>
          <button type="button" role="menuitem" className="w-full text-left px-3 py-2 hover:bg-white/5 appearance-none bg-transparent border-0 text-sm text-slate-100"
            onClick={() => setPicking(true)}>Chọn giáo viên…</button>
        </div>
      )}
      {open && picking && (
        <div className="absolute z-30 top-full mt-1 w-72">
          <ChonNguoi
            value={null}
            onChange={(v: NguoiChon | null) => {
              if (v?.kieu === 'tai_khoan') { onChange(v.id, v.ten); setTen(v.ten); }
              setPicking(false); setOpen(false);
            }}
            nhom="giao_vien" choToi={false} choNgoai={false} trongPhamVi
            ariaLabel="Chọn giáo viên"
          />
        </div>
      )}
    </div>
  );
}
