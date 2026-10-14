import type { ReactNode } from 'react';
import { deadlineView, nhanQuaHan, shortDate, TONE_TRANG_THAI, type DeadlineKind } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
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

export type ToneNhan = 'ok' | 'done' | 'bad' | 'late' | 'soon' | 'doing' | 'wait' | 'muted';

const NHAN: Record<ToneNhan, string> = {
  ok: 'bg-ok-bg text-ok', done: 'bg-done-bg text-done', bad: 'bg-bad-bg text-bad', late: 'bg-late-bg text-late', soon: 'bg-soon-bg text-soon',
  doing: 'bg-doing-bg text-doing', wait: 'bg-wait-bg text-wait', muted: 'bg-muted-bg text-muted',
};

/** Bảng trạng thái → tone ở shared (PR-GVb U01) — re-export để chỗ gọi cũ (`KhoiNo`) không đổi import. */
export { TONE_TRANG_THAI };

/**
 * MỘT BADGE = MỘT TRẠNG THÁI NGẮN (≤ 3 từ + số; B-1). Xanh dương = đang chạy · tím = chờ (`TONE_TRANG_THAI`) · vàng = cần chú ý ·
 * xám = chưa bắt đầu, thông tin · xanh lá = ổn · đỏ = chỉ SOS 3 và "Chưa đạt" · đỏ cam = quá hạn (luôn kèm ⚠) · viền đứt (`dut`) = số tạm.
 * Có `onClick` thì là nút (≥ 28px cao; điện thoại nới vùng bấm ẩn lên 44px — PR-HK1 K3); không thì chỉ là chữ.
 */
export function Nhan({ tone, dut, title, onClick, children }: {
  tone: ToneNhan; dut?: boolean; title?: string; onClick?: () => void; children: ReactNode;
}) {
  const cls = `${CHIP_TRON} ${NHAN[tone]} ${dut ? 'bg-transparent border-dashed !border-current' : ''}`;
  if (onClick) {
    return (
      <button type="button" title={title} onClick={onClick} className={`${cls} relative min-h-[28px] hover:brightness-125 max-sm:after:absolute max-sm:after:-inset-y-2 max-sm:after:inset-x-0 max-sm:after:content-['']`}>{children}</button>
    );
  }
  return <span title={title} className={cls}>{children}</span>;
}

/** Tone của luật badge hộp lớp (`badgeLop`) → tone `Nhan`: đỏ · vàng · xanh dương · tím (chờ) · xám. */
export function toneNhanTuBadge(t: 'danger' | 'warn' | 'info' | 'wait' | 'muted'): ToneNhan {
  return t === 'danger' ? 'bad' : t === 'warn' ? 'soon' : t === 'info' ? 'doing' : t === 'wait' ? TONE_TRANG_THAI['cho-duyet'] : 'muted';
}

/**
 * DẤU "DƯỚI KỲ VỌNG / CHƯA ĐẠT" cạnh một con số (PR-N1 A3, chủ sản phẩm 28/09 "cho rõ hơn"): tam giác chỉ xuống 7×5px, cùng màu chữ.
 * Vẽ SVG thay ký tự ▾ — ở cỡ chữ nhỏ ▾ của Inter chỉ còn như một dấu chấm. Không chỉ dựa vào màu: người mù màu vẫn thấy.
 */
export function DauDuoi() {
  return (
    <svg aria-hidden viewBox="0 0 7 5" width="7" height="5" className="mr-1 inline-block align-middle" style={{ marginTop: -2 }}>
      <path d="M0 0h7L3.5 5z" fill="currentColor" />
    </svg>
  );
}

const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
/** OV-12c — MỘT chip hạn ở đầu panel làm việc v3: quá hạn nền cam + ⚠ + số ngày · hạn hôm nay vàng · còn lại viền xám. Màu theo `deadlineView`. */
export function ChipHan({ loai, han }: { loai: DeadlineKind; han: string | null }) {
  const { homNay } = useNgayNghiepVu();
  if (!han) return null;
  const v = deadlineView({ kind: loai, due: han, today: homNay });
  const lop = v.tone === 'overdue' ? 'border-late-line bg-late-bg text-late' : v.homNay ? 'border-soon-line bg-soon-bg text-soon' : 'border-[color:var(--line-strong)] text-slate-200';
  return (
    <span title={v.text} className={`inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 text-[12.5px] font-bold tabular-nums ${lop}`}>
      {v.tone === 'overdue' ? <><span aria-hidden>⚠</span>{t('Quá hạn {n} ngày', { n: v.daysOverdue ?? 0 })}</> : v.homNay ? t('Hạn hôm nay')
        : t('Hạn {thu} {ngay}', { thu: THU[new Date(`${han.slice(0, 10)}T00:00:00Z`).getUTCDay()], ngay: shortDate(han, homNay) })}
    </span>
  );
}
