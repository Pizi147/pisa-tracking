import { db, tx } from '../db.ts';
import { CASE_CATEGORY_SKILL, MON_GOP, PERMISSIONS, caseThuocO, caseTopicLabel, categoryOf, laCapBanGiao, tenMonNgan, type DoiO } from '../../../shared/domain/index.ts';
import { can, isCoreTeacherOf, napTruocPhamVi, type Principal } from '../permissions.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { conflict, loi, nowIso } from '../util.ts';
import { activeClassOf } from '../yThuc/access.ts';
import { kiemXemCase } from './cases.ts';

/**
 * GỢI Ý NGƯỜI PHỤ TRÁCH CHÍNH cho một Case mới (mục 2.3).
 *
 * Quy tắc do owner chốt, và cố ý rất hẹp:
 *   · giáo viên ĐANG DẠY ĐÚNG KỸ NĂNG đó ở lớp của em; chưa phân công ai thì giáo viên chủ nhiệm
 *   (Ý thức không còn Case nên không còn người phụ trách Case Ý thức — 21/09/2026.)
 *
 * KHÔNG suy ra từ "mọi giáo viên dạy lớp đó". Một lớp có năm giáo viên, gán cả năm người
 * làm người phụ trách nghĩa là năm người cùng nợ một việc — và cuối cùng không ai làm.
 *
 * Không tìm được ai thì trả về NULL, và màn hình nói thẳng "chưa có người phụ trách" kèm
 * đường phân công. Thà nói thật là chưa ai nhận, còn hơn gán bừa một cái tên rồi người đó
 * không biết mình đang giữ việc gì.
 */
export function suggestCaseOwner(input: {
  classId: number | null; category: string | null;
}): number | null {
  return input.classId ? chonChuCase(phanCongLop(input.classId), input.category)?.user_id ?? null : null;
}

type PhanCong = { user_id: number; skill: string | null; is_core: number; ten: string | null };
/** Phân công đang chạy của lớp, theo thứ tự id (một câu đọc — CASE-NHIEU đọc một lần cho mọi kỹ năng). */
const phanCongLop = (classId: number) => db().prepare(
  `SELECT ta.user_id, ta.skill, ta.is_core, u.full_name AS ten FROM teacher_assignments ta LEFT JOIN users u ON u.id = ta.user_id
    WHERE ta.class_id = ? AND ta.status = 'active' ORDER BY ta.id`,
).all(classId) as PhanCong[];

/** Luật mục 2.3 (một chỗ): GV dạy đúng kỹ năng của hạng mục; chưa phân công ai thì GVCN — vẫn là một người cụ thể, không phải cả lớp. */
function chonChuCase(ds: PhanCong[], category: string | null): PhanCong | null {
  const skill = CASE_CATEGORY_SKILL[category as keyof typeof CASE_CATEGORY_SKILL] ?? null;
  return (skill ? ds.find((r) => r.skill === skill) : undefined) ?? ds.find((r) => r.is_core === 1) ?? null;
}

/** CASE-NHIEU: người phụ trách gợi ý cho từng kỹ năng (`case-topics` — đầu thẻ "phụ trách: …"), cùng luật `suggestCaseOwner`. */
export function chuCaseTheoKyNang(classId: number | null, topics: readonly string[]) {
  const ds = classId ? phanCongLop(classId) : [];
  return Object.fromEntries(topics.map((k) => {
    const r = chonChuCase(ds, categoryOf(k));
    return [k, r ? { id: r.user_id, ten: r.ten } : null];
  })) as Record<string, { id: number; ten: string | null } | null>;
}

/**
 * CV-LOI (02 mục 4.7 A13, X-63): Case còn mở mà CHƯA có người phụ trách → gán theo đúng luật lúc tạo Case (`suggestCaseOwner`: GV môn → GVCN).
 * Gọi trong giao dịch ghi phân công (`ghiPhanCong`) và ở migrate ghi bù dữ liệu cũ. Mỗi lần gán một dòng `sos_case_history` (null → người;
 * `actorId` null = hệ thống). Lớp vẫn chưa có ai (không GV môn, không GVCN) thì Case để trống — Công việc của QL hiện "Phân công GV {môn}".
 * Trả số Case đã gán.
 */
