import { db } from '../db.ts';
import {
  XU_LY_STATUS_LABEL, bacHoacNgoaiThang, khoaLoaiXuLy, nhanLoaiXuLy, tachTenMoTa, VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL,
  type DongViPham, type DongViPhamEm, type DongViPhamLop, type ChuongTrinh, type DongHvCanChuY, type DongLopViPham, type ViolationCategory, type YThucPhanTichKetQua,
} from '../../../shared/domain/index.ts';
import { badRequest, forbidden } from '../util.ts';
import type { Principal } from '../permissions.ts';
import type { MetricRow } from '../worklist/metrics.ts';
import { branchSql, checkClassInScope, classSql, statScope } from '../yThuc/thongKe.ts';
import { trangThaiYThuc } from '../yThuc/trangThai.ts';
import { demoToday } from '../demoConfig.ts';

/**
 * Ý THỨC & PHỐI HỢP TRONG PHÂN TÍCH (PR-UX4, Q14–Q16) — hai danh sách: "Học viên cần chú ý" và "Lớp nhiều vi phạm". Cùng khuôn với
 * `tongHop.ts`: `tinh()` giữ TẬP ID, bảng đọc `.size`, `oYThucPhanTich()` mở danh sách bằng chính `tinh()`. Quyền: `DISCIPLINE_STATS`
 * qua `statScope` (giáo viên → 403; chi nhánh/lớp ngoài phạm vi → 403). Bốn truy vấn cố định + hai truy vấn theo lô 400 — không truy vấn
 * theo từng dòng. Tổng vi phạm của các lớp + hàng gom KHỚP `metricSet('vi-pham-tong')` cùng kỳ/chi nhánh (cùng cách lọc).
 */

export type FilterYThuc = { branchId?: number | null; ct: ChuongTrinh | null; classId?: number | null; from: string; to: string };

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const soNgay = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1;
function chunks<T>(list: T[]): T[][] {
  return Array.from({ length: Math.ceil(list.length / 400) }, (_, i) => list.slice(i * 400, i * 400 + 400));
}
const marks = (n: number) => Array.from({ length: n }, () => '?').join(',');

/* PT-b (mockup v19 khung 6a): `qua` = phần Chưa xử lý đã quá hạn — ô Chưa xử lý đỏ ⚠ thay vàng. Cùng lần đọc cửa trạng thái, không câu thêm. */
type Muc = { vp: Set<number>; chua: Set<number>; qua: Set<number>; hv: Set<number>; truoc: number };
const mucMoi = (): Muc => ({ vp: new Set(), chua: new Set(), qua: new Set(), hv: new Set(), truoc: 0 });

