import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BoCuc, ChiSo, OViecCuaToi } from './TongQuanV5.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import type { ReactNode } from 'react';
import { OSo } from '../../ui/OSo.tsx';
import { tuanLich } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Số của ô = link đổi trang tới đúng danh sách (G6: không phải panel). O-TQ-BAM (chủ SP 07/11): số > 0 = link `so-chinh` → cả ô đổi trang
 *  (tên thêm "›"); 0 không bấm như mọi ô số (trước: 0 vẫn là link). */
const So = ({ to, n }: { to: string; n: number }) => (n > 0 ? <Link to={to} className="link so-chinh tabular-nums">{n}</Link> : <span className="tabular-nums text-slate-500">{n}</span>);
const ten = (chu: string, n: number) => (n > 0 ? `${chu} ›` : chu);

const GV_TRE_ADMIN = {
  loai: t('Số liệu · Mock Test'), theoGv: true, trong: t('Không GV nào chấm quá hạn'),
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
/**
 * GD-14 (⑧ T5): ô số (định nghĩa vào ⓘ, dòng phụ chỉ khi cần) → khối "GV chấm quá hạn" (MỖI GV MỘT DÒNG — cùng hạt bảng Giáo viên của QL, [XM-12]) │ cột phải
 * Lịch sắp tới (`lich`). Bấm dòng GV = hộp đỏ số bài → panel GV trễ chấm của GV đó (lớp · lượt · kỹ năng → em còn trống → Nhập hộ): không mất lượt nào.
 * Dòng "chờ chấm" (Chấm Speaking chưa tới hạn) ra khỏi khối quá hạn — bài đó vẫn ở ô "Bài chưa nhập điểm".
 */
export function MockTestAdmin({ branchId, lich }: { branchId: number | null; lich?: ReactNode }) {
  const { data, loading, error, reload } = useApi<TongQuanMt>(branchId ? `/tong-quan/mock-test?branchId=${branchId}` : '/tong-quan/mock-test', [branchId]);
  const { homNay } = useNgayNghiepVu();
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={4} />;

  const cn = branchId ? `&cn=${branchId}` : '';
  const soNgay = (han: string | null) => (han ? Math.max(1, Math.round((Date.parse(homNay) - Date.parse(han.slice(0, 10))) / 86_400_000)) : null);
  const quaHan = data.gvQuaHan.filter((g) => !g.choCham);
  const soGv = new Set(quaHan.filter((g) => g.ownerId > 0).map((g) => g.ownerId)).size;
  /* Dòng gộp máy chủ (`ownerId` 0): "Speaking chấm chéo" (khoá `cham-cheo-qua-han`, panel `gv=-1` như `treCham`) · "Chưa có GV" (`chua-co-gv`, `gv=0`). */
  const idCua = (g: GvQuaHan) => (g.ownerId > 0 ? g.ownerId : g.key.startsWith('cham-cheo') ? -1 : 0);
  const coSc = quaHan.some((g) => idCua(g) < 0);
  /* Gom mỗi GV một dòng: kỹ năng · lớp (không lặp) · Σ bài · lâu nhất (hạn cũ nhất). Lời 19: "Speaking chấm chéo" → "Chấm Speaking". */
  const theoGv = new Map<number, { id: number; ten: string; kn: Set<string>; lop: Set<string>; bai: number; han: string | null }>();
  for (const g of quaHan) {
    const id = idCua(g);
    const x = theoGv.get(id) ?? theoGv.set(id, { id, ten: id < 0 ? t('Chấm Speaking') : g.gv, kn: new Set(), lop: new Set(), bai: 0, han: null }).get(id)!;
    g.kyNang.split(', ').forEach((k) => k && x.kn.add(k));
    if (g.lop) x.lop.add(g.lop);
    x.bai += g.soBai;
    if (g.han && (!x.han || g.han < x.han)) x.han = g.han;
  }
  /* GV thật trước (nhiều bài trước), Chấm Speaking · Chưa có GV cuối — như hàng chân bảng Giáo viên của QL. */
  const dong = [...theoGv.values()].sort((a, b) => (a.id > 0 ? 0 : 1) - (b.id > 0 ? 0 : 1) || b.bai - a.bai);
  const q = branchId ? `&branchId=${branchId}` : '';
  const khoiGv = (
    <section className="card" aria-labelledby="gv-qua-han">
      <div className="flex flex-wrap items-center gap-x-2 px-4 pt-3 pb-2">
        <h2 id="gv-qua-han" className="h-khoi m-0 text-lg font-bold text-slate-100">{t('GV chấm quá hạn')}</h2>
        {/* M6 6b-4 (Q5): số GV mở panel theo GV → lớp · lượt · kỹ năng → em còn trống → Nhập hộ; số = số nhóm GV của panel (cùng tập). */}
        {(soGv > 0 || coSc) && (
          <span className="text-xs text-slate-500">
            {soGv > 0 && <><OSo giaTri={soGv} tieuDe={t('GV chấm quá hạn')} nguon={`/tong-quan/gv-tre${branchId ? `?branchId=${branchId}` : ''}`} gvTre={GV_TRE_ADMIN} /> {t('GV')}</>}
            {coSc && <>{soGv > 0 ? ' · ' : ''}{t('Chấm Speaking')}</>}
          </span>
        )}
        <NutLuat label={t('GV chấm quá hạn')}>{GV_TRE_ADMIN.cachTinh}</NutLuat>
      </div>
      {dong.length === 0
        ? <p className="m-0 px-4 pb-4 text-sm text-slate-400">{t('Không có giáo viên nào chấm quá hạn.')}</p>
        : (
          <ul className="o-so-hop m-0 list-none p-0">
            {dong.map((g) => {
              const n = soNgay(g.han);
              const phu = [[...g.kn].join(', '), [...g.lop].join(', '), g.id < 0 ? t('chưa ai nhận') : null].filter(Boolean).join(' · ');
              return (
                /* Bấm dòng = bấm hộp số (một panel, một khoá URL) — chữ trong dòng không phải link riêng. */
                <li key={g.id} onClick={(e) => { if (!(e.target as Element).closest('button')) (e.currentTarget.querySelector('button') as HTMLButtonElement | null)?.click(); }}
                  className="bam grid cursor-pointer items-center gap-x-3 gap-y-1 border-t px-4 py-2.5 text-sm grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[180px_minmax(0,1fr)_56px_120px]"
                  style={{ borderColor: 'var(--line)' }}>
                  <span className="min-w-0 truncate font-semibold leading-normal text-slate-100">{g.ten}</span>
                  <span className="min-w-0 text-slate-400 max-md:col-start-1 max-md:row-start-2">{phu}</span>
                  <span className="justify-self-end max-md:col-start-2 max-md:row-span-2 max-md:row-start-1">
                    <OSo giaTri={g.bai} className="text-bad" tieuDe={t('GV chấm quá hạn · {ten}', { ten: g.ten })} nguon={`/tong-quan/gv-tre?gv=${g.id}${q}`} gvTre={GV_TRE_ADMIN} />
                  </span>
                  <span className="whitespace-nowrap text-[13px] tabular-nums text-slate-400 max-md:hidden">{n !== null ? t('lâu nhất {n} ngày', { n }) : null}</span>
                </li>
              );
            })}
          </ul>
        )}
    </section>
  );

  return (
    <div className="space-y-4">
      {/* SUA-CHAM-LAI L8 · GD-14 (lời 37): ô chỉ số V5; số = link đổi trang. Dòng phụ chỉ khi cần làm (quá hạn); định nghĩa "HV chưa đủ MT" vào ⓘ. */}
      <div data-hd="tq-tom-tat" className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 max-lg:[&>*:last-child:nth-child(odd)]:col-span-2">
        <OViecCuaToi />
        <ChiSo ten={ten(t('Lượt MT tuần này'), data.luotTuanNay.so)} ky={tuanLich(data.tuan, homNay)} giaTri={<So to={`/test/ke-hoach?tuan=${data.tuan}&loai=ft${cn}`} n={data.luotTuanNay.so} />} />
        <ChiSo ten={ten(t('Bài chưa nhập điểm'), data.oChuaNhap.so)} ky={t('hiện tại')} giaTri={<So to={`/cong-viec?nhom=cham-diem&nguoi=tat-ca&khung=tat-ca${cn}`} n={data.oChuaNhap.so} />}
          mau={data.oChuaNhap.quaHan ? <span className="font-semibold text-late">{t('{n} quá hạn', { n: data.oChuaNhap.quaHan })}</span> : null} />
        <ChiSo ten={ten(t('HV chưa đủ MT'), data.chuaXepLich)} ky={t('hiện tại')} luat={t('HV chưa đủ MT: em đã thi hết các lượt MT đã xếp, còn thiếu lượt theo lộ trình.')}
          giaTri={<So to={`/test/ke-hoach?loai=ft${cn}`} n={data.chuaXepLich} />} />
      </div>
      <BoCuc trai={khoiGv} phai={lich} />
    </div>
  );
}
