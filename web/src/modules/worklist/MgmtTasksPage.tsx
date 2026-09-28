import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Alert, Card, Empty, ErrorState, Field, Forbidden, Info, NutChon, SectionNote, Skeleton, Status, Th } from '../../ui/ui.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { Han } from '../../ui/Han.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { fmtDate } from '../../lib/format.ts';
import {
  HANG_SO, HANG_SO_LABEL, TASK_GROUPS, TASK_GROUP_LABEL, TASK_PROGRESS, TASK_PROGRESS_LABEL,
  TASK_PROGRESS_NEEDS_REASON, TRANG_THAI_LOC, catDongPhu, dongHanDaDoi,
  type HangSo, type NguoiChon, type TrangThaiLoc,
} from '@shared/domain/index.ts';

type Row = {
  id: number; code: string; title: string; group: string | null; taskType: string;
  branchId: number | null; branchName: string;
  assigneeUserId: number | null; assigneeName: string | null;
  watcherUserId: number | null; watcherName: string | null;
  due: string | null; progress: string; progressLabel: string;
  stopReason: string | null; reviewOn: string | null;
  helpUserId: number | null; helpName: string | null;
  overdue: boolean; subTotal: number; subDone: number; subOpen: number;
  subOverdue: boolean; subOverdueCount: number; subOverdueTitles: string[];
  caseLinks: number;
  hanGoc: string | null; lyDoDoiHan: string | null; soLanDoiHan: number;
  lastUpdate: { on: string; progressLabel: string; note: string | null; by: string | null } | null;
};

/** Trạng thái công việc dùng cùng họ nhãn với cả hệ thống (mục 10). */
const KIND: Record<string, 'doing' | 'waiting' | 'done' | 'idle'> = {
  /* PR-N1 A8: "Tiếp tục xử lý" trung tính — xanh dương chỉ còn cho ô điểm. */
  not_started: 'idle', doing: 'idle', done: 'done', paused: 'waiting', stopped: 'idle',
};

const TRANG_THAI_LABEL: Record<TrangThaiLoc, string> = {
  mo: 'Đang mở', not_started: 'Chưa bắt đầu', doing: 'Tiếp tục xử lý', paused: 'Tạm ngưng',
  stopped: 'Dừng hẳn', done: 'Đã hoàn thành', 'tat-ca': 'Mọi trạng thái',
};

const idOfNguoi = (v: NguoiChon | null, myId: number | null): number | null => {
  if (!v) return null;
  if (v.kieu === 'toi') return myId;
  if (v.kieu === 'tai_khoan') return v.id;
  return null;
};

/**
 * TIẾN ĐỘ CÔNG VIỆC — MỘT bảng, không phải bốn bảng mở cùng lúc (mục 8.2).
 *
 * PR-Ra: hàng số ở đầu tab bấm được (Q8, bốn câu hỏi CHỒNG NHAU có chủ ý), hàng lọc Nhóm ·
 * Trạng thái · Người phụ trách đứng cùng một hàng (§18.4: không quá 10 nút), bảng 5 cột với
 * Việc con thay "Cập nhật gần nhất" (Q7). Đây là công việc quản lý vận hành, không phải case
 * của học viên — không có tầng "phương án xử lý", không có quy trình xin duyệt.
 */
