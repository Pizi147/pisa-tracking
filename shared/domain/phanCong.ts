/** PHÂN CÔNG (L3, MH6, T55, T56, M-09): ô nào có theo chương trình + luật kiểm TRƯỚC khi ghi. Web vẽ lỗi tại ô, máy chủ từ chối — cùng hàm. */
import { CHUONG_TRINH_KHONG_CHIA_MON, tenMonNgan } from './normal.ts';

export type OPhanCong = { khoa: string; skill: string | null; laGvcn: boolean; nhan: string };
export type SlotPhanCong = { userId: number; skill: string | null; isCore: boolean };
export type LoiPhanCong = { khoa: string; lyDo: string };

/** T56 (chủ sản phẩm 28/09): lớp không chia môn (Pre FOU) chỉ có MỘT ô — GVCN, và GVCN dạy luôn. */
const khongChiaMon = (ct: string | null) => CHUONG_TRINH_KHONG_CHIA_MON.includes(ct ?? '');

export function oPhanCong(chuongTrinh: string | null, kyNangLop: readonly string[]): OPhanCong[] {
  const gvcn: OPhanCong = { khoa: 'gvcn', skill: null, laGvcn: true, nhan: 'GVCN' };
  if (khongChiaMon(chuongTrinh)) return [gvcn];
  return [gvcn, ...kyNangLop.map((k) => ({ khoa: k, skill: k, laGvcn: false, nhan: tenMonNgan(chuongTrinh, k) }))];
}

/** Máy chủ gọi TRƯỚC khi kiểm + ghi: Pre FOU → GVCN tự nhận ô môn duy nhất (`tong_hop`), để quyền nhập điểm / xử lý Case
 *  đi theo phân công môn như mọi lớp (M-09) — không cần nhánh quyền riêng. Lớp khác: trả nguyên. */
export function moRongPhanCong(chuongTrinh: string | null, kyNangLop: readonly string[], slots: readonly SlotPhanCong[]): SlotPhanCong[] {
  if (!khongChiaMon(chuongTrinh)) return [...slots];
  const core = slots.filter((s) => s.isCore);
  return core.length === 1 ? [...core, ...kyNangLop.map((k) => ({ userId: core[0].userId, skill: k, isCore: false }))] : core;
}

export function kiemPhanCong(chuongTrinh: string | null, kyNangLop: readonly string[], slots: readonly SlotPhanCong[]): LoiPhanCong[] {
  const loi: LoiPhanCong[] = [];
  const gvcn = [...new Set(slots.filter((s) => s.isCore).map((s) => s.userId))];
  if (gvcn.length > 1) loi.push({ khoa: 'gvcn', lyDo: 'Chỉ chọn một GVCN' });
  const theoMon = new Map<string, Set<number>>();
  for (const s of slots) {
    if (s.isCore || !s.skill) continue;
    if (!kyNangLop.includes(s.skill)) { loi.push({ khoa: s.skill, lyDo: 'Lớp không có môn này' }); continue; }
    theoMon.set(s.skill, (theoMon.get(s.skill) ?? new Set<number>()).add(s.userId));
  }
  for (const [mon, nguoi] of theoMon) if (nguoi.size > 1) loi.push({ khoa: mon, lyDo: 'Mỗi môn một người' });
  if (khongChiaMon(chuongTrinh)) {
    if (slots.some((s) => !s.isCore && s.skill && s.userId !== gvcn[0])) loi.push({ khoa: 'gvcn', lyDo: 'Lớp Pre FOU chỉ có GVCN — GVCN dạy luôn' });
  } else if (gvcn.length === 1 && !slots.some((s) => !s.isCore && s.skill && s.userId === gvcn[0])) {
    loi.push({ khoa: 'gvcn', lyDo: 'GVCN phải dạy ít nhất một kỹ năng — chọn kỹ năng cho cô/thầy này' });
  }
  return [...loi.filter((l) => l.khoa === 'gvcn'), ...loi.filter((l) => l.khoa !== 'gvcn')];
}
