/**
 * GÓP Ý HÀNG TUẦN (PR-OV12g, đặc tả OV-12 mục 7 điểm 10, mockup 4 phương án A) — hồ sơ lớp › Học viên › cách xem "Góp ý hàng tuần".
 * Một ô chữ mỗi em × lớp × tuần × kỹ năng (bảng `gop_y_tuan`); không bắt buộc, không việc, không thông báo.
 *
 * QUYỀN (máy chủ, kiểm mỗi lần lưu): GV được phân công dạy kỹ năng ở lớp → ô kỹ năng đó (FT: W1 hoặc W2 → ô W); GVCN → mọi ô;
 * Quản lý / Quản trị (`class.edit` của lớp) → mọi ô; TVV / CX / Admin / GV khác → chỉ đọc (đọc theo quyền xem lớp như bảng học viên).
 * Lớp đã kết thúc: chỉ Quản lý / Quản trị ghi (như điểm — OV-11g).
 */
import { db, tx } from '../db.ts';
import { GOP_Y_SO_TUAN, GOP_Y_TOI_DA, PERMISSIONS, tenMonNgan, tuanLich } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, chuTuDo, forbidden, isIsoDate, notFound, nowIso, toInt } from '../util.ts';
import { activeAt, can, isCoreTeacherOf, require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { boMonCt } from '../normal/regular.ts';

type Lop = { id: number; code: string; programme_code: string | null; status: string };
export type CotGopY = { skill: string; nhan: string; gv: string[]; ghiDuoc: boolean };

function docLop(classId: number): Lop {
  const c = db().prepare('SELECT id, code, programme_code, status FROM classes WHERE id = ?').get(classId) as Lop | undefined;
  if (!c) throw notFound('Không tìm thấy lớp.');
  return c;
}

/** Cột của lớp (FT L R W S; lớp thường theo môn chương trình) + GV phân công + người xem ghi được không — một nguồn cho đọc và ghi. */
function cotCua(p: Principal, c: Lop, today: string): CotGopY[] {
  const quanLy = can(p, PERMISSIONS.CLASS_EDIT, { classId: c.id });
  const laGv = p.roleKeys.includes('teacher') && c.status !== 'finished';
  const gvcn = laGv && isCoreTeacherOf(p, c.id, today);
  const cuaToi = laGv ? p.assignments.filter((a) => a.classId === c.id && activeAt(a, today)).map((a) => a.skill) : [];
  const day = (k: string, s: string | null) => s === k || (k === 'writing' && (s === 'writing1' || s === 'writing2'));
  const gv = db().prepare(
    `SELECT ta.skill, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
      WHERE ta.class_id = ? AND ta.status = 'active' AND ta.skill IS NOT NULL AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
      ORDER BY ta.skill, u.full_name`,
  ).all(c.id, today, today) as { skill: string; full_name: string }[];
  return boMonCt(c.programme_code).map((k) => ({
    skill: k, nhan: tenMonNgan(c.programme_code, k),
    gv: [...new Set(gv.filter((g) => day(k, g.skill)).map((g) => g.full_name))],
    ghiDuoc: quanLy || gvcn || cuaToi.some((s) => day(k, s)),
  }));
}

/** GET /classes/:id/gop-y?tuan=YYYY-MM-DD — tuần đang xem (mặc định / tương lai → tuần này) + 3 tuần trước, một câu đọc. */
export function gopYTuan(p: Principal, classId: number, tuan?: string | null) {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const c = docLop(classId);
  const today = demoToday();
  const nay = mondayOf(today);
  const xem = isIsoDate(tuan) && mondayOf(tuan) < nay ? mondayOf(tuan) : nay;
  const ds = Array.from({ length: GOP_Y_SO_TUAN }, (_, i) => addDays(xem, -7 * i));
  const conn = db();
  const o = (conn.prepare(
    `SELECT g.student_id, g.skill, g.noi_dung, g.ghi_luc, rp.week_start, u.full_name AS ghi_boi
       FROM gop_y_tuan g JOIN report_periods rp ON rp.id = g.period_id LEFT JOIN users u ON u.id = g.ghi_boi
      WHERE g.class_id = ? AND rp.week_start >= ? AND rp.week_start <= ?`,
  ).all(classId, ds[ds.length - 1], xem) as any[]).map((r) => ({
    studentId: r.student_id as number, skill: r.skill as string, tuan: r.week_start as string,
    noiDung: r.noi_dung as string, ghiBoi: (r.ghi_boi ?? null) as string | null, ghiLuc: r.ghi_luc as string,
  }));
  /* Tuần đang xem chưa ai ghi → tuần gần nhất trước đó có góp ý (nút "Xem W2 SEP · 11 em" của người chỉ đọc). */
  const gan = o.some((x) => x.tuan === xem) ? null : conn.prepare(
    `SELECT rp.week_start, COUNT(DISTINCT g.student_id) AS so FROM gop_y_tuan g JOIN report_periods rp ON rp.id = g.period_id
      WHERE g.class_id = ? AND rp.week_start < ? GROUP BY rp.week_start ORDER BY rp.week_start DESC LIMIT 1`,
  ).get(classId, xem) as { week_start: string; so: number } | undefined;
  return {
    tuan: ds.map((w) => ({ weekStart: w, code: tuanLich(w, today) })),
    truoc: addDays(xem, -7), sau: xem < nay ? addDays(xem, 7) : null,
    cot: cotCua(p, c, today), o,
    ganNhat: gan ? { weekStart: gan.week_start, code: tuanLich(gan.week_start, today), soEm: gan.so } : null,
  };
}

/** PUT /classes/:id/gop-y { studentId, tuan, skill, noiDung } — ghi / sửa; chữ trống = xoá ô. Ngoài quyền → 403. */
export function ghiGopYTuan(p: Principal, classId: number, body: Record<string, unknown>) {
  const c = docLop(classId);
  const today = demoToday();
  const tuan = body.tuan;
  if (!isIsoDate(tuan)) throw badRequest('Tuần không hợp lệ.');
  const w = mondayOf(tuan);
  if (w > mondayOf(today)) throw badRequest('Chưa tới tuần này — chỉ ghi góp ý từ tuần này trở về trước.');
  const cot = cotCua(p, c, today).find((k) => k.skill === body.skill);
  if (!cot) throw badRequest('Kỹ năng không thuộc lớp này.');
  if (!cot.ghiDuoc) throw forbidden(`Bạn không ghi được góp ý ${cot.nhan} của lớp ${c.code} — chỉ GV dạy ${cot.nhan}, GVCN hoặc Quản lý.`);
  const noiDung = chuTuDo(body.noiDung ?? null, 'Góp ý', GOP_Y_TOI_DA);
  const sid = toInt(body.studentId);
  const conn = db();
  if (!sid || !conn.prepare('SELECT 1 AS c FROM enrollments WHERE student_id = ? AND class_id = ? LIMIT 1').get(sid, c.id)) {
    throw badRequest('Học viên không học lớp này.');
  }
  return tx(() => {
    const pid = ensurePeriod(w).id;
    const cu = conn.prepare('SELECT id, noi_dung, ghi_luc FROM gop_y_tuan WHERE student_id = ? AND class_id = ? AND period_id = ? AND skill = ?')
      .get(sid, c.id, pid, cot.skill) as { id: number; noi_dung: string; ghi_luc: string } | undefined;
    if ((cu?.noi_dung ?? null) === noiDung) return { noiDung, ghiBoi: p.fullName, ghiLuc: cu?.ghi_luc ?? null };
    const luc = nowIso();
    if (noiDung === null) conn.prepare('DELETE FROM gop_y_tuan WHERE id = ?').run(cu!.id);
    else {
      conn.prepare(
        `INSERT INTO gop_y_tuan (student_id, class_id, period_id, skill, noi_dung, ghi_boi, ghi_luc) VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(student_id, class_id, period_id, skill) DO UPDATE SET noi_dung = excluded.noi_dung, ghi_boi = excluded.ghi_boi, ghi_luc = excluded.ghi_luc`,
      ).run(sid, c.id, pid, cot.skill, noiDung, p.userId, luc);
    }
    writeAudit({
      actorUserId: p.userId, action: noiDung === null ? 'gop_y_tuan.xoa' : 'gop_y_tuan.ghi', entityType: 'student', entityId: sid,
      entityLabel: `${c.code} · ${tuanLich(w, today)} · ${cot.nhan}`, before: cu ? { noiDung: cu.noi_dung } : null, after: noiDung === null ? null : { noiDung },
    });
    return { noiDung, ghiBoi: p.fullName, ghiLuc: luc };
  });
}
