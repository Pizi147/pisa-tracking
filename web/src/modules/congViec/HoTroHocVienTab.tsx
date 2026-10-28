import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { BoLocDoan, Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { DaiNhom, DanhSachViec, tenBoEm, viecThat } from './DanhSachViec.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { CreateTask, NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { HopChoDuyet } from '../duyet/HopChoDuyet.tsx';
import { YeuCauCuaToi } from '../duyet/YeuCauCuaToi.tsx';
import { LopToiDay } from '../worklist/LopToiDay.tsx';
import { DaiMoiDung } from '../huongDan/DaiMoiDung.tsx';
import { ChonPhuTrach } from './ChonPhuTrach.tsx';
import { CongTacKhung, khungDaNho, nhoKhung, phamViCoHaiKhung, type KhungLoc } from '../../ui/CongTacKhung.tsx';
import { DauViecCongViec, KhungTaiCho, boChuRoi } from '../../ui/KhungPanel.tsx';
import { PanelViec, lamTaiCho, moCaDong } from './PanelViec.tsx';
import { DaiVuaLuu, ViecVuaLuu, type DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { HopGiaHan } from '../students/HopGiaHan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useManHinh } from '../../ui/TheDong.tsx';
import {
  LOC_NHANH_LABEL, NHOM_VIEC, NHOM_VIEC_LABEL, demLocNhanh, gomNhomViec, khoaGopCua, khopLocNhanh, nhomViecCua,
  LOC_NHANH, viecKeTiepVong, choDaiVuaLuu, soMucPanel, type LocNhanh, type NhomViec as MaNhomViec, demViec, laViecChamCheo, shortDate, chiaVachHan,
  LOC_NGUOI_VIEC, LOC_NGUOI_VIEC_LABEL, NHOM_CV_TVV_LABEL, nhomViecTvvCua, demNguoiViec, khopNguoiViec, trongKhoiHomNay, type DemYeuCau, type LocNguoiViec,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Work = {
  summary: { total: number; overdue: number; today: number; mine: number };
  /** PR-GOP (§5): `dong` = dòng hiển thị (một lớp × một loại việc). PR-VN3: route không còn trả `items`, `groups`. V5: số trên màn đếm VIỆC (`demViec`). */
  dong: (WorkItem & { lamThay?: boolean })[]; scopeEmpty: boolean; xemNguoiKhac?: boolean;
  /** V5 SV-SO1: xem việc của một GV khác = chế độ theo dõi. */
  chiXem?: boolean;
};

/** Tên loại việc mở từ Tổng quan bằng `loai=` (dòng "Đang xem"). */
const TEN_LOAI: Record<string, string> = { ghi_ket_qua_pa: t('Kết quả PA') };

/** OV-15d: `nguoi` = `toi` · `gv` · id một GV · không có = Tất cả (mặc định, thấy hết). */
const thamSoNguoi = (s: string | null): LocNguoiViec | number => {
  if (s === 'toi' || s === 'gv') return s;
  if (s && /^[1-9]\d*$/.test(s)) return Number(s);
  return 'tat-ca';
};
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
  /* SUA-CHAM-LAI Đ1: 375 — QL / QT danh sách dài, nhóm thứ 3 trở đi gập sẵn (bấm đầu nhóm để mở; số đầu nhóm vẫn đủ). */
  const hep = useManHinh('(max-width: 767px)');
  const nguoi = laQuanLy ? thamSoNguoi(params.get('nguoi')) : 'tat-ca';
  /* UI-CV-TVV (mockup `tvv.html`): TVV — chỉ việc của mình, chia nhóm theo việc TVV (Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ). */
  const laTvv = !laQuanLy && !!session?.nav?.hvCuaToi;
  const loc: LocNhanh = (LOC_NHANH as readonly string[]).includes(params.get('loc') ?? '') ? (params.get('loc') as LocNhanh) : 'tat-ca';
  /* PR-DUYET (K1-30): chip 4 nhóm `nhom=`; link cũ `loai=` (một loại việc) vẫn đọc — quy về nhóm chứa loại đó. */
  const nhomTs = params.get('nhom') ?? (params.get('loai') ? nhomViecCua(params.get('loai')!) : null);
  const nhom: MaNhomViec | null = (NHOM_VIEC as readonly string[]).includes(nhomTs ?? '') ? (nhomTs as MaNhomViec) : null;
  /* OV-11f (TQ-2): `loai=` (từ Tổng quan, vd "PA chưa có Kết quả") lọc ĐÚNG loại việc — số ở ô = số việc nơi mở; đổi nhóm / Xoá lọc thì bỏ. */
  const loai = !params.get('nhom') && params.get('loai') ? params.get('loai') : null;
  const moViec = params.get('mo-viec') ? Number(params.get('mo-viec')) : null;
  const viec = params.get('viec');

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
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
  const dsGoc = useMemo(() => data?.dong ?? [], [data]);
  const demNguoi = useMemo(() => demNguoiViec(dsGoc), [dsGoc]);
  const tatCaViec = useMemo(() => (typeof nguoi === 'number' ? dsGoc : dsGoc.filter((it) => khopNguoiViec(it, nguoi))), [dsGoc, nguoi]);
  const demKhung = useMemo(() => ({
    'tat-ca': tatCaViec.length,
    ft: tatCaViec.filter((it) => it.khung === 'ft').length,
    thuong: tatCaViec.filter((it) => it.khung === 'thuong').length,
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
  const conTrenMayChu = useMemo(() => new Set(phang(tatCaViec).map((x) => x.key)), [tatCaViec]);
  const xong = useMemo(() => new Set([...giu.keys()].filter((k) => !conTrenMayChu.has(k))), [giu, conTrenMayChu]);
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
  const trongNhom = useMemo(() => (nhom ? items.filter((it) => nhomViecCua(it.group) === nhom) : items), [items, nhom]);
  const demHan = useMemo(() => demLocNhanh(trongNhom, 'tat-ca', homNay), [trongNhom, homNay]);
  const locItems = useMemo(() => items.filter((it) => khopLocNhanh(it, loc, homNay)), [items, loc, homNay]);
  const cuoiItems = useMemo(() => (nhom ? locItems.filter((it) => nhomViecCua(it.group) === nhom) : locItems), [locItems, nhom]);
  /* `viec` trỏ tới việc không có panel (đường cũ, gõ tay) → như chưa chọn. */
  const chon = useMemo(() => {
    const x = viec ? phang(hienThi).find((y) => y.key === viec) ?? [...giu.values()].find((y) => y.key === viec) ?? null : null;
    return x && lamTaiCho(x) ? x : null;
  }, [viec, hienThi, giu]);
  /*
   * Danh sách vẽ: cùng bộ lọc, cộng dòng đã làm giữ chỗ. OV-11c (CV-3): đang mở panel thì GIỮ THỨ TỰ lúc mở — dòng xong / làm một phần (hạn đổi) đứng
   * đúng chỗ cũ, không sắp lại theo hạn mới, không rơi sau "Xem thêm"; việc mới (không có ở lần vẽ trước) xuống cuối nhóm. Đóng panel / đổi lọc thì sắp lại.
   * Số đầu nhóm (CV-15) chỉ từ máy chủ (`cuoiItems`) — dòng giữ chỗ chỉ để vẽ.
   */
  const thuTuCu = useRef<{ khoa: string; vt: Map<string, number> } | null>(null);
  const khoaLoc = `${url}|${khung}|${loc}|${nhom ?? ''}|${loai ?? ''}`;
  const dsNhom = useMemo(() => {
    const goc = gomNhomViec(theoKhung(hienThi).filter((it) => khopLocNhanh(it, loc, homNay) && (!nhom || nhomViecCua(it.group) === nhom)), laTvv);
    const dem = new Map(gomNhomViec(cuoiItems, laTvv).map((g) => [g.key, g]));
    const ds = goc.map((g) => ({ ...g, n: dem.get(g.key)?.n ?? 0, quaHan: dem.get(g.key)?.quaHan ?? 0, homNay: dem.get(g.key)?.homNay ?? 0 }));
    const cu = thuTuCu.current;
    if (!chon || !cu || cu.khoa !== khoaLoc) {
      thuTuCu.current = { khoa: khoaLoc, vt: new Map(ds.flatMap((g) => g.items).map((x, i) => [x.key, i])) };
      return ds;
    }
    /* Plan mục 4: em cuối của dòng gộp vừa xong (dòng tan thành việc lẻ, hoặc biến mất) đứng ở chỗ của dòng gộp cũ, không rơi xuống cuối nhóm. */
    const vt = (x: WorkItem) => cu.vt.get(x.key) ?? cu.vt.get(khoaGopCua(x as any) ?? '') ?? Number.MAX_SAFE_INTEGER;
    return ds.map((g) => ({ ...g, items: [...g.items].sort((a, b) => vt(a) - vt(b)) }));
  }, [hienThi, cuoiItems, khung, loai, loc, nhom, homNay, chon, khoaLoc, laTvv]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* OV-15d: QL — nhóm Vận hành là "Việc quản lý" (Vận hành · Báo cáo đơn vị · Chốt lộ trình / Bàn giao), cuối danh sách, gập sẵn. */
  const dsNhomXem = useMemo(() => (laQuanLy && !chiChamDiem
    ? dsNhom.map((g) => (g.key === 'van-hanh' ? { ...g, label: t('Việc quản lý'), moSan: false } : g)) : dsNhom), [dsNhom, laQuanLy, chiChamDiem]);
  /* Đang lọc thì kết quả đã ít — mở hết luôn, không bắt bấm thêm một lần gập/mở nữa. */
  const moHet = loc !== 'tat-ca' || !!nhom;

  // ------------------------------------------------------------------ việc đang mở ở panel (URL `viec`)
  /* Thứ tự "việc tiếp": đúng thứ tự đang vẽ; dòng gộp thường đi vào từng em; bỏ việc mở trang. `nhom` = nhóm đang vẽ (CV-05: việc kế cùng nhóm). */
  const thuTu = useMemo(() => dsNhom.flatMap((g) => g.items.flatMap((x) => (x.con && !moCaDong(x) ? x.con : [x])).map((x) => ({ ...x, nhom: g.key })))
    .filter((x) => lamTaiCho(x)), [dsNhom]);
  /* Địa chỉ (không `viec`) lúc mở panel bằng một bước lịch sử — đóng chỉ lùi khi bộ lọc chưa đổi, không thì mất lựa chọn lọc vừa bấm. */
  const daDay = useRef<string | null>(null);
  const khongViec = (p: URLSearchParams) => { const x = new URLSearchParams(p); x.delete('viec'); x.delete('panel'); return x.toString(); };
  const cuon = useRef(0);
  const mo = (it: WorkItem) => {
    if (!lamTaiCho(it)) { navigate(it.href); return; }
    const next = new URLSearchParams(params);
    next.set('viec', it.key);
    next.delete('panel');   // việc mới mở ở form, không ở view Case của việc trước
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
  const coLoc = loc !== 'tat-ca' || !!nhom || !!loai || typeof nguoi === 'number' || khung !== 'tat-ca';
  const xoaLoc = () => {
    const next = new URLSearchParams(params);
    for (const k of ['loc', 'nhom', 'loai']) next.delete(k);
    if (typeof nguoi === 'number') next.delete('nguoi');
    if (khung !== 'tat-ca') { nhoKhung('cong-viec', 'tat-ca'); next.set('khung', 'tat-ca'); }
    setParams(next, { replace: true });
  };
  /* Chip bộ lọc đến từ link (Tổng quan, chuông): mỗi chip có ✕ (C10). */
  const chipLoc: { k: string; nhan: string; bo: () => void }[] = [
    ...(loc !== 'tat-ca' && loc !== 'qua-han' && loc !== 'den-het-tuan' ? [{ k: 'loc', nhan: LOC_NHANH_LABEL[loc], bo: () => setParam('loc', null) }] : []),
    ...(nhom || loai ? [{ k: 'nhom', nhan: loai ? TEN_LOAI[loai] ?? NHOM_VIEC_LABEL[nhomViecCua(loai)] : NHOM_VIEC_LABEL[nhom!], bo: () => {
      const next = new URLSearchParams(params); next.delete('nhom'); next.delete('loai'); setParams(next, { replace: true });
    } }] : []),
  ];
  /* Chờ bạn duyệt — OV-15h1: đếm theo chi nhánh đang lọc (cùng `cn` hộp thẻ bên dưới đọc); chưa chọn chi nhánh = mọi chi nhánh như badge menu. */
  const demDuyet = useApi<DemYeuCau>(session?.nav?.workApprove ? `/yeu-cau/dem${branchId ? `?branchId=${branchId}` : ''}` : null, [branchId]).data;
  const [moDuyet, setMoDuyet] = useState(true);
  const [moQuanLy, setMoQuanLy] = useState(false);
  const coVanHanh = !!session?.nav?.workOps && !chiChamDiem;
  const coBaoCao = !!session?.nav?.workReports;
  const cuoiNhom = (key: string) => (key === 'van-hanh' && coVanHanh ? <LoiVanHanh cn={branchId} baoCao={coBaoCao} onGiao={() => setGiaoViec(true)} /> : null);
  /* Hàng đợi GV (mockup 2 mục 2): hết việc quá hạn + hạn tuần này → "Xong hết hôm nay ✓"; việc sau tuần này vẫn ở danh sách (gập). */
  const xongHet = !!data && !data.scopeEmpty && !coLoc && !tatCaViec.some((x) => trongKhoiHomNay(x, homNay));
  const tenGvChon = typeof nguoi === 'number' ? (tenGv ?? dsGoc.find((x) => x.ownerId === nguoi)?.owner ?? t('một GV')) : null;
  const laGv = !laQuanLy && !laTvv;
  const tenCn = useTenChiNhanh(laTvv);
  /* V5 (brief 7, T17): đầu trang đếm VIỆC thật của góc nhìn đang chọn (người) — lọc hạn / khung / nhóm, gập nhóm không đổi số. */
  const demTong = useMemo(() => demViec(viecThat(tatCaViec)), [tatCaViec]);
  const conViec = demTong.viec > 0;
  const chiCc = !conViec && tatCaViec.some(laViecChamCheo);
  /* Số đầu nhóm chỉ từ máy chủ (`cuoiItems`) — dòng giữ chỗ vừa xong chỉ để vẽ. */
  const demNhom = useMemo(() => new Map(gomNhomViec(cuoiItems, laTvv).map((g) => [g.key as string, g.items])), [cuoiItems, laTvv]);
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
    loai: `${khoaPanel ? t('THEO DÕI') : t('VIỆC')} · ${nhanNhom}`, khoa: khoaPanel, dai: noiDai === 'viec' ? daiVuaLuu : undefined,
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

  /* Tên nhóm cho thẻ "Hết việc" — cùng nhãn dải nhóm (QL: "Việc quản lý"). */
  const tenNhom = (k: string) => dich(dsNhomXem.find((g) => g.key === k)?.label ?? '');
  const anTrenDienThoai = chon ? 'max-lg:hidden' : '';
  return (
    <div className="space-y-3">
      <div className={`space-y-2.5 ${anTrenDienThoai}`}>
        {laGv && <DaiMoiDung />}
        {/* V5 (mockup `.dau-trang`): "Công việc · n nhóm · n việc · n HV · n bài" trái — bộ lọc phải. KHUNG-LOI (A1-07): tiêu đề = tên menu. */}
        <header className="flex flex-wrap items-center gap-x-3.5 gap-y-2" data-hd="cv-loc-them">
          <h1 className="m-0 text-xl font-bold text-slate-100">{t('Công việc')}</h1>
          {data && !data.scopeEmpty && (
            <span className="text-sm tabular-nums text-slate-400" aria-live="polite">
              {conViec ? <>
                {!laTvv && <><b className="text-slate-100">{demTong.nhom}</b> {t('nhóm')} · </>}<b className="text-slate-100">{demTong.viec}</b> {t('việc')}
                {demTong.hv > 0 && <> · <b className="text-slate-100">{demTong.hv}</b> {t('HV')}</>}
                {demTong.bai > 0 && <> · <b className="text-slate-100">{demTong.bai}</b> {t('bài')}</>}
              </> : <><b className="text-slate-100">0</b> {t('việc')}</>}
              {tenCn && <> · {tenCn}</>}
            </span>
          )}
          {!laGv && !!demDuyet?.cho && <span className="text-xs tabular-nums text-slate-400">{t('{n} chờ bạn duyệt', { n: demDuyet.cho })}</span>}
          {xong.size > 0 && <span className="text-xs tabular-nums text-ok">✓ {t('{n} xong hôm nay', { n: xong.size })}</span>}
          <span className="ml-auto flex flex-wrap items-center gap-2 max-sm:ml-0 max-sm:w-full">
            {laQuanLy && data && (
              <>
                {!chiChamDiem && <BoLocDoan ariaLabel={t('Việc của ai')} value={typeof nguoi === 'number' ? 'gv' : nguoi}
                  onChange={(k) => setParam('nguoi', k === 'tat-ca' ? null : k)}
                  muc={LOC_NGUOI_VIEC.map((k) => ({ key: k, nhan: LOC_NGUOI_VIEC_LABEL[k], so: typeof nguoi === 'number' ? null : demNguoi[k] }))} />}
                <ChonPhuTrach chiChonGv value={typeof nguoi === 'number' ? nguoi : 'tat-ca'} valueName={tenGvChon}
                  onChange={(v, name) => { setTenGv(name ?? null); setParam('nguoi', v === 'tat-ca' ? null : String(v)); }} />
              </>
            )}
            {haiKhung && <CongTacKhung trang="cong-viec" coTatCa value={khung} dem={{ ft: demKhung.ft, thuong: demKhung.thuong }} onChange={(k) => setParam('khung', k === 'tat-ca' ? null : k)} />}
            <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />
            {/* Mockup "Mọi hạn ▾" — P7: hạn ghi ngày thật, không "tuần này". */}
            <select className="field h-8 w-auto !py-0 text-[13px] font-medium max-sm:flex-1" aria-label={t('Lọc theo hạn')} value={loc === 'qua-han' || loc === 'den-het-tuan' ? loc : 'tat-ca'}
              onChange={(e) => setParam('loc', e.target.value === 'tat-ca' ? null : e.target.value)}>
              <option value="tat-ca">{t('Mọi hạn')}</option>
              <option value="qua-han">{t('Quá hạn')} · {demHan['qua-han'] ?? 0}</option>
              <option value="den-het-tuan">{t('Hạn đến {ngay}', { ngay: shortDate(cuoiTuan, homNay) })} · {demHan['den-het-tuan'] ?? 0}</option>
            </select>
          </span>
        </header>
        {chipLoc.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            {chipLoc.map((c) => (
              <button key={c.k} type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" title={t('Bỏ lọc')} onClick={c.bo}>{c.nhan} <span aria-hidden>✕</span></button>
            ))}
          </div>
        )}
        {data?.chiXem && (
          <div className="bao-chi-xem" role="status"><span aria-hidden>👁</span><span>{t('Đang xem việc của')} <b className="text-slate-100">{tenGvChon}</b> {t('— chế độ theo dõi.')}</span></div>
        )}
      </div>

      {/* "Chờ bạn duyệt" đầu danh sách khi có thẻ (mockup 2 mục 3) — thẻ "Nếu duyệt: …", Duyệt · Từ chối… · Mở; ô tích chỉ loại duyệt hàng loạt được. */}
      {!!demDuyet?.cho && (
        <section id="nhom-cho-duyet" className={`card overflow-clip p-0 ${anTrenDienThoai}`} aria-label={t('Chờ bạn duyệt')}>
          <DaiNhom k="duyet" nhan={t('Chờ bạn duyệt')} chip={t('{n} yêu cầu', { n: demDuyet.cho })} mo={moDuyet} onMo={() => setMoDuyet((x) => !x)}
            phu={demDuyet.quaHan ? <span className="font-semibold text-late">{t('⚠ {quaHan} quá hạn', { quaHan: demDuyet.quaHan })}</span> : null} />
          {moDuyet && <div className="px-3 pb-3 pt-2"><HopChoDuyet gon branchId={branchId} /></div>}
        </section>
      )}

      {/* ───────────────────────────────────────────────── danh sách trái 540 px · panel phải dính (mockup `.bo-cuc`) */}
      <div className="lg:grid lg:grid-cols-[520px_minmax(0,1fr)] lg:items-start lg:gap-4 xl:grid-cols-[600px_minmax(0,1fr)]">
        <div className={`${anTrenDienThoai} ${cu ? 'dang-tai-lai' : ''}`} aria-busy={cu || undefined}>
          {/* V5: lỗi tải chỉ ở vùng danh sách — đầu trang, bộ lọc giữ. */}
          {error && <Card><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></Card>}
          {!error && loading && !data && <Card><Skeleton rows={8} /></Card>}
          {data && data.scopeEmpty && <Card><Empty title={t('Bạn chưa được cấp phạm vi nào')} /></Card>}
          {chiCc && <p className="m-0 mb-3 text-sm text-slate-400">{t('Bạn không có việc đang mở.')}</p>}
          {xongHet && conViec && (
            /* Hết việc quá hạn + hạn tuần này: một dòng kết; việc sau tuần này vẫn ở danh sách dưới (gập). */
            <div className="card mb-3 px-4 py-3" role="status">
              <p className="m-0 text-base font-semibold text-ok">{t('Xong hết hôm nay ✓')}</p>
            </div>
          )}
          {data && !data.scopeEmpty && dsNhom.length === 0 && (
            <Card><Empty title={coLoc ? t('Không có việc nào khớp bộ lọc') : t('Không còn việc đang mở')}
              action={coLoc ? <button type="button" className="btn btn-sm" onClick={xoaLoc}>{t('Xoá lọc')}</button> : laTvv ? <Link className="link" to="/hoc-vien">{t('HV của tôi ›')}</Link> : undefined} /></Card>
          )}
          {data && !data.scopeEmpty && dsNhom.length > 0 && (
            <DanhSachViec nhom={dsNhomXem} dem={demNhom} homNay={homNay} soHien={10} moHet={moHet} gapSan={(k, viTri) => (k === 'van-hanh' && laQuanLy && !chiChamDiem) || (hep && laQuanLy && viTri >= 2)}
              onOpen={(x) => { if (x.key === viec) mo(x); else boChuRoi(() => mo(x)); }} chon={viec} xong={xong} moTrang={(x) => !lamTaiCho(x)} moCaDong={moCaDong}
              theoDoi={theoDoi} cuoiNhom={cuoiNhom} chiDemViec={laTvv} luatNhom={laTvv ? luatNhomTvv : undefined}
              nutPhu={(x) => (!x.con && x.cycleId && (x.group === 'thi_that' || x.group === 'buoc_tiep') && !xong.has(x.key) && !theoDoi(x)
                ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={() => setGiaHan(x)}>{t('Gia hạn')}</button> : null)} />
          )}
          {/* OV-15h1: không có việc Vận hành nào — "Việc quản lý" vẫn là MỘT nhóm gập ở cuối danh sách (Giao việc · Vận hành · Báo cáo đơn vị), không thẻ rời. */}
          {coVanHanh && data && !dsNhom.some((g) => g.key === 'van-hanh') && (
            <section id="nhom-viec-quan-ly" className="card mt-3.5 overflow-clip p-0" aria-label={t('Việc quản lý')}>
              <DaiNhom k="van-hanh" nhan={t('Việc quản lý')} chip={t('{n} việc', { n: 0 })} mo={moQuanLy} onMo={() => setMoQuanLy((x) => !x)} />
              {moQuanLy && <div className="px-4 py-1"><LoiVanHanh cn={branchId} baoCao={coBaoCao} onGiao={() => setGiaoViec(true)} /></div>}
            </section>
          )}
          {laGv && data && !data.scopeEmpty && (
            <div className="mt-4 space-y-4">
              {session?.nav?.workRequests && <YeuCauCuaToi gon />}
              <LopToiDay />
            </div>
          )}
        </div>
        {/* Cột phải dính khi cuộn danh sách dài (mockup `.khu-panel` sticky). */}
        <div className={`lg:sticky lg:top-3 ${chon ? 'space-y-2' : 'max-lg:hidden'}`}>
          {chon ? (
            <>
              {/* Điện thoại: danh sách vừa ẩn → focus về nút lùi (máy tính nút ẩn, `autoFocus` không có tác dụng). */}
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <button type="button" autoFocus className="link flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-[13px] lg:hidden" onClick={() => boChuRoi(dong)}>{t('‹ Công việc')}</button>
              <KhungTaiCho.Provider value>
                {theoDoiChon && <DaiTheoDoi it={chon} lam={!khoaPanel} onLam={() => setLamThay(chon.key)} />}
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
              </KhungTaiCho.Provider>
            </>
          ) : data && !data.scopeEmpty && dsNhom.length > 0 ? (
            <div className="card px-6 py-10 text-center text-sm text-slate-400">{t('Chọn một việc ở danh sách để làm tại đây.')}</div>
          ) : null}
        </div>
      </div>

      {/*
        PR-Ra, nợ PR-O (#58): lối cũ `?mo-viec=` (chuông, việc Vận hành giao cho GV) vẫn mở panel Vận hành — phủ trang như trước. Bấm dòng
        việc Vận hành ở danh sách nay mở tại chỗ (`viec=mgmt:{id}`).
      */}
      {/* OV-13q: Gia hạn sau thi ngay ở dòng việc — hộp nhỏ đè lên, không đổi việc đang mở. */}
      {giaHan && <HopGiaHan x={{ cycleId: giaHan.cycleId!, han: giaHan.due, daGiaHan: !!giaHan.daGiaHan }} hocVien={giaHan.studentName} lop={giaHan.classCode} onClose={() => setGiaHan(null)} />}
      <CreateTask open={giaoViec} onClose={() => setGiaoViec(false)} onDone={() => invalidate('/my-work')} branchId={branchId} />
      <NganViecVanHanh taskId={moViec} onClose={() => setParam('mo-viec', null)} onDone={() => invalidate('/my-work')} />
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
 * CHẾ ĐỘ THEO DÕI (brief 7, mockup `?k=ql`): việc của người khác — thân + chân panel chỉ xem (`DauViecCongViec.khoa`), Lịch sử / link vẫn mở.
 * Máy chủ báo `lamThay` (quyền thật: Case `SOS_EDIT`, điểm `editableSkills`) → "Làm thay" / "Nhập hộ" mở khoá; lưu qua đường thường (lịch sử ghi người làm).
 */
function DaiTheoDoi({ it, lam, onLam }: { it: WorkItem & { lamThay?: boolean }; lam: boolean; onLam: () => void }) {
  const ai = it.owner ?? t('người phụ trách');
  return (
    <div className="bao-chi-xem flex-wrap" role="status">
      <span aria-hidden>👁</span>
      <span className="min-w-0 flex-1">{lam ? t('Đang làm thay {ai}.', { ai }) : t('Việc của {ai} — chỉ theo dõi.', { ai })}</span>
      {!lam && it.lamThay && (
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={onLam}>{it.group === 'score' ? t('Nhập hộ') : t('Làm thay')}</button>
      )}
    </div>
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
