/**
 * CÔNG VIỆC — luật thuần cho Hỗ trợ học viên (lọc nhanh, Loại việc), Vận hành (hàng số, facet,
 * bốn trạng thái Q8) và Báo cáo đơn vị (nháp/nộp theo ô, theo đơn vị — Q12).
 *
 * Không truy vấn database, không đọc đồng hồ máy — `homNay` luôn được truyền vào (đặc tả G-6).
 * Đặc tả: docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md §1, §3.4, §3.13, §4.
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-ra-cong-viec.md (Q1–Q18).
 */
import { catDongPhu } from './hocVienLop.ts';
import { ngay } from './hienThiNgay.ts';
import { mondayOfDate } from './week.ts';
import { TASK_GROUPS, TASK_PROGRESS_CLOSED, type TaskGroup, type TaskProgress } from './worklist.ts';
import { NHOM_VIEC, nhomViecCua, type NhomViec } from './tongQuan.ts';

const DAY_MS = 86_400_000;
const addDaysIso = (iso: string, n: number): string =>
  new Date(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
const daysBetweenIso = (from: string, to: string): number =>
  Math.round((Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / DAY_MS);

// ====================================================================== Hỗ trợ học viên — lọc nhanh

/** Bốn câu hỏi về hạn (đặc tả §3.4, thắng thiết kế §18.4 cũ — xem "Mâu thuẫn nguồn ↔ mã thật" #5). */
export const LOC_NHANH = ['tat-ca', 'qua-han', 'hom-nay', 'tuan-nay'] as const;
export type LocNhanh = (typeof LOC_NHANH)[number];
export const LOC_NHANH_LABEL: Record<LocNhanh, string> = {
  'tat-ca': 'Tất cả', 'qua-han': 'Quá hạn', 'hom-nay': 'Hôm nay', 'tuan-nay': 'Tuần này',
};

/** Việc dòng Hỗ trợ học viên tối thiểu cần có — trùng `WorkItem` của `mywork.ts`. */
export type MucLocNhanh = { urgency: 'overdue' | 'today' | 'normal'; due: string | null };

/**
 * Q4: "Tuần này" là hạn từ HÔM NAY đến CHỦ NHẬT tuần này (gồm cả Hôm nay), CHƯA quá hạn. Việc
 * không có hạn không vào ô nào ngoài "Tất cả". Bốn ô là bốn góc nhìn khác nhau, không phải một
 * phép chia — "Quá hạn" và "Tuần này" cố tình không chồng nhau vì quá hạn đã có ô riêng.
 */
export function khopLocNhanh(it: MucLocNhanh, loc: LocNhanh, homNay: string): boolean {
  if (loc === 'tat-ca') return true;
  if (loc === 'qua-han') return it.urgency === 'overdue';
  if (loc === 'hom-nay') return it.urgency === 'today';
  if (!it.due) return false;
  const d = it.due.slice(0, 10);
  const chuNhat = addDaysIso(mondayOfDate(homNay), 6);
  return d >= homNay && d <= chuNhat;
}

/**
 * Số việc ở mỗi ô lọc nhanh — ĐÃ áp Loại việc đang chọn, CHƯA áp chính lọc nhanh (facet không tự lọc chính nó).
 * PR-UXF-a F5 (Q19): `soNhac` = nhắc Phối hợp SOS (không có hạn) đang hiện — chỉ cộng vào "Tất cả", không vào Quá hạn / Hôm nay / Tuần này.
 */
export function demLocNhanh<T extends MucLocNhanh & { group: string }>(
  items: T[], loai: string | 'tat-ca' | undefined, homNay: string, soNhac = 0,
): Record<LocNhanh, number> {
  const base = !loai || loai === 'tat-ca' ? items : items.filter((it) => it.group === loai);
  const out = {} as Record<LocNhanh, number>;
  for (const loc of LOC_NHANH) out[loc] = base.filter((it) => khopLocNhanh(it, loc, homNay)).length;
  out['tat-ca'] += soNhac;
  return out;
}

/**
 * PR-UXF-a F5: hàng chip Nhóm việc — ĐÃ áp lọc nhanh `loc`, CHƯA áp nhóm. Nhắc (`soNhac`, không hạn) chỉ có khi `loc` = "Tất cả" và thuộc
 * nhóm Ý thức. "Tất cả" = Σ nhóm — nên ở mặc định (không lọc) nó bằng ô "Tất cả" của Lọc nhanh: cùng việc, cùng nhắc.
 */
export function demNhomChip<T extends MucLocNhanh & { group: string }>(
  items: T[], loc: LocNhanh, homNay: string, soNhac = 0,
): Record<NhomViec | 'tat-ca', number> {
  const out = Object.fromEntries([...NHOM_VIEC, 'tat-ca'].map((k) => [k, 0])) as Record<NhomViec | 'tat-ca', number>;
  for (const it of items) if (khopLocNhanh(it, loc, homNay)) out[nhomViecCua(it.group)] += 1;
  if (loc === 'tat-ca') out['y-thuc'] += soNhac;
  out['tat-ca'] = NHOM_VIEC.reduce((n, k) => n + out[k], 0);
  return out;
}

/** Số việc theo từng Loại việc — ĐÃ áp lọc nhanh đang chọn, CHƯA áp chính Loại việc. */
export function demLoaiViec<T extends MucLocNhanh & { group: string }>(
  items: T[], loc: LocNhanh, homNay: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    if (!khopLocNhanh(it, loc, homNay)) continue;
    out[it.group] = (out[it.group] ?? 0) + 1;
  }
  return out;
}

// ====================================================================== Người phụ trách

/** `?nguoi=` trên địa chỉ: "toi" · "tat-ca" · một ID · chuỗi lạ (kể cả rỗng/thiếu) → null. */
export function thamSoNguoi(s: string | null | undefined): 'toi' | 'tat-ca' | number | null {
  if (s === 'toi' || s === 'tat-ca') return s;
  if (s != null && /^[1-9]\d*$/.test(s)) return Number(s);
  return null;
}

// ====================================================================== Vận hành — hàng số, facet, bốn trạng thái

/** Một dòng Vận hành, đủ để tính hàng số/facet — không cần toàn bộ bản ghi task. */
export type DongVanHanh = {
  progress: TaskProgress;
  due: string | null;
  reviewOn: string | null;
  completedAt: string | null;
  /** Số việc con CHƯA khép của chính dòng này. */
  subOpen: number;
  /** Tổng số việc con của dòng này (0 = không có việc con). */
  subTotal: number;
  group: TaskGroup;
  assigneeUserId: number | null;
};

const daKhep = (r: { progress: TaskProgress }): boolean => (TASK_PROGRESS_CLOSED as readonly string[]).includes(r.progress);

/** Q8: bốn định nghĩa — "Chờ người khác" và "Cần quyết định" CỐ Ý không chồng nhau. */
function isQuaHan(r: DongVanHanh, homNay: string): boolean {
  return !daKhep(r) && !!r.due && r.due.slice(0, 10) < homNay;
}
function isChoNguoiKhac(r: DongVanHanh, homNay: string): boolean {
  return r.progress === 'paused' && (!r.reviewOn || r.reviewOn.slice(0, 10) > homNay);
}
function isCanQuyetDinh(r: DongVanHanh, homNay: string): boolean {
  const tamNgungDaToiHan = r.progress === 'paused' && !!r.reviewOn && r.reviewOn.slice(0, 10) <= homNay;
  const chaHetConMo = r.subTotal > 0 && r.subOpen === 0 && !daKhep(r);
  return tamNgungDaToiHan || chaHetConMo;
}
function isVuaXong(r: DongVanHanh, homNay: string): boolean {
  if (r.progress !== 'done' || !r.completedAt) return false;
  const d = daysBetweenIso(r.completedAt.slice(0, 10), homNay);
  return d >= 0 && d <= 6;
}

export const HANG_SO = ['qua-han', 'cho-nguoi-khac', 'can-quyet-dinh', 'vua-xong'] as const;
export type HangSo = (typeof HANG_SO)[number];
export const HANG_SO_LABEL: Record<HangSo, string> = {
  'qua-han': 'quá hạn', 'cho-nguoi-khac': 'chờ người khác', 'can-quyet-dinh': 'cần quyết định',
  'vua-xong': 'vừa hoàn thành (7 ngày)',
};

export function khopHang(r: DongVanHanh, hang: HangSo, homNay: string): boolean {
  if (hang === 'qua-han') return isQuaHan(r, homNay);
  if (hang === 'cho-nguoi-khac') return isChoNguoiKhac(r, homNay);
  if (hang === 'can-quyet-dinh') return isCanQuyetDinh(r, homNay);
  return isVuaXong(r, homNay);
}

export function hangSoVanHanh(rows: DongVanHanh[], homNay: string): Record<HangSo, number> {
  const out = {} as Record<HangSo, number>;
  for (const h of HANG_SO) out[h] = rows.filter((r) => khopHang(r, h, homNay)).length;
  return out;
}

/** `'mo'` = chưa khép (mặc định giao diện) · năm trạng thái cụ thể · `'tat-ca'`. */
export const TRANG_THAI_LOC = ['mo', 'not_started', 'doing', 'paused', 'stopped', 'done', 'tat-ca'] as const;
export type TrangThaiLoc = (typeof TRANG_THAI_LOC)[number];

function khopTrangThai(r: DongVanHanh, tt: TrangThaiLoc): boolean {
  if (tt === 'tat-ca') return true;
  if (tt === 'mo') return !daKhep(r);
  return r.progress === tt;
}

export type LocVanHanh = { group?: TaskGroup | 'tat-ca'; progress?: TrangThaiLoc; hang?: HangSo | 'tat-ca' };

function khopGroup(r: DongVanHanh, f: LocVanHanh): boolean {
  return !f.group || f.group === 'tat-ca' || r.group === f.group;
}
function khopHangLoc(r: DongVanHanh, f: LocVanHanh, homNay: string): boolean {
  return !f.hang || f.hang === 'tat-ca' || khopHang(r, f.hang, homNay);
}

export function locVanHanh(rows: DongVanHanh[], f: LocVanHanh, homNay: string): DongVanHanh[] {
  return rows.filter((r) => khopGroup(r, f) && khopTrangThai(r, f.progress ?? 'mo') && khopHangLoc(r, f, homNay));
}

export type FacetVanHanh = {
  group: Record<TaskGroup, number>;
  progress: Record<TrangThaiLoc, number>;
  hang: Record<HangSo, number>;
};

/**
 * Mỗi cột facet BỎ QUA chính bộ lọc của cột đó, để "chọn xong thì số không tự đổi theo lựa chọn
 * vừa bấm" (đặc tả G-10). Riêng hàng số CHỈ áp nhóm — "vừa hoàn thành" là việc đã khép, áp thêm
 * trạng thái/hàng vào chính nó thì vô nghĩa.
 */
export function facetVanHanh(rows: DongVanHanh[], f: LocVanHanh, homNay: string): FacetVanHanh {
  const rowsChoGroup = rows.filter((r) => khopTrangThai(r, f.progress ?? 'mo') && khopHangLoc(r, f, homNay));
  const rowsChoProgress = rows.filter((r) => khopGroup(r, f) && khopHangLoc(r, f, homNay));
  const rowsChoHang = rows.filter((r) => khopGroup(r, f));

  const group = {} as Record<TaskGroup, number>;
  for (const g of TASK_GROUPS) group[g] = rowsChoGroup.filter((r) => r.group === g).length;
  const progress = {} as Record<TrangThaiLoc, number>;
  for (const tt of TRANG_THAI_LOC) progress[tt] = rowsChoProgress.filter((r) => khopTrangThai(r, tt)).length;
  const hang = hangSoVanHanh(rowsChoHang, homNay);

  return { group, progress, hang };
}

/** Dòng phụ ở cột Hạn khi hạn đã dời (Q9) — hạn quá hạn vẫn tính theo hạn HIỆN TẠI, không đổi luật SLA. */
export function dongHanDaDoi(i: { hanGoc: string | null; lyDo: string | null }, homNay: string): string | null {
  if (!i.hanGoc) return null;
  const base = `đã dời từ ${ngay(i.hanGoc, homNay)}`;
  return catDongPhu(i.lyDo ? `${base} · "${i.lyDo}"` : base);
}

// ====================================================================== Báo cáo đơn vị (Q12)

export type OBaoCao = { status: string | null; note: string | null; submittedAt: string | null };

/** Trạng thái MỘT Ô — theo `submitted_at`, không phải theo `status` thô (nháp vẫn có mức). */
export function trangThaiO(o: OBaoCao): 'da-nop' | 'nhap' | 'chua' {
  if (o.submittedAt) return 'da-nop';
  if (o.status !== null || (o.note !== null && o.note !== '')) return 'nhap';
  return 'chua';
}

export type TrangThaiDonVi = { ma: 'da-nop' | 'nhap' | 'chua'; nhan: string; phu: string | null };

/** Q12: theo Ô, không theo đơn vị — trạng thái hàng đơn vị suy ra từ trạng thái từng ô của nó. */
export function trangThaiDonVi(o: OBaoCao[]): TrangThaiDonVi {
  const states = o.map(trangThaiO);
  const daNop = states.filter((s) => s === 'da-nop').length;
  const total = o.length;
  if (total > 0 && daNop === total) return { ma: 'da-nop', nhan: 'Đã nộp', phu: null };
  if (states.every((s) => s === 'chua')) return { ma: 'chua', nhan: 'Chưa báo cáo', phu: null };
  return { ma: 'nhap', nhan: 'Nháp · chưa nộp', phu: `đã nộp ${daNop}/${total}` };
}
