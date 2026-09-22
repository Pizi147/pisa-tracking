/**
 * KHU VỰC TEST — ba câu hỏi ĐỌC của việc chấm điểm (spec §3.5):
 *
 *   canChamList  "tôi còn phải chấm những gì" — gom theo lớp + đợt, xếp vào Quá hạn / Tuần này / Sắp tới.
 *   lichTest     "tuần này có những lượt Test nào" — nhóm theo lớp.
 *   chamSheet    "mở bảng chấm của một lớp" — MỘT CỬA, tự chọn đúng bảng theo loại lớp.
 *
 * Module này KHÔNG có luật nghiệp vụ mới: nó gọi `listAttempts`, `classScoreSheet`, `regularSheet` và các hàm thuần ở
 * `shared/domain/chamDiem.ts`. Có nó để giao diện chỉ hỏi một nơi, và để chỗ mở bảng chấm không còn phải tự đoán lớp
 * này là FT hay lớp thường.
 */
import { notFound } from '../util.ts';
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { can, type Principal } from '../permissions.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { classScoreSheet } from '../fasttrack/attempts.ts';
import { isRatioClass, regularSheet } from '../normal/regular.ts';

export function chamSheet(
  p: Principal, classId: number, opts: { periodId?: number | null; kind?: string | null } = {},
  today: string = demoToday(),
) {
  const cls = db()
    .prepare('SELECT c.*, b.name AS branch_name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?')
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  const chung = {
    classId, classCode: cls.code as string, branchName: cls.branch_name as string,
    canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId }),
    today,
  };
  if (isRatioClass(classId)) {
    return { ...chung, mode: 'ratio' as const, thuong: regularSheet(p, classId, opts.kind ?? undefined), ft: null };
  }
  return { ...chung, mode: 'ielts_band' as const, ft: classScoreSheet(p, classId, opts.periodId ?? null, today), thuong: null };
}
