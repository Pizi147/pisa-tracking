import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, SectionNote, Skeleton, Task, Th } from '../../ui/ui.tsx';

type Row = {
  periodId: number; code: string; month: string; weekLabel: string; range: string;
  weekStart: string; weekEnd: string; isCurrent: boolean;
  attempts: number; onTarget: number; sos1: number; sos2: number; sos3: number;
  provisional: number; pending: number;
  cases: number; caseStudents: number; withSupport: number; untouched: number;
  pendingApproval: number;
};
type Track = 'all' | 'normal' | 'ft';

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

/**
 * BỘ CỘT ĐỔI THEO LOẠI LỚP (mục 4.2).
 *
 * Lớp Normal làm BÀI KIỂM TRA giữa khoá / cuối khoá; lớp Fast Track làm MOCK TEST. Đó là hai
 * đơn vị đếm khác nhau, nên cột đầu phải gọi đúng tên loại lớp đang xem — "30 lượt" mà không
 * biết là 30 bài kiểm tra hay 30 MT thì không dùng vào việc gì được.
 *
 * "Trễ chấm TB" đã BỎ khỏi bộ cột: hệ thống chỉ biết TUẦN kế hoạch, không biết ngày làm bài,
 * nên một cột nói "số ngày từ ngày làm bài" là nói sai cách nó được tính.
 */
function colsFor(track: Track): { key: keyof Row; label: string; hint: string; tone?: 'ok' | 'info' | 'warn' | 'danger' }[] {
  const unit = track === 'normal' ? 'bài kiểm tra' : track === 'ft' ? 'lượt MT' : 'lượt';
  return [
    {
      key: 'attempts',
      label: track === 'normal' ? 'Lượt Test' : track === 'ft' ? 'Lượt MT' : 'Lượt Test/MT',
      hint: `Số ${unit} đã chấm ít nhất một kỹ năng. Chưa chấm gì thì chưa đếm. Sáu cột bên phải chia hết con số này.`,
    },
    { key: 'onTarget', label: 'Đạt', tone: 'ok',
      hint: 'ĐỦ ĐIỂM mọi kỹ năng và không kỹ năng nào dưới kỳ vọng — kết luận chắc chắn.' },
    { key: 'sos1', label: 'SOS 1', tone: 'info',
      hint: 'Đủ điểm, đúng một kỹ năng dưới kỳ vọng.' },
    { key: 'sos2', label: 'SOS 2', tone: 'warn',
      hint: 'Đủ điểm, hai kỹ năng dưới kỳ vọng.' },
    { key: 'sos3', label: 'SOS 3', tone: 'danger',
      hint: 'Đủ điểm, từ ba kỹ năng dưới kỳ vọng.' },
    { key: 'provisional', label: 'Tạm thời', tone: 'warn',
      hint: 'CHƯA đủ điểm nhưng phần đã chấm đã kết luận được — mức còn có thể tăng khi nhập nốt. '
        + 'Không gộp vào cột SOS chắc chắn, và không đếm lại ở cột "Chưa đủ điểm".' },
    { key: 'pending', label: 'Chưa đủ điểm',
      hint: 'Chưa đủ điểm và phần đã chấm chưa kết luận được gì. '
        + 'Không dồn vào cột Đạt: môn còn thiếu có thể chính là môn em trượt.' },
    { key: 'caseStudents', label: 'HV có case',
      hint: 'Đếm HỌC VIÊN: một em ba case vẫn chỉ tính một lần.' },
    { key: 'cases', label: 'Case',
      hint: 'Đếm từng CASE — đơn vị khác cột bên trái. Một case thuộc tuần của bài sinh ra nó, '
        + 'nên cộng các tuần lại vẫn là số case duy nhất.' },
    { key: 'withSupport', label: 'Đang xử lý',
      hint: 'Case đã có ít nhất một việc hỗ trợ thực sự diễn ra. Là TÌNH TRẠNG HIỆN TẠI.' },
    { key: 'untouched', label: 'Thiếu PA học thuật', tone: 'danger',
      hint: 'Case chưa ai ghi sẽ làm gì. Là TÌNH TRẠNG HIỆN TẠI.' },
  ];
}

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
  const [track, setTrack] = useState<Track>('all');
  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (weeks !== 12) qs.set('weeks', String(weeks));
  if (track !== 'all') qs.set('track', track);
  const { data, loading, error, reload } = useApi<{
    rows: Row[]; scopeEmpty: boolean; today: string;
    /** Học viên DUY NHẤT của cả bảng và của từng tháng — không cộng số học viên của từng tuần (luật 4). */
    totals: { caseStudents: number; byMonth: Record<string, number> };
  }>(
    `/weekly-rollup${qs.toString() ? `?${qs}` : ''}`, [branchId, weeks, track],
  );
  const COLS = colsFor(track);
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
        <div className="flex flex-wrap items-center gap-1">
          {/*
            LOẠI LỚP ĐỨNG TRƯỚC KHOẢNG THỜI GIAN: nó quyết định cột đầu đang đếm cái gì, nên
            phải chọn xong nó rồi mới đọc được các con số.
          */}
          {([['all', 'Cả hai'], ['normal', 'Normal'], ['ft', 'Fast Track']] as const).map(([k, label]) => (
            <button key={k} type="button"
              className={`btn btn-sm ${track === k ? 'btn-primary' : ''}`}
              onClick={() => setTrack(k)}>{label}</button>
          ))}
          <span className="w-px h-5 mx-1" style={{ background: 'var(--line)' }} />
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
                        {COLS.map((c) => {
                          /* Học viên KHÔNG cộng theo tuần: một em có case ở hai tuần là một em ở hàng tháng. */
                          const v = c.key === 'caseStudents' ? (data?.totals.byMonth[g.month] ?? 0) : sumOf(g.rows, c.key);
                          return (
                            <td key={c.key} className="td text-right tabular-nums text-slate-200">
                              {v || <span className="text-slate-600">—</span>}
                            </td>
                          );
                        })}
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
                      {c.key === 'caseStudents' ? data.totals.caseStudents : sumOf(data.rows, c.key)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3">
            <SectionNote>
              Cột đầu đếm <strong>{track === 'normal' ? 'bài kiểm tra của lớp Normal'
                : track === 'ft' ? 'lượt MT của lớp Fast Track' : 'cả bài kiểm tra Normal lẫn lượt MT'}</strong>{' '}
              đã chấm ít nhất một kỹ năng. Sáu cột <strong>Đạt · SOS 1 · SOS 2 · SOS 3 · Tạm thời ·
              Chưa đủ điểm</strong> loại trừ nhau và cộng lại đúng bằng con số đó — một bài chưa đủ
              điểm chỉ nằm ở một trong hai cột cuối, không đếm hai lần.
              <br />
              <strong>Case</strong> đếm từng case, <strong>HV có case</strong> đếm học viên — một em
              ba case là <em>một</em> học viên và <em>ba</em> case. Case thuộc về tuần của bài sinh ra
              nó, nên cộng các tuần lại vẫn là số case duy nhất.
              <br />
              Hai cột cuối (<strong>Đang xử lý · Thiếu phương án</strong>) nói về những case sinh ra
              trong tuần đó, nhưng là <strong>tình trạng xử lý HIỆN TẠI</strong> của chúng — không phải
              ảnh chụp trạng thái vào cuối tuần ấy. Đề xuất đang chờ duyệt là chuyện của hôm nay chứ
              không thuộc tuần nào, nên nó nằm ở <strong>Theo chi nhánh</strong>, không nằm ở bảng này.
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
