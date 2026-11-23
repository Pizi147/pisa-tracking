import { useContext, useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, KhungTaiCho, Truong } from '../../ui/KhungPanel.tsx';
import { NutDongPanel, dauViec } from '../../ui/KhuonViec.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ErrorState } from '../../ui/ui.tsx';
import { ChipBac } from './KhaiBacLoPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BAC_0_NHAN, THANG, dsLoi, kindCuaBac, luuRoiTiep, nhanLoaiXuLy, quyCheKhaiBac, bacDu } from '@shared/domain/index.ts';
import { DUONG_LAM_MOI_Y_THUC, type YThucHocVien } from './kieu.ts';
import { t } from '@shared/i18n/index.ts';

/** Khai tối đa bậc 6 (WL 2) — hết mạch chính; Report 7+ chỉ đi tiếp trên web. OV-13d: bậc 0 "Chưa có xử lý vi phạm" đứng đầu (Sửa giữ được bậc 0). */
const BAC_KHAI = [BAC_0_NHAN, ...THANG.map((k) => nhanLoaiXuLy(k))];
const tenBac = (b: number) => BAC_KHAI[b] ?? '';

/**
 * KHAI BẬC — "bậc em đã tới" (H5, T27; N66 chủ SP 24/11): khai / sửa MỌI LÚC, cả khi chuỗi đã có lần xử lý trên web (lần cũ giữ trong lịch sử).
 * Sửa (`sua`, OV-7a + N50 câu 8): GVCN / QL, có lịch sử (máy chủ quyết — `canSuaKhai`); gửi `bacCu` — người khác vừa sửa → 409, tải lại. Bậc kế đi tiếp từ bậc khai.
 * DUONG-LUI-2 (A1-21): tiêu đề như panel cả lớp "Khai / sửa cấp bậc vi phạm"; đầu panel theo khuôn chung (dòng loại · tên em · thang); chip bậc viết đủ (lời 36).
 */
