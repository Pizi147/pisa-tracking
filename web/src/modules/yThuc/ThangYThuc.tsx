import { Fragment } from 'react';
import { NutLuat } from '../../ui/NutLuat.tsx';
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
/** Chấm hồng = việc của tôi (mockup `.cua-toi`, cùng tab lớp). */
const CUA_TOI = <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--hong)] align-middle" />;
/** Khi gộp: số bậc vừa qua còn hiện, trước ô kế tiếp. */
const BAC_HIEN_SAU_WL2 = 3;

export function ThangYThuc({ d, homNay, onKhai, onSuaKhai, onXuLy, onDeXuat, xuLyChinh = true }: {
  d: Pick<YThucHocVien, 'dongThang' | 'chuoi' | 'khai' | 'coTheKhai' | 'canManage' | 'keTiep' | 'deXuat' | 'viPham'>;
  homNay: string;
  /** Có khi người xem xác nhận được cấp bậc từ trước (Q7, Q8). */
  onKhai?: () => void;
  /** UI-Y-THUC-HV: "Sửa cấp bậc" ở góc phải khối (người được sửa cấp bậc đã xác nhận). */
  onSuaKhai?: () => void;
  onXuLy?: () => void;
  onDeXuat?: () => void;
  /** Việc chính lúc này là Xác nhận xử lý (nút chính). false khi chỉ còn vi phạm Mới — việc chính là Ghi nhận. */
  xuLyChinh?: boolean;
}) {
  const nhanChuoi = d.chuoi.nhan === 'lớp thường' ? t('lớp thường') : d.chuoi.nhan;
  const khaiTitle = d.khai ? t('xác nhận {ngay}{x}{x2}', { ngay: ngay(d.khai.luc, homNay), x: d.khai.boi ? ` · ${d.khai.boi}` : '', x2: d.khai.ghiChu ? ` — ${d.khai.ghiChu}` : '' }) : undefined;
  /* UX-G G5: không có vi phạm nào chưa xử lý xong thì không có gì để xác nhận / đề xuất — ẩn cả hai nút (≥ 1 vi phạm là hiện, quyết định 02/10). */
  const coViPhamMo = d.viPham.some((v) => v.trangThai !== 'da_xu_ly');
  const coNut = d.canManage && !d.deXuat && coViPhamMo;
  const xuLyDuoc = coNut && !!onXuLy;
  const rutGon = d.dongThang.length > BAC_MACH_CHINH + 1;
  const hien = rutGon ? d.dongThang.slice(-(BAC_HIEN_SAU_WL2 + 1)) : d.dongThang;
  const deXuatTrenThang = !!d.deXuat && hien.some((b) => b.trangThai === 'lan-nay' && b.nhan === d.deXuat!.nhan);
  return (
    <section className="surface-2 space-y-2 rounded-[10px] border px-3.5 py-2.5 [container-type:inline-size]" style={{ borderColor: 'var(--line-strong)' }}
      aria-label={t('Thang xử lý vi phạm ({nhanChuoi})', { nhanChuoi })}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="m-0 text-[12px] font-semibold text-slate-400">{t('Thang xử lý vi phạm · {nhanChuoi}', { nhanChuoi })}</h3>
        {d.coTheKhai && onKhai ? (
          <p className="m-0 text-[12px] text-slate-400">
            {t('Đã có mức độ vi phạm từ trước?')}{' '}
            <button type="button" className="link inline-flex items-center appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0" onClick={onKhai}>{t('Xác nhận cấp bậc vi phạm')}</button>
          </p>
        ) : d.khai && onSuaKhai ? (
          <p className="m-0 text-[12px] text-slate-400">
            {t('Đã xác nhận cấp bậc vi phạm{x} ngày {ngay}.', { x: d.khai.bac > 0 ? t(' (bậc {bac})', { bac: d.khai.bac }) : '', ngay: ngay(d.khai.luc, homNay) })}{' '}
            <button type="button" className="link inline-flex items-center appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0" onClick={onSuaKhai}>{t('Sửa cấp bậc')}</button>
          </p>
        ) : null}
      </div>
      {/* UI-Y-THUC-HV (mockup v7 `.thang`, `@container 600`): khối rộng ≥ 600 px MỘT dòng, tràn thì mờ dần ở mép phải (PR-S3F #12);
          hẹp hơn (375, panel Công việc) xuống dòng, đủ tên từng bậc — đo theo chính khối, không theo màn. */}
      <ol className="m-0 flex w-full min-w-0 list-none flex-wrap items-center gap-x-1.5 gap-y-1.5 p-0 text-[13px] whitespace-nowrap [@container(min-width:600px)]:flex-nowrap [@container(min-width:600px)]:overflow-hidden [@container(min-width:600px)]:[mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)]">
        {rutGon && (
          <li className="shrink-0 text-slate-500" aria-label={t('{x} bậc trước đó đã xử lý', { x: d.dongThang.length - hien.length })}>…</li>
        )}
        {hien.map((b, i) => (
          <Fragment key={b.kind}>
            {(i > 0 || rutGon) && <li aria-hidden className="shrink-0 text-slate-600">›</li>}
            {b.trangThai === 'lan-nay' && deXuatTrenThang ? <ChipDeXuat d={d} /> : <BacO b={b} title={b.trangThai === 'khai' ? khaiTitle : undefined} coDeXuat={!!d.deXuat} />}
          </Fragment>
        ))}
        {/* Mockup `.bac.de-xuat`: đề xuất đang chờ / đã duyệt nằm ngay trên thang (viền đứt vàng) — đề xuất chính là bậc kế thì vẽ tại bậc đó,
            đề xuất ngoài thang (WL 3, phương án khác) nối ở cuối; bậc kế tiếp không còn "lần này". */}
        {d.deXuat && !deXuatTrenThang && (
          <>
            <li aria-hidden className="shrink-0 text-slate-600">›</li>
            <ChipDeXuat d={d} />
          </>
        )}
      </ol>
      {coNut && (xuLyDuoc || onDeXuat) && (
        <div className="flex flex-wrap items-center gap-2">
          {xuLyDuoc && <button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-0${xuLyChinh ? ' btn-primary' : ''}`} onClick={onXuLy}>{xuLyChinh && CUA_TOI}{t('Xác nhận xử lý')}</button>}
          {onDeXuat && <button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-0${xuLyDuoc || !xuLyChinh ? '' : ' btn-primary'}`} onClick={onDeXuat}>{t('Đề xuất QL duyệt')}</button>}
          {/* ⓘ = giải thích (luật V5): hai nút khác nhau ở đâu — thay câu dài cạnh nút. */}
          <NutLuat label={t('Xác nhận hay Đề xuất?')}>
            {t('Xác nhận xử lý: lưu ngay bậc lần này. Đề xuất QL duyệt: QL duyệt trước khi làm (WL, phương án khác).')}
          </NutLuat>
        </div>
      )}
    </section>
  );
}

