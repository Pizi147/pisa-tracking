import { CHUONG_TRINH, CHUONG_TRINH_LABEL, type ChuongTrinh } from '@shared/domain/index.ts';

/** Thanh ngữ cảnh (§3.2, P6b): Lớp thường · Fast Track · Cả hai. Một nhóm nút liền, nút đang chọn tô màu nhấn. */
export function ChonChuongTrinh({ value, onChange }: { value: ChuongTrinh; onChange: (v: ChuongTrinh) => void }) {
  return (
    <div role="group" aria-label="Chương trình" className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
      {CHUONG_TRINH.map((k) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}
          className={`px-3 py-1 text-xs border-0 cursor-pointer ${value === k ? 'bg-sky-500/20 text-sky-200 font-semibold' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
          {CHUONG_TRINH_LABEL[k]}
        </button>
      ))}
    </div>
  );
}