export function ganChuCaseThieu(o: {
  classId?: number; studentIds?: readonly number[]; actorId: number | null; luc: string;
  /** SUA-NO-RA (CV-LOI-b): người gán không phải một tài khoản (migrate) → nhật ký mỗi Case một dòng ghi nguồn này. */
  nguon?: string;
}): number {
  const conn = db();
  /* Em đang học (không Tạm dừng / Lưu trữ), Case không tạm (Case tạm chưa là việc — OV-13a). `studentIds`: chỉ các em vừa xếp / chuyển lớp.
     DON-LUONG K8: với `studentIds` cùng câu đọc thêm Case CÓ chủ (đổi chủ theo lớp mới — `doiChuTheoLopMoi`), không thêm lượt. */
  const theoEm = o.studentIds?.length ? `AND s.id IN (${o.studentIds.map(() => '?').join(',')})` : '';
  const tatCa = conn.prepare(
    `SELECT sc.id, sc.category, sc.topic, sc.goc_programme_code, sc.owner_user_id, COALESCE(a.class_id, cur.class_id) AS class_id, cur.class_id AS lop_hien_tai, s.full_name
            ${theoEm ? `, ${CHU_THEO_LOP_SQL}` : ''}
       FROM sos_cases sc
       LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id) AND ${HV_DANG_HOC_SQL('s')}
       LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
      WHERE sc.status != 'done' AND ${theoEm ? '1 = 1' : 'sc.owner_user_id IS NULL'} AND sc.tam = 0 AND (? IS NULL OR COALESCE(a.class_id, cur.class_id) = ?) ${theoEm}`,
  ).all(o.classId ?? null, o.classId ?? null, ...(o.studentIds ?? [])) as any[];
  if (theoEm) doiChuTheoLopMoi(tatCa.filter((r) => r.owner_user_id !== null && r.lop_hien_tai !== null), o);
  const rows = tatCa.filter((r) => r.owner_user_id === null);
  let n = 0;
  for (const r of rows) {
    const chu = suggestCaseOwner({ classId: r.class_id ?? null, category: r.category ?? null });
    if (chu === null) continue;
    /* Chỉ ghi lịch sử khi thật sự gán (người khác vừa gán cùng lúc → 0 dòng đổi, không lịch sử giả). */
    if (conn.prepare('UPDATE sos_cases SET owner_user_id = ?, updated_at = ? WHERE id = ? AND owner_user_id IS NULL').run(chu, o.luc, r.id).changes !== 1) continue;
    conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'owner_user_id', NULL, ?, ?, ?)`)
      .run(r.id, String(chu), o.actorId, o.luc);
    if (o.nguon) writeAudit({ actorUserId: o.actorId, action: 'case.owner_assign', entityType: 'case', entityId: r.id, after: { ownerUserId: chu, _nguon: o.nguon } });
    n += 1;
  }
  return n;
}

/**
 * DON-LUONG K8 (ra-luong L50, Rulebook P03): em chuyển / xếp lớp → Case đang mở (không tạm) có chủ mà chủ KHÔNG dạy kỹ năng của Case ở lớp
 * đang học (Case không kỹ năng: không là GVCN lớp đó) → chủ mới theo luật tạo Case (`chonChuCase`: GV môn → GVCN lớp mới); lớp mới không ai →
 * giữ chủ cũ. Lịch sử + báo người nhận như "Đổi người…". PA Bổ trợ Giữa khoá không tự khép (giữ). Case đọc chung câu của `ganChuCaseThieu`;
 * một câu phân công mỗi lớp đích chỉ khi có Case có chủ (thường một). Trả số Case đổi chủ.
 */
function doiChuTheoLopMoi(rows: { id: number; topic: string | null; goc_programme_code: string | null; owner_user_id: number; full_name: string | null;
  con_day: number; moi_mon: number | null; moi_cn: number | null }[], o: { actorId: number | null; luc: string }): number {
  const conn = db();
  let n = 0;
  for (const r of rows) {
    const moi = r.con_day ? null : r.moi_mon ?? r.moi_cn;
    if (moi === null || moi === r.owner_user_id) continue;
    if (conn.prepare('UPDATE sos_cases SET owner_user_id = ?, updated_at = ? WHERE id = ? AND owner_user_id = ?').run(moi, o.luc, r.id, r.owner_user_id).changes !== 1) continue;
    /* Cùng quy ước lịch sử của bàn giao chủ Case khi chuyển lớp (`luatLoTrinh` / `cuoiKhoa`): field 'owner', "bàn giao khi chuyển lớp". */
    conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'owner', ?, 'bàn giao khi chuyển lớp', ?, ?)`)
      .run(r.id, r.owner_user_id, o.actorId, o.luc);
    if (moi !== o.actorId) {
      notify({ userId: moi, kind: 'case_giao', title: `Phụ trách Case ${r.topic ? caseTopicLabel(r.topic, r.goc_programme_code) : ''} · ${r.full_name ?? ''}`,
        entityType: 'sos_case', entityId: r.id, dedupKey: `case_giao:${r.id}` });
    }
    n += 1;
  }
  return n;
}

