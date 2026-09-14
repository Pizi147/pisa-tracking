import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { Drawer } from '../../ui/Drawer.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Field, SectionNote, Skeleton, Status } from '../../ui/ui.tsx';
import { fmtDate } from '../../lib/format.ts';

type Progress = {
  programmeCode: string | null; programmeName: string | null;
  totalWeeks: number | null; currentWeek: number | null;
  startPeriodId: number | null; startWeekStart: string | null;
  progressWeek: number | null; finalWeek: number | null;
  progressOverridden: boolean; finalOverridden: boolean;
  progressWeekStart: string | null; finalWeekStart: string | null;
  phase: string; phaseLabel: string; weeksLeft: number | null;
  needsPlacement: boolean;
  placementOptions: { code: string; name: string }[];
  activeStudents: number;
  label: string | null;
};

/**
 * TIẾN ĐỘ CỦA MỘT LỚP — mục 7.6, quyền của Admin CN và Quản lý CN.
 *
 * Ba ô: tuần khai giảng, tuần Progress Test, tuần Final Test. Hai ô sau tính sẵn theo
 * chương trình, nên phần lớn lớp không ai phải đụng vào — chỉ lớp nghỉ lễ hoặc học bù mới
 * cần xê dịch. Đặt ô về trống là QUAY LẠI mốc mặc định, không phải xoá mốc: cần có đường
 * quay lại, nếu không thì một lần gõ nhầm là lớp đó vĩnh viễn lệch chuẩn.
 *
 * Phần dưới cùng là thứ owner yêu cầu thêm ngày 13/09/2026: khi lớp đã hết chương trình,
 * panel nói thẳng còn bao nhiêu em cần xếp lớp và hai đường đi tiếp của các em.
 */
export function ClassProgressPanel({ classId, classCode, onClose, onDone }: {
  classId: number; classCode: string; onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const { data, loading, reload } = useApi<Progress>(`/classes/${classId}/progress`, [classId]);
  const [startPeriodId, setStartPeriodId] = useState<number | null>(null);
  const [progressWeek, setProgressWeek] = useState<string>('');
  const [finalWeek, setFinalWeek] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  /* Nạp giá trị hiện tại MỘT LẦN — nếu không thì mỗi lần tải lại sẽ xoá cái người đang gõ. */
  if (data && !touched) {
    if (startPeriodId === null && data.startPeriodId) setStartPeriodId(data.startPeriodId);
    if (progressWeek === '' && data.progressOverridden && data.progressWeek) setProgressWeek(String(data.progressWeek));
    if (finalWeek === '' && data.finalOverridden && data.finalWeek) setFinalWeek(String(data.finalWeek));
  }

  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`/classes/${classId}/progress`, {
        startPeriodId: startPeriodId ?? null,
        progressWeek: progressWeek.trim() === '' ? null : Number(progressWeek),
        finalWeek: finalWeek.trim() === '' ? null : Number(finalWeek),
      });
      invalidate('/classes');
      toast.push('ok', 'Đã lưu tiến độ lớp');
      reload(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const isNormal = !!data?.totalWeeks;

  return (
    <Drawer
      open onClose={onClose} width="max-w-xl"
      title="Tiến độ lớp"
      subtitle={classCode}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>Lưu</button>
        </>
      }
    >
      {loading || !data ? <Skeleton rows={5} /> : (
        <div className="space-y-4">
          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
            <p className="text-sm text-slate-100 m-0">{data.label ?? 'Chưa tính được tiến độ'}</p>
            {data.startWeekStart && (
              <p className="text-xs text-slate-500 mt-1 mb-0">Khai giảng tuần bắt đầu {fmtDate(data.startWeekStart)}</p>
            )}
          </div>

          <Field label="Tuần khai giảng" required={isNormal}
            hint="Tuần này là TUẦN HỌC THỨ 1 của lớp. Hai mốc kiểm tra đếm từ đây.">
            <WeekPicker periodId={startPeriodId} label={null} scope="planning"
              onPeriod={(id) => { setTouched(true); setStartPeriodId(id); }} className="w-full" />
          </Field>

          {isNormal ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tuần Progress Test"
                  hint={`Mặc định của ${data.programmeCode}: tuần ${data.progressOverridden ? '—' : data.progressWeek ?? '—'}. Để trống là dùng mặc định.`}>
                  <input type="number" min={1} max={data.totalWeeks ?? undefined} className="field w-full"
                    value={progressWeek} placeholder={String(data.progressWeek ?? '')}
                    onChange={(e) => { setTouched(true); setProgressWeek(e.target.value); }} />
                </Field>
                <Field label="Tuần Final Test"
                  hint="Để trống là dùng mốc mặc định của chương trình.">
                  <input type="number" min={1} max={data.totalWeeks ?? undefined} className="field w-full"
                    value={finalWeek} placeholder={String(data.finalWeek ?? '')}
                    onChange={(e) => { setTouched(true); setFinalWeek(e.target.value); }} />
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.progressWeekStart && (
                  <Status kind={data.phase === 'progress_week' ? 'doing' : 'idle'}>
                    Progress Test: tuần {data.progressWeek} · {fmtDate(data.progressWeekStart)}
                    {data.progressOverridden ? ' · đã xếp lại' : ''}
                  </Status>
                )}
                {data.finalWeekStart && (
                  <Status kind={data.phase === 'final_week' ? 'doing' : 'idle'}>
                    Final Test: tuần {data.finalWeek} · {fmtDate(data.finalWeekStart)}
                    {data.finalOverridden ? ' · đã xếp lại' : ''}
                  </Status>
                )}
              </div>

              {/*
                LỚP ĐÃ HỌC XONG → MỖI EM PHẢI ĐƯỢC XẾP LỚP TIẾP.
                Hệ thống KHÔNG tự chuyển ai: nó chỉ nói "đến lúc rồi" và bày sẵn hai đường.
              */}
              {data.needsPlacement && (
                <div className="rounded-lg border p-3"
                     style={{ borderColor: 'var(--danger)', background: 'rgba(242, 161, 161, 0.08)' }}>
                  <p className="text-sm text-slate-100 m-0">
                    Lớp đã học hết {data.totalWeeks} tuần. <strong>{data.activeStudents} học viên</strong> cần
                    được xếp lớp tiếp theo.
                  </p>
                  <p className="text-xs text-slate-300 mt-1.5 mb-0">
                    Hai đường đi:
                    {' '}{data.placementOptions.map((o) => `${o.name} (${o.code})`).join(' — hoặc — ')}
                  </p>
                  <SectionNote>
                    Hệ thống không tự chuyển em nào. Mở từng em rồi bấm “Chuyển lớp”, hoặc tạo lớp
                    mới trước rồi chuyển cả nhóm sang.
                  </SectionNote>
                </div>
              )}
            </>
          ) : (
            <SectionNote>
              Đây là lớp Fast Track nên không có mốc Progress/Final Test chung cho cả lớp — lịch MT
              đi theo <strong>từng em</strong>, tính từ tuần em vào học. Mở hồ sơ một em rồi bấm
              “Kế hoạch học” để xem và xếp lịch MT của em đó.
            </SectionNote>
          )}
        </div>
      )}
    </Drawer>
  );
}
