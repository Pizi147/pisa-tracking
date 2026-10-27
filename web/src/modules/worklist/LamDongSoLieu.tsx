import { NganCase } from '../students/NganCase.tsx';
import { PanelNhapDiem } from '../congViec/PanelViec.tsx';
import { NganViecVanHanh } from './MgmtTasksPage.tsx';
import { useXem } from '../../lib/quayLai.ts';
import type { DongSoLieu } from '../../ui/SoLieu.tsx';

/**
 * VIỆC DÀI CỦA MỘT DÒNG PANEL SỐ LIỆU (OV-12e, P12, mockup v3 §10): THAY nội dung panel (không panel lồng panel) bằng đúng panel làm việc sẵn có —
 * Ngăn Case đúng việc (Xác nhận Case · Ghi nhận xét · Sửa PA / Xác nhận PA · Ghi kết quả · Thêm PA · Hoàn thành), bảng Nhập điểm một lớp · một lượt ·
 * một kỹ năng (cùng Công việc), ngăn Vận hành. M6 6b-1: là view kế trên `?panel=` của danh sách (`XemCha`) — "‹ {danh sách}" / Back trình duyệt về đúng
 * dòng; Ngăn Case tự đọc chuỗi (view mở từ Case thì ‹ về Case). Lưu xong về danh sách (nơi gọi tải lại số).
 */
export function LamDongSoLieu({ dong, onDong, onDaLam }: {
  dong: DongSoLieu; onDong: () => void; onDaLam: () => void;
}) {
  const xem = useXem();
  const v = dong.viec;
  if (!v) return null;
  const ve = { nhan: xem.ten ?? '', onClick: xem.lui };
  if (v.loai === 'nhap-diem') {
    return (
      <PanelNhapDiem quayLai={ve} onDong={onDong} onDaLam={onDaLam}
        it={{ classId: v.classId ?? null, luot: v.luot, kn: v.kn, studentId: v.studentId ?? null, emIds: undefined,
          tieuDe: v.chu, classCode: dong.lop ?? '', contextLabel: dong.ngCanh ?? '', due: v.han }} />
    );
  }
  if (v.loai === 'van-hanh') return <NganViecVanHanh taskId={dong.id} quayLai={ve} onClose={onDong} onDone={onDaLam} />;
  return (
    <NganCase caseId={v.caseId!} paId={v.paId ?? null} hocVien={dong.em?.ten ?? null} lop={dong.lop ?? null} onClose={onDong} onChanged={onDaLam} />
  );
}
