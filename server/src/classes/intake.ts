import { db, tx } from '../db.ts';
import {
  CHO_TAO_PRE_FOU, ENTRY_SKILLS, MOCK_FT_STUDY_WEEK, PERMISSIONS, PROGRAMME_TEMPLATES, chuanHoaMaLop, ghepMaLop, khoaMaLopSql, kiemSoLop,
  moRongPhanCong, programmeOf, type Route, type SlotPhanCong,
  docEmail, docNgayNhap, nhanDangCot, tuanBatDauMacDinh, type VanDeNhap,
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
 *   Fast Track   Họ tên · Ngày sinh · Email · OVR · L · R · W · S · Target · Thi dự kiến · Tuần bắt đầu
 *   Lớp thường   Họ tên · Ngày sinh · Email · Tuần bắt đầu   (YC-5.2, K2-41 — bộ cột ở `cotLuoiNhap`)
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
  /** Chữ thô `dd/mm/yyyy` (hoặc ISO) — máy chủ đọc bằng `docNgayNhap`, từ chối ngày không có thật (C10). */
  dob?: string;
  /** T8: bắt buộc khi thêm mới; lưu chữ thường. */
  email?: string;
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
  /** T9 · Thi dự kiến: `dd/mm/yyyy` (ngày) hoặc `mm/yyyy` (tháng). Xem trước trả ISO `yyyy-mm-dd` / `yyyy-mm`. */
  examDate?: string;
  /** Thứ Hai của TUẦN BẮT ĐẦU HỌC. Có mặc định cho cả lô, ghi đè được từng dòng. */
  startWeek?: string;
  /** K2-20: lộ trình theo LỚP — cột này trong file chỉ nhận diện để báo "bỏ qua". */
  route?: string;
  consultant?: string;
};

export type RowIssue = VanDeNhap;

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

/** Ô có dữ liệu thật (không tính trống / '-'). */
const coDuLieu = (v: unknown) => !['', '-', '–', '—', 'n/a'].includes(String(v ?? '').trim().toLowerCase());

/**
 * Đọc TSV/CSV dán từ bảng tính. Cột nhận THEO TIÊU ĐỀ (YC-5.2), không theo thứ tự; dòng đầu bắt buộc là tiêu đề có "Họ và tên"
 * (chủ sản phẩm chốt 29/09 — file cũ chưa có cột Email mà đọc theo thứ tự thì lệch cột âm thầm).
 */
export function parsePaste(text: string): { rows: IntakeRow[]; cotBoQua: string[] } {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (!lines.length) return { rows: [], cotBoQua: [] };
  const split = (l: string) => (l.includes('\t') ? l.split('\t') : l.split(',')).map((c) => c.trim());
  const { cot, boQua } = nhanDangCot(split(lines[0]));
  if (!cot.includes('fullName')) {
    throw badRequest('Dòng đầu phải là dòng tiêu đề, có cột "Họ và tên" (thêm Ngày sinh, Email… tuỳ bảng). Cột nhận theo tên, không theo thứ tự.');
  }
  const homNay = demoToday();
  const rows: IntakeRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = split(line);
    const row: IntakeRow = {};
    cot.forEach((k, i) => { const v = cells[i]; if (k && v !== undefined && v !== '') (row as any)[k] = v; });
    /* Ô tuần của lưới là ô ngày thống nhất (giá trị ISO) — đổi sẵn chữ dán đọc được; đọc không được thì giữ chữ để xem trước báo lỗi. */
    if (row.startWeek) { const w = docNgayNhap(row.startWeek, homNay); if (w.iso) row.startWeek = mondayOf(w.iso); }
    if (Object.keys(row).length) rows.push(row);
  }
  return { rows, cotBoQua: boQua };
}

