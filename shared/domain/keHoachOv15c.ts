/**
 * OV-15c — LUẬT THUẦN CỦA KẾ HOẠCH TEST mới (kế hoạch `docs/superpowers/plans/2026-10-19-ov15-overhaul-6-pr.md` mục OV-15c, mockup 4 + 6):
 * tuần kèm năm (C20), ô lịch của tệp Kế hoạch Test 13 cột (C17), bảng Xuất điểm Test (mockup 6 khung 9), nút Xóa (mục 6). Không đọc DB.
 */
import { ngayTheoGioVN } from './display.ts';
import { tuanLich } from './hienThiNgay.ts';
import { mondayOfDate, owningMonthOf } from './week.ts';
import { t } from '../i18n/index.ts';

/** C20: Kế hoạch Test, hộp lịch, xuất luôn ghi năm — `W4 AUG/2026` (năm của tháng sở hữu tuần, như mã tuần). Trống → `—`. */
export function tuanNam(d: string | null | undefined): string {
  const s = ngayTheoGioVN(d);
  if (!s) return '—';
  const thuHai = mondayOfDate(s);
  return `${tuanLich(thuHai)}/${owningMonthOf(thuHai).year}`;
}
/** UI-CHAM-TEST (mockup V5 khu a, 08 mục 6): trên MÀN Kế hoạch Test ghi `W3 SEP 2026` (khoảng trắng); `tuanNam` "/" giữ cho tệp Excel (C17). */
export const tuanNamChu = (d: string | null | undefined): string => tuanNam(d).replace('/', ' ');

// ------------------------------------------------------------------ Xóa lịch (mục 6)

/** Một kỹ năng của đợt đủ để quyết nút Xóa: bắt buộc, tuần, đã thi, có điểm (`khoa` của ô Kế hoạch Test). */
export type KnXoa = { batBuoc: boolean; tuan: string | null; sit: string | null; khoa: string | null };

/**
 * Nút Xóa ở chân hộp lịch = bỏ tuần (`boTuanLuot`): mờ + lý do khi đợt đã có điểm / đã thi một phần (máy chủ chặn cùng luật),
 * khi chưa xếp tuần nào (không có gì để xóa). `null` = bấm được.
 */
export function lyDoKhongXoa(kn: Partial<Record<string, KnXoa | undefined>>): string | null {
  const ds = Object.values(kn).filter((o): o is KnXoa => !!o && o.batBuoc);
  /* RKC: có điểm / đã làm bài một phần vẫn Xóa lịch phần chưa thi (máy chủ `boTuanLuot`). */
  if (!ds.some((o) => o.tuan && o.sit === 'scheduled' && o.khoa !== 'đã có điểm' && o.khoa !== 'đã làm bài')) return t('Chưa xếp lịch');
  return null;
}

// ------------------------------------------------------------------ Kế hoạch Test 13 cột (C17)

export const SO_MT_XUAT = 10;
export const COT_KE_HOACH_XUAT: readonly string[] = ['Gmail', 'Tên học sinh', 'Lớp', ...Array.from({ length: SO_MT_XUAT }, (_, i) => `MT${i + 1}`)];
const KY_HIEU: Record<string, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };
const THU_TU = ['listening', 'reading', 'writing', 'speaking'];

/** Một kỹ năng của lượt trong tệp: tuần (thứ Hai), trạng thái thi thô (`sit_status`), bắt buộc. */
export type KnLich = { skill: string; tuan: string | null; sit: string | null; batBuoc: boolean };

/**
 * Ô MT của tệp Kế hoạch Test = LỊCH THI (không phải điểm): không có lượt → "Chưa xếp" · lượt đã huỷ (dữ liệu cũ) → "Đã huỷ" ·
 * cùng một chữ cho mọi kỹ năng → `W4 AUG/2026` · khác nhau → `L/R: W4 AUG/2026; W/S: W1 SEP/2026`. Từng kỹ năng: vắng → "Vắng",
 * huỷ phần thi → "Đã huỷ", chưa có tuần → "Chưa xếp".
 */
