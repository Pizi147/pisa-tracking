import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ChiSo } from './TongQuanV5.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { nhanQuaHan, tuanLich } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Số của ô = link đổi trang tới đúng danh sách (G6: không phải panel); 0 vẫn mở được — danh sách trống nói rõ. */
const So = ({ to, n }: { to: string; n: number }) => <Link to={to} className={`link tabular-nums ${n ? '' : 'text-slate-500'}`}>{n}</Link>;

const GV_TRE_ADMIN = {
  loai: t('SỐ LIỆU · MOCK TEST'), theoGv: true, trong: t('Không GV nào chấm quá hạn'),
  cachTinh: t('Bài = ô kỹ năng còn trống của em đã thi (W1, W2 tính riêng), đã qua hạn chấm. Cùng tập với khối "GV chấm quá hạn" và ô "quá hạn" ở Tổng quan.'),
};

/** Trả lời của `GET /tong-quan/mock-test` (server/src/worklist/tongQuanMt.ts). */
type GvQuaHan = { key: string; ownerId: number; gv: string; kyNang: string; lop: string | null; luot: string | null; soBai: number; han: string | null; choCham?: true };
type TongQuanMt = {
  tuan: string; luotTuanNay: { so: number; soLop: number }; oChuaNhap: { so: number; quaHan: number };
  chuaXepLich: number; gvQuaHan: GvQuaHan[];
};

/**
 * TỔNG QUAN ADMIN — tab "Mock Test" (OV-10c, mockup vai mục 4): ba ô chỉ số V5 (số bấm đổi trang) (UI-TONG-QUAN, chủ SP 23/10: bỏ "Đề nghị dời chờ") (mở đúng chỗ ở Test / Công việc, số cùng hàm với màn đó)
 * + danh sách GV chấm quá hạn (OV-12h: chỉ xem, bỏ Nhắc).
 */
export function MockTestAdmin({ branchId }: { branchId: number | null }) {
  const { data, loading, error, reload } = useApi<TongQuanMt>(branchId ? `/tong-quan/mock-test?branchId=${branchId}` : '/tong-quan/mock-test', [branchId]);
  const { homNay } = useNgayNghiepVu();
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={4} />;

  const cn = branchId ? `&cn=${branchId}` : '';
  const soNgay = (han: string | null) => (han ? Math.max(1, Math.round((Date.parse(homNay) - Date.parse(han.slice(0, 10))) / 86_400_000)) : null);
  const khoa = (g: GvQuaHan) => `${g.ownerId}|${g.key}`;
  const soGv = new Set(data.gvQuaHan.filter((g) => g.ownerId > 0).map((g) => g.ownerId)).size;

  return (
    <div className="space-y-3">
      {/* SUA-CHAM-LAI L8: ô chỉ số V5 (tên · số · mẫu · kỳ) như mọi vai, 3 cột như Tổng quan TVV; số = link đổi trang (mở đúng danh sách đã lọc). Đơn vị "bài" như Lịch Test. */}
      <div data-hd="tq-tom-tat" className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 max-lg:[&>*:last-child:nth-child(odd)]:col-span-2">
        <ChiSo ten={t('Lượt MT tuần này')} ky={tuanLich(data.tuan, homNay)} giaTri={<So to={`/test/ke-hoach?tuan=${data.tuan}&loai=ft${cn}`} n={data.luotTuanNay.so} />}
          mau={t('{n} lớp', { n: data.luotTuanNay.soLop })} />
        <ChiSo ten={t('Bài chưa nhập điểm')} ky={t('hiện tại')} giaTri={<So to={`/cong-viec?nhom=cham-diem&khung=tat-ca${cn}`} n={data.oChuaNhap.so} />}
          mau={data.oChuaNhap.quaHan ? <span className="font-semibold text-late">⚠ {t('{n} quá hạn', { n: data.oChuaNhap.quaHan })}</span> : t('không bài nào quá hạn')} />
        <ChiSo ten={t('HV chưa có MT tiếp theo')} ky={t('hiện tại')} giaTri={<So to={`/test/ke-hoach?loai=ft${cn}`} n={data.chuaXepLich} />}
          mau={t('đã thi hết lượt MT đã xếp')} />
      </div>
      <section className="card" aria-labelledby="gv-qua-han">
        <div className="flex flex-wrap items-baseline gap-x-2 px-4 pt-3 pb-2">
          <h2 id="gv-qua-han" className="h-khoi m-0 text-lg font-bold text-slate-100">GV chấm quá hạn</h2>
          {/* M6 6b-4 (Q5): số GV mở panel theo GV → lớp · lượt · kỹ năng → em còn trống → Nhập hộ; số = số nhóm GV của panel (cùng tập). */}
          {soGv > 0 && (
            <span className="text-xs text-slate-500">
              · <OSo giaTri={soGv} tieuDe={t('GV chấm quá hạn')} nguon={`/tong-quan/gv-tre${branchId ? `?branchId=${branchId}` : ''}`} gvTre={GV_TRE_ADMIN} /> {t('giáo viên')}
            </span>
          )}
        </div>
        {data.gvQuaHan.length === 0
          ? <p className="m-0 px-4 pb-4 text-sm text-slate-400">Không có giáo viên nào chấm quá hạn.</p>
          : (
            <ul className="list-none m-0 p-0">
              {data.gvQuaHan.map((g) => {
                const n = soNgay(g.han);
                /* Q12: S chấm chéo chưa ai nhận — chờ chấm, không quá hạn (T18). */
                const nhan = g.choCham ? <span className="text-slate-400">{t('chờ chấm')}</span> : <span className="font-semibold text-late">⚠ {n !== null ? nhanQuaHan(n) : t('quá hạn')}</span>;
                return (
                  <li key={khoa(g)}
                    className="grid items-center gap-x-3 gap-y-0.5 border-t px-4 py-2.5 text-sm grid-cols-[minmax(0,1fr)] md:grid-cols-[180px_minmax(0,1fr)_72px_max-content]"
                    style={{ borderColor: 'var(--line)' }}>
                    <span className="min-w-0 truncate font-medium text-slate-100">{g.gv}</span>
                    <span className="min-w-0 text-slate-400 max-md:text-xs">
                      {[g.kyNang, g.lop, g.luot].filter(Boolean).join(' · ')}
                      <span className="md:hidden"> · {t('{n} bài', { n: g.soBai })}{(g.choCham || n !== null) && <> · <span className="whitespace-nowrap">{nhan}</span></>}</span>
                    </span>
                    <span className="tabular-nums text-slate-300 max-md:hidden">{t('{n} bài', { n: g.soBai })}</span>
                    <span className="whitespace-nowrap tabular-nums max-md:hidden">{nhan}</span>
                  </li>
                );
              })}
            </ul>
          )}
      </section>
    </div>
  );
}

