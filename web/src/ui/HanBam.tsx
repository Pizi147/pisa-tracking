import { forwardRef, type ReactNode } from 'react';
import { t } from '@shared/i18n/index.ts';

/**
 * NGÀY HẠN BẤM ĐƯỢC (chủ SP 26/11: bỏ nút "Sửa hạn" / "Gia hạn", bấm thẳng vào hạn để sửa). Màu và cỡ chữ lấy của chỗ đặt (kế thừa) — chỉ thêm
 * gạch chân chấm mảnh làm gợi ý bấm. Chỉ vẽ khi người xem có quyền (cờ máy chủ); không có quyền → nơi gọi vẽ ngày trơn.
 * `ten` = chữ ngày đọc cho trình đọc màn hình ("Sửa hạn 12/11/2026").
 */
export const HanBam = forwardRef<HTMLButtonElement, { ten: string; onClick: () => void; children: ReactNode; className?: string }>(
  function HanBam({ ten, onClick, children, className = '' }, ref) {
    return (
      <button ref={ref} type="button" aria-label={t('Sửa hạn {ngay}', { ngay: ten })} title={t('Sửa hạn')} onClick={onClick}
        className={`inline-flex min-h-[44px] cursor-pointer items-center appearance-none p-0 underline decoration-dotted decoration-1 underline-offset-4 hover:decoration-solid focus-visible:outline-2 sm:min-h-0 ${className}`}>
        {children}
      </button>
    );
  },
);
