/**
 * Ô NGÀY THỐNG NHẤT (T11, YC-9) — luật đọc/ghi thuần. Gõ dd/mm/yyyy (nhận dd/mm, d/m/yyyy, dấu . -), tháng mm/yyyy; lịch tự vẽ
 * dùng `luoiThang`. Luật từng chỗ (không sau hôm nay, tuần về Thứ Hai…) truyền qua `LuatONgay`. Không đọc đồng hồ trình duyệt.
 */
import { cuoiTuan, dsNgayGan, dsThang, dsTuan, type LuaChon } from './chonNgay.ts';
import { ngay, tuanLich } from './hienThiNgay.ts';
import { mondayOfDate } from './week.ts';

export const KIEU_O_NGAY = ['ngay', 'tuan', 'thang', 'ngay-hoac-thang'] as const;
export type KieuONgay = (typeof KIEU_O_NGAY)[number];
export type LuatONgay = { toiThieu?: string | null; toiDa?: string | null; moc?: 'dau' | 'cuoi'; catHomNay?: boolean };
export type KetQuaDocNgay = { iso: string; loi: null } | { iso: null; loi: string | null };

const DAY = 86_400_000;
const cong = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const p2 = (x: number | string) => String(x).padStart(2, '0');
function hop(y: number, m: number, d: number): string | null {
  /* PR-Dọn (VN20): năm đệm đủ 4 chữ số — "0208" từng thành "208-…", không đọc được, báo nhầm "Ngày không có thật" thay vì câu cận năm. */
  const iso = `${String(y).padStart(4, '0')}-${p2(m)}-${p2(d)}`;
  const t = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== iso ? null : iso;
}
const thangHien = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * Giá trị lưu của một tuần: Thứ Hai, hoặc Chủ nhật khi `moc="cuoi"`. Chủ nhật chỉ cắt về hôm nay khi tuần đó chứa hôm nay
 * (và `catHomNay` không tắt); tuần tương lai giữ Chủ nhật thật để `loiKhoangNgay` chặn, không lặng lẽ đổi thành hôm nay.
 */
export function chotTuan(iso: string, homNay: string, luat: LuatONgay): string {
  if (luat.moc !== 'cuoi') return mondayOfDate(iso);
  return cuoiTuan(iso, luat.catHomNay === false || mondayOfDate(iso) > homNay ? undefined : homNay);
}

export function loiKhoangNgay(iso: string, homNay: string, luat: LuatONgay = {}): string | null {
  const la = iso.length === 7;                                   // giá trị là tháng thì so theo tháng
  const cat = (x: string) => (la ? x.slice(0, 7) : x);
  const chu = (x: string) => (la ? `tháng ${thangHien(x)}` : x === homNay ? 'hôm nay' : ngay(x, homNay));
  if (luat.toiDa && iso > cat(luat.toiDa)) return `Không được sau ${chu(luat.toiDa)}`;
  if (luat.toiThieu && iso < cat(luat.toiThieu)) return `Không được trước ${chu(luat.toiThieu)}`;
  return null;
}

export function docONgay(text: string, kieu: KieuONgay, homNay: string, luat: LuatONgay = {}): KetQuaDocNgay {
  const s = text.trim();
  if (!s) return { iso: null, loi: null };
  const phan = s.split(/[/.\-\s]+/).filter(Boolean);
  const mauLoi = kieu === 'thang' ? 'Gõ dạng mm/yyyy' : 'Gõ dạng dd/mm/yyyy';
  if (phan.length < 2 || phan.length > 3 || phan.some((x) => !/^\d{1,4}$/.test(x))) return { iso: null, loi: mauLoi };
  let iso: string | null;
  if (kieu === 'thang' || (kieu === 'ngay-hoac-thang' && phan.length === 2 && phan[1].length === 4)) {
    const [m, y] = phan.length === 3 ? [phan[1], phan[2]] : [phan[0], phan[1]];
    if (y.length !== 4 || +m < 1 || +m > 12) return { iso: null, loi: 'Gõ dạng mm/yyyy' };
    iso = `${y}-${p2(m)}`;
  } else {
    const y = phan[2] ?? homNay.slice(0, 4);
    if (y.length !== 4) return { iso: null, loi: 'Năm cần đủ 4 số, ví dụ 28/09/2026' };
    iso = hop(+y, +phan[1], +phan[0]);
    if (!iso) return { iso: null, loi: 'Ngày không có thật' };
    if (kieu === 'tuan') iso = chotTuan(iso, homNay, luat);
  }
  const loi = loiKhoangNgay(iso, homNay, luat);
  return loi ? { iso: null, loi } : { iso, loi: null };
}

/**
 * Rời ô (blur/Enter): `phat` là giá trị báo lên nơi gọi (`null` = không báo), `text`/`loi` là thứ ô hiện.
 * - Chữ chưa sửa: không kiểm lại (giá trị cũ ngoài luật không bị báo lỗi khi chỉ Tab qua).
 * - Xoá chữ: báo '' rồi hiện lại theo `value` (nơi gọi có mặc định như `detectedAt || homNay` thì ô không trống giả).
 * - Gõ sai: báo '' như ô ngày trình duyệt cũ để luật chặn Lưu của form bắt được; giữ chữ đã gõ + lỗi.
 */
