import * as XLSX from 'xlsx';
import { db, tx } from '../db.ts';
import { PERMISSIONS, TEACHING_SKILLS } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, isIsoDate, normalizeName, notFound, nowIso } from '../util.ts';
import { can, require_, viewScope, type Principal } from '../permissions.ts';
import { addJourneyEvent, writeAudit } from './audit.ts';
import { nextStudentCode } from './students.ts';

export type ParsedSheet = { name: string; headers: string[]; rows: Record<string, unknown>[]; rowCount: number };

export function parseWorkbook(buffer: Buffer, fileName: string) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });
  const sheets: ParsedSheet[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false }) as Record<string, unknown>[];
    const headers = json.length ? Object.keys(json[0]) : [];
    return { name, headers, rows: json.slice(0, 2000), rowCount: json.length };
  });
  return { fileName, sheets };
}

export const STUDENT_IMPORT_FIELDS = [
  { key: 'className', label: 'Lớp', required: true, hint: 'Mã lớp, ví dụ FT-A01' },
  { key: 'fullName', label: 'Họ tên', required: true, hint: 'Giữ nguyên dấu' },
  { key: 'dob', label: 'Ngày sinh', required: true, hint: 'dd/mm/yyyy' },
  { key: 'targetBand', label: 'Target', required: false, hint: 'Ví dụ 6.5' },
  { key: 'consultant', label: 'Tư vấn viên', required: false, hint: 'Họ tên hoặc mã người dùng' },
  { key: 'skills', label: 'Skill đăng ký', required: false, hint: 'Để trống = tất cả skill của lớp' },
] as const;

/** Đoán mapping cột từ tên header, người dùng vẫn sửa được ở bước mapping. */
export function guessMapping(headers: string[]): Record<string, string> {
  const norm = (s: string) => normalizeName(s).replace(/[^a-z0-9]/g, '');
  const table: Record<string, string[]> = {
    className: ['lop', 'class', 'malop', 'classcode', 'lophoc'],
    fullName: ['hoten', 'hovaten', 'name', 'fullname', 'tenhocvien', 'hocvien'],
    dob: ['ngaysinh', 'dob', 'birthday', 'dateofbirth', 'ns'],
    targetBand: ['target', 'muctieu', 'targetband', 'band'],
    consultant: ['tuvanvien', 'consultant', 'tvv', 'nguoiphutrach'],
    skills: ['skill', 'skills', 'skilldangky', 'monhoc'],
  };
  const result: Record<string, string> = {};
  for (const h of headers) {
    const n = norm(h);
    for (const [field, candidates] of Object.entries(table)) {
      if (result[field]) continue;
      if (candidates.some((c) => n === c || n.includes(c))) result[field] = h;
    }
  }
  return result;
}

export type ImportRowResult = {
  rowIndex: number;
  raw: Record<string, unknown>;
  value: {
    className: string; fullName: string; dob: string | null; targetBand: number | null;
    consultant: string | null; skills: string[] | null;
  };
  errors: string[];
  warnings: string[];
  classId: number | null;
  consultantUserId: number | null;
  duplicates: { studentId: number; studentCode: string; fullName: string; dob: string | null; matchOn: string[] }[];
  /** create | link | skip — người dùng chọn ở bước duplicate review. */
  decision: 'create' | 'link' | 'skip';
  linkStudentId: number | null;
};

/** dd/mm/yyyy, yyyy-mm-dd và Date từ Excel. Không tự đoán các dạng mơ hồ khác. */
export function parseDob(raw: unknown): { value: string | null; error?: string } {
  if (raw === null || raw === undefined || raw === '') return { value: null, error: 'Thiếu ngày sinh' };
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return { value: raw.toISOString().slice(0, 10) };
  }
  const s = String(raw).trim();
  let m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(s);
  if (m) {
    const [, d, mo, y] = m;
    const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    if (Number(mo) > 12) return { value: null, error: `Ngày sinh "${s}" không hợp lệ (tháng > 12)` };
    return isIsoDate(iso) ? { value: iso } : { value: null, error: `Ngày sinh "${s}" không hợp lệ` };
  }
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return isIsoDate(s) ? { value: s } : { value: null, error: `Ngày sinh "${s}" không hợp lệ` };
  return { value: null, error: `Ngày sinh "${s}" không rõ định dạng — dùng dd/mm/yyyy` };
}

