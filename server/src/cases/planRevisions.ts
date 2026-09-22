import { db } from '../db.ts';
import { badRequest, isIsoDate, nowIso } from '../util.ts';

/**
 * LỊCH SỬ ĐIỀU CHỈNH PHƯƠNG ÁN HỌC THUẬT (PR-S2 · S2 · rulebook §18.2 điểm 2, nguồn §7).
 *
 * Trước PR-S2, sửa nội dung một PA là ghi đè, bản cũ mất hẳn. Nay mỗi lần sửa ghi MỘT dòng `case_intervention_revisions`:
 * bản cũ, bản mới, ngày, ai, vì sao. Hàng chính `case_interventions` luôn là BẢN HIỆN TẠI.
 *
 * Điều chỉnh KHÔNG đổi loại PA (đổi loại là Thay). Nhờ vậy thống kê theo loại PA (`effectiveness.ts`) không bao giờ gán kết quả
 * của loại này cho loại khác. PA vẫn là MỘT dòng nên vẫn chỉ đóng góp MỘT kết quả cuối.
 */

export type DieuChinhPA = {
  description: string; performerUserId: number | null; performerName: string | null; followupDue: string | null;
};
export type DieuChinhVao = {
  description?: string | null; performerUserId?: number | null; performerName?: string | null; followupDue?: string | null;
};
export type MatPA = { description: string | null; performer: string | null; followupDue: string | null };
export type BanDieuChinh = {
  id: number; on: string; source: 'adjust' | 'confirm_edit'; by: string | null; reason: string; before: MatPA; after: MatPA;
};

/**
 * Chuẩn hoá nội dung mới của một lần Điều chỉnh. Trường KHÔNG gửi (hoặc rỗng) = giữ nguyên bản hiện tại.
 * Ném lỗi khi mô tả quá ngắn, ngày sai, người không tồn tại, hoặc KHÔNG ĐỔI GÌ (không đổi gì thì là Giữ nguyên).
 */
export function chuanHoaDieuChinh(iv: any, input: DieuChinhVao | null | undefined, observedOn: string): DieuChinhPA {
  const a = input ?? {};
  const oldDesc = String(iv.description ?? '').trim();
  let description = oldDesc;
  if (typeof a.description === 'string' && a.description.trim() !== oldDesc) {
    description = a.description.trim();
    if (description.length < 8) throw badRequest('Mô tả ngắn phải nói rõ làm gì cho em, ít nhất 8 ký tự.');
  }
  let performerUserId: number | null = iv.performer_user_id ?? null;
  let performerName: string | null = iv.performer_name ?? null;
  if (a.performerUserId) {
    if (!db().prepare('SELECT 1 FROM users WHERE id = ?').get(a.performerUserId)) throw badRequest('Không tìm thấy người thực hiện.');
    performerUserId = Number(a.performerUserId);
    performerName = null;
  } else if (typeof a.performerName === 'string' && a.performerName.trim()) {
    performerUserId = null;
    performerName = a.performerName.trim();
  }
  let followupDue: string | null = iv.followup_due ?? null;
  if (a.followupDue) {
    if (!isIsoDate(a.followupDue)) throw badRequest('Ngày dự kiến kết thúc không hợp lệ.');
    if (a.followupDue < observedOn) throw badRequest('Ngày dự kiến kết thúc mới không được sớm hơn ngày cập nhật.');
    followupDue = a.followupDue;
  }
  const same = description === oldDesc
    && performerUserId === (iv.performer_user_id ?? null)
    && performerName === (iv.performer_name ?? null)
    && followupDue === (iv.followup_due ?? null);
  if (same) {
    throw badRequest('Điều chỉnh thì phải đổi ít nhất một thứ: mô tả, người thực hiện hoặc ngày dự kiến kết thúc. Không đổi gì thì chọn Giữ nguyên.');
  }
  return { description, performerUserId, performerName, followupDue };
}

/** Ghi MỘT dòng lịch sử. `iv` là dòng `case_interventions` ĐỌC TRƯỚC khi sửa (bản cũ). Trả id dòng vừa ghi. */
export function ghiBanDieuChinh(input: {
  iv: any; after: DieuChinhPA; source: 'adjust' | 'confirm_edit'; reason: string; on: string;
  actorUserId: number | null; followupId: number | null;
}): number {
  const { iv, after } = input;
  return Number(db()
    .prepare(
      `INSERT INTO case_intervention_revisions (intervention_id, case_id, followup_id, source,
          old_description, new_description, old_performer_user_id, old_performer_name, new_performer_user_id, new_performer_name,
          old_followup_due, new_followup_due, reason, effective_on, actor_user_id, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(iv.id, iv.case_id, input.followupId, input.source,
         iv.description ?? null, after.description, iv.performer_user_id ?? null, iv.performer_name ?? null,
         after.performerUserId, after.performerName, iv.followup_due ?? null, after.followupDue,
         input.reason, input.on, input.actorUserId, nowIso())
    .lastInsertRowid);
}

/** Điều chỉnh: đưa bản mới vào hàng chính rồi ghi lịch sử. Gọi TRONG giao dịch của `updateResult`. */
export function apDungDieuChinh(iv: any, patch: DieuChinhPA, ctx: {
  followupId: number; actorUserId: number | null; reason: string; on: string;
}): number {
  db()
    .prepare(
      `UPDATE case_interventions SET description = ?, performer_user_id = ?, performer_name = ?, followup_due = ?, updated_at = ?
        WHERE id = ?`,
    )
    .run(patch.description, patch.performerUserId, patch.performerName, patch.followupDue, nowIso(), iv.id);
  return ghiBanDieuChinh({
    iv, after: patch, source: 'adjust', reason: ctx.reason, on: ctx.on, actorUserId: ctx.actorUserId, followupId: ctx.followupId,
  });
}

/** Mọi bản điều chỉnh của một Case, gom theo PA, cũ trước mới sau. MỘT câu truy vấn cho cả Case. */
export function lichSuDieuChinhCuaCase(caseId: number): Map<number, BanDieuChinh[]> {
  const rows = db()
    .prepare(
      `SELECT r.*, a.full_name AS actor_name, ou.full_name AS old_perf_acc, nu.full_name AS new_perf_acc
         FROM case_intervention_revisions r
         LEFT JOIN users a ON a.id = r.actor_user_id
         LEFT JOIN users ou ON ou.id = r.old_performer_user_id
         LEFT JOIN users nu ON nu.id = r.new_performer_user_id
        WHERE r.case_id = ?
        ORDER BY r.effective_on, r.id`,
    )
    .all(caseId) as any[];
  const out = new Map<number, BanDieuChinh[]>();
  for (const r of rows) {
    const ban: BanDieuChinh = {
      id: r.id, on: r.effective_on, source: r.source, by: r.actor_name ?? null, reason: r.reason,
      before: { description: r.old_description ?? null, performer: r.old_perf_acc ?? r.old_performer_name ?? null, followupDue: r.old_followup_due ?? null },
      after: { description: r.new_description ?? null, performer: r.new_perf_acc ?? r.new_performer_name ?? null, followupDue: r.new_followup_due ?? null },
    };
    if (!out.has(r.intervention_id)) out.set(r.intervention_id, []);
    out.get(r.intervention_id)!.push(ban);
  }
  return out;
}
