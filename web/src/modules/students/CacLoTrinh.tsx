import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useToast } from '../../ui/Toast.tsx';
import { tuanLich } from '@shared/domain/index.ts';
import type { TrangThaiBuocTiep } from './PanelBuocTiep.tsx';
import { Nhan, type ToneNhan } from '../../ui/Nhan.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { dich, t } from '@shared/i18n/index.ts';

export type KetQuaGon = { chinh: string; tone: 'ok' | 'soon' | 'late' | 'muted'; phu?: string };
export type DongCacLoTrinh = {
  id: number; ten: string; lop: string | null; thoiGian: string; dangHoc: boolean; ketQua: KetQuaGon | null; huong: string | null;
  /** OV-13m: lộ trình FT mới nhất có kết quả thi thật — "Đã xong · OVR …" + Chọn bước tiếp / Hẹn bắt đầu / chờ QL · TVV. */
  buocTiep: TrangThaiBuocTiep | null;
};

/** Nhãn hướng tiếp: Học lại vàng · Kết thúc / Chuyển lớp xám · còn lại xanh dương (như mockup). */
export const toneHuong = (h: string): ToneNhan => (h === 'Học lại' ? 'soon' : h === 'Kết thúc' || h === 'Chuyển lớp' ? 'muted' : 'doing');

const toneXong = (kl: string | null): ToneNhan => (kl === 'not_reached' ? 'late' : kl === 'reached' ? 'ok' : 'muted');
const NUT_CHU = 'link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[12.5px] font-semibold sm:min-h-0';

function KetQua({ d, onBuocTiep, onDoi }: { d: DongCacLoTrinh; onBuocTiep?: (cycleId: number) => void; onDoi: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const k = d.ketQua;
  const bt = d.buocTiep;
  if (bt) {
    /* OV-13m (mockup bước tiếp §2): "Đã xong · OVR 6.5 · Đạt Target" (một hàm nhãn) + việc tiếp theo người xem. */
    const huyHen = async () => {
      try { await api.del(`/cycles/${d.id}/buoc-tiep`); } catch (e: any) { toast.push('error', e.message); return; }
      ['/students', '/lo-trinh', '/my-work', '/hoc-vien-lop'].forEach((x) => invalidate(x)); onDoi();
    };
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <Nhan tone={toneXong(bt.ketLuan)}>{dich(bt.daXong)}</Nhan>
        {bt.hen ? <><Nhan tone="muted">{t('Hẹn bắt đầu {tuan}', { tuan: tuanLich(bt.hen, homNay) })}</Nhan>{bt.coTheChon && <button type="button" className={NUT_CHU} onClick={() => void huyHen()}>{t('Huỷ hẹn')}</button>}</>
          : bt.chon ? (!d.dangHoc && d.huong && <Nhan tone={toneHuong(d.huong)}>{dich(d.huong)}</Nhan>)
            : bt.coTheChon && onBuocTiep ? <button type="button" className={NUT_CHU} onClick={() => onBuocTiep(d.id)}>{t('Chọn bước tiếp ›')}</button>
              : <span className="text-[11.5px] text-slate-500">{t('Chờ QL / TVV chọn bước tiếp')}</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {k ? <Nhan tone={k.tone}>{dich(k.chinh)}</Nhan> : <span className="text-slate-600">—</span>}
      {k?.phu && <span className="text-[11.5px] text-slate-500">{dich(k.phu)}</span>}
      {!d.dangHoc && d.huong && <Nhan tone={toneHuong(d.huong)}>{dich(d.huong)}</Nhan>}
    </span>
  );
}

/**
 * KHỐI "CÁC LỘ TRÌNH" (PR-TK, TK-8; mockup `mockup-tong-ket-lo-trinh-2026-10-06.html`, bản 2) — đầu tab Hành trình, LUÔN hiện (kể cả một lộ trình).
 * Đang học → "Học thuật ›" (sang tab Học thuật); đã đóng → kết quả từ BẢN CHỤP + hướng tiếp, nút "Tổng kết" mở ngăn. 375: mỗi lộ trình một thẻ.
 */
export function CacLoTrinh({ studentId, onTongKet, onHocThuat, onBuocTiep }: {
  studentId: number; onTongKet: (cycleId: number) => void; onHocThuat: () => void;
  /** OV-13m: "Chọn bước tiếp ›" mở panel Bước tiếp (hồ sơ `?buoc-tiep=`). */
  onBuocTiep?: (cycleId: number) => void;
}) {
  const { data, loading, error, reload } = useApi<DongCacLoTrinh[]>(`/students/${studentId}/lo-trinh`, [studentId]);
  const nut = (d: DongCacLoTrinh) => (d.dangHoc
    ? <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={onHocThuat}>{t('Học thuật ›')}</button>
    : <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onTongKet(d.id)}>{t('Tổng kết')}</button>);
  return (
    <section className="card" aria-label={t('Các lộ trình')}>
      <header className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 className="m-0 text-sm font-semibold text-slate-200">{t('Các lộ trình')}</h2>
        {data && data.length > 0 && <span className="text-xs font-semibold tabular-nums text-slate-500">{data.length}</span>}
      </header>
      {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
      {loading && !data && <div className="p-4"><Skeleton rows={3} /></div>}
      {data && data.length === 0 && <Empty title={t('Chưa có lộ trình nào')} />}
      {data && data.length > 0 && (
        <>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] text-slate-400">
                  <th className="px-4 py-2 font-semibold">{t('Lộ trình')}</th><th className="px-3 py-2 font-semibold">{t('Lớp')}</th>
                  <th className="px-3 py-2 font-semibold">{t('Thời gian')}</th><th className="px-3 py-2 font-semibold">{t('Kết quả')}</th><th className="w-28 px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.id} className="h-11 border-t align-middle" style={{ borderColor: 'var(--line)' }}>
                    <td className="px-4 font-bold text-slate-100">{dich(d.ten)}{d.dangHoc && !d.buocTiep && <span className="ml-2 align-middle"><Nhan tone="doing">{t('Đang học')}</Nhan></span>}</td>
                    <td className="px-3 text-slate-300">{d.lop ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 tabular-nums text-slate-300">{dich(d.thoiGian)}</td>
                    <td className="px-3"><KetQua d={d} onBuocTiep={onBuocTiep} onDoi={reload} /></td>
                    <td className="px-4 text-right">{nut(d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="m-0 list-none p-0 sm:hidden">
            {data.map((d) => (
              <li key={d.id} className="border-t px-3 py-2.5 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-100">{dich(d.ten)}{d.dangHoc && !d.buocTiep && <span className="ml-2 align-middle"><Nhan tone="doing">{t('Đang học')}</Nhan></span>}</div>
                    <div className="text-xs text-slate-500">{d.lop ?? '—'} · <span className="tabular-nums">{dich(d.thoiGian)}</span></div>
                  </div>
                  {nut(d)}
                </div>
                <div className="mt-1.5"><KetQua d={d} onBuocTiep={onBuocTiep} onDoi={reload} /></div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
