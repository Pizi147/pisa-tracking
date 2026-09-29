import { Nhan } from '../../ui/Nhan.tsx';
import { NhanTrangThai } from '../../ui/ui.tsx';
import { ngay, type NhanYThucEm } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

/**
 * NHÃN Ý THỨC Ở DÒNG HỌC VIÊN (PR-YT4, K1-17): chỉ hai nhóm cần hành động của cửa trạng thái — `Quá hạn` (cam) / `Cần xử lý` (vàng).
 * Không còn "{n} vi phạm" xanh. Số vi phạm + hạn nằm ở tooltip — cùng số với huy hiệu tab Ý thức của lớp.
 */
export function CanhBaoYThuc({ cb }: { cb: NhanYThucEm | null }) {
  const { homNay } = useNgayNghiepVu();
  if (!cb) return null;
  const title = `${cb.so} vi phạm ${cb.nhom === 'qua_han' ? 'quá hạn' : 'bắt buộc xử lý'}${cb.han ? ` · hạn ${ngay(cb.han, homNay)}` : ''}`;
  return cb.nhom === 'qua_han'
    ? <NhanTrangThai t="qua-han" soNgay={cb.quaHanNgay} title={title} />
    : <Nhan tone="soon" title={title}>Cần xử lý</Nhan>;
}
