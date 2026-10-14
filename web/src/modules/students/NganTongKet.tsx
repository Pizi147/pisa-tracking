import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { Nhan, type ToneNhan } from '../../ui/Nhan.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { LUA_CHON_SAU_THI, NHAN_SAU_THI, duongHoSoHocVien, hienTargetKck, ngay, type LuaChonSauThi } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { toneHuong } from './CacLoTrinh.tsx';
import { KetQuaThiThatPanel } from './KetQuaThiThatPanel.tsx';
import { HocLaiPanel } from './StudentManagePanel.tsx';
import { dich, t } from '@shared/i18n/index.ts';

type KyNang = { k: string; nhan: string; diem: number | null; tong: number | null; dat: boolean | null };
type Luot = {
  attemptNo: number; kind: string; nhan: string; lop: string | null; tuan: string | null; trangThai: string; huyLyDo: string | null; huyPhan: boolean;
  kyNang: KyNang[]; overall: number | null; kyVong: number | null; sos: number | null; tyLe: number | null; ketQua: string | null;
};
type TongKet = {
  hocVien: { id: number; ten: string }; ten: string; loai: 'ft' | 'thuong'; lop: string | null; gvcn: string | null; dauVao: number | null; target: number | null;
  khongCamKet: boolean; thoiGian: string; dich: { target: number | null; thiDuKien: string | null };
  ketQua:
    | { loai: 'ft'; ovr: number | null; l: number | null; r: number | null; w: number | null; s: number | null; ngay: string | null; khongThi: boolean; khongCoThi: boolean; nhan: string; ketLuan: string | null; choNhap: boolean; coTheNhap: boolean }
    | { loai: 'thuong'; tyLe: number | null; dai: string | null; kyVongDat: boolean | null;
        /** OV-3c: Kết quả đầu ra QL đã chốt (em lên FT) — tra lại sau khi bảng ở lớp FT hết 4 tuần. */
        kqdr: { dat: boolean; nguyenNhan: string | null; mon: string[] } | null };
  huongTiep: { khoa: string; nhan: string | null };
  /** OV-8a: Bước tiếp sau thi (FT có kết quả thi thật); null = không có mục. */
  buocTiep: { chon: LuaChonSauThi | null; luc: string | null; boi: string | null; goiY: LuaChonSauThi | null; coTheChon: boolean } | null;
  luot: Luot[];
};

const b1 = (v: number | null | undefined) => (v === null || v === undefined ? '—' : v.toFixed(1));
const NGAN_KN: Record<string, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };
const chuKqdr = (k: { dat: boolean; nguyenNhan: string | null; mon: string[] }) => (k.dat ? t('Đạt')
  : [t('Không đạt'), k.nguyenNhan === 'hoc_sinh' ? t('Học viên') : k.nguyenNhan === 'trung_tam' ? t('Trung tâm') : null, k.mon.map((m) => NGAN_KN[m] ?? m).join(' ') || null].filter(Boolean).join(' · '));
const DAI: Record<string, { nhan: string; tone: ToneNhan }> = {
  dat: { nhan: '≥ 70%', tone: 'ok' }, '60_69': { nhan: '60–69%', tone: 'soon' }, '50_59': { nhan: '50–59%', tone: 'soon' }, duoi_50: { nhan: '< 50%', tone: 'late' },
};
const MUI = (
  <span className="flex items-center justify-center text-slate-600 max-sm:rotate-90" aria-hidden>
    <svg viewBox="0 0 8 8" width="10" height="10"><path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
);

/** Một ô của dải Đích → Kết quả → Hướng tiếp. */
function O({ nho, children, cho }: { nho: string; children: ReactNode; cho?: boolean }) {
  return (
    <div className={`min-w-0 rounded-[10px] border px-3 py-2.5 ${cho ? 'text-slate-400' : ''}`} style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
      <small className="mb-0.5 block text-xs text-slate-500">{nho}</small>
      {children}
    </div>
  );
}
const Lon = ({ children, em }: { children: ReactNode; em?: string }) => (
  <div className="text-xl font-bold leading-tight tabular-nums text-slate-100">{children}{em && <em className="ml-1 text-[11.5px] font-medium not-italic text-slate-500">{em}</em>}</div>
);

