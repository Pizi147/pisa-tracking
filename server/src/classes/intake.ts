import { chenNhieuDong, db, theoLo, tx } from '../db.ts';
import {
  CHO_TAO_PRE_FOU, ENTRY_SKILLS, MOCK_FT_STUDY_WEEK, PERMISSIONS, PROGRAMME_TEMPLATES, chuanHoaMaLop, ghepMaLop, khoaMaLopSql, kiemSoLop,
  moRongPhanCong, programmeOf, type Route, type SlotPhanCong,
  NGAY_SINH_TOI_THIEU, canNamGan, docEmail, docNgayNhap, laLichSu, nhanCotNhap, lichMtMacDinh, nhanDangCot, tuanBatDauMacDinh, tuanHocCuaMt, tuanLich, type VanDeNhap,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { docSlots, ghiPhanCong, kiemTruocPhanCong } from './classes.ts';
import { allProgrammes, mocChupVaoLop, programmeByCode } from '../normal/regular.ts';
import { activeRouteCodes } from '../platform/sysconfig.ts';
import { addDays, badRequest, isIsoDate, kiemKieuO, normalizeName, notFound, nowIso, padCode } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { ensurePeriods, mondayOf, periodById } from '../platform/week.ts';
import { taoMtMacDinhLo } from '../fasttrack/mtMacDinh.ts';

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
  /** K2-33(1) · Đã thi tới MT (0–8, lớp FT): em cũ đã thi ngoài web tới MT mấy — web tạo sẵn các lượt đó (MT lịch sử) để nhập điểm bù. */
  daThiToiMt?: number | string | null;
  /** Thứ Hai của TUẦN BẮT ĐẦU HỌC. Có mặc định cho cả lô, ghi đè được từng dòng. */
  startWeek?: string;
  /** K2-20: lộ trình theo LỚP — cột này trong file chỉ nhận diện để báo "bỏ qua". */
  route?: string;
  consultant?: string;
};

export type RowIssue = VanDeNhap;

