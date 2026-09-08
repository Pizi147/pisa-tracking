import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { Card, Empty, ErrorState, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { fmtDate } from '../lib/format.ts';

export default function ClassesPage() {
  const [branchId, setBranchId] = useState('');
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', branchId);
  if (category) qs.set('category', category);
  if (q) qs.set('q', q);

  const classes = useApi<any[]>(`/classes?${qs}`);
  const branches = useApi<any[]>('/ref/branches');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <span className="label">Tìm lớp</span>
          <input className="field w-56" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mã hoặc tên lớp" />
        </div>
        <div>
          <span className="label">Chi nhánh</span>
          <select className="field w-48" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Tất cả trong phạm vi</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <span className="label">Loại lớp</span>
          <select className="field w-36" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">FT và Normal</option>
            <option value="FT">FT</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
      </div>

      {classes.loading && <Skeleton rows={6} />}
      {classes.error && <ErrorState message={classes.error.message} onRetry={classes.reload} />}
      {classes.data && (
        <Card bodyClass="p-0">
          {classes.data.length === 0 ? (
            <Empty title="Không có lớp nào trong phạm vi của bạn" hint="Thử bỏ bộ lọc, hoặc kiểm tra lại phạm vi quyền của tài khoản đang dùng." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr>
                  <th className="th sticky-col">Lớp</th><th className="th">Loại</th><th className="th">Chi nhánh</th>
                  <th className="th">GVCN</th><th className="th">Học viên</th><th className="th">Giai đoạn / tuần</th>
                  <th className="th">Tiến độ</th><th className="th">Cập nhật tuần này</th><th className="th">Phân công của tôi</th>
                </tr></thead>
                <tbody>
                  {classes.data.map((c) => (
                    <tr key={c.id} className="row-hover">
                      <td className="td sticky-col">
                        <Link to={`/lop-hoc/${c.id}`} className="link font-medium whitespace-nowrap">{c.code}</Link>
                        <div className="text-[11px] text-slate-500">{c.name}</div>
                      </td>
                      <td className="td"><Pill tone="neutral">{c.category}</Pill>
                        <div className="text-[11px] text-slate-500 mt-0.5">{c.classTypeName}</div></td>
                      <td className="td text-slate-300">{c.branchName}</td>
                      <td className="td text-slate-300">{c.coreTeacher?.name ?? <span className="text-slate-600 text-xs italic">Chưa phân công</span>}</td>
                      <td className="td tabular-nums">{c.activeStudents}</td>
                      <td className="td text-slate-300 text-xs">{c.currentStage ?? 'Chưa cập nhật'}
                        <div className="text-[11px] text-slate-500">{c.templateName} v{c.templateVersion}</div></td>
                      <td className="td">
                        {!c.hasDeadlines ? <Pill tone="muted">Không đặt hạn</Pill>
                          : c.delayed ? <Pill tone="danger">Chậm</Pill> : <Pill tone="ok">Đúng tiến độ</Pill>}
                      </td>
                      <td className="td">
                        {c.missingWeeklyRows > 0
                          ? <Link to={`/lop-hoc/${c.id}?tab=tuan`} className="no-underline"><Pill tone="warn">{c.missingWeeklyRows} dòng chưa nhập</Pill></Link>
                          : <Pill tone="ok">Đã đủ</Pill>}
                      </td>
                      <td className="td">
                        {c.myAssignment ? (
                          <div className="flex flex-wrap gap-1">
                            {c.myAssignment.isCore && <Pill tone="ok">GVCN</Pill>}
                            {c.myAssignment.skills.map((s: string) => <Pill key={s} tone="info">{s}</Pill>)}
                          </div>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <SectionNote>
              "Chậm" chỉ áp dụng cho lớp có mốc kèm hạn. Lớp FT theo lộ trình linh hoạt không bị đánh dấu chậm chỉ vì học lâu.
            </SectionNote>
          </div>
        </Card>
      )}
    </div>
  );
}
