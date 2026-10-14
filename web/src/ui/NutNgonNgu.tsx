import { NGON_NGU, t, type NgonNgu } from '@shared/i18n/index.ts';
import { doiNgonNgu } from '../lib/ngonNgu.ts';

/**
 * NÚT VI | EN (PR-EN, chủ SP 07/10 — mockup `thiet-ke/mockup-en-2026-10-07.html` mục 1–2). Bấm: lưu máy + tài khoản, tải lại trang.
 *   `nut`  thanh trên máy tính, ngay sau ◐ — chữ nhỏ 11,5 px, cao bằng `btn-sm`.
 *   `menu` điện thoại: hàng "Ngôn ngữ · VI | EN" trong menu Tài khoản, ngay trên hàng Giao diện (cùng khung `CongTacGiaoDien kieu="menu"`).
 *   `to`   màn đăng nhập: hai nút to "Tiếng Việt | English" — mỗi nút ghi bằng chính tiếng của nó.
 */
export function NutNgonNgu({ kieu = 'nut', daDangNhap = true }: { kieu?: 'nut' | 'menu' | 'to'; daDangNhap?: boolean }) {
  const chon = (nn: NgonNgu) => () => { void doiNgonNgu(nn, daDangNhap); };
  const nut = (nn: NgonNgu, chu: string, lop: string, ten?: string) => (
    <button key={nn} type="button" aria-pressed={NGON_NGU === nn} onClick={chon(nn)} lang={nn} title={ten}
      className={`${lop} border-0 ${NGON_NGU === nn ? 'bg-[color:var(--accent-soft)] font-semibold text-[color:var(--accent)]' : 'bg-transparent text-slate-400'}`}>{chu}</button>
  );
  if (kieu === 'to') {
    return (
      <div role="group" aria-label="Ngôn ngữ / Language" className="grid grid-cols-2 gap-2.5">
        {([['vi', 'Tiếng Việt'], ['en', 'English']] as const).map(([nn, chu]) => (
          <button key={nn} type="button" aria-pressed={NGON_NGU === nn} onClick={chon(nn)} lang={nn}
            className={`min-h-[56px] rounded-[10px] border text-[17px] font-semibold ${NGON_NGU === nn
              ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]'
              : 'border-[color:var(--line-strong)] bg-[color:var(--surface)] text-slate-200'}`}>{chu}</button>
        ))}
      </div>
    );
  }
  if (kieu === 'menu') {
    return (
      <div className="flex min-h-[44px] items-center justify-between gap-3 px-1">
        <span className="text-sm text-slate-300" id="nhan-ngon-ngu">{t('Ngôn ngữ')}</span>
        <div role="group" aria-labelledby="nhan-ngon-ngu" className="inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
          {nut('vi', 'VI', 'min-h-[44px] min-w-[64px] px-4 text-[12.5px]', 'Tiếng Việt')}
          {nut('en', 'EN', 'min-h-[44px] min-w-[64px] px-4 text-[12.5px]', 'English')}
        </div>
      </div>
    );
  }
  return (
    <div role="group" aria-label={t('Ngôn ngữ')} className="inline-flex shrink-0 overflow-hidden rounded-[.4rem] border" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface-2)' }}>
      {nut('vi', 'VI', 'min-h-[30px] px-2 text-[11.5px] tracking-wide', 'Tiếng Việt')}
      <span aria-hidden className="w-px" style={{ background: 'var(--line-strong)' }} />
      {nut('en', 'EN', 'min-h-[30px] px-2 text-[11.5px] tracking-wide', 'English')}
    </div>
  );
}
