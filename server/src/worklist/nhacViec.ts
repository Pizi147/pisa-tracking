/**
 * NHẮC (PR-Ra Q5) — Quản lý/Quản trị nhắc người phụ trách một dòng việc ở Hỗ trợ học viên.
 *
 * Không tin khoá/hạn gửi từ giao diện: tìm lại đúng dòng bằng cách dựng lại `myWork` của CHÍNH
 * người được nhắc rồi tra theo khoá — dữ liệu bịa hoặc đã đổi (việc đã xong, đã nhập điểm) thì
 * không còn khớp, và route trả 404 thay vì gửi một thông báo về một việc không còn tồn tại.
 */
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { forbidden, notFound } from '../util.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { can, loadPrincipal, scopeFor, type Principal } from '../permissions.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { myWork } from './mywork.ts';

const THAN_BAO_TOI_DA = 200;
const catThanBao = (s: string): string => (s.length <= THAN_BAO_TOI_DA ? s : `${s.slice(0, THAN_BAO_TOI_DA - 1)}…`);

export function nhacViec(p: Principal, i: { key: string; ownerId: number }): { daNhacLuc: string } {
  if (!can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true })) throw forbidden('Bạn chỉ xem được việc của mình.');
  if (p.userId === i.ownerId) throw forbidden('Không tự nhắc chính mình.');

  const target = loadPrincipal(i.ownerId);
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (!scope.all) {
    /*
     * KIỂM NHANH (trước khi dựng `myWork`): người được nhắc phải làm việc ở MỘT chi nhánh
     * trong phạm vi — rẻ, tránh tải dữ liệu vô ích cho giáo viên rõ ràng ngoài phạm vi. CHƯA
     * đủ: giáo viên dạy nhiều chi nhánh thì qua được kiểm này dù DÒNG cụ thể lại thuộc chi
     * nhánh khác (VD: QL Monbay, giáo viên dạy cả Monbay lẫn Bãi Cháy, dòng là lớp Bãi Cháy) —
     * kiểm đúng DÒNG bằng `can(..., ATTEMPT_VIEW, { classId, studentId })` ngay dưới mới là
     * chốt chặn thật.
     */
    const branches = db()
      .prepare(`SELECT DISTINCT branch_id FROM user_roles WHERE user_id = ? AND status = 'active' AND branch_id IS NOT NULL`)
      .all(i.ownerId) as any[];
    if (!branches.some((b) => scope.branchIds.includes(b.branch_id))) {
      throw forbidden('Giáo viên này không thuộc chi nhánh bạn quản lý.');
    }
  }

  const w = myWork(target) as any;
  const row = w.items.find((it: any) => it.key === i.key);
  if (!row) throw notFound(`Việc này không còn trong danh sách của ${target.fullName}.`);
  if (!can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: row.classId, studentId: row.studentId })) {
    throw forbidden('Dòng này không thuộc phạm vi bạn quản lý.');
  }

  const today = demoToday();
  const dedupKey = `nhac:${i.key}:${today}`;
  const existing = db()
    .prepare(`SELECT created_at FROM notifications WHERE user_id = ? AND dedup_key = ?`)
    .get(i.ownerId, dedupKey) as any;
  if (existing) return { daNhacLuc: existing.created_at };

  const body = catThanBao([row.studentName, row.contextLabel, row.reason].filter(Boolean).join(' · '));
  notify({
    userId: i.ownerId, kind: 'nhac_viec',
    title: `${row.actionLabel}${row.studentName ? ` · ${row.studentName}` : ''} · ${p.fullName} nhắc`,
    body, entityType: 'nhac_viec', entityId: null, dedupKey,
    /* PR-DUYET (K5-12): bấm chuông về đúng chỗ làm việc đó (hồ sơ HV / Ngăn Case), không phải trang Công việc chung. */
    duong: row.href ?? null,
  });
  writeAudit({ actorUserId: p.userId, action: 'work.remind', entityType: 'nhac_viec', entityId: null, entityLabel: i.key });

  const created = db()
    .prepare(`SELECT created_at FROM notifications WHERE user_id = ? AND dedup_key = ?`)
    .get(i.ownerId, dedupKey) as any;
  return { daNhacLuc: created.created_at };
}
