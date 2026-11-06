import { tuanLich } from '@shared/domain/index.ts';
import { fmtBand } from '../../../lib/format.ts';
import { t } from '@shared/i18n/index.ts';
import type { DongSEx } from './kieu.ts';

/** Số ô luôn hiện (chủ SP 06/11 "S Ex 1 2 3"); em có nhiều lượt hơn thì hiện đủ. */
const SO_O = 3;

/**
 * HÀNG S EX MẢNH dưới hàng MT của một em (chủ SP 06/11: "một thanh nhỏ bên dưới hàng của MT … ghi S Ex 1 2 3 và tuần", không mặc định gì):
 * `S Ex · 1 W2 NOV · 2 — · 3 —`. Số = thứ tự lượt theo tuần. Ô có lượt bấm mở hộp S Ex (`HopSEx`: dời / xoá + Hoàn tác cho QL / Admin, chấm cho
 * người chấm được) — máy chủ kiểm quyền. Ô trống KẾ TIẾP là nút "Xếp" khi `onThem` (người sửa được lịch Test); ô trống khác "—". Không quyền: chỉ xem.
 * Dữ liệu = `sEx` lưới đã nạp (không câu đọc thêm).
 */
export function HangSEx({ ds, onMo, onThem }: { ds: readonly DongSEx[]; onMo?: (d: DongSEx) => void; onThem?: () => void }) {
  const xep = [...ds].sort((a, b) => a.tuan.localeCompare(b.tuan) || a.id - b.id);
  const so = Math.max(SO_O, xep.length);
  return (
    <div className="hang-sex" role="group" aria-label={t('S Ex')}>
      <b className="hang-sex-nhan">{t('S Ex')}</b>
      {Array.from({ length: so }, (_, i) => {
        const x = xep[i];
        if (!x) {
          return i === xep.length && onThem
            ? <button key={`o${i}`} type="button" className="hang-sex-o hang-sex-trong" aria-label={t('Xếp S Ex {n}', { n: i + 1 })} onClick={onThem}>{i + 1} · {t('Xếp')}</button>
            : <span key={`o${i}`} className="hang-sex-o hang-sex-trong" aria-label={t('S Ex {n} chưa xếp', { n: i + 1 })}>{i + 1} · —</span>;
        }
        const tuan = tuanLich(x.tuan);
        const chu = <>{i + 1} · <span className="tabular-nums">{tuan}{x.diem !== null ? ` · ${fmtBand(x.diem)}` : ''}</span></>;
        const doc = [`${t('S Ex')} ${i + 1}`, tuan, x.diem !== null ? fmtBand(x.diem) : t('chờ chấm')].join(' · ');
        const title = [x.ngay && `${x.ngay.slice(8, 10)}/${x.ngay.slice(5, 7)}`, x.themBoi && t('{ai} thêm', { ai: x.themBoi }), x.nguoiCham && t('{ai} chấm', { ai: x.nguoiCham }), x.nhanXet]
          .filter(Boolean).join('\n') || undefined;
        return onMo && (x.sua || x.cham)
          ? <button key={`x${x.id}`} type="button" className="hang-sex-o" aria-label={doc} title={title} onClick={() => onMo(x)}>{chu}</button>
          : <span key={`x${x.id}`} className="hang-sex-o" aria-label={doc} title={title}>{chu}</span>;
      })}
    </div>
  );
}
