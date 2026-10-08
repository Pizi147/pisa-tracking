import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { TheYeuCau } from './TheYeuCau.tsx';
import { useTheNhanManh } from './HopChoDuyet.tsx';
import type { TheYeuCauDto } from '@shared/domain/index.ts';

/**
 * CÔNG VIỆC › YÊU CẦU CỦA TÔI (PR-DUYET, M8) — thẻ mình đã gửi Quản lý: đang chờ trước, rồi đã xử lý 60 ngày (Đã duyệt · Bị từ chối +
 * lý do · Đã trả lời · Tự đóng). Không có nút quyết định. Chuông "QL đã duyệt/từ chối/trả lời" mở đúng thẻ ở đây (`?the=`).
 */
export function YeuCauCuaToi() {
  const { data, loading, error, reload } = useApi<{ the: TheYeuCauDto[] }>('/yeu-cau?hop=cua-toi');
  const nhan = useTheNhanManh(data?.the);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading) return <Card><Skeleton rows={5} /></Card>;
  const ds = data?.the ?? [];
  if (!ds.length) {
    return <Card><Empty title="Bạn chưa gửi yêu cầu nào cho Quản lý"
      hint="Đề xuất PA cần duyệt, Xin hỗ trợ QL ở Kết quả tuần, hoặc Đề xuất sửa ở ⋯ hồ sơ học viên — mọi yêu cầu đều hiện ở đây." /></Card>;
  }
  const cho = ds.filter((x) => x.trangThai === 'cho').length;
  return (
    <div className="space-y-2">
      <p className="m-0 text-[12px] tabular-nums text-slate-400">{cho} đang chờ Quản lý · {ds.length - cho} đã xử lý (60 ngày)</p>
      {ds.map((y) => <TheYeuCau key={y.id} yc={y} laNguoiXin nhanManh={nhan === y.id} onXong={reload} />)}
    </div>
  );
}
