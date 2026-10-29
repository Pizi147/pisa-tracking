/**
 * PHÂN CÔNG GV CÓ HIỆU LỰC (PC-GV, đặc tả 2026-10-30-phan-cong-gv-design.md mục 2b): luật thuần — so hai bức tranh phân công theo Ô
 * (`gvcn` hoặc kỹ năng), áp các dòng đổi, đếm cho hai bảng tổng hợp, mốc xem tạm / hạn bàn giao. Máy chủ và web dùng chung (một nguồn).
 */
import { hanTheoNgay } from './cases.ts';
import { CHUONG_TRINH_KHONG_CHIA_MON, kyNangPhuTrach } from './normal.ts';
import type { SlotPhanCong } from './phanCong.ts';
import { addDaysIso } from './sos.ts';

/** Một ô đổi người. `khoa` = 'gvcn' | kỹ năng của lớp. `null` = ô trống (Chưa có). */
export type DoiO = { khoa: string; nguoiCu: number | null; nguoiMoi: number | null };

const khongChiaMon = (ct: string | null) => CHUONG_TRINH_KHONG_CHIA_MON.includes(ct ?? '');
const khoaCua = (s: SlotPhanCong) => (s.isCore ? 'gvcn' : s.skill ?? '');
/** Ô so được: GVCN + môn của lớp. Pre FOU chỉ ô GVCN (`tong_hop` đi theo GVCN). Dòng môn gộp cũ (L+S, R+W) không là ô — `ghiPhanCong` tự giữ. */
const oCua = (ct: string | null, kyNangLop: readonly string[]) => (khongChiaMon(ct) ? ['gvcn'] : ['gvcn', ...kyNangLop]);

/**
 * Các ô đổi người giữa bức tranh `cu` (đang chạy) và `moi` (gửi lên). Dữ liệu cũ nhiều người một ô → mỗi người cũ một dòng (cùng người mới).
 * Ô không đổi người → không có dòng.
 */
export function doiTheoO(ct: string | null, kyNangLop: readonly string[], cu: readonly SlotPhanCong[], moi: readonly SlotPhanCong[]): DoiO[] {
  const doi: DoiO[] = [];
  for (const khoa of oCua(ct, kyNangLop)) {
    const a = [...new Set(cu.filter((s) => khoaCua(s) === khoa).map((s) => s.userId))];
    const b = [...new Set(moi.filter((s) => khoaCua(s) === khoa).map((s) => s.userId))];
    const nguoiMoi = b[0] ?? null;
    if (a.length === b.length && a.every((x) => b.includes(x))) continue;
    const roi = a.filter((x) => x !== nguoiMoi);
    if (!roi.length) doi.push({ khoa, nguoiCu: null, nguoiMoi });
    for (const x of roi) doi.push({ khoa, nguoiCu: x, nguoiMoi });
  }
  return doi;
}

/**
 * Bức tranh sau khi áp `doi` lên `cu` (chưa `moRongPhanCong`). Chỉ giữ ô GVCN + môn của lớp — dòng môn gộp cũ / môn đã bỏ khỏi chương trình
 * không gửi lại, đúng như web gửi (`ghiPhanCong` giữ môn gộp còn cần, kết thúc phần còn lại).
 */
export function apDoi(cu: readonly SlotPhanCong[], doi: readonly DoiO[], kyNangLop?: readonly string[]): SlotPhanCong[] {
  let ds = cu.filter((s) => s.isCore || !kyNangLop || kyNangLop.includes(s.skill ?? ''));
  for (const d of doi) {
    if (d.nguoiCu !== null) ds = ds.filter((s) => !(khoaCua(s) === d.khoa && s.userId === d.nguoiCu));
    if (d.nguoiMoi !== null && !ds.some((s) => khoaCua(s) === d.khoa && s.userId === d.nguoiMoi)) {
      ds.push(d.khoa === 'gvcn' ? { userId: d.nguoiMoi, skill: null, isCore: true } : { userId: d.nguoiMoi, skill: d.khoa, isCore: false });
    }
  }
  return ds;
}

/** Cặp có người giao và người nhận khác nhau — mới có Case / PA chuyển và việc bàn giao. Bỏ người / Chưa có → B: không. */
export const laCapBanGiao = (d: DoiO) => d.nguoiCu !== null && d.nguoiMoi !== null && d.nguoiCu !== d.nguoiMoi;

