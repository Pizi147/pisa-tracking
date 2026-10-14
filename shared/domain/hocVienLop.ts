/**
 * HỌC VIÊN & LỚP + HỒ SƠ LỚP — luật hiển thị thuần (PR-Qa; đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §2, §3.6, §3.7, §4).
 *
 * Mọi quyết định "hiện chữ gì, hiện mấy cái, xếp thế nào" của hai màn nằm ở đây để kiểm được bằng harness máy chủ (web không có bộ
 * kiểm thử). Component React chỉ vẽ.
 */
import { PROGRAMME_TEMPLATES, programmeOf, type ProgrammeCode, skillShort, tenMon, tenMonNgan } from './normal.ts';
import { deadlineView } from './display.ts';
import { goiYCuoiKhoa } from './cuoiKhoa.ts';
import type { ViecTiepCase } from './sosV4.ts';
import type { NhanYThucEm } from './yThuc.ts';
import { tuanKhoa, tuanLich } from './hienThiNgay.ts';
import { CHU_CHUYEN_LOP } from './chuyenLop.ts';
import { NHAN_TRANG_THAI, TONE_BADGE_TRANG_THAI } from './trangThai.ts';
import { CLASS_PHASE_LABEL, type ClassPhase } from './fasttrack.ts';

// ---------------------------------------------------------------- chung

/** Dòng phụ tối đa ~60 ký tự (G-3). Dài hơn thì cắt và thêm "…" — đủ câu nằm ở tooltip của ô. */
export const DONG_PHU_TOI_DA = 60;
export function catDongPhu(s: string): string {
  return s.length <= DONG_PHU_TOI_DA ? s : `${s.slice(0, DONG_PHU_TOI_DA - 1)}…`;
}

/** Mã học viên viết gọn 6 số, chữ mờ (§3.6). Mã không có chữ số thì giữ nguyên. */
export function maHocVienNgan(ma: string | null | undefined): string {
  const so = (ma ?? '').replace(/\D/g, '');
  return so ? so.slice(-6).padStart(6, '0') : (ma ?? '');
}

/** Tên đầy đủ của một kỹ năng/môn — tooltip của chữ viết tắt (G-7). */
export function tenKyNang(k: string): string {
  return tenMon(null, k);
}

export function laVaiQuanLy(roles: readonly string[] | null | undefined): boolean {
  return (roles ?? []).some((r) => r === 'system_admin' || r === 'manager');
}

/**
 * OV-10b (mockup vai 13/10 mục 6): góc xem Học viên & Lớp / hồ sơ theo việc của vai — `null` = Quản lý / Quản trị / GV (bảng, hồ sơ không đổi).
 * Máy chủ (`p.roleKeys`) và web (`session.roles`) cùng một hàm.
 */
export type VaiXemHocVien = 'tvv' | 'cx' | 'admin';
export function vaiXemHocVien(roles: readonly string[] | null | undefined): VaiXemHocVien | null {
  const r = roles ?? [];
  if (laVaiQuanLy(r) || r.includes('teacher')) return null;
  return r.includes('consultant') ? 'tvv' : r.includes('cx') ? 'cx' : r.includes('office_admin') ? 'admin' : null;
}
/** OV-11e (Q8 chủ SP): tích / bỏ KCK chỉ Quản lý / Quản trị (`cycle.edit`) và TVV — CX sửa được Target số, không đổi dấu KCK. Máy chủ + web cùng hàm. */
export const duocDoiKck = (roles: readonly string[] | null | undefined, suaLoTrinh: boolean): boolean => suaLoTrinh || (roles ?? []).includes('consultant');
/** OV-10b: ô nhập Liên hệ hiện cho QL, Quản trị, TVV, CX, Admin — GV (GVCN, GVBM) không thấy (máy chủ vẫn nhận theo `student.edit_info`). */
export const coONhapLienHe = (roles: readonly string[] | null | undefined): boolean => laVaiQuanLy(roles) || vaiXemHocVien(roles) !== null;

/** OV-10b: chip Học viên & Lớp của TVV / CX — số = `chipHocVien` (OV-10c, cùng ô Tổng quan). "Chờ QL chọn bước tiếp" chỉ hiện khi có em. */
export const CHIP_VAI = ['tat-ca', 'can-chu-y', 'tam-dung', 'sap-thi', 'thieu_tt', 'cho-buoc-tiep'] as const;
export type ChipVai = (typeof CHIP_VAI)[number];
/** CX mở ở chip `can-chu-y` (không phải 1 000+ em), TVV ở `tat-ca` của HV mình. Nhãn chip ở web (`HocVienTheoVai.tsx`). */
export const chipMacDinhVai = (vai: 'tvv' | 'cx'): ChipVai => (vai === 'cx' ? 'can-chu-y' : 'tat-ca');
export const docChipVai = (s: string | null | undefined, vai: 'tvv' | 'cx'): ChipVai =>
  (CHIP_VAI as readonly string[]).includes(s ?? '') ? (s as ChipVai) : chipMacDinhVai(vai);

// ---------------------------------------------------------------- chip lọc (§3.6, Q4)

/** PR-S4F #4: `qua-han` — đích của badge "n HV quá hạn việc" (hộp lớp + đầu hồ sơ lớp); chip chỉ hiện khi đang lọc bằng nó (`chipHienLoc`). */
export const LOC_HOC_VIEN = ['tat-ca', 'can-lam', 'qua-han', 'cho-duyet', 'sos', 'thieu_tt'] as const;
export type LocHocVien = (typeof LOC_HOC_VIEN)[number];
export const LOC_HOC_VIEN_NHAN: Record<LocHocVien, { nhan: string; goiY: string; can: string | null }> = {
  'tat-ca': { nhan: 'Tất cả', goiY: 'Mọi học viên đang học trong các lớp đang hiện.', can: null },
  'can-lam': { nhan: NHAN_TRANG_THAI['can-lam'], goiY: 'Có việc quá hạn hoặc việc hạn ngắn (xác nhận, xử lý vi phạm).', can: null },
  'qua-han': { nhan: NHAN_TRANG_THAI['qua-han'], goiY: 'Có việc đã quá hạn (xác nhận, kết quả, xử lý vi phạm) — cùng số với badge "HV quá hạn việc".', can: null },
  'cho-duyet': { nhan: NHAN_TRANG_THAI['cho-duyet'], goiY: 'Có yêu cầu đang chờ Quản lý duyệt.', can: null },
  sos: { nhan: 'Đang SOS', goiY: 'Chỉ Fast Track: Mock gần nhất ở mức SOS 1–3.', can: 'case.view' },
  thieu_tt: { nhan: 'Thiếu thông tin', goiY: 'Hồ sơ còn thiếu thông tin cần để xếp lịch và theo dõi.', can: null },
};

