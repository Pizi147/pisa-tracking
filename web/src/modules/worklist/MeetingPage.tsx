import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { BoLocDoan, Card, Empty, ErrorState, Info, NutChon, Outcome, Skeleton, Status, Th } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { CHIP_TRON } from '../../ui/Nhan.tsx';
import { WeekPicker, nhoChiNhanh, resolveWeek, useChiNhanhMacDinh, usePeriodWindow } from '../../ui/Filters.tsx';
import { useSession } from '../../lib/session.tsx';
import { SignalList } from './SignalList.tsx';
import { ManagerTaskList } from './ManagerTasks.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { fmtDate, fmtDateTime, fmtThu, unitStatusLabel, unitTone } from '../../lib/format.ts';
import { UNIT_STATUSES, demTrangThaiDonVi, hienONgay, khopChiNhanhBaoCao, locDonViBaoCao, luaChonChiNhanhBaoCao } from '@shared/domain/index.ts';

type LinkedTask = { id: number; code: string; title: string; progress: string; progressLabel: string; due: string | null; overdue: boolean };
type TrangThaiO = { ma: 'da-nop' | 'nhap' | 'chua'; nhan: string; phu: string | null };
type Cell = {
  key: string; label: string; hint: string;
  status: string | null; note: string | null;
  reporterName: string | null; updatedAt: string | null; reportedOn: string | null; reportId: number | null;
  /** Trạng thái MỘT ô — máy chủ trả chuỗi (`trangThaiO`); chỉ hàng đơn vị mới là đối tượng có nhãn (PR-UXF-a sửa: trước đọc `.ma` nên "nháp" không bao giờ hiện). */
  trangThai: TrangThaiO['ma']; submittedAt: string | null; submittedBy: string | null;
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
  const uid = useSession().session?.user?.id;
  const [periodId, setPeriodIdState] = useState<number | null>(params.get('periodId') ? Number(params.get('periodId')) : null);
  const setPeriodId = (id: number | null) => {
    setPeriodIdState(id);
    const next = new URLSearchParams(params);
    if (id) next.set('periodId', String(id)); else next.delete('periodId');
    setParams(next, { replace: true });
  };
  /* PR-BC: kỳ và chi nhánh nhớ trong URL (`ky=thang`, `cn=<id>|tutor`) — tải lại hay gửi link vẫn đúng bộ lọc. */
  const byMonth = params.get('ky') === 'thang';
  const macDinh = useChiNhanhMacDinh();
  const cnUrl = params.get('cn') ?? String(macDinh ?? 'tat-ca');
  const datParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
    if (k === 'cn') setLocTrangThai(null);   // đổi chi nhánh thì bỏ chip trạng thái — tránh bảng rỗng khó hiểu
  };
  const branches = useApi<{ id: number; name: string }[]>('/ref/branches');
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
  const units = board.data?.units ?? [];
  const luaChonCn = luaChonChiNhanhBaoCao(units, branches.data ?? []);
  /* `cn` chỉ có hiệu lực khi là một lựa chọn ĐANG HIỆN: link của Quản trị mở ở tài khoản QL (không có bộ lọc) thì về Tất cả,
     không lọc ngầm. */
  const cn = luaChonCn.some((m) => m.key === cnUrl) ? cnUrl : 'tat-ca';
  const cnBranchId = /^\d+$/.test(cn) ? Number(cn) : null;
  const soVanDaGiao = useManagerTaskCount(periodId, cn);
  const soTinHieuDangTon = useSignalCount(periodId, cnBranchId);

  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;

  /* D9: lọc chi nhánh chỉ THU HẸP tập máy chủ đã cho; ba số đếm theo tập đã lọc chi nhánh, chưa lọc trạng thái. */
  const unitsCn = locDonViBaoCao(units, { chiNhanh: cn, trangThai: null });
  const unitsLoc = locDonViBaoCao(units, { chiNhanh: cn, trangThai: locTrangThai });
  const dem = demTrangThaiDonVi(unitsCn);
  const ew = board.data?.editWindow ?? null;
  /* Đang bật chip trạng thái thì Xoá lọc chỉ bỏ chip đó; không thì bỏ lọc chi nhánh. */
  const xoaLoc = () => { if (locTrangThai) setLocTrangThai(null); else datParam('cn', null); };

  return (
    <div className="space-y-4">
      {/* L2.1: Tuần · Kỳ · link trên một hàng (≥ 640 px), link căn phải; < 640 px các cụm tự xuống dòng.
          Lọc chi nhánh (chỉ ai thấy ≥ 3 lựa chọn — thực tế là Quản trị hệ thống) nằm hàng riêng ngay dưới: 7 nút không vừa chung một hàng. */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="w-full sm:w-[25rem]"><WeekPicker periodId={periodId} onPeriod={setPeriodId} label={null} /></div>
          <span className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Kỳ</span>
            <BoLocDoan ariaLabel="Kỳ báo cáo" value={byMonth ? 'thang' : 'tuan'}
              onChange={(k) => datParam('ky', k === 'thang' ? 'thang' : null)}
              muc={[{ key: 'tuan', nhan: 'Tuần' }, { key: 'thang', nhan: 'Tháng', title: 'Đọc lại cả tháng chứa tuần đang chọn — chỉ để đọc' }]} />
          </span>
          {/* Câu 1 = A (K1-36): MỘT cửa giao việc ở Vận hành — ở đây chỉ còn đường dẫn. */}
          <Link to="/cong-viec/van-hanh?tao=1" className="link text-xs sm:ml-auto">Giao việc ở Vận hành ›</Link>
        </div>
        {luaChonCn.length > 0 && (
          <div className="flex min-w-0 max-w-full items-center gap-1.5">
            <span className="shrink-0 text-xs text-slate-400">Chi nhánh</span>
            {/* Mỗi chi nhánh đúng một đơn vị → bỏ số đếm từng nút (toàn "2" là nhiễu); D9-a: chọn chi nhánh hiện kèm Tutor part-time. */}
            <div className="min-w-0 flex-1"><BoLocDoan ariaLabel="Lọc chi nhánh" value={cn} onChange={(k) => {
              if (k !== 'tutor') nhoChiNhanh(uid, k === 'tat-ca' ? null : Number(k));   // Tutor không phải chi nhánh — không nhớ
              datParam('cn', k === 'tat-ca' ? null : k);
            }}
              muc={luaChonCn.map((m) => ({ key: m.key, nhan: m.nhan,
                title: /^\d+$/.test(m.key) && luaChonCn.some((x) => x.key === 'tutor') ? `${m.nhan} kèm Tutor part-time` : undefined }))} /></div>
          </div>
        )}
      </div>

      {/* Cửa sổ nộp — hoặc dòng phụ cho biết đang đọc cả tháng. */}
      {board.data?.scope.kind === 'month' ? (
        <p className="text-xs text-slate-500 m-0">
          Đang đọc cả tháng <strong>{board.data.scope.month ? hienONgay(board.data.scope.month, 'thang') : ''}</strong> ({board.data.scope.weeks.join(' · ')}) — chỉ để đọc, ô hiện lần báo cáo gần nhất kèm tình trạng nặng nhất đã xuất hiện.
        </p>
      ) : ew && (
        /*
         * BA TRẠNG THÁI khác nhau, không phải hai: "chưa mở" (tuần chưa tới hai ngày cuối, hoặc
         * chưa bắt đầu) và "đã khoá" (quá hạn bù, cần Quản trị hệ thống) đều có `open === false`
         * nhưng khác hẳn về mức độ — gộp chung một câu đỏ "Đã khoá" cho cả "chưa mở" là báo động
         * giả. Phân biệt bằng `ew.locked` (chỉ true ở ca thật sự khoá — xem `reportEditWindow`).
         */
        <p className="text-xs m-0" style={{ color: ew.open || !ew.locked ? 'var(--text-dim)' : 'var(--danger)' }}>
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
          <div className="flex flex-wrap items-center gap-2 text-xs" role="group" aria-label="Lọc theo trạng thái báo cáo">
            {/* PR-UXF-a F4: ba số đếm ĐƠN VỊ (cùng tập chip lọc ra), không đếm ô. L2.2: số 0 vẫn đọc rõ, bấm được (ra bảng rỗng có Xoá lọc). */}
            {([['da-nop', 'đơn vị đã nộp', dem.daNop], ['nhap', 'đơn vị đang nhập', dem.nhap], ['chua', 'đơn vị chưa báo cáo', dem.chua]] as const).map(([ma, nhan, n]) => {
              const active = locTrangThai === ma;
              return (
                <NutChon key={ma} nho chon={active} onClick={() => setLocTrangThai(active ? null : ma)}>
                  <strong className="tabular-nums text-sm text-slate-100">{n}</strong>
                  <span className={active ? 'text-slate-100' : 'text-slate-400'}>{nhan}</span>
                </NutChon>
              );
            })}
          </div>

          {/* ── ma trận: đơn vị × hạng mục, lên đầu trang (§7.3) ── */}
          <Card title="Tình hình đơn vị" bodyClass="p-0">
            {board.data.scope.kind === 'week' && !locTrangThai && unitsCn.length > 0 && unitsCn.every((u) => u.reported === 0) ? (
              /* L2.3: tuần chưa ai báo cáo → một dòng thay hàng chục ô "—"; vẫn giữ đường mở ô báo cáo theo từng đơn vị. */
              <div className="px-4 py-3 space-y-2">
                <p className="m-0 text-sm text-slate-400">
                  Chưa đơn vị nào báo cáo{ew?.opensOn && ew?.closesOn ? ` — nộp từ ${fmtThu(ew.opensOn)} ${fmtDate(ew.opensOn)} đến hết ${fmtThu(ew.closesOn)} ${fmtDate(ew.closesOn)}` : ''}.
                  {' '}Bấm tên đơn vị để mở ô báo cáo.
                </p>
                <div className="flex flex-wrap gap-2">
                  {unitsCn.filter((u) => u.cells.length > 0).map((u) => (
                    <button key={u.unitId} type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setGanHoi({ unit: u, cell: u.cells[0] })}>
                      {u.unitName}
                    </button>
                  ))}
                </div>
              </div>
            ) : unitsLoc.length === 0 ? (
              <div className="p-4">
                <Empty title="Không có đơn vị nào khớp bộ lọc"
                  action={<button type="button" className="btn btn-sm" onClick={xoaLoc}>Xoá lọc</button>} />
              </div>
            ) : (
              <div className="table-scroll bang-dinh">
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
                          {u.trangThai.phu && <div className="text-xs text-slate-500 mt-0.5">{u.trangThai.phu}</div>}
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
            <summary className="cursor-pointer text-sm text-slate-300 py-1">Việc được giao ({soVanDaGiao})</summary>
            <div className="pt-2"><ManagerTaskList periodId={periodId} chiNhanh={cn} /></div>
          </details>
          <details>
            <summary className="cursor-pointer text-sm text-slate-300 py-1">Việc đang tồn · {soTinHieuDangTon} loại việc</summary>
            <div className="pt-2"><SignalList periodId={periodId} branchId={cnBranchId} /></div>
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
function useManagerTaskCount(periodId: number | null, chiNhanh: string): number {
  const { data } = useApi<{ rows: { branchId: number | null }[] }>(periodId ? `/tasks?periodId=${periodId}` : null, [periodId]);
  return (data?.rows ?? []).filter((t) => khopChiNhanhBaoCao(t.branchId ?? null, chiNhanh)).length;
}
/** Số nhóm tín hiệu — chỉ để hiện cạnh "Việc đang tồn" khi khối đang gập. */
function useSignalCount(periodId: number | null, branchId: number | null): number {
  const qs = `periodId=${periodId}${branchId ? `&branchId=${branchId}` : ''}`;
  const { data } = useApi<unknown[]>(periodId ? `/signals?${qs}` : null, [periodId, branchId]);
  return data?.length ?? 0;
}

/** Một ô của ma trận — mức + (nháp) + kỳ tháng "(từng …)". */
function OTaBang({ cell, thTutor }: { cell: Cell; thTutor?: string }) {
  if (!cell.status) return <span className="text-slate-600">—</span>;
  const nhat = cell.trangThai === 'nhap';
  return (
    <span className={nhat ? 'opacity-70' : ''}>
      {thTutor && <span className="text-slate-500">{thTutor}: </span>}
      <Outcome tone={unitTone(cell.status)}>{unitStatusLabel(cell.status)}</Outcome>
      {nhat && <span className="text-xs text-slate-500 ml-1">nháp</span>}
      {cell.worstStatus && cell.worstStatus !== cell.status && (
        <span className="text-xs text-slate-500"> (từng {unitStatusLabel(cell.worstStatus).toLowerCase()})</span>
      )}
      {cell.weeksTotal ? <span className="text-xs text-slate-500"> · đã nộp {cell.weeksReported}/{cell.weeksTotal} tuần</span> : ''}
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

  const daNop = cell?.trangThai === 'da-nop';
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
      invalidate('/meeting'); invalidate('/tong-quan'); invalidate('/signals');
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
                <span key={t.id} className={`${CHIP_TRON} gap-1 surface-2 !font-medium`}>
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
              <summary className="text-xs text-slate-500 cursor-pointer">Lịch sử ({cell.history.length})</summary>
              <ul className="list-none p-0 m-0 mt-1 space-y-0.5">
                {cell.history.map((h, i) => (
                  <li key={i} className="text-xs text-slate-500">
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
              {!(editWindow?.open ?? true) && <span className="text-xs text-slate-500">Cửa sổ nộp đã đóng — vẫn lưu nháp được.</span>}
              {(editWindow?.open ?? true) && !status && <span className="text-xs text-slate-500">Chọn mức trước khi nộp.</span>}
            </div>
          )}
        </div>
      {/* để tsc khỏi kêu unused khi key đổi giữa các lần mở — theo dõi qua effect ở trên. */}
      <span className="hidden" aria-hidden>{key}</span>
    </KhungPanel>
  );
}

type MoViecRow = { id: number; title: string; progressLabel: string; due: string | null; group: string | null; branchId: number | null };

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
    /* Đơn vị không thuộc chi nhánh nào (Tutor part-time): chỉ việc "Toàn hệ thống" — không trộn việc của mọi chi nhánh vào ô chọn của Quản trị. */
    const list = (data?.rows ?? []).filter((r) => (branchId !== null || r.branchId === null)
      && (!q.trim() || r.title.toLowerCase().includes(q.trim().toLowerCase())));
    return [...list].sort((a, b) => (a.group === taskGroup ? -1 : 0) - (b.group === taskGroup ? -1 : 0));
  }, [data, q, taskGroup, branchId]);

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
