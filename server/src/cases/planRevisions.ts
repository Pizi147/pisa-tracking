import { db } from '../db.ts';
import { badRequest, nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { chuanHoaNguoiThucHien } from './nguoiThucHien.ts';
import { coNguoiDay, coSoBuoi, kiemSoBuoiPa, soBuoiTu } from '../../../shared/domain/index.ts';

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
  /** NULL chỉ khi PA vốn chưa có mô tả và lần này không đổi mô tả. */
  description: string | null; performerUserId: number | null; performerName: string | null; followupDue: string | null;
  /** PR-PA (§8): Số buổi + Ngày bắt đầu — nhật ký ghi cũ → mới. */
  soBuoi: number | null; startedDate: string | null;
};
export type DieuChinhVao = {
  description?: string | null;
  performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null;
  followupDue?: string | null;
  /** PR-PA: không gửi = giữ; null / '' = xoá; còn lại 1–60 và ≥ đã dạy. */
  soBuoi?: unknown;
};
export type MatPA = { description: string | null; performer: string | null; followupDue: string | null; soBuoi: number | null; startedDate: string | null };
export type BanDieuChinh = {
  id: number; on: string; source: 'adjust' | 'confirm_edit' | 'sua_pa'; by: string | null; reason: string; before: MatPA; after: MatPA;
};

/** PR-PA (§8): Số buổi mới của PA — không gửi (`undefined`) = giữ; loại không có Số buổi mà gửi số → 400; 1–60, ≥ đã dạy. */
export function soBuoiMoi(iv: any, v: unknown, daDay: number): number | null {
  if (v === undefined) return iv.so_buoi ?? null;
  const n = soBuoiTu(v);
  if (n !== null && !coSoBuoi(iv.kind)) throw badRequest('Loại PA này không có Số buổi.');
  const loi = kiemSoBuoiPa(v, daDay);
  if (loi) throw badRequest(`Số buổi: ${loi}.`);
  return n;
}

/** PR-PA: Đã dạy = tổng Số buổi tuần này của các Kết quả của PA. */
export const daDayCua = (ivId: number): number =>
  Number((db().prepare('SELECT COALESCE(SUM(so_buoi), 0) n FROM case_followups WHERE intervention_id = ?').get(ivId) as any).n);

/**
 * Chuẩn hoá nội dung mới của một lần Điều chỉnh. Trường KHÔNG gửi (hoặc rỗng) = giữ nguyên bản hiện tại —
 * trừ khoá người (`performerSelf/UserId/Name`): gửi bất kỳ khoá nào = đặt lại (cả ba trống = xoá người).
 * Ném lỗi khi mô tả quá ngắn, ngày sai, người không tồn tại, hoặc KHÔNG ĐỔI GÌ (không đổi gì thì là Giữ nguyên).
 */
export function chuanHoaDieuChinh(p: Principal, iv: any, input: DieuChinhVao | null | undefined, observedOn: string, daDay = 0): DieuChinhPA {
  const a = input ?? {};
  const oldDesc = String(iv.description ?? '').trim();
  let description = oldDesc;
  if (typeof a.description === 'string' && a.description.trim() !== oldDesc) {
    description = a.description.trim();
    if (description.length < 8) throw badRequest('Mô tả ngắn phải nói rõ làm gì cho em, ít nhất 8 ký tự.');
  }
  /* Người thực hiện đi qua luật chung (PR-Form F-2). PR-PA (§8): như Sửa PA — gửi BẤT KỲ khoá người nào = đặt lại (cả ba trống = xoá
     người); không gửi khoá nào = giữ người cũ. Tự học không có ô người — bỏ qua. */
  const guiNguoi = coNguoiDay(iv.kind) && ['performerSelf', 'performerUserId', 'performerName'].some((k) => k in a);
  const nguoiMoi = guiNguoi ? chuanHoaNguoiThucHien(p, a, { nhom: 'giao_vien', batBuoc: false }) : null;
  const performerUserId = guiNguoi ? nguoiMoi?.userId ?? null : (iv.performer_user_id ?? null);
  const performerName = guiNguoi ? nguoiMoi?.name ?? null : (iv.performer_name ?? null);
  /* PR-SOS (Q28-4): bỏ "Dự kiến kết thúc" — Điều chỉnh không nhận `followupDue`; mốc giữ nguyên (PA quy chế: mốc quy chế; PA thường: NULL). */
  const followupDue: string | null = iv.followup_due ?? null;
  const soBuoi = soBuoiMoi(iv, a.soBuoi, daDay);
  const same = description === oldDesc
    && performerUserId === (iv.performer_user_id ?? null)
    && performerName === (iv.performer_name ?? null)
    && soBuoi === (iv.so_buoi ?? null);
  if (same) {
    throw badRequest('Điều chỉnh thì phải đổi ít nhất một thứ: mô tả, Số buổi hoặc người thực hiện. Không đổi gì thì chọn Giữ nguyên.');
  }
  /* Mô tả rỗng chỉ xảy ra khi KHÔNG đổi mô tả (mô tả mới phải ≥ 8 ký tự): giữ đúng bản cũ, PA chưa có mô tả thì vẫn NULL. */
  return {
    description: description || (iv.description ?? null), performerUserId, performerName, followupDue, soBuoi, startedDate: iv.started_date ?? null,
  };
}

