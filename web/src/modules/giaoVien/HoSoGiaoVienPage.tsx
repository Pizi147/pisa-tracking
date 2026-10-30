import { Fragment, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  NHOM_VIEC_LABEL, addDaysIso, duongHieuQuaPaGv, duongHoSoHocVien, duongViecCuaGv, laVaiQuanLy, mondayOfDate, trangCha, tuanLich, viecTiepCuaEm,
  NHAN_TRANG_THAI, type ChipBanGiao, type ChiSoHoSoGv, type NhomViec, type OPtGv, type TrangThai, type ViecTiepCase,
} from '@shared/domain/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { Card, Empty, ErrorState, LOP_NHAN, NhanTrangThai, Skeleton } from '../../ui/ui.tsx';
import { CHIP_TRON, ChipKy } from '../../ui/Nhan.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { ViecTiep } from '../../ui/ViecTiep.tsx';
import { DuongVe } from '../../ui/ThanhTruocSau.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { CongTac, PhanTram, tuMau, tyLeGv, type TyLeV5 } from '../worklist/TongQuanV5.tsx';
import { TenCase } from '../cases/SkillBoard.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * HỒ SƠ GIÁO VIÊN V5 (UI-HO-SO-GV — `thiet-ke/v5/dieu-chinh-cuoi.html` khu e + `ho-so-gv.html` phương án C). Đầu gọn (tên · Vai · Kỹ năng · GVCN) +
 * kỳ Từ tuần – Đến tuần (tự do, mặc định 4 tuần — P9) · dải chỉ số theo kỳ · Lớp đang dạy · Học thuật theo lớp (lượt của từng HV — P8) ·
 * khối V4 giữ (Việc đang tồn, Case đang phụ trách, Yêu cầu đã gửi). Không điểm đánh giá người, không xếp hạng, không màu ngưỡng (C08).
 * Số gạch chân = panel chỉ đọc cùng hàm tập với số (`/giao-vien/:id/chi-so/o`, `/giao-vien/:id/o`); "›" = đổi trang; "?" = giải thích (P1).
 */

