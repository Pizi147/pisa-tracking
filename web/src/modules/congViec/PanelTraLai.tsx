import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel, Truong, useNhap, useXoaNhap } from '../../ui/KhungPanel.tsx';
import { ChuLuu, NutDongPanel, dauViec, type TtLuu } from '../../ui/KhuonViec.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { DsLichSu, LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { VI_PHAM_TEN_TOI_DA, bacDu, duongHoSoHocVien, monViPham, shortDate, tenMonNgan } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { lucVn } from './gioVn.ts';
import { KhoiGiaoViec, dongLichSuGiao, useGiaoViec } from './KhoiGiaoViec.tsx';
import { LuaChonRadio } from './PanelBaoPhTvv.tsx';
import { HOAN_TAC_MS, LichSuViPham, hoanTacTraLai, lamMoiTraLai, loiLyDo, type TraLaiView } from '../yThuc/TraLai.tsx';
import { xoaViPham } from '../yThuc/DeleteViolationConfirm.tsx';

type Cach = 'sua' | 'giu' | 'xoa' | 'thu_hoi';

/**
 * VIỆC GV "VI PHẠM BỊ TRẢ LẠI" / "LẦN XỬ LÝ BỊ TRẢ LẠI" (TL-2, N61; mockup `thiet-ke/v22/tra-lai-vi-pham.html` T4a–c, T5, T7, T8a).
 * Khối Phụ trách · Hạn · Theo dõi (GV-2, không "Đổi" — về đúng người ghi) · lời TVV trả · BA LỰA CHỌN (radio thật, nút chính đổi chữ theo lựa chọn):
 *  Sửa rồi gửi lại (một vi phạm: Ngày · Môn · Vi phạm · Mô tả → `gui-lai` với `sua`; cả lần: GVCN sửa lần xử lý ở tab Ý thức, chỉ gửi lại) ·
 *  Giữ nguyên + trả lời ≥ 8 (`giu-nguyen`) · Xoá vi phạm (đường xoá sẵn có — Đã xoá 30 ngày, khôi phục được; nút đỏ) · cả lần: Thu hồi (đường N5 sẵn có → chờ Head).
 * Đã xong / đã rút: chỉ đọc (kết quả · ai · lúc). Chữ đang gõ giữ theo việc (`useNhap`).
 */
