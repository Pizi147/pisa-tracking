import { useApi } from '../../lib/useApi.ts';
import { Skeleton } from '../../ui/ui.tsx';
import { SoLieu } from '../../ui/SoLieu.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { thamSoCt, tuanCuaHanGhiKetQua, type ChuongTrinh } from '@shared/domain/index.ts';

/**
 * BỐN Ô SỐ — tầng 3 của Tổng quan Quản lý, theo khung đang chọn (PR-VAI-a Q5, mockup 23 màn B). Mỗi ô đi qua `<SoLieu>`: con số và
 * danh sách mở ra là CÙNG một tập ID.
 *   Học viên dưới kỳ vọng (lớp thường: chưa đạt) · Học viên có Case đang mở (phụ "n Case") · Case chờ xác nhận — Progress Test (phụ "k quá
 *   hạn · đã thành thẻ Báo QL") · PA quá hạn ghi kết quả (phụ "tuần W4 SEP" = tuần của hạn cũ nhất, Q25).
 */
type Lean = { n: number; denominator: number | null; empty: boolean; hanCu?: string | null };
const qs = (branchId: number | null, ct: ChuongTrinh) => `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');
function useSo(id: string, branchId: number | null, ct: ChuongTrinh) {
  const q = qs(branchId, ct);
  return useApi<Lean>(q ? `/metrics/${id}?${q}` : `/metrics/${id}`, [id, branchId, ct]);
}
function O({ id, branchId, ct, nhan, phu }: {
  id: string; branchId: number | null; ct: ChuongTrinh; nhan: string; phu?: (d: Lean) => React.ReactNode;
}) {
  const { data, loading, error } = useSo(id, branchId, ct);
  if (error) return <div className="card p-4 text-xs text-bad">Không tải được số liệu này.</div>;
  if (loading || !data) return <div className="card p-4"><Skeleton rows={2} /></div>;
  return <SoLieu id={id} giaTri={data.n} rong={data.empty} phamVi={{ branchId, chuongTrinh: ct }} nhan={nhan} phu={phu?.(data)} />;
}
function SoPhu({ id, branchId, ct, sau }: { id: string; branchId: number | null; ct: ChuongTrinh; sau: (n: number) => React.ReactNode }) {
  const { data } = useSo(id, branchId, ct);
  if (!data) return null;
  return <>{data.n > 0 && <SoLieuO id={id} giaTri={data.n} phamVi={{ branchId, chuongTrinh: ct }} />}{sau(data.n)}</>;
}

export function MetricTiles({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const { homNay } = useNgayNghiepVu();
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4" aria-label="Số liệu chính">
      <O id="hv-duoi-ky-vong-mon" branchId={branchId} ct={ct} nhan={ct === 'thuong' ? 'Học viên chưa đạt' : 'Học viên dưới kỳ vọng'}
        phu={(d) => (d.denominator !== null ? `/ ${d.denominator} đánh giá được` : null)} />
      <O id="hv-co-case-mo" branchId={branchId} ct={ct} nhan="Học viên có Case đang mở"
        phu={() => <SoPhu id="case-mo" branchId={branchId} ct={ct} sau={(n) => (n ? ' Case' : 'Không có Case mở')} />} />
      <O id="case-cho-xac-dinh-nguyen-nhan" branchId={branchId} ct={ct} nhan="Case chờ xác nhận"
        phu={() => <SoPhu id="case-xac-dinh-nguyen-nhan-qua-han" branchId={branchId} ct={ct}
          sau={(n) => (n ? <span className="font-semibold text-late"> quá hạn<span className="font-normal text-slate-500"> · đã thành thẻ Báo QL</span></span> : 'không có Case quá hạn')} />} />
      <O id="pa-can-cap-nhat" branchId={branchId} ct={ct} nhan="PA chưa có Kết quả"
        phu={(d) => (d.hanCu ? tuanCuaHanGhiKetQua(d.hanCu, homNay) : null)} />
    </div>
  );
}
