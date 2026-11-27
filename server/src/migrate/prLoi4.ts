/**
 * LOI-4 (chủ SP 28/11, câu 5) — chạy lặp không đổi gì: lệnh chuyển lớp đã báo PH rồi sửa sang Bảo lưu / Dừng học (không lớp đích) KHÔNG còn việc TVV
 * "Báo lại · Huỷ chuyển lớp". Việc như vậy đã sinh theo luật cũ, CHƯA ai ghi, còn mở → đóng lý do hệ thống `system_lenh_huy` (khôi phục lệnh về "Từ tuần" thì
 * `dongBoLienPhongLenh` xử lý như việc tự đóng). Việc đã ghi một lần: giữ.
 * + Lỗi nghi C8 (Trao đổi gia đình thêm sau Meeting): lượt có việc TVV Trao đổi gia đình ĐANG MỞ mà Báo PH Meeting của cùng lượt cũng còn mở (đã ghi "chưa liên hệ được"
 * nên luật cũ không gộp) → gộp như `dongBoViecTvvLuot` (`system_gop_trao_doi`). Nhật ký: số việc theo mã chi nhánh (không tên).
 */
import { CHI_NHANH_EM } from '../yThuc/baoPhTvv.ts';

const co = (conn: any, ten: string) => !!conn.prepare('SELECT 1 FROM sqlite_master WHERE name = ?').get(ten);

export function migratePrLoi4(conn: any, applied: string[]): void {
  baoLaiBaoLuu(conn, applied);
  gopMeetingDoi(conn, applied);
}

const demCn = (ds: { cn: string | null }[]) => {
  const theoCn = new Map<string, number>();
  for (const r of ds) theoCn.set(r.cn ?? '?', (theoCn.get(r.cn ?? '?') ?? 0) + 1);
  return [...theoCn].map(([k, n]) => `${k} ${n}`).join(' · ');
};

function baoLaiBaoLuu(conn: any, applied: string[]): void {
  if (!co(conn, 'viec_bao_ph') || !co(conn, 'lenh_chuyen_lop') || !conn.prepare(`SELECT 1 FROM pragma_table_info('viec_bao_ph') WHERE name = 'lenh_mau'`).get()) return;
  const ds = conn.prepare(`SELECT v.id, b.code AS cn FROM viec_bao_ph v JOIN lenh_chuyen_lop l ON l.id = v.lenh_chuyen_id JOIN students s ON s.id = v.student_id
      LEFT JOIN branches b ON b.id = ${CHI_NHANH_EM}
     WHERE v.trang_thai = 'mo' AND v.lenh_mau = 'huy' AND l.lop_dich_id IS NULL AND l.trang_thai != 'huy'
       AND NOT EXISTS (SELECT 1 FROM viec_bao_ph_lan x WHERE x.viec_id = v.id)`).all() as { id: number; cn: string | null }[];
  if (!ds.length) return;
  conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = 'system_lenh_huy', bo_boi = NULL, bo_luc = ? WHERE trang_thai = 'mo' AND id IN (SELECT value FROM json_each(?))`)
    .run(new Date().toISOString(), JSON.stringify(ds.map((r) => r.id)));
  applied.push(`LOI-4: ${ds.length} việc "Báo lại · Huỷ chuyển lớp" của lệnh đã sửa sang Bảo lưu / Dừng học → đóng (${demCn(ds)}).`);
}

function gopMeetingDoi(conn: any, applied: string[]): void {
  if (!co(conn, 'viec_bao_ph') || !co(conn, 'sos_coordination_actions')) return;
  const ds = conn.prepare(`SELECT v.id, b.code AS cn FROM viec_bao_ph v JOIN sos_coordination_actions m ON m.id = v.phoi_hop_id AND m.kind IN ('cx_meeting_student', 'cx_meeting_family')
      JOIN students s ON s.id = v.student_id LEFT JOIN branches b ON b.id = ${CHI_NHANH_EM}
     WHERE v.trang_thai = 'mo' AND EXISTS (SELECT 1 FROM sos_coordination_actions t JOIN viec_bao_ph tv ON tv.phoi_hop_id = t.id AND tv.trang_thai = 'mo'
       WHERE t.attempt_id = m.attempt_id AND t.kind = 'talk_family')`).all() as { id: number; cn: string | null }[];
  if (!ds.length) return;
  conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = 'system_gop_trao_doi', bo_boi = NULL, bo_luc = ? WHERE trang_thai = 'mo' AND id IN (SELECT value FROM json_each(?))`)
    .run(new Date().toISOString(), JSON.stringify(ds.map((r) => r.id)));
  applied.push(`LOI-4 (C8): ${ds.length} việc Báo PH Meeting còn mở cạnh việc Trao đổi gia đình đang mở → gộp (${demCn(ds)}).`);
}
