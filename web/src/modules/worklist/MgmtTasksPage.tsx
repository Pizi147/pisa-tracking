import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Alert, Card, Empty, ErrorState, Field, Forbidden, Info, SectionNote, Skeleton, Status, Th } from '../../ui/ui.tsx';
import { Drawer, Modal } from '../../ui/Drawer.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { fmtDate } from '../../lib/format.ts';
import {
  TASK_GROUPS, TASK_GROUP_LABEL, TASK_PROGRESS, TASK_PROGRESS_LABEL,
  TASK_PROGRESS_NEEDS_REASON,
} from '@shared/domain/index.ts';

type Row = {
  id: number; code: string; title: string; group: string | null;
  branchId: number | null; branchName: string;
  assigneeUserId: number | null; assigneeName: string | null;
  watcherUserId: number | null; watcherName: string | null;
  due: string | null; progress: string; progressLabel: string;
  stopReason: string | null; reviewOn: string | null;
  overdue: boolean; subTotal: number; subDone: number; subOverdue: boolean;
  caseLinks: number;
  lastUpdate: { on: string; progressLabel: string; note: string | null; by: string | null } | null;
};

/** Trạng thái công việc dùng cùng họ nhãn với cả hệ thống (mục 10). */
const KIND: Record<string, 'doing' | 'waiting' | 'done' | 'idle'> = {
  not_started: 'idle', doing: 'doing', done: 'done', paused: 'waiting', stopped: 'idle',
};

/**
 * TIẾN ĐỘ CÔNG VIỆC — MỘT bảng, không phải bốn bảng mở cùng lúc (mục 8.2).
 *
 * Đây là công việc quản lý vận hành, không phải case của học viên: không có tầng "phương án
 * xử lý", không có quy trình xin duyệt. Quản lý tạo việc, giao việc, cập nhật tiến độ.
 *
 * Bốn nhóm là RANH GIỚI CÓ CHỦ Ý (mục 8.1): Học sinh/Phụ huynh · Giáo trình · Giáo viên ·
 * Tutor. Việc nào không thuộc bốn nhóm này thì hoặc là một case của học viên, hoặc là chuyện
 * ngoài phạm vi phần mềm — thêm nhóm thứ năm là bước đầu biến nó thành một hệ quản trị.
 */
