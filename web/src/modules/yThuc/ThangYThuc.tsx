import { Fragment } from 'react';
import { ngay } from '@shared/domain/index.ts';
import { DauTich } from './NhanViPham.tsx';
import type { BacThangDong, YThucHocVien } from './kieu.ts';

/**
 * THANG XỬ LÝ Ý THỨC — MỘT DÒNG, KHÔNG XUỐNG HÀNG (V4-8, Q27-11, mockup M6):
 * `Thang (LT1): ✓ Report 1 › [Report 2 · lần này] › WL 1 › Report 4 + Meeting CX/GĐCN › WL 2 › WL 3 · QL`.
 *
 * Bậc đã qua có dấu tích; bậc khai trước khi dùng web mờ hơn + `title` "khai dd/mm · người"; bậc kế tô nhấn; WL 3 viền đứt (cần QL).
 * Dưới `sm`, bậc đã qua thu thành dấu tích (không chữ) để cả thang vẫn một dòng; tràn thì cắt, không xuống hàng.
 */
export function ThangYThuc({ d, homNay, onKhai, onDeXuat }: {
  d: Pick<YThucHocVien, 'dongThang' | 'chuoi' | 'khai' | 'coTheKhai' | 'canManage' | 'keTiep'>;
  homNay: string;
  /** Có khi người xem khai được (Q7, Q8) — hiện `Đã xử lý trước khi dùng web? Khai bậc`. */
  onKhai?: () => void;
  /** Có khi người xem xử lý được — liên kết nhỏ cuối dòng `Đề xuất QL duyệt…`. */
  onDeXuat?: () => void;
}) {
  const nhanChuoi = d.chuoi.nhan === 'lớp thường' ? 'lớp thường' : d.chuoi.nhan;
  const khaiTitle = d.khai ? `khai ${ngay(d.khai.luc, homNay)}${d.khai.boi ? ` · ${d.khai.boi}` : ''}${d.khai.ghiChu ? ` — ${d.khai.ghiChu}` : ''}` : undefined;
  return (
    <div className="space-y-1">
      {d.coTheKhai && onKhai && (
        <p className="m-0 text-[11.5px] text-slate-400">
          Đã xử lý trước khi dùng web?{' '}
          <button type="button" className="link inline-flex items-center appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0" onClick={onKhai}>Khai bậc</button>
        </p>
      )}
      {/* PR-S3F #12 (V4-8): hẹp thì thang chiếm cả dòng (liên kết xuống dòng riêng, không đè lên bậc) và mờ dần ở mép phải thay vì cụt chữ. */}
      <div className="flex min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        <ol className="m-0 flex w-full min-w-0 list-none flex-nowrap items-center gap-1 overflow-hidden p-0 text-[12px] whitespace-nowrap sm:flex-1 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)] sm:min-w-0"
          aria-label={`Thang xử lý (${nhanChuoi})`}>
          <li className="shrink-0 text-[11.5px] text-slate-500">Thang ({nhanChuoi}):</li>
          {d.dongThang.map((b, i) => (
            <Fragment key={b.kind}>
              {i > 0 && <li aria-hidden className="shrink-0 text-slate-600">›</li>}
              <BacO b={b} title={b.trangThai === 'khai' ? khaiTitle : undefined} />
            </Fragment>
          ))}
        </ol>
        {onDeXuat && d.canManage && (
          <button type="button" className="link inline-flex items-center shrink-0 appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0 text-[11.5px]" onClick={onDeXuat}>
            Đề xuất QL duyệt…
          </button>
        )}
      </div>
    </div>
  );
}

function BacO({ b, title }: { b: BacThangDong; title?: string }) {
  const daQua = b.trangThai === 'qua' || b.trangThai === 'khai';
  const lop = b.trangThai === 'lan-nay'
    ? 'border border-soon-line bg-soon-bg px-1.5 text-soon font-semibold'
    : b.trangThai === 'khai' ? 'text-slate-500'
    : b.trangThai === 'qua' ? 'text-slate-300'
    : b.canQl ? 'border border-dashed border-[color:var(--line-strong)] px-1.5 text-slate-400'
    : 'text-slate-500';
  const moTa = b.trangThai === 'lan-nay' ? `${b.nhan}, lần xử lý kế tiếp`
    : daQua ? `${b.nhan}, đã xử lý${b.trangThai === 'khai' ? ' (khai trước khi dùng web)' : ''}`
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
