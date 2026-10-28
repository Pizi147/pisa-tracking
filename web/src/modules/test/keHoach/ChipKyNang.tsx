import type { ReactNode } from 'react';
import { nhanTuanKhoa, type KnGon, type LoaiTtGon, type OGon } from '@shared/domain/index.ts';
import { fmtBand } from '../../../lib/format.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * Ô MỘT ĐỢT của lưới Kế hoạch Test BẢN GỌN (chủ SP duyệt mockup `thiet-ke/v7/ke-hoach-test.html` #659, 28/10) — dùng chung FT và lớp thường.
 * Không khung: dòng 1 = tuần (cột rộng cố định) + kết quả ✓ / ✗ HOẶC một chữ trạng thái (cùng một x mọi ô); ô kỹ năng / dòng riêng / dòng vắng
 * chỉ khi cần (`oGon`). Chỉ ô cần chú ý có vạch trái (tuần này · trễ chấm + nền đỏ nhạt · cần xếp lại). Nội dung do `oGon` quyết — ở đây chỉ vẽ.
 */
const VACH: Partial<Record<LoaiTtGon, string>> = {
  nay: 'shadow-[inset_3px_0_0_rgb(var(--doing-rgb))]',
  tre: '!bg-bad-bg shadow-[inset_3px_0_0_rgb(var(--bad-rgb))]',
  vang: 'shadow-[inset_3px_0_0_rgb(var(--soon-rgb))]',
};
/** `bg-transparent` của khung ô đè nền trễ — nên `!bg-bad-bg`. */
const MAU_TT: Record<LoaiTtGon, string> = {
  nay: 'text-doing', tre: 'text-bad', cho: 'text-dim', vang: 'text-soon', xong: 'text-ok', chua: 'text-dim',
};
const CHU_KN: Record<KnGon['loai'], string> = { co: t('có điểm'), chua: t('chưa có điểm'), khong: t('không thi trong đợt') };
const O_KN: Record<KnGon['loai'], string> = {
  co: 'bg-[var(--line-strong)] text-[var(--text)]',
  chua: 'border border-dashed border-[var(--o-nhap-vien)] text-dim',
  khong: 'text-faint line-through',
};

/** Khung bấm chung của mọi ô lưới (ô đợt, "Xếp MTn", đã huỷ): cao ≥ 56, chữ trái, rê sáng nhẹ, focus viền nhấn. */
export const O_LUOI = 'flex w-full min-h-[56px] flex-col justify-center gap-[3px] border-0 bg-transparent px-2 py-1.5 text-left'
  + ' hover:bg-[var(--nut-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]';

