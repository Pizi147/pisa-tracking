/**
 * BỘ CHỌN NGÀY / TUẦN / THÁNG (PR-UX3, G-6, N-4) — hàm thuần, không đọc đồng hồ trình duyệt.
 *
 * Ô ngày trong panel là `<select>` liệt kê vài lựa chọn gần hôm nay ("Hôm nay, 14/09"), không phải ô lịch của trình duyệt
 * (nó hiện `mm/dd/yyyy` theo máy người dùng). Mọi nhãn đi qua `ngay` / `tuanLich` (`hienThiNgay.ts`), nên cùng năm thì không hiện năm.
 * `giaTri` luôn là ISO (`2026-09-14`, thứ Hai của tuần, hoặc `2026-10` cho tháng) — thứ máy chủ đọc.
 */
import { ngayTheoGioVN } from './display.ts';
import { ngay, tuanLich } from './hienThiNgay.ts';
import { ATTEMPT_KIND_SHORT, khoaBai, nhanBai, type AttemptKind } from './normal.ts';
import { mondayOfDate } from './week.ts';
import { t } from '../i18n/index.ts';

export type LuaChon = { giaTri: string; nhan: string; phu?: string };

const DAY_MS = 86_400_000;
const THU = [t('Chủ nhật'), t('Thứ Hai'), t('Thứ Ba'), t('Thứ Tư'), t('Thứ Năm'), t('Thứ Sáu'), t('Thứ Bảy')];

function cong(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

/** `soNgay` ngày gần nhất, mới → cũ: "Hôm nay, 14/09" · "Hôm qua, 13/09" · "Thứ Bảy, 12/09". */
export function dsNgayGan(homNay: string, soNgay: number): LuaChon[] {
  const h = ngayTheoGioVN(homNay);
  if (!h) return [];
  const out: LuaChon[] = [];
  for (let i = 0; i < soNgay; i++) {
    const d = cong(h, -i);
    const thu = i === 0 ? t('Hôm nay') : i === 1 ? t('Hôm qua') : THU[new Date(`${d}T00:00:00Z`).getUTCDay()];
    out.push({ giaTri: d, nhan: `${thu}, ${ngay(d, h)}` });
  }
  return out;
}

/** Tuần từ `lui` tuần trước đến `toi` tuần sau tuần của `homNay`, cũ → mới. `giaTri` = thứ Hai; `phu` = "14/09 – 20/09". */
export function dsTuan(homNay: string, lui: number, toi: number): LuaChon[] {
  const h = ngayTheoGioVN(homNay);
  if (!h) return [];
  const thuHai = mondayOfDate(h);
  const out: LuaChon[] = [];
  for (let i = -lui; i <= toi; i++) {
    const t = cong(thuHai, i * 7);
    out.push({ giaTri: t, nhan: tuanLich(t, h), phu: `${ngay(t, h)} – ${ngay(cong(t, 6), h)}` });
  }
  return out;
}

/** Chủ nhật của tuần; có `homNay` thì không vượt hôm nay (máy chủ chặn ngày tương lai). */
export function cuoiTuan(thuHai: string, homNay?: string): string {
  const cn = cong(mondayOfDate(thuHai), 6);
  return homNay && cn > homNay ? homNay : cn;
}

/** `soThang` tháng từ tháng của `homNay`: `giaTri` '2026-10', nhãn '10/2026'. */
export function dsThang(homNay: string, soThang: number): LuaChon[] {
  const h = ngayTheoGioVN(homNay);
  if (!h) return [];
  let y = Number(h.slice(0, 4));
  let m = Number(h.slice(5, 7));
  const out: LuaChon[] = [];
  for (let i = 0; i < soThang; i++) {
    const mm = String(m).padStart(2, '0');
    out.push({ giaTri: `${y}-${mm}`, nhan: `${mm}/${y}` });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

/**
 * Nhãn ngắn của đợt kiểm tra: FT gọi MT{n}; lớp thường gọi "Giữa khoá" / "Cuối khoá" — không mang "MT" sang lớp thường.
 * `null` khi không có đợt.
 */
export function nhanDotNgan(kind: string | null | undefined, attemptNo: number | null | undefined): string | null {
  if (kind === 'checkpoint') return nhanBai(khoaBai(kind, attemptNo));   // OV-6b2: "Checkpoint 2"
  if (kind && kind !== 'mock') return ATTEMPT_KIND_SHORT[kind as AttemptKind] ?? t('Bài kiểm tra');
  return attemptNo ? `MT${attemptNo}` : null;
}
