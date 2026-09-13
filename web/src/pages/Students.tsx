import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { invalidate } from '../lib/api.ts';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { caseStatusLabel, caseStatusTone, sosTone } from '../lib/format.ts';
import type { Branch } from '../components/Filters.tsx';
import { IntakePanel } from '../components/IntakePanel.tsx';
import { ClassRoster } from '../components/ClassRoster.tsx';
import { DateDutyPanel } from '../components/DateDutyPanel.tsx';
import { MockPlanPanel } from '../components/MockPlanPanel.tsx';
import { MissingBadge } from '../components/MissingBadge.tsx';
import { PERMISSIONS, skillShort } from '@shared/domain.ts';

export type ClassSummary = {
  id: number; code: string; kind: string; route: string | null;
  branchId: number; branchCode: string; branchName: string;
  startDate: string | null;
  studentCount: number; needScores: number; openCases: number; needsDate: number;
  /** `ratio` = lớp thường chấm theo số câu đúng; `ielts_band` = lớp FT. */
  scoringMode: string | null;
  programmeName: string | null;
  /** Kỹ năng người đang xem dạy ở CHÍNH lớp này. */
  mySkills: string[];
  /** Người đang xem có phải GVCN của lớp này không. */
  myCoreClass: boolean;
  /** Một dòng tiến độ đọc được ngay: "BE · tuần 5/10 · Progress Test tuần này". */
  progressLabel: string | null;
  phase: string;
  phaseLabel: string;
  currentWeek: number | null;
  totalWeeks: number | null;
  /** Lớp đã hết chương trình và còn học viên → phải xếp lớp tiếp cho từng em. */
  needsPlacement: boolean;
  placementOptions: { code: string; name: string }[];
  /** Gom mọi thứ lớp còn thiếu vào một badge. */
  missing: { key: string; label: string; who: string }[];
  missingSkills: string[];
};

/**
 * Ba cách xem của cùng một màn hình.
 * "Cần nhập điểm" và "Cần cập nhật ngày" là HÀNG ĐỢI CÔNG VIỆC, không phải module riêng,
 * nên chúng là view ở đây chứ không phải một mục điều hướng.
 */
const VIEWS = [
  { key: 'classes', label: 'Theo lớp' },
  { key: 'my_scores', label: 'Cần nhập điểm' },
  // Không còn "cần xếp lịch": lịch đã do bộ phận xếp lịch bố trí. Việc ở đây là CẬP NHẬT
  // ngày thực tế, và chỉ với những MT đã đến tuần.
  { key: 'need_date', label: 'Cần cập nhật ngày MT' },
  { key: 'no_plan', label: 'Chưa có tuần MT' },
  { key: 'sos_open', label: 'Case SOS' },
] as const;

