/**
 * HỘP CHỜ DUYỆT (PR-DUYET, đặc tả §5.5, §7.6, Q27-3) — luật thuần dùng chung máy chủ và giao diện.
 *
 * Mọi thứ "ai đó xin Quản lý quyết" là MỘT thẻ trong bảng `yeu_cau_duyet`, hiện ở MỘT hộp (Công việc › Chờ duyệt).
 * Loại thẻ là một mảng: PR sau (SOS, YT4, LT2…) chỉ thêm khoá vào CUỐI `LOAI_YEU_CAU` + một dòng `LOAI_YC_META`.
 */
import { hanTheoNgay, HAN_DUYET_NGAY } from './cases.ts';
import type { TrangThai } from './trangThai.ts';
import { t } from '../i18n/index.ts';
import type { DiemHv } from './diemDong.ts';

export const PHAN_LOAI = ['hoc-thuat', 'y-thuc', 'lich-thi', 'thong-tin-hv', 'bao-len'] as const;
export type PhanLoai = (typeof PHAN_LOAI)[number];
export const PHAN_LOAI_LABEL: Record<PhanLoai, string> = {
  'hoc-thuat': t('Học thuật'), 'y-thuc': t('Ý thức'), 'lich-thi': t('Dời lịch Test'), 'thong-tin-hv': t('Thông tin HV'), 'bao-len': t('Báo QL'),
};

/**
 * Mỗi PR thêm khoá của mình VÀO CUỐI mảng này (SOS: 'khong_theo_doi'; YT4: 'y_thuc' + 'bao_len_y_thuc'; CT: 'de_xuat_chuyen_lop', 'bao_len_ban_giao',
 * 'bao_len_chua_lenh'; LT2: 'ke_hoach_bo_tro', 'bao_len_mini_test', 'bao_len_cuoi_khoa' — thẻ "Quyết định Cuối khoá" đã bỏ theo Q30-3).
 */
export const LOAI_YEU_CAU = ['de_xuat_pa', 'xin_y_kien', 'lich_thi', 'sua_thong_tin', 'bao_len_nguyen_nhan', 'khong_theo_doi', 'y_thuc', 'bao_len_y_thuc', 'de_xuat_chuyen_lop', 'bao_len_ban_giao', 'bao_len_chua_lenh', 'ke_hoach_bo_tro', 'bao_len_mini_test', 'bao_len_cuoi_khoa', 'thu_hoi_y_thuc', 'xin_xoa'] as const;
export type LoaiYeuCau = (typeof LOAI_YEU_CAU)[number];

/**
 * OV-7a (chủ SP 13/10): loại thẻ NGƯỜI GỬI còn Sửa / Rút được khi Quản lý chưa trả lời — máy chủ (`khiSua` / `khiRut` của loại) và giao diện
 * (nút Sửa… / Rút trên thẻ) đọc CÙNG danh sách này. Rút = thẻ `tu_dong` lý do "Người gửi đã rút", không chuông.
 */
export const LOAI_NGUOI_XIN_SUA: readonly LoaiYeuCau[] = ['sua_thong_tin', 'de_xuat_chuyen_lop', 'khong_theo_doi', 'y_thuc', 'thu_hoi_y_thuc'];
export const LY_DO_RUT = t('Người gửi đã rút');

/** `da_tra_loi` chỉ của Xin ý kiến; `tu_dong` = hệ thống tự đóng (đối tượng không còn ý nghĩa). */
export const TRANG_THAI_YC = ['cho', 'duyet', 'tu_choi', 'tu_dong', 'da_tra_loi'] as const;
export type TrangThaiYc = (typeof TRANG_THAI_YC)[number];

/** Báo QL = 'nhac' (K1-57: không duyệt, chỉ nhắc) · Xin ý kiến = 'tra-loi' (T64) · còn lại Duyệt/Từ chối. */
export type KieuNut = 'duyet-tu-choi' | 'tra-loi' | 'nhac';

export type LoaiYcMeta = {
  phanLoai: PhanLoai;
  nhan: string;
  kieuNut: KieuNut;
  /** Hạn duyệt mặc định (ngày, tính cả ngày gửi — M-16). `null` = hạn do luồng nguồn truyền vào (hoặc không có). */
  hanNgay: number | null;
  /** Duyệt hàng loạt được (chỉ khi đang lọc đúng một loại). */
  hangLoat: boolean;
};

