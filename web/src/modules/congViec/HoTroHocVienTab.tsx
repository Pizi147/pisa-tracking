import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { BoLocDoan, Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, useChiNhanhMacDinh, type Branch } from '../../ui/Filters.tsx';
import { fmtTime } from '../../lib/format.ts';
import { NhomViec } from '../worklist/NhomViec.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { ChonPhuTrach, type NguoiPhuTrach } from './ChonPhuTrach.tsx';
import { CongTacKhung, khungDaNho, nhoKhung, type KhungLoc } from '../../ui/CongTacKhung.tsx';
import { KhungTaiCho } from '../../ui/KhungPanel.tsx';
import { PanelViec, lamTaiCho } from './PanelViec.tsx';
import {
  LOC_NHANH_LABEL, NHOM_VIEC, NHOM_VIEC_LABEL, TRAN_HANG_LOAT, demLocNhanh, demNhomChip, demPhamVi, gomNhomViec, khoaGopCua, khopLocNhanh, lapNhacTatCa, nhomViecCua,
  tomTatKetQuaHangLoat, LOC_NHANH, type LocNhanh, type NhomViec as MaNhomViec,
} from '@shared/domain/index.ts';

type Work = {
  summary: { total: number; overdue: number; today: number; mine: number };
  /** PR-GOP (§5): `dong` = dòng hiển thị (một lớp × một loại việc). Mọi số trên màn đếm DÒNG. PR-VN3: route không còn trả `items`, `groups`. */
  dong: WorkItem[]; scopeEmpty: boolean; xemNguoiKhac?: boolean;
};

/** Tên loại việc mở từ Tổng quan bằng `loai=` (dòng "Đang xem"). */
const TEN_LOAI: Record<string, string> = { ghi_ket_qua_pa: 'Kết quả PA' };

const thamSoNguoi = (s: string | null): NguoiPhuTrach => {
  if (s === 'toi') return 'toi';
  if (s && /^[1-9]\d*$/.test(s)) return Number(s);
  return 'tat-ca';
};
/** Hàng hạn chính (mockup M1 §1): bốn ô; "Đến hết tuần" (lối từ Tổng quan) chỉ hiện khi đang chọn. */
const HAN_CHINH: LocNhanh[] = ['tat-ca', 'qua-han', 'hom-nay', 'tuan-nay'];
const MAN_HEP = '(max-width: 1023px)';
/** Vùng cuộn của trang là `<main id="noi-dung">` (App.tsx), không phải cửa sổ. */
const vungCuon = () => document.getElementById('noi-dung');
/** Mọi việc của danh sách — dòng và từng em trong dòng gộp. */
const phang = (ds: readonly WorkItem[]) => ds.flatMap((x) => [x, ...(x.con ?? [])]);

/**
 * CÔNG VIỆC › HỖ TRỢ HỌC VIÊN — LÀM TẠI CHỖ (OV-5a, đặc tả OV mục 4, mockup M1 §1–§2).
 *
 * Lọc HAI TẦNG: hàng chính Của tôi / Của GV (QL, Quản trị) · hạn có số · Chi nhánh; "Lọc thêm" (Chương trình · Nhóm việc · Của một GV, số bộ lọc
 * đang bật). Dòng phạm vi luôn hiện ("Đang xem: … · n nhóm việc · m học viên") + Xoá lọc. Mọi bộ lọc + việc đang mở (`viec`) nằm trên URL.
 *
 * Danh sách trái (560 px) · panel phải xử lý việc đang chọn (`PanelViec`, panel sẵn có đặt tại chỗ qua `KhungTaiCho`); bấm việc khác → panel đổi.
 * Lưu xong: dòng đứng nguyên chỗ, mờ + gạch khi máy chủ không còn trả việc đó (`giu`); panel giữ; chỉ "· việc tiếp ›" chuyển việc. Số đếm chỉ từ
 * `/my-work` (cùng badge). Điện thoại (< 1024 px): bấm việc → màn đầy đủ có "‹ Công việc", về đúng chỗ cuộn cũ. Chốt lộ trình / Kết quả đầu ra
 * và việc chưa có panel mở trang như cũ.
 */
