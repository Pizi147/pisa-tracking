import { useState, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { fmtDate } from '../../lib/format.ts';
import {
  FOLLOWUP_OUTCOMES, INTERVENTION_KIND_LABEL, OUTCOME_MARK,
  PLAN_DECISION_CHIPS, PLAN_DECISION_HINT, PLAN_DECISION_LABEL,
  RESCHEDULE_TARGETS, RESCHEDULE_TARGET_LABEL,
  decisionBlockedReason, decisionNeedsReason, decisionsFor, interventionKindsFor, outcomeLabelFor,
  type PlanDecision,
} from '@shared/domain/index.ts';

/**
 * GHI KẾT QUẢ, CẬP NHẬT TUẦN RÚT GỌN (PR-S2 · S4 · nguồn §8). MỘT form cho hai chỗ: dòng PA ở hồ sơ học viên (`SkillBoard`)
 * và hộp thoại ở ngăn Case (`CasePanel`).
 *
 * Năm mục đúng thứ tự nguồn: kết quả hiện tại · tiến triển · vấn đề còn tồn · quyết định · ghi chú. Điều chỉnh và Thay bắt
 * lý do (ô thứ năm đổi tên thành "Lý do…"). Ràng buộc nói TRƯỚC khi bấm (nút mờ + câu thiếu gì), máy chủ vẫn kiểm lại.
 */

export type PaCanCapNhat = {
  id: number; kind: string; description: string | null; performer: string | null;
  followupDue: string | null; actionDue: string | null; cycleNo?: number | null;
};

const NUT_LUU: Record<PlanDecision, string> = {
  keep: 'Ghi kết quả, tiếp tục theo dõi',
  adjust: 'Lưu điều chỉnh',
  replace: 'Thay phương án',
  end: 'Kết thúc phương án',
  ask_manager: 'Gửi Quản lý',
};
const DA_LUU: Record<PlanDecision, string> = {
  keep: 'Đã ghi kết quả, phương án vẫn đang chạy',
  adjust: 'Đã điều chỉnh phương án, bản cũ giữ trong lịch sử',
  replace: 'Đã thay phương án',
  end: 'Đã kết thúc phương án',
  ask_manager: 'Đã chuyển sang chờ Quản lý',
};

/**
 * `variant`:
 *   'inline' (mặc định) · mở ngay dưới dòng PA ở hồ sơ học viên. Dòng PA ngay trên đã có tên và ngày, nên form không nhắc lại.
 *   'dialog' · trong hộp thoại ở ngăn Case. Dòng đầu nói rõ đang ghi cho PA nào; hàng nút ghim ở chân vùng cuộn để nút Lưu
 *             luôn thấy, kể cả màn thấp khi khối Điều chỉnh / Thay làm form dài ra.
 */
export function CapNhatTuanForm({ pa, variant = 'inline', onCancel, onSaved }: {
  pa: PaCanCapNhat; variant?: 'inline' | 'dialog'; onCancel: () => void; onSaved: () => void;
}) {
  const hopThoai = variant === 'dialog';
  const { session } = useSession();
  const toast = useToast();
  const today = session?.demoDate ?? '';
  const [outcome, setOutcome] = useState('');
  const [progress, setProgress] = useState('');
  const [remaining, setRemaining] = useState('');
  const [decision, setDecision] = useState<PlanDecision | ''>('');
  const [reason, setReason] = useState('');
  const [on, setOn] = useState(today);
  const [endOn, setEndOn] = useState(today);
  /* Điều chỉnh: mặc định là bản hiện tại. */
  const [desc, setDesc] = useState(pa.description ?? '');
  const [performer, setPerformer] = useState('');
  const [due, setDue] = useState(pa.followupDue ?? '');
  /* Thay */
  const kinds = interventionKindsFor();
  const [newKind, setNewKind] = useState<string>(kinds.selfServe[0]);
  const [newDesc, setNewDesc] = useState('');
  const [newPerformer, setNewPerformer] = useState('');
  const [newTarget, setNewTarget] = useState<string>(RESCHEDULE_TARGETS[0]);
  const [busy, setBusy] = useState(false);

  const allowed = outcome ? decisionsFor(outcome) : [];
  const pickOutcome = (o: string) => {
    setOutcome(o);
    if (decision && !decisionsFor(o).includes(decision)) setDecision('');
  };
  const needReason = !!decision && decisionNeedsReason(decision);
  const descChanged = desc.trim() !== (pa.description ?? '').trim();
  const dueChanged = !!due && due !== (pa.followupDue ?? '');
  const adjustChanged = descChanged || performer.trim() !== '' || dueChanged;

  const missing =
    !outcome ? 'Chọn kết quả hiện tại.'
    : progress.trim().length < 8 ? 'Tiến triển cần ít nhất 8 ký tự.'
    /* `max`/`min` của ô ngày không chặn ngày gõ tay, nên kiểm lại ở đây (máy chủ cũng kiểm). */
    : on && today && on > today ? 'Ngày cập nhật không được sau hôm nay.'
    : !decision ? 'Chọn quyết định.'
    : decision === 'adjust' && !adjustChanged ? 'Điều chỉnh thì phải đổi ít nhất một thứ. Không đổi gì thì chọn Giữ nguyên.'
    : decision === 'adjust' && descChanged && desc.trim().length < 8 ? 'Mô tả cần ít nhất 8 ký tự.'
    : decision === 'adjust' && dueChanged && !!on && due < on ? 'Ngày dự kiến kết thúc không được sớm hơn Ngày cập nhật.'
    : decision === 'replace' && newDesc.trim().length < 8 ? 'Mô tả phương án mới cần ít nhất 8 ký tự.'
    : decision === 'end' && endOn && today && endOn > today ? 'Ngày kết thúc không được sau hôm nay.'
    : needReason && reason.trim().length < 8 ? 'Lý do cần ít nhất 8 ký tự.'
    : null;

  const save = async () => {
    if (missing || !decision) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        decision, outcome, note: progress, observedOn: on || undefined,
        remainingIssue: remaining.trim() || undefined, decisionNote: reason.trim() || undefined,
      };
      if (decision === 'end') body.completedOn = endOn || undefined;
      if (decision === 'adjust') {
        body.adjust = {
          description: descChanged ? desc : undefined,
          performerName: performer.trim() || undefined,
          followupDue: dueChanged ? due : undefined,
        };
      }
      if (decision === 'replace') {
        body.newPlan = {
          kind: newKind, description: newDesc,
          /* Để trống = chính người đang ghi. Khai rõ bằng `performerSelf`, máy chủ không tự suy (Q13). */
          performerSelf: !newPerformer.trim(), performerName: newPerformer.trim() || undefined,
          rescheduleTarget: newKind === 'reschedule_mt' ? newTarget : null,
        };
      }
      await api.post(`/interventions/${pa.id}/result`, body);
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students'); invalidate('/overview');
      toast.push('ok', DA_LUU[decision]);
      onSaved();
    } catch (e: any) {
      toast.push('error', e?.message ?? 'Không lưu được');
    } finally { setBusy(false); }
  };

  const nhan = (text: string, phu?: string) => (
    <span className="block text-[11px] text-slate-400 mb-1">
      {text}{phu && <span className="text-slate-500"> ({phu})</span>}
    </span>
  );

  /* Nhãn ô ngày không bao giờ gãy giữa chữ ("Dự kiến kết / thúc"); hàng hẹp thì ô ngày xuống dưới nhãn. */
  const oNgay = (text: string, input: ReactNode) => (
    <label className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate-400">
      <span className="whitespace-nowrap">{text}</span>
      {input}
    </label>
  );

  return (
    <div className={`space-y-2.5 ${hopThoai ? '' : 'rounded-lg p-2.5'}`} style={hopThoai ? undefined : { background: 'var(--surface-1)' }}>
      {hopThoai && (
        <p className="text-xs text-slate-500 m-0 leading-snug break-words">
          <span className="text-slate-200">
            {pa.description || (INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? pa.kind)}
          </span>
          {pa.cycleNo && pa.cycleNo > 1 ? ` · Đợt ${pa.cycleNo}` : ''}
          {pa.actionDue ? ` · hạn cập nhật ${fmtDate(pa.actionDue)}` : ''}
        </p>
      )}

      <div>
        {nhan('1. Kết quả hiện tại')}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kết quả hiện tại">
          {FOLLOWUP_OUTCOMES.map((o) => (
            <button key={o} type="button" aria-pressed={outcome === o}
              className={`btn btn-sm ${outcome === o ? 'btn-primary' : ''}`} onClick={() => pickOutcome(o)}>
              {OUTCOME_MARK[o] ?? ''} {outcomeLabelFor(o)}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        {nhan('2. Tiến triển')}
        <textarea className="field w-full" rows={2} value={progress} onChange={(e) => setProgress(e.target.value)}
          placeholder="Tiến bộ ở đâu, còn kẹt chỗ nào" />
      </label>

      <label className="block">
        {nhan('3. Vấn đề còn tồn', 'không bắt buộc')}
        <input className="field w-full" maxLength={300} value={remaining} onChange={(e) => setRemaining(e.target.value)}
          placeholder="Ví dụ: còn sai dạng T/F/NG" />
      </label>

      <div>
        {nhan('4. Quyết định')}
        {/* Một nhóm cho cả bốn nút và nút chữ phụ "Xin hỗ trợ từ Quản lý": trình đọc màn hình đọc chung một câu hỏi. */}
        <div role="group" aria-label="Quyết định">
          <div className="flex flex-wrap gap-1.5">
            {PLAN_DECISION_CHIPS.map((d) => {
              const blocked = outcome ? decisionBlockedReason(outcome, d) : 'Chọn kết quả trước.';
              return (
                <button key={d} type="button" aria-pressed={decision === d} disabled={!!blocked}
                  title={blocked ?? PLAN_DECISION_HINT[d]}
                  className={`btn btn-sm ${decision === d ? 'btn-primary' : ''}`} onClick={() => setDecision(d)}>
                  {PLAN_DECISION_LABEL[d]}
                </button>
              );
            })}
          </div>
          {allowed.includes('ask_manager') && (
            <button type="button" aria-pressed={decision === 'ask_manager'} title={PLAN_DECISION_HINT.ask_manager}
              className={`btn btn-sm mt-1.5 ${decision === 'ask_manager' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDecision('ask_manager')}>
              {PLAN_DECISION_LABEL.ask_manager}
            </button>
          )}
        </div>
      </div>

      {decision === 'adjust' && (
        <div className="rounded-lg p-2 space-y-2 border" style={{ borderColor: 'var(--line)' }}>
          <label className="block">
            {nhan('Mô tả phương án')}
            <textarea className="field w-full" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </label>
          <label className="block">
            {nhan('Người thực hiện mới', `để trống nếu không đổi · hiện: ${pa.performer ?? 'chưa có'}`)}
            <input className="field w-full" value={performer} onChange={(e) => setPerformer(e.target.value)} />
          </label>
          {oNgay('Dự kiến kết thúc',
            <input type="date" className="field" style={{ width: '9.5rem' }} value={due} min={on || undefined}
              onChange={(e) => setDue(e.target.value)} />)}
        </div>
      )}

      {decision === 'replace' && (
        <div className="rounded-lg p-2 space-y-2 border" style={{ borderColor: 'var(--line)' }}>
          <label className="block">
            {nhan('Phương án mới')}
            <select className="field w-full" value={newKind} onChange={(e) => setNewKind(e.target.value)}>
              <optgroup label="Bạn tự làm được">
                {kinds.selfServe.map((k) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k] ?? k}</option>)}
              </optgroup>
              <optgroup label="Cần Quản lý duyệt">
                {kinds.proposals.map((k) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k] ?? k}</option>)}
              </optgroup>
            </select>
          </label>
          {newKind === 'reschedule_mt' && (
            <label className="block">
              {nhan('Lùi cái gì')}
              <select className="field w-full" value={newTarget} onChange={(e) => setNewTarget(e.target.value)}>
                {RESCHEDULE_TARGETS.map((t) => <option key={t} value={t}>{RESCHEDULE_TARGET_LABEL[t]}</option>)}
              </select>
            </label>
          )}
          <label className="block">
            {nhan('Mô tả')}
            <input className="field w-full" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Làm gì, bao nhiêu buổi, đến khi nào" />
          </label>
          <label className="block">
            {nhan('Người thực hiện', 'để trống = bạn')}
            <input className="field w-full" value={newPerformer} onChange={(e) => setNewPerformer(e.target.value)} />
          </label>
        </div>
      )}

      <label className="block">
        {nhan(`5. ${decision === 'adjust' ? 'Lý do điều chỉnh' : decision === 'replace' ? 'Lý do thay' : 'Ghi chú'}`,
          needReason ? undefined : 'không bắt buộc')}
        <input className="field w-full" value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>

      {/* Ô ngày một hàng riêng; hàng nút riêng bên dưới, nên nút không đổi chỗ khi chữ nút dài ngắn khác nhau. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {oNgay('Ngày cập nhật',
          <input type="date" className="field" style={{ width: '9.5rem' }} value={on} max={today}
            onChange={(e) => setOn(e.target.value)} />)}
        {decision === 'end' && oNgay('Ngày kết thúc',
          <input type="date" className="field" style={{ width: '9.5rem' }} value={endOn} max={today}
            onChange={(e) => setEndOn(e.target.value)} />)}
      </div>

      {/*
        Hàng nút luôn sát phải; câu báo thiếu đứng ngay bên trái nút Lưu (hàng hẹp thì nằm ngay trên nó). Câu báo cao dòng
        14px: hai dòng vừa đúng chiều cao nút (28px), nên nút không nhích khi câu dài ngắn khác nhau.
        Trong hộp thoại, hàng này ghim ở chân vùng cuộn: lề âm hai bên, lề dưới âm và `bottom` âm bù đúng khoảng đệm p-5 của
        `Modal`, nên nó luôn nằm sát đáy hộp thoại như một chân trang, nội dung cuộn chui dưới nó. Lề dưới đặt bằng `style` vì
        `space-y-*` của khối cha ghi đè `margin-bottom` của lớp tiện ích.
      */}
      <div className={`flex flex-wrap items-center justify-end gap-x-3 gap-y-1 ${
        hopThoai ? 'sticky -bottom-5 z-10 -mx-5 px-5 py-3 border-t' : ''}`}
        style={hopThoai ? { background: 'var(--surface)', borderColor: 'var(--line)', marginBottom: '-1.25rem' } : undefined}>
        {missing && <span className="flex-1 basis-40 min-w-0 text-right text-[11px] leading-[14px] text-slate-500">{missing}</span>}
        <span className="flex shrink-0 gap-1.5">
          <button type="button" className="btn btn-sm" onClick={onCancel} disabled={busy}>Huỷ</button>
          <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!missing}
            title={missing ?? undefined} onClick={save}>
            {/* Chưa chọn quyết định thì nói trung tính, không ngầm hiểu là Giữ nguyên. */}
            {busy ? 'Đang lưu…' : decision ? NUT_LUU[decision] : 'Ghi kết quả'}
          </button>
        </span>
      </div>
    </div>
  );
}

/** Một lần sửa nội dung PA, cùng hình với máy chủ (`server/src/cases/planRevisions.ts`). */
export type BanDieuChinh = {
  id: number; on: string; source: 'adjust' | 'confirm_edit'; by: string | null; reason: string;
  before: { description: string | null; performer: string | null; followupDue: string | null };
  after: { description: string | null; performer: string | null; followupDue: string | null };
};

/**
 * LỊCH SỬ ĐIỀU CHỈNH của một PA, mới nhất lên trên. Chỉ hiện trường ĐÃ ĐỔI. Dùng trong phần mở ▸ của dòng PA và trong ngăn Case
 * (G-3: dòng PA chỉ có một dòng phụ, chi tiết để ở đây).
 */
export function LichSuDieuChinh({ revisions }: { revisions: BanDieuChinh[] }) {
  if (!revisions.length) return null;
  const ngay = (d: string | null) => (d ? fmtDate(d) : 'chưa đặt');
  return (
    <ol className="list-none p-0 m-0 space-y-1.5">
      {[...revisions].reverse().map((r) => (
        /* Không viền trái riêng: danh sách ▸ bọc ngoài đã có một vạch dọc, hai vạch lồng nhau thành rối. */
        <li key={r.id} className="text-xs">
          <span className="block text-[11px] text-slate-500 tabular-nums">
            {fmtDate(r.on)} · Điều chỉnh{r.source === 'confirm_edit' ? ' khi xác nhận gợi ý' : ''}{r.by ? ` · ${r.by}` : ''}
          </span>
          <span className="block text-slate-300">Lý do: {r.reason}</span>
          {r.before.description !== r.after.description && (
            <span className="block text-slate-400 break-words">Trước: “{r.before.description ?? ''}”</span>
          )}
          {r.before.performer !== r.after.performer && (
            <span className="block text-slate-400">Người thực hiện: {r.before.performer ?? 'chưa có'} → {r.after.performer ?? 'chưa có'}</span>
          )}
          {r.before.followupDue !== r.after.followupDue && (
            <span className="block text-slate-400">Dự kiến kết thúc: {ngay(r.before.followupDue)} → {ngay(r.after.followupDue)}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
