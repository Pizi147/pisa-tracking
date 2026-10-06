import { Link } from 'react-router-dom';
import { oMt, type KieuOMt, type OMtVao } from '@shared/domain/index.ts';

/**
 * NHÃN "cũ" cạnh số đợt (T1: "MT cũ" — nhập bù, không tính hạn): viền mảnh cùng màu chữ, KHÔNG màu nghĩa, KHÔNG ⚠ (MT cũ không phải
 * việc trễ). 11px (không nhỏ hơn: `prSang` S8). `whitespace-nowrap` để không tách dòng khỏi "MT2" trên điện thoại.
 */
export function NhanCu() {
  return (
    <span title="MT cũ — nhập bù, không tính hạn"
      className="inline-flex items-center whitespace-nowrap rounded border border-current px-[3px] align-middle text-[11px] font-bold leading-4 opacity-90">
      cũ
    </span>
  );
}

/** Màu từng kiểu (mockup phần 3) — chỉ token nghĩa. `xong` dùng `done` như `ChipKyNang` (nhãn "Xong" cạnh nhau cùng một màu). */
const MAU: Record<KieuOMt, string> = {
  'chua-co-dot': 'border-dashed border-muted-line bg-transparent text-muted',
  'chua-lich': 'border-muted-line bg-muted-bg text-muted',
  'co-lich': 'border-doing-line bg-transparent text-doing',
  'dang-thi': 'border-doing-line bg-doing-bg text-doing',
  'cho-cham': 'border-transparent bg-wait-bg text-wait',
  'tre-cham': 'border-transparent bg-bad-bg text-bad',
  'con-viec': 'border-transparent bg-soon-bg text-soon',
  xong: 'border-transparent bg-done-bg text-done',
};
/** "Đang chọn" = màu đảo (thiet-ke/HE_GIAO_DIEN.md §2 "Đang chọn của ô MT"): nền màu chữ chính, chữ màu nền, viền 2px cùng nền. */
const MAU_CHON = 'border-2 border-[var(--text)] bg-[var(--text)] px-[7px] font-bold text-[var(--bg)]';

/** Câu đọc cho người dùng đọc màn hình: "MT2, chờ chấm 2". */
function nhanDoc(so: number, kieu: KieuOMt, chu: string, cu: boolean, chon: boolean): string {
  const tt = kieu === 'chua-co-dot' ? 'chưa có đợt'
    : kieu === 'chua-lich' ? 'chưa xếp lịch'
    : kieu === 'co-lich' ? `có lịch ${chu}`
    : kieu === 'dang-thi' ? 'đang thi, tuần này'
    : kieu === 'xong' ? (chu === '✓' ? 'xong' : `xong ${chu.slice(2).trim()}`)
    : chu;
  return [`MT${so}`, tt, cu ? 'MT cũ' : null, chon ? 'đang chọn' : null].filter(Boolean).join(', ');
}

/**
 * MỘT Ô MT, DÙNG Ở MỌI NƠI (mockup phần 3): số đợt đậm + trạng thái ngắn + nhãn "cũ". Cao 26px, không xuống dòng. Luật ở
 * `shared/domain/oMt.ts` (`oMt`); ở đây chỉ vẽ. `href` → liên kết · `onClick` → nút (điện thoại: vùng bấm 44px bằng `after:`) ·
 * còn lại là chữ. `chon` = đang được chọn (màu đảo, ✓ sau chữ); `chuChon` thay chữ trạng thái bằng chữ mới (vd tuần sắp xếp).
 */
export function OMt({ v, homNay, ct = null, chon, chuChon, ghiChu, onClick, href, id }: {
  v: OMtVao; homNay: string; ct?: string | null; chon?: boolean; chuChon?: string; /** Câu thêm cuối tooltip (vd "bấm để chọn đợt này cho riêng em"). */ ghiChu?: string;
  onClick?: (el: HTMLElement) => void; href?: string; id?: string;
}) {
  const r = oMt(v, homNay, ct);
  const chu = chon && chuChon !== undefined ? chuChon : r.chu;
  const tuongTac = !!(onClick || href);
  const cls = `relative inline-flex min-h-[26px] items-center gap-1 whitespace-nowrap rounded-[7px] border px-2 py-[3px] text-[12px] font-semibold leading-none no-underline ${
    chon ? MAU_CHON : MAU[r.kieu]} ${tuongTac ? "max-sm:after:absolute max-sm:after:-inset-y-[9px] max-sm:after:inset-x-0 max-sm:after:content-['']" : ''}`;
  const ruot = (
    <>
      {!chon && r.kieu === 'dang-thi' && <span aria-hidden className="h-[7px] w-[7px] flex-none rounded-full bg-current" />}
      <span className="font-bold tabular-nums">{v.so}</span>
      {chu && <span className="tabular-nums">{chu}</span>}
      {chon && <span aria-hidden className="text-[11px]">✓</span>}
      {v.cu && <NhanCu />}
    </>
  );
  const doc = nhanDoc(v.so, r.kieu, chu, v.cu, !!chon);
  const tip = ghiChu ? `${r.title}\n${ghiChu}` : r.title;
  if (href) return <Link id={id} to={href} className={cls} title={tip} aria-label={doc}>{ruot}</Link>;
  if (onClick) return <button id={id} type="button" className={cls} title={tip} aria-label={doc} onClick={(e) => onClick(e.currentTarget)}>{ruot}</button>;
  return <span id={id} role="img" className={cls} title={tip} aria-label={doc}>{ruot}</span>;
}
