import { useEffect, useRef, useState } from 'react';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import type { NguoiChon } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { MenuDong } from '../../ui/MenuDong.tsx';

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
 * Menu ba mục = `MenuDong` (GD-4c: một menu thả — phím ↑/↓/Home/End/Enter/Esc/Tab, focus về nút). Ô chọn GV: Esc bắt ở pha bắt
 * + chặn lan — chỉ đóng ô chọn, không đóng panel chứa nó. "Chọn giáo viên…" mở `ChonNguoi` có sẵn danh sách (không bắt gõ trước);
 * chỉ tài khoản — ngoại lệ T14 của bộ lọc. `chiChonGv`: nút mở thẳng ô chọn GV (không menu).
 */
export function ChonPhuTrach({ value, valueName, onChange, chiChonGv }: {
  value: NguoiPhuTrach;
  /** PR-DUYET (K1-29): "Của tôi · Của GV" đã là công tắc riêng — ô này chỉ còn việc chọn MỘT giáo viên cụ thể. */
  chiChonGv?: boolean;
  /** Tên giáo viên đang chọn — nơi gọi luôn biết (danh sách việc đã nạp); OV6-DOC-CHON bỏ lượt tra cả `/ref/users` (không bao giờ chạy). */
  valueName?: string | null;
  onChange: (v: NguoiPhuTrach, name?: string | null) => void;
}) {
  /** Ô chọn GV đang mở. */
  const [picking, setPicking] = useState(false);
  const [ten, setTen] = useState<string | null>(valueName ?? null);
  const box = useRef<HTMLDivElement>(null);
  const dongVeNut = () => { setPicking(false); box.current?.querySelector<HTMLElement>('button[aria-haspopup]')?.focus(); };

  useEffect(() => { setTen(valueName ?? null); }, [valueName]);

  useBamNgoai(picking, () => setPicking(false), box);
  useEffect(() => {
    if (!picking) return;
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation(); e.preventDefault();
      dongVeNut();
    };
    document.addEventListener('keydown', phim, true);
    return () => document.removeEventListener('keydown', phim, true);
  }, [picking]); // eslint-disable-line react-hooks/exhaustive-deps

  const nhan = chiChonGv ? (typeof value === 'number' ? (ten ?? '…') : t('Một GV'))
    : value === 'toi' ? t('Tôi') : value === 'tat-ca' ? t('Tất cả trong phạm vi') : (ten ?? '…');
  const muc = [
    { key: 'toi', nhan: t('Tôi'), onChon: () => onChange('toi') },
    { key: 'tat-ca', nhan: t('Tất cả trong phạm vi'), onChon: () => onChange('tat-ca') },
    { key: 'chon-gv', nhan: t('Chọn giáo viên…'), onChon: () => setPicking(true) },
  ];

  return (
    <div className={`relative inline-flex items-center gap-1 ${chiChonGv ? 'max-sm:w-full' : ''}`} ref={box}>
      {chiChonGv ? (
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0 h-8 justify-between gap-2 px-3 text-[13px] font-semibold max-sm:w-full max-sm:text-base" aria-haspopup="menu" aria-expanded={picking}
          aria-label={`${t('Xem việc của')}: ${nhan}`} onClick={() => setPicking((o) => !o)}>
          {/* V8-CV (mockup "Một GV ▾"): ô chọn GV chỉ ghi giá trị; nhãn đầy đủ ở aria-label. */}
          {nhan}
          {/* ▾ ở chữ Inter 12px chỉ còn một chấm → vẽ SVG nét mảnh. */}
          <svg aria-hidden width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l3 3 3-3" /></svg>
        </button>
      ) : <MenuDong chu={`${t('Người phụ trách')}: ${nhan}`} lopNut="btn btn-sm min-h-[44px] sm:min-h-0" muc={muc} />}
      {typeof value === 'number' && (
        <button type="button" className="min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-200 text-xs sm:min-h-0 sm:min-w-0" aria-label={t('Bỏ chọn giáo viên, về Tất cả trong phạm vi')}
          onClick={() => onChange('tat-ca')}>✕</button>
      )}
      {picking && (
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
