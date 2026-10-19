/**
 * LUẬT THUẦN CỦA VIỆC CHẤM ĐIỂM — khu vực Test (spec §3.5).
 *
 * Ở đây chỉ có luật KHÔNG ĐỌC DATABASE: nhãn hàng lớp của Lịch Test, dựng ô của lưới lớp thường, đếm ngược cửa
 * sổ sửa dấu "-", tính tuần kế tiếp, và luật lý do hiệu chỉnh điểm. Máy chủ và giao diện cùng gọi một nơi, nên hai
 * bên không thể nói hai con số khác nhau — và harness kiểm được mà không cần mở trình duyệt.
 */
import { mondayOfDate } from './week.ts';
import { addDaysIso } from './sos.ts';
import { t } from '../i18n/index.ts';

/** Lịch Test lọc lớp nào (PR-UX1 Q4): lớp người xem có phân công, hay cả phạm vi được xem. */
export type PhamViLichTest = 'cua-toi' | 'tat-ca';

export type LoaiNhanLop = 'da-cham' | 'chua-toi-han' | 'cho-ban' | 'cho-gv-khac' | 'cho-cham';

/**
 * NHÃN MỘT HÀNG LỚP Ở LỊCH TEST (PR-UX1 Q6, Q7) — một trạng thái, ≤ 3 từ, nói bài còn lại là của ai. Quá hạn KHÔNG
 * nằm ở đây: cột Hạn đã nói (mockup 17 B-5, quá hạn nói một lần). Người không chấm (Quản lý) thấy "Chờ chấm" — với họ
 * "GV khác" sai nghĩa.
 */
export function nhanLopLichTest(i: { conBai: number; conBaiCuaToi: number; chuaToiHan: boolean; coDayLop: boolean })
  : { loai: LoaiNhanLop; chu: string } {
  if (i.conBai === 0) return { loai: 'da-cham', chu: t('Đã chấm') };          // web thêm ✓ nhỏ (G-1)
  if (i.chuaToiHan) return { loai: 'chua-toi-han', chu: t('Chưa đến lịch') };
  if (i.conBaiCuaToi > 0) return { loai: 'cho-ban', chu: t('Chờ bạn chấm') };
  return i.coDayLop ? { loai: 'cho-gv-khac', chu: t('Chờ GV khác') } : { loai: 'cho-cham', chu: t('Chờ chấm') };
}

/** Ba khối của Lịch Test (PR-LT3, T15): Test quá hạn chấm · Test chấm tuần này · Lịch Test tuần này. */
export type KhoiCham = 'qua-han' | 'tuan-nay' | 'lich';

/**
 * T15: khối của MỘT ô chưa chấm — một bài đúng một khối. `tuanThi`, `tuanHomNay` = thứ Hai (ISO); `quaHan` = cờ `overdue` của chính ô
 * (đã qua `quaHanNhapDiem`). Thi tuần trước luôn ở khối 2 (kể cả đã quá hạn từ thứ Năm); cũ hơn mà chưa quá hạn = hạn riêng dời xa → khối 2.
 */
export function khoiCham(i: { tuanThi: string; tuanHomNay: string; quaHan: boolean }): KhoiCham {
  const thi = i.tuanThi.slice(0, 10), nay = i.tuanHomNay.slice(0, 10);
  if (thi >= nay) return 'lich';
  if (thi === addDaysIso(nay, -7)) return 'tuan-nay';
  return i.quaHan ? 'qua-han' : 'tuan-nay';
}

/** T18: Speaking của Mock Test không có GV mặc định — ai dạy Speaking cùng chi nhánh cũng chấm được. MT0 / lớp thường không áp. */
export const laChamCheo = (kind: string | null | undefined, skill: string): boolean => kind === 'mock' && skill === 'speaking';
/**
 * OV-13g / OV-13o; OV-14c (chủ SP 18/10): bài chấm chéo CẦN CHẤM từ **thứ Hai tuần thi** (không chờ hết tuần), chưa chấm thì còn tới khi chấm.
 * Một luật cho Công việc, Tổng quan "Lớp tôi dạy". Hạn chấm không đổi (cờ quá hạn của ô).
 */
