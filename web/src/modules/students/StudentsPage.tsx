import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { invalidate } from '../../lib/api.ts';
import { BoLocDoan, Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Nhan, toneBadgeLop } from '../../ui/Nhan.tsx';
import { HangNhom } from '../../ui/HangNhom.tsx';
import { CongTacKhung, khungDaNho, type KhungLoc } from '../../ui/CongTacKhung.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { docChiNhanhDaNho, nhoChiNhanh, type Branch } from '../../ui/Filters.tsx';
import {
  LOC_CASE, LOC_HOC_VIEN_NHAN, LOC_KET_QUA, LOC_KY_NANG, NHAN_LOC_CASE, NHAN_LOC_KET_QUA, coDichLienKet, demQuaHan, docLocThem, khoangMacDinh, khopLocThem, locThemBat,
  nhanKhoang, tachThieuEmail, KIEU_KHOANG, type KieuKhoang, type ThemEm,
} from '@shared/domain/index.ts';
import { BoChonThoiGian } from '../phanTich/BoChonThoiGian.tsx';
import { OChonTatCa, ThanhChonNhieu, type ChonNhieu } from './chonNhieuHocVien.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { IntakePanel } from './IntakePanel.tsx';
import { ClassCreatePanel } from '../classes/ClassCreatePanel.tsx';
import { TenGiaoVien } from '../classes/TenGiaoVien.tsx';
import { BangHocVienLop, COT_DIEM_FT, NHAN_COT_DIEM_FT } from './BangHocVienLop.tsx';
import {
  DUONG_TAB_CONG_VIEC, duongHocVienLop, LOAI_HAN_CUA_VIEC, PHAM_VI_NHAN, badgeHienTheoVai, badgeLop, demLoc, docGoc, docThamSoLoc, duongLichTest, khungCua, laVaiQuanLy, lopMoSan, needScoresText, tuanLich,
  type BadgeLop, type GocHocVien, type LocHocVien, type LocPhuCanLam, type NguCanhDs, type PhamVi, type SapXep, type WorkScope, vaiXemHocVien,
} from '@shared/domain/index.ts';
import { HocVienTheoVai } from './HocVienTheoVai.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { BangSos, type TrangSos } from './BangSos.tsx';
import { BangCanLam, type ViecCanLam } from './BangCanLam.tsx';
import { PanelMotEm } from './PanelMotEm.tsx';
import { PanelViec, lamTaiCho } from '../congViec/PanelViec.tsx';
import { SuaThongTinMotEm } from './StudentManagePanel.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { ChonTuanSos } from './ChonTuanSos.tsx';
import { PanelNhapDiemLop } from '../cham/PanelNhapDiemLop.tsx';
import { GocLichThi } from './GocLichThi.tsx';
import { NganXuatDs } from './NganXuatDs.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';

/** Ô chọn gọn của đầu trang: cùng cao 32 px với chip (điện thoại 44 px, `.field` đã có min-height 40). */
const SELECT_GON = 'field h-8 w-auto !py-0 text-xs max-sm:min-h-[44px] max-sm:w-full';

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
  hocVien: { id: number; classId: number; loc: LocHocVien[]; khung: 'ft' | 'thuong'; ten: string; ma: string; thieu?: string[]; ketThuc?: true; them?: ThemEm }[];
  /** Người xem có tạo được lớp MỚI ở chi nhánh nào không — không gắn với lớp đã tồn tại nào (điểm a rà soát cuối). */
  coTheTaoLop: boolean;
  /** HL-14: "+ Học viên" theo phạm vi, không theo kết quả ô tìm. */
  coTheThemHocVien: boolean;
  /** Số ở mục ⋯ "Lưu trữ" đầu trang (PR-LT, Q16). */
  demLuuTru: { lop: number; hv: number };
};

const KN_NGAN: Record<string, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };

/** "Lưu trữ · {n} lớp · {m} HV" — bỏ phần số 0, cả hai 0 thì chỉ "Lưu trữ" (§3.6, G-12). */
function nhanLuuTru(dem: { lop: number; hv: number }): string {
  const phan = [dem.lop > 0 ? t('{n} lớp', { n: dem.lop }) : null, dem.hv > 0 ? t('{n} HV', { n: dem.hv }) : null].filter(Boolean);
  return phan.length ? `${t('Lưu trữ')} · ${phan.join(' · ')}` : t('Lưu trữ');
}

/**
 * HỌC VIÊN & LỚP (đặc tả §3.6, mockup 07b phương án A) — một trang, học viên nằm dưới lớp của mình.
 * Điều khiển: một ô tìm · Phạm vi · chi nhánh (khi xem theo chi nhánh và có > 1) · Xếp · chip lọc có số đếm.
 * Mọi trạng thái nằm trên URL: tải lại trang và nút Back giữ đúng chỗ đang đứng.
 */
/** Việc Case ở Công việc → Panel một em (các việc khác giữ panel / hộp sẵn có). */
const VIEC_CASE = new Set(['xac_nhan_pa', 'ghi_ket_qua_pa', 'mini_test', 'no_plan', 'cause', 'ghi_nhan_xet']);

export default function StudentsPage() {
  const { session } = useSession();
  /* OV-10b: TVV / CX — bảng theo việc của vai (mockup vai 13/10 mục 1, 5); Admin giữ trang này với cột riêng; QL / GV không đổi. */
  const vai = vaiXemHocVien(session?.roles);
  return vai === 'tvv' || vai === 'cx' ? <HocVienTheoVai vai={vai} /> : <TrangTheoLop admin={vai === 'admin'} />;
}

