import type { ReactNode } from 'react';
import { nhanQuaHan, TONE_TRANG_THAI } from '@shared/domain/index.ts';

/**
 * "⚠ quá hạn 15 ngày" — chữ đỏ cam đậm, KHÔNG nền, KHÔNG khung (B-3). ⚠ chỉ nghĩa quá hạn (G-4).
 * `gon` bỏ chữ "quá hạn" ("⚠ 15 ngày") cho chỗ đã có tiêu đề nói rõ.
 */
export function QuaHan({ ngay, gon }: { ngay: number | null; gon?: boolean }) {
  return <span className="whitespace-nowrap font-bold text-late">⚠ {nhanQuaHan(ngay, gon)}</span>;
}

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
  const cls = `inline-flex items-center rounded-full px-[7px] text-[11.5px] font-bold leading-[18px] whitespace-nowrap ${NHAN[tone]} ${
    dut ? 'bg-transparent border border-dashed border-current' : ''}`;
  if (onClick) {
    return (
      <button type="button" title={title} onClick={onClick} className={`${cls} relative min-h-[28px] hover:brightness-125 max-sm:after:absolute max-sm:after:-inset-y-2 max-sm:after:inset-x-0 max-sm:after:content-['']`}>{children}</button>
    );
  }
  return <span title={title} className={cls}>{children}</span>;
}

/**
 * NHÃN "lịch sử" cạnh "MT2" (PR-MT, T34): viền mảnh, chữ xám 11.5px, KHÔNG màu nghĩa, KHÔNG ⚠ — MT lịch sử không phải việc trễ.
 * `whitespace-nowrap` để không tách dòng khỏi "MT2" trên điện thoại.
 */
export function ChipLichSu() {
  return (
    <span title="MT lịch sử — tuần thi đã qua trước khi lượt này được tạo; nhập bù, không tính hạn"
      className="inline-flex items-center whitespace-nowrap rounded border border-muted-line px-[5px] align-middle text-[11.5px] font-normal leading-4 text-muted">
      lịch sử
    </span>
  );
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
