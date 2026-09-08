import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from './Toast.tsx';
import { Drawer } from './Drawer.tsx';
import { DataCell, Empty, Field, Pill, SectionNote } from './ui.tsx';
import { SaveIndicator, type SaveStatus } from './SaveState.tsx';
import { attendanceLabel, fmtRatePct, homeworkLabel, skillLabel, weekRangeLabel } from '../lib/format.ts';
import { ACTIVITY_KIND_LABEL, ATTENDANCE_STATUSES, HOMEWORK_STATUSES } from '@shared/domain.ts';

type Row = {
  id: number; studentId: number; studentName: string; studentCode: string;
  enrollmentId: number; enrollmentStatus: string; attemptNo: number;
  applicable: boolean; expected: number | null; expectedSource: string;
  attended: number | null; supplemental: number | null;
  homeworkAssigned: number | null; homeworkCompleted: number | null;
  attendanceSource: string; homeworkSource: string;
  note: string | null; rev: number; totalSessions: number | null;
  attendanceRate: number | null; homeworkRate: number | null;
  dataState: string; estimate: number | null; targetBand: number | null;
  detailCounts: { attendance: number; homework: number; activities: number };
  updatedByName: string | null;
};

type Table = { classId: number; weekStart: string; skill: string; canEdit: boolean; editableSkills: string[]; rows: Row[] };

type Draft = Record<string, string>;
type CellKey = `${number}:${string}`;

const NUMERIC_FIELDS = ['attended', 'supplemental', 'homeworkAssigned', 'homeworkCompleted'] as const;
type NumericField = (typeof NUMERIC_FIELDS)[number];

