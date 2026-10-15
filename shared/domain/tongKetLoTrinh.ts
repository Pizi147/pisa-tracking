/**
 * TỔNG KẾT LỘ TRÌNH (PR-TK) — luật thuần: lý do đóng, hướng tiếp, kết quả thi thật (Đích → Kết quả → Hướng tiếp), việc nhắc GVCN.
 * Bản chụp ghi ở `server/src/loTrinh/banChup.ts`; file này không đọc DB.
 */
import { addDaysIso } from './sos.ts';
import { tuanLich } from './hienThiNgay.ts';
import { mondayOfDate } from './week.ts';
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
 * BƯỚC TIẾP SAU THI — OV-13m (chủ SP 15/10): ba lựa chọn Lộ trình mới · Tạm dừng · Thôi học (`ket_thuc` = Kết thúc học + Lưu trữ, giữ khoá cũ).
 * `hoc_tiep` / `hoc_lai` (OV-8a) còn trong dữ liệu cũ + API cũ — đọc, hoàn tác được, web không bày nữa.
 */
export const LUA_CHON_SAU_THI = ['lo_trinh_moi', 'tam_dung', 'ket_thuc'] as const;
export const LUA_CHON_SAU_THI_CU = ['hoc_tiep', 'hoc_lai'] as const;
export type LuaChonSauThi = (typeof LUA_CHON_SAU_THI)[number] | (typeof LUA_CHON_SAU_THI_CU)[number];
export const NHAN_SAU_THI: Record<LuaChonSauThi, string> = {
  lo_trinh_moi: t('Lộ trình mới'), tam_dung: t('Tạm dừng'), ket_thuc: t('Thôi học'), hoc_tiep: t('Học tiếp lộ trình mới'), hoc_lai: t('Học lại'),
};
/** "Đã xong · OVR 6.5 · Đạt Target" — MỘT hàm nhãn cho Các lộ trình, đầu hồ sơ, panel Bước tiếp và dòng Công việc (OV-13m). */
export function nhanDaXong(k: { khongThi: boolean; ovr: number | null; ketLuan: string | null }): string {
  if (k.khongThi) return t('Đã xong · Không thi');
  const kl = k.ketLuan === 'reached' ? t('Đạt Target') : k.ketLuan === 'not_reached' ? t('Chưa đạt Target') : null;
  if (k.ovr === null) return kl ? t('Đã xong · {kl}', { kl }) : t('Đã xong');
  return kl ? t('Đã xong · OVR {ovr} · {kl}', { ovr: k.ovr.toFixed(1), kl }) : t('Đã xong · OVR {ovr}', { ovr: k.ovr.toFixed(1) });
}
/** Gợi ý (chỉ chữ, QL vẫn chọn): Đạt Target → Kết thúc; chưa đạt / Không thi → Học lại; không có Target → không gợi ý. */
export function goiYSauThi(o: { khongThi: boolean; ketLuan: string | null }): LuaChonSauThi | null {
  if (o.khongThi || o.ketLuan === 'not_reached') return 'hoc_lai';
  return o.ketLuan === 'reached' ? 'ket_thuc' : null;
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
 * Việc nhắc "Cập nhật kết quả thi thật": hiện từ thứ Hai ĐẦU TIÊN SAU ngày thi / tuần thi / tháng thi dự kiến (cụ thể nhất thắng);
 * không có dự kiến → thứ Hai sau ngày đóng. Hạn = mốc + 4 tuần. `thangThi` 'YYYY-MM'; `tuanThi` = thứ Hai của tuần thi.
 */
export function mocNhacThiThat(o: { thangThi: string | null; tuanThi: string | null; ngayThi: string | null; ngayDong: string | null }): { tu: string; han: string } | null {
  let sau: string | null = null;
  if (o.ngayThi) sau = o.ngayThi;
  else if (o.tuanThi) sau = addDaysIso(mondayOfDate(o.tuanThi), 6);
  else if (o.thangThi && /^\d{4}-\d{2}$/.test(o.thangThi)) {
    sau = addDaysIso(`${o.thangThi}-01`, new Date(Date.UTC(+o.thangThi.slice(0, 4), +o.thangThi.slice(5, 7), 0)).getUTCDate() - 1);
  } else sau = o.ngayDong;
  if (!sau) return null;
  const tu = addDaysIso(mondayOfDate(sau), 7);
  return { tu, han: addDaysIso(tu, 28) };
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
