import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton, Status } from '../../ui/ui.tsx';
import { gomNhomViec } from '@shared/domain/index.ts';
import { DongViec, type WorkGroup, type WorkItem } from './WorkList.tsx';
import { useNhacYThuc } from '../yThuc/YThucReminders.tsx';

/**
 * VIỆC CẦN LÀM CỦA TÔI — Tổng quan giáo viên (§3.2). Bốn nhóm cố định: Chấm điểm · Case học thuật · Ý thức & Phối hợp ·
 * Vận hành; mỗi nhóm có số; nhóm có việc quá hạn tự mở, nhóm khác gập. Mỗi nhóm hiện 5 dòng + "Xem thêm" tại chỗ; đủ danh
 * sách ở Công việc. Tín hiệu SOS lớp thường nằm ở Case học thuật, có hai nút ngay trên dòng (§3.10).
 */
/** `/my-work` khi GV chưa có phạm vi trả `{ summary, groups: [], scopeEmpty: true }` — KHÔNG có `items` (mywork.ts). */
type Work = { summary: { total: number }; items?: WorkItem[]; groups: WorkGroup[]; scopeEmpty: boolean };
const HIEN = 5;

export function ViecCuaToi() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi<Work>('/my-work');
  const nhac = useNhacYThuc();
  const nhom = useMemo(() => (data ? gomNhomViec(data.items ?? [], nhac.length) : []), [data, nhac.length]);
  const [mo, setMo] = useState<Record<string, boolean>>({});
  const [them, setThem] = useState<Record<string, number>>({});
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  return (
    <Card title="Việc cần làm của tôi" bodyClass="p-0">
      {loading || !data ? <div className="p-4"><Skeleton rows={5} /></div> : data.scopeEmpty || (data.summary.total === 0 && !nhom.length) ? (
        <div className="p-4"><Empty title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không có việc nào đang chờ bạn'} /></div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {nhom.map((g) => {
            const dangMo = mo[g.key] ?? g.moSan;
            const soHien = HIEN + (them[g.key] ?? 0);
            return (
              <section key={g.key}>
                <button type="button" aria-expanded={dangMo} aria-controls={`nhom-${g.key}`}
                  className="w-full appearance-none bg-transparent border-0 px-4 py-2.5 flex items-center gap-2 text-left cursor-pointer hover:bg-white/5"
                  onClick={() => setMo((s) => ({ ...s, [g.key]: !dangMo }))}>
                  <span className="text-slate-500" aria-hidden>{dangMo ? '▾' : '▸'}</span>
                  <span className="text-sm font-semibold text-slate-100">{g.label}</span>
                  <span className="tabular-nums text-xs text-slate-300 rounded-full px-1.5" style={{ background: 'var(--surface-2)' }}>{g.n}</span>
                  {(g.quaHan > 0 || g.homNay > 0) && (
                    <span className="text-[11px] text-slate-500">
                      {[g.quaHan ? `${g.quaHan} quá hạn` : null, g.homNay ? `${g.homNay} hạn hôm nay` : null].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </button>
                {dangMo && g.key === 'y-thuc' && (
                  <ul id={`nhom-${g.key}`} className="list-none m-0 p-0 pb-2">
                    {nhac.map((l, i) => (
                      <li key={`${l.classId}-${i}`} className="px-4 py-1.5">
                        <Link to={`/hoc-vien/lop/${l.classId}`} className="block no-underline text-xs text-slate-300 leading-snug hover:text-slate-100">
                          <Status kind="idle">Nhắc</Status> {l.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {dangMo && g.key !== 'y-thuc' && (
                  <>
                    <ul id={`nhom-${g.key}`} className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
                      {g.items.slice(0, soHien).map((it) => <li key={it.key}><DongViec it={it} onOpen={navigate} /></li>)}
                    </ul>
                    {g.items.length > soHien && (
                      <div className="px-4 py-2">
                        <button type="button" className="btn btn-sm" onClick={() => setThem((s) => ({ ...s, [g.key]: (s[g.key] ?? 0) + HIEN }))}>
                          Xem thêm {Math.min(HIEN, g.items.length - soHien)} việc
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
      <div className="px-4 py-2.5 border-t text-xs" style={{ borderColor: 'var(--line)' }}>
        <Link to="/cong-viec" className="link">Tất cả việc →</Link>
      </div>
    </Card>
  );
}
