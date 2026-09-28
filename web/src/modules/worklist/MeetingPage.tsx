import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, Info, NutChon, Outcome, Skeleton, Status, Th } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { WeekPicker, usePeriodWindow, resolveWeek } from '../../ui/Filters.tsx';
import { SignalList } from './SignalList.tsx';
import { ManagerTaskList, ManagerTasks } from './ManagerTasks.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { fmtDate, fmtDateTime, fmtThu, unitStatusLabel, unitTone } from '../../lib/format.ts';
import { UNIT_STATUSES } from '@shared/domain/index.ts';

type LinkedTask = { id: number; code: string; title: string; progress: string; progressLabel: string; due: string | null; overdue: boolean };
type TrangThaiO = { ma: 'da-nop' | 'nhap' | 'chua'; nhan: string; phu: string | null };
type Cell = {
  key: string; label: string; hint: string;
  status: string | null; note: string | null;
  reporterName: string | null; updatedAt: string | null; reportedOn: string | null; reportId: number | null;
  trangThai: TrangThaiO; submittedAt: string | null; submittedBy: string | null;
  taskGroup: string | null; linkedTasks: LinkedTask[]; evidenceCount: number;
  worstStatus: string | null; weeksReported: number | null; weeksTotal: number | null;
  history: { status: string | null; note: string | null; at: string; actor: string | null; kind: string | null }[];
};
type Unit = {
  unitId: number; unitName: string; unitCode: string; kind: string; branchId: number | null;
  cells: Cell[]; reported: number; total: number; trangThai: TrangThaiO; canEdit: boolean;
};
type Board = {
  period: { id: number; code: string; range: string };
  units: Unit[];
  totals: { total: number; ok: number; watch: number; problem: number; notReported: number; daNop: number; nhap: number; chua: number };
  scope: { kind: 'week' | 'month'; month: string | null; weeks: string[]; editable: boolean };
  /** Báo cáo tuần chỉ được cập nhật trong hai ngày cuối tuần đó. Máy chủ mới là nơi chặn thật. */
  editWindow: { open: boolean; reason: string | null; opensOn: string; closesOn: string; locked: boolean; unlocked: boolean } | null;
};

const COT_GIUA: { key: string; label: string }[] = [
  { key: 'teachers', label: 'Giáo viên' }, { key: 'students', label: 'Học viên / Phụ huynh' }, { key: 'curriculum', label: 'Giáo trình' },
];
const TUTOR_LABEL_NGAN: Record<string, string> = { tutor_count: 'Số lượng', tutor_quality: 'Chất lượng', tutor_other: 'Khác' };

/**
 * Thân màn Báo cáo đơn vị — Công việc › Báo cáo đơn vị (`/cong-viec/bao-cao`, PR-Ra phương án A).
 *
 * Thứ tự (§7.3): hàng chọn tuần/kỳ → dòng cửa sổ nộp → hàng số Đã nộp · Nháp · Chưa báo cáo
 * (bấm lọc hàng đơn vị) → MA TRẬN lên đầu → hai khối thu gọn (Việc đã giao, Việc đang tồn).
 */
