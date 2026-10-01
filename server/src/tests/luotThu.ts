/**
 * PR-MT — dữ liệu thử cho phép kiểm CŨ dựng lượt MT bằng tay (sosV3, PR-N …).
 *
 * Từ M1, thêm học viên vào lớp FT tự tạo MT1–MT3; từ T36, số MT phải liền mạch. Phép kiểm cũ cần "một em mới, chỉ có MT{n} ở tuần X"
 * nên: bỏ lịch tự tạo của em thử (`boLichTuTao`), rồi `luotThu` tạo TRƯỚC các số còn thiếu — đánh dấu MT lịch sử (không nợ, không sinh
 * việc) — rồi mới tới MT{n}. Không nới luật: mọi lượt vẫn đi qua `createAttempt`.
 */
export function boLichTuTao(conn: any, cycleId: number) {
  const q = 'SELECT id FROM assessment_attempts WHERE cycle_id = ?';
  conn.prepare(`DELETE FROM attempt_schedule_history WHERE attempt_id IN (${q})`).run(cycleId);
  conn.prepare(`DELETE FROM attempt_skills WHERE attempt_id IN (${q})`).run(cycleId);
  conn.prepare('DELETE FROM assessment_attempts WHERE cycle_id = ?').run(cycleId);
}

export function luotThu(conn: any, createAttempt: (p: any, input: any) => any, p: any,
  o: { studentId: number; cycleId: number; classId: number; no: number; periodId: number }): any {
  const tao = (attemptNo: number) =>
    createAttempt(p, { studentId: o.studentId, cycleId: o.cycleId, attemptNo, periodId: o.periodId });
  for (let n = 1; n < o.no; n += 1) {
    if (conn.prepare(`SELECT 1 FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ? AND status != 'cancelled'`).get(o.cycleId, n)) continue;
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(tao(n).id);
  }
  return tao(o.no);
}
