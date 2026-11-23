import type { ReactNode } from 'react';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { BAC_0_NHAN, bacDu, kindCuaBac, ngay, nhanLoaiXuLy, oThang, type OThang } from '@shared/domain/index.ts';
import { DauTich } from './NhanViPham.tsx';
import type { BacThangDong, YThucHocVien } from './kieu.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * THANG XỬ LÝ VI PHẠM — NHẸ HƠN PR-6 (mockup `thiet-ke/v23/thang-y-thuc.html` Y1–Y4): khối `.kt` — đầu (tên · chuỗi · Xác nhận cấp bậc · ⓘ) ·
 * THANH BƯỚC 7 ô bằng nhau, không bao giờ xuống dòng (cả 375) · các lần xử lý (hộp thang, gập khi > 3) · chân (số vi phạm chưa xử lý · hai nút cùng cỡ).
 * Ô: đã qua ✓ chấm đặc xám · ĐANG Ở = bậc đã xử lý gần nhất (XM-9, chấm nhấn to) · kế tiếp viền đứt · khai viền đứt + ✓ mờ · sau chấm rỗng.
 * Sau WL 2: ô đầu "…" thay các bậc xa nhất (`oThang`). WL 3 và phương án khác ở NGOÀI thang — chỉ qua nút Đề xuất Head duyệt.
 * Nút: `Xác nhận xử lý` · `Đề xuất Head duyệt` — có đề xuất đang chờ / đã duyệt thì ẩn (việc đó ở thanh việc).
 */
/** Chấm hồng = việc của tôi (mockup `.cua-toi`, cùng tab lớp). */
const CUA_TOI = <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--hong)] align-middle" />;
const LINK = 'link inline-flex min-h-[44px] appearance-none items-center border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0';

