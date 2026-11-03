import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { invalidate } from '../../lib/api.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { OChiNhanh, docChiNhanhDaNho, nhoChiNhanh, type Branch } from '../../ui/Filters.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { CHIP_SOS, Nhan, lopSos, toneBadgeLop } from '../../ui/Nhan.tsx';
import { BoChonThoiGian } from '../phanTich/BoChonThoiGian.tsx';
import { PanelViec, lamTaiCho } from '../congViec/PanelViec.tsx';
import { PanelNhapDiemLop } from '../cham/PanelNhapDiemLop.tsx';
import { TenGiaoVien } from '../classes/TenGiaoVien.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { IntakePanel } from './IntakePanel.tsx';
import { ClassCreatePanel } from '../classes/ClassCreatePanel.tsx';
import { type TrangSos, type DongSos } from './BangSos.tsx';
import { PanelMotEm } from './PanelMotEm.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { GocLichThi, khoangThang } from './GocLichThi.tsx';
import { NganXuatDs } from './NganXuatDs.tsx';
import { GocPhanCongGv } from './GocPhanCongGv.tsx';
import { BangHvGon, BangSosGon, TheHvGon, coPaQuaHan, type EmVai, type HvGon, type LopGon, type NhomLop, type VaiBang, type ViecEm } from './DanhSachHvLop.tsx';
import {
  LOC_CASE, LOC_HOC_VIEN_NHAN, LOC_KET_QUA, LOC_KY_NANG, NHAN_LOC_CASE, NHAN_LOC_KET_QUA, KIEU_KHOANG, badgeHienTheoVai, badgeLop, docLocThem, duongLichTest,
  khoangMacDinh, khopLocThem, locThemBat, nhanKhoang, needScoresText, type BadgeLop, type KieuKhoang,
  PHAM_VI_NHAN, coDichLienKet, laVaiQuanLy, docGoc, docThamSoLoc, duongHocVienLop, khungCua, vaiXemHocVien,
  type HangHv, type KhoaCotXuatDs, type LichThi, type LocHocVien, type NguCanhDs, type PhamVi, type ThemEm, type WorkScope, type VaiXemHocVien,
  type ChipVai,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Ô chọn gọn của dải lọc: cùng cao 32 px với chip (điện thoại 44 px). */
const SELECT_GON = 'field h-8 w-auto !py-0 text-sm max-sm:min-h-[44px] max-sm:w-full';

/** Một lớp của `GET /hoc-vien-lop` (server/src/classes/hocVienLop.ts → LopHocVienLop). */
export type LopTrenTrang = {
  id: number; code: string; programmeCode: string | null; programmeName: string | null; scoringMode: string | null;
  /** Lộ trình lớp Fast Track (LT1 / LT2 / RF); lớp thường không có (U14, PR-UXD). */
  route: string | null;
  branchId: number; branchName: string; studentCount: number; needScores: number; workScope: WorkScope;
  phase: string; currentWeek: number | null; totalWeeks: number | null; needsPlacement: boolean;
  missing: { key: string; label: string; who: string }[]; missingSkills: string[];
  gvcn: { id: number; name: string } | null; soCaseMo: number; tuanKetThuc: string | null;
  /** B4: yêu cầu chờ Quản lý duyệt (chỉ người duyệt được) và số em có việc đã quá hạn — badge `cho-duyet` / `qua-han`. */
  soChoDuyet: number; soEmQuaHan: number;
  viewer: { coTheSuaHocVien: boolean; coTheThemHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean; coTheChuyenTiep: boolean; coTheSuaThongTin?: boolean; coTheSuaThem?: boolean };
  /** PR-LT: số em thật sự cần xếp lớp tiếp (Q9), số em lớp thường chưa có lộ trình tiếp theo (chỉ hai tuần cuối khoá, Q5). */
  canXepLop: number; soChuaLoTrinhTiep: number; nhacLoTrinh: boolean;
};
type TrangHocVienLop = {
  rows: LopTrenTrang[]; scopeEmpty: boolean;
  phamVi: { coThe: PhamVi[]; dangDung: PhamVi; chiNhanh: number | null };
  dem: Record<LocHocVien, number>;
  hocVien: { id: number; classId: number; loc: LocHocVien[]; khung: 'ft' | 'thuong'; ten: string; ma: string; thieu?: string[]; them?: ThemEm; hang?: HangHv; tvv?: string | null; lich?: LichThi }[];
  /** Người xem có tạo được lớp MỚI ở chi nhánh nào không — không gắn với lớp đã tồn tại nào (điểm a rà soát cuối). */
  coTheTaoLop: boolean;
  /** HL-14: "+ Học viên" theo phạm vi, không theo kết quả ô tìm. */
  coTheThemHocVien: boolean;
  /** Số ở mục ⋯ "Lưu trữ" đầu trang (PR-LT, Q16). */
  demLuuTru: { lop: number; hv: number };
};

/** "Lưu trữ · {n} lớp · {m} HV" — bỏ phần số 0, cả hai 0 thì chỉ "Lưu trữ" (§3.6, G-12). */
function nhanLuuTru(dem: { lop: number; hv: number }): string {
  const phan = [dem.lop > 0 ? t('{n} lớp', { n: dem.lop }) : null, dem.hv > 0 ? t('{n} HV', { n: dem.hv }) : null].filter(Boolean);
  return phan.length ? `${t('Lưu trữ')} · ${phan.join(' · ')}` : t('Lưu trữ');
}


export default function StudentsPage() {
  const { session } = useSession();
  /* UI-HV-LOP-TVV (L1): mọi vai cùng bảng V5; TVV / CX thêm phạm vi theo vai, chip của vai, cột Phụ huynh, ⋯ theo vai. */
  return <TrangTheoLop vai={vaiXemHocVien(session?.roles)} />;
}

/** `GET /hoc-vien-lop/theo-vai` — phần trang TVV / CX dùng: tập chip (`chipHocVien`, cùng số Tổng quan) + một dòng mỗi em (kể cả Tạm dừng, chưa xếp lớp). */
type DongVai = EmVai & { id: number; ten: string; ma: string; tvv: string | null; lop: { id: number; code: string; ft: boolean; daRoi: boolean } | null };
type TrangVai = { ids: Record<Exclude<ChipVai, 'tat-ca'>, number[]>; rows: (Omit<DongVai, 'ft'>)[] };
/** Chip của vai (OV-10b) — "Đã thi · chờ kết quả" dùng chip chung của trang (cùng tập `loTrinhChoKetQuaThi`). Thiếu thông tin / Chờ chọn bước tiếp chỉ hiện khi có em. */
/* U04 (chủ SP 03/11): bỏ chip "Cần chú ý" với TVV (= mọi em). Link cũ `view=can-chu-y` → Tất cả. */
const CHIP_VAI_TRANG: Exclude<ChipVai, 'tat-ca' | 'da-thi' | 'can-chu-y'>[] = ['tam-dung', 'sap-thi', 'thieu_tt', 'cho-buoc-tiep'];
const CHIP_VAI_NHAN: Record<(typeof CHIP_VAI_TRANG)[number], { nhan: string; goiY: string }> = {
  'tam-dung': { nhan: t('Tạm dừng'), goiY: t('Đang Tạm dừng học.') },
  'sap-thi': { nhan: t('Sắp thi'), goiY: t('Dự kiến thi IELTS trong 6 tuần tới.') },
  thieu_tt: { nhan: t('Thiếu thông tin'), goiY: t('Hồ sơ còn thiếu thông tin cần để xếp lịch và theo dõi (không tính liên hệ).') },
  'cho-buoc-tiep': { nhan: t('Chờ chọn bước tiếp'), goiY: t('Đã có kết quả thi thật, chờ chọn bước tiếp.') },
};
/** Phạm vi của vai: TVV "HV của tôi" (mặc định) · Chi nhánh; CX mọi chi nhánh (mặc định) · một chi nhánh. */
const PHAM_VI_VAI: Record<'tvv' | 'cx', PhamVi[]> = { tvv: ['cua-toi', 'chi-nhanh'], cx: ['tat-ca', 'chi-nhanh'] };


type Goc = 'tat-ca' | 'sos' | 'lich-thi' | 'phan-cong';
/** Việc gấp nhất trước: quá hạn → hạn sớm. */
const gapTruoc = (a: ViecEm, b: ViecEm) => Number(b.quaHan) - Number(a.quaHan) || (a.han ?? '9').localeCompare(b.han ?? '9');
const KN_NGAN: Record<string, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };
/** Việc Case ở Công việc → Panel một em (các việc khác giữ panel / hộp sẵn có). */
const VIEC_CASE = new Set(['xac_nhan_pa', 'ghi_ket_qua_pa', 'mini_test', 'no_plan', 'cause', 'ghi_nhan_xet']);
/** Lọc mức của chế độ Đang SOS (khu d): Tất cả · SOS 3 · SOS 2 · SOS 1 · PA quá hạn. */
type MucSos = '3' | '2' | '1' | 'pa';
/** Cột Xuất mặc định của chế độ Tất cả (khu d hộp Xuất): Tên · Email · Lớp · Target · Điểm · SOS · Ngày thi. */
const COT_XUAT_TAT_CA: KhoaCotXuatDs[] = ['ten', 'gmail', 'lop', 'target', 'diem', 'sos', 'lichThi'];

