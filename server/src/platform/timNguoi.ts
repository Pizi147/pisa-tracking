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

function nguoiHopLe(nhom: NhomNguoi, ids: readonly number[] | null): { id: number; full_name: string; code: string }[] {
  const keys = ROLE_KEYS_OF[nhom];
  const keyPlaceholders = keys.map(() => '?').join(',');
  const idClause = ids ? ` AND u.id IN (${ids.map(() => '?').join(',')})` : '';
  return db()
    .prepare(
      `SELECT DISTINCT u.id, u.full_name, u.code
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
         JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 'active' AND r.key IN (${keyPlaceholders})${idClause}`,
    )
    .all(...keys, ...(ids ?? [])) as { id: number; full_name: string; code: string }[];
}

function roleAndBranchesOf(userId: number, nhom: NhomNguoi): { role: string | null; branches: string[] } {
  const keys = ROLE_KEYS_OF[nhom];
  const keyPlaceholders = keys.map(() => '?').join(',');
  const row = db()
    .prepare(
      `SELECT r.name_vi AS role,
              (SELECT GROUP_CONCAT(DISTINCT b.code) FROM user_roles ur2 JOIN branches b ON b.id = ur2.branch_id
                WHERE ur2.user_id = ? AND ur2.status = 'active') AS branches
         FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = ? AND ur.status = 'active' AND r.key IN (${keyPlaceholders})
        ORDER BY ur.id LIMIT 1`,
    )
    .get(userId, userId, ...keys) as any;
  return { role: row?.role ?? null, branches: row?.branches ? String(row.branches).split(',') : [] };
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

  const build = (row: { id: number; full_name: string; code: string }): HangNguoi => {
    const { role, branches } = roleAndBranchesOf(row.id, nhom);
    return { id: row.id, name: row.full_name, role, branches, cungLop: cungLopIds.has(row.id), monDay: monDayOf.get(row.id) ?? [] };
  };

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
