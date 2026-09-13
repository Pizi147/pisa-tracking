import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../../ui/ui.tsx';
import { caseStatusLabel, caseStatusTone, sosLabel, sosTone } from '../../lib/format.ts';
import { ATTEMPT_KIND_LABEL, type AttemptKind } from '@shared/domain/index.ts';

type SkillResult = {
  skill: string; label: string;
  score: number | null; total: number | null;
  ratio: number | null; outcome: 'pass' | 'fail' | 'missing';
};
type Row = {
  attemptId: number; kind: AttemptKind; kindLabel: string;
  studentId: number; studentName: string; studentCode: string; studentStatus: string;
  periodCode: string | null; takenOn: string | null; status: string;
  result: {
    skills: SkillResult[]; scored: number; required: number; complete: boolean;
    failedCount: number | null; sosLevel: number | null; passThreshold: number;
  };
  caseId: number | null; caseStatus: string | null; caseLevel: number | null;
};
type Sheet = {
  class: { id: number; code: string; branchName: string; startDate: string | null };
  programme: { code: string; name: string; weeks: number | null; skills: string[]; checkpoints: { kind: AttemptKind; studyWeek: number }[] };
  skillLabels: Record<string, string>;
  editableSkills: string[];
  canPlan: boolean;
  passThreshold: number;
  rows: Row[];
  today: string;
};

