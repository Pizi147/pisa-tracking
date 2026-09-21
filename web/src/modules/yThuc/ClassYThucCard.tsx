import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Alert, Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { fmtDate } from '../../lib/format.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, type ViolationCategory } from '@shared/domain/index.ts';
import { RecordViolationPanel } from './RecordViolationPanel.tsx';
import { CreateMeasurePanel } from './CreateMeasurePanel.tsx';
import { ConfirmMeasurePanel } from './ConfirmMeasurePanel.tsx';
import { DeleteViolationConfirm } from './DeleteViolationConfirm.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';

type ViolationView = {
  id: number; studentId: number; category: string; categoryLabel: string; skill: string | null; skillLabel: string | null;
  occurredOn: string; description: string; reportedBy: number; reportedByName: string | null; ageLabel: string;
};
type MeasureDetail = {
  id: number; studentId: number; kindLabel: string; statusLabel: string; status: string;
  violationCount: number; createdAt: string; performedOn: string | null;
};
type Board = {
  classId: number; canManage: boolean;
  warning: { activeCount: number; message: string };
  unhandled: {
    studentCount: number;
    students: Array<{ studentId: number; studentName: string; count: number; oldestAgeDays: number; warningActive: boolean; violations: ViolationView[] }>;
  };
  preparing: MeasureDetail[];
};

/**
 * `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ LỚP (SOS_VA_PHOI_HOP_V3.md §7.1–§7.2, plan.md K2).
 *
 * GVCN nhìn THEO HỌC SINH trước (nguyên tắc §7). Mặc định Theo học sinh, KHÔNG nhớ lựa chọn (Q-V3-7):
 * mỗi lần mở lại trang lớp, component này mount lại từ đầu nên tự về đúng mặc định.
 */
