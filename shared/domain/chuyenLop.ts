/**
 * LỆNH CHUYỂN LỚP + BÀN GIAO — luật thuần (PR-CT, đặc tả §3.1f Q30-1…Q30-4, mockup 20).
 *
 * Quản lý ra lệnh: em nào, lớp chuyển đến nào, tuần bắt đầu (Thứ Hai, từ tuần sau trở đi). Tới Thứ Hai đó web tự thi hành
 * bằng luật lộ trình đang có (`lenLop.ts`). Có lệnh → phiếu bàn giao: GVBM ghi một câu mỗi em (hạn 2 ngày), GVCN lớp
 * cũ xác nhận (hạn 3 ngày, tính cả ngày ra lệnh). Một nguồn cho máy chủ và web.
 */
import { hanTheoNgay } from './cases.ts';
import type { HuongGoiY } from './cuoiKhoa.ts';
import { NORMAL_LADDER } from './fasttrack.ts';
import type { Huong } from './lenLop.ts';
import type { ProgrammeCode } from './normal.ts';
import { tuanLich } from './hienThiNgay.ts';
import { mondayOfDate } from './week.ts';
import { kyHieuLop } from './tenLop.ts';

/**
 * PR-S3 (chủ sản phẩm 02/10): bộ chữ chuyển lớp — MỘT nơi. Quyết định của Quản lý (6 hướng) gọi là "Quyết định chuyển lớp"; chữ "lệnh"
 * không còn trên màn. Ba trạng thái tách rõ: `chua` (chưa ai quyết) · `choDuyetDeXuat` (GV đã đề xuất, Quản lý chưa duyệt) ·
 * `sapChuyen(tuần)` (đã có quyết định, chưa tới tuần chuyển). Bàn giao luôn là "GVCN xác nhận bàn giao".
 * Định danh (bảng `lenh_chuyen_lop`, route `/lenh-chuyen`, khoá nhật ký `lenh_chuyen.*`) KHÔNG đổi.
 */
export const CHU_CHUYEN_LOP = {
  quyetDinh: 'Quyết định chuyển lớp',
  sua: 'Sửa quyết định…',
  huy: 'Huỷ quyết định',
  giu: 'Giữ quyết định',
  luu: 'Lưu quyết định',
  chua: 'Chưa có quyết định chuyển lớp',
  choDuyetDeXuat: 'Chờ QL duyệt đề xuất',
  sapChuyen: (tuan: string) => `Sắp chuyển · từ ${tuan}`,
  banGiao: 'GVCN xác nhận bàn giao',
} as const;

export const HUONG_LENH = ['len_lop', 'hoc_lai', 'fast_track', 'chuyen_lop', 'bao_luu', 'dung_hoc'] as const;
export type HuongLenh = (typeof HUONG_LENH)[number];
export type TrangThaiLenh = 'cho' | 'da_chuyen' | 'huy';
export const NHAN_XET_TOI_THIEU = 15;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const congNgay = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Thứ Hai hợp lệ để bắt đầu: > Thứ Hai tuần này (không bao giờ tuần hiện tại, Q5). Trả `n` tuần kế tiếp cho ô chọn — nhãn qua `tuanLich`. */
export function tuanChonDuoc(homNay: string, n = 6): string[] {
  const dau = mondayOfDate(homNay);
  return Array.from({ length: n }, (_, i) => congNgay(dau, 7 * (i + 1)));
}

export function tuanHopLe(tuan: string | null | undefined, homNay: string): boolean {
  return !!tuan && ISO.test(tuan) && !Number.isNaN(Date.parse(tuan)) && mondayOfDate(tuan) === tuan && tuan > mondayOfDate(homNay);
}

/** Hạn bàn giao tính cả ngày ra lệnh (T66): GVBM 2 ngày, GVCN 3 ngày. */
export function hanBanGiao(ngayRaLenh: string): { gvbm: string; gvcn: string } {
  return { gvbm: hanTheoNgay(ngayRaLenh, 2), gvcn: hanTheoNgay(ngayRaLenh, 3) };
}

/**
 * OV-3b (đặc tả §3.1): mốc Lộ trình tiếp theo của lớp thường theo tuần Final (thứ Hai). Nhắc từ thứ Hai tuần Final − 2 · QL chốt trước hết
 * Chủ nhật tuần Final − 2 · GV bàn giao trước hết Chủ nhật tuần Final. Final tuần 10 → nhắc từ tuần 8, chốt hết tuần 8, bàn giao hết tuần 10.
 */
export function mocLoTrinh(tuanFinal: string): { nhacTu: string; hanChot: string; hanBanGiao: string } {
  const t = mondayOfDate(tuanFinal.slice(0, 10));
  return { nhacTu: congNgay(t, -14), hanChot: congNgay(t, -8), hanBanGiao: congNgay(t, 6) };
}

