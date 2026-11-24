import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * TINH-HINH (mockup v20 E, chủ SP 12/11): thẻ Xử lý Ý thức khác mặc định (LG-10, 15/11: cả thẻ Thu hồi) — QL có 5 ngày, hết hạn TỰ CHỐT theo GVCN. Đếm ngược "Còn n ngày" + 5 vạch
 * (vạch đã qua tô) + "hết hạn: giữ quyết định GVCN"; ≤ 1 ngày: chữ vàng "Còn n ngày" (V22: chỉ màu, chữ nói hạn).
 * CHO-DUYET-TAI-CHO (v24 H1): vẽ trong phần mở của dòng (dòng chỉ còn ngày tô màu chữ).
 */
export function DemNguocYThuc({ han }: { han: string }) {
  const { homNay } = useNgayNghiepVu();
  const con = Math.max(0, Math.round((Date.parse(`${han.slice(0, 10)}T00:00:00Z`) - Date.parse(`${homNay}T00:00:00Z`)) / 86_400_000));
  const gap = con <= 1;
  return (
    <span className="grid w-48 max-w-full gap-1" title={t('Hết hạn: tự chốt theo GVCN')}>
      <span className={`text-[13px] font-bold tabular-nums ${gap ? 'text-soon' : 'text-[color:var(--text)]'}`}>{con ? t('Còn {n} ngày', { n: con }) : t('Hết hôm nay')}</span>
      <span aria-hidden className="grid grid-cols-5 gap-[3px]">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={`h-[4px] rounded-sm ${i < 5 - Math.min(5, con) ? (gap ? 'bg-soon' : 'bg-[color:var(--accent)]') : 'bg-[color:var(--line-strong)]'}`} />)}</span>
      <span className="text-xs leading-tight text-dim">{t('Hết hạn: giữ quyết định GVCN')}</span>
    </span>
  );
}
