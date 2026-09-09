import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { usePeriods } from '../components/Filters.tsx';
import { CriteriaButton, DeadlinePill, RawScoreInput, useSaveScore, type Cell } from '../components/ScoreEntry.tsx';
import {
  attemptStatusLabel, attemptStatusTone, fmtBand, fmtSlot, skillShort, sosLabel, sosTone,
} from '../lib/format.ts';
import { ENTRY_SKILLS } from '@shared/domain.ts';

type Sheet = {
  classId: number; classCode: string; branchName: string;
  period: { id: number; code: string; weekStart: string; weekEnd: string } | null;
  editableSkills: string[];
  rows: {
    attemptId: number; studentId: number; studentName: string; studentCode: string;
    attemptNo: number; status: string;
    lrwScheduledAt: string | null; speakingScheduledAt: string | null;
    cells: Cell[]; result: any;
  }[];
};

/**
 * Bảng nhập điểm cho cả lớp trong một tuần.
 * Điều hướng bàn phím: Enter/↓ xuống ô cùng cột, ↑ lên, ←/→ sang kỹ năng khác cùng dòng.
 */
export default function ScoreSheetPage() {
  const { classId } = useParams();
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(params.get('periodId') ? Number(params.get('periodId')) : null);

  useEffect(() => {
    if (periodId === null && periods.data?.length) {
      const cur = periods.data.find((p) => p.weekStart <= session!.demoDate && p.weekEnd >= session!.demoDate);
      setPeriodId(cur?.id ?? periods.data[0].id);
    }
  }, [periods.data, periodId, session]);

  const path = classId ? `/classes/${classId}/score-sheet${periodId ? `?periodId=${periodId}` : ''}` : null;
  const { data, loading, error, reload } = useApi<Sheet>(path);
  const grid = useRef<(HTMLInputElement | null)[][]>([]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;

  const rawSkills = ENTRY_SKILLS.filter((s) => s === 'listening' || s === 'reading');
  const critSkills = ENTRY_SKILLS.filter((s) => s !== 'listening' && s !== 'reading');

  const move = (row: number, col: number, dr: number, dc: number) => {
    const r = grid.current[row + dr];
    const target = r?.[col + dc] ?? grid.current[row + dr]?.[col];
    target?.focus();
    target?.select();
  };

  return (
    <div className="space-y-4 max-w-[1500px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link className="btn btn-sm btn-ghost mb-1 no-underline" to="/hoc-vien">← Danh sách lớp</Link>
          <h1 className="text-lg font-semibold text-slate-100">
            Nhập điểm · {data?.classCode ?? '…'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {data?.branchName}
            {data && ` · Bạn được nhập: ${data.editableSkills.length ? data.editableSkills.map(skillShort).join(', ') : 'không kỹ năng nào'}`}
          </p>
        </div>
        <label className="block">
          <span className="label">Tuần</span>
          <select className="field w-56" value={periodId ?? ''} onChange={(e) => {
            const v = Number(e.target.value);
            setPeriodId(v);
            const next = new URLSearchParams(params); next.set('periodId', String(v)); setParams(next, { replace: true });
          }}>
            {(periods.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.code} · {p.range}</option>)}
          </select>
        </label>
      </div>

      {loading && <Skeleton rows={8} />}

      {data && !loading && (
        <Card bodyClass="p-0">
          {data.rows.length === 0 ? (
            <Empty title="Không có lượt Mock nào của lớp này trong tuần đã chọn"
              hint="Đổi tuần ở trên, hoặc quay lại danh sách Mock để chọn lớp khác." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th sticky-col">Học viên</th>
                    <th className="th">MT</th>
                    <th className="th">Lịch</th>
                    {rawSkills.map((s) => <th key={s} className="th">{skillShort(s)} <span className="normal-case text-slate-500">(số câu)</span></th>)}
                    {critSkills.map((s) => <th key={s} className="th">{skillShort(s)} <span className="normal-case text-slate-500">(band)</span></th>)}
                    <th className="th">Kỳ vọng</th>
                    <th className="th">Overall</th>
                    <th className="th">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, ri) => (
                    <SheetRow
                      key={r.attemptId}
                      row={r}
                      rowIndex={ri}
                      rawSkills={rawSkills}
                      critSkills={critSkills}
                      onReload={reload}
                      register={(ci, el) => {
                        grid.current[ri] = grid.current[ri] ?? [];
                        grid.current[ri][ci] = el;
                      }}
                      onMove={move}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <SectionNote>
        Ô để trống nghĩa là chưa nhập, không phải điểm 0. Chỉ những kỹ năng bạn được phân công mới sửa được;
        các kỹ năng khác vẫn đọc được để đối chiếu. Hạn nhập tính theo buổi mock của từng kỹ năng, nên
        Speaking khác ngày sẽ có hạn riêng. Kỹ năng đã đánh dấu không mock hiện mờ và không bị tính thiếu điểm.
      </SectionNote>
    </div>
  );
}

function SheetRow({ row, rowIndex, rawSkills, critSkills, onReload, register, onMove }: {
  row: Sheet['rows'][number]; rowIndex: number;
  rawSkills: readonly string[]; critSkills: readonly string[];
  onReload: () => void;
  register: (col: number, el: HTMLInputElement | null) => void;
  onMove: (row: number, col: number, dr: number, dc: number) => void;
}) {
  const { save } = useSaveScore(row.attemptId, onReload);
  const cellOf = (skill: string) => row.cells.find((c) => c.skill === skill);
  const split = !!row.speakingScheduledAt
    && row.speakingScheduledAt.slice(0, 10) !== (row.lrwScheduledAt ?? '').slice(0, 10);

  return (
    <tr className="row-hover">
      <td className="td sticky-col">
        <Link className="link" to={`/mock-test/${row.attemptId}`}>{row.studentName}</Link>
        <div className="text-[11px] text-slate-500">{row.studentCode}</div>
      </td>
      <td className="td tabular-nums whitespace-nowrap">MT{row.attemptNo}</td>
      <td className="td whitespace-nowrap text-xs text-slate-400">
        {row.lrwScheduledAt ? fmtSlot(row.lrwScheduledAt) : <Pill tone="warn">Chưa xếp ngày</Pill>}
        <div><Pill tone={attemptStatusTone(row.status)}>{attemptStatusLabel(row.status)}</Pill></div>
        {split && (
          <div className="mt-1">
            <Pill tone="info" title={`Speaking ${fmtSlot(row.speakingScheduledAt)}`}>Speaking khác ngày</Pill>
          </div>
        )}
      </td>
      {rawSkills.map((s, ci) => {
        const cell = cellOf(s);
        if (!cell) return <td key={s} className="td text-slate-600">—</td>;
        return (
          <td key={s} className="td">
            <RawScoreInput
              cell={cell}
              onSave={(p) => save(s, p)}
              inputRef={(el) => register(ci, el)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); onMove(rowIndex, ci, 1, 0); }
                if (e.key === 'ArrowUp') { e.preventDefault(); onMove(rowIndex, ci, -1, 0); }
              }}
            />
            <div className="mt-1"><DeadlinePill cell={cell} /></div>
          </td>
        );
      })}
      {critSkills.map((s) => {
        const cell = cellOf(s);
        if (!cell) return <td key={s} className="td text-slate-600">—</td>;
        return (
          <td key={s} className="td">
            <CriteriaButton cell={cell} onSave={(p) => save(s, p)} />
            <div className="mt-1"><DeadlinePill cell={cell} /></div>
          </td>
        );
      })}
      <td className="td tabular-nums">{fmtBand(row.result.expectation)}</td>
      <td className="td tabular-nums text-slate-100">{fmtBand(row.result.overall)}</td>
      {/* Badge ôm sát nội dung: items-start để ô bảng rộng cũng không kéo giãn nó ra. */}
      <td className="td">
        <div className="flex flex-col items-start gap-0.5">
          <Pill tone={sosTone(row.result.sosLevel)}>
            {row.result.evaluable
              ? sosLabel(row.result.sosLevel)
              : `Chờ ${row.result.required.length - row.result.scoredRequired} kỹ năng`}
          </Pill>
          {row.result.scopeNote && (
            <span className="text-[10px] text-slate-500" title={row.result.scopeDetail ?? undefined}>
              {row.result.scopeNote}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