/**
 * Hạn bàn giao của MỘT lệnh, máy chủ + web cùng hàm. Lớp FT: 5 ngày tính cả ngày ra lệnh (GVBM = GVCN). Lớp thường Cuối khoá: hết tuần Final
 * và ít nhất 2 ngày sau ngày chốt (GVBM = GVCN). Còn lại (giữa khoá lớp thường, lớp không có tuần Final): 2 / 3 ngày như cũ.
 */
export function hanBanGiaoLenh(o: { nguonFt: boolean; boiCanh: string; tuanFinal: string | null; ngay: string }): { gvbm: string; gvcn: string } {
  if (o.nguonFt) { const h = hanTheoNgay(o.ngay, 5); return { gvbm: h, gvcn: h }; }
  if (o.boiCanh !== 'cuoi-khoa' || !o.tuanFinal) return hanBanGiao(o.ngay);
  const toiThieu = congNgay(o.ngay, 2), cuoi = mocLoTrinh(o.tuanFinal).hanBanGiao;
  const h = toiThieu > cuoi ? toiThieu : cuoi;
  return { gvbm: h, gvcn: h };
}

/** Mọi hướng có phiếu bàn giao trừ Dừng học hẳn (Q16). */
export const coPhieu = (h: HuongLenh): boolean => h !== 'dung_hoc';
/** OV-3b: bảng theo hướng của cách xem "Lộ trình tiếp theo" (Tạm dừng + Dừng học chung một bảng). */
export type NhomLoTrinh = 'chua' | 'ft' | 'len' | 'hoc-lai' | 'dung';
export const nhomLoTrinh = (h: HuongLenh | null): NhomLoTrinh =>
  h === 'fast_track' ? 'ft' : h === 'len_lop' ? 'len' : h === 'hoc_lai' ? 'hoc-lai' : h === 'bao_luu' || h === 'dung_hoc' ? 'dung' : 'chua';
/** Lọc nhanh — MỘT hàm cho số đếm và bảng. "Còn bàn giao" = lệnh có phiếu mà GVCN chưa xác nhận (kể cả phiếu cần làm lại). */
export type LocLoTrinh = 'tat-ca' | 'chua-chot' | 'con-ban-giao';
export function khopLocLoTrinh(e: { lenh: { huong: HuongLenh; banGiao: { xacNhan: boolean } } | null }, loc: LocLoTrinh): boolean {
  if (loc === 'chua-chot') return !e.lenh;
  if (loc === 'con-ban-giao') return !!e.lenh && coPhieu(e.lenh.huong) && !e.lenh.banGiao.xacNhan;
  return true;
}
/** Tạm dừng học (bảo lưu) và Dừng học hẳn không có lớp chuyển đến. */
export const canLopDich = (h: HuongLenh): boolean => h !== 'bao_luu' && h !== 'dung_hoc';

export type MucTieuLenh = number | 'KCK';
const mucTieuHopLe = (m: MucTieuLenh | null | undefined) =>
  m === 'KCK' || (typeof m === 'number' && m >= 0 && m <= 9 && Math.round(m * 2) === m * 2);

/**
 * PR-LCa (LCa-2, Q2): Target Lên FT khi Quản lý không gửi — Target ghi ở Lộ trình tiếp theo → khoá lớp thường đang chạy (KCK giữ KCK)
 * → `null` (nơi gọi để `kiemDongLenh` báo "Ghi Target (hoặc KCK)").
 */
export function targetLenFt({ lt, khoa }: {
  lt: { mucTieu: number | null } | null; khoa: { target: number | null; kck: boolean } | null;
}): MucTieuLenh | null {
  if (typeof lt?.mucTieu === 'number') return lt.mucTieu;
  if (khoa?.kck) return 'KCK';
  return typeof khoa?.target === 'number' ? khoa.target : null;
}

/**
 * PR-LCa (LCa-4, R6): điền sẵn một dòng Chuyển tiếp lớp từ Lộ trình tiếp theo — Hướng của LTT; Target theo `targetLenFt` (chỉ Lên FT);
 * lớp chuyển đến = lớp dự kiến nếu hợp lệ cho hướng, không thì lớp hợp lệ DUY NHẤT cùng chi nhánh (PR-LCb), còn lại null. Không LTT / Chưa quyết → null.
 */
