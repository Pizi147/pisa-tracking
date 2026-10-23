import { addDaysIso, khoangMacDinh, khoangTuUrl, khoangVeTuan, type KhoangNgay } from '@shared/domain/index.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * BỘ LỌC THỜI GIAN CHUNG — MỘT component cho mọi trang có lọc thời gian (Phân tích, Tutor, HV & Lớp › Lọc thêm) để cùng một kiểu (DESIGN.md G10, chủ SP 20/10 + 23/10):
 * hiện thẳng trên hàng lọc "Tuần bắt đầu [ô tuần] → Tuần kết thúc [ô tuần]" (ô gõ + lịch, `ONgay`), đổi là áp dụng ngay — không hộp bấm mở, không nút ‹ ›.
 * `toanBo` (chỉ Phân tích): thêm lựa chọn "Toàn bộ" · "Chọn khoảng tuần" (P9, không trần). Chọn tuần bắt đầu sau tuần kết thúc → tự kéo đầu kia theo (không báo lỗi).
 */
export function BoChonThoiGian({ khoang, onChange, toanBo = false }: { khoang: KhoangNgay; onChange: (k: KhoangNgay) => void; toanBo?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const laTb = khoang.kieu === 'toan-bo';
  const tuanDau = khoang.tu, tuanCuoi = addDaysIso(khoang.den, -6);   // Thứ Hai tuần đầu / tuần cuối
  const dat = (tu: string, cuoi: string) => onChange(khoangVeTuan({ tu, den: addDaysIso(cuoi, 6) }, homNay));
  const nut = (bat: boolean) => `min-h-[44px] px-3 text-sm sm:min-h-[34px] ${bat ? 'bg-[color:var(--accent-soft)] font-bold text-[color:var(--accent)]' : 'text-slate-400'}`;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2" data-hd="pt-thoi-gian" role="group" aria-label={t('Thời gian')}>
      {toanBo && (
        <span role="group" aria-label={t('Thời gian')} className="inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
          <button type="button" aria-pressed={laTb} className={nut(laTb)}
            onClick={() => !laTb && onChange(khoangTuUrl({ get: (k) => (k === 'kieu' ? 'toan-bo' : null) }, homNay))}>{t('Toàn bộ')}</button>
          <button type="button" aria-pressed={!laTb} className={nut(!laTb)} onClick={() => laTb && onChange(khoangMacDinh(homNay))}>{t('Chọn khoảng tuần')}</button>
        </span>
      )}
      {!laTb && (
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
          <span className="max-sm:sr-only">{t('Tuần bắt đầu')}</span>
          <span className="w-36"><ONgay kieu="tuan" gon value={tuanDau} ariaLabel={t('Tuần bắt đầu')} onChange={(v) => v && dat(v, v > tuanCuoi ? v : tuanCuoi)} /></span>
          <span aria-hidden>→</span>
          <span className="max-sm:sr-only">{t('Tuần kết thúc')}</span>
          <span className="w-36"><ONgay kieu="tuan" gon value={tuanCuoi} ariaLabel={t('Tuần kết thúc')} onChange={(v) => v && dat(v < tuanDau ? v : tuanDau, v)} /></span>
        </span>
      )}
    </div>
  );
}