export default function StudentsPage() {
  const { session, can, branchCount } = useSession();
  const [params, setParams] = useSearchParams();
  const view = (params.get('view') ?? 'classes') as (typeof VIEWS)[number]['key'];
  const q = params.get('q') ?? '';
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  /*
   * Nhiều lớp mở cùng lúc và độc lập nhau: mở lớp thứ hai không được đóng lớp thứ nhất,
   * vì việc thật là đặt hai lớp cạnh nhau mà so. Danh sách lớp đang mở nằm trên URL nên
   * nút Back khôi phục đúng những lớp vừa mở, không chỉ lớp cuối cùng.
   */
  const openIds = useMemo(
    () => new Set((params.get('open') ?? '').split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0)),
    [params],
  );
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [intakeFor, setIntakeFor] = useState<ClassSummary | null>(null);
  const [draftQ, setDraftQ] = useState(q);

  const branches = useApi<Branch[]>('/ref/branches');
  const showBranch = (branches.data?.length ?? 0) > 1 && branchCount > 1;

  // Đổi bộ lọc bằng cách sửa URL, nên nút Back của trình duyệt giữ đúng ngữ cảnh cũ.
  const setParam = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k); else next.set(k, v);
    }
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    const t = setTimeout(() => { if (draftQ !== q) setParam({ q: draftQ || null }); }, 300);
    return () => clearTimeout(t);
  }, [draftQ, q, setParam]);

  const qs = useMemo(() => {
    const s = new URLSearchParams();
    if (branchId) s.set('branchId', String(branchId));
    if (q.trim()) s.set('q', q.trim());
    return `/classes?${s.toString()}`;
  }, [branchId, q]);
  const classes = useApi<{ rows: ClassSummary[]; scopeEmpty: boolean }>(view === 'classes' ? qs : null);

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Học viên</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lớp là gốc. Mở một lớp để xem học viên và tiến độ; tìm theo tên học viên cũng ra đúng lớp chứa em đó.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="label">Tìm</span>
            <input
              className="field w-56"
              placeholder="Mã lớp hoặc tên / mã học viên"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
            />
          </label>
          {showBranch && (
            <label className="block">
              <span className="label">Chi nhánh</span>
              <select className="field w-40" value={branchId ?? ''}
                onChange={(e) => setParam({ branchId: e.target.value || null })}>
                <option value="">Tất cả</option>
                {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            className={`btn btn-sm ${view === v.key ? 'btn-primary' : ''}`}
            onClick={() => setParam({ view: v.key === 'classes' ? null : v.key, open: null })}
          >
            {v.label}
          </button>
        ))}
        <div className="flex-1" />
        {can(PERMISSIONS.PLAN_WEEK) && (
          <button className="btn btn-sm" onClick={() => setPlanOpen(true)}>Lên kế hoạch MT</button>
        )}
        {can(PERMISSIONS.STUDENT_EDIT) && view === 'classes' && (
          <button className="btn btn-primary btn-sm" onClick={() => { setIntakeFor(null); setIntakeOpen(true); }}>
            Thêm học viên
          </button>
        )}
      </div>

      {/* Cập nhật ngày là thao tác HÀNG LOẠT, không phải một danh sách để bấm vào từng em. */}
      {view === 'need_date' && (
        <DateDutyPanel branchId={branchId} classId={params.get('classId') ? Number(params.get('classId')) : null} />
      )}
      {view === 'no_plan' && (
        <Card title="Chưa có tuần MT tiếp theo" bodyClass="p-4">
          <p className="text-sm text-slate-400 mb-3">
            Đây là việc của <strong>Quản lý</strong>: quyết định em sẽ MT tiếp theo vào tuần nào.
            Lên kế hoạch cho nhiều em một lần thay vì mở từng hồ sơ.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setPlanOpen(true)}>Lên kế hoạch MT</button>
        </Card>
      )}
      {(view === 'my_scores' || view === 'sos_open') && <WorkQueue view={view} branchId={branchId} q={q} />}

      {view === 'classes' && (
        <>
          {classes.error && <ErrorState message={classes.error.message} hint={classes.error.hint} onRetry={classes.reload} />}
          {classes.loading && <Skeleton rows={6} />}
          {classes.data && (
            <Card bodyClass="p-0">
              {classes.data.rows.length === 0 ? (
                <Empty
                  title={classes.data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không tìm thấy lớp nào'}
                  hint={classes.data.scopeEmpty
                    ? 'Tài khoản này chưa có vai trò kèm chi nhánh hoặc phân công lớp nào.'
                    : 'Thử bỏ bớt từ khoá, hoặc đổi chi nhánh.'}
                />
              ) : (
                <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
                  {classes.data.rows.map((c) => (
                    <ClassRow
                      key={c.id}
                      cls={c}
                      expanded={openIds.has(c.id)}
                      studentQuery={q}
                      onToggle={() => {
                        const next = new Set(openIds);
                        if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                        setParam({ open: next.size ? [...next].join(',') : null });
                      }}
                      onAddStudents={() => { setIntakeFor(c); setIntakeOpen(true); }}
                    />
                  ))}
                </ul>
              )}
            </Card>
          )}
          <SectionNote>
            Badge chỉ xuất hiện khi có việc cần làm. “Case SOS” đếm <strong>case</strong>, không phải học viên —
            một em có thể có nhiều case. Bấm badge để mở đúng những bản ghi tạo nên con số đó.
          </SectionNote>
        </>
      )}

      {planOpen && (
        <MockPlanPanel
          branchId={branchId}
          classId={params.get('classId') ? Number(params.get('classId')) : null}
          onClose={() => setPlanOpen(false)}
          onDone={() => { invalidate('/classes'); invalidate('/attempts'); classes.reload(); }}
        />
      )}

      {intakeOpen && (
        <IntakePanel
          defaultClass={intakeFor}
          onClose={() => { setIntakeOpen(false); setIntakeFor(null); }}
          onDone={() => { invalidate('/classes'); invalidate('/students'); classes.reload(); }}
        />
      )}
    </div>
  );
}

