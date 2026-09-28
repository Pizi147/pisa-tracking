import { db, tx } from '../db.ts';
import {
  CHO_TAO_PRE_FOU, ENTRY_SKILLS, MOCK_FT_STUDY_WEEK, PERMISSIONS, PROGRAMME_TEMPLATES, chuanHoaMaLop, ghepMaLop, khoaMaLopSql, kiemSoLop,
  moRongPhanCong, programmeOf, type Route, type SlotPhanCong,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { docSlots, ghiPhanCong, kiemTruocPhanCong } from './classes.ts';
import { allProgrammes, mocChupVaoLop, programmeByCode } from '../normal/regular.ts';
import { activeRouteCodes } from '../platform/sysconfig.ts';
import { addDays, badRequest, isIsoDate, normalizeName, notFound, nowIso, padCode } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { ensurePeriod, mondayOf, periodById } from '../platform/week.ts';
import { ensureSkillRows } from '../fasttrack/skillSchedule.ts';

/**
 * Thêm học viên hàng loạt.
 *
 * Dán từ Excel/Google Sheets (TSV) hoặc nhập tay. Server validate lại từng dòng theo phạm vi
 * quyền, chạy trong một transaction và có khoá idempotency để bấm hai lần hoặc thử lại
 * không tạo bản ghi trùng.
 */
/**
 * CỘT CỦA BẢNG NHẬP THEO ĐÚNG CHƯƠNG TRÌNH CỦA LỚP (mục 12.1).
 *
 *   Fast Track  Họ tên · Ngày sinh · OVR đầu vào · L · R · W · S đầu vào · Target · Tuần bắt đầu
 *   Normal      Họ tên · Ngày sinh · OVR đầu vào · Tuần bắt đầu
 *
 * LỚP KHÔNG CÒN LÀ MỘT CỘT. Nó được chọn MỘT LẦN ở đầu panel, và cả lô vào lớp đó. Bản
 * trước để lớp thành một cột dán, nên một file bốn mươi dòng gõ sai mã lớp ở dòng ba mươi
 * là ba mươi em vào đúng lớp còn mười em rơi đi đâu không ai biết. Lớp là quyết định của cả
 * lô, không phải một ô dữ liệu lặp lại bốn mươi lần.
 *
 * KHÔNG BÀY TRƯỜNG CỦA FAST TRACK CHO LỚP NORMAL rồi bắt người dùng điền dấu '-'. Em lớp
 * Foundation không có target IELTS và không có band từng kỹ năng; hỏi là hỏi thừa, và một
 * cột thừa luôn được ai đó điền bừa.
 */
export type IntakeRow = {
  fullName?: string;
  /**
   * Chỉ còn để ĐỌC file cũ. Bảng dán của các chi nhánh vẫn hay có cột "Lớp", và bỏ hẳn alias
   * thì cột đó bị hiểu nhầm thành cột bên cạnh — đúng kiểu "silently shift cột" mà mục 12.1
   * cấm. Nên vẫn nhận diện, nhưng KHÔNG dùng: lớp lấy từ ô chọn ở đầu panel.
   */
  classCode?: string;
  dob?: string;
  /**
   * OVR ĐẦU VÀO — con số trên phiếu điểm chính thức, nhập ĐỘC LẬP với bốn môn bên dưới.
   * Thiếu vài môn không được lấy OVR lấp vào, và có đủ bốn môn cũng không ghi đè OVR.
   */
  baselineScore?: number | string | null;
  /** Band đầu vào từng kỹ năng — chỉ lớp Fast Track. W là Writing TỔNG, không chia W1/W2. */
  entryListening?: number | string | null;
  entryReading?: number | string | null;
  entryWriting?: number | string | null;
  entrySpeaking?: number | string | null;
  target?: number | string | null;
  /** Thứ Hai của TUẦN BẮT ĐẦU HỌC. Có mặc định cho cả lô, ghi đè được từng dòng. */
  startWeek?: string;
  /* Mã cũ, còn đọc được từ file: ngày bắt đầu, tháng thi, lộ trình, tư vấn viên. */
  examMonth?: string;
  route?: string;
  consultant?: string;
  startDate?: string;
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
  /** Chương trình của lớp đã chọn — giao diện bày đúng bộ cột của nó (mục 12.1). */
  programme: string | null;
  /** Lớp chấm điểm đạt/tổng (Normal) hay band IELTS (Fast Track). */
  ratio: boolean;
  classCode: string | null;
  defaultStartWeek?: string | null;
};

const HEADER_ALIASES: Record<string, keyof IntakeRow> = {
  'ho ten': 'fullName', 'hoten': 'fullName', 'ten': 'fullName', 'full name': 'fullName', 'name': 'fullName',
  /* Nhận diện để KHÔNG đọc lệch cột, rồi bỏ qua — lớp chọn ở đầu panel (mục 12.1). */
  'lop': 'classCode', 'ma lop': 'classCode', 'class': 'classCode',
  'ngay sinh': 'dob', 'dob': 'dob',
  /* Band đầu vào từng kỹ năng của Fast Track. */
  'l': 'entryListening', 'listening': 'entryListening', 'nghe': 'entryListening',
  'r': 'entryReading', 'reading': 'entryReading', 'doc': 'entryReading',
  'w': 'entryWriting', 'writing': 'entryWriting', 'viet': 'entryWriting',
  's': 'entrySpeaking', 'speaking': 'entrySpeaking', 'noi': 'entrySpeaking',
  'tuan bat dau': 'startWeek', 'tuan hoc dau tien': 'startWeek', 'start week': 'startWeek',
  'thang thi': 'examMonth', 'thang du kien thi': 'examMonth', 'du kien thi': 'examMonth',
  'ngay thi': 'examMonth', 'ngay thi ielts': 'examMonth', 'exam': 'examMonth', 'exam date': 'examMonth',
  'lo trinh': 'route', 'route': 'route',
  'target': 'target', 'diem cam ket': 'target', 'cam ket': 'target',
  'diem dau vao': 'baselineScore', 'dau vao': 'baselineScore', 'ovr': 'baselineScore',
  'diem ovr': 'baselineScore', 'baseline': 'baselineScore', 'entry': 'baselineScore',
  'tu van vien': 'consultant', 'tvv': 'consultant', 'consultant': 'consultant',
  'ngay bat dau': 'startDate', 'bat dau': 'startDate',
};

/**
 * ĐIỂM ĐẦU VÀO — ưu tiên OVR, và bỏ qua chứ KHÔNG báo lỗi khi ô để trống.
 *
 * Owner nói rõ: không phải em nào cũng có điểm đầu vào, bổ sung sau được. Bắt lỗi ở đây thì
 * một bảng bốn mươi em có ba ô trống là cả bảng không nhập được.
 */
function baselineOf(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const raw = String(v).trim();
  /*
   * DẤU '-' VÀ Ô TRỐNG ĐỀU LÀ "CHƯA CÓ THÔNG TIN", KHÔNG PHẢI 0 (mục 12.1).
   *
   * File của các chi nhánh gõ '-' cho ô chưa có là chuyện thường. Đọc nó thành 0 thì em đó
   * vào hệ thống với điểm đầu vào 0 — và mọi biểu đồ tiến bộ về sau đều kể một câu chuyện
   * sai ngay từ điểm xuất phát.
   */
  if (raw === '' || raw === '-' || raw === '–' || raw === '—' || raw === 'n/a' || raw === 'N/A') return null;
  const n = Number(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 9) return null;
  return n;
}

/** Band 0–9 bước 0,5. Trả về `'invalid'` để nơi gọi báo lỗi tại đúng ô, không im lặng bỏ qua. */
function bandOf(v: number | string | null | undefined): number | null | 'invalid' {
  if (v === null || v === undefined) return null;
  const raw = String(v).trim();
  if (raw === '' || raw === '-' || raw === '–' || raw === '—' || raw === 'n/a' || raw === 'N/A') return null;
  const n = Number(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 9) return 'invalid';
  if (Math.round(n * 2) !== n * 2) return 'invalid';
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
  /*
   * THỨ TỰ MẶC ĐỊNH KHI BẢNG DÁN KHÔNG CÓ DÒNG TIÊU ĐỀ — đúng thứ tự cột của Fast Track ở
   * mục 12.1. Lớp Normal dán ít cột hơn thì bốn cột band cuối để trống, và phần xem trước
   * sẽ nói rõ nếu chúng có dữ liệu mà lớp không dùng tới.
   */
  const order: (keyof IntakeRow | undefined)[] = usedHeader
    ? mapped
    : ['fullName', 'dob', 'baselineScore', 'entryListening', 'entryReading',
       'entryWriting', 'entrySpeaking', 'target', 'startWeek'];

  const out: IntakeRow[] = [];
  for (const line of lines.slice(usedHeader ? 1 : 0)) {
    const cells = split(line);
    const row: IntakeRow = {};
    order.forEach((key, i) => {
      if (!key) return;
      const v = cells[i];
      if (v === undefined || v === '') return;
      (row as any)[key] = v;
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
  input: {
    rows: IntakeRow[];
    /** Lớp của CẢ LÔ, chọn một lần ở đầu panel (mục 12.1). */
    classId?: number | null;
    /** Tuần bắt đầu mặc định cho cả lô; từng dòng vẫn ghi đè được. */
    defaultStartWeek?: string | null;
    dateFormat?: 'dmy' | 'mdy' | 'iso';
    /* Tên cũ của `classId`, giữ để đường gọi cũ không gãy. */
    defaultClassId?: number | null;
  },
): IntakePreview {
  const conn = db();
  const fmt = input.dateFormat ?? 'dmy';
  const issues: RowIssue[] = [];

  /*
   * LỚP LÀ QUYẾT ĐỊNH CỦA CẢ LÔ, không phải một ô lặp lại ở từng dòng (mục 12.1).
   * Thiếu lớp thì không soát được gì có ý nghĩa — chương trình của lớp quyết định bảng này
   * có những cột nào và cột nào hợp lệ.
   */
  const classId = input.classId ?? input.defaultClassId ?? null;
  const cls = classId
    ? (conn.prepare("SELECT id, code, route, start_date, programme_code, branch_id, status FROM classes WHERE id = ?")
        .get(classId) as any)
    : null;
  if (!cls) {
    return {
      rows: [], issues: [{ row: 0, field: 'classId', message: 'Chưa chọn lớp cho lô này.' }],
      canPlanWeeks: false, programme: null, ratio: false, classCode: null,
    };
  }
  if (!can(p, PERMISSIONS.STUDENT_EDIT, { classId: cls.id })) {
    return {
      rows: [],
      issues: [{ row: 0, field: 'classId', message: `Lớp ${cls.code} nằm ngoài phạm vi bạn được cấp quyền.` }],
      canPlanWeeks: false, programme: cls.programme_code ?? null, ratio: false, classCode: cls.code,
    };
  }

  /* Chương trình quyết định bộ cột: Fast Track có band từng kỹ năng và target, Normal không. */
  const pc = cls.programme_code ? programmeOf(cls.programme_code) ?? 'FT' : null;
  const ratio = ((pc ? programmeByCode(pc)?.scoringMode ?? PROGRAMME_TEMPLATES[pc]?.scoringMode : null) ?? 'ielts_band') === 'ratio';

  const defaultWeek = input.defaultStartWeek
    ? mondayOf(input.defaultStartWeek)
    : (cls.start_date ? mondayOf(cls.start_date) : null);

  const rows = input.rows.map((r, i) => {
    const rowNo = i + 1;
    const rowIssues: RowIssue[] = [];
    const name = (r.fullName ?? '').trim();
    /*
     * THIẾU TÊN LÀ LỖI TẠI DÒNG ĐÓ, không phải lý do tạo một em tên '-' (mục 12.1).
     * Dòng hỏng vẫn nằm lại trong lưới để người nhập sửa; cả lô không vì thế mà hỏng.
     */
    if (!name || name === '-') rowIssues.push({ row: rowNo, field: 'fullName', message: 'Thiếu họ tên' });

    const dob = parseDateAs(r.dob, fmt);
    if (dob === 'invalid') rowIssues.push({ row: rowNo, field: 'dob', message: `Ngày sinh "${r.dob}" không đọc được` });

    /* OVR đầu vào: sai định dạng thì báo tại ô, không im lặng bỏ qua rồi ghi trống. */
    const ovrRaw = r.baselineScore;
    const ovr = bandOf(ovrRaw);
    if (ovr === 'invalid') {
      rowIssues.push({ row: rowNo, field: 'baselineScore', message: `OVR "${ovrRaw}" phải là band 0–9 bước 0,5` });
    }

    /* BỐN BAND ĐẦU VÀO — chỉ Fast Track. Lớp Normal có dữ liệu ở đây là do dán nhầm cột. */
    const entry: Record<string, number | null> = {};
    const ENTRY: [keyof IntakeRow, string, string][] = [
      ['entryListening', 'entryListening', 'L'],
      ['entryReading', 'entryReading', 'R'],
      ['entryWriting', 'entryWriting', 'W'],
      ['entrySpeaking', 'entrySpeaking', 'S'],
    ];
    for (const [key, field, label] of ENTRY) {
      const v = bandOf(r[key] as any);
      if (v === 'invalid') {
        rowIssues.push({ row: rowNo, field, message: `${label} đầu vào phải là band 0–9 bước 0,5` });
        entry[field] = null;
      } else if (v !== null && ratio) {
        rowIssues.push({
          row: rowNo, field,
          message: `Lớp ${cls.code} không chấm band IELTS — bỏ cột ${label} đầu vào đi`,
        });
        entry[field] = null;
      } else entry[field] = v;
    }

    /* TARGET — chỉ Fast Track. Lớp Normal không có mục tiêu IELTS. */
    const target = bandOf(r.target);
    if (target === 'invalid') {
      rowIssues.push({ row: rowNo, field: 'target', message: 'Target phải là band 0–9 bước 0,5' });
    } else if (target !== null && ratio) {
      rowIssues.push({ row: rowNo, field: 'target', message: `Lớp ${cls.code} không có target IELTS` });
    }

    /* TUẦN BẮT ĐẦU: ô trống thì dùng mặc định của cả lô. */
    const weekRaw = (r.startWeek ?? r.startDate ?? '').toString().trim();
    let startWeek: string | null = defaultWeek;
    if (weekRaw) {
      const d = parseDateAs(weekRaw, fmt);
      if (d === 'invalid' || !d) {
        rowIssues.push({ row: rowNo, field: 'startWeek', message: `Tuần bắt đầu "${weekRaw}" không đọc được` });
      } else startWeek = mondayOf(d);
    }
    if (!startWeek) {
      rowIssues.push({ row: rowNo, field: 'startWeek', message: 'Chưa có tuần bắt đầu, và lớp cũng chưa khai ngày bắt đầu' });
    }

    /*
     * CẢNH BÁO TRÙNG HỒ SƠ — dựa trên TÊN VÀ NGÀY SINH, và chỉ là gợi ý.
     *
     * Trùng mỗi tên thì KHÔNG gộp: "Nguyễn Văn An" là một cái tên rất nhiều người mang. Em
     * đã có hồ sơ thì nên dùng ghi danh hoặc chuyển lớp, chứ tạo mã mới là chẻ lịch sử của
     * một đứa trẻ thành hai hồ sơ không ai nối lại được.
     */
    const duplicates = name
      ? (conn
          .prepare(
            `SELECT id, student_code, full_name, dob FROM students
              WHERE normalized_name = ? ${dob && dob !== 'invalid' ? 'AND dob = ?' : ''} LIMIT 5`,
          )
          .all(...(dob && dob !== 'invalid' ? [normalizeName(name), dob] : [normalizeName(name)])) as any[])
      : [];

    const warnings: RowIssue[] = [];
    if (!ratio && target === null) {
      warnings.push({ row: rowNo, field: 'target', message: 'Chưa có target — nhập được nhưng chưa tính được kỳ vọng' });
    }
    if (r.classCode && r.classCode.trim() && r.classCode.trim().toLowerCase() !== cls.code.toLowerCase()) {
      warnings.push({
        row: rowNo, field: 'classCode',
        message: `Bỏ qua cột lớp "${r.classCode}" — cả lô này vào ${cls.code} theo ô chọn ở trên`,
      });
    }
    if (duplicates.length) {
      warnings.push({
        row: rowNo, field: 'fullName',
        message: `Có thể trùng hồ sơ ${duplicates.map((d) => d.student_code).join(', ')} — kiểm lại trước khi tạo mã mới`,
      });
    }

    issues.push(...rowIssues, ...warnings);
    return {
      row: rowNo,
      fullName: name,
      classCode: cls.code,
      classId: cls.id,
      dob: dob === 'invalid' ? undefined : dob ?? undefined,
      baselineScore: ovr === 'invalid' ? null : ovr,
      entryListening: entry.entryListening ?? null,
      entryReading: entry.entryReading ?? null,
      entryWriting: entry.entryWriting ?? null,
      entrySpeaking: entry.entrySpeaking ?? null,
      target: target === 'invalid' ? null : target,
      startWeek: startWeek ?? undefined,
      duplicates: duplicates.map((d) => ({ id: d.id, studentCode: d.student_code, fullName: d.full_name, dob: d.dob })),
      issues: [...rowIssues, ...warnings],
    };
  });

  return {
    rows, issues,
    /* Nhập hàng loạt KHÔNG lập lịch MT (mục 12.1) — đó là việc của Quản lý ở panel Lộ trình. */
    canPlanWeeks: false,
    programme: cls.programme_code ?? null,
    ratio,
    classCode: cls.code,
    defaultStartWeek: defaultWeek,
  };
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
    rows: IntakeRow[];
    classId?: number | null; defaultStartWeek?: string | null;
    defaultClassId?: number | null;
    dateFormat?: 'dmy' | 'mdy' | 'iso';
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
      const startWeek = r.startWeek ?? cls.start_date ?? nowIso().slice(0, 10);
      const startedAt = startWeek;

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
        /*
         * OVR VÀ BỐN BAND LÀ HAI NGUỒN KHÁC NHAU (mục 12.1).
         *
         * OVR là con số trên phiếu điểm; bốn band là bốn con số cũng trên phiếu đó. Không
         * suy cái này ra cái kia: thiếu vài môn thì để trống đúng những môn thiếu, và có đủ
         * bốn môn cũng không tính lại OVR — làm tròn của IELTS không phải trung bình cộng.
         */
        const ovr = baselineOf(r.baselineScore);
        const bands = {
          l: baselineOf(r.entryListening), r: baselineOf(r.entryReading),
          w: baselineOf(r.entryWriting), s: baselineOf(r.entrySpeaking),
        };
        const hasEntry = ovr !== null || bands.l !== null || bands.r !== null
          || bands.w !== null || bands.s !== null;
        const cyc = conn
          .prepare(
            `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, exam_month,
                                          baseline_score, baseline_source,
                                          baseline_listening, baseline_reading, baseline_writing, baseline_speaking,
                                          start_period_id, started_at, status, created_at)
             VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
          )
          /* TUẦN BẮT ĐẦU HỌC lấy từ ô của dòng, hoặc mặc định của cả lô (mục 12.1). */
          .run(sid, route, cls.programme_code ?? null, r.target ?? null, r.examMonth ?? null,
               ovr, hasEntry ? 'entrance' : null,
               bands.l, bands.r, bands.w, bands.s,
               ensurePeriod(startWeek).id, startedAt, nowIso());
        addJourney({ studentId: sid, eventType: 'cycle_start', eventDate: startedAt,
          title: route ? `Bắt đầu lộ trình ${route}` : 'Bắt đầu khoá học',
          detail: r.target ? `Target ${r.target}` : 'Chưa có target',
          refTable: 'learning_cycles', refId: Number(cyc.lastInsertRowid), createdBy: p.userId });

        /*
         * NHẬP HÀNG LOẠT KHÔNG LẬP LỊCH MT (mục 12.1).
         *
         * Trước đây file dán có cột "Tuần MT" thì đường này tạo luôn các lượt thi. Nghe thì
         * tiện, nhưng nó biến ô nhập danh sách thành một lối vòng quanh quyền xếp lịch: ai
         * dán được file là xếp được lịch thi cho cả lớp. Lịch MT là việc của Quản lý, ở panel
         * Lộ trình, nơi có đủ ràng buộc thứ tự đợt và cảnh báo khoảng cách.
         */
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

/**
 * GHI một lớp mới — hàm nội bộ (seed, phép kiểm, Chuyển tiếp); đường Tạo lớp của người dùng đi qua `taoLopVaPhanCong` (kiểm mẫu
 * tên đầy đủ + phân công). Kỹ năng lấy theo cấu hình gửi lên, không suy từ tên lớp.
 */
export function createClass(p: Principal, input: {
  code: string; branchId: number; kind: string; route?: Route | null;
  isFastTrack?: boolean; startDate?: string | null; skills?: string[]; note?: string | null;
  /** Tuần khai giảng — với lớp Normal đây là mốc gốc của hai kỳ kiểm tra. */
  startPeriodId?: number | null;
  /** Lớp này học tiếp từ lớp nào — giữ sợi dây FOU → BE → FT. */
  previousClassId?: number | null;
}) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { branchId: input.branchId }, 'Bạn không có quyền tạo lớp ở chi nhánh này.');
  const conn = db();
  const branch = conn.prepare('SELECT * FROM branches WHERE id = ?').get(input.branchId) as any;
  if (!branch) throw notFound('Không tìm thấy chi nhánh');
  const code = (input.code ?? '').trim();
  if (!code) throw badRequest('Cần mã lớp.');
  // Mã lớp luôn bắt đầu bằng mã chi nhánh — nhận tên cũ `CN-` lẫn mới `CN ` (Q5).
  if (!new RegExp(`^${branch.code}[\\s-]`, 'i').test(code)) {
    throw badRequest(`Mã lớp phải bắt đầu bằng "${branch.code} ", ví dụ ${branch.code} FT 101.`);
  }
  // Trùng so bằng mã chuẩn hoá (bỏ "-", khoảng trắng, hoa/thường) — khớp chỉ mục ux_classes_ma_chuan (Q3, K5-68).
  if (conn.prepare(`SELECT id FROM classes WHERE ${khoaMaLopSql()} = ?`).get(chuanHoaMaLop(code))) throw badRequest(`Đã có lớp ${code}.`);
  if (input.startDate && !isIsoDate(input.startDate)) throw badRequest('Ngày khai giảng không hợp lệ.');
  const ct = programmeOf(input.kind ?? 'FT');

  return tx(() => {
    const info = conn
      .prepare(
        /*
         * MÃ CHƯƠNG TRÌNH ghi thẳng lúc tạo, không để suy sau từ tên lớp.
         *
         * Thiếu nó thì hệ thống không biết lớp chấm theo band hay theo tỷ lệ, và trang lớp
         * dựng ra bảng band IELTS cho một lớp Foundation — lỗi im lặng đã từng xảy ra.
         */
        `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track,
                              start_date, start_period_id, previous_class_id, status, note, created_at,
                              so_tuan, tuan_giua_khoa, tuan_cuoi_khoa)
         VALUES (?,?,?,?,?,?,?,?,?, 'active', ?, ?, ?,?,?)`,
      )
      .run(code, input.branchId, (input.kind ?? 'FT').trim(),
           ct, input.route ?? null,
           input.isFastTrack ? 1 : 0, input.startDate ?? null, input.startPeriodId ?? null,
           input.previousClassId ?? null,
           input.note ?? null, nowIso(),
           ...mocChupVaoLop(ct));   // PF1: lớp giữ số tuần lúc tạo — Quản trị sửa sau chỉ áp lớp mở sau
    const id = Number(info.lastInsertRowid);
    /* Không khai kỹ năng thì lấy ĐÚNG bộ môn của chương trình lớp đó (bảng `programmes`, K5-45), không mặc định bộ FT. */
    const fallback = allProgrammes().get(ct ?? '')?.skills
      ?? (ct ? PROGRAMME_TEMPLATES[ct]?.skills : null) ?? ENTRY_SKILLS;
    for (const skill of input.skills?.length ? input.skills : fallback) {
      conn.prepare('INSERT INTO class_skills (class_id, skill, sessions_per_week) VALUES (?,?,1)').run(id, skill);
    }
    writeAudit({ actorUserId: p.userId, action: 'class.create', entityType: 'class', entityId: id,
      entityLabel: code, after: input });
    return conn.prepare('SELECT * FROM classes WHERE id = ?').get(id);
  });
}

export type TaoLopInput = {
  branchId: number; chuongTrinh: string; loTrinh?: string | null; so: string;
  startPeriodId?: number | null; slots?: SlotPhanCong[]; previousClassId?: number | null; note?: string | null;
};

/**
 * YC-1/T5/L4: TẠO LỚP = MỘT lệnh, MỘT giao dịch (lớp + phân công). Tên lớp do máy ghép `{CN} {ký hiệu} {số}` (T1); kiểm tên + ba
 * luật phân công TRƯỚC, sai thì không ghi gì — không còn "lớp tàng hình" không ai phụ trách. Thiếu phân công vẫn tạo được (L4).
 */
export function taoLopVaPhanCong(p: Principal, input: TaoLopInput): { id: number; code: string } {
  require_(p, PERMISSIONS.STUDENT_EDIT, { branchId: input.branchId }, 'Bạn không có quyền tạo lớp ở chi nhánh này.');
  const slots0 = docSlots(input.slots);
  if (slots0.length) require_(p, PERMISSIONS.CLASS_ASSIGN, { branchId: input.branchId }, 'Bạn không có quyền phân công giáo viên ở chi nhánh này.');
  const conn = db();
  const branch = conn.prepare('SELECT * FROM branches WHERE id = ?').get(input.branchId) as any;
  if (!branch) throw notFound('Không tìm thấy chi nhánh');
  const ct = programmeOf(String(input.chuongTrinh ?? ''));
  const prog = ct ? allProgrammes().get(ct) : null;
  if (!ct || !prog) throw badRequest('Chọn chương trình của lớp.');
  if (ct === 'PREFOU' && !CHO_TAO_PRE_FOU) throw badRequest('Lớp Pre FOU chưa mở — sẽ mở cùng đợt cập nhật hệ môn học.');
  const loTrinh = ct === 'FT' ? String(input.loTrinh ?? '') : null;
  if (ct === 'FT' && !activeRouteCodes().includes(loTrinh!)) throw badRequest('Chọn lộ trình LT1, LT2 hoặc RF.');
  const loiSo = kiemSoLop(String(input.so ?? ''));
  if (loiSo) throw badRequest(loiSo);
  if (ct !== 'FT' && !input.startPeriodId) throw badRequest('Chọn tuần khai giảng — mốc Giữa/Cuối khoá đếm từ tuần này.');
  /* Lớp thường: ngày khai giảng = thứ Hai của tuần khai giảng (mốc Giữa/Cuối khoá đếm từ đây). */
  const tuan = input.startPeriodId ? periodById(input.startPeriodId) : null;
  if (input.startPeriodId && !tuan) throw badRequest('Tuần khai giảng không hợp lệ.');
  const slots = moRongPhanCong(ct, prog.skills, slots0);   // Pre FOU: GVCN tự nhận ô Tổng hợp (T56)
  kiemTruocPhanCong(null, input.branchId, ct, prog.skills, slots);
  const code = ghepMaLop(branch.code, ct, loTrinh, String(input.so));
  return tx(() => {
    const lop = createClass(p, {
      code, branchId: input.branchId, kind: ct, route: loTrinh as Route | null, isFastTrack: ct === 'FT',
      startDate: tuan?.week_start ?? null, startPeriodId: input.startPeriodId ?? null,
      previousClassId: input.previousClassId ?? null, note: input.note ?? null,
    }) as any;
    if (slots.length) ghiPhanCong(p, lop.id, slots, demoToday());
    return { id: lop.id as number, code };
  });
}
