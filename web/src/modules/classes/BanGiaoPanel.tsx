import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { CHU_CHUYEN_LOP, NHAN_XET_TOI_THIEU, ngay, tuanLich, type PhieuBanGiaoDto, type PhieuEm } from '@shared/domain/index.ts';

/**
 * BÀN GIAO (PR-CT, §3.1f Q30-2, mockup 20 màn F · G · đọc bàn giao) — MỘT panel, ba dạng theo người mở:
 *   F  GVCN lớp cũ (hoặc Quản lý xác nhận thay): trái danh sách em + trạng thái phiếu, phải phiếu của em đang chọn — Hệ thống tự điền (chỉ đọc), mỗi môn một câu của
 *      GVBM (Nhắc · Điền thay), Nhận xét chung (bắt buộc ≥ 15 ký tự) → Xác nhận bàn giao. ↑/↓ đi từng em. Dưới 820 px: danh sách trên, phiếu dưới.
 *   G  GVBM của môn: bảng mỗi em một câu, lưu khi rời ô.
 *   Đọc: GV / Quản lý lớp mới, hoặc bất kỳ ai không ghi được — cùng bố cục F, chỉ đọc, hiện "Xác nhận bởi …".
 * Lối vào: Công việc › việc Bàn giao · hồ sơ lớp › dải Bàn giao / Sắp nhận · hồ sơ học viên › dải Sắp chuyển (mở thẳng em đó — `lenhId`).
 */
export function BanGiaoPanel({ classId, mon, lenhId, onClose, onDone }: {
  classId: number; mon?: string | null; lenhId?: number | null; onClose: () => void; onDone: () => void;
}) {
  const { data, loading, error, reload } = useApi<PhieuBanGiaoDto>(`/lenh-chuyen/ban-giao?lop=${classId}${mon ? `&mon=${mon}` : ''}`, [classId, mon]);
  if (error) {
    return (
      <KhungPanel tieuDe="Bàn giao" onDong={onClose} chan={{ huy: { nhan: 'Đóng', onClick: onClose } }}>
        <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
      </KhungPanel>
    );
  }
  if (loading || !data) {
    return <KhungPanel tieuDe="Bàn giao" onDong={onClose}><Skeleton rows={6} /></KhungPanel>;
  }
  const monToi = data.nguoiXem.monGhi;
  /* G: chỉ GVBM (không GVCN, không Quản lý thay) mở kèm môn của mình. */
  const cheDoG = !data.nguoiXem.gvcn && !data.nguoiXem.xacNhan && data.nguoiXem.xemTuNguon && monToi.length > 0;
  return cheDoG
    ? <BangGvbm dto={data} mon={mon && monToi.includes(mon) ? mon : monToi[0]} lenhId={lenhId ?? null} onClose={onClose} onDone={onDone} reload={reload} />
    : <MasterDetail dto={data} lenhId={lenhId ?? null} onClose={onClose} onDone={onDone} reload={reload} />;
}

type Chung = { dto: PhieuBanGiaoDto; lenhId: number | null; onClose: () => void; onDone: () => void; reload: () => void };

// ==================================================================== F · GVCN

