import { useState, type ReactNode } from 'react';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * KHUÔN PANEL LÀM VIỆC v3 (OV-12c, mockup `thiet-ke/mockup-ov12-panel-v3-2026-10-14.html` §1) — phần dùng chung đặt trong `KhungPanel`:
 *   (ChipHan — chip hạn ở đầu panel — nằm ở `ui/Nhan.tsx` cùng các chip khác.)
 *   CanLam    Khối "Cần làm" — khối DUY NHẤT có màu (nền accent-soft + vạch trái 3 px); chứa đúng ô cần điền + một nút chính.
 *   BoiCanh   ≤ 3 dòng nhãn – giá trị (Nguyên nhân · Phương án · Kết quả gần nhất); "Xem thêm" mở ngay dưới, không chuyển trang.
 * Đầu panel 2 dòng = `KhungPanel dau`. Chân = `KhungPanel chan` (dòng trạng thái + nút chính dính đáy ở 375).
 */
export function CanLam({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[4px_10px_10px_4px] py-4 pl-[19px] pr-4 max-sm:py-3.5 max-sm:pl-[15px] max-sm:pr-3"
      style={{ background: 'var(--accent-soft)', boxShadow: 'inset 3px 0 0 var(--accent)' }}>
      {children}
    </div>
  );
}

export function BoiCanh({ dong, them }: { dong: [string, ReactNode][]; them?: ReactNode }) {
  const [mo, setMo] = useState(false);
  const co = dong.filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (!co.length && !them) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <dl className="m-0 grid grid-cols-[132px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px] max-sm:grid-cols-1 max-sm:gap-y-0.5">
        {co.map(([nhan, gt]) => (
          <div key={nhan} className="contents">
            <dt className="text-slate-500">{nhan}</dt>
            <dd className="m-0 text-slate-400 max-sm:mb-1.5">{gt}</dd>
          </div>
        ))}
      </dl>
      {them && (
        <>
          <button type="button" aria-expanded={mo} onClick={() => setMo(!mo)}
            className="inline-flex min-h-[32px] w-fit appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-[color:var(--accent)] max-sm:min-h-[44px]">
            {mo ? t('Thu gọn') : t('Xem thêm')}
          </button>
          {mo && <div className="text-[13px] text-slate-400">{them}</div>}
        </>
      )}
    </div>
  );
}

/** Nhóm nguyên nhân có số thứ tự (1 = chính): "1 Kỹ năng làm bài · 2 Quản lý thời gian". */
export function NhomCoSo({ ds }: { ds: { code: string; label: string }[] }) {
  return <>{ds.map((x, i) => <span key={x.code}>{i > 0 && ' · '}<b className="font-semibold text-slate-300">{i + 1}</b> {dich(x.label)}</span>)}</>;
}
