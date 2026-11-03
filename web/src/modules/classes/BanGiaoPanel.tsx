import { useEffect, useMemo, useRef, useState } from 'react';
import { api, invalidate, invalidateGop } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { Nhan, QuaHan } from '../../ui/Nhan.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ChuDich } from '../../ui/ChuDich.tsx';
import { DsEmBanGiao, TuDienEm, useHangLuu } from './banGiaoChung.tsx';
import { dongSauKhiLuu, type HangLuu } from '../../lib/luuChac.ts';
import { CHU_CHUYEN_LOP, NHAN_XET_TOI_THIEU, deadlineView, ngay, shortDate, tuanLich, type PhieuBanGiaoDto, type PhieuEm } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * BÀN GIAO (PR-CT, §3.1f Q30-2, mockup 20 màn F · G · đọc bàn giao) — MỘT panel, ba dạng theo người mở:
 *   F  GVCN lớp cũ (hoặc Quản lý xác nhận thay): trái danh sách em + trạng thái phiếu, phải phiếu của em đang chọn — Hệ thống tự điền (chỉ đọc), mỗi môn một câu của
 *      GVBM (Điền thay; OV-12h bỏ Nhắc), Nhận xét chung (bắt buộc ≥ 15 ký tự) → Xác nhận bàn giao. ↑/↓ đi từng em. Dưới 820 px: danh sách trên, phiếu dưới.
 *   G  GVBM của môn: bảng mỗi em một câu, lưu khi rời ô.
 *   PR-B: danh sách em + tự điền dùng khung chung (`banGiaoChung.tsx`, cùng panel bàn giao đổi GV); nhận xét chung lưu nháp khi rời ô (Xác nhận vẫn
 *   kiểm ≥ 15 ký tự). Chủ SP 30/10: môn ở lớp mới vẫn đúng GV cũ dạy → "Cùng GV · không cần bàn giao"; GVCN cùng người → nhận xét chung tuỳ chọn.
 *   Đọc: GV / Quản lý lớp mới, hoặc bất kỳ ai không ghi được — cùng bố cục F, chỉ đọc, hiện "Xác nhận bởi …".
 * Lối vào: Công việc › việc Bàn giao · hồ sơ lớp › dải Bàn giao / Sắp nhận · hồ sơ học viên › dải Sắp chuyển (mở thẳng em đó — `lenhId`).
 */
export function BanGiaoPanel({ classId, mon, lenhId, onClose, onDone, quayLai }: {
  classId: number; mon?: string | null; lenhId?: number | null; onClose: () => void; onDone: () => void;
  /** OV-15h1: mở thay panel Lộ trình ở Tổng quan — "‹ Lộ trình" về lại panel đó. */
  quayLai?: { nhan: string; onClick: () => void };
}) {
  const { data, loading, error, reload } = useApi<PhieuBanGiaoDto>(`/lenh-chuyen/ban-giao?lop=${classId}${mon ? `&mon=${mon}` : ''}`, [classId, mon]);
  if (error) {
    return (
      <KhungPanel quayLai={quayLai} tieuDe={t('Bàn giao')} onDong={onClose} chan={{ huy: { nhan: t('Đóng'), onClick: onClose } }}>
        <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
      </KhungPanel>
    );
  }
  if (loading || !data) {
    return <KhungPanel quayLai={quayLai} tieuDe={t('Bàn giao')} onDong={onClose}><Skeleton rows={6} /></KhungPanel>;
  }
  const monToi = data.nguoiXem.monGhi;
  /* G: chỉ GVBM (không GVCN, không Quản lý thay) mở kèm môn của mình. */
  const cheDoG = !data.nguoiXem.gvcn && !data.nguoiXem.xacNhan && data.nguoiXem.xemTuNguon && monToi.length > 0;
  return cheDoG
    ? <BangGvbm dto={data} mons={monMo(mon, monToi)} lenhId={lenhId ?? null} onClose={onClose} onDone={onDone} reload={reload} quayLai={quayLai} />
    : <MasterDetail dto={data} lenhId={lenhId ?? null} onClose={onClose} onDone={onDone} reload={reload} quayLai={quayLai} />;
}

type Chung = { dto: PhieuBanGiaoDto; lenhId: number | null; onClose: () => void; onDone: () => void; reload: () => void; quayLai?: { nhan: string; onClick: () => void } };

// ==================================================================== F · GVCN

