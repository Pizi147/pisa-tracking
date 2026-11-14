import { t } from '@shared/i18n/index.ts';
import type { LopKH } from './kieu.ts';
import { ChonLop } from '../../../ui/ChonLop.tsx';

/**
 * Ô TÌM LỚP để thêm một lớp vào bộ lọc Xuất (mockup 14 (1), Q8) — GD-5 (R5.2 #59, #60): dùng ô chọn có tìm chung (`ChonLop`, mockup ⑤ A): gõ không dấu,
 * mục hai hàng (mã · chi nhánh · n HV), ↑ ↓ Enter Esc, ✕ xoá chữ; 375 mở toàn màn. Lọc PHÍA WEB trên danh sách lớp đã theo chi nhánh và quyền — không gọi máy chủ.
 * Chọn một lớp → `onChon`, ô trống lại để thêm lớp tiếp. `value` / `onChange` (chữ gõ cũ) giữ cho nơi gọi, ô tự giữ chữ gõ.
 */
export function TimLop({ lop, onChon, className = '', placeholder }: {
  lop: LopKH[]; value?: string; onChange?: (v: string) => void; onChon: (l: LopKH) => void; className?: string; placeholder?: string;
}) {
  return (
    <div className={className}>
      <span className="label">{t('Lớp')}</span>
      <ChonLop value={null} ariaLabel={t('Tìm lớp')} placeholder={placeholder ?? t('Tìm lớp…')} khongKhop={t('Không có lớp để chọn')}
        ds={lop.map((l) => ({ id: l.id, ma: l.code, phu: [l.chiNhanh, t('{n} HV', { n: l.soHv })].filter(Boolean).join(' · ') }))}
        onChange={(id) => { const l = lop.find((x) => x.id === id); if (l) onChon(l); }} />
    </div>
  );
}