/**
 * HỌC VIÊN & LỚP (UI-HV-LOP, `thiet-ke/v5/dieu-chinh-cuoi.html` khu d + `10` mục 5) — danh sách GỌN nhiều lớp để lọc / tìm / hành động: mỗi em một dòng
 * (Học viên · Lộ trình · MT gần nhất · Xu hướng · Hỗ trợ · Ý thức · Lịch thi · Việc). Ba chế độ Tất cả · Đang SOS · Lịch thi (bỏ "Cần làm" — việc ở Công việc).
 * Không cột tick: "Xuất" lấy đúng phạm vi bộ lọc + chọn cột trong hộp. Mọi trạng thái nằm trên URL (tải lại / Back giữ chỗ đang đứng).
 * Việc của em lấy từ `/my-work` (cùng nguồn Công việc — một việc xong thì không nơi nào còn báo).
 */
function TrangTheoLop({ vai }: { vai: VaiXemHocVien | null }) {
  const admin = vai === 'admin';
  const laVai = vai === 'tvv' || vai === 'cx';
  const navigate = useNavigate();
  const { homNay } = useNgayNghiepVu();
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const doc = docThamSoLoc(params.get('view'));
  /* Link cũ: `view=can-lam` / `qua-han` (Cần làm đã bỏ) → Tất cả + chip "Có việc quá hạn"; `cho-duyet` / `thieu_tt` → Tất cả. */
  const gocUrl = docGoc(params.get('view'), params.get('loc'));
  /* PC-GV-C: góc Phân công GV — QL, Quản trị, CX (GV / TVV không thấy; máy chủ 403). */
  const coGocPc = laVaiQuanLy(session?.roles) || vai === 'cx';
  const goc: Goc = gocUrl.goc === 'lich-thi' ? 'lich-thi' : gocUrl.goc === 'sos' && !admin ? 'sos' : gocUrl.goc === 'phan-cong' && coGocPc ? 'phan-cong' : 'tat-ca';
  const locQuaHan = vai !== 'cx' && (params.get('qh') === '1' || (gocUrl.goc === 'can-lam' && (gocUrl.loc === 'qua-han' || gocUrl.loc === null)));   // CX không có Công việc → không có lọc này
  const locThiThang = params.get('thi') === '1';
  const locDaThi = params.get('loc') === 'da-thi' || params.get('view') === 'da-thi';   // OV-14b: "Đã thi · chờ kết quả" (cùng chip TVV / CX) — giữ; Tổng quan TVV / CX gửi `view=`
  /* Chip của vai TVV / CX: `loc=` (bấm chip) hoặc `view=` (link Tổng quan, Công việc TVV, link cũ của bảng V4). */
  const chipVai = laVai ? CHIP_VAI_TRANG.find((k) => k === params.get('loc') || k === params.get('view')) ?? null : null;
  const sapXep = params.get('sx') === 'chu-y' ? 'chu-y' : 'lop';
  /* OV-15h2 (ý 3): Bộ lọc thêm — `lt` mở khối; `lc` Case / PA · `lk` kỹ năng · `lq` kết quả · `ltu`–`lden` tuần thi (máy chủ gắn nhãn khi có, `them=1`). Giữ. */
  const locThem = docLocThem((k) => params.get(k));
  const moLocThem = params.get('lt') === '1';
  const kieuKhoang = (KIEU_KHOANG as readonly string[]).includes(params.get('lkieu') ?? '') ? params.get('lkieu') as KieuKhoang : 'tuy-chon';
  const mucSos = (['3', '2', '1', 'pa'] as const).find((x) => x === params.get('muc')) ?? null;
  const q = params.get('q') ?? '';
  const cnUrl = params.get('cn') ?? params.get('branchId');
  const branchId = cnUrl ? Number(cnUrl) : null;
  /* Góc Phân công còn nháp có thể giữ việc đổi chi nhánh lại ("Ở lại") → chỉ nhớ khi URL đã đổi thật. */
  const chiNhanhCho = useRef<number | null>(null);
  useEffect(() => {
    if (branchId === null || chiNhanhCho.current !== branchId) return;
    chiNhanhCho.current = null;
    nhoChiNhanh(session?.user?.id, branchId);
  }, [branchId, session?.user?.id]);
  const tuLienKet = useRef(coDichLienKet(params)).current;
  const daNho = tuLienKet ? null : docChiNhanhDaNho(session?.user?.id);
  const phamViUrl = params.get('phamVi');
  const chiLop = params.get('classId') ? Number(params.get('classId')) : null;
  const khungUrl = params.get('khung');
  /* PTA chốt [XM] 04/11 (mockup U04): chương trình là HAI trạng thái, luôn một mục chọn — URL `khung` (link cũ "cả hai" → mặc định), không có thì lần chọn trong phiên. */
  const khungMuon = khungUrl === 'ft' || khungUrl === 'thuong' ? khungUrl : docKhungDaNho();
  const [draftQ, setDraftQ] = useState(q);
  /* + Thêm học viên: false = đóng · null = không lớp mặc định · lớp = mở từ ⋯ hàng lớp / dải lớp (lớp điền sẵn). */
  const [them, setThem] = useState<false | { id: number; code: string } | null>(false);
  const [taoLop, setTaoLop] = useState(false);
  const dienThoai = useDienThoai();
  /* 375 (B26): chip lọc gom vào nút "Lọc". */
  const [moLoc, setMoLoc] = useState(false);

  const setParam = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k); else next.set(k, v);
    }
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    const h = setTimeout(() => { if (draftQ !== q) setParam({ q: draftQ || null }); }, 300);
    return () => clearTimeout(h);
  }, [draftQ, q, setParam]);

  const canNhan = moLocThem || locThemBat(locThem);
  const qs = useMemo(() => duongHocVienLop(params, { tuLienKet, daNho }), [q, phamViUrl, branchId, daNho, tuLienKet, canNhan]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* giuCu (HV-LOC): gõ tìm / bật lọc đổi `qs` — giữ trang cũ tới khi bản mới về, không gỡ ô tìm đang gõ. */
  const trang = useApi<TrangHocVienLop>('chuyenDen' in doc ? null : qs, [], { giuCu: true });
  const branches = useApi<Branch[]>('/ref/branches');
  const data = trang.data;
  /* Đang SOS: cùng phạm vi trang (`qs`). Số trên tab cần nguồn này nên tải luôn (Admin không có chế độ này). */
  const duongSos = useMemo(() => {
    const s = new URLSearchParams(qs.slice(qs.indexOf('?') + 1));
    s.set('goc', 'sos');
    return `/hoc-vien-lop?${s.toString()}`;
  }, [qs]);
  const sos = useApi<TrangSos>(admin || 'chuyenDen' in doc ? null : duongSos, [], { giuCu: true });
  /* Cột "Việc của tôi" + chip "Có việc quá hạn" (U04-5, chủ SP 03/11 khuya): CHỈ việc của người đang xem — cùng nguồn badge Công việc (`/my-work`). Chờ trang tải xong mới gọi. */
  const duongViec = '/my-work';
  const coViec = vai !== 'cx';   // CX không có Công việc (Tổng quan CX: "không có việc trên trang này")
  const work = useApi<{ dong: WorkItem[] }>('chuyenDen' in doc || !data || !coViec ? null : duongViec, [duongViec]);
  /* TVV / CX: tập chip + dòng theo vai — CÙNG phạm vi trang vừa nhận (máy chủ chọn mặc định), nên gọi sau `/hoc-vien-lop`. */
  const duongVai = !laVai || !data ? null
    : `/hoc-vien-lop/theo-vai${data.phamVi.dangDung === 'chi-nhanh' && data.phamVi.chiNhanh ? `?phamVi=chi-nhanh&branchId=${data.phamVi.chiNhanh}` : ''}`;
  const theoVai = useApi<TrangVai>(duongVai, [duongVai]);
  const [panelEm, setPanelEm] = useState<{ id: number; caseMo: number | null } | null>(null);
  const [viecMo, setViecMo] = useState<WorkItem | null>(null);
  /* Bấm việc ở ô Việc = làm tại chỗ như góc Cần làm cũ: Case → Panel một em · việc làm được trong panel → PanelViec · còn lại → trang của việc. */
  const moViec = (it: WorkItem) => {
    if (VIEC_CASE.has(it.group) && it.caseId && it.studentId) setPanelEm({ id: it.studentId, caseMo: it.caseId });
    else if (lamTaiCho(it)) setViecMo(it);
    else navigate(it.href);
  };
  const lamMoi = () => { invalidate('/my-work'); invalidate('/hoc-vien-lop'); trang.reload(); sos.reload(); work.reload(); theoVai.reload(); };
  const [xuat, setXuat] = useState(false);
  const [idsLichThi, setIdsLichThi] = useState<number[]>([]);

  /*
   * TVV / CX: em trong tập chip mà danh sách lớp không có (Tạm dừng, chưa xếp lớp, lớp không còn em đang học của mình) thêm vào cuối — "Tất cả" = mọi em
   * chưa lưu trữ của vai, cùng số ô Tổng quan. Lớp của các em đó (ngoài `rows`) chỉ có mã để mở Hồ sơ lớp.
   */
  const vaiTrang = useMemo(() => {
    if (!theoVai.data) return null;
    const em = new Map<number, EmVai>(theoVai.data.rows.map((d) => [d.id, { ...d, ft: d.lop?.ft ?? true }]));
    const co = new Set((data?.hocVien ?? []).map((h) => h.id));
    const ql = q.trim().toLowerCase();
    const them = theoVai.data.rows.filter((d) => !co.has(d.id) && d.status !== 'finished'   // U04-3: em Kết thúc học không trong danh sách
      && (!ql || d.ten.toLowerCase().includes(ql) || d.ma.toLowerCase().includes(ql) || (d.lop?.code ?? '').toLowerCase().includes(ql)));
    const tap = Object.fromEntries(Object.entries(theoVai.data.ids).map(([k, v]) => [k, new Set(v)])) as Record<string, Set<number>>;
    return { em, them, tap };
  }, [theoVai.data, data, q]);
  const lop = useMemo(() => {
    const m = new Map<number, LopGon & Partial<LopTrenTrang>>((data?.rows ?? []).map((c) => [c.id, c]));
    for (const d of vaiTrang?.them ?? []) if (d.lop && !m.has(d.lop.id)) {
      m.set(d.lop.id, { id: d.lop.id, code: d.lop.code, programmeName: null, scoringMode: d.lop.ft ? null : 'ratio', viewer: { coTheSuaHocVien: false, coTheThemHocVien: false, coTheBaoCase: false, coTheGhiViPham: false, coTheNhapDiem: false, coTheChuyenTiep: false } });
    }
    return m;
  }, [data, vaiTrang]);
  const dsEm = useMemo((): TrangHocVienLop['hocVien'] => [...(data?.hocVien ?? []), ...(vaiTrang?.them ?? []).map((d) => ({
    id: d.id, classId: d.lop?.id ?? 0, loc: ['tat-ca'] as LocHocVien[], khung: d.lop && !d.lop.ft ? 'thuong' as const : 'ft' as const, ten: d.ten, ma: d.ma, tvv: d.tvv,
  }))], [data, vaiTrang]);
  const moEm = (id: number) => setPanelEm({ id, caseMo: null });
  const vaiBang: VaiBang | undefined = vaiTrang ? { em: vaiTrang.em, coViec, onMoEm: moEm } : undefined;
  /*
   * Việc theo em, gấp nhất trước (quá hạn → hạn sớm). Việc nhiều em (`emIds`) tính cho từng em.
   * U04-5: mọi vai chỉ việc CỦA MÌNH (`mine`) — ô Việc, dải dưới hàng, chip "Có việc quá hạn", "Cần chú ý trước" cùng nguồn này.
   */
  const viec = useMemo(() => {
    const m = new Map<number, ViecEm[]>();
    for (const it of (work.data?.dong ?? []).flatMap((x) => (x.con?.length ? x.con : [x]))) {
      if (!it.mine) continue;
      const v: ViecEm = { chu: it.tieuDe, han: it.due, quaHan: it.urgency === 'overdue', it };
      for (const id of it.studentId !== null ? [it.studentId] : it.emIds ?? []) m.set(id, [...(m.get(id) ?? []), v]);
    }
    for (const ds of m.values()) ds.sort(gapTruoc);
    return m;
  }, [work.data]);
  /*
   * Ô Việc của em: chỉ việc gắn em (hoặc không gắn lớp). Việc CẤP LỚP (Nhập điểm cả lớp, Phối hợp SOS…) không hiện trên hàng lớp nữa (chủ SP 28/10) —
   * làm ở Công việc / Hồ sơ lớp; chip tình trạng của hàng lớp ("n bài chờ chấm"…) là lối vào. `viec` (trên) vẫn tính cho chip "Có việc quá hạn", "Cần chú ý trước".
   */
  const viecHien = useMemo(() => {
    const em = new Map<number, ViecEm[]>();
    for (const [id, ds] of viec) em.set(id, ds.filter((v) => v.it.studentId !== null || v.it.classId === null));
    return em;
  }, [viec]);

  /* Chương trình (Fast Track · Lớp thường) chỉ có nghĩa khi phạm vi có cả hai loại lớp. */
  const soLopTheoKhung = { ft: 0, thuong: 0 };
  for (const c of data?.rows ?? []) soLopTheoKhung[khungCua(c.scoringMode)] += 1;
  const coHaiKhung = soLopTheoKhung.ft > 0 && soLopTheoKhung.thuong > 0;
  /* Mặc định Fast Track khi phạm vi có lớp FT; chỉ một loại lớp thì xem loại đó (`tat-ca` = không lọc, đoạn chọn ẩn) — GV chỉ dạy lớp thường không gặp trang rỗng. */
  const khung = coHaiKhung ? khungMuon ?? 'ft' : 'tat-ca';
  const thangNay = homNay.slice(0, 7);
  const thiThangNay = (h: HvGon) => !!h.lich?.ngay && h.lich.ngay.slice(0, 7) === thangNay;   // P4: thi thật trong tháng này (đã chốt / đã thi)
  const coQuaHan = (h: HvGon) => !!viec.get(h.id)?.some((v) => v.quaHan);
  const thuTuLop = new Map((data?.rows ?? []).map((c, i) => [c.id, i]));
  const thuTu = (classId: number) => thuTuLop.get(classId) ?? Number.MAX_SAFE_INTEGER;   // em ngoài danh sách lớp (TVV / CX) xếp cuối
  /* Danh sách gốc theo phạm vi + chương trình + lớp (chưa chip) — số trên chip đếm trên đây. */
  const batThem = locThemBat(locThem);
  /* "Cần chú ý trước" (giữ từ bảng cũ): việc quá hạn → SOS cao → còn lại; mặc định theo lớp rồi tên. */
  const chuY = (h: HvGon) => (coQuaHan(h) ? 10 : 0) + (h.hang?.hoTro.sos ?? 0);
  const goc0 = useMemo(() => dsEm
    .filter((h) => (khung === 'tat-ca' || h.khung === khung) && (!chiLop || h.classId === chiLop) && (!batThem || khopLocThem(h.them, locThem)))
    .sort((a, b) => (sapXep === 'chu-y' ? chuY(b) - chuY(a) : 0) || thuTu(a.classId) - thuTu(b.classId)
      || a.ten.localeCompare(b.ten, 'vi')),
  [dsEm, khung, chiLop, batThem, params, sapXep, viec]);   // eslint-disable-line react-hooks/exhaustive-deps
  const coChipVai = (h: { id: number }, k: string) => !!vaiTrang?.tap[k]?.has(h.id);
  const hvLoc = goc0.filter((h) => (!locThiThang || thiThangNay(h)) && (!locQuaHan || coQuaHan(h)) && (!locDaThi || h.loc.includes('da-thi'))
    && (!chipVai || coChipVai(h, chipVai)));
  const demDaThi = new Set(goc0.filter((h) => h.loc.includes('da-thi')).map((h) => h.id)).size;
  const demThi = new Set(goc0.filter(thiThangNay).map((h) => h.id)).size;
  const demQh = new Set(goc0.filter(coQuaHan).map((h) => h.id)).size;

  const trongLoc = (classId: number, ft: boolean) => (!chiLop || classId === chiLop) && (khung === 'tat-ca' || (ft ? 'ft' : 'thuong') === khung);
  const sosTat = (sos.data?.rows ?? []).filter((r) => trongLoc(r.classId, r.ft));
  const sosRows = sosTat.filter((r) => (mucSos === 'pa' ? coPaQuaHan(r) : mucSos ? r.sosLevel === Number(mucSos) : true));
  const hangTheoEm = useMemo(() => new Map((data?.hocVien ?? []).map((h) => [h.id, h.hang])), [data]);

  /* Số trên tab Lịch thi: em có tháng thi trong khoảng đang xem (cùng khoảng của chế độ Lịch thi, không gồm "Chưa có tháng thi"). */
  const [tuThang, denThang] = khoangThang(params.get('thang'), homNay);
  const demLich = new Set(goc0.filter((h) => h.lich?.thang && h.lich.thang >= tuThang && h.lich.thang <= denThang).map((h) => h.id)).size;

  const khoaLoc = [goc, q, khung, chiLop, locThiThang, locQuaHan, locDaThi, chipVai, mucSos, branchId, phamViUrl, sapXep, ...['lc', 'lk', 'lq', 'ltu', 'lden'].map((k) => params.get(k))].join('|');
  /*
   * HV-LOP-SUA (chủ SP 27/10, mockup `hoc-vien-lop.html`): Tất cả = danh sách THEO LỚP — hàng lớp rồi HV của lớp. Không lọc gì thì hiện cả lớp chưa có em
   * (để còn ⋯ + Học viên / Nhập điểm); có lọc thì chỉ lớp có em khớp. Lớp mở: `mo` trên URL; chưa có → MỌI lớp gập (chủ SP 28/10: không tự mở lớp đầu); đang lọc / tìm thì mở lớp có em khớp (kết quả lọc phải thấy được).
   */
  const dangLoc = !!(q.trim() || locThiThang || locQuaHan || locDaThi || chipVai || batThem || chiLop);
  const nhomLop = useMemo(() => {
    const m = new Map<number, HvGon[]>();
    if (!dangLoc) for (const c of data?.rows ?? []) if (khung === 'tat-ca' || khungCua(c.scoringMode) === khung) m.set(c.id, []);
    for (const h of hvLoc) m.set(h.classId, [...(m.get(h.classId) ?? []), h]);
    return [...m].map(([id, hv]) => ({ id, hv }));
  }, [hvLoc, dangLoc, data, khung]);   // eslint-disable-line react-hooks/exhaustive-deps
  const moUrl = params.get('mo');
  /* Chip lọc bật: lớp vẫn gập, hàng lớp ghi "3/7 HV khớp" (mockup A0); riêng ô tìm thì lớp có kết quả tự mở (khu C). */
  const moSet = new Set(moUrl !== null ? moUrl.split(',').map(Number) : q.trim() ? nhomLop.map((g) => g.id) : []);
  const doiMo = (id: number) => { const s2 = new Set(moSet); if (s2.has(id)) s2.delete(id); else s2.add(id); setParam({ mo: [...s2].join(',') || '-' }); };
  /* Đổi bộ lọc → về cách mở mặc định (không giữ lớp gập của bộ lọc trước làm "mất" em vừa lọc ra). Lần đầu (Back / tải lại) giữ `mo` của URL. */
  const khoaTruoc = useRef(khoaLoc);
  useEffect(() => {
    if (khoaTruoc.current === khoaLoc) return;
    khoaTruoc.current = khoaLoc;
    if (params.get('mo') !== null) setParam({ mo: null });
  }, [khoaLoc]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* Phân trang theo LỚP ở Tất cả (việc / em của một lớp không bị tách trang), theo HV ở Đang SOS. */
  const pt = usePhanTrang(goc === 'tat-ca' ? nhomLop.length : goc === 'sos' ? sosRows.length : 0, khoaLoc, goc === 'tat-ca' ? t('lớp') : t('HV'));

  const pv = data?.phamVi;
  const lopDangLoc = chiLop ? lop.get(chiLop) : null;
  const tenCn = pv?.dangDung === 'chi-nhanh' ? (branches.data ?? []).find((b) => b.id === pv.chiNhanh)?.name ?? null : null;
  const dsHocVien: NguCanhDs = { loai: 'hoc-vien', nhan: t('Học viên & Lớp'), ids: goc === 'sos' ? sosRows.map((r) => r.studentId) : hvLoc.map((h) => h.id) };
  /* L5 (PTA 24/10): số trên trang = dòng đang thấy — tab, dải, phân trang VÀ Xuất. */
  const idsXuat = goc === 'tat-ca' || goc === 'phan-cong' ? [...new Set(hvLoc.map((h) => h.id))]
    : goc === 'sos' ? [...new Set(sosRows.map((r) => r.studentId))] : idsLichThi;
  const chuLocThem = [...locThem.case.map((k) => t(NHAN_LOC_CASE[k])), ...locThem.kn.map((k) => KN_NGAN[k]), ...locThem.kq.map((k) => t(NHAN_LOC_KET_QUA[k])),
    locThem.tu && locThem.den ? nhanKhoang({ kieu: kieuKhoang, tu: locThem.tu, den: locThem.den }).chinh : null];
  const boLocXuat = [tenCn, khung === 'ft' ? 'Fast Track' : khung === 'thuong' ? t('Lớp thường') : null, lopDangLoc?.code ?? null, q.trim() ? `“${q.trim()}”` : null,
    goc === 'sos' ? t('Đang SOS') : goc === 'lich-thi' ? t('Lịch thi') : null,
    locThiThang && goc === 'tat-ca' ? t('Thi tháng này') : null, locQuaHan && goc === 'tat-ca' ? t('Có việc quá hạn') : null,
    locDaThi && goc === 'tat-ca' ? LOC_HOC_VIEN_NHAN['da-thi'].nhan : null, chipVai && goc === 'tat-ca' ? CHIP_VAI_NHAN[chipVai].nhan : null, ...(goc === 'tat-ca' ? chuLocThem : [])].filter(Boolean).join(' · ') || t('Tất cả');
  const BO_LOC_THEM = { lt: null, lc: null, lk: null, lq: null, ltu: null, lden: null, lkieu: null };
  const batLoc = (khoa: 'lc' | 'lk' | 'lq', ds: readonly string[], k: string) => setParam({ [khoa]: (ds.includes(k) ? ds.filter((x) => x !== k) : [...ds, k]).join(',') || null });
  const caXuat = { nhan: tenCn ? t('Cả chi nhánh') : t('Tất cả'), ids: [...new Set(dsEm.map((h) => h.id))] };

  const doiGoc = (g: Goc) => setParam({ view: g === 'tat-ca' ? null : g, loc: null, muc: null, qh: locQuaHan && g === 'tat-ca' ? '1' : null });
  /* Chip vai và "Đã thi · chờ kết quả" cùng `loc` — bật chip này tắt chip kia (như bảng V4 của vai); `view=` của link cũ bỏ khi bấm. */
  const batChipVai = (k: string | null) => setParam({ loc: k, view: null });

  if ('chuyenDen' in doc) return <Navigate to={`${doc.chuyenDen}${branchId ? `?cn=${branchId}` : ''}`} replace />;

  /* TVV / CX: chỉ phạm vi của vai (đang dùng phạm vi khác qua link cũ thì vẫn hiện để đổi được). */
  const coThePv = !pv ? [] : !laVai ? pv.coThe : pv.coThe.filter((v) => PHAM_VI_VAI[vai as 'tvv' | 'cx'].includes(v) || v === pv.dangDung);
  /* U04: Fast Track / Lớp thường là đoạn chọn có số (mockup `.doan`); luật bấm giữ: cả hai bật = mọi lớp, tắt một = chỉ loại kia, bấm lại = bật cả hai. */
  const chonKhung = coHaiKhung && (
    <span role="group" aria-label={t('Chương trình')} className="doan">
      {(['ft', 'thuong'] as const).map((k) => (
        <button key={k} type="button" aria-pressed={khung === k} onClick={() => { if (khung !== k) { nhoKhung(k); setParam({ khung: k }); } }}>
          {k === 'ft' ? (dienThoai ? 'FT' : 'Fast Track') : dienThoai ? 'LT' : t('Lớp thường')}<b className="tabular-nums">{soLopTheoKhung[k]}</b>
        </button>
      ))}
    </span>
  );
  /*
   * G1 (N32 ①, chủ SP chốt): MỘT ô "Xem" thay "Phạm vi ▾" + "Chi nhánh ▾" — từng chi nhánh · Mọi chi nhánh · Lớp tôi dạy · HV của tôi theo vai (giữ đúng `PHAM_VI` máy chủ,
   * URL `phamVi` + `cn` như cũ, nhớ chi nhánh như cũ). QL một chi nhánh, GV một phạm vi → không hiện ô.
   */
  const cnDs = branches.data ?? [];
  const coCn = coThePv.includes('chi-nhanh');
  const mucPv = coThePv.filter((v) => v !== 'chi-nhanh');
  const giaTriXem = pv ? (pv.dangDung === 'chi-nhanh' ? `cn:${pv.chiNhanh ?? ''}` : `pv:${pv.dangDung}`) : '';
  const nhomPv = mucPv.length > 0 && (
    <optgroup label={t('Khác')}>{mucPv.map((v) => <option key={v} value={`pv:${v}`}>{v === 'tat-ca' ? t('Mọi chi nhánh') : dich(PHAM_VI_NHAN[v])}</option>)}</optgroup>
  );
  const oXem = pv && (mucPv.length + (coCn ? Math.max(cnDs.length, 1) : 0) > 1) && (
    <label className="o-xem">
      <span className="o-xem-nhan">{t('Xem')}</span>
      <select aria-label={t('Xem')} value={giaTriXem} onChange={(e) => {
        const [k, v] = e.target.value.split(':');
        if (k === 'cn') { chiNhanhCho.current = Number(v); setParam({ phamVi: 'chi-nhanh', cn: v, branchId: null }); }
        else setParam({ phamVi: v, cn: null, branchId: null });
      }}>
        {vai === 'tvv' && nhomPv}
        {coCn && <optgroup label={t('Chi nhánh')}>{cnDs.map((b) => <option key={b.id} value={`cn:${b.id}`}>{b.name}</option>)}</optgroup>}
        {vai !== 'tvv' && nhomPv}
      </select>
    </label>
  );
  const locTim = (
    <span className="o-tim max-sm:flex-1">
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input className="field h-9 w-full text-sm sm:w-[280px] max-sm:min-h-[44px]" aria-label={t('Tìm')} placeholder={t('Tìm học viên, lớp')}
        value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
    </span>
  );
  /* Chọn / lọc một lớp chỉ ở Đang SOS và Lịch thi (chủ SP 27/10) — Tất cả đã chia theo lớp. */
  const locChung = (
    <>
      {locTim}
      <select className={SELECT_GON} aria-label={t('Lớp')} value={chiLop ?? ''} onChange={(e) => setParam({ classId: e.target.value || null })}>
        <option value="">{t('Mọi lớp')}</option>
        {(data?.rows ?? []).filter((c) => khung === 'tat-ca' || khungCua(c.scoringMode) === khung).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
      </select>
    </>
  );
  /* Chip lọc (B11, G6 "số 0 không bấm"): số 0 mờ, không bấm — trừ khi đang bật (để còn tắt được). */
  const chipLoc = (key: string, nhan: string, so: number | string, bat: boolean, onBat: () => void, title?: string, tat?: boolean) => (so === 0 && !bat) || tat
    ? <span key={key} className="nut-loc nut-loc-tat" aria-disabled="true" title={title}>{nhan} <b className="tabular-nums">{so}</b></span>
    : <button key={key} type="button" className="nut-loc" title={title} aria-pressed={bat} onClick={onBat}>{nhan} <b className="tabular-nums">{so}</b></button>;
  /* Chip vai ít gặp (Thiếu thông tin · Chờ chọn bước tiếp) vào Bộ lọc thêm để dải lọc một hàng ở 1440; đang bật (link Tổng quan) thì vẫn hiện ở dải. */
  const CHIP_VAI_PHU = ['thieu_tt', 'cho-buoc-tiep'] as const;
  const laChipPhu = (k: string) => (CHIP_VAI_PHU as readonly string[]).includes(k);
  const chipVaiNut = (k: (typeof CHIP_VAI_TRANG)[number]) => chipLoc(k, CHIP_VAI_NHAN[k].nhan, vaiTrang ? soEm(goc0.filter((h) => coChipVai(h, k))) : theoVai.error ? '!' : '…',
    chipVai === k, () => batChipVai(chipVai === k ? null : k), CHIP_VAI_NHAN[k].goiY);
  const soLocThem = chuLocThem.filter(Boolean).length + (sapXep === 'chu-y' ? 1 : 0) + (chipVai && laChipPhu(chipVai) ? 1 : 0);
  const nhomHien: NhomLop[] = pt.cat(nhomLop).map((g) => {
    const l = lop.get(g.id);
    return {
      id: g.id, hv: g.hv, mo: moSet.has(g.id), onMo: () => doiMo(g.id), nhan: l?.code ?? t('Chưa xếp lớp'),
      dau: <DauLop lop={l} hv={g.hv} vai={vai} dangLoc={dangLoc} cuaToi={pv?.dangDung === 'cua-toi'}
        onSos={(m) => setParam({ view: 'sos', classId: String(g.id), muc: String(m), mo: null })}
        dsLop={{ loai: 'lop', nhan: t('Lớp'), ids: (data?.rows ?? []).map((c) => c.id) }} onThemHocVien={(x) => setThem(x)} />,
    };
  });
  /* Ý 4: MỘT nút đổi chữ "Mở tất cả" ↔ "Thu gọn tất cả" — các lớp trên trang đang xem (không nạp thêm trang); lớp mở nhớ ở URL `mo`. */
  const moHet = nhomHien.length > 0 && nhomHien.every((g) => g.mo);
  const nutMoHet = nhomHien.length > 0 && (
    <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]"
      onClick={() => setParam({ mo: moHet ? '-' : nhomHien.map((g) => g.id).join(',') })}>{moHet ? t('Thu gọn tất cả') : t('Mở tất cả')}</button>
  );
  const boLoc = () => { setDraftQ(''); setParam({ q: null, thi: null, qh: null, loc: null, view: null, classId: null, sx: null, ...BO_LOC_THEM }); };
  const chuDangLoc = [q.trim() ? `“${q.trim()}”` : null, lopDangLoc?.code ?? null, locThiThang ? t('Thi tháng này') : null, locQuaHan ? t('Có việc quá hạn') : null,
    locDaThi ? LOC_HOC_VIEN_NHAN['da-thi'].nhan : null, chipVai ? CHIP_VAI_NHAN[chipVai].nhan : null, ...chuLocThem].filter(Boolean).join(' · ');
  const menuTrang: MucMenu[] = [
    ...(dienThoai ? [{ key: 'xuat', nhan: t('Xuất Excel · {n} HV', { n: idsXuat.length }), tat: !idsXuat.length, onChon: () => setXuat(true) }] : []),
    ...(dienThoai && data?.coTheThemHocVien ? [{ key: 'hoc-vien-moi', nhan: t('+ Thêm học viên'), onChon: () => setThem(null) }] : []),
    ...(data?.coTheTaoLop ? [{ key: 'lop-moi', nhan: t('+ Lớp mới'), keTruoc: dienThoai, onChon: () => setTaoLop(true) }] : []),
    /* TVV / CX: không có Lưu trữ (bảng V4 của vai không có — giữ quyền như cũ). */
    ...(laVai ? [] : [{ key: 'luu-tru', nhan: nhanLuuTru(data?.demLuuTru ?? { lop: 0, hv: 0 }), keTruoc: !!data?.coTheTaoLop || dienThoai, onChon: () => navigate('/hoc-vien/luu-tru') }]),
  ];

  const nutMenuTrang = <MenuDong nhan={t('Thao tác trang')} muc={menuTrang} lopNut="btn h-9 w-9 shrink-0 justify-center !px-0 font-bold max-sm:h-11 max-sm:w-11" />;

  return (
    <div className="page space-y-3">
      {/* Đầu trang một hàng (mockup U04): tên · Xem · Fast Track / Lớp thường · phải: Xuất Excel · + Thêm học viên · ⋯. 375: Xuất + Thêm vào ⋯ (B26). */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="m-0 mr-1 text-[22px] font-bold text-slate-100">{t('Học viên & Lớp')}</h1>
        {!dienThoai && oXem}
        {!dienThoai && chonKhung}
        <div className="ml-auto flex items-center gap-2">
          {!dienThoai && <button type="button" className="btn h-9 whitespace-nowrap text-sm font-semibold" data-hd="hvl-xuat" disabled={!idsXuat.length} aria-expanded={xuat} onClick={() => setXuat(true)}>{t('Xuất Excel · {n} HV', { n: idsXuat.length })}</button>}
          {!dienThoai && data?.coTheThemHocVien && <button type="button" className="btn btn-primary h-9 text-sm max-sm:hidden" onClick={() => setThem(null)}>{t('+ Thêm học viên')}</button>}
          {!(dienThoai && goc === 'tat-ca') && nutMenuTrang}
        </div>
      </div>
      {dienThoai && (oXem || chonKhung) && <div className="flex items-center gap-2 [&>.doan]:flex-1">{oXem}{chonKhung}</div>}

      <HangTab v8 soMo panelId="hvl-vung" ariaLabel={t('Chế độ xem')} value={goc} onChange={doiGoc} tabs={[
        { key: 'tat-ca', label: t('Tất cả'), so: data && (!laVai || vaiTrang) ? soEm(goc0) : null },
        ...(admin ? [] : [{ key: 'sos' as const, label: t('Đang SOS'), so: sos.data ? soEm(sosTat.map((r) => ({ id: r.studentId }))) : null }]),
        { key: 'lich-thi', label: t('Lịch thi'), so: data ? demLich : null },
        ...(coGocPc ? [{ key: 'phan-cong' as const, label: t('Phân công GV') }] : []),
      ]} />

      {/* DON-NHO-3 (TAB-A11Y): vùng tab cùng space-y-3 của trang → khoảng cách không đổi. */}
      <div id="hvl-vung" role="tabpanel" aria-label={t('Chế độ xem')} className="space-y-3">
        {goc !== 'tat-ca' && lopDangLoc && 'needScores' in lopDangLoc && <DaiLop lop={lopDangLoc as LopTrenTrang} vai={vai} dsLop={{ loai: 'lop', nhan: t('Lớp'), ids: (data?.rows ?? []).map((c) => c.id) }} soViecQuaHan={new Set(goc0.filter(coQuaHan).map((h) => h.id)).size}
          onThemHocVien={() => setThem(chiLop ? { id: chiLop, code: lopDangLoc.code } : null)} onBo={() => setParam({ classId: null })} />}

        {trang.error && <ErrorState message={trang.error.message} hint={trang.error.hint} status={trang.error.status} onRetry={trang.reload} />}
        {trang.loading && !data && <Skeleton rows={6} />}

        {goc === 'tat-ca' && data && (
          <>
            {/* Thanh lọc (mockup `.loc`): tìm · chip (số 0 mờ) · Bộ lọc thêm · phải: n HV · m lớp · Mở / Thu gọn tất cả. 375: chip vào nút "Lọc" (B26). */}
            <div className="loc-hv flex flex-wrap items-center gap-2" data-hd="hvl-goc">
              {locTim}
              {dienThoai && (
                <button type="button" className={`btn btn-sm min-h-[44px] ${moLoc || dangLoc ? 'nut-loc-dang' : ''}`} aria-expanded={moLoc} onClick={() => setMoLoc(!moLoc)}>{t('Lọc')}</button>
              )}
              {dienThoai && nutMenuTrang}
              {(!dienThoai || moLoc) && <>
                {/* Link cũ có `classId` (badge quá hạn của lớp, trang khác) → Tất cả chỉ lớp đó; chip để bỏ. */}
                {chiLop && <button type="button" className="nut-loc nut-loc-dang" onClick={() => setParam({ classId: null })} aria-label={t('Bỏ lọc lớp')}>{lopDangLoc?.code ?? t('Lớp')} ✕</button>}
                {chipLoc('thi', t('Thi tháng này'), demThi, locThiThang, () => setParam({ thi: locThiThang ? null : '1' }))}
                {laVai && CHIP_VAI_TRANG.filter((k) => !laChipPhu(k) || chipVai === k).map(chipVaiNut)}
                {/* U04-5 (PTA chốt [XM] b): việc CỦA TÔI quá hạn — cùng nguồn cột Việc. */}
                {coViec && chipLoc('qh', t('Có việc quá hạn'), work.error ? '!' : work.data ? demQh : '…', locQuaHan,
                  () => { if (work.error) work.reload(); setParam({ qh: locQuaHan ? null : '1', view: null, loc: null }); }, t('Chỉ việc của bạn'), !work.data && !work.error)}
                {chipLoc('da-thi', t('Đã thi · chờ KQ'), demDaThi, locDaThi, () => setParam({ loc: locDaThi ? null : 'da-thi', ...(laVai ? { view: null } : {}) }), LOC_HOC_VIEN_NHAN['da-thi'].goiY)}
                <button type="button" className={`nut-loc ${soLocThem ? 'nut-loc-dang' : ''}`} aria-expanded={moLocThem} data-hd="hvl-loc-them" onClick={() => setParam({ lt: moLocThem ? null : '1' })}>
                  {t('Bộ lọc thêm')} ▾{soLocThem ? <span className="tabular-nums font-medium">{soLocThem}</span> : null}
                </button>
              </>}
              <span className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-[13px] text-dim max-sm:ml-0 max-sm:w-full max-sm:justify-between">
                <span><b className="tabular-nums text-slate-100">{soEm(hvLoc)}</b> HV · <b className="tabular-nums text-slate-100">{nhomLop.filter((g) => g.id > 0).length}</b> {t('lớp')}{nutMoHet && <span className="max-sm:hidden"> ·</span>}</span>
                {nutMoHet}
              </span>
            </div>
            {dangLoc && (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-dim" role="status">
                <span>{q.trim() ? t('Đang tìm') : t('Đang lọc')}: <b className="text-slate-100">{chuDangLoc}</b>{[tenCn, khung === 'ft' ? 'Fast Track' : khung === 'thuong' ? t('Lớp thường') : null].filter(Boolean).map((x) => ` · ${x}`).join('')}
                  {' — '}{t('{n} HV ở {m} lớp', { n: soEm(hvLoc), m: nhomLop.filter((g) => g.id > 0).length })}</span>
                <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" onClick={boLoc}>{t('Bỏ lọc')}</button>
              </div>
            )}
            {moLocThem && (
              <div role="group" aria-label={t('Bộ lọc thêm')} className="card space-y-2 p-3 text-sm">
                {laVai && CHIP_VAI_PHU.some((k) => chipVai === k || goc0.some((h) => coChipVai(h, k))) && (
                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('Theo vai')}>
                    <span className="w-full text-xs text-slate-400 sm:w-40">{t('Theo vai')}</span>
                    {CHIP_VAI_PHU.filter((k) => chipVai === k || goc0.some((h) => coChipVai(h, k))).map(chipVaiNut)}
                  </div>
                )}
                {!admin && <>
                  <NhomLocThem ten={t('Case / PA')} ds={LOC_CASE} nhan={(k) => t(NHAN_LOC_CASE[k])} dang={locThem.case} onBat={(k) => batLoc('lc', locThem.case, k)} />
                  <NhomLocThem ten={t('Kỹ năng cần xử lý')} ds={LOC_KY_NANG} nhan={(k) => KN_NGAN[k]} dang={locThem.kn} onBat={(k) => batLoc('lk', locThem.kn, k)} />
                  <NhomLocThem ten={t('Kết quả gần nhất')} ds={LOC_KET_QUA} nhan={(k) => t(NHAN_LOC_KET_QUA[k])} dang={locThem.kq} onBat={(k) => batLoc('lq', locThem.kq, k)} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-full text-xs text-slate-400 sm:w-40">{t('Thời gian')}</span>
                    {locThem.tu && locThem.den ? (
                      <>
                        <BoChonThoiGian khoang={{ kieu: kieuKhoang, tu: locThem.tu, den: locThem.den }} onChange={(k) => setParam({ ltu: k.tu, lden: k.den, lkieu: k.kieu })} />
                        <button type="button" className="nut-loc nut-loc-dang" onClick={() => setParam({ ltu: null, lden: null, lkieu: null })}>{t('Mọi lúc')} ✕</button>
                      </>
                    ) : (
                      <button type="button" className="nut-loc" onClick={() => { const k = khoangMacDinh(homNay); setParam({ ltu: k.tu, lden: k.den, lkieu: k.kieu }); }}>{t('Chọn khoảng')}</button>
                    )}
                  </div>
                </>}
                {/* Thứ tự em TRONG lớp (giữ từ bảng cũ): Tên · Cần chú ý trước (việc quá hạn → SOS cao). */}
                <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('Xếp em trong lớp')}>
                  <span className="w-full text-xs text-slate-400 sm:w-40">{t('Xếp em trong lớp')}</span>
                  <button type="button" className="nut-loc" aria-pressed={sapXep === 'lop'} onClick={() => setParam({ sx: null })}>{t('Theo tên')}</button>
                  <button type="button" className="nut-loc" aria-pressed={sapXep === 'chu-y'} onClick={() => setParam({ sx: 'chu-y' })}>{t('Cần chú ý trước')}</button>
                </div>
                {batThem && (
                  <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm sm:min-h-0" onClick={() => setParam({ ...BO_LOC_THEM, lt: '1' })}>{t('Xoá lọc thêm')}</button>
                )}
              </div>
            )}
            <div className={`card overflow-hidden !p-0 ${trang.cu ? 'dang-tai-lai' : ''}`} aria-busy={trang.cu || undefined}>
            {theoVai.error && <div className="p-3"><ErrorState message={theoVai.error.message} hint={theoVai.error.hint} status={theoVai.error.status} onRetry={theoVai.reload} /></div>}
            {laVai && !vaiTrang && !theoVai.error ? <div className="p-3"><Skeleton rows={6} /></div>
            : laVai && pv?.dangDung === 'cua-toi' && dsEm.length === 0 && !q.trim() ? (
              <Empty title={t('Chưa có học viên nào của bạn')} hint={t('Học viên có TVV là bạn sẽ hiện ở đây.')}
                action={<button type="button" className="btn btn-sm" onClick={() => setParam({ phamVi: 'chi-nhanh' })}>{t('Xem cả chi nhánh')}</button>} />
            ) : data.scopeEmpty || nhomLop.length === 0 ? (
              <Empty title={data.scopeEmpty ? t('Bạn chưa được cấp phạm vi nào') : q.trim() ? t('Không có học viên nào khớp “{q}”', { q: q.trim() }) : t('Không có học viên nào khớp')}
                hint={data.scopeEmpty ? t('Tài khoản này chưa có vai trò kèm chi nhánh hoặc phân công lớp nào.') : t('Bỏ bớt từ khoá, đổi chip lọc hoặc đổi phạm vi.')}
                action={dangLoc ? (
                  /* XM-1 (PTA 03/11, mockup khu F): đường đi tiếp — chỉ đổi bộ lọc trên URL, cùng đường danh sách. "Mọi chi nhánh" chỉ khi vai có mục đó. */
                  <span className="flex flex-wrap justify-center gap-2">
                    {q.trim() && coThePv.includes('tat-ca') && pv?.dangDung !== 'tat-ca' && (
                      <button type="button" className="btn btn-sm" onClick={() => setParam({ phamVi: 'tat-ca', cn: null, branchId: null })}>{t('Tìm ở Mọi chi nhánh')}</button>
                    )}
                    {q.trim() && khung !== 'tat-ca' && (
                      <button type="button" className="btn btn-sm" onClick={() => { const k = khung === 'ft' ? 'thuong' : 'ft'; nhoKhung(k); setParam({ khung: k }); }}>{khung === 'ft' ? t('Tìm ở Lớp thường') : t('Tìm ở Fast Track')}</button>
                    )}
                    <button type="button" className="btn btn-sm" onClick={boLoc}>{q.trim() ? t('Bỏ tìm') : t('Bỏ lọc')}</button>
                  </span>
                ) : undefined} />
            ) : (
              <>
                {dienThoai ? <TheHvGon nhom={nhomHien} lop={lop} viec={viecHien} nguCanh={dsHocVien} onMoViec={moViec} onDoi={lamMoi} vai={vaiBang} tim={q} />
                  : <BangHvGon nhom={nhomHien} lop={lop} viec={viecHien} nguCanh={dsHocVien} onMoViec={moViec} onDoi={lamMoi} vai={vaiBang} tim={q} />}
                {/* Phân trang chỉ cuối bảng (B-04 cũ — bỏ bản lặp trên). */}
                {nhomLop.length > pt.thanh.co && <div className="border-t px-3" style={{ borderColor: 'var(--line)' }}><PhanTrang {...pt.thanh} duoi /></div>}
              </>
            )}
            </div>
          </>
        )}

        {goc === 'sos' && (
          <div className="card overflow-hidden !p-0">
            <div className="flex flex-wrap items-center gap-2 border-b p-3" style={{ borderColor: 'var(--line)' }} role="group" aria-label={t('Lọc SOS')}>
              {locChung}
              <button type="button" className="nut-loc" aria-pressed={!mucSos} onClick={() => setParam({ muc: null })}>{t('Tất cả')} <span className="tabular-nums">{soEm(sosTat.map((r) => ({ id: r.studentId })))}</span></button>
              {(['3', '2', '1'] as const).map((m) => (
                <button key={m} type="button" className="nut-loc" aria-pressed={mucSos === m} onClick={() => setParam({ muc: mucSos === m ? null : m })}>
                  SOS {m} · <span className="tabular-nums">{sosTat.filter((r) => r.sosLevel === Number(m)).length}</span>
                </button>
              ))}
              <button type="button" className="nut-loc" aria-pressed={mucSos === 'pa'} onClick={() => setParam({ muc: mucSos === 'pa' ? null : 'pa' })}>
                {t('PA quá hạn')} · <span className="tabular-nums">{sosTat.filter(coPaQuaHan).length}</span>
              </button>
            </div>
            <div className={sos.cu ? 'dang-tai-lai' : undefined} aria-busy={sos.cu || undefined}>
            {sos.error ? <div className="p-3"><ErrorState message={sos.error.message} hint={sos.error.hint} status={sos.error.status} onRetry={sos.reload} /></div>
              : !sos.data ? <div className="p-3"><Skeleton rows={6} /></div>
              : sosRows.length === 0 ? <Empty title={t('Không có học viên SOS')} />
              : (
                <>
                  {sosRows.length > pt.thanh.co && <div className="px-3"><PhanTrang {...pt.thanh} /></div>}
                  <BangSosGon rows={pt.cat(sosRows)} hang={hangTheoEm} nguCanh={dsHocVien}
                    onMo={(r: DongSos) => setPanelEm({ id: r.studentId, caseMo: r.cases.find((c) => !c.done)?.id ?? null })} />
                  {sosRows.length > pt.thanh.co && <div className="px-3"><PhanTrang {...pt.thanh} duoi /></div>}
                </>
              )}
            </div>
          </div>
        )}

        {goc === 'lich-thi' && (
          <GocLichThi duongGoc={qs.slice(qs.indexOf('?'))} thangUrl={params.get('thang')} onDoiThang={(m) => setParam({ thang: m.join(',') })}
            onIds={setIdsLichThi} ds={{ loai: 'hoc-vien', nhan: t('Lịch thi'), ids: idsLichThi }} locTren={locChung} loc={trongLoc} />
        )}

        {/* key: đổi chi nhánh (đã OK "rời đi sẽ mất") → góc dựng lại, nháp chi nhánh cũ không theo sang. */}
        {goc === 'phan-cong' && (
          <GocPhanCongGv key={pv?.dangDung === 'chi-nhanh' ? pv.chiNhanh ?? 0 : 0} branchId={pv?.dangDung === 'chi-nhanh' ? pv.chiNhanh ?? null : null} khung={khung}
            q={params.get('tim') ?? ''} onQ={(v) => setParam({ tim: v || null })}
            coTheTaoLop={!!data?.coTheTaoLop} onTaoLop={() => setTaoLop(true)}
            chonCn={(branches.data?.length ?? 0) > 0 && (
              <OChiNhanh branches={branches.data ?? []} branchId={null} tatCa
                onBranch={(id) => { if (id === null) return; nhoChiNhanh(session?.user?.id, id); setParam({ phamVi: 'chi-nhanh', cn: String(id), branchId: null }); }} />
            )} />
        )}
      </div>

      {xuat && (
        <NganXuatDs ids={idsXuat} ca={caXuat} boLoc={boLocXuat} onDong={() => setXuat(false)}
          {...(goc === 'sos' ? { mauMacDinh: 'theo-doi-sos' as const }
            : goc === 'lich-thi' ? { macDinh: ['ten', 'gmail', 'lop', 'coSo', 'target', 'lichThi', 'ketLuan', 'ghiChuHop'] as KhoaCotXuatDs[] }
            : { mauMacDinh: 'ket-qua-thi' as const, macDinh: COT_XUAT_TAT_CA })} />
      )}
      {viecMo && (
        <PanelViec it={viecMo} onDong={() => setViecMo(null)} onTiep={null} onDaLam={lamMoi} />
      )}
      {panelEm && (
        <PanelMotEm key={panelEm.id} studentId={panelEm.id} caseMo={panelEm.caseMo} viecTrang={viecHien.get(panelEm.id)?.map((x) => x.it)} onClose={() => setPanelEm(null)}
          onDoi={lamMoi} />
      )}
      {taoLop && (
        <ClassCreatePanel onClose={() => setTaoLop(false)}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); trang.reload(); }} />
      )}
      {them !== false && (
        <IntakePanel defaultClass={them} onClose={() => setThem(false)}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/students'); trang.reload(); }} />
      )}
    </div>
  );
}

