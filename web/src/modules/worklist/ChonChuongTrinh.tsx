import { CHUONG_TRINH, CHUONG_TRINH_LABEL, type ChuongTrinh } from '@shared/domain/index.ts';
import { DOAN, doanNut } from '../phanTich/dungChung.tsx';
import { t } from '@shared/i18n/index.ts';

/** Thanh ngữ cảnh (§3.2, P6b): Fast Track · Lớp thường (PR-Pb2-a: bỏ nút gộp). Một nhóm nút liền, nút đang chọn tô màu nhấn. */
export function ChonChuongTrinh({ value, onChange }: { value: ChuongTrinh; onChange: (v: ChuongTrinh) => void }) {
  return (
    /* V8-PT: ô đoạn của hàng lọc Phân tích (`.doan`, cao 36). */
    <div role="group" aria-label={t('Chương trình')} className={DOAN}>
      {CHUONG_TRINH.map((k) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)} className={doanNut(value === k)}>
          {CHUONG_TRINH_LABEL[k]}
        </button>
      ))}
    </div>
  );
}
