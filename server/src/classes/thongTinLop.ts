/**
 * ⋮ SỬA THÔNG TIN LỚP (PR-Qa, đặc tả §3.7; THUAT_NGU g3-120) — mã lớp, LT (chỉ FT), ghi chú; chương trình CHỈ khi lớp chưa có học
 * viên và chưa có bài Test (lớp tạo nhầm). Đổi chương trình của lớp đang học làm sai mọi điểm đã chấm; lớp thường học tiếp khoá
 * sau đã có "Chuyển tiếp lớp". Quyền `class.edit` — cùng quyền với "Lộ trình lớp / Lịch kiểm tra".
 */
import { db, tx } from '../db.ts';
import { PERMISSIONS, PROGRAMME_TEMPLATES, ROUTES, programmeOf } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';

export function capNhatThongTinLop(
  p: Principal, classId: number, input: { code?: unknown; route?: unknown; note?: unknown; programmeCode?: unknown },
) {
  const conn = db();
  const c = conn.prepare(
    `SELECT c.*, b.code AS branch_code FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?`,
  ).get(classId) as any;
  if (!c) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.CLASS_EDIT, { classId }, 'Bạn không có quyền sửa thông tin lớp này.');

  const moi: Record<string, unknown> = {};
  if (input.code !== undefined) {
    const code = String(input.code ?? '').trim();
    if (!code) throw badRequest('Cần mã lớp.');
    const tienTo = String(c.branch_code);
    if (!code.toUpperCase().startsWith(`${tienTo.toUpperCase()}-`)) {
      throw badRequest(`Mã lớp phải bắt đầu bằng "${tienTo}-", ví dụ ${tienTo}-FT 101.`);
    }
    if (conn.prepare('SELECT id FROM classes WHERE code = ? AND id != ?').get(code, classId)) throw badRequest(`Đã có lớp ${code}.`);
    moi.code = code;
  }
  if (input.note !== undefined) moi.note = String(input.note ?? '').trim() || null;

  const cu = (c.programme_code ?? programmeOf(c.kind)) as string | null;
  let chuongTrinh = cu;
  if (input.programmeCode !== undefined) {
    const pc = programmeOf(String(input.programmeCode ?? ''));
    if (!pc) throw badRequest('Chương trình không hợp lệ.');
    if (pc !== cu) {
      const coHocVien = conn.prepare('SELECT 1 FROM enrollments WHERE class_id = ? LIMIT 1').get(classId);
      const coBai = conn.prepare('SELECT 1 FROM assessment_attempts WHERE class_id = ? LIMIT 1').get(classId);
      if (coHocVien || coBai) {
        throw badRequest('Lớp đã có học viên hoặc bài Test nên không đổi được chương trình. Lớp thường học tiếp khoá sau thì dùng "Chuyển tiếp lớp".');
      }
      chuongTrinh = pc;
      moi.kind = pc;
      moi.programme_code = pc;
      moi.is_fast_track = pc === 'FT' ? 1 : 0;
      moi.route = pc === 'FT' ? (c.route ?? 'LT1') : null;
    }
  }
  if (input.route !== undefined) {
    if (chuongTrinh !== 'FT') throw badRequest('Chỉ lớp Fast Track có LT1/LT2.');
    const r = String(input.route ?? '');
    if (!(ROUTES as readonly string[]).includes(r)) throw badRequest('LT phải là LT1 hoặc LT2.');
    moi.route = r;
  }
  if (!Object.keys(moi).length) return conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId);

  const today = demoToday();
  tx(() => {
    const cot = Object.keys(moi);
    conn.prepare(`UPDATE classes SET ${cot.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...cot.map((k) => moi[k]), classId);
    if (chuongTrinh !== cu && chuongTrinh) {
      /* Kỹ năng lớp đi theo CHƯƠNG TRÌNH (như lúc tạo lớp); phân công kỹ năng không còn thì kết thúc, không xoá (giữ lịch sử). */
      const kyNang = [...PROGRAMME_TEMPLATES[chuongTrinh as keyof typeof PROGRAMME_TEMPLATES].skills] as string[];
      conn.prepare('DELETE FROM class_skills WHERE class_id = ?').run(classId);
      for (const k of kyNang) conn.prepare('INSERT INTO class_skills (class_id, skill, sessions_per_week) VALUES (?,?,1)').run(classId, k);
      conn.prepare(
        `UPDATE teacher_assignments SET status = 'ended', effective_to = ?
          WHERE class_id = ? AND status = 'active' AND skill IS NOT NULL AND skill NOT IN (${kyNang.map(() => '?').join(',')})`,
      ).run(today, classId, ...kyNang);
    }
    writeAudit({
      actorUserId: p.userId, action: 'class.info', entityType: 'class', entityId: classId,
      entityLabel: String(moi.code ?? c.code),
      before: { code: c.code, route: c.route, note: c.note, programmeCode: cu }, after: moi,
    });
  });
  return conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
}
