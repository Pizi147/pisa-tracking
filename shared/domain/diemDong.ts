/**
 * DÒNG ĐIỂM CỦA MỘT HỌC VIÊN (PANEL-V10, luật N30) — một kiểu dữ liệu cho mọi panel có HV, bảng em và Học viên & Lớp.
 * Điểm kỹ năng là ĐẠT / KHÔNG ĐẠT của CHÍNH lượt (chủ SP 30/10): ký hiệu ✓ / ✗ trước số, không ▲ / ▼ (▲ ▼ chỉ cho tiến độ).
 * Máy chủ dựng từ dữ liệu hàm tính con số đã nạp (`server/src/worklist/diemDong.ts`); web chỉ vẽ.
 */
import { t } from '../i18n/index.ts';

/** `dat`: true đạt · false dưới kỳ vọng / ngưỡng · null chưa đủ căn cứ (chưa điểm, môn bỏ, không kỳ vọng). `cua`: kỹ năng GV đang xem phụ trách (hồ sơ GV). */
export type KnDiem = { k: string; v: number | null; dat: boolean | null; cua?: boolean };

export type DiemHv = {
  /** "MT3" · "Progress Test" · "Final" · "Thi thật". */
  luot: string;
  /** ISO thứ Hai tuần của lượt (web: `tuanLich`); thi thật: ISO ngày thi. */
  tuan: string | null;
  /** Lượt chưa chốt — kết luận còn đổi được. */
  tam: boolean;
  /** FT: L R W S; lớp thường: môn theo chương trình (`tenMonNgan`). */
  kn: KnDiem[];
  /** FT: band Overall (đủ bốn kỹ năng); lớp thường: % tổng (đủ môn). */
  overall: number | null;
  soVoi: { nhan: 'KV' | 'Target' | 'ngưỡng'; v: number } | null;
  /** `%`: lớp thường (điểm là tỉ lệ). Vắng = band. */
  donVi?: '%';
};

export function dauDiem(dat: boolean | null): '✓' | '✗' | null {
  return dat === null ? null : dat ? '✓' : '✗';
}

/** Một chữ số: "61 %" · band "6.5" · thang Cambridge (nguyên, ≥ 100 — band tối đa 9) "140". */
export const chuDiem = (v: number, pt = false): string =>
  (pt ? `${Math.round(v)} %` : v > 9 && Number.isInteger(v) ? String(v) : v.toFixed(1));

/** Chữ cho trình đọc màn hình / rê chuột: "R ✗ 5.0, dưới kỳ vọng 6.0" · "L ✓ 6.5" · "W chưa có điểm". */
export function nhanDocDiem(kn: KnDiem, soVoi: DiemHv['soVoi']): string {
  if (kn.v === null) return t('{k} chưa có điểm', { k: kn.k });
  const pt = soVoi?.nhan === 'ngưỡng';
  const goc = [kn.k, dauDiem(kn.dat), chuDiem(kn.v, pt)].filter(Boolean).join(' ');
  if (kn.dat !== false || !soVoi) return goc;
  const moc = chuDiem(soVoi.v, pt);
  return soVoi.nhan === 'Target' ? t('{goc}, dưới Target {moc}', { goc, moc })
    : soVoi.nhan === 'ngưỡng' ? t('{goc}, dưới ngưỡng {moc}', { goc, moc })
    : t('{goc}, dưới kỳ vọng {moc}', { goc, moc });
}

/** Đạt / không đạt của một điểm band so kỳ vọng (Học viên & Lớp `MiniKn`): null khi chưa có điểm, không kỳ vọng, hoặc KCK dưới kỳ vọng (trung tính như `ODiem kck`). */
export function datKv(v: number | null, kv: number | null, kck?: boolean): boolean | null {
  if (v === null || kv === null) return null;
  return v >= kv ? true : kck ? null : false;
}

/** Chữ ô điểm mini: "✗ 5.0" · "✓ 6.5" · "6.0" (không căn cứ) · "—" (chưa có). */
export function chuMiniKn(v: number | null, kv: number | null, kck?: boolean): string {
  if (v === null) return '—';
  return [dauDiem(datKv(v, kv, kck)), v.toFixed(1)].filter(Boolean).join(' ');
}
