import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  NHOM_VIEC_LABEL, addDaysIso, duongHieuQuaPaGv, duongHoSoHocVien, duongViecCuaGv, laVaiQuanLy, mondayOfDate, trangCha, tuanLich, viecTiepCuaEm,
  NHAN_TRANG_THAI, type ChipBanGiao, type ChiSoHoSoGv, type NhomViec, type OPtGv, type TrangThai, type ViecTiepCase,
} from '@shared/domain/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { Card, Empty, ErrorState, LOP_NHAN, NhanTrangThai, Skeleton } from '../../ui/ui.tsx';
import { CHIP_TRON } from '../../ui/Nhan.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { ViecTiep } from '../../ui/ViecTiep.tsx';
import { DuongVe } from '../../ui/ThanhTruocSau.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { PhanTram, tuMau, tyLeGv, type TyLeV5 } from '../worklist/TongQuanV5.tsx';
import { TenCase } from '../cases/SkillBoard.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * HỒ SƠ GIÁO VIÊN V5 (UI-HO-SO-GV — `thiet-ke/v5/dieu-chinh-cuoi.html` khu e + `ho-so-gv.html` phương án C). Đầu gọn (tên · Vai · Kỹ năng · GVCN) +
 * kỳ Từ tuần – Đến tuần (tự do, mặc định 4 tuần — P9) · dải chỉ số theo kỳ · Lớp đang dạy · Học thuật theo lớp (lượt của từng HV — P8) ·
 * khối V4 giữ (Việc đang có, Case đang phụ trách, Yêu cầu đã gửi). Không điểm đánh giá người, không xếp hạng, không màu ngưỡng (C08).
 * Số gạch chân = panel chỉ đọc cùng hàm tập với số (`/giao-vien/:id/chi-so/o`, `/giao-vien/:id/o`); "›" = đổi trang; "?" = giải thích (P1).
 */

type NhomSo = { nhom: NhomViec; n: number; quaHan: number };
type LopHs = {
  id: number; ma: string; khung: 'ft' | 'thuong'; ct: string | null; vai: string; laGvcn: boolean; kyNang: string[]; gvcn: string | null;
  hocVien: number; chuaNhap: number; quaHan: number; banGiao: ChipBanGiao | null;
};
type CaseHs = {
  id: number; studentId: number; topic: string | null; tieuDe: string; tenSos: { mt: number | null; giua: string; sos: number | null } | null;
  nguyenNhan: string | null; moTu: string; trangThai: { t: TrangThai; chu: string }; viecTiep: ViecTiepCase | null; quaHan: boolean;
  hocVien: string; maLop: string | null; coPa: boolean;
};
type HoSo = {
  gv: { id: number; ten: string; vai: string[]; chiNhanh: string[]; kyNang: string[]; laChinhMinh: boolean };
  phamVi: { chiNhanh: string[] | null; cn: number | null };
  lop: LopHs[]; tongHocVien: number; caseMo: CaseHs[];
  yeuCau: { cho: number; choQuaHan: number; tuChoi: number };
  homNay: string;
};

const nguon = (id: number, q: string) => `/giao-vien/${id}/o?${q}`;
const soDam = 'font-semibold';
/** Vùng bấm >= 44 px cho số nhỏ (chạm tay) mà không đổi nhịp dòng: đệm dọc + lề âm bù. */
const vung = 'inline-block py-2 -my-2';

/** ⓘ vẽ bằng SVG (ký tự ⓘ cỡ nhỏ của Inter chỉ còn như một dấu chấm); lời giải thích ở `title`, như mọi chú thích khác của web. */
function Goi({ chu }: { chu: string }) {
  return (
    <span className="ml-1.5 inline-flex cursor-help align-[-2px] text-slate-500" title={chu} role="img" aria-label={chu}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden>
        <circle cx="7" cy="7" r="5.7" /><path d="M7 6.2v3.4" /><circle cx="7" cy="4.2" r=".5" fill="currentColor" />
      </svg>
    </span>
  );
}

/** Chip kỹ năng (R · W1 …) — cùng kiểu chip ô nhỏ của khung V5 (`.ky`). */
const ChipKy = ({ k }: { k: string }) => (
  <span className="inline-flex h-5 min-w-6 items-center justify-center rounded bg-[color:var(--accent-soft)] px-1.5 text-xs font-bold tabular-nums text-[color:var(--accent)]">{k}</span>
);
const ChipGvcn = () => <span className={`${CHIP_TRON} bg-ok-bg font-semibold text-ok`}>GVCN</span>;

