import { useApi } from '../../lib/useApi.ts';
import { SoLieu } from '../../ui/SoLieu.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { SectionNote } from '../../ui/ui.tsx';
import { MEASURE_KINDS, MEASURE_KIND_LABEL, type ChuongTrinh } from '@shared/domain/index.ts';

type Lean = { n: number; empty: boolean; byKind?: Record<string, number> | null };

function useMetric(id: string, branchId: number | null, ct: ChuongTrinh, from: string | null) {
  const q = new URLSearchParams();
  if (branchId) q.set('branchId', String(branchId));
  if (from) q.set('from', from);
  if (ct !== 'ca-hai') q.set('ct', ct);
  const qs = q.toString();
  return useApi<Lean>(`/metrics/${id}${qs ? `?${qs}` : ''}`, [id, branchId, ct, from]);
}

/**
 * GÓC NHÌN `Ý THỨC & PHỐI HỢP` TRONG TAB PHÂN TÍCH (§7.6, plan.md K5) — không dashboard mới, ba khối
 * nhỏ trong khung Phân tích đã có của Quản lý. Mọi số đi qua `<SoLieu>` (hợp đồng số liệu):
 * tự nói được cách tính và bấm ra đúng danh sách.
 *
 * Bộ lọc chi nhánh · chương trình · khoảng thời gian đến từ khung Phân tích (PR-Pb) — không có ô riêng ở đây.
 * Máy chủ (`yThucMetric`/`phoiHopMetric`) chưa nhận lọc theo lớp (P14, sau deploy) nên chưa có ô "lớp".
 */
export function YThucAnalysisView({ branchId, ct, from }: { branchId: number | null; ct: ChuongTrinh; from: string | null }) {
  const viPhamTong = useMetric('vi-pham-tong', branchId, ct, from);
  const viPhamChuaXuLy = useMetric('vi-pham-chua-xu-ly', branchId, ct, from);
  const hvCoViPham = useMetric('hv-co-vi-pham', branchId, ct, from);
  const hvCanXuLy = useMetric('hv-can-xu-ly', branchId, ct, from);
  const bienPhapDaThucHien = useMetric('bien-phap-da-thuc-hien', branchId, ct, from);
  const bienPhapDangChuanBi = useMetric('bien-phap-dang-chuan-bi', branchId, ct, from);
  const bienPhapTheoLoai = useMetric('bien-phap-theo-loai', branchId, ct, from);
  const phoiHopLuotSos = useMetric('phoi-hop-luot-sos', branchId, ct, from);
  const phoiHopDangXuLy = useMetric('phoi-hop-dang-xu-ly', branchId, ct, from);
  const phoiHopHoanThanh = useMetric('phoi-hop-hoan-thanh', branchId, ct, from);
  const caseChoXacDinh = useMetric('case-cho-xac-dinh-nguyen-nhan', branchId, ct, from);

  const byKind = bienPhapTheoLoai.data?.byKind ?? {};
  const phamVi = { branchId, chuongTrinh: ct };
  const period: Record<string, string> = from ? { from } : {};

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Vi phạm</h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <SoLieu id="vi-pham-tong" giaTri={viPhamTong.data?.n ?? 0} phamVi={phamVi} rong={viPhamTong.data?.empty} extra={period} />
          <SoLieu id="vi-pham-chua-xu-ly" giaTri={viPhamChuaXuLy.data?.n ?? 0} phamVi={phamVi} rong={viPhamChuaXuLy.data?.empty} extra={period} />
          <SoLieu id="hv-co-vi-pham" giaTri={hvCoViPham.data?.n ?? 0} phamVi={phamVi} rong={hvCoViPham.data?.empty} extra={period} />
          <SoLieu id="hv-can-xu-ly" giaTri={hvCanXuLy.data?.n ?? 0} phamVi={phamVi} rong={hvCanXuLy.data?.empty} extra={period} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Phương án xử lý đã thực hiện theo loại</h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <SoLieu id="bien-phap-da-thuc-hien" giaTri={bienPhapDaThucHien.data?.n ?? 0} phamVi={phamVi} rong={bienPhapDaThucHien.data?.empty} extra={period} />
          <SoLieu id="bien-phap-dang-chuan-bi" giaTri={bienPhapDangChuanBi.data?.n ?? 0} phamVi={phamVi} rong={bienPhapDangChuanBi.data?.empty} extra={period} />
          {MEASURE_KINDS.map((k) => (
            <div key={k}>
              <div className="text-[11px] text-slate-500 mb-1">{MEASURE_KIND_LABEL[k]}</div>
              <SoLieu id="bien-phap-theo-loai" giaTri={byKind[k] ?? 0} phamVi={phamVi} rong={bienPhapTheoLoai.data?.empty}
                extra={{ ...period, kind: k }} />
            </div>
          ))}
        </div>
        <SectionNote>Chín loại tách riêng, ba thư cảnh cáo (lần 1/2/3) không gộp thành một.</SectionNote>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Phối hợp SOS</h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <SoLieu id="phoi-hop-luot-sos" giaTri={phoiHopLuotSos.data?.n ?? 0} phamVi={phamVi} rong={phoiHopLuotSos.data?.empty} extra={period}
            phu={phoiHopLuotSos.data && phoiHopLuotSos.data.n > 0 ? (
              <>
                SOS 1 · <SoLieuO id="phoi-hop-luot-sos" giaTri={phoiHopLuotSos.data.byKind?.sos1 ?? 0} phamVi={phamVi} extra={{ ...period, kind: 'sos1' }} />
                {'  '}SOS 2 · <SoLieuO id="phoi-hop-luot-sos" giaTri={phoiHopLuotSos.data.byKind?.sos2 ?? 0} phamVi={phamVi} extra={{ ...period, kind: 'sos2' }} />
                {'  '}SOS 3 · <SoLieuO id="phoi-hop-luot-sos" giaTri={phoiHopLuotSos.data.byKind?.sos3 ?? 0} phamVi={phamVi} extra={{ ...period, kind: 'sos3' }} />
              </>
            ) : undefined} />
          <SoLieu id="phoi-hop-dang-xu-ly" giaTri={phoiHopDangXuLy.data?.n ?? 0} phamVi={phamVi} rong={phoiHopDangXuLy.data?.empty} extra={period} />
          <SoLieu id="phoi-hop-hoan-thanh" giaTri={phoiHopHoanThanh.data?.n ?? 0} phamVi={phamVi} rong={phoiHopHoanThanh.data?.empty} extra={period} />
          <SoLieu id="case-cho-xac-dinh-nguyen-nhan" giaTri={caseChoXacDinh.data?.n ?? 0} phamVi={phamVi} rong={caseChoXacDinh.data?.empty} extra={period} />
        </div>
      </div>
      <SectionNote>Không có cột "tỷ lệ cải thiện" — Ý thức không đo tiến bộ, chỉ đếm việc đã ghi nhận và đã xử lý.</SectionNote>
    </div>
  );
}