function ChipDeXuat({ d }: { d: Pick<YThucHocVien, 'deXuat'> }) {
  if (!d.deXuat) return null;
  return (
    <li className="inline-flex shrink-0 items-center rounded border border-dashed border-soon px-[7px] py-px font-bold text-soon">
      {dich(d.deXuat.nhan)} · {d.deXuat.status === 'cho_duyet' ? t('đề xuất chờ QL') : t('QL đã duyệt')}
    </li>
  );
}

function BacO({ b, title, coDeXuat }: { b: BacThangDong; title?: string; coDeXuat: boolean }) {
  const daQua = b.trangThai === 'qua' || b.trangThai === 'khai';
  /* V5 (mockup `.bac`, cùng chip ThangNho tab lớp): đã qua ✓ viền xanh lá · lần này viền nhấn đậm · còn lại viền mảnh. */
  const lanNay = b.trangThai === 'lan-nay' && !coDeXuat;
  const lop = lanNay
    ? 'border border-[color:var(--accent)] bg-[color:var(--accent-soft)] px-[7px] font-bold text-[color:var(--accent)]'
    : b.trangThai === 'khai' ? 'border border-ok-line px-[7px] text-ok opacity-75'
    : b.trangThai === 'qua' ? 'border border-ok-line px-[7px] text-ok'
    : 'border border-[color:var(--line)] px-[7px] text-faint';
  const moTa = b.trangThai === 'lan-nay' ? t('{nhan}, lần xử lý kế tiếp', { nhan: dich(b.nhan) })
    : daQua ? `${t('{nhan}, đã xử lý{x}', { nhan: dich(b.nhan), x: b.trangThai === 'khai' ? t(' (cấp bậc xác nhận từ trước)') : '' })}${title ? ` — ${title}` : ''}`
    : dich(b.nhan);
  return (
    <li className={`inline-flex shrink-0 items-center gap-1 rounded py-px ${lop}`} title={title} aria-label={moTa}>
      {daQua && <DauTich />}
      <span>{dich(b.nhan)}</span>
      {b.trangThai === 'lan-nay' && <span className="font-normal">{lanNay ? t('· lần này') : t('· kế tiếp')}</span>}
    </li>
  );
}
