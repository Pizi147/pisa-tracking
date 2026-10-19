import { t } from '@shared/i18n/index.ts';
/**
 * DÒNG TÍM "XIN Ý KIẾN" CỦA MỘT PA — MỘT nguồn chữ cho Ngăn Case, hàng PA ở bảng kỹ năng và thẻ PA 375 px (PR-DUYET T64, PR-UXF-b O1).
 * Xin ý kiến không dừng PA: chờ thì dòng tím + hạn; Quản lý trả lời thì hiện câu trả lời. `gon` (bảng kỹ năng, thẻ): đúng chữ đó nhưng một dòng, bản đủ ở tooltip.
 */
export type XinYKien = {
  trangThai: string; taoLuc?: string | null; hanDuyet?: string | null; nguoiDuyet?: string | null; xuLyLuc?: string | null; traLoi?: string | null;
} | null | undefined;

export function DongXinYKien({ x, ngan, gon = false }: { x: XinYKien; ngan: (d: string | null | undefined) => string; gon?: boolean }) {
  if (x?.trangThai === 'cho') {
    const chu = t('Đã xin Quản lý hỗ trợ {ngan} · chờ trả lời{x}', { ngan: ngan(x.taoLuc), x: x.hanDuyet ? t(' · hạn {ngan}', { ngan: ngan(x.hanDuyet) }) : '' });
    return <p className={`m-0 ${gon ? 'mt-0.5 line-clamp-1 text-[12px]' : 'mt-1 text-xs'} text-muted tabular-nums`} title={gon ? chu : undefined}>{chu}</p>;
  }
  if (x?.trangThai === 'da_tra_loi') {
    const chu = t('Quản lý{x} trả lời {ngan}: {traLoi}', { x: x.nguoiDuyet ? ` (${x.nguoiDuyet})` : '', ngan: ngan(x.xuLyLuc), traLoi: String(x.traLoi) });
    return gon
      ? <p className="m-0 mt-0.5 line-clamp-1 text-[12px] text-slate-300" title={chu}>{chu}</p>
      : <p className="m-0 mt-1 border-l pl-3 text-xs text-slate-300" style={{ borderColor: 'var(--line)' }}>{chu}</p>;
  }
  return null;
}