export function chotONgay(text: string, value: string | null, kieu: KieuONgay, homNay: string, luat: LuatONgay = {}):
  { phat: string | null; text: string; loi: string | null } {
  const v = value || '';
  if (text === hienONgay(v, kieu)) return { phat: null, text, loi: null };
  const r = docONgay(text, kieu, homNay, luat);
  if (r.iso) return { phat: r.iso !== v ? r.iso : null, text: hienONgay(r.iso, kieu), loi: null };
  if (!text.trim()) return { phat: v ? '' : null, text: hienONgay(v, kieu), loi: null };
  return { phat: v ? '' : null, text, loi: r.loi };
}

/** `value` từ nơi gọi đổi: chỉ viết lại chữ khi chữ đang có không ứng với `value` — '' do chính ô báo khi gõ sai giữ nguyên chữ + lỗi. */
export function canDongBoONgay(text: string, value: string | null, kieu: KieuONgay, homNay: string, luat: LuatONgay = {}): boolean {
  return (docONgay(text, kieu, homNay, luat).iso ?? '') !== (value || '');
}

export function hienONgay(iso: string | null | undefined, kieu: KieuONgay): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}$/.test(iso) || kieu === 'thang') return thangHien(iso);
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

export function phuONgay(iso: string | null | undefined, kieu: KieuONgay, homNay: string): string {
  if (kieu !== 'tuan' || !iso) return '';
  const t2 = mondayOfDate(iso);
  return `${tuanLich(t2, homNay)} · ${ngay(t2, homNay)} – ${ngay(cong(t2, 6), homNay)}`;
}


const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const NHAN_TUAN = ['Tuần này', 'Tuần trước', '2 tuần trước'];
const NHAN_TUAN_TOI = ['Tuần này', 'Tuần sau', '2 tuần sau'];

/**
 * "Gần đây" dưới ô ngày — vài lựa chọn bấm một lần, đã lọc qua luật từng chỗ (`loiKhoangNgay`).
 * Ngày: 5 ngày lùi từ hôm nay; chỗ chỉ nhận hôm nay trở đi (lọc xong còn < 3) → 5 ngày từ hôm nay tới.
 * Tuần: tuần này · tuần trước · 2 tuần trước; chỗ chỉ nhận từ tuần này (lọc còn < 3) → tuần này · tuần sau · 2 tuần sau
 * (`moc="cuoi"` → giá trị là Chủ nhật). Tháng: 3 tháng, lùi khi `toiDa` ≤ tháng này.
 */
export function goiYGanDay(kieu: KieuONgay, homNay: string, luat: LuatONgay = {}): LuaChon[] {
  const loc = (ds: LuaChon[]) => ds.filter((x) => loiKhoangNgay(x.giaTri, homNay, luat) === null);
  if (kieu === 'tuan') {
    const tuan = (ds: LuaChon[], nhan: string[]) => loc(ds.map((x, i) => ({
      giaTri: chotTuan(x.giaTri, homNay, luat),
      nhan: nhan[i],
      phu: `${x.nhan} · ${x.phu}`,
    })));
    const lui = tuan(dsTuan(homNay, 2, 0).reverse(), NHAN_TUAN);
    return lui.length >= 3 ? lui : tuan(dsTuan(homNay, 0, 2), NHAN_TUAN_TOI);
  }
  if (kieu === 'thang') {
    const thangNay = homNay.slice(0, 7);
    let ds: LuaChon[];
    if (luat.toiDa && luat.toiDa.slice(0, 7) <= thangNay) {
      ds = [];
      let y = Number(thangNay.slice(0, 4));
      let m = Number(thangNay.slice(5, 7));
      for (let i = 0; i < 3; i++) {
        ds.push({ giaTri: `${y}-${p2(m)}`, nhan: `${p2(m)}/${y}` });
        m -= 1;
        if (m < 1) { m = 12; y -= 1; }
      }
    } else {
      ds = dsThang(homNay, 3);
    }
    return loc(ds.map((x) => (x.giaTri === thangNay ? { ...x, nhan: 'Tháng này' } : x)));
  }
  // 'ngay' và 'ngay-hoac-thang': gợi ý theo ngày
  const lui = loc(dsNgayGan(homNay, 5));
  if (lui.length >= 3) return lui;
  const toi: LuaChon[] = [];
  for (let i = 0; i < 5; i++) {
    const d = cong(homNay, i);
    const thu = i === 0 ? 'Hôm nay' : THU[new Date(`${d}T00:00:00Z`).getUTCDay()];
    toi.push({ giaTri: d, nhan: `${thu}, ${ngay(d, homNay)}` });
  }
  return loc(toi);
}

/** Lưới lịch tháng tròn tuần: mỗi hàng Thứ Hai → Chủ nhật, có ngày đệm của tháng liền kề (như `monthGrid` của `WeekPicker`). */
export function luoiThang(nam: number, thang: number): string[][] {
  const dau = `${nam}-${p2(thang)}-01`;
  const cuoi = `${nam}-${p2(thang)}-${p2(new Date(Date.UTC(nam, thang, 0)).getUTCDate())}`;
  const hang: string[][] = [];
  let d = mondayOfDate(dau);
  do {
    const h: string[] = [];
    for (let i = 0; i < 7; i++) { h.push(d); d = cong(d, 1); }
    hang.push(h);
  } while (hang[hang.length - 1][6] < cuoi);
  return hang;
}
