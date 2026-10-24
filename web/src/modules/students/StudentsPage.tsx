import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { invalidate } from '../../lib/api.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { docChiNhanhDaNho, nhoChiNhanh, type Branch } from '../../ui/Filters.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { Nhan, toneBadgeLop } from '../../ui/Nhan.tsx';
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
import { BangHvGon, BangSosGon, TheHvGon, coPaQuaHan, type EmVai, type HvGon, type LopGon, type VaiBang, type ViecEm } from './DanhSachHvLop.tsx';
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
  hocVien: { id: number; classId: number; loc: LocHocVien[]; khung: 'ft' | 'thuong'; ten: string; ma: string; thieu?: string[]; ketThuc?: true; them?: ThemEm; hang?: HangHv; tvv?: string | null; lich?: LichThi }[];
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
const CHIP_VAI_TRANG: Exclude<ChipVai, 'tat-ca' | 'da-thi'>[] = ['can-chu-y', 'tam-dung', 'sap-thi', 'thieu_tt', 'cho-buoc-tiep'];
const CHIP_VAI_NHAN: Record<(typeof CHIP_VAI_TRANG)[number], { nhan: string; goiY: string }> = {
  'can-chu-y': { nhan: t('Cần chú ý'), goiY: t('SOS ở MT gần nhất, Case mới hoặc Ý thức trong 14 ngày, chờ chọn bước tiếp sau thi.') },
  'tam-dung': { nhan: t('Tạm dừng'), goiY: t('Đang Tạm dừng học.') },
  'sap-thi': { nhan: t('Sắp thi'), goiY: t('Dự kiến thi IELTS trong 6 tuần tới.') },
  thieu_tt: { nhan: t('Thiếu thông tin'), goiY: t('Hồ sơ còn thiếu thông tin cần để xếp lịch và theo dõi (không tính liên hệ).') },
  'cho-buoc-tiep': { nhan: t('Chờ chọn bước tiếp'), goiY: t('Đã có kết quả thi thật, chờ chọn bước tiếp.') },
};
/** Phạm vi của vai: TVV "HV của tôi" (mặc định) · Chi nhánh; CX mọi chi nhánh (mặc định) · một chi nhánh. */
const PHAM_VI_VAI: Record<'tvv' | 'cx', PhamVi[]> = { tvv: ['cua-toi', 'chi-nhanh'], cx: ['tat-ca', 'chi-nhanh'] };


