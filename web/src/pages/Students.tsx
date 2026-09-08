import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { useSession } from '../lib/session.tsx';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { ImportWizard } from '../components/ImportWizard.tsx';
import { fmtBand, fmtDate, fmtRatePct, testTypeLabel } from '../lib/format.ts';

export default function StudentsPage() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const [importOpen, setImportOpen] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  const q = params.get('q') ?? '';
  const branchId = params.get('branchId') ?? '';
  const classId = params.get('classId') ?? '';
  const category = params.get('category') ?? '';
  const concern = params.get('concern') ?? '';

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  const qs = new URLSearchParams();
  for (const [k, v] of [['q', q], ['branchId', branchId], ['classId', classId], ['category', category], ['concern', concern]]) {
    if (v) qs.set(k, v);
  }
  qs.set('limit', '200');

  const students = useApi<any>(`/students?${qs}`);
  const branches = useApi<any[]>('/ref/branches');
  const classes = useApi<any[]>('/ref/classes');
  const canImport = !!session?.capabilities?.importStudents;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <span className="label">Tìm kiếm</span>
          <input className="field w-64" value={q} onChange={(e) => set('q', e.target.value)} placeholder="Tên (có/không dấu) hoặc mã HV" />
        </div>
        <div>
          <span className="label">Chi nhánh</span>
          <select className="field w-44" value={branchId} onChange={(e) => set('branchId', e.target.value)}>
            <option value="">Tất cả trong phạm vi</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <span className="label">Lớp</span>
          <select className="field w-44" value={classId} onChange={(e) => set('classId', e.target.value)}>
            <option value="">Tất cả</option>
            {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
        <div>
          <span className="label">Loại lớp</span>
          <select className="field w-32" value={category} onChange={(e) => set('category', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="FT">FT</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
        <div>
          <span className="label">Tình trạng</span>
          <select className="field w-44" value={concern} onChange={(e) => set('concern', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="concern">Cần chú ý (theo ngưỡng)</option>
            <option value="warning">Có ghi nhận cảnh báo</option>
            <option value="needs_update">Thiếu dữ liệu cần cập nhật</option>
          </select>
        </div>
        <div className="flex-1" />
        <label className="flex items-center gap-1.5 text-xs text-slate-400 pb-2">
          <input type="checkbox" checked={showExtra} onChange={(e) => setShowExtra(e.target.checked)} />
          Hiện cột bổ sung
        </label>
        {canImport && <button className="btn btn-primary btn-sm" onClick={() => setImportOpen(true)}>Nhập từ Excel/CSV</button>}
      </div>

      {students.loading && <Skeleton rows={8} />}
      {students.error && <ErrorState message={students.error.message} onRetry={students.reload} />}
      {students.data && (
        <Card bodyClass="p-0"
          title={<span>Học viên <span className="text-slate-500 font-normal">({students.data.total} người)</span></span>}>
          {students.data.rows.length === 0 ? (
            <Empty
              title={students.data.scopeEmpty ? 'Bạn chưa được cấp phạm vi xem học viên' : 'Không có học viên khớp bộ lọc'}
              hint={students.data.scopeEmpty
                ? 'Tài khoản này chưa có phân công lớp hoặc học viên nào.'
                : 'Thử bỏ bớt bộ lọc hoặc tìm theo mã học viên.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr>
                  <th className="th sticky-col">Họ tên / Mã HV</th>
                  <th className="th">Lớp hiện tại</th><th className="th">Chi nhánh</th><th className="th">Target</th>
                  <th className="th">Điểm official gần nhất</th><th className="th">Tín hiệu cần chú ý</th><th className="th">Tư vấn viên</th>
                  {showExtra && <><th className="th">Ngày sinh</th><th className="th">Chuyên cần</th><th className="th">Bài tập</th></>}
                </tr></thead>
                <tbody>
                  {students.data.rows.map((s: any) => {
                    const enr = s.enrollments[0];
                    return (
                      <tr key={s.id} className="row-hover">
                        <td className="td sticky-col">
                          <Link to={`/hoc-vien/${s.id}`} className="link font-medium">{s.fullName}</Link>
                          <div className="text-[11px] text-slate-500">{s.studentCode}</div>
                        </td>
                        <td className="td">
                          {s.enrollments.length === 0
                            ? <span className="text-slate-600 text-xs italic">Chưa có lớp</span>
                            : s.enrollments.map((e: any) => (
                                <div key={e.enrollmentId}>
                                  <Link to={`/lop-hoc/${e.classId}`} className="link text-xs">{e.classCode}</Link>
                                  {e.status === 'paused' && <span className="text-amber-400 text-[11px] ml-1">tạm dừng</span>}
                                </div>
                              ))}
                        </td>
                        <td className="td text-slate-300 text-xs">{enr?.branchName ?? '—'}</td>
                        <td className="td tabular-nums">{s.targetBand ?? '—'}</td>
                        <td className="td">
                          {!s.officialScore ? <span className="text-slate-600 text-xs italic">Chưa có bài official</span> : (
                            <>
                              <span className="tabular-nums text-slate-100">
                                {s.officialScore.scores.overall != null
                                  ? `Overall ${fmtBand(s.officialScore.scores.overall)}`
                                  : 'Chưa có Overall'}
                              </span>
                              <div className="text-[11px] text-slate-500">
                                {testTypeLabel(s.officialScore.testType)} · {fmtDate(s.officialScore.testDate)}
                                {s.officialScore.missingSkills.length > 0 && <span className="text-amber-400"> · thiếu {s.officialScore.missingSkills.length} skill</span>}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="td">
                          <div className="flex flex-col gap-1 items-start">
                            {s.warningOpen > 0 && <Pill tone="danger">Có ghi nhận cảnh báo</Pill>}
                            {s.signal?.concern && <Pill tone="warn">Cần chú ý</Pill>}
                            {s.needsUpdateWeeks > 0 && <Pill tone="info">Thiếu {s.needsUpdateWeeks} dòng dữ liệu</Pill>}
                            {!s.signal?.concern && s.warningOpen === 0 && s.needsUpdateWeeks === 0 && <Pill tone="ok">Bình thường</Pill>}
                          </div>
                        </td>
                        <td className="td text-slate-300 text-xs">{s.consultant?.name ?? '—'}</td>
                        {showExtra && (
                          <>
                            <td className="td text-xs text-slate-400">{fmtDate(s.dob)}</td>
                            <td className="td text-xs">{fmtRatePct(s.signal?.attendance?.rate != null ? Math.round(s.signal.attendance.rate * 1000) / 10 : null)}</td>
                            <td className="td text-xs">{fmtRatePct(s.signal?.homework?.rate != null ? Math.round(s.signal.homework.rate * 1000) / 10 : null)}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <SectionNote>
              "Cần chú ý" là tín hiệu tính từ dữ liệu đã nhập, khác hoàn toàn với "Có ghi nhận cảnh báo" — cảnh báo chỉ do người có quyền ghi nhận.
            </SectionNote>
          </div>
        </Card>
      )}

      {importOpen && <ImportWizard onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); students.reload(); }} />}
    </div>
  );
}
