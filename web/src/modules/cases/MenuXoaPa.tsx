import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';

/** Nút ⋯ của thẻ PA (Quản lý / Quản trị) → `Xoá PA` → hỏi một dòng (mẫu `DeleteViolationConfirm`). */
export function MenuXoaPa({ iv, ten, soKetQua }: { iv: any; ten: string; soKetQua: number }) {
  const toast = useToast();
  const [mo, setMo] = useState(false);
  const [hoi, setHoi] = useState(false);
  const [busy, setBusy] = useState(false);
  const xoa = async () => {
    setBusy(true);
    try {
      await api.del(`/interventions/${iv.id}`);
      invalidate('/cases'); invalidate('/students'); invalidate('/my-work'); invalidate('/yeu-cau'); invalidate('/tong-quan');
      toast.push('ok', 'Đã xoá PA');
      setHoi(false);
    } catch (e: any) { toast.push('error', e?.message ?? 'Không xoá được'); } finally { setBusy(false); }
  };
  return (
    <span className="relative" onKeyDown={(e) => { if (e.key === 'Escape' && mo) { e.stopPropagation(); setMo(false); } }}>
      <button type="button" className="btn btn-sm btn-ghost min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0" aria-label="Thao tác khác" aria-haspopup="menu"
        aria-expanded={mo} onClick={() => setMo((x) => !x)} onBlur={(e) => { if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) setMo(false); }}>⋯</button>
      {mo && (
        <span role="menu" className="absolute right-0 top-full z-10 mt-1 block min-w-[160px] rounded-lg border p-1 shadow-lg surface-2" style={{ borderColor: 'var(--line)' }}>
          <button type="button" role="menuitem" className="block w-full rounded-md px-2.5 py-2 text-left text-sm text-bad hover:bg-[color:var(--accent-soft)]"
            onClick={() => { setMo(false); setHoi(true); }}>Xoá PA</button>
        </span>
      )}
      {hoi && (
        <KhungPanel tieuDe="Xoá PA này?" longTrong z="z-[60]" onDong={() => !busy && setHoi(false)}
          chan={{
            huy: { onClick: () => setHoi(false), disabled: busy },
            chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void xoa()}>{busy ? 'Đang xoá…' : 'Xoá PA'}</button>,
          }}>
          <p className="m-0 pt-3 text-sm leading-relaxed text-slate-300">{ten}{soKetQua > 0 ? ` · ${soKetQua} kết quả tuần sẽ xoá` : ''}</p>
        </KhungPanel>
      )}
    </span>
  );
}
