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
import { t } from '../i18n/index.ts';

const DAY_MS = 86_400_000;
const addDaysIso = (iso: string, n: number): string =>
  new Date(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
const daysBetweenIso = (from: string, to: string): number =>
  Math.round((Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / DAY_MS);

// ====================================================================== Hỗ trợ học viên — lọc nhanh

/** Bốn câu hỏi về hạn (đặc tả §3.4, thắng thiết kế §18.4 cũ — xem "Mâu thuẫn nguồn ↔ mã thật" #5). */
export const LOC_NHANH = ['tat-ca', 'qua-han', 'hom-nay', 'tuan-nay', 'den-het-tuan'] as const;
export type LocNhanh = (typeof LOC_NHANH)[number];
export const LOC_NHANH_LABEL: Record<LocNhanh, string> = {
  'tat-ca': t('Tất cả'), 'qua-han': t('Quá hạn'), 'hom-nay': t('Hôm nay'), 'tuan-nay': t('Tuần này'), 'den-het-tuan': t('Đến hết tuần'),
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
  if (loc === 'den-het-tuan') return trongKhoiHomNay(it, homNay);
  if (!it.due) return false;
  const d = it.due.slice(0, 10);
  const chuNhat = addDaysIso(mondayOfDate(homNay), 6);
  return d >= homNay && d <= chuNhat;
}

/**
 * KHỐI "VIỆC CỦA TÔI · HÔM NAY" (PR-VAI-a Q1): việc QUÁ HẠN + việc có hạn từ hôm nay đến hết CHỦ NHẬT tuần này. Việc không hạn không vào.
 * MỘT luật cho khối trên Tổng quan GV, chip "Đến hết tuần" ở Công việc và "Xem hết (n)" trên điện thoại.
 */
export function trongKhoiHomNay(it: MucLocNhanh, homNay: string): boolean {
  if (it.urgency === 'overdue') return true;
  if (!it.due) return false;
  const d = it.due.slice(0, 10);
  return d >= homNay && d <= addDaysIso(mondayOfDate(homNay), 6);
}

/** Dòng tối thiểu để đếm phạm vi (OV-5a) — trùng `WorkItem` của `mywork.ts`. */
export type DongDemPhamVi = MucLocNhanh & {
  group: string; studentId: number | null; count: number | null; soBai?: number | null; emIds?: readonly number[] | null; con?: readonly DongDemPhamVi[];
};

/**
 * DÒNG PHẠM VI Công việc (OV-5a, mockup M1 §1): "n việc · m học viên" — n = số DÒNG (cùng badge), m = em KHÁC NHAU: em của việc một em + id em
 * của việc cả lớp (`emIds`, OV-11c CV-1 — không cộng dồn `count`). Chỉ xem Chấm điểm: "m bài cần chấm" (một bài = một kỹ năng của một em trong một lượt).
 * OV-11c (TE-4): đang lọc hạn (`loc`) thì dòng gộp chỉ đếm việc con KHỚP lọc — dưới "Quá hạn" chỉ bài quá hạn (= chỉ số Tổng quan).
 */
export function demPhamVi(dong: readonly DongDemPhamVi[], chiChamDiem: boolean, loc?: { loc: LocNhanh; homNay: string }): { nhom: number; so: number; donVi: string } {
  const khop = (d: DongDemPhamVi) => !loc || khopLocNhanh(d, loc.loc, loc.homNay);
  const la = (d: DongDemPhamVi): DongDemPhamVi[] => (d.con?.length ? d.con.filter(khop).flatMap(la) : [d]);
  const ds = dong.flatMap(la);
  if (chiChamDiem) return { nhom: dong.length, so: ds.reduce((n, d) => n + (d.soBai ?? d.count ?? (d.studentId !== null ? 1 : 0)), 0), donVi: t('bài cần chấm') };
  const em = new Set<number>();
  for (const d of ds) {
    if (d.studentId !== null) em.add(d.studentId);
    for (const id of d.emIds ?? []) em.add(id);
  }
  return { nhom: dong.length, so: em.size, donVi: t('học viên') };
}

/** Số việc ở mỗi ô lọc nhanh — ĐÃ áp Loại việc đang chọn, CHƯA áp chính lọc nhanh (facet không tự lọc chính nó). */
export function demLocNhanh<T extends MucLocNhanh & { group: string }>(
  items: T[], loai: string | 'tat-ca' | undefined, homNay: string,
): Record<LocNhanh, number> {
  const base = !loai || loai === 'tat-ca' ? items : items.filter((it) => it.group === loai);
  const out = {} as Record<LocNhanh, number>;
  for (const loc of LOC_NHANH) out[loc] = base.filter((it) => khopLocNhanh(it, loc, homNay)).length;
  return out;
}

/** Khung mặc định của bảng Lớp tôi dạy (Q31-1): dạy cả hai → Fast Track; chỉ lớp thường → Lớp thường. */
export const khungMacDinhGv = (coFt: boolean, coThuong: boolean): 'ft' | 'thuong' => (!coFt && coThuong ? 'thuong' : 'ft');
/** PR-S6F-b (D7): khung đã nhớ chỉ dùng khi người xem CÓ lớp ở khung đó — không thì về khung mặc định (không bao giờ ra bảng rỗng mất công tắc). */
export const khungLopToiDay = (nho: string | null, coFt: boolean, coThuong: boolean): 'ft' | 'thuong' =>
  (nho === 'ft' && coFt) || (nho === 'thuong' && coThuong) ? nho : khungMacDinhGv(coFt, coThuong);

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
  'qua-han': t('Quá hạn'), 'cho-nguoi-khac': t('Chờ người khác'), 'can-quyet-dinh': t('Cần quyết định'),
  'vua-xong': t('Vừa hoàn thành (7 ngày)'),
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
  const base = t('đã dời từ {ngay}', { ngay: ngay(i.hanGoc, homNay) });
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
  if (total > 0 && daNop === total) return { ma: 'da-nop', nhan: t('Đã nộp'), phu: null };
  if (states.every((s) => s === 'chua')) return { ma: 'chua', nhan: t('Chưa báo cáo'), phu: null };
  return { ma: 'nhap', nhan: t('Nháp · chưa nộp'), phu: t('đã nộp {daNop}/{total}', { daNop, total }) };
}

// ====================================================================== Form Giao việc (PR-GVa, F03 + F04)

/** Ngữ cảnh lúc MỞ form Giao việc: bộ lọc chi nhánh của trang, việc cha (khi tạo việc con), nhóm biết trước (mở từ mục báo cáo). */
export type NguCanhMoForm = { branchId: number | null; parent?: { branchId?: number | null; group?: string | null; due?: string | null } | null; defaultGroup?: string | null };

/**
 * Giá trị đầu của form Giao việc — tính MỘT lần lúc mở (F03: trước đây tính một lần lúc trang dựng, nên đổi bộ lọc rồi mở lại vẫn
 * mang chi nhánh cũ). Có việc cha thì chi nhánh theo việc cha (ô chi nhánh không hiện với việc con); không thì theo bộ lọc —
 * "Tất cả" → '' ("Toàn hệ thống"). Hạn việc con = hạn cha trừ một ngày (mục 8.6); kết quả đã qua thì để trống.
 */
export function giaTriDauGiaoViec(c: NguCanhMoForm, homNay: string): { branch: string; group: string; due: string } {
  const p = c.parent ?? null;
  const branch = p ? String(p.branchId ?? '') : String(c.branchId ?? '');
  const group = p?.group ?? c.defaultGroup ?? 'curriculum';
  const hanCon = p?.due ? addDaysIso(p.due, -1) : '';
  return { branch, group, due: hanCon && hanCon >= homNay.slice(0, 10) ? hanCon : '' };
}

/** Kỳ (tuần) của việc giao GV, đọc từ `/ref/period-window`: đang tải · lỗi · không có tuần neo · đã rõ (id có thể null — resolve lúc gửi). */
export type TrangThaiKy = { loai: 'dang-tai' } | { loai: 'loi' } | { loai: 'khong-neo' } | { loai: 'co'; id: number | null; weekStart: string; code: string };

/** F04: chỉ 'co' mới cho giao. Lỗi thắng dữ liệu cũ còn trong bộ nhớ — không đoán tuần khi máy chủ vừa báo lỗi. */
export function trangThaiKyGiao(s: { loading: boolean; error: unknown; data: { id: number | null; weekStart: string; code?: string; isAnchor: boolean }[] | null }): TrangThaiKy {
  if (s.error) return { loai: 'loi' };
  if (s.loading || !s.data) return { loai: 'dang-tai' };
  const neo = s.data.find((p) => p.isAnchor);
  if (!neo) return { loai: 'khong-neo' };
  return { loai: 'co', id: neo.id, weekStart: neo.weekStart, code: neo.code ?? '' };
}

/** Nút Giao chỉ bật khi kỳ đã rõ ('co') và không đang lưu. */
export function duocGiao(ky: TrangThaiKy, busy: boolean): boolean {
  return ky.loai === 'co' && !busy;
}

/**
 * UX-2 (4, chủ SP 16/10): Công việc › Hỗ trợ học viên trên máy tính — chưa mở việc nào thì tự mở việc đầu danh sách (thay khung trống "Chọn một việc").
 * Một lần mỗi bộ lọc (`daTuMo`): đóng panel không bật lại. Điện thoại (`manHep`) và danh sách 0 việc: không mở.
 */
/* CV-LOI (CV-09): chỉ tự mở khi việc đầu là việc CỦA người xem — QL / QT không bị mở lưới điểm của GV. */
export const viecTuMo = <T extends { key: string; mine: boolean }>(ds: readonly T[], o: { manHep: boolean; dangMo: boolean; daTuMo: boolean }): string | null =>
  (o.manHep || o.dangMo || o.daTuMo || !ds[0]?.mine ? null : ds[0].key);

/**
 * CV-LOI (CV-05, mockup 1e): VIỆC KẾ của hàng đợi = việc sau việc đang mở, CÙNG nhóm, cùng "của tôi" như việc đang mở, và `duoc` (đang hiện trên
 * danh sách, chưa xong). Không có → null (nơi gọi đóng panel, không nhảy sang nhóm khác).
 */
export function viecKeTiep<T extends { key: string; nhom: string; mine: boolean }>(ds: readonly T[], hienTai: string | null, duoc: (x: T) => boolean): T | null {
  const i = ds.findIndex((x) => x.key === hienTai);
  if (i < 0) return null;
  return ds.slice(i + 1).find((x) => x.nhom === ds[i].nhom && x.mine === ds[i].mine && duoc(x)) ?? null;
}

// ====================================================================== OV-15d — lọc người (Của tôi · Của GV · Tất cả)

/** OV-15d (mockup 2 mục 3): trục lọc duy nhất không thấy trên màn là "người". Ba ô đếm từ CÙNG một danh sách: Của tôi + Của GV = Tất cả. */
export const LOC_NGUOI_VIEC = ['toi', 'gv', 'tat-ca'] as const;
export type LocNguoiViec = (typeof LOC_NGUOI_VIEC)[number];
export const LOC_NGUOI_VIEC_LABEL: Record<LocNguoiViec, string> = { toi: t('Của tôi'), gv: t('Của GV'), 'tat-ca': t('Tất cả') };
/** "Của GV" = mọi việc không phải của người xem, kể cả việc chưa có người phụ trách (để Phân công). */
export const khopNguoiViec = (it: { mine: boolean }, loc: LocNguoiViec): boolean => loc === 'tat-ca' || (loc === 'toi') === it.mine;
export function demNguoiViec(ds: readonly { mine: boolean }[]): Record<LocNguoiViec, number> {
  const toi = ds.filter((x) => x.mine).length;
  return { toi, gv: ds.length - toi, 'tat-ca': ds.length };
}

// ====================================================================== V5 UI-CONG-VIEC — dòng theo em, vạch hạn (T01, T14)

export type MucTheoEm<T> = { kieu: 'dong'; it: T } | { kieu: 'em'; khoa: string; ten: string; lop: string | null; viec: T[] };
/**
 * T01 (mockup V5 `cong-viec.html .hv-gop`): một em có ≥ 2 việc trong cùng nhóm → MỘT dòng tên em + dòng con từng việc (Case R ≠ Case W1, mỗi việc
 * hạn riêng). Dòng gộp lớp mà mọi việc là của một em ("1 em · 2 việc", BỎ ở truy vết mục 3) tách ra thành việc của em đó. Dòng gộp nhiều em và
 * dòng làm cả dòng (`caDong`: Xác nhận PA cùng lúc, Nhập điểm theo tuần) giữ nguyên. Thứ tự: khối em đứng ở chỗ việc đầu tiên của em.
 */
export function xepTheoEm<T extends { key: string; studentId: number | null; studentName: string; classCode: string | null; con?: T[] }>(
  ds: readonly T[], caDong: (it: T) => boolean,
): MucTheoEm<T>[] {
  const phangDs = ds.flatMap((it) => (it.con?.length && !caDong(it) && it.con.every((c) => c.studentId !== null && c.studentId === it.con![0].studentId) ? it.con : [it]));
  const le = (it: T) => !it.con?.length && it.studentId !== null;
  const dem = new Map<number, number>();
  for (const it of phangDs) if (le(it)) dem.set(it.studentId!, (dem.get(it.studentId!) ?? 0) + 1);
  const daDat = new Set<number>();
  const out: MucTheoEm<T>[] = [];
  for (const it of phangDs) {
    if (!le(it) || (dem.get(it.studentId!) ?? 0) < 2) { out.push({ kieu: 'dong', it }); continue; }
    if (daDat.has(it.studentId!)) continue;
    daDat.add(it.studentId!);
    const viec = phangDs.filter((x) => le(x) && x.studentId === it.studentId);
    out.push({ kieu: 'em', khoa: `em:${it.studentId}`, ten: it.studentName, lop: it.classCode, viec });
  }
  return out;
}

/**
 * T14 (mockup V5 `.vach-han`, P7): nhóm Chấm điểm chia ba vạch theo hạn — Quá hạn · Hạn đến hết tuần này · Hạn sau tuần này (gập sẵn, chữ trung
 * tính). `cuoiTuan` = Chủ nhật tuần này — nhãn vạch ghi ngày thật (`dd/mm`), không "tuần này / tuần sau".
 */
export function chiaVachHan<T extends MucLocNhanh>(ds: readonly T[], homNay: string): { quaHan: T[]; denHetTuan: T[]; sau: T[]; cuoiTuan: string } {
  const quaHan = ds.filter((x) => x.urgency === 'overdue');
  const denHetTuan = ds.filter((x) => x.urgency !== 'overdue' && trongKhoiHomNay(x, homNay));
  return { quaHan, denHetTuan, sau: ds.filter((x) => !trongKhoiHomNay(x, homNay)), cuoiTuan: addDaysIso(mondayOfDate(homNay), 6) };
}