export type DocLoc = { loc: LocHocVien } | { chuyenDen: string };
/** Khoá `view=` trên URL — giữ khoá cũ để link đã lưu, BranchPulse, WeeklyBoard, signals.ts vẫn mở đúng chip (ba chip Case cũ → Cần làm). */
export function docThamSoLoc(view: string | null | undefined): DocLoc {
  if (view === 'sos' || view === 'sos_open') return { loc: 'sos' };
  if (view === 'case_working' || view === 'case_no_plan' || view === 'case_overdue') return { loc: 'can-lam' };
  if (view === 'can-lam' || view === 'qua-han' || view === 'cho-duyet' || view === 'thieu_tt') return { loc: view };
  if (view === 'missing_scores') return { chuyenDen: '/test/lich' };
  return { loc: 'tat-ca' };
}

/** Chip `qua-han` không nằm thường trực trên hàng chip — chỉ hiện (đang bấm) khi người dùng tới từ badge. */
export function chipHienLoc(k: LocHocVien, dangLoc: LocHocVien | null): boolean {
  return k !== 'qua-han' || dangLoc === 'qua-han';
}

/** MỘT hàm đếm chip cho máy chủ (`dem`) và web (đổi công tắc khung): mỗi em mang các cờ `loc`, thuộc khung `ft`/`thuong`. */
export function demLoc(hocVien: readonly { loc: readonly string[]; khung: 'ft' | 'thuong' }[], khung: 'tat-ca' | 'ft' | 'thuong'): Record<LocHocVien, number> {
  const dem = Object.fromEntries(LOC_HOC_VIEN.map((k) => [k, 0])) as Record<LocHocVien, number>;
  for (const h of hocVien) {
    if (khung !== 'tat-ca' && h.khung !== khung) continue;
    dem['tat-ca'] += 1;
    for (const k of LOC_HOC_VIEN) if (k !== 'tat-ca' && h.loc.includes(k)) dem[k] += 1;
  }
  return dem;
}

// ---------------------------------------------------------------- phạm vi (§3.6, Q3)

export const PHAM_VI = ['cua-toi', 'toi', 'chi-nhanh', 'tat-ca'] as const;
export type PhamVi = (typeof PHAM_VI)[number];
export const PHAM_VI_NHAN: Record<PhamVi, string> = { 'cua-toi': 'HV của tôi', toi: 'Lớp tôi dạy', 'chi-nhanh': 'Chi nhánh', 'tat-ca': 'Tất cả' };

/**
 * Chỉ lựa chọn có nghĩa: QL một chi nhánh thì "Tất cả" trùng "Chi nhánh" nên không có. PR-OV2a: "HV của tôi" (TVV) chỉ có khi đã được gán
 * ít nhất một em (`students.consultant_user_id`) — chưa gán em nào thì mở thẳng Chi nhánh, không để danh sách trống.
 */
export function phamViCoThe(i: { dayLop: boolean; capChiNhanh: boolean; toanHeThong: boolean; soChiNhanh: number; cuaToi?: boolean }): PhamVi[] {
  const out: PhamVi[] = [];
  if (i.cuaToi) out.push('cua-toi');
  if (i.dayLop) out.push('toi');
  if (i.capChiNhanh || i.toanHeThong) out.push('chi-nhanh');
  if (i.toanHeThong || i.soChiNhanh > 1) out.push('tat-ca');
  return out.length ? out : ['tat-ca'];
}
/** T6: QL/Quản trị mở ở Chi nhánh kể cả khi có dạy lớp; GV thuần giữ "Lớp tôi dạy". */
export function phamViMacDinh(coThe: readonly PhamVi[], laQuanLy = false): PhamVi {
  if (laQuanLy && coThe.includes('chi-nhanh')) return 'chi-nhanh';
  if (coThe.includes('cua-toi')) return 'cua-toi';
  if (coThe.includes('toi')) return 'toi';
  if (coThe.includes('tat-ca')) return 'tat-ca';
  return coThe[0] ?? 'tat-ca';
}

// ---------------------------------------------------------------- kết quả gần nhất (§3.6, 07c A, Q11)

/** Đúng các trường `Standing` (server/src/students/standing.ts) mà cột này đọc. */
export type KetQuaVao = {
  mode: 'ielts_band' | 'ratio' | null;
  attemptLabel: string | null;
  /** `mock` · `progress` · `final` (T58: lượt Cuối khoá đủ điểm hiện % tổng). */
  attemptKind?: string | null;
  /** PR-UXF-b (G5): id + lớp của lượt đó — ô Kết quả gần nhất link tới đợt qua `duongDotTest`. */
  attemptId?: number | null; attemptClassId?: number | null;
  sosLevel: number | null; provisional: boolean;
  scored: number; required: number; failed: number | null;
  overall: number | null; expectation: number | null;
  belowSkills: { skill: string; band: number }[];
  failedSkills: { skill: string; score: number; total: number }[];
  /** Mã chương trình của lộ trình (MH2: FOU "G+V", "P"). Không có → tên chung. */
  chuongTrinh?: string | null;
  /** MH7: Pre FOU — kết quả chỉ là % tổng (`tyLeTong` có khi đủ điểm). */
  khongChiaMon?: boolean;
  tyLeTong?: number | null;
  /** OV-6b1: ngưỡng đạt của lớp (lớp thường) — gợi ý Cuối khoá đọc cùng ngưỡng. */
  nguong?: number;
  /** OV-9: em KCK dưới kỳ vọng — không SOS (`sosLevel` null). */
  kckDuoi?: boolean;
};
/**
 * Cột Kết quả gần nhất (T18, K2-01, E7): tầng 1 `chinh` (+ `lech` FT) + tối đa HAI dòng chữ 12 px, không "…" (đủ chữ, không cắt).
 * `sos` chỉ có ở Fast Track (T58: lớp thường không SOS ở cột này).
 */
export type KetQuaHien = {
  chinh: string;                 // "6.0" · "58%" · "3/4 môn đạt" · "—"
  lech: string | null;           // E7: "−0.5" (tooltip "Dưới kỳ vọng 0.5") — thay "Thiếu 0.5", tránh trùng "Thiếu 2 thông tin"
  dat: boolean; sos: string | null;
  /** Chỉ có (true) khi SOS mới chấm một phần, còn đổi được khi đủ điểm: vẽ viền nét đứt, không ⚠ (⚠ chỉ nghĩa quá hạn). */
  sosTamThoi?: boolean;
  /** OV-9: em KCK dưới kỳ vọng — chip trung tính "Dưới kỳ vọng · KCK", độ lệch không tô đỏ. */
  kckDuoi?: boolean;
  dong1: string | null;          // "MT3 · kỳ vọng 7.0 · 3/4 kỹ năng có điểm" · "Final Test · 2/4 môn có điểm" · "Chưa có kết quả"
  dong2: string | null;          // "Không đạt: L R W" · "Không đạt: L G+V" · null
};

const band1 = (n: number) => n.toFixed(1);
const noiDong = (...p: (string | null | false)[]) => p.filter(Boolean).join(' · ');

