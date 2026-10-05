import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, NhanTrangThai, Skeleton } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { DanhSachSoLieu } from '../../ui/SoLieu.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { chipChoDuyet, type ChuongTrinh, type DemYeuCau, type DiemChuY, type DongCanXuLyGoc } from '@shared/domain/index.ts';

/**
 * CẦN XỬ LÝ (PR-VAI-a, mockup 23 màn B, K1-06): bảng năm cột — nhãn trạng thái · việc · Người giữ việc · Hạn · nút đúng việc. Quá hạn lên
 * đầu, việc giáo viên đang trễ trước việc của Bạn. Mỗi dòng là MỘT chỉ số của sổ: bấm số mở đúng tập (panel), nút mở chỗ làm được việc
 * ("Xem và nhắc" → Công việc đã lọc sẵn, có nút Nhắc). Gộp hai khung (Q5) nên số và danh sách không mang `ct`.
 * Điện thoại (< 640 px): mỗi dòng một thẻ, không cuộn ngang.
 */
type DongCanXuLy = DongCanXuLyGoc & {
  truoc?: string; phu: string; kem?: string; goiY?: string;
  nguoi: 'ban' | { dau: string; phu: string; ids: number[] };
  han: { ngay: string; loai: 'cap-nhat-pa' | 'viec-van-hanh' } | { chu: string; quaHan?: true };
  den: string | null;
};
type Data = { canXuLy: DongCanXuLy[]; choDuyet?: DemYeuCau };

