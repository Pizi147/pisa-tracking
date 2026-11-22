import { deadlineView, mucHan, ngay, ngayTheoGioVN, type DeadlineKind } from '@shared/domain/index.ts';
import { DauQuaHan, LOP_MUC_HAN } from './Nhan.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * MỌI HẠN ĐỀU CÓ LOẠI (HE_GIAO_DIEN §4, đóng lỗi F11).
 *
 *   <Han loai="xac-minh-sos" han="2026-09-17" />
 *   <Han loai="nhap-diem" han="2026-09-23" hen="2026-09-30" />
 *
 * `loai` BẮT BUỘC và không có giá trị mặc định: thiếu nó thì `tsc` báo lỗi lúc dựng, không
 * phải một cảnh báo lúc chạy. Mỗi loại (`DEADLINE_KINDS`, PR-NEN thêm Duyệt · Xử lý vi phạm ·
 * Mini Test) là một đồng hồ riêng trong rule book; ngày trần ("30/08") không nói được người đọc đang trễ việc gì.
 *
 * LUẬT HẠN NHẸ HƠN (chủ SP 22/11, v23 `.han`): chữ "hạn 21/11/2026" tô theo `mucHan` — chữ phụ (còn xa) · vàng (hôm nay → còn ≤ 2 ngày) ·
 * đỏ + ⚠ (quá hạn, đếm từ hạn GỐC). Chữ "quá hạn n ngày" chỉ ở dòng việc / đầu panel việc → `soNgay`; bảng báo cáo / hồ sơ chỉ tô ngày.
 * Bản đầy đủ nằm ở tooltip. `du-kien-ket-thuc` KHÔNG PHẢI HẠN: luôn trung tính.
 *
 * Toàn bộ câu chữ nằm ở `deadlineView` (`shared/domain/display.ts`), mức ở `mucHan` — kiểm được bằng bộ kiểm thử máy chủ. Component này chỉ vẽ.
 */
export function Han({ loai, han, hanGoc, hen, tienTo, ghiChu, coViec, soNgay, mo, trongBang, khongDau }: {
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
  /** Dòng việc / đầu panel việc: thêm "· quá hạn n ngày" sau ngày. */
  soNgay?: boolean;
  /** Việc của người khác: không tô màu (⚠ vẫn giữ — nói nghĩa không bằng màu). */
  mo?: boolean;
  /** NHẸ HƠN (NH4, v23 Lịch Test `.han`): ô bảng có đầu cột "Hạn chấm" — CHỈ ngày dd/mm/yyyy tô màu, không chữ "hạn", không ⚠;
   *  quá hạn thêm nền đỏ nhạt (dấu không chỉ bằng màu chữ). Chữ đầy đủ ở tooltip. */
  trongBang?: boolean;
  /** NH4 (v23 Lịch Test #l2 `.han`): thẻ 375 — giữ chữ "hạn 21/11/2026" tô màu nhưng không ⚠ (trình đọc màn hình vẫn nghe "quá hạn"). */
  khongDau?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const v = deadlineView({ kind: loai, due: han, originalDue: hanGoc, reschedule: hen, today: homNay });
  const goc = hanGoc && ngayTheoGioVN(hanGoc) ? hanGoc : han;
  const muc = loai === 'du-kien-ket-thuc' || !goc ? 'xa' : mucHan(goc, homNay);
  const title = v.text + (v.title ? ` · ${v.title}` : '');
  if (trongBang) {
    return (
      <span title={title} className={`whitespace-nowrap text-[13px] tabular-nums ${mo ? LOP_MUC_HAN.xa : LOP_MUC_HAN[muc]} ${muc === 'qua' && !mo ? '-mx-1.5 rounded bg-late-bg px-1.5 py-0.5' : ''}`}>
        {muc === 'qua' && <span className="sr-only">{t('quá hạn')} </span>}{han ? ngay(han) : v.han}
      </span>
    );
  }
  return (
    <span title={title} className="text-[13px] tabular-nums text-dim">
      {[tienTo, coViec && loai !== 'du-kien-ket-thuc' ? v.viec : null].filter(Boolean).map((x) => `${x} · `).join('')}
      <span className={`whitespace-nowrap ${mo ? LOP_MUC_HAN.xa : LOP_MUC_HAN[muc]}`}>
        {muc === 'qua' && (khongDau ? <span className="sr-only">{t('quá hạn')} </span> : <DauQuaHan />)}{v.han}{soNgay && v.quaHan && <> · {v.quaHan}</>}
      </span>
      {v.hen && <> · {v.hen}</>}
      {ghiChu && <> · {ghiChu}</>}
    </span>
  );
}