/**
 * K8 trong cùng câu đọc Case (không thêm lượt — thi hành lệnh chuyển lớp gọi theo từng em): chủ còn dạy kỹ năng Case ở lớp đang học (`con_day`;
 * Case không kỹ năng → chủ là GVCN), GV môn đầu tiên (`moi_mon`), GVCN (`moi_cn`) — cùng luật `chonChuCase` (theo thứ tự id phân công).
 */
const CHU_THEO_LOP_SQL = `EXISTS (SELECT 1 FROM teacher_assignments t WHERE t.class_id = cur.class_id AND t.status = 'active' AND t.user_id = sc.owner_user_id
      AND (CASE WHEN sc.category IN (${Object.keys(CASE_CATEGORY_SKILL).map((k) => `'${k}'`).join(', ')}) THEN t.skill = sc.category ELSE t.is_core = 1 END)) AS con_day,
    (SELECT t.user_id FROM teacher_assignments t WHERE t.class_id = cur.class_id AND t.status = 'active' AND t.skill = sc.category ORDER BY t.id LIMIT 1) AS moi_mon,
    (SELECT t.user_id FROM teacher_assignments t WHERE t.class_id = cur.class_id AND t.status = 'active' AND t.is_core = 1 ORDER BY t.id LIMIT 1) AS moi_cn`;

/**
 * CV-LOI: CASE CHƯA CÓ NGƯỜI PHỤ TRÁCH mà người xem phải xử lý — MỘT nguồn cho dòng việc Công việc (`no_owner`) và số Tổng quan
 * (`case-chua-co-nguoi-phu-trach`): cùng tập, cùng quyền (lớp: `class.assign`; em không có lớp: `case.approve`), cùng lọc (em đang học, Case không tạm).
 * `thieu`: `gv-mon` (lớp có môn mà chưa ai dạy — panel Phân công môn đó) · `gvcn` (lớp chưa có GVCN) · `chon` (dự phòng: lớp đủ người mà Case vẫn
 * trống — dữ liệu cũ, hoặc em không có lớp — mở hồ sơ em).
 */
