import { useState } from 'react';
import { Alert } from '../../ui/ui.tsx';

/**
 * BADGE "THIẾU THÔNG TIN" — mục 7.5.
 *
 * MỘT badge gom mọi thứ còn thiếu, không phải mỗi thứ một nhãn. Owner nói rõ điều này, và
 * lý do nhìn bảng lớp là thấy: bốn nhãn nhỏ trên một dòng thì dòng nào cũng đầy nhãn, và
 * người đọc thôi nhìn chúng.
 *
 * Bấm vào mới bung ra danh sách. Đây KHÔNG phải việc trong hàng đợi công việc — không có
 * hạn, không ai bị thúc — nên nó không được chiếm chỗ như một việc phải làm.
 */
export function MissingBadge({ items, className = '', gon = false }: {
  items: { key: string; label: string; who: string }[] | null | undefined;
  className?: string;
  /** Dạng gọn cho bảng lớp (PR-HV, chủ sản phẩm 22/09): chỉ `⚠ {n}`; rê chuột thấy danh sách, bấm mở popover như thường. */
  gon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!items?.length) return null;

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className="appearance-none border-0 bg-transparent p-0 cursor-pointer"
        aria-expanded={open}
        title={items.map((i) => i.label).join(' · ')}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((v) => !v); }}
      >
        <Alert tone="warn">{gon ? items.length : `Thiếu ${items.length} thông tin`}</Alert>
      </button>

      {open && (
        <span
          className="absolute z-20 top-full left-0 mt-1 rounded-lg border p-2.5 shadow-lg min-w-[15rem]"
          style={{ borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
        >
          <span className="block text-[11px] text-slate-500 mb-1.5">Cần bổ sung sớm:</span>
          <span className="block space-y-1">
            {items.map((i) => (
              <span key={i.key} className="block">
                <span className="text-xs text-slate-200">{i.label}</span>
                {/* Nói rõ AI điền được, để badge không thành lời trách chung chung. */}
                <span className="block text-[10px] text-slate-500">{i.who}</span>
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  );
}
