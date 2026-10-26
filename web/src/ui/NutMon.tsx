import { ENTRY_SKILLS, ENTRY_SKILL_LABEL, ENTRY_SKILL_SHORT } from '@shared/domain/index.ts';
import { NutChon } from './ui.tsx';

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
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {ENTRY_SKILLS.map((k) => (
        <NutChon key={k} nho={nho} chon={co.has(k)} disabled={disabled} title={ENTRY_SKILL_LABEL[k]} className="min-w-[44px] tabular-nums" onClick={() => bat(k)}>
          {ENTRY_SKILL_SHORT[k]}
        </NutChon>
      ))}
    </div>
  );
}