export function HoSoGiaoVienPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi<HoSo>(`/giao-vien/${id}`, [id]);
  const { session } = useSession();
  const { homNay, ngan } = useNgayNghiepVu();
  /* P9: kỳ tự do — mặc định 4 tuần tới tuần này; giá trị mặc định không ghi lên URL. */
  const denMd = mondayOfDate(homNay), tuMd = addDaysIso(denMd, -21);
  const [tu, setTu] = useThamSoUrl('tu', tuMd);
  const [den, setDen] = useThamSoUrl('den', denMd);
  const kyLoi = tu > den ? t('Tuần đầu phải trước tuần cuối.') : null;
  const ky = `tu=${tu}&den=${den}`;
  const cs = useApi<ChiSoHoSoGv>(id && !kyLoi ? `/giao-vien/${id}/chi-so?${ky}` : null, [id, ky]);
  const viec = useApi<{ viec: NhomSo[] }>(`/giao-vien/${id}/viec`, [id]);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={8} />;
  const { gv } = data;
  const nguoiXem = { userId: session?.user?.id ?? 0, laQuanLy: laVaiQuanLy(session?.roles) };
  const coNutViec = gv.laChinhMinh || !!session?.nav?.workOps;
  const tenGoi = gv.ten.split(' ').pop() ?? gv.ten;
  const soGvcn = data.lop.filter((l) => l.laGvcn).length;
  return (
    <div className="space-y-4">
      <div>
        <DuongVe cha={trangCha('gv', { nav: session?.nav })} ten={t('Hồ sơ {ten}', { ten: gv.ten })} />
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-wrap items-end gap-x-6 gap-y-2">
            <h1 className="m-0 text-2xl font-bold text-slate-100">{gv.ten}</h1>
            <NhanDau nhan={t('Vai')}>{[gv.vai.map((v) => dich(v)).join(' · '), gv.chiNhanh.join(', ')].filter(Boolean).join(' · ') || '—'}</NhanDau>
            <NhanDau nhan={t('Kỹ năng')}>
              {gv.kyNang.length ? <span className="flex flex-wrap gap-1">{gv.kyNang.map((k) => <ChipKy key={k} k={k} />)}</span> : <span className="font-normal text-slate-500">{t('chưa khai')}</span>}
            </NhanDau>
            {soGvcn > 0 && <NhanDau nhan="GVCN">{t('{n} lớp', { n: soGvcn })}</NhanDau>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Mỗi cặp nhãn + ô giữ liền nhau — 375 xuống dòng giữa hai cặp, không tách "đến" khỏi ô. */}
            <span className="inline-flex items-center gap-2">
              <span className="text-[13px] text-slate-400">{t('Từ tuần')}</span>
              <span className="w-[8.75rem]"><ONgay kieu="tuan" gon value={tu} ariaLabel={t('Từ tuần')} onChange={(v) => v && setTu(mondayOfDate(v))} invalid={!!kyLoi} /></span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-[13px] text-slate-400">{t('đến')}</span>
              <span className="w-[8.75rem]"><ONgay kieu="tuan" gon value={den} ariaLabel={t('Đến tuần')} onChange={(v) => v && setDen(mondayOfDate(v))} invalid={!!kyLoi} /></span>
            </span>
            <NutLuat label={t('Kỳ xem')} phai>
              {t('Chọn hai tuần bất kỳ; mặc định 4 tuần tới tuần này. Số theo kỳ: Việc đúng hạn, Điểm đúng hạn, Đạt kỳ vọng, Tiến bộ, bảng Học thuật.')}
              {!gv.laChinhMinh && data.phamVi.chiNhanh && <> {t('Quản lý đang xem · chỉ tính lớp, Case, yêu cầu ở {cn}', { cn: data.phamVi.chiNhanh.join(', ') })}.</>}
            </NutLuat>
            {coNutViec && (
              <Link to={duongViecCuaGv(gv.id, nguoiXem, null)} className="btn no-underline max-sm:min-h-11 max-sm:items-center">
                {gv.laChinhMinh ? t('Mở Công việc ›') : t('Việc của {ten} ›', { ten: tenGoi })}
              </Link>
            )}
          </div>
        </header>
        {kyLoi && <p className="m-0 mt-2 text-sm font-semibold text-bad" role="alert">⚠ {kyLoi}</p>}
      </div>

      <DaiChiSo data={data} cs={cs} viec={viec.data?.viec ?? null} ky={ky} />
      <KhoiLop data={data} />
      <KhoiHocThuat data={data} cs={cs} ky={ky} />
      <KhoiViec gvId={gv.id} nguoiXem={nguoiXem} homNay={homNay} ngan={ngan} viec={viec} />
      <KhoiCase data={data} homNay={homNay}
        linkPa={!gv.laChinhMinh && session?.nav?.analysis && data.phamVi.cn
          ? { den: duongHieuQuaPaGv(data.phamVi.cn, gv.id, data.lop), chu: t('Hiệu quả PA của {ten} ›', { ten: tenGoi }) } : null} />
      <KhoiYeuCau data={data} coDuyet={!!session?.nav?.workApprove} />
    </div>
  );
}

/** P2: nhãn nhỏ xám trên, giá trị đậm dưới — đầu hồ sơ. */
function NhanDau({ nhan, children }: { nhan: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className={LOP_NHAN}>{nhan}</span>
      <span className="text-[15px] font-bold text-slate-100">{children}</span>
    </span>
  );
}

type ApiCs = { data: ChiSoHoSoGv | null; loading: boolean; error: { message: string; hint?: string } | null; reload: () => void };

// ------------------------------------------------------------------ dải chỉ số (một thẻ, các ô ngăn bằng vạch — khung khu e)

