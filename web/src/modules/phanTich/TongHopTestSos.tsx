import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import {
  CHUONG_TRINH_LABEL, KHOANG_LABEL, KHOANG_MAC_DINH, THEO_DONG, THEO_DONG_COT_DAU, THEO_DONG_DANH_TU, THEO_DONG_LABEL,
  bangXuatTongHop, cotTongHopFor, ngay, nhomCotNhanNgan,
  type ChuongTrinh, type CotTongHop, type DongTongHop, type Khoang, type NhomCot, type TheoDong, type TongHopKetQua,
} from '@shared/domain/index.ts';

const KHOA_LUU_COT_HIEN = 'pisa.phan-tich.tong-hop.cot-hien';
const NHOM_MAC_DINH: readonly NhomCot[] = ['ket-qua', 'ky-nang', 'xu-ly'];

function docCotHien(): Set<NhomCot> {
  try {
    const raw = localStorage.getItem(KHOA_LUU_COT_HIEN);
    if (!raw) return new Set(NHOM_MAC_DINH);
    const arr = (JSON.parse(raw) as string[]).filter((x): x is NhomCot => (NHOM_MAC_DINH as readonly string[]).includes(x));
    return arr.length ? new Set(arr) : new Set(NHOM_MAC_DINH);
  } catch { return new Set(NHOM_MAC_DINH); }
}
function luuCotHien(s: Set<NhomCot>) {
  try { localStorage.setItem(KHOA_LUU_COT_HIEN, JSON.stringify([...s])); } catch { /* lỗi thì hiện đủ ba nhóm, không chặn */ }
}

/** Nhãn tô đậm cho các cột "cần chú ý" của Q18 — CHỈ đổi màu chữ, không badge, không ⚠ (G-4). */
const MAU_COT: Partial<Record<string, string>> = {
  dat: 'text-emerald-300', sos1: 'text-sky-300', sos2: 'text-amber-300', sos3: 'text-rose-300', thieuPa: 'text-amber-300',
};

/** Tuần con của "Theo tuần" mở theo lớp; "Theo lớp" mở theo đợt; "Theo đợt"/"Theo chi nhánh" mở theo lớp. */
const NHAN_MO_CON: Record<TheoDong, string> = { tuan: 'Mở theo lớp', lop: 'Mở theo đợt', dot: 'Mở theo lớp', cn: 'Mở theo lớp' };

