/**
 * ĐƯỜNG ĐỌC TỔNG KẾT LỘ TRÌNH (PR-TK, TK-7): khối "Các lộ trình" của hồ sơ HV, ngăn "Tổng kết lộ trình", tab "Tổng kết" của lớp đã kết thúc.
 * Lộ trình ĐÃ ĐÓNG đọc từ BẢN CHỤP mới nhất (số đóng băng); lộ trình đang chạy chỉ lấy kết quả sống gần nhất bằng MỘT câu (không gọi `studentProfile`).
 * Quyền kiểm TRƯỚC mọi truy vấn bản chụp: HV = `STUDENT_VIEW` như hồ sơ; lớp = `ATTEMPT_VIEW` như `/classes/:id/overview`.
 */
import { THAM_SO_TOI_DA, db, theoLo } from '../db.ts';
import {
  ASSESSED_SKILLS, MON_GOP, HUONG_TIEP_TK_NHAN, LY_DO_DONG_NHAN, PERMISSIONS, chuKetQuaKyThi, ketQuaKyThi, ketQuaThiThat, type KetQuaKyThi, kyThiCuaChuongTrinh, khoangTuan, luotDaiDien, tenMonNgan, tuanLich,
  type HuongTiepTk, type LyDoDong, ATTEMPT_KIND_LABEL, tenRoute } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { notFound } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { tinhLuot, type NguCanhLuot } from './banChup.ts';
import { coTheNhapThiThat } from './thiThat.ts';
import { trangThaiBuocTiep, type TrangThaiBuocTiep } from './buocTiep.ts';
import { nguongDatLop, programmeByCode } from '../normal/regular.ts';

type Tone = 'ok' | 'soon' | 'late' | 'muted';
/** P13: `kyThi` = số liệu KQ thi thật KET / PET — web ghép chữ bằng `t()` (EN); `chinh` / `phu` giữ cho nơi đọc cũ. */
/** R1-EN-2: `ovr` = Overall thi thật FT — web ghép "Thi thật {ovr}" bằng t() (câu `chinh` giữ cho web cũ). */
export type KetQuaGon = { chinh: string; tone: Tone; phu?: string; kyThi?: KetQuaKyThi; ovr?: number };

const phanTram = (x: number) => `${Math.round(x * 100)}%`;
const nhanHuong = (h: string | null): string | null => (h && h !== 'khong_ro' ? HUONG_TIEP_TK_NHAN[h as HuongTiepTk] ?? null : null);
/** P7: lộ trình "Khác" hiện tên đã ghi (`route_ten` ở lộ trình — bản chụp chỉ giữ mã). */
const tenLoTrinh = (b: { route: string | null; programme_name: string | null }, routeTen?: string | null) => (b.route ? `Fast Track · ${tenRoute({ route: b.route, route_ten: routeTen })}` : b.programme_name ?? 'Lộ trình');
const toneDai = (dai: string | null): Tone => (dai === 'dat' ? 'ok' : dai ? 'soon' : 'muted');

/** Kết quả gọn của một bản chụp (FT: thi thật; lớp thường: % Cuối khoá). */
function ketQuaBanChup(b: any): KetQuaGon | null {
  if (b.route) {
    if (b.ly_do === 'chuyen_lop') return null;   // đóng vì chuyển lớp: em không đi thi
    const k = ketQuaThiThat({ l: b.thi_that_l, r: b.thi_that_r, w: b.thi_that_w, s: b.thi_that_s, khongThi: !!b.thi_that_khong_thi }, b.target);   // OV-9: KCK giữ Target
    if (b.thi_that_ovr !== null && b.thi_that_ovr !== undefined) {
      const phu = b.ket_luan === 'reached' ? 'Đạt Target' : b.ket_luan === 'not_reached' ? 'Chưa đạt Target' : undefined;
      return { chinh: `Thi thật ${b.thi_that_ovr.toFixed(1)}`, ovr: b.thi_that_ovr, tone: b.ket_luan === 'reached' ? 'ok' : b.ket_luan === 'not_reached' ? 'late' : 'muted', phu };
    }
    /* Kết quả CŨ chỉ có kết luận chọn tay (không Overall): vẫn là đã có kết quả. */
    if (b.ket_luan === 'reached' || b.ket_luan === 'not_reached') return { chinh: b.ket_luan === 'reached' ? 'Đạt Target' : 'Chưa đạt Target', tone: b.ket_luan === 'reached' ? 'ok' : 'late' };
    return { chinh: k.nhan === 'Không thi' ? 'Không thi' : 'Chờ kết quả thi thật', tone: 'muted' };
  }
  return b.ty_le_cuoi_khoa === null || b.ty_le_cuoi_khoa === undefined ? null : { chinh: phanTram(b.ty_le_cuoi_khoa), tone: toneDai(b.dai_cuoi_khoa) };
}