export function validateStudentImport(
  p: Principal,
  rows: Record<string, unknown>[],
  mapping: Record<string, string>,
): { rows: ImportRowResult[]; summary: any } {
  const conn = db();
  const scope = viewScope(p, PERMISSIONS.STUDENT_IMPORT);
  const results: ImportRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const get = (field: string) => {
      const col = mapping[field];
      if (!col) return '';
      const v = raw[col];
      return v === null || v === undefined ? '' : v;
    };

    const errors: string[] = [];
    const warnings: string[] = [];
    const fullName = String(get('fullName') ?? '').trim();
    const classCode = String(get('className') ?? '').trim();
    const dobParsed = parseDob(get('dob'));
    if (!fullName) errors.push('Thiếu họ tên');
    if (!classCode) errors.push('Thiếu lớp');
    if (dobParsed.error) errors.push(dobParsed.error);

    let classId: number | null = null;
    if (classCode) {
      const cls = conn
        .prepare('SELECT id, branch_id, code FROM classes WHERE UPPER(code) = UPPER(?) OR name = ?')
        .get(classCode, classCode) as any;
      if (!cls) errors.push(`Lớp "${classCode}" không tồn tại`);
      else if (!can(p, PERMISSIONS.STUDENT_IMPORT, { classId: cls.id })) {
        errors.push(`Lớp "${classCode}" nằm ngoài phạm vi bạn được cấp quyền`);
      } else classId = cls.id;
    }

    const targetRaw = String(get('targetBand') ?? '').trim().replace(',', '.');
    let targetBand: number | null = null;
    if (targetRaw) {
      const n = Number(targetRaw);
      if (!Number.isFinite(n) || n < 0 || n > 9) warnings.push(`Target "${targetRaw}" không hợp lệ, sẽ bỏ qua`);
      else targetBand = n;
    }

    const consultantRaw = String(get('consultant') ?? '').trim();
    let consultantUserId: number | null = null;
    if (consultantRaw) {
      const u = conn
        .prepare(
          `SELECT u.id FROM users u
             WHERE (u.full_name = ? OR u.code = ?) AND u.status = 'active'
               AND EXISTS (SELECT 1 FROM user_role_grants g JOIN roles r ON r.id = g.role_id
                            WHERE g.user_id = u.id AND r.key IN ('consultant','consultant_manager'))`,
        )
        .get(consultantRaw, consultantRaw) as any;
      if (!u) errors.push(`Tư vấn viên "${consultantRaw}" không hợp lệ`);
      else consultantUserId = u.id;
    }

    const skillsRaw = String(get('skills') ?? '').trim();
    let skills: string[] | null = null;
    if (skillsRaw) {
      const parts = skillsRaw.split(/[,;|]/).map((s) => normalizeName(s).replace(/\s+/g, ''));
      const mapped = parts
        .map((s) => TEACHING_SKILLS.find((k) => k.toLowerCase() === s || k.toLowerCase().replace(/\d/, '') === s))
        .filter(Boolean) as string[];
      if (mapped.length !== parts.length) warnings.push(`Một số skill trong "${skillsRaw}" không nhận diện được`);
      skills = mapped.length ? [...new Set(mapped)] : null;
    }

    // Dò trùng: chỉ tạo candidate, KHÔNG tự merge.
    const duplicates: ImportRowResult['duplicates'] = [];
    if (fullName) {
      const cands = conn
        .prepare(`SELECT id, student_code, full_name, dob, branch_id FROM students WHERE normalized_name = ?`)
        .all(normalizeName(fullName)) as any[];
      for (const c of cands) {
        const matchOn = ['Họ tên'];
        if (dobParsed.value && c.dob === dobParsed.value) matchOn.push('Ngày sinh');
        if (classId) {
          const sameClass = conn
            .prepare('SELECT 1 AS x FROM enrollments WHERE student_id = ? AND class_id = ?')
            .get(c.id, classId) as any;
          if (sameClass) matchOn.push('Lớp');
        }
        duplicates.push({ studentId: c.id, studentCode: c.student_code, fullName: c.full_name, dob: c.dob, matchOn });
      }
    }

    results.push({
      rowIndex: i,
      raw,
      value: { className: classCode, fullName, dob: dobParsed.value, targetBand, consultant: consultantRaw || null, skills },
      errors, warnings, classId, consultantUserId, duplicates,
      decision: errors.length ? 'skip' : duplicates.length ? 'link' : 'create',
      linkStudentId: duplicates.length ? duplicates[0].studentId : null,
    });
  }

  return {
    rows: results,
    summary: {
      total: results.length,
      valid: results.filter((r) => !r.errors.length).length,
      errors: results.filter((r) => r.errors.length).length,
      duplicates: results.filter((r) => r.duplicates.length).length,
      warnings: results.filter((r) => r.warnings.length).length,
      scopeAll: scope.all,
    },
  };
}