/**
 * Một dòng lớp.
 *
 * Ba vùng bấm tách nhau rõ: tên lớp mở Class Overview, badge mở danh sách tương ứng,
 * chevron (và nền dòng) đóng/mở danh sách học viên ngay tại chỗ. Badge và tên lớp phải
 * chặn nổi bọt sự kiện, nếu không bấm badge sẽ đồng thời mở/đóng roster.
 */
function ClassRow({ cls, expanded, studentQuery, onToggle, onAddStudents }: {
  cls: ClassSummary; expanded: boolean; studentQuery: string;
  onToggle: () => void; onAddStudents: () => void;
}) {
  const navigate = useNavigate();
  const rowRef = useRef<HTMLDivElement>(null);
  const go = (to: string) => (e: React.MouseEvent) => { e.stopPropagation(); navigate(to); };

  return (
    <li>
      <div
        ref={rowRef}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`Lớp ${cls.code}, ${expanded ? 'đang mở' : 'đang đóng'} danh sách học viên`}
        className="w-full text-left px-4 py-3 hover:bg-white/5 flex flex-wrap items-center gap-x-3 gap-y-2 cursor-pointer"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
        }}
      >
        <span className="shrink-0 text-slate-500 w-4 text-center" aria-hidden>{expanded ? '▾' : '▸'}</span>
        <Link
          to={`/hoc-vien/lop/${cls.id}`}
          className="link font-medium shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {cls.code}
        </Link>
        <span className="text-xs text-slate-500 shrink-0">
          {cls.branchName}
          {/*
            TIẾN ĐỘ LỚP ngay trên thanh lớp (mục 7.6). Với lớp Normal đây là câu quan trọng
            nhất của dòng này — "tuần 5/10" nói được nhiều hơn tên chương trình.
          */}
          {cls.progressLabel ? ` · ${cls.progressLabel}` : cls.route ? ` · ${cls.route}` : ''}
          {' · '}{cls.studentCount} HV
        </span>

        <span className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {/*
            * Giáo viên dạy nhiều lớp và ở mỗi lớp có thể ôm bộ kỹ năng khác nhau. Ghi thẳng
            * ra đây để không phải mở từng lớp mới biết mình phụ trách gì ở đâu.
            */}
          {cls.mySkills.length > 0 && (
            <Pill tone="info" title={`Bạn dạy ${cls.mySkills.map(skillShort).join(', ')} ở lớp này`}>
              {cls.mySkills.map(skillShort).join(' ')}
            </Pill>
          )}
          {cls.myCoreClass && <Pill tone="neutral" title="Bạn là giáo viên chủ nhiệm lớp này">GVCN</Pill>}

          {/*
            BA THÔNG BÁO CỦA LỚP NORMAL — owner yêu cầu 13/09/2026.

            Sắp thi / đang thi / đã hết chương trình. Cái cuối là nặng nhất: lớp xong rồi thì
            mọi em còn đang học PHẢI được xếp lớp tiếp, và việc đó không tự xảy ra.
          */}
          {cls.needsPlacement ? (
            <Pill tone="danger"
              title={`Lớp đã hết chương trình. ${cls.studentCount} học viên cần xếp lớp tiếp: `
                + cls.placementOptions.map((o) => o.name).join(' hoặc ')}>
              Hết chương trình · {cls.studentCount} em cần xếp lớp
            </Pill>
          ) : cls.phase === 'final_week' || cls.phase === 'progress_week' ? (
            <Pill tone="warn">{cls.phaseLabel}</Pill>
          ) : cls.phase === 'final_soon' || cls.phase === 'progress_soon' ? (
            <Pill tone="info">{cls.phaseLabel}</Pill>
          ) : null}

          {/* Thiếu GV kỹ năng nào thì nói thẳng kỹ năng đó — "Thiếu GV R, L" (mục 7.7). */}
          {cls.missingSkills.length > 0 && (
            <Pill tone="warn" title="Admin CN hoặc Quản lý phân công giáo viên cho các kỹ năng này">
              Thiếu GV {cls.missingSkills.map(skillShort).join(', ')}
            </Pill>
          )}
          <MissingBadge items={cls.missing.filter((m) => m.key !== 'teachers')} />
          {cls.needScores > 0 && (
            <button className="appearance-none bg-transparent border-0 p-0" onClick={go(`/hoc-vien?view=my_scores&classId=${cls.id}`)}>
              <Pill tone="warn">{cls.needScores} cần nhập điểm</Pill>
            </button>
          )}
          {cls.openCases > 0 && (
            <button className="appearance-none bg-transparent border-0 p-0" onClick={go(`/hoc-vien?view=sos_open&classId=${cls.id}`)}>
              <Pill tone="danger">{cls.openCases} case SOS</Pill>
            </button>
          )}
          {cls.needsDate > 0 && (
            <button className="appearance-none bg-transparent border-0 p-0" onClick={go(`/hoc-vien?view=need_date&classId=${cls.id}`)}>
              <Pill tone="info">{cls.needsDate} cần cập nhật ngày</Pill>
            </button>
          )}
          {cls.needScores + cls.openCases + cls.needsDate === 0
            && !cls.needsPlacement && !cls.missing.length && cls.phase === 'running' && (
            <span className="text-xs text-slate-600">Không có việc cần chú ý</span>
          )}
        </span>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <ClassRoster classId={cls.id} studentQuery={studentQuery} onAddStudents={onAddStudents} />
        </div>
      )}
    </li>
  );
}