function tinh(p: Principal, f: FilterYThuc) {
  const scope = statScope(p, f.branchId ?? null);
  if (scope.none) throw forbidden('Ý thức dành cho Quản lý.');
  if (f.classId) checkClassInScope(f.classId, scope.branchIds);
  const conn = db();
  const dai = soNgay(f.from, f.to);
  const tuTruoc = addDays(f.from, -dai);

  // 1) Vi phạm của cả kỳ này và kỳ liền trước, theo LỚP GHI (cùng cách `vi-pham-tong`).
  const b = branchSql('c.branch_id', scope.branchIds), cl = classSql('v.class_id', f.classId ?? null);
  const ctSql = !f.ct ? '' : ` AND c.is_fast_track = ${f.ct === 'ft' ? 1 : 0}`;
  const lopMuc = new Map<number, Muc>();          // classId (0 = không rõ lớp) → tập của lớp
  const conMuc = new Map<string, Muc>();          // `${classId}|${category}`
  const maLop = new Map<number, string>();
  const vpKy: any[] = [];
  for (const r of conn.prepare(
    `SELECT v.id, v.student_id, v.class_id, v.category, v.occurred_on, c.code AS class_code
       FROM violations v LEFT JOIN classes c ON c.id = v.class_id
      WHERE ${b.sql} AND v.chi_nhac = 0 AND v.occurred_on >= ? AND v.occurred_on <= ? AND ${cl.sql}${ctSql}`,   /* TINH-HINH: nhắc nhở không là vi phạm */
  ).all(...b.args, tuTruoc, f.to, ...cl.args) as any[]) vpKy.push(r);
  // 2) Học viên ĐANG HỌC trong phạm vi + sĩ số từng lớp.
  const eWhere = [b.sql, `c.status = 'active'`, `e.status = 'active'`, 's.archived_at IS NULL'];
  const eArgs: unknown[] = [...b.args];
  if (f.classId) { eWhere.push('c.id = ?'); eArgs.push(f.classId); }
  if (f.ct) { eWhere.push('c.is_fast_track = ?'); eArgs.push(f.ct === 'ft' ? 1 : 0); }
  const siSo = new Map<number, number>();
  const lopCuaHv = new Map<number, string>();
  const tenHv = new Map<number, string>();
  const emailHv = new Map<number, string | null>();
  for (const r of conn.prepare(
    `SELECT e.student_id, c.id AS class_id, c.code, s.full_name, s.email
       FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN students s ON s.id = e.student_id
      WHERE ${eWhere.join(' AND ')} ORDER BY e.id`,
  ).all(...eArgs) as any[]) {
    siSo.set(r.class_id, (siSo.get(r.class_id) ?? 0) + 1);
    lopCuaHv.set(r.student_id, r.code);
    tenHv.set(r.student_id, r.full_name);
    emailHv.set(r.student_id, r.email ?? null);
    if (!maLop.has(r.class_id)) maLop.set(r.class_id, r.code);
  }

  /* PR-YT4 (K1-26): "chưa xử lý" = Mới · Cần xử lý · Quá hạn của CỬA TRẠNG THÁI — cùng tập `vi-pham-chua-xu-ly`. */
  const homNay = demoToday();
  /* MỘT lần hỏi cửa trạng thái cho cả em có vi phạm trong kỳ lẫn em đang học (Học viên cần chú ý) — dùng lại ở bước 4. */
  const trangVp = trangThaiYThuc([...new Set([...vpKy.map((r) => r.student_id as number), ...tenHv.keys()])], homNay);
  const MO: ReadonlySet<string> = new Set(['moi', 'can_xu_ly', 'qua_han']);
  for (const r of vpKy) {
    const k = r.class_id ?? 0;
    if (!maLop.has(k)) maLop.set(k, r.class_code ?? 'Không rõ lớp');
    const keCon = `${k}|${r.category}`;
    const l = lopMuc.get(k) ?? mucMoi(); lopMuc.set(k, l);
    const c = conMuc.get(keCon) ?? mucMoi(); conMuc.set(keCon, c);
    if (r.occurred_on < f.from) { l.truoc += 1; c.truoc += 1; continue; }
    const tt = trangVp.get(r.student_id)?.viPham.get(r.id)?.t ?? '';
    const chua = MO.has(tt);
    for (const m of [l, c]) { m.vp.add(r.id); m.hv.add(r.student_id); if (chua) m.chua.add(r.id); if (tt === 'qua_han') m.qua.add(r.id); }
  }


  // 3) GVCN của các lớp có mặt.
  const gvcn = new Map<number, string>();
  for (const chunk of chunks([...lopMuc.keys()].filter((k) => k > 0))) {
    for (const r of conn.prepare(
      `SELECT ta.class_id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.is_core = 1 AND ta.status = 'active' AND ta.class_id IN (${marks(chunk.length)}) ORDER BY ta.id DESC`,
    ).all(...chunk) as any[]) gvcn.set(r.class_id, r.full_name);   // id giảm dần → dòng cuối ghi đè = phân công đầu tiên
  }

  // 4) Trạng thái Ý thức của học viên đang học — đã nạp cùng lần ở bước 1b.
  const hvIds = [...tenHv.keys()];
  const trangHv = trangVp;

  // 5) Số phương án xử lý đã thực hiện trong kỳ theo loại (chỉ để xuất Excel, Q16) — cùng cách lọc `bien-phap-da-thuc-hien`.
  const bm = branchSql('c.branch_id', scope.branchIds), cm = classSql('m.class_id', f.classId ?? null);
  const bienPhapTheoLoai: Record<string, number> = {};
  for (const r of conn.prepare(
    `SELECT m.kind, COUNT(*) AS n FROM discipline_measures m LEFT JOIN classes c ON c.id = m.class_id
      WHERE m.status = 'done' AND ${bm.sql} AND m.performed_on >= ? AND m.performed_on <= ? AND ${cm.sql}${ctSql}
      GROUP BY m.kind`,
  ).all(...bm.args, f.from, f.to, ...cm.args) as any[]) bienPhapTheoLoai[khoaLoaiXuLy(r.kind)] = (bienPhapTheoLoai[khoaLoaiXuLy(r.kind)] ?? 0) + r.n;

  // Học viên cần chú ý (K1-25): nhóm Quá hạn · Bắt buộc xử lý · Chờ QL duyệt — bỏ luật 8 tuần / Thư CC của v3.
  const hvRows: DongHvCanChuY[] = [];
  const hvTap = new Map<number, { vpKy: number[]; chua: number[] }>();
  const THU_TU_NHOM = { qua_han: 0, bat_buoc: 1, cho_duyet: 2 } as const;
  for (const sid of hvIds) {
    const em = trangHv.get(sid);
    if (!em || (em.nhom !== 'qua_han' && em.nhom !== 'bat_buoc' && em.nhom !== 'cho_duyet')) continue;
    const trongKy = em.dsViPham.filter((v) => v.occurredOn >= f.from && v.occurredOn <= f.to);
    const chua = em.dsViPham.filter((v) => MO.has(em.viPham.get(v.id)?.t ?? ''));
    const gan = em.xuLy.filter((m) => m.status === 'done' && m.performedOn).sort((a, c) => (c.performedOn ?? '').localeCompare(a.performedOn ?? ''))[0] ?? null;
    const ngayLan = (m: { performedOn: string | null; quyetLuc: string | null }) => m.performedOn ?? m.quyetLuc?.slice(0, 10) ?? '';
    const moiHon = em.xuLy.filter((m) => m.status !== 'done' && m.status !== 'nhap' && ngayLan(m) >= (gan?.performedOn ?? ''))
      .sort((a, c) => ngayLan(c).localeCompare(ngayLan(a)))[0] ?? null;
    const lanXuLyMoi = moiHon ? { ten: nhanLoaiXuLy(moiHon.kind, moiHon.customName), nhan: XU_LY_STATUS_LABEL[moiHon.status] } : null;
    hvRows.push({
      studentId: sid, ten: tenHv.get(sid) ?? `#${sid}`, email: emailHv.get(sid) ?? null, lop: lopCuaHv.get(sid) ?? null,
      viPham: trongKy.length, chuaXuLy: chua.length, quaHan: chua.filter((v) => em.viPham.get(v.id)?.t === 'qua_han').length,
      bienPhapGanNhat: gan ? nhanLoaiXuLy(gan.kind, gan.customName) : null, ngay: gan?.performedOn ?? null,
      nhom: em.nhom, bac: bacHoacNgoaiThang(em.bac, em.xuLy), lanXuLyMoi,
      bacKe: nhanLoaiXuLy(em.keTiep.kind),
    });
    hvTap.set(sid, { vpKy: trongKy.map((v) => v.id), chua: chua.map((v) => v.id) });
  }
  hvRows.sort((a, c) => THU_TU_NHOM[a.nhom] - THU_TU_NHOM[c.nhom] || c.chuaXuLy - a.chuaXuLy || c.viPham - a.viPham || a.ten.localeCompare(c.ten));

  return { hvRows, hvTap, lopMuc, conMuc, maLop, siSo, gvcn, bienPhapTheoLoai, trangVp, lopCuaHv, tenHv, scopeEmpty: scope.branchIds !== null && scope.branchIds.length === 0 };
}