/** Ô chữ / ô số (nhận cả số từ lưới) của một dòng nhập — cho `kiemKieuO` (PR-TOC). */
const COT_CHU = ['fullName', 'classCode', 'dob', 'email', 'examDate', 'startWeek', 'route', 'consultant'] as const;
const COT_SO = ['baselineScore', 'entryListening', 'entryReading', 'entryWriting', 'entrySpeaking', 'target', 'daThiToiMt'] as const;

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
  /* PR-TOC: kiểu dữ liệu ở biên — gửi sai kiểu (object, mảng…) là 400 có lời, không phải 500. */
  if (!Array.isArray(input.rows) || input.rows.some((r) => !r || typeof r !== 'object' || Array.isArray(r))) {
    throw badRequest('Dữ liệu nhập không hợp lệ — cần danh sách dòng.');
  }
  input.rows.forEach((r, i) => kiemKieuO(r as Record<string, unknown>, COT_CHU, COT_SO, (k) => `Dòng ${i + 1} · ${nhanCotNhap(k)}`));
  kiemKieuO(input as Record<string, unknown>, ['defaultStartWeek'], [], () => 'Tuần bắt đầu');

  /*
   * LỚP LÀ QUYẾT ĐỊNH CỦA CẢ LÔ, không phải một ô lặp lại ở từng dòng (mục 12.1).
   * Thiếu lớp thì không soát được gì có ý nghĩa — chương trình của lớp quyết định bảng này
   * có những cột nào và cột nào hợp lệ.
   */
  const classId = input.classId ?? input.defaultClassId ?? null;
  const cls = classId
    ? (conn.prepare("SELECT id, code, route, start_date, programme_code, branch_id, status, is_fast_track FROM classes WHERE id = ?")
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
  const w0 = input.defaultStartWeek ? docNgayNhap(input.defaultStartWeek, homNay, canNamGan(homNay)) : null;
  if (w0?.loi) issues.push({ row: 0, field: 'startWeek', message: w0.loi, muc: 'loi' });
  const defaultWeek = w0?.loi ? null
    : w0?.iso ? mondayOf(w0.iso) : tuanBatDauMacDinh({ lopThuong: ratio, khaiGiang: cls.start_date ?? null }, homNay);

  /* TRÙNG HỒ SƠ đọc MỘT câu cho cả lô (PR-TOC), lọc theo ngày sinh từng dòng ở dưới. */
  const cungTen = new Map<string, any[]>();
  theoLo([...new Set(input.rows.map((r) => normalizeName((r.fullName ?? '').trim())).filter(Boolean))], (lo, ph) => {
    for (const d of conn.prepare(
      `SELECT id, student_code, full_name, dob, normalized_name FROM students WHERE normalized_name IN (${ph}) ORDER BY id`).all(...lo) as any[]) {
      if (!cungTen.has(d.normalized_name)) cungTen.set(d.normalized_name, []);
      cungTen.get(d.normalized_name)!.push(d);
    }
  });

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
    if (!name || name === '-') loi('fullName', 'Chưa điền');

    const dob = docNgayNhap(r.dob, homNay, { toiThieu: NGAY_SINH_TOI_THIEU, toiDa: homNay });
    if (dob.loi) loi('dob', dob.loi);

    const email = docEmail(r.email);
    if (email.loi) loi('email', email.loi);
    else if (!email.email) loi('email', 'Chưa điền');

    /*
     * OVR, BỐN BAND, TARGET, THI DỰ KIẾN — chỉ Fast Track. Lớp thường có dữ liệu ở đây là do file trộn: bỏ qua có báo (Q4),
     * không chặn cả dòng — cùng cách với cột Lớp/Lộ trình.
     */
    const band: Record<string, number | null> = {};
    const COT_BAND = ['baselineScore', 'entryListening', 'entryReading', 'entryWriting', 'entrySpeaking'] as const;
    for (const key of COT_BAND) {
      const v = bandOf(r[key] as any);
      band[key] = null;
      if (ratio) { if (coDuLieu(r[key])) luuY(key, 'Bỏ qua — lớp thường không có điểm đầu vào IELTS'); }
      else if (v === 'invalid') loi(key, 'Gõ band 0–9, bước 0,5 — ví dụ 5.5');
      else band[key] = v;
    }

    let target: number | null = null;
    if (ratio) { if (coDuLieu(r.target)) luuY('target', 'Bỏ qua — lớp thường không có target'); }
    else {
      const t = bandOf(r.target);
      if (t === 'invalid') loi('target', 'Gõ band 0–9, bước 0,5 — ví dụ 6.5');
      else if (t === null) luuY('target', 'Chưa có — vẫn thêm được, bổ sung sau để tính kỳ vọng');
      else target = t;
    }

    let examDate: string | undefined;
    if (ratio) { if (coDuLieu(r.examDate)) luuY('examDate', 'Bỏ qua — lớp thường chưa thi IELTS'); }
    else {
      const t = docNgayNhap(r.examDate, homNay, { choThang: true, toiThieu: homNay, toiDa: canNamGan(homNay).toiDa });
      if (t.loi) loi('examDate', t.loi);
      else examDate = t.iso ?? undefined;
    }

    let daThiToiMt: number | undefined;
    if (ratio) { if (coDuLieu(r.daThiToiMt)) luuY('daThiToiMt', 'Bỏ qua — lớp thường không có MT'); }
    else if (coDuLieu(r.daThiToiMt)) {
      const s = String(r.daThiToiMt).trim();
      if (/^\d$/.test(s) && Number(s) <= 8) daThiToiMt = Number(s);
      else loi('daThiToiMt', 'Gõ số MT đã thi, 0–8');
    }

    /* TUẦN BẮT ĐẦU: ô trống thì dùng mặc định của cả lô. */
    let startWeek: string | null = defaultWeek;
    if (coDuLieu(r.startWeek)) {
      const w = docNgayNhap(r.startWeek, homNay, canNamGan(homNay));
      startWeek = w.iso ? mondayOf(w.iso) : null;
      if (w.loi) loi('startWeek', w.loi);
    }
    if (!startWeek && !rowIssues.some((x) => x.field === 'startWeek')) loi('startWeek', 'Chưa có — chọn tuần bắt đầu ở đầu panel');

    /*
     * BÁO TRƯỚC MT LỊCH SỬ (K2-19, planning chốt 29/09): cùng luật với `taoMtMacDinh` lúc ghi — MT(n) ở tuần học `tuanHocCuaMt`, là lịch
     * sử khi Chủ nhật tuần thi đã qua. Em vào muộn mà để tuần khai giảng thì người nhập thấy ngay, trước khi lưu.
     */
    if (cls.is_fast_track && cls.route && startWeek) {
      const soLuot = Math.max(lichMtMacDinh(cls.route).length, daThiToiMt ?? 0);
      const lichSu = Array.from({ length: soLuot }, (_, k) => k + 1).filter((n) =>
        laLichSu(addDays(startWeek!, (tuanHocCuaMt(cls.route, n) - 1) * 7 + 6), homNay));
      if (lichSu.length) {
        luuY('startWeek', `Học từ ${tuanLich(startWeek)} — ${lichSu.length} MT sẽ là MT lịch sử (${lichSu.map((n) => 'MT' + n).join(', ')})`);
      }
    }

    /* K2-20: lộ trình theo LỚP, không theo file. */
    if (coDuLieu(r.route) && String(r.route).trim().toUpperCase() !== String(cls.route ?? '').toUpperCase()) {
      luuY('route', `Bỏ qua — lộ trình theo lớp (${cls.route ?? 'lớp thường'})`);
    }
    if (r.classCode && r.classCode.trim() && r.classCode.trim().toLowerCase() !== cls.code.toLowerCase()) {
      luuY('classCode', `Bỏ qua — cả lô vào ${cls.code} (lớp chọn ở đầu panel)`);
    }

    /*
     * CẢNH BÁO TRÙNG HỒ SƠ — dựa trên TÊN VÀ NGÀY SINH, và chỉ là gợi ý (lưu ý, không chặn — Mâu thuẫn #1 của kế hoạch).
     *
     * Trùng mỗi tên thì KHÔNG gộp: "Nguyễn Văn An" là một cái tên rất nhiều người mang. Em
     * đã có hồ sơ thì nên dùng ghi danh hoặc chuyển lớp, chứ tạo mã mới là chẻ lịch sử của
     * một đứa trẻ thành hai hồ sơ không ai nối lại được.
     */
    const duplicates = name
      ? (cungTen.get(normalizeName(name)) ?? []).filter((d) => !dob.iso || d.dob === dob.iso).slice(0, 5)
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
      daThiToiMt,
      startWeek: startWeek ?? undefined,
      consultant: r.consultant,
      duplicates: duplicates.map((d) => ({ id: d.id, studentCode: d.student_code, fullName: d.full_name, dob: d.dob })),
      issues: rowIssues,
    };
  });

  return {
    rows, issues,
    /* M1: lớp FT tự tạo lịch MT mặc định khi thêm (tuần do hệ thống tính theo tuần bắt đầu học). */
    canPlanWeeks: !!cls.is_fast_track,
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
/**
 * `mt` (K2-21, K2-32): lượt MT mặc định vừa tạo — số em có lịch, số lượt MT lịch sử chưa có điểm, số em có lượt lịch sử, lượt lịch sử
 * đầu tiên (panel mở thẳng trang nhập điểm của lượt đó).
 */
export type IntakeResult = {
  added: number; skipped: number; failed: RowIssue[]; studentIds: number[]; hangDaThem: number[];
  mt: { soEm: number; soLuotLichSu: number; soEmCoLichSu: number; luotLichSuDau: number | null };
};

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
  /*
   * LỚP VÀ QUYỀN KIỂM TRƯỚC (PR-TOC): lớp ngoài phạm vi → 403, không phải "200 · 0 em · không lỗi" (xem trước báo ở dòng 0 rồi
   * bị bỏ qua). Kiểm trước cả khoá idempotency để người khác không đọc được kết quả đã lưu của một lô.
   */
  const classId = input.classId ?? input.defaultClassId ?? null;
  if (!classId) throw badRequest('Chưa chọn lớp cho lô này.');
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: cls.id }, `Lớp ${cls.code} nằm ngoài phạm vi bạn được cấp quyền.`);
  /*
   * IDEMPOTENCY — bấm hai lần hoặc thử lại sau lỗi mạng không được tạo thêm học viên. Khoá gắn NGƯỜI GỬI + LỚP (PR-TOC): khoá do
   * trình duyệt sinh, người khác gửi lại đúng chuỗi đó không được đọc kết quả (mã HV, id) của lô người khác.
   */
  const key = input.idempotencyKey?.trim() ? `intake:${p.userId}:${cls.id}:${input.idempotencyKey.trim()}` : null;
  const daGhi = () => (key ? (conn.prepare('SELECT value FROM demo_config WHERE key = ?').get(key) as any) : null);
  const seen = daGhi();
  if (seen) return JSON.parse(seen.value) as IntakeResult;

  const preview = previewIntake(p, input);
  const failed: RowIssue[] = [];
  const studentIds: number[] = [];
  const hangDaThem: number[] = [];
  const mt: IntakeResult['mt'] = { soEm: 0, soLuotLichSu: 0, soEmCoLichSu: 0, luotLichSuDau: null };
  let skipped = 0;

  const result = tx((): IntakeResult => {
    /* Đọc lại khoá TRONG giao dịch (đã giữ khoá ghi): hai lời gọi song song cùng khoá — lời gọi sau thấy kết quả của lời gọi trước. */
    const vuaGhi = daGhi();
    if (vuaGhi) return JSON.parse(vuaGhi.value) as IntakeResult;
    const ok: typeof preview.rows = [];
    for (const r of preview.rows) {
      /* Chỉ LỖI chặn dòng; lưu ý (trùng hồ sơ, cột bị bỏ qua, thiếu target) không chặn. */
      const blocking = r.issues.filter((i) => i.muc === 'loi');
      if (blocking.length) { failed.push(...blocking); skipped += 1; continue; }
      if (!r.classId || !r.fullName) { skipped += 1; continue; }
      ok.push(r);
    }

    /*
     * GHI THEO LÔ (PR-TOC): mỗi bảng MỘT câu nhiều dòng cho cả lô, không một câu mỗi em — trên Turso mỗi câu là một lượt mạng, lô
     * 35 em từng tốn ~1900 câu (~1 phút) và bị Netlify cắt giữa chừng. Cả lô chung MỘT lớp (đã kiểm quyền ở đầu hàm).
     */
    if (ok.length) {
      const now = nowIso();
      const seq = (conn.prepare('SELECT next_value FROM student_code_seq WHERE id = 1').get() as any)?.next_value ?? 1;
      conn.prepare('UPDATE student_code_seq SET next_value = next_value + ? WHERE id = 1').run(ok.length);
      const ma = ok.map((_, i) => padCode('PISA', seq + i));
      chenNhieuDong(
        `INSERT INTO students (student_code, full_name, normalized_name, dob, email, branch_id, status, consultant_name, created_at)`,
        ok.map((r, i) => [ma[i], r.fullName, normalizeName(r.fullName!), r.dob ?? null, r.email ?? null, cls.branch_id, 'active',
          r.consultant ?? null, now]));
      const sidOf = new Map<string, number>();
      theoLo(ma, (lo, ph) => {
        for (const x of conn.prepare(`SELECT id, student_code FROM students WHERE student_code IN (${ph})`).all(...lo) as any[]) {
          sidOf.set(x.student_code, x.id);
        }
      });
      const sids = ma.map((m) => sidOf.get(m)!);
      studentIds.push(...sids);
      hangDaThem.push(...ok.map((r) => r.row));

      const startWeek = (r: (typeof ok)[number]) => r.startWeek ?? cls.start_date ?? now.slice(0, 10);
      chenNhieuDong('INSERT INTO enrollments (student_id, class_id, status, started_at, created_at)',
        ok.map((r, i) => [sids[i], r.classId, 'active', startWeek(r), now]));
      chenNhieuDong('INSERT INTO journey_events (student_id, event_type, event_date, title, created_by, created_at)',
        ok.map((r, i) => [sids[i], 'enrollment', startWeek(r), `Vào lớp ${cls.code}`, p.userId, now]));

      /*
       * MỞ LỘ TRÌNH CHO MỌI EM, lộ trình theo LỚP em vào (K2-20) — cột "Lộ trình" trong file bị bỏ qua (có báo ở xem trước).
       * Nhờ vậy em nào cũng có chỗ để gắn target, tuần bắt đầu, lịch MT.
       *
       * OVR VÀ BỐN BAND LÀ HAI NGUỒN KHÁC NHAU (mục 12.1). OVR là con số trên phiếu điểm; bốn band là bốn con số cũng trên
       * phiếu đó. Không suy cái này ra cái kia: thiếu vài môn thì để trống đúng những môn thiếu, và có đủ bốn môn cũng không tính
       * lại OVR — làm tròn của IELTS không phải trung bình cộng.
       *
       * T9: thi dự kiến là NGÀY → lưu ngày + suy tháng, tuần; là THÁNG → chỉ tháng.
       */
      const route = cls.route ?? null;
      const examDateOf = (r: (typeof ok)[number]) => (r.examDate?.length === 10 ? r.examDate : null);
      const tuan = ensurePeriods([...ok.map(startWeek), ...ok.map(examDateOf).filter((x): x is string => !!x).map(mondayOf)]);
      chenNhieuDong(
        `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, exam_month, exam_date, exam_period_id,
                                      baseline_score, baseline_source,
                                      baseline_listening, baseline_reading, baseline_writing, baseline_speaking,
                                      start_period_id, started_at, status, created_at)`,
        ok.map((r, i) => {
          const ovr = baselineOf(r.baselineScore);
          const bands = [baselineOf(r.entryListening), baselineOf(r.entryReading), baselineOf(r.entryWriting), baselineOf(r.entrySpeaking)];
          const hasEntry = ovr !== null || bands.some((b) => b !== null);
          const thi = r.examDate ?? null;
          const examDate = examDateOf(r);
          /* TUẦN BẮT ĐẦU HỌC lấy từ ô của dòng, hoặc mặc định của cả lô (mục 12.1). */
          return [sids[i], 1, route, cls.programme_code ?? null, r.target ?? null, thi ? thi.slice(0, 7) : null,
            examDate, examDate ? tuan.get(mondayOf(examDate))!.id : null,
            ovr, hasEntry ? 'entrance' : null, ...bands,
            tuan.get(startWeek(r))!.id, startWeek(r), 'active', now];
        }));
      /* Em mới tạo nên mỗi em đúng một lộ trình. */
      const cycOf = new Map<number, number>();
      theoLo(sids, (lo, ph) => {
        for (const c of conn.prepare(`SELECT id, student_id FROM learning_cycles WHERE student_id IN (${ph})`).all(...lo) as any[]) {
          cycOf.set(c.student_id, c.id);
        }
      });
      chenNhieuDong(
        'INSERT INTO journey_events (student_id, event_type, event_date, title, detail, ref_table, ref_id, created_by, created_at)',
        ok.map((r, i) => [sids[i], 'cycle_start', startWeek(r), route ? `Bắt đầu lộ trình ${route}` : 'Bắt đầu khoá học',
          r.target ? `Target ${r.target}` : 'Chưa có target', 'learning_cycles', cycOf.get(sids[i]), p.userId, now]));

      /* M1: lịch MT mặc định tạo ngay, MT đã qua là MT lịch sử (T33, T34). Tuần do hệ thống tính, không lấy từ file dán. */
      if (cls.is_fast_track && route) {
        const luotOf = taoMtMacDinhLo(ok.map((r, i) => ({
          cycleId: cycOf.get(sids[i])!, daThiToiMt: r.daThiToiMt == null ? undefined : Number(r.daThiToiMt),
        })), { actorUserId: p.userId });
        for (const sid of sids) {
          const luot = luotOf.get(cycOf.get(sid)!) ?? [];
          const lichSu = luot.filter((l) => l.lichSu);
          if (luot.length) mt.soEm += 1;
          if (lichSu.length) { mt.soEmCoLichSu += 1; mt.soLuotLichSu += lichSu.length; mt.luotLichSuDau ??= lichSu[0].attemptId; }
        }
      }
    }

    const out: IntakeResult = { added: studentIds.length, skipped, failed, studentIds, hangDaThem, mt };
    writeAudit({ actorUserId: p.userId, action: 'student.bulk_add', entityType: 'student',
      entityLabel: `${out.added} học viên`, after: { added: out.added, skipped: out.skipped } });
    if (key) {
      conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)')
        .run(key, JSON.stringify(out), nowIso());
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