/**
 * P13 KET-PET: kết quả thi thật KET / PET (điểm Cambridge) — đọc thẳng lộ trình (không bản chụp; Báo cáo lịch sử không đọc bản chụp), cả khoá đã đóng.
 * Đạt Target so với Target LÚC NHẬP (`thi_that_target`, NULL → Target hiện tại). Không kỳ thi / chưa đủ 4 điểm → null.
 */
function ketQuaKyThiGon(c: any): KetQuaGon | null {
  const kt = !c.route ? kyThiCuaChuongTrinh(c.programme_code) : null;
  const k = kt ? ketQuaKyThi(kt, { ...c, target_score: c.thi_that_target ?? c.target_score }) : null;
  if (!k) return null;
  if (k.khongThi) return { chinh: 'Không thi', tone: 'muted', kyThi: k };
  return { chinh: `Thi thật ${chuKetQuaKyThi(k)}`, tone: k.dat === null ? 'muted' : k.dat ? 'ok' : 'late', phu: k.dat === null ? undefined : k.dat ? 'Đạt Target' : 'Chưa đạt Target', kyThi: k };
}

/** Lượt gần nhất CÓ ĐIỂM của lộ trình đang chạy — một câu cho cả em, tính bằng `tinhLuot` (cùng hàm với bản chụp). */
function ketQuaSong(c: any, attempts: any[], scores: Map<number, any[]>, lich: Map<number, { skill: string }[]>): KetQuaGon | null {
  const laFt = !!c.route;
  const ct = laFt ? null : programmeByCode(c.programme_code);
  const nc: NguCanhLuot = { laFt, route: c.route ?? null, mon: laFt ? [...ASSESSED_SKILLS] : [...(ct?.skills ?? [])], maCt: ct?.code ?? c.programme_code ?? null, kck: !!c.khong_cam_ket };
  for (const a of [...attempts].reverse()) {
    const rows = scores.get(a.id) ?? [];
    if (a.status === 'cancelled' || !rows.some((r) => r.band !== null || r.raw_score !== null)) continue;
    const nguong = nguongDatLop(a.class_id);
    const t = tinhLuot({ ...nc, nguong }, a, a.target_at_attempt ?? null, rows, [], false, lich.get(a.id));
    if (laFt) {
      return { chinh: `MT${a.attempt_no} · ${t.overall !== null ? t.overall.toFixed(1) : '—'}`, tone: t.sos && t.sos > 0 ? 'soon' : 'ok', phu: t.sos && t.sos > 0 ? `SOS ${t.sos}` : undefined };
    }
    if (t.tyLeTong !== null) return { chinh: phanTram(t.tyLeTong), tone: t.tyLeTong >= nguong ? 'ok' : 'soon' };
  }
  return null;
}

export type DongCacLoTrinh = {
  id: number; ten: string; lop: string | null; batDau: string | null; ketThuc: string | null; thoiGian: string; dangHoc: boolean;
  lyDo: LyDoDong | null; ketQua: KetQuaGon | null; huong: string | null;
  /** OV-13m: lộ trình FT mới nhất có kết quả thi thật — "Đã xong · OVR …" + Chọn bước tiếp / Hẹn bắt đầu / chờ QL · TVV. */
  buocTiep: TrangThaiBuocTiep | null;
};

