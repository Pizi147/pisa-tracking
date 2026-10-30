import type { ReactNode } from 'react';
import { DauKetQua, lopKq } from './BieuTuong.tsx';
import { t } from '@shared/i18n/index.ts';

type Kq = 'vuot' | 'bang' | 'duoi' | null;
const chuKq = (kq: 'vuot' | 'bang' | 'duoi') => (kq === 'duoi' ? t('Dưới kỳ vọng') : kq === 'bang' ? t('Bằng kỳ vọng') : t('Vượt kỳ vọng'));

/**
 * PANEL-V10 (chủ SP 30/10 + PTA Q1): `chiToHut` — điểm là ĐẠT / KHÔNG ĐẠT như ô Overall: vượt và bằng cùng "đạt" (✓, màu Overall đạt `text-kq-bang`),
 * dưới = ✗ màu `text-kq-duoi`. Không chiToHut: ba mức vượt / bằng / dưới như cũ (C05).
 */
export function lopODiem(kq: Kq, chiToHut?: boolean): string {
  return chiToHut && kq === 'vuot' ? lopKq('bang') : lopKq(kq);
}

/**
 * Ô ĐIỂM MỘT MẪU (BANG-0, 04 mục 7) — thay 7+ dáng ô điểm (BANG-1 chuyển 29 nơi). Tô CHÍNH con số + ✓ / ✗ đứng TRƯỚC (màu `lopKq`);
 * chỗ ký hiệu giữ cả khi không có ký hiệu để số thẳng cột. KCK dưới kỳ vọng = trung tính + chữ "KCK" (13/10).
 * - `doc` 56 px · `sua` hộp 64 × 32 (trống = viền đứt; dấu lưu góc trên phải, xám; lỗi = viền đỏ + "Lưu lại") ·
 *   `ti-le` "✗ 17/25" (căn theo "/", mẫu số khác tổng của cột = chữ vàng + "đề khác") · `lon` 28 px (hồ sơ Mock).
 * - Một dòng phụ 12 px (`phu`) dưới ô — ưu tiên "thiếu nhận xét" > "vắng lần n" > "n câu" do nơi gọi chọn.
 */
export function ODiem({ kieu = 'doc', so, kq = null, kck, tong, tongCot, phu, luu, onBam, onLuuLai, nhan, kyVong, chiToHut }: {
  /** BANG-EM-GON: `gon` = 15 px chữ thường (500), chỉ số hụt đậm 700 (mockup v10 `.dg-o`) — thay `to` 17 px của bảng hồ sơ lớp. */
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
  /** PANEL-V10: đạt / không đạt (vượt = bằng = ✓ màu Overall đạt) — bảng em hồ sơ lớp, Học viên & Lớp. */
  chiToHut?: boolean;
}) {
  const kqHien: Kq = kck && kq === 'duoi' ? null : kq;
  const mau = lopODiem(kqHien, chiToHut);
  const ten = [nhan, so ?? t('Chưa có'), kq ? `— ${kck && kq === 'duoi' ? 'KCK' : chuKq(kq)}${kyVong ? ` ${kyVong}` : ''}` : ''].filter(Boolean).join(' ');
  /* Chỗ ký hiệu giữ khi ô có số mà không có ký hiệu (số thẳng cột); ô trống không giữ ("—" nằm giữa). */
  const kyHieu = so === null ? null : <span className="inline-block w-[14px] shrink-0 text-center" aria-hidden>{kqHien && <DauKetQua kq={chiToHut && kqHien === 'vuot' ? 'bang' : kqHien} />}</span>;
  const deKhac = kieu === 'ti-le' && tong != null && tongCot != null && tong !== tongCot;
  const so_ = so === null ? <span className="text-faint">—</span> : kieu === 'ti-le'
    ? <>
        <span className={`inline-block min-w-[2ch] text-right text-[15px] font-bold ${mau}`}>{so}</span>
        <span className={`inline-block min-w-[3ch] text-left text-[13px] font-normal ${deKhac ? 'text-soon' : 'text-faint'}`} title={deKhac ? t('Đề khác') : undefined}>/{tong}</span>
      </>
    : <span className={`${kieu === 'lon' ? 'text-[28px] leading-none' : 'text-[15px]'} ${kieu === 'gon' && kqHien !== 'duoi' ? 'font-medium' : 'font-bold'} ${mau}`}>{so}</span>;
  const dongPhu = (phu || (kck && kq === 'duoi')) && (
    <span className="block text-[12px] leading-4 text-faint" data-phu-odiem="">{phu ?? 'KCK'}</span>
  );

  if (kieu !== 'sua') {
    return (
      <span className={`inline-flex flex-col ${kieu === 'ti-le' ? 'items-center' : 'items-start'}`}>
        <span className={`inline-flex items-baseline gap-1 tabular-nums`} aria-label={ten} role="img">{kyHieu}{so_}</span>
        {dongPhu}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-center">
      <button type="button" onClick={onBam} aria-label={ten} data-trong={so === null || undefined}
        className={`o-sua relative inline-flex h-8 w-16 items-center justify-center gap-1 tabular-nums max-sm:h-11 ${so === null ? 'border-dashed' : ''} ${luu === 'loi' ? '!border-bad' : ''}`}>
        {kyHieu}{so === null ? <span className="text-transparent" aria-hidden>0</span> : so_}
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
