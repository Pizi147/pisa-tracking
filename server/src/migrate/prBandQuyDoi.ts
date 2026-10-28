/**
 * BAND-QUY-DOI (chủ SP 28/10): thêm bảng `bang_quy_doi` (phiên bản bảng quy đổi số câu → band) — CHỈ trên DB chưa có bảng (bản chính trước PR):
 * tạo bảng + hai phiên bản: v1 = bảng trung tâm cũ (đúng số đang dùng), v2 = "Listening theo IDP" (quyết định chủ SP 28/10: 11–40 câu theo IDP,
 * 10 câu = 3.5 cho liền với 11–12 = 4, 0–9 giữ số cũ; Reading giữ nguyên — đã trùng IDP Academic). Điểm đã nhập giữ band đã lưu; điểm nhập sau
 * deploy dùng v2. DB dựng từ `schema.sql` (seed, phép kiểm) đã có bảng rỗng = bảng gốc → bước này không làm gì. Chạy lặp không làm gì.
 */
import { BANG_IDP, BANG_QUY_DOI_GOC } from '../../../shared/domain/index.ts';
import { DDL_BANG_QUY_DOI } from '../platform/bangQuyDoi.ts';
import { nowIso } from '../util.ts';

/** v2: Listening theo IDP (10 câu = 3.5; IDP không công bố → số cũ), Reading như cũ. */
export const BANG_L_IDP_28_10 = {
  listening: BANG_QUY_DOI_GOC.listening.map((v, n) => (n === 10 ? 3.5 : BANG_IDP.listening[n] ?? v)),
  reading: [...BANG_QUY_DOI_GOC.reading],
};

export function migratePrBandQuyDoi(conn: any, applied: string[]) {
  if (conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'bang_quy_doi'`).get()) return;
  conn.exec(DDL_BANG_QUY_DOI);
  const them = conn.prepare('INSERT INTO bang_quy_doi (listening, reading, ly_do, tao_luc) VALUES (?,?,?,?)');
  const luc = nowIso();
  for (const [b, lyDo] of [
    [BANG_QUY_DOI_GOC, 'Bảng trung tâm (sheet "Bang quy doi") — dùng tới 28/10/2026'],
    [BANG_L_IDP_28_10, 'Listening theo IDP — quyết định chủ SP 28/10'],
  ] as const) them.run(JSON.stringify(b.listening), JSON.stringify(b.reading), lyDo, luc);
  applied.push('BAND-QUY-DOI: bảng quy đổi band ở DB — v1 bảng cũ, v2 Listening theo IDP (điểm đã nhập giữ band, điểm nhập sau dùng v2).');
}
