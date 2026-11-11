/**
 * HẠN MẶC ĐỊNH (QTV2-HAN, chủ SP 11/11 "luật lệ hạn mặc định" — Quản trị sửa, Quản lý xem; spec `2026-11-11-quan-tri-v2-design.md` mục 5.4, 6).
 *
 * MỘT chỗ giữ 13 hạn đang viết cứng rải trong mã. Bản 1 = đúng giá trị cũ (`HAN_MAC_DINH_GOC`) ⇒ ngày đầu không đổi hành vi.
 * ÁP CHO VIỆC SINH SAU: mỗi hàm hạn tra `hanTai(ma, moc)` — bản có hiệu lực TẠI MỐC CỦA CHÍNH VIỆC ĐÓ (ngày lưu, ngày phát hiện, tuần thi, ngày
 * ra lệnh…, cùng đồng hồ nghiệp vụ với `tu` của bản). Việc sinh trước lần sửa tra ra bản cũ ⇒ giữ hạn cũ; không thêm cột chụp.
 * Nguồn danh sách bản: máy chủ (`platform/cauHinh.ts`, nhớ theo tiến trình) và web (phiên đăng nhập) gọi `datNguonHan`. Chưa đặt → bản gốc.
 */
import { banTaiMoc, type BanPhienBan } from './phienBan.ts';

export const HAN_MAC_DINH_GOC = {
  /** Chấm Mock / Test lớp thường: thứ `thu` (2 = T2 … 8 = CN) của tuần lệch `tuanLech` so với tuần thi (T19: T4 tuần sau). */
  cham_test: { tuanLech: 1, thu: 4 },
  /** Xác nhận Case · thêm PA: `ngay` thường, `ngayGap` khi Case gấp / SOS 3 (Progress Test lớp thường luôn `ngay`). */
  xac_nhan_case: { ngay: 5, ngayGap: 3 },
  xac_minh_tin_hieu: { ngay: 3 },
  ql_duyet_pa: { ngay: 5 },
  /** PA khác quy chế (`giu_pa_gv`, SOS-TAM-PA): hạn = hết ngày gửi + `ngay`; quá hạn QL chưa trả lời máy chốt theo GV (luật 11/11). */
  giu_pa_gv: { ngay: 3 },
  /** Ghi kết quả PA: mỗi `kyTuan` tuần một lần, hết thứ Ba (OV-12a). */
  ghi_kq_pa: { kyTuan: 2 },
  /** PA quy chế "1 tháng": ngày tạo + `ngay`, tới Chủ nhật kế. */
  ket_thuc_pa: { ngay: 31 },
  xu_ly_vi_pham: { ngay: 5 },
  /** Báo PH sau xử lý vi phạm (N2): `ngay` ngày lịch TÍNH CẢ ngày lưu (lưu T2 14/09 → hết T6 18/09). */
  bao_ph_vi_pham: { ngay: 5 },
  /** Chốt lộ trình lớp thường (N20): thứ `thu` của tuần lệch `tuanLech` so với tuần Final (T5 tuần trước). */
  chot_lo_trinh: { tuanLech: -1, thu: 5 },
  /** Bàn giao chuyển lớp: `ngay` ngày tính cả ngày ra lệnh (OV-13l). */
  ban_giao_chuyen_lop: { ngay: 7 },
  /** Bàn giao đổi GV (N29): hạn `ngay`; GV cũ còn xem lớp cũ thêm `xemNgay`. */
  ban_giao_doi_gv: { ngay: 5, xemNgay: 7 },
  buoc_tiep_sau_thi: { ngay: 7 },
  /** Xét lại lộ trình (N21) a/b/c: thứ `thu` của tuần lệch `tuanLech` so với tuần bắt đầu lớp mới (CN tuần 2). */
  xet_lai: { tuanLech: 1, thu: 8 },
} as const;

