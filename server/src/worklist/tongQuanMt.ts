/**
 * TỔNG QUAN ADMIN — tab "Mock Test" (OV-10c, mockup vai 13/10 mục 4). Không hàm đếm thứ hai: mỗi số lấy từ đúng hàm của màn ô đó mở.
 *  · Lượt MT tuần này — `highlights` tuần đầu (Kế hoạch Test `?tuan=` đọc cùng đường).
 *  · Ô điểm chưa nhập (n quá hạn) — `myWork` nhóm Chấm điểm, đếm bằng `demPhamVi` như dòng phạm vi Công việc ("m bài cần chấm"; lọc Quá hạn = `khopLocNhanh`).
 *  · HV chưa đủ MT — `danhSachLop` của Kế hoạch Test, `chuaCoLichTiep` các lớp FT (XEP-MT-NHAC 07/11: em có lộ trình thiếu MT — `thieuMt`,
 *    mọi lượt Mock đã tạo < 3 / RF 2) — để QL / Admin xem có cần thêm lượt MT. UI-TONG-QUAN (chủ SP 23/10): bỏ ô "Đề nghị dời chờ" (đề nghị ở Test › Lịch).
 *  · GV chấm quá hạn — dòng Chấm điểm quá hạn của `myWork` có người phụ trách (OV-12h: chỉ xem, bỏ Nhắc); bài quá hạn chưa có người giữ (lớp thiếu GV môn)
 *    gộp MỘT dòng "Chưa có GV" (`ownerId` 0) cuối bảng — SUA-CHAM-LAI L9: Σ bài của bảng = "n quá hạn" của ô.
 *    P12 Q12 (chủ SP 25/10): CHỈ góc nhìn Admin — bài S chấm chéo chưa ai nhận KHÔNG quá hạn (`myWork` Admin) — một dòng "Chưa có GV · n bài chờ chấm"
 *    (`choCham`, không hạn) cuối bảng, ngoài Σ quá hạn. QL / GV giữ LT3 (quá hạn, có chuông). Lớp thiếu GV môn vẫn quá hạn ở dòng "Chưa có GV" trên.
 */
import { PERMISSIONS, demPhamVi, khopLocNhanh, laChamCheo } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { t } from '../../../shared/i18n/index.ts';
import { forbidden } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { mondayOf } from '../platform/week.ts';
import { highlights } from './highlights.ts';
import { myWork } from './mywork.ts';
import { phamViXemViec } from './xemViec.ts';
import { danhSachLop } from '../keHoach/keHoachTest.ts';
import { bangLop } from '../permissions.ts';
import { cheDoCua } from '../normal/regular.ts';
import { overdueScoreBai } from './metrics.ts';

export type GvQuaHan = {
  key: string; ownerId: number; gv: string; kyNang: string; lop: string | null; luot: string | null; soBai: number; han: string | null;
  /** Q12: dòng S chấm chéo chưa ai nhận — chờ chấm, không quá hạn. */
  choCham?: true;
};
export type TongQuanMt = {
  tuan: string;
  luotTuanNay: { so: number; soLop: number };
  oChuaNhap: { so: number; quaHan: number };
  /** null: BPXL — Kế hoạch Test cộng từ danh sách lớp đã nạp (không đọc `danhSachLop` lần hai trong một trang). */
  chuaXepLich: number | null;
  gvQuaHan: GvQuaHan[];
  /** BPXL-2 (N57): lớp của hai số dải lặng — bấm số lọc danh sách lớp trên dữ liệu này (không request thêm). */
  lopCo?: { bai: Record<number, number>; luot: number[] };
};

/** M6 6b-4 (Q8): tập "GV chấm quá hạn" của Admin — khối Tổng quan và panel của nó (`gvTre`) lọc CÙNG hàm này trên `myWork` (Admin, tất cả).
 *  `choCham`: S chấm chéo chưa ai nhận — chờ chấm, ngoài Σ quá hạn (Q12). */
export function viecQuaHanAdmin(items: readonly any[]): { quaHan: any[]; choCham: any[] } {
  const score = items.filter((it) => it.group === 'score');
  return {
    quaHan: score.filter((it) => it.urgency === 'overdue'),
    choCham: score.filter((it) => it.ownerId === null && it.urgency !== 'overdue' && laChamCheo(it.kind, it.kn)),
  };
}

