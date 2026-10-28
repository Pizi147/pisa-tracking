/**
 * TỔNG KẾT LỘ TRÌNH (PR-TK) — luật thuần: lý do đóng, hướng tiếp, kết quả thi thật (Đích → Kết quả → Hướng tiếp), việc nhắc GVCN.
 * Bản chụp ghi ở `server/src/loTrinh/banChup.ts`; file này không đọc DB.
 */
import { addDaysIso } from './sos.ts';
import { tuanLich } from './hienThiNgay.ts';
import { t } from '../i18n/index.ts';

export const LY_DO_DONG = ['lo_trinh_moi', 'chuyen_lop', 'len_lop', 'hoc_lai', 'sang_ft', 'ket_thuc', 'tam_dung', 'sua_tay', 'khong_ro'] as const;
export type LyDoDong = (typeof LY_DO_DONG)[number];
export const LY_DO_DONG_NHAN: Record<LyDoDong, string> = {
  lo_trinh_moi: 'Lộ trình mới', chuyen_lop: 'Chuyển lớp', len_lop: 'Lên lớp', hoc_lai: 'Học lại', sang_ft: 'Lên FT',
  ket_thuc: 'Kết thúc học', tam_dung: 'Tạm dừng', sua_tay: 'Sửa tay', khong_ro: '—',
};
/** Tên có hậu tố TK: `HUONG_TIEP` đã là danh sách hướng của K26 (`lenLop.ts`). */
export const HUONG_TIEP_TK = ['hoc_lai', 'len_lt2', 'ket_thuc', 'len_ft', 'len_lop', 'chuyen_lop', 'lo_trinh_moi', 'tam_dung', 'khong_ro'] as const;
export type HuongTiepTk = (typeof HUONG_TIEP_TK)[number];
export const HUONG_TIEP_TK_NHAN: Record<HuongTiepTk, string> = {
  hoc_lai: 'Học lại', len_lt2: 'Lên LT2', ket_thuc: 'Kết thúc', len_ft: 'Lên FT', len_lop: 'Lên lớp',
  chuyen_lop: 'Chuyển lớp', lo_trinh_moi: 'Lộ trình mới', tam_dung: 'Tạm dừng', khong_ro: '—',
};

export function huongTiep(lyDo: LyDoDong, routeMoi: string | null): HuongTiepTk {
  switch (lyDo) {
    case 'lo_trinh_moi': return routeMoi === 'LT2' ? 'len_lt2' : 'lo_trinh_moi';
    case 'sang_ft': return 'len_ft';
    case 'ket_thuc': case 'hoc_lai': case 'len_lop': case 'chuyen_lop': case 'tam_dung': return lyDo;
    default: return 'khong_ro';
  }
}

/**
 * BƯỚC TIẾP SAU THI — OV-13m; P7 SV-LO-TRINH (N12): web còn HAI hướng (`HUONG_SAU_THI`): "Tạm dừng/ Kết thúc học" (hộp N11 ngay trong panel, ô "Có thể quay lại học"
 * tắt sẵn → máy chủ ghi `tam_dung` hoặc `ket_thuc` theo ô) · "Lộ trình mới". `LUA_CHON_SAU_THI` = khoá máy chủ nhận. `hoc_tiep` / `hoc_lai` (OV-8a) còn trong
 * dữ liệu cũ + API cũ — đọc, hoàn tác được, web không bày.
 */
