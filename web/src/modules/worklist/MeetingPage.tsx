import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, Outcome, SectionNote, Skeleton, Status } from '../../ui/ui.tsx';
import { WeekPicker, usePeriodWindow, resolveWeek } from '../../ui/Filters.tsx';
import { SignalList } from './SignalList.tsx';
import { ManagerTaskList, ManagerTasks } from './ManagerTasks.tsx';
import { fmtDate, unitStatusLabel, unitTone } from '../../lib/format.ts';
import { UNIT_STATUSES } from '@shared/domain/index.ts';

type Board = {
  period: { id: number; code: string; range: string };
  units: {
    unitId: number; unitName: string; unitCode: string; kind: string; branchId: number | null;
    cells: {
      key: string; label: string; hint: string;
      status: string | null; note: string | null;
      reporterName: string | null; reportedOn: string | null;
      worstStatus: string | null; weeksReported: number | null; weeksTotal: number | null;
      taskGroup: string | null;
      tasks: { id: number; code: string; title: string; progress: string; progressLabel: string; due: string | null; overdue: boolean }[];
      history: { status: string | null; note: string | null; at: string; actor: string | null }[];
    }[];
    reported: number; total: number; canEdit: boolean;
  }[];
  totals: { total: number; ok: number; watch: number; problem: number; notReported: number };
  scope: { kind: 'week' | 'month'; month: string | null; weeks: string[]; editable: boolean };
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
  const [periodId, setPeriodId] = useState<number | null>(null);
  /*
   * KỲ TUẦN HAY KỲ THÁNG (mục 14.2). Báo cáo được GHI theo tuần; kỳ tháng là cách đọc lại
   * các tuần của tháng đó và cố ý CHỈ ĐỂ ĐỌC — một nhận định thuộc về tuần người ta viết nó.
   */
  const [byMonth, setByMonth] = useState(false);

  /*
   * MỞ ĐÚNG TUẦN HIỆN TẠI. Cửa sổ tuần trượt theo tuần đang xem nên không cần nạp cả lịch sử.
   *
   * Tuần hiện tại lấy qua cờ `isAnchor` máy chủ trả về (neo mặc định vào hôm nay khi chưa có
   * `periodId`) — KHÔNG fallback về `window.data[0]` (phần tử đầu, tức tuần TƯƠNG LAI nhất của
   * cửa sổ): đó đúng là kiểu lỗi sổ §13.8 cấm, tuần rơi khỏi cửa sổ thì nhảy sang tuần khác
   * thay vì báo lỗi rõ ràng. Tuần hiện tại có thể chưa có hàng (`id: null`) nên phải resolve.
   */
  const window = usePeriodWindow(periodId);
  useEffect(() => {
    if (periodId !== null || !window.data?.length) return;
    const cur = window.data.find((p) => p.isAnchor);
    if (!cur) return;
    if (cur.id !== null) { setPeriodId(cur.id); return; }
    let cancelled = false;
    void resolveWeek(cur.weekStart).then((r) => { if (!cancelled) setPeriodId(r.id); });
    return () => { cancelled = true; };
  }, [window.data, periodId]);

  const week = window.data?.find((p) => p.id === periodId) ?? null;
  const month = (() => {
    if (!byMonth || !week) return null;
    /* Tuần thuộc về tháng chứa ngày thứ Năm của nó — cùng quy ước với cả hệ thống. */
    const thu = new Date(Date.parse(`${week.weekStart}T00:00:00Z`) + 3 * 86_400_000);
    return `${thu.getUTCFullYear()}-${String(thu.getUTCMonth() + 1).padStart(2, '0')}`;
  })();
  const board = useApi<Board>(
    periodId ? `/meeting/board?periodId=${periodId}${month ? `&month=${month}` : ''}` : null,
    [periodId, month],
  );

  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <WeekPicker periodId={periodId} onPeriod={setPeriodId}
            label={byMonth ? 'Tuần bất kỳ trong tháng' : 'Tuần báo cáo'} className="w-52" />
          <label className="block">
            <span className="label">Kỳ</span>
            <select className="field w-28" value={byMonth ? 'month' : 'week'}
              onChange={(e) => setByMonth(e.target.value === 'month')}>
              <option value="week">Tuần</option>
              <option value="month">Tháng</option>
            </select>
          </label>
          {/* Bảng số liệu theo tuần: cùng dữ liệu, khác lát cắt — nhiều tuần cạnh nhau. */}
          <Link className="btn no-underline" to="/tong-hop-tuan">Tổng hợp theo tuần</Link>
        </div>
        <ManagerTasks periodId={periodId} />
      </div>

      <ManagerTaskList periodId={periodId} />

      {board.data?.scope.kind === 'month' && (
        <SectionNote>
          Đang đọc <strong>cả tháng {board.data.scope.month}</strong> ({board.data.scope.weeks.join(' · ')}).
          Ô hiện <strong>lần báo cáo gần nhất</strong> của tháng, kèm tình trạng nặng nhất đã xuất
          hiện — một tuần “Có vấn đề” rồi ba tuần “Ổn” không phải là một tháng ổn. Muốn sửa thì
          chuyển về kỳ tuần, vì nhận định thuộc về tuần người ta viết nó.
        </SectionNote>
      )}

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
            <Outcome key={c.key} tone={unitTone(c.status)}>
              {c.label}: {unitStatusLabel(c.status)}
              {/* Kỳ tháng: tình trạng nặng nhất trong tháng, nếu nó nặng hơn lần gần nhất. */}
              {c.worstStatus && c.worstStatus !== c.status && ` (từng ${unitStatusLabel(c.worstStatus).toLowerCase()})`}
              {c.weeksTotal ? ` · ${c.weeksReported}/${c.weeksTotal} tuần` : ''}
            </Outcome>
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
        onChange={(e) => setNote(e.target.value)}
        placeholder="Bằng chứng cụ thể: chuyện gì, ở lớp nào, buổi nào" />
      <div className="flex items-center justify-between gap-2">
        {/* NGƯỜI VÀ NGÀY BÁO CÁO đứng cạnh nội dung — đọc một nhận định mà không biết ai viết,
            viết khi nào thì không dùng để họp được (mục 14.2). */}
        <span className="text-[11px] text-slate-500">
          {cell.reporterName
            ? <>Người báo cáo: {cell.reporterName}{cell.reportedOn ? ` · ${fmtDate(cell.reportedOn)}` : ''}</>
            : 'Chưa có người báo cáo'}
        </span>
        {canEdit && <button className="btn btn-sm btn-primary" disabled={!dirty || busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu'}</button>}
      </div>

      {/*
        CÔNG VIỆC LIÊN QUAN, với TRẠNG THÁI HIỆN TẠI (mục 14.2).
        Một việc sống xuyên nhiều kỳ, nên đây là chỗ để nối vào việc ĐANG CÓ chứ không phải
        chỗ đẻ ra một việc mới mỗi tuần.
      */}
      {cell.tasks.length > 0 && (
        <div className="pt-1.5 border-t" style={{ borderColor: 'var(--line)' }}>
          <span className="block text-[11px] text-slate-500 mb-1">Công việc liên quan (trạng thái hiện tại)</span>
          <ul className="list-none p-0 m-0 space-y-0.5">
            {cell.tasks.map((t) => (
              <li key={t.id} className="text-[11px]">
                <Link className="text-slate-300 no-underline hover:underline"
                  to={`/tien-do-cong-viec?open=${t.id}`}>{t.title}</Link>
                <span className={t.overdue ? 'text-rose-300' : 'text-slate-500'}>
                  {' · '}{t.progressLabel}{t.due ? ` · hạn ${fmtDate(t.due)}` : ''}{t.overdue ? ' · quá hạn' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {cell.taskGroup && (
        <Link className="btn btn-sm no-underline"
          to={`/tien-do-cong-viec?tao=1&nhom=${cell.taskGroup}`}>
          + Tạo việc từ mục này
        </Link>
      )}

      {/* LỊCH SỬ CHỈNH SỬA — ô đổi từ "Có vấn đề" sang "Ổn" trước giờ họp phải truy lại được. */}
      {cell.history.length > 1 && (
        <details>
          <summary className="text-[11px] text-slate-500 cursor-pointer">
            Lịch sử chỉnh sửa ({cell.history.length} lần)
          </summary>
          <ul className="list-none p-0 m-0 mt-1 space-y-0.5">
            {cell.history.map((h, i) => (
              <li key={i} className="text-[11px] text-slate-500">
                {fmtDate(h.at.slice(0, 10))} · {unitStatusLabel(h.status)}
                {h.actor ? ` · ${h.actor}` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

