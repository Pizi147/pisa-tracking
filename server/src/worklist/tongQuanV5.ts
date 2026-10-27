import { db } from '../db.ts';
import { khoangMacDinh, type ChuongTrinh } from '../../../shared/domain/index.ts';
import { t } from '../../../shared/i18n/index.ts';
import { badRequest, forbidden } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { bangChiNhanh } from './bangChiNhanh.ts';
import { treCham } from './tongQuanQl.ts';
import { tapDatMt, tapKqMt, tapThiThangNayLop } from '../phanTich/baoCao.ts';
import type { MetricRow } from './metrics.ts';
import { caseCoPaTheoGv } from '../giaoVien/hoSo.ts';

/**
 * TỔNG QUAN V5 (UI-TONG-QUAN, `thiet-ke/v5/tong-quan.html` phương án B) — MỘT GET cho QL / QT / CX. KHÔNG ĐẾM LẠI: mọi số gọi CHÍNH hàm tập của Báo cáo
 * Phân tích (`tapDatMt`, `tapThiThangNayLop`, `tapKqMt`) và bảng chi nhánh chế độ chú ý (`bangChiNhanh`), rồi chỉ CHIA theo lớp / chi nhánh — nên số ở
 * Tổng quan = số ở Phân tích, ô bấm mở đúng panel của hàm đó (`/phan-tich/bao-cao/o`, `/tong-quan/chi-nhanh/o`, `/tong-quan/gv-tre`).
 * Kỳ = 2 tuần hoàn chỉnh vừa qua (mặc định Báo cáo); Case, SOS, Thi tháng này = tại lúc xem.
 */
type TyLeV5 = { dat: number; mau: number };
export type DongLopV5 = {
  id: number; khoa: string; ma: string; hv: number; gvcn: string | null;
  datMt: TyLeV5 | null; sos: [number, number, number]; caseChuaPa: number; thiThangNay: number;
};
export type DongCnV5 = {
  id: number; khoa: string; ten: string; datMt: TyLeV5 | null; casePa: { coPa: number; mo: number };
  thiThat: TyLeV5 | null; thiThangNay: number; sos23: number; caseChuaPa: number;
};
export type TongQuanV5 = {
  homNay: string; ky: { tu: string; den: string }; ct: ChuongTrinh; branchId: number | null; tenChiNhanh: string | null;
  datMt: (TyLeV5 & { chuaDu: number }) | null; casePa: { coPa: number; mo: number; chuaPa: number }; thiThangNay: number;
  thiThat: TyLeV5 | null;
  /** Chế độ lớp (một chi nhánh) — Lớp cần chú ý. */ lop: DongLopV5[] | null;
  /** Chế độ chi nhánh (QT / CX chưa chọn chi nhánh). */ chiNhanh: DongCnV5[] | null;
  tre: ReturnType<typeof treCham>['dong'];
  /** XM-2 (chủ SP 23/10): "Case có PA" theo người phụ trách (chế độ lớp) — mẫu = Case đang mở của GV (`caseMoTheoChu`), tử = mẫu trừ Case chưa chốt PA. */
  caseGv: Record<number, { coPa: number; mo: number }>;
};

const tang = (m: Map<number, number>, k: number | undefined) => { if (k !== undefined) m.set(k, (m.get(k) ?? 0) + 1); };

