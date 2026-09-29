import { db } from '../db.ts';
import {
  khoaLoaiXuLy, nhanLoaiXuLy, MEASURE_KIND_LABEL, THANG, VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL,
  type ChuongTrinh, type DongHvCanChuY, type DongLopViPham, type ViolationCategory, type YThucPhanTichKetQua,
} from '../../../shared/domain/index.ts';
import { badRequest, forbidden } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { branchSql, checkClassInScope, classSql, statScope } from '../yThuc/thongKe.ts';
import { trangThaiYThuc } from '../yThuc/trangThai.ts';
import { demoToday } from '../demoConfig.ts';

/**
 * Ý THỨC & PHỐI HỢP TRONG PHÂN TÍCH (PR-UX4, Q14–Q16) — hai danh sách: "Học viên cần chú ý" và "Lớp nhiều vi phạm". Cùng khuôn với
 * `tongHop.ts`: `tinh()` giữ TẬP ID, bảng đọc `.size`, `oYThucPhanTich()` mở danh sách bằng chính `tinh()`. Quyền: `DISCIPLINE_STATS`
 * qua `statScope` (giáo viên → 403; chi nhánh/lớp ngoài phạm vi → 403). Bốn truy vấn cố định + hai truy vấn theo lô 400 — không truy vấn
 * theo từng dòng. Tổng vi phạm của các lớp + hàng gom KHỚP `metricSet('vi-pham-tong')` cùng kỳ/chi nhánh (cùng cách lọc).
 */

export type FilterYThuc = { branchId?: number | null; ct: ChuongTrinh; classId?: number | null; from: string; to: string };

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

type Muc = { vp: Set<number>; chua: Set<number>; hv: Set<number>; truoc: number };
const mucMoi = (): Muc => ({ vp: new Set(), chua: new Set(), hv: new Set(), truoc: 0 });

function tinh(p: Principal, f: FilterYThuc) {
  const scope = statScope(p, f.branchId ?? null);
  if (scope.none) throw forbidden('Ý thức dành cho Quản lý.');
  if (f.classId) checkClassInScope(f.classId, scope.branchIds);
  const conn = db();
  const dai = soNgay(f.from, f.to);
  const tuTruoc = addDays(f.from, -dai);

  // 1) Vi phạm của cả kỳ này và kỳ liền trước, theo LỚP GHI (cùng cách `vi-pham-tong`).
  const b = branchSql('c.branch_id', scope.branchIds), cl = classSql('v.class_id', f.classId ?? null);
  const ctSql = f.ct === 'ca-hai' ? '' : ` AND c.is_fast_track = ${f.ct === 'ft' ? 1 : 0}`;
  const lopMuc = new Map<number, Muc>();          // classId (0 = không rõ lớp) → tập của lớp
  const conMuc = new Map<string, Muc>();          // `${classId}|${category}`
  const maLop = new Map<number, string>();
  const vpKy: any[] = [];
  for (const r of conn.prepare(
    `SELECT v.id, v.student_id, v.class_id, v.category, v.occurred_on, c.code AS class_code
       FROM violations v LEFT JOIN classes c ON c.id = v.class_id
      WHERE ${b.sql} AND v.occurred_on >= ? AND v.occurred_on <= ? AND ${cl.sql}${ctSql}`,
  ).all(...b.args, tuTruoc, f.to, ...cl.args) as any[]) vpKy.push(r);
  // 2) Học viên ĐANG HỌC trong phạm vi + sĩ số từng lớp.
  const eWhere = [b.sql, `c.status = 'active'`, `e.status = 'active'`, 's.archived_at IS NULL'];
  const eArgs: unknown[] = [...b.args];
  if (f.classId) { eWhere.push('c.id = ?'); eArgs.push(f.classId); }
  if (f.ct !== 'ca-hai') { eWhere.push('c.is_fast_track = ?'); eArgs.push(f.ct === 'ft' ? 1 : 0); }
  const siSo = new Map<number, number>();
  const lopCuaHv = new Map<number, string>();
  const tenHv = new Map<number, string>();
  for (const r of conn.prepare(
    `SELECT e.student_id, c.id AS class_id, c.code, s.full_name
       FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN students s ON s.id = e.student_id
      WHERE ${eWhere.join(' AND ')} ORDER BY e.id`,
  ).all(...eArgs) as any[]) {
    siSo.set(r.class_id, (siSo.get(r.class_id) ?? 0) + 1);
    lopCuaHv.set(r.student_id, r.code);
    tenHv.set(r.student_id, r.full_name);
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
    const chua = MO.has(trangVp.get(r.student_id)?.viPham.get(r.id)?.t ?? '');
    for (const m of [l, c]) { m.vp.add(r.id); m.hv.add(r.student_id); if (chua) m.chua.add(r.id); }
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
    hvRows.push({
      studentId: sid, ten: tenHv.get(sid) ?? `#${sid}`, lop: lopCuaHv.get(sid) ?? null,
      viPham: trongKy.length, chuaXuLy: chua.length,
      bienPhapGanNhat: gan ? nhanLoaiXuLy(gan.kind, gan.customName) : null, ngay: gan?.performedOn ?? null,
      nhom: em.nhom, bac: em.bac > 0 ? MEASURE_KIND_LABEL[THANG[em.bac - 1]] : null,
      bacKe: em.keTiep ? `${MEASURE_KIND_LABEL[em.keTiep.kind]}${em.keTiep.canQl ? ' · cần QL' : ''}` : 'Hết thang',
    });
    hvTap.set(sid, { vpKy: trongKy.map((v) => v.id), chua: chua.map((v) => v.id) });
  }
  hvRows.sort((a, c) => THU_TU_NHOM[a.nhom] - THU_TU_NHOM[c.nhom] || c.chuaXuLy - a.chuaXuLy || c.viPham - a.viPham || a.ten.localeCompare(c.ten));

  return { hvRows, hvTap, lopMuc, conMuc, maLop, siSo, gvcn, bienPhapTheoLoai, scopeEmpty: scope.branchIds !== null && scope.branchIds.length === 0 };
}