export function ketQuaGanNhat(k: KetQuaVao | null): KetQuaHien {
  if (!k || !k.attemptLabel) return { chinh: '—', lech: null, dat: false, sos: null, dong1: 'Chưa có kết quả', dong2: null };
  const ct = k.chuongTrinh ?? null;
  if (k.mode === 'ratio') {
    /* T58: lớp thường KHÔNG có SOS ở cột này. Cuối khoá (hoặc Pre FOU) đủ điểm → % tổng; còn lại "n/N môn đạt". */
    const thieuDiem = k.scored < k.required;
    const chinh = (k.attemptKind === 'final' || k.khongChiaMon) && k.tyLeTong != null ? `${Math.round(k.tyLeTong * 100)}%`
      : k.khongChiaMon || k.scored === 0 ? '—' : `${k.scored - (k.failed ?? 0)}/${thieuDiem ? k.scored : k.required} môn đạt`;
    /* Pre FOU: đạt/không xét trên tỷ lệ chính xác ở máy chủ (`sosLevel === 0`); lớp thường khác: đủ môn và không môn nào trượt. */
    const dat = k.khongChiaMon ? k.sosLevel === 0 : k.sosLevel === 0 && !k.provisional && !thieuDiem;
    /* PR-UXF-a K2-01 (Q3): Cuối khoá đủ điểm → hậu tố hướng ở dòng 1 ("Cuối khoá → học lại"), cùng luật `goiYCuoiKhoa`; không dính vào số %. */
    const huong = k.attemptKind === 'final' && !thieuDiem && k.tyLeTong != null
      ? goiYCuoiKhoa({ ct, tyLe: k.tyLeTong, monTruot: k.failedSkills.map((f) => f.skill), nguong: k.nguong })?.nhanNgan ?? null : null;
    return {
      chinh, lech: null, dat, sos: null,
      dong1: huong ? `${k.attemptLabel} ${huong}` : k.khongChiaMon || !thieuDiem ? k.attemptLabel : `${k.attemptLabel} · ${k.scored}/${k.required} môn có điểm`,
      dong2: k.khongChiaMon || !k.failedSkills.length ? null : `Không đạt: ${k.failedSkills.map((f) => tenMonNgan(ct, f.skill)).join(' ')}`,
    };
  }
  const sos = k.sosLevel !== null && k.sosLevel > 0 ? `SOS ${k.sosLevel}` : null;
  const sosTamThoi = sos !== null && k.provisional;
  const chinh = k.overall !== null ? band1(k.overall) : '—';
  const lech = k.overall !== null && k.expectation !== null && k.overall < k.expectation ? `−${band1(k.expectation - k.overall)}` : null;
  return {
    chinh, lech, dat: k.sosLevel === 0 && !k.provisional, sos,
    dong1: noiDong(k.attemptLabel, k.expectation !== null && `kỳ vọng ${band1(k.expectation)}`, k.scored < k.required && `${k.scored}/${k.required} kỹ năng có điểm`),
    dong2: k.belowSkills.length ? `${k.kckDuoi ? 'Dưới kỳ vọng' : 'Không đạt'}: ${k.belowSkills.map((b) => skillShort(b.skill)).join(' ')}` : null,
    ...(sosTamThoi ? { sosTamThoi } : {}),
    ...(k.kckDuoi ? { kckDuoi: true } : {}),
  };
}

/**
 * PR-UXF-a K2-05 (Q5): em lớp thường "có mốc đánh giá tiếp theo" = còn lượt planned, HOẶC đã có bài Cuối khoá (không huỷ) — hết khoá
 * không còn mốc nào; việc tiếp theo là quyết định chuyển lớp. Một luật cho badge Thiếu thông tin ở Học viên & Lớp và bảng lớp.
 */
export const coMocTiepTheoThuong = (o: { soLuotKeHoach: number; coCuoiKhoa: boolean }): boolean => o.soLuotKeHoach > 0 || o.coCuoiKhoa;

// ---------------------------------------------------------------- cột Khoá lớp thường (§3.6, Q21)

export function khoaLopThuong(i: {
  maChuongTrinh: string | null; tuanHienTai: number | null; tongTuan: number | null;
  tuanKetThuc: string | null; tiepTheo: string | null; homNay: string; nhacLoTrinh?: boolean; choDuyetChuyen?: boolean;
}): { chinh: string; phu: string | null } {
  const ma = i.maChuongTrinh ?? '—';
  let tuan: string | null = null;
  if (i.tuanHienTai !== null && i.tuanHienTai < 1) tuan = 'chưa khai giảng';
  else if (i.tuanHienTai !== null && i.tongTuan) tuan = tuanKhoa(Math.min(i.tuanHienTai, i.tongTuan), i.tongTuan);
  else if (i.tuanHienTai !== null) tuan = `tuần ${i.tuanHienTai}`;   // OV-6b2: lớp liên tục — không "/tổng"
  // Thứ tự ưu tiên dòng phụ (PR-LT): tiếp theo đã ghi › nhắc chưa ghi › kết thúc khoá.
  /* PR-DH (D1): cờ "chưa có quyết định chuyển lớp" luôn hiện khi em thuộc số trên badge lớp — kể cả khi đã ghi lộ trình tiếp theo. */
  const co = i.nhacLoTrinh ? CHU_CHUYEN_LOP.chua.toLowerCase() : null;
  const phu = i.tiepTheo ? [`tiếp theo: ${i.tiepTheo}`, co].filter(Boolean).join(' · ')
    : i.choDuyetChuyen ? CHU_CHUYEN_LOP.choDuyetDeXuat.replace(/^Chờ/, 'chờ')
    : co ?? (i.tuanKetThuc ? `kết thúc ${tuanLich(i.tuanKetThuc, i.homNay)}` : null);
  return { chinh: tuan ? `${ma} · ${tuan}` : ma, phu };
}

// ---------------------------------------------------------------- badge hộp lớp / đầu hồ sơ lớp (Q5, Q7)

export type BadgeLop = {
  key: 'xep-lop' | 'thieu-gv' | 'cham' | 'chang' | 'thieu-tt' | 'cho-duyet' | 'qua-han'; nhan: string;
  tone: 'danger' | 'warn' | 'info' | 'wait' | 'muted';
  /** Câu đầy đủ cho tooltip (PR-UX0, B-1: badge là danh từ + số, câu dài nằm ở đây). */
  title?: string;
};
const CHANG_THI = ['progress_soon', 'progress_week', 'final_soon', 'final_week'];
/** B4: thứ tự badge theo vai — GV thấy việc của mình trước, Quản lý thấy việc chờ mình duyệt trước. */
const THU_TU_BADGE: Record<'gv' | 'ql', readonly BadgeLop['key'][]> = {
  gv: ['cham', 'qua-han', 'chang', 'thieu-gv', 'thieu-tt', 'xep-lop', 'cho-duyet'],
  ql: ['cho-duyet', 'xep-lop', 'cham', 'qua-han', 'thieu-gv', 'chang', 'thieu-tt'],
};

