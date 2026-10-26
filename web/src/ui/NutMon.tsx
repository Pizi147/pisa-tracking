import { ENTRY_SKILLS, ENTRY_SKILL_LABEL, ENTRY_SKILL_SHORT } from '@shared/domain/index.ts';
import { CHON, NutChon } from './ui.tsx';

/**
 * MÔN HỌC — 5 nút bật L · R · W1 · W2 · S (P8, mockup V6 `lo-trinh-moi.html` k1, k4, k5). `value` null = đủ môn; tắt hết → [] (nơi gọi báo lỗi tại ô,
 * máy chủ cũng chặn). Một kiểu cho Lộ trình mới, Sửa thông tin, Sửa cả lớp (ô + thanh "Áp cho n em").
 */
export function NutMon({ value, onChange, ariaLabel, nho, disabled }: {
  value: readonly string[] | null; onChange: (v: string[] | null) => void; ariaLabel: string; nho?: boolean; disabled?: boolean;
}) {
  const co = new Set(value ?? ENTRY_SKILLS);
  const bat = (k: string) => {
    const moi = ENTRY_SKILLS.filter((x) => (x === k ? !co.has(x) : co.has(x)));
    onChange(moi.length === ENTRY_SKILLS.length ? null : moi);
  };
  return (
    <div role="group" aria-label={ariaLabel} className={`flex flex-wrap ${nho ? 'gap-1' : 'gap-1.5'}`}>
      {ENTRY_SKILLS.map((k) => nho
        /* Trong ô bảng: không dấu ✓ góc (5 nút sát nhau) — môn tắt gạch ngang, không chỉ khác màu. */
        ? <button key={k} type="button" aria-pressed={co.has(k)} disabled={disabled} title={ENTRY_SKILL_LABEL[k]} onClick={() => bat(k)}
            className={`btn btn-sm min-h-[44px] min-w-[40px] justify-center px-1.5 tabular-nums sm:min-h-[28px] ${co.has(k) ? CHON : 'text-slate-500 line-through'}`}>{ENTRY_SKILL_SHORT[k]}</button>
        : (
          <NutChon key={k} chon={co.has(k)} disabled={disabled} title={ENTRY_SKILL_LABEL[k]} className={`min-w-[44px] tabular-nums ${co.has(k) ? '' : 'text-slate-500 line-through'}`} onClick={() => bat(k)}>
            {ENTRY_SKILL_SHORT[k]}
          </NutChon>
        ))}
    </div>
  );
}
