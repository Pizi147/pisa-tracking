/**
 * HỌC VIÊN & LỚP + HỒ SƠ LỚP — luật hiển thị thuần (PR-Qa; đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §2, §3.6, §3.7, §4).
 *
 * Mọi quyết định "hiện chữ gì, hiện mấy cái, xếp thế nào" của hai màn nằm ở đây để kiểm được bằng harness máy chủ (web không có bộ
 * kiểm thử). Component React chỉ vẽ.
 */
import { PROGRAMME_TEMPLATES, programmeOf, type ProgrammeCode, skillShort, tenMon, tenMonNgan } from './normal.ts';
import { deadlineView } from './display.ts';
import { goiYCuoiKhoa } from './cuoiKhoa.ts';
import type { TrangThaiCaseV4, ViecTiepCase } from './sosV4.ts';
import type { CotXuLy } from './phanTich.ts';
import type { NhanYThucEm } from './yThuc.ts';
import { tuanKhoa, tuanLich } from './hienThiNgay.ts';
import { CHU_CHUYEN_LOP } from './chuyenLop.ts';
import { NHAN_TRANG_THAI, TONE_BADGE_TRANG_THAI } from './trangThai.ts';
import { CLASS_PHASE_LABEL, type ClassPhase } from './fasttrack.ts';
import { dich as dichChuoi, t } from '../i18n/index.ts';
import { kyGhiKetQua } from './display.ts';

// ---------------------------------------------------------------- chung

/** Dòng phụ tối đa ~60 ký tự (G-3). Dài hơn thì cắt và thêm "…" — đủ câu nằm ở tooltip của ô. */
export const DONG_PHU_TOI_DA = 60;
export function catDongPhu(s: string): string {
  return s.length <= DONG_PHU_TOI_DA ? s : `${s.slice(0, DONG_PHU_TOI_DA - 1)}…`;
}

/** OV-13f (Q8): nhãn ô Email trong "Thiếu thông tin" (`missingForStudent`). Mã HV không hiện trên màn nữa (giữ ở DB, nhật ký, đường dẫn, tìm kiếm). */
export const NHAN_THIEU_EMAIL = 'Email';
/**
 * OV-13f: nhãn ô thiếu của một em → dòng việc Cần làm (QL, TVV): "Thiếu email" riêng (tới khi điền) + "Thiếu thông tin" cho các ô còn lại.
 * Danh sách rỗng (chỉ biết em có cờ thiếu) → một dòng "Thiếu thông tin" như cũ.
 */
export function tachThieuEmail(thieu: readonly string[]): { khoa: string; viec: string; phu: string | null }[] {
  const khac = thieu.filter((x) => x !== NHAN_THIEU_EMAIL);
  return [
    ...(thieu.includes(NHAN_THIEU_EMAIL) ? [{ khoa: 'thieu-email', viec: t('Thiếu email'), phu: null }] : []),
    ...(khac.length || !thieu.length ? [{ khoa: 'thieu', viec: t('Thiếu thông tin'), phu: khac.length ? khac.join(' · ') : null }] : []),
  ];
}

/** Tên đầy đủ của một kỹ năng/môn — tooltip của chữ viết tắt (G-7). */
export function tenKyNang(k: string): string {
  return tenMon(null, k);
}

export function laVaiQuanLy(roles: readonly string[] | null | undefined): boolean {
  return (roles ?? []).some((r) => r === 'system_admin' || r === 'manager');
}

/**
 * SV-SO3 (`thiet-ke/v5/dieu-chinh-cuoi.html` khu d, `10` mục 5) — trường hàng HV của Học viên & Lớp, chỉ em Fast Track. Lộ trình `mt`/`soMt` = lượt MT đã xong / đã tạo (P2 MT-DEM, `demMtHocVien`) + Target;
 * MT gần nhất CỦA EM (lượt của `standingFor` — cùng nguồn cột Kết quả các màn): Overall / kỳ vọng · tuần · 5 ô L R W1 W2 S; Xu hướng = Overall so lượt
 * có Overall gần nhất trước đó cùng lộ trình (`soMt` = số MT của lượt đó); Hỗ trợ = SOS + kỹ năng dưới kỳ vọng + Case / PA đang mở; Ý thức = bậc hiện tại.
 */