export const LOAI_YC_META: Record<LoaiYeuCau, LoaiYcMeta> = {
  de_xuat_pa: { phanLoai: 'hoc-thuat', nhan: t('Đề xuất PA'), kieuNut: 'duyet-tu-choi', hanNgay: HAN_DUYET_NGAY, hangLoat: true },
  xin_y_kien: { phanLoai: 'hoc-thuat', nhan: t('Xin ý kiến'), kieuNut: 'tra-loi', hanNgay: HAN_DUYET_NGAY, hangLoat: false },
  lich_thi: { phanLoai: 'lich-thi', nhan: t('Dời lịch Test lần 2'), kieuNut: 'duyet-tu-choi', hanNgay: null, hangLoat: true },
  sua_thong_tin: { phanLoai: 'thong-tin-hv', nhan: t('Đề xuất sửa'), kieuNut: 'duyet-tu-choi', hanNgay: HAN_DUYET_NGAY, hangLoat: false },
  bao_len_nguyen_nhan: { phanLoai: 'bao-len', nhan: t('Case quá hạn xác nhận'), kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  /* PR-SOS (S4-5, T23): GVBM xin không theo dõi Case SOS chờ nguyên nhân — Quản lý duyệt trong 5 ngày. */
  khong_theo_doi: { phanLoai: 'hoc-thuat', nhan: t('Không cần theo dõi'), kieuNut: 'duyet-tu-choi', hanNgay: 5, hangLoat: false },
  /* PR-YT4 (V4-9, V4-10): Meeting CX/GĐCN · WL 3 · Đình chỉ · Khác — QL duyệt trong 5 ngày. */
  y_thuc: { phanLoai: 'y-thuc', nhan: t('Xử lý Ý thức cần duyệt'), kieuNut: 'duyet-tu-choi', hanNgay: HAN_DUYET_NGAY, hangLoat: false },
  /* PR-YT4 (V4-4, V4-5, K3-37, Q9): một thẻ mỗi em — không duyệt, QL biết và nhắc. */
  bao_len_y_thuc: { phanLoai: 'bao-len', nhan: t('Ý thức quá hạn'), kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  /* PR-CT (Q30-1, Q30-2, Q30-4): GVCN đề xuất chuyển lớp (5 ngày) · Báo QL bàn giao quá hạn 3 ngày (một thẻ mỗi lớp nguồn) · Báo QL lớp hết khoá còn em chưa có lệnh. */
  de_xuat_chuyen_lop: { phanLoai: 'thong-tin-hv', nhan: t('Đề xuất chuyển lớp'), kieuNut: 'duyet-tu-choi', hanNgay: 5, hangLoat: false },
  bao_len_ban_giao: { phanLoai: 'bao-len', nhan: t('Bàn giao quá hạn'), kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  bao_len_chua_lenh: { phanLoai: 'bao-len', nhan: t('Lớp hết khoá · chưa có quyết định chuyển lớp'), kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  /* PR-LT2a (T54, M-05): kế hoạch bài giảng PA bổ trợ Giữa khoá. PR-CT2: CHỈ ĐỌC LỊCH SỬ — không còn đường tạo; duyệt / từ chối → 409. */
  ke_hoach_bo_tro: { phanLoai: 'hoc-thuat', nhan: t('Kế hoạch bổ trợ'), kieuNut: 'duyet-tu-choi', hanNgay: 3, hangLoat: false },
  /* PR-LT2b (M-05, T76): Mini Test dưới 70% — QL xử lý case-by-case. Bài Cuối khoá dời quá tuần cuối khoá (K4-23) — QL biết và nhắc. */
  bao_len_mini_test: { phanLoai: 'bao-len', nhan: t('Mini Test chưa đạt'), kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  bao_len_cuoi_khoa: { phanLoai: 'bao-len', nhan: t('Final Test dời quá hạn'), kieuNut: 'nhac', hanNgay: null, hangLoat: false },
  /* LUAT-5 (luật 5, 21/10): GVCN xin thu hồi một lần xử lý đã lưu — lý do bắt buộc, QL duyệt trong 5 ngày. */
  thu_hoi_y_thuc: { phanLoai: 'y-thuc', nhan: t('Thu hồi xử lý Ý thức'), kieuNut: 'duyet-tu-choi', hanNgay: HAN_DUYET_NGAY, hangLoat: false },
  /* N37 (chủ SP 05/11): GV xin xoá Case SOS / PA theo quy chế (MỘT loại, đối tượng Case hoặc PA) — QL duyệt thì vào Thùng rác. */
  xin_xoa: { phanLoai: 'hoc-thuat', nhan: t('Xin xoá'), kieuNut: 'duyet-tu-choi', hanNgay: HAN_DUYET_NGAY, hangLoat: false },
};

export function laPhanLoai(x: unknown): x is PhanLoai {
  return typeof x === 'string' && (PHAN_LOAI as readonly string[]).includes(x);
}

/** Hạn duyệt mặc định của một loại, tính từ ngày gửi (cả ngày gửi). `null` khi loại không có hạn mặc định. */
export function hanDuyetMacDinh(loai: LoaiYeuCau, ngayXin: string): string | null {
  const n = LOAI_YC_META[loai].hanNgay;
  return n ? hanTheoNgay(ngayXin.slice(0, 10), n) : null;
}

export type KhoaChip = 'tat-ca' | PhanLoai;
/** Số thẻ trên từng chip — đủ 6 khoá kể cả số 0 (Q12: chip đứng cố định). */
export function demChip(ds: readonly { phanLoai: PhanLoai }[]): Record<KhoaChip, number> {
  const kq = { 'tat-ca': ds.length } as Record<KhoaChip, number>;
  for (const k of PHAN_LOAI) kq[k] = 0;
  for (const x of ds) kq[x.phanLoai] += 1;
  return kq;
}

/** PR-GVb (D01/Q-B): trần một lần duyệt / nhắc hàng loạt — máy chủ (`duyetNhieu`, `nhacNhieu`) và web cùng đọc. */
export const TRAN_HANG_LOAT = 50;

/** PR-GVb (J5b, Q-D 02/10): thẻ QL phải quyết (Duyệt/Từ chối, Trả lời) · thẻ chỉ để QL nhắc (Báo QL, tab Nhắc việc — PR-NV). */
export type NhomHop = 'can-quyet' | 'de-biet';
export function nhomCuaLoai(loai: string): NhomHop {
  return (LOAI_YC_META as Record<string, LoaiYcMeta>)[loai]?.kieuNut === 'nhac' ? 'de-biet' : 'can-quyet';
}
/** Phân loại có ít nhất một loại thẻ phải quyết — chip của tab Chờ duyệt. */
export const PHAN_LOAI_CAN_QUYET: readonly PhanLoai[] = PHAN_LOAI.filter((k) =>
  LOAI_YEU_CAU.some((l) => LOAI_YC_META[l].phanLoai === k && LOAI_YC_META[l].kieuNut !== 'nhac'));

/**
 * MỘT HÀM ĐẾM cho mọi con số của hộp (chip, badge Công việc, dải Tổng quan). PR-GVb (J5b): `tong` = thẻ PHẢI QUYẾT (= chip "Tất cả" của tab
 * Chờ duyệt = số dòng có nút Duyệt/Trả lời) · `deBiet` = thẻ tab Nhắc việc, KHÔNG cộng vào badge · `baoLen` giữ cho tương thích (= deBiet).
 */
export function demHop(ds: readonly { loai: string; phanLoai: PhanLoai; hanDuyet: string | null }[], homNay: string) {
  const quyet = ds.filter((x) => nhomCuaLoai(x.loai) === 'can-quyet');
  const biet = ds.filter((x) => nhomCuaLoai(x.loai) === 'de-biet');
  const qua = (x: { hanDuyet: string | null }) => !!x.hanDuyet && x.hanDuyet < homNay;
  const chip = demChip(quyet);
  return { chip, tong: quyet.length, quaHan: quyet.filter(qua).length, deBiet: biet.length, deBietQuaHan: biet.filter(qua).length, baoLen: biet.length };
}

type ChonDuoc = { id: number; loai: string; hangLoat: boolean };
/** Bấm ô chọn một thẻ: chỉ loại `hangLoat`; khác loại với thẻ đang chọn → bắt đầu lại; không quá `TRAN_HANG_LOAT`. */
export function chonMot<T extends ChonDuoc>(ds: readonly T[], chon: ReadonlySet<number>, id: number, v: boolean): Set<number> {
  const the = ds.find((x) => x.id === id);
  if (!the || !the.hangLoat) return new Set(chon);
  const loaiDang = ds.find((x) => chon.has(x.id))?.loai ?? null;
  const next = new Set(loaiDang && loaiDang !== the.loai ? [] : chon);
  if (!v) { next.delete(id); return next; }
  if (next.size >= TRAN_HANG_LOAT) return next;
  next.add(id);
  return next;
}
/** "Chọn hết n": mọi thẻ đang chờ CÙNG loại (theo thứ tự danh sách), tối đa `TRAN_HANG_LOAT`. */
export function chonHet<T extends ChonDuoc & { trangThai: string }>(ds: readonly T[], loai: string): Set<number> {
  return new Set(ds.filter((x) => x.loai === loai && x.hangLoat && x.trangThai === 'cho').slice(0, TRAN_HANG_LOAT).map((x) => x.id));
}

/** Kết quả hàng loạt một câu: "Đã duyệt 7/9 — 2 không có quyền". Lý do gom theo mã (PR-GVb G7). */
export function tomTatKetQuaHangLoat(viec: 'duyet' | 'tu-choi', ok: number, loi: readonly { ma: number; loi: string }[]): string {
  const dong = viec === 'duyet' ? t('duyệt') : t('từ chối');
  const dau = t('Đã {dong} {ok}/{x}', { dong, ok, x: ok + loi.length });
  if (!loi.length) return dau;
  const nhom: [string, number][] = [
    [t('không có quyền'), loi.filter((l) => l.ma === 403).length],
    [t('đã có người xử lý'), loi.filter((l) => l.ma === 400 && /đã được xử lý/.test(l.loi)).length],
    [t('không còn'), loi.filter((l) => l.ma === 404).length],
  ];
  /* PR-NV: hết giờ giữa chừng (503) — nói cuối, kèm việc cần làm (chủ sản phẩm 05/10: "20 chưa nhắc, bấm lại"). */
  const chuaKip = loi.filter((l) => l.ma === 503).length;
  const khac = loi.length - chuaKip - nhom.reduce((s, [, n]) => s + n, 0);
  if (khac) nhom.push([t('lỗi khác'), khac]);
  if (chuaKip) nhom.push([t('chưa {dong}, bấm lại', { dong }), chuaKip]);
  return `${dau} — ${nhom.filter(([, n]) => n > 0).map(([c, n]) => `${n} ${c}`).join(', ')}`;
}

/**
 * Thứ tự thẻ: quá hạn → hạn gần → không hạn; cùng hạn: gửi trước đứng trước.
 * Hạn là ngày ISO nên so chuỗi đã đúng — thẻ quá hạn có hạn sớm nhất, tự đứng đầu.
 */
export function sapThe<T extends { hanDuyet: string | null; taoLuc: string }>(ds: readonly T[]): T[] {
  return [...ds].sort((a, b) => {
    if (a.hanDuyet !== b.hanDuyet) {
      if (!a.hanDuyet) return 1;
      if (!b.hanDuyet) return -1;
      return a.hanDuyet < b.hanDuyet ? -1 : 1;
    }
    return a.taoLuc < b.taoLuc ? -1 : a.taoLuc > b.taoLuc ? 1 : 0;
  });
}

/** QL tự gửi rồi tự duyệt (Q-D). Người xin `null` = hệ thống (Báo QL) → không bao giờ là tự duyệt. */
export function laTuDuyet(nguoiXin: number | null, nguoiDuyet: number): boolean {
  return nguoiXin !== null && nguoiXin === nguoiDuyet;
}

/** Đường tới đúng thẻ: người duyệt → hộp Chờ duyệt (Báo QL → tab Nhắc việc), người xin → Yêu cầu của tôi. */
export function duongThe(id: number, vai: 'duyet' | 'nguoi-xin' | 'de-biet'): string {
  /* PR-GVb (J5b): thẻ Báo QL nằm ở tab Nhắc việc (mã `de-biet` giữ cho link cũ). */
  if (vai === 'de-biet') return `/cong-viec/cho-duyet?xem=de-biet&the=${id}`;
  return `/cong-viec/${vai === 'duyet' ? 'cho-duyet' : 'yeu-cau'}?the=${id}`;
}

/** Trạng thái thẻ → nhãn chung §7.3 (`NhanTrangThai`) + chữ riêng của hộp. */
export function nhanTrangThaiYc(tt: TrangThaiYc, tuDuyet = false): { t: TrangThai; chu: string } {
  switch (tt) {
    case 'cho': return { t: 'cho-duyet', chu: t('Chờ duyệt') };
    case 'duyet': return { t: 'xong', chu: tuDuyet ? t('Đã duyệt · tự duyệt') : t('Đã duyệt') };
    case 'da_tra_loi': return { t: 'xong', chu: t('Đã trả lời') };
    /* PR-GVb (chủ sản phẩm 03/10): Bị từ chối = người xin phải làm lại → kiểu Cần làm ở mọi nơi. */
    case 'tu_choi': return { t: 'can-lam', chu: t('Bị từ chối') };
    case 'tu_dong': return { t: 'da-huy', chu: t('Tự đóng') };
  }
}

/** Một thẻ như máy chủ trả cho giao diện (`GET /yeu-cau`). Chữ đã dựng sẵn — giao diện không tự ghép từ mã. */
export type TheYeuCauDto = {
  id: number;
  /** Id đối tượng gốc (đề nghị dời, PA…) — PR-XLMT: hồ sơ Mock tìm đúng thẻ Lịch thi của một đề nghị dời. */
  doiTuongId?: number | null;
  loai: LoaiYeuCau;
  nhanLoai: string;
  phanLoai: PhanLoai;
  nhanPhanLoai: string;
  kieuNut: KieuNut;
  hangLoat: boolean;
  tieuDe: string;
  /** Ngữ cảnh ngắn sau học viên · lớp (ví dụ "MT2"). */
  phu: string | null;
  dong: string[];
  neuDuyet: string | null;
  /** Đường "Mở" (hồ sơ HV / Ngăn Case / trang lượt thi). */
  mo: string | null;
  hocVienId: number | null;
  hocVien: string | null;
  lopId: number | null;
  lop: string | null;
  nguoiXinId: number | null;
  /** `null` = hệ thống (Báo QL). */
  nguoiXin: string | null;
  nguoiDuyet: string | null;
  lyDo: string | null;
  lyDoTuChoi: string | null;
  traLoi: string | null;
  lyDoDong: string | null;
  hanDuyet: string | null;
  trangThai: TrangThaiYc;
  tuDuyet: boolean;
  taoLuc: string;
  xuLyLuc: string | null;
  duLieu: Record<string, unknown> | null;
  /** PR-LUI-a2: tab Đã xử lý — Quản lý huỷ được quyết định này (loại có đường đảo, quyết hôm nay, nguồn chưa chạy). */
  coTheHuy?: boolean;
  /** PANEL-MC (DUYET-QL, chỉ tab Chờ duyệt): SOS hiện tại của em (`latestAttempts`, như chỉ số SOS hiện tại; null = không em / không SOS) — chip ở dòng thẻ. */
  sos?: { muc: number; tam: boolean; kyNang: string[] } | null;
  /** PANEL-MC: dòng điểm lượt gần nhất của em — bối cảnh trong panel duyệt. */
  diemHv?: DiemHv | null;
  /** PANEL-MC: số dòng nhật ký của thẻ (thẻ + đối tượng gốc + Case của PA) — "Lịch sử · n"; mở bằng `GET /lich-su?loai=yeu-cau&id=`. */
  soLichSu?: number;
};

/** PR-GVb (J5b): `cho` = thẻ PHẢI QUYẾT (= chip "Tất cả" = badge); `quaHan` = trong đó thẻ đỏ; `deBiet`/`deBietQuaHan` = thẻ Nhắc việc, KHÔNG cộng vào `cho` — xem `demHop`. */
export type DemYeuCau = {
  cho: number; quaHan: number; baoLen: number; deBiet: number; deBietQuaHan: number; cuaToiCho: number; cuaToiTuChoi: number;
  /** PR-VAI-a (Q17): chip từng phân loại (thẻ phải quyết) — chỉ người duyệt. */
  chip?: Record<KhoaChip, number>;
};

export type ChipDem = { key: string; nhan: string; so: number; den: string; quaHan?: boolean };
/**
 * PR-GVb (J5): hàng chip dải Chờ duyệt ở Tổng quan QL — từng phân loại phải quyết (> 0, thứ tự `PHAN_LOAI_CAN_QUYET`) · "Quá hạn". PR-NV (T8): không còn chip Nhắc việc — dải chỉ nói việc phải quyết.
 * `den` = query mở hộp đã lọc (nối thêm `&cn=` ở web).
 */
export function chipChoDuyet(d: DemYeuCau): ChipDem[] {
  const kq: ChipDem[] = PHAN_LOAI_CAN_QUYET.filter((k) => (d.chip?.[k] ?? 0) > 0)
    .map((k) => ({ key: k, nhan: PHAN_LOAI_LABEL[k], so: d.chip![k], den: `?phan=${k}` }));
  if (d.quaHan > 0) kq.push({ key: 'qua-han', nhan: t('Quá hạn'), so: d.quaHan, den: '?qua-han=1', quaHan: true });
  return kq;
}

/** Trường của thẻ Đề xuất sửa (PR-DUYET T44) — MỘT bản cho máy chủ (`duyet/deXuatSua.ts`) và web (`DeXuatSuaPanel`). PR-CT: bỏ 'lop' — dùng Đề xuất chuyển lớp. */
export const TRUONG_DE_XUAT = ['target', 'lo-trinh', 'lich-mt', 'khac'] as const;
export type TruongDeXuat = (typeof TRUONG_DE_XUAT)[number];
