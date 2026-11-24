import { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, KhungTaiCho, Truong } from '../../ui/KhungPanel.tsx';
import { NutDongPanel, TrangThaiLuu, dauViec } from '../../ui/KhuonViec.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ErrorState } from '../../ui/ui.tsx';
import { ChipBac, nganBac } from './KhaiBacLoPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useSession } from '../../lib/session.tsx';
import { BAC_0_NHAN, CHU_TOI_THIEU, THANG, dsLoi, duongThe, hienONgay, kindCuaBac, luuRoiTiep, nhanLoaiXuLy, quyCheKhaiBac, bacDu } from '@shared/domain/index.ts';
import { lamMoiYThucCua, type YThucHocVien } from './kieu.ts';
import { t } from '@shared/i18n/index.ts';

/** Khai tối đa bậc 6 (WL 2) — hết mạch chính; Report 7+ chỉ đi tiếp trên web. OV-13d: bậc 0 "Chưa có xử lý vi phạm" đứng đầu (Sửa giữ được bậc 0). */
const BAC_KHAI = [BAC_0_NHAN, ...THANG.map((k) => nhanLoaiXuLy(k))];
const tenBac = (b: number) => BAC_KHAI[b] ?? '';

/**
 * KHAI BẬC — "bậc em đã tới" (H5, T27; N66 chủ SP 24/11): khai / sửa MỌI LÚC, cả khi chuỗi đã có lần xử lý trên web (lần cũ giữ trong lịch sử).
 * Sửa (`sua`, OV-7a + N50 câu 8): GVCN / QL, có lịch sử (máy chủ quyết — `canSuaKhai`); gửi `bacCu` — người khác vừa sửa → 409, tải lại. Bậc kế đi tiếp từ bậc khai.
 * N70 (chủ SP 24/11): ô thời điểm nhận NGÀY hoặc THÁNG; khai LẦN ĐẦU áp ngay; GVCN SỬA bậc đã khai → "Gửi Head duyệt" (lý do bắt buộc, bậc cũ giữ) — có yêu cầu
 * đang chờ thì dải "Đã gửi Head duyệt: R2 → R1 · hạn dd/mm/yyyy" + Rút, form điền sẵn nội dung đã gửi (gửi lại = thay nội dung). Head / Quản trị sửa áp ngay.
 * DUONG-LUI-2 (A1-21): tiêu đề như panel cả lớp "Khai / sửa cấp bậc vi phạm"; đầu panel theo khuôn chung (dòng loại · tên em · thang); chip bậc viết đủ (lời 36).
 */
