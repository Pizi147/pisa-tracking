import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { MEASURE_KIND_LABEL, THANG, dsLoi } from '@shared/domain/index.ts';
import { DUONG_LAM_MOI_Y_THUC, type YThucHocVien } from './kieu.ts';

const GHI_CHU_MIN = 3;
/** Khai tối đa bậc 5 (WL 2) — WL 3 luôn cần QL duyệt nên không khai tay. */
const BAC_KHAI = THANG.slice(0, 5);

/**
 * KHAI BẬC — "em đã bị xử lý trước khi dùng web" (H5, T27). Một lần cho mỗi chuỗi thang, chỉ khi chuỗi chưa có lần xử lý nào trên web;
 * sau đó chỉ QL sửa được (`sua`). Bậc kế tiếp của em đi tiếp từ bậc khai.
 */
export function KhaiBacPanel({ studentId, sua, onClose, onDone }: {
  studentId: number | null; sua?: boolean; onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: d } = useApi<YThucHocVien>(studentId ? `/students/${studentId}/y-thuc` : null, [studentId]);
  const [bac, setBac] = useState(0);
  const [thang, setThang] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setBac(sua && d?.khai ? d.khai.bac : 0); setThang(sua && d?.khai?.thang ? d.khai.thang : ''); setGhiChu(sua && d?.khai ? d.khai.ghiChu : ''); lf.datLai();
  }, [studentId, sua, d?.khai?.bac]);

  if (!studentId) return null;
  const tieuDe = sua ? 'Sửa cấp bậc vi phạm' : 'Xác nhận cấp bậc vi phạm';
  if (!d) return <KhungPanel tieuDe={tieuDe} onDong={onClose}><p className="mt-3 text-sm text-slate-400">Đang tải…</p></KhungPanel>;

  const loi = dsLoi([{ khoa: 'bac', nhan: 'Bậc', chon: true }, { khoa: 'ghi-chu', nhan: 'Ghi chú', toiThieu: GHI_CHU_MIN }],
    { bac: bac || '', 'ghi-chu': ghiChu });
  const luu = async () => {
    lf.bam();
    if (loi.length) return;
    setBusy(true);
    try {
      const body = { bac, thang: thang || undefined, ghiChu: ghiChu.trim() };
      if (sua) await api.put(`/students/${studentId}/y-thuc/khai-bac`, body);
      else await api.post(`/students/${studentId}/y-thuc/khai-bac`, body);
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      toast.push('ok', `Đã xác nhận cấp bậc ${MEASURE_KIND_LABEL[BAC_KHAI[bac - 1]]} cho ${d.ten}. Lần xử lý kế tiếp: ${bac < 6 ? MEASURE_KIND_LABEL[THANG[bac]] : 'Đề xuất QL duyệt'}.`);
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={tieuDe} hocVien={d.ten} onDong={onClose}
      ngCanh={<span className="truncate">Thang {d.chuoi.nhan === 'lớp thường' ? 'lớp thường' : d.chuoi.nhan} · xác nhận một lần, chỉ QL sửa sau</span>}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{sua ? 'Lưu' : 'Xác nhận'}</button>,
      }}>
      <Khoi tieuDe="Bậc cao nhất đã xử lý trước khi dùng web">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Bậc đã xử lý" {...lf.o(loi, 'bac')}>
          {BAC_KHAI.map((k, i) => (
            <NutChon key={k} chon={bac === i + 1} onClick={() => setBac(i + 1)}>{MEASURE_KIND_LABEL[k]}</NutChon>
          ))}
        </div>
        {lf.loiCua(loi, 'bac') && <p className="m-0 text-[11px] text-late">Chọn bậc cao nhất em đã bị xử lý</p>}
        {bac > 0 && <p className="m-0 text-[11px] text-slate-500">Lần xử lý kế tiếp của em: {MEASURE_KIND_LABEL[THANG[bac]]}{bac === 5 ? ' (cần QL duyệt)' : ''}.</p>}
      </Khoi>
      <Khoi tieuDe="Chi tiết">
        <Truong nhan="Tháng xử lý" tuyChon>
          <ONgay kieu="thang" value={thang} onChange={setThang} toiDa={homNay ? homNay.slice(0, 7) : null} goiY="Chưa chọn" />
        </Truong>
        <Truong nhan="Ghi chú" batBuoc loi={lf.loiCua(loi, 'ghi-chu')} dem={{ co: ghiChu.trim().length, can: GHI_CHU_MIN }}>
          <textarea className="field w-full" {...lf.o(loi, 'ghi-chu')} rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
            placeholder="Ví dụ: Report 2 tháng 8, cô Hà gửi PH" />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}