export const canChamCheo = (chamCheo: boolean, tuanThi: string | null | undefined, tuanHomNay: string): boolean =>
  chamCheo && !!tuanThi && tuanThi.slice(0, 10) <= tuanHomNay.slice(0, 10);
/** Q3 (chủ sản phẩm 06/10): chữ ở chỗ "người giữ việc" của ô Speaking Mock chưa ai nhập. */
export const CHAM_CHEO = t('GV chấm chéo');

/** Lớp nào tự mở khi vào Lịch Test (Q8): người có phân công — lớp còn bài của mình; Quản lý — lớp còn bài. */
export const lopTuMo = (i: { conBai: number; conBaiCuaToi: number; coPhanCong: boolean }) =>
  (i.coPhanCong ? i.conBaiCuaToi > 0 : i.conBai > 0);

/**
 * MỘT Ô CỦA LƯỚI LỚP THƯỜNG: số câu đúng / tổng số câu (Writing và Speaking chấm theo thang điểm thì là điểm đạt /
 * tổng điểm — cùng hai ô, xem ⓘ của lưới).
 *
 * `vienVang` = tổng của dòng này KHÁC tổng đang đặt ở đầu cột, tức là em làm đề khác. Không có tổng cố định theo
 * chương trình, nên "khác tổng cột" là chỉ báo duy nhất có thật.
 */
export function oLuoiThuong(i: { diem: number | null; tong: number | null; tongCot: number | null }): {
  hien: string; vienVang: boolean; trong: boolean;
} {
  const trong = i.diem === null || i.diem === undefined;
  return {
    trong,
    hien: trong || i.tong === null ? '' : `${i.diem}/${i.tong}`,
    vienVang: i.tong !== null && i.tongCot !== null && i.tong !== i.tongCot,
  };
}

/**
 * CÂU KẾT QUẢ CỦA MỘT DÒNG LỚP THƯỜNG. Thiếu điểm KHÁC chưa đạt (spec §3.5): môn chưa chấm không bị đếm thành môn
 * trượt, nên khi chưa đủ điểm thì nói rõ "trên số môn ĐÃ CHẤM".
 */
export function ketQuaThuong(i: { dat: number; daCham: number; tong: number; thieu: string[]; tyLe?: number | null; khongChiaMon?: boolean }): {
  chinh: string; phu: string | null;
} {
  /* MH7: Pre FOU không chia môn — chỉ % tổng. Làm tròn CHỈ để hiện; đạt/không xét trên tỷ lệ chính xác ở máy chủ. */
  if (i.khongChiaMon && i.tyLe != null) return { chinh: `${Math.round(i.tyLe * 100)}%`, phu: null };
  if (i.daCham === 0) return { chinh: t('Chưa nhập điểm'), phu: null };
  const du = i.daCham >= i.tong;
  return {
    chinh: du ? t('{dat}/{tong} môn đạt', { dat: i.dat, tong: i.tong }) : t('{dat}/{daCham} môn đạt', { dat: i.dat, daCham: i.daCham }),
    phu: du || !i.thieu.length ? null : t('còn {x} chưa chấm', { x: i.thieu.join(', ') }),
  };
}

/**
 * DS02 — đếm ngược nhẹ trong ô đang mang dấu "-" của lớp Fast Track: còn bao nhiêu ngày để đổi sang điểm thật trước
 * khi hết Chủ nhật của tuần thi. CHỈ CHỮ, không tô đỏ (plan.md §20 DS02). Lớp thường không dùng hàm này: ở đó dấu "-"
 * dời môn sang tuần sau ngay, không có cửa sổ sửa.
 */
export function demNguocSuaDau(cuoiTuan: string | null, homNay: string): string | null {
  if (!cuoiTuan) return null;
  const het = cuoiTuan.slice(0, 10);
  const nay = homNay.slice(0, 10);
  if (nay > het) return null;
  if (nay === het) return t('Còn hôm nay để sửa');
  const soNgay = Math.round((Date.parse(`${het}T00:00:00Z`) - Date.parse(`${nay}T00:00:00Z`)) / 86400000);
  return t('Còn {soNgay} ngày để sửa', { soNgay });
}