export type HangHv = {
  loTrinh: { mt: number; soMt: number; target: number | null; kck: boolean };
  mtGan: { mt: number; tuan: string | null; ovr: number | null; kyVong: number | null; kn: Record<'L' | 'R' | 'W1' | 'W2' | 'S', number | null> } | null;
  xuHuong: { lech: number; soMt: number } | null;
  /** UI-HV-LOP (Đang SOS "→ MT3 6.0"): lượt kế tiếp của lộ trình + kỳ vọng của lượt đó (`standingFor`). */
  ke: { luot: string; kyVong: number | null } | null;
  hoTro: { sos: number | null; kyNang: string[]; soCase: number; soPa: number; quaHan: boolean };
  yThuc: string | null;
};

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

/** OV-10b: chip Học viên & Lớp của TVV / CX — số = `chipHocVien` (OV-10c, cùng ô Tổng quan). "Chờ chọn bước tiếp" chỉ hiện khi có em. */
export const CHIP_VAI = ['tat-ca', 'can-chu-y', 'tam-dung', 'sap-thi', 'thieu_tt', 'da-thi', 'cho-buoc-tiep'] as const;   // OV-13q: + Đã thi · chờ kết quả
export type ChipVai = (typeof CHIP_VAI)[number];
/** CX mở ở chip `can-chu-y` (không phải 1 000+ em), TVV ở `tat-ca` của HV mình. Nhãn chip ở web (`StudentsPage.tsx`); UI-HV-LOP-TVV: trang mở ở Tất cả (bảng V5 có phân trang), chip này còn cho link. */
export const chipMacDinhVai = (vai: 'tvv' | 'cx'): ChipVai => (vai === 'cx' ? 'can-chu-y' : 'tat-ca');

// ---------------------------------------------------------------- chip lọc (§3.6, Q4)

