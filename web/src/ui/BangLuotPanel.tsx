import { Link } from 'react-router-dom';
import { KhungPanel } from './KhungPanel.tsx';
import { Bang } from './Bang.tsx';
import { ODiem } from './ODiem.tsx';
import { ErrorState, Skeleton } from './ui.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { fmtBand } from '../lib/format.ts';
import type { ApiError } from '../lib/api.ts';
import { duongDotTest, duongHoSoHocVien, ngay, tuanLich, type DinhNghiaCot } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type ODiemLuot = { v: number; kq: 'vuot' | 'bang' | 'duoi' | null } | null;
/** `server/src/phanTich/tongHop.ts` `DongLuotDiem` — một lượt của panel số Test + SOS (FT). */
export type DongLuotDiem = { studentId: number; ten: string; classId: number | null; lop: string; mt: number; tuan: string; kn: Record<'l' | 'r' | 'w1' | 'w2' | 's', ODiemLuot> };
export type DuLieuBangLuot = { n: number; rows: { id: number; luotDiem?: DongLuotDiem }[]; bangLuot?: boolean; cachTinh?: string | null; chiNhanh?: string | null };

const KN = [['l', 'L'], ['r', 'R'], ['w1', 'W1'], ['w2', 'W2'], ['s', 'S']] as const;
const COT: DinhNghiaCot[] = [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 170 }, { key: 'lop', nhan: t('Lớp'), kieu: 'chu', rong: 110 }, { key: 'mt', nhan: 'MT', kieu: 'chu', rong: 120 },
  ...KN.map(([k, n]): DinhNghiaCot => ({ key: k, nhan: n, kieu: 'diem', rong: 56 })),
];
/** Link chữ thường (U08-6): rê / focus mới báo. */
const LINK = 'rounded-sm text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline hover:underline-offset-[3px] focus-visible:text-[color:var(--accent)] focus-visible:underline';

/**
 * PANEL SỐ TEST + SOS · BẢNG LƯỢT (U08-2, mockup V11 A2 — PTA chốt 05/11 làm bảng): đầu "SỐ · TEST + SOS" · "SOS 2 · W2 SEP" · "chi nhánh · Fast Track ·
 * dữ liệu đến dd/mm" → "n lượt · m HV" → bảng Học viên · Lớp · MT · L R W1 W2 S (ô `ODiem` ✓ / ✗) → khối Cách tính. Chỉ đọc. Panel khác giữ `DongDiem`.
 */
export function BangLuotPanel({ tieuDe, data, loading, error, reload, onDong }: {
  tieuDe: string; data: DuLieuBangLuot | null; loading: boolean; error: ApiError | null; reload: () => void; onDong: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const hang = (data?.rows ?? []).flatMap((r) => (r.luotDiem ? [{ id: r.id, ...r.luotDiem }] : []));
  type H = (typeof hang)[number];
  const oCua = (h: H, c: DinhNghiaCot) => {
    if (c.key === 'ten') return <Link className={`font-semibold ${LINK}`} to={duongHoSoHocVien(h.studentId)}>{h.ten}</Link>;
    if (c.key === 'lop') return h.classId ? <Link className={`${LINK} !text-dim`} to={`/hoc-vien/lop/${h.classId}`}>{h.lop}</Link> : <span className="text-dim">{h.lop}</span>;
    if (c.key === 'mt') return <span className="whitespace-nowrap"><Link className={`font-semibold ${LINK}`} to={duongDotTest({ id: h.id, kind: 'mock' })}>MT{h.mt}</Link> <span className="text-[13px] text-faint">{tuanLich(h.tuan, homNay)}</span></span>;
    const o = h.kn[c.key as keyof H['kn']];
    return <ODiem so={o ? fmtBand(o.v) : null} kq={o?.kq ?? null} nhan={c.nhan} />;
  };
  const soHv = new Set(hang.map((h) => h.studentId)).size;
  return (
    <KhungPanel tieuDe={tieuDe} rong="rong" onDong={onDong} loai={t('SỐ · TEST + SOS')}
      dau={{ dong2: [[data?.chiNhanh ?? t('Tất cả chi nhánh'), 'Fast Track', t('dữ liệu đến {ngay}', { ngay: ngay(homNay).slice(0, 5) })].join(' · ')] }}
      chan={{ huy: { nhan: t('Đóng'), onClick: onDong } }}>
      {error ? <div className="pt-3"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>
        : loading || !data ? <div className="pt-3"><Skeleton rows={4} /></div>
          : (
            <div className="grid gap-3 pt-3">
              <span className="text-sm text-dim"><b className="tabular-nums text-slate-100">{hang.length}</b> {t('lượt')} · {t('{n} HV', { n: soHv })}</span>
              <Bang deu ten={tieuDe} cot={COT} hang={hang} khoa={(h) => h.id} oCua={oCua} khung={false} the375={false} />
              {data.cachTinh && (
                <div className="grid gap-1 text-sm"><b className="text-slate-100">{t('Cách tính')}</b><span className="text-dim">{dich(data.cachTinh)}</span></div>
              )}
            </div>
          )}
    </KhungPanel>
  );
}
