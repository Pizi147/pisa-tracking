import { deadlineView, type DeadlineKind } from '@shared/domain/index.ts';
import { Alert, Info, Status } from './ui.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';

/**
 * MỌI HẠN ĐỀU CÓ LOẠI (HE_GIAO_DIEN §4, đóng lỗi F11).
 *
 *   <Han loai="xac-minh-sos" han="2026-09-17" />
 *   <Han loai="nhap-diem" han="2026-09-23" hen="2026-09-30" />
 *
 * `loai` BẮT BUỘC và không có giá trị mặc định: thiếu nó thì `tsc` báo lỗi lúc dựng, không
 * phải một cảnh báo lúc chạy. Sáu loại là sáu đồng hồ khác nhau trong rule book; ngày trần
 * ("30/08") không nói được người đọc đang trễ việc gì.
 *
 * `du-kien-ket-thuc` KHÔNG PHẢI HẠN: luôn trung tính, không bao giờ đỏ, không bao giờ "quá hạn".
 *
 * Toàn bộ luật (câu chữ, đếm quá hạn từ hạn GỐC, hiện cả hẹn xử lý) nằm ở `deadlineView` trong
 * `shared/domain/display.ts` — kiểm được bằng bộ kiểm thử máy chủ. Component này chỉ vẽ.
 * Trạng thái luôn có chữ (⚠ / ◷): màu không bao giờ là tín hiệu duy nhất.
 */
export function Han({ loai, han, hanGoc, hen, tienTo, ghiChu }: {
  loai: DeadlineKind;
  /** Hạn đang hiệu lực, dạng `2026-09-23`. `null` = chưa đặt. */
  han: string | null;
  /** Hạn GỐC nếu `han` là hạn đã dời có quyền — quá hạn luôn đếm từ đây. */
  hanGoc?: string | null;
  /** Hẹn xử lý mới, hiện CẠNH hạn, không thay hạn. */
  hen?: string | null;
  /** Chữ đứng trước, ví dụ tuần thi: `Thi 14/09 – 20/09`. */
  tienTo?: string;
  /** Chữ đứng sau, ví dụ nguồn hạn: `riêng môn này`. */
  ghiChu?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  const v = deadlineView({ kind: loai, due: han, originalDue: hanGoc, reschedule: hen, today: homNay });
  const text = [tienTo, v.text, ghiChu].filter(Boolean).join(' · ');
  const title = v.title ?? undefined;
  if (v.tone === 'overdue') return <Alert title={title}>{text}</Alert>;
  if (v.tone === 'waiting') return <Status kind="waiting" title={title}>{text}</Status>;
  return <Info title={title}>{text}</Info>;
}
