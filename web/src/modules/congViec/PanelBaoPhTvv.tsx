import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel, Truong, useNhap, useXoaNhap } from '../../ui/KhungPanel.tsx';
import { BoiCanh, ChuLuu, dauViec, type TtLuu } from '../../ui/KhuonViec.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import {
  COORDINATION_REMOVE_REASON_LABEL, COORDINATION_USER_REMOVE_REASONS, daysBetween, kiemGhiRoKhac, luuRoiTiep, reasonNeedsText, shortDate, type KetQuaBaoPh,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';

/** `GET /y-thuc/bao-ph/:id` (máy chủ `xemViecBaoPh`). */
type ViecBaoPh = {
  id: number; studentId: number; ten: string; nhan: string; han: string; quaHan: boolean; trangThai: 'mo' | 'xong' | 'bo';
  lan: { ketQua: KetQuaBaoPh; nhan: string; ngay: string; ghiChu: string | null; nguoi: string | null; luc: string }[];
  lienHe: { ten: string | null; quanHe: string | null; sdt: string | null };
  coTheGhi: boolean; nhanXuLy: string | null;
  /** Q-RL2c: việc người dùng đã bỏ, người xem có quyền → nút Khôi phục. */
  khoiPhucDuoc: boolean;
  boiCanh: { nguoiLuu: string | null; luuLuc: string | null; lop: string | null; noiDung: string | null };
  thuHoiCho: { lyDo: string | null } | null;
};

/** "14/09 15:30" giờ Việt Nam từ ISO UTC của máy chủ. */
export const lucVn = (iso: string) => {
  const d = new Date(Date.parse(iso) + 7 * 3_600_000).toISOString();
  return `${d.slice(8, 10)}/${d.slice(5, 7)} ${d.slice(11, 16)}`;
};
/** "15:30" giờ Việt Nam lúc này — chân "✓ Đã lưu" cùng giờ với Lịch sử. */
export const gioVnNay = () => lucVn(new Date().toISOString()).slice(6);
/** "0912 345 678" — chỉ để đọc; `tel:` giữ số gốc. */
const sdtDoc = (s: string) => s.replace(/\D/g, '').replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
const KHOA_BAO_PH = ['/my-work', '/tong-quan', '/students', '/y-thuc', '/classes'];
/** Q-RL2c: Hoàn tác (toast) / Khôi phục (chân panel) việc đã bỏ — cùng một lời gọi. */
const khoiPhucBaoPh = async (id: number) => {
  await api.post(`/y-thuc/bao-ph/${id}/khoi-phuc`);
  for (const k of KHOA_BAO_PH) invalidate(k);
};

/**
 * BÁO PH (UI-CV-TVV, mockup `thiet-ke/v5/tvv.html` panelBph; C15, T10, T15, T16, T21, T22) — TVV ghi kết quả báo phụ huynh sau lần xử lý vi phạm.
 * Bối cảnh chỉ đọc (lần xử lý · nội dung GVCN · PH + SĐT bấm gọi) · form 3 trường (Kết quả · Ngày · Ghi chú, nháp theo việc) · Lịch sử mọi lần ghi.
 * "Chưa liên hệ được" = một lần thử: việc vẫn mở, hạn giữ. Kết thúc ngoại lệ = ⋯ › Bỏ việc (lý do sẵn có). Lưu / Lưu · việc tiếp › — chỉ sang việc kế sau khi lưu xong.
 */
