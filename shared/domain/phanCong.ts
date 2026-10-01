/** PHÂN CÔNG (L3, MH6, T55, T56, M-09): ô nào có theo chương trình + luật kiểm TRƯỚC khi ghi. Web vẽ lỗi tại ô, máy chủ từ chối — cùng hàm. */
import { CHUONG_TRINH_KHONG_CHIA_MON, kyNangGoiY, programmeOf, tenMonNgan } from './normal.ts';

/** `gop`: ô GỘP nhiều môn một người (Q31-5, FOU "L · R · G+V") — web trải thành một dòng mỗi môn (`slotsTuO`), máy chủ nhận dạng cũ. */
export type OPhanCong = { khoa: string; skill: string | null; laGvcn: boolean; nhan: string; gop?: readonly string[] };
export type SlotPhanCong = { userId: number; skill: string | null; isCore: boolean };
export type LoiPhanCong = { khoa: string; lyDo: string };

/** T56 (chủ sản phẩm 28/09): lớp không chia môn (Pre FOU) chỉ có MỘT ô — GVCN, và GVCN dạy luôn. */
const khongChiaMon = (ct: string | null) => CHUONG_TRINH_KHONG_CHIA_MON.includes(ct ?? '');

/** Q31-5: lớp FOU thường hai giáo viên — một người L · R · G+V, một người P. */
const GOP_FOU: readonly string[] = ['listening', 'reading', 'writing'];

/**
 * Ô phân công theo chương trình. Q31-5: `{ tach: false }` + lớp FOU → 2 ô môn "L · R · G+V" và "P"; KHÔNG truyền `tach` = mỗi môn một ô
 * như cũ (máy chủ, Danh mục, phép kiểm cũ). Chương trình khác bỏ qua `tach`.
 */
export function oPhanCong(chuongTrinh: string | null, kyNangLop: readonly string[], o: { tach?: boolean } = {}): OPhanCong[] {
  const gvcn: OPhanCong = { khoa: 'gvcn', skill: null, laGvcn: true, nhan: 'GVCN' };
  if (khongChiaMon(chuongTrinh)) return [gvcn];
  const mon: OPhanCong[] = kyNangLop.map((k) => ({ khoa: k, skill: k, laGvcn: false, nhan: tenMonNgan(chuongTrinh, k) }));
  const gop = o.tach === false && programmeOf(chuongTrinh) === 'FOU' ? GOP_FOU.filter((k) => kyNangLop.includes(k)) : [];
  if (gop.length < 2) return [gvcn, ...mon];
  const oGop: OPhanCong = { khoa: 'gop-fou', skill: null, laGvcn: false, nhan: gop.map((k) => tenMonNgan(chuongTrinh, k)).join(' · '), gop };
  return [gvcn, oGop, ...mon.filter((m) => !gop.includes(m.khoa))];
}

/** Người chọn ở từng ô → dòng phân công máy chủ nhận: ô gộp trải thành một dòng mỗi môn (Q31-5). */
export function slotsTuO(oList: readonly OPhanCong[], chon: Record<string, number | ''>): SlotPhanCong[] {
  return oList.flatMap((o): SlotPhanCong[] => {
    const u = chon[o.khoa];
    if (!u) return [];
    return o.laGvcn ? [{ userId: Number(u), skill: null, isCore: true }] : (o.gop ?? [o.skill!]).map((skill) => ({ userId: Number(u), skill, isCore: false }));
  });
}

/**
 * Lớp FOU phải mở sẵn TÁCH khi L, R, G+V đang do nhiều người dạy, HOẶC có môn gộp đã có người và có môn gộp còn trống (PR-S6F-a Q3) —
 * mở gộp lúc đó thì lưu sẽ trải ô gộp ra cả môn trống (tự gán G+V cho người dạy L, R mà Quản lý không chọn). Cả ba trống / cùng một người → gộp.
 */
export function nenTachFou(chuongTrinh: string | null, bySkill: readonly { skill: string; userId: number }[]): boolean {
  if (programmeOf(chuongTrinh) !== 'FOU') return false;
  const gop = bySkill.filter((s) => GOP_FOU.includes(s.skill));
  const mon = new Set(gop.map((s) => s.skill));
  return new Set(gop.map((s) => s.userId)).size > 1 || (mon.size > 0 && mon.size < GOP_FOU.length);
}

/** Dòng gợi ý "dạy được …" của một ứng viên ở ô `o`: môn CỦA LỚP mà người đó khai hợp, viết theo chương trình lớp (FOU "L, R, G+V" / "P"). */
export function nhanDayDuoc(chuongTrinh: string | null, o: OPhanCong, kyNangKhai: readonly string[]): string[] {
  return (o.gop ?? (o.skill ? [o.skill] : []))
    .filter((k) => kyNangGoiY(chuongTrinh, k).some((x) => kyNangKhai.includes(x)))
    .map((k) => tenMonNgan(chuongTrinh, k));
}

/** Đổi lưới gộp ↔ tách mà giữ người đã chọn: tách → mỗi môn nhận người của ô gộp; gộp → ô gộp nhận người của môn đầu tiên đã chọn. */
export function chonKhiDoiTach(chon: Record<string, number | ''>, gop: readonly string[], tach: boolean): Record<string, number | ''> {
  const c = { ...chon };
  if (tach) {
    const u = c['gop-fou'];
    delete c['gop-fou'];
    if (u) for (const k of gop) c[k] = u;
  } else {
    const u = gop.map((k) => c[k]).find(Boolean);
    for (const k of gop) delete c[k];
    if (u) c['gop-fou'] = u;
  }
  return c;
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