type Goc = 'tat-ca' | 'sos' | 'lich-thi';
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
  const goc: Goc = gocUrl.goc === 'lich-thi' ? 'lich-thi' : gocUrl.goc === 'sos' && !admin ? 'sos' : 'tat-ca';
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
  const tuLienKet = useRef(coDichLienKet(params)).current;
  const daNho = tuLienKet ? null : docChiNhanhDaNho(session?.user?.id);
  const phamViUrl = params.get('phamVi');
  const chiLop = params.get('classId') ? Number(params.get('classId')) : null;
  const khungUrl = params.get('khung');
  const khungMuon = khungUrl === 'ft' || khungUrl === 'thuong' ? khungUrl : 'tat-ca';
  const [draftQ, setDraftQ] = useState(q);
  const [them, setThem] = useState(false);
  const [taoLop, setTaoLop] = useState(false);
  const dienThoai = useDienThoai();

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
  const trang = useApi<TrangHocVienLop>('chuyenDen' in doc ? null : qs);
  const branches = useApi<Branch[]>('/ref/branches');
  const data = trang.data;
  /* Đang SOS: cùng phạm vi trang (`qs`). Số trên tab cần nguồn này nên tải luôn (Admin không có chế độ này). */
  const duongSos = useMemo(() => {
    const s = new URLSearchParams(qs.slice(qs.indexOf('?') + 1));
    s.set('goc', 'sos');
    return `/hoc-vien-lop?${s.toString()}`;
  }, [qs]);
  const sos = useApi<TrangSos>(admin || 'chuyenDen' in doc ? null : duongSos);
  /* Cột Việc + chip "Có việc quá hạn": việc ở Công việc — QL / Admin mọi người (cùng chi nhánh trang), GV việc của mình. Chờ trang tải xong mới gọi. */
  const laQl = laVaiQuanLy(session?.roles);
  const cnViec = data?.phamVi.dangDung === 'chi-nhanh' ? data.phamVi.chiNhanh : null;
  const duongViec = laQl || admin ? `/my-work?nguoi=tat-ca${cnViec ? `&branchId=${cnViec}` : ''}` : '/my-work';
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
    const them = theoVai.data.rows.filter((d) => !co.has(d.id)
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
    ...(d.status === 'finished' ? { ketThuc: true as const } : {}),
  }))], [data, vaiTrang]);
  const vaiBang: VaiBang | undefined = vaiTrang ? { em: vaiTrang.em, coViec, onMoEm: (id) => setPanelEm({ id, caseMo: null }) } : undefined;
  /* Việc theo em, gấp nhất trước (quá hạn → hạn sớm). Việc nhiều em (`emIds`) tính cho từng em. */
  const viec = useMemo(() => {
    const m = new Map<number, ViecEm[]>();
    for (const it of (work.data?.dong ?? []).flatMap((x) => (x.con?.length ? x.con : [x]))) {
      const v: ViecEm = { chu: it.tieuDe, han: it.due, quaHan: it.urgency === 'overdue', it };
      for (const id of it.studentId !== null ? [it.studentId] : it.emIds ?? []) m.set(id, [...(m.get(id) ?? []), v]);
    }
    for (const ds of m.values()) ds.sort((a, b) => Number(b.quaHan) - Number(a.quaHan) || (a.han ?? '9').localeCompare(b.han ?? '9'));
    return m;
  }, [work.data]);

  /* Chương trình (Fast Track · Lớp thường) chỉ có nghĩa khi phạm vi có cả hai loại lớp. */
  const soLopTheoKhung = { ft: 0, thuong: 0 };
  for (const c of data?.rows ?? []) soLopTheoKhung[khungCua(c.scoringMode)] += 1;
  const coHaiKhung = soLopTheoKhung.ft > 0 && soLopTheoKhung.thuong > 0;
  const khung = coHaiKhung ? khungMuon : 'tat-ca';
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
      || Number(!!a.ketThuc) - Number(!!b.ketThuc) || a.ten.localeCompare(b.ten, 'vi')),
  [dsEm, khung, chiLop, batThem, params, sapXep, viec]);   // eslint-disable-line react-hooks/exhaustive-deps
  const coChipVai = (h: { id: number }, k: string) => !!vaiTrang?.tap[k]?.has(h.id);
  const hvLoc = goc0.filter((h) => (!locThiThang || thiThangNay(h)) && (!locQuaHan || coQuaHan(h)) && (!locDaThi || h.loc.includes('da-thi'))
    && (!chipVai || coChipVai(h, chipVai)));
  const demDaThi = new Set(goc0.filter((h) => h.loc.includes('da-thi')).map((h) => h.id)).size;
  const demThi = new Set(goc0.filter(thiThangNay).map((h) => h.id)).size;
  const demQh = new Set(goc0.filter(coQuaHan).map((h) => h.id)).size;
  const soEm = (ds: readonly { id: number }[]) => new Set(ds.map((h) => h.id)).size;

  const trongLoc = (classId: number, ft: boolean) => (!chiLop || classId === chiLop) && (khung === 'tat-ca' || (ft ? 'ft' : 'thuong') === khung);
  const sosTat = (sos.data?.rows ?? []).filter((r) => trongLoc(r.classId, r.ft));
  const sosRows = sosTat.filter((r) => (mucSos === 'pa' ? coPaQuaHan(r) : mucSos ? r.sosLevel === Number(mucSos) : true));
  const hangTheoEm = useMemo(() => new Map((data?.hocVien ?? []).map((h) => [h.id, h.hang])), [data]);

  /* Số trên tab Lịch thi: em có tháng thi trong khoảng đang xem (cùng khoảng của chế độ Lịch thi, không gồm "Chưa có tháng thi"). */
  const [tuThang, denThang] = khoangThang(params.get('thang'), homNay);
  const demLich = new Set(goc0.filter((h) => !h.ketThuc && h.lich?.thang && h.lich.thang >= tuThang && h.lich.thang <= denThang).map((h) => h.id)).size;

  const khoaLoc = [goc, q, khung, chiLop, locThiThang, locQuaHan, locDaThi, chipVai, mucSos, branchId, phamViUrl, sapXep, ...['lc', 'lk', 'lq', 'ltu', 'lden'].map((k) => params.get(k))].join('|');
  const pt = usePhanTrang(goc === 'tat-ca' ? hvLoc.length : goc === 'sos' ? sosRows.length : 0, khoaLoc, t('HV'));

  const pv = data?.phamVi;
  const lopDangLoc = chiLop ? lop.get(chiLop) : null;
  const tenCn = pv?.dangDung === 'chi-nhanh' ? (branches.data ?? []).find((b) => b.id === pv.chiNhanh)?.name ?? null : null;
  const dsHocVien: NguCanhDs = { loai: 'hoc-vien', nhan: t('Học viên & Lớp'), ids: goc === 'sos' ? sosRows.map((r) => r.studentId) : hvLoc.map((h) => h.id) };
  /* L5 (PTA 24/10): số trên trang = dòng đang thấy — em đã kết thúc học (mờ ở lớp cuối) tính ở tab, dải, phân trang VÀ Xuất. */
  const idsXuat = goc === 'tat-ca' ? [...new Set(hvLoc.map((h) => h.id))]
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
  /* Ô lọc chung (tìm · phạm vi · chi nhánh · chương trình · lớp) — đứng đầu dải lọc của mỗi chế độ. */
  const locChung = (
    <>
      <input className="field h-8 w-full sm:w-60 max-sm:min-h-[44px]" aria-label={t('Tìm')} placeholder={t('Tìm học viên, lớp')}
        value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
      {pv && coThePv.length > 1 && (
        <select className={SELECT_GON} aria-label={t('Phạm vi')} value={pv.dangDung}
          onChange={(e) => setParam({ phamVi: e.target.value, cn: null, branchId: null })}>
          {coThePv.map((v) => <option key={v} value={v}>{dich(PHAM_VI_NHAN[v])}</option>)}
        </select>
      )}
      {pv?.dangDung === 'chi-nhanh' && (branches.data?.length ?? 0) > 1 && (
        <select className={SELECT_GON} aria-label={t('Chi nhánh')} value={pv.chiNhanh ?? ''}
          onChange={(e) => { nhoChiNhanh(session?.user?.id, Number(e.target.value)); setParam({ phamVi: 'chi-nhanh', cn: e.target.value, branchId: null }); }}>
          {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      {coHaiKhung && (
        <select className={SELECT_GON} aria-label={t('Chương trình')} value={khung} onChange={(e) => setParam({ khung: e.target.value === 'tat-ca' ? null : e.target.value })}>
          <option value="tat-ca">{t('Mọi chương trình')}</option>
          <option value="ft">Fast Track</option>
          <option value="thuong">{t('Lớp thường')}</option>
        </select>
      )}
      {/* Chọn một lớp → dải lớp (badge + ⋯ Hồ sơ lớp · Nhập điểm · + Học viên) — thay hàng lớp của bảng cũ. */}
      <select className={SELECT_GON} aria-label={t('Lớp')} value={chiLop ?? ''} onChange={(e) => setParam({ classId: e.target.value || null })}>
        <option value="">{t('Mọi lớp')}</option>
        {(data?.rows ?? []).filter((c) => khung === 'tat-ca' || khungCua(c.scoringMode) === khung).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
      </select>
    </>
  );

  return (
    <div className="page space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="m-0 text-xl font-bold text-slate-100">{t('Học viên & Lớp')}</h1>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" data-hd="hvl-xuat" disabled={!idsXuat.length} aria-expanded={xuat} onClick={() => setXuat(true)}>{t('Xuất Excel · {n} HV', { n: idsXuat.length })}</button>
          {data?.coTheThemHocVien && <button type="button" className="btn btn-sm btn-primary max-sm:hidden" onClick={() => setThem(true)}>{t('+ Thêm học viên')}</button>}
          <MenuDong nhan={t('Thao tác trang')} muc={[
            ...(dienThoai && data?.coTheThemHocVien ? [{ key: 'hoc-vien-moi', nhan: t('+ Thêm học viên'), onChon: () => setThem(true) }] : []),
            ...(data?.coTheTaoLop ? [{ key: 'lop-moi', nhan: t('+ Lớp mới'), onChon: () => setTaoLop(true) }] : []),
            /* TVV / CX: không có Lưu trữ (bảng V4 của vai không có — giữ quyền như cũ). */
            ...(laVai ? [] : [{ key: 'luu-tru', nhan: nhanLuuTru(data?.demLuuTru ?? { lop: 0, hv: 0 }), keTruoc: !!data?.coTheTaoLop || dienThoai, onChon: () => navigate('/hoc-vien/luu-tru') }]),
          ]} />
        </div>
      </div>

      <HangTab ariaLabel={t('Chế độ xem')} value={goc} onChange={doiGoc} tabs={[
        { key: 'tat-ca', label: t('Tất cả'), so: data && (!laVai || vaiTrang) ? soEm(goc0) : null },
        ...(admin ? [] : [{ key: 'sos' as const, label: t('Đang SOS'), so: sos.data ? soEm(sosTat.map((r) => ({ id: r.studentId }))) : null }]),
        { key: 'lich-thi', label: t('Lịch thi'), so: data ? demLich : null },
      ]} />

      {lopDangLoc && 'needScores' in lopDangLoc && <DaiLop lop={lopDangLoc as LopTrenTrang} vai={vai} dsLop={{ loai: 'lop', nhan: t('Lớp'), ids: (data?.rows ?? []).map((c) => c.id) }} soViecQuaHan={new Set(goc0.filter(coQuaHan).map((h) => h.id)).size}
        onThemHocVien={() => setThem(true)} onBo={() => setParam({ classId: null })} />}

      {trang.error && <ErrorState message={trang.error.message} hint={trang.error.hint} onRetry={trang.reload} />}
      {trang.loading && !data && <Skeleton rows={6} />}

      {goc === 'tat-ca' && data && (
        <div className="card overflow-hidden !p-0">
          <div className="flex flex-wrap items-center gap-2 border-b p-3" style={{ borderColor: 'var(--line)' }} data-hd="hvl-goc">
            {locChung}
            <button type="button" className="nut-loc" aria-pressed={locThiThang} onClick={() => setParam({ thi: locThiThang ? null : '1' })}>
              {t('Thi tháng này')} · <span className="tabular-nums">{demThi}</span>
            </button>
            {laVai && CHIP_VAI_TRANG.filter((k) => (k !== 'thieu_tt' && k !== 'cho-buoc-tiep') || chipVai === k || goc0.some((h) => coChipVai(h, k))).map((k) => (
              <button key={k} type="button" className="nut-loc" title={CHIP_VAI_NHAN[k].goiY} aria-pressed={chipVai === k} onClick={() => batChipVai(chipVai === k ? null : k)}>
                {CHIP_VAI_NHAN[k].nhan} · <span className="tabular-nums">{vaiTrang ? soEm(goc0.filter((h) => coChipVai(h, k))) : theoVai.error ? '!' : '…'}</span>
              </button>
            ))}
            {/* Đếm theo `/my-work` của người xem: GV = việc của mình; QL / Admin = việc mọi người trong chi nhánh đang xem (như Công việc "Tất cả"). */}
            {coViec && <button type="button" className="nut-loc" aria-pressed={locQuaHan} disabled={!work.data && !work.error}
              title={laQl || admin ? t('Việc quá hạn của mọi người trong chi nhánh') : t('Chỉ việc của bạn')}
              onClick={() => { if (work.error) work.reload(); setParam({ qh: locQuaHan ? null : '1', view: null, loc: null }); }}>
              {t('Có việc quá hạn')} · <span className="tabular-nums">{work.error ? '!' : work.data ? demQh : '…'}</span>
            </button>}
            <button type="button" className="nut-loc" title={LOC_HOC_VIEN_NHAN['da-thi'].goiY} aria-pressed={locDaThi} onClick={() => setParam({ loc: locDaThi ? null : 'da-thi', ...(laVai ? { view: null } : {}) })}>
              {LOC_HOC_VIEN_NHAN['da-thi'].nhan} · <span className="tabular-nums">{demDaThi}</span>
            </button>
            {!admin && (
              <button type="button" className={`nut-loc ${batThem ? 'nut-loc-dang' : ''}`} aria-expanded={moLocThem} data-hd="hvl-loc-them" onClick={() => setParam({ lt: moLocThem ? null : '1' })}>
                {t('Bộ lọc thêm')}{chuLocThem.filter(Boolean).length ? <span className="tabular-nums font-medium">{chuLocThem.filter(Boolean).length}</span> : null}
              </button>
            )}
            <span className="ml-auto flex items-center gap-3 max-sm:w-full">
              <select className={SELECT_GON} aria-label={t('Cách xếp')} value={sapXep} onChange={(e) => setParam({ sx: e.target.value === 'chu-y' ? 'chu-y' : null })}>
                <option value="lop">{t('Xếp: Lớp · tên')}</option>
                <option value="chu-y">{t('Xếp: Cần chú ý trước')}</option>
              </select>
              <span className="text-xs tabular-nums text-slate-400 max-sm:hidden">{t('{n} HV · {m} lớp', { n: soEm(hvLoc), m: new Set(hvLoc.filter((h) => h.classId > 0).map((h) => h.classId)).size })}</span>
            </span>
          </div>
          {!admin && moLocThem && (
            <div role="group" aria-label={t('Bộ lọc thêm')} className="space-y-2 border-b p-3 text-sm" style={{ borderColor: 'var(--line)' }}>
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
              {batThem && (
                <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm sm:min-h-0" onClick={() => setParam({ ...BO_LOC_THEM, lt: '1' })}>{t('Xoá lọc thêm')}</button>
              )}
            </div>
          )}
          {theoVai.error && <div className="p-3"><ErrorState message={theoVai.error.message} hint={theoVai.error.hint} onRetry={theoVai.reload} /></div>}
          {laVai && !vaiTrang && !theoVai.error ? <div className="p-3"><Skeleton rows={6} /></div>
          : laVai && pv?.dangDung === 'cua-toi' && dsEm.length === 0 && !q.trim() ? (
            <Empty title={t('Chưa có học viên nào của bạn')} hint={t('Học viên có TVV là bạn sẽ hiện ở đây.')}
              action={<button type="button" className="btn btn-sm" onClick={() => setParam({ phamVi: 'chi-nhanh' })}>{t('Xem cả chi nhánh')}</button>} />
          ) : data.scopeEmpty || hvLoc.length === 0 ? (
            <Empty title={data.scopeEmpty ? t('Bạn chưa được cấp phạm vi nào') : t('Không có học viên nào khớp')}
              hint={data.scopeEmpty ? t('Tài khoản này chưa có vai trò kèm chi nhánh hoặc phân công lớp nào.') : t('Bỏ bớt từ khoá, đổi chip lọc hoặc đổi phạm vi.')}
              action={q.trim() ? <button type="button" className="btn btn-sm" onClick={() => { setDraftQ(''); setParam({ q: null }); }}>{t('Xoá tìm')}</button> : undefined} />
          ) : (
            <>
              {hvLoc.length > pt.thanh.co && <div className="px-3"><PhanTrang {...pt.thanh} /></div>}
              {dienThoai ? <TheHvGon ds={pt.cat(hvLoc)} lop={lop} viec={viec} nguCanh={dsHocVien} onMoViec={moViec} onDoi={lamMoi} vai={vaiBang} />
                : <BangHvGon ds={pt.cat(hvLoc)} lop={lop} viec={viec} nguCanh={dsHocVien} onMoViec={moViec} onDoi={lamMoi} vai={vaiBang} />}
              {hvLoc.length > pt.thanh.co && <div className="px-3"><PhanTrang {...pt.thanh} duoi /></div>}
            </>
          )}
        </div>
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
          {sos.error ? <div className="p-3"><ErrorState message={sos.error.message} hint={sos.error.hint} onRetry={sos.reload} /></div>
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
      )}

      {goc === 'lich-thi' && (
        <GocLichThi duongGoc={qs.slice(qs.indexOf('?'))} thangUrl={params.get('thang')} onDoiThang={(m) => setParam({ thang: m.join(',') })}
          onIds={setIdsLichThi} ds={{ loai: 'hoc-vien', nhan: t('Lịch thi'), ids: idsLichThi }} locTren={locChung} />
      )}

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
        <PanelMotEm key={panelEm.id} studentId={panelEm.id} caseMo={panelEm.caseMo} onClose={() => setPanelEm(null)}
          onDoi={lamMoi} />
      )}
      {taoLop && (
        <ClassCreatePanel onClose={() => setTaoLop(false)}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); trang.reload(); }} />
      )}
      {them && (
        <IntakePanel defaultClass={chiLop && lopDangLoc ? { id: chiLop, code: lopDangLoc.code } : null} onClose={() => setThem(false)}
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

/**
 * DẢI LỚP khi lọc một lớp (thay hàng lớp của bảng cũ — giữ thao tác, `10` mục 8): mã (mở Hồ sơ lớp) · chương trình · n HV · GVCN · badge việc của lớp
 * (bài chờ chấm → Lịch Test, chờ duyệt, quá hạn, xếp lớp …, cùng `badgeLop`) · ⋯ Hồ sơ lớp · Nhập điểm · + Học viên · ✕ bỏ lọc.
 */
function DaiLop({ lop, vai, soViecQuaHan, dsLop, onThemHocVien, onBo }: {
  lop: LopTrenTrang; vai: VaiXemHocVien | null; soViecQuaHan: number; dsLop: NguCanhDs; onThemHocVien: () => void; onBo: () => void;
}) {
  const navigate = useNavigate();
  const { session } = useSession();
  const thuong = lop.scoringMode === 'ratio';
  const [nhapDiem, setNhapDiem] = useState(false);
  const chuLop = [lop.programmeName ? dich(lop.programmeName) : '—', !thuong && lop.route ? lop.route : null, t('{n} HV', { n: lop.studentCount })].filter(Boolean).join(' · ');
  const bGoc = badgeLop({
    vai: laVaiQuanLy(session?.roles) ? 'ql' : 'gv', needsPlacement: lop.needsPlacement, canXepLop: lop.canXepLop, missingSkills: lop.missingSkills,
    soBaiChoCham: lop.needScores, needScoresTitle: lop.needScores > 0 ? needScoresText(lop.workScope, lop.needScores) : null,
    phase: lop.phase, soChoDuyet: lop.soChoDuyet, soViecQuaHan,
    missingCount: lop.missing.filter((m) => m.key !== 'teachers').length, soChuaLoTrinhTiep: lop.soChuaLoTrinhTiep, chuongTrinh: lop.programmeCode,
  });
  const badge = [...bGoc.hien, ...bGoc.an].filter((x) => badgeHienTheoVai(vai, x.key));
  const denBadge = (x: BadgeLop): string | null =>
    x.key === 'cham' && session?.nav?.test ? duongLichTest({ classId: lop.id })
      : x.key === 'xep-lop' ? (lop.viewer.coTheChuyenTiep ? `/hoc-vien/lop/${lop.id}?viec=chuyen-tiep` : `/hoc-vien/lop/${lop.id}`)
      : x.key === 'cho-duyet' && session?.nav?.workApprove ? `/cong-viec/cho-duyet?lop=${lop.id}`
      : x.key === 'qua-han' ? `/hoc-vien?view=qua-han&classId=${lop.id}`
      : null;
  const muc: MucMenu[] = [
    { key: 'ho-so', nhan: t('Hồ sơ lớp'), onChon: () => navigate(`/hoc-vien/lop/${lop.id}`, { state: { ds: dsLop } }) },
    ...(lop.viewer.coTheNhapDiem ? [{ key: 'nhap-diem', nhan: t('Nhập điểm'), onChon: () => setNhapDiem(true) }] : []),
    ...(lop.viewer.coTheThemHocVien ? [{ key: 'them', nhan: t('+ Học viên'), onChon: onThemHocVien }] : []),
  ];
  return (
    <div className="card flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2" aria-label={t('Lớp {lop}', { lop: lop.code })}>
      <Link to={`/hoc-vien/lop/${lop.id}`} state={{ ds: dsLop }} className="font-extrabold text-slate-100 underline decoration-dotted underline-offset-4">{lop.code}</Link>
      <span className="min-w-0 text-xs text-slate-400">
        {chuLop}{lop.gvcn && <> · {t('GVCN')} <TenGiaoVien id={lop.gvcn.id} ten={lop.gvcn.name} /></>}
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {badge.map((x) => { const den = denBadge(x); return <Nhan key={x.key} tone={toneBadgeLop(x)} title={x.title} onClick={den ? () => navigate(den) : undefined}>{x.nhan}</Nhan>; })}
      </span>
      <span className="ml-auto flex items-center gap-2">
        <MenuDong muc={muc} nhan={t('Thao tác khác')} />
        <button type="button" className="btn btn-sm" onClick={onBo} aria-label={t('Bỏ lọc lớp')}>✕</button>
      </span>
      {nhapDiem && <PanelNhapDiemLop classId={lop.id} classCode={lop.code} onDong={() => setNhapDiem(false)} />}
    </div>
  );
}
