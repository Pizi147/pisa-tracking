import { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { BoLocDoan, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { dich, t } from '@shared/i18n/index.ts';

type Dong = { id: number; luc: string; nguoi: string; nguon: string | null; truong: { ten: string; cu: string | null; moi: string | null }[] };
type Trang = { dong: Dong[]; tiep: number | null };
type Loai = '' | 'thong-tin' | 'target' | 'trang-thai';

const LOC: { key: Loai; nhan: string }[] = [
  { key: '', nhan: t('Tất cả') }, { key: 'thong-tin', nhan: t('Thông tin') },
  { key: 'target', nhan: t('Target / lộ trình') }, { key: 'trang-thai', nhan: t('Trạng thái') },
];

/** Giá trị dữ liệu giữ nguyên; chỉ nhãn hệ thống (trạng thái học, Có / Không của KCK) theo tiếng của trang. */
const giaTri = (ten: string, v: string | null) => (v === null ? <i>{t('trống')}</i> : ten === 'Trạng thái' || ten === 'KCK' ? dich(v) : v);

/** "15/10 14:02" theo giờ máy; khác năm nay thì kèm năm. */
function lucNgan(iso: string): string {
  const d = new Date(iso);
  const h = (n: number) => String(n).padStart(2, '0');
  const nam = d.getFullYear() !== new Date().getFullYear() ? `/${d.getFullYear()}` : '';
  return `${h(d.getDate())}/${h(d.getMonth() + 1)}${nam} ${h(d.getHours())}:${h(d.getMinutes())}`;
}

/**
 * OV-13j — LỊCH SỬ SỬA (hồ sơ HV › ⋮, chủ SP 15/10): ai sửa gì, cũ → mới, mới nhất trước. Chỉ xem — không nút khôi phục (sửa lại như bình
 * thường, lần sửa lại cũng hiện ở đây). Lọc nhanh theo nhóm trường; "Xem thêm" nối trang sau (con trỏ `tiep` của máy chủ).
 */
export function LichSuSuaPanel({ studentId, studentName, lop, onClose }: { studentId: number; studentName: string; lop?: string | null; onClose: () => void }) {
  const [loai, setLoai] = useState<Loai>('');
  const goc = `/students/${studentId}/lich-su-sua${loai ? `?loai=${loai}` : ''}`;
  const { data, error, loading, reload } = useApi<Trang>(goc, [goc]);
  const [them, setThem] = useState<Trang[]>([]);
  const [dangTai, setDangTai] = useState(false);
  const [loiThem, setLoiThem] = useState<string | null>(null);
  useEffect(() => { setThem([]); setLoiThem(null); }, [goc]);

  const ds = [...(data?.dong ?? []), ...them.flatMap((x) => x.dong)];
  const tiep = them.length ? them[them.length - 1].tiep : data?.tiep ?? null;
  const xemThem = async () => {
    if (tiep === null) return;
    setDangTai(true); setLoiThem(null);
    try {
      const r = await api.get<Trang>(`/students/${studentId}/lich-su-sua?${loai ? `loai=${loai}&` : ''}truoc=${tiep}`);
      setThem((x) => [...x, r]);
    } catch (e) { setLoiThem((e as Error).message); } finally { setDangTai(false); }
  };

  return (
    <KhungPanel tieuDe={t('Lịch sử sửa')} onDong={onClose} dau={{ dong2: [studentName, lop ?? null] }}>
      <div className="pt-3">
        <BoLocDoan muc={LOC} value={loai} onChange={setLoai} ariaLabel={t('Lọc lịch sử sửa')} />
      </div>
      {error ? <div className="pt-3"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading && !data ? <div className="pt-3"><Skeleton rows={5} /></div>
        : !ds.length ? <Empty title={t('Chưa có lần sửa nào')} />
        : (
          <ul className="m-0 mt-3 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
            {ds.map((d) => (
              <li key={d.id} className="py-3" style={{ borderColor: 'var(--line)' }}>
                <div className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] text-slate-400">
                  <span className="tabular-nums">{lucNgan(d.luc)}</span>
                  <span aria-hidden>·</span>
                  <span className="font-semibold text-slate-200">{d.nguoi}</span>
                  {d.nguon && <><span aria-hidden>·</span><span>{dich(d.nguon)}</span></>}
                </div>
                <ul className="m-0 mt-1 list-none space-y-0.5 p-0 text-sm">
                  {d.truong.map((x) => (
                    <li key={x.ten} className="break-words">
                      <span className="text-slate-400">{dich(x.ten)}:</span>{' '}
                      <span className="text-slate-400">{giaTri(x.ten, x.cu)}</span>
                      <span aria-hidden className="px-1 text-slate-500">→</span>
                      <span className="font-medium text-slate-100">{giaTri(x.ten, x.moi)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      {loiThem && <p className="mt-2 text-sm text-bad" role="alert">{loiThem}</p>}
      {tiep !== null && ds.length > 0 && !error && (
        <div className="py-3">
          <button type="button" className="btn btn-sm min-h-[44px] w-full sm:min-h-0 sm:w-auto" disabled={dangTai} onClick={() => void xemThem()}>
            {dangTai ? t('Đang tải') : t('Xem thêm')}
          </button>
        </div>
      )}
    </KhungPanel>
  );
}