/** Ghi MỘT dòng lịch sử. `iv` là dòng `case_interventions` ĐỌC TRƯỚC khi sửa (bản cũ). Trả id dòng vừa ghi. */
export function ghiBanDieuChinh(input: {
  iv: any; after: DieuChinhPA; source: 'adjust' | 'confirm_edit' | 'sua_pa'; reason: string; on: string;
  actorUserId: number | null; followupId: number | null;
}): number {
  const { iv, after } = input;
  return Number(db()
    .prepare(
      `INSERT INTO case_intervention_revisions (intervention_id, case_id, followup_id, source,
          old_description, new_description, old_performer_user_id, old_performer_name, new_performer_user_id, new_performer_name,
          old_followup_due, new_followup_due, reason, effective_on, actor_user_id, created_at,
          old_so_buoi, new_so_buoi, old_started_date, new_started_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(iv.id, iv.case_id, input.followupId, input.source,
         iv.description ?? null, after.description, iv.performer_user_id ?? null, iv.performer_name ?? null,
         after.performerUserId, after.performerName, iv.followup_due ?? null, after.followupDue,
         input.reason, input.on, input.actorUserId, nowIso(),
         iv.so_buoi ?? null, after.soBuoi, iv.started_date ?? null, after.startedDate)
    .lastInsertRowid);
}

/** Điều chỉnh: đưa bản mới vào hàng chính rồi ghi lịch sử. Gọi TRONG giao dịch của `updateResult`. Dòng anh em (bổ trợ nhóm) giữ Ngày bắt đầu của mình. */
export function apDungDieuChinh(iv: any, patch: DieuChinhPA, ctx: {
  followupId: number; actorUserId: number | null; reason: string; on: string;
}): number {
  db()
    .prepare(
      `UPDATE case_interventions SET description = ?, performer_user_id = ?, performer_name = ?, followup_due = ?, so_buoi = ?, updated_at = ?
        WHERE id = ?`,
    )
    .run(patch.description, patch.performerUserId, patch.performerName, patch.followupDue, patch.soBuoi, nowIso(), iv.id);
  return ghiBanDieuChinh({
    iv, after: { ...patch, startedDate: iv.started_date ?? null }, source: 'adjust', reason: ctx.reason, on: ctx.on, actorUserId: ctx.actorUserId, followupId: ctx.followupId,
  });
}

/**
 * Mọi bản điều chỉnh của một Case, gom theo PA, cũ trước mới sau THEO THỨ TỰ GHI (`id`), không theo ngày cập nhật: lần sau có thể
 * ghi ngày cập nhật sớm hơn lần trước, và bản cũ của lần sau luôn là bản mới của lần trước. MỘT câu truy vấn cho cả Case.
 */
export function lichSuDieuChinhCuaCase(caseId: number): Map<number, BanDieuChinh[]> {
  const rows = db()
    .prepare(
      `SELECT r.*, a.full_name AS actor_name, ou.full_name AS old_perf_acc, nu.full_name AS new_perf_acc
         FROM case_intervention_revisions r
         LEFT JOIN users a ON a.id = r.actor_user_id
         LEFT JOIN users ou ON ou.id = r.old_performer_user_id
         LEFT JOIN users nu ON nu.id = r.new_performer_user_id
        WHERE r.case_id = ?
        ORDER BY r.id`,
    )
    .all(caseId) as any[];
  const out = new Map<number, BanDieuChinh[]>();
  for (const r of rows) {
    const ban: BanDieuChinh = {
      id: r.id, on: r.effective_on, source: r.source, by: r.actor_name ?? null, reason: r.reason,
      before: { description: r.old_description ?? null, performer: r.old_perf_acc ?? r.old_performer_name ?? null, followupDue: r.old_followup_due ?? null,
        soBuoi: r.old_so_buoi ?? null, startedDate: r.old_started_date ?? null },
      after: { description: r.new_description ?? null, performer: r.new_perf_acc ?? r.new_performer_name ?? null, followupDue: r.new_followup_due ?? null,
        soBuoi: r.new_so_buoi ?? null, startedDate: r.new_started_date ?? null },
    };
    if (!out.has(r.intervention_id)) out.set(r.intervention_id, []);
    out.get(r.intervention_id)!.push(ban);
  }
  return out;
}
