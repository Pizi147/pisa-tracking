import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Alert, Card, Empty, ErrorState, Info, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { DongThoiGian } from '../../ui/DongThoiGian.tsx';
import { fmtDate, studentStatusLabel } from '../../lib/format.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, demTheoNhomViPham, type ViolationCategory } from '@shared/domain/index.ts';
import { RecordViolationPanel } from './RecordViolationPanel.tsx';
import { CreateMeasurePanel } from './CreateMeasurePanel.tsx';
import { ConfirmMeasurePanel } from './ConfirmMeasurePanel.tsx';
import { DeleteViolationConfirm } from './DeleteViolationConfirm.tsx';
import { XemPhuongAnPanel } from './XemPhuongAnPanel.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';

type ViolationView = {
  id: number; studentId: number; category: string; categoryLabel: string; skill: string | null; skillLabel: string | null;
  occurredOn: string; description: string; reportedBy: number; reportedByName: string | null; ageDays: number; ageLabel: string;
};
type MeasureDetail = {
  id: number; studentId: number; studentName: string; kindLabel: string; statusLabel: string; status: string;
  violationCount: number; createdAt: string; performedOn: string | null;
  violations?: ViolationView[];
};
type Board = {
  classId: number; canManage: boolean; canRecord: boolean;
  warning: { activeCount: number; message: string };
  unhandled: {
    studentCount: number;
    students: Array<{ studentId: number; studentName: string; count: number; oldestAgeDays: number; warningActive: boolean; violations: ViolationView[] }>;
  };
  preparing: MeasureDetail[];
  history: { total: number; latest: MeasureDetail[] };
  recentByStudent: Record<number, MeasureDetail[]>;
};

