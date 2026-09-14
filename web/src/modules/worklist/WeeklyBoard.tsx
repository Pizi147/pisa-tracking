import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, SectionNote, Skeleton, Task, Th } from '../../ui/ui.tsx';

type Row = {
  periodId: number; code: string; month: string; weekLabel: string; range: string;
  weekStart: string; weekEnd: string; isCurrent: boolean;
  attempts: number; onTarget: number; sos1: number; sos2: number; sos3: number; pending: number;
  cases: number; withSupport: number; untouched: number; pendingApproval: number;
  scoreLagDays: number | null;
};

const MONTH_VI: Record<string, string> = {
  JANUARY: 'Tháng 1', FEBRUARY: 'Tháng 2', MARCH: 'Tháng 3', APRIL: 'Tháng 4',
  MAY: 'Tháng 5', JUNE: 'Tháng 6', JULY: 'Tháng 7', AUGUST: 'Tháng 8',
  SEPTEMBER: 'Tháng 9', OCTOBER: 'Tháng 10', NOVEMBER: 'Tháng 11', DECEMBER: 'Tháng 12',
};

/** Bốn khoảng owner chốt ở mục 10.7. 26 tuần ≈ sáu tháng. */
export const WEEK_RANGES = [
  { weeks: 4, label: '4 tuần' },
  { weeks: 8, label: '8 tuần' },
  { weeks: 12, label: '12 tuần' },
  { weeks: 26, label: '6 tháng' },
] as const;

const COLS: { key: keyof Row; label: string; hint: string; tone?: 'ok' | 'info' | 'warn' | 'danger' }[] = [
  { key: 'attempts', label: 'Lượt MT', hint: 'Lượt đã chấm ít nhất một kỹ năng. Chưa chấm gì thì chưa đếm.' },
  { key: 'onTarget', label: 'Đạt', hint: 'Lượt không có kỹ năng nào dưới kỳ vọng.', tone: 'ok' },
  { key: 'sos1', label: 'SOS 1', hint: 'Lượt có đúng một kỹ năng dưới kỳ vọng.', tone: 'info' },
  { key: 'sos2', label: 'SOS 2', hint: 'Lượt có hai kỹ năng dưới kỳ vọng.', tone: 'warn' },
  { key: 'sos3', label: 'SOS 3', hint: 'Lượt có từ ba kỹ năng dưới kỳ vọng.', tone: 'danger' },
  {
    key: 'pending', label: 'Chưa đủ điểm',
    hint: 'Đã chấm một phần, các môn đã chấm đều đạt nhưng còn môn chưa nhập — chưa kết luận được. '
      + 'Không dồn vào cột Đạt: môn còn thiếu có thể chính là môn em trượt.',
  },
  { key: 'cases', label: 'Case', hint: 'Case mở từ các lượt MT của tuần đó.' },
  { key: 'withSupport', label: 'Đang xử lý', hint: 'Case đã có ít nhất một việc hỗ trợ thực sự diễn ra.' },
  { key: 'untouched', label: 'Thiếu phương án', hint: 'Case chưa ai ghi sẽ làm gì.', tone: 'danger' },
  { key: 'pendingApproval', label: 'Chờ duyệt', hint: 'Đề xuất của giáo viên đang chờ Quản lý trả lời.', tone: 'warn' },
];

/**
 * BẢNG TỔNG HỢP THEO TUẦN — chế độ xem thứ hai của màn Thực trạng (mục 10.5 và 10.7).
 *
 * Bảng chi nhánh/lớp trả lời "AI đang yếu"; bảng này trả lời "XU HƯỚNG đang đi về đâu". Cùng
 * một dữ liệu, hai lát cắt, nên chúng phải nằm cùng một màn — tách ra hai trang là bắt người
 * dùng nhớ mình đã đọc gì ở trang kia.
 *
 * Ba khác biệt có chủ đích so với file Excel cũ:
 *   1. CHỈ HIỆN TUẦN CÓ DỮ LIỆU. File cũ in sẵn 12 tháng × 5 tuần nên phần lớn màn hình là
 *      số 0, phải cuộn qua hàng chục dòng rỗng mới tới chỗ có thật.
 *   2. GOM THEO THÁNG, thu gọn được, và hàng tháng mang tổng của tháng — nhìn ba tháng liền
 *      nhau mà không phải tự cộng mười hai dòng tuần.
 *   3. MỌI CON SỐ BẤM ĐƯỢC, mở đúng danh sách tạo nên nó.
 *
 * Bảng này KHÔNG sắp xếp theo cột: trục của nó là thời gian, và xáo thứ tự thời gian thì
 * chính thứ nó dùng để nói (xu hướng) biến mất.
 */
