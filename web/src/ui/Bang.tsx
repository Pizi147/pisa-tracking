import { Fragment, type KeyboardEvent, type ReactNode, type TdHTMLAttributes } from 'react';
import { chiaThe, nhomTieuDe, rongCot, type DinhNghiaCot } from '@shared/domain/index.ts';
import { Empty } from './ui.tsx';
import { useDienThoai } from './TheDong.tsx';
import { t } from '@shared/i18n/index.ts';

export type { DinhNghiaCot as CotBang } from '@shared/domain/index.ts';

/**
 * MỘT BẢNG CHO CẢ HỆ (BANG-0, 04 mục 6). `<table>` chỉ được viết ở đây (phép kiểm BANG-3). Kiểu cột (`shared/domain/bang.ts`) quyết định
 * căn + rộng px, gắn CÙNG `data-kieu` lên `th` và `td` → CSS `.bang [data-kieu]` căn cả hai, tiêu đề và ô không thể lệch.
 * Hàng 44 px (một dòng) / 64 px (ô nào có dòng phụ `data-phu-odiem` — `phuCua` hoặc `ODiem`), mọi ô chung đường cơ sở. Công cụ (lọc, Xuất…) ở NGOÀI khung, trên viền bảng.
 * Tiêu đề chỉ nhận chữ (`nhan`, `phu`) — cấm ô nhập / nút trong `th`. < 640 px: thẻ từ cùng định nghĩa cột.
 * Hàng bấm được (`onHang`) = `.bam` + Enter; đang mở = `.dang-mo`; bảng ≥ 8 cột không bấm = dò hàng `.do-hang`.
 */