export function caseChuaCoNguoi(p: Principal, branchId?: number | null) {
  const rows = db().prepare(
    `SELECT sc.id, sc.summary, sc.origin_kind, sc.sos_level, sc.urgency, sc.topic, sc.category,
            sc.detected_at, sc.created_at, sc.attempt_id,
            COALESCE(sc.student_id, a.student_id) AS eff_student_id,
            COALESCE(a.class_id, cur.class_id) AS eff_class_id,
            COALESCE(ac.branch_id, cc.branch_id, s.branch_id) AS eff_branch_id,
            COALESCE(ac.code, cc.code) AS class_code,
            s.full_name, a.attempt_no, a.kind AS attempt_kind,
            /* K1-05: lớp có môn của Case mà chưa ai dạy môn đó → gốc là phân công. */
            EXISTS (SELECT 1 FROM class_skills cs WHERE cs.class_id = COALESCE(a.class_id, cur.class_id) AND cs.skill = sc.category)
              AND NOT EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = COALESCE(a.class_id, cur.class_id)
                                AND ta.status = 'active' AND ta.skill = sc.category) AS thieu_gv_mon,
            NOT EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = COALESCE(a.class_id, cur.class_id) AND ta.status = 'active' AND ta.is_core = 1) AS thieu_gvcn
       FROM sos_cases sc
       LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id) AND ${HV_DANG_HOC_SQL('s')}
       LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
       LEFT JOIN classes ac ON ac.id = a.class_id
       LEFT JOIN classes cc ON cc.id = cur.class_id
      WHERE sc.status != 'done' AND sc.owner_user_id IS NULL AND sc.tam = 0`,
  ).all() as any[];
  napTruocPhamVi(rows.map((r) => r.eff_student_id));
  return rows.filter((c) => (!branchId || c.eff_branch_id === branchId) && (c.eff_class_id
    ? can(p, PERMISSIONS.CLASS_ASSIGN, { classId: c.eff_class_id })
    : can(p, PERMISSIONS.CASE_APPROVE, { studentId: c.eff_student_id })))
    .map((c) => ({
      ...c,
      thieu: (c.eff_class_id && c.thieu_gv_mon ? 'gv-mon' : c.eff_class_id && c.thieu_gvcn ? 'gvcn' : 'chon') as 'gv-mon' | 'gvcn' | 'chon',
      mon: c.eff_class_id && c.thieu_gv_mon ? (CASE_CATEGORY_SKILL[c.category as keyof typeof CASE_CATEGORY_SKILL] ?? null) : null,
    }));
}

/* ================= R1-NO-CU (đặc tả 27/10 mục 4.5, D17) — ĐỔI NGƯỜI PHỤ TRÁCH CASE ================= */

type CaseDoiChu = { id: number; status: string; tam: number; owner_user_id: number | null; category: string | null; topic: string | null;
  goc_programme_code: string | null; student_id: number; full_name: string | null; class_id: number | null };
/** Case + lớp HIỆN TẠI của em (`activeClassOf`: ghi danh đang học mới nhất — em chuyển lớp thì quyền theo lớp mới). */
function caseDoiChu(caseId: number): CaseDoiChu | undefined {
  const c = db().prepare(
    `SELECT sc.id, sc.status, sc.tam, sc.owner_user_id, sc.category, sc.topic, sc.goc_programme_code, s.id AS student_id, s.full_name
       FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
      WHERE sc.id = ?`,
  ).get(caseId) as Omit<CaseDoiChu, 'class_id'> | undefined;
  return c && { ...c, class_id: activeClassOf(c.student_id) };
}

/**
 * Ứng viên (D17): GV đang dạy đúng kỹ năng của Case ở lớp em + GVCN lớp đó; mỗi người một lần. Môn gộp hai chiều: Case L+S / R+W ← GV môn tách;
 * Case môn tách ← GV môn gộp chứa nó (W1 / W2 → cả GV "W" và "R+W").
 */
function ungVienCua(c: CaseDoiChu) {
  if (!c.class_id) return [];
  const skill = CASE_CATEGORY_SKILL[(c.category ?? categoryOf(c.topic)) as string] ?? null;
  const tach = skill === 'writing1' || skill === 'writing2' ? [skill, 'writing'] : skill ? [skill] : [];
  const gopChua = Object.keys(MON_GOP).filter((g) => MON_GOP[g].some((k) => tach.includes(k)));
  const kyNang = new Set([...tach, ...(skill ? MON_GOP[skill] ?? [] : []), ...gopChua]);
  const ds = new Map<number, { id: number; ten: string | null }>();
  for (const r of phanCongLop(c.class_id)) if (r.is_core === 1 || kyNang.has(r.skill ?? '')) ds.set(r.user_id, { id: r.user_id, ten: r.ten });
  return [...ds.values()];
}

