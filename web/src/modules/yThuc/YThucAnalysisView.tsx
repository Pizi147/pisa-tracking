import { useApi } from '../../lib/useApi.ts';
import { SoLieu } from '../../ui/SoLieu.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import {
  MEASURE_KINDS, MEASURE_KIND_LABEL, VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL,
  khoaNhomTrangThai, type ChuongTrinh, type ViolationCategory,
} from '@shared/domain/index.ts';

type Lean = { n: number; empty: boolean; byKind?: Record<string, number> | null };

/** G-10: MỌI `SoLieu`/`SoLieuO` của góc nhìn này mở danh sách bằng CÙNG bộ tham số — `extra` gồm `from` + `classId`. */
function useMetric(id: string, branchId: number | null, ct: ChuongTrinh, extra: Record<string, string>) {
  const q = new URLSearchParams();
  if (branchId) q.set('branchId', String(branchId));
  if (ct !== 'ca-hai') q.set('ct', ct);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  const qs = q.toString();
  return useApi<Lean>(`/metrics/${id}${qs ? `?${qs}` : ''}`, [id, branchId, ct, qs]);
}

const CHIP_TRANG_THAI: { key: 'tat-ca' | 'unhandled' | 'preparing' | 'done'; label: string }[] = [
  { key: 'tat-ca', label: 'Tổng' }, { key: 'unhandled', label: 'Chưa xử lý' },
  { key: 'preparing', label: 'Đang chuẩn bị' }, { key: 'done', label: 'Đã xử lý' },
];

/**
 * GÓC NHÌN `Ý THỨC & PHỐI HỢP` TRONG TAB PHÂN TÍCH (§7.6, kế hoạch PR-YT2 Task 8, P13/P14) — bố cục theo
 * `thiet-ke/SOS_VA_PHOI_HOP_V3.md` §7.6: bảng "Vi phạm theo nhóm" (Q17) · bảng "Phương án xử lý theo loại" (Q18) ·
 * khối Phối hợp SOS (Pb, P15 — giữ nguyên). Bộ lọc chi nhánh · chương trình · khoảng thời gian · LỚP (P14) đến từ
 * khung Phân tích; mọi số ở đây đi qua `<SoLieu>`/`<SoLieuO>` (hợp đồng số liệu), cùng `extra` (G-10).
 */
