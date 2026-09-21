import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { SoLieu } from '../../ui/SoLieu.tsx';
import { SectionNote } from '../../ui/ui.tsx';
import { MEASURE_KINDS, MEASURE_KIND_LABEL } from '@shared/domain/index.ts';

type Lean = { n: number; empty: boolean; byKind?: Record<string, number> | null };

function useMetric(id: string, branchId: number | null, from: string, to: string) {
  const qs = [branchId ? `branchId=${branchId}` : '', from ? `from=${from}` : '', to ? `to=${to}` : '']
    .filter(Boolean).join('&');
  return useApi<Lean>(`/metrics/${id}${qs ? `?${qs}` : ''}`, [id, branchId, from, to]);
}

/**
 * GÓC NHÌN `Ý THỨC & PHỐI HỢP` TRONG TAB PHÂN TÍCH (§7.6, plan.md K5) — không dashboard mới, ba khối
 * nhỏ trong khối Phân tích/Thực trạng đã có của Quản lý. Mọi số đi qua `<SoLieu>` (hợp đồng số liệu):
 * tự nói được cách tính và bấm ra đúng danh sách.
 *
 * Bộ lọc: chi nhánh (nhận từ trang cha) · khoảng thời gian. Máy chủ (`yThucMetric`/`phoiHopMetric`)
 * chỉ nhận `branchId` + `from`/`to`, chưa nhận lọc theo lớp — nên chưa có ô "lớp" ở đây.
 */
export function YThucAnalysisView({ branchId }: { branchId: number | null }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const viPhamTong = useMetric('vi-pham-tong', branchId, from, to);
  const viPhamChuaXuLy = useMetric('vi-pham-chua-xu-ly', branchId, from, to);
  const hvCoViPham = useMetric('hv-co-vi-pham', branchId, from, to);
  const hvCanXuLy = useMetric('hv-can-xu-ly', branchId, from, to);
  const bienPhapDaThucHien = useMetric('bien-phap-da-thuc-hien', branchId, from, to);
  const bienPhapDangChuanBi = useMetric('bien-phap-dang-chuan-bi', branchId, from, to);
  const bienPhapTheoLoai = useMetric('bien-phap-theo-loai', branchId, from, to);
  const phoiHopLuotSos = useMetric('phoi-hop-luot-sos', branchId, from, to);
  const phoiHopDangXuLy = useMetric('phoi-hop-dang-xu-ly', branchId, from, to);
  const phoiHopHoanThanh = useMetric('phoi-hop-hoan-thanh', branchId, from, to);
  const caseChoXacDinh = useMetric('case-cho-xac-dinh-nguyen-nhan', branchId, from, to);

  const byKind = bienPhapTheoLoai.data?.byKind ?? {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
          Từ ngày
          <input type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
          Đến ngày
          <input type="date" className="field" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Vi phạm</h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <SoLieu id="vi-pham-tong" giaTri={viPhamTong.data?.n ?? 0} phamVi={{ branchId }} rong={viPhamTong.data?.empty} />
          <SoLieu id="vi-pham-chua-xu-ly" giaTri={viPhamChuaXuLy.data?.n ?? 0} phamVi={{ branchId }} rong={viPhamChuaXuLy.data?.empty} />
          <SoLieu id="hv-co-vi-pham" giaTri={hvCoViPham.data?.n ?? 0} phamVi={{ branchId }} rong={hvCoViPham.data?.empty} />
          <SoLieu id="hv-can-xu-ly" giaTri={hvCanXuLy.data?.n ?? 0} phamVi={{ branchId }} rong={hvCanXuLy.data?.empty} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Biện pháp đã thực hiện theo loại</h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <SoLieu id="bien-phap-da-thuc-hien" giaTri={bienPhapDaThucHien.data?.n ?? 0} phamVi={{ branchId }} rong={bienPhapDaThucHien.data?.empty} />
          <SoLieu id="bien-phap-dang-chuan-bi" giaTri={bienPhapDangChuanBi.data?.n ?? 0} phamVi={{ branchId }} rong={bienPhapDangChuanBi.data?.empty} />
          {MEASURE_KINDS.map((k) => (
            <div key={k}>
              <div className="text-[11px] text-slate-500 mb-1">{MEASURE_KIND_LABEL[k]}</div>
              <SoLieu id="bien-phap-theo-loai" giaTri={byKind[k] ?? 0} phamVi={{ branchId }} rong={bienPhapTheoLoai.data?.empty}
                extra={{ kind: k }} />
            </div>
          ))}
        </div>
        <SectionNote>Chín loại tách riêng, ba thư cảnh cáo (lần 1/2/3) không gộp thành một.</SectionNote>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Phối hợp SOS</h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <SoLieu id="phoi-hop-luot-sos" giaTri={phoiHopLuotSos.data?.n ?? 0} phamVi={{ branchId }} rong={phoiHopLuotSos.data?.empty} />
          <SoLieu id="phoi-hop-dang-xu-ly" giaTri={phoiHopDangXuLy.data?.n ?? 0} phamVi={{ branchId }} rong={phoiHopDangXuLy.data?.empty} />
          <SoLieu id="phoi-hop-hoan-thanh" giaTri={phoiHopHoanThanh.data?.n ?? 0} phamVi={{ branchId }} rong={phoiHopHoanThanh.data?.empty} />
          <SoLieu id="case-cho-xac-dinh-nguyen-nhan" giaTri={caseChoXacDinh.data?.n ?? 0} phamVi={{ branchId }} rong={caseChoXacDinh.data?.empty} />
        </div>
      </div>
      <SectionNote>Không có cột "tỷ lệ cải thiện" — Ý thức không đo tiến bộ, chỉ đếm việc đã ghi nhận và đã xử lý.</SectionNote>
    </div>
  );
}
