import { Link } from 'react-router-dom';
import { oMt, type KieuOMt, type OMtVao } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * Màu từng kiểu (mockup bản 2) — MÀU Ô = TRẠNG THÁI, chỉ token nghĩa. `xong` = xanh lá `ok` và KHÔNG chữ; chưa có đợt và chưa xếp là
 * cùng MỘT kiểu `chua-lich` (C5).
 */
export const MAU_O_MT: Record<KieuOMt, string> = {
  'chua-lich': 'border-muted-line bg-muted-bg text-muted',
  'co-lich': 'border-doing-line bg-transparent text-doing',
  'dang-thi': 'border-doing-line bg-doing-bg text-doing',
  'cho-cham': 'border-transparent bg-muted-bg text-muted',
  'cho-cham-cu': 'border-transparent bg-muted-bg text-muted',   // MT cũ chưa điểm: như mọi "chờ" (C2; OV-15a: xám, bỏ tím) — khác "chưa xếp" ở viền + chữ "chờ"
  'tre-cham': 'border-transparent bg-bad-bg text-bad',
  'con-viec': 'border-transparent bg-soon-bg text-soon',
  xong: 'border-transparent bg-ok-bg text-ok',
};
/** "Đang chọn" = màu đảo (thiet-ke/HE_GIAO_DIEN.md §2 "Đang chọn của ô MT"): nền màu chữ chính, chữ màu nền, viền cùng nền. */
const MAU_CHON = 'border-[var(--text)] bg-[var(--text)] font-bold text-[var(--bg)]';

/**
 * MỘT Ô MT, DÙNG Ở MỌI NƠI (mockup bản 2): `MT2 · W4 SEP` + tối đa MỘT chữ việc (`chờ` · `trễ W` · `vắng S` · `huỷ S`), màu = trạng thái.
 * Cỡ chip vuông lớp thường: cao 20px, chữ 11,5px. Xong / MT cũ: chỉ màu (không chữ "xong", không nhãn "cũ"); đang thi: một chấm tròn.
 * Màu không có chữ nên `aria-label` đọc đủ (`oMt().doc`). Luật ở `shared/domain/oMt.ts`; ở đây chỉ vẽ. `href` → liên kết · `onClick` → nút
 * (điện thoại: vùng bấm 44px bằng `after:`) · còn lại là chữ. `chon` = đang được chọn (màu đảo, ✓ cuối); `chuChon` thay chữ sau `MT2 ·` bằng
 * chữ mới (vd tuần sắp xếp).
 */
export function OMt({ v, homNay, ct = null, chon, chuChon, ghiChu, onClick, href, id, huy }: {
  v: OMtVao; homNay: string; ct?: string | null; chon?: boolean; chuChon?: string; /** Câu thêm cuối tooltip (vd "bấm để chọn đợt này cho riêng em"). */ ghiChu?: string;
  onClick?: (el: HTMLElement) => void; href?: string; id?: string;
  /** PR-OV4a: số MT chỉ có lượt đã huỷ — `MT2 · Đã huỷ` (chữ, không chỉ màu), viền đứt, số gạch ngang. */
  huy?: boolean;
}) {
  const r = huy ? { ...oMt(v, homNay, ct), tuan: null, viec: t('Đã huỷ'), doc: t('MT{so}, đã huỷ', { so: v.so }), title: t('MT{so} đã huỷ', { so: v.so }) } : oMt(v, homNay, ct);
  const phan = chon && chuChon !== undefined ? [chuChon] : [r.tuan, r.viec].filter(Boolean);
  const tuongTac = !!(onClick || href);
  const cls = `relative inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-md border px-1.5 text-[12px] font-semibold leading-[18px] no-underline ${
    chon ? MAU_CHON : huy ? 'border-dashed border-muted-line bg-transparent text-muted' : MAU_O_MT[r.kieu]} ${v.khongDung ? 'opacity-60' : ''} ${tuongTac ? "max-sm:after:absolute max-sm:after:-inset-y-3 max-sm:after:inset-x-0 max-sm:after:content-['']" : ''}`;
  const ruot = (
    <>
      {!chon && r.kieu === 'dang-thi' && <span aria-hidden className="h-1.5 w-1.5 flex-none rounded-full bg-current" />}
      <span className={`font-bold tabular-nums ${huy ? 'line-through' : ''}`}>MT{v.so}</span>
      {phan.map((x, i) => <span key={i} className="inline-flex items-center gap-1 tabular-nums"><span aria-hidden className="font-medium opacity-60">·</span>{x}</span>)}
      {/* OV-11a (CA3-2): "xong" có chữ ✓ như lớp thường — không chỉ màu xanh. */}
      {(chon || (!huy && r.kieu === 'xong')) && <span aria-hidden>✓</span>}
    </>
  );
  const doc = [chon && chuChon !== undefined ? `MT${v.so}, ${chuChon}` : r.doc, v.khongDung ? t('không dùng') : null, chon ? t('đang chọn') : null].filter(Boolean).join(', ');
  const tip = ghiChu ? `${r.title}\n${ghiChu}` : r.title;
  if (href) return <Link id={id} to={href} className={cls} title={tip} aria-label={doc}>{ruot}</Link>;
  if (onClick) return <button id={id} type="button" className={cls} title={tip} aria-label={doc} onClick={(e) => onClick(e.currentTarget)}>{ruot}</button>;
  return <span id={id} role="img" className={cls} title={tip} aria-label={doc}>{ruot}</span>;
}
