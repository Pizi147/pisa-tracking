/**
 * TỔNG QUAN ADMIN — tab "Mock Test" (OV-10c, mockup vai 13/10 mục 4). Không hàm đếm thứ hai: mỗi số lấy từ đúng hàm của màn ô đó mở.
 *  · Lượt MT tuần này — `highlights` tuần đầu (Kế hoạch Test `?tuan=` đọc cùng đường).
 *  · Ô điểm chưa nhập (n quá hạn) — `myWork` nhóm Chấm điểm, đếm bằng `demPhamVi` như dòng phạm vi Công việc ("m bài cần chấm"; lọc Quá hạn = `khopLocNhanh`).
 *  · HV chưa có MT tiếp theo — `danhSachLop` của Kế hoạch Test, `chuaCoLichTiep` các lớp FT (em đang học không còn lượt MT nào đã xếp tuần: đã thi hết
 *    lượt đã xếp, hoặc chưa có lượt) — để QL / Admin xem có cần thêm lượt MT. UI-TONG-QUAN (chủ SP 23/10): bỏ ô "Đề nghị dời chờ" (đề nghị ở Test › Lịch).
 *  · GV chấm quá hạn — dòng Chấm điểm quá hạn của `myWork` có người phụ trách (OV-12h: chỉ xem, bỏ Nhắc); bài quá hạn chưa có người giữ (lớp thiếu GV môn)
 *    gộp MỘT dòng "Chưa có GV" (`ownerId` 0) cuối bảng — SUA-CHAM-LAI L9: Σ bài của bảng = "n quá hạn" của ô.
 *    P12 Q12 (chủ SP 25/10): CHỈ góc nhìn Admin — bài S chấm chéo chưa ai nhận KHÔNG quá hạn (`myWork` Admin) — một dòng "Chưa có GV · n bài chờ chấm"
 *    (`choCham`, không hạn) cuối bảng, ngoài Σ quá hạn. QL / GV giữ LT3 (quá hạn, có chuông). Lớp thiếu GV môn vẫn quá hạn ở dòng "Chưa có GV" trên.
 */
import { demPhamVi, khopLocNhanh, laChamCheo } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { t } from '../../../shared/i18n/index.ts';
import { forbidden } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { mondayOf } from '../platform/week.ts';
import { highlights } from './highlights.ts';
import { myWork } from './mywork.ts';
import { phamViXemViec } from './xemViec.ts';
import { danhSachLop } from '../keHoach/keHoachTest.ts';

export type GvQuaHan = {
  key: string; ownerId: number; gv: string; kyNang: string; lop: string | null; luot: string | null; soBai: number; han: string | null;
  /** Q12: dòng S chấm chéo chưa ai nhận — chờ chấm, không quá hạn. */
  choCham?: true;
};
export type TongQuanMt = {
  tuan: string;
  luotTuanNay: { so: number; soLop: number };
  oChuaNhap: { so: number; quaHan: number };
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
  const keHoach = danhSachLop(p, { branchId });

  const quaHan = ((w.items ?? []) as any[]).filter((it) => it.group === 'score' && it.urgency === 'overdue');
  const gvQuaHan: GvQuaHan[] = quaHan.filter((it) => it.ownerId !== null)
    .map((it) => ({
      key: it.key, ownerId: it.ownerId, gv: it.owner ?? '', kyNang: it.reason, lop: it.classCode ?? null, luot: it.contextLabel ?? null,
      soBai: it.soBai ?? 0, han: it.due ?? null,
    }));
  const chuaCoGv = (ds: any[], key: string, choCham: boolean) => {
    if (!ds.length) return;
    const deu = (k: string) => [...new Set(ds.map((it) => it[k]).filter(Boolean))].join(', ') || null;
    gvQuaHan.push({
      key, ownerId: 0, gv: t('Chưa có GV'), kyNang: deu('reason') ?? '', lop: deu('classCode'), luot: null,
      soBai: ds.reduce((n, it) => n + (it.soBai ?? 0), 0), han: choCham ? null : ds.map((it) => it.due).filter(Boolean).sort()[0] ?? null,
      ...(choCham ? { choCham: true as const } : {}),
    });
  };
  chuaCoGv(quaHan.filter((it) => it.ownerId === null), 'chua-co-gv', false);
  chuaCoGv(((w.items ?? []) as any[]).filter((it) => it.group === 'score' && it.ownerId === null && it.urgency !== 'overdue' && laChamCheo(it.kind, it.kn)), 'cham-cheo-chua-nhan', true);

  return {
    tuan: tuanDau?.weekStart ?? mondayOf(today),
    luotTuanNay: { so: tuanDau?.ft.mockStudents ?? 0, soLop: tuanDau?.ft.mockClasses.length ?? 0 },
    oChuaNhap: {
      so: demPhamVi(dong, true).so,
      quaHan: demPhamVi(dong.filter((d) => khopLocNhanh(d, 'qua-han', today)), true, { loc: 'qua-han', homNay: today }).so,   // OV-11c: chỉ bài quá hạn
    },
    chuaXepLich: keHoach.lop.filter((l) => l.loai === 'ft').reduce((n, l) => n + l.chuaCoLichTiep, 0),
    gvQuaHan,
  };
}
