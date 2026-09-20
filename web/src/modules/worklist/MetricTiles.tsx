import { useApi } from '../../lib/useApi.ts';
import { Skeleton } from '../../ui/ui.tsx';
import { SoLieu } from '../../ui/SoLieu.tsx';

/**
 * BỐN Ô SỐ Ở ĐẦU TỔNG QUAN (design plan §18.2) — mỗi ô đi qua `<SoLieu>`.
 *
 * Bốn chỉ số: HV có case đang mở · Case thiếu phương án · Tín hiệu cần xác minh · Phương án cần cập
 * nhật. Con số và danh sách mở ra khi bấm là CÙNG MỘT tập ID (`/metrics/:id`), nên không có chuyện ô ghi
 * 7 mà bấm vào ra 5 dòng, và không thể lệch với con số ở màn khác dùng cùng chỉ số.
 *
 * "Học viên dưới kỳ vọng" (design plan) CHƯA có ở đây: hàm tập ID của `hv-sos-hien-tai` chưa viết, và
 * một ô số không kiểm chứng được thì tệ hơn không có ô nào (plan.md mục 12.8).
 */
const TILES = ['hv-co-case-mo', 'case-thieu-pa', 'tin-hieu-cho-xac-minh', 'pa-can-cap-nhat'] as const;

type Result = { n: number; empty: boolean };

function Tile({ id, branchId }: { id: (typeof TILES)[number]; branchId: number | null }) {
  const { data, loading, error } = useApi<Result>(`/metrics/${id}${branchId ? `?branchId=${branchId}` : ''}`, [id, branchId]);
  if (error) return <div className="card p-4 text-xs text-rose-300">Không tải được số liệu này.</div>;
  if (loading || !data) return <div className="card p-4"><Skeleton rows={2} /></div>;
  return <SoLieu id={id} giaTri={data.n} rong={data.empty} phamVi={{ branchId }} />;
}

export function MetricTiles({ branchId }: { branchId: number | null }) {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4" aria-label="Số liệu chính">
      {TILES.map((id) => <Tile key={id} id={id} branchId={branchId} />)}
    </div>
  );
}
