/**
 * PR-YT2 — LUẬT THUẦN CHO ĐỢT ĐẦY ĐỦ: đếm lần sửa, nhãn lịch sử vi phạm, cảnh báo trùng, thêm vi phạm vào PA, patch PA
 * chỉ gửi phần đổi, khoảng ngày cho "Theo thời gian", bộ lọc phụ (Q13), chu kỳ hiện tại (Q14), khoá nhóm×trạng thái (Q17).
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-yt2-y-thuc-gon.md (Task 1, bảng Q1–Q19).
 *
 * File này chỉ có TỪ VỰNG và LUẬT THUẦN (không đụng database) để máy chủ và giao diện đọc cùng một nơi.
 */
import { ngay } from './hienThiNgay.ts';
import { TRANG_THAI_VP, VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, VIOLATION_SKILL_LABEL, type ViolationCategory, type ViolationState } from './yThuc.ts';

// ---------------------------------------------------------------- Q8: đếm lần sửa + nhãn lịch sử vi phạm

export type LichSuViPhamRow = {
  id: number; field: string; oldValue: string | null; newValue: string | null;
  actorUserId: number | null; actorName: string | null; createdAt: string;
};

/** Bốn trường nội dung tính vào "Đã sửa {n} lần" (Q8) — KHÔNG gồm `measure` (gắn/bỏ khỏi phương án không phải sửa vi phạm). */
const TRUONG_DEM_LAN_SUA = new Set(['description', 'category', 'skill', 'occurred_on']);

/**
 * Q8 — số LẦN sửa, không phải số DÒNG lịch sử: một lần sửa có thể đổi nhiều trường cùng lúc (`editViolation` ghi mỗi
 * trường đổi một dòng, cùng `createdAt`), nên nhóm theo `createdAt` + người sửa rồi đếm số nhóm.
 */
export function demLanSua(history: readonly LichSuViPhamRow[]): number {
  const nhom = new Set<string>();
  for (const h of history) {
    if (!TRUONG_DEM_LAN_SUA.has(h.field)) continue;
    nhom.add(`${h.createdAt}·${h.actorUserId ?? ''}`);
  }
  return nhom.size;
}

const TRUONG_NHAN: Record<string, string> = {
  description: 'Mô tả', category: 'Nhóm', skill: 'Môn', occurred_on: 'Ngày xảy ra',
};

/**
 * Nhãn một dòng lịch sử để hiện trong "Đã sửa {n} lần · Xem": `{Trường}: {cũ} → {mới}`. Dòng `field = 'measure'` (gắn/bỏ
 * khỏi phương án) không theo khuôn đó — trả `truong: ''` để nơi gọi chỉ hiện câu ở `moi`. `homNay` (G-6, `ngay()`) cho
 * ngày dạng `dd/mm` khi cùng năm; không truyền thì `ngay()` tự trả `dd/mm/yyyy` đầy đủ.
 */
export function nhanLichSuViPham(h: LichSuViPhamRow, homNay?: string | null): { truong: string; cu: string; moi: string } {
  if (h.field === 'measure') {
    return { truong: '', cu: '', moi: h.newValue === null ? 'Bỏ khỏi phương án' : 'Gắn vào phương án' };
  }
  const dich = (v: string | null): string => {
    if (v === null) return '—';
    if (h.field === 'category') return VIOLATION_CATEGORY_LABEL[v as ViolationCategory] ?? v;
    if (h.field === 'skill') return VIOLATION_SKILL_LABEL[v] ?? v;
    if (h.field === 'occurred_on') return ngay(v, homNay);
    return v;
  };
  return { truong: TRUONG_NHAN[h.field] ?? h.field, cu: dich(h.oldValue), moi: dich(h.newValue) };
}

// ---------------------------------------------------------------- Q6: cảnh báo trùng một dòng

/** Q6 — một dòng `Đã có {n} vi phạm {Nhóm} ngày {dd/mm}` (+ ` chưa xử lý` khi MỌI dòng còn `unhandled`); `null` khi rỗng. */
export function cauCanhBaoTrung(
  rows: readonly { category: ViolationCategory; occurredOn: string; state: ViolationState }[],
  homNay?: string | null,
): string | null {
  if (!rows.length) return null;
  const nhom = VIOLATION_CATEGORY_LABEL[rows[0].category] ?? rows[0].category;
  const ngayStr = ngay(rows[0].occurredOn, homNay);
  const chuaXuLy = rows.every((r) => r.state === 'unhandled');
  return `Đã có ${rows.length} vi phạm ${nhom} ngày ${ngayStr}${chuaXuLy ? ' chưa xử lý' : ''}`;
}

// ---------------------------------------------------------------- Q3: chia "Thêm vi phạm" trong panel PA

/** Q3 — vi phạm của học viên KHÔNG nằm trong tập đang chọn, chia `chuaXuLy`/`daXuLy`, mới nhất trước. */
export function chiaThemViPham<T extends { id: number; state: ViolationState; occurredOn: string }>(
  tatCa: readonly T[],
  dangChon: ReadonlySet<number> | readonly number[],
): { chuaXuLy: T[]; daXuLy: T[] } {
  const chon = dangChon instanceof Set ? dangChon : new Set(dangChon);
  const con = tatCa.filter((v) => !chon.has(v.id));
  const moiNhatTruoc = (a: T, b: T) => b.occurredOn.localeCompare(a.occurredOn) || b.id - a.id;
  return {
    chuaXuLy: con.filter((v) => v.state === 'unhandled').sort(moiNhatTruoc),
    daXuLy: con.filter((v) => v.state !== 'unhandled').sort(moiNhatTruoc),
  };
}

// ---------------------------------------------------------------- Q1/Q2: patch PA chỉ gửi phần đổi

