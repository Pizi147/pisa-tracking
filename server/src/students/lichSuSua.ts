import { db } from '../db.ts';
import { can, type Principal } from '../permissions.ts';
import { badRequest, forbidden, notFound } from '../util.ts';
import { NHAN_SAU_THI, nhanHanhDongNhatKy, PERMISSIONS, STUDENT_STATUS_LABEL, tuanLich, type LuaChonSauThi } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';

/**
 * OV-13j — LỊCH SỬ SỬA THÔNG TIN HỌC VIÊN (chủ SP 15/10): ai sửa gì, cũ → mới. Đọc `audit_logs` của em (entity `student`) và các lộ trình của em
 * (`learning_cycle`), so từng TRƯỜNG đã biết giữa `before_json` / `after_json` (dòng cũ ghi cả hàng, dòng mới chỉ trường đổi — cùng cách so).
 * Các dòng của MỘT lần lưu (cùng người, cùng nguồn, ≤ 5 giây, việc `GOP`) gộp MỘT khối (Sửa thông tin gửi hồ sơ + lộ trình; Sửa cả lớp một em nhiều bảng).
 * OV-13o: hai lần sửa liền nhau (cùng việc, ≤ 5 giây) cũng một khối — trường đổi hai lần lấy cũ của lần đầu, mới của lần sau.
 */

export type LoaiLichSu = 'thong-tin' | 'target' | 'trang-thai';
type Kieu = 'chu' | 'ngay' | 'thang' | 'band' | 'co' | 'trangThai' | 'nguoi' | 'chiNhanh' | 'tuan' | 'lop' | 'buocTiep' | 'tuanNgay' | 'ketLuan';