export function ClassYThucCard({ classId }: { classId: number }) {
  const { session } = useSession();
  const board = useApi<Board>(`/classes/${classId}/y-thuc`);
  const [sub, setSub] = useState<'violations' | 'coordination'>('violations');
  const [includeDone, setIncludeDone] = useState(false);
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(
    `/classes/${classId}/phoi-hop-sos${includeDone ? '?includeDone=1' : ''}`, [includeDone],
  );
  const roster = useApi<any[]>(`/classes/${classId}/roster`);

  const [mode, setMode] = useState<'byStudent' | 'byTime'>('byStudent');
  const [category, setCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [ticked, setTicked] = useState<Map<number, Set<number>>>(new Map());
  const [reportFor, setReportFor] = useState<number | null>(null);
  const [editViolation, setEditViolation] = useState<ViolationView | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [measureFor, setMeasureFor] = useState<{ studentId: number; studentName: string } | null>(null);
  const [confirmMeasureId, setConfirmMeasureId] = useState<number | null>(null);

  const tickOf = (studentId: number) => ticked.get(studentId) ?? new Set<number>();
  const toggleTick = (studentId: number, violationId: number) => {
    setTicked((m) => {
      const next = new Map(m);
      const set = new Set(next.get(studentId) ?? []);
      if (set.has(violationId)) set.delete(violationId); else set.add(violationId);
      next.set(studentId, set);
      return next;
    });
  };

  const students = useMemo(() => {
    const rows = (board.data?.unhandled.students ?? []).map((s) => ({
      ...s,
      violations: category ? s.violations.filter((v) => v.category === category) : s.violations,
    })).filter((s) => s.violations.length > 0);
    return rows.sort((a, b) => (
      Number(b.warningActive) - Number(a.warningActive)
      || b.violations.length - a.violations.length
      || a.studentName.localeCompare(b.studentName, 'vi')
    ));
  }, [board.data, category]);

  const timeline = useMemo(() => {
    const all = (board.data?.unhandled.students ?? []).flatMap((s) => s.violations.map((v) => ({ ...v, studentName: s.studentName })));
    const filtered = category ? all.filter((v) => v.category === category) : all;
    return filtered.sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.id - a.id);
  }, [board.data, category]);

  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;
  if (board.loading || !board.data) return <Card title="Ý thức & Phối hợp"><Skeleton rows={4} /></Card>;

  const d = board.data;
  const rosterOptions = (roster.data ?? []).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null }));
  /* V10: sửa/xoá được — người ghi (của mình) · GVCN của lớp · Quản lý trong phạm vi. Máy chủ vẫn kiểm lại; đây chỉ để ẩn nút cho gọn mắt. */
  const canEditViolation = (v: ViolationView) => d.canManage || v.reportedBy === session?.user?.id;

  return (
    <Card title="Ý thức & Phối hợp"
      action={<button className="btn btn-sm" onClick={() => setReportFor(0)}>+ Ghi vi phạm</button>}
      bodyClass="p-0">
      {d.warning.message && (
        <div className="px-4 pt-3"><Alert tone="warn">{d.warning.message.replace(/^⚠\s*/, '')}</Alert></div>
      )}

      <div className="px-4 pt-3 flex flex-wrap items-center gap-1.5">
        <button className={`btn btn-sm ${sub === 'violations' ? 'btn-primary' : ''}`} onClick={() => setSub('violations')}>
          Vi phạm & xử lý <span className="tabular-nums opacity-70 ml-1">{d.unhandled.studentCount}</span>
        </button>
        <button className={`btn btn-sm ${sub === 'coordination' ? 'btn-primary' : ''}`} onClick={() => setSub('coordination')}>
          Phối hợp SOS <span className="tabular-nums opacity-70 ml-1">{coord.data?.pendingCount ?? 0}</span>
        </button>
      </div>

      {sub === 'violations' && (
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              <button className={`btn btn-sm ${!category ? 'btn-primary' : ''}`} onClick={() => setCategory(null)}>Tất cả</button>
              {VIOLATION_CATEGORIES.map((c) => (
                <button key={c} className={`btn btn-sm ${category === c ? 'btn-primary' : ''}`} onClick={() => setCategory(c)}>
                  {VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button className={`btn btn-sm ${mode === 'byStudent' ? 'btn-primary' : ''}`} onClick={() => setMode('byStudent')}>Theo học sinh</button>
              <button className={`btn btn-sm ${mode === 'byTime' ? 'btn-primary' : ''}`} onClick={() => setMode('byTime')}>Theo thời gian</button>
            </div>
          </div>

          {mode === 'byStudent' ? (
            students.length === 0 ? <Empty title="Không còn vi phạm nào chưa xử lý." /> : (
              <ul className="list-none p-0 m-0 space-y-1.5">
                {students.map((s) => (
                  <li key={s.studentId} className="rounded-lg border" style={{ borderColor: 'var(--line)' }}>
                    <button type="button" onClick={() => setExpanded((set) => {
                      const next = new Set(set); if (next.has(s.studentId)) next.delete(s.studentId); else next.add(s.studentId); return next;
                    })}
                      className="w-full text-left appearance-none bg-transparent border-0 px-3 py-2.5 cursor-pointer flex flex-wrap items-center justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="text-slate-500 text-xs select-none" aria-hidden
                          style={{ transform: expanded.has(s.studentId) ? 'rotate(90deg)' : 'none', display: 'inline-block' }}>›</span>
                        <span className="text-sm text-slate-100">{s.studentName}</span>
                        <span className="text-xs text-slate-400">{s.violations.length} vi phạm</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {s.warningActive && <Alert tone="warn">cũ nhất {s.oldestAgeDays} ngày</Alert>}
                        {(d.preparing.filter((m) => m.studentId === s.studentId).length > 0) && (
                          <span className="text-xs text-slate-400">
                            {d.preparing.filter((m) => m.studentId === s.studentId).length} BP đang chuẩn bị
                          </span>
                        )}
                      </span>
                    </button>
                    {expanded.has(s.studentId) && (
                      <div className="px-3 pb-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--line)' }}>
                          <p className="text-[11px] text-slate-500 m-0 mb-1.5 uppercase tracking-wide">Vi phạm</p>
                          <ul className="list-none p-0 m-0 space-y-1">
                            {s.violations.map((v) => (
                              <li key={v.id} className="flex items-start gap-2 text-xs text-slate-300">
                                {d.canManage && (
                                  <input type="checkbox" className="mt-0.5" checked={tickOf(s.studentId).has(v.id)}
                                    onChange={() => toggleTick(s.studentId, v.id)} />
                                )}
                                <span className="min-w-0 flex-1">
                                  {fmtDate(v.occurredOn)} {v.categoryLabel}{v.skillLabel ? ` · ${v.skillLabel}` : ''} — {v.description}
                                  {v.ageLabel && <span className="text-amber-200/80 ml-1">{v.ageLabel}</span>}
                                  <span className="block text-slate-500">{v.reportedByName}</span>
                                </span>
                                {canEditViolation(v) && (
                                  <span className="flex gap-1 shrink-0">
                                    <button type="button" className="btn btn-sm btn-ghost" title="Sửa" onClick={() => setEditViolation(v)}>✎</button>
                                    <button type="button" className="btn btn-sm btn-ghost" title="Xoá" onClick={() => setDeleteId(v.id)}>🗑</button>
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                          {d.canManage && (
                            <button type="button" className="btn btn-sm mt-2" disabled={tickOf(s.studentId).size === 0}
                              onClick={() => setMeasureFor({ studentId: s.studentId, studentName: s.studentName })}>
                              Tạo biện pháp từ {tickOf(s.studentId).size} vi phạm đã chọn
                            </button>
                          )}
                        </div>
                        <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--line)' }}>
                          <p className="text-[11px] text-slate-500 m-0 mb-1.5 uppercase tracking-wide">Xử lý</p>
                          {d.preparing.filter((m) => m.studentId === s.studentId).length === 0 ? (
                            <p className="text-xs text-slate-500 m-0">Chưa có biện pháp đang chuẩn bị</p>
                          ) : (
                            <ul className="list-none p-0 m-0 space-y-1">
                              {d.preparing.filter((m) => m.studentId === s.studentId).map((m) => (
                                <li key={m.id} className="text-xs text-slate-300">
                                  {m.kindLabel} · {m.violationCount} vi phạm
                                  {d.canManage && (
                                    <button type="button" className="btn btn-sm btn-ghost ml-2" onClick={() => setConfirmMeasureId(m.id)}>
                                      Xác nhận
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                          <Link className="link text-xs block mt-2" to={`/hoc-vien/${s.studentId}`}>Hồ sơ học viên →</Link>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )
          ) : (
            timeline.length === 0 ? <Empty title="Không còn vi phạm nào chưa xử lý." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {timeline.map((v) => (
                      <tr key={v.id} className="row-hover">
                        <td className="td whitespace-nowrap tabular-nums">{fmtDate(v.occurredOn)}</td>
                        <td className="td">{(v as any).studentName}</td>
                        <td className="td text-slate-400">{v.categoryLabel}</td>
                        <td className="td text-slate-300">{v.description}</td>
                        <td className="td text-slate-500 text-xs">{v.reportedByName}</td>
                        <td className="td text-right whitespace-nowrap">
                          {canEditViolation(v) && (
                            <>
                              <button type="button" className="btn btn-sm btn-ghost" title="Sửa" onClick={() => setEditViolation(v)}>✎</button>
                              <button type="button" className="btn btn-sm btn-ghost" title="Xoá" onClick={() => setDeleteId(v.id)}>🗑</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {sub === 'coordination' && (
        <div className="p-4 space-y-3">
          <div className="flex justify-end">
            <button className="btn btn-sm btn-ghost" onClick={() => setIncludeDone((v) => !v)}>
              {includeDone ? 'Chỉ hiện lượt chưa xong' : 'Hiện cả lượt đã xong'}
            </button>
          </div>
          <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} onChanged={() => { coord.reload(); }} />
        </div>
      )}

      <RecordViolationPanel open={reportFor !== null} onClose={() => setReportFor(null)}
        studentId={reportFor ?? 0} students={rosterOptions}
        onPickStudent={setReportFor} onDone={board.reload} />
      <RecordViolationPanel open={!!editViolation} onClose={() => setEditViolation(null)}
        studentId={editViolation?.studentId ?? 0} violation={editViolation}
        onDone={board.reload} />
      <DeleteViolationConfirm violationId={deleteId} onClose={() => setDeleteId(null)} onDone={board.reload} />
      {measureFor && (
        <CreateMeasurePanel open={!!measureFor} onClose={() => setMeasureFor(null)}
          studentId={measureFor.studentId} studentName={measureFor.studentName}
          violations={[...tickOf(measureFor.studentId)].map((id) => {
            const v = students.find((s) => s.studentId === measureFor.studentId)?.violations.find((x) => x.id === id);
            return v ? { id: v.id, occurredOn: v.occurredOn, categoryLabel: v.categoryLabel, description: v.description } : null;
          }).filter(Boolean) as any}
          onDone={() => { setTicked((m) => { const n = new Map(m); n.delete(measureFor.studentId); return n; }); board.reload(); }}
          onConfirmNow={(id) => { setTicked((m) => { const n = new Map(m); n.delete(measureFor.studentId); return n; }); board.reload(); setConfirmMeasureId(id); }} />
      )}
      <ConfirmMeasurePanel open={confirmMeasureId !== null} onClose={() => setConfirmMeasureId(null)}
        measureId={confirmMeasureId} onDone={board.reload} />
    </Card>
  );
}
