import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { Bang } from '../../ui/Bang.tsx';
import { NhanKq } from '../../ui/Nhan.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel, NhapViec, Truong, useNhap, useXoaNhap } from '../../ui/KhungPanel.tsx';
import { ChuLuu, type TtLuu } from '../../ui/KhuonViec.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { luuRoiTiep, tenMonNgan, type DinhNghiaCot } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

type Ti = { score: number | null; total: number | null };
type Em = {
  id: number; fullName: string; status: string; archived: boolean; skills: string[] | null;
  timeline: { id: number; kind: string; ratios: Record<string, Ti> | null }[];
  dauRa: { trangThai: 'cho-final' | 'dat' | 'chua-dat'; tyLe: number | null } | null;
};
type LuuDauRa = { luc: string; nguoi: string | null; nhanXet: string | null; deXuat: string | null };
type DongDauRa = { studentId: number; nhanXet: string | null; deXuat: string | null; boi: string | null; luc: string | null; lichSu: LuuDauRa[] };
type DauRa = { rows: DongDauRa[]; coTheGhi: boolean };

/** Đề xuất bước tiếp — cùng mã hướng Lộ trình tiếp theo (máy chủ `DE_XUAT_DAU_RA`). */
const DE_XUAT: [string, string][] = [['len_lop', t('Lên lớp kế')], ['fast_track', t('Lên FT')], ['hoc_lai', t('Học lại')], ['bao_luu', t('Tạm dừng')], ['dung_hoc', t('Dừng học hẳn')]];
const nhanDeXuat = (k: string | null) => DE_XUAT.find(([m]) => m === k)?.[1] ?? null;
const daGhi = (d?: DongDauRa) => !!d && (!!d.nhanXet || !!d.deXuat);
const tong = (r: Record<string, Ti> | null | undefined) => {
  const ds = Object.values(r ?? {}).filter((x) => x.score !== null && x.total);
  return ds.length ? `${ds.reduce((n, x) => n + x.score!, 0)}/${ds.reduce((n, x) => n + x.total!, 0)}` : null;
};
const luot = (e: Em, kind: string) => e.timeline.find((x) => x.kind === kind) ?? null;
export const duongDauRa = (classId: number) => `/classes/${classId}/danh-gia-dau-ra`;

const COT: DinhNghiaCot[] = [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 200 }, { key: 'pf', nhan: 'Progress → Final', kieu: 'chip', rong: 190 },
  { key: 'kq', nhan: t('Kết quả'), kieu: 'chip', rong: 160 }, { key: 'dx', nhan: t('Đề xuất bước tiếp'), kieu: 'chip', rong: 160 },
  { key: 'nx', nhan: t('Nhận xét GVCN'), kieu: 'chu' }, { key: 'nut', nhan: '', kieu: 'nut', rong: 120 },
];

/**
 * TAB "ĐÁNH GIÁ ĐẦU RA" — lớp thường (`ho-so-lop.html` khung T12, C17, R3a): bảng em · Progress → Final · Kết quả (máy tính khi đủ Final; trước đó
 * "Chờ Final") · Đề xuất bước tiếp · Nhận xét GVCN · nút. "Đánh giá lần lượt · từ em k" mở panel phải và đi qua từng em ("Lưu và em tiếp") — 0 đổi trang.
 * GVCN / QL của lớp ghi (máy chủ kiểm); người khác chỉ xem. Chỉ là đề xuất — QL chốt ở Lộ trình tiếp theo.
 */