/** Một nhóm của Bộ lọc thêm: nhãn nhóm + các nút bật / tắt (bấm lại = bỏ). Trong nhóm là "hoặc". */
function NhomLocThem<K extends string>({ ten, ds, nhan, dang, onBat }: { ten: string; ds: readonly K[]; nhan: (k: K) => string; dang: readonly string[]; onBat: (k: K) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={ten}>
      <span className="w-full text-xs text-slate-400 sm:w-40">{ten}</span>
      {ds.map((k) => <button key={k} type="button" className="nut-loc" aria-pressed={dang.includes(k)} onClick={() => onBat(k)}>{nhan(k)}</button>)}
    </div>
  );
}

/** Badge việc của lớp (bài chờ chấm → Lịch Test, chờ duyệt, quá hạn, xếp lớp …, cùng `badgeLop`) — bấm = đích của badge. Giữ từ hàng lớp V4 (`10` mục 8). */
function NhanLop({ lop, vai, soViecQuaHan, bo }: { lop: LopTrenTrang; vai: VaiXemHocVien | null; soViecQuaHan: number; bo?: (key: string) => boolean }) {
  const navigate = useNavigate();
  const { session } = useSession();
  const bGoc = badgeLop({
    vai: laVaiQuanLy(session?.roles) ? 'ql' : 'gv', needsPlacement: lop.needsPlacement, canXepLop: lop.canXepLop, missingSkills: lop.missingSkills,
    soBaiChoCham: lop.needScores, needScoresTitle: lop.needScores > 0 ? needScoresText(lop.workScope, lop.needScores) : null,
    phase: lop.phase, soChoDuyet: lop.soChoDuyet, soViecQuaHan,
    missingCount: lop.missing.filter((m) => m.key !== 'teachers').length, soChuaLoTrinhTiep: lop.soChuaLoTrinhTiep, chuongTrinh: lop.programmeCode,
  });
  const badge = [...bGoc.hien, ...bGoc.an].filter((x) => badgeHienTheoVai(vai, x.key) && !bo?.(x.key));
  const denBadge = (x: BadgeLop): string | null =>
    x.key === 'cham' && session?.nav?.test ? duongLichTest({ classId: lop.id })
      : x.key === 'xep-lop' ? (lop.viewer.coTheChuyenTiep ? `/hoc-vien/lop/${lop.id}?viec=chuyen-tiep` : `/hoc-vien/lop/${lop.id}`)
      : x.key === 'cho-duyet' && session?.nav?.workApprove ? `/cong-viec/cho-duyet?lop=${lop.id}`
      : x.key === 'qua-han' ? `/hoc-vien?view=qua-han&classId=${lop.id}`
      : null;
  if (!badge.length) return null;
  return (
    <span className="nhan-lop flex flex-wrap items-center gap-1.5 font-normal">
      {badge.map((x) => { const den = denBadge(x); return <Nhan key={x.key} tone={toneBadgeLop(x)} title={x.title} onClick={den ? () => navigate(den) : undefined}>{x.nhan}</Nhan>; })}
    </span>
  );
}

