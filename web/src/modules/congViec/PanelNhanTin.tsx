import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import { DsLichSu, LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { duongHoSoHocVien, tenMon, tuanLich } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { KhoiGiaoViec, dongLichSuGiao, duongGiaoViec, useHn, type KhoiGv } from './KhoiGiaoViec.tsx';
import { MucViecCon } from './MucViecCon.tsx';
import { lucVn } from './gioVn.ts';
import { ChuoiCham, KhoiTuyen } from '../yThuc/KhoiTuyen.tsx';
import { MuiChev } from '../../ui/HangNhom.tsx';
import type { TomTuyen, Tuyen } from '../yThuc/kieu.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';

/** `GET /giao-viec/nhan_tin/:id` — khối giao việc + bảng em / cặp GV (`xemNhanTin`, máy chủ LPB-0) + tuyến (Đổi GV: một tuyến · Chuyển lớp: chuỗi chấm từng em). */
type DongEm = { lenhId: number; studentId: number; ten: string; lopCu: { id: number; code: string }; lopMoi: { id: number; code: string } | null; tuan: string;
  trangThai: 'cho' | 'da_chuyen' | 'huy' | 'roi'; lichMock: { ten: string; kieu: 'di_theo' | 'o_lai' | 'huy' }[] };
type DongDoi = { doiId: number; khoa: string; gvCu: string | null; gvMoi: string | null; hieuLuc: string; trangThai: string };
type NhanTin = { id: number; loai: 'chuyen_lop' | 'doi_gv'; lop: { id: number; code: string }; trangThai: 'mo' | 'xong' | 'bo';
  xong: { nguoi: string | null; luc: string } | null; coTheXacNhan: boolean; coTheMoLai: boolean; em: DongEm[]; doi: DongDoi[] };
/* Loại khối `nhan_tin` chưa có trong `LoaiGiao` của web (TabTheoDoi — PR TUYEN-3 đang mở) — đường đi qua `DUONG`. */
const DUONG = (id: number) => duongGiaoViec('nhan_tin' as KhoiGv['loai'], id);
type KhoiNhanTin = KhoiGv & { nhanTin: NhanTin; tuyen?: Tuyen | null; chuoiTuyen?: TomTuyen[] };

const NHAN_LICH: Record<DongEm['lichMock'][number]['kieu'], () => string> = { di_theo: () => t('đi theo em'), o_lai: () => t('ở lại lớp cũ'), huy: () => t('huỷ') };
/** Lưới bảng em: 4 cột cân hết bề ngang, cột Tuyến căn phải (mockup v28 `.bnt`); không lịch Mock → 3 cột. ≤ 639: tên + chấm · lớp mới · lịch xếp dòng. */
const LUOI_4 = 'sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_max-content]';
const LUOI_3 = 'sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_max-content]';

/**
 * NHẬN THÔNG TIN (LPB-2a — N73 ① ②, N77; mockup v28 L3a–L3f · L4a–L4b): việc BPXL "Nhận thông tin · Chuyển lớp" (một việc mỗi LỚP ĐÍCH) / "· Đổi GV" (một lần lưu × lớp).
 * Khối Phụ trách · Hạn · Theo dõi (`KhoiGiaoViec`) → bảng em (Học viên · Lớp mới · Lịch Mock đã xếp · Tuyến — bấm tên mở Tuyến của em ngay dưới dòng) hoặc
 * Tuyến + bảng cặp GV (Đổi GV) → Việc con → Lịch sử. Chân: một nút "Xác nhận đã nhận" (không ô nhập); xong → "Đã xác nhận · ai · lúc" + Hoàn tác ở toast.
 * Máy chủ quyết mọi cờ (`coTheXacNhan`, `coTheMoLai`, quyền khối) — web không tự suy.
 */
export function PanelNhanTin({ it, onDong, onDaLam, onTiep }: { it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null }) {
  const hn = useHn();
  const toast = useToast();
  const id = Number(it.key.slice(it.key.lastIndexOf(':') + 1)) || null;
  const { data, error, reload } = useApi<KhoiNhanTin>(id ? DUONG(id) : null, [id]);
  const [ban, setBan] = useState<KhoiNhanTin | null>(null);
  useEffect(() => setBan(null), [data]);
  const g = ban ?? data ?? null;
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const nt = g?.nhanTin;
  const loaiChu = nt ? (nt.loai === 'doi_gv' ? t('Đổi GV') : t('Chuyển lớp')) : null;
  const tuanVao = nt?.loai === 'chuyen_lop' ? [...new Set(nt.em.filter((e) => e.trangThai !== 'huy').map((e) => e.tuan))] : [];
  const ngCanh = nt ? (nt.loai === 'doi_gv'
    ? [t('{n} môn', { n: nt.doi.length }), nt.doi[0] ? t('từ {tuan}', { tuan: tuanLich(nt.doi[0].hieuLuc, hn) }) : null].filter(Boolean).join(' · ')
    : [t('{n} em', { n: nt.em.length }), tuanVao.length === 1 ? t('vào {tuan}', { tuan: tuanLich(tuanVao[0], hn) }) : null].filter(Boolean).join(' · ')) : null;
  const dau = dauViec({ lop: nt?.lop.code ?? it.classCode, ngCanh: [loaiChu, ngCanh].filter(Boolean).join(' · ') || null });

  const datKhoi = (k: KhoiGv) => setBan((cu) => (cu ? { ...cu, ...k } : cu));
  const hoanTac = async () => {
    try { setBan(await api.post<KhoiNhanTin>(`${DUONG(id!)}/mo-lai`)); onDaLam(); toast.push('ok', t('Đã hoàn tác')); }
    catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); reload(); }
  };
  const xacNhan = async () => {
    setDang(true); setLoi(null);
    try {
      const moi = await api.post<KhoiNhanTin>(`${DUONG(id!)}/xac-nhan`);
      setBan({ ...moi, tuyen: g?.tuyen, chuoiTuyen: g?.chuoiTuyen });
      onDaLam();
      toast.push('ok', t('Đã xác nhận · {lop} · {ngCanh}', { lop: moi.nhanTin.lop.code, ngCanh: ngCanh ?? '' }), { hanhDong: { nhan: t('Hoàn tác'), onBam: () => void hoanTac() } });
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); if (e?.status === 409) reload(); } finally { setDang(false); }
  };

  const tieuDe = t('Nhận thông tin');
  if (error) return <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></KhungPanel>;
  if (!g || !nt) return <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong}><div className="pt-3"><Skeleton rows={6} /></div></KhungPanel>;

  const viecTiep = onTiep ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px]" onClick={onTiep}>{t('Việc tiếp ›')}</button> : undefined;
  const chan = nt.trangThai === 'mo' && nt.coTheXacNhan
    ? { huy: { nhan: t('Đóng'), onClick: onDong },
        trai: loi ? <span className="text-bad" role="alert">⚠ {loi} · {t('bấm lại')}</span> : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px]" disabled={dang} onClick={() => void xacNhan()}>{dang ? t('Đang lưu…') : t('Xác nhận đã nhận')}</button> }
    : nt.trangThai === 'xong'
      ? { huy: { nhan: t('Đóng'), onClick: onDong }, chinh: viecTiep,
          trai: <span className="text-ok">✓ {t('Đã xác nhận')}{nt.xong?.nguoi ? ` · ${nt.xong.nguoi}` : ''}{nt.xong?.luc ? ` · ${lucVn(nt.xong.luc)}` : ''}</span> }
      : { huy: { nhan: t('Đóng'), onClick: onDong }, chinh: viecTiep };
  const lichSu = dongLichSuGiao(g, hn).sort((a, b) => b.luc.localeCompare(a.luc));
  return (
    <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong} chan={chan}>
      <div className="flex flex-col gap-4 pt-4">
        {nt.trangThai === 'bo' && (
          <div role="status" className="flex min-h-[40px] items-center rounded-lg px-3 py-1.5 text-sm" style={{ background: 'var(--surface-2)' }}>
            <b className="font-semibold">{t('Việc đã đóng')}</b><span className="text-dim">&nbsp;· {nt.loai === 'doi_gv' ? t('lịch đổi GV đã huỷ') : t('không còn em chuyển vào lớp')}</span>
          </div>
        )}
        <KhoiGiaoViec g={g} mo={nt.trangThai === 'mo'} dat={datKhoi} reload={reload} onDaDoi={onDaLam} />
        {nt.loai === 'doi_gv'
          ? <><KhoiTuyen tuyen={g.tuyen} /><BangDoi doi={nt.doi} hn={hn} /></>
          : <BangEm em={nt.em} chuoi={g.chuoiTuyen ?? []} hn={hn} />}
        {nt.trangThai === 'mo' && <MucViecCon g={g} onDoi={reload} />}
        <LichSuGap so={lichSu.length}>
          <DsLichSu dong={lichSu.map((l, i) => ({ key: i, gio: lucVn(l.luc), ai: l.nguoi, viec: l.tieu, phu: l.phu }))} />
        </LichSuGap>
      </div>
    </KhungPanel>
  );
}

