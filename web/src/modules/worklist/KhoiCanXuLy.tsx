/** ĐIỂM ĐÁNG CHÚ Ý — khối Số liệu của CX (OV-15d: Cần xử lý + dải Chờ duyệt của QL thay bằng Tổng quan A, `TongQuanQl.tsx`). */
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { DanhSachSoLieu } from '../../ui/SoLieu.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import type { ChuongTrinh, DiemChuY } from '@shared/domain/index.ts';

/** Q11: nhãn chữ của Điểm đáng chú ý (mockup 23). Đặt ở web: luật PR-T cấm chữ này trong máy chủ/shared (tên trạng thái SOS cũ). */
/* OV-11f (CA1-11): "Cần chú ý" chỉ còn MỘT nghĩa trên Tổng quan (ô học viên TVV / CX) — chip ở đây là "Chưa ổn". */
const MUC_CHU_Y_LABEL: Record<DiemChuY['muc'], string> = { 'can-chu-y': 'Chưa ổn', tot: 'Tốt' };

/** ĐIỂM ĐÁNG CHÚ Ý (tầng 3, theo khung) — route riêng `/tong-quan/diem-chu-y` để đổi công tắc chỉ tải lại khối này. */
export function DiemDangChuY({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const { data, loading, error, reload } = useApi<DiemChuY[]>(`/tong-quan/diem-chu-y?ct=${ct}${branchId ? `&branchId=${branchId}` : ''}`, [branchId, ct]);
  /* OV-13b: panel đang mở lên URL (`so-lieu=dcy:{loại}`). */
  const [moChu, datMo] = useThamSoUrl('so-lieu', '');
  const xMo = moChu.startsWith('dcy:') ? data?.find((x) => x.loai === moChu.slice(4)) ?? null : null;
  const mo = xMo ? { id: xMo.metricId, n: xMo.soDanhSach, extra: xMo.extra } : null;
  const setMo = (x: { loai: string } | null) => datMo(x ? `dcy:${x.loai}` : '');
  const phamVi = { branchId, chuongTrinh: ct };
  /* OV-11f (TQ-11): panel "Dưới kỳ vọng" theo khung — lớp thường nói "chưa đạt" như câu vừa đọc. */
  const tenPanel = (id: string) => (id === 'hv-duoi-ky-vong-mon' ? (ct === 'thuong' ? 'Học viên chưa đạt' : 'Học viên dưới kỳ vọng') : undefined);
  return (
    <Card title="Điểm đáng chú ý" bodyClass="p-0">
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <div className="p-4"><Skeleton rows={3} /></div> : !data.length ? (
          <p className="m-0 px-4 py-3 text-sm text-slate-400">Chưa có điểm nào đủ dữ liệu để nêu.</p>
        ) : (
          <ul className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
            {data.map((x) => (
              <li key={x.loai} className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-start gap-3 px-4 py-2.5">
                {/* Q11: nhãn chữ thay chấm màu — không để màu là tín hiệu duy nhất. */}
                <span className="pt-0.5"><Nhan tone={x.muc === 'tot' ? 'ok' : 'soon'}>{MUC_CHU_Y_LABEL[x.muc]}</Nhan></span>
                <span className="min-w-0">
                  <span className="block text-sm text-slate-100">{x.cau}</span>
                  <button type="button" className="link min-h-[44px] text-xs appearance-none bg-transparent border-0 p-0 cursor-pointer sm:min-h-0"
                    onClick={() => setMo({ loai: x.loai })}>{x.lienKet}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      {mo && <DanhSachSoLieu id={mo.id} giaTri={mo.n} phamVi={phamVi} extra={mo.extra} open onClose={() => setMo(null)} ten={tenPanel(mo.id)} />}
    </Card>
  );
}
