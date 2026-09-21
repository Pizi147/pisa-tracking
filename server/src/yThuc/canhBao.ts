import { db } from '../db.ts';
import { CANH_BAO_NGAY, violationWarning } from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { notFound } from '../util.ts';
import { requireViewClass, requireViewStudent } from './access.ts';

/**
 * CẢNH BÁO 5 NGÀY — MỘT HÀM DUY NHẤT CHO CẢ BA NƠI HIỂN THỊ (đặc tả §5.5, W01–W06, nguồn mục 30).
 *
 *   Tập cần xử lý của một học viên = vi phạm còn hiệu lực VÀ chưa nằm trong bất kỳ biện pháp nào (W03: đã gom vào biện pháp
 *   Đang chuẩn bị là ra khỏi tập — GVCN đã bắt tay vào việc; W04: vi phạm đã hủy không bao giờ vào).
 *   Cảnh báo bật khi tập KHÔNG rỗng và cái cũ nhất đã QUÁ 5 ngày.
 *
 * Ba nơi hiển thị (W05) — đầu tab Ý thức của hồ sơ lớp, nhãn nhỏ ở dòng học viên trong danh sách lớp, một dòng trong Việc cần
 * làm của GVCN — đều gọi `warningsFor` ở dưới, KHÔNG nơi nào tự đếm lại. Đó là lý do ba nơi không thể nói ba con số khác nhau,
 * và cũng là bài học của cả đợt overhaul số liệu: hai phép đếm sẽ khớp nhau trên dữ liệu demo rồi lệch khi dữ liệu thật vào.
 *
 * Đây là NHẮC MỀM (W02): không tự tạo case, không tự tạo biện pháp, không đặt hạn, không tính là quá hạn của ai — nên kết quả ở
 * đây cố ý KHÔNG có trường hạn hay quá hạn nào.
 */

export type StudentWarning = {
  studentId: number;
  studentName: string;
  classId: number | null;
  /** Số vi phạm trong tập cần xử lý. */
  count: number;
  oldestOn: string | null;
  oldestAgeDays: number;
  /** Bật khi tập không rỗng và cái cũ nhất quá 5 ngày. */
  active: boolean;
  /** `⚠ {n} vi phạm chưa được xử lý — vi phạm cũ nhất: {k} ngày trước` (W01); rỗng khi không bật. */
  message: string;
  /** Mã các vi phạm thuộc tập cần xử lý, cũ trước mới sau. */
  violationIds: number[];
};

/**
 * Hàm gốc. `classId` (tuỳ chọn) chỉ tính vi phạm GHI Ở LỚP ĐÓ — dùng cho tab Ý thức của lớp để em chuyển lớp không mang lịch sử
 * cũ sang lớp mới; bỏ trống thì tính mọi vi phạm của học viên (hồ sơ học viên, chỉ số toàn chi nhánh).
 */
export function warningsFor(studentIds: number[], today = demoToday(), opts: { classId?: number | null } = {}): Map<number, StudentWarning> {
  const out = new Map<number, StudentWarning>();
  const names = new Map<number, string>();
  const dates = new Map<number, Array<{ id: number; on: string }>>();
  for (let i = 0; i < studentIds.length; i += 400) {
    const chunk = studentIds.slice(i, i + 400);
    const ph = chunk.map(() => '?').join(',');
    for (const r of db().prepare(`SELECT id, full_name FROM students WHERE id IN (${ph})`).all(...chunk) as any[]) names.set(r.id, r.full_name);
    const args: unknown[] = [...chunk];
    let classSql = '';
    if (opts.classId) { classSql = ' AND v.class_id = ?'; args.push(opts.classId); }
    for (const r of db()
      .prepare(
        `SELECT v.id, v.student_id, v.occurred_on FROM violations v
          WHERE v.student_id IN (${ph}) AND v.valid = 1${classSql}
            AND NOT EXISTS (SELECT 1 FROM measure_violations mv WHERE mv.violation_id = v.id)
          ORDER BY v.occurred_on, v.id`,
      )
      .all(...args) as any[]) {
      if (!dates.has(r.student_id)) dates.set(r.student_id, []);
      dates.get(r.student_id)!.push({ id: r.id, on: r.occurred_on });
    }
  }
  for (const studentId of studentIds) {
    const list = dates.get(studentId) ?? [];
    const w = violationWarning(list.map((x) => x.on), today);
    out.set(studentId, {
      studentId, studentName: names.get(studentId) ?? '', classId: opts.classId ?? null,
      count: w.count, oldestOn: w.oldestOn, oldestAgeDays: w.oldestAgeDays, active: w.active, message: w.message,
      violationIds: list.map((x) => x.id),
    });
  }
  return out;
}

