/**
 * PHÂN CÔNG GV CÓ HIỆU LỰC (PC-GV, đặc tả 2026-10-30-phan-cong-gv-design.md mục 2b): luật thuần — so hai bức tranh phân công theo Ô
 * (`gvcn` hoặc kỹ năng), áp các dòng đổi, đếm cho hai bảng tổng hợp, mốc xem tạm / hạn bàn giao. Máy chủ và web dùng chung (một nguồn).
 */
import { hanTheoNgay } from './cases.ts';
import { CHUONG_TRINH_KHONG_CHIA_MON, kyNangPhuTrach } from './normal.ts';
import { gopChonSau409, kiemPhanCong, moRongPhanCong, oPhanCong, type LoiPhanCong, type OPhanCong, type SlotPhanCong } from './phanCong.ts';
import { soSanhLop } from './tenLop.ts';
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
/** `banGiao`: việc bàn giao đang mở của dòng chờ — `du`/`tong` em đã viết đủ (chỉ góc Phân công GV gắn; nơi khác bỏ trống). */
export type DoiChoPc = { id: number; khoa: string; nguoiCu: number | null; nguoiMoi: number | null; hieuLuc: string; loi: string | null;
  banGiao?: { id: number; du: number; tong: number; han: string } | null };
export type LopPc = {
  id: number; code: string; ct: string | null; ft: boolean; route: string | null; soHv: number; tuan: { n: number; tong: number } | null;
  kyNang: string[]; slots: SlotPhanCong[]; phienBan: string; cho: DoiChoPc[];
};
/** `nghi`: tài khoản xoá / hết mọi vai · `ngoai-cn`: còn vai ở chi nhánh khác — cả hai chặn Lưu dòng đang giữ ô của người đó. */
export type GvPc = { id: number; ten: string; kyNang: string[]; nghi: 'nghi' | 'ngoai-cn' | null };
export type TrangPhanCongGv = { chiNhanh: { id: number; code: string } | null; canChonChiNhanh: boolean; sua: boolean; homNay: string; lop: LopPc[]; gv: GvPc[] };
export type CapXemTruoc = DoiO & { nhan: string; soCase: number; soPa: number; nguoiViet: { loai: 'gv-cu' | 'gvcn' | 'ql'; id: number | null } };
export type XemTruocLuu = { lop: { classId: number; code: string; soEm: number; cap: CapXemTruoc[] }[] };

/* ================= PC-GV-C · góc Phân công GV (web) — hàm thuần, kiểm ở `prGocPhanCong.tests.ts` ================= */

/** Nháp của một dòng lớp: ô (`gvcn` | kỹ năng) → người (`''` = Chưa có). */
export type ChonDongPc = Record<string, number | ''>;

const boDauPc = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
const laMonLop = (l: LopPc, s: SlotPhanCong) => !s.isCore && !!s.skill && l.kyNang.includes(s.skill);

/** Các ô của một dòng: `gvcn` + mỗi kỹ năng (Pre FOU chỉ `gvcn` — ô `tong_hop` đi theo GVCN). */
export const oDongPc = (l: LopPc): string[] => oCua(l.ct, l.kyNang);

/** Bức tranh đang chạy của dòng theo ô (người đầu tiên mỗi ô; dữ liệu cũ nhiều người một ô — Lưu sẽ giữ đúng người đang hiện). */
export function chonCuaLop(l: LopPc): ChonDongPc {
  const c: ChonDongPc = {};
  for (const k of oDongPc(l)) c[k] = l.slots.find((s) => khoaCua(s) === k && (k === 'gvcn' || laMonLop(l, s)))?.userId ?? '';
  return c;
}

/** Nháp → dòng phân công gửi máy chủ (Pre FOU: chỉ GVCN, máy chủ `moRongPhanCong`). Dòng môn gộp cũ không gửi — `ghiPhanCong` tự giữ. */
export function slotsDongPc(l: LopPc, chon: ChonDongPc): SlotPhanCong[] {
  return oDongPc(l).flatMap((k): SlotPhanCong[] => {
    const u = chon[k];
    if (!u) return [];
    return [k === 'gvcn' ? { userId: Number(u), skill: null, isCore: true } : { userId: Number(u), skill: k, isCore: false }];
  });
}

/** Bản gốc của một dòng nháp: phiên bản + bức tranh lúc dòng vào nháp. Lưu gửi phiên bản NÀY (không phải bản đang tải). */
export type GocNhapPc = { phienBan: string; goc: ChonDongPc };

