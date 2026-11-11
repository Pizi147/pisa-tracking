/**
 * P13 KET-PET (plan.md 1.6 N18; plan `2026-10-26-p13-ket-pet.md`) — Target Cambridge của khoá KET / PET. Chạy mỗi lần (không còn gì thì không làm), đụng MỌI
 * lộ trình KET / PET kể cả khoá đã đóng; mỗi lộ trình một dòng nhật ký `cycle.update` (trước → sau, nguồn "migrate prKetPet") trong cùng `tx`:
 *   3. Bỏ dấu KCK (Target Cambridge không có KCK; Target giữ).   4. Target ngoài thang Cambridge (band cũ, số lẻ) → trống.
 * Bước 1–2 cũ (tách L+S, R+W → L · R · W · S, khoá `pr_ket_pet_at`) đã bỏ: chủ SP 13/11 đổi lại mặc định hai môn gộp — migrate `prMonCt1311`.
 */
import { tx } from '../db.ts';
import { voiNguon, writeAuditLo } from '../platform/audit.ts';
import { CHUONG_TRINH_LIEN_TUC_CO_SAN, kyThiCuaChuongTrinh } from '../../../shared/domain/index.ts';

const MA = CHUONG_TRINH_LIEN_TUC_CO_SAN.map((c) => c.code);         // PET, KET
const IN = (n: number) => Array(n).fill('?').join(',');
const coBang = (conn: any, b: string) => !!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(b);
const SQL_KCK = (ma: readonly string[]) => `FROM learning_cycles WHERE route IS NULL AND khong_cam_ket = 1 AND programme_code IN (${IN(ma.length)})`;
/** Target khoá KET / PET ngoài thang Cambridge của khoá (band cũ, số lẻ…) — không đọc được theo thang → để trống. */
const SQL_TARGET_SAI = () => `FROM learning_cycles WHERE route IS NULL AND target_score IS NOT NULL AND (${MA.map(() =>
  '(programme_code = ? AND (target_score < ? OR target_score > ? OR target_score != CAST(target_score AS INTEGER)))').join(' OR ')})`;
const THAM_TARGET_SAI = () => MA.flatMap((m) => [m, kyThiCuaChuongTrinh(m)!.min, kyThiCuaChuongTrinh(m)!.max]);

export const NGUON_PR_KET_PET = 'migrate prKetPet';

/** Bước 3–4: sửa từng lộ trình + MỘT dòng nhật ký `cycle.update` mỗi lộ trình (trước → sau, nguồn migrate) — cùng `tx`. */
function suaLoTrinh(conn: any, sql: string, tham: unknown[], cot: 'khong_cam_ket' | 'target_score', moi: number | null): number {
  const ds = conn.prepare(`SELECT id, student_id, programme_code, ${cot} AS cu ${sql}`).all(...tham) as any[];
  if (!ds.length) return 0;
  conn.prepare(`UPDATE learning_cycles SET ${cot} = ? WHERE id IN (SELECT id ${sql})`).run(moi, ...tham);
  voiNguon(NGUON_PR_KET_PET, () => writeAuditLo(ds.map((c) => ({
    actorUserId: null, action: 'cycle.update', entityType: 'learning_cycle', entityId: c.id,
    before: { [cot]: c.cu }, after: { [cot]: moi, kyThi: kyThiCuaChuongTrinh(c.programme_code)?.ma },
  }))));
  return ds.length;
}

export function migratePrKetPet(conn: any, applied: string[]) {
  if (!coBang(conn, 'programme_skills') || !coBang(conn, 'attempt_skills') || !coBang(conn, 'ket_qua_huy')) return;
  /* 3. KCK: Target Cambridge không có dấu KCK (chạy cả khi Quản trị đã sửa bộ môn; mọi khoá, kể cả đã đóng). */
  tx(() => {
    const n = suaLoTrinh(conn, SQL_KCK(MA), MA, 'khong_cam_ket', 0);
    if (n) applied.push(`P13 KET-PET: bỏ dấu KCK của ${n} lộ trình KET / PET (Target Cambridge không có KCK; Target giữ nguyên; nhật ký từng lộ trình).`);
  });
  /* 4. Target khoá KET / PET ngoài thang (band cũ…) → trống: không so được với điểm Cambridge; người nhập lại theo thang. */
  tx(() => {
    const n = suaLoTrinh(conn, SQL_TARGET_SAI(), THAM_TARGET_SAI(), 'target_score', null);
    if (n) applied.push(`P13 KET-PET: ${n} lộ trình KET / PET có Target ngoài thang Cambridge (band cũ / số lẻ) → để trống, nhập lại theo thang (nhật ký từng lộ trình).`);
  });
}
