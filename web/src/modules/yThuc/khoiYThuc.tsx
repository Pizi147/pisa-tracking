import type { ReactNode } from 'react';
import { t } from '@shared/i18n/index.ts';
import { ChipHan, lopBadgeHan } from '../../ui/Nhan.tsx';
import type { YThucHocVien } from './kieu.ts';

/**
 * KHỐI Ý THỨC DÙNG CHUNG (mockup `thiet-ke/audit-0311/u10-y-thuc.html`, chủ SP duyệt 03/11) — tab Ý thức hồ sơ HV (UI-3) và hồ sơ lớp (UI-2)
 * dùng CÙNG thành phần (chủ SP 03/11: hai tab đồng bộ — cùng badge, cùng chữ, cùng thao tác; chỉ khác phạm vi một em / cả lớp).
 */

/** Thẻ meta nhỏ (mockup `.tag.nhat`) thay chuỗi "a · b · c". */
export const TAG = 'inline-flex h-[22px] items-center whitespace-nowrap rounded-md px-2 text-xs font-semibold text-slate-400 surface-2';

/** Badge việc: khung + chấm theo trạng thái + chữ (mockup `.bv`; chủ SP 03/11 U04). Quá hạn chấm đỏ (V22: không biểu tượng), xong ✓; Chưa xem = viền chấm. */
export type TongBv = 'cho' | 'qua' | 'dang' | 'xong' | 'xem' | 'xam';
const LOP_BV: Record<TongBv, string> = {
  cho: 'border-soon-line bg-soon-bg text-soon',
  qua: '',   // BADGE-QUA-HAN XM-1: dáng `lopBadgeHan('qua')`
  dang: 'border-[color:var(--accent)] text-doing',
  xong: 'border-ok-line text-ok',
  xem: 'border-dashed border-[color:var(--accent)] text-doing',
  xam: 'border-[color:var(--line-strong)] text-slate-500',
};
export function BadgeViec({ tong, children, onClick, title, xuong = false, duong }: { tong: TongBv; children: ReactNode; onClick?: () => void; title?: string;
  /** Y-THUC-V2: chữ dài (tên bậc + ngày) được xuống dòng trong cột hẹp thay vì tràn sang cột bên. */
  xuong?: boolean;
  /** GD-19 (mockup ⑪ K7a): "Không xử lý" — viên viền ĐỨT (việc đã xong, không phải đã xử lý). */
  duong?: 'dut' }) {
  /* Badge bấm được (Báo PH, đề xuất): `title` cũng là tên truy cập — nói việc sẽ mở, không chỉ trạng thái. */
  /* V22 (PTA rà #1649): badge báo hạn / việc chờ (`qua` quá hạn, `cho` chờ · hạn) chỉ màu — không chấm; xong ✓; trạng thái khác giữ chấm. */
  const dau = tong === 'qua' || tong === 'cho' ? null
    : tong === 'xong' ? <span aria-hidden className="text-xs">✓</span>
    : <span aria-hidden className="h-[7px] w-[7px] shrink-0 rounded-full bg-current" />;
  const lop = tong === 'qua'
    ? `${lopBadgeHan('qua')} max-w-full ${xuong ? '!h-auto min-h-[22px] !whitespace-normal rounded-[11px] py-[3px] text-left !leading-snug' : ''}`
    : `inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 text-xs font-semibold ${xuong ? 'min-h-6 py-[3px] text-left leading-snug' : 'h-6 whitespace-nowrap'} ${LOP_BV[tong]}${duong === 'dut' ? ' border-dashed' : ''}`;
  if (onClick) return <button type="button" title={title} className={`${lop} cursor-pointer appearance-none hover:brightness-110 max-sm:min-h-[44px]`} onClick={onClick}>{title && <span className="sr-only">{title}: </span>}{dau}{children} <span aria-hidden>›</span></button>;
  return <span title={title} className={lop}>{dau}{children}</span>;
}

type TomTatVao = Pick<YThucHocVien, 'nhom' | 'han' | 'hanXem' | 'quaHanNgay'> & { deXuat: Pick<NonNullable<YThucHocVien['deXuat']>, 'id' | 'nhan' | 'status' | 'han'> | null };

/** Ô "Cần làm" của một em: chỉ ngày hạn tô màu (+ badge đề xuất / chưa xem khi có). `homNay`, `hanDuoi` giữ cho chỗ gọi cũ. */
export function CanLamEm({ x, onXem, laQl = false }: {
  x: TomTatVao; homNay?: string; onXem?: (id: number) => void; hanDuoi?: boolean;
  /** K4: người duyệt thấy "Đề xuất" (việc của mình), người gửi thấy "Chờ QL duyệt". */
  laQl?: boolean;
}) {
  /* NH4 (chủ SP 24/11): hạn chỉ là NGÀY dd/mm/yyyy tô màu chữ — không badge nền, không "Quá hạn n ngày" / "Phải xử lý" / "còn n ngày". */
  const hanChu = (h: string | null) => h ? <ChipHan loai="xu-ly-vi-pham" han={h} /> : <span className="text-slate-500">—</span>;
  const o = (bv: ReactNode) => <span className="flex flex-col items-start gap-1.5">{bv}</span>;
  if (x.deXuat) {
    const dx = x.deXuat;
    return o(<><BadgeViec tong="dang" title={onXem ? t('Xem lần xử lý') : undefined} onClick={onXem ? () => onXem(dx.id) : undefined}>{dx.status === 'da_duyet' ? t('Head đã duyệt') : laQl ? t('Đề xuất') : t('Chờ Head duyệt')}</BadgeViec>{dx.han && <ChipHan loai="duyet" han={dx.han} />}</>);
  }
  switch (x.nhom) {
    case 'qua_han': return o(hanChu(x.han ?? x.hanXem));
    case 'bat_buoc': return o(hanChu(x.han));
    case 'moi': return o(<><BadgeViec tong="xem">{t('Chưa xem')}</BadgeViec>{x.hanXem && <ChipHan loai="xu-ly-vi-pham" han={x.hanXem} />}</>);
    default: return <span className="text-slate-500">—</span>;
  }
}

/** Chip lọc Lịch sử (mockup `.lua`): mỗi mục một nút viền riêng, có số; mục chọn viền nhấn + nền nhấn nhạt. */
export function ChipLoc<K extends string>({ muc, value, onChange, ariaLabel }: { muc: { key: K; nhan: string; so: number }[]; value: K; onChange: (k: K) => void; ariaLabel: string }) {
  return (
    <div role="group" data-khong-che="" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {muc.map((m) => {
        const chon = m.key === value;
        return (
          <button key={m.key} type="button" aria-pressed={chon} onClick={() => onChange(m.key)}
            className={`inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-lg border px-3 text-sm max-sm:h-11 ${chon
              ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] font-bold text-[color:var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]'
              : 'border-[color:var(--o-nhap-vien)] bg-[color:var(--o-nhap-nen)] font-medium text-slate-100'}`}>
            {m.nhan} <span className="tabular-nums">{m.so}</span>
          </button>
        );
      })}
    </div>
  );
}

