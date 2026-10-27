import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { duongHoSoHocVien, duongLichTest, skillShort, tuanLich } from '@shared/domain/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { XemCha, useThamSoUrl, useXem } from '../../lib/quayLai.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { CHIP_VUONG, ChipHan } from '../../ui/Nhan.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { PanelNhapDiem } from '../congViec/PanelViec.tsx';
import type { BangTheoLuot } from '../cham/LuoiChamLop.tsx';
import { t } from '@shared/i18n/index.ts';

/** Trả lời của `GET /tong-quan/gv-tre` (`server/src/worklist/gvTre.ts`). */
type DongGvTre = {
  key: string; classId: number | null; lop: string | null; luot: string | null; luotChu: string; tuan: string | null; periodId: number | null;
  kns: string[]; knChu: string; soBai: number; han: string | null; em: number[]; nhapHo: boolean;
};
type NhomGvTre = { gvId: number; ten: string; soBai: number; dong: DongGvTre[] };
/** Dòng đang vẽ: `du` = vừa nhập hộ đủ, máy chủ không còn trả — giữ chỗ "✓ Đã đủ". */
type DongHien = DongGvTre & { du?: true };
type NhomHien = Omit<NhomGvTre, 'dong'> & { dong: DongHien[] };
type DuLieu = { chiNhanh: string | null; soGv: number; soBai: number; soBaiChuaCoGv: number; choCham: number; nhom: NhomGvTre[] };
export type CauHinhGvTre = {
  /** Dòng loại trên tiêu đề ("SỐ LIỆU · MOCK TEST" Admin · "SỐ LIỆU · TỔNG QUAN" QL). */ loai: string;
  /** Admin: đầu panel đếm GV (= số trên ô "n giáo viên"). */ theoGv?: boolean;
  trong: string; cachTinh: string;
};

const tenNhom = (g: Pick<NhomGvTre, 'gvId' | 'ten'>) => (g.gvId > 0 ? g.ten : g.gvId === 0 ? t('Chưa có GV') : g.ten);
const tenDong = (d: DongGvTre) => [d.lop, d.luotChu].filter(Boolean).join(' · ');
const tieuDeDong = (d: DongGvTre) => `${tenDong(d)} · ${d.knChu}`;

/**
 * PANEL "GV CHẤM QUÁ HẠN" (M6 6b-4, mockup `thiet-ke/v7/panel-pilot.html` khu ③) — ai · lớp · bài · quá hạn bao lâu · ai xử lý. Ba view một chuỗi
 * (`?panel=`, luật Quay lại V19): danh sách theo GV (dải nhóm V21, vạch trung tính) → "em còn trống" của một dòng lớp · lượt · kỹ năng → Nhập hộ
 * (lưới nhập của Công việc, `PanelNhapDiem`). Số = số dòng: Admin đọc tập khối Mock Test, QL đọc Trễ chấm của một GV (Q8, máy chủ).
 * Dòng vừa nhập hộ đủ mà máy chủ không còn trả → giữ chỗ "✓ Đã đủ" (không nhảy mắt); lưu điểm tự tải lại panel (`invalidate('/tong-quan')`).
 */
