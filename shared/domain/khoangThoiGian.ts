/**
 * BỘ CHỌN THỜI GIAN CHUNG CỦA PHÂN TÍCH (OV-15e, C29, mockup 3 mục 3) — `2 tuần vừa qua · Theo tuần (Từ – Đến) · Theo tháng · Tùy chọn`.
 * URL mang ngày đầu – cuối (`kieu`, `tu`, `den`; vắng = 2 tuần vừa qua), giữ khi đổi tab. Máy chủ và web cùng đọc bằng `khoangTuUrl`.
 * Tuần nghiệp vụ T2 → CN; tuần thuộc tháng chứa thứ Năm (`owningMonthOf`).
 */
import { addDaysIso } from './sos.ts';
import { MONTH_CODE, mondayOfDate, owningMonthOf, weekNumberInMonthOf } from './week.ts';
import { t } from '../i18n/index.ts';

export const KIEU_KHOANG = ['2-tuan', 'tuan', 'thang', 'tuy-chon'] as const;
export type KieuKhoang = (typeof KIEU_KHOANG)[number];
export const NHAN_KIEU_KHOANG: Record<KieuKhoang, string> = {
  '2-tuan': t('2 tuần vừa qua'), tuan: t('Theo tuần'), thang: t('Theo tháng'), 'tuy-chon': t('Tùy chọn'),
};
/** `tu`, `den` là NGÀY (gồm cả hai đầu). Theo tuần / tháng / 2 tuần: `tu` Thứ Hai, `den` Chủ nhật. */
export type KhoangNgay = { kieu: KieuKhoang; tu: string; den: string };
/** 52 tuần — bảng mở nhanh, Turso đọc vừa phải; cùng trần với Hiệu quả PA (`HQ_PA_TOI_DA_TUAN`). */
export const TOI_DA_NGAY_KHOANG = 364;