export type CommitDecision = { rowIndex: number; decision: 'create' | 'link' | 'skip'; linkStudentId?: number | null };

/**
 * Commit trong một transaction, backend validate lại toàn bộ.
 * `token` chống double-click: cùng token chỉ commit đúng một lần.
 */
export function commitStudentImport(
  p: Principal,
  args: { token: string; fileName: string; rows: Record<string, unknown>[]; mapping: Record<string, string>; decisions: CommitDecision[] },
) {
  require_(p, PERMISSIONS.STUDENT_IMPORT, {}, 'Bạn không có quyền nhập dữ liệu học viên.');
  if (!args.token) throw badRequest('Thiếu mã phiên import.');

  const existing = db().prepare('SELECT * FROM import_batches WHERE token = ?').get(args.token) as any;
  if (existing) return { alreadyCommitted: true, ...JSON.parse(existing.summary_json) };

  const validated = validateStudentImport(p, args.rows, args.mapping);
  const decisionMap = new Map(args.decisions.map((d) => [d.rowIndex, d]));

  return tx(() => {
    const conn = db();
    const created: any[] = [];
    const linked: any[] = [];
    const skipped: any[] = [];

    for (const row of validated.rows) {
      const decision = decisionMap.get(row.rowIndex) ?? { rowIndex: row.rowIndex, decision: row.decision, linkStudentId: row.linkStudentId };
      if (row.errors.length || decision.decision === 'skip') {
        skipped.push({ rowIndex: row.rowIndex, name: row.value.fullName, reason: row.errors[0] ?? 'Người dùng chọn bỏ qua' });
        continue;
      }
      if (!row.classId) {
        skipped.push({ rowIndex: row.rowIndex, name: row.value.fullName, reason: 'Không xác định được lớp' });
        continue;
      }
      const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(row.classId) as any;

      let studentId: number;
      if (decision.decision === 'link') {
        if (!decision.linkStudentId) throw badRequest(`Dòng ${row.rowIndex + 1}: chưa chọn học viên để liên kết.`);
        const target = conn.prepare('SELECT * FROM students WHERE id = ?').get(decision.linkStudentId) as any;
        if (!target) throw notFound(`Dòng ${row.rowIndex + 1}: học viên liên kết không tồn tại.`);
        require_(p, PERMISSIONS.STUDENT_IMPORT, { studentId: target.id },
          `Dòng ${row.rowIndex + 1}: học viên liên kết nằm ngoài phạm vi bạn được cấp quyền.`);
        studentId = target.id;
        // Liên kết chỉ thêm enrollment mới, không ghi đè tên/DOB/lịch sử cũ.
        linked.push({ rowIndex: row.rowIndex, studentId, studentCode: target.student_code, name: target.full_name });
      } else {
        const code = nextStudentCode();
        const info = conn
          .prepare(
            `INSERT INTO students (student_code, full_name, normalized_name, dob, target_band, branch_id, status, created_at)
             VALUES (?,?,?,?,?,?, 'active', ?)`,
          )
          .run(code, row.value.fullName, normalizeName(row.value.fullName), row.value.dob,
               row.value.targetBand, cls.branch_id, nowIso());
        studentId = Number(info.lastInsertRowid);
        created.push({ rowIndex: row.rowIndex, studentId, studentCode: code, name: row.value.fullName });
      }

      const priorAttempts = (conn
        .prepare('SELECT COUNT(*) AS n FROM enrollments WHERE student_id = ? AND class_id = ?')
        .get(studentId, row.classId) as any).n as number;
      const enrInfo = conn
        .prepare(
          `INSERT INTO enrollments (student_id, class_id, status, attempt_no, enrolled_at, starts_at, note, created_at)
           VALUES (?,?,'active',?,?,?,?,?)`,
        )
        .run(studentId, row.classId, priorAttempts + 1, demoToday(), demoToday(), `Nhập từ ${args.fileName}`, nowIso());
      const enrollmentId = Number(enrInfo.lastInsertRowid);

      const classSkills = conn.prepare('SELECT skill FROM class_skill_config WHERE class_id = ?').all(row.classId) as any[];
      for (const cs of classSkills) {
        const registered = row.value.skills ? (row.value.skills.includes(cs.skill) ? 1 : 0) : 1;
        conn
          .prepare('INSERT INTO enrollment_skills (enrollment_id, skill, registered) VALUES (?,?,?)')
          .run(enrollmentId, cs.skill, registered);
      }

      if (row.consultantUserId) {
        conn
          .prepare(
            `INSERT INTO consultant_assignments (user_id, student_id, effective_from, status, created_at)
             VALUES (?,?,?, 'active', ?)`,
          )
          .run(row.consultantUserId, studentId, demoToday(), nowIso());
      }

      addJourneyEvent({
        studentId, enrollmentId, eventType: 'enrollment_start', eventDate: demoToday(),
        title: `Bắt đầu học lớp ${cls.code}`, detail: `Nhập từ tệp ${args.fileName}`, createdBy: p.userId,
      });
    }

    const summary = {
      created: created.length, linked: linked.length, skipped: skipped.length,
      createdRows: created, linkedRows: linked, skippedRows: skipped, fileName: args.fileName,
    };
    conn
      .prepare(
        `INSERT INTO import_batches (token, kind, file_name, status, created_count, linked_count, skipped_count, summary_json, actor_user_id, created_at)
         VALUES (?,?,?,'committed',?,?,?,?,?,?)`,
      )
      .run(args.token, 'students', args.fileName, created.length, linked.length, skipped.length, JSON.stringify(summary), p.userId, nowIso());
    writeAudit({
      actorUserId: p.userId, action: 'import.students.commit', entityType: 'import_batch',
      entityLabel: args.fileName, after: { created: created.length, linked: linked.length, skipped: skipped.length },
    });
    return { alreadyCommitted: false, ...summary };
  });
}

