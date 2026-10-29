import { addDaysIso, khoangMacDinh, khoangTuUrl, khoangVeTuan, type KhoangNgay } from '@shared/domain/index.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { t } from '@shared/i18n/index.ts';
import { DOAN, doanNut } from './dungChung.tsx';

/**
 * BỘ LỌC THỜI GIAN CHUNG — MỘT component cho mọi trang có lọc thời gian (Phân tích, Tutor, HV & Lớp › Lọc thêm) để cùng một kiểu (DESIGN.md G10, chủ SP 20/10 + 23/10):
 * hiện thẳng trên hàng lọc "[ô tuần] → [ô tuần]" (không chữ nhãn — chủ SP 24/10; trình đọc màn có aria "Tuần bắt đầu" / "Tuần kết thúc") (ô gõ + lịch, `ONgay`), đổi là áp dụng ngay — không hộp bấm mở, không nút ‹ ›.
 * `toanBo` (chỉ Phân tích): thêm lựa chọn "Toàn bộ" · "Chọn khoảng tuần" (P9, không trần). Chọn tuần bắt đầu sau tuần kết thúc → tự kéo đầu kia theo (không báo lỗi).
 */
export function BoChonThoiGian({ khoang, onChange, toanBo = false }: { khoang: KhoangNgay; onChange: (k: KhoangNgay) => void; toanBo?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const laTb = khoang.kieu === 'toan-bo';
  const tuanDau = khoang.tu, tuanCuoi = addDaysIso(khoang.den, -6);   // Thứ Hai tuần đầu / tuần cuối
  const dat = (tu: string, cuoi: string) => onChange(khoangVeTuan({ tu, den: addDaysIso(cuoi, 6) }, homNay));
  return (
    <div className="flex flex-wrap items-center gap-2 max-sm:w-full" data-hd="pt-thoi-gian" role="group" aria-label={t('Thời gian')}>
      {toanBo && (
        <span role="group" aria-label={t('Thời gian')} className={DOAN}>
          <button type="button" aria-pressed={laTb} className={doanNut(laTb)}
            onClick={() => !laTb && onChange(khoangTuUrl({ get: (k) => (k === 'kieu' ? 'toan-bo' : null) }, homNay))}>{t('Toàn bộ')}</button>
          <button type="button" aria-pressed={!laTb} className={doanNut(!laTb)} onClick={() => laTb && onChange(khoangMacDinh(homNay))}>{t('Chọn khoảng tuần')}</button>
        </span>
      )}
      {!laTb && (
        <span className="inline-flex items-center gap-x-1.5 text-sm text-[color:var(--text-faint)] max-sm:w-full">
          <span className="w-[124px] max-sm:w-auto max-sm:flex-1"><ONgay kieu="tuan" gon nutTrong value={tuanDau} ariaLabel={t('Tuần bắt đầu')} onChange={(v) => v && dat(v, v > tuanCuoi ? v : tuanCuoi)} /></span>
          <span aria-hidden>→</span>
          <span className="w-[124px] max-sm:w-auto max-sm:flex-1"><ONgay kieu="tuan" gon nutTrong value={tuanCuoi} ariaLabel={t('Tuần kết thúc')} onChange={(v) => v && dat(v < tuanDau ? v : tuanDau, v)} /></span>
        </span>
      )}
    </div>
  );
}
