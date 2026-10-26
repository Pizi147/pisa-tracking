import { db, tx } from '../db.ts';
import { CASE_CATEGORY_SKILL, MON_GOP, PERMISSIONS, caseTopicLabel, categoryOf } from '../../../shared/domain/index.ts';
import { can, isCoreTeacherOf, napTruocPhamVi, type Principal } from '../permissions.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { loi, notFound, nowIso } from '../util.ts';

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
  /* Em đang học (không Tạm dừng / Lưu trữ), Case không tạm (Case tạm chưa là việc — OV-13a). `studentIds`: chỉ các em vừa xếp / chuyển lớp. */
  const theoEm = o.studentIds?.length ? `AND s.id IN (${o.studentIds.map(() => '?').join(',')})` : '';
  const rows = conn.prepare(
    `SELECT sc.id, sc.category, COALESCE(a.class_id, cur.class_id) AS class_id
       FROM sos_cases sc
       LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id) AND ${HV_DANG_HOC_SQL('s')}
       LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
      WHERE sc.status != 'done' AND sc.owner_user_id IS NULL AND sc.tam = 0 AND (? IS NULL OR COALESCE(a.class_id, cur.class_id) = ?) ${theoEm}`,
  ).all(o.classId ?? null, o.classId ?? null, ...(o.studentIds ?? [])) as any[];
  let n = 0;
  for (const r of rows) {
    const chu = suggestCaseOwner({ classId: r.class_id ?? null, category: r.category ?? null });
    if (chu === null) continue;
    /* Chỉ ghi lịch sử khi thật sự gán (người khác vừa gán cùng lúc → 0 dòng đổi, không lịch sử giả). */
    if (conn.prepare('UPDATE sos_cases SET owner_user_id = ? WHERE id = ? AND owner_user_id IS NULL').run(chu, r.id).changes !== 1) continue;
    conn.prepare(`INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'owner_user_id', NULL, ?, ?, ?)`)
      .run(r.id, String(chu), o.actorId, o.luc);
    if (o.nguon) writeAudit({ actorUserId: o.actorId, action: 'case.owner_assign', entityType: 'case', entityId: r.id, after: { ownerUserId: chu, _nguon: o.nguon } });
    n += 1;
  }
  return n;
}

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

type CaseDoiChu = { id: number; status: string; owner_user_id: number | null; category: string | null; topic: string | null;
  goc_programme_code: string | null; student_id: number; full_name: string | null; class_id: number | null };
/** Case + lớp HIỆN TẠI của em (`enrollments.status = 'active'` — em chuyển lớp thì quyền theo lớp mới). */
const caseDoiChu = (caseId: number) => db().prepare(
  `SELECT sc.id, sc.status, sc.owner_user_id, sc.category, sc.topic, sc.goc_programme_code, s.id AS student_id, s.full_name, cur.class_id
     FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
     JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
     LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
    WHERE sc.id = ?`,
).get(caseId) as CaseDoiChu | undefined;

/** Ứng viên (D17): GV đang dạy đúng kỹ năng của Case ở lớp em (môn gộp L+S / R+W: cả GV môn tách) + GVCN lớp đó; mỗi người một lần. */
function ungVienCua(c: CaseDoiChu) {
  if (!c.class_id) return [];
  const skill = CASE_CATEGORY_SKILL[(c.category ?? categoryOf(c.topic)) as string] ?? null;
  const kyNang = new Set(skill ? [skill, ...(MON_GOP[skill] ?? [])] : []);
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
/** Chi tiết Case (`doiChu`): nút "Đổi người…" hiện khi có quyền, Case còn mở và có người để chọn. */
export function doiChuCua(p: Principal, caseId: number) {
  const c = caseDoiChu(caseId);
  const ungVien = c ? ungVienCua(c) : [];
  return { duoc: !!c && c.status !== 'done' && ungVien.length > 0 && duocDoi(p, c), ungVien };
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
    const c = caseDoiChu(caseId);
    if (!c) throw notFound();
    if (!duocDoi(p, c)) throw loi(403, 'Chỉ Quản lý hoặc GVCN của lớp em đổi được người phụ trách Case.');
    if (c.status === 'done') throw loi(400, 'Case đã đóng.');
    if (c.owner_user_id !== ownerCu) throw loi(409, 'Người phụ trách vừa đổi — tải lại.');
    if (ownerId === ownerCu) throw loi(400, 'Người này đang phụ trách Case.');
    const moi = ungVienCua(c).find((u) => u.id === ownerId);
    if (!moi) throw loi(400, 'Chỉ chọn GV dạy kỹ năng của Case ở lớp em hoặc GVCN.');
    const conn = db();
    if (conn.prepare('UPDATE sos_cases SET owner_user_id = ? WHERE id = ? AND owner_user_id IS ?').run(ownerId, caseId, ownerCu).changes !== 1) {
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
