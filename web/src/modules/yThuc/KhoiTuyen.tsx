import { useState, type ReactNode } from 'react';
import { ngay, mucHan } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

import type { BuocTuyen, TrangThaiBuoc, Tuyen } from './kieu.ts';
export type { Tuyen } from './kieu.ts';

/** Tên đọc màn của trạng thái — đọc TRƯỚC tên bước (dấu khác hình, không chỉ màu). */
const DOC: Record<TrangThaiBuoc, string> = { xong: t('Xong'), dang: t('Đang ở bước này'), cho: t('Chưa tới lượt'), bo: t('Đã bỏ'), tam_dung: t('Tạm dừng') };
const LOP: Record<TrangThaiBuoc, string> = { xong: 'xong', dang: 'dang', cho: 'cho', bo: 'bo', tam_dung: 'tam' };
/**
 * CHUỖI CHẤM (TUYEN-2, mockup v27 `.cc`): một chấm một bước, cùng hình / màu với dấu của khối Tuyến (xong · đang · chưa tới lượt · bỏ · tạm dừng) — bảng nhiều em.
 * `role="img"` + nhãn "2 xong, 1 đang ở, 3 chưa tới lượt" (không chỉ màu).
 */
export function ChuoiCham({ chuoi }: { chuoi: readonly TrangThaiBuoc[] }) {
  const dem = (k: TrangThaiBuoc) => chuoi.filter((x) => x === k).length;
  const nhan = [[dem('xong'), t('xong')], [dem('dang'), t('đang ở')], [dem('tam_dung'), t('tạm dừng')], [dem('cho'), t('chưa tới lượt')], [dem('bo'), t('đã bỏ')]]
    .filter(([n]) => n).map(([n, c]) => `${n} ${c}`).join(', ');
  return <span className="cc" role="img" aria-label={nhan}>{chuoi.map((x, i) => <i key={i} className={{ xong: 'x', dang: 'd', cho: 'c', tam_dung: 't', bo: 'b' }[x]} />)}</span>;
}
/** Bước đang ở có nội dung (lời trả lại…) — panel bỏ hộp riêng khi Tuyến đã mở sẵn phần này. */
export const dangCoNoiDung = (b: BuocTuyen) => b.trangThai === 'dang' && b.coNoiDung;
/** Bước "GV gửi / TVV hỏi tình hình" (khoá máy chủ `gui`) có nội dung. */
export const guiCoNoiDung = (b: BuocTuyen) => b.khoa === 'gui' && b.coNoiDung;
/** Tuyến dài hơn chừng này bước → gập các bước đã xong (mockup v27: T0 b gập 6 bước; T2 · T3 · T4 mở sẵn 5 bước). */
const GAP_KHI = 5;

