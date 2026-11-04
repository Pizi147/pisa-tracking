import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { O_KE_HOACH, nhanTuanKhoa, tenMonNgan, type KyNangKH, type MonGon, type OGon, type OKyNang } from '@shared/domain/index.ts';
import { ODiem } from '../../../ui/ODiem.tsx';
import { kqOverall } from '../../students/GocLichThi.tsx';
import { fmtBand } from '../../../lib/format.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * Ô MỘT ĐỢT của lưới Kế hoạch Test (U05, mockup `thiet-ke/v11/ke-hoach-test.html` khu A — chủ SP 03/11 khuya, 14-ra-ux-b 11.2) — dùng chung FT và lớp thường.
 * Mỗi DÒNG một tuần thi: tuần + 4 vị trí badge môn cố định (L R W S): môn thi tuần đó sáng, môn khác MỜ HẲN (giữ chỗ, đọc màn "không thi").
 * Môn dời vì vắng → dòng "Vắng → W2 NOV". Dòng cuối = trạng thái CHỮ: điểm "✓ 6.5" (ODiem) · "Đang làm bài" · "Chờ chấm" (badge môn chờ viền vàng) ·
 * "⚠ Quá hạn chấm" (badge môn nền đỏ đặc) · "Vắng · xếp lại S" (vàng rõ — 30-pr-giao-dien U05). Nội dung do `oGon` quyết — ở đây chỉ vẽ.
 */
const CHU_MON: Record<MonGon['loai'], string> = { co: t('có điểm'), cho: t('chưa có điểm'), tre: t('trễ chấm') };

