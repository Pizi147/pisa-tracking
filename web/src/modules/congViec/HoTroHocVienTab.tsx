import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate, theHe } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useSoViecCuaToi } from '../../lib/viecCuaToi.ts';
import { useManHinh } from '../../ui/TheDong.tsx';
import { BoLocDoan, Card, ChonDangNut, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { COT_VIEC, DaiNhom, DaiXongDong, DanhSachViec, tenBoEm } from './DanhSachViec.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { LOP_DA_LUU, TheMuc, Trich, TruongDoc } from '../../ui/KhuonViec.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { mucSosTheoNhan } from '../../lib/format.ts';
import { ketQuaGanNhat } from '../yThuc/CaseSosControls.tsx';
import type { CaseDetail } from '../cases/CasePanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { CreateTask } from '../worklist/MgmtTasksPage.tsx';
import { HopChoDuyet } from '../duyet/HopChoDuyet.tsx';
import { YeuCauCuaToi } from '../duyet/YeuCauCuaToi.tsx';
import { LopCuaToi, dungLopCuaToi, type TestSapToi } from './LopCuaToi.tsx';
import { SapToi, type SapToiGv } from './SapToi.tsx';
import { PaDangChayKhoi, viecPdcTheoKhoa } from './PaDangChay.tsx';
import { NutTask } from './NutTask.tsx';
import { HvCuaToi, type EmTvv } from './HvCuaToi.tsx';
import { DaiChiSoTvv, type ChiSoTvv } from '../worklist/TongQuanV5.tsx';
import { ChonPhuTrach } from './ChonPhuTrach.tsx';
import { CongTacKhung, khungDaNho, nhoKhung, phamViCoHaiKhung, type KhungLoc } from '../../ui/CongTacKhung.tsx';
import { DauViecCongViec, KhungTaiCho, NhanTruongDam, boChuRoi } from '../../ui/KhungPanel.tsx';
import { PanelViec } from './PanelViecLuoi.tsx';
import { lazyHop } from '../../ui/lazyHop.tsx';
import { BaoDaGiao, lamMoiGiaoViec } from './KhoiGiaoViec.tsx';
import type { DongTd } from './TabTheoDoi.tsx';
/* GV-2: tab "Đang theo dõi" — mảnh riêng, tải khi mở tab (cùng lúc gọi `/my-work/theo-doi`). */
const DsTheoDoi = lazyHop(() => import('./TabTheoDoi.tsx').then((x) => x.DsTheoDoi));
const PanelTheoDoi = lazyHop(() => import('./TabTheoDoi.tsx').then((x) => x.PanelTheoDoi));
import { lamTaiCho, moCaDong, soCuaKhoa } from './lamTaiCho.ts';
import { NganCase } from '../students/NganCaseLuoi.tsx';
import { BaoHoanTac, DaiVuaLuu, ViecVuaLuu, type DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { HopGiaHan } from '../students/HopGiaHan.tsx';
import { NutXuatLopBc } from '../classes/TabBaoCaoPh.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import {
  LOC_NHANH_LABEL, NHOM_VIEC_LABEL, demLocNhanh, khoaGopCua, khopLocNhanh, nhomViecCua, NHOM_CV_TVV, TAB_CV, tabCuaViec, nhanTabCv, dongTab, chiaMucTab, badgeTab, tabMacDinh,
  LOC_NHANH, viecKeTiepVong, chenTheoViTri, choDaiVuaLuu, soMucPanel, type LocNhanh, type BadgeTab, demDongViec, laViecChamCheo, shortDate, chiaVachHan,
  LOC_NGUOI_VIEC, LOC_NGUOI_VIEC_LABEL, LOAI_HAN_CUA_VIEC, INTERVENTION_KIND_LABEL, NHOM_CV_TVV_LABEL, nhomViecTvvCua, khopNguoiViec, dongCuaToi, type DemYeuCau, type LocNguoiViec,
  NHAN_LOAI_VIEC, chenHan, demBai, type PaDangChay,
} from '@shared/domain/index.ts';
import { dich, dichDu, t } from '@shared/i18n/index.ts';

type Work = {
  summary: { total: number; overdue: number; today: number; mine: number };
  /** PR-GOP (§5): `dong` = dòng hiển thị (một lớp × một loại việc). PR-VN3: route không còn trả `items`, `groups`. S11: số trên màn đếm DÒNG (`demDongViec`). */
  dong: (WorkItem & { lamThay?: boolean })[]; scopeEmpty: boolean; xemNguoiKhac?: boolean;
  /** V5 SV-SO1: xem việc của một GV khác = chế độ theo dõi. */
  chiXem?: boolean;
  /** BO-QUA-XEP-MT: việc QL đã bỏ qua (chỉ QL / Quản trị; không có = rỗng) — khu "Đã bỏ qua" cuối danh sách, khôi phục được. */
  daBoQua?: ViecDaBoQua[];
  /** CV-TAB b: chi nhánh của các việc khi > 1 (GV dạy liên chi nhánh) — dải chọn + thẻ CN. */
  chiNhanh?: { id: number; code: string; name: string }[];
  /** CV-TAB b: QL xem một GV — chi nhánh GV còn việc nhưng ngoài phạm vi người xem (việc ở đó không hiện). */
  cnAn?: string[];
  /** LG-8: "Test sắp tới" từng lớp GV đang dạy (chỉ vai GV) — cột Test của "Lớp của tôi". */
  testSapToi?: TestSapToi[];
  /** GD-21 (LG-13 H7): việc CHƯA sinh trong 7 ngày (PA tới kỳ · đợt Báo cáo PH sắp mở) — dòng "Sắp tới"; không có thì không có khoá. */
  sapToi?: SapToiGv;
  /** TU2-4 (TU8, TU9): PA đang chạy chưa tới hạn người xem giữ — khối "PA đang chạy"; không phải việc (không vào số việc / badge / chuông). Không có thì không có khoá. */
  paDangChay?: PaDangChay[];
};
type ViecDaBoQua = { key: string; tieuDe: string; studentId: number; studentName: string; classCode: string | null; boi: string | null; luc: string };


/** OV-15d: `nguoi` = `toi` · `gv` · `tat-ca` · id một GV. */
const thamSoNguoi = (s: string | null): LocNguoiViec | number => {
  if (s === 'toi' || s === 'gv') return s;
  if (s && /^[1-9]\d*$/.test(s)) return Number(s);
  return 'tat-ca';
};
/** DON-HINH (chủ SP 30/10): QL không có `nguoi` trên URL → lựa chọn đã nhớ trong phiên, chưa có thì "Của tôi". Link cần tất cả tự ghi `nguoi=tat-ca`. */
const khoaNguoi = (uid: number | undefined) => `pisa.cong-viec.nguoi.u${uid ?? ''}`;
const nguoiDaNho = (uid: number | undefined) => { try { return sessionStorage.getItem(khoaNguoi(uid)); } catch { return null; } };
const nhoNguoi = (uid: number | undefined, k: string) => { try { sessionStorage.setItem(khoaNguoi(uid), k); } catch { /* không lưu được: lần sau về mặc định */ } };
const MAN_HEP = '(max-width: 1023px)';
/** Vùng cuộn của trang là `<main id="noi-dung">` (App.tsx), không phải cửa sổ. */
const vungCuon = () => document.getElementById('noi-dung');
/** Mọi việc của danh sách — dòng và từng em trong dòng gộp. */
const phang = (ds: readonly WorkItem[]) => ds.flatMap((x) => [x, ...(x.con ?? [])]);
/* VIEC-XONG-AN: dải "✓ Đã lưu" ở chỗ dòng vừa xong — 4 giây; panel có đường đảo thì bằng thời gian Hoàn tác (10 giây, `useHoanTac`). */
const DAI_XONG_MS = 4_000;
const DAI_HOAN_TAC_MS = 10_000;
type DaiXong = { het: number; hoanTac?: () => Promise<void>; hoan?: boolean };

/**
 * CÔNG VIỆC › HỖ TRỢ HỌC VIÊN — LÀM TẠI CHỖ (OV-5a, đặc tả OV mục 4, mockup M1 §1–§2).
 *
 * Lọc HAI TẦNG: hàng chính Của tôi / Của GV (QL, Quản trị) · hạn có số · Chi nhánh; "Lọc thêm" (Chương trình · Nhóm việc · Của một GV, số bộ lọc
 * đang bật). Dòng phạm vi luôn hiện ("Đang xem: … · n việc · m học viên") + Xoá lọc. Mọi bộ lọc + việc đang mở (`viec`) nằm trên URL.
 *
 * Danh sách trái (560 px) · panel phải xử lý việc đang chọn (`PanelViec`, panel sẵn có đặt tại chỗ qua `KhungTaiCho`); bấm việc khác → panel đổi.
 * Lưu xong: dải "✓ Đã lưu · Hoàn tác" phủ đúng chỗ dòng vài giây rồi dòng rời danh sách (VIEC-XONG-AN); panel giữ; chỉ "· việc tiếp ›" chuyển việc. Số đếm chỉ từ
 * `/my-work` (cùng badge). Điện thoại (< 1024 px): bấm việc → màn đầy đủ có "‹ Công việc", về đúng chỗ cuộn cũ. Chốt lộ trình / Kết quả đầu ra
 * và việc chưa có panel mở trang như cũ.
 */
export function HoTroHocVienTab() {
  const { session } = useSession();
  const navigate = useNavigate();
  /* M6 6b-3: view Case trong panel việc là mục lịch sử `?panel=case` (`panelSau` = số mục đã push) — đóng / đổi việc tính cả các mục đó. */
  const { state: stLs } = useLocation();
  const [params, setParams] = useSearchParams();
  const macDinh = useChiNhanhMacDinh();
  /* AUDIT-UI B6: `cn=tat-ca` (link "n yêu cầu ở chi nhánh khác · Xem ›", đường cũ của Hộp duyệt) = mọi chi nhánh trong quyền. */
  const branchId = params.get('cn') === 'tat-ca' ? null : params.get('cn') ? Number(params.get('cn')) : macDinh;
  /* PR-OV2a: Admin (`nav.workChamDiem`) xem việc Chấm điểm của GV như Quản lý, chỉ nhóm đó (OV-12h bỏ Nhắc). */
  const chiChamDiem = !!session?.nav?.workChamDiem;
  /* N52: CX xem mọi việc trong phạm vi như QL (Của tôi / Của GV / Tất cả). N63 ④: CX có việc riêng (Kết quả meeting, việc được giao) → mặc định "Của tôi";
     không có → "Tất cả". Số = `summary` badge App đã nạp (cùng đường "Của tôi" — chưa về thì mở "Của tôi", GET gộp với badge, không request thêm). */
  const laCx = !!session?.nav?.workCx && !session?.nav?.workOps;
  const laQuanLy = !!session?.nav?.workOps || chiChamDiem || laCx;
  const uid = session?.user?.id;
  const soCuaToi = useSoViecCuaToi();
  const macDinhCx = soCuaToi && !soCuaToi.viec ? 'tat-ca' : 'toi';
  const nguoi = laQuanLy ? thamSoNguoi(params.get('nguoi') ?? (chiChamDiem ? null : laCx ? nguoiDaNho(uid) ?? macDinhCx : nguoiDaNho(uid) ?? 'toi')) : 'tat-ca';
  /* UI-CV-TVV (mockup `tvv.html`): TVV — chỉ việc của mình, chia nhóm theo việc TVV (Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ). */
  const laTvv = !laQuanLy && !!session?.nav?.hvCuaToi;
  const hep = useManHinh('(max-width: 639px)');
  const loc: LocNhanh = (LOC_NHANH as readonly string[]).includes(params.get('loc') ?? '') ? (params.get('loc') as LocNhanh) : 'tat-ca';
  /* CV-TAB (chủ SP 06/11): tab hạng mục ở `nhom=` (tham số sẵn có — link Tổng quan / chuông / Quay lại cũ vẫn đúng); link `loai=` (một loại việc) → tab chứa loại đó. */
  const tabUrl = params.get('nhom') ?? (params.get('loai') ? (laTvv ? nhomViecTvvCua : nhomViecCua)(params.get('loai')!) : null);
  /* OV-11f (TQ-2): `loai=` (từ Tổng quan, vd "PA chưa có Kết quả") lọc ĐÚNG loại việc — số ở ô = số việc nơi mở; đổi nhóm / Xoá lọc thì bỏ. */
  const loai = !params.get('nhom') && params.get('loai') ? params.get('loai') : null;
  const viec = params.get('viec');
  /* AUDIT-1611 P1-07: `lop=` (từ ô "Quá hạn của lớp" / "Chờ chấm" ở hồ sơ lớp của QL) — chỉ việc của lớp đó (dòng gộp nhiều lớp giữ khi có lớp đó); chip ✕ bỏ. */
  const lopLoc = Number(params.get('lop')) || null;

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  /*
   * CV-TAB b (chủ SP 06/11): GV (Của tôi) dạy nhiều chi nhánh — `/my-work` không lọc chi nhánh (một lần nạp), dải "Tất cả chi nhánh · {CN}…" lọc TẠI MÁY
   * (`cn=` trên địa chỉ), mặc định Tất cả. QL / Admin / QT giữ ô Chi nhánh gửi máy chủ như cũ.
   */
  const laGvThuong = !laQuanLy && !laTvv;
  const cnUrl = laGvThuong && params.get('cn') ? Number(params.get('cn')) : null;
  const qs = new URLSearchParams();
  if (branchId && !laGvThuong) qs.set('branchId', String(branchId));
  /* GV không gửi `nguoi` — `/my-work` không tham số giữ NGUYÊN hành vi cũ (Q3). OV-15d: QL đọc "tất cả" MỘT lần, Của tôi / Của GV lọc tại máy (cùng danh sách, cùng số). */
  /* DEM-VIEC (chủ SP 18/11): "Của tôi" đọc đường "của tôi" của máy chủ — CÙNG đường badge / ô Tổng quan (`useDuongViecCuaToi`, cùng chi nhánh mặc định) nên số = số dòng,
     không GET thêm; "Của GV" / "Tất cả" đọc `nguoi=tat-ca` (lọc tại máy như OV-15d). */
  if (laQuanLy && nguoi !== 'toi') qs.set('nguoi', typeof nguoi === 'number' ? String(nguoi) : 'tat-ca');
  const url = `/my-work${qs.toString() ? `?${qs}` : ''}`;
  const { data, loading, error, reload, cu } = useApi<Work>(url, [url], { giuCu: true });

  const { homNay } = useNgayNghiepVu();
  /*
   * MH4, K1-30 (Q3): khung (nay là "Chương trình" ở Lọc thêm), mặc định Tất cả. Tham số `khung` trên đường dẫn thắng, rồi lựa chọn đã nhớ trên máy.
   * Việc không gắn lớp (`khung` null) hiện ở mọi khung. Lọc khung đứng TRƯỚC mọi bộ lọc khác, nên số trên chip hạn / nhóm đếm theo khung.
   */
  const khungUrl = params.get('khung');
  const khungChon: KhungLoc = khungUrl === 'ft' || khungUrl === 'thuong' || khungUrl === 'tat-ca' ? khungUrl : khungDaNho('cong-viec') ?? 'tat-ca';
  /* BO-QUA-XEP-MT: việc vừa bấm Bỏ qua ẩn NGAY (trước khi tải lại xong); Hoàn tác bỏ khoá khỏi tập. */
  const [anTam, setAnTam] = useState<ReadonlySet<string>>(new Set());
  const dsGoc = useMemo(() => {
    const ds = data?.dong ?? [];
    if (!anTam.size) return ds;
    return ds.flatMap((x) => {
      if (anTam.has(x.key)) return [];
      if (!x.con) return [x];
      const con = x.con.filter((c) => !anTam.has(c.key));
      return con.length === x.con.length ? [x] : con.length ? [{ ...x, con }] : [];
    });
  }, [data, anTam]);
  /* RA-LOI-0711d: `cn=` chỉ lọc khi chi nhánh đó còn trên dải — làm hết việc một CN (dải ẩn) hay mở địa chỉ cũ thì không giấu việc CN khác. */
  const cnLoc = cnUrl != null && (data?.chiNhanh ?? []).some((b) => b.id === cnUrl) ? cnUrl : null;
  /* Nguồn đang xem (người · chi nhánh) — một điều kiện cho danh sách và dòng giữ chỗ vừa xong. */
  const trongNguon = (it: WorkItem) => (typeof nguoi === 'number' || khopNguoiViec(it, nguoi))
    /* Việc không gắn lớp (`cn` null) hiện ở mọi chi nhánh (như khung — không bao giờ giấu việc). */
    && (cnLoc == null || it.cn == null || it.cn === cnLoc);
  const tatCaViec = useMemo(() => dsGoc.filter(trongNguon), [dsGoc, nguoi, cnLoc]);   // eslint-disable-line react-hooks/exhaustive-deps
  const dsCn = laGvThuong ? data?.chiNhanh ?? [] : [];
  const maCn = useMemo(() => new Map(dsCn.map((b) => [b.id, b.code])), [dsCn]);
  /* RA-LOI-0711i: số trên dải chi nhánh = cùng bộ lọc với số đầu trang (người · khung · loại việc), chỉ khác chi nhánh — "Tất cả" = số đầu trang. */
  const demCn = (id: number | null) => demDongViec(theoKhung(dsGoc.filter((it) => (typeof nguoi === 'number' || khopNguoiViec(it, nguoi))
    && (id == null || it.cn == null || it.cn === id)))).n;
  /* S11: số trên công tắc khung đếm DÒNG (`demDongViec`), cùng đơn vị đầu nhóm. */
  const demKhung = useMemo(() => ({
    ft: demDongViec(tatCaViec.filter((it) => it.khung === 'ft')).n,
    thuong: demDongViec(tatCaViec.filter((it) => it.khung === 'thuong')).n,
  }), [tatCaViec]);
  /* Phạm vi chỉ một khung (UX-2: theo lớp trong phạm vi, không theo việc đang có) thì công tắc ẩn — khi đó không lọc. */
  const haiKhung = (demKhung.ft > 0 && demKhung.thuong > 0) || phamViCoHaiKhung();
  const khung: KhungLoc = haiKhung ? khungChon : 'tat-ca';

  /*
   * OV-5a: DÒNG ĐÃ LÀM — panel báo "đã lưu" thì nhớ bản dòng lúc đó (`giu`: panel đứng nguyên, lọc "Xong hôm nay"). VIEC-XONG-AN (chủ SP 21/11): ở danh sách
   * việc cần làm, dòng máy chủ không còn trả chỉ đứng lại NGẮN dưới dạng dải "✓ Đã lưu · Hoàn tác" (`dai`, hết giờ thì ẩn) — không còn dòng gạch ở lại.
   * Chỉ để nhìn: mọi số đếm dưới đây đọc `tatCaViec` (máy chủ).
   */
  const [giu, setGiu] = useState<ReadonlyMap<string, WorkItem>>(new Map());
  /* P1-02 (AUDIT-2111): việc vừa giao cho người khác (rời "Của tôi") — panel đứng nguyên với dải "Đã giao cho … · Hoàn tác"; KHÔNG vào `giu` (không "✓ Đã lưu", không "xong hôm nay"). */
  const giaoDi = useRef(new Map<string, WorkItem>());
  const [dai, setDai] = useState<ReadonlyMap<string, DaiXong>>(new Map());
  useEffect(() => { setGiu(new Map()); setDai(new Map()); giaoDi.current.clear(); }, [url]);   // đổi người xem / chi nhánh = nguồn khác: bỏ giữ chỗ của nguồn cũ
  /* Dải hết giờ → bỏ (một hẹn cho dải hết sớm nhất). */
  useEffect(() => {
    if (!dai.size) return undefined;
    const som = Math.min(...[...dai.values()].map((v) => v.het));
    const h = setTimeout(() => setDai((m) => new Map([...m].filter(([, v]) => v.het > Date.now()))), Math.max(0, som - Date.now()) + 30);
    return () => clearTimeout(h);
  }, [dai]);
  const datDai = (k: string, v: Partial<DaiXong>, ms = DAI_XONG_MS) => setDai((m) => new Map(m).set(k, { ...m.get(k), het: Date.now() + ms, ...v }));
  /* Panel đang mở báo đường đảo (`BaoHoanTac`) — dải của việc đó có Hoàn tác, đứng bằng thời gian Hoàn tác; `null` = đã hoàn tác ở panel. */
  const ghiHoanTac = (k: string, f: (() => Promise<void>) | null) => (f ? datDai(k, { hoanTac: f }, DAI_HOAN_TAC_MS)
    : setDai((m) => (m.has(k) ? new Map(m).set(k, { ...m.get(k)!, hoanTac: undefined }) : m)));
  /* RA-LOI-0711d: "còn trên máy chủ" so CẢ danh sách đã nạp (không phải phần đang lọc) — đổi dải chi nhánh / Của tôi ↔ Của GV không biến việc
     chưa xong thành "đã xong"; dòng giữ chỗ chỉ hiện trong đúng nguồn của nó. VIEC-XONG-AN: dòng gộp "tan" (lưu một phần lưới — em còn lại
     thành dòng lẻ) KHÔNG phải xong: máy chủ còn trả việc thuộc khoá gộp đó. */
  const conTrenMayChu = useMemo(() => new Set(phang(dsGoc).flatMap((x) => [x.key, khoaGopCua(x as any) ?? x.key])), [dsGoc]);
  const xong = useMemo(() => new Set([...giu].filter(([k, x]) => !conTrenMayChu.has(k) && trongNguon(x)).map(([k]) => k)),
    [giu, conTrenMayChu, nguoi, cnLoc]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* OV-11c (CV-7): em vừa xong của một dòng gộp (lớp × loại việc) đứng lại TRONG dòng gộp đó (dải), không rơi thành dòng riêng cuối nhóm. */
  const hienThi = useMemo(() => {
    const giuXong = [...giu.values()].filter((x) => xong.has(x.key) && dai.has(x.key));
    const vaoDong = new Map<string, WorkItem[]>();
    const le: WorkItem[] = [];
    for (const x of giuXong) {
      const k = khoaGopCua(x as any);
      if (k && tatCaViec.some((d) => d.key === k && d.con)) vaoDong.set(k, [...(vaoDong.get(k) ?? []), x]);
      else le.push(x);
    }
    const ds = vaoDong.size ? tatCaViec.map((d) => (vaoDong.has(d.key)
      ? { ...d, con: [...d.con!, ...vaoDong.get(d.key)!.map((x) => ({ ...x, conTen: (x as any).conTen ?? x.studentName, conPhu: (x as any).conPhu ?? '' }))] } : d)) : tatCaViec;
    return [...ds, ...le];
  }, [tatCaViec, giu, xong, dai]);

  const cuaLopLoc = (it: WorkItem) => !lopLoc || it.classId === lopLoc || !!it.con?.some((c) => c.classId === lopLoc);
  const theoKhung = (ds: WorkItem[]) => ds.filter((it) => (khung === 'tat-ca' || !it.khung || it.khung === khung) && (!loai || it.group === loai) && cuaLopLoc(it));
  const items = useMemo(() => theoKhung(tatCaViec), [tatCaViec, khung, loai, lopLoc]);   // eslint-disable-line react-hooks/exhaustive-deps
  const locItems = useMemo(() => items.filter((it) => khopLocNhanh(it, loc, homNay)), [items, loc, homNay]);

  /*
   * CV-TAB — HÀNG TAB HẠNG MỤC (mockup `thiet-ke/v17-nhap/`): thứ tự cố định (`TAB_CV`; TVV `NHOM_CV_TVV`), tab rỗng ẩn, "Chờ bạn duyệt" đứng đầu khi có thẻ.
   * Badge (AUDIT-UI B3) = dòng cần làm ngay của tab (quá hạn + hôm nay, như badge menu V13), đếm DÒNG máy chủ đã trả (`items`: khung · loại · người; chưa áp lọc hạn) — dữ liệu đã nạp, không gọi thêm.
   * Tab còn dòng giữ chỗ vừa xong (`giu`) vẫn hiện tới khi đổi nguồn. QL "Việc quản lý" luôn có (Giao việc · Vận hành ›).
   */
  const xemMotGv = typeof nguoi === 'number';
  const demDuyet = useApi<DemYeuCau>(session?.nav?.workApprove && !xemMotGv ? `/yeu-cau/dem${branchId ? `?branchId=${branchId}` : ''}` : null, [branchId, xemMotGv]).data;
  /* V8-CV: panel duyệt (`?the=`, mở từ tab Chờ bạn duyệt) đứng ở cột phải như panel việc — `HopChoDuyet` vẽ vào ô này. */
  const theId = session?.nav?.workApprove && !xemMotGv ? Number(params.get('the')) || null : null;
  const coDuyet = !xemMotGv && (!!demDuyet?.cho || !!theId);
  const coVanHanh = (!!session?.nav?.workOps || !!session?.nav?.vanHanh) && !chiChamDiem;
  const thuTuTab: readonly string[] = laTvv ? NHOM_CV_TVV : TAB_CV;
  const tabCua = (it: WorkItem) => tabCuaViec(it, laTvv);
  const dongCuaTab = (ds: readonly WorkItem[], k: string) => dongTab(ds.filter((x) => tabCua(x) === k), moCaDong);
  /* AUDIT-1611 P1-03: số tab / đầu mục của GV, TVV đếm việc CỦA TÔI (như đầu trang, chuông) — dòng làm thay vẫn vẽ, ghi riêng "· n làm thay". */
  const cuaBan = (ds: readonly WorkItem[]) => (laQuanLy ? ds : dongCuaToi(ds));
  const tenTab = (k: string) => (k === 'theo-doi' ? t('Đang theo dõi') : k === 'duyet' ? t('Chờ bạn duyệt') : k === 'van-hanh' && laQuanLy ? t('Việc quản lý') : nhanTabCv(k, laTvv));
  const tabs = useMemo(() => {
    const conGiu = new Set(theoKhung(hienThi).map(tabCua));
    if (viec && xong.has(viec)) conGiu.add(tabCua(giu.get(viec)!));   // VIEC-XONG-AN: panel còn mở việc vừa xong (dải đã hết) — tab không biến mất dưới panel
    if (viec && giaoDi.current.has(viec)) conGiu.add(tabCua(giaoDi.current.get(viec)!));   // P1-02: panel còn mở việc vừa giao đi
    if (data?.paDangChay?.length) conGiu.add('case-hoc-thuat');   // TU2-4: GV chỉ có PA chưa tới hạn vẫn vào được khối "PA đang chạy"
    /* GD-1 (lời 19): tab "Chấm Speaking" — đủ ngắn, 375 giữ nguyên tên (mockup v21 K8a). */
    /* GD-4a (lời 33): tab Chấm Speaking — badge mờ = số bài (cùng số đầu mục); V22: có bài quá hạn → badge đỏ. */
    const badgeCua = (k: string): BadgeTab => {
      const b = badgeTab(dongCuaTab(cuaBan(items), k));
      if (k !== 'cham-cheo') return b;
      return { ...b, bai: demBai(dongCuaTab(items, k)) };
    };
    const ds = thuTuTab.map((k) => ({ key: k, nhan: tenTab(k), badge: badgeCua(k) as BadgeTab | null }))
      .filter((x) => x.badge!.n > 0 || conGiu.has(x.key) || (x.key === 'van-hanh' && (coVanHanh || !!data?.daBoQua?.length)))
      .map((x) => (x.badge!.n > 0 ? x : { ...x, badge: null }));
    /* GV-2 (N58, mockup v22 G5): "Đang theo dõi" cuối hàng tab, MỌI vai, không số (danh sách chỉ tải khi mở tab). */
    if (data && !data.scopeEmpty) ds.push({ key: 'theo-doi', nhan: tenTab('theo-doi'), badge: null });
    if (!coDuyet) return ds;
    const q = demDuyet?.quaHan ?? 0, cho = demDuyet?.cho ?? 0;
    /* AUDIT-UI B3: badge = yêu cầu cần làm ngay (quá hạn) — 0 thì không vẽ (`BadgeTabSo`); tổng ở đầu tab "n yêu cầu". */
    const bd: BadgeTab | null = cho ? { so: q, n: cho, quaHan: q, homNay: 0, yeuCau: true } : null;
    return [{ key: 'duyet', nhan: tenTab('duyet'), badge: bd }, ...ds];
  }, [items, hienThi, homNay, laTvv, coDuyet, demDuyet, coVanHanh, data, khung, loai, lopLoc, viec, xong]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* Mở trang: tab đầu có việc quá hạn, không có thì tab đầu (`tabMacDinh`); panel duyệt đang mở → tab Chờ bạn duyệt. */
  /* RA-LOI-0711d: mở từ link `?viec=` (chuông, Tổng quan, Giao việc) không kèm `nhom` → tab của chính việc đó, danh sách + Quay lại đúng chỗ. */
  const tabViec = !tabUrl && viec ? (() => { const x = phang(dsGoc).find((y) => y.key === viec); return x ? tabCua(x) : null; })() : null;
  const tab = theId ? 'duyet' : tabs.some((x) => x.key === tabUrl) ? tabUrl
    : tabViec && tabs.some((x) => x.key === tabViec) ? tabViec
      /* AUDIT-1611 A2-12: "Chờ bạn duyệt" là việc của chính QL — xem Của GV / Tất cả thì tab mặc định là tab việc của GV. */
      : tabMacDinh(nguoi === 'toi' ? tabs : tabs.filter((x) => x.key !== 'duyet'));
  /* Ghi tab vào địa chỉ một lần (thay chỗ) — lưu việc làm đổi số quá hạn không làm trang nhảy tab; Quay lại về đúng tab. `loai=` đang lọc thì không ghi (ghi `nhom` = bỏ lọc loại).
     Đếm thẻ duyệt chưa về → chưa ghi (địa chỉ `nhom=duyet` không bị tab mặc định đè). */
  const choDemDuyet = !!session?.nav?.workApprove && !xemMotGv && demDuyet == null;   // DEM-VIEC: useApi trả null khi đang tải — `/my-work` đã nạp (badge) về trước đếm duyệt
  useEffect(() => {
    if (data && tab && !choDemDuyet && tab !== params.get('nhom') && !params.get('loai') && !theId) setParam('nhom', tab);
  }, [data, tab, choDemDuyet]);   // eslint-disable-line react-hooks/exhaustive-deps
  const trongTab = useMemo(() => items.filter((it) => tabCua(it) === tab), [items, tab, laTvv]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* P1 rà 11/11 G5-04 / G1-05: bộ lọc hạn áp CẢ trang (mọi tab, `locItems`) → số trong ô đếm cùng tập với đầu trang "n việc · m quá hạn" (`items`), không riêng tab. */
  const demHan = useMemo(() => demLocNhanh(items, 'tat-ca', homNay), [items, homNay]);
  /* TU2-4: việc dựng từ PA chưa tới hạn (khối "PA đang chạy") đang / vừa mở — không nằm trong `/my-work`; nhớ để panel đứng nguyên khi dữ liệu tải lại (Lưu xong PA rời khối). */
  const pdcMo = useRef(new Map<string, WorkItem>());
  /* `viec` trỏ tới việc không có panel (đường cũ, gõ tay) → như chưa chọn. */
  const chon = useMemo(() => {
    /* DON-HINH: việc mở từ chuông / link có thể không thuộc "Của tôi" — tìm cả danh sách QL đã nạp, không riêng dòng đang lọc. */
    const x = viec ? phang(hienThi).find((y) => y.key === viec) ?? [...giu.values()].find((y) => y.key === viec) ?? phang(dsGoc).find((y) => y.key === viec) ?? pdcMo.current.get(viec) ?? giaoDi.current.get(viec) ?? viecPdcTheoKhoa(data?.paDangChay ?? [], viec, uid ?? null) ?? null : null;
    return x && lamTaiCho(x) ? x : null;
  }, [viec, hienThi, giu, dsGoc, data?.paDangChay]);   // eslint-disable-line react-hooks/exhaustive-deps
  const luoiRong = !!chon && chon.group === 'ghi_ket_qua_pa' && moCaDong(chon);
  /*
   * Danh sách vẽ: cùng bộ lọc, cộng dải dòng vừa xong. VIEC-XONG-AN (chủ SP 21/11 "công việc nhảy liên tục vị trí"; thay OV-11c CV-3 "chỉ khi panel mở"):
   * trong CÙNG bộ lọc (nguồn · khung · hạn · tab · loại) mỗi dòng giữ vị trí lần đầu thấy — lưu xong / làm một phần (hạn đổi) / tải lại / đóng panel
   * không sắp lại; dòng mới chen ngay sau dòng đứng trước nó theo thứ tự hạn (`chiaMucTab`), em còn lại của dòng gộp vừa tan đứng chỗ dòng gộp.
   * Đổi bộ lọc / tải lại trang thì sắp lại từ đầu. Số đầu nhóm (CV-15) chỉ từ máy chủ (`cuoiItems`) — dải chỉ để vẽ.
   */
  const thuTuCu = useRef<{ khoa: string; vt: Map<string, number> } | null>(null);
  const khoaLoc = `${url}|${khung}|${loc}|${tab ?? ''}|${loai ?? ''}`;
  /* Mục của MỌI tab (thứ tự "việc tiếp" đi tiếp sang tab sau) — dòng vẽ = máy chủ + dòng giữ chỗ, cùng lọc hạn. */
  const mucTheoTab = useMemo(() => {
    const hien = theoKhung(hienThi).filter((it) => khopLocNhanh(it, loc, homNay));
    const out = new Map(thuTuTab.map((k) => [k, chiaMucTab(dongCuaTab(hien, k), laTvv, homNay)]));
    const cu = thuTuCu.current;
    if (!cu || cu.khoa !== khoaLoc) {
      thuTuCu.current = { khoa: khoaLoc, vt: new Map([...out.values()].flat().flatMap((m) => m.items).map((x, i) => [x.key, i])) };
      return out;
    }
    /* Dòng chưa thấy: chỗ của dòng gộp nó thuộc (plan mục 4: em cuối của dòng gộp vừa tan), không thì ngay sau dòng đứng trước nó. Ghi lại để lần sau đứng yên. */
    for (const m of [...out.values()].flat()) {
      let truoc = -1;
      for (const x of m.items) {
        const v = cu.vt.get(x.key) ?? cu.vt.get(khoaGopCua(x as any) ?? '') ?? truoc + 1e-6;
        cu.vt.set(x.key, v);
        truoc = v;
      }
    }
    const vt = (x: WorkItem) => cu.vt.get(x.key)!;
    return new Map([...out].map(([k, ds]) => [k, ds.map((m) => ({ ...m, items: [...m.items].sort((a, b) => vt(a) - vt(b)) }))]));
  }, [hienThi, khung, loai, loc, homNay, khoaLoc, laTvv, lopLoc]);   // eslint-disable-line react-hooks/exhaustive-deps
  const mucs = (tab && mucTheoTab.get(tab)) || [];
  /* Số đầu mục chỉ từ máy chủ (`locItems`) — dòng giữ chỗ vừa xong chỉ để vẽ. */
  const demMuc = useMemo(() => {
    if (!tab) return new Map<string, { n: number; quaHan: number; lamThay: number }>();
    const toi = new Map(chiaMucTab(dongCuaTab(cuaBan(locItems), tab), laTvv, homNay).map((m) => [m.key, m] as const));
    return new Map(chiaMucTab(dongCuaTab(locItems, tab), laTvv, homNay).map((m) => {
      const x = toi.get(m.key);
      return [m.key, { n: x?.items.length ?? 0, quaHan: x?.quaHan ?? 0, lamThay: m.items.length - (x?.items.length ?? 0) }] as const;
    }));
  }, [locItems, tab, laTvv]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------ việc đang mở ở panel (URL `viec`)
  /* Thứ tự "việc tiếp": đúng thứ tự đang vẽ; dòng gộp thường đi vào từng em; bỏ việc mở trang. `nhom` = nhóm đang vẽ (CV-05: việc kế cùng nhóm). */
  /* VIEC-XONG-AN (PTA rà #1905): việc đang mở đã rời danh sách (dải hết giờ) vẫn đứng ở vị trí đã nhớ — "Việc tiếp ›" không mất. */
  const thuTu = useMemo(() => {
    const vt = (x: WorkItem) => thuTuCu.current?.vt.get(x.key) ?? thuTuCu.current?.vt.get(khoaGopCua(x as any) ?? '');
    return thuTuTab.flatMap((k) => chenTheoViTri((mucTheoTab.get(k) ?? []).flatMap((m) => m.items)
      .flatMap((x) => (x.con && !moCaDong(x) ? x.con : [x])), chon && tabCua(chon) === k ? chon : null, vt).map((x) => ({ ...x, nhom: k })))
      .filter((x) => lamTaiCho(x));
  }, [mucTheoTab, thuTuTab, chon]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* Địa chỉ (không `viec`) lúc mở panel bằng một bước lịch sử — đóng chỉ lùi khi bộ lọc chưa đổi, không thì mất lựa chọn lọc vừa bấm. */
  const daDay = useRef<string | null>(null);
  const khongViec = (p: URLSearchParams) => { const x = new URLSearchParams(p); x.delete('viec'); x.delete('panel'); return x.toString(); };
  const cuon = useRef(0);
  const mo = (it: WorkItem) => {
    if (!lamTaiCho(it)) { navigate(it.group === 'bao_cao_ph' ? `${it.href}&viet=1` : it.href); return; }   /* AU-GON B3-10: "Viết ›" mở thẳng panel viết (`?viet=1`, TabBaoCaoPh) */
    if (it.key.startsWith('pdc-lop:') || data?.paDangChay?.some((x) => `action:${x.paId}` === it.key && !phang(dsGoc).some((y) => y.key === it.key))) pdcMo.current.set(it.key, it);
    const next = new URLSearchParams(params);
    next.set('viec', it.key);
    if (tabCua(it) !== tab && !params.get('loai')) next.set('nhom', tabCua(it));   // CV-TAB: việc của tab khác (Việc tiếp, Em này còn) → danh sách sang tab đó
    next.delete('panel');   // việc mới mở ở form, không ở view Case của việc trước
    next.delete('the');     // V8-CV: một panel một lúc — panel việc thay panel duyệt
    /* Mở từ danh sách: một bước lịch sử (nút Lùi của điện thoại về danh sách); đổi việc khi panel đang mở: thay tại chỗ (giữ số mục view đã push để đóng lùi đủ). */
    if (viec) setParams(next, { replace: true, state: soMucPanel(stLs) ? { panelSau: soMucPanel(stLs) } : undefined });
    else {
      daDay.current = khongViec(params);
      const v = vungCuon();
      /* GD-20c ([XM-G1] PTA chốt): lưới Ghi kết quả PA ẩn danh sách cả ở máy tính — nhớ chỗ cuộn như điện thoại, Đóng về đúng dòng cũ. */
      if (v && (window.matchMedia(MAN_HEP).matches || (it.group === 'ghi_ket_qua_pa' && moCaDong(it)))) { cuon.current = v.scrollTop; v.scrollTo(0, 0); }
      setParams(next);
    }
  };
  const dong = () => {
    const lui = daDay.current !== null && daDay.current === khongViec(params);
    daDay.current = null;
    if (lui) navigate(-1 - soMucPanel(stLs));
    else setParams(new URLSearchParams(khongViec(params)), { replace: true });
  };
  /* Điện thoại: danh sách hiện lại (nút "‹ Công việc" hay nút Lùi) → về đúng chỗ cuộn cũ, SAU khi vẽ (trước đó cuộn neo theo nội dung panel). */
  const coChon = !!chon;
  const vuaCo = useRef(coChon);
  const vuaRong = useRef(luoiRong);
  useLayoutEffect(() => {
    if (vuaCo.current && !coChon && (window.matchMedia(MAN_HEP).matches || vuaRong.current)) vungCuon()?.scrollTo(0, cuon.current);
    vuaCo.current = coChon;
    vuaRong.current = luoiRong;
  }, [coChon, luoiRong]);
  /* ponytail: "đang hiện" đọc từ DOM — nhóm gập, việc sau "Xem thêm", em của dòng gộp chưa mở không được vẽ; nâng lên state nếu DanhSachViec đổi cách vẽ. */
  const dangHien = (k: string) => !!document.querySelector(`[data-khoa="${CSS.escape(k)}"]`);
  /* CONG-VIEC-2: việc tiếp đi hết nhóm (`viecKeTiepVong`). Hết nhóm → thẻ "Hết việc {nhóm}" + việc đầu nhóm sau (`xoay`: các nhóm sau trước, rồi vòng lên). */
  const viTri = thuTu.findIndex((x) => x.key === viec);
  const xoay = viTri < 0 ? thuTu : [...thuTu.slice(viTri), ...thuTu.slice(0, viTri)];
  /* Ưu tiên việc đang hiện; việc sau "Xem thêm" / vạch gập vẫn là việc còn — không báo "Hết việc" khi nhóm chưa hết (critique P1). */
  const keTiep = viecKeTiepVong(thuTu, viec, (x) => !xong.has(x.key) && dangHien(x.key)) ?? viecKeTiepVong(thuTu, viec, (x) => !xong.has(x.key));
  const hienTai = viTri < 0 ? null : thuTu[viTri];
  const keNhomKhac = !hienTai || keTiep ? null
    : xoay.find((x) => x.nhom !== hienTai.nhom && x.mine === hienTai.mine && !laViecChamCheo(x) && !xong.has(x.key)) ?? null;
  const [het, setHet] = useState<{ nhom: string; ke: (WorkItem & { nhom: string }) | null } | null>(null);
  useEffect(() => { setHet(null); }, [viec]);
  /* G1-13 / G4-18: giữ bản dòng lúc lưu LẦN ĐẦU — lưu tiếp (Lưu L rồi Vắng R) không đổi dòng vừa xong thành phần còn lại ("✓ Reading · 1 bài"). */
  const daLam = (it: WorkItem) => { if (pdcMo.current.has(it.key)) return; setGiu((m) => (m.has(it.key) ? m : new Map(m).set(it.key, it))); datDai(it.key, {}); };   // TU2-4: việc dựng từ PA chưa tới hạn không phải dòng giữ chỗ
  /*
   * M6 6b-3 (mockup panel-pilot ②b, ②d): việc vừa lưu bằng "· việc tiếp ›" — dải "✓ … · Hoàn tác" ở đầu việc kế (`den`) hoặc thẻ "Hết việc" (`den` = null);
   * Hoàn tác xong mở lại việc đó để làm lại (`lan` dựng lại panel đang mở, không giữ "✓ Đã lưu" cũ).
   */
  const [vuaLuu, setVuaLuu] = useState<{ x: DaLuuPanel; tu: WorkItem; den: string | null; lan: number } | null>(null);
  const [lan, setLan] = useState(0);
  const toast = useToast();
  const noiDai = choDaiVuaLuu(vuaLuu && { tu: vuaLuu.tu.key, den: vuaLuu.den }, chon?.key ?? null, !!het);
  const daiVuaLuu = vuaLuu && noiDai && (
    <DaiVuaLuu key={vuaLuu.lan} x={vuaLuu.x} ai={vuaLuu.tu.studentId !== null ? vuaLuu.tu.studentName : null}
      onHoanTac={() => { const tu = vuaLuu.tu; setVuaLuu(null); setHet(null); ghiHoanTac(tu.key, null); toast.push('ok', t('Đã hoàn tác')); if (tu.key === chon?.key) setLan((n) => n + 1); else boChuRoi(() => mo(tu)); }} />
  );
  const viecVuaLuu = {
    ten: keTiep ? (keTiep.studentId !== null ? keTiep.studentName : tenBoEm(keTiep)) : null,   // A1-08: "Tiếp: {tên em}" một dòng (loại việc đã ở nút chính)
    bao: (x: DaLuuPanel, oLai?: boolean) => {
      if (!chon) return;
      setVuaLuu((v) => ({ x, tu: chon, den: oLai ? chon.key : keTiep?.key ?? null, lan: (v?.lan ?? 0) + 1 }));
      if (x.hoanTac) ghiHoanTac(chon.key, x.hoanTac);
    },
  };
  /*
   * VIEC-XONG-AN: Hoàn tác ở dải dòng vừa xong — cùng đường đảo panel đã báo; xong thì dải "↺ Đã hoàn tác" đứng tới khi máy chủ trả lại dòng (không chớp
   * mất dòng), panel đang mở việc đó về form. Tải lại danh sách chỉ khi đường đảo chưa tự tải (`theHe` không đổi) — không thêm lời gọi.
   */
  const daiXong = (x: WorkItem) => {
    const v = dai.get(x.key);
    if (!v) return null;
    const hoanTac = v.hoanTac && (async () => { const g = theHe('/my-work'); await v.hoanTac!(); if (theHe('/my-work') === g) invalidate('/my-work'); });
    return <DaiXongDong it={x} hoan={v.hoan} hoanTac={hoanTac} onHoanTac={() => {
      datDai(x.key, { hoan: true, hoanTac: undefined });
      setVuaLuu((u) => (u?.tu.key === x.key ? null : u));
      if (chon?.key === x.key) setLan((n) => n + 1);
    }} />;
  };
  /* V5 (truy vết mục 3 BỎ): không tự mở việc đầu, không tự sang việc kế sau lưu — chỉ "Lưu · việc tiếp ›" / "Việc tiếp ›" trong panel chuyển việc. */

  // ------------------------------------------------------------------ lọc người + chip đang lọc (OV-15d, mockup 2 mục 3: 11 lựa chọn → 3)
  const [tenGv, setTenGv] = useState<string | null>(null);
  const [giaHan, setGiaHan] = useState<WorkItem | null>(null);
  const [giaoViec, setGiaoViec] = useState(false);
  /* BO-QUA-XEP-MT: Bỏ qua (ẩn ngay + toast Hoàn tác) · Khôi phục (khu "Đã bỏ qua"). Chỉ ẩn VIỆC — lịch, PA, Case giữ nguyên; máy chủ kiểm quyền. */
  const doiAnTam = (key: string, an: boolean) => setAnTam((s) => { const n = new Set(s); if (an) n.add(key); else n.delete(key); return n; });
  const guiBoQua = (key: string, boQua: boolean) => api.post('/my-work/bo-qua', { key, boQua }).then(() => invalidate('/my-work'));
  const khoiPhuc = (key: string) => guiBoQua(key, false)
    .then(() => { doiAnTam(key, false); toast.push('ok', t('Đã khôi phục'), { key: `bo-qua-${key}` }); })
    .catch((e: any) => toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.'), { key: `bo-qua-${key}` }));
  const boQua = (x: WorkItem) => {
    doiAnTam(x.key, true);
    if (x.key === viec) dong();
    guiBoQua(x.key, true)
      .then(() => toast.hoanTac(t('Đã bỏ qua: {viec}', { viec: dich(x.tieuDe) }), () => { void khoiPhuc(x.key); }, { key: `bo-qua-${x.key}` }))
      .catch((e: any) => { doiAnTam(x.key, false); toast.push('error', e?.message ?? t('Chưa bỏ qua được — thử lại.')); });
  };
  /* GV-2 ([XM] đã chốt, mockup v22 G8a): "Hoàn thành" bấm thẳng trên dòng Xếp lịch họp (không ngày giờ, không kết quả — ghi thêm thì mở panel) + Hoàn tác. */
  const hoanThanhXepLich = (x: WorkItem) => {
    const duong = `/giao-viec/meeting/${x.viecId}`;
    api.post(`${duong}/xong`, {}).then(() => {
      daLam(x); lamMoiGiaoViec();
      toast.hoanTac(t('Xong: {viec}', { viec: dich(x.tieuDe) }), () => {
        api.post(`${duong}/mo-lai`).then(() => lamMoiGiaoViec(), (e: any) => toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.')));
      }, { key: `xep-lich-${x.key}` });
    }, (e: any) => toast.push('error', e?.message ?? t('Không lưu được')));
  };
  /* B3-12 (AUDIT-2111, theo mẫu Xếp lịch họp): "Hoàn thành" bấm thẳng trên dòng việc Vận hành được giao (4 bấm → 1) + Hoàn tác về tiến độ trước (so-và-đổi:
     người khác vừa sửa → 409). Máy chủ chặn / cần hỏi (vd còn việc con mở) → báo lý do + mở panel để cập nhật tiến độ ở đó. */
  const hoanThanhVanHanh = (x: WorkItem) => {
    const duong = `/mgmt-tasks/${soCuaKhoa(x.key)}/update`;
    const truoc = x.tienDo ?? 'not_started';
    api.post<{ updatedAt: string | null }>(duong, { progress: 'done' }).then((d) => {
      daLam(x); invalidate('/my-work'); invalidate('/mgmt-tasks');
      toast.hoanTac(t('Xong: {viec}', { viec: dich(x.tieuDe) }), () => {
        api.post(duong, { progress: truoc, phienBan: d.updatedAt ?? null }).then(() => { invalidate('/my-work'); invalidate('/mgmt-tasks'); },
          (e: any) => toast.push('error', e?.message ?? t('Chưa hoàn tác được — thử lại.')));
      }, { key: `van-hanh-${x.key}` });
    }, (e: any) => { toast.push('error', e?.message ?? t('Không lưu được')); boChuRoi(() => mo(x)); });
  };
  const coLoc = loc !== 'tat-ca' || !!loai || typeof nguoi === 'number' || khung !== 'tat-ca';
  const xoaLoc = () => {
    const next = new URLSearchParams(params);
    for (const k of ['loc', 'loai']) next.delete(k);
    if (typeof nguoi === 'number') next.delete('nguoi');
    if (khung !== 'tat-ca') { nhoKhung('cong-viec', 'tat-ca'); next.set('khung', 'tat-ca'); }
    setParams(next, { replace: true });
  };
  const tenGvChon = typeof nguoi === 'number' ? (tenGv ?? dsGoc.find((x) => x.ownerId === nguoi)?.owner ?? t('một GV')) : null;
  /* Chip bộ lọc đến từ link (Tổng quan, chuông): mỗi chip có ✕ (C10). */
  const chipLoc: { k: string; nhan: string; bo: () => void }[] = [
    ...(loc !== 'tat-ca' && loc !== 'qua-han' && loc !== 'hom-nay' && loc !== 'den-het-tuan' ? [{ k: 'loc', nhan: LOC_NHANH_LABEL[loc], bo: () => setParam('loc', null) }] : []),
    ...(loai ? [{ k: 'nhom', nhan: NHAN_LOAI_VIEC[loai] ?? NHOM_VIEC_LABEL[nhomViecCua(loai)]   /* CHUONG-V2: cùng tên dòng loại ở chuông / Tổng quan (`loai=`) */, bo: () => {
      const next = new URLSearchParams(params); next.delete('nhom'); next.delete('loai'); setParams(next, { replace: true });
    } }] : []),
    /* DEM-VIEC (chủ SP 18/11: Công việc "3 việc" trong khi Tổng quan "85 việc" — khung Fast Track nhớ trên máy, nằm kín trong "Lọc thêm"): bộ lọc phụ đang bật
       luôn hiện thành chip ✕ (kể cả khi "Lọc thêm" đóng) — số đầu trang theo đúng bộ lọc đang thấy. */
    ...(khung !== 'tat-ca' ? [{ k: 'khung', nhan: khung === 'ft' ? 'Fast Track' : t('Lớp thường'), bo: () => { nhoKhung('cong-viec', 'tat-ca'); setParam('khung', 'tat-ca'); } }] : []),
    ...(typeof nguoi === 'number' ? [{ k: 'gv', nhan: tenGvChon ?? t('một GV'), bo: () => setParam('nguoi', null) }] : []),
  ];
  /* Chờ bạn duyệt — OV-15h1: đếm theo chi nhánh đang lọc (cùng `cn` hộp thẻ đọc); SUA-LOI-CV: đang xem việc MỘT GV thì không có (yêu cầu là của người xem). */
  const [khuDuyet, setKhuDuyet] = useState<HTMLDivElement | null>(null);
  /* AUDIT-UI B6 (mockup `.hang-loc`): hàng lọc Hộp duyệt hết bề ngang ngay dưới hàng tab — `HopChoDuyet` vẽ vào ô này. */
  const [khuLocDuyet, setKhuLocDuyet] = useState<HTMLDivElement | null>(null);
  /* U01 #1: Lọc thêm — số bộ lọc đang bật trong đó (Một GV · khung · chi nhánh khác mặc định); đang bật thì mở sẵn. */
  const soLocThem = (typeof nguoi === 'number' ? 1 : 0) + (khung !== 'tat-ca' ? 1 : 0) + (!laGvThuong && params.get('cn') ? 1 : 0);   // GV: `cn` là dải chi nhánh, không nằm trong Lọc thêm
  const [moLocThem, setMoLocThem] = useState(soLocThem > 0);
  const [xemXong, setXemXong] = useState(false);
  /* ponytail: "xong hôm nay" = việc đã lưu trong phiên này (`giu`), mất khi tải lại trang; cần nhật ký máy chủ nếu chủ SP muốn giữ qua phiên. */
  const dsXong = useMemo(() => {
    const ds = [...giu.values()].filter((x) => xong.has(x.key));
    return thuTuTab.map((k) => ({ key: k, label: tenTab(k), items: ds.filter((x) => tabCua(x) === k), quaHan: 0 })).filter((m) => m.items.length);
  }, [giu, xong, laTvv]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!xong.size) setXemXong(false); }, [xong.size]);
  const coBaoCao = !!session?.nav?.workReports;
  const loiVanHanh = <LoiVanHanh cn={branchId} baoCao={coBaoCao} />;
  /* GV-2 (mockup v22 G8a): BPXL (`trangDauTest`, không dạy lớp) — không khối "Lớp của tôi" / "+ Task" của GV. */
  const laGv = laGvThuong && !session?.nav?.trangDauTest;
  /* GD-1: "Lớp của tôi" — phân công trong phiên + việc đã nạp (`/my-work`), không request thêm. */
  const dongLop = useMemo(() => (laGv ? dungLopCuaToi(session?.assignments ?? [], dsGoc, data?.testSapToi, moCaDong) : []),
    [laGv, session?.assignments, dsGoc, data?.testSapToi]);
  const [xemLop, setXemLop] = useState(false);
  /* GD-8 (mockup v21 ④, [XM-13]): trang đầu TVV — MỘT GET em + chỉ số (`/tong-quan/tvv/em`); việc từng em từ `/my-work` đã nạp. */
  const hvTvv = useApi<{ em: EmTvv[]; chiSo?: ChiSoTvv }>(laTvv ? '/tong-quan/tvv/em' : null, [laTvv]);
  /* GD-1: GV có lớp. GD-8 (④ R4.5, [XM-7]): TVV luôn có "+ Task" = Hỏi tình hình học tập (em chọn từ HV của tôi đã nạp). */
  const coTask = (laGv && dongLop.length > 0) || laTvv;
  const nutTask = (noi: 'dau' | 'noi') => (laTvv
    ? <NutTask noi={noi} muc={['tinh-hinh']} hoi={{ gvcn: null }} dsHoi={(hvTvv.data?.em ?? []).filter((e) => e.status === 'active').map((e) => ({ id: e.id, ten: e.ten, phu: e.lop.map((l) => l.ma).join(', ') || undefined }))} />
    : <NutTask noi={noi} />);
  const tenCn = useTenChiNhanh(laTvv);
  /* a2 "7 việc ở Cẩm Phả": QL xem một GV trong một chi nhánh — tên chi nhánh đang lọc (danh sách chi nhánh của ô Chi nhánh, đã nạp). */
  /* RA-LOI-0711d: QL chỉ một chi nhánh (không có ô Chi nhánh, `branchId` null) → chi nhánh duy nhất của quyền. */
  const cnQuyen = [...new Set((session?.grants ?? []).map((g) => g.branchId))];
  const cnXem = branchId ?? (cnQuyen.length === 1 ? cnQuyen[0] : null);
  const dsCnXem = useApi<{ id: number; name: string }[]>(xemMotGv && cnXem ? '/ref/branches' : null).data;
  const tenCnXem = cnXem ? dsCnXem?.find((b) => b.id === cnXem)?.name ?? null : null;
  /* CV-TAB (mockup v17 `.tom`): đầu trang "n việc · m quá hạn" — đếm dòng (`demDongViec`), cùng phạm vi lọc người / khung với badge tab. */
  /* GD-9 ([XM-9a]): GV / TVV — "n việc" đếm DÒNG CỦA TÔI (`dongCuaToi`, cùng hàm chuông / Tổng quan); việc làm thay vẫn trong danh sách, ghi riêng "· n làm thay". */
  const tong = useMemo(() => demDongViec(laQuanLy ? items : dongCuaToi(items)), [items, laQuanLy]);
  /* GD-ADMIN-HAI-SO (PTA 15/11, D.V13): Admin xem "Tất cả" — đầu trang tách hai số cùng hàm `demDongViec`: "Việc của tôi" (= số chuông / badge: `dongCuaToi`) · "Việc của GV" (phần còn lại). */
  const haiSo = useMemo(() => {
    if (!chiChamDiem || nguoi !== 'tat-ca') return null;
    const cua = dongCuaToi(items), khoa = new Set(cua.map((x) => x.key));
    return { ban: demDongViec(cua), gv: demDongViec(items.filter((x) => !khoa.has(x.key))) };
  }, [items, chiChamDiem, nguoi]);
  const soLamThay = useMemo(() => (laQuanLy ? 0 : demDongViec(items).n - tong.n), [items, laQuanLy, tong]);
  const conViec = useMemo(() => demDongViec(tatCaViec).n > 0, [tatCaViec]);
  const chiCc = !conViec && tatCaViec.some(laViecChamCheo);
  /* brief 7: việc của người khác (QL xem GV / Tất cả) = theo dõi; `chiXem` = đang xem đúng một GV. Việc chưa có người (Phân công…) không phải của ai — làm được. */
  /* A3-05: CX gặp việc chấm "Chưa có người" — CX không sửa điểm (N52) → chỉ xem: dòng không nút "Nhập điểm", panel "Chỉ xem · …" tiêu đề "Điểm …".
     Chỉ nhóm chấm: việc chưa có người khác máy chủ không gửi cờ làm được (`lamThayCua` trả false khi chưa có người) — CX làm được nhiều việc phía TVV. */
  const chiXemCx = (it: WorkItem) => laCx && !it.mine && it.ownerId === null && it.group === 'score';
  const theoDoi = (it: WorkItem) => !!data?.chiXem || (!it.mine && it.ownerId !== null) || chiXemCx(it);
  const cuoiTuan = chiaVachHan([], homNay).cuoiTuan;
  /* "Em này còn" (T01): việc khác của cùng em ở danh sách (làm tại chỗ, chưa xong) — một bấm sang việc đó. */
  const emNayCon = chon && chon.studentId !== null
    ? phang(tatCaViec).filter((x) => !x.con?.length && x.studentId === chon.studentId && x.key !== chon.key && lamTaiCho(x) && !xong.has(x.key)) : [];
  /* N56 ① (chủ SP 20/11, sửa N33 ③): việc của người khác mà mình làm thay được (`lamThay` máy chủ) mở THẲNG form + dải "Bạn đang làm thay …";
     "Chỉ xem" về tóm tắt (nhớ theo việc), ở đó "Làm thay" mở lại form. Không có quyền → tóm tắt như cũ. Quyền máy chủ không đổi. */
  const [chiXem, setChiXem] = useState<string | null>(null);
  /* GV-2 (N58): việc giao được (Báo PH · Meeting) có cờ quyền từ máy chủ ở chính panel — mở THẲNG panel như việc của mình (`theoDoiChon` false; nhãn đầu panel vẫn "Theo dõi") (khối Phụ trách: Head / CX "Đổi"; không quyền ghi thì form chỉ xem), không tóm tắt. */
  const coKhoiGiao = !!chon && /^(bao_ph_yt|phoi_hop_tvv|meeting_xep_lich|meeting_ket_qua)$/.test(chon.group) && !chon.con?.length;
  const theoDoiViec = !!chon && theoDoi(chon);
  const theoDoiChon = theoDoiViec && !coKhoiGiao;
  /* CV-SUA-1011 (chủ SP 10/11 ý 5 "skip cái panel thừa này đi … muốn nhập hộ thì nhập hộ luôn"): Nhập điểm / Chấm Speaking của người khác mở THẲNG
     lưới — sửa được (quyền máy chủ từng ô) thì nhập ngay, không thì chỉ xem; không tóm tắt + nút "Nhập hộ". */
  const moThang = theoDoiChon && chon.group === 'score';
  const coLamThay = !!(chon as { lamThay?: boolean } | null)?.lamThay;
  const khoaPanel = theoDoiChon && !moThang && (!coLamThay || chiXem === chon?.key);
  const dangLamThay = theoDoiChon && coLamThay && (moThang || chiXem !== chon?.key);
  const nhanNhom = chon ? (laViecChamCheo(chon) ? t('Chấm Speaking') : /^(meeting_|phoi_hop_tvv$)/.test(chon.group) ? t('Meeting CX/GĐCN')   // GV-2 (mockup v22 G8): "Việc · Meeting CX/GĐCN"
    : dich(laTvv ? NHOM_CV_TVV_LABEL[nhomViecTvvCua(chon.group)] : NHOM_VIEC_LABEL[nhomViecCua(chon.group)])) : '';
  const dauPanel = chon ? {
    loai: `${dangLamThay ? t('Làm thay') : chiXemCx(chon) ? t('Chỉ xem') : theoDoiViec ? t('Theo dõi') : t('Việc')} · ${nhanNhom}`, nguoiLam: theoDoiViec ? chon.owner : null, chiXem: chiXemCx(chon),
    dai: noiDai === 'viec' && daiVuaLuu ? daiVuaLuu : undefined,
    /* PTA rà #1880: dải làm thay ở đầu panel (KhungPanel `daiLamThay`), không trong vùng cuộn — luôn thấy trước khi lưu. */
    daiLamThay: dangLamThay ? <DaiLamThay ai={chon.owner ?? t('người phụ trách')} onThoi={moThang ? null : () => boChuRoi(() => setChiXem(chon.key))} /> : undefined,
    them: emNayCon.length ? (
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-slate-400">
        <span>{t('Em này còn:')}</span>
        {emNayCon.map((x) => (
          <button key={x.key} type="button" className="btn btn-sm min-h-[44px] max-w-full whitespace-normal text-left sm:min-h-[28px]" onClick={() => boChuRoi(() => mo(x))}>
            {dich(x.group === 'bao_ph_yt' && x.phu ? x.phu : x.tieuDe)}{x.due ? ` · ${t('hạn {ngan}', { ngan: shortDate(x.due, homNay) })}` : ''}
          </button>
        ))}
      </div>
    ) : undefined,
  } : null;

  /* Tên nhóm cho thẻ "Hết việc" — cùng nhãn tab (QL: "Việc quản lý"). */
  const tenNhom = tenTab;
  /* GV-2: tab "Đang theo dõi" — việc đang mở ở panel chỉ đọc (`theo=loai:id`, cùng kiểu `viec=`); dòng chọn nhớ bản dòng (panel đứng khi tải lại). */
  const theo = tab === 'theo-doi' ? params.get('theo') : null;
  const [theoDong, setTheoDong] = useState<DongTd | null>(null);
  const theoChon = theo && theoDong && `${theoDong.loai}:${theoDong.refId}` === theo ? theoDong : null;
  const moTheo = (d: DongTd) => { setTheoDong(d); setParam('theo', `${d.loai}:${d.refId}`); };
  const dongTheo = () => { setParam('theo', null); lamMoiGiaoViec(); };
  const anTrenDienThoai = chon || theId || theoChon ? 'max-lg:hidden' : '';
  /* GD-1 (mockup v21 K8): < 1024 px không có khung phải — công tắc "Việc · Lớp của tôi" thay hai cột. */
  const xemLopHep = (laGv || laTvv) && xemLop && !chon && !theId;
  return (
    <div className="space-y-3">
      <div className={`space-y-2.5 ${anTrenDienThoai}`}>
        {/* v12 S11: tiêu đề trái (bỏ "n việc · n HV · n bài" — số ở đầu nhóm) — bộ lọc phải. KHUNG-LOI (A1-07): tiêu đề = tên menu.
            TVV một chi nhánh vẫn có tên chi nhánh (UI-CV-TVV). */}
        <header className="flex flex-wrap items-center gap-x-3.5 gap-y-2" data-hd="cv-loc-them">
          <h1 className="m-0 text-[22px] font-bold text-slate-100">{t('Công việc')}</h1>
          {data && !data.scopeEmpty && (
            /* AUDIT-UI B5 (mockup 375): "n việc · m quá hạn" xuống dòng riêng dưới tiêu đề. */
            <span className="text-sm text-dim max-sm:w-full" data-hd="cv-tom">
              {/* a2: đang xem việc MỘT GV — tên GV đứng đầu dòng tóm tắt (thay dải "Đang xem việc của …"). */}
              {/* GD-8 ([XM-1]): TVV — số việc ở ô "Việc" của dải chỉ số, đầu trang chỉ còn chi nhánh (khỏi lặp). */}
              {laTvv ? tenCn : <>
              {[tenGvChon, tenCn].filter(Boolean).map((x) => <span key={x}>{x} · </span>)}
              {haiSo ? <>
                {t('Việc của tôi')} <b className="font-bold tabular-nums text-[color:var(--text)]" data-hd="cv-so-toi">{haiSo.ban.n}</b>
                {haiSo.ban.quaHan > 0 && <> ({haiSo.ban.quaHan} {t('quá hạn')})</>}
                {' · '}{t('Việc của GV')} <b className="font-bold tabular-nums text-[color:var(--text)]">{haiSo.gv.n}</b>
                {haiSo.gv.quaHan > 0 && <> (<b className="font-bold tabular-nums text-late">{haiSo.gv.quaHan}</b> {t('quá hạn')})</>}
              </> : <>
              <b className="font-bold tabular-nums text-[color:var(--text)]">{tong.n}</b> {xemMotGv && tenCnXem ? t('việc ở {cn}', { cn: tenCnXem }) : t('việc')}
              {tong.quaHan > 0 && <> · <b className="font-bold tabular-nums text-late">{tong.quaHan}</b> {t('quá hạn')}</>}
              </>}
              {soLamThay > 0 && <> · <span title={t('Việc của GV khác mà bạn làm thay được — có trong danh sách, không tính vào việc của bạn.')}>{t('{n} làm thay', { n: soLamThay })}</span></>}
              </>}
              {/* AUDIT-1611 P1-02 · N50 (11): bỏ "· n bài" ở đầu trang (mọi phạm vi) — mockup ① chỉ "n việc · m quá hạn"; số bài ở từng dòng. */}
            </span>
          )}
          {/* U01 #7: việc vừa xong trong phiên → chip bấm được, lọc "Đã xong hôm nay" (tìm lại không dò từ đầu). */}
          {lopLoc && tab !== 'duyet' && (
            <button type="button" className="nut-loc nut-loc-dang" title={t('Bỏ lọc lớp')} onClick={() => setParam('lop', null)}>
              {phang(tatCaViec).find((x) => x.classId === lopLoc)?.classCode ?? t('Lớp')} <span aria-hidden>✕</span>
            </button>
          )}
          {xong.size > 0 && (
            <button type="button" className="nut-loc text-ok" aria-pressed={xemXong} onClick={() => setXemXong((x) => !x)}>
              {xemXong ? <>{t('✓ Xong hôm nay · {n}', { n: xong.size })} <span aria-hidden>✕</span></> : t('✓ {n} xong hôm nay', { n: xong.size })}
            </button>
          )}
          {/* U01 #1 (audit 03/11): MỘT hàng — phạm vi (QL) · Mọi hạn ▾ · Loại việc ▾ · Lọc thêm ▾ (Một GV · Mọi khung · Chi nhánh).
              375: phạm vi một khối liền hết bề rộng, ô chọn lưới 3 cột cao 44 px. */}
          <span className="ml-auto flex flex-wrap items-center gap-2 max-sm:ml-0 max-sm:grid max-sm:w-full max-sm:grid-cols-[1fr_1fr_auto] [&>*]:max-sm:min-w-0">
            {laQuanLy && data && (
              <>
                {!chiChamDiem && <span className="max-sm:col-span-3 [&_button]:text-[13px] [&>div]:max-sm:flex [&>div>div]:max-sm:flex-1 [&_button]:max-sm:flex-1 [&_button]:max-sm:justify-center [&_button]:max-sm:text-[15px]">
                  <BoLocDoan ariaLabel={t('Việc của ai')} value={typeof nguoi === 'number' ? 'gv' : nguoi}
                    onChange={(k) => {
                      nhoNguoi(uid, k);
                      /* AUDIT-1611 A2-12: rời "Của tôi" khi đang ở Chờ bạn duyệt → bỏ `nhom` để chọn lại tab mặc định (tab việc của GV). */
                      const next = new URLSearchParams(params); next.set('nguoi', k);
                      if (k !== 'toi' && next.get('nhom') === 'duyet') next.delete('nhom');
                      setParams(next, { replace: true });
                    }}
                    muc={LOC_NGUOI_VIEC.map((k) => ({ key: k, nhan: LOC_NGUOI_VIEC_LABEL[k], so: null }))} /></span>}
                {/* DEM-VIEC (chủ SP 18/11, thay S11): nút "Của tôi" không số — đầu trang đã có "n việc · m quá hạn", badge menu giữ số cần làm ngay. */}
              </>
            )}
            {/* CV-TAB b (mockup a1 `.seg`): GV có việc ở > 1 chi nhánh — "Tất cả chi nhánh n · {CN} n …", mặc định Tất cả; lọc tại máy, badge tab đếm theo CN đang chọn. */}
            {dsCn.length > 1 && (
              <span className="max-sm:col-span-3 [&_button]:text-[13px] [&>div]:max-sm:flex [&>div>div]:max-sm:flex-1 [&_button]:max-sm:flex-1 [&_button]:max-sm:justify-center">
                <BoLocDoan ariaLabel={t('Chi nhánh')} value={cnLoc ? String(cnLoc) : 'tat-ca'} onChange={(k) => setParam('cn', k === 'tat-ca' ? null : k)}
                  muc={[{ key: 'tat-ca', nhan: hep ? t('Tất cả CN') : t('Tất cả chi nhánh'), so: demCn(null) },
                    ...dsCn.map((b) => ({ key: String(b.id), nhan: b.name, so: demCn(b.id) }))]} />
              </span>
            )}
            {/* Mockup "Mọi hạn ▾" — P7: hạn ghi ngày thật, không "tuần này". G1-05: tab Chờ bạn duyệt không lọc theo hạn → không có ô. */}
            {tab !== 'theo-doi' && tab !== 'duyet' && (
            <ChonDangNut className="max-sm:w-full" aria-label={t('Lọc theo hạn')} value={loc === 'qua-han' || loc === 'hom-nay' || loc === 'den-het-tuan' ? loc : 'tat-ca'}
              onChange={(e) => setParam('loc', e.target.value === 'tat-ca' ? null : e.target.value)}>
              <option value="tat-ca">{t('Mọi hạn')}</option>
              <option value="qua-han">{t('Quá hạn')} · {demHan['qua-han'] ?? 0}</option>
              <option value="hom-nay">{t('Hôm nay')} · {demHan['hom-nay'] ?? 0}</option>
              <option value="den-het-tuan">{t('Hạn đến {ngay}', { ngay: shortDate(cuoiTuan, homNay) })} · {demHan['den-het-tuan'] ?? 0}</option>
            </ChonDangNut>
            )}
            <button type="button" className={`btn btn-sm h-8 gap-1.5 pl-3 pr-2.5 text-[13px] font-semibold max-sm:min-h-[44px] max-sm:w-full ${soLocThem ? 'nut-loc-dang' : ''}`}
              aria-expanded={moLocThem} onClick={() => setMoLocThem((x) => !x)}>
              {t('Lọc thêm')}{soLocThem ? <span className="tabular-nums">· {soLocThem}</span> : null}
              <svg aria-hidden width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" strokeWidth="1.5" className={moLocThem ? 'rotate-180' : ''}><path d="M1 1l3 3 3-3" /></svg>
            </button>
            {/* GD-1 (mockup v21 K1, K5): "+ Task" cạnh bộ lọc — chỉ GV có lớp (K7: GV mới chưa có em để ghi). 375: nút tròn nổi (K8a). */}
            {coTask && nutTask('dau')}
            {/* N62 (VH-2): "+ Giao việc" ngay trang Công việc (Head, Quản trị, CX) — CÙNG form giao việc của bảng Vận hành. */}
            {session?.nav?.vanHanh && (
              <button type="button" className={`btn btn-sm h-8 px-3 text-[13px] font-semibold max-sm:min-h-[44px] max-sm:w-full ${coTask ? '' : 'btn-primary'}`} onClick={() => setGiaoViec(true)}>{t('+ Giao việc')}</button>
            )}
          </span>
        </header>
        {/* U01 #1: "Lọc thêm" mở MỘT hàng ngay dưới (cùng kiểu "Bộ lọc thêm" HV & Lớp) — không popover lồng ô chọn có popover riêng. */}
        {moLocThem && (
          <div role="group" aria-label={t('Lọc thêm')} className="flex flex-wrap items-center justify-end gap-2 max-sm:grid max-sm:grid-cols-1">
            {laQuanLy && data && <ChonPhuTrach chiChonGv value={typeof nguoi === 'number' ? nguoi : 'tat-ca'} valueName={tenGvChon}
              onChange={(v, name) => { setTenGv(name ?? null); setParam('nguoi', String(v)); }} />}
            {haiKhung && <CongTacKhung trang="cong-viec" coTatCa kieu="chon" chuTatCa={t('Mọi khung')} value={khung} dem={{ ft: demKhung.ft, thuong: demKhung.thuong }} onChange={(k) => setParam('khung', k === 'tat-ca' ? null : k)} />}
            {!dsCn.length && <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />}
          </div>
        )}
        {chipLoc.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            {chipLoc.map((c) => (
              <button key={c.k} type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" title={t('Bỏ lọc')} onClick={c.bo}>{c.nhan} <span aria-hidden>✕</span></button>
            ))}
            {/* DEM-VIEC: một bấm bỏ hết bộ lọc (hạn · loại · khung · một GV) — về đúng danh sách badge / ô Tổng quan đếm. */}
            {chipLoc.length > 1 && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={xoaLoc}>{t('Bỏ lọc')}</button>}
          </div>
        )}
        {/* CV-TAB b (mockup a2): QL xem một GV dạy cả chi nhánh khác — việc ở đó do QL chi nhánh đó theo dõi, không hiện ở đây (máy chủ `cnAn`). */}
        {xemMotGv && !!data?.cnAn?.length && (
          <p className="m-0 text-[13px] text-faint" role="note">
            {t('{gv} dạy cả {cn} — việc ở đó do Head {cn} theo dõi, không hiện ở đây.', { gv: (tenGvChon ?? '').trim().split(/\s+/).pop() ?? '', cn: data.cnAn.join(', ') })}
          </p>
        )}
        {/* GD-8 (④ K1, R4.2): dải mỏng 5 chỉ số của TVV ngay dưới đầu trang (thay 5 ô to của Tổng quan TVV cũ). */}
        {laTvv && data && !data.scopeEmpty && <div className={xemLopHep ? 'max-lg:hidden' : undefined}><DaiChiSoTvv chiSo={hvTvv.data?.chiSo} em={hvTvv.data?.em} /></div>}
        {/* CV-TAB: hàng tab hạng mục — dưới hàng lọc, kẻ dưới hết bề ngang (mockup `.tabs`). */}
        {/* GD-1 (mockup v21 K8a/b): < 1024 px — công tắc hai đoạn "Việc · Lớp của tôi" thay khung phải. */}
        {(laGv || laTvv) && data && !data.scopeEmpty && (
          <div role="group" aria-label={t('Xem')} className="flex h-11 overflow-hidden rounded-lg border lg:hidden" style={{ borderColor: 'var(--line-strong)' }}>
            {[[false, t('Việc')], [true, laTvv ? t('HV của tôi') : t('Lớp của tôi')]].map(([k, nhan], i) => (
              /* HD-CHI: < 1024 px khung "Lớp của tôi" ẩn sau nút này — "Chỉ cho tôi" khoanh nút (cùng `data-hd` với khung). */
              <button key={String(k)} type="button" aria-pressed={xemLop === k} onClick={() => setXemLop(k as boolean)} data-hd={k && !laTvv ? 'cv-lop-cua-toi' : undefined}
                className={`flex-1 appearance-none border-0 text-[15px] ${i ? 'border-l' : ''} ${xemLop === k
                  ? 'bg-[color:var(--accent-soft)] font-bold text-[color:var(--text)] shadow-[inset_0_-2px_0_var(--accent)]' : 'surface-2 font-medium text-dim'}`}
                style={{ borderColor: 'var(--line-strong)' }}>{nhan as string}</button>
            ))}
          </div>
        )}
        {data && !data.scopeEmpty && tabs.length > 0 && <div className={xemLopHep ? 'max-lg:hidden' : undefined}><HangTab ariaLabel={t('Hạng mục việc')} className="-mx-4 px-4 md:-mx-5 md:px-5" tabs={tabs.map((x) => ({ key: x.key, label: x.nhan, badge: x.badge }))} value={tab ?? ''} panelId="cv-tab-than" onChange={(k) => {
          const next = new URLSearchParams(params); next.set('nhom', k); next.delete('loai'); next.delete('the'); setParams(next, { replace: true });
        }} /></div>}
        {tab === 'duyet' && <div ref={setKhuLocDuyet} />}
      </div>

      {/* ───────────────────────────────────────────────── danh sách trái 540 px · panel phải dính (mockup `.bo-cuc`) */}
      {/* CV-TAB (chủ SP 06/11 "panel rộng hơn, cân đối, không nhảy chữ"): danh sách 640 px · panel phần còn lại (~740 px ở 1440). */}
      {/* GD-20c ([XM-G1], mockup ⑫ C2 `.pn-rong` 1040): lưới Ghi kết quả PA cần cả bề ngang — khi lưới mở, danh sách ẩn, panel rộng tối đa 1040; ✕ / Đóng về danh sách. */}
      <div className={`lg:grid lg:items-start lg:gap-4 ${luoiRong ? 'lg:grid-cols-[minmax(0,1040px)]' : 'lg:grid-cols-[520px_minmax(0,1fr)] xl:grid-cols-[640px_minmax(0,1fr)]'}`}>
        <div id="cv-tab-than" role={tab ? 'tabpanel' : undefined} aria-label={tab ? tenTab(tab) : undefined} className={`${anTrenDienThoai} ${xemLopHep ? 'max-lg:hidden' : ''} ${luoiRong ? 'lg:hidden' : ''} ${cu ? 'dang-tai-lai' : ''}`} aria-busy={cu || undefined}>
          {/* U01 #7 (khung A5): lọc "Đã xong hôm nay" — chỉ việc vừa xong trong phiên này, bấm dòng = Xem lại ở panel. */}
          {xemXong && dsXong.length > 0 && (
            <DanhSachViec nho={uid != null ? `u${uid}:xong` : undefined} muc={dsXong} dem={new Map(dsXong.map((m) => [m.key, { n: m.items.length, quaHan: 0 }]))} soHien={10}
              onOpen={(x) => boChuRoi(() => mo(x))} chon={viec} xong={xong} moTrang={() => false} moCaDong={moCaDong} theoDoi={() => false} />
          )}
          {!xemXong && <>
          {/* V5: lỗi tải chỉ ở vùng danh sách — đầu trang, bộ lọc giữ. */}
          {error && <Card><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>}
          {!error && loading && !data && <Card><Skeleton rows={8} /></Card>}
          {data && data.scopeEmpty && <Card><Empty title={t('Bạn chưa được cấp phạm vi nào')} /></Card>}
          {/* V8-CV → CV-TAB → AUDIT-UI B6: "Chờ bạn duyệt" là một tab VÀ là Hộp duyệt — hàng lọc (loại · Báo QL · Đã xử lý · Lớp) + thẻ chờ (bấm chữ dòng = panel duyệt bên phải). */}
          {tab === 'duyet' && <HopChoDuyet branchId={branchId} khuPanel={khuDuyet} khuLoc={khuLocDuyet} />}
          {/* RA-LOI-0711i: tab đang hiện chính danh sách bài chấm chéo thì không ghi "không có việc" ngay trên danh sách đó. */}
          {chiCc && tab !== 'duyet' && !trongTab.some(laViecChamCheo) && <p className="m-0 mb-3 text-sm text-slate-400">{t('Bạn không có việc đang mở.')}</p>}
          {tab === 'theo-doi' && <DsTheoDoi chon={theo} onMo={(d) => boChuRoi(() => moTheo(d))} onCo={setTheoDong} nho={uid != null ? `u${uid}:theo-doi` : undefined} />}
          {data && !data.scopeEmpty && tab !== 'duyet' && tab !== 'theo-doi' && mucs.length === 0 && !(tab === 'van-hanh' && coVanHanh) && (
            <Card><Empty title={coLoc ? t('Không có việc nào khớp bộ lọc') : t('Không còn việc đang mở')}
              action={coLoc ? <button type="button" className="btn btn-sm" onClick={xoaLoc}>{t('Xoá lọc')}</button> : undefined} /></Card>
          )}
          {data && !data.scopeEmpty && tab !== 'duyet' && mucs.length > 0 && (
            <DanhSachViec muc={mucs} nho={uid != null ? `u${uid}:${tab ?? ''}` : undefined} dem={demMuc} soHien={10} cuoi={tab === 'van-hanh' && coVanHanh ? loiVanHanh : null} luat={laTvv && tab ? luatNhomTvv(tab) : undefined}
              onOpen={(x) => { if (x.key === viec) mo(x); else boChuRoi(() => mo(x)); }} chon={viec} xong={xong} daiXong={daiXong} moTrang={(x) => !lamTaiCho(x)} moCaDong={moCaDong}
              theoDoi={theoDoi} nguoiAn={xemMotGv ? nguoi : null} theCn={dsCn.length > 1 ? (x) => (x.cn != null ? maCn.get(x.cn) ?? null : null) : undefined}
              /* RA-LUONG-4: chỉ "Chọn bước tiếp" có hạn để gia hạn (N6; máy chủ `coTheGiaHanSauThi`) — "Cập nhật KQ thi thật" không hạn, Gia hạn sẽ 400. */
              nutPhu={(x) => (!x.con && x.cycleId && x.group === 'buoc_tiep' && !xong.has(x.key) && !theoDoi(x)
                ? <button type="button" className="btn btn-sm min-h-[44px] font-semibold sm:h-8 sm:min-h-8" onClick={() => setGiaHan(x)}>{t('Gia hạn')}</button>
                /* GV-2 ([XM] đã chốt, mockup v22 G8a): "Hoàn thành" bấm thẳng trên dòng Xếp lịch họp. */
                : x.group === 'meeting_xep_lich' && x.viecId && !xong.has(x.key) && !theoDoi(x)
                ? <button type="button" className="btn btn-sm min-h-[44px] justify-center px-2.5 text-[13px] font-semibold sm:h-[30px] sm:min-h-[30px]" onClick={() => hoanThanhXepLich(x)}>{t('Hoàn thành')}</button>
                /* B3-12: việc Vận hành giao cho tôi, chưa bắt đầu / đang làm (Tạm ngưng, Dừng hẳn cần lý do → panel). */
                : x.group === 'mgmt' && x.mine && (x.tienDo === 'not_started' || x.tienDo === 'doing') && !xong.has(x.key) && !theoDoi(x)
                ? <button type="button" className="btn btn-sm min-h-[44px] justify-center px-2.5 text-[13px] font-semibold sm:h-[30px] sm:min-h-[30px]" onClick={() => hoanThanhVanHanh(x)}>{t('Hoàn thành')}</button>
                /* BO-QUA-XEP-MT: nút phụ cạnh nút việc (cùng mẫu Gia hạn) — chỉ việc máy chủ báo bỏ qua được. */
                : !x.con && x.boQuaDuoc && !xong.has(x.key) && !theoDoi(x)
                  ? <button type="button" className="btn btn-sm min-h-[44px] font-semibold sm:h-8 sm:min-h-8" aria-label={t('Bỏ qua: {viec}', { viec: dich(x.tieuDe) })}
                    title={t('Ẩn việc này. Lịch, PA, Case giữ nguyên.')} onClick={() => boQua(x)}>{t('Bỏ qua')}</button>
                  /* BAO-CAO-PH b: lớp đã đủ — Xuất lớp tải file ngay (dòng thiếu em: nút việc "Báo cáo PH ›" mở tab). */
                  : x.group === 'xuat_bc_ph' && !x.due && x.classId
                    ? <NutXuatLopBc lopId={x.classId} dot={x.key.split(':').slice(2).join(':')} />
                    : null)} />
          )}
          {/* TU2-4 (mockup Ⓣ1 D1): "PA đang chạy" ngay dưới nhóm Kết quả PA (cuối tab Case học thuật) — không phải việc, không vào số việc / badge / chuông. */}
          {data && !data.scopeEmpty && tab === 'case-hoc-thuat' && !!data.paDangChay?.length && (
            <PaDangChayKhoi ds={data.paDangChay} uid={uid ?? null} chon={viec} onMo={(x) => { if (x.key === viec) mo(x); else boChuRoi(() => mo(x)); }} />
          )}
          {/* OV-15h1 → CV-TAB: không có việc Vận hành nào — tab "Việc quản lý" vẫn có lối Giao việc · Vận hành · Báo cáo đơn vị. */}
          {data && tab === 'van-hanh' && coVanHanh && mucs.length === 0 && <section className="card p-0"><div className="px-4 py-1">{loiVanHanh}</div></section>}
          {tab === 'van-hanh' && !!data?.daBoQua?.length && <DaBoQua ds={data.daBoQua} homNay={homNay} onKhoiPhuc={khoiPhuc} />}
          {laGv && data && !data.scopeEmpty && tab !== 'theo-doi' && session?.nav?.workRequests && (
            /* U01 #21 (khung A1): Yêu cầu của tôi giữ cuối trang, nhóm GẬP SẴN — chỉ tải khi mở (bớt đọc Turso). GD-1: "Lớp tôi dạy" gập đã lên khung phải ("Lớp của tôi"). */
            <div className="mt-3.5 flex flex-col gap-3.5">
              <NhomGap k="yeu-cau" nhan={t('Yêu cầu của tôi')}><YeuCauCuaToi gon /></NhomGap>
            </div>
          )}
          </>}
        </div>
        {/* Cột phải dính khi cuộn danh sách dài (mockup `.khu-panel` sticky). */}
        <div className={`lg:sticky lg:top-3 ${chon || theId || theoChon ? 'space-y-2' : xemLopHep ? '' : 'max-lg:hidden'}`}>
          {tab === 'theo-doi' ? (theoChon ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <button type="button" autoFocus className="link flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-[13px] lg:hidden" onClick={() => boChuRoi(dongTheo)}>{t('‹ Công việc')}</button>
              <KhungTaiCho.Provider value><PanelTheoDoi d={theoChon} onDong={dongTheo} /></KhungTaiCho.Provider>
            </>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-start rounded-xl border border-dashed px-6 pb-10 pt-14 text-center max-lg:hidden" style={{ borderColor: 'var(--line-strong)' }}>
              <p className="m-0 text-[15px] text-dim">{t('Chọn một việc ở danh sách.')}</p>
            </div>
          )) : theId ? (
            <>
              {/* Điện thoại: danh sách vừa ẩn → focus về nút lùi (như panel việc). */}
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <button type="button" autoFocus className="link flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-[13px] lg:hidden"
                onClick={() => boChuRoi(() => setParam('the', null))}>{t('‹ Công việc')}</button>
              <div ref={setKhuDuyet} />
            </>
          ) : chon ? (
            <>
              {/* Điện thoại: danh sách vừa ẩn → focus về nút lùi (máy tính nút ẩn, `autoFocus` không có tác dụng). */}
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <button type="button" autoFocus className="link flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-[13px] lg:hidden" onClick={() => boChuRoi(dong)}>{t('‹ Công việc')}</button>
              <KhungTaiCho.Provider value><NhanTruongDam.Provider value>
                {/* N56 ① (sửa N33 ③): làm thay được → form ngay, dải vàng "Bạn đang làm thay … · Chỉ xem"; tóm tắt chỉ đọc khi không có quyền hoặc bấm "Chỉ xem". */}
                {khoaPanel ? (
                  <TomTatTheoDoi key={chon.key} it={chon} loai={dauPanel!.loai} them={dauPanel!.them} onDong={dong} onLamThay={() => setChiXem(null)}
                    onTiep={keTiep ? () => mo(keTiep) : null} tenTiep={viecVuaLuu.ten} />
                ) : <>
                <DauViecCongViec.Provider value={dauPanel}>
                  {het && (
                    <HetViecNhom nhom={het.nhom} ke={het.ke} con={het.ke ? thuTu.filter((x) => x.nhom === het.ke!.nhom && x.mine === het.ke!.mine && !xong.has(x.key)).length : 0}
                      daLuu={thuTu.filter((x) => x.nhom === het.nhom && xong.has(x.key)).length} dai={noiDai === 'het' ? daiVuaLuu : null}
                      tenNhom={tenNhom} onDong={dong} onTiep={() => het.ke && mo(het.ke)} onXemLai={() => setHet(null)} />
                  )}
                  {/* Panel vẫn gắn khi thẻ "Hết việc" hiện: "Xem lại việc vừa lưu" mở lại đúng panel đã lưu (sửa / hoàn tác của chính panel). */}
                  <div hidden={!!het}>
                    <ViecVuaLuu.Provider value={viecVuaLuu}><BaoHoanTac.Provider value={(f) => ghiHoanTac(chon.key, f)}><BaoDaGiao.Provider value={() => giaoDi.current.set(chon.key, chon)}>
                    <PanelViec key={`${chon.key}:${lan}`} xemUrl it={chon} onDong={dong} onDaLam={() => daLam(chon)}
                      onTiep={keTiep ? () => mo(keTiep) : hienTai && !theoDoiChon ? () => setHet({ nhom: hienTai.nhom, ke: keNhomKhac }) : null}
                      tenTiep={keTiep?.studentId !== null ? keTiep?.studentName : null} onMo={(x) => boChuRoi(() => mo(x))} />
                    </BaoDaGiao.Provider></BaoHoanTac.Provider></ViecVuaLuu.Provider>
                  </div>
                </DauViecCongViec.Provider>
                </>}
              </NhanTruongDam.Provider></KhungTaiCho.Provider>
            </>
          ) : laGv && tab !== 'duyet' && !data?.scopeEmpty ? (
            /* GD-1 (mockup v21 ① K1, K7): GV chưa chọn việc → "Lớp của tôi" (thay ô "Chọn một việc"); cả khi tab hết việc, GV chưa có lớp, đang tải, lỗi. */
            <>
              {!error && data && <SapToi sapToi={data.sapToi} testSapToi={data.testSapToi} tenLop={(id) => session?.assignments?.find((a) => a.classId === id)?.classCode ?? undefined} />}
              <LopCuaToi dong={dongLop} dangTai={!error && !data} onMo={(x) => boChuRoi(() => mo(x))}
                loi={error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /> : null} />
            </>
          ) : laTvv && tab !== 'duyet' && !data?.scopeEmpty ? (
            /* GD-8 (mockup v21 ④ K1, R4.3): TVV chưa chọn việc → "HV của tôi" (em · lớp · tình trạng · chip Việc cần làm) thay ô "Chọn một việc". */
            <HvCuaToi em={hvTvv.data?.em} viec={dsGoc} dangTai={!hvTvv.error && !hvTvv.data} onMo={(x) => boChuRoi(() => mo(x))}
              loi={hvTvv.error ? <ErrorState message={hvTvv.error.message} hint={hvTvv.error.hint} status={hvTvv.error.status} onRetry={hvTvv.reload} /> : null} />
          ) : data && !data.scopeEmpty && (mucs.length > 0 || tab === 'duyet') ? (
            /* V8-CV (P2): panel trống, khung viền đứt. v12 S7: chữ ở ĐẦU khung (không rơi giữa trang dài), một câu — bỏ câu "Làm tại đây…" (S4). */
            <div className="flex min-h-[320px] flex-col items-center justify-start rounded-xl border border-dashed px-6 pb-10 pt-14 text-center"
              style={{ borderColor: 'var(--line-strong)' }}>
              {/* G1-15: mở từ link `?viec=` của việc đã xong / đã đổi — nói rõ, không để panel trống im lặng. */}
              <p className="m-0 text-[15px] text-dim">{tab === 'duyet' ? t('Chọn một yêu cầu ở danh sách.') : viec ? t('Việc này đã xong hoặc đã đổi — chọn việc khác ở danh sách.') : t('Chọn một việc ở danh sách.')}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* OV-13q: Gia hạn sau thi ngay ở dòng việc — hộp nhỏ đè lên, không đổi việc đang mở. */}
      {giaHan && <HopGiaHan x={{ cycleId: giaHan.cycleId!, han: giaHan.due, daGiaHan: !!giaHan.daGiaHan }} hocVien={giaHan.studentName} lop={giaHan.classCode} onClose={() => setGiaHan(null)} />}
      {coTask && !chon && !theId && nutTask('noi')}
      <CreateTask open={giaoViec} onClose={() => setGiaoViec(false)} onDone={() => invalidate('/my-work')} branchId={branchId} />
    </div>
  );
}

/**
 * HẾT VIỆC TRONG NHÓM (CONG-VIEC-2, mockup M6 ②d / khung D8): "Lưu · việc tiếp ›" ở việc cuối nhóm → thẻ thay panel "Hết việc {nhóm} của bạn" ·
 * chân "Còn: {nhóm} · n việc" + Đóng / Việc tiếp › (việc đầu nhóm sau). Không còn nhóm nào: "Xong phần của bạn" + Đóng.
 */
function HetViecNhom({ nhom, ke, con, daLuu, dai, tenNhom, onDong, onTiep, onXemLai }: {
  nhom: string; ke: (WorkItem & { nhom: string }) | null; con: number; daLuu: number; tenNhom: (k: string) => string;
  /** M6 6b-3 (mockup ②d): dải việc vừa lưu ("✓ Đã xác nhận Case · Hoàn tác") thay dòng "✓ Đã lưu". */
  dai: ReactNode;
  onDong: () => void; onTiep: () => void; onXemLai: () => void;
}) {
  return (
    <section className="card flex flex-col p-0" aria-label={t('Hết việc {nhom} của bạn', { nhom: tenNhom(nhom) })}>
      <div className="grid justify-items-center gap-2.5 px-5 pb-6 pt-10 text-center" role="status">
        {dai ? <div className="w-full text-left">{dai}</div> : <span className={`text-[15px] font-semibold ${LOP_DA_LUU}`}>{t('✓ Đã lưu')}</span>}
        <span className="text-[17px] font-bold">{t('Hết việc {nhom} của bạn', { nhom: tenNhom(nhom) })}</span>
        {daLuu > 0 && <span className="text-sm text-dim">{t('Đã lưu {n} việc trong nhóm này hôm nay.', { n: daLuu })}</span>}
        <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] sm:min-h-0" onClick={onXemLai}>{t('‹ Xem lại việc vừa lưu')}</button>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 border-t px-5 py-2.5" style={{ borderColor: 'var(--line-strong)' }}>
        <span className="min-w-0 flex-1 text-[13px] text-dim max-sm:basis-full">
          {ke ? t('Còn: {nhom} · {n} việc', { nhom: tenNhom(ke.nhom), n: con }) : t('Xong phần của bạn')}
        </span>
        <button type="button" className="btn min-h-[44px] sm:min-h-[36px]" onClick={onDong}>{t('Đóng')}</button>
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        {ke && <button type="button" autoFocus className="btn btn-primary min-h-[44px] max-sm:flex-1 sm:min-h-[36px]" onClick={onTiep}>{t('Việc tiếp ›')}</button>}
      </div>
    </section>
  );
}

/**
 * THEO DÕI (N33 ③ → N56 ①, U01 #5 · khung A2 / C4): việc của người khác — không làm thay được, hoặc đã bấm "Chỉ xem" ở dải làm thay (trừ Nhập điểm / Chấm Speaking — mở thẳng lưới, CV-SUA-1011) — TÓM TẮT chỉ đọc, không form mờ. Đầu = dải sự kiện (Học viên · Lớp · Mức · Hạn ·
 * Phụ trách); thân = Việc · Phương án · Tới đâu · Gần nhất (Case đọc một lần — cùng câu form làm thay sẽ đọc); chân = Việc tiếp › + **Làm thay** (nút chính)
 * khi máy chủ báo `lamThay` (quyền thật: Case `SOS_EDIT`, điểm `editableSkills`), không có quyền → một câu ai làm được.
 */
function TomTatTheoDoi({ it, loai, them, onDong, onLamThay, onTiep, tenTiep }: {
  it: WorkItem & { lamThay?: boolean }; loai: string; them?: ReactNode; onDong: () => void; onLamThay: () => void; onTiep: (() => void) | null; tenTiep: string | null;
}) {
  const { data } = useApi<CaseDetail>(it.caseId !== null ? `/cases/${it.caseId}` : null, [it.caseId]);
  const sos = it.level ? mucSosTheoNhan(it.level.text) : null;
  const iv = it.paId ? (data?.interventions ?? []).find((x: any) => x.id === it.paId) : null;
  const ai = it.owner ?? t('người phụ trách');
  /* CASE-PA-UI b (v16 i2): "Mở Case ›" mở CÙNG panel Case ngay tại chỗ (chỉ xem theo quyền) — "‹ {việc}" về tóm tắt; không đổi trang. */
  const [xemCase, setXemCase] = useState(false);
  if (xemCase && it.caseId !== null) {
    return <NganCase caseId={it.caseId} paId={it.paId ?? null} hocVien={it.studentId !== null ? it.studentName : null} lop={it.classCode} onClose={onDong}
      veNguon={{ nhan: tenBoEm(it), onClick: () => setXemCase(false) }} />;
  }
  return (
    <DauViecCongViec.Provider value={{ loai, them }}>
      <KhungPanel tieuDe={tenBoEm(it)} onDong={onDong}
        dau={{ loai, dong2: [], su: [
          [t('Học viên'), it.studentId !== null ? <Link className="no-underline hover:underline" to={`/hoc-vien/${it.studentId}`}>{it.studentName}</Link> : null],
          [t('Lớp'), it.classCode],
          [t('Mức'), sos ? <ChipSos muc={sos} tinh /> : null],
          [it.group === 'ghi_ket_qua_pa' ? t('Hạn ghi KQ') : t('Hạn'), it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC[it.group] ?? 'viec-van-hanh'} han={it.due} chuThuong /> : null],
          [t('Phụ trách'), it.owner],
        ] }}
        chan={{ huy: null, trai: tenTiep && onTiep ? <span className="ten-hv text-dim">{t('Tiếp: {x}', { x: tenTiep })}</span> : undefined,
          phu: onTiep ? <button type="button" className="btn min-h-[44px] sm:min-h-[36px]" onClick={onTiep}>{t('Việc tiếp ›')}</button> : undefined,
          chinh: it.lamThay ? <button type="button" className="btn btn-primary min-h-[44px] font-bold sm:min-h-[36px]" onClick={onLamThay}>{t('Làm thay')}</button> : undefined }}>
        <div className="pt-3">
          <TruongDoc dong={[
            [t('Việc'), iv ? null : dich(it.reason)],   // PA có thì lý do việc = mô tả PA — không lặp
            /* Mockup A2: tên PA đậm · thẻ (người · mốc) · nội dung trích vạch trái. */
            [t('Phương án'), iv ? <>
              <span className="flex flex-wrap items-center gap-1.5"><b className="font-semibold">{dich(INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind)}</b>
                {[iv.performer, iv.mocChu ? dich(iv.mocChu) : null].filter(Boolean).map((x: string) => <TheMuc key={x}>{x}</TheMuc>)}</span>
              {iv.description && <div className="mt-1.5"><Trich>{dichDu(iv.description)}</Trich></div>}
            </> : null],
            /* N37: Case · PA · Kết quả PA một tuyến — "Mở Case ›" sang hồ sơ em, Case mở sẵn ở đúng PA (id sẵn có). */
            [t('Tới đâu'), data?.trangThaiV4?.chu ? <>{dich(data.trangThaiV4.chu)}{it.caseId !== null && <> · <button type="button" className="link-nho inline-flex items-center text-[15px] max-sm:min-h-[44px]"
              onClick={() => setXemCase(true)}>{t('Mở Case ›')}</button></>}</> : null],
            [t('Gần nhất'), data ? ketQuaGanNhat(data) : null],
          ]} />
          {/* SUA-LOI-CV: bài chấm chéo không của riêng ai (T18) — không câu "Chỉ … làm được". */}
          {!it.lamThay && !laViecChamCheo(it) && <p className="m-0 mt-3 text-sm text-dim" role="status">{t('Chỉ {ai} hoặc Head làm được việc này.', { ai })}</p>}
        </div>
      </KhungPanel>
    </DauViecCongViec.Provider>
  );
}

function NhomGap({ k, nhan, children }: { k: string; nhan: string; children: ReactNode }) {
  const [mo, setMo] = useState(false);
  return (
    <section className="card overflow-clip p-0" aria-label={nhan}>
      <DaiNhom k={k} nhan={nhan} mo={mo} onMo={() => setMo((x) => !x)} trungTinh />
      {mo && <div className="p-3 [&>.card]:border-0 [&>.card]:shadow-none">{children}</div>}
    </section>
  );
}

/** U01 #5 / #11 (khung A3): đang LÀM THAY — dải vàng trên panel việc, "Chỉ xem" (mockup "Thôi, chỉ xem" — từ điển S3 không dùng "Thôi") về lại tóm tắt (còn chữ thì hỏi như đổi việc). */
function DaiLamThay({ ai, onThoi }: { ai: string; onThoi: (() => void) | null }) {
  return (
    <div className="mb-1 flex flex-wrap items-center gap-2.5 rounded-lg border px-3 py-2 text-sm" role="status" style={{ background: 'rgb(var(--soon-bg-rgb))', borderColor: 'rgb(var(--soon-line-rgb))' }}>
      <b className="font-semibold text-soon">{t('Bạn đang làm thay {ai}.', { ai })}</b>
      {onThoi && <button type="button" className="link ml-auto min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={onThoi}>{t('Chỉ xem')}</button>}
    </div>
  );
}

/**
 * BO-QUA-XEP-MT: "Đã bỏ qua" — nhóm xám gập sẵn cuối danh sách (dáng `DaiNhom` như "Việc quản lý"): việc · em · lớp · ai bỏ qua, ngày · Khôi phục.
 * Không đếm vào số việc. Khôi phục = việc hiện lại ở nhóm cũ (cả phạm vi QL).
 */
function DaBoQua({ ds, homNay, onKhoiPhuc }: { ds: ViecDaBoQua[]; homNay: string; onKhoiPhuc: (key: string) => Promise<unknown> }) {
  const [mo, setMo] = useState(false);
  const [dang, setDang] = useState<string | null>(null);
  if (!ds.length) return null;
  return (
    <section className="card mt-3.5 overflow-clip p-0" aria-label={t('Đã bỏ qua')}>
      <DaiNhom k="bo-qua" nhan={t('Đã bỏ qua')} chip={t('{n} việc', { n: ds.length })} mo={mo} onMo={() => setMo((x) => !x)} trungTinh
        luat={<NutLuat label={t('Đã bỏ qua')}>{t('Việc đã bỏ qua không còn nhắc ai trong phạm vi. Lịch, PA, Case giữ nguyên; thiếu mốc khác thì việc mới hiện lại.')}</NutLuat>} />
      {mo && (
        <ul className="m-0 list-none p-0">
          {ds.map((x) => (
            <li key={x.key} className={`grid min-h-[56px] items-center gap-x-3 gap-y-1 border-t py-2 pl-4 pr-3 first:border-t-0 sm:min-h-[50px] sm:pr-4 ${COT_VIEC}`}
              style={{ borderColor: 'var(--line)' }}>
              <span className="grid min-w-0 gap-px">
                <span className="break-words text-[15px] font-medium leading-snug text-dim">{dich(x.tieuDe)}</span>
                <span className="break-words text-[13px] leading-snug text-faint">
                  {[x.classCode, t('Bỏ qua bởi {ai} · {ngay}', { ai: x.boi ?? '—', ngay: shortDate(x.luc, homNay) })].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="hidden sm:block" />
              <span className="flex">
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px] sm:w-full" disabled={dang === x.key}
                  aria-label={t('Khôi phục: {viec}', { viec: dich(x.tieuDe) })}
                  onClick={() => { setDang(x.key); void onKhoiPhuc(x.key).finally(() => setDang(null)); }}>{t('Khôi phục')}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** OV-15d: cuối nhóm "Việc quản lý" — lối tới bảng Vận hành / Báo cáo đơn vị (màn đầy đủ). A2-13 (AUDIT-2111): "+ Giao việc" chỉ ở đầu trang (N62), không lặp ở đây. */
function LoiVanHanh({ cn, baoCao }: { cn: number | null; baoCao: boolean }) {
  const q = cn ? `?cn=${cn}` : '';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-[13px]">
      <Link to={`/cong-viec/van-hanh${q}`} className="link max-sm:py-3">{t('Vận hành ›')}</Link>
      {baoCao && <Link to={`/cong-viec/bao-cao${q}`} className="link max-sm:py-3">{t('Họp đơn vị ›')}</Link>}
    </div>
  );
}

/** UI-CV-TVV (P1): luật hạn của nhóm việc TVV — ⓘ cạnh số đầu nhóm (mockup ghi thành chữ "· hạn 23:59 ngày lưu + 4"). */
const luatNhomTvv = (k: string) => (k === 'bao-ph' ? <NutLuat label={t('Hạn Báo PH')}>{t('Hạn 23:59 ngày lưu xử lý + 4 (tính cả T7, CN). Chưa liên hệ được: việc vẫn mở, giữ hạn.')}</NutLuat>
  : k === 'sau-thi' ? <NutLuat label={t('Sau thi')}>{chenHan(t('Lưu điểm thi thật trước; bước tiếp hạn {han:buoc_tiep_sau_thi} từ ngày có kết quả.'))}</NutLuat> : null);

/** UI-CV-TVV (mockup "3 việc · 3 HV · Cẩm Phả"): tên chi nhánh khi người xem chỉ thuộc MỘT chi nhánh. */
function useTenChiNhanh(bat: boolean): string | null {
  const { session } = useSession();
  const ds = useApi<{ id: number; name: string }[]>(bat ? '/ref/branches' : null).data;
  const ids = [...new Set((session?.grants ?? []).map((g) => g.branchId))];
  return ids.length === 1 && ids[0] !== null ? ds?.find((b) => b.id === ids[0])?.name ?? null : null;
}
