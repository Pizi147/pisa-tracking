/**
 * HỒ SƠ GIÁO VIÊN (PR-GV). Không luật số mới: mọi số gọi hàm đang có — `myWork`/`viecCuaNguoi` (việc), `scoreDebtCells`
 * (ô điểm nợ), `listCases` + `chiTietCaseMo` (Case), `yeuCauCuaToi` (yêu cầu).
 * Số ở ô và danh sách khi bấm (`oHoSoGv`) đi qua CÙNG các hàm tập bên dưới nên luôn bằng nhau.
 * Không xếp hạng, không so sánh giữa người (Q30-5): chỉ số của MỘT người, hoặc bảng sắp theo tên.
 */
import {
  ENTRY_SKILLS, ENTRY_SKILL_SHORT, PERMISSIONS, TRANG_THAI, baiId, canChamCheo, chuongTrinhTuThamSo, ctTuyChon, demViecTheoNhom, duongThe, laCotOGv, mondayOfDate, nhanVaiLop, roleLabel, soSanhLop, tenMonNgan,
  type ChipBanGiao, type ChuongTrinh, type CotOGv, type NhomViec,
} from '../../../shared/domain/index.ts';
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { bangLop, loadPrincipal, scopeFor, type Principal } from '../permissions.ts';
import { badRequest, forbidden, notFound } from '../util.ts';
import { xuLyCaseMany } from '../cases/sosState.ts';
import { listCases, type MappedCase } from '../cases/cases.ts';
import { chiTietCaseMo, type CaseChiTiet } from '../cases/caseLop.ts';
import { trongPhamVi, yeuCauCuaToi } from '../duyet/yeuCau.ts';
import { rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { myWork, viecCuaNguoi } from '../worklist/mywork.ts';
import { phamViXemViec } from '../worklist/xemViec.ts';
import { scoreDebtCells, type DebtCell } from '../worklist/scoreDebt.ts';
import { viecBanGiao } from '../classes/banGiao.ts';
import { phamViHoSoGv } from './phamVi.ts';

const LO = 400;
const cho = (n: number) => Array.from({ length: n }, () => '?').join(',');
const theoLo = <T>(ds: readonly T[]) => Array.from({ length: Math.ceil(ds.length / LO) }, (_, i) => ds.slice(i * LO, (i + 1) * LO));

// ------------------------------------------------------------------ việc (Q3, Q4)

/**
 * Khối "Việc đang có": chính mình → `myWork(p)` (không `tatCa`: đúng "việc của tôi"); người khác → `viecCuaNguoi` (đã kiểm quyền xem).
 * Cùng nguồn (`dong`) với Công việc nên số ở ô = số dòng khi bấm.
 */
export function viecCuaGv(p: Principal, gvId: number): { nhom: NhomViec; n: number; quaHan: number }[] {
  /* PR-VN3 (GOP): đếm DÒNG (`dong`) như badge Công việc — trước đây đếm từng việc nên lệch. */
  const dong = p.userId === gvId ? myWork(p).dong : viecCuaNguoi(p, gvId).dong;
  /* OV-11c (PT-7): chỉ ô nhóm người xem được xem — Admin chỉ Chấm điểm (không bày ô "0" của nhóm mình không thấy). */
  const chiChamDiem = p.userId !== gvId && phamViXemViec(p) === 'cham-diem';
  return demViecTheoNhom(dong ?? []).filter((x) => !chiChamDiem || x.nhom === 'cham-diem');
}

// ------------------------------------------------------------------ các hàm tập — MỘT nguồn cho số ở ô và danh sách khi bấm

export type LopGv = {
  id: number; ma: string; khung: 'ft' | 'thuong'; ct: string | null; branchId: number | null;
  /** Q31-6: MỘT nhãn "GVCN · L R G+V" (`nhanVaiLop`). */
  vai: string;
  laGvcn: boolean;
  /** Mã kỹ năng/môn thật được phân công (không phải nhãn) — để tô viền ô môn mình dạy. */
  monDay: string[];
  hocVien: number;
  /** Tuần khai giảng (Thứ Hai) hoặc ngày khai giảng — bảng lớp hồ sơ GV xếp lớp lâu nhất lên đầu. */
  khai: string | null;
  /** Học viên đang học của lớp — để đếm học viên KHÁC NHAU của cả hồ sơ (một em học hai lớp của GV chỉ đếm một lần). */
  hvIds: Set<number>;
};
/** Thứ tự môn trong nhãn vai (Q31-6): L · R · W / W1 · W2 · S — cùng thứ tự cột kết quả. */
const THU_TU_MON = ['tong_hop', 'listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking'];
/** PR-Pb2-a: `ct = null` = gộp hai khung (hồ sơ GV, Lịch sắp tới). */
const locKhung = (ct: ChuongTrinh | null, khung: 'ft' | 'thuong') => ct === null || ct === khung;

/** Lớp GV đang dạy (phân công đang hiệu lực, lớp `active`), trong `branchIds` (null = mọi chi nhánh) và khung `ct`. FT trước, rồi theo mã lớp (Q17). */
export function lopCuaGv(gvId: number, homNay: string, branchIds: number[] | null, ct: ChuongTrinh | null = null): LopGv[] {
  if (Array.isArray(branchIds) && !branchIds.length) return [];
  const conn = db();
  const rows = conn.prepare(
    `SELECT ta.class_id, ta.is_core, ta.skill, c.code, c.branch_id, c.programme_code, COALESCE(sp.week_start, c.start_date) AS khai
       FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id LEFT JOIN report_periods sp ON sp.id = c.start_period_id
      WHERE ta.user_id = ? AND ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        AND c.status = 'active' ${branchIds ? `AND c.branch_id IN (${cho(branchIds.length)})` : ''}
      ORDER BY ta.id`).all(gvId, homNay, homNay, ...(branchIds ?? [])) as any[];
  const bang = bangLop();
  const theoLop = new Map<number, LopGv>();
  for (const r of rows) {
    const khung = bang.get(r.class_id)?.isFastTrack ? 'ft' : 'thuong';
    if (!locKhung(ct, khung)) continue;
    const l = theoLop.get(r.class_id)
      ?? { id: r.class_id, ma: r.code, khung, ct: r.programme_code ?? null, branchId: r.branch_id, khai: r.khai ?? null, vai: '', laGvcn: false, monDay: [], hocVien: 0, hvIds: new Set() } as LopGv;
    theoLop.set(r.class_id, l);
    if (r.is_core) l.laGvcn = true;
    if (r.skill && !l.monDay.includes(r.skill)) l.monDay.push(r.skill);
  }
  const lop = [...theoLop.values()];
  for (const l of lop) {
    l.monDay.sort((a, b) => THU_TU_MON.indexOf(a) - THU_TU_MON.indexOf(b));
    l.vai = nhanVaiLop({ gvcn: l.laGvcn, mon: l.monDay.map((k) => tenMonNgan(l.ct, k)) });
  }
  const theoId = new Map(lop.map((l) => [l.id, l]));
  for (const lo of theoLo(lop.map((l) => l.id))) {
    for (const r of conn.prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id IN (${cho(lo.length)}) AND e.status = 'active' AND s.archived_at IS NULL`).all(...lo) as any[]) theoId.get(r.class_id)!.hvIds.add(r.student_id);
  }
  for (const l of lop) l.hocVien = l.hvIds.size;
  return lop.sort((a, b) => (a.khung === b.khung ? soSanhLop({ code: a.ma }, { code: b.ma }) : a.khung === 'ft' ? -1 : 1));   // U1: MB FT 9 trước MB FT 10
}

/**
 * Ô điểm chưa nhập của GV ở các lớp `lop` — `scoreDebtCells` (cùng luật bảng chấm), chỉ tính lớp đang hiện ở "Lớp đang dạy".
 * OV-13o: `lopCheo` (lớp GV Speaking chấm chéo — Tổng quan "Lớp tôi dạy") thêm bài S chấm chéo đã tới lượt chấm, cùng luật `canChamCheo` với Công việc.
 * Hồ sơ GV không truyền: chấm chéo không là việc của GV (T18).
 */
export function noDiemCuaGv(p: Principal, gvId: number, homNay: string, lop: readonly Pick<LopGv, 'id' | 'branchId'>[],
  lopCheo: ReadonlySet<number> = new Set()): DebtCell[] {
  const lopIds = new Set(lop.map((l) => l.id));
  const chiNhanh = [...new Set(lop.map((l) => l.branchId).filter((b): b is number => b !== null))];
  const tuan = mondayOfDate(homNay);
  return scoreDebtCells(p, homNay, chiNhanh).filter((d) => lopIds.has(d.classId)
    && (d.userId === gvId || (lopCheo.has(d.classId) && canChamCheo(!!d.chamCheo, d.tuanThi, tuan))));
}

export type CaseGv = CaseChiTiet & { hocVien: string; maLop: string | null };
/** Case đang mở GV làm người phụ trách chính, trong `branchIds`, khung `ct`; quá hạn trước, rồi hạn gần (Q8, Q17). */
export function caseMoCuaGv(p: Principal, gvId: number, branchIds: number[] | null, ct: ChuongTrinh | null = null): CaseGv[] {
  return caseGvTuRows(listCases(p, { ownerUserId: gvId }).rows, branchIds, ct).map(({ chu, ...c }) => c);
}
/** UI-TONG-QUAN (XM-2): Case đang mở theo người phụ trách ở chi nhánh `cn` — CÙNG luật bảng GV chi nhánh / panel `/giao-vien/:id/o?cot=case-mo&cn=&ct=`. */
export function caseMoTheoChu(p: Principal, cn: number, ct: ChuongTrinh | null): Map<number, number[]> {
  const m = new Map<number, number[]>();
  for (const c of caseGvTuRows(listCases(p, { branchId: cn }).rows.filter((c) => c.ownerUserId !== null), [cn], ct)) (m.get(c.chu) ?? m.set(c.chu, []).get(c.chu)!).push(c.id);
  return m;
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

// ------------------------------------------------------------------ hồ sơ một giáo viên

export type HoSoGv = {
  gv: { id: number; ten: string; vai: string[]; chiNhanh: string[]; kyNang: string[]; laChinhMinh: boolean };
  /** `cn`: chi nhánh cho link "Hiệu quả PA của …" (P6, Q26) — chi nhánh duy nhất trong phạm vi người xem, không thì chi nhánh của GV. */
  phamVi: { chiNhanh: string[] | null; cn: number | null };
  /** `gvcn`: tên GVCN của lớp khi GV này không phải GVCN (khối Lớp đang dạy, V5-D khu e). */
  lop: (Omit<LopGv, 'monDay' | 'branchId' | 'hvIds'> & { kyNang: string[]; gvcn: string | null; chuaNhap: number; quaHan: number; banGiao: ChipBanGiao | null })[];
  /** Học viên KHÁC NHAU ở mọi lớp trên — cùng số với ô "Học viên" (`oHoSoGv` cot=hoc-vien). */
  tongHocVien: number;
  /** `coPa`: Case đã chốt PA (không nằm ở cột "Chờ duyệt" — CÙNG `xuLyCaseMany` của chỉ số "Case chưa chốt PA", Tổng quan XM-2). */
  caseMo: (CaseGv & { coPa: boolean })[];
  yeuCau: { cho: number; choQuaHan: number; tuChoi: number };
  homNay: string;
};

export function hoSoGiaoVien(p: Principal, gvId: number): HoSoGv {
  const { branchIds, laChinhMinh } = phamViHoSoGv(p, gvId);          // quyền TRƯỚC mọi câu khác
  const homNay = demoToday();
  const conn = db();
  const ten = (conn.prepare(`SELECT full_name FROM users WHERE id = ?`).get(gvId) as any).full_name as string;
  const vaiRows = conn.prepare(
    `SELECT r.key, b.id AS cn, b.name AS chi_nhanh FROM user_roles ur JOIN roles r ON r.id = ur.role_id LEFT JOIN branches b ON b.id = ur.branch_id
      WHERE ur.user_id = ? AND ur.status = 'active' ORDER BY ur.id`).all(gvId) as any[];
  const daKhai = new Set((conn.prepare(`SELECT skill FROM user_skills WHERE user_id = ?`).all(gvId) as any[]).map((r) => r.skill));
  const tenChiNhanh = branchIds
    ? (conn.prepare(`SELECT name FROM branches WHERE id IN (${cho(branchIds.length)}) ORDER BY name`).all(...branchIds) as any[]).map((r) => r.name as string)
    : null;

  const lop = lopCuaGv(gvId, homNay, branchIds);
  const no = noDiemCuaGv(p, gvId, homNay, lop);
  const dem = (id: number, chiQuaHan: boolean) => no.filter((d) => d.classId === id && (!chiQuaHan || d.overdue)).length;
  const banGiao = chipBanGiao(gvId);
  const caseMo = caseMoCuaGv(p, gvId, branchIds);
  const xl = xuLyCaseMany(caseMo.map((c) => c.id), homNay);
  const gvcnLop = new Map<number, string>();
  const khongCn = lop.filter((l) => !l.laGvcn).map((l) => l.id);
  if (khongCn.length) {
    for (const r of conn.prepare(
      `SELECT ta.class_id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id IN (${cho(khongCn.length)}) AND ta.is_core = 1 AND ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        ORDER BY ta.id`).all(...khongCn, homNay, homNay) as any[]) gvcnLop.set(r.class_id, r.full_name);
  }
  return {
    gv: {
      id: gvId, ten, laChinhMinh,
      vai: [...new Set(vaiRows.map((r) => roleLabel(r.key)))],
      chiNhanh: [...new Set(vaiRows.map((r) => r.chi_nhanh).filter(Boolean))],
      kyNang: ENTRY_SKILLS.filter((k) => daKhai.has(k)).map((k) => ENTRY_SKILL_SHORT[k]),
    },
    phamVi: {
      chiNhanh: laChinhMinh ? null : tenChiNhanh,
      cn: branchIds?.length === 1 ? branchIds[0] : vaiRows.map((r) => r.cn as number | null).find((b) => b != null && (!branchIds || branchIds.includes(b))) ?? null,
    },
    lop: lop.map(({ monDay, branchId, hvIds, ...l }) => ({
      ...l, kyNang: monDay.map((k) => tenMonNgan(l.ct, k)), gvcn: l.laGvcn ? null : gvcnLop.get(l.id) ?? null,
      chuaNhap: dem(l.id, false), quaHan: dem(l.id, true), banGiao: banGiao.get(l.id) ?? null,
    })),
    tongHocVien: new Set(lop.flatMap((l) => [...l.hvIds])).size,
    caseMo: caseMo.map((c) => ({ ...c, coPa: xl.get(c.id)?.cot !== 'choDuyet' })),
    yeuCau: soYeuCau(theYeuCauCuaGv(p, gvId), homNay),
    homNay,
  };
}

/**
 * O6 (Q25): chip bàn giao theo lớp từ `viecBanGiao` — cùng nguồn việc Bàn giao ở Công việc, gọi MỘT lần (ba câu cố định). Chỉ lớp còn dở.
 * GVCN: phiếu đã xác nhận / số em có lệnh. GVBM (không làm GVCN lớp đó): môn còn thiếu dòng, số em đã ghi ít nhất trong các môn / số em cần ghi.
 */
export function chipBanGiao(gvId: number): Map<number, ChipBanGiao> {
  const out = new Map<number, ChipBanGiao>();
  const viec = viecBanGiao(gvId);
  for (const v of viec) if (v.loai === 'gvcn') out.set(v.lopId, { loai: 'gvcn', mon: null, maMon: null, da: v.daXacNhan, n: v.n });
  for (const v of viec) {
    if (v.loai !== 'gvbm' || out.get(v.lopId)?.loai === 'gvcn') continue;
    const cu = out.get(v.lopId);
    out.set(v.lopId, cu
      ? { ...cu, mon: `${cu.mon} ${v.monNgan}`, da: Math.min(cu.da, v.daGhi) }
      : { loai: 'gvbm', mon: v.monNgan, maMon: v.mon, da: v.daGhi, n: v.n });
  }
  return out;
}

/**
 * Hai khối nặng tách khỏi `hoSoGiaoVien` để mỗi lời gọi ≤ trần 100 câu SQL của `tocDoDuong` (đo: việc ≈ 45–55 câu; kết quả đọc mọi lớp
 * một lượt qua `phanTichNhieuLop` — PR-S5F-b, trước đó ≈ 7 câu/lớp). Web gọi song song, khối nào xong vẽ khối đó. Quyền kiểm ở CẢ hai (`phamViHoSoGv` trước hết).
 */
export function viecHoSoGv(p: Principal, gvId: number): { viec: { nhom: NhomViec; n: number; quaHan: number }[] } {
  phamViHoSoGv(p, gvId);
  return { viec: viecCuaGv(p, gvId) };
}

// ------------------------------------------------------------------ danh sách sau một số (ô bấm được)

/** `tt`: chỉ Case có trạng thái đó (`TRANG_THAI`) — hàng đếm theo trạng thái ở khối Case đang phụ trách (UI-HO-SO-GV). */
export type ThamSoO = { cot: string; lop?: number | null; cn?: number | null; ct?: string | null; tt?: string | null };

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
    if (q.tt != null && !(TRANG_THAI as readonly string[]).includes(q.tt)) throw badRequest('Trạng thái không hợp lệ.');
    const ds = caseMoCuaGv(p, gvId, branchIds, ct).filter((c) => (cot === 'case-mo' || c.quaHan) && (!q.tt || c.trangThai.t === q.tt));
    return ket(rowsFor('case', ds.map((c) => c.id), undefined, p), (n) => `${n} Case ${cot === 'case-mo' ? 'đang phụ trách' : 'có việc tiếp quá hạn'}`);
  }

  const lop = lopCuaGv(gvId, homNay, branchIds, ct);
  const chonLop = q.lop != null ? lop.filter((l) => l.id === q.lop) : lop;
  if (q.lop != null && !chonLop.length) throw forbidden('Lớp này không nằm trong danh sách lớp đang dạy của giáo viên.');

  if (cot === 'lop') {
    return ket(lop.map((l) => ({ id: l.id, title: l.ma, sub: l.vai, href: `/hoc-vien/lop/${l.id}` })), (n) => `${n} lớp đang dạy`);
  }
  if (cot === 'hoc-vien') {
    const ids = [...new Set(chonLop.flatMap((l) => [...l.hvIds]))].sort((a, b) => a - b);
    return ket(rowsFor('hoc-vien', ids), (n) => `${n} học viên đang học`);
  }
  if (cot === 'chua-nhap' || cot === 'qua-han') {
    const o = noDiemCuaGv(p, gvId, homNay, chonLop).filter((d) => cot === 'chua-nhap' || d.overdue);
    /* PR-UXF-a Q7: mỗi dòng một BÀI (`baiId`) — CÙNG dựng dòng với ô "bài chưa nhập điểm quá hạn" ở Tổng quan (`rowsFor('bai')`). */
    return ket(rowsFor('bai', o.map((d) => baiId(d.attemptId, d.skill)), undefined, p), (n) => `${n} bài ${cot === 'chua-nhap' ? 'chưa nhập' : 'quá hạn nhập'}`);
  }

  throw badRequest('Cột không hợp lệ.');
}

// ------------------------------------------------------------------ bảng giáo viên của một chi nhánh (Q11, K1-28) — không xếp hạng, không hàng tổng

export type HangGv = { id: number; ten: string; lop: number; hocVien: number; chuaNhap: number; quaHan: number; caseMo: number; caseQuaHan: number };
/**
 * `chuaPhanCong` (PR-UXF-a Q8): bài của môn CHƯA phân công giáo viên — không phải một người, nên không nằm trong `hang`.
 * PR-LT3 (chủ sản phẩm 06/10): bảng chỉ đếm bài CÓ người phụ trách + Chưa phân công; Speaking Mock chưa ai chấm (T18) không vào bảng —
 * thấy ở Lịch Test khối 1 (cột "GV chấm chéo"). Σ bảng = ô Tổng quan trừ các ô chấm chéo.
 */
export type BangGv = { cn: number; tenChiNhanh: string; ct: ChuongTrinh; hang: HangGv[]; chuaPhanCong: { chuaNhap: number; quaHan: number } | null };

/**
 * Mỗi hàng = MỘT người, chỉ số của chính người đó trong chi nhánh `cn` và khung `ct`; sắp theo TÊN. Số câu SQL không tăng theo số GV / lớp / Case:
 * một câu phân công, một câu ghi danh (lô 400), một lần `scoreDebtCells`, một lần `listCases` + `chiTietCaseMo`, một câu tên người. Mỗi số là số
 * của hồ sơ người đó (`/giao-vien/:id/o?cot=…&cn=&ct=` cho ra đúng danh sách) — cùng `caseGvTuRows`, cùng khung lớp.
 */
export function bangGvChiNhanh(p: Principal, q: { cn?: number | null; ct?: string | null }): BangGv {
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW_TEACHER);
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
  /* PR-UXF-a Q8: bài của môn CHƯA PHÂN CÔNG giáo viên vẫn là nợ — dòng riêng cuối bảng (không phải người, không hồ sơ) để Σ = ô Tổng quan. */
  const chuaPc = no.filter((d) => d.userId === null && !d.chamCheo && locKhung(ct, bang.get(d.classId)?.isFastTrack ? 'ft' : 'thuong'));
  return { cn, tenChiNhanh: cb.name, ct, hang,
    chuaPhanCong: chuaPc.length ? { chuaNhap: chuaPc.length, quaHan: chuaPc.filter((d) => d.overdue).length } : null };
}
