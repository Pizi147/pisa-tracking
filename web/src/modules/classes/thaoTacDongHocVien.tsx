import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickReport } from '../cases/QuickReport.tsx';
import { RecordViolationPanel } from '../yThuc/RecordViolationPanel.tsx';
import { ChuyenLopPanel } from '../students/ChuyenLopPanel.tsx';
import type { MucMenu } from '../../ui/MenuDong.tsx';
import { MUC_MENU_DONG_HIEM, MUC_MENU_DONG_NHAN, duongHoSoHocVien, duongLoTrinhLop, mucMenuDongHocVien, type ViecTiepTheo } from '@shared/domain/index.ts';

/** `coTheChuyenTiep` = `class.edit` ở lớp (Quản lý — ra quyết định chuyển lớp); người chỉ có `coTheSuaHocVien` (GVCN) thì Đề xuất chuyển lớp. */
export type QuyenDong = { coTheSuaHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean; coTheChuyenTiep?: boolean };
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
 * ĐÍCH BẤM ĐƯỢC của một việc tiếp theo (B8): nhập điểm → lưới nhập điểm của lớp · Case → hồ sơ em mở đúng Ngăn Case (Ghi kết quả mở luôn form) ·
 * Ý thức → tab Ý thức & Phối hợp của em. Nhập điểm mà em không còn kỹ năng nào người xem phải chấm thì không có link.
 */
export function duongViecTiep(v: ViecTiepTheo, o: {
  studentId: number; classId: number; laLopThuong: boolean; timeline: readonly { kind: string; kindLabel: string; myPending: string[] }[];
}): string | null {
  const d = v.dich;
  if (!d) return null;
  if (d.loai === 'nhap-diem') return nhapDiemCua(o.classId, o.laLopThuong, o.timeline)?.den ?? null;
  if (d.loai === 'y-thuc') return duongHoSoHocVien(o.studentId, { tab: 'y-thuc' });
  return duongHoSoHocVien(o.studentId, { caseId: d.caseId, paId: d.paId, viec: d.ghiKetQua && d.paId != null ? 'ghi-ket-qua' : undefined });
}

/**
 * MENU ⋯ CUỐI DÒNG HỌC VIÊN (đặc tả §3.7, mockup 06 phương án A; bảng định vị §4) — dùng chung cho trang Học viên & Lớp và tab Học
 * viên của hồ sơ lớp. Mục nào hiện do `mucMenuDongHocVien` (shared) quyết; panel do hook này giữ, một panel một lúc (G-8).
 * "Lộ trình tiếp theo" (OV-3b): sang hồ sơ lớp › Lộ trình tiếp theo, mở sẵn hộp của em; "Chuyển lớp": `ChuyenLopPanel`.
 */
export function useThaoTacDongHocVien({ laLopThuong, quyen, onDone, maLop, classId }: {
  laLopThuong: boolean; quyen: QuyenDong; onDone: () => void;
  /** Lớp của dòng — đích của "Lộ trình tiếp theo". */
  classId?: number | null;
  /** Mã lớp hiện ở đầu các ngăn mở từ dòng học viên (`Tên HV · MB FOU 12`). */
  maLop?: string | null;
}): { mucCua: (d: DongChoMenu) => MucMenu[]; panels: ReactNode } {
  const navigate = useNavigate();
  const [mo, setMo] = useState<{ viec: 'case' | 'vi-pham' | 'chuyen-lop' | 'de-xuat-chuyen-lop'; id: number; ten: string } | null>(null);

  const mucCua = (d: DongChoMenu): MucMenu[] => mucMenuDongHocVien({
    laLopThuong, dangHoc: d.dangHoc,
    coTheGhiViPham: quyen.coTheGhiViPham, coTheBaoCase: quyen.coTheBaoCase,
    coTheNhapDiem: quyen.coTheNhapDiem && d.nhapDiem !== null,
    coTheSuaHocVien: quyen.coTheSuaHocVien, coTheChuyenLop: !!quyen.coTheChuyenTiep, coTheDeXuatChuyenLop: quyen.coTheSuaHocVien && !quyen.coTheChuyenTiep,
  }).filter((k) => k !== 'lo-trinh-tiep' || !!classId).map((k, i, ds) => ({
    key: k,
    nhan: k === 'nhap-diem' && d.nhapDiem ? d.nhapDiem.nhan : MUC_MENU_DONG_NHAN[k],
    /* K2-30: vạch ngăn trước việc hiếm đầu tiên (khi phía trên còn việc hằng ngày). */
    keTruoc: MUC_MENU_DONG_HIEM.includes(k) && i > 0 && !MUC_MENU_DONG_HIEM.includes(ds[i - 1]),
    onChon: () => {
      if (k === 'nhap-diem') { if (d.nhapDiem) navigate(d.nhapDiem.den); }
      else if (k === 'lo-trinh-tiep') navigate(duongLoTrinhLop(classId!, d.id));
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
      <ChuyenLopPanel open={mo?.viec === 'chuyen-lop' || mo?.viec === 'de-xuat-chuyen-lop'} cheDo={mo?.viec === 'de-xuat-chuyen-lop' ? 'de-xuat' : 'lenh'} onClose={() => setMo(null)}
        studentId={mo?.id ?? 0} studentName={mo?.ten} lop={maLop} onDone={xong} />
    </>
  );
  return { mucCua, panels };
}
