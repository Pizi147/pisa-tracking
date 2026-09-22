import { useApi } from '../../lib/useApi.ts';
import { Skeleton } from '../../ui/ui.tsx';
import { SoLieu } from '../../ui/SoLieu.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { thamSoCt, type ChuongTrinh } from '@shared/domain/index.ts';

/**
 * BỐN Ô SỐ Ở ĐẦU TỔNG QUAN (§3.2, 4.1 đã chốt) — mỗi ô đi qua `<SoLieu>`: con số và danh sách mở ra là CÙNG một tập ID.
 *   Học viên dưới kỳ vọng (lớp thường: chưa đạt) · Học viên có Case đang mở · Chờ xác minh quá hạn · PA học thuật cần cập nhật.
 */
type Lean = { n: number; denominator: number | null; empty: boolean };
const qs = (branchId: number | null, ct: ChuongTrinh) => `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');
function useSo(id: string, branchId: number | null, ct: ChuongTrinh) {
  const q = qs(branchId, ct);
  return useApi<Lean>(q ? `/metrics/${id}?${q}` : `/metrics/${id}`, [id, branchId, ct]);
}
function O({ id, branchId, ct, nhan, phu, tone }: {
  id: string; branchId: number | null; ct: ChuongTrinh; nhan: string; tone?: 'danger' | 'warn';
  phu?: (d: Lean) => React.ReactNode;
}) {
  const { data, loading, error } = useSo(id, branchId, ct);
  if (error) return <div className="card p-4 text-xs text-rose-300">Không tải được số liệu này.</div>;
  if (loading || !data) return <div className="card p-4"><Skeleton rows={2} /></div>;
  return <SoLieu id={id} giaTri={data.n} rong={data.empty} phamVi={{ branchId, chuongTrinh: ct }} nhan={nhan} tone={data.n ? tone : undefined} phu={phu?.(data)} />;
}
function CaseMo({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const { data } = useSo('case-mo', branchId, ct);
  if (!data) return null;
  return <><SoLieuO id="case-mo" giaTri={data.n} phamVi={{ branchId, chuongTrinh: ct }} /> Case</>;
}

export function MetricTiles({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4" aria-label="Số liệu chính">
      <O id="hv-duoi-ky-vong-mon" branchId={branchId} ct={ct} nhan={ct === 'thuong' ? 'Học viên chưa đạt' : 'Học viên dưới kỳ vọng'}
        phu={(d) => (d.denominator !== null ? `/ ${d.denominator} đánh giá được` : null)} />
      <O id="hv-co-case-mo" branchId={branchId} ct={ct} nhan="Học viên có Case đang mở" phu={() => <CaseMo branchId={branchId} ct={ct} />} />
      <O id="tin-hieu-qua-han" branchId={branchId} ct={ct} nhan="Chờ xác minh quá hạn" tone="danger" phu={(d) => (d.n > 0 ? 'tín hiệu SOS lớp thường' : null)} />
      <O id="pa-can-cap-nhat" branchId={branchId} ct={ct} nhan="PA học thuật cần cập nhật" tone="warn" />
    </div>
  );
}