export function dienSanChuyenTiep(
  lt: { huong: Huong; lopDuKienId: number | null; mucTieu: number | null } | null,
  khoa: { target: number | null; kck: boolean } | null,
  candidates: readonly { id: number; ft: boolean; programmeCode: ProgrammeCode | null; branchId: number }[],
  ctx: { maTu: ProgrammeCode | null; branchId: number },
): { huong: HuongLenh; mucTieu: MucTieuLenh | null; lopDichId: number | null } | null {
  const huong = lt?.huong;
  if (!lt || (huong !== 'len_lop' && huong !== 'hoc_lai' && huong !== 'fast_track' && huong !== 'bao_luu' && huong !== 'dung_hoc')) return null;
  const mucTieu = huong === 'fast_track' ? targetLenFt({ lt, khoa }) : null;
  if (huong === 'bao_luu' || huong === 'dung_hoc') return { huong, mucTieu, lopDichId: null };
  const ma = huong === 'len_lop' ? NORMAL_LADDER[ctx.maTu as ProgrammeCode] ?? null : ctx.maTu;
  const hopLe = candidates.filter((c) => (huong === 'fast_track' ? c.ft : !c.ft && !!ma && c.programmeCode === ma));
  /* PR-LCb: ứng viên mọi chi nhánh — "lớp hợp lệ duy nhất" chỉ tính trong CÙNG chi nhánh lớp nguồn (lớp dự kiến vẫn ưu tiên trước). */
  const cungCn = hopLe.filter((c) => c.branchId === ctx.branchId);
  const lopDichId = hopLe.some((c) => c.id === lt.lopDuKienId) ? lt.lopDuKienId : cungCn.length === 1 ? cungCn[0].id : null;
  return { huong, mucTieu, lopDichId };
}

/**
 * Kiểm MỘT dòng trước khi ghi — câu lỗi tiếng Việt hoặc `null`. Lên FT (nguồn thường → đích FT): Target (0–9 bước .5 hoặc KCK)
 * bắt buộc. KHÔNG có nhánh "thiếu điểm Cuối khoá" (Q30-4: em thiếu điểm vẫn chuyển được).
 */
export function kiemDongLenh(d: {
  huong: HuongLenh | null; lopDichId: number | null; lopDichFt: boolean; nguonFt: boolean; tuan: string | null; homNay: string;
  lyDo: string | null; khacGoiY: boolean; mucTieu: MucTieuLenh | null; ngayXemLai: string | null;
}): string | null {
  if (!d.huong) return 'Chọn hướng cho em';
  if (canLopDich(d.huong) && !d.lopDichId) return 'Chọn lớp chuyển đến';
  if (!tuanHopLe(d.tuan, d.homNay)) return 'Tuần bắt đầu phải từ tuần sau trở đi';
  const canLyDo = d.khacGoiY || d.huong === 'chuyen_lop' || d.huong === 'bao_luu' || d.huong === 'dung_hoc';
  if (canLyDo && !(d.lyDo ?? '').trim()) return 'Ghi lý do ngắn';   // T7 (PR-MTa): không tối thiểu ký tự
  if (canLopDich(d.huong) && d.lopDichFt && !d.nguonFt && !mucTieuHopLe(d.mucTieu)) return 'Ghi Target (hoặc KCK)';
  if (d.huong === 'bao_luu' && !d.ngayXemLai) return 'Chọn tuần xem lại';
  return null;
}

/**
 * PR-UXF-a Q1 (K2-25): hướng Quản lý chọn có KHÁC Hệ thống gợi ý (luật Cuối khoá) không. Gợi ý 'len' khớp len_lop và fast_track; 'hoc_lai'
 * khớp hoc_lai. Gợi ý null (chưa đủ điểm / 50–59 % Quản lý cân nhắc) → false. Máy chủ tự tính — không tin web.
 */
export function khacGoiY(huong: HuongLenh | null, goiY: { huong: HuongGoiY } | null | undefined): boolean {
  if (!huong || !goiY?.huong) return false;
  return goiY.huong === 'hoc_lai' ? huong !== 'hoc_lai' : !(huong === 'len_lop' || huong === 'fast_track');
}

export type DongTomTatLenh = {
  ten: string; huong: HuongLenh | null;
  /** Mã lớp chuyển đến, đã kèm lộ trình nếu FT ("MB FT 105 · LT1"). */
  lopDich?: string | null; tuan?: string | null; mucTieu?: MucTieuLenh | null; ngayXemLai?: string | null;
  /** Câu phụ của em (PA bổ trợ, việc báo phụ huynh… — LT2b đưa vào), nối sau danh sách tên. */
  ghiChu?: string | null;
};

