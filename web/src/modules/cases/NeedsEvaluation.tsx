import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { NganDanhSach, type DongSoLieu } from '../../ui/SoLieu.tsx';
import { t } from '@shared/i18n/index.ts';

const VI_SAO = t('Không tính vào bảng hiệu quả tới khi có kết quả');

/**
 * "n PA CHƯA CÓ KẾT QUẢ ⓘ" (PANEL-RIENG B6 — tên mới, khớp nút "Ghi kết quả") — phương án đã kết thúc mà chưa có kết quả xác định (F05).
 *
 * Chúng KHÔNG nằm trong bảng hiệu quả và không vào mẫu số (D03), nhưng là việc cần người làm — nên hiện thành MỘT nút chữ ngoài bảng, mở panel số
 * chung (`NganDanhSach`): tên em là link hồ sơ, nút "Ghi kết quả" riêng khi người xem ghi được (máy chủ `rowsFor('phuong-an')` + `ghiDuocPaMany`).
 * Cùng bộ lọc phạm vi với bảng vừa xem, nên số ở đây và số dòng trong panel là một.
 */
export function NeedsEvaluation({ count, url }: { count: number; url: string }) {
  const [open, setOpen] = useState(false);
  const { data, loading, error, reload } = useApi<{ count: number; rows: DongSoLieu[] }>(open ? url : null, [url, open]);
  if (count <= 0) return null;
  /* Ghi kết quả trong panel làm số ngoài bảng đổi — đóng panel thì bảng của trang đọc lại. */
  const dong = () => { setOpen(false); invalidate(url.split('/needs-evaluation')[0]); };
  return (
    <>
      <span className="inline-flex items-center gap-1.5 text-sm">
        <button type="button" onClick={() => setOpen(true)}
          className="min-h-[44px] cursor-pointer appearance-none border-0 bg-transparent p-0 text-left font-semibold text-[color:var(--accent)] underline decoration-1 underline-offset-[3px] sm:min-h-0">
          {t('{n} PA chưa có kết quả', { n: count })}
        </button>
        <NutLuat label={VI_SAO}>{VI_SAO}</NutLuat>
      </span>
      {open && (
        <NganDanhSach tieuDe={t('PA chưa có kết quả')} dv="PA" onDong={dong} cachTinh={VI_SAO} trong={t('Không còn PA nào chưa có kết quả')}
          data={data ? { n: data.count, rows: data.rows } : null} loading={loading} error={error} reload={reload} />
      )}
    </>
  );
}
