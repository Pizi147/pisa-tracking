import { useContext, useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState } from '../../ui/ui.tsx';
import { Hang2, Khoi, KhungPanel, KhungTaiCho, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { luuRoiTiep, ngay, nguoiThanhPayload, nguoiThieu, quyCheDaThucHien, type NguoiChon, bacDu } from '@shared/domain/index.ts';
import { NutDongPanel } from '../../ui/KhuonViec.tsx';
import { DUONG_LAM_MOI_Y_THUC, type XuLyView } from './kieu.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * ĐÃ THỰC HIỆN (V4-10) — QL đã duyệt đề xuất (WL 3 · Meeting CX/GĐCN · Đình chỉ · Khác), GVCN ghi ngày đã làm (hạn 5 ngày từ ngày
 * duyệt). Ngày từ ngày duyệt tới hôm nay; người thực hiện nhận tên ngoài; ghi chú tuỳ chọn (nối vào mô tả đề xuất).
 */
export function DaThucHienPanel({ measureId, onClose, onDone, onTiep = null }: {
  measureId: number | null; onClose: () => void; onDone?: () => void;
  /** Việc kế ở danh sách Công việc (GD-4d) — có thì chân thêm "Lưu · việc tiếp ›". */
  onTiep?: (() => void) | null;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: m, error: loiTai, reload } = useApi<XuLyView>(measureId ? `/y-thuc/xu-ly/${measureId}` : null, [measureId]);
  const [ngayTh, setNgayTh] = useState(homNay);
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [ghiChu, setGhiChu] = useState('');
  /* YT-BAO-PH ([XM 1]): Meeting CX/GĐCN có PH dự → việc Báo PH của TVV tự xong (mặc định có). */
  const [phDu, setPhDu] = useState(true);
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  /* OV-11c (CV-7): ở Công việc (tại chỗ) lưu xong panel ở lại "Đã lưu", dòng giữ chỗ mờ + gạch; nơi khác đóng như cũ. */
  const taiCho = useContext(KhungTaiCho);
  const [daLuu, setDaLuu] = useState<string | null>(null);
  useEffect(() => { setNgayTh(homNay); setNguoi({ kieu: 'toi' }); setGhiChu(''); setPhDu(true); lf.datLai(); }, [measureId, homNay]);

  if (!measureId) return null;
  if (loiTai) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={t('Đã thực hiện')} onDong={onClose}><ErrorState message={loiTai.message} hint={loiTai.hint} status={loiTai.status} onRetry={reload} /></KhungPanel>;
  if (!m) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={t('Đã thực hiện')} onDong={onClose}><p className="mt-3 text-sm text-slate-400">{t('Đang tải…')}</p></KhungPanel>;

  if (daLuu) {
    return (
      <KhungPanel hd="xu-ly-vi-pham" tieuDe={t('Đã thực hiện')} hocVien={m.ten} onDong={onClose}
        chan={{ huy: null, chinh: onTiep
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{t('Việc tiếp ›')}</button>
          : <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose}>{t('Đóng')}</button> }}>
        <Khoi tieuDe={t('Đã lưu')}><p className="m-0 text-sm text-slate-200">{daLuu}</p></Khoi>
      </KhungPanel>
    );
  }
  const loiNgay = m.quyetLuc && ngayTh < m.quyetLuc.slice(0, 10) ? t('Chọn từ ngày QL duyệt ({ngay}) trở đi', { ngay: ngay(m.quyetLuc, homNay) }) : null;
  const loiNguoi = nguoiThieu(nguoi, true);
  const laMeeting = m.kind === 'meeting_cx';
  const luu = async (): Promise<boolean> => {
    lf.bam();
    if (loiNgay || loiNguoi) return false;
    setBusy(true);
    try {
      await api.post(`/y-thuc/xu-ly/${measureId}/da-thuc-hien`, { performedOn: ngayTh, ...nguoiThanhPayload(nguoi), note: ghiChu.trim() || undefined, ...(laMeeting ? { phDu } : {}) });
      onDone?.();
      DUONG_LAM_MOI_Y_THUC.forEach((d) => invalidate(d));
      const chu = t('Đã ghi {nhan} cho {ten} — {length} vi phạm chuyển sang Đã xử lý.', { nhan: m.nhan, ten: m.ten, length: m.viPham.length });
      toast.push('ok', chu);
      if (taiCho || onTiep) setDaLuu(chu); else onClose();
      return true;
    } catch (e: any) { toast.push('error', e.message); return false; } finally { setBusy(false); }
  };

  return (
    <KhungPanel hd="xu-ly-vi-pham" tieuDe={t('Đã thực hiện')} hocVien={m.ten} onDong={onClose}
      quyChe={m.status === 'da_duyet' ? quyCheDaThucHien(m.bac ? bacDu(dich(m.nhan)) : null, laMeeting && phDu) : null}
      ngCanh={<span className="truncate">{bacDu(dich(m.nhan))}{m.quyetLuc ? t(' · QL duyệt {ngay}', { ngay: ngay(m.quyetLuc, homNay) }) : ''}</span>}
      chan={{
        daSua: !daLuu && !!ghiChu.trim(),
        conThieu: lf.daBam && (loiNgay || loiNguoi) ? [{ nhan: t('Đã thực hiện'), lyDo: loiNgay ?? loiNguoi ?? '' }] : undefined,
        /* GD-4d (lời 36, dòng 40c ⓪): còn việc kế → "Đóng" · Lưu · "Lưu · việc tiếp ›" (375: Đóng qua ✕); không có → như cũ. Chỉ khi còn làm được. */
        ...(onTiep && m.status === 'da_duyet' ? {
          huy: null,
          phu: <><NutDongPanel busy={busy} /><button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{t('Lưu')}</button></>,
          chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luuRoiTiep(luu, onTiep)}>{t('Lưu · việc tiếp ›')}</button>,
        } : {
          chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || m.status !== 'da_duyet'} onClick={() => void luu()}>{t('Lưu · Đã thực hiện')}</button>,
        }) }}>
      <Khoi tieuDe={t('Đã thực hiện')}>
        {m.status !== 'da_duyet' && <p className="m-0 text-sm text-slate-400">{t('Lần xử lý này không còn chờ "Đã thực hiện" ({statusLabel}).', { statusLabel: m.statusLabel })}</p>}
        <Hang2>
          <Truong nhan={t('Ngày thực hiện')} batBuoc loi={lf.daBam ? loiNgay : null}>
            <ChonNgayGan value={ngayTh} onChange={setNgayTh} soNgay={30} />
          </Truong>
          <Truong nhan={t('Người thực hiện')} batBuoc as="div" loi={lf.daBam ? loiNguoi : null}>
            <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} studentId={m.studentId} />
          </Truong>
        </Hang2>
        <Truong nhan={t('Ghi chú')} tuyChon>
          <textarea className="field w-full" rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
            placeholder={t('Ví dụ: Đã họp PH chiều 30/09, có biên bản')} />
        </Truong>
        {laMeeting && (
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-slate-200 sm:min-h-0">
            <input type="checkbox" className="h-[18px] w-[18px] accent-[color:var(--accent)]" checked={phDu} onChange={(e) => setPhDu(e.target.checked)} />
            {t('PH dự họp — việc Báo PH của TVV tự xong')}
          </label>
        )}
      </Khoi>
      <Khoi tieuDe={t('Vi phạm được xử lý · {length}', { length: m.viPham.length })}>
        <p className="m-0 text-xs text-slate-400">{m.viPham.map((v) => `${ngay(v.occurredOn, homNay)} ${dich(v.categoryLabel)}`).join(' · ') || '—'}</p>
      </Khoi>
    </KhungPanel>
  );
}
