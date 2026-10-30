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

const so = (v: number, pt: boolean) => (pt ? `${Math.round(v)} %` : v.toFixed(1));

/** Chữ cho trình đọc màn hình / rê chuột: "R ✗ 5.0, dưới kỳ vọng 6.0" · "L ✓ 6.5" · "W chưa có điểm". */
export function nhanDocDiem(kn: KnDiem, soVoi: DiemHv['soVoi']): string {
  if (kn.v === null) return t('{k} chưa có điểm', { k: kn.k });
  const pt = soVoi?.nhan === 'ngưỡng';
  const goc = [kn.k, dauDiem(kn.dat), so(kn.v, pt)].filter(Boolean).join(' ');
  if (kn.dat !== false || !soVoi) return goc;
  const moc = so(soVoi.v, pt);
  return soVoi.nhan === 'Target' ? t('{goc}, dưới Target {moc}', { goc, moc })
    : soVoi.nhan === 'ngưỡng' ? t('{goc}, dưới ngưỡng {moc}', { goc, moc })
    : t('{goc}, dưới kỳ vọng {moc}', { goc, moc });
}
