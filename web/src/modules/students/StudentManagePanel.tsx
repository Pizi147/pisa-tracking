import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Drawer } from '../../ui/Drawer.tsx';
import { Field, SectionNote } from '../../ui/ui.tsx';
import { fmtBand, fmtDate } from '../../lib/format.ts';
import {
  BASELINE_SOURCES, BASELINE_SOURCE_LABEL, CYCLE_OUTCOMES, CYCLE_OUTCOME_LABEL,
} from '@shared/domain/index.ts';

/**
 * QUẢN LÝ HỌC VIÊN — MỘT panel cho mọi việc quản trị của một em (mục 5.1).
 *
 * Trước vòng 5, đầu hồ sơ có ba nút và thẻ kết quả có thêm ba nút nữa: "Kế hoạch học",
 * "Chuyển lớp", "Điểm đầu vào", "Đổi mục tiêu", "Kết luận lộ trình". Sáu nút cho sáu việc
 * mà mỗi năm làm một lần, xếp ngang hàng với việc làm hằng ngày là mở case. Ai nhìn vào
 * cũng phải đọc hết sáu cái tên mới tìm ra cái mình cần.
 *
 * Nay còn HAI nút ở đầu trang: "+ Case" (việc hằng ngày, giữ nguyên chỗ) và "Quản lý học
 * viên" mở panel này.
 *
 * PANEL ĐỔI NỘI DUNG NGAY BÊN TRONG, không mở modal chồng lên modal (mục 5.2): chọn một
 * việc thì phần thân thay bằng form của việc đó, và nút "← Chọn việc khác" đưa về danh sách.
 * Riêng "Kế hoạch học" là một panel lớn có sẵn — chọn nó thì panel này ĐÓNG rồi panel kia
 * mở, để không bao giờ có hai lớp panel chồng nhau.
 */
type Job = 'menu' | 'info' | 'baseline' | 'target' | 'outcome' | 'transfer';

const JOB_LABEL: Record<Exclude<Job, 'menu'>, string> = {
  info: 'Thông tin học viên',
  baseline: 'Điểm đầu vào của lộ trình',
  target: 'Đổi mục tiêu',
  outcome: 'Kết luận lộ trình',
  transfer: 'Chuyển lớp',
};
const JOB_HINT: Record<Exclude<Job, 'menu'>, string> = {
  info: 'Tên, ngày sinh, người tư vấn, ghi chú.',
  baseline: 'Em vào học ở mức nào — khác hẳn “bài Mock đầu tiên được mấy điểm”.',
  target: 'Đổi đích cần đạt, và ghi lại vì sao đổi.',
  outcome: 'Khép lại lộ trình này: có đạt mục tiêu hay không, dựa trên đâu.',
  transfer: 'Chuyển em sang lớp khác. Lượt đã xong vẫn giữ nguyên lớp cũ.',
};