/** Quyền (D17): QL / Quản trị của lớp (`class.assign` | `class.edit`) hoặc GVCN lớp hiện tại của em; em không có lớp → `case.approve`. */
function duocDoi(p: Principal, c: CaseDoiChu) {
  return c.class_id
    ? can(p, PERMISSIONS.CLASS_ASSIGN, { classId: c.class_id }) || can(p, PERMISSIONS.CLASS_EDIT, { classId: c.class_id }) || isCoreTeacherOf(p, c.class_id)
    : can(p, PERMISSIONS.CASE_APPROVE, { studentId: c.student_id });
}

export function ungVienChuCase(caseId: number) {
  const c = caseDoiChu(caseId);
  return c ? ungVienCua(c) : [];
}
export function duocDoiChuCase(p: Principal, caseId: number): boolean {
  const c = caseDoiChu(caseId);
  return !!c && duocDoi(p, c);
}
/**
 * Chi tiết Case (`doiChu`): nút "Đổi người…" hiện khi có quyền, Case còn mở (không tạm) và có người KHÁC người đang phụ trách để chọn.
 * Danh sách GV chỉ trả cho người đổi được.
 */
export function doiChuCua(p: Principal, caseId: number) {
  const c = caseDoiChu(caseId);
  const ungVien = c ? ungVienCua(c) : [];
  const duoc = !!c && c.status !== 'done' && !c.tam && ungVien.some((u) => u.id !== c.owner_user_id) && duocDoi(p, c);
  return { duoc, ungVien: duoc ? ungVien : [] };
}

/**
 * Đổi người phụ trách (cả khi Case đã có người). `ownerCu` = người phụ trách lúc mở hộp — người khác vừa đổi thì 409, không ghi đè.
 * Một dòng `sos_case_history` (người đổi) + nhật ký `case.owner_change` + thông báo giao Case cho người mới; người thực hiện PA giữ nguyên.
 */
