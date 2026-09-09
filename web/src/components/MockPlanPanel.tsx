import { useMemo, useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { ASSESSED_SKILLS, ASSESSED_SKILL_LABEL, type AssessedSkill } from '@shared/domain.ts';
import { Drawer } from './Drawer.tsx';
import { WeekPicker } from './Filters.tsx';
import { useToast } from './Toast.tsx';
import { Empty, Pill, SectionNote, Skeleton } from './ui.tsx';

type NoPlan = {
  studentId: number; studentName: string; studentCode: string;
  classId: number | null; classCode: string | null; branchName: string | null;
  cycleId: number; route: string | null; target: number | null;
  nextAttemptNo: number; hasPending: boolean; canPlan: boolean;
};

/**
 * LÊN KẾ HOẠCH MT HÀNG LOẠT — panel trượt từ phải, không phải một hộp thoại nhỏ.
 *
 * Quản lý lên kế hoạch cho cả lớp một lần, không phải mở từng em. Panel đủ rộng để vừa
 * thấy danh sách em, vừa đặt tuần và chọn kỹ năng, mà không phải nhớ mình vừa chọn gì.
 *
 * KỸ NĂNG YÊU CẦU chọn ngay tại đây. Bỏ tick Speaking nghĩa là lượt này NGAY TỪ ĐẦU không
 * yêu cầu Speaking — khác hẳn "có yêu cầu nhưng chưa có điểm". Lượt xong khi đủ điểm các
 * kỹ năng được yêu cầu, không chờ kỹ năng không yêu cầu.
 */
export function MockPlanPanel({ classId, branchId, onClose, onDone }: {
  classId?: number | null; branchId?: number | null; onClose: () => void; onDone?: () => void;
}) {
  /*
   * Mặc định chỉ hiện em CHƯA có tuần MT — đó là việc đang tồn.
   * Mở rộng ra cả lớp khi Quản lý muốn xếp trước lượt sau cho cả lớp trong một lần.
   */
  const [all, setAll] = useState(false);
  const qs = new URLSearchParams();
  if (classId) qs.set('classId', String(classId));
  if (branchId) qs.set('branchId', String(branchId));
  if (all) qs.set('includePlanned', '1');
  const { data, loading, reload } = useApi<{ rows: NoPlan[]; total: number; noPlanCount: number }>(
    `/attempts/no-plan${qs.toString() ? `?${qs}` : ''}`,
  );
  const toast = useToast();
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [skills, setSkills] = useState<Set<AssessedSkill>>(new Set(ASSESSED_SKILLS));
  const [busy, setBusy] = useState(false);

  const rows = data?.rows ?? [];
  const canPick = useMemo(() => rows.filter((r) => r.canPlan), [rows]);
  const chosen = useMemo(() => canPick.filter((r) => picked.has(r.studentId)), [canPick, picked]);
  // Số MT tiếp theo khác nhau giữa các em là bình thường — mỗi em theo lộ trình riêng.
  const attemptNos = useMemo(() => [...new Set(chosen.map((c) => c.nextAttemptNo))].sort(), [chosen]);

  const toggle = (id: number) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const toggleSkill = (k: AssessedSkill) => setSkills((s) => {
    const n = new Set(s);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });

  const save = async () => {
    if (!chosen.length || !periodId || !skills.size || busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ done: number; failed: { label?: string; message: string }[] }>(
        '/attempts/bulk-plan',
        { studentIds: chosen.map((c) => c.studentId), periodId, requiredSkills: [...skills] },
      );
      toast.push(r.done > 0 ? 'ok' : 'error',
        `Đã lên kế hoạch cho ${r.done} học viên${r.failed.length ? `, ${r.failed.length} em không tạo được` : ''}.`);
      for (const f of r.failed.slice(0, 3)) toast.push('error', `${f.label ?? ''}: ${f.message}`);
      invalidate('/attempts');
      invalidate('/classes');
      onDone?.();
      if (r.done > 0) onClose(); else { setPicked(new Set()); reload(); }
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-3xl"
      title="Lên kế hoạch MT"
      subtitle="Chọn nhiều học viên, đặt tuần một lần, và quyết định lượt này yêu cầu những kỹ năng nào"
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
          <button className="btn btn-primary" onClick={save} disabled={busy || !chosen.length || !periodId || !skills.size}>
            {busy ? 'Đang lưu…' : `Lên kế hoạch cho ${chosen.length} học viên`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <WeekPicker periodId={periodId} onPeriod={setPeriodId} className="w-full" label="Tuần MT" />
          <div>
            <span className="label">Số lần MT</span>
            <div className="field flex items-center text-slate-300">
              {attemptNos.length === 0 ? 'Chọn học viên trước'
                : attemptNos.length === 1 ? `MT${attemptNos[0]}`
                : `MT${attemptNos[0]}–MT${attemptNos[attemptNos.length - 1]} tuỳ từng em`}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Số lần MT tính theo lộ trình của từng em, hệ thống tự đánh — không gõ tay để khỏi lệch.
            </p>
          </div>
        </div>

        <div>
          <span className="label">Kỹ năng lượt này yêu cầu</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {ASSESSED_SKILLS.map((k) => (
              <label key={k} className={`btn btn-sm ${skills.has(k) ? 'btn-primary' : ''}`}>
                <input
                  type="checkbox" className="accent-sky-400 mr-1.5"
                  checked={skills.has(k)} onChange={() => toggleSkill(k)}
                />
                {ASSESSED_SKILL_LABEL[k]}
              </label>
            ))}
          </div>
          <SectionNote>
            Bỏ tick một kỹ năng nghĩa là lượt này <strong>không yêu cầu</strong> kỹ năng đó ngay từ đầu —
            khác hẳn “có yêu cầu nhưng chưa có điểm”. Lượt được coi là xong khi đủ điểm các kỹ năng
            được yêu cầu, và SOS cũng tính trên đúng những kỹ năng đó.
          </SectionNote>
          {skills.size === 0 && (
            <p className="text-xs text-rose-300 mt-1">
              Phải yêu cầu ít nhất một kỹ năng — một lượt không có kỹ năng nào thì không đánh giá được gì.
            </p>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <span className="label">
              {all ? 'Tất cả học viên trong phạm vi' : 'Học viên chưa có tuần MT tiếp theo'}
              {data?.noPlanCount ? ` · ${data.noPlanCount} em đang thiếu` : ''}
            </span>
            <button className="btn btn-sm" onClick={() => { setAll((v) => !v); setPicked(new Set()); }}>
              {all ? 'Chỉ em chưa có tuần MT' : 'Xem cả lớp để xếp trước'}
            </button>
            {canPick.length > 0 && (
              <button
                className="btn btn-sm"
                onClick={() => setPicked(picked.size === canPick.length ? new Set() : new Set(canPick.map((r) => r.studentId)))}
              >
                {picked.size === canPick.length ? 'Bỏ chọn tất cả' : `Chọn tất cả (${canPick.length})`}
              </button>
            )}
          </div>
          {loading ? <Skeleton rows={5} /> : rows.length === 0 ? (
            <Empty
              title="Mọi học viên đều đã có tuần MT tiếp theo"
              hint='Muốn xếp trước lượt sau cho cả lớp thì bấm "Xem cả lớp để xếp trước".'
            />
          ) : (
            <div className="surface-2 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th w-10"></th>
                    <th className="th">Học viên</th>
                    <th className="th">Lớp</th>
                    <th className="th">Lộ trình · Target</th>
                    <th className="th">MT tiếp theo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.studentId} className={`row-hover ${r.canPlan ? '' : 'row-muted'}`}>
                      <td className="td">
                        <input
                          type="checkbox" className="accent-sky-400" disabled={!r.canPlan}
                          checked={picked.has(r.studentId)} onChange={() => toggle(r.studentId)}
                          aria-label={`Chọn ${r.studentName}`}
                        />
                      </td>
                      <td className="td">
                        <div className="text-slate-100">{r.studentName}</div>
                        <div className="text-[11px] text-slate-500">{r.studentCode}</div>
                      </td>
                      <td className="td text-slate-300 whitespace-nowrap">{r.classCode ?? '—'}</td>
                      <td className="td whitespace-nowrap tabular-nums">
                        {r.route ?? '—'} · {r.target ?? '—'}
                      </td>
                      <td className="td">
                        <div className="flex flex-col items-start gap-0.5">
                          <Pill tone="info">MT{r.nextAttemptNo}</Pill>
                          {r.hasPending && <span className="text-[10px] text-slate-500">đã có lượt đang chờ</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