export function StudentManagePanel({
  open, onClose, student, cycle, attempts, canEdit, onOpenPlan, onDone,
}: {
  open: boolean; onClose: () => void;
  student: {
    id: number; name: string; classId: number | null;
    dob?: string | null; consultantName?: string | null; note?: string | null;
  };
  cycle: any | null;
  attempts: any[];
  canEdit: boolean;
  /** Mở panel Kế hoạch học — panel này tự đóng trước để không chồng lớp. */
  onOpenPlan: () => void;
  onDone: () => void;
}) {
  const [job, setJob] = useState<Job>('menu');
  const close = () => { onClose(); setJob('menu'); };

  /*
   * BỐN VIỆC CỦA MENU ⋮ (mục 6.4): Thông tin · Lộ trình · Chuyển lớp · Kết luận lộ trình.
   *
   * "Lộ trình" gồm đầu vào, mục tiêu, dự kiến thi và lịch MT — nên ở đây nó tách thành mấy
   * mục con thay vì một mục gộp mơ hồ. Lớp Normal không có target hay đầu vào IELTS nên hai
   * mục đó không hiện: một mục bấm vào rồi mới biết không dùng được là một mục thừa.
   */
  const jobs: Exclude<Job, 'menu'>[] = cycle
    ? (cycle.ratio ? ['info', 'outcome', 'transfer'] : ['info', 'baseline', 'target', 'outcome', 'transfer'])
    : ['info', 'transfer'];

  return (
    <Drawer open={open} onClose={close} width="max-w-xl"
      title={job === 'menu' ? 'Quản lý học viên' : JOB_LABEL[job]}
      subtitle={student.name}>
      {job === 'menu' ? (
        <div className="space-y-2">
          {/*
            KẾ HOẠCH HỌC đứng đầu vì nó là việc hay dùng nhất trong nhóm này, và nó là việc
            duy nhất phải mở sang panel khác.
          */}
          {canEdit && cycle && (
            <MenuItem
              label="Kế hoạch học"
              hint="Tuần bắt đầu học, lịch các mốc đánh giá, tuần thi dự kiến."
              onClick={() => { close(); onOpenPlan(); }}
            />
          )}
          {canEdit ? jobs.map((k) => (
            <MenuItem key={k} label={JOB_LABEL[k]} hint={JOB_HINT[k]} onClick={() => setJob(k)} />
          )) : (
            <SectionNote>
              Bạn không có quyền sửa hồ sơ của em này. Vẫn xem được mọi thông tin, và vẫn mở
              được case mới từ nút “+ Case”.
            </SectionNote>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <button className="btn btn-sm btn-ghost" onClick={() => setJob('menu')}>← Chọn việc khác</button>
          {job === 'transfer'
            ? <TransferForm studentId={student.id} currentClassId={student.classId}
                onDone={() => { onDone(); close(); }} />
            : job === 'info'
              ? <InfoForm student={student} onDone={() => { onDone(); close(); }} />
              : <CycleForm kind={job} cycle={cycle} attempts={attempts}
                  onDone={() => { onDone(); close(); }} />}
        </div>
      )}
    </Drawer>
  );
}

function MenuItem({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left rounded-lg border px-3 py-2.5 bg-transparent hover:brightness-125"
      style={{ borderColor: 'var(--line)' }}>
      <span className="block text-sm text-slate-100">{label}</span>
      <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>
    </button>
  );
}

// ==================================================================== các form

function CycleForm({ kind, cycle, attempts, onDone }: {
  kind: 'baseline' | 'target' | 'outcome'; cycle: any; attempts: any[]; onDone: () => void;
}) {
  const toast = useToast();
  const [source, setSource] = useState(cycle?.baseline?.source ?? 'entrance');
  const [score, setScore] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [note, setNote] = useState('');
  const [newTarget, setNewTarget] = useState(cycle?.target !== null && cycle?.target !== undefined ? String(cycle.target) : '');
  const [reason, setReason] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [outcome, setOutcome] = useState(cycle?.outcome?.outcome ?? 'unknown');
  const [busy, setBusy] = useState(false);

  const done = attempts.filter((a) => a.status !== 'cancelled');

  const submit = async () => {
    setBusy(true);
    try {
      if (kind === 'baseline') {
        await api.put(`/cycles/${cycle.id}/baseline`, {
          source, note,
          attemptId: attemptId ? Number(attemptId) : undefined,
          score: attemptId ? undefined : score,
        });
      } else if (kind === 'target') {
        await api.post(`/cycles/${cycle.id}/target-revision`, {
          newTarget: newTarget === '' ? null : Number(newTarget),
          reason, effectiveFrom: effectiveFrom || undefined,
        });
      } else {
        await api.put(`/cycles/${cycle.id}/outcome`, {
          outcome, note, attemptId: attemptId ? Number(attemptId) : undefined,
          score: attemptId ? undefined : score || undefined,
        });
      }
      invalidate('/students'); onDone(); toast.push('ok', 'Đã lưu');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const attemptOptions = (
    <Field label="Chọn một bài đã có"
      hint="Hoặc bỏ trống và nhập điểm bên dưới nếu điểm đến từ ngoài hệ thống.">
      <select className="field" value={attemptId} onChange={(e) => setAttemptId(e.target.value)}>
        <option value="">Không lấy từ bài nào</option>
        {done.map((a) => (
          <option key={a.id} value={a.id}>
            MT{a.attemptNo}{a.overall !== null ? ` · Overall ${a.overall}` : ''}
          </option>
        ))}
      </select>
    </Field>
  );

  return (
    <div className="space-y-3">
      {kind === 'baseline' && (
        <>
          <Field label="Điểm này lấy từ đâu" required>
            <select className="field" value={source} onChange={(e) => setSource(e.target.value)}>
              {BASELINE_SOURCES.map((s) => <option key={s} value={s}>{BASELINE_SOURCE_LABEL[s]}</option>)}
            </select>
          </Field>
          {attemptOptions}
          {!attemptId && (
            <Field label="Điểm đầu vào" required>
              <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
                value={score} onChange={(e) => setScore(e.target.value)} />
            </Field>
          )}
          <Field label="Ghi chú">
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Điểm IELTS thi tại BC tháng 3/2026" />
          </Field>
          <SectionNote>
            Hệ thống KHÔNG tự lấy MT1 làm điểm đầu vào. “Em vào học ở mức nào” là câu hỏi khác
            hẳn “bài Mock đầu tiên được mấy điểm”.
          </SectionNote>
        </>
      )}

      {kind === 'target' && (
        <>
          <Field label="Mục tiêu mới" required>
            <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
              value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
          </Field>
          <Field label="Lý do" required
            hint="Vài tháng sau, đây là thứ duy nhất giải thích vì sao mục tiêu đổi.">
            <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Gia đình lùi kế hoạch du học sang năm sau" />
          </Field>
          <Field label="Có hiệu lực từ ngày">
            <input type="date" className="field" value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)} />
          </Field>
          <SectionNote>
            Các lượt đã chốt GIỮ NGUYÊN kỳ vọng tính theo mục tiêu lúc đó. Đổi mục tiêu không
            chấm lại quá khứ.
          </SectionNote>
        </>
      )}

      {kind === 'outcome' && (
        <>
          <Field label="Kết luận" required>
            <select className="field" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              {CYCLE_OUTCOMES.map((o) => <option key={o} value={o}>{CYCLE_OUTCOME_LABEL[o]}</option>)}
            </select>
          </Field>
          {attemptOptions}
          {!attemptId && (
            <Field label="Điểm cuối" hint="Ví dụ điểm IELTS chính thức em báo về.">
              <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
                value={score} onChange={(e) => setScore(e.target.value)} />
            </Field>
          )}
          <Field label="Ghi chú">
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <SectionNote>
            Đóng lộ trình chỉ nói “không học theo lộ trình này nữa”. Có đạt mục tiêu hay không
            là kết luận riêng, và “chưa có căn cứ” là một câu trả lời hợp lệ.
          </SectionNote>
        </>
      )}

      {cycle?.target !== null && cycle?.target !== undefined && kind !== 'target' && (
        <p className="text-xs text-slate-500 m-0">Mục tiêu hiện tại: {fmtBand(cycle.target)}</p>
      )}
      <button className="btn btn-primary" onClick={submit} disabled={busy}>
        {busy ? 'Đang lưu…' : 'Lưu'}
      </button>
    </div>
  );
}

/** Thông tin cá nhân — chỗ SỬA những thứ mà hồ sơ đang báo là thiếu (mục 6.4). */
function InfoForm({ student, onDone }: {
  student: { id: number; name: string; dob?: string | null; consultantName?: string | null; note?: string | null };
  onDone: () => void;
}) {
  const toast = useToast();
  const [fullName, setFullName] = useState(student.name);
  const [dob, setDob] = useState(student.dob ?? '');
  const [consultantName, setConsultant] = useState(student.consultantName ?? '');
  const [note, setNote] = useState(student.note ?? '');
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3">
      <Field label="Họ tên" required>
        <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Ngày sinh">
        <input type="date" className="field" value={dob} onChange={(e) => setDob(e.target.value)} />
      </Field>
      <Field label="Người tư vấn">
        <input className="field" value={consultantName} onChange={(e) => setConsultant(e.target.value)} />
      </Field>
      <Field label="Ghi chú">
        <textarea className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <SectionNote>
        Mục tiêu, dự kiến thi và lịch MT KHÔNG nằm ở đây — chúng thuộc về lộ trình, sửa ở mục
        “Kế hoạch học” và “Đổi mục tiêu”.
      </SectionNote>
      <button className="btn btn-primary" disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api.patch(`/students/${student.id}`, {
              fullName, dob: dob || null,
              consultantName: consultantName || null, note: note || null,
            });
            invalidate('/students'); onDone(); toast.push('ok', 'Đã lưu');
          } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
        }}>
        {busy ? 'Đang lưu…' : 'Lưu'}
      </button>
    </div>
  );
}