/** Nhãn kết quả một lượt: FT Đạt / SOS n · kỹ năng dưới kỳ vọng; lớp thường % hoặc n/m môn. */
function nhanLuot(l: Luot, ft: boolean): { tone: ToneNhan; chu: string; phu?: string } | null {
  if (l.trangThai === 'cancelled') return null;
  if (ft) {
    if (l.ketQua === 'dat') return { tone: 'ok', chu: t('Đạt') };
    if (l.ketQua === 'chua_dat') return { tone: 'soon', chu: `SOS ${l.sos} · ${l.kyNang.filter((k) => k.dat === false && k.k.length > 2 && !k.k.endsWith('1') && !k.k.endsWith('2')).map((k) => dich(k.nhan)).join(', ')}` };
    return null;
  }
  const dat = l.kyNang.filter((k) => k.dat === true).length;
  if (l.kind === 'final' && l.tyLe !== null) return { tone: dat === l.kyNang.length ? 'ok' : 'soon', chu: `${Math.round(l.tyLe * 100)}%` };
  if (!l.kyNang.some((k) => k.diem !== null)) return null;
  const hong = l.kyNang.filter((k) => k.dat === false).map((k) => dich(k.nhan));
  return { tone: hong.length ? 'soon' : 'ok', chu: t('{a}/{b} môn đạt', { a: dat, b: l.kyNang.length }), phu: hong.length ? t('Không đạt: {ds}', { ds: hong.join(', ') }) : undefined };
}

