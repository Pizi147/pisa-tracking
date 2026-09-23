import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Drawer } from '../../ui/Drawer.tsx';
import { Field, SectionNote } from '../../ui/ui.tsx';
import { fmtBand } from '../../lib/format.ts';
import { CYCLE_OUTCOMES, CYCLE_OUTCOME_LABEL } from '@shared/domain/index.ts';
import { LoTrinhTiepForm } from './LoTrinhTiepPanel.tsx';
import { ChuyenLopForm } from './ChuyenLopPanel.tsx';

/**
 * QUẢN LÝ HỌC VIÊN — MỘT panel cho mọi việc quản trị của một em (mục 5.1).
 *
 * Trước vòng 5, đầu hồ sơ có ba nút và thẻ kết quả có thêm ba nút nữa. Nay còn HAI nút ở đầu
 * trang: "+ Case" (việc hằng ngày, giữ nguyên chỗ) và "Quản lý học viên" mở panel này.
 *
 * PANEL ĐỔI NỘI DUNG NGAY BÊN TRONG, không mở modal chồng lên modal (mục 5.2): chọn một
 * việc thì phần thân thay bằng form của việc đó, và nút "← Chọn việc khác" đưa về danh sách.
 * Riêng "Kế hoạch học" là một panel lớn có sẵn — chọn nó thì panel này ĐÓNG rồi panel kia
 * mở, để không bao giờ có hai lớp panel chồng nhau.
 *
 * PR-LT (mockup 12-C, §3.9.2, Q2, Q15, Q22) — thứ tự đúng: Thông tin học viên · Lộ trình tiếp
 * theo (lớp thường) · Lộ trình (FT) · Chuyển lớp · Kết luận lộ trình (CHỈ FT, Q15) · nhóm trạng
 * thái (Tạm dừng/Quay lại/Kết thúc học) · Lưu trữ/Bỏ lưu trữ (chỉ QL, chỉ em đã kết thúc).
 */
type Job = 'menu' | 'info' | 'outcome' | 'lo-trinh-tiep' | 'chuyen-lop' | 'tam-dung' | 'quay-lai' | 'ket-thuc' | 'luu-tru' | 'bo-luu-tru';

const JOB_LABEL: Record<Exclude<Job, 'menu'>, string> = {
  info: 'Thông tin học viên',
  outcome: 'Kết luận lộ trình',
  'lo-trinh-tiep': 'Lộ trình tiếp theo',
  'chuyen-lop': 'Chuyển lớp',
  'tam-dung': 'Tạm dừng học',
  'quay-lai': 'Quay lại học',
  'ket-thuc': 'Kết thúc học',
  'luu-tru': 'Lưu trữ',
  'bo-luu-tru': 'Bỏ lưu trữ',
};
const JOB_HINT: Record<Exclude<Job, 'menu'>, string> = {
  info: 'Họ tên, ngày sinh, người tư vấn, và thông tin giai đoạn đang học.',
  outcome: 'Khép lại lộ trình này: kết quả thi thật và kết luận có đạt mục tiêu hay không.',
  'lo-trinh-tiep': 'Ghi dự định sau lớp đang học — chưa đổi lớp ngay.',
  'chuyen-lop': 'Chuyển em sang lớp khác, kể cả chi nhánh khác. Lượt đã xong vẫn giữ nguyên lớp cũ.',
  'tam-dung': 'Em nghỉ một thời gian, giữ lớp và lộ trình để quay lại sau.',
  'quay-lai': 'Em quay lại học bình thường.',
  'ket-thuc': 'Em thôi học hẳn. Case còn mở sẽ được hệ thống tự đóng.',
  'luu-tru': 'Ẩn hồ sơ khỏi danh sách chính — chỉ em đã kết thúc học.',
  'bo-luu-tru': 'Đưa hồ sơ trở lại danh sách chính.',
};

export type LopHocQuyen = {
  ghiLoTrinhTiep: boolean; chuyenLop: boolean; tamDung: boolean; quayLai: boolean;
  ketThuc: boolean; luuTru: boolean; boLuuTru: boolean;
};

