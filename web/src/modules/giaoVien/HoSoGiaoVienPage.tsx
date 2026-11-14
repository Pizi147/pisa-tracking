import { Fragment, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CHU_THEM_PA, NHOM_VIEC_LABEL, addDaysIso, tabCongViecHienThi, duongHieuQuaPaGv, duongHoSoHocVien, duongViecCuaGv, laVaiQuanLy, mondayOfDate, trangCha, tuanLich, viecTiepCuaEm,
  NHAN_TRANG_THAI, type ChipBanGiao, type ChiSoHoSoGv, type NhomViec, type OPtGv, type TrangThai, type ViecTiepCase,
} from '@shared/domain/index.ts';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChonKyNang } from '../platform/ProfilePage.tsx';
import { useSession } from '../../lib/session.tsx';
import { useThamSoUrl } from '../../lib/quayLai.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { CHIP_TRON, ChipHan, ChipKy } from '../../ui/Nhan.tsx';
import { OSo } from '../../ui/OSo.tsx';
import { DaiChiSo as DaiChiSoMong, ODai, SoTinh } from '../../ui/DaiChiSo.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { DuongVe } from '../../ui/ThanhTruocSau.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { CongTac, DemDau, PhanTram, tuMau, tyLeGv, type TyLeV5 } from '../worklist/TongQuanV5.tsx';
import { TenCase } from '../cases/SkillBoard.tsx';
import type { ViewCase } from '../cases/CasePanel.tsx';
import { NganCase } from '../students/NganCaseLuoi.tsx';
import { IconNhom } from '../congViec/DanhSachViec.tsx';
import { LopChuNhiem, phuLopDay, useHaiKhoi } from '../worklist/LopToiDay.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { lopKq } from '../../ui/BieuTuong.tsx';

/**
 * HỒ SƠ GIÁO VIÊN — GD-15 (Overhaul V6, mockup `thiet-ke/v21/ho-so-gv.html` H1–H7 + `tong-quan-ghi-chu.md` mục 1–3, 10 = lời 37):
 * đầu trang (tên · kỳ · nút việc │ Vai · Kỹ năng · GVCN = mã lớp) + DẢI CHUẨN cố định trên tab (Việc │ Chấm Test × % đúng hạn · Chưa làm) +
 * BA TAB `?tab=`: Lớp (Lớp đang dạy · Lớp chủ nhiệm · Em đang bổ trợ) · Học thuật (dải Đạt kỳ vọng Test · Tiến bộ · Thi thật + hai bảng) ·
 * Việc & Case (Case đang phụ trách │ Việc đang tồn + Yêu cầu đã gửi). Không điểm đánh giá người, không xếp hạng, không màu ngưỡng (C08).
 * Số trong hộp / gạch chân = panel chỉ đọc cùng hàm tập với số (`/giao-vien/:id/chi-so/o`, `/giao-vien/:id/o`); "›" = đổi trang; ⓘ = giải thích.
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
  gv: { id: number; ten: string; vai: string[]; chiNhanh: string[]; kyNang: string[]; kyNangMa: string[]; suaKyNang: boolean; laChinhMinh: boolean };
  phamVi: { chiNhanh: string[] | null; cn: number | null };
  lop: LopHs[]; tongHocVien: number; caseMo: CaseHs[];
  yeuCau: { cho: number; choQuaHan: number; tuChoi: number };
  /** GV-CU-BO-TRO: em GV đang dạy PA Bổ trợ miễn phí (kể cả em đã chuyển lớp) — lối vào hồ sơ HV. */
  boTro?: BoTroHs[];
  homNay: string;
};
type BoTroHs = { hvId: number; ten: string; lopId: number | null; lopMa: string | null; daDay: number; soBuoi: number | null; hanMiniTest: string | null; caseId: number; paId: number };
type ApiViec = { data: { viec: NhomSo[] } | null; loading: boolean; error: { message: string; hint?: string; status?: number } | null; reload: () => void };

const nguon = (id: number, q: string) => `/giao-vien/${id}/o?${q}`;
/** Vùng bấm >= 44 px cho số nhỏ (chạm tay) mà không đổi nhịp dòng: đệm dọc + lề âm bù. */
const vung = 'inline-block py-2 -my-2';

/** AUDIT-UI GV1: chip vai trung tính — xanh lá là màu kết quả «Đạt» (V4), không dùng cho vai. */
const ChipGvcn = () => <span className={`${CHIP_TRON} bg-[color:var(--surface-2)] font-semibold text-dim`}>GVCN</span>;

type TabHs = 'lop' | 'hoc-thuat' | 'viec';

