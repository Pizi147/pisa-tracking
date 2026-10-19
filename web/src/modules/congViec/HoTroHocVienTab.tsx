import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { BoLocDoan, Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhoiNhom } from '../../ui/HangNhom.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { NhomViec } from '../worklist/NhomViec.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { CreateTask, NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { HopChoDuyet } from '../duyet/HopChoDuyet.tsx';
import { YeuCauCuaToi } from '../duyet/YeuCauCuaToi.tsx';
import { LopToiDay } from '../worklist/LopToiDay.tsx';
import { ChonPhuTrach } from './ChonPhuTrach.tsx';
import { CongTacKhung, khungDaNho, nhoKhung, phamViCoHaiKhung, type KhungLoc } from '../../ui/CongTacKhung.tsx';
import { KhungTaiCho, coPanelDangSua } from '../../ui/KhungPanel.tsx';
import { PanelPhanCong, PanelViec, lamTaiCho, moCaDong } from './PanelViec.tsx';
import { DongDaLuu, GhiNhanh, type DaLuuNhanh } from '../cases/GhiNhanh.tsx';
import { HopGiaHan } from '../students/HopGiaHan.tsx';
import {
  LOC_NHANH_LABEL, NHOM_VIEC, NHOM_VIEC_LABEL, demLocNhanh, gomNhomViec, khoaGopCua, khopLocNhanh, nhomViecCua,
  LOC_NHANH, viecTuMo, type LocNhanh, type NhomViec as MaNhomViec,
  CHAM_CHEO, LOC_NGUOI_VIEC, LOC_NGUOI_VIEC_LABEL, demNguoiViec, khopNguoiViec, trongKhoiHomNay, tuanLich, type DemYeuCau, type LocNguoiViec,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Work = {
  summary: { total: number; overdue: number; today: number; mine: number };
  /** PR-GOP (§5): `dong` = dòng hiển thị (một lớp × một loại việc). Mọi số trên màn đếm DÒNG. PR-VN3: route không còn trả `items`, `groups`. */
  dong: WorkItem[]; scopeEmpty: boolean; xemNguoiKhac?: boolean;
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
  const [params, setParams] = useSearchParams();
  const macDinh = useChiNhanhMacDinh();
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  /* PR-OV2a: Admin (`nav.workChamDiem`) xem việc Chấm điểm của GV như Quản lý, chỉ nhóm đó (OV-12h bỏ Nhắc). */
  const chiChamDiem = !!session?.nav?.workChamDiem;
  const laQuanLy = !!session?.nav?.workOps || chiChamDiem;
  const nguoi = laQuanLy ? thamSoNguoi(params.get('nguoi')) : 'tat-ca';
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
  const { data, loading, error, reload } = useApi<Work>(url, [url]);

  const { homNay, ngan } = useNgayNghiepVu();
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
    const goc = gomNhomViec(theoKhung(hienThi).filter((it) => khopLocNhanh(it, loc, homNay) && (!nhom || nhomViecCua(it.group) === nhom)));
    const dem = new Map(gomNhomViec(cuoiItems).map((g) => [g.key, g]));
    const ds = goc.map((g) => ({ ...g, n: dem.get(g.key)?.n ?? 0, quaHan: dem.get(g.key)?.quaHan ?? 0, homNay: dem.get(g.key)?.homNay ?? 0 }));
    const cu = thuTuCu.current;
    if (!chon || !cu || cu.khoa !== khoaLoc) {
      thuTuCu.current = { khoa: khoaLoc, vt: new Map(ds.flatMap((g) => g.items).map((x, i) => [x.key, i])) };
      return ds;
    }
    /* Plan mục 4: em cuối của dòng gộp vừa xong (dòng tan thành việc lẻ, hoặc biến mất) đứng ở chỗ của dòng gộp cũ, không rơi xuống cuối nhóm. */
    const vt = (x: WorkItem) => cu.vt.get(x.key) ?? cu.vt.get(khoaGopCua(x as any) ?? '') ?? Number.MAX_SAFE_INTEGER;
    return ds.map((g) => ({ ...g, items: [...g.items].sort((a, b) => vt(a) - vt(b)) }));
  }, [hienThi, cuoiItems, khung, loai, loc, nhom, homNay, chon, khoaLoc]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* OV-15d: QL — nhóm Vận hành là "Việc quản lý" (Vận hành · Báo cáo đơn vị · Chốt lộ trình / Bàn giao), cuối danh sách, gập sẵn. */
  const dsNhomXem = useMemo(() => (laQuanLy && !chiChamDiem
    ? dsNhom.map((g) => (g.key === 'van-hanh' ? { ...g, label: t('Việc quản lý'), moSan: false } : g)) : dsNhom), [dsNhom, laQuanLy, chiChamDiem]);
  /* Đang lọc thì kết quả đã ít — mở hết luôn, không bắt bấm thêm một lần gập/mở nữa. */
  const moHet = loc !== 'tat-ca' || !!nhom;

  // ------------------------------------------------------------------ việc đang mở ở panel (URL `viec`)
  /* Thứ tự "việc tiếp": đúng thứ tự đang vẽ; dòng gộp thường đi vào từng em; bỏ việc mở trang và việc đã xong. */
  const thuTu = useMemo(() => dsNhom.flatMap((g) => g.items.flatMap((x) => (x.con && !moCaDong(x) ? x.con : [x]))).filter((x) => lamTaiCho(x)), [dsNhom]);
  /* Địa chỉ (không `viec`) lúc mở panel bằng một bước lịch sử — đóng chỉ lùi khi bộ lọc chưa đổi, không thì mất lựa chọn lọc vừa bấm. */
  const daDay = useRef<string | null>(null);
  const khongViec = (p: URLSearchParams) => { const x = new URLSearchParams(p); x.delete('viec'); return x.toString(); };
  const cuon = useRef(0);
  /*
   * OV-13b (mockup OV-13 §1): Kết quả PA ghi nhanh được (`ghiNhanh`) mở NGAY DƯỚI dòng — không panel phải; "Điều chỉnh / Kết thúc…" chuyển việc đó sang
   * panel lớn (`panelLon`). Lưu xong: dòng gập "✓ Đã lưu · … · Hoàn tác", việc kế tự mở.
   */
  const [panelLon, setPanelLon] = useState<ReadonlySet<string>>(new Set());
  const [daLuuNhanh, setDaLuuNhanh] = useState<ReadonlyMap<string, DaLuuNhanh>>(new Map());
  const laNhanh = (x: WorkItem) => x.group === 'ghi_ket_qua_pa' && !!x.ghiNhanh && !!x.paId && !panelLon.has(x.key);
  const mo = (it: WorkItem) => {
    if (!lamTaiCho(it)) { navigate(it.href); return; }
    const next = new URLSearchParams(params);
    next.set('viec', it.key);
    /* Mở từ danh sách: một bước lịch sử (nút Lùi của điện thoại về danh sách); đổi việc khi panel đang mở: thay tại chỗ. */
    if (viec) setParams(next, { replace: true });
    else {
      daDay.current = khongViec(params);
      const v = vungCuon();
      if (v && window.matchMedia(MAN_HEP).matches && !laNhanh(it)) { cuon.current = v.scrollTop; v.scrollTo(0, 0); }
      setParams(next);
    }
  };
  /* Hotfix 15/10 (L5): đổi dòng / "‹ Công việc" khi panel đang sửa dở → hỏi như ✕ của panel (`KhungPanel`). */
  const boDuocChu = () => !coPanelDangSua() || window.confirm(t('Bỏ nội dung đang gõ?'));
  const dong = () => {
    const lui = daDay.current !== null && daDay.current === khongViec(params);
    daDay.current = null;
    if (lui) navigate(-1);
    else setParam('viec', null);
  };
  /* Điện thoại: danh sách hiện lại (nút "‹ Công việc" hay nút Lùi) → về đúng chỗ cuộn cũ, SAU khi vẽ (trước đó cuộn neo theo nội dung panel). */
  const coChon = !!chon;
  const vuaCo = useRef(coChon);
  useLayoutEffect(() => {
    if (vuaCo.current && !coChon && window.matchMedia(MAN_HEP).matches) vungCuon()?.scrollTo(0, cuon.current);
    vuaCo.current = coChon;
  }, [coChon]);
  const viTri = thuTu.findIndex((x) => x.key === viec);
  const keTiep = thuTu.slice(viTri + 1).find((x) => !xong.has(x.key)) ?? null;
  const daLam = (it: WorkItem) => setGiu((m) => new Map(m).set(it.key, it));
  /*
   * OV-15d HÀNG ĐỢI (mockup 2 mục 2): việc đang mở đã lưu XONG (máy chủ không còn trả việc đó) → tự sang việc kế; một dải "✓ Xong … · ‹ việc vừa xong"
   * mở lại được. Chỉ sau lưu thành công: lưu lỗi thì việc vẫn còn trên máy chủ, panel giữ nguyên chữ đang gõ (nháp của panel).
   */
  const [vuaXong, setVuaXong] = useState<WorkItem | null>(null);
  const daTuSang = useRef<string | null>(null);
  useEffect(() => {
    if (!chon || !xong.has(chon.key) || daTuSang.current === chon.key) return;
    daTuSang.current = chon.key;
    setVuaXong(chon);
    if (keTiep) mo(keTiep); else setParam('viec', null);
  }, [chon, xong, keTiep]);   // eslint-disable-line react-hooks/exhaustive-deps
  /*
   * UX-2 (4): máy tính — chưa mở việc thì tự mở việc đầu có panel (thay khung trống); `replace`, không thêm bước lịch sử. Một lần mỗi bộ lọc
   * (`khoaLoc`): đóng panel / lưu xong không tự bật lại. Điện thoại, lọc ra 0 việc: không mở.
   */
  const daTuMo = useRef<string | null>(null);
  useEffect(() => {
    if (!data || data.scopeEmpty) return;
    const k = viecTuMo(thuTu.filter((x) => !laNhanh(x)), { manHep: window.matchMedia(MAN_HEP).matches, dangMo: !!viec, daTuMo: daTuMo.current === khoaLoc });
    daTuMo.current = khoaLoc;
    if (k) setParam('viec', k);
  }, [data, khoaLoc]);   // eslint-disable-line react-hooks/exhaustive-deps
  const moRong = (x: WorkItem) => {
    const kq = daLuuNhanh.get(x.key);
    if (kq) {
      return <DongDaLuu kq={kq} onHoanTac={() => { setDaLuuNhanh((m) => { const y = new Map(m); y.delete(x.key); return y; }); reload(); mo(x); }} />;
    }
    if (x.key !== viec || !laNhanh(x)) return null;
    return (
      <GhiNhanh key={x.key} paId={x.paId!} trongDong
        onDaLuu={(r) => { setDaLuuNhanh((m) => new Map(m).set(x.key, r)); daLam(x); reload(); if (keTiep) mo(keTiep); else setParam('viec', null); }}
        onMoPanel={() => setPanelLon((s) => new Set(s).add(x.key))} />
    );
  };

  // ------------------------------------------------------------------ lọc người + chip đang lọc (OV-15d, mockup 2 mục 3: 11 lựa chọn → 3)
  const [tenGv, setTenGv] = useState<string | null>(null);
  const [giaHan, setGiaHan] = useState<WorkItem | null>(null);
  const [phanCong, setPhanCong] = useState<number | null>(null);
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
    ...(loc !== 'tat-ca' && loc !== 'qua-han' ? [{ k: 'loc', nhan: LOC_NHANH_LABEL[loc], bo: () => setParam('loc', null) }] : []),
    ...(nhom || loai ? [{ k: 'nhom', nhan: loai ? TEN_LOAI[loai] ?? NHOM_VIEC_LABEL[nhomViecCua(loai)] : NHOM_VIEC_LABEL[nhom!], bo: () => {
      const next = new URLSearchParams(params); next.delete('nhom'); next.delete('loai'); setParams(next, { replace: true });
    } }] : []),
  ];
  /* Chờ bạn duyệt — cùng số badge menu (`/yeu-cau/dem`, `useApi` gộp GET đang bay). */
  const demDuyet = useApi<DemYeuCau>(session?.nav?.workApprove ? '/yeu-cau/dem' : null).data;
  const [moDuyet, setMoDuyet] = useState(true);
  /* "Chưa có người": việc có chủ mà chưa ai giữ (không tính chấm chéo — T18, không tính việc cả lớp như Chốt lộ trình). */
  const chuaCoNguoi = (x: WorkItem) => x.ownerId === null && !x.mine && !x.owner && x.classId !== null && !x.con
    && dich(x.statusLabel) !== CHAM_CHEO && !['chot_len_ft', 'xet_lai_lo_trinh', 'ky_vong_dau_ra', 'mgmt'].includes(x.group);
  const coVanHanh = !!session?.nav?.workOps && !chiChamDiem;
  const cuoiNhom = (key: string) => (key === 'van-hanh' && coVanHanh ? <LoiVanHanh cn={branchId} onGiao={() => setGiaoViec(true)} /> : null);
  /* Hàng đợi GV (mockup 2 mục 2): hết việc quá hạn + hạn tuần này → "Xong hết hôm nay ✓"; việc sau tuần này vẫn ở danh sách (gập). */
  const xongHet = !!data && !data.scopeEmpty && !coLoc && !tatCaViec.some((x) => trongKhoiHomNay(x, homNay));
  const tenGvChon = typeof nguoi === 'number' ? (tenGv ?? dsGoc.find((x) => x.ownerId === nguoi)?.owner ?? t('một GV')) : null;
  const laGv = !laQuanLy;
  const tenChao = (session?.user?.fullName ?? '').trim().split(/\s+/).pop() ?? '';

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  const nhanhChon = !!chon && laNhanh(chon);
  const anTrenDienThoai = chon && !nhanhChon ? 'max-lg:hidden' : '';
  return (
    <div className="space-y-3">
      <div className={`space-y-2.5 ${anTrenDienThoai}`}>
        {laGv ? (
          /* GV vào thẳng Công việc (OV-15d): lời chào + tuần như Tổng quan GV cũ. */
          <div className="flex flex-col gap-0.5">
            <h1 className="m-0 text-lg font-semibold text-slate-100">{tenChao ? t('Chào {ten}', { ten: tenChao }) : t('Công việc')}</h1>
            <span className="text-xs text-slate-500">{t('Tuần')}{' '}<b className="font-semibold tabular-nums text-slate-300">{tuanLich(homNay, homNay)}</b>{' '}{t('· hôm nay')}{' '}{ngan(homNay)}</span>
          </div>
        ) : <h1 className="m-0 text-lg font-semibold text-slate-100">{chiChamDiem ? t('Chấm điểm') : t('Công việc')}</h1>}
        <div className="flex flex-wrap items-center gap-2" data-hd="cv-loc-them">
          {laQuanLy && data && (
            <>
              {!chiChamDiem && <BoLocDoan ariaLabel={t('Việc của ai')} value={typeof nguoi === 'number' ? 'gv' : nguoi}
                onChange={(k) => setParam('nguoi', k === 'tat-ca' ? null : k)}
                muc={LOC_NGUOI_VIEC.map((k) => ({ key: k, nhan: LOC_NGUOI_VIEC_LABEL[k], so: typeof nguoi === 'number' ? null : demNguoi[k] }))} />}
              <ChonPhuTrach chiChonGv value={typeof nguoi === 'number' ? nguoi : 'tat-ca'} valueName={tenGvChon}
                onChange={(v, name) => { setTenGv(name ?? null); setParam('nguoi', v === 'tat-ca' ? null : String(v)); }} />
            </>
          )}
          {/* Chip "Quá hạn" lọc toàn bộ quá hạn (mọi nhóm) — số luôn hiện, bấm lại để bỏ. */}
          <button type="button" aria-pressed={loc === 'qua-han'} onClick={() => setParam('loc', loc === 'qua-han' ? null : 'qua-han')}
            className={`btn btn-sm min-h-[44px] tabular-nums sm:min-h-[32px] ${loc === 'qua-han' ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}>
            <span className="text-late">⚠ {demHan['qua-han'] ?? 0}</span>{' '}{t('quá hạn')}{loc === 'qua-han' && <span aria-hidden> ✕</span>}
          </button>
          {laGv && data && !data.scopeEmpty && (
            <span className="text-xs tabular-nums text-slate-400">{t('{n} việc đến hết {tuan}', { n: demHan['den-het-tuan'] ?? 0, tuan: tuanLich(homNay, homNay) })}</span>
          )}
          {!laGv && !!demDuyet?.cho && <span className="text-xs tabular-nums text-slate-400">{t('{n} chờ bạn duyệt', { n: demDuyet.cho })}</span>}
          {xong.size > 0 && <span className="text-xs tabular-nums text-ok">✓ {t('{n} xong hôm nay', { n: xong.size })}</span>}
          <span className="flex-1" />
          {haiKhung && <CongTacKhung trang="cong-viec" coTatCa value={khung} dem={{ ft: demKhung.ft, thuong: demKhung.thuong }} onChange={(k) => setParam('khung', k === 'tat-ca' ? null : k)} />}
          <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />
        </div>
        {chipLoc.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            {chipLoc.map((c) => (
              <button key={c.k} type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" title={t('Bỏ lọc')} onClick={c.bo}>{c.nhan} <span aria-hidden>✕</span></button>
            ))}
          </div>
        )}
      </div>

      {/* "Chờ bạn duyệt" đầu danh sách khi có thẻ (mockup 2 mục 3) — thẻ "Nếu duyệt: …", Duyệt · Từ chối… · Mở; ô tích chỉ loại duyệt hàng loạt được. */}
      {!!demDuyet?.cho && (
        <div className={`card px-3 py-1 ${anTrenDienThoai}`}>
          <KhoiNhom id="nhom-cho-duyet" mo={moDuyet} onMo={() => setMoDuyet((x) => !x)} nhan={t('Chờ bạn duyệt')} tieuDe={t('Chờ bạn duyệt')} dem={demDuyet.cho}
            phu={demDuyet.quaHan ? <span className="font-bold text-late">{t('⚠ {quaHan} quá hạn', { quaHan: demDuyet.quaHan })}</span> : null}>
            <div className="pb-3"><HopChoDuyet gon /></div>
          </KhoiNhom>
        </div>
      )}

      {/* ───────────────────────────────────────────────── danh sách trái · panel phải */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-3.5 xl:grid-cols-[560px_minmax(0,1fr)]">
        <div className={anTrenDienThoai}>
          {loading && !data && <Card><Skeleton rows={8} /></Card>}
          {data && data.scopeEmpty && <Card><Empty title={t('Bạn chưa được cấp phạm vi nào')} /></Card>}
          {xongHet && (
            /* Hết việc quá hạn + hạn tuần này: một dòng kết; việc sau tuần này vẫn ở danh sách dưới (gập). */
            <div className="card mb-3 px-4 py-3" role="status">
              <p className="m-0 text-base font-semibold text-ok">{t('Xong hết hôm nay ✓')}</p>
              <p className="m-0 text-xs text-slate-400">{t('Việc mới sẽ hiện ở đây khi có.')}</p>
            </div>
          )}
          {data && !data.scopeEmpty && dsNhom.length === 0 && !xongHet && (
            <Card><Empty title={coLoc ? t('Không có việc nào khớp bộ lọc') : t('Không có việc nào')} action={coLoc ? <button type="button" className="btn btn-sm" onClick={xoaLoc}>{t('Xoá lọc')}</button> : undefined} /></Card>
          )}
          {data && !data.scopeEmpty && dsNhom.length > 0 && (
            <Card bodyClass="p-0">
              <NhomViec nhom={dsNhomXem} soHien={10} moHet={moHet} onOpen={(x) => { if (x.key === viec || boDuocChu()) mo(x); }} chon={viec} xong={xong} moTrang={(x) => !lamTaiCho(x)} moRong={moRong} moCaDong={moCaDong}
                cuoiNhom={cuoiNhom}
                nutPhu={(x) => (!x.con && x.cycleId && (x.group === 'thi_that' || x.group === 'buoc_tiep') && !xong.has(x.key)
                  ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={() => setGiaHan(x)}>{t('Gia hạn')}</button>
                  /* Việc chưa có người: "Phân công…" mở Phân công GV môn của lớp (người phụ trách đi theo phân công) — chỉ QL. */
                  : laQuanLy && !chiChamDiem && chuaCoNguoi(x) && !xong.has(x.key)
                    ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={() => setPhanCong(x.classId)}>{t('Phân công…')}</button> : null)} />
            </Card>
          )}
          {coVanHanh && data && !dsNhom.some((g) => g.key === 'van-hanh') && (
            <div className="card mt-3 px-3 py-1"><LoiVanHanh cn={branchId} onGiao={() => setGiaoViec(true)} /></div>
          )}
          {laGv && data && !data.scopeEmpty && (
            <div className="mt-4 space-y-4">
              {session?.nav?.workRequests && <YeuCauCuaToi gon />}
              <LopToiDay />
            </div>
          )}
        </div>
        {/* Cột phải dính khi cuộn danh sách dài (mockup `.pn` sticky). */}
        <div className={`lg:sticky lg:top-3 ${chon && !nhanhChon ? 'space-y-2' : 'max-lg:hidden'}`}>
          {vuaXong && chon?.key !== vuaXong.key && (
            <div role="status" className="card flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1 truncate text-ok">✓ {t('Xong:')} {dich(vuaXong.tieuDe)}</span>
              <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0"
                onClick={() => { if (boDuocChu()) { daTuSang.current = vuaXong.key; mo(vuaXong); setVuaXong(null); } }}>{t('‹ việc vừa xong')}</button>
            </div>
          )}
          {chon && !nhanhChon ? (
            <>
              {/* Điện thoại: danh sách vừa ẩn → focus về nút lùi (máy tính nút ẩn, `autoFocus` không có tác dụng). */}
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <button type="button" autoFocus className="link flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-[13px] lg:hidden" onClick={() => { if (boDuocChu()) dong(); }}>{t('‹ Công việc')}</button>
              <KhungTaiCho.Provider value>
                <PanelViec key={chon.key} it={chon} onDong={dong} onDaLam={() => daLam(chon)} onTiep={keTiep ? () => mo(keTiep) : null}
                  onMo={(x) => { if (boDuocChu()) mo(x); }} />
              </KhungTaiCho.Provider>
            </>
          ) : data && !data.scopeEmpty && dsNhom.length > 0 ? (
            <Card><Empty title={t('Chọn một việc ở danh sách')} /></Card>
          ) : null}
        </div>
      </div>

      {/*
        PR-Ra, nợ PR-O (#58): lối cũ `?mo-viec=` (chuông, việc Vận hành giao cho GV) vẫn mở panel Vận hành — phủ trang như trước. Bấm dòng
        việc Vận hành ở danh sách nay mở tại chỗ (`viec=mgmt:{id}`).
      */}
      {/* OV-13q: Gia hạn sau thi ngay ở dòng việc — hộp nhỏ đè lên, không đổi việc đang mở. */}
      {giaHan && <HopGiaHan x={{ cycleId: giaHan.cycleId!, han: giaHan.due, daGiaHan: !!giaHan.daGiaHan }} hocVien={giaHan.studentName} lop={giaHan.classCode} onClose={() => setGiaHan(null)} />}
      {phanCong !== null && <PanelPhanCong classId={phanCong} onDong={() => setPhanCong(null)} onDaLam={() => { invalidate('/my-work'); reload(); }} />}
      <CreateTask open={giaoViec} onClose={() => setGiaoViec(false)} onDone={() => invalidate('/my-work')} branchId={branchId} />
      <NganViecVanHanh taskId={moViec} onClose={() => setParam('mo-viec', null)} onDone={() => invalidate('/my-work')} />
    </div>
  );
}

/** OV-15d: cuối nhóm "Việc quản lý" — "+ Giao việc" (hộp Giao việc sẵn có) và lối tới bảng Vận hành / Báo cáo đơn vị (màn đầy đủ). */
function LoiVanHanh({ cn, onGiao }: { cn: number | null; onGiao: () => void }) {
  const q = cn ? `?cn=${cn}` : '';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-[13px]">
      <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={onGiao}>{t('+ Giao việc')}</button>
      <Link to={`/cong-viec/van-hanh${q}`} className="link max-sm:py-3">{t('Vận hành ›')}</Link>
      <Link to={`/cong-viec/bao-cao${q}`} className="link max-sm:py-3">{t('Báo cáo đơn vị ›')}</Link>
    </div>
  );
}