function TrangTheoLop({ admin }: { admin: boolean }) {
  const navigate = useNavigate();
  const { homNay } = useNgayNghiepVu();
  const { can, session } = useSession();
  const [params, setParams] = useSearchParams();
  const doc = docThamSoLoc(params.get('view'));
  /* OV-12f: ba góc nhìn thay hàng chip — `view` (sos · can-lam) + lọc phụ `loc` + `tuan` trên URL; link cũ (qua-han, cho-duyet, thieu_tt) giữ nghĩa. */
  const gocUrl = docGoc(params.get('view'), params.get('loc'));
  const goc: GocHocVien = admin && gocUrl.goc === 'sos' ? 'tat-ca' : gocUrl.goc;   // Admin hai góc (không có Case)
  const locPhu: LocPhuCanLam | null = goc === 'can-lam' ? gocUrl.loc : null;
  const tuanUrl = params.get('tuan');
  const laQl = laVaiQuanLy(session?.roles);
  const q = params.get('q') ?? '';
  const cnUrl = params.get('cn') ?? params.get('branchId');
  const branchId = cnUrl ? Number(cnUrl) : null;
  /* Link trỏ một lớp / học viên (`classId`, `open`) không gửi lần chọn trước — lớp có thể ở chi nhánh khác (rà PR #205). Chỉ xét LÚC VÀO trang:
     mở / đóng lớp ghi `open=` nhưng không được đổi đường API (lỗi bản chính 14/10: mở lớp lần đầu → cả trang tải lại). */
  const tuLienKet = useRef(coDichLienKet(params)).current;
  const daNho = tuLienKet ? null : docChiNhanhDaNho(session?.user?.id);
  const phamViUrl = params.get('phamVi');
  const sapXep: SapXep = params.get('sx') === 'chu-y' ? 'chu-y' : 'ten';
  const chiLop = params.get('classId') ? Number(params.get('classId')) : null;
  const khungUrl = params.get('khung');
  const khungMuon: KhungLoc = khungUrl === 'ft' || khungUrl === 'thuong' || khungUrl === 'tat-ca' ? khungUrl : khungDaNho('hoc-vien-lop') ?? 'tat-ca';
  const openRaw = params.get('open');
  /* OV-15h2 (ý 3): Bộ lọc thêm của góc Tất cả — `lt` mở khối; `lc` Case / PA · `lk` kỹ năng · `lq` kết quả · `ltu`–`lden` tuần thi (máy chủ gắn nhãn khi có, `them=1`). */
  const locThem = docLocThem((k) => params.get(k));
  const moLocThem = params.get('lt') === '1';
  const kieuKhoang = (KIEU_KHOANG as readonly string[]).includes(params.get('lkieu') ?? '') ? params.get('lkieu') as KieuKhoang : 'tuy-chon';
  const [draftQ, setDraftQ] = useState(q);
  const [them, setThem] = useState<{ id: number; code: string } | null | 'dong'>('dong');
  const [taoLop, setTaoLop] = useState(false);
  const dienThoai = useDienThoai();
  /* PR-DH (Q-0310-4): thứ tự học viên từng lớp ĐANG HIỆN (đã lọc + sắp xếp) do bảng báo lên — để link tên em mang theo danh sách. */
  const [thuTu, setThuTu] = useState<Map<number, number[]>>(new Map());
  const baoThuTu = useCallback((classId: number, ids: number[]) => setThuTu((cu) => (
    cu.get(classId)?.join() === ids.join() ? cu : new Map(cu).set(classId, ids)
  )), []);

  const setParam = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k); else next.set(k, v);
    }
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    const t = setTimeout(() => { if (draftQ !== q) setParam({ q: draftQ || null, open: null }); }, 300);
    return () => clearTimeout(t);
  }, [draftQ, q, setParam]);

  const canNhan = moLocThem || locThemBat(locThem);
  const qs = useMemo(() => duongHocVienLop(params, { tuLienKet, daNho }), [q, phamViUrl, branchId, daNho, tuLienKet, canNhan]);   // eslint-disable-line react-hooks/exhaustive-deps
  const trang = useApi<TrangHocVienLop>('chuyenDen' in doc ? null : qs);
  const branches = useApi<Branch[]>('/ref/branches');
  const data = trang.data;
  /* Đang SOS: cùng phạm vi trang (`qs`) + tuần. Số trên nút góc cần cả hai nguồn nên tải luôn (Admin không có góc này). */
  const duongSos = useMemo(() => {
    const s = new URLSearchParams(qs.slice(qs.indexOf('?') + 1));
    s.set('goc', 'sos');
    if (tuanUrl) s.set('tuan', tuanUrl);
    return `/hoc-vien-lop?${s.toString()}`;
  }, [qs, tuanUrl]);
  const sos = useApi<TrangSos>(admin || 'chuyenDen' in doc ? null : duongSos);
  /* Cần làm: việc ở Công việc (`/my-work`, cùng số) — QL / Admin "Của GV" (làm thay được), GV việc của mình; cùng chi nhánh trang đang xem. */
  const cnViec = data?.phamVi.dangDung === 'chi-nhanh' ? data.phamVi.chiNhanh : null;
  const duongViec = laQl || admin ? `/my-work?nguoi=tat-ca${cnViec ? `&branchId=${cnViec}` : ''}` : '/my-work';
  /* Chờ trang tải xong mới gọi: QL / Quản trị "Của GV" không chi nhánh = tính toàn hệ thống (nặng trên Turso). */
  const work = useApi<{ dong: WorkItem[] }>('chuyenDen' in doc || !data ? null : duongViec, [duongViec]);
  const [panelEm, setPanelEm] = useState<{ id: number; caseMo: number | null } | null>(null);
  const [viecMo, setViecMo] = useState<WorkItem | null>(null);
  const [suaTT, setSuaTT] = useState<{ id: number; ten: string; lop: string | null } | null>(null);

  /* Công tắc khung chỉ có nghĩa khi phạm vi có CẢ hai loại lớp; khung đã nhớ mà không còn lớp nào thì về "Tất cả". */
  const soLopTheoKhung = { ft: 0, thuong: 0 };
  for (const c of data?.rows ?? []) soLopTheoKhung[khungCua(c.scoringMode)] += 1;
  const coHaiKhung = soLopTheoKhung.ft > 0 && soLopTheoKhung.thuong > 0;
  const khung: KhungLoc = coHaiKhung ? khungMuon : 'tat-ca';
  /* OV-15h2 (ý 3): em còn lại sau Bộ lọc thêm (chỉ góc Tất cả) — CÙNG danh sách cho số trên chip, bảng lớp và Xuất Excel. */
  const batThem = goc === 'tat-ca' && locThemBat(locThem);
  const hvTat = useMemo(() => (data?.hocVien ?? []).filter((h) => !batThem || khopLocThem(h.them, locThem)), [data, batThem, params]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* HL-9: lọc một lớp (badge "n HV quá hạn việc", "Thiếu n thông tin") → số trên chip đếm theo lớp đó, = số em hiện ra. */
  const dem = useMemo(() => demLoc(hvTat.filter((h) => !chiLop || h.classId === chiLop), khung), [hvTat, khung, chiLop]);
  /* Góc Tất cả: một lọc phụ "Đã thi · chờ kết quả" (OV-14b, cùng chip TVV / CX); Thiếu thông tin, Chờ duyệt, Quá hạn nằm trong Cần làm — P14. "HV của tôi" (TVV) — máy chủ chỉ gửi em mình. */
  const locDaThi = goc === 'tat-ca' && params.get('loc') === 'da-thi';
  const loc: LocHocVien = locDaThi ? 'da-thi' : 'tat-ca';
  const dangLoc = !!q.trim() || data?.phamVi.dangDung === 'cua-toi' || locDaThi || batThem;
  const idsTheoLop = useMemo(() => {
    const m = new Map<number, Set<number>>();
    for (const h of hvTat) {
      if (!h.loc.includes(loc)) continue;
      if (!m.has(h.classId)) m.set(h.classId, new Set());
      m.get(h.classId)!.add(h.id);
    }
    return m;
  }, [hvTat, loc]);

  // ------------------------------------------------------------------ OV-12f: góc Đang SOS · Cần làm
  const lopTrang = new Map((data?.rows ?? []).map((c) => [c.id, c]));
  const trongLoc = (classId: number | null, ft?: boolean) => {
    const l = classId !== null ? lopTrang.get(classId) : undefined;
    const k = ft !== undefined ? (ft ? 'ft' : 'thuong') : l ? khungCua(l.scoringMode) : null;
    return (!chiLop || classId === chiLop) && (khung === 'tat-ca' || k === khung);
  };
  const sosRows = (sos.data?.rows ?? []).filter((r) => trongLoc(r.classId, r.ft));
  const hvTheoId = new Map((data?.hocVien ?? []).map((h) => [h.id, h]));
  const moViec = (it: WorkItem) => {
    if (VIEC_CASE.has(it.group) && it.caseId && it.studentId) setPanelEm({ id: it.studentId, caseMo: it.caseId });
    else if (lamTaiCho(it)) setViecMo(it);
    else navigate(it.href);
  };
  /* OV-13b: việc của mọi lớp trên trang (chưa lọc khung / lớp) — nguồn badge "n việc quá hạn" (`demQuaHan`). */
  const viecLop = (work.data?.dong ?? []).flatMap((x) => (x.con?.length ? x.con : [x]))
    .map((it) => ({ quaHan: it.urgency === 'overdue', studentId: it.studentId, classId: it.classId }));
  const viecCongViec: ViecCanLam[] = [
    ...(work.data?.dong ?? []).flatMap((x) => (x.con?.length ? x.con : [x]))
      .filter((it) => it.classId !== null && lopTrang.has(it.classId) && trongLoc(it.classId))
      .map((it): ViecCanLam => ({
        key: it.key, studentId: it.studentId, ten: it.studentId !== null ? hvTheoId.get(it.studentId)?.ten ?? it.studentName : '',
        ma: it.studentId !== null ? hvTheoId.get(it.studentId)?.ma ?? null : null,
        classId: it.classId, classCode: it.classCode, soEm: it.studentId === null ? it.emIds?.length ?? it.count ?? 0 : undefined,
        viec: it.tieuDe, phu: it.contextLabel, nguoi: it.mine ? null : it.owner ?? '—',
        han: it.due, loaiHan: LOAI_HAN_CUA_VIEC[it.group] ?? null, quaHan: it.urgency === 'overdue', kieu: it.urgency === 'overdue' ? 'qua-han' : null,
        mo: () => moViec(it),
      })),
  ];
  /*
   * Chờ duyệt (QL: hộp Chờ duyệt lọc lớp; người khác: Yêu cầu của tôi) · Thiếu thông tin (Sửa thông tin tại chỗ) — hai chip cũ thành lọc phụ, không bỏ (P14).
   * QL: là việc của QL nên nằm luôn trong Cần làm (mockup 3 v2 §4); GV / Admin: không phải việc của mình — chỉ hiện khi bấm lọc phụ, không vào số Cần làm.
   */
  const viecPhu: ViecCanLam[] = [
    ...((data?.hocVien ?? []).filter((h) => trongLoc(h.classId)).flatMap((h): ViecCanLam[] => {
      const lop = lopTrang.get(h.classId);
      const chung = { studentId: h.id, ten: h.ten, ma: h.ma, classId: h.classId, classCode: lop?.code ?? null, han: null, loaiHan: null, quaHan: false, nguoi: '—' };
      return [
        ...(h.loc.includes('cho-duyet')
          ? [{ ...chung, key: `cho-duyet:${h.id}`, viec: t('Chờ duyệt'), phu: t('Yêu cầu chờ Quản lý'), kieu: 'cho-duyet' as const, nguoi: session?.nav?.workApprove ? null : t('Quản lý'),
            mo: () => navigate(session?.nav?.workApprove ? `${DUONG_TAB_CONG_VIEC['cho-duyet']}?lop=${h.classId}` : DUONG_TAB_CONG_VIEC['yeu-cau']) }] : []),
        /* OV-13f (Q8): thiếu email là việc riêng "Thiếu email" (cùng nhóm Thiếu thông tin), các ô thiếu khác gom một dòng như cũ. */
        ...(h.loc.includes('thieu_tt') ? tachThieuEmail(h.thieu ?? []).map((x) => ({ ...chung, key: `${x.khoa}:${h.id}`, viec: x.viec, phu: x.phu, kieu: 'thieu-tt' as const,
          mo: () => setSuaTT({ id: h.id, ten: h.ten, lop: lop?.code ?? null }) })) : []),
      ];
    })),
  ];
  const viecTatCa = laQl ? [...viecCongViec, ...viecPhu] : viecCongViec;
  const emCua = (ds: readonly ViecCanLam[]) => new Set(ds.flatMap((v) => (v.studentId !== null ? [v.studentId] : []))).size;
  const theoLocPhu = (k: LocPhuCanLam) => [...viecCongViec, ...viecPhu].filter((v) => (k === 'qua-han' ? v.quaHan : k === 'cho-duyet' ? v.kieu === 'cho-duyet' : v.kieu === 'thieu-tt'));
  const viecHien = locPhu ? theoLocPhu(locPhu) : viecTatCa;
  /* Lọc phụ của Cần làm: Quá hạn thường trực; Chờ duyệt · Thiếu thông tin khi có em (chip cũ không mất — P14; Admin không có thẻ chờ duyệt). */
  const locPhuCo = (['qua-han', 'cho-duyet', 'thieu_tt'] as const).filter((k) => !(admin && k === 'cho-duyet') && (k === 'qua-han' || k === locPhu || theoLocPhu(k).length > 0));
  const nhanLocPhu: Record<LocPhuCanLam, string> = { 'qua-han': t('Quá hạn'), 'cho-duyet': t('Chờ duyệt'), thieu_tt: t('Thiếu thông tin') };
  const demGoc: Record<GocHocVien, number | undefined> = {
    'tat-ca': data ? dem['tat-ca'] : undefined,
    sos: sos.data ? new Set(sosRows.map((r) => r.studentId)).size : undefined,
    'can-lam': work.data ? emCua(viecTatCa) : undefined,
    'lich-thi': undefined,
  };
  const myAssign = (session?.assignments ?? []).filter((a) => a.skill);
  const dam = !laQl && myAssign.length ? (topic: string | null) => !topic || myAssign.some((a) => a.skill === topic) : null;
  const moCase = (id: number, caseId: number) => setPanelEm({ id, caseMo: caseId });
  const BO_LOC_THEM = { lt: null, lc: null, lk: null, lq: null, ltu: null, lden: null, lkieu: null };
  const doiGoc = (g: GocHocVien) => { if (g === 'can-lam' && work.error) work.reload(); setParam({ view: g === 'tat-ca' ? null : g, loc: null, open: null, thang: null, ...BO_LOC_THEM }); };
  const batLoc = (khoa: 'lc' | 'lk' | 'lq', ds: readonly string[], k: string) =>
    setParam({ [khoa]: (ds.includes(k) ? ds.filter((x) => x !== k) : [...ds, k]).join(',') || null, open: null });

  const lopHien = (data?.rows ?? []).filter((c) => (khung === 'tat-ca' || khungCua(c.scoringMode) === khung)
    && (!chiLop || c.id === chiLop) && (!dangLoc || idsTheoLop.has(c.id)));
  /* M3, K2-03: nhóm theo kiểu lớp (Fast Track trước, lớp thường sau) — mỗi nhóm một khối tiêu đề cột riêng: "Target" cho FT, "Khoá" cho lớp thường. */
  const nhomLop = (['ft', 'thuong'] as const)
    .map((k) => ({ k, lop: lopHien.filter((c) => khungCua(c.scoringMode) === k) })).filter((g) => g.lop.length > 0);
  /*
   * OV-15f — PHÂN TRANG (mockup 6 khung 7): MỘT hook cho cả trang (cỡ trang nhớ chung) — góc nhóm (Tất cả) theo LỚP, góc phẳng (Đang SOS · Cần làm) theo dòng.
   * Đổi bộ lọc / góc → về trang 1. Xuất Excel lấy đủ mọi trang (từ danh sách gốc, không từ trang đang hiện).
   */
  const lopThuTu = nhomLop.flatMap((g) => g.lop);
  const tongGoc = goc === 'tat-ca' ? lopThuTu.length : goc === 'sos' ? sosRows.length : goc === 'can-lam' ? viecHien.length : 0;
  const khoaLoc = [goc, q, khung, chiLop, locDaThi, locPhu, branchId, phamViUrl, tuanUrl, ...['lc', 'lk', 'lq', 'ltu', 'lden'].map((k) => params.get(k))].join('|');
  const pt = usePhanTrang(tongGoc, khoaLoc, goc === 'tat-ca' ? t('lớp') : goc === 'sos' ? t('lượt') : t('việc'));
  const lopTrangNay = new Set(pt.cat(lopThuTu).map((c) => c.id));
  const nhomLopHien = nhomLop.map((g) => ({ ...g, lop: g.lop.filter((c) => lopTrangNay.has(c.id)) })).filter((g) => g.lop.length > 0);
  /* Xuất Excel (C31): đúng các em trang đang hiện theo góc + bộ lọc (số trên nút = số trong tệp). */
  const lopDangLoc = chiLop ? (data?.rows ?? []).find((c) => c.id === chiLop) : null;
  const idsLop = new Set(lopThuTu.map((c) => c.id));
  const idsXuat = goc === 'tat-ca' ? [...new Set(hvTat.filter((h) => !h.ketThuc && idsLop.has(h.classId) && (!dangLoc || h.loc.includes(loc))).map((h) => h.id))]
    : goc === 'sos' ? [...new Set(sosRows.map((r) => r.studentId))]
    : goc === 'can-lam' ? [...new Set(viecHien.flatMap((v) => (v.studentId !== null ? [v.studentId] : [])))] : [];
  const chuLocThem = [...locThem.case.map((k) => t(NHAN_LOC_CASE[k])), ...locThem.kn.map((k) => KN_NGAN[k]), ...locThem.kq.map((k) => t(NHAN_LOC_KET_QUA[k])),
    locThem.tu && locThem.den ? nhanKhoang({ kieu: kieuKhoang, tu: locThem.tu, den: locThem.den }).chinh : null];
  const boLocXuat = goc === 'tat-ca'
    ? [t('Tất cả'), locDaThi ? LOC_HOC_VIEN_NHAN['da-thi'].nhan : null, lopDangLoc ? lopDangLoc.code : null, q.trim() ? `“${q.trim()}”` : null, ...chuLocThem].filter(Boolean).join(' · ')
    : goc === 'sos' ? `${t('Đang SOS')}${sos.data?.tuan ? ` · ${tuanLich(sos.data.tuan, homNay)}` : ''}`
    : `${t('Cần làm')}${locPhu ? ` · ${nhanLocPhu[locPhu]}` : ''}`;
  const [xuat, setXuat] = useState<null | 'loc' | 'chon'>(null);
  /* OV-15h2 (ý 1): chọn HV để "Xuất các HV đã chọn" — giữ khi đổi trang / mở lớp; đổi bộ lọc thì bỏ chọn và báo (mockup 5 khung 2). */
  const toast = useToast();
  const [daChon, setDaChon] = useState<Set<number>>(new Set());
  const chon: ChonNhieu = useMemo(() => ({
    bat: true, chon: daChon, batTat: () => setDaChon(new Set()), bo: () => setDaChon(new Set()),
    doi: (id: number) => setDaChon((x) => { const n = new Set(x); if (n.has(id)) n.delete(id); else n.add(id); return n; }),
    /* "Chọn tất cả": thêm / bỏ các em đang hiện, giữ em đã chọn ở trang khác. */
    tatCa: (ids: number[], v: boolean) => setDaChon((x) => { const n = new Set(x); for (const i of ids) { if (v) n.add(i); else n.delete(i); } return n; }),
  }), [daChon]);
  const khoaLocChon = useRef(khoaLoc);
  useEffect(() => {
    if (khoaLocChon.current === khoaLoc) return;
    khoaLocChon.current = khoaLoc;
    if (daChon.size) { toast.push('info', t('Đã bỏ chọn {n} HV vì đổi bộ lọc', { n: daChon.size })); setDaChon(new Set()); }
  }, [khoaLoc]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* PR-DH (04/10): cột Dự kiến thi cho CẢ hai nhóm (lớp thường cũng có Target + Dự kiến thi sau PR-NT). */
  /* OV-10b (mockup vai mục 6): Admin — Học viên · Lượt MT gần nhất · Ô chưa nhập · ⋯ (không Case / Việc tiếp theo). */
  /* OV-15b (C13): nhóm FT thêm OVR · L · R · W · S sau Kết quả gần nhất (số căn giữa). */
  const tieuDeCot = (k: 'ft' | 'thuong') => admin ? [t('Học viên'), t('Lượt MT gần nhất'), t('Ô chưa nhập'), '']
    : [t('Học viên'), t('Kết quả gần nhất'), ...(k === 'ft' ? COT_DIEM_FT.map((c) => NHAN_COT_DIEM_FT[c]) : []), k === 'ft' ? 'Target' : t('Khoá'), t('Dự kiến thi'), t('Sắp tới'), 'Case', t('Việc tiếp theo'), ''];
  const canhCot = (k: 'ft' | 'thuong', i: number) => admin ? (i === 2 ? 'text-right' : '')
    : k === 'ft' && i >= 2 && i < 2 + COT_DIEM_FT.length ? 'text-center' : i === (k === 'ft' ? 5 + COT_DIEM_FT.length : 5) ? 'text-right' : '';
  const openIds = lopMoSan({
    thamSoOpen: openRaw === null ? null : openRaw === '-' ? []
      : openRaw.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0),
    lopHien: lopHien.map((c) => c.id),
    dangLoc,
  });
  const doiMo = (id: number) => {
    const s = new Set(openIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    setParam({ open: s.size ? [...s].join(',') : '-' });
  };
  /* OV-15h2 (ý 1): "Chọn tất cả" = các em đang HIỆN (lớp đang mở ở trang này, đúng bộ lọc) — em ở lớp đang gập không bị chọn ngầm. */
  const lopMoTrang = new Set(nhomLopHien.flatMap((g) => g.lop).filter((c) => openIds.includes(c.id)).map((c) => c.id));
  const idsDangHien = goc === 'tat-ca' ? [...new Set(hvTat.filter((h) => !h.ketThuc && lopMoTrang.has(h.classId) && (!dangLoc || h.loc.includes(loc))).map((h) => h.id))] : [];
  const chuChonTrang = t('Chọn tất cả HV đang hiện ở trang này · {n}', { n: idsDangHien.length });
  const pv = data?.phamVi;
  /* Danh sách học viên = các lớp đang MỞ, theo thứ tự trên màn (Fast Track trước); danh sách lớp = các lớp cùng nhóm khung. */
  const dsHocVien: NguCanhDs = { loai: 'hoc-vien', nhan: t('Học viên & Lớp'), ids: nhomLop.flatMap((g) => g.lop).filter((c) => openIds.includes(c.id)).flatMap((c) => thuTu.get(c.id) ?? []) };
  const dsLopCua = (g: { lop: LopTrenTrang[] }): NguCanhDs => ({ loai: 'lop', nhan: t('Lớp'), ids: g.lop.map((c) => c.id) });

  /* Đặt SAU mọi hook: chuyển trang khi link cũ trỏ chỗ khác (`chuyenDen`). */
  if ('chuyenDen' in doc) return <Navigate to={`${doc.chuyenDen}${branchId ? `?cn=${branchId}` : ''}`} replace />;

  return (
    <div className="page space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-100 m-0">{t('Học viên & Lớp')}</h1>
        {/* K1 (PR-HK1): nút và ⋯ đi cùng một khối — màn hẹp thì cả khối xuống dòng, ⋯ không rơi xuống dòng riêng. */}
        <div className="ml-auto flex items-center gap-2">
          {/*
            * "+ Lớp mới"/"+ Học viên" (điểm a rà soát cuối): KHÔNG dùng `can()` phía client — hàm đó chỉ kiểm vai có quyền
            * `student.edit` theo danh sách tĩnh, không có ngữ cảnh branchId/classId, nên GVCN/GVBM luôn thấy nút dù bấm vào
            * chắc chắn ra 403 (`hasAssignment` đòi `ctx.classId`/`ctx.branchId` cụ thể). Dùng đúng cờ máy chủ đã tính theo
            * TỪNG lớp/chi nhánh thay vào đó.
            */}
          {goc !== 'lich-thi' && idsXuat.length > 0 && (
            <button type="button" className="btn btn-sm max-sm:min-h-[44px]" data-hd="hvl-xuat" onClick={() => setXuat('loc')}>{t('Xuất Excel · {n} HV', { n: idsXuat.length })}</button>
          )}
          {data?.coTheTaoLop && <button type="button" className="btn btn-sm max-sm:hidden" onClick={() => setTaoLop(true)}>{t('+ Lớp mới')}</button>}
          {data?.coTheThemHocVien && (
            <button type="button" className="btn btn-sm btn-primary max-sm:hidden" onClick={() => setThem(null)}>{t('+ Học viên')}</button>
          )}
          {/* Điện thoại (< 640 px, K1/DH): hai nút tạo vào ⋯ — đầu trang chỉ còn một nút 44 px. */}
          <MenuDong nhan={t('Thao tác trang')} muc={[
            ...(dienThoai && data?.coTheTaoLop ? [{ key: 'lop-moi', nhan: t('+ Lớp mới'), onChon: () => setTaoLop(true) }] : []),
            ...(dienThoai && data?.coTheThemHocVien ? [{ key: 'hoc-vien-moi', nhan: t('+ Học viên'), onChon: () => setThem(null) }] : []),
            { key: 'luu-tru', nhan: nhanLuuTru(data?.demLuuTru ?? { lop: 0, hv: 0 }), keTruoc: dienThoai && !!data?.coTheTaoLop, onChon: () => navigate('/hoc-vien/luu-tru') },
          ]} />
        </div>
      </div>

      {/*
        * PR-DH (DH-5, mục 6) — đầu trang theo critique 04/10: MỘT trục trái (mép bảng), thang 8 px (8 giữa chip và giữa hai hàng, 16 tới bảng),
        * chip và ô chọn cùng cao 32 px (điện thoại 44 px). Hàng A: tìm · Phạm vi · Chi nhánh. Hàng B: chip lọc bên trái; "Loại lớp" + "Xếp"
        * bên phải từ 1024 px (hẹp hơn thì xuống dòng gọn). "Loại lớp" thay công tắc phân đoạn để hết hai chữ "Tất cả" cạnh nhau (K1).
        */}
      <div className="space-y-2 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <input className="field w-full sm:w-80" aria-label={t('Tìm')} placeholder={t('Lọc trong danh sách này…')}
            value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
          {pv && pv.coThe.length > 1 && (
            <select className={SELECT_GON} aria-label={t('Phạm vi')} value={pv.dangDung}
              onChange={(e) => setParam({ phamVi: e.target.value, cn: null, branchId: null, open: null })}>
              {pv.coThe.map((v) => <option key={v} value={v}>{t('Phạm vi: {pv}', { pv: PHAM_VI_NHAN[v] })}</option>)}
            </select>
          )}
          {pv?.dangDung === 'chi-nhanh' && (branches.data?.length ?? 0) > 1 && (
            <select className={SELECT_GON} aria-label={t('Chi nhánh')} value={pv.chiNhanh ?? ''}
              onChange={(e) => { nhoChiNhanh(session?.user?.id, Number(e.target.value)); setParam({ phamVi: 'chi-nhanh', cn: e.target.value, branchId: null, open: null }); }}>
              {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:flex-nowrap">
          {/* K1: điện thoại cuộn ngang, mép phải mờ báo còn chip; pr-8 để chip cuối cuộn ra khỏi vùng mờ. Không `pb` (không để lộ thanh cuộn). */}
          {/* OV-12f: thanh góc nhìn (số = số học viên) · vạch · lọc phụ của góc / tuần thi. Đổi góc thì lọc phụ về trống. */}
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 lg:flex-1" data-hd="hvl-goc">
            <BoLocDoan ariaLabel={t('Góc nhìn')} value={goc} onChange={doiGoc}
              muc={(admin ? (['tat-ca', 'can-lam', 'lich-thi'] as const) : (['tat-ca', 'sos', 'can-lam', 'lich-thi'] as const)).map((k) => ({
                key: k, nhan: k === 'tat-ca' ? t('Tất cả') : k === 'lich-thi' ? t('Lịch thi') : k === 'sos' ? (sos.data?.tuan ? `${t('Đang SOS')} · ${tuanLich(sos.data.tuan, homNay)}` : t('Đang SOS')) : t('Cần làm'),
                /* UX-1: tải việc lỗi → "!" + lý do, bấm thử lại (không im lặng). */
                ...(k === 'can-lam' && work.error ? { so: '!', title: t('Chưa tải được · bấm để thử lại') } : { so: demGoc[k] }),
              }))} />
            {chiLop && (
              <button type="button" className="btn btn-sm shrink-0 sm:h-8" title={t('Bỏ lọc lớp')} onClick={() => setParam({ classId: null })}>
                {t('Lớp {lop} ✕', { lop: lopDangLoc?.code ?? chiLop! })}
              </button>
            )}
            {goc === 'tat-ca' && (
              <button type="button" className="nut-loc" title={LOC_HOC_VIEN_NHAN['da-thi'].goiY} aria-pressed={locDaThi}
                onClick={() => setParam({ loc: locDaThi ? null : 'da-thi', open: null })}>
                {LOC_HOC_VIEN_NHAN['da-thi'].nhan}<span className="tabular-nums font-medium">{data ? dem['da-thi'] : ''}</span>
              </button>
            )}
            {goc === 'tat-ca' && !admin && (
              <button type="button" className={`nut-loc ${locThemBat(locThem) ? 'nut-loc-dang' : ''}`} aria-expanded={moLocThem} data-hd="hvl-loc-them"
                onClick={() => setParam({ lt: moLocThem ? null : '1' })}>
                {t('Bộ lọc thêm')}{chuLocThem.filter(Boolean).length ? <span className="tabular-nums font-medium">{chuLocThem.filter(Boolean).length}</span> : null}
              </button>
            )}
            {goc === 'can-lam' && (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('Lọc phụ')}>
                {locPhuCo.map((k) => (
                  <button key={k} type="button" className="nut-loc" aria-pressed={locPhu === k}
                    onClick={() => setParam({ view: 'can-lam', loc: locPhu === k ? null : k, open: null })}>
                    {nhanLocPhu[k]}<span className="tabular-nums font-medium">{k === 'qua-han' ? t('{n} việc', { n: demQuaHan(theoLocPhu(k)).viec }) : emCua(theoLocPhu(k))}</span>
                  </button>
                ))}
              </div>
            )}
            {goc === 'sos' && sos.data && (
              <ChonTuanSos tuan={sos.data.tuan} toanBo={sos.data.toanBo} tuanGanNhat={sos.data.tuanGanNhat} tu={sos.data.tu} den={sos.data.den}
                onChon={(t) => setParam({ tuan: t || null, open: null })} />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 max-sm:grid max-sm:w-full max-sm:grid-cols-2 lg:ml-auto">
            {goc !== 'lich-thi' && <CongTacKhung trang="hoc-vien-lop" coTatCa kieu="chon" value={khung}
              dem={{ 'tat-ca': data?.rows.length, ft: soLopTheoKhung.ft, thuong: soLopTheoKhung.thuong }}
              onChange={(k) => setParam({ khung: k === 'tat-ca' ? null : k, open: null })} />}
            {/* Xếp: Tất cả theo lựa chọn; Đang SOS theo tuần rồi tên, Cần làm theo hạn (mockup 3 v2 §1) — không cần ô chọn. */}
            {goc === 'tat-ca' && (
              <select className={SELECT_GON} aria-label={t('Cách xếp')} value={sapXep}
                onChange={(e) => setParam({ sx: e.target.value === 'chu-y' ? 'chu-y' : null })}>
                <option value="ten">{t('Xếp: Tên A→Z')}</option>
                <option value="chu-y">{t('Xếp: Cần chú ý trước')}</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {goc === 'tat-ca' && !admin && moLocThem && (
        /* OV-15h2 (ý 3, mockup 5 khung 2): trong một nhóm là "hoặc", giữa các nhóm là "và"; trạng thái hiện tại (Case đang mở, kết quả gần nhất). */
        <div role="group" aria-label={t('Bộ lọc thêm')} className="card space-y-2 p-3 text-sm">
          <NhomLocThem ten={t('Case / PA')} ds={LOC_CASE} nhan={(k) => t(NHAN_LOC_CASE[k])} dang={locThem.case} onBat={(k) => batLoc('lc', locThem.case, k)} />
          <NhomLocThem ten={t('Kỹ năng cần xử lý')} ds={LOC_KY_NANG} nhan={(k) => KN_NGAN[k]} dang={locThem.kn} onBat={(k) => batLoc('lk', locThem.kn, k)} />
          <NhomLocThem ten={t('Kết quả gần nhất')} ds={LOC_KET_QUA} nhan={(k) => t(NHAN_LOC_KET_QUA[k])} dang={locThem.kq} onBat={(k) => batLoc('lq', locThem.kq, k)} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-full text-xs text-slate-400 sm:w-40">{t('Tuần thi của kết quả')}</span>
            {locThem.tu && locThem.den ? (
              <>
                <BoChonThoiGian khoang={{ kieu: kieuKhoang, tu: locThem.tu, den: locThem.den }} onChange={(k) => setParam({ ltu: k.tu, lden: k.den, lkieu: k.kieu, open: null })} />
                <button type="button" className="nut-loc nut-loc-dang" onClick={() => setParam({ ltu: null, lden: null, lkieu: null })}>{t('Mọi lúc')} ✕</button>
              </>
            ) : (
              <button type="button" className="nut-loc" onClick={() => { const k = khoangMacDinh(homNay); setParam({ ltu: k.tu, lden: k.den, lkieu: k.kieu, open: null }); }}>{t('Chọn khoảng')}</button>
            )}
          </div>
          {locThemBat(locThem) && (
            <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm sm:min-h-0" onClick={() => setParam({ ...BO_LOC_THEM, lt: '1' })}>{t('Xoá lọc thêm')}</button>
          )}
        </div>
      )}
      {trang.error && <ErrorState message={trang.error.message} hint={trang.error.hint} onRetry={trang.reload} />}
      {trang.loading && !data && <Skeleton rows={6} />}
      {goc === 'tat-ca' && data && (lopHien.length === 0 ? (
        <Card>
          <Empty
            title={data.scopeEmpty ? t('Bạn chưa được cấp phạm vi nào') : t('Không có lớp hay học viên nào khớp')}
            hint={data.scopeEmpty
              ? t('Tài khoản này chưa có vai trò kèm chi nhánh hoặc phân công lớp nào.')
              : t('Bỏ bớt từ khoá, đổi chip lọc hoặc đổi phạm vi.')}
            action={q.trim() ? <button type="button" className="btn btn-sm" onClick={() => { setDraftQ(''); setParam({ q: null }); }}>{t('Xoá tìm')}</button> : undefined} />
        </Card>
      ) : (
        /*
         * Mỗi NHÓM khung (Fast Track · Lớp thường) là một <section> có khối tiêu đề cột riêng ("Target" / "Khoá"); trong nhóm mỗi lớp MỘT
         * bảng riêng (cùng colgroup nên cột thẳng nhau) — PR-UX0 N-2; menu ⋯ vẽ ra ngoài (portal).
         * YC-11.1 (PR-N1): từ 768px bỏ khung cuộn ngang; khối tiêu đề là khối dính riêng theo <main>, hàng lớp đang mở dính ngay dưới nó
         * (`.hang-lon-dinh`). Khối tiêu đề dính chỉ trong <section> của nhóm mình (bẫy sticky: `sticky` bị chặn trong phần tử cha) nên hai
         * nhóm không bao giờ chồng tiêu đề lên nhau; mỗi lớp một bảng thì hàng lớp chỉ dính trong bảng của nó (chủ sản phẩm 28/09).
         * Điện thoại: cả khối cuộn ngang, không dính.
         */
        <div className="space-y-3">
          {idsDangHien.length > 0 && (
            <label className="flex min-h-[44px] w-fit cursor-pointer items-center gap-2 text-xs text-slate-400 sm:min-h-0">
              <OChonTatCa chon={chon} ids={idsDangHien} nhan={chuChonTrang} />{chuChonTrang}
            </label>
          )}
          <PhanTrang {...pt.thanh} />
          {/* Điện thoại (< 640 px, D2): mỗi lớp một thẻ gập, mỗi em một thẻ con — không bảng, không cuộn ngang. */}
          {dienThoai && nhomLopHien.map((g) => (
            <section key={g.k} className="space-y-2" aria-label={g.k === 'ft' ? t('Lớp Fast Track') : t('Lớp thường')}>
              {nhomLopHien.length > 1 && <h2 className="m-0 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{g.k === 'ft' ? 'Fast Track' : t('Lớp thường')}</h2>}
              {g.lop.map((c) => (
                <HopLop key={c.id} the admin={admin} lop={c} soViecQuaHan={demQuaHan(viecLop, c.id).viec} mo={openIds.includes(c.id)} onDoiMo={() => doiMo(c.id)} dsHocVien={dsHocVien} dsLop={dsLopCua(g)} onThuTu={baoThuTu}
                  chiHien={dangLoc ? (idsTheoLop.get(c.id) ?? new Set()) : null} sapXep={sapXep} onMoCase={moCase} chon={chon}
                  onThemHocVien={() => setThem({ id: c.id, code: c.code })} onDoi={trang.reload} />
              ))}
            </section>
          ))}
          {!dienThoai && nhomLopHien.map((g) => (
            <section key={g.k} className="card overflow-x-auto md:overflow-visible" aria-label={g.k === 'ft' ? t('Lớp Fast Track') : t('Lớp thường')}>
              <div className="md:sticky md:-top-5 md:z-10" aria-hidden>
                <table className={`w-full ${g.k === 'ft' && !admin ? 'min-w-[1160px]' : 'min-w-[960px]'} table-fixed text-sm`}>
                  <CotBangLop admin={admin} ft={g.k === 'ft'} />
                  <thead><tr>{tieuDeCot(g.k).map((x, i) => <th key={i} className={`th ${canhCot(g.k, i)}`}>{x}</th>)}</tr></thead>
                </table>
              </div>
              {g.lop.map((c) => (
                <table key={c.id} className={`w-full ${g.k === 'ft' && !admin ? 'min-w-[1160px]' : 'min-w-[960px]'} table-fixed text-sm`} aria-label={t('Lớp {lop}', { lop: c.code })}>
                  <CotBangLop admin={admin} ft={g.k === 'ft'} />
                  <thead className="sr-only"><tr>{tieuDeCot(g.k).map((x, i) => <th key={i}>{x || t('Thao tác')}</th>)}</tr></thead>
                  <HopLop admin={admin} lop={c} soViecQuaHan={demQuaHan(viecLop, c.id).viec} mo={openIds.includes(c.id)} onDoiMo={() => doiMo(c.id)} dsHocVien={dsHocVien} dsLop={dsLopCua(g)} onThuTu={baoThuTu}
                    chiHien={dangLoc ? (idsTheoLop.get(c.id) ?? new Set()) : null} sapXep={sapXep} onMoCase={moCase} chon={chon}
                    onThemHocVien={() => setThem({ id: c.id, code: c.code })} onDoi={trang.reload} />
                </table>
              ))}
            </section>
          ))}
          <PhanTrang {...pt.thanh} duoi />
          <ThanhChonNhieu chon={chon} viec={[{ key: 'xuat', nhan: t('Xuất các HV đã chọn'), chinh: true }]} onViec={() => setXuat('chon')} />
        </div>
      ))}

      {goc === 'sos' && (
        sos.error ? <ErrorState message={sos.error.message} hint={sos.error.hint} onRetry={sos.reload} />
          : !sos.data ? <Skeleton rows={6} />
            : (
              <>
                <p className="m-0 text-[12.5px] text-slate-400" aria-live="polite">
                  {t('Đang xem')}: <b className="font-semibold text-slate-200">{t('Đang SOS')} · {sos.data.toanBo ? t('Toàn bộ 8 tuần') : t('một tuần thi')}</b>
                  {' · '}<span className="tabular-nums">{t('{n} học viên', { n: demGoc.sos ?? 0 })}{sos.data.toanBo ? ` · ${t('{n} lượt SOS', { n: sosRows.length })}` : ''} · {t('{n} lớp', { n: new Set(sosRows.map((r) => r.classId)).size })}</span>
                </p>
                {sosRows.length === 0
                  ? <Card><Empty title={sos.data.toanBo ? t('Không có học viên SOS trong 8 tuần') : t('Không có học viên SOS ở tuần thi này')} hint={t('Chọn tuần khác hoặc Toàn bộ.')} /></Card>
                  : <><PhanTrang {...pt.thanh} /><BangSos data={{ ...sos.data, rows: pt.cat(sosRows) }} tatCa={sosRows} cot="ql" dam={dam} dienThoai={dienThoai} ds={dsHocVien}
                      onMo={(r) => setPanelEm({ id: r.studentId, caseMo: r.cases.find((c) => !c.done)?.id ?? null })} dangMo={panelEm?.id ?? null} /><PhanTrang {...pt.thanh} duoi /></>}
              </>
            )
      )}
      {goc === 'can-lam' && (
        work.error ? <ErrorState message={work.error.message} hint={work.error.hint} onRetry={work.reload} />
          : !work.data || !data ? <Skeleton rows={6} />
            : (
              <>
                <p className="m-0 flex flex-wrap items-center gap-x-2 text-[12.5px] text-slate-400" aria-live="polite">
                  <span>{t('Đang xem')}: <b className="font-semibold text-slate-200">{t('Cần làm')}{locPhu ? ` · ${nhanLocPhu[locPhu]}` : ''}</b></span>
                  <span className="tabular-nums">· {t('{n} học viên', { n: emCua(viecHien) })} · {t('{n} lớp', { n: new Set(viecHien.map((v) => v.classId)).size })}</span>
                  {locPhu && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={() => setParam({ loc: null })}>{t('Xoá lọc')}</button>}
                </p>
                {viecHien.length === 0
                  ? <Card><Empty title={locPhu ? t('Không có việc nào khớp lọc') : t('Không có việc nào')} /></Card>
                  : <><PhanTrang {...pt.thanh} /><BangCanLam viec={pt.cat(viecHien)} tatCa={viecHien} coNguoi={laQl || admin} coPhuHuynh={false} dienThoai={dienThoai} ds={dsHocVien} /><PhanTrang {...pt.thanh} duoi /></>}
              </>
            )
      )}
      {goc === 'lich-thi' && (
        <GocLichThi duongGoc={qs.slice(qs.indexOf('?'))} thangUrl={params.get('thang')} onDoiThang={(m) => setParam({ thang: m.join(','), open: null })} />
      )}
      {xuat && goc !== 'lich-thi' && (
        <NganXuatDs ids={idsXuat} daChon={goc === 'tat-ca' ? [...daChon] : undefined} phamDau={xuat} boLoc={boLocXuat} mauMacDinh={goc === 'sos' ? 'theo-doi-sos' : undefined}
          locSos={{ tuan: tuanUrl, phamVi: phamViUrl, branchId, q: q.trim() || null }} onDong={() => setXuat(null)} />
      )}
      {panelEm && (
        <PanelMotEm key={panelEm.id} studentId={panelEm.id} caseMo={panelEm.caseMo} onClose={() => setPanelEm(null)}
          onDoi={() => { trang.reload(); sos.reload(); work.reload(); }} />
      )}
      {viecMo && (
        <PanelViec it={viecMo} onDong={() => setViecMo(null)} onTiep={null}
          onDaLam={() => { invalidate('/my-work'); invalidate('/hoc-vien-lop'); work.reload(); trang.reload(); }} />
      )}
      {suaTT && (
        <SuaThongTinMotEm studentId={suaTT.id} studentName={suaTT.ten} lop={suaTT.lop} onClose={() => setSuaTT(null)}
          onDone={() => { setSuaTT(null); invalidate('/hoc-vien-lop'); trang.reload(); }} />
      )}
      {taoLop && (
        <ClassCreatePanel onClose={() => setTaoLop(false)}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); trang.reload(); }} />
      )}
      {them !== 'dong' && (
        <IntakePanel defaultClass={them} onClose={() => setThem('dong')}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/students'); trang.reload(); }} />
      )}
    </div>
  );
}

/** Cột chung của khối tiêu đề và mọi bảng lớp — một chỗ khai báo để cột luôn thẳng nhau. */
function CotBangLop({ admin, ft = false }: { admin: boolean; ft?: boolean }) {
  if (admin) return <colgroup><col className="w-[40%]" /><col className="w-[34%]" /><col className="w-[20%]" /><col className="w-12" /></colgroup>;
  /* OV-15b (C13): FT thêm 5 cột điểm hẹp (OVR · L · R · W · S). */
  if (ft) {
    return (
      <colgroup>
        <col className="w-[16%]" /><col className="w-[16%]" />{COT_DIEM_FT.map((c) => <col key={c} className="w-[4.5%]" />)}<col className="w-[7%]" /><col className="w-[9%]" />
        <col className="w-[12%]" /><col className="w-[4%]" /><col className="w-[13%]" /><col className="w-12" />
      </colgroup>
    );
  }
  return (
    <colgroup>
      <col className="w-[19%]" /><col className="w-[20%]" /><col className="w-[10%]" /><col className="w-[11%]" />
      <col className="w-[15%]" /><col className="w-[5%]" /><col className="w-[18%]" /><col className="w-12" />
    </colgroup>
  );
}

/**
 * HÀNG LỚN của một lớp (đặc tả §3.6; PR-UX0 N-2): ▸ · mã (mở Hồ sơ lớp) · chương trình · n HV · GVCN · tối đa 2 badge (+n) · ⋯.
 * ⋯ của lớp: Hồ sơ lớp · Nhập điểm (Q11, Q6) · + Học viên — chỉ mục người xem làm được.
 */
function HopLop({ lop, mo, onDoiMo, chiHien, sapXep, onThemHocVien, onDoi, dsHocVien, dsLop, onThuTu, the = false, admin, onMoCase, soViecQuaHan, chon }: {
  /** OV-15h2 (ý 1): ô tick trước tên em. */
  chon?: ChonNhieu;
  onMoCase?: (studentId: number, caseId: number) => void;
  /** OV-13b: `demQuaHan` trên việc của Cần làm — badge "n việc quá hạn" = số dòng khi bấm. */
  soViecQuaHan: number;
  /** OV-10b: bảng cột Admin (`BangHocVienLop admin`). */
  admin: boolean;
  lop: LopTrenTrang; mo: boolean; onDoiMo: () => void; chiHien: Set<number> | null; sapXep: SapXep;
  /** PR-DH: danh sách đi cùng link sang hồ sơ em / hồ sơ lớp (Trước/Sau). */
  dsHocVien: NguCanhDs; dsLop: NguCanhDs; onThuTu: (classId: number, ids: number[]) => void;
  onThemHocVien: () => void; onDoi: () => void;
  /** Điện thoại: thẻ gập thay cho `<tbody>` (cùng nội dung: mã · chương trình · n HV · GVCN · badge · ⋯). */
  the?: boolean;
}) {
  const navigate = useNavigate();
  const { session } = useSession();
  const thuong = lop.scoringMode === 'ratio';
  const [nhapDiem, setNhapDiem] = useState(false);
  /* Panel vẽ qua portal — đặt ở đâu trong hàng cũng được; danh sách và vị trí cuộn giữ nguyên. */
  const panelNhap = nhapDiem && <PanelNhapDiemLop classId={lop.id} classCode={lop.code} onDong={() => setNhapDiem(false)} />;
  /** Dòng phụ hàng lớp: `Fast Track · LT1 · 18 HV` — lớp thường không có lộ trình nên bỏ khúc giữa (mockup 21 mục 5). */
  const chuLop = [lop.programmeName ? dich(lop.programmeName) : '—', !thuong && lop.route ? lop.route : null, t('{n} HV', { n: lop.studentCount })].filter(Boolean).join(' · ');
  const bGoc = badgeLop({
    vai: laVaiQuanLy(session?.roles) ? 'ql' : 'gv', needsPlacement: lop.needsPlacement, canXepLop: lop.canXepLop, missingSkills: lop.missingSkills,
    soBaiChoCham: lop.needScores,
    needScoresTitle: lop.needScores > 0 ? needScoresText(lop.workScope, lop.needScores) : null,
    phase: lop.phase, soChoDuyet: lop.soChoDuyet, soViecQuaHan,
    missingCount: lop.missing.filter((m) => m.key !== 'teachers').length, soChuaLoTrinhTiep: lop.soChuaLoTrinhTiep,
    chuongTrinh: lop.programmeCode,
  });
  /* HL-8: Admin không có badge việc của QL / GV — cùng hàm với đầu hồ sơ lớp. */
  const bCon = [...bGoc.hien, ...bGoc.an].filter((x) => badgeHienTheoVai(admin ? 'admin' : null, x.key));
  const b = { hien: bCon.slice(0, 2), an: bCon.slice(2) };
  const denBadge = (x: BadgeLop): string | null =>
    /* PR-UX1: badge "n bài chờ chấm" mở Lịch Test lọc đúng lớp (Lịch Test tự mở "Lớp tôi dạy" cho GV). */
    x.key === 'cham' && session?.nav?.test ? duongLichTest({ classId: lop.id })
      : x.key === 'xep-lop' ? (lop.viewer.coTheChuyenTiep ? `/hoc-vien/lop/${lop.id}?viec=chuyen-tiep` : `/hoc-vien/lop/${lop.id}`)
      : x.key === 'cho-duyet' && session?.nav?.workApprove ? `/cong-viec/cho-duyet?lop=${lop.id}`
      : x.key === 'qua-han' ? `/hoc-vien?view=qua-han&classId=${lop.id}`
      : null;
  const mucLop: MucMenu[] = [
    { key: 'ho-so', nhan: t('Hồ sơ lớp'), onChon: () => navigate(`/hoc-vien/lop/${lop.id}`, { state: { ds: dsLop } }) },
    ...(lop.viewer.coTheNhapDiem
      ? [{ key: 'nhap-diem', nhan: t('Nhập điểm'), onChon: () => setNhapDiem(true) }]   // OV-15b (C16): panel nhập điểm tại chỗ, như nút đầu hồ sơ lớp
      : []),
    ...(lop.viewer.coTheThemHocVien ? [{ key: 'them', nhan: t('+ Học viên'), onChon: onThemHocVien }] : []),
  ];

  const menuBadgeAn = b.an.length > 0 && (
    /* B4: "+n" bấm được — mỗi mục là một badge còn ẩn, bấm đi đúng đích (không có đích riêng thì mở Hồ sơ lớp, nơi số đó hiện). */
    <MenuDong kieu="chip" bieuTuong={`+${b.an.length}`} nhan={t('{n} việc khác của lớp {lop}', { n: b.an.length, lop: lop.code })}
      muc={b.an.map((x) => ({ key: x.key, nhan: x.nhan, onChon: () => navigate(denBadge(x) ?? `/hoc-vien/lop/${lop.id}`) }))} />
  );
  const cacBadge = b.hien.map((x) => {
    const den = denBadge(x);
    return den
      ? <Nhan key={x.key} tone={toneBadgeLop(x)} title={x.title} onClick={() => navigate(den)}>{x.nhan}</Nhan>
      : <Nhan key={x.key} tone={toneBadgeLop(x)} title={x.title}>{x.nhan}</Nhan>;
  });

  if (the) {
    return (
      <div className="card overflow-hidden" aria-label={t('Lớp {lop}', { lop: lop.code })}>
        {panelNhap}
        <div className="flex items-start gap-2 p-3">
          <button type="button" aria-expanded={mo} onClick={onDoiMo}
            className="flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-start gap-2 border-0 bg-transparent p-0 text-left">
            <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`mt-[7px] shrink-0 text-slate-400 transition-transform ${mo ? 'rotate-90' : ''}`}>
              <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="min-w-0">
              <span className="block font-extrabold text-slate-100">{lop.code}</span>
              <span className="block text-xs text-slate-400">
                {chuLop}{lop.gvcn && <> · {t('GVCN')} {lop.gvcn.name}</>}
              </span>
            </span>
          </button>
          <MenuDong muc={mucLop} nhan={t('Thao tác khác')} />
        </div>
        {(cacBadge.length > 0 || menuBadgeAn) && <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2">{cacBadge}{menuBadgeAn}</div>}
        {mo && <BangHocVienLop the admin={admin} lop={lop} chiHien={chiHien} sapXep={sapXep} onDoi={onDoi} soCot={1} ds={dsHocVien} onThuTu={onThuTu} onMoCase={onMoCase} chon={chon} />}
      </div>
    );
  }

  return (
    <tbody>
      <HangNhom mo={mo} onMo={onDoiMo} nhan={t('lớp {lop}', { lop: lop.code })} soCotDau={admin ? 1 : 3} className={mo ? 'hang-lon-dinh' : ''}
        tieuDe={
          <span className="flex min-w-0 items-baseline gap-2">
            <Link to={`/hoc-vien/lop/${lop.id}`} state={{ ds: dsLop }} className="shrink-0 font-extrabold text-slate-100 underline decoration-dotted underline-offset-4">
              {lop.code}
            </Link>
            <span className="min-w-0 truncate text-xs font-normal text-slate-400"
              title={`${chuLop}${lop.gvcn ? ` · ${t('GVCN')} ${lop.gvcn.name}` : ''}`}>
              {chuLop}
              {lop.gvcn && <> · <abbr title={t('Giáo viên chủ nhiệm')} className="no-underline">{t('GVCN')}</abbr> <TenGiaoVien id={lop.gvcn.id} ten={lop.gvcn.name} /></>}
            </span>
          </span>
        }>
        <td className="px-3" colSpan={admin ? 2 : thuong ? 4 : 4 + COT_DIEM_FT.length}>
          <span className="flex items-center justify-end gap-1.5">{cacBadge}{menuBadgeAn}</span>
        </td>
        <td className="px-2 text-center"><MenuDong muc={mucLop} nhan={t('Thao tác khác')} />{panelNhap}</td>
      </HangNhom>
      {mo && <BangHocVienLop admin={admin} lop={lop} chiHien={chiHien} sapXep={sapXep} onDoi={onDoi} soCot={admin ? 4 : thuong ? 8 : 8 + COT_DIEM_FT.length} ds={dsHocVien} onThuTu={onThuTu} onMoCase={onMoCase} chon={chon} />}
    </tbody>
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