type Tinh = ReturnType<typeof tinh>;
const laHienRo = (m: Muc) => m.vp.size >= 3 || m.chua.size > 0;

function dongLop(r: Tinh, k: number): DongLopViPham {
  const m = r.lopMuc.get(k)!;
  const con = VIOLATION_CATEGORIES.map((cat) => ({ cat, m: r.conMuc.get(`${k}|${cat}`) }))
    .filter((x) => x.m && x.m.vp.size > 0)
    .map((x): DongLopViPham => ({
      khoa: `lop:${k}|${x.cat}`, classId: k || null, nhan: VIOLATION_CATEGORY_LABEL[x.cat as ViolationCategory],
      viPham: x.m!.vp.size, chuaXuLy: x.m!.chua.size, quaHan: x.m!.qua.size, hvCoViPham: x.m!.hv.size, siSo: null,
      soVoiTruoc: x.m!.vp.size - x.m!.truoc, gvcn: null,
    }));
  return {
    khoa: `lop:${k}`, classId: k || null, nhan: r.maLop.get(k) ?? 'Không rõ lớp',
    viPham: m.vp.size, chuaXuLy: m.chua.size, quaHan: m.qua.size, hvCoViPham: m.hv.size, siSo: k ? (r.siSo.get(k) ?? null) : null,
    soVoiTruoc: m.vp.size - m.truoc, gvcn: r.gvcn.get(k) ?? null, con,
  };
}

