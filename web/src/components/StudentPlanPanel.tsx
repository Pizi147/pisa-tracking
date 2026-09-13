import { useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { Drawer } from './Drawer.tsx';
import { WeekPicker } from './Filters.tsx';
import { useToast } from './Toast.tsx';
import { Empty, Field, Pill, SectionNote, Skeleton } from './ui.tsx';
import { fmtDate } from '../lib/format.ts';

type Suggested = {
  attemptNo: number; studyWeek: number; periodId: number; weekStart: string; code: string;
  existingAttemptId: number | null; existingPeriodId: number | null;
  existingSource: 'auto' | 'manual' | null;
  locked: boolean;
};

/**
 * KẾ HOẠCH HỌC CỦA MỘT EM — mục 7.5 và 7.6.
 *
 * Hai ô thông tin, và một hệ quả:
 *
 *   tuần bắt đầu học  →  lịch MT mặc định của cả khoá tính ra từ đây
 *   tháng thi dự kiến →  chỉ lớp FT; lớp Normal không có ô này
 *
 * Cái đáng nói là phần dưới: hệ thống ĐỀ XUẤT lịch MT rồi để người bấm áp, chứ không tự ghi.
 * Và khi áp, nó KHÔNG đụng vào lượt Quản lý đã chốt tay hay lượt đã làm xong — bảng bên dưới
 * nói rõ từng lượt sẽ ra sao trước khi bấm, để không ai phải bấm rồi mới biết chuyện gì xảy ra.
 */
export function StudentPlanPanel({ cycleId, studentName, ratio, onClose, onDone }: {
  cycleId: number; studentName: string; ratio: boolean;
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const cycle = useApi<any>(`/cycles/${cycleId}`);
  const sugg = useApi<Suggested[]>(ratio ? null : `/cycles/${cycleId}/suggested-mocks`, [cycleId]);
  const [startPeriodId, setStartPeriodId] = useState<number | null>(null);
  const [examMonth, setExamMonth] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const cy = cycle.data;
  /* Chỉ nạp giá trị hiện tại MỘT LẦN, nếu không thì mỗi lần tải lại sẽ xoá cái người đang gõ. */
  if (cy && !touched) {
    if (startPeriodId === null && cy.start_period_id) setStartPeriodId(cy.start_period_id);
    if (examMonth === '' && cy.exam_month) setExamMonth(cy.exam_month);
  }

  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`/cycles/${cycleId}`, {
        startPeriodId: startPeriodId ?? null,
        ...(ratio ? {} : { examMonth: examMonth || null }),
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
    <Drawer
      open onClose={onClose} width="max-w-2xl"
      title="Kế hoạch học"
      subtitle={studentName}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>Lưu</button>
        </>
      }
    >
      {cycle.loading ? <Skeleton rows={6} /> : (
        <div className="space-y-4">
          <Field label="Tuần bắt đầu học" required
            hint="Tuần này là TUẦN HỌC THỨ 1 của em. Lịch MT mặc định tính ra từ đây.">
            <WeekPicker periodId={startPeriodId} label={null}
              onPeriod={(id) => { setTouched(true); setStartPeriodId(id); }} className="w-full" />
          </Field>

          {/* Lớp Normal KHÔNG có ô này — các em đó chưa thi IELTS, hỏi là hỏi thừa. */}
          {!ratio && (
            <Field label="Tháng dự kiến thi"
              hint="Ngày thi cụ thể cập nhật sau, khi đã đăng ký xong.">
              <input type="month" className="field w-full" value={examMonth}
                onChange={(e) => { setTouched(true); setExamMonth(e.target.value); }} />
            </Field>
          )}

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
                        <th className="th">Lượt</th>
                        <th className="th">Tuần học</th>
                        <th className="th">Tuần đề xuất</th>
                        <th className="th">Hiện tại</th>
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
                            {r.locked ? <Pill tone="muted">Đã làm xong, giữ nguyên</Pill>
                              : r.existingSource === 'manual' ? <Pill tone="info">Quản lý đã chốt, giữ nguyên</Pill>
                              : !r.existingAttemptId ? <Pill tone="warn">Chưa có, sẽ tạo</Pill>
                              : r.existingPeriodId !== r.periodId ? <Pill tone="warn">Sẽ dời sang tuần đề xuất</Pill>
                              : <Pill tone="ok">Đã đúng</Pill>}
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
    </Drawer>
  );
}
