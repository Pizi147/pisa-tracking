import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { Card, Skeleton } from './ui.tsx';

/**
 * KHỐI RIÊNG CỦA QUẢN LÝ.
 *
 * THEO LỚP mở sẵn: đó là câu hỏi mỗi sáng — lớp nào đang nặng, mở ra xem ngay.
 * THEO NGƯỜI thu gọn: chỉ cần khi phải đi thúc ai đó. Bày cả hai cùng lúc thì màn Quản lý
 * dài gấp đôi và phần "việc của tôi" bị đẩy xuống dưới màn hình.
 *
 * Bảng theo người KHÔNG tô màu tốt/xấu và KHÔNG xếp hạng. Một bảng "giáo viên nào chậm
 * nhất" là thứ ai cũng hiểu ngay và không ai muốn bị đưa vào — nó biến công cụ điều phối
 * thành công cụ đánh giá, và người ta sẽ học cách làm đẹp số thay vì làm việc.
 */

type ClassRow = {
  id: number; code: string;
  needScores: number; noPlan: number; overdueReview: number; pendingApproval: number; total: number;
};
type PersonRow = {
  id: number; name: string; classCount: number;
  needScores: number; needResult: number; waitingOnMe: number; total: number;
};

export function BranchPulse({ branchId }: { branchId: number | null }) {
  const { data, loading } = useApi<{ classes: ClassRow[]; people: PersonRow[] } | null>(
    `/branch-pulse${branchId ? `?branchId=${branchId}` : ''}`, [branchId],
  );
  const [showPeople, setShowPeople] = useState(false);

  if (loading) return <Card title="Việc cần lưu ý"><Skeleton rows={3} /></Card>;
  if (!data) return null;

  const num = (n: number, tone?: 'warn' | 'danger') => (
    <span className={`tabular-nums ${n === 0 ? 'text-slate-600'
      : tone === 'danger' ? 'text-rose-200' : tone === 'warn' ? 'text-amber-200' : 'text-slate-100'}`}>
      {n}
    </span>
  );

  return (
    <Card title="Việc cần lưu ý" bodyClass="p-0">
      {data.classes.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-400 m-0">Không lớp nào đang tồn việc. </p>
      ) : (
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th sticky-col">Lớp</th>
                <th className="th text-right">Chưa nhập điểm</th>
                <th className="th text-right">Chưa có phương án</th>
                <th className="th text-right">Quá hạn cập nhật</th>
                <th className="th text-right">Chờ tôi duyệt</th>
              </tr>
            </thead>
            <tbody>
              {data.classes.map((c) => (
                <tr key={c.id} className="row-hover">
                  <td className="td sticky-col whitespace-nowrap">
                    <Link className="link" to={`/hoc-vien/lop/${c.id}`}>{c.code}</Link>
                  </td>
                  <td className="td text-right">{num(c.needScores, 'warn')}</td>
                  <td className="td text-right">{num(c.noPlan, 'warn')}</td>
                  <td className="td text-right">{num(c.overdueReview, 'danger')}</td>
                  <td className="td text-right">{num(c.pendingApproval, 'danger')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t" style={{ borderColor: 'var(--line)' }}>
        <button className="btn btn-sm btn-ghost m-2" onClick={() => setShowPeople((v) => !v)}>
          {showPeople ? '− Ẩn' : '+ Xem theo giáo viên'} ({data.people.length})
        </button>
        {showPeople && (
          <>
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th sticky-col">Giáo viên</th>
                    <th className="th text-right">Lớp</th>
                    <th className="th text-right">Ô điểm chưa nhập</th>
                    <th className="th text-right">Chưa cập nhật kết quả</th>
                    <th className="th text-right">Đề xuất chờ tôi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.people.map((x) => (
                    <tr key={x.id}>
                      <td className="td sticky-col whitespace-nowrap text-slate-100">{x.name}</td>
                      <td className="td text-right">{num(x.classCount)}</td>
                      <td className="td text-right">{num(x.needScores)}</td>
                      <td className="td text-right">{num(x.needResult)}</td>
                      <td className="td text-right">{num(x.waitingOnMe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-2.5 text-[11px] text-slate-500 m-0">
              Bảng này để biết <strong>cần nói chuyện với ai</strong>, không phải để xếp hạng — nên
              không có màu tốt/xấu và không sắp theo "ai tệ nhất". Số ở đây là việc đang tồn, và tồn
              vì nhiều lý do khác nhau.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
