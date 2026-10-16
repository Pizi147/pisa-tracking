import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { nhanQuaHan, tuanLich } from '@shared/domain/index.ts';
import { ODem } from './HocVienCuaToi.tsx';

/** Trả lời của `GET /tong-quan/mock-test` (server/src/worklist/tongQuanMt.ts). */
type GvQuaHan = { key: string; ownerId: number; gv: string; kyNang: string; lop: string | null; luot: string | null; soBai: number; han: string | null };
type TongQuanMt = {
  tuan: string; luotTuanNay: { so: number; soLop: number }; oChuaNhap: { so: number; quaHan: number };
  deNghiDoi: number; chuaXepLich: number; gvQuaHan: GvQuaHan[];
};

/**
 * TỔNG QUAN ADMIN — tab "Mock Test" (OV-10c, mockup vai mục 4): bốn ô bấm được (mở đúng chỗ ở Test / Công việc, số cùng hàm với màn đó)
 * + danh sách GV chấm quá hạn (OV-12h: chỉ xem, bỏ Nhắc).
 */
export function MockTestAdmin({ branchId }: { branchId: number | null }) {
  const { data, loading, error, reload } = useApi<TongQuanMt>(branchId ? `/tong-quan/mock-test?branchId=${branchId}` : '/tong-quan/mock-test', [branchId]);
  const { homNay } = useNgayNghiepVu();
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={4} />;

  const cn = branchId ? `&cn=${branchId}` : '';
  const soNgay = (han: string | null) => (han ? Math.max(1, Math.round((Date.parse(homNay) - Date.parse(han.slice(0, 10))) / 86_400_000)) : null);
  const khoa = (g: GvQuaHan) => `${g.ownerId}|${g.key}`;
  const soGv = new Set(data.gvQuaHan.map((g) => g.ownerId)).size;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4" data-hd="tq-mock-test" aria-label="Số liệu Mock Test">
        <ODem to={`/test/ke-hoach?tuan=${data.tuan}&loai=ft${cn}`} so={data.luotTuanNay.so} nhan="Lượt MT tuần này"
          phu={`${tuanLich(data.tuan, homNay)} · ${data.luotTuanNay.soLop} lớp`} />
        <ODem to={`/cong-viec?nhom=cham-diem&khung=tat-ca${cn}`} so={data.oChuaNhap.so} nhan="Ô điểm chưa nhập"
          phu={data.oChuaNhap.quaHan ? <span className="font-semibold text-late">⚠ {data.oChuaNhap.quaHan} quá hạn</span> : 'không ô nào quá hạn'} />
        <ODem to={`/test/lich${cn ? `?${cn.slice(1)}` : ''}`} so={data.deNghiDoi} nhan="Đề nghị dời chờ" phu="vắng tuần này · chờ Quản lý duyệt" />
        <ODem to={`/test/ke-hoach?loai=ft${cn}`} so={data.chuaXepLich} nhan="MT chưa xếp lịch" phu="em FT chưa có lượt MT nào" />
      </div>
      <section className="card" aria-labelledby="gv-qua-han">
        <div className="flex flex-wrap items-baseline gap-x-2 px-4 pt-3 pb-2">
          <h2 id="gv-qua-han" className="m-0 text-[15px] font-semibold text-slate-100">GV chấm quá hạn</h2>
          {soGv > 0 && <span className="text-xs text-slate-500">· {soGv} giáo viên</span>}
        </div>
        {data.gvQuaHan.length === 0
          ? <p className="m-0 px-4 pb-4 text-sm text-slate-400">Không có giáo viên nào chấm quá hạn.</p>
          : (
            <ul className="list-none m-0 p-0">
              {data.gvQuaHan.map((g) => {
                const n = soNgay(g.han);
                return (
                  <li key={khoa(g)}
                    className="grid items-center gap-x-3 gap-y-0.5 border-t px-4 py-2.5 text-sm grid-cols-[minmax(0,1fr)] md:grid-cols-[180px_minmax(0,1fr)_64px_130px]"
                    style={{ borderColor: 'var(--line)' }}>
                    <span className="min-w-0 truncate font-medium text-slate-100">{g.gv}</span>
                    <span className="min-w-0 text-slate-400 max-md:text-xs">
                      {[g.kyNang, g.lop, g.luot].filter(Boolean).join(' · ')}
                      <span className="md:hidden"> · {g.soBai} ô{n !== null && <> · <span className="whitespace-nowrap font-semibold text-late">⚠ {nhanQuaHan(n)}</span></>}</span>
                    </span>
                    <span className="tabular-nums text-slate-300 max-md:hidden">{g.soBai} ô</span>
                    <span className="tabular-nums font-semibold text-late max-md:hidden">⚠ {n !== null ? nhanQuaHan(n) : 'quá hạn'}</span>
                  </li>
                );
              })}
            </ul>
          )}
      </section>
    </div>
  );
}