/** ⋯ của lớp: Hồ sơ lớp · Nhập điểm (panel) · + Học viên (lớp điền sẵn) — giữ từ hàng lớp V4. */
function MenuLop({ lop, dsLop, onThemHocVien }: { lop: LopTrenTrang; dsLop: NguCanhDs; onThemHocVien: () => void }) {
  const navigate = useNavigate();
  const [nhapDiem, setNhapDiem] = useState(false);
  const muc: MucMenu[] = [
    { key: 'ho-so', nhan: t('Hồ sơ lớp'), onChon: () => navigate(`/hoc-vien/lop/${lop.id}`, { state: { ds: dsLop } }) },
    ...(lop.viewer.coTheNhapDiem ? [{ key: 'nhap-diem', nhan: t('Nhập điểm'), onChon: () => setNhapDiem(true) }] : []),
    ...(lop.viewer.coTheThemHocVien ? [{ key: 'them', nhan: t('+ Học viên'), onChon: onThemHocVien }] : []),
  ];
  return (
    <>
      <MenuDong muc={muc} nhan={t('Thao tác khác')} lopNut="ba-cham" />
      {nhapDiem && <PanelNhapDiemLop classId={lop.id} classCode={lop.code} onDong={() => setNhapDiem(false)} />}
    </>
  );
}

