/**
 * HỒ SƠ GIÁO VIÊN (PR-GV). Không luật số mới: mọi số gọi hàm đang có — `myWork`/`viecCuaNguoi` (việc), `scoreDebtCells`
 * (ô điểm nợ), `listCases` + `chiTietCaseMo` (Case), `phanTichLop` (kết quả lớp), `yeuCauCuaToi` (yêu cầu).
 * Số ở ô và danh sách khi bấm (`oHoSoGv`) đi qua CÙNG các hàm tập bên dưới nên luôn bằng nhau.
 * Không xếp hạng, không so sánh giữa người (Q30-5): chỉ số của MỘT người, hoặc bảng sắp theo tên.
 */
import {
  ENTRY_SKILLS, ENTRY_SKILL_SHORT, PERMISSIONS, chuongTrinhTuThamSo, ctTuyChon, demViecTheoNhom, duongThe, laCotOGv, roleLabel, tenMonNgan,
  type ChuongTrinh, type CotOGv, type NhomViec,
} from '../../../shared/domain/index.ts';
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { bangLop, can, loadPrincipal, scopeFor, type Principal } from '../permissions.ts';
import { badRequest, forbidden, notFound } from '../util.ts';
import { phanTichLop, phanTichNhieuLop, type PhanTichLop } from '../classes/phanTichLop.ts';
import { listCases, type MappedCase } from '../cases/cases.ts';
import { chiTietCaseMo, type CaseChiTiet } from '../cases/caseLop.ts';
import { trongPhamVi, yeuCauCuaToi } from '../duyet/yeuCau.ts';
import { rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { myWork, viecCuaNguoi } from '../worklist/mywork.ts';
import { scoreDebtCells, type DebtCell } from '../worklist/scoreDebt.ts';
import { phamViHoSoGv } from './phamVi.ts';

const LO = 400;
const cho = (n: number) => Array.from({ length: n }, () => '?').join(',');
const theoLo = <T>(ds: readonly T[]) => Array.from({ length: Math.ceil(ds.length / LO) }, (_, i) => ds.slice(i * LO, (i + 1) * LO));

// ------------------------------------------------------------------ việc (Q3, Q4)

/**
 * Khối "Việc đang có": chính mình → `myWork(p)` (không `tatCa`: đúng "việc của tôi"); người khác → `viecCuaNguoi` (đã kiểm quyền xem).
 * Cùng nguồn với Công việc nên số ở ô = số dòng khi bấm.
 */
export function viecCuaGv(p: Principal, gvId: number): { nhom: NhomViec; n: number; quaHan: number }[] {
  const items = p.userId === gvId ? myWork(p).items : viecCuaNguoi(p, gvId).items;
  return demViecTheoNhom(items);
}

// ------------------------------------------------------------------ các hàm tập — MỘT nguồn cho số ở ô và danh sách khi bấm

export type LopGv = {
  id: number; ma: string; khung: 'ft' | 'thuong'; ct: string | null; branchId: number | null;
  /** Nhãn hiển thị: `GVCN` + tên môn ngắn. */
  vai: string[];
  /** Mã kỹ năng/môn thật được phân công (không phải nhãn) — để tô viền ô môn mình dạy. */
  monDay: string[];
  hocVien: number;
  /** Học viên đang học của lớp — để đếm học viên KHÁC NHAU của cả hồ sơ (một em học hai lớp của GV chỉ đếm một lần). */
  hvIds: Set<number>;
};
/** PR-Pb2-a: `ct = null` = gộp hai khung (hồ sơ GV, Lịch sắp tới). */
const locKhung = (ct: ChuongTrinh | null, khung: 'ft' | 'thuong') => ct === null || ct === khung;

/** Lớp GV đang dạy (phân công đang hiệu lực, lớp `active`), trong `branchIds` (null = mọi chi nhánh) và khung `ct`. FT trước, rồi theo mã lớp (Q17). */
export function lopCuaGv(gvId: number, homNay: string, branchIds: number[] | null, ct: ChuongTrinh | null = null): LopGv[] {
  if (Array.isArray(branchIds) && !branchIds.length) return [];
  const conn = db();
  const rows = conn.prepare(
    `SELECT ta.class_id, ta.is_core, ta.skill, c.code, c.branch_id, c.programme_code
       FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.user_id = ? AND ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        AND c.status = 'active' ${branchIds ? `AND c.branch_id IN (${cho(branchIds.length)})` : ''}
      ORDER BY ta.id`).all(gvId, homNay, homNay, ...(branchIds ?? [])) as any[];
  const bang = bangLop();
  const theoLop = new Map<number, LopGv>();
  for (const r of rows) {
    const khung = bang.get(r.class_id)?.isFastTrack ? 'ft' : 'thuong';
    if (!locKhung(ct, khung)) continue;
    const l = theoLop.get(r.class_id)
      ?? { id: r.class_id, ma: r.code, khung, ct: r.programme_code ?? null, branchId: r.branch_id, vai: [], monDay: [], hocVien: 0, hvIds: new Set() } as LopGv;
    theoLop.set(r.class_id, l);
    if (r.is_core && !l.vai.includes('GVCN')) l.vai.unshift('GVCN');
    if (r.skill && !l.monDay.includes(r.skill)) { l.monDay.push(r.skill); l.vai.push(tenMonNgan(l.ct, r.skill)); }
  }
  const lop = [...theoLop.values()];
  const theoId = new Map(lop.map((l) => [l.id, l]));
  for (const lo of theoLo(lop.map((l) => l.id))) {
    for (const r of conn.prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id IN (${cho(lo.length)}) AND e.status = 'active' AND s.archived_at IS NULL`).all(...lo) as any[]) theoId.get(r.class_id)!.hvIds.add(r.student_id);
  }
  for (const l of lop) l.hocVien = l.hvIds.size;
  return lop.sort((a, b) => (a.khung === b.khung ? a.ma.localeCompare(b.ma, 'vi') : a.khung === 'ft' ? -1 : 1));
}

/** Ô điểm chưa nhập của GV ở các lớp `lop` — `scoreDebtCells` (cùng luật bảng chấm), chỉ tính lớp đang hiện ở "Lớp đang dạy". */
export function noDiemCuaGv(p: Principal, gvId: number, homNay: string, lop: readonly LopGv[]): DebtCell[] {
  const lopIds = new Set(lop.map((l) => l.id));
  const chiNhanh = [...new Set(lop.map((l) => l.branchId).filter((b): b is number => b !== null))];
  return scoreDebtCells(p, homNay, chiNhanh).filter((d) => d.userId === gvId && lopIds.has(d.classId));
}

export type CaseGv = CaseChiTiet & { hocVien: string; maLop: string | null };
/** Case đang mở GV làm người phụ trách chính, trong `branchIds`, khung `ct`; quá hạn trước, rồi hạn gần (Q8, Q17). */
export function caseMoCuaGv(p: Principal, gvId: number, branchIds: number[] | null, ct: ChuongTrinh | null = null): CaseGv[] {
  return caseGvTuRows(listCases(p, { ownerUserId: gvId }).rows, branchIds, ct).map(({ chu, ...c }) => c);
}
/** Cùng luật lọc cho hồ sơ một GV và bảng chi nhánh (số ở bảng = số ở hồ sơ): Case chưa xong, chi nhánh gốc ∈ `branchIds`, khung `ct`. */
function caseGvTuRows(mapped: readonly MappedCase[], branchIds: number[] | null, ct: ChuongTrinh | null): (CaseGv & { chu: number })[] {
  const rows = mapped.filter((c) => c.state !== 'done'
    && (branchIds === null || branchIds.includes((c.homeBranchId ?? c.branchId) as number))
    && locKhung(ct, c.classKind === 'ft' ? 'ft' : 'thuong'));
  const chiTiet = chiTietCaseMo(rows);
  const out: (CaseGv & { chu: number })[] = [];
  for (const c of rows) {
    const t = chiTiet.get(c.id);
    if (t) out.push({ ...t, hocVien: c.studentName ?? '', maLop: c.classCode, chu: c.ownerUserId as number });
  }
  return out.sort((a, b) => Number(b.quaHan) - Number(a.quaHan) || (a.viecTiep?.han ?? '9999').localeCompare(b.viecTiep?.han ?? '9999') || a.id - b.id);
}

type TheGv = ReturnType<typeof yeuCauCuaToi>['the'][number];
/** Thẻ yêu cầu GV đã gửi; người khác (QL) xem thì chỉ thẻ trong phạm vi duyệt của người xem (`trongPhamVi`, đọc dòng gốc một câu/lô). */
export function theYeuCauCuaGv(p: Principal, gvId: number): TheGv[] {
  const the = yeuCauCuaToi(loadPrincipal(gvId)).the;
  if (p.userId === gvId || !the.length) return the;
  const conn = db();
  const duoc = new Set<number>();
  for (const lo of theoLo(the.map((t) => t.id))) {
    const rows = conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE id IN (${cho(lo.length)})`).all(...lo) as any[];
    for (const r of trongPhamVi(p, rows)) duoc.add(r.id);
  }
  return the.filter((t) => duoc.has(t.id));
}
const soYeuCau = (the: TheGv[], homNay: string) => ({
  cho: the.filter((t) => t.trangThai === 'cho').length,
  choQuaHan: the.filter((t) => t.trangThai === 'cho' && !!t.hanDuyet && t.hanDuyet < homNay).length,
  tuChoi: the.filter((t) => t.trangThai === 'tu_choi').length,
});

// ------------------------------------------------------------------ kết quả gần nhất (Q7 + chốt 30/09: không cột "Cả bài", môn mình dạy có viền)

export type KetQuaLop = {
  classId: number; ma: string; khung: 'ft' | 'thuong'; ct: string | null;
  moc: { key: string; nhan: string } | null;
  o: { dong: string; nhan: string; dat: number; tong: number; cuaMinh: boolean }[];
};
/** "Mốc gần nhất" = cột CUỐI (theo thứ tự `cot`) có ít nhất một ô có điểm — một mốc cho cả dòng lớp. */
function ketQuaCuaLop(l: LopGv, pt: PhanTichLop): KetQuaLop {
  const dong = pt.dong.filter((d) => d.key !== 'ca-bai');
  const moc = [...pt.cot].reverse().find((c) => dong.some((d) => (pt.o[`${d.key}|${c.key}`]?.tong ?? 0) > 0)) ?? null;
  return {
    classId: l.id, ma: l.ma, khung: l.khung, ct: l.ct, moc,
    o: moc ? dong.map((d) => {
      const x = pt.o[`${d.key}|${moc.key}`] ?? { dat: 0, tong: 0 };
      return { dong: d.key, nhan: d.nhan, dat: x.dat, tong: x.tong, cuaMinh: l.monDay.includes(d.key) };
    }) : [],
  };
}

// ------------------------------------------------------------------ hồ sơ một giáo viên

export type HoSoGv = {
  gv: { id: number; ten: string; vai: string[]; chiNhanh: string[]; kyNang: string[]; laChinhMinh: boolean };
  phamVi: { chiNhanh: string[] | null };
  lop: (Omit<LopGv, 'monDay' | 'branchId' | 'hvIds'> & { chuaNhap: number; quaHan: number })[];
  /** Học viên KHÁC NHAU ở mọi lớp trên — cùng số với ô "Học viên" (`oHoSoGv` cot=hoc-vien). */
  tongHocVien: number;
  caseMo: CaseGv[];
  yeuCau: { cho: number; choQuaHan: number; tuChoi: number };
  homNay: string;
};

export function hoSoGiaoVien(p: Principal, gvId: number): HoSoGv {
  const { branchIds, laChinhMinh } = phamViHoSoGv(p, gvId);          // quyền TRƯỚC mọi câu khác
  const homNay = demoToday();
  const conn = db();
  const ten = (conn.prepare(`SELECT full_name FROM users WHERE id = ?`).get(gvId) as any).full_name as string;
  const vaiRows = conn.prepare(
    `SELECT r.key, b.name AS chi_nhanh FROM user_roles ur JOIN roles r ON r.id = ur.role_id LEFT JOIN branches b ON b.id = ur.branch_id
      WHERE ur.user_id = ? AND ur.status = 'active' ORDER BY ur.id`).all(gvId) as any[];
  const daKhai = new Set((conn.prepare(`SELECT skill FROM user_skills WHERE user_id = ?`).all(gvId) as any[]).map((r) => r.skill));
  const tenChiNhanh = branchIds
    ? (conn.prepare(`SELECT name FROM branches WHERE id IN (${cho(branchIds.length)}) ORDER BY name`).all(...branchIds) as any[]).map((r) => r.name as string)
    : null;

  const lop = lopCuaGv(gvId, homNay, branchIds);
  const no = noDiemCuaGv(p, gvId, homNay, lop);
  const dem = (id: number, chiQuaHan: boolean) => no.filter((d) => d.classId === id && (!chiQuaHan || d.overdue)).length;
  return {
    gv: {
      id: gvId, ten, laChinhMinh,
      vai: [...new Set(vaiRows.map((r) => roleLabel(r.key)))],
      chiNhanh: [...new Set(vaiRows.map((r) => r.chi_nhanh).filter(Boolean))],
      kyNang: ENTRY_SKILLS.filter((k) => daKhai.has(k)).map((k) => ENTRY_SKILL_SHORT[k]),
    },
    phamVi: { chiNhanh: laChinhMinh ? null : tenChiNhanh },
    lop: lop.map(({ monDay, branchId, hvIds, ...l }) => ({ ...l, chuaNhap: dem(l.id, false), quaHan: dem(l.id, true) })),
    tongHocVien: new Set(lop.flatMap((l) => [...l.hvIds])).size,
    caseMo: caseMoCuaGv(p, gvId, branchIds),
    yeuCau: soYeuCau(theYeuCauCuaGv(p, gvId), homNay),
    homNay,
  };
}

/**
 * Hai khối nặng tách khỏi `hoSoGiaoVien` để mỗi lời gọi ≤ trần 100 câu SQL của `tocDoDuong` (đo: việc ≈ 45–55 câu; kết quả đọc mọi lớp
 * một lượt qua `phanTichNhieuLop` — PR-S5F-b, trước đó ≈ 7 câu/lớp). Web gọi song song, khối nào xong vẽ khối đó. Quyền kiểm ở CẢ hai (`phamViHoSoGv` trước hết).
 */
export function viecHoSoGv(p: Principal, gvId: number): { viec: { nhom: NhomViec; n: number; quaHan: number }[] } {
  phamViHoSoGv(p, gvId);
  return { viec: viecCuaGv(p, gvId) };
}

export function ketQuaHoSoGv(p: Principal, gvId: number): { ketQua: KetQuaLop[] } {
  const { branchIds } = phamViHoSoGv(p, gvId);
  /* Lớp người xem không có quyền xem điểm (vd GV được phân công lớp ở chi nhánh khác vai của họ) thì bỏ khỏi khối kết quả — không làm cả hồ sơ 403. */
  const lop = lopCuaGv(gvId, demoToday(), branchIds).filter((l) => can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: l.id }));
  /* PR-S5F-b: mọi lớp một lượt (bài thi + điểm đọc một câu mỗi bảng) — số câu không tăng theo số lớp. */
  const pt = phanTichNhieuLop(lop.map((l) => l.id));
  return { ketQua: lop.map((l) => ketQuaCuaLop(l, pt.get(l.id)!)) };
}