/**
 * B4, K2-06, T53 Q5 (PR-HVL): badge hộp lớp / đầu hồ sơ lớp THEO VAI. Bỏ "Case mở" (vào Cần hỗ trợ); gộp `het-khoa` +
 * `chua-lo-trinh` thành `xep-lop`; thêm `cho-duyet` (yêu cầu chờ Quản lý) và `qua-han` (em có việc quá hạn). Hiện 2, còn lại "+n" (MenuDong).
 */
export function badgeLop(c: {
  vai: 'gv' | 'ql';
  needsPlacement: boolean; canXepLop: number; missingSkills: readonly string[];
  /** Số bài chờ chấm của lớp (0 = không hiện badge). */
  soBaiChoCham: number; needScoresTitle: string | null;
  phase: string; missingCount: number; soChuaLoTrinhTiep?: number;
  soChoDuyet?: number; soEmQuaHan?: number;
  /** Mã chương trình lớp — tên ô thiếu GV theo chương trình (FOU "G+V"). */
  chuongTrinh?: string | null;
}): { hien: BadgeLop[]; an: BadgeLop[] } {
  const nXep = c.needsPlacement ? c.canXepLop : c.soChuaLoTrinhTiep ?? 0;
  const co: Partial<Record<BadgeLop['key'], BadgeLop>> = {};
  if (nXep > 0) {
    co['xep-lop'] = {
      /* PR-Dọn (Câu 2 = B): lớp chưa hết khoá → em chưa có quyết định chuyển lớp. PR-LCb: Quản lý quyết ở panel "Lộ trình tiếp theo". */
      key: 'xep-lop', nhan: c.needsPlacement ? `${nXep} HV cần xếp lớp tiếp` : `${nXep} HV ${CHU_CHUYEN_LOP.chua.toLowerCase()}`, tone: 'warn',
      title: c.needsPlacement ? 'Lớp đã hết khoá: những học viên này chưa được xếp lớp tiếp' : 'Quản lý quyết định ở Lộ trình tiếp theo',
    };
  }
  if (c.missingSkills.length) co['thieu-gv'] = { key: 'thieu-gv', nhan: `Thiếu GV ${c.missingSkills.map((k) => tenMonNgan(c.chuongTrinh, k)).join(', ')}`, tone: 'warn' };
  if (c.soBaiChoCham > 0) co.cham = { key: 'cham', nhan: `${c.soBaiChoCham} bài chờ chấm`, tone: TONE_BADGE_TRANG_THAI['cho-cham'], title: c.needScoresTitle ?? undefined };
  if (CHANG_THI.includes(c.phase)) co.chang = { key: 'chang', nhan: CLASS_PHASE_LABEL[c.phase as ClassPhase], tone: 'info' };
  if (c.missingCount > 0) co['thieu-tt'] = { key: 'thieu-tt', nhan: `Thiếu ${c.missingCount} thông tin`, tone: 'warn' };
  if (c.soChoDuyet) co['cho-duyet'] = { key: 'cho-duyet', nhan: `${c.soChoDuyet} chờ duyệt`, tone: TONE_BADGE_TRANG_THAI['cho-duyet'], title: 'Yêu cầu đang chờ Quản lý duyệt' };
  if (c.soEmQuaHan) co['qua-han'] = { key: 'qua-han', nhan: `${c.soEmQuaHan} HV quá hạn việc`, tone: 'danger', title: 'Học viên có việc đã quá hạn (xác nhận, kết quả, xử lý vi phạm)' };
  const all = THU_TU_BADGE[c.vai].flatMap((k) => (co[k] ? [co[k]!] : []));
  return { hien: all.slice(0, 2), an: all.slice(2) };
}

/**
 * Badge lớp theo vai (OV-10b, OV-11g HL-8) — Học viên & Lớp và đầu hồ sơ lớp cùng hàm. TVV / CX: chỉ badge thông tin (chặng · thiếu GV · thiếu thông tin).
 * Admin: bỏ badge việc của QL / GV (quá hạn việc, chờ duyệt, chốt lộ trình / xếp lớp) — Admin không làm các việc đó. QL / GV giữ đủ.
 */
export function badgeHienTheoVai(vai: VaiXemHocVien | null, key: BadgeLop['key']): boolean {
  if (vai === 'tvv' || vai === 'cx') return key === 'chang' || key === 'thieu-gv' || key === 'thieu-tt';
  if (vai === 'admin') return key !== 'qua-han' && key !== 'cho-duyet' && key !== 'xep-lop';
  return true;
}
/** Chip lọc việc của QL / GV (Cần làm, Quá hạn, Chờ duyệt) — Admin, TVV, CX không có (HL-8; TVV / CX dùng trang riêng). */
export const chipViecTheoVai = (vai: VaiXemHocVien | null, k: LocHocVien): boolean =>
  vai === null || (k !== 'can-lam' && k !== 'qua-han' && k !== 'cho-duyet');

// ---------------------------------------------------------------- dòng GV bộ môn (06c §1)

export type NhomGiaoVien = { id: number | null; ten: string; kyNang: string[]; nhan: string; title: string };
export function nhomGiaoVienBoMon(
  kyNangLop: readonly string[], phanCong: readonly { skill: string; id: number; name: string }[], ct: string | null = null,
): NhomGiaoVien[] {
  const nhom: NhomGiaoVien[] = [];
  const theoKhoa = new Map<string, NhomGiaoVien>();
  for (const k of kyNangLop) {
    const pc = phanCong.find((x) => x.skill === k) ?? null;
    const khoa = pc ? `gv-${pc.id}` : 'chua';
    let g = theoKhoa.get(khoa);
    if (!g) {
      g = { id: pc?.id ?? null, ten: pc?.name ?? 'Chưa phân công', kyNang: [], nhan: '', title: '' };
      theoKhoa.set(khoa, g);
      nhom.push(g);
    }
    g.kyNang.push(k);
  }
  for (const g of nhom) {
    g.nhan = g.kyNang.map((k) => tenMonNgan(ct, k)).join(' · ');
    g.title = g.kyNang.map((k) => tenMon(ct, k)).join(' · ');
  }
  return nhom;
}

// ---------------------------------------------------------------- menu ⋯ dòng học viên (§3.7, §4, Q1)