export function yThucPhanTich(p: Principal, f: FilterYThuc): YThucPhanTichKetQua {
  const r = tinh(p, f);
  const coDuLieu = [...r.lopMuc.entries()].filter(([, m]) => m.vp.size > 0).map(([k]) => k);
  const hien = coDuLieu.filter((k) => laHienRo(r.lopMuc.get(k)!)).map((k) => dongLop(r, k));
  hien.sort((a, b) => b.chuaXuLy - a.chuaXuLy || b.viPham - a.viPham || a.nhan.localeCompare(b.nhan));
  const gomRows = coDuLieu.filter((k) => !laHienRo(r.lopMuc.get(k)!)).map((k) => dongLop(r, k))
    .sort((a, b) => b.viPham - a.viPham || a.nhan.localeCompare(b.nhan));
  return {
    hvCanChuY: r.hvRows, lop: hien,
    gom: gomRows.length ? { soLop: gomRows.length, hang: gomRows } : null,
    soVoiTruoc: [...r.lopMuc.values()].reduce((s, m) => s + m.vp.size - m.truoc, 0),
    bienPhapTheoLoai: r.bienPhapTheoLoai, scopeEmpty: r.scopeEmpty,
  };
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`. `dong` = `hv:<id>` | `lop:<id>` | `lop:<id>|<nhóm>` | `gom`; `cot` = `vi-pham` | `chua-xu-ly` | `hv-co-vi-pham` (lớp). */
export function oYThucPhanTich(p: Principal, f: FilterYThuc & { dong: string; cot: string }):
  { n: number; tieuDe: string; rows: MetricRow[]; bangLuot?: true; kieu?: 'vi-pham' } {
  const r = tinh(p, f);
  /* PT-VP-PA (mockup v13 A4, P-VP): mọi ô → panel bảng; vi phạm · theo em · theo lớp (không dòng nào chỉ có tên). */
  const ra = (n: number, tieuDe: string, rows: MetricRow[]) => ({ n, tieuDe, rows, ...(rows.length ? { bangLuot: true as const, kieu: 'vi-pham' as const } : {}) });
  const vp = (ids: number[]) => dongViPham(r, ids);
  const em = (ids: number[], vpCua?: (sid: number) => { vp: number[]; chua: number[] }) => dongViPhamEm(r, ids, vpCua);
  /* V8-PT-2: thẻ chỉ số — `hv-can-chu-y` = danh sách HV; `tong` = mọi lớp có vi phạm (cả nhóm "lớp khác"). */
  if (f.dong === 'hv-can-chu-y') {
    const ids = r.hvRows.map((x) => x.studentId);
    return ra(ids.length, `${ids.length} HV cần chú ý`, em(ids));
  }
  if (f.dong === 'tong' && f.cot === 'lop') {
    const k = [...r.lopMuc].filter(([, m]) => m.vp.size > 0).map(([id]) => id)
      .sort((a, b) => r.lopMuc.get(b)!.chua.size - r.lopMuc.get(a)!.chua.size || r.lopMuc.get(b)!.vp.size - r.lopMuc.get(a)!.vp.size || a - b);
    return ra(k.length, `${k.length} lớp có vi phạm`, k.map((id) => {
      const d = dongLop(r, id);
      const viPhamLop: DongViPhamLop = { classId: d.classId, lop: d.nhan, gvcn: d.gvcn, hvViPham: d.hvCoViPham, siSo: d.siSo, viPham: d.viPham, chuaXuLy: d.chuaXuLy };
      return { id, title: d.nhan, sub: '', href: id ? `/hoc-vien/lop/${id}` : '/phan-tich?goc=y-thuc', viPhamLop } as MetricRow;
    }));
  }
  if (f.dong.startsWith('hv:')) {
    const id = Number(f.dong.slice(3));
    const t = r.hvTap.get(id);
    if (!t) throw badRequest('Học viên này không có trong danh sách — có thể bộ lọc vừa đổi.');
    const ten = r.hvRows.find((x) => x.studentId === id)!.ten;
    if (f.cot === 'vi-pham') return ra(t.vpKy.length, `${ten} · ${t.vpKy.length} vi phạm`, vp(t.vpKy));
    if (f.cot === 'chua-xu-ly') return ra(t.chua.length, `${ten} · ${t.chua.length} vi phạm chưa xử lý`, vp(t.chua));
    throw badRequest(`Cột "${f.cot}" không hợp lệ.`);
  }
  let mucs: Muc[]; let nhan: string;
  if (f.dong === 'gom') {
    mucs = [...r.lopMuc.values()].filter((m) => m.vp.size > 0 && !laHienRo(m));
    nhan = `${mucs.length} lớp khác`;
  } else if (f.dong === 'tong') {
    mucs = [...r.lopMuc.values()].filter((m) => m.vp.size > 0);
    nhan = 'Tổng';
  } else if (f.dong.startsWith('lop:')) {
    const m = f.dong.includes('|') ? r.conMuc.get(f.dong.slice(4)) : r.lopMuc.get(Number(f.dong.slice(4)));
    if (!m || m.vp.size === 0) throw badRequest('Không tìm thấy dòng này trong bảng — có thể bộ lọc vừa đổi.');
    mucs = [m];
    const [k, cat] = f.dong.slice(4).split('|');
    nhan = `${r.maLop.get(Number(k)) ?? 'Không rõ lớp'}${cat ? ` · ${VIOLATION_CATEGORY_LABEL[cat as ViolationCategory] ?? cat}` : ''}`;
  } else throw badRequest('Không tìm thấy dòng này trong bảng — có thể bộ lọc vừa đổi.');
  const hop = (chon: (m: Muc) => Set<number>) => [...new Set(mucs.flatMap((m) => [...chon(m)]))].sort((a, b) => a - b);
  if (f.cot === 'vi-pham') { const ids = hop((m) => m.vp); return ra(ids.length, `${nhan} · ${ids.length} vi phạm`, vp(ids)); }
  if (f.cot === 'chua-xu-ly') { const ids = hop((m) => m.chua); return ra(ids.length, `${nhan} · ${ids.length} vi phạm chưa xử lý`, vp(ids)); }
  if (f.cot === 'hv-co-vi-pham') {
    /* Đếm vi phạm / chưa xử lý của em TRONG CHÍNH ô (lớp · nhóm · tổng) — cùng tập với số ô. */
    const ids = hop((m) => m.hv), vpO = new Set(hop((m) => m.vp)), chuaO = new Set(hop((m) => m.chua));
    const cua = (sid: number) => {
      const ds = r.trangVp.get(sid)?.dsViPham.map((v) => v.id) ?? [];
      return { vp: ds.filter((x) => vpO.has(x)), chua: ds.filter((x) => chuaO.has(x)) };
    };
    return ra(ids.length, `${nhan} · ${ids.length} HV có vi phạm`, em(ids, cua));
  }
  throw badRequest(`Cột "${f.cot}" không hợp lệ.`);
}

/**
 * PT-VP-PA (P-VP): dòng của các vi phạm — Học viên · Lớp · Ngày · Nhóm · Mô tả · Người ghi · Trạng thái (cửa trạng thái Ý thức đã nạp trong `tinh`).
 * Một câu theo lô (vi phạm + tên em + lớp + người ghi). Xếp mới nhất trước.
 */
function dongViPham(r: Tinh, ids: readonly number[]): MetricRow[] {
  const by = new Map<number, any>();
  for (const lo of chunks([...ids])) {
    for (const v of db().prepare(
      `SELECT v.id, v.student_id, v.class_id, v.category, v.occurred_on, v.ten, v.description, s.full_name, c.code AS lop, u.full_name AS nguoi
         FROM violations v JOIN students s ON s.id = v.student_id LEFT JOIN classes c ON c.id = v.class_id LEFT JOIN users u ON u.id = v.reported_by
        WHERE v.id IN (${marks(lo.length)})`,
    ).all(...lo) as any[]) by.set(v.id, v);
  }
  return [...ids].filter((id) => by.has(id)).map((id) => {
    const v = by.get(id)!;
    const tt = r.trangVp.get(v.student_id)?.viPham.get(id);
    const tm = tachTenMoTa(v.ten, v.description, v.category);
    const viPham: DongViPham = {
      id, studentId: v.student_id, ten: v.full_name, classId: v.class_id ?? null, lop: v.lop ?? '', ngay: String(v.occurred_on).slice(0, 10),
      nhom: VIOLATION_CATEGORY_LABEL[v.category as ViolationCategory] ?? v.category, moTa: [tm.ten, tm.moTa].filter(Boolean).join(' — '),
      nguoiGhi: v.nguoi ?? null, trangThai: tt?.nhan ?? '—', trangThaiT: tt?.t ?? null,
    };
    return { id, title: v.full_name, sub: '', href: `/hoc-vien/${v.student_id}`, viPham } as MetricRow;
  }).sort((a: any, b: any) => b.viPham.ngay.localeCompare(a.viPham.ngay) || a.id - b.id);
}

/** PT-VP-PA (P-VP theo em): một dòng một em — Học viên · Lớp · Vi phạm · Chưa xử lý · Bậc hiện tại · Lần xử lý gần nhất (cùng cột "Học viên cần chú ý"). */
function dongViPhamEm(r: Tinh, ids: readonly number[], vpCua?: (sid: number) => { vp: number[]; chua: number[] }): MetricRow[] {
  const thieu = ids.filter((s) => !r.tenHv.has(s));
  const ten = new Map(r.tenHv);
  for (const lo of chunks(thieu)) for (const x of db().prepare(`SELECT id, full_name FROM students WHERE id IN (${marks(lo.length)})`).all(...lo) as any[]) ten.set(x.id, x.full_name);
  return ids.map((sid) => {
    const h = r.hvRows.find((x) => x.studentId === sid);
    const em = r.trangVp.get(sid);
    const dem = vpCua ? vpCua(sid) : { vp: r.hvTap.get(sid)?.vpKy ?? [], chua: r.hvTap.get(sid)?.chua ?? [] };
    const gan = em?.xuLy.filter((m) => m.status === 'done' && m.performedOn).sort((a, c) => (c.performedOn ?? '').localeCompare(a.performedOn ?? ''))[0] ?? null;
    const viPhamEm: DongViPhamEm = {
      studentId: sid, ten: ten.get(sid) ?? `#${sid}`, lop: r.lopCuaHv.get(sid) ?? null, viPham: dem.vp.length, chuaXuLy: dem.chua.length,
      bac: h?.bac ?? (em ? bacHoacNgoaiThang(em.bac, em.xuLy) : null),
      lanXuLy: gan ? `${nhanLoaiXuLy(gan.kind, gan.customName)} · ${gan.performedOn!.slice(8, 10)}/${gan.performedOn!.slice(5, 7)}` : null,
    };
    return { id: sid, title: viPhamEm.ten, sub: '', href: `/hoc-vien/${sid}`, viPhamEm } as MetricRow;
  }).sort((a: any, b: any) => b.viPhamEm.chuaXuLy - a.viPhamEm.chuaXuLy || b.viPhamEm.viPham - a.viPhamEm.viPham || a.viPhamEm.ten.localeCompare(b.viPhamEm.ten, 'vi'));
}
