import type { ReactNode } from 'react';
import { lopKq } from './BieuTuong.tsx';
import { t } from '@shared/i18n/index.ts';

type Kq = 'vuot' | 'bang' | 'duoi' | null;
const chuKq = (kq: 'vuot' | 'bang' | 'duoi') => (kq === 'duoi' ? t('Dưới kỳ vọng') : kq === 'bang' ? t('Bằng kỳ vọng') : t('Vượt kỳ vọng'));

/**
 * Ô ĐIỂM MỘT MẪU (BANG-0, 04 mục 7) — thay 7+ dáng ô điểm (BANG-1 chuyển 29 nơi). Tô CHÍNH con số + chữ "✓ " / "✗ " đứng TRƯỚC trong CÙNG span
 * (mockup audit 03/11 `.da / .dd`: cùng cỡ, đậm 700, cùng màu số — vượt xanh lá · bằng xanh dương · dưới đỏ; `lon` dấu 17 px ≈ `.od .s small` 16 px, theo thang chữ);
 * chỗ ký hiệu giữ (ẩn) khi có số mà không có kết quả để số thẳng cột. KCK dưới kỳ vọng = trung tính + chữ "KCK" (13/10).
 * - `doc` 56 px · `sua` hộp 64 × 32 (trống = viền đứt; dấu lưu góc trên phải, xám; lỗi = viền đỏ + "Lưu lại") ·
 *   `ti-le` "✗ 17/25" (căn theo "/", mẫu số khác tổng của cột = chữ vàng + "đề khác") · `lon` 28 px (hồ sơ Mock).
 * - Một dòng phụ 12 px (`phu`) dưới ô — ưu tiên "thiếu nhận xét" > "vắng lần n" > "n câu" do nơi gọi chọn.
 */
export function ODiem({ kieu = 'doc', so, kq = null, kck, tong, tongCot, phu, luu, onBam, onLuuLai, nhan, kyVong }: {
  /** BANG-EM-GON: `gon` = 15 px — U03 (mockup `.da / .dd / .bg`, chủ SP 04/11): mọi số đậm 700 (trước: chỉ số hụt). Chỉ bảng hồ sơ lớp dùng. */
  kieu?: 'doc' | 'sua' | 'ti-le' | 'lon' | 'gon';
  /** Chữ số đã định dạng ("6.5", "17"); null = chưa có. */
  so: string | null;
  kq?: Kq;
  kck?: boolean;
  /** `ti-le`: tổng của bài này / tổng phổ biến của cột. */
  tong?: number; tongCot?: number;
  phu?: ReactNode;
  luu?: 'dang-luu' | 'da-luu' | 'loi';
  onBam?: () => void;
  onLuuLai?: () => void;
  /** Tên kỹ năng / cột cho trình đọc màn ("L") + kỳ vọng ("6.5"). */
  nhan?: string; kyVong?: string;
}) {
  const kqHien: Kq = kck && kq === 'duoi' ? null : kq;
  const mau = lopKq(kqHien);
  const ten = [nhan, so ?? t('Chưa có'), kq ? `— ${kck && kq === 'duoi' ? 'KCK' : chuKq(kq)}${kyVong ? ` ${kyVong}` : ''}` : ''].filter(Boolean).join(' ');
  /* "✓ " / "✗ " trong cùng span với số (kế thừa cỡ, đậm, màu); không kết quả → giữ chỗ ẩn để số thẳng cột (trừ `lon`). */
  const kyHieu = so === null ? null : kqHien
    ? <span aria-hidden className={kieu === 'lon' ? 'mr-0.5 text-[17px]' : undefined}>{kqHien === 'duoi' ? '✗' : '✓'} </span>
    : kieu === 'lon' ? null : <span aria-hidden className="invisible">✓ </span>;
  const deKhac = kieu === 'ti-le' && tong != null && tongCot != null && tong !== tongCot;
  const so_ = so === null ? <span className="text-faint">—</span> : kieu === 'ti-le'
    ? <>
        <span className={`inline-block min-w-[2ch] whitespace-nowrap text-right text-[15px] font-bold ${mau}`}>{kyHieu}{so}</span>
        <span className={`inline-block min-w-[3ch] text-left text-[13px] font-normal ${deKhac ? 'text-soon' : 'text-faint'}`} title={deKhac ? t('Đề khác') : undefined}>/{tong}</span>
      </>
    : <span className={`whitespace-nowrap ${kieu === 'lon' ? 'text-[28px] leading-none' : 'text-[15px]'} font-bold ${mau}`}>{kyHieu}{so}</span>;
  const dongPhu = (phu || (kck && kq === 'duoi')) && (
    <span className="block text-[12px] leading-4 text-faint" data-phu-odiem="">{phu ?? 'KCK'}</span>
  );

  if (kieu !== 'sua') {
    return (
      <span className={`inline-flex flex-col ${kieu === 'ti-le' ? 'items-center' : 'items-start'}`}>
        <span className="inline-flex items-baseline tabular-nums" aria-label={ten} role="img">{so_}</span>
        {dongPhu}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-center">
      <button type="button" onClick={onBam} aria-label={ten} data-trong={so === null || undefined}
        className={`o-sua relative inline-flex h-8 w-16 items-center justify-center gap-1 tabular-nums max-sm:h-11 ${so === null ? 'border-dashed' : ''} ${luu === 'loi' ? '!border-bad' : ''}`}>
        {so === null ? <span className="text-transparent" aria-hidden>0</span> : so_}
        {luu === 'dang-luu' && <span className="absolute right-0.5 top-0 text-[12px] leading-none text-slate-400" title={t('Đang lưu…')}>◷</span>}
        {luu === 'da-luu' && <span className="absolute right-0.5 top-0 text-[12px] leading-none text-slate-400" title={t('Đã lưu')}>✓</span>}
      </button>
      {luu === 'loi'
        ? <button type="button" data-phu-odiem="" className="link mt-1 appearance-none border-0 bg-transparent p-0 text-[12px] font-semibold leading-4 text-bad" onClick={onLuuLai}>{t('Lưu lại')}</button>
        : dongPhu}
    </span>
  );
}

/**
 * Ô "KHÔNG HỌC" (P8 N13, mockup V6 `lo-trinh-moi.html` k6): em không đăng ký môn này — chữ nghiêng nhạt trên nền sọc, khác "-" vắng và "—" chưa điểm;
 * không phải nút, không nhận gõ. `nhan` = tên ô cho trình đọc màn ("S").
 */
export function OKhongHoc({ nhan }: { nhan?: string }) {
  return <span className="o-khong-hoc" title={t('Em không học môn này')}>{t('Không học')}{nhan && <span className="sr-only"> · {nhan}</span>}</span>;
}