/** Bảng em chuyển vào lớp (mockup v28 `.bnt`, L3a / L3b / L3f): bấm tên mở Tuyến của em ngay dưới dòng (một em một lúc; máy tính mở em đầu). */
function BangEm({ em, chuoi, hn }: { em: DongEm[]; chuoi: TomTuyen[]; hn: string }) {
  const [mo, setMo] = useState<number | null>(() => (typeof window !== 'undefined' && window.matchMedia?.('(min-width: 640px)').matches ? em[0]?.lenhId ?? null : null));
  /* PTA rà #2292: cột lịch LUÔN có (thông tin BPXL cần để xếp lịch) — lớp FT "Lịch Mock đã xếp", lớp thường "Lịch đã xếp" (Progress / Final). */
  const moc = em.some((e) => e.lichMock.some((m) => m.ten.startsWith('MT')));
  const luoi = LUOI_4;
  const chuoiCua = new Map(chuoi.map((c) => [c.khoa, c.chuoi]));
  if (!em.length) return <p className="m-0 text-sm text-dim">{t('Không còn em nào trong việc này.')}</p>;
  return (
    <div role="table" aria-label={t('Học viên chuyển lớp')} className="overflow-hidden rounded-[10px] border text-sm" style={{ borderColor: 'var(--line)' }}>
      <div role="row" className={`grid h-9 items-center gap-x-4 px-3.5 text-xs font-semibold text-faint max-sm:hidden ${luoi}`}>
        <span role="columnheader">{t('Học viên')}</span><span role="columnheader">{t('Lớp mới')}</span>
        <span role="columnheader">{moc ? t('Lịch Mock đã xếp') : t('Lịch đã xếp')}</span><span role="columnheader" className="justify-self-end">{t('Tuyến')}</span>
      </div>
      {em.map((e) => {
        const dangMo = mo === e.lenhId;
        const c = chuoiCua.get(String(e.lenhId));
        return (
          <div key={e.lenhId} className="border-t" style={{ borderColor: 'var(--line)' }}>
            <div role="row" className={`grid min-h-[52px] grid-cols-[minmax(0,1fr)_max-content] items-center gap-x-4 gap-y-0.5 px-3.5 py-1.5 ${luoi} ${dangMo ? 'bg-[color:var(--accent-soft)] shadow-[inset_3px_0_0_var(--accent)]' : ''} ${e.trangThai === 'huy' || e.trangThai === 'roi' ? 'opacity-60' : ''}`}>
              <span role="cell" className="grid min-w-0 gap-0.5">
                <span className="flex min-w-0 items-center gap-1">
                  <Link to={duongHoSoHocVien(e.studentId)} className="ten-hv min-w-0 break-words font-semibold text-[color:var(--text)] no-underline hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">{e.ten}</Link>
                  <button type="button" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-dim hover:text-[color:var(--text)] max-sm:h-11 max-sm:w-11" aria-expanded={dangMo}
                    aria-label={dangMo ? t('Đóng tuyến của {ten}', { ten: e.ten }) : t('Mở tuyến của {ten}', { ten: e.ten })} onClick={() => setMo(dangMo ? null : e.lenhId)}>
                    <MuiChev mo={false} cl={dangMo ? '-rotate-90' : 'rotate-90'} />
                  </button>
                </span>
                <small className="text-xs text-dim max-sm:hidden">{e.lopCu.code}</small>
              </span>
              <span role="cell" className="grid min-w-0 gap-0.5 max-sm:col-start-1 max-sm:row-start-2 max-sm:flex max-sm:flex-wrap max-sm:gap-x-1.5 max-sm:text-[13px]">
                {e.lopMoi ? <Link to={`/hoc-vien/lop/${e.lopMoi.id}`} className="font-semibold text-[color:var(--text)] no-underline hover:underline"><span className="sm:hidden">→ </span>{e.lopMoi.code}</Link> : <span className="text-dim">—</span>}
                <small className="text-xs text-dim max-sm:text-[13px]"><span className="sm:hidden" aria-hidden>· </span>{e.trangThai === 'huy' ? t('đã huỷ chuyển') : e.trangThai === 'roi' ? t('đã đổi lớp chuyển đến') : t('từ {tuan}', { tuan: tuanLich(e.tuan, hn) })}</small>
              </span>
              {(
                <span role="cell" className="grid min-w-0 gap-0.5 text-[13px] max-sm:col-span-2 max-sm:row-start-3">
                  {e.lichMock.length ? e.lichMock.map((m) => (
                    <span key={m.ten} className="whitespace-nowrap max-sm:whitespace-normal">
                      <b className="font-semibold">{m.ten.split(' · ')[0]}</b>{m.ten.includes(' · ') ? ` · ${m.ten.split(' · ').slice(1).join(' · ')}` : ''} · <span className={m.kieu === 'o_lai' ? 'text-[color:var(--warn)]' : m.kieu === 'huy' ? 'text-bad' : 'text-dim'}>{NHAN_LICH[m.kieu]()}</span>
                    </span>
                  )) : <span className="text-dim">—</span>}
                </span>
              )}
              <span role="cell" className="justify-self-end max-sm:col-start-2 max-sm:row-start-1">{c?.length ? <ChuoiCham chuoi={c} /> : null}</span>
            </div>
            {dangMo && <KhayTuyen lenhId={e.lenhId} />}
          </div>
        );
      })}
    </div>
  );
}

