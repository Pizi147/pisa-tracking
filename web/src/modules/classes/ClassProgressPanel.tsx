import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Field, SectionNote, Skeleton, Status } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { MOC_KIEM_TRA_FT, MOC_KIEM_TRA_NORMAL } from '../../ui/chu.ts';
import { ngay, tuanLich } from '@shared/domain/index.ts';

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
 * Ba ô: tuần khai giảng, tuần thi Giữa khoá, tuần thi Cuối khoá. Hai ô sau tính sẵn theo
 * chương trình, nên phần lớn lớp không ai phải đụng vào — chỉ lớp nghỉ lễ hoặc học bù mới
 * cần xê dịch. Đặt ô về trống là QUAY LẠI mốc mặc định, không phải xoá mốc: cần có đường
 * quay lại, nếu không thì một lần gõ nhầm là lớp đó vĩnh viễn lệch chuẩn.
 *
 * Phần dưới cùng là thứ owner yêu cầu thêm ngày 13/09/2026: khi lớp đã hết chương trình,
 * panel nói thẳng còn bao nhiêu em cần xếp lớp và hai đường đi tiếp của các em.
 */
export function ClassProgressPanel({ classId, classCode, tieuDe, onClose, onDone }: {
  classId: number; classCode: string; tieuDe: string; onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
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

  const laLopThuong = !!data?.totalWeeks;

  return (
    <KhungPanel tieuDe={tieuDe} lop={classCode} onDong={onClose}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose, disabled: busy },
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={save} disabled={busy}>Lưu</button>,
      }}>
      {loading || !data ? <div className="pt-3"><Skeleton rows={5} /></div> : (
        <div className="space-y-4 pt-3">
          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
            <p className="text-sm text-slate-100 m-0">{data.label ?? 'Chưa tính được tiến độ'}</p>
            {data.startWeekStart && (
              <p className="text-xs text-slate-500 mt-1 mb-0">Khai giảng {tuanLich(data.startWeekStart, homNay)} · {ngay(data.startWeekStart, homNay)}</p>
            )}
          </div>

          <Field as="div" label="Tuần khai giảng" required={laLopThuong}
            hint={`Tuần này là tuần học thứ 1 của lớp. ${laLopThuong ? MOC_KIEM_TRA_NORMAL : MOC_KIEM_TRA_FT}`}>
            <WeekPicker periodId={startPeriodId} label={null} scope="planning"
              onPeriod={(id) => { setTouched(true); setStartPeriodId(id); }} />
          </Field>

          {laLopThuong ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tuần thi Giữa khoá (tuần học thứ)"
                  hint={`Mặc định của ${data.programmeCode}: tuần ${data.progressOverridden ? '—' : data.progressWeek ?? '—'}. Để trống là dùng mặc định.`}>
                  <input type="number" min={1} max={data.totalWeeks ?? undefined} className="field w-full"
                    value={progressWeek} placeholder={String(data.progressWeek ?? '')}
                    onChange={(e) => { setTouched(true); setProgressWeek(e.target.value); }} />
                </Field>
                <Field label="Tuần thi Cuối khoá (tuần học thứ)"
                  hint="Để trống là dùng mốc mặc định của chương trình.">
                  <input type="number" min={1} max={data.totalWeeks ?? undefined} className="field w-full"
                    value={finalWeek} placeholder={String(data.finalWeek ?? '')}
                    onChange={(e) => { setTouched(true); setFinalWeek(e.target.value); }} />
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.progressWeekStart && (
                  <Status kind={data.phase === 'progress_week' ? 'doing' : 'idle'}>
                    Giữa khoá: {tuanLich(data.progressWeekStart, homNay)} (tuần học {data.progressWeek})
                    {data.progressOverridden ? ' · đã xếp lại' : ''}
                  </Status>
                )}
                {data.finalWeekStart && (
                  <Status kind={data.phase === 'final_week' ? 'doing' : 'idle'}>
                    Cuối khoá: {tuanLich(data.finalWeekStart, homNay)} (tuần học {data.finalWeek})
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
              Đây là lớp Fast Track nên không có mốc thi Giữa khoá/Cuối khoá chung cho cả lớp — lịch MT
              đi theo <strong>từng em</strong>, tính từ tuần em vào học. Mở hồ sơ một em rồi bấm
              “Kế hoạch học” để xem và xếp lịch MT của em đó.
            </SectionNote>
          )}
        </div>
      )}
    </KhungPanel>
  );
}
