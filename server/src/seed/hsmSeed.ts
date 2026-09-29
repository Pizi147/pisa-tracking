import { loadPrincipal } from '../permissions.ts';
import { saveScore } from '../fasttrack/attempts.ts';
import type { BuildCtx } from './build.ts';

/**
 * BỘ DEMO PR-HSM (planning đặt H1–H4) — đi qua CHÍNH `saveScore` (nhánh chỉ-nhận-xét), dựng sau `buildKckDemo`.
 *
 *   H1  MB FT 101 · Tạ Minh Quân (X1 của XLMT, MT3 đủ điểm): nhận xét W1, W2, S + GV chấm S = Phạm Thu Trang (tài khoản) → hồ sơ
 *       Mock đủ M10.
 *   H2  MB FT 101 · một em khác có S đã chấm: GV chấm là người ngoài "Cô Lan (giám khảo ngoài)".
 *   H3  Lương Bảo Anh (X1, MT3 có L R, thiếu W S) — dữ liệu có sẵn: hồ sơ HV "Đang chấm · 2/4", KetQuaDot còn thiếu 2.
 *   H4  Trạng thái M10 dùng dữ liệu có sẵn (ghi ở DEMO.md): lượt huỷ · MT lịch sử · vắng lần 2 chờ duyệt · huỷ phần · RF · hoàn tất.
 */
export function buildHsmDemo(ctx: BuildCtx): { comments: number } {
  const { conn } = ctx;
  const ft101 = ctx.classId.get('MB FT 101');
  if (!ft101) return { comments: 0 };
  const admin = loadPrincipal(ctx.adminId);
  let n = 0;

  const quan = conn.prepare(`SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id
    WHERE s.full_name = 'Tạ Minh Quân' AND a.attempt_no = 3 AND a.status != 'cancelled'`).get() as any;
  const trang = conn.prepare(`SELECT id FROM users WHERE full_name = 'Phạm Thu Trang'`).get() as any;
  if (quan) {
    saveScore(admin, quan.id, 'writing1', { nhanXet: 'Mô tả biểu đồ đủ ý chính, còn thiếu câu tổng quan ở mở bài.' });
    saveScore(admin, quan.id, 'writing2', { nhanXet: 'Lập luận rõ; cần thêm ví dụ cụ thể cho đoạn thân bài thứ hai.' });
    saveScore(admin, quan.id, 'speaking', {
      nhanXet: 'Nói trôi chảy, phát âm rõ. Part 3 còn trả lời ngắn — luyện mở rộng ý.',
      ...(trang ? { gvCham: { performerUserId: trang.id } } : {}),
    });
    n += 3;
  }

  /* H2: em đầu tiên của MB FT 101 (không phải Quân) có S đã chấm mà chưa có GV chấm. */
  const khac = conn.prepare(`SELECT a.id FROM assessment_attempts a
      JOIN assessment_scores sc ON sc.attempt_id = a.id AND sc.skill = 'speaking' AND sc.band IS NOT NULL
      JOIN students s ON s.id = a.student_id
     WHERE a.class_id = ? AND a.status != 'cancelled' AND s.full_name != 'Tạ Minh Quân'
       AND sc.examiner_user_id IS NULL AND sc.examiner_name IS NULL
     ORDER BY a.id LIMIT 1`).get(ft101) as any;
  if (khac) {
    saveScore(admin, khac.id, 'speaking', { gvCham: { performerName: 'Cô Lan (giám khảo ngoài)' } });
    n += 1;
  }
  return { comments: n };
}
