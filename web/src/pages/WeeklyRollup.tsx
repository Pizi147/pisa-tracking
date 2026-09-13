import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import type { Branch } from '../components/Filters.tsx';

type Row = {
  periodId: number; code: string; month: string; weekLabel: string; range: string;
  weekStart: string; weekEnd: string; isCurrent: boolean;
  attempts: number; onTarget: number; sos1: number; sos2: number; sos3: number;
  cases: number; withSupport: number; untouched: number; scoreLagDays: number | null;
};

const MONTH_VI: Record<string, string> = {
  JANUARY: 'Tháng 1', FEBRUARY: 'Tháng 2', MARCH: 'Tháng 3', APRIL: 'Tháng 4',
  MAY: 'Tháng 5', JUNE: 'Tháng 6', JULY: 'Tháng 7', AUGUST: 'Tháng 8',
  SEPTEMBER: 'Tháng 9', OCTOBER: 'Tháng 10', NOVEMBER: 'Tháng 11', DECEMBER: 'Tháng 12',
};

/**
 * TỔNG HỢP THEO TUẦN — thay cho sheet cùng tên trong workbook.
 *
 * Ba điều cố ý làm khác file Excel:
 *   1. Chỉ hiện tuần CÓ dữ liệu. File cũ in sẵn 12 tháng × 5 tuần nên phần lớn màn hình là
 *      số 0, phải cuộn qua hàng chục dòng rỗng mới tới chỗ có thật.
 *   2. Gộp ba cột "đã trao đổi HS / PH / P.HT xếp hỗ trợ" thành một cột "Đã có hỗ trợ".
 *      Ba ô cố định không tả được một em có nhiều đợt hỗ trợ; điều cần biết là "case này đã
 *      có ai động vào chưa".
 *   3. Mọi con số bấm được, mở đúng danh sách tạo nên nó.
 */
