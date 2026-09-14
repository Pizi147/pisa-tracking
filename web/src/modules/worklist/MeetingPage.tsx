import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, Outcome, SectionNote, Skeleton, Status } from '../../ui/ui.tsx';
import { WeekPicker, usePeriodWindow } from '../../ui/Filters.tsx';
import { SignalList } from './SignalList.tsx';
import { ManagerTaskList, ManagerTasks } from './ManagerTasks.tsx';
import { unitStatusLabel, unitTone } from '../../lib/format.ts';
import { UNIT_STATUSES } from '@shared/domain/index.ts';

type Board = {
  period: { id: number; code: string; range: string };
  units: {
    unitId: number; unitName: string; unitCode: string; kind: string; branchId: number | null;
    cells: { key: string; label: string; hint: string; status: string | null; note: string | null; reporterName: string | null }[];
    reported: number; total: number; canEdit: boolean;
  }[];
  totals: { total: number; ok: number; watch: number; problem: number; notReported: number };
  /** Báo cáo tuần chỉ được cập nhật trong hai ngày cuối tuần đó. Máy chủ mới là nơi chặn thật. */
  editWindow: { open: boolean; reason: string | null; opensOn: string } | null;
};

export default function MeetingPage() {
  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 m-0">Báo cáo tuần chi nhánh</h1>
        <p className="text-xs text-slate-500 mt-0.5 mb-0">
          Hệ thống tổng hợp dữ liệu, quản lý bổ sung nhận định — thay cho việc chép lại số liệu vào workbook.
        </p>
      </div>
      <MeetingBoard />
    </div>
  );
}

/**
 * Thân màn Báo cáo tuần, dùng CHUNG cho trang riêng `/tien-trinh` và cho tab thứ ba của
 * Tổng quan. Một bản cài đặt, một cách đọc số — hai màn hình không bao giờ lệch nhau.
 */
export function MeetingBoard() {
  const { session } = useSession();
  const [periodId, setPeriodId] = useState<number | null>(null);

  // Mở đúng tuần hiện tại. Cửa sổ tuần trượt theo tuần đang xem nên không cần nạp cả lịch sử.
  const window = usePeriodWindow(periodId);
  useEffect(() => {
    if (periodId === null && window.data?.length) {
      const cur = window.data.find((p) => p.weekStart <= session!.demoDate && p.weekEnd >= session!.demoDate);
      setPeriodId(cur?.id ?? window.data[0].id);
    }
  }, [window.data, periodId, session]);

  const board = useApi<Board>(periodId ? `/meeting/board?periodId=${periodId}` : null);

  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <WeekPicker periodId={periodId} onPeriod={setPeriodId} label="Tuần báo cáo" className="w-52" />
          {/* Bảng số liệu theo tuần: cùng dữ liệu, khác lát cắt — nhiều tuần cạnh nhau. */}
          <Link className="btn no-underline" to="/tong-hop-tuan">Tổng hợp theo tuần</Link>
        </div>
        <ManagerTasks periodId={periodId} />
      </div>

      <ManagerTaskList periodId={periodId} />

      {/* Báo cáo tuần chỉ mở trong hai ngày cuối tuần — nói rõ vì sao, không chỉ làm mờ ô nhập. */}
      {board.data?.editWindow && !board.data.editWindow.open && (
        <SectionNote>
          <strong>Chưa/không còn cập nhật được báo cáo tuần này.</strong> {board.data.editWindow.reason}
        </SectionNote>
      )}

      {/* Hệ thống tổng hợp dữ kiện trước; nhận định của quản lý nằm ở phần dưới. */}
      <SignalList periodId={periodId} />

      {board.loading && <Skeleton rows={6} />}

      {board.data && (
        <Card
          title="Tình hình đơn vị"
          action={
            <span className="text-xs text-slate-400 flex flex-wrap gap-2">
              <Status kind="idle">Chưa báo cáo {board.data.totals.notReported}</Status>
              <Outcome tone="ok" mark="✓">Ổn {board.data.totals.ok}</Outcome>
              <Outcome tone="warn" mark="–">Cần theo dõi {board.data.totals.watch}</Outcome>
              <Outcome tone="danger" mark="↓">Có vấn đề {board.data.totals.problem}</Outcome>
              <span className="text-slate-500">trên {board.data.totals.total} mục</span>
            </span>
          }
          bodyClass="p-0"
        >
          {board.data.units.length === 0 ? (
            <Empty title="Bạn không có đơn vị nào trong phạm vi được cấp" />
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {board.data.units.map((u) => (
                <UnitRow
                  key={u.unitId} unit={u} periodId={periodId!}
                  windowOpen={board.data!.editWindow?.open ?? true} onSaved={board.reload}
                />
              ))}
            </div>
          )}
        </Card>
      )}

    </div>
  );
}

function UnitRow({ unit, periodId, windowOpen, onSaved }: {
  unit: Board['units'][number]; periodId: number; windowOpen: boolean; onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="w-full text-left px-4 py-3 hover:bg-white/5 flex flex-wrap items-center gap-3"
        onClick={() => setOpen((o) => !o)}>
        <span className="font-medium text-slate-100 w-40 shrink-0">{unit.unitName}</span>
        <span className="flex flex-wrap gap-1.5 flex-1">
          {unit.cells.map((c) => (
            <Outcome key={c.key} tone={unitTone(c.status)}>{c.label}: {unitStatusLabel(c.status)}</Outcome>
          ))}
        </span>
        <span className="text-xs text-slate-500 shrink-0">{unit.reported}/{unit.total} đã báo cáo</span>
        <span className="text-slate-500 text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid gap-3 md:grid-cols-3">
          {unit.cells.map((c) => (
            <CellEditor
              key={c.key} unitId={unit.unitId} periodId={periodId} cell={c}
              canEdit={unit.canEdit && windowOpen} onSaved={onSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CellEditor({ unitId, periodId, cell, canEdit, onSaved }: {
  unitId: number; periodId: number; cell: Board['units'][number]['cells'][number];
  canEdit: boolean; onSaved: () => void;
}) {
  const toast = useToast();
  const [status, setStatus] = useState<string>(cell.status ?? '');
  const [note, setNote] = useState(cell.note ?? '');
  const [busy, setBusy] = useState(false);
  const dirty = status !== (cell.status ?? '') || note !== (cell.note ?? '');

  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/meeting/units/${unitId}/reports/${cell.key}`, { periodId, status: status || null, note });
      invalidate('/meeting'); invalidate('/overview');
      onSaved();
      toast.push('ok', `Đã lưu: ${cell.label}`);
    } catch (e: any) {
      toast.push('error', e.message);      // giữ nguyên nội dung đang gõ
    } finally { setBusy(false); }
  };

  return (
    <div className="surface-2 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm text-slate-100">{cell.label}</strong>
        <Outcome tone={unitTone(cell.status)}>{unitStatusLabel(cell.status)}</Outcome>
      </div>
      {cell.hint && <p className="text-[11px] text-slate-500 m-0">{cell.hint}</p>}
      <select className="field" value={status} disabled={!canEdit} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Chưa báo cáo</option>
        {UNIT_STATUSES.map((s) => <option key={s} value={s}>{unitStatusLabel(s)}</option>)}
      </select>
      <textarea className="field" rows={2} value={note} disabled={!canEdit}
        onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú ngắn, có thông tin cụ thể" />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">{cell.reporterName ? `Người báo cáo: ${cell.reporterName}` : 'Chưa có người báo cáo'}</span>
        {canEdit && <button className="btn btn-sm btn-primary" disabled={!dirty || busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu'}</button>}
      </div>
    </div>
  );
}