export const LUA_CHON_SAU_THI = ['lo_trinh_moi', 'tam_dung', 'ket_thuc'] as const;
export const LUA_CHON_SAU_THI_CU = ['hoc_tiep', 'hoc_lai'] as const;
export type LuaChonSauThi = (typeof LUA_CHON_SAU_THI)[number] | (typeof LUA_CHON_SAU_THI_CU)[number];
export const NHAN_SAU_THI: Record<LuaChonSauThi, string> = {
  lo_trinh_moi: t('Lộ trình mới'), tam_dung: t('Tạm dừng'), ket_thuc: t('Kết thúc học'), hoc_tiep: t('Học tiếp lộ trình mới'), hoc_lai: t('Học lại'),
};
export const HUONG_SAU_THI = ['dung', 'lo_trinh_moi'] as const;
export type HuongSauThi = (typeof HUONG_SAU_THI)[number];
export const NHAN_HUONG_SAU_THI: Record<HuongSauThi, string> = { dung: t('Tạm dừng/ Kết thúc học'), lo_trinh_moi: t('Lộ trình mới') };
/** "Đã xong · OVR 6.5 · Đạt Target" — MỘT hàm nhãn cho Các lộ trình, đầu hồ sơ, panel Bước tiếp và dòng Công việc (OV-13m). */
/* Mockup bước tiếp chủ SP duyệt 15/10 dùng đúng chữ "Đã xong" cho lộ trình có kết quả thi (khác trạng thái việc "Xong" của S3) — chỉ ở file này. */
export const CHU_DA_XONG = t('Đã xong');
/** `ngan`: bỏ "Đã xong · " (dòng Công việc đã có tên việc "Chọn bước tiếp"). */
export function nhanDaXong(k: { khongThi: boolean; ovr: number | null; ketLuan: string | null }, ngan = false): string {
  const kl = k.ketLuan === 'reached' ? t('Đạt Target') : k.ketLuan === 'not_reached' ? t('Chưa đạt Target') : null;
  const ds = k.khongThi ? [t('Không thi')] : [k.ovr !== null ? `OVR ${k.ovr.toFixed(1)}` : null, kl].filter((x): x is string => !!x);
  return (ngan ? ds : [CHU_DA_XONG, ...ds]).join(' · ');
}
/** Gợi ý (chỉ chữ, QL vẫn chọn): Đạt Target → Tạm dừng/ Kết thúc học; chưa đạt / Không thi → Lộ trình mới (P7, sửa E9 — không trả `hoc_lai`); không có Target → không gợi ý. */
export function goiYSauThi(o: { khongThi: boolean; ketLuan: string | null }): HuongSauThi | null {
  if (o.khongThi || o.ketLuan === 'not_reached') return 'lo_trinh_moi';
  return o.ketLuan === 'reached' ? 'dung' : null;
}

/** Làm tròn về 0.5 gần nhất, .25 / .75 lên (như Excel). `server/src/fasttrack/scoring.ts` re-export hàm này. */
export function roundToHalf(value: number): number {
  return Math.round(value * 2 + 1e-9) / 2;
}

export type KetQuaThiThat = {
  ovr: number | null; ketLuan: 'reached' | 'not_reached' | 'unknown';
  nhan: 'Đạt Target' | 'Chưa đạt Target' | 'Chờ kết quả thi thật' | 'Không thi' | 'Chờ đủ 4 kỹ năng' | 'Không có Target';
};
type DiemThi = { l: number | null; r: number | null; w: number | null; s: number | null; khongThi: boolean };

/** Điểm thi thật: 0–9, bước 0.5. Sai → ném lỗi (nơi gọi đổi sang 400). */
export function diemThiHopLe(v: number | null): boolean {
  return v === null || (Number.isFinite(v) && v >= 0 && v <= 9 && Number.isInteger(v * 2));
}

export function ketQuaThiThat(o: DiemThi, target: number | null): KetQuaThiThat {
  const diem = [o.l, o.r, o.w, o.s];
  if (!diem.every(diemThiHopLe)) throw new Error('Điểm thi thật phải từ 0 đến 9, bước 0.5.');
  if (o.khongThi) return { ovr: null, ketLuan: 'unknown', nhan: 'Không thi' };
  if (diem.every((d) => d === null)) return { ovr: null, ketLuan: 'unknown', nhan: 'Chờ kết quả thi thật' };
  if (diem.some((d) => d === null)) return { ovr: null, ketLuan: 'unknown', nhan: 'Chờ đủ 4 kỹ năng' };
  const ovr = roundToHalf((diem as number[]).reduce((a, b) => a + b, 0) / 4);
  if (target === null) return { ovr, ketLuan: 'unknown', nhan: 'Không có Target' };
  return ovr >= target ? { ovr, ketLuan: 'reached', nhan: 'Đạt Target' } : { ovr, ketLuan: 'not_reached', nhan: 'Chưa đạt Target' };
}