/* PR-YT4 (K2-30 phần chữ): bỏ mục `Hồ sơ` (tên em đã là liên kết); "+ Ghi vi phạm" (T31 — "Ghi nhận" chỉ nghĩa đã xem). */
export type MucMenuDong = 'vi-pham' | 'case' | 'nhap-diem' | 'sua-thong-tin' | 'lo-trinh-tiep' | 'chuyen-lop' | 'de-xuat-chuyen-lop';
export const MUC_MENU_DONG_NHAN: Record<MucMenuDong, string> = {
  'vi-pham': '+ Ghi vi phạm', case: '+ Case', 'nhap-diem': 'Nhập điểm', 'sua-thong-tin': 'Sửa thông tin',
  'lo-trinh-tiep': 'Lộ trình tiếp theo', 'chuyen-lop': 'Chuyển lớp…', 'de-xuat-chuyen-lop': 'Đề xuất chuyển lớp…',
};
/** Việc HIẾM của dòng (K2-30): kẻ vạch trước mục hiếm đầu tiên — tách khỏi việc hằng ngày (Ghi vi phạm · Case · Nhập điểm). */
export const MUC_MENU_DONG_HIEM: readonly MucMenuDong[] = ['sua-thong-tin', 'lo-trinh-tiep', 'chuyen-lop', 'de-xuat-chuyen-lop'];
/**
 * Hai mục thuộc PR-LT (đợt 5). "Lộ trình tiếp theo" (OV-3b: chỉ Quản lý) mở hộp Lộ trình của em ở bảng lớp (`duongLoTrinhLop`);
 * "Chuyển lớp…" mở `ChuyenLopPanel.tsx` — gắn ở `web/src/modules/classes/thaoTacDongHocVien.tsx`.
 */
export const MENU_DONG_CHO_PR_LT = { loTrinhTiepTheo: true, chuyenLop: true } as const;

export function mucMenuDongHocVien(i: {
  laLopThuong: boolean; dangHoc: boolean; coTheGhiViPham: boolean; coTheBaoCase: boolean;
  coTheNhapDiem: boolean; coTheSuaHocVien: boolean; coTheChuyenLop: boolean;
  /** PR-CT (Q30-1): GVCN thấy "Đề xuất chuyển lớp…" thay cho "Chuyển lớp…" (chỉ Quản lý ra lệnh). */
  coTheDeXuatChuyenLop?: boolean;
}, bat: { loTrinhTiepTheo: boolean; chuyenLop: boolean } = MENU_DONG_CHO_PR_LT): MucMenuDong[] {
  const out: MucMenuDong[] = [];
  if (!i.dangHoc) return out;
  if (i.coTheGhiViPham) out.push('vi-pham');
  if (i.coTheBaoCase) out.push('case');
  if (i.coTheNhapDiem) out.push('nhap-diem');
  /* PR-OV2b: Sửa thông tin một em ngay tại dòng (panel như ⋯ hồ sơ HV). */
  if (i.coTheSuaHocVien) out.push('sua-thong-tin');
  if (bat.loTrinhTiepTheo && i.laLopThuong && i.coTheChuyenLop) out.push('lo-trinh-tiep');
  if (bat.chuyenLop && i.coTheChuyenLop) out.push('chuyen-lop');
  else if (bat.chuyenLop && i.coTheDeXuatChuyenLop) out.push('de-xuat-chuyen-lop');
  return out;
}

// ---------------------------------------------------------------- sắp xếp, lớp mở sẵn (§3.6, Q19)

export type SapXep = 'ten' | 'chu-y';
export type DongDeXep = { ten: string; quaHan: boolean; canhBao: boolean; sosLevel: number | null; soCaseMo: number };
export function diemChuY(r: DongDeXep): number {
  return (r.quaHan ? 1000 : 0) + (r.canhBao ? 500 : 0) + (r.sosLevel ?? 0) * 100 + r.soCaseMo;
}
export function sapXepHocVien<T extends DongDeXep>(rows: readonly T[], cach: SapXep): T[] {
  const theoTen = (a: T, b: T) => a.ten.localeCompare(b.ten, 'vi');
  return [...rows].sort(cach === 'ten' ? theoTen : (a, b) => diemChuY(b) - diemChuY(a) || theoTen(a, b));
}

export function lopMoSan(i: { thamSoOpen: number[] | null; lopHien: number[]; dangLoc: boolean }): number[] {
  if (i.thamSoOpen !== null) return i.thamSoOpen.filter((id) => i.lopHien.includes(id));
  /* T17 (PR-N1): không lọc → không tự mở lớp nào (danh sách gọn, người dùng tự chọn); đang lọc → mở tối đa 5 lớp có kết quả. */
  return i.dangLoc ? i.lopHien.slice(0, 5) : [];
}

// ---------------------------------------------------------------- việc tiếp theo (Q13)

/**
 * Một việc ở cột "Việc tiếp theo" (PR-UX3, B-2/B-3, mockup 17 #14–#15): `viec` là chữ chính (động từ + đối tượng), hạn là
 * mẩu riêng (`han` = "hết T2 14/09", `quaHanNgay` = số ngày trễ) — giao diện nối "⚠ quá hạn 3 ngày" đỏ hoặc "· hết T2 14/09" mờ
 * (PR-N1 A6: luôn đủ chữ "quá hạn"), không nhét hạn vào chữ việc.
 * `title` là câu đầy đủ cho tooltip.
 */
export type ViecTiepTheo = {
  viec: string; han: string | null; quaHanNgay: number | null; tone: 'danger' | 'warn' | 'info'; title: string;
  /** B8: đích để web dựng link. */
  dich: DichViec;
};
/** Việc bấm được đi đâu (B8): lưới nhập điểm · tab Ý thức của em · Ngăn Case (kèm PA / việc Ghi kết quả). */
export type DichViec = { loai: 'nhap-diem' } | { loai: 'y-thuc' } | { loai: 'case'; caseId: number; paId?: number; ghiKetQua?: boolean };
/** Một Case mở của em như `viecTiepCuaEm` cần: `viecTiep` là kết quả NGUYÊN của `viecTiepCuaCase` (một nguồn luật SOS). */
export type CaseViec = { caseId: number; topic: string | null; viecTiep: ViecTiepCase | null };

/** Bỏ tên PA dài, giữ động từ: "Xác nhận PA Ôn lại bài" → "Xác nhận PA L". */
const RUT_GON = ['Xác nhận PA', 'Kết quả cuối', 'Kết quả PA'];
const HANG_TONE = { danger: 0, warn: 1, info: 2 } as const;

/**
 * MỘT nguồn "việc tiếp theo" của em (K2-04, B8) — cột Việc tiếp theo (Học viên & Lớp), cột Theo dõi (bảng điểm FT), cột Việc tiếp
 * (Cần hỗ trợ). Việc của một Case lấy NGUYÊN `viecTiepCuaCase` (chỉ rút gọn chữ), không viết luật thứ tư. Xếp danger → warn → info.
 */