type Tinh = ReturnType<typeof tinh>;
const laHienRo = (m: Muc) => m.vp.size >= 3 || m.chua.size > 0;

function dongLop(r: Tinh, k: number): DongLopViPham {
  const m = r.lopMuc.get(k)!;
  const con = VIOLATION_CATEGORIES.map((cat) => ({ cat, m: r.conMuc.get(`${k}|${cat}`) }))
    .filter((x) => x.m && x.m.vp.size > 0)
    .map((x): DongLopViPham => ({
      khoa: `lop:${k}|${x.cat}`, classId: k || null, nhan: VIOLATION_CATEGORY_LABEL[x.cat as ViolationCategory],
      viPham: x.m!.vp.size, chuaXuLy: x.m!.chua.size, hvCoViPham: x.m!.hv.size, siSo: null,
      soVoiTruoc: x.m!.vp.size - x.m!.truoc, gvcn: null,
    }));
  return {
    khoa: `lop:${k}`, classId: k || null, nhan: r.maLop.get(k) ?? 'Không rõ lớp',
    viPham: m.vp.size, chuaXuLy: m.chua.size, hvCoViPham: m.hv.size, siSo: k ? (r.siSo.get(k) ?? null) : null,
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
    bienPhapTheoLoai: r.bienPhapTheoLoai, scopeEmpty: r.scopeEmpty,
  };
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`. `dong` = `hv:<id>` | `lop:<id>` | `lop:<id>|<nhóm>` | `gom`; `cot` = `vi-pham` | `chua-xu-ly` | `hv-co-vi-pham` (lớp). */
export function oYThucPhanTich(p: Principal, f: FilterYThuc & { dong: string; cot: string }):
  { n: number; tieuDe: string; rows: MetricRow[] } {
  const r = tinh(p, f);
  if (f.dong.startsWith('hv:')) {
    const id = Number(f.dong.slice(3));
    const t = r.hvTap.get(id);
    if (!t) throw badRequest('Học viên này không có trong danh sách — có thể bộ lọc vừa đổi.');
    const ten = r.hvRows.find((x) => x.studentId === id)!.ten;
    if (f.cot === 'vi-pham') return { n: t.vpKy.length, tieuDe: `${ten} · ${t.vpKy.length} vi phạm`, rows: rowsFor('vi-pham', [...t.vpKy].sort((a, b) => a - b)) };
    if (f.cot === 'chua-xu-ly') return { n: t.chua.length, tieuDe: `${ten} · ${t.chua.length} vi phạm chưa xử lý`, rows: rowsFor('vi-pham', [...t.chua].sort((a, b) => a - b)) };
    throw badRequest(`Cột "${f.cot}" không hợp lệ.`);
  }
  let mucs: Muc[]; let nhan: string;
  if (f.dong === 'gom') {
    mucs = [...r.lopMuc.values()].filter((m) => m.vp.size > 0 && !laHienRo(m));
    nhan = `${mucs.length} lớp khác`;
  } else if (f.dong.startsWith('lop:')) {
    const m = f.dong.includes('|') ? r.conMuc.get(f.dong.slice(4)) : r.lopMuc.get(Number(f.dong.slice(4)));
    if (!m || m.vp.size === 0) throw badRequest('Không tìm thấy dòng này trong bảng — có thể bộ lọc vừa đổi.');
    mucs = [m];
    const [k, cat] = f.dong.slice(4).split('|');
    nhan = `${r.maLop.get(Number(k)) ?? 'Không rõ lớp'}${cat ? ` · ${VIOLATION_CATEGORY_LABEL[cat as ViolationCategory] ?? cat}` : ''}`;
  } else throw badRequest('Không tìm thấy dòng này trong bảng — có thể bộ lọc vừa đổi.');
  const hop = (chon: (m: Muc) => Set<number>) => [...new Set(mucs.flatMap((m) => [...chon(m)]))].sort((a, b) => a - b);
  if (f.cot === 'vi-pham') { const ids = hop((m) => m.vp); return { n: ids.length, tieuDe: `${nhan} · ${ids.length} vi phạm`, rows: rowsFor('vi-pham', ids) }; }
  if (f.cot === 'chua-xu-ly') { const ids = hop((m) => m.chua); return { n: ids.length, tieuDe: `${nhan} · ${ids.length} vi phạm chưa xử lý`, rows: rowsFor('vi-pham', ids) }; }
  if (f.cot === 'hv-co-vi-pham') { const ids = hop((m) => m.hv); return { n: ids.length, tieuDe: `${nhan} · ${ids.length} HV có vi phạm`, rows: rowsFor('hoc-vien', ids) }; }
  throw badRequest(`Cột "${f.cot}" không hợp lệ.`);
}