export default function MgmtTasksPage() {
  const [params, setParams] = useSearchParams();
  const branchId = params.get('cn') ? Number(params.get('cn')) : null;
  const [group, setGroup] = useState('');
  const [progress, setProgress] = useState('');
  /*
   * MỞ THẲNG TỪ ĐƯỜNG DẪN (mục 14.2): báo cáo kỳ họp liên kết sang đây để "tạo hoặc liên
   * kết task ngay từ báo cáo". Đọc một lần lúc vào màn, rồi xoá tham số khỏi URL để nút Back
   * không mở lại hộp thoại.
   */
  const [open, setOpen] = useState<number | null>(
    params.get('open') ? Number(params.get('open')) : null,
  );
  const [creating, setCreating] = useState(params.get('tao') === '1');
  const preGroup = params.get('nhom') ?? '';
  useEffect(() => {
    if (!params.get('open') && !params.get('tao')) return;
    const next = new URLSearchParams(params);
    next.delete('open'); next.delete('tao');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (group) qs.set('group', group);
  if (progress) qs.set('progress', progress);
  const { data, loading, error, reload } = useApi<{
    rows: Row[]; canEdit: boolean; scopeEmpty: boolean;
    facets?: { group: Record<string, number>; progress: Record<string, number> };
    summary?: { doing: number; overdue: number; dueSoon: number; paused: number; total: number };
  }>(`/mgmt-tasks?${qs}`, [branchId, group, progress]);

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
  /*
   * SỐ TRÊN NÚT NHÓM LẤY TỪ MÁY CHỦ, đếm trên phạm vi quyền/chi nhánh TRƯỚC KHI áp chính bộ
   * lọc nhóm (mục 14.1). Đếm trên `rows` như bản trước là sai: chọn "Học sinh/Phụ huynh" thì
   * ba nhóm kia tụt về 0 và người dùng tưởng trung tâm hết việc về giáo trình.
   */
  const countOf = (g: string) => data?.facets?.group[g] ?? 0;
  const countProgress = (k: string) => data?.facets?.progress[k] ?? 0;
  const sum = data?.summary;

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 m-0">Tiến độ công việc</h1>
          <p className="text-xs text-slate-500 mt-0.5 mb-0">
            Công việc quản lý vận hành — không phải case của học viên.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BranchFilter branchId={branchId} onBranch={(id) => {
            const next = new URLSearchParams(params);
            if (id) next.set('cn', String(id)); else next.delete('cn');
            setParams(next);
          }} />
          {data?.canEdit && (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Công việc</button>
          )}
        </div>
      </div>

      {/*
        DÒNG TỔNG HỢP GỌN (mục 14.2), và nó CỐ Ý KHÔNG cộng thành tổng: một việc quá hạn thì
        cũng đang thực hiện. Bốn con số là bốn câu hỏi, nên câu chú thích nói thẳng điều đó
        thay vì để người đọc cộng lại rồi thấy lệch và mất tin.
      */}
      {sum && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs surface-2 rounded-lg px-3 py-2">
          <span className="text-slate-300">
            <strong className="tabular-nums text-slate-100">{sum.doing}</strong> đang thực hiện
          </span>
          <span className={sum.overdue ? 'text-rose-300' : 'text-slate-400'}>
            <strong className="tabular-nums">{sum.overdue}</strong> quá hạn
          </span>
          <span className={sum.dueSoon ? 'text-amber-200' : 'text-slate-400'}>
            <strong className="tabular-nums">{sum.dueSoon}</strong> đến hạn trong ba ngày
          </span>
          <span className="text-slate-400">
            <strong className="tabular-nums">{sum.paused}</strong> tạm ngưng
          </span>
          <span className="text-[11px] text-slate-500">
            Bốn nhóm này chồng nhau — một việc quá hạn cũng đang thực hiện — nên chúng không
            cộng thành {sum.total} việc.
          </span>
        </div>
      )}

      <Card bodyClass="p-0"
        title={
          <span className="flex flex-wrap items-baseline gap-2">
            Công việc
            <span className="text-slate-500 font-normal">{rows.length} việc</span>
          </span>
        }>
        {/* Một thanh lọc duy nhất: nhóm và trạng thái. Không dựng thêm bảng cho mỗi nhóm. */}
        <div className="px-4 py-3 border-b flex flex-wrap items-center gap-1.5" style={{ borderColor: 'var(--line)' }}>
          <button className={`btn btn-sm ${!group ? 'btn-primary' : ''}`} onClick={() => setGroup('')}>
            Mọi nhóm
          </button>
          {TASK_GROUPS.map((g) => (
            <button key={g} className={`btn btn-sm ${group === g ? 'btn-primary' : ''}`}
              onClick={() => setGroup(group === g ? '' : g)}>
              {TASK_GROUP_LABEL[g]} <span className="tabular-nums opacity-70 ml-1">{countOf(g)}</span>
            </button>
          ))}
          <span className="w-px h-5 mx-1" style={{ background: 'var(--line)' }} />
          <button className={`btn btn-sm ${!progress ? 'btn-primary' : ''}`} onClick={() => setProgress('')}>
            Mọi trạng thái
          </button>
          {TASK_PROGRESS.map((s) => (
            <button key={s} className={`btn btn-sm ${progress === s ? 'btn-primary' : ''}`}
              onClick={() => setProgress(progress === s ? '' : s)}>
              {TASK_PROGRESS_LABEL[s]} <span className="tabular-nums opacity-70 ml-1">{countProgress(s)}</span>
            </button>
          ))}
        </div>

        {loading && <div className="p-4"><Skeleton rows={5} /></div>}
        {!loading && rows.length === 0 && (
          <div className="p-4"><Empty title="Không có công việc nào khớp bộ lọc" /></div>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th hint="Bấm một dòng để mở chi tiết, việc con và lịch sử cập nhật.">Công việc</Th>
                  <Th hint="Người chịu trách nhiệm làm. Người theo dõi chỉ xem, không sửa được.">Phụ trách</Th>
                  <Th hint="Hạn của chính công việc này. Hạn việc con đặt riêng, không dời theo hạn cha.">Hạn</Th>
                  <Th hint="Tạm ngưng là còn sống, tiếp tục được bất kỳ lúc nào; dừng hẳn là đã quyết định không làm.">Trạng thái</Th>
                  <Th hint="Lần cập nhật gần nhất — ai, lúc nào, nói gì.">Cập nhật gần nhất</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="row-hover cursor-pointer" onClick={() => setOpen(r.id)}>
                    <td className="td">
                      <span className="text-slate-100">{r.title}</span>
                      <span className="flex flex-wrap items-center gap-1.5 mt-1">
                        {r.group && <Info>{TASK_GROUP_LABEL[r.group as keyof typeof TASK_GROUP_LABEL]}</Info>}
                        <Info>{r.branchName}</Info>
                        {/* "2/4 việc con hoàn thành" — KHÔNG quy thành 50% khối lượng (mục 8.6). */}
                        {r.subTotal > 0 && (
                          <Info>{r.subDone}/{r.subTotal} việc con xong</Info>
                        )}
                        {r.subOverdue && <Alert tone="warn">Việc con quá hạn</Alert>}
                        {r.caseLinks > 0 && <Info>{r.caseLinks} case làm căn cứ</Info>}
                      </span>
                    </td>
                    <td className="td text-slate-300">
                      {r.assigneeName ?? <span className="text-slate-600">chưa giao</span>}
                      {r.watcherName && (
                        <span className="block text-[11px] text-slate-500">theo dõi: {r.watcherName}</span>
                      )}
                    </td>
                    <td className="td whitespace-nowrap">
                      {r.due ? fmtDate(r.due) : <span className="text-slate-600">—</span>}
                      {r.overdue && <div className="mt-0.5"><Alert>Quá hạn</Alert></div>}
                    </td>
                    <td className="td">
                      <Status kind={KIND[r.progress] ?? 'idle'}>{r.progressLabel}</Status>
                      {r.stopReason && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{r.stopReason}</div>
                      )}
                      {r.reviewOn && (
                        <div className="text-[11px] text-slate-500 mt-0.5">xem lại {fmtDate(r.reviewOn)}</div>
                      )}
                    </td>
                    <td className="td text-xs text-slate-400">
                      {r.lastUpdate ? (
                        <>
                          <span className="text-slate-500 tabular-nums">{fmtDate(r.lastUpdate.on)}</span>
                          {r.lastUpdate.by && <span className="text-slate-500"> · {r.lastUpdate.by}</span>}
                          {r.lastUpdate.note && <div className="text-slate-400">{r.lastUpdate.note}</div>}
                        </>
                      ) : <span className="text-slate-600">chưa có cập nhật nào</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-3">
          <SectionNote>
            Một công việc có MỘT định danh xuyên nhiều tuần — không nhân bản mỗi tuần một bản
            sao. Việc chưa xong vẫn hiện sang tuần sau, kể cả khi hạn còn xa.
          </SectionNote>
        </div>
      </Card>

      <TaskDetail taskId={open} onClose={() => setOpen(null)} onDone={reload} />
      <CreateTask open={creating} onClose={() => setCreating(false)} onDone={reload}
        branchId={branchId} defaultGroup={preGroup || undefined} />
    </div>
  );
}

/** Chi tiết một công việc: việc con, lịch sử cập nhật, case làm căn cứ. */
function TaskDetail({ taskId, onClose, onDone }: {
  taskId: number | null; onClose: () => void; onDone: () => void;
}) {
  const { data, loading, reload } = useApi<any>(taskId ? `/mgmt-tasks/${taskId}` : null, [taskId]);
  const [updating, setUpdating] = useState(false);
  const [addingSub, setAddingSub] = useState(false);

  return (
    <Drawer open={taskId !== null} onClose={onClose} width="max-w-2xl"
      title={data?.title ?? 'Công việc'}
      subtitle={data ? `${TASK_GROUP_LABEL[data.group as keyof typeof TASK_GROUP_LABEL] ?? ''}` : undefined}>
      {loading && <Skeleton rows={6} />}
      {data && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Status kind={KIND[data.progress] ?? 'idle'}>{data.progressLabel}</Status>
            {data.overdue && <Alert>Quá hạn</Alert>}
            {data.due && <Info>Hạn {fmtDate(data.due)}</Info>}
            {data.assigneeName && <Info>{data.assigneeName}</Info>}
            {data.watcherName && <Info>theo dõi: {data.watcherName}</Info>}
          </div>
          {data.stopReason && (
            <SectionNote><strong>Lý do:</strong> {data.stopReason}
              {data.reviewOn && <> · hẹn xem lại {fmtDate(data.reviewOn)}</>}</SectionNote>
          )}
          {data.note && <p className="text-sm text-slate-300 m-0">{data.note}</p>}

          {data.viewer.canUpdate && (
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary btn-sm" onClick={() => setUpdating(true)}>Cập nhật tiến độ</button>
              {data.viewer.canEdit && (
                <button className="btn btn-sm" onClick={() => setAddingSub(true)}>+ Công việc con</button>
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
                      <span className="text-sm text-slate-100">{x.title}</span>
                      <Status kind={KIND[x.progress] ?? 'idle'}>{x.progressLabel}</Status>
                      {x.overdue && <Alert>Quá hạn</Alert>}
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
              <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Case làm căn cứ</h3>
              <ul className="list-none p-0 m-0 space-y-1 text-xs text-slate-300">
                {data.cases.map((c: any) => (
                  <li key={c.id}>{c.title} <span className="text-slate-500">· {c.student_name}</span></li>
                ))}
              </ul>
              <SectionNote>
                Liên kết này chỉ là CĂN CỨ. Hoàn thành công việc quản lý KHÔNG đóng case nào,
                và cũng không tự tạo phương án cho em nào — hai thứ có nhịp khác nhau.
              </SectionNote>
            </section>
          )}
        </div>
      )}

      {data && (
        <UpdateDialog open={updating} onClose={() => setUpdating(false)} task={data}
          onDone={() => { reload(); onDone(); }} />
      )}
      {data && (
        <CreateTask open={addingSub} onClose={() => setAddingSub(false)} parent={data}
          branchId={data.branchId} onDone={() => { reload(); onDone(); }} />
      )}
    </Drawer>
  );
}

/** Ghi một lần cập nhật — cách DUY NHẤT trạng thái công việc đổi. */
function UpdateDialog({ open, onClose, task, onDone }: {
  open: boolean; onClose: () => void; task: any; onDone: () => void;
}) {
  const toast = useToast();
  const [progress, setProgress] = useState(task.progress);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [reviewOn, setReviewOn] = useState('');
  const [busy, setBusy] = useState(false);
  const needReason = (TASK_PROGRESS_NEEDS_REASON as readonly string[]).includes(progress);

  return (
    <Modal open={open} onClose={onClose} title="Cập nhật tiến độ"
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy || (needReason && !reason.trim())}
            onClick={async () => {
              setBusy(true);
              try {
                await api.post(`/mgmt-tasks/${task.id}/update`, {
                  progress, note: note || null, reason: reason || null,
                  reviewOn: reviewOn || null,
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
              <button key={s} type="button"
                className={`btn btn-sm ${progress === s ? 'btn-primary' : ''}`}
                onClick={() => setProgress(s)}>
                {TASK_PROGRESS_LABEL[s]}
              </button>
            ))}
          </div>
        </Field>
        {needReason && (
          <Field label="Lý do" required
            hint="Một việc tự nhiên im lặng mà không ai biết vì sao là thứ vài tháng sau không ai giải thích được.">
            <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        )}
        {progress === 'paused' && (
          <Field label="Hẹn xem lại"
            hint="Tạm ngưng KHÔNG dời hạn và không xoá hạn — chỉ dừng nhắc cập nhật thường kỳ.">
            <input type="date" className="field" value={reviewOn} onChange={(e) => setReviewOn(e.target.value)} />
          </Field>
        )}
        <Field label="Ghi chú">
          <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <SectionNote>
          Mỗi lần cập nhật là một dòng riêng có người, thời điểm và ghi chú — không ghi đè lần
          trước. Tuần chỉ dùng để lọc các lần cập nhật, không nhân bản công việc.
        </SectionNote>
      </div>
    </Modal>
  );
}

function CreateTask({ open, onClose, onDone, branchId, parent, defaultGroup }: {
  open: boolean; onClose: () => void; onDone: () => void;
  branchId: number | null; parent?: any;
  /** Mở từ một mục báo cáo kỳ họp thì nhóm đã biết trước — đỡ một lần chọn và một lần chọn sai. */
  defaultGroup?: string;
}) {
  const toast = useToast();
  const people = useApi<any[]>(open ? '/ref/people' : null);
  const branches = useApi<any[]>(open ? '/ref/branches' : null);
  const [title, setTitle] = useState('');
  const [group, setGroup] = useState<string>(parent?.group ?? defaultGroup ?? 'curriculum');
  const [assignee, setAssignee] = useState('');
  const [watcher, setWatcher] = useState('');
  /*
   * HẠN VIỆC CON mặc định = hạn cha trừ MỘT NGÀY (mục 8.6), và sửa được ngay tại đây.
   * Hạn cha đã là quá khứ thì để TRỐNG chứ không đưa ra một mặc định vô nghĩa.
   */
  const defaultDue = parent?.due
    ? (() => {
      const d = new Date(parent.due); d.setDate(d.getDate() - 1);
      const iso = d.toISOString().slice(0, 10);
      return iso;
    })()
    : '';
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
                  title, group, assigneeUserId: assignee || null, watcherUserId: watcher || null,
                  due: due || null, branchId: branch || null, note: note || null,
                  parentTaskId: parent?.id ?? null,
                });
                invalidate('/mgmt-tasks');
                toast.push('ok', 'Đã tạo công việc');
                setTitle(''); setNote(''); onDone(); onClose();
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
          <select className="field" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Chưa giao</option>
            {(people.data ?? []).map((u: any) => (
              <option key={u.id} value={u.id}>{u.fullName ?? u.full_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Người theo dõi" hint="Nhìn thấy công việc nhưng KHÔNG sửa được.">
          <select className="field" value={watcher} onChange={(e) => setWatcher(e.target.value)}>
            <option value="">Không có</option>
            {(people.data ?? []).map((u: any) => (
              <option key={u.id} value={u.id}>{u.fullName ?? u.full_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Hạn"
          hint={parent ? 'Mặc định là hạn của việc cha trừ một ngày — sửa được ngay.' : undefined}>
          <input type="date" className="field" value={due} onChange={(e) => setDue(e.target.value)} />
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
