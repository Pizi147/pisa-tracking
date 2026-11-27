import { useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { buocNgan, mucHan, ngay } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { ChuoiCham, KhoiTuyen } from './KhoiTuyen.tsx';
import type { TomTuyen, Tuyen } from './kieu.ts';

/** "Đang ở {bước ngắn} · {người}" / "Xong {ngày}" — cùng khuôn dòng Đang theo dõi (TUYEN-3). */
export function chuTomTuyen(tom: TomTuyen): string {
  if (tom.ketThuc) return tom.ketThucLuc ? `${t('Xong')} ${ngay(tom.ketThucLuc)}` : t('Xong');
  if (!tom.dangO) return '';
  return [`${t('Đang ở')} ${dich(buocNgan(tom.dangO.ten))}`, tom.dangO.nguoi].filter(Boolean).join(' · ');
}

/** Hạn của bước đang ở (tô theo mức gần / quá). */
export function HanTomTuyen({ tom }: { tom: TomTuyen }) {
  const { homNay } = useNgayNghiepVu();
  const han = tom.ketThuc ? null : tom.dangO?.han ?? null;
  if (!han) return <span />;
  const muc = homNay ? mucHan(han, homNay) : 'xa';
  return <span className={`whitespace-nowrap text-[13px] tabular-nums ${muc === 'qua' ? 'font-semibold text-late' : muc === 'sap' ? 'font-semibold text-soon' : 'text-dim'}`}>{ngay(han)}</span>;
}

/**
 * Khối Tuyến tải KHI MỞ (`GET /tuyen/:loai/:khoa`) — mở sẵn nội dung bước đang ở + bước xong gần nhất (chủ SP 27/11: phần mở phải có thông tin, không một dòng chữ).
 */
export function TuyenTaiHs({ loai, khoa }: { loai: string; khoa: string }) {
  const duong = `/tuyen/${loai}/${encodeURIComponent(khoa)}`;
  const { data, error, reload } = useApi<Tuyen>(duong, [duong]);
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (!data) return <Skeleton rows={3} />;
  const xongCuoi = data.buoc.filter((b) => b.trangThai === 'xong' && b.coNoiDung).at(-1)?.khoa;
  return <KhoiTuyen tuyen={data} moSan={(b) => b.trangThai === 'dang' || b.trangThai === 'tam_dung' || b.khoa === xongCuoi} />;
}

/**
 * DÒNG MỘT TUYẾN Ở HỒ SƠ (TUYEN-4, mockup v27 T10a): tên (lần xử lý / lượt) · chuỗi chấm · "Đang ở … / Xong …" · hạn · ˅ — bấm mở khối Tuyến ngay dưới.
 * Một kiểu cho khối Vi phạm hồ sơ HV (Phối hợp dùng cùng các phần trong dải lượt của `BangPhoiHopHoSo`).
 */
export function DongTuyenHs({ tom, ten, moSan = false }: { tom: TomTuyen; ten: ReactNode; moSan?: boolean }) {
  const [mo, setMo] = useState(moSan);
  const chu = chuTomTuyen(tom);
  return (
    <div className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
      <button type="button" aria-expanded={mo} onClick={() => setMo((x) => !x)}
        className={`grid min-h-12 w-full cursor-pointer grid-cols-[minmax(0,max-content)_auto_minmax(0,1fr)_auto_16px] items-center gap-x-3 border-0 px-4 py-2 text-left text-sm max-sm:grid-cols-[minmax(0,1fr)_auto_16px] max-sm:gap-y-1 max-sm:px-3 ${mo ? 'bg-[color:var(--surface-2)]' : 'bg-transparent hover:bg-[color:var(--phu-re)]'}`}>
        <b className="min-w-0 font-semibold text-[color:var(--text)]">{ten}</b>
        <span className="max-sm:col-start-2 max-sm:row-start-1"><ChuoiCham chuoi={tom.chuoi} /></span>
        <span className="min-w-0 text-[13px] text-dim max-sm:col-span-3 max-sm:row-start-2">{chu}</span>
        <span className="max-sm:hidden"><HanTomTuyen tom={tom} /></span>
        <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current text-dim max-sm:col-start-3 max-sm:row-start-1" strokeWidth={1.6}><path d={mo ? 'M3 7.5L6 4.5 9 7.5' : 'M3 4.5L6 7.5 9 4.5'} /></svg>
      </button>
      {mo && <div className="px-4 pb-3 max-sm:px-3"><TuyenTaiHs loai={tom.loai} khoa={tom.khoa} /></div>}
    </div>
  );
}
