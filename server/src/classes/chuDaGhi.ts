import { DS_JSON, db } from '../db.ts';
import { type Principal } from '../permissions.ts';
import { badRequest, forbidden, isIsoDate } from '../util.ts';
import { docLop, quyenBc } from './baoCaoPh.ts';
import { addDaysIso, nhanDot, nhanLoaiXuLy } from '../../../shared/domain/index.ts';

/** Một câu đã ghi: `loai` nx-mt (nhận xét bài Test) · kq-pa (kết quả PA) · case (mô tả Case đang mở) · vi-pham · xu-ly. `ngay` ISO. */
export type ChuDaGhi = { loai: 'nx-mt' | 'kq-pa' | 'case' | 'vi-pham' | 'xu-ly'; ngay: string; chu: string; luot?: string | null };
export type ChuDaGhiEm = { id: number; kyNang: Record<string, ChuDaGhi[]>; chung: ChuDaGhi[] };

/** Khoảng đọc tối đa — một đợt tháng / Progress + bàn giao cả khoá ngắn; chặn đọc cả lịch sử. */
const TOI_DA_NGAY = 120;

/**
 * LG-13 (H1, H2 — overhaul V6 đợt 4): "Bạn đã ghi" của CẢ LỚP trong khoảng ngày — gợi ý cho ô chữ Báo cáo PH / bàn giao (web chỉ gọi khi mở panel viết, MỘT lần cho lớp).
 * Theo em × kỹ năng: nhận xét bài Test theo ngày nghiệp vụ có điểm (`nhap_dau_ngay`; Speaking chấm chéo: nhận xét của GV phụ trách trước) · kết quả PA (Tiến triển) · mô tả Case đang mở (không theo khoảng).
 * Phần Chung: vi phạm + xử lý đã thực hiện. Chỉ em đang học trong lớp; em / kỹ năng không có gì → không có khoá. Mới nhất trước.
 * Quyền = xem Báo cáo PH của lớp (`quyenBc().xem`: QL · QT · Admin · TVV chi nhánh lớp + GV có phân công lớp).
 * Turso: 4 câu (em · nhận xét · Case + kết quả PA · vi phạm + xử lý), mỗi câu theo danh sách em của lớp (chỉ mục theo em).
 */
export function chuDaGhiLop(p: Principal, classId: number, q: { tu?: unknown; den?: unknown }): { em: ChuDaGhiEm[] } {
  const c = docLop(classId);
  if (!quyenBc(p, c).xem) throw forbidden('Bạn không xem được lớp này.');
  const { tu, den } = q;
  if (!isIsoDate(tu) || !isIsoDate(den) || tu > den) throw badRequest('Khoảng ngày không hợp lệ.');
  if (den > addDaysIso(tu, TOI_DA_NGAY)) throw badRequest(`Khoảng ngày tối đa ${TOI_DA_NGAY} ngày.`);
  const conn = db();
  const ids = (conn.prepare(`SELECT DISTINCT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id`).all(classId) as any[]).map((r) => r.student_id as number);
  if (!ids.length) return { em: [] };
  const json = JSON.stringify(ids);
  const theoEm = new Map<number, ChuDaGhiEm>();
  const em = (id: number) => theoEm.get(id) ?? (theoEm.set(id, { id, kyNang: {}, chung: [] }).get(id)!);
  const them = (id: number, kn: string | null, x: ChuDaGhi) => {
    if (!x.chu) return;
    if (!kn) { em(id).chung.push(x); return; }
    (em(id).kyNang[kn] ??= []).push(x);
  };
  const gon = (s: unknown) => String(s ?? '').trim();

  for (const r of conn.prepare(
    `SELECT a.student_id, s.skill, a.kind, a.attempt_no, COALESCE(NULLIF(TRIM(s.nhan_xet_phu_trach), ''), s.comment) AS chu, s.nhap_dau_ngay AS ngay
       FROM assessment_attempts a JOIN assessment_scores s ON s.attempt_id = a.id
      WHERE a.student_id IN (${DS_JSON}) AND a.status != 'cancelled'
        AND COALESCE(NULLIF(TRIM(s.nhan_xet_phu_trach), ''), NULLIF(TRIM(s.comment), '')) IS NOT NULL
        AND s.nhap_dau_ngay BETWEEN ? AND ?
      ORDER BY ngay DESC, s.id DESC`,
  ).all(json, tu, den) as any[]) them(r.student_id, r.skill, { loai: 'nx-mt', ngay: r.ngay, chu: gon(r.chu), luot: nhanDot(r.kind, r.attempt_no ?? null) });

  /* Mô tả Case đang mở (bàn giao cần dù viết từ trước khoảng) + Tiến triển của lần ghi kết quả PA trong khoảng — một câu. */
  for (const r of conn.prepare(
    `SELECT sc.student_id, sc.topic, 'case' AS loai, substr(COALESCE(sc.detected_at, sc.created_at), 1, 10) AS ngay, sc.summary AS chu, sc.id AS k
       FROM sos_cases sc WHERE sc.student_id IN (${DS_JSON}) AND sc.status != 'done' AND sc.tam = 0 AND NULLIF(TRIM(sc.summary), '') IS NOT NULL
     UNION ALL
     SELECT sc.student_id, sc.topic, 'kq-pa', f.observed_on, f.note, f.id
       FROM sos_cases sc JOIN case_followups f ON f.case_id = sc.id
      WHERE sc.student_id IN (${DS_JSON}) AND NULLIF(TRIM(f.note), '') IS NOT NULL AND f.observed_on BETWEEN ? AND ?
     ORDER BY ngay DESC, k DESC`,
  ).all(json, json, tu, den) as any[]) them(r.student_id, r.topic === 'tong_hop' ? null : r.topic, { loai: r.loai, ngay: r.ngay, chu: gon(r.chu) });

  /* Phần Chung: vi phạm (kể cả "Chỉ nhắc nhở") + lần xử lý đã thực hiện trong khoảng — một câu. */
  for (const r of conn.prepare(
    `SELECT student_id, 'vi-pham' AS loai, occurred_on AS ngay, ten, description AS chu, NULL AS kind, id AS k FROM violations
      WHERE student_id IN (${DS_JSON}) AND occurred_on BETWEEN ? AND ?
     UNION ALL
     SELECT student_id, 'xu-ly', performed_on, custom_name, note, kind, id FROM discipline_measures
      WHERE student_id IN (${DS_JSON}) AND status = 'done' AND performed_on BETWEEN ? AND ?
     ORDER BY ngay DESC, k DESC`,
  ).all(json, tu, den, json, tu, den) as any[]) {
    const dau = r.loai === 'xu-ly' ? nhanLoaiXuLy(r.kind, r.ten) : gon(r.ten);
    them(r.student_id, null, { loai: r.loai, ngay: r.ngay, chu: [dau, gon(r.chu)].filter(Boolean).join(' — ') });
  }
  return { em: [...theoEm.values()].sort((a, b) => a.id - b.id) };
}
