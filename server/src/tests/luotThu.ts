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
  o: { studentId: number; cycleId: number; classId: number; no: number; periodId: number; chot?: boolean }): any {
  const tao = (attemptNo: number) =>
    createAttempt(p, { studentId: o.studentId, cycleId: o.cycleId, attemptNo, periodId: o.periodId });
  for (let n = 1; n < o.no; n += 1) {
    if (conn.prepare(`SELECT 1 FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ? AND status != 'cancelled'`).get(o.cycleId, n)) continue;
    conn.prepare('UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?').run(tao(n).id);
  }
  const a = tao(o.no);
  if (o.chot) chotSan(conn, a.id);   // OV-1c: phép kiểm cũ dựng SOS từ lượt dở — lượt thử chốt sẵn
  return a;
}

/**
 * OV-1c — lượt thử CHỐT SẴN cho phép kiểm cũ dựng SOS từ lượt dở ("điểm dưới kỳ vọng → Case" không chờ đủ 4 kỹ năng, luật trước OV-1c):
 * mọi kỹ năng chưa có điểm coi như ĐÃ DỜI TUẦN vì vắng (`absence_move_count = 1`, vẫn `scheduled` nên nhập điểm được) — một trạng thái chốt
 * thật của `kyNangXongThieu`. Không dùng cho phép kiểm luồng vắng (lần vắng kế sẽ thành lần 2).
 */
export function chotSan(conn: any, attemptId: number) {
  conn.prepare(`UPDATE attempt_skills SET absence_move_count = MAX(absence_move_count, 1) WHERE attempt_id = ? AND sit_status = 'scheduled'`).run(attemptId);
}