/** Ô SOS của hàng lớp (MAU-MUC, giống Tổng quan V8): mỗi mức có em = chip "SOS n" + ô số HV (bấm → Đang SOS của lớp, đúng mức); mức 0 không vẽ; không em nào → "Không SOS". */
function OSosLop({ sos, onSos }: { sos: number[]; onSos: (muc: number) => void }) {
  if (!sos.some(Boolean)) return <span className="text-[13px] text-dim">{t('Không SOS')}</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 font-normal">
      {sos.map((n, i) => n > 0 && (
        <span key={i} className="inline-flex items-center gap-0.5 whitespace-nowrap">
          <span className={`${CHIP_SOS} ${lopSos(i + 1)}`}>SOS {i + 1}</span>
          <button type="button" className="o-so" aria-label={t('SOS mức {m}: {n} HV', { m: i + 1, n })} onClick={() => onSos(i + 1)}>{n}</button>
          <span className="text-[13px] text-dim">HV</span>
        </span>
      ))}
    </span>
  );
}

/** B09 (AUDIT 03/11): số HV = em đang học, mỗi em một lần (U04-3: em Kết thúc học không còn trong danh sách) — cùng `demLoc` máy chủ và sĩ số Tổng quan / Hồ sơ lớp. */
const soEm = (ds: readonly { id: number }[]) => new Set(ds.map((h) => h.id)).size;