export function TabDauRa({ classId, maLop, chuongTrinh }: { classId: number; maLop: string; chuongTrinh: string | null }) {
  const roster = useApi<Em[]>(`/classes/${classId}/roster`, [classId]);
  const dr = useApi<DauRa>(duongDauRa(classId), [classId]);
  const [mo, setMo] = useState<number | null>(null);
  if (roster.error || dr.error) return <ErrorState message={(roster.error ?? dr.error)!.message} onRetry={() => { roster.reload(); dr.reload(); }} />;
  if (!roster.data || !dr.data) return <div className="card p-4"><Skeleton rows={6} /></div>;
  const em = roster.data.filter((e) => e.status === 'active' && !e.archived);
  const cua = new Map(dr.data.rows.map((d) => [d.studentId, d]));
  const soXong = em.filter((e) => daGhi(cua.get(e.id))).length;
  const dau = em.findIndex((e) => !daGhi(cua.get(e.id)));
  const ghi = dr.data.coTheGhi;

  const oCua = (e: Em, c: DinhNghiaCot) => {
    const d = cua.get(e.id);
    switch (c.key) {
      case 'ten': return <Link to={`/hoc-vien/${e.id}`} className="font-semibold text-slate-100 no-underline hover:underline">{e.fullName} <span aria-hidden className="font-normal text-slate-500">↗</span></Link>;
      case 'pf': {
        const p = tong(luot(e, 'progress')?.ratios); const f = tong(luot(e, 'final')?.ratios);
        return <span className="tabular-nums">{p ?? '—'} → {f ?? <span className="text-slate-500">{t('chờ Final')}</span>}</span>;
      }
      case 'kq': return <KetQuaDauRa e={e} />;
      case 'dx': return nhanDeXuat(d?.deXuat ?? null) ?? <span className="text-slate-500">—</span>;
      case 'nx': return d?.nhanXet ? <span title={d.nhanXet}>{d.nhanXet}</span> : <span className="text-slate-500">{t('Chưa ghi')}</span>;
      case 'nut': return ghi ? <button type="button" className="btn btn-sm" onClick={() => setMo(e.id)}>{daGhi(d) ? t('Sửa') : t('Đánh giá')}</button> : null;
      default: return null;
    }
  };
  const viTri = mo === null ? -1 : em.findIndex((e) => e.id === mo);
  return (
    <>
      <section className="card overflow-clip">
        <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
          <h2 className="m-0 text-[15px] font-bold text-slate-100">{t('Đánh giá đầu ra')} · {maLop}</h2>
          <span className="text-[13px] tabular-nums text-slate-400">{soXong}/{em.length}</span>
          {ghi && em.length > 0 && (
            <button type="button" className="btn btn-primary btn-sm ml-auto max-sm:min-h-[44px]" onClick={() => setMo(em[Math.max(dau, 0)].id)}>
              {dau > 0 ? t('Đánh giá lần lượt · từ em {n}', { n: dau + 1 }) : t('Đánh giá lần lượt')}
            </button>
          )}
        </div>
        <Bang ten={t('Đánh giá đầu ra lớp {lop}', { lop: maLop })} cot={COT} hang={em} khoa={(e) => e.id} oCua={oCua} khung={false}
          dangMo={(e) => e.id === mo} rong={{ tieuDe: t('Lớp chưa có học viên') }} />
      </section>
      {viTri >= 0 && (
        <NhapViec key={em[viTri].id} khoa={`dau-ra:${classId}:${em[viTri].id}`}>
          <PanelDauRa classId={classId} maLop={maLop} chuongTrinh={chuongTrinh} em={em} viTri={viTri} cua={cua}
            onDong={() => setMo(null)} onTiep={viTri + 1 < em.length ? () => setMo(em[viTri + 1].id) : null}
            onDaLuu={() => { invalidate(duongDauRa(classId)); dr.reload(); }} />
        </NhapViec>
      )}
    </>
  );
}

/** Kết quả đầu ra (R3a): Đạt / Chưa đạt chỉ khi đủ Final, trước đó "Chờ Final" — máy chủ `dauRa`. */
function KetQuaDauRa({ e }: { e: Em }) {
  const k = e.dauRa?.trangThai ?? 'cho-final';
  if (k === 'dat') return <NhanKq kq="dat">{t('Đạt')}{e.dauRa?.tyLe != null ? ` · ${Math.round(e.dauRa.tyLe * 100)} %` : ''}</NhanKq>;
  if (k === 'chua-dat') return <NhanKq kq="chua-dat">{t('Chưa đạt')}{e.dauRa?.tyLe != null ? ` · ${Math.round(e.dauRa.tyLe * 100)} %` : ''}</NhanKq>;
  return <NhanKq kq="thieu">{t('Chờ Final')}</NhanKq>;
}

/**
 * PANEL ĐÁNH GIÁ MỘT EM (khung T12): "VIỆC · ĐÁNH GIÁ ĐẦU RA · k / n" · thanh n vạch (đã ghi / em này) · Progress / Final từng môn · Kết quả · Nhận xét GVCN ·
 * Đề xuất bước tiếp · Lịch sử gập · chân Lưu / Lưu và em tiếp. Chữ đang gõ giữ ở máy theo em (`NhapViec`); lỗi lưu giữ chữ + Thử lại.
 */