export function viecTiepCuaEm(i: {
  nhapDiem: { kyNang: string[]; dot: string | null; quaHan: boolean; han?: string | null } | null;
  cases: readonly CaseViec[];
  yThuc: NhanYThucEm | null;
  homNay: string;
  chuongTrinh?: string | null;
  /** PR-LT2a (#133): người xem là GVCN của em và còn việc Báo phụ huynh qua TVV chưa làm — xếp SAU các việc có hạn. */
  baoPh?: boolean;
  /** PR-LT2b (M-05): em còn Mini Test chưa ghi và người xem là người làm — hạn = ngày buổi cuối + 2. */
  miniTest?: { han: string; caseId: number | null; paId: number | null } | null;
}): ViecTiepTheo[] {
  const ct = i.chuongTrinh ?? null;
  const out: ViecTiepTheo[] = [];
  if (i.nhapDiem && i.nhapDiem.kyNang.length) {
    const n = i.nhapDiem;
    const viec = `Nhập điểm ${n.kyNang.map((k) => tenMonNgan(ct, k)).join(', ')}${n.dot ? ` · ${n.dot}` : ''}`;
    const dich: DichViec = { loai: 'nhap-diem' };
    if (n.han) {
      /*
       * PR-S6F-a Q6: TRỄ chỉ theo cờ ô (`quaHan` = tuần thi đã hết và qua hạn) — `deadlineView` chỉ để in chữ hạn và số ngày trễ
       * (đếm từ hạn, A6), không quyết tone: hạn đặt đè đã qua mà tuần thi còn chạy thì chưa trễ.
       */
      const v = deadlineView({ kind: 'nhap-diem', due: n.han, today: i.homNay });
      const tre = n.quaHan;
      out.push({
        viec, han: v.han, quaHanNgay: tre ? v.daysOverdue : null, tone: tre ? 'danger' : 'warn', dich,
        title: `${viec} · ${v.han}${tre ? (v.quaHan ? ` · ${v.quaHan}` : ' · quá hạn') : ''}`,
      });
    } else {
      out.push({ viec, han: null, quaHanNgay: null, tone: n.quaHan ? 'danger' : 'warn', dich, title: n.quaHan ? `${viec} · quá hạn` : viec });
    }
  }
  if (i.miniTest) {
    const d = deadlineView({ kind: 'mini-test', due: i.miniTest.han, today: i.homNay });
    out.push({
      viec: 'Ghi Mini Test', han: d.han, quaHanNgay: d.daysOverdue, tone: d.tone === 'overdue' ? 'danger' : 'warn',
      dich: i.miniTest.caseId ? { loai: 'case', caseId: i.miniTest.caseId, paId: i.miniTest.paId ?? undefined, ghiKetQua: true } : { loai: 'y-thuc' },
      title: `Ghi Mini Test · ${d.han}${d.quaHan ? ` · ${d.quaHan}` : ''}`,
    });
  }
  for (const c of i.cases) {
    const v = c.viecTiep;
    if (!v) continue;
    const dongTu = RUT_GON.find((x) => v.chu.startsWith(x)) ?? v.chu;
    const kn = c.topic ? tenMonNgan(ct, c.topic) : 'Case';
    const viec = kn === 'Case' && dongTu.endsWith('Case') ? dongTu : `${dongTu} ${kn}`;
    const dich: DichViec = { loai: 'case', caseId: c.caseId, paId: v.paId, ghiKetQua: v.loaiHan === 'cap-nhat-pa' };
    const goc = `${v.chu} · ${c.topic ? tenMon(ct, c.topic) : 'Case'}`;
    if (v.chu.startsWith('Chờ Quản lý duyệt')) {
      out.push({ viec: `Chờ Quản lý duyệt ${kn}`, han: null, quaHanNgay: null, tone: 'info', dich, title: goc });
    } else if (v.loaiHan && v.han) {
      const d = deadlineView({ kind: v.loaiHan, due: v.han, today: i.homNay });
      const tone = d.tone === 'overdue' ? 'danger' : v.loaiHan === 'xac-minh-sos' ? 'warn' : 'info';
      /* PR-S5F-b (mockup 21): ghi kết quả PA nói TUẦN của kết quả (`Ghi kết quả PA W1 · tuần W4 SEP`) — hạn Thứ Hai là của tuần trước nó. */
      const tuan = v.loaiHan === 'cap-nhat-pa' ? d.viec.replace(/^Kết quả /, '') : null;
      out.push({ viec: tuan ? `${viec} · ${tuan}` : viec, han: d.han, quaHanNgay: d.daysOverdue, tone, dich, title: `${goc}${tuan ? ` · ${tuan}` : ''} · ${d.han}${d.quaHan ? ` · ${d.quaHan}` : ''}` });
    } else {
      /* Chưa có hạn: Thêm PA (Case tay chưa có PA) vẫn là việc phải làm; "Hoàn thành Case" chỉ nhắc. */
      out.push({ viec, han: null, quaHanNgay: null, tone: v.loaiHan === 'lap-pa' ? 'warn' : 'info', dich, title: goc });
    }
  }
  const y = i.yThuc;
  if (y) {
    const dich: DichViec = { loai: 'y-thuc' };
    const d = y.han ? deadlineView({ kind: 'xu-ly-vi-pham', due: y.han, today: i.homNay }) : null;
    const han = d ? d.han : null;
    if (y.nhom === 'qua_han') {
      const ngay = y.quaHanNgay ?? d?.daysOverdue ?? null;
      out.push({ viec: 'Xử lý vi phạm', han, quaHanNgay: ngay, tone: 'danger', dich, title: `Xử lý vi phạm${d ? ` · ${d.han}` : ''}${ngay !== null ? ` · quá hạn ${ngay} ngày` : ' · quá hạn'}` });
    } else {
      out.push({ viec: 'Xử lý vi phạm', han, quaHanNgay: null, tone: 'warn', dich, title: `Xử lý vi phạm${d ? ` · ${d.han}` : ''}` });
    }
  }
  const xep = out.map((v, idx) => ({ v, idx })).sort((a, b) => HANG_TONE[a.v.tone] - HANG_TONE[b.v.tone] || a.idx - b.idx).map((x) => x.v);
  /* Báo phụ huynh qua TVV: không hạn → luôn SAU việc có hạn (mở tab Ý thức & Phối hợp). */
  if (i.baoPh) xep.push({ viec: 'Báo phụ huynh qua TVV', han: null, quaHanNgay: null, tone: 'info', dich: { loai: 'y-thuc' }, title: 'Báo phụ huynh qua TVV · Progress Test' });
  return xep;
}

/**
 * Q6, B8: việc `nhap-diem` TRÙNG CHỮ ở ≥ 2 em là việc của cả lớp → một dòng "Cả lớp" đầu lớp, bỏ khỏi dòng từng em.
 * Nhiều chữ trùng: lấy chữ có nhiều em nhất (hoà → chữ gặp trước); chữ còn lại vẫn ở từng em.
 */
