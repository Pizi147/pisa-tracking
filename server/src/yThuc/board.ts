import { db } from '../db.ts';
import { CANH_BAO_NGAY, PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { notFound } from '../util.ts';
import { requireViewClass } from './access.ts';
import { warningsFor } from './canhBao.ts';
import { listMeasures, type MeasureDetail } from './measures.ts';
import { violationsByIds, type ViolationView } from './violations.ts';

/**
 * DỮ LIỆU BA KHU VỰC Ý THỨC CỦA MỘT LỚP (đặc tả §7.3, Y03) — viết lại từ bảng "số đợt case từng nhóm" của mô hình cũ.
 *
 *   1. VI PHẠM CHƯA XỬ LÝ — gom theo HỌC VIÊN, không theo ngày: đơn vị ra quyết định là *em nào*. Mỗi vi phạm kèm tuổi `⚠9n` (W06).
 *   2. BIỆN PHÁP ĐANG CHUẨN BỊ — luôn đầy đủ, không cắt: đó là việc đang dở của GVCN, giấu nó là cách chắc chắn nhất để nó bị quên.
 *   3. LỊCH SỬ XỬ LÝ — chỉ vài dòng gần nhất; lịch sử cần CÓ, không cần chiếm màn.
 *
 * Mọi thứ tính từ dữ liệu thật qua các hàm gốc (`warningsFor`, `listMeasures`, `violationsByIds`) — không có đường đếm riêng, nên bảng
 * này khớp cảnh báo 5 ngày và các chỉ số Ý thức. Bảng tính theo HỌC VIÊN ĐANG HỌC ở lớp: vi phạm chưa xử lý và biện pháp đang chuẩn bị ghi ở lớp cũ đi theo em sang lớp mới (chủ sản phẩm chốt 21/09/2026).
 */

export type ClassViolationBoard = {
  classId: number;
  classCode: string;
  /** Người xem có tạo và xác nhận được biện pháp không — GVBM đọc được ba khu vực nhưng KHÔNG thấy nút Tạo biện pháp. */
  canManage: boolean;
  /** Người xem có ghi vi phạm được ở lớp này không (K2-5b) — cùng quyền `violation.record` mà route ghi vi phạm dùng. */
  canRecord: boolean;
  /** Đầu tab: `⚠ 3 học viên có vi phạm chưa xử lý quá 5 ngày`. */
  warning: { activeCount: number; message: string };
  unhandled: {
    /** Tổng số vi phạm chưa xử lý của cả lớp (đơn vị: vi phạm). */
    total: number;
    /** Số học viên có vi phạm chưa xử lý (đơn vị: học viên) — KHÔNG cộng với `total`. */
    studentCount: number;
    students: Array<{
      studentId: number; studentName: string; count: number; oldestAgeDays: number; warningActive: boolean;
      violations: ViolationView[];
    }>;
  };
  preparing: MeasureDetail[];
  history: { total: number; latest: MeasureDetail[] };
};

const HISTORY_LATEST = 3;

export function classViolationBoard(p: Principal, classId: number, today = demoToday()): ClassViolationBoard {
  const cls = db().prepare('SELECT id, code FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  requireViewClass(p, classId);

  const active = (db()
    .prepare(`SELECT DISTINCT student_id AS id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id`)
    .all(classId) as any[]).map((r) => r.id as number);
  const warnings = warningsFor(active, today);
  const violations = new Map(violationsByIds([...warnings.values()].flatMap((w) => w.violationIds)).map((v) => [v.id, v]));

  const students = [...warnings.values()]
    .filter((w) => w.count > 0)
    .map((w) => ({
      studentId: w.studentId, studentName: w.studentName, count: w.count, oldestAgeDays: w.oldestAgeDays, warningActive: w.active,
      violations: w.violationIds.map((id) => violations.get(id)!).filter(Boolean),
    }))
    .sort((a, b) => b.oldestAgeDays - a.oldestAgeDays || a.studentName.localeCompare(b.studentName));

  const activeWarnings = students.filter((s) => s.warningActive).length;
  const preparing = listMeasures(p, { classId, status: 'preparing' }).rows;
  const done = listMeasures(p, { classId, status: 'done' }).rows;

  return {
    classId, classCode: cls.code, canManage: can(p, PERMISSIONS.DISCIPLINE_MANAGE, { classId }),
    canRecord: can(p, PERMISSIONS.VIOLATION_RECORD, { classId }),
    warning: {
      activeCount: activeWarnings,
      message: activeWarnings > 0 ? `⚠ ${activeWarnings} học viên có vi phạm chưa xử lý quá ${CANH_BAO_NGAY} ngày` : '',
    },
    unhandled: {
      total: students.reduce((n, s) => n + s.count, 0), studentCount: students.length, students,
    },
    preparing,
    history: { total: done.length, latest: done.slice(0, HISTORY_LATEST) },
  };
}
