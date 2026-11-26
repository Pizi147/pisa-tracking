import { useEffect, useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { KhoiTuyen } from '../yThuc/KhoiTuyen.tsx';
import type { TrangThaiBuoc, Tuyen } from '../yThuc/kieu.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import { DauQuaHan } from '../../ui/Nhan.tsx';
import { DsLichSu, LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
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
type LoaiTd = LoaiGiao | 'tra_lai' | 'van_hanh' | 'tuyen';
/** TUYEN-3 (N72 ①, mockup v27 T8): dòng MỘT TUYẾN (máy chủ `theoDoiTuyen`) — `loai` tuyến · `khoa`; `viec` = việc N58 gom vào dòng này. */
type DongTuyen = { loai: 'vi_pham' | 'phoi_hop' | 'tinh_hinh' | 'cap_bac' | 'chuyen_lop' | 'doi_gv'; khoa: string; tieuDe: string; studentId: number | null; studentName: string | null;
  classCode: string | null; nhan: string; han: string | null; quaHan: boolean; ketThuc: boolean; ketThucLuc: string | null; chuoi: TrangThaiBuoc[]; viec: string[]; khoaLo?: string[] };
export type DongTd = { loai: LoaiTd; refId: number; tieuDe: string; studentId: number | null; studentName: string | null; classCode: string | null;
  phuTrach: string | null; han: string | null; quaHan: boolean; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string; xongLuc: string | null;
  /** TUYEN-3: dòng một tuyến (loai 'tuyen'). */ tuyen?: DongTuyen };
type TheoDoi = { nhom: { loai: LoaiTd; ten: string; mo: DongTd[]; vuaXong: DongTd[] }[]; tuyen?: DongTuyen[] };
export const khoaTd = (d: Pick<DongTd, 'loai' | 'refId' | 'tuyen'>) => (d.tuyen ? `tuyen:${d.tuyen.loai}:${d.tuyen.khoa}` : `${d.loai}:${d.refId}`);
const ICON: Record<LoaiTd, string> = { bao_ph: 'bao-ph', phoi_hop: 'y-thuc', tinh_hinh: 'tinh-hinh', meeting: 'y-thuc', tra_lai: 'y-thuc', xu_ly: 'y-thuc', da_thuc_hien: 'y-thuc', van_hanh: 'van-hanh', tuyen: 'y-thuc' };
/** Tên mục / tên tuyến — đúng tên nhóm việc ở Công việc (đặc tả 4.4). */
/** Mục = tên tuyến (phần đầu `tieuDe` máy chủ: "Vi phạm · WL 3", "Phối hợp SOS · MT2 · SOS 3", "Báo PH kết quả Test"…) — thứ tự như mockup T8a, tên lạ xếp sau. */
const tenTuyen = (x: Pick<DongTuyen, 'tieuDe'>) => x.tieuDe.split(' · ')[0];
const THU_TU_TUYEN = ['Vi phạm', 'Phối hợp SOS', 'Báo PH kết quả Test', 'Tình hình học tập', 'Sửa cấp bậc'];
const thuTu = (ten: string) => { const i = THU_TU_TUYEN.indexOf(ten); return i < 0 ? THU_TU_TUYEN.length : i; };
/** Dòng tuyến → dòng danh sách chung (khoá `tuyen:{loai}:{khoa}`, nhãn "Đang ở {bước} · {người}" / "Xong {ngày}"). */
const tuDongTuyen = (x: DongTuyen): DongTd => ({ loai: 'tuyen', refId: 0, tieuDe: x.tieuDe, studentId: x.studentId, studentName: x.studentName, classCode: x.classCode,
  phuTrach: null, han: x.han, quaHan: x.quaHan, trangThai: x.ketThuc ? 'xong' : 'mo', nhanTrangThai: x.nhan, xongLuc: x.ketThucLuc, tuyen: x });

/**
 * TAB "ĐANG THEO DÕI" (GV-2, N58; mockup v22 G5 / G6 / G7a) — mọi vai có Công việc. GỌI `/my-work/theo-doi` CHỈ khi tab đang mở (không lúc mở trang, tab không số).
 * Mục theo loại (dải `DaiNhom`, gập / mở nhớ như GAP-MO) · trong mục: vạch "Quá hạn" · "Còn hạn" (máy chủ đã xếp quá hạn trước) · "Vừa xong 7 ngày" một mục
 * cuối GẬP SẴN. Dòng: mắt · tên việc · em | Phụ trách {tên} · hạn · trạng thái bằng chữ (không nút). Bấm dòng = panel CHỈ ĐỌC (`PanelTheoDoi`).
 */
export function DsTheoDoi({ chon, onMo, onCo, nho }: { chon: string | null; onMo: (d: DongTd) => void; nho?: string;
  /** Mở từ đường dẫn (`theo=`, F5, Quay lại): dòng đang chọn tìm thấy trong danh sách vừa nạp → panel dựng lại, không request thêm. */ onCo: (d: DongTd) => void }) {
  const { data, error, loading, reload } = useApi<TheoDoi>('/my-work/theo-doi');
  /* TUYEN-3 (N72 ①): MỘT dòng một tuyến — việc N58 thuộc tuyến (`viec`) gom vào dòng tuyến, bỏ khỏi mục theo loại việc. */
  const tuyen = (data?.tuyen ?? []).map(tuDongTuyen);
  const gom = new Set((data?.tuyen ?? []).flatMap((x) => x.viec));
  const nhom = (data?.nhom ?? []).map((g) => ({ ...g, mo: g.mo.filter((x) => !gom.has(khoaTd(x))), vuaXong: g.vuaXong.filter((x) => !gom.has(khoaTd(x))) }));
  const nhomTuyen = [...new Set(tuyen.filter((x) => x.trangThai === 'mo').map((x) => tenTuyen(x.tuyen!)))].sort((a, b) => thuTu(a) - thuTu(b))
    .map((l) => ({ l, mo: tuyen.filter((x) => x.trangThai === 'mo' && tenTuyen(x.tuyen!) === l) }));
  useEffect(() => {
    const d = chon ? [...tuyen, ...(data?.nhom ?? []).flatMap((g) => [...g.mo, ...g.vuaXong])].find((x) => khoaTd(x) === chon) : null;
    if (d) onCo(d);
  }, [data, chon]);   // eslint-disable-line react-hooks/exhaustive-deps
  const khoa = nho ? `pisa.cv.gap.${nho}` : null;
  /* "Vừa xong 7 ngày" gập sẵn: nhớ là MỞ (khoá `+vua-xong`), không nhớ thì gập. */
  const [gap, setGap] = useState(() => docGap(khoa));
  const doi = (k: string, g: boolean) => { const s = new Set(gap); if (g) s.add(k); else s.delete(k); setGap(s); ghiGap(khoa, s); };
  if (error) return <Card><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>;
  if (loading && !data) return <Card><Skeleton rows={6} /></Card>;
  const xongTuyen = tuyen.filter((x) => x.trangThai === 'xong');
  const xong = [...xongTuyen, ...nhom.flatMap((g) => g.vuaXong)];
  if (!nhom.some((g) => g.mo.length) && !nhomTuyen.length && !xong.length) {
    /* mockup v27 T8c: rỗng — tuyến tự vào đây khi làm xong phần mình. */
    return (
      <section className="card grid justify-items-center gap-1.5 px-5 pb-8 pt-8 text-center" role="status">
        <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current text-ok" strokeWidth={1.8}><circle cx="12" cy="12" r="9.5" /><path d="M8 12.5l2.7 2.7L16 9.8" /></svg>
        <b className="text-[16px] font-bold">{t('Chưa theo dõi tuyến nào')}</b>
        <span className="text-sm text-dim">{t('Làm xong phần của bạn trong một việc, tuyến đó tự vào đây.')}</span>
      </section>
    );
  }
  const moXong = gap.has('+vua-xong');
  return (
    <div className="cvA-cq td-A"><div className="cvA">
      {nhomTuyen.map((g, i) => {
        const k = `tuyen:${g.l}`, id = `td-tuyen-${i}`, dongGap = gap.has(k), q = g.mo.filter((x) => x.quaHan).length;
        return (
          <section key={k} className="card cvA-sub overflow-clip p-0" aria-label={dich(g.l)}>
            <DaiNhom k={g.l === 'Tình hình học tập' ? 'tinh-hinh' : g.l.startsWith('Báo PH') ? 'bao-ph' : 'y-thuc'} nhan={dich(g.l)} chip={t('{n} việc', { n: g.mo.length })} mo={!dongGap} onMo={() => doi(k, !dongGap)} chevSauTen
              dieuKhien={dongGap ? undefined : id} phu={q ? <span className="font-bold tabular-nums text-late">{q} {t('quá hạn')}</span> : null} />
            {!dongGap && <ul id={id} className="cvA-sub">
              <DsDong ds={g.mo} gop={g.l.startsWith('Báo PH')} chon={chon} onMo={onMo} />
            </ul>}
          </section>
        );
      })}
      {nhom.filter((g) => g.mo.length).map((g) => {
        const dongGap = gap.has(g.loai), q = g.mo.filter((x) => x.quaHan).length;
        return (
          <section key={g.loai} className="card cvA-sub overflow-clip p-0" aria-label={dich(g.ten)}>
            <DaiNhom k={ICON[g.loai]} nhan={dich(g.ten)} chip={t('{n} việc', { n: g.mo.length })} mo={!dongGap} onMo={() => doi(g.loai, !dongGap)} chevSauTen
              dieuKhien={dongGap ? undefined : `td-${g.loai}`} phu={q ? <span className="font-bold tabular-nums text-late">{q} {t('quá hạn')}</span> : null} />
            {!dongGap && <ul id={`td-${g.loai}`} className="cvA-sub">
              <DsDong ds={g.mo} gop={g.loai === 'bao_ph'} chon={chon} onMo={onMo} />
            </ul>}
          </section>
        );
      })}
      {xong.length > 0 && (
        <section className="card cvA-sub overflow-clip p-0" aria-label={t('Vừa xong 7 ngày')}>
          <DaiNhom k="vua-xong" nhan={t('Vừa xong 7 ngày')} chip={[xongTuyen.length ? t('{n} tuyến', { n: xongTuyen.length }) : null, xong.length > xongTuyen.length ? t('{n} việc', { n: xong.length - xongTuyen.length }) : null].filter(Boolean).join(' · ')} mo={moXong} onMo={() => doi('+vua-xong', !moXong)} chevSauTen trungTinh
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
/**
 * TUYEN-3 (rà PTA #2281): chữ chi tiết MỘT tầng, cùng khuôn mọi dòng — tuyến: nhãn máy chủ ("Đang ở Báo PH · Phan Mai" / "Xong 12/09/2026");
 * việc theo dõi tay (N58) còn mở: "Đang ở {tên việc ngắn} · {người phụ trách}" (nguồn đã ở tên mục); đã xong: trạng thái.
 */
const chuDong = (d: DongTd) => (d.tuyen || d.trangThai !== 'mo' ? dich(d.nhanTrangThai)
  : [`${t('Đang ở')} ${dich(tenDong(d).split(' · ')[0].replace(/^Nhận thông tin$/, 'Nhận tin'))}`, d.phuTrach ? dich(d.phuTrach) : null].filter(Boolean).join(' · '));
/** Khoá gộp lớp × nguồn (mục Báo PH): tuyến — tên tuyến; việc N58 — tên việc đầy đủ ("Báo PH · Trao đổi với gia đình"). */
const khoaGop = (d: DongTd) => `${d.classCode ?? ''}|${d.tuyen ? tenTuyen(d.tuyen) : tenDong(d)}`;

/**
 * Dòng của một mục. `gop` (mục Báo PH — mockup v27 T8a "MB FOU 15 · 4 em"): em cùng lớp × nguồn gộp MỘT dòng "n em"; bấm dòng bung danh sách em ngay dưới
 * (mỗi em mở panel của mình). Em đang chọn (đường dẫn `theo=`) → dòng gộp bung sẵn.
 */
function DsDong({ ds, gop, chon, onMo }: { ds: DongTd[]; gop: boolean; chon: string | null; onMo: (d: DongTd) => void }) {
  const [mo, setMo] = useState<ReadonlySet<string>>(() => new Set());
  const nhomGop = new Map<string, DongTd[]>();
  if (gop) for (const d of ds) if (d.studentName) { const k = khoaGop(d); nhomGop.set(k, [...(nhomGop.get(k) ?? []), d]); }
  const daVe = new Set<string>();
  const ra: ReactNode[] = [];
  for (const d of ds) {
    const k = gop && d.studentName ? khoaGop(d) : null;
    const nhom = k ? nhomGop.get(k)! : null;
    if (!k || !nhom || nhom.length < 2) { ra.push(<li key={khoaTd(d)} className="cvA-sub"><DongTheoDoiViec d={d} chon={chon === khoaTd(d)} onMo={() => onMo(d)} /></li>); continue; }
    if (daVe.has(k)) continue;
    daVe.add(k);
    const bung = mo.has(k) || nhom.some((x) => khoaTd(x) === chon);
    ra.push(<li key={`gop:${k}`} className="cvA-sub"><DongGop ds={nhom} bung={bung} onBam={() => setMo((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; })} /></li>);
    if (bung) ra.push(<li key={`con:${k}`} className="cvA-sub cvA-con"><ul className="cvA-sub">
      {nhom.map((x) => <li key={khoaTd(x)} className="cvA-sub"><DongTheoDoiViec d={x} chon={chon === khoaTd(x)} onMo={() => onMo(x)} /></li>)}
    </ul></li>);
  }
  return <>{ra}</>;
}

/** Dòng gộp "n em": lớp · "n em" ˅ · "Đang ở {bước} · {người}" (nhiều người → "n người") · hạn sớm nhất (quá hạn nếu có em quá hạn). */
function DongGop({ ds, bung, onBam }: { ds: DongTd[]; bung: boolean; onBam: () => void }) {
  const hn = useHn();
  const chuEm = ds.map(chuDong);
  const nguoi = [...new Set(chuEm.map((c) => c.split(' · ').slice(1).join(' · ')).filter(Boolean))];
  const buoc = chuEm[0].split(' · ')[0];
  const chu = nguoi.length > 1 ? `${buoc} · ${t('{n} người', { n: nguoi.length })}` : chuEm[0];
  const han = ds.map((x) => x.han).filter((h): h is string => !!h).sort()[0] ?? null;
  const qua = ds.some((x) => x.quaHan);
  const muc = qua ? 'qua' : han ? (mucHan(han, hn) === 'qua' ? 'xa' : mucHan(han, hn)) : 'xa';
  return (
    <div onClick={onBam} className="cvA-v">
      <span className="cvA-lop">{ds[0].classCode}</span>
      <span className="cvA-ai"><button type="button" className="cvA-ten !font-semibold" aria-expanded={bung} onClick={(e) => { e.stopPropagation(); onBam(); }}>
        {t('{n} em', { n: ds.length })}
        <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current" strokeWidth={1.6}><path d={bung ? 'M3 7.5L6 4.5 9 7.5' : 'M3 4.5L6 7.5 9 4.5'} /></svg></button></span>
      <span className="cvA-ct" title={chu}>{chu}</span>
      <span className={`cvA-hn ${muc === 'xa' ? '' : muc}`}>{han ? <>{muc === 'qua' && <DauQuaHan />}{shortDate(han, hn)}</> : <span className="sr-only">{t('không hạn')}</span>}</span>
    </div>
  );
}

/** Khuôn A: lớp · em · việc · phụ trách · trạng thái · hạn (ngày tô màu; cờ quá hạn của máy chủ — Báo PH "Chờ GV sửa" không quá hạn). */
function DongTheoDoiViec({ d, chon, onMo }: { d: DongTd; chon: boolean; onMo: () => void }) {
  const hn = useHn();
  /* TUYEN-3 (mockup v27 T8a, rà PTA #2281): MỘT khuôn dòng — "Đang ở {bước ngắn} · {người}" / "Xong …"; chip SOS (Phối hợp SOS) cạnh tên em. */
  const chu = chuDong(d);
  const sos = d.tuyen?.loai === 'phoi_hop' ? Number(d.tieuDe.match(/SOS (\d)/)?.[1]) || null : null;
  const muc = d.quaHan ? 'qua' : d.han ? (mucHan(d.han, hn) === 'qua' ? 'xa' : mucHan(d.han, hn)) : 'xa';
  /* Việc không gắn em: tên ngắn (bỏ phần đầu đã là tên mục — "Nhận thông tin · Chuyển lớp" → "Chuyển lớp") để cột em vừa chữ, cột chi tiết rộng nhất. */
  const ten = d.studentName ?? (d.tuyen ? d.tieuDe.split(' · ').at(-1)! : dich(tenDong(d).split(' · ').slice(1).join(' · ') || tenDong(d)));
  return (
    <div data-khoa={khoaTd(d)} onClick={onMo} className={`cvA-v ${d.studentName || d.classCode ? '' : 'cvA-kl'} ${chon ? 'dang-chon' : ''}`}>
      <span className="cvA-lop">{d.classCode}</span>
      <span className="cvA-ai"><button type="button" className={`cvA-ten ${d.studentName ? '' : '!font-semibold'}`} aria-current={chon ? 'true' : undefined} onClick={(e) => { e.stopPropagation(); onMo(); }}>
        {d.trangThai === 'xong' && <span aria-hidden className="text-ok">✓ </span>}{ten}</button>{sos ? <ChipSos muc={sos} hienKyNang={false} /> : null}</span>
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
  if (d.tuyen) return <PanelTuyenTheoDoi key={khoaTd(d)} x={d.tuyen} onDong={onDong} />;
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

/**
 * PANEL CHỈ ĐỌC MỘT TUYẾN (TUYEN-3, mockup v27 T8a / T8d): tiêu đề = tên tuyến · em · lớp · ngữ cảnh (MT2 · SOS 3) → dải "Bạn đang theo dõi · chỉ xem" + "Bỏ theo dõi"
 * (bỏ CẢ tuyến — máy chủ `boTheoDoiTuyen`; Hoàn tác = theo dõi lại) → khối Tuyến (nội dung từng bước theo quyền C3, bấm bước mở tại chỗ) → chân Đóng.
 * `GET /tuyen/:loai/:khoa` chỉ khi mở. Dòng lô (Chuyển lớp n em): một khối Tuyến mỗi em.
 */
function PanelTuyenTheoDoi({ x, onDong }: { x: DongTuyen; onDong: () => void }) {
  const toast = useToast();
  const [dang, setDang] = useState(false);
  const khoa = x.khoaLo ?? [x.khoa];
  const duong = (k: string) => `/tuyen/${x.loai}/${encodeURIComponent(k)}`;
  const ngCanh = x.tieuDe.split(' · ').slice(1).filter((s) => s !== x.studentName && s !== x.classCode).join(' · ') || null;
  const dau = dauViec({ em: x.studentId != null ? { id: x.studentId, ten: x.studentName ?? '' } : null, lop: x.classCode, ngCanh });
  const theoLai = async () => { try { await Promise.all(khoa.map((k) => api.post(`${duong(k)}/theo-doi`, {}))); invalidate('/my-work/theo-doi'); } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } };
  const bo = async () => {
    setDang(true);
    try {
      await Promise.all(khoa.map((k) => api.del(`${duong(k)}/theo-doi`)));
      invalidate('/my-work/theo-doi');
      toast.hoanTac(t('Đã bỏ theo dõi tuyến'), () => void theoLai());
      onDong();
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setDang(false); }
  };
  const chan = { huy: null, chinh: <button type="button" className="btn min-h-[44px] sm:min-h-[36px]" onClick={onDong}>{t('Đóng')}</button> };
  return (
    <KhungPanel tieuDe={dich(tenTuyen(x))} dau={dau} onDong={onDong} chan={chan}>
      <div className="flex flex-col gap-3 pt-4">
        <div className="flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm text-dim" style={{ background: 'var(--surface-2)' }}>
          <span className="min-w-0 flex-1"><b className="font-semibold text-[color:var(--text)]">{t('Bạn đang theo dõi')}</b> · {t('chỉ xem')}</span>
          {!x.ketThuc && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" disabled={dang} onClick={() => void bo()}>{t('Bỏ theo dõi')}</button>}
        </div>
        {khoa.map((k) => <TuyenTai key={k} duong={duong(k)} lo={khoa.length > 1} onDong={onDong} />)}
      </div>
    </KhungPanel>
  );
}
/**
 * Thân một tuyến (chủ SP 27/11: panel không được chỉ một dòng chữ — phải có thông tin làm việc):
 * bước đang ở là MỘT việc Báo PH → nhúng panel Báo PH chỉ xem (Tuyến + Phụ trách · Hạn + Máy điền sẵn / bối cảnh + liên hệ PH + lần liên hệ + Lịch sử — cùng đường
 * máy chủ, quyền như panel Báo PH); còn lại → khối Tuyến MỞ SẴN nội dung bước đang ở + bước xong gần nhất (theo quyền C3).
 */
function TuyenTai({ duong, lo, onDong }: { duong: string; lo: boolean; onDong: () => void }) {
  const { data, error, reload } = useApi<Tuyen>(duong, [duong]);
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (!data) return <Skeleton rows={4} />;
  const dang = data.buoc.filter((b) => b.trangThai === 'dang' || b.trangThai === 'tam_dung');
  const bp = !lo && dang.length === 1 && dang[0].viec?.loai === 'bao_ph' ? dang[0] : null;
  if (bp && data.em) {
    const it = { key: `td:bao-ph:${bp.viec!.id}`, group: 'bao_ph_yt', viecId: bp.viec!.id, studentId: data.em.id, studentName: data.em.ten, classCode: data.em.lop,
      classId: null, contextLabel: bp.ten.split(' · ').slice(1).join(' · ') || null, urgency: 'normal', due: bp.han } as unknown as WorkItem;
    return <PanelBaoPhTvv nhung chiXem it={it} onDong={onDong} onDaLam={() => {}} onTiep={null} />;
  }
  const xongCuoi = data.buoc.filter((b) => b.trangThai === 'xong' && b.coNoiDung).at(-1)?.khoa;
  return (
    <div className="grid gap-1.5">
      {lo && <b className="text-sm font-semibold">{data.em?.ten}</b>}
      <KhoiTuyen tuyen={data} moSan={(b) => b.trangThai === 'dang' || b.trangThai === 'tam_dung' || b.khoa === xongCuoi} />
    </div>
  );
}