export function TasksBoard() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const { homNay } = useNgayNghiepVu();
  const branchId = params.get('cn') ? Number(params.get('cn')) : null;
  const group = params.get('nhom') ?? '';
  const progress: TrangThaiLoc = (TRANG_THAI_LOC as readonly string[]).includes(params.get('trangThai') ?? '')
    ? (params.get('trangThai') as TrangThaiLoc) : 'mo';
  const hang: HangSo | null = (HANG_SO as readonly string[]).includes(params.get('hang') ?? '') ? (params.get('hang') as HangSo) : null;
  const phuTrachParam = params.get('phuTrach');
  const assigneeUserId = phuTrachParam === 'toi' ? session?.user?.id ?? null : (phuTrachParam ? Number(phuTrachParam) : null);

  /*
   * MỞ THẲNG TỪ ĐƯỜNG DẪN (mục 14.2): báo cáo kỳ họp liên kết sang đây để mở/tạo việc ngay.
   * Đọc một lần lúc vào màn, rồi xoá tham số khỏi URL để nút Back không mở lại hộp thoại.
   */
  const [open, setOpen] = useState<number | null>(params.get('open') ? Number(params.get('open')) : null);
  const [creating, setCreating] = useState(params.get('tao') === '1');
  const preGroup = params.get('nhom') || '';
  const baoCaoId = params.get('baoCao') ? Number(params.get('baoCao')) : null;
  const veKyHop = params.get('periodId');
  useEffect(() => {
    if (!params.get('open') && !params.get('tao')) return;
    const next = new URLSearchParams(params);
    next.delete('open'); next.delete('tao');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (group) qs.set('group', group);
  qs.set('progress', progress);
  if (hang) qs.set('hang', hang);
  if (assigneeUserId) qs.set('assigneeUserId', String(assigneeUserId));
  const { data, loading, error, reload } = useApi<{
    rows: Row[]; canEdit: boolean; scopeEmpty: boolean;
    facets: { group: Record<string, number>; progress: Record<string, number>; hang: Record<string, number> };
    hangSo: Record<string, number>;
  }>(`/mgmt-tasks?${qs}`, [qs.toString()]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (data?.scopeEmpty) {
    return (
      <Forbidden
        message="Phần này dành cho Quản trị hệ thống và Quản lý chi nhánh"
        hint="Việc được giao cho bạn vẫn hiện ở Tổng quan và mở được từ thông báo."
      />
    );
  }

  const rows = data?.rows ?? [];
  const hangSo = data?.hangSo ?? {};
  const assigneeValue: NguoiChon | null = phuTrachParam === 'toi'
    ? { kieu: 'toi' }
    : assigneeUserId
      ? { kieu: 'tai_khoan', id: assigneeUserId, ten: rows.find((r) => r.assigneeUserId === assigneeUserId)?.assigneeName ?? `#${assigneeUserId}` }
      : null;

  return (
    <div className="space-y-4">
      {/* ── hàng số: bốn câu hỏi CHỒNG NHAU (Q8), mỗi số là một nút lọc ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" title="Bốn con số này chồng nhau có chủ ý — một việc Tạm ngưng đã tới ngày xem lại cũng có thể vừa quá hạn.">
          {HANG_SO.map((h) => {
            const n = hangSo[h] ?? 0;
            const active = hang === h;
            const mo = n === 0 && !active;
            return (
              <button key={h} type="button" disabled={mo}
                className={`flex items-baseline gap-1 appearance-none bg-transparent border-0 p-0 ${mo ? 'opacity-40 cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                onClick={() => {
                  /*
                   * "Vừa hoàn thành" là việc ĐÃ KHÉP — Trạng thái mặc định "Đang mở" thì lọc còn 0
                   * dòng dù hàng số > 0 (G-10). Bấm hàng số nào cũng chuyển Trạng thái về "Tất cả"
                   * luôn — vừa tránh riêng ca này, vừa không để hai bộ lọc âm thầm chỏi nhau. Gộp
                   * một lần `setParams` vì `setParam` gọi liên tiếp sẽ dựa trên `params` cũ, mất
                   * thay đổi của lần gọi trước.
                   */
                  const next = new URLSearchParams(params);
                  if (active) { next.delete('hang'); } else { next.set('hang', h); next.set('trangThai', 'tat-ca'); }
                  setParams(next, { replace: true });
                }}>
                <strong className={`tabular-nums text-sm ${active ? 'text-sky-300' : h === 'qua-han' && n > 0 ? 'text-rose-300' : 'text-slate-100'}`}>{n}</strong>
                <span className={active ? 'text-sky-300' : 'text-slate-400'}>{HANG_SO_LABEL[h]}</span>
                {active && <span className="text-sky-300" aria-hidden>✕</span>}
              </button>
            );
          })}
        </div>
        {data?.canEdit && <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Công việc</button>}
      </div>

      <Card bodyClass="p-0"
        title={<span className="flex flex-wrap items-baseline gap-2">Công việc <span className="text-slate-500 font-normal">{rows.length} việc</span></span>}
        action={<BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />}
      >
        {/* ── hàng lọc: Nhóm · Trạng thái · Người phụ trách (§18.4 — không quá 10 nút một hàng) ── */}
        <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--line)' }}>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Nhóm:
            <select className="field" value={group} onChange={(e) => setParam('nhom', e.target.value || null)}>
              <option value="">Mọi nhóm</option>
              {TASK_GROUPS.map((g) => (
                <option key={g} value={g}>{TASK_GROUP_LABEL[g]} ({data?.facets.group[g] ?? 0})</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Trạng thái:
            <select className="field" value={progress} onChange={(e) => setParam('trangThai', e.target.value === 'mo' ? null : e.target.value)}>
              {TRANG_THAI_LOC.map((t) => (
                <option key={t} value={t}>{TRANG_THAI_LABEL[t]} ({data?.facets.progress[t] ?? 0})</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="shrink-0">Người phụ trách:</span>
            <div className="w-56">
              <ChonNguoi value={assigneeValue}
                onChange={(v) => setParam('phuTrach', v?.kieu === 'toi' ? 'toi' : v?.kieu === 'tai_khoan' ? String(v.id) : null)}
                nhom="nhan_vien" choNgoai={false} macDinhTrong="Mọi người" ariaLabel="Lọc theo người phụ trách" />
            </div>
          </div>
        </div>

        {loading && <div className="p-4"><Skeleton rows={5} /></div>}
        {!loading && rows.length === 0 && (
          <div className="p-4"><Empty title="Không có công việc nào khớp bộ lọc" /></div>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '52rem' }}>
              <colgroup>
                <col style={{ width: '32%' }} /><col style={{ width: '16%' }} /><col style={{ width: '16%' }} />
                <col style={{ width: '20%' }} /><col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr>
                  <Th hint="Bấm một dòng để mở chi tiết, việc con và lịch sử cập nhật.">Việc</Th>
                  <Th hint="Người chịu trách nhiệm làm. Người theo dõi chỉ xem, không sửa được.">Người phụ trách</Th>
                  <Th hint="Quá hạn tính theo hạn HIỆN TẠI (giữ nguyên luật cũ) — hạn đã dời hiện ở dòng phụ.">Hạn</Th>
                  <Th hint="Tạm ngưng là còn sống, tiếp tục được bất kỳ lúc nào; dừng hẳn là đã quyết định không làm.">Trạng thái</Th>
                  <Th hint="Việc con chỉ MỘT tầng — không quy thành phần trăm khối lượng.">Việc con</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const phuTrangThai = r.progress === 'paused'
                    ? catDongPhu(`${r.stopReason ?? ''} · cần: ${r.helpName ?? '—'} · xem lại ${r.reviewOn ? fmtDate(r.reviewOn) : '—'}`)
                    : r.progress === 'stopped' ? r.stopReason : null;
                  const phuTrangThaiDu = r.progress === 'paused'
                    ? `${r.stopReason ?? ''} · cần: ${r.helpName ?? '—'} · xem lại ${r.reviewOn ? fmtDate(r.reviewOn) : '—'}`
                    : r.stopReason ?? '';
                  return (
                    <tr key={r.id} className="row-hover cursor-pointer" onClick={() => setOpen(r.id)}>
                      <td className="td">
                        <span className="text-slate-100" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          {r.group ? TASK_GROUP_LABEL[r.group as keyof typeof TASK_GROUP_LABEL] : '—'}
                          {' · '}{r.taskType === 'long_term' ? 'Dài hạn' : 'Trong kỳ'}
                          {branchId === null && r.branchName ? ` · ${r.branchName}` : ''}
                        </span>
                      </td>
                      <td className="td text-slate-300">
                        {r.assigneeName ?? <span className="text-slate-600">chưa giao</span>}
                      </td>
                      <td className="td whitespace-nowrap">
                        <Han loai="viec-van-hanh" han={r.due} />
                        {r.hanGoc && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{dongHanDaDoi({ hanGoc: r.hanGoc, lyDo: r.lyDoDoiHan }, homNay)}</div>
                        )}
                      </td>
                      <td className="td">
                        <Status kind={KIND[r.progress] ?? 'idle'}>{r.progressLabel}</Status>
                        {phuTrangThai && <div className="text-[11px] text-slate-500 mt-0.5" title={phuTrangThaiDu}>{phuTrangThai}</div>}
                      </td>
                      <td className="td text-xs">
                        {r.subTotal > 0 ? <span className="text-slate-300">{r.subDone}/{r.subTotal} xong</span> : <span className="text-slate-600">—</span>}
                        {r.subOverdueCount > 0 && (
                          <div className="text-rose-300 mt-0.5">
                            quá hạn: {r.subOverdueTitles.map((t) => `"${t}"`).join(', ')}
                            {r.subOverdueCount > r.subOverdueTitles.length ? ` và ${r.subOverdueCount - r.subOverdueTitles.length} việc khác` : ''}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NganViecVanHanh taskId={open} onClose={() => setOpen(null)} onDone={reload} />
      <CreateTask open={creating} onClose={() => setCreating(false)} onDone={reload}
        branchId={branchId} defaultGroup={preGroup || undefined} unitReportId={baoCaoId} veKyHop={veKyHop} />
    </div>
  );
}

/** Chi tiết một công việc: hạn + lịch sử dời hạn, việc con, lịch sử cập nhật, case làm căn cứ. */
export function NganViecVanHanh({ taskId, onClose, onDone }: {
  taskId: number | null; onClose: () => void; onDone: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const { data, loading, reload } = useApi<any>(taskId ? `/mgmt-tasks/${taskId}` : null, [taskId]);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingSub, setAddingSub] = useState(false);

  if (taskId === null) return null;
  return (
    <KhungPanel tieuDe={data?.title ?? 'Công việc'} rong="rong" onDong={onClose}
      ngCanh={data ? TASK_GROUP_LABEL[data.group as keyof typeof TASK_GROUP_LABEL] || undefined : undefined}>
      {loading && <div className="pt-3"><Skeleton rows={6} /></div>}
      {data && (
        <div className="space-y-4 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <Status kind={KIND[data.progress] ?? 'idle'}>{data.progressLabel}</Status>
            <Han loai="viec-van-hanh" han={data.due} />
            {data.assigneeName && <Info>{data.assigneeName}</Info>}
            {data.watcherName && <Info>theo dõi: {data.watcherName}</Info>}
          </div>
          {data.hanGoc && (
            <p className="text-xs text-slate-500 m-0">{dongHanDaDoi({ hanGoc: data.hanGoc, lyDo: null }, homNay)}</p>
          )}
          {data.dueHistory?.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-1.5">Lịch sử dời hạn</h3>
              <ul className="list-none p-0 m-0 space-y-1 text-xs text-slate-400">
                {data.dueHistory.map((h: any, i: number) => (
                  <li key={i}>
                    {h.old ? fmtDate(h.old) : '—'} → {h.new ? fmtDate(h.new) : '—'}
                    {h.reason && <> · "{h.reason}"</>}
                    {h.by && <span className="text-slate-500"> · {h.by}</span>}
                    {h.at && <span className="text-slate-500"> · {fmtDate(h.at)}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.progress === 'paused' && (data.stopReason || data.helpName || data.reviewOn) && (
            <SectionNote>
              <strong>Lý do:</strong> {data.stopReason}
              {data.helpName && <> · cần: {data.helpName}</>}
              {data.reviewOn && <> · hẹn xem lại {fmtDate(data.reviewOn)}</>}
            </SectionNote>
          )}
          {data.progress === 'stopped' && data.stopReason && (
            <SectionNote><strong>Lý do dừng hẳn:</strong> {data.stopReason}</SectionNote>
          )}
          {data.note && <p className="text-sm text-slate-300 m-0">{data.note}</p>}

          {data.viewer.canUpdate && (
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary btn-sm" onClick={() => setUpdating(true)}>Cập nhật tiến độ</button>
              {data.viewer.canEdit && (
                <>
                  <button className="btn btn-sm" onClick={() => setEditing(true)}>Sửa</button>
                  <button className="btn btn-sm" onClick={() => setAddingSub(true)}>+ Công việc con</button>
                </>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────── việc con, một tầng */}
          <section>
            <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">
              Công việc con
              {data.subtasks.length > 0 && (
                <span className="text-slate-500 font-normal ml-2">
                  {data.subtasks.filter((x: any) => x.progress === 'done').length}/{data.subtasks.length} hoàn thành
                </span>
              )}
            </h3>
            {data.subtasks.length === 0 ? (
              <p className="text-xs text-slate-500 m-0">Chưa chia việc con.</p>
            ) : (
              <ul className="list-none p-0 m-0 space-y-1.5">
                {data.subtasks.map((x: any) => (
                  <li key={x.id} className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--line)' }}>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm ${x.overdue ? 'text-rose-300' : 'text-slate-100'}`}>{x.title}</span>
                      <Status kind={KIND[x.progress] ?? 'idle'}>{x.progressLabel}</Status>
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {x.assigneeName ?? 'chưa giao'}
                      {x.due ? ` · hạn ${fmtDate(x.due)}` : ''}
                      {x.stopReason ? ` · ${x.stopReason}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ─────────────────────────────────────────── lịch sử cập nhật */}
          <section>
            <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Lịch sử cập nhật</h3>
            {data.updates.length === 0 ? (
              <p className="text-xs text-slate-500 m-0">Chưa có cập nhật nào.</p>
            ) : (
              <ol className="list-none p-0 m-0 space-y-2">
                {data.updates.map((u: any) => (
                  <li key={u.id} className="text-xs border-l-2 pl-3" style={{ borderColor: 'var(--accent-line)' }}>
                    <span className="text-slate-500 tabular-nums">{fmtDate(u.on)}</span>
                    <span className="ml-2"><Status kind={KIND[u.progress] ?? 'idle'}>{u.progressLabel}</Status></span>
                    {u.by && <span className="text-slate-500 ml-2">{u.by}</span>}
                    {u.note && <div className="text-slate-400 mt-0.5">{u.note}</div>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {data.cases.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">
                Case làm căn cứ
                <span className="text-slate-500 ml-1.5 cursor-help" title="Liên kết này chỉ là CĂN CỨ. Hoàn thành công việc quản lý KHÔNG đóng case nào, và cũng không tự tạo phương án cho em nào.">ⓘ</span>
              </h3>
              <ul className="list-none p-0 m-0 space-y-1 text-xs text-slate-300">
                {data.cases.map((c: any) => (
                  <li key={c.id}>{c.title} <span className="text-slate-500">· {c.student_name}</span></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {data && (
        <UpdateDialog open={updating} onClose={() => setUpdating(false)} task={data}
          onDone={() => { reload(); onDone(); }} />
      )}
      {data && (
        <SuaViec open={editing} onClose={() => setEditing(false)} task={data}
          onDone={() => { reload(); onDone(); }} />
      )}
      {data && (
        <CreateTask open={addingSub} onClose={() => setAddingSub(false)} parent={data}
          branchId={data.branchId} onDone={() => { reload(); onDone(); }} />
      )}
    </KhungPanel>
  );
}

/** Ghi một lần cập nhật — cách DUY NHẤT trạng thái công việc đổi. */
function UpdateDialog({ open, onClose, task, onDone }: {
  open: boolean; onClose: () => void; task: any; onDone: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [progress, setProgress] = useState(task.progress);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [reviewOn, setReviewOn] = useState(task.reviewOn ?? addDaysIso(homNay, 7));
  const [help, setHelp] = useState<NguoiChon | null>(task.helpUserId
    ? { kieu: 'tai_khoan', id: task.helpUserId, ten: task.helpName ?? '' }
    : task.helpName ? { kieu: 'ngoai', ten: task.helpName } : null);
  const [busy, setBusy] = useState(false);
  const needReason = (TASK_PROGRESS_NEEDS_REASON as readonly string[]).includes(progress);
  const needHelp = progress === 'paused';
  const helpThieu = needHelp && !help;
  const reviewThieu = needHelp && (!reviewOn || reviewOn < homNay);
  /* Q11: Hoàn thành/Dừng hẳn việc CHA còn con mở đều bị chặn — không phải chỉ Hoàn thành. */
  const conChuaXong: string[] = task.openSubTitles ?? [];
  const chanKhepLai = (progress === 'done' || progress === 'stopped') && conChuaXong.length > 0;

  return (
    <Modal open={open} onClose={onClose} title="Cập nhật tiến độ"
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy || (needReason && !reason.trim()) || helpThieu || reviewThieu || chanKhepLai}
            onClick={async () => {
              setBusy(true);
              try {
                await api.post(`/mgmt-tasks/${task.id}/update`, {
                  progress, note: note || null, reason: reason || null,
                  reviewOn: needHelp ? (reviewOn || null) : null,
                  helpUserId: help?.kieu === 'tai_khoan' ? help.id : null,
                  helpName: help?.kieu === 'ngoai' ? help.ten : null,
                });
                invalidate('/mgmt-tasks');
                toast.push('ok', 'Đã cập nhật'); onDone(); onClose();
              } catch (e: any) { toast.push('error', e?.message ?? 'Không lưu được'); }
              finally { setBusy(false); }
            }}>
            Lưu
          </button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Trạng thái">
          <div className="flex flex-wrap gap-1.5">
            {TASK_PROGRESS.map((s) => (
              <NutChon key={s} nho chon={progress === s} onClick={() => setProgress(s)}>
                {TASK_PROGRESS_LABEL[s]}
              </NutChon>
            ))}
          </div>
        </Field>
        {chanKhepLai && (
          <Alert>
            Còn {conChuaXong.length} công việc con chưa khép lại: {conChuaXong.slice(0, 2).map((t) => `"${t}"`).join(', ')}
            {conChuaXong.length > 2 ? ` và ${conChuaXong.length - 2} việc khác` : ''}.
          </Alert>
        )}
        {needReason && (
          <Field label="Lý do" required
            hint="Một việc tự nhiên im lặng mà không ai biết vì sao là thứ vài tháng sau không ai giải thích được.">
            <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        )}
        {needHelp && (
          <>
            <Field label="Cần ai hỗ trợ" required>
              <ChonNguoi value={help} onChange={setHelp} nhom="nhan_vien" choToi={false} choNgoai ariaLabel="Người cần hỗ trợ" />
            </Field>
            <Field label="Ngày xem lại" required hint="Từ ngày cập nhật trở đi.">
              <ONgay kieu="ngay" value={reviewOn} onChange={setReviewOn} toiThieu={homNay} />
            </Field>
          </>
        )}
        <Field label="Ghi chú">
          <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/** Sửa phần mô tả: tên, nhóm, người, hạn, ghi chú — không đụng tiến độ. Đổi hạn ĐANG CÓ thì bắt buộc lý do (Q9). */
function SuaViec({ open, onClose, task, onDone }: {
  open: boolean; onClose: () => void; task: any; onDone: () => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const [title, setTitle] = useState(task.title);
  const [group, setGroup] = useState(task.group ?? 'curriculum');
  const [assignee, setAssignee] = useState<NguoiChon | null>(task.assigneeUserId
    ? { kieu: 'tai_khoan', id: task.assigneeUserId, ten: task.assigneeName ?? '' } : null);
  const [watcher, setWatcher] = useState<NguoiChon | null>(task.watcherUserId
    ? { kieu: 'tai_khoan', id: task.watcherUserId, ten: task.watcherName ?? '' } : null);
  const [due, setDue] = useState(task.due ?? '');
  const [lyDoDoiHan, setLyDoDoiHan] = useState('');
  const [note, setNote] = useState(task.note ?? '');
  const [busy, setBusy] = useState(false);

  const doiHan = due !== task.due;
  const canDoi = !!task.due && doiHan;

  return (
    <Modal open={open} onClose={onClose} title="Sửa công việc"
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy || !title.trim() || (canDoi && lyDoDoiHan.trim().length < 2)}
            onClick={async () => {
              setBusy(true);
              try {
                await api.patch(`/mgmt-tasks/${task.id}`, {
                  title, group,
                  assigneeUserId: idOfNguoi(assignee, session?.user?.id ?? null),
                  watcherUserId: idOfNguoi(watcher, session?.user?.id ?? null),
                  due: due || null,
                  lyDoDoiHan: canDoi ? lyDoDoiHan.trim() : null,
                  note: note || null,
                });
                invalidate('/mgmt-tasks');
                toast.push('ok', 'Đã lưu'); onDone(); onClose();
              } catch (e: any) { toast.push('error', e?.message ?? 'Không lưu được'); }
              finally { setBusy(false); }
            }}>
            Lưu
          </button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Tên công việc" required>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Nhóm" required>
          <select className="field" value={group} onChange={(e) => setGroup(e.target.value)}>
            {TASK_GROUPS.map((g) => <option key={g} value={g}>{TASK_GROUP_LABEL[g]}</option>)}
          </select>
        </Field>
        <Field label="Người phụ trách">
          <ChonNguoi value={assignee} onChange={setAssignee} nhom="nhan_vien" choNgoai={false} macDinhTrong="Chưa giao" />
        </Field>
        <Field label="Người theo dõi" hint="Nhìn thấy công việc nhưng KHÔNG sửa được.">
          <ChonNguoi value={watcher} onChange={setWatcher} nhom="nhan_vien" choNgoai={false} macDinhTrong="Không có" />
        </Field>
        <Field label="Hạn">
          <ONgay kieu="ngay" value={due} onChange={setDue} />
        </Field>
        {canDoi && (
          <Field label="Lý do dời hạn" required hint="2–200 ký tự — hạn cũ vẫn hiện lại ở cột Hạn, không mất.">
            <input className="field" value={lyDoDoiHan} onChange={(e) => setLyDoDoiHan(e.target.value)} placeholder="Chờ duyệt ngân sách nhà cung cấp" />
          </Field>
        )}
        <Field label="Ghi chú">
          <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function CreateTask({ open, onClose, onDone, branchId, parent, defaultGroup, unitReportId, veKyHop }: {
  open: boolean; onClose: () => void; onDone: () => void;
  branchId: number | null; parent?: any;
  /** Mở từ một mục báo cáo kỳ họp thì nhóm đã biết trước — đỡ một lần chọn và một lần chọn sai. */
  defaultGroup?: string;
  /** PR-Ra R6: tạo từ ô báo cáo đơn vị — tự nối, rồi quay về đúng tuần đó. */
  unitReportId?: number | null;
  veKyHop?: string | null;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const { session } = useSession();
  const branches = useApi<any[]>(open ? '/ref/branches' : null);
  const [title, setTitle] = useState('');
  const [group, setGroup] = useState<string>(parent?.group ?? defaultGroup ?? 'curriculum');
  const [assignee, setAssignee] = useState<NguoiChon | null>(null);
  const [watcher, setWatcher] = useState<NguoiChon | null>(null);
  /*
   * HẠN VIỆC CON mặc định = hạn cha trừ MỘT NGÀY (mục 8.6), và sửa được ngay tại đây.
   * Hạn cha đã là quá khứ thì để TRỐNG chứ không đưa ra một mặc định vô nghĩa.
   */
  const defaultDue = parent?.due ? addDaysIso(parent.due, -1) : '';
  const [due, setDue] = useState(defaultDue);
  const [branch, setBranch] = useState(String(parent?.branchId ?? branchId ?? ''));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Modal open={open} onClose={onClose} width="max-w-lg"
      title={parent ? `Công việc con của "${parent.title}"` : 'Công việc mới'}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy || !title.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                await api.post('/mgmt-tasks', {
                  title, group,
                  assigneeUserId: idOfNguoi(assignee, session?.user?.id ?? null),
                  watcherUserId: idOfNguoi(watcher, session?.user?.id ?? null),
                  due: due || null, branchId: branch || null, note: note || null,
                  parentTaskId: parent?.id ?? null,
                  unitReportId: unitReportId ?? null,
                });
                invalidate('/mgmt-tasks');
                toast.push('ok', 'Đã tạo công việc');
                setTitle(''); setNote(''); onDone(); onClose();
                if (unitReportId && veKyHop) navigate(`/cong-viec/bao-cao?periodId=${veKyHop}`);
              } catch (e: any) { toast.push('error', e?.message ?? 'Không lưu được'); }
              finally { setBusy(false); }
            }}>
            Tạo
          </button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Tên công việc" required>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={parent ? 'Soạn phần Listening' : 'Xây dựng giáo trình Beginner'} />
        </Field>
        {!parent && (
          <Field label="Nhóm" required>
            <select className="field" value={group} onChange={(e) => setGroup(e.target.value)}>
              {TASK_GROUPS.map((g) => <option key={g} value={g}>{TASK_GROUP_LABEL[g]}</option>)}
            </select>
          </Field>
        )}
        <Field label="Người phụ trách">
          <ChonNguoi value={assignee} onChange={setAssignee} nhom="nhan_vien" choToi choNgoai={false} macDinhTrong="Chưa giao" />
        </Field>
        <Field label="Người theo dõi" hint="Nhìn thấy công việc nhưng KHÔNG sửa được.">
          <ChonNguoi value={watcher} onChange={setWatcher} nhom="nhan_vien" choToi choNgoai={false} macDinhTrong="Không có" />
        </Field>
        <Field label="Hạn"
          hint={parent ? 'Mặc định là hạn của việc cha trừ một ngày — sửa được ngay.' : undefined}>
          <ONgay kieu="ngay" value={due} onChange={setDue} />
        </Field>
        {!parent && (
          <Field label="Chi nhánh">
            <select className="field" value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">Toàn hệ thống</option>
              {(branches.data ?? []).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Ghi chú">
          <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