function BangLuot({ luot, ft }: { luot: Luot[]; ft: boolean }) {
  const tag = (l: Luot) => (l.trangThai === 'cancelled' ? t('đã huỷ') : l.huyPhan ? t('huỷ phần') : null);
  const diemFt = (l: Luot, k: string) => l.kyNang.find((x) => x.k === k)?.diem ?? null;
  return (
    <>
      {/* ≥ sm: bảng, cuộn ngang trong khung (không cuộn trang) */}
      <div className="hidden overflow-x-auto rounded-[10px] border sm:block" style={{ borderColor: 'var(--line)' }}>
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] text-slate-400" style={{ background: 'var(--surface-2)' }}>
              <th className="px-3 py-2 font-semibold">{ft ? 'MT' : t('Bài')}</th><th className="px-3 py-2 font-semibold">{t('Lớp')}</th><th className="px-3 py-2 font-semibold">{t('Tuần')}</th>
              {ft ? ['L', 'R', 'W', 'S', 'OVR', t('Kỳ vọng')].map((h) => <th key={h} className="px-3 py-2 text-right font-semibold">{h}</th>) : <th className="px-3 py-2 font-semibold">{t('Điểm từng phần')}</th>}
              <th className="px-3 py-2 font-semibold">{t('Kết quả')}</th>
            </tr>
          </thead>
          <tbody>
            {luot.map((l) => {
              const huy = l.trangThai === 'cancelled'; const nl = nhanLuot(l, ft);
              return (
                <tr key={`${l.attemptNo}-${l.kind}`} className={`h-11 border-t ${huy ? 'opacity-70' : ''}`} style={{ borderColor: 'var(--line)' }}>
                  <td className="whitespace-nowrap px-3 font-bold text-slate-100">{dich(l.nhan)}{tag(l) && <span className="ml-1.5 text-xs font-normal text-late">{tag(l)}</span>}</td>
                  <td className="px-3 text-slate-300">{l.lop ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 tabular-nums text-slate-300">{l.tuan ?? '—'}</td>
                  {ft ? (
                    <>
                      {['listening', 'reading', 'writing', 'speaking'].map((k) => <td key={k} className="px-3 text-right tabular-nums">{b1(diemFt(l, k))}</td>)}
                      <td className="px-3 text-right font-semibold tabular-nums text-slate-100">{b1(l.overall)}</td>
                      <td className="px-3 text-right tabular-nums">{b1(l.kyVong)}</td>
                    </>
                  ) : (
                    <td className="px-3">{huy ? <span className="text-slate-600">—</span> : l.kyNang.map((k) => (
                      <span key={k.k} className={`mr-1 inline-flex rounded px-1.5 text-[11.5px] font-semibold tabular-nums ${k.dat === false ? 'bg-soon-bg text-soon' : k.dat ? 'bg-ok-bg text-ok' : 'bg-muted-bg text-slate-500'}`}>
                        {dich(k.nhan)} {k.diem ?? '—'}{k.tong ? `/${k.tong}` : ''}
                      </span>
                    ))}</td>
                  )}
                  <td className="px-3">{nl ? <span className="inline-flex flex-wrap items-center gap-x-2"><Nhan tone={nl.tone}>{nl.chu}</Nhan>{nl.phu && <span className="text-[11.5px] text-slate-500">{nl.phu}</span>}</span> : <span className="text-slate-600">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* < sm: mỗi lượt một thẻ */}
      <ul className="m-0 list-none rounded-[10px] border p-0 sm:hidden" style={{ borderColor: 'var(--line)' }}>
        {luot.map((l) => {
          const huy = l.trangThai === 'cancelled'; const nl = nhanLuot(l, ft);
          return (
            <li key={`${l.attemptNo}-${l.kind}`} className={`border-t px-3 py-2.5 first:border-t-0 ${huy ? 'opacity-70' : ''}`} style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <b className="text-slate-100">{dich(l.nhan)}</b>{tag(l) && <span className="ml-1.5 text-xs text-late">{tag(l)}</span>}
                  <div className="text-xs text-slate-500">{l.tuan ?? '—'} · {l.lop ?? '—'}</div>
                </div>
                {nl && <Nhan tone={nl.tone}>{nl.chu}</Nhan>}
              </div>
              {!huy && (ft
                ? <dl className="m-0 mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12.5px]">
                    <dt className="text-slate-500">{t('Điểm')}</dt><dd className="m-0 tabular-nums">L {b1(diemFt(l, 'listening'))} · R {b1(diemFt(l, 'reading'))} · W {b1(diemFt(l, 'writing'))} · S {b1(diemFt(l, 'speaking'))}</dd>
                    <dt className="text-slate-500">Overall</dt><dd className="m-0 tabular-nums">{b1(l.overall)}</dd>
                    <dt className="text-slate-500">{t('Kỳ vọng')}</dt><dd className="m-0 tabular-nums">{b1(l.kyVong)}</dd>
                  </dl>
                : <div className="mt-1.5">{l.kyNang.map((k) => (
                    <span key={k.k} className={`mr-1 inline-flex rounded px-1.5 text-[11.5px] font-semibold tabular-nums ${k.dat === false ? 'bg-soon-bg text-soon' : k.dat ? 'bg-ok-bg text-ok' : 'bg-muted-bg text-slate-500'}`}>
                      {dich(k.nhan)} {k.diem ?? '—'}{k.tong ? `/${k.tong}` : ''}
                    </span>))}</div>)}
            </li>
          );
        })}
      </ul>
    </>
  );
}

const LAM_MOI = ['/students', '/classes', '/hoc-vien-lop', '/cases', '/lo-trinh', '/my-work'];

/**
 * MỤC "BƯỚC TIẾP" (OV-8a) — ngay dưới kết quả thi thật. Quản lý / Quản trị / TVV của chi nhánh (OV-12a) có nút: Kết thúc (vào Lưu trữ, Hoàn tác trên thông báo) · Học tiếp lộ trình mới ·
 * Học lại (hai nút sau mở panel Học lại sẵn có). Gợi ý chỉ là chữ. Đã chọn → "Đã chọn: … · ngày · người" + Sửa (đổi = hoàn tác lựa chọn cũ rồi làm cái mới).
 */
function MucBuocTiep({ bt, cycleId, hocVien, ketQua, onDoi, onMo }: {
  bt: NonNullable<TongKet['buocTiep']>; cycleId: number; hocVien: { id: number; ten: string }; ketQua: string; onDoi: () => void;
  /** OV-11d (HV-9): Học tiếp / Học lại mở panel Học lại TRONG ngăn này (nơi gọi đổi nội dung). */
  onMo: (chon: 'hoc_tiep' | 'hoc_lai', doi: boolean) => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [sua, setSua] = useState(false);
  const [busy, setBusy] = useState(false);
  const doi = !!bt.chon;
  const xong = () => { setSua(false); onDoi(); };
  const ketThuc = async () => {
    setBusy(true);
    try {
      await api.post(`/cycles/${cycleId}/buoc-tiep`, { chon: 'ket_thuc' });
      for (const k of LAM_MOI) invalidate(k);
      const chu = t('Đã chọn Kết thúc — {ten} vào Lưu trữ', { ten: hocVien.ten });
      if (doi) toast.push('ok', chu);
      else {
        toast.hoanTac(chu, async () => {
          try { await api.del(`/cycles/${cycleId}/buoc-tiep`); } catch (e: any) { toast.push('error', e.message); return; }
          for (const k of LAM_MOI) invalidate(k);
          toast.push('ok', t('Đã hoàn tác'));
          onDoi();
        }, { key: `buoc-tiep:${cycleId}` });
      }
      xong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const bam = (k: LuaChonSauThi) => (k === 'ket_thuc' ? void ketThuc() : onMo(k, doi));
  return (
    <section aria-labelledby={`buoc-tiep-${cycleId}`} className="rounded-[10px] border px-3 py-2.5" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h3 id={`buoc-tiep-${cycleId}`} className="m-0 text-xs font-normal text-slate-500">{t('Bước tiếp')}</h3>
        {bt.goiY && (!bt.chon || sua) && <span className="text-xs text-slate-400">{t('Gợi ý:')} <b className="font-semibold text-slate-200">{NHAN_SAU_THI[bt.goiY]}</b> · {ketQua}</span>}
      </div>
      {bt.chon && !sua ? (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm text-slate-200">{t('Đã chọn:')} <b className="font-semibold text-slate-100">{NHAN_SAU_THI[bt.chon]}</b>
            <span className="text-slate-400">{bt.luc ? ` · ${ngay(bt.luc, homNay)}` : ''}{bt.boi ? ` · ${bt.boi}` : ''}</span></span>
          {bt.coTheChon && <button type="button" className="btn btn-ghost btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSua(true)}>{t('Sửa')}</button>}
        </div>
      ) : bt.coTheChon ? (
        <>
          {sua && <p className="m-0 mt-1 text-[12.5px] text-slate-400">{t('Đổi lựa chọn: lựa chọn cũ được hoàn tác trước (lớp / lộ trình mới chưa có điểm thì gỡ).')}</p>}
          <div role="group" aria-label={t('Chọn bước tiếp')} className="mt-2 flex flex-wrap gap-1.5">
            {LUA_CHON_SAU_THI.map((k) => (
              <button key={k} type="button" disabled={busy || k === bt.chon} onClick={() => bam(k)}
                className="btn btn-sm min-h-[44px] max-sm:flex-1 sm:min-h-0">
                {NHAN_SAU_THI[k]}{k === bt.chon ? ` · ${t('đang chọn')}` : ''}
              </button>
            ))}
            {sua && <button type="button" className="btn btn-ghost btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSua(false)}>{t('Giữ nguyên')}</button>}
          </div>
        </>
      ) : (
        <p className="m-0 mt-1 text-sm text-slate-400">{t('Chờ QL hoặc TVV chọn: Kết thúc · Học tiếp lộ trình mới · Học lại.')}</p>
      )}
    </section>
  );
}

/**
 * NGĂN "TỔNG KẾT LỘ TRÌNH" (PR-TK, TK-8) — chỉ lộ trình ĐÃ ĐÓNG, số lấy từ bản chụp (đóng băng). FT: Đích → Thi thật → Hướng tiếp (kết quả thi thật do GVCN nhập,
 * máy so với Target lúc đóng); lớp thường: Cuối khoá % → Hướng tiếp. Dưới: lượt Test từng lượt. Chân: Mở hồ sơ · Đóng. Chữ đúng mockup.
 */
export function NganTongKet({ cycleId, onClose, onDoi }: { cycleId: number; onClose: () => void; onDoi?: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const { data, loading, error, reload } = useApi<TongKet>(`/lo-trinh/${cycleId}/tong-ket`, [cycleId]);
  /* OV-11d (HV-9): Nhập kết quả / Học tiếp / Học lại THAY nội dung ngăn (dòng "← Tổng kết", như `NganCase`) — không panel chồng. */
  const [view, setView] = useState<{ loai: 'nhap' } | { loai: 'hoc'; chon: 'hoc_tiep' | 'hoc_lai'; doi: boolean } | null>(null);
  const chuongTrinh = data ? (data.loai === 'ft' ? 'Fast Track' : dich(data.ten)) : null;
  const ft = data?.loai === 'ft';
  const kq = data?.ketQua;
  const veTongKet = () => setView(null);
  const daDoi = () => { setView(null); reload(); onDoi?.(); };
  const quayLai = { nhan: t('Tổng kết'), onClick: veTongKet };
  if (data && view?.loai === 'nhap') {
    return <KetQuaThiThatPanel cycleId={cycleId} studentName={data.hocVien.ten} lop={data.lop} quayLai={quayLai} onClose={veTongKet} onDone={daDoi} />;
  }
  if (data && view?.loai === 'hoc') {
    return (
      <HocLaiPanel studentId={data.hocVien.id} studentName={data.hocVien.ten} lop={data.lop} buocTiep={{ cycleId, chon: view.chon, doi: view.doi }}
        quayLai={quayLai} onClose={veTongKet} onDone={daDoi} />
    );
  }
  /* OV-11d (HV-7): lộ trình đóng bằng Kết luận CŨ (không điểm thi thật) — ô Thi thật nói đúng nguồn, không "Chờ kết quả thi thật". */
  const ketLuanCu = kq?.loai === 'ft' && kq.ovr === null && !kq.khongThi && !kq.khongCoThi && (kq.ketLuan === 'reached' || kq.ketLuan === 'not_reached') ? kq.nhan : null;
  return (
    <>
      <KhungPanel tieuDe={t('Tổng kết lộ trình')} hocVien={data ? `${data.hocVien.ten} · ${chuongTrinh}` : null} rong="rong" onDong={onClose}
        chan={{ huy: null, phu: data ? <Link className="btn btn-ghost min-h-[44px] sm:min-h-0" to={duongHoSoHocVien(data.hocVien.id, { loTrinh: cycleId })}>{t('Mở hồ sơ')}</Link> : undefined,
          chinh: <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose}>{t('Đóng')}</button> }}>
        {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
        {loading && !data && <Skeleton rows={6} />}
        {data && kq && (
          <div className="space-y-3">
            <div className={`grid gap-1.5 ${ft ? 'sm:grid-cols-[1fr_18px_1.5fr_18px_1fr]' : 'sm:grid-cols-[1.5fr_18px_1fr]'}`}>
              {kq.loai === 'ft' ? (
                <>
                  <O nho={t('Đích')}>
                    <Lon em="Target">{data.khongCamKet ? hienTargetKck(data.dich.target !== null ? b1(data.dich.target) : null, true) : b1(data.dich.target)}</Lon>
                    {data.dich.thiDuKien && <div className="mt-0.5 text-xs tabular-nums text-slate-400">{t('Thi {ngay}', { ngay: dich(data.dich.thiDuKien) })}</div>}
                  </O>
                  {MUI}
                  {kq.ovr !== null ? (
                    <O nho={`${t('Thi thật')}${kq.ngay ? ` · ${ngay(kq.ngay, homNay)}` : ''}`}>
                      <Lon em="OVR">{b1(kq.ovr)}</Lon>
                      <div className="mt-0.5 text-xs tabular-nums text-slate-400">L {b1(kq.l)} · R {b1(kq.r)} · W {b1(kq.w)} · S {b1(kq.s)}</div>
                      {kq.nhan && <div className="mt-1.5"><Nhan tone={kq.ketLuan === 'reached' ? 'ok' : kq.ketLuan === 'not_reached' ? 'late' : 'muted'}>{dich(kq.nhan)}</Nhan></div>}
                    </O>
                  ) : kq.khongCoThi ? (
                    <O nho={t('Thi thật')} cho><div className="text-sm font-semibold text-slate-500">—</div></O>
                  ) : ketLuanCu ? (
                    <O nho={t('Thi thật')}><div className="text-sm font-semibold leading-snug text-slate-200">{t('Kết luận cũ: {kl}', { kl: dich(ketLuanCu) })}</div></O>
                  ) : (
                    <O nho={t('Thi thật')} cho>
                      <div className="text-sm font-semibold leading-snug text-slate-400">{kq.khongThi ? t('Không thi') : t('Chờ kết quả thi thật')}</div>
                      {kq.coTheNhap && <div className="mt-2"><button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setView({ loai: 'nhap' })}>{t('Nhập kết quả')}</button></div>}
                    </O>
                  )}
                  {MUI}
                </>
              ) : (
                <>
                  {kq.tyLe === null
                    ? <O nho="Final Test" cho><div className="text-sm font-semibold text-slate-400">{t('Chưa có điểm')}</div></O>
                    : <O nho="Final Test"><Lon>{Math.round(kq.tyLe * 100)}%</Lon>{kq.dai && DAI[kq.dai] && <div className="mt-1.5"><Nhan tone={DAI[kq.dai].tone}>{DAI[kq.dai].nhan}</Nhan></div>}</O>}
                  {MUI}
                </>
              )}
              <O nho={t('Hướng tiếp')}>
                <div className="mt-1">{data.buocTiep && !data.buocTiep.chon ? <span className="text-sm text-slate-400">{t('Chờ chọn bước tiếp')}</span>
                  : data.huongTiep.nhan ? <Nhan tone={toneHuong(data.huongTiep.nhan)}>{dich(data.huongTiep.nhan)}</Nhan> : <span className="text-slate-600">—</span>}</div>
              </O>
            </div>

            {data.buocTiep && (
              <MucBuocTiep bt={data.buocTiep} cycleId={cycleId} hocVien={data.hocVien} onDoi={() => { reload(); onDoi?.(); }}
                onMo={(chon, doi) => setView({ loai: 'hoc', chon, doi })}
                ketQua={kq.loai === 'ft' ? (kq.khongThi ? t('Không thi') : ketLuanCu ? t('theo kết luận cũ') : (kq.nhan && dich(kq.nhan)) || (kq.ovr !== null ? `OVR ${b1(kq.ovr)}` : t('Có kết quả'))) : ''} />
            )}

            <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[12.5px] text-slate-400">
              {[[t('Lớp'), data.lop], [t('GVCN'), data.gvcn], [t('Đầu vào'), data.dauVao !== null ? b1(data.dauVao) : null], ...(ft ? [] : [['Target', data.khongCamKet ? hienTargetKck(data.target !== null ? b1(data.target) : null, true) : data.target !== null ? b1(data.target) : null]]), [t('Thời gian'), dich(data.thoiGian)],
                ...(kq.loai === 'thuong' && kq.kqdr ? [[t('Kết quả đầu ra'), chuKqdr(kq.kqdr)]] : [])]
                .filter(([, v]) => v).map(([k, v]) => <span key={k as string}>{k} <b className="font-semibold text-slate-200">{v}</b></span>)}
            </div>

            <p className="m-0 text-xs font-bold text-slate-400">{ft ? 'Mock Test' : t('Kết quả Test')}{data.luot.length > 0 && <span className="ml-1 font-normal tabular-nums text-slate-500">{data.luot.length}</span>}</p>
            {data.luot.length === 0
              ? <div className="rounded-[10px] border py-8 text-center font-semibold text-slate-300" style={{ borderColor: 'var(--line)' }}>{t('Chưa có lượt Test nào')}</div>
              : <BangLuot luot={data.luot} ft={!!ft} />}
          </div>
        )}
      </KhungPanel>
    </>
  );
}
