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
import { DongViec, type WorkItem } from '../worklist/WorkList.tsx';
import { CreateTask, NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { LopToiDay } from '../worklist/LopToiDay.tsx';
import { ChonPhuTrach } from './ChonPhuTrach.tsx';
import { phamViCoHaiKhung, type KhungLoc } from '../../ui/CongTacKhung.tsx';
import { KhungTaiCho, coPanelDangSua } from '../../ui/KhungPanel.tsx';
import { PanelPhanCong, PanelViec, lamTaiCho, moCaDong } from './PanelViec.tsx';
import { NhomBiTuChoi, NhomChoDuyet } from './NhomYeuCau.tsx';
import { DaiMoiDung } from '../huongDan/DaiMoiDung.tsx';
import { DongDaLuu, GhiNhanh, type DaLuuNhanh } from '../cases/GhiNhanh.tsx';
import { HopGiaHan } from '../students/HopGiaHan.tsx';
import {
  LOC_NHANH_LABEL, NHOM_VIEC, NHOM_VIEC_LABEL, chuaCoNguoi, demLocNhanh, demNguoi, demPhamVi, gomNhomViec, khoaGopCua, khopLocNhanh, khopNguoi,
  nhanNhomCongViec, nhomViecCua, sauTuanNay, tuanLich, viecSauKhiXong, LOC_NHANH, viecTuMo, type DemYeuCau, type LocNhanh, type NguoiViec, type NhomViec as MaNhomViec,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Work = {
  summary: { total: number; overdue: number; today: number; mine: number };
  /** PR-GOP (§5): `dong` = dòng hiển thị (một lớp × một loại việc). Mọi số trên màn đếm DÒNG. PR-VN3: route không còn trả `items`, `groups`. */
  dong: WorkItem[]; scopeEmpty: boolean; xemNguoiKhac?: boolean;
};

/** Tên loại việc mở từ Tổng quan bằng `loai=` (dòng "Đang xem"). */
const TEN_LOAI: Record<string, string> = { ghi_ket_qua_pa: t('Kết quả PA') };

/** OV-15d: trục người trên URL — `toi` · `gv` · một ID GV · vắng = Tất cả (link cũ `nguoi=tat-ca` cũng là Tất cả). */
const thamSoNguoi = (s: string | null): NguoiViec | number => {
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
 * CÔNG VIỆC — MỘT DANH SÁCH (OV-15d, mockup 2 mục 2–3; nền OV-5a làm tại chỗ). Bỏ 4 tab: "Chờ bạn duyệt" là nhóm đầu khi có thẻ, rồi các nhóm loại việc
 * (quá hạn trước, rồi hạn gần), "Việc quản lý" của QL gập sẵn ở cuối (+ Giao việc). Lọc một trục người (Của tôi · Của GV ▾ · Tất cả, mặc định Tất cả)
 * + chip "⚠ n quá hạn"; link cũ (`loc`, `nhom`, `loai`, `khung`) vẫn lọc, có dòng "Đang xem … Xoá lọc". Việc chưa có người: "Chưa có người" + Phân công….
 *
 * GV = hàng đợi (mockup 2 mục 2): Tổng quan GV gộp vào đây (lời chào, Lớp tôi dạy cuối trang); mở trang → panel tự mở việc đầu; LƯU XONG (máy chủ không
 * còn trả việc) → panel tự sang việc kế, dải "✓ Xong … · ‹ việc vừa xong"; lưu một phần / lỗi → ở lại, chữ đang gõ giữ ở panel. Việc sau tuần này gập
 * riêng; hết việc → "Xong hết hôm nay ✓". Danh sách trái · panel phải; điện thoại: bấm việc → màn đầy đủ có "‹ Công việc", về đúng chỗ cuộn cũ.
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
  const duocPhanCong = !!session?.nav?.workApprove;
  const nguoi = laQuanLy ? thamSoNguoi(params.get('nguoi')) : 'toi';
  const loc: LocNhanh = (LOC_NHANH as readonly string[]).includes(params.get('loc') ?? '') ? (params.get('loc') as LocNhanh) : 'tat-ca';
  /* PR-DUYET (K1-30): `nhom=`; link cũ `loai=` (một loại việc) vẫn đọc — quy về nhóm chứa loại đó. */
  const nhomTs = params.get('nhom') ?? (params.get('loai') ? nhomViecCua(params.get('loai')!) : null);
  const nhom: MaNhomViec | null = (NHOM_VIEC as readonly string[]).includes(nhomTs ?? '') ? (nhomTs as MaNhomViec) : null;
  /* OV-11f (TQ-2): `loai=` (từ Tổng quan) lọc ĐÚNG loại việc — số ở ô = số việc nơi mở. */
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
  /* OV-15d: QL / Quản trị đọc "Tất cả" MỘT lần (cờ `mine` chia Của tôi / Của GV ở web — ba số cùng một tập); một GV cụ thể: máy chủ dựng như GV đó thấy. */
  if (laQuanLy) qs.set('nguoi', typeof nguoi === 'number' ? String(nguoi) : 'tat-ca');
  const url = `/my-work${qs.toString() ? `?${qs}` : ''}`;
  const { data, loading, error, reload } = useApi<Work>(url, [url]);

  const { homNay, ngan } = useNgayNghiepVu();
  /* MH4: chương trình chỉ còn lọc qua link (`khung=`, từ Tổng quan) — không còn nút trên màn (OV-15d: thanh ngữ cảnh). */
  const khungUrl = params.get('khung');
  const khungChon: KhungLoc = khungUrl === 'ft' || khungUrl === 'thuong' ? khungUrl : 'tat-ca';
  const tatCaViec = useMemo(() => data?.dong ?? [], [data]);
  const haiKhung = (tatCaViec.some((it) => it.khung === 'ft') && tatCaViec.some((it) => it.khung === 'thuong')) || phamViCoHaiKhung();
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

  /* Bộ lọc nền (không phải hạn): khung (link) · loại (link) · người (Của tôi / Của GV). GV: việc sau tuần này tách khỏi hàng đợi. */
  const nguoiLoc: NguoiViec = !laQuanLy || typeof nguoi === 'number' ? 'tat-ca' : nguoi;   // GV: mọi việc máy chủ trả (kể cả việc chờ người khác của lớp mình)
  const nen = (it: WorkItem) => (khung === 'tat-ca' || !it.khung || it.khung === khung) && (!loai || it.group === loai);
  const theoKhung = useMemo(() => tatCaViec.filter(nen), [tatCaViec, khung, loai]);   // eslint-disable-line react-hooks/exhaustive-deps
  const demN = useMemo(() => demNguoi(theoKhung), [theoKhung]);
  const laSau = (it: WorkItem) => !laQuanLy && sauTuanNay(it, homNay);
  const khopNen = (it: WorkItem) => nen(it) && khopNguoi(it, nguoiLoc) && !laSau(it);
  const items = useMemo(() => tatCaViec.filter(khopNen), [tatCaViec, khung, loai, nguoiLoc, homNay]);   // eslint-disable-line react-hooks/exhaustive-deps
  const sau = useMemo(() => (laQuanLy ? [] : theoKhung.filter((it) => sauTuanNay(it, homNay))), [laQuanLy, theoKhung, homNay]);
  const demHan = useMemo(() => demLocNhanh(nhom ? items.filter((it) => nhomViecCua(it.group) === nhom) : items, 'tat-ca', homNay), [items, nhom, homNay]);
  const locItems = useMemo(() => items.filter((it) => khopLocNhanh(it, loc, homNay)), [items, loc, homNay]);
  const cuoiItems = useMemo(() => (nhom ? locItems.filter((it) => nhomViecCua(it.group) === nhom) : locItems), [locItems, nhom]);
  /* `viec` trỏ tới việc không có panel (đường cũ, gõ tay) → như chưa chọn. */
  const chon = useMemo(() => {
    const x = viec ? phang(hienThi).find((y) => y.key === viec) ?? [...giu.values()].find((y) => y.key === viec) ?? null : null;
    return x && lamTaiCho(x) ? x : null;
  }, [viec, hienThi, giu]);
  /*
   * Danh sách vẽ: cùng bộ lọc, cộng dòng đã làm giữ chỗ. OV-11c (CV-3): đang mở panel thì GIỮ THỨ TỰ lúc mở — dòng xong / làm một phần (hạn đổi) đứng
   * đúng chỗ cũ; việc mới xuống cuối nhóm. Đóng panel / đổi lọc thì sắp lại. Số đầu nhóm chỉ từ máy chủ (`cuoiItems`).
   */
  const thuTuCu = useRef<{ khoa: string; vt: Map<string, number> } | null>(null);
  const khoaLoc = `${url}|${khung}|${loc}|${nhom ?? ''}|${loai ?? ''}|${nguoiLoc}`;
  const dsNhom = useMemo(() => {
    const goc = gomNhomViec(hienThi.filter((it) => (khopNen(it) || (xong.has(it.key) && nen(it))) && khopLocNhanh(it, loc, homNay) && (!nhom || nhomViecCua(it.group) === nhom)));
    const dem = new Map(gomNhomViec(cuoiItems).map((g) => [g.key, g]));
    const ds = goc.map((g) => ({ ...g, n: dem.get(g.key)?.n ?? 0, quaHan: dem.get(g.key)?.quaHan ?? 0, homNay: dem.get(g.key)?.homNay ?? 0 }));
    const cu = thuTuCu.current;
    if (!chon || !cu || cu.khoa !== khoaLoc) {
      thuTuCu.current = { khoa: khoaLoc, vt: new Map(ds.flatMap((g) => g.items).map((x, i) => [x.key, i])) };
      return ds;
    }
    /* Plan mục 4: em cuối của dòng gộp vừa xong đứng ở chỗ của dòng gộp cũ, không rơi xuống cuối nhóm. */
    const vt = (x: WorkItem) => cu.vt.get(x.key) ?? cu.vt.get(khoaGopCua(x as any) ?? '') ?? Number.MAX_SAFE_INTEGER;
    return ds.map((g) => ({ ...g, items: [...g.items].sort((a, b) => vt(a) - vt(b)) }));
  }, [hienThi, cuoiItems, khung, loai, loc, nhom, nguoiLoc, homNay, chon, khoaLoc, xong]);   // eslint-disable-line react-hooks/exhaustive-deps
  const phamVi = useMemo(() => demPhamVi(cuoiItems, nhom === 'cham-diem' || chiChamDiem, { loc, homNay }), [cuoiItems, nhom, chiChamDiem, loc, homNay]);
  /* Đang lọc thì kết quả đã ít — mở hết luôn. */
  const moHet = loc !== 'tat-ca' || !!nhom;

  // ------------------------------------------------------------------ việc đang mở ở panel (URL `viec`)
  /* Thứ tự "việc tiếp": đúng thứ tự đang vẽ; dòng gộp thường đi vào từng em; bỏ việc mở trang. */
  const thuTu = useMemo(() => dsNhom.flatMap((g) => g.items.flatMap((x) => (x.con && !moCaDong(x) ? x.con : [x]))).filter((x) => lamTaiCho(x)), [dsNhom]);
  /* Địa chỉ (không `viec`) lúc mở panel bằng một bước lịch sử — đóng chỉ lùi khi bộ lọc chưa đổi. */
  const daDay = useRef<string | null>(null);
  const khongViec = (p: URLSearchParams) => { const x = new URLSearchParams(p); x.delete('viec'); return x.toString(); };
  const cuon = useRef(0);
  /* OV-13b: Kết quả PA ghi nhanh được (`ghiNhanh`) mở NGAY DƯỚI dòng; "Điều chỉnh / Kết thúc…" chuyển sang panel lớn (`panelLon`). */
  const [panelLon, setPanelLon] = useState<ReadonlySet<string>>(new Set());
  const [daLuuNhanh, setDaLuuNhanh] = useState<ReadonlyMap<string, DaLuuNhanh>>(new Map());
  const laNhanh = (x: WorkItem) => x.group === 'ghi_ket_qua_pa' && !!x.ghiNhanh && !!x.paId && !panelLon.has(x.key);
  /* OV-15d: Phân công… (việc chưa có người) — panel Phân công GV môn của lớp ở cột phải, thay panel việc. */
  const [phanCong, setPhanCong] = useState<number | null>(null);
  const mo = (it: WorkItem) => {
    setPhanCong(null);
    if (!lamTaiCho(it)) { navigate(it.href); return; }
    const next = new URLSearchParams(params);
    next.set('viec', it.key);
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
  /* Điện thoại: danh sách hiện lại → về đúng chỗ cuộn cũ, SAU khi vẽ. */
  const coPanel = (!!chon && !laNhanh(chon)) || phanCong !== null;
  const vuaCo = useRef(coPanel);
  useLayoutEffect(() => {
    if (vuaCo.current && !coPanel && window.matchMedia(MAN_HEP).matches) vungCuon()?.scrollTo(0, cuon.current);
    vuaCo.current = coPanel;
  }, [coPanel]);
  const viTri = thuTu.findIndex((x) => x.key === viec);
  const keTiep = thuTu.slice(viTri + 1).find((x) => !xong.has(x.key)) ?? null;
  const daLam = (it: WorkItem) => setGiu((m) => new Map(m).set(it.key, it));
  /*
   * OV-15d (hàng đợi): việc đang mở vừa XONG (máy chủ không còn trả sau lần lưu thành công) → panel tự sang việc kế + dải "✓ Xong … · ‹ việc vừa xong".
   * Lưu một phần / lỗi: máy chủ vẫn trả việc → ở lại. Mở lại "việc vừa xong" thì không tự nhảy nữa.
   */
  const [vuaXong, setVuaXong] = useState<WorkItem | null>(null);
  useEffect(() => {
    if (!viec || !chon || laNhanh(chon) || vuaXong?.key === viec) return;
    const k = viecSauKhiXong(thuTu, viec, xong);
    if (k === undefined) return;
    setVuaXong(chon);
    const ke = k ? thuTu.find((x) => x.key === k) : null;
    if (ke) mo(ke); else setParam('viec', null);
  }, [xong]);   // eslint-disable-line react-hooks/exhaustive-deps
  /*
   * UX-2 (4): máy tính — chưa mở việc thì tự mở việc đầu có panel; `replace`. Một lần mỗi bộ lọc (`khoaLoc`). Điện thoại / 0 việc: không mở.
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

  // ------------------------------------------------------------------ lọc + dòng phạm vi
  const [tenGv, setTenGv] = useState<string | null>(null);
  const [giaHan, setGiaHan] = useState<WorkItem | null>(null);
  const [giaoViec, setGiaoViec] = useState(false);
  const coLoc = loc !== 'tat-ca' || !!nhom || !!loai || khung !== 'tat-ca';
  const xoaLoc = () => {
    const next = new URLSearchParams(params);
    for (const k of ['loc', 'nhom', 'loai', 'khung']) next.delete(k);
    setParams(next, { replace: true });
  };
  const ai = typeof nguoi === 'number' ? (tenGv ?? tatCaViec.find((x) => x.ownerId === nguoi)?.owner ?? t('một GV'))
    : nguoi === 'toi' ? t('Của tôi') : nguoi === 'gv' ? t('Của GV') : t('Tất cả');
  const dangXem = [ai, loc === 'tat-ca' ? null : LOC_NHANH_LABEL[loc], loai ? TEN_LOAI[loai] ?? (nhom ? NHOM_VIEC_LABEL[nhom] : null) : nhom ? NHOM_VIEC_LABEL[nhom] : null,
    khung === 'ft' ? 'Fast Track' : khung === 'thuong' ? t('Lớp thường') : null].filter(Boolean).join(' · ');
  const quaHan = demHan['qua-han'];

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  const anTrenDienThoai = coPanel ? 'max-lg:hidden' : '';
  const chipQuaHan = (
    <button type="button" data-hd="cv-qua-han" aria-pressed={loc === 'qua-han'} disabled={!quaHan && loc !== 'qua-han'} onClick={() => setParam('loc', loc === 'qua-han' ? null : 'qua-han')}
      className={`btn btn-sm min-h-[44px] tabular-nums sm:min-h-[32px] ${loc === 'qua-han' ? 'border-[color:var(--accent)] text-slate-100' : ''} ${quaHan ? 'font-bold text-late' : ''}`}>
      {quaHan ? t('⚠ {quaHan} quá hạn', { quaHan }) : t('0 quá hạn')}{loc === 'qua-han' && <span aria-hidden> ✕</span>}
    </button>
  );
  const ten = (session?.user?.fullName ?? '').trim().split(/\s+/).pop() ?? '';
  const tuanNay = tuanLich(homNay, homNay);
  const nutPhu = (x: WorkItem) => {
    if (xong.has(x.key)) return null;
    if (duocPhanCong && !x.con && chuaCoNguoi(x)) {
      return <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={() => { setPhanCong(x.classId); setParam('viec', null); }}>{t('Phân công…')}</button>;
    }
    if (!x.con && x.cycleId && (x.group === 'thi_that' || x.group === 'buoc_tiep')) {
      return <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[28px]" onClick={() => setGiaHan(x)}>{t('Gia hạn')}</button>;
    }
    return null;
  };
  /* GV: hết việc quá hạn + hạn tới hết tuần này (không lọc) → một dòng kết. */
  const xongHet = !laQuanLy && !!data && !data.scopeEmpty && !coLoc && items.length === 0;
  return (
    <div className="space-y-3">
      {/* ───────────────────────────────────────────────── đầu trang: QL lọc người + Quá hạn; GV lời chào + tóm tắt (mockup 2) */}
      <div className={`space-y-2.5 ${anTrenDienThoai}`}>
        {laQuanLy ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="m-0 mr-1 text-lg font-semibold text-slate-100">{t('Công việc')}</h1>
            {data && !chiChamDiem && (
              <span data-hd="cv-nguoi"><BoLocDoan ariaLabel={t('Việc của ai')} value={typeof nguoi === 'number' ? 'gv' : nguoi}
                onChange={(k) => setParam('nguoi', k === 'tat-ca' ? null : k)}
                muc={[{ key: 'toi', nhan: t('Của tôi'), so: demN.toi }, { key: 'gv', nhan: t('Của GV'), so: demN.gv }, { key: 'tat-ca', nhan: t('Tất cả'), so: demN['tat-ca'] }]} /></span>
            )}
            {data && (chiChamDiem || nguoi === 'gv' || typeof nguoi === 'number') && (
              <ChonPhuTrach chiChonGv value={typeof nguoi === 'number' ? nguoi : 'tat-ca'} valueName={typeof nguoi === 'number' ? tenGv : null}
                onChange={(v, name) => { setTenGv(name ?? null); setParam('nguoi', typeof v === 'number' ? String(v) : chiChamDiem ? null : 'gv'); }} />
            )}
            <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />
            <span className="flex-1" />
            {data && chipQuaHan}
            {duocPhanCong && <SoChoDuyet />}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
              <div className="flex flex-col gap-0.5">
                <h1 className="m-0 text-lg font-semibold text-slate-100">{ten ? t('Chào {ten}', { ten }) : t('Công việc')}</h1>
                <span className="text-xs text-slate-500">{t('Tuần')}{' '}<b className="font-semibold tabular-nums text-slate-300">{tuanNay}</b>{' '}{t('· hôm nay')}{' '}{ngan(homNay)}</span>
              </div>
              <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />
            </div>
            <DaiMoiDung />
            {data && !data.scopeEmpty && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-slate-400 tabular-nums" aria-live="polite">
                {chipQuaHan}
                <span><b className="font-semibold text-slate-200">{demHan['hom-nay']}</b>{' '}{t('hạn hôm nay')}</span>
                <span><b className="font-semibold text-slate-200">{items.length}</b>{' '}{t('việc đến hết {tuan}', { tuan: tuanNay })}</span>
                {xong.size > 0 && <span className="font-semibold text-done">{t('✓ {n} xong hôm nay', { n: xong.size })}</span>}
              </div>
            )}
          </>
        )}
        {data && !data.scopeEmpty && coLoc && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-slate-400" aria-live="polite">
            <span>{t('Đang xem:')}{' '}<b className="font-semibold text-slate-200">{dangXem}</b></span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{t('{nhom} việc · {so} {donVi}', { nhom: phamVi.nhom, so: phamVi.so, donVi: phamVi.donVi })}</span>
            <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={xoaLoc}>{t('Xoá lọc')}</button>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────── danh sách trái · panel phải */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-3.5 xl:grid-cols-[560px_minmax(0,1fr)]">
        <div className={`space-y-3 ${anTrenDienThoai}`}>
          {loading && !data && <Card><Skeleton rows={8} /></Card>}
          {data && data.scopeEmpty && <Card><Empty title={t('Bạn chưa được cấp phạm vi nào')} /></Card>}
          {xongHet && (
            <Card><div className="px-4 py-5">
              <p className="m-0 text-base font-semibold text-done">{t('Xong hết hôm nay ✓')}</p>
              <p className="m-0 mt-1 text-xs text-slate-500">{t('Việc mới sẽ hiện ở đây khi có.')}</p>
            </div></Card>
          )}
          {data && !data.scopeEmpty && (
            <Card bodyClass="p-0">
              {duocPhanCong && !coLoc && nguoi !== 'gv' && typeof nguoi !== 'number' && <NhomChoDuyet />}
              {dsNhom.length > 0 ? (
                <NhomViec nhom={dsNhom} soHien={10} moHet={moHet} onOpen={(x) => { if (x.key === viec || boDuocChu()) mo(x); }} chon={viec} xong={xong}
                  moTrang={(x) => !lamTaiCho(x)} moRong={moRong} moCaDong={moCaDong} nutPhu={nutPhu}
                  nhanNhom={(g) => nhanNhomCongViec(g.key, !!session?.nav?.workOps)}
                  gapSan={session?.nav?.workOps ? GAP_QUAN_LY : undefined}
                  dauThem={(g) => (g.key === 'van-hanh' && session?.nav?.workOps ? (
                    <span className="flex flex-wrap items-center gap-x-2 font-normal">
                      <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[26px]" onClick={() => setGiaoViec(true)}>{t('+ Giao việc')}</button>
                      <Link to="/cong-viec/van-hanh" className="link">{t('Vận hành ›')}</Link>
                      {session?.nav?.workReports && <Link to="/cong-viec/bao-cao" className="link">{t('Báo cáo đơn vị ›')}</Link>}
                    </span>
                  ) : null)} />
              ) : !xongHet && (
                <Empty title={coLoc ? t('Không có việc nào khớp bộ lọc') : t('Không có việc nào')} action={coLoc ? <button type="button" className="btn btn-sm" onClick={xoaLoc}>{t('Xoá lọc')}</button> : undefined} />
              )}
              {!laQuanLy && <NhomBiTuChoi />}
              {sau.length > 0 && <NhomSau items={sau} onOpen={(x) => { if (x.key === viec || boDuocChu()) mo(x); }} chon={viec} xong={xong} />}
            </Card>
          )}
        </div>
        {/* Cột phải dính khi cuộn danh sách dài (mockup `.pn` sticky). */}
        <div className={`lg:sticky lg:top-3 ${coPanel ? 'space-y-2' : 'max-lg:hidden'}`}>
          {vuaXong && coPanel && vuaXong.key !== viec && (
            <div role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2 text-[13px]" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
              <span className="min-w-0 flex-1 truncate text-slate-300"><b className="font-semibold text-done">{t('✓ Xong:')}</b>{' '}{dich(vuaXong.tieuDe)}{vuaXong.classCode ? ` · ${vuaXong.classCode}` : ''}</span>
              <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={() => { if (boDuocChu()) mo(vuaXong); }}>{t('‹ việc vừa xong')}</button>
            </div>
          )}
          {coPanel ? (
            <>
              {/* Điện thoại: danh sách vừa ẩn → focus về nút lùi (máy tính nút ẩn). */}
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <button type="button" autoFocus className="link flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-[13px] lg:hidden"
                onClick={() => { if (!boDuocChu()) return; if (phanCong !== null) setPhanCong(null); else dong(); }}>{t('‹ Công việc')}</button>
              <KhungTaiCho.Provider value>
                {phanCong !== null ? (
                  <PanelPhanCong key={`pc:${phanCong}`} classId={phanCong} onDong={() => setPhanCong(null)} onDaLam={() => { invalidate('/my-work'); reload(); }} />
                ) : chon && (
                  <PanelViec key={chon.key} it={chon} onDong={dong} onDaLam={() => daLam(chon)} onTiep={keTiep ? () => mo(keTiep) : null}
                    onMo={(x) => { if (boDuocChu()) mo(x); }} />
                )}
              </KhungTaiCho.Provider>
            </>
          ) : data && !data.scopeEmpty && dsNhom.length > 0 ? (
            <Card><Empty title={t('Chọn một việc ở danh sách')} /></Card>
          ) : null}
        </div>
      </div>

      {/* Tổng quan GV gộp vào Công việc (mockup 2 mục 2): Lớp tôi dạy cuối trang. */}
      {!laQuanLy && <div className={anTrenDienThoai}><LopToiDay /></div>}

      {/* OV-13q: Gia hạn sau thi ngay ở dòng việc — hộp nhỏ đè lên, không đổi việc đang mở. */}
      {giaHan && <HopGiaHan x={{ cycleId: giaHan.cycleId!, han: giaHan.due, daGiaHan: !!giaHan.daGiaHan }} hocVien={giaHan.studentName} lop={giaHan.classCode} onClose={() => setGiaHan(null)} />}
      {/* PR-Ra, nợ PR-O (#58): lối cũ `?mo-viec=` (chuông, việc Vận hành giao cho GV) vẫn mở panel Vận hành. */}
      <NganViecVanHanh taskId={moViec} onClose={() => setParam('mo-viec', null)} onDone={() => invalidate('/my-work')} />
      <CreateTask open={giaoViec} onClose={() => setGiaoViec(false)} onDone={() => invalidate('/my-work')} branchId={branchId} />
    </div>
  );
}

/** QL: "Việc quản lý" (Vận hành + Báo cáo đơn vị + Chốt lộ trình / Bàn giao) gập sẵn ở cuối (mockup 2 mục 3). */
const GAP_QUAN_LY: ReadonlySet<string> = new Set(['van-hanh']);

/** Số "n chờ bạn duyệt" đầu trang QL — cùng số badge Công việc (`/yeu-cau/dem`). */
function SoChoDuyet() {
  const dem = useApi<DemYeuCau>('/yeu-cau/dem').data;
  if (!dem?.cho) return null;
  return <span className="text-[13px] tabular-nums text-slate-400"><b className="font-semibold text-slate-200">{dem.cho}</b>{' '}{t('chờ bạn duyệt')}</span>;
}

/** GV: việc có hạn sau tuần này — một nhóm gập sẵn cuối danh sách (mockup 2 mục 2). */
function NhomSau({ items, onOpen, chon, xong }: { items: WorkItem[]; onOpen: (x: WorkItem) => void; chon: string | null; xong: ReadonlySet<string> }) {
  const [mo, setMo] = useState(false);
  return (
    <KhoiNhom id="nhom-sau-tuan-nay" mo={mo} onMo={() => setMo(!mo)} nhan={t('Sau tuần này')} tieuDe={t('Sau tuần này')} dem={items.length}>
      <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
        {items.map((it) => <li key={it.key}><DongViec gon it={it} onOpen={onOpen} chon={chon} xong={xong} moTrang={!it.con && !lamTaiCho(it)} conMoTrang={(x) => !lamTaiCho(x)} moCaDong={moCaDong} /></li>)}
      </ul>
    </KhoiNhom>
  );
}