/**
 * HÀNG LỚP (V11 U04, bài học UX-A "tách rõ trường"): các ô thẳng cột giữa các lớp — mã lớp (link Hồ sơ lớp) · n HV · GVCN · SOS (lớp FT) · chip tình trạng
 * (bấm = sang đúng trang) · ⋯ lớp. Đang lọc: "3/7 HV khớp"; TVV "HV của tôi": "3 HV của tôi / 7". Lớp ngoài danh sách (em TVV Tạm dừng…) chỉ có mã.
 */
/** Chương trình đã chọn trong phiên (tab trình duyệt) — mở lại Học viên & Lớp không phải chọn lại. sessionStorage bị chặn → mặc định. */
const KHOA_KHUNG = 'pisa-hvl-khung';
function docKhungDaNho(): 'ft' | 'thuong' | null {
  try { const v = sessionStorage.getItem(KHOA_KHUNG); return v === 'ft' || v === 'thuong' ? v : null; } catch { return null; }
}
function nhoKhung(k: 'ft' | 'thuong') { try { sessionStorage.setItem(KHOA_KHUNG, k); } catch { /* bỏ qua */ } }

/** "Nguyễn Hoàng Dũng" → "N. H. Dũng" (hàng lớp 375). */
const tenNgan = (ten: string) => { const w = ten.trim().split(/\s+/); return w.length < 2 ? ten : `${w.slice(0, -1).map((x) => `${x[0]}.`).join(' ')} ${w[w.length - 1]}`; };

