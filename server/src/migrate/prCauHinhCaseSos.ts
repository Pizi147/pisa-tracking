/**
 * CAU-HINH-CASE-SOS (chủ SP 11/11): bảng `cau_hinh_phien_ban` (dùng chung với các mục cấu hình Quản trị khác) + con trỏ phiên bản
 * `case_interventions.pb_loai`, `sos_coordination_actions.pb_moc` + trigger tham chiếu (nhớ theo tiến trình). KHÔNG chèn dòng: bảng rỗng = bản gốc
 * (đúng hằng số trong mã) → ngày đầu hành vi không đổi. DB dựng từ `schema.sql` (seed, phép kiểm) đã có đủ → không làm gì. Chạy lặp không làm gì.
 */
import { CHI_MUC_MA, DDL_CAU_HINH_PHIEN_BAN, DDL_CAU_HINH_PHIEN_BAN_IDX } from '../platform/cauHinhCaseSos.ts';
import { TRIGGER_THAM_CHIEU } from './prTlNen.ts';

export function migratePrCauHinhCaseSos(conn: any, applied: string[]): void {
  const lam: string[] = [];
  if (!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'cau_hinh_phien_ban'`).get()) {
    conn.exec(DDL_CAU_HINH_PHIEN_BAN);
    lam.push('bảng cau_hinh_phien_ban');
  }
  conn.exec(DDL_CAU_HINH_PHIEN_BAN_IDX);
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
  /* DB cũ chưa có `moc_he_thong` (trước TL-NEN): trigger để TL-NEN tạo (nó chạy sau, tạo đủ TRIGGER_THAM_CHIEU). */
  const coMoc = coBang('moc_he_thong');
  for (const t of TRIGGER_THAM_CHIEU.filter((x) => coMoc && x.ten.startsWith('tg_tc_cau_hinh_phien_ban_'))) {
    if (conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'trigger' AND name = ?`).get(t.ten)) continue;
    conn.exec(t.sql);
    lam.push(t.ten);
  }
  if (lam.length) applied.push(`CAU-HINH-CASE-SOS: ${lam.join(', ')} (bảng rỗng = bản gốc, hành vi không đổi).`);
}