export function MeetingBoard() {
  const [params, setParams] = useSearchParams();
  const [periodId, setPeriodIdState] = useState<number | null>(params.get('periodId') ? Number(params.get('periodId')) : null);
  const setPeriodId = (id: number | null) => {
    setPeriodIdState(id);
    const next = new URLSearchParams(params);
    if (id) next.set('periodId', String(id)); else next.delete('periodId');
    setParams(next, { replace: true });
  };
  const [byMonth, setByMonth] = useState(false);
  const [locTrangThai, setLocTrangThai] = useState<TrangThaiO['ma'] | null>(null);
  const [ganhoi, setGanHoi] = useState<{ unit: Unit; cell: Cell } | null>(null);

  /* Không có ?periodId= → neo vào tuần hiện tại như cũ (nợ PR-O: có thì giữ đúng tuần đó). */
  const window = usePeriodWindow(periodId);
  useEffect(() => {
    if (periodId !== null || !window.data?.length) return;
    const cur = window.data.find((p) => p.isAnchor);
    if (!cur) return;
    if (cur.id !== null) { setPeriodId(cur.id); return; }
    let cancelled = false;
    void resolveWeek(cur.weekStart).then((r) => { if (!cancelled) setPeriodId(r.id); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.data, periodId]);

  const week = window.data?.find((p) => p.id === periodId) ?? null;
  const month = (() => {
    if (!byMonth || !week) return null;
    const thu = new Date(Date.parse(`${week.weekStart}T00:00:00Z`) + 3 * 86_400_000);
    return `${thu.getUTCFullYear()}-${String(thu.getUTCMonth() + 1).padStart(2, '0')}`;
  })();
  const board = useApi<Board>(
    periodId ? `/meeting/board?periodId=${periodId}${month ? `&month=${month}` : ''}` : null,
    [periodId, month],
  );
  /*
   * Panel phải đang mở một ô thì `board.reload()` (sau Lưu nháp/Nộp) nạp dữ liệu MỚI, nhưng
   * `ganhoi.cell` vẫn là bản CŨ chụp lúc bấm mở — không đồng bộ lại thì panel cứ hiện "chưa có
   * báo cáo" dù vừa lưu xong (thiếu "Nối với việc"/"Bằng chứng"). Đồng bộ theo khoá `key`.
   */
  useEffect(() => {
    if (!ganhoi || !board.data) return;
    const u = board.data.units.find((x) => x.unitId === ganhoi.unit.unitId);
    const c = u?.cells.find((x) => x.key === ganhoi.cell.key);
    if (u && c && (u !== ganhoi.unit || c !== ganhoi.cell)) setGanHoi({ unit: u, cell: c });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.data]);
  /*
   * Rules of Hooks: hai đếm này PHẢI gọi vô điều kiện ở đây, không gọi trong JSX bên dưới
   * `{board.data && (...)}` — gọi trong đó thì tải xong dữ liệu là đổi SỐ hook giữa hai lần
   * render, React ném "Rendered more hooks than during the previous render".
   */
  const soVanDaGiao = useManagerTaskCount(periodId);
  const soTinHieuDangTon = useSignalCount(periodId);

  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;

  const units = board.data?.units ?? [];
  const unitsLoc = locTrangThai ? units.filter((u) => u.trangThai.ma === locTrangThai) : units;
  const ew = board.data?.editWindow ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <WeekPicker periodId={periodId} onPeriod={setPeriodId} label={byMonth ? 'Tuần bất kỳ trong tháng' : 'Tuần báo cáo'} />
        <label className="block">
          <span className="label">Kỳ</span>
          <select className="field w-28" value={byMonth ? 'month' : 'week'} onChange={(e) => setByMonth(e.target.value === 'month')}>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
          </select>
        </label>
        <ManagerTasks periodId={periodId} />
      </div>

      {/* Cửa sổ nộp — hoặc dòng phụ cho biết đang đọc cả tháng. */}
      {board.data?.scope.kind === 'month' ? (
        <p className="text-xs text-slate-500 m-0">
          Đang đọc cả tháng <strong>{board.data.scope.month}</strong> ({board.data.scope.weeks.join(' · ')}) — chỉ để đọc, ô hiện lần báo cáo gần nhất kèm tình trạng nặng nhất đã xuất hiện.
        </p>
      ) : ew && (
        /*
         * BA TRẠNG THÁI khác nhau, không phải hai: "chưa mở" (tuần chưa tới hai ngày cuối, hoặc
         * chưa bắt đầu) và "đã khoá" (quá hạn bù, cần Quản trị hệ thống) đều có `open === false`
         * nhưng khác hẳn về mức độ — gộp chung một câu đỏ "Đã khoá" cho cả "chưa mở" là báo động
         * giả. Phân biệt bằng `ew.locked` (chỉ true ở ca thật sự khoá — xem `reportEditWindow`).
         */
        <p className="text-xs m-0" style={{ color: ew.open || !ew.locked ? 'var(--text-muted, #94a3b8)' : 'rgb(252 165 165)' }}>
          {ew.open
            ? (ew.locked
                ? 'Đã khoá nhưng Quản trị hệ thống đã mở lại để bổ sung.'
                : `Nộp từ ${fmtThu(ew.opensOn)} ${fmtDate(ew.opensOn)} đến hết ${fmtThu(ew.closesOn)} ${fmtDate(ew.closesOn)}.`)
            : ew.locked
              ? <>Đã khoá · chỉ Quản trị hệ thống mở lại được. {ew.reason}</>
              : `Chưa mở — mở từ ${fmtThu(ew.opensOn)} ${fmtDate(ew.opensOn)}.`}
        </p>
      )}

      {board.loading && <Skeleton rows={6} />}

      {board.data && (
        <>
          {/* Hàng số — bấm lọc hàng đơn vị (G-10). */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {([['da-nop', 'Đã nộp', board.data.totals.daNop], ['nhap', 'Nháp', board.data.totals.nhap], ['chua', 'Chưa báo cáo', board.data.totals.chua]] as const).map(([ma, nhan, n]) => {
              const active = locTrangThai === ma;
              return (
                <button key={ma} type="button" disabled={n === 0 && !active}
                  className={`flex items-baseline gap-1 appearance-none bg-transparent border-0 p-0 ${n === 0 && !active ? 'opacity-40 cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                  onClick={() => setLocTrangThai(active ? null : ma)}>
                  <strong className={`tabular-nums text-sm ${active ? 'text-sky-300' : 'text-slate-100'}`}>{n}</strong>
                  <span className={active ? 'text-sky-300' : 'text-slate-400'}>{nhan}</span>
                  {active && <span className="text-sky-300" aria-hidden>✕</span>}
                </button>
              );
            })}
          </div>

          {/* ── ma trận: đơn vị × hạng mục, lên đầu trang (§7.3) ── */}
          <Card title="Tình hình đơn vị" bodyClass="p-0">
            {unitsLoc.length === 0 ? (
              <div className="p-4"><Empty title="Bạn không có đơn vị nào khớp bộ lọc" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '46rem' }}>
                  <colgroup>
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '20%' }} /><col style={{ width: '20%' }} /><col style={{ width: '20%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <Th>Đơn vị</Th>
                      {COT_GIUA.map((c) => <Th key={c.key}>{c.label}</Th>)}
                      <Th>Trạng thái</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitsLoc.map((u) => (
                      <tr key={u.unitId} className="border-t" style={{ borderColor: 'var(--line)' }}>
                        <td className="td text-slate-100 font-medium">{u.unitName}</td>
                        {u.cells.map((c, i) => (
                          <td key={c.key} className="td cursor-pointer hover:bg-white/5" onClick={() => setGanHoi({ unit: u, cell: c })}>
                            <OTaBang cell={c} thTutor={u.kind !== 'branch' ? (TUTOR_LABEL_NGAN[c.key] ?? c.label) : undefined} />
                          </td>
                        ))}
                        {u.cells.length < COT_GIUA.length && Array.from({ length: COT_GIUA.length - u.cells.length }).map((_, i) => <td key={`pad-${i}`} className="td text-slate-600">—</td>)}
                        <td className="td">
                          <Status kind={u.trangThai.ma === 'da-nop' ? 'done' : u.trangThai.ma === 'nhap' ? 'waiting' : 'idle'}>{u.trangThai.nhan}</Status>
                          {u.trangThai.phu && <div className="text-[11px] text-slate-500 mt-0.5">{u.trangThai.phu}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ── hai khối thu gọn (Q16) — luôn có số ── */}
          <details>
            <summary className="cursor-pointer text-sm text-slate-300 py-1">Việc đã giao ({soVanDaGiao})</summary>
            <div className="pt-2"><ManagerTaskList periodId={periodId} /></div>
          </details>
          <details>
            <summary className="cursor-pointer text-sm text-slate-300 py-1">Việc đang tồn ({soTinHieuDangTon})</summary>
            <div className="pt-2"><SignalList periodId={periodId} /></div>
          </details>

          <NganBaoCao unit={ganhoi?.unit ?? null} cell={ganhoi?.cell ?? null} periodId={periodId}
            editable={board.data.scope.editable} editWindow={ew}
            onClose={() => setGanHoi(null)} onSaved={board.reload} />
        </>
      )}
    </div>
  );
}

/** Số việc đã giao trong tuần — chỉ để hiện cạnh "Việc đã giao" khi khối đang gập. */
function useManagerTaskCount(periodId: number | null): number {
  const { data } = useApi<{ rows: unknown[] }>(periodId ? `/tasks?periodId=${periodId}` : null, [periodId]);
  return data?.rows.length ?? 0;
}
/** Số nhóm tín hiệu — chỉ để hiện cạnh "Việc đang tồn" khi khối đang gập. */
function useSignalCount(periodId: number | null): number {
  const { data } = useApi<unknown[]>(periodId ? `/signals?periodId=${periodId}` : null, [periodId]);
  return data?.length ?? 0;
}

/** Một ô của ma trận — mức + (nháp) + kỳ tháng "(từng …)". */
function OTaBang({ cell, thTutor }: { cell: Cell; thTutor?: string }) {
  if (!cell.status) return <span className="text-slate-600">—</span>;
  const nhat = cell.trangThai.ma === 'nhap';
  return (
    <span className={nhat ? 'opacity-70' : ''}>
      {thTutor && <span className="text-slate-500">{thTutor}: </span>}
      <Outcome tone={unitTone(cell.status)}>{unitStatusLabel(cell.status)}</Outcome>
      {nhat && <span className="text-[11px] text-slate-500 ml-1">nháp</span>}
      {cell.worstStatus && cell.worstStatus !== cell.status && (
        <span className="text-[11px] text-slate-500"> (từng {unitStatusLabel(cell.worstStatus).toLowerCase()})</span>
      )}
      {cell.weeksTotal ? <span className="text-[11px] text-slate-500"> · {cell.weeksReported}/{cell.weeksTotal} tuần</span> : ''}
    </span>
  );
}

/** Panel phải — mở đúng MỘT ô báo cáo. Mở ô khác thì THAY nội dung, không chồng (G-8). */
function NganBaoCao({ unit, cell, periodId, editable, editWindow, onClose, onSaved }: {
  unit: Unit | null; cell: Cell | null; periodId: number | null;
  editable: boolean; editWindow: Board['editWindow'];
  onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'nhap' | 'nop' | null>(null);
  const [chonMo, setChonMo] = useState(false);

  useEffect(() => {
    setStatus(cell?.status ?? '');
    setNote(cell?.note ?? '');
    setChonMo(false);
  }, [cell?.key, unit?.unitId]);

  const daNop = cell?.trangThai.ma === 'da-nop';
  /* Khớp đúng luật chặn của máy chủ (`saveUnitReport`: `before?.submitted_at && !window.open` → 400) —
     ô đã nộp mà tuần đã khoá thì Lưu nháp cũng bị chặn, không riêng gì Nộp. */
  const nhapBiChan = daNop && !(editWindow?.open ?? true);
  const chiDoc = !editable || !(unit?.canEdit ?? false);
  const key = cell?.key ?? null;

  const luu = async (nop: boolean) => {
    if (!unit || !cell || !periodId) return;
    setBusy(nop ? 'nop' : 'nhap');
    try {
      await api.put(`/meeting/units/${unit.unitId}/reports/${cell.key}`, { periodId, status: status || null, note, nop });
      invalidate('/meeting'); invalidate('/overview'); invalidate('/signals');
      onSaved();
      toast.push('ok', nop ? 'Đã nộp' : 'Đã lưu nháp');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(null); }
  };

  if (!unit || !cell) return null;
  return (
    <KhungPanel tieuDe={`${unit.unitName} · ${cell.label}`} onDong={onClose}
      ngCanh={cell.submittedAt ? `đã nộp ${fmtDateTime(cell.submittedAt)}${cell.submittedBy ? ` · ${cell.submittedBy}` : ''}`
        : cell.updatedAt ? `nháp lưu ${fmtDateTime(cell.updatedAt)}` : undefined}>
        <div className="space-y-4 pt-3">
          {chiDoc && <Info>Chỉ đọc — {editable ? 'bạn không có quyền sửa đơn vị này' : 'kỳ tháng chỉ để đọc'}.</Info>}

          <div className="flex gap-1.5">
            {UNIT_STATUSES.map((s) => (
              <NutChon key={s} nho disabled={chiDoc} chon={status === s} onClick={() => setStatus(s)}>
                {unitStatusLabel(s)}
              </NutChon>
            ))}
          </div>
          <textarea className="field" rows={4} disabled={chiDoc} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Bằng chứng cụ thể: chuyện gì, ở lớp nào, buổi nào" />

          {/* ── Nối với việc (R6) ── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-1.5">Nối với việc:</h3>
            <div className="flex flex-wrap gap-1.5">
              {cell.linkedTasks.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1 surface-2 rounded-full px-2 py-1 text-xs">
                  <button type="button" className="appearance-none bg-transparent border-0 p-0 text-slate-200 hover:underline cursor-pointer"
                    onClick={() => navigate(`/cong-viec/van-hanh?open=${t.id}`)}>
                    {t.title} · {t.progressLabel}{t.due ? ` · ${fmtDate(t.due)}` : ''}
                  </button>
                  {!chiDoc && cell.reportId && (
                    <button type="button" className="text-slate-500 hover:text-slate-200" aria-label={`Gỡ "${t.title}"`}
                      onClick={async () => {
                        await api.del(`/meeting/reports/${cell.reportId}/tasks/${t.id}`);
                        invalidate('/meeting'); onSaved();
                      }}>✕</button>
                  )}
                </span>
              ))}
              {!chiDoc && cell.reportId && (
                <button type="button" className="btn btn-sm" onClick={() => setChonMo((o) => !o)}>+ Chọn việc</button>
              )}
            </div>
            {chonMo && cell.reportId && (
              <ChonViec branchId={unit.branchId} reportId={cell.reportId} taskGroup={cell.taskGroup} periodId={periodId}
                onLinked={() => { setChonMo(false); invalidate('/meeting'); onSaved(); }}
                onCreateNew={() => navigate(`/cong-viec/van-hanh?tao=1&nhom=${cell.taskGroup ?? ''}&baoCao=${cell.reportId}&periodId=${periodId}`)} />
            )}
          </section>

          {/* ── Bằng chứng ── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-1.5">Bằng chứng</h3>
            {cell.reportId ? (
              <BangChung ownerType="unit_report" ownerId={cell.reportId} canEdit={!chiDoc} tieuDe="" />
            ) : (
              <p className="text-xs text-slate-500 m-0">Lưu nháp để đính kèm bằng chứng.</p>
            )}
          </section>

          {cell.history.length > 0 && (
            <details>
              <summary className="text-[11px] text-slate-500 cursor-pointer">Lịch sử chỉnh sửa ({cell.history.length})</summary>
              <ul className="list-none p-0 m-0 mt-1 space-y-0.5">
                {cell.history.map((h, i) => (
                  <li key={i} className="text-[11px] text-slate-500">
                    {fmtDate(h.at.slice(0, 10))} · {unitStatusLabel(h.status)}{h.kind ? ` · ${h.kind === 'nop' ? 'nộp' : 'nháp'}` : ''}
                    {h.actor ? ` · ${h.actor}` : ''}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {!chiDoc && (
            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <button className="btn btn-sm" disabled={busy !== null || nhapBiChan}
                title={nhapBiChan ? 'Báo cáo này đã nộp và tuần đã khoá — chỉ Quản trị hệ thống mở lại được.' : undefined}
                onClick={() => luu(false)}>
                {busy === 'nhap' ? 'Đang lưu…' : 'Lưu nháp'}
              </button>
              <button className="btn btn-primary btn-sm" disabled={busy !== null || !status || !(editWindow?.open ?? true)} onClick={() => luu(true)}>
                {busy === 'nop' ? 'Đang nộp…' : daNop ? 'Nộp lại' : 'Nộp'}
              </button>
              {!(editWindow?.open ?? true) && <span className="text-[11px] text-slate-500">Cửa sổ nộp đã đóng — vẫn lưu nháp được.</span>}
              {(editWindow?.open ?? true) && !status && <span className="text-[11px] text-slate-500">Chọn mức trước khi nộp.</span>}
            </div>
          )}
        </div>
      {/* để tsc khỏi kêu unused khi key đổi giữa các lần mở — theo dõi qua effect ở trên. */}
      <span className="hidden" aria-hidden>{key}</span>
    </KhungPanel>
  );
}

type MoViecRow = { id: number; title: string; progressLabel: string; due: string | null; group: string | null };

/** "+ Chọn việc": việc Vận hành CHƯA KHÉP của chi nhánh đơn vị — việc cùng nhóm lên đầu (Q14). */
function ChonViec({ branchId, reportId, taskGroup, periodId, onLinked, onCreateNew }: {
  branchId: number | null; reportId: number; taskGroup: string | null; periodId: number | null;
  onLinked: () => void; onCreateNew: () => void;
}) {
  const toast = useToast();
  const qs = new URLSearchParams({ progress: 'mo' });
  if (branchId) qs.set('branchId', String(branchId));
  const { data, loading } = useApi<{ rows: MoViecRow[] }>(`/mgmt-tasks?${qs}`, [branchId]);
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const list = (data?.rows ?? []).filter((r) => !q.trim() || r.title.toLowerCase().includes(q.trim().toLowerCase()));
    return [...list].sort((a, b) => (a.group === taskGroup ? -1 : 0) - (b.group === taskGroup ? -1 : 0));
  }, [data, q, taskGroup]);

  const noi = async (taskId: number) => {
    try {
      await api.post(`/meeting/reports/${reportId}/tasks`, { taskId });
      onLinked();
    } catch (e: any) { toast.push('error', e.message); }
  };

  return (
    <div className="mt-2 surface-2 rounded-lg border p-2 space-y-1.5" style={{ borderColor: 'var(--line-strong)' }}>
      <input className="field" placeholder="Gõ tên việc…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {loading && <Skeleton rows={2} />}
      <ul className="list-none p-0 m-0 max-h-48 overflow-y-auto space-y-0.5">
        {rows.map((r) => (
          <li key={r.id}>
            <button type="button" className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 appearance-none bg-transparent border-0 text-xs text-slate-200"
              onClick={() => noi(r.id)}>
              {r.title} <span className="text-slate-500">· {r.progressLabel}{r.due ? ` · ${fmtDate(r.due)}` : ''}</span>
            </button>
          </li>
        ))}
        {!loading && rows.length === 0 && <li className="text-xs text-slate-500 px-2 py-1.5">Không có việc nào khớp.</li>}
      </ul>
      <button type="button" className="btn btn-sm w-full" onClick={onCreateNew}>+ Tạo việc từ mục này</button>
      <span className="hidden" aria-hidden>{periodId}</span>
    </div>
  );
}