export function PanelBaoPhTvv({ it, onDong, onDaLam, onTiep, tenTiep }: {
  it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null; tenTiep?: string | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const { data: v, error, reload } = useApi<ViecBaoPh>(`/y-thuc/bao-ph/${it.viecId}`, [it.viecId]);
  const [kq, setKq] = useNhap<KetQuaBaoPh | ''>('kq', '');
  const [ngay, setNgay] = useNhap('ngay', hn);
  const [ghiChu, setGhiChu] = useNhap('ghi-chu', '');
  const xoaNhap = useXoaNhap();
  const [tt, setTt] = useState<TtLuu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState<{ kq: KetQuaBaoPh; luc: string; lan: number } | null>(null);
  const [bo, setBo] = useState(false);
  const [dangKp, setDangKp] = useState(false);
  const toast = useToast();
  const lf = useLoiForm();

  const em = { id: it.studentId!, ten: it.studentName };
  const tieuDe = t('Báo PH · {ten}', { ten: it.studentName });
  const han = v?.han ?? it.due;
  const xong = v?.trangThai === 'xong' || daLuu?.kq === 'da_bao';
  const dau = dauViec({
    han: v?.coTheGhi && !bo ? <MenuDong nhan={t('Thao tác phụ')} muc={[{ key: 'bo', nhan: t('Bỏ việc…'), onChon: () => setBo(true) }]} /> : null,
    em, lop: it.classCode,
    ngCanh: han ? <><b className="font-semibold text-slate-100">{t('hạn 23:59 {ngay}', { ngay: shortDate(han, hn) })}</b>
      {' '}({xong ? t('đã xong') : han >= hn ? t('còn {n} ngày', { n: daysBetween(hn, han) }) : t('quá hạn')})</> : null,
  });
  if (error) return <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (!v) return <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong}><div className="pt-3"><Skeleton rows={6} /></div></KhungPanel>;

  const sua = !daLuu && v.coTheGhi;
  const daGo = sua && (!!kq || !!ghiChu.trim() || ngay !== hn);
  const loiO = !kq ? [{ khoa: 'kq', nhan: t('Kết quả'), lyDo: t('Chọn kết quả') }] : [];
  const luu = async (): Promise<boolean> => {
    lf.bam();
    if (!kq) return false;
    setTt('dang'); setLoi(null);
    try {
      await api.post('/y-thuc/bao-ph/ghi', { viecIds: [v.id], ketQua: kq, ngay: ngay || hn, ghiChu: ghiChu.trim() || null });
      xoaNhap(); setTt(null);
      setDaLuu({ kq, luc: gioVnNay(), lan: v.lan.filter((l) => l.ketQua === 'chua_lien_he').length + 1 });
      for (const k of KHOA_BAO_PH) invalidate(k);
      reload(); onDaLam();
      return true;
    } catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); return false; }
  };
  const khoiPhuc = async () => {
    setDangKp(true);
    try { await khoiPhucBaoPh(v.id); toast.push('ok', t('Đã khôi phục')); reload(); onDaLam(); }
    catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setDangKp(false); }
  };
  const suaLai = () => { setKq(daLuu?.kq ?? ''); setDaLuu(null); };
  const nutTiep = onTiep && <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{tenTiep ? t('Việc kế: {ten}', { ten: tenTiep }) : t('Việc tiếp ›')}</button>;
  const chan = daLuu ? {
    huy: null,
    trai: <span role="status" className="font-semibold text-done">✓ {daLuu.kq === 'da_bao'
      ? t('Đã lưu {gio} · Việc xong', { gio: daLuu.luc })
      : t('Đã lưu lần thử {n} · việc vẫn mở, hạn giữ {ngay}', { n: daLuu.lan, ngay: shortDate(v.han, hn) })}</span>,
    phu: daLuu.kq === 'da_bao' && v.coTheGhi ? <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={suaLai}>{t('Sửa')}</button>
      : <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>,
    chinh: nutTiep || (daLuu.kq === 'da_bao' ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button> : null),
  } : sua ? {
    huy: null, daSua: daGo, conThieu: lf.conThieu(loiO),
    trai: tt === 'loi' ? <ChuLuu tt="loi" loi={loi} /> : tt === 'dang' ? <ChuLuu tt="dang" /> : <ChuLuu tt="nhap" />,
    /* Việc cuối (không còn việc kế): chỉ "Lưu" là nút chính. */
    phu: tt === 'loi' || !onTiep ? null : <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luu()}>{t('Lưu')}</button>,
    chinh: tt === 'loi'
      ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()}>{t('Thử lại')}</button>
      : <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void (onTiep ? luuRoiTiep(luu, onTiep) : luu())}>{onTiep ? t('Lưu · việc tiếp ›') : t('Lưu')}</button>,
  } : {
    huy: null, trai: <span className="text-slate-400">{v.nhanXuLy ?? (v.trangThai === 'xong' ? t('Việc đã xong · lịch sử giữ khi thu hồi') : v.trangThai === 'bo' ? t('Đã bỏ') : null)}</span>,
    phu: v.khoiPhucDuoc ? <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={dangKp} onClick={() => void khoiPhuc()}>{t('Khôi phục')}</button> : null,
    chinh: <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>,
  };

  const ph = v.lienHe;
  const lichSu = [...v.lan].reverse();
  return (
    <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong} chan={chan}>
      <div className="flex flex-col gap-4 pt-4">
        {v.thuHoiCho && (
          <div role="status" className="flex flex-col gap-1 rounded-lg border border-soon-line bg-soon-bg px-3.5 py-2.5 text-sm">
            <span><b className="text-slate-100">{t('GVCN đang xin thu hồi {nhan}', { nhan: v.nhan })}</b> · {t('chờ QL duyệt.')}</span>
            <span className="text-slate-300">{t('Lần báo PH của bạn vẫn giữ trong lịch sử. Bạn không cần làm gì.')}</span>
          </div>
        )}
        <BoiCanh dong={[
          [t('Lần xử lý'), [v.nhan, v.boiCanh.nguoiLuu && `GVCN ${v.boiCanh.nguoiLuu}`, v.boiCanh.luuLuc && t('lưu {luc}', { luc: lucVn(v.boiCanh.luuLuc) })].filter(Boolean).join(' · ')],
          [t('Nội dung GVCN'), v.boiCanh.noiDung && <div className="border-l-2 pl-3 font-normal" style={{ borderColor: 'var(--line-strong)' }}>{v.boiCanh.noiDung}</div>],
          [t('Phụ huynh'), (ph.ten || ph.sdt) && (
            <span className="flex flex-wrap items-center gap-2">
              {ph.ten && <span>{ph.ten}{ph.quanHe ? ` (${ph.quanHe})` : ''}</span>}
              {ph.sdt && <a className="btn btn-sm min-h-[44px] tabular-nums no-underline sm:min-h-[32px]" href={`tel:${ph.sdt.replace(/\D/g, '')}`} aria-label={t('Gọi {ten} {sdt}', { ten: ph.ten ?? t('phụ huynh'), sdt: sdtDoc(ph.sdt) })}>
                <span aria-hidden>📞</span> {sdtDoc(ph.sdt)}</a>}
            </span>
          )],
        ]} />
        {bo && <BoViec id={v.id} onDong={() => setBo(false)} onDaBo={() => {
          setBo(false); xoaNhap(); reload(); onDaLam();
          toast.hoanTac(t('Đã bỏ việc này'), () => {
            khoiPhucBaoPh(v.id).then(() => { reload(); onDaLam(); }, (e: any) => toast.push('error', e?.message ?? t('Không lưu được')));
          }, { key: `bao-ph-bo:${v.id}` });
        }} />}
        {sua && !bo && (
          <>
            <Truong nhan={t('Kết quả')} as="div" loi={lf.loiCua(loiO, 'kq')}>
              <div {...lf.o(loiO, 'kq')} tabIndex={-1} className="outline-none"><LuaChonRadio ten={`bao-ph-kq-${v.id}`} nhan={t('Kết quả')} value={kq || null} muc={[['da_bao', t('Đã báo PH')], ['chua_lien_he', t('Chưa liên hệ được')]]}
                onChange={(k) => { setKq(k); if (tt === 'loi') setTt(null); }} /></div>
            </Truong>
            <Truong nhan={t('Ngày')}><div className="max-w-[220px]"><ONgay kieu="ngay" value={ngay} onChange={setNgay} toiDa={hn} /></div></Truong>
            <Truong nhan={t('Ghi chú kết quả')}>
              <textarea className="field w-full" rows={3} maxLength={2000} autoComplete="off" value={ghiChu} placeholder={t('PH nói gì, hẹn gì')} onChange={(e) => setGhiChu(e.target.value)} />
            </Truong>
          </>
        )}
        <details className="border-t pt-3" style={{ borderColor: 'var(--line)' }} open={lichSu.length > 0}>
          <summary className="cursor-pointer text-sm font-semibold text-slate-400">{t('Lịch sử ({n})', { n: lichSu.length })}</summary>
          {lichSu.length ? (
            <ul className="m-0 mt-2 list-none space-y-2 p-0 text-[13px]">
              {lichSu.map((l, i) => (
                <li key={i} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3">
                  <span className="tabular-nums text-slate-400">{lucVn(l.luc)}</span>
                  <span className="min-w-0 break-words text-slate-300"><b className="text-slate-100">{l.nhan}</b>{l.nguoi ? ` · ${l.nguoi}` : ''}
                    {l.ngay !== l.luc.slice(0, 10) && ` · ${t('ngày {ngay}', { ngay: shortDate(l.ngay, hn) })}`}{l.ghiChu && <><br />{l.ghiChu}</>}</span>
                </li>
              ))}
            </ul>
          ) : <p className="m-0 pt-2 text-[13px] text-slate-500">{t('Chưa có lần ghi nào.')}</p>}
        </details>
      </div>
    </KhungPanel>
  );
}

