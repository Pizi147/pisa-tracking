/**
 * TỔNG QUAN TVV — "Học viên của tôi" (PR-OV2a, mockup overhaul-3 §3). HV của tôi = `students.consultant_user_id` = người xem, còn trong
 * phạm vi xem (`student.view`). Chỉ đọc: 4 số + danh sách em cần để ý (khối dưới của mockup) để báo phụ huynh; mọi dòng bấm ra hồ sơ.
 * Một câu học viên + `standingFor` (dùng chung với Học viên & Lớp) + một câu Case + một câu Ý thức — không tăng theo số em.
 */
import { db } from '../db.ts';
import { PERMISSIONS, tenMon } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays } from '../util.ts';
import { can, napTruocPhamVi, type Principal } from '../permissions.ts';
import { mondayOf } from '../platform/week.ts';
import { standingFor } from '../students/standing.ts';

/** "Sắp thi" = dự kiến thi trong từng này tuần tới (mockup: "trong 6 tuần tới"). "Mới" = trong 14 ngày gần nhất. */
const SAP_THI_TUAN = 6;
const MOI_NGAY = 14;

export type DongChuY = { loai: 'sos' | 'case' | 'y-thuc' | 'thi'; nhan: string; studentId: number; ten: string; chiTiet: string; tuan: string | null };
export type HvCuaToi = { tong: number; duoiKyVong: number; caseMo: number; caseMoiTuan: number; sapThi: number; thieuTt: number; canChuY: DongChuY[] };

export function hvCuaToi(p: Principal): HvCuaToi {
  const conn = db();
  const homNay = demoToday();
  const dauTuan = mondayOf(homNay);
  const rows = conn.prepare(
    `SELECT s.id, s.full_name, s.email, s.dob, c.code AS lop, cy.exam_date, cy.exam_month, rp.week_start AS tuan_thi
       FROM students s
       LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
       LEFT JOIN classes c ON c.id = e.class_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
       LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id
      WHERE s.consultant_user_id = ? AND s.archived_at IS NULL AND s.status != 'finished'
      ORDER BY s.full_name`,
  ).all(p.userId) as any[];
  napTruocPhamVi(rows.map((r) => r.id));
  const em = new Map<number, any>();
  for (const r of rows) if (!em.has(r.id) && can(p, PERMISSIONS.STUDENT_VIEW, { studentId: r.id })) em.set(r.id, r);
  const ids = [...em.keys()];
  const rong: HvCuaToi = { tong: 0, duoiKyVong: 0, caseMo: 0, caseMoiTuan: 0, sapThi: 0, thieuTt: 0, canChuY: [] };
  if (!ids.length) return rong;
  const ph = ids.map(() => '?').join(',');

  const standing = standingFor(ids);
  const caseMo = conn.prepare(
    `SELECT sc.id, COALESCE(sc.student_id, a.student_id) AS sid, sc.topic, sc.title, sc.created_at
       FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE COALESCE(sc.student_id, a.student_id) IN (${ph}) AND sc.status != 'done' ORDER BY sc.created_at DESC`,
  ).all(...ids) as any[];
  const viPham = conn.prepare(
    `SELECT student_id AS sid, ten, description, occurred_on FROM violations
      WHERE student_id IN (${ph}) AND occurred_on >= ? ORDER BY occurred_on DESC`,
  ).all(...ids, addDays(homNay, -MOI_NGAY)) as any[];

  const ngayThi = (r: any): string | null => r.exam_date ?? r.tuan_thi ?? (r.exam_month ? `${r.exam_month}-01` : null);
  const cuoiKhoang = addDays(dauTuan, SAP_THI_TUAN * 7 - 1);
  /* Chỉ ghi tháng thi → sắp thi khi tháng đó chạm khoảng 6 tuần. */
  const sapThi = (r: any) => {
    if (!r.exam_date && !r.tuan_thi && r.exam_month) return `${r.exam_month}-01` <= cuoiKhoang && `${r.exam_month}-31` >= dauTuan;
    const d = ngayThi(r); return !!d && d >= dauTuan && d <= cuoiKhoang;
  };
  const moi = (d: string | null) => !!d && d.slice(0, 10) >= addDays(homNay, -MOI_NGAY);

  const canChuY: DongChuY[] = [];
  const daCo = new Set<number>();
  const them = (d: DongChuY) => { if (daCo.has(d.studentId)) return; daCo.add(d.studentId); canChuY.push(d); };
  /* Thứ tự ưu tiên: SOS → Case mới → Ý thức → Thi IELTS (một em một dòng — lý do nặng nhất). */
  for (const [id, r] of em) {
    const st = standing.get(id);
    if (st?.sosLevel && st.mode === 'ielts_band') {
      const duoi = st.belowSkills.map((b) => `${tenMon(null, b.skill)} ${b.band}`).join(' · ');
      them({ loai: 'sos', nhan: `SOS ${st.sosLevel}`, studentId: id, ten: r.full_name,
        chiTiet: [r.lop, st.attemptLabel, duoi, st.expectation != null ? `(kỳ vọng ${st.expectation})` : null].filter(Boolean).join(' · '), tuan: null });
    }
  }
  for (const c of caseMo) {
    if (!moi(c.created_at) || !em.has(c.sid)) continue;
    them({ loai: 'case', nhan: 'Case mới', studentId: c.sid, ten: em.get(c.sid).full_name,
      chiTiet: c.title ?? (c.topic ? tenMon(null, c.topic) : 'Case học thuật'), tuan: mondayOf(c.created_at.slice(0, 10)) });
  }
  for (const v of viPham) {
    them({ loai: 'y-thuc', nhan: 'Ý thức', studentId: v.sid, ten: em.get(v.sid).full_name, chiTiet: v.ten ?? v.description, tuan: mondayOf(v.occurred_on) });
  }
  for (const [id, r] of em) {
    if (!sapThi(r)) continue;
    them({ loai: 'thi', nhan: 'Thi IELTS', studentId: id, ten: r.full_name,
      chiTiet: [r.lop, standing.get(id)?.overall != null ? `MT gần nhất ${standing.get(id)!.overall}` : null].filter(Boolean).join(' · '), tuan: mondayOf(ngayThi(r)!) });
  }

  return {
    tong: ids.length,
    duoiKyVong: ids.filter((id) => (standing.get(id)?.sosLevel ?? 0) > 0).length,
    caseMo: new Set(caseMo.map((c) => c.sid)).size,
    caseMoiTuan: caseMo.filter((c) => (c.created_at ?? '').slice(0, 10) >= dauTuan).length,
    sapThi: [...em.values()].filter(sapThi).length,
    thieuTt: [...em.values()].filter((r) => !r.email || !r.dob).length,
    canChuY,
  };
}
