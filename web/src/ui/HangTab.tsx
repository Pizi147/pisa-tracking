/**
 * HÀNG TAB GẠCH CHÂN — MỘT thanh tab cho toàn web (GD-4c, mockup `thiet-ke/v21/bang-mau.html` H1, `bang-mau-ghi-chu.md` mục 3 R5.9): tab trang, tab hạng mục
 * Công việc và tab con trong khối / panel cùng một dáng (chữ 14 / 600) — tab con phân biệt bằng chỗ đặt, không cỡ chữ riêng (XM-13). Badge viên tròn:
 * đỏ = việc của tôi quá hạn, vàng = hôm nay, mờ = chỉ đếm. Số đếm và chấm vàng ● nằm ngay trên nhãn (A5): nhìn là biết bên nào có việc.
 *
 * Trên 375px hàng tab cuộn ngang BÊN TRONG chính nó (`overflow-x-auto`) — không đẩy cả trang cuộn ngang.
 * PR-KHUNG G5: dưới 640px mép phải mờ + đệm pr-8 (cùng mẫu bộ lọc Học viên & Lớp) — biết là còn tab để vuốt.
 */
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { BadgeMo, BadgeTabSo, CHIP_TRON } from './Nhan.tsx';
import type { BadgeTab } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/* OV-15d (C03): chấm ● = tab có việc cần xử lý (hồ sơ HV › Ý thức) — không còn "Đã nhắc" (Nhắc thủ công đã bỏ). */
const CAN_XU_LY = t('Cần xử lý');

/** `so` = badge MỜ chỉ đếm; `badge` = badge việc của tôi (đỏ quá hạn · vàng hôm nay · Chấm Speaking: đỏ khi có bài quá hạn, không thì mờ — `BadgeTabSo`); `ngan` = tên ngắn ở 375. */
export type HangTabMuc<K extends string> = { key: K; label: string; ngan?: string; so?: number | null; badge?: BadgeTab | null; canhBao?: boolean;
  /** BAO-CAO-PH (mockup v15 t1, e1): chip nhẹ sau nhãn — "Tháng 11 · hạn 30/11"; `xau` = quá hạn (đỏ; chữ `chu` đã nói "quá hạn" — V22 không biểu tượng). */
  chip?: { chu: string; xau?: boolean } | null;
  /** Phần phụ mờ sau badge (sổ nghĩa vụ: "+n" bài S chéo chung). */
  phu?: ReactNode };

/** TAB-A11Y: ← → Home End chuyển FOCUS giữa các tab (WAI-ARIA tablist, kích hoạt bằng Enter / Space như nút thường). Dùng cho mọi `role="tablist"`. */
export function phimHangTab(e: KeyboardEvent<HTMLElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  const ds = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not(:disabled)'));
  const i = ds.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  ds[e.key === 'Home' ? 0 : e.key === 'End' ? ds.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + ds.length) % ds.length].focus();
}

export function HangTab<K extends string>({ tabs, value, onChange, ariaLabel, panelId, className = '' }: {
  /** TAB-A11Y: id của vùng nội dung (`role="tabpanel"`) mà hàng tab điều khiển → `aria-controls`. Không truyền = trang chưa có vùng riêng. */
  panelId?: string;
  tabs: readonly HangTabMuc<K>[]; value: K; onChange: (k: K) => void; ariaLabel: string;
  /** Lề âm hết bề ngang khối cha (tab hạng mục Công việc, mockup `.tabs` margin 0 -24px); tab con trong khối / panel không truyền (`.tabs.trong`). */
  className?: string;
}) {
  const hang = useRef<HTMLDivElement>(null);
  /* Không tab nào chọn (Hướng dẫn đang tìm): tab đầu nhận focus Tab — tablist luôn vào được bằng bàn phím. */
  const coChon = tabs.some((x) => x.key === value);
  /* Mở trang với tab ở cuối hàng (ví dụ `?tab=y-thuc`) thì tab đang chọn tự cuộn vào giữa hàng, không bị khuất. Chỉ đặt
     scrollLeft của CHÍNH hàng tab: `scrollIntoView` kéo cả <main> xuống hàng tab (Hồ sơ HV 375 vừa mở không đứng đầu trang). */
  useEffect(() => {
    const tab = hang.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    const h = hang.current;
    if (!tab || !h) return;
    /* getBoundingClientRect, không `offsetLeft`: hàng tab không phải offsetParent của nút nên offsetLeft tính từ tổ tiên khác. */
    const lech = tab.getBoundingClientRect().left - h.getBoundingClientRect().left;
    h.scrollLeft = Math.max(0, h.scrollLeft + lech - (h.clientWidth - tab.offsetWidth) / 2);
  }, [value, tabs.map((x) => `${x.key}${x.so ?? ''}${x.badge?.so ?? ''}`).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps -- số tab về sau làm tab rộng ra → canh lại
  return (
    /* `relative`: chữ `sr-only` (absolute) của badge bám vào hàng tab, không kéo <main> trượt ngang ở 375 (RA-GD-0711). */
    <div ref={hang} role="tablist" aria-label={ariaLabel} onKeyDown={phimHangTab} className={`relative flex gap-1 overflow-x-auto overflow-y-hidden border-b max-sm:[scrollbar-width:none] max-sm:pr-8 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] ${className}`} style={{ borderColor: 'var(--line)' }}>
      {tabs.map((t, i) => {
        const active = t.key === value;
        return (
          /* GD-4c (mockup v21 H1 `.tab`): MỘT dáng — 14 / 600 mọi trạng thái, chọn = chữ chính + gạch 2 px nhấn; 1440 đệm 11 14 12, 375 đệm 12 10, cao ≥ 44. */
          <button key={t.key} type="button" role="tab" data-tab={t.key} aria-selected={active} aria-controls={panelId} tabIndex={active || (i === 0 && !coChon) ? 0 : -1} onClick={() => onChange(t.key)}
            className={`-mb-px inline-flex min-h-[44px] shrink-0 cursor-pointer appearance-none items-center gap-2 whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-2.5 py-3 text-sm font-semibold sm:px-3.5 sm:pb-3 sm:pt-[11px] ${
              active ? 'border-[color:var(--accent)] text-[color:var(--text)]' : 'border-transparent text-dim hover:text-[color:var(--text)]'}`}>
            {t.ngan ? <><span className="sm:hidden">{t.ngan}</span><span className="max-sm:hidden">{t.label}</span></> : t.label}
            {t.canhBao && <span className="text-soon" role="img" aria-label={CAN_XU_LY} title={CAN_XU_LY}>●</span>}
            {t.chip && (
              <span className={`${CHIP_TRON} !font-medium tabular-nums ${t.chip.xau ? 'bg-late-bg text-late' : 'surface-2 text-slate-400'}`}>{t.chip.chu}</span>
            )}
            {t.badge && <BadgeTabSo b={t.badge} />}
            {/* Badge mờ = chỉ đếm (lời 35: chỉ số, không đơn vị); 0 → không vẽ. */}
            {!!t.so && t.so > 0 && <BadgeMo so={t.so} />}
            {t.phu}
          </button>
        );
      })}
    </div>
  );
}
