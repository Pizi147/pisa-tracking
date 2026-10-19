import { useEffect, useRef, useState } from 'react';
import {
  KIEU_KHOANG, NHAN_KIEU_KHOANG, addDaysIso, khoangMacDinh, khoangThang, loiKhoang, nhanKhoang,
  type KhoangNgay, type KieuKhoang,
} from '@shared/domain/index.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { BoLocDoan } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * BỘ CHỌN THỜI GIAN CHUNG (OV-15e, C29, mockup 3 mục 3) — một nút "Khoảng thời gian · W1 + W2 OCT/2026 · 28/09 – 11/10/2026" mở hộp nhỏ ngay dưới:
 * `2 tuần vừa qua · Theo tuần · Theo tháng · Tùy chọn` → ô Từ / Đến (ô gõ + nút lịch, `ONgay`) → dòng xem trước → Huỷ · Áp dụng. Esc / bấm ra ngoài = Huỷ.
 */
export function BoChonThoiGian({ khoang, onChange }: { khoang: KhoangNgay; onChange: (k: KhoangNgay) => void }) {
  const { homNay } = useNgayNghiepVu();
  const [mo, setMo] = useState(false);
  const [nhap, setNhap] = useState<KhoangNgay>(khoang);
  const hop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mo) return;
    setNhap(khoang);
    hop.current?.querySelector<HTMLElement>('[role="dialog"] button')?.focus();   // bàn phím vào thẳng hộp
  }, [mo]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mo) return;
    const dong = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !hop.current?.contains(e.target as Node)) setMo(false);
    };
    document.addEventListener('mousedown', dong);
    document.addEventListener('keydown', dong);
    return () => { document.removeEventListener('mousedown', dong); document.removeEventListener('keydown', dong); };
  }, [mo]);

  const nhan = nhanKhoang(khoang);
  const doiKieu = (k: KieuKhoang) => {
    if (k === '2-tuan') return setNhap(khoangMacDinh(homNay));
    if (k === 'thang') return setNhap({ kieu: k, ...(khoangThang(nhap.den.slice(0, 7)) ?? khoangMacDinh(homNay)) });
    setNhap({ ...nhap, kieu: k });
  };
  const loi = loiKhoang(nhap);
  const xem = loi ? null : nhanKhoang(nhap);
  const apDung = () => { if (!loi) { onChange(nhap); setMo(false); } };

  return (
    <div ref={hop} className="relative" data-hd="pt-thoi-gian">
      <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)}
        className="field flex min-h-[44px] cursor-pointer items-baseline gap-2 text-left sm:min-h-[34px]">
        <span className="text-xs text-slate-400">{t('Khoảng thời gian')}</span>
        <b className="font-semibold tabular-nums text-slate-100">{nhan.chinh}</b>
        <span className="hidden text-xs tabular-nums text-slate-400 lg:inline">{nhan.phu}</span>
        <span aria-hidden className="text-slate-500">▾</span>
      </button>
      {mo && (
        <div role="dialog" aria-label={t('Khoảng thời gian')}
          className="absolute left-0 top-[calc(100%+6px)] z-40 flex w-[min(360px,calc(100vw-32px))] flex-col gap-3 rounded-lg border p-3 shadow-lg"
          style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
          <BoLocDoan<KieuKhoang> ariaLabel={t('Kiểu khoảng')} value={nhap.kieu} onChange={doiKieu}
            muc={KIEU_KHOANG.map((k) => ({ key: k, nhan: NHAN_KIEU_KHOANG[k] }))} />
          {nhap.kieu === 'tuan' && (
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <label className="flex flex-col gap-1">{t('Từ tuần')}
                <ONgay kieu="tuan" gon value={nhap.tu} ariaLabel={t('Từ tuần')} onChange={(v) => v && setNhap({ ...nhap, tu: v })} /></label>
              <label className="flex flex-col gap-1">{t('Đến tuần')}
                <ONgay kieu="tuan" gon value={addDaysIso(nhap.den, -6)} ariaLabel={t('Đến tuần')} onChange={(v) => v && setNhap({ ...nhap, den: addDaysIso(v, 6) })} /></label>
            </div>
          )}
          {nhap.kieu === 'thang' && (
            <label className="flex flex-col gap-1 text-xs text-slate-400">{t('Tháng')}
              <ONgay kieu="thang" gon value={nhap.den.slice(0, 7)} ariaLabel={t('Tháng')}
                onChange={(v) => { const k = v ? khoangThang(v) : null; if (k) setNhap({ kieu: 'thang', ...k }); }} /></label>
          )}
          {nhap.kieu === 'tuy-chon' && (
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <label className="flex flex-col gap-1">{t('Từ ngày')}
                <ONgay kieu="ngay" gon value={nhap.tu} ariaLabel={t('Từ ngày')} onChange={(v) => v && setNhap({ ...nhap, tu: v })} /></label>
              <label className="flex flex-col gap-1">{t('Đến ngày')}
                <ONgay kieu="ngay" gon value={nhap.den} ariaLabel={t('Đến ngày')} onChange={(v) => v && setNhap({ ...nhap, den: v })} /></label>
            </div>
          )}
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
