/**
 * GD-20c LUOI-KET-QUA-PA (mockup ⑫ C2, [XM-7]): dữ liệu lưới "Ghi kết quả PA" của MỘT dòng gộp ở Công việc (cùng lớp + cùng kỳ) — MỘT câu đọc mọi PA (+ một câu phạm vi em)
 * của dòng (id do web gửi, chính các việc `/my-work` đã trả): nội dung PA, người dạy, kỳ, nháp máy chủ, MT gần nhất + kỳ vọng (mốc Case như
 * `ketQuaGanNhat`), hạn kỳ sau khi lưu Giữ nguyên (`hanKe` như máy chủ khi ghi). Lưu từng dòng đi `POST /interventions/:id/result` sẵn có.
 *
 * Quyền đọc = quyền xem Case (`kiemXemCase`): xem lượt của em, hoặc là người giữ việc của PA đang chạy. PA ngoài quyền bị bỏ khỏi kết quả (không 403
 * cả lưới — dòng đó vẫn mở được bằng "Mở đầy đủ", nơi báo đúng lý do).
 * TU2-2: nhận cả PA chưa tới kỳ (khối "PA đang chạy" — không lọc theo hạn) · phần Tutor: "b" điền sẵn (`buoiKy`), tutor kỳ trước (`tutorTruoc`), nháp a / b + dòng Tutor.
 */
import { db } from '../db.ts';
import { can, napTruocPhamVi, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, loi } from '../util.ts';
import { MOC_QUY_CHE_SOS, PERMISSIONS, coSoBuoiKy, hanKe, type BuoiTutor } from '../../../shared/domain/index.ts';
import { docNhapKetQua } from './cases.ts';
import { nguoiGiuKetQua } from './giuKetQua.ts';

/** Một dòng gộp ở Công việc có tối đa vài chục PA (một lớp, một kỳ) — trần chặn chuỗi id quá dài. */
export const TRAN_PA_LUOI = 100;

export type DongLuoiKetQua = {
  id: number; caseId: number; kind: string; description: string | null; topic: string | null;
  performer: string | null; performerUserId: number | null; cycleNo: number;
  /** PA còn chạy (planned / started) — web so với lúc mở để biết dòng đã ghi ở panel đầy đủ (kỳ đổi hoặc PA khép). */
  dangChay: boolean;
  nhap: { outcome: string; note: string; luc: string; boi: string; soBuoi: number | null; buoiDuKien: number | null; buoi: BuoiTutor[] } | null;
  /** TU2-2 (TU11): "b" điền sẵn — b của lần ghi gần nhất CÓ b (dự phòng có chủ ý: lần ghi cũ / web cũ không gửi b thì lấy b trước đó, rà #1864); chưa có thì `so_buoi` cũ của PA quy chế SOS (nhập dưới nhãn "/ 2 tuần"). PA không có ô a / b: null. */
  buoiKy: number | null;
  /** TU2-2 (TU4): tutor của lần ghi gần nhất (dòng Tutor cuối) — cùng luật `dienSan` của `/tutors/chon` (tutor ngừng / GV đã xoá: null). PA khác Tutor: null. */
  tutorTruoc: { tutorId: number | null; gvId: number | null; ten: string } | null;
  mt: { attemptNo: number; band: number; expectation: number | null } | null;
  /** Hạn kỳ sau nếu lưu hôm nay với Giữ nguyên (cùng `hanKeSauGhi` của máy chủ). */
  hanKe: string | null;
};

export function docIdLuoi(v: unknown): number[] {
  const ids = [...new Set(String(v ?? '').split(',').map((x) => Number(x.trim())).filter((x) => Number.isInteger(x) && x > 0))];
  if (!ids.length) throw badRequest('Thiếu danh sách PA.');
  if (ids.length > TRAN_PA_LUOI) throw loi(400, 'Tối đa {n} PA một lưới.', { n: TRAN_PA_LUOI });
  return ids;
}