export function cacLoTrinh(p: Principal, studentId: number): DongCacLoTrinh[] {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const homNay = demoToday();
  const cycles = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC').all(studentId) as any[];
  if (!cycles.length) return [];
  const bc = new Map<number, any>();
  for (const b of conn.prepare('SELECT * FROM ban_chup_lo_trinh WHERE student_id = ? ORDER BY lan').all(studentId) as any[]) bc.set(b.cycle_id, b);
  const dangChay = cycles.filter((c) => c.status === 'active');
  const luot = dangChay.length ? conn.prepare(
    `SELECT a.id, a.cycle_id, a.attempt_no, a.status, a.target_at_attempt, a.class_id FROM assessment_attempts a WHERE a.kind != 'mt0' AND a.cycle_id IN (${dangChay.map(() => '?').join(',')}) ORDER BY a.cycle_id, a.attempt_no, a.id`,
  ).all(...dangChay.map((c) => c.id)) as any[] : [];
  const diem = new Map<number, any[]>();
  const lichGop = new Map<number, { skill: string }[]>();   // P13: dòng lịch MÔN GỘP cũ — bộ môn theo lượt (`daGhiLuot`), cùng câu với điểm
  const gop = Object.keys(MON_GOP);
  theoLo(luot.map((a) => a.id as number), (lo, ph) => {
    for (const r of conn.prepare(`SELECT attempt_id AS attempt_id, skill AS skill, band AS band, raw_score AS raw_score, raw_total AS raw_total, 0 AS la_lich FROM assessment_scores WHERE attempt_id IN (${ph})
        UNION ALL SELECT attempt_id, skill, NULL, NULL, NULL, 1 FROM attempt_skills WHERE attempt_id IN (${ph}) AND skill IN (${gop.map(() => '?').join(',')})`).all(...lo, ...lo, ...gop) as any[]) {
      const m: Map<number, any[]> = r.la_lich ? lichGop : diem;
      m.set(r.attempt_id, [...(m.get(r.attempt_id) ?? []), r]);
    }
  }, Math.floor((THAM_SO_TOI_DA - gop.length) / 2));
  const lopDang = dangChay.length ? (conn.prepare(
    `SELECT e.class_id, c.code FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = ? AND e.status IN ('active', 'paused') ORDER BY e.id DESC LIMIT 1`).get(studentId) as any) : null;
  const bt = cycles[0].route ? trangThaiBuocTiep(p, cycles[0].id) : null;   // `cycles` xếp seq giảm: [0] = mới nhất
  return cycles.map((c): DongCacLoTrinh => {
    const b = bc.get(c.id);
    const buocTiep = c.id === cycles[0].id ? bt : null;
    if (c.status === 'active' || !b) {
      const ct = c.route ? null : programmeByCode(c.programme_code);
      const lopCuaLoTrinh = luot.filter((a) => a.cycle_id === c.id);
      return {
        id: c.id, ten: c.route ? `Fast Track · ${tenRoute(c)}` : ct?.name ?? 'Lộ trình', lop: lopDang?.code ?? null, batDau: c.started_at, ketThuc: null,
        thoiGian: khoangTuan(c.started_at, null, homNay), dangHoc: c.status === 'active', lyDo: null,
        ketQua: ketQuaKyThiGon(c) ?? ketQuaSong(c, lopCuaLoTrinh, diem, lichGop), huong: null, buocTiep,
      };
    }
    return {
      id: c.id, ten: tenLoTrinh(b, c.route_ten), lop: b.class_code, batDau: b.bat_dau_ngay, ketThuc: b.dong_ngay, thoiGian: khoangTuan(b.bat_dau_ngay, b.dong_ngay, homNay),
      dangHoc: false, lyDo: b.ly_do, ketQua: ketQuaKyThiGon(c) ?? ketQuaBanChup(b), huong: nhanHuong(b.huong_tiep), buocTiep,
    };
  });
}

// ------------------------------------------------------------------ ngăn "Tổng kết lộ trình"
export type DongLuotTongKet = {
  attemptNo: number; kind: string; nhan: string; lop: string | null; tuan: string | null; trangThai: string; huyLyDo: string | null; huyPhan: boolean;
  kyNang: { k: string; nhan: string; diem: number | null; tong: number | null; dat: boolean | null }[];
  overall: number | null; kyVong: number | null; sos: number | null; tyLe: number | null; ketQua: string | null;
};

