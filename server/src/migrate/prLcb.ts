/**
 * PR-LCb (kế hoạch .superpowers/sdd/lcb/plan.md B3.3): cột `lo_trinh_tiep_theo.huong_gvcn` — Hướng GVCN đề xuất, để cột "Gợi ý · GVCN" còn
 * thấy sau khi quyết định của Quản lý ghi đè `huong`. CHỈ THÊM CỘT + điền bù MỘT câu: dòng do GVCN đang hiệu lực của lớp ghi lần cuối
 * (`updated_by`) → `huong_gvcn = huong`. Dòng đã bị lệnh ghi đè (updated_by = Quản lý) không khôi phục được. Chạy lặp được: điền bù chỉ
 * chạy ngay khi vừa thêm cột (lần hai không còn gì để làm, không đè dữ liệu GVCN ghi sau đó).
 */
export function migratePrLcb(conn: any, applied: string[]) {
  const cot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('lo_trinh_tiep_theo') as any[]).map((c) => c.name);
  if (!cot.length || cot.includes('huong_gvcn')) return;
  conn.exec('ALTER TABLE lo_trinh_tiep_theo ADD COLUMN huong_gvcn TEXT');
  const r = conn.prepare(
    `UPDATE lo_trinh_tiep_theo SET huong_gvcn = huong
      WHERE huong_gvcn IS NULL AND EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = lo_trinh_tiep_theo.class_id
        AND ta.user_id = lo_trinh_tiep_theo.updated_by AND ta.is_core = 1 AND ta.status = 'active')`,
  ).run();
  applied.push(`PR-LCb: thêm cột lo_trinh_tiep_theo.huong_gvcn (đề xuất GVCN)${r.changes ? `, điền bù ${r.changes} dòng GVCN đã ghi` : ''}.`);
}
