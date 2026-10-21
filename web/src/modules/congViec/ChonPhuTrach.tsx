import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.ts';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { buocDanhSach, type NguoiChon } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';

export type NguoiPhuTrach = 'toi' | 'tat-ca' | number;

/**
 * Ô CHỌN NGƯỜI PHỤ TRÁCH của tab Hỗ trợ học viên (PR-Ra Q1–Q2) — chỉ hiện với QL/QT
 * (`xemNguoiKhac`), GV luôn chỉ xem việc của mình nên không có ô này.
 *
 *   Tôi                  như GV — chỉ việc của chính người xem
 *   Tất cả trong phạm vi  mặc định của QL/QT — việc của mọi người trong phạm vi (Q1)
 *   Chọn giáo viên…       mở `ChonNguoi` (chỉ người trong phạm vi, Q2) — máy chủ dựng lại
 *                         đúng như người đó nhìn thấy rồi lọc theo phạm vi người xem
 *
 * Bàn phím (PR-NEN T14, như `MenuDong`): mở → focus mục đầu; ↑/↓/Home/End đi vòng; Enter chọn; Esc/Tab đóng và trả focus
 * về nút. Esc bắt ở pha bắt + chặn lan — chỉ đóng menu/ô chọn, không đóng panel chứa nó. "Chọn giáo viên…" mở `ChonNguoi`
 * có sẵn danh sách (không bắt gõ trước); chỉ tài khoản — ngoại lệ T14 của bộ lọc.
 */
export function ChonPhuTrach({ value, valueName, onChange, chiChonGv }: {
  value: NguoiPhuTrach;
  /** PR-DUYET (K1-29): "Của tôi · Của GV" đã là công tắc riêng — ô này chỉ còn việc chọn MỘT giáo viên cụ thể. */
  chiChonGv?: boolean;
  /** Tên giáo viên đã biết trước (ví dụ vừa chọn từ ô tìm) — tránh phải tra lại. */
  valueName?: string | null;
  onChange: (v: NguoiPhuTrach, name?: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [ten, setTen] = useState<string | null>(valueName ?? null);
  const box = useRef<HTMLDivElement>(null);
  const nut = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [dang, setDang] = useState(0);
  const tro = (i: number) => { setDang(i); menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')[i]?.focus(); };
  const dongVeNut = () => { setOpen(false); setPicking(false); nut.current?.focus(); };

  useEffect(() => { setTen(valueName ?? null); }, [valueName]);

  /* Chỉ có ID trên địa chỉ (mở link trực tiếp `?nguoi=12`) thì tra tên một lượt. */
  useEffect(() => {
    if (typeof value !== 'number' || ten) return;
    let huy = false;
    api.get<{ id: number; fullName: string }[]>('/ref/users')
      .then((rows) => { if (!huy) { const r = rows.find((x) => x.id === value); if (r) setTen(r.fullName); } })
      .catch(() => {});
    return () => { huy = true; };
  }, [value, ten]);

  useBamNgoai(open, () => { setOpen(false); setPicking(false); }, box);
  useEffect(() => {
    if (!open) return;
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation(); e.preventDefault();
      dongVeNut();
    };
    document.addEventListener('keydown', phim, true);
    return () => document.removeEventListener('keydown', phim, true);
  }, [open]);

  /* Menu vừa mở (chưa vào ô chọn) → focus mục đầu. */
  useEffect(() => { if (open && !picking) tro(0); }, [open, picking]); // eslint-disable-line react-hooks/exhaustive-deps

  const nhan = chiChonGv ? (typeof value === 'number' ? (ten ?? '…') : t('một GV…'))
    : value === 'toi' ? t('Tôi') : value === 'tat-ca' ? t('Tất cả trong phạm vi') : (ten ?? '…');
  const muc = [
    { nhan: t('Tôi'), chon: () => { onChange('toi'); dongVeNut(); } },
    { nhan: t('Tất cả trong phạm vi'), chon: () => { onChange('tat-ca'); dongVeNut(); } },
    { nhan: t('Chọn giáo viên…'), chon: () => setPicking(true) },
  ];

  return (
    <div className="relative inline-flex items-center gap-1" ref={box}>
      <button ref={nut} type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-haspopup="menu" aria-expanded={open}
        onClick={() => { setOpen((o) => !o); setPicking(!!chiChonGv); }}>
        {chiChonGv ? t('Xem việc của') : t('Người phụ trách')}: {nhan}
        {/* ▾ ở chữ Inter 12px chỉ còn một chấm → vẽ SVG nét mảnh. */}
        <svg aria-hidden width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l3 3 3-3" /></svg>
      </button>
      {typeof value === 'number' && (
        <button type="button" className="min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-200 text-xs sm:min-h-0 sm:min-w-0" aria-label={t('Bỏ chọn giáo viên, về Tất cả trong phạm vi')}
          onClick={() => onChange('tat-ca')}>✕</button>
      )}
      {open && !picking && (
        <div ref={menu} role="menu" aria-label={t('Người phụ trách')}
          onKeyDown={(e) => {
            const k = buocDanhSach(muc.length, dang, e.key);
            if (k !== null) { e.preventDefault(); tro(k); }
            else if (e.key === 'Tab') { e.preventDefault(); dongVeNut(); }
          }}
          className="absolute z-30 top-full mt-1 w-56 surface-2 rounded-lg border shadow-xl py-1" style={{ borderColor: 'var(--line-strong)' }}>
          {muc.map((m, i) => (
            <button key={dich(m.nhan)} type="button" role="menuitem" tabIndex={-1} onFocus={() => setDang(i)}
              className="w-full min-h-[44px] sm:min-h-0 text-left px-3 py-2 bam focus-visible:bg-white/5 appearance-none bg-transparent border-0 text-sm text-slate-100"
              onClick={m.chon}>{dich(m.nhan)}</button>
          ))}
        </div>
      )}
      {open && picking && (
        <div className="absolute z-30 top-full mt-1 w-72">
          <ChonNguoi
            value={null}
            onChange={(v: NguoiChon | null) => {
              if (v?.kieu === 'tai_khoan') { onChange(v.id, v.ten); setTen(v.ten); }
              dongVeNut();
            }}
            nhom="giao_vien" choToi={false} choNgoai={false}
            ariaLabel={t('Chọn giáo viên')} tuMo
          />
        </div>
      )}
    </div>
  );
}
