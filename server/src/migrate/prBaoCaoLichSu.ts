/**
 * P12 BAO-CAO-LICH-SU (E7): cột `learning_cycles.thi_that_target` — Target lúc nhập / sửa kết quả thi thật (`datKetQuaThiThat`), để đổi Target về sau
 * không làm sai "Đạt Target thi thật" của kỳ đã qua. Dữ liệu cũ: lộ trình đã có kết quả → Target hiện tại (ƯỚC LƯỢNG — Target lúc nhập không còn lưu).
 * Chạy lặp được: cột có rồi thì không thêm; chỉ điền dòng còn NULL (dòng nhập sau migrate luôn có giá trị) → lần hai không đổi gì.
 */
export function migratePrBaoCaoLichSu(conn: any, applied: string[]) {
  const coCot = (conn.prepare(`SELECT name FROM pragma_table_info('learning_cycles')`).all() as any[]).some((c) => c.name === 'thi_that_target');
  if (!coCot) conn.exec('ALTER TABLE learning_cycles ADD COLUMN thi_that_target REAL');
  const r = conn.prepare(
    `UPDATE learning_cycles SET thi_that_target = target_score
      WHERE thi_that_target IS NULL AND target_score IS NOT NULL AND route IS NOT NULL
        AND (thi_that_khong_thi = 1 OR thi_that_l IS NOT NULL)`,
  ).run();
  if (!coCot || r.changes) applied.push(`P12: cột learning_cycles.thi_that_target (Target lúc nhập KQ thi thật)${r.changes ? `, điền ${r.changes} lộ trình đã có KQ bằng Target hiện tại (ước lượng)` : ''}.`);
}