export function KhoiCanXuLy({ branchId }: { branchId: number | null }) {
  const { data, loading, error, reload } = useApi<Data>(branchId ? `/tong-quan/quan-ly?branchId=${branchId}` : '/tong-quan/quan-ly', [branchId]);
  const dienThoai = useDienThoai();
  const [mo, setMo] = useState<{ id: string; n: number } | null>(null);
  const phamVi = { branchId };
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;

  const viec = (x: DongCanXuLy) => (
    <span className="min-w-0" title={x.goiY}>
      <span className="block text-sm text-slate-100">
        {x.truoc && <>{x.truoc} </>}
        <SoLieuO id={x.metricId} giaTri={x.n} phamVi={phamVi} className="text-base font-semibold" /> {x.nhan}{x.kem ? ` · ${x.kem}` : ''}
      </span>
      {x.phu && <span className="block truncate text-xs text-slate-500">{x.phu}</span>}
    </span>
  );
  const nguoi = (x: DongCanXuLy) => (x.nguoi === 'ban' ? <span className="text-xs text-slate-200">Bạn</span> : (
    <span className="block min-w-0 text-xs">
      <span className="block text-slate-200">{x.nguoi.dau}</span>
      {x.nguoi.phu && <span className="block truncate text-slate-500" title={x.nguoi.phu}>{x.nguoi.phu}</span>}
    </span>
  ));
  const han = (x: DongCanXuLy) => ('ngay' in x.han
    ? <span className="[&>span]:text-xs"><Han loai={x.han.loai} han={x.han.ngay} haiDong /></span>
    : <span className={`text-xs tabular-nums ${x.han.quaHan ? 'font-semibold text-late' : 'text-slate-500'}`}>{x.han.chu}</span>);
  const nut = (x: DongCanXuLy) => (x.den
    ? <Link to={x.den} className="btn btn-sm w-full min-h-[44px] justify-center no-underline sm:min-h-[32px]">{x.nut}</Link>
    : <button type="button" className="btn btn-sm w-full min-h-[44px] justify-center sm:min-h-[32px]" onClick={() => setMo({ id: x.metricId, n: x.n })}>{x.nut}</button>);

  return (
    <section className="card" aria-labelledby="can-xu-ly">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 id="can-xu-ly" className="m-0 text-sm font-semibold text-slate-200">
          Cần xử lý {data && <span className="font-normal text-slate-500">· {data.canXuLy.length} việc · quá hạn lên đầu</span>}
        </h2>
        <span className="text-xs text-slate-500">Gộp hai khung · việc giáo viên đang trễ và việc chờ bạn sắp xếp</span>
      </header>
      {loading || !data ? <div className="p-4"><Skeleton rows={4} /></div> : !data.canXuLy.length ? (
        <p className="m-0 px-4 py-3 text-sm text-slate-400">Không có việc nào đang tồn trong phạm vi.</p>
      ) : dienThoai ? (
        <div>
          {data.canXuLy.map((x) => (
            <TheDong key={x.metricId}
              dau={<span className="flex items-start gap-2"><NhanTrangThai t={x.trangThai} />{viec(x)}</span>}
              dong={[{ nhan: 'Người phụ trách', noiDung: nguoi(x) }, { nhan: 'Hạn', noiDung: han(x) }, { nhan: '', noiDung: nut(x) }]} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <colgroup><col className="w-[96px]" /><col /><col className="w-[240px]" /><col className="w-[150px]" /><col className="w-[160px]" /></colgroup>
            <thead>
              <tr className="text-left text-[11.5px] font-semibold text-slate-400">
                <th className="px-4 py-2 font-semibold">Trạng thái</th><th className="px-3 py-2 font-semibold">Việc</th>
                <th className="px-3 py-2 font-semibold">Người phụ trách</th><th className="px-3 py-2 font-semibold">Hạn</th>
                <th className="px-4 py-2"><span className="sr-only">Mở việc</span></th>
              </tr>
            </thead>
            <tbody>
              {data.canXuLy.map((x) => (
                <tr key={x.metricId} className="border-t align-top" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-2.5"><NhanTrangThai t={x.trangThai} /></td>
                  <td className="px-3 py-2.5">{viec(x)}</td>
                  <td className="px-3 py-2.5">{nguoi(x)}</td>
                  <td className="px-3 py-2.5">{han(x)}</td>
                  <td className="px-4 py-2">{nut(x)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t px-4 py-2.5 text-xs" style={{ borderColor: 'var(--line)' }}>
        <span className="text-slate-500">"Xem và nhắc" mở Công việc đã lọc sẵn, có tên từng người và nút Nhắc</span>
        <Link to="/cong-viec" className="link max-sm:py-3 max-sm:-my-3">Tất cả việc trong Công việc →</Link>
      </footer>
      {mo && <DanhSachSoLieu id={mo.id} giaTri={mo.n} phamVi={phamVi} open onClose={() => setMo(null)} />}
    </section>
  );
}

/**
 * DẢI CHỜ DUYỆT (PR-DUYET, K1-01, M8) — khối riêng trên Cần xử lý: số là tầng 1, một nút mở hộp. Ẩn khi hộp trống.
 * PR-GVb (J5, J5b): số = thẻ PHẢI QUYẾT (cùng badge Công việc, `demHop`); sau là MỘT hàng chip đếm (`chipChoDuyet`), mỗi chip mở hộp đã lọc.
 * PR-NV (T8, mockup 05/10): ẩn khi không có thẻ phải quyết (việc chỉ cần nhắc không nổi lên đây). Màu theo nghĩa: tím = trạng thái chờ
 * duyệt (số gộp trong nhãn) · xám = loại thẻ · đỏ cam ⚠ = quá hạn.
 */
export function DaiChoDuyet({ branchId }: { branchId: number | null }) {
  /* Cùng đường với Cần xử lý — `useApi` gộp GET đang bay nên máy chủ chỉ tính một lần (D14). Lỗi thì báo gọn, không biến mất. */
  const { data, error, reload } = useApi<Data>(branchId ? `/tong-quan/quan-ly?branchId=${branchId}` : '/tong-quan/quan-ly', [branchId]);
  const navigate = useNavigate();
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  const d = data?.choDuyet;
  if (!d?.cho) return null;
  /* Q17: theo chi nhánh đang chọn. */
  const cn = branchId ? `cn=${branchId}` : '';
  const chip = chipChoDuyet(d);
  return (
    <div className="card flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <Nhan tone="wait">Chờ duyệt <span className="ml-1 tabular-nums">{d.cho}</span></Nhan>
      <span className="flex min-w-0 flex-1 basis-[16rem] flex-wrap items-center gap-1.5 tabular-nums">
        {chip.map((c) => (
          <Nhan key={c.key} tone={c.quaHan ? 'late' : 'muted'} title={`Mở hộp: ${c.nhan}`}
            onClick={() => navigate(`/cong-viec/cho-duyet${c.den}${cn ? `&${cn}` : ''}`)}>
            {c.quaHan && '⚠ '}{c.nhan} {c.so}
          </Nhan>
        ))}
      </span>
      <Link to={`/cong-viec/cho-duyet${cn ? `?${cn}` : ''}`} className="btn btn-sm btn-primary min-h-[44px] no-underline sm:min-h-0">Mở hộp duyệt</Link>
    </div>
  );
}

/** Q11: nhãn chữ của Điểm đáng chú ý (mockup 23). Đặt ở web: luật PR-T cấm chữ này trong máy chủ/shared (tên trạng thái SOS cũ). */
const MUC_CHU_Y_LABEL: Record<DiemChuY['muc'], string> = { 'can-chu-y': 'Cần chú ý', tot: 'Tốt' };

/** ĐIỂM ĐÁNG CHÚ Ý (tầng 3, theo khung) — route riêng `/tong-quan/diem-chu-y` để đổi công tắc chỉ tải lại khối này. */
export function DiemDangChuY({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const { data, loading, error, reload } = useApi<DiemChuY[]>(`/tong-quan/diem-chu-y?ct=${ct}${branchId ? `&branchId=${branchId}` : ''}`, [branchId, ct]);
  const [mo, setMo] = useState<{ id: string; n: number; extra?: Record<string, string> } | null>(null);
  const phamVi = { branchId, chuongTrinh: ct };
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
                    onClick={() => setMo({ id: x.metricId, n: x.soDanhSach, extra: x.extra })}>{x.lienKet}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      {mo && <DanhSachSoLieu id={mo.id} giaTri={mo.n} phamVi={phamVi} extra={mo.extra} open onClose={() => setMo(null)} />}
    </Card>
  );
}