export function HoSoGiaoVienPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi<HoSo>(`/giao-vien/${id}`, [id]);
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  /* P9: kỳ tự do — mặc định 4 tuần tới tuần này; giá trị mặc định không ghi lên URL. XM-13: Tổng quan / Phân tích GV truyền `tu`, `den` → kỳ đi theo trang nguồn. */
  const denMd = mondayOfDate(homNay), tuMd = addDaysIso(denMd, -21);
  const [tu, setTu] = useThamSoUrl('tu', tuMd);
  const [den, setDen] = useThamSoUrl('den', denMd);
  const [tabUrl, setTab] = useThamSoUrl('tab', 'lop');
  const tab: TabHs = tabUrl === 'hoc-thuat' || tabUrl === 'viec' ? tabUrl : 'lop';
  const kyLoi = tu > den ? t('Tuần đầu phải trước tuần cuối.') : null;
  const ky = `tu=${tu}&den=${den}`;
  const cs = useApi<ChiSoHoSoGv>(id && !kyLoi ? `/giao-vien/${id}/chi-so?${ky}` : null, [id, ky]);
  const viec = useApi<{ viec: NhomSo[] }>(`/giao-vien/${id}/viec`, [id]);
  /* XM-5: lớp chủ nhiệm + dòng phụ "Test kế tiếp" chỉ khi xem hồ sơ của chính mình (đường chỉ đọc phân công người gọi — QL xem không thêm câu đọc). */
  const haiKhoi = useHaiKhoi(!!data?.gv.laChinhMinh);
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={8} />;
  const { gv } = data;
  const nguoiXem = { userId: session?.user?.id ?? 0, laQuanLy: laVaiQuanLy(session?.roles) };
  /* Chủ SP 10/11 (B' 11): vai không có Công việc (Head tutor) → không nút sang Công việc (trước: bấm bị đẩy về Tổng quan). */
  const coNutViec = (gv.laChinhMinh && !!session?.nav?.work) || !!session?.nav?.workOps;
  const tenGoi = gv.ten.split(' ').pop() ?? gv.ten;
  const lopCn = data.lop.filter((l) => l.laGvcn);
  /* Badge tab Việc & Case = số việc quá hạn của "Việc đang tồn" (cùng GET): đỏ khi là việc của người xem, mờ khi xem người khác (H4 — đỏ chỉ cho việc của mình). */
  const dsViec = viec.data?.viec ?? [];
  const quaHan = dsViec.reduce((a, x) => a + x.quaHan, 0);
  const doiViec = () => { reload(); viec.reload(); };
  return (
    <div className="hsgv space-y-4">
      <div>
        <DuongVe cha={trangCha('gv', { nav: session?.nav })} ten={t('Hồ sơ {ten}', { ten: gv.ten })} />
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <h1 className="m-0 text-xl font-bold text-slate-100">{gv.ten}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {/* Mỗi cặp nhãn + ô giữ liền nhau — 375 xuống dòng giữa hai cặp, không tách "đến" khỏi ô. */}
            <span className="inline-flex items-center gap-2">
              <span className="text-[13px] text-slate-400 max-sm:sr-only">{t('Từ tuần')}</span>
              <span className="w-[8.75rem]"><ONgay kieu="tuan" gon value={tu} ariaLabel={t('Từ tuần')} onChange={(v) => v && setTu(mondayOfDate(v))} invalid={!!kyLoi} /></span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-[13px] text-slate-400 max-sm:sr-only">{t('đến')}</span>
              <span aria-hidden className="text-slate-400 sm:hidden">–</span>
              <span className="w-[8.75rem]"><ONgay kieu="tuan" gon value={den} ariaLabel={t('Đến tuần')} onChange={(v) => v && setDen(mondayOfDate(v))} invalid={!!kyLoi} /></span>
            </span>
            <NutLuat label={t('Kỳ xem')} phai>
              {t('Chọn hai tuần bất kỳ; mặc định 4 tuần tới tuần này. % đúng hạn · Chưa làm: việc / bài Test có hạn trong kỳ (bấm % xem Đúng hạn · Làm muộn · Chưa làm). Tab Học thuật cũng theo kỳ.')}
              {!gv.laChinhMinh && data.phamVi.chiNhanh && <> {t('Quản lý đang xem · chỉ tính lớp, Case, yêu cầu ở {cn}', { cn: data.phamVi.chiNhanh.join(', ') })}.</>}
            </NutLuat>
            {coNutViec && (
              <Link to={duongViecCuaGv(gv.id, nguoiXem, null)} className="btn no-underline max-sm:min-h-11 max-sm:w-full max-sm:items-center max-sm:justify-center">
                {gv.laChinhMinh ? t('Mở Công việc ›') : t('Việc của {ten} ›', { ten: tenGoi })}
              </Link>
            )}
          </div>
        </header>
        {kyLoi && <p className="m-0 mt-2 text-sm font-semibold text-bad" role="alert">⚠ {kyLoi}</p>}
        {/* H1 (dáng đầu hồ sơ ③ `.o-tin`): nhãn trên – giá trị dưới, vạch dọc ngăn ô; GVCN = mã lớp link (R8.4). */}
        <div className="o-tin mt-3 items-start max-sm:flex-col max-sm:[&>*]:border-0 max-sm:[&>*]:px-0">
          <NhanDau nhan={t('Vai')}>{[gv.vai.map((v) => dich(v)).join(' · '), gv.chiNhanh.join(', ')].filter(Boolean).join(' · ') || '—'}</NhanDau>
          <NhanDau nhan={t('Kỹ năng')}><KyNangGv gv={gv} onDaLuu={reload} /></NhanDau>
          {lopCn.length > 0 && (
            <NhanDau nhan="GVCN">
              <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                {lopCn.map((l, i) => <Fragment key={l.id}>{i > 0 && <span className="text-faint" aria-hidden>·</span>}<Link to={`/hoc-vien/lop/${l.id}`} className="text-slate-100 no-underline hover:underline">{l.ma}</Link></Fragment>)}
              </span>
            </NhanDau>
          )}
        </div>
      </div>

      <DaiDungHan id={gv.id} cs={cs} ky={ky} />
      <div data-hd="hsgv-tab">
        <HangTab panelId="hsgv-vung" ariaLabel={t('Nội dung hồ sơ giáo viên')} value={tab} onChange={setTab}
          tabs={[
            { key: 'lop', label: t('Lớp'), so: data.lop.length },
            { key: 'hoc-thuat', label: t('Học thuật') },
            gv.laChinhMinh
              ? { key: 'viec', label: t('Việc & Case'), badge: quaHan ? { so: quaHan, n: quaHan, quaHan, homNay: 0 } : null }
              : { key: 'viec', label: t('Việc & Case'), so: quaHan },
          ]} />
        <div id="hsgv-vung" role="tabpanel" aria-label={tab === 'lop' ? t('Lớp') : tab === 'hoc-thuat' ? t('Học thuật') : t('Việc & Case')} className="space-y-4 pt-4">
          {tab === 'lop' && (
            <>
              <KhoiLop data={data} phu={gv.laChinhMinh && haiKhoi.data ? phuLopDay(haiKhoi.data) : null} />
              {gv.laChinhMinh && <LopChuNhiem api={haiKhoi} />}
              <KhoiBoTro ds={data.boTro ?? []} />
            </>
          )}
          {tab === 'hoc-thuat' && <KhoiHocThuat data={data} cs={cs} ky={ky} />}
          {tab === 'viec' && (
            /* Bố cục B (như `BoCuc` Tổng quan): Case trái │ phải 400 Việc đang tồn + Yêu cầu; < 1280 một cột theo mockup H7b: Việc đang tồn → Case → Yêu cầu. */
            <div className="grid items-start gap-4 min-[1280px]:grid-cols-[minmax(0,1fr)_400px]">
              <div className="flex min-w-0 flex-col gap-4 max-[1279px]:order-2 min-[1280px]:row-span-2">
                <KhoiCase data={data} homNay={homNay} onDoi={doiViec}
                  linkPa={!gv.laChinhMinh && session?.nav?.analysis && data.phamVi.cn
                    ? { den: duongHieuQuaPaGv(data.phamVi.cn, gv.id, data.lop), chu: t('Hiệu quả PA của {ten} ›', { ten: tenGoi }) } : null} />
              </div>
              <div className="min-w-0 max-[1279px]:order-1"><KhoiViec gvId={gv.id} nguoiXem={nguoiXem} homNay={homNay} viec={viec} /></div>
              <div className="min-w-0 max-[1279px]:order-3"><KhoiYeuCau data={data} coDuyet={!!session?.nav?.workApprove} coYeuCau={!!session?.nav && tabCongViecHienThi(session.nav).includes('yeu-cau')} /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * QUYEN-KY-NANG (chủ SP 10/11, B' 7): kỹ năng hồ sơ GV — QL chi nhánh của GV / Quản trị sửa tại chỗ ("Sửa" → 5 ô → Lưu); GV chỉ xem.
 * Lưu qua `PUT /admin/accounts/:id/skills` (máy chủ kiểm lại quyền, ghi lịch sử kỹ năng); xong chỉ tải lại hồ sơ.
 * GD-15 (H4, R8.4): lưu xong "✓ Đã lưu kỹ năng · Hoàn tác" 10 giây — Hoàn tác ghi lại bộ kỹ năng cũ (cùng đường, cùng kiểm quyền).
 */
function KyNangGv({ gv, onDaLuu }: { gv: HoSo['gv']; onDaLuu: () => void }) {
  const toast = useToast();
  const [nhap, setNhap] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);
  if (!nhap) {
    return (
      <span className="flex flex-wrap items-center gap-1">
        {gv.kyNang.length ? gv.kyNang.map((k) => <ChipKy key={k} k={dich(k)} />) : <span className="font-normal text-slate-500">{t('chưa khai')}</span>}
        {gv.suaKyNang && <button type="button" className="btn btn-sm btn-ghost font-normal max-sm:min-h-11" onClick={() => setNhap(new Set(gv.kyNangMa))}>{t('Sửa')}</button>}
      </span>
    );
  }
  const doi = (k: string) => setNhap((cu) => { const m = new Set(cu); if (m.has(k)) m.delete(k); else m.add(k); return m; });
  const ghi = (skills: string[]) => api.put(`/admin/accounts/${gv.id}/skills`, { skills });
  const luu = async () => {
    setBusy(true);
    const cu = [...gv.kyNangMa];
    try {
      await ghi([...nhap]);
      toast.hoanTac(t('Đã lưu kỹ năng'), async () => {
        try { await ghi(cu); onDaLuu(); } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); }
      }, { key: `ky-nang-gv-${gv.id}` });
      setNhap(null); onDaLuu();
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <span className="flex flex-wrap items-center gap-2 font-normal">
      <ChonKyNang value={nhap} onToggle={doi} disabled={busy} />
      <button type="button" className="btn btn-sm btn-primary max-sm:min-h-11" disabled={busy} onClick={luu}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
      <button type="button" className="btn btn-sm max-sm:min-h-11" disabled={busy} onClick={() => setNhap(null)}>{t('Đóng')}</button>
    </span>
  );
}

/** Ô đầu hồ sơ (mockup `.o-tin` ③): nhãn 12 mờ trên, giá trị 15 / 700 dưới. */
function NhanDau({ nhan, children }: { nhan: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col gap-px">
      <span className="text-xs font-medium text-slate-500">{nhan}</span>
      <span className="text-[15px] font-bold text-slate-100">{children}</span>
    </span>
  );
}

type ApiCs = { data: ChiSoHoSoGv | null; loading: boolean; error: { message: string; hint?: string; status?: number } | null; reload: () => void };

// ------------------------------------------------------------------ dải chỉ số (một thẻ, các ô ngăn bằng vạch — khung khu e)

/** Kết quả thi thật (IELTS): ▼ Fail · ▲ Pass · ★ Exceed — màu theo kết quả + ký hiệu (không chỉ màu); số bấm → panel đúng nhóm. */
/* MAU-THONG-NHAT (chủ SP 05/11): Fail đỏ · Pass xanh dương · Exceed xanh lá (`lopKq`; trước: Pass xanh lá · Exceed xanh dương — ngược). */
const MAU_THI = { chua: lopKq('duoi'), dat: lopKq('bang'), vuot: lopKq('vuot') } as const;
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
  return <span className={`inline-flex items-baseline gap-x-3 gap-y-0.5 ${motDong ? 'whitespace-nowrap' : 'flex-wrap'}`}>{o('chua', '▼', t('Chưa đạt'), fail)}{o('dat', '▲', t('Đạt Target'), pass)}{o('vuot', '★', t('Vượt'), exceed)}</span>;
}

/**
 * DẢI CHUẨN ĐẦU HỒ SƠ (H1 / H4 / H7, lời 37 — cùng cột bảng Giáo viên Tổng quan): Việc · % đúng hạn · Chưa làm │ Chấm Test · % đúng hạn · Chưa làm.
 * Hộp % → panel sổ nghĩa vụ mở thẳng tab Đúng hạn (đúng hạn / làm muộn xem ở đó); Chưa làm → tab Chưa làm (đỏ khi > 0 — V22 chỉ màu). Cố định trên tab.
 * Chưa có số liệu trong kỳ (chưa phân công / Head tutor) → một câu, không sáu số 0 (H6).
 */
function DaiDungHan({ id, cs, ky }: { id: number; cs: ApiCs; ky: string }) {
  const d = cs.data;
  /* PT-SO-LOI (PTA 12/11): `tt` = tab mở sẵn của panel (`BangLuotPanel` đọc từ nguồn). */
  const nguonO = (cot: string, tt: 'dung' | 'chua') => `/giao-vien/${id}/chi-so/o?cot=${cot}&${ky}&tt=${tt}`;
  if (cs.error) return <ErrorState message={cs.error.message} hint={cs.error.hint} status={cs.error.status} onRetry={cs.reload} />;
  if (d && d.viecDungHan.k !== 'so' && d.diemDungHan.k !== 'so') {
    return <DaiChiSoMong nhan={t('Đúng hạn trong kỳ')}><ODai nhan={<span className="text-dim">{t('Chưa có số liệu trong kỳ')}</span>} /></DaiChiSoMong>;
  }
  const nhom = (ten: string, cot: 'viec-dung-han' | 'cham-diem', o: OPtGv | undefined) => [
    <ODai key={`${cot}-n`} nhom nhan={ten} />,
    <ODai key={`${cot}-pt`} nhan={t('% đúng hạn')}>{d ? <PhanTram gon x={tyLeGv(o)} nguon={nguonO(cot, 'dung')} tieuDe={`${ten} · ${t('% đúng hạn')}`} /> : <SoTinh n="…" />}</ODai>,
    <ODai key={`${cot}-chua`} nhan={t('Chưa làm')}>
      {!d ? <SoTinh n="…" /> : o?.k === 'so'
        ? <OSo giaTri={o.chua ?? 0} className={o.chua ? 'text-bad' : ''} nguon={nguonO(cot, 'chua')} tieuDe={`${ten} · ${t('Chưa làm')}`} />
        : <SoTinh n="—" />}
    </ODai>,
  ];
  return (
    <DaiChiSoMong nhan={t('Đúng hạn trong kỳ')} className="dai-cs-2nhom">
      {nhom(t('Việc'), 'viec-dung-han', d?.viecDungHan)}
      {nhom(t('Chấm Test'), 'cham-diem', d?.diemDungHan)}
    </DaiChiSoMong>
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

/**
 * LỚP ĐANG DẠY — BẢNG (H1, R8.5; gom "Kỹ năng tôi dạy" XM-5): Lớp (+ chip GVCN · Bàn giao; dòng phụ route / tuần học · Test kế tiếp chỉ ở hồ sơ mình) ·
 * Kỹ năng · HV · GVCN (chỉ tên GV khác) · Chưa nhập (hộp) · Quá hạn (hộp đỏ) — lời 37 mỗi ô một thành phần; hạn nhập xem ở panel của lớp.
 * 375: thẻ (tên + chip · dòng phụ · lưới HV / Chưa nhập / Quá hạn), 3 lớp đầu + "+ n lớp" mở tại chỗ.
 */
const LOP_375 = 3;
function KhoiLop({ data, phu }: { data: HoSo; phu: Map<number, string> | null }) {
  const id = data.gv.id;
  const dienThoai = useDienThoai();
  const [het, setHet] = useState(false);
  const COT: CotBang[] = [
    { key: 'lop', nhan: t('Lớp'), kieu: 'ten', linhHoat: true },
    { key: 'ky', nhan: t('Kỹ năng'), kieu: 'chip', rong: 130 },
    { key: 'hv', nhan: 'HV', kieu: 'diem', rong: 80 },
    { key: 'gvcn', nhan: 'GVCN', kieu: 'chu', rong: 220 },
    { key: 'chua', nhan: t('Chưa nhập'), kieu: 'diem', rong: 120 },
    { key: 'qh', nhan: t('Quá hạn'), kieu: 'diem', rong: 120 },
  ];
  const oCua = (l: LopHs, c: CotBang): ReactNode => {
    switch (c.key) {
      case 'lop': return (
        <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Link to={`/hoc-vien/lop/${l.id}`} className="ten-ho-so font-semibold">{l.ma}</Link>
          {l.laGvcn && <ChipGvcn />}
          <ChipBanGiaoLop l={l} />
        </span>
      );
      case 'ky': return <span className={`flex gap-1 ${dienThoai ? '' : '-ml-1.5'}`}>{l.kyNang.map((k) => <ChipKy key={k} k={dich(k)} />)}</span>;
      case 'hv': return <span className="tabular-nums">{l.hocVien}</span>;
      case 'gvcn': return l.laGvcn || !l.gvcn ? null : <span className="truncate">{l.gvcn}</span>;
      case 'chua': return <OSo giaTri={l.chuaNhap} tieuDe={`${t('Bài chưa nhập điểm')} · ${l.ma}`} nguon={nguon(id, `cot=chua-nhap&lop=${l.id}`)} />;
      /* V4 GIỮ: bài quá hạn nhập theo lớp — hộp đỏ (V22 chỉ màu; tên cột nói "Quá hạn"). */
      case 'qh': return <OSo giaTri={l.quaHan} className={l.quaHan ? 'text-bad' : ''} tieuDe={`${t('Bài quá hạn chưa nhập điểm')} · ${l.ma}`} nguon={nguon(id, `cot=qua-han&lop=${l.id}`)} />;
      default: return null;
    }
  };
  const the = (l: LopHs) => (
    <div className="grid gap-1.5">
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">{oCua(l, COT[0])}{oCua(l, COT[1])}</span>
      {(phu?.get(l.id) || (!l.laGvcn && l.gvcn)) && (
        <span className="text-[13px] text-dim">{[phu?.get(l.id), !l.laGvcn && l.gvcn ? `GVCN ${l.gvcn}` : null].filter(Boolean).join(' · ')}</span>
      )}
      <span className="mt-1 grid grid-cols-3 gap-x-2">
        {(['hv', 'chua', 'qh'] as const).map((k) => (
          <span key={k} className="grid content-start justify-items-start gap-1">
            <span className="text-xs text-dim">{COT.find((c) => c.key === k)!.nhan}</span>
            <span className="inline-flex min-h-9 items-center text-[15px] font-semibold">{oCua(l, COT.find((c) => c.key === k)!)}</span>
          </span>
        ))}
      </span>
    </div>
  );
  const hang = dienThoai && !het ? data.lop.slice(0, LOP_375) : data.lop;
  const an = data.lop.length - hang.length;
  return (
    <Card bodyClass="p-0 o-so-hop"
      title={(
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">{t('Lớp đang dạy')}{data.lop.length > 0 && <DemDau n={data.lop.length} />}
          <NutLuat label={t('Lớp đang dạy')}>{t('Phân công đang hiệu lực. Chưa nhập · Quá hạn: bài Test của lớp chưa nhập điểm, tính tới hôm nay — bấm số xem từng bài và hạn.')}</NutLuat>
          {data.lop.length > 0 && (
            <span className="text-[13px] font-normal text-slate-400">
              {t('lớp')} · <OSo giaTri={data.tongHocVien} tieuDe={t('Học viên đang học')} nguon={nguon(id, 'cot=hoc-vien')} className={vung} /> HV
            </span>
          )}
        </span>
      )}>
      {!data.lop.length ? <Empty title={t('Chưa có phân công lớp nào đang hiệu lực.')} /> : (
        <>
          <Bang ten={t('Lớp đang dạy')} cot={COT} hang={hang} khoa={(l) => l.id} oCua={oCua} phuCua={(l, c) => (c.key === 'lop' ? phu?.get(l.id) ?? null : null)}
            khung={false} theRieng={the} />
          {an > 0 && (
            <div className="border-t px-4 py-3" style={{ borderColor: 'var(--line)' }}>
              <button type="button" className="btn min-h-[44px] w-full justify-center" onClick={() => setHet(true)}>{t('+ {n} lớp', { n: an })}</button>
            </div>
          )}
        </>
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
      <span className="w-[58px] shrink-0">{ng && !dam ? <PhanTram gon x={x} nguon={ng} tieuDe={tieuDe} /> : <b className="font-bold tabular-nums text-slate-100">{p} %</b>}</span>
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

/** Bề rộng MỘT cột tỉ lệ: hộp % 58 (GD-15: số trong hộp) + thanh 32 + n/N 36 + khoảng 12 + đệm ô 24. */
const RONG_TL = 170;
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
/**
 * TAB HỌC THUẬT (H2, R8.5): dải của tab (Đạt kỳ vọng Test · Tiến bộ · Kết quả thi thật — chuyển từ dải đầu trang cũ) + công tắc khung (đoạn chuẩn, chỉ khi GV có
 * cả hai khung) + ⓘ │ hai bảng Theo kỹ năng · Theo lớp GIỮ. Đạt kỳ vọng Test của dải theo khung đang chọn = hàng Cộng (`ket-qua:<khung>`); Tiến bộ, thi thật chỉ FT
 * (lời 40: Lớp thường không vẽ ô không nghĩa).
 */
function KhoiHocThuat({ data, cs, ky }: { data: HoSo; cs: ApiCs; ky: string }) {
  const d = cs.data;
  const coKhung = new Set<Khung>([...data.lop.map((l) => l.khung), ...(d?.hocThuatTheoLop ?? []).map((h) => h.khung), ...(d?.ketQuaTheoKyNang ?? []).map((x) => x.khung)]);
  const macDinh: Khung = coKhung.has('ft') || !coKhung.size ? 'ft' : 'thuong';
  const [chon, setChon] = useThamSoUrl('khung', macDinh);
  const khung: Khung = coKhung.has(chon as Khung) ? (chon as Khung) : macDinh;
  const id = data.gv.id;
  const nguonCs = (cot: string, loc = '') => `/giao-vien/${id}/chi-so/o?cot=${cot}${loc ? `&loc=${loc}` : ''}&${ky}`;
  const ft = khung === 'ft';
  const kq = d ? d.ketQuaTheoKyNang.filter((x) => x.khung === khung).reduce<TyLeV5 | null>((a, x) => cong(a, x.o.k === 'so' ? { dat: x.o.dung, mau: x.o.tong } : null), null) : null;
  const thi = d && d.thiThat.k === 'so' ? d.thiThat : null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <DaiChiSoMong nhan={t('Học thuật trong kỳ')} className="min-w-0 flex-1">
          <ODai nhan={ft ? t('Đạt kỳ vọng Test') : t('Đạt Test')} phu={tuMau(kq, t('lượt'))}>
            {d ? <PhanTram gon x={kq} nguon={nguonCs(`ket-qua:${khung}`)} tieuDe={ft ? t('Đạt kỳ vọng Test') : t('Đạt Test')} /> : <SoTinh n="…" />}
          </ODai>
          {ft && d?.tienBo.k !== 'na' && (
            <ODai nhan={t('Tiến bộ')} phu={tuMau(tyLeGv(d?.tienBo), t('lượt'))}>
              {d ? <PhanTram gon x={tyLeGv(d.tienBo)} nguon={nguonCs('tien-bo')} tieuDe={t('HV tiến bộ')} /> : <SoTinh n="…" />}
            </ODai>
          )}
          {/* GIỮ thao tác dải cũ (ô "Case có PA" · PA cải thiện n/m → panel `pa-hieu-qua`, theo kỳ, FT) — mockup không vẽ; đặt ở dải Học thuật (số theo kỳ). */}
          {ft && d?.paHieuQua.k === 'so' && (
            <ODai nhan={t('PA cải thiện')}>
              <OSo giaTri={d.paHieuQua.tong} nhan={`${d.paHieuQua.dung}/${d.paHieuQua.tong}`} nguon={nguonCs('pa-hieu-qua')} tieuDe={t('PA hiệu quả')} />
            </ODai>
          )}
          {/* Chủ SP 23/10: thi thật (IELTS) RẤT quan trọng — % Pass Target + Fail · Pass · Exceed (bấm → danh sách có điểm). */}
          {ft && d?.thiThat.k !== 'na' && (
            <ODai nhan={t('Kết quả thi thật')} phu={thi ? null : t('chưa có dữ liệu trong kỳ')}>
              {thi && (
                <span className="inline-flex flex-wrap items-baseline gap-x-3">
                  <PhanTram gon x={tyLeGv(thi)} nguon={nguonCs('thi-that')} tieuDe={t('Kết quả thi thật')} />
                  <BaThi cot="thi-that" fail={thi.tong - thi.dung} pass={thi.dung} exceed={d!.thiThatVuot} nguonCua={nguonCs} ten={t('Kết quả thi thật')} motDong />
                </span>
              )}
            </ODai>
          )}
        </DaiChiSoMong>
        <span className="flex items-center gap-2 max-sm:w-full">
          {coKhung.size > 1 && <CongTac v8 value={khung} onChange={(k) => setChon(k)} muc={[['ft', 'Fast Track'], ['thuong', t('Lớp thường')]]} />}
          <NutLuat label={t('Học thuật')} phai>
            {t('Test (MT, Progress, Final — không gồm thi thật): theo quy tắc Overall, một lượt = một lượt Test của một HV × kỹ năng GV dạy, gán theo lớp em học lúc Test. Tiến bộ: lượt có điểm cao hơn lượt MT trước của chính HV ở cùng kỹ năng (Fast Track). Thi thật (IELTS): mỗi HV × kỹ năng GV từng dạy em, so Target overall — Pass = bằng hoặc trên Target, Exceed = trên Target. Bảng lớp: lớp khai giảng lâu nhất lên đầu, rồi lớp đáng lo; lớp đã kết thúc ở cuối.')}
          </NutLuat>
        </span>
      </div>
      <Card bodyClass="p-0 o-so-hop">
        {cs.error ? <ErrorState message={cs.error.message} hint={cs.error.hint} status={cs.error.status} onRetry={cs.reload} />
          : !d ? <Skeleton rows={3} className="p-4" />
          : (
            <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <BangKyNang id={data.gv.id} d={d} ky={ky} khung={khung} />
              <BangLop data={data} d={d} ky={ky} khung={khung} />
            </div>
          )}
      </Card>
    </div>
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
    ...(ft ? [{ key: 'thi', nhan: t('Kết quả thi thật'), kieu: 'chu', rong: 150, goiY: `${t('Chưa đạt')} · ${t('Đạt Target')} · ${t('Vượt')}` } as CotBang] : []),
  ];
  const oCua = (h: HangKn, c: CotBang): ReactNode => {
    const cot = `ket-qua:${khung}:${h.skill}`;
    /* Cột "chu" linh hoạt: chữ trong chip thẳng mép chữ tiêu đề (cùng cách `th[data-kieu=chip]` đệm 20 px). */
    if (c.key === 'kn') return <span className={dienThoai ? '' : '-ml-2 inline-flex'}><ChipKy k={dich(h.nhan)} /></span>;   // SUA-DO-KHUNG: chip min-w 24 canh giữa → chữ lùi ~8 px, bù 8 (g1)
    if (c.key === 'kq') return <OTyLe x={h.kq && { dat: h.kq.dung, mau: h.kq.tong }} nguon={nguonCs(cot)} tieuDe={`${c.nhan} · ${dich(h.nhan)}`} />;
    if (!h.thi) return <span className="text-slate-500">—</span>;
    return <BaThi gon={!dienThoai} motDong={!dienThoai} cot={`thi-that-ky:${h.skill}`} fail={h.thi.tong - h.thi.dung} pass={h.thi.dung} exceed={h.vuot} nguonCua={nguonCs} ten={`${t('Kết quả thi thật')} ${dich(h.nhan)}`} />;
  };
  return (
    <KhungBang ten={t('Theo kỹ năng')} phai={ft && hang.some((h) => h.thi) && (
      /* Chú giải ký hiệu thi thật vào ⓘ (CHU-GIAI 07/11) — ô bảng chỉ còn ký hiệu + số. */
      <NutLuat label={t('Ký hiệu')} phai><span className="flex gap-2.5 font-semibold"><span className={MAU_THI.chua}>▼ {t('Chưa đạt')}</span><span className={MAU_THI.dat}>▲ {t('Đạt Target')}</span><span className={MAU_THI.vuot}>★ {t('Vượt')}</span></span></NutLuat>
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
    { key: 'tt', nhan: t('Thi thật'), kieu: 'chu', rong: RONG_TL, goiY: `${t('Kết quả thi thật')} · % Pass Target` },
  ] : [
    { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 128 },
    { key: 'ky', nhan: t('Kỹ năng'), kieu: 'chu' },
    { key: 'luot', nhan: t('Bài Test trong kỳ'), kieu: 'chu', rong: 168 },
    { key: 'kq', nhan: t('Đạt Test'), kieu: 'chu', rong: RONG_TL },
  ];
  const oCua = (h: HangL, c: CotBang): ReactNode => {
    const mo = h.xong ? 'text-faint' : '';   // AUDIT-UI C11: lớp đã kết thúc = chữ mờ bằng màu (không opacity) + nhãn «đã kết thúc»
    switch (c.key) {
      case 'lop': return h.cong ? <b className="font-bold">{h.ma}</b>
        : <span className={`inline-flex min-w-0 items-baseline gap-1.5 ${mo}`}><Link to={`/hoc-vien/lop/${h.classId}`} className="ten-ho-so truncate font-semibold">{h.ma}</Link>{h.xong && <span className="text-xs text-slate-500">{t('đã kết thúc')}</span>}</span>;
      case 'ky': return <span className={`flex gap-1 ${dienThoai ? '' : '-ml-1.5'} ${mo}`}>{h.kyNang.map((k) => <ChipKy key={k} k={dich(k)} />)}</span>;
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

// ------------------------------------------------------------------ Việc đang tồn (tab Việc & Case, cột phải)

/**
 * VIỆC ĐANG TỒN — bảng nhỏ (H3 / H4 / H7b, lời 37 thay XM-8): Nhóm › (đổi trang Công việc đúng nhóm, như cũ) · Việc (hộp) · Quá hạn (hộp đỏ) + hàng Tất cả.
 * GD-15 (GD-4c D3): hộp số mở panel TẠI CHỖ (`/giao-vien/:id/o?cot=viec&nhom=…[&qh=1]`) — máy chủ đọc khi bấm, cùng dòng với số đếm.
 * Tính tới hôm nay, không theo kỳ.
 */
type HangViec = NhomSo & { tong?: true };
function KhoiViec({ gvId, nguoiXem, homNay, viec }: { gvId: number; nguoiXem: { userId: number; laQuanLy: boolean }; homNay: string; viec: ApiViec }) {
  const { data, loading, error, reload } = viec;
  const ds = data?.viec ?? [];
  const hang: HangViec[] = ds.length > 1 ? [...ds, { nhom: ds[0].nhom, n: ds.reduce((a, x) => a + x.n, 0), quaHan: ds.reduce((a, x) => a + x.quaHan, 0), tong: true }] : ds;
  const ten = (h: HangViec) => (h.tong ? t('Tất cả') : dich(NHOM_VIEC_LABEL[h.nhom]));
  const loc = (h: HangViec) => (h.tong ? '' : `&nhom=${h.nhom}`);
  const oCua = (h: HangViec, c: CotBang): ReactNode => {
    if (c.key === 'nhom') {
      return h.tong ? <b className="font-bold">{ten(h)}</b>
        : <Link to={duongViecCuaGv(gvId, nguoiXem, h.nhom)} className="font-semibold text-slate-100 no-underline hover:text-[color:var(--accent)] hover:underline">{ten(h)} ›</Link>;
    }
    if (c.key === 'viec') return <OSo giaTri={h.n} tieuDe={`${t('Việc đang tồn')} · ${ten(h)}`} nguon={nguon(gvId, `cot=viec${loc(h)}`)} />;
    return <OSo giaTri={h.quaHan} className={h.quaHan ? 'text-bad' : ''} tieuDe={`${t('Việc quá hạn')} · ${ten(h)}`} nguon={nguon(gvId, `cot=viec${loc(h)}&qh=1`)} />;
  };
  return (
    <Card bodyClass="p-0 o-so-hop"
      title={(
        <span className="inline-flex items-center gap-x-1">{t('Việc đang tồn')}
          <NutLuat label={t('Việc đang tồn')}>{t('Tính tới hôm nay ({tuan}), không theo kỳ. Việc lấy từ Công việc — bấm số xem danh sách ngay tại đây; tên nhóm › mở Công việc đúng nhóm. Ý thức & Phối hợp: chỉ việc có hạn.', { tuan: tuanLich(homNay, homNay) })}</NutLuat>
        </span>
      )}>
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>
        : loading || !data ? <Skeleton rows={2} className="p-4" />
        : (
          <Bang ten={t('Việc đang tồn')} khung={false} the375={false} hang={hang} khoa={(h) => (h.tong ? 'tong' : h.nhom)} oCua={oCua} lopHang={(h) => (h.tong ? 'tong' : '')}
            cot={[
              { key: 'nhom', nhan: t('Nhóm'), kieu: 'ten', linhHoat: true },
              { key: 'viec', nhan: t('Việc'), kieu: 'diem', rong: 76 },
              { key: 'qh', nhan: t('Quá hạn'), kieu: 'diem', rong: 92 },
            ]}
            rong={{ tieuDe: t('Không có việc nào') }} />
        )}
    </Card>
  );
}

// ------------------------------------------------------------------ GV-CU-BO-TRO · Em đang bổ trợ

/**
 * Em GV đang dạy PA Bổ trợ miễn phí (chủ SP 13/11, A): tên → hồ sơ HV (Case + ô Mini Test), lớp em đang học, buổi đã dạy / số buổi, hạn Mini Test (viên hạn — H1).
 * Không có em thì không hiện khối (không thêm ô rỗng).
 */
function KhoiBoTro({ ds }: { ds: BoTroHs[] }) {
  if (!ds.length) return null;
  const o = (x: BoTroHs, k: string): ReactNode => {
    if (k === 'ten') return <Link to={duongHoSoHocVien(x.hvId, { caseId: x.caseId, paId: x.paId })} className="ten-ho-so">{x.ten}</Link>;
    if (k === 'buoi') return <span className="tabular-nums text-slate-300">{x.soBuoi ? t('buổi {n}/{m}', { n: x.daDay, m: x.soBuoi }) : '—'}</span>;
    return x.hanMiniTest ? <ChipHan loai="mini-test" han={x.hanMiniTest} vien /> : <span className="text-slate-500">—</span>;
  };
  return (
    <Card title={<span className="inline-flex items-center">{t('Em đang bổ trợ')}<DemDau n={ds.length} /></span>} bodyClass="p-0">
      <Bang ten={t('Em đang bổ trợ')} khung={false} khoa={(x) => x.hvId} hang={ds}
        cot={[
          { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 256 },
          { key: 'buoi', nhan: t('Bổ trợ miễn phí'), kieu: 'chu', linhHoat: true },
          { key: 'han', nhan: 'Mini Test', kieu: 'chu', rong: 180 },
        ]}
        phuCua={(x, k) => (k.key === 'ten' && x.lopMa ? x.lopMa : null)}
        theRieng={(x) => (
          <div className="grid gap-1">
            <div className="flex items-baseline gap-2">{o(x, 'ten')}{x.lopMa && <span className="text-xs text-slate-500">{x.lopMa}</span>}</div>
            <div className="flex items-center gap-3 text-sm">{o(x, 'buoi')}<span className="ml-auto">{o(x, 'han')}</span></div>
          </div>
        )}
        oCua={(x, k) => o(x, k.key)} />
    </Card>
  );
}

// ------------------------------------------------------------------ Case đang phụ trách (tab Việc & Case, khối chính)

/** Việc tiếp của Case → đúng màn của Ngăn Case (cùng màn panel việc Công việc mở) + động từ nút. Không nhận ra → mở Case. */
function manCuaViec(v: ViecTiepCase): { man: ViewCase; nut: string } {
  const c = v.chu;
  if (c === CHU_THEM_PA || c.startsWith(t('Thêm PA'))) return { man: { loai: 'them-pa' }, nut: t('Thêm PA') };
  if (c.startsWith(t('Mô tả Case'))) return { man: { loai: 'ghi-nhan-xet' }, nut: t('Mô tả') };
  if (c.startsWith(t('Xác nhận Case'))) return { man: { loai: 'xac-nhan' }, nut: t('Xác nhận') };
  if (v.paId && c.startsWith(t('Xác nhận PA {tenPaGon}', { tenPaGon: '' }).trim())) return { man: { loai: 'xac-nhan-pa', paId: v.paId }, nut: t('Xác nhận') };
  if (v.paId && v.loaiHan === 'cap-nhat-pa') return { man: { loai: 'ghi-ket-qua', paId: v.paId }, nut: t('Ghi kết quả') };
  return { man: { loai: 'case' }, nut: t('Mở') };
}

/**
 * CASE ĐANG PHỤ TRÁCH (H3): đầu thẻ = tên · số Case (panel) · link Hiệu quả PA (QL); hàng chip: trạng thái (Case quá hạn · Cần làm · Chờ duyệt · Đang làm) │ vạch │
 * chip lọc (Có việc quá hạn · Chưa có PA — chuyển từ ô "Case có PA" của dải cũ); mỗi số → panel đúng nhóm, tại chỗ.
 * "Cần làm trước" = DÒNG VIỆC CHUẨN (lời 24, XM-9): bấm → Ngăn Case mở đúng màn việc ngay tại hồ sơ GV (QL xem cũng mở — làm thay, luật A4); tên em vẫn là link hồ sơ HV.
 */
const CASE_TRUOC = 5;
function KhoiCase({ data, homNay, linkPa, onDoi }: { data: HoSo; homNay: string; linkPa: { den: string; chu: string } | null; onDoi: () => void }) {
  const id = data.gv.id;
  const ds = data.caseMo;
  const [mo, setMo] = useState<{ c: CaseHs; man: ViewCase } | null>(null);
  const viecCua = (c: CaseHs) => viecTiepCuaEm({ nhapDiem: null, cases: [{ caseId: c.id, topic: c.topic, viecTiep: c.viecTiep }], yThuc: null, homNay, chuongTrinh: null })[0] ?? null;
  /* Trạng thái theo thứ tự gấp: Quá hạn · Cần làm · Chờ duyệt · Đang làm (chỉ nhóm có Case). */
  const nhom = (['qua-han', 'can-lam', 'cho-duyet', 'dang-lam'] as const).map((tt) => ({ tt, n: ds.filter((c) => c.trangThai.t === tt).length })).filter((x) => x.n > 0);
  const coViecQh = ds.filter((c) => c.quaHan).length;
  const chuaPa = ds.filter((c) => !c.coPa).length;
  const truoc = ds.filter((c) => c.viecTiep).slice(0, CASE_TRUOC);
  const chip = (key: string, chu: string, n: number, q: string, xau: boolean) => (
    <span key={key} className={`${CHIP_TRON} min-h-[30px] gap-1.5 border ${xau ? 'bg-late-bg text-late' : 'bg-muted-bg text-slate-300'}`} style={{ borderColor: xau ? 'var(--os-do-vien)' : 'var(--line)' }}>
      {chu}
      <OSo giaTri={n} tieuDe={`Case · ${chu}`} nguon={nguon(id, q)} className={`${vung} font-bold ${xau ? 'text-late' : 'text-slate-100'}`} />
    </span>
  );
  return (
    <Card bodyClass="p-0"
      title={(
        <span className="inline-flex flex-wrap items-center gap-2">{t('Case đang phụ trách')}
          {ds.length > 0 && <span className="o-so-hop text-[13px]"><OSo giaTri={ds.length} tieuDe={t('Case đang phụ trách')} nguon={nguon(id, 'cot=case-mo')} /></span>}
        </span>
      )}
      action={linkPa ? <Link to={linkPa.den} className="link whitespace-nowrap py-2 -my-2 text-xs">{linkPa.chu}</Link> : undefined}>
      {!ds.length ? <div className="p-4"><Empty title={t('Không có Case nào đang mở.')} /></div> : (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
            {nhom.map((x) => chip(x.tt, x.tt === 'qua-han' ? t('Case quá hạn') : dich(NHAN_TRANG_THAI[x.tt]), x.n, `cot=case-mo&tt=${x.tt}`, x.tt === 'qua-han'))}
            {(coViecQh > 0 || chuaPa > 0) && nhom.length > 0 && <span aria-hidden className="mx-1 h-5 w-px bg-[color:var(--line-strong)] max-sm:hidden" />}
            {/* V4 GIỮ: Case có việc tiếp quá hạn (khác nhãn trạng thái) → panel. */}
            {coViecQh > 0 && chip('co-viec-qh', t('Có việc quá hạn'), coViecQh, 'cot=case-qua-han', true)}
            {/* GD-14 / GD-15: "Case có PA" % của dải cũ → chip "Chưa có PA" (một tên với Tổng quan), panel `case-chua-pa`. */}
            {chuaPa > 0 && chip('chua-pa', t('Chưa có PA'), chuaPa, 'cot=case-chua-pa', false)}
          </div>
          {truoc.length > 0 && (
            <div className="pb-1">
              <h3 className="m-0 px-4 pb-1 pt-3 text-[13px] font-semibold text-slate-400">{t('Cần làm trước')}</h3>
              <ul className="m-0 list-none p-0">
                {truoc.map((c) => {
                  const v = viecCua(c);
                  const vt = c.viecTiep!;
                  const { man, nut } = manCuaViec(vt);
                  const [chinh, ...phu] = (v?.viec ?? dich(vt.chu)).split(' · ');
                  const moViec = () => setMo({ c, man });
                  return (
                    <li key={c.id} onClick={moViec}
                      className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t px-4 py-2.5 hover:bg-[color:var(--surface-2)] sm:grid-cols-[minmax(0,1fr)_150px_120px]"
                      style={{ borderColor: 'var(--line)' }}>
                      <span className="flex min-w-0 items-start gap-3">
                        <span aria-hidden className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]"><IconNhom k="ca-lop" /></span>
                        <span className="min-w-0">
                          <button type="button" className="block max-w-full truncate border-0 bg-transparent p-0 text-left text-[15px] font-medium text-slate-100 hover:text-[color:var(--accent)]"
                            onClick={(e) => { e.stopPropagation(); moViec(); }} title={v?.title}>
                            {[c.maLop, chinh].filter(Boolean).join(' · ')}
                          </button>
                          <span className="mt-[3px] flex min-w-0 flex-wrap items-center gap-[3px] text-xs font-medium text-dim">
                            <Link to={duongHoSoHocVien(c.studentId, { caseId: c.id })} onClick={(e) => e.stopPropagation()}
                              className="h-5 rounded-md px-1.5 leading-5 text-dim no-underline hover:underline" style={{ background: 'var(--surface-2)' }}>{c.hocVien}</Link>
                            <span className="inline-flex h-5 min-w-0 max-w-full items-center rounded-md px-1.5" style={{ background: 'var(--surface-2)' }}>
                              <TenCase c={{ title: dich(c.tieuDe), tenSos: c.tenSos && { ...c.tenSos, giua: dich(c.tenSos.giua) } }} />
                            </span>
                            {phu.map((x) => <span key={x} className="h-5 rounded-md px-1.5 leading-5" style={{ background: 'var(--surface-2)' }}>{x}</span>)}
                          </span>
                        </span>
                      </span>
                      <span className="max-sm:col-start-1 max-sm:row-start-2 max-sm:pl-10">{vt.loaiHan && vt.han ? <ChipHan loai={vt.loaiHan} han={vt.han} vien /> : null}</span>
                      <button type="button" className="btn btn-sm justify-center max-sm:hidden" onClick={(e) => { e.stopPropagation(); moViec(); }}>{nut}</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
      {mo && (() => {
        /* H5 (lời 36): "Việc tiếp ›" = dòng Cần làm trước kế tiếp (danh sách lúc mở), cùng Ngăn Case. */
        const sau = truoc[truoc.findIndex((c) => c.id === mo.c.id) + 1];
        return (
          <NganCase key={mo.c.id} caseId={mo.c.id} viecBanDau={mo.man} paViec={mo.c.viecTiep?.paId ?? null} hocVien={mo.c.hocVien} lop={mo.c.maLop}
            onClose={() => setMo(null)} onChanged={onDoi}
            onTiep={sau?.viecTiep ? () => setMo({ c: sau, man: manCuaViec(sau.viecTiep!).man }) : null} />
        );
      })()}
    </Card>
  );
}

// ------------------------------------------------------------------ Yêu cầu đã gửi (tab Việc & Case, cột phải)

/** YÊU CẦU ĐÃ GỬI — bảng nhỏ (lời 37): Chờ duyệt (Số · Quá hạn hộp đỏ) · Bị từ chối · 60 ngày qua (Số); mọi hộp → panel tại chỗ. Link "Yêu cầu của tôi ›" / "Chờ duyệt ›" GIỮ. */
type HangYc = { key: 'cho' | 'tu-choi'; ten: string; n: number; qh: number | null };
function KhoiYeuCau({ data, coDuyet, coYeuCau }: { data: HoSo; coDuyet: boolean; coYeuCau: boolean }) {
  const { gv, yeuCau: y } = data;
  const id = gv.id;
  const link: ReactNode = gv.laChinhMinh
    ? coYeuCau ? <Link to="/cong-viec/yeu-cau" className="link text-xs">{t('Yêu cầu của tôi ›')}</Link> : null
    : coDuyet ? <Link to="/cong-viec?nhom=duyet" className="link text-xs">{t('Chờ duyệt ›')}</Link> : null;
  const hang: HangYc[] = [
    { key: 'cho', ten: t('Chờ duyệt'), n: y.cho, qh: y.choQuaHan },
    { key: 'tu-choi', ten: t('Bị từ chối · 60 ngày qua'), n: y.tuChoi, qh: null },
  ];
  const oCua = (h: HangYc, c: CotBang): ReactNode => {
    if (c.key === 'ten') return <span className="whitespace-normal font-semibold text-slate-100">{h.ten}</span>;
    if (c.key === 'so') return <OSo giaTri={h.n} tieuDe={h.key === 'cho' ? t('Yêu cầu đang chờ duyệt') : t('Yêu cầu bị từ chối trong 60 ngày')} nguon={nguon(id, h.key === 'cho' ? 'cot=yc-cho' : 'cot=yc-tu-choi')} />;
    return h.qh === null ? null : <OSo giaTri={h.qh} className={h.qh ? 'text-bad' : ''} tieuDe={t('Yêu cầu quá hạn duyệt')} nguon={nguon(id, 'cot=yc-cho&qh=1')} />;
  };
  return (
    <Card title={gv.laChinhMinh ? t('Yêu cầu đã gửi') : t('Yêu cầu {ten} đã gửi', { ten: gv.ten.split(' ').pop() ?? gv.ten })} action={link} bodyClass={y.cho === 0 && y.tuChoi === 0 ? 'p-4' : 'p-0 o-so-hop'}>
      {y.cho === 0 && y.tuChoi === 0 ? <p className="m-0 text-sm text-slate-400">{t('Không có yêu cầu nào đang chờ.')}</p> : (
        <Bang ten={t('Yêu cầu đã gửi')} khung={false} the375={false} hang={hang} khoa={(h) => h.key} oCua={oCua}
          cot={[
            { key: 'ten', nhan: t('Yêu cầu'), kieu: 'ten', linhHoat: true },
            { key: 'so', nhan: t('Số'), kieu: 'diem', rong: 76 },
            { key: 'qh', nhan: t('Quá hạn'), kieu: 'diem', rong: 92 },
          ]} />
      )}
    </Card>
  );
}
