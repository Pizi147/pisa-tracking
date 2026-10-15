import { db, tx } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, loi, notFound, nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { caseAccess, caseDetail, kiemQuyenPa, loadCase, recordIntervention } from './cases.ts';
import { choDoiPa, dongBoTrangThaiCase, sosCaseState } from './sosState.ts';
import { DOI_PA_TOI_THIEU, INTERVENTION_KIND_LABEL, LOAI_PA_DOI, laPaMacDinh, type InterventionKind } from '../../../shared/domain/index.ts';

/**
 * ĐỀ XUẤT PA KHÁC (OV-13b, mockup OV-13 §8–§9) — PA mặc định (quy chế chưa / đã xác nhận · Bổ trợ) đổi sang loại khác qua Quản lý duyệt. Dùng lại
 * thẻ "Đề xuất PA" (`de_xuat_pa`, đối tượng = PA MỚI chờ duyệt) + `du_lieu.thayPaId`; PA gốc `superseded_by` = PA mới tới khi trả lời (`CHO_DOI_PA`):
 *   · gửi lúc Xác nhận PA → PA gốc CHỜ (chưa chạy), Case "Chờ duyệt đổi PA", việc Xác nhận PA rời danh sách GV;
 *   · gửi khi PA đang chạy → PA gốc vẫn chạy (ghi kết quả như thường);
 *   · Duyệt → PA mới chạy từ ngày duyệt (`respondToPlan`), PA gốc "Đã kết thúc · Đổi PA" (`closed_reason = 'doi_pa'`);
 *   · Từ chối (lý do) / người gửi Rút → PA gốc như trước (việc Xác nhận PA quay lại kèm lý do từ chối).
 * Quyền: người xác nhận được PA gốc (chưa chạy) / ghi kết quả được PA gốc (đang chạy); duyệt: Quản lý (`respondToPlan`).
 */
export type VaoDoiPa = {
  kind?: unknown; description?: unknown; lyDo?: unknown; soBuoi?: unknown;
  performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null;
};
export type DuLieuDoiPa = { thayPaId: number; lyDo: string; goc: { kind: string; chay: boolean }; followupId?: number | null };

/** Kiểm (không ghi): PA gốc mở, là PA mặc định, chưa có đề xuất chờ; quyền; loại mới; lý do ≥ 10. Trả PA gốc + Case + lý do đã gọn. */
function kiemDoiPa(p: Principal, goc: any, v: VaoDoiPa) {
  if (!goc) throw notFound('Không tìm thấy phương án.');
  const c = loadCase(goc.case_id);
  const chuaChay = goc.preset === 1 && !goc.confirmed_at && goc.status === 'planned';
  if (chuaChay) caseAccess(goc.case_id).requireEdit(p, 'Bạn chỉ đề xuất đổi PA của kỹ năng mình được phân công (hoặc là Quản lý trong phạm vi).');
  else kiemQuyenPa(p, goc, c, 'Bạn không có quyền đề xuất đổi PA này.');
  if (c.status === 'done') throw badRequest('Case đã đóng — không đề xuất đổi PA được.');
  if (!laPaMacDinh(goc)) throw badRequest('Chỉ PA mặc định (quy chế, Bổ trợ) mới đề xuất đổi qua Quản lý — PA khác Điều chỉnh / Thay trực tiếp.');
  if (goc.status !== 'planned' && goc.status !== 'started') throw badRequest('PA này đã kết thúc — không đổi được.');
  if (goc.kind === 'bo_tro' && goc.status === 'planned') throw badRequest('PA Bổ trợ chưa chạy — Xác nhận Case trước.');
  if (choDoiPa(goc)) throw badRequest('PA này đang chờ Quản lý duyệt đổi PA — Rút đề xuất cũ rồi gửi lại.');
  if (chuaChay && !sosCaseState(goc.case_id).hasCause) throw badRequest('Ghi nhận xét (nguyên nhân) trước, rồi mới đề xuất PA khác.');
  const kind = String(v.kind ?? '');
  if (!(LOAI_PA_DOI as readonly string[]).includes(kind)) throw badRequest('Chọn loại PA mới.');
  if (kind === goc.kind) throw badRequest('PA mới phải khác loại PA hiện tại.');
  const lyDo = typeof v.lyDo === 'string' ? v.lyDo.trim() : '';
  if (lyDo.length < DOI_PA_TOI_THIEU) throw loi(400, 'Lý do đổi PA cần ít nhất {n} ký tự.', { n: DOI_PA_TOI_THIEU });
  if (lyDo.length > 1000) throw badRequest('Lý do đổi PA tối đa 1000 ký tự.');
  return { c, chuaChay, kind, lyDo };
}

/** Kiểm trước giao dịch của `updateResult` (PA gốc = PA đang ghi kết quả). */
export function kiemTruocDoiPa(p: Principal, goc: any, v: VaoDoiPa): void { kiemDoiPa(p, goc, v); }

