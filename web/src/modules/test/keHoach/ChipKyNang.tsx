import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { nhanTuanKhoa, type LoaiTtGon, type MonGon, type OGon } from '@shared/domain/index.ts';
import { fmtBand } from '../../../lib/format.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * Ô MỘT ĐỢT của lưới Kế hoạch Test (mockup `thiet-ke/v7/ke-hoach-test.html`, chủ SP chốt 28/10) — dùng chung FT và lớp thường.
 * Mỗi DÒNG một tuần thi: tuần (cột 58 px) + ô môn có khung (`L ✓` · `L` · `S trễ chấm`) + trạng thái dòng; điểm tổng sau các môn dòng đầu;
 * "không thi W S" chữ mờ; vắng chữ thường ở dòng cuối. Chỉ ô cần chú ý có vạch trái (tuần này · trễ chấm + nền đỏ nhạt · xếp lại).
 * Nội dung do `oGon` quyết — ở đây chỉ vẽ.
 */
const VACH: Partial<Record<LoaiTtGon, string>> = {
  nay: 'shadow-[inset_3px_0_0_rgb(var(--doing-rgb))]',
  tre: 'shadow-[inset_3px_0_0_rgb(var(--bad-rgb))]',
  vang: 'shadow-[inset_3px_0_0_rgb(var(--soon-rgb))]',
};
const MAU_TT: Record<LoaiTtGon, string> = {
  nay: 'text-doing', tre: 'text-bad', cho: 'text-dim', vang: 'text-soon', xong: 'text-ok', chua: 'text-dim', xep: 'text-faint font-medium',
};
const CHU_MON: Record<MonGon['loai'], string> = { co: t('có điểm'), cho: t('chưa có điểm'), tre: t('trễ chấm') };
const O_MON: Record<MonGon['loai'], string> = {
  co: 'border-ok-line text-ok',
  cho: 'border-[var(--line-strong)] text-[var(--text)]',
  tre: 'border-bad-line text-bad',
};

/** Khung bấm chung của mọi ô lưới (ô đợt, "Xếp MTn", đã huỷ): cao ≥ 56, chữ trái, rê sáng nhẹ, focus viền nhấn. */
export const O_LUOI = 'flex w-full min-h-[56px] flex-col justify-center gap-[3px] border-0 bg-transparent px-2 py-1.5 text-left'
  + ' hover:bg-[var(--nut-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]';