/** Tuyến Chuyển lớp của MỘT em — tải khi mở khay (`GET /tuyen/chuyen_lop/:lệnh`, quyền khung như mọi tuyến). */
function KhayTuyen({ lenhId }: { lenhId: number }) {
  const { data, error, reload } = useApi<Tuyen>(`/tuyen/chuyen_lop/${lenhId}`, [lenhId]);
  return (
    <div className="border-t px-3.5 py-3" style={{ borderColor: 'var(--line)', background: 'color-mix(in srgb, var(--accent-soft) 38%, var(--surface))' }}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /> : data ? <KhoiTuyen tuyen={data} /> : <Skeleton rows={3} />}
    </div>
  );
}

/** Bảng cặp GV đổi (mockup v28 L4a, 3 cột): Môn / kỹ năng · Giáo viên cũ → mới · Hiệu lực (một lần lưu một hiệu lực). */
function BangDoi({ doi, hn }: { doi: DongDoi[]; hn: string }) {
  if (!doi.length) return null;
  return (
    <div role="table" aria-label={t('Giáo viên đổi')} className="overflow-hidden rounded-[10px] border text-sm" style={{ borderColor: 'var(--line)' }}>
      <div role="row" className={`grid h-9 items-center gap-x-4 px-3.5 text-xs font-semibold text-faint max-sm:hidden ${LUOI_3}`}>
        <span role="columnheader">{t('Môn / kỹ năng')}</span><span role="columnheader">{t('Giáo viên')}</span><span role="columnheader" className="justify-self-end">{t('Hiệu lực')}</span>
      </div>
      {doi.map((d) => (
        <div key={d.doiId} role="row" className={`grid min-h-[48px] grid-cols-[minmax(0,1fr)_max-content] items-center gap-x-4 gap-y-0.5 border-t px-3.5 py-1.5 ${LUOI_3}`} style={{ borderColor: 'var(--line)' }}>
          <span role="cell" className="font-semibold">{d.khoa === 'gvcn' ? 'GVCN' : tenMon(null, d.khoa)}</span>
          <span role="cell" className="min-w-0 max-sm:col-span-2 max-sm:row-start-2">{d.gvCu ?? '—'} <span aria-hidden className="text-dim">→</span><span className="sr-only">{t('sang')}</span> <b className="font-semibold">{d.gvMoi ?? '—'}</b></span>
          <span role="cell" className="justify-self-end tabular-nums max-sm:col-start-2 max-sm:row-start-1">{d.trangThai === 'huy' ? t('đã huỷ') : tuanLich(d.hieuLuc, hn)}</span>
        </div>
      ))}
    </div>
  );
}