export function PanelGvTre({ nguon, tieuDe, cauHinh, onDong }: { nguon: string; tieuDe: string; cauHinh: CauHinhGvTre; onDong: () => void }) {
  const { data, loading, error, reload } = useApi<DuLieu>(nguon, [nguon]);
  const toi = useSession().session?.user?.id ?? null;
  const { homNay, ngan } = useNgayNghiepVu();
  const xem = useXem({ url: true });
  const [moKhoa, datMo] = useThamSoUrl('dong', '');
  const [giu, setGiu] = useState<Map<string, { nhom: NhomGvTre; dong: DongGvTre }>>(() => new Map());

  /* Dòng đã nhập hộ mà tập mới không còn → giữ chỗ trong nhóm cũ (nhóm hết dòng vẫn vẽ). */
  const nhom: NhomHien[] = (data?.nhom ?? []).map((g) => ({ ...g, dong: [...g.dong] }));
  for (const [k, x] of giu) {
    if (nhom.some((g) => g.dong.some((d) => d.key === k))) continue;
    const g = nhom.find((y) => y.gvId === x.nhom.gvId) ?? (nhom.push({ ...x.nhom, soBai: 0, dong: [] }), nhom[nhom.length - 1]);
    g.dong.push({ ...x.dong, du: true });
  }
  /* Panel một GV (QL bấm ô của một GV): tiêu đề đã có tên — không vẽ dải nhóm lặp tên; link hồ sơ GV lên đầu panel. */
  const motGv = !cauHinh.theoGv && nhom.length === 1 ? nhom[0] : null;
  const soDu = nhom.reduce((n, g) => n + g.dong.filter((d) => d.du).length, 0);
  const tim = nhom.flatMap((g) => g.dong.map((d) => ({ g, d }))).find((x) => x.d.key === moKhoa) ?? null;
  const view = tim ? xem.ds[xem.ds.length - 1] : undefined;
  const moDong = (k: string) => { datMo(k); xem.vao('em', true, { dong: k }); };

  let noiDung: ReactNode;
  if (tim && view === 'nhap' && tim.d.classId && tim.d.luot) {
    const { g, d } = tim;
    noiDung = (
      <PanelNhapDiem chiEmViec quayLai={{ nhan: tieuDeDong(d), onClick: xem.lui }} onDong={onDong}
        onDaLam={() => setGiu((m) => new Map(m).set(d.key, { nhom: { ...g, dong: [] }, dong: d }))}
        it={{ key: d.key, classId: d.classId, luot: d.luot ?? undefined, kn: d.kns[0], kns: d.kns, studentId: null, emIds: d.em,
          tieuDe: g.gvId === toi ? t('Nhập điểm {mon}', { mon: d.knChu }) : t('Nhập hộ {mon}', { mon: d.knChu }), classCode: d.lop ?? '',
          contextLabel: [d.luotChu, d.tuan ? tuanLich(d.tuan) : null].filter(Boolean).join(' '), due: d.han }} />
    );
  } else if (tim && view === 'em') {
    noiDung = <ViewEm g={tim.g} d={tim.d} toi={toi} loai={cauHinh.loai} veNhan={tieuDe} onLui={xem.lui} onNhap={() => xem.vao('nhap')} onDong={onDong} />;
  } else {
    noiDung = (
      <KhungPanel tieuDe={tieuDe} loai={cauHinh.loai} onDong={onDong}
        dau={{ dong2: data ? [
          /* V11: phạm vi + tuần dữ liệu trước tổng. */
          [data.chiNhanh ?? t('Mọi chi nhánh'), homNay ? tuanLich(homNay) : null].filter(Boolean).join(' · '),
          motGv && motGv.gvId > 0 ? <Link className="font-semibold text-slate-100 no-underline hover:underline" to={`/giao-vien/${motGv.gvId}`}>{t('Hồ sơ GV')}<span aria-hidden className="ml-0.5 text-xs text-[color:var(--accent)]">↗</span></Link> : null,
          [cauHinh.theoGv ? t('{n} GV', { n: data.soGv }) : null, t('{n} bài', { n: data.soBai })].filter(Boolean).join(' · '),
          data.soBaiChuaCoGv ? t('+ {n} bài chưa có GV', { n: data.soBaiChuaCoGv }) : null,
          soDu ? t('{n} dòng vừa đủ', { n: soDu }) : null,
        ] : [] }}>
        {error ? <div className="pt-3"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
          : loading && !data ? <div className="pt-3"><Skeleton rows={5} /></div>
          : !nhom.length ? <Empty title={cauHinh.trong} />
          : nhom.map((g) => <NhomGv key={g.gvId} g={g} mo={moKhoa} onMo={moDong} dai={!motGv} />)}
        {data && data.choCham > 0 && (
          <p className="m-0 mt-3 border-t pt-3 text-[13px] text-slate-400" style={{ borderColor: 'var(--line)' }}>
            {t('Speaking chấm chéo chưa ai nhận: {n} bài — chờ chấm, không tính quá hạn.', { n: data.choCham })}
          </p>
        )}
        <details className="mt-4 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <summary className="min-h-[44px] cursor-pointer text-[13px] font-semibold text-[color:var(--accent)] sm:min-h-0">{t('Cách tính')}</summary>
          <p className="m-0 mt-2 max-w-[60ch] text-xs leading-relaxed text-slate-400">{cauHinh.cachTinh} {homNay && t('Dữ liệu đến {ngay}.', { ngay: ngan(homNay) })}</p>
        </details>
      </KhungPanel>
    );
  }
  /* Một chuỗi view một bề rộng (V19). */
  return <XemCha.Provider value={{ ten: tieuDe, rong: 'rong' }}>{noiDung}</XemCha.Provider>;
}

