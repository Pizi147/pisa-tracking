import { Nhan } from '../../ui/Nhan.tsx';
import { NhanTrangThai } from '../../ui/ui.tsx';
import { ngay, nhanQuaHan, type NhanYThucEm } from '@shared/domain/index.ts';
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
  /* CA2-7: nhãn nói rõ là Ý thức ("Ý thức · quá hạn 1 ngày" / "Ý thức · cần xử lý") — dòng tên em còn chip SOS, Thiếu… */
  return cb.nhom === 'qua_han'
    ? <NhanTrangThai t="qua-han" title={title} chu={`${t('Ý thức')} · ${nhanQuaHan(cb.quaHanNgay && cb.quaHanNgay > 0 ? cb.quaHanNgay : null)}`} />
    : <Nhan tone="soon" title={title}>{t('Ý thức · cần xử lý')}</Nhan>;
}
