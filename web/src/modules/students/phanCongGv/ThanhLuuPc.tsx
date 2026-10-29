import { forwardRef } from 'react';
import { t } from '@shared/i18n/index.ts';

/**
 * THANH "LƯU CẢ n LỚP" (mockup v9 khu 5, đề xuất PTA duyệt): từ 2 dòng nháp, dính chân bảng lớp — "n lớp đang sửa · n ô · Huỷ hết · Lưu cả n lớp…"
 * → MỘT hộp Lưu (một hiệu lực, cặp gom theo lớp). Lưu cuối dòng vẫn dùng được khi một lớp cần mốc khác.
 */
export const ThanhLuuPc = forwardRef<HTMLButtonElement, {
  soLop: number; soO: number; loi: string | null; mo: boolean; busy: boolean; onHuyHet: () => void; onLuu: () => void;
}>(function ThanhLuuPc({ soLop, soO, loi, mo, busy, onHuyHet, onLuu }, ref) {
  return (
    <div className="pc-thanh-luu" role="region" aria-label={t('Lưu nhiều lớp')}>
      <span><b className="tabular-nums">{t('{n} lớp', { n: soLop })}</b> {t('đang sửa')} · {t('{n} ô', { n: soO })}</span>
      <span className="phai">
        <button type="button" className="btn btn-sm" disabled={busy} onClick={onHuyHet}>{t('Huỷ hết')}</button>
        <button ref={ref} type="button" className="btn btn-sm btn-primary" aria-expanded={mo} aria-disabled={!!loi || busy || undefined} title={loi ?? undefined}
          onClick={onLuu}>{t('Lưu cả {n} lớp…', { n: soLop })}</button>
      </span>
    </div>
  );
});