export function ThangYThuc({ d, homNay, onKhai, onSuaKhai, onXuLy, onDeXuat, xuLyChinh = true, phu, chan, lanXuLy = false, khung = true }: {
  d: Pick<YThucHocVien, 'dongThang' | 'chuoi' | 'khai' | 'coTheKhai' | 'canManage' | 'keTiep' | 'deXuat' | 'viPham' | 'dongThoiGian'>;
  homNay: string;
  /** Có khi người xem xác nhận được cấp bậc từ trước (Q7, Q8). */
  onKhai?: () => void;
  /** "Sửa cấp bậc" ở đầu khối (người được sửa cấp bậc đã xác nhận). */
  onSuaKhai?: () => void;
  onXuLy?: () => void;
  onDeXuat?: () => void;
  /** Việc chính lúc này là Xác nhận xử lý (nút chính). false khi chỉ còn vi phạm Mới — việc chính là Ghi nhận. */
  xuLyChinh?: boolean;
  /** Chữ mờ cạnh tên khối (mặc định: chuỗi — "FT" / "Lớp thường"); hộp thang: tên em · lớp. */
  phu?: string;
  /** Hồ sơ HV: các nút của em (Khai, Hỏi / Báo tình hình, + Vi phạm) ở chân khối, cạnh hai nút xử lý. */
  chan?: ReactNode;
  /** Hộp thang (Y2): danh sách các lần xử lý (ngày · bậc · người), gập sẵn khi > 3. */
  lanXuLy?: boolean;
  /** false = không viền khối (đặt trong hộp đã có viền). */
  khung?: boolean;
}) {
  const nhanChuoi = d.chuoi.nhan.replace('lớp thường', t('lớp thường'));
  const coViPhamMo = d.viPham.some((v) => v.trangThai !== 'da_xu_ly');
  const soCho = d.viPham.filter((v) => v.trangThai !== 'da_xu_ly').length;
  const coNut = d.canManage && !d.deXuat && coViPhamMo;
  const xuLyDuoc = coNut && !!onXuLy;
  const coNutXuLy = coNut && (xuLyDuoc || !!onDeXuat);
  /* Ngày của ô đã qua = lần xử lý xong gần nhất cùng loại (dữ liệu đã nạp, không thêm câu). */
  const xl = d.dongThoiGian.filter((x): x is Extract<typeof x, { loai: 'xu-ly' }> => x.loai === 'xu-ly' && x.status === 'done').sort((a, b) => b.ngay.localeCompare(a.ngay));
  const ngayCua = (kind: string) => xl.find((x) => x.kind === kind);
  const khaiTitle = d.khai ? t('xác nhận {ngay}{x}', { ngay: ngay(d.khai.luc), x: d.khai.boi ? ` · ${d.khai.boi}` : '' }) : undefined;
  /* So phần tên trước " +" — bậc gộp "Report 4 + Meeting CX/GĐCN" vẫn khớp đề xuất "Report 4". */
  const goc = (x: string) => x.split(' +')[0].trim();
  const deXuatTrenThang = !!d.deXuat && goc(d.keTiep.nhan) === goc(d.deXuat.nhan);
  const nhanDeXuat = d.deXuat ? (d.deXuat.status === 'cho_duyet' ? t('chờ Head') : t('Head đã duyệt')) : null;
  const o = oThang(d.dongThang).map((x): ONut => {
    const ten = x.tt === 'gop' ? t('{x} bậc trước đó đã xử lý', { x: x.soGop ?? 0 }) : bacDu(dich(x.nhan));
    const lan = x.tt === 'qua' || x.tt === 'dang' ? ngayCua(x.kind) : undefined;
    const duoi = x.khai ? t('khai') : lan ? ngay(lan.ngay) : x.tt === 'ke' ? (deXuatTrenThang ? nhanDeXuat : t('kế tiếp')) : null;
    const title = x.khai ? `${ten} · ${khaiTitle ?? t('xác nhận từ trước')}` : lan ? `${ten} · ${ngay(lan.ngay)}${lan.nguoi ? ` · ${lan.nguoi}` : ''}` : x.tt === 'ke' ? `${ten} · ${duoi}` : ten;
    return { key: x.kind, ten: x.ngan, duoi, title, tt: x.tt === 'gop' ? 'qua' : x.tt, khai: x.khai, ngayDuoi: !!lan };
  });
  const dang = oThang(d.dongThang).find((x) => x.tt === 'dang');
  const aria = t('Thang xử lý vi phạm: {a}, kế tiếp {b}', { a: dang ? t('đang ở {x}', { x: bacDu(dich(dang.nhan)) }) : t('chưa xử lý lần nào'), b: bacDu(dich(d.keTiep.nhan)) });
  const lanDs = xl.slice(0, 20);
  /* N70: tên ngắn của bậc GVCN xin (như ô thang "R1" · "WL1"); bậc ngoài các ô đang hiện → tên đủ; bậc 0 → "Chưa có xử lý vi phạm". */
  const bCho = d.khai?.cho?.bac;
  const bacCho = bCho == null ? '' : bCho === 0 ? dich(BAC_0_NHAN)
    : oThang(d.dongThang).find((x) => x.kind === kindCuaBac(bCho))?.ngan ?? bacDu(dich(nhanLoaiXuLy(kindCuaBac(bCho))));
  return (
    <section className={`[container-type:inline-size] ${khung ? 'rounded-[10px] border' : ''}`} style={{ borderColor: 'var(--line)', background: khung ? 'var(--surface)' : undefined }}
      aria-label={t('Thang xử lý vi phạm ({nhanChuoi})', { nhanChuoi })}>
      <div className={`flex min-h-12 flex-wrap items-center gap-x-2.5 gap-y-1 border-b py-1.5 pr-2 ${khung ? 'pl-4 max-sm:pl-3' : 'pl-0'}`} style={{ borderColor: 'var(--line)' }}>
        <h3 className="m-0 text-sm font-bold text-[color:var(--text)]">{t('Thang xử lý vi phạm')}</h3>
        <span className="text-[13px] text-dim">{phu ?? nhanChuoi}</span>
        <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
          {/* N70 (PTA chốt [XM 4]): yêu cầu sửa bậc của GVCN đang chờ — nói ngay cạnh "Sửa cấp bậc", ai xem hồ sơ cũng thấy (bậc trên thang vẫn là bậc cũ). */}
          {d.khai?.cho && <span className="whitespace-nowrap text-[13px] font-semibold text-soon" title={d.khai.cho.han ? t('hạn {ngay}', { ngay: ngay(d.khai.cho.han) }) : undefined}>
            {t('chờ Head duyệt {bac}', { bac: bacCho })}</span>}
          {d.coTheKhai && onKhai ? <button type="button" className={LINK} title={t('Đã có mức độ vi phạm từ trước?')} onClick={onKhai}>{t('Xác nhận cấp bậc vi phạm')}</button>
            : d.khai && onSuaKhai ? <button type="button" className={LINK} title={khaiTitle} onClick={onSuaKhai}>{t('Sửa cấp bậc')}</button> : null}
          {/* ⓘ = tên đầy đủ các bậc (thay chữ dài trên thang) + luật nút (Y2c). */}
          <NutLuat label={t('Tên đầy đủ các bậc')} phai>
            <span className="block text-[13px] font-semibold text-[color:var(--text)]">{t('Thang xử lý vi phạm')}</span>
            <span className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-2 gap-y-0.5">
              {oThang(d.dongThang).filter((x) => x.tt !== 'gop').map((x) => <span key={x.kind} className="contents"><b className="font-semibold">{x.ngan}</b><span>{bacDu(dich(x.nhan))}</span></span>)}
            </span>
            <span className="block">{t('Xác nhận xử lý: lưu ngay bậc kế tiếp. WL 3, phương án khác: qua Đề xuất Head duyệt.')}</span>
          </NutLuat>
        </span>
      </div>
      <div className={`grid gap-3.5 py-4 ${khung ? 'px-4 max-sm:px-2' : 'px-0'}`}>
        {/* Khung v23: thang ở cột / hộp ~560 px — khối rộng (hồ sơ một cột) không kéo giãn các ô. */}
        <ThanhBuoc o={o} aria={aria} className="w-full max-w-[640px]" />
        {d.deXuat && !deXuatTrenThang && (
          <p className="m-0 text-[13px] text-dim">
            {t('Đề xuất')} <b className="font-semibold text-[color:var(--text)]">{bacDu(dich(d.deXuat.nhan))}</b> · {nhanDeXuat}
          </p>
        )}
        {lanXuLy && lanDs.length > 0 && (lanDs.length > 3 ? (
          <details className="rounded-lg border" style={{ borderColor: 'var(--line)' }}>
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm font-semibold text-[color:var(--text)]">
              {t('Các lần xử lý')}
              <span className="text-[13px] font-normal text-dim">{t('{n} lần · mới nhất {ngay} {nhan}', { n: lanDs.length, ngay: ngay(lanDs[0].ngay), nhan: bacDu(dich(lanDs[0].nhan)) })}</span>
            </summary>
            <div className="border-t px-3" style={{ borderColor: 'var(--line)' }}><DsLan ds={lanDs} /></div>
          </details>
        ) : <DsLan ds={lanDs} />)}
      </div>
      {(coNutXuLy || chan) && (
        <div className={`flex flex-wrap items-center gap-2 border-t py-2.5 ${khung ? 'px-4 max-sm:px-3' : 'px-0'}`} style={{ borderColor: 'var(--line)' }}>
          {coNutXuLy && soCho > 0 && <span className="text-[13px] text-dim">{t('{n} vi phạm chưa xử lý', { n: soCho })}</span>}
          <span className="ml-auto flex flex-wrap items-center gap-2 max-sm:ml-0 max-sm:w-full max-sm:[&>*]:flex-1 max-sm:[&>*]:justify-center">
            {chan}
            {coNutXuLy && onDeXuat && <button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-0${xuLyDuoc || !xuLyChinh ? '' : ' btn-primary'}`} onClick={onDeXuat}>{t('Đề xuất Head duyệt')}</button>}
            {xuLyDuoc && <button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-0${xuLyChinh ? ' btn-primary' : ''}`} onClick={onXuLy}>{xuLyChinh && CUA_TOI}{t('Xác nhận xử lý')}</button>}
          </span>
        </div>
      )}
    </section>
  );
}

