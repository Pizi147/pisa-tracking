/**
 * TUYEN-0 (N72 ①, chủ SP 26/11), chạy lặp không đổi, khớp `schema.sql`, chỉ THÊM (không đổi dữ liệu):
 *   1. Bảng `tuyen_bo_theo_doi` ("Bỏ theo dõi" cả tuyến — theo dõi theo tuyến suy ra khi đọc, không cần bù dữ liệu).
 *   2. Chỉ mục người làm bước (tab Đang theo dõi tìm tuyến người xem đã làm một bước — không quét cả bảng).
 */
import { BANG_BO_THEO_DOI_TUYEN } from '../yThuc/tuyen.ts';

export const CHI_MUC_TUYEN = [
  'CREATE INDEX IF NOT EXISTS idx_dm_tao_boi ON discipline_measures(created_by)',
  'CREATE INDEX IF NOT EXISTS idx_sca_lam_boi ON sos_coordination_actions(performed_by)',
  'CREATE INDEX IF NOT EXISTS idx_meeting_phan_xong_boi ON meeting_phan(xong_boi)',
  'CREATE INDEX IF NOT EXISTS idx_tinh_hinh_gui ON tinh_hinh_hoc_tap(nguoi_gui)',
  'CREATE INDEX IF NOT EXISTS idx_tra_lai_xong_boi ON vi_pham_tra_lai(xong_boi)',
];
const co = (conn: any, ten: string) => !!conn.prepare('SELECT 1 FROM sqlite_master WHERE name = ?').get(ten);

export function migratePrTuyen0(conn: any, applied: string[]) {
  if (!co(conn, 'users') || !co(conn, 'meeting_phan') || !co(conn, 'vi_pham_tra_lai') || !co(conn, 'tinh_hinh_hoc_tap')) return;
  const them: string[] = [];
  if (!co(conn, 'tuyen_bo_theo_doi')) { conn.exec(BANG_BO_THEO_DOI_TUYEN); them.push('bảng tuyen_bo_theo_doi'); }
  for (const c of CHI_MUC_TUYEN) {
    const ten = c.split(' ')[5];
    if (!co(conn, ten)) { conn.exec(c); them.push(ten); }
  }
  if (them.length) applied.push(`TUYEN-0: ${them.join(', ')}.`);
}
