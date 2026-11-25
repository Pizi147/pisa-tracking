import { ChipHan } from '../../ui/Nhan.tsx';
import { ngay, type NhanYThucEm } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * NHÃN Ý THỨC Ở DÒNG HỌC VIÊN (PR-YT4, K1-17): chỉ hai nhóm cần hành động của cửa trạng thái — `Quá hạn` (cam) / `Cần xử lý` (vàng).
 * Không còn "{n} vi phạm" xanh. Số vi phạm + hạn nằm ở tooltip — cùng số với huy hiệu tab Ý thức của lớp.
 */
export function CanhBaoYThuc({ cb }: { cb: NhanYThucEm | null }) {
  const { homNay } = useNgayNghiepVu();
  if (!cb) return null;
  const title = `${cb.nhom === 'qua_han' ? t('{n} vi phạm quá hạn', { n: cb.so }) : t('{n} vi phạm bắt buộc xử lý', { n: cb.so })}${cb.han ? ` · ${t('hạn {ngay}', { ngay: ngay(cb.han, homNay) })}` : ''}`;
  /* CA2-7 + NH4: "Ý thức" + NGÀY hạn tô màu chữ (không badge, không "quá hạn n ngày"). */
  return <span title={title} className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] text-dim">{t('Ý thức')}{cb.han && <> · <ChipHan loai="xu-ly-vi-pham" han={cb.han} /></>}</span>;
}