export function tongQuanV5(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh; ky?: { tu: string; den: string } | null }): TongQuanV5 {
  const homNay = demoToday();
  /* UI-PHAN-TICH: Báo cáo HV gọi CHÍNH hàm này với khoảng đang chọn — số Báo cáo = số Tổng quan khi cùng kỳ. */
  const ky = f.ky ?? khoangMacDinh(homNay);
  const bang = bangChiNhanh(p, { branchId: f.branchId ?? null, ct: f.ct, chuY: true });
  const ft = f.ct === 'ft';
  const loc = { branchId: bang.branchId, ct: f.ct, tu: ky.tu, den: ky.den };
  const dm = ft ? tapDatMt(p, loc) : null;
  /* Có kỳ (Báo cáo HV) → "Thi trong kỳ" = ngày thi trong kỳ; không kỳ (Tổng quan) → tháng hiện tại. */
  const thi = tapThiThangNayLop(p, loc, f.ky);

  /* lớp → chi nhánh (chế độ chi nhánh) — từ chính hàng của bảng. */
  const cnCua = new Map<number, number>();
  const cnTheoMa = new Map<string, number>();
  for (const h of bang.hang) for (const l of h.loai === 'lop' ? [h] : h.lop ?? []) { cnCua.set(l.id, h.loai === 'lop' ? 0 : h.id); cnTheoMa.set(l.nhan, h.loai === 'lop' ? 0 : h.id); }
  const theo = (khoa: (lop: number) => number | undefined) => {
    const mau = new Map<number, number>(), dat = new Map<number, number>(), th = new Map<number, number>();
    for (const s of dm?.mau ?? []) { const k = khoa(dm!.luot.get(s)!.classId); tang(mau, k); if (dm!.dat.has(s)) tang(dat, k); }
    for (const x of thi.values()) tang(th, khoa(x.lop));
    return { datMt: (k: number): TyLeV5 | null => (dm ? { dat: dat.get(k) ?? 0, mau: mau.get(k) ?? 0 } : null), thi: (k: number) => th.get(k) ?? 0 };
  };

  /* Đạt Target thi thật: CHÍNH hàng "Thi thật" của Kết quả MT — em theo lớp của dòng; mẫu = em có Overall + Target. Chỉ FT. Cả hai chế độ (CX xem tổng). */
  const tt = ft ? tapKqMt(p, loc).get('thi') : null;
  const thiThat: TyLeV5 | null = tt ? [...tt.values()].reduce((a, e) => (e.cot === 'chua-du' ? a : { dat: a.dat + (e.cot === 'dat' ? 1 : 0), mau: a.mau + 1 }), { dat: 0, mau: 0 }) : null;
  let lop: DongLopV5[] | null = null;
  let chiNhanh: DongCnV5[] | null = null;
  const caseGv: TongQuanV5['caseGv'] = {};
  if (bang.cheDo === 'lop') {
    const s = theo((l) => l);
    lop = bang.hang.map((h) => ({
      id: h.id, khoa: h.khoa, ma: h.nhan, hv: h.o.hocVien.n, gvcn: h.gvcn ?? null,
      datMt: s.datMt(h.id), sos: [h.o.sos1.n, h.o.sos2.n, h.o.sos3.n], caseChuaPa: h.o.caseChuaChot.n, thiThangNay: s.thi(h.id),
    }));
    if (bang.branchId) for (const [gv, x] of caseCoPaTheoGv(p, bang.branchId, f.ct)) caseGv[gv] = x;
  } else {
    const s = theo((l) => cnCua.get(l));
    const ttMau = new Map<number, number>(), ttDat = new Map<number, number>();
    for (const e of tt?.values() ?? []) {
      if (e.cot === 'chua-du') continue;
      const k = cnTheoMa.get(e.lop);
      tang(ttMau, k); if (e.cot === 'dat') tang(ttDat, k);
    }
    chiNhanh = bang.hang.map((h) => ({
      id: h.id, khoa: h.khoa, ten: h.nhan, datMt: s.datMt(h.id),
      casePa: { coPa: Math.max(0, h.o.caseMo.n - h.o.caseChuaChot.n), mo: h.o.caseMo.n },
      thiThat: tt ? { dat: ttDat.get(h.id) ?? 0, mau: ttMau.get(h.id) ?? 0 } : null,
      thiThangNay: s.thi(h.id), sos23: h.o.sos2.n + h.o.sos3.n, caseChuaPa: h.o.caseChuaChot.n,
    }));
  }
  const mo = bang.tong.caseMo.n, chuaPa = bang.tong.caseChuaChot.n;
  return {
    homNay, ky: { tu: ky.tu, den: ky.den }, ct: f.ct, branchId: bang.branchId, tenChiNhanh: bang.tenChiNhanh,
    datMt: dm ? { dat: dm.dat.size, mau: dm.mau.size, chuaDu: dm.chuaDu.size } : null,
    casePa: { coPa: Math.max(0, mo - chuaPa), mo, chuaPa }, thiThangNay: thi.size, thiThat,
    lop, chiNhanh,
    tre: bang.cheDo === 'lop' ? treCham(p, bang.branchId, f.ct).dong : [],
    caseGv,
  };
}