export function luoiKetQua(p: Principal, ids: readonly number[]): { ds: DongLuoiKetQua[] } {
  const homNay = demoToday();
  const rows = db().prepare(
    `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.cycle_no, iv.nhap_ket_qua, iv.performer_user_id, iv.started_date, iv.cycle_started_on,
            iv.action_due, iv.status, iv.nhom_bo_tro, COALESCE(u.full_name, iv.performer_name) AS performer, sc.topic, sc.owner_user_id,
            iv.so_buoi, iv.moc_quy_che,
            CASE WHEN iv.kind = 'tutor' OR iv.so_buoi IS NOT NULL THEN (SELECT f.buoi_du_kien FROM case_followups f
              WHERE f.intervention_id = iv.id AND f.buoi_du_kien IS NOT NULL ORDER BY f.id DESC LIMIT 1) END AS b_truoc,
            CASE WHEN iv.kind = 'tutor' THEN (SELECT json_array(b.tutor_id, t.user_id, COALESCE(t.ten, b.tutor_ten),
                b.tutor_id IS NULL OR (t.id IS NOT NULL AND (t.user_id IS NULL OR gu.status = 'active')
                  AND COALESCE((SELECT n.ket_luan FROM tutor_nhan_xet n WHERE n.tutor_id = t.id ORDER BY n.luc DESC, n.id DESC LIMIT 1), '') != 'ngung'))
              FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id LEFT JOIN tutors t ON t.id = b.tutor_id LEFT JOIN users gu ON gu.id = t.user_id
              WHERE f.intervention_id = iv.id ORDER BY f.id DESC, b.buoi_so DESC LIMIT 1) END AS tutor_truoc,
            COALESCE(sc.student_id, a.student_id) AS hv,
            COALESCE((SELECT e.class_id FROM enrollments e WHERE e.student_id = COALESCE(sc.student_id, a.student_id) AND e.status = 'active'
                       ORDER BY e.id DESC LIMIT 1), a.class_id) AS lop,
            (SELECT json_array(m.attempt_no, m.band, m.expectation) FROM case_milestones m
              WHERE m.case_id = iv.case_id AND m.kind IN ('opened', 'repeat') AND m.band IS NOT NULL ORDER BY m.occurred_on DESC, m.id DESC LIMIT 1) AS mt
       FROM case_interventions iv
       JOIN sos_cases sc ON sc.id = iv.case_id
       LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       LEFT JOIN users u ON u.id = iv.performer_user_id
      WHERE iv.id IN (${ids.map(() => '?').join(',')}) ORDER BY iv.id`,
  ).all(...ids) as any[];
  /* Người giữ việc không có quyền xem lượt (vd chủ Case, lớp mới chưa phân công môn) — chỉ tính cho dòng trượt quyền xem (hiếm), như `kiemXemCase`. */
  napTruocPhamVi(rows.map((r) => r.hv));   // phạm vi em của cả lưới MỘT câu — `can` dưới không hỏi DB theo từng em
  const truot = rows.filter((r) => !can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: r.lop, studentId: r.hv }));
  const giu = truot.length ? nguoiGiuKetQua(truot.filter((r) => r.status === 'planned' || r.status === 'started')
    .map((r) => ({ id: r.id, topic: r.topic ?? null, nhomBoTro: r.nhom_bo_tro ?? null, classId: r.lop ?? null, ownerUserId: r.owner_user_id ?? null })), homNay) : new Map();
  const ngoai = new Set(truot.filter((r) => giu.get(r.id) !== p.userId).map((r) => r.id));
  return {
    ds: rows.filter((r) => !ngoai.has(r.id)).map((r) => {
      const n = docNhapKetQua(r.nhap_ket_qua);
      const m = r.mt ? JSON.parse(r.mt) as [number, number, number | null] : null;
      const tt = r.tutor_truoc ? JSON.parse(r.tutor_truoc) as [number | null, number | null, string, number] : null;
      const quyChe = (MOC_QUY_CHE_SOS as readonly string[]).includes(r.moc_quy_che);
      return {
        id: r.id, caseId: r.case_id, kind: r.kind, description: r.description ?? null, topic: r.topic ?? null,
        performer: r.performer ?? null, performerUserId: r.performer_user_id ?? null, cycleNo: r.cycle_no ?? 1,
        dangChay: r.status === 'planned' || r.status === 'started',
        nhap: n ? { outcome: n.outcome, note: n.note, luc: n.luc, boi: n.boi, soBuoi: n.soBuoi ?? null, buoiDuKien: n.buoiDuKien ?? null, buoi: n.buoi ?? [] } : null,
        buoiKy: !coSoBuoiKy({ kind: r.kind, soBuoi: r.so_buoi ?? null }) ? null : r.b_truoc ?? (quyChe ? r.so_buoi ?? null : null),
        tutorTruoc: tt && tt[3] ? { tutorId: tt[0], gvId: tt[1], ten: tt[2] } : null,
        mt: m ? { attemptNo: m[0], band: Number(m[1]), expectation: m[2] == null ? null : Number(m[2]) } : null,
        hanKe: r.kind === 'bo_tro_mien_phi' ? r.action_due ?? null : hanKe(r.started_date ?? r.cycle_started_on ?? homNay, r.action_due ?? null, homNay),
      };
    }),
  };
}
