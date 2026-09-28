import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';

/**
 * "CẦN BỔ SUNG ĐÁNH GIÁ" — phương án đã kết thúc mà chưa có kết quả xác định (F05).
 *
 * Chúng KHÔNG nằm trong bảng hiệu quả và không vào mẫu số (D03): bảng không được bày một hàng/cột
 * "chưa rõ" như thể nó thuộc mẫu. Nhưng chúng cũng không được biến mất — đây là một việc cần người
 * làm — nên hiện thành MỘT LIÊN KẾT ngoài bảng, mở ra danh sách đúng những phương án đó (cùng bộ lọc
 * phạm vi với bảng vừa xem, nên số ghi ở đây và số dòng trong danh sách là một).
 */
export function NeedsEvaluation({ count, url }: { count: number; url: string }) {
  const [open, setOpen] = useState(false);
  const { data, loading, error, reload } = useApi<{ count: number; rows: { id: number; title: string; sub: string; href: string }[] }>(
    open ? url : null, [url, open],
  );
  if (count <= 0) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="appearance-none bg-transparent border-0 p-0 cursor-pointer text-xs text-amber-200 underline decoration-dotted underline-offset-4 hover:text-amber-100 text-left">
        Cần bổ sung đánh giá · {count} phương án đã kết thúc nhưng chưa có kết quả xác định
      </button>
      {open && (
        <KhungPanel tieuDe={`${count} phương án — Cần bổ sung đánh giá`} onDong={() => setOpen(false)}
          ngCanh="Không tính vào bảng hiệu quả cho tới khi có kết quả xác định">
          <div className="pt-3">
            {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
              : loading || !data ? <Skeleton rows={4} />
              : !data.rows.length ? <Empty title="Không còn phương án nào cần bổ sung" />
              : (
                <ul className="list-none p-0 m-0 space-y-1.5">
                  {data.rows.map((r) => (
                    <li key={r.id}>
                      <Link to={r.href} onClick={() => setOpen(false)}
                        className="block rounded-lg border px-3 py-2 no-underline hover:brightness-125"
                        style={{ borderColor: 'var(--line)' }}>
                        <span className="block text-sm text-slate-100">{r.title}</span>
                        {r.sub && <span className="block text-[11px] text-slate-500 mt-0.5">{r.sub}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </KhungPanel>
      )}
    </>
  );
}