type NhomSo = { nhom: NhomViec; n: number; quaHan: number };
type LopHs = {
  id: number; ma: string; khung: 'ft' | 'thuong'; ct: string | null; vai: string; laGvcn: boolean; kyNang: string[]; gvcn: string | null; khai: string | null;
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
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
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
            <h1 className="m-0 text-xl font-bold text-slate-100">{gv.ten}</h1>
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
              {t('Chọn hai tuần bất kỳ; mặc định 4 tuần tới tuần này. Số theo kỳ: Việc đúng hạn, Điểm đúng hạn, Đạt kỳ vọng Test, Tiến bộ, bảng Học thuật.')}
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

      <DaiChiSo data={data} cs={cs} ky={ky} />
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

type ApiCs = { data: ChiSoHoSoGv | null; loading: boolean; error: { message: string; hint?: string; status?: number } | null; reload: () => void };

// ------------------------------------------------------------------ dải chỉ số (một thẻ, các ô ngăn bằng vạch — khung khu e)

/** Kết quả thi thật (IELTS): ▼ Fail · ▲ Pass · ★ Exceed — màu theo kết quả + ký hiệu (không chỉ màu); số bấm → panel đúng nhóm. */
const MAU_THI = { chua: 'text-bad', dat: 'text-ok', vuot: 'text-[color:var(--accent)]' } as const;
function BaThi({ cot, fail, pass, exceed, nguonCua, ten, motDong, gon }: {
  cot: string; fail: number; pass: number; exceed: number; nguonCua: (cot: string, loc: string) => string; ten: string;
  /** Ô bảng: chỉ ký hiệu + số (chữ ở tiêu đề cột; trình đọc màn vẫn đọc chữ). */
  gon?: boolean;
  /** Ô bảng rộng (≥ 640): một dòng, không xuống hàng; ô hẹp (dải số, thẻ 375) xuống hàng giữa các cụm. */
  motDong?: boolean;
}) {
  const o = (loc: 'chua' | 'dat' | 'vuot', dau: string, chu: string, n: number) => (
    <span className={`inline-flex items-baseline gap-1 whitespace-nowrap ${MAU_THI[loc]}`}>
      <span aria-hidden>{dau}</span>{gon ? <span className="sr-only">{chu}</span> : chu}
      <OSo giaTri={n} tieuDe={`${ten} · ${chu}`} nguon={nguonCua(cot, loc)} className={`${vung} font-bold ${n > 0 ? MAU_THI[loc] : ''}`} />
    </span>
  );
  return <span className={`inline-flex items-baseline gap-x-3 gap-y-0.5 ${motDong ? 'whitespace-nowrap' : 'flex-wrap'}`}>{o('chua', '▼', 'Fail', fail)}{o('dat', '▲', 'Pass', pass)}{o('vuot', '★', 'Exceed', exceed)}</span>;
}

/* Chủ SP 23/10 (lượt 3): dải 4 ô — Đúng hạn · Đạt kỳ vọng Test · Case có PA · Kết quả thi thật (cuối). Quá hạn hiện tại đã ở "Việc đang tồn". */
function DaiChiSo({ data, cs, ky }: { data: HoSo; cs: ApiCs; ky: string }) {
  const id = data.gv.id;
  const d = cs.data;
  const nguonCs = (cot: string, loc = '') => `/giao-vien/${id}/chi-so/o?cot=${cot}${loc ? `&loc=${loc}` : ''}&${ky}`;
  const o = (x: OPtGv | undefined, cot: string, ten: string) => (d ? <PhanTram x={tyLeGv(x)} nguon={nguonCs(cot)} tieuDe={ten} /> : <span className="text-slate-500">…</span>);
  const pa: TyLeV5 = { dat: data.caseMo.filter((c) => c.coPa).length, mau: data.caseMo.length };
  const paCt = d && d.paHieuQua.k === 'so' ? d.paHieuQua : null;
  const o1 = (ten: string, giaTri: ReactNode, mau: ReactNode, luat?: string) => ({ ten, giaTri, mau, luat });
  /* Số phụ trong ô (dòng nhỏ): % gạch chân bấm → panel; mẫu 0 → "—". */
  const nho = (x: OPtGv | undefined, cot: string, ten: string) => (d ? <PhanTram gon x={tyLeGv(x)} nguon={nguonCs(cot)} tieuDe={ten} /> : '…');
  const thi = d && d.thiThat.k === 'so' ? d.thiThat : null;
  const ds = [
    o1(t('Đúng hạn'), o(d?.diemDungHan, 'cham-diem', t('Điểm đúng hạn')),
      <>{tuMau(tyLeGv(d?.diemDungHan), t('bài Test'))}{d && <> · {t('Việc')} {nho(d.viecDungHan, 'viec-dung-han', t('Việc đúng hạn'))}</>}</>,
      t('Số to: bài Test nhập điểm trước hạn / bài Test tới hạn nhập trong kỳ (theo người được phân công ở hạn nhập). Việc: việc có hạn trong kỳ (ghi kết quả PA) xong trước hạn.')),
    o1(t('Đạt kỳ vọng Test'), o(d?.ketQua, 'ket-qua', t('Đạt kỳ vọng Test')),
      <>{tuMau(tyLeGv(d?.ketQua), t('lượt Test'))}{d && d.tienBo.k !== 'na' && <> · {t('Tiến bộ')} {nho(d.tienBo, 'tien-bo', t('HV tiến bộ'))}</>}</>,
      t('Test (MT, Progress, Final — không gồm thi thật): theo quy tắc Overall, một lượt = một lượt Test của một HV × kỹ năng GV dạy, gán người dạy ở tuần thi. Tiến bộ: lượt có điểm cao hơn lượt MT trước của chính HV ở cùng kỹ năng (Fast Track).')),
    o1(t('Case có PA'), <PhanTram x={pa} nguon={nguon(id, 'cot=case-mo')} tieuDe={t('Case đang phụ trách')} vung="chi-so" />,
      paCt ? <>{t('PA cải thiện')} <OSo giaTri={paCt.tong} nhan={`${paCt.dung}/${paCt.tong}`} nguon={nguonCs('pa-hieu-qua')} tieuDe={t('PA hiệu quả')} className={vung} /></> : t('Case đang phụ trách')),
    /* Chủ SP 23/10: thi thật (IELTS) RẤT quan trọng — % Pass Target + Fail · Pass · Exceed (bấm → danh sách có điểm). */
    o1(t('Kết quả thi thật'),
      d?.thiThat.k === 'na' ? <span className="text-slate-500">—</span> : <span className="inline-flex flex-wrap items-baseline gap-x-2"><span className="whitespace-nowrap">{o(d?.thiThat, 'thi-that', t('Kết quả thi thật'))}</span>{thi && <span className="whitespace-nowrap text-xs font-medium text-slate-400">Pass Target</span>}</span>,
      thi ? <BaThi cot="thi-that" fail={thi.tong - thi.dung} pass={thi.dung} exceed={d!.thiThatVuot} nguonCua={nguonCs} ten={t('Kết quả thi thật')} />
        : d?.thiThat.k === 'na' ? t('Không dạy lớp Fast Track') : t('Thi thật trong kỳ'),
      t('HV có ngày thi thật (IELTS) trong kỳ, GV dạy kỹ năng ở lớp cuối trước ngày thi. Pass = Overall đạt Target · Fail = chưa đạt · Exceed = Overall cao hơn Target.')),
  ];
  return (
    <section aria-label={t('Chỉ số')} className="card overflow-clip">
      {cs.error && <div className="border-b p-3" style={{ borderColor: 'var(--line)' }}><ErrorState message={cs.error.message} hint={cs.error.hint} status={cs.error.status} onRetry={cs.reload} /></div>}
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {ds.map((x) => (
          <div key={x.ten} className="flex min-w-0 flex-col gap-0.5 border-b border-r px-4 py-3.5" style={{ borderColor: 'var(--line)' }}>
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
                <Link to={`/hoc-vien/lop/${l.id}`} className="ten-ho-so">{l.ma}</Link>
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
                {/* V4 GIỮ: bài quá hạn nhập theo lớp (trước ở bảng lớp) — ⚠ + chữ, không chỉ màu. */}
                {l.quaHan > 0 && (
                  <span className="whitespace-nowrap font-semibold text-bad">· ⚠ <OSo giaTri={l.quaHan} tieuDe={`${t('Bài quá hạn chưa nhập điểm')} · ${l.ma}`} nguon={nguon(id, `cot=qua-han&lop=${l.id}`)} className={`${vung} text-bad`} /> {t('quá hạn')}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ Học thuật (chủ SP 23/10: FT | Lớp thường, bảng Kỹ năng ‖ bảng Lớp cạnh nhau)

type Khung = 'ft' | 'thuong';
type SoOk = Extract<OPtGv, { k: 'so' }>;
const laSo = (o: OPtGv | undefined): SoOk | null => (o && o.k === 'so' && o.tong > 0 ? o : null);
const cong = (a: TyLeV5 | null, b: TyLeV5 | null): TyLeV5 | null => (!a ? b : !b ? a : { dat: a.dat + b.dat, mau: a.mau + b.mau });
/** Thanh tỉ lệ trung tính (không màu ngưỡng — C08). */
const Thanh = ({ p }: { p: number }) => (
  <span aria-hidden className="h-1.5 w-8 shrink-0 overflow-hidden rounded-full bg-[color:var(--line)]"><span className="block h-full rounded-full bg-[color:var(--accent)]" style={{ width: `${p}%` }} /></span>
);
/**
 * MỘT kiểu ô tỉ lệ cho MỌI cột % của khối Học thuật (chủ SP 23/10: hai bảng cùng chỉ số thì cùng cách hiện): % đậm (gạch chân bấm → panel) · thanh · n/N nhỏ.
 * Mẫu 0 → "—". Hàng Cộng: % không bấm (số đã bấm được ở dải).
 */
function OTyLe({ x, nguon: ng, tieuDe, dam }: { x: TyLeV5 | null; nguon?: string; tieuDe: string; dam?: boolean }) {
  if (!x || !x.mau) return <span className="text-slate-500" title={t('Chưa có dữ liệu')}>—</span>;
  const p = Math.round((100 * x.dat) / x.mau);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="w-11 shrink-0">{ng && !dam ? <PhanTram gon x={x} nguon={ng} tieuDe={tieuDe} /> : <b className="font-bold tabular-nums text-slate-100">{p} %</b>}</span>
      <Thanh p={p} />
      <span className="w-9 shrink-0 text-xs tabular-nums text-slate-500">{x.dat}/{x.mau}</span>
    </span>
  );
}
/** Khung riêng cho một bảng (chủ SP 23/10: hai bảng tách hẳn — viền + dải tiêu đề, cách nhau). */
function KhungBang({ ten, phai, children }: { ten: string; phai?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={ten} className="min-w-0 overflow-clip rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
      <h3 className="m-0 flex min-h-11 items-center justify-between gap-2 border-b px-4 py-2 text-sm font-bold text-slate-100" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
        {ten}{phai}
      </h3>
      {children}
    </section>
  );
}

/** Bề rộng MỘT cột tỉ lệ: ô % 44 + thanh 32 + n/N 36 + khoảng 12 + đệm ô 24. */
const RONG_TL = 156;
/**
 * 375 (chủ SP 23/10): bảng thẻ của `Bang` cao gấp ba — mỗi hàng một khối gọn: dòng đầu (`dau`: tên / chip), dưới là các cặp "nhãn số" nối tiếp, xuống dòng giữa các cặp.
 */
function BangGon<H>({ cot, hang, khoa, oCua, dau = [cot[0].key] }: {
  cot: readonly CotBang[]; hang: readonly H[]; khoa: (h: H) => string; oCua: (h: H, c: CotBang) => ReactNode; dau?: string[];
}) {
  if (!hang.length) return <Empty title={t('Chưa có dữ liệu')} />;
  return (
    <ul className="m-0 list-none p-0">
      {hang.map((h) => (
        <li key={khoa(h)} className="flex flex-col gap-1.5 border-t px-4 py-2.5 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
          <span className="flex min-w-0 flex-wrap items-center gap-2">{cot.filter((c) => dau.includes(c.key)).map((c) => <Fragment key={c.key}>{oCua(h, c)}</Fragment>)}</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            {cot.filter((c) => !dau.includes(c.key)).map((c) => (
              <span key={c.key} className="inline-flex items-center gap-1.5"><span className="whitespace-nowrap text-xs text-slate-400">{c.nhan}</span>{oCua(h, c)}</span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function KhoiHocThuat({ data, cs, ky }: { data: HoSo; cs: ApiCs; ky: string }) {
  const d = cs.data;
  const coKhung = new Set<Khung>([...data.lop.map((l) => l.khung), ...(d?.hocThuatTheoLop ?? []).map((h) => h.khung), ...(d?.ketQuaTheoKyNang ?? []).map((x) => x.khung)]);
  const macDinh: Khung = coKhung.has('ft') || !coKhung.size ? 'ft' : 'thuong';
  const [chon, setChon] = useThamSoUrl('khung', macDinh);
  const khung: Khung = coKhung.has(chon as Khung) ? (chon as Khung) : macDinh;
  return (
    <Card bodyClass="p-0"
      title={<span className="inline-flex flex-wrap items-baseline gap-x-2">{t('Học thuật')}<span className="text-xs font-normal text-slate-500">{t('lượt Test của từng HV có tuần Test trong kỳ')}</span></span>}
      action={(
        <span className="flex items-center gap-2">
          {coKhung.size > 1 && <CongTac value={khung} onChange={(k) => setChon(k)} muc={[['ft', 'Fast Track'], ['thuong', t('Lớp thường')]]} />}
          <NutLuat label={t('Học thuật')} phai>{t('Đạt kỳ vọng Test theo quy tắc Overall; lượt = một lượt Test của một HV × kỹ năng GV dạy, gán theo lớp em học lúc Test. Thi thật (IELTS) tính riêng. Bảng lớp: lớp đang học khai giảng lâu nhất lên đầu, rồi lớp đáng lo; lớp đã kết thúc ở cuối.')}</NutLuat>
        </span>
      )}>
      {cs.error ? <ErrorState message={cs.error.message} hint={cs.error.hint} status={cs.error.status} onRetry={cs.reload} />
        : !d ? <Skeleton rows={3} className="p-4" />
        : (
          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <BangKyNang id={data.gv.id} d={d} ky={ky} khung={khung} />
            <BangLop data={data} d={d} ky={ky} khung={khung} />
          </div>
        )}
    </Card>
  );
}

/** BẢNG KỸ NĂNG: kỹ năng GV phụ trách · Đạt kỳ vọng Test (% + thanh) · FT: Kết quả thi thật (Fail · Pass · Exceed) · Thường: Chưa đạt Test. */
type HangKn = { skill: string; nhan: string; kq: SoOk | null; thi: SoOk | null; vuot: number };
function BangKyNang({ id, d, ky, khung }: { id: number; d: ChiSoHoSoGv; ky: string; khung: Khung }) {
  const dienThoai = useDienThoai();
  const nguonCs = (cot: string, loc = '') => `/giao-vien/${id}/chi-so/o?cot=${cot}${loc ? `&loc=${loc}` : ''}&${ky}`;
  const hang: HangKn[] = d.ketQuaTheoKyNang.filter((x) => x.khung === khung).map((x) => {
    const tt = khung === 'ft' ? d.thiThatTheoKyNang.find((y) => y.skill === x.skill) : undefined;
    return { skill: x.skill, nhan: x.nhan, kq: laSo(x.o), thi: laSo(tt?.o), vuot: tt?.vuot ?? 0 };
  });
  /* Kỹ năng chỉ có thi thật (chưa có lượt Test trong kỳ) vẫn có hàng. */
  if (khung === 'ft') for (const y of d.thiThatTheoKyNang) if (!hang.some((h) => h.skill === y.skill)) hang.push({ skill: y.skill, nhan: y.nhan, kq: null, thi: laSo(y.o), vuot: y.vuot });
  const ft = khung === 'ft';
  /* Chủ SP 23/10: khoảng trống dồn sau cột Kỹ năng (cột linh hoạt duy nhất); cột số gọn, sát nhau bên phải. Không cột "Chưa đạt Test" — % đã kèm n/N, bấm % ra danh sách có tab Chưa đạt. */
  const COT: CotBang[] = [
    { key: 'kn', nhan: t('Kỹ năng'), kieu: 'chu' },
    { key: 'kq', nhan: ft ? t('Đạt kỳ vọng Test') : t('Đạt Test'), kieu: 'chu', rong: RONG_TL },
    ...(ft ? [{ key: 'thi', nhan: t('Kết quả thi thật'), kieu: 'chu', rong: 150, goiY: 'Fail · Pass · Exceed' } as CotBang] : []),
  ];
  const oCua = (h: HangKn, c: CotBang): ReactNode => {
    const cot = `ket-qua:${khung}:${h.skill}`;
    /* Cột "chu" linh hoạt: chữ trong chip thẳng mép chữ tiêu đề (cùng cách `th[data-kieu=chip]` đệm 20 px). */
    if (c.key === 'kn') return <span className={dienThoai ? '' : '-ml-2 inline-flex'}><ChipKy k={h.nhan} /></span>;   // SUA-DO-KHUNG: chip min-w 24 canh giữa → chữ lùi ~8 px, bù 8 (g1)
    if (c.key === 'kq') return <OTyLe x={h.kq && { dat: h.kq.dung, mau: h.kq.tong }} nguon={nguonCs(cot)} tieuDe={`${c.nhan} · ${h.nhan}`} />;
    if (!h.thi) return <span className="text-slate-500">—</span>;
    return <BaThi gon={!dienThoai} motDong={!dienThoai} cot={`thi-that-ky:${h.skill}`} fail={h.thi.tong - h.thi.dung} pass={h.thi.dung} exceed={h.vuot} nguonCua={nguonCs} ten={`${t('Kết quả thi thật')} ${h.nhan}`} />;
  };
  return (
    <KhungBang ten={t('Theo kỹ năng')} phai={ft && hang.some((h) => h.thi) && (
      /* Chú giải ký hiệu thi thật — ô bảng chỉ còn ký hiệu + số. */
      <span className="flex gap-2.5 text-xs font-semibold"><span className={MAU_THI.chua}>▼ Fail</span><span className={MAU_THI.dat}>▲ Pass</span><span className={MAU_THI.vuot}>★ Exceed</span></span>
    )}>
      {dienThoai ? <BangGon cot={COT} hang={hang} khoa={(h) => h.skill} oCua={oCua} />
        : <Bang ten={t('Theo kỹ năng')} cot={COT} hang={hang} khoa={(h) => h.skill} oCua={oCua} khung={false}
            rong={{ tieuDe: t('Chưa có dữ liệu'), goiY: t('Không có lượt Test nào trong kỳ này.') }} />}
    </KhungBang>
  );
}

/**
 * BẢNG LỚP (chủ SP 23/10): 7 hàng một trang · lớp đang học khai giảng lâu nhất lên đầu, cùng tuần khai giảng thì lớp đáng lo trước
 * (Đạt kỳ vọng Test thấp, có Fail thi thật) · lớp đã kết thúc ở cuối, mờ đi · hàng Cộng (mọi lớp của khung) cuối mỗi trang.
 */
type HangL = {
  khoa: string; classId: number | null; ma: string; kyNang: string[]; luot: number; theoBai: { bai: string; n: number }[]; khai: string | null; xong: boolean;
  ketQua: TyLeV5 | null; tienBo: TyLeV5 | null; thiThat: TyLeV5 | null; cong?: boolean;
};
const MOI_TRANG = 7;
function BangLop({ data, d, ky, khung }: { data: HoSo; d: ChiSoHoSoGv; ky: string; khung: Khung }) {
  const dienThoai = useDienThoai();
  const id = data.gv.id;
  const nguonCs = (cot: string, loc = '') => `/giao-vien/${id}/chi-so/o?cot=${cot}${loc ? `&loc=${loc}` : ''}&${ky}`;
  const ft = khung === 'ft';
  const hang: HangL[] = d.hocThuatTheoLop.filter((h) => h.khung === khung).map((h) => ({
    khoa: `l${h.classId}`, classId: h.classId, ma: h.ma, kyNang: h.kyNang, luot: h.luot, theoBai: h.theoBai, khai: h.khai, xong: h.xong,
    ketQua: tyLeGv(h.ketQua), tienBo: tyLeGv(h.tienBo), thiThat: tyLeGv(h.thiThat),
  }));
  /* Lớp đang dạy chưa có lượt trong kỳ vẫn có hàng — không mất lớp, ô ghi "—". */
  for (const l of data.lop) {
    if (l.khung === khung && !hang.some((h) => h.classId === l.id)) {
      hang.push({ khoa: `l${l.id}`, classId: l.id, ma: l.ma, kyNang: l.kyNang, luot: 0, theoBai: [], khai: l.khai, xong: false, ketQua: null, tienBo: null, thiThat: null });
    }
  }
  const lo = (h: HangL) => [h.ketQua?.mau ? h.ketQua.dat / h.ketQua.mau : 2, -((h.thiThat?.mau ?? 0) - (h.thiThat?.dat ?? 0))];
  hang.sort((a, b) => Number(a.xong) - Number(b.xong) || (a.khai ?? '9999').localeCompare(b.khai ?? '9999')
    || lo(a)[0] - lo(b)[0] || lo(a)[1] - lo(b)[1] || a.ma.localeCompare(b.ma, 'vi', { numeric: true }));
  const [trang, setTrang] = useState(0);
  const soTrang = Math.max(1, Math.ceil(hang.length / MOI_TRANG));
  const tr = Math.min(trang, soTrang - 1);
  const tong: HangL = {
    khoa: 'cong', classId: null, ma: t('Cộng'), kyNang: [], luot: hang.reduce((a, h) => a + h.luot, 0), theoBai: [], khai: null, xong: false, cong: true,
    ketQua: hang.reduce<TyLeV5 | null>((a, h) => cong(a, h.ketQua), null), tienBo: hang.reduce<TyLeV5 | null>((a, h) => cong(a, h.tienBo), null),
    thiThat: hang.reduce<TyLeV5 | null>((a, h) => cong(a, h.thiThat), null),
  };
  const COT: CotBang[] = ft ? [
    { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 128 },
    { key: 'ky', nhan: t('Kỹ năng'), kieu: 'chu' },
    { key: 'kq', nhan: t('Đạt kỳ vọng Test'), kieu: 'chu', rong: RONG_TL },
    { key: 'tb', nhan: t('Tiến bộ'), kieu: 'chu', rong: RONG_TL },
    { key: 'tt', nhan: t('Kết quả thi thật'), kieu: 'chu', rong: RONG_TL, goiY: '% Pass Target' },
  ] : [
    { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 128 },
    { key: 'ky', nhan: t('Kỹ năng'), kieu: 'chu' },
    { key: 'luot', nhan: t('Bài Test trong kỳ'), kieu: 'chu', rong: 168 },
    { key: 'kq', nhan: t('Đạt Test'), kieu: 'chu', rong: RONG_TL },
  ];
  const oCua = (h: HangL, c: CotBang): ReactNode => {
    const mo = h.xong ? 'opacity-60' : '';
    switch (c.key) {
      case 'lop': return h.cong ? <b className="font-bold">{h.ma}</b>
        : <span className={`inline-flex min-w-0 items-baseline gap-1.5 ${mo}`}><Link to={`/hoc-vien/lop/${h.classId}`} className="ten-ho-so truncate font-semibold">{h.ma}</Link>{h.xong && <span className="text-xs text-slate-500">{t('đã kết thúc')}</span>}</span>;
      case 'ky': return <span className={`flex gap-1 ${dienThoai ? '' : '-ml-1.5'} ${mo}`}>{h.kyNang.map((k) => <ChipKy key={k} k={k} />)}</span>;
      case 'luot': return <span className={`whitespace-nowrap tabular-nums ${mo}`}>{h.luot}{h.theoBai.length > 0 && <span className="text-slate-500"> · {h.theoBai.map((b) => `${b.bai} ${b.n}`).join(' · ')}</span>}</span>;
      case 'kq': case 'tb': case 'tt': {
        const x = c.key === 'kq' ? h.ketQua : c.key === 'tb' ? h.tienBo : h.thiThat;
        const cot = `${c.key === 'kq' ? 'ket-qua' : c.key === 'tb' ? 'tien-bo' : 'thi-that'}-lop:${h.classId}`;
        return <span className={mo}><OTyLe x={x} dam={h.cong} nguon={h.cong ? undefined : nguonCs(cot)} tieuDe={`${c.nhan} · ${h.ma}`} /></span>;
      }
      default: return null;
    }
  };
  const trangNay = hang.slice(tr * MOI_TRANG, (tr + 1) * MOI_TRANG);
  return (
      <KhungBang ten={t('Theo lớp')} phai={soTrang > 1 && (
        <span className="flex items-center gap-1 text-[13px] font-normal text-slate-400">
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={tr === 0} onClick={() => setTrang(tr - 1)} aria-label={t('Trang trước')}>‹</button>
          <span className="tabular-nums">{tr + 1}/{soTrang}</span>
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={tr >= soTrang - 1} onClick={() => setTrang(tr + 1)} aria-label={t('Trang sau')}>›</button>
        </span>
      )}>
      {dienThoai ? <BangGon cot={COT} hang={hang.length ? [...trangNay, tong] : []} khoa={(h) => h.khoa} oCua={oCua} dau={['lop', 'ky']} />
        : <Bang ten={t('Theo lớp')} cot={COT} hang={hang.length ? [...trangNay, tong] : []} khoa={(h) => h.khoa} oCua={oCua} khung={false}
            rong={{ tieuDe: t('Chưa có dữ liệu'), goiY: t('Không có lượt Test nào trong kỳ này.') }} />}
      </KhungBang>
  );
}

// ------------------------------------------------------------------ 1 · Việc đang tồn

function KhoiViec({ gvId, nguoiXem, homNay, ngan, viec }: {
  gvId: number; nguoiXem: { userId: number; laQuanLy: boolean }; homNay: string; ngan: (iso: string) => string;
  viec: { data: { viec: NhomSo[] } | null; loading: boolean; error: { message: string; hint?: string; status?: number } | null; reload: () => void };
}) {
  const { data, loading, error, reload } = viec;
  return (
    <Card
      title={<>{t('Việc đang tồn')}<Goi chu={t('Việc lấy từ Công việc. Bấm để mở đúng danh sách. Ý thức & Phối hợp: chỉ việc có hạn.')} /></>}
      action={<span className="text-xs text-slate-400">{t('hôm nay {ngay} · tuần', { ngay: ngan(homNay) })} <span className="tabular-nums text-slate-200">{tuanLich(homNay, homNay)}</span></span>}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
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
                    ? <span className="text-2xl font-bold leading-tight tabular-nums text-slate-500">0<span className="ml-1 text-xs font-normal">{t('việc')}</span></span>
                    : <Link to={link(false)} className="text-2xl font-bold leading-tight tabular-nums text-slate-100 no-underline after:absolute after:inset-0 after:rounded-lg"
                        aria-label={t('{n} việc {nhom}. Bấm để mở Công việc', { n: x.n, nhom: dich(NHOM_VIEC_LABEL[x.nhom]) })}>{x.n}<span className="ml-1 text-xs font-normal text-slate-400">{t('việc')}</span></Link>}
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
                ⚠ {t('việc quá hạn')}
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
                    <span className="min-w-0 truncate text-sm"><Link to={`/hoc-vien/${c.studentId}`} className="ten-ho-so">{c.hocVien}</Link>{c.maLop && <span className="text-xs text-slate-400"> · {c.maLop}</span>}</span>
                    <Link to={duongHoSoHocVien(c.studentId, { caseId: c.id })} className="link inline-flex min-w-0 max-w-full text-left text-sm" title={dich(c.tieuDe)}>
                      <TenCase c={{ title: dich(c.tieuDe), tenSos: c.tenSos && { ...c.tenSos, giua: dich(c.tenSos.giua) } }} />
                    </Link>
                    <span className="min-w-0 text-sm">{viec(c)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* 6C-NHO (bảng kê lỗi 2): bỏ "Xem cả n Case" — trùng số to đầu thẻ (cùng panel, cùng khoá → nháy). */}
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
