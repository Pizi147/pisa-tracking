import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { mucNhiet, type ChuongTrinh, type MaTranVanDe } from '@shared/domain/index.ts';

const CHUA_PHAN_LOAI = '__chua-phan-loai__';
/** Mức nhiệt Q12 → lớp Tailwind CHUỖI TĨNH (JIT cần thấy nguyên văn trong mã nguồn). 0 chỉ làm mờ chữ, không tô nền. */
const MUC_NHIET_NEN: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: '', 1: 'bg-white/[0.03]', 2: 'bg-white/[0.07]', 3: 'bg-amber-500/10', 4: 'bg-rose-500/15',
};

/**
 * VẤN ĐỀ HỌC VIÊN (P8, §3.3) — ma trận nhiệt kỹ năng × lớp/chi nhánh. Đi đúng đường `nguon` như bảng Tổng hợp
 * (`TongHopTestSos.tsx`): máy chủ giữ tập ID, mọi ô bấm được mở đúng tập đó (G-10). Không có ô khoảng thời gian —
 * đây là HIỆN TRẠNG (Q5), không phải một khoảng thời gian.
 */
export function VanDeHocVien({ branchId, ct, classId }: { branchId: number | null; ct: ChuongTrinh; classId: number | null }) {
  const [params, setParams] = useSearchParams();
  const cot: 'lop' | 'cn' = params.get('cot') === 'cn' ? 'cn' : 'lop';
  const setCot = (v: 'lop' | 'cn') => {
    const next = new URLSearchParams(params);
    if (v === 'lop') next.delete('cot'); else next.set('cot', v);
    setParams(next, { replace: false });
  };
  /** `null` = chưa khởi tạo mặc định (mở dòng kỹ năng có `tong.n` lớn nhất, một lần khi dữ liệu đến). */
  const [mo, setMo] = useState<Set<string> | null>(null);

  const branches = useApi<any[]>('/ref/branches');
  const anTheoChiNhanh = !!branchId || (branches.data?.length ?? 0) <= 1;

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (ct !== 'ca-hai') qs.set('ct', ct);
  if (classId) qs.set('lop', String(classId));
  qs.set('cot', cot);
  const query = qs.toString();
  const { data, loading, error, reload } = useApi<MaTranVanDe>(`/phan-tich/van-de?${query}`, [query]);

  useEffect(() => {
    if (!data || mo !== null) return;
    let best: string | null = null, bestN = -1;
    for (const h of data.hang) if (h.tong.n > bestN) { bestN = h.tong.n; best = h.kn; }
    setMo(best ? new Set([best]) : new Set());
  }, [data, mo]);

  const toggle = (kn: string) => {
    const next = new Set(mo ?? []);
    if (next.has(kn)) next.delete(kn); else next.add(kn);
    setMo(next);
  };

  return (
    <Card
      bodyClass="p-0"
      action={
        <div className="flex items-center gap-2 p-3 pb-0">
          <div role="radiogroup" aria-label="Cách xếp cột" className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
            {(['lop', 'cn'] as const).filter((k) => k !== 'cn' || !anTheoChiNhanh).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={cot === k} onClick={() => setCot(k)}
                className={`px-3 py-1 text-xs border-0 cursor-pointer ${cot === k ? 'bg-sky-500/20 text-sky-200 font-semibold' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
                {k === 'lop' ? 'Theo lớp' : 'Theo chi nhánh'}
              </button>
            ))}
          </div>
        </div>
      }>
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={6} /></div>
        : data.scopeEmpty ? <div className="p-4"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>
        : data.cotDs.length === 0 || data.hang.every((h) => h.tong.N === 0)
          ? <div className="p-4"><Empty title="Không có học viên nào đang học trong phạm vi này" /></div>
          : (
            <>
              {data.hang.every((h) => h.tong.n === 0) && (
                <div className="px-4 pt-3"><Empty title="Chưa có Case nào đang mở" /></div>
              )}
              <div className="table-scroll">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: 200 }} />
                    {data.cotDs.map((c) => <col key={c.khoa} style={{ width: 90 }} />)}
                    <col style={{ width: 70 }} />
                    <col style={{ width: 180 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <Th className="sticky-col" hint="Dòng kỹ năng: số HV có Case chưa xong / số HV đang học. Dòng loại lỗi: số HV gặp lỗi đó — một em có thể gặp hai lỗi.">
                        Kỹ năng / loại lỗi
                      </Th>
                      {data.cotDs.map((c) => <Th key={c.khoa} align="right">{c.nhan}</Th>)}
                      <Th align="right">Tổng</Th>
                      <Th>Lỗi phổ biến nhất</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.hang.map((h) => (
                      <Fragment key={h.kn}>
                        <tr className="row-hover">
                          <td className="td sticky-col whitespace-nowrap">
                            <button type="button" onClick={() => toggle(h.kn)}
                              className="appearance-none bg-transparent border-0 p-0 mr-1.5 cursor-pointer text-slate-500 hover:text-slate-300"
                              title={(mo ?? new Set()).has(h.kn) ? 'Thu gọn' : 'Xem loại lỗi'} aria-label="Xem loại lỗi">
                              {(mo ?? new Set()).has(h.kn) ? '▾' : '▸'}
                            </button>
                            <span className="text-slate-100">{h.nhan}</span>
                          </td>
                          {data.cotDs.map((c) => <OKyNang key={c.khoa} cell={h.o[c.khoa]} query={query} kn={h.kn} nhanKn={h.nhan} khoaCot={c.khoa} nhanCot={c.nhan} />)}
                          <td className="td text-right tabular-nums">
                            <OKyNang cell={h.tong} query={query} kn={h.kn} nhanKn={h.nhan} khoaCot="tong" nhanCot="Tổng" />
                          </td>
                          <td className="td text-slate-300 truncate" title={h.loiNhieuNhat?.nhan ?? undefined}>
                            {h.loiNhieuNhat ? `${h.loiNhieuNhat.nhan} (${h.loiNhieuNhat.n})` : <span className="text-slate-600">—</span>}
                          </td>
                        </tr>
                        {(mo ?? new Set()).has(h.kn) && h.con.map((c) => (
                          <tr key={`${h.kn}|${c.ma}`} className="row-hover">
                            <td className={`td sticky-col pl-8 whitespace-nowrap ${c.ma === CHUA_PHAN_LOAI ? 'text-slate-500' : 'text-slate-300'}`}>
                              {c.nhan}
                            </td>
                            {data.cotDs.map((col) => (
                              <td key={col.khoa} className="td text-right tabular-nums">
                                <OLoai n={c.o[col.khoa]} query={query} kn={h.kn} ma={c.ma} khoaCot={col.khoa} nhanKn={h.nhan} nhanLoai={c.nhan} nhanCot={col.nhan} />
                              </td>
                            ))}
                            <td className="td text-right tabular-nums">
                              <OLoai n={c.tong} query={query} kn={h.kn} ma={c.ma} khoaCot="tong" nhanKn={h.nhan} nhanLoai={c.nhan} nhanCot="Tổng" />
                            </td>
                            <td className="td" />
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
    </Card>
  );
}

function OKyNang({ cell, query, kn, nhanKn, khoaCot, nhanCot }: {
  cell: { n: number; N: number } | null; query: string; kn: string; nhanKn: string; khoaCot: string; nhanCot: string;
}) {
  if (!cell) return <td className="td text-right"><span className="text-slate-600">—</span></td>;
  const heat = mucNhiet(cell.n, cell.N);
  const nguon = `/phan-tich/van-de/o?${query}&kn=${encodeURIComponent(kn)}&khoaCot=${encodeURIComponent(khoaCot)}`;
  return (
    <td className="td text-right tabular-nums">
      <span className={`inline-block px-1.5 py-0.5 rounded ${MUC_NHIET_NEN[heat]}`}>
        <SoLieuO giaTri={cell.n} nguon={nguon} tieuDe={`${nhanKn} · ${nhanCot}`} className={heat === 0 ? 'text-slate-600' : ''} />
        <span className="text-slate-500">/{cell.N}</span>
      </span>
    </td>
  );
}

function OLoai({ n, query, kn, ma, khoaCot, nhanKn, nhanLoai, nhanCot }: {
  n: number | null; query: string; kn: string; ma: string; khoaCot: string; nhanKn: string; nhanLoai: string; nhanCot: string;
}) {
  if (n === null) return <span className="text-slate-600">—</span>;
  const nguon = `/phan-tich/van-de/o?${query}&kn=${encodeURIComponent(kn)}&ma=${encodeURIComponent(ma)}&khoaCot=${encodeURIComponent(khoaCot)}`;
  return <SoLieuO giaTri={n} nguon={nguon} tieuDe={`${nhanLoai || nhanKn} · ${nhanCot}`} />;
}