/** Câu tóm tắt màn C — một câu mỗi nhóm (hướng × lớp chuyển đến × tuần), liệt kê tên em; "Chưa gửi: …" cho em chưa quyết. */
export function tomTatLenh(ds: readonly DongTomTatLenh[], homNay: string): string[] {
  const thuTu: HuongLenh[] = ['len_lop', 'fast_track', 'chuyen_lop', 'hoc_lai', 'bao_luu', 'dung_hoc'];
  const nhom = new Map<string, DongTomTatLenh[]>();
  const chuaGui: string[] = [];
  for (const d of ds) {
    if (!d.huong) { chuaGui.push(d.ten); continue; }
    const khoa = [d.huong, d.lopDich ?? '', d.tuan ?? '', d.huong === 'bao_luu' ? d.ngayXemLai ?? '' : ''].join('|');
    nhom.set(khoa, [...(nhom.get(khoa) ?? []), d]);
  }
  const cau = [...nhom.values()]
    .sort((a, b) => thuTu.indexOf(a[0].huong!) - thuTu.indexOf(b[0].huong!))
    .map((g) => {
      const { huong, lopDich, tuan, ngayXemLai } = g[0];
      const tu = tuan ? ` từ ${tuanLich(tuan, homNay)}` : '';
      const ten = g.map((x) => (huong === 'fast_track' && x.mucTieu != null ? `${x.ten}, Target ${x.mucTieu}` : x.ten)).join(', ');
      const phu = g.filter((x) => x.ghiChu).map((x) => ` ${x.ten} ${x.ghiChu}.`).join('');
      const dau = `${g.length} em`;
      const than = huong === 'len_lop' ? `${dau} lên ${lopDich}${tu}`
        : huong === 'fast_track' ? `${dau} lên FT ${lopDich}${tu}`
        : huong === 'chuyen_lop' ? `${dau} chuyển sang ${lopDich}${tu}`
        : huong === 'hoc_lai' ? `${dau} học lại ${lopDich}${tu}`
        : huong === 'bao_luu' ? `${dau} tạm dừng học (bảo lưu)${ngayXemLai ? `, xem lại ${tuanLich(ngayXemLai, homNay)}` : ''}`
        : `${dau} dừng học hẳn${tu}`;
      return `${than} (${ten}).${phu}`;
    });
  if (chuaGui.length) cau.push(`Chưa gửi: ${chuaGui.join(', ')} (chưa quyết).`);
  return cau;
}

/**
 * PR-LCb: số đếm của việc Quản lý "Chốt lộ trình · {lớp}". `tong` em đang học; `chuaLenh` em chưa có quyết định chuyển lớp đang chờ; trong
 * `chuaLenh`: `choDuyet` có đề xuất chuyển lớp của GVCN chờ duyệt, `deXuat` có nháp của Quản lý (OV-3b), `chuaHuong` còn lại.
 */
export type DemChotLoTrinh = { tong: number; chuaLenh: number; chuaHuong: number; deXuat: number; choDuyet: number };

/**
 * Chữ dòng việc "Chốt lộ trình" (OV-3b): "8 em · 2 em chưa chọn · 6 nháp" · "6 em · đủ nháp, chưa chốt" · "1 em chưa chốt" · "1 em chờ duyệt
 * đề xuất". Mọi em đều chưa chọn → bỏ "{tong} em ·"; đã có em chốt cũng bỏ (R-B4: "7 em · 1 em chưa chọn" dễ đọc nhầm là 7 em còn dở).
 */
export function chuViecChotLoTrinh(x: DemChotLoTrinh): string {
  const conLai = x.chuaLenh - x.choDuyet;
  const chu = x.chuaHuong > 0
    ? `${x.chuaHuong === x.tong || x.chuaLenh < x.tong ? '' : `${x.tong} em · `}${x.chuaHuong} em chưa chọn${x.deXuat > 0 ? ` · ${x.deXuat} nháp` : ''}`
    : conLai <= 0 ? ''
    : x.deXuat === conLai && x.chuaLenh === x.tong ? `${x.tong} em · đủ nháp, chưa chốt`
    : `${conLai} em chưa chốt`;
  return [chu, x.choDuyet > 0 ? `${x.choDuyet} em chờ duyệt đề xuất` : ''].filter(Boolean).join(' · ');
}

/** Trạng thái phiếu một em cho danh sách trái màn F. */
export function trangThaiPhieu(x: { soMonDaGhi: number; soMon: number; daXacNhan: boolean }): { khoa: 'da-xac-nhan' | 'mon' | 'chua-lam'; nhan: string } {
  if (x.daXacNhan) return { khoa: 'da-xac-nhan', nhan: 'Đã xác nhận' };
  if (x.soMonDaGhi > 0) return { khoa: 'mon', nhan: `Môn ${x.soMonDaGhi}/${x.soMon}` };
  return { khoa: 'chua-lam', nhan: 'Chưa làm' };
}

// ---------------------------------------------------------------- dữ liệu các dải (máy chủ trả, web vẽ — mockup 20: A, E, H)