export function KhaiBacPanel({ studentId, sua, lop, dau: dauTai, onClose, onDone, onTiep = null }: {
  studentId: number | null; sua?: boolean;
  /** R4 P6 / P10: lớp (nơi gọi biết) + đầu panel dựng từ dòng việc cho lúc tải / lỗi. */
  lop?: string | null; dau?: Parameters<typeof KhungPanel>[0]['dau']; onClose: () => void; onDone?: () => void;
  /** MOCKUP-1111 K5 (V12): mở từ Công việc có việc kế → "Lưu · việc tiếp ›" (chỉ sang việc kế khi máy chủ đã nhận; lỗi ở lại, giữ chữ). */
  onTiep?: (() => void) | null;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { session } = useSession();
  const { data: d, error: loiTai, reload } = useApi<YThucHocVien>(studentId ? `/students/${studentId}/y-thuc` : null, [studentId]);
  const [bac, setBac] = useState<number | null>(null);
  const [thang, setThang] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  /* R4 P6: lỗi lưu / 409 hiện ở chân (⚠ Không lưu được — lý do · Thử lại), chữ đang gõ giữ. */
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  /* OV-11c (CV-7): ở Công việc (tại chỗ) lưu xong panel ở lại "Đã lưu", dòng giữ chỗ mờ + gạch; nơi khác đóng như cũ. */
  const taiCho = useContext(KhungTaiCho);
  const [daLuu, setDaLuu] = useState<string | null>(null);
  /* N66: 409 (người khác vừa sửa) → tải lại bậc mới nhưng GIỮ chữ ghi chú đang gõ. */
  const giuChu = useRef<string | null>(null);
  /* PTA rà #2016: chuỗi đã có khai (kể cả người khác vừa khai → 409 rồi tải lại) thì là SỬA — mở từ Công việc không truyền `sua`. */
  const laSua = !!sua || !!d?.khai;
  /* N70: GVCN sửa bậc đã khai = gửi Head duyệt; `cho` = yêu cầu đang chờ (bậc trên web vẫn là bậc cũ). */
  const canDuyet = laSua && !!d?.suaKhaiCanDuyet;
  const cho = d?.khai?.cho ?? null;
  /* Giá trị gốc của form: GVCN có yêu cầu đang chờ → nội dung đã gửi (gửi lại = thay nội dung), ô lý do của GVCN bắt đầu trống (ghi chú cũ không phải lý do).
     PTA rà #2058: Head / Quản trị (áp ngay) LUÔN bắt đầu từ dòng khai — không chọn sẵn bậc GVCN xin, kẻo bấm Lưu là áp nhầm và thẻ của GVCN tự đóng. */
  const choCuaToi = canDuyet ? cho : null;
  const goc = {
    bac: choCuaToi ? choCuaToi.bac : laSua && d?.khai ? d.khai.bac : null,
    thang: choCuaToi ? choCuaToi.thang ?? '' : laSua && d?.khai?.thang ? d.khai.thang : '',
    ghiChu: choCuaToi ? choCuaToi.ghiChu : laSua && d?.khai && !canDuyet ? d.khai.ghiChu : '',
  };
  useEffect(() => {
    const chu = giuChu.current; giuChu.current = null;
    setBac(goc.bac); setThang(goc.thang); setGhiChu(chu ?? goc.ghiChu); lf.datLai();
  }, [studentId, laSua, d?.khai?.bac, cho?.id, canDuyet]);

  if (!studentId) return null;
  const tieuDe = t('Khai / sửa cấp bậc vi phạm');   // AUDIT-1611 A1-21: tên panel = tên mục "Khai / sửa cấp bậc" (như panel cả lớp)
  if (loiTai) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} dau={dauTai} onDong={onClose}><ErrorState message={loiTai.message} hint={loiTai.hint} status={loiTai.status} onRetry={reload} /></KhungPanel>;
  if (!d) return <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} dau={dauTai} onDong={onClose}><p className="mt-3 text-sm text-slate-400">{t('Đang tải…')}</p></KhungPanel>;

  const dau = { ...dauViec({ han: dauTai?.han, em: { id: studentId, ten: d.ten }, lop, ngCanh: t('Thang {x}', { x: d.chuoi.nhan === 'lớp thường' ? t('lớp thường') : d.chuoi.nhan }) }),
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
  /* KHAI-BAC-LO (chủ SP 28/10): ghi chú tuỳ chọn — chỉ bậc là bắt buộc. N70: GVCN sửa → ô đó là "Lý do sửa", bắt buộc (Head đọc để duyệt). */
  /* PTA rà #2058: GVCN chưa đổi bậc lẫn ngày / tháng so với dòng khai → không có gì để gửi Head (máy chủ cũng 400). */
  const chuaDoi = canDuyet && !!d.khai && bac === d.khai.bac && thang === (d.khai.thang ?? '');
  const loi = dsLoi([{ khoa: 'bac', nhan: t('Bậc'), chon: true }, ...(canDuyet ? [{ khoa: 'ghiChu', nhan: t('Lý do sửa'), toiThieu: CHU_TOI_THIEU }] : [])],
    { bac: bac === null || chuaDoi ? '' : 'co', ghiChu });
  const lamMoi = () => { onDone?.(); lamMoiYThucCua({ studentIds: [studentId] }); if (canDuyet) { invalidate('/yeu-cau'); invalidate('/my-work'); } };
  const rut = async () => {
    if (!cho) return;
    setBusy(true); setLoiLuu(null);
    try {
      await api.post(`/yeu-cau/${cho.id}/rut`);
      lamMoi(); reload();
      toast.push('ok', t('Đã rút — Head không còn thấy yêu cầu này'));
    } catch (e: any) { setLoiLuu(e.message); reload(); } finally { setBusy(false); }
  };
  const luu = async (): Promise<boolean> => {
    lf.bam();
    if (loi.length || bac === null) return false;
    setBusy(true); setLoiLuu(null);
    try {
      const body = { bac, thang: thang || undefined, ghiChu: ghiChu.trim() };
      const kq = laSua ? await api.put<{ guiDuyet?: boolean }>(`/students/${studentId}/y-thuc/khai-bac`, { ...body, bacCu: d.khai?.bac })
        : await api.post<{ guiDuyet?: boolean }>(`/students/${studentId}/y-thuc/khai-bac`, body);
      lamMoi();
      /* N70: máy chủ quyết áp ngay hay gửi duyệt (`guiDuyet`) — chữ báo theo đúng điều đã xảy ra. */
      const chu = kq?.guiDuyet
        ? t('Đã gửi Head duyệt: {ten} · {cu} → {moi}. Bậc hiện tại giữ tới khi Head duyệt.', { ten: d.ten, cu: bacDu(tenBac(d.khai?.bac ?? 0)), moi: bacDu(tenBac(bac)) })
        : t('Đã xác nhận cấp bậc {nhanLoaiXuLy} cho {ten}. Lần xử lý kế tiếp: {nhanLoaiXuLy2}.', { nhanLoaiXuLy: bacDu(tenBac(bac)), ten: d.ten, nhanLoaiXuLy2: bacDu(nhanLoaiXuLy(kindCuaBac(bac + 1))) });
      toast.push('ok', chu);
      if (taiCho || onTiep) setDaLuu(chu); else onClose();   // V12 ①: có việc kế → "Lưu" ở lại, "✓ Đã lưu" + Việc tiếp ›
      return true;
    } catch (e: any) {
      setLoiLuu(e.message);
      if (e?.status === 409) { giuChu.current = ghiChu; reload(); }   // N66: người khác vừa khai / sửa — tải bậc mới, giữ chữ ghi chú
      return false;
    } finally { setBusy(false); }
  };

  return (
    <KhungPanel hd="xu-ly-vi-pham" tieuDe={tieuDe} hocVien={d.ten} dau={dau} onDong={onClose} quyChe={laSua ? null : quyCheKhaiBac()}
      chan={{
        daSua: !daLuu && (bac !== goc.bac || thang !== goc.thang || ghiChu !== goc.ghiChu),
        conThieu: lf.conThieu(loi),
        trai: loiLuu ? <TrangThaiLuu tt="loi" loi={loiLuu} onThuLai={() => void luu()} /> : undefined,
        /* V12: có việc kế → "Lưu" phụ + "Lưu · việc tiếp ›" chính; không có → một nút như cũ. */
        /* GD-4d (lời 36, dòng 40c ⓪): "Đóng" đứng trước nút Lưu phụ; 375 chân dính đáy chỉ "Lưu · Lưu · việc tiếp ›" (Đóng qua ✕). */
        ...(onTiep ? { huy: null } : {}),
        phu: onTiep ? <><NutDongPanel busy={busy} /><button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{canDuyet ? t('Gửi Head duyệt') : t('Lưu')}</button></> : undefined,
        chinh: onTiep
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luuRoiTiep(luu, onTiep)}>{canDuyet ? t('Gửi Head duyệt · việc tiếp ›') : t('Lưu · việc tiếp ›')}</button>
          : <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{canDuyet ? t('Gửi Head duyệt') : laSua ? t('Lưu') : t('Xác nhận')}</button>,
      }}>
      {cho && d.khai && (
        /* N70: yêu cầu sửa bậc đang chờ — bậc cũ → bậc xin · hạn duyệt; người gửi Rút được, Head mở thẳng thẻ ở Chờ duyệt. */
        <p role="status" className="m-0 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-soon-line bg-soon-bg px-3 py-2.5 text-sm leading-snug text-slate-100">
          <span className="min-w-0 flex-1">
            <b className="font-semibold">{canDuyet ? t('Đã gửi Head duyệt') : t('GVCN đã gửi duyệt')}:</b>{' '}
            <span className="whitespace-nowrap tabular-nums">{nganBac(d.khai.bac)} → {nganBac(cho.bac)}</span>
            {cho.han && <span className="whitespace-nowrap text-dim"> · {t('hạn {ngay}', { ngay: hienONgay(cho.han, 'ngay') })}</span>}
          </span>
          {/* PTA rà lần 2 #2058: máy chủ chỉ cho NGƯỜI GỬI rút — GVCN khác của lớp vẫn thấy dải, không có nút (khỏi bấm ra 403). */}
          {canDuyet
            ? (cho.nguoiXin != null && cho.nguoiXin === session?.user?.id
              ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void rut()}>{t('Rút')}</button> : null)
            : d.moHopDuyet ? <Link className="link whitespace-nowrap font-semibold" to={duongThe(cho.id, 'duyet')}>{t('Mở Chờ duyệt')} ›</Link> : null}
        </p>
      )}
      <Khoi tieuDe={t('Bậc em đã tới')} luat={t('Bậc em đã tới — dùng khi bậc trên web chưa đúng; lần xử lý cũ vẫn giữ.')}>
        {/* MOCKUP-1111 K5: cùng hàng chip một bấm với panel cả lớp (cỡ lớn); bậc đã khai = chip nền nhạt. */}
        <div {...lf.o(loi, 'bac')}>
          <ChipBac lon chon={bac} cu={laSua && d.khai ? d.khai.bac : null} onPick={setBac} nhan={t('Bậc đã xử lý')} />
        </div>
        {lf.loiCua(loi, 'bac') && <p className="m-0 text-xs text-late">{chuaDoi ? t('Chưa đổi gì — chọn bậc hoặc ngày / tháng khác với hiện tại.') : t('Chọn bậc cao nhất em đã bị xử lý')}</p>}
        {bac !== null && <p className="m-0 text-xs text-slate-500">{t('Lần xử lý kế tiếp của em: {nhanLoaiXuLy}.', { nhanLoaiXuLy: bacDu(nhanLoaiXuLy(kindCuaBac(bac + 1))) })}</p>}
      </Khoi>
      <Khoi tieuDe={t('Chi tiết')}>
        <Truong nhan={t('Ngày / tháng xử lý')} tuyChon>
          <ONgay kieu="ngay-hoac-thang" value={thang} onChange={setThang} toiDa={homNay || null} goiY={t('dd/mm/yyyy hoặc mm/yyyy')} />
        </Truong>
        {canDuyet ? (
          <Truong nhan={t('Lý do sửa')} batBuoc loi={lf.loiCua(loi, 'ghiChu')}>
            <textarea className="field w-full" rows={2} maxLength={500} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} {...lf.o(loi, 'ghiChu')}
              placeholder={t('Ví dụ: hồ sơ giấy chỉ có REPORT 1')} />
          </Truong>
        ) : (
          <Truong nhan={t('Ghi chú')} tuyChon>
            <textarea className="field w-full" rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
              placeholder={t('Ví dụ: REPORT 2 tháng 8, cô Hà gửi PH')} />
          </Truong>
        )}
      </Khoi>
    </KhungPanel>
  );
}