export function YThucAnalysisView({ branchId, ct, from, classId }: {
  branchId: number | null; ct: ChuongTrinh; from: string | null; classId: number | null;
}) {
  const extra: Record<string, string> = { ...(from ? { from } : {}), ...(classId ? { classId: String(classId) } : {}) };
  /* `case-cho-xac-dinh-nguyen-nhan` là chỉ số HỌC THUẬT (Case), không thuộc Ý thức/Phối hợp — máy chủ từ chối `classId` (400).
     Dùng riêng `extra` KHÔNG có `classId` cho ô này, và nói rõ bằng ⓘ để không ai tưởng nó đã lọc theo lớp đang chọn. */
  const extraKhongLop: Record<string, string> = from ? { from } : {};
  const phamVi = { branchId, chuongTrinh: ct };

  const hvCoViPham = useMetric('hv-co-vi-pham', branchId, ct, extra);
  const hvCanXuLy = useMetric('hv-can-xu-ly', branchId, ct, extra);
  const viPhamTheoNhom = useMetric('vi-pham-theo-nhom', branchId, ct, extra);
  const bienPhapDaThucHien = useMetric('bien-phap-da-thuc-hien', branchId, ct, extra);
  const bienPhapDangChuanBi = useMetric('bien-phap-dang-chuan-bi', branchId, ct, extra);
  const phoiHopLuotSos = useMetric('phoi-hop-luot-sos', branchId, ct, extra);
  const phoiHopDangXuLy = useMetric('phoi-hop-dang-xu-ly', branchId, ct, extra);
  const phoiHopHoanThanh = useMetric('phoi-hop-hoan-thanh', branchId, ct, extra);
  const caseChoXacDinh = useMetric('case-cho-xac-dinh-nguyen-nhan', branchId, ct, extraKhongLop);

  const nhomByKind = viPhamTheoNhom.data?.byKind ?? {};
  const dangChuanBiByKind = bienPhapDangChuanBi.data?.byKind ?? {};
  const daThucHienByKind = bienPhapDaThucHien.data?.byKind ?? {};

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-200 m-0">Vi phạm theo nhóm</h3>
          <span className="text-slate-500 text-xs cursor-help" aria-label="Ba thư cảnh cáo tách riêng"
            title="Ba thư cảnh cáo tách riêng">ⓘ</span>
        </div>
        <div className="grid gap-3 grid-cols-2 mb-3">
          <SoLieu id="hv-co-vi-pham" giaTri={hvCoViPham.data?.n ?? 0} phamVi={phamVi} rong={hvCoViPham.data?.empty} extra={extra} />
          <SoLieu id="hv-can-xu-ly" giaTri={hvCanXuLy.data?.n ?? 0} phamVi={phamVi} rong={hvCanXuLy.data?.empty} extra={extra} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="text-left text-[11px] uppercase tracking-wide text-slate-500 font-semibold pb-1.5">Nhóm</th>
                {CHIP_TRANG_THAI.map((c) => (
                  <th key={c.key} className="text-right text-[11px] uppercase tracking-wide text-slate-500 font-semibold pb-1.5">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VIOLATION_CATEGORIES.map((cat) => (
                <tr key={cat} className="border-t" style={{ borderColor: 'var(--line)' }}>
                  <td className="py-1.5 text-slate-200">{VIOLATION_CATEGORY_LABEL[cat as ViolationCategory]}</td>
                  {CHIP_TRANG_THAI.map((c) => (
                    <td key={c.key} className="py-1.5 text-right tabular-nums">
                      <SoLieuO id="vi-pham-theo-nhom" giaTri={nhomByKind[khoaNhomTrangThai(cat, c.key)] ?? 0} phamVi={phamVi}
                        extra={{ ...extra, kind: khoaNhomTrangThai(cat, c.key) }} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t font-semibold" style={{ borderColor: 'var(--line)' }}>
                <td className="py-1.5 text-slate-100">Tổng</td>
                {CHIP_TRANG_THAI.map((c) => (
                  <td key={c.key} className="py-1.5 text-right tabular-nums">
                    <SoLieuO id="vi-pham-theo-nhom" giaTri={nhomByKind[khoaNhomTrangThai('tat-ca', c.key)] ?? 0} phamVi={phamVi}
                      extra={{ ...extra, kind: khoaNhomTrangThai('tat-ca', c.key) }} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Phương án xử lý theo loại</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="text-left text-[11px] uppercase tracking-wide text-slate-500 font-semibold pb-1.5">Loại</th>
                <th className="text-right text-[11px] uppercase tracking-wide text-slate-500 font-semibold pb-1.5">Đang chuẩn bị</th>
                <th className="text-right text-[11px] uppercase tracking-wide text-slate-500 font-semibold pb-1.5">Đã thực hiện</th>
              </tr>
            </thead>
            <tbody>
              {MEASURE_KINDS.map((k) => (
                <tr key={k} className="border-t" style={{ borderColor: 'var(--line)' }}>
                  <td className="py-1.5 text-slate-200">{MEASURE_KIND_LABEL[k]}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    <SoLieuO id="bien-phap-dang-chuan-bi" giaTri={dangChuanBiByKind[k] ?? 0} phamVi={phamVi} extra={{ ...extra, kind: k }} />
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    <SoLieuO id="bien-phap-da-thuc-hien" giaTri={daThucHienByKind[k] ?? 0} phamVi={phamVi} extra={{ ...extra, kind: k }} />
                  </td>
                </tr>
              ))}
              <tr className="border-t font-semibold" style={{ borderColor: 'var(--line)' }}>
                <td className="py-1.5 text-slate-100">Tổng</td>
                <td className="py-1.5 text-right tabular-nums">
                  <SoLieuO id="bien-phap-dang-chuan-bi" giaTri={bienPhapDangChuanBi.data?.n ?? 0} phamVi={phamVi} extra={extra} />
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  <SoLieuO id="bien-phap-da-thuc-hien" giaTri={bienPhapDaThucHien.data?.n ?? 0} phamVi={phamVi} extra={extra} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-200 mt-0 mb-2">Phối hợp SOS</h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <SoLieu id="phoi-hop-luot-sos" giaTri={phoiHopLuotSos.data?.n ?? 0} phamVi={phamVi} rong={phoiHopLuotSos.data?.empty} extra={extra}
            phu={phoiHopLuotSos.data && phoiHopLuotSos.data.n > 0 ? (
              <>
                SOS 1 · <SoLieuO id="phoi-hop-luot-sos" giaTri={phoiHopLuotSos.data.byKind?.sos1 ?? 0} phamVi={phamVi} extra={{ ...extra, kind: 'sos1' }} />
                {'  '}SOS 2 · <SoLieuO id="phoi-hop-luot-sos" giaTri={phoiHopLuotSos.data.byKind?.sos2 ?? 0} phamVi={phamVi} extra={{ ...extra, kind: 'sos2' }} />
                {'  '}SOS 3 · <SoLieuO id="phoi-hop-luot-sos" giaTri={phoiHopLuotSos.data.byKind?.sos3 ?? 0} phamVi={phamVi} extra={{ ...extra, kind: 'sos3' }} />
              </>
            ) : undefined} />
          <SoLieu id="phoi-hop-dang-xu-ly" giaTri={phoiHopDangXuLy.data?.n ?? 0} phamVi={phamVi} rong={phoiHopDangXuLy.data?.empty} extra={extra} />
          <SoLieu id="phoi-hop-hoan-thanh" giaTri={phoiHopHoanThanh.data?.n ?? 0} phamVi={phamVi} rong={phoiHopHoanThanh.data?.empty} extra={extra} />
          <SoLieu id="case-cho-xac-dinh-nguyen-nhan" giaTri={caseChoXacDinh.data?.n ?? 0} phamVi={phamVi} rong={caseChoXacDinh.data?.empty}
            extra={extraKhongLop}
            phu={classId ? <span title="Chỉ số học thuật, máy chủ chưa lọc theo lớp — luôn tính cả chi nhánh đang xem.">ⓘ Không lọc theo lớp</span> : undefined} />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-slate-500 text-xs cursor-help"
          aria-label="Không có tỷ lệ cải thiện — Ý thức chỉ đếm việc đã ghi nhận và đã xử lý."
          title="Không có tỷ lệ cải thiện — Ý thức chỉ đếm việc đã ghi nhận và đã xử lý.">ⓘ</span>
        <span className="text-[11px] text-slate-500">Không có tỷ lệ cải thiện — Ý thức chỉ đếm việc đã ghi nhận và đã xử lý.</span>
      </div>
    </div>
  );
}
