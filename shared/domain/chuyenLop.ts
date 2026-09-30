/**
 * LỆNH CHUYỂN LỚP + BÀN GIAO — luật thuần (PR-CT, đặc tả §3.1f Q30-1…Q30-4, mockup 20).
 *
 * Quản lý ra lệnh: em nào, lớp đích nào, tuần bắt đầu (Thứ Hai, từ tuần sau trở đi). Tới Thứ Hai đó web tự thi hành
 * bằng luật lộ trình đang có (`lenLop.ts`). Có lệnh → phiếu bàn giao: GVBM ghi một câu mỗi em (hạn 2 ngày), GVCN lớp
 * cũ xác nhận (hạn 3 ngày, tính cả ngày ra lệnh). Một nguồn cho máy chủ và web.
 */
import { hanTheoNgay } from './cases.ts';
import { tuanLich } from './hienThiNgay.ts';
import { mondayOfDate } from './week.ts';

export const HUONG_LENH = ['len_lop', 'hoc_lai', 'fast_track', 'chuyen_lop', 'bao_luu', 'dung_hoc'] as const;
export type HuongLenh = (typeof HUONG_LENH)[number];
export type TrangThaiLenh = 'cho' | 'da_chuyen' | 'huy';
export const LY_DO_LENH_TOI_THIEU = 3;
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

/** Mọi hướng có phiếu bàn giao trừ Dừng học (Q16). */
export const coPhieu = (h: HuongLenh): boolean => h !== 'dung_hoc';
/** Bảo lưu và Dừng học không có lớp đích. */
export const canLopDich = (h: HuongLenh): boolean => h !== 'bao_luu' && h !== 'dung_hoc';

export type MucTieuLenh = number | 'KCK';
const mucTieuHopLe = (m: MucTieuLenh | null | undefined) =>
  m === 'KCK' || (typeof m === 'number' && m >= 0 && m <= 9 && Math.round(m * 2) === m * 2);

/**
 * Kiểm MỘT dòng trước khi ghi — câu lỗi tiếng Việt hoặc `null`. Lên FT (nguồn thường → đích FT): Target (0–9 bước .5 hoặc KCK)
 * bắt buộc. KHÔNG có nhánh "thiếu điểm Cuối khoá" (Q30-4: em thiếu điểm vẫn chuyển được).
 */
export function kiemDongLenh(d: {
  huong: HuongLenh | null; lopDichId: number | null; lopDichFt: boolean; nguonFt: boolean; tuan: string | null; homNay: string;
  lyDo: string | null; khacGoiY: boolean; mucTieu: MucTieuLenh | null; ngayXemLai: string | null;
}): string | null {
  if (!d.huong) return 'Chọn hướng cho em';
  if (canLopDich(d.huong) && !d.lopDichId) return 'Chọn lớp đích';
  if (!tuanHopLe(d.tuan, d.homNay)) return 'Tuần bắt đầu phải từ tuần sau trở đi';
  const canLyDo = d.khacGoiY || d.huong === 'chuyen_lop' || d.huong === 'bao_luu' || d.huong === 'dung_hoc';
  if (canLyDo && (d.lyDo ?? '').trim().length < LY_DO_LENH_TOI_THIEU) return 'Ghi lý do ngắn';
  if (canLopDich(d.huong) && d.lopDichFt && !d.nguonFt && !mucTieuHopLe(d.mucTieu)) return 'Ghi Target (hoặc KCK)';
  if (d.huong === 'bao_luu' && !d.ngayXemLai) return 'Chọn tuần xem lại';
  return null;
}

export type DongTomTatLenh = {
  ten: string; huong: HuongLenh | null;
  /** Mã lớp đích, đã kèm lộ trình nếu FT ("MB FT 105 · LT1"). */
  lopDich?: string | null; tuan?: string | null; mucTieu?: MucTieuLenh | null; ngayXemLai?: string | null;
  /** Câu phụ của em (PA bổ trợ, việc báo phụ huynh… — LT2b đưa vào), nối sau danh sách tên. */
  ghiChu?: string | null;
};

