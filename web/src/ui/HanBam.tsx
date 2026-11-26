import { forwardRef, type ReactNode } from 'react';
import { t } from '@shared/i18n/index.ts';

/**
 * NGÀY HẠN BẤM ĐƯỢC (chủ SP 26/11: bỏ nút "Sửa hạn" / "Gia hạn", bấm thẳng vào hạn để sửa; MỘT kiểu ô viền `.o-bam.han` (mockup v27, cùng ô Phụ trách của TUYEN-1) — mọi nơi
 * có hạn sửa được dùng ô này). Màu chữ lấy của chỗ đặt (kế thừa). Chỉ vẽ khi người xem có quyền (cờ máy chủ); không có quyền → nơi gọi vẽ ngày trơn.
 * `ten` = chữ ngày đọc cho trình đọc màn hình ("Sửa hạn 12/11/2026").
 */
export const HanBam = forwardRef<HTMLButtonElement, { ten: string; onClick: () => void; children: ReactNode; className?: string }>(
  function HanBam({ ten, onClick, children, className = '' }, ref) {
    return (
      <button ref={ref} type="button" aria-label={t('Sửa hạn {ngay}', { ngay: ten })} title={t('Sửa hạn')} onClick={onClick}
        className={`o-bam han touch-manipulation max-sm:min-h-[44px] ${className}`}>
        {children}
      </button>
    );
  },
);
