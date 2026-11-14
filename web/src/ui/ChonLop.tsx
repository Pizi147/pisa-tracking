import { useState } from 'react';
import { ChonNguoi } from './PeoplePicker.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * Một lớp trong ô: `ma` = mã lớp, `phu` = dòng phụ (`phuLopDich`: chương trình · chi nhánh · sĩ số); `tat` = lý do không chọn được (dòng mờ, lý do bên phải);
 * `nhom` (GD-5) = nhãn nhóm "liên quan trước" ("Cùng chi nhánh MB", "Đã kết thúc") — lớp cùng nhóm phải liền nhau, nơi gọi xếp sẵn.
 */
export type LopChon = { id: number; ma: string; phu?: string; tat?: string; nhom?: string };

/**
 * Ô chọn lớp dùng chung (P4, R6.3b; GD-5 mockup ⑤ A): gõ → tìm không dấu → danh sách có nhóm → chọn, như ô chọn người (`ChonNguoi ds`).
 * Chưa chọn → ô gõ (hoặc `macDinhTrong` "Mọi lớp ▾" ở ô lọc); đã chọn → "mã · dòng phụ" + ✕ (bỏ chọn). Danh sách do nơi gọi truyền
 * (giữ lọc chi nhánh / quyền / chương trình của nơi đó — không gọi máy chủ). `maCu`: lớp đang chọn không còn trong `ds` (lớp đã kết thúc) → vẫn hiện mã cũ.
 * Ô "thêm lớp" (value luôn null, nơi gọi thêm vào danh sách chip): sau mỗi lần chọn, ô gõ trống lại và mở tiếp danh sách.
 * `gon`: ô lọc cao 36 trong hàng lọc (thay `<select>` "Mọi lớp").
 */
export function ChonLop({ ds, value, onChange, ariaLabel, choTrong, tat, khongKhop, placeholder, maCu, id, invalid: invalidP, 'aria-invalid': ariaInvalid, onBlur, className, moLopMoi, ghiChuDs, gon, macDinhTrong }: {
  ds: LopChon[]; value: number | null; onChange: (id: number | null) => void; ariaLabel: string;
  choTrong?: string; tat?: boolean;
  /** Chữ khi danh sách rỗng (không có lớp nào để chọn). */
  khongKhop?: string;
  placeholder?: string; maCu?: string;
  /** Như `<select>` cũ dưới `useLoiForm` (`{...lf.o(loi, khoa)}` gắn thẳng được): id cho nhãn / "n ô cần sửa ↑", viền lỗi, rời ô. */
  id?: string; invalid?: boolean; 'aria-invalid'?: boolean; onBlur?: () => void; className?: string;
  /** P9b (R5.1): dòng "+ Mở lớp mới…" cuối danh sách — nơi gọi mở hộp tạo lớp tại chỗ, xong thì tự chọn lớp mới (giữ lựa chọn đang có). */
  moLopMoi?: () => void;
  /** Chữ nhỏ dưới "+ Mở lớp mới…" (mockup V6: "Chỉ lớp chi nhánh MB"). */
  ghiChuDs?: string;
  gon?: boolean;
  /** Ô lọc: chữ khi chưa chọn ("Mọi lớp") — ô đóng, bấm mới mở ô gõ. */
  macDinhTrong?: string;
}) {
  const invalid = invalidP || ariaInvalid;
  const chon = value === null ? null : ds.find((l) => l.id === value) ?? null;
  /* Bỏ chọn bằng ✕ / vừa thêm một lớp → ô gõ vẽ lại, focus + mở danh sách (không rơi focus về <body>). */
  const [lan, setLan] = useState(0);
  if (value !== null) {
    const ma = chon?.ma ?? maCu ?? '—';
    return (
      /* Mockup ⑤ A3 "đã chọn · focus": mã đậm · dòng phụ + ✕ (bỏ chọn). */
      <div className={`oc${gon ? ' gon dang' : ''}${invalid ? ' loi' : ''}${tat ? ' oc-tat' : ''} ${className ?? ''}`} onBlur={onBlur}>
        <span className="da"><b>{ma}</b>{chon?.phu && <small>{chon.phu}</small>}</span>
        {!tat && <button id={id} type="button" className="oc-bo"
          aria-label={t('Bỏ chọn {ma} · {o}', { ma, o: ariaLabel })} onClick={() => { setLan((n) => n + (macDinhTrong === undefined ? 1 : 0)); onChange(null); }}>✕</button>}
      </div>
    );
  }
  if (!ds.length && !moLopMoi) {
    return <div id={id} tabIndex={-1} className={`oc oc-tat${gon ? ' gon' : ''}${invalid ? ' loi' : ''} ${className ?? ''}`} title={ariaLabel}><span className="oc-goi">{khongKhop ?? t('Không có lớp để chọn')}</span></div>;
  }
  return (
    <div className={className ?? ''}>
      <ChonNguoi key={lan} value={null} nhom="nhan_vien" choToi={false} choNgoai={false} gon={gon} macDinhTrong={macDinhTrong}
        ds={ds.map((l) => ({ id: l.id, ten: l.ma, phu: l.phu, tat: l.tat, nhom: l.nhom }))}
        placeholder={placeholder ?? t('Gõ mã lớp…')} ariaLabel={ariaLabel} disabled={tat} tuMo={lan > 0} choTrong={choTrong}
        id={id} invalid={invalid} onBlur={onBlur} khongKhop={(q) => (q ? t('Không có lớp khớp “{q}”', { q }) : khongKhop ?? t('Không có lớp để chọn'))}
        them={moLopMoi ? { nhan: t('+ Mở lớp mới…'), onChon: moLopMoi, phu: ghiChuDs } : undefined}
        onChange={(v) => { if (v === null) onChange(null); else if (v.kieu === 'tai_khoan') { setLan((n) => n + (macDinhTrong === undefined ? 1 : 0)); onChange(v.id); } }} />
    </div>
  );
}
ChonLop.tuNhan = true;

/** GD-5 (mockup ⑤ A5, R5.2 #54 #44): xếp "Lớp của tôi" lên trước, còn lại "Lớp khác" — chỉ gắn nhãn khi có cả hai nhóm (một nhóm thì danh sách phẳng). */
export function nhomLopToi(ds: LopChon[], lopToi: ReadonlySet<number>, nhan = { toi: t('Lớp của tôi'), khac: t('Lớp khác') }): LopChon[] {
  const toi = ds.filter((l) => lopToi.has(l.id)), khac = ds.filter((l) => !lopToi.has(l.id));
  if (!toi.length || !khac.length) return ds;
  return [...toi.map((l) => ({ ...l, nhom: nhan.toi })), ...khac.map((l) => ({ ...l, nhom: nhan.khac }))];
}