export type PatchPhuongAnGoc = {
  kind: string; customName: string | null; note: string | null; ownerUserId: number | null;
  violationIds: readonly number[];
};
export type PatchPhuongAnNhap = {
  kind?: string; customName?: string | null; note?: string | null; ownerUserId?: number | null;
  violationIds?: readonly number[];
};
export type PatchPhuongAn = {
  kind?: string; customName?: string | null; note?: string | null; ownerUserId?: number | null;
  violationIds?: number[];
};

/** Q1/Q2 — chỉ trường ĐÃ ĐỔI so với bản gốc (`violationIds` so như TẬP, đảo thứ tự không tính là đổi); `null` khi không đổi gì. */
export function thanPatchPhuongAn(goc: PatchPhuongAnGoc, nhap: PatchPhuongAnNhap): PatchPhuongAn | null {
  const out: PatchPhuongAn = {};
  if (nhap.kind !== undefined && nhap.kind !== goc.kind) out.kind = nhap.kind;
  if (nhap.customName !== undefined && (nhap.customName ?? null) !== (goc.customName ?? null)) out.customName = nhap.customName ?? null;
  if (nhap.note !== undefined && (nhap.note ?? null) !== (goc.note ?? null)) out.note = nhap.note ?? null;
  if (nhap.ownerUserId !== undefined && (nhap.ownerUserId ?? null) !== (goc.ownerUserId ?? null)) out.ownerUserId = nhap.ownerUserId ?? null;
  if (nhap.violationIds !== undefined) {
    const a = new Set(goc.violationIds);
    const b = new Set(nhap.violationIds);
    const same = a.size === b.size && [...a].every((x) => b.has(x));
    if (!same) out.violationIds = [...nhap.violationIds];
  }
  return Object.keys(out).length ? out : null;
}

// ---------------------------------------------------------------- YT-6: khoảng ngày "Theo thời gian"

/** `homNay` trừ 7/30 ngày → ISO `yyyy-mm-dd`; `'all'` → `null` (không lọc từ ngày). */
export function tuNgayTheoKhoang(homNay: string, khoang: '7' | '30' | 'all'): string | null {
  if (khoang === 'all') return null;
  const soNgay = khoang === '7' ? 7 : 30;
  const d = new Date(`${homNay.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - soNgay);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- Q13: bốn chip bộ lọc phụ (YT-12)

export const BO_LOC_PHU = ['tat-ca', 'chua-xu-ly', 'co-pa-dang-chuan-bi', 'qua-5-ngay'] as const;
export type BoLocPhu = (typeof BO_LOC_PHU)[number];

export type DongHocVienBoLoc = { coChuaXuLy: boolean; coPaDangChuanBi: boolean; canhBao: boolean };
export type DongViPhamBoLoc = { state: ViolationState; ageLabel: string };

/** Q13 — một bộ lọc dùng cho CẢ dòng học viên (Theo học viên) lẫn dòng vi phạm (Theo thời gian); lọc ở máy khách. */
export function hopBoLocPhu(boLoc: BoLocPhu, x: DongHocVienBoLoc | DongViPhamBoLoc): boolean {
  if (boLoc === 'tat-ca') return true;
  if ('state' in x) {
    if (boLoc === 'chua-xu-ly') return x.state === 'unhandled';
    if (boLoc === 'co-pa-dang-chuan-bi') return x.state === 'preparing';
    return !!x.ageLabel; // qua-5-ngay
  }
  if (boLoc === 'chua-xu-ly') return x.coChuaXuLy;
  if (boLoc === 'co-pa-dang-chuan-bi') return x.coPaDangChuanBi;
  return x.canhBao; // qua-5-ngay
}

// ---------------------------------------------------------------- Q14: đếm theo chu kỳ học hiện tại

export type ChuKyHienTai = { cycleId: number | null; classId: number | null };

/** Q14 — FT (`chuKy.cycleId` có): so `cycleId`. Lớp thường (`cycleId` null): so `classId` (khoá đang học). */
export function trongChuKyHienTai(v: { cycleId: number | null; classId: number | null }, chuKy: ChuKyHienTai): boolean {
  if (chuKy.cycleId !== null) return v.cycleId === chuKy.cycleId;
  return v.classId === chuKy.classId;
}

// ---------------------------------------------------------------- Q17: khoá nhóm × trạng thái (P13)

export const NHOM_VI_PHAM_KHOA = [...VIOLATION_CATEGORIES, 'tat-ca'] as const;
export type NhomViPhamKhoa = (typeof NHOM_VI_PHAM_KHOA)[number];
/** PR-YT4: sáu trạng thái §5.4 (từ `trangThaiViPham`) + `tat-ca`. */
export const TRANG_THAI_VI_PHAM_KHOA = ['tat-ca', ...TRANG_THAI_VP] as const;
export type TrangThaiViPhamKhoa = (typeof TRANG_THAI_VI_PHAM_KHOA)[number];

/** Q17 — khoá `byKind` của chỉ số `vi-pham-theo-nhom`: `{nhom}:{trangThai}`. */
export function khoaNhomTrangThai(nhom: NhomViPhamKhoa, trangThai: TrangThaiViPhamKhoa): string {
  return `${nhom}:${trangThai}`;
}

/** Đủ 6 nhóm (5 nhóm + `tat-ca`) × 7 trạng thái (6 + `tat-ca`) = 42 khoá, dùng chung máy chủ và web (đọc `byKind`). */
export const NHOM_TRANG_THAI_KHOA: readonly string[] = NHOM_VI_PHAM_KHOA.flatMap((n) =>
  TRANG_THAI_VI_PHAM_KHOA.map((t) => khoaNhomTrangThai(n, t)),
);