/** PR-S4F #4: `qua-han` — đích của badge "n HV quá hạn việc" (hộp lớp + đầu hồ sơ lớp); chip chỉ hiện khi đang lọc bằng nó (`chipHienLoc`). */
/** OV-14b: `da-thi` — lọc "Đã thi · chờ kết quả" của góc Tất cả (QL / GV), cùng tập chip TVV / CX (`loTrinhChoKetQuaThi`). */
export const LOC_HOC_VIEN = ['tat-ca', 'can-lam', 'qua-han', 'cho-duyet', 'sos', 'thieu_tt', 'da-thi'] as const;
export type LocHocVien = (typeof LOC_HOC_VIEN)[number];
export const LOC_HOC_VIEN_NHAN: Record<LocHocVien, { nhan: string; goiY: string; can: string | null }> = {
  'tat-ca': { nhan: t('Tất cả'), goiY: t('Mọi học viên đang học trong các lớp đang hiện.'), can: null },
  'can-lam': { nhan: NHAN_TRANG_THAI['can-lam'], goiY: t('Có việc quá hạn hoặc việc hạn ngắn (xác nhận, xử lý vi phạm).'), can: null },
  'qua-han': { nhan: NHAN_TRANG_THAI['qua-han'], goiY: t('Có việc đã quá hạn (xác nhận, kết quả, xử lý vi phạm) — cùng số với badge "HV quá hạn việc".'), can: null },
  'cho-duyet': { nhan: NHAN_TRANG_THAI['cho-duyet'], goiY: t('Có yêu cầu đang chờ Quản lý duyệt.'), can: null },
  sos: { nhan: t('Đang SOS'), goiY: t('SOS hiện tại: đợt Test mới nhất ở mức SOS 1–3.'), can: 'case.view' },
  thieu_tt: { nhan: t('Thiếu thông tin'), goiY: t('Hồ sơ còn thiếu thông tin cần để xếp lịch và theo dõi.'), can: null },
  'da-thi': { nhan: t('Đã thi · chờ kết quả'), goiY: t('Đã qua ngày thi, chưa có kết quả thi thật — hạn 1 tuần sau ngày thi.'), can: null },
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

// ---------------------------------------------------------------- ba góc nhìn (OV-12f, đặc tả OV-12 mục 3.5 / 7.9, P14)

/** Góc nhìn của Học viên & Lớp — thay hàng chip. Lọc phụ (Quá hạn · Chờ duyệt · Thiếu thông tin) nằm TRONG góc Cần làm, không bỏ lọc nào. */
export const GOC_HOC_VIEN = ['tat-ca', 'sos', 'can-lam', 'lich-thi', 'phan-cong'] as const;
export type GocHocVien = (typeof GOC_HOC_VIEN)[number];
export type LocPhuCanLam = 'qua-han' | 'cho-duyet' | 'thieu_tt';
/** `view` (+ `loc`) trên URL → góc + lọc phụ. Link cũ giữ nghĩa qua `docThamSoLoc`: `qua-han` / `cho-duyet` / `thieu_tt` / `case_*` → Cần làm. */
export function docGoc(view: string | null | undefined, loc: string | null | undefined): { goc: GocHocVien; loc: LocPhuCanLam | null } {
  if (view === 'lich-thi') return { goc: 'lich-thi', loc: null };   // OV-15f: rà soát lịch thi thật khi họp
  if (view === 'phan-cong') return { goc: 'phan-cong', loc: null };   // PC-GV-C: góc Phân công GV (QL, Quản trị, CX)
  const d = docThamSoLoc(view);
  const l = 'loc' in d ? d.loc : 'tat-ca';
  if (l === 'sos') return { goc: 'sos', loc: null };
  if (l === 'tat-ca') return { goc: 'tat-ca', loc: null };
  const phu = l === 'can-lam' ? loc : l;
  return { goc: 'can-lam', loc: phu === 'qua-han' || phu === 'cho-duyet' || phu === 'thieu_tt' ? phu : null };
}

/**
 * ĐƯỜNG `/hoc-vien-lop` của trang (ô tìm · Phạm vi · chi nhánh · lần chọn trước `cnNho`). `tuLienKet` = trang được MỞ bằng link trỏ một đích
 * (`coDichLienKet` LÚC VÀO, không phải mỗi lần vẽ): mở / đóng lớp ghi `open=` lên URL nhưng không được đổi đường — đổi đường là tải lại cả trang
 * (lỗi bản chính 14/10: bấm mở lớp lần đầu → Skeleton).
 */
export function duongHocVienLop(params: { get(k: string): string | null }, o: { tuLienKet: boolean; daNho: number | 'tat-ca' | null }): string {
  const s = new URLSearchParams();
  const q = (params.get('q') ?? '').trim();
  if (q) s.set('q', q);
  const phamVi = params.get('phamVi');
  if (phamVi) s.set('phamVi', phamVi);
  const cn = params.get('cn') ?? params.get('branchId');
  if (cn) s.set('branchId', String(Number(cn)));
  /* PR-NV (T9): lần chọn trước — máy chủ bỏ nếu ngoài phạm vi; không đổi Phạm vi như `branchId`. Link trỏ một đích thì không gửi (rà PR #205). */
  else if (!o.tuLienKet && typeof o.daNho === 'number') s.set('cnNho', String(o.daNho));
  /* OV-15h2 (ý 3): Bộ lọc thêm đang mở (`lt`) / đang lọc → máy chủ gắn nhãn từng em (`them=1`); không thì trang đọc như cũ. */
  if (params.get('lt') === '1' || ['lc', 'lk', 'lq', 'ltu'].some((k) => params.get(k))) s.set('them', '1');
  return `/hoc-vien-lop?${s.toString()}`;
}

/** Nhóm xử lý của một Case — cùng ba chữ với bảng Tổng hợp (chủ SP 14/10). */
export type NhomXuLy = 'cho-duyet' | 'dang-xu-ly' | 'xong';
export const NHAN_NHOM_XU_LY = { 'cho-duyet': 'Chưa chốt PA', 'dang-xu-ly': 'Đang xử lý', xong: 'Xong' } as const satisfies Record<NhomXuLy, string>;
/** OV-12d: nhóm của Case theo cột Tổng hợp (`cotXuLy` / `xuLyCuaDong`) — một luật cho Tổng hợp, Tổng quan, panel một em. */
export const NHOM_THEO_COT: Record<CotXuLy, NhomXuLy> = { choDuyet: 'cho-duyet', dangLam: 'dang-xu-ly', xongHuy: 'xong' };

/** Chip `qua-han` không nằm thường trực trên hàng chip — chỉ hiện (đang bấm) khi người dùng tới từ badge. */
export function chipHienLoc(k: LocHocVien, dangLoc: LocHocVien | null): boolean {
  return k !== 'qua-han' || dangLoc === 'qua-han';
}

/**
 * MỘT hàm đếm chip cho máy chủ (`dem`) và web (đổi công tắc khung): mỗi em mang các cờ `loc`, thuộc khung `ft`/`thuong`.
 * UX-1: đếm theo id em (em học hai lớp đếm một lần); em Kết thúc học (`ketThuc`) chỉ hiện mờ, không vào số.
 */
export function demLoc(hocVien: readonly { id: number; loc: readonly string[]; khung: 'ft' | 'thuong'; ketThuc?: boolean }[], khung: 'tat-ca' | 'ft' | 'thuong'): Record<LocHocVien, number> {
  const tap = Object.fromEntries(LOC_HOC_VIEN.map((k) => [k, new Set<number>()])) as Record<LocHocVien, Set<number>>;
  for (const h of hocVien) {
    if (h.ketThuc || (khung !== 'tat-ca' && h.khung !== khung)) continue;
    tap['tat-ca'].add(h.id);
    for (const k of LOC_HOC_VIEN) if (k !== 'tat-ca' && h.loc.includes(k)) tap[k].add(h.id);
  }
  return Object.fromEntries(LOC_HOC_VIEN.map((k) => [k, tap[k].size])) as Record<LocHocVien, number>;
}

// ---------------------------------------------------------------- phạm vi (§3.6, Q3)

export const PHAM_VI = ['cua-toi', 'toi', 'chi-nhanh', 'tat-ca'] as const;
export type PhamVi = (typeof PHAM_VI)[number];
export const PHAM_VI_NHAN: Record<PhamVi, string> = { 'cua-toi': t('HV của tôi'), toi: t('Lớp tôi dạy'), 'chi-nhanh': t('Chi nhánh'), 'tat-ca': t('Tất cả') };

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
 * `sos`: Fast Track theo lượt MT; OV-12c (chủ SP 14/10, bỏ T58 ở Học viên & Lớp): Progress Test lớp thường theo số môn trượt (1 → SOS 1 … ≥ 3 → SOS 3).
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

/**
 * SUA-CHAM-LAI Đ4 (T08): lý do NGẮN của "Chưa đủ dữ liệu" (tooltip ô Kết quả) — người xem thấy đủ điểm mà chưa có kết luận thì biết vì sao.
 * Theo đúng các cờ máy chủ đã trả (`standingFor`), không tự so điểm. null = không có lý do riêng để nói.
 */
export function lyDoChuaDu(k: KetQuaVao | null): string | null {
  if (!k || !k.attemptLabel) return t('chưa có lượt Test có điểm');
  if (k.scored < k.required) return t('thiếu điểm {n} kỹ năng', { n: k.required - k.scored });
  if (k.mode === 'ielts_band' && k.expectation === null) return t('chưa có kỳ vọng (thiếu Target)');
  if (k.mode === 'ielts_band' && k.overall === null) return t('chưa tính được Overall');
  if (k.provisional) return t('kết quả tạm, lượt chưa đủ điểm');
  return null;
}

export function ketQuaGanNhat(k: KetQuaVao | null): KetQuaHien {
  if (!k || !k.attemptLabel) return { chinh: '—', lech: null, dat: false, sos: null, dong1: t('Chưa có kết quả'), dong2: null };
  const ct = k.chuongTrinh ?? null;
  if (k.mode === 'ratio') {
    /* Cuối khoá (hoặc Pre FOU) đủ điểm → % tổng; còn lại "n/N môn đạt". OV-12c: Progress Test có môn trượt → chip SOS theo số môn trượt. */
    const thieuDiem = k.scored < k.required;
    const chinh = (k.attemptKind === 'final' || k.khongChiaMon) && k.tyLeTong != null ? `${Math.round(k.tyLeTong * 100)}%`
      : k.khongChiaMon || k.scored === 0 ? '—' : t('{a}/{b} môn đạt', { a: k.scored - (k.failed ?? 0), b: thieuDiem ? k.scored : k.required });
    /* Pre FOU: đạt/không xét trên tỷ lệ chính xác ở máy chủ (`sosLevel === 0`); lớp thường khác: đủ môn và không môn nào trượt. */
    const dat = k.khongChiaMon ? k.sosLevel === 0 : k.sosLevel === 0 && !k.provisional && !thieuDiem;
    /* PR-UXF-a K2-01 (Q3): Cuối khoá đủ điểm → hậu tố hướng ở dòng 1 ("Cuối khoá → học lại"), cùng luật `goiYCuoiKhoa`; không dính vào số %. */
    const huong = k.attemptKind === 'final' && !thieuDiem && k.tyLeTong != null
      ? goiYCuoiKhoa({ ct, tyLe: k.tyLeTong, monTruot: k.failedSkills.map((f) => f.skill), nguong: k.nguong })?.nhanNgan ?? null : null;
    return {
      chinh, lech: null, dat, sos: k.attemptKind === 'progress' && !k.khongChiaMon && (k.sosLevel ?? 0) > 0 ? `SOS ${k.sosLevel}` : null,
      dong1: huong ? `${k.attemptLabel} ${dichChuoi(huong)}` : k.khongChiaMon || !thieuDiem ? k.attemptLabel : t('{lan} · {a}/{b} môn có điểm', { lan: k.attemptLabel, a: k.scored, b: k.required }),
      dong2: k.khongChiaMon || !k.failedSkills.length ? null : t('Không đạt: {ds}', { ds: k.failedSkills.map((f) => tenMonNgan(ct, f.skill)).join(' ') }),
    };
  }
  const sos = k.sosLevel !== null && k.sosLevel > 0 ? `SOS ${k.sosLevel}` : null;
  const sosTamThoi = sos !== null && k.provisional;
  const chinh = k.overall !== null ? band1(k.overall) : '—';
  const lech = k.overall !== null && k.expectation !== null && k.overall < k.expectation ? `−${band1(k.expectation - k.overall)}` : null;
  return {
    chinh, lech, dat: k.sosLevel === 0 && !k.provisional, sos,
    dong1: noiDong(k.attemptLabel, k.expectation !== null && t('kỳ vọng {kv}', { kv: band1(k.expectation) }), k.scored < k.required && t('{a}/{b} kỹ năng có điểm', { a: k.scored, b: k.required })),
    dong2: k.belowSkills.length ? t(k.kckDuoi ? 'Dưới kỳ vọng: {ds}' : 'Không đạt: {ds}', { ds: k.belowSkills.map((b) => skillShort(b.skill)).join(' ') }) : null,
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
  if (i.tuanHienTai !== null && i.tuanHienTai < 1) tuan = t('chưa khai giảng');
  else if (i.tuanHienTai !== null && i.tongTuan) tuan = tuanKhoa(Math.min(i.tuanHienTai, i.tongTuan), i.tongTuan);
  else if (i.tuanHienTai !== null) tuan = t('tuần {n}', { n: i.tuanHienTai });   // OV-6b2: lớp liên tục — không "/tổng"
  // Thứ tự ưu tiên dòng phụ (PR-LT): tiếp theo đã ghi › nhắc chưa ghi › kết thúc khoá.
  /* PR-DH (D1): cờ "chưa có quyết định chuyển lớp" luôn hiện khi em thuộc số trên badge lớp — kể cả khi đã ghi lộ trình tiếp theo. */
  const co = i.nhacLoTrinh ? dichChuoi(CHU_CHUYEN_LOP.chua).toLowerCase() : null;
  const phu = i.tiepTheo ? [t('tiếp theo: {lt}', { lt: i.tiepTheo }), co].filter(Boolean).join(' · ')
    : i.choDuyetChuyen ? dichChuoi(CHU_CHUYEN_LOP.choDuyetDeXuat.replace(/^Chờ/, 'chờ'))
    : co ?? (i.tuanKetThuc ? t('kết thúc {tuan}', { tuan: tuanLich(i.tuanKetThuc, i.homNay) }) : null);
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
  soChoDuyet?: number;
  /** OV-13b: số VIỆC quá hạn của lớp — `demQuaHan` trên cùng danh sách việc với góc Cần làm (bấm badge = số dòng). */
  soViecQuaHan?: number;
  /** Mã chương trình lớp — tên ô thiếu GV theo chương trình (FOU "G+V"). */
  chuongTrinh?: string | null;
}): { hien: BadgeLop[]; an: BadgeLop[] } {
  const nXep = c.needsPlacement ? c.canXepLop : c.soChuaLoTrinhTiep ?? 0;
  const co: Partial<Record<BadgeLop['key'], BadgeLop>> = {};
  if (nXep > 0) {
    co['xep-lop'] = {
      /* PR-Dọn (Câu 2 = B): lớp chưa hết khoá → em chưa có quyết định chuyển lớp. PR-LCb: Quản lý quyết ở panel "Lộ trình tiếp theo". */
      key: 'xep-lop', nhan: c.needsPlacement ? t('{n} HV cần xếp lớp tiếp', { n: nXep }) : t('{n} HV chưa chốt lộ trình', { n: nXep }), tone: 'warn',
      title: c.needsPlacement ? t('Lớp đã hết khoá: những học viên này chưa được xếp lớp tiếp') : t('Quản lý quyết định ở Lộ trình tiếp theo'),
    };
  }
  if (c.missingSkills.length) co['thieu-gv'] = { key: 'thieu-gv', nhan: t('Thiếu GV {mon}', { mon: c.missingSkills.map((k) => tenMonNgan(c.chuongTrinh, k)).join(', ') }), tone: 'warn' };
  if (c.soBaiChoCham > 0) co.cham = { key: 'cham', nhan: t('{n} bài chờ chấm', { n: c.soBaiChoCham }), tone: TONE_BADGE_TRANG_THAI['cho-cham'], title: c.needScoresTitle ?? undefined };
  if (CHANG_THI.includes(c.phase)) co.chang = { key: 'chang', nhan: dichChuoi(CLASS_PHASE_LABEL[c.phase as ClassPhase]), tone: 'info' };
  if (c.missingCount > 0) co['thieu-tt'] = { key: 'thieu-tt', nhan: t('Thiếu {n} thông tin', { n: c.missingCount }), tone: 'warn' };
  if (c.soChoDuyet) co['cho-duyet'] = { key: 'cho-duyet', nhan: t('{n} chờ duyệt', { n: c.soChoDuyet }), tone: TONE_BADGE_TRANG_THAI['cho-duyet'], title: t('Yêu cầu đang chờ Quản lý duyệt') };
  if (c.soViecQuaHan) co['qua-han'] = { key: 'qua-han', nhan: `⚠ ${t('{n} việc quá hạn', { n: c.soViecQuaHan })}`, tone: 'danger', title: t('Việc đã quá hạn (xác nhận, kết quả, xử lý vi phạm)') };
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
      g = { id: pc?.id ?? null, ten: pc?.name ?? t('Chưa phân công'), kyNang: [], nhan: '', title: '' };
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
export type MucMenuDong = 'vi-pham' | 'xu-ly-y-thuc' | 'case' | 'nhap-diem' | 'sua-thong-tin' | 'lo-trinh-tiep' | 'chuyen-lop' | 'de-xuat-chuyen-lop';
export const MUC_MENU_DONG_NHAN: Record<MucMenuDong, string> = {
  'vi-pham': t('+ Ghi vi phạm'), 'xu-ly-y-thuc': t('Xác nhận xử lý'), case: '+ Case', 'nhap-diem': t('Nhập điểm'), 'sua-thong-tin': t('Sửa thông tin'),
  'lo-trinh-tiep': t('Cuối khoá…'), 'chuyen-lop': t('Chuyển lớp…'), 'de-xuat-chuyen-lop': t('Đề xuất chuyển lớp…'),
};
/** Việc HIẾM của dòng (K2-30): kẻ vạch trước mục hiếm đầu tiên — tách khỏi việc hằng ngày (Case · Ghi vi phạm · Xác nhận xử lý · Nhập điểm). */
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
  /** OV-12e (mockup v3 §8): em đang cần xử lý Ý thức + người xem ghi được vi phạm → "Xác nhận xử lý" mở panel ngay trên trang. */
  coTheXuLyYThuc?: boolean;
}, bat: { loTrinhTiepTheo: boolean; chuyenLop: boolean } = MENU_DONG_CHO_PR_LT): MucMenuDong[] {
  const out: MucMenuDong[] = [];
  if (!i.dangHoc) return out;
  /* MENU-DONG (chủ SP 29/10, v8): + Case · + Ghi vi phạm · Xác nhận xử lý · Nhập điểm {đợt} │ vạch │ việc hiếm (Sửa thông tin · Cuối khoá… · Chuyển lớp…). */
  if (i.coTheBaoCase) out.push('case');
  if (i.coTheGhiViPham) out.push('vi-pham');
  if (i.coTheXuLyYThuc) out.push('xu-ly-y-thuc');
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
    const viec = n.dot ? t('Nhập điểm {mon} · {dot}', { mon: n.kyNang.map((k) => tenMonNgan(ct, k)).join(', '), dot: n.dot }) : t('Nhập điểm {mon}', { mon: n.kyNang.map((k) => tenMonNgan(ct, k)).join(', ') });
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
        title: `${viec} · ${v.han}${tre ? ` · ${v.quaHan ?? t('quá hạn')}` : ''}`,
      });
    } else {
      out.push({ viec, han: null, quaHanNgay: null, tone: n.quaHan ? 'danger' : 'warn', dich, title: n.quaHan ? `${viec} · ${t('quá hạn')}` : viec });
    }
  }
  if (i.miniTest) {
    const d = deadlineView({ kind: 'mini-test', due: i.miniTest.han, today: i.homNay });
    out.push({
      viec: t('Ghi Mini Test'), han: d.han, quaHanNgay: d.daysOverdue, tone: d.tone === 'overdue' ? 'danger' : 'warn',
      dich: i.miniTest.caseId ? { loai: 'case', caseId: i.miniTest.caseId, paId: i.miniTest.paId ?? undefined, ghiKetQua: true } : { loai: 'y-thuc' },
      title: `${t('Ghi Mini Test')} · ${d.han}${d.quaHan ? ` · ${d.quaHan}` : ''}`,
    });
  }
  for (const c of i.cases) {
    const v = c.viecTiep;
    if (!v) continue;
    const dongTu = RUT_GON.find((x) => v.chu.startsWith(x)) ?? v.chu;
    const kn = c.topic ? tenMonNgan(ct, c.topic) : 'Case';
    const viec = kn === 'Case' && dongTu.endsWith('Case') ? dichChuoi(dongTu) : `${dichChuoi(dongTu)} ${kn}`;
    const dich: DichViec = { loai: 'case', caseId: c.caseId, paId: v.paId, ghiKetQua: v.loaiHan === 'cap-nhat-pa' };
    const goc = `${dichChuoi(v.chu)} · ${c.topic ? tenMon(ct, c.topic) : 'Case'}`;
    if (v.chu.startsWith('Chờ Quản lý duyệt')) {
      out.push({ viec: t('Chờ Quản lý duyệt {kn}', { kn }), han: null, quaHanNgay: null, tone: 'info', dich, title: goc });
    } else if (v.loaiHan && v.han) {
      const d = deadlineView({ kind: v.loaiHan, due: v.han, today: i.homNay });
      const tone = d.tone === 'overdue' ? 'danger' : v.loaiHan === 'xac-minh-sos' ? 'warn' : 'info';
      /* PR-S5F-b → OV-12a: ghi kết quả PA nói KỲ của kết quả (`Ghi kết quả PA W1 · kỳ W3–W4 SEP`) — hạn Thứ Ba là của kỳ hai tuần trước nó. */
      const tuan = v.loaiHan === 'cap-nhat-pa' ? t('kỳ {ky}', { ky: kyGhiKetQua(v.han, i.homNay) }) : null;
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
      out.push({ viec: t('Xử lý vi phạm'), han, quaHanNgay: ngay, tone: 'danger', dich, title: [t('Xử lý vi phạm'), d?.han, ngay !== null ? t('quá hạn {n} ngày', { n: ngay }) : t('quá hạn')].filter(Boolean).join(' · ') });
    } else {
      out.push({ viec: t('Xử lý vi phạm'), han, quaHanNgay: null, tone: 'warn', dich, title: [t('Xử lý vi phạm'), d?.han].filter(Boolean).join(' · ') });
    }
  }
  const xep = out.map((v, idx) => ({ v, idx })).sort((a, b) => HANG_TONE[a.v.tone] - HANG_TONE[b.v.tone] || a.idx - b.idx).map((x) => x.v);
  /* Báo phụ huynh qua TVV: không hạn → luôn SAU việc có hạn (mở tab Ý thức & Phối hợp). */
  if (i.baoPh) xep.push({ viec: t('Báo phụ huynh qua TVV'), han: null, quaHanNgay: null, tone: 'info', dich: { loai: 'y-thuc' }, title: t('Báo phụ huynh qua TVV · Progress Test') });
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
    .map((h) => dungHang(h.khoa, c === 'PREFOU' ? t('Tổng hợp') : tenMonNgan(i.ct, h.khoa === 'writing' ? 'writing' : h.khoa),
      c === 'PREFOU' ? t('Tổng hợp') : tenMon(i.ct, h.khoa === 'writing' ? 'writing' : h.khoa), h.kyNang, i.cases.filter((x) => thuocHang(x.topic, h))));
  const chung = i.cases.filter((x) => !khuon.some((h) => thuocHang(x.topic, h)));
  if (chung.length) hang = [...hang, dungHang('chung', t('Chung'), t('Case không gắn kỹ năng'), [], chung)];
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
  return out.map((x) => (x.kind === 'rong' ? { ...x, nhan: t('Không có Case: {ds}', { ds: x.khoa.map((k) => nhanCua.get(k)).join(' · ') }) } : x));
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

