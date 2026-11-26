import { useEffect, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import { DauQuaHan } from '../../ui/Nhan.tsx';
import { DsLichSu, LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { mucHan, shortDate } from '@shared/domain/index.ts';
import { DaiNhom, docGap, ghiGap } from './DanhSachViec.tsx';
import { DaiChiXem, KhoiGiaoViec, dongLichSuGiao, useGiaoViec, useHn, type LoaiGiao } from './KhoiGiaoViec.tsx';
import { PhanMeeting } from './PanelMeeting.tsx';
import { PanelBaoPhTvv } from './PanelBaoPhTvv.tsx';
import { lucVn } from './gioVn.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';

/** `GET /my-work/theo-doi` (máy chủ `viecTheoDoi`). */
/** VH-1: việc Vận hành (`van_hanh`) cũng có người theo dõi — không gắn học viên (`studentId` null), panel = panel Vận hành sẵn có. */
type LoaiTd = LoaiGiao | 'tra_lai' | 'van_hanh';
export type DongTd = { loai: LoaiTd; refId: number; tieuDe: string; studentId: number | null; studentName: string | null; classCode: string | null;
  phuTrach: string | null; han: string | null; quaHan: boolean; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string; xongLuc: string | null };
type TheoDoi = { nhom: { loai: LoaiTd; ten: string; mo: DongTd[]; vuaXong: DongTd[] }[] };
export const khoaTd = (d: Pick<DongTd, 'loai' | 'refId'>) => `${d.loai}:${d.refId}`;
const ICON: Record<LoaiTd, string> = { bao_ph: 'bao-ph', phoi_hop: 'y-thuc', tinh_hinh: 'tinh-hinh', meeting: 'y-thuc', tra_lai: 'y-thuc', xu_ly: 'y-thuc', da_thuc_hien: 'y-thuc', van_hanh: 'van-hanh' };

/**
 * TAB "ĐANG THEO DÕI" (GV-2, N58; mockup v22 G5 / G6 / G7a) — mọi vai có Công việc. GỌI `/my-work/theo-doi` CHỈ khi tab đang mở (không lúc mở trang, tab không số).
 * Mục theo loại (dải `DaiNhom`, gập / mở nhớ như GAP-MO) · trong mục: vạch "Quá hạn" · "Còn hạn" (máy chủ đã xếp quá hạn trước) · "Vừa xong 7 ngày" một mục
 * cuối GẬP SẴN. Dòng: mắt · tên việc · em | Phụ trách {tên} · hạn · trạng thái bằng chữ (không nút). Bấm dòng = panel CHỈ ĐỌC (`PanelTheoDoi`).
 */
export function DsTheoDoi({ chon, onMo, onCo, nho }: { chon: string | null; onMo: (d: DongTd) => void; nho?: string;
  /** Mở từ đường dẫn (`theo=`, F5, Quay lại): dòng đang chọn tìm thấy trong danh sách vừa nạp → panel dựng lại, không request thêm. */ onCo: (d: DongTd) => void }) {
  const { data, error, loading, reload } = useApi<TheoDoi>('/my-work/theo-doi');
  useEffect(() => {
    const d = chon ? data?.nhom.flatMap((g) => [...g.mo, ...g.vuaXong]).find((x) => khoaTd(x) === chon) : null;
    if (d) onCo(d);
  }, [data, chon]);   // eslint-disable-line react-hooks/exhaustive-deps
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
    <div className="cvA-cq"><div className="cvA">
      {nhom.filter((g) => g.mo.length).map((g) => {
        const dongGap = gap.has(g.loai), q = g.mo.filter((x) => x.quaHan).length;
        return (
          <section key={g.loai} className="card cvA-sub overflow-clip p-0" aria-label={dich(g.ten)}>
            <DaiNhom k={ICON[g.loai]} nhan={dich(g.ten)} chip={t('{n} việc', { n: g.mo.length })} mo={!dongGap} onMo={() => doi(g.loai, !dongGap)} chevSauTen
              dieuKhien={dongGap ? undefined : `td-${g.loai}`} phu={q ? <span className="font-bold tabular-nums text-late">{q} {t('quá hạn')}</span> : null} />
            {!dongGap && <ul id={`td-${g.loai}`} className="cvA-sub">
              {g.mo.map((d) => <li key={khoaTd(d)} className="cvA-sub"><DongTheoDoiViec d={d} chon={chon === khoaTd(d)} onMo={() => onMo(d)} /></li>)}
            </ul>}
          </section>
        );
      })}
      {xong.length > 0 && (
        <section className="card cvA-sub overflow-clip p-0" aria-label={t('Vừa xong 7 ngày')}>
          <DaiNhom k="vua-xong" nhan={t('Vừa xong 7 ngày')} chip={t('{n} việc', { n: xong.length })} mo={moXong} onMo={() => doi('+vua-xong', !moXong)} chevSauTen trungTinh
            dieuKhien={moXong ? 'td-vua-xong' : undefined} />
          {moXong && <ul id="td-vua-xong" className="cvA-sub">
            {xong.map((d) => <li key={khoaTd(d)} className="cvA-sub"><DongTheoDoiViec d={d} chon={chon === khoaTd(d)} onMo={() => onMo(d)} /></li>)}
          </ul>}
        </section>
      )}
    </div></div>
  );
}

/** Tên việc (bỏ mã lớp và tên em — hai ô riêng của dòng). */
const tenDong = (d: DongTd) => d.tieuDe.split(' · ').filter((x) => x !== d.classCode && x !== d.studentName).join(' · ');

/** Khuôn A: lớp · em · việc · phụ trách · trạng thái · hạn (ngày tô màu; cờ quá hạn của máy chủ — Báo PH "Chờ GV sửa" không quá hạn). */
function DongTheoDoiViec({ d, chon, onMo }: { d: DongTd; chon: boolean; onMo: () => void }) {
  const hn = useHn();
  const chu = [d.studentName ? dich(tenDong(d)) : null, d.phuTrach ? t('Phụ trách {ten}', { ten: dich(d.phuTrach) }) : null, dich(d.nhanTrangThai)].filter(Boolean).join(' · ');
  const muc = d.quaHan ? 'qua' : d.han ? (mucHan(d.han, hn) === 'qua' ? 'xa' : mucHan(d.han, hn)) : 'xa';
  const ten = d.studentName ?? dich(tenDong(d));
  return (
    <div data-khoa={khoaTd(d)} onClick={onMo} className={`cvA-v ${d.studentName || d.classCode ? '' : 'cvA-kl'} ${chon ? 'dang-chon' : ''}`}>
      <span className="cvA-lop">{d.classCode}</span>
      <span className="cvA-ai"><button type="button" className={`cvA-ten ${d.studentName ? '' : '!font-semibold'}`} aria-current={chon ? 'true' : undefined} onClick={(e) => { e.stopPropagation(); onMo(); }}>
        {d.trangThai === 'xong' && <span aria-hidden className="text-ok">✓ </span>}{ten}</button></span>
      <span className="cvA-ct" title={chu}>{chu}</span>
      <span className={`cvA-hn ${muc === 'xa' ? '' : muc}`}>{d.trangThai === 'mo' && d.han ? <>{muc === 'qua' && <DauQuaHan />}{shortDate(d.han, hn)}</> : d.xongLuc ? <span className="text-faint">{lucVn(d.xongLuc)}</span> : <span className="sr-only">{t('không hạn')}</span>}</span>
    </div>
  );
}

/**
 * PANEL CHỈ ĐỌC của việc đang theo dõi (mockup G5): Báo PH → panel Báo PH sẵn có (máy chủ trả `coTheGhi = false`, chân chỉ Đóng) + dải "Bạn đang theo dõi";
 * loại khác → khối Phụ trách · Hạn · Theo dõi (nút theo quyền máy chủ — GVCN vẫn "Sửa hạn" theo N34) · phần Meeting · Lịch sử.
 */
export function PanelTheoDoi({ d, onDong }: { d: DongTd; onDong: () => void }) {
  if (d.loai === 'van_hanh') return <NganViecVanHanh key={khoaTd(d)} taskId={d.refId} onClose={onDong} onDone={() => {}} />;
  if (d.loai === 'bao_ph') {
    const it = { key: `td:${khoaTd(d)}`, group: 'bao_ph_yt', viecId: d.refId, studentId: d.studentId, studentName: d.studentName, classCode: d.classCode,
      classId: null, contextLabel: d.tieuDe.match(/^Báo PH · (?!Meeting)(.+) · /)?.[1] ?? null, urgency: 'normal', due: d.han } as unknown as WorkItem;
    return <PanelBaoPhTvv key={it.key} it={it} chiXem onDong={onDong} onDaLam={() => {}} onTiep={null} />;
  }
  return <PanelTheoDoiChung key={khoaTd(d)} d={d} onDong={onDong} />;
}

function PanelTheoDoiChung({ d, onDong }: { d: DongTd; onDong: () => void }) {
  const hn = useHn();
  const { g, error, reload, dat } = useGiaoViec(d.loai as LoaiGiao, d.refId);
  const dau = { ...dauViec({ em: d.studentId != null ? { id: d.studentId, ten: d.studentName ?? '' } : null, lop: d.classCode }), loai: t('Đang theo dõi') };
  const tieuDe = dich(d.studentName ? d.tieuDe.replace(` · ${d.studentName}`, '') : d.tieuDe);
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