export function Bang<H>({ ten, cot, hang, khoa, oCua = () => null, phuCua, congCu, onHang, dangMo, rong, day, chat, hangRieng, cuoi, the375 = true, dinh, khung = true, deu, lopHang, sauThe }: {
  /** Tên bảng cho trình đọc màn + công cụ đo `do-bang`. */
  ten: string;
  cot: readonly DinhNghiaCot[];
  hang: readonly H[];
  khoa: (h: H) => string | number;
  oCua?: (h: H, c: DinhNghiaCot) => ReactNode;
  /** Dòng phụ 12 px dưới dòng chính của ô (hàng có dòng phụ cao 64). */
  phuCua?: (h: H, c: DinhNghiaCot) => ReactNode;
  congCu?: ReactNode;
  onHang?: (h: H) => void;
  dangMo?: (h: H) => boolean;
  /** Chữ khi không có hàng. */
  rong?: { tieuDe: string; goiY?: string; nut?: ReactNode };
  /** Lưới dày (> 8 cột, lưới điểm): chữ ô 14. */
  day?: boolean;
  /** Bảng tra cứu dài (vd bảng quy đổi band 41 hàng): ≥ 640 px hàng 32 px; < 640 px giữ 44 px (vùng chạm) — `.bang[data-chat]`. */
  chat?: boolean;
  /** BANG-1: hàng là component có hook riêng (lưới điểm: lưu theo từng hàng) — tự vẽ `<tr>` bằng `OBang`. Chỉ ở dạng bảng (thẻ < 640 px vẽ từ `oCua`). */
  hangRieng?: (h: H) => ReactNode;
  /** Lớp thêm cho hàng / thẻ (vd `row-muted`, nền đang chọn). */
  lopHang?: (h: H) => string;
  /** RA-UI-8: phần mở thêm ở cuối thẻ (< 640 px) — thay hàng mở dưới hàng của `hangRieng` (vd các Case của em). */
  sauThe?: (h: H) => ReactNode;
  /** Hàng thêm sau cùng (hàng mờ "em chưa có lịch"). */
  cuoi?: ReactNode;
  /** false: không đổi thành thẻ ở < 640 px (lưới nhập điểm có màn điện thoại riêng). */
  the375?: boolean;
  /** Đầu cột dính khi cuộn trang (`.bang-dinh`, chỉ bảng vừa khung ở 1440); '1440' = bảng rộng hơn khung ở 1280 (`.bang-dinh-1440`). */
  dinh?: boolean | '1440';
  /** false: không bọc thẻ (nơi gọi đã ở trong thẻ / panel). */
  khung?: boolean;
  /** UI-PHAN-TICH: cột tên giữ `rong` của nó, phần dư chia đều cho MỌI cột theo tỉ lệ — bảng ít cột số không dồn hết sang phải. */
  deu?: boolean;
}) {
  const rongCua = (c: DinhNghiaCot) => (deu && c.rong ? c.rong : rongCot(c, cot));
  const dienThoai = useDienThoai();
  const nhom = nhomTieuDe(cot);
  const lop = (h: H) => `${onHang ? 'bam' : cot.length >= 8 ? 'do-hang' : ''} ${dangMo?.(h) ? 'dang-mo' : ''} ${lopHang?.(h) ?? ''}`;
  const phim = (h: H) => (e: KeyboardEvent) => { if (onHang && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onHang(h); } };
  const coPhu = (x: ReactNode) => x != null && x !== false && x !== '';

  let than: ReactNode;
  if (hang.length === 0 && !cuoi) {
    than = <Empty title={rong?.tieuDe ?? t('Chưa có dữ liệu')} hint={rong?.goiY} action={rong?.nut} />;
  } else if (dienThoai && the375) {
    const phan = chiaThe(cot);
    const theoKey = new Map(cot.map((c) => [c.key, c]));
    const o = (h: H, k: string) => oCua(h, theoKey.get(k)!);
    /* Ô rộng 120 khi có điểm tỉ lệ hoặc nhãn dài (vd "Việc đúng hạn") — 76 px làm nhãn + số tràn chồng sang ô bên (UI-TONG-QUAN 8b). */
    const tiLe = cot.some((x) => x.kieu === 'diem-ti-le') || phan.diem.some((k) => theoKey.get(k)!.nhan.length > 8);
    than = hang.map((h) => (
      <article key={khoa(h)} className={`border-t px-3 py-2.5 first:border-t-0 ${lop(h)}`} style={{ borderColor: 'var(--line)' }}
        tabIndex={onHang ? 0 : undefined} onClick={onHang ? () => onHang(h) : undefined} onKeyDown={phim(h)}>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">{phan.dau.map((k) => <Fragment key={k}>{o(h, k)}</Fragment>)}</div>
        {phuCua && coPhu(phuCua(h, theoKey.get(phan.dau[0])!)) && <div className="text-[13px] text-slate-400">{phuCua(h, theoKey.get(phan.dau[0])!)}</div>}
        {phan.diem.length > 0 && (
          <div className={`mt-1.5 grid gap-x-3 gap-y-1 ${tiLe ? 'grid-cols-[repeat(auto-fill,minmax(120px,1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(76px,1fr))]'}`}>
            {phan.diem.map((k) => (
              <span key={k} className="inline-flex min-w-0 flex-wrap items-center gap-x-1.5">
                <span className="text-[13px] text-slate-400">{theoKey.get(k)!.nhan}</span>{o(h, k)}
              </span>
            ))}
          </div>
        )}
        {phan.khac.length > 0 && (
          <dl className="m-0 mt-1.5 grid grid-cols-[6rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 text-[14px]">
            {phan.khac.map((k) => (
              <Fragment key={k}><dt className="text-slate-400">{theoKey.get(k)!.nhan}</dt><dd className="m-0 min-w-0 tabular-nums">{o(h, k)}</dd></Fragment>
            ))}
          </dl>
        )}
        {phan.duoi.length > 0 && <div className="mt-2 flex min-h-[44px] items-center justify-between gap-2 text-[14px]">{phan.duoi.map((k) => <Fragment key={k}>{o(h, k)}</Fragment>)}</div>}
        {sauThe?.(h)}
      </article>
    ));
  } else {
    than = (
      <div className={`table-scroll ${dinh ? 'bang-dinh' : ''} ${dinh === '1440' ? 'bang-dinh-1440' : ''}`}>
        <table className="bang" data-day={day || undefined} data-chat={chat || undefined} aria-label={ten} style={{ minWidth: cot.reduce((n, c) => n + (rongCua(c) ?? (c.kieu === 'ten' ? 205 : 240)), 0) }}>
          <colgroup>{cot.map((c) => { const r = rongCua(c); return <col key={c.key} style={r ? { width: r } : undefined} />; })}</colgroup>
          <thead>
            {nhom && (
              <tr className="bang-nhom">
                {nhom.map((n, i) => <th key={i} colSpan={n.span} scope={n.nhan ? 'colgroup' : undefined} data-co-nhom={n.nhan ? '' : undefined}>{n.nhan ?? ''}</th>)}
              </tr>
            )}
            <tr>
              {cot.map((c) => (
                <th key={c.key} scope="col" data-kieu={c.kieu} data-tinh={c.tinh || undefined} data-tach={c.tach || undefined} data-sang={c.sang || undefined} title={c.goiY}
                  className={`th ${c.kieu === 'ten' ? 'sticky-col' : ''}`}>
                  {c.nhan}{c.phu && <span className="bang-chu-thich"> {c.phu}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hangRieng ? hang.map((h) => <Fragment key={khoa(h)}>{hangRieng(h)}</Fragment>) : hang.map((h) => {
              const phu = phuCua ? cot.map((c) => phuCua(h, c)) : [];
              return (
                <tr key={khoa(h)} className={lop(h)}
                  tabIndex={onHang ? 0 : undefined} onClick={onHang ? () => onHang(h) : undefined} onKeyDown={phim(h)}>
                  {cot.map((c, i) => (
                    <td key={c.key} data-kieu={c.kieu} data-tinh={c.tinh || undefined} data-tach={c.tach || undefined} className={`td ${c.kieu === 'ten' ? 'sticky-col' : ''}`}>
                      {oCua(h, c)}
                      {/* SUA-375-3: dòng phụ dạng chữ bị cắt "…" thì rê chuột xem đủ (mẫu G4: cắt + title). */}
                      {coPhu(phu[i]) && <span className="bang-phu" data-phu-odiem="" title={typeof phu[i] === 'string' ? phu[i] : undefined}>{phu[i]}</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
            {cuoi}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {congCu && <div className="flex flex-wrap items-center gap-2">{congCu}</div>}
      {khung ? <div className="card overflow-clip" aria-label={dienThoai ? ten : undefined}>{than}</div> : than}
    </div>
  );
}

/** Ô của hàng tự vẽ (`hangRieng`): cùng `data-kieu` với tiêu đề → căn, rộng, nền giống hệt ô do `Bang` vẽ. Cột tên dính trái. */
export function OBang({ c, className = '', children, ...td }: { c: DinhNghiaCot; children?: ReactNode } & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td data-kieu={c.kieu} data-tinh={c.tinh || undefined} data-tach={c.tach || undefined} className={`td ${c.kieu === 'ten' ? 'sticky-col' : ''} ${className}`} {...td}>{children}</td>
  );
}