export type DaiLop = {
  /** Phía lớp NGUỒN (A). OV-3b `loTrinh`: lớp thường từ thứ Hai tuần Final − 2 còn em chưa chốt (chỉ Quản lý) — `do` = quá hạn chốt. */
  loTrinh: { hanChot: string | null; tong: number; daChot: number; do: boolean } | null;
  banGiao: { daXacNhan: number; tong: number; hanGvcn: string | null } | null;
  banGiaoMon: { mon: string; monNgan: string; daGhi: number; tong: number; han: string | null }[];
  /** Phía lớp ĐÍCH (H). */
  sapNhan: { n: number; tuLop: { id: number; code: string }[]; tuan: string; daXacNhan: number } | null;
  /** PR-S5F-a: lệnh của lớp (nguồn) đã tới tuần mà CHƯA chuyển được — chỉ Quản lý thấy, để sửa tuần/lớp chuyển đến hoặc huỷ. */
  chuaChuyenDuoc: { n: number; loi: string } | null;
  /** OV-3c: lớp FT — số đợt em vào từ FOU/BE/ELE còn trong 4 tuần (cách xem "Kết quả đầu ra"); 0 = ẩn. */
  kqdrDot: number;
  viewer: { coTheRaLenh: boolean; coTheChuyenNhieuEm: boolean; laGvcn: boolean; xacNhanDuoc: boolean };
};

export type DaiHocVien = {
  /** `cho-duyet` = GVCN đã đề xuất, Quản lý chưa duyệt (chưa có lệnh: `lenhId` 0, `huong` rỗng, `nguoiRaLenh` là người gửi, `tuan` có thể rỗng). */
  loai: 'sap' | 'da' | 'cho-duyet';
  lenhId: number; lopNguon: { id: number; code: string }; lopDich: { id: number; code: string } | null; huong: string; tuan: string;
  nguoiRaLenh: string | null; ngayRaLenh: string;
  banGiao: { soMon: number; daGhi: number; hanGvcn: string | null; daXacNhan: boolean; nguoiXacNhan: string | null; ngayXacNhan: string | null; thay: boolean } | null;
  loi: string | null;
  /** Nút theo vai: bàn giao (GVCN / Quản lý thay) · bàn giao môn (GVBM) · huỷ quyết định (Quản lý, lệnh còn chờ — kể cả chưa chuyển được) · đọc bàn giao (đã xác nhận / đã chuyển). */
  nut: ('ban-giao' | 'ban-giao-mon' | 'huy-lenh' | 'doc-ban-giao')[];
  mon: { ma: string; ngan: string } | null;
};


// ---------------------------------------------------------------- phiếu bàn giao (máy chủ trả, web vẽ — mockup 20: F, G, Đọc bàn giao)

export type TuDien = {
  ketQua: string;
  caseMo: { id: number; ten: string; nguoiNhan: string | null }[];
  yThuc: string; viecConDo: string;
};

export type PhieuMon = {
  ma: string; ten: string; ngan: string; noiDung: string | null; nguoiGhi: string | null; ghiLuc: string | null; dienThay: boolean;
  gvbm: string[];
  /** OV-3b: QL đổi hướng / lớp chuyển đến sau khi chốt — `noiDung` là chữ cũ điền sẵn, chưa tính là đã ghi. */
  lamLai: boolean;
};
export type PhieuEm = {
  lenhId: number; studentId: number; ten: string; maHv: string; huong: string; trangThaiLenh: string;
  lopDich: { id: number; code: string } | null; tuan: string; ngayXemLai: string | null;
  hanGvbm: string | null; hanGvcn: string | null;
  phieu: { khoa: string; nhan: string }; soMonDaGhi: number; soMon: number;
  tuDien: TuDien | null; tuDienDaChup: boolean;
  mon: PhieuMon[];
  nhanXetChung: string | null;
  xacNhan: { boi: string | null; luc: string; thay: boolean } | null;
  gvbmChuaBanGiao: string[];
  /** OV-7a: phiếu đã xác nhận mà người xem còn sửa được (tới ngày thi hành lệnh; sau đó chỉ Quản lý). */
  suaDuoc: boolean;
};
export type PhieuBanGiaoDto = {
  lop: { id: number; code: string; ct: string | null; ft: boolean; mon: { ma: string; ten: string; ngan: string }[] };
  homNay: string;
  /** `ql`: Quản lý lớp nguồn — OV-7a: sửa được phiếu đã xác nhận cả sau ngày thi hành. */
  nguoiXem: { gvcn: boolean; qlThay: boolean; monGhi: string[]; xacNhan: boolean; xemTuNguon: boolean; ql: boolean };
  tong: number; daXacNhan: number; hanGvcn: string | null;
  theoMon: { ma: string; daGhi: number; tong: number; han: string | null }[];
  ds: PhieuEm[];
};

