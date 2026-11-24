import { useMemo } from 'react';
import { NhanTrangThai } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { TheYeuCau } from './TheYeuCau.tsx';
import { LichSuYeuCau } from './LichSuYeuCau.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { PHAN_LOAI_LABEL, mucHan, nhanTrangThaiYc, ngay as ngayHien, type TheYeuCauDto } from '@shared/domain/index.ts';

/**
 * CHO-DUYET-TAI-CHO (mockup v24 `cong-viec-gon.html` H1 · H2, chủ SP 24/11 — thay khối em + panel duyệt bên phải):
 * danh sách Chờ bạn duyệt nhóm theo loại; MỖI YÊU CẦU MỘT DÒNG = ô chọn · em + lớp · việc · nhãn · người gửi · hạn · mũi tên · [Từ chối] [Duyệt].
 * Bấm dòng → chi tiết mở NGAY DƯỚI dòng (`TheYeuCau dong`), không panel. Mọi dòng chung một bộ cột (subgrid, CSS `.dyc-*`): cột thẳng, nút sát lề phải.
 * Hạn luôn là ngày dd/mm/yyyy, chỉ tô màu CHỮ (không "quá hạn n ngày", không nền / badge).
 */
export type LenhDong = { id: number; loai: 'duyet' | 'tu-choi' | 'tra-loi'; n: number };
export type ChungDsDuyet = {
  mo: ReadonlySet<number>;
  dangO: ReadonlySet<number>;
  nhanId: number | null;
  lenh: LenhDong | null;
  dangGui: number | null;
  toi: number | null;
  chon: (y: TheYeuCauDto) => { checked: boolean; onChange: (v: boolean) => void } | null;
  onBam: (y: TheYeuCauDto) => void;
  onNut: (y: TheYeuCauDto, loai: LenhDong['loai']) => void;
  onXong: (id: number, chu?: string, huy?: boolean, soLichSu?: number) => void;
  onO: (id: number, dang: boolean) => void;
  onThemPa: (caseId: number) => void;
};

/** Nhóm theo loại thẻ; các loại Ý thức (xử lý · thu hồi · sửa cấp bậc…) gộp một nhóm "Ý thức". Thứ tự nhóm = thẻ đầu tiên của nhóm (máy chủ đã xếp quá hạn trước). */
const nhomCua = (y: TheYeuCauDto) => (y.phanLoai === 'y-thuc' ? dich(PHAN_LOAI_LABEL['y-thuc']) : dich(y.nhanLoai));

export function DsDuyet({ ds, ...c }: { ds: readonly TheYeuCauDto[] } & ChungDsDuyet) {
  const { homNay } = useNgayNghiepVu();
  const nhom = useMemo(() => {
    const m = new Map<string, TheYeuCauDto[]>();
    for (const y of ds) { const k = nhomCua(y); m.set(k, [...(m.get(k) ?? []), y]); }
    return [...m];
  }, [ds]);
  return (
    <div className="dyc"><div className="dyc-ds" aria-label={t('Yêu cầu chờ duyệt')}>
      {nhom.map(([ten, the]) => {
        const qua = the.filter((y) => y.trangThai === 'cho' && !!y.hanDuyet && y.hanDuyet < homNay).length;
        return (
          <section key={ten} className="dyc-nhom" aria-label={ten}>
            <div className="dyc-dau"><h3>{ten}</h3><span>{t('{n} yêu cầu', { n: the.length })}{qua > 0 && <> · <span className="dyc-qua">{t('{quaHan} quá hạn', { quaHan: qua })}</span></>}</span></div>
            {the.map((y) => <DongYc key={y.id} y={y} nhom={ten} {...c} />)}
          </section>
        );
      })}
    </div></div>
  );
}

const Xo = () => (
  <svg aria-hidden viewBox="0 0 16 16" className="dyc-xo" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
);

