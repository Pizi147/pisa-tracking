import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Nhan, type ToneNhan } from '../../ui/Nhan.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NganTongKet } from '../students/NganTongKet.tsx';
import { toneHuong } from '../students/CacLoTrinh.tsx';

type Dong = {
  studentId: number; ten: string; loTrinhId: number | null; roiSom: boolean; dauVao: number | null; target: number | null; soLuot: number;
  luotCuoi: { nhan: string; overall: number | null; l: number | null; r: number | null; w: number | null; s: number | null } | null; luotCuoiHuy?: string | null;
  thiThat: { ovr: number | null; ngay: string | null; khongThi: boolean } | null; ketLuan: string | null; huongTiep: string | null; huongKhoa?: string;
  giuaKhoa: { dat: number; tong: number; tyLe: number | null; huy: boolean } | null;
  cuoiKhoa: { dat: number; tong: number; tyLe: number | null; huy: boolean; dai?: string | null } | null;
};
type TongKetLop = {
  lop: { id: number; code: string; loai: 'ft' | 'thuong' };
  dai: { hocVien: number; datTarget?: number; chuaDat?: number; choKetQua?: number; lenFt?: number; lenLop?: number; hocLai?: number };
  dong: Dong[];
};

const b1 = (v: number | null | undefined) => (v === null || v === undefined ? '—' : v.toFixed(1));
const toneDai = (d: string | null | undefined): ToneNhan => (d === 'dat' ? 'ok' : d ? 'soon' : 'muted');

/** Kết quả thi thật của một em FT: máy so OVR với Target lúc đóng (đã tính ở bản chụp). */
function ketQuaThi(d: Dong): { tone: ToneNhan; chu: string } | null {
  if (d.roiSom || d.huongKhoa === 'chuyen_lop') return null;   // em chuyển lớp (đóng-mở): không đi thi
  if (d.ketLuan === 'reached') return { tone: 'ok', chu: 'Đạt Target' };
  if (d.ketLuan === 'not_reached') return { tone: 'late', chu: 'Chưa đạt Target' };
  if (d.thiThat?.ovr != null) return null;   // có Overall (kết quả cũ) mà kết luận chưa rõ: không nhãn "Chờ"
  return { tone: 'muted', chu: d.thiThat?.khongThi ? 'Không thi' : 'Chờ kết quả thi thật' };
}
const Huong = ({ d }: { d: Dong }) => (d.huongTiep ? <Nhan tone={toneHuong(d.huongTiep)}>{d.huongTiep}</Nhan> : <span className="text-slate-600">—</span>);
const Gach = <span className="text-slate-600">—</span>;

function Giua({ g }: { g: Dong['giuaKhoa'] }) {
  if (!g) return Gach;
  return g.huy ? <Nhan tone="done">đã huỷ</Nhan> : <Nhan tone={g.dat === g.tong ? 'ok' : 'soon'}>{`${g.dat}/${g.tong} môn`}</Nhan>;
}
function Cuoi({ c }: { c: Dong['cuoiKhoa'] }) {
  if (!c) return Gach;
  if (c.huy) return <Nhan tone="done">đã huỷ</Nhan>;
  return c.tyLe === null ? Gach : <Nhan tone={toneDai(c.dai)}>{`${Math.round(c.tyLe * 100)}%`}</Nhan>;
}

const So = ({ nhan, v, tone }: { nhan: string; v: number | undefined; tone?: 'ok' | 'warn' }) => (
  <div className="min-w-[120px] rounded-[10px] border px-3 py-1.5 max-sm:min-w-0 max-sm:flex-1 max-sm:px-2.5" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
    <small className="block text-xs text-slate-500">{nhan}</small>
    <strong className={`text-xl font-bold tabular-nums max-sm:text-base ${v && tone === 'ok' ? 'text-ok' : v && tone === 'warn' ? 'text-soon' : 'text-slate-100'}`}>{v ?? 0}</strong>
  </div>
);

