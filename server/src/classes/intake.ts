import { db, tx } from '../db.ts';
import { MOCK_FT_STUDY_WEEK, PERMISSIONS, programmeOf, type Route } from '../../../shared/domain/index.ts';
import { activeRouteCodes } from '../platform/sysconfig.ts';
import { addDays, badRequest, isIsoDate, normalizeName, notFound, nowIso, padCode } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';

/**
 * Thêm học viên hàng loạt.
 *
 * Dán từ Excel/Google Sheets (TSV) hoặc nhập tay. Server validate lại từng dòng theo phạm vi
 * quyền, chạy trong một transaction và có khoá idempotency để bấm hai lần hoặc thử lại
 * không tạo bản ghi trùng.
 */
/**
 * NĂM CỘT, KHÔNG HƠN — owner chốt 13/09/2026 (mục 7.4):
 *
 *     Họ và tên · Lớp · Ngày sinh · Điểm đầu vào · Target
 *
 * Những gì bỏ khỏi bảng dán, và vì sao:
 *   · Lộ trình (LT1/LT2)  suy từ chính lớp em vào — lớp đã có lộ trình rồi
 *   · Ngày thi IELTS      chưa ai biết lúc nhập; khai sau khi đăng ký xong
 *   · Tư vấn viên         không đổi được quyết định nào trong phần mềm này
 *
 * Các trường đó VẪN đọc được nếu bảng dán có cột tương ứng — người ta dán cả file cũ là
 * chuyện thường. Chỉ là lưới nhập tay không còn bày chúng ra nữa.
 */
export type IntakeRow = {
  fullName?: string;
  classCode?: string;
  dob?: string;
  /** Điểm đầu vào, ưu tiên OVR. Không phải em nào cũng có điểm chi tiết — bổ sung sau. */
  baselineScore?: number | string | null;
  examDate?: string;
  route?: string;
  target?: number | string | null;
  consultant?: string;
  startDate?: string;
  /** Các tuần MT ĐỀ XUẤT, dạng ngày thứ Hai. Chỉ thành kế hoạch khi người có quyền chốt tuần. */
  mockWeeks?: string[];
};

export type RowIssue = { row: number; field: string; message: string };

export type IntakePreview = {
  rows: (IntakeRow & {
    row: number;
    classId: number | null;
    duplicates: { id: number; studentCode: string; fullName: string; dob: string | null }[];
    issues: RowIssue[];
  })[];
  issues: RowIssue[];
  canPlanWeeks: boolean;
};

const HEADER_ALIASES: Record<string, keyof IntakeRow> = {
  'ho ten': 'fullName', 'hoten': 'fullName', 'ten': 'fullName', 'full name': 'fullName', 'name': 'fullName',
  'lop': 'classCode', 'ma lop': 'classCode', 'class': 'classCode',
  'ngay sinh': 'dob', 'dob': 'dob',
  'ngay thi': 'examDate', 'ngay thi ielts': 'examDate', 'exam': 'examDate', 'exam date': 'examDate',
  'lo trinh': 'route', 'route': 'route',
  'target': 'target', 'diem cam ket': 'target', 'cam ket': 'target',
  'diem dau vao': 'baselineScore', 'dau vao': 'baselineScore', 'ovr': 'baselineScore',
  'diem ovr': 'baselineScore', 'baseline': 'baselineScore', 'entry': 'baselineScore',
  'tu van vien': 'consultant', 'tvv': 'consultant', 'consultant': 'consultant',
  'ngay bat dau': 'startDate', 'bat dau': 'startDate',
  'tuan mt': 'mockWeeks', 'cac tuan mt': 'mockWeeks',
};

/**
 * ĐIỂM ĐẦU VÀO — ưu tiên OVR, và bỏ qua chứ KHÔNG báo lỗi khi ô để trống.
 *
 * Owner nói rõ: không phải em nào cũng có điểm đầu vào, bổ sung sau được. Bắt lỗi ở đây thì
 * một bảng bốn mươi em có ba ô trống là cả bảng không nhập được.
 */