export function tachViecChung(dong: readonly { id: number; viec: readonly ViecTiepTheo[] }[]): {
  chung: { viec: ViecTiepTheo; soEm: number } | null; conLai: Map<number, ViecTiepTheo[]>;
} {
  const dem = new Map<string, ViecTiepTheo[]>();
  for (const r of dong) {
    for (const v of r.viec) if (v.dich?.loai === 'nhap-diem') dem.set(v.viec, [...(dem.get(v.viec) ?? []), v]);
  }
  let chon: ViecTiepTheo[] | null = null;
  for (const ds of dem.values()) if (ds.length >= 2 && (!chon || ds.length > chon.length)) chon = ds;
  const chu = chon ? chon[0].viec : null;
  const conLai = new Map(dong.map((r) => [r.id, chu === null ? [...r.viec] : r.viec.filter((v) => !(v.dich?.loai === 'nhap-diem' && v.viec === chu))]));
  /* Trong các em trùng chữ, lấy bản nặng nhất (đỏ trước) làm đại diện. */
  const dai = chon ? [...chon].sort((a, b) => HANG_TONE[a.tone] - HANG_TONE[b.tone])[0] : null;
  return { chung: dai && chon ? { viec: dai, soEm: chon.length } : null, conLai };
}

// ---------------------------------------------------------------- Cần hỗ trợ theo kỹ năng (M4, T19, K2-36, K2-42)

/** Một Case như `hangCanHoTro` cần (`CaseChiTiet` của máy chủ thoả). */
export type CaseCuaHang = { id: number; topic: string | null; quaHan: boolean; sosLevel?: number | null };
export type HangKyNang<T extends CaseCuaHang> = {
  kind: 'hang'; khoa: string; nhan: string; tenDu: string; kyNang: readonly string[];
  cases: T[]; hien: T[]; /** Số Case còn lại sau `hien` — "+n Case" bấm mở tại chỗ. */ them: number;
};
/** Từ hai hàng RỖNG liền nhau trở lên: một dòng mờ "Không có Case: R · W". */
export type HangRong = { kind: 'rong'; nhan: string; khoa: readonly string[] };
export const SO_CASE_HIEN_MOI_HANG = 2;

/** Hàng theo CHƯƠNG TRÌNH (không cứng 4): FT L·R·W(W1,W2)·S · BE/ELE L·R·W·S · FOU L·R·G+V·P · Pre FOU một hàng "Tổng hợp". */
function khuonHang(ct: string | null): { khoa: string; kyNang: readonly string[] }[] {
  const c = programmeOf(ct);
  if (c === 'PREFOU') return [{ khoa: 'tong_hop', kyNang: ['tong_hop'] }];
  /* OV-6b2: chương trình Quản trị tạo (PET…) không có mẫu — mọi Case vào hàng "Chung" (Checkpoint không sinh Case theo môn). */
  if (c && c !== 'FT') return (PROGRAMME_TEMPLATES[c as ProgrammeCode]?.skills ?? []).map((k) => ({ khoa: k, kyNang: [k] }));
  return [
    { khoa: 'listening', kyNang: ['listening'] }, { khoa: 'reading', kyNang: ['reading'] },
    { khoa: 'writing', kyNang: ['writing', 'writing1', 'writing2'] }, { khoa: 'speaking', kyNang: ['speaking'] },
  ];
}

export function hangCanHoTro<T extends CaseCuaHang>(i: {
  ct: string | null; cases: readonly T[];
  /** Công tắc "Chỉ kỹ năng tôi dạy": null = đủ hàng. W1/W2 giữ hàng W; hàng "Chung" luôn giữ. */
  chiKyNang?: readonly string[] | null;
}): (HangKyNang<T> | HangRong)[] {
  const c = programmeOf(i.ct);
  const khuon = khuonHang(i.ct);
  const thuocHang = (t: string | null, h: { kyNang: readonly string[] }) => t !== null && (c === 'PREFOU' || h.kyNang.includes(t));
  const xep = (a: T, b: T) => Number(b.quaHan) - Number(a.quaHan) || (b.sosLevel ?? 0) - (a.sosLevel ?? 0) || a.id - b.id;
  const dungHang = (khoa: string, nhan: string, tenDu: string, kyNang: readonly string[], ds: T[]): HangKyNang<T> => {
    const cases = [...ds].sort(xep);
    return { kind: 'hang', khoa, nhan, tenDu, kyNang, cases, hien: cases.slice(0, SO_CASE_HIEN_MOI_HANG), them: Math.max(0, cases.length - SO_CASE_HIEN_MOI_HANG) };
  };
  let hang = khuon
    .filter((h) => !i.chiKyNang || h.kyNang.some((k) => i.chiKyNang!.includes(k)))
    .map((h) => dungHang(h.khoa, c === 'PREFOU' ? 'Tổng hợp' : tenMonNgan(i.ct, h.khoa === 'writing' ? 'writing' : h.khoa),
      c === 'PREFOU' ? 'Tổng hợp' : tenMon(i.ct, h.khoa === 'writing' ? 'writing' : h.khoa), h.kyNang, i.cases.filter((x) => thuocHang(x.topic, h))));
  const chung = i.cases.filter((x) => !khuon.some((h) => thuocHang(x.topic, h)));
  if (chung.length) hang = [...hang, dungHang('chung', 'Chung', 'Case không gắn kỹ năng', [], chung)];
  const out: (HangKyNang<T> | HangRong)[] = [];
  for (const h of hang) {
    const truoc = out[out.length - 1];
    if (h.cases.length) { out.push(h); continue; }
    if (truoc?.kind === 'hang' && !truoc.cases.length) {
      out[out.length - 1] = { kind: 'rong', nhan: '', khoa: [truoc.khoa, h.khoa] };
    } else if (truoc?.kind === 'rong') truoc.khoa = [...truoc.khoa, h.khoa];
    else out.push(h);
  }
  const nhanCua = new Map(hang.map((h) => [h.khoa, h.nhan]));
  return out.map((x) => (x.kind === 'rong' ? { ...x, nhan: `Không có Case: ${x.khoa.map((k) => nhanCua.get(k)).join(' · ')}` } : x));
}

/**
 * PR-S4F #5: Cần hỗ trợ sau công tắc "Chỉ kỹ năng tôi dạy" — lọc em và đếm SAU `hangCanHoTro`: em không còn Case ở kỹ năng đang xem thì bỏ
 * cả khối; `cases` của em = Case đang hiện (cột trái "n Case · k việc quá hạn"); `tong` cùng công thức `tong` của máy chủ (canHoTro.ts).
 */
type CaseCanHoTro = CaseCuaHang & { trangThai?: { k: string }; pas?: readonly { choDuyet: boolean; xong: boolean }[] };
export function locCanHoTro<E extends { ten: string; cases: readonly CaseCanHoTro[] }>(i: { ct: string | null; em: readonly E[]; chiKyNang?: readonly string[] | null }) {
  const em = sapEmCanHoTro(i.em.map((e) => {
    const hang = hangCanHoTro<E['cases'][number]>({ ct: i.ct, cases: e.cases, chiKyNang: i.chiKyNang ?? null });
    return { ...e, hang, cases: hang.flatMap((h) => (h.kind === 'hang' ? h.cases : [])) };
  }).filter((e) => e.cases.length > 0));
  const cs = em.flatMap((e) => e.cases);
  const tong = {
    soEm: em.length, soCase: cs.length, quaHan: cs.filter((c) => c.quaHan).length,
    choDuyet: cs.filter((c) => c.trangThai?.k === 'cho-duyet-khong-theo-doi').length
      + cs.reduce((n, c) => n + (c.pas ?? []).filter((x) => x.choDuyet && !x.xong).length, 0),
  };
  return { em, tong };
}