function DaiChiSo({ data, cs, viec, ky }: { data: HoSo; cs: ApiCs; viec: NhomSo[] | null; ky: string }) {
  const id = data.gv.id;
  const d = cs.data;
  const o = (x: OPtGv | undefined, cot: string, ten: string) => (d ? <PhanTram x={tyLeGv(x)} nguon={`/giao-vien/${id}/chi-so/o?cot=${cot}&${ky}`} tieuDe={ten} /> : <span className="text-slate-500">…</span>);
  const quaHan = viec ? viec.reduce((a, x) => a + x.quaHan, 0) : null;
  const pa: TyLeV5 = { dat: data.caseMo.filter((c) => c.coPa).length, mau: data.caseMo.length };
  const paCt = d && d.paHieuQua.k === 'so' ? d.paHieuQua : null;
  const o1 = (ten: string, giaTri: ReactNode, mau: ReactNode, luat?: string) => ({ ten, giaTri, mau, luat });
  /* Số phụ trong ô (dòng nhỏ): % gạch chân bấm → panel; mẫu 0 → "—". */
  const nho = (x: OPtGv | undefined, cot: string, ten: string) => (d ? <PhanTram gon x={tyLeGv(x)} nguon={`/giao-vien/${id}/chi-so/o?cot=${cot}&${ky}`} tieuDe={ten} /> : '…');
  const vuot = d && d.thiThat.k === 'so' ? d.thiThatVuot : 0;
  /* Chủ SP 23/10: dải còn 5 ô — gộp Việc + Điểm đúng hạn, Tiến bộ vào Đạt kỳ vọng; GIỮ riêng % Test đạt và % Pass Target (thi thật). */
  const ds = [
    o1(t('Đúng hạn'), o(d?.diemDungHan, 'cham-diem', t('Điểm đúng hạn')),
      <>{tuMau(tyLeGv(d?.diemDungHan), t('bài'))}{d && <> · {t('Việc')} {nho(d.viecDungHan, 'viec-dung-han', t('Việc đúng hạn'))}</>}</>,
      t('Số to: bài nhập điểm trước hạn / bài tới hạn nhập trong kỳ (theo người được phân công ở hạn nhập). Việc: việc có hạn trong kỳ (ghi kết quả PA) xong trước hạn.')),
    o1(t('Quá hạn'), quaHan === null ? '…' : <span className={quaHan > 0 ? 'text-bad' : 'text-slate-500'}>{quaHan > 0 && '⚠ '}{quaHan}</span>, t('việc · hiện tại')),
    o1(t('Đạt kỳ vọng'), o(d?.ketQua, 'ket-qua', t('Kết quả')),
      <>{tuMau(tyLeGv(d?.ketQua), t('lượt'))}{d && d.tienBo.k !== 'na' && <> · {t('Tiến bộ')} {nho(d.tienBo, 'tien-bo', t('HV tiến bộ'))}</>}</>,
      t('Test (MT, Progress, Final — không gồm thi thật): theo quy tắc Overall, một lượt = một lượt Test của một HV × kỹ năng GV dạy, gán người dạy ở tuần thi. Tiến bộ: lượt có điểm cao hơn lượt MT trước của chính HV ở cùng kỹ năng (Fast Track).')),
    /* Chủ SP 23/10: thi thật (IELTS) RẤT quan trọng — Pass Target + số vượt Target (bấm → danh sách có điểm). */
    o1(t('Đạt Target thi thật'), o(d?.thiThat, 'thi-that', t('Đạt Target thi thật')),
      <>{tuMau(tyLeGv(d?.thiThat), 'HV') ?? (d?.thiThat.k === 'rong' ? t('Thi thật trong kỳ') : null)}
        {vuot > 0 && <> · {t('Vượt')} <OSo giaTri={vuot} tieuDe={t('Vượt Target thi thật')} nguon={`/giao-vien/${id}/chi-so/o?cot=thi-that&loc=vuot&${ky}`} className={`${vung} font-semibold text-slate-200`} /></>}</>,
      t('HV có ngày thi thật (IELTS) trong kỳ, GV dạy kỹ năng ở lớp cuối trước ngày thi; Đạt = Overall đạt Target, Vượt = Overall cao hơn Target.')),
    o1(t('Case có PA'), <PhanTram x={pa} nguon={nguon(id, 'cot=case-mo')} tieuDe={t('Case đang phụ trách')} />,
      paCt ? <>{t('PA cải thiện')} <OSo giaTri={paCt.tong} nhan={`${paCt.dung}/${paCt.tong}`} nguon={`/giao-vien/${id}/chi-so/o?cot=pa-hieu-qua&${ky}`} tieuDe={t('PA hiệu quả')} className={vung} /></> : t('Case đang phụ trách')),
  ];
  return (
    <section aria-label={t('Chỉ số')} className="card overflow-clip">
      {cs.error && <div className="border-b p-3" style={{ borderColor: 'var(--line)' }}><ErrorState message={cs.error.message} hint={cs.error.hint} onRetry={cs.reload} /></div>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {ds.map((x) => (
          <div key={x.ten} className="flex min-w-0 flex-col gap-0.5 border-b border-r px-4 py-3.5 max-sm:last:col-span-2" style={{ borderColor: 'var(--line)' }}>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-400">{x.ten}{x.luat && <NutLuat label={x.ten}>{x.luat}</NutLuat>}</span>
            <span className="text-2xl font-bold tabular-nums text-slate-100">{x.giaTri}</span>
            {x.mau && <span className="text-xs text-slate-500">{x.mau}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Lớp đang dạy (lớp · kỹ năng · số HV · GVCN — khu e)

/** O6: chip "Bàn giao n/m em" cạnh mã lớp (12 px) — còn dở mới có; bấm mở hồ sơ lớp ở việc Bàn giao. */
function ChipBanGiaoLop({ l }: { l: LopHs }) {
  const b = l.banGiao;
  if (!b) return null;
  return (
    <Link to={`/hoc-vien/lop/${l.id}?viec=ban-giao${b.maMon ? `&mon=${b.maMon}` : ''}`} className={`${CHIP_TRON} bg-soon-bg tabular-nums text-soon no-underline hover:underline`}
      title={b.loai === 'gvcn' ? t('Phiếu bàn giao đã xác nhận / số em có quyết định chuyển lớp') : t('Môn {mon}: số em đã ghi bàn giao / số em cần ghi', { mon: b.mon })}>
      {t('Bàn giao{mon} {da}/{n} em', { mon: b.mon ? ` ${b.mon} ·` : '', da: b.da, n: b.n })}
    </Link>
  );
}

function KhoiLop({ data }: { data: HoSo }) {
  const id = data.gv.id;
  const tong = (
    <span className="text-xs text-slate-400">
      <span className="tabular-nums text-slate-200">{data.lop.length}</span> {t('lớp')} · <OSo giaTri={data.tongHocVien} tieuDe={t('Học viên đang học')} nguon={nguon(id, 'cot=hoc-vien')} className={`${vung} text-slate-200`} /> HV
    </span>
  );
  return (
    <Card title={<span className="inline-flex flex-wrap items-baseline gap-x-2">{t('Lớp đang dạy')}{data.lop.length > 0 && tong}</span>}>
      {!data.lop.length ? <Empty title={t('Chưa có phân công lớp nào đang hiệu lực.')} /> : (
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 xl:grid-cols-4">
          {data.lop.map((l) => (
            <li key={l.id} className="flex min-w-0 flex-col gap-1.5 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link to={`/hoc-vien/lop/${l.id}`} className="link font-semibold">{l.ma}</Link>
                {l.laGvcn && <ChipGvcn />}
                <ChipBanGiaoLop l={l} />
              </span>
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-slate-400">
                {l.kyNang.map((k) => <ChipKy key={k} k={k} />)}
                <span className="tabular-nums">{l.kyNang.length > 0 && '· '}{l.hocVien} HV</span>
                {l.gvcn && <span className="min-w-0 truncate">· GVCN {l.gvcn}</span>}
                {l.chuaNhap > 0 && (
                  <span className="whitespace-nowrap">· <OSo giaTri={l.chuaNhap} tieuDe={`${t('Bài chưa nhập điểm')} · ${l.ma}`} nguon={nguon(id, `cot=chua-nhap&lop=${l.id}`)} className={`${vung} text-slate-200`} /> {t('chưa nhập')}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ Học thuật (một hàng một lớp em học lúc thi — P8)

type HangHt = {
  khoa: string; classId: number | null; ma: string; kyNang: string[]; luot: number; theoBai: { bai: string; n: number }[];
  ketQua: TyLeV5 | null; tienBo: TyLeV5 | null; thiThat: TyLeV5 | null; casePa: TyLeV5 | null; quaHan: number | null; cong?: boolean;
};
const cong = (a: TyLeV5 | null, b: TyLeV5 | null): TyLeV5 | null => (!a ? b : !b ? a : { dat: a.dat + b.dat, mau: a.mau + b.mau });

function KhoiHocThuat({ data, cs, ky }: { data: HoSo; cs: ApiCs; ky: string }) {
  const id = data.gv.id;
  const d = cs.data;
  const casePa = (ma: string): TyLeV5 | null => {
    const ds = data.caseMo.filter((c) => c.maLop === ma);
    return ds.length ? { dat: ds.filter((c) => c.coPa).length, mau: ds.length } : null;
  };
  const lopNay = new Map(data.lop.map((l) => [l.id, l]));
  const hang: HangHt[] = (d?.hocThuatTheoLop ?? []).map((h) => ({
    khoa: `l${h.classId}`, classId: h.classId, ma: h.ma, kyNang: h.kyNang, luot: h.luot, theoBai: h.theoBai,
    ketQua: tyLeGv(h.ketQua), tienBo: tyLeGv(h.tienBo), thiThat: tyLeGv(h.thiThat), casePa: casePa(h.ma), quaHan: lopNay.get(h.classId)?.quaHan ?? null,
  }));
  /* Lớp đang dạy chưa có lượt trong kỳ vẫn có hàng — giữ ô Quá hạn (V4) và cho thấy "Chưa có dữ liệu" thay vì mất lớp. */
  for (const l of data.lop) {
    if (!hang.some((h) => h.classId === l.id)) {
      hang.push({ khoa: `l${l.id}`, classId: l.id, ma: l.ma, kyNang: l.kyNang, luot: 0, theoBai: [], ketQua: { dat: 0, mau: 0 }, tienBo: l.khung === 'ft' ? { dat: 0, mau: 0 } : null, thiThat: l.khung === 'ft' ? { dat: 0, mau: 0 } : null, casePa: casePa(l.ma), quaHan: l.quaHan });
    }
  }
  const coFt = hang.some((h) => h.tienBo !== null);
  const tong: HangHt = {
    khoa: 'cong', classId: null, ma: t('Cộng'), kyNang: [], luot: hang.reduce((a, h) => a + h.luot, 0), theoBai: [], cong: true,
    ketQua: hang.reduce<TyLeV5 | null>((a, h) => cong(a, h.ketQua), null), tienBo: hang.reduce<TyLeV5 | null>((a, h) => cong(a, h.tienBo), null),
    thiThat: hang.reduce<TyLeV5 | null>((a, h) => cong(a, h.thiThat), null),
    casePa: hang.reduce<TyLeV5 | null>((a, h) => cong(a, h.casePa), null), quaHan: hang.reduce((a, h) => a + (h.quaHan ?? 0), 0),
  };
  const COT: CotBang[] = [
    { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 170 },
    { key: 'ky', nhan: t('Kỹ năng'), kieu: 'chip', rong: 200 },
    /* Cột linh hoạt duy nhất: chữ "12 · MT3 10 · MT2 2" (lượt theo bài) — các cột số giữ bề rộng cố định, không co chữ. */
    { key: 'luot', nhan: t('Lượt trong kỳ'), kieu: 'chu' },
    { key: 'kq', nhan: t('Đạt kỳ vọng'), kieu: 'phan-tram', rong: 170 },
    ...(coFt ? [{ key: 'tb', nhan: t('Tiến bộ'), kieu: 'phan-tram', rong: 170 } as CotBang,
      { key: 'tt', nhan: t('Thi thật'), kieu: 'phan-tram', rong: 150, goiY: t('Đạt Target thi thật') } as CotBang] : []),
    { key: 'pa', nhan: t('Case có PA'), kieu: 'so', rong: 110 },
    { key: 'qh', nhan: t('Quá hạn'), kieu: 'so', rong: 96, goiY: t('Bài quá hạn chưa nhập điểm (hiện tại) — lớp đang dạy') },
  ];
  const oCua = (h: HangHt, c: CotBang): ReactNode => {
    const dam = h.cong ? 'font-bold' : '';
    switch (c.key) {
      case 'lop': return h.cong || h.classId === null ? <b className="font-bold">{h.ma}</b> : <Link to={`/hoc-vien/lop/${h.classId}`} className="ten-ho-so font-semibold">{h.ma}</Link>;
      case 'ky': return <span className="flex gap-1">{h.kyNang.map((k) => <ChipKy key={k} k={k} />)}</span>;
      case 'luot': return (
        <span className={`tabular-nums ${dam}`}>{h.luot}
          {h.theoBai.length > 0 && <span className="font-normal text-slate-500"> · {h.theoBai.map((b) => `${b.bai} ${b.n}`).join(' · ')}</span>}
        </span>
      );
      case 'kq': case 'tb': case 'tt': {
        const x = c.key === 'kq' ? h.ketQua : c.key === 'tb' ? h.tienBo : h.thiThat;
        const mau = tuMau(x, c.key === 'tt' ? 'HV' : t('lượt'));
        const cot = `${c.key === 'kq' ? 'ket-qua' : c.key === 'tb' ? 'tien-bo' : 'thi-that'}-lop:${h.classId}`;
        /* Khung khu e: "75 % 9/12 lượt" một dòng (hàng 44 px). Hàng Cộng không bấm (số đã bấm được ở dải chỉ số). */
        const so = h.cong ? (x && x.mau ? <b className="tabular-nums">{Math.round((100 * x.dat) / x.mau)} %</b> : <span className="text-slate-500">—</span>)
          : <PhanTram gon x={x} nguon={`/giao-vien/${id}/chi-so/o?cot=${cot}&${ky}`} tieuDe={`${c.nhan} · ${h.ma}`} />;
        return <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap font-semibold">{so}{mau && <span className="text-xs font-normal text-slate-500">{mau}</span>}</span>;
      }
      case 'pa': return h.casePa ? <span className={`tabular-nums ${dam}`}>{h.casePa.dat}/{h.casePa.mau}</span> : <span className="text-slate-500">—</span>;
      case 'qh': {
        if (h.quaHan === null) return <span className="text-slate-500">—</span>;
        if (h.quaHan <= 0) return <span className="tabular-nums text-slate-500">0</span>;
        return (
          <span className={`font-semibold text-bad ${dam}`}>⚠ <OSo giaTri={h.quaHan} tieuDe={h.cong ? t('Bài quá hạn chưa nhập điểm') : `${t('Bài quá hạn chưa nhập điểm')} · ${h.ma}`}
            nguon={nguon(id, h.cong ? 'cot=qua-han' : `cot=qua-han&lop=${h.classId}`)} className="text-bad" /></span>
        );
      }
      default: return null;
    }
  };
  return (
    <Card bodyClass="p-0"
      title={<span className="inline-flex flex-wrap items-baseline gap-x-2">{t('Học thuật')}<span className="text-xs font-normal text-slate-500">{t('lượt của từng HV có tuần thi trong kỳ')}</span></span>}
      action={<NutLuat label={t('Học thuật')} phai>{t('Đạt kỳ vọng theo quy tắc Overall; lượt = một lượt MT của một HV × kỹ năng GV dạy, gán theo lớp em học lúc thi. Case có PA, Quá hạn: hiện tại.')}</NutLuat>}>
      {cs.error ? <ErrorState message={cs.error.message} hint={cs.error.hint} onRetry={cs.reload} />
        : !d && cs.loading ? <Skeleton rows={3} className="p-4" />
        : (
          <>
            {d && <TheoKyNang id={id} d={d} ky={ky} />}
            <h3 className="m-0 border-t px-4 pb-1 pt-3 text-[13px] font-semibold text-slate-400" style={{ borderColor: 'var(--line)' }}>{t('Theo lớp')}</h3>
            <Bang ten={t('Học thuật')} cot={COT} hang={hang.length ? [...hang, tong] : []} khoa={(h) => h.khoa} oCua={oCua} khung={false}
              rong={{ tieuDe: t('Chưa có dữ liệu'), goiY: t('Không có lượt nào có tuần thi trong kỳ này.') }} />
          </>
        )}
    </Card>
  );
}

/**
 * THEO KỸ NĂNG (chủ SP 23/10 — "dạy kỹ năng này đạt nhiều hay trượt nhiều"): mỗi kỹ năng GV phụ trách một hàng — Đạt kỳ vọng (MT + thi thật, như dải số)
 * · số chưa đạt · Thi thật đạt / chưa đạt. Mỗi số mở panel đúng nhóm (`loc=dat|chua`): điểm cả lượt, kỹ năng GV phụ trách nổi bật, chênh với Target / kỳ vọng.
 */
type HangKn = { khoa: string; nhan: string; kq: Extract<OPtGv, { k: 'so' }> | null; cotKq: string; thi: Extract<OPtGv, { k: 'so' }> | null; vuot: number; skill: string };
function TheoKyNang({ id, d, ky }: { id: number; d: ChiSoHoSoGv; ky: string }) {
  const dienThoai = useDienThoai();
  const haiKhung = new Set(d.ketQuaTheoKyNang.map((x) => x.khung)).size > 1;
  const so = (o: OPtGv | undefined) => (o && o.k === 'so' && o.tong > 0 ? o : null);
  const hang: HangKn[] = d.ketQuaTheoKyNang.map((x) => ({
    khoa: `${x.khung}:${x.skill}`, skill: x.skill, nhan: haiKhung ? `${x.nhan} · ${x.khung === 'ft' ? 'FT' : t('Lớp thường')}` : x.nhan,
    kq: so(x.o), cotKq: `ket-qua:${x.khung}:${x.skill}`, thi: x.khung === 'ft' ? so(d.thiThatTheoKyNang.find((y) => y.skill === x.skill)?.o) : null,
    vuot: x.khung === 'ft' ? d.thiThatTheoKyNang.find((y) => y.skill === x.skill)?.vuot ?? 0 : 0,
  }));
  if (!hang.length) return null;
  const coThi = hang.some((h) => h.thi);
  const mo = (cot: string, loc: 'dat' | 'chua' | 'vuot', n: number, tieuDe: string, lop = '') => (
    <OSo giaTri={n} nguon={`/giao-vien/${id}/chi-so/o?cot=${cot}&loc=${loc}&${ky}`} tieuDe={tieuDe} className={`${vung} ${lop}`} />
  );
  const COT: CotBang[] = [
    { key: 'kn', nhan: t('Kỹ năng'), kieu: 'chip', rong: 170 },
    { key: 'kq', nhan: t('Đạt kỳ vọng'), kieu: 'chu' },
    { key: 'chua', nhan: t('Chưa đạt'), kieu: 'so', rong: 110 },
    ...(coThi ? [{ key: 'thi', nhan: t('Thi thật'), kieu: 'chu', rong: 330, goiY: t('Đạt Target thi thật') } as CotBang] : []),
  ];
  const oCua = (h: HangKn, c: CotBang): ReactNode => {
    if (c.key === 'kn') return <ChipKy k={h.nhan} />;
    if (c.key === 'kq') {
      if (!h.kq) return <span className="text-slate-500">—</span>;
      const pt = Math.round((100 * h.kq.dung) / h.kq.tong);
      /* Thanh tỉ lệ trung tính (không màu ngưỡng — C08): độ dài = % đạt; số đạt bấm được. */
      return (
        <span className="flex min-w-0 items-center gap-2.5">
          <b className="w-12 shrink-0 tabular-nums text-slate-100">{pt} %</b>
          <span aria-hidden className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-[color:var(--line)]"><span className="block h-full rounded-full bg-[color:var(--accent)]" style={{ width: `${pt}%` }} /></span>
          <span className="whitespace-nowrap text-xs text-slate-400">{mo(h.cotKq, 'dat', h.kq.dung, `${t('Đạt kỳ vọng')} · ${h.nhan}`, 'text-slate-200')}/{h.kq.tong} {t('lượt')}</span>
        </span>
      );
    }
    if (c.key === 'chua') return h.kq ? mo(h.cotKq, 'chua', h.kq.tong - h.kq.dung, `${t('Chưa đạt')} · ${h.nhan}`, 'font-semibold text-slate-100') : <span className="text-slate-500">—</span>;
    if (!h.thi) return <span className="text-slate-500">—</span>;
    const cot = `thi-that-ky:${h.skill}`;
    return (
      <span className="inline-flex items-baseline gap-3 whitespace-nowrap text-[13px]">
        <span className="text-slate-400">▲ {t('Đạt')} {mo(cot, 'dat', h.thi.dung, `${t('Thi thật')} ${h.nhan} · ${t('Đạt')}`, 'font-semibold text-slate-100')}</span>
        <span className="text-slate-400">▼ {t('Chưa đạt')} {mo(cot, 'chua', h.thi.tong - h.thi.dung, `${t('Thi thật')} ${h.nhan} · ${t('Chưa đạt')}`, 'font-semibold text-slate-100')}</span>
        <span className="text-slate-400">★ {t('Vượt')} {mo(cot, 'vuot', h.vuot, `${t('Thi thật')} ${h.nhan} · ${t('Vượt Target')}`, 'font-semibold text-slate-100')}</span>
      </span>
    );
  };
  return (
    <>
      <h3 className="m-0 px-4 pb-1 pt-3 text-[13px] font-semibold text-slate-400">{t('Theo kỹ năng')}</h3>
      {dienThoai ? (
        /* 375: mỗi kỹ năng MỘT dòng (thẻ của `Bang` cao gấp ba) — kỹ năng · % + thanh · chưa đạt · thi thật. */
        <ul className="m-0 list-none px-4 pb-2">
          {hang.map((h) => (
            <li key={h.khoa} className="flex flex-col gap-1 border-t py-2 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
              <span className="flex items-center justify-between gap-2"><ChipKy k={h.nhan} />{oCua(h, COT[1])}</span>
              <span className="flex flex-wrap items-baseline gap-x-3 text-[13px] text-slate-400">
                {h.kq && <span>{t('Chưa đạt')} {oCua(h, COT[2])}</span>}
                {h.thi && <span>{t('Thi thật')}: {oCua(h, { key: 'thi', nhan: '', kieu: 'chu' })}</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : <Bang ten={t('Theo kỹ năng')} cot={COT} hang={hang} khoa={(h) => h.khoa} oCua={oCua} khung={false} />}
    </>
  );
}

// ------------------------------------------------------------------ 1 · Việc đang có

function KhoiViec({ gvId, nguoiXem, homNay, ngan, viec }: {
  gvId: number; nguoiXem: { userId: number; laQuanLy: boolean }; homNay: string; ngan: (iso: string) => string;
  viec: { data: { viec: NhomSo[] } | null; loading: boolean; error: { message: string; hint?: string } | null; reload: () => void };
}) {
  const { data, loading, error, reload } = viec;
  return (
    <Card
      title={<>{t('Việc đang có')}<Goi chu={t('Việc lấy từ Công việc. Bấm để mở đúng danh sách. Ý thức & Phối hợp: chỉ việc có hạn.')} /></>}
      action={<span className="text-xs text-slate-400">{t('hôm nay {ngay} · tuần', { ngay: ngan(homNay) })} <span className="tabular-nums text-slate-200">{tuanLich(homNay, homNay)}</span></span>}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <Skeleton rows={2} />
        : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {data.viec.map((x) => {
              const link = (chiQuaHan: boolean) => duongViecCuaGv(gvId, nguoiXem, x.nhom, chiQuaHan);
              const trong = x.n === 0;
              return (
                <div key={x.nhom} className={`relative flex min-w-0 flex-col gap-0.5 rounded-lg border px-3 py-2.5 ${trong ? 'opacity-70' : 'hover:border-[color:var(--accent-line)]'}`}
                  style={{ borderColor: 'var(--line)' }}>
                  <span className="text-xs text-slate-400">{dich(NHOM_VIEC_LABEL[x.nhom])}</span>
                  {trong
                    ? <span className="text-2xl font-bold leading-tight tabular-nums text-slate-500">0</span>
                    : <Link to={link(false)} className="text-2xl font-bold leading-tight tabular-nums text-slate-100 no-underline after:absolute after:inset-0 after:rounded-lg"
                        aria-label={t('{n} việc {nhom}. Bấm để mở Công việc', { n: x.n, nhom: dich(NHOM_VIEC_LABEL[x.nhom]) })}>{x.n}</Link>}
                  {x.quaHan > 0
                    ? <Link to={link(true)} className={`relative z-10 w-fit py-2 -my-2 text-xs text-bad no-underline hover:underline ${soDam}`}>{t('{n} quá hạn', { n: x.quaHan })}</Link>
                    : <span className="text-xs text-slate-500">{trong ? '—' : t('không quá hạn')}</span>}
                </div>
              );
            })}
          </div>
        )}
    </Card>
  );
}

// ------------------------------------------------------------------ 4 · Case đang phụ trách

/**
 * CASE ĐANG PHỤ TRÁCH — gọn (chủ SP 23/10: không trải cả danh sách). Một hàng đếm theo trạng thái (bấm → panel đúng nhóm, tại chỗ) · tối đa 5 Case
 * cần làm trước (quá hạn, rồi hạn gần — thứ tự máy chủ) · "Xem cả n Case" mở panel (phân trang 10 / 20 / 50, dòng mở rộng làm việc tại chỗ).
 */
const CASE_TRUOC = 5;
function KhoiCase({ data, homNay, linkPa }: { data: HoSo; homNay: string; linkPa: { den: string; chu: string } | null }) {
  const id = data.gv.id;
  const ds = data.caseMo;
  const viec = (c: CaseHs) => {
    const [v] = viecTiepCuaEm({ nhapDiem: null, cases: [{ caseId: c.id, topic: c.topic, viecTiep: c.viecTiep }], yThuc: null, homNay, chuongTrinh: null });
    return v ? <ViecTiep v={v} den={duongHoSoHocVien(c.studentId, { caseId: c.id })} /> : <span className="text-slate-500">—</span>;
  };
  /* Trạng thái theo thứ tự gấp: Quá hạn · Cần làm · Chờ duyệt · Đang làm (chỉ nhóm có Case). */
  const nhom = (['qua-han', 'can-lam', 'cho-duyet', 'dang-lam'] as const).map((tt) => ({ tt, n: ds.filter((c) => c.trangThai.t === tt).length })).filter((x) => x.n > 0);
  const truoc = ds.filter((c) => c.viecTiep).slice(0, CASE_TRUOC);
  return (
    <Card title={t('Case đang phụ trách')}
      action={linkPa ? <Link to={linkPa.den} className="link whitespace-nowrap py-2 -my-2 text-xs">{linkPa.chu}</Link> : undefined}>
      {!ds.length ? <Empty title={t('Không có Case nào đang mở.')} /> : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-2xl font-bold tabular-nums text-slate-100"><OSo giaTri={ds.length} tieuDe={t('Case đang phụ trách')} nguon={nguon(id, 'cot=case-mo')} /></span>
            <span className="mr-2 text-sm text-slate-400">Case</span>
            {nhom.map((x) => (
              <span key={x.tt} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[13px]" style={{ borderColor: 'var(--line-strong)' }}>
                <NhanTrangThai t={x.tt} />
                <OSo giaTri={x.n} tieuDe={`Case · ${dich(NHAN_TRANG_THAI[x.tt])}`} nguon={nguon(id, `cot=case-mo&tt=${x.tt}`)} className={`${vung} font-bold ${x.tt === 'qua-han' ? 'text-bad' : 'text-slate-100'}`} />
              </span>
            ))}
            {/* V4 GIỮ: Case có việc tiếp quá hạn (khác nhãn trạng thái) → panel. */}
            {ds.some((c) => c.quaHan) && (
              <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold text-bad" style={{ borderColor: 'var(--line-strong)' }}>
                ⚠ {t('việc tiếp quá hạn')}
                <OSo giaTri={ds.filter((c) => c.quaHan).length} tieuDe={t('Case có việc quá hạn')} nguon={nguon(id, 'cot=case-qua-han')} className={`${vung} font-bold text-bad`} />
              </span>
            )}
          </div>
          {truoc.length > 0 && (
            <div>
              <h3 className="m-0 mb-1 text-[13px] font-semibold text-slate-400">{t('Cần làm trước')}</h3>
              <ul className="m-0 list-none p-0">
                {truoc.map((c) => (
                  <li key={c.id} className="grid gap-x-4 gap-y-0.5 border-t py-2 first:border-t-0 sm:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)_minmax(0,16rem)] sm:items-center"
                    style={{ borderColor: 'var(--line)', ...(c.quaHan ? { boxShadow: 'inset 3px 0 0 rgb(var(--bad-rgb))', paddingLeft: 8 } : {}) }}>
                    <span className="min-w-0 truncate text-sm"><Link to={`/hoc-vien/${c.studentId}`} className="link font-semibold">{c.hocVien}</Link>{c.maLop && <span className="text-xs text-slate-400"> · {c.maLop}</span>}</span>
                    <Link to={duongHoSoHocVien(c.studentId, { caseId: c.id })} className="link inline-flex min-w-0 max-w-full text-left text-sm" title={dich(c.tieuDe)}>
                      <TenCase c={{ title: dich(c.tieuDe), tenSos: c.tenSos && { ...c.tenSos, giua: dich(c.tenSos.giua) } }} />
                    </Link>
                    <span className="min-w-0 text-sm">{viec(c)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ds.length > truoc.length && (
            <span className="text-sm text-slate-400">
              <OSo giaTri={ds.length} nhan={t('Xem cả {n} Case', { n: ds.length })} tieuDe={t('Case đang phụ trách')} nguon={nguon(id, 'cot=case-mo')} className={vung} />
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ 5 · Yêu cầu đã gửi

function KhoiYeuCau({ data, coDuyet }: { data: HoSo; coDuyet: boolean }) {
  const { gv, yeuCau: y } = data;
  const id = gv.id;
  const link: ReactNode = gv.laChinhMinh
    ? <Link to="/cong-viec/yeu-cau" className="link text-xs">{t('Yêu cầu của tôi ›')}</Link>
    : coDuyet ? <Link to="/cong-viec/cho-duyet" className="link text-xs">{t('Chờ duyệt ›')}</Link> : null;
  return (
    <Card title={gv.laChinhMinh ? t('Yêu cầu đã gửi') : t('Yêu cầu {ten} đã gửi', { ten: gv.ten.split(' ').pop() ?? gv.ten })} action={link}>
      {y.cho === 0 && y.tuChoi === 0 ? <p className="m-0 text-sm text-slate-400">{t('Không có yêu cầu nào đang chờ.')}</p> : (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span><OSo giaTri={y.cho} tieuDe={t('Yêu cầu đang chờ duyệt')} nguon={nguon(id, 'cot=yc-cho')} className={`${vung} ${soDam} text-slate-100`} /> {t('chờ duyệt')}
            {y.choQuaHan > 0 && <span className={`ml-1 text-xs text-bad ${soDam}`}>{t('({n} quá hạn duyệt)', { n: y.choQuaHan })}</span>}</span>
          <span className="text-slate-600" aria-hidden>·</span>
          <span><OSo giaTri={y.tuChoi} tieuDe={t('Yêu cầu bị từ chối trong 60 ngày')} nguon={nguon(id, 'cot=yc-tu-choi')} className={`${vung} ${soDam} text-slate-100`} /> {t('bị từ chối trong 60 ngày')}</span>
        </div>
      )}
    </Card>
  );
}