/** Hiển thị tỷ lệ. Làm tròn CHỈ ĐỂ HIỆN — việc xét đạt/trượt đã làm ở máy chủ trên số chính xác. */
const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 1000) / 10}%`);

/**
 * BẢNG ĐIỂM LỚP THƯỜNG (Foundation / Beginner / Elementary).
 *
 * Khác lớp FT: nhập `số câu đúng / tổng số câu`, đạt từ 60%. Không có band IELTS, không có
 * kỳ vọng theo target, không có Overall — vì bài này không phải bài IELTS bốn kỹ năng.
 */
export default function RegularSheetPage() {
  const { classId } = useParams();
  const [params, setParams] = useSearchParams();
  const kind = params.get('kind') ?? '';
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<Sheet>(
    classId ? `/regular/classes/${classId}/sheet${kind ? `?kind=${kind}` : ''}` : null,
  );
  const [busy, setBusy] = useState(false);

  // Tổng số câu dùng chung cho cả lớp: cả lớp thường làm cùng một đề, gõ lại từng dòng là thừa.
  const [bulkTotal, setBulkTotal] = useState<Record<string, string>>({});

  const kinds = useMemo(() => {
    const set = new Map<string, string>();
    for (const r of data?.rows ?? []) set.set(r.kind, r.kindLabel);
    return [...set.entries()];
  }, [data]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading) return <Skeleton rows={8} />;
  if (!data) return null;

  const plan = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ created: number; students: number }>(`/regular/classes/${classId}/plan`, {});
      toast.push(r.created > 0 ? 'ok' : 'info',
        r.created > 0 ? `Đã tạo ${r.created} bài kiểm tra cho ${r.students} học viên.`
                      : 'Mọi học viên đều đã có đủ bài kiểm tra.');
      invalidate('/regular'); invalidate('/classes'); reload();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <button className="btn btn-sm btn-ghost mb-1" onClick={() => navigate(-1)}>← Quay lại</button>
          <h1 className="text-lg font-semibold text-slate-100">
            Bảng điểm {data.class.code}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.programme.name}
            {data.programme.weeks ? ` · khoá ${data.programme.weeks} tuần` : ''} · {data.class.branchName}
            {' · '}
            {data.programme.checkpoints.map((c) => `${ATTEMPT_KIND_LABEL[c.kind]} tuần học ${c.studyWeek}`).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {kinds.length > 1 && (
            <label className="block">
              <span className="label">Bài</span>
              <select
                className="field w-48" value={kind}
                onChange={(e) => {
                  const next = new URLSearchParams(params);
                  if (e.target.value) next.set('kind', e.target.value); else next.delete('kind');
                  setParams(next, { replace: true });
                }}
              >
                <option value="">Tất cả</option>
                {kinds.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </label>
          )}
          {data.canPlan && (
            <button className="btn btn-sm" onClick={plan} disabled={busy}>
              {busy ? 'Đang tạo…' : 'Tạo bài kiểm tra theo chương trình'}
            </button>
          )}
        </div>
      </div>

      {data.rows.length === 0 ? (
        <Empty
          title="Lớp này chưa có bài kiểm tra nào"
          hint={data.canPlan
            ? 'Bấm "Tạo bài kiểm tra theo chương trình" để sinh bài giữa khoá và cuối khoá theo đúng mốc tuần học.'
            : 'Quản lý cần tạo kế hoạch kiểm tra cho lớp này.'}
        />
      ) : (
        <Card bodyClass="p-0">
          {/* Đặt tổng số câu chung một lần cho cả lớp, rồi sửa lại ở dòng có đề khác. */}
          {data.editableSkills.length > 0 && (
            <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
              <span className="label mb-0">Tổng số câu chung</span>
              {data.editableSkills.map((k) => (
                <label key={k} className="block">
                  <span className="label">{data.skillLabels[k] ?? k}</span>
                  <input
                    className="field w-24" type="number" min={1} placeholder="—"
                    value={bulkTotal[k] ?? ''}
                    onChange={(e) => setBulkTotal((b) => ({ ...b, [k]: e.target.value }))}
                  />
                </label>
              ))}
              <span className="text-[11px] text-slate-500 max-w-sm">
                Điền ở đây thì các ô còn trống bên dưới lấy sẵn con số này. Dòng nào đề khác thì sửa lại
                riêng dòng đó.
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Học viên</th>
                  <th className="th">Bài</th>
                  <th className="th">Tuần</th>
                  {data.programme.skills.map((k) => (
                    <th key={k} className="th text-center">{data.skillLabels[k] ?? k}</th>
                  ))}
                  <th className="th">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <SheetRow
                    key={r.attemptId} row={r} sheet={data} bulkTotal={bulkTotal}
                    onSaved={reload}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3">
            <SectionNote>
              Đạt từ <strong>{Math.round(data.passThreshold * 100)}%</strong> trở lên. Hệ thống xét trên
              <strong> tỷ lệ chính xác</strong>, không làm tròn phần trăm rồi mới so — 25/42 hiện ra “60%”
              nhưng thực tế là 59,5% nên vẫn là chưa đạt.
              <br />
              <strong>Thiếu điểm khác với trượt.</strong> Ô trống là chưa nhập, không phải 0 điểm; phải đủ điểm
              mọi kỹ năng thì mới kết luận và mới sinh case SOS — để không đẩy học viên lên SOS oan.
              Số môn chưa đạt ra mức SOS theo đúng ngưỡng của lớp FT: 1 môn → SOS 1, 2 môn → SOS 2, từ 3 môn → SOS 3.
            </SectionNote>
          </div>
        </Card>
      )}
    </div>
  );
}

function SheetRow({ row, sheet, bulkTotal, onSaved }: {
  row: Row; sheet: Sheet; bulkTotal: Record<string, string>; onSaved: () => void;
}) {
  return (
    <tr className={`row-hover align-top ${row.studentStatus !== 'active' ? 'row-muted' : ''}`}>
      <td className="td">
        <Link className="link" to={`/hoc-vien/${row.studentId}`}>{row.studentName}</Link>
        <div className="text-[11px] text-slate-500">{row.studentCode}</div>
      </td>
      <td className="td whitespace-nowrap text-slate-300">{row.kindLabel}</td>
      <td className="td whitespace-nowrap text-slate-400 text-xs">{row.periodCode ?? '—'}</td>

      {sheet.programme.skills.map((k) => {
        const cell = row.result.skills.find((s) => s.skill === k)!;
        return (
          <td key={k} className="td">
            <ScoreCell
              attemptId={row.attemptId} skill={k} cell={cell}
              canEdit={sheet.editableSkills.includes(k)}
              defaultTotal={bulkTotal[k] ?? ''}
              onSaved={onSaved}
            />
          </td>
        );
      })}

      <td className="td">
        <div className="flex flex-col items-start gap-0.5">
          {row.result.complete ? (
            <>
              <Pill tone={sosTone(row.result.sosLevel)}>{sosLabel(row.result.sosLevel)}</Pill>
              <span className="text-[10px] text-slate-500">
                {row.result.failedCount === 0
                  ? 'Đạt cả ' + row.result.required + ' môn'
                  : `${row.result.failedCount}/${row.result.required} môn chưa đạt`}
              </span>
            </>
          ) : (
            <>
              <Pill tone="neutral">Chờ {row.result.required - row.result.scored} môn</Pill>
              <span className="text-[10px] text-slate-500">Chưa đủ điểm để kết luận</span>
            </>
          )}
          {row.caseStatus && (
            <Pill tone={caseStatusTone(row.caseStatus)}>{caseStatusLabel(row.caseStatus)}</Pill>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Một ô điểm: số câu đúng và tổng số câu.
 *
 * CẢ HAI đều phải nhập — số câu không cố định giữa các kỹ năng và các đề, nên tự điền tổng
 * là đoán bừa, mà đoán sai tổng thì đạt/trượt sai theo.
 */
function ScoreCell({ attemptId, skill, cell, canEdit, defaultTotal, onSaved }: {
  attemptId: number; skill: string; cell: SkillResult;
  canEdit: boolean; defaultTotal: string; onSaved: () => void;
}) {
  const toast = useToast();
  const [score, setScore] = useState(cell.score === null ? '' : String(cell.score));
  const [total, setTotal] = useState(cell.total === null ? defaultTotal : String(cell.total));
  const [busy, setBusy] = useState(false);

  const dirty = score !== (cell.score === null ? '' : String(cell.score))
    || total !== (cell.total === null ? defaultTotal : String(cell.total));

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api.put(`/regular/attempts/${attemptId}/scores/${skill}`, {
        score: score === '' ? null : Number(score),
        total: total === '' ? null : Number(total),
      });
      invalidate('/regular'); invalidate('/classes'); invalidate('/attempts');
      onSaved();
    } catch (e: any) {
      toast.push('error', e.message);
    } finally { setBusy(false); }
  };

  if (!canEdit) {
    return (
      <div className="text-center">
        <div className="tabular-nums text-slate-200">
          {cell.score === null ? '—' : `${cell.score}/${cell.total}`}
        </div>
        <Outcome cell={cell} />
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        <input
          className="field w-14 text-center px-1" type="number" min={0} value={score}
          onChange={(e) => setScore(e.target.value)} onBlur={() => dirty && save()}
          aria-label={`Số câu đúng ${skill}`}
        />
        <span className="text-slate-600">/</span>
        <input
          className="field w-14 text-center px-1" type="number" min={1} value={total}
          placeholder="tổng"
          onChange={(e) => setTotal(e.target.value)} onBlur={() => dirty && save()}
          aria-label={`Tổng số câu ${skill}`}
        />
      </div>
      <Outcome cell={cell} busy={busy} />
    </div>
  );
}

function Outcome({ cell, busy }: { cell: SkillResult; busy?: boolean }) {
  if (busy) return <div className="text-[10px] text-slate-500 mt-0.5">Đang lưu…</div>;
  if (cell.outcome === 'missing') {
    return <div className="text-[10px] text-slate-600 mt-0.5">chưa nhập</div>;
  }
  return (
    <div className="mt-0.5 flex justify-center">
      <Pill tone={cell.outcome === 'pass' ? 'ok' : 'danger'}>
        {pct(cell.ratio)} · {cell.outcome === 'pass' ? 'Đạt' : 'Chưa đạt'}
      </Pill>
    </div>
  );
}
