import { chenNhieuDong, db, theoLo, tx } from '../db.ts';
import {
  CHO_TAO_PRE_FOU, ENTRY_SKILLS, PERMISSIONS, PROGRAMME_TEMPLATES, chuanHoaMaLop, ghepMaLop, khoaMaLopSql, kiemSoLop,
  moRongPhanCong, programmeOf, TOI_DA_DONG_TAO_LOP, type LoiDong, type Route, type SlotPhanCong,
  KCK, NGAY_SINH_TOI_THIEU, canNamGan, laKck, docDongDan, docEmail, docNgayNhap, laDongTieuDe, laMtCu, nhanCotNhap, lichMtMacDinh, mtDaThiChuaQua, tuanBatDauMacDinh, tuanHocCuaMt, tuanLich, type CachDoc, type VanDeNhap,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { docSlots, ghiPhanCong, kiemTruocPhanCong } from './classes.ts';
import { allProgrammes, mocChupVaoLop, programmeByCode, taoBaiThuongMacDinh } from '../normal/regular.ts';
import { activeRouteCodes } from '../platform/sysconfig.ts';
import { HttpError, addDays, badRequest, isIsoDate, kiemKieuO, normalizeName, notFound, nowIso, padCode } from '../util.ts';
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
 *   Fast Track   Họ tên · Ngày sinh · Email · OVR · L · R · W · S · Target · Dự kiến thi · Tuần bắt đầu
 *   Lớp thường   Họ tên · Ngày sinh · Email · Target · Dự kiến thi · Tuần bắt đầu   (chủ sản phẩm 04/10, thay K2-41 — bộ cột ở `cotLuoiNhap`)
 *
 * LỚP KHÔNG CÒN LÀ MỘT CỘT. Nó được chọn MỘT LẦN ở đầu panel, và cả lô vào lớp đó. Bản
 * trước để lớp thành một cột dán, nên một file bốn mươi dòng gõ sai mã lớp ở dòng ba mươi
 * là ba mươi em vào đúng lớp còn mười em rơi đi đâu không ai biết. Lớp là quyết định của cả
 * lô, không phải một ô dữ liệu lặp lại bốn mươi lần.
 *
 * KHÔNG BÀY TRƯỜNG CỦA FAST TRACK CHO LỚP NORMAL rồi bắt người dùng điền dấu '-'. Em lớp
 * Foundation không có band đầu vào từng kỹ năng, không có MT; hỏi là hỏi thừa, và một
 * cột thừa luôn được ai đó điền bừa. Target + Dự kiến thi thì có (04/10) — chỉ để theo dõi.
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
  /** T9 · Dự kiến thi: `dd/mm/yyyy` (ngày) hoặc `mm/yyyy` (tháng). Xem trước trả ISO `yyyy-mm-dd` / `yyyy-mm`. */
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

/** Lớp chấm theo tỷ lệ (lớp thường) — chương trình quyết định bộ cột của lưới nhập. */
export function laLopThuong(programmeCode: string | null): boolean {
  const pc = programmeCode ? programmeOf(programmeCode) ?? 'FT' : null;
  return ((pc ? programmeByCode(pc)?.scoringMode ?? PROGRAMME_TEMPLATES[pc]?.scoringMode : null) ?? 'ielts_band') === 'ratio';
}

/**
 * Đọc TSV/CSV dán từ bảng tính. Có dòng tiêu đề → cột nhận THEO TÊN (YC-5.2), thứ tự tuỳ ý. PR-NT (04/10): KHÔNG bắt buộc tiêu đề — không
 * có thì đọc theo MẪU EXCEL CHUNG (`docDongDan`: thứ tự cột FT, lớp thường bỏ cột band — PR-SL 04/10), nên cần `classId`. `coTieuDe` = người dùng chọn cách đọc (bỏ đoán).
 */
export function parsePaste(text: string, o: { classId?: number | null; coTieuDe?: boolean } = {}): { rows: IntakeRow[]; cotBoQua: string[]; cach: CachDoc | null } {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (!lines.length) return { rows: [], cotBoQua: [], cach: null };
  const split = (l: string) => (l.includes('\t') ? l.split('\t') : l.split(',')).map((c) => c.trim());
  const dong = lines.map(split);
  const lop = o.classId ? db().prepare('SELECT programme_code FROM classes WHERE id = ?').get(o.classId) as any : null;
  const laTieuDe = o.coTieuDe ?? laDongTieuDe(dong[0]);
  if (!laTieuDe && !lop) throw badRequest('Chọn lớp trước khi dán dữ liệu không có dòng tiêu đề — web đọc theo mẫu Excel chung (thứ tự cột Fast Track), lớp thường bỏ cột band.');
  const { cot, batDau, cach } = docDongDan(dong, laLopThuong(lop?.programme_code ?? null), o.coTieuDe);
  if (!cot.includes('fullName')) {
    throw badRequest('Dòng tiêu đề chưa có cột "Họ và tên". Thêm cột đó, hoặc bấm "Dòng đầu là học viên?" để đọc theo mẫu Excel chung.');
  }
  const homNay = demoToday();
  const rows: IntakeRow[] = [];
  for (const cells of dong.slice(batDau)) {
    const row: IntakeRow = {};
    cot.forEach((k, i) => { const v = cells[i]; if (k && v !== undefined && v !== '') (row as any)[k] = v; });
    /* Ô tuần của lưới là ô ngày thống nhất (giá trị ISO) — đổi sẵn chữ dán đọc được; đọc không được thì giữ chữ để xem trước báo lỗi. */
    if (row.startWeek) { const w = docNgayNhap(row.startWeek, homNay); if (w.iso) row.startWeek = mondayOf(w.iso); }
    if (laKck(row.target)) row.target = KCK;    // Q29-1: '-' / "không cam kết" hiện thống nhất là KCK trên lưới
    if (Object.keys(row).length) rows.push(row);
  }
  return { rows, cotBoQua: cach.boQua, cach };
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
  if (input.rows.length > 200) throw badRequest('Tối đa 200 học viên một lần thêm.');   // PR-Dọn (Q6, quét #16)
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

  /* Chương trình quyết định bộ cột: Fast Track có band đầu vào từng kỹ năng, Normal không. */
  const ratio = laLopThuong(cls.programme_code ?? null);

  /*
   * TUẦN BẮT ĐẦU CẢ LÔ (YC-5.4, K2-19): gửi lên thì đọc; không gửi thì mặc định (lớp thường: tuần khai giảng; FT vào muộn: tuần này).
   * Gửi mà sai → báo ở cả lô và KHÔNG lặng lẽ thay bằng mặc định (dòng không tự ghi tuần sẽ báo thiếu).
   */
  const homNay = demoToday();
  const tuanMacDinh = tuanBatDauMacDinh({ lopThuong: ratio, khaiGiang: cls.start_date ?? null }, homNay);
  /* PR-Dọn (Q17, VN21): cận năm chỉ áp khi tuần KHÁC mặc định của lớp — lớp khai giảng đã lâu vẫn thêm HV với tuần khai giảng. */
  const docTuan = (v: string) => {
    const w = docNgayNhap(v, homNay);
    return w.iso && mondayOf(w.iso) !== tuanMacDinh ? docNgayNhap(v, homNay, canNamGan(homNay)) : w;
  };
  const w0 = input.defaultStartWeek ? docTuan(input.defaultStartWeek) : null;
  if (w0?.loi) issues.push({ row: 0, field: 'startWeek', message: w0.loi, muc: 'loi' });
  const defaultWeek = w0?.loi ? null : w0?.iso ? mondayOf(w0.iso) : tuanMacDinh;

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
     * OVR, BỐN BAND, ĐÃ THI TỚI MT — chỉ Fast Track. Lớp thường có dữ liệu ở đây là do file trộn: bỏ qua có báo (Q4),
     * không chặn cả dòng — cùng cách với cột Lớp/Lộ trình. Target, Dự kiến thi — mọi lớp (chủ sản phẩm 04/10).
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

    let target: number | typeof KCK | null = null;
    if (laKck(r.target)) target = KCK;          // Q29-1: KCK / '-' = không cam kết (khác ô trống = chưa có)
    else {
      const t = bandOf(r.target);
      if (t === 'invalid') loi('target', 'Gõ band 0–9, bước 0,5 (ví dụ 6.5), hoặc KCK nếu em không cam kết');
      /* Lớp thường không có kỳ vọng MT → trống Target không cần nhắc. */
      else if (t === null) { if (!ratio) luuY('target', 'Chưa có — vẫn thêm được, bổ sung sau để tính kỳ vọng. Em không cam kết đầu ra thì gõ KCK'); }
      else target = t;
    }

    let examDate: string | undefined;
    {
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
      const w = docTuan(String(r.startWeek));
      startWeek = w.iso ? mondayOf(w.iso) : null;
      if (w.loi) loi('startWeek', w.loi);
    }
    if (!startWeek && !rowIssues.some((x) => x.field === 'startWeek')) loi('startWeek', 'Chưa có — chọn tuần bắt đầu ở đầu panel');

    /*
     * BÁO TRƯỚC MT CŨ (K2-19, T1 PR-MTa): cùng luật với `taoMtMacDinh` lúc ghi — MT(n) ở tuần học `tuanHocCuaMt`, là MT cũ khi tuần
     * thi cách tuần này ≥ 2 tuần (`laMtCu`). Em vào muộn mà để tuần khai giảng thì người nhập thấy ngay, trước khi lưu.
     */
    if (cls.is_fast_track && cls.route && startWeek) {
      const soLuot = Math.max(lichMtMacDinh(cls.route).length, daThiToiMt ?? 0);
      const lichSu = Array.from({ length: soLuot }, (_, k) => k + 1).filter((n) =>
        laMtCu(addDays(startWeek!, (tuanHocCuaMt(cls.route, n) - 1) * 7 + 6), homNay));
      if (lichSu.length) {
        luuY('startWeek', `Học từ ${tuanLich(startWeek)} — ${lichSu.length} MT sẽ là MT cũ (${lichSu.map((n) => 'MT' + n).join(', ')})`);
      }
      /* Rà #120 (PR-XLMT): đã thi tới MT d mà có MT ≤ d rơi vào tuần chưa qua → tuần bắt đầu để muộn quá, nhắc lùi. */
      const chuaQua = daThiToiMt ? mtDaThiChuaQua(cls.route, startWeek, daThiToiMt, homNay) : [];
      if (chuaQua.length) {
        luuY('daThiToiMt', `Đã thi tới MT${daThiToiMt} nhưng ${chuaQua.map((n) => 'MT' + n).join(', ')} rơi vào tuần chưa qua — lùi Tuần bắt đầu về tuần em bắt đầu học thật`);
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
       * T9: dự kiến thi là NGÀY → lưu ngày + suy tháng, tuần; là THÁNG → chỉ tháng.
       */
      const route = cls.route ?? null;
      const examDateOf = (r: (typeof ok)[number]) => (r.examDate?.length === 10 ? r.examDate : null);
      const tuan = ensurePeriods([...ok.map(startWeek), ...ok.map(examDateOf).filter((x): x is string => !!x).map(mondayOf)]);
      chenNhieuDong(
        `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, khong_cam_ket, exam_month, exam_date, exam_period_id,
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
          return [sids[i], 1, route, cls.programme_code ?? null, r.target === KCK ? null : r.target ?? null, r.target === KCK ? 1 : 0,
            thi ? thi.slice(0, 7) : null,
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
          r.target ? `Target ${r.target}` : 'Chưa có Target', 'learning_cycles', cycOf.get(sids[i]), p.userId, now]));

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
      /* PR-LT2a M1b (K2-23): vào LỚP THƯỜNG = tự có bài Giữa khoá + Cuối khoá theo mốc của lớp (bỏ mốc đã qua). */
      if (!cls.is_fast_track && !route) taoBaiThuongMacDinh(sids.map((s) => cycOf.get(s)!), p.userId);
    }

    const out: IntakeResult = { added: studentIds.length, skipped, failed, studentIds, hangDaThem, mt };
    writeAudit({ actorUserId: p.userId, action: 'student.bulk_add', entityType: 'student',
      entityLabel: `${out.added} học viên`, after: { added: out.added, skipped: out.skipped } });
    if (key) {
      donKhoaGuiCu(conn, nowIso());
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
  /** Tuần khai giảng — với lớp thường đây là mốc gốc của hai kỳ kiểm tra. */
  startPeriodId?: number | null;
  /** Lớp này học tiếp từ lớp nào — giữ sợi dây FOU → BE → FT. */
  previousClassId?: number | null;
}) {
  /* PR-QU (B): tạo lớp cần `class.create` — không còn ké `student.edit`. */
  require_(p, PERMISSIONS.CLASS_CREATE, { branchId: input.branchId }, 'Bạn không có quyền tạo lớp ở chi nhánh này.');
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

/** Một dòng đã qua kiểm — đủ để ghi. */
type DongDaKiem = { dong: number; input: TaoLopInput; ct: string; loTrinh: string | null; code: string; tuanBatDau: string | null; slots: SlotPhanCong[] };

/** Lỗi 400 của hàm kiểm dùng chung (`docSlots`, `kiemTruocPhanCong`) thành câu lỗi của dòng; lỗi khác ném tiếp. */
function loiCua(e: unknown): string {
  if (e instanceof HttpError && e.status === 400) return e.message;
  throw e;
}

/**
 * KIỂM MỘT DÒNG tạo lớp — thuần kiểm, không ghi. Trả lỗi theo ô của dòng (không ném) để lưới gắn đúng chỗ; lỗi quyền KHÔNG ở đây
 * (`taoLopHangLoat` kiểm quyền cả lô trước). Trùng mã với DB kiểm ở đây; trùng giữa các dòng kiểm ở `taoLopHangLoat`.
 */
export function kiemDongTaoLop(input: TaoLopInput, dong: number): { ok: DongDaKiem } | { loi: LoiDong[] } {
  const conn = db();
  const loi: LoiDong[] = [];
  const branch = Number.isInteger(input.branchId) ? conn.prepare('SELECT * FROM branches WHERE id = ?').get(input.branchId) as any : null;
  if (!branch) loi.push({ dong, truong: 'branchId', loi: 'Chọn chi nhánh.' });
  const ct = programmeOf(String(input.chuongTrinh ?? ''));
  const prog = ct ? allProgrammes().get(ct) : null;
  if (!ct || !prog) return { loi: [...loi, { dong, truong: 'chuongTrinh', loi: 'Chọn chương trình của lớp.' }] };
  if (ct === 'PREFOU' && !CHO_TAO_PRE_FOU) loi.push({ dong, truong: 'chuongTrinh', loi: 'Lớp Pre FOU chưa mở — sẽ mở cùng đợt cập nhật hệ môn học.' });
  const loTrinh = ct === 'FT' ? String(input.loTrinh ?? '') : null;
  if (ct === 'FT' && !activeRouteCodes().includes(loTrinh!)) loi.push({ dong, truong: 'loTrinh', loi: 'Chọn lộ trình LT1, LT2 hoặc RF.' });
  const loiSo = kiemSoLop(String(input.so ?? ''));
  if (loiSo) loi.push({ dong, truong: 'so', loi: loiSo });
  if (ct !== 'FT' && !input.startPeriodId) loi.push({ dong, truong: 'tuan', loi: 'Chọn tuần khai giảng — mốc Giữa/Cuối khoá đếm từ tuần này.' });
  /* Lớp thường: ngày khai giảng = thứ Hai của tuần khai giảng (mốc Giữa/Cuối khoá đếm từ đây). */
  const tuan = input.startPeriodId ? periodById(input.startPeriodId) : null;
  if (input.startPeriodId && !tuan) loi.push({ dong, truong: 'tuan', loi: 'Tuần khai giảng không hợp lệ.' });
  let slots: SlotPhanCong[] = [];
  try {
    slots = moRongPhanCong(ct, prog.skills, docSlots(input.slots));   // Pre FOU: GVCN tự nhận ô Tổng hợp (T56)
    if (branch) kiemTruocPhanCong(null, branch.id, ct, prog.skills, slots);
  } catch (e) { loi.push({ dong, truong: 'slots', loi: loiCua(e) }); }
  if (loi.length || !branch) return { loi };
  const code = ghepMaLop(branch.code, ct, loTrinh, String(input.so));
  if (conn.prepare(`SELECT id FROM classes WHERE ${khoaMaLopSql()} = ?`).get(chuanHoaMaLop(code))) {
    return { loi: [{ dong, truong: 'so', loi: `Đã có lớp ${code}.` }] };
  }
  return { ok: { dong, input, ct, loTrinh, code, tuanBatDau: tuan?.week_start ?? null, slots } };
}

/** GHI một dòng đã kiểm — gọi TRONG `tx`. */
function ghiDongTaoLop(p: Principal, d: DongDaKiem): { dong: number; id: number; code: string } {
  const lop = createClass(p, {
    code: d.code, branchId: d.input.branchId, kind: d.ct, route: d.loTrinh as Route | null, isFastTrack: d.ct === 'FT',
    startDate: d.tuanBatDau, startPeriodId: d.input.startPeriodId ?? null,
    previousClassId: d.input.previousClassId ?? null, note: d.input.note ?? null,
  }) as any;
  if (d.slots.length) ghiPhanCong(p, lop.id, d.slots, demoToday());
  return { dong: d.dong, id: lop.id as number, code: d.code };
}

export type DongTaoLop = TaoLopInput & { dong: number };
export type KetQuaTaoLopHangLoat =
  | { ok: true; lop: { dong: number; id: number; code: string }[] }
  | { ok: false; loi: LoiDong[]; xemTruoc: { dong: number; code: string | null }[]; dryRun?: true };

/**
 * PR-QU (C): TẠO NHIỀU LỚP MỘT LẦN — tất cả hoặc không gì. Thứ tự (không bao giờ đảo):
 *   1. Lô hợp lệ (1–30 dòng) → kiểm QUYỀN từng dòng theo chi nhánh của dòng (`class.create`; + `class.assign` nếu dòng có phân công) —
 *      một dòng ngoài quyền thì 403 cả lô. Quyền kiểm TRƯỚC khi tra khoá: người khác gửi lại đúng khoá không đọc được kết quả cũ.
 *   2. Khoá idempotency `bulkclass:{người gửi}:{khoá}` đã có → trả đúng kết quả cũ, không tạo thêm (bấm đúp, thử lại sau mất mạng).
 *   3. Kiểm từng dòng (`kiemDongTaoLop`) + trùng mã GIỮA các dòng. Có lỗi, hoặc `dryRun` → trả lỗi từng dòng + mã xem trước, không ghi.
 *   4. Ghi mọi dòng trong MỘT giao dịch; lỗi giữa chừng → cuộn lại hết.
 */
export function taoLopHangLoat(p: Principal, input: { rows: unknown; idempotencyKey?: string | null; dryRun?: boolean },
  /** Chỉ phép kiểm: chạy sau khi ghi mỗi dòng (giả lập lỗi giữa giao dịch). */
  sauMoiDong?: (i: number) => void): KetQuaTaoLopHangLoat {
  const raw = input.rows;
  if (!Array.isArray(raw) || raw.length === 0) throw badRequest('Chưa có dòng nào để tạo lớp.');
  if (raw.length > TOI_DA_DONG_TAO_LOP) throw badRequest(`Tối đa ${TOI_DA_DONG_TAO_LOP} lớp một lần.`);
  const rows: DongTaoLop[] = raw.map((r: any, i) => ({
    ...(r && typeof r === 'object' ? r : {}), dong: i + 1, branchId: Number(r?.branchId),
    startPeriodId: r?.startPeriodId == null || r?.startPeriodId === '' ? null : Number(r.startPeriodId),
  }));
  for (const r of rows) {
    require_(p, PERMISSIONS.CLASS_CREATE, { branchId: r.branchId }, `Dòng ${r.dong}: bạn không có quyền tạo lớp ở chi nhánh này.`);
    if (Array.isArray(r.slots) && r.slots.length) {
      require_(p, PERMISSIONS.CLASS_ASSIGN, { branchId: r.branchId }, `Dòng ${r.dong}: bạn không có quyền phân công giáo viên ở chi nhánh này.`);
    }
  }
  const conn = db();
  const k = input.idempotencyKey ? String(input.idempotencyKey).trim().slice(0, 100) : '';
  const key = k && !input.dryRun ? `bulkclass:${p.userId}:${k}` : null;
  const daGhi = () => (key ? (conn.prepare('SELECT value FROM demo_config WHERE key = ?').get(key) as any) : null);
  const seen = daGhi();
  if (seen) return JSON.parse(seen.value) as KetQuaTaoLopHangLoat;

  const loi: LoiDong[] = [];
  const ok: DongDaKiem[] = [];
  const xemTruoc: { dong: number; code: string | null }[] = [];
  const maTrongLo = new Map<string, number>();
  for (const r of rows) {
    const kq = kiemDongTaoLop(r, r.dong);
    if ('loi' in kq) { loi.push(...kq.loi); xemTruoc.push({ dong: r.dong, code: null }); continue; }
    xemTruoc.push({ dong: r.dong, code: kq.ok.code });
    const khoa = chuanHoaMaLop(kq.ok.code);
    const truoc = maTrongLo.get(khoa);
    if (truoc) { loi.push({ dong: r.dong, truong: 'so', loi: `Trùng tên ${kq.ok.code} với dòng ${truoc}.` }); continue; }
    maTrongLo.set(khoa, r.dong);
    ok.push(kq.ok);
  }
  if (loi.length || input.dryRun) return { ok: false, loi, xemTruoc, ...(input.dryRun ? { dryRun: true as const } : {}) };

  return tx((): KetQuaTaoLopHangLoat => {
    /* Đọc lại khoá TRONG giao dịch (đã giữ khoá ghi): hai lời gọi song song cùng khoá — lời gọi sau thấy kết quả của lời gọi trước. */
    const vuaGhi = daGhi();
    if (vuaGhi) return JSON.parse(vuaGhi.value) as KetQuaTaoLopHangLoat;
    const lop = ok.map((d, i) => { const r = ghiDongTaoLop(p, d); sauMoiDong?.(i); return r; });
    const out: KetQuaTaoLopHangLoat = { ok: true, lop };
    if (lop.length > 1) {
      writeAudit({ actorUserId: p.userId, action: 'class.bulk_create', entityType: 'class', entityLabel: `${lop.length} lớp`,
        after: { codes: lop.map((l) => l.code) } });
    }
    if (key) {
      donKhoaGuiCu(conn, nowIso());
      conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(key, JSON.stringify(out), nowIso());
    }
    return out;
  });
}

/**
 * PR-SO (04/10): khoá chống gửi trùng của Thêm HV (`intake:*`), Tạo lớp hàng loạt (`bulkclass:*`) và Sửa cả lớp (`suacalop:*`, PR-SL) chỉ cần sống qua lần bấm lại — dọn
 * khoá cũ hơn 7 ngày ngay trước khi ghi khoá mới, để `demo_config` không phình mãi. Khoá cấu hình khác không đụng.
 */
export function donKhoaGuiCu(conn: any, now: string): void {
  const moc = new Date(Date.parse(now) - 7 * 864e5).toISOString();
  conn.prepare(`DELETE FROM demo_config WHERE (key LIKE 'bulkclass:%' OR key LIKE 'intake:%' OR key LIKE 'suacalop:%') AND updated_at < ?`).run(moc);
}

/**
 * YC-1/T5/L4: TẠO LỚP = MỘT lệnh, MỘT giao dịch (lớp + phân công). Tên lớp do máy ghép `{CN} {ký hiệu} {số}` (T1); kiểm tên + ba
 * luật phân công TRƯỚC, sai thì không ghi gì — không còn "lớp tàng hình" không ai phụ trách. Thiếu phân công vẫn tạo được (L4).
 * PR-QU: một lớp = lô một dòng của `taoLopHangLoat` (một đường kiểm, một đường ghi); lỗi dòng → 400 với câu lỗi đầu tiên như cũ.
 */
export function taoLopVaPhanCong(p: Principal, input: TaoLopInput & { idempotencyKey?: string | null }): { id: number; code: string } {
  const r = taoLopHangLoat(p, { rows: [input], idempotencyKey: input.idempotencyKey ?? null });
  if (!r.ok) throw badRequest(r.loi[0]?.loi ?? 'Không tạo được lớp.');
  return { id: r.lop[0].id, code: r.lop[0].code };
}
