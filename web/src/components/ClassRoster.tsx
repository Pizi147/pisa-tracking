import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { Empty, Pill, Skeleton } from './ui.tsx';
import { fmtBand, sosLabel, sosTone } from '../lib/format.ts';
import { ENTRY_SKILL_SHORT, type EntrySkill } from '@shared/domain.ts';

type Timeline = {
  id: number; attemptNo: number; cycleSeq: number; route: string | null;
  /** `mock` với lớp FT; `progress` / `final` với lớp thường. */
  kind: string;
  /** Nhãn ngắn để hiện trên dải: "MT2", "Giữa khoá", "Cuối khoá". */
  kindLabel: string;
  periodCode: string | null; lrwScheduledAt: string | null; status: string; needsDate: boolean;
  scoredRequired: number; requiredCount: number;
  /** Lớp thường KHÔNG có Overall IELTS — luôn null, không dựng số giả. */
  overall: number | null;
  passedCount: number | null; failedCount: number | null;
  sosLevel: number | null; evaluable: boolean;
  caseStatus: string | null; myPending: string[]; overdueSkills: number;
};

type RosterRow = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean;
  cycle: { id: number; seq: number; route: string | null; target: number | null; examDate: string | null } | null;
  latest: Timeline | null; next: Timeline | null; timeline: Timeline[];
  checkins: Partial<Record<EntrySkill, { band: number | null; observedOn: string; judgement: string | null }>>;
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
              <td className="td"><MockTrail timeline={s.timeline} classId={classId} /></td>
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
 * Chuỗi bài đánh giá quá khứ → hiện tại → tương lai.
 *
 * Lớp FT: `MT1 ✓ · MT2 ✓ · MT3 W4 OCT`.
 * Lớp thường: `Giữa khoá ✓ · Cuối khoá W2 OCT` — cùng một dải, chỉ đổi nhãn.
 * Lượt tương lai hiện MÃ TUẦN, không hiện "tuần học 10" để tránh nhầm hai khái niệm.
 */
function MockTrail({ timeline, classId }: { timeline: Timeline[]; classId: number }) {
  if (!timeline.length) return <span className="text-slate-600 text-xs">Chưa có kế hoạch đánh giá</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {timeline.map((t, i) => (
        <span key={t.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-700" aria-hidden>·</span>}
          <Link
            to={t.kind === 'mock' ? `/mock-test/${t.id}` : `/bang-diem-thuong/${classId}?kind=${t.kind}`}
            className="no-underline"
            title={`${t.kindLabel}${t.periodCode ? ` · ${t.periodCode}` : ''}`}
          >
            <Pill tone={
              t.status === 'cancelled' ? 'muted'
                : t.evaluable ? sosTone(t.sosLevel)
                : t.needsDate ? 'warn'
                : t.status === 'done' ? 'info' : 'neutral'
            }>
              {t.kindLabel}
              {t.status === 'cancelled' ? ' huỷ'
                : t.evaluable ? ' ✓'
                : t.scoredRequired > 0 ? ` ${t.scoredRequired}/${t.requiredCount}`
                : t.periodCode ? ` ${t.periodCode}` : ''}
            </Pill>
          </Link>
        </span>
      ))}
    </span>
  );
}

/**
 * Ghi nhận gần nhất của giáo viên theo từng kỹ năng.
 *
 * Ghi nhận KHÔNG bắt buộc có điểm — phần lớn là nhận xét bằng lời. Ở danh sách lớp chỉ đủ
 * chỗ cho một dấu hiệu ngắn, nên có điểm thì hiện điểm, không có thì hiện một dấu chấm và
 * để nguyên văn nhận xét trong tooltip.
 */
function EstimateChips({ row }: { row: RosterRow }) {
  const entries = Object.entries(row.checkins ?? {}) as
    [EntrySkill, { band: number | null; observedOn: string; judgement: string | null }][];
  if (!entries.length) return <span className="text-slate-600">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {entries.map(([skill, k]) => (
        <Pill key={skill} tone="neutral"
          title={`${k.judgement ? `${k.judgement}\n` : ''}Ghi nhận ngày ${k.observedOn}`}>
          {ENTRY_SKILL_SHORT[skill] ?? skill} {k.band !== null ? k.band.toFixed(1) : '·'}
        </Pill>
      ))}
    </span>
  );
}
