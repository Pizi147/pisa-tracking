import { db } from '../db.ts';
import { dauNgayVnUtc, hanBaoPhHieuLuc, khoangMacDinh, type ChuongTrinh } from '../../../shared/domain/index.ts';
import { t } from '../../../shared/i18n/index.ts';
import { addDays, badRequest, forbidden } from '../util.ts';
import { bangLop, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { khoangTamDung } from '../students/tamDung.ts';
import { bangChiNhanh } from './bangChiNhanh.ts';
import { tapDatMt, tapKqMt, tapThiThangNayLop, tapThiThangNayTvv } from '../phanTich/baoCao.ts';
import type { MetricRow } from './metrics.ts';

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
  /** NHẸ HƠN PR-3: id em SOS 2–3 của lớp (tập sẵn trong bộ nhớ của `bangChiNhanh`) — panel "Em SOS cần chú ý" đọc đúng các em này khi bấm. */
  sos23Ids: number[];
};
export type DongCnV5 = {
  id: number; khoa: string; ten: string; datMt: TyLeV5 | null; casePa: { coPa: number; mo: number };
  thiThat: TyLeV5 | null; thiThangNay: number; sos23: number;
  /** TQ-SOS-CN: id em của ô SOS 2–3 (panel đọc đúng các em này khi bấm). */
  sos23Ids: number[]; caseChuaPa: number;
};
/** NHẸ HƠN PR-3: lớp của MỌI chi nhánh (chế độ chi nhánh — Quản trị "Toàn hệ thống") cho cột SOS 2–3 của "Lớp cần chú ý"; con có sẵn của `bangChiNhanh`, +0 câu. */
export type DongLopCnV5 = { id: number; ma: string; cn: string; sos: [number, number, number]; sos23Ids: number[] };
export type TongQuanV5 = {
  homNay: string; ky: { tu: string; den: string }; ct: ChuongTrinh; branchId: number | null; tenChiNhanh: string | null;
  datMt: (TyLeV5 & { chuaDu: number }) | null; casePa: { coPa: number; mo: number; chuaPa: number }; thiThangNay: number;
  thiThat: TyLeV5 | null;
  /** Chế độ lớp (một chi nhánh) — Lớp cần chú ý. */ lop: DongLopV5[] | null;
  /** Chế độ chi nhánh (QT / CX chưa chọn chi nhánh). */ chiNhanh: DongCnV5[] | null;
  /** NHẸ HƠN PR-3: lớp của mọi chi nhánh — chỉ chế độ chi nhánh. */ lopCn: DongLopCnV5[] | null;
  /** NHẸ HƠN PR-3: SOS 1 · 2 · 3 hiện tại của cả phạm vi (khối Tình hình). */ sos: [number, number, number];
};

const tang = (m: Map<number, number>, k: number | undefined) => { if (k !== undefined) m.set(k, (m.get(k) ?? 0) + 1); };

export function tongQuanV5(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh; ky?: { tu: string; den: string } | null;
  /** NHẸ HƠN PR-3 (PTA rà #2002, Turso): Tổng quan v23 chỉ hiện SOS + Tình hình — bảng không tính Case / dưới kỳ vọng / nợ điểm (các số đó = 0 trong kết quả). */ gon?: boolean }): TongQuanV5 {
  const homNay = demoToday();
  /* UI-PHAN-TICH: Báo cáo HV gọi CHÍNH hàm này với khoảng đang chọn — số Báo cáo = số Tổng quan khi cùng kỳ. */
  const ky = f.ky ?? khoangMacDinh(homNay);
  const bang = bangChiNhanh(p, { branchId: f.branchId ?? null, ct: f.ct, chuY: true, chiSos: f.gon });
  const ft = f.ct === 'ft';
  const loc = { branchId: bang.branchId, ct: f.ct, tu: ky.tu, den: ky.den };
  const dm = ft ? tapDatMt(p, loc) : null;
  /* Có kỳ (Báo cáo HV) → "Thi trong kỳ" = ngày thi trong kỳ; không kỳ (Tổng quan) → tháng hiện tại. */
  const thi = tapThiThangNayLop(p, loc, f.ky);

  /* lớp → chi nhánh (chế độ chi nhánh): bảng lớp ĐỦ (`bangLop`, nhớ tiến trình, 0 câu) theo ID — rà 25/11 PR 2: trước lấy từ hàng của bảng (chỉ lớp đang
     chạy) và chia "Đạt Target thi thật" theo MÃ lớp, nên em của lớp đã kết thúc rơi khỏi hàng chi nhánh → tổng các hàng < ô tổng. */
  const cnCua = (lop: number | null | undefined) => (lop == null ? undefined : bangLop().get(lop)?.branchId ?? undefined);
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
  let lopCn: DongLopCnV5[] | null = null;
  if (bang.cheDo === 'lop') {
    const s = theo((l) => l);
    lop = bang.hang.map((h) => ({
      id: h.id, khoa: h.khoa, ma: h.nhan, hv: h.o.hocVien.n, gvcn: h.gvcn ?? null,
      datMt: s.datMt(h.id), sos: [h.o.sos1.n, h.o.sos2.n, h.o.sos3.n], caseChuaPa: h.o.caseChuaChot.n, thiThangNay: s.thi(h.id), sos23Ids: h.sos23 ?? [],
    }));
  } else {
    const s = theo(cnCua);
    const ttMau = new Map<number, number>(), ttDat = new Map<number, number>();
    for (const e of tt?.values() ?? []) {
      if (e.cot === 'chua-du') continue;
      const k = cnCua(e.lopId);
      tang(ttMau, k); if (e.cot === 'dat') tang(ttDat, k);
    }
    chiNhanh = bang.hang.map((h) => ({
      id: h.id, khoa: h.khoa, ten: h.nhan, datMt: s.datMt(h.id),
      casePa: { coPa: Math.max(0, h.o.caseMo.n - h.o.caseChuaChot.n), mo: h.o.caseMo.n },
      thiThat: tt ? { dat: ttDat.get(h.id) ?? 0, mau: ttMau.get(h.id) ?? 0 } : null,
      thiThangNay: s.thi(h.id), sos23: h.o.sos2.n + h.o.sos3.n, sos23Ids: h.sos23 ?? [], caseChuaPa: h.o.caseChuaChot.n,
    }));
    lopCn = bang.hang.flatMap((h) => (h.lop ?? []).map((l) => ({ id: l.id, ma: l.nhan, cn: h.nhan, sos: [l.o.sos1.n, l.o.sos2.n, l.o.sos3.n] as [number, number, number], sos23Ids: l.sos23 ?? [] })));
  }
  const mo = bang.tong.caseMo.n, chuaPa = bang.tong.caseChuaChot.n;
  return {
    homNay, ky: { tu: ky.tu, den: ky.den }, ct: f.ct, branchId: bang.branchId, tenChiNhanh: bang.tenChiNhanh,
    datMt: dm ? { dat: dm.dat.size, mau: dm.mau.size, chuaDu: dm.chuaDu.size } : null,
    casePa: { coPa: Math.max(0, mo - chuaPa), mo, chuaPa }, thiThangNay: thi.size, thiThat,
    lop, chiNhanh, lopCn,
    sos: [bang.tong.sos1.n, bang.tong.sos2.n, bang.tong.sos3.n],
  };
}

