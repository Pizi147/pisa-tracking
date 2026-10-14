import { Fragment } from 'react';
import { ngay } from '@shared/domain/index.ts';
import { DauTich } from './NhanViPham.tsx';
import type { BacThangDong, YThucHocVien } from './kieu.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * THANG XỬ LÝ VI PHẠM — khối riêng có viền, nổi bật (chủ sản phẩm 02/10): tiêu đề nhỏ · thang MỘT dòng · hai nút lớn.
 * `✓ Report 1 › [Report 2 · lần này] › WL 1 › Report 4 + Meeting CX/GĐCN › Report 5 › WL 2 › Report 7` (V4-8, Q27-11, mockup M6). Sau WL 2 thang
 * tăng mãi (Report 7, 8…); WL 3 và phương án khác ở NGOÀI thang — chỉ qua nút Đề xuất QL duyệt.
 *
 * Bậc đã qua có dấu tích; bậc xác nhận từ trước (trước khi dùng web) mờ hơn + `title` "xác nhận dd/mm · người"; bậc kế tô nhấn;
 * Dưới `sm`, bậc đã qua thu thành dấu tích để cả thang vẫn một dòng; tràn thì mờ dần (mọi cỡ), không xuống hàng. Em đã qua WL 2 (thang
 * dài hơn mạch chính): các bậc xa nhất gộp thành `…`, luôn còn thấy vài bậc vừa qua và bậc kế tiếp.
 *
 * Nút: `Xác nhận xử lý` (bậc kế ở ngay trên thang nên nút KHÔNG lặp tên bậc) và `Đề xuất QL duyệt` cùng cỡ, cạnh nhau. Xử lý được cả
 * khi em mới có MỘT vi phạm (GV muốn report luôn) — giống hồ sơ lớp. Có đề xuất đang chờ / đã duyệt thì ẩn (việc đó ở thanh việc).
 */
/** Mạch chính (Report 1 … WL 2) = 6 bậc; thang dài hơn 6 + ô kế tiếp thì em đã qua WL 2. */
const BAC_MACH_CHINH = 6;
/** Khi gộp: số bậc vừa qua còn hiện, trước ô kế tiếp. */
const BAC_HIEN_SAU_WL2 = 3;

export function ThangYThuc({ d, homNay, onKhai, onXuLy, onDeXuat }: {
  d: Pick<YThucHocVien, 'dongThang' | 'chuoi' | 'khai' | 'coTheKhai' | 'canManage' | 'keTiep' | 'deXuat' | 'viPham'>;
  homNay: string;
  /** Có khi người xem xác nhận được cấp bậc từ trước (Q7, Q8). */
  onKhai?: () => void;
  onXuLy?: () => void;
  onDeXuat?: () => void;
}) {
  const nhanChuoi = d.chuoi.nhan === 'lớp thường' ? t('lớp thường') : d.chuoi.nhan;
  const khaiTitle = d.khai ? t('xác nhận {ngay}{x}{x2}', { ngay: ngay(d.khai.luc, homNay), x: d.khai.boi ? ` · ${d.khai.boi}` : '', x2: d.khai.ghiChu ? ` — ${d.khai.ghiChu}` : '' }) : undefined;
  /* UX-G G5: không có vi phạm nào chưa xử lý xong thì không có gì để xác nhận / đề xuất — ẩn cả hai nút (≥ 1 vi phạm là hiện, quyết định 02/10). */
  const coViPhamMo = d.viPham.some((v) => v.trangThai !== 'da_xu_ly');
  const coNut = d.canManage && !d.deXuat && coViPhamMo;
  const xuLyDuoc = coNut && !!onXuLy;
  const rutGon = d.dongThang.length > BAC_MACH_CHINH + 1;
  const hien = rutGon ? d.dongThang.slice(-(BAC_HIEN_SAU_WL2 + 1)) : d.dongThang;
  return (
    <section className="surface-2 space-y-2 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--line-strong)' }}
      aria-label={t('Thang xử lý vi phạm ({nhanChuoi})', { nhanChuoi })}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-400">{t('Thang xử lý vi phạm · {nhanChuoi}', { nhanChuoi })}</h3>
        {d.coTheKhai && onKhai && (
          <p className="m-0 text-[11.5px] text-slate-400">
            {t('Đã có mức độ vi phạm từ trước?')}{' '}
            <button type="button" className="link inline-flex items-center appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0" onClick={onKhai}>{t('Xác nhận cấp bậc vi phạm')}</button>
          </p>
        )}
      </div>
      {/* PR-S3F #12 (V4-8): tràn thì mờ dần ở mép phải thay vì cụt chữ (mọi cỡ màn — thang dài thêm sau WL 2). */}
      <ol className="m-0 flex w-full min-w-0 list-none flex-nowrap items-center gap-1.5 overflow-hidden p-0 text-[13px] whitespace-nowrap [mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)]">
        {rutGon && (
          <li className="shrink-0 text-slate-500" aria-label={t('{x} bậc trước đó đã xử lý', { x: d.dongThang.length - hien.length })}>…</li>
        )}
        {hien.map((b, i) => (
          <Fragment key={b.kind}>
            {(i > 0 || rutGon) && <li aria-hidden className="shrink-0 text-slate-600">›</li>}
            <BacO b={b} title={b.trangThai === 'khai' ? khaiTitle : undefined} />
          </Fragment>
        ))}
      </ol>
      {coNut && (xuLyDuoc || onDeXuat) && (
        <div className="flex flex-wrap gap-2">
          {xuLyDuoc && <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onXuLy}>{t('Xác nhận xử lý')}</button>}
          {onDeXuat && <button type="button" className={`btn min-h-[44px] sm:min-h-0${xuLyDuoc ? '' : ' btn-primary'}`} onClick={onDeXuat}>{t('Đề xuất QL duyệt')}</button>}
        </div>
      )}
    </section>
  );
}

function BacO({ b, title }: { b: BacThangDong; title?: string }) {
  const daQua = b.trangThai === 'qua' || b.trangThai === 'khai';
  const lop = b.trangThai === 'lan-nay'
    ? 'border border-soon-line bg-soon-bg px-2 text-soon font-semibold'
    : b.trangThai === 'khai' ? 'text-slate-500'
    : b.trangThai === 'qua' ? 'text-slate-300'
    : 'text-slate-500';
  const moTa = b.trangThai === 'lan-nay' ? t('{nhan}, lần xử lý kế tiếp', { nhan: b.nhan })
    : daQua ? t('{nhan}, đã xử lý{x}', { nhan: b.nhan, x: b.trangThai === 'khai' ? t(' (cấp bậc xác nhận từ trước)') : '' })
    : dich(b.nhan);
  return (
    <li className={`inline-flex shrink-0 items-center gap-1 rounded-md py-0.5 ${lop}`} title={title} aria-label={moTa}>
      {daQua && <DauTich />}
      {/* Dưới sm bậc đã qua chỉ còn dấu tích — thang vẫn một dòng ở 375 px. */}
      <span className={daQua ? 'hidden sm:inline' : undefined}>{dich(b.nhan)}</span>
      {b.trangThai === 'lan-nay' && <span className="font-normal">{t('· lần này')}</span>}
    </li>
  );
}
