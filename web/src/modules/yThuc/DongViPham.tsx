import { useId, useState } from 'react';
import { ChuDich } from '../../ui/ChuDich.tsx';
import { t } from '@shared/i18n/index.ts';
import { ChipMon } from './BangLan.tsx';

type ViPhamDoc = { id: number; ten: string; moTa: string; nhom?: string };

/**
 * VI-PHAM-MO (chủ SP 21/11): tên + mô tả MỘT vi phạm kèm nút Dịch cho từng chữ (`ChuDich`, nguồn `violations`: `ten` · `mo_ta`).
 * Dùng chung: dòng vi phạm mở tại chỗ (`DongViPham`) và chi tiết vi phạm (`ChiTietViPham`).
 */
export function MoTaViPham({ v }: { v: ViPhamDoc }) {
  return (
    <dl className="m-0 grid grid-cols-1 gap-y-0.5 text-sm sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-x-3 sm:gap-y-1">
      {/* Chữ rỗng (dữ liệu thật có dòng tên / mô tả rỗng sau tachTenMoTa): không vẽ nút Dịch — máy chủ sẽ trả "Không có chữ để dịch". */}
      {v.ten.trim() && <><dt className="text-xs leading-5 text-slate-500">{t('Vi phạm')}</dt>
      <dd className="m-0 mb-1.5 min-w-0 whitespace-pre-wrap break-words text-slate-100 sm:mb-0"><ChuDich chu={v.ten} nguon={{ bang: 'violations', id: v.id, cot: 'ten' }} /></dd></>}
      {v.nhom && <><dt className="text-xs leading-5 text-slate-500">{t('Nhóm')}</dt><dd className="m-0 mb-1.5 min-w-0 text-slate-300 sm:mb-0">{v.nhom}</dd></>}
      <dt className="text-xs leading-5 text-slate-500">{t('Mô tả')}</dt>
      <dd className="m-0 min-w-0 whitespace-pre-wrap break-words text-slate-200">
        {v.moTa.trim() ? <ChuDich chu={v.moTa} nguon={{ bang: 'violations', id: v.id, cot: 'mo_ta' }} /> : <span className="text-slate-500">{t('Không có mô tả thêm')}</span>}
      </dd>
    </dl>
  );
}

/**
 * Dòng vi phạm chỉ đọc, MỞ TẠI CHỖ (ngày · chip môn · tên): bấm tên mở mô tả ngay dưới dòng, bấm lại thu. Không request thêm — mô tả đã nạp cùng danh sách.
 * `ngay` đã định dạng (mã tuần / dd/mm do nơi gọi chọn). `moSan`: khối chỉ có vài dòng, đọc luôn không cần bấm.
 */
export function DongViPham({ v, ngay, moSan = false }: { v: ViPhamDoc & { skill: string | null }; ngay: string; moSan?: boolean }) {
  const [mo, setMo] = useState(moSan);
  const idChiTiet = useId();
  return (
    <li className="min-w-0">
      <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
        <span className="pt-px tabular-nums text-slate-400 max-sm:pt-3">{ngay}</span>
        <button type="button" aria-expanded={mo} aria-controls={idChiTiet} onClick={() => setMo((x) => !x)}
          className="flex min-w-0 appearance-none items-start gap-1 border-0 bg-transparent p-0 text-left font-[inherit] text-inherit hover:text-[color:var(--accent)] hover:underline max-sm:min-h-[44px] max-sm:items-center">
          <ChipMon skill={v.skill} /><span className="min-w-0 break-words">{v.ten.trim() || t('Vi phạm')}<span aria-hidden className="pl-1.5 text-xs text-slate-500">{mo ? '▴' : '▾'}</span></span>
        </button>
      </div>
      {mo && <div id={idChiTiet} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2 pb-1 pt-1 max-sm:grid-cols-1"><span className="max-sm:hidden" /><MoTaViPham v={v} /></div>}
    </li>
  );
}