// ------------------------------------------------------------------ danh sách sau một số (ô bấm được)

export type ThamSoO = { cot: string; lop?: number | null; dong?: string | null; moc?: string | null; cn?: number | null; ct?: string | null };

export function oHoSoGv(p: Principal, gvId: number, q: ThamSoO): { n: number; tieuDe: string; rows: MetricRow[] } {
  if (!laCotOGv(q.cot)) throw badRequest('Cột không hợp lệ.');
  const cot: CotOGv = q.cot;
  let { branchIds, laChinhMinh } = phamViHoSoGv(p, gvId);
  if (q.cn != null) {
    if (branchIds !== null && !branchIds.includes(q.cn)) throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xem.');
    branchIds = [q.cn];
  }
  const homNay = demoToday();
  const ct = ctTuyChon(q.ct);   // vắng = gộp hai khung (Q2)
  const conn = db();
  const ket = (rows: MetricRow[], tieuDe: (n: number) => string) => ({ n: rows.length, tieuDe: tieuDe(rows.length), rows });

  if (cot === 'yc-cho' || cot === 'yc-tu-choi') {
    const trang = cot === 'yc-cho' ? 'cho' : 'tu_choi';
    const rows = theYeuCauCuaGv(p, gvId).filter((t) => t.trangThai === trang).map((t) => ({
      id: t.id, title: t.tieuDe, sub: [t.nhanLoai, t.hocVien, t.lop].filter(Boolean).join(' · '),
      href: duongThe(t.id, laChinhMinh ? 'nguoi-xin' : 'duyet'),
    }));
    return ket(rows, (n) => `${n} yêu cầu ${cot === 'yc-cho' ? 'đang chờ duyệt' : 'bị từ chối'}`);
  }
  if (cot === 'case-mo' || cot === 'case-qua-han') {
    const ds = caseMoCuaGv(p, gvId, branchIds, ct).filter((c) => cot === 'case-mo' || c.quaHan);
    return ket(rowsFor('case', ds.map((c) => c.id)), (n) => `${n} Case ${cot === 'case-mo' ? 'đang phụ trách' : 'có việc tiếp quá hạn'}`);
  }

  const lop = lopCuaGv(gvId, homNay, branchIds, ct);
  const chonLop = q.lop != null ? lop.filter((l) => l.id === q.lop) : lop;
  if (q.lop != null && !chonLop.length) throw forbidden('Lớp này không nằm trong danh sách lớp đang dạy của giáo viên.');

  if (cot === 'lop') {
    return ket(lop.map((l) => ({ id: l.id, title: l.ma, sub: l.vai.join(' · '), href: `/hoc-vien/lop/${l.id}` })), (n) => `${n} lớp đang dạy`);
  }
  if (cot === 'hoc-vien') {
    const ids = [...new Set(chonLop.flatMap((l) => [...l.hvIds]))].sort((a, b) => a - b);
    return ket(rowsFor('hoc-vien', ids), (n) => `${n} học viên đang học`);
  }
  if (cot === 'chua-nhap' || cot === 'qua-han') {
    const o = noDiemCuaGv(p, gvId, homNay, chonLop).filter((d) => cot === 'chua-nhap' || d.overdue);
    const goc = new Map(rowsFor('bai-thi', [...new Set(o.map((d) => d.attemptId))]).map((r) => [r.id, r]));
    const ctLop = new Map(chonLop.map((l) => [l.id, l.ct]));
    const thuTu = new Map<number, number>();
    const rows = o.map((d) => {
      const k = thuTu.get(d.attemptId) ?? 0;
      thuTu.set(d.attemptId, k + 1);
      return { ...goc.get(d.attemptId)!, id: d.attemptId * 10 + k,        // id duy nhất cho mỗi ô (một lượt ≤ 5 ô)
        title: `${goc.get(d.attemptId)!.title} · ${tenMonNgan(ctLop.get(d.classId), d.skill)}` };
    });
    return ket(rows, (n) => `${n} ô điểm ${cot === 'chua-nhap' ? 'chưa nhập' : 'quá hạn nhập'}`);
  }

  // cot === 'ket-qua': ô đạt/tổng của một lớp ở một mốc
  if (q.lop == null || !q.dong || !q.moc) throw badRequest('Thiếu lớp, dòng hoặc mốc của ô kết quả.');
  const l = chonLop[0];
  const pt = phanTichLop(p, l.id);
  if (!pt.dong.some((d) => d.key === q.dong && d.key !== 'ca-bai') || !pt.cot.some((c) => c.key === q.moc)) throw badRequest('Ô kết quả không có trong bảng của lớp này.');
  const x = pt.ds[`${q.dong}|${q.moc}`] ?? { dat: [], chua: [] };
  const chu = l.khung === 'ft' ? ['Đạt kỳ vọng', 'Dưới kỳ vọng'] : ['Đạt', 'Chưa đạt'];
  const dong = pt.dong.find((d) => d.key === q.dong)!;
  const gan = (ids: number[], nhan: string) => rowsFor('hoc-vien', ids).map((r) => ({ ...r, sub: [r.sub, nhan].filter(Boolean).join(' · ') }));
  return ket([...gan(x.dat, chu[0]), ...gan(x.chua, chu[1])], (n) => `${n} học viên · ${l.ma} · ${dong.nhan}`);
}