/** Dải nhóm một GV (V21: nền surface-2, vạch 3 px TRUNG TÍNH — nhóm theo người, không theo bước) + dòng lớp · lượt · kỹ năng. */
function NhomGv({ g, mo, onMo, dai = true }: { g: NhomHien; mo: string; onMo: (k: string) => void; /** false: không vẽ dải tên (panel một GV). */ dai?: boolean }) {
  const lopChuaGv = g.gvId === 0 ? [...new Map(g.dong.filter((d) => d.classId).map((d) => [d.classId!, d.lop])).entries()] : [];
  return (
    <section>
      {dai && <h3 className="sticky top-0 z-[1] -mx-4 m-0 flex min-h-[40px] flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-[15px] font-bold leading-[1.35] text-slate-100"
        style={{ background: 'var(--surface-2)', boxShadow: 'inset 3px 0 0 var(--line-strong)' }}>
        {g.gvId > 0
          ? <Link to={`/giao-vien/${g.gvId}`} className="text-slate-100 no-underline hover:underline">{g.ten}<span aria-hidden className="ml-0.5 text-xs text-[color:var(--accent)]">↗</span></Link>
          : <span>{tenNhom(g)}</span>}
        <span className={`${CHIP_VUONG} text-slate-200`} style={{ borderColor: 'var(--line-strong)' }}>{t('{n} bài', { n: g.soBai })}</span>
        {g.gvId === 0 && <span className="text-[13px] font-medium text-slate-400">{t('lớp chưa phân công GV môn')}</span>}
      </h3>}
      <ul className="-mx-4 m-0 list-none p-0">
        {g.dong.map((d) => {
          const chon = mo === d.key;
          return (
            <li key={d.key} className="scroll-mt-12 border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
              <button type="button" disabled={!!d.du} aria-current={chon || undefined} onClick={() => onMo(d.key)}
                style={chon ? { background: 'var(--accent-soft)', boxShadow: 'inset 3px 0 0 var(--accent)' } : undefined}
                className="grid min-h-[44px] w-full appearance-none items-center gap-x-4 gap-y-1 border-0 bg-transparent px-4 py-2.5 text-left hover:bg-[color:var(--accent-soft)] disabled:hover:bg-transparent grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_4.5rem_6rem_9.5rem]">
                <span className={`min-w-0 text-[15px] font-medium leading-snug ${d.du ? 'text-slate-300' : 'text-slate-100'}`}>
                  {tenDong(d)} <span className={`${CHIP_VUONG} ml-1 align-[1px] text-[color:var(--accent)]`} style={{ borderColor: 'var(--line-strong)' }}>{d.knChu}</span>
                  {d.tuan && <span className="ml-2 text-[13px] font-normal text-slate-400">{t('thi {tuan}', { tuan: tuanLich(d.tuan) })}</span>}
                </span>
                {d.du ? <b className="col-span-1 text-right text-[13px] font-semibold text-ok sm:col-span-3">✓ {t('Đã đủ')}</b> : (
                  <>
                    <span className="text-right text-[13px] tabular-nums text-slate-200 max-sm:hidden">{t('{n} bài', { n: d.soBai })}</span>
                    <HanNgan han={d.han} className="text-right max-sm:hidden" />
                    <span className="flex justify-end max-sm:hidden"><ChipHan loai="nhap-diem" han={d.han} /></span>
                    {/* 375: một dòng phụ "n bài · hạn · quá hạn" dưới tên. */}
                    <span className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] tabular-nums text-slate-300 sm:hidden">
                      {t('{n} bài', { n: d.soBai })}<HanNgan han={d.han} /><ChipHan loai="nhap-diem" han={d.han} />
                    </span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {lopChuaGv.map(([id, lop]) => (
        <p key={id} className="m-0 px-0 pb-2 text-[13px]">
          <Link className="link max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={`/hoc-vien/lop/${id}`}>{t('Phân công GV ở hồ sơ lớp {lop} ›', { lop: lop ?? '' })}</Link>
        </p>
      ))}
    </section>
  );
}

function HanNgan({ han, className = '' }: { han: string | null; className?: string }) {
  const { ngan } = useNgayNghiepVu();
  return han ? <span className={`text-[13px] tabular-nums text-slate-400 ${className}`}>{t('hạn {ngay}', { ngay: ngan(han) })}</span> : <span className={className} />;
}

/** View "em còn trống" của một dòng: điểm từng cột của việc (cùng lưới `diem-theo-luot` mà Nhập hộ mở), link Lịch Test, chân Nhập hộ / câu ai làm được. */
function ViewEm({ g, d, toi, loai, veNhan, onLui, onNhap, onDong }: {
  g: NhomGvTre; d: DongHien; toi: number | null; loai: string; veNhan: string; onLui: () => void; onNhap: () => void; onDong: () => void;
}) {
  const { ngan } = useNgayNghiepVu();
  const nguoiNhap = g.gvId > 0
    ? <>{t('người nhập')} <Link className="font-bold text-slate-100 no-underline hover:underline" to={`/giao-vien/${g.gvId}`}>{g.ten}<span aria-hidden className="ml-0.5 text-xs text-[color:var(--accent)]">↗</span></Link></>
    : tenNhom(g);
  const cuaToi = g.gvId === toi;
  const chuChan = !d.nhapHo ? t('Chỉ GV chấm, Quản lý hoặc Admin của chi nhánh nhập được bài này.')
    : cuaToi ? null : g.gvId > 0 ? t('Bạn được ghi là người nhập; bài vẫn của {ten}', { ten: g.ten })
    : t('Bạn được ghi là người nhập.');
  return (
    <KhungPanel tieuDe={tieuDeDong(d)} loai={loai} onDong={onDong} quayLai={{ nhan: veNhan, onClick: onLui }}
      dau={{
        han: d.du ? <b className="text-[13px] font-semibold text-ok">✓ {t('Đã đủ')}</b> : <ChipHan loai="nhap-diem" han={d.han} />,
        dong2: [nguoiNhap, [d.tuan ? t('thi {tuan}', { tuan: tuanLich(d.tuan) }) : null, d.han ? t('hạn {ngay}', { ngay: ngan(d.han) }) : null].filter(Boolean).join(' · '),
          d.du ? null : <b className="font-semibold text-slate-100">{t('{n} bài còn trống', { n: d.soBai })}</b>],
      }}
      chan={{
        huy: null,
        trai: chuChan ? <span className="text-[13px] text-slate-400 [text-wrap:pretty]">{chuChan}</span> : undefined,
        chinh: d.nhapHo && d.classId && d.luot ? <button type="button" className="btn btn-primary min-h-[44px] px-4 font-bold sm:min-h-0" onClick={onNhap}>{cuaToi ? t('Nhập điểm') : t('Nhập hộ')}</button> : undefined,
      }}>
      {d.classId && d.luot ? <BangEm d={d} /> : <p className="m-0 pt-3 text-sm text-slate-300">{t('Bài này không thuộc lớp nào — mở ở hồ sơ lượt Test.')}</p>}
      {d.classId && (
        <p className="m-0 mt-4 text-sm">
          <Link className="link max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={duongLichTest({ classId: d.classId, periodId: d.periodId, kn: d.kns[0] ?? null })}>
            {d.tuan ? t('Mở lưới lớp ở Lịch Test ({tuan}) ›', { tuan: tuanLich(d.tuan) }) : t('Mở lưới lớp ở Lịch Test ›')}
          </Link>
        </p>
      )}
      {g.gvId === 0 && d.classId && (
        <p className="m-0 mt-2 text-sm"><Link className="link" to={`/hoc-vien/lop/${d.classId}`}>{t('Phân công GV ở hồ sơ lớp {lop} ›', { lop: d.lop ?? '' })}</Link></p>
      )}
    </KhungPanel>
  );
}

/** Một ô của bảng em: điểm đã có · "trống" = bài còn nợ (quá hạn, chưa điểm — đếm khớp "n bài còn trống") · chữ mờ = không tính (đã huỷ, vắng, chưa tới hạn). */
type OEm = { diem: string } | { trong: true } | { khong: string };
/** Các em của dòng × cột của việc (cùng lưới `diem-theo-luot` mà Nhập hộ mở). */
function BangEm({ d }: { d: DongGvTre }) {
  const { data, error, reload } = useApi<BangTheoLuot>(`/classes/${d.classId}/diem-theo-luot/${encodeURIComponent(d.luot!)}`, [d.classId, d.luot]);
  if (error) return <div className="pt-3"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>;
  if (!data) return <div className="pt-3"><Skeleton rows={4} /></div>;
  const em = new Set(d.em);
  const hang: { id: number; ten: string; o: OEm[] }[] = data.ft
    ? data.ft.rows.filter((r) => em.has(r.studentId)).map((r) => ({ id: r.studentId, ten: r.studentName, o: d.kns.map((k): OEm => {
      const c = r.cells.find((x) => x.skill === k);
      if (c?.band != null) return { diem: c.band.toFixed(1) };
      if (c?.noShow) return { khong: t('vắng') };
      if (c?.progress === 'cancelled') return { khong: t('Đã huỷ') };
      return c?.required && c.overdue ? { trong: true } : { khong: t('không tính') };
    }) }))
    : (data.thuong?.rows ?? []).filter((r) => em.has(r.studentId)).map((r) => ({ id: r.studentId, ten: r.studentName, o: d.kns.map((k): OEm => {
      const s = r.result.skills.find((x) => x.skill === k)?.score;
      if (s != null) return { diem: String(s) };
      return r.skillSchedule.find((x) => x.skill === k)?.overdue ? { trong: true } : { khong: t('không tính') };
    }) }));
  const tenCot = (k: string) => (data.thuong ? data.thuong.monNgan?.[k] ?? data.thuong.skillLabels[k] ?? k : skillShort(k));
  if (!hang.length) return <p className="m-0 pt-3 text-sm text-slate-300">{t('Các em của dòng này không còn trong lưới lượt — mở lưới lớp để xem.')}</p>;
  const cot = `minmax(0,1fr) repeat(${d.kns.length}, 4.5rem)`;
  return (
    <div role="table" aria-label={t('Em còn trống')} className="-mx-4 mt-2">
      <div role="row" className="grid items-end gap-x-2 border-b px-4 pb-2 text-[13px] font-medium text-slate-400" style={{ gridTemplateColumns: cot, borderColor: 'var(--line)' }}>
        <span role="columnheader">{t('Học viên')}</span>
        {d.kns.map((k) => <span key={k} role="columnheader" className="text-center">{tenCot(k)}</span>)}
      </div>
      {hang.map((h) => (
        <div key={h.id} role="row" className="grid min-h-[44px] items-center gap-x-2 border-b px-4 py-2 text-[15px]" style={{ gridTemplateColumns: cot, borderColor: 'var(--line)' }}>
          <span role="cell" className="min-w-0 truncate">
            <Link className="font-medium text-slate-100 no-underline hover:underline" to={duongHoSoHocVien(h.id)}>{h.ten}<span aria-hidden className="ml-0.5 text-xs text-[color:var(--accent)]">↗</span></Link>
          </span>
          {h.o.map((v, i) => ('diem' in v ? <span key={i} role="cell" className="text-center tabular-nums text-slate-100">{v.diem}</span>
            : 'trong' in v ? <span key={i} role="cell" className="text-center text-[13px] font-semibold text-late">{t('trống')}</span>
            : <span key={i} role="cell" className="text-center text-[13px] text-slate-500">{v.khong}</span>))}
        </div>
      ))}
    </div>
  );
}