export function previewIntake(
  p: Principal,
  input: {
    rows: IntakeRow[];
    /** Lớp của CẢ LÔ, chọn một lần ở đầu panel (mục 12.1). */
    classId?: number | null;
    /** Tuần bắt đầu mặc định cho cả lô; từng dòng vẫn ghi đè được. */
    defaultStartWeek?: string | null;
    /* Tên cũ của `classId`, giữ để đường gọi cũ không gãy. */
    defaultClassId?: number | null;
  },
): IntakePreview {
  const conn = db();
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
      rows: [], issues: [{ row: 0, field: 'classId', message: 'Chưa chọn lớp cho lô này.', muc: 'loi' }],
      canPlanWeeks: false, programme: null, ratio: false, classCode: null,
    };
  }
  if (!can(p, PERMISSIONS.STUDENT_EDIT, { classId: cls.id })) {
    return {
      rows: [],
      issues: [{ row: 0, field: 'classId', message: `Lớp ${cls.code} nằm ngoài phạm vi bạn được cấp quyền.`, muc: 'loi' }],
      canPlanWeeks: false, programme: cls.programme_code ?? null, ratio: false, classCode: cls.code,
    };
  }

  /* Chương trình quyết định bộ cột: Fast Track có band từng kỹ năng và target, Normal không. */
  const pc = cls.programme_code ? programmeOf(cls.programme_code) ?? 'FT' : null;
  const ratio = ((pc ? programmeByCode(pc)?.scoringMode ?? PROGRAMME_TEMPLATES[pc]?.scoringMode : null) ?? 'ielts_band') === 'ratio';

  /*
   * TUẦN BẮT ĐẦU CẢ LÔ (YC-5.4, K2-19): gửi lên thì đọc; không gửi thì mặc định (lớp thường: tuần khai giảng; FT vào muộn: tuần này).
   * Gửi mà sai → báo ở cả lô và KHÔNG lặng lẽ thay bằng mặc định (dòng không tự ghi tuần sẽ báo thiếu).
   */
  const homNay = demoToday();
  const w0 = input.defaultStartWeek ? docNgayNhap(input.defaultStartWeek, homNay) : null;
  if (w0?.loi) issues.push({ row: 0, field: 'startWeek', message: w0.loi, muc: 'loi' });
  const defaultWeek = w0?.loi ? null
    : w0?.iso ? mondayOf(w0.iso) : tuanBatDauMacDinh({ lopThuong: ratio, khaiGiang: cls.start_date ?? null }, homNay);

  const rows = input.rows.map((r, i) => {
    const rowNo = i + 1;
    const rowIssues: RowIssue[] = [];
    const loi = (field: string, message: string) => rowIssues.push({ row: rowNo, field, message, muc: 'loi' });
    const luuY = (field: string, message: string) => rowIssues.push({ row: rowNo, field, message, muc: 'luu_y' });
    const name = (r.fullName ?? '').trim();
    /*
     * THIẾU TÊN LÀ LỖI TẠI DÒNG ĐÓ, không phải lý do tạo một em tên '-' (mục 12.1).
     * Dòng hỏng vẫn nằm lại trong lưới để người nhập sửa; cả lô không vì thế mà hỏng.
     */
    if (!name || name === '-') loi('fullName', 'Thiếu họ tên');

    const dob = docNgayNhap(r.dob, homNay, { toiDa: homNay });
    if (dob.loi) loi('dob', dob.loi);

    const email = docEmail(r.email);
    if (email.loi) loi('email', email.loi);
    else if (!email.email) loi('email', 'Bắt buộc — còn trống');

    /*
     * OVR, BỐN BAND, TARGET, THI DỰ KIẾN — chỉ Fast Track. Lớp thường có dữ liệu ở đây là do file trộn: bỏ qua có báo (Q4),
     * không chặn cả dòng — cùng cách với cột Lớp/Lộ trình.
     */
    const band: Record<string, number | null> = {};
    const COT_BAND: [keyof IntakeRow, string][] = [
      ['baselineScore', 'OVR'], ['entryListening', 'L'], ['entryReading', 'R'], ['entryWriting', 'W'], ['entrySpeaking', 'S'],
    ];
    for (const [key, label] of COT_BAND) {
      const v = bandOf(r[key] as any);
      band[key] = null;
      if (ratio) { if (coDuLieu(r[key])) luuY(key, 'Bỏ qua — lớp thường không có điểm đầu vào IELTS'); }
      else if (v === 'invalid') loi(key, `${label} phải là band 0–9, bước 0,5`);
      else band[key] = v;
    }

    let target: number | null = null;
    if (ratio) { if (coDuLieu(r.target)) luuY('target', 'Bỏ qua — lớp thường không có target'); }
    else {
      const t = bandOf(r.target);
      if (t === 'invalid') loi('target', 'Target phải là band 0–9, bước 0,5');
      else if (t === null) luuY('target', 'Chưa có — vẫn thêm được, bổ sung sau để tính kỳ vọng');
      else target = t;
    }

    let examDate: string | undefined;
    if (ratio) { if (coDuLieu(r.examDate)) luuY('examDate', 'Bỏ qua — lớp thường chưa thi IELTS'); }
    else {
      const t = docNgayNhap(r.examDate, homNay, { choThang: true, toiThieu: homNay });
      if (t.loi) loi('examDate', t.loi);
      else examDate = t.iso ?? undefined;
    }

    /* TUẦN BẮT ĐẦU: ô trống thì dùng mặc định của cả lô. */
    let startWeek: string | null = defaultWeek;
    if (coDuLieu(r.startWeek)) {
      const w = docNgayNhap(r.startWeek, homNay);
      startWeek = w.iso ? mondayOf(w.iso) : null;
      if (w.loi) loi('startWeek', w.loi);
    }
    if (!startWeek && !rowIssues.some((x) => x.field === 'startWeek')) loi('startWeek', 'Chưa có — chọn tuần bắt đầu ở đầu panel');

    /* K2-20: lộ trình theo LỚP, không theo file. */
    if (coDuLieu(r.route) && String(r.route).trim().toUpperCase() !== String(cls.route ?? '').toUpperCase()) {
      luuY('route', `Bỏ qua — lộ trình theo lớp (${cls.route ?? 'lớp thường'})`);
    }
    if (r.classCode && r.classCode.trim() && r.classCode.trim().toLowerCase() !== cls.code.toLowerCase()) {
      luuY('classCode', `Bỏ qua cột lớp "${r.classCode}" — cả lô này vào ${cls.code} theo ô chọn ở trên`);
    }

    /*
     * CẢNH BÁO TRÙNG HỒ SƠ — dựa trên TÊN VÀ NGÀY SINH, và chỉ là gợi ý (lưu ý, không chặn — Mâu thuẫn #1 của kế hoạch).
     *
     * Trùng mỗi tên thì KHÔNG gộp: "Nguyễn Văn An" là một cái tên rất nhiều người mang. Em
     * đã có hồ sơ thì nên dùng ghi danh hoặc chuyển lớp, chứ tạo mã mới là chẻ lịch sử của
     * một đứa trẻ thành hai hồ sơ không ai nối lại được.
     */
    const duplicates = name
      ? (conn
          .prepare(
            `SELECT id, student_code, full_name, dob FROM students
              WHERE normalized_name = ? ${dob.iso ? 'AND dob = ?' : ''} LIMIT 5`,
          )
          .all(...(dob.iso ? [normalizeName(name), dob.iso] : [normalizeName(name)])) as any[])
      : [];
    if (duplicates.length) {
      luuY('fullName', `Có thể trùng ${duplicates.map((d) => `${d.full_name} (${d.student_code})`).join(', ')}`
        + ' — em đã có hồ sơ thì dùng Chuyển lớp');
    }

    issues.push(...rowIssues);
    return {
      row: rowNo,
      fullName: name,
      classCode: cls.code,
      classId: cls.id,
      dob: dob.iso ?? undefined,
      email: email.email ?? undefined,
      baselineScore: band.baselineScore,
      entryListening: band.entryListening,
      entryReading: band.entryReading,
      entryWriting: band.entryWriting,
      entrySpeaking: band.entrySpeaking,
      target,
      examDate,
      startWeek: startWeek ?? undefined,
      consultant: r.consultant,
      duplicates: duplicates.map((d) => ({ id: d.id, studentCode: d.student_code, fullName: d.full_name, dob: d.dob })),
      issues: rowIssues,
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

/** `hangDaThem`: số dòng (theo lưới) đã thêm — panel bỏ các dòng đó, giữ dòng còn lỗi (K2-21). */
export type IntakeResult = { added: number; skipped: number; failed: RowIssue[]; studentIds: number[]; hangDaThem: number[] };

export function commitIntake(
  p: Principal,
  input: {
    rows: IntakeRow[];
    classId?: number | null; defaultStartWeek?: string | null;
    defaultClassId?: number | null;
    idempotencyKey?: string;
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
  const failed: RowIssue[] = [];
  const studentIds: number[] = [];
  const hangDaThem: number[] = [];
  let skipped = 0;

  const result = tx(() => {
    for (const r of preview.rows) {
      /* Chỉ LỖI chặn dòng; lưu ý (trùng hồ sơ, cột bị bỏ qua, thiếu target) không chặn. */
      const blocking = r.issues.filter((i) => i.muc === 'loi');
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
          `INSERT INTO students (student_code, full_name, normalized_name, dob, email, branch_id, status,
                                 consultant_name, created_at)
           VALUES (?,?,?,?,?,?, 'active', ?, ?)`,
        )
        .run(padCode('PISA', seq), r.fullName, normalizeName(r.fullName), r.dob ?? null, r.email ?? null,
             cls.branch_id, r.consultant ?? null, nowIso());
      const sid = Number(info.lastInsertRowid);
      studentIds.push(sid);
      hangDaThem.push(r.row);

      conn.prepare('INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, ?,?,?)')
        .run(sid, r.classId, 'active', startedAt, nowIso());
      addJourney({ studentId: sid, eventType: 'enrollment', eventDate: startedAt,
        title: `Vào lớp ${cls.code}`, createdBy: p.userId });

      /*
       * MỞ LỘ TRÌNH CHO MỌI EM, lộ trình theo LỚP em vào (K2-20) — cột "Lộ trình" trong file bị bỏ qua (có báo ở xem trước).
       * Nhờ vậy em nào cũng có chỗ để gắn target, tuần bắt đầu, lịch MT.
       */
      const route = cls.route ?? null;
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
        /* T9: thi dự kiến là NGÀY → lưu ngày + suy tháng, tuần; là THÁNG → chỉ tháng. */
        const thi = r.examDate ?? null;
        const examDate = thi?.length === 10 ? thi : null;
        const cyc = conn
          .prepare(
            `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, exam_month, exam_date, exam_period_id,
                                          baseline_score, baseline_source,
                                          baseline_listening, baseline_reading, baseline_writing, baseline_speaking,
                                          start_period_id, started_at, status, created_at)
             VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
          )
          /* TUẦN BẮT ĐẦU HỌC lấy từ ô của dòng, hoặc mặc định của cả lô (mục 12.1). */
          .run(sid, route, cls.programme_code ?? null, r.target ?? null, thi ? thi.slice(0, 7) : null,
               examDate, examDate ? ensurePeriod(mondayOf(examDate)).id : null,
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

    const out: IntakeResult = { added: studentIds.length, skipped, failed, studentIds, hangDaThem };
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