function MasterDetail({ dto, lenhId, onClose, onDone, reload, quayLai }: Chung) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [chon, setChon] = useState<number | null>(lenhId ?? dto.ds.find((e) => !e.xacNhan)?.lenhId ?? dto.ds[0]?.lenhId ?? null);
  const em = dto.ds.find((e) => e.lenhId === chon) ?? dto.ds[0] ?? null;
  const [nhanXet, setNhanXet] = useState<Record<number, string>>({});
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dienThay, setDienThay] = useState<{ lenhId: number; mon: string; chu: string } | null>(null);
  /* OV-7a: phiếu đã xác nhận — "Sửa" mở lại ô nhận xét + câu từng môn (tới ngày thi hành lệnh; sau đó chỉ Quản lý). */
  const [dangSua, setDangSua] = useState(false);
  const [nxLuu, setNxLuu] = useState<'yen' | 'luu' | 'da' | 'loi'>('yen');
  const ghi = dto.nguoiXem.xemTuNguon && dto.nguoiXem.xacNhan;   // được viết nhận xét + xác nhận (GVCN, hoặc Quản lý thay)
  const suaPhieu = !!em?.xacNhan && dangSua;
  const docThoi = !ghi && !suaPhieu;

  useEffect(() => { setDaBam(false); setDienThay(null); setDangSua(false); setNxLuu('yen'); }, [chon]);
  const nhap = em ? nhanXet[em.lenhId] ?? em.nhanXetChung ?? '' : '';
  /* Chủ SP 30/10 [PTA đoán]: GVCN lớp mới cũng là GVCN lớp cũ → nhận xét chung không bắt buộc. */
  const canNx = !!em && !em.gvcnCung;
  const thieu = canNx && nhap.trim().length < NHAN_XET_TOI_THIEU;
  const dsXn = dto.ds.filter((e) => !e.xacNhan).length;
  const oNx = useRef(new Map<number, ReturnType<HangLuu['o']>>()).current;
  /* 6c (lỗi 5): nhận xét đã gõ khác bản đã lưu, hoặc ô điền thay đang mở. */
  const daSuaNx = !!dienThay || dto.ds.some((e) => nhanXet[e.lenhId] !== undefined
    && (oNx.get(e.lenhId)?.chuaLuu() ?? nhanXet[e.lenhId].trim() !== (e.nhanXetChung ?? '').trim()));

  /*
   * PR-B: nhận xét chung lưu NHÁP khi rời ô (chưa xác nhận) — không mất chữ khi đóng panel / đổi em. F01 (audit 03/11): mỗi em một ô xếp lượt
   * (`taoOLuu`) — gõ tiếp khi đang lưu thì phản hồi bản cũ không báo "Đã lưu"; Xác nhận chờ lần lưu nháp đang chạy (máy chủ từ chối nháp sau xác nhận).
   */
  const hang = useHangLuu();
  const chonRef = useRef(chon);
  chonRef.current = em?.lenhId ?? null;
  const oCua = (e: PhieuEm) => {
    let o = oNx.get(e.lenhId);
    if (!o) {
      o = hang.o(String(e.lenhId), e.nhanXetChung ?? '',
        /* Audit 03/11: không tải lại cả phiếu sau mỗi lần lưu nháp — gom 1,5 s (`invalidateGop`, đọc Turso ít). */
        (v) => api.put(`/lenh-chuyen/${e.lenhId}/nhan-xet-nhap`, { nhanXetChung: v ?? '' }).then(() => { invalidateGop('/lenh-chuyen'); return null; }, (er: any) => er?.message ?? ''),
        (tt) => { if (chonRef.current === e.lenhId) setNxLuu(tt === 'dang' ? 'luu' : tt === 'xong' ? 'da' : tt === 'loi' ? 'loi' : 'yen'); });
      oNx.set(e.lenhId, o);
    }
    return o;
  };
  const luuNhapNx = () => {
    if (!em || em.xacNhan || !ghi || nhanXet[em.lenhId] === undefined) return;
    void oCua(em).luu();
  };

  const xacNhan = async () => {
    if (!em) return;
    setDaBam(true);
    if (thieu) return;
    setBusy(true);
    try {
      await hang.xong();
      await api.post(`/lenh-chuyen/${em.lenhId}/xac-nhan`, { nhanXetChung: nhap.trim() });
      invalidate('/lenh-chuyen'); invalidate('/classes'); invalidate('/my-work'); invalidate('/students'); invalidate('/yeu-cau');
      toast.push('ok', t('Đã xác nhận bàn giao {ten}', { ten: em.ten }));
      const con = dto.ds.filter((e) => !e.xacNhan && e.lenhId !== em.lenhId);
      onDone(); reload();
      if (con.length) setChon(con[0].lenhId);
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const luuSua = async () => {
    if (!em) return;
    setDaBam(true);
    if (thieu) return;
    setBusy(true);
    try {
      await api.put(`/lenh-chuyen/${em.lenhId}/ban-giao`, { nhanXetChung: nhap.trim() });
      invalidate('/lenh-chuyen'); invalidate('/students');
      toast.push('ok', t('Đã lưu bàn giao {ten}', { ten: em.ten }));
      setDangSua(false); setDaBam(false); reload();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const luuDienThay = async () => {
    if (!dienThay || !dienThay.chu.trim()) return;
    try {
      await api.put(`/lenh-chuyen/${dienThay.lenhId}/ban-giao-mon`, { mon: dienThay.mon, noiDung: dienThay.chu.trim() });
      invalidate('/lenh-chuyen'); invalidate('/my-work');
      setDienThay(null); reload();
    } catch (er: any) { toast.push('error', er.message); }
  };

  const chuaMon = em ? em.mon.filter((m) => (!m.noiDung || m.lamLai) && !m.cungGv) : [];   // môn "Cùng GV" không chờ (chủ SP 30/10)
  /* Lỗi chủ SP 30/10: số ngày quá hạn bàn giao của từng em (null = chưa quá / đã xác nhận). */
  const quaHan = (e: { hanGvcn: string | null; xacNhan: unknown }) => {
    const v = !e.xacNhan && e.hanGvcn ? deadlineView({ kind: 'viec-van-hanh', due: e.hanGvcn, today: homNay }) : null;
    return v?.tone === 'overdue' ? v.daysOverdue : null;
  };
  const quaHanSom = quaHan({ hanGvcn: dto.hanGvcn, xacNhan: null });

  return (
    <KhungPanel quayLai={quayLai} rong="toan" loai={ghi ? t('VIỆC · BÀN GIAO') : t('BÀN GIAO · ĐỌC')} tieuDe={`${t('Bàn giao')} · ${dto.lop.code}`} onDong={onClose}
      ngCanh={<span className="tabular-nums">{t('{n} em', { n: dto.tong })} · {t('{a}/{b} đã xác nhận', { a: dto.daXacNhan, b: dto.tong })}{dto.hanGvcn && <> · {t('hạn sớm nhất {ngay}', { ngay: shortDate(dto.hanGvcn, homNay) })}{quaHanSom != null && <> · {dto.hanGvcnEm} <QuaHan ngay={quaHanSom} /></>}</>}</span>}
      chan={{
        daSua: daSuaNx,
        huy: suaPhieu
          ? { nhan: t('Huỷ thay đổi'), disabled: busy, onClick: () => { setDangSua(false); setDaBam(false); setDienThay(null); setNhanXet((m) => { const { [em!.lenhId]: _, ...con } = m; return con; }); } }
          : { nhan: t('Đóng'), onClick: onClose },
        dongTren: ghi && em && !em.xacNhan ? (
          <p className="m-0 px-4 pt-2 text-right text-xs text-slate-400">{t('Môn còn trống sẽ ghi “GVBM chưa bàn giao”.')}</p>
        ) : undefined,
        chinh: ghi && em && !em.xacNhan ? (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={xacNhan} disabled={busy || (canNx && !nhap.trim())} title={canNx && !nhap.trim() ? t('Viết nhận xét chung trước khi xác nhận') : undefined}>{dich(CHU_CHUYEN_LOP.banGiao)}</button>
        ) : suaPhieu ? (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luuSua} disabled={busy}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
        ) : em?.xacNhan && em.suaDuoc && (ghi || dto.nguoiXem.ql) ? (
          <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setDangSua(true)}>{t('Sửa')}</button>
        ) : undefined,
        conThieu: daBam && thieu && em && (ghi || suaPhieu) ? [{ nhan: t('Nhận xét chung'), oId: 'o-nhan-xet' }] : undefined,
        trai: ghi && em && !em.xacNhan ? <span className="text-xs text-slate-500">{t('Tự lưu khi rời ô')}</span> : undefined,
      }}>
      {dto.ds.length === 0 && <p className="mt-3 text-sm text-slate-400">{t('Không có em nào cần bàn giao.')}</p>}
      {em && (
        <div className="grid gap-4 pt-3 md:grid-cols-[280px_minmax(0,1fr)]">
          <DsEmBanGiao nhan={t('Học viên cần bàn giao')} ds={dto.ds.map((e) => ({ ...e, id: e.lenhId }))} chon={em.lenhId} onChon={setChon}
            trangThai={(e) => ({ khoa: e.phieu.khoa === 'da-xac-nhan' ? 'du' : e.phieu.khoa === 'mon' ? 'thieu' : 'muted', nhan: dich(e.phieu.nhan) })}
            phu={(e) => (
              <>
                <span className="min-w-0 truncate">{e.lopDich ? `→ ${e.lopDich.code} · ${tuanLich(e.tuan, homNay)}` : e.huong === 'bao_luu' ? `${t('Tạm dừng học (bảo lưu)')}${e.ngayXemLai ? ` · ${t('xem lại {tuan}', { tuan: tuanLich(e.ngayXemLai, homNay) })}` : ''}` : tuanLich(e.tuan, homNay)}</span>
                {quaHan(e) != null && <QuaHan ngay={quaHan(e)} />}
              </>
            )} />

          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="m-0 text-base font-semibold text-slate-100">
                {em.ten}{em.lopDich ? ` → ${em.lopDich.code}` : ''} <span className="font-normal text-slate-400">{t('từ {tuan}', { tuan: tuanLich(em.tuan, homNay) })}</span>
              </h3>
              {!em.xacNhan && chuaMon.length > 0 && <Nhan tone="soon">{t('Chờ môn {ds}', { ds: chuaMon.map((m) => m.ngan).join(', ') })}</Nhan>}
              {em.xacNhan && <Nhan tone="ok">{t('Đã xác nhận')}</Nhan>}
              {!em.xacNhan && em.hanGvcn && <Han loai="viec-van-hanh" han={em.hanGvcn} />}
            </div>

            <TuDienEm tuDien={em.tuDien} daChup={em.tuDienDaChup} />

            <section aria-label={t('Thông tin bàn giao của GVBM')}>
              <h4 className="mb-2 mt-0 text-[12px] font-semibold text-slate-500">
                {t('Bàn giao của GVBM · mỗi môn một câu')}{ghi && !em.xacNhan && <span className="ml-2 font-normal normal-case tracking-normal text-slate-500">{t('GVCN điền thay được')}</span>}
              </h4>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {em.mon.map((m) => (
                  <li key={m.ma} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 text-sm">
                    <abbr title={m.ten} className="font-bold text-slate-300 no-underline">{m.ngan}</abbr>
                    <div className="min-w-0">
                      {m.cungGv && !m.noiDung ? (
                        <span className="text-slate-400">{t('Cùng GV · không cần bàn giao')}</span>
                      ) : m.noiDung ? (
                        <span className="text-slate-200"><ChuDich chu={m.noiDung} nguon={m.id ? { bang: 'ban_giao_mon', id: m.id, cot: 'noi_dung' } : null} /> <span className="text-slate-500">— {m.nguoiGhi}, {ngay(m.ghiLuc, homNay)}{m.dienThay ? ` ${t('(điền thay)')}` : ''}{m.lamLai ? '' : ' ✓'}</span>
                          {m.lamLai && <> <Nhan tone="soon">{t('Cần làm lại')}</Nhan></>}</span>
                      ) : em.xacNhan ? (
                        <span className="text-slate-500">{t('GVBM chưa bàn giao')}</span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-slate-400">{t('Chưa có')}{m.gvbm.length ? ` · ${m.gvbm.join(', ')}` : ''}, <Han loai="viec-van-hanh" han={em.hanGvbm} /></span>
                          {ghi && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-label={t('Điền thay {mon} · {ten}', { mon: m.ngan, ten: em.ten })} onClick={() => setDienThay({ lenhId: em.lenhId, mon: m.ma, chu: '' })}>{t('Điền thay')}</button>}
                        </span>
                      )}
                      {suaPhieu && (dto.nguoiXem.monGhi.includes(m.ma) || dto.nguoiXem.ql) && !(dienThay?.lenhId === em.lenhId && dienThay.mon === m.ma) && (
                        <button type="button" className="link ml-2 border-0 bg-transparent p-0 text-xs" onClick={() => setDienThay({ lenhId: em.lenhId, mon: m.ma, chu: m.noiDung ?? '' })}>
                          {m.noiDung ? t('Sửa') : t('Điền thay')}
                        </button>
                      )}
                      {dienThay && dienThay.lenhId === em.lenhId && dienThay.mon === m.ma && (
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <input className="field min-w-[14rem] flex-1" autoFocus maxLength={300} aria-label={t('{viec} môn {mon}', { viec: m.noiDung ? t('Sửa') : t('Điền thay'), mon: m.ngan })} value={dienThay.chu}
                            placeholder={t('Viết một câu…')} onChange={(e) => setDienThay({ ...dienThay, chu: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') void luuDienThay(); if (e.key === 'Escape') { e.stopPropagation(); setDienThay(null); } }} />
                          <button type="button" className="btn btn-sm btn-primary" disabled={!dienThay.chu.trim()} onClick={luuDienThay}>{t('Lưu')}</button>
                          <button type="button" className="btn btn-sm" onClick={() => setDienThay(null)}>{t('Đóng')}</button>
                        </span>
                      )}
                    </div>
                  </li>
                ))}
                {em.writingCu && (
                  <li className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 text-sm">
                    <span className="font-bold text-slate-500">W</span>
                    <span className="min-w-0 text-slate-400">{em.writingCu.noiDung} <span className="text-slate-500">— {em.writingCu.nguoiGhi}, {ngay(em.writingCu.ghiLuc, homNay)} · {t('Writing · cũ, trước khi tách W1 / W2')}</span></span>
                  </li>
                )}
              </ul>
            </section>

            <Truong nhan={t('Nhận xét chung của GVCN')} batBuoc={canNx && ((ghi && !em.xacNhan) || suaPhieu)} dem={canNx && ((ghi && !em.xacNhan) || suaPhieu) ? { co: nhap.trim().length, can: NHAN_XET_TOI_THIEU } : undefined}
              loi={daBam && thieu && (ghi || suaPhieu) ? t('Cần ít nhất {n} ký tự', { n: NHAN_XET_TOI_THIEU }) : null}>
              <textarea id="o-nhan-xet" className="field w-full" rows={3} readOnly={docThoi || (!!em.xacNhan && !suaPhieu)} aria-invalid={daBam && thieu && (ghi || suaPhieu)}
                value={nhap} placeholder={docThoi ? undefined : t('Ví dụ: Em chăm, ngại nói trước lớp. Mẹ theo sát, liên hệ qua Zalo.')}
                onChange={(e) => { setNhanXet((m) => ({ ...m, [em.lenhId]: e.target.value })); oCua(em).go(e.target.value); }} onBlur={luuNhapNx} />
            </Truong>
            {ghi && !em.xacNhan && (nxLuu !== 'yen' || !canNx) && (
              <p className="m-0 -mt-2 text-xs text-slate-500" aria-live="polite">
                {nxLuu === 'luu' ? t('Đang lưu…') : nxLuu === 'da' ? t('✓ Đã lưu') : nxLuu === 'loi' ? <span className="text-late">{t('Không lưu được — chữ vẫn giữ, thử lại khi rời ô.')}</span> : null}
                {!canNx && nxLuu === 'yen' && t('GVCN lớp mới là bạn — nhận xét chung không bắt buộc.')}
              </p>
            )}
            {/* P14 DICH: dịch nhận xét ĐÃ LƯU (chưa gõ đổi) — bản dịch hiện dưới ô, không vào ô; ngoài <label> để nút không bấm nhầm vào ô. */}
            {em.nhanXetChung && nhap === em.nhanXetChung && (
              <p className="m-0 -mt-2 whitespace-pre-wrap break-words text-[13px] text-slate-300"><ChuDich chu={em.nhanXetChung} nguon={{ bang: 'lenh_chuyen_lop', id: em.lenhId, cot: 'nhan_xet_chung' }} anGoc /></p>
            )}
            {em.xacNhan && (
              <p className="m-0 text-xs text-slate-400">
                {t('Xác nhận bởi {ai}', { ai: em.xacNhan.boi ?? t('GVCN') })}{em.xacNhan.thay ? ` ${t('(Quản lý xác nhận thay)')}` : ''} · {ngay(em.xacNhan.luc, homNay)}
              </p>
            )}
            {!ghi && !em.xacNhan && dto.nguoiXem.xemTuNguon && <p className="m-0 text-xs text-slate-400">{t('GVCN lớp cũ xác nhận; Quản lý xác nhận thay khi lớp chưa có GVCN hoặc quá hạn 3 ngày.')}</p>}
          </div>
        </div>
      )}
      {dsXn === 0 && dto.ds.length > 0 && <p className="mt-4 text-xs text-slate-400">{t('Đã xác nhận đủ {n} em.', { n: dto.tong })}</p>}
    </KhungPanel>
  );
}

// ==================================================================== G · GVBM

/** Ô GVBM được mở cùng: GV dạy cả W1 + W2 → hai cột cùng bảng (chủ SP 03/11, mockup v11 đã duyệt); `mon` có thể là "writing1,writing2". */
function monMo(mon: string | null | undefined, monToi: readonly string[]): string[] {
  const xin = (mon ?? '').split(',').filter((m) => monToi.includes(m));
  const ds = xin.length ? xin : monToi.slice(0, 1);
  const w = ['writing1', 'writing2'];
  return ds.some((m) => w.includes(m)) && w.every((m) => monToi.includes(m)) ? [...ds.filter((m) => !w.includes(m)), ...w] : ds;
}

type TtO = 'idle' | 'go' | 'dang' | 'xong' | 'loi';

function BangGvbm({ dto, mons, lenhId, onClose, onDone, reload, quayLai }: Chung & { mons: string[] }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const hai = mons.length > 1;
  const mDs = mons.map((m) => dto.lop.mon.find((x) => x.ma === m)!);
  const k = (e: PhieuEm, m: string) => `${e.lenhId}|${m}`;
  const [chu, setChu] = useState<Record<string, string>>({});
  const [tt, setTt] = useState<Record<string, { tt: TtO; loi?: string }>>({});
  const oMon = (e: PhieuEm, m: string) => e.mon.find((x) => x.ma === m);
  /* Em không học môn (N13) không có dòng môn đó; "Cùng GV" chưa ai viết → không cần câu. */
  const can = (e: PhieuEm, m: string) => !!oMon(e, m) && !(oMon(e, m)!.cungGv && !oMon(e, m)!.noiDung);
  const daCo = (e: PhieuEm, m: string) => (!!oMon(e, m)?.noiDung && !oMon(e, m)?.lamLai) || tt[k(e, m)]?.tt === 'xong';
  const dem = mons.map((m) => ({ m, can: dto.ds.filter((e) => can(e, m)).length, da: dto.ds.filter((e) => can(e, m) && daCo(e, m)).length }));
  const han = useMemo(() => mons.map((m) => dto.theoMon.find((x) => x.ma === m)?.han).filter((x): x is string => !!x).sort()[0] ?? null, [dto, mons]);
  /* F01 (audit 03/11): mỗi ô một lượt lưu (`taoOLuu`) — gõ tiếp khi đang lưu thì phản hồi bản cũ không báo "Đã lưu"; Đóng chờ lần lưu đang chạy. */
  const hang = useHangLuu();
  const chuRef = useRef(chu);
  chuRef.current = chu;
  const oO = useRef(new Map<string, ReturnType<HangLuu['o']>>()).current;
  const oCua = (e: PhieuEm, m: string) => {
    let o = oO.get(k(e, m));
    if (!o) {
      o = hang.o(k(e, m), oMon(e, m)?.noiDung ?? '',
        (v) => api.put(`/lenh-chuyen/${e.lenhId}/ban-giao-mon`, { mon: m, noiDung: v ?? '' })
          .then(() => { invalidateGop('/lenh-chuyen', '/my-work', '/classes'); return null; }, (er: any) => er?.message ?? ''),
        (moi, lyDo) => setTt((x) => ({ ...x, [k(e, m)]: moi === 'loi'
          ? { tt: 'loi', loi: lyDo || t('Không lưu được — chữ vẫn giữ, thử lại khi rời ô.') }
          : { tt: moi === 'idle' && o!.chuaLuu() ? 'go' : moi } })));
      oO.set(k(e, m), o);
    }
    return o;
  };
  /* Ô có chữ khác bản máy chủ (lưu lỗi / chưa rời ô) → ✕ / Esc hỏi trước khi đóng. */
  const daSua = Object.keys(chu).some((kk) => oO.get(kk)?.chuaLuu());
  const dongHan = () => { onDone(); onClose(); };
  const baoChuaLuu = (n: number) => toast.push('error', t('Còn {n} ô chưa lưu được — chữ vẫn giữ. Rời ô để lưu lại; bấm Đóng lần nữa thì chữ ở ô lỗi sẽ mất.', { n }));
  const dong = dongSauKhiLuu(hang, dongHan, baoChuaLuu);
  const idO = (lenh: number, m: string) => `o-bg-${lenh}-${m}`;

  useEffect(() => {
    if (lenhId == null) return;
    const el = document.getElementById(idO(lenhId, mons[0]));
    el?.scrollIntoView({ block: 'center' });
    el?.focus();
  }, [lenhId]);   // eslint-disable-line react-hooks/exhaustive-deps

  /** `giu`: phiếu cần làm lại (OV-3b) — lưu lại đúng chữ cũ cũng là xác nhận lại. */
  const ghi = async (e: PhieuEm, m: string, giu = false) => {
    const v = (chuRef.current[k(e, m)] ?? oMon(e, m)?.noiDung ?? '').trim();
    if (!v) return;
    if (!giu) { void oCua(e, m).luu(); return; }
    try {
      await api.put(`/lenh-chuyen/${e.lenhId}/ban-giao-mon`, { mon: m, noiDung: v });
      setTt((x) => ({ ...x, [k(e, m)]: { tt: 'xong' } }));
      invalidate('/lenh-chuyen'); invalidate('/my-work'); invalidate('/classes');
      reload();
    } catch (er: any) { setTt((x) => ({ ...x, [k(e, m)]: { tt: 'loi', loi: er.message } })); }
  };
  /* "Còn … ↑": tới ô còn trống đầu tiên (theo thứ tự em, rồi cột). */
  const conThieu = dem.filter((x) => x.can > x.da);
  const denThieu = () => {
    for (const e of dto.ds) for (const m of mons) if (can(e, m) && !daCo(e, m)) { document.getElementById(idO(e.lenhId, m))?.focus(); return; }
  };
  const ngan = (m: string) => dto.lop.mon.find((y) => y.ma === m)?.ngan ?? m;
  const cot = hai ? 'sm:grid-cols-[12rem_9rem_minmax(0,1fr)_minmax(0,1fr)]' : 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,2fr)]';
  const oTrong = (chuO: string) => (
    <span className="flex min-h-[44px] items-center rounded-lg border border-dashed px-2.5 text-[13px] text-slate-500 sm:min-h-[40px]" style={{ borderColor: 'var(--line-strong)' }}>{chuO}</span>
  );
  const nhanTt: Record<TtO, string> = { idle: '', go: t('● Đang gõ · lưu khi rời ô'), dang: t('Đang lưu…'), xong: t('✓ Đã lưu'), loi: '' };

  return (
    <KhungPanel quayLai={quayLai} rong={hai ? 'toan' : 'rong'} loai={t('VIỆC · BÀN GIAO')} onDong={dong}
      tieuDe={hai ? t('Bàn giao môn {mon} · {lop}', { mon: mDs.map((x) => x.ngan).join(' · '), lop: dto.lop.code }) : t('Bàn giao môn {mon} ({ten})', { mon: mDs[0].ngan, ten: mDs[0].ten })}
      ngCanh={<span className="tabular-nums">{!hai && <>{dto.lop.code} · </>}{t('{n} em', { n: dto.tong })}{han && <> · <Han loai="viec-van-hanh" han={han} /></>} · {hai ? t('mỗi em một câu mỗi task') : t('mỗi em một câu')}</span>}
      chan={{
        daSua,
        huy: { nhan: t('Đóng'), onClick: dongSauKhiLuu(hang, dongHan, baoChuaLuu, true) },
        trai: (
          <span className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
            <span className="tabular-nums">{hai ? t('Tự lưu khi rời ô') : t('Tự lưu khi rời ô · {a}/{b} em đã có', { a: dem[0].da, b: dem[0].can })}</span>
            {conThieu.length > 0 && (
              <button type="button" className="min-h-[44px] border-0 bg-transparent p-0 text-xs font-semibold text-soon hover:underline sm:min-h-0" onClick={denThieu}>
                {hai ? t('Còn {ds} ↑', { ds: conThieu.map((x) => t('{mon}: {n} em', { mon: ngan(x.m), n: x.can - x.da })).join(' · ') })
                  : t('Còn {n} em ↑', { n: conThieu[0].can - conThieu[0].da })}
              </button>
            )}
          </span>
        ),
      }}>
      <div className="surface-2 mt-3 divide-y rounded-lg" style={{ borderColor: 'var(--line)' }} role="table" aria-label={t('Bàn giao môn {mon}', { mon: mDs.map((x) => x.ngan).join(' · ') })}>
        <div role="row" className={`hidden gap-3 px-3 py-2 text-[12px] font-semibold text-slate-500 sm:grid ${cot}`}>
          <span role="columnheader">{t('Học viên')}</span><span role="columnheader">{t('Kết quả')}</span>
          {hai ? dem.map((x, i) => (
            <span key={x.m} role="columnheader">{mDs[i].ngan} · {mDs[i].ten} <span className="font-normal tabular-nums">· {t('{a}/{b} em đã có', { a: x.da, b: x.can })}</span></span>
          )) : <span role="columnheader">{t('Thông tin bàn giao')}</span>}
        </div>
        {dto.ds.map((e) => {
          const khoa = !!e.xacNhan && !e.suaDuoc;   // OV-13h: đã xác nhận vẫn sửa được, cả sau ngày chuyển lớp (khoá chỉ khi lệnh huỷ / không quyền)
          return (
            <div key={e.lenhId} role="row" className={`grid gap-x-3 gap-y-1.5 px-3 py-2.5 text-sm ${cot}`}>
              <span role="cell" className="min-w-0 truncate font-semibold text-slate-100 sm:font-normal" title={e.ten}>{e.ten}
                {e.lopDich && <span className="block text-xs font-normal text-slate-500">→ {e.lopDich.code} · {tuanLich(e.tuan, homNay)}</span>}</span>
              <span role="cell" className="min-w-0 text-xs text-slate-400">{e.tuDien?.ketQua ? dich(e.tuDien.ketQua) : '—'}</span>
              {mons.map((m, i) => {
                const om = oMon(e, m);
                const cu = om?.noiDung ?? '';
                const s0 = tt[k(e, m)];
                return (
                  <span key={m} role="cell" className="min-w-0">
                    {hai && <span className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-slate-400 sm:hidden"><span className="rounded bg-[color:var(--accent-soft)] px-1.5 text-[12px] font-bold text-[color:var(--accent)]">{mDs[i].ngan}</span>{mDs[i].ten}</span>}
                    {!om ? oTrong(hai ? t('Không học {mon}', { mon: mDs[i].ngan }) : t('Không học {mon} · không cần bàn giao', { mon: mDs[i].ngan }))
                      : om.cungGv && !cu ? oTrong(t('Cùng GV · không cần bàn giao')) : <>
                      <input id={idO(e.lenhId, m)} className="field w-full" maxLength={300} readOnly={khoa} autoComplete="off"
                        aria-label={hai ? `${mDs[i].ngan} · ${e.ten}` : t('Bàn giao môn {mon} của {ten}', { mon: mDs[i].ngan, ten: e.ten })}
                        aria-invalid={s0?.tt === 'loi'} aria-describedby={s0?.tt === 'loi' ? `${idO(e.lenhId, m)}-loi` : undefined}
                        placeholder={t('Viết một câu…')} value={chu[k(e, m)] ?? cu}
                        onChange={(ev) => {
                          setChu((x) => ({ ...x, [k(e, m)]: ev.target.value }));
                          oCua(e, m).go(ev.target.value);
                          setTt((x) => ({ ...x, [k(e, m)]: { tt: x[k(e, m)]?.tt === 'dang' ? 'dang' : 'go' } }));
                        }}
                        onBlur={() => void ghi(e, m)} />
                      {e.writingCu && !cu && (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          <b className="font-semibold text-slate-400">{t('Writing · cũ')}:</b> {e.writingCu.noiDung}{e.writingCu.nguoiGhi ? ` — ${e.writingCu.nguoiGhi}, ${ngay(e.writingCu.ghiLuc, homNay)}` : ''}
                        </span>
                      )}
                      {s0?.tt === 'loi' ? <span id={`${idO(e.lenhId, m)}-loi`} role="alert" className="mt-0.5 block text-xs text-late">{s0.loi}</span>
                        : s0 && nhanTt[s0.tt] && <span aria-live="polite" className={`mt-0.5 block text-xs ${s0.tt === 'xong' ? 'text-done' : s0.tt === 'go' ? 'text-soon' : 'text-slate-400'}`}>{nhanTt[s0.tt]}</span>}
                      {!khoa && om.lamLai && s0?.tt !== 'xong' && (
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <Nhan tone="soon">{t('Cần làm lại')}</Nhan><span className="text-slate-400">{t('Lộ trình đã đổi — sửa hoặc giữ câu cũ')}</span>
                          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => void ghi(e, m, true)}>{t('Giữ và lưu')}</button>
                        </span>
                      )}
                    </>}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </KhungPanel>
  );
}
