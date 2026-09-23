import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { normalizeName } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { activeClassOf } from '../yThuc/access.ts';
import type { NhomNguoi } from '../../../shared/domain/index.ts';

/**
 * TÌM NGƯỜI CHO Ô CHỌN `ChonNguoi` — `GET /ref/nguoi` (PR-Form F-2, Q2).
 *
 * Khác `searchPeople` (`worklist/meeting.ts`, đòi `MEETING_VIEW`): route này chỉ cần đăng nhập — mọi giáo viên phải tự chọn
 * được người thực hiện cho case của mình. Có ngưỡng gõ ≥ 3 ký tự, tìm không phân biệt hoa thường / dấu, và trước khi gõ gì
 * gợi ý sẵn giáo viên đang dạy lớp của học viên (Q6) — trường hợp thường gặp nhất.
 */

const ROLE_KEYS_OF: Record<NhomNguoi, readonly string[]> = {
  giao_vien: ['teacher'],
  nhan_vien: ['teacher', 'manager'],
};

/**
 * Người này có thuộc nhóm `nhom` không: tài khoản đang hoạt động, có vai đúng nhóm đang hoạt động.
 * Không trả `true` cho tài khoản chỉ có vai `system_admin` — nhóm đó không nằm trong `ROLE_KEYS_OF`.
 * Dùng lại ở Task 3 (`server/src/cases/nguoiThucHien.ts`) để kiểm `performerUserId` gửi lên.
 */
export function laNguoiHopLe(userId: number, nhom: NhomNguoi): boolean {
  const keys = ROLE_KEYS_OF[nhom];
  const placeholders = keys.map(() => '?').join(',');
  const row = db()
    .prepare(
      `SELECT 1 FROM users u
        JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
        JOIN roles r ON r.id = ur.role_id
       WHERE u.id = ? AND u.status = 'active' AND r.key IN (${placeholders}) LIMIT 1`,
    )
    .get(userId, ...keys);
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
function nguoiHopLe(nhom: NhomNguoi, ids: readonly number[] | null): HangNguoiTho[] {
  const keys = ROLE_KEYS_OF[nhom];
  const keyPlaceholders = keys.map(() => '?').join(',');
  const idClause = ids ? ` AND u.id IN (${ids.map(() => '?').join(',')})` : '';
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
        WHERE u.status = 'active' AND r.key IN (${keyPlaceholders})${idClause}`,
    )
    .all(...keys, ...keys, ...(ids ?? [])) as HangNguoiTho[];
}

export function timNguoi(
  _p: Principal,
  opts: { q?: string; nhom?: NhomNguoi; studentId?: number | null },
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

  const build = (row: HangNguoiTho): HangNguoi => ({
    id: row.id, name: row.full_name, role: row.role,
    branches: row.branches ? row.branches.split(',') : [],
    cungLop: cungLopIds.has(row.id), monDay: monDayOf.get(row.id) ?? [],
  });

  if (term.length < 3) {
    if (!cungLopIds.size) return [];
    return nguoiHopLe(nhom, [...cungLopIds])
      .map(build)
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .slice(0, 6);
  }

  const needle = normalizeName(term);
  const matched = nguoiHopLe(nhom, null)
    .filter((r) => normalizeName(r.full_name).includes(needle) || normalizeName(r.code).includes(needle));
  return matched
    .map(build)
    .sort((a, b) => {
      if (a.cungLop !== b.cungLop) return a.cungLop ? -1 : 1;
      return a.name.localeCompare(b.name, 'vi');
    })
    .slice(0, 12);
}