/** TK-L: lộ trình FT còn chờ kết quả thi thật (chưa đủ 4 kỹ năng, không "Không thi") → "Kết thúc học" chưa lưu trữ. */
export function canChoThiThat(c: { laFt: boolean; cu?: boolean } & DiemThi): boolean {
  return c.laFt && !c.cu && !c.khongThi && [c.l, c.r, c.w, c.s].some((d) => d === null);
}
/** Kết quả CŨ (trước PR-TK, ngăn "Kết luận lộ trình"): có Overall hoặc kết luận chọn tay ≠ chưa rõ → đã có kết quả, không còn "chờ". */
export const coKetQuaCu = (c: { outcome?: string | null; outcome_score?: number | null }): boolean =>
  (c.outcome_score ?? null) !== null || (!!c.outcome && c.outcome !== 'unknown');

/**
 * OV-13q (chủ SP 16/10) — "ĐÃ THI XONG · HẠN 1 TUẦN": MỘT hàm trạng thái sau thi cho Công việc, Tổng quan, Học viên & Lớp, hồ sơ.
 * Ngày thi = ngày thi thật đã nhập, không thì ngày dự kiến; LT-SV (Q-C3 ① 21/10): chỉ tuần / chỉ tháng = "chưa chốt ngày" → KHÔNG có ngày thi (không
 * bịa ngày, không thành "đã thi"); không có dự kiến nào → ngày đóng lộ trình (giữ luật nhắc cũ). Từ HÔM SAU ngày thi: "Đã thi · chờ kết quả". Hạn gốc = ngày thi + 7, dùng chung cho Cập nhật kết quả và Chọn bước tiếp;
 * gia hạn (`han_sau_thi`) chỉ có hiệu lực khi muộn hơn hạn gốc (sửa ngày thi → hạn tính lại, gia hạn muộn hơn thì giữ). Bước tiếp: hạn = muộn hơn của
 * hạn đó và ngày có kết quả + 7 (SV-TVV-VIEC, 21/10-TVV: hạn 1 tuần từ khi có KQ; sửa kết quả không dời). Không chặn gì — chỉ là hạn.
 * SV-TVV-VIEC: "Đã thi · chờ kết quả" (việc Cập nhật KQ thi thật của TVV) KHÔNG hạn — `han` null, không quá hạn.
 * Vào: dòng `learning_cycles` (+ `exam_week` = thứ Hai tuần thi dự kiến, `ngay_kq` = ngày có kết quả lần đầu).
 */
