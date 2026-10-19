/**
 * THÔNG BÁO TỰ ĐỘNG THAY NHẮC (OV-15d, C03; thiết kế OV-14 mục 3.4). Ba sự kiện:
 *   · bài quá hạn chấm của CHÍNH GV — một thông báo mỗi lớp · đợt (một việc Nhập điểm của `myWork` = lớp · tuần thi · người giữ);
 *   · Case chưa chốt PA quá hạn — người giữ việc kế của Case (Xác nhận Case / nhận xét / Thêm PA / Xác nhận PA);
 *   · Chốt lộ trình tới hạn (hạn trong tuần này hoặc đã qua) — Quản lý đang xem việc đó (việc cả lớp, không gán người).
 * Nguồn là CHÍNH danh sách việc (`myWork().items`) — không đếm lại, chỉ thêm một câu đọc thông báo đang có.
 * Dedup theo (người, đối tượng); việc xong → thông báo của người xem tự xoá ở lần tải Công việc kế (`day`). Không email / push.
 */
import { chenNhieuDong, db, tx } from '../db.ts';
import { laViecChamCheo } from '../../../shared/domain/index.ts';
import { mondayOf } from '../platform/week.ts';
import { addDays, nowIso } from '../util.ts';
import type { WorkItem } from './mywork.ts';

export const LOAI_THONG_BAO_VIEC = ['qua_han_cham', 'case_chua_chot_pa', 'chot_lo_trinh'] as const;

export type ThongBaoViec = {
  userId: number; kind: (typeof LOAI_THONG_BAO_VIEC)[number]; dedupKey: string; title: string; body: string;
  duong: string; entityType: string; entityId: number | null;
};

/** Việc của Case chưa chốt PA (Case trống PA · chờ xác nhận / nhận xét · PA chờ xác nhận) — PA chờ duyệt đổi là thẻ của QL (hộp Chờ duyệt). */
const VIEC_CASE_CHUA_CHOT = new Set(['cause', 'ghi_nhan_xet', 'xac_nhan_pa', 'no_plan']);
const han = (iso: string | null) => (iso ? `hạn ${iso.slice(8, 10)}/${iso.slice(5, 7)}` : null);

export function thongBaoTuViec(items: readonly WorkItem[], o: { nguoiXem: number; laQuanLy: boolean; homNay: string }): ThongBaoViec[] {
  const cuoiTuan = addDays(mondayOf(o.homNay), 6);
  const out = new Map<string, ThongBaoViec>();
  const them = (x: ThongBaoViec) => { const k = `${x.userId}|${x.dedupKey}`; if (!out.has(k)) out.set(k, x); };
  for (const it of items) {
    const duong = `/cong-viec?viec=${encodeURIComponent(it.key)}`;
    if (it.group === 'score' && it.urgency === 'overdue' && it.ownerId && !laViecChamCheo(it)) {
      them({
        userId: it.ownerId, kind: 'qua_han_cham', dedupKey: `td:cham:${it.key}`,
        title: `Quá hạn chấm · ${it.classCode ?? it.studentName} · ${it.contextLabel ?? ''}`.trim(),
        body: [it.reason, it.soBai ? `${it.soBai} bài` : null, han(it.due)].filter(Boolean).join(' · '),
        duong, entityType: 'class', entityId: it.classId,
      });
    } else if (VIEC_CASE_CHUA_CHOT.has(it.group) && it.urgency === 'overdue' && it.ownerId && it.caseId) {
      them({
        userId: it.ownerId, kind: 'case_chua_chot_pa', dedupKey: `td:case:${it.caseId}`,
        title: `Case chưa chốt PA quá hạn · ${it.studentName}`,
        body: [it.classCode, it.tieuDe, han(it.due)].filter(Boolean).join(' · '),
        duong, entityType: 'sos_case', entityId: it.caseId,
      });
    } else if (it.group === 'chot_len_ft' && o.laQuanLy && it.due && it.due <= cuoiTuan && it.classId) {
      them({
        userId: o.nguoiXem, kind: 'chot_lo_trinh', dedupKey: `td:chot:${it.classId}`,
        title: `Chốt lộ trình · ${it.classCode}`, body: [it.contextLabel, han(it.due)].filter(Boolean).join(' · '),
        duong, entityType: 'class', entityId: it.classId,
      });
    }
  }
  return [...out.values()];
}

/**
 * Ghi thông báo còn thiếu (một câu đọc + ghi chỉ khi có thay đổi). `day`: `ds` là ĐỦ việc của người xem (không lọc chi nhánh / người) — thông báo
 * tự động của người xem không còn trong `ds` là việc đã xong → xoá. Thông báo của người khác chỉ thêm, không xoá (họ tự dọn ở lần tải của họ).
 */
export function dongBoThongBaoViec(ds: readonly ThongBaoViec[], o: { nguoiXem: number; day: boolean }): void {
  const nguoi = [...new Set([...ds.map((x) => x.userId), ...(o.day ? [o.nguoiXem] : [])])];
  if (!nguoi.length) return;
  const loai = LOAI_THONG_BAO_VIEC.map(() => '?').join(',');
  const co = db().prepare(
    `SELECT id, user_id, dedup_key FROM notifications WHERE user_id IN (${nguoi.map(() => '?').join(',')}) AND kind IN (${loai})`,
  ).all(...nguoi, ...LOAI_THONG_BAO_VIEC) as { id: number; user_id: number; dedup_key: string }[];
  const daCo = new Set(co.map((r) => `${r.user_id}|${r.dedup_key}`));
  const con = new Set(ds.map((x) => `${x.userId}|${x.dedupKey}`));
  const moi = ds.filter((x) => !daCo.has(`${x.userId}|${x.dedupKey}`));
  const xong = o.day ? co.filter((r) => r.user_id === o.nguoiXem && !con.has(`${r.user_id}|${r.dedup_key}`)).map((r) => r.id) : [];
  if (!moi.length && !xong.length) return;
  tx(() => {
    /* Một câu cho cả lô (không một câu mỗi thông báo — số câu không tăng theo dữ liệu); trùng khoá (request song song) → bỏ qua. */
    const luc = nowIso();
    chenNhieuDong('INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, created_at, duong)',
      moi.map((x) => [x.userId, x.kind, x.title, x.body, x.entityType, x.entityId, x.dedupKey, luc, x.duong]), ' ON CONFLICT(user_id, dedup_key) DO NOTHING');
    if (xong.length) db().prepare(`DELETE FROM notifications WHERE id IN (${xong.map(() => '?').join(',')})`).run(...xong);
  });
}
