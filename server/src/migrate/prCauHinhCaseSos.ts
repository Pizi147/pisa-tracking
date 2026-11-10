/**
 * CAU-HINH-CASE-SOS (chủ SP 11/11): con trỏ phiên bản `case_interventions.pb_loai`, `sos_coordination_actions.pb_moc` + chỉ mục một phần theo mã.
 * Bảng chung `cau_hinh_phien_ban` (+ chỉ mục, trigger tham chiếu) do QTV2-HAN tạo (`prCauHinhPhienBan`) — ở đây không tạo lần hai.
 * Bảng rỗng = bản gốc (đúng hằng số trong mã) → ngày đầu hành vi không đổi. DB dựng từ `schema.sql` đã có đủ → không làm gì. Chạy lặp không làm gì.
 */
import { CHI_MUC_MA } from '../platform/cauHinhCaseSos.ts';

export function migratePrCauHinhCaseSos(conn: any, applied: string[]): void {
  const lam: string[] = [];
  const coCot = (bang: string, cot: string) => (conn.prepare(`PRAGMA table_info(${bang})`).all() as any[]).some((c) => String(c.name).toLowerCase() === cot);
  const coBang = (bang: string) => !!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(bang);
  for (const [bang, cot] of [['case_interventions', 'pb_loai'], ['sos_coordination_actions', 'pb_moc']] as const) {
    if (coBang(bang) && !coCot(bang, cot)) { conn.exec(`ALTER TABLE ${bang} ADD COLUMN ${cot} INTEGER`); lam.push(`${bang}.${cot}`); }
  }
  /* Chỉ mục theo mã: đếm "Đang dùng" của mục Quản trị thêm đọc đúng dòng của mã. */
  for (const [ten, bang, cot, dk] of CHI_MUC_MA) {
    if (!coBang(bang) || !coCot(bang, dk.split(' ')[0]) || conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ?`).get(ten)) continue;
    conn.exec(`CREATE INDEX ${ten} ON ${bang}(${cot}) WHERE ${dk}`);
    lam.push(ten);
  }
  if (lam.length) applied.push(`CAU-HINH-CASE-SOS: ${lam.join(', ')} (con trỏ phiên bản; hành vi không đổi).`);
}