export const NGAY_HAN_SAU_THI = 7;
export type GiaiDoanSauThi = 'chua_thi' | 'da_thi_cho_kq' | 'cho_buoc_tiep' | 'xong';
export type DongSauThi = {
  thi_that_ngay?: string | null; exam_date?: string | null; exam_week?: string | null; exam_month?: string | null; ended_at?: string | null;
  thi_that_khong_thi?: number | boolean | null; thi_that_l?: number | null; thi_that_r?: number | null; thi_that_w?: number | null; thi_that_s?: number | null;
  outcome?: string | null; outcome_score?: number | null; buoc_tiep?: string | null; ngay_kq?: string | null;
  han_sau_thi?: string | null; han_sau_thi_so_lan?: number | null;
};
export type TrangThaiSauThi = {
  giaiDoan: GiaiDoanSauThi; ngayThi: string | null; hanGoc: string | null; han: string | null;
  daGiaHan: boolean; soLanGiaHan: number; quaHan: boolean;
};
export function ngayThiSauThi(c: DongSauThi): string | null {
  const ngay = (v: string | null | undefined) => (v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);
  if (ngay(c.thi_that_ngay)) return ngay(c.thi_that_ngay);
  if (ngay(c.exam_date)) return ngay(c.exam_date);
  if (ngay(c.exam_week) || (c.exam_month && /^\d{4}-\d{2}$/.test(c.exam_month))) return null;
  return ngay(c.ended_at);
}
export function trangThaiSauThi(c: DongSauThi, homNay: string): TrangThaiSauThi {
  const coKq = !!c.thi_that_khong_thi || [c.thi_that_l, c.thi_that_r, c.thi_that_w, c.thi_that_s].every((x) => x !== null && x !== undefined) || coKetQuaCu(c);
  const ngayThi = ngayThiSauThi(c);
  const hanGoc = ngayThi ? addDaysIso(ngayThi, NGAY_HAN_SAU_THI) : null;
  const gh = c.han_sau_thi ? c.han_sau_thi.slice(0, 10) : null;
  const daGiaHan = !!gh && (!hanGoc || gh > hanGoc);
  let han = daGiaHan ? gh : hanGoc;
  const giaiDoan: GiaiDoanSauThi = coKq ? (c.buoc_tiep ? 'xong' : 'cho_buoc_tiep') : ngayThi && ngayThi < homNay ? 'da_thi_cho_kq' : 'chua_thi';
  const nkq = c.ngay_kq ? c.ngay_kq.slice(0, 10) : null;
  /* 21/10-TVV: hạn Chọn bước tiếp = muộn hơn của hạn gốc (ngày thi + 7 / gia hạn) và ngày có kết quả + 7 — không có ngày thi thì chỉ ngày có KQ + 7. */
  const mocKq = nkq ? addDaysIso(nkq, NGAY_HAN_SAU_THI) : null;
  if (giaiDoan === 'cho_buoc_tiep' && mocKq && (!han || mocKq > han)) han = mocKq;
  if (giaiDoan === 'da_thi_cho_kq') han = null;
  return {
    /* rà #436: hạn đang dùng đến từ ngày có kết quả (muộn hơn gia hạn) → không ghi "đã gia hạn". */
    giaiDoan, ngayThi, hanGoc, han, daGiaHan: daGiaHan && han === gh, soLanGiaHan: c.han_sau_thi_so_lan ?? 0,
    quaHan: (giaiDoan === 'da_thi_cho_kq' || giaiDoan === 'cho_buoc_tiep') && !!han && homNay > han,
  };
}
/**
 * OV-15a (mockup 1 §1d): hàng ĐÃ THI — nền cả hàng + chip ngắn "Đã thi · chờ KQ" → "Có KQ · chờ bước tiếp"; ngoài hai giai đoạn đó → null (hàng thường).
 * Cùng `trangThaiSauThi` với chữ dài (`chuSauThi`) và lọc "Đã thi · chờ kết quả".
 */
export function chipSauThi(s: Pick<TrangThaiSauThi, 'giaiDoan'> | null | undefined): string | null {
  if (!s) return null;
  return s.giaiDoan === 'da_thi_cho_kq' ? t('Đã thi · chờ KQ') : s.giaiDoan === 'cho_buoc_tiep' ? t('Có KQ · chờ bước tiếp') : null;
}
/** Chữ trạng thái — cột "Target · Dự kiến thi", panel một em, đầu hồ sơ: "Đã thi · chờ kết quả" · `CHU_DA_XONG` + "chờ bước tiếp" (hạn nơi gọi ghép). */
export function chuSauThi(s: Pick<TrangThaiSauThi, 'giaiDoan'>): string | null {
  if (s.giaiDoan !== 'da_thi_cho_kq' && s.giaiDoan !== 'cho_buoc_tiep') return null;
  return s.giaiDoan === 'da_thi_cho_kq' ? t('Đã thi · chờ kết quả') : `${CHU_DA_XONG} · ${t('chờ bước tiếp')}`;
}

/** Q2: lượt đại diện cho bảng cả lớp FT — MT cuối có OVR (không huỷ); không có → MT cuối bất kỳ. */
export function luotDaiDien<T extends { attemptNo: number; huy: boolean; overall: number | null }>(luot: T[]): T | null {
  const theoSo = [...luot].sort((a, b) => b.attemptNo - a.attemptNo);
  return theoSo.find((l) => !l.huy && l.overall !== null) ?? theoSo[0] ?? null;
}

/** 'W2 MAY – W3 SEP' · 'W1 JUN – nay'. */
export function khoangTuan(batDau: string | null, ketThuc: string | null, homNay: string): string {
  if (!batDau) return '—';
  return `${tuanLich(batDau, homNay)} – ${ketThuc ? tuanLich(ketThuc, homNay) : 'nay'}`;
}