/**
 * PANEL "LỘ TRÌNH TIẾP THEO" (PR-LCb, rà cuối I1–I3): chọn dòng gửi / lưu — hàm thuần, kiểm bằng bảng ca (LCb-x). Một dòng panel đã tính sẵn:
 * `loi` lỗi `kiemDongLenh` (null = gửi được) · `lenh` quyết định đang chờ (Hướng LTT theo lệnh + lỗi thi hành) · `daSua` QL sửa phần quyết
 * định (không tính ghi chú) · `huongLtt` Hướng Lộ trình tiếp theo đang lưu · `targetMoi` QL gõ Target hợp lệ ở ô (em Lên FT chưa có Target).
 */
export type DongPanelCk = {
  id: number; loi: string | null; huong: Huong | ''; lenh: { huong: Huong; loi: boolean } | null; daSua: boolean;
  huongLtt: Huong | null; doiGhiChu: boolean; targetMoi: boolean;
};
export type DongLuuCk<T> = { r: T; huong: Huong; target: boolean };
const giuLenh = (r: DongPanelCk) => !!r.lenh && !r.daSua && !r.lenh.loi;
/** Dòng gửi ở "Xác nhận": hợp lệ, và chưa có lệnh / QL đã sửa / lệnh lỗi thi hành. */
export const chonDongGui = <T extends DongPanelCk>(rows: readonly T[]): T[] => rows.filter((r) => !r.loi && !giuLenh(r));
/** "Chưa gửi — …" ở bước 2: chưa hợp lệ, trừ em giữ nguyên quyết định đang có. */
export const chonChuaGui = <T extends DongPanelCk>(rows: readonly T[]): T[] => rows.filter((r) => !!r.loi && !giuLenh(r));

/**
 * "Lưu hướng" (QL) / "Lưu n em" (GVCN) qua Lộ trình tiếp theo. Em có lệnh: chỉ ghi chú, Hướng = Hướng lệnh (không 409, kể cả khi QL đang sửa
 * quyết định — phần sửa đó đi "Xác nhận"). Em chưa có Hướng mà gõ ghi chú → "Chưa quyết" (không bỏ ghi chú). `target`: gửi Target ở ô (chỉ QL).
 */
export function chonDongLuu<T extends DongPanelCk>(rows: readonly T[], laQl: boolean): DongLuuCk<T>[] {
  return rows.flatMap((r): DongLuuCk<T>[] => {
    if (r.lenh) return r.doiGhiChu ? [{ r, huong: r.lenh.huong, target: false }] : [];
    if (!r.huong) return r.doiGhiChu ? [{ r, huong: 'chua_quyet', target: false }] : [];
    const target = laQl && r.targetMoi;
    return r.huong !== r.huongLtt || r.doiGhiChu || target ? [{ r, huong: r.huong, target }] : [];
  });
}

/** Sau "Xác nhận": ghi chú của em vừa xác nhận (Hướng vừa quyết; Target đã theo lệnh) + mọi dòng lưu được NGOÀI lô gửi. Em lệnh lỗi ở lại panel. */
export function chonLuuSauXacNhan<T extends DongPanelCk>(rows: readonly T[], ok: readonly number[], laQl: boolean): DongLuuCk<T>[] {
  const gui = new Set(chonDongGui(rows).map((r) => r.id));
  const xong = new Set(ok);
  return [
    ...rows.filter((r) => gui.has(r.id) && xong.has(r.id) && r.doiGhiChu).map((r) => ({ r, huong: r.huong as Huong, target: false })),
    ...chonDongLuu(rows, laQl).filter((x) => !gui.has(x.r.id)),
  ];
}

/**
 * Bản sửa còn lại sau một lần ghi (Lưu hướng / Xác nhận). `kq`: lệnh vừa gửi — em ok rời panel, em lỗi giữ. `luu`: dòng vừa PUT Lộ trình tiếp
 * theo — thành công thì bỏ ghi chú đã lưu; lỗi thì GIỮ mọi ghi chú (cả em vừa xác nhận). `dong`: đóng panel được — không lỗi, không còn sửa nào chưa ghi.
 */
export function sauGhiPanel<T extends { ghiChu?: string }>(
  dongs: Readonly<Record<number, T>>, daSua: ReadonlySet<number>,
  kq: { ok: readonly number[]; failed: readonly unknown[] }, luu: { ids: readonly number[]; loi: boolean },
): { dongs: Record<number, Partial<T>>; daSua: Set<number>; dong: boolean } {
  const xong = new Set(kq.ok);
  const daLuu = new Set(luu.loi ? [] : luu.ids);
  const con: Record<number, Partial<T>> = {};
  for (const [k, x] of Object.entries(dongs) as [string, T][]) {
    const id = Number(k);
    const { ghiChu, ...khac } = x;
    const giu: Partial<T> = xong.has(id) ? (luu.loi && ghiChu !== undefined ? { ghiChu } as Partial<T> : {}) : daLuu.has(id) ? khac as Partial<T> : x;
    if (Object.keys(giu).length) con[id] = giu;
  }
  return { dongs: con, daSua: new Set([...daSua].filter((id) => !xong.has(id))), dong: !kq.failed.length && !luu.loi && !Object.keys(con).length };
}

