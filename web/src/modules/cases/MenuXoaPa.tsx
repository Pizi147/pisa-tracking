import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { hoanTacXoa } from '../../lib/thungRac.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { LY_DO_KET_THUC_PA_TOI_THIEU } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * Nút ⋯ của dòng PA (PR-PA §8, mockup pa-dong-bo §8): `Sửa PA` (người ghi được Kết quả, PA đang chạy) · `Kết thúc PA` (OV-13a C: PA theo quy chế đang chạy,
 * GVCN lớp đang học / Quản lý — hộp nhỏ, Lý do ≥ 10 ký tự; Q-RL2c: toast Hoàn tác + `Mở lại PA` ở PA đã kết thúc sớm khi `iv.coTheHoanTacKetThuc`) · `Xoá PA` (N37: cờ máy chủ
 * `iv.xoa` — 'ngay' vào Thùng rác ngay, không hỏi, toast Hoàn tác; 'xin' = PA theo quy chế, bấm là gửi QL duyệt; đang chờ → mục mờ). Không mục nào thì không vẽ nút.
 */
export function MenuPa({ iv, ten, onSua, xoa, ketThuc = false }: { iv: any; ten: string; onSua?: () => void; xoa: boolean; ketThuc?: boolean }) {
  const toast = useToast();
  const [hoi, setHoi] = useState<'ket-thuc' | null>(null);
  const [lyDo, setLyDo] = useState('');
  const [thu, setThu] = useState(false);
  const [busy, setBusy] = useState(false);
  const lamMoi = () => { invalidate('/cases'); invalidate('/students'); invalidate('/my-work'); invalidate('/yeu-cau'); invalidate('/tong-quan'); };
  /* N37 (PTA 05/11): không hộp hỏi — xoá dựa Hoàn tác + Thùng rác; PA quy chế (người không phải QL) bấm là gửi QL duyệt. */
  const xoaPa = async () => {
    try {
      const r = await api.del<{ thungRacId?: number; choDuyet?: boolean }>(`/interventions/${iv.id}`);
      lamMoi();
      if (r?.choDuyet) toast.push('ok', t('Đã gửi QL duyệt xoá PA'));
      else hoanTacXoa(toast, r?.thungRacId, t('Đã xoá PA'), lamMoi);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không xoá được')); }
  };
  const ngan = lyDo.trim().length < LY_DO_KET_THUC_PA_TOI_THIEU;
  /* Q-RL2c (N24 ②): đảo Kết thúc PA — toast Hoàn tác 5 s và ⋯ "Mở lại PA" về sau (máy chủ kiểm quyền + chưa ai đổi gì sau đó). */
  const key = `ket-thuc-pa-${iv.id}`;
  const moLaiPa = async () => {
    try { await api.post(`/interventions/${iv.id}/hoan-tac-ket-thuc`); lamMoi(); toast.push('ok', t('Đã mở lại PA'), { key }); }
    catch (e: any) { toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.'), { key }); }
  };
  const ketThucPa = async () => {
    setThu(true);
    if (ngan) return;
    setBusy(true);
    try {
      await api.post(`/interventions/${iv.id}/ket-thuc`, { lyDo: lyDo.trim() });
      lamMoi();
      toast.hoanTac(t('Đã kết thúc PA'), () => { void moLaiPa(); }, { key });
      setHoi(null); setLyDo(''); setThu(false);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setBusy(false); }   // lỗi: giữ chữ đang gõ
  };
  const muc = [
    ...(onSua ? [{ key: 'sua', nhan: t('Sửa PA'), onChon: onSua }] : []),
    ...(ketThuc ? [{ key: 'ket-thuc', nhan: t('Kết thúc PA'), onChon: () => setHoi('ket-thuc') }] : []),
    ...(iv.coTheHoanTacKetThuc ? [{ key: 'mo-lai', nhan: t('Mở lại PA'), onChon: () => { void moLaiPa(); } }] : []),
    ...(xoa ? [{ key: 'xoa', nhan: t('Xoá PA'), nguyHiem: true, onChon: () => { void xoaPa(); },
      ...(iv.choXoa ? { tat: true, title: t('Đang chờ QL duyệt xoá') } : {}) }] : []),
  ];
  return (
    <>
      <MenuDong muc={muc} />
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

/**
 * ⋯ của MỘT dòng Kết quả PA ở Lịch sử Case (VIEC-SAU-LOGIC, N37) — "Xoá" theo cờ máy chủ `f.xoa` (cùng quyền Xoá PA): 'ngay' vào Thùng rác ngay, không hỏi,
 * toast Hoàn tác; 'xin' = PA theo quy chế, bấm là gửi QL duyệt. Bị chặn (lần ghi gần nhất đã Thay PA, Case đã hoàn thành…) → toast nói lý do + bước tiếp.
 */
export function MenuKetQua({ f, ten }: { f: { id: number; xoa: 'ngay' | 'xin' | null }; ten: string }) {
  const toast = useToast();
  const lamMoi = () => { invalidate('/cases'); invalidate('/students'); invalidate('/my-work'); invalidate('/yeu-cau'); invalidate('/tong-quan'); };
  const xoa = async () => {
    try {
      const r = await api.del<{ thungRacId?: number; choDuyet?: boolean }>(`/followups/${f.id}`);
      lamMoi();
      if (r?.choDuyet) toast.push('ok', t('Đã gửi QL duyệt xoá kết quả PA'));
      else hoanTacXoa(toast, r?.thungRacId, t('Đã xoá kết quả PA'), lamMoi);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không xoá được')); }
  };
  if (!f.xoa) return null;
  return <MenuDong nhan={t('Thao tác khác · {ten}', { ten })} muc={[{ key: 'xoa', nhan: t('Xoá kết quả'), nguyHiem: true, onChon: () => { void xoa(); } }]} />;
}
