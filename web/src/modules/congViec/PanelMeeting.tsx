import { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { BoiCanh, dauViec } from '../../ui/KhuonViec.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { DsLichSu, LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { shortDate } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { DongTheoDoi, KhoiGiaoViec, dongLichSuGiao, duongGiaoViec, lamMoiGiaoViec, useGiaoViec, useHn, type KhoiGv } from './KhoiGiaoViec.tsx';
import { lucVn } from './gioVn.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';

/** `GET /phoi-hop-sos/:id/meeting` — hai phần (Xếp lịch họp · Kết quả meeting) + id việc Báo PH Meeting của TVV. */
export type MeetingBaPhan = { phoiHopId: number; phan: KhoiGv[]; baoPhId: number | null;
  /** Bối cảnh đầu panel (G8a): SOS của lượt · ngày + GVCN xác nhận · ghi chú GVCN · PH (null = người xem không được thấy liên hệ). */
  boiCanh: { sos: number | null; ngay: string | null; gvcn: string | null; ghiChu: string | null; phuHuynh: { ten: string | null; quanHe: string | null; sdt: string | null } | null } };
/** "0903 118 260" — chỉ để đọc; `tel:` giữ số gốc. */
const sdtDoc = (s: string) => s.replace(/\D/g, '').replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
export const duongMeeting = (phoiHopId: number) => `/phoi-hop-sos/${phoiHopId}/meeting`;

/** "18/09 · 15:00" từ `YYYY-MM-DD[ HH:MM]`. */
const ngayGioDoc = (s: string, hn: string) => `${shortDate(s.slice(0, 10), hn)}${s.length > 10 ? ` · ${s.slice(11, 16)}` : ''}`;

/**
 * PANEL MEETING CX / GĐCN (GV-2, B2; mockup v22 G8a / G8c / G8d / G8f) — dòng "Xếp lịch họp" (BPXL) và "Kết quả meeting" (CX) mở panel này: ba khối XẾP DỌC
 * cùng kiểu, không thứ tự, không chữ "chờ" — phần của mình mở để làm (khối Phụ trách · Hạn + ô + Hoàn thành), phần người khác gọn một dòng trạng thái.
 * Báo PH (TVV) chỉ một dòng ở đây (form ở panel Báo PH của TVV). Theo dõi: MỘT dòng cho cả việc (thêm / bỏ ở mọi phần). Lịch sử gộp ba phần.
 */
export function PanelMeeting({ it, onDong, onDaLam, onTiep }: { it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null }) {
  const hn = useHn();
  const { data, error, reload } = useApi<MeetingBaPhan>(it.phoiHopId ? duongMeeting(it.phoiHopId) : null, [it.phoiHopId]);
  const [ban, setBan] = useState<KhoiGv[] | null>(null);
  useEffect(() => setBan(null), [data]);
  const phan = ban ?? data?.phan ?? null;
  const bp = useGiaoViec('bao_ph', data?.baoPhId);
  const bc = data?.boiCanh;
  /* Mockup G8a: em · lớp · chip SOS của lượt (đầu panel). */
  const dau = dauViec({ em: it.studentId ? { id: it.studentId, ten: it.studentName } : null, lop: it.classCode, ngCanh: bc?.sos ? <ChipSos muc={bc.sos} tinh /> : null });
  const tieuDe = t('Meeting CX/GĐCN');
  const chan = { huy: null, chinh: <>{onTiep && <button type="button" className="btn min-h-[44px] sm:min-h-[36px]" onClick={onTiep}>{t('Việc tiếp ›')}</button>}
    <button type="button" className="btn min-h-[44px] sm:min-h-[36px]" onClick={onDong}>{t('Đóng')}</button></> };
  if (error) return <KhungPanel hd="phoi-hop-sos" tieuDe={tieuDe} dau={dau} onDong={onDong}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></KhungPanel>;
  if (!phan) return <KhungPanel hd="phoi-hop-sos" tieuDe={tieuDe} dau={dau} onDong={onDong}><div className="pt-3"><Skeleton rows={6} /></div></KhungPanel>;
  const datPhan = (g: KhoiGv) => { setBan(phan.map((x) => (x.id === g.id ? g : x))); onDaLam(); };
  const lichSu = [...phan.flatMap((g) => dongLichSuGiao(g, hn, g.meeting?.ten)), ...dongLichSuGiao(bp.g, hn, t('Báo PH'))].sort((a, b) => b.luc.localeCompare(a.luc));
  return (
    <KhungPanel hd="phoi-hop-sos" tieuDe={tieuDe} dau={dau} onDong={onDong} chan={chan}>
      <div className="flex flex-col gap-3 pt-4">
        {/* Mockup G8a: họp vì sao (SOS · ngày · GVCN · ghi chú) + liên hệ ai (PH · SĐT bấm gọi) — dữ liệu đi cùng GET panel. */}
        {bc && <BoiCanh dong={[
          [bc.sos ? t('Lên SOS {n}', { n: bc.sos }) : t('GVCN xác nhận'), [bc.ngay ? shortDate(bc.ngay, hn) : null, bc.gvcn ? t('GVCN {ten}', { ten: bc.gvcn }) : null, bc.ghiChu].filter(Boolean).join(' · ') || null],
          [t('Phụ huynh'), bc.phuHuynh?.ten ? <span className="flex flex-wrap items-center gap-x-1.5">{bc.phuHuynh.ten}{bc.phuHuynh.quanHe ? ` (${bc.phuHuynh.quanHe})` : ''}
            {bc.phuHuynh.sdt && <> · <a className="link tabular-nums max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" href={`tel:${bc.phuHuynh.sdt.replace(/\D/g, '')}`}>{sdtDoc(bc.phuHuynh.sdt)}</a></>}</span> : null],
        ]} />}
        {phan.map((g) => <PhanMeeting key={g.id} g={g} dat={datPhan} reload={reload} />)}
        {bp.g && <DongBaoPh g={bp.g} />}
        <DongTheoDoi rieng ds={bp.g ? [...phan, bp.g] : phan} reload={reload}
          dat={(ds) => { setBan(ds.filter((x) => x.loai === 'meeting')); const b = ds.find((x) => x.loai === 'bao_ph'); if (b) bp.dat(b); }} />
        <LichSuGap so={lichSu.length}>
          <DsLichSu dong={lichSu.map((l, i) => ({ key: i, gio: lucVn(l.luc), ai: l.nguoi, viec: l.tieu, phu: l.phu }))} />
        </LichSuGap>
      </div>
    </KhungPanel>
  );
}

/** Dòng gọn phần Báo PH (TVV) trong panel Meeting — trạng thái · người · hạn (mockup G8a). */
function DongBaoPh({ g }: { g: KhoiGv }) {
  const hn = useHn();
  return (
    <section className="flex min-h-[44px] flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[10px] border px-3 py-2" style={{ borderColor: 'var(--line)', background: g.mo ? 'var(--surface)' : 'var(--surface-2)' }}
      aria-label={t('Báo PH')}>
      <h3 className="m-0 text-[15px] font-bold">{t('Báo PH')}</h3>
      <TheTrangThai xong={!g.mo} chu={g.mo ? t('Chưa xong') : t('Đã báo PH')} />
      <span className="text-[13px] text-dim">{[g.phuTrach.map((x) => x.ten).filter(Boolean).join(', ') || null, g.mo && g.han ? t('hạn {ngay}', { ngay: shortDate(g.han, hn) }) : null].filter(Boolean).join(' · ')}</span>
    </section>
  );
}

const TheTrangThai = ({ xong, chu }: { xong: boolean; chu: string }) => (
  <span className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-md border px-2 text-xs font-semibold ${xong ? 'border-ok-line bg-ok-bg text-ok' : 'text-dim'}`}
    style={xong ? undefined : { borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }}>{xong ? `✓ ${chu}` : chu}</span>
);

/**
 * MỘT PHẦN MEETING (G8): đầu "Tên · trạng thái · ai · lúc" · phần của mình (máy chủ `coTheLam`) chưa xong → khối Phụ trách · Hạn + ô (Xếp lịch: Ngày giờ họp
 * tuỳ chọn = ô ngày gõ được + lịch + ô giờ, Kết quả tuỳ chọn; Kết quả meeting: Kết quả tuỳ chọn) + Hoàn thành. Người bấm không phải người phụ trách (TVV nhập hộ
 * CX) → dải "Bạn nhập hộ CX {tên}". Xong → dải "✓ {phần} · Xong · Hoàn tác" 10 giây; "Sửa" mở lại ô (lưu = sửa, có lịch sử). Phần đã bỏ (Meeting đưa về Cần xử lý) chỉ đọc.
 */
export function PhanMeeting({ g, dat, reload }: { g: KhoiGv; dat: (g: KhoiGv) => void; reload: () => void }) {
  const hn = useHn();
  const { session } = useSession();
  const toast = useToast();
  const m = g.meeting!;
  const xep = m.phan === 'xep_lich';
  const [sua, setSua] = useState(false);
  const [ngay, setNgay] = useState(m.ngayGio?.slice(0, 10) ?? '');
  const [gio, setGio] = useState(m.ngayGio?.slice(11, 16) ?? '');
  const [kq, setKq] = useState(m.ketQua ?? '');
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [vuaXong, setVuaXong] = useState<number | null>(null);
  useEffect(() => {
    if (!vuaXong) return undefined;
    const h = setTimeout(() => setVuaXong(null), Math.max(0, vuaXong - Date.now()));
    return () => clearTimeout(h);
  }, [vuaXong]);
  const xong = m.trangThai === 'xong';
  const mo = m.coTheLam && (m.trangThai === 'mo' || sua);
  const laPt = g.phuTrach.some((x) => x.id === session?.user?.id);
  const tenPt = g.phuTrach.map((x) => x.ten).filter(Boolean).join(', ') || t('Head chi nhánh');
  const hoanThanh = async () => {
    if (gio && !ngay) { setLoi(t('Chọn ngày họp trước khi ghi giờ.')); return; }
    setDang(true); setLoi(null);
    try {
      const moi = await api.post<KhoiGv>(`${duongGiaoViec('meeting', g.id)}/xong`, { ngayGio: xep && ngay ? `${ngay}${gio ? ` ${gio}` : ''}` : null, ketQua: kq.trim() || null });
      setSua(false); dat(moi); lamMoiGiaoViec();
      if (!xong) setVuaXong(Date.now() + 10_000); else toast.push('ok', t('Đã lưu'));
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); if (e?.status === 409) reload(); } finally { setDang(false); }
  };
  const hoanTac = async () => {
    setVuaXong(null);
    try { dat(await api.post<KhoiGv>(`${duongGiaoViec('meeting', g.id)}/mo-lai`)); lamMoiGiaoViec(); toast.push('ok', t('Đã hoàn tác')); }
    catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); reload(); }
  };
  const ai = xong ? [m.nhapHoBoi ? t('{ten} nhập hộ CX', { ten: m.nhapHoBoi }) : m.xongBoi, m.xongLuc ? lucVn(m.xongLuc) : null].filter(Boolean).join(' · ')
    : m.trangThai === 'bo' ? t('Meeting đã đưa về Cần xử lý') : [tenPt, g.han ? t('hạn {ngay}', { ngay: shortDate(g.han, hn) }) : null].filter(Boolean).join(' · ');
  return (
    <section className={`grid gap-3 rounded-[10px] border ${mo ? 'p-3' : 'px-3 py-2'}`} aria-label={m.ten}
      style={{ borderColor: mo ? 'var(--line-strong)' : 'var(--line)', background: xong && !mo ? 'var(--surface-2)' : 'var(--surface)' }}>
      {vuaXong && (
        <div role="status" className="flex min-h-[40px] items-center gap-2.5 rounded-lg border border-ok-line bg-ok-bg py-1.5 pl-3 pr-2 text-sm">
          <b className="font-bold text-ok" aria-hidden>✓</b><span className="min-w-0 flex-1">{t('{phan} · Xong', { phan: m.ten })}</span>
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={() => void hoanTac()}>{t('Hoàn tác')}</button>
        </div>
      )}
      <div className="flex min-h-[28px] flex-wrap items-center gap-x-2.5 gap-y-1">
        <h3 className="m-0 text-[15px] font-bold">{m.ten}</h3>
        <TheTrangThai xong={xong} chu={xong ? t('Hoàn thành') : m.trangThai === 'bo' ? t('Đã bỏ') : t('Chưa xong')} />
        {!mo && ai && <span className="min-w-0 text-[13px] text-dim">{ai}{xong && xep && m.ngayGio ? <> · {t('họp')} <b className="font-semibold text-[color:var(--text)]">{ngayGioDoc(m.ngayGio, hn)}</b></> : null}</span>}
        {xong && !mo && m.coTheLam && <button type="button" className="btn btn-sm ml-auto min-h-[44px] sm:min-h-[30px]" onClick={() => { setNgay(m.ngayGio?.slice(0, 10) ?? ''); setGio(m.ngayGio?.slice(11, 16) ?? ''); setKq(m.ketQua ?? ''); setSua(true); }}>{t('Sửa')}</button>}
      </div>
      {xong && !mo && m.ketQua && <p className="m-0 whitespace-pre-line break-words text-sm">{m.ketQua}</p>}
      {mo && <>
        {/* Người phụ trách / Head · QT · CX: khối Phụ trách · Hạn. TVV nhập hộ Kết quả meeting: dải "Bạn nhập hộ CX {tên}" (G8b). */}
        {laPt || g.coTheDoiNguoi ? <KhoiGiaoViec g={g} dat={dat} reload={reload} gon anTheoDoi /> : (
          <div className="flex min-h-[40px] flex-wrap items-center gap-x-1.5 rounded-lg px-3 py-1.5 text-sm text-dim" style={{ background: 'var(--surface-2)' }}>
            {t('Bạn nhập hộ CX')} <b className="font-semibold text-[color:var(--text)]">{tenPt}</b>
          </div>
        )}
        <div className={xep ? 'grid gap-3 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)]' : 'grid'}>
          {xep && (
            <div className="grid gap-1.5">
              <span className="text-sm font-bold">{t('Ngày giờ họp')} <span className="font-normal text-faint text-[13px]">{t('tuỳ chọn')}</span></span>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1"><ONgay kieu="ngay" value={ngay || null} onChange={setNgay} ariaLabel={t('Ngày họp')} /></div>
                <input type="time" className="field w-[124px] shrink-0 tabular-nums max-sm:h-11" value={gio} onChange={(e) => setGio(e.target.value)} aria-label={t('Giờ họp')} />
              </div>
            </div>
          )}
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">{t('Kết quả')} <span className="font-normal text-faint text-[13px]">{t('tuỳ chọn')}</span></span>
            {xep ? <input className="field" name="ket-qua" autoComplete="off" value={kq} maxLength={2000} placeholder={t('Ghi chú nếu cần')} onChange={(e) => setKq(e.target.value)} />
              : <textarea className="field min-h-[72px] py-2" name="ket-qua" autoComplete="off" rows={3} value={kq} maxLength={2000} onChange={(e) => setKq(e.target.value)} />}
          </label>
        </div>
        {loi && <p role="alert" className="m-0 text-[13px] text-bad">⚠ {loi}</p>}
        <span className="flex flex-wrap gap-2 max-sm:grid">
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px]" disabled={dang} onClick={() => void hoanThanh()}>{dang ? t('Đang lưu…') : t('Hoàn thành')}</button>
          {sua && <button type="button" className="btn min-h-[44px] sm:min-h-[36px]" disabled={dang} onClick={() => setSua(false)}>{t('Huỷ sửa')}</button>}
        </span>
      </>}
    </section>
  );
}

/**
 * Hai phần Meeting (Xếp lịch họp · Kết quả meeting) trong panel Báo PH Meeting của TVV (mockup G8b) — Báo PH là form chính của panel đó.
 * Trả `phan` để panel gộp Theo dõi + Lịch sử.
 */
export function useMeeting(phoiHopId: number | null | undefined) {
  const { data, error, reload } = useApi<MeetingBaPhan>(phoiHopId ? duongMeeting(phoiHopId) : null, [phoiHopId]);
  const [ban, setBan] = useState<KhoiGv[] | null>(null);
  useEffect(() => setBan(null), [data]);
  return { phan: ban ?? data?.phan ?? null, error, reload, dat: setBan };
}
