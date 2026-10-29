import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { Nhan, QuaHan } from '../../ui/Nhan.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ChuDich } from '../../ui/ChuDich.tsx';
import { CHU_CHUYEN_LOP, NHAN_XET_TOI_THIEU, deadlineView, ngay, shortDate, tuanLich, type PhieuBanGiaoDto, type PhieuEm } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * BÀN GIAO (PR-CT, §3.1f Q30-2, mockup 20 màn F · G · đọc bàn giao) — MỘT panel, ba dạng theo người mở:
 *   F  GVCN lớp cũ (hoặc Quản lý xác nhận thay): trái danh sách em + trạng thái phiếu, phải phiếu của em đang chọn — Hệ thống tự điền (chỉ đọc), mỗi môn một câu của
 *      GVBM (Điền thay; OV-12h bỏ Nhắc), Nhận xét chung (bắt buộc ≥ 15 ký tự) → Xác nhận bàn giao. ↑/↓ đi từng em. Dưới 820 px: danh sách trên, phiếu dưới.
 *   G  GVBM của môn: bảng mỗi em một câu, lưu khi rời ô.
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
        <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
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
    ? <BangGvbm dto={data} mon={mon && monToi.includes(mon) ? mon : monToi[0]} lenhId={lenhId ?? null} onClose={onClose} onDone={onDone} reload={reload} quayLai={quayLai} />
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
  const dsRef = useRef<HTMLUListElement>(null);
  const ghi = dto.nguoiXem.xemTuNguon && dto.nguoiXem.xacNhan;   // được viết nhận xét + xác nhận (GVCN, hoặc Quản lý thay)
  const suaPhieu = !!em?.xacNhan && dangSua;
  const docThoi = !ghi && !suaPhieu;

  useEffect(() => { setDaBam(false); setDienThay(null); setDangSua(false); }, [chon]);
  const nhap = em ? nhanXet[em.lenhId] ?? em.nhanXetChung ?? '' : '';
  const thieu = nhap.trim().length < NHAN_XET_TOI_THIEU;
  const dsXn = dto.ds.filter((e) => !e.xacNhan).length;
  /* 6c (lỗi 5): nhận xét đã gõ khác bản đã lưu, hoặc ô điền thay đang mở. */
  const daSuaNx = !!dienThay || dto.ds.some((e) => nhanXet[e.lenhId] !== undefined && nhanXet[e.lenhId] !== (e.nhanXetChung ?? ''));

  const phim = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = dto.ds.findIndex((x) => x.lenhId === em?.lenhId);
    const j = Math.max(0, Math.min(dto.ds.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
    setChon(dto.ds[j].lenhId);
    dsRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[j]?.focus();
  };

  const xacNhan = async () => {
    if (!em) return;
    setDaBam(true);
    if (thieu) return;
    setBusy(true);
    try {
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

  const chuaMon = em ? em.mon.filter((m) => !m.noiDung || m.lamLai) : [];
  /* Lỗi chủ SP 30/10: số ngày quá hạn bàn giao của từng em (null = chưa quá / đã xác nhận). */
  const quaHan = (e: { hanGvcn: string | null; xacNhan: unknown }) => {
    const v = !e.xacNhan && e.hanGvcn ? deadlineView({ kind: 'viec-van-hanh', due: e.hanGvcn, today: homNay }) : null;
    return v?.tone === 'overdue' ? v.daysOverdue : null;
  };
  const quaHanSom = quaHan({ hanGvcn: dto.hanGvcn, xacNhan: null });
  const dong = 'grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm';

  return (
    <KhungPanel quayLai={quayLai} rong="toan" tieuDe={`${t('Bàn giao')} · ${dto.lop.code}`} onDong={onClose}
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
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={xacNhan} disabled={busy || !nhap.trim()} title={!nhap.trim() ? t('Viết nhận xét chung trước khi xác nhận') : undefined}>{dich(CHU_CHUYEN_LOP.banGiao)}</button>
        ) : suaPhieu ? (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luuSua} disabled={busy}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
        ) : em?.xacNhan && em.suaDuoc && (ghi || dto.nguoiXem.ql) ? (
          <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setDangSua(true)}>{t('Sửa')}</button>
        ) : undefined,
        conThieu: daBam && thieu && em && (ghi || suaPhieu) ? [{ nhan: t('Nhận xét chung'), oId: 'o-nhan-xet' }] : undefined,
      }}>
      {dto.ds.length === 0 && <p className="mt-3 text-sm text-slate-400">{t('Không có em nào cần bàn giao.')}</p>}
      {em && (
        <div className="grid gap-4 pt-3 md:grid-cols-[280px_minmax(0,1fr)]">
          <ul ref={dsRef} role="listbox" aria-label={t('Học viên cần bàn giao')} onKeyDown={phim}
            className="m-0 list-none divide-y rounded-lg p-0 surface-2" style={{ borderColor: 'var(--line)' }}>
            {dto.ds.map((e) => (
              <li key={e.lenhId} role="option" aria-selected={e.lenhId === em.lenhId} tabIndex={e.lenhId === em.lenhId ? 0 : -1}
                onClick={() => setChon(e.lenhId)} onFocus={() => setChon(e.lenhId)}
                className={`cursor-pointer px-3 py-2 outline-none ${e.lenhId === em.lenhId ? 'bg-[color:var(--accent-soft)] shadow-[inset_0_0_0_1px_var(--accent)]' : 'bam'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm text-slate-100">{e.ten}</span>
                  <Nhan tone={e.phieu.khoa === 'da-xac-nhan' ? 'ok' : e.phieu.khoa === 'mon' ? 'soon' : 'muted'}>{dich(e.phieu.nhan)}</Nhan>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="min-w-0 truncate">{e.lopDich ? `→ ${e.lopDich.code} · ${tuanLich(e.tuan, homNay)}` : e.huong === 'bao_luu' ? `${t('Tạm dừng học (bảo lưu)')}${e.ngayXemLai ? ` · ${t('xem lại {tuan}', { tuan: tuanLich(e.ngayXemLai, homNay) })}` : ''}` : tuanLich(e.tuan, homNay)}</span>
                  {quaHan(e) != null && <QuaHan ngay={quaHan(e)} />}
                </div>
              </li>
            ))}
          </ul>

          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="m-0 text-base font-semibold text-slate-100">
                {em.ten}{em.lopDich ? ` → ${em.lopDich.code}` : ''} <span className="font-normal text-slate-400">{t('từ {tuan}', { tuan: tuanLich(em.tuan, homNay) })}</span>
              </h3>
              {!em.xacNhan && chuaMon.length > 0 && <Nhan tone="soon">{t('Chờ môn {ds}', { ds: chuaMon.map((m) => m.ngan).join(', ') })}</Nhan>}
              {em.xacNhan && <Nhan tone="ok">{t('Đã xác nhận')}</Nhan>}
              {!em.xacNhan && em.hanGvcn && <Han loai="viec-van-hanh" han={em.hanGvcn} />}
            </div>

            <section aria-label={t('Hệ thống tự điền')} className="surface-2 rounded-lg p-3">
              <h4 className="mb-2 mt-0 text-[12px] font-semibold text-slate-500">{t('Tự điền · chỉ đọc')}{em.tuDienDaChup && ` · ${t('chụp lúc xác nhận')}`}</h4>
              {em.tuDien ? (
                <div className={dong}>
                  <span className="text-slate-500">{t('Kết quả')}</span><span className="text-slate-200">{dich(em.tuDien.ketQua)}</span>
                  <span className="text-slate-500">{t('Case đang mở')}</span>
                  <span className="text-slate-200">
                    {em.tuDien.caseMo.length ? em.tuDien.caseMo.map((c) => `${dich(c.ten)}${c.nguoiNhan ? ` · ${t('người nhận gợi ý: {ten}', { ten: c.nguoiNhan })}` : ''}`).join(' · ') : t('Không có')}
                  </span>
                  <span className="text-slate-500">{t('Ý thức')}</span><span className="text-slate-200">{dich(em.tuDien.yThuc)}</span>
                  <span className="text-slate-500">{t('Việc còn dở')}</span><span className="text-slate-200">{dich(em.tuDien.viecConDo)}</span>
                </div>
              ) : <p className="m-0 text-sm text-slate-400">{t('Chưa có dữ liệu tự điền.')}</p>}
            </section>

            <section aria-label={t('Thông tin bàn giao của GVBM')}>
              <h4 className="mb-2 mt-0 text-[12px] font-semibold text-slate-500">
                {t('Bàn giao của GVBM · mỗi môn một câu')}{ghi && !em.xacNhan && <span className="ml-2 font-normal normal-case tracking-normal text-slate-500">{t('GVCN điền thay được')}</span>}
              </h4>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {em.mon.map((m) => (
                  <li key={m.ma} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 text-sm">
                    <abbr title={m.ten} className="font-bold text-slate-300 no-underline">{m.ngan}</abbr>
                    <div className="min-w-0">
                      {m.noiDung ? (
                        <span className="text-slate-200"><ChuDich chu={m.noiDung} nguon={m.id ? { bang: 'ban_giao_mon', id: m.id, cot: 'noi_dung' } : null} /> <span className="text-slate-500">— {m.nguoiGhi}, {ngay(m.ghiLuc, homNay)}{m.dienThay ? ` ${t('(điền thay)')}` : ''}{m.lamLai ? '' : ' ✓'}</span>
                          {m.lamLai && <> <Nhan tone="soon">{t('Cần làm lại')}</Nhan></>}</span>
                      ) : em.xacNhan ? (
                        <span className="text-slate-500">{t('GVBM chưa bàn giao')}</span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-slate-400">{t('Chưa có')}{m.gvbm.length ? ` · ${m.gvbm.join(', ')}` : ''}, <Han loai="viec-van-hanh" han={em.hanGvbm} /></span>
                          {ghi && <button type="button" className="link border-0 bg-transparent p-0 text-xs" onClick={() => setDienThay({ lenhId: em.lenhId, mon: m.ma, chu: '' })}>{t('Điền thay')}</button>}
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
              </ul>
            </section>

            <Truong nhan={t('Nhận xét chung của GVCN')} batBuoc={(ghi && !em.xacNhan) || suaPhieu} dem={(ghi && !em.xacNhan) || suaPhieu ? { co: nhap.trim().length, can: NHAN_XET_TOI_THIEU } : undefined}
              loi={daBam && thieu && (ghi || suaPhieu) ? t('Cần ít nhất {n} ký tự', { n: NHAN_XET_TOI_THIEU }) : null}>
              <textarea id="o-nhan-xet" className="field w-full" rows={3} readOnly={docThoi || (!!em.xacNhan && !suaPhieu)} aria-invalid={daBam && thieu && (ghi || suaPhieu)}
                value={nhap} placeholder={docThoi ? undefined : t('Ví dụ: Em chăm, ngại nói trước lớp. Mẹ theo sát, liên hệ qua Zalo.')}
                onChange={(e) => setNhanXet((m) => ({ ...m, [em.lenhId]: e.target.value }))} />
            </Truong>
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

function BangGvbm({ dto, mon, lenhId, onClose, onDone, reload, quayLai }: Chung & { mon: string }) {
  const { homNay } = useNgayNghiepVu();
  const m0 = dto.lop.mon.find((x) => x.ma === mon)!;
  const [chu, setChu] = useState<Record<number, string>>({});
  const [loi, setLoi] = useState<Record<number, string>>({});
  const [luu, setLuu] = useState<Record<number, boolean>>({});
  const oMon = (e: PhieuEm) => e.mon.find((x) => x.ma === mon);
  const daCo = (e: PhieuEm) => !!oMon(e)?.noiDung && !oMon(e)?.lamLai;
  const soDaCo = dto.ds.filter(daCo).length;
  const han = useMemo(() => dto.theoMon.find((x) => x.ma === mon)?.han ?? null, [dto, mon]);

  useEffect(() => {
    if (lenhId == null) return;
    const el = document.getElementById(`o-bg-${lenhId}`);
    el?.scrollIntoView({ block: 'center' });
    el?.focus();
  }, [lenhId]);

  /** `giu`: phiếu cần làm lại (OV-3b) — lưu lại đúng chữ cũ cũng là xác nhận lại. */
  const ghi = async (e: PhieuEm, giu = false) => {
    const v = (chu[e.lenhId] ?? oMon(e)?.noiDung ?? '').trim();
    if (!v || (v === (oMon(e)?.noiDung ?? '') && !giu)) return;
    try {
      await api.put(`/lenh-chuyen/${e.lenhId}/ban-giao-mon`, { mon, noiDung: v });
      setLoi((x) => { const { [e.lenhId]: _, ...con } = x; return con; });
      setLuu((x) => ({ ...x, [e.lenhId]: true }));
      invalidate('/lenh-chuyen'); invalidate('/my-work'); invalidate('/classes');
      reload();
    } catch (er: any) { setLoi((x) => ({ ...x, [e.lenhId]: er.message })); }
  };

  return (
    <KhungPanel quayLai={quayLai} rong="rong" tieuDe={t('Bàn giao môn {mon} ({ten})', { mon: m0.ngan, ten: m0.ten })} onDong={() => { onDone(); onClose(); }}
      ngCanh={<span className="tabular-nums">{dto.lop.code} · {t('{n} em', { n: dto.tong })}{han && <> · <Han loai="viec-van-hanh" han={han} /></>} · {t('mỗi em một câu')}</span>}
      chan={{
        huy: { nhan: t('Đóng'), onClick: () => { onDone(); onClose(); } },
        dongTren: <p className="m-0 px-4 pt-2 text-right text-xs tabular-nums text-slate-400">{t('Tự lưu khi rời ô · {a}/{b} em đã có', { a: soDaCo, b: dto.tong })}</p>,
      }}>
      <div className="surface-2 mt-3 divide-y rounded-lg" style={{ borderColor: 'var(--line)' }} role="table" aria-label={t('Bàn giao môn {mon}', { mon: m0.ngan })}>
        <div role="row" className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,2fr)] gap-3 px-3 py-2 text-[12px] font-semibold text-slate-500 sm:grid">
          <span role="columnheader">{t('Học viên')}</span><span role="columnheader">{t('Kết quả')}</span><span role="columnheader">{t('Thông tin bàn giao')}</span>
        </div>
        {dto.ds.map((e) => {
          const cu = e.mon.find((x) => x.ma === mon)?.noiDung ?? '';
          const khoa = !!e.xacNhan && !e.suaDuoc;   // OV-13h: đã xác nhận vẫn sửa được, cả sau ngày chuyển lớp (khoá chỉ khi lệnh huỷ / không quyền)
          return (
            <div key={e.lenhId} role="row" className="grid gap-x-3 gap-y-1 px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,2fr)]">
              <span role="cell" className="min-w-0 truncate text-slate-100" title={e.ten}>{e.ten}
                {e.lopDich && <span className="block text-xs text-slate-500">→ {e.lopDich.code} · {tuanLich(e.tuan, homNay)}</span>}</span>
              <span role="cell" className="min-w-0 text-xs text-slate-400">{e.tuDien?.ketQua ? dich(e.tuDien.ketQua) : '—'}</span>
              <span role="cell" className="min-w-0">
                <input id={`o-bg-${e.lenhId}`} className="field w-full" maxLength={300} readOnly={khoa} aria-label={t('Bàn giao môn {mon} của {ten}', { mon: m0.ngan, ten: e.ten })}
                  aria-invalid={!!loi[e.lenhId]} placeholder={t('Viết một câu…')} value={chu[e.lenhId] ?? cu}
                  onChange={(ev) => { setChu((x) => ({ ...x, [e.lenhId]: ev.target.value })); setLuu((x) => ({ ...x, [e.lenhId]: false })); }}
                  onBlur={() => void ghi(e)} />
                {loi[e.lenhId] && <span role="alert" className="mt-0.5 block text-xs text-late">{loi[e.lenhId]}</span>}
                {!loi[e.lenhId] && luu[e.lenhId] && <span className="mt-0.5 block text-xs text-done">{t('Đã lưu')}</span>}
                {!khoa && oMon(e)?.lamLai && !luu[e.lenhId] && (
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <Nhan tone="soon">{t('Cần làm lại')}</Nhan><span className="text-slate-400">{t('Lộ trình đã đổi — sửa hoặc giữ câu cũ')}</span>
                    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => void ghi(e, true)}>{t('Giữ và lưu')}</button>
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </KhungPanel>
  );
}