export function doiChuCase(p: Principal, caseId: number, body: { ownerId?: unknown; ownerCu?: unknown }) {
  const ownerId = Number(body?.ownerId);
  if (!Number.isInteger(ownerId) || ownerId <= 0) throw loi(400, 'Chọn người phụ trách.');
  if (body.ownerCu === undefined || (body.ownerCu !== null && !Number.isInteger(body.ownerCu))) throw loi(400, 'Thiếu người phụ trách hiện tại — tải lại.');
  const ownerCu = body.ownerCu as number | null;
  return tx(() => {
    /* D7: đổi người cũng phải xem được Case (cùng cổng `GET /cases/:id`). D11: dùng lại dòng Case `kiemXemCase` đã đọc (lớp hiện tại của em trước). */
    const { c: lc } = kiemXemCase(p, caseId);
    const c: CaseDoiChu = { ...lc, student_id: lc.eff_student_id, class_id: lc.current_class_id ?? null,
      full_name: (db().prepare('SELECT full_name FROM students WHERE id = ?').get(lc.eff_student_id) as any)?.full_name ?? null };
    if (!duocDoi(p, c)) throw loi(403, 'Chỉ Quản lý hoặc GVCN của lớp em đổi được người phụ trách Case.');
    if (c.status === 'done') throw loi(400, 'Case đã đóng.');
    if (c.tam) throw loi(400, 'Case tạm chưa là việc — chưa đổi người được.');
    if (c.owner_user_id !== ownerCu) throw loi(409, 'Người phụ trách vừa đổi — tải lại.');
    if (ownerId === ownerCu) throw loi(400, 'Người này đang phụ trách Case.');
    const moi = ungVienCua(c).find((u) => u.id === ownerId);
    if (!moi) throw loi(400, 'Chỉ chọn GV dạy kỹ năng của Case ở lớp em hoặc GVCN.');
    const conn = db();
    if (conn.prepare('UPDATE sos_cases SET owner_user_id = ?, updated_at = ? WHERE id = ? AND owner_user_id IS ?').run(ownerId, nowIso(), caseId, ownerCu).changes !== 1) {
      throw loi(409, 'Người phụ trách vừa đổi — tải lại.');
    }
    conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'owner_user_id', ?, ?, ?, ?)`)
      .run(caseId, ownerCu === null ? null : String(ownerCu), String(ownerId), p.userId, nowIso());
    writeAudit({ actorUserId: p.userId, action: 'case.owner_change', entityType: 'sos_case', entityId: caseId,
      entityLabel: `${c.full_name ?? ''} · ${moi.ten ?? ''}`, before: { ownerUserId: ownerCu }, after: { ownerUserId: ownerId } });
    if (ownerId !== p.userId) {
      notify({ userId: ownerId, kind: 'case_giao', title: `Phụ trách Case ${c.topic ? caseTopicLabel(c.topic, c.goc_programme_code) : ''} · ${c.full_name ?? ''}`,
        entityType: 'sos_case', entityId: caseId, dedupKey: `case_giao:${caseId}` });
    }
    return { ownerUserId: ownerId };
  });
}

/* ================= PC-GV-A (đặc tả 30/10 mục 2b) — ĐỔI GV: VIỆC ĐANG MỞ CỦA GV CŨ CHUYỂN SANG GV MỚI ================= */

/** Case mở (không tạm) của em đang học lớp — cùng điều kiện `ganChuCaseThieu` (lớp của lượt, không có thì lớp đang học). */
const NOI_CASE_LOP = `LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
  JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id) AND ${HV_DANG_HOC_SQL('s')}
  LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
  WHERE sc.status != 'done' AND sc.tam = 0 AND COALESCE(a.class_id, cur.class_id) = ?`;
const CASE_MO_CUA_LOP = `FROM sos_cases sc ${NOI_CASE_LOP}`;

/** Id Case mở CHƯA có người phụ trách của lớp — tập `ganChuCaseThieu` có thể gán (chụp trước để Hoàn tác). */
export function caseThieuChuLop(classId: number): number[] {
  return [...new Set((db().prepare(`SELECT sc.id ${CASE_MO_CUA_LOP} AND sc.owner_user_id IS NULL`).all(classId) as any[]).map((r) => r.id as number))];
}

/**
 * Case / PA SẼ chuyển khi đổi người (KHÔNG ghi) — dùng chung cho xem trước hộp Lưu và lúc áp. Chỉ cặp có người giao + người nhận khác nhau.
 * Case mở `owner = GV cũ` thuộc ô (`caseThuocO`; ô môn ưu tiên trước ô GVCN); PA `planned | started` GV cũ thực hiện, Case thuộc lớp + ô.
 * PTA 30/10: PA của GV cũ trên Case KHÔNG kỹ năng mà GV cũ không còn dạy lớp (không môn, không GVCN) → GVCN sau đổi (khoá `GVCN_LOP`).
 * `conDay(u)` = kỹ năng u CÒN dạy ở lớp sau đổi. Hai câu đọc cho cả lớp.
 */
export const GVCN_LOP = '_gvcn';
/** Id Case / PA sẽ chuyển + người cũ đã đọc (`c{id}` / `p{id}`) — lúc áp dùng lại, không đọc lại từng dòng. */
export type ViecChuyen = { caseIds: number[]; paIds: number[]; cu: Map<string, { u: number; caseId?: number }> };
export function chonViecChuyen(classId: number, ct: string | null, doi: readonly DoiO[], conDay: (userId: number) => ReadonlySet<string>,
  gvcnSau: number | null = null): Map<string, ViecChuyen> {
  const cap = doi.filter(laCapBanGiao);
  const m = new Map<string, ViecChuyen>(cap.map((d) => [d.khoa, { caseIds: [], paIds: [], cu: new Map() }]));
  if (!cap.length) return m;
  const cu = [...new Set(cap.map((d) => d.nguoiCu!))];
  const ph = cu.map(() => '?').join(',');
  const theoO = (u: number, category: string | null) => {
    const skill = CASE_CATEGORY_SKILL[category as string] ?? null;
    const hop = (d: DoiO) => d.nguoiCu === u && caseThuocO(ct, d.khoa, conDay(u), skill);
    return cap.find((d) => d.khoa !== 'gvcn' && hop(d)) ?? cap.find((d) => d.khoa === 'gvcn' && hop(d));
  };
  const conn = db();
  const da = new Set<number>();
  for (const r of conn.prepare(`SELECT sc.id, sc.owner_user_id AS u, sc.category ${CASE_MO_CUA_LOP} AND sc.owner_user_id IN (${ph}) ORDER BY sc.id`).all(classId, ...cu) as any[]) {
    const d = !da.has(r.id) && theoO(r.u, r.category);
    if (d) { da.add(r.id); m.get(d.khoa)!.caseIds.push(r.id); m.get(d.khoa)!.cu.set(`c${r.id}`, { u: r.u }); }
  }
  da.clear();
  const roiLop = (u: number) => gvcnSau !== null && gvcnSau !== u && conDay(u).size === 0;
  for (const r of conn.prepare(
    `SELECT iv.id, iv.case_id, iv.performer_user_id AS u, sc.category FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
       ${NOI_CASE_LOP} AND iv.status IN ('planned', 'started') AND iv.performer_user_id IN (${ph}) ORDER BY iv.id`,
  ).all(classId, ...cu) as any[]) {
    if (da.has(r.id)) continue;
    da.add(r.id);
    const d = theoO(r.u, r.category);
    const khoa = d ? d.khoa : !(CASE_CATEGORY_SKILL[r.category as string] ?? null) && roiLop(r.u) ? GVCN_LOP : null;
    if (!khoa) continue;
    if (!m.has(khoa)) m.set(khoa, { caseIds: [], paIds: [], cu: new Map() });
    m.get(khoa)!.paIds.push(r.id);
    m.get(khoa)!.cu.set(`p${r.id}`, { u: r.u, caseId: r.case_id });
  }
  return m;
}

/**
 * ÁP chuyển việc (TRONG tx của lần đổi): Case → người phụ trách mới + `sos_case_history` (owner_user_id); PA → người thực hiện mới
 * (`performer_name` xoá) + lịch sử `pa_performer` (mẫu `banGiaoPaQuyChe`). Điểm / bài GV cũ đã chấm không đụng. Mỗi GV mới MỘT thông báo
 * cho lớp (`phan_cong_moi`, cả ô trước trống — PTA 30/10). Đọc / ghi theo lô (một câu mỗi loại, không mỗi Case). Trả số đã chuyển theo ô.
 */
export function chuyenViecKhiDoi(o: {
  classId: number; ct: string | null; doi: readonly (DoiO & { id?: number })[]; conDay: (userId: number) => ReadonlySet<string>;
  actorId: number | null; luc: string; code: string; gvcnSau?: number | null;
  /** Đã chọn sẵn (để chụp `ghi_dao` trước khi ghi) — không truyền thì tự chọn. */
  chon?: Map<string, ViecChuyen>;
}): Map<string, { soCase: number; soPa: number }> {
  const conn = db();
  const chon = o.chon ?? chonViecChuyen(o.classId, o.ct, o.doi, o.conDay, o.gvcnSau ?? null);
  const kq = new Map<string, { soCase: number; soPa: number }>();
  const nhan = (khoa: string) => (khoa === 'gvcn' || khoa === GVCN_LOP ? 'GVCN' : tenMonNgan(o.ct, khoa));
  const cap = o.doi.filter(laCapBanGiao);
  const nhanMoi = o.doi.filter((d) => d.nguoiMoi !== null && d.nguoiMoi !== d.nguoiCu);
  if (!nhanMoi.length) return kq;
  const coPa = [...chon.values()].some((v) => v.paIds.length);
  const nguoi = coPa ? [...new Set([...cap.flatMap((d) => [d.nguoiCu!, d.nguoiMoi!]), ...(o.gvcnSau ? [o.gvcnSau] : [])])] : [];
  const ten = new Map(nguoi.length ? (conn.prepare(`SELECT id, full_name FROM users WHERE id IN (${inHang(nguoi)})`).all(...nguoi) as any[])
    .map((u) => [u.id as number, u.full_name as string]) : []);
  /* Lịch sử Case + PA của cả lớp: MỘT câu chèn (cuối hàm). */
  const ls: unknown[][] = [];
  const ghiLs = (rows: unknown[][]) => { ls.push(...rows); };
  for (const [khoa, v] of chon) {
    const ds = cap.filter((d) => d.khoa === khoa);
    const moi = khoa === GVCN_LOP ? o.gvcnSau! : ds[0].nguoiMoi!;
    const cu = khoa === GVCN_LOP ? [...new Set(cap.map((d) => d.nguoiCu!))] : ds.map((d) => d.nguoiCu!);
    /* Người cũ đọc ở `chonViecChuyen` cùng tx (không ai ghi chen) → một UPDATE mỗi loại; số dòng đổi phải khớp, không thì 409 (cuộn cả lần lưu). */
    const caseCu = v.caseIds.filter((id) => cu.includes(v.cu.get(`c${id}`)?.u ?? -1));
    if (caseCu.length) {
      if (conn.prepare(`UPDATE sos_cases SET owner_user_id = ?, updated_at = ? WHERE id IN (${inHang(caseCu)}) AND owner_user_id IN (${inHang(cu)})`)
        .run(moi, o.luc, ...caseCu, ...cu).changes !== caseCu.length) throw conflict('Case vừa đổi người phụ trách — tải lại rồi lưu.');
      ghiLs(caseCu.map((id) => [id, 'owner_user_id', String(v.cu.get(`c${id}`)!.u), String(moi), o.actorId, o.luc]));
    }
    const paCu = v.paIds.filter((id) => cu.includes(v.cu.get(`p${id}`)?.u ?? -1));
    if (paCu.length) {
      if (conn.prepare(`UPDATE case_interventions SET performer_user_id = ?, performer_name = NULL, updated_at = ? WHERE id IN (${inHang(paCu)}) AND performer_user_id IN (${inHang(cu)})`)
        .run(moi, o.luc, ...paCu, ...cu).changes !== paCu.length) throw conflict('PA vừa đổi người thực hiện — tải lại rồi lưu.');
      ghiLs(paCu.map((id) => {
        const x = v.cu.get(`p${id}`)!;
        const tenCu = ten.get(x.u) ?? '—';
        return [x.caseId, 'pa_performer', tenCu, `${tenCu} → ${ten.get(moi) ?? ''} (phân công ${o.code} · ${nhan(khoa)})`, o.actorId, o.luc];
      }));
    }
    kq.set(khoa, { soCase: caseCu.length, soPa: paCu.length });
  }
  for (let i = 0; i < ls.length; i += 100) {   // ≤ 600 tham số một câu
    const lo = ls.slice(i, i + 100);
    conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES ${lo.map(() => '(?,?,?,?,?,?)').join(',')}`).run(...lo.flat());
  }
  /* Một thông báo mỗi GV mới của lớp: các ô nhận + số Case / PA chuyển. */
  for (const moi of new Set(nhanMoi.map((d) => d.nguoiMoi!))) {
    if (moi === o.actorId) continue;
    const ds = nhanMoi.filter((d) => d.nguoiMoi === moi);
    const khoa = [...new Set(ds.map((d) => d.khoa))];
    const soCase = khoa.reduce((n, k) => n + (kq.get(k)?.soCase ?? 0), 0);
    const soPa = khoa.reduce((n, k) => n + (kq.get(k)?.soPa ?? 0), 0);
    notify({ userId: moi, kind: 'phan_cong_moi', title: `Bạn nhận ${o.code} · ${khoa.map(nhan).join(', ')}${soCase || soPa ? ` · ${soCase} Case · ${soPa} PA` : ''}`,
      entityType: 'class', entityId: o.classId, dedupKey: `phan_cong_moi:${ds[0].id ?? `${o.classId}:${o.luc}`}`, duong: `/hoc-vien/lop/${o.classId}` });
  }
  return kq;
}
const inHang = (ds: readonly unknown[]) => ds.map(() => '?').join(',');