export function KhaiBacPanel({ studentId, sua, onClose, onDone, onTiep = null }: {
  studentId: number | null; sua?: boolean; onClose: () => void; onDone?: () => void;
  /** MOCKUP-1111 K5 (V12): mở từ Công việc có việc kế → "Lưu · việc tiếp ›" (chỉ sang việc kế khi máy chủ đã nhận; lỗi ở lại, giữ chữ). */
  onTiep?: (() => void) | null;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data: d, error: loiTai, reload } = useApi<YThucHocVien>(studentId ? `/students/${studentId}/y-thuc` : null, [studentId]);
  const [bac, setBac] = useState<number | null>(null);
  const [thang, setThang] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  /* OV-11c (CV-7): ở Công việc (tại chỗ) lưu xong panel ở lại "Đã lưu", dòng giữ chỗ mờ + gạch; nơi khác đóng như cũ. */
  const taiCho = useContext(KhungTaiCho);
  const [daLuu, setDaLuu] = useState<string | null>(null);
  /* N66: 409 (người khác vừa sửa) → tải lại bậc mới nhưng GIỮ chữ ghi chú đang gõ. */
  const giuChu = useRef<string | null>(null);
  /* PTA rà #2016: chuỗi đã có khai (kể cả người khác vừa khai → 409 rồi tải lại) thì là SỬA — mở từ Công việc không truyền `sua`. */
  const laSua = !!sua || !!d?.khai;
  useEffect(() => {
    const chu = giuChu.current; giuChu.current = null;
    setBac(laSua && d?.khai ? d.khai.bac : null); setThang(laSua && d?.khai?.thang ? d.khai.thang : ''); setGhiChu(chu ?? (laSua && d?.khai ? d.khai.ghiChu : '')); lf.datLai();
  }, [studentId, laSua, d?.khai?.bac]);

  if (!studentId) return null;
  const tieuDe = t('Khai / sửa cấp bậc vi phạm');   // AUDIT-1611 A1-21: tên panel = tên mục "Khai / sửa cấp bậc" (như panel cả lớp)
  if (loiTai) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} onDong={onClose}><ErrorState message={loiTai.message} hint={loiTai.hint} status={loiTai.status} onRetry={reload} /></KhungPanel>;
  if (!d) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} onDong={onClose}><p className="mt-3 text-sm text-slate-400">{t('Đang tải…')}</p></KhungPanel>;

  const dau = { ...dauViec({ em: { id: studentId, ten: d.ten }, ngCanh: t('Thang {x}', { x: d.chuoi.nhan === 'lớp thường' ? t('lớp thường') : d.chuoi.nhan }) }),
    loai: t('Việc · Ý thức & Phối hợp') };
  if (daLuu) {
    return (
      <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} hocVien={d.ten} dau={dau} onDong={onClose}
        chan={{ huy: null, chinh: onTiep
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{t('Việc tiếp ›')}</button>
          : <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose}>{t('Đóng')}</button> }}>
        <Khoi tieuDe={t('Đã lưu')}><p className="m-0 text-sm text-slate-200">{daLuu}</p></Khoi>
      </KhungPanel>
    );
  }
  /* KHAI-BAC-LO (chủ SP 28/10): ghi chú tuỳ chọn — chỉ bậc là bắt buộc. */
  const loi = dsLoi([{ khoa: 'bac', nhan: t('Bậc'), chon: true }], { bac: bac === null ? '' : 'co' });
  const luu = async (): Promise<boolean> => {
    lf.bam();
    if (loi.length || bac === null) return false;
    setBusy(true);
    try {
      const body = { bac, thang: thang || undefined, ghiChu: ghiChu.trim() };
      if (laSua) await api.put(`/students/${studentId}/y-thuc/khai-bac`, { ...body, bacCu: d.khai?.bac });
      else await api.post(`/students/${studentId}/y-thuc/khai-bac`, body);
      onDone?.();
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      const chu = t('Đã xác nhận cấp bậc {nhanLoaiXuLy} cho {ten}. Lần xử lý kế tiếp: {nhanLoaiXuLy2}.', { nhanLoaiXuLy: bacDu(tenBac(bac)), ten: d.ten, nhanLoaiXuLy2: bacDu(nhanLoaiXuLy(kindCuaBac(bac + 1))) });
      toast.push('ok', chu);
      if (taiCho || onTiep) setDaLuu(chu); else onClose();   // V12 ①: có việc kế → "Lưu" ở lại, "✓ Đã lưu" + Việc tiếp ›
      return true;
    } catch (e: any) {
      toast.push('error', e.message);
      if (e?.status === 409) { giuChu.current = ghiChu; reload(); }   // N66: người khác vừa khai / sửa — tải bậc mới, giữ chữ ghi chú
      return false;
    } finally { setBusy(false); }
  };

  return (
    <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} hocVien={d.ten} dau={dau} onDong={onClose} quyChe={laSua ? null : quyCheKhaiBac()}
      chan={{
        daSua: !daLuu && (bac !== (laSua && d.khai ? d.khai.bac : null) || thang !== (laSua && d.khai?.thang ? d.khai.thang : '') || ghiChu !== (laSua && d.khai ? d.khai.ghiChu : '')),
        conThieu: lf.conThieu(loi),
        /* V12: có việc kế → "Lưu" phụ + "Lưu · việc tiếp ›" chính; không có → một nút như cũ. */
        /* GD-4d (lời 36, dòng 40c ⓪): "Đóng" đứng trước nút Lưu phụ; 375 chân dính đáy chỉ "Lưu · Lưu · việc tiếp ›" (Đóng qua ✕). */
        ...(onTiep ? { huy: null } : {}),
        phu: onTiep ? <><NutDongPanel busy={busy} /><button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{t('Lưu')}</button></> : undefined,
        chinh: onTiep
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luuRoiTiep(luu, onTiep)}>{t('Lưu · việc tiếp ›')}</button>
          : <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{laSua ? t('Lưu') : t('Xác nhận')}</button>,
      }}>
      <Khoi tieuDe={t('Bậc em đã tới')} luat={t('Bậc em đã tới — dùng khi bậc trên web chưa đúng; lần xử lý cũ vẫn giữ.')}>
        {/* MOCKUP-1111 K5: cùng hàng chip một bấm với panel cả lớp (cỡ lớn); bậc đã khai = chip nền nhạt. */}
        <div {...lf.o(loi, 'bac')}>
          <ChipBac lon chon={bac} cu={laSua && d.khai ? d.khai.bac : null} onPick={setBac} nhan={t('Bậc đã xử lý')} />
        </div>
        {lf.loiCua(loi, 'bac') && <p className="m-0 text-xs text-late">{t('Chọn bậc cao nhất em đã bị xử lý')}</p>}
        {bac !== null && <p className="m-0 text-xs text-slate-500">{t('Lần xử lý kế tiếp của em: {nhanLoaiXuLy}.', { nhanLoaiXuLy: bacDu(nhanLoaiXuLy(kindCuaBac(bac + 1))) })}</p>}
      </Khoi>
      <Khoi tieuDe={t('Chi tiết')}>
        <Truong nhan={t('Tháng xử lý')} tuyChon>
          <ONgay kieu="thang" value={thang} onChange={setThang} toiDa={homNay ? homNay.slice(0, 7) : null} goiY={t('Chưa chọn')} />
        </Truong>
        <Truong nhan={t('Ghi chú')} tuyChon>
          <textarea className="field w-full" rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
            placeholder={t('Ví dụ: REPORT 2 tháng 8, cô Hà gửi PH')} />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}