/** Trường hiện được: tên cột (camelCase trong nhật ký đổi về snake_case) → [tên hiển thị, nhóm lọc, kiểu giá trị]. Thứ tự = thứ tự hiện. */
const TRUONG: Record<string, [string, LoaiLichSu, Kieu]> = {
  full_name: ['Họ tên', 'thong-tin', 'chu'],
  dob: ['Ngày sinh', 'thong-tin', 'ngay'],
  email: ['Email', 'thong-tin', 'chu'],
  phone: ['SĐT', 'thong-tin', 'chu'],
  parent_name: ['Phụ huynh', 'thong-tin', 'chu'],
  parent_relation: ['Quan hệ', 'thong-tin', 'chu'],
  parent_phone: ['SĐT phụ huynh', 'thong-tin', 'chu'],
  consultant_user_id: ['TVV', 'thong-tin', 'nguoi'],
  consultant_name: ['Tư vấn viên', 'thong-tin', 'chu'],
  branch_id: ['Chi nhánh', 'thong-tin', 'chiNhanh'],
  note: ['Ghi chú', 'thong-tin', 'chu'],
  baseline_score: ['Điểm đầu vào', 'thong-tin', 'band'],
  baseline_listening: ['Đầu vào L', 'thong-tin', 'band'],
  baseline_reading: ['Đầu vào R', 'thong-tin', 'band'],
  baseline_writing: ['Đầu vào W', 'thong-tin', 'band'],
  baseline_speaking: ['Đầu vào S', 'thong-tin', 'band'],
  /* P8 (N13): môn đăng ký — nhật ký `cycle.mon_dang_ky` ghi sẵn chữ "Đủ môn" / "L · R · W2 · S". */
  mon_dang_ky: ['Môn học', 'thong-tin', 'chu'],
  class_id: ['Lớp', 'target', 'lop'],
  route: ['Lộ trình', 'target', 'chu'],
  target_score: ['Target', 'target', 'band'],
  khong_cam_ket: ['KCK', 'target', 'co'],
  exam_period_id: ['Dự kiến thi', 'target', 'tuan'],
  exam_month: ['Dự kiến thi', 'target', 'thang'],
  exam_date: ['Ngày thi', 'target', 'ngay'],
  start_period_id: ['Tuần bắt đầu', 'target', 'tuan'],
  status: ['Trạng thái', 'trang-thai', 'trangThai'],
  archived_at: ['Lưu trữ', 'trang-thai', 'ngay'],
  /* OV-13m: Bước tiếp sau thi (`cycle.buoc_tiep`). */
  buoc_tiep: ['Bước tiếp', 'trang-thai', 'buocTiep'],
  buoc_tiep_hen: ['Hẹn bắt đầu', 'trang-thai', 'tuanNgay'],
  /* OV-13q: Gia hạn / Bỏ gia hạn sau thi. */
  han_sau_thi: ['Hạn sau thi', 'trang-thai', 'ngay'],
  /* OV-15g: Lịch thi (OV-15f, nhật ký `lich_thi.luu`) — kết luận họp, tháng, ghi chú. */
  ket_luan: ['Kết luận lịch thi', 'target', 'ketLuan'],
  thang: ['Tháng thi', 'target', 'thang'],
  ghi_chu: ['Ghi chú lịch Test', 'target', 'chu'],
};
const KET_LUAN: Record<string, string> = { 'giu-thang': 'Giữ tháng', 'chot-ngay': 'Chốt ngày', 'chuyen-thang': 'Chuyển tháng', 'can-xac-nhan': 'Chưa kết luận' };
const THU_TU = Object.keys(TRUONG);
const BIET_DANH: Record<string, string> = { target: 'target_score', targetScore: 'target_score' };
const cot = (k: string) => BIET_DANH[k] ?? k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Việc được đọc. Nhật ký `learning_cycle` của lộ trình (cycle.status…) dùng `status` khác nghĩa — chỉ đọc trường của các việc dưới đây. */
const HANH_DONG = ['student.create', 'student.update', 'student.status', 'student.rejoin', 'student.rejoin_undo', 'student.finish_undo', 'student.pause_undo', 'student.resume_undo',
  'student.archive', 'student.unarchive', 'student.transfer', 'cycle.create', 'cycle.update', 'cycle.target.revise', 'cycle.baseline.set', 'cycle.baseline.clear', 'cycle.buoc_tiep', 'cycle.han_sau_thi', 'lich_thi.luu', 'cycle.mon_dang_ky'];
/** Việc tự nói nguồn (chữ của Nhật ký Quản trị); sửa thường thì không ghi nguồn. */
const CO_NGUON = new Set(['student.rejoin', 'student.rejoin_undo', 'student.finish_undo', 'student.pause_undo', 'student.resume_undo', 'student.transfer', 'cycle.create']);
const BO_QUA_CYCLE = new Set(['status']);   // trạng thái lộ trình ≠ trạng thái học của em
const CUA_LICH_THI = new Set(['ket_luan', 'thang', 'ghi_chu']);   // chỉ đọc ở nhật ký `lich_thi` — việc khác có thể dùng cùng tên khoá
/** Việc của MỘT lần lưu form (hồ sơ + lộ trình + Target + đầu vào) — chỉ những việc này gộp; Tạm dừng rồi Quay lại học là hai khối. */
const GOP = new Set(['student.update', 'cycle.update', 'cycle.target.revise', 'cycle.baseline.set', 'cycle.baseline.clear', 'lich_thi.luu', 'cycle.mon_dang_ky']);   // OV-15g: Chốt ngày = lịch thi + ngày thi

export type DongLichSu = { id: number; luc: string; nguoi: string; nguon: string | null; truong: { ten: string; cu: string | null; moi: string | null }[] };

const TRANG = 20;
const LO = 60;

