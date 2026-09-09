import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { Empty, Pill, Skeleton } from './ui.tsx';
import { fmtBand, sosLabel, sosTone } from '../lib/format.ts';
import { ENTRY_SKILL_SHORT, type EntrySkill } from '@shared/domain.ts';

type Timeline = {
  id: number; attemptNo: number; cycleSeq: number; route: string | null;
  periodCode: string | null; lrwScheduledAt: string | null; status: string; needsDate: boolean;
  scoredRequired: number; requiredCount: number;
  overall: number | null; sosLevel: number | null; evaluable: boolean;
  caseStatus: string | null; myPending: string[]; overdueSkills: number;
};

type RosterRow = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean;
  cycle: { id: number; seq: number; route: string | null; target: number | null; examDate: string | null } | null;
  latest: Timeline | null; next: Timeline | null; timeline: Timeline[];
  estimates: Partial<Record<EntrySkill, { band: number; assessedOn: string }>>;
  myPending: string[];
};

/**
 * Danh sách học viên của một lớp, chỉ tải khi lớp được mở rộng.
 *
 * Mỗi dòng cho thấy học viên đang ở đâu trong lộ trình mà không phải mở chi tiết:
 * chuỗi MT quá khứ → hiện tại → tương lai, kết quả gần nhất và chênh lệch với Đánh giá GV.
 */
export function ClassRoster({ classId, studentQuery, onAddStudents }: {
  classId: number; studentQuery?: string; onAddStudents?: () => void;
}) {
  const path = `/classes/${classId}/roster${studentQuery?.trim() ? `?q=${encodeURIComponent(studentQuery.trim())}` : ''}`;
  const { data, loading, error, reload } = useApi<RosterRow[]>(path);

  if (loading) return <div className="surface-2 rounded-lg p-3"><Skeleton rows={3} /></div>;
  if (error) {
    return (
      <div className="surface-2 rounded-lg p-3 text-xs text-rose-200">
        {error.message} <button className="btn btn-sm ml-2" onClick={reload}>Thử lại</button>
      </div>
    );
  }
  if (!data) return null;
  if (!data.length) {
    return (
      <div className="surface-2 rounded-lg">
        <Empty
          title={studentQuery ? 'Không có học viên nào khớp từ khoá trong lớp này' : 'Lớp chưa có học viên'}
          action={onAddStudents && <button className="btn btn-sm" onClick={onAddStudents}>Thêm học viên</button>}
        />
      </div>
    );
  }

  return (
    <div className="surface-2 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="th">Học viên</th>
            <th className="th">Target</th>
            <th className="th">Tiến trình MT</th>
            <th className="th">Kết quả gần nhất</th>
            <th className="th">Đánh giá GV</th>
            <th className="th">Việc cần làm</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr key={s.id} className={`row-hover ${s.status !== 'active' ? 'row-muted' : ''}`}>
              <td className="td">
                <Link className="link" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                <div className="text-[11px] text-slate-500">
                  {s.studentCode}
                  {s.cycle?.route ? ` · ${s.cycle.route}` : ''}
                  {s.status !== 'active' && ' · đã kết thúc'}
                </div>
              </td>
              <td className="td tabular-nums whitespace-nowrap">{fmtBand(s.cycle?.target ?? null)}</td>
              <td className="td"><MockTrail timeline={s.timeline} /></td>
              <td className="td whitespace-nowrap">
                {s.latest
                  ? <>
                      <span className="tabular-nums">{fmtBand(s.latest.overall)}</span>{' '}
                      <Pill tone={sosTone(s.latest.sosLevel)}>{sosLabel(s.latest.sosLevel)}</Pill>
                    </>
                  : <span className="text-slate-600 text-xs">Chưa có</span>}
              </td>
              <td className="td text-xs text-slate-400 whitespace-nowrap"><EstimateChips row={s} /></td>
              <td className="td text-xs">
                {s.myPending.length > 0 && (
                  <span style={{ color: 'var(--accent)' }}>
                    Nhập {s.myPending.map((k) => ENTRY_SKILL_SHORT[k as EntrySkill] ?? k).join(', ')}
                  </span>
                )}
                {s.myPending.length === 0 && s.timeline.some((t) => t.needsDate) && <Pill tone="warn">Cần cập nhật ngày</Pill>}
                {s.myPending.length === 0 && !s.timeline.some((t) => t.needsDate)
                  && s.timeline.some((t) => t.caseStatus && t.caseStatus !== 'done') && <Pill tone="danger">Case SOS</Pill>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Chuỗi MT quá khứ → hiện tại → tương lai, ví dụ `MT1 ✓ · MT2 ✓ · MT3 W4 OCT`.
 * Lượt tương lai hiện MÃ TUẦN, không hiện "tuần học 10" để tránh nhầm hai khái niệm.
 */
function MockTrail({ timeline }: { timeline: Timeline[] }) {
  if (!timeline.length) return <span className="text-slate-600 text-xs">Chưa có kế hoạch MT</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {timeline.map((t, i) => (
        <span key={t.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-700" aria-hidden>·</span>}
          <Link
            to={`/mock-test/${t.id}`}
            className="no-underline"
            title={`${t.route ? `${t.route} · ` : ''}MT${t.attemptNo}${t.periodCode ? ` · ${t.periodCode}` : ''}`}
          >
            <Pill tone={
              t.status === 'cancelled' ? 'muted'
                : t.evaluable ? sosTone(t.sosLevel)
                : t.needsDate ? 'warn'
                : t.status === 'done' ? 'info' : 'neutral'
            }>
              MT{t.attemptNo}
              {t.status === 'cancelled' ? ' huỷ'
                : t.evaluable ? ' ✓'
                : t.status === 'done' ? ` ${t.scoredRequired}/${t.requiredCount}`
                : t.periodCode ? ` ${t.periodCode}` : ''}
            </Pill>
          </Link>
        </span>
      ))}
    </span>
  );
}

/** Chênh lệch Đánh giá GV ↔ điểm Mock gần nhất của CÙNG kỹ năng, chỉ hiện khi có cả hai. */
function EstimateChips({ row }: { row: RosterRow }) {
  const entries = Object.entries(row.estimates ?? {}) as [EntrySkill, { band: number; assessedOn: string }][];
  if (!entries.length) return <span className="text-slate-600">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {entries.map(([skill, est]) => (
        <Pill key={skill} tone="neutral" title={`Đánh giá ngày ${est.assessedOn}`}>
          {ENTRY_SKILL_SHORT[skill] ?? skill} {est.band.toFixed(1)}
        </Pill>
      ))}
    </span>
  );
}
