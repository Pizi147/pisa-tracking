/**
 * HÀNG TAB GẠCH CHÂN (PR-HV, spec 2026-09-22 §4.1, §4.3) — dùng cho tab chính của trang (`cap="chinh"`) và tab con
 * bên trong một khối (`cap="con"`). Số đếm và chấm vàng ● nằm ngay trên nhãn (A5): nhìn là biết bên nào có việc.
 *
 * Trên 375px hàng tab cuộn ngang BÊN TRONG chính nó (`overflow-x-auto`) — không đẩy cả trang cuộn ngang.
 * PR-KHUNG G5: dưới 640px mép phải mờ + đệm pr-8 (cùng mẫu bộ lọc Học viên & Lớp) — biết là còn tab để vuốt.
 */
import { useEffect, useRef } from 'react';

export type HangTabMuc<K extends string> = { key: K; label: string; so?: number | null; canhBao?: boolean };

export function HangTab<K extends string>({ tabs, value, onChange, ariaLabel, cap = 'chinh' }: {
  tabs: HangTabMuc<K>[]; value: K; onChange: (k: K) => void; ariaLabel: string;
  /** 'chinh' = hàng tab của trang (chữ text-sm), 'con' = tab con trong một khối (text-xs). */
  cap?: 'chinh' | 'con';
}) {
  const hang = useRef<HTMLDivElement>(null);
  /* Mở trang với tab ở cuối hàng (ví dụ `?tab=y-thuc`) thì tab đang chọn tự cuộn vào tầm nhìn, không bị khuất. */
  useEffect(() => {
    hang.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [value]);
  return (
    <div ref={hang} role="tablist" aria-label={ariaLabel} className="flex gap-1 overflow-x-auto overflow-y-hidden border-b max-sm:[scrollbar-width:none] max-sm:pr-8 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)]" style={{ borderColor: 'var(--line)' }}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => onChange(t.key)}
            className={`min-h-[44px] whitespace-nowrap px-2.5 sm:px-3 py-2 -mb-px sm:min-h-0 border-b-2 font-semibold appearance-none bg-transparent cursor-pointer ${
              cap === 'con' ? 'text-xs' : 'text-sm'
            } ${active ? 'border-[color:var(--accent)] text-slate-100' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t.label}
            {t.canhBao && <span className="ml-1 text-soon" role="img" aria-label="Đã nhắc" title="Đã nhắc">●</span>}
            {!!t.so && t.so > 0 && (
              <span className="ml-1.5 rounded-full px-1.5 text-[11.5px] tabular-nums bg-doing-bg text-doing">{t.so}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
