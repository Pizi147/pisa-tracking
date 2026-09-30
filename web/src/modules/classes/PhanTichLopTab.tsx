import { Fragment, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangNhom } from '../../ui/HangNhom.tsx';
import { VanDeKyNang } from './ClassIssueBoard.tsx';

type PhanTich = {
  loai: 'ft' | 'thuong';
  dong: { key: string; nhan: string; tenDayDu: string; category: string; moRong?: boolean }[];
  cot: { key: string; nhan: string }[];
  o: Record<string, { dat: number; tong: number }>;
  soHocVien: number;
};

/**
 * TAB PHÂN TÍCH LỚP (đặc tả §3.7, mockup 06; Q14). FT: 5 kỹ năng × MT1…MT5 — lớp tiến bộ hay đi lùi ở kỹ năng nào. Lớp thường:
 * 4 môn × Giữa khoá / Cuối khoá, ô "n/N HV đạt"; dòng đầu "Cả bài" (% tổng ≥ ngưỡng đạt; không mở ra; Pre FOU không có). Bấm một dòng kỹ năng mở
 * HAI BẢNG NHỎ: Vấn đề ở kỹ năng đó + Hiệu quả phương án ở kỹ năng đó, mọi số bấm được (PR-HVL, M5).
 * Ô dưới một nửa đạt tô đỏ nhạt; ô chưa ai có điểm là "—" (chưa có điểm KHÁC chưa đạt).
 */
export function PhanTichLopTab({ classId }: { classId: number }) {
  const { data, loading, error, reload } = useApi<PhanTich>(`/classes/${classId}/phan-tich-lop`, [classId]);
  const [mo, setMo] = useState<string | null>(null);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={5} />;
  const ft = data.loai === 'ft';
  const goiY = ft
    ? 'Mỗi ô: số học viên đạt kỳ vọng của đợt đó / số học viên đã có điểm kỹ năng đó. W1, W2 so từng bài với kỳ vọng. Bấm một dòng để xem vấn đề hay gặp.'
    : 'Mỗi ô: số học viên đạt (từ 70%) / số học viên đã có điểm môn đó. Bấm một dòng để xem vấn đề hay gặp.';

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] table-fixed text-sm">
        <colgroup><col className="w-40" />{data.cot.map((c) => <col key={c.key} />)}</colgroup>
        <thead>
          <tr>
            <Th hint={goiY}>{ft ? 'Kỹ năng' : 'Môn'}</Th>
            {data.cot.map((c) => <Th key={c.key} align="center">{c.nhan}</Th>)}
          </tr>
        </thead>
        <tbody>
          {data.dong.map((d) => {
            const oCac = data.cot.map((c) => {
              const o = data.o[`${d.key}|${c.key}`];
              return (
                <td key={c.key} className="text-center tabular-nums">
                  {!o || o.tong === 0
                    ? <span className="text-slate-600">—</span>
                    : <span className={o.dat * 2 < o.tong ? 'text-rose-200' : 'text-slate-200'} title={`${o.dat}/${o.tong} HV đạt`}>
                        {ft ? `${o.dat}/${o.tong}` : `${o.dat}/${o.tong} HV đạt`}
                      </span>}
                </td>
              );
            });
            /* K2-40: dòng "Cả bài" không có vấn đề để mở — hàng lớn không mũi tên, cùng cột thẳng với các dòng khác. */
            if (d.moRong === false) {
              return (
                <tr key={d.key} className="hang-lon dong">
                  <td className="px-3"><span className="flex items-center gap-2"><span className="inline-block h-4 w-4 shrink-0" aria-hidden />
                    <abbr className="text-slate-100 no-underline" title={d.tenDayDu}>{d.nhan}</abbr></span></td>
                  {oCac}
                </tr>
              );
            }
            return (
              <Fragment key={d.key}>
                {/* PR-UX4 (Q22, N-2): hàng kỹ năng là hàng lớn — mũi tên do `HangNhom` vẽ, không còn ▸ tự vẽ. */}
                <HangNhom mo={mo === d.key} onMo={() => setMo(mo === d.key ? null : d.key)} nhan={d.tenDayDu}
                  tieuDe={<abbr className="text-slate-100 no-underline" title={d.tenDayDu}>{d.nhan}</abbr>}>
                  {oCac}
                </HangNhom>
                {mo === d.key && (
                  <tr><td className="td" colSpan={data.cot.length + 1}><VanDeKyNang classId={classId} category={d.category} /></td></tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
