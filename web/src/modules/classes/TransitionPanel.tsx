import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Drawer } from '../../ui/Drawer.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { ErrorState, Info, SectionNote, Skeleton } from '../../ui/ui.tsx';

/**
 * CHUYỂN TIẾP CẢ LỚP KHI HỌC HẾT CHƯƠNG TRÌNH — mục 6.1.
 *
 * Panel chỉ hỏi bốn thứ, đúng như owner chốt: **Học viên — Lớp đích — Thời điểm chuyển —
 * Ghi chú**. Mọi thứ khác hệ thống điền sẵn.
 *
 * BA QUYẾT ĐỊNH VỀ CÁCH BÀY:
 *
 * 1. LỚP ĐÍCH CHỌN SẴN CHO CẢ LỚP. Phần lớn học viên đi cùng một đường (FOU → BE, BE/ELE →
 *    Fast Track), nên bắt chọn lại hai mươi lần là bắt làm hai mươi lần một việc. Ô chọn ở
 *    đầu panel đặt lớp đích cho mọi em; dòng nào khác thì sửa riêng dòng đó.
 *
 * 2. LỚP MỚI LÀ MỘT BẢN NHÁP, KHÔNG PHẢI MỘT LỚP ĐÃ TẠO. Mã lớp điền sẵn nhưng lớp chỉ
 *    thật sự được mở khi bấm xác nhận — để không ai bấm nhầm rồi để lại một lớp rỗng.
 *
 * 3. BỎ CHỌN ĐƯỢC TỪNG EM. Em xin bảo lưu, em chuyển cơ sở, em học lại — ba chuyện có thật,
 *    và cả ba đều là "đừng chuyển em này hôm nay".
 */