function baselineOf(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 9) return null;
  return n;
}

const deaccent = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();

/**
 * Đọc TSV/CSV dán từ bảng tính. Dòng đầu là tiêu đề nếu khớp tên cột đã biết;
 * không khớp thì hiểu theo thứ tự cột mặc định.
 */
export function parsePaste(text: string): { rows: IntakeRow[]; usedHeader: boolean } {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (!lines.length) return { rows: [], usedHeader: false };
  const split = (l: string) => (l.includes('\t') ? l.split('\t') : l.split(',')).map((c) => c.trim());

  const first = split(lines[0]).map(deaccent);
  const mapped = first.map((h) => HEADER_ALIASES[h]);
  const usedHeader = mapped.filter(Boolean).length >= 2;
  const order: (keyof IntakeRow | undefined)[] = usedHeader
    ? mapped
    /* Thứ tự mặc định khi bảng dán KHÔNG có dòng tiêu đề — đúng năm cột của mục 7.4. */
    : ['fullName', 'classCode', 'dob', 'baselineScore', 'target'];

  const out: IntakeRow[] = [];
  for (const line of lines.slice(usedHeader ? 1 : 0)) {
    const cells = split(line);
    const row: IntakeRow = {};
    order.forEach((key, i) => {
      if (!key) return;
      const v = cells[i];
      if (v === undefined || v === '') return;
      if (key === 'mockWeeks') row.mockWeeks = v.split(/[;|]/).map((x) => x.trim()).filter(Boolean);
      else (row as any)[key] = v;
    });
    if (Object.keys(row).length) out.push(row);
  }
  return { rows: out, usedHeader };
}

