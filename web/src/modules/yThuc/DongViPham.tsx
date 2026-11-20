import { useId, useState, type ReactNode } from 'react';
import { NutDichGop, useDichGop } from '../../ui/ChuDich.tsx';
import { t } from '@shared/i18n/index.ts';
import { ChipMon } from './BangLan.tsx';

const NHAN = 'text-xs text-slate-500';

/**
 * Dòng vi phạm MỞ TẠI CHỖ — MỘT kiểu mở cho mọi danh sách vi phạm (ngày · chip môn · tên): bấm TÊN mở mô tả ngay dưới dòng, bấm lại thu.
 * Không request thêm — mô tả đã nạp cùng danh sách. MỘT nút Dịch trong phần mở dịch cả tên (thay chữ tên ở dòng) lẫn mô tả (`useDichGop`).
 * `ngay` đã định dạng (mã tuần / dd/mm do nơi gọi chọn) · `moSan`: khối chỉ có vài dòng, đọc luôn · `truoc` / `phu`: ô tick và nhãn trạng thái của dòng
 * chọn được (ô tick chỉ chọn) · `duoi`: dòng phụ luôn thấy dưới tên · `nhom`: nhóm vi phạm, thấy trong phần mở.
 */
export function DongViPham({ v, ngay, moSan = false, truoc, phu, duoi, nhom }: {
  v: { id: number; ten: string; moTa: string; skill: string | null }; ngay: string; moSan?: boolean;
  truoc?: ReactNode; phu?: ReactNode; duoi?: ReactNode; nhom?: string;
}) {
  const [mo, setMo] = useState(moSan);
  const idChiTiet = useId();
  const d = useDichGop([
    { chu: v.ten, nguon: { bang: 'violations', id: v.id, cot: 'ten' } },
    { chu: v.moTa, nguon: { bang: 'violations', id: v.id, cot: 'mo_ta' } },
  ]);
  return (
    <div className="flex min-w-0 items-start gap-2">
      {truoc}
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
          <span className="pt-px tabular-nums text-slate-400 max-sm:pt-3">{ngay}</span>
          <button type="button" aria-expanded={mo} aria-controls={mo ? idChiTiet : undefined} onClick={() => setMo((x) => !x)}
            className="flex min-w-0 appearance-none items-start gap-1 border-0 bg-transparent p-0 text-left font-[inherit] text-inherit hover:text-[color:var(--accent)] hover:underline max-sm:min-h-[44px] max-sm:items-center">
            <ChipMon skill={v.skill} /><span className="min-w-0 break-words">{d.chu(0).trim() || t('Vi phạm')}<span aria-hidden className="pl-1.5 text-xs text-slate-500">{mo ? '▴' : '▾'}</span></span>
          </button>
        </div>
        {duoi && <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2"><span /><div className="min-w-0 text-xs text-slate-500">{duoi}</div></div>}
        {mo && (
          <div id={idChiTiet} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2 pb-1 pt-1 max-sm:grid-cols-1">
            <span className="max-sm:hidden" />
            <div className="grid min-w-0 gap-1 text-sm">
              {nhom && <span className={NHAN}>{t('Nhóm')}: <span className="text-slate-300">{nhom}</span></span>}
              <span className={NHAN}>{t('Mô tả')}</span>
              <p className="m-0 whitespace-pre-wrap break-words text-slate-200">
                {v.moTa.trim() ? d.chu(1) : <span className="text-slate-500">{t('Không có mô tả thêm')}</span>}{' '}<NutDichGop d={d} />
              </p>
            </div>
          </div>
        )}
      </div>
      {phu}
    </div>
  );
}
