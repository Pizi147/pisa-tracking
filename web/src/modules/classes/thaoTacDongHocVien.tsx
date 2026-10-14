import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickReport } from '../cases/QuickReport.tsx';
import { RecordViolationPanel } from '../yThuc/RecordViolationPanel.tsx';
import { ChuyenLopPanel } from '../students/ChuyenLopPanel.tsx';
import { XacNhanXuLyPanel } from '../yThuc/XacNhanXuLyPanel.tsx';
import { StudentManagePanel, SuaThongTinMotEm } from '../students/StudentManagePanel.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import type { MucMenu } from '../../ui/MenuDong.tsx';
import {
  DUONG_TAB_TEST, khoaBai, nhanBai, vietMaLuot, type MaLuot, MUC_MENU_DONG_HIEM, MUC_MENU_DONG_NHAN, duongHoSoHocVien, duongLoTrinhLop, mucDongTheoVai, mucMenuDongHocVien, type ViecQuanLy, type ViecTiepTheo,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * `coTheChuyenTiep` = `class.edit` ở lớp (Quản lý — ra quyết định chuyển lớp); người chỉ có `coTheSuaHocVien` (GVCN) thì Đề xuất chuyển lớp.
 * OV-10b: `theoVai` (TVV / CX / Admin) — ⋯ dòng là việc thông tin / trạng thái của vai (`mucDongTheoVai`) + Mở hồ sơ, theo `coTheSuaThongTin` /
 * `coTheSuaThem` của máy chủ; không có việc học thuật.
 */
export type QuyenDong = {
  coTheSuaHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean; coTheChuyenTiep?: boolean;
  theoVai?: boolean; coTheSuaThongTin?: boolean; coTheSuaThem?: boolean;
};
/** `status` / `ft` chỉ cần cho ⋯ theo vai (Tạm dừng / Quay lại, Kết quả thi thật chỉ FT); `ft` không gửi = theo lớp của bảng. */
export type DongChoMenu = {
  id: number; ten: string; dangHoc: boolean; nhapDiem: { nhan: string; den: string } | null; status?: string; ft?: boolean;
  /** Danh sách nhiều lớp (Học viên & Lớp TVV / CX): lớp và quyền của chính dòng — không gửi thì theo bảng. */
  maLop?: string | null; suaThongTin?: boolean; suaThem?: boolean;
  /** OV-12e: em đang cần xử lý Ý thức (cờ `canhBaoYThuc` của dòng) — ⋯ có "Xác nhận xử lý". */
  xuLyYThuc?: boolean;
};

/** "Nhập điểm MT3" / "Nhập điểm Giữa khoá" khi em còn kỹ năng người xem phải chấm; không có thì không có mục (g3-072). */
export function nhapDiemCua(
  classId: number, laLopThuong: boolean, timeline: readonly { kind: string; kindLabel: string; myPending: string[]; attemptNo?: number }[],
): DongChoMenu['nhapDiem'] {
  const lu = timeline.find((x) => x.myPending.length > 0);
  if (!lu) return null;
  /* HL-3: mọi "Nhập điểm" của lớp mở Điểm theo lớp (như nút đầu hồ sơ lớp), đúng lượt; route cũ `/nhap-diem`, `/bang-diem-thuong` vẫn chạy. */
  const ma: MaLuot | null = laLopThuong
    ? lu.kind === 'checkpoint' ? (lu.attemptNo ? { loai: 'cp', so: lu.attemptNo } : null)
      : lu.kind === 'progress' || lu.kind === 'final' || lu.kind === 'mt0' ? { loai: 'thuong', kind: lu.kind } : null
    : lu.kind === 'mock' && lu.attemptNo ? { loai: 'mt', so: lu.attemptNo } : null;
  return {
    nhan: t('Nhập điểm {dot}', { dot: lu.kind === 'checkpoint' ? nhanBai(khoaBai(lu.kind, lu.attemptNo)) : dich(lu.kindLabel) }),   // OV-6b2: "Checkpoint 2"
    den: `${DUONG_TAB_TEST['diem-lop']}?lop=${classId}${ma ? `&luot=${encodeURIComponent(vietMaLuot(ma))}` : ''}`,
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
  const toast = useToast();
  const [mo, setMo] = useState<{
    viec: 'case' | 'vi-pham' | 'xu-ly-y-thuc' | 'sua-thong-tin' | 'chuyen-lop' | 'de-xuat-chuyen-lop' | 'hoc-lai'; id: number; ten: string; quanLy?: ViecQuanLy; lop?: string | null;
  } | null>(null);
  const daDoi = (id: number) => { invalidate('/hoc-vien-lop'); invalidate(`/students/${id}`); onDone(); };
  /* OV-11g (Q11, Q12): Lưu trữ một chạm + Hoàn tác (bỏ lưu trữ) — như Lưu trữ / Bỏ lưu trữ ở trang Lưu trữ. */
  const luuTru = async (d: DongChoMenu) => {
    try {
      await api.post(`/students/${d.id}/archive`, {});
      daDoi(d.id);
      toast.hoanTac(t('Đã lưu trữ {ten}', { ten: d.ten }), async () => {
        try { await api.post(`/students/${d.id}/unarchive`, {}); daDoi(d.id); } catch (e: any) { toast.push('error', e.message); }
      }, { key: `luu-tru:${d.id}` });
    } catch (e: any) { toast.push('error', e.message); }
  };

  const mucCua = (d: DongChoMenu): MucMenu[] => d.status === 'finished' && !quyen.theoVai && quyen.coTheChuyenTiep ? [
    /* OV-11g (HL-19): em Kết thúc học chưa Lưu trữ (dòng mờ cuối lớp) — việc của Quản lý (máy chủ kiểm `cycle.edit`). */
    { key: 'luu-tru', nhan: t('Lưu trữ'), onChon: () => { void luuTru(d); } },
    { key: 'hoc-lai', nhan: t('Học lại'), onChon: () => setMo({ viec: 'hoc-lai', id: d.id, ten: d.ten }) },
  ] : quyen.theoVai ? [
    ...mucDongTheoVai({
      suaThongTin: d.suaThongTin ?? !!quyen.coTheSuaThongTin, suaThem: d.suaThem ?? !!quyen.coTheSuaThem,
      ft: d.ft ?? !laLopThuong, status: d.status ?? (d.dangHoc ? 'active' : 'finished'),
    }).map((m): MucMenu => ({ key: m.key, nhan: m.nhan, onChon: () => setMo({ viec: 'sua-thong-tin', id: d.id, ten: d.ten, quanLy: m.key, lop: d.maLop }) })),
    { key: 'ho-so', nhan: t('Mở hồ sơ'), keTruoc: true, onChon: () => navigate(duongHoSoHocVien(d.id)) },
  ] : mucMenuDongHocVien({
    laLopThuong, dangHoc: d.dangHoc,
    coTheGhiViPham: quyen.coTheGhiViPham, coTheBaoCase: quyen.coTheBaoCase, coTheXuLyYThuc: quyen.coTheGhiViPham && !!d.xuLyYThuc,
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
      {/* OV-12e (mockup v3 §8): ⋯ → Xác nhận xử lý mở panel ngay trên trang; ✕ / Esc về đúng dòng. */}
      {mo?.viec === 'xu-ly-y-thuc' && <XacNhanXuLyPanel studentId={mo.id} lop={maLop} onClose={() => setMo(null)} onDone={onDone} />}
      <ChuyenLopPanel open={mo?.viec === 'chuyen-lop' || mo?.viec === 'de-xuat-chuyen-lop'} cheDo={mo?.viec === 'de-xuat-chuyen-lop' ? 'de-xuat' : 'lenh'} onClose={() => setMo(null)}
        studentId={mo?.id ?? 0} studentName={mo?.ten} lop={maLop} onDone={xong} />
      {mo?.viec === 'hoc-lai' && (
        <StudentManagePanel viec="hoc-lai" onClose={() => setMo(null)} student={{ id: mo.id, name: mo.ten, classId: null }}
          lop={maLop} cycle={null} attempts={[]} onDone={() => daDoi(mo.id)} quyen={{ canEdit: false }} />
      )}
      {mo?.viec === 'sua-thong-tin' && <SuaThongTinMotEm viec={mo.quanLy} studentId={mo.id} studentName={mo.ten} lop={mo.lop ?? maLop} onClose={() => setMo(null)} onDone={xong} />}
    </>
  );
  return { mucCua, panels };
}