/** Đọc ngày theo ĐÚNG định dạng người dùng chọn; ngày mơ hồ thì báo lỗi thay vì đoán. */
export function parseDateAs(value: string | undefined, format: 'dmy' | 'mdy' | 'iso'): string | null | 'invalid' {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!m) return 'invalid';
  const [, a, b, y] = m;
  const day = format === 'mdy' ? b : a;
  const month = format === 'mdy' ? a : b;
  const iso = `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return isIsoDate(iso) ? iso : 'invalid';
}

export function previewIntake(
  p: Principal,
  input: { rows: IntakeRow[]; defaultClassId?: number | null; dateFormat?: 'dmy' | 'mdy' | 'iso' },
): IntakePreview {
  const conn = db();
  const fmt = input.dateFormat ?? 'dmy';
  const issues: RowIssue[] = [];
  const classes = conn.prepare("SELECT id, code, route, start_date FROM classes WHERE status='active'").all() as any[];
  const byCode = new Map(classes.map((c) => [c.code.toLowerCase(), c]));
  const defaultClass = input.defaultClassId ? classes.find((c) => c.id === input.defaultClassId) ?? null : null;

  const rows = input.rows.map((r, i) => {
    const rowNo = i + 1;
    const rowIssues: RowIssue[] = [];
    const name = (r.fullName ?? '').trim();
    if (!name) rowIssues.push({ row: rowNo, field: 'fullName', message: 'Thiếu họ tên' });

    // Mở từ một lớp thì lớp được điền sẵn; dán có cột lớp thì ưu tiên cột đó.
    const cls = r.classCode ? byCode.get(r.classCode.trim().toLowerCase()) ?? null : defaultClass;
    if (!cls) {
      rowIssues.push({ row: rowNo, field: 'classCode', message: r.classCode ? `Không có lớp "${r.classCode}"` : 'Thiếu lớp' });
    } else if (!can(p, PERMISSIONS.STUDENT_EDIT, { classId: cls.id })) {
      rowIssues.push({ row: rowNo, field: 'classCode', message: `Lớp ${cls.code} nằm ngoài phạm vi bạn được cấp quyền` });
    }

    const dob = parseDateAs(r.dob, fmt);
    if (dob === 'invalid') rowIssues.push({ row: rowNo, field: 'dob', message: `Ngày sinh "${r.dob}" không đọc được` });
    const examDate = parseDateAs(r.examDate, fmt);
    if (examDate === 'invalid') rowIssues.push({ row: rowNo, field: 'examDate', message: `Ngày thi "${r.examDate}" không đọc được` });
    const startDate = parseDateAs(r.startDate, fmt);
    if (startDate === 'invalid') rowIssues.push({ row: rowNo, field: 'startDate', message: `Ngày bắt đầu "${r.startDate}" không đọc được` });

    const route = r.route ? r.route.trim().toUpperCase() : cls?.route ?? null;
    /*
     * Lộ trình nay là DỮ LIỆU (mục 7.3), nên kiểm theo BẢNG chứ không theo hằng số trong mã.
     * Kiểm bằng hằng số thì lộ trình Quản trị hệ thống vừa tạo lại bị coi là sai.
     */
    if (route && !activeRouteCodes().includes(route)) {
      rowIssues.push({ row: rowNo, field: 'route', message: `Lộ trình "${r.route}" không hợp lệ` });
    }
    const target = r.target === undefined || r.target === null || r.target === '' ? null : Number(r.target);
    if (target !== null && (!Number.isFinite(target) || target < 0 || target > 9)) {
      rowIssues.push({ row: rowNo, field: 'target', message: 'Target phải nằm trong khoảng 0–9' });
    }
    // Có lộ trình mà thiếu target thì vẫn nhập được, chỉ là chưa tính được kỳ vọng.
    const warnings: RowIssue[] = [];
    if (route && target === null) {
      warnings.push({ row: rowNo, field: 'target', message: 'Chưa có target — nhập được nhưng chưa tính được kỳ vọng' });
    }

    // Trùng tên + ngày sinh chỉ là GỢI Ý, không tự gộp hồ sơ.
    const duplicates = name
      ? (conn
          .prepare(
            `SELECT id, student_code, full_name, dob FROM students
              WHERE normalized_name = ? ${dob && dob !== 'invalid' ? 'AND dob = ?' : ''} LIMIT 5`,
          )
          .all(...(dob && dob !== 'invalid' ? [normalizeName(name), dob] : [normalizeName(name)])) as any[])
      : [];

    issues.push(...rowIssues, ...warnings);
    return {
      row: rowNo,
      fullName: name,
      classCode: cls?.code,
      classId: cls?.id ?? null,
      dob: dob === 'invalid' ? undefined : dob ?? undefined,
      examDate: examDate === 'invalid' ? undefined : examDate ?? undefined,
      startDate: startDate === 'invalid' ? undefined : startDate ?? undefined,
      route: route ?? undefined,
      target,
      consultant: r.consultant,
      mockWeeks: r.mockWeeks,
      duplicates: duplicates.map((d) => ({ id: d.id, studentCode: d.student_code, fullName: d.full_name, dob: d.dob })),
      issues: [...rowIssues, ...warnings],
    };
  });

  return { rows, issues, canPlanWeeks: can(p, PERMISSIONS.PLAN_WEEK, { anyScope: true }) };
}

/** Tuần MT gợi ý theo mốc tuần HỌC của FT. Chỉ là đề xuất, quản lý sửa được. */
export function suggestMockWeeks(classStart: string | null, count = 3): string[] {
  if (!classStart) return [];
  return Array.from({ length: count }, (_, i) => {
    const studyWeek = MOCK_FT_STUDY_WEEK[i + 1];
    return studyWeek ? mondayOf(addDays(classStart, (studyWeek - 1) * 7)) : null;
  }).filter((x): x is string => !!x);
}

export type IntakeResult = { added: number; skipped: number; failed: RowIssue[]; studentIds: number[] };

export function commitIntake(
  p: Principal,
  input: {
    rows: IntakeRow[]; defaultClassId?: number | null; dateFormat?: 'dmy' | 'mdy' | 'iso';
    skipRows?: number[]; idempotencyKey?: string;
  },
): IntakeResult {
  const conn = db();
  const key = input.idempotencyKey?.trim();
  if (key) {
    // Bấm hai lần hoặc thử lại sau lỗi mạng không được tạo thêm học viên.
    const seen = conn.prepare("SELECT value FROM demo_config WHERE key = ?").get(`intake:${key}`) as any;
    if (seen) return JSON.parse(seen.value) as IntakeResult;
  }

  const preview = previewIntake(p, input);
  const skip = new Set(input.skipRows ?? []);
  const failed: RowIssue[] = [];
  const studentIds: number[] = [];
  let skipped = 0;

  const result = tx(() => {
    for (const r of preview.rows) {
      if (skip.has(r.row)) { skipped += 1; continue; }
      const blocking = r.issues.filter((i) => i.field !== 'target' || i.message.includes('0–9'));
      if (blocking.length) { failed.push(...blocking); skipped += 1; continue; }
      if (!r.classId || !r.fullName) { skipped += 1; continue; }

      require_(p, PERMISSIONS.STUDENT_EDIT, { classId: r.classId },
        `Lớp ${r.classCode} nằm ngoài phạm vi bạn được cấp quyền.`);
      const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(r.classId) as any;
      const startedAt = r.startDate ?? cls.start_date ?? nowIso().slice(0, 10);

      const seq = (conn.prepare('SELECT next_value FROM student_code_seq WHERE id = 1').get() as any)?.next_value ?? 1;
      conn.prepare('UPDATE student_code_seq SET next_value = next_value + 1 WHERE id = 1').run();
      const info = conn
        .prepare(
          `INSERT INTO students (student_code, full_name, normalized_name, dob, branch_id, status,
                                 consultant_name, created_at)
           VALUES (?,?,?,?,?, 'active', ?, ?)`,
        )
        .run(padCode('PISA', seq), r.fullName, normalizeName(r.fullName), r.dob ?? null,
             cls.branch_id, r.consultant ?? null, nowIso());
      const sid = Number(info.lastInsertRowid);
      studentIds.push(sid);

      conn.prepare('INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, ?,?,?)')
        .run(sid, r.classId, 'active', startedAt, nowIso());
      addJourney({ studentId: sid, eventType: 'enrollment', eventDate: startedAt,
        title: `Vào lớp ${cls.code}`, createdBy: p.userId });

      /*
       * MỞ LỘ TRÌNH CHO MỌI EM, không chỉ em có cột lộ trình.
       *
       * Trước đây thiếu cột "Lộ trình" là em vào hệ thống mà không có lộ trình nào — nghĩa
       * là không có target, không có tuần bắt đầu, không có lịch MT, và mọi màn hình đều
       * hiện trống mà không nói vì sao. Nay lộ trình suy từ chính LỚP em vào (lớp FT đã có
       * LT1/LT2 sẵn), nên em nào cũng có chỗ để gắn thông tin.
       */
      const route = r.route ?? cls.route ?? null;
      {
        const cyc = conn
          .prepare(
            `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, exam_date,
                                          baseline_score, baseline_source, start_period_id,
                                          started_at, status, created_at)
             VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
          )
          /*
           * TUẦN BẮT ĐẦU HỌC suy từ ngày vào lớp — đó là thông tin duy nhất có thật lúc này,
           * và khai lại được bất cứ lúc nào ở panel "Kế hoạch học".
           */
          .run(sid, route, cls.programme_code ?? null, r.target ?? null, r.examDate ?? null,
               baselineOf(r.baselineScore), r.baselineScore ? 'entrance' : null,
               ensurePeriod(startedAt).id, startedAt, nowIso());
        addJourney({ studentId: sid, eventType: 'cycle_start', eventDate: startedAt,
          title: route ? `Bắt đầu lộ trình ${route}` : 'Bắt đầu khoá học',
          detail: r.target ? `Target ${r.target}` : 'Chưa có target',
          refTable: 'learning_cycles', refId: Number(cyc.lastInsertRowid), createdBy: p.userId });

        /*
         * Tuần MT chỉ trở thành KẾ HOẠCH khi người nhập có quyền chốt tuần.
         * Người không có quyền vẫn nhập được học viên, nhưng tuần đề xuất bị bỏ qua để
         * đường nhập hàng loạt không thành lối vượt quyền lập kế hoạch.
         */
        if (preview.canPlanWeeks && r.mockWeeks?.length) {
          r.mockWeeks.forEach((w, idx) => {
            const iso = parseDateAs(w, input.dateFormat ?? 'dmy');
            if (!iso || iso === 'invalid') return;
            const period = ensurePeriod(iso);
            conn
              .prepare(
                `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id,
                                                  planned_period_id, status, target_at_attempt, created_by, created_at)
                 VALUES (?,?,?, 'mock', ?,?, 'planned', ?, ?, ?)`,
              )
              .run(Number(cyc.lastInsertRowid), sid, idx + 1, r.classId, period.id, r.target ?? null, p.userId, nowIso());
          });
        }
      }
    }

    const out: IntakeResult = { added: studentIds.length, skipped, failed, studentIds };
    writeAudit({ actorUserId: p.userId, action: 'student.bulk_add', entityType: 'student',
      entityLabel: `${out.added} học viên`, after: { added: out.added, skipped: out.skipped } });
    if (key) {
      conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)')
        .run(`intake:${key}`, JSON.stringify(out), nowIso());
    }
    return out;
  });
  return result;
}

