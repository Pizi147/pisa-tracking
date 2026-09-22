import { useMemo, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Alert, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { fmtDate } from '../../lib/format.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, type ViolationCategory } from '@shared/domain/index.ts';
import { RecordViolationPanel } from './RecordViolationPanel.tsx';
import { CreateMeasurePanel } from './CreateMeasurePanel.tsx';
import { ConfirmMeasurePanel } from './ConfirmMeasurePanel.tsx';
import { DeleteViolationConfirm } from './DeleteViolationConfirm.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

type ViolationView = {
  id: number; category: string; categoryLabel: string; skill: string | null; skillLabel: string | null;
  occurredOn: string; description: string; reportedBy: number; reportedByName: string | null; state: string; stateLabel: string; ageLabel: string;
};
type MeasureDetail = {
  id: number; kindLabel: string; kind: string; statusLabel: string; status: string;
  violationCount: number; performedOn: string | null; createdAt: string;
};

const RANGES = [
  { key: '7', label: '7 ngày' },
  { key: '30', label: '30 ngày' },
  { key: 'all', label: 'Tất cả' },
] as const;

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ HỌC VIÊN (§7.3, plan.md K3) — thêm cạnh hai tab hiện có, không dựng
 * lại hồ sơ. Không toggle Theo HS (đã là một em); tóm tắt là MỘT dòng chữ, không thẻ số.
 */
export function StudentYThucSection({ studentId, studentName, canRecordViolation, canManageDiscipline, onGoAcademic }: {
  studentId: number; studentName: string; canRecordViolation: boolean; canManageDiscipline: boolean;
  /** Đổi sang tab Học thuật của hồ sơ (link trong thẻ Phối hợp SOS, Task 4–5). */
  onGoAcademic?: () => void;
}) {
  const warn = useApi<{ message: string }>(`/students/${studentId}/violation-warning`, [studentId]);
  const violations = useApi<{ rows: ViolationView[] }>(`/students/${studentId}/violations`, [studentId]);
  const measures = useApi<{ rows: MeasureDetail[] }>(`/students/${studentId}/measures`, [studentId]);
  const [sub, setSub] = useState<'violations' | 'coordination'>('violations');
  const coord = useApi<{ rows: CoordTurn[] }>(sub === 'coordination' ? `/students/${studentId}/phoi-hop-sos` : null, [studentId, sub]);

  const [category, setCategory] = useState<string | null>(null);
  const [range, setRange] = useState<'7' | '30' | 'all'>('all');
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [reportOpen, setReportOpen] = useState(false);
  const [editViolation, setEditViolation] = useState<ViolationView | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [confirmMeasureId, setConfirmMeasureId] = useState<number | null>(null);
  const { session } = useSession();
  const { homNay: today } = useNgayNghiepVu();
  /* V10: sửa/xoá được — người ghi (của mình) · GVCN của lớp · Quản lý trong phạm vi. Máy chủ vẫn kiểm lại; đây chỉ để ẩn nút cho gọn mắt. */
  const canEditViolation = (v: ViolationView) => canManageDiscipline || v.reportedBy === session?.user?.id;

  const cutoff = range === 'all' ? null : addDays(today, -Number(range));

  const reload = () => { violations.reload(); measures.reload(); warn.reload(); };

  const vRows = violations.data?.rows ?? [];
  const mRows = measures.data?.rows ?? [];

  const summary = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const v of vRows) byCat.set(v.category, (byCat.get(v.category) ?? 0) + 1);
    const preparing = mRows.filter((m) => m.status === 'preparing').length;
    const bits = [`${vRows.length} vi phạm trong lộ trình`];
    for (const c of VIOLATION_CATEGORIES) {
      const n = byCat.get(c) ?? 0;
      if (n > 0) bits.push(`${n} ${VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}`);
    }
    if (preparing > 0) bits.push(`${preparing} PA đang chuẩn bị`);
    const lastWarning = ['warning_3', 'warning_2', 'warning_1'].find((k) => mRows.some((m) => m.kind === k && m.status === 'done'));
    if (lastWarning) bits.push(`Thư cảnh cáo: lần ${lastWarning.slice(-1)}`);
    return bits.join(' · ');
  }, [vRows, mRows]);

  const timeline = useMemo(() => {
    type Row = { key: string; date: string; kind: 'vp' | 'pa'; v?: ViolationView; m?: MeasureDetail };
    const rows: Row[] = [
      ...vRows.map((v): Row => ({ key: `v${v.id}`, date: v.occurredOn, kind: 'vp', v })),
      ...mRows.map((m): Row => ({ key: `m${m.id}`, date: m.performedOn ?? m.createdAt.slice(0, 10), kind: 'pa', m })),
    ];
    return rows
      .filter((r) => !category || (r.v && r.v.category === category))
      .filter((r) => !cutoff || r.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [vRows, mRows, category, cutoff]);

  if (violations.error) return <ErrorState message={violations.error.message} onRetry={reload} />;
  if (violations.loading || measures.loading) return <Skeleton rows={4} />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <button className={`btn btn-sm ${sub === 'violations' ? 'btn-primary' : ''}`} onClick={() => setSub('violations')}>
            Vi phạm & xử lý
          </button>
          <button className={`btn btn-sm ${sub === 'coordination' ? 'btn-primary' : ''}`} onClick={() => setSub('coordination')}>
            Phối hợp SOS
          </button>
        </div>
        {canRecordViolation && <button className="btn btn-sm" onClick={() => setReportOpen(true)}>+ Ghi nhận vi phạm</button>}
      </div>

      {sub === 'violations' ? (
        <>
          {warn.data?.message && <Alert tone="warn">{warn.data.message.replace(/^⚠\s*/, '')}</Alert>}
          <p className="text-sm text-slate-300 m-0">{summary}</p>

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
              {RANGES.map((r) => (
                <button key={r.key} className={`btn btn-sm ${range === r.key ? 'btn-primary' : ''}`} onClick={() => setRange(r.key)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {timeline.length === 0 ? <Empty title="Chưa có gì trong khoảng này" /> : (
            <ul className="list-none p-0 m-0 space-y-1">
              {timeline.map((r) => (
                <li key={r.key} className="flex items-start gap-2 text-sm py-1 border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                  {r.kind === 'vp' && r.v ? (
                    <>
                      {canManageDiscipline && r.v.state === 'unhandled' ? (
                        <input type="checkbox" className="mt-1" checked={ticked.has(r.v.id)}
                          onChange={() => setTicked((s) => { const n = new Set(s); if (n.has(r.v!.id)) n.delete(r.v!.id); else n.add(r.v!.id); return n; })} />
                      ) : <span className="w-4 shrink-0" />}
                      <span className="min-w-0 flex-1">
                        <span className="text-slate-500 tabular-nums">{fmtDate(r.v.occurredOn)}</span>
                        {' '}<span className="text-slate-400">[VP]</span>{' '}
                        {r.v.categoryLabel}{r.v.skillLabel ? ` · ${r.v.skillLabel}` : ''} — {r.v.description}
                        {' '}<span className="text-slate-500">{r.v.stateLabel}</span>
                        {r.v.ageLabel && <span className="text-amber-200/80 ml-1">{r.v.ageLabel}</span>}
                      </span>
                      {canEditViolation(r.v) && (
                        <span className="flex gap-1 shrink-0">
                          <button type="button" className="btn btn-sm btn-ghost" title="Sửa" onClick={() => setEditViolation(r.v!)}>✎</button>
                          <button type="button" className="btn btn-sm btn-ghost" title="Xoá" onClick={() => setDeleteId(r.v!.id)}>🗑</button>
                        </span>
                      )}
                    </>
                  ) : r.m && (
                    <>
                      <span className="w-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="text-slate-500 tabular-nums">{fmtDate(r.date)}</span>
                        {' '}<span className="text-slate-400">[PA]</span>{' '}
                        {r.m.kindLabel} · {r.m.violationCount} vi phạm · {r.m.statusLabel}
                      </span>
                      {r.m.status === 'preparing' && canManageDiscipline && (
                        <button type="button" className="btn btn-sm" onClick={() => setConfirmMeasureId(r.m!.id)}>Xác nhận</button>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canManageDiscipline && (
            <button className="btn btn-sm" disabled={ticked.size === 0} onClick={() => setMeasureOpen(true)}>
              Tạo phương án từ {ticked.size} vi phạm
            </button>
          )}
        </>
      ) : (
        <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} showStudentName={false}
          onChanged={() => coord.reload()} />
      )}

      <RecordViolationPanel open={reportOpen} onClose={() => setReportOpen(false)}
        studentId={studentId} studentName={studentName} onDone={reload} />
      <RecordViolationPanel open={!!editViolation} onClose={() => setEditViolation(null)}
        studentId={studentId} violation={editViolation} onDone={reload} />
      <DeleteViolationConfirm violationId={deleteId} onClose={() => setDeleteId(null)} onDone={reload} />
      {measureOpen && (
        <CreateMeasurePanel open={measureOpen} onClose={() => setMeasureOpen(false)}
          studentId={studentId} studentName={studentName}
          violations={vRows.filter((v) => ticked.has(v.id)).map((v) => ({
            id: v.id, occurredOn: v.occurredOn, categoryLabel: v.categoryLabel, description: v.description,
          }))}
          onDone={() => { setTicked(new Set()); reload(); }}
          onConfirmNow={(id) => { setTicked(new Set()); reload(); setConfirmMeasureId(id); }} />
      )}
      <ConfirmMeasurePanel open={confirmMeasureId !== null} onClose={() => setConfirmMeasureId(null)}
        measureId={confirmMeasureId} onDone={reload} />
    </div>
  );
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
