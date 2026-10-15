import { useContext, useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, KhungTaiCho, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BAC_0_NHAN, THANG, dsLoi, kindCuaBac, nhanLoaiXuLy } from '@shared/domain/index.ts';
import { DUONG_LAM_MOI_Y_THUC, type YThucHocVien } from './kieu.ts';
import { t } from '@shared/i18n/index.ts';

const GHI_CHU_MIN = 3;
/** Khai tối đa bậc 6 (WL 2) — hết mạch chính; Report 7+ chỉ đi tiếp trên web. OV-13d: bậc 0 "Chưa có xử lý vi phạm" đứng đầu (Sửa giữ được bậc 0). */
const BAC_KHAI = [BAC_0_NHAN, ...THANG.map((k) => nhanLoaiXuLy(k))];
const tenBac = (b: number) => BAC_KHAI[b] ?? '';

/**
 * KHAI BẬC — "em đã bị xử lý trước khi dùng web" (H5, T27). Một lần cho mỗi chuỗi thang, chỉ khi chuỗi chưa có lần xử lý nào trên web.
 * Sửa (`sua`, OV-7a): GVCN khi chuỗi chưa có lần xử lý; QL cả sau đó (máy chủ quyết — `canSuaKhai`). Bậc kế tiếp của em đi tiếp từ bậc khai.
 */
export function KhaiBacPanel({ studentId, sua, onClose, onDone }: {
  studentId: number | null; sua?: boolean; onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: d } = useApi<YThucHocVien>(studentId ? `/students/${studentId}/y-thuc` : null, [studentId]);
  const [bac, setBac] = useState<number | null>(null);
  const [thang, setThang] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  /* OV-11c (CV-7): ở Công việc (tại chỗ) lưu xong panel ở lại "Đã lưu", dòng giữ chỗ mờ + gạch; nơi khác đóng như cũ. */
  const taiCho = useContext(KhungTaiCho);
  const [daLuu, setDaLuu] = useState<string | null>(null);
  useEffect(() => {
    setBac(sua && d?.khai ? d.khai.bac : null); setThang(sua && d?.khai?.thang ? d.khai.thang : ''); setGhiChu(sua && d?.khai ? d.khai.ghiChu : ''); lf.datLai();
  }, [studentId, sua, d?.khai?.bac]);

  if (!studentId) return null;
  const tieuDe = sua ? t('Sửa cấp bậc vi phạm') : t('Xác nhận cấp bậc vi phạm');
  if (!d) return <KhungPanel tieuDe={tieuDe} onDong={onClose}><p className="mt-3 text-sm text-slate-400">{t('Đang tải…')}</p></KhungPanel>;

  if (daLuu) {
    return (
      <KhungPanel tieuDe={tieuDe} hocVien={d.ten} onDong={onClose}
        chan={{ huy: null, chinh: <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose}>{t('Đóng')}</button> }}>
        <Khoi tieuDe={t('Đã lưu')}><p className="m-0 text-sm text-slate-200">{daLuu}</p></Khoi>
      </KhungPanel>
    );
  }
  const loi = dsLoi([{ khoa: 'bac', nhan: t('Bậc'), chon: true }, { khoa: 'ghi-chu', nhan: t('Ghi chú'), toiThieu: GHI_CHU_MIN }],
    { bac: bac === null ? '' : 'co', 'ghi-chu': ghiChu });
  const luu = async () => {
    lf.bam();
    if (loi.length || bac === null) return;
    setBusy(true);
    try {
      const body = { bac, thang: thang || undefined, ghiChu: ghiChu.trim() };
      if (sua) await api.put(`/students/${studentId}/y-thuc/khai-bac`, body);
      else await api.post(`/students/${studentId}/y-thuc/khai-bac`, body);
      onDone?.();
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      const chu = t('Đã xác nhận cấp bậc {nhanLoaiXuLy} cho {ten}. Lần xử lý kế tiếp: {nhanLoaiXuLy2}.', { nhanLoaiXuLy: tenBac(bac), ten: d.ten, nhanLoaiXuLy2: nhanLoaiXuLy(kindCuaBac(bac + 1)) });
      toast.push('ok', chu);
      if (taiCho) setDaLuu(chu); else onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={tieuDe} hocVien={d.ten} onDong={onClose}
      ngCanh={<span className="truncate">{t('Thang {x} · xác nhận một lần, chỉ QL sửa sau', { x: d.chuoi.nhan === 'lớp thường' ? t('lớp thường') : d.chuoi.nhan })}</span>}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{sua ? t('Lưu') : t('Xác nhận')}</button>,
      }}>
      <Khoi tieuDe={t('Bậc cao nhất đã xử lý trước khi dùng web')}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label={t('Bậc đã xử lý')} {...lf.o(loi, 'bac')}>
          {BAC_KHAI.map((nhan, i) => (
            <NutChon key={i} chon={bac === i} onClick={() => setBac(i)}>{nhan}</NutChon>
          ))}
        </div>
        {lf.loiCua(loi, 'bac') && <p className="m-0 text-xs text-late">{t('Chọn bậc cao nhất em đã bị xử lý')}</p>}
        {bac !== null && <p className="m-0 text-xs text-slate-500">{t('Lần xử lý kế tiếp của em: {nhanLoaiXuLy}.', { nhanLoaiXuLy: nhanLoaiXuLy(kindCuaBac(bac + 1)) })}</p>}
      </Khoi>
      <Khoi tieuDe={t('Chi tiết')}>
        <Truong nhan={t('Tháng xử lý')} tuyChon>
          <ONgay kieu="thang" value={thang} onChange={setThang} toiDa={homNay ? homNay.slice(0, 7) : null} goiY={t('Chưa chọn')} />
        </Truong>
        <Truong nhan={t('Ghi chú')} batBuoc loi={lf.loiCua(loi, 'ghi-chu')} dem={{ co: ghiChu.trim().length, can: GHI_CHU_MIN }}>
          <textarea className="field w-full" {...lf.o(loi, 'ghi-chu')} rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
            placeholder={t('Ví dụ: Report 2 tháng 8, cô Hà gửi PH')} />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}
