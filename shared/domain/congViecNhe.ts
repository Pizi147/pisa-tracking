/**
 * NHẸ HƠN PR-2a (chủ SP 22/11, mockup `thiet-ke/v23/cong-viec-*`): luật thuần của trang Công việc — dùng ở web và phép kiểm, không đọc dữ liệu.
 */
import { mucHan } from './hienThiNgay.ts';
import { tabCuaViec } from './tongQuan.ts';
import { t } from '../i18n/index.ts';

/** Head / QL "Của GV": chỉ việc quá hạn + sắp đến (hôm nay → còn ≤ 2 ngày, cùng mốc tô vàng `mucHan`). Việc không hạn không vào. */
export const viecGapCuaGv = (it: { due?: string | null }, homNay: string): boolean => !!it.due && mucHan(it.due.slice(0, 10), homNay) !== 'xa';

/**
 * Tab Admin (v23 ④, XM-4; PTA chốt XM-B 22/11): góc nhìn vận hành. "Tất cả" xếp mọi loại; Lịch thi / Hồ sơ chỉ hiện khi `/my-work` của Admin có việc loại đó.
 */
export const TAB_ADMIN = ['tat-ca', 'diem', 'bao-cao-ph', 'lich-thi', 'ho-so', 'van-hanh'] as const;
const TAB_ADMIN_CUA_LOAI: Record<string, string> = {
  score: 'diem', xuat_bc_ph: 'bao-cao-ph', bao_cao_ph: 'bao-cao-ph', bc_ph_qua_han: 'bao-cao-ph', missing_data: 'lich-thi', bo_sung_ho_so: 'ho-so',
};
export const tabAdminCua = (it: { group: string; key: string; hangMuc?: string | null }): string => TAB_ADMIN_CUA_LOAI[it.group] ?? tabCuaViec(it);
export const NHAN_TAB_ADMIN: Record<string, string> = {
  'tat-ca': t('Tất cả'), diem: t('Điểm'), 'bao-cao-ph': t('Báo cáo PH'), 'lich-thi': t('Lịch thi'), 'ho-so': t('Hồ sơ'), 'van-hanh': t('Vận hành'),
};

/** Người phụ trách bài S của Mock (chấm chéo) ghi "GV Speaking", không tên người (chủ SP 22/11 vòng 3). */
export const tenPhuTrach = (it: { owner?: string | null; ownerId?: number | null; kind?: string | null }, kn: string, chamCheo: boolean): string | null =>
  (chamCheo || ((it.kind ?? 'mock') === 'mock' && kn === 'speaking') ? t('GV Speaking') : it.owner ?? (it.ownerId == null ? t('Chưa có người') : null));

/**
 * Panel lớp Admin: gom các dòng Nhập điểm cùng lớp (khác người phụ trách = khác dòng máy chủ) thành bảng từng em —
 * mỗi em nhiều cặp "kỹ năng còn thiếu ↔ người phụ trách" (mỗi người một dòng). Hạn = hạn sớm nhất của em.
 */
export type CapThieu = { kns: string[]; nguoi: string | null; due: string | null };
export type EmThieuLop = { id: number; ten: string; cap: CapThieu[]; due: string | null };
export function gomEmThieu(dong: readonly {
  emThieu?: { id: number; ten: string; kns: string[] }[]; owner?: string | null; ownerId?: number | null; kind?: string | null; due?: string | null; chamCheo?: boolean;
}[]): EmThieuLop[] {
  const em = new Map<number, EmThieuLop>();
  for (const d of dong) {
    for (const e of d.emThieu ?? []) {
      const x = em.get(e.id) ?? em.set(e.id, { id: e.id, ten: e.ten, cap: [], due: null }).get(e.id)!;
      /* S của Mock tách cặp riêng "GV Speaking"; các kỹ năng khác theo người phụ trách của dòng. */
      const nhom = new Map<string, string[]>();
      for (const kn of e.kns) {
        const ai = tenPhuTrach(d, kn, !!d.chamCheo) ?? '';
        nhom.set(ai, [...(nhom.get(ai) ?? []), kn]);
      }
      for (const [ai, kns] of nhom) {
        const cu = x.cap.find((c) => (c.nguoi ?? '') === ai);
        if (cu) cu.kns.push(...kns.filter((k) => !cu.kns.includes(k)));
        else x.cap.push({ kns, nguoi: ai || null, due: d.due ?? null });
      }
      if (d.due && (!x.due || d.due < x.due)) x.due = d.due;
    }
  }
  return [...em.values()].sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.ten.localeCompare(b.ten, 'vi'));
}