export function lichSuSua(p: Principal, studentId: number, q: { loai?: string; truoc?: number | null }): { dong: DongLichSu[]; tiep: number | null } {
  const conn = db();
  if (!conn.prepare('SELECT 1 FROM students WHERE id = ?').get(studentId)) throw notFound('Không tìm thấy học viên');
  if (!xemLichSuHv(p, studentId)) throw forbidden('Chỉ Quản lý, GVCN, Tư vấn viên và CX của em xem được lịch sử sửa.');
  const loai = q.loai || null;
  if (loai && !['thong-tin', 'target', 'trang-thai'].includes(loai)) throw badRequest('Bộ lọc không hợp lệ.');

  const ph = HANH_DONG.map(() => '?').join(',');
  const cau = conn.prepare(
    `SELECT a.id, a.action, a.entity_type et, a.before_json b, a.after_json f, a.created_at luc, a.actor_user_id uid, u.full_name ten
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
      WHERE a.action IN (${ph}) AND a.id < ?
        AND ((a.entity_type = 'student' AND a.entity_id = ?)
          OR (a.entity_type IN ('learning_cycle', 'lich_thi') AND a.entity_id IN (SELECT id FROM learning_cycles WHERE student_id = ?)))
      ORDER BY a.id DESC LIMIT ?`,
  );

  type Tho = { id: number; luc: string; uid: number | null; nguoi: string; nguon: string | null; hd: Set<string>; doi: Map<string, [unknown, unknown]> };
  const khoi: Tho[] = [];
  let truoc = q.truoc ?? Number.MAX_SAFE_INTEGER;
  let conNua = true;
  /* Lọc theo nhóm có thể để trống cả lô — đọc tiếp tối đa 4 lô cho đủ một trang. */
  for (let vong = 0; vong < 4 && conNua && khoi.length <= TRANG; vong += 1) {
    const rows = cau.all(...HANH_DONG, truoc, studentId, studentId, LO) as any[];
    conNua = rows.length === LO;
    if (rows.length) truoc = rows[rows.length - 1].id;
    for (const r of rows) {
      const f = docJson(r.f);
      const doi = doiCuaDong(r, f, loai);
      if (!doi.size) continue;
      const nguon = (typeof f._nguon === 'string' ? f._nguon : null) ?? (CO_NGUON.has(r.action) ? nhanHanhDongNhatKy(r.action) : null);
      const tr = khoi[khoi.length - 1];
      /* Sắp mới → cũ: dòng này CŨ hơn khối trước — giá trị cũ của nó là "cũ" của cả khối. */
      if (tr && tr.uid === r.uid && tr.nguon === nguon && Math.abs(Date.parse(tr.luc) - Date.parse(r.luc)) <= 5000
        && GOP.has(r.action) && [...tr.hd].every((x) => GOP.has(x))) {
        for (const [c, [cu, moi]] of doi) tr.doi.set(c, [cu, tr.doi.get(c)?.[1] ?? moi]);
        tr.id = r.id; tr.hd.add(r.action);
      } else khoi.push({ id: r.id, luc: r.luc, uid: r.uid, nguoi: r.ten ?? 'Hệ thống', nguon, hd: new Set([r.action]), doi });
    }
  }
  /* Còn dòng chưa đọc → khối cuối có thể nối tiếp ở trang sau: bỏ, đọc lại từ đó (con trỏ = id nhỏ nhất đã giữ). */
  if (conNua && khoi.length > 1) khoi.pop();
  const trang = khoi.slice(0, TRANG);
  const tiep = conNua || khoi.length > TRANG ? trang[trang.length - 1]?.id ?? truoc : null;

  const ten = tenTheoLo(trang);
  const dong = trang.map((k) => ({
    id: k.id, luc: k.luc, nguoi: k.nguoi, nguon: k.nguon,
    truong: [...k.doi].sort((x, y) => THU_TU.indexOf(x[0]) - THU_TU.indexOf(y[0]))
      .map(([c, [cu, moi]]) => ({ ten: TRUONG[c][0], cu: hien(c, cu, ten), moi: hien(c, moi, ten) }))
      .filter((x) => x.cu !== x.moi)
      .filter((x, i, ds) => ds.findIndex((y) => y.ten === x.ten) === i),   // tuần thi + tháng thi cùng đổi (cùng tên) → giữ tuần
  })).filter((d) => d.truong.length);
  return { dong, tiep };
}

