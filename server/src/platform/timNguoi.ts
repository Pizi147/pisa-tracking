import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { normalizeName } from '../util.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { activeClassOf } from '../yThuc/access.ts';
import { PERMISSIONS, type NhomNguoi } from '../../../shared/domain/index.ts';

/**
 * TÌM NGƯỜI CHO Ô CHỌN `ChonNguoi` — `GET /ref/nguoi` (PR-Form F-2, Q2).
 *
 * Khác `searchPeople` (`worklist/meeting.ts`, đòi `MEETING_VIEW`): route này chỉ cần đăng nhập — mọi giáo viên phải tự chọn
 * được người thực hiện cho case của mình. Bấm là có danh sách (T14): chưa gõ → 20 người, GV cùng lớp đứng đầu; tìm không phân
 * biệt hoa thường / dấu. GV đang dạy lớp của học viên (Q6) — trường hợp thường gặp nhất — luôn đứng đầu.
 */

const ROLE_KEYS_OF: Record<NhomNguoi, readonly string[]> = {
  giao_vien: ['teacher'],
  nhan_vien: ['teacher', 'manager'],
};

/**
 * Người này có thuộc nhóm `nhom` không: tài khoản đang hoạt động, có vai đúng nhóm đang hoạt động.
 * Không trả `true` cho tài khoản chỉ có vai `system_admin` — nhóm đó không nằm trong `ROLE_KEYS_OF`.
 * Dùng lại ở Task 3 (`server/src/cases/nguoiThucHien.ts`) để kiểm `performerUserId` gửi lên.
 * `branchId` (PR-S5F-b): vai đó phải ở ĐÚNG chi nhánh này — người dạy bổ trợ là GV cùng chi nhánh của lớp.
 */
export function laNguoiHopLe(userId: number, nhom: NhomNguoi, branchId?: number | null): boolean {
  const keys = ROLE_KEYS_OF[nhom];
  const placeholders = keys.map(() => '?').join(',');
  const row = db()
    .prepare(
      `SELECT 1 FROM users u
        JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
        JOIN roles r ON r.id = ur.role_id
       WHERE u.id = ? AND u.status = 'active' AND r.key IN (${placeholders})${branchId ? ' AND ur.branch_id = ?' : ''} LIMIT 1`,
    )
    .get(userId, ...keys, ...(branchId ? [branchId] : []));
  return !!row;
}

type HangDangDay = { userId: number; skill: string | null };

/** Người đang dạy lớp đó, hiệu lực HÔM NAY (mẫu truy vấn `yThuc/measures.ts` — `defaultOwner`). */
function dangDayLop(classId: number): HangDangDay[] {
  const today = demoToday();
  return db()
    .prepare(
      `SELECT user_id AS userId, skill FROM teacher_assignments
        WHERE class_id = ? AND status = 'active' AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)`,
    )
    .all(classId, today, today) as HangDangDay[];
}

type HangNguoi = { id: number; name: string; role: string | null; branches: string[]; cungLop: boolean; monDay: string[] };

type HangNguoiTho = { id: number; full_name: string; code: string; role: string | null; branches: string | null };

/**
 * Vai + chi nhánh gộp thẳng vào câu truy vấn chính (mẫu `searchPeople`, `worklist/meeting.ts:594-599`) — trước đây gọi
 * riêng `roleAndBranchesOf` cho từng dòng kết quả, tốn một truy vấn mỗi dòng (~15 truy vấn mỗi lần gõ trên Turso).
 */
function nguoiHopLe(nhom: NhomNguoi, ids: readonly number[] | null, branchIds: readonly number[] | null): HangNguoiTho[] {
  const keys = ROLE_KEYS_OF[nhom];
  const keyPlaceholders = keys.map(() => '?').join(',');
  const idClause = ids ? ` AND u.id IN (${ids.map(() => '?').join(',')})` : '';
  /* PR-Ra (`trongPhamVi`, Task 3): chỉ người có vai đang hoạt động ở MỘT chi nhánh thuộc phạm vi người xem. */
  const branchClause = branchIds
    ? ` AND EXISTS (SELECT 1 FROM user_roles ur4 WHERE ur4.user_id = u.id AND ur4.status = 'active'
          AND ur4.branch_id IN (${branchIds.map(() => '?').join(',')}))`
    : '';
  return db()
    .prepare(
      `SELECT DISTINCT u.id, u.full_name, u.code,
              (SELECT r2.name_vi FROM user_roles ur2 JOIN roles r2 ON r2.id = ur2.role_id
                WHERE ur2.user_id = u.id AND ur2.status = 'active' AND r2.key IN (${keyPlaceholders})
                ORDER BY ur2.id LIMIT 1) AS role,
              (SELECT GROUP_CONCAT(DISTINCT b.code) FROM user_roles ur3 JOIN branches b ON b.id = ur3.branch_id
                WHERE ur3.user_id = u.id AND ur3.status = 'active') AS branches
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
         JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 'active' AND r.key IN (${keyPlaceholders})${idClause}${branchClause}`,
    )
    .all(...keys, ...keys, ...(ids ?? []), ...(branchIds ?? [])) as HangNguoiTho[];
}

export function timNguoi(
  p: Principal,
  opts: { q?: string; nhom?: NhomNguoi; studentId?: number | null; trongPhamVi?: boolean; cungChiNhanh?: boolean },
): HangNguoi[] {
  const nhom: NhomNguoi = opts.nhom === 'nhan_vien' ? 'nhan_vien' : 'giao_vien';
  const term = (opts.q ?? '').trim();
  const classId = opts.studentId ? activeClassOf(opts.studentId) : null;
  const gv = classId ? dangDayLop(classId) : [];
  const monDayOf = new Map<number, string[]>();
  for (const g of gv) {
    if (!g.skill) continue;
    monDayOf.set(g.userId, [...(monDayOf.get(g.userId) ?? []), g.skill]);
  }
  const cungLopIds = new Set(gv.map((g) => g.userId));

  /* QT (`scope.all`) không giới hạn; các vai khác chỉ thấy người trong đúng chi nhánh mình quản lý. */
  const scope = opts.trongPhamVi ? scopeFor(p, PERMISSIONS.ATTEMPT_VIEW) : null;
  /* PR-S5F-b: `cungChiNhanh` — chỉ GV ở chi nhánh của lớp em đang học (người dạy bổ trợ; máy chủ kiểm lại ở `nopKeHoachBoTro`). */
  const cnLop = opts.cungChiNhanh && classId
    ? (db().prepare('SELECT branch_id FROM classes WHERE id = ?').get(classId) as any)?.branch_id as number | undefined : undefined;
  const branchIds = cnLop ? [cnLop] : scope && !scope.all ? scope.branchIds : null;

  const build = (row: HangNguoiTho): HangNguoi => ({
    id: row.id, name: row.full_name, role: row.role,
    branches: row.branches ? row.branches.split(',') : [],
    cungLop: cungLopIds.has(row.id), monDay: monDayOf.get(row.id) ?? [],
  });

  /* T14: chưa gõ → 20 người (GV cùng lớp đứng đầu); có gõ (kể cả 1–2 ký tự) → 12 người khớp. */
  const needle = normalizeName(term);
  return nguoiHopLe(nhom, null, branchIds)
    .filter((r) => !needle || normalizeName(r.full_name).includes(needle) || normalizeName(r.code).includes(needle))
    .map(build)
    .sort((a, b) => (a.cungLop !== b.cungLop ? (a.cungLop ? -1 : 1) : a.name.localeCompare(b.name, 'vi')))
    .slice(0, needle ? 12 : 20);
}