export type ViecMenuLop = 'thong-tin' | 'sua-hoc-vien' | 'hoc-vien' | 'lo-trinh-ca-lop' | 'xuat-mt' | 'mo-lai-lop' | 'xoa-lop' | 'ket-thuc-lop' | 'lich-su';
export type MucMenuLop = { key: ViecMenuLop; nhan: string; nhom: 'Lớp' | 'Cuối khoá' | 'Công cụ' | null };
/**
 * Menu ⋯ hồ sơ lớp: Lớp → Cuối khoá (lớp thường: Cuối khoá… · Kết thúc lớp) → Công cụ → (kẻ) Mở lại / Xoá / Kết thúc lớp FT (`nhom` null). Mỗi mục giữ
 * điều kiện quyền cũ; nhóm không còn mục thì không có tiêu đề. Nút cố định Nhập điểm · + Case nằm ngoài menu.
 */
export function menuHoSoLop(i: {
  thuong: boolean; chuongTrinh: string | null; soHocVien: number;
  /** OV-6b2: lớp liên tục (PET, KET…) — không có Lộ trình tiếp theo. */
  lienTuc?: boolean;
  canEditProgress: boolean; canAssign: boolean; canAssignSubject: boolean; canAddStudents: boolean; coTheChuyenTiep: boolean;
  coTheXuatExcel: boolean; coTheMoLaiLop: boolean; coTheXoa: boolean; coTheKetThuc: boolean;
  /** OV-13i: cờ máy chủ `viewer.coTheSuaCaLop` (GVCN / QL / TVV / CX đúng phạm vi); không truyền → theo `canAddStudents`. */
  coTheSuaCaLop?: boolean;
  /** OV-13p: cờ máy chủ `viewer.coTheSuaHocVien` (`student.edit`) — Lộ trình tiếp theo; `canAddStudents` nay là `student.add` (TVV / CX có). Không truyền → theo `canAddStudents`. */
  coTheSuaHocVien?: boolean;
  /** OV-15g (C22): Lịch sử thay đổi của lớp — ai xem được hồ sơ lớp đều xem được (máy chủ kiểm lại). */
  coTheXemLichSu?: boolean;
}): MucMenuLop[] {
  const m = (key: ViecMenuLop, nhan: string, nhom: MucMenuLop['nhom'], co: boolean): MucMenuLop[] => (co ? [{ key, nhan, nhom }] : []);
  return [
    ...m('thong-tin', t('Thông tin lớp'), 'Lớp', i.canEditProgress || i.canAssign || i.canAssignSubject),
    ...m('sua-hoc-vien', t('Sửa thông tin học viên'), 'Lớp', (i.coTheSuaCaLop ?? i.canAddStudents) && i.soHocVien > 0),
    ...m('hoc-vien', t('+ Học viên'), 'Lớp', i.canAddStudents),
    /* P9b: trang Cuối khoá (thay Lộ trình tiếp theo + Đánh giá đầu ra); R5.3: lớp FT bỏ "Chuyển tiếp lớp" — đổi lớp từng em / chọn nhiều em → Chuyển lớp…. */
    ...m('lo-trinh-ca-lop', t('Cuối khoá…'), 'Cuối khoá', i.thuong && !i.lienTuc && (i.coTheChuyenTiep || (i.coTheSuaHocVien ?? i.canAddStudents))),
    /* Mockup V6 k1b: lớp thường — Kết thúc lớp nằm trong nhóm Cuối khoá; lớp FT giữ cuối menu sau đường kẻ (k8). */
    ...m('ket-thuc-lop', t('Kết thúc lớp'), 'Cuối khoá', i.thuong && i.coTheKetThuc),
    ...m('xuat-mt', t('Xuất Excel'), 'Công cụ', i.coTheXuatExcel),
    ...m('lich-su', t('Lịch sử'), 'Công cụ', !!i.coTheXemLichSu),
    ...m('mo-lai-lop', t('Mở lại lớp'), null, i.coTheMoLaiLop),
    ...m('xoa-lop', t('Xoá lớp'), null, i.coTheXoa),
    ...m('ket-thuc-lop', t('Kết thúc lớp'), null, !i.thuong && i.coTheKetThuc),
  ];
}