const NHAN_LUOT: Record<string, string> = ATTEMPT_KIND_LABEL;

function gomLuot(rows: any[], maCt: string | null, laFt: boolean, homNay: string): DongLuotTongKet[] {
  const theo = new Map<number, any[]>();
  for (const r of rows) { const k = r.attempt_id ?? -r.id; theo.set(k, [...(theo.get(k) ?? []), r]); }
  return [...theo.values()].map((ds) => {
    const a = ds[0];
    const kn = ds.filter((r) => (laFt ? (ASSESSED_SKILLS as readonly string[]).includes(r.ky_nang) : true));
    return {
      attemptNo: a.attempt_no, kind: a.kind, nhan: laFt ? `MT${a.attempt_no}` : NHAN_LUOT[a.kind] ?? a.kind, lop: a.class_code, tuan: a.tuan_bat_dau ? tuanLich(a.tuan_bat_dau, homNay) : null,
      trangThai: a.trang_thai, huyLyDo: a.huy_ly_do, huyPhan: a.trang_thai !== 'cancelled' && kn.some((r) => r.bo_qua === 1),
      kyNang: kn.map((r) => ({ k: r.ky_nang, nhan: laFt ? r.ky_nang[0].toUpperCase() : tenMonNgan(maCt ?? '', r.ky_nang), diem: r.diem, tong: r.diem_tong, dat: r.dat === null ? null : !!r.dat })),
      overall: a.overall, kyVong: a.ky_vong, sos: a.sos, tyLe: a.ty_le_tong, ketQua: a.ket_qua,
    };
  }).sort((x, y) => x.attemptNo - y.attemptNo);
}

const monKqdr = (x: string | null): string[] => { try { const v = JSON.parse(x ?? '[]'); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };

export function tongKetLoTrinh(p: Principal, cycleId: number) {
  const conn = db();
  const c = conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId: c.student_id }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  if (c.status === 'active') throw notFound('Lộ trình chưa kết thúc');
  const b = conn.prepare('SELECT * FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1').get(cycleId) as any;
  if (!b) throw notFound('Lộ trình chưa có bản chụp');
  const hv = conn.prepare('SELECT id, full_name FROM students WHERE id = ?').get(c.student_id) as any;
  const homNay = demoToday();
  const laFt = !!b.route;
  const luot = gomLuot(conn.prepare('SELECT * FROM ban_chup_luot WHERE ban_chup_id = ? ORDER BY attempt_no, id').all(b.id) as any[], b.programme_code, laFt, homNay);
  /* OV-3c: Kết quả đầu ra QL chốt SAU khi đóng lộ trình (thường gặp: MT0 sau ngày chuyển) không có trong bản chụp → đọc dòng hiện tại, bản chụp làm dự phòng. */
  const kv = !laFt && b.class_id
    ? conn.prepare('SELECT ky_vong_dat, ky_vong_nguyen_nhan, ky_vong_mon FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ? AND ky_vong_dat IS NOT NULL').get(c.student_id, b.class_id) as any
    : null;
  const kqdr = kv ? { dat: !!kv.ky_vong_dat, nguyenNhan: kv.ky_vong_nguyen_nhan as string | null, mon: monKqdr(kv.ky_vong_mon) }
    : b.ky_vong_dat === null || b.ky_vong_dat === undefined ? null : { dat: !!b.ky_vong_dat, nguyenNhan: null, mon: [] as string[] };
  const khongCoThi = laFt && b.ly_do === 'chuyen_lop';
  const daCoKq = laFt && (b.thi_that_ovr !== null || b.ket_luan === 'reached' || b.ket_luan === 'not_reached');
  const kq = laFt ? ketQuaThiThat({ l: b.thi_that_l, r: b.thi_that_r, w: b.thi_that_w, s: b.thi_that_s, khongThi: !!b.thi_that_khong_thi }, b.target) : null;
  return {
    hocVien: { id: hv.id as number, ten: hv.full_name as string },
    loTrinhId: cycleId, ten: tenLoTrinh(b, c.route_ten), loai: laFt ? 'ft' as const : 'thuong' as const, programmeCode: b.programme_code as string | null,
    lop: b.class_code as string | null, gvcn: b.gvcn_ten as string | null, dauVao: b.dau_vao as number | null,
    target: b.target as number | null, khongCamKet: !!b.khong_cam_ket,
    thoiGian: khoangTuan(b.bat_dau_ngay, b.dong_ngay, homNay), lyDo: b.ly_do as LyDoDong, lyDoNhan: LY_DO_DONG_NHAN[b.ly_do as LyDoDong] ?? null,
    dich: { target: b.target as number | null, thiDuKien: b.thi_du_kien_nhan as string | null },
    /* P13 KET-PET: thang + kết quả thi thật Cambridge của khoá (đọc lộ trình, Đạt so Target lúc nhập). */
    ...(() => { const kt = !c.route ? kyThiCuaChuongTrinh(c.programme_code) : null;
      return { kyThi: kt ? { ten: kt.ten, min: kt.min, max: kt.max } : null, thiThatKyThi: kt ? ketQuaKyThi(kt, { ...c, target_score: c.thi_that_target ?? c.target_score }) : null,
        ngayThiKyThi: kt ? c.thi_that_ngay ?? null : null }; })(),
    ketQua: laFt
      ? { loai: 'ft' as const, ovr: b.thi_that_ovr as number | null, l: b.thi_that_l, r: b.thi_that_r, w: b.thi_that_w, s: b.thi_that_s, ngay: b.thi_that_ngay as string | null,
          khongThi: !!b.thi_that_khong_thi, khongCoThi,
          nhan: daCoKq ? (b.ket_luan === 'reached' ? 'Đạt Target' : b.ket_luan === 'not_reached' ? 'Chưa đạt Target' : '') : kq!.nhan, ketLuan: b.ket_luan as string | null,
          choNhap: !khongCoThi && !daCoKq && (kq!.nhan === 'Chờ kết quả thi thật' || kq!.nhan === 'Chờ đủ 4 kỹ năng'),
          coTheNhap: !khongCoThi && coTheNhapThiThat(p, { id: cycleId, student_id: c.student_id }) }
      : { loai: 'thuong' as const, tyLe: b.ty_le_cuoi_khoa as number | null, dai: b.dai_cuoi_khoa as string | null, kyVongDat: kqdr ? kqdr.dat : null, kqdr },
    huongTiep: { khoa: b.huong_tiep as string, nhan: nhanHuong(b.huong_tiep) },
    /** OV-8a: mục Bước tiếp (FT có kết quả thi thật) — null khi không có. */
    buocTiep: laFt ? trangThaiBuocTiep(p, cycleId) : null,
    luot,
  };
}

