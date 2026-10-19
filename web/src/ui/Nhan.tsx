import type { ReactNode } from 'react';
import { deadlineView, nhanQuaHan, shortDate, TONE_TRANG_THAI, type DeadlineKind } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { IconKhong } from './BieuTuong.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * "⚠ quá hạn 15 ngày" — chữ đỏ cam đậm, KHÔNG nền, KHÔNG khung (B-3). ⚠ chỉ nghĩa quá hạn (G-4).
 * `gon` bỏ chữ "quá hạn" ("⚠ 15 ngày") cho chỗ đã có tiêu đề nói rõ.
 */
export function QuaHan({ ngay, gon }: { ngay: number | null; gon?: boolean }) {
  return <span className="whitespace-nowrap font-bold text-late">⚠ {nhanQuaHan(ngay, gon)}</span>;
}

/**
 * HAI HỌ CHIP, MỘT CỠ (PR-HK2, Q-H 02/10): 11,5 px, cao 20 px (dòng 18 + viền 1). Mọi chip chữ đều lấy lớp từ đây — thêm tông màu, không đổi dáng.
 * `CHIP_TRON` = trạng thái học viên / lớp + số đếm (menu, tab, nhóm). `CHIP_VUONG` = trạng thái việc, kết quả, "Thiếu n", nhãn xám.
 * Họ tròn viền trong suốt (tông có viền thì đè); tông viền đứt dùng `!border-current`.
 */
export const CHIP_TRON = 'inline-flex items-center whitespace-nowrap rounded-full border border-transparent px-[7px] text-[11.5px] font-bold leading-[18px]';
export const CHIP_VUONG = 'inline-flex items-center whitespace-nowrap rounded-md border px-1.5 text-[11.5px] font-semibold leading-[18px] tabular-nums';

export type ToneNhan = 'ok' | 'done' | 'bad' | 'late' | 'soon' | 'doing' | 'muted';

const NHAN: Record<ToneNhan, string> = {
  /* OV-15a: `late` (quá hạn) chỉ là chữ cam + ⚠ — không nền, không chip. */
  ok: 'bg-ok-bg text-ok', done: 'bg-done-bg text-done', bad: 'bg-bad-bg text-bad', late: 'bg-transparent !px-0 text-late', soon: 'bg-soon-bg text-soon',
  doing: 'bg-doing-bg text-doing', muted: 'bg-muted-bg text-muted',
};

/** Bảng trạng thái → tone ở shared (PR-GVb U01) — re-export để chỗ gọi cũ (`KhoiNo`) không đổi import. */
export { TONE_TRANG_THAI };

/**
 * MỘT BADGE = MỘT TRẠNG THÁI NGẮN (≤ 3 từ + số; B-1). Xanh dương = đang chạy · xám = chờ (`TONE_TRANG_THAI`, OV-15a bỏ tím) · vàng = cần chú ý ·
 * xám = chưa bắt đầu, thông tin · xanh lá = ổn · đỏ = chỉ SOS 3 và "Chưa đạt" · đỏ cam = quá hạn (luôn kèm ⚠) · viền đứt (`dut`) = số tạm.
 * Có `onClick` thì là nút (≥ 28px cao; điện thoại nới vùng bấm ẩn lên 44px — PR-HK1 K3); không thì chỉ là chữ.
 */
export function Nhan({ tone, dut, title, onClick, children }: {
  tone: ToneNhan; dut?: boolean; title?: string; onClick?: () => void; children: ReactNode;
}) {
  const cls = `${CHIP_TRON} ${NHAN[tone]} ${dut ? 'bg-transparent border-dashed !border-current' : ''}`;
  if (tone === 'late' && !coCanhBao(children)) children = <>⚠ {children}</>;   // quá hạn luôn kèm ⚠
  if (onClick) {
    return (
      <button type="button" title={title} onClick={onClick} className={`${cls} relative min-h-[28px] hover:brightness-125 max-sm:after:absolute max-sm:after:-inset-y-2 max-sm:after:inset-x-0 max-sm:after:content-['']`}>{children}</button>
    );
  }
  return <span title={title} className={cls}>{children}</span>;
}

/** Đã có ⚠ ở đầu nội dung (chỗ gọi tự ghi "⚠ n quá hạn") — không thêm lần nữa. */
function coCanhBao(c: ReactNode): boolean {
  return Array.isArray(c) ? c.some((x) => typeof x === 'string' && x.includes('⚠')) : typeof c === 'string' && c.includes('⚠');
}

/** Badge hộp lớp → tone `Nhan`; "n việc quá hạn" là chữ cam + ⚠ (OV-15a), không chip đỏ. */
export function toneBadgeLop(x: { key: string; tone: 'danger' | 'warn' | 'info' | 'wait' | 'muted' }): ToneNhan {
  return x.key === 'qua-han' ? 'late' : toneNhanTuBadge(x.tone);
}

/** Tone của luật badge hộp lớp (`badgeLop`) → tone `Nhan`: đỏ · vàng · xanh dương · xám (chờ, OV-15a). */
export function toneNhanTuBadge(t: 'danger' | 'warn' | 'info' | 'wait' | 'muted'): ToneNhan {
  return t === 'danger' ? 'bad' : t === 'warn' ? 'soon' : t === 'info' ? 'doing' : 'muted';
}

/**
 * DẤU "DƯỚI KỲ VỌNG / CHƯA ĐẠT" cạnh một con số — OV-15a (C05): ✗ trơn SVG (không ▾, không vòng tròn), cùng màu chữ. Không chỉ dựa vào màu.
 */
export function DauDuoi() {
  return <span className="mr-1 inline-flex align-middle" style={{ marginTop: -2 }}><IconKhong size={11} /></span>;
}

/** OV-15a (mockup 1 §1c): hạn ở đầu panel là CHỮ — không nền, không viền, không chip. Quá hạn = chữ cam đậm + ⚠; sắp hạn / hôm nay = chữ vàng; xa hơn = chữ phụ. */
const CHU_HAN = 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[13px] tabular-nums';
/** OV-12e: "⚠ n quá hạn" ở đầu panel số liệu — cùng kiểu chữ hạn quá hạn. */
export function ChipSoQuaHan({ n }: { n: number }) {
  return <span className={`${CHU_HAN} font-semibold text-late`}><span aria-hidden>⚠</span>{t('{n} quá hạn', { n })}</span>;
}
/** MỘT dòng hạn ở đầu panel làm việc v3 (OV-12c) — 3 mức (OV-12e): quá hạn ⚠ + số ngày · còn ≤ 3 ngày vàng · xa hơn chữ phụ; luôn có chữ, không chỉ màu.
 *  Ngưỡng ở MỘT chỗ: `deadlineView` (`ganHan`). Hạn chỉ ghi ngày ("hạn 18/09", OV-15a). */
export function ChipHan({ loai, han }: { loai: DeadlineKind; han: string | null }) {
  const { homNay } = useNgayNghiepVu();
  if (!han) return null;
  const v = deadlineView({ kind: loai, due: han, today: homNay });
  const lop = v.tone === 'overdue' ? 'font-semibold text-late' : v.ganHan ? 'font-semibold text-soon' : 'text-dim';
  return (
    <span title={v.text} className={`${CHU_HAN} ${lop}`}>
      {v.tone === 'overdue' ? <><span aria-hidden>⚠</span>{t('Quá hạn {n} ngày', { n: v.daysOverdue ?? 0 })}</> : v.homNay ? t('Hạn hôm nay')
        : t('hạn {ngan}', { ngan: shortDate(han, homNay) })}
    </span>
  );
}
