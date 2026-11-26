import type { ReactNode } from 'react';

/**
 * HÀNG CHIP CHỌN MỘT (TUYEN-1, mockup v27 T1 "Cách xử lý" · T4 "Bạn chọn"): radio thật (role radio, aria-checked), chip tròn viền mảnh;
 * chip đang chọn viền + nền nhấn. 375: mỗi chip cao ≥ 44 px, xuống dòng khi chật.
 */
export function ChipRadio<K extends string>({ nhan, muc, value, onChange, disabled }: {
  nhan: string; value: K; onChange: (k: K) => void; disabled?: boolean;
  muc: readonly { k: K; chu: ReactNode; tat?: boolean; title?: string }[];
}) {
  return (
    /* Mũi tên ← → / ↑ ↓ chuyển lựa chọn như nhóm radio thật (bỏ qua mục tắt). */
    <div role="radiogroup" aria-label={nhan} className="flex flex-wrap gap-2" onKeyDown={(e) => {
      const buoc = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!buoc || disabled) return;
      const mo = muc.filter((m) => !m.tat);
      const i = mo.findIndex((m) => m.k === value);
      const ke = mo[(i + buoc + mo.length) % mo.length];
      if (!ke) return;
      e.preventDefault(); onChange(ke.k);
      (e.currentTarget.querySelector(`[data-k="${ke.k}"]`) as HTMLElement | null)?.focus();
    }}>
      {muc.map((m) => (
        <button key={m.k} data-k={m.k} type="button" role="radio" aria-checked={value === m.k} tabIndex={value === m.k ? 0 : -1} disabled={m.tat || disabled} onClick={() => onChange(m.k)} title={m.title}
          className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold appearance-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[32px] ${value === m.k ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--text)] shadow-[inset_0_0_0_1px_var(--accent)]' : 'border-[color:var(--line-strong)] text-dim hover:border-[color:var(--accent)]'}`}>
          {m.chu}
        </button>
      ))}
    </div>
  );
}