/** Em có Case QUÁ HẠN lên đầu, rồi theo tên (`localeCompare('vi')`). */
export function sapEmCanHoTro<T extends { ten: string; cases: readonly { quaHan: boolean }[] }>(em: readonly T[]): T[] {
  const qua = (e: T) => (e.cases.some((c) => c.quaHan) ? 0 : 1);
  return [...em].sort((a, b) => qua(a) - qua(b) || a.ten.localeCompare(b.ten, 'vi'));
}

// ---------------------------------------------------------------- menu ⋯ đầu hồ sơ lớp (PR-OV3a, M2 §1)

export type ViecMenuLop = 'thong-tin' | 'sua-hoc-vien' | 'hoc-vien' | 'lo-trinh-ca-lop' | 'chuyen-tiep' | 'xuat-mt' | 'mo-lai-lop' | 'xoa-lop' | 'ket-thuc-lop';
export type MucMenuLop = { key: ViecMenuLop; nhan: string; nhom: 'Lớp' | 'Lộ trình' | 'Công cụ' | null };
/**
 * Menu ⋯ hồ sơ lớp — CÙNG thứ tự lớp thường và FT: Lớp → Lộ trình → Công cụ → (kẻ) Mở lại / Xoá / Kết thúc (`nhom` null). Mỗi mục giữ
 * điều kiện quyền cũ; nhóm không còn mục thì không có tiêu đề. Nút cố định Nhập điểm · + Case nằm ngoài menu.
 */
export function menuHoSoLop(i: {
  thuong: boolean; chuongTrinh: string | null; soHocVien: number;
  /** OV-6b2: lớp liên tục (PET, KET…) — không có Lộ trình tiếp theo. */
  lienTuc?: boolean;
  canEditProgress: boolean; canAssign: boolean; canAssignSubject: boolean; canAddStudents: boolean; coTheChuyenTiep: boolean;
  coTheChuyenNhieuEm: boolean; coTheXuatExcel: boolean; coTheMoLaiLop: boolean; coTheXoa: boolean; coTheKetThuc: boolean;
}): MucMenuLop[] {
  const m = (key: ViecMenuLop, nhan: string, nhom: MucMenuLop['nhom'], co: boolean): MucMenuLop[] => (co ? [{ key, nhan, nhom }] : []);
  return [
    ...m('thong-tin', 'Thông tin lớp', 'Lớp', i.canEditProgress || i.canAssign || i.canAssignSubject),
    ...m('sua-hoc-vien', 'Sửa thông tin học viên', 'Lớp', i.canAddStudents && i.soHocVien > 0),
    ...m('hoc-vien', '+ Học viên', 'Lớp', i.canAddStudents),
    ...m('lo-trinh-ca-lop', 'Lộ trình tiếp theo', 'Lộ trình', i.thuong && !i.lienTuc && (i.coTheChuyenTiep || i.canAddStudents)),
    ...m('chuyen-tiep', 'Chuyển tiếp lớp', 'Lộ trình', !i.thuong && i.coTheChuyenNhieuEm),
    ...m('xuat-mt', 'Xuất Excel', 'Công cụ', i.coTheXuatExcel),
    ...m('mo-lai-lop', 'Mở lại lớp', null, i.coTheMoLaiLop),
    ...m('xoa-lop', 'Xoá lớp', null, i.coTheXoa),
    ...m('ket-thuc-lop', 'Kết thúc lớp', null, i.coTheKetThuc),
  ];
}

/** OV-3b: hồ sơ lớp › tab Học viên › "Lộ trình tiếp theo"; `em` → mở sẵn hộp Lộ trình của em đó (Quản lý). */
export const duongLoTrinhLop = (classId: number, em?: number | null): string =>
  `/hoc-vien/lop/${classId}?che-do=lo-trinh${em ? `&em=${em}` : ''}`;

// ---------------------------------------------------------------- hồ sơ giáo viên (§3.12, Q2)

/** PR-GV (đợt 5) đã dựng trang `/giao-vien/:id` nên bật: tên GV là link cho người xem được hồ sơ (QL trong phạm vi · GV chỉ chính mình). */
export const CO_TRANG_HO_SO_GIAO_VIEN = true;
export function duongHoSoGiaoVien(
  gvId: number | null, nguoiXem: { userId: number; laQuanLy: boolean }, coTrang: boolean = CO_TRANG_HO_SO_GIAO_VIEN,
): string | null {
  if (!coTrang || gvId === null) return null;
  if (!nguoiXem.laQuanLy && nguoiXem.userId !== gvId) return null;
  return `/giao-vien/${gvId}`;
}

// ---------------------------------------------------------------- tab hồ sơ lớp (§3.7)

/** PR-TK: `tong-ket` chỉ có khi lớp ĐÃ KẾT THÚC (đứng đầu, mặc định) — `tabHienCuaLop`. */
export const TAB_HO_SO_LOP = ['tong-ket', 'hoc-vien', 'y-thuc', 'phan-tich'] as const;
export type TabHoSoLop = (typeof TAB_HO_SO_LOP)[number];
export const TAB_HO_SO_LOP_NHAN: Record<TabHoSoLop, string> = {
  'tong-ket': 'Tổng kết', 'hoc-vien': 'Học viên', 'y-thuc': 'Ý thức & Phối hợp', 'phan-tich': 'Phân tích lớp',
};
/** Tab hiện của hồ sơ lớp: lớp đã kết thúc có thêm "Tổng kết". */
export const tabHienCuaLop = (daKetThuc: boolean): readonly TabHoSoLop[] => TAB_HO_SO_LOP.filter((k) => k !== 'tong-ket' || daKetThuc);
/** Tab mở mặc định: lớp đã kết thúc → "Tổng kết", còn lại "Học viên". Tab lạ / không hiện với lớp này → mặc định. */
export function tabMacDinhLop(s: string | null | undefined, daKetThuc: boolean): TabHoSoLop {
  const t = (TAB_HO_SO_LOP as readonly string[]).includes(s ?? '') ? (s as TabHoSoLop) : null;
  return t && tabHienCuaLop(daKetThuc).includes(t) ? t : daKetThuc ? 'tong-ket' : 'hoc-vien';
}
export function tabHoSoLop(s: string | null | undefined): TabHoSoLop {
  return (TAB_HO_SO_LOP as readonly string[]).includes(s ?? '') ? (s as TabHoSoLop) : 'hoc-vien';
}