export function ODotGon({ o, nhan, ketQua, khoa, chon, onMo, children }: {
  o: OGon;
  /** Tên đợt đọc màn (`MT3`, `Progress Test`). */
  nhan: string;
  /** FT đợt xong: Overall + đạt kỳ vọng (null: không có kỳ vọng). */
  ketQua?: { ovr: number; dat: boolean | null } | null;
  /** Lớp thường: tuần trong khoá (`W4/8`) của tuần chính. */
  khoa?: { khaiGiang: string | null; tongTuan: number | null; tuan: string | null } | null;
  chon?: boolean;
  onMo: (el: HTMLElement) => void;
  /** Dòng ghi chú lịch (sửa tại chỗ) — dưới ô, ngoài nút. */
  children?: ReactNode;
}) {
  const kq = o.xong && ketQua ? ketQua : null;
  const nhanKhoa = khoa ? nhanTuanKhoa(khoa.tuan, khoa.khaiGiang, khoa.tongTuan) : null;
  const mo = !o.tt && !o.xong;   // đã xếp, chưa tới tuần: tuần mờ, không chữ
  const doc = [
    nhan, o.tuanDu ?? o.tuan ?? t('chưa xếp'),
    kq ? `${kq.dat === null ? '' : kq.dat ? '✓ ' : '✗ '}${t('Overall')} ${fmtBand(kq.ovr)}` : o.tt?.chu,
    o.kn?.map((k) => `${k.ten} ${CHU_KN[k.loai]}`).join(', '), o.rieng, o.vang,
  ].filter(Boolean).join(', ');
  return (
    <div>
      <button type="button" onClick={(e) => onMo(e.currentTarget)} aria-label={doc} title={doc}
        className={`${O_LUOI} ${o.tt ? VACH[o.tt.loai] ?? '' : ''} ${chon ? 'ring-2 ring-inset ring-[var(--text)]' : ''}`}>
        <span className="flex items-baseline gap-1.5">
          <span className={`w-14 shrink-0 whitespace-nowrap text-sm tabular-nums ${mo ? 'font-medium text-dim' : 'font-semibold text-slate-100'}`}>{o.tuan ?? '—'}</span>
          {nhanKhoa && <span className="whitespace-nowrap text-xs tabular-nums text-faint">{nhanKhoa}</span>}
          {kq ? (
            <span className={`whitespace-nowrap text-[13px] font-semibold tabular-nums ${kq.dat === false ? 'text-bad' : 'text-ok'}`}>
              {kq.dat === null ? '' : kq.dat ? '✓ ' : '✗ '}{fmtBand(kq.ovr)}
            </span>
          ) : o.tt && <span className={`whitespace-nowrap text-xs font-semibold ${MAU_TT[o.tt.loai]}`}>{o.tt.chu}</span>}
        </span>
        {o.kn && (
          <span className="flex gap-[3px]" aria-hidden>
            {o.kn.map((k) => (
              <i key={k.k} title={`${k.ten} · ${CHU_KN[k.loai]}`}
                className={`inline-grid h-5 min-w-5 place-items-center rounded-[3px] px-[3px] text-xs font-semibold not-italic leading-none tabular-nums ${O_KN[k.loai]}`}>{k.ten}</i>
            ))}
          </span>
        )}
        {o.rieng && <span className="truncate text-xs tabular-nums text-faint">{o.rieng}</span>}
        {o.vang && <span className="truncate text-xs tabular-nums text-faint">{o.vang}</span>}
      </button>
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

/** Chú giải ⓘ (thay chú giải màu cũ) — 6 dòng theo mockup; mẫu dựng bằng chính `ODotGon`. */
export function ChuGiaiGon() {
  const mau = (o: Partial<OGon>, ketQua?: { ovr: number; dat: boolean }) => (
    <ODotGon o={{ tuan: 'W1 OCT', tuanDu: null, xong: false, tt: null, kn: null, rieng: null, vang: null, ...o }} nhan="" ketQua={ketQua} onMo={() => undefined} />
  );
  const dong: [ReactNode, string][] = [
    [mau({ xong: true, tt: { chu: t('xong'), loai: 'xong' } }, { ovr: 6, dat: true }), t('Đã xong — Overall, ✓ đạt / ✗ chưa đạt kỳ vọng; không có Overall ghi "xong"')],
    [mau({ tuan: 'W2 DEC' }), t('Đã xếp, chưa tới tuần')],
    [mau({ tuan: 'W5 OCT', tt: { chu: t('tuần này'), loai: 'nay' } }), t('Đang làm bài tuần này')],
    [mau({ tuan: 'W3 OCT', tt: { chu: t('trễ chấm'), loai: 'tre' } }), t('Qua hạn chấm, còn bài chưa có điểm')],
    [mau({ tuan: 'W3 OCT', tt: { chu: t('chờ chấm'), loai: 'cho' }, kn: [{ k: 'listening', ten: 'L', loai: 'co' }, { k: 'speaking', ten: 'S', loai: 'chua' }, { k: 'writing', ten: 'W', loai: 'khong' }] }),
      t('Ô đặc = có điểm · viền đứt = chưa có điểm · chữ gạch = không thi trong đợt')],
    [mau({ tuan: 'W2 NOV', vang: t('vắng {x} · {tuan}', { x: 'W', tuan: 'W1 NOV' }) }), t('Đã vắng, đã dời — hết ghi khi đủ điểm; chữ vàng "xếp lại" = Quản lý cần xếp lại')],
  ];
  return (
    <span className="mt-2 grid grid-cols-[132px_1fr] items-center gap-x-3 gap-y-1">
      {dong.map(([o, chu], i) => <span key={i} className="contents"><span className="pointer-events-none" aria-hidden>{o}</span><span className="text-xs">{chu}</span></span>)}
    </span>
  );
}
