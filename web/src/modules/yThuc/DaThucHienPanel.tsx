import { useContext, useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, KhungTaiCho, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ngay, nguoiThanhPayload, nguoiThieu, type NguoiChon } from '@shared/domain/index.ts';
import { DUONG_LAM_MOI_Y_THUC, type XuLyView } from './kieu.ts';

/**
 * ĐÃ THỰC HIỆN (V4-10) — QL đã duyệt đề xuất (WL 3 · Meeting CX/GĐCN · Đình chỉ · Khác), GVCN ghi ngày đã làm (hạn 5 ngày từ ngày
 * duyệt). Ngày từ ngày duyệt tới hôm nay; người thực hiện nhận tên ngoài; ghi chú tuỳ chọn (nối vào mô tả đề xuất).
 */
export function DaThucHienPanel({ measureId, onClose, onDone }: { measureId: number | null; onClose: () => void; onDone?: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: m } = useApi<XuLyView>(measureId ? `/y-thuc/xu-ly/${measureId}` : null, [measureId]);
  const [ngayTh, setNgayTh] = useState(homNay);
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [ghiChu, setGhiChu] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  /* OV-11c (CV-7): ở Công việc (tại chỗ) lưu xong panel ở lại "Đã lưu", dòng giữ chỗ mờ + gạch; nơi khác đóng như cũ. */
  const taiCho = useContext(KhungTaiCho);
  const [daLuu, setDaLuu] = useState<string | null>(null);
  useEffect(() => { setNgayTh(homNay); setNguoi({ kieu: 'toi' }); setGhiChu(''); lf.datLai(); }, [measureId, homNay]);

  if (!measureId) return null;
  if (!m) return <KhungPanel tieuDe="Đã thực hiện" onDong={onClose}><p className="mt-3 text-sm text-slate-400">Đang tải…</p></KhungPanel>;

  if (daLuu) {
    return (
      <KhungPanel tieuDe="Đã thực hiện" hocVien={m.ten} onDong={onClose}
        chan={{ huy: null, chinh: <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose}>Đóng</button> }}>
        <Khoi tieuDe="Đã lưu"><p className="m-0 text-sm text-slate-200">{daLuu}</p></Khoi>
      </KhungPanel>
    );
  }
  const loiNgay = m.quyetLuc && ngayTh < m.quyetLuc.slice(0, 10) ? `Chọn từ ngày QL duyệt (${ngay(m.quyetLuc, homNay)}) trở đi` : null;
  const loiNguoi = nguoiThieu(nguoi, true);
  const luu = async () => {
    lf.bam();
    if (loiNgay || loiNguoi) return;
    setBusy(true);
    try {
      await api.post(`/y-thuc/xu-ly/${measureId}/da-thuc-hien`, { performedOn: ngayTh, ...nguoiThanhPayload(nguoi), note: ghiChu.trim() || undefined });
      onDone?.();
      DUONG_LAM_MOI_Y_THUC.forEach((d) => invalidate(d));
      const chu = `Đã ghi ${m.nhan} cho ${m.ten} — ${m.viPham.length} vi phạm chuyển sang Đã xử lý.`;
      toast.push('ok', chu);
      if (taiCho) setDaLuu(chu); else onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Đã thực hiện" hocVien={m.ten} onDong={onClose}
      ngCanh={<span className="truncate">{m.nhan}{m.quyetLuc ? ` · QL duyệt ${ngay(m.quyetLuc, homNay)}` : ''}</span>}
      chan={{
        conThieu: lf.daBam && (loiNgay || loiNguoi) ? [{ nhan: 'Đã thực hiện', lyDo: loiNgay ?? loiNguoi ?? '' }] : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || m.status !== 'da_duyet'} onClick={luu}>Lưu · Đã thực hiện</button> }}>
      <Khoi tieuDe="Đã thực hiện">
        {m.status !== 'da_duyet' && <p className="m-0 text-sm text-slate-400">Lần xử lý này không còn chờ "Đã thực hiện" ({m.statusLabel}).</p>}
        <Hang2>
          <Truong nhan="Ngày thực hiện" batBuoc loi={lf.daBam ? loiNgay : null}>
            <ChonNgayGan value={ngayTh} onChange={setNgayTh} soNgay={30} />
          </Truong>
          <Truong nhan="Người thực hiện" batBuoc as="div" loi={lf.daBam ? loiNguoi : null}>
            <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} studentId={m.studentId} />
          </Truong>
        </Hang2>
        <Truong nhan="Ghi chú" tuyChon>
          <textarea className="field w-full" rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
            placeholder="Ví dụ: Đã họp PH chiều 30/09, có biên bản" />
        </Truong>
      </Khoi>
      <Khoi tieuDe={`Vi phạm được xử lý · ${m.viPham.length}`}>
        <p className="m-0 text-xs text-slate-400">{m.viPham.map((v) => `${ngay(v.occurredOn, homNay)} ${v.categoryLabel}`).join(' · ') || '—'}</p>
      </Khoi>
    </KhungPanel>
  );
}
