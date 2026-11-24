import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { DsLichSu, LichSuGap, lucNgan } from '../../ui/LichSuThayDoi.tsx';
import { dich } from '@shared/i18n/index.ts';

/** DUYET-QL: "Lịch sử · n" gập cuối thân panel duyệt / phần mở tại dòng — bấm mở tại chỗ, CHỈ khi mở mới gọi `/lich-su?loai=yeu-cau` (≤ 3 câu, ≤ 50 dòng).
 *  `n` đổi (quyết xong — số máy chủ trả kèm) mà danh sách đang mở → tải lại đúng phần lịch sử; đang gập thì không gọi gì. */
export function LichSuYeuCau({ id, n, className = 'mt-4' }: { id: number; n: number; className?: string }) {
  const [mo, setMo] = useState(false);
  const { data, loading, error, reload } = useApi<{ dong: { luc: string; nguoi: string | null; chu: string }[] }>(mo ? `/lich-su?loai=yeu-cau&id=${id}` : null, [mo, id, n]);
  if (!n) return null;
  /* GD-4c (H4): một kiểu lịch sử — `LichSuGap` "Lịch sử · n" (details: trạng thái mở có sẵn cho đọc màn hình). */
  return (
    <LichSuGap so={n} className={className} onMo={setMo}>
      {error ? <div className="ls-them"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading && !data ? <div className="ls-them"><Skeleton rows={2} /></div>
        : <DsLichSu dong={(data?.dong ?? []).map((d, i) => ({ key: i, gio: lucNgan(d.luc), ai: d.nguoi, viec: dich(d.chu) }))} />}
    </LichSuGap>
  );
}