// ---------------------------------------------------------------- PR-CL: Chuyển lớp một em (ô gõ tên lớp + "Khi chuyển, web sẽ")

/**
 * PR-CL (B1): hướng của Chuyển lớp MỘT em — một luật cho `/transfer`, duyệt Đề xuất chuyển lớp, xem trước và lọc lớp chuyển đến.
 * Nguồn thường → đích FT = Lên FT; giữa khoá (hoặc nguồn FT) = Chuyển lớp; lớp thường đã tới Cuối khoá: cùng chương trình = Học lại, khác = Lên lớp.
 */
export function huongMotEm(
  nguon: { ft: boolean; ma: string | null }, dich: { ft: boolean; ma: string | null } | null, tuCuoiKhoa: boolean,
): 'fast_track' | 'chuyen_lop' | 'hoc_lai' | 'len_lop' {
  if (dich?.ft && !nguon.ft) return 'fast_track';
  if (!tuCuoiKhoa) return 'chuyen_lop';
  return dich?.ma === nguon.ma ? 'hoc_lai' : 'len_lop';
}

/** PR-CL (C1): dòng phụ của một lớp chuyển đến trong ô gõ tên lớp — "FT LT1 · CP · 9 em" / "ELE · CP" (GVCN không thấy sĩ số lớp khác). */
export function phuLopDich(
  c: { ft: boolean; route?: string | null; ma: string | null; branchCode?: string | null; siSo?: number | null }, coSiSo: boolean,
): string {
  return [c.ft ? `FT ${c.route ?? ''}`.trim() : kyHieuLop(c.ma, null), c.branchCode, coSiSo && typeof c.siSo === 'number' ? `${c.siSo} em` : null]
    .filter(Boolean).join(' · ');
}

export type DuLieuKhiChuyen = {
  nguonFt: boolean; dichFt: boolean;
  /** `luatDoiLop(...).khoa` — giữ lộ trình/khoá đang chạy hay đóng rồi mở mới. */
  khoa: 'giu' | 'dong-mo';
  routeNguon: string | null; routeDich: string | null; maNguon: string | null;
  /** Thường → FT: MT0 sẽ là đầu vào; `tuXep` = mã tuần MT0 tự xếp (chưa có MT0), null = MT0 đã có. */
  mt0: { tuXep: string | null } | null;
  /** Thường → FT: Target đã có (§7 giữ như cũ) — null thì web hỏi. */
  target: { giaTri: MucTieuLenh; nguon: 'gvcn' | 'khoa' | 'quyet-dinh' } | null;
  /** FT → thường (B4): đúng việc `veLopThuong` sẽ làm. */
  veThuong: { mt0: { coDiem: boolean; kyNang: string[] } | null; mockHuy: string[]; giuDiem: string[] } | null;
  soCase: number; dongCase: 'ft' | 'normal' | null; goiYNhan: string | null;
  doiChiNhanh: boolean;
};

/**
 * PR-CL (B3): khối "Khi chuyển, web sẽ" — một nơi tính, web chỉ vẽ. Dòng rỗng bỏ. `canhBao` (viền vàng) khi FT → thường (học lại sau khi đã lên).
 * Chữ khớp mockup phần 2 + §7; Case theo đúng `dongCase` của `luatDoiLop`.
 */