export function oLichXuat(luot: { huy: true } | { kn: KnLich[] } | null): string {
  if (!luot) return 'Chưa xếp';
  if ('huy' in luot) return 'Đã huỷ';
  const nhom = new Map<string, string[]>();
  for (const k of [...luot.kn].filter((x) => x.batBuoc && KY_HIEU[x.skill]).sort((a, b) => THU_TU.indexOf(a.skill) - THU_TU.indexOf(b.skill))) {
    const chu = k.sit === 'absent' ? 'Vắng' : k.sit === 'cancelled' ? 'Đã huỷ' : k.tuan ? tuanNam(k.tuan) : 'Chưa xếp';
    nhom.set(chu, [...(nhom.get(chu) ?? []), KY_HIEU[k.skill]]);
  }
  if (nhom.size === 0) return 'Chưa xếp';
  if (nhom.size === 1) return [...nhom.keys()][0];
  return [...nhom].map(([chu, kn]) => `${kn.join('/')}: ${chu}`).join('; ');
}

/** Một học viên của tệp: lớp đã qua trong lộ trình (cũ → mới), lượt theo số MT. */
export type HvKeHoach = { email: string | null; ten: string; lop: string[]; luot: Map<number, { huy: true } | { kn: KnLich[] }> };

/** Em học 2 lớp trong kỳ: MỘT hàng, cột Lớp `MB FT 101 → MB FT 105` (bỏ lớp trùng liền nhau). */
export const chuoiLop = (lop: readonly string[]) => lop.filter((x, i) => x && x !== lop[i - 1]).join(' → ');

/** Sheet "Kế hoạch Test" (hàng 1 = tiêu đề, 13 cột) + danh sách MT > 10 (ghi ở sheet "Thông tin xuất", website không mất). */
export function bangKeHoachXuat(hv: readonly HvKeHoach[]): { aoa: (string | null)[][]; ngoai: string[] } {
  const aoa: (string | null)[][] = [[...COT_KE_HOACH_XUAT]];
  const ngoai: string[] = [];
  for (const h of hv) {
    aoa.push([h.email, h.ten, chuoiLop(h.lop), ...Array.from({ length: SO_MT_XUAT }, (_, i) => oLichXuat(h.luot.get(i + 1) ?? null))]);
    for (const [so, l] of [...h.luot].filter(([so]) => so > SO_MT_XUAT).sort((a, b) => a[0] - b[0])) {
      ngoai.push(`${h.ten} · ${chuoiLop(h.lop)} · MT${so} ${oLichXuat(l)}`);
    }
  }
  return { aoa, ngoai };
}

/** Sheet "Thông tin xuất" (cả hai tệp của Kế hoạch Test): cặp nhãn – giá trị. */
export function bangThongTinXuat(o: { chiNhanh: string; boLoc: string; luc: string; nguoi: string; ngoai?: readonly string[] }): (string | null)[][] {
  return [
    ['Chi nhánh', o.chiNhanh], ['Bộ lọc', o.boLoc], ['Xuất lúc', `${o.luc} · ${o.nguoi}`],
    ...(o.ngoai ? [['MT ngoài 1–10', o.ngoai.length ? o.ngoai.join('\n') : 'Không có']] : []),
  ];
}

// ------------------------------------------------------------------ Kết quả một lượt Mock (cột "Kết quả" của Xuất Excel › Điểm Test — G1-08)

/** Kết quả một lượt Mock (C27): đủ điểm + biết kỳ vọng → Overall ≥ kỳ vọng "Đạt", dưới "Chưa đạt"; còn lại "Chưa đủ điểm". */
export function ketQuaLuot(d: { ovr: number | null; kyVong: number | null; danhGiaDuoc: boolean }): string {
  if (!d.danhGiaDuoc || d.ovr === null || d.kyVong === null) return 'Chưa đủ điểm';
  return d.ovr >= d.kyVong ? 'Đạt' : 'Chưa đạt';
}

/** Chữ trong tên tệp: bỏ dấu, chỉ chữ số + gạch (`Hai-Duong`, `HDFT03`). */
export const chuTep = (s: string, gach = '-') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-/g, gach);
