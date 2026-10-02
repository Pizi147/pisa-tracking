import { Fragment } from 'react';
import { ngay } from '@shared/domain/index.ts';
import { DauTich } from './NhanViPham.tsx';
import type { BacThangDong, YThucHocVien } from './kieu.ts';

/**
 * THANG XỬ LÝ VI PHẠM — khối riêng có viền, nổi bật (chủ sản phẩm 02/10): tiêu đề nhỏ · thang MỘT dòng · hai nút lớn.
 * `✓ Report 1 › [Report 2 · lần này] › WL 1 › Report 4 + Meeting CX/GĐCN › WL 2 › WL 3 · QL` (V4-8, Q27-11, mockup M6).
 *
 * Bậc đã qua có dấu tích; bậc xác nhận từ trước (trước khi dùng web) mờ hơn + `title` "xác nhận dd/mm · người"; bậc kế tô nhấn;
 * WL 3 viền đứt (cần QL). Dưới `sm`, bậc đã qua thu thành dấu tích để cả thang vẫn một dòng; tràn thì mờ dần, không xuống hàng.
 *
 * Nút: `Xác nhận xử lý` (bậc kế ở ngay trên thang nên nút KHÔNG lặp tên bậc) và `Đề xuất QL duyệt` cùng cỡ, cạnh nhau. Xử lý được cả
 * khi em mới có MỘT vi phạm (GV muốn report luôn) — giống hồ sơ lớp. Có đề xuất đang chờ / đã duyệt thì ẩn (việc đó ở thanh việc).
 */
export function ThangYThuc({ d, homNay, onKhai, onXuLy, onDeXuat }: {
  d: Pick<YThucHocVien, 'dongThang' | 'chuoi' | 'khai' | 'coTheKhai' | 'canManage' | 'keTiep' | 'deXuat' | 'viPham'>;
  homNay: string;
  /** Có khi người xem xác nhận được cấp bậc từ trước (Q7, Q8). */
  onKhai?: () => void;
  onXuLy?: () => void;
  onDeXuat?: () => void;
}) {
  const nhanChuoi = d.chuoi.nhan === 'lớp thường' ? 'lớp thường' : d.chuoi.nhan;
  const khaiTitle = d.khai ? `xác nhận ${ngay(d.khai.luc, homNay)}${d.khai.boi ? ` · ${d.khai.boi}` : ''}${d.khai.ghiChu ? ` — ${d.khai.ghiChu}` : ''}` : undefined;
  /* UX-G G5: không có vi phạm nào chưa xử lý xong thì không có gì để xác nhận / đề xuất — ẩn cả hai nút (≥ 1 vi phạm là hiện, quyết định 02/10). */
  const coViPhamMo = d.viPham.some((v) => v.trangThai !== 'da_xu_ly');
  const coNut = d.canManage && !d.deXuat && coViPhamMo;
  const xuLyDuoc = coNut && !!onXuLy && !!d.keTiep && !d.keTiep.canQl;
  return (
    <section className="surface-2 space-y-2 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--line-strong)' }}
      aria-label={`Thang xử lý vi phạm (${nhanChuoi})`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-400">Thang xử lý vi phạm · {nhanChuoi}</h3>
        {d.coTheKhai && onKhai && (
          <p className="m-0 text-[11.5px] text-slate-400">
            Đã có mức độ vi phạm từ trước?{' '}
            <button type="button" className="link inline-flex items-center appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0" onClick={onKhai}>Xác nhận cấp bậc vi phạm</button>
          </p>
        )}
      </div>
      {/* PR-S3F #12 (V4-8): hẹp thì mờ dần ở mép phải thay vì cụt chữ. */}
      <ol className="m-0 flex w-full min-w-0 list-none flex-nowrap items-center gap-1.5 overflow-hidden p-0 text-[13px] whitespace-nowrap max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)]">
        {d.dongThang.map((b, i) => (
          <Fragment key={b.kind}>
            {i > 0 && <li aria-hidden className="shrink-0 text-slate-600">›</li>}
            <BacO b={b} title={b.trangThai === 'khai' ? khaiTitle : undefined} />
          </Fragment>
        ))}
      </ol>
      {coNut && (xuLyDuoc || onDeXuat) && (
        <div className="flex flex-wrap gap-2">
          {xuLyDuoc && <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onXuLy}>Xác nhận xử lý</button>}
          {onDeXuat && <button type="button" className={`btn min-h-[44px] sm:min-h-0${xuLyDuoc ? '' : ' btn-primary'}`} onClick={onDeXuat}>Đề xuất QL duyệt</button>}
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
    : b.canQl ? 'border border-dashed border-[color:var(--line-strong)] px-1.5 text-slate-400'
    : 'text-slate-500';
  const moTa = b.trangThai === 'lan-nay' ? `${b.nhan}, lần xử lý kế tiếp`
    : daQua ? `${b.nhan}, đã xử lý${b.trangThai === 'khai' ? ' (cấp bậc xác nhận từ trước)' : ''}`
    : b.canQl ? `${b.nhan}, cần QL duyệt` : b.nhan;
  return (
    <li className={`inline-flex shrink-0 items-center gap-1 rounded-md py-0.5 ${lop}`} title={title} aria-label={moTa}>
      {daQua && <DauTich />}
      {/* Dưới sm bậc đã qua chỉ còn dấu tích — thang vẫn một dòng ở 375 px. */}
      <span className={daQua ? 'hidden sm:inline' : undefined}>{b.nhan}</span>
      {b.trangThai === 'lan-nay' && <span className="font-normal">· lần này</span>}
      {b.trangThai !== 'lan-nay' && b.canQl && <span className="hidden sm:inline">· QL</span>}
    </li>
  );
}
