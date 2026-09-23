import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickReport } from '../cases/QuickReport.tsx';
import { RecordViolationPanel } from '../yThuc/RecordViolationPanel.tsx';
import { LoTrinhTiepPanel } from '../students/LoTrinhTiepPanel.tsx';
import { ChuyenLopPanel } from '../students/ChuyenLopPanel.tsx';
import type { MucMenu } from '../../ui/MenuDong.tsx';
import { MUC_MENU_DONG_NHAN, mucMenuDongHocVien } from '@shared/domain/index.ts';

export type QuyenDong = { coTheSuaHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean };
export type DongChoMenu = { id: number; ten: string; dangHoc: boolean; nhapDiem: { nhan: string; den: string } | null };

/** "Nhập điểm MT3" / "Nhập điểm Giữa khoá" khi em còn kỹ năng người xem phải chấm; không có thì không có mục (g3-072). */
export function nhapDiemCua(
  classId: number, laLopThuong: boolean, timeline: readonly { kind: string; kindLabel: string; myPending: string[] }[],
): DongChoMenu['nhapDiem'] {
  const t = timeline.find((x) => x.myPending.length > 0);
  if (!t) return null;
  return {
    nhan: `Nhập điểm ${t.kindLabel}`,
    den: laLopThuong ? `/bang-diem-thuong/${classId}?kind=${t.kind}` : `/nhap-diem/${classId}`,
  };
}

/**
 * MENU ⋯ CUỐI DÒNG HỌC VIÊN (đặc tả §3.7, mockup 06 phương án A; bảng định vị §4) — dùng chung cho trang Học viên & Lớp và tab Học
 * viên của hồ sơ lớp. Mục nào hiện do `mucMenuDongHocVien` (shared) quyết; panel do hook này giữ, một panel một lúc (G-8).
 * "Lộ trình tiếp theo" và "Chuyển lớp" (PR-LT, `MENU_DONG_CHO_PR_LT = true`): `LoTrinhTiepPanel`/`ChuyenLopPanel`.
 */
export function useThaoTacDongHocVien({ laLopThuong, quyen, onDone, maLop }: {
  laLopThuong: boolean; quyen: QuyenDong; onDone: () => void;
  /** Mã lớp hiện ở đầu các ngăn mở từ dòng học viên (`Tên HV · MB-FOU 12`). */
  maLop?: string | null;
}): { mucCua: (d: DongChoMenu) => MucMenu[]; panels: ReactNode } {
  const navigate = useNavigate();
  const [mo, setMo] = useState<{ viec: 'case' | 'vi-pham' | 'lo-trinh-tiep' | 'chuyen-lop'; id: number; ten: string } | null>(null);

  const mucCua = (d: DongChoMenu): MucMenu[] => mucMenuDongHocVien({
    laLopThuong, dangHoc: d.dangHoc,
    coTheGhiViPham: quyen.coTheGhiViPham, coTheBaoCase: quyen.coTheBaoCase,
    coTheNhapDiem: quyen.coTheNhapDiem && d.nhapDiem !== null,
    coTheSuaHocVien: quyen.coTheSuaHocVien, coTheChuyenLop: quyen.coTheSuaHocVien,
  }).map((k) => ({
    key: k,
    nhan: k === 'nhap-diem' && d.nhapDiem ? d.nhapDiem.nhan : MUC_MENU_DONG_NHAN[k],
    onChon: () => {
      if (k === 'ho-so') navigate(`/hoc-vien/${d.id}`);
      else if (k === 'nhap-diem') { if (d.nhapDiem) navigate(d.nhapDiem.den); }
      else setMo({ viec: k, id: d.id, ten: d.ten });
    },
  }));

  const xong = () => { setMo(null); onDone(); };
  const panels = (
    <>
      <QuickReport open={mo?.viec === 'case'} onClose={() => setMo(null)}
        studentId={mo?.id ?? 0} studentName={mo?.ten} lop={maLop} onDone={xong} />
      <RecordViolationPanel open={mo?.viec === 'vi-pham'} onClose={() => setMo(null)}
        studentId={mo?.id ?? 0} studentName={mo?.ten} lop={maLop} onDone={xong} />
      <LoTrinhTiepPanel open={mo?.viec === 'lo-trinh-tiep'} onClose={() => setMo(null)}
        studentId={mo?.id ?? 0} studentName={mo?.ten} lop={maLop} onDone={xong} />
      <ChuyenLopPanel open={mo?.viec === 'chuyen-lop'} onClose={() => setMo(null)}
        studentId={mo?.id ?? 0} studentName={mo?.ten} lop={maLop} onDone={xong} />
    </>
  );
  return { mucCua, panels };
}
