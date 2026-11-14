import { CHUONG_TRINH, CHUONG_TRINH_LABEL, type ChuongTrinh } from '@shared/domain/index.ts';
import { DOAN, doanNut } from '../phanTich/dungChung.tsx';
import { t } from '@shared/i18n/index.ts';

/** Thanh ngữ cảnh (§3.2, P6b): Fast Track · Lớp thường (PR-Pb2-a: bỏ nút gộp). Một nhóm nút liền, nút đang chọn tô màu nhấn.
 *  GD-12a (⑨ L1, R9.3): `tat` = lý do ô không áp dụng ở tab này — nút `disabled`, viền đứt, chữ mờ (mục khoá vẫn đậm); lý do ở `aria-label`. */
export function ChonChuongTrinh({ value, onChange, tat }: { value: ChuongTrinh | null; onChange: (v: ChuongTrinh) => void; tat?: string }) {
  return (
    /* V8-PT: ô đoạn của hàng lọc Phân tích (`.doan`, cao 36). */
    <div role="group" aria-label={tat ?? t('Chương trình')} aria-disabled={tat ? true : undefined}
      className={`${DOAN} ${tat ? 'border-dashed [&>button]:cursor-default [&>button:not([aria-pressed=true])]:text-[color:var(--text-faint)] [&>button[aria-pressed=true]]:bg-[color:var(--o-nhap-tat)] [&>button[aria-pressed=true]]:shadow-none' : ''}`}>
      {CHUONG_TRINH.map((k) => (
        <button key={k} type="button" aria-pressed={value === k} disabled={!!tat} onClick={() => onChange(k)} className={doanNut(value === k)}>
          {CHUONG_TRINH_LABEL[k]}
        </button>
      ))}
    </div>
  );
}