/**
 * Bản mới của lớp về (tải lại sau lưu dòng khác / Hoàn tác / Chờ đổi / 409) khi dòng còn nháp: cùng phiên bản → null (không làm gì).
 * Khác → gộp ba bản như 409 (`gopChonSau409`): ô đã sửa giữ, ô chưa sửa theo bản mới — không trả lại thay đổi của người khác.
 * `khac` = ô người khác vừa đổi; `chon` null khi nháp sau gộp trùng bản mới (hết nháp, không còn "Nháp · 0 ô đổi").
 */
export function gopNhapBanMoi(nho: GocNhapPc, l: LopPc, nhap: ChonDongPc): { chon: ChonDongPc | null; khac: string[]; nho: GocNhapPc } | null {
  if (l.phienBan === nho.phienBan) return null;
  const m = chonCuaLop(l);
  const { chon } = gopChonSau409(nho.goc, m, nhap);
  const khac = oDongPc(l).filter((k) => (m[k] ?? '') !== (nho.goc[k] ?? ''));
  const conNhap = oDongPc(l).some((k) => (chon[k] ?? '') !== (m[k] ?? ''));
  return { chon: conNhap ? chon : null, khac, nho: { phienBan: l.phienBan, goc: m } };
}

/** Ô thiếu GV ("Thiếu GV · n ô"): ô Chưa có + ô của người không còn là ứng viên (`nghi` / `ngoai-cn`). */
export function oThieuLop(l: LopPc, gv: readonly GvPc[]): number {
  const nghi = new Set(gv.filter((g) => g.nghi).map((g) => g.id));
  const c = chonCuaLop(l);
  return oDongPc(l).filter((k) => !c[k] || nghi.has(Number(c[k]))).length;
}
export const oThieuPc = (lop: readonly LopPc[], gv: readonly GvPc[]): number => lop.reduce((n, l) => n + oThieuLop(l, gv), 0);

/**
 * Lọc bảng lớp: khung (FT / lớp thường) · tìm mã lớp hoặc tên GV có ô ở lớp (không dấu) · "Thiếu GV". Dòng ghim (đang có nháp) LUÔN còn —
 * lọc / tìm không làm mất ô đang sửa.
 */
export function locLopPc(lop: readonly LopPc[], gv: readonly GvPc[], o: { q: string; khung: string; thieu: boolean; ghim: ReadonlySet<number> }): LopPc[] {
  const q = boDauPc(o.q);
  const ten = new Map(gv.map((g) => [g.id, boDauPc(g.ten)]));
  return lop.filter((l) => o.ghim.has(l.id) || (
    (o.khung !== 'ft' || l.ft) && (o.khung !== 'thuong' || !l.ft)
    && (!o.thieu || oThieuLop(l, gv) > 0)
    && (!q || boDauPc(l.code).includes(q) || l.slots.some((s) => ten.get(s.userId)?.includes(q)))));
}

const THU_TU_CT = ['FOU', 'BE', 'ELE', 'PET', 'KET', 'PREFOU'];
const TEN_CT: Record<string, string> = {
  FOU: 'Foundation', BE: 'Beginner', ELE: 'Elementary', PET: 'Preliminary English Test', KET: 'Key English Test', PREFOU: 'Pre Foundation',
};
/** Nhóm bảng lớp: Fast Track rồi lớp thường theo chương trình (FOU · BE · ELE · PET · KET · Pre FOU, còn lại theo mã); trong nhóm `soSanhLop`. */
export function nhomLopPc(lop: readonly LopPc[]): { ft: LopPc[]; thuong: { ct: string; ten: string; lop: LopPc[] }[] } {
  const xep = (ds: LopPc[]) => ds.sort((a, b) => soSanhLop(a, b));
  const theoCt = new Map<string, LopPc[]>();
  for (const l of lop) if (!l.ft) theoCt.set(l.ct ?? '', [...(theoCt.get(l.ct ?? '') ?? []), l]);
  const bac = (ct: string) => (THU_TU_CT.includes(ct) ? THU_TU_CT.indexOf(ct) : THU_TU_CT.length);
  return {
    ft: xep(lop.filter((l) => l.ft)),
    thuong: [...theoCt].sort(([a], [b]) => bac(a) - bac(b) || a.localeCompare(b)).map(([ct, ds]) => ({ ct, ten: TEN_CT[ct] ?? ct, lop: xep(ds) })),
  };
}