export function ODotGon({ o, nhan, ketQua, khoa, chon, onMo, href, tinh = false, children }: {
  o: OGon;
  /** Tên đợt đọc màn (`MT3`, `Progress Test`). */
  nhan: string;
  /** FT đợt xong: Overall + đạt kỳ vọng (null: không có kỳ vọng). */
  ketQua?: { ovr: number; dat: boolean | null; kyVong?: number | null } | null;
  /** Lớp thường: tuần trong khoá (`W4/8`) của tuần chính. */
  khoa?: { khaiGiang: string | null; tongTuan: number | null; tuan: string | null } | null;
  chon?: boolean;
  onMo: (el: HTMLElement) => void;
  /** GV chỉ xem: ô là LINK tới trang lượt (Ctrl / chuột giữa mở tab mới) thay vì mở hộp. */
  href?: string | null;
  /** Mẫu tĩnh: không bấm, không nhận Tab. */
  tinh?: boolean;
  /** Dòng ghi chú lịch (sửa tại chỗ) — dưới ô, ngoài nút. */
  children?: ReactNode;
}) {
  const kq = o.xong && ketQua ? ketQua : null;
  const nhanKhoa = khoa ? nhanTuanKhoa(khoa.tuan, khoa.khaiGiang, khoa.tongTuan) : null;
  const doc = [
    nhan,
    ...o.dong.map((d) => [d.tuanDu ?? t('chưa xếp'), ...d.mon.map((m) => `${m.ten} ${CHU_MON[m.loai]}`), d.tt?.chu].filter(Boolean).join(' ')),
    kq ? `${kq.dat === null ? '' : kq.dat ? '✓ ' : '✗ '}${t('Overall')} ${fmtBand(kq.ovr)}${kq.kyVong != null ? ` · ${t('kỳ vọng')} ${fmtBand(kq.kyVong)}` : ''}` : o.tt && o.tt.loai !== 'xong' ? o.tt.chu : null,
    o.khongThi, o.vang,
  ].filter(Boolean).join(', ');
  /* Chủ SP 28/10: khung ô MT rõ hẳn — viền mảnh + nền tối hơn thẻ (`--bg`); ô trễ chấm vẫn nền đỏ nhạt (VACH đè). */
  /* `O_LUOI` có `border-0 bg-transparent` (dùng chung) — khung ô MT phải `!`; ô trễ: nền + viền đỏ nhạt thay nền tối (một lớp nền, không chồng). */
  const tre = o.tt?.loai === 'tre';
  const lop = `${O_LUOI} rounded-md !border ${tre ? '!border-bad-line !bg-bad-bg' : '!border-[var(--line-strong)] !bg-[var(--bg)] hover:!bg-[var(--nut-hover)]'} ${o.tt ? VACH[o.tt.loai] ?? '' : ''} ${chon ? 'ring-2 ring-inset ring-[var(--text)]' : ''}`;
  /* "xếp lại S" / "chờ duyệt" không thuộc dòng tuần nào (môn đang vắng) — đặt ở dòng đầu khi dòng đó chưa có chữ. */
  const ttO = o.tt?.loai === 'vang' ? o.tt : null;
  const noi = (
    <>
      {o.dong.map((d, i) => {
        const mo = d.tt?.loai === 'xep';   // tuần tương lai: tuần mờ
        /* PTA 28/10 — một luật: môn trễ = ô viền đỏ, chữ "trễ chấm" MỘT lần ở cuối dòng tuần (kể cả chỉ một môn trễ). */
        const coTre = d.mon.some((m) => m.loai === 'tre');
        const tt = coTre ? { chu: t('trễ chấm'), loai: 'tre' as const } : i === 0 && ttO && !d.tt ? ttO : d.tt;
        return (
          /* PTA 28/10: cột tuần 58 px cố định; môn / chữ không đủ chỗ thì xuống dòng THỤT dưới cột môn (không nới cột, không cuộn ngang). */
          <span key={d.tuanDu ?? `chua-${i}`} className="grid min-w-0 grid-cols-[58px_minmax(0,1fr)] items-start gap-x-1">
            <span className={`whitespace-nowrap text-sm leading-5 tabular-nums ${mo ? 'font-medium text-dim' : 'font-semibold text-slate-100'}`}>{d.tuan ?? '—'}</span>
            <span className="flex min-h-5 min-w-0 flex-wrap items-center gap-x-1 gap-y-[3px]">
            {i === 0 && nhanKhoa && <span className="whitespace-nowrap text-xs tabular-nums text-faint">{nhanKhoa}</span>}
            {o.hienMon && d.mon.map((m) => (
              <span key={m.k} title={`${m.ten} · ${CHU_MON[m.loai]}`}
                className={`inline-flex h-5 items-center whitespace-nowrap rounded border px-[3px] text-xs font-semibold leading-none tabular-nums ${O_MON[m.loai]}`}>
                {m.ten}{m.loai === 'co' ? '✓' : ''}
              </span>
            ))}
            {i === 0 && kq ? (
              <span className={`whitespace-nowrap text-[13px] font-semibold tabular-nums ${kq.dat === false ? 'text-bad' : 'text-ok'}`}>
                {kq.dat === null ? '' : kq.dat ? '✓ ' : '✗ '}{fmtBand(kq.ovr)}
              </span>
            ) : tt && tt.loai !== 'xong' && <span className={`whitespace-nowrap text-xs font-semibold ${MAU_TT[tt.loai]}`}>{tt.chu}</span>}
            {i === 0 && o.khongThi && <span className="whitespace-nowrap text-xs text-faint">· {o.khongThi}</span>}
            </span>
          </span>
        );
      })}
      {o.vang && <span className="truncate text-xs tabular-nums text-faint" title={o.vang}>{o.vang}</span>}
    </>
  );
  return (
    <div>
      {tinh ? <span className={`${lop} hover:bg-transparent`}>{noi}</span>
        : href ? <Link to={href} aria-label={doc} title={doc} className={`${lop} no-underline`}>{noi}</Link>
        : <button type="button" onClick={(e) => onMo(e.currentTarget)} aria-label={doc} title={doc} className={lop}>{noi}</button>}
      {children}
    </div>
  );
}

/** Ô MT KẾ TIẾP chưa xếp: nút viền đứt "Xếp MTn" (QL); GV chỉ xem: chữ mờ "chưa xếp". MT sau nữa: "–" (`OTrong`). */
export function NutXepO({ chu, title, onMo }: { chu: string; title?: string; onMo?: (el: HTMLElement) => void }) {
  if (!onMo) return <span className="block px-2 text-xs text-faint" title={title}>{t('chưa xếp')}</span>;
  return (
    <button type="button" onClick={(e) => onMo(e.currentTarget)} title={title} className={`${O_LUOI} group items-start hover:bg-transparent`}>
      <span className="inline-flex h-[26px] items-center whitespace-nowrap rounded-md border border-dashed border-[var(--muted-line)] px-2.5 text-xs font-medium text-dim group-hover:border-[var(--accent-line)] group-hover:text-[var(--text)]">{chu}</span>
    </button>
  );
}

/** Ô không có gì để làm (MT sau MT kế tiếp, Checkpoint em không có). */
export const OTrong = ({ title }: { title?: string }) => <span className="block px-2 text-faint" title={title}>–</span>;

/** Ô đợt chỉ còn lượt đã huỷ: "đã huỷ"; bấm mở hộp Khôi phục (QL). */
export function OHuy({ onMo }: { onMo?: (el: HTMLElement) => void }) {
  const noi = <span className="text-xs font-semibold text-dim">{t('đã huỷ')}</span>;
  return onMo
    ? <button type="button" onClick={(e) => onMo(e.currentTarget)} title={t('Bấm để xem / khôi phục')} className={O_LUOI}>{noi}</button>
    : <span className={`${O_LUOI} hover:bg-transparent`}>{noi}</span>;
}
