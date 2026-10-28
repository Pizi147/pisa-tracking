import type { TrangThaiVp } from '@shared/domain/index.ts';
import { CHIP_VUONG } from '../../ui/Nhan.tsx';
import { t } from '@shared/i18n/index.ts';

/** Dấu tích mảnh 12 px, nét 1.5 — không dùng ký tự ✓ (Inter cỡ nhỏ vẽ thành chấm, memory "bẫy ký tự nhỏ"). */
export function DauTich({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" className={`inline-block shrink-0 ${className}`}
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.4 4.9 8.8 9.5 3.5" />
    </svg>
  );
}

/** Mũi tên mở/gập 12 px nét 1.5 — phải khi gập, xuống khi mở. */
export function MuiTenGap({ mo }: { mo: boolean }) {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" className={`inline-block shrink-0 transition-transform motion-reduce:transition-none ${mo ? 'rotate-90' : ''}`}
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 2.5 8 6l-3.5 3.5" />
    </svg>
  );
}

/** Kiểu hiển thị theo bảng §5.4 — cùng khuôn chữ với `NhanTrangThai` (bo 6 px, 11.5 px đậm vừa, số thẳng cột). */
const LOP: Record<TrangThaiVp, string> = {
  moi: 'border-[color:var(--line-strong)] text-slate-200',
  da_ghi_nhan: 'border-transparent px-0 text-slate-400 font-medium',
  can_xu_ly: 'border-soon-line bg-soon-bg text-soon',
  qua_han: 'border-late-line bg-late-bg text-late',
  cho_duyet: 'border-muted-line bg-muted-bg text-muted',
  da_xu_ly: 'border-transparent bg-white/[.08] text-slate-200',
};

/**
 * NHÃN MỘT VI PHẠM (PR-YT4, đặc tả §5.4) — đúng MỘT nhãn: Mới · Đã ghi nhận · Cần xử lý · Quá hạn n ngày · Chờ QL duyệt (hoặc
 * "Đã duyệt · chờ thực hiện") · Đã xử lý · {bậc}. `nhan` đến từ máy chủ (một hàm trạng thái) — không tự dựng chữ ở đây.
 * Đã ghi nhận chỉ ghi "Đã ghi nhận" (chủ sản phẩm 02/10 — bỏ "· vẫn tính").
 */
export function NhanViPham({ t: tt, nhan, title }: { t: TrangThaiVp; nhan: string; title?: string }) {
  const chu = tt === 'da_ghi_nhan' ? t('Đã ghi nhận') : nhan;
  return (
    <span title={title ?? (tt === 'da_ghi_nhan' ? t('GVCN đã xem, không cần xử lý') : undefined)}
      className={`${CHIP_VUONG} gap-1 ${LOP[tt]}`}>
      {tt === 'da_ghi_nhan' && <DauTich />}
      {chu}
    </span>
  );
}