/**
 * Case (kỹ năng `caseSkill`, null = không kỹ năng) thuộc ô đổi không. Ô môn → kỹ năng Case nằm trong phần ô đó phụ trách.
 * Ô GVCN → Case không kỹ năng, hoặc kỹ năng mà GV cũ KHÔNG còn dạy ở lớp sau đổi (`conDay`) — GV cũ giữ Case đó vì là GVCN.
 */
export function caseThuocO(ct: string | null, khoa: string, conDay: ReadonlySet<string>, caseSkill: string | null): boolean {
  if (khoa === 'gvcn') return caseSkill === null || !conDay.has(caseSkill);
  return caseSkill !== null && kyNangPhuTrach(ct, khoa).includes(caseSkill);
}

/** Đếm hai bảng tổng hợp: Giảng dạy theo kỹ năng (W1, W2 riêng; Pre FOU `tong_hop` = 1) · GVCN theo lớp. */
export type DemGv = { ft: number; th: number; cnFt: number; cnTh: number };
export function demPhanCong(lop: readonly { ft: boolean; slots: readonly SlotPhanCong[] }[]): Map<number, DemGv> {
  const m = new Map<number, DemGv>();
  for (const l of lop) {
    for (const s of l.slots) {
      const d = m.get(s.userId) ?? { ft: 0, th: 0, cnFt: 0, cnTh: 0 };
      if (s.isCore) { if (l.ft) d.cnFt += 1; else d.cnTh += 1; } else if (l.ft) d.ft += 1; else d.th += 1;
      m.set(s.userId, d);
    }
  }
  return m;
}

/** Hạn việc bàn giao: 5 ngày tính cả ngày tạo (hàm chung). GV cũ xem lớp cũ tối thiểu 7 ngày từ hiệu lực. */
export const HAN_BAN_GIAO_GV_NGAY = 5;
export const XEM_TAM_NGAY = 7;
export const hanBanGiaoGv = (ngayTao: string) => hanTheoNgay(ngayTao, HAN_BAN_GIAO_GV_NGAY);
export const xemDen = (hieuLuc: string) => addDaysIso(hieuLuc, XEM_TAM_NGAY);

/** Ai viết phiếu bàn giao: GV cũ; GV cũ đã nghỉ → GVCN lớp; chính GVCN nghỉ (hoặc lớp không GVCN) → QL chi nhánh (`id` null). */
export function nguoiVietBanGiao(o: { cuNghi: boolean; nguoiCu: number; gvcn: number | null; gvcnNghi: boolean }): { loai: 'gv-cu' | 'gvcn' | 'ql'; id: number | null } {
  if (!o.cuNghi) return { loai: 'gv-cu', id: o.nguoiCu };
  if (o.gvcn !== null && o.gvcn !== o.nguoiCu && !o.gvcnNghi) return { loai: 'gvcn', id: o.gvcn };
  return { loai: 'ql', id: null };
}

export type HieuLucVao = { loai: 'hom-nay' } | { loai: 'tuan'; tuanId: number };
export type DoiChoPc = { id: number; khoa: string; nguoiCu: number | null; nguoiMoi: number | null; hieuLuc: string; loi: string | null };
export type LopPc = {
  id: number; code: string; ct: string | null; ft: boolean; route: string | null; soHv: number; tuan: { n: number; tong: number } | null;
  kyNang: string[]; slots: SlotPhanCong[]; phienBan: string; cho: DoiChoPc[];
};
/** `nghi`: tài khoản xoá / hết mọi vai · `ngoai-cn`: còn vai ở chi nhánh khác — cả hai chặn Lưu dòng đang giữ ô của người đó. */
export type GvPc = { id: number; ten: string; kyNang: string[]; nghi: 'nghi' | 'ngoai-cn' | null };
export type TrangPhanCongGv = { chiNhanh: { id: number; code: string } | null; canChonChiNhanh: boolean; sua: boolean; homNay: string; lop: LopPc[]; gv: GvPc[] };
export type CapXemTruoc = DoiO & { nhan: string; soCase: number; soPa: number; nguoiViet: { loai: 'gv-cu' | 'gvcn' | 'ql'; id: number | null } };
export type XemTruocLuu = { lop: { classId: number; code: string; soEm: number; cap: CapXemTruoc[] }[] };
