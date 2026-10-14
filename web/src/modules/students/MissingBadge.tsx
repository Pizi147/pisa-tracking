import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHIP_VUONG } from '../../ui/Nhan.tsx';

const RONG = 240;   // 15rem — cùng bề rộng tối thiểu cũ

/**
 * BADGE "THIẾU THÔNG TIN" — mục 7.5.
 *
 * MỘT badge gom mọi thứ còn thiếu, không phải mỗi thứ một nhãn. Owner nói rõ điều này, và
 * lý do nhìn bảng lớp là thấy: bốn nhãn nhỏ trên một dòng thì dòng nào cũng đầy nhãn, và
 * người đọc thôi nhìn chúng.
 *
 * Bấm vào mới bung ra danh sách. Đây KHÔNG phải việc trong hàng đợi công việc — không có
 * hạn, không ai bị thúc — nên nó không được chiếm chỗ như một việc phải làm.
 *
 * PR-DH (L1): hộp danh sách vẽ RA NGOÀI bảng (portal → body, `fixed`, như `MenuDong`) — vẽ ngay trong ô thì bị hàng dưới
 * che. Lật lên khi dưới không đủ chỗ; đóng khi bấm ngoài, Esc, cuộn, đổi cỡ màn.
 */
export function MissingBadge({ items, className = '', gon = false }: {
  items: { key: string; label: string; who: string }[] | null | undefined;
  className?: string;
  /** Dạng gọn cho bảng lớp: "Thiếu {n}"; rê chuột thấy danh sách, bấm mở popover như thường. */
  gon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLDivElement>(null);
  const [viTri, setViTri] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !nut.current) { setViTri(null); return; }
    const r = nut.current.getBoundingClientRect();
    const cao = hop.current?.offsetHeight ?? 0;
    const moXuong = r.bottom + 4 + cao <= window.innerHeight - 8 || r.top - 4 - cao < 8;
    setViTri({
      top: moXuong ? r.bottom + 4 : r.top - 4 - cao,
      left: Math.max(8, Math.min(r.left, window.innerWidth - RONG - 8)),
    });
  }, [open, items?.length]);

  useEffect(() => {
    if (!open) return undefined;
    const bamNgoai = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!hop.current?.contains(t) && !nut.current?.contains(t)) setOpen(false);
    };
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
      nut.current?.focus();
    };
    const dong = () => setOpen(false);
    document.addEventListener('mousedown', bamNgoai);
    document.addEventListener('keydown', phim, true);
    window.addEventListener('scroll', dong, true);
    window.addEventListener('resize', dong);
    return () => {
      document.removeEventListener('mousedown', bamNgoai);
      document.removeEventListener('keydown', phim, true);
      window.removeEventListener('scroll', dong, true);
      window.removeEventListener('resize', dong);
    };
  }, [open]);

  if (!items?.length) return null;

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        ref={nut}
        type="button"
        className="relative appearance-none border-0 bg-transparent p-0 cursor-pointer max-sm:after:absolute max-sm:after:-inset-x-2 max-sm:after:-inset-y-3.5 max-sm:after:content-['']"   /* điện thoại: vùng bấm 44 px (HL-18) */
        aria-expanded={open}
        title={open ? undefined : items.map((i) => i.label).join(' · ')}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((v) => !v); }}
      >
        {/* G-4: ⚠ chỉ nghĩa là quá hạn — thiếu thông tin là badge chữ (Q12). CA2-7: dòng tên em (`gon`) chữ mờ không viền, vẫn bấm; vàng để cho SOS / sắp hạn. */}
        {gon
          ? <span className="text-xs text-slate-400 underline decoration-dotted underline-offset-2">Thiếu {items.length}</span>
          : <span className={`${CHIP_VUONG} border-soon-line bg-soon-bg text-soon`}>Thiếu {items.length} thông tin</span>}
      </button>

      {/* Sự kiện React vẫn nổi lên cha qua portal (hàng bảng / thẻ có onClick riêng) → chặn ở đây. */}
      {open && createPortal(
        <div
          ref={hop}
          className="fixed z-[60] rounded-lg border p-2.5 shadow-lg"
          style={{ width: RONG, borderColor: 'var(--line-strong)', background: 'var(--surface-2)', top: viTri?.top ?? 0, left: viTri?.left ?? 0, visibility: viTri ? 'visible' : 'hidden' }}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
        >
          <span className="block text-xs text-slate-500 mb-1.5">Cần bổ sung sớm:</span>
          <span className="block space-y-1">
            {items.map((i) => (
              <span key={i.key} className="block">
                <span className="text-xs text-slate-200">{i.label}</span>
                {/* Nói rõ AI điền được, để badge không thành lời trách chung chung. */}
                <span className="block text-xs text-slate-400">{i.who}</span>
              </span>
            ))}
          </span>
        </div>,
        document.body,
      )}
    </span>
  );
}
