import { useState } from 'react';
import { ChonNguoi } from './PeoplePicker.tsx';
import { t } from '@shared/i18n/index.ts';

/** Một lớp trong ô: `ma` = mã lớp, `phu` = dòng phụ (`phuLopDich`: chương trình · chi nhánh · sĩ số). */
export type LopChon = { id: number; ma: string; phu?: string };

/**
 * Ô chọn lớp dùng chung (P4, R6.3b): gõ → tìm không dấu → danh sách → chọn, như ô chọn người (`ChonNguoi ds`).
 * Chưa chọn → ô gõ; đã chọn → "mã · dòng phụ" + ✕. Danh sách do nơi gọi truyền (giữ lọc chi nhánh / quyền / chương trình của nơi đó).
 * `maCu`: lớp đang chọn không còn trong `ds` (lớp đã kết thúc) → vẫn hiện mã cũ, không tự đổi lớp.
 * Ô "thêm lớp" (value luôn null, nơi gọi thêm vào danh sách chip): sau mỗi lần chọn, ô gõ trống lại và mở tiếp danh sách.
 */
export function ChonLop({ ds, value, onChange, ariaLabel, choTrong, tat, khongKhop, placeholder, maCu, noi, id, invalid: invalidP, 'aria-invalid': ariaInvalid, onBlur, className, moLopMoi, ghiChuDs }: {
  ds: LopChon[]; value: number | null; onChange: (id: number | null) => void; ariaLabel: string;
  choTrong?: string; tat?: boolean;
  /** Chữ khi danh sách rỗng (không có lớp nào để chọn). */
  khongKhop?: string;
  placeholder?: string; maCu?: string;
  /** Danh sách nổi trên nội dung (ô "Thêm lớp" nằm trong dòng chip — không đẩy chip xuống). */
  noi?: boolean;
  /** Như `<select>` cũ dưới `useLoiForm` (`{...lf.o(loi, khoa)}` gắn thẳng được): id cho nhãn / "n ô cần sửa ↑", viền lỗi, rời ô. */
  id?: string; invalid?: boolean; 'aria-invalid'?: boolean; onBlur?: () => void; className?: string;
  /** P9b (R5.1): dòng "+ Mở lớp mới…" cuối danh sách — nơi gọi mở hộp tạo lớp tại chỗ, xong thì tự chọn lớp mới (giữ lựa chọn đang có). */
  moLopMoi?: () => void;
  /** Chữ nhỏ dưới "+ Mở lớp mới…" (mockup V6: "Chỉ lớp chi nhánh MB"). */
  ghiChuDs?: string;
}) {
  const invalid = invalidP || ariaInvalid;
  const chon = value === null ? null : ds.find((l) => l.id === value) ?? null;
  /* Bỏ chọn bằng ✕ / vừa thêm một lớp → ô gõ vẽ lại, focus + mở danh sách (không rơi focus về <body>). */
  const [lan, setLan] = useState(0);
  if (value !== null) {
    const ma = chon?.ma ?? maCu ?? '—';
    return (
      <div className={`field flex items-center justify-between gap-2${invalid ? ' border-late' : ''} ${className ?? ''}`} onBlur={onBlur}>
        <span className="min-w-0 truncate"><span className="text-slate-100">{ma}</span>{chon?.phu && <span className="text-xs text-slate-500"> · {chon.phu}</span>}</span>
        {!tat && <button id={id} type="button" className="btn btn-sm btn-ghost -my-1 h-7 shrink-0 justify-center !py-0 max-sm:-my-2 max-sm:h-11 max-sm:min-h-0 max-sm:w-11"
          aria-label={t('Bỏ chọn {ma} · {o}', { ma, o: ariaLabel })} onClick={() => { setLan((n) => n + 1); onChange(null); }}>✕</button>}
      </div>
    );
  }
  if (!ds.length && !moLopMoi) {
    return <div id={id} tabIndex={-1} className={`field text-sm text-slate-500${invalid ? ' border-late' : ''} ${className ?? ''}`} title={ariaLabel}>{khongKhop ?? t('Không có lớp để chọn')}</div>;
  }
  return (
    <div className={`${noi ? 'relative [&_[role=listbox]]:absolute [&_[role=listbox]]:inset-x-0 [&_[role=listbox]]:z-30 [&_[role=listbox]]:shadow-lg ' : ''}${className ?? ''}`}>
      <ChonNguoi key={lan} value={null} nhom="nhan_vien" choToi={false} choNgoai={false} ds={ds.map((l) => ({ id: l.id, ten: l.ma, phu: l.phu }))}
        placeholder={placeholder ?? t('Gõ tên lớp…')} ariaLabel={ariaLabel} disabled={tat} tuMo={lan > 0} choTrong={choTrong}
        id={id} invalid={invalid} onBlur={onBlur} khongKhop={(q) => t('Không có lớp khớp “{q}”', { q })}
        them={moLopMoi ? { nhan: t('+ Mở lớp mới…'), onChon: moLopMoi, phu: ghiChuDs } : undefined}
        onChange={(v) => { if (v === null) onChange(null); else if (v.kieu === 'tai_khoan') { setLan((n) => n + 1); onChange(v.id); } }} />
    </div>
  );
}
ChonLop.tuNhan = true;
