import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { addDaysIso, tuanLich } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * Ô TUẦN THI của góc Đang SOS (OV-12f, mockup 3 v2 §1 / §3b): ‹ W2 SEP › + "Toàn bộ" (8 tuần). Tuần bằng mã tuần, không ngày; chọn một tuần thì bỏ
 * Toàn bộ; đang Toàn bộ thì ô tuần ghi khoảng. ‹ › đi từng tuần trong khoảng 8 tuần (máy chủ trả `tu` · `den`).
 */
export function ChonTuanSos({ tuan, toanBo, tu, den, onChon }: {
  tuan: string | null; toanBo: boolean; tu: string; den: string; /** '' = tuần mặc định (tuần thi gần nhất đã qua) · 'tat-ca' = Toàn bộ. */
  onChon: (tuan: string) => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const goc = tuan ?? den;
  const nut = 'btn btn-sm min-h-[44px] min-w-[44px] justify-center sm:min-h-[32px] sm:min-w-[32px]';
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={t('Tuần thi')}>
      <span className="text-xs text-slate-400">{t('Tuần thi')}</span>
      <button type="button" className={nut} aria-label={t('Tuần trước')} disabled={!toanBo && goc <= tu} onClick={() => onChon(toanBo ? '' : addDaysIso(goc, -7))}>‹</button>
      <span className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums text-slate-100" aria-live="polite">
        {toanBo ? `${tuanLich(tu, homNay)}–${tuanLich(den, homNay)}` : tuanLich(goc, homNay)}
      </span>
      <button type="button" className={nut} aria-label={t('Tuần sau')} disabled={toanBo || goc >= den} onClick={() => onChon(addDaysIso(goc, 7))}>›</button>
      <button type="button" className="nut-loc" aria-pressed={toanBo} onClick={() => onChon(toanBo ? '' : 'tat-ca')}>{t('Toàn bộ')}</button>
    </div>
  );
}