function DsLan({ ds }: { ds: Extract<YThucHocVien['dongThoiGian'][number], { loai: 'xu-ly' }>[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {ds.map((x) => (
        <li key={x.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 border-t py-1.5 text-[13px] first:border-t-0" style={{ borderColor: 'var(--line)' }}>
          <time className="text-xs tabular-nums text-faint">{ngay(x.ngay)}</time>
          <span className="min-w-0"><b className="font-semibold text-[color:var(--text)]">{bacDu(dich(x.nhan))}</b>{x.nguoi && <span className="text-dim"> · {x.nguoi}</span>}{x.soViPham > 0 && <span className="text-dim"> · {t('{n} vi phạm', { n: x.soViPham })}</span>}</span>
        </li>
      ))}
    </ul>
  );
}

/** Một ô của thanh bước. `cho` = phần đang chờ người làm (Phối hợp SOS N58, chấm nhấn nhạt). */
export type ONut = { key: string; ten: string; /** Tên khi khối < 420 px (375). */ tenNgan?: string; duoi?: ReactNode; title?: string; tt: Exclude<OThang['tt'], 'gop'> | 'cho'; khai?: boolean;
  /** Chữ dưới là ngày (ẩn khi khối hẹp < 420 px — rê / bấm ⓘ xem); "kế tiếp" luôn hiện. */ ngayDuoi?: boolean };

const CHAM: Record<ONut['tt'], string> = {
  qua: 'h-5 w-5 border-[color:var(--text-faint)] bg-[color:var(--text-faint)] text-[color:var(--surface)]',
  dang: 'h-6 w-6 border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--surface)] shadow-[0_0_0_4px_var(--accent-soft)]',
  khai: 'h-5 w-5 border-dashed border-[color:var(--text-faint)] bg-transparent text-faint',
  ke: 'h-5 w-5 border-dashed border-[color:var(--accent)] bg-[color:var(--surface)]',
  cho: 'h-6 w-6 border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[0_0_0_4px_var(--accent-soft)]',
  sau: 'h-5 w-5 border-[color:var(--line-strong)] bg-[color:var(--surface)]',
};
const TEN: Record<ONut['tt'], string> = {
  qua: 'text-dim', khai: 'text-dim', dang: 'text-[13px] font-bold text-[color:var(--text)]', ke: 'text-[color:var(--accent)]',
  cho: 'font-bold text-[color:var(--text)]', sau: 'text-faint',
};

/**
 * THANH BƯỚC (v23 `.bac`) — MỘT thành phần cho thang Ý thức và Phối hợp SOS: ô bằng nhau trên một vạch, chấm + tên ngắn + chữ nhỏ dưới, không xuống dòng.
 * `doc` (N58, XM-10): ô đầu nối, các ô sau ĐỘC LẬP (không vạch nối, vạch dọc đứt ngăn sau ô đầu).
 */
export function ThanhBuoc({ o, aria, doc = false, className = '' }: { o: ONut[]; aria: string; doc?: boolean; className?: string }) {
  return (
    <ol aria-label={aria} className={`m-0 grid list-none p-0 [container-type:inline-size] ${className}`} style={{ gridTemplateColumns: `repeat(${o.length}, minmax(0, 1fr))` }}>
      {o.map((x, i) => {
        const noi = i > 0 && doc === false;
        const vachDam = x.tt === 'qua' || x.tt === 'dang' || x.tt === 'cho';
        return (
          <li key={x.key} title={x.title} aria-current={x.tt === 'dang' ? 'step' : undefined}
            className={`relative grid min-w-0 content-start justify-items-center gap-1.5 pt-0.5 ${noi ? `before:absolute before:left-[-50%] before:right-1/2 before:top-[13px] before:h-0.5 before:content-[''] ${vachDam ? 'before:bg-[color:var(--text-faint)]' : 'before:bg-[color:var(--line-strong)]'}` : ''} ${doc && i === 1 ? 'border-l border-dashed' : ''}`}
            style={doc && i === 1 ? { borderColor: 'var(--line-strong)' } : undefined}>
            <span className="relative z-[1] grid h-6 w-6 place-items-center">
              <i className={`grid place-items-center rounded-full border-2 not-italic ${CHAM[x.tt]}`}>{(x.tt === 'qua' || x.tt === 'dang' || x.tt === 'khai') && <DauTich className="h-3 w-3" />}</i>
            </span>
            {/* Trình đọc màn hình đọc `title` đầy đủ (sr-only) — tên ngắn / chữ dưới chỉ để nhìn. */}
            <span aria-hidden className={`max-w-full truncate whitespace-nowrap text-xs font-semibold ${TEN[x.tt]} ${x.tenNgan ? '[@container(max-width:419px)]:hidden' : ''}`}>{x.ten}</span>
            {x.tenNgan && <span aria-hidden className={`hidden max-w-full truncate whitespace-nowrap text-xs font-semibold [@container(max-width:419px)]:block ${TEN[x.tt]}`}>{x.tenNgan}</span>}
            {x.duoi && <span aria-hidden className={`-mt-1 max-w-full truncate whitespace-nowrap text-xs font-medium tabular-nums ${x.tt === 'dang' ? 'text-dim' : 'text-faint'} ${x.ngayDuoi ? '[@container(max-width:419px)]:hidden' : ''}`}>{x.duoi}</span>}
            <span className="sr-only">{x.title}</span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * GD-4d — THANG DẠNG VẠCH (⑤ D1a, ③ K1 / K4a `.vach-bac`; chủ SP 15/11: "không để chữ WARNING LETTER vào trong progress bar, chỉ khác màu và nổi bật hơn").
 * Thang mini (panel Xác nhận xử lý, dòng em). Vạch thường 22 × 5 (375: 14), đã tới màu nhấn, bậc kế nhạt;
 * mốc WL = vạch ĐỎ dày 9, dài 30 (375: 20). KHÔNG chữ trong thanh — tên bậc (viết đủ) ở `aria-label` / `title`.
 */
export function ThangVach({ dong }: { dong: readonly BacThangDong[] }) {
  const ten = (b: BacThangDong) => bacDu(dich(b.nhan));
  const daToi = dong.filter((b) => b.trangThai === 'qua' || b.trangThai === 'khai');
  const toi = daToi[daToi.length - 1];
  const nhan = t('Thang xử lý: {ds} — {x}', { ds: dong.map(ten).join(', '), x: toi ? t('đã tới {nhan}', { nhan: ten(toi) }) : t('chưa có bậc') });
  return (
    <span role="img" aria-label={nhan} className="inline-flex shrink-0 items-center gap-[3px] self-center">
      {dong.map((b) => {
        const wl = b.kind.startsWith('wl_');
        const co = b.trangThai === 'qua' || b.trangThai === 'khai';
        const ke = b.trangThai === 'lan-nay';
        const mau = wl ? 'bg-[rgb(var(--bad-rgb))]' : co || ke ? 'bg-[color:var(--accent)]' : 'bg-[color:var(--line-strong)]';
        return <i key={b.kind} title={ke ? t('{nhan} · bậc kế', { nhan: ten(b) }) : ten(b)}
          className={`block rounded-[3px] ${wl ? 'h-[9px] w-[30px] max-sm:w-5' : 'h-[5px] w-[22px] max-sm:w-3.5'} ${mau}${ke ? ' opacity-[.45]' : ''}${wl && co ? ' shadow-[0_0_0_2px_rgb(var(--bad-bg-rgb))]' : ''}`} />;
      })}
    </span>
  );
}