/** File mẫu để tải: một bản sạch, một bản có lỗi cố ý. */
export function buildSampleWorkbook(kind: 'clean' | 'errors'): Buffer {
  const conn = db();
  const classes = conn.prepare("SELECT code FROM classes WHERE status = 'active' ORDER BY code LIMIT 3").all() as any[];
  const c0 = classes[0]?.code ?? 'FT-A01';
  const c1 = classes[1]?.code ?? 'NM-A01';

  const clean = [
    { 'Lớp': c0, 'Họ tên': 'Nguyễn Minh Khôi', 'Ngày sinh': '14/03/2007', 'Target': '6.5', 'Tư vấn viên': '', 'Skill đăng ký': '' },
    { 'Lớp': c0, 'Họ tên': 'Trần Thảo Vy', 'Ngày sinh': '02/11/2006', 'Target': '7.0', 'Tư vấn viên': '', 'Skill đăng ký': 'Listening, Speaking' },
    { 'Lớp': c1, 'Họ tên': 'Lê Gia Bảo', 'Ngày sinh': '28/07/2008', 'Target': '6.0', 'Tư vấn viên': '', 'Skill đăng ký': '' },
  ];
  const withErrors = [
    { 'Lớp': c0, 'Họ tên': 'Phạm Hà An', 'Ngày sinh': '05/09/2007', 'Target': '6.5', 'Tư vấn viên': '', 'Skill đăng ký': '' },
    { 'Lớp': c0, 'Họ tên': '', 'Ngày sinh': '11/01/2007', 'Target': '6.0', 'Tư vấn viên': '', 'Skill đăng ký': '' },
    { 'Lớp': 'KHONG-TON-TAI', 'Họ tên': 'Đỗ Nhật Nam', 'Ngày sinh': '19/04/2006', 'Target': '7.0', 'Tư vấn viên': '', 'Skill đăng ký': '' },
    { 'Lớp': c0, 'Họ tên': 'Vũ Khánh Linh', 'Ngày sinh': '30/13/2007', 'Target': '6.5', 'Tư vấn viên': '', 'Skill đăng ký': '' },
    { 'Lớp': c1, 'Họ tên': 'Hoàng Bảo Ngọc', 'Ngày sinh': '22/06/2008', 'Target': '12', 'Tư vấn viên': 'Người Không Có Thật', 'Skill đăng ký': '' },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kind === 'clean' ? clean : withErrors), 'HocVien');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
