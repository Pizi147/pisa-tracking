/**
 * PR-YT2 — LUẬT THUẦN: đếm lần sửa, nhãn lịch sử vi phạm, cảnh báo trùng, khoá nhóm×trạng thái (Q17). PR-YT4 gỡ phần PA / bốn chip /
 * khoảng ngày / chu kỳ (tab Ý thức v4 lọc bằng nhóm em và chuỗi thang của máy chủ).
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-yt2-y-thuc-gon.md (Task 1, bảng Q1–Q19).
 *
 * File này chỉ có TỪ VỰNG và LUẬT THUẦN (không đụng database) để máy chủ và giao diện đọc cùng một nơi.
 */
import { ngay } from './hienThiNgay.ts';
import { TRANG_THAI_VP, type TrangThaiVp, VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, VIOLATION_SKILL_LABEL, type ViolationCategory } from './yThuc.ts';
import { t } from '../i18n/index.ts';

// ---------------------------------------------------------------- Q8: đếm lần sửa + nhãn lịch sử vi phạm

export type LichSuViPhamRow = {
  id: number; field: string; oldValue: string | null; newValue: string | null;
  actorUserId: number | null; actorName: string | null; createdAt: string;
};

/** Bốn trường nội dung tính vào "Đã sửa {n} lần" (Q8) — KHÔNG gồm `measure` (gắn/bỏ khỏi lần xử lý không phải sửa vi phạm). */
const TRUONG_DEM_LAN_SUA = new Set(['ten', 'description', 'category', 'skill', 'occurred_on']);

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
  ten: t('Vi phạm'), description: t('Mô tả'), category: t('Nhóm'), skill: t('Môn'), occurred_on: t('Ngày xảy ra'),
};

/**
 * Nhãn một dòng lịch sử để hiện trong "Đã sửa {n} lần · Xem": `{Trường}: {cũ} → {mới}`. Dòng `field = 'measure'` (gắn/bỏ
 * khỏi phương án) không theo khuôn đó — trả `truong: ''` để nơi gọi chỉ hiện câu ở `moi`. `homNay` (G-6, `ngay()`) cho
 * ngày dạng `dd/mm` khi cùng năm; không truyền thì `ngay()` tự trả `dd/mm/yyyy` đầy đủ.
 */
export function nhanLichSuViPham(h: LichSuViPhamRow, homNay?: string | null): { truong: string; cu: string; moi: string } {
  if (h.field === 'measure') {
    return { truong: '', cu: '', moi: h.newValue === null ? t('Bỏ khỏi lần xử lý') : t('Gắn vào lần xử lý') };
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

/**
 * Q6 — một dòng `Đã có {n} vi phạm {Nhóm} ngày {dd/mm}` (+ ` chưa xử lý` khi MỌI dòng chưa nằm trong lần xử lý nào — PR-YT4: trạng thái
 * v4 khác `Chờ QL duyệt` / `Đã xử lý`); `null` khi rỗng.
 */
export function cauCanhBaoTrung(
  rows: readonly { category: string; occurredOn: string; trangThai: TrangThaiVp }[],
  homNay?: string | null,
): string | null {
  if (!rows.length) return null;
  const nhom = VIOLATION_CATEGORY_LABEL[rows[0].category as ViolationCategory] ?? rows[0].category;
  const ngayStr = ngay(rows[0].occurredOn, homNay);
  const chuaXuLy = rows.every((r) => r.trangThai !== 'da_xu_ly' && r.trangThai !== 'cho_duyet');
  return t('Đã có {length} vi phạm {nhom} ngày {ngayStr}{x}', { length: rows.length, nhom, ngayStr, x: chuaXuLy ? t(' chưa xử lý') : '' });
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