function DauLop({ lop, hv, vai, dsLop, onThemHocVien, onSos, dangLoc, cuaToi }: {
  lop: (LopGon & Partial<LopTrenTrang>) | undefined; hv: HvGon[]; vai: VaiXemHocVien | null;
  dsLop: NguCanhDs; onThemHocVien: (lop: { id: number; code: string }) => void; onSos: (muc: number) => void; dangLoc: boolean; cuaToi: boolean;
}) {
  const day = lop && 'needScores' in lop ? (lop as LopTrenTrang) : null;
  const sos = [1, 2, 3].map((m) => new Set(hv.filter((h) => h.hang?.hoTro.sos === m).map((h) => h.id)).size);
  const n = soEm(hv);
  return (
    <>
      <span className="hl-o">{lop ? <Link to={`/hoc-vien/lop/${lop.id}`} state={{ ds: dsLop }} className="ten-ho-so khong-mui text-[15px] font-bold">{lop.code}</Link>
        : <span>{t('Chưa xếp lớp')}</span>}</span>
      <span className="hl-o text-[13px] text-dim">
        <b className="tabular-nums font-semibold text-slate-100">{n}</b>{day && (dangLoc || cuaToi) ? <span className="tabular-nums">/{day.studentCount}</span> : null} {dangLoc ? t('HV khớp') : cuaToi ? t('HV của tôi') : 'HV'}
      </span>
      <span className="hl-o text-[13px] text-dim">{day?.gvcn && <>
        <span className="max-sm:hidden">{t('GVCN')} <b className="font-semibold text-slate-100"><TenGiaoVien id={day.gvcn.id} ten={day.gvcn.name} /></b></span>
        {/* 375 (mockup): "7 HV · N. H. Dũng" — họ, đệm viết tắt. */}
        <span className="sm:hidden">· <TenGiaoVien id={day.gvcn.id} ten={tenNgan(day.gvcn.name)} /></span>
      </>}</span>
      <span className="hl-o">{day && day.scoringMode !== 'ratio' && <OSosLop sos={sos} onSos={onSos} />}</span>
      {/* Quá hạn đã có chip "Có việc quá hạn" của dải lọc. "n bài chờ chấm" → Lịch Test, "chờ duyệt" → Công việc, lộ trình → Hồ sơ lớp. */}
      <span className="hl-o">{day && <NhanLop lop={day} vai={vai} soViecQuaHan={0} bo={(k) => k === 'qua-han'} />}</span>
      <span className="hl-o hl-nut">{day && <MenuLop lop={day} dsLop={dsLop} onThemHocVien={() => onThemHocVien({ id: day.id, code: day.code })} />}</span>
    </>
  );
}