export function HoTroHocVienTab() {
  const { session } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const macDinh = useChiNhanhMacDinh();
  const branchId = params.get('cn') ? Number(params.get('cn')) : macDinh;
  /* PR-OV2a: Admin (`nav.workChamDiem`) xem + Nhắc việc Chấm điểm của GV như Quản lý, chỉ nhóm đó. */
  const chiChamDiem = !!session?.nav?.workChamDiem;
  const laQuanLy = !!session?.nav?.workOps || chiChamDiem;
  const nguoi = laQuanLy ? thamSoNguoi(params.get('nguoi')) : 'toi';
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
  /* GV không gửi `nguoi` — `/my-work` không tham số giữ NGUYÊN hành vi cũ (Q3). */
  if (laQuanLy && nguoi !== 'toi') qs.set('nguoi', String(nguoi));
  const url = `/my-work${qs.toString() ? `?${qs}` : ''}`;
  const { data, loading, error, reload, setData } = useApi<Work>(url, [url]);
  const branches = useApi<Branch[]>('/ref/branches').data;

  const { homNay } = useNgayNghiepVu();
  /*
   * MH4, K1-30 (Q3): khung (nay là "Chương trình" ở Lọc thêm), mặc định Tất cả. Tham số `khung` trên đường dẫn thắng, rồi lựa chọn đã nhớ trên máy.
   * Việc không gắn lớp (`khung` null) hiện ở mọi khung. Lọc khung đứng TRƯỚC mọi bộ lọc khác, nên số trên chip hạn / nhóm đếm theo khung.
   */
  const khungUrl = params.get('khung');
  const khungChon: KhungLoc = khungUrl === 'ft' || khungUrl === 'thuong' || khungUrl === 'tat-ca' ? khungUrl : khungDaNho('cong-viec') ?? 'tat-ca';
  const tatCaViec = useMemo(() => data?.dong ?? [], [data]);
  const demKhung = useMemo(() => ({
    'tat-ca': tatCaViec.length,
    ft: tatCaViec.filter((it) => it.khung === 'ft').length,
    thuong: tatCaViec.filter((it) => it.khung === 'thuong').length,
  }), [tatCaViec]);
  /* Chỉ một khung có việc thì công tắc ẩn — khi đó không lọc (lựa chọn đã nhớ không được giấu mất việc). */
  const khung: KhungLoc = demKhung.ft > 0 && demKhung.thuong > 0 ? khungChon : 'tat-ca';

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
  /* PR-UXF-a F5: hàng Nhóm việc đếm bằng hàm thuần chung (`demNhomChip`) — "Tất cả" = Σ nhóm = ô "Tất cả" của hạn khi không lọc. */
  const demNhom = useMemo(() => demNhomChip(items, loc, homNay), [items, loc, homNay]);
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
    const vt = (x: WorkItem) => cu.vt.get(x.key) ?? Number.MAX_SAFE_INTEGER;
    return ds.map((g) => ({ ...g, items: [...g.items].sort((a, b) => vt(a) - vt(b)) }));
  }, [hienThi, cuoiItems, khung, loai, loc, nhom, homNay, chon, khoaLoc]);   // eslint-disable-line react-hooks/exhaustive-deps
  const phamVi = useMemo(() => demPhamVi(cuoiItems, nhom === 'cham-diem' || chiChamDiem, { loc, homNay }), [cuoiItems, nhom, chiChamDiem, loc, homNay]);
  /* Đang lọc thì kết quả đã ít — mở hết luôn, không bắt bấm thêm một lần gập/mở nữa. */
  const moHet = loc !== 'tat-ca' || !!nhom;

  // ------------------------------------------------------------------ việc đang mở ở panel (URL `viec`)
  /* Thứ tự "việc tiếp": đúng thứ tự đang vẽ; dòng gộp thường đi vào từng em; bỏ việc mở trang và việc đã xong. */
  const thuTu = useMemo(() => dsNhom.flatMap((g) => g.items.flatMap((x) => (x.con && !x.gopThem ? x.con : [x]))).filter((x) => lamTaiCho(x)), [dsNhom]);
  /* Địa chỉ (không `viec`) lúc mở panel bằng một bước lịch sử — đóng chỉ lùi khi bộ lọc chưa đổi, không thì mất lựa chọn lọc vừa bấm. */
  const daDay = useRef<string | null>(null);
  const khongViec = (p: URLSearchParams) => { const x = new URLSearchParams(p); x.delete('viec'); return x.toString(); };
  const cuon = useRef(0);
  const mo = (it: WorkItem) => {
    if (!lamTaiCho(it)) { navigate(it.href); return; }
    const next = new URLSearchParams(params);
    next.set('viec', it.key);
    /* Mở từ danh sách: một bước lịch sử (nút Lùi của điện thoại về danh sách); đổi việc khi panel đang mở: thay tại chỗ. */
    if (viec) setParams(next, { replace: true });
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

  // ------------------------------------------------------------------ Nhắc (QL / Quản trị, Của GV)
  const [dangNhac, setDangNhac] = useState<Record<string, boolean>>({});
  /*
   * OV-11c (TQ-1): việc được nhắc khi bấm Nhắc một dòng — đang lọc hạn thì dòng gộp nhắc đúng các việc con khớp lọc (lọc Quá hạn chỉ nhắc bài quá hạn);
   * cả dòng khớp lọc thì nhắc khoá dòng (một chuông). Cùng luật cho "Nhắc tất cả".
   */
  const viecNhac = (x: WorkItem): WorkItem[] => {
    if (loc === 'tat-ca' || !x.con || x.gopThem) return [x];
    const khop = x.con.filter((c) => khopLocNhanh(c, loc, homNay));
    return khop.length === x.con.length ? [x] : khop;
  };
  const bamNhac = async (it: WorkItem) => {
    if (!it.nhac || dangNhac[it.key]) return;
    setDangNhac((s) => ({ ...s, [it.key]: true }));
    try {
      const ds = viecNhac(it);
      const daNhacLuc = ds.length === 1 && ds[0].key === it.key
        ? (await api.post<{ daNhacLuc: string }>('/my-work/nhac', { key: it.key, ownerId: it.nhac.ownerId })).daNhacLuc
        : await (async () => {
          const r = await api.post<{ ok: { daNhacLuc: string }[]; loi: { loi: string }[] }>('/my-work/nhac-nhieu', { viec: ds.map((c) => ({ key: c.key, ownerId: it.nhac!.ownerId })) });
          if (!r.ok.length) throw new Error(r.loi[0]?.loi ?? 'Không nhắc được.');
          return r.ok[0].daNhacLuc;
        })();
      setData((prev) => (prev
        ? { ...prev, dong: prev.dong.map((x) => (x.key === it.key ? { ...x, nhac: { ...x.nhac!, daNhacLuc } } : x)) }
        : prev) as Work);
    } catch (e: any) { toast.push('error', e.message); } finally { setDangNhac((s) => ({ ...s, [it.key]: false })); }
  };

  /*
   * VIEC-NHO-2: "Nhắc tất cả (n)" — n = việc ĐANG THẤY (mọi bộ lọc) có nút Nhắc, trừ đã nhắc hôm nay và việc vừa nhắc lỗi (bấm lại cũng
   * lỗi y hệt; 503 "chưa kịp" thì tính lại). Hỏi lại trước khi gửi; máy chủ tự kiểm lại từng dòng, không nhắc lặp.
   */
  const [nhacLoi, setNhacLoi] = useState<Set<string>>(new Set());
  const [hoiNhac, setHoiNhac] = useState(false);
  useEffect(() => { setNhacLoi(new Set()); }, [url]);
  const [dangNhacHet, setDangNhacHet] = useState(false);
  const khoaNhac = (key: string, ownerId: number) => `${ownerId}|${key}`;
  const nhacNguon = useMemo(() => cuoiItems.flatMap(viecNhac), [cuoiItems, loc, homNay]);   // eslint-disable-line react-hooks/exhaustive-deps
  const nhacHet = useMemo(
    () => lapNhacTatCa(nhacNguon.filter((it) => !it.nhac || !nhacLoi.has(khoaNhac(it.key, it.nhac.ownerId)))),
    [nhacNguon, nhacLoi],
  );
  const coNutNhacHet = laQuanLy && nguoi !== 'toi' && nhacHet.tong > 0;

  const nhacTatCa = async () => {
    setHoiNhac(false);
    if (dangNhacHet || !nhacHet.gui.length) return;
    setDangNhacHet(true);
    type Dong = { key: string; ownerId: number };
    try {
      const r = await api.post<{ ok: (Dong & { daNhacLuc: string })[]; loi: (Dong & { loi: string; ma: number })[] }>(
        '/my-work/nhac-nhieu', { viec: nhacHet.gui.map((it) => ({ key: it.key, ownerId: it.nhac!.ownerId })) });
      const luc = new Map(r.ok.map((x) => [khoaNhac(x.key, x.ownerId), x.daNhacLuc]));
      setData((prev) => (prev ? {
        ...prev,
        dong: prev.dong.map((x) => {
          const l = x.nhac ? luc.get(khoaNhac(x.key, x.nhac.ownerId)) ?? x.con?.map((c) => luc.get(khoaNhac(c.key, x.nhac!.ownerId))).find(Boolean) : undefined;
          return l ? { ...x, nhac: { ...x.nhac!, daNhacLuc: l } } : x;
        }),
      } : prev) as Work);
      setNhacLoi((s) => new Set([...s, ...r.loi.filter((l) => l.ma !== 503).map((l) => khoaNhac(l.key, l.ownerId))]));
      toast.push(r.loi.length ? 'error' : 'ok', tomTatKetQuaHangLoat('nhac', r.ok.length, r.loi));
    } catch (e: any) {
      toast.push('error', e instanceof ApiError ? e.message : 'Mất kết nối giữa chừng — danh sách đã làm mới để thấy việc nào đã nhắc.');
      reload();
    } finally { setDangNhacHet(false); }
  };

  const nutPhu = (it: WorkItem) => {
    if (it.nhac) {
      if (it.nhac.daNhacLuc) return <span className="text-xs text-slate-500 whitespace-nowrap">Đã nhắc {fmtTime(it.nhac.daNhacLuc)}</span>;
      return (
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangNhac[it.key]} onClick={(e) => { e.stopPropagation(); bamNhac(it); }}>
          Nhắc
        </button>
      );
    }
    return null;
  };

  // ------------------------------------------------------------------ Lọc thêm + dòng phạm vi
  const [locThem, setLocThem] = useState(false);
  const [tenGv, setTenGv] = useState<string | null>(null);
  const soLocThem = (khung !== 'tat-ca' ? 1 : 0) + (nhom ? 1 : 0) + (typeof nguoi === 'number' ? 1 : 0);
  const coLoc = loc !== 'tat-ca' || soLocThem > 0;
  const xoaLoc = () => {
    const next = new URLSearchParams(params);
    for (const k of ['loc', 'nhom', 'loai']) next.delete(k);
    if (typeof nguoi === 'number') next.delete('nguoi');
    if (khung !== 'tat-ca') { nhoKhung('cong-viec', 'tat-ca'); next.set('khung', 'tat-ca'); }
    setParams(next, { replace: true });
  };
  const tenCn = branchId ? branches?.find((b) => b.id === branchId)?.name : branches?.length === 1 ? branches[0].name : 'Tất cả chi nhánh';
  const ai = typeof nguoi === 'number'
    ? (tenGv ?? tatCaViec.find((x) => x.ownerId === nguoi)?.owner ?? 'một GV')
    : laQuanLy && nguoi !== 'toi' ? 'Của GV' : 'Của tôi';
  const dangXem = [tenCn, ai, loc === 'tat-ca' ? 'Tất cả hạn' : LOC_NHANH_LABEL[loc], loai ? TEN_LOAI[loai] ?? (nhom ? NHOM_VIEC_LABEL[nhom] : null) : nhom ? NHOM_VIEC_LABEL[nhom] : null,
    khung === 'ft' ? 'Fast Track' : khung === 'thuong' ? 'Lớp thường' : null].filter(Boolean).join(' · ');

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  const anTrenDienThoai = chon ? 'max-lg:hidden' : '';
  return (
    <div className="space-y-3">
      {/* ───────────────────────────────────────────────── lọc hai tầng (mockup M1 §1) */}
      <div className={`space-y-2.5 ${anTrenDienThoai}`}>
        <div className="flex flex-wrap items-end gap-2">
          {laQuanLy && data && !chiChamDiem && (
            /* Mặc định KHÔNG có `nguoi` trên URL là "tất cả" (`thamSoNguoi`) — "Của tôi" phải GHI rõ `nguoi=toi`. Admin không có việc của riêng mình. */
            <BoLocDoan ariaLabel="Việc của ai" value={nguoi === 'toi' ? 'toi' : 'tat-ca'}
              onChange={(k) => setParam('nguoi', k === 'toi' ? 'toi' : null)}
              muc={[{ key: 'toi', nhan: 'Của tôi' }, { key: 'tat-ca', nhan: 'Của GV (nhắc)', title: 'Việc của giáo viên trong phạm vi — Nhắc ngay trên dòng' }]} />
          )}
          <BoLocDoan ariaLabel="Hạn" value={loc} onChange={(k) => setParam('loc', k === 'tat-ca' ? null : k)}
            muc={[...HAN_CHINH, ...(loc === 'den-het-tuan' ? ['den-het-tuan' as const] : [])].map((k) => ({ key: k, nhan: LOC_NHANH_LABEL[k], so: demHan[k] }))} />
          <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />
          <button type="button" aria-expanded={locThem} onClick={() => setLocThem((x) => !x)}
            className={`btn btn-sm min-h-[44px] sm:min-h-[32px] ${soLocThem ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}>
            Lọc thêm{soLocThem ? ` · ${soLocThem}` : ''}
            <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`transition-transform ${locThem ? '-rotate-90' : 'rotate-90'}`}>
              <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {locThem && (
          <div className="card flex max-w-[640px] flex-col gap-2.5 px-3.5 py-3">
            {demKhung.ft > 0 && demKhung.thuong > 0 && (
              <div role="group" aria-label="Chương trình">
                <div className="mb-1.5 text-xs font-bold text-slate-300">Chương trình</div>
                <CongTacKhung trang="cong-viec" coTatCa value={khung} dem={{ ft: demKhung.ft, thuong: demKhung.thuong }} onChange={(k) => setParam('khung', k === 'tat-ca' ? null : k)} />
              </div>
            )}
            <div>
              <div className="mb-1.5 text-xs font-bold text-slate-300">Nhóm việc</div>
              <BoLocDoan ariaLabel="Nhóm việc" value={nhom ?? 'tat-ca'}
                onChange={(k) => { const next = new URLSearchParams(params); next.delete('loai'); if (k === 'tat-ca') next.delete('nhom'); else next.set('nhom', k); setParams(next, { replace: true }); }}
                muc={[{ key: 'tat-ca', nhan: 'Tất cả', so: demNhom['tat-ca'] },
                  ...NHOM_VIEC.filter((k) => !chiChamDiem || k === 'cham-diem').map((k) => ({ key: k, nhan: NHOM_VIEC_LABEL[k], so: demNhom[k] }))]} />
            </div>
            {laQuanLy && data && (
              <div>
                <div className="mb-1.5 text-xs font-bold text-slate-300">Của một GV</div>
                <ChonPhuTrach chiChonGv value={nguoi} valueName={typeof nguoi === 'number' ? tenGv : null}
                  onChange={(v, name) => { setTenGv(name ?? null); setParam('nguoi', v === 'tat-ca' ? null : String(v)); }} />
              </div>
            )}
          </div>
        )}
        {data && !data.scopeEmpty && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-slate-400" aria-live="polite">
            <span>Đang xem: <b className="font-semibold text-slate-200">{dangXem}</b></span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{phamVi.nhom} nhóm việc · {phamVi.so} {phamVi.donVi}</span>
            {coLoc && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={xoaLoc}>Xoá lọc</button>}
          </div>
        )}
        {coNutNhacHet && (
          <div><button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangNhacHet} onClick={() => setHoiNhac(true)}>
            {dangNhacHet ? 'Đang nhắc…' : nhacHet.tong > TRAN_HANG_LOAT ? `Nhắc ${TRAN_HANG_LOAT} việc đầu` : `Nhắc tất cả (${nhacHet.tong})`}
          </button></div>
        )}
      </div>
      <ConfirmDialog open={hoiNhac} onClose={() => setHoiNhac(false)} onConfirm={() => void nhacTatCa()}
        title={`Nhắc ${nhacHet.gui.length} việc · ${nhacHet.gv.length} GV?`} confirmLabel={`Nhắc ${nhacHet.gv.length} GV`}
        body={<DsGvNhac gv={nhacHet.gv} boQua={nhacHet.boQua} />} />

      {/* ───────────────────────────────────────────────── danh sách trái · panel phải */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-3.5 xl:grid-cols-[560px_minmax(0,1fr)]">
        <div className={anTrenDienThoai}>
          {loading && !data && <Card><Skeleton rows={8} /></Card>}
          {data && data.scopeEmpty && <Card><Empty title="Bạn chưa được cấp phạm vi nào" /></Card>}
          {data && !data.scopeEmpty && dsNhom.length === 0 && (
            <Card><Empty title={coLoc ? 'Không có việc nào khớp bộ lọc' : 'Không có việc nào'} action={coLoc ? <button type="button" className="btn btn-sm" onClick={xoaLoc}>Xoá lọc</button> : undefined} /></Card>
          )}
          {data && !data.scopeEmpty && dsNhom.length > 0 && (
            <Card bodyClass="p-0">
              <NhomViec nhom={dsNhom} soHien={10} moHet={moHet} onOpen={mo} nutPhu={nutPhu} chon={viec} xong={xong} moTrang={(x) => !lamTaiCho(x)} />
            </Card>
          )}
        </div>
        {/* Cột phải dính khi cuộn danh sách dài (mockup `.pn` sticky). */}
        <div className={`lg:sticky lg:top-3 ${chon ? 'space-y-2' : 'max-lg:hidden'}`}>
          {chon ? (
            <>
              {/* Điện thoại: danh sách vừa ẩn → focus về nút lùi (máy tính nút ẩn, `autoFocus` không có tác dụng). */}
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <button type="button" autoFocus className="link flex min-h-[44px] items-center gap-1.5 appearance-none border-0 bg-transparent p-0 text-[13px] lg:hidden" onClick={dong}>‹ Công việc</button>
              <KhungTaiCho.Provider value>
                <PanelViec key={chon.key} it={chon} onDong={dong} onDaLam={() => daLam(chon)} onTiep={keTiep ? () => mo(keTiep) : null} />
              </KhungTaiCho.Provider>
            </>
          ) : data && !data.scopeEmpty && dsNhom.length > 0 ? (
            <Card><Empty title="Chọn một việc ở danh sách" /></Card>
          ) : null}
        </div>
      </div>

      {/*
        PR-Ra, nợ PR-O (#58): lối cũ `?mo-viec=` (chuông, việc Vận hành giao cho GV) vẫn mở panel Vận hành — phủ trang như trước. Bấm dòng
        việc Vận hành ở danh sách nay mở tại chỗ (`viec=mgmt:{id}`).
      */}
      <NganViecVanHanh taskId={moViec} onClose={() => setParam('mo-viec', null)} onDone={() => invalidate('/my-work')} />
    </div>
  );
}

/** Thân hộp hỏi lại "Nhắc tất cả" — MỘT mẫu cho Hỗ trợ học viên và Chờ duyệt › Nhắc việc (OV-11c, CV-14). Quá 6 GV: 5 dòng đầu + "và k GV khác". */
export function DsGvNhac({ gv, boQua }: { gv: readonly { ownerId: number; ten: string; so: number }[]; boQua: number }) {
  return (
    <>
      <ul className="m-0 list-none rounded-lg border p-0 tabular-nums" style={{ borderColor: 'var(--line)' }}>
        {(gv.length > 6 ? gv.slice(0, 5) : gv).map((g, i) => (
          <li key={g.ownerId} className={`flex gap-2 px-2.5 py-1.5 ${i ? 'border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>
            <span className="min-w-0 flex-1 break-words text-slate-200">{g.ten}</span><span className="whitespace-nowrap">{g.so} việc</span>
          </li>
        ))}
        {gv.length > 6 && <li className="border-t px-2.5 py-1.5 text-slate-400" style={{ borderColor: 'var(--line)' }}>và {gv.length - 5} GV khác</li>}
      </ul>
      {boQua > 0 && <p className="mb-0 mt-2 text-xs text-slate-400">Bỏ qua {boQua} việc đã nhắc hôm nay.</p>}
    </>
  );
}
