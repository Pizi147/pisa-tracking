import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { HangNhom } from '../../ui/HangNhom.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { VanDeKyNang } from './ClassIssueBoard.tsx';
import { dich, t } from '@shared/i18n/index.ts';

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
  /* PR-Pb2-b (Q22): `?ky-nang=` từ bảng Phân tích giáo viên mở sẵn dòng kỹ năng đó và cuộn tới; khoá lạ bỏ qua. */
  const [params] = useSearchParams();
  const [mo, setMo] = useState<string | null>(params.get('ky-nang'));
  useEffect(() => {
    if (!data || !mo) return;
    if (!data.dong.some((d) => d.key === mo && d.moRong !== false)) { setMo(null); return; }
    document.getElementById(`pt-lop-${mo}`)?.scrollIntoView({ block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={5} />;
  const ft = data.loai === 'ft';
  const goiY = ft
    ? t('Mỗi ô: số học viên đạt / số học viên đã có điểm kỹ năng đó ở lượt đủ Overall. Overall đạt kỳ vọng của đợt thì mọi kỹ năng tính đạt; chưa đạt thì xét từng kỹ năng (W1, W2 riêng). Bấm một dòng để xem vấn đề hay gặp.')
    : t('Mỗi ô: số học viên đạt (từ 70%) / số học viên đã có điểm môn đó. Bấm một dòng để xem vấn đề hay gặp.');

  return (
    /* V8-HSL (mockup v8 D): hàng công cụ trên bảng — tên bảng · số HV · cách đọc ô · ⓘ cách tính (G9: ⓘ ra khỏi đầu cột). */
    <section className="card overflow-clip" aria-label={t('Đạt theo kỹ năng')}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 className="m-0 text-[15px] font-bold text-slate-100">{ft ? t('Đạt theo kỹ năng') : t('Đạt theo môn')}</h2>
        <span className="text-[13px] text-slate-400">{t('{n} HV', { n: data.soHocVien })} · {t('ô = HV đạt / HV có điểm')}</span>
        <NutLuat label={t('Cách tính')}>{goiY}</NutLuat>
      </div>
    <div className="table-scroll">
      <table className="w-full min-w-[560px] table-fixed text-sm">
        <colgroup><col className="w-40" />{data.cot.map((c) => <col key={c.key} />)}</colgroup>
        <thead>
          <tr>
            <Th>{ft ? t('Kỹ năng') : t('Môn')}</Th>
            {data.cot.map((c) => <Th key={c.key} align="center">{dich(c.nhan)}</Th>)}
          </tr>
        </thead>
        <tbody>
          {data.dong.map((d) => {
            const oCac = data.cot.map((c) => {
              const o = data.o[`${d.key}|${c.key}`];
              return (
                <td key={c.key} className="text-center tabular-nums">
                  {!o || o.tong === 0
                    ? <span className="text-slate-500">—</span>
                    /* G12: ô dưới một nửa đạt = "✗ 8/18" chữ dưới kỳ vọng (ký hiệu + màu, không chỉ màu). */
                    : <span className={o.dat * 2 < o.tong ? 'font-semibold text-kq-duoi' : 'text-slate-200'} title={t('{dat}/{tong} HV đạt', { dat: o.dat, tong: o.tong })}>
                        {o.dat * 2 < o.tong && <span aria-hidden>✗ </span>}{ft ? `${o.dat}/${o.tong}` : t('{dat}/{tong} HV đạt', { dat: o.dat, tong: o.tong })}
                      </span>}
                </td>
              );
            });
            /* K2-40: dòng "Cả bài" không có vấn đề để mở — hàng lớn không mũi tên, cùng cột thẳng với các dòng khác. */
            if (d.moRong === false) {
              return (
                <tr key={d.key} className="hang-lon dong">
                  <td className="px-3"><span className="flex items-center gap-2"><span className="inline-block h-4 w-4 shrink-0" aria-hidden />
                    <abbr className="text-slate-100 no-underline" title={dich(d.tenDayDu)}>{dich(d.nhan)}</abbr></span></td>
                  {oCac}
                </tr>
              );
            }
            return (
              <Fragment key={d.key}>
                {/* PR-UX4 (Q22, N-2): hàng kỹ năng là hàng lớn — mũi tên do `HangNhom` vẽ, không còn ▸ tự vẽ. */}
                <HangNhom mo={mo === d.key} onMo={() => setMo(mo === d.key ? null : d.key)} nhan={d.tenDayDu}
                  tieuDe={<span className="font-medium text-slate-100">{dich(d.tenDayDu)}</span>}>
                  {oCac}
                </HangNhom>
                {mo === d.key && (
                  <tr id={`pt-lop-${d.key}`}><td className="td" colSpan={data.cot.length + 1}><VanDeKyNang classId={classId} category={d.category} /></td></tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
    </section>
  );
}