/**
 * DẢI LỚP khi lọc một lớp ở Đang SOS / Lịch thi (Tất cả đã chia theo lớp): mã (mở Hồ sơ lớp) · chương trình · n HV · GVCN · badge việc của lớp · ⋯ · ✕ bỏ lọc.
 */
function DaiLop({ lop, vai, soViecQuaHan, dsLop, onThemHocVien, onBo }: {
  lop: LopTrenTrang; vai: VaiXemHocVien | null; soViecQuaHan: number; dsLop: NguCanhDs; onThemHocVien: () => void; onBo: () => void;
}) {
  const thuong = lop.scoringMode === 'ratio';
  const chuLop = [lop.programmeName ? dich(lop.programmeName) : '—', !thuong && lop.route ? lop.route : null, t('{n} HV', { n: lop.studentCount })].filter(Boolean).join(' · ');
  return (
    <div className="card flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2" aria-label={t('Lớp {lop}', { lop: lop.code })}>
      <Link to={`/hoc-vien/lop/${lop.id}`} state={{ ds: dsLop }} className="ten-ho-so khong-mui font-bold">{lop.code}</Link>
      <span className="min-w-0 text-xs text-slate-400">
        {chuLop}{lop.gvcn && <> · {t('GVCN')} <TenGiaoVien id={lop.gvcn.id} ten={lop.gvcn.name} /></>}
      </span>
      <NhanLop lop={lop} vai={vai} soViecQuaHan={soViecQuaHan} />
      <span className="ml-auto flex items-center gap-2">
        <MenuLop lop={lop} dsLop={dsLop} onThemHocVien={onThemHocVien} />
        <button type="button" className="btn btn-sm max-sm:min-h-[44px] max-sm:min-w-[44px]" onClick={onBo} aria-label={t('Bỏ lọc lớp')}>✕</button>
      </span>
    </div>
  );
}