/** Gửi đề xuất — gọi TRONG hoặc NGOÀI giao dịch (lần ghi kết quả + đề xuất một nút gọi trong tx của `updateResult`). Trả id PA mới. */
export function ghiDoiPa(p: Principal, gocId: number, v: VaoDoiPa, followupId: number | null = null): number {
  const conn = db();
  return tx(() => {
    /* Đọc + kiểm TRONG giao dịch ghi: hai lần bấm cùng lúc thì lần sau thấy đề xuất của lần trước (`CHO_DOI_PA`) → 400, không hai thẻ. */
    const goc = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(gocId) as any;
    const { chuaChay, kind, lyDo } = kiemDoiPa(p, goc, v);
    const duLieu: DuLieuDoiPa = { thayPaId: gocId, lyDo, goc: { kind: goc.kind, chay: !chuaChay }, followupId };
    recordIntervention(p, goc.case_id, {
      kind, description: typeof v.description === 'string' ? v.description : null, soBuoi: v.soBuoi,
      performerSelf: v.performerSelf, performerUserId: v.performerUserId ?? null, performerName: v.performerName ?? null,
      needsApproval: true, status: 'planned', thayThe: true, doiPa: duLieu,
    }, { daKiemQuyen: true, khongTraCase: true });
    const moi = (conn.prepare('SELECT superseded_by FROM case_interventions WHERE id = ?').get(gocId) as any).superseded_by as number;
    writeAudit({ actorUserId: p.userId, action: 'case.plan.doi_pa', entityType: 'case_intervention', entityId: gocId,
      entityLabel: goc.description ?? goc.kind, after: { paMoi: moi, kind, lyDo } });
    return moi;
  });
}

/** `POST /interventions/:id/de-xuat-doi-pa` — kiểm cả trước khi mở giao dịch (lỗi nhập không xin khoá ghi). */
export function deXuatDoiPa(p: Principal, gocId: number, v: VaoDoiPa) {
  kiemDoiPa(p, db().prepare('SELECT * FROM case_interventions WHERE id = ?').get(gocId), v);
  ghiDoiPa(p, gocId, v);
  return caseDetail(p, (db().prepare('SELECT case_id FROM case_interventions WHERE id = ?').get(gocId) as any).case_id);
}

/** Đọc `du_lieu` thẻ — `null` khi thẻ là Đề xuất PA thường (không đổi PA). */
export function duLieuDoiPa(yc: { du_lieu?: string | null }): DuLieuDoiPa | null {
  try { const d = JSON.parse(yc.du_lieu ?? 'null'); return d && Number.isInteger(d.thayPaId) ? d : null; } catch { return null; }
}

/**
 * HỆ QUẢ lên PA gốc sau khi thẻ đổi PA được trả lời — gọi TRONG giao dịch của hộp, SAU `respondToPlan` / huỷ PA mới.
 *   · `duyet`: PA gốc khép "Đổi PA" (ngày duyệt) · `tra`: PA gốc thôi trỏ PA mới (từ chối / rút) · `huy`: Huỷ quyết định trong ngày — PA gốc về chờ.
 */
export function apDungDoiPa(yc: { du_lieu?: string | null; doi_tuong_id: number }, kieu: 'duyet' | 'tra' | 'huy'): void {
  const d = duLieuDoiPa(yc);
  if (!d) return;
  const conn = db();
  const goc = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(d.thayPaId) as any;
  if (!goc) return;
  if (kieu === 'duyet') {
    conn.prepare(`UPDATE case_interventions SET status = 'completed', completed_date = ?, closed_reason = 'doi_pa', superseded_by = ?, updated_at = ? WHERE id = ?`)
      .run(demoToday(), yc.doi_tuong_id, nowIso(), goc.id);
  } else if (kieu === 'tra') {
    conn.prepare('UPDATE case_interventions SET superseded_by = NULL, updated_at = ? WHERE id = ? AND superseded_by = ? AND closed_reason IS NULL')
      .run(nowIso(), goc.id, yc.doi_tuong_id);
  } else {
    /* PA gốc về đúng như lúc gửi: chưa chạy (quy chế chưa xác nhận) / đang chạy; vẫn trỏ PA mới (thẻ chờ lại). */
    conn.prepare(`UPDATE case_interventions SET status = ?, completed_date = NULL, closed_reason = NULL, superseded_by = ?, updated_at = ? WHERE id = ?`)
      .run(d.goc.chay ? 'started' : 'planned', yc.doi_tuong_id, nowIso(), goc.id);
  }
  dongBoTrangThaiCase(goc.case_id);
}

/** Người gửi Rút thẻ đổi PA: PA mới huỷ (chưa từng chạy), PA gốc như trước. Trong giao dịch của `rutYeuCau`. */
export function rutDoiPa(yc: { du_lieu?: string | null; doi_tuong_id: number }): void {
  const conn = db();
  conn.prepare(`UPDATE case_interventions SET status = 'cancelled', closed_reason = 'dismissed', updated_at = ? WHERE id = ? AND approval_state = 'pending'`)
    .run(nowIso(), yc.doi_tuong_id);
  apDungDoiPa(yc, 'tra');
  const c = conn.prepare('SELECT case_id FROM case_interventions WHERE id = ?').get(yc.doi_tuong_id) as any;
  if (c) dongBoTrangThaiCase(c.case_id);
}

/** Tên loại PA cho thẻ / dòng. */
export const tenLoaiPa = (kind: string) => INTERVENTION_KIND_LABEL[kind as InterventionKind] ?? kind;
