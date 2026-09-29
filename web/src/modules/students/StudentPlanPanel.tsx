import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { Empty, Field, SectionNote, Skeleton, Status, Th} from '../../ui/ui.tsx';
import { fmtDate } from '../../lib/format.ts';
import { BASELINE_SOURCES, BASELINE_SOURCE_LABEL } from '@shared/domain/index.ts';

type Suggested = {
  attemptNo: number; studyWeek: number; periodId: number; weekStart: string; code: string;
  existingAttemptId: number | null; existingPeriodId: number | null;
  existingSource: 'auto' | 'manual' | null;
  locked: boolean;
};

/**
 * LỘ TRÌNH — mục 2 của menu hồ sơ học viên (mục 5.1), thay cho "Kế hoạch học".
 *
 * Đổi tên vì đây đúng là lộ trình chứ không phải một cái lịch: nó giữ MỌI thứ quyết định
 * đường đi của em trong giai đoạn này, và chúng phải nằm cạnh nhau mới nhìn được ảnh hưởng
 * của nhau.
 *
 *   tuần bắt đầu học   →  lịch MT mặc định của cả khoá tính ra từ đây
 *   kế hoạch thi thật  →  tháng, hoặc tuần khi đã chốt được
 *   MỤC TIÊU           →  đổi thì BẮT BUỘC có lý do và ngày hiệu lực
 *   ĐIỂM ĐẦU VÀO       →  em vào học ở mức nào
 *   bảng các đợt MT    →  mỗi đợt mở được lịch từng kỹ năng
 *
 * Mục tiêu và điểm đầu vào trước đây là HAI mục menu riêng, nên muốn sửa mục tiêu người dùng
 * phải đoán nó nằm ở "Kế hoạch học" hay ở "Đổi mục tiêu". Nay chúng về đúng chỗ.
 *
 * Phần lịch MT vẫn giữ nguyên tinh thần cũ: hệ thống ĐỀ XUẤT rồi để người bấm áp, và khi áp
 * thì KHÔNG đụng vào lượt Quản lý đã chốt tay hay lượt đã làm xong.
 */
