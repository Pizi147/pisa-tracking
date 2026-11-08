import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useManHinh } from '../../ui/TheDong.tsx';
import { BoLocDoan, Card, ChonDangNut, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { COT_VIEC, DaiNhom, DanhSachViec, HangTab, tenBoEm } from './DanhSachViec.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { TheMuc, Trich, TruongDoc } from '../../ui/KhuonViec.tsx';
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
import { LopToiDay } from '../worklist/LopToiDay.tsx';
import { ChonPhuTrach } from './ChonPhuTrach.tsx';
import { CongTacKhung, khungDaNho, nhoKhung, phamViCoHaiKhung, type KhungLoc } from '../../ui/CongTacKhung.tsx';
import { DauViecCongViec, KhungTaiCho, NhanTruongDam, boChuRoi } from '../../ui/KhungPanel.tsx';
import { PanelViec } from './PanelViecLuoi.tsx';
import { lamTaiCho, moCaDong } from './lamTaiCho.ts';
import { NganCase } from '../students/NganCaseLuoi.tsx';
import { DaiVuaLuu, ViecVuaLuu, type DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { HopGiaHan } from '../students/HopGiaHan.tsx';
import { NutXuatLopBc } from '../classes/TabBaoCaoPh.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import {
  LOC_NHANH_LABEL, NHOM_VIEC_LABEL, demLocNhanh, khoaGopCua, khopLocNhanh, nhomViecCua, NHOM_CV_TVV, TAB_CV, tabCuaViec, nhanTabCv, dongTab, chiaMucTab, badgeTab, tabMacDinh,
  LOC_NHANH, viecKeTiepVong, choDaiVuaLuu, soMucPanel, type LocNhanh, type BadgeTab, demDongViec, laViecChamCheo, shortDate, chiaVachHan,
  LOC_NGUOI_VIEC, LOC_NGUOI_VIEC_LABEL, LOAI_HAN_CUA_VIEC, INTERVENTION_KIND_LABEL, NHOM_CV_TVV_LABEL, nhomViecTvvCua, soCuaToi, khopNguoiViec, dongTheoChiNhanh, type DemYeuCau, type LocNguoiViec,
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
};
type ViecDaBoQua = { key: string; tieuDe: string; studentId: number; studentName: string; classCode: string | null; boi: string | null; luc: string };

/** Tên loại việc mở từ Tổng quan bằng `loai=` (dòng "Đang xem"). */
const TEN_LOAI: Record<string, string> = { ghi_ket_qua_pa: t('Kết quả PA') };

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

/**
 * CÔNG VIỆC › HỖ TRỢ HỌC VIÊN — LÀM TẠI CHỖ (OV-5a, đặc tả OV mục 4, mockup M1 §1–§2).
 *
 * Lọc HAI TẦNG: hàng chính Của tôi / Của GV (QL, Quản trị) · hạn có số · Chi nhánh; "Lọc thêm" (Chương trình · Nhóm việc · Của một GV, số bộ lọc
 * đang bật). Dòng phạm vi luôn hiện ("Đang xem: … · n việc · m học viên") + Xoá lọc. Mọi bộ lọc + việc đang mở (`viec`) nằm trên URL.
 *
 * Danh sách trái (560 px) · panel phải xử lý việc đang chọn (`PanelViec`, panel sẵn có đặt tại chỗ qua `KhungTaiCho`); bấm việc khác → panel đổi.
 * Lưu xong: dòng đứng nguyên chỗ, mờ + gạch khi máy chủ không còn trả việc đó (`giu`); panel giữ; chỉ "· việc tiếp ›" chuyển việc. Số đếm chỉ từ
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
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  /* PR-OV2a: Admin (`nav.workChamDiem`) xem việc Chấm điểm của GV như Quản lý, chỉ nhóm đó (OV-12h bỏ Nhắc). */
  const chiChamDiem = !!session?.nav?.workChamDiem;
  const laQuanLy = !!session?.nav?.workOps || chiChamDiem;
  const uid = session?.user?.id;
  const nguoi = laQuanLy ? thamSoNguoi(params.get('nguoi') ?? (chiChamDiem ? null : nguoiDaNho(uid) ?? 'toi')) : 'tat-ca';
  /* UI-CV-TVV (mockup `tvv.html`): TVV — chỉ việc của mình, chia nhóm theo việc TVV (Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ). */
  const laTvv = !laQuanLy && !!session?.nav?.hvCuaToi;
  const hep = useManHinh('(max-width: 639px)');
  const loc: LocNhanh = (LOC_NHANH as readonly string[]).includes(params.get('loc') ?? '') ? (params.get('loc') as LocNhanh) : 'tat-ca';
  /* CV-TAB (chủ SP 06/11): tab hạng mục ở `nhom=` (tham số sẵn có — link Tổng quan / chuông / Quay lại cũ vẫn đúng); link `loai=` (một loại việc) → tab chứa loại đó. */
  const tabUrl = params.get('nhom') ?? (params.get('loai') ? (laTvv ? nhomViecTvvCua : nhomViecCua)(params.get('loai')!) : null);
  /* OV-11f (TQ-2): `loai=` (từ Tổng quan, vd "PA chưa có Kết quả") lọc ĐÚNG loại việc — số ở ô = số việc nơi mở; đổi nhóm / Xoá lọc thì bỏ. */
  const loai = !params.get('nhom') && params.get('loai') ? params.get('loai') : null;
  const viec = params.get('viec');

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
  if (laQuanLy) qs.set('nguoi', typeof nguoi === 'number' ? String(nguoi) : 'tat-ca');
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
  /* S11 (chủ SP 05/11): ô "Của tôi" = số badge (dòng của tôi quá hạn + hôm nay, `soCuaToi` — cùng hàm máy chủ); "Của GV" / "Tất cả" không số. */
  const soToi = useMemo(() => soCuaToi(dsGoc), [dsGoc]);
  /* RA-LOI-0711d: `cn=` chỉ lọc khi chi nhánh đó còn trên dải — làm hết việc một CN (dải ẩn) hay mở địa chỉ cũ thì không giấu việc CN khác. */
  const cnLoc = cnUrl != null && (data?.chiNhanh ?? []).some((b) => b.id === cnUrl) ? cnUrl : null;
  /* Nguồn đang xem (người · chi nhánh) — một điều kiện cho danh sách và dòng giữ chỗ vừa xong. */
  const trongNguon = (it: WorkItem) => (typeof nguoi === 'number' || khopNguoiViec(it, nguoi))
    /* Việc không gắn lớp (`cn` null) hiện ở mọi chi nhánh (như khung — không bao giờ giấu việc). */
    && (cnLoc == null || it.cn == null || it.cn === cnLoc);
  /* Chủ SP 07/11 (mục 8): dòng tuần nhiều lớp ở > 1 chi nhánh — dải một CN chỉ còn lớp + em CN đó (dựng lại từ dữ liệu đã nạp); "Tất cả" như cũ. */
  const theoCn = (ds: WorkItem[], cn: number | null) => (cn == null ? ds : dongTheoChiNhanh(ds, cn));
  const tatCaViec = useMemo(() => theoCn(dsGoc, cnLoc).filter(trongNguon), [dsGoc, nguoi, cnLoc]);   // eslint-disable-line react-hooks/exhaustive-deps
  const dsCn = laGvThuong ? data?.chiNhanh ?? [] : [];
  const maCn = useMemo(() => new Map(dsCn.map((b) => [b.id, b.code])), [dsCn]);
  /* RA-LOI-0711i: số trên dải chi nhánh = cùng bộ lọc với số đầu trang (người · khung · loại việc), chỉ khác chi nhánh — "Tất cả" = số đầu trang. */
  const demCn = (id: number | null) => demDongViec(theoKhung(theoCn(dsGoc, id).filter((it) => (typeof nguoi === 'number' || khopNguoiViec(it, nguoi))
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
   * OV-5a: DÒNG ĐÃ LÀM GIỮ CHỖ — panel báo "đã lưu" thì nhớ bản dòng lúc đó; tải lại mà máy chủ không còn trả việc đó → vẫn vẽ ở chỗ cũ, mờ + gạch
   * (không nhảy vị trí). Chỉ để nhìn: mọi số đếm dưới đây đọc `tatCaViec` (máy chủ).
   */
  const [giu, setGiu] = useState<ReadonlyMap<string, WorkItem>>(new Map());
  useEffect(() => { setGiu(new Map()); }, [url]);   // đổi người xem / chi nhánh = nguồn khác: bỏ giữ chỗ của nguồn cũ
  /* RA-LOI-0711d: "còn trên máy chủ" so CẢ danh sách đã nạp (không phải phần đang lọc) — đổi dải chi nhánh / Của tôi ↔ Của GV không biến việc
     chưa xong thành "đã xong"; dòng giữ chỗ chỉ hiện trong đúng nguồn của nó. */
  const conTrenMayChu = useMemo(() => new Set(phang(dsGoc).map((x) => x.key)), [dsGoc]);
  const xong = useMemo(() => new Set([...giu].filter(([k, x]) => !conTrenMayChu.has(k) && trongNguon(x)).map(([k]) => k)),
    [giu, conTrenMayChu, nguoi, cnLoc]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* OV-11c (CV-7): em vừa xong của một dòng gộp (lớp × loại việc) đứng lại TRONG dòng gộp đó (mờ + gạch), không rơi thành dòng riêng cuối nhóm. */
  const hienThi = useMemo(() => {
    const giuXong = [...giu.values()].filter((x) => xong.has(x.key));
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
  }, [tatCaViec, giu, xong]);

  const theoKhung = (ds: WorkItem[]) => ds.filter((it) => (khung === 'tat-ca' || !it.khung || it.khung === khung) && (!loai || it.group === loai));
  const items = useMemo(() => theoKhung(tatCaViec), [tatCaViec, khung, loai]);   // eslint-disable-line react-hooks/exhaustive-deps
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
  const coVanHanh = !!session?.nav?.workOps && !chiChamDiem;
  const thuTuTab: readonly string[] = laTvv ? NHOM_CV_TVV : TAB_CV;
  const tabCua = (it: WorkItem) => tabCuaViec(it, laTvv);
  const dongCuaTab = (ds: readonly WorkItem[], k: string) => dongTab(ds.filter((x) => tabCua(x) === k), moCaDong);
  const tenTab = (k: string) => (k === 'duyet' ? t('Chờ bạn duyệt') : k === 'van-hanh' && laQuanLy ? t('Việc quản lý') : nhanTabCv(k, laTvv));
  const tabs = useMemo(() => {
    const conGiu = new Set(theoKhung(hienThi).map(tabCua));
    /* AUDIT-UI B5 (mockup 375): "Bài thi Speaking" → "Speaking" ở 375 (tên kỹ năng, không dịch). */
    const ds = thuTuTab.map((k) => ({ key: k, nhan: tenTab(k), ngan: k === 'cham-cheo' ? 'Speaking' : undefined, badge: badgeTab(dongCuaTab(items, k)) as BadgeTab | null }))
      .filter((x) => x.badge!.n > 0 || conGiu.has(x.key) || (x.key === 'van-hanh' && (coVanHanh || !!data?.daBoQua?.length)))
      .map((x) => (x.badge!.n > 0 ? x : { ...x, badge: null }));
    if (!coDuyet) return ds;
    const q = demDuyet?.quaHan ?? 0, cho = demDuyet?.cho ?? 0;
    /* AUDIT-UI B3: badge = yêu cầu cần làm ngay (quá hạn) — 0 thì không vẽ (`BadgeTabSo`); tổng ở đầu tab "n yêu cầu". */
    const bd: BadgeTab | null = cho ? { so: q, n: cho, quaHan: q, homNay: 0 } : null;
    return [{ key: 'duyet', nhan: tenTab('duyet'), badge: bd }, ...ds];
  }, [items, hienThi, homNay, laTvv, coDuyet, demDuyet, coVanHanh, data, khung, loai]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* Mở trang: tab đầu có việc quá hạn, không có thì tab đầu (`tabMacDinh`); panel duyệt đang mở → tab Chờ bạn duyệt. */
  /* RA-LOI-0711d: mở từ link `?viec=` (chuông, Tổng quan, Giao việc) không kèm `nhom` → tab của chính việc đó, danh sách + Quay lại đúng chỗ. */
  const tabViec = !tabUrl && viec ? (() => { const x = phang(dsGoc).find((y) => y.key === viec); return x ? tabCua(x) : null; })() : null;
  const tab = theId ? 'duyet' : tabs.some((x) => x.key === tabUrl) ? tabUrl
    : tabViec && tabs.some((x) => x.key === tabViec) ? tabViec : tabMacDinh(tabs);
  /* Ghi tab vào địa chỉ một lần (thay chỗ) — lưu việc làm đổi số quá hạn không làm trang nhảy tab; Quay lại về đúng tab. `loai=` đang lọc thì không ghi (ghi `nhom` = bỏ lọc loại).
     Đếm thẻ duyệt chưa về → chưa ghi (địa chỉ `nhom=duyet` không bị tab mặc định đè). */
  const choDemDuyet = !!session?.nav?.workApprove && !xemMotGv && demDuyet === undefined;
  useEffect(() => {
    if (data && tab && !choDemDuyet && tab !== params.get('nhom') && !params.get('loai') && !theId) setParam('nhom', tab);
  }, [data, tab, choDemDuyet]);   // eslint-disable-line react-hooks/exhaustive-deps
  const trongTab = useMemo(() => items.filter((it) => tabCua(it) === tab), [items, tab, laTvv]);   // eslint-disable-line react-hooks/exhaustive-deps
  const demHan = useMemo(() => demLocNhanh(trongTab, 'tat-ca', homNay), [trongTab, homNay]);
  /* `viec` trỏ tới việc không có panel (đường cũ, gõ tay) → như chưa chọn. */
  const chon = useMemo(() => {
    /* DON-HINH: việc mở từ chuông / link có thể không thuộc "Của tôi" — tìm cả danh sách QL đã nạp, không riêng dòng đang lọc. */
    const x = viec ? phang(hienThi).find((y) => y.key === viec) ?? [...giu.values()].find((y) => y.key === viec) ?? phang(dsGoc).find((y) => y.key === viec) ?? null : null;
    return x && lamTaiCho(x) ? x : null;
  }, [viec, hienThi, giu, dsGoc]);
  /*
   * Danh sách vẽ: cùng bộ lọc, cộng dòng đã làm giữ chỗ. OV-11c (CV-3): đang mở panel thì GIỮ THỨ TỰ lúc mở — dòng xong / làm một phần (hạn đổi) đứng
   * đúng chỗ cũ, không sắp lại theo hạn mới, không rơi sau "Xem thêm"; việc mới (không có ở lần vẽ trước) xuống cuối nhóm. Đóng panel / đổi lọc thì sắp lại.
   * Số đầu nhóm (CV-15) chỉ từ máy chủ (`cuoiItems`) — dòng giữ chỗ chỉ để vẽ.
   */
  const thuTuCu = useRef<{ khoa: string; vt: Map<string, number> } | null>(null);
  const khoaLoc = `${url}|${khung}|${loc}|${tab ?? ''}|${loai ?? ''}`;
  /* Mục của MỌI tab (thứ tự "việc tiếp" đi tiếp sang tab sau) — dòng vẽ = máy chủ + dòng giữ chỗ, cùng lọc hạn. */
  const mucTheoTab = useMemo(() => {
    const hien = theoKhung(hienThi).filter((it) => khopLocNhanh(it, loc, homNay));
    const out = new Map(thuTuTab.map((k) => [k, chiaMucTab(dongCuaTab(hien, k), laTvv)]));
    const cu = thuTuCu.current;
    if (!chon || !cu || cu.khoa !== khoaLoc) {
      thuTuCu.current = { khoa: khoaLoc, vt: new Map([...out.values()].flat().flatMap((m) => m.items).map((x, i) => [x.key, i])) };
      return out;
    }
    /* Plan mục 4: em cuối của dòng gộp vừa xong (dòng tan thành việc lẻ, hoặc biến mất) đứng ở chỗ của dòng gộp cũ, không rơi xuống cuối mục. */
    const vt = (x: WorkItem) => cu.vt.get(x.key) ?? cu.vt.get(khoaGopCua(x as any) ?? '') ?? Number.MAX_SAFE_INTEGER;
    return new Map([...out].map(([k, ds]) => [k, ds.map((m) => ({ ...m, items: [...m.items].sort((a, b) => vt(a) - vt(b)) }))]));
  }, [hienThi, khung, loai, loc, homNay, chon, khoaLoc, laTvv]);   // eslint-disable-line react-hooks/exhaustive-deps
  const mucs = (tab && mucTheoTab.get(tab)) || [];
  /* Số đầu mục chỉ từ máy chủ (`locItems`) — dòng giữ chỗ vừa xong chỉ để vẽ. */
  const demMuc = useMemo(() => new Map(tab ? chiaMucTab(dongCuaTab(locItems, tab), laTvv).map((m) => [m.key, { n: m.items.length, quaHan: m.quaHan }] as const) : []),
    [locItems, tab, laTvv]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------ việc đang mở ở panel (URL `viec`)
  /* Thứ tự "việc tiếp": đúng thứ tự đang vẽ; dòng gộp thường đi vào từng em; bỏ việc mở trang. `nhom` = nhóm đang vẽ (CV-05: việc kế cùng nhóm). */
  const thuTu = useMemo(() => thuTuTab.flatMap((k) => (mucTheoTab.get(k) ?? []).flatMap((m) => m.items)
    .flatMap((x) => (x.con && !moCaDong(x) ? x.con : [x])).map((x) => ({ ...x, nhom: k })))
    .filter((x) => lamTaiCho(x)), [mucTheoTab, thuTuTab]);
  /* Địa chỉ (không `viec`) lúc mở panel bằng một bước lịch sử — đóng chỉ lùi khi bộ lọc chưa đổi, không thì mất lựa chọn lọc vừa bấm. */
  const daDay = useRef<string | null>(null);
  const khongViec = (p: URLSearchParams) => { const x = new URLSearchParams(p); x.delete('viec'); x.delete('panel'); return x.toString(); };
  const cuon = useRef(0);
  const mo = (it: WorkItem) => {
    if (!lamTaiCho(it)) { navigate(it.href); return; }
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
      if (v && window.matchMedia(MAN_HEP).matches) { cuon.current = v.scrollTop; v.scrollTo(0, 0); }
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
  useLayoutEffect(() => {
    if (vuaCo.current && !coChon && window.matchMedia(MAN_HEP).matches) vungCuon()?.scrollTo(0, cuon.current);
    vuaCo.current = coChon;
  }, [coChon]);
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
  const daLam = (it: WorkItem) => setGiu((m) => new Map(m).set(it.key, it));
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
      onHoanTac={() => { const tu = vuaLuu.tu; setVuaLuu(null); setHet(null); toast.push('ok', t('Đã hoàn tác')); if (tu.key === chon?.key) setLan((n) => n + 1); else boChuRoi(() => mo(tu)); }} />
  );
  const viecVuaLuu = {
    ten: keTiep ? [tenBoEm(keTiep), keTiep.studentId !== null ? keTiep.studentName : null].filter(Boolean).join(' · ') : null,
    bao: (x: DaLuuPanel, oLai?: boolean) => { if (chon) setVuaLuu((v) => ({ x, tu: chon, den: oLai ? chon.key : keTiep?.key ?? null, lan: (v?.lan ?? 0) + 1 })); },
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
  const coLoc = loc !== 'tat-ca' || !!loai || typeof nguoi === 'number' || khung !== 'tat-ca';
  const xoaLoc = () => {
    const next = new URLSearchParams(params);
    for (const k of ['loc', 'loai']) next.delete(k);
    if (typeof nguoi === 'number') next.delete('nguoi');
    if (khung !== 'tat-ca') { nhoKhung('cong-viec', 'tat-ca'); next.set('khung', 'tat-ca'); }
    setParams(next, { replace: true });
  };
  /* Chip bộ lọc đến từ link (Tổng quan, chuông): mỗi chip có ✕ (C10). */
  const chipLoc: { k: string; nhan: string; bo: () => void }[] = [
    ...(loc !== 'tat-ca' && loc !== 'qua-han' && loc !== 'hom-nay' && loc !== 'den-het-tuan' ? [{ k: 'loc', nhan: LOC_NHANH_LABEL[loc], bo: () => setParam('loc', null) }] : []),
    ...(loai ? [{ k: 'nhom', nhan: TEN_LOAI[loai] ?? NHOM_VIEC_LABEL[nhomViecCua(loai)], bo: () => {
      const next = new URLSearchParams(params); next.delete('nhom'); next.delete('loai'); setParams(next, { replace: true });
    } }] : []),
  ];
  /* Chờ bạn duyệt — OV-15h1: đếm theo chi nhánh đang lọc (cùng `cn` hộp thẻ đọc); SUA-LOI-CV: đang xem việc MỘT GV thì không có (yêu cầu là của người xem). */
  const [khuDuyet, setKhuDuyet] = useState<HTMLDivElement | null>(null);
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
  const loiVanHanh = <LoiVanHanh cn={branchId} baoCao={coBaoCao} onGiao={() => setGiaoViec(true)} />;
  const tenGvChon = typeof nguoi === 'number' ? (tenGv ?? dsGoc.find((x) => x.ownerId === nguoi)?.owner ?? t('một GV')) : null;
  const laGv = laGvThuong;
  const tenCn = useTenChiNhanh(laTvv);
  /* a2 "7 việc ở Cẩm Phả": QL xem một GV trong một chi nhánh — tên chi nhánh đang lọc (danh sách chi nhánh của ô Chi nhánh, đã nạp). */
  /* RA-LOI-0711d: QL chỉ một chi nhánh (không có ô Chi nhánh, `branchId` null) → chi nhánh duy nhất của quyền. */
  const cnQuyen = [...new Set((session?.grants ?? []).map((g) => g.branchId))];
  const cnXem = branchId ?? (cnQuyen.length === 1 ? cnQuyen[0] : null);
  const dsCnXem = useApi<{ id: number; name: string }[]>(xemMotGv && cnXem ? '/ref/branches' : null).data;
  const tenCnXem = cnXem ? dsCnXem?.find((b) => b.id === cnXem)?.name ?? null : null;
  /* CV-TAB (mockup v17 `.tom`): đầu trang "n việc · m quá hạn" — đếm dòng (`demDongViec`), cùng phạm vi lọc người / khung với badge tab. */
  const tong = useMemo(() => demDongViec(items), [items]);
  const conViec = useMemo(() => demDongViec(tatCaViec).n > 0, [tatCaViec]);
  const chiCc = !conViec && tatCaViec.some(laViecChamCheo);
  /* brief 7: việc của người khác (QL xem GV / Tất cả) = theo dõi; `chiXem` = đang xem đúng một GV. Việc chưa có người (Phân công…) không phải của ai — làm được. */
  const theoDoi = (it: WorkItem) => !!data?.chiXem || (!it.mine && it.ownerId !== null);
  const cuoiTuan = chiaVachHan([], homNay).cuoiTuan;
  /* "Em này còn" (T01): việc khác của cùng em ở danh sách (làm tại chỗ, chưa xong) — một bấm sang việc đó. */
  const emNayCon = chon && chon.studentId !== null
    ? phang(tatCaViec).filter((x) => !x.con?.length && x.studentId === chon.studentId && x.key !== chon.key && lamTaiCho(x) && !xong.has(x.key)) : [];
  const [lamThay, setLamThay] = useState<string | null>(null);
  const theoDoiChon = !!chon && theoDoi(chon);
  const khoaPanel = theoDoiChon && lamThay !== chon?.key;
  const nhanNhom = chon ? (laViecChamCheo(chon) ? t('BÀI THI SPEAKING')
    : dich(laTvv ? NHOM_CV_TVV_LABEL[nhomViecTvvCua(chon.group)] : NHOM_VIEC_LABEL[nhomViecCua(chon.group)]).toLocaleUpperCase('vi')) : '';
  const dauPanel = chon ? {
    loai: `${khoaPanel ? t('THEO DÕI') : theoDoiChon ? t('LÀM THAY') : t('VIỆC')} · ${nhanNhom}`, nguoiLam: theoDoiChon ? chon.owner : null,
    dai: noiDai === 'viec' && daiVuaLuu || theoDoiChon ? <>
      {theoDoiChon && <DaiLamThay ai={chon.owner ?? t('người phụ trách')} onThoi={() => boChuRoi(() => setLamThay(null))} />}
      {noiDai === 'viec' ? daiVuaLuu : null}
    </> : undefined,
    them: emNayCon.length ? (
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-slate-400">
        <span>{t('Em này còn:')}</span>
        {emNayCon.map((x) => (
          <button key={x.key} type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={() => boChuRoi(() => mo(x))}>
            {dich(x.group === 'bao_ph_yt' && x.phu ? x.phu : x.tieuDe)}{x.due ? ` · ${t('hạn {ngan}', { ngan: shortDate(x.due, homNay) })}` : ''}
          </button>
        ))}
      </div>
    ) : undefined,
  } : null;

  /* Tên nhóm cho thẻ "Hết việc" — cùng nhãn tab (QL: "Việc quản lý"). */
  const tenNhom = tenTab;
  const anTrenDienThoai = chon || theId ? 'max-lg:hidden' : '';
  /* Đang tải / lỗi: không số ở ô phạm vi (không nơi nào báo chờ khi chưa chắc). */
  const hienSoToi = !!data && !error && soToi > 0;
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
              {[tenGvChon, tenCn].filter(Boolean).map((x) => <span key={x}>{x} · </span>)}
              <b className="font-bold tabular-nums text-[color:var(--text)]">{tong.n}</b> {xemMotGv && tenCnXem ? t('việc ở {cn}', { cn: tenCnXem }) : t('việc')}
              {tong.quaHan > 0 && <> · <b className="font-bold tabular-nums text-late">{tong.quaHan}</b> {t('quá hạn')}</>}
            </span>
          )}
          {/* U01 #7: việc vừa xong trong phiên → chip bấm được, lọc "Đã xong hôm nay" (tìm lại không dò từ đầu). */}
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
                    onChange={(k) => { nhoNguoi(uid, k); setParam('nguoi', k); }}
                    muc={LOC_NGUOI_VIEC.map((k) => ({ key: k, nhan: LOC_NGUOI_VIEC_LABEL[k], so: k === 'toi' && hienSoToi ? soToi : null }))} /></span>}
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
            {/* Mockup "Mọi hạn ▾" — P7: hạn ghi ngày thật, không "tuần này". */}
            <ChonDangNut className="max-sm:w-full" aria-label={t('Lọc theo hạn')} value={loc === 'qua-han' || loc === 'hom-nay' || loc === 'den-het-tuan' ? loc : 'tat-ca'}
              onChange={(e) => setParam('loc', e.target.value === 'tat-ca' ? null : e.target.value)}>
              <option value="tat-ca">{t('Mọi hạn')}</option>
              <option value="qua-han">{t('Quá hạn')} · {demHan['qua-han'] ?? 0}</option>
              <option value="hom-nay">{t('Hôm nay')} · {demHan['hom-nay'] ?? 0}</option>
              <option value="den-het-tuan">{t('Hạn đến {ngay}', { ngay: shortDate(cuoiTuan, homNay) })} · {demHan['den-het-tuan'] ?? 0}</option>
            </ChonDangNut>
            <button type="button" className={`btn btn-sm h-8 gap-1.5 pl-3 pr-2.5 text-[13px] font-semibold max-sm:min-h-[44px] max-sm:w-full ${soLocThem ? 'nut-loc-dang' : ''}`}
              aria-expanded={moLocThem} onClick={() => setMoLocThem((x) => !x)}>
              {t('Lọc thêm')}{soLocThem ? <span className="tabular-nums">· {soLocThem}</span> : null}
              <svg aria-hidden width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" strokeWidth="1.5" className={moLocThem ? 'rotate-180' : ''}><path d="M1 1l3 3 3-3" /></svg>
            </button>
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
          </div>
        )}
        {/* CV-TAB b (mockup a2): QL xem một GV dạy cả chi nhánh khác — việc ở đó do QL chi nhánh đó theo dõi, không hiện ở đây (máy chủ `cnAn`). */}
        {xemMotGv && !!data?.cnAn?.length && (
          <p className="m-0 text-[13px] text-faint" role="note">
            {t('{gv} dạy cả {cn} — việc ở đó do QL {cn} theo dõi, không hiện ở đây.', { gv: (tenGvChon ?? '').trim().split(/\s+/).pop() ?? '', cn: data.cnAn.join(', ') })}
          </p>
        )}
        {/* CV-TAB: hàng tab hạng mục — dưới hàng lọc, kẻ dưới hết bề ngang (mockup `.tabs`). */}
        {data && !data.scopeEmpty && tabs.length > 0 && <HangTab tabs={tabs} dang={tab} idPanel="cv-tab-than" onChon={(k) => {
          const next = new URLSearchParams(params); next.set('nhom', k); next.delete('loai'); next.delete('the'); setParams(next, { replace: true });
        }} />}
      </div>

      {/* ───────────────────────────────────────────────── danh sách trái 540 px · panel phải dính (mockup `.bo-cuc`) */}
      {/* CV-TAB (chủ SP 06/11 "panel rộng hơn, cân đối, không nhảy chữ"): danh sách 640 px · panel phần còn lại (~740 px ở 1440). */}
      <div className="lg:grid lg:grid-cols-[520px_minmax(0,1fr)] lg:items-start lg:gap-4 xl:grid-cols-[640px_minmax(0,1fr)]">
        <div id="cv-tab-than" role={tab ? 'tabpanel' : undefined} aria-label={tab ? tenTab(tab) : undefined} className={`${anTrenDienThoai} ${cu ? 'dang-tai-lai' : ''}`} aria-busy={cu || undefined}>
          {/* U01 #7 (khung A5): lọc "Đã xong hôm nay" — chỉ việc vừa xong trong phiên này, bấm dòng = Xem lại ở panel. */}
          {xemXong && dsXong.length > 0 && (
            <DanhSachViec muc={dsXong} dem={new Map(dsXong.map((m) => [m.key, { n: m.items.length, quaHan: 0 }]))} soHien={10}
              onOpen={(x) => boChuRoi(() => mo(x))} chon={viec} xong={xong} moTrang={() => false} moCaDong={moCaDong} theoDoi={() => false} />
          )}
          {!xemXong && <>
          {/* V5: lỗi tải chỉ ở vùng danh sách — đầu trang, bộ lọc giữ. */}
          {error && <Card><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>}
          {!error && loading && !data && <Card><Skeleton rows={8} /></Card>}
          {data && data.scopeEmpty && <Card><Empty title={t('Bạn chưa được cấp phạm vi nào')} /></Card>}
          {/* V8-CV → CV-TAB: "Chờ bạn duyệt" là một tab — thẻ chờ (bấm chữ dòng = panel duyệt bên phải); ô tích chỉ loại duyệt nhiều được (ⓘ). */}
          {tab === 'duyet' && (
            <section id="nhom-cho-duyet" className="card overflow-clip p-0" aria-label={t('Chờ bạn duyệt')}>
              <h3 className="m-0 flex min-h-[38px] items-center gap-2 px-4 py-[9px] text-[13px] font-bold" style={{ background: 'var(--surface-2)' }}>
                {t('{n} yêu cầu', { n: demDuyet?.cho ?? 0 })}
                {!!demDuyet?.quaHan && <span className="font-semibold text-late">{t('⚠ {quaHan} quá hạn', { quaHan: demDuyet.quaHan })}</span>}
                <NutLuat label={t('Duyệt nhiều')}>{t('Đánh dấu ô ở dòng để duyệt nhiều yêu cầu cùng loại một lần.')}</NutLuat>
              </h3>
              <HopChoDuyet gon branchId={branchId} khuPanel={khuDuyet} />
            </section>
          )}
          {/* RA-LOI-0711i: tab đang hiện chính danh sách bài chấm chéo thì không ghi "không có việc" ngay trên danh sách đó. */}
          {chiCc && tab !== 'duyet' && !trongTab.some(laViecChamCheo) && <p className="m-0 mb-3 text-sm text-slate-400">{t('Bạn không có việc đang mở.')}</p>}
          {data && !data.scopeEmpty && tab !== 'duyet' && mucs.length === 0 && !(tab === 'van-hanh' && coVanHanh) && (
            <Card><Empty title={coLoc ? t('Không có việc nào khớp bộ lọc') : t('Không còn việc đang mở')}
              action={coLoc ? <button type="button" className="btn btn-sm" onClick={xoaLoc}>{t('Xoá lọc')}</button> : laTvv ? <Link className="link" to="/hoc-vien">{t('HV của tôi ›')}</Link> : undefined} /></Card>
          )}
          {data && !data.scopeEmpty && tab !== 'duyet' && mucs.length > 0 && (
            <DanhSachViec muc={mucs} dem={demMuc} soHien={10} cuoi={tab === 'van-hanh' && coVanHanh ? loiVanHanh : null} luat={laTvv && tab ? luatNhomTvv(tab) : undefined}
              onOpen={(x) => { if (x.key === viec) mo(x); else boChuRoi(() => mo(x)); }} chon={viec} xong={xong} moTrang={(x) => !lamTaiCho(x)} moCaDong={moCaDong}
              theoDoi={theoDoi} nguoiAn={xemMotGv ? nguoi : null} theCn={dsCn.length > 1 ? (x) => (x.cn != null ? maCn.get(x.cn) ?? null : null) : undefined}
              /* RA-LUONG-4: chỉ "Chọn bước tiếp" có hạn để gia hạn (N6; máy chủ `coTheGiaHanSauThi`) — "Cập nhật KQ thi thật" không hạn, Gia hạn sẽ 400. */
              nutPhu={(x) => (!x.con && x.cycleId && x.group === 'buoc_tiep' && !xong.has(x.key) && !theoDoi(x)
                ? <button type="button" className="btn btn-sm min-h-[44px] font-semibold sm:h-8 sm:min-h-8" onClick={() => setGiaHan(x)}>{t('Gia hạn')}</button>
                /* BO-QUA-XEP-MT: nút phụ cạnh nút việc (cùng mẫu Gia hạn) — chỉ việc máy chủ báo bỏ qua được. */
                : !x.con && x.boQuaDuoc && !xong.has(x.key) && !theoDoi(x)
                  ? <button type="button" className="btn btn-sm min-h-[44px] font-semibold sm:h-8 sm:min-h-8" aria-label={t('Bỏ qua: {viec}', { viec: dich(x.tieuDe) })}
                    title={t('Ẩn việc này. Lịch, PA, Case giữ nguyên.')} onClick={() => boQua(x)}>{t('Bỏ qua')}</button>
                  /* BAO-CAO-PH b: lớp đã đủ — Xuất lớp tải file ngay (dòng thiếu em: nút việc "Báo cáo PH ›" mở tab). */
                  : x.group === 'xuat_bc_ph' && !x.due && x.classId
                    ? <NutXuatLopBc lopId={x.classId} dot={x.key.split(':').slice(2).join(':')} />
                    : null)} />
          )}
          {/* OV-15h1 → CV-TAB: không có việc Vận hành nào — tab "Việc quản lý" vẫn có lối Giao việc · Vận hành · Báo cáo đơn vị. */}
          {data && tab === 'van-hanh' && coVanHanh && mucs.length === 0 && <section className="card p-0"><div className="px-4 py-1">{loiVanHanh}</div></section>}
          {tab === 'van-hanh' && !!data?.daBoQua?.length && <DaBoQua ds={data.daBoQua} homNay={homNay} onKhoiPhuc={khoiPhuc} />}
          {laGv && data && !data.scopeEmpty && (
            /* U01 #21 (khung A1): Yêu cầu của tôi · Lớp tôi dạy giữ cuối trang, thành nhóm GẬP SẴN cùng dáng nhóm việc — chỉ tải khi mở (bớt đọc Turso). */
            <div className="mt-3.5 flex flex-col gap-3.5">
              {session?.nav?.workRequests && <NhomGap k="yeu-cau" nhan={t('Yêu cầu của tôi')}><YeuCauCuaToi gon /></NhomGap>}
              <NhomGap k="lop-toi-day" nhan={t('Lớp tôi dạy')}><LopToiDay /></NhomGap>
            </div>
          )}
          </>}
        </div>
        {/* Cột phải dính khi cuộn danh sách dài (mockup `.khu-panel` sticky). */}
        <div className={`lg:sticky lg:top-3 ${chon || theId ? 'space-y-2' : 'max-lg:hidden'}`}>
          {theId ? (
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
                {/* N33 ③ (U01 #5, #11): việc người khác = TÓM TẮT chỉ đọc + "Làm thay"; bấm mới ra form, dải vàng "Bạn đang làm thay … · Thôi, chỉ xem". */}
                {khoaPanel ? (
                  <TomTatTheoDoi key={chon.key} it={chon} loai={dauPanel!.loai} them={dauPanel!.them} onDong={dong} onLamThay={() => setLamThay(chon.key)}
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
                    <ViecVuaLuu.Provider value={viecVuaLuu}>
                    <PanelViec key={`${chon.key}:${lan}`} xemUrl it={chon} onDong={dong} onDaLam={() => daLam(chon)}
                      onTiep={keTiep ? () => mo(keTiep) : hienTai && !theoDoiChon ? () => setHet({ nhom: hienTai.nhom, ke: keNhomKhac }) : null}
                      tenTiep={keTiep?.studentId !== null ? keTiep?.studentName : null} onMo={(x) => boChuRoi(() => mo(x))} />
                    </ViecVuaLuu.Provider>
                  </div>
                </DauViecCongViec.Provider>
                </>}
              </NhanTruongDam.Provider></KhungTaiCho.Provider>
            </>
          ) : data && !data.scopeEmpty && (mucs.length > 0 || tab === 'duyet') ? (
            /* V8-CV (P2): panel trống, khung viền đứt. v12 S7: chữ ở ĐẦU khung (không rơi giữa trang dài), một câu — bỏ câu "Làm tại đây…" (S4). */
            <div className="flex min-h-[320px] flex-col items-center justify-start rounded-xl border border-dashed px-6 pb-10 pt-14 text-center"
              style={{ borderColor: 'var(--line-strong)' }}>
              <p className="m-0 text-[15px] text-dim">{tab === 'duyet' ? t('Chọn một yêu cầu ở danh sách.') : t('Chọn một việc ở danh sách.')}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* OV-13q: Gia hạn sau thi ngay ở dòng việc — hộp nhỏ đè lên, không đổi việc đang mở. */}
      {giaHan && <HopGiaHan x={{ cycleId: giaHan.cycleId!, han: giaHan.due, daGiaHan: !!giaHan.daGiaHan }} hocVien={giaHan.studentName} lop={giaHan.classCode} onClose={() => setGiaHan(null)} />}
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
        {dai ? <div className="w-full text-left">{dai}</div> : <span className="text-[15px] font-semibold text-dim">{t('✓ Đã lưu')}</span>}
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
 * THEO DÕI (N33 ③, U01 #5 · khung A2 / C4): việc của người khác — TÓM TẮT chỉ đọc, không form mờ. Đầu = dải sự kiện (Học viên · Lớp · Mức · Hạn ·
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
        chan={{ huy: null, trai: tenTiep && onTiep ? <span className="truncate text-dim">{t('Tiếp: {x}', { x: tenTiep })}</span> : undefined,
          phu: onTiep ? <button type="button" className="btn min-h-[44px] sm:min-h-[36px]" onClick={onTiep}>{t('Việc tiếp ›')}</button> : undefined,
          chinh: it.lamThay ? <button type="button" className="btn btn-primary min-h-[44px] font-bold sm:min-h-[36px]" onClick={onLamThay}>{it.group === 'score' ? t('Nhập hộ') : t('Làm thay')}</button> : undefined }}>
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
          {!it.lamThay && !laViecChamCheo(it) && <p className="m-0 mt-3 text-sm text-dim" role="status">{t('Chỉ {ai} hoặc Quản lý làm được việc này.', { ai })}</p>}
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
function DaiLamThay({ ai, onThoi }: { ai: string; onThoi: () => void }) {
  return (
    <div className="mb-1 flex flex-wrap items-center gap-2.5 rounded-lg border px-3 py-2 text-sm" role="status" style={{ background: 'rgb(var(--soon-bg-rgb))', borderColor: 'rgb(var(--soon-line-rgb))' }}>
      <b className="font-semibold text-soon">{t('Bạn đang làm thay {ai}.', { ai })}</b>
      <button type="button" className="link ml-auto min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={onThoi}>{t('Chỉ xem')}</button>
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

/** OV-15d: cuối nhóm "Việc quản lý" — "+ Giao việc" (hộp Giao việc sẵn có) và lối tới bảng Vận hành / Báo cáo đơn vị (màn đầy đủ). */
function LoiVanHanh({ cn, baoCao, onGiao }: { cn: number | null; baoCao: boolean; onGiao: () => void }) {
  const q = cn ? `?cn=${cn}` : '';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-[13px]">
      <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={onGiao}>{t('+ Giao việc')}</button>
      <Link to={`/cong-viec/van-hanh${q}`} className="link max-sm:py-3">{t('Vận hành ›')}</Link>
      {baoCao && <Link to={`/cong-viec/bao-cao${q}`} className="link max-sm:py-3">{t('Họp đơn vị ›')}</Link>}
    </div>
  );
}

/** UI-CV-TVV (P1): luật hạn của nhóm việc TVV — ⓘ cạnh số đầu nhóm (mockup ghi thành chữ "· hạn 23:59 ngày lưu + 4"). */
const luatNhomTvv = (k: string) => (k === 'bao-ph' ? <NutLuat label={t('Hạn Báo PH')}>{t('Hạn 23:59 ngày lưu xử lý + 4 (tính cả T7, CN). Chưa liên hệ được: việc vẫn mở, giữ hạn.')}</NutLuat>
  : k === 'sau-thi' ? <NutLuat label={t('Sau thi')}>{t('Lưu điểm thi thật trước; bước tiếp hạn 7 ngày từ ngày có kết quả.')}</NutLuat> : null);

/** UI-CV-TVV (mockup "3 việc · 3 HV · Cẩm Phả"): tên chi nhánh khi người xem chỉ thuộc MỘT chi nhánh. */
function useTenChiNhanh(bat: boolean): string | null {
  const { session } = useSession();
  const ds = useApi<{ id: number; name: string }[]>(bat ? '/ref/branches' : null).data;
  const ids = [...new Set((session?.grants ?? []).map((g) => g.branchId))];
  return ids.length === 1 && ids[0] !== null ? ds?.find((b) => b.id === ids[0])?.name ?? null : null;
}