/** Thứ Hai của tuần kế tiếp — dùng khi lớp thường ghi "-" và môn đó tự dời (C08). */
export function tuanKeTiep(weekStart: string): string {
  const monday = mondayOfDate(weekStart);
  return new Date(Date.parse(`${monday}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10);
}

/** Một câu trạng thái chấm cho dòng kỹ năng của Lịch Test. */
export function trangThaiChamLabel(i: { conBai: number; tong: number; quaHan: boolean; chuaToiHan: boolean }): string {
  if (i.conBai === 0) return t('Đã chấm xong');
  if (i.chuaToiHan) return t('Chưa đến lịch');
  return i.quaHan ? t('Quá hạn · còn {conBai} bài', { conBai: i.conBai }) : t('Còn {conBai} bài', { conBai: i.conBai });
}

/**
 * TRẠNG THÁI LƯU THEO TỪNG Ô của lưới chấm (PR-UX1, lỗi thật bản chính 24/09): trước đây một dòng chỉ nhớ lần lưu CUỐI
 * — ô L lưu hỏng (503/BUSY/mạng) rồi ô R lưu được thì dòng hiện "Đã lưu", giáo viên tưởng đủ điểm. Nay mỗi ô giữ trạng
 * thái riêng; dòng chỉ "đã lưu" khi KHÔNG còn ô nào lỗi.
 *
 *   bat-dau     gửi ô lên máy chủ            → dang-luu
 *   thanh-cong  máy chủ nhận                 → da-luu (xoá lỗi cũ của chính ô đó)
 *   loi         lỗi mạng / 5xx               → loi (giữ tới khi chính ô đó lưu được)
 *   bo          máy chủ từ chối có chủ ý (4xx của lệnh "-"), hộp lý do tự báo lỗi → ô về như chưa gửi
 */
export type TrangThaiLuuO = 'dang-luu' | 'da-luu' | 'loi';
export function capNhatLuuO(
  o: Readonly<Record<string, TrangThaiLuuO>>, oKey: string, su: 'bat-dau' | 'thanh-cong' | 'loi' | 'bo',
): Record<string, TrangThaiLuuO> {
  const moi = { ...o };
  if (su === 'bo') delete moi[oKey];
  else moi[oKey] = su === 'bat-dau' ? 'dang-luu' : su === 'thanh-cong' ? 'da-luu' : 'loi';
  return moi;
}
/** Dòng/hàng lớp: có ô lỗi → "n ô chưa lưu" (thắng mọi trạng thái khác); còn ô đang gửi → đang lưu; rồi mới đã lưu. */
export function tomTatLuuDong(cacO: readonly (TrangThaiLuuO | null | undefined)[]): { tt: TrangThaiLuuO | null; soLoi: number } {
  const soLoi = cacO.filter((x) => x === 'loi').length;
  if (soLoi) return { tt: 'loi', soLoi };
  if (cacO.includes('dang-luu')) return { tt: 'dang-luu', soLoi: 0 };
  return { tt: cacO.includes('da-luu') ? 'da-luu' : null, soLoi: 0 };
}
export const chuOChuaLuu = (n: number) => t('{n} ô chưa lưu', { n });

/*
 * Bảng quy đổi số câu đúng → band của trung tâm (sheet 'Bang quy doi'), index = số câu 0–40. Hộp nhập điểm xem trước band khi gõ.
 * shortcut: bản sao của `LISTENING_BY_RAW` / `READING_BY_RAW` ở server/src/fasttrack/scoring.ts (OV-4b không sửa scoring.ts — vùng OV-1c);
 * phép kiểm OV4b-0 so từng số. Gộp về một chỗ khi có PR được sửa scoring.ts.
 */
const L_THEO_CAU = [
  0, 0, 1, 2.5, 2.5, 3, 3, 3.5, 3.5, 3.5, 4, 4, 4, 4.5, 4.5, 4.5, 5, 5, 5, 5,
  5.5, 5.5, 5.5, 6, 6, 6, 6, 6.5, 6.5, 6.5, 7, 7, 7, 7.5, 7.5, 8, 8, 8.5, 8.5, 9, 9,
];
const R_THEO_CAU = [
  0, 0, 1, 1.5, 2.5, 2.5, 3, 3, 3.5, 3.5, 4, 4, 4, 4.5, 4.5, 5, 5, 5, 5, 5.5,
  5.5, 5.5, 5.5, 6, 6, 6, 6, 6.5, 6.5, 6.5, 7, 7, 7, 7.5, 7.5, 8, 8, 8.5, 8.5, 9, 9,
];
/** Band của `n` câu đúng (L/R). Ngoài 0–40 hoặc không nguyên → null. */
export function bandTuSoCau(skill: 'listening' | 'reading', n: number): number | null {
  return Number.isInteger(n) && n >= 0 && n <= 40 ? (skill === 'listening' ? L_THEO_CAU : R_THEO_CAU)[n] : null;
}
/** Câu lỗi số câu ngoài 0–40 (hộp nhập điểm, chủ SP mockup §3). */
export const LOI_SO_CAU_KHOANG = t('số câu đúng từ 0 đến 40.');

/** T10 (PR-MTa): band nhập tay — số hữu hạn 0..9, bậc 0.5. `null` = hợp lệ. */
export function kiemBand(v: unknown): string | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 9 && Number.isInteger(v * 2)
    ? null : t('Band từ 0 đến 9, bậc 0.5 (ví dụ 6.5 hoặc b6).');
}

export type ONhapLR = { raw: number } | { band: number };

/** T10: ô L/R — số nguyên = số câu đúng (như cũ); có dấu chấm hoặc tiền tố "b" = band. '' → null. */
export function docONhapLR(s: string): ONhapLR | { loi: string } | null {
  const t = s.trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return { raw: Number(t) };
  const m = /^[bB](\d+(?:\.\d+)?)$|^(\d+\.\d+)$/.exec(t);
  const band = m ? Number(m[1] ?? m[2]) : NaN;
  const loi = kiemBand(band);
  return loi ? { loi } : { band };
}

/** Lệnh điểm một ô gửi máy chủ (phần chung của `SavePatch` ở web). */
export type PatchDiem = { rawScore?: number | null; band?: number | null; criteria?: (number | null)[]; noShow?: boolean };
/** Ô chỉ cần biết có dấu "-" đang hiệu lực không. */
type OCoDau = { noShow?: unknown; daChot?: unknown };   // PR-BV: dấu đã chốt (`daChot`) cũng là ô mang dấu

/**
 * Chữ người dùng gõ ở ô SỐ CÂU ĐÚNG (L/R) → lệnh gửi máy chủ. '-' LÀ MỘT LỆNH, KHÔNG PHẢI MỘT SỐ (rule book §17.1): "học
 * viên có lịch mà không làm bài". Ô trống vẫn chỉ là chưa nhập; xoá ô đang có dấu '-' là gỡ dấu, không phải chấm điểm.
 * T10: số có dấu chấm hoặc tiền tố "b" là BAND ("6.5", "6.0", "b6"); số nguyên trơn là số câu ("6" = 6 câu).
 * MỘT hàm cho mọi nơi nhập (bảng cả lớp, hồ sơ Test) — không có luật thứ hai.
 *
 * `null` = chữ không hợp lệ ("--", "abc", "6,5", "b6.3", "10.5"…): KHÔNG gửi gì. Trước đây `Number("--")` ra NaN, lên
 * máy chủ thành `null` — tức là xoá ô mà không ai định xoá.
 */
export const LOI_SO_CAU = t('Số câu đúng là số nguyên, hoặc band 6.5 / b6, hoặc "-" nếu học viên không làm bài.');
export function rawPatchFrom(text: string, cell: OCoDau): PatchDiem | null {
  const t = text.trim();
  if (t === '-') return { noShow: true };
  if (t === '') return cell.noShow || cell.daChot ? { noShow: false } : { rawScore: null };
  const o = docONhapLR(t);
  if (!o || 'loi' in o) return null;
  return 'band' in o ? { band: o.band } : { rawScore: o.raw };
}

/**
 * Bốn ô tiêu chí (+ ô Band tuỳ chọn) → lệnh gửi máy chủ + band xem trước. MỘT DẤU '-' TRONG BỐN Ô LÀ ĐỦ báo chưa có bài
 * cho ĐÚNG BÀI NÀY: không ghi các tiêu chí thành 0, không xoá bài khác. Xoá sạch bốn ô của bài đang có dấu '-' là GỠ dấu;
 * xoá sạch bốn ô của bài có điểm là xoá điểm như cũ.
 *
 * T10: `bandText` có chữ → chỉ nhận khi bốn tiêu chí đều trống (`{ band }`, xem trước = band); band cùng tiêu chí → lỗi
 * "Điền band hoặc tiêu chí" (máy chủ trả 400 trường hợp này).
 * OV-4c: `bandThang` (= `duocNhapBandThang`) false → lượt thường: `bandText` không bao giờ thành lệnh (`LOI_BAND_TU_TINH`); mặc định false.
 *
 * `patch: null` = có ô không hợp lệ (không phải số, không phải đúng một "-", ví dụ "--"): KHÔNG gửi gì — trước đây ô
 * đó thành NaN rồi thành `null` trên máy chủ, tức là xoá tiêu chí mà không ai định xoá. `loi` = câu nói vì sao.
 */
export const LOI_TIEU_CHI = t('Mỗi tiêu chí là một số như 6.5, hoặc "-" nếu học viên không làm bài.');
export const LOI_BAND_HOAC_TIEU_CHI = t('Điền band hoặc tiêu chí');
/** OV-4c: Band W1 / W2 / S ở lượt thường tự tính từ bốn tiêu chí; nhập thẳng chỉ MT cũ + MT0 (một ô Band). Một hàm cho web và máy chủ. */
export const duocNhapBandThang = (a: { lichSu: boolean; mt0?: boolean }): boolean => a.lichSu || !!a.mt0;
export const LOI_BAND_TU_TINH = t('Writing / Speaking: nhập 4 tiêu chí — Band tự tính. Band nhập thẳng chỉ cho MT cũ.');
export function criteriaPatchFrom(vals: string[], cell: OCoDau, bandText = '', bandThang = false): {
  dash: boolean; preview: number | null; patch: PatchDiem | null; loi: string | null;
} {
  const hong = vals.some((v) => { const t = v.trim(); return t !== '' && t !== '-' && !Number.isFinite(Number(t)); });
  if (hong) return { dash: false, preview: null, patch: null, loi: LOI_TIEU_CHI };
  const dash = vals.some((v) => v.trim() === '-');
  const allEmpty = vals.every((v) => v.trim() === '');
  const bt = bandText.trim();
  if (bt) {
    if (!bandThang) return { dash, preview: null, patch: null, loi: LOI_BAND_TU_TINH };
    if (!allEmpty) return { dash, preview: null, patch: null, loi: LOI_BAND_HOAC_TIEU_CHI };
    const m = /^[bB]?(\d+(?:\.\d+)?)$/.exec(bt);
    const band = m ? Number(m[1]) : NaN;
    const loi = kiemBand(band);
    return loi ? { dash: false, preview: null, patch: null, loi } : { dash: false, preview: band, patch: { band }, loi: null };
  }
  const nums = vals.map((v) => (v.trim() === '' || v.trim() === '-' ? null : Number(v)));
  const filled = nums.filter((v) => v !== null) as number[];
  const preview = !dash && filled.length === 4 ? Math.round((filled.reduce((a, b) => a + b, 0) / 4) * 2 + 1e-9) / 2 : null;
  const patch: PatchDiem = dash ? { noShow: true }
    : allEmpty && (cell.noShow || cell.daChot) ? { noShow: false }
    : { criteria: nums };
  return { dash, preview, patch, loi: null };
}