export function ODotGon({ o, kn, ct = null, nhan, ketQua, khoa, chon, onMo, href, children }: {
  o: OGon;
  /** Ô kỹ năng của đợt (thứ tự badge, môn dời vì vắng `doiTu`). */
  kn: Partial<Record<KyNangKH, OKyNang>>;
  ct?: string | null;
  /** Tên đợt đọc màn (`MT3`, `Progress Test`). */
  nhan: string;
  /** FT đợt xong: Overall + kỳ vọng (null: không có kỳ vọng). */
  ketQua?: { ovr: number; dat: boolean | null; kyVong?: number | null } | null;
  /** Lớp thường: tuần trong khoá (`W4/8`) của tuần chính. */
  khoa?: { khaiGiang: string | null; tongTuan: number | null; tuan: string | null } | null;
  chon?: boolean;
  onMo: (el: HTMLElement) => void;
  /** GV chỉ xem: ô là LINK tới trang lượt (Ctrl / chuột giữa mở tab mới) thay vì mở hộp. */
  href?: string | null;
  /** Dòng ghi chú lịch (sửa tại chỗ) — dưới ô, ngoài nút. */
  children?: ReactNode;
}) {
  const kq = o.xong && ketQua ? ketQua : null;
  const nhanKhoa = khoa ? nhanTuanKhoa(khoa.tuan, khoa.khaiGiang, khoa.tongTuan) : null;
  const mon = O_KE_HOACH.filter((k) => kn[k]);
  const choCham = o.dong.some((d) => d.tt?.loai === 'cho');
  /* Một chữ trạng thái cho cả ô, theo mức cần làm: trễ chấm > vắng chờ xếp > chờ chấm > đang làm bài > chưa xếp tuần. */
  const tt: { chu: string; lop: string } | null = kq ? null
    : o.tt?.loai === 'tre' ? { chu: `⚠ ${t('Quá hạn chấm')}`, lop: 'text-bad' }
    : o.tt?.loai === 'vang' ? { chu: `${t('Vắng')} · ${o.tt.chu}`, lop: 'text-soon' }
    : choCham ? { chu: t('Chờ chấm'), lop: 'text-soon' }
    : o.tt?.loai === 'nay' || o.dong.some((d) => d.tt?.loai === 'nay') ? { chu: t('Đang làm bài'), lop: 'text-doing' }
    : o.dong.some((d) => d.tt?.loai === 'chua') ? { chu: t('Chưa xếp tuần'), lop: 'text-dim' } : null;
  const doc = [
    nhan,
    ...o.dong.map((d) => [d.tuanDu ?? t('chưa xếp'), ...d.mon.map((m) => `${m.ten} ${CHU_MON[m.loai]}`)].join(' ')),
    kq ? `${kq.dat === null ? '' : kq.dat ? '✓ ' : '✗ '}${t('Overall')} ${fmtBand(kq.ovr)}${kq.kyVong != null ? ` · ${t('kỳ vọng')} ${fmtBand(kq.kyVong)}` : ''}` : tt?.chu,
    o.khongThi, o.vang,
  ].filter(Boolean).join(', ');
  const vien = o.tt?.loai === 'tre' ? 'o-kh-tre' : tt?.lop === 'text-doing' ? 'o-kh-dang' : '';
  const lop = `o-kh ${vien} ${chon ? 'o-kh-chon' : ''}`;
  const noi = (
    <>
      {o.dong.map((d, i) => {
        const coMat = new Map(d.mon.map((m) => [m.k, m]));
        const vang = d.mon.length > 0 && d.mon.every((m) => !!kn[m.k]?.doiTu);
        return (
          <span key={d.tuanDu ?? `chua-${i}`} className="o-kh-hang">
            <span className="o-kh-tuan">{vang ? `${t('Vắng')} → ` : ''}{d.tuan ?? '—'}</span>
            <span className="o-kh-mon">
              {mon.map((k) => {
                const m = coMat.get(k);
                const ten = tenMonNgan(ct, k);
                const kieu = !m ? 'knb-tat' : m.loai === 'tre' ? 'knb-qua' : m.loai === 'cho' && d.tt?.loai === 'cho' ? 'knb-cho' : '';
                return <span key={k} className={`knb ${kieu}`} aria-label={!m ? t('{m} không thi', { m: ten }) : `${ten} ${CHU_MON[m.loai]}`}>{ten}</span>;
              })}
            </span>
          </span>
        );
      })}
      {(kq || tt || nhanKhoa) && (
        <span className="o-kh-tt">
          {nhanKhoa && <span className="text-xs font-normal tabular-nums text-faint">{nhanKhoa}</span>}
          {kq ? <ODiem so={fmtBand(kq.ovr)} kq={kq.kyVong == null ? null : kqOverall(kq.ovr, kq.kyVong)} nhan="Overall" />
            : tt && <span className={tt.lop}>{tt.chu}</span>}
        </span>
      )}
    </>
  );
  return (
    <div>
      {href ? <Link to={href} aria-label={doc} title={doc} className={`${lop} no-underline`}>{noi}</Link>
        : <button type="button" onClick={(e) => onMo(e.currentTarget)} aria-label={doc} title={doc} className={lop}>{noi}</button>}
      {children}
    </div>
  );
}

/** Ô MT KẾ TIẾP chưa xếp: nút "Xếp MTn" (mockup `.oxep`; `ke` = em chưa có MT kế tiếp nào → viền nhấn đậm). GV chỉ xem: "—" như lượt không áp dụng. */
export function NutXepO({ chu, title, ke = false, onMo }: { chu: string; title?: string; ke?: boolean; onMo?: (el: HTMLElement) => void }) {
  if (!onMo) return <OTrong title={title} />;
  return <button type="button" onClick={(e) => onMo(e.currentTarget)} title={title} className={`o-xep ${ke ? 'o-xep-ke' : ''}`}>{chu}</button>;
}

/** Ô không có gì để làm (MT sau MT kế tiếp, Checkpoint em không có) — mockup `.okhong` "—". */
export const OTrong = ({ title }: { title?: string }) => <span className="o-kh-khong" title={title}>—</span>;

/** Ô đợt chỉ còn lượt đã huỷ: khung đứt "Đã huỷ" (mockup `.omt.huy`); bấm mở hộp Khôi phục (QL). */
export function OHuy({ onMo }: { onMo?: (el: HTMLElement) => void }) {
  const noi = <span className="o-kh-tt text-faint">{t('Đã huỷ')}</span>;
  return onMo
    ? <button type="button" onClick={(e) => onMo(e.currentTarget)} title={t('Bấm để xem / khôi phục')} className="o-kh o-kh-huy">{noi}</button>
    : <span className="o-kh o-kh-huy">{noi}</span>;
}