export function WeeklyBoard({ branchId }: { branchId: number | null }) {
  const [weeks, setWeeks] = useState(12);
  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (weeks !== 12) qs.set('weeks', String(weeks));
  const { data, loading, error, reload } = useApi<{ rows: Row[]; scopeEmpty: boolean; today: string }>(
    `/weekly-rollup${qs.toString() ? `?${qs}` : ''}`, [branchId, weeks],
  );
  /* Tháng gần nhất mở sẵn, các tháng cũ hơn thu gọn — người ta đọc bảng này từ hiện tại lùi về. */
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const out: { month: string; rows: Row[] }[] = [];
    for (const r of data?.rows ?? []) {
      const last = out[out.length - 1];
      if (last && last.month === r.month) last.rows.push(r);
      else out.push({ month: r.month, rows: [r] });
    }
    return out;
  }, [data]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;

  const branchQs = branchId ? `&branchId=${branchId}` : '';
  const linkFor = (key: keyof Row) =>
    (key === 'attempts' ? `/hoc-vien?view=my_scores${branchQs}`
      : key === 'sos1' || key === 'sos2' || key === 'sos3' ? `/hoc-vien?view=sos${branchQs}`
      : key === 'untouched' ? `/hoc-vien?view=case_no_plan${branchQs}`
      : key === 'withSupport' ? `/hoc-vien?view=case_working${branchQs}`
      : undefined);

  const sumOf = (rows: Row[], key: keyof Row) =>
    rows.reduce((a, r) => a + ((r[key] as number) ?? 0), 0);

  return (
    <Card
      title="Tổng hợp theo tuần"
      bodyClass="p-0"
      action={
        <div className="flex flex-wrap gap-1">
          {WEEK_RANGES.map((r) => (
            <button key={r.weeks} type="button"
              className={`btn btn-sm ${weeks === r.weeks ? 'btn-primary' : ''}`}
              onClick={() => setWeeks(r.weeks)}>
              {r.label}
            </button>
          ))}
        </div>
      }>
      {loading && <div className="p-4"><Skeleton rows={8} /></div>}

      {data && data.rows.length === 0 && (
        <div className="p-4">
          <Empty
            title="Chưa có tuần nào có dữ liệu"
            hint="Bảng này chỉ hiện những tuần thực sự có lượt đánh giá — không in sẵn các dòng trống."
          />
        </div>
      )}

      {data && data.rows.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th className="sticky-col" hint="Tuần thứ mấy của tháng, và khoảng ngày của tuần đó.">Tuần</Th>
                  {COLS.map((c) => <Th key={c.key} align="right" hint={c.hint}>{c.label}</Th>)}
                  <Th align="right" hint="Số ngày trung bình từ ngày làm bài tới ngày nhập điểm.">Trễ chấm TB</Th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) => {
                  const open = !collapsed.has(g.month);
                  return (
                    <Fragment key={g.month}>
                      <tr className="row-hover cursor-pointer"
                        style={{ background: 'rgba(255,255,255,.04)' }}
                        onClick={() => setCollapsed((s) => {
                          const next = new Set(s);
                          if (next.has(g.month)) next.delete(g.month); else next.add(g.month);
                          return next;
                        })}>
                        <td className="td sticky-col whitespace-nowrap font-medium text-slate-100">
                          <span className="text-slate-500 mr-1.5" aria-hidden>{open ? '▾' : '▸'}</span>
                          {MONTH_VI[g.month] ?? g.month}
                          <span className="text-[11px] font-normal text-slate-500 ml-1.5">{g.rows.length} tuần</span>
                        </td>
                        {COLS.map((c) => (
                          <td key={c.key} className="td text-right tabular-nums text-slate-200">
                            {sumOf(g.rows, c.key) || <span className="text-slate-600">—</span>}
                          </td>
                        ))}
                        <td className="td" />
                      </tr>
                      {open && g.rows.map((r) => (
                        <tr key={r.periodId} className={`row-hover ${r.isCurrent ? 'bg-white/[0.03]' : ''}`}>
                          <td className="td sticky-col whitespace-nowrap pl-8">
                            <span className="text-slate-200">{r.code}</span>
                            <div className="text-[11px] text-slate-500">
                              {r.range}{r.isCurrent ? ' · tuần này' : ''}
                            </div>
                          </td>
                          {COLS.map((c) => (
                            <td key={c.key} className="td text-right tabular-nums">
                              <Num n={r[c.key] as number} tone={c.tone} to={linkFor(c.key)} />
                            </td>
                          ))}
                          <td className="td text-right tabular-nums text-slate-300">
                            {r.scoreLagDays === null ? '—' : r.scoreLagDays}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
                <tr className="border-t" style={{ borderColor: 'var(--line-strong)' }}>
                  <td className="td sticky-col text-slate-200 font-semibold whitespace-nowrap">
                    Tổng {data.rows.length} tuần
                  </td>
                  {COLS.map((c) => (
                    <td key={c.key} className="td text-right tabular-nums text-slate-200 font-semibold">
                      {sumOf(data.rows, c.key)}
                    </td>
                  ))}
                  <td className="td" />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3">
            <SectionNote>
              <strong>Lượt MT</strong> là lượt đã chấm ít nhất một kỹ năng — chưa chấm gì thì chưa đếm.
              Bốn cột <strong>Đạt · SOS 1 · SOS 2 · SOS 3</strong> cộng lại đúng bằng số lượt đó.
              <br />
              <strong>Trễ chấm TB</strong> là số ngày trung bình từ ngày làm bài đến ngày nhập điểm.
              Tuần chưa có ô điểm nào ghi đủ hai mốc thì để trống, không hiện số 0.
            </SectionNote>
          </div>
        </>
      )}
    </Card>
  );
}

/** Con số 0 hiện dấu gạch cho đỡ nhiễu; số khác 0 thì bấm được nếu có chỗ để mở. */
function Num({ n, tone, to }: { n: number; tone?: 'ok' | 'info' | 'warn' | 'danger'; to?: string }) {
  if (!n) return <span className="text-slate-600">—</span>;
  /* Con số bấm được là một VIỆC CẦN LÀM, nên dùng họ nhãn việc (mục 2.1, 5.3 điểm 4). */
  const body = tone ? <Task tone={tone}>{n}</Task> : <span className="text-slate-200">{n}</span>;
  return to ? <Link to={to} className="no-underline inline-flex">{body}</Link> : <span className="inline-flex">{body}</span>;
}
