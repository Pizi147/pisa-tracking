import { Link } from 'react-router-dom';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import { DiemTheoLop } from './DiemTheoLop.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * NHẬP ĐIỂM MỘT LỚP TẠI CHỖ (OV-15b mục 5, C16; mockup 2 khung 4) — thay tab Test › Điểm theo lớp. Mở từ ⋯ hàng lớp (Học viên & Lớp),
 * nút Nhập điểm của hồ sơ lớp, và link cũ `/test/diem-lop?lop=`. Chọn lượt / môn trong panel (`DiemTheoLop chonMon`); cùng lưới, cùng luật lưu.
 */
export function PanelNhapDiemLop({ classId, classCode, luot, onDong, quayLai }: {
  classId: number; classCode?: string | null; luot?: string | null; onDong: () => void;
  /** Mở thay panel việc (Công việc) — "‹ Việc" về lại việc. */
  quayLai?: { nhan: string; onClick: () => void };
}) {
  const dau = dauViec({
    ngCanh: (
      <Link className="link" to={`/hoc-vien/lop/${classId}`}>
        {t('Hồ sơ lớp')}
      </Link>
    ),
  });
  return (
    <KhungPanel tieuDe={classCode ? t('Nhập điểm · {lop}', { lop: classCode }) : t('Nhập điểm')} dau={dau} rong="toan" quayLai={quayLai} onDong={onDong}>
      <div className="pt-3">
        <DiemTheoLop classId={classId} gon chonMon luotBanDau={luot ?? undefined} />
      </div>
    </KhungPanel>
  );
}