export default function WeeklyRollupPage() {
  const [params, setParams] = useSearchParams();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const weeks = Number(params.get('weeks') ?? 12);
  const { branchCount } = useSession();

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (weeks !== 12) qs.set('weeks', String(weeks));
  const { data, loading, error, reload } = useApi<{ rows: Row[]; scopeEmpty: boolean; today: string }>(
    `/weekly-rollup${qs.toString() ? `?${qs}` : ''}`,
  );
  const branches = useApi<Branch[]>('/ref/branches');
  const showBranch = (branches.data?.length ?? 0) > 1 && branchCount > 1;

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null || v === '') next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };

  // Gom theo tháng để cột "Tháng" chỉ hiện một lần cho mỗi nhóm, như file gốc.
  const grouped = useMemo(() => {
    const out: { month: string; rows: Row[] }[] = [];
    for (const r of data?.rows ?? []) {
      const last = out[out.length - 1];
      if (last && last.month === r.month) last.rows.push(r);
      else out.push({ month: r.month, rows: [r] });
    }
    return out;
  }, [data]);

  const totals = useMemo(() => {
    const z = { attempts: 0, onTarget: 0, sos1: 0, sos2: 0, sos3: 0, cases: 0, withSupport: 0, untouched: 0 };
    for (const r of data?.rows ?? []) {
      z.attempts += r.attempts; z.onTarget += r.onTarget;
      z.sos1 += r.sos1; z.sos2 += r.sos2; z.sos3 += r.sos3;
      z.cases += r.cases; z.withSupport += r.withSupport; z.untouched += r.untouched;
    }
    return z;
  }, [data]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;

  const branchQs = branchId ? `&branchId=${branchId}` : '';

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Tổng hợp theo tuần</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự tính từ điểm đã nhập và các case đang theo dõi. Không có ô nào phải nhập tay ở đây.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {showBranch && (
            <label className="block">
              <span className="label">Chi nhánh</span>
              <select className="field w-44" value={branchId ?? ''}
                onChange={(e) => setParam('branchId', e.target.value || null)}>
                <option value="">Tất cả chi nhánh</option>
                {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          )}
          <label className="block">
            <span className="label">Khoảng</span>
            <select className="field w-36" value={weeks} onChange={(e) => setParam('weeks', e.target.value)}>
              <option value="8">8 tuần gần nhất</option>
              <option value="12">12 tuần gần nhất</option>
              <option value="26">Nửa năm</option>
            </select>
          </label>
        </div>
      </div>

      {loading && <Skeleton rows={8} />}

      {data && data.rows.length === 0 && (
        <Empty
          title="Chưa có tuần nào có dữ liệu"
          hint="Bảng này chỉ hiện những tuần thực sự có lượt đánh giá — không in sẵn các dòng trống."
        />
      )}

      {data && data.rows.length > 0 && (
        <Card bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Tháng</th>
                  <th className="th">Tuần</th>
                  <th className="th text-right">Số lượt<br /><span className="font-normal text-slate-500">có kết quả</span></th>
                  <th className="th text-right">Đạt kỳ vọng</th>
                  <th className="th text-right">SOS 1</th>
                  <th className="th text-right">SOS 2</th>
                  <th className="th text-right">SOS 3</th>
                  <th className="th text-right">Tổng case</th>
                  <th className="th text-right">Đã có hỗ trợ</th>
                  <th className="th text-right">Chưa ai xử lý</th>
                  <th className="th text-right">Trễ chấm TB<br /><span className="font-normal text-slate-500">(ngày)</span></th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) =>
                  g.rows.map((r, i) => (
                    <tr key={r.periodId} className={`row-hover ${r.isCurrent ? 'bg-white/[0.03]' : ''}`}>
                      <td className="td text-slate-400 whitespace-nowrap">
                        {i === 0 ? MONTH_VI[g.month] ?? g.month : ''}
                      </td>
                      <td className="td whitespace-nowrap">
                        <span className="text-slate-200">{r.code}</span>
                        <div className="text-[11px] text-slate-500">
                          {r.range}{r.isCurrent ? ' · tuần này' : ''}
                        </div>
                      </td>
                      <td className="td text-right tabular-nums text-slate-300">
                        <Num n={r.attempts} to={`/hoc-vien?view=my_scores${branchQs}`} />
                      </td>
                      <td className="td text-right tabular-nums">
                        <Num n={r.onTarget} tone="ok" />
                      </td>
                      <td className="td text-right tabular-nums">
                        <Num n={r.sos1} tone="info" to={`/hoc-vien?view=sos_open${branchQs}`} />
                      </td>
                      <td className="td text-right tabular-nums">
                        <Num n={r.sos2} tone="warn" to={`/hoc-vien?view=sos_open${branchQs}`} />
                      </td>
                      <td className="td text-right tabular-nums">
                        <Num n={r.sos3} tone="danger" to={`/hoc-vien?view=sos_open${branchQs}`} />
                      </td>
                      <td className="td text-right tabular-nums text-slate-300">{r.cases || '—'}</td>
                      <td className="td text-right tabular-nums text-slate-300">{r.withSupport || '—'}</td>
                      <td className="td text-right tabular-nums">
                        <Num n={r.untouched} tone="danger" to={`/hoc-vien?view=sos_open${branchQs}`} />
                      </td>
                      <td className="td text-right tabular-nums text-slate-300">
                        {r.scoreLagDays === null ? '—' : r.scoreLagDays}
                      </td>
                    </tr>
                  )),
                )}
                <tr className="border-t" style={{ borderColor: 'var(--line-strong)' }}>
                  <td className="td text-slate-400 font-medium" colSpan={2}>Tổng {data.rows.length} tuần</td>
                  <td className="td text-right tabular-nums text-slate-200">{totals.attempts}</td>
                  <td className="td text-right tabular-nums text-slate-200">{totals.onTarget}</td>
                  <td className="td text-right tabular-nums text-slate-200">{totals.sos1}</td>
                  <td className="td text-right tabular-nums text-slate-200">{totals.sos2}</td>
                  <td className="td text-right tabular-nums text-slate-200">{totals.sos3}</td>
                  <td className="td text-right tabular-nums text-slate-200">{totals.cases}</td>
                  <td className="td text-right tabular-nums text-slate-200">{totals.withSupport}</td>
                  <td className="td text-right tabular-nums text-slate-200">{totals.untouched}</td>
                  <td className="td"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3">
            <SectionNote>
              <strong>Số lượt có kết quả</strong> là lượt đã chấm ít nhất một kỹ năng — chưa chấm gì thì chưa
              đếm. Bốn cột <strong>Đạt kỳ vọng · SOS 1 · SOS 2 · SOS 3</strong> cộng lại đúng bằng số lượt đó.
              <br />
              <strong>Đã có hỗ trợ</strong> gộp cả trao đổi với học viên, với phụ huynh và xếp hỗ trợ học thuật —
              một em có thể có nhiều đợt, nên ở đây chỉ trả lời “case này đã có ai động vào chưa”.
              <br />
              <strong>Trễ chấm TB</strong> là số ngày trung bình từ ngày làm bài đến ngày nhập điểm.
              Tuần chưa có ô điểm nào ghi đủ hai mốc thì để trống, không hiện số 0.
            </SectionNote>
          </div>
        </Card>
      )}
    </div>
  );
}

/** Con số 0 hiện dấu gạch cho đỡ nhiễu; số khác 0 thì bấm được nếu có chỗ để mở. */
function Num({ n, tone, to }: { n: number; tone?: 'ok' | 'info' | 'warn' | 'danger'; to?: string }) {
  if (!n) return <span className="text-slate-600">—</span>;
  const body = tone ? <Pill tone={tone}>{n}</Pill> : <span className="text-slate-200">{n}</span>;
  return to ? <Link to={to} className="no-underline inline-flex">{body}</Link> : <span className="inline-flex">{body}</span>;
}
