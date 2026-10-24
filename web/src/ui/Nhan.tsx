import type { ReactNode } from 'react';
import { deadlineView, nhanHan, nhanQuaHan, TONE_TRANG_THAI, type DeadlineKind } from '@shared/domain/index.ts';
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
 * BADGE V5 — MỘT KÍCH THƯỚC, BỐN NHÓM KHÁC DÁNG (NEN-V5; `thiet-ke/v5/bang-mau.html` mục 3): cao 22, chữ 12 / 600. Mọi chip chữ lấy lớp từ đây.
 *   1 · KẾT QUẢ HỌC TẬP (`NhanKq`, `CHIP_VUONG`): góc 4 px, viền 1 px màu nghĩa, nền thẻ, ✓ ✗ – đứng đầu.
 *   2 · LỊCH THI (`NhanLich`): nền xanh lơ đặc, góc 2 px, không viền màu kết quả — "Đã thi · chờ KQ" không thể nhầm Đạt.
 *   3 · TIẾN ĐỘ XỬ LÝ (`Nhan`, `CHIP_TRON`): viên tròn nền xám nhạt + chấm màu; sắp hạn / quá hạn: nền nhạt + ⚠.
 *   4 · MỨC SOS (`ChipSos`, `lopSos`): cùng họ viền với kết quả (C23); mức tách bằng độ dày viền + chữ "SOS n".
 * Họ tròn viền trong suốt (tông có viền thì đè); tông viền đứt dùng `!border-current`.
 */
export const CHIP_TRON = 'inline-flex h-[22px] items-center whitespace-nowrap rounded-full border border-transparent px-2 text-xs font-semibold leading-none';
export const CHIP_VUONG = 'inline-flex h-[22px] items-center whitespace-nowrap rounded border px-2 text-xs font-semibold leading-none tabular-nums';

/**
 * DÁNG CHIP SOS — MỘT CHỖ (C23 + P6 chủ SP 22/10): vàng → cam → ĐỎ (không hồng); ba mức khác hẳn, đọc được cả khi không phân biệt màu:
 * SOS 1 viền mảnh trên nền thẻ · SOS 2 viền 2 px + nền cam nhạt · SOS 3 nền đỏ đặc chữ trắng. Tạm = viền đứt (SOS 3 tạm: không nền, viền đứt 2 px).
 * `SCORE_CHIP` (ô kết quả) dùng lại lớp này.
 */
export function lopSos(muc: number, tam?: boolean): string {
  if (muc <= 1) return `bg-[color:var(--surface)] border border-sos1 text-sos1-chu ${tam ? '!border-dashed' : ''}`;
  if (muc === 2) return `border-2 !px-[7px] border-sos2 text-sos2-chu ${tam ? 'bg-[color:var(--surface)] !border-dashed' : 'bg-[color:var(--sos2-nen)]'}`;
  return tam ? 'bg-[color:var(--surface)] border-2 !px-[7px] border-dashed border-sos3 text-sos3-chu'
    : 'border border-[color:var(--sos3-vien)] bg-[color:var(--sos3-nen)] font-bold text-[color:var(--sos3-tren)]';
}
/** Khung chip SOS (cùng họ góc 4 px với kết quả — C23). */
export const CHIP_SOS = 'inline-flex h-[22px] min-w-[30px] shrink-0 items-center justify-center whitespace-nowrap rounded px-2 text-xs font-semibold leading-none tabular-nums';

/** Nhóm 1 — KẾT QUẢ HỌC TẬP: Đạt ✓ · Chưa đạt ✗ · Chưa đủ dữ liệu – (viền đứt). Ký hiệu đứng đầu, không chỉ màu. */
const KQ: Record<'dat' | 'chua-dat' | 'thieu', { lop: string; dau: string }> = {
  dat: { lop: 'text-dat border-dat-line', dau: '✓' },
  'chua-dat': { lop: 'text-bad border-bad-line', dau: '✗' },
  thieu: { lop: 'text-faint border-dashed border-[color:var(--thieu-vien)]', dau: '–' },
};
export function NhanKq({ kq, title, children }: { kq: keyof typeof KQ; title?: string; children: ReactNode }) {
  return <span title={title} className={`${CHIP_VUONG} gap-1 bg-[color:var(--surface)] ${KQ[kq].lop}`}><span aria-hidden>{KQ[kq].dau}</span>{children}</span>;
}