function Dau({ tt }: { tt: TrangThaiBuoc }) {
  return (
    <span className="tb-dau" aria-hidden>
      {tt === 'xong' && <svg viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-4.9" /></svg>}
      {tt === 'bo' && <svg viewBox="0 0 12 12"><path d="M3.5 3.5l5 5M8.5 3.5l-5 5" /></svg>}
      {tt === 'tam_dung' && <svg viewBox="0 0 12 12"><path d="M4.5 3.5v5M7.5 3.5v5" /></svg>}
    </span>
  );
}

/**
 * KHỐI TUYẾN (TUYEN-1, N72 ②–④; mockup `thiet-ke/v27/tuyen-cong-viec.html` T0, ghi chú mục 1) — một kiểu mọi nơi: nhãn "Tuyến · {tên}" + "Xong a/b" (chủ SP 27/11: bỏ "· đang n"),
 * một dòng một bước (dấu · tên · chi tiết · người · ngày / hạn · ˅). Dữ liệu dựng ở máy chủ (`dungTuyen`) — web không suy người / bước.
 * Bấm dòng có nội dung → mở ngay dưới dòng (không đổi panel). Không quyền xem nội dung → không ˅ (title "Không xem được nội dung").
 * Bước chưa tới lượt (○) chỉ xám ở đây — không thành việc / số / chuông (N72 ③). > 5 bước: gập các bước đã xong (bước cha còn con mở luôn hiện).
 */
type PropTuyen = { className?: string;
  /** Bước mở sẵn nội dung (mockup v27: T4 lời TVV trả ở bước đang ở · T7 nội dung GV gửi) — thay hộp nội dung riêng của panel. */ moSan?: (b: BuocTuyen) => boolean;
  /** Nội dung panel tự vẽ cho một bước (vd Báo PH: danh sách vi phạm có "Trả lại" ở bước "GV ghi n vi phạm") — thay chữ máy chủ khi mở; null = như thường. */
  thanRieng?: (b: BuocTuyen) => ReactNode | null };
export function KhoiTuyen({ tuyen, ...o }: PropTuyen & { tuyen: Tuyen | null | undefined }) {
  /* Dựng lại khi đổi tuyến (tải xong sau khối việc) — mở sẵn tính đúng lúc có dữ liệu. */
  return tuyen?.buoc.length ? <ThanTuyen key={`${tuyen.loai}:${tuyen.khoa}`} tuyen={tuyen} {...o} /> : null;
}
function ThanTuyen({ tuyen, className, moSan, thanRieng }: PropTuyen & { tuyen: Tuyen }) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const [mo, setMo] = useState<ReadonlySet<string>>(() => new Set(moSan ? tuyen.buoc.filter((b) => b.coNoiDung && moSan(b)).map((b) => b.khoa) : []));
  const [hetGap, setHetGap] = useState(false);
  const ds = tuyen.buoc;
  const chaConMo = new Set(ds.filter((b) => b.cha && b.trangThai !== 'xong' && b.trangThai !== 'bo').map((b) => b.cha!));
  const gap = !hetGap && ds.length > GAP_KHI ? ds.filter((b) => b.trangThai === 'xong' && !chaConMo.has(b.khoa)) : [];
  const an = new Set(gap.map((b) => b.khoa));
  const hien = ds.filter((b) => !an.has(b.khoa));
  const doi = (k: string) => setMo((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const dong: ReactNode[] = [];
  /* TUYEN-3 (mockup v27 T9): dòng "Lần trước…" đầu khối (tuyến Vi phạm) — cùng kiểu dòng nhãn nhóm. */
  if (tuyen.lanTruoc) dong.push(<li key="lan-truoc" className="nhom"><span>{tuyen.lanTruoc}</span></li>);
  if (gap.length) dong.push(
    <li key="xem" className="xem"><button type="button" aria-expanded={false} onClick={() => setHetGap(true)}>
      {t('Xem {n} bước đã xong', { n: gap.length })}<svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current" strokeWidth={1.6}><path d="M3 4.5L6 7.5 9 4.5" /></svg></button></li>,
  );
  hien.forEach((b, i) => {
    /* Song song (`cungLuc`): dòng nhãn "Cùng lúc · n bước" trước dải bước cùng lúc, các bước đó thụt như bước con. */
    if (b.cungLuc && !hien[i - 1]?.cungLuc) {
      let n = 0; while (hien[i + n]?.cungLuc) n++;
      /* TUYEN-3 (mockup v27 T9): các bước cùng lúc CHỜ bước người xem đang giữ → "Sau khi bạn duyệt · cùng lúc" (Head duyệt) / "Sau bước của bạn · cùng lúc". */
      const truoc = hien[i - 1];
      const sauToi = !!truoc?.laToi && truoc.trangThai === 'dang' && hien.slice(i, i + n).every((x) => x.trangThai === 'cho');
      dong.push(<li key={`nhom-${b.khoa}`} className="nhom"><span>{sauToi ? (truoc!.khoa === 'duyet' ? t('Sau khi bạn duyệt · cùng lúc') : t('Sau bước của bạn · cùng lúc')) : t('Cùng lúc · {n} bước', { n })}</span></li>);
    }
    const con = !!b.cha || b.cungLuc;
    const rieng = thanRieng?.(b) ?? null;
    const coNd = b.coNoiDung || !!rieng;
    const moNd = coNd && mo.has(b.khoa);
    const nguoi = b.laToi ? <span className="ban">{t('Bạn')}</span> : b.nguoi;
    /* Ngày: đã làm → ngày · đang / tạm dừng → "hạn dd/mm/yyyy" tô theo hạn · chưa tới lượt → điều kiện ("sau khi Head duyệt"). */
    const cho = b.trangThai === 'cho';
    const muc = b.han && (b.trangThai === 'dang') && hn ? mucHan(b.han, hn) : 'xa';
    const ngayVe = b.trangThai === 'tam_dung' ? (b.chiTiet ?? (b.han ? ngay(b.han) : null))
      : b.han && !b.ngay ? <><span className="chu">{t('hạn')} </span>{ngay(b.han)}</>
        : b.ngay ? ngay(b.ngay) : cho ? b.chiTiet : null;
    const chiTiet = cho || b.trangThai === 'tam_dung' ? null : b.chiTiet;
    dong.push(
      /* Cả dòng bấm được nhờ lớp phủ `::after` của nút ˅ (`.tb-mo`) — không gắn click lên <li>. */
      <li key={b.khoa} className={`tb ${LOP[b.trangThai]}${con ? ' con' : ''}`} title={b.khongQuyen ? t('Không xem được nội dung') : undefined}>
        <Dau tt={b.trangThai} />
        <span className="tb-ten"><span className="sr-only">{DOC[b.trangThai]}: </span>{b.ten}</span>
        <span className="tb-ct" title={chiTiet ?? undefined}>{chiTiet}</span>
        <span className="tb-ng">{nguoi}</span>
        <span className={`tb-ngay${muc === 'sap' ? ' gan' : muc === 'qua' ? ' qua' : ''}`}>{ngayVe}</span>
        {coNd
          ? <button type="button" className="tb-mo" aria-expanded={moNd} aria-label={moNd ? t('Thu gọn {ten}', { ten: b.ten }) : t('Xem nội dung {ten}', { ten: b.ten })}
            onClick={() => doi(b.khoa)}>
            <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current" strokeWidth={1.6}><path d={moNd ? 'M3 7.5L6 4.5 9 7.5' : 'M3 4.5L6 7.5 9 4.5'} /></svg></button>
          : <span />}
        {/* 375 (khung ≤ 560 px): tầng hai — người · chi tiết. */}
        <span className="tb-phu2">{[b.laToi ? t('Bạn') : b.nguoi, chiTiet].filter(Boolean).join(' · ')}</span>
      </li>,
    );
    if (moNd) dong.push(<li key={`nd-${b.khoa}`} className="nd">{rieng ? <div className="nd-rieng">{rieng}</div> : <div className="nd-than">{b.noiDung}</div>}</li>);
  });

  return (
    <section className={`tn ${className ?? ''}`} aria-label={t('Tuyến · {ten}', { ten: tuyen.tieuDe })}>
      <div className="tn-dau">
        <h3>{t('Tuyến')}</h3>
        <span className="ten-tn">{tuyen.tieuDe}</span>
        <span className="phai">
          <span className="tien">{t('Xong')} <b>{tuyen.xong}/{tuyen.tong}</b></span>
          <NutLuat label={t('Về tuyến')} phai>
            <p className="m-0">{t('Cả tuyến việc của em: bước đã xong ✓, bước đang ở ●, bước chưa tới lượt ○ (chưa thành việc của ai), đã bỏ ×, tạm dừng ⏸.')}</p>
            <p className="m-0">{t('Bấm một bước đã xong để xem nội dung, nếu bạn được xem phần đó.')}</p>
          </NutLuat>
        </span>
      </div>
      <ul className="tn-ds">{dong}</ul>
    </section>
  );
}