/** Tạo lớp mới. Kỹ năng lấy theo cấu hình gửi lên, không suy từ tên lớp. */
export function createClass(p: Principal, input: {
  code: string; branchId: number; kind: string; route?: Route | null;
  isFulltime?: boolean; startDate?: string | null; skills?: string[]; note?: string | null;
  /** Tuần khai giảng — với lớp Normal đây là mốc gốc của hai kỳ kiểm tra. */
  startPeriodId?: number | null;
}) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { branchId: input.branchId }, 'Bạn không có quyền tạo lớp ở chi nhánh này.');
  const conn = db();
  const branch = conn.prepare('SELECT * FROM branches WHERE id = ?').get(input.branchId) as any;
  if (!branch) throw notFound('Không tìm thấy chi nhánh');
  const code = (input.code ?? '').trim();
  if (!code) throw badRequest('Cần mã lớp.');
  // Mã lớp luôn bắt đầu bằng mã chi nhánh.
  if (!code.toUpperCase().startsWith(`${branch.code.toUpperCase()}-`)) {
    throw badRequest(`Mã lớp phải bắt đầu bằng "${branch.code}-", ví dụ ${branch.code}-FT 101.`);
  }
  if (conn.prepare('SELECT id FROM classes WHERE code = ?').get(code)) throw badRequest(`Đã có lớp ${code}.`);
  if (input.startDate && !isIsoDate(input.startDate)) throw badRequest('Ngày khai giảng không hợp lệ.');

  return tx(() => {
    const info = conn
      .prepare(
        /*
         * MÃ CHƯƠNG TRÌNH ghi thẳng lúc tạo, không để suy sau từ tên lớp.
         *
         * Thiếu nó thì hệ thống không biết lớp chấm theo band hay theo tỷ lệ, và trang lớp
         * dựng ra bảng band IELTS cho một lớp Foundation — lỗi im lặng đã từng xảy ra.
         */
        `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fulltime,
                              start_date, start_period_id, status, note, created_at)
         VALUES (?,?,?,?,?,?,?,?, 'active', ?, ?)`,
      )
      .run(code, input.branchId, (input.kind ?? 'FT').trim(),
           programmeOf(input.kind ?? 'FT'), input.route ?? null,
           input.isFulltime ? 1 : 0, input.startDate ?? null, input.startPeriodId ?? null,
           input.note ?? null, nowIso());
    const id = Number(info.lastInsertRowid);
    for (const skill of input.skills?.length ? input.skills : ['listening', 'reading', 'writing1', 'writing2', 'speaking']) {
      conn.prepare('INSERT INTO class_skills (class_id, skill, sessions_per_week) VALUES (?,?,1)').run(id, skill);
    }
    writeAudit({ actorUserId: p.userId, action: 'class.create', entityType: 'class', entityId: id,
      entityLabel: code, after: input });
    return conn.prepare('SELECT * FROM classes WHERE id = ?').get(id);
  });
}