export function StudentPlanPanel({ cycleId, studentName, ratio, canEditCycle = true, onDeXuatSua, onClose, onDone }: {
  cycleId: number; studentName: string; ratio: boolean;
  /** PR-DUYET (T44): không có `cycle.edit` → target chỉ đọc, cạnh đó liên kết "Đề xuất sửa" (`onDeXuatSua`). */
  canEditCycle?: boolean; onDeXuatSua?: () => void;
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const cycle = useApi<any>(`/cycles/${cycleId}`);
  const sugg = useApi<Suggested[]>(ratio ? null : `/cycles/${cycleId}/suggested-mocks`, [cycleId]);
  const [startPeriodId, setStartPeriodId] = useState<number | null>(null);
  /** T9 · Thi dự kiến: ngày ISO (đã biết ngày) hoặc tháng `yyyy-mm` (mới biết tháng). */
  const [thiDuKien, setThiDuKien] = useState<string>('');
  const [examPeriodId, setExamPeriodId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const cy = cycle.data;
  /* Chỉ nạp giá trị hiện tại MỘT LẦN, nếu không thì mỗi lần tải lại sẽ xoá cái người đang gõ. */
  if (cy && !touched) {
    if (startPeriodId === null && cy.start_period_id) setStartPeriodId(cy.start_period_id);
    if (thiDuKien === '' && (cy.exam_date || cy.exam_month)) setThiDuKien(cy.exam_date ?? cy.exam_month);
    if (examPeriodId === null && cy.exam_period_id) setExamPeriodId(cy.exam_period_id);
  }

  /* Q9: đã có NGÀY thi thì tuần suy từ ngày — ô tuần chỉ hiện khi mới biết tháng (hoặc chưa biết gì). */
  const hienTuanThi = !/^\d{4}-\d{2}-\d{2}$/.test(thiDuKien);

  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`/cycles/${cycleId}`, {
        startPeriodId: startPeriodId ?? null,
        ...(ratio ? {} : { examDate: thiDuKien || null, ...(hienTuanThi ? { examPeriodId: examPeriodId ?? null } : {}) }),
      });
      invalidate('/cycles'); invalidate('/students'); invalidate('/classes'); invalidate('/attempts');
      toast.push('ok', 'Đã lưu kế hoạch học');
      cycle.reload(); sugg.reload(); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const applyPlan = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ created: number; moved: number; kept: number }>(
        `/cycles/${cycleId}/apply-suggested-mocks`, {},
      );
      invalidate('/attempts'); invalidate('/classes'); invalidate('/students');
      toast.push('ok',
        `Đã xếp lịch: thêm ${r.created} lượt, dời ${r.moved} lượt`
        + (r.kept ? `, giữ nguyên ${r.kept} lượt đã chốt tay` : ''));
      sugg.reload(); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const rows = sugg.data ?? [];
  /* Có gì để áp không — nếu mọi lượt đều đã đúng hoặc đã khoá thì nút không nên sáng. */
  const actionable = rows.filter(
    (r) => !r.locked && r.existingSource !== 'manual'
      && (!r.existingAttemptId || r.existingPeriodId !== r.periodId),
  ).length;

  return (
    <KhungPanel tieuDe="Lộ trình" hocVien={studentName} rong="rong" onDong={onClose}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose, disabled: busy },
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={save} disabled={busy}>Lưu</button>,
      }}>
      {cycle.loading ? <div className="pt-3"><Skeleton rows={6} /></div> : (
        <div className="space-y-4 pt-3">
          <Field as="div" label="Tuần bắt đầu học" required
            hint="Tuần này là TUẦN HỌC THỨ 1 của em. Lịch MT mặc định tính ra từ đây.">
            <WeekPicker periodId={startPeriodId} label={null}
              onPeriod={(id) => { setTouched(true); setStartPeriodId(id); }} />
          </Field>

          {/*
            DỰ KIẾN THI: HAI Ô, THEO ĐÚNG HAI LÚC BIẾT KHÁC NHAU.

            Lúc tư vấn thì chỉ biết THÁNG, và đó đã là một thông tin có ích để xếp cả khoá.
            Gần ngày đăng ký mới chốt được TUẦN. Ép khai tuần ngay từ đầu thì người ta chọn
            bừa một tuần rồi không ai sửa lại — nên để trống tuần là chuyện bình thường.

            Lớp Normal KHÔNG có hai ô này — các em đó chưa thi IELTS, hỏi là hỏi thừa.
          */}
          {!ratio && (
            <>
              <Field label="Thi dự kiến"
                hint="Gõ dd/mm/yyyy nếu đã biết ngày, mm/yyyy nếu mới biết tháng.">
                <ONgay kieu="ngay-hoac-thang" value={thiDuKien} goiY="dd/mm/yyyy hoặc mm/yyyy"
                  onChange={(v) => { setTouched(true); setThiDuKien(v); }} />
              </Field>
              {hienTuanThi && (
                <Field as="div" label="Tuần dự kiến thi"
                  hint="Chốt được thì hệ thống mới đếm ngược. Chưa chốt cứ để trống.">
                  <WeekPicker periodId={examPeriodId} label={null} scope="planning" clearable
                    onPeriod={(id) => { setTouched(true); setExamPeriodId(id); }} />
                </Field>
              )}
            </>
          )}

          {/* ------------------------------------------ MỤC TIÊU và ĐIỂM ĐẦU VÀO (mục 5.1) */}
          {!ratio && <TargetAndBaseline cycleId={cycleId} cy={cy} canEditCycle={canEditCycle} onDeXuatSua={onDeXuatSua}
            onDone={() => { cycle.reload(); onDone(); }} />}

          {ratio ? (
            <SectionNote>
              Đây là lớp Normal nên không có lịch MT riêng từng em — cả lớp làm Progress Test và
              Final Test cùng tuần theo chương trình. Xem và sửa hai mốc đó ở trang lớp.
            </SectionNote>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="label">Lịch MT hệ thống đề xuất</span>
                <button className="btn btn-sm btn-primary" disabled={busy || !actionable} onClick={applyPlan}>
                  {actionable ? `Áp lịch cho ${actionable} lượt` : 'Lịch đã đúng'}
                </button>
              </div>

              {!startPeriodId ? (
                <Empty title="Chưa khai tuần bắt đầu học"
                  hint="Khai tuần bắt đầu rồi bấm Lưu, hệ thống sẽ đề xuất lịch MT ngay bên dưới." />
              ) : rows.length === 0 ? (
                <Skeleton rows={3} />
              ) : (
                <div className="surface-2 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <Th hint="Số thứ tự lượt Mock Test trong lộ trình này. Sang lộ trình mới thì đánh lại từ 1.">Lượt</Th>
                        <Th hint="Tuần thứ mấy kể từ tuần em bắt đầu học. Mốc mặc định của Fast Track là tuần 6 · 12 · 16 · 20 · 24.">Tuần học</Th>
                        <Th hint="Tuần hệ thống tính ra từ tuần bắt đầu học. Chỉ là đề xuất — bấm Áp lịch mới thật sự đổi.">Tuần đề xuất</Th>
                        <Th hint="Bấm Áp lịch thì lượt này sẽ ra sao. Lượt Quản lý đã chốt tay và lượt đã làm xong thì đứng yên.">Hiện tại</Th>
                        <Th hint="Mở đợt đó ra để xem và sửa lịch của từng kỹ năng — R/L/W và Speaking có thể ở hai tuần khác nhau.">Lịch kỹ năng</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.attemptNo} className="row-hover">
                          <td className="td text-slate-100 whitespace-nowrap">MT{r.attemptNo}</td>
                          <td className="td text-slate-400 whitespace-nowrap tabular-nums">tuần {r.studyWeek}</td>
                          <td className="td whitespace-nowrap">
                            <span className="text-slate-200">{r.code}</span>
                            <span className="block text-[10px] text-slate-500">{fmtDate(r.weekStart)}</span>
                          </td>
                          <td className="td">
                            {/*
                              Nói rõ lượt nào sẽ ĐỨNG YÊN và vì sao. Đây là chỗ giữ lời hứa
                              "hệ thống không ghi đè cái Quản lý đã xếp" — và người dùng phải
                              thấy lời hứa đó trước khi bấm, không phải sau.
                            */}
                            {r.locked ? <Status kind="done">Đã làm xong, giữ nguyên</Status>
                              : r.existingSource === 'manual' ? <Status kind="done">Quản lý đã chốt, giữ nguyên</Status>
                              : !r.existingAttemptId ? <Status kind="waiting">Chưa có, sẽ tạo</Status>
                              : r.existingPeriodId !== r.periodId ? <Status kind="waiting">Sẽ dời sang tuần đề xuất</Status>
                              : <Status kind="done">Đã đúng</Status>}
                          </td>
                          <td className="td whitespace-nowrap">
                            {/*
                              MỖI ĐỢT MỞ ĐƯỢC LỊCH TỪNG KỸ NĂNG (mục 5.1). Từ vòng 7 một đợt
                              không còn là một tuần duy nhất: R/L/W có thể thi tuần này còn
                              Speaking tuần sau, và mỗi kỹ năng mang hạn chấm của riêng nó.
                            */}
                            {r.existingAttemptId ? (
                              <a className="btn btn-sm btn-ghost" href={`/mock-test/${r.existingAttemptId}`}>
                                Mở lịch kỹ năng
                              </a>
                            ) : (
                              <span className="text-xs text-slate-600">chưa có đợt</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <SectionNote>
                Hệ thống chỉ đề xuất ba lượt đầu — đa số em chỉ thi ba lượt, MT4 và MT5 là dự
                phòng và xếp tay khi cần. Lượt nào Quản lý đã chốt tay hoặc em đã làm xong thì
                đứng yên, kể cả khi đổi lại tuần bắt đầu học.
              </SectionNote>
            </div>
          )}
        </div>
      )}
    </KhungPanel>
  );
}

/**
 * MỤC TIÊU VÀ ĐIỂM ĐẦU VÀO — hai ô của lộ trình, trước đây là hai mục menu riêng (mục 5.1).
 *
 * ĐỔI MỤC TIÊU BẮT BUỘC CÓ LÝ DO VÀ NGÀY HIỆU LỰC (mục 5.2), và ở đâu cũng vậy — đây không
 * phải một lời nhắc lịch sự, mà là điều kiện để lịch sử đọc được: vài tháng sau, lý do là
 * thứ duy nhất giải thích vì sao kỳ vọng của MT3 khác MT2.
 *
 * Và nó KHÔNG chấm lại quá khứ: các lượt đã chốt giữ nguyên kỳ vọng tính theo mục tiêu lúc
 * đó. Đổi mục tiêu từ hôm nay mà viết lại mức SOS của ba tháng trước là sửa lịch sử.
 */
function TargetAndBaseline({ cycleId, cy, canEditCycle, onDeXuatSua, onDone }: {
  cycleId: number; cy: any; canEditCycle: boolean; onDeXuatSua?: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [openTarget, setOpenTarget] = useState(false);
  const [openBaseline, setOpenBaseline] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [reason, setReason] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [source, setSource] = useState('entrance');
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const saveTarget = async () => {
    setBusy(true);
    try {
      await api.post(`/cycles/${cycleId}/target-revision`, {
        newTarget: newTarget === '' ? null : Number(newTarget),
        reason, effectiveFrom: effectiveFrom || undefined,
      });
      invalidate('/cycles'); invalidate('/students'); invalidate('/attempts');
      toast.push('ok', 'Đã đổi mục tiêu');
      setOpenTarget(false); setReason(''); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const saveBaseline = async () => {
    setBusy(true);
    try {
      await api.put(`/cycles/${cycleId}/baseline`, { source, note, score });
      invalidate('/cycles'); invalidate('/students');
      toast.push('ok', 'Đã ghi điểm đầu vào');
      setOpenBaseline(false); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: 'var(--line)' }}>
      {/* ------------------------------------------------------------------ mục tiêu */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-slate-200">
          Mục tiêu:{' '}
          {cy?.target_score !== null && cy?.target_score !== undefined
            ? <strong>{cy.target_score}</strong>
            : <span className="text-amber-300">chưa đặt</span>}
        </span>
        {canEditCycle ? (
          <button className="btn btn-sm" onClick={() => setOpenTarget(!openTarget)}>
            {openTarget ? 'Thôi' : 'Đổi mục tiêu'}
          </button>
        ) : onDeXuatSua && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onDeXuatSua} title="Target do Quản lý sửa — gửi đề xuất để Quản lý duyệt">
            Đề xuất sửa
          </button>
        )}
      </div>
      {openTarget && canEditCycle && (
        <div className="space-y-2">
          <Field label="Mục tiêu mới" required>
            <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
              value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
          </Field>
          <Field label="Lý do" required
            hint="Vài tháng sau, đây là thứ duy nhất giải thích vì sao mục tiêu đổi.">
            <input className="field" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Gia đình lùi kế hoạch du học sang năm sau" />
          </Field>
          <Field label="Có hiệu lực từ ngày" required
            hint="Các lượt trước ngày này giữ nguyên kỳ vọng cũ.">
            <ONgay kieu="ngay" value={effectiveFrom} onChange={setEffectiveFrom} />
          </Field>
          <button className="btn btn-primary btn-sm" disabled={busy || !reason.trim() || !newTarget}
            onClick={saveTarget}>
            {busy ? 'Đang lưu…' : 'Lưu mục tiêu mới'}
          </button>
          <SectionNote>
            Các lượt đã chốt GIỮ NGUYÊN kỳ vọng tính theo mục tiêu lúc đó. Đổi mục tiêu từ hôm
            nay không chấm lại quá khứ — sửa một mục tiêu lịch sử ghi sai là một thao tác hiệu
            chỉnh riêng, có nhật ký và phải đối soát lại các kết luận đã ra.
          </SectionNote>
        </div>
      )}

      {/* --------------------------------------------------------------- điểm đầu vào */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t"
           style={{ borderColor: 'var(--line)' }}>
        <span className="text-sm text-slate-200">
          Đầu vào:{' '}
          {cy?.baseline_score !== null && cy?.baseline_score !== undefined
            ? <strong>{cy.baseline_score}</strong>
            : <span className="text-amber-300">chưa ghi</span>}
        </span>
        <button className="btn btn-sm" onClick={() => setOpenBaseline(!openBaseline)}>
          {openBaseline ? 'Thôi' : 'Ghi điểm đầu vào'}
        </button>
      </div>
      {openBaseline && (
        <div className="space-y-2">
          <Field label="Điểm này lấy từ đâu" required>
            <select className="field" value={source} onChange={(e) => setSource(e.target.value)}>
              {BASELINE_SOURCES.map((x) => <option key={x} value={x}>{BASELINE_SOURCE_LABEL[x]}</option>)}
            </select>
          </Field>
          <Field label="Điểm đầu vào (OVR)" required>
            <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
              value={score} onChange={(e) => setScore(e.target.value)} />
          </Field>
          <Field label="Ghi chú">
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Điểm IELTS thi tại BC tháng 3/2026" />
          </Field>
          <button className="btn btn-primary btn-sm" disabled={busy || !score} onClick={saveBaseline}>
            {busy ? 'Đang lưu…' : 'Lưu điểm đầu vào'}
          </button>
          <SectionNote>
            Hệ thống KHÔNG tự lấy MT1 làm điểm đầu vào. “Em vào học ở mức nào” là câu hỏi khác
            hẳn “bài Mock đầu tiên được mấy điểm”.
          </SectionNote>
        </div>
      )}
    </div>
  );
}