/** Có vai BPXL còn quyền xếp lịch (`plan.week`) ở một chi nhánh nào đó. */
const laBpxl = (p: Principal) => p.grants.some((g) => g.roleKey === 'scheduler' && g.permissions.has(PERMISSIONS.PLAN_WEEK));

export function tongQuanMt(p: Principal, f: { branchId?: number | null } = {}): TongQuanMt {
  /* BPXL-1 (N57): Chuyên viên Xếp lịch đọc cùng khối trong phạm vi chi nhánh của mình — không có việc Chấm điểm (không bị giao việc) → bỏ lượt `myWork`. */
  const cham = phamViXemViec(p) === 'cham-diem';
  const bpxl = !cham && laBpxl(p);
  if (!cham && !bpxl) throw forbidden('Khối Mock Test chỉ dành cho Admin.');
  const today = demoToday();
  const branchId = f.branchId ?? null;

  const tuanDau = highlights(p, { branchId, program: 'ft' }).weeks[0];
  if (bpxl) {
    /*
     * BPXL-2: dải số lặng của Kế hoạch Test. "Bài chưa có điểm" = mọi bài nợ điểm (`scoreDebtCells` qua `overdueScoreBai`, bỏ lọc quá hạn — cùng tập
     * và phạm vi quyền với "Quá hạn chấm" Lịch Test / "Bài quá hạn" Tổng quan) của lớp Fast Track; "Lượt thi tuần này" = `highlights` tuần đầu như Admin.
     */
    const bl = bangLop();
    const ft = [...bl.keys()].filter((id) => cheDoCua(bl.get(id)?.ct) === 'ielts_band');
    const no = ft.length ? overdueScoreBai(p, branchId, today, ft, true) : { ids: [], lopCua: new Map<number, number>() };
    const bai: Record<number, number> = {};
    for (const id of no.ids) { const c = no.lopCua.get(id)!; bai[c] = (bai[c] ?? 0) + 1; }
    return {
      tuan: tuanDau?.weekStart ?? mondayOf(today),
      luotTuanNay: { so: tuanDau?.ft.mockStudents ?? 0, soLop: tuanDau?.ft.mockClasses.length ?? 0 },
      oChuaNhap: { so: no.ids.length, quaHan: 0 },
      chuaXepLich: null,
      gvQuaHan: [],
      lopCo: { bai, luot: (tuanDau?.ft.mockClasses ?? []).map((m) => m.id).filter((id): id is number => id !== null) },
    };
  }
  const w = myWork(p, { branchId, nguoi: 'tat-ca' }) as any;
  const dong = (w.dong ?? []) as any[];
  const keHoach = danhSachLop(p, { branchId });

  const { quaHan, choCham } = viecQuaHanAdmin(w.items ?? []);
  const gvQuaHan: GvQuaHan[] = quaHan.filter((it) => it.ownerId !== null)
    .map((it) => ({
      key: it.key, ownerId: it.ownerId, gv: it.owner ?? '', kyNang: it.reason, lop: it.classCode ?? null, luot: it.contextLabel ?? null,
      soBai: it.soBai ?? 0, han: it.due ?? null,
    }));
  const chuaCoGv = (ds: any[], key: string, choCham: boolean, gv = t('Chưa có GV')) => {
    if (!ds.length) return;
    const deu = (k: string) => [...new Set(ds.map((it) => it[k]).filter(Boolean))].join(', ') || null;
    gvQuaHan.push({
      key, ownerId: 0, gv, kyNang: deu('reason') ?? '', lop: deu('classCode'), luot: null,
      soBai: ds.reduce((n, it) => n + (it.soBai ?? 0), 0), han: choCham ? null : ds.map((it) => it.due).filter(Boolean).sort()[0] ?? null,
      ...(choCham ? { choCham: true as const } : {}),
    });
  };
  /* Rà 11/11 #2 (G5-03): S chấm chéo chưa ai nhận là nhóm riêng, không "Chưa có GV" (lớp đã có phân công) — cùng chữ "quá hạn" như GV / QL. */
  const cheo = (it: any) => laChamCheo(it.kind, it.kn);
  chuaCoGv(quaHan.filter((it) => it.ownerId === null && !cheo(it)), 'chua-co-gv', false);
  chuaCoGv(quaHan.filter((it) => it.ownerId === null && cheo(it)), 'cham-cheo-qua-han', false, t('Speaking chấm chéo'));
  chuaCoGv(choCham, 'cham-cheo-chua-nhan', true, t('Speaking chấm chéo'));

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
