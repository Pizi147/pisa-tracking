/**
 * LUẬT THUẦN CỦA HỒ SƠ GIÁO VIÊN (PR-GV, kế hoạch 2026-09-30-pr-gv-ho-so-giao-vien Q2–Q4, Q11).
 * Không tính số mới: số luôn đến từ hàm có sẵn ở máy chủ (`myWork`, `scoreDebtCells`, `listCases`, `phanTichLop`).
 */
import { DUONG_TAB_CONG_VIEC } from './dieuHuong.ts';
import { NHOM_VIEC, nhomViecCua, type NhomViec } from './tongQuan.ts';

/** Ô bấm được ở hồ sơ GV / bảng GV chi nhánh (Q2, Q11). Mỗi ô một hàm tập ở server/src/giaoVien/hoSo.ts. */
export const COT_O_GV = ['lop', 'hoc-vien', 'chua-nhap', 'qua-han', 'case-mo', 'case-qua-han', 'yc-cho', 'yc-tu-choi', 'ket-qua'] as const;
export type CotOGv = (typeof COT_O_GV)[number];
export const laCotOGv = (s: unknown): s is CotOGv => (COT_O_GV as readonly unknown[]).includes(s);

/** Q31-6: vai ở một lớp là MỘT chip — "GVCN · L R G+V", "P", "GVCN". `mon` là tên môn ngắn theo chương trình, đúng thứ tự môn. */
export function nhanVaiLop(v: { gvcn: boolean; mon: readonly string[] }): string {
  return [v.gvcn ? 'GVCN' : '', v.mon.join(' ')].filter(Boolean).join(' · ');
}

/** O6: chip "Bàn giao n/m em" cạnh mã lớp — từ `viecBanGiao` (cùng nguồn việc Bàn giao ở Công việc). `mon` = tên môn ngắn (GVBM); `maMon` = mã môn đầu còn thiếu (link `&mon=`). */
export type ChipBanGiao = { loai: 'gvcn' | 'gvbm'; mon: string | null; maMon: string | null; da: number; n: number };

/** Đếm việc theo 4 nhóm (Q3) — cùng `nhomViecCua` với Công việc, nên số = số dòng ở Công việc đã lọc nhóm. */
export function demViecTheoNhom(items: readonly { group: string; urgency: string }[]): { nhom: NhomViec; n: number; quaHan: number }[] {
  return NHOM_VIEC.map((nhom) => {
    const ds = items.filter((i) => nhomViecCua(i.group) === nhom);
    return { nhom, n: ds.length, quaHan: ds.filter((i) => i.urgency === 'overdue').length };
  });
}

/**
 * Đường tới Công việc đã lọc đúng người + nhóm (Q4). `khung=tat-ca` để lựa chọn khung đã nhớ không làm lệch số.
 * Tab Việc học viên là `/cong-viec` (không có đoạn `/ho-tro` — đoạn đó bị trang chuyển về `/cong-viec` và mất bộ lọc).
 */
export function duongViecCuaGv(gvId: number, nguoiXem: { userId: number; laQuanLy: boolean }, nhom: NhomViec | null, chiQuaHan = false): string {
  const q = new URLSearchParams();
  if (nguoiXem.laQuanLy) q.set('nguoi', gvId === nguoiXem.userId ? 'toi' : String(gvId));
  if (nhom) q.set('nhom', nhom);
  q.set('khung', 'tat-ca');
  if (chiQuaHan) q.set('loc', 'qua-han');
  return `${DUONG_TAB_CONG_VIEC['ho-tro']}?${q}`;
}

/** PR-S6F-b: link "Hiệu quả PA của …" ở hồ sơ GV mang khung — GV chỉ dạy lớp thường mở khung Lớp thường (không rơi về bảng FT trống). */
export function duongHieuQuaPaGv(cn: number, gvId: number, lop: readonly { khung: 'ft' | 'thuong' }[]): string {
  const ct = lop.length && lop.every((l) => l.khung === 'thuong') ? 'thuong' : 'ft';
  return `/phan-tich?goc=hieu-qua-pa&cn=${cn}&ct=${ct}&gv=${gvId}`;
}