function TransferForm({ studentId, currentClassId, onDone }: {
  studentId: number; currentClassId: number | null; onDone: () => void;
}) {
  const toast = useToast();
  const classes = useApi<any[]>('/ref/classes');
  /* Những thứ còn dở của em — bày sẵn để người chuyển không phải tự nhớ và chép lại. */
  const brief = useApi<{ cases: any[]; openPlans: number }>(`/students/${studentId}/handover`, [studentId]);
  const people = useApi<any[]>('/ref/people');
  const [toClassId, setToClassId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [handoverNote, setHandoverNote] = useState('');
  const [receiverUserId, setReceiver] = useState('');
  const [busy, setBusy] = useState(false);

  const openCases = brief.data?.cases ?? [];
  const needHandover = openCases.length > 0;

  const submit = async () => {
    if (!toClassId) { toast.push('error', 'Cần chọn lớp đích.'); return; }
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/transfer`, {
        toClassId, effectiveDate: date || undefined, reason,
        handoverNote: handoverNote || undefined,
        receiverUserId: receiverUserId || undefined,
      });
      invalidate('/students'); invalidate('/attempts'); invalidate('/overview'); invalidate('/cases');
      onDone(); toast.push('ok', 'Đã chuyển lớp');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <Field label="Lớp đích" required>
        <select className="field" value={toClassId ?? ''}
          onChange={(e) => setToClassId(Number(e.target.value) || null)}>
          <option value="">Chọn lớp…</option>
          {(classes.data ?? []).filter((c) => c.id !== currentClassId).map((c) => (
            <option key={c.id} value={c.id}>{c.code} · {c.branch_name}</option>
          ))}
        </select>
      </Field>
      <Field label="Ngày hiệu lực">
        <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Lý do">
        <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      {/*
        THÔNG TIN BÀN GIAO — bắt buộc khi em còn case dở (mục 6.4).

        Chuyển lớp xong mà không bàn giao thì case còn mở rơi vào khoảng trống: cô cũ không
        còn dạy em, cô mới không biết em đang dở chuyện gì. Danh sách bên dưới bày sẵn đúng
        những thứ đang dở, nên người chuyển chỉ cần dặn thêm, không phải chép lại.
      */}
      {needHandover && (
        <div className="surface-2 rounded-lg p-3 space-y-2">
          <span className="label m-0">Thông tin bàn giao</span>
          <ul className="text-xs text-slate-300 list-none p-0 m-0 space-y-1">
            {openCases.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2">
                <span className="text-slate-100">{c.title}</span>
                <span className="text-slate-500">
                  {c.ownerName ?? 'chưa có người phụ trách'}
                  {c.openPlans > 0 ? ` · ${c.openPlans} phương án đang chạy` : ' · chưa có phương án'}
                  {c.nextDue ? ` · hạn ${fmtDate(c.nextDue)}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <Field label="Dặn người nhận" required
            hint="Cô mới nhận lớp sẽ đọc đúng dòng này để biết em đang vướng gì.">
            <textarea className="field" rows={2} value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              placeholder="Em đang dở phương án Reading, tuần sau có buổi tutor đã hẹn." />
          </Field>
          <Field label="Người tiếp nhận"
            hint="Chọn thì các case còn mở đổi người phụ trách sang người này. Lịch sử ai đã làm gì vẫn giữ nguyên.">
            <select className="field" value={receiverUserId} onChange={(e) => setReceiver(e.target.value)}>
              <option value="">Giữ nguyên người phụ trách hiện tại</option>
              {(people.data ?? []).map((u: any) => (
                <option key={u.id} value={u.id}>{u.fullName ?? u.full_name}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <SectionNote>
        Lượt chưa xong sẽ chuyển sang lớp mới. Lượt đã xong giữ nguyên lớp cũ để không viết
        lại lịch sử.
      </SectionNote>
      <button className="btn btn-primary" onClick={submit} disabled={busy}>
        {busy ? 'Đang chuyển…' : 'Chuyển lớp'}
      </button>
    </div>
  );
}