export function dongKhiChuyen(x: DuLieuKhiChuyen): { khiChuyen: string[]; canhBao: boolean } {
  const ct = kyHieuLop(x.maNguon, null) ?? 'lớp thường';
  const dong: string[] = [];
  if (!x.nguonFt && x.dichFt) {
    dong.push(`Đóng lộ trình ${ct}, mở lộ trình FT ${x.routeDich ?? 'LT1'}`);
    if (x.mt0) dong.push(x.mt0.tuXep ? `MT0 làm đầu vào, tự xếp ${x.mt0.tuXep}` : 'MT0 làm đầu vào');
    if (x.target) dong.push(`Target ${x.target.giaTri === 'KCK' ? 'KCK' : x.target.giaTri.toFixed(1)} (${x.target.nguon === 'gvcn' ? 'GVCN ghi' : x.target.nguon === 'quyet-dinh' ? 'đã quyết' : 'khoá'})`);
  } else if (x.nguonFt && !x.dichFt) {
    dong.push(`Đóng lộ trình FT ${x.routeNguon ?? ''}`.trim());
    const v = x.veThuong;
    if (v?.mt0) dong.push(v.mt0.coDiem ? 'MT0 → “MT0 · không dùng”' : 'Huỷ MT0 chưa có điểm');
    if (v?.mockHuy.length) dong.push(`Huỷ ${v.mockHuy.length} bài Mock chưa có điểm (${v.mockHuy.join(', ')})`);
    if (v?.giuDiem.length) {
      const theoBai = new Map<string, string[]>();
      for (const s of v.giuDiem) { const [bai, ky] = s.split(' '); theoBai.set(bai, [...(theoBai.get(bai) ?? []), ky]); }
      dong.push(`Giữ điểm đã có (${[...theoBai].map(([bai, ky]) => `${bai} ${ky.join(', ')}`).join('; ')})`);
    }
  } else if (x.khoa === 'giu') {
    dong.push(x.nguonFt ? `Giữ lộ trình FT ${x.routeNguon ?? ''}`.trim() : `Giữ khoá ${ct}`);
    dong.push(x.nguonFt ? 'MT chưa thi chuyển sang lớp mới' : 'Bài chưa làm chuyển sang lớp mới');
  } else {
    dong.push('Đóng lộ trình cũ và mở lộ trình mới theo lớp chuyển đến', 'Bài chưa làm ở lại lớp cũ');
  }
  if (x.soCase) {
    dong.push(x.dongCase === 'ft' ? `${x.soCase} Case đang mở tự đóng “Lên FT”`
      : x.dongCase === 'normal' ? `${x.soCase} Case FT tự đóng`
        : `${x.soCase} Case đang mở đi theo em${x.goiYNhan ? `, người nhận gợi ý: ${x.goiYNhan}` : ''}`);
  }
  if (x.doiChiNhanh) dong.push('Quản lý chi nhánh mới và GVCN lớp mới được báo “Sắp nhận”');
  return { khiChuyen: dong, canhBao: x.nguonFt && !x.dichFt };
}

// ---------------------------------------------------------------- Chuyển lớp nhiều em (PR-CL C1, mở từ "Xét lại lộ trình")

/** Tối đa em một lần ở panel nhiều em (mỗi em một lời gọi `/transfer`). */
export const TOI_DA_NHIEU_EM = 50;

/** Một dòng khối "Khi chuyển, web sẽ" nhiều em: "{Tên} · FT → Thường: đóng lộ trình FT LT1 · …" — dòng `dongKhiChuyen` nối " · ", chữ thường đầu (trừ chữ viết tắt MT0, FT…). */
export function tomTatChuyenEm(ten: string, nguonFt: boolean, dichFt: boolean, khiChuyen: readonly string[]): string {
  const thuong = (s: string) => (/^\p{Lu}\p{Ll}/u.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
  return `${ten} · ${nguonFt ? 'FT' : 'Thường'} → ${dichFt ? 'FT' : 'Thường'}: ${khiChuyen.map(thuong).join(' · ')}`;
}

/** Em sẽ gửi = đánh dấu, đã chọn lớp, chưa chuyển xong; bỏ qua = đánh dấu mà chưa chọn lớp (chân "Chuyển n · Bỏ qua k (chưa chọn lớp)"). */
export function chonGuiNhieuEm<T extends { chon: boolean; lop: number | null; xong?: boolean }>(rows: readonly T[]): { gui: T[]; boQua: number } {
  const conLai = rows.filter((r) => r.chon && !r.xong);
  return { gui: conLai.filter((r) => r.lop !== null), boQua: conLai.filter((r) => r.lop === null).length };
}

/** "46%" cho Xét lại — làm tròn XUỐNG (tỷ lệ chưa làm tròn 0.4996 vẫn là "dưới 50%" đúng luật `khongPhuHopLoTrinh`). */
export const chuTyLeXetLai = (tyLe: number): string => `${Math.floor(tyLe * 100 + 1e-9)}%`;

/** §7: hỏi Target CHỈ khi Lên FT từ lớp thường mà em chưa có Target nào (`targetSan` của xem trước = null). Dùng cho panel một em và nhiều em. */
export const canHoiTarget = (nguonFt: boolean, dichFt: boolean, targetSan: MucTieuLenh | null | undefined): boolean =>
  !nguonFt && dichFt && targetSan === null;

/** Ô Target ở Chuyển lớp (một em + nhiều em): "6,5" / "6.5" / "kck" → giá trị; trống → "Chưa điền"; sai → lỗi tại ô (cùng luật `kiemDongLenh` của máy chủ). */
export function docOTarget(v: string): { giaTri: MucTieuLenh | undefined; loi: string | null } {
  const s = v.trim().replace(',', '.');
  if (!s) return { giaTri: undefined, loi: 'Chưa điền' };
  const g: MucTieuLenh = s.toUpperCase() === 'KCK' ? 'KCK' : Number(s);
  return mucTieuHopLe(g) ? { giaTri: g, loi: null } : { giaTri: undefined, loi: 'Gõ band 0–9, bước 0,5 (ví dụ 6.5) hoặc KCK' };
}
