import { forwardRef, type ReactNode } from 'react';
import { t } from '@shared/i18n/index.ts';

/**
 * NGÀY HẠN BẤM ĐƯỢC (chủ SP 26/11: bỏ nút "Sửa hạn" / "Gia hạn", bấm thẳng vào hạn để sửa; MỘT kiểu ô viền như mockup v27 `.o-bam.han` — mọi nơi
 * có hạn sửa được dùng ô này). Màu chữ lấy của chỗ đặt (kế thừa). Chỉ vẽ khi người xem có quyền (cờ máy chủ); không có quyền → nơi gọi vẽ ngày trơn.
 * `ten` = chữ ngày đọc cho trình đọc màn hình ("Sửa hạn 12/11/2026").
 */
export const HanBam = forwardRef<HTMLButtonElement, { ten: string; onClick: () => void; children: ReactNode; className?: string }>(
  function HanBam({ ten, onClick, children, className = '' }, ref) {
    return (
      <button ref={ref} type="button" aria-label={t('Sửa hạn {ngay}', { ngay: ten })} title={t('Sửa hạn')} onClick={onClick}
        className={`inline-flex min-h-[44px] cursor-pointer items-center appearance-none whitespace-nowrap rounded-md border border-[color:var(--line-strong)] bg-[color:var(--surface)] px-2.5 tabular-nums hover:border-[color:var(--accent)] focus-visible:outline-2 touch-manipulation sm:min-h-[30px] ${className}`}>
        {children}
      </button>
    );
  },
);
