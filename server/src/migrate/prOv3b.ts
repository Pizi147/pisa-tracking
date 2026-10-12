import { tx } from '../db.ts';

/**
 * OV-3b (kế hoạch `2026-10-11-pr-ov3b-lo-trinh-kqdr-ban-giao.md`, chạy lặp được):
 * (a) bảng `lo_trinh_nhap` + cột đề xuất Kết quả đầu ra (`lo_trinh_tiep_theo.kq_de_xuat_*`) + `ban_giao_mon.lam_lai` — chỉ thêm.
 * (b) Lộ trình tiếp theo có Hướng (≠ Chưa quyết) mà em CHƯA có lệnh chờ / đã chuyển ở lớp đó, chưa áp dụng, lớp còn chạy → chép thành nháp
 *     (QL không mất việc GVCN đã ghi). Chỉ chạy NGAY khi vừa tạo bảng (khuôn `prLcb.ts`): lần sau không chép lại nháp QL đã xoá.
 *     Không xoá LTT, không đụng MT0 đã có. DB dựng từ `schema.sql` đã có bảng → không chép (GVCN chưa từng ghi theo luật mới).
 */
/** LTT sẽ thành nháp — dùng chung với lệnh chỉ đọc `kiem-truoc-ov3b`. */
export const LTT_THANH_NHAP_SQL = `FROM lo_trinh_tiep_theo t JOIN classes c ON c.id = t.class_id
  WHERE t.huong IN ('len_lop', 'hoc_lai', 'fast_track', 'bao_luu', 'dung_hoc') AND t.da_ap_dung_luc IS NULL AND c.status = 'active' AND c.is_fast_track = 0
    AND EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = t.student_id AND e.class_id = t.class_id AND e.status = 'active')
    AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = t.student_id AND l.lop_nguon_id = t.class_id AND l.trang_thai IN ('cho', 'da_chuyen'))`;
export function migratePrOv3b(conn: any, applied: string[]) {
  const cot = (bang: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).map((c) => c.name as string);
  const ltt = cot('lo_trinh_tiep_theo');
  if (!ltt.length) return;
  tx(() => {
    const moTao = !cot('lo_trinh_nhap').length;
    if (moTao) {
      conn.exec(`CREATE TABLE lo_trinh_nhap (
        id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students(id), class_id INTEGER NOT NULL REFERENCES classes(id),
        huong TEXT NOT NULL, lop_dich_id INTEGER REFERENCES classes(id),
        tuan TEXT, muc_tieu REAL, khong_cam_ket INTEGER NOT NULL DEFAULT 0, ngay_xem_lai TEXT, ghi_chu TEXT,
        sua_boi INTEGER REFERENCES users(id), sua_luc TEXT NOT NULL, UNIQUE (student_id, class_id))`);
      conn.exec('CREATE INDEX idx_ltn_class ON lo_trinh_nhap(class_id)');
      applied.push('OV-3b: tạo bảng lo_trinh_nhap (nháp lộ trình của Quản lý).');
    }
    const them = [['kq_de_xuat_dat', 'INTEGER'], ['kq_de_xuat_nguyen_nhan', 'TEXT'], ['kq_de_xuat_mon', 'TEXT'], ['kq_de_xuat_ghi_chu', 'TEXT'],
      ['kq_de_xuat_boi', 'INTEGER REFERENCES users(id)'], ['kq_de_xuat_luc', 'TEXT']].filter(([c]) => !ltt.includes(c));
    for (const [c, kieu] of them) conn.exec(`ALTER TABLE lo_trinh_tiep_theo ADD COLUMN ${c} ${kieu}`);
    if (them.length) applied.push('OV-3b: thêm cột đề xuất Kết quả đầu ra của GVCN (lo_trinh_tiep_theo.kq_de_xuat_*).');
    const bgm = cot('ban_giao_mon');
    if (bgm.length && !bgm.includes('lam_lai')) {
      conn.exec('ALTER TABLE ban_giao_mon ADD COLUMN lam_lai INTEGER NOT NULL DEFAULT 0');
      applied.push('OV-3b: thêm cột ban_giao_mon.lam_lai (phiếu cần làm lại).');
    }
    if (!moTao) return;
    const r = conn.prepare(
      `INSERT OR IGNORE INTO lo_trinh_nhap (student_id, class_id, huong, lop_dich_id, muc_tieu, ngay_xem_lai, ghi_chu, sua_boi, sua_luc)
       SELECT t.student_id, t.class_id, t.huong, t.lop_du_kien_id, t.muc_tieu, t.ngay_xem_lai, t.ghi_chu, t.updated_by, t.updated_at ${LTT_THANH_NHAP_SQL}`,
    ).run();
    if (r.changes) applied.push(`OV-3b: chép ${r.changes} Lộ trình tiếp theo chưa có quyết định thành nháp của Quản lý.`);
  });
}
