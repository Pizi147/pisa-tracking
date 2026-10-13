/**
 * TỔNG QUAN ADMIN — tab "Mock Test" (OV-10c, mockup vai 13/10 mục 4). Không hàm đếm thứ hai: mỗi số lấy từ đúng hàm của màn ô đó mở.
 *  · Lượt MT tuần này — `highlights` tuần đầu (Kế hoạch Test `?tuan=` đọc cùng đường).
 *  · Ô điểm chưa nhập (n quá hạn) — `myWork` nhóm Chấm điểm, đếm bằng `demPhamVi` như dòng phạm vi Công việc ("m bài cần chấm"; lọc Quá hạn = `khopLocNhanh`).
 *  · Đề nghị dời chờ — `lichTest` tuần này, cột `choDuyetDoi` (hàng lớp Lịch Test ghi "n bài vắng · chờ Quản lý duyệt dời").
 *  · MT chưa xếp lịch — `danhSachLop` của Kế hoạch Test, `chuaCoLichTiep` các lớp FT (em đang học không có lượt MT nào có tuần).
 *  · GV chấm quá hạn — dòng Chấm điểm quá hạn của `myWork` có người phụ trách; Nhắc = `POST /my-work/nhac` (một lần / dòng / ngày, như Công việc).
 */
import { demPhamVi, khopLocNhanh } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { forbidden } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { highlights } from './highlights.ts';
import { myWork } from './mywork.ts';
import { phamViXemViec } from './xemViec.ts';
import { lichTest } from '../cham/canCham.ts';
import { danhSachLop } from '../keHoach/keHoachTest.ts';

export type GvQuaHan = {
  key: string; ownerId: number; gv: string; kyNang: string; lop: string | null; luot: string | null; soBai: number; han: string | null;
  daNhacLuc: string | null;
};
export type TongQuanMt = {
  tuan: string;
  luotTuanNay: { so: number; soLop: number };
  oChuaNhap: { so: number; quaHan: number };
  deNghiDoi: number;
  chuaXepLich: number;
  gvQuaHan: GvQuaHan[];
};

export function tongQuanMt(p: Principal, f: { branchId?: number | null } = {}): TongQuanMt {
  if (phamViXemViec(p) !== 'cham-diem') throw forbidden('Khối Mock Test chỉ dành cho Admin.');
  const today = demoToday();
  const branchId = f.branchId ?? null;

  const tuanDau = highlights(p, { branchId, program: 'ft' }).weeks[0];
  const w = myWork(p, { branchId, nguoi: 'tat-ca' }) as any;
  const dong = (w.dong ?? []) as any[];
  const lich = lichTest(p, ensurePeriod(today).id, branchId, today, { phamVi: 'tat-ca' });
  const keHoach = danhSachLop(p, { branchId });

  const gvQuaHan: GvQuaHan[] = ((w.items ?? []) as any[])
    .filter((it) => it.group === 'score' && it.urgency === 'overdue' && it.ownerId !== null)
    .map((it) => ({
      key: it.key, ownerId: it.ownerId, gv: it.owner ?? '', kyNang: it.reason, lop: it.classCode ?? null, luot: it.contextLabel ?? null,
      soBai: it.soBai ?? 0, han: it.due ?? null, daNhacLuc: it.nhac?.daNhacLuc ?? null,
    }));

  return {
    tuan: tuanDau?.weekStart ?? mondayOf(today),
    luotTuanNay: { so: tuanDau?.ft.mockStudents ?? 0, soLop: tuanDau?.ft.mockClasses.length ?? 0 },
    oChuaNhap: {
      so: demPhamVi(dong, true).so,
      quaHan: demPhamVi(dong.filter((d) => khopLocNhanh(d, 'qua-han', today)), true).so,
    },
    deNghiDoi: lich.lop.reduce((n, l) => n + l.choDuyetDoi, 0),
    chuaXepLich: keHoach.lop.filter((l) => l.loai === 'ft').reduce((n, l) => n + l.chuaCoLichTiep, 0),
    gvQuaHan,
  };
}