// ------------------------------------------------------------------ tab "Tổng kết" của lớp đã kết thúc
export function tongKetLop(p: Principal, classId: number) {
  const conn = db();
  const lop = conn.prepare('SELECT id, code, status, programme_code, is_fast_track FROM classes WHERE id = ?').get(classId) as any;
  if (!lop) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  if (lop.status !== 'finished') throw notFound('Lớp chưa kết thúc');
  const homNay = demoToday();
  const hv = conn.prepare(`SELECT DISTINCT s.id, s.full_name AS ten FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ?`).all(classId) as any[];
  const bcCua = new Map<number, any>();   // bản chụp mới nhất có lượt ở lớp này
  const luotCua = new Map<number, any[]>();
  theoLo(hv.map((h) => h.id as number), (lo, ph) => {
    for (const b of conn.prepare(
      `SELECT b.* FROM ban_chup_lo_trinh b WHERE b.student_id IN (${ph}) AND b.lan = (SELECT MAX(lan) FROM ban_chup_lo_trinh WHERE cycle_id = b.cycle_id)
         AND EXISTS (SELECT 1 FROM ban_chup_luot l WHERE l.ban_chup_id = b.id AND l.class_id = ?) ORDER BY b.cycle_id`,
    ).all(...lo, classId) as any[]) bcCua.set(b.student_id, b);
  }, THAM_SO_TOI_DA - 1);   // câu còn một tham số classId → ≤ 900
  const idBc = [...bcCua.values()].map((b) => b.id as number);
  theoLo(idBc, (lo, ph) => {
    for (const l of conn.prepare(`SELECT * FROM ban_chup_luot WHERE ban_chup_id IN (${ph}) AND class_id = ? ORDER BY attempt_no, id`).all(...lo, classId) as any[]) {
      luotCua.set(l.ban_chup_id, [...(luotCua.get(l.ban_chup_id) ?? []), l]);
    }
  }, THAM_SO_TOI_DA - 1);
  const laFt = !!lop.is_fast_track;
  const dong = hv.map((h) => {
    const b = bcCua.get(h.id);
    if (!b) return { studentId: h.id as number, ten: h.ten as string, loTrinhId: null as number | null, roiSom: true, dauVao: null, target: null, soLuot: 0, luotCuoi: null, thiThat: null, ketLuan: null, huongTiep: null, giuaKhoa: null, cuoiKhoa: null };
    const luot = gomLuot(luotCua.get(b.id) ?? [], b.programme_code, !!b.route, homNay);
    const goc = { studentId: h.id as number, ten: h.ten as string, loTrinhId: b.cycle_id as number | null, roiSom: false, dauVao: b.dau_vao as number | null, target: b.target as number | null };
    if (b.route) {
      const dd = luotDaiDien(luot.map((x) => ({ ...x, huy: x.trangThai === 'cancelled' })));
      const k = (n: string) => dd?.kyNang.find((x) => x.k === n)?.diem ?? null;
      const cuoi = luot.at(-1);
      return { ...goc, soLuot: luot.filter((x) => x.trangThai !== 'cancelled').length, luotCuoiHuy: cuoi?.trangThai === 'cancelled' ? cuoi.nhan : null,
        luotCuoi: dd ? { nhan: dd.nhan, overall: dd.overall, l: k('listening'), r: k('reading'), w: k('writing'), s: k('speaking') } : null,
        thiThat: b.ly_do === 'chuyen_lop' ? null : { ovr: b.thi_that_ovr as number | null, ngay: b.thi_that_ngay as string | null, khongThi: !!b.thi_that_khong_thi },
        ketLuan: (b.ly_do === 'chuyen_lop' ? null : b.ket_luan) as string | null,
        huongTiep: nhanHuong(b.huong_tiep), huongKhoa: b.huong_tiep as string, giuaKhoa: null, cuoiKhoa: null };
    }
    const giua = luot.find((x) => x.kind === 'progress'); const cuoi = luot.find((x) => x.kind === 'final');
    const gon = (x: DongLuotTongKet | undefined) => (x && x.trangThai !== 'cancelled' ? { dat: x.kyNang.filter((m) => m.dat === true).length, tong: x.kyNang.length, tyLe: x.tyLe, huy: false } : x ? { dat: 0, tong: 0, tyLe: null, huy: true } : null);
    return { ...goc, soLuot: luot.filter((x) => x.trangThai !== 'cancelled').length, luotCuoi: null, thiThat: null, ketLuan: null,
      huongTiep: nhanHuong(b.huong_tiep), huongKhoa: b.huong_tiep as string, giuaKhoa: gon(giua), cuoiKhoa: cuoi ? { ...gon(cuoi)!, dai: b.dai_cuoi_khoa as string | null } : null };
  }).sort((x, y) => Number(x.roiSom) - Number(y.roiSom) || x.ten.localeCompare(y.ten, 'vi'));
  const dem = (f: (d: any) => boolean) => dong.filter((d) => !d.roiSom && f(d)).length;
  return {
    lop: { id: lop.id as number, code: lop.code as string, loai: laFt ? 'ft' as const : 'thuong' as const, programmeCode: lop.programme_code as string | null },
    dai: laFt
      ? { hocVien: dem(() => true), datTarget: dem((d) => d.ketLuan === 'reached'), chuaDat: dem((d) => d.ketLuan === 'not_reached'), choKetQua: dem((d) => !!d.thiThat && !d.thiThat.khongThi && d.thiThat.ovr === null && d.ketLuan !== 'reached' && d.ketLuan !== 'not_reached') }
      : { hocVien: dem(() => true), lenFt: dem((d) => d.huongKhoa === 'len_ft'), lenLop: dem((d) => d.huongKhoa === 'len_lop'), hocLai: dem((d) => d.huongKhoa === 'hoc_lai') },
    dong,
  };
}