/**
 * TỔNG QUAN TVV (`08` V5-D: chỉ 3 nhóm — Xử lý đúng hạn · Thi tháng này · Chờ KQ / Lộ trình tiếp). Chỉ HV của tôi (`students.consultant_user_id`).
 * "Báo PH đúng hạn" (K6, `05` #12): việc Báo PH PHÁT SINH trong kỳ (tạo trong kỳ, không bị bỏ) — đúng hạn = đã báo, lần "đã báo" ≤ hạn; panel nêu "xong trễ n".
 * Mẫu 0 → web ghi "Chưa có dữ liệu". Chờ KQ / bước tiếp = chip Học viên & Lớp (`/tong-quan/hoc-vien`), web đọc thẳng.
 */
type DongBaoPh = { id: number; hv: number; ten: string; nhan: string; han: string; trangThai: string; ngayBao: string | null };
function baoPhTrongKy(p: Principal, ky: { tu: string; den: string }): DongBaoPh[] {
  return (db().prepare(
    `SELECT v.id, v.student_id AS hv, s.full_name AS ten, v.nhan, v.han, v.trang_thai AS trangThai,
            (SELECT MIN(l.ngay) FROM viec_bao_ph_lan l WHERE l.viec_id = v.id AND l.ket_qua = 'da_bao') AS ngayBao
       FROM viec_bao_ph v JOIN students s ON s.id = v.student_id
      WHERE s.consultant_user_id = ? AND v.trang_thai != 'bo' AND substr(v.tao_luc, 1, 10) BETWEEN ? AND ? ORDER BY v.han, v.id`,
  ).all(p.userId, ky.tu, ky.den) as DongBaoPh[]);
}
const dungHan = (d: DongBaoPh) => d.trangThai === 'xong' && !!d.ngayBao && d.ngayBao.slice(0, 10) <= d.han;

export function tongQuanTvv(p: Principal): { homNay: string; ky: { tu: string; den: string }; baoPh: { dung: number; tong: number; treXong: number }; thiThangNay: number } {
  if (!p.roleKeys.includes('consultant')) throw forbidden('Trang này dành cho TVV.');
  const homNay = demoToday();
  const ky = khoangMacDinh(homNay);
  const ds = baoPhTrongKy(p, ky);
  const thang = homNay.slice(0, 7);
  const thi = (db().prepare(
    `SELECT COUNT(DISTINCT cy.student_id) AS n FROM learning_cycles cy JOIN students s ON s.id = cy.student_id
      WHERE s.consultant_user_id = ? AND s.archived_at IS NULL AND cy.status != 'abandoned' AND cy.exam_date BETWEEN ? AND ?`,
  ).get(p.userId, `${thang}-01`, `${thang}-31`) as { n: number }).n;
  return {
    homNay, ky: { tu: ky.tu, den: ky.den },
    baoPh: { dung: ds.filter(dungHan).length, tong: ds.length, treXong: ds.filter((d) => d.trangThai === 'xong' && !dungHan(d)).length },
    thiThangNay: thi,
  };
}

/** Panel "Báo PH đúng hạn" (chỉ đọc): CHÍNH tập của số — chưa đúng hạn trước; dòng phụ nhãn · hạn dd/mm · tình trạng. */
export function oTongQuanTvv(p: Principal, o: string): { n: number; tieuDe: string; rows: MetricRow[] } {
  if (!p.roleKeys.includes('consultant')) throw forbidden('Trang này dành cho TVV.');
  if (o !== 'bao-ph') throw badRequest('Số này không có ở Tổng quan.');
  const ds = baoPhTrongKy(p, khoangMacDinh(demoToday())).sort((a, b) => Number(dungHan(a)) - Number(dungHan(b)) || a.han.localeCompare(b.han));
  const dd = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const tre = ds.filter((d) => d.trangThai === 'xong' && !dungHan(d)).length;
  return {
    n: ds.length,
    tieuDe: t('Báo PH đúng hạn · {dung}/{tong} việc · xong trễ {tre}', { dung: ds.filter(dungHan).length, tong: ds.length, tre }),
    rows: ds.map((d) => ({
      id: d.id, title: d.ten, href: `/hoc-vien/${d.hv}`,
      sub: [d.nhan, t('hạn {ngay}', { ngay: dd(d.han) }), dungHan(d) ? t('Đúng hạn') : d.trangThai === 'xong' ? t('Xong trễ') : t('Chưa báo')].join(' · '),
    })),
  };
}