export type MaHan = keyof typeof HAN_MAC_DINH_GOC;
/** Tên việc của từng hạn (màn Hạn mặc định + nhật ký "trước → sau"). Trường phụ: `ngayGap` "(gấp)", `xemNgay` "(còn xem)". */
export const TEN_HAN: Record<MaHan, string> = {
  cham_test: 'Chấm Mock / Test lớp thường', xac_nhan_case: 'Xác nhận Case · thêm PA', xac_minh_tin_hieu: 'Xác nhận nguyên nhân Case', ql_duyet_pa: 'QL trả lời Chờ duyệt',
  giu_pa_gv: 'QL trả lời PA khác quy chế',
  ghi_kq_pa: 'Ghi kết quả PA', ket_thuc_pa: 'PA quy chế "1 tháng"', xu_ly_vi_pham: 'Xử lý vi phạm', bao_ph_vi_pham: 'Báo PH sau xử lý vi phạm',
  chot_lo_trinh: 'Chốt lộ trình lớp thường', ban_giao_chuyen_lop: 'Bàn giao chuyển lớp', ban_giao_doi_gv: 'Bàn giao đổi GV', buoc_tiep_sau_thi: 'Bước tiếp sau thi thật', xet_lai: 'Xét lại lộ trình',
};
const TEN_TRUONG_HAN: Record<string, string> = { ngay: '', ngayGap: ' (gấp)', xemNgay: ' (còn xem)', kyTuan: ' (tuần)', tuanLech: ' (tuần)', thu: ' (thứ)' };
/** Nhãn một trường của một hạn cho nhật ký: "Meeting CX / GĐCN", "Xác nhận Case · thêm PA (gấp)". */
/* Hạn đã chuyển nhà (chỉ còn trong nhật ký cũ): Meeting CX / GĐCN → Quản trị › Case & SOS (PTA 11/11, một hạn một chỗ sửa). */
const TEN_HAN_CU: Record<string, string> = { meeting_cx: 'Meeting CX / GĐCN' };
export const laMaHanNhatKy = (ma: string) => Object.hasOwn(TEN_HAN, ma) || Object.hasOwn(TEN_HAN_CU, ma);
export const nhanTruongHan = (ma: MaHan | string, truong: string) => `${(TEN_HAN as Record<string, string>)[ma] ?? TEN_HAN_CU[ma] ?? ma}${TEN_TRUONG_HAN[truong] ?? ` (${truong})`}`;
export type HanMacDinh = { -readonly [K in MaHan]: { -readonly [F in keyof (typeof HAN_MAC_DINH_GOC)[K]]: number } };
export const MA_HAN = Object.keys(HAN_MAC_DINH_GOC) as MaHan[];
/** Một phiên bản: `tu` = NGÀY có hiệu lực (giờ VN, đồng hồ nghiệp vụ); bản gốc `tu` = '' (trước mọi việc). */
export type BanHan = BanPhienBan<HanMacDinh>;

const GOC: BanHan = { id: 0, tu: '', v: HAN_MAC_DINH_GOC as unknown as HanMacDinh };
let nguon: () => readonly BanHan[] = () => [GOC];
/** Máy chủ / web đặt nguồn danh sách bản (cũ → mới). Phép kiểm đặt lại `datNguonHan(null)` = chỉ bản gốc. */
export function datNguonHan(f: (() => readonly BanHan[]) | null): void { nguon = f ?? (() => [GOC]); }
/** Mọi bản (cũ → mới) — câu SQL cần cửa sổ rộng nhất qua mọi bản rồi lọc lại bằng hàm theo bản của từng việc. */
export const cacBanHan = (): readonly BanHan[] => nguon();

/** Bản có hiệu lực tại `moc` (ngày / lúc của việc; thiếu = bây giờ = bản mới nhất). Khoá thiếu trong bản (bản cũ hơn mã) → giá trị gốc. */
export function hanTai<K extends MaHan>(ma: K, moc?: string | null): HanMacDinh[K] {
  return ((banTaiMoc(nguon(), moc) ?? GOC).v[ma] ?? HAN_MAC_DINH_GOC[ma]) as HanMacDinh[K];
}

/** Ngày lệch từ thứ Hai của tuần mốc: `tuanLech` tuần + (`thu` − 2) ngày. */
export const lechTuThuHai = (v: { tuanLech: number; thu: number }) => 7 * v.tuanLech + (v.thu - 2);

const GIOI: Record<string, [number, number]> = { ngay: [1, 60], ngayGap: [1, 60], xemNgay: [0, 60], kyTuan: [1, 4], tuanLech: [-2, 2], thu: [2, 8] };
/** Kiểm một bản trước khi lưu — trả câu lỗi đầu tiên (kèm mã hạn) hoặc null. Số nguyên trong giới hạn; gấp ≤ thường; đủ mọi khoá, không khoá lạ. */
export function kiemHanMacDinh(v: unknown): { ma: MaHan | null; loi: string } | null {
  if (!v || typeof v !== 'object') return { ma: null, loi: 'Thiếu dữ liệu hạn.' };
  const o = v as Record<string, Record<string, unknown>>;
  for (const ma of Object.keys(o)) if (!Object.hasOwn(HAN_MAC_DINH_GOC, ma)) return { ma: null, loi: `Hạn không có: ${ma}.` };
  for (const ma of MA_HAN) {
    const goc = HAN_MAC_DINH_GOC[ma] as Record<string, number>;
    const x = o[ma];
    if (!x || typeof x !== 'object') return { ma, loi: 'Thiếu giá trị.' };
    for (const k of Object.keys(goc)) {
      const n = x[k];
      const [a, b] = GIOI[k];
      if (typeof n !== 'number' || !Number.isInteger(n) || n < a || n > b) return { ma, loi: `Phải là số nguyên từ ${a} đến ${b}.` };
    }
    if (Object.keys(x).some((k) => !Object.hasOwn(goc, k))) return { ma, loi: 'Có trường lạ.' };
  }
  if ((o.xac_nhan_case.ngayGap as number) > (o.xac_nhan_case.ngay as number)) return { ma: 'xac_nhan_case', loi: 'Hạn Case gấp không dài hơn hạn thường.' };
  return null;
}