/** Cột môn của dòng (bỏ GVCN — luôn cột cuối), đệm `null` tới 5 ô; Pre FOU `[]` → "Không chia môn — GVCN dạy luôn". */
export function cotLop(l: Pick<LopPc, 'ct' | 'kyNang'>): (OPhanCong | null)[] {
  const mon = oPhanCong(l.ct, l.kyNang).filter((o) => !o.laGvcn);
  if (!mon.length) return [];
  return [...mon, ...Array<null>(Math.max(0, 5 - mon.length)).fill(null)];
}

/** Một dòng bảng tổng hợp. `cn` bỏ người đã nghỉ không còn lớp; còn lại mọi GV (kể cả 0 — thấy người đang trống). */
export type HangTongHopPc = { id: number; ten: string; nghi: boolean; a: number; b: number; tong: number };
export function hangTongHop(dem: ReadonlyMap<number, DemGv>, gv: readonly GvPc[], loai: 'day' | 'cn', xep: 'tong' | 'ft' | 'th' | 'ten'): HangTongHopPc[] {
  const rows = gv.map((g) => {
    const d = dem.get(g.id) ?? { ft: 0, th: 0, cnFt: 0, cnTh: 0 };
    const [a, b] = loai === 'day' ? [d.ft, d.th] : [d.cnFt, d.cnTh];
    return { id: g.id, ten: g.ten, nghi: g.nghi !== null, a, b, tong: a + b };
  }).filter((r) => loai === 'day' || r.tong > 0 || !r.nghi);
  const k = (r: HangTongHopPc) => (xep === 'ft' ? r.a : xep === 'th' ? r.b : xep === 'tong' ? r.tong : 0);
  return rows.sort((p, q) => k(q) - k(p) || p.ten.localeCompare(q.ten, 'vi'));
}

/**
 * Lỗi của một dòng NHÁP (chỉ gọi cho dòng đang sửa — dòng không ai sửa không bị chặn): ba luật `kiemPhanCong` (cùng hàm máy chủ) trên bức tranh
 * dòng + ô còn người không còn là ứng viên (`nghi` / `ngoai-cn`, cùng câu máy chủ).
 */
export function kiemDongPc(l: LopPc, chon: ChonDongPc, gv: readonly GvPc[]): LoiPhanCong[] {
  const nghi = new Map(gv.filter((g) => g.nghi).map((g) => [g.id, g.nghi]));
  const loi: LoiPhanCong[] = oDongPc(l).flatMap((k) => {
    const n = chon[k] ? nghi.get(Number(chon[k])) : undefined;
    if (!n) return [];
    return [{ khoa: k, lyDo: n === 'nghi' ? 'Đã nghỉ — chọn người thay hoặc Bỏ trống' : 'Người này không có vai trò giảng dạy ở chi nhánh của lớp.' }];
  });
  const da = new Set(loi.map((x) => x.khoa));
  return [...loi, ...kiemPhanCong(l.ct, l.kyNang, moRongPhanCong(l.ct, l.kyNang, slotsDongPc(l, chon))).filter((x) => !da.has(x.khoa))];
}

/** Bức tranh sau nháp (đếm "cũ → mới"): dòng có nháp thay `slots` bằng nháp (đã `moRongPhanCong`); dòng khác giữ. */
export function lopSauNhap(lop: readonly LopPc[], nhap: Readonly<Record<number, ChonDongPc>>): LopPc[] {
  return lop.map((l) => (nhap[l.id] ? { ...l, slots: moRongPhanCong(l.ct, l.kyNang, slotsDongPc(l, nhap[l.id])) } : l));
}
/** Kết quả `POST /phan-cong/luu` (máy chủ `KetQuaLuu`): `lo` = khoá Hoàn tác; mỗi lớp `cho` = lịch đổi tương lai (chưa áp). */
export type KetQuaLuuPc = { lo: number | null; lop: { classId: number; cho: boolean; soO: number; phienBan: string }[] };

/** 375 (mockup v9 khu 1): mỗi nhóm thẻ hiện `toiDa` thẻ đầu + mọi thẻ ghim (ô thiếu / nháp / chờ đổi / đang sửa); còn lại gom "… n lớp nữa". */
export function rutGonThe<T>(ds: readonly T[], ghim: (x: T) => boolean, toiDa = 3): { hien: T[]; con: number } {
  const hien = ds.filter((x, i) => i < toiDa || ghim(x));
  return { hien, con: ds.length - hien.length };
}
