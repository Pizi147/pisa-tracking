import { useMemo, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Alert, Empty, ErrorState, Skeleton, Status } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { OSoNho } from '../../ui/OSoNho.tsx';
import { DongThoiGian, type DongThoiGianMuc } from '../../ui/DongThoiGian.tsx';
import { fmtDate } from '../../lib/format.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, demTheoNhomViPham, type ViolationCategory } from '@shared/domain/index.ts';
import { RecordViolationPanel } from './RecordViolationPanel.tsx';
import { CreateMeasurePanel } from './CreateMeasurePanel.tsx';
import { ConfirmMeasurePanel } from './ConfirmMeasurePanel.tsx';
import { DeleteViolationConfirm } from './DeleteViolationConfirm.tsx';
import { XemPhuongAnPanel } from './XemPhuongAnPanel.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

type ViolationView = {
  id: number; category: string; categoryLabel: string; skill: string | null; skillLabel: string | null;
  occurredOn: string; description: string; reportedBy: number; reportedByName: string | null; state: string; stateLabel: string;
  ageDays: number; ageLabel: string;
};
type MeasureDetail = {
  id: number; kindLabel: string; kind: string; statusLabel: string; status: string;
  violationCount: number; performedOn: string | null; createdAt: string;
  violations: { category: string }[];
};

const RANGES = [
  { key: 'all', label: 'Tất cả thời gian' },
  { key: '7', label: '7 ngày' },
  { key: '30', label: '30 ngày' },
] as const;

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ HỌC VIÊN — theo prototype v3 `thiet-ke/tham-khao/ho-so-hoc-vien-v3.html`
 * (spec PR-HV §4.3): đầu khối + nút `+ Ghi nhận vi phạm` (A2) · hai tab con (số lượt Phối hợp chưa xong trên nhãn, A5)
 * · ô số nhỏ thay câu một dòng (A3) · dòng thời gian LƯỚI `ngày · nhãn · nội dung · nút` (mới nhất trước) · ô tick để
 * gom vi phạm thành phương án (A4). Nút theo dòng: vi phạm `Sửa` (xoá nằm trong form sửa) · PA đang chuẩn bị `Mở`
 * (ConfirmMeasurePanel) · PA đã thực hiện `Xem` (hộp chỉ đọc, K2-6). Không toggle Theo HS (đã là một em).
 */
