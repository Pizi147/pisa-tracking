import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from './Toast.tsx';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from './ui.tsx';

type Duty = {
  attemptId: number; attemptNo: number; studentId: number; studentName: string; studentCode: string;
  classId: number | null; classCode: string | null; branchName: string | null;
  periodCode: string; weekStart: string; weekEnd: string;
  speakingScheduledAt: string | null; overdue: boolean; canEdit: boolean;
};

/**
 * NGHĨA VỤ HÀNG TUẦN của Admin chi nhánh: trước khi hết Chủ nhật, những em có MT trong
 * tuần phải được cập nhật ngày thực tế.
 *
 * Đây là nơi DUY NHẤT hệ thống nhắc chuyện thiếu ngày — thay cho badge "Chưa có ngày" rải
 * khắp nơi. Badge ấy hiện cả những MT còn cách hàng tháng, nên lúc nào cũng đỏ và người
 * dùng học cách phớt lờ. Ở đây chỉ có MT đã đến tuần, và MT tuần trước còn sót.
 *
 * Cập nhật HÀNG LOẠT: một buổi mock có hai mươi em cùng ngày, không lý gì bắt mở hai mươi
 * hồ sơ. Chọn nhiều em, một ngày, một lần bấm.
 */
export function DateDutyPanel({ branchId, classId }: { branchId?: number | null; classId?: number | null }) {
  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (classId) qs.set('classId', String(classId));
  const { data, loading, error, reload } = useApi<{ rows: Duty[]; overdueCount: number; thisWeekCount: number }>(
    `/attempts/date-duty${qs.toString() ? `?${qs}` : ''}`,
  );
  const toast = useToast();
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [date, setDate] = useState('');
  const [field, setField] = useState<'lrw' | 'speaking'>('lrw');
  const [busy, setBusy] = useState(false);

  const rows = data?.rows ?? [];
  const editable = useMemo(() => rows.filter((r) => r.canEdit), [rows]);
  const chosen = useMemo(() => editable.filter((r) => picked.has(r.attemptId)), [editable, picked]);

  // Chỉ gợi ý ngày trong tuần của những em ĐANG CHỌN — ngày ngoài tuần sẽ bị máy chủ từ chối.
  const bounds = useMemo(() => {
    if (!chosen.length) return null;
    return {
      min: chosen.reduce((a, r) => (r.weekStart > a ? r.weekStart : a), chosen[0].weekStart),
      max: chosen.reduce((a, r) => (r.weekEnd < a ? r.weekEnd : a), chosen[0].weekEnd),
    };
  }, [chosen]);
  const mixedWeeks = !!bounds && bounds.min > bounds.max;

  const toggle = (id: number) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const apply = async () => {
    if (!chosen.length || !date || busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ done: number; failed: { label?: string; message: string }[] }>(
        '/attempts/bulk-date',
        { attemptIds: chosen.map((c) => c.attemptId), [field === 'lrw' ? 'lrwAt' : 'speakingAt']: date },
      );
      toast.push(r.done > 0 ? 'ok' : 'error',
        `Đã cập nhật ${r.done} lượt${r.failed.length ? `, ${r.failed.length} lượt không cập nhật được` : ''}.`);
      for (const f of r.failed.slice(0, 3)) toast.push('error', `${f.label ?? ''}: ${f.message}`);
      setPicked(new Set());
      setDate('');
      invalidate('/attempts');
      invalidate('/classes');
      reload();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading) return <Skeleton rows={6} />;
  if (!rows.length) {
    return (
      <Empty
        title="Không còn MT nào thiếu ngày"
        hint="Những MT của các tuần sắp tới chưa hiện ở đây — chưa đến tuần thì chưa phải việc."
      />
    );
  }

  return (
    <Card
      title="Cần cập nhật ngày MT"
      action={
        <span className="flex items-center gap-1.5">
          {data!.overdueCount > 0 && <Pill tone="danger">{data!.overdueCount} tuần trước</Pill>}
          {data!.thisWeekCount > 0 && <Pill tone="warn">{data!.thisWeekCount} tuần này</Pill>}
        </span>
      }
      bodyClass="p-0"
    >
      <div className="flex flex-wrap items-end gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
        <button
          className="btn btn-sm"
          onClick={() => setPicked(picked.size === editable.length ? new Set() : new Set(editable.map((r) => r.attemptId)))}
        >
          {picked.size === editable.length && editable.length > 0 ? 'Bỏ chọn tất cả' : `Chọn tất cả (${editable.length})`}
        </button>
        <label className="block">
          <span className="label">Buổi</span>
          <select className="field w-36" value={field} onChange={(e) => setField(e.target.value as any)}>
            <option value="lrw">Buổi L/R/W</option>
            <option value="speaking">Buổi Speaking</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Ngày thực tế</span>
          {/* Chỉ NGÀY. Giờ không giúp gì cho việc theo dõi tiến độ. */}
          <input
            type="date" className="field w-44" value={date}
            min={bounds?.min} max={bounds?.max}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button className="btn btn-primary btn-sm" onClick={apply} disabled={busy || !chosen.length || !date}>
          {busy ? 'Đang lưu…' : `Cập nhật ${chosen.length} lượt`}
        </button>
        {mixedWeeks && chosen.length > 0 && (
          <span className="text-xs text-amber-300">
            Các em đang chọn thuộc những tuần khác nhau — một ngày không thể nằm trong mọi tuần.
            Hãy chọn theo từng tuần.
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th w-10"></th>
              <th className="th">Học viên</th>
              <th className="th">Lớp</th>
              <th className="th">MT</th>
              <th className="th">Tuần kế hoạch</th>
              <th className="th">Tình trạng</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.attemptId} className="row-hover">
                <td className="td">
                  <input
                    type="checkbox" className="accent-sky-400" disabled={!r.canEdit}
                    checked={picked.has(r.attemptId)} onChange={() => toggle(r.attemptId)}
                    aria-label={`Chọn ${r.studentName} MT${r.attemptNo}`}
                  />
                </td>
                <td className="td">
                  <Link className="link" to={`/hoc-vien/${r.studentId}`}>{r.studentName}</Link>
                  <div className="text-[11px] text-slate-500">{r.studentCode}</div>
                </td>
                <td className="td text-slate-300 whitespace-nowrap">{r.classCode ?? '—'}</td>
                <td className="td tabular-nums whitespace-nowrap">
                  <Link className="link" to={`/mock-test/${r.attemptId}`}>MT{r.attemptNo}</Link>
                </td>
                <td className="td whitespace-nowrap text-slate-300">{r.periodCode}</td>
                <td className="td">
                  <div className="flex flex-col items-start gap-0.5">
                    {r.overdue
                      ? <Pill tone="danger">Quá hạn</Pill>
                      : <Pill tone="warn">Tuần này</Pill>}
                    {!r.canEdit && <span className="text-[10px] text-slate-500">Ngoài phạm vi của bạn</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3">
        <SectionNote>
          Lịch buổi học do bộ phận xếp lịch bố trí từ Chủ nhật tuần trước. Việc ở đây là ghi lại
          <strong> ngày em thực sự làm bài</strong> — và cập nhật lại khi em nghỉ và được dời.
        </SectionNote>
      </div>
    </Card>
  );
}
