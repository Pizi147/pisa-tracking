import { useEffect, useRef, useState } from 'react';
import { addDaysIso, khoangTuUrl, khoangVeTuan, loiKhoang, nhanKhoang, type KhoangNgay } from '@shared/domain/index.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * BỘ CHỌN THỜI GIAN CHUNG (OV-15e, C29, mockup 3 mục 3) — một nút "Khoảng thời gian · W1 + W2 OCT/2026 · 28/09 – 11/10/2026" mở hộp nhỏ ngay dưới:
 * hai ô Từ tuần – Đến tuần (ô gõ + nút lịch, `ONgay`) → dòng xem trước → Đóng · Áp dụng. Esc / bấm ra ngoài = Đóng.
 * SL1 (A5-01): bỏ ba kiểu "2 tuần vừa qua · Theo tháng · Tùy chọn" — link cũ vẫn đọc (`khoangTuUrl`), mở hộp thì về khoảng tuần (`khoangVeTuan`).
 * UI-PHAN-TICH (P9): hai lựa chọn "Toàn bộ" · "Chọn khoảng tuần" (tự do, không trần); ‹ › hai bên dời cả khoảng 1 tuần (mockup `phan-tich.html`).
 */
export function BoChonThoiGian({ khoang, onChange }: { khoang: KhoangNgay; onChange: (k: KhoangNgay) => void }) {
  const { homNay } = useNgayNghiepVu();
  const [mo, setMo] = useState(false);
  const [nhap, setNhap] = useState<KhoangNgay>(khoang);
  const toanBo = (): KhoangNgay => khoangTuUrl({ get: (k) => (k === 'kieu' ? 'toan-bo' : null) }, homNay);
  const laTb = nhap.kieu === 'toan-bo';
  const hop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mo) return;
    setNhap(khoang.kieu === 'toan-bo' ? khoang : khoangVeTuan(khoang, homNay));
    hop.current?.querySelector<HTMLElement>('[role="dialog"] input')?.focus();   // bàn phím vào thẳng hộp
  }, [mo]); // eslint-disable-line react-hooks/exhaustive-deps
  /* KHUNG-LOI (12.7, V3B-09): bấm trong lịch `LichNho` (portal) KHÔNG đóng hộp — trước đây đóng hộp, tuần không đổi. */
  const bamNgoai = useBamNgoai(mo, () => setMo(false), hop);
  useEffect(() => {
    if (!mo) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMo(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [mo]);

  const nhan = nhanKhoang(khoang);
  const loi = laTb ? null : loiKhoang(nhap);
  const xem = loi ? null : nhanKhoang(nhap);
  const apDung = () => { if (!loi) { onChange(laTb ? nhap : khoangVeTuan(nhap, homNay)); setMo(false); } };
  /* ‹ › : dời cả khoảng một tuần (khoảng tuần); "Toàn bộ" không dời. */
  const doi = (n: number) => onChange(khoangVeTuan({ tu: addDaysIso(khoang.tu, 7 * n), den: addDaysIso(khoang.den, 7 * n) }, homNay));
  const nutDoi = 'field min-h-[44px] min-w-[44px] cursor-pointer px-2 text-slate-300 disabled:cursor-default disabled:opacity-40 sm:min-h-[34px] sm:min-w-[34px]';

  return (
    <div ref={hop} className="relative flex items-stretch gap-1" data-hd="pt-thoi-gian" {...bamNgoai}>
      <button type="button" className={nutDoi} aria-label={t('Lùi 1 tuần')} disabled={khoang.kieu === 'toan-bo'} onClick={() => doi(-1)}>‹</button>
      <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)}
        className="field flex min-h-[44px] cursor-pointer items-baseline gap-2 text-left sm:min-h-[34px]">
        <span className="text-xs text-slate-400">{t('Khoảng thời gian')}</span>
        <b className="font-semibold tabular-nums text-slate-100">{nhan.chinh}</b>
        <span className="hidden text-xs tabular-nums text-slate-400 lg:inline">{nhan.phu}</span>
        <span aria-hidden className="text-slate-500">▾</span>
      </button>
      <button type="button" className={nutDoi} aria-label={t('Tới 1 tuần')} disabled={khoang.kieu === 'toan-bo'} onClick={() => doi(1)}>›</button>
      {mo && (
        <div role="dialog" aria-label={t('Khoảng thời gian')}
          className="absolute left-0 top-[calc(100%+6px)] z-40 flex w-[min(360px,calc(100vw-32px))] flex-col gap-3 rounded-lg border p-3 shadow-lg"
          style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
          <span role="group" aria-label={t('Khoảng thời gian')} className="inline-flex self-start overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
            {([[true, t('Toàn bộ')], [false, t('Chọn khoảng tuần')]] as const).map(([tb, nhan]) => (
              <button key={nhan} type="button" aria-pressed={laTb === tb}
                onClick={() => setNhap(tb ? toanBo() : khoangVeTuan(khoang.kieu === 'toan-bo' ? { tu: addDaysIso(nhap.den, -13), den: nhap.den } : khoang, homNay))}
                className={`min-h-[44px] px-3 text-sm sm:min-h-[32px] ${laTb === tb ? 'bg-[color:var(--accent-soft)] font-bold text-[color:var(--accent)]' : 'text-slate-400'}`}>{nhan}</button>
            ))}
          </span>
          {!laTb && <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <label className="flex flex-col gap-1">{t('Từ tuần')}
              <ONgay kieu="tuan" gon value={nhap.tu} ariaLabel={t('Từ tuần')} onChange={(v) => v && setNhap({ ...nhap, tu: v })} /></label>
            <label className="flex flex-col gap-1">{t('Đến tuần')}
              <ONgay kieu="tuan" gon value={addDaysIso(nhap.den, -6)} ariaLabel={t('Đến tuần')} onChange={(v) => v && setNhap({ ...nhap, den: addDaysIso(v, 6) })} /></label>
          </div>}
          <p className={`m-0 text-xs tabular-nums ${loi ? 'font-semibold text-bad' : 'text-slate-300'}`} role={loi ? 'alert' : undefined}>
            {loi ? `⚠ ${loi}` : `${xem!.chinh} · ${xem!.phu}`}
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMo(false)}>{t('Đóng')}</button>
            <button type="button" className="btn btn-primary btn-sm min-h-[44px] sm:min-h-0" disabled={!!loi} onClick={apDung}>{t('Áp dụng')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