export function StudentYThucSection({ studentId, studentName, canRecordViolation, canManageDiscipline, onGoAcademic }: {
  studentId: number; studentName: string; canRecordViolation: boolean; canManageDiscipline: boolean;
  /** Đổi sang tab Học thuật của hồ sơ (link trong thẻ Phối hợp SOS). */
  onGoAcademic?: () => void;
}) {
  const warn = useApi<{ message: string }>(`/students/${studentId}/violation-warning`, [studentId]);
  const violations = useApi<{ rows: ViolationView[] }>(`/students/${studentId}/violations`, [studentId]);
  const measures = useApi<{ rows: MeasureDetail[] }>(`/students/${studentId}/measures`, [studentId]);
  const [sub, setSub] = useState<'violations' | 'coordination'>('violations');
  /* Tải LUÔN (không đợi mở tab con) để nhãn `Phối hợp SOS {n}` có số ngay (A5). */
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(`/students/${studentId}/phoi-hop-sos`, [studentId]);

  const [category, setCategory] = useState<string | null>(null);
  const [range, setRange] = useState<'7' | '30' | 'all'>('all');
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [reportOpen, setReportOpen] = useState(false);
  const [editViolation, setEditViolation] = useState<ViolationView | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [confirmMeasureId, setConfirmMeasureId] = useState<number | null>(null);
  const [xemId, setXemId] = useState<number | null>(null);
  const { session } = useSession();
  const { homNay: today } = useNgayNghiepVu();
  /* V10: sửa/xoá được — người ghi (của mình) · GVCN của lớp · Quản lý trong phạm vi. Máy chủ vẫn kiểm lại; đây chỉ để ẩn nút cho gọn mắt. */
  const canEditViolation = (v: ViolationView) => canManageDiscipline || v.reportedBy === session?.user?.id;

  const cutoff = range === 'all' ? null : addDays(today, -Number(range));

  const reload = () => { violations.reload(); measures.reload(); warn.reload(); coord.reload(); };

  const vRows = violations.data?.rows ?? [];
  const mRows = measures.data?.rows ?? [];

  const dem = useMemo(() => demTheoNhomViPham(vRows), [vRows]);
  const preparing = mRows.filter((m) => m.status === 'preparing').length;
  const lastWarning = ['warning_3', 'warning_2', 'warning_1'].find((k) => mRows.some((m) => m.kind === k && m.status === 'done'));

  const timeline = useMemo(() => {
    type Row = { key: string; date: string; kind: 'vp' | 'pa'; v?: ViolationView; m?: MeasureDetail };
    const rows: Row[] = [
      ...vRows.map((v): Row => ({ key: `v${v.id}`, date: v.occurredOn, kind: 'vp', v })),
      ...mRows.map((m): Row => ({ key: `m${m.id}`, date: m.performedOn ?? m.createdAt.slice(0, 10), kind: 'pa', m })),
    ];
    return rows
      /* J7: lọc nhóm — dòng phương án vẫn hiện khi nó chứa ít nhất một vi phạm của nhóm đang lọc. */
      .filter((r) => !category || (r.v ? r.v.category === category : (r.m?.violations ?? []).some((v) => v.category === category)))
      .filter((r) => !cutoff || r.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [vRows, mRows, category, cutoff]);

  const toggle = (id: number) => setTicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const muc: DongThoiGianMuc[] = timeline.map((r) => {
    if (r.v) {
      const v = r.v;
      return {
        key: r.key, ngay: v.occurredOn,
        chon: canManageDiscipline && v.state === 'unhandled'
          ? { checked: ticked.has(v.id), onChange: () => toggle(v.id), nhanDoc: `Chọn vi phạm ${fmtDate(v.occurredOn)}` }
          : null,
        cot2: v.ageLabel ? <Alert tone="danger">Vi phạm</Alert> : <Status kind="doing">Vi phạm</Status>,
        tieuDe: v.description,
        dongPhu: [v.categoryLabel, v.skillLabel, v.reportedByName, v.state !== 'unhandled' ? v.stateLabel : null,
          v.ageLabel ? `⚠ đã ${v.ageDays} ngày` : null].filter(Boolean).join(' · '),
        cuoi: canEditViolation(v)
          ? <button type="button" className="btn btn-sm" onClick={() => setEditViolation(v)}>Sửa</button>
          : undefined,
      };
    }
    const m = r.m!;
    const dangChuanBi = m.status === 'preparing';
    return {
      key: r.key, ngay: r.date, chon: null,
      cot2: dangChuanBi ? <Status kind="waiting">Phương án</Status> : <Status kind="done">Phương án</Status>,
      tieuDe: m.kindLabel,
      dongPhu: `${m.statusLabel} · gồm ${m.violationCount} vi phạm`,
      cuoi: dangChuanBi && canManageDiscipline
        ? <button type="button" className="btn btn-sm btn-primary" onClick={() => setConfirmMeasureId(m.id)}>Mở</button>
        : <button type="button" className="btn btn-sm" onClick={() => setXemId(m.id)}>Xem</button>,
    };
  });

  if (violations.error) return <ErrorState message={violations.error.message} onRetry={reload} />;
  if (violations.loading || measures.loading) return <Skeleton rows={4} />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-100 m-0">Ý thức & Phối hợp</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">Lịch sử của riêng học viên này.</p>
        </div>
        {canRecordViolation && (
          <button className="btn btn-sm btn-primary" onClick={() => setReportOpen(true)}>+ Ghi nhận vi phạm</button>
        )}
      </div>

      <HangTab cap="con" ariaLabel="Ý thức & Phối hợp" value={sub} onChange={setSub}
        tabs={[
          { key: 'violations', label: 'Vi phạm & xử lý' },
          { key: 'coordination', label: 'Phối hợp SOS', so: coord.data?.pendingCount ?? 0 },
        ]} />

      {sub === 'violations' ? (
        <>
          {warn.data?.message && <Alert tone="warn">{warn.data.message.replace(/^⚠\s*/, '')}</Alert>}

          {/* A3 — ô số nhỏ: Vi phạm · từng nhóm có số > 0 · PA đang chuẩn bị · Thư cảnh cáo gần nhất. */}
          <div className="flex flex-wrap gap-2">
            <OSoNho nhan="Vi phạm" so={dem.tong} />
            {dem.nhom.map((g) => <OSoNho key={g.category} nhan={g.label} so={g.n} />)}
            {preparing > 0 && <OSoNho nhan="PA đang chuẩn bị" so={preparing} tone="warn" />}
            {lastWarning && <OSoNho nhan="Thư cảnh cáo" so={`lần ${lastWarning.slice(-1)}`} />}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              <button className={`btn btn-sm ${!category ? 'btn-primary' : ''}`} onClick={() => setCategory(null)}>Tất cả</button>
              {VIOLATION_CATEGORIES.map((c) => (
                <button key={c} className={`btn btn-sm ${category === c ? 'btn-primary' : ''}`} onClick={() => setCategory(c)}>
                  {VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {RANGES.map((r) => (
                <button key={r.key} className={`btn btn-sm ${range === r.key ? 'btn-primary' : ''}`} onClick={() => setRange(r.key)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <DongThoiGian coCotChon={canManageDiscipline} muc={muc} rong={<Empty title="Chưa có gì trong khoảng này" />} />

          {canManageDiscipline && ticked.size > 0 && (
            <button className="btn btn-sm btn-primary" onClick={() => setMeasureOpen(true)}>
              Tạo phương án từ {ticked.size} vi phạm
            </button>
          )}
        </>
      ) : (
        <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="luot"
          onGoAcademic={onGoAcademic} onChanged={() => coord.reload()} />
      )}

      <RecordViolationPanel open={reportOpen} onClose={() => setReportOpen(false)}
        studentId={studentId} studentName={studentName} onDone={reload} />
      <RecordViolationPanel open={!!editViolation} onClose={() => setEditViolation(null)}
        studentId={studentId} violation={editViolation} onDone={reload}
        onDelete={(id) => setDeleteId(id)} />
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
      <XemPhuongAnPanel measureId={xemId} onClose={() => setXemId(null)} />
    </div>
  );
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
