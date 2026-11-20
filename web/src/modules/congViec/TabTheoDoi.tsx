import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { DsLichSu, LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { DONG, DaiNhom, IconNhom, O_HAN, O_NUT, docGap, ghiGap } from './DanhSachViec.tsx';
import { DaiChiXem, KhoiGiaoViec, dongLichSuGiao, useGiaoViec, useHn, type LoaiGiao } from './KhoiGiaoViec.tsx';
import { PhanMeeting } from './PanelMeeting.tsx';
import { PanelBaoPhTvv } from './PanelBaoPhTvv.tsx';
import { lucVn } from './gioVn.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';

/** `GET /my-work/theo-doi` (máy chủ `viecTheoDoi`). */
export type DongTd = { loai: LoaiGiao; refId: number; tieuDe: string; studentId: number; studentName: string; classCode: string | null;
  phuTrach: string | null; han: string | null; quaHan: boolean; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string; xongLuc: string | null };
type TheoDoi = { nhom: { loai: LoaiGiao; ten: string; mo: DongTd[]; vuaXong: DongTd[] }[] };
export const khoaTd = (d: Pick<DongTd, 'loai' | 'refId'>) => `${d.loai}:${d.refId}`;
const ICON: Record<LoaiGiao, string> = { bao_ph: 'bao-ph', phoi_hop: 'y-thuc', tinh_hinh: 'tinh-hinh', meeting: 'y-thuc' };

/**
 * TAB "ĐANG THEO DÕI" (GV-2, N58; mockup v22 G5 / G6 / G7a) — mọi vai có Công việc. GỌI `/my-work/theo-doi` CHỈ khi tab đang mở (không lúc mở trang, tab không số).
 * Mục theo loại (dải `DaiNhom`, gập / mở nhớ như GAP-MO) · trong mục: vạch "Quá hạn" · "Còn hạn" (máy chủ đã xếp quá hạn trước) · "Vừa xong 7 ngày" một mục
 * cuối GẬP SẴN. Dòng: mắt · tên việc · em | Phụ trách {tên} · hạn · trạng thái bằng chữ (không nút). Bấm dòng = panel CHỈ ĐỌC (`PanelTheoDoi`).
 */
export function DsTheoDoi({ chon, onMo, nho }: { chon: string | null; onMo: (d: DongTd) => void; nho?: string }) {
  const { data, error, loading, reload } = useApi<TheoDoi>('/my-work/theo-doi');
  const khoa = nho ? `pisa.cv.gap.${nho}` : null;
  /* "Vừa xong 7 ngày" gập sẵn: nhớ là MỞ (khoá `+vua-xong`), không nhớ thì gập. */
  const [gap, setGap] = useState(() => docGap(khoa));
  const doi = (k: string, g: boolean) => { const s = new Set(gap); if (g) s.add(k); else s.delete(k); setGap(s); ghiGap(khoa, s); };
  if (error) return <Card><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>;
  if (loading && !data) return <Card><Skeleton rows={6} /></Card>;
  const nhom = data?.nhom ?? [];
  const xong = nhom.flatMap((g) => g.vuaXong);
  if (!nhom.some((g) => g.mo.length) && !xong.length) {
    return <Card><Empty title={t('Bạn chưa theo dõi việc nào')} /></Card>;
  }
  const moXong = gap.has('+vua-xong');
  return (
    <div className="flex flex-col gap-3.5">
      {nhom.filter((g) => g.mo.length).map((g) => {
        const dongGap = gap.has(g.loai), q = g.mo.filter((x) => x.quaHan).length;
        return (
          <section key={g.loai} className="card overflow-clip p-0" aria-label={dich(g.ten)}>
            <DaiNhom k={ICON[g.loai]} nhan={dich(g.ten)} chip={t('{n} việc', { n: g.mo.length })} mo={!dongGap} onMo={() => doi(g.loai, !dongGap)} chevSauTen
              dieuKhien={dongGap ? undefined : `td-${g.loai}`} phu={q ? <span className="font-bold tabular-nums text-late">{q} {t('quá hạn')}</span> : null} />
            {!dongGap && <ul id={`td-${g.loai}`} className="m-0 list-none p-0">
              {g.mo.map((d, j) => {
                const vach = q > 0 && q < g.mo.length && (j === 0 || g.mo[j - 1].quaHan !== d.quaHan);
                return [
                  vach && <li key={`v${j}`} className={`flex min-h-9 items-center px-4 text-[13px] font-semibold text-dim max-sm:px-3.5 ${j ? 'border-t' : ''}`} style={{ borderColor: 'var(--line-strong)' }}>
                    {d.quaHan ? t('Quá hạn') : t('Còn hạn')}</li>,
                  <li key={khoaTd(d)} className={j && !vach ? 'border-t' : ''} style={{ borderColor: 'var(--line)' }}><DongTheoDoiViec d={d} chon={chon === khoaTd(d)} onMo={() => onMo(d)} /></li>,
                ];
              })}
            </ul>}
          </section>
        );
      })}
      {xong.length > 0 && (
        <section className="card overflow-clip p-0" aria-label={t('Vừa xong 7 ngày')}>
          <DaiNhom k="vua-xong" nhan={t('Vừa xong 7 ngày')} chip={t('{n} việc', { n: xong.length })} mo={moXong} onMo={() => doi('+vua-xong', !moXong)} chevSauTen trungTinh
            dieuKhien={moXong ? 'td-vua-xong' : undefined} />
          {moXong && <ul id="td-vua-xong" className="m-0 list-none p-0">
            {xong.map((d, j) => <li key={khoaTd(d)} className={j ? 'border-t' : ''} style={{ borderColor: 'var(--line)' }}><DongTheoDoiViec d={d} chon={chon === khoaTd(d)} onMo={() => onMo(d)} /></li>)}
          </ul>}
        </section>
      )}
    </div>
  );
}

/** Mã lớp · tên việc (bỏ tên em ở cuối — em đã ở dòng phụ). */
const tenDong = (d: DongTd) => [d.classCode, d.tieuDe.replace(new RegExp(` · ${d.studentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '')].filter(Boolean).join(' · ');

function DongTheoDoiViec({ d, chon, onMo }: { d: DongTd; chon: boolean; onMo: () => void }) {
  const ten = tenDong(d);
  return (
    <div data-khoa={khoaTd(d)} onClick={onMo} className={`${DONG} ${chon ? 'row-active' : 'bam'}`}>
      <span className="flex min-w-0 items-center gap-3 max-sm:items-start">
        <span aria-hidden className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--surface-2)] text-dim"><IconNhom k="theo-doi" /></span>
        <span className="grid min-w-0 gap-0.5">
          <button type="button" className="min-w-0 appearance-none border-0 bg-transparent p-0 text-left text-[15px] font-medium leading-snug text-[color:var(--text)]"
            aria-current={chon ? 'true' : undefined} onClick={(e) => { e.stopPropagation(); onMo(); }}>{dich(ten)}</button>
          <span className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[13px] leading-snug text-dim sm:mt-[3px] sm:gap-[3px]">
            <Link to={`/hoc-vien/${d.studentId}`} onClick={(e) => e.stopPropagation()} className="whitespace-nowrap text-dim no-underline hover:text-[color:var(--accent)] hover:underline sm:h-5 sm:rounded-md sm:bg-[color:var(--surface-2)] sm:px-1.5 sm:text-xs sm:font-medium sm:leading-5">{d.studentName}</Link>
            {d.phuTrach && <span className="whitespace-nowrap sm:h-5 sm:rounded-md sm:border sm:px-1.5 sm:text-xs sm:font-medium sm:leading-[18px]" style={{ borderColor: 'var(--line-strong)' }}>
              <span aria-hidden className="sm:hidden">· </span>{t('Phụ trách {ten}', { ten: dich(d.phuTrach) })}</span>}
          </span>
        </span>
      </span>
      <span className={`grid min-w-0 content-center justify-items-start text-[13px] ${O_HAN}`}>
        {d.trangThai === 'mo' && d.han ? <ChipHan vien loai="viec-van-hanh" han={d.han} /> : d.xongLuc ? <span className="tabular-nums text-faint">{lucVn(d.xongLuc)}</span> : <span className="sr-only">{t('không hạn')}</span>}
      </span>
      <span className={`flex min-w-0 items-center whitespace-nowrap text-[13px] font-medium ${d.trangThai === 'mo' ? 'text-dim' : 'text-ok'} ${O_NUT}`}>
        {d.trangThai === 'xong' && <span aria-hidden>✓&nbsp;</span>}{dich(d.nhanTrangThai)}
      </span>
    </div>
  );
}

/**
 * PANEL CHỈ ĐỌC của việc đang theo dõi (mockup G5): Báo PH → panel Báo PH sẵn có (máy chủ trả `coTheGhi = false`, chân chỉ Đóng) + dải "Bạn đang theo dõi";
 * loại khác → khối Phụ trách · Hạn · Theo dõi (nút theo quyền máy chủ — GVCN vẫn "Sửa hạn" theo N34) · phần Meeting · Lịch sử.
 */
export function PanelTheoDoi({ d, onDong }: { d: DongTd; onDong: () => void }) {
  if (d.loai === 'bao_ph') {
    const it = { key: `td:${khoaTd(d)}`, group: 'bao_ph_yt', viecId: d.refId, studentId: d.studentId, studentName: d.studentName, classCode: d.classCode,
      classId: null, contextLabel: d.tieuDe.match(/^Báo PH · (?!Meeting)(.+) · /)?.[1] ?? null, urgency: 'normal', due: d.han } as unknown as WorkItem;
    return <PanelBaoPhTvv key={it.key} it={it} chiXem onDong={onDong} onDaLam={() => {}} onTiep={null} />;
  }
  return <PanelTheoDoiChung key={khoaTd(d)} d={d} onDong={onDong} />;
}

function PanelTheoDoiChung({ d, onDong }: { d: DongTd; onDong: () => void }) {
  const hn = useHn();
  const { g, error, reload, dat } = useGiaoViec(d.loai, d.refId);
  const dau = { ...dauViec({ em: { id: d.studentId, ten: d.studentName }, lop: d.classCode }), loai: t('Đang theo dõi') };
  const tieuDe = dich(d.tieuDe.replace(` · ${d.studentName}`, ''));
  const chan = { huy: null, chinh: <button type="button" className="btn min-h-[44px] sm:min-h-[36px]" onClick={onDong}>{t('Đóng')}</button> };
  const lichSu = dongLichSuGiao(g, hn).sort((a, b) => b.luc.localeCompare(a.luc));
  return (
    <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong} chan={chan}>
      <div className="flex flex-col gap-3 pt-4">
        {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /> : !g ? <Skeleton rows={4} /> : <>
          <DaiChiXem g={g} onBo={onDong} />
          {g.meeting && <PhanMeeting g={g} dat={dat} reload={reload} />}
          <KhoiGiaoViec g={g} dat={dat} reload={reload} />
          <LichSuGap so={lichSu.length}>
            <DsLichSu dong={lichSu.map((l, i) => ({ key: i, gio: lucVn(l.luc), ai: l.nguoi, viec: l.tieu, phu: l.phu }))} />
          </LichSuGap>
        </>}
      </div>
    </KhungPanel>
  );
}
