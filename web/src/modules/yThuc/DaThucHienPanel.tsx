import { useContext, useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState } from '../../ui/ui.tsx';
import { Hang2, Khoi, KhungPanel, KhungTaiCho, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { bacNgan, luuRoiTiep, ngay, nguoiThanhPayload, nguoiThieu, quyCheDaThucHien, type NguoiChon, bacDu } from '@shared/domain/index.ts';
import { NutDongPanel, TrangThaiLuu } from '../../ui/KhuonViec.tsx';
import { lamMoiYThucCua, type XuLyView } from './kieu.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { KhoiTuyen } from './KhoiTuyen.tsx';
import { KhoiGiaoViec, dongLichSuGiao, useGiaoViec } from '../congViec/KhoiGiaoViec.tsx';
import { MucViecCon } from '../congViec/MucViecCon.tsx';
import { DsLichSu, LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { lucVn } from '../congViec/gioVn.ts';
import { ChipRadio } from '../../ui/ChipRadio.tsx';

/**
 * ĐÃ THỰC HIỆN (V4-10) — QL đã duyệt đề xuất (WL 3 · Meeting CX/GĐCN · Đình chỉ · Khác), GVCN ghi ngày đã làm (hạn 5 ngày từ ngày
 * duyệt). Ngày từ ngày duyệt tới hôm nay; người thực hiện nhận tên ngoài; ghi chú tuỳ chọn (nối vào mô tả đề xuất).
 */
export function DaThucHienPanel({ measureId, dau, onClose, onDone, onTiep = null }: {
  measureId: number | null; onClose: () => void; onDone?: () => void;
  /** R4 P1 / P10: đầu panel từ dòng việc (hạn · tên em link · lớp) — có ngay lúc tải, lúc lỗi, lúc đã lưu. */
  dau?: Parameters<typeof KhungPanel>[0]['dau'];
  /** Việc kế ở danh sách Công việc (GD-4d) — có thì chân thêm "Lưu · việc tiếp ›". */
  onTiep?: (() => void) | null;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: m, error: loiTai, reload } = useApi<XuLyView>(measureId ? `/y-thuc/xu-ly/${measureId}` : null, [measureId]);
  /* TUYEN-1 (N72 ⑥, 4.6): khối Phụ trách · Hạn · Theo dõi của việc Đã thực hiện — một GET song song; tuyến đi cùng `/y-thuc/xu-ly/:id`. */
  const gv = useGiaoViec('da_thuc_hien', measureId);
  const [ngayTh, setNgayTh] = useState(homNay);
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [ghiChu, setGhiChu] = useState('');
  /* YT-BAO-PH ([XM 1]): Meeting CX/GĐCN có PH dự → việc Báo PH của TVV tự xong (mặc định có). */
  const [phDu, setPhDu] = useState(true);
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  /* R4 P1: lỗi lưu hiện ở chân (⚠ Không lưu được — lý do · Thử lại), chữ đang gõ giữ. */
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  /* OV-11c (CV-7): ở Công việc (tại chỗ) lưu xong panel ở lại "Đã lưu", dòng giữ chỗ mờ + gạch; nơi khác đóng như cũ. */
  const taiCho = useContext(KhungTaiCho);
  const [daLuu, setDaLuu] = useState<string | null>(null);
  /* TUYEN-1 (mockup v27 T2): Kết quả "Đã thực hiện │ Chưa thực hiện". Chưa lưu: "Chưa thực hiện" = việc vẫn mở (không ghi gì). Đã ghi "Đã thực hiện":
     "Chưa thực hiện" = sửa sai bấm nhầm — đường sẵn có `POST /y-thuc/xu-ly/:id/chua-thuc-hien` (OV-7a, quyền Sửa xử lý ở máy chủ). */
  const [ketQua, setKetQua] = useState<'da' | 'chua'>('da');
  useEffect(() => { setNgayTh(homNay); setNguoi({ kieu: 'toi' }); setGhiChu(''); setPhDu(true); setKetQua('da'); lf.datLai(); }, [measureId, homNay]);
  const veChua = async () => {
    setBusy(true);
    try {
      await api.post(`/y-thuc/xu-ly/${measureId}/chua-thuc-hien`);
      onDone?.(); lamMoiYThucCua({ studentIds: m ? [m.studentId] : [] }); reload(); gv.reload(); setDaLuu(null); setKetQua('da');
      toast.push('ok', t('Đã đưa về Chưa thực hiện'));
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };

  if (!measureId) return null;
  if (loiTai) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={t('Đã thực hiện')} dau={dau} onDong={onClose}><ErrorState message={loiTai.message} hint={loiTai.hint} status={loiTai.status} onRetry={reload} /></KhungPanel>;
  if (!m) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={t('Đã thực hiện')} dau={dau} onDong={onClose}><p className="mt-3 text-sm text-slate-400">{t('Đang tải…')}</p></KhungPanel>;

  if (daLuu) {
    return (
      <KhungPanel hd="xu-ly-vi-pham" tieuDe={t('Đã thực hiện')} hocVien={m.ten} dau={dau} onDong={onClose}
        chan={{ huy: null, phu: <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void veChua()}>{t('Chưa thực hiện')}</button>, chinh: onTiep
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{t('Việc tiếp ›')}</button>
          : <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose}>{t('Đóng')}</button> }}>
        <Khoi tieuDe={t('Đã lưu')}><p className="m-0 text-sm text-slate-200">{daLuu}</p></Khoi>
      </KhungPanel>
    );
  }
  const loiNgay = m.quyetLuc && ngayTh < m.quyetLuc.slice(0, 10) ? t('Chọn từ ngày Head duyệt ({ngay}) trở đi', { ngay: ngay(m.quyetLuc, homNay) }) : null;
  const loiNguoi = nguoiThieu(nguoi, true);
  const laMeeting = m.kind === 'meeting_cx';
  const luu = async (): Promise<boolean> => {
    lf.bam();
    if (loiNgay || loiNguoi) return false;
    setBusy(true); setLoiLuu(null);
    try {
      await api.post(`/y-thuc/xu-ly/${measureId}/da-thuc-hien`, { performedOn: ngayTh, ...nguoiThanhPayload(nguoi), note: ghiChu.trim() || undefined, ...(laMeeting ? { phDu } : {}) });
      onDone?.();
      lamMoiYThucCua({ studentIds: [m.studentId] });
      const chu = t('Đã ghi {nhan} cho {ten} — {length} vi phạm chuyển sang Đã xử lý.', { nhan: m.nhan, ten: m.ten, length: m.viPham.length });
      toast.push('ok', chu);
      if (taiCho || onTiep) setDaLuu(chu); else onClose();
      return true;
    } catch (e: any) { setLoiLuu(e.message); return false; } finally { setBusy(false); }
  };

  return (
    /* TUYEN-1 (mockup v27 T2): đầu panel "tên em · lớp · WL 3" — hạn chỉ ở khối Phụ trách · Hạn, ngày Head duyệt ở bước Tuyến. */
    <KhungPanel hd="xu-ly-vi-pham" tieuDe={t('Đã thực hiện')} hocVien={m.ten} dau={dau && gv.g ? { ...dau, han: null, dong2: [...dau.dong2, bacNgan(dich(m.nhan))] } : dau} onDong={onClose}
      quyChe={m.status === 'da_duyet' ? quyCheDaThucHien(m.bac ? bacDu(dich(m.nhan)) : null, laMeeting && phDu) : null}
      /* TUYEN-1: ngày Head duyệt nay ở bước "Head duyệt" của Tuyến — đầu panel chỉ còn bậc. */
      ngCanh={dau && gv.g ? undefined : <span className="truncate">{bacDu(dich(m.nhan))}</span>}
      chan={{
        daSua: !daLuu && !!ghiChu.trim(),
        trai: loiLuu ? <TrangThaiLuu tt="loi" loi={loiLuu} onThuLai={() => void luu()} /> : m.status === 'da_duyet' && ketQua === 'chua' ? <span className="text-slate-400">{t('Việc vẫn mở')}</span> : undefined,
        conThieu: lf.daBam && (loiNgay || loiNguoi) ? [{ nhan: t('Đã thực hiện'), lyDo: loiNgay ?? loiNguoi ?? '' }] : undefined,
        /* GD-4d (lời 36, dòng 40c ⓪): còn việc kế → "Đóng" · Lưu · "Lưu · việc tiếp ›" (375: Đóng qua ✕); không có → như cũ. Chỉ khi còn làm được. */
        ...(m.status === 'da_duyet' && ketQua === 'chua' ? {
          huy: null,
          chinh: <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose}>{t('Đóng')}</button>,
        } : m.status === 'done' && ketQua === 'chua' ? {
          huy: null, chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void veChua()}>{t('Lưu · Chưa thực hiện')}</button>,
        } : onTiep && m.status === 'da_duyet' ? {
          huy: null,
          phu: <><NutDongPanel busy={busy} /><button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{t('Lưu')}</button></>,
          chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luuRoiTiep(luu, onTiep)}>{t('Lưu · việc tiếp ›')}</button>,
        } : {
          chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || m.status !== 'da_duyet'} onClick={() => void luu()}>{t('Lưu · Đã thực hiện')}</button>,
        }) }}>
      {/* TUYEN-1 (mockup v27 T2): khối việc → Tuyến → form → Việc con → Lịch sử. */}
      {gv.g && <div className="pt-4"><KhoiGiaoViec g={gv.g} dat={gv.dat} reload={gv.reload} onDaDoi={onDone} /></div>}
      <div className="pt-4"><KhoiTuyen tuyen={m.tuyen} /></div>
      <div className="space-y-3 pt-4">
        {m.status !== 'da_duyet' && m.status !== 'done' && <p className="m-0 text-sm text-slate-400">{t('Lần xử lý này không còn chờ "Đã thực hiện" ({statusLabel}).', { statusLabel: m.statusLabel })}</p>}
        {(m.status === 'da_duyet' || m.status === 'done') && <Truong nhan={t('Kết quả')} as="div">
          <ChipRadio nhan={t('Kết quả')} value={m.status === 'done' && ketQua === 'da' ? 'da' : ketQua} onChange={setKetQua} disabled={busy}
            muc={[{ k: 'da', chu: t('Đã thực hiện') }, { k: 'chua', chu: t('Chưa thực hiện') }]} />
        </Truong>}
        {m.status === 'da_duyet' && ketQua === 'da' && <>
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
        </>}
      </div>
      {/* TUYEN-1: khối "n vi phạm được xử lý" bỏ khi Tuyến có bước "GV ghi n vi phạm" (mở xem từng vi phạm tại chỗ); không có Tuyến thì giữ. */}
      {!m.tuyen && <Khoi tieuDe={t('{n} vi phạm được xử lý', { n: m.viPham.length })}>
        <p className="m-0 text-xs text-slate-400">{m.viPham.map((v) => `${ngay(v.occurredOn, homNay)} ${dich(v.categoryLabel)}`).join(' · ') || '—'}</p>
      </Khoi>}
      {gv.g && <div className="flex flex-col gap-4 pt-4"><MucViecCon g={gv.g} onDoi={gv.reload} />
        {(() => { const ls = dongLichSuGiao(gv.g, homNay ?? ''); return <LichSuGap so={ls.length}><DsLichSu dong={ls.reverse().map((l, i) => ({ key: i, gio: lucVn(l.luc), ai: l.nguoi, viec: l.tieu, phu: l.phu }))} /></LichSuGap>; })()}
      </div>}
    </KhungPanel>
  );
}
