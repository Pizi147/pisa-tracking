import { NganCase } from '../students/NganCase.tsx';
import { PanelNhapDiem } from '../congViec/PanelViec.tsx';
import { NganViecVanHanh } from './MgmtTasksPage.tsx';
import type { DongSoLieu } from '../../ui/SoLieu.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * VIỆC DÀI CỦA MỘT DÒNG PANEL SỐ LIỆU (OV-12e, P12, mockup v3 §10): THAY nội dung panel (không panel lồng panel) bằng đúng panel làm việc sẵn có —
 * Ngăn Case đúng việc (Xác nhận Case · Ghi nhận xét · Sửa PA / Xác nhận PA · Ghi kết quả · Thêm PA · Hoàn thành), bảng Nhập điểm một lớp · một lượt ·
 * một kỹ năng (cùng Công việc), ngăn Vận hành. "← Danh sách" về đúng dòng; lưu xong về danh sách (nơi gọi tải lại số).
 */
export function LamDongSoLieu({ dong, onVe, onDong, onDaLam }: {
  dong: DongSoLieu; onVe: () => void; onDong: () => void; onDaLam: () => void;
}) {
  const v = dong.viec;
  if (!v) return null;
  const ve = { nhan: t('Danh sách'), onClick: onVe };
  if (v.loai === 'nhap-diem') {
    return (
      <PanelNhapDiem quayLai={ve} onDong={onDong} onDaLam={onDaLam}
        it={{ classId: v.classId ?? null, luot: v.luot, kn: v.kn, studentId: v.studentId ?? null, emIds: undefined,
          tieuDe: v.chu, classCode: dong.lop ?? '', contextLabel: dong.ngCanh ?? '', due: v.han }} />
    );
  }
  if (v.loai === 'van-hanh') return <NganViecVanHanh taskId={dong.id} quayLai={ve} onClose={onDong} onDone={onDaLam} />;
  /* Lưu xong Ngăn Case tự về `veNguon` (danh sách); `onChanged` báo nơi gọi tải lại. */
  return (
    <NganCase caseId={v.caseId!} paId={v.paId ?? null} viec={v.loai} hocVien={dong.em?.ten ?? null} lop={dong.lop ?? null}
      veNguon={ve} onClose={onDong} onChanged={onDaLam} />
  );
}