const NGAY = /^\d{4}-\d{2}-\d{2}$/;
const laNgay = (s: string | null | undefined): s is string =>
  !!s && NGAY.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const soNgay = (tu: string, den: string) => Math.round((Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`)) / 86_400_000) + 1;

/** C24: hai tuần HOÀN CHỈNH trước tuần chứa `homNay` (đang W3 OCT → W1 + W2 OCT; đang W1 JAN/2027 → hai tuần cuối 12/2026). */
export function khoangMacDinh(homNay: string): KhoangNgay {
  const t2 = mondayOfDate(homNay);
  return { kieu: '2-tuan', tu: addDaysIso(t2, -14), den: addDaysIso(t2, -1) };
}

/** Các tuần thuộc tháng `YYYY-MM` (Thứ Hai đầu → Chủ nhật cuối). Tháng sai → null. */
export function khoangThang(thang: string): { tu: string; den: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(thang);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  const cua = (x: string) => { const o = owningMonthOf(x); return o.year === Number(m[1]) && o.month === Number(m[2]); };
  let tu = mondayOfDate(`${thang}-01`);
  if (!cua(tu)) tu = addDaysIso(tu, 7);
  let cuoi = tu;
  while (cua(addDaysIso(cuoi, 7))) cuoi = addDaysIso(cuoi, 7);
  return { tu, den: addDaysIso(cuoi, 6) };
}

/** Lỗi của một khoảng (máy chủ trả 400 bằng chữ này) — null = hợp lệ. */
export function loiKhoang(k: { tu: string; den: string }): string | null {
  if (!laNgay(k.tu) || !laNgay(k.den)) return t('Ngày không hợp lệ (YYYY-MM-DD).');
  if (k.tu > k.den) return t('Ngày đầu phải trước ngày cuối.');
  if (soNgay(k.tu, k.den) > TOI_DA_NGAY_KHOANG) return t('Khoảng tối đa 52 tuần.');
  return null;
}

/**
 * ĐỌC KHOẢNG TỪ URL. `kieu` + `tu` + `den` (mới); không có → link CŨ: `thang=YYYY-MM` (Phân tích GV), `tu`/`den` Thứ Hai (Hiệu quả PA, GV — `den` là
 * Thứ Hai tuần cuối), `tg=n` (n tuần tới tuần này); không gì cả → 2 tuần vừa qua. Theo tuần / tháng / 2 tuần luôn chuẩn về Thứ Hai → Chủ nhật.
 */
export function khoangTuUrl(q: { get(k: string): string | null }, homNay: string): KhoangNgay {
  const kieu = q.get('kieu') as KieuKhoang | null;
  const tu = q.get('tu'), den = q.get('den');
  const thang = q.get('thang');
  if (kieu === 'thang' || (!kieu && thang)) {
    const k = khoangThang(thang ?? (tu ?? '').slice(0, 7));
    if (k) return { kieu: 'thang', ...k };
  }
  if (laNgay(tu) && laNgay(den) && (kieu === 'tuy-chon' || kieu === 'tuan' || kieu === '2-tuan' || !kieu)) {
    if (kieu === 'tuy-chon') return { kieu, tu, den };
    return { kieu: kieu === '2-tuan' ? '2-tuan' : 'tuan', tu: mondayOfDate(tu), den: addDaysIso(mondayOfDate(den), 6) };
  }
  const tg = Number(q.get('tg'));
  if (Number.isInteger(tg) && tg > 0 && tg <= 53) {
    const t2 = mondayOfDate(homNay);
    return { kieu: 'tuan', tu: addDaysIso(t2, -7 * (tg - 1)), den: addDaysIso(t2, 6) };
  }
  return khoangMacDinh(homNay);
}

/** Tham số URL của một khoảng — 2 tuần vừa qua (mặc định) không ghi gì. */
export function thamSoKhoang(k: KhoangNgay, homNay: string): Record<string, string> {
  const md = khoangMacDinh(homNay);
  if (k.kieu === '2-tuan' && k.tu === md.tu && k.den === md.den) return {};
  return { kieu: k.kieu, tu: k.tu, den: k.den };
}

/** Thứ Hai tuần đầu / tuần cuối — bộ lọc theo tuần thi (`rp.week_start BETWEEN tuanDau AND tuanCuoi`). */
export const tuanCuaKhoang = (k: { tu: string; den: string }) => ({ tuanDau: mondayOfDate(k.tu), tuanCuoi: mondayOfDate(k.den) });

/** Khoảng liền trước, cùng độ dài — cột "So 2 tuần trước". */
export function khoangTruoc(k: { tu: string; den: string }): { tu: string; den: string } {
  const n = soNgay(k.tu, k.den);
  return { tu: addDaysIso(k.tu, -n), den: addDaysIso(k.tu, -1) };
}

const maTuan = (d: string) => {
  const t2 = mondayOfDate(d);
  return { ma: `W${weekNumberInMonthOf(t2)} ${MONTH_CODE[owningMonthOf(t2).month - 1]}`, nam: owningMonthOf(t2).year, thang: owningMonthOf(t2).month };
};
const ngayNgan = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/**
 * NHÃN KHOẢNG — luôn có năm (mockup 3): `W1 + W2 OCT/2026` · `W4 AUG – W3 OCT/2026` · `W5 DEC/2026 – W1 JAN/2027` · tháng `10/2026`;
 * dòng phụ `28/09 – 11/10/2026 · 2 tuần` (Tùy chọn: `· 41 ngày`).
 */
export function nhanKhoang(k: KhoangNgay): { chinh: string; phu: string } {
  const a = maTuan(k.tu), b = maTuan(k.den);
  const soTuan = Math.round((Date.parse(`${mondayOfDate(k.den)}T00:00:00Z`) - Date.parse(`${mondayOfDate(k.tu)}T00:00:00Z`)) / (7 * 86_400_000)) + 1;
  let chinh: string;
  if (k.kieu === 'thang') chinh = `${String(a.thang).padStart(2, '0')}/${a.nam}`;
  else if (a.ma === b.ma && a.nam === b.nam) chinh = `${a.ma}/${a.nam}`;
  else if (a.nam !== b.nam) chinh = `${a.ma}/${a.nam} – ${b.ma}/${b.nam}`;
  else if (soTuan === 2 && a.thang === b.thang) chinh = `${a.ma.split(' ')[0]} + ${b.ma}/${b.nam}`;
  else chinh = `${a.ma} ${soTuan === 2 ? '+' : '–'} ${b.ma}/${b.nam}`;
  const dai = k.kieu === 'tuy-chon' ? t('{n} ngày', { n: soNgay(k.tu, k.den) }) : t('{n} tuần', { n: soTuan });
  const tuChu = k.tu.slice(0, 4) === k.den.slice(0, 4) ? ngayNgan(k.tu) : `${ngayNgan(k.tu)}/${k.tu.slice(0, 4)}`;
  return { chinh, phu: `${tuChu} – ${ngayNgan(k.den)}/${k.den.slice(0, 4)} · ${dai}` };
}