/** Hàng đợi công việc: cùng dữ liệu lượt MT, chỉ đổi bộ lọc. */
function WorkQueue({ view, branchId, q }: { view: string; branchId: number | null; q: string }) {
  const [params] = useSearchParams();
  const classId = params.get('classId');
  const qs = useMemo(() => {
    const s = new URLSearchParams();
    s.set('need', view === 'sos_open' ? 'sos_open' : view);
    if (branchId) s.set('branchId', String(branchId));
    if (classId) s.set('classId', classId);
    if (q.trim()) s.set('q', q.trim());
    return `/attempts?${s.toString()}`;
  }, [view, branchId, classId, q]);
  const { data, loading, error, reload } = useApi<{ rows: any[]; scopeEmpty: boolean }>(qs);
  const navigate = useNavigate();

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading) return <Skeleton rows={6} />;
  if (!data) return null;

  const label = view === 'my_scores' ? 'cần nhập điểm' : 'case SOS chưa xử lý xong';

  return (
    <Card bodyClass="p-0"
      title={<span>{data.rows.length} lượt {label}{classId ? ' của lớp đang chọn' : ''}</span>}
      action={classId && <Link className="btn btn-sm no-underline" to={`/hoc-vien?view=${view}`}>Bỏ lọc lớp</Link>}>
      {data.rows.length === 0 ? (
        <Empty title={`Không còn việc nào ${label}`} hint="Xem tiếp bằng cách đổi cách xem hoặc bỏ bộ lọc." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th">Học viên</th>
                <th className="th">Lớp</th>
                <th className="th">MT</th>
                <th className="th">Tuần</th>
                <th className="th">Việc cần làm</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="row-hover cursor-pointer" onClick={() => navigate(`/mock-test/${r.id}`)}>
                  <td className="td">
                    <div className="text-slate-100">{r.studentName}</div>
                    <div className="text-[11px] text-slate-500">{r.studentCode}</div>
                  </td>
                  <td className="td text-slate-300 whitespace-nowrap">{r.classCode ?? '—'}</td>
                  {/* Lộ trình đã hiện ở cột Target ngay cạnh — nhắc lại chỉ là chữ thừa. */}
                  <td className="td tabular-nums whitespace-nowrap">MT{r.attemptNo}</td>
                  <td className="td whitespace-nowrap text-slate-300">{r.period?.code ?? '—'}</td>
                  <td className="td text-xs">
                    {view === 'my_scores' && (
                      <span style={{ color: 'var(--accent)' }}>Nhập {r.myPendingSkills.join(', ')}</span>
                    )}
                    {/*
                      * Nhìn là biết case đã được làm hay chưa: mức SOS · trạng thái, rồi mốc
                      * follow-up gần nhất. Không phải mở chi tiết mới rõ.
                      */}
                    {view === 'sos_open' && (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="flex items-center gap-1">
                          <Pill tone={sosTone(r.caseLevel)}>SOS {r.caseLevel}</Pill>
                          <Pill tone={caseStatusTone(r.caseStatus)}>{caseStatusLabel(r.caseStatus ?? 'open')}</Pill>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {r.caseFollowUp ?? 'Chưa có follow-up'}
                        </span>
                      </div>
                    )}
                    {r.overdueSkills > 0 && <Pill tone="danger">Quá hạn {r.overdueSkills}</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="p-3">
        <SectionNote>
          Danh sách này xét <strong>xuyên tuần</strong>, nên việc còn tồn từ tuần trước không biến mất khi đổi tuần ở nơi khác.
        </SectionNote>
      </div>
    </Card>
  );
}