function DongYc({ y, nhom, mo, dangO, nhanId, lenh, dangGui, toi, chon, onBam, onNut, onXong, onO, onThemPa }: { y: TheYeuCauDto; nhom: string } & ChungDsDuyet) {
  const { homNay, ngan } = useNgayNghiepVu();
  const cho = y.trangThai === 'cho';
  const choQuyet = cho && y.kieuNut !== 'nhac';
  const dangMo = mo.has(y.id);
  const khoa = dangO.has(y.id) || dangGui === y.id;
  const o = chon(y);
  /* Tên việc: bỏ tiền tố trùng đầu nhóm / loại ("Đề xuất PA · Speaking" → "Speaking"). */
  const tieuDe = dich(y.tieuDe);
  const viec = [nhom, dich(y.nhanLoai)].map((p) => `${p} · `).find((p) => tieuDe.startsWith(p) && tieuDe.length > p.length);
  const viecHien = viec ? tieuDe.slice(viec.length) : tieuDe;
  const chip = y.loai === 'de_xuat_pa' || y.loai === 'giu_pa_gv';
  const phu = y.phu ? dich(y.phu) : null;
  const gui = y.nguoiXin ? (y.nguoiXinId != null && y.nguoiXinId === toi ? t('Bạn gửi') : t('{ten} gửi', { ten: y.nguoiXin })) : '';
  const tt = nhanTrangThaiYc(y.trangThai, y.tuDuyet);
  const muc = cho && y.hanDuyet ? mucHan(y.hanDuyet, homNay) : null;
  return (
    <div className="dyc-yc" id={`the-${y.id}`} data-mo={dangMo || undefined} data-nhan={nhanId === y.id || undefined}>
      <div className="dyc-dong" data-hd="cd-dong">
        <span className="dyc-chon">
          {o && (
            <label className="relative inline-flex cursor-pointer max-sm:after:absolute max-sm:after:left-1/2 max-sm:after:top-1/2 max-sm:after:h-11 max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-['']">
              <input type="checkbox" checked={o.checked} onChange={(e) => o.onChange(e.target.checked)} aria-label={t('Chọn: {tieuDe}', { tieuDe: dich(y.tieuDe) })} />
            </label>
          )}
        </span>
        <button type="button" className="dyc-mo" aria-expanded={dangMo} onClick={() => onBam(y)} title={y.neuDuyet && !dangMo ? t('Nếu duyệt: {neuDuyet}', { neuDuyet: dich(y.neuDuyet) }) : undefined}>
          <span className="dyc-ai"><span className="ten-hv">{y.hocVien ?? y.lop ?? ''}</span>{y.hocVien && y.lop && <span className="dyc-lop">{y.lop}</span>}{y.sos && <span className="dyc-sos"><ChipSos tinh muc={y.sos.muc} kyNang={y.sos.kyNang} tam={y.sos.tam} dot={y.diemHv?.luot} ten={y.hocVien} /></span>}</span>
          <span className="dyc-vd"><span className="dyc-lop2">{y.lop ? `${y.lop} · ` : ''}</span>{viecHien}</span>
          <span className="dyc-duoi">
            {y.sos && <span className="dyc-sos2"><ChipSos tinh muc={y.sos.muc} kyNang={y.sos.kyNang} tam={y.sos.tam} dot={y.diemHv?.luot} ten={y.hocVien} /></span>}
            <span className="dyc-nh">{phu && (chip ? phu.split(' · ').map((p, i) => <span key={i} className="dyc-chip">{p}</span>) : phu)}</span>
            <span className="dyc-lq" title={y.nguoiXin && y.vaiNguoiXin ? `${y.nguoiXin} · ${dich(y.vaiNguoiXin)}` : undefined}>{gui}</span>
          </span>
          {cho
            ? <span className="dyc-hn" data-muc={muc ?? undefined} title={y.hanDuyet ? ngayHien(y.hanDuyet) : undefined}>{y.hanDuyet ? ngayHien(y.hanDuyet) : ''}</span>
            : <span className="dyc-hn flex items-center gap-1.5"><NhanTrangThai t={tt.t} />{y.xuLyLuc && <span className="text-[12px]">{ngan(y.xuLyLuc)}</span>}</span>}
          <Xo />
        </button>
        <span className="dyc-nut" data-yc-nut={y.id}>
          {!choQuyet ? null : y.kieuNut === 'duyet-tu-choi' ? <>
            <button type="button" className="btn" disabled={khoa} onClick={() => onNut(y, 'tu-choi')}>{t('Từ chối')}</button>
            <button type="button" className="btn btn-primary" disabled={khoa} onClick={() => onNut(y, 'duyet')}
              title={y.nguoiXinId != null && y.nguoiXinId === toi ? t('Bạn tự gửi · tự duyệt được') : undefined}>{dangGui === y.id ? t('Đang lưu…') : t('Duyệt')}</button>
          </> : (
            <button type="button" className="btn btn-primary" disabled={khoa} onClick={() => onNut(y, 'tra-loi')}>{t('Trả lời')}</button>
          )}
        </span>
      </div>
      {dangMo && <>
        <TheYeuCau yc={y} dong lenh={lenh?.id === y.id ? lenh : undefined} onXong={onXong} onO={(d) => onO(y.id, d)} onThemPa={onThemPa} />
        {(y.soLichSu ?? 0) > 0 && <div className="dyc-ct" style={{ paddingTop: 0, borderTop: 0 }}><LichSuYeuCau id={y.id} n={y.soLichSu ?? 0} className="mt-0" /></div>}
      </>}
    </div>
  );
}
