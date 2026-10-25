import { useSession } from '../lib/session.tsx';
import { businessDateText, khoaCuoiTuan, shortDate } from '@shared/domain/index.ts';

/**
 * MỘT NGUỒN DUY NHẤT CHO NGÀY NGHIỆP VỤ Ở GIAO DIỆN (HE_GIAO_DIEN §7, lỗi MT-P10).
 *
 * `session.demoDate` là chính giá trị mà máy chủ đọc từ `demoToday()` — cùng một đồng hồ. Bộ
 * chọn tuần, ngày mặc định của form, mốc "hôm nay" của Vi phạm và Biện pháp và mọi phép so "quá hạn"
 * đều phải đọc từ đây, KHÔNG được đọc `new Date()` của trình duyệt: demo chạy ở 14/09 mà đồng
 * hồ máy là 19/09 thì mọi hạn sẽ bị tính sai.
 *
 * Ngày nghiệp vụ và ngày ghi nhận thật là HAI thứ. Chỗ nào chúng khác nhau thì hiện cả hai
 * (`nhan`); không sửa timestamp thật cho đẹp ảnh, không giấu một trong hai.
 */
export function useNgayNghiepVu() {
  const { session } = useSession();
  const homNay = session?.demoDate ?? '';
  return {
    /** Hôm nay theo ngày nghiệp vụ, dạng `2026-09-14`. */
    homNay,
    /** `14/09` khi cùng năm với hôm nay, `05/01/2027` khi sang năm khác. */
    ngan: (iso: string | null | undefined) => shortDate(iso, homNay),
    /** `Ngày nghiệp vụ 14/09 · Ghi nhận 19/09` khi khác ngày; một ngày khi trùng. */
    nhan: (ngayNghiepVu: string, ghiNhan?: string | null) => businessDateText(ngayNghiepVu, ghiNhan, homNay),
  };
}

/**
 * P6 N15: câu khoá đổi lịch MT T6 → CN cho tuần (Thứ Hai) gốc / đích; null = đổi được. Vai GỐC Quản trị hệ thống miễn (kể cả đang "xem như"
 * vai khác). Chỉ để tắt nút + chip lý do — máy chủ kiểm lại lúc lưu. Nơi gọi chỉ dùng cho MT / MT0 / S Ex (không lớp thường).
 */
export function useKhoaCuoiTuan() {
  const { session } = useSession();
  const homNay = session?.demoDate ?? '';
  const quanTri = session?.gocNhin?.vaiGoc === 'system_admin' || !!session?.roles?.includes('system_admin');
  return (...tuan: (string | null | undefined)[]) => (homNay ? khoaCuoiTuan({ tuan: tuan.map((w) => w ?? null), homNay, quanTri }) : null);
}
