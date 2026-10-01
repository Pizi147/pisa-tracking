import { deadlineView, type DeadlineKind } from '@shared/domain/index.ts';
import { QuaHan } from './Nhan.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';

/**
 * MỌI HẠN ĐỀU CÓ LOẠI (HE_GIAO_DIEN §4, đóng lỗi F11).
 *
 *   <Han loai="xac-minh-sos" han="2026-09-17" />
 *   <Han loai="nhap-diem" han="2026-09-23" hen="2026-09-30" />
 *
 * `loai` BẮT BUỘC và không có giá trị mặc định: thiếu nó thì `tsc` báo lỗi lúc dựng, không
 * phải một cảnh báo lúc chạy. Mỗi loại (`DEADLINE_KINDS`, PR-NEN thêm Duyệt · Xử lý vi phạm · Nộp kế hoạch bổ trợ ·
 * Mini Test) là một đồng hồ riêng trong rule book; ngày trần ("30/08") không nói được người đọc đang trễ việc gì.
 *
 * PR-UX0 (B-2/B-3): việc là TIÊU ĐỀ DÒNG ở chỗ gọi, nên hạn chỉ là chữ mờ "hạn hết T2 31/08"; quá hạn nối
 * ngay sau BẰNG CHỮ ("⚠ quá hạn 15 ngày", đỏ cam, không nền, không khung); đúng hạn hôm nay là "hôm nay"
 * (vàng, không ⚠). Chỗ không có tiêu đề nói việc thì truyền `coViec` để hiện lại tên việc. Bản đầy đủ nằm ở tooltip.
 *
 * `du-kien-ket-thuc` KHÔNG PHẢI HẠN: luôn trung tính, không bao giờ quá hạn, không bao giờ đỏ.
 *
 * Toàn bộ luật (câu chữ, đếm quá hạn từ hạn GỐC, hiện cả hẹn xử lý) nằm ở `deadlineView` trong
 * `shared/domain/display.ts` — kiểm được bằng bộ kiểm thử máy chủ. Component này chỉ vẽ.
 */
export function Han({ loai, han, hanGoc, hen, tienTo, ghiChu, coViec, haiDong }: {
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
  /** Hiện tên việc ("Nhập điểm · hạn 23/09") — chỉ cho chỗ không có tiêu đề nói việc. */
  coViec?: boolean;
  /** Phần "quá hạn"/"hôm nay" xuống dòng riêng (cột hạn hẹp, cột thẳng hàng). */
  haiDong?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const v = deadlineView({ kind: loai, due: han, originalDue: hanGoc, reschedule: hen, today: homNay });
  const title = v.text + (v.title ? ` · ${v.title}` : '');
  const tinHieu = (
    <>
      {v.tone === 'overdue' && <QuaHan ngay={v.daysOverdue} />}
      {v.homNay && <span className="font-semibold text-soon">hôm nay</span>}
    </>
  );
  const coTinHieu = v.tone === 'overdue' || v.homNay;
  return (
    <span title={title} className="text-xs tabular-nums text-slate-500">
      {[tienTo, coViec && loai !== 'du-kien-ket-thuc' ? v.viec : null].filter(Boolean).map((x) => `${x} · `).join('')}
      {v.han}
      {coTinHieu && (haiDong ? <span className="block">{tinHieu}</span> : <> {tinHieu}</>)}
      {v.hen && <> · {v.hen}</>}
      {ghiChu && <> · {ghiChu}</>}
    </span>
  );
}
