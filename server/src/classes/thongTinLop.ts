/**
 * ⋮ SỬA THÔNG TIN LỚP (PR-Qa, đặc tả §3.7; PR-LOP YC-2) — phần SỐ của tên lớp, lộ trình (chỉ FT), ghi chú; chương trình và lộ trình
 * CHỈ khi lớp chưa có học viên và chưa có bài Test (Q6, K2-18 — khoá, không "đổi kèm cảnh báo"). Tên lớp máy ghép lại theo mẫu
 * `{CN} {ký hiệu} {số}` mỗi khi số/chương trình/lộ trình đổi. Quyền `class.edit` — cùng quyền với "Lộ trình lớp / Lịch kiểm tra".
 */
import { db, tx } from '../db.ts';
import {
  CHO_TAO_PRE_FOU, PERMISSIONS, PROGRAMME_TEMPLATES, chuanHoaMaLop, ghepMaLop, khoaMaLopSql, kiemSoLop, kyHieuLop, programmeOf, tachSoLop,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { mocChupVaoLop, programmeByCode } from '../normal/regular.ts';
import { activeRouteCodes } from '../platform/sysconfig.ts';

export function capNhatThongTinLop(
  p: Principal, classId: number,
  input: { so?: unknown; loTrinh?: unknown; note?: unknown; programmeCode?: unknown },
) {
  const conn = db();
  const c = conn.prepare(
    `SELECT c.*, b.code AS branch_code FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?`,
  ).get(classId) as any;
  if (!c) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.CLASS_EDIT, { classId }, 'Bạn không có quyền sửa thông tin lớp này.');
  const cn = String(c.branch_code);

  /* Số lớp: chỉ phần số — ký hiệu/tiền tố do máy ghép (PR-Dọn Q22: bỏ khoá `code` kiểu cũ). */
  let soMoi: string | null = null;
  if (input.so !== undefined) {
    soMoi = String(input.so ?? '').trim().toUpperCase();
    const loi = kiemSoLop(soMoi);
    if (loi) throw badRequest(loi);
  }

  const cu = (c.programme_code ?? programmeOf(c.kind)) as string | null;
  let chuongTrinh = cu;
  if (input.programmeCode !== undefined) {
    const pc = programmeOf(String(input.programmeCode ?? ''));
    if (!pc) throw badRequest('Chương trình không hợp lệ.');
    if (pc === 'PREFOU' && !CHO_TAO_PRE_FOU && pc !== cu) throw badRequest('Lớp Pre FOU chưa mở — sẽ mở cùng đợt cập nhật hệ môn học.');
    chuongTrinh = pc;
  }
  let route: string | null = chuongTrinh === 'FT' ? (c.route ?? 'LT1') : null;
  const loTrinh = input.loTrinh;
  if (loTrinh !== undefined) {
    if (chuongTrinh !== 'FT') throw badRequest('Chỉ lớp Fast Track có lộ trình.');
    route = String(loTrinh ?? '');
    if (!activeRouteCodes().includes(route)) throw badRequest('Chọn lộ trình LT1, LT2 hoặc RF.');
  }

  const doiCt = chuongTrinh !== cu;
  const doiLt = !doiCt && loTrinh !== undefined && route !== c.route;
  if (doiCt || doiLt) {
    /* Q6 (K2-18): lớp và từng em không được nói hai lộ trình — đổi thì chuyển em sang lớp khác, không đổi lớp. */
    const n = (conn.prepare('SELECT COUNT(DISTINCT student_id) n FROM enrollments WHERE class_id = ?').get(classId) as any).n as number;
    const viec = doiCt ? 'chương trình' : 'lộ trình';
    if (n) throw badRequest(`Lớp đã có ${n} học viên — muốn đổi ${viec} thì chuyển các em sang lớp ${kyHieuLop(chuongTrinh, route)} khác.`);
    if (conn.prepare('SELECT 1 FROM assessment_attempts WHERE class_id = ? LIMIT 1').get(classId)) {
      throw badRequest(`Lớp đã có bài Test nên không đổi được ${viec}.`);
    }
  }

  const moi: Record<string, unknown> = {};
  if (input.note !== undefined) moi.note = String(input.note ?? '').trim() || null;
  if (doiCt) {
    moi.kind = chuongTrinh;
    moi.programme_code = chuongTrinh;
    moi.is_fast_track = chuongTrinh === 'FT' ? 1 : 0;
    [moi.so_tuan, moi.tuan_giua_khoa, moi.tuan_cuoi_khoa] = mocChupVaoLop(chuongTrinh!);   // PF1: số tuần theo chương trình mới
  }
  if (doiCt || doiLt) moi.route = route;
  if (soMoi !== null || doiCt || doiLt) {
    /* Tên theo mẫu (T1): FT ↔ FT RF, BE → FOU… đổi tên trong cùng UPDATE. Lớp cũ tên lạ (không tách được số) phải gõ số. */
    const so = soMoi ?? tachSoLop(c.code, cn);
    if (!so) throw badRequest('Tên lớp chưa theo mẫu — gõ số lớp để máy đặt lại tên.');
    const code = ghepMaLop(cn, chuongTrinh!, route, so);
    if (code !== c.code) {
      if (conn.prepare(`SELECT id FROM classes WHERE ${khoaMaLopSql()} = ? AND id != ?`).get(chuanHoaMaLop(code), classId)) {
        throw badRequest(`Đã có lớp ${code}.`);   // so chuẩn hoá — khớp chỉ mục ux_classes_ma_chuan (Q3)
      }
      moi.code = code;
    }
  }
  if (!Object.keys(moi).length) return conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId);

  const today = demoToday();
  tx(() => {
    const cot = Object.keys(moi);
    conn.prepare(`UPDATE classes SET ${cot.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...cot.map((k) => moi[k]), classId);
    if (doiCt && chuongTrinh) {
      /* Kỹ năng lớp đi theo CHƯƠNG TRÌNH (như lúc tạo lớp); phân công kỹ năng không còn thì kết thúc, không xoá (giữ lịch sử). */
      const kyNang = [...(programmeByCode(chuongTrinh)?.skills
        ?? PROGRAMME_TEMPLATES[chuongTrinh as keyof typeof PROGRAMME_TEMPLATES]?.skills ?? [])] as string[];
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