/** Cùng cờ `viewer.coTheSuaThongTin` của hồ sơ: QL / QT / GVCN lớp đang học (`student.edit`) · TVV / CX / Admin (`student.edit_info`), đúng phạm vi. GVBM → không.
 *  OV-15i1: một cổng cho mọi lịch sử của em (hồ sơ + thi thật / Bước tiếp / Gia hạn — `lichSu.ts`). */
export function xemLichSuHv(p: Principal, studentId: number): boolean {
  return can(p, PERMISSIONS.STUDENT_VIEW, { studentId })
    && (can(p, PERMISSIONS.STUDENT_EDIT, { studentId }) || can(p, PERMISSIONS.STUDENT_EDIT_INFO, { studentId }));
}

/** Trường đã biết đổi trong MỘT dòng nhật ký (dòng cũ ghi cả hàng, dòng mới chỉ trường đổi — cùng cách so). */
function doiCuaDong(r: { action: string; et: string; b: string | null }, f: Record<string, any>, loai: string | null): Map<string, [unknown, unknown]> {
  const b = docJson(r.b);
  const doi = new Map<string, [unknown, unknown]>();
  for (const k of new Set([...Object.keys(b), ...Object.keys(f)])) {
    const c = cot(k);
    if (!TRUONG[c] || (r.et === 'learning_cycle' && BO_QUA_CYCLE.has(c)) || (r.et === 'lich_thi') !== CUA_LICH_THI.has(c)) continue;
    if (loai && TRUONG[c][1] !== loai) continue;
    if (!(k in f) && r.action !== 'student.create') continue;   // trường chỉ có ở `before` (vd ghi danh giữ) — không phải đổi
    doi.set(c, [b[k] ?? null, f[k] ?? null]);
  }
  return doi;
}

/**
 * OV-15i1 (C22 "lô = một lần lưu"): MỘT lần Sửa cả lớp — các dòng nhật ký của em nằm giữa hai id (`tu`, `den`) vì lô ghi trong một giao dịch.
 * Trả từng trường "cũ → mới" gắn tên em (`doiTuong`) và `sid` (em — kể cả em đã xoá; null = không suy được em) để nơi gọi kiểm quyền theo em.
 * Em đổi một trường hai lần lấy cũ của lần đầu, mới của lần sau. Em đã xoá: mỗi em một khối "Học viên đã xoá · n" (không dồn chung). Một câu cho cả lô.
 */
export function truongSuaCaLop(tu: number, den: number): { ten: string; cu: string | null; moi: string | null; doiTuong: string; sid: number | null; khoa: string }[] {
  const rows = db().prepare(
    `SELECT a.action, a.entity_type et, a.entity_id eid, a.before_json b, a.after_json f, COALESCE(s.id, lc.student_id) sid, COALESCE(s.full_name, s2.full_name) hv
       FROM audit_logs a LEFT JOIN students s ON a.entity_type = 'student' AND s.id = a.entity_id
       LEFT JOIN learning_cycles lc ON a.entity_type IN ('learning_cycle', 'lich_thi') AND lc.id = a.entity_id LEFT JOIN students s2 ON s2.id = lc.student_id
      WHERE a.id > ? AND a.id < ? AND a.action IN (${HANH_DONG.map(() => '?').join(',')}) ORDER BY a.id`,
  ).all(tu, den, ...HANH_DONG) as any[];
  const theoEm = new Map<string, { hv: string | null; sid: number | null; doi: Map<string, [unknown, unknown]> }>();
  for (const r of rows) {
    /* Em đã xoá: không còn hàng `students` — khoá theo đối tượng của dòng nhật ký (em = id em ở dòng `student`). */
    const sid: number | null = r.sid ?? (r.et === 'student' ? r.eid : null);
    const khoa = sid !== null ? `s${sid}` : `${r.et}:${r.eid}`;
    const em = theoEm.get(khoa) ?? { hv: r.hv ?? null, sid, doi: new Map() };
    theoEm.set(khoa, em);
    for (const [c, [cu, moi]] of doiCuaDong(r, docJson(r.f), null)) em.doi.set(c, [em.doi.has(c) ? em.doi.get(c)![0] : cu, moi]);
  }
  const ten = tenTheoLo([...theoEm.values()]);
  let daXoa = 0;
  return [...theoEm].flatMap(([khoa, { hv, sid, doi }]) => {
    const doiTuong = hv ?? `Học viên đã xoá · ${(daXoa += 1)}`;
    return [...doi].sort((x, y) => THU_TU.indexOf(x[0]) - THU_TU.indexOf(y[0]))
      .map(([c, [cu, moi]]) => ({ ten: TRUONG[c][0], cu: hien(c, cu, ten), moi: hien(c, moi, ten), doiTuong, sid, khoa }))
      .filter((x) => x.cu !== x.moi).filter((x, i, ds) => ds.findIndex((y) => y.ten === x.ten) === i);
  });
}