/** Câu tóm tắt màn C — một câu mỗi nhóm (hướng × lớp đích × tuần), liệt kê tên em; "Chưa gửi: …" cho em chưa quyết. */
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
      const ten = g.map((x) => (huong === 'fast_track' && x.mucTieu != null ? `${x.ten}, target ${x.mucTieu}` : x.ten)).join(', ');
      const phu = g.filter((x) => x.ghiChu).map((x) => ` ${x.ten} ${x.ghiChu}.`).join('');
      const dau = `${g.length} em`;
      const than = huong === 'len_lop' ? `${dau} lên ${lopDich}${tu}`
        : huong === 'fast_track' ? `${dau} lên Fast Track ${lopDich}${tu}`
        : huong === 'chuyen_lop' ? `${dau} chuyển sang ${lopDich}${tu}`
        : huong === 'hoc_lai' ? `${dau} học lại ${lopDich}${tu}`
        : huong === 'bao_luu' ? `${dau} bảo lưu${ngayXemLai ? `, xem lại ${tuanLich(ngayXemLai, homNay)}` : ''}`
        : `${dau} dừng học${tu}`;
      return `${than} (${ten}).${phu}`;
    });
  if (chuaGui.length) cau.push(`Chưa gửi: ${chuaGui.join(', ')} (chưa quyết).`);
  return cau;
}

/** Trạng thái phiếu một em cho danh sách trái màn F. */
export function trangThaiPhieu(x: { soMonDaGhi: number; soMon: number; daXacNhan: boolean }): { khoa: 'da-xac-nhan' | 'mon' | 'chua-lam'; nhan: string } {
  if (x.daXacNhan) return { khoa: 'da-xac-nhan', nhan: 'Đã xác nhận' };
  if (x.soMonDaGhi > 0) return { khoa: 'mon', nhan: `Môn ${x.soMonDaGhi}/${x.soMon}` };
  return { khoa: 'chua-lam', nhan: 'Chưa làm' };
}

// ---------------------------------------------------------------- dữ liệu các dải (máy chủ trả, web vẽ — mockup 20: A, E, H)

export type DaiLop = {
  /** Phía lớp NGUỒN (A). `ketThucKhoa`: lớp thường tới tuần Cuối khoá còn em chưa có lệnh. */
  ketThucKhoa: { tuanCuoiKhoa: string | null; tuanKetThuc: string | null; soChuaLenh: number; do: boolean; tuanGoiY: string } | null;
  banGiao: { daXacNhan: number; tong: number; hanGvcn: string | null } | null;
  banGiaoMon: { mon: string; monNgan: string; daGhi: number; tong: number; han: string | null }[];
  /** Phía lớp ĐÍCH (H). */
  sapNhan: { n: number; tuLop: { id: number; code: string }[]; tuan: string; daXacNhan: number } | null;
  /** PR-S5F-a: lệnh của lớp (nguồn) đã tới tuần mà CHƯA chuyển được — chỉ Quản lý thấy, để sửa tuần/lớp đích hoặc huỷ. */
  chuaChuyenDuoc: { n: number; loi: string } | null;
  viewer: { coTheRaLenh: boolean; coTheChuyenNhieuEm: boolean; laGvcn: boolean; xacNhanDuoc: boolean };
};

export type DaiHocVien = {
  loai: 'sap' | 'da';
  lenhId: number; lopNguon: { id: number; code: string }; lopDich: { id: number; code: string } | null; huong: string; tuan: string;
  nguoiRaLenh: string | null; ngayRaLenh: string;
  banGiao: { soMon: number; daGhi: number; hanGvcn: string | null; daXacNhan: boolean; nguoiXacNhan: string | null; ngayXacNhan: string | null; thay: boolean } | null;
  loi: string | null;
  /** Nút theo vai: bàn giao (GVCN / Quản lý thay) · bàn giao môn (GVBM) · huỷ lệnh (Quản lý, lệnh còn chờ — kể cả chưa chuyển được) · đọc bàn giao (đã xác nhận / đã chuyển). */
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
};
export type PhieuBanGiaoDto = {
  lop: { id: number; code: string; ct: string | null; ft: boolean; mon: { ma: string; ten: string; ngan: string }[] };
  homNay: string;
  nguoiXem: { gvcn: boolean; qlThay: boolean; monGhi: string[]; xacNhan: boolean; xemTuNguon: boolean };
  tong: number; daXacNhan: number; hanGvcn: string | null;
  theoMon: { ma: string; daGhi: number; tong: number; han: string | null }[];
  ds: PhieuEm[];
};