/** Nhóm 2 — TÌNH TRẠNG LỊCH THI: có ngày (nền lơ đặc) · dự kiến (viền lơ) · chưa có lịch (viền xám) · đã thi chờ KQ (nền lơ đặc). */
const LICH: Record<'co' | 'du-kien' | 'chua' | 'da-thi', string> = {
  co: 'bg-[color:var(--lich-nen)] text-[color:var(--lich-chu)]',
  'da-thi': 'bg-[color:var(--lich-nen)] text-[color:var(--lich-chu)]',
  'du-kien': 'bg-transparent text-[color:var(--lich-chu)] shadow-[inset_0_0_0_1px_var(--lich-vien)]',
  chua: 'bg-transparent text-faint shadow-[inset_0_0_0_1px_var(--thieu-vien)]',
};
export function NhanLich({ loai, title, children }: { loai: keyof typeof LICH; title?: string; children: ReactNode }) {
  return <span title={title} className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-[2px] px-2 text-xs font-semibold leading-none tabular-nums ${LICH[loai]}`}>{children}</span>;
}

export type ToneNhan = 'ok' | 'done' | 'bad' | 'late' | 'soon' | 'doing' | 'muted';

/** Nhóm 3 (V5): viên nền xám nhạt + chấm màu đầu (`CHAM`); sắp hạn / quá hạn / lỗi: nền nhạt cùng họ (quá hạn luôn kèm ⚠ thay chấm). */
const CHAM = "gap-1.5 before:h-[7px] before:w-[7px] before:shrink-0 before:rounded-full before:bg-current before:content-['']";
const NHAN: Record<ToneNhan, string> = {
  ok: `bg-[color:var(--surface-2)] text-ok ${CHAM}`, done: `bg-[color:var(--surface-2)] text-dim ${CHAM}`, bad: `bg-bad-bg text-bad ${CHAM}`,
  late: 'gap-1 bg-late-bg text-late', soon: `bg-soon-bg text-soon ${CHAM}`,
  doing: `bg-[color:var(--surface-2)] text-doing ${CHAM}`, muted: `bg-[color:var(--surface-2)] text-dim ${CHAM} before:!bg-slate-600`,
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

/** OV-15a (mockup 1 §1c): hạn ở đầu panel là CHỮ — NEN-PANEL: quá hạn / sắp hạn thành badge theo mockup V5 (`ChipHan`). Quá hạn = chữ cam đậm + ⚠; sắp hạn / hôm nay = chữ vàng; xa hơn = chữ phụ. */
const CHU_HAN = 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[13px] tabular-nums';
/** OV-12e: "⚠ n quá hạn" ở đầu panel số liệu — cùng kiểu chữ hạn quá hạn. */
export function ChipSoQuaHan({ n }: { n: number }) {
  return <span className={`${CHU_HAN} font-semibold text-late`}><span aria-hidden>⚠</span>{t('{n} quá hạn', { n })}</span>;
}
/** MỘT dòng hạn ở đầu panel làm việc v3 (OV-12c) — 3 mức (OV-12e): quá hạn ⚠ + số ngày · còn ≤ 3 ngày (gồm hôm nay) vàng · xa hơn chữ phụ; luôn có chữ.
 *  Ngưỡng ở MỘT chỗ: `deadlineView` (`ganHan`). Chữ hạn = `nhanHan` "hạn 18/09" (NEN-V5 P7: ngày thật, kể cả hôm nay). */
export function ChipHan({ loai, han }: { loai: DeadlineKind; han: string | null }) {
  const { homNay } = useNgayNghiepVu();
  if (!han) return null;
  const v = deadlineView({ kind: loai, due: han, today: homNay });
  /* NEN-PANEL (mockup V5 `v5-nen.css .bd-td.sap / .qua`, thay OV-15a "chỉ chữ"): quá hạn / sắp hạn = badge tiến độ có ⚠; xa hạn giữ chữ phụ. */
  const can = v.tone === 'overdue' || v.ganHan;
  const lop = v.tone === 'overdue' ? 'bg-late-bg font-semibold text-late' : v.ganHan ? 'bg-soon-bg font-semibold text-soon' : 'text-dim';
  return (
    <span title={v.text} className={`${CHU_HAN} ${lop} ${can ? 'h-[22px] rounded-full px-2 text-xs' : ''}`}>
      {can && <span aria-hidden>⚠</span>}
      {v.tone === 'overdue' ? t('Quá hạn {n} ngày', { n: v.daysOverdue ?? 0 }) : <span className="inline-block first-letter:uppercase">{nhanHan(han, homNay)}</span>}
    </span>
  );
}

/** Chip kỹ năng (R · W1 …) — cùng kiểu chip ô nhỏ của khung V5 (`.ky`); hồ sơ GV + Tổng quan GV. */
export const ChipKy = ({ k }: { k: string }) => (
  <span className="inline-flex h-5 min-w-6 items-center justify-center rounded bg-[color:var(--accent-soft)] px-1.5 text-xs font-bold tabular-nums text-[color:var(--accent)]">{k}</span>
);