/**
 * TAB "TỔNG KẾT" CỦA LỚP ĐÃ KẾT THÚC (PR-TK, TK-9; mockup bản 2) — đứng đầu và mặc định khi lớp đã kết thúc. FT: dải số theo THI THẬT; bảng MT cuối (lượt đại diện, Q2) +
 * Thi thật + Hướng tiếp. Lớp thường: Giữa khoá · Cuối khoá · Kết luận khoá. Em rời lớp sớm: chữ nhạt, cuối bảng, kết quả "—". Bấm một em → ngăn Tổng kết của em đó.
 */
export function TabTongKetLop({ classId }: { classId: number }) {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi<TongKetLop>(`/classes/${classId}/tong-ket`, [classId]);
  const [mo, setMo] = useState<number | null>(null);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  const ft = data.lop.loai === 'ft';
  const mot = (d: Dong) => (d.loTrinhId ? setMo(d.loTrinhId) : navigate(`/hoc-vien/${d.studentId}`));
  const ten = (d: Dong): ReactNode => (
    <button type="button" className="link min-h-[44px] text-left font-bold sm:min-h-0" onClick={(e) => { e.stopPropagation(); mot(d); }}>{d.ten}</button>
  );
  const moRong = data.dong.length === 0;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ft ? (
          <>
            <So nhan="Học viên" v={data.dai.hocVien} /><So nhan="Đạt Target" v={data.dai.datTarget} tone="ok" />
            <So nhan="Chưa đạt" v={data.dai.chuaDat} tone="warn" /><So nhan="Chờ kết quả" v={data.dai.choKetQua} />
          </>
        ) : (
          <>
            <So nhan="Học viên" v={data.dai.hocVien} /><So nhan="Lên FT" v={data.dai.lenFt} /><So nhan="Lên lớp" v={data.dai.lenLop} /><So nhan="Học lại" v={data.dai.hocLai} tone="warn" />
          </>
        )}
      </div>
      <section className="card overflow-hidden">
        {moRong && <Empty title="Lớp chưa có học viên nào" />}
        {!moRong && (
          <>
            {/* ≥ sm: bảng (cuộn ngang TRONG khung) */}
            <div className="hidden overflow-x-auto sm:block">
              {ft ? (
                <table className="w-full min-w-[1000px] text-[13px]">
                  <thead>
                    <tr className="text-[11.5px] text-slate-400" style={{ background: 'var(--surface-2)' }}>
                      <th colSpan={3} /><th colSpan={6} className="border-b px-3 py-1.5 text-center font-semibold" style={{ borderColor: 'var(--line)' }}>MT cuối</th>
                      <th colSpan={2} className="border-b px-3 py-1.5 text-center font-semibold" style={{ borderColor: 'var(--line)' }}>Thi thật</th><th />
                    </tr>
                    <tr className="text-left text-[11.5px] text-slate-400" style={{ background: 'var(--surface-2)' }}>
                      <th className="px-3 py-2 font-semibold">Học viên</th><th className="px-3 py-2 text-right font-semibold">Đầu vào</th><th className="px-3 py-2 text-right font-semibold">Target</th>
                      <th className="px-3 py-2 font-semibold">MT</th>
                      {['L', 'R', 'W', 'S', 'OVR', 'OVR'].map((h, i) => <th key={i} className="px-3 py-2 text-right font-semibold">{h}</th>)}
                      <th className="px-3 py-2 font-semibold">Kết quả</th><th className="px-3 py-2 font-semibold">Hướng tiếp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dong.map((d) => {
                      const k = ketQuaThi(d);
                      return (
                        <tr key={d.studentId} onClick={() => mot(d)} className={`h-11 cursor-pointer border-t hover:bg-[color:var(--accent-soft)] ${d.roiSom ? 'opacity-60' : ''}`} style={{ borderColor: 'var(--line)' }}>
                          <td className="px-3">{ten(d)}</td>
                          <td className="px-3 text-right tabular-nums">{b1(d.dauVao)}</td><td className="px-3 text-right tabular-nums">{b1(d.target)}</td>
                          <td className="whitespace-nowrap px-3 tabular-nums">
                            {d.luotCuoi ? <>{d.luotCuoi.nhan} <span className="text-slate-500">· {d.soLuot} lượt</span></> : Gach}
                            {d.luotCuoiHuy && <span className="ml-1.5 text-xs text-late">đã huỷ</span>}
                          </td>
                          {[d.luotCuoi?.l, d.luotCuoi?.r, d.luotCuoi?.w, d.luotCuoi?.s, d.luotCuoi?.overall].map((v, i) => <td key={i} className="px-3 text-right tabular-nums">{b1(v)}</td>)}
                          <td className="px-3 text-right font-semibold tabular-nums text-slate-100">{b1(d.thiThat?.ovr)}</td>
                          <td className="px-3">{k ? <Nhan tone={k.tone}>{k.chu}</Nhan> : Gach}</td>
                          <td className="px-3">{d.roiSom ? Gach : <Huong d={d} />}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[620px] text-[13px]">
                  <thead>
                    <tr className="text-left text-[11.5px] text-slate-400" style={{ background: 'var(--surface-2)' }}>
                      <th className="px-3 py-2 font-semibold">Học viên</th><th className="px-3 py-2 font-semibold">Giữa khoá</th><th className="px-3 py-2 font-semibold">Cuối khoá</th><th className="px-3 py-2 font-semibold">Kết luận khoá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dong.map((d) => (
                      <tr key={d.studentId} onClick={() => mot(d)} className={`h-11 cursor-pointer border-t hover:bg-[color:var(--accent-soft)] ${d.roiSom ? 'opacity-60' : ''}`} style={{ borderColor: 'var(--line)' }}>
                        <td className="px-3">{ten(d)}</td><td className="px-3"><Giua g={d.giuaKhoa} /></td><td className="px-3"><Cuoi c={d.cuoiKhoa} /></td>
                        <td className="px-3">{d.roiSom ? Gach : <Huong d={d} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* < sm: mỗi em một thẻ */}
            <ul className="m-0 list-none p-0 sm:hidden">
              {data.dong.map((d) => {
                const k = ketQuaThi(d);
                return (
                  <li key={d.studentId} className={`border-t px-3 py-2.5 first:border-t-0 ${d.roiSom ? 'opacity-60' : ''}`} style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {ten(d)}
                        {ft && <div className="text-xs text-slate-500">Target <span className="tabular-nums">{b1(d.target)}</span>{d.luotCuoi && <> · {d.luotCuoi.nhan} · {d.soLuot} lượt</>}{d.luotCuoiHuy && <span className="text-late"> · đã huỷ</span>}</div>}
                      </div>
                      {ft ? (k ? <Nhan tone={k.tone}>{k.chu}</Nhan> : null) : (d.roiSom ? null : <Huong d={d} />)}
                    </div>
                    <dl className="m-0 mt-1.5 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-[12.5px]">
                      {ft ? (
                        <>
                          <dt className="text-slate-500">{d.luotCuoi?.nhan ?? 'MT cuối'}</dt>
                          <dd className="m-0 tabular-nums">{d.luotCuoi ? `L ${b1(d.luotCuoi.l)} · R ${b1(d.luotCuoi.r)} · W ${b1(d.luotCuoi.w)} · S ${b1(d.luotCuoi.s)} · OVR ${b1(d.luotCuoi.overall)}` : '—'}</dd>
                          <dt className="text-slate-500">Thi thật</dt><dd className="m-0 tabular-nums">{d.thiThat?.ovr != null ? `OVR ${b1(d.thiThat.ovr)}` : '—'}</dd>
                          <dt className="text-slate-500">Hướng tiếp</dt><dd className="m-0">{d.roiSom ? '—' : <Huong d={d} />}</dd>
                        </>
                      ) : (
                        <>
                          <dt className="text-slate-500">Giữa khoá</dt><dd className="m-0"><Giua g={d.giuaKhoa} /></dd>
                          <dt className="text-slate-500">Cuối khoá</dt><dd className="m-0"><Cuoi c={d.cuoiKhoa} /></dd>
                        </>
                      )}
                    </dl>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
      {mo !== null && <NganTongKet cycleId={mo} onClose={() => setMo(null)} onDoi={reload} />}
    </div>
  );
}