export function PanelTraLai({ id, lop, onDong, onDaLam, onTiep }: {
  id: number; lop: string | null; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const { data: d, error, reload } = useApi<TraLaiView>(`/y-thuc/tra-lai/${id}`, [id]);
  const gv = useGiaoViec('tra_lai', id);
  const caLan = d ? d.measureId != null : false;
  const vp = d && !caLan ? d.viPham[0] ?? null : null;
  const [cach, setCach] = useNhap<Cach>('cach', 'sua');
  const [ngay, setNgay] = useNhap<string | null>('ngay', null);
  const [mon, setMon] = useNhap<string | null | undefined>('mon', undefined);
  const [ten, setTen] = useNhap<string | null>('ten', null);
  const [moTa, setMoTa] = useNhap<string | null>('mo-ta', null);
  const [traLoi, setTraLoi] = useNhap('tra-loi', '');
  const [lyDoTh, setLyDoTh] = useNhap('ly-do-thu-hoi', '');
  const xoaNhap = useXoaNhap();
  const lf = useLoiForm();
  const [tt, setTt] = useState<TtLuu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const toast = useToast();

  const tieuDe = caLan && d ? t('Lần xử lý bị trả lại · {nhan}', { nhan: d.nhanXuLy ?? '' }) : t('Vi phạm bị trả lại');
  const dau = dauViec({ han: d && d.trangThai === 'mo' ? <ChipHan vien loai="viec-van-hanh" han={d.han} /> : null, em: d ? { id: d.studentId, ten: d.tenEm } : null, lop,
    ngCanh: caLan ? null : d?.lanXuLy ? bacDu(d.lanXuLy.nhan) : null });
  dau.loai = `${t('Việc')} · ${t('Ý thức')}`;
  if (error) return <KhungPanel hd="vi-pham" tieuDe={tieuDe} dau={dau} onDong={onDong}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></KhungPanel>;
  if (!d) return <KhungPanel hd="vi-pham" tieuDe={tieuDe} dau={dau} onDong={onDong}><div className="pt-3"><Skeleton rows={6} /></div></KhungPanel>;

  const mo = d.trangThai === 'mo';
  const lamDuoc = mo && d.coTheLam;
  const dsCach: [Cach, string][] = [['sua', t('Sửa rồi gửi lại')], ['giu', t('Giữ nguyên + trả lời')],
    ...(caLan ? (d.coTheThuHoi ? [['thu_hoi', t('Thu hồi')] as [Cach, string]] : []) : d.coTheXoa ? [['xoa', t('Xoá vi phạm')] as [Cach, string]] : [])];
  const c: Cach = dsCach.some(([k]) => k === cach) ? cach : 'sua';
  /* Ô sửa: giá trị gốc của vi phạm cho tới khi người dùng gõ (null / undefined = chưa đổi). */
  const vNgay = ngay ?? vp?.occurredOn ?? '';
  const vMon = mon === undefined ? vp?.skill ?? null : mon;
  const vTen = ten ?? vp?.ten ?? '';
  const vMoTa = moTa ?? vp?.moTa ?? '';
  /* ponytail: chương trình lấy từ mã lớp "{CN} {MÃ} {số}" (ViolationView chưa có mã chương trình) — sai mã thì về 5 ô FT. */
  const ct = vp?.classCode?.split(' ')[1] ?? null;
  const dsMon = monViPham(ct);
  /* N1: lỗi dưới ô (useLoiForm) — một ô bắt buộc theo lựa chọn. */
  const loiChu = c === 'sua' && vp ? (!vTen.trim() ? t('Ghi vi phạm') : vTen.trim().length > VI_PHAM_TEN_TOI_DA ? t('Tối đa {VI_PHAM_TEN_TOI_DA} ký tự (đang có {n})', { VI_PHAM_TEN_TOI_DA, n: vTen.trim().length }) : null)
    : c === 'giu' ? loiLyDo(traLoi) : c === 'thu_hoi' ? loiLyDo(lyDoTh) : null;
  const khoaO = c === 'sua' ? 'ten' : c === 'giu' ? 'tra-loi' : 'ly-do';
  const loiO = loiChu ? [{ khoa: khoaO, nhan: c === 'sua' ? t('Vi phạm') : c === 'giu' ? t('Trả lời TVV') : t('Lý do thu hồi'), lyDo: loiChu }] : [];
  const daGo = ngay !== null || mon !== undefined || ten !== null || moTa !== null || !!traLoi.trim() || !!lyDoTh.trim();

  const sau = () => { xoaNhap(); setTt(null); lf.datLai(); lamMoiTraLai(); reload(); gv.reload(); onDaLam(); };
  /* B1-11 (AUDIT-2111): Gửi lại / Giữ nguyên có Hoàn tác 60 giây (như Trả lại) — máy chủ đảo yêu cầu về "mở", Báo PH dừng lại, tin TVV gỡ. */
  const coHoanTac = (chu: string) => toast.hoanTac(chu, () => {
    hoanTacTraLai(id).then(() => { reload(); gv.reload(); onDaLam(); toast.push('ok', t('Đã hoàn tác')); },
      (e: any) => toast.push('error', e?.message ?? t('Không hoàn tác được')));
  }, { ms: HOAN_TAC_MS });
  const gui = async (): Promise<boolean> => {
    lf.bam();
    if (loiO.length || tt === 'dang') return false;
    setTt('dang'); setLoi(null);
    try {
      if (c === 'sua') {
        const sua = vp ? { occurredOn: vNgay, skill: vMon, ten: vTen.trim(), description: vMoTa.trim() } : undefined;
        await api.post(`/y-thuc/tra-lai/${id}/gui-lai`, { sua });
        coHoanTac(t('Đã gửi lại · TVV nhận tin'));
      } else if (c === 'giu') {
        await api.post(`/y-thuc/tra-lai/${id}/giu-nguyen`, { traLoi: traLoi.trim() });
        coHoanTac(t('Đã gửi trả lời · TVV nhận tin'));
      } else if (c === 'xoa' && vp) {
        await xoaViPham(toast, vp.id);   // đường xoá sẵn có: toast Hoàn tác + Đã xoá 30 ngày; máy chủ tự đóng yêu cầu "đã xoá"
      } else if (c === 'thu_hoi' && d.measureId) {
        await api.post(`/discipline-measures/${d.measureId}/thu-hoi`, { lyDo: lyDoTh.trim() });
        invalidate('/yeu-cau');
        toast.push('ok', t('Đã gửi Head thu hồi'));
      }
      sau();
      return true;
    } catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); return false; }
  };

  const nutChinh = c === 'giu' ? t('Gửi trả lời') : c === 'xoa' ? t('Xoá vi phạm') : c === 'thu_hoi' ? t('Gửi Head duyệt') : t('Gửi lại');
  const quyChe = !lamDuoc ? null : c === 'sua' ? t('Gửi lại: TVV nhận tin, Báo PH hạn mới 5 ngày · không đổi bậc')
    : c === 'giu' ? t('Giữ nguyên: TVV nhận trả lời, Báo PH hạn mới 5 ngày')
    : c === 'xoa' ? t('Vào Đã xoá 30 ngày · khôi phục được') : t('Thu hồi: Head duyệt → "Đã thu hồi", giữ dòng + lịch sử');
  const chan = lamDuoc ? {
    huy: null, daSua: daGo, conThieu: lf.conThieu(loiO),
    trai: tt === 'loi' ? <ChuLuu tt="loi" loi={loi} /> : tt === 'dang' ? <ChuLuu tt="dang" /> : daGo ? <ChuLuu tt="nhap" /> : null,
    phu: <NutDongPanel busy={tt === 'dang'} />,
    chinh: <button type="button" className={`btn min-h-[44px] sm:min-h-0 ${c === 'xoa' ? 'btn-danger' : 'btn-primary'}`} disabled={tt === 'dang'} onClick={() => void gui()}>
      {tt === 'loi' ? t('Thử lại') : nutChinh}</button>,
  } : {
    huy: null, trai: <span className="text-slate-400">{d.trangThai === 'rut' ? t('TVV đã rút yêu cầu') : d.nhanKetQua ?? (mo ? t('Bạn chỉ xem') : null)}</span>, phu: null,
    chinh: onTiep ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{t('Việc tiếp ›')}</button>
      : <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>,
  };
  const lichSu = dongLichSuGiao(gv.g, hn).sort((a, b) => b.luc.localeCompare(a.luc));

  return (
    <KhungPanel hd="vi-pham" tieuDe={tieuDe} dau={dau} onDong={onDong} chan={chan} quyChe={quyChe ? { chu: quyChe } : null}>
      <div className="flex flex-col gap-4 pt-4">
        {gv.g && <KhoiGiaoViec g={gv.g} mo={mo} dat={gv.dat} reload={gv.reload} anDoi onDaDoi={() => { reload(); onDaLam(); }} />}
        {/* Lời TVV trả (mockup `.gui-gv`). */}
        <div className="grid gap-1.5 rounded-[10px] border px-4 py-3" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
          <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-slate-400">
            <b className="font-semibold text-slate-200">{caLan ? t('{ten} trả lại cả lần xử lý', { ten: d.nguoiTra.ten ?? '—' }) : t('{ten} trả lại', { ten: d.nguoiTra.ten ?? '—' })}</b>
            <span className="tabular-nums">{lucVn(d.traLuc)}</span></span>
          <span className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-100">«{d.lyDo}»</span>
        </div>
        {!mo && (
          <div role="status" className="grid gap-1 rounded-lg border border-ok-line bg-ok-bg px-3.5 py-2.5 text-sm">
            <b>{d.trangThai === 'rut' ? t('TVV đã rút yêu cầu') : d.nhanKetQua}</b>
            {(d.xongBoi || d.xongLuc) && <span className="text-dim">{[d.xongBoi, d.xongLuc && lucVn(d.xongLuc)].filter(Boolean).join(' · ')}</span>}
            {d.traLoi && <span className="whitespace-pre-line break-words">«{d.traLoi}»</span>}
          </div>
        )}
        {lamDuoc && (
          <>
            <Truong nhan={t('Bạn chọn')} as="div">
              <LuaChonRadio khungRo deu ten={`tra-lai-cach-${id}`} nhan={t('Bạn chọn')} value={c} muc={dsCach} onChange={(k) => { setCach(k); lf.datLai(); if (tt === 'loi') setTt(null); }} />
            </Truong>
            {c === 'sua' && vp && (
              <>
                <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-4 max-sm:grid-cols-1">
                  <Truong nhan={t('Ngày')}><ONgay kieu="ngay" value={vNgay} onChange={(x) => setNgay(x)} toiDa={hn} /></Truong>
                  {dsMon.length > 0 && <Truong nhan={t('Môn')} as="div">
                    <div className="flex flex-wrap gap-1.5">{dsMon.map((m) => <NutChon key={m} nho chon={vMon === m} onClick={() => setMon(vMon === m ? null : m)}>{tenMonNgan(ct, m)}</NutChon>)}</div>
                  </Truong>}
                </div>
                <Truong nhan={t('Vi phạm')} batBuoc loi={lf.loiCua(loiO, 'ten')} dem={{ co: vTen.trim().length, toiDa: VI_PHAM_TEN_TOI_DA }}>
                  <input className="field w-full" name="vi-pham" {...lf.o(loiO, 'ten')} autoComplete="off" value={vTen} onChange={(e) => setTen(e.target.value)} />
                </Truong>
                <Truong nhan={t('Mô tả')}>
                  <textarea className="field w-full" name="mo-ta" rows={3} maxLength={2000} autoComplete="off" value={vMoTa} placeholder={t('Ghi rõ em làm gì, bao lâu, đã nhắc chưa')} onChange={(e) => setMoTa(e.target.value)} />
                </Truong>
                <LichSuViPham id={vp.id} hn={hn} />
              </>
            )}
            {/* B3-08 (AUDIT-2111): link thẳng tới tab Ý thức của em (Quay lại về đúng việc này: địa chỉ giữ `?viec=`) — không tự tìm đường. */}
            {c === 'sua' && caLan && <p className="m-0 flex flex-wrap items-center gap-x-2 text-sm text-dim">{t('Sửa ghi chú GVCN / từng vi phạm ở tab Ý thức của em, rồi bấm Gửi lại.')}
              <Link className="link font-semibold max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={duongHoSoHocVien(d.studentId, { tab: 'y-thuc' })}>{t('Mở tab Ý thức của em ›')}</Link></p>}
            {(c === 'giu' || c === 'xoa') && vp && (
              <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-[10px] px-4 py-3 text-sm max-sm:grid-cols-1" style={{ background: 'var(--surface-2)' }}>
                <span className="text-[13px] text-dim">{c === 'xoa' ? t('Sẽ xoá') : t('Vi phạm')}</span>
                <span className="min-w-0 break-words">{[shortDate(vp.occurredOn, hn), vp.skill && tenMonNgan(ct, vp.skill), vp.ten].filter(Boolean).join(' · ')}</span>
                {c === 'xoa' && d.lanXuLy && <>
                  <span className="text-[13px] text-dim">{t('Còn')}</span>
                  <span className="min-w-0">{t('{n} vi phạm trong {lan}', { n: d.lanXuLy.soViPham - 1, lan: bacDu(d.lanXuLy.nhan) })}</span>
                </>}
              </div>
            )}
            {c === 'giu' && (
              <Truong nhan={t('Trả lời TVV')} batBuoc loi={lf.loiCua(loiO, 'tra-loi')}>
                <textarea className="field w-full" name="tra-loi" {...lf.o(loiO, 'tra-loi')} rows={3} maxLength={500} autoComplete="off" value={traLoi} placeholder={t('Vì sao giữ nguyên — TVV dùng để báo PH')} onChange={(e) => setTraLoi(e.target.value)} />
              </Truong>
            )}
            {c === 'thu_hoi' && (
              <Truong nhan={t('Lý do thu hồi')} batBuoc loi={lf.loiCua(loiO, 'ly-do')}>
                <textarea className="field w-full" name="ly-do-thu-hoi" {...lf.o(loiO, 'ly-do')} rows={3} maxLength={500} autoComplete="off" value={lyDoTh} onChange={(e) => setLyDoTh(e.target.value)} />
              </Truong>
            )}
          </>
        )}
        <LichSuGap so={lichSu.length}>
          <DsLichSu dong={lichSu.map((l, i) => ({ key: i, gio: lucVn(l.luc), ai: l.nguoi, viec: l.tieu, phu: l.phu }))} />
        </LichSuGap>
      </div>
    </KhungPanel>
  );
}