// ------------------------------------------------------------------ bảng giáo viên của một chi nhánh (Q11, K1-28) — không xếp hạng, không hàng tổng

export type HangGv = { id: number; ten: string; lop: number; hocVien: number; chuaNhap: number; quaHan: number; caseMo: number; caseQuaHan: number };
export type BangGv = { cn: number; tenChiNhanh: string; ct: ChuongTrinh; hang: HangGv[] };

/**
 * Mỗi hàng = MỘT người, chỉ số của chính người đó trong chi nhánh `cn` và khung `ct`; sắp theo TÊN. Số câu SQL không tăng theo số GV / lớp / Case:
 * một câu phân công, một câu ghi danh (lô 400), một lần `scoreDebtCells`, một lần `listCases` + `chiTietCaseMo`, một câu tên người. Mỗi số là số
 * của hồ sơ người đó (`/giao-vien/:id/o?cot=…&cn=&ct=` cho ra đúng danh sách) — cùng `caseGvTuRows`, cùng khung lớp.
 */
export function bangGvChiNhanh(p: Principal, q: { cn?: number | null; ct?: string | null }): BangGv {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) throw forbidden('Chỉ Quản lý và Quản trị hệ thống xem được bảng này.');
  const cn = q.cn ?? (!scope.all && scope.branchIds.length === 1 ? scope.branchIds[0] : null);
  if (cn === null) throw badRequest('Chọn một chi nhánh.');
  if (!scope.all && !scope.branchIds.includes(cn)) throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const cb = conn.prepare(`SELECT name FROM branches WHERE id = ?`).get(cn) as any;
  if (!cb) throw notFound('Không tìm thấy chi nhánh này.');
  const homNay = demoToday();
  const ct = chuongTrinhTuThamSo(q.ct);
  const bang = bangLop();

  const lopCua = new Map<number, Set<number>>();                 // người → lớp (trong khung)
  const ten = new Map<number, string>();
  for (const r of conn.prepare(
    `SELECT ta.user_id, ta.class_id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id JOIN classes c ON c.id = ta.class_id
      WHERE ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        AND u.status = 'active' AND c.status = 'active' AND c.branch_id = ?`).all(homNay, homNay, cn) as any[]) {
    ten.set(r.user_id, r.full_name);                              // có phân công ở chi nhánh (mọi khung) → hồ sơ mở được cho QL
    if (!locKhung(ct, bang.get(r.class_id)?.isFastTrack ? 'ft' : 'thuong')) continue;
    (lopCua.get(r.user_id) ?? lopCua.set(r.user_id, new Set()).get(r.user_id)!).add(r.class_id);
  }

  const hvCuaLop = new Map<number, Set<number>>();
  for (const lo of theoLo([...new Set([...lopCua.values()].flatMap((s) => [...s]))])) {
    for (const r of conn.prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id IN (${cho(lo.length)}) AND e.status = 'active' AND s.archived_at IS NULL`).all(...lo) as any[]) {
      (hvCuaLop.get(r.class_id) ?? hvCuaLop.set(r.class_id, new Set()).get(r.class_id)!).add(r.student_id);
    }
  }
  const no = scoreDebtCells(p, homNay, [cn]);

  const caseTheoNguoi = new Map<number, CaseGv[]>();
  const rowsCase = listCases(p, { branchId: cn }).rows.filter((c) => c.ownerUserId !== null);
  for (const c of caseGvTuRows(rowsCase, [cn], ct)) {
    (caseTheoNguoi.get(c.chu) ?? caseTheoNguoi.set(c.chu, []).get(c.chu)!).push(c);
  }
  /* Người phụ trách Case chưa có phân công ở chi nhánh: chỉ hiện khi có VAI ở chi nhánh — đúng luật mở hồ sơ (`phamViHoSoGv`), để tên bấm được không 403. */
  const thieuTen = [...caseTheoNguoi.keys()].filter((id) => !ten.has(id));
  for (const lo of theoLo(thieuTen)) {
    for (const r of conn.prepare(
      `SELECT u.id, u.full_name FROM users u WHERE u.status = 'active' AND u.id IN (${cho(lo.length)})
          AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.status = 'active' AND ur.branch_id = ?)`).all(...lo, cn) as any[]) ten.set(r.id, r.full_name);
  }

  const hang: HangGv[] = [];
  for (const [id, hoTen] of ten) {
    const lop = lopCua.get(id) ?? new Set<number>();
    const mine = no.filter((d) => d.userId === id && lop.has(d.classId));
    const cases = caseTheoNguoi.get(id) ?? [];
    const hv = new Set([...lop].flatMap((l) => [...(hvCuaLop.get(l) ?? [])]));
    const h = { id, ten: hoTen, lop: lop.size, hocVien: hv.size, chuaNhap: mine.length, quaHan: mine.filter((d) => d.overdue).length,
      caseMo: cases.length, caseQuaHan: cases.filter((c) => c.quaHan).length };
    if (h.lop || h.chuaNhap || h.caseMo) hang.push(h);                      // bỏ hàng toàn 0
  }
  hang.sort((a, b) => a.ten.localeCompare(b.ten, 'vi') || a.id - b.id);
  return { cn, tenChiNhanh: cb.name, ct, hang };
}