/** P9b: trang con Cuối khoá của hồ sơ lớp; `em` → em đó chọn sẵn + cuộn tới dòng (lối vào từ hồ sơ HV). */
export const duongLoTrinhLop = (classId: number, em?: number | null): string =>
  `/hoc-vien/lop/${classId}?xem=cuoi-khoa${em ? `&em=${em}` : ''}`;

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
  'tong-ket': t('Tổng kết'), 'hoc-vien': t('Học viên'), 'y-thuc': t('Ý thức & Phối hợp'), 'phan-tich': t('Phân tích lớp'),
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

/**
 * OV-13b: MỘT hàm đếm quá hạn cho badge lớp ("n việc quá hạn"), lọc Quá hạn ("Quá hạn · n việc") và đầu nhóm lớp của Cần làm — cùng danh sách việc
 * (`/my-work`, việc có `quaHan`); `classId` = chỉ lớp đó. Trả cả số em để nơi cần nói "n em" dùng cùng nguồn.
 */
export function demQuaHan(ds: readonly { quaHan: boolean; studentId: number | null; classId: number | null }[], classId?: number | null): { viec: number; em: number } {
  const q = ds.filter((v) => v.quaHan && (classId == null || v.classId === classId));
  return { viec: q.length, em: new Set(q.flatMap((v) => (v.studentId !== null ? [v.studentId] : []))).size };
}
