import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';

/**
 * Nút ⋯ của dòng PA (PR-PA §8, mockup pa-dong-bo §8): `Sửa PA` (người ghi được Kết quả, PA đang chạy) · `Xoá PA` (Quản lý / Quản trị)
 * — luật ở `nutDongPa` (shared). Xoá hỏi một dòng (mẫu `DeleteViolationConfirm`). Không mục nào thì không vẽ nút.
 */
export function MenuPa({ iv, ten, soKetQua, onSua, xoa }: { iv: any; ten: string; soKetQua: number; onSua?: () => void; xoa: boolean }) {
  const toast = useToast();
  const [hoi, setHoi] = useState(false);
  const [busy, setBusy] = useState(false);
  const xoaPa = async () => {
    setBusy(true);
    try {
      await api.del(`/interventions/${iv.id}`);
      invalidate('/cases'); invalidate('/students'); invalidate('/my-work'); invalidate('/yeu-cau'); invalidate('/tong-quan');
      toast.push('ok', 'Đã xoá PA');
      setHoi(false);
    } catch (e: any) { toast.push('error', e?.message ?? 'Không xoá được'); } finally { setBusy(false); }
  };
  const muc = [
    ...(onSua ? [{ key: 'sua', nhan: 'Sửa PA', onChon: onSua }] : []),
    ...(xoa ? [{ key: 'xoa', nhan: 'Xoá PA', nguyHiem: true, onChon: () => setHoi(true) }] : []),
  ];
  return (
    <>
      <MenuDong muc={muc} />
      {hoi && (
        <KhungPanel tieuDe="Xoá PA này?" longTrong z="z-[60]" onDong={() => !busy && setHoi(false)}
          chan={{
            huy: { onClick: () => setHoi(false), disabled: busy },
            chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void xoaPa()}>{busy ? 'Đang xoá…' : 'Xoá PA'}</button>,
          }}>
          <p className="m-0 pt-3 text-sm leading-relaxed text-slate-300">{ten}{soKetQua > 0 ? ` · ${soKetQua} kết quả tuần sẽ xoá` : ''}</p>
        </KhungPanel>
      )}
    </>
  );
}