/**
 * TỔNG QUAN TVV (`08` V5-D: chỉ 3 nhóm — Xử lý đúng hạn · Thi tháng này · Chờ KQ / Lộ trình tiếp). Chỉ HV của tôi (`students.consultant_user_id`).
 * "Báo PH đúng hạn" (K6, `05` #12): việc Báo PH PHÁT SINH trong kỳ (tạo trong kỳ, không bị bỏ) — đúng hạn = đã báo, lần "đã báo" ≤ hạn; panel nêu "xong trễ n".
 * Mẫu 0 → web ghi "Chưa có dữ liệu". Chờ KQ / bước tiếp = chip Học viên & Lớp (`/tong-quan/hoc-vien`), web đọc thẳng.
 */
type DongBaoPh = { id: number; hv: number; ten: string; nhan: string; han: string; trangThai: string; ngayBao: string | null };
function baoPhTrongKy(p: Principal, ky: { tu: string; den: string }): DongBaoPh[] {
  const ds = (db().prepare(
    `SELECT v.id, v.student_id AS hv, s.full_name AS ten, v.nhan, v.han, v.han_chon, v.trang_thai AS trangThai,
            (SELECT MIN(l.ngay) FROM viec_bao_ph_lan l WHERE l.viec_id = v.id AND l.ket_qua = 'da_bao') AS ngayBao
       FROM viec_bao_ph v JOIN students s ON s.id = v.student_id
      WHERE COALESCE(v.phu_trach_id, s.consultant_user_id) = ? AND s.status != 'finished'   -- NGHI-HOC-LUU-TRU: bỏ em đã nghỉ học · rà 25/11 PR 2: người giữ như sổ đúng hạn (viecDaXong)
        AND v.trang_thai != 'bo' AND v.phoi_hop_id IS NULL AND v.tao_luc >= ? AND v.tao_luc < ? ORDER BY v.han, v.id`,   // R1-L6: ngày tạo theo giờ VN   // PHOI-HOP-V2: việc Meeting CX tách khỏi Báo PH vi phạm
  ).all(p.userId, dauNgayVnUtc(ky.tu), dauNgayVnUtc(addDays(ky.den, 1))) as (DongBaoPh & { han_chon: string | null })[]);
  /* HAN-BAO-PH (chủ SP 03/11, 17.3): "đúng hạn" so với HẠN HIỆU LỰC (hạn đã chọn, Quay lại học) — cùng hàm với Công việc / hồ sơ; một câu Tạm dừng. */
  const khoang = khoangTamDung([...new Set(ds.map((d) => d.hv))]);
  return ds.map(({ han_chon, ...d }) => ({ ...d, han: hanBaoPhHieuLuc(d.han, khoang[d.hv], han_chon) }));
}
const dungHan = (d: DongBaoPh) => d.trangThai === 'xong' && !!d.ngayBao && d.ngayBao.slice(0, 10) <= d.han;

export function tongQuanTvv(p: Principal): { homNay: string; ky: { tu: string; den: string }; baoPh: { dung: number; tong: number; treXong: number }; thiThangNay: number } {
  if (!p.roleKeys.includes('consultant')) throw forbidden('Trang này dành cho TVV.');
  const homNay = demoToday();
  const ky = khoangMacDinh(homNay);
  const ds = baoPhTrongKy(p, ky);
  const thi = tapThiThangNayTvv(p.userId).size;   // D-05: cùng định nghĩa "Thi tháng này" của QL (`tapThiThangNayLop`), khoanh theo HV của TVV
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