function MasterDetail({ dto, lenhId, onClose, onDone, reload }: Chung) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [chon, setChon] = useState<number | null>(lenhId ?? dto.ds.find((e) => !e.xacNhan)?.lenhId ?? dto.ds[0]?.lenhId ?? null);
  const em = dto.ds.find((e) => e.lenhId === chon) ?? dto.ds[0] ?? null;
  const [nhanXet, setNhanXet] = useState<Record<number, string>>({});
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dienThay, setDienThay] = useState<{ lenhId: number; mon: string; chu: string } | null>(null);
  const dsRef = useRef<HTMLUListElement>(null);
  const ghi = dto.nguoiXem.xemTuNguon && dto.nguoiXem.xacNhan;   // được viết nhận xét + xác nhận (GVCN, hoặc Quản lý thay)
  const docThoi = !ghi;

  useEffect(() => { setDaBam(false); setDienThay(null); }, [chon]);
  const nhap = em ? nhanXet[em.lenhId] ?? em.nhanXetChung ?? '' : '';
  const thieu = nhap.trim().length < NHAN_XET_TOI_THIEU;
  const dsXn = dto.ds.filter((e) => !e.xacNhan).length;

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
      toast.push('ok', `Đã xác nhận bàn giao ${em.ten}`);
      const con = dto.ds.filter((e) => !e.xacNhan && e.lenhId !== em.lenhId);
      onDone(); reload();
      if (con.length) setChon(con[0].lenhId);
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const nhac = async (e: PhieuEm, mon: string) => {
    try { await api.post(`/lenh-chuyen/${e.lenhId}/nhac`, { mon }); toast.push('ok', 'Đã nhắc GVBM'); } catch (er: any) { toast.push('error', er.message); }
  };
  const luuDienThay = async () => {
    if (!dienThay || !dienThay.chu.trim()) return;
    try {
      await api.put(`/lenh-chuyen/${dienThay.lenhId}/ban-giao-mon`, { mon: dienThay.mon, noiDung: dienThay.chu.trim() });
      invalidate('/lenh-chuyen'); invalidate('/my-work');
      setDienThay(null); reload();
    } catch (er: any) { toast.push('error', er.message); }
  };

  const chuaMon = em ? em.mon.filter((m) => !m.noiDung) : [];
  const dong = 'grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm';

  return (
    <KhungPanel rong="toan" tieuDe={`Bàn giao · ${dto.lop.code}`} onDong={onClose}
      ngCanh={<span className="tabular-nums">{dto.tong} em · {dto.daXacNhan}/{dto.tong} đã xác nhận{dto.hanGvcn && <> · <Han loai="viec-van-hanh" han={dto.hanGvcn} /></>}</span>}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose },
        dongTren: ghi && em && !em.xacNhan ? (
          <p className="m-0 px-4 pt-2 text-right text-[11px] text-slate-400">Xác nhận được khi đủ nhận xét chung. Môn chưa có thông tin sẽ ghi “GVBM chưa bàn giao”.</p>
        ) : undefined,
        chinh: ghi && em && !em.xacNhan ? (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={xacNhan} disabled={busy || !nhap.trim()} title={!nhap.trim() ? 'Viết nhận xét chung trước khi xác nhận' : undefined}>{CHU_CHUYEN_LOP.banGiao}</button>
        ) : undefined,
        conThieu: daBam && thieu && em && ghi ? [{ nhan: 'Nhận xét chung', oId: 'o-nhan-xet' }] : undefined,
      }}>
      {dto.ds.length === 0 && <p className="mt-3 text-sm text-slate-400">Chưa có quyết định chuyển lớp nào cần bàn giao.</p>}
      {em && (
        <div className="grid gap-4 pt-3 md:grid-cols-[280px_minmax(0,1fr)]">
          <ul ref={dsRef} role="listbox" aria-label="Học viên cần bàn giao" onKeyDown={phim}
            className="m-0 list-none divide-y rounded-lg p-0 surface-2" style={{ borderColor: 'var(--line)' }}>
            {dto.ds.map((e) => (
              <li key={e.lenhId} role="option" aria-selected={e.lenhId === em.lenhId} tabIndex={e.lenhId === em.lenhId ? 0 : -1}
                onClick={() => setChon(e.lenhId)} onFocus={() => setChon(e.lenhId)}
                className={`cursor-pointer px-3 py-2 outline-none ${e.lenhId === em.lenhId ? 'bg-ink-800 shadow-[inset_0_0_0_1px_theme(colors.teal.600)]' : 'hover:bg-white/[.04]'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm text-slate-100">{e.ten}</span>
                  <Nhan tone={e.phieu.khoa === 'da-xac-nhan' ? 'ok' : e.phieu.khoa === 'mon' ? 'soon' : 'muted'}>{e.phieu.nhan}</Nhan>
                </div>
                <div className="truncate text-[11px] text-slate-500">
                  {e.lopDich ? `→ ${e.lopDich.code} · ${tuanLich(e.tuan, homNay)}` : e.huong === 'bao_luu' ? `Tạm dừng học (bảo lưu)${e.ngayXemLai ? ` · xem lại ${tuanLich(e.ngayXemLai, homNay)}` : ''}` : tuanLich(e.tuan, homNay)}
                </div>
              </li>
            ))}
          </ul>

          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="m-0 text-base font-semibold text-slate-100">
                {em.ten}{em.lopDich ? ` → ${em.lopDich.code}` : ''} <span className="font-normal text-slate-400">từ {tuanLich(em.tuan, homNay)}</span>
              </h3>
              {!em.xacNhan && chuaMon.length > 0 && <Nhan tone="soon">Chờ môn {chuaMon.map((m) => m.ngan).join(', ')}</Nhan>}
              {em.xacNhan && <Nhan tone="ok">Đã xác nhận</Nhan>}
            </div>

            <section aria-label="Hệ thống tự điền" className="surface-2 rounded-lg p-3">
              <h4 className="mb-2 mt-0 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-500">Hệ thống tự điền · chỉ đọc{em.tuDienDaChup && ' · chụp lúc xác nhận'}</h4>
              {em.tuDien ? (
                <div className={dong}>
                  <span className="text-slate-500">Kết quả</span><span className="text-slate-200">{em.tuDien.ketQua}</span>
                  <span className="text-slate-500">Case đang mở</span>
                  <span className="text-slate-200">
                    {em.tuDien.caseMo.length ? em.tuDien.caseMo.map((c) => `${c.ten}${c.nguoiNhan ? ` · người nhận gợi ý: ${c.nguoiNhan}` : ''}`).join(' · ') : 'Không có'}
                  </span>
                  <span className="text-slate-500">Ý thức</span><span className="text-slate-200">{em.tuDien.yThuc}</span>
                  <span className="text-slate-500">Việc còn dở</span><span className="text-slate-200">{em.tuDien.viecConDo}</span>
                </div>
              ) : <p className="m-0 text-sm text-slate-400">Chưa có dữ liệu tự điền.</p>}
            </section>

            <section aria-label="Thông tin bàn giao của GVBM">
              <h4 className="mb-2 mt-0 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-500">
                Thông tin bàn giao của GVBM · mỗi môn một câu{ghi && !em.xacNhan && <span className="ml-2 font-normal normal-case tracking-normal text-slate-500">GVCN điền thay được</span>}
              </h4>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {em.mon.map((m) => (
                  <li key={m.ma} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 text-sm">
                    <abbr title={m.ten} className="font-bold text-slate-300 no-underline">{m.ngan}</abbr>
                    <div className="min-w-0">
                      {m.noiDung ? (
                        <span className="text-slate-200">{m.noiDung} <span className="text-slate-500">— {m.nguoiGhi}, {ngay(m.ghiLuc, homNay)}{m.dienThay ? ' (điền thay)' : ''} ✓</span></span>
                      ) : em.xacNhan ? (
                        <span className="text-slate-500">GVBM chưa bàn giao</span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-slate-400">Chưa có{m.gvbm.length ? ` · ${m.gvbm.join(', ')}` : ''}, <Han loai="viec-van-hanh" han={em.hanGvbm} /></span>
                          {ghi && <button type="button" className="link border-0 bg-transparent p-0 text-xs" onClick={() => nhac(em, m.ma)}>Nhắc</button>}
                          {ghi && <button type="button" className="link border-0 bg-transparent p-0 text-xs" onClick={() => setDienThay({ lenhId: em.lenhId, mon: m.ma, chu: '' })}>Điền thay</button>}
                        </span>
                      )}
                      {dienThay && dienThay.lenhId === em.lenhId && dienThay.mon === m.ma && (
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <input className="field min-w-[14rem] flex-1" autoFocus maxLength={300} aria-label={`Điền thay môn ${m.ngan}`} value={dienThay.chu}
                            placeholder="Viết một câu…" onChange={(e) => setDienThay({ ...dienThay, chu: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') void luuDienThay(); if (e.key === 'Escape') { e.stopPropagation(); setDienThay(null); } }} />
                          <button type="button" className="btn btn-sm btn-primary" disabled={!dienThay.chu.trim()} onClick={luuDienThay}>Lưu</button>
                          <button type="button" className="btn btn-sm" onClick={() => setDienThay(null)}>Đóng</button>
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <Truong nhan="Nhận xét chung của GVCN" batBuoc={ghi && !em.xacNhan} dem={ghi && !em.xacNhan ? { co: nhap.trim().length, can: NHAN_XET_TOI_THIEU } : undefined}
              loi={daBam && thieu && ghi ? `Cần ít nhất ${NHAN_XET_TOI_THIEU} ký tự` : null}>
              <textarea id="o-nhan-xet" className="field w-full" rows={3} readOnly={docThoi || !!em.xacNhan} aria-invalid={daBam && thieu && ghi}
                value={nhap} placeholder={docThoi ? undefined : 'Ví dụ: Em chăm, ngại nói trước lớp. Mẹ theo sát, liên hệ qua Zalo.'}
                onChange={(e) => setNhanXet((m) => ({ ...m, [em.lenhId]: e.target.value }))} />
            </Truong>
            {em.xacNhan && (
              <p className="m-0 text-xs text-slate-400">
                Xác nhận bởi {em.xacNhan.boi ?? 'GVCN'}{em.xacNhan.thay ? ' (Quản lý xác nhận thay)' : ''} · {ngay(em.xacNhan.luc, homNay)}
              </p>
            )}
            {!ghi && !em.xacNhan && dto.nguoiXem.xemTuNguon && <p className="m-0 text-xs text-slate-400">Chỉ GVCN lớp cũ xác nhận. Quản lý xác nhận thay khi lớp chưa có GVCN hoặc quá hạn 3 ngày.</p>}
          </div>
        </div>
      )}
      {dsXn === 0 && dto.ds.length > 0 && <p className="mt-4 text-xs text-slate-400">Đã xác nhận bàn giao đủ {dto.tong} em.</p>}
    </KhungPanel>
  );
}

// ==================================================================== G · GVBM

function BangGvbm({ dto, mon, lenhId, onClose, onDone, reload }: Chung & { mon: string }) {
  const { homNay } = useNgayNghiepVu();
  const m0 = dto.lop.mon.find((x) => x.ma === mon)!;
  const [chu, setChu] = useState<Record<number, string>>({});
  const [loi, setLoi] = useState<Record<number, string>>({});
  const [luu, setLuu] = useState<Record<number, boolean>>({});
  const daCo = (e: PhieuEm) => !!e.mon.find((x) => x.ma === mon)?.noiDung;
  const soDaCo = dto.ds.filter(daCo).length;
  const han = useMemo(() => dto.theoMon.find((t) => t.ma === mon)?.han ?? null, [dto, mon]);

  useEffect(() => {
    if (lenhId == null) return;
    const el = document.getElementById(`o-bg-${lenhId}`);
    el?.scrollIntoView({ block: 'center' });
    el?.focus();
  }, [lenhId]);

  const ghi = async (e: PhieuEm) => {
    const v = (chu[e.lenhId] ?? e.mon.find((x) => x.ma === mon)?.noiDung ?? '').trim();
    if (!v || v === (e.mon.find((x) => x.ma === mon)?.noiDung ?? '')) return;
    try {
      await api.put(`/lenh-chuyen/${e.lenhId}/ban-giao-mon`, { mon, noiDung: v });
      setLoi((x) => { const { [e.lenhId]: _, ...con } = x; return con; });
      setLuu((x) => ({ ...x, [e.lenhId]: true }));
      invalidate('/lenh-chuyen'); invalidate('/my-work'); invalidate('/classes');
      reload();
    } catch (er: any) { setLoi((x) => ({ ...x, [e.lenhId]: er.message })); }
  };

  return (
    <KhungPanel rong="rong" tieuDe={`Bàn giao môn ${m0.ngan} (${m0.ten})`} onDong={() => { onDone(); onClose(); }}
      ngCanh={<span className="tabular-nums">{dto.lop.code} · {dto.tong} em{han && <> · <Han loai="viec-van-hanh" han={han} /></>} · mỗi em một câu</span>}
      chan={{
        huy: { nhan: 'Xong', onClick: () => { onDone(); onClose(); } },
        dongTren: <p className="m-0 px-4 pt-2 text-right text-[11px] tabular-nums text-slate-400">Lưu từng dòng khi rời ô · {soDaCo}/{dto.tong} đã có</p>,
      }}>
      <div className="surface-2 mt-3 divide-y rounded-lg" style={{ borderColor: 'var(--line)' }} role="table" aria-label={`Bàn giao môn ${m0.ngan}`}>
        <div role="row" className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,2fr)] gap-3 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-500 sm:grid">
          <span role="columnheader">Học viên</span><span role="columnheader">Kết quả</span><span role="columnheader">Thông tin bàn giao</span>
        </div>
        {dto.ds.map((e) => {
          const cu = e.mon.find((x) => x.ma === mon)?.noiDung ?? '';
          const khoa = !!e.xacNhan;
          return (
            <div key={e.lenhId} role="row" className="grid gap-x-3 gap-y-1 px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,2fr)]">
              <span role="cell" className="min-w-0 truncate text-slate-100" title={e.ten}>{e.ten}
                {e.lopDich && <span className="block text-[11px] text-slate-500">→ {e.lopDich.code} · {tuanLich(e.tuan, homNay)}</span>}</span>
              <span role="cell" className="min-w-0 text-xs text-slate-400">{e.tuDien?.ketQua ?? '—'}</span>
              <span role="cell" className="min-w-0">
                <input id={`o-bg-${e.lenhId}`} className="field w-full" maxLength={300} readOnly={khoa} aria-label={`Bàn giao môn ${m0.ngan} của ${e.ten}`}
                  aria-invalid={!!loi[e.lenhId]} placeholder="Viết một câu…" value={chu[e.lenhId] ?? cu}
                  onChange={(ev) => { setChu((x) => ({ ...x, [e.lenhId]: ev.target.value })); setLuu((x) => ({ ...x, [e.lenhId]: false })); }}
                  onBlur={() => void ghi(e)} />
                {loi[e.lenhId] && <span role="alert" className="mt-0.5 block text-[11px] text-late">{loi[e.lenhId]}</span>}
                {!loi[e.lenhId] && luu[e.lenhId] && <span className="mt-0.5 block text-[11px] text-ok">Đã lưu</span>}
                {khoa && <span className="mt-0.5 block text-[11px] text-slate-500">GVCN đã xác nhận phiếu — không sửa thêm</span>}
              </span>
            </div>
          );
        })}
      </div>
    </KhungPanel>
  );
}
