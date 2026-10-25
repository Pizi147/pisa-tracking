import { useState } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { Modal } from '../../../ui/Drawer.tsx';
import { Truong } from '../../../ui/KhungPanel.tsx';
import { ONgay } from '../../../ui/ONgay.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { Nhan } from '../../../ui/Nhan.tsx';
import { useKhoaCuoiTuan } from '../../../ui/ngayNghiepVu.ts';
import { kiemBand, NHAN_XET_TOI_DA } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import type { DongSEx } from './kieu.ts';

/**
 * HỘP MỘT LƯỢT S EXPERT (UI-CHAM-TEST, dieu-chinh-cuoi khu a) — Kế hoạch Test, cột S Ex. Thêm (`dong` null): chọn ngày rồi Lưu. Lượt có sẵn:
 * đổi ngày + Xoá chỉ khi `sua` (QL / Admin), điểm + nhận xét khi `cham`. Máy chủ kiểm quyền, band, ngày (`server/src/cham/sExpert.ts`);
 * lỗi lưu hiện trong hộp, chữ đã gõ giữ nguyên. Điểm S Ex không vào Overall / SOS (XM-1).
 */
export function HopSEx({ studentId, ten, dong, onDong, onXong }: {
  studentId: number; ten: string; dong: DongSEx | null; onDong: () => void; onXong: () => void;
}) {
  const toast = useToast();
  const [ngay, setNgay] = useState<string | null>(dong ? dong.ngay ?? dong.tuan : null);
  const [diem, setDiem] = useState(dong?.diem != null ? String(dong.diem) : '');
  const [nhanXet, setNhanXet] = useState(dong?.nhanXet ?? '');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const suaLich = !dong || dong.sua;
  const cham = !!dong?.cham;
  const band = diem.trim() === '' ? null : Number(diem.trim().replace(',', '.'));
  const loiBand = band === null ? null : kiemBand(band);
  /* P6 N15: S Ex chung khoá T6 → CN với MT — thêm / đổi ngày / xoá khi tuần gốc hoặc đích thuộc 3 tuần khoá (chấm điểm vẫn được). */
  const khoaCt = useKhoaCuoiTuan();
  const doiLich = suaLich && !!ngay && (!dong || ngay !== (dong.ngay ?? dong.tuan));
  const khoa = doiLich ? khoaCt(dong?.tuan, ngay) : null;
  const khoaXoa = dong ? khoaCt(dong.tuan) : null;

  const lamMoi = () => { for (const k of ['/ke-hoach-test', '/cham', '/lich-su']) invalidate(k); onXong(); };
  const xong = (chu: string) => { toast.push('ok', chu); lamMoi(); onDong(); };
  const luu = async () => {
    if (busy) return;
    if (!ngay) { setLoi(t('Chọn ngày')); return; }
    if (loiBand) { setLoi(loiBand); return; }
    setBusy(true); setLoi(null);
    try {
      if (!dong) {
        await api.post('/s-expert', { studentId, ngay });
        xong(t('Đã thêm S Ex · {ten}', { ten }));
      } else {
        await api.put(`/s-expert/${dong.id}`, { ...(suaLich ? { ngay } : {}), ...(cham ? { diem: band, nhanXet: nhanXet.trim() || null } : {}) });
        xong(t('Đã lưu S Ex · {ten}', { ten }));
      }
    } catch (e: any) { setLoi(e.message); } finally { setBusy(false); }
  };
  const xoa = async () => {
    if (!dong || busy) return;
    setBusy(true); setLoi(null);
    try {
      await api.del(`/s-expert/${dong.id}`);
      /* Máy chủ xoá mềm — Hoàn tác = khôi phục y như trước khi xoá (`POST /s-expert/:id/khoi-phuc`, có nhật ký). */
      toast.hoanTac(t('Đã xoá S Ex · {ten}', { ten }), async () => {
        try { await api.post(`/s-expert/${dong.id}/khoi-phuc`); toast.push('ok', t('Đã khôi phục S Ex · {ten}', { ten })); lamMoi(); }
        catch (e: any) { toast.push('error', e.message); }
      }, { key: `s-ex-${dong.id}` });
      lamMoi(); onDong();
    } catch (e: any) { setLoi(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={busy ? () => {} : onDong} width="max-w-md" title={`${dong ? t('S Ex') : t('+ S Ex')} · ${ten}`}
      footer={(
        <>
          {dong?.sua && <button type="button" className="btn btn-danger mr-auto min-h-[44px] sm:min-h-0" disabled={busy || !!khoaXoa} title={khoaXoa ?? undefined} onClick={() => void xoa()}>{t('Xoá')}</button>}
          <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={onDong}>{t('Đóng')}</button>
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || (!suaLich && !cham) || !!khoa} title={khoa ?? undefined} onClick={() => void luu()}>
            {busy ? t('Đang lưu…') : t('Lưu')}
          </button>
        </>
      )}>
      <div className="space-y-3">
        <Truong nhan={t('Ngày')}>
          <ONgay kieu="ngay" value={ngay} onChange={setNgay} disabled={!suaLich || busy} ariaLabel={t('Ngày')} />
        </Truong>
        {(khoa || khoaXoa) && (
          <div className="space-y-1" role="status">
            <Nhan tone="soon" title={khoa ?? khoaXoa!}>{t('Khoá đổi lịch T6 – CN')}</Nhan>
            <p className="m-0 text-xs text-slate-400">{khoa ?? khoaXoa}</p>
          </div>
        )}
        {cham && (
          <>
            <Truong nhan={t('Band')} tuyChon loi={loiBand ?? undefined}>
              <input className="field w-24 tabular-nums" inputMode="decimal" value={diem} disabled={busy} onChange={(e) => setDiem(e.target.value)} />
            </Truong>
            <Truong nhan={t('Nhận xét')} tuyChon>
              <textarea className="field w-full" rows={3} maxLength={NHAN_XET_TOI_DA} value={nhanXet} disabled={busy} onChange={(e) => setNhanXet(e.target.value)} />
            </Truong>
          </>
        )}
        {loi && <p className="m-0 text-xs font-semibold text-bad" role="alert">{loi}</p>}
      </div>
    </Modal>
  );
}
