import { Fragment, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { IssueTable } from './ClassIssueBoard.tsx';

type PhanTich = {
  loai: 'ft' | 'thuong';
  dong: { key: string; nhan: string; tenDayDu: string; category: string }[];
  cot: { key: string; nhan: string }[];
  o: Record<string, { dat: number; tong: number }>;
  soHocVien: number;
};

/**
 * TAB PHÂN TÍCH LỚP (đặc tả §3.7, mockup 06; Q14). FT: 5 kỹ năng × MT1…MT5 — lớp tiến bộ hay đi lùi ở kỹ năng nào. Lớp thường:
 * 4 môn × Giữa khoá / Cuối khoá, ô "n/N HV đạt". Bấm một dòng mở bảng vấn đề hay gặp của kỹ năng đó ("mở dòng ra từng loại lỗi").
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
          {data.dong.map((d) => (
            <Fragment key={d.key}>
              <tr className="row-hover cursor-pointer" aria-expanded={mo === d.key} onClick={() => setMo(mo === d.key ? null : d.key)}>
                <td className="td">
                  <span className="mr-1.5 text-slate-500" title={mo === d.key ? 'Thu gọn' : 'Mở rộng'}>{mo === d.key ? '▾' : '▸'}</span>
                  <abbr className="text-slate-100 no-underline" title={d.tenDayDu}>{d.nhan}</abbr>
                </td>
                {data.cot.map((c) => {
                  const o = data.o[`${d.key}|${c.key}`];
                  return (
                    <td key={c.key} className="td text-center tabular-nums">
                      {!o || o.tong === 0
                        ? <span className="text-slate-600">—</span>
                        : <span className={o.dat * 2 < o.tong ? 'text-rose-200' : 'text-slate-200'} title={`${o.dat}/${o.tong} HV đạt`}>
                            {ft ? `${o.dat}/${o.tong}` : `${o.dat}/${o.tong} HV đạt`}
                          </span>}
                    </td>
                  );
                })}
              </tr>
              {mo === d.key && (
                <tr><td className="td" colSpan={data.cot.length + 1}><IssueTable classId={classId} category={d.category} /></td></tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
