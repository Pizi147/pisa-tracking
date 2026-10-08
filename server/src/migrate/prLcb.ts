/**
 * PR-LCb (kế hoạch .superpowers/sdd/lcb/plan.md B3.3): cột `lo_trinh_tiep_theo.huong_gvcn` — Hướng GVCN đề xuất, để cột "Gợi ý · GVCN" còn
 * thấy sau khi quyết định của Quản lý ghi đè `huong`. CHỈ THÊM CỘT + điền bù MỘT câu (phán quyết R-B1): dòng của em KHÔNG có lệnh cuối khoá
 * đang chờ ở lớp đó → `huong_gvcn = huong` (Hướng đó là của GVCN, kể cả khi GVCN đã đổi người). Em có lệnh chờ: để trống — Hướng có thể đã
 * là của Quản lý (không bao giờ chép hướng QL thành đề xuất GVCN). Chạy TRƯỚC `migratePrLc` (migrate.ts). Chạy lặp được: điền bù chỉ chạy
 * ngay khi vừa thêm cột (lần hai không còn gì để làm, không đè dữ liệu GVCN ghi sau đó).
 */
export function migratePrLcb(conn: any, applied: string[]) {
  const cot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('lo_trinh_tiep_theo') as any[]).map((c) => c.name);
  if (!cot.length || cot.includes('huong_gvcn')) return;
  conn.exec('ALTER TABLE lo_trinh_tiep_theo ADD COLUMN huong_gvcn TEXT');
  const r = conn.prepare(
    `UPDATE lo_trinh_tiep_theo SET huong_gvcn = huong
      WHERE huong_gvcn IS NULL AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = lo_trinh_tiep_theo.student_id
        AND l.lop_nguon_id = lo_trinh_tiep_theo.class_id AND l.boi_canh = 'cuoi-khoa' AND l.trang_thai = 'cho')`,
  ).run();
  applied.push(`PR-LCb: thêm cột lo_trinh_tiep_theo.huong_gvcn (đề xuất GVCN)${r.changes ? `, điền bù ${r.changes} dòng chưa có quyết định` : ''}.`);
}