function PanelDauRa({ classId, maLop, chuongTrinh, em, viTri, cua, onDong, onTiep, onDaLuu }: {
  classId: number; maLop: string; chuongTrinh: string | null; em: Em[]; viTri: number; cua: Map<number, DongDauRa>;
  onDong: () => void; onTiep: (() => void) | null; onDaLuu: () => void;
}) {
  const e = em[viTri];
  const d = cua.get(e.id);
  const { ngan } = useNgayNghiepVu();
  const [nhanXet, setNhanXet] = useNhap('nhan-xet', d?.nhanXet ?? '');
  const [deXuat, setDeXuat] = useNhap<string | null>('de-xuat', d?.deXuat ?? null);
  const xoaNhap = useXoaNhap();
  const [tt, setTt] = useState<TtLuu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const daSua = (nhanXet.trim() || null) !== (d?.nhanXet ?? null) || deXuat !== (d?.deXuat ?? null);
  const luu = async (): Promise<boolean> => {
    setTt('dang'); setLoi(null);
    try {
      await api.put(`${duongDauRa(classId)}/${e.id}`, { nhanXet: nhanXet.trim() || null, deXuat });
      xoaNhap(); setTt('da'); onDaLuu(); return true;
    } catch (x) { setTt('loi'); setLoi(x instanceof Error ? x.message : null); return false; }
  };
  const mon = (e.skills ?? ['listening', 'reading', 'writing', 'speaking']);
  const p = luot(e, 'progress')?.ratios; const f = luot(e, 'final')?.ratios;
  const o = (r: Record<string, Ti> | null | undefined, k: string) => (r?.[k]?.score != null ? `${r[k].score}/${r[k].total}` : null);
  const trangThai: TtLuu | null = tt ?? (daSua ? 'nhap' : null);
  return (
    <KhungPanel tieuDe={e.fullName} loai={`${t('VIỆC · ĐÁNH GIÁ ĐẦU RA')} · ${viTri + 1} / ${em.length}`} onDong={onDong}
      dau={{ dong2: [maLop, t('GVCN đề xuất, QL chốt')] }}
      chan={{
        huy: null, daSua: daSua && tt !== 'da',
        trai: trangThai && <ChuLuu tt={trangThai} loi={loi} />,
        phu: tt === 'loi' ? null : <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luu()}>{t('Lưu')}</button>,
        chinh: tt === 'loi'
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()}>{t('Thử lại')}</button>
          : onTiep ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luuRoiTiep(luu, onTiep)}>{t('Lưu và em tiếp')}</button> : null,
      }}>
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex gap-[3px]" role="img" aria-label={t('Đã đánh giá {n} / {tong}', { n: em.filter((x) => daGhi(cua.get(x.id))).length, tong: em.length })}>
          {em.map((x, i) => (
            <i key={x.id} className="h-1 flex-1 rounded-sm" style={{ background: i === viTri ? 'var(--accent)' : daGhi(cua.get(x.id)) ? 'rgb(var(--ok-line-rgb))' : 'var(--line)' }} />
          ))}
        </div>
        <div className="grid items-center gap-x-2 gap-y-1 rounded-lg bg-[color:var(--surface-2)] px-3 py-2.5 text-sm" style={{ gridTemplateColumns: `5.5rem repeat(${mon.length}, minmax(0, 1fr))` }}>
          <span />{mon.map((k) => <span key={k} className="text-center text-xs font-semibold text-slate-400">{tenMonNgan(chuongTrinh, k)}</span>)}
          <span className="text-[13px] text-slate-400">Progress</span>{mon.map((k) => <span key={k} className="text-center tabular-nums">{o(p, k) ?? '—'}</span>)}
          <span className="text-[13px] text-slate-400">Final</span>{mon.map((k) => <span key={k} className={`text-center tabular-nums ${o(f, k) ? '' : 'text-slate-500'}`}>{o(f, k) ?? t('chưa nhập')}</span>)}
        </div>
        <Truong nhan={t('Kết quả')} as="div"><span><KetQuaDauRa e={e} /></span></Truong>
        <Truong nhan={t('Nhận xét GVCN')}>
          <textarea className="field w-full" rows={3} maxLength={2000} value={nhanXet} onChange={(x) => { setNhanXet(x.target.value); setTt(null); }} />
        </Truong>
        <Truong nhan={t('Đề xuất bước tiếp')} as="div">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('Đề xuất bước tiếp')}>
            {DE_XUAT.map(([v, chu]) => (
              <label key={v} className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3.5 text-sm max-sm:min-h-[44px] ${deXuat === v ? 'font-semibold text-[color:var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]' : ''}`}
                style={deXuat === v ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : { borderColor: 'var(--o-nhap-vien)' }}>
                <input type="radio" name={`de-xuat-${e.id}`} checked={deXuat === v} onChange={() => { setDeXuat(v); setTt(null); }} className="accent-[color:var(--accent)]" />{chu}
              </label>
            ))}
          </div>
        </Truong>
        <details className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
          <summary className="cursor-pointer text-sm font-semibold text-slate-400">{t('Lịch sử ({n})', { n: d?.lichSu.length ?? 0 })}</summary>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-[13px]">
            {(d?.lichSu ?? []).map((l, i) => (
              <li key={i} className="grid grid-cols-[3.4rem_1fr] gap-2"><span className="tabular-nums text-slate-500">{ngan(l.luc)}</span>
                <span className="text-slate-300">{[l.nguoi, nhanDeXuat(l.deXuat), l.nhanXet].filter(Boolean).join(' · ') || t('Xoá đánh giá')}</span></li>
            ))}
          </ul>
        </details>
      </div>
    </KhungPanel>
  );
}
