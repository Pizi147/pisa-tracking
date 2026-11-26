/**
 * LUU-TRU-DONG (chủ SP 26/11 "vào Lưu trữ thì mọi việc dứt luôn") — ĐỔI DỮ LIỆU MỘT LẦN lúc deploy: em ĐANG trong Lưu trữ mà còn việc mở (Case / PA, Phối hợp SOS,
 * Meeting, Báo PH, Tình hình, Trả lại) → đóng như lúc vào Lưu trữ từ nay (`dongViecLuuTru`). Mỗi em một dòng nhật ký `student.luu_tru_dong` giữ id đã đóng →
 * `khoiPhucLuuTruDong` trả lại. Khoá `demo_config`; hàm đổi chạy lại không đổi gì (không còn việc mở).
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { dongViecLuuTru, moLaiViecLuuTru } from '../students/dongLuuTru.ts';

export const KHOA_LUU_TRU_DONG = 'pr_luu_tru_dong_da_chay';
const VIEC = 'student.luu_tru_dong';

/** Em đang Lưu trữ còn việc mở — CHỈ ĐỌC. */
export function emLuuTruConViec(conn: any): number[] {
  return (conn.prepare(`SELECT s.id FROM students s WHERE s.archived_at IS NOT NULL AND (
      EXISTS (SELECT 1 FROM sos_cases c WHERE c.student_id = s.id AND c.status != 'done')
      OR EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.student_id = s.id AND x.status = 'pending')
      OR EXISTS (SELECT 1 FROM viec_bao_ph b WHERE b.student_id = s.id AND b.trang_thai = 'mo')
      OR EXISTS (SELECT 1 FROM tinh_hinh_hoc_tap t WHERE t.student_id = s.id AND t.trang_thai = 'mo')
      OR EXISTS (SELECT 1 FROM vi_pham_tra_lai r WHERE r.student_id = s.id AND r.trang_thai = 'mo')) ORDER BY s.id`).all() as any[]).map((r) => r.id as number);
}

/** Đóng — không khoá (phép kiểm gọi thẳng). Trả số việc đã đóng theo loại. */
export function dongLuuTruCu(conn: any): { em: number; case: number; phoiHop: number; meeting: number; baoPh: number; tinhHinh: number; traLai: number } {
  const ngay = demoToday();
  const kq = { em: 0, case: 0, phoiHop: 0, meeting: 0, baoPh: 0, tinhHinh: 0, traLai: 0 };
  const ls = conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)
    VALUES (NULL, '${VIEC}', 'student', ?, 'migrate', NULL, ?, ?)`);
  for (const sid of emLuuTruConViec(conn)) {
    const d = dongViecLuuTru(null, sid, ngay, true);
    ls.run(sid, JSON.stringify({ dongLuuTru: d }), nowIso());
    kq.em++; kq.case += d.case.length; kq.phoiHop += d.phoiHop.length; kq.meeting += d.meeting.length; kq.baoPh += d.baoPh.length; kq.tinhHinh += d.tinhHinh.length; kq.traLai += d.traLai.length;
  }
  return kq;
}

/** Khôi phục theo nhật ký (chỉ dòng còn mang dấu hệ thống); dòng nhật ký đổi `…_khoi_phuc` để không trả hai lần. Bí danh cột (#1198). Trả id em. */
export function khoiPhucLuuTruDong(conn: any): number[] {
  const ra: number[] = [];
  for (const h of conn.prepare(`SELECT id AS id, entity_id AS sid, after_json AS sau FROM audit_logs WHERE action = '${VIEC}' ORDER BY id DESC`).all() as any[]) {
    moLaiViecLuuTru(null, h.sid, JSON.parse(h.sau).dongLuuTru);
    conn.prepare(`UPDATE audit_logs SET action = '${VIEC}_khoi_phuc' WHERE id = ?`).run(h.id);
    ra.push(h.sid);
  }
  return ra;
}

export function migratePrLuuTruDong(conn: any, applied: string[]) {
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_LUU_TRU_DONG)) return;
  const k = dongLuuTruCu(conn);
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_LUU_TRU_DONG, demoToday(), nowIso());
  if (k.em) applied.push(`LUU-TRU-DONG: ${k.em} em đang Lưu trữ — đóng ${k.case} Case, ${k.phoiHop} Phối hợp, ${k.meeting} Meeting, ${k.baoPh} Báo PH, ${k.tinhHinh} Tình hình, ${k.traLai} Trả lại (khôi phục: khoiPhucLuuTruDong).`);
}