export function TongHopTestSos({ branchId, ct, tg, classId }: {
  branchId: number | null; ct: ChuongTrinh; tg: Khoang; classId: number | null;
}) {
  const { session } = useSession();
  const demoDate = session?.demoDate ?? null;
  const [params, setParams] = useSearchParams();
  const theo: TheoDong = (THEO_DONG as readonly string[]).includes(params.get('theo') ?? '') ? (params.get('theo') as TheoDong) : 'tuan';
  const setTheo = (v: TheoDong) => {
    const next = new URLSearchParams(params);
    if (v === 'tuan') next.delete('theo'); else next.set('theo', v);
    setParams(next, { replace: false });
  };
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [cotHien, setCotHien] = useState<Set<NhomCot>>(() => docCotHien());
  const [menuMo, setMenuMo] = useState(false);
  useEffect(() => setOpen(new Set()), [theo]);

  const branches = useApi<any[]>('/ref/branches');
  const classes = useApi<any[]>(`/ref/classes${branchId ? `?branchId=${branchId}` : ''}`);
  const anCotChiNhanh = !!branchId || (branches.data?.length ?? 0) <= 1;

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (ct !== 'ca-hai') qs.set('ct', ct);
  if (tg !== KHOANG_MAC_DINH) qs.set('tg', String(tg));
  if (classId) qs.set('lop', String(classId));
  qs.set('theo', theo);
  const query = qs.toString();
  const { data, loading, error, reload } = useApi<TongHopKetQua>(`/phan-tich/tong-hop?${query}`, [query]);

  const allCols = cotTongHopFor(ct);
  const cols = allCols.filter((c) => cotHien.has(c.nhom));
  const nhomChay: { nhom: NhomCot; cols: CotTongHop[] }[] = [];
  for (const c of cols) {
    const last = nhomChay[nhomChay.length - 1];
    if (last && last.nhom === c.nhom) last.cols.push(c); else nhomChay.push({ nhom: c.nhom, cols: [c] });
  }

  const toggleCotHien = (nhom: NhomCot) => {
    const next = new Set(cotHien);
    if (next.has(nhom)) { if (next.size === 1) return; next.delete(nhom); } else next.add(nhom);
    setCotHien(next);
    luuCotHien(next);
  };

  const toggleOpen = (khoa: string) => {
    const next = new Set(open);
    if (next.has(khoa)) next.delete(khoa); else next.add(khoa);
    setOpen(next);
  };

  const branchName = branchId ? branches.data?.find((b) => b.id === branchId)?.name ?? null : null;
  const className = classId ? classes.data?.find((c) => c.id === classId)?.code ?? null : null;

  async function xuatExcel() {
    if (!data || !demoDate) return;
    const XLSX = await import('xlsx');
    const moTa = [
      branchName ?? 'Tất cả chi nhánh', CHUONG_TRINH_LABEL[ct], KHOANG_LABEL[tg],
      className, `dữ liệu đến ${ngay(demoDate)}`,
    ].filter(Boolean).join(' · ');
    const aoa = bangXuatTongHop(data, cotHien, moTa);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tong hop');
    const ten = ngay(demoDate).split('/').join('-');
    XLSX.writeFile(wb, `tong-hop-test-sos-${ten}.xlsx`);
  }

  const oCell = (row: DongTongHop, col: CotTongHop) => {
    const v = row.o[col.khoa] ?? 0;
    if (v <= 0) return <span className="text-slate-600">—</span>;
    const nguon = `/phan-tich/tong-hop/o?${query}&khoa=${encodeURIComponent(row.khoa)}&cot=${encodeURIComponent(col.khoa)}`;
    return (
      <SoLieuO giaTri={v} nguon={nguon} tieuDe={`${col.nhan(ct)} · ${row.nhan}`}
        className={MAU_COT[col.khoa] ?? ''} />
    );
  };

  const dongHang = (row: DongTongHop, thut: boolean, moDuoc: boolean) => (
    <tr key={row.khoa} className="row-hover">
      <td className="td sticky-col whitespace-nowrap">
        <span className={thut ? 'pl-6 inline-block' : ''}>
          {!thut && moDuoc && (
            <button type="button" title={open.has(row.khoa) ? 'Thu gọn' : NHAN_MO_CON[theo]} onClick={() => toggleOpen(row.khoa)}
              className="appearance-none bg-transparent border-0 p-0 mr-1.5 cursor-pointer text-slate-500 hover:text-slate-300" aria-label={NHAN_MO_CON[theo]}>
              {open.has(row.khoa) ? '▾' : '▸'}
            </button>
          )}
          <span className={thut ? 'text-slate-300' : 'text-slate-100'}>{row.nhan}</span>
        </span>
        {row.phu && <div className="text-[10px] text-slate-500 pl-1">{row.phu}</div>}
      </td>
      {cols.map((c) => (
        <td key={c.khoa} className="td text-right tabular-nums">{oCell(row, c)}</td>
      ))}
    </tr>
  );

  return (
    <Card
      bodyClass="p-0"
      action={
        <div className="flex flex-wrap items-center gap-2 p-3 pb-0">
          <div role="radiogroup" aria-label="Cách xếp dòng" className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
            {THEO_DONG.filter((k) => k !== 'cn' || !anCotChiNhanh).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={theo === k} onClick={() => setTheo(k)}
                className={`px-3 py-1 text-xs border-0 cursor-pointer ${theo === k ? 'bg-sky-500/20 text-sky-200 font-semibold' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
                {THEO_DONG_LABEL[k]}
              </button>
            ))}
          </div>
          <span className="flex-1" />
          <div className="relative">
            <button type="button" className="btn btn-sm" onClick={() => setMenuMo((v) => !v)} aria-expanded={menuMo}>
              Cột hiện ▾
            </button>
            {menuMo && (
              <div className="absolute right-0 mt-1 z-20 rounded-lg border p-2 space-y-1 surface-2" style={{ borderColor: 'var(--line)', minWidth: 160 }}>
                {NHOM_MAC_DINH.map((n) => (
                  <label key={n} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={cotHien.has(n)} onChange={() => toggleCotHien(n)} />
                    {nhomCotNhanNgan(n, ct)}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="btn btn-sm" disabled={!data || data.hang.length === 0 || !demoDate} onClick={xuatExcel}>
            ⤓ Xuất Excel
          </button>
        </div>
      }>
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={8} /></div>
        : data.scopeEmpty ? <div className="p-4"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>
        : data.hang.length === 0 ? <div className="p-4"><Empty title={`Chưa có lượt nào có điểm trong ${KHOANG_LABEL[tg]}`} /></div>
        : (
          <div className="table-scroll">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 180 }} />
                {/* Nhóm Xử lý cần rộng hơn — tiêu đề "HV có Case"/"Đang xử lý"/"Thiếu PA học thuật" bị cắt ở 64px. */}
                {cols.map((c) => <col key={c.khoa} style={{ width: c.nhom === 'xu-ly' ? 88 : 64 }} />)}
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2} className="th sticky-col text-left">{THEO_DONG_COT_DAU[theo]}</th>
                  {nhomChay.map((g, i) => (
                    <th key={g.nhom + i} colSpan={g.cols.length} className={`th text-center ${i > 0 ? 'border-l' : ''}`} style={{ borderColor: 'var(--line-strong)' }}>
                      {nhomCotNhanNgan(g.nhom, ct)}
                    </th>
                  ))}
                </tr>
                <tr>
                  {cols.map((c) => (
                    <Th key={c.khoa} align="right" hint={c.goiY} className={c.nhom === 'xu-ly' ? 'whitespace-normal leading-tight' : ''}>
                      {c.nhan(ct)}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.hang.map((r) => (
                  <Fragment key={r.khoa}>
                    {dongHang(r, false, !!r.con?.length)}
                    {open.has(r.khoa) && r.con?.map((c) => dongHang(c, true, false))}
                  </Fragment>
                ))}
                <tr className="border-t" style={{ borderColor: 'var(--line-strong)' }}>
                  <td className="td sticky-col font-semibold text-slate-200 whitespace-nowrap">
                    Cộng {data.hang.length} {THEO_DONG_DANH_TU[theo]}
                  </td>
                  {cols.map((c) => (
                    <td key={c.khoa} className="td text-right tabular-nums font-semibold">{oCell({ khoa: 'tong', nhan: 'Tổng', o: data.tong }, c)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
    </Card>
  );
}