export function TransitionPanel({ classId, open, onClose, onDone }: {
  classId: number; open: boolean; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<any>(open ? `/classes/${classId}/transition` : null, [classId, open]);
  const [busy, setBusy] = useState(false);

  /** `new` = lớp mới sẽ mở; số = id một lớp đang có; '' = chưa chọn. */
  const [bulkTarget, setBulkTarget] = useState<string>('new');
  const [perStudent, setPerStudent] = useState<Record<number, string>>({});
  const [skipped, setSkipped] = useState<Record<number, boolean>>({});
  const [newCode, setNewCode] = useState('');
  const [newProgramme, setNewProgramme] = useState('');
  const [startPeriod, setStartPeriod] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  /* Nạp giá trị gợi ý MỘT LẦN — nạp lại mỗi lần tải sẽ xoá cái người đang gõ. */
  const [loaded, setLoaded] = useState(false);
  if (data && !loaded) {
    setLoaded(true);
    setNewCode(data.suggestedCode ?? '');
    setNewProgramme(data.defaultProgramme ?? '');
    setDate(data.today ?? '');
  }

  const targetOf = (sid: number) => perStudent[sid] ?? bulkTarget;
  const moving = (data?.students ?? []).filter((s: any) => !skipped[s.id] && targetOf(s.id));
  const needNewClass = moving.some((s: any) => targetOf(s.id) === 'new');

  const submit = async () => {
    if (!moving.length) { toast.push('error', 'Chưa chọn học viên nào để chuyển.'); return; }
    if (needNewClass && !newCode.trim()) { toast.push('error', 'Cần mã cho lớp mới.'); return; }
    setBusy(true);
    try {
      const r = await api.post<any>(`/classes/${classId}/transition`, {
        newClass: needNewClass
          ? { code: newCode.trim(), programme: newProgramme, startWeekStart: null, startPeriodId: startPeriod }
          : null,
        moves: moving.map((s: any) => {
          const t = targetOf(s.id);
          return t === 'new' ? { studentId: s.id, toNewClass: true } : { studentId: s.id, toClassId: Number(t) };
        }),
        effectiveDate: date,
        note: note || null,
      });
      invalidate('/classes'); invalidate('/students'); invalidate('/attempts'); invalidate('/overview');
      const parts = [`Đã chuyển ${r.done.length} học viên`];
      if (r.newClass) parts.push(`mở lớp ${r.newClass.code}`);
      if (r.failed.length) parts.push(`${r.failed.length} em chưa chuyển được`);
      toast.push(r.failed.length ? 'info' : 'ok', parts.join(' · '));
      if (r.failed.length) {
        for (const f of r.failed.slice(0, 3)) toast.push('error', f.message);
      }
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Drawer
      open={open} onClose={onClose} width="max-w-3xl"
      title="Chuyển tiếp cả lớp"
      subtitle={data ? `${data.from.code} · ${data.from.programmeName ?? ''}` : undefined}
      footer={<>
        <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy || !data?.canEdit}>
          {busy ? 'Đang chuyển…' : `Xác nhận chuyển ${moving.length} học viên`}
        </button>
      </>}
    >
      {error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
      {loading && <Skeleton rows={8} />}
      {data && (
        <div className="space-y-4">
          <SectionNote>
            Lớp <strong>{data.from.code}</strong> đã học hết {data.from.totalWeeks} tuần.
            {data.defaultProgramme
              ? <> Luồng mặc định là chuyển sang <strong>{data.options.find((o: any) => o.code === data.defaultProgramme)?.name}</strong>.</>
              : ' Chương trình này chưa khai bước kế tiếp.'}
            {' '}Hệ thống <strong>không tự chuyển ai</strong> — bạn xem lại rồi bấm xác nhận.
          </SectionNote>

          {data.alreadyLinked.length > 0 && (
            <div className="text-xs text-amber-200">
              Lớp này đã có lớp kế tiếp: {data.alreadyLinked.map((c: any) => c.code).join(', ')}.
              Chuyển thêm lần nữa thì chọn lớp đó ở ô "Lớp đích" thay vì mở lớp mới.
            </div>
          )}

          {/* ---------------------------------------------------- lớp đích chung */}
          <label className="block">
            <span className="label">Lớp đích cho cả lớp</span>
            <select className="field w-full" value={bulkTarget}
              onChange={(e) => { setBulkTarget(e.target.value); setPerStudent({}); }}>
              <option value="new">Mở một lớp mới</option>
              {data.candidates.map((c: any) => (
                <option key={c.id} value={String(c.id)}>
                  {c.code} · {c.programmeName ?? c.programmeCode} · đang có {c.studentCount} em
                </option>
              ))}
            </select>
            <span className="block text-[11px] text-slate-500 mt-1">
              Đặt cho mọi em cùng lúc. Em nào đi đường khác thì sửa riêng ở dòng của em bên dưới.
            </span>
          </label>

          {needNewClass && (
            <div className="surface-2 rounded-lg p-3 space-y-3">
              <div className="text-xs text-slate-400">
                Lớp mới chỉ được mở khi bạn bấm xác nhận. Trước đó đây chỉ là bản nháp.
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Mã lớp mới</span>
                  <input className="field w-full" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">Chương trình</span>
                  <select className="field w-full" value={newProgramme} onChange={(e) => setNewProgramme(e.target.value)}>
                    {data.options.map((o: any) => <option key={o.code} value={o.code}>{o.name} ({o.code})</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="label">Tuần khai giảng lớp mới</span>
                <WeekPicker periodId={startPeriod} label={null} scope="planning" clearable
                  onPeriod={(id) => setStartPeriod(id)} className="w-full" />
              </label>
            </div>
          )}

          {/* ---------------------------------------------------- thời điểm và ghi chú */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Thời điểm chuyển</span>
              <input type="date" className="field w-full" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="block">
              <span className="label">Ghi chú</span>
              <input className="field w-full" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder={`Học tiếp sau lớp ${data.from.code}`} />
            </label>
          </div>

          {/* ---------------------------------------------------- danh sách học viên */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="label mb-0">Học viên ({moving.length}/{data.students.length} sẽ chuyển)</span>
              <button className="btn btn-sm" onClick={() => setSkipped({})}>Chọn lại tất cả</button>
            </div>
            <div className="surface-2 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th w-10" />
                    <th className="th">Học viên</th>
                    <th className="th">Lớp đích</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((s: any) => (
                    <tr key={s.id} className={`row-hover ${skipped[s.id] ? 'row-muted' : ''}`}>
                      <td className="td">
                        <input
                          type="checkbox" checked={!skipped[s.id]}
                          aria-label={`Chuyển ${s.fullName}`}
                          onChange={(e) => setSkipped((m) => ({ ...m, [s.id]: !e.target.checked }))}
                        />
                      </td>
                      <td className="td">
                        <div className="text-slate-100">{s.fullName}</div>
                        <div className="text-[11px] text-slate-500">{s.studentCode}</div>
                      </td>
                      <td className="td">
                        {skipped[s.id] ? (
                          <Info>Không chuyển lần này</Info>
                        ) : (
                          <select
                            className="field w-full" value={targetOf(s.id)}
                            onChange={(e) => setPerStudent((m) => ({ ...m, [s.id]: e.target.value }))}
                          >
                            <option value="new">Lớp mới {newCode ? `(${newCode})` : ''}</option>
                            {data.candidates.map((c: any) => (
                              <option key={c.id} value={String(c.id)}>{c.code}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <SectionNote>
            Lớp cũ <strong>giữ nguyên</strong> trong lịch sử — không đổi loại trên chính lớp đó.
            Toàn bộ điểm, nhật ký và case của giai đoạn trước vẫn nằm trong hồ sơ từng em, và case
            đang mở vẫn được theo dõi tiếp sau khi chuyển.
          </SectionNote>
        </div>
      )}
    </Drawer>
  );
}
