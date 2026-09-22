/**
 * DỮ LIỆU NỀN DÙNG CHUNG — quyền, vai trò (kể cả vai `retired`), lộ trình, chương trình học + kỹ năng + mốc.
 * Bộ demo (`seed.ts`) và bản chính (`ops/initBanChinh.ts`, PR-Z2) cùng gọi hàm này, nên hai bên không bao giờ lệch nhau.
 * KHÔNG tạo chi nhánh, người dùng, lớp, học viên hay cấu hình demo nào. Mã bên dưới chuyển NGUYÊN VĂN từ `runSeed()`.
 */
import { PERMISSION_LABEL, PROGRAMME_TEMPLATES } from '../../../shared/domain/index.ts';
import { seedRoutes } from '../platform/sysconfig.ts';
import { RETIRED_ROLES, ROLES, ROLE_PERMISSIONS } from './data.ts';

export function napDuLieuNen(conn: any, now: string): { roleId: Map<string, number>; permId: Map<string, number> } {
  // ---------------------------------------------------------------- vai trò & quyền
  const permId = new Map<string, number>();
  for (const [key, label] of Object.entries(PERMISSION_LABEL)) {
    const info = conn.prepare('INSERT INTO permissions (key, name_vi) VALUES (?,?)').run(key, label);
    permId.set(key, Number(info.lastInsertRowid));
  }
  const roleId = new Map<string, number>();
  for (const r of ROLES) {
    const info = conn.prepare("INSERT INTO roles (key, name_vi, status) VALUES (?,?,'active')")
      .run(r.key, r.name);
    roleId.set(r.key, Number(info.lastInsertRowid));
    for (const p of ROLE_PERMISSIONS[r.key]) {
      conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)')
        .run(Number(info.lastInsertRowid), permId.get(p)!);
    }
  }
  /*
   * VAI TRÒ ĐÃ BỎ vẫn có dòng trong bảng, ở trạng thái `retired` và KHÔNG kèm quyền nào.
   *
   * Bộ demo cần nó để chứng minh đúng một điều: một database đã chạy thật, có người từng
   * mang vai đó, thì sau khi bỏ vai vẫn đọc được lịch sử. Không tài khoản demo nào được
   * giao vai này.
   */
  for (const r of RETIRED_ROLES) {
    const info = conn.prepare("INSERT INTO roles (key, name_vi, status) VALUES (?,?,'retired')")
      .run(r.key, r.name);
    roleId.set(r.key, Number(info.lastInsertRowid));
  }

  /*
   * LỘ TRÌNH nay là DỮ LIỆU (mục 7.3) — nạp lần đầu từ danh sách viết cứng, sau đó Quản trị
   * hệ thống thêm sửa trong màn quản trị mà không phải đụng vào mã nguồn.
   */
  seedRoutes(conn);

  // ---------------------------------------------------------------- chương trình học
  for (const t of Object.values(PROGRAMME_TEMPLATES)) {
    conn.prepare('INSERT INTO programmes (code, name, weeks, scoring_mode, status, created_at) VALUES (?,?,?,?,?,?)')
      .run(t.code, t.name, t.weeks, t.scoringMode, 'active', now);
    t.skills.forEach((skill, i) => {
      conn.prepare('INSERT INTO programme_skills (programme_code, skill, seq) VALUES (?,?,?)').run(t.code, skill, i);
    });
    for (const cp of t.checkpoints) {
      conn.prepare('INSERT INTO programme_checkpoints (programme_code, kind, study_week) VALUES (?,?,?)')
        .run(t.code, cp.kind, cp.studyWeek);
    }
  }
  return { roleId, permId };
}