/** Học viên ĐANG HỌC ở một lớp. */
function activeStudentsOf(classId: number): number[] {
  return (db()
    .prepare(`SELECT DISTINCT e.student_id AS id FROM enrollments e WHERE e.class_id = ? AND e.status = 'active' ORDER BY e.student_id`)
    .all(classId) as any[]).map((r) => r.id as number);
}

/** Cảnh báo của MỘT học viên (hồ sơ học viên). */
export function studentWarning(p: Principal, studentId: number, today = demoToday()): StudentWarning {
  if (!db().prepare('SELECT id FROM students WHERE id = ?').get(studentId)) throw notFound('Không tìm thấy học viên');
  requireViewStudent(p, studentId);
  return warningsFor([studentId], today).get(studentId)!;
}

const classSentence = (n: number) => (n > 0 ? `⚠ ${n} học viên có vi phạm chưa xử lý quá ${CANH_BAO_NGAY} ngày` : '');

/** Đầu tab Ý thức của hồ sơ lớp: bao nhiêu học viên đang bị cảnh báo, và là những em nào. */
export function classWarning(p: Principal, classId: number, today = demoToday()) {
  if (!db().prepare('SELECT id FROM classes WHERE id = ?').get(classId)) throw notFound('Không tìm thấy lớp');
  requireViewClass(p, classId);
  return classWarningOf(classId, today);
}

function classWarningOf(classId: number, today: string) {
  const all = warningsFor(activeStudentsOf(classId), today, { classId });
  const students = [...all.values()].filter((w) => w.active).sort((a, b) => b.oldestAgeDays - a.oldestAgeDays || a.studentId - b.studentId);
  return { classId, activeCount: students.length, message: classSentence(students.length), students };
}

/** Nhãn nhỏ ở DÒNG HỌC VIÊN trong danh sách lớp: chỉ những em đang bị cảnh báo. Cùng dữ liệu với `classWarning`. */
export function rosterWarnings(p: Principal, classId: number, today = demoToday()): Map<number, StudentWarning> {
  return new Map(classWarning(p, classId, today).students.map((w) => [w.studentId, w]));
}

/**
 * MỘT DÒNG TRONG VIỆC CẦN LÀM CỦA GVCN (đặc tả 7.10): mỗi lớp mình chủ nhiệm mà có học viên bị cảnh báo. Không có hạn, không tô
 * như quá hạn, không tính vào "đúng hạn cập nhật". Giáo viên không chủ nhiệm lớp nào thì không có dòng nào.
 */
export function myWarningLines(p: Principal, today = demoToday()) {
  const classIds = [...new Set(p.assignments
    .filter((a) => a.isCore && a.effectiveFrom <= today && (!a.effectiveTo || a.effectiveTo >= today))
    .map((a) => a.classId))];
  const lines: Array<{ classId: number; className: string; studentCount: number; text: string }> = [];
  for (const classId of classIds) {
    const c = db().prepare('SELECT code FROM classes WHERE id = ?').get(classId) as any;
    if (!c) continue;
    const w = classWarningOf(classId, today);
    if (w.activeCount > 0) {
      lines.push({ classId, className: c.code, studentCount: w.activeCount, text: `Lớp ${c.code} — ${w.activeCount} học viên có vi phạm chưa xử lý quá ${CANH_BAO_NGAY} ngày` });
    }
  }
  return lines;
}
