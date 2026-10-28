import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { LY_DO_KET_THUC_PA_TOI_THIEU } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * Nút ⋯ của dòng PA (PR-PA §8, mockup pa-dong-bo §8): `Sửa PA` (người ghi được Kết quả, PA đang chạy) · `Kết thúc PA` (OV-13a C: PA theo quy chế đang chạy,
 * GVCN lớp đang học / Quản lý — hộp nhỏ, Lý do ≥ 10 ký tự) · `Xoá PA` (Quản lý / Quản trị) — luật ở `nutDongPa` (shared). Xoá hỏi một dòng (mẫu
 * `DeleteViolationConfirm`). Không mục nào thì không vẽ nút.
 */
export function MenuPa({ iv, ten, soKetQua, onSua, xoa, ketThuc = false }: { iv: any; ten: string; soKetQua: number; onSua?: () => void; xoa: boolean; ketThuc?: boolean }) {
  const toast = useToast();
  const [hoi, setHoi] = useState<'xoa' | 'ket-thuc' | null>(null);
  const [lyDo, setLyDo] = useState('');
  const [thu, setThu] = useState(false);
  const [busy, setBusy] = useState(false);
  const lamMoi = () => { invalidate('/cases'); invalidate('/students'); invalidate('/my-work'); invalidate('/yeu-cau'); invalidate('/tong-quan'); };
  const xoaPa = async () => {
    setBusy(true);
    try {
      await api.del(`/interventions/${iv.id}`);
      lamMoi();
      toast.push('ok', t('Đã xoá PA'));
      setHoi(null);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không xoá được')); } finally { setBusy(false); }
  };
  const ngan = lyDo.trim().length < LY_DO_KET_THUC_PA_TOI_THIEU;
  const ketThucPa = async () => {
    setThu(true);
    if (ngan) return;
    setBusy(true);
    try {
      await api.post(`/interventions/${iv.id}/ket-thuc`, { lyDo: lyDo.trim() });
      lamMoi();
      toast.push('ok', t('Đã kết thúc PA'));
      setHoi(null); setLyDo(''); setThu(false);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setBusy(false); }   // lỗi: giữ chữ đang gõ
  };
  const muc = [
    ...(onSua ? [{ key: 'sua', nhan: t('Sửa PA'), onChon: onSua }] : []),
    ...(ketThuc ? [{ key: 'ket-thuc', nhan: t('Kết thúc PA'), onChon: () => setHoi('ket-thuc') }] : []),
    ...(xoa ? [{ key: 'xoa', nhan: t('Xoá PA'), nguyHiem: true, onChon: () => setHoi('xoa') }] : []),
  ];
  return (
    <>
      <MenuDong muc={muc} />
      {/* 6c-2 (lỗi 9): hộp xác nhận = hộp nhỏ giữa màn (mẫu `.hop-hoi`), không ngăn 480 đè panel. Nêu đúng PA + số kết quả bị xoá. */}
      <ConfirmDialog open={hoi === 'xoa'} onClose={() => setHoi(null)} onConfirm={() => void xoaPa()} title={t('Xoá PA này?')} danger busy={busy} z="z-[60]"
        confirmLabel={t('Xoá PA')} busyLabel={t('Đang xoá…')}
        body={<>{ten}{soKetQua > 0 ? t(' · {soKetQua} kết quả tuần sẽ xoá', { soKetQua }) : ''}</>} />
      <ConfirmDialog open={hoi === 'ket-thuc'} onClose={() => setHoi(null)} onConfirm={() => void ketThucPa()} title={t('Kết thúc PA này?')} busy={busy} z="z-[60]"
        confirmLabel={t('Kết thúc PA')} busyLabel={t('Đang lưu…')} daSua={!!lyDo.trim()}
        body={<div className="space-y-2">
          <p className="m-0">{ten}</p>
          <Truong nhan={t('Lý do')} batBuoc loi={thu && ngan ? t('Ít nhất {n} ký tự', { n: LY_DO_KET_THUC_PA_TOI_THIEU }) : null}>
            <textarea className="field w-full" rows={3} maxLength={500} value={lyDo} onChange={(e) => setLyDo(e.target.value)} autoFocus />
          </Truong>
        </div>} />
    </>
  );
}
