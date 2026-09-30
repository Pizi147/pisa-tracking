/**
 * LUẬT THUẦN CỦA HỒ SƠ GIÁO VIÊN (PR-GV, kế hoạch 2026-09-30-pr-gv-ho-so-giao-vien Q2–Q4, Q11).
 * Không tính số mới: số luôn đến từ hàm có sẵn ở máy chủ (`myWork`, `scoreDebtCells`, `listCases`, `phanTichLop`).
 */
import { NHOM_VIEC, nhomViecCua, type NhomViec } from './tongQuan.ts';

/** Ô bấm được ở hồ sơ GV / bảng GV chi nhánh (Q2, Q11). Mỗi ô một hàm tập ở server/src/giaoVien/hoSo.ts. */
export const COT_O_GV = ['lop', 'hoc-vien', 'chua-nhap', 'qua-han', 'case-mo', 'case-qua-han', 'yc-cho', 'yc-tu-choi', 'ket-qua'] as const;
export type CotOGv = (typeof COT_O_GV)[number];
export const laCotOGv = (s: unknown): s is CotOGv => (COT_O_GV as readonly unknown[]).includes(s);

/** Đếm việc theo 4 nhóm (Q3) — cùng `nhomViecCua` với Công việc, nên số = số dòng ở Công việc đã lọc nhóm. */
export function demViecTheoNhom(items: readonly { group: string; urgency: string }[]): { nhom: NhomViec; n: number; quaHan: number }[] {
  return NHOM_VIEC.map((nhom) => {
    const ds = items.filter((i) => nhomViecCua(i.group) === nhom);
    return { nhom, n: ds.length, quaHan: ds.filter((i) => i.urgency === 'overdue').length };
  });
}

/** Đường tới Công việc đã lọc đúng người + nhóm (Q4). `khung=tat-ca` để lựa chọn khung đã nhớ không làm lệch số. */
export function duongViecCuaGv(gvId: number, nguoiXem: { userId: number; laQuanLy: boolean }, nhom: NhomViec | null, chiQuaHan = false): string {
  const q = new URLSearchParams();
  if (nguoiXem.laQuanLy) q.set('nguoi', gvId === nguoiXem.userId ? 'toi' : String(gvId));
  if (nhom) q.set('nhom', nhom);
  q.set('khung', 'tat-ca');
  if (chiQuaHan) q.set('loc', 'qua-han');
  return `/cong-viec/ho-tro?${q}`;
}
