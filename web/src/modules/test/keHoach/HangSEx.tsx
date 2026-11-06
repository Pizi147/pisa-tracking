import { tuanLich } from '@shared/domain/index.ts';
import { fmtBand } from '../../../lib/format.ts';
import { t } from '@shared/i18n/index.ts';
import type { DongSEx } from './kieu.ts';

/**
 * Ô S EX DẸT (chủ SP 06/11: "S Ex cũng để một box dẹt nhỏ ngang cùng với từng đợt MT chính nhé") — hàng dưới hàng MT, mỗi lượt một ô dẹt (26 px)
 * thẳng cột MT: S Ex 1 dưới MT1, 2 dưới MT2… (số = thứ tự theo tuần, không phải suất). Ô có lượt: tuần (+ band), bấm mở hộp S Ex (`HopSEx`:
 * dời, Xoá + Hoàn tác, chấm) khi sửa / chấm được. Ô trống: "+ S Ex" khi `onThem` (người sửa được lịch Test — máy chủ kiểm), không thì trống nhạt.
 * Dữ liệu = `sEx` lưới đã nạp (không câu đọc thêm).
 */
export const sapSEx = (ds: readonly DongSEx[]) => [...ds].sort((a, b) => a.tuan.localeCompare(b.tuan) || a.id - b.id);

export function OSEx({ x, so, onMo, onThem }: { x: DongSEx | null; so: number; onMo?: (d: DongSEx) => void; onThem?: () => void }) {
  if (!x) {
    return onThem
      ? <button type="button" className="o-sex o-sex-trong o-sex-them" aria-label={t('Xếp S Ex {n}', { n: so })} onClick={onThem}>{t('+ S Ex {n}', { n: so })}</button>
      : <span className="o-sex o-sex-trong" aria-label={t('S Ex {n} chưa xếp', { n: so })}>{t('S Ex {n}', { n: so })} —</span>;
  }
  const tuan = tuanLich(x.tuan);
  const doc = [`${t('S Ex')} ${so}`, tuan, x.diem !== null ? fmtBand(x.diem) : t('chờ chấm')].join(' · ');
  const title = [x.ngay && `${x.ngay.slice(8, 10)}/${x.ngay.slice(5, 7)}`, x.themBoi && t('{ai} thêm', { ai: x.themBoi }), x.nguoiCham && t('{ai} chấm', { ai: x.nguoiCham }), x.nhanXet]
    .filter(Boolean).join('\n') || undefined;
  const chu = <><b className="o-sex-nhan">{t('S Ex {n}', { n: so })}</b><span className="o-sex-tuan">{tuan}</span>{x.diem !== null && <b className="tabular-nums">{fmtBand(x.diem)}</b>}</>;
  return onMo && (x.sua || x.cham)
    ? <button type="button" className="o-sex" aria-label={doc} title={title} onClick={() => onMo(x)}>{chu}</button>
    : <span className="o-sex" aria-label={doc} title={title}>{chu}</span>;
}

/** 375: thẻ em không có cột MT — chữ "S Ex" nhỏ + các ô dẹt chia đều (tối thiểu 3). */
export function HangSExThe({ ds, onMo, onThem }: { ds: readonly DongSEx[]; onMo?: (d: DongSEx) => void; onThem?: () => void }) {
  const xep = sapSEx(ds);
  return (
    <div className="hang-sex" role="group" aria-label={t('S Ex')}>
      {Array.from({ length: Math.max(3, xep.length) }, (_, i) => (
        <OSEx key={xep[i] ? `x${xep[i].id}` : `o${i}`} x={xep[i] ?? null} so={i + 1} onMo={onMo} onThem={onThem} />
      ))}
    </div>
  );
}