function docJson(s: string | null): Record<string, any> {
  try { const v = JSON.parse(s ?? 'null'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; }
}

type BangTen = Record<'nguoi' | 'chiNhanh' | 'tuan' | 'lop', Map<number, string>>;
/** Tên của mọi id trong trang — MỘT câu mỗi loại (không N+1). */
function tenTheoLo(ds: { doi: Map<string, [unknown, unknown]> }[]): BangTen {
  const can_: Record<keyof BangTen, Set<number>> = { nguoi: new Set(), chiNhanh: new Set(), tuan: new Set(), lop: new Set() };
  for (const k of ds) for (const [c, v] of k.doi) {
    const kieu = TRUONG[c][2];
    if (kieu in can_) for (const x of v) if (Number.isInteger(x)) can_[kieu as keyof BangTen].add(x as number);
  }
  const SQL: Record<keyof BangTen, string> = {
    nguoi: 'SELECT id, full_name t FROM users', chiNhanh: 'SELECT id, name t FROM branches',
    tuan: 'SELECT id, code t FROM report_periods', lop: 'SELECT id, code t FROM classes',
  };
  const out = {} as BangTen;
  for (const k of Object.keys(SQL) as (keyof BangTen)[]) {
    const ids = [...can_[k]].slice(0, 400);   // một trang ≤ 20 khối — không chạm trần tham số
    out[k] = new Map(ids.length ? (db().prepare(`${SQL[k]} WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids) as any[]).map((r) => [r.id, r.t]) : []);
  }
  return out;
}

function hien(c: string, v: unknown, ten: BangTen): string | null {
  const kieu = TRUONG[c][2];
  if (kieu === 'co') return v ? 'Có' : 'Không';
  if (v === null || v === undefined || v === '') return null;
  const s = String(v);
  switch (kieu) {
    case 'ngay': return /^\d{4}-\d{2}-\d{2}/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : s;
    case 'thang': return /^\d{4}-\d{2}$/.test(s) ? `${s.slice(5, 7)}/${s.slice(0, 4)}` : s;
    case 'band': return Number.isFinite(Number(v)) ? Number(v).toFixed(1) : s;
    case 'trangThai': return STUDENT_STATUS_LABEL[s as keyof typeof STUDENT_STATUS_LABEL] ?? s;
    case 'buocTiep': return NHAN_SAU_THI[s as LuaChonSauThi] ?? s;
    case 'ketLuan': return KET_LUAN[s] ?? s;
    case 'tuanNgay': return tuanLich(s, demoToday());
    case 'nguoi': case 'chiNhanh': case 'tuan': case 'lop': return ten[kieu].get(Number(v)) ?? `#${s}`;
    default: return s;
  }
}