export function StudentManagePanel({
  open, onClose, student, cycle, attempts, canEdit, lopHoc, onOpenPlan, onDone,
}: {
  open: boolean; onClose: () => void;
  student: {
    id: number; name: string; classId: number | null;
    dob?: string | null; consultantName?: string | null; note?: string | null; status?: string;
  };
  cycle: any | null;
  attempts: any[];
  canEdit: boolean;
  lopHoc?: { quyen: LopHocQuyen; chiXem: boolean } | null;
  /** Mở panel Kế hoạch học — panel này tự đóng trước để không chồng lớp. */
  onOpenPlan: () => void;
  onDone: () => void;
}) {
  const [job, setJob] = useState<Job>('menu');
  const close = () => { onClose(); setJob('menu'); };
  const xong = () => { onDone(); close(); };

  const ratio = !!cycle?.ratio;
  const quyen = lopHoc?.quyen;
  const dangHoc = student.status === 'active';

  return (
    <Drawer open={open} onClose={close} width="max-w-xl"
      title={job === 'menu' ? 'Quản lý học viên' : JOB_LABEL[job]}
      subtitle={student.name}>
      {job === 'menu' ? (
        <div className="space-y-2">
          {!canEdit && !quyen?.boLuuTru ? (
            <SectionNote>
              Bạn không có quyền sửa hồ sơ của học viên này. Vẫn xem được mọi thông tin, và vẫn mở
              được case mới từ nút “+ Case”.
            </SectionNote>
          ) : (
            <>
              {canEdit && <MenuItem label={JOB_LABEL.info} hint={JOB_HINT.info} onClick={() => setJob('info')} />}
              {/* LỘ TRÌNH TIẾP THEO — chỉ lớp thường, chỉ khi ghi được (Q2). */}
              {quyen?.ghiLoTrinhTiep && (
                <MenuItem label={JOB_LABEL['lo-trinh-tiep']} hint={JOB_HINT['lo-trinh-tiep']} onClick={() => setJob('lo-trinh-tiep')} />
              )}
              {/*
                LỘ TRÌNH — mục của Fast Track, thay cho "Kế hoạch học" cũ. Lớp Normal KHÔNG có
                mục này (mục 5.3) — thay bằng "Lộ trình tiếp theo" ở trên.
              */}
              {canEdit && cycle && !ratio && (
                <MenuItem
                  label="Lộ trình"
                  hint="Tuần bắt đầu học, kế hoạch thi thật, mục tiêu, điểm đầu vào, và lịch các đợt MT."
                  onClick={() => { close(); onOpenPlan(); }}
                />
              )}
              {quyen?.chuyenLop && (
                <MenuItem label={JOB_LABEL['chuyen-lop']} hint={JOB_HINT['chuyen-lop']} onClick={() => setJob('chuyen-lop')} />
              )}
              {/* KẾT LUẬN LỘ TRÌNH — CHỈ Fast Track (Q15); lớp thường không còn mục này. */}
              {canEdit && cycle && !ratio && (
                <MenuItem label={JOB_LABEL.outcome} hint={JOB_HINT.outcome} onClick={() => setJob('outcome')} />
              )}
              {quyen?.tamDung && dangHoc && (
                <MenuItem label={JOB_LABEL['tam-dung']} hint={JOB_HINT['tam-dung']} onClick={() => setJob('tam-dung')} />
              )}
              {quyen?.quayLai && !dangHoc && student.status === 'inactive' && (
                <MenuItem label={JOB_LABEL['quay-lai']} hint={JOB_HINT['quay-lai']} onClick={() => setJob('quay-lai')} />
              )}
              {quyen?.ketThuc && student.status !== 'finished' && (
                <MenuItem label={JOB_LABEL['ket-thuc']} hint={JOB_HINT['ket-thuc']} onClick={() => setJob('ket-thuc')} />
              )}
              {quyen?.luuTru && (
                <MenuItem label={JOB_LABEL['luu-tru']} hint={JOB_HINT['luu-tru']} onClick={() => setJob('luu-tru')} />
              )}
              {quyen?.boLuuTru && (
                <MenuItem label={JOB_LABEL['bo-luu-tru']} hint={JOB_HINT['bo-luu-tru']} onClick={() => setJob('bo-luu-tru')} />
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <button className="btn btn-sm btn-ghost" onClick={() => setJob('menu')}>← Chọn việc khác</button>
          {job === 'lo-trinh-tiep' ? <LoTrinhTiepForm studentId={student.id} onDone={xong} />
            : job === 'chuyen-lop' ? <ChuyenLopForm studentId={student.id} onDone={xong} />
            : job === 'tam-dung' ? <TrangThaiForm studentId={student.id} status="inactive" onDone={xong} />
            : job === 'quay-lai' ? <TrangThaiForm studentId={student.id} status="active" onDone={xong} />
            : job === 'ket-thuc' ? <TrangThaiForm studentId={student.id} status="finished" onDone={xong} />
            : job === 'luu-tru' ? <LuuTruForm studentId={student.id} boLuuTru={false} onDone={xong} />
            : job === 'bo-luu-tru' ? <LuuTruForm studentId={student.id} boLuuTru onDone={xong} />
            : job === 'info'
              ? <InfoForm student={student} cycle={cycle} onDone={xong} />
              : <CycleForm kind={job} cycle={cycle} attempts={attempts} onDone={xong} />}
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
 * TẠM DỪNG HỌC / QUAY LẠI HỌC / KẾT THÚC HỌC (PR-LT, §3.9.4, Q9). Cùng một form, ba trạng
 * thái — lý do bắt buộc khi dừng/kết thúc; ngày tuỳ chọn (mặc định hôm nay ở máy chủ).
 */
function TrangThaiForm({ studentId, status, onDone }: {
  studentId: number; status: 'active' | 'inactive' | 'finished'; onDone: () => void;
}) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [ngay, setNgay] = useState('');
  const [busy, setBusy] = useState(false);
  const canDoLuon = status === 'active';

  const submit = async () => {
    if (!canDoLuon && !lyDo.trim()) { toast.push('error', 'Ghi lý do.'); return; }
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/status`, { status, date: ngay || undefined, reason: lyDo || undefined });
      invalidate('/students'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/cases');
      toast.push('ok', 'Đã lưu');
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      {status === 'finished' && (
        <SectionNote>Case còn mở sẽ được hệ thống đóng “Học viên kết thúc khoá”.</SectionNote>
      )}
      {!canDoLuon && (
        <Field label="Lý do" required>
          <input className="field" value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
        </Field>
      )}
      <Field label="Ngày hiệu lực">
        <input type="date" className="field" value={ngay} onChange={(e) => setNgay(e.target.value)} />
      </Field>
      <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
    </div>
  );
}

/** LƯU TRỮ / BỎ LƯU TRỮ (RB-9, Q22) — hỏi xác nhận ngay trong panel, không mở hộp thoại riêng. */
function LuuTruForm({ studentId, boLuuTru, onDone }: { studentId: number; boLuuTru: boolean; onDone: () => void }) {
  const toast = useToast();
  const [xacNhan, setXacNhan] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/${boLuuTru ? 'unarchive' : 'archive'}`, {});
      invalidate('/students'); invalidate('/hoc-vien-lop');
      toast.push('ok', boLuuTru ? 'Đã bỏ lưu trữ' : 'Đã lưu trữ');
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <SectionNote>
        {boLuuTru
          ? 'Hồ sơ sẽ trở lại danh sách chính của Học viên & Lớp.'
          : 'Hồ sơ sẽ ẩn khỏi danh sách chính — không đổi trạng thái, không xoá dữ liệu, không đóng việc còn dở. Xem lại được ở khu Lưu trữ.'}
      </SectionNote>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={xacNhan} onChange={(e) => setXacNhan(e.target.checked)} />
        Tôi hiểu và muốn {boLuuTru ? 'bỏ lưu trữ' : 'lưu trữ'} học viên này.
      </label>
      <button className="btn btn-primary" onClick={submit} disabled={busy || !xacNhan}>
        {busy ? 'Đang lưu…' : JOB_LABEL[boLuuTru ? 'bo-luu-tru' : 'luu-tru']}
      </button>
    </div>
  );
}

/**
 * KẾT LUẬN LỘ TRÌNH — CHỈ Fast Track (Q15).
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

      <Field label="Điểm IELTS thật (Overall)"
        hint="Con số em báo về từ phòng thi. Chưa thi thì để trống — “chưa có căn cứ” là một câu trả lời hợp lệ.">
        <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
          value={score} onChange={(e) => setScore(e.target.value)} />
      </Field>
      <SectionNote>
        KHÔNG lấy một lượt Mock Test làm kết quả thi thật. MT chấm nội bộ, không có phòng
        thi và không có chứng chỉ — ghi nó vào đây là nói em đã thi trong khi em chưa thi.
      </SectionNote>

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
 * Với lớp thường, giai đoạn đang học đọc ở đây; sửa Lộ trình tiếp theo ở mục riêng (PR-LT).
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
                Giai đoạn là chương trình đang học; tuần kết thúc suy ra từ tuần bắt đầu và độ
                dài chương trình. Ghi dự định sau lớp này ở mục <strong>Lộ trình tiếp theo</strong>.
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
