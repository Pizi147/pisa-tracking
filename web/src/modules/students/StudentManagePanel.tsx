import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Drawer } from '../../ui/Drawer.tsx';
import { Field, SectionNote } from '../../ui/ui.tsx';
import { fmtBand, fmtDate } from '../../lib/format.ts';
import {
  CYCLE_OUTCOMES, CYCLE_OUTCOME_LABEL,
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
/*
 * ĐÚNG BỐN MỤC, ĐÚNG THỨ TỰ NÀY (mục 5.1) — với lớp Fast Track:
 *
 *   1. Thông tin học viên    2. Lộ trình    3. Chuyển lớp    4. Kết luận lộ trình
 *
 * Vòng trước menu có SÁU mục, trong đó "Điểm đầu vào" và "Đổi mục tiêu" là hai mục riêng
 * cho hai ô dữ liệu thuộc về cùng một thứ — cái lộ trình. Kết quả là để sửa mục tiêu, người
 * dùng phải đoán xem nó nằm ở "Kế hoạch học" hay ở "Đổi mục tiêu". Nay cả hai về đúng chỗ
 * của chúng: mục Lộ trình.
 *
 * LỚP NORMAL KHÔNG CÓ MỤC LỘ TRÌNH (mục 5.3): không target IELTS, không LT1/LT2, giai đoạn
 * là chương trình Foundation/Beginner/Elementary và nằm ngay trong Thông tin học viên. Lịch
 * test Normal chỉnh từ màn lớp, không đi qua Lịch Mock Test của Fast Track.
 */
type Job = 'menu' | 'info' | 'outcome' | 'transfer';

const JOB_LABEL: Record<Exclude<Job, 'menu'>, string> = {
  info: 'Thông tin học viên',
  outcome: 'Kết luận lộ trình',
  transfer: 'Chuyển lớp',
};
const JOB_HINT: Record<Exclude<Job, 'menu'>, string> = {
  info: 'Họ tên, ngày sinh, người tư vấn, và thông tin giai đoạn đang học.',
  outcome: 'Khép lại lộ trình này: kết quả thi thật và kết luận có đạt mục tiêu hay không.',
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

  const ratio = !!cycle?.ratio;

  return (
    <Drawer open={open} onClose={close} width="max-w-xl"
      title={job === 'menu' ? 'Quản lý học viên' : JOB_LABEL[job]}
      subtitle={student.name}>
      {job === 'menu' ? (
        <div className="space-y-2">
          {!canEdit ? (
            <SectionNote>
              Bạn không có quyền sửa hồ sơ của học viên này. Vẫn xem được mọi thông tin, và vẫn mở
              được case mới từ nút “+ Case”.
            </SectionNote>
          ) : (
            <>
              <MenuItem label={JOB_LABEL.info} hint={JOB_HINT.info} onClick={() => setJob('info')} />
              {/*
                LỘ TRÌNH — mục 2 của Fast Track, thay cho "Kế hoạch học" cũ. Gồm tuần bắt đầu,
                kế hoạch thi thật, mục tiêu, điểm đầu vào và bảng các MT với lịch từng kỹ năng.
                Lớp Normal KHÔNG có mục này (mục 5.3).
              */}
              {cycle && !ratio && (
                <MenuItem
                  label="Lộ trình"
                  hint="Tuần bắt đầu học, kế hoạch thi thật, mục tiêu, điểm đầu vào, và lịch các đợt MT."
                  onClick={() => { close(); onOpenPlan(); }}
                />
              )}
              <MenuItem label={JOB_LABEL.transfer} hint={JOB_HINT.transfer} onClick={() => setJob('transfer')} />
              {cycle && (
                <MenuItem label={JOB_LABEL.outcome} hint={JOB_HINT.outcome} onClick={() => setJob('outcome')} />
              )}
              {ratio && (
                <SectionNote>
                  Lớp Normal không có mục Lộ trình riêng: không có target IELTS và không có LT1/LT2.
                  Giai đoạn là chương trình đang học, nằm trong <strong>Thông tin học viên</strong>;
                  lịch kiểm tra chỉnh từ màn hình lớp.
                </SectionNote>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <button className="btn btn-sm btn-ghost" onClick={() => setJob('menu')}>← Chọn việc khác</button>
          {job === 'transfer'
            ? <TransferForm studentId={student.id} currentClassId={student.classId}
                onDone={() => { onDone(); close(); }} />
            : job === 'info'
              ? <InfoForm student={student} cycle={cycle} onDone={() => { onDone(); close(); }} />
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

/**
 * KẾT LUẬN LỘ TRÌNH — mục 4 của menu (mục 5.1).
 *
 * Ba thay đổi so với bản trước, và mỗi cái sửa một câu nói sai:
 *
 * 1. BỎ "CHỌN MỘT BÀI ĐÃ CÓ". Một lượt Mock Test không phải một kỳ thi IELTS: nó chấm nội
 *    bộ, không có phòng thi, không có chứng chỉ. Lấy điểm MT làm kết quả thi thật là ghi
 *    vào hồ sơ một điều chưa xảy ra. Kết quả thật là con số em báo về từ BC hay IDP.
 * 2. NÓI RÕ CÒN GÌ PHẢI BÀN GIAO. Kết thúc lộ trình KHÔNG đóng hộ các case chưa xử lý và
 *    càng không đánh dấu chúng là thành công — nên người kết luận phải nhìn thấy chúng ngay
 *    tại đây, trước khi bấm.
 * 3. HỌC LẠI LÀ MỘT LỘ TRÌNH MỚI, không phải đổi nhãn lộ trình cũ. Giữ định danh giai đoạn
 *    thì lịch sử mới đọc được là em đã đi qua hai chặng.
 */
function CycleForm({ kind, cycle, attempts, onDone }: {
  kind: 'outcome'; cycle: any; attempts: any[]; onDone: () => void;
}) {
  const toast = useToast();
  const [outcome, setOutcome] = useState(cycle?.outcome?.outcome ?? 'unknown');
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  void attempts;
  void kind;

  /* Case còn mở của chính em này — thứ phải bàn giao chứ không biến mất khi lộ trình khép. */
  const open = useApi<{ rows: any[] }>(`/cases?studentId=${cycle?.studentId ?? ''}&status=open`,
    [cycle?.studentId]);
  const pending = (open.data?.rows ?? []).filter((c: any) => c.status !== 'done');

  const submit = async () => {
    setBusy(true);
    try {
      await api.put(`/cycles/${cycle.id}/outcome`, {
        outcome, note, score: score || undefined,
      });
      invalidate('/students'); onDone(); toast.push('ok', 'Đã lưu');
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <Field label="Kết luận" required>
        <select className="field" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          {CYCLE_OUTCOMES.map((o) => <option key={o} value={o}>{CYCLE_OUTCOME_LABEL[o]}</option>)}
        </select>
      </Field>

      {!cycle?.ratio ? (
        <>
          <Field label="Điểm IELTS thật (Overall)"
            hint="Con số em báo về từ phòng thi. Chưa thi thì để trống — “chưa có căn cứ” là một câu trả lời hợp lệ.">
            <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
              value={score} onChange={(e) => setScore(e.target.value)} />
          </Field>
          <SectionNote>
            KHÔNG lấy một lượt Mock Test làm kết quả thi thật. MT chấm nội bộ, không có phòng
            thi và không có chứng chỉ — ghi nó vào đây là nói em đã thi trong khi em chưa thi.
          </SectionNote>
        </>
      ) : (
        <SectionNote>
          Lớp Normal kết luận theo <strong>Final Test</strong> của đúng đợt cuối, đủ cả bốn môn
          L/R/W/S — kể cả khi đợt đó thi rải ra nhiều tuần. Thiếu một môn thì đợt vẫn là chưa
          đủ: môn thiếu KHÔNG được tính bằng 0 và cũng không tự chốt hộ.
        </SectionNote>
      )}

      <Field label="Ghi chú">
        <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      {/* CÒN GÌ PHẢI BÀN GIAO — nhìn thấy trước khi bấm, không phải sau. */}
      {pending.length > 0 && (
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--warn, #fbbf24)' }}>
          <p className="text-sm text-amber-200 m-0">
            Còn {pending.length} vấn đề chưa kết luận. Khép lộ trình KHÔNG đóng hộ chúng và
            không đánh dấu là đã xử lý xong — chúng đi theo em sang giai đoạn sau.
          </p>
          <ul className="list-disc pl-5 mt-1 mb-0">
            {pending.slice(0, 6).map((c: any) => (
              <li key={c.id} className="text-xs text-slate-300">{c.title ?? c.headline}</li>
            ))}
          </ul>
        </div>
      )}

      <SectionNote>
        Đóng lộ trình chỉ nói “không học theo lộ trình này nữa”. Có đạt mục tiêu hay không là
        kết luận riêng. Em học lại thì mở một lộ trình MỚI — không đổi nhãn lộ trình cũ rồi
        kéo lịch sử sang, vì như thế hai chặng biến thành một.
      </SectionNote>

      <button className="btn btn-primary" onClick={submit} disabled={busy}>
        {busy ? 'Đang lưu…' : 'Lưu'}
      </button>
    </div>
  );
}

/**
 * THÔNG TIN HỌC VIÊN — mục 1 của menu (mục 5.1).
 *
 * Với lớp Fast Track, mục tiêu và kế hoạch thi thật sửa được ở CẢ ĐÂY lẫn ở mục Lộ trình.
 * Đó là chủ ý của mục 5.2: cùng một dữ liệu, cùng một phép kiểm, không hai nguồn sự thật —
 * nên ở đâu cũng đi qua đúng một đường của máy chủ, và sửa mục tiêu ở đâu cũng hỏi lý do và
 * ngày hiệu lực.
 *
 * Với lớp Normal thì đây là chỗ DUY NHẤT nói về giai đoạn đang học, vì Normal không có mục
 * Lộ trình (mục 5.3): không target IELTS, không LT1/LT2.
 */
function InfoForm({ student, cycle, onDone }: {
  student: { id: number; name: string; dob?: string | null; consultantName?: string | null; note?: string | null };
  cycle: any | null;
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
      {/*
        GIAI ĐOẠN ĐANG HỌC. Lớp Normal đọc ở đây là hết — nó không có mục Lộ trình. Lớp Fast
        Track đọc ở đây để nhận biết, còn sửa thì ở mục Lộ trình, nơi có đủ mục tiêu, kế
        hoạch thi thật và bảng MT trong một màn.
      */}
      {cycle && (
        <div className="rounded-lg border p-3 space-y-1" style={{ borderColor: 'var(--line)' }}>
          <span className="label m-0">Giai đoạn đang học</span>
          {cycle.ratio ? (
            <>
              <p className="text-sm text-slate-200 m-0">
                {cycle.programmeName ?? cycle.label}
                {cycle.startWeek && <span className="text-slate-500"> · bắt đầu {cycle.startWeek.code}</span>}
                {cycle.endWeek && <span className="text-slate-500"> · kết thúc {cycle.endWeek.code}</span>}
              </p>
              <SectionNote>
                Lớp Normal không có target IELTS và không có LT1/LT2. Giai đoạn là chương trình
                đang học; tuần kết thúc suy ra từ tuần bắt đầu và độ dài chương trình. Lịch kiểm
                tra chỉnh từ màn hình lớp, không đi qua Lịch Mock Test của Fast Track.
              </SectionNote>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-200 m-0">
                {cycle.label}
                {cycle.target !== null && cycle.target !== undefined
                  && <span className="text-slate-500"> · mục tiêu {fmtBand(cycle.target)}</span>}
                {cycle.startWeek && <span className="text-slate-500"> · vào học {cycle.startWeek.code}</span>}
                {cycle.examPlan?.confidence !== 'none'
                  && <span className="text-slate-500"> · dự kiến thi {cycle.examPlan?.label}</span>}
              </p>
              <SectionNote>
                Sửa mục tiêu, kế hoạch thi thật, điểm đầu vào và lịch MT ở mục <strong>Lộ trình</strong> —
                ở đó chúng nằm cạnh nhau nên nhìn được ảnh hưởng của nhau. Đổi mục tiêu ở đâu cũng
                bắt ghi lý do và ngày hiệu lực.
              </SectionNote>
            </>
          )}
        </div>
      )}
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