/** Bảng nhập nhanh theo tuần — autosave theo từng ô, chống ghi đè bản mới bằng clientSeq. */
export function WeeklyGrid({ table, onReload }: { table: Table; onReload: () => void }) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(table.rows);
  const [draft, setDraft] = useState<Draft>({});
  const [status, setStatus] = useState<Record<CellKey, SaveStatus>>({});
  const [errors, setErrors] = useState<Record<CellKey, string>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const seqRef = useRef(0);
  const timers = useRef<Record<CellKey, ReturnType<typeof setTimeout>>>({});

  // Đổi lớp/skill/tuần thì mới xoá bản nháp. Bảng tải lại sau một lần lưu KHÔNG được
  // xoá những ô người dùng đang gõ dở hoặc đang ở trạng thái lưu lỗi.
  const queryKey = `${table.classId}:${table.skill}:${table.weekStart}`;
  useEffect(() => {
    setDraft({});
    setStatus({});
    setErrors({});
    setSelected(new Set());
  }, [queryKey]);
  useEffect(() => { setRows(table.rows); }, [table.rows]);
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const editable = table.canEdit;

  const commit = useCallback(
    async (row: Row, field: NumericField | 'note', rawValue: string) => {
      const key: CellKey = `${row.id}:${field}`;
      const parsed = field === 'note'
        ? rawValue
        : rawValue.trim() === '' ? null : Number(rawValue);
      if (field !== 'note' && parsed !== null && (!Number.isFinite(parsed as number) || (parsed as number) < 0)) {
        setStatus((s) => ({ ...s, [key]: 'error' }));
        setErrors((e) => ({ ...e, [key]: 'Giá trị phải là số không âm' }));
        return;
      }
      const seq = ++seqRef.current;
      setStatus((s) => ({ ...s, [key]: 'saving' }));
      try {
        const res = await api.patch<{ record: Row & { studentName?: string }; stale?: boolean }>(
          `/weekly-records/${row.id}`, { [field]: parsed, clientSeq: seq },
        );
        if (res.stale) {
          setStatus((s) => ({ ...s, [key]: 'saved' }));
          return;
        }
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...res.record, studentName: r.studentName, studentCode: r.studentCode, estimate: r.estimate, targetBand: r.targetBand } : r)));
        setDraft((d) => { const n = { ...d }; delete n[key]; return n; });
        setStatus((s) => ({ ...s, [key]: 'saved' }));
        setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
        invalidate('/dashboard');
        setTimeout(() => setStatus((s) => ({ ...s, [key]: 'idle' })), 1600);
      } catch (e: any) {
        // Lỗi lưu: giữ nguyên bản nháp của người dùng, không báo đã lưu.
        setStatus((s) => ({ ...s, [key]: 'error' }));
        setErrors((e2) => ({ ...e2, [key]: e.hint ? `${e.message} ${e.hint}` : e.message }));
      }
    },
    [],
  );

  const onCellChange = (row: Row, field: NumericField | 'note', value: string) => {
    const key: CellKey = `${row.id}:${field}`;
    setDraft((d) => ({ ...d, [key]: value }));
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => void commit(row, field, value), field === 'note' ? 900 : 700);
  };

  const retry = (row: Row, field: NumericField | 'note') => {
    const key: CellKey = `${row.id}:${field}`;
    void commit(row, field, draft[key] ?? '');
  };

  const cellValue = (row: Row, field: NumericField | 'note'): string => {
    const key: CellKey = `${row.id}:${field}`;
    if (key in draft) return draft[key];
    const v = (row as any)[field];
    return v === null || v === undefined ? '' : String(v);
  };

  const selectableRows = useMemo(() => rows.filter((r) => r.applicable), [rows]);
  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);

  const totals = useMemo(() => {
    const applicable = rows.filter((r) => r.applicable);
    const withAttendance = applicable.filter((r) => r.attended != null && (r.expected ?? 0) > 0);
    const attended = withAttendance.reduce((s, r) => s + (r.attended ?? 0), 0);
    const expected = withAttendance.reduce((s, r) => s + (r.expected ?? 0), 0);
    const withHw = applicable.filter((r) => r.homeworkCompleted != null && (r.homeworkAssigned ?? 0) > 0);
    return {
      applicable: applicable.length,
      notApplicable: rows.length - applicable.length,
      notUpdated: applicable.filter((r) => r.dataState === 'not_updated').length,
      attendanceRate: expected > 0 ? Math.round((attended / expected) * 1000) / 10 : null,
      homeworkRate: withHw.length
        ? Math.round((withHw.reduce((s, r) => s + (r.homeworkCompleted ?? 0), 0) /
            withHw.reduce((s, r) => s + (r.homeworkAssigned ?? 0), 0)) * 1000) / 10
        : null,
      supplemental: applicable.reduce((s, r) => s + (r.supplemental ?? 0), 0),
    };
  }, [rows]);

  if (!rows.length) {
    return <Empty title="Lớp chưa có học viên đang học trong tuần này" hint="Chọn tuần khác hoặc kiểm tra lại danh sách đăng ký của lớp." />;
  }

  return (
    <div className="space-y-3">
      {!editable && (
        <div className="card p-3 border-amber-500/30">
          <div className="text-amber-300 text-sm font-medium">Bạn đang xem {skillLabel(table.skill)} ở chế độ chỉ đọc</div>
          <p className="text-xs text-slate-400 mt-1">
            {table.editableSkills.length
              ? `Bạn được phân công sửa: ${table.editableSkills.map(skillLabel).join(', ')}. Các skill khác vẫn xem được để đối chiếu.`
              : 'Bạn không được phân công sửa skill nào ở lớp này, nhưng vẫn xem được toàn bộ dữ liệu học vụ của lớp.'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs text-slate-400">
          {totals.applicable} dòng áp dụng
          {totals.notApplicable > 0 && <> · {totals.notApplicable} không áp dụng</>}
          {totals.notUpdated > 0 && <> · <span className="text-amber-300">{totals.notUpdated} chưa cập nhật</span></>}
        </div>
        <div className="flex-1" />
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" checked={showExtra} onChange={(e) => setShowExtra(e.target.checked)} />
          Hiện cột bổ sung
        </label>
        {editable && (
          <button className="btn btn-sm" disabled={selected.size === 0} onClick={() => setBulkOpen(true)}>
            Áp dụng cho {selected.size} dòng đã chọn
          </button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[54rem]">
          <thead>
            <tr>
              {editable && (
                <th className="th w-8">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả dòng áp dụng"
                    checked={selected.size > 0 && selected.size === selectableRows.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(selectableRows.map((r) => r.id)) : new Set())}
                  />
                </th>
              )}
              <th className="th sticky-col" style={{ left: editable ? '2rem' : 0 }}>Học viên</th>
              <th className="th">Buổi chính<div className="font-normal normal-case text-[10px] text-slate-500">đã học / kỳ vọng</div></th>
              <th className="th">Bổ trợ</th>
              <th className="th">Bài tập<div className="font-normal normal-case text-[10px] text-slate-500">hoàn thành / được giao</div></th>
              <th className="th">Ước lượng</th>
              <th className="th">Ghi chú ngắn</th>
              {showExtra && <th className="th">Tỷ lệ</th>}
              {showExtra && <th className="th">Nguồn dữ liệu</th>}
              <th className="th">Trạng thái</th>
              <th className="th w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const na = !row.applicable;
              const attKey: CellKey = `${row.id}:attended`;
              const hwKey: CellKey = `${row.id}:homeworkCompleted`;
              const rowStatus = [attKey, hwKey, `${row.id}:supplemental` as CellKey, `${row.id}:homeworkAssigned` as CellKey, `${row.id}:note` as CellKey]
                .map((k) => status[k])
                .find((s) => s && s !== 'idle') ?? 'idle';
              const errorEntry = Object.entries(errors).find(([k]) => k.startsWith(`${row.id}:`));
              const rowError = errorEntry?.[1];
              const errorField = errorEntry?.[0].split(':')[1] as NumericField | 'note' | undefined;

              return (
                <tr key={row.id} className={`row-hover ${na ? 'opacity-60' : ''}`}>
                  {editable && (
                    <td className="td">
                      <input
                        type="checkbox" disabled={na}
                        aria-label={`Chọn ${row.studentName}`}
                        checked={selected.has(row.id)}
                        onChange={(e) => setSelected((s) => { const n = new Set(s); e.target.checked ? n.add(row.id) : n.delete(row.id); return n; })}
                      />
                    </td>
                  )}
                  <td className="td sticky-col" style={{ left: editable ? '2rem' : 0 }}>
                    <Link to={`/hoc-vien/${row.studentId}`} className="link">{row.studentName}</Link>
                    <div className="text-[11px] text-slate-500">
                      {row.studentCode}
                      {row.attemptNo > 1 && <span className="ml-1 text-sky-400">· lần học {row.attemptNo}</span>}
                      {row.enrollmentStatus === 'paused' && <span className="ml-1 text-amber-400">· tạm dừng</span>}
                    </div>
                  </td>

                  <td className="td">
                    {na ? <span className="text-slate-600 text-xs italic">Không áp dụng</span> : (
                      <div className="flex items-center gap-1">
                        <input
                          className="field w-14 text-center tabular-nums" inputMode="numeric"
                          disabled={!editable || row.attendanceSource === 'detail'}
                          title={row.attendanceSource === 'detail' ? 'Đang tính từ chi tiết buổi học — sửa trong drawer chi tiết' : undefined}
                          placeholder="—"
                          value={cellValue(row, 'attended')}
                          onChange={(e) => onCellChange(row, 'attended', e.target.value)}
                        />
                        <span className="text-slate-500">/</span>
                        <span className="tabular-nums text-slate-300 w-6">{row.expected ?? '—'}</span>
                      </div>
                    )}
                  </td>

                  <td className="td">
                    {na ? <span className="text-slate-600">—</span> : (
                      <input
                        className="field w-14 text-center tabular-nums" inputMode="numeric" placeholder="—"
                        disabled={!editable || row.detailCounts.activities > 0}
                        title={row.detailCounts.activities > 0 ? 'Đang tính từ danh sách hoạt động bổ trợ' : undefined}
                        value={cellValue(row, 'supplemental')}
                        onChange={(e) => onCellChange(row, 'supplemental', e.target.value)}
                      />
                    )}
                  </td>

                  <td className="td">
                    {na ? <span className="text-slate-600">—</span> : (
                      <div className="flex items-center gap-1">
                        <input
                          className="field w-14 text-center tabular-nums" inputMode="numeric" placeholder="—"
                          disabled={!editable || row.homeworkSource === 'detail'}
                          value={cellValue(row, 'homeworkCompleted')}
                          onChange={(e) => onCellChange(row, 'homeworkCompleted', e.target.value)}
                        />
                        <span className="text-slate-500">/</span>
                        <input
                          className="field w-14 text-center tabular-nums" inputMode="numeric" placeholder="—"
                          disabled={!editable || row.homeworkSource === 'detail'}
                          value={cellValue(row, 'homeworkAssigned')}
                          onChange={(e) => onCellChange(row, 'homeworkAssigned', e.target.value)}
                        />
                      </div>
                    )}
                  </td>

                  <td className="td tabular-nums text-slate-300">
                    {row.estimate != null ? row.estimate.toFixed(1) : <span className="text-slate-600 text-xs">Chưa có</span>}
                  </td>

                  <td className="td">
                    <input
                      className="field min-w-[9rem]" placeholder={na ? '' : 'Ghi chú…'} disabled={!editable || na}
                      value={cellValue(row, 'note')}
                      onChange={(e) => onCellChange(row, 'note', e.target.value)}
                    />
                  </td>

                  {showExtra && (
                    <td className="td text-xs">
                      <div>CC: <DataCell value={fmtRatePct(row.attendanceRate)} state={na ? 'not_applicable' : undefined} /></div>
                      <div>BT: {fmtRatePct(row.homeworkRate)}</div>
                      <div className="text-slate-500">Tổng buổi: {row.totalSessions ?? '—'}</div>
                    </td>
                  )}
                  {showExtra && (
                    <td className="td text-[11px] text-slate-400">
                      <div>Chuyên cần: {row.attendanceSource === 'detail' ? 'từ chi tiết' : 'nhập tổng hợp'}</div>
                      <div>Bài tập: {row.homeworkSource === 'detail' ? 'từ chi tiết' : 'nhập tổng hợp'}</div>
                      <div>Kỳ vọng: {row.expectedSource === 'manual' ? 'sửa riêng' : row.expectedSource === 'enrollment' ? 'theo học viên' : 'theo lớp'}</div>
                    </td>
                  )}

                  <td className="td">
                    {rowStatus !== 'idle'
                      ? <SaveIndicator
                          status={rowStatus}
                          error={rowError}
                          onRetry={errorField ? () => retry(row, errorField) : undefined}
                        />
                      : na ? <Pill tone="muted">Không áp dụng</Pill>
                        : row.dataState === 'not_updated' ? <Pill tone="warn">Chưa cập nhật</Pill>
                          : row.dataState === 'partial' ? <Pill tone="info">Nhập một phần</Pill>
                            : <Pill tone="ok">Đã cập nhật</Pill>}
                    {rowError && <div className="text-[11px] text-red-300 mt-1 max-w-[16rem]">{rowError}</div>}
                  </td>

                  <td className="td">
                    <button className="btn btn-sm btn-ghost" onClick={() => setDetailRow(row)} title="Chi tiết buổi học / bài tập">⋯</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="td text-xs text-slate-400" colSpan={editable ? 3 : 2}>
                Tổng lớp (chỉ tính dòng đã nhập)
              </td>
              <td className="td text-xs text-slate-300">{totals.supplemental} buổi bổ trợ</td>
              <td className="td text-xs text-slate-300">Bài tập {fmtRatePct(totals.homeworkRate)}</td>
              <td className="td text-xs text-slate-300" colSpan={showExtra ? 5 : 3}>
                Chuyên cần buổi chính {fmtRatePct(totals.attendanceRate)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <SectionNote>
        Ô để trống nghĩa là <strong>chưa nhập</strong>, khác với nhập số 0. Buổi bổ trợ được cộng vào tổng số buổi đã học
        nhưng không bù vào tỷ lệ tham dự buổi chính.
      </SectionNote>

      {bulkOpen && (
        <BulkApplyDialog
          rows={selectedRows}
          skill={table.skill}
          onClose={() => setBulkOpen(false)}
          onDone={(msg) => { setBulkOpen(false); setSelected(new Set()); onReload(); toast.push('ok', msg); }}
          onError={(msg) => toast.push('error', msg)}
        />
      )}

      {detailRow && (
        <DetailDrawer
          row={detailRow}
          skill={table.skill}
          canEdit={editable}
          onClose={() => setDetailRow(null)}
          onChanged={onReload}
        />
      )}
    </div>
  );
}

function BulkApplyDialog({ rows, skill, onClose, onDone, onError }: {
  rows: Row[]; skill: string; onClose: () => void;
  onDone: (msg: string) => void; onError: (msg: string) => void;
}) {
  const [field, setField] = useState<NumericField>('attended');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ applied: number[]; failed: { id: number; reason: string }[] } | null>(null);

  const labels: Record<NumericField, string> = {
    attended: 'Buổi chính đã học',
    supplemental: 'Buổi bổ trợ',
    homeworkAssigned: 'Số bài được giao',
    homeworkCompleted: 'Số bài hoàn thành',
  };

  const apply = async () => {
    setBusy(true);
    try {
      const res = await api.post<any>('/weekly-records/bulk', {
        recordIds: rows.map((r) => r.id),
        patch: { [field]: value.trim() === '' ? null : Number(value) },
      });
      setResult(res);
      invalidate('/dashboard');
      if (res.failed.length === 0) onDone(`Đã áp dụng cho ${res.applied.length} dòng.`);
    } catch (e: any) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-lg"
      title="Áp dụng giá trị chung"
      subtitle={`${skillLabel(skill)} · ${rows.length} dòng được chọn`}
      footer={
        result ? <button className="btn btn-primary" onClick={onClose}>Đóng</button> : (
          <>
            <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
            <button className="btn btn-primary" onClick={apply} disabled={busy}>
              {busy ? 'Đang áp dụng…' : `Áp dụng cho ${rows.length} dòng`}
            </button>
          </>
        )
      }>
      {!result ? (
        <div className="space-y-4">
          <div className="card p-3 text-xs text-slate-400">
            Chỉ áp dụng cho <strong className="text-slate-200">{rows.length} dòng bạn đã chọn</strong>, không áp dụng cho các dòng
            đang bị bộ lọc ẩn đi. Mỗi dòng vẫn được kiểm tra quyền riêng ở máy chủ.
          </div>
          <Field label="Trường cần áp dụng">
            <select className="field" value={field} onChange={(e) => setField(e.target.value as NumericField)}>
              {NUMERIC_FIELDS.map((f) => <option key={f} value={f}>{labels[f]}</option>)}
            </select>
          </Field>
          <Field label="Giá trị" hint="Để trống nghĩa là xoá về trạng thái chưa nhập.">
            <input className="field" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ví dụ: 1" />
          </Field>
          <ul className="text-xs text-slate-400 max-h-40 overflow-y-auto space-y-0.5">
            {rows.map((r) => <li key={r.id}>• {r.studentName} ({r.studentCode})</li>)}
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-teal-300">Thành công: {result.applied.length} dòng</div>
          {result.failed.length > 0 && (
            <div>
              <div className="text-sm text-red-300 mb-1">Không lưu được: {result.failed.length} dòng</div>
              <ul className="text-xs text-slate-400 space-y-1">
                {result.failed.map((f) => {
                  const row = rows.find((r) => r.id === f.id);
                  return <li key={f.id}>• {row?.studentName ?? f.id}: {f.reason}</li>;
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

function DetailDrawer({ row, skill, canEdit, onClose, onChanged }: {
  row: Row; skill: string; canEdit: boolean; onClose: () => void; onChanged: () => void;
}) {
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [att, setAtt] = useState({ sessionDate: '', status: 'present', note: '' });
  const [hw, setHw] = useState({ title: '', status: 'completed', completed: true, submittedAt: '' });
  const [act, setAct] = useState({ activityDate: '', sessions: '1', kind: 'tutor', teacherName: '', note: '' });

  const load = useCallback(async () => {
    const d = await api.get<any>(`/weekly-records/${row.id}/detail`);
    setData(d);
  }, [row.id]);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    try { await fn(); await load(); onChanged(); toast.push('ok', okMsg); }
    catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-3xl"
      title={`${row.studentName} — ${skillLabel(skill)}`}
      subtitle={`${row.studentCode} · tuần ${weekRangeLabel((data?.record?.weekStart) ?? '')}`}>
      {!data ? <div className="text-slate-400">Đang tải chi tiết…</div> : (
        <div className="space-y-5">
          <div className="card p-3 text-xs text-slate-400 leading-relaxed">
            Mỗi chiều dữ liệu chỉ có một nguồn. Khi bạn thêm chi tiết, ô nhập tổng hợp tương ứng sẽ chuyển sang chỉ đọc và
            số liệu được tính lại từ chi tiết — không cộng dồn cả hai.
          </div>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-200">Buổi học chi tiết</h3>
              <Pill tone={data.record.attendanceSource === 'detail' ? 'info' : 'neutral'}>
                Nguồn: {data.record.attendanceSource === 'detail' ? 'chi tiết buổi học' : 'nhập tổng hợp'}
              </Pill>
            </div>
            {data.delta.attendance.detailRows > 0 && data.record.attendanceSource !== 'detail' && (
              <div className="card p-2 mb-2 border-amber-500/40 text-xs text-amber-300">
                Chênh lệch: tổng hợp đang là {data.delta.attendance.aggregate ?? 'chưa nhập'}, tính từ chi tiết là {data.delta.attendance.fromDetail}.
              </div>
            )}
            <ul className="space-y-1 mb-2">
              {data.attendance.length === 0 && <li className="text-xs text-slate-500">Chưa ghi buổi học chi tiết nào.</li>}
              {data.attendance.map((a: any) => (
                <li key={a.id} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-300 tabular-nums">{a.session_date}</span>
                  <Pill tone={a.status === 'absent' ? 'danger' : a.status === 'excused' ? 'info' : a.status === 'late' ? 'warn' : 'ok'}>
                    {attendanceLabel(a.status)}
                  </Pill>
                  {a.note && <span className="text-xs text-slate-500">{a.note}</span>}
                  {canEdit && (
                    <button className="btn btn-sm btn-ghost ml-auto" disabled={busy}
                      onClick={() => run(() => api.del(`/attendance-records/${a.id}`), 'Đã xoá buổi học')}>Xoá</button>
                  )}
                </li>
              ))}
            </ul>
            {canEdit && (
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Ngày"><input type="date" className="field w-40" value={att.sessionDate} onChange={(e) => setAtt({ ...att, sessionDate: e.target.value })} /></Field>
                <Field label="Trạng thái">
                  <select className="field w-36" value={att.status} onChange={(e) => setAtt({ ...att, status: e.target.value })}>
                    {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{attendanceLabel(s)}</option>)}
                  </select>
                </Field>
                <button className="btn btn-sm" disabled={busy || !att.sessionDate}
                  onClick={() => run(() => api.post(`/weekly-records/${row.id}/attendance`, att), 'Đã ghi buổi học')}>Thêm buổi</button>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-2">
              Bản demo tính <strong>Có mặt</strong> và <strong>Đi muộn</strong> là đã tham dự. <strong>Vắng có phép</strong> hiển thị riêng
              và không tự tạo quyết định kỷ luật.
            </p>
          </section>

          <section className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-200">Bài tập chi tiết</h3>
              <Pill tone={data.record.homeworkSource === 'detail' ? 'info' : 'neutral'}>
                Nguồn: {data.record.homeworkSource === 'detail' ? 'danh sách bài' : 'nhập tổng hợp'}
              </Pill>
            </div>
            <ul className="space-y-1 mb-2">
              {data.homework.length === 0 && <li className="text-xs text-slate-500">Chưa có bài tập chi tiết nào.</li>}
              {data.homework.map((h: any) => (
                <li key={h.id} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-200">{h.title}</span>
                  <Pill tone={h.status === 'missing' ? 'danger' : h.status === 'late' ? 'warn' : h.status === 'completed' ? 'ok' : 'info'}>
                    {homeworkLabel(h.status)}
                  </Pill>
                  <Pill tone={h.completed ? 'ok' : 'muted'}>{h.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</Pill>
                </li>
              ))}
            </ul>
            {canEdit && (
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Tên bài"><input className="field w-48" value={hw.title} onChange={(e) => setHw({ ...hw, title: e.target.value })} /></Field>
                <Field label="Trạng thái">
                  <select className="field w-36" value={hw.status}
                    onChange={(e) => setHw({ ...hw, status: e.target.value, completed: e.target.value === 'completed' })}>
                    {HOMEWORK_STATUSES.map((s) => <option key={s} value={s}>{homeworkLabel(s)}</option>)}
                  </select>
                </Field>
                <label className="flex items-center gap-1.5 text-xs text-slate-300 pb-2">
                  <input type="checkbox" checked={hw.completed} onChange={(e) => setHw({ ...hw, completed: e.target.checked })} />
                  Đã hoàn thành
                </label>
                <button className="btn btn-sm" disabled={busy || !hw.title.trim()}
                  onClick={() => run(() => api.post(`/weekly-records/${row.id}/homework`, hw), 'Đã thêm bài tập')}>Thêm bài</button>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-2">
              "Nộp muộn" không tự suy ra là đã hoàn thành — cần tick riêng ô hoàn thành.
            </p>
          </section>

          <section className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Buổi bổ trợ</h3>
            <ul className="space-y-1 mb-2">
              {data.activities.length === 0 && <li className="text-xs text-slate-500">Chưa ghi buổi bổ trợ nào.</li>}
              {data.activities.map((a: any) => (
                <li key={a.id} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-300 tabular-nums">{a.activity_date}</span>
                  <Pill tone="info">{ACTIVITY_KIND_LABEL[a.kind as keyof typeof ACTIVITY_KIND_LABEL] ?? a.kind}</Pill>
                  <span className="text-slate-400 text-xs">{a.sessions} buổi</span>
                  {a.teacher_name_text && <span className="text-xs text-slate-500">GV: {a.teacher_name_text}</span>}
                  {canEdit && (
                    <button className="btn btn-sm btn-ghost ml-auto" disabled={busy}
                      onClick={() => run(() => api.del(`/activities/${a.id}`), 'Đã xoá buổi bổ trợ')}>Xoá</button>
                  )}
                </li>
              ))}
            </ul>
            {canEdit && (
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Ngày"><input type="date" className="field w-40" value={act.activityDate} onChange={(e) => setAct({ ...act, activityDate: e.target.value })} /></Field>
                <Field label="Số buổi"><input className="field w-20" inputMode="numeric" value={act.sessions} onChange={(e) => setAct({ ...act, sessions: e.target.value })} /></Field>
                <Field label="Loại">
                  <select className="field w-40" value={act.kind} onChange={(e) => setAct({ ...act, kind: e.target.value })}>
                    {Object.entries(ACTIVITY_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Giáo viên (ghi chú)"><input className="field w-40" value={act.teacherName} onChange={(e) => setAct({ ...act, teacherName: e.target.value })} /></Field>
                <button className="btn btn-sm" disabled={busy || !act.activityDate}
                  onClick={() => run(() => api.post(`/weekly-records/${row.id}/activities`, { ...act, sessions: Number(act.sessions) }), 'Đã ghi buổi bổ trợ')}>Thêm</button>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-2">
              Tên giáo viên ghi ở đây chỉ là ghi chú. Giáo viên chỉ có quyền sửa dữ liệu khi được phân công đúng lớp/skill và còn hiệu lực.
            </p>
          </section>
        </div>
      )}
    </Drawer>
  );
}