/** ⋯ › Bỏ việc (kết thúc ngoại lệ, `06` điểm 6): lý do bỏ sẵn có, "Khác" bắt ghi rõ. */
function BoViec({ id, onDong, onDaBo }: { id: number; onDong: () => void; onDaBo: () => void }) {
  const [lyDo, setLyDo] = useState('');
  const [chu, setChu] = useState('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const loiGhiRo = reasonNeedsText(lyDo) ? kiemGhiRoKhac(chu) : null;
  const gui = async () => {
    if (!lyDo || loiGhiRo) return;
    setBusy(true); setLoi(null);
    try {
      await api.post(`/y-thuc/bao-ph/${id}/bo`, { lyDo, lyDoKhac: reasonNeedsText(lyDo) ? chu.trim() : undefined });
      for (const k of KHOA_BAO_PH) invalidate(k);
      onDaBo();
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-2 rounded-lg p-3" style={{ background: 'var(--surface-2)' }} role="group" aria-label={t('Bỏ việc')}>
      <b className="text-sm text-slate-100">{t('Bỏ việc · chọn lý do')}</b>
      <div className="flex flex-wrap gap-1.5">
        {COORDINATION_USER_REMOVE_REASONS.map((r) => <NutChon key={r} nho chon={lyDo === r} onClick={() => setLyDo(r)}>{COORDINATION_REMOVE_REASON_LABEL[r]}</NutChon>)}
      </div>
      <OKhac hien={reasonNeedsText(lyDo)} value={chu} onChange={setChu} loi={loiGhiRo} />
      {loi && <p role="alert" className="m-0 text-[13px] text-bad">⚠ {loi}</p>}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onDong} disabled={busy}>{t('Ở lại')}</button>
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !lyDo || !!loiGhiRo} onClick={() => void gui()}>{t('Bỏ việc này')}</button>
      </div>
    </div>
  );
}

/**
 * NHÓM NÚT RADIO (mockup V5 `.lua-chon`, bảng mẫu mục 7): radio thật (↑ ↓ đổi), mục chọn viền + nền nhấn; `disabled` = bước chưa mở.
 * Dùng chung panel Báo PH (Kết quả) và Sau thi (Bước tiếp, Lớp).
 */
export function LuaChonRadio<K extends string>({ ten, nhan, muc, value, onChange, disabled }: {
  ten: string; nhan: string; muc: readonly (readonly [K, string])[]; value: K | null; onChange: (k: K) => void; disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={nhan}>
      {muc.map(([k, chu]) => (
        <label key={k} className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm max-sm:min-h-[44px] ${disabled ? 'cursor-default' : 'cursor-pointer'} ${value === k ? 'font-semibold text-[color:var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]' : ''}`}
          style={value === k ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : { borderColor: 'var(--o-nhap-vien)' }}>
          <input type="radio" name={ten} checked={value === k} disabled={disabled} onChange={() => onChange(k)} className="accent-[color:var(--accent)]" />{chu}
        </label>
      ))}
    </div>
  );
}
