import { coNguoiDay } from '../../../shared/domain/paDongBo.ts';
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

/**
 * OV-12c — Case SOS MT lấy nguyên nhân từ NHẬN XÉT + NHÓM của ô (không còn "Xác nhận Case" cho MT). Phép kiểm cũ dựng "Case MT đã có nguyên nhân"
 * bằng `xacNhanCase` nay ghi nhận xét + nhóm vào đúng ô (lượt Case đang theo × bài) qua `saveScore` — đường người dùng thật (chỉ hai trường).
 * `moTa` ngắn hơn 10 ký tự được đệm để qua luật OV-12b (phép kiểm cũ không kiểm luật nhận xét).
 */
export function nhanXetCaseThu(conn: any, saveScore: (...a: any[]) => any, who: any, caseId: number,
  o: { primaryCode?: string | null; moTa?: string | null; today?: string; [khac: string]: unknown }) {
  const c = conn.prepare('SELECT attempt_id, topic FROM sos_cases WHERE id = ?').get(caseId) as any;
  const nx = String(o.moTa ?? 'Nhận xét của GV cho bài này.').trim();
  return saveScore(who, c.attempt_id, c.topic, { nhanXet: nx.length >= 10 ? nx : `${nx} — nhận xét GV`, nhomNguyenNhan: o.primaryCode ? [o.primaryCode] : null },
    ...(o.today ? [o.today] : []));
}

/**
 * OV-13b (mockup OV-13 §9): Xác nhận PA bắt Người dạy (loại có người dạy) và Số buổi (Tutor). Phép kiểm cũ chỉ gửi mô tả → điền phần còn thiếu
 * (người ngoài "GV thử", 4 buổi) khi PA chưa có; gửi sẵn khoá nào thì giữ khoá đó.
 */
export function duXacNhan<T extends Record<string, any>>(conn: any, ivId: number, input: T): T {
  const iv = conn.prepare('SELECT kind, so_buoi, performer_user_id, performer_name FROM case_interventions WHERE id = ?').get(ivId) as any;
  if (!iv) return input;
  const them: Record<string, any> = {};
  const guiNguoi = 'performerSelf' in input || 'performerUserId' in input || 'performerName' in input;
  if (coNguoiDay(iv.kind) && !guiNguoi && !iv.performer_user_id && !iv.performer_name) them.performerName = 'GV thử';
  if (iv.kind === 'tutor' && iv.so_buoi == null && input.soBuoi === undefined) them.soBuoi = 4;
  return { ...input, ...them };
}