/**
 * `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ LỚP — theo prototype v3 `thiet-ke/tham-khao/ho-so-lop-v3.html` (spec PR-HV §4.5, A7):
 * dòng học viên là LƯỚI 4 cột (tên + mã/trạng thái · số vi phạm chia nhóm · cảnh báo + PA đang chuẩn bị · nút Mở); mở ra
 * hai thẻ `Vi phạm gần đây` | `Xử lý`; `Theo thời gian` là một dòng thời gian lưới; `Phối hợp SOS` dạng thẻ (`TheSos`).
 *
 * GVCN nhìn THEO HỌC SINH trước (nguyên tắc §7). Mặc định Theo học sinh, KHÔNG nhớ lựa chọn (Q-V3-7): mỗi lần mở lại
 * trang lớp, component này mount lại từ đầu nên tự về đúng mặc định. Logic lọc/hợp của K2/K3 giữ nguyên.
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
  /** Vi phạm đưa vào panel Tạo phương án: đã tick, hoặc (J11) mọi vi phạm đang hiện của em khi chưa tick. */
  const [measureFor, setMeasureFor] = useState<{ studentId: number; studentName: string; violationIds: number[] } | null>(null);
  const [confirmMeasureId, setConfirmMeasureId] = useState<number | null>(null);
  const [xemId, setXemId] = useState<number | null>(null);

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
  const clearTick = (studentId: number) => setTicked((m) => { const n = new Map(m); n.delete(studentId); return n; });

  /**
   * K3-2/K3-3: một em chỉ hiện ở một nhóm nếu có VI PHẠM (chưa xử lý, hoặc đã gom vào phương án Đang
   * chuẩn bị — K2-2) thuộc đúng nhóm đó; bộ lọc "Tất cả" luôn hiện đủ. Không xét theo nhóm KHÁC của em
   * (vd còn vi phạm BTVN chưa xử lý không kéo em vào nhóm Kỷ luật lớp học nếu phương án không có vi phạm đó).
   */
  const rowsForCategory = (cat: string | null) => {
    const unhandledByStudent = new Map((board.data?.unhandled.students ?? []).map((s) => [s.studentId, s]));
    const preparingByStudent = new Map<number, MeasureDetail[]>();
    (board.data?.preparing ?? []).forEach((m) => {
      const arr = preparingByStudent.get(m.studentId) ?? [];
      arr.push(m);
      preparingByStudent.set(m.studentId, arr);
    });
    const studentIds = new Set([...unhandledByStudent.keys(), ...preparingByStudent.keys()]);
    const rows: Array<{ studentId: number; studentName: string; count: number; oldestAgeDays: number; warningActive: boolean; violations: ViolationView[] }> = [];
    for (const studentId of studentIds) {
      const s = unhandledByStudent.get(studentId);
      const ms = preparingByStudent.get(studentId) ?? [];
      const violations = s ? (cat ? s.violations.filter((v) => v.category === cat) : s.violations) : [];
      const hasPreparingInCat = cat ? ms.some((m) => (m.violations ?? []).some((v) => v.category === cat)) : ms.length > 0;
      if (violations.length === 0 && !hasPreparingInCat) continue;
      rows.push({
        studentId, studentName: s?.studentName ?? ms[0].studentName,
        count: s?.count ?? 0, oldestAgeDays: s?.oldestAgeDays ?? 0, warningActive: s?.warningActive ?? false,
        violations,
      });
    }
    return rows;
  };

  const students = useMemo(() => rowsForCategory(category).sort((a, b) => (
    Number(b.warningActive) - Number(a.warningActive)
    || b.violations.length - a.violations.length
    || a.studentName.localeCompare(b.studentName, 'vi')
  )), [board.data, category]);
  /* K3-3: số trên tab con = đúng số dòng hiện ở bộ lọc "Tất cả", bất kể nhóm đang chọn. */
  const allCount = useMemo(() => rowsForCategory(null).length, [board.data]);

  const timeline = useMemo(() => {
    const all = (board.data?.unhandled.students ?? []).flatMap((s) => s.violations.map((v) => ({ ...v, studentName: s.studentName })));
    const filtered = category ? all.filter((v) => v.category === category) : all;
    return filtered.sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.id - a.id);
  }, [board.data, category]);

  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;
  if (board.loading || !board.data) return <Card title="Ý thức & Phối hợp"><Skeleton rows={4} /></Card>;

  const d = board.data;
  const rosterOptions = (roster.data ?? []).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null }));
  /* J4: dòng phụ `{mã HV} · {trạng thái}` lấy từ roster đã tải — máy chủ không trả chương trình theo em. */
  const rosterById = new Map<number, any>((roster.data ?? []).map((r: any) => [r.id, r]));
  const prepOf = (sid: number) => d.preparing.filter((m) => m.studentId === sid);
  /* V10: sửa/xoá được — người ghi (của mình) · GVCN của lớp · Quản lý trong phạm vi. Máy chủ vẫn kiểm lại; đây chỉ để ẩn nút cho gọn mắt. */
  const canEditViolation = (v: ViolationView) => d.canManage || v.reportedBy === session?.user?.id;
  const suaBtn = (v: ViolationView) => canEditViolation(v)
    ? <button type="button" className="btn btn-sm" onClick={() => setEditViolation(v)}>Sửa</button>
    : null;

  return (
    <Card title="Ý thức & Phối hợp"
      action={d.canRecord ? <button className="btn btn-sm btn-primary" onClick={() => setReportFor(0)}>+ Ghi nhận vi phạm</button> : undefined}
      bodyClass="p-0">
      {d.warning.message && (
        <div className="px-4 pt-3"><Alert tone="warn">{d.warning.message.replace(/^⚠\s*/, '')}</Alert></div>
      )}

      <div className="px-4 pt-3">
        <HangTab cap="con" ariaLabel="Ý thức & Phối hợp của lớp" value={sub} onChange={setSub}
          tabs={[
            { key: 'violations', label: 'Vi phạm & xử lý', so: allCount },
            { key: 'coordination', label: 'Phối hợp SOS', so: coord.data?.pendingCount ?? 0 },
          ]} />
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
                {students.map((s) => {
                  const r = rosterById.get(s.studentId);
                  const dem = demTheoNhomViPham(s.violations);
                  const preps = prepOf(s.studentId);
                  const mo = expanded.has(s.studentId);
                  const ticks = tickOf(s.studentId);
                  return (
                    <li key={s.studentId} className="rounded-lg border" style={{ borderColor: 'var(--line)' }}>
                      {/* Đầu dòng là MỘT nút; nút Mở/Đóng bên trong chỉ là chữ (span) — không có nút lồng nút. */}
                      <button type="button" aria-expanded={mo}
                        onClick={() => setExpanded((set) => {
                          const next = new Set(set); if (next.has(s.studentId)) next.delete(s.studentId); else next.add(s.studentId); return next;
                        })}
                        className="w-full text-left appearance-none bg-transparent border-0 cursor-pointer row-hover">
                        <span className="grid gap-x-3 gap-y-1 items-center px-3 py-2.5 grid-cols-2 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,12rem)_auto]">
                          <span className="col-span-2 md:col-span-1 min-w-0">
                            <span className="block text-sm font-semibold text-slate-100">{s.studentName}</span>
                            <span className="block text-[11px] text-slate-500">
                              {[r?.studentCode, r ? studentStatusLabel(r.status).toLowerCase() : null].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-100">{s.violations.length} vi phạm</span>
                            <span className="block text-[11px] text-slate-500">{dem.nhom.map((g) => `${g.n} ${g.label}`).join(' · ')}</span>
                          </span>
                          <span className="min-w-0">
                            <span className="block">
                              {s.warningActive
                                ? <Alert tone="warn">cũ nhất {s.oldestAgeDays} ngày</Alert>
                                : <span className="text-xs text-slate-500">Không có cảnh báo</span>}
                            </span>
                            <span className="block text-[11px] text-slate-500 mt-0.5">{preps.length} PA đang chuẩn bị</span>
                          </span>
                          <span className="justify-self-end">
                            <span className="btn btn-sm" aria-hidden>{mo ? 'Đóng' : 'Mở'}</span>
                          </span>
                        </span>
                      </button>

                      {mo && (
                        <div className="px-3 pb-3 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
                          <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--line)' }}>
                            <p className="text-[11px] uppercase tracking-wide text-slate-500 m-0 mb-1.5">Vi phạm gần đây</p>
                            <DongThoiGian bien="gon" coCotChon={d.canManage}
                              muc={s.violations.map((v) => ({
                                key: `v${v.id}`, ngay: v.occurredOn,
                                chon: d.canManage
                                  ? { checked: ticks.has(v.id), onChange: () => toggleTick(s.studentId, v.id), nhanDoc: `Chọn vi phạm ${fmtDate(v.occurredOn)}` }
                                  : null,
                                tieuDe: v.description,
                                dongPhu: [v.skillLabel, v.reportedByName, v.ageLabel ? `⚠ đã ${v.ageDays} ngày` : null].filter(Boolean).join(' · '),
                                cuoi: <><Info>{v.categoryLabel}</Info>{suaBtn(v)}</>,
                              }))}
                              rong={<p className="text-xs text-slate-500 m-0">Không có vi phạm chưa xử lý ở nhóm này.</p>} />
                            {d.canManage && ticks.size > 0 && (
                              <button type="button" className="btn btn-sm btn-primary mt-2"
                                onClick={() => setMeasureFor({ studentId: s.studentId, studentName: s.studentName, violationIds: [...ticks] })}>
                                Tạo phương án từ {ticks.size} vi phạm
                              </button>
                            )}
                          </div>
                          <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--line)' }}>
                            <p className="text-[11px] uppercase tracking-wide text-slate-500 m-0 mb-1.5">Xử lý</p>
                            {preps.length === 0 ? (
                              <>
                                <p className="text-xs text-slate-500 m-0">Chưa có phương án đang chuẩn bị</p>
                                {d.canManage && s.violations.length > 0 && (
                                  <button type="button" className="btn btn-sm btn-primary mt-2"
                                    onClick={() => setMeasureFor({
                                      studentId: s.studentId, studentName: s.studentName,
                                      violationIds: ticks.size > 0 ? [...ticks] : s.violations.map((v) => v.id),
                                    })}>
                                    Tạo phương án
                                  </button>
                                )}
                              </>
                            ) : (
                              <ul className="list-none p-0 m-0 space-y-2">
                                {preps.map((m) => (
                                  <li key={m.id}>
                                    <span className="block text-sm font-medium text-slate-100">{m.kindLabel}</span>
                                    <span className="block text-[11px] text-slate-500">Đang chuẩn bị · {m.violationCount} vi phạm</span>
                                    <span className="block mt-1">
                                      {d.canManage
                                        ? <button type="button" className="btn btn-sm btn-primary" onClick={() => setConfirmMeasureId(m.id)}>Mở phương án</button>
                                        : <button type="button" className="btn btn-sm" onClick={() => setXemId(m.id)}>Xem</button>}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <p className="text-xs text-slate-500 m-0 mt-2">
                              Gần đây: {(() => {
                                const recent = d.recentByStudent[s.studentId] ?? [];
                                return recent.length === 0 ? '—' : recent.map((m) => m.kindLabel).join(', ');
                              })()}
                            </p>
                            <Link className="link text-xs block mt-2" to={`/hoc-vien/${s.studentId}?tab=y-thuc`}>Hồ sơ học viên →</Link>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <DongThoiGian bien="day-du"
              muc={timeline.map((v) => ({
                key: `v${v.id}`, ngay: v.occurredOn,
                cot2: <span className="text-sm text-slate-200">{v.studentName}</span>,
                tieuDe: v.description,
                dongPhu: v.reportedByName ?? undefined,
                cuoi: <><Info>{v.categoryLabel}</Info>{suaBtn(v)}</>,
              }))}
              rong={<Empty title="Không còn vi phạm nào chưa xử lý." />} />
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
          <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="hocVien" onChanged={() => { coord.reload(); }} />
        </div>
      )}

      <RecordViolationPanel open={reportFor !== null} onClose={() => setReportFor(null)}
        studentId={reportFor ?? 0} students={rosterOptions}
        onPickStudent={setReportFor} onDone={board.reload} />
      <RecordViolationPanel open={!!editViolation} onClose={() => setEditViolation(null)}
        studentId={editViolation?.studentId ?? 0} violation={editViolation}
        onDone={board.reload} onDelete={(id) => setDeleteId(id)} />
      <DeleteViolationConfirm violationId={deleteId} onClose={() => setDeleteId(null)} onDone={board.reload} />
      {measureFor && (
        <CreateMeasurePanel open={!!measureFor} onClose={() => setMeasureFor(null)}
          studentId={measureFor.studentId} studentName={measureFor.studentName}
          violations={measureFor.violationIds.map((id) => {
            const v = students.find((s) => s.studentId === measureFor.studentId)?.violations.find((x) => x.id === id);
            return v ? { id: v.id, occurredOn: v.occurredOn, categoryLabel: v.categoryLabel, description: v.description } : null;
          }).filter(Boolean) as any}
          onDone={() => { clearTick(measureFor.studentId); board.reload(); }}
          onConfirmNow={(id) => { clearTick(measureFor.studentId); board.reload(); setConfirmMeasureId(id); }} />
      )}
      <ConfirmMeasurePanel open={confirmMeasureId !== null} onClose={() => setConfirmMeasureId(null)}
        measureId={confirmMeasureId} onDone={board.reload} />
      <XemPhuongAnPanel measureId={xemId} onClose={() => setXemId(null)} />
    </Card>
  );
}
