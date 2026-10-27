import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cuonOnDinh } from '../../lib/cuonOnDinh.ts';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useChongVe, useVe } from '../../lib/quayLai.ts';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, ErrorState, ExamPlanText, Info as Tag, SectionNote, Skeleton, Status, TargetText } from '../../ui/ui.tsx';
import { Nhan, NhanKq } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import type { ExamPlan } from '../../../../shared/domain/index.ts';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { DauKetQua, lopKq } from '../../ui/BieuTuong.tsx';
import { Menu, type MenuItem } from '../../ui/Menu.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { HopThaoTacMt } from './HopThaoTacMt.tsx';
import { HopKyNang } from '../test/keHoach/HopKyNang.tsx';
import { DongThoiGianLuot, dongLuot, type DongLuot, type LichSuCase } from './DongThoiGianLuot.tsx';
import {
  DeadlinePill, KHOA_HOAN_TAT_HINT, coDiemChinhThuc, lockedByNoShow, useSaveScore, type Cell, type SaveOpts, type SavePatch,
} from './ScoreEntry.tsx';
import { KY_NANG_LON, useODiem, type KyNangLon, type LichKn } from './ODiemLon.tsx';
import { nguCanhChiTiet, type KetThucHop } from './HopNhapDiem.tsx';
import { NhomTaiCho, NhomTinh, ONhanXet } from './NhanXet.tsx';
import { CaseLuotKn } from './CaseLuotKn.tsx';
import { NutGvCham, gvChamPayload, gvChamThanhChon } from '../cham/GvCham.tsx';
import { NhanSEx } from '../cham/LuoiFT.tsx';
import {
  attemptHref, attemptStatusLabel, fmtBand, fmtDate, progressLabel, skillLabel,
} from '../../lib/format.ts';
import {
  ATTEMPT_KIND_SHORT, canNhomNguyenNhan, CHU_THAO_TAC, CHU_THEM_PA, chipSosMt0, docTuanLich, mondayOfDate, nhanLuot, skillShort, soKyVong, thaoTacKyNang, trangThaiTT, tuanLich,
  type AssessedSkill, type AttemptKind, type TheYeuCauDto, type ThaoTac, type LoiTruong,
  docKnMock, docNguCanhDs, duongDotTest, keBen, vaiXemHocVien, KY_NANG_KE_HOACH, type KyNangKH, khongDuThiTuO, oKyNangTuLich, type KetQuaHuy, trangCha,
} from '@shared/domain/index.ts';
import { DuongVe } from '../../ui/ThanhTruocSau.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { TOOLTIP_TUAN_HOAN_TAT } from '../../ui/chu.ts';
import { HopKhoiPhucKetQua, HopKhoiPhucMt } from '../test/keHoach/HopKhoiPhucKetQua.tsx';
import type { KnO } from '../test/keHoach/kieu.ts';
import { TenCase, type CaseCard, type SkillBoardRow } from '../cases/SkillBoard.tsx';
import type { CaseCua } from '../classes/BangCanHoTro.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { NhanGt } from '../classes/DauTrangLop.tsx';
import { useSession } from '../../lib/session.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { LichSuThayDoi } from '../../ui/LichSuThayDoi.tsx';
import { ChuDich } from '../../ui/ChuDich.tsx';

type Detail = {
  id: number;
  /** `mock` với Fast Track; `progress` / `final` là bài của lớp thường — màn khác hẳn. */
  kind: string;
  student: { id: number; name: string; code: string };
  cycle: { id: number; seq: number; route: string | null; target: number | null; khongCamKet?: boolean; examPlan: ExamPlan };
  classId: number | null; classCode: string | null; branchName: string | null;
  /** OV-13k: người xem ghi được "Nhận xét GV phụ trách" + sửa nhóm ô S chấm chéo (GV phụ trách S, GVCN, QL). */
  phuTrachS?: boolean;
  attemptNo: number; targetAtAttempt: number | null; studyWeekHint: number | null;
  period: { id: number; code: string; weekStart: string; weekEnd: string; range: string } | null;
  /** Tuần kế hoạch hoàn tất đã đủ căn cứ chưa, và môn nào đang chặn. */
  completionWeek: { valid: boolean; blocking: string[]; blockingLabels: string[] };
  /** Lịch, phạm vi, trạng thái thi và hạn chấm của TỪNG kỹ năng. */
  skillSchedule: SkillRow[];
  splitWeeks: boolean;
  scoringMode: 'band' | 'ratio';
  deadlineOverride: { date: string; reason: string | null; at: string | null; by: string | null } | null;
  status: string; cancelReason: string | null; note: string | null;
  /** PR-HSM (K4 §4h): lượt đã huỷ — lý do, ai, khi. */
  huy: { lyDo: string | null; ai: string | null; khi: string } | null;
  /** PR-OV4a: bản huỷ MT còn khôi phục được + câu chặn khi số MT đã được xếp lại. */
  khoiPhuc: { ban: unknown[]; chan: string | null };
  result: any; cells: Cell[]; skips: any[];
  /** PR-MT0: MT0 — chip SOS chỉ để nhìn (band ≤ Target − 2.0); không kỳ vọng, không Case. */
  mt0?: { sos: { skill: AssessedSkill; band: number }[] } | null;
  /** Lịch và phạm vi. */
  history: { id: number; action: string; field: string | null; oldValue: string | null; newValue: string | null; reason: string | null; actorName: string | null; createdAt: string }[];
  /** Điểm: ai sửa, trước → sau (PR-I). */
  scoreHistory: ScoreHistoryRow[];
  /** PR-MT (T34): MT lịch sử — nhập bù, không tính hạn, không luồng vắng. */
  lichSu: boolean;
  /** T2 (PR-MTa): kết quả đã huỷ do dời vượt, còn khôi phục được. */
  ketQuaHuy?: KetQuaHuy | null;
  /** OV-12d: Case sinh từ lượt + Case trượt lại ở lượt — null = không có khối (GV chấm chéo, Admin). */
  caseLuot: CaseCua[] | null;
  /** HSL-MAY-CHU: lớp đang học khi em đã rời lớp của lượt (`classCode` = lớp lúc Test); null = còn ở lớp đó. */
  lopHienTai?: { id: number; code: string } | null;
  /** HSL-MAY-CHU (N10): lượt S Ex của em trong các tuần của lượt — chỉ đọc, ngoài Overall / SOS. */
  sEx?: { id: number; tuan: string; diem: number | null; nguoiCham: string | null }[];
  /** HSL-FT: Case mở · PA thêm của các Case trên — Lịch sử kỹ năng / Lịch sử lượt. */
  lichSuCase?: LichSuCase[];
  viewer: {
    canPlanWeek: boolean; canCancel: boolean; canHandleAbsence: boolean;
    /** PR-XLMT: GVCN của lớp — Báo vắng / Xếp lại bài vắng (`thaoTacKyNang`). */
    laGvcn: boolean;
    canSkipSkill: boolean; canOverrideDeadline: boolean;
    /** Kỹ năng dời lịch/xác nhận thi được — GVCN·GVBM Normal + Quản lý mọi kỹ năng (SCH-01). */
    moveableSkills: string[];
    canEditSos: boolean; editableSkills: string[];
  };
};

type ScoreHistoryRow = {
  id: number; kind: 'edit' | 'override' | 'no_show' | 'nhan_xet'; skill: string; skillLabel: string;
  before: string; after: string; actorName: string | null; createdAt: string;
  /** RB-5 — lý do sửa điểm đã nhập (lần nhập đầu không có). */
  lyDo: string | null;
};

type SkillRow = {
  skill: string; label: string;
  required: boolean; scopeReason: string | null;
  periodId: number | null; periodCode: string | null;
  weekStart: string | null; weekRange: string | null;
  planSource: string;
  sitStatus: string; sitNote: string | null;
  deadline: string | null; deadlineSource: string;
  overdue: boolean; scored: boolean; progress: string;
  absenceMoveCount: number;
  /** Đề nghị dời do vắng đang chờ Quản lý trả lời (mục 10.6), nếu có. */
  pendingMove: { id: number; decideBy: string; toWeek: string | null; moveNo: number } | null;
  /** PR-HSM (K4-30): tuần cũ của lần dời do vắng mới nhất ("W3 SEP"), `null` khi chưa dời. */
  doiTu: string | null;
  /** Hết tuần thi (Chủ nhật) · huỷ vì vắng 2 lần (T3) — ô MT đầu trang cần. */
  weekEnd: string | null; huyVang?: boolean;
};

/** Một đợt của học viên trong `GET /attempts?studentId=` — đủ để dựng nhãn và đường dẫn của bộ chọn đợt (R15). */
type DotCuaHv = {
  id: number; kind: string; classId: number | null; attemptNo: number; status: string;
  period: { id: number; weekStart: string } | null;
};

/**
 * Lưới một dòng kỹ năng của bảng kết quả (khung M4-A): Kỹ năng · Lịch · Điểm · Trạng thái · Nhận xét · Case · thao tác. Dưới `md` mỗi kỹ năng là
 * một thẻ: tên + điểm, rồi lịch · trạng thái, nhận xét · Case, nút (các nhóm `md:contents` thành ô lưới ở màn rộng).
 */
const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 md:grid-cols-[9rem_8.5rem_7.5rem_minmax(11rem,1.2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_12rem] md:items-center';

export default function MockDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload: taiLai } = useApi<Detail>(id ? `/attempts/${id}` : null);
  /* HSL-FT: khối Case / PA trong vùng mở = thẻ của bảng kỹ năng hồ sơ HV (cùng nguồn, cùng lộ trình của lượt) — chỉ gọi khi lượt có Case. */
  const bang = useApi<{ rows: SkillBoardRow[] }>(data?.caseLuot?.length ? `/students/${data.student.id}/skill-board?cycleId=${data.cycle.id}` : null);
  /* Sau mọi thao tác: trang lượt + bảng Case cùng tải lại — Còn lại, cột Case, hai lịch sử đổi cùng lúc. */
  const reload = () => { taiLai(); if (bang.data) bang.reload(); };
  const { save } = useSaveScore(Number(id), reload, data?.student.name);
  /* R1-LUU-TIEP: mở từ lưới (tên em) — danh sách lượt nguồn ở `location.state.ds` → "Lưu · em tiếp ›"; không có → "‹ Về {nguồn}". */
  const location = useLocation();
  const dsLuot = docNguCanhDs((location.state as { ds?: unknown } | null)?.ds, 'luot', Number(id));
  const emSau = dsLuot ? keBen(dsLuot.ids, Number(id))?.sau ?? null : null;
  const chongVe = useChongVe();
  const veNguon = useVe();
  const { homNay } = useNgayNghiepVu();
  const chiDoc = !!vaiXemHocVien(useSession().session?.roles);
  /* R15 — các đợt của CHÍNH học viên này, để chuyển đợt ngay trên trang (không phải quay lại hồ sơ). */
  const dsDot = useApi<{ rows: DotCuaHv[] }>(data ? `/attempts?studentId=${data.student.id}` : null);
  /* PR-HOP1: dời lịch (cả đợt hoặc một kỹ năng) = hộp một đợt `HopKyNang` như Kế hoạch Test — một đường lưu `/ke-hoach-test/dot`. */
  const [hopLich, setHopLich] = useState<{ anchor: HTMLElement; k: KyNangKH | null } | null>(null);
  const nutChinhLich = useRef<HTMLSpanElement>(null);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [khoiPhucOpen, setKhoiPhucOpen] = useState(false);
  const [khoiPhucLuot, setKhoiPhucLuot] = useState(false);
  /* PR-HSM: bài nhập đang mở hộp nhập điểm (ô điểm của dòng, nút chính "Nhập điểm / Sửa điểm" mở đúng bài). */
  const [moO, setMoO] = useState<string | null>(null);
  /* HSL-FT: dòng kỹ năng đang mở vùng (một dòng một lúc) · Case đang mở form Thêm PA · Ngăn Case tại chỗ. */
  const [moKn, setMoKn] = useState<KyNangLon | null>(null);
  const [formPa, setFormPa] = useState<number | null>(null);
  const [ngan, setNgan] = useState<{ caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa' } | null>(null);
  /*
   * G5 / E.4 (PR-VAI-b): `?kn=` — "MT2 · Speaking" ở hồ sơ HV mở sẵn dòng Speaking + cuộn tới đó, một lần khi dữ liệu có (khung M4-A).
   * Đợt không có ô kỹ năng đó → không cuộn, không lỗi.
   */
  const [thamSo] = useSearchParams();
  const knUrl = docKnMock(thamSo.get('kn'));
  useEffect(() => {
    if (!data || !knUrl) return undefined;
    if (!data.cells.some((c) => c.assessedSkill === knUrl)) return undefined;
    setMoKn(knUrl as KyNangLon);
    return cuonOnDinh(() => document.getElementById(`kn-${knUrl}`), null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data, knUrl]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  /*
   * CHẶN CỬA: bài của lớp thường KHÔNG được dựng bằng màn này.
   *
   * Màn Mock Test gọi mọi lượt là "MT{n}", chấm theo band và so với kỳ vọng target — cả ba
   * thứ đó đều sai với một bài Progress Test. Mọi đường dẫn trong hệ thống đã trỏ đúng màn,
   * nhưng đường dẫn cũ, thông báo cũ và link người dùng lưu lại thì vẫn còn, nên chặn ngay
   * ở đây thay vì tin rằng không ai vào được.
   */
  if (data.kind && data.kind !== 'mock' && data.kind !== 'mt0') {   // PR-MT0: MT0 chấm band, dùng màn này
    /* R1-SUA-NHO: có `studentId` nên lượt mất lớp về hồ sơ HV, không chuyển về chính trang này (vòng). */
    return <Navigate to={attemptHref({ id: data.id, kind: data.kind, classId: data.classId, studentId: data.student.id })} replace />;
  }

  const d = data;
  const cancelled = d.status === 'cancelled';
  /* OV-11e (TE-12): lượt chưa tới tuần (chưa kỹ năng nào tới tuần thi) thì không có "Nhập điểm" — lưới tuần đó chưa mở. */
  const daToiTuan = [d.period?.weekStart, ...d.skillSchedule.map((r) => r.weekStart)].some((w) => !!w && w.slice(0, 10) <= mondayOfDate(homNay));
  /** PR-MT0: kết luận MT0 đủ điểm — chip SOS hiển thị, hoặc `MT0 ✓` (cùng chữ Chuyển tiếp lớp, lưới Nhập điểm). */
  const ketQuaMt0 = d.mt0 && d.result.complete
    ? (d.mt0.sos.length ? <>{d.mt0.sos.map((x) => <Nhan key={x.skill} tone="bad">{chipSosMt0(x)}</Nhan>)}</> : <Nhan tone="ok">MT0 ✓</Nhan>)
    : null;
  /* Đủ điểm và có kỳ vọng thì mới kết luận đạt; còn lại là "chưa biết" — không phải "đạt". */
  const passed: boolean | null = d.result.evaluable ? d.result.sosLevel === 0 : null;

  /* OV-13k: "Nhận xét GV phụ trách" / nhóm ô S — đường riêng, không đụng điểm hay nhận xét người chấm. */
  const luuPhuTrach = async (body: { nhanXetPhuTrach?: string | null; nhomNguyenNhan?: string[] }): Promise<boolean> => {
    try {
      await api.put(`/attempts/${d.id}/scores/speaking/phu-trach`, body);
      invalidate('/my-work'); invalidate('/cases'); invalidate('/students');
      reload();
      return true;
    } catch (e: any) {
      /* Câu lỗi của máy chủ (như `useSaveScore`); ô giữ chữ đang gõ + "Chưa lưu — thử lại". */
      toast.push('error', `${t('Nhận xét GV phụ trách')}: ${e?.message ?? t('Không lưu được')}`);
      return false;
    }
  };

  /*
   * NGOẠI LỆ CỦA QUẢN LÝ nằm trong MỘT menu, không phải ba nút ngang hàng với việc nhập điểm. "Huỷ lượt" không còn
   * là nút đỏ ở đầu trang: nó nói rõ huỷ phần nào và phần đã có điểm thì giữ.
   */
  /* PR-MTGON: mọi kỹ năng FT đã huỷ / bỏ khỏi đợt → "Dời lịch thi cả đợt" không còn gì để dời; hiện "Đưa lại cả 4 kỹ năng". */
  const kn4 = d.skillSchedule.filter((r) => (KY_NANG_KE_HOACH as readonly string[]).includes(r.skill));
  const huyHet = kn4.length > 0 && kn4.every((r) => !r.required || r.sitStatus === 'cancelled');
  const duaLaiCaLuot = async () => {
    try {
      await api.post(`/attempts/${d.id}/dua-lai-ca-luot`);
      for (const k of ['/attempts', '/tong-quan', '/ke-hoach-test', '/cycles']) invalidate(k);
      reload(); toast.push('ok', t('Đã đưa lại các kỹ năng vào MT{attemptNo}', { attemptNo: d.attemptNo }));
    } catch (e: any) { toast.push('error', e.message); }
  };
  const headerItems: MenuItem[] = [
    ...(d.viewer.canSkipSkill && !cancelled && huyHet ? [{
      label: t('Đưa lại cả 4 kỹ năng'), onClick: () => void duaLaiCaLuot(),
      hint: t('Tuần cũ còn hợp lệ thì giữ, không thì về Chưa xếp lịch'),
    }] : []),
    ...(d.viewer.canPlanWeek && !cancelled && !huyHet ? [{
      label: t('{x} cả đợt', { x: CHU_THAO_TAC['doi-lich'] }), onClick: () => { if (nutChinhLich.current) setHopLich({ anchor: nutChinhLich.current, k: null }); },
      hint: t('Mọi kỹ năng còn dời được sang một tuần'),
    }] : []),
    ...(d.viewer.canOverrideDeadline && !cancelled && !d.lichSu ? [{
      label: t('{x} cả đợt', { x: CHU_THAO_TAC['doi-han'] }), onClick: () => setDeadlineOpen(true),
      hint: t('Một hạn chấm riêng cho mọi kỹ năng'),
    }] : []),
    /* PR-MTb T8 (T2): lượt bị vượt có kết quả đã huỷ → Quản lý khôi phục. */
    ...(d.viewer.canCancel && !cancelled && d.ketQuaHuy ? [{
      label: t('Khôi phục kết quả'), onClick: () => setKhoiPhucOpen(true),
    }] : []),
    /* PR-OV4a: số MT đã xếp lại mà còn bản huỷ cũ → hộp nói rõ cách khôi phục (huỷ MT mới trước). */
    ...(d.viewer.canCancel && !cancelled && d.khoiPhuc.ban.length ? [{
      label: t('Khôi phục MT{attemptNo} cũ', { attemptNo: d.attemptNo }), onClick: () => setKhoiPhucLuot(true),
    }] : []),
  ];
  const coKhoa = d.cells.some((c) => c.khoa);
  const laRf = d.cycle.route === 'RF';
  /* HSL-FT: Case của lượt trong bảng kỹ năng hồ sơ HV (thẻ đủ: PA, việc tiếp, quyền) — Case không có thẻ thì vùng mở chỉ có nút mở Ngăn Case. */
  const theCase = new Map((bang.data?.rows ?? []).flatMap((r) => r.cases).filter((c) => d.caseLuot?.some((x) => x.id === c.id)).map((c) => [c.id, c]));
  /** Mở dòng kỹ năng + cuộn tới + focus đúng chỗ của việc (Còn lại). */
  const moDong = (k: KyNangLon, chon?: string) => {
    setMoKn(k);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(`kn-${k}`);
      el?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      if (chon) document.querySelector<HTMLElement>(`#kn-${k} ${chon}, #vung-${k} ${chon}`)?.focus({ preventScroll: true });
    }));
  };
  const conLai = cancelled ? [] : conLaiLuot(d, homNay, theCase, chiDoc, {
    moDong,
    themPa: (k, caseId) => { setFormPa(caseId); moDong(k); },
    moCase: (caseId, viec, paId) => setNgan({ caseId, viec, paId }),
  });
  const veMt = (() => { const v = chongVe[0] ?? trangCha('mt', { studentId: d.student.id, tenHv: d.student.name }); return { nhan: t('‹ Về {x}', { x: v.ten }), onClick: () => veNguon(v.url, !chongVe.length) }; })();
  const lichSuLuot = dongLuot({ history: d.history, scoreHistory: d.scoreHistory, lichSuCase: d.lichSuCase ?? [], homNay });

  return (
    <div className="page space-y-4">
      {/* K4 §4h: lượt đã huỷ — dải mảnh trên cùng nói lý do · ai · ngày, và cách mở lại. Mọi ô lớn khoá (máy chủ `canEdit`). */}
      {cancelled && (
        <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--line-strong)' }}>
          <span className="font-semibold text-slate-100">{t('Đã huỷ')}</span>
          <span className="min-w-0 break-words text-slate-400">
            {[d.huy?.lyDo ?? d.cancelReason, d.huy?.ai, d.huy ? fmtDate(d.huy.khi) : null].filter(Boolean).join(' · ')}
          </span>
          {d.viewer.canCancel ? (
            <button type="button" className="btn btn-sm min-h-[44px] sm:ml-auto sm:min-h-0" onClick={() => setKhoiPhucLuot(true)}>{t('Khôi phục MT{attemptNo}', { attemptNo: d.attemptNo })}</button>
          ) : <span className="text-xs text-slate-500 sm:ml-auto">{t('Chỉ Quản lý khôi phục được lượt đã huỷ.')}</span>}
        </div>
      )}

      {/* ① ĐẦU HỒ SƠ — ai (↗ hồ sơ HV) · lượt nào · lớp lúc Test · lịch · Target · kỳ vọng; việc làm (Nhập điểm lớp ›, Chỉnh lịch) bên phải. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <DuongVe cha={trangCha('mt', { studentId: d.student.id, tenHv: d.student.name })} ten={`MT${d.attemptNo} · ${d.student.name}`} chiTiet={d.classCode} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="m-0 min-w-0 break-words text-xl font-bold text-slate-100">
              <span className="sr-only">{t('Hồ sơ Mock Test ·')} </span>
              <Link to={`/hoc-vien/${d.student.id}`} className="text-inherit no-underline hover:underline" title={t('Hồ sơ học viên')}>
                {d.student.name}<span aria-hidden className="ml-1 text-base text-slate-400">↗</span>
              </Link>
            </h1>
            <span className="inline-flex items-center gap-2">
              <ChonDot hienTai={d.id} ds={dsDot.data?.rows ?? []} homNay={homNay} onChon={(r) => navigate(attemptHref({ ...r, studentId: d.student.id }), { replace: true })} />
              <NutLuat label={t('Thông tin đợt Mock Test')}>
                <dl className="m-0 grid gap-2">
                  <Info label={t('Trạng thái')}>{nhanLuot(d.status, d.result.scoredRequired, d.result.required.length)}</Info>
                  <Info label={t('Tuần dự kiến hoàn tất')} title={TOOLTIP_TUAN_HOAN_TAT}>
                    {d.period ? <>{tuanLich(d.period.weekStart, homNay)} <span className="text-xs text-slate-500">({d.period.range})</span></> : t('Chưa chốt tuần')}
                  </Info>
                  <Info label={t('Dự kiến thi')}><ExamPlanText plan={d.cycle.examPlan} /></Info>
                  {d.cycle.route && <Info label={t('Lộ trình')}>{d.cycle.route}{laRf ? ` · ${t('Lộ trình RF — kỳ vọng mọi MT bằng Target.')}` : ''}</Info>}
                  {d.branchName && <Info label={t('Chi nhánh')}>{d.branchName}</Info>}
                  {d.studyWeekHint && <Info label={t('Mốc gợi ý')}>{t('Tuần học {studyWeekHint}', { studyWeekHint: d.studyWeekHint })}</Info>}
                </dl>
              </NutLuat>
            </span>
            {coKhoa && !cancelled && <Tag title={KHOA_HOAN_TAT_HINT}>{t('Đủ điểm')}</Tag>}
            {d.lichSu && <Tag>{t('Nhập bù, không tính hạn')}</Tag>}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5">
            <NhanGt n={t('Lớp lúc Test')} g={<>{d.classCode ?? '—'}{d.lopHienTai && <span className="ml-1 text-xs font-medium text-slate-400">· {t('nay {x}', { x: d.lopHienTai.code })}</span>}</>} />
            <NhanGt n={t('Lịch')} g={<span className="tabular-nums">{d.period ? tuanLich(d.period.weekStart, homNay) : t('Chưa chốt tuần')}</span>} />
            {!d.mt0 && <NhanGt n="Target" g={<TargetText band={d.targetAtAttempt} kck={d.cycle.khongCamKet} />} />}
            {!d.mt0 && <NhanGt n={t('Kỳ vọng MT{attemptNo}', { attemptNo: d.attemptNo })} g={<span className="tabular-nums">{fmtBand(d.result.expectation)}{laRf && d.result.expectation !== null ? ' = Target' : ''}</span>} />}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {d.classId && d.viewer.editableSkills.length > 0 && daToiTuan && (
            /* R16 — mở lưới cả lớp đúng TUẦN của đợt đang xem, không phải tuần hôm nay. */
            <Link className="btn min-h-[44px] no-underline sm:min-h-0"
              to={d.mt0 ? `/nhap-diem/${d.classId}?kind=mt0${d.period ? `&periodId=${d.period.id}` : ''}`
                : `/nhap-diem/${d.classId}${d.period ? `?periodId=${d.period.id}` : ''}`}>
              {t('Nhập điểm lớp ›')}
            </Link>
          )}
          {headerItems.length > 0 && <span ref={nutChinhLich} className="inline-flex"><Menu label={t('Chỉnh lịch')} items={headerItems} className="btn min-h-[44px] sm:min-h-0" /></span>}
        </div>
      </div>

      {/* ③ TÓM TẮT — Overall · kết quả + n/4 kỹ năng có điểm · Còn lại (việc của lượt, ai làm). */}
      <section aria-label={t('Tóm tắt lượt')} className="card flex flex-wrap items-start gap-x-8 gap-y-3 px-4 py-3">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">Overall
            {/* Luật V6: câu giải thích phạm vi / Target vào ⓘ, không nằm trên màn chính. */}
            {(d.result.scopeDetail || (d.result.complete && !d.result.evaluable)) && (
              <NutLuat label="Overall">
                {d.result.scopeDetail && <p className="m-0">{t('{scopeDetail}. Kỹ năng ngoài phạm vi không tính vào mẫu số SOS và không bị coi là thiếu điểm; vì không đủ bốn kỹ năng nên đợt này không có Overall.', { scopeDetail: d.result.scopeDetail })}</p>}
                {d.result.complete && !d.result.evaluable && <p className="m-0">{t('Đã đủ điểm nhưng lộ trình chưa có Target, nên chưa tính được kỳ vọng và SOS.')}</p>}
              </NutLuat>
            )}
          </span>
          <span className="mt-1 block">
            {d.result.overall !== null ? <ODiemOverall band={d.result.overall} kyVong={d.result.expectation} />
              : d.result.khongDuBoMon ? <NhanKq kq="thieu" title={t('Em không học đủ bốn kỹ năng ở lượt này')}>{t('Không đủ bộ môn')}</NhanKq>
              : <span className="text-xl font-bold leading-none text-slate-600">—</span>}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1 sm:pt-4">
          <span className="flex flex-wrap items-center gap-1.5">
            {/* Rà #119: `sosLevel` (chặn trần 3) — `failedCount` 4 môn từng ra "SOS 4". PR-MT0: MT0 không có kỳ vọng — `MT0 ✓` / chip SOS. */}
            {cancelled ? <NhanKq kq="thieu">{t('Đã huỷ')}</NhanKq> : ketQuaMt0 ?? (d.mt0 ? d.mt0.sos.map((x) => <Nhan key={x.skill} tone="bad">{chipSosMt0(x)}</Nhan>)
              : <KetQuaDot coDiem={d.result.scoredRequired} yeuCau={d.result.required.length} dat={passed}
                sos={d.result.sosLevel ?? null} chot={d.result.chot} kckDuoi={d.result.kckDuoi} />)}
            {d.deadlineOverride && (
              <Tag title={d.deadlineOverride.reason ?? undefined}>
                {t('Hạn chấm cả đợt')}{' '}{fmtDate(d.deadlineOverride.date)}{d.deadlineOverride.by ? ` · ${d.deadlineOverride.by}` : ''}
              </Tag>
            )}
          </span>
        </div>
        <ConLaiLuot ds={conLai} />
      </section>

      {/* ④ BẢNG KỸ NĂNG — một dòng một kỹ năng; bấm dòng mở vùng Nhận xét | Case & phương án + Lịch sử kỹ năng ngay dưới. */}
      <BangKetQuaLuot d={d} homNay={homNay} chiDoc={chiDoc} moKn={moKn} onMoKn={(k) => setMoKn((x) => (x === k ? null : k))}
        moO={moO} onMoO={setMoO} save={save} onDone={reload} onDoiLich={(anchor, k) => setHopLich({ anchor, k })}
        emTiep={emSau !== null ? (k) => navigate(duongDotTest({ id: emSau }, k), { state: { ds: dsLuot }, replace: true }) : null} ve={veMt}
        vungCase={(k) => {
          const cs = (d.caseLuot ?? []).filter((c) => kyNangCase(c.topic) === k);
          const the = cs.map((c) => theCase.get(c.id)).filter((x): x is CaseCard => !!x);
          return (
            <>
              <CaseLuotKn cards={the} studentId={d.student.id} chiDoc={chiDoc || cancelled} form={formPa} onForm={setFormPa}
                onMoCase={(caseId, o) => setNgan({ caseId, paId: o?.paId, viec: o?.viec === 'them-pa' ? undefined : o?.viec })} onDoi={reload} />
              {/* Case chưa có thẻ ở bảng kỹ năng (bảng đang tải / lộ trình khác): vẫn mở được Ngăn Case. */}
              {cs.filter((c) => !theCase.has(c.id)).map((c) => (
                <button key={c.id} type="button" className="link mt-1 block border-0 bg-transparent p-0 text-left text-xs font-semibold max-sm:min-h-[44px]" onClick={() => setNgan({ caseId: c.id })}>
                  <TenCase c={{ title: c.tieuDe, tenSos: c.tenSos }} />
                </button>
              ))}
            </>
          );
        }}
        nhanXet={(k) => <NhanXetKn k={k} attemptId={d.id} cells={d.cells} save={save} phuTrach={d.phuTrachS ? luuPhuTrach : null} />}
        lichSuKn={(k) => (
          <LichSuGon tieuDe={t('Lịch sử {x}', { x: skillLabel(k) })} 
            dong={dongLuot({
              history: d.history.filter((h) => h.field === k), scoreHistory: d.scoreHistory.filter((h) => kyNangO(h.skill) === k),
              lichSuCase: (d.lichSuCase ?? []).filter((h) => kyNangCase(h.topic) === k), homNay,
            })} />
        )}
        duoiBang={d.sEx?.length ? <DongSEx ds={d.sEx} homNay={homNay} /> : null} />

      {/* ⑦ LỊCH SỬ LƯỢT — thu gọn cuối trang; "Lịch sử chi tiết" mở đủ chi tiết của các ô (OV-15g). */}
      <div id="lich-su">
        <LichSuGon tieuDe={t('Lịch sử lượt')} dong={lichSuLuot} the
          chiTiet={{ dong2: [d.student.name, `MT${d.attemptNo}`, d.classCode], id: d.id }} />
      </div>

      {ngan && (
        <NganCase caseId={ngan.caseId} paId={ngan.paId} viec={ngan.viec} hocVien={d.student.name} lop={d.classCode}
          onClose={() => { setNgan(null); reload(); }} onChanged={reload} />
      )}
      {hopLich && d.classId !== null && (
        <HopKyNang anchor={hopLich.anchor} tieuDe={`${d.student.name} · MT${d.attemptNo}`} loai="ft" classId={d.classId} studentId={d.student.id}
          dot={{ loai: 'ft', attemptNo: d.attemptNo }} attemptId={d.id} kn={knHop(d)} kyNangDau={hopLich.k} doiTuanDau={hopLich.k !== null} lichSu={d.lichSu}
          onClose={() => setHopLich(null)} onSaved={reload} onHienDien={() => {}} />
      )}
      {deadlineOpen && <DeadlineModal onClose={() => setDeadlineOpen(false)} detail={d} onDone={reload} />}
      {khoiPhucLuot && (
        <HopKhoiPhucMt attemptId={d.id} attemptNo={d.attemptNo} onDong={() => setKhoiPhucLuot(false)} onXong={reload} z="z-50" />
      )}
      {khoiPhucOpen && d.ketQuaHuy && (
        <HopKhoiPhucKetQua attemptId={d.id} nhan={`MT${d.attemptNo}`} ketQua={d.ketQuaHuy} onDong={() => setKhoiPhucOpen(false)} onXong={reload} />
      )}
    </div>
  );
}

/** Ô nhập (`writing1` …) → kỹ năng của bảng. */
const kyNangO = (s: string): string => (s === 'writing1' || s === 'writing2' ? 'writing' : s);
/** Chủ đề Case → kỹ năng của bảng (Case W theo task vẫn ở dòng Writing). */
const kyNangCase = (topic: string | null): string | null => (topic ? kyNangO(topic) : null);

/** Overall của tóm tắt: ✓ / ✗ trước số, cùng luật tô với ô kỹ năng (`soKyVong`). */
function ODiemOverall({ band, kyVong }: { band: number; kyVong: number | null }) {
  const kq = soKyVong(band, kyVong);
  return (
    <span className="flex items-center gap-1.5">
      {kq && <DauKetQua kq={kq} />}
      <span className={`text-xl font-bold leading-none tabular-nums ${lopKq(kq) || 'text-slate-100'}`}>{fmtBand(band)}</span>
    </span>
  );
}

/** "Còn lại" của tóm tắt lượt (khung M4-A ③): việc của người xem = nút (mở tại chỗ, G6 — không "›"); việc người khác chỉ đọc. FT + lớp thường dùng chung. */
export function ConLaiLuot({ ds: conLai }: { ds: ViecConLai[] }) {
  return (
    <div className="min-w-0 max-sm:w-full sm:ml-auto sm:text-right">
      <span className="block text-xs font-medium text-slate-400">{conLai.length ? t('Còn lại') : t('Không còn việc')}</span>
      {conLai.length > 0 && (
        <ul className="m-0 mt-1 flex list-none flex-wrap gap-1.5 p-0 sm:justify-end">
          {[...conLai].sort((a, b) => Number(!!b.quaHan) - Number(!!a.quaHan)).map((v) => (
            <li key={v.khoa} className="min-w-0 max-w-full">
              {v.mo ? (
                <button type="button" className="btn btn-sm min-h-[44px] max-w-full sm:min-h-0" onClick={v.mo}>
                  <b className="mr-1 text-[color:var(--accent-strong)]">{v.nhan}</b><span className="min-w-0 max-w-[16rem] truncate" title={v.viec}>{v.viec}</span>
                  {v.quaHan && <span className="ml-1.5 whitespace-nowrap text-late">⚠ {v.quaHan}</span>}
                </button>
              ) : (
                <span className="inline-flex min-h-[32px] items-center rounded-md border border-dashed px-2.5 text-xs text-slate-400" style={{ borderColor: 'var(--line-strong)' }}>
                  <b className="mr-1 text-slate-300">{v.nhan}</b><span className="max-w-[16rem] truncate">{[v.viec, v.ai].filter(Boolean).join(' · ')}</span>
                  {v.quaHan && <span className="ml-1.5 whitespace-nowrap text-late">⚠ {v.quaHan}</span>}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type ViecConLai = { khoa: string; nhan: string; viec: string; ai?: string | null; mo?: () => void;
  /** HSL-LT: việc đã quá hạn — chữ "⚠ quá hạn dd/mm" (không chỉ màu), xếp đầu danh sách. */
  quaHan?: string | null };

/**
 * "CÒN LẠI" CỦA LƯỢT (khung M4-A ③, chủ SP 27/10) — chỉ gom việc máy chủ đã có: bài thiếu điểm, thiếu nhận xét (V15), vắng chờ xếp lại, đề nghị
 * dời chờ duyệt, việc tiếp của Case (cùng `viecTiep` với Công việc). Việc của người xem = nút không "›" — mở tại chỗ, G6 (mở đúng dòng + focus / mở form Thêm PA /
 * Ngăn Case); việc của người khác chỉ đọc. Nút của một dòng lấy từ `thaoTacKyNang` — cùng nguồn với cột thao tác của bảng.
 */
function conLaiLuot(d: Detail, homNay: string, theCase: Map<number, CaseCard>, chiDoc: boolean, mo: {
  moDong: (k: KyNangLon, chon?: string) => void; themPa: (k: KyNangLon, caseId: number) => void;
  moCase: (caseId: number, viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa', paId?: number) => void;
}): ViecConLai[] {
  const ds: ViecConLai[] = [];
  for (const k of KY_NANG_LON) {
    const dong = thaoTacDong(d, k, homNay);
    if (!dong) continue;
    const { r, cells, chinh, prog } = dong;
    const n = skillShort(k);
    const cua = (viec: string, chon: string | null, ai?: string | null) =>
      ds.push({ khoa: `${k}:${viec}`, nhan: n, viec, ai, mo: chon !== null && !chiDoc ? () => mo.moDong(k, chon) : undefined });
    if (r.pendingMove) cua(CHU_THAO_TAC['tra-loi-de-nghi'], chinh === 'tra-loi-de-nghi' ? '[data-chinh]' : null, chinh === 'tra-loi-de-nghi' ? null : t('Quản lý'));
    else if (r.required && r.sitStatus === 'absent' && prog !== 'cancelled') cua(CHU_THAO_TAC['xep-lai'], chinh === 'xep-lai' ? '[data-chinh]' : null, chinh === 'xep-lai' ? null : t('Quản lý'));
    else if (r.required && (prog === 'due' || prog === 'overdue') && cells.some((c) => c.required && c.band === null && c.rawScore === null && !c.noShow)) {
      cua(chinh === 'nhap-diem' ? CHU_THAO_TAC['nhap-diem'] : t('Chờ điểm'), chinh === 'nhap-diem' ? '[data-chinh]' : null);
    }
    const thieuNx = cells.filter((c) => c.thieuNhanXet);
    if (thieuNx.length) cua(thieuNx.some((c) => c.canEdit) ? t('Viết nhận xét') : t('Chờ nhận xét'), thieuNx.some((c) => c.canEdit) ? 'textarea' : null);
  }
  for (const c of d.caseLuot ?? []) {
    const k = kyNangCase(c.topic) as KyNangLon | null;
    const v = viecCaseLuot({ id: c.id, tam: c.trangThai.k === 'tam', viecTiep: c.viecTiep }, theCase.get(c.id), `Case ${k ? skillShort(k) : ''}`.trim(),
      homNay, chiDoc, { themPa: k ? () => mo.themPa(k, c.id) : null, moCase: mo.moCase });
    if (v) ds.push(v);
  }
  return ds;
}

/**
 * Việc tiếp của MỘT Case ở "Còn lại" (cùng `viecTiep` với Công việc) — FT + lớp thường. Case tạm / kết quả PA chưa tới hạn chưa là việc
 * (Công việc cũng chưa đếm) — PA vừa thêm không sinh việc ngay. Việc của người xem mở form Thêm PA tại chỗ / Ngăn Case; người khác chỉ đọc.
 */
export function viecCaseLuot(c: { id: number; tam: boolean; viecTiep?: CaseCard['viecTiep'] }, the: CaseCard | undefined, nhan: string, homNay: string, chiDoc: boolean, mo: {
  themPa: (() => void) | null;
  moCase: (caseId: number, viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa', paId?: number) => void;
}): ViecConLai | null {
  const v = the?.viecTiep ?? c.viecTiep ?? null;
  if (!v || c.tam || (v.loaiHan === 'cap-nhat-pa' && (!v.han || v.han > homNay))) return null;
  const cuaToi = !chiDoc && !!the?.canEdit;
  const loai = v.chu.startsWith('Xác nhận Case') || v.chu.startsWith('Mô tả Case') ? 'xac-nhan' as const
    : v.chu.startsWith('Xác nhận PA') ? 'xac-nhan-pa' as const : v.loaiHan === 'cap-nhat-pa' ? 'ghi-ket-qua' as const : undefined;
  return {
    khoa: `case:${c.id}`, nhan, viec: dich(v.chu), ai: cuaToi ? null : the?.nguoiLam?.ten ?? null,
    mo: !cuaToi ? undefined : v.chu === CHU_THEM_PA && mo.themPa ? mo.themPa : () => mo.moCase(c.id, loai, (v as { paId?: number }).paId),
  };
}

/**
 * R15 — CHỌN ĐỢT KHÁC của cùng học viên, cạnh tiêu đề. Nhãn `MT{n} · W3 SEP` (Mock Test) hoặc `Giữa khoá · W3 SEP` /
 * `Cuối khoá · W3 SEP` (lớp thường); đi bằng `attemptHref` nên bài lớp thường mở trang lượt lớp thường (HSL-LT). Đợt đang xem chọn
 * sẵn; chỉ có một đợt thì không hiện.
 */
export function ChonDot({ hienTai, ds, homNay, onChon }: {
  hienTai: number; ds: DotCuaHv[]; homNay: string; onChon: (r: DotCuaHv) => void;
}) {
  if (ds.length < 2 || !ds.some((r) => r.id === hienTai)) return null;
  const xep = [...ds].sort((a, b) =>
    (a.period?.weekStart ?? '9999').localeCompare(b.period?.weekStart ?? '9999') || a.attemptNo - b.attemptNo || a.id - b.id);
  const nhan = (r: DotCuaHv) => {
    const ten = r.kind === 'mock' || !r.kind ? `MT${r.attemptNo}` : ATTEMPT_KIND_SHORT[r.kind as AttemptKind] ?? r.kind;
    const tuan = r.period ? tuanLich(r.period.weekStart, homNay) : t('chưa chốt tuần');
    return `${ten} · ${tuan}${r.status === 'cancelled' ? ` · ${attemptStatusLabel(r.status)}` : ''}`;
  };
  return (
    <select className="field w-auto max-w-full min-w-44" value={hienTai} aria-label={t('Chọn đợt khác của học viên này')}
      title={t('Mở đợt khác của cùng học viên')}
      onChange={(e) => { const r = xep.find((x) => x.id === Number(e.target.value)); if (r && r.id !== hienTai) onChon(r); }}>
      {xep.map((r) => <option key={r.id} value={r.id}>{nhan(r)}</option>)}
    </select>
  );
}

export function Info({ label, title, children }: { label: string; title?: string; children: React.ReactNode }) {
  return (
    <div title={title}>
      <dt className="text-[12px]  text-slate-500 font-semibold">{label}</dt>
      <dd className="text-sm text-slate-100 mt-1 m-0">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------- bảng làm việc

/** Ô kỹ năng của hộp một đợt từ hồ sơ Mock — cùng luật khoá / điểm với Kế hoạch Test (`khoaCua`, `diemChu` ở máy chủ). */
function knHop(d: Detail): KnO {
  const kn: KnO = {};
  for (const r of d.skillSchedule) {
    if (!(KY_NANG_KE_HOACH as readonly string[]).includes(r.skill)) continue;
    const o = d.cells.filter((c) => c.assessedSkill === r.skill);
    const bands = o.map((c) => c.band).filter((b): b is number => b !== null);
    const coDiem = o.some((c) => c.band !== null || c.rawScore !== null);
    kn[r.skill as KyNangKH] = {
      ...oKyNangTuLich(r, khongDuThiTuO(d.cells, r.skill)),
      khoa: r.sitStatus === 'cancelled' ? 'đã huỷ' : coDiem ? 'đã có điểm' : r.sitStatus === 'sat' ? 'đã làm bài' : null,
      ...(bands.length ? { diem: bands.map((b) => b.toFixed(1)).join(' / ') } : {}),
    };
  }
  return kn;
}

/**
 * NHẬN XÉT MỘT KỸ NĂNG (PR-HSM, YC-13.5, Q1; OV-4b; HSL-FT: cột trái vùng mở của dòng kỹ năng).
 *
 * "Nhận xét Writing" có HAI phần Task 1 · Task 2 (hai task có thể hai GV — K4-31), mỗi phần ghi người nhập điểm của bài đó;
 * "Nhận xét Speaking" kèm GV chấm (đổi là lưu ngay). Người sửa được bài đó (`cell.canEdit`) gõ tại chỗ, lưu khi rời ô; người
 * khác đọc chữ thường. OV-12b: ô dưới kỳ vọng → chip "Nhóm nguyên nhân *" ngay dưới nhận xét (bấm là lưu); người không sửa được thấy chip tĩnh.
 */
function NhanXetKn({ k, attemptId, cells, save, phuTrach }: {
  k: KyNangLon; attemptId: number; cells: Cell[]; save: (skill: string, patch: SavePatch) => Promise<boolean | 'trung'>;
  /** OV-13k: người xem là GV phụ trách S / GVCN / QL — ghi "Nhận xét GV phụ trách", sửa nhóm ô S (đường riêng). */
  phuTrach: ((body: { nhanXetPhuTrach?: string | null; nhomNguyenNhan?: string[] }) => Promise<boolean>) | null;
}) {
  const toi = useSession().session?.user?.id;
  const o = (s: string) => cells.find((c) => c.skill === s);
  const sua = (c: Cell | undefined): boolean => !!c && c.canEdit && !lockedByNoShow(c);
  const phu = (c: Cell) => (c.enteredByName ? t('Người nhập điểm: {enteredByName}', { enteredByName: c.enteredByName }) : null);
  const nenCo = (c: Cell) => !!c.nenCoNhanXet && coDiemChinhThuc(c);
  const canNhom = (c: Cell) => !!c.coNhom && coDiemChinhThuc(c) && canNhomNguyenNhan(c.band, c.kyVong ?? null);
  /** `nhomSua`: chỉ đọc nhận xét người chấm nhưng sửa được nhóm (GV phụ trách S — OV-13k). */
  const phan = (c: Cell | undefined, nhan: string, nhomSua?: (v: string[]) => Promise<boolean>) => {
    if (!c) return null;
    if (sua(c) && !nhomSua) {
      return (
        <div key={c.skill} className="min-w-0 space-y-2.5">
          <ONhanXet nhan={nhan} phu={phu(c)} kyNang={c.skill} giaTri={c.nhanXet ?? null} nenCo={nenCo(c)} onLuu={(v) => save(c.skill, { nhanXet: v }).then((r) => r === true)} />
          {canNhom(c) && <NhomTaiCho skill={c.skill} giaTri={c.nhomNguyenNhan ?? []} onLuu={(v) => save(c.skill, { nhomNguyenNhan: v }).then((r) => r === true)} />}
        </div>
      );
    }
    if (!c.nhanXet && !c.nhomNguyenNhan?.length) return null;
    return (
      <div key={c.skill} className="min-w-0">
        <div className="flex items-baseline gap-2 text-xs text-slate-400">
          <span className="shrink-0 whitespace-nowrap font-medium text-slate-300">{nhan}</span>{phu(c) && <span className="truncate text-slate-500">{phu(c)}</span>}
        </div>
        {nhomSua && canNhom(c) ? null : !!c.nhomNguyenNhan?.length && <div className="mt-1.5"><NhomTinh value={c.nhomNguyenNhan} /></div>}
        {c.nhanXet && <p className="m-0 mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200"><ChuDich chu={c.nhanXet} nguon={{ bang: 'assessment_scores', id: attemptId, cot: 'comment', kyNang: c.skill }} /></p>}
        {nhomSua && canNhom(c) && <div className="mt-2.5"><NhomTaiCho skill={c.skill} giaTri={c.nhomNguyenNhan ?? []} onLuu={nhomSua} /></div>}
      </div>
    );
  };
  const tieuDe = (phai?: ReactNode) => (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <h2 className="m-0 text-sm font-semibold text-slate-200">{t('Nhận xét')}{' '}{skillLabel(k)}</h2>{phai}
    </div>
  );
  const rong = <p className="m-0 text-xs text-slate-500">{t('Chưa có')}</p>;
  if (k === 'writing') {
    const w = [phan(o('writing1'), 'Task 1'), phan(o('writing2'), 'Task 2')].filter(Boolean);
    return <section className="min-w-0 space-y-3">{tieuDe()}{w.length ? w : rong}</section>;
  }
  if (k !== 'speaking') return <section className="min-w-0 space-y-3">{tieuDe()}{phan(o(k), t('Nhận xét')) ?? rong}</section>;
  const s = o('speaking');
  if (!s) return <section className="min-w-0 space-y-3">{tieuDe()}{rong}</section>;
  /* OV-13k: GV phụ trách xem bài người khác chấm — nhận xét người chấm chỉ đọc (không đè), nhóm sửa qua đường phụ trách. */
  const ptXem = !!phuTrach && coDiemChinhThuc(s) && (s.gvCham?.userId ?? null) !== toi;
  const nxS = phan(s, t('Nhận xét'), ptXem ? (v) => phuTrach!({ nhomNguyenNhan: v }) : undefined);
  const pt = s.nhanXetPhuTrach ?? null;
  /* GV phụ trách TỰ chấm: nhận xét của họ là nhận xét người chấm — không có ô thứ hai. */
  const nxPt = ptXem ? (
    <ONhanXet nhan={t('Nhận xét GV phụ trách')} phu={pt?.ten ?? null} giaTri={pt?.chu ?? null} onLuu={(v) => phuTrach!({ nhanXetPhuTrach: v })} />
  ) : pt ? (
    <div className="min-w-0">
      <div className="flex items-baseline gap-2 text-xs text-slate-400">
        <span className="shrink-0 whitespace-nowrap font-medium text-slate-300">{t('Nhận xét GV phụ trách')}</span>{pt.ten && <span className="truncate text-slate-500">{pt.ten}</span>}
      </div>
      <p className="m-0 mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200"><ChuDich chu={pt.chu} nguon={{ bang: 'assessment_scores', id: attemptId, cot: 'nhan_xet_phu_trach', kyNang: 'speaking' }} /></p>
    </div>
  ) : null;
  return (
    <section className="min-w-0 space-y-3">
      {tieuDe(sua(s)
        ? <NutGvCham value={gvChamThanhChon(s.gvCham)} goiY={t('Lưu ngay cho bài Speaking này.')} onChange={(v) => void save('speaking', { gvCham: gvChamPayload(v) })} />
        : s.gvCham && coDiemChinhThuc(s) && <span className="text-xs text-slate-400">{t('GV chấm: {ten}', { ten: s.gvCham.ten })}</span>)}
      {nxS ?? (!nxPt && rong)}
      {nxPt}
    </section>
  );
}

const THU_TU_O = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
const coDiemO = (c: Cell) => c.band !== null || c.rawScore !== null;
/* LUAT-34: ô "-" MT cũ = Đã huỷ (`da-huy`) — như "Không dự thi" cũ: không hạn; GV đúng ô: nút chính Nhập điểm (gỡ "-" trong hộp). */
const khongDuThiO = (c: Cell) => (c.noShow?.state === 'khong-du-thi' || c.noShow?.state === 'da-huy') && !c.daChot && !coDiemO(c);
const laDiem = (x: ThaoTac | null) => x === 'nhap-diem' || x === 'sua-diem';

/**
 * THAO TÁC MỘT DÒNG KỸ NĂNG (PR-XLMT, T38, K4-27): nút chính và menu ⋯ từ MỘT nguồn `thaoTacKyNang`, tính cho từng ô nhập rồi gộp — Writing:
 * thao tác lịch của W1 (một lịch cho hai task), nút điểm của task còn thiếu, Huỷ / Khôi phục điểm của cả hai task. Còn lại (`conLaiLuot`) đọc cùng hàm.
 */
function thaoTacDong(d: Detail, k: string, homNay: string) {
  const r = d.skillSchedule.find((x) => x.skill === k);
  const cells = d.cells.filter((c) => c.assessedSkill === k).sort((a, b) => THU_TU_O.indexOf(a.skill) - THU_TU_O.indexOf(b.skill));
  if (!r || !cells.length) return null;
  const cancelled = d.status === 'cancelled';
  const ws = cells.map((c, i) => {
    const ownsSchedule = i === 0;
    const canScore = !cancelled && r.required && c.canEdit && !lockedByNoShow(c)
      && r.sitStatus !== 'absent' && r.sitStatus !== 'cancelled' && r.progress !== 'cancelled';
    /* OV-11a: "Không dự thi" chưa có điểm → nút chính "Nhập điểm" (không "Sửa điểm"). */
    const hasValue = c.rawScore !== null || c.band !== null || c.criteria.some((v) => v !== null) || (!!c.noShow && !khongDuThiO(c));
    /* LUAT-34 (S13): MT cũ, mọi ô của kỹ năng "Đã huỷ" → Khôi phục / Không mock lại như vắng 2 lần (chỉ Quản lý). */
    const huyCu = d.viewer.canPlanWeek && d.lichSu && cells.every((x) => x.noShow?.state === 'da-huy');
    const tt = trangThaiTT({
      batBuoc: r.required, tuanBatDau: r.weekStart, coDiem: coDiemO(c), sit: r.sitStatus, choDuyet: !!r.pendingMove, lichSu: d.lichSu, homNay, huyVang: !!r.huyVang, huyCu,
    });
    const tat = cancelled ? { chinh: null, menu: [] as ThaoTac[] }
      : thaoTacKyNang(tt, { nhapDiem: c.canEdit, quanLy: d.viewer.canPlanWeek, gvcn: d.viewer.laGvcn, laFt: true, dotHoanTat: !!c.khoa,
          huy: d.viewer.canSkipSkill, han: d.viewer.canOverrideDeadline, diemHuy: !!c.diemHuy });
    const chinh0 = ownsSchedule || laDiem(tat.chinh) ? tat.chinh : null;
    /* Nhập/Sửa điểm chỉ khi ô thật sự mở (không bị dấu "-" khoá, không vắng/huỷ). */
    const chinh = laDiem(chinh0) && !canScore ? null : chinh0;
    const menu = ownsSchedule ? tat.menu : tat.menu.filter((x) => x === 'huy-diem' || x === 'khoi-phuc-diem');
    return { c, chinh, menu, hasValue, canScore };
  });
  const lich = ws[0].chinh && !laDiem(ws[0].chinh) ? ws[0] : null;
  const chon = lich ?? ws.find((w) => laDiem(w.chinh) && !w.hasValue) ?? ws.find((w) => laDiem(w.chinh)) ?? null;
  const menu: { x: ThaoTac; c: Cell }[] = [];
  for (const w of ws) for (const x of w.menu) if (!menu.some((m) => m.x === x)) menu.push({ x, c: w.c });
  const prog = r.scored || ws.every((w) => coDiemO(w.c) || !w.c.required) ? 'scored' : r.progress;
  return {
    r, cells, chinh: chon?.chinh ?? null, chinhO: chon?.c ?? cells[0], menu, prog,
    nhanChinh: chon?.chinh === 'nhap-diem' && chon.hasValue ? CHU_THAO_TAC['sua-diem'] : chon?.chinh ? CHU_THAO_TAC[chon.chinh] : '',
    canScore: ws.some((w) => w.canScore),
  };
}

/** Lịch gốc khi đã dời (QL dời / dời do vắng) — tuần cũ của lần dời ĐẦU TIÊN + câu phụ của lần MỚI NHẤT; null = chưa dời. */
function lichGocKn(d: Detail, k: string, homNay: string): { goc: string; phu: string; title: string | null } | null {
  const doi = d.history.filter((h) => h.field === k && (h.action === 'skill_week_set' || h.action === 'skill_week_moved_absence') && h.oldValue && h.newValue)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  if (!doi.length) return null;
  const tuan = (v: string) => { const x = docTuanLich(v, homNay); return x ? tuanLich(x, homNay) : v; };
  const r = d.skillSchedule.find((x) => x.skill === k);
  const goc = tuan(doi[0].oldValue!);
  if (!r?.weekStart || goc === tuanLich(r.weekStart, homNay)) return null;
  const moi = doi[doi.length - 1];
  const vang = moi.action === 'skill_week_moved_absence';
  return {
    goc,
    phu: vang ? t('vắng lần {x}', { x: Math.max(1, r.absenceMoveCount) }) : t('dời {ngay}', { ngay: fmtDate(moi.createdAt).slice(0, 5) }),
    title: [moi.actorName, moi.reason].filter(Boolean).join(' · ') || null,
  };
}

/**
 * BẢNG KẾT QUẢ CỦA LƯỢT (khung M4-A ④–⑥, HSL-FT): một dòng mỗi kỹ năng L · R · W · S — lịch (gốc gạch → thực tế), ô điểm (bấm = hộp nhập điểm
 * neo ô, như dải ô lớn cũ — `useODiem`), trạng thái + hạn, có / chưa nhận xét, Case, nút chính + ⋯. Bấm dòng mở vùng ngay dưới (một dòng một lúc):
 * Nhận xét | Case & phương án ngang nhau, dải Lịch sử kỹ năng dưới cả hai; 375 xếp dọc. S Ex dưới bảng (chỉ đọc, ngoài Overall / SOS).
 */
function BangKetQuaLuot({ d, homNay, chiDoc, moKn, onMoKn, moO, onMoO, save, onDone, onDoiLich, emTiep, ve, nhanXet, vungCase, lichSuKn, duoiBang }: {
  d: Detail; homNay: string; chiDoc: boolean;
  moKn: KyNangLon | null; onMoKn: (k: KyNangLon) => void;
  moO: string | null; onMoO: (k: string | null) => void;
  save: (skill: string, patch: SavePatch, opts?: SaveOpts) => Promise<boolean | 'trung'>;
  onDone: () => void;
  /** PR-HOP1: "Xếp lịch" / "Dời lịch thi" một kỹ năng → hộp một đợt, dòng kỹ năng đó mở sẵn ô chọn tuần. */
  onDoiLich: (anchor: HTMLElement, k: KyNangKH) => void;
  emTiep: ((kyNang: string) => void) | null; ve: KetThucHop['nut'];
  nhanXet: (k: KyNangLon) => ReactNode; vungCase: (k: KyNangLon) => ReactNode; lichSuKn: (k: KyNangLon) => ReactNode;
  duoiBang: ReactNode;
}) {
  const [moveFor, setMoveFor] = useState<SkillRow | null>(null);
  const [decideFor, setDecideFor] = useState<SkillRow | null>(null);
  const [hop, setHop] = useState<{ t: ThaoTac; r: SkillRow; c: Cell } | null>(null);
  const toast = useToast();
  const dangKhoiPhuc = useRef(false);   // chống bấm đúp
  /* LUAT-34 (T20b): "Khôi phục điểm" một bấm — máy chủ ghi lại điểm cất (mọi ô của kỹ năng) qua đúng đường lưu điểm. */
  const khoiPhuc = async (skill: string) => {
    try {
      if (dangKhoiPhuc.current) return;
      dangKhoiPhuc.current = true;
      await api.post(`/attempts/${d.id}/skills/${skill}/khoi-phuc-diem`, {});
      invalidate('/attempts'); invalidate('/classes'); invalidate('/students'); invalidate('/my-work');
      toast.push('ok', t('Đã khôi phục điểm {x}{x2}', { x: skillLabel(skill), x2: '' }));
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { dangKhoiPhuc.current = false; }
  };
  const cancelled = d.status === 'cancelled';
  const { o, hop: hopDiem } = useODiem({
    cells: d.cells, lich: d.skillSchedule as LichKn[], result: d.result, lichSu: d.lichSu, homNay, mo: moO, onMo: onMoO, save,
    nguCanh: nguCanhChiTiet(d), emTiep, ve,
  });
  /* Huỷ điểm Writing: hộp tích sẵn mọi ô W đang có điểm (dòng W gộp hai task). */
  const oCoDiemCua = (c: Cell): string[] => (c.assessedSkill !== 'writing' ? [c.skill]
    : d.cells.filter((x) => x.assessedSkill === 'writing' && coDiemO(x)).map((x) => x.skill));

  const dongKn = (k: KyNangLon) => {
    const td = thaoTacDong(d, k, homNay);
    if (!td) return null;
    const { r, cells, chinh, chinhO, menu, prog, nhanChinh } = td;
    const mo = moKn === k;
    const chay = (t: ThaoTac, c: Cell) => {
      if (laDiem(t)) onMoO(c.skill);
      else if (t === 'khoi-phuc-diem') void khoiPhuc(c.skill);
      else if (t === 'xep-lai') setMoveFor(r);
      else if (t === 'tra-loi-de-nghi') setDecideFor(r);
      else if ((t === 'doi-lich' || t === 'dat-lich') && d.classId !== null) onDoiLich(document.getElementById(`kn-${k}`)!, r.skill as KyNangKH);
      else setHop({ t, r, c });
    };
    const c0 = cells[0];
    /* OV-11a: MỘT dòng trạng thái — Không dự thi (CA3-5) thay "Chờ nhập điểm"; huỷ vì vắng ghi số lần thật. */
    const khongDuThi = khongDuThiO(c0);
    const huy = prog === 'cancelled';
    const nhanTT = khongDuThi ? (c0.noShow?.state === 'da-huy' ? t('Đã huỷ · vắng MT cũ') : t('Vắng'))
      : huy && r.huyVang ? t('{progressLabel} · vắng {x} lần', { progressLabel: progressLabel('cancelled'), x: r.absenceMoveCount + 1 })
      : r.sitStatus === 'absent' && !r.pendingMove && !huy ? t('Vắng lần {x} · chờ xếp lại', { x: r.absenceMoveCount + 1 })
      : progressLabel(prog);
    const goc = r.required ? lichGocKn(d, k, homNay) : null;
    const coDiemCells = cells.filter(coDiemO);
    const nguoiNx = [...new Set(coDiemCells.filter((c) => c.nhanXet).map((c) => c.enteredByName).filter(Boolean))];
    const cs = (d.caseLuot ?? []).filter((c) => kyNangCase(c.topic) === k);
    const oThieu = cells.find((c) => c.required && !coDiemO(c)) ?? c0;
    /* Bấm vào khoảng trống của dòng = mở / thu vùng; bấm nút, link, ô điểm thì không. */
    const bamDong = (e: React.MouseEvent) => { if (!(e.target as HTMLElement).closest('button, a, input, select, textarea, [role="dialog"], [role="menu"]')) onMoKn(k); };
    return (
      <div key={k} className={`border-t ${mo ? 'bg-white/[0.025]' : ''}`} style={{ borderColor: 'var(--line)' }}>
        <div id={`kn-${k}`} role="row" onClick={bamDong}
          className={`${ROW_GRID} cursor-pointer scroll-mt-4 px-3 py-2.5 ${r.required ? '' : 'row-muted'}`}>
          <div role="cell" className="min-w-0 md:order-none">
            <button type="button" aria-expanded={mo} aria-controls={mo ? `vung-${k}` : undefined} onClick={() => onMoKn(k)}
              className="inline-flex min-h-[44px] items-center gap-2 border-0 bg-transparent p-0 text-left text-[15px] font-bold text-slate-100 sm:min-h-0">
              <span aria-hidden className="w-3 text-xs text-slate-500">{mo ? '▾' : '▸'}</span>{skillLabel(k)}
            </button>
          </div>
          <div role="cell" className="justify-self-end md:order-none md:col-start-3 md:row-start-1 md:justify-self-start">{o(k, true)}</div>
          <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:contents">
            <div role="cell" className="text-sm md:col-start-2 md:row-start-1">
              {!r.required ? <span className="text-slate-500 max-md:hidden">—</span> : r.periodCode ? (
                <span className="tabular-nums">
                  {goc && <><s className="text-slate-500" title={t('Lịch gốc')}>{goc.goc}</s><span className="mx-1 text-slate-500">→</span></>}
                  <span className="font-semibold text-slate-200">{tuanLich(r.weekStart, homNay)}</span>
                  {goc ? <span className="block text-xs text-slate-500" title={goc.title ?? undefined}>{goc.phu}</span>
                    : r.planSource === 'manual' && <span className="block text-xs text-slate-500">{t('đã xếp riêng')}</span>}
                </span>
              ) : <Tag pending>{t('Chưa xếp tuần')}</Tag>}
            </div>
            <div role="cell" className="min-w-0 space-y-1 md:col-start-4 md:row-start-1">
              {r.required ? (
                <Status kind={prog === 'scored' ? 'done'
                  /* MT lịch sử: nhập bù, không hạn — xám như việc "không tính hạn", không màu chờ. */
                  : khongDuThi || prog === 'skipped' || prog === 'cancelled' || prog === 'not_scheduled' || prog === 'lich_su' ? 'idle'
                  : prog === 'due' || prog === 'sat' ? 'doing' : 'waiting'}>
                  {nhanTT}
                </Status>
              ) : <Status kind="idle"><span title={r.scopeReason ?? undefined}>{t('Ngoài phạm vi')}</span></Status>}
              {/* Đã có điểm thì chip trạng thái đã nói đủ; hạn chỉ còn nghĩa khi bài còn nợ. MT lịch sử không có hạn (T34). */}
              {r.required && prog !== 'scored' && !khongDuThi && !huy && r.sitStatus !== 'absent' && !r.pendingMove && !d.lichSu && <div><DeadlinePill cell={oThieu} /></div>}
              {/* ĐANG CHỜ AI, ĐẾN NGÀY NÀO: không nói hạn thì người xem không biết còn bao lâu nữa phần thi bị huỷ. */}
              {r.pendingMove && (
                <div className="text-xs text-amber-200" title={`${t('Đề nghị dời sang')} ${r.pendingMove.toWeek ?? t('tuần kế tiếp')} ${t('(lần {moveNo}) — Quản lý cần trả lời trước', { moveNo: r.pendingMove.moveNo })} ${fmtDate(r.pendingMove.decideBy)}${r.huyVang ? '' : t(', quá hạn thì huỷ kỹ năng')}.`}>
                  ⚠ {t('Chờ QL duyệt dời lần {moveNo} · hạn {ngay}', { moveNo: r.pendingMove.moveNo, ngay: fmtDate(r.pendingMove.decideBy).slice(0, 5) })}
                </div>
              )}
              {r.sitNote && !c0.noShow && <div className="text-xs text-slate-500">{r.sitNote}</div>}
            </div>
          </div>
          <div className="col-span-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm md:contents">
            <div role="cell" className="min-w-0 md:col-start-5 md:row-start-1">
              {!r.required || !coDiemCells.length ? <span className="text-slate-500 max-md:hidden">—</span>
                : coDiemCells.every((c) => c.nhanXet) ? <span className="text-slate-300">{[t('Có'), ...nguoiNx].join(' · ')}</span>
                : <span className={cells.some((c) => c.thieuNhanXet) ? 'font-semibold text-soon' : 'text-slate-500'}>{t('Chưa nhận xét')}</span>}
            </div>
            <div role="cell" className="min-w-0 md:col-start-6 md:row-start-1">
              {!cs.length ? <span className="text-slate-500 max-md:hidden">—</span> : (
                <span className="flex min-w-0 flex-col">
                  <b className="text-slate-100">Case {skillShort(k)}{cs.length > 1 && <span className="font-normal text-slate-400"> +{cs.length - 1}</span>}</b>
                  <span className="text-xs text-slate-400 max-md:hidden">{cs[0].pas.some((p) => !p.xong) ? t('PA đang làm') : t('Chưa có PA')}</span>
                </span>
              )}
            </div>
          </div>
          <div role="cell" className="col-span-2 flex flex-wrap items-center gap-1.5 md:col-span-1 md:col-start-7 md:row-start-1 md:justify-end">
            {chinh && (
              <button type="button" data-chinh className={`btn btn-sm min-h-[44px] sm:min-h-0 ${nhanChinh === CHU_THAO_TAC['sua-diem'] ? '' : 'btn-primary'}`} onClick={() => chay(chinh, chinhO)}>{nhanChinh}</button>
            )}
            {!chinh && !chiDoc && cells.some((c) => c.required && !c.canEdit) && !cancelled && (
              <span className="text-xs text-slate-500" title={t('Bạn không được phân công kỹ năng này')}>{t('Chỉ xem')}</span>
            )}
            {/* Không có mục thì giữ chỗ cùng rộng nút ⋯ (w-7) — nút chính các dòng thẳng cột (rà #126). */}
            {menu.length ? (
              <MenuDong nhan={t('Thao tác khác · {skillLabel}', { skillLabel: skillLabel(k) })} muc={menu.map(({ x, c }) => ({
                key: x, nhan: CHU_THAO_TAC[x], onChon: () => chay(x, c), nguyHiem: x === 'bo-ky-nang' || x === 'huy-diem' || x === 'khong-mock-lai',
              }))} />
            ) : <span aria-hidden className="inline-block w-7 flex-none max-md:hidden" />}
          </div>
        </div>
        {mo && (
          <VungMoKn id={`vung-${k}`} nhanXet={nhanXet(k)} caseNode={vungCase(k)} lichSu={lichSuKn(k)} />
        )}
      </div>
    );
  };

  return (
    <section aria-label={t('Kết quả theo kỹ năng')} className="card overflow-hidden p-0">
      {!d.completionWeek.valid && (
        <p className="m-0 px-3 pt-3 text-xs text-amber-200">
          {t('Chưa có kế hoạch hợp lệ cho tuần dự kiến hoàn tất:')}{' '}{d.completionWeek.blockingLabels.join(', ')}{' '}{t('chưa có tuần Test hoặc đã bị huỷ. Đợt vẫn chưa đủ kết quả cho tới khi Quản lý xếp lại.')}
        </p>
      )}
      {d.cells.length === 0 ? (
        <Empty title={t('Lớp này chưa cấu hình kỹ năng nào')} />
      ) : (
        <div role="table" aria-label={t('Kết quả theo kỹ năng')}>
          <div role="row" className={`${ROW_GRID} hidden px-3 py-2 text-[12px] font-semibold text-slate-500 md:grid`}>
            <div role="columnheader">{t('Kỹ năng')}</div>
            <div role="columnheader">{t('Lịch')}</div>
            <div role="columnheader">{t('Điểm')}</div>
            <div role="columnheader">{t('Trạng thái')}</div>
            <div role="columnheader">{t('Nhận xét')}</div>
            <div role="columnheader">Case</div>
            <div role="columnheader"><span className="sr-only">{t('Thao tác')}</span></div>
          </div>
          {KY_NANG_LON.map(dongKn)}
        </div>
      )}
      {duoiBang}

      {hopDiem}
      {hop && (
        <HopThaoTacMt key={`${hop.t}:${hop.c.skill}`} thaoTac={hop.t} attemptId={d.id} skill={hop.r.skill} ct={null} laThuong={false}
          quanLy={d.viewer.canPlanWeek} row={{ periodId: hop.r.periodId, weekStart: hop.r.weekStart, deadline: hop.r.deadline }}
          oCoDiem={oCoDiemCua(hop.c)} hocVien={d.student.name} lop={d.classCode} onClose={() => setHop(null)} onDone={onDone} />
      )}
      {moveFor && <AbsenceMoveModal row={moveFor} detail={d} onClose={() => setMoveFor(null)} onDone={onDone} />}
      {decideFor && <TraLoiDeNghiModal row={decideFor} detail={d} onClose={() => setDecideFor(null)} onDone={onDone} />}
    </section>
  );
}

/** Vùng mở của dòng kỹ năng / môn: Nhận xét | Case & phương án ngang nhau, dải Lịch sử dưới cả hai; 375 xếp dọc (FT + lớp thường). */
export function VungMoKn({ id, nhanXet, caseNode, lichSu }: { id: string; nhanXet: ReactNode; caseNode: ReactNode; lichSu: ReactNode }) {
  return (
    <div role="row"><div role="cell" aria-colspan={7} id={id} className="space-y-3 px-3 pb-3">
      <div className="grid items-start gap-3 md:grid-cols-2">
        <div className="min-w-0 rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>{nhanXet}</div>
        <div className="min-w-0 rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
          <h2 className="m-0 mb-1 text-sm font-semibold text-slate-200">{t('Case & phương án')}</h2>
          {caseNode}
        </div>
      </div>
      {lichSu}
    </div></div>
  );
}

/** Dòng S Ex dưới bảng (N10): chip · điểm · GV · tuần — lượt Speaking riêng, chỉ đọc, không tính vào Overall / SOS. */
function DongSEx({ ds, homNay }: { ds: NonNullable<Detail['sEx']>; homNay: string }) {
  return (
    <div className="space-y-1 border-t border-dashed px-3 py-2.5" style={{ borderColor: 'var(--line-strong)' }}>
      {ds.map((x, i) => (
        <div key={x.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
          <NhanSEx />
          <b className="tabular-nums text-slate-100">{x.diem !== null ? fmtBand(x.diem) : t('Chưa chấm')}</b>
          <span className="text-slate-400">{[x.nguoiCham && t('GV {ten}', { ten: x.nguoiCham }), tuanLich(x.tuan, homNay)].filter(Boolean).join(' · ')}</span>
          {i === 0 && <NutLuat label="S Expert">{t('S Expert — lượt Speaking riêng, không tính vào Overall / SOS.')}</NutLuat>}
        </div>
      ))}
    </div>
  );
}

/**
 * LỊCH SỬ THU GỌN (khung M4-A ⑤ dải Lịch sử kỹ năng, ⑦ Lịch sử lượt): "n thay đổi · mới nhất {ngày} {việc}"; mở ra là dòng thời gian
 * (`DongThoiGianLuot`) của đúng tập đó (`dongLuot`) — số và dòng cùng nguồn. Lịch sử lượt giữ nút "Lịch sử chi tiết" (OV-15g).
 */
export function LichSuGon({ tieuDe, dong, the = false, chiTiet }: {
  tieuDe: string; dong: DongLuot[]; the?: boolean;
  chiTiet?: { id: number; dong2: (string | null)[] };
}) {
  const [mo, setMo] = useState(false);
  const { ngan } = useNgayNghiepVu();
  if (!dong.length && !the) return null;
  const moi = dong[0];
  return (
    <details className={`group ${the ? 'card px-4 py-3' : 'rounded-lg border px-3 py-2'}`} style={the ? undefined : { borderColor: 'var(--line)' }}>
      <summary className="flex min-h-[44px] cursor-pointer list-none flex-wrap items-baseline gap-x-2 sm:min-h-0 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="w-3 text-xs text-slate-500 transition-transform group-open:rotate-90">▸</span>
        <b className={the ? 'text-[15px] text-slate-100' : 'text-sm text-slate-200'}>{tieuDe}</b>
        <span className="text-xs tabular-nums text-slate-400">
          {dong.length ? t('{n} thay đổi', { n: dong.length }) : t('Chưa có thay đổi nào.')}
          {moi && <> · {t('mới nhất')} {ngan(moi.at)} {[moi.viec, moi.mon, moi.ai].filter(Boolean).join(' · ')}</>}
        </span>
      </summary>
      <div className="mt-2.5">
        <DongThoiGianLuot history={[]} scoreHistory={[]} dong={dong} gioiHan={the ? 10 : 5} />
        {chiTiet && (
          <button type="button" className="btn btn-ghost btn-sm mt-2 min-h-[44px] sm:min-h-0" onClick={() => setMo(true)}>{t('Lịch sử chi tiết')}</button>
        )}
      </div>
      {mo && chiTiet && <LichSuThayDoi loai="o" id={chiTiet.id} dong2={chiTiet.dong2} onClose={() => setMo(false)} />}
    </details>
  );
}

// ---------------------------------------------------------------- thao tác cả đợt (menu đầu trang, K4-29)

/** Dời hạn chấm CẢ ĐỢT: một hạn riêng thay hạn mặc định của mọi kỹ năng. Lý do tuỳ chọn (T7). */
function DeadlineModal({ onClose, detail, onDone }: {
  onClose: () => void; detail: Detail; onDone: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState(detail.deadlineOverride?.date ?? '');
  const [reason, setReason] = useState(detail.deadlineOverride?.reason ?? '');
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const ten = t('{x} cả đợt', { x: CHU_THAO_TAC['doi-han'] });
  const loi: LoiTruong[] = [];   // T7 (PR-MTa): dời hạn chấm — lý do tuỳ chọn
  const daSua = date !== (detail.deadlineOverride?.date ?? '') || reason !== (detail.deadlineOverride?.reason ?? '');

  const submit = async (value: string | null) => {
    if (value) { lf.bam(); if (loi.length) return; }
    setBusy(true); setLoiMay(null);
    try {
      await api.post(`/attempts/${detail.id}/deadline`, { deadline: value, reason });
      invalidate('/attempts'); invalidate('/tong-quan');
      onDone(); onClose();
      toast.push('ok', value ? t('Đã dời hạn chấm cả đợt tới {fmtDate}', { fmtDate: fmtDate(value) }) : t('Đã quay lại hạn mặc định'));
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={ten} hocVien={detail.student.name} lop={detail.classCode} onDong={onClose}
      chan={{
        daSua: daSua, huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        dongTren: loiMay ? <p className="m-0 px-4 pt-2 text-xs font-semibold text-bad" role="alert">{loiMay}</p> : undefined,
        phu: detail.deadlineOverride && (
          <button className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => submit(null)}>{t('Dùng lại hạn mặc định')}</button>
        ),
        chinh: (
          <button className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !date} onClick={() => submit(date)}>
            {busy ? t('Đang lưu…') : ten}
          </button>
        ),
      }}>
      <div className="space-y-3 pt-3">
        <label className="block" title={t('Hạn mặc định tính riêng cho từng môn: hết thứ Tư của tuần kế tiếp sau tuần Test môn đó. Hạn đặt ở đây áp cho CẢ ĐỢT; chỉ một môn thì dùng "{x}" ở dòng môn đó. Hết ngày hạn mới tính quá hạn.', { x: CHU_THAO_TAC['doi-han'] })}>
          <span className="label">{t('Hạn chấm mới')}</span>
          <ONgay kieu="ngay" value={date} onChange={setDate} />
        </label>
        <Truong nhan={t('Lý do')} tuyChon loi={lf.loiCua(loi, 'ly-do')}>
          <input className="field" {...lf.o(loi, 'ly-do')} value={reason ?? ''} onChange={(e) => setReason(e.target.value)}
            placeholder={t('Ví dụ: giáo viên Writing nghỉ phép')} />
        </Truong>
      </div>
    </KhungPanel>
  );
}

/**
 * XỬ LÝ VẮNG MỘT BUỔI THI (mục 10.6).
 *
 * Form này cố tình KHÔNG cho chọn tuần. Luật nói rõ: lần đầu dời đúng TUẦN KẾ TIẾP của lịch
 * đang có. Bày một ô chọn tuần ra đây là mời người dùng làm đúng cái việc mà luật cấm — và
 * một GVCN xử lý muộn ba tuần sẽ chọn tuần hiện tại, âm thầm cho em thêm hai tuần.
 *
 * Buổi R/L/W là MỘT lần vắng của nhiều kỹ năng, nên tick được nhiều môn. Nhưng máy chủ vẫn
 * xét TỪNG MÔN riêng: môn đã dời một lần thì đi xin duyệt, môn chưa dời thì đổi được ngay.
 */
function AbsenceMoveModal({ row, detail, onClose, onDone }: {
  row: SkillRow; detail: Detail; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [picked, setPicked] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any[] | null>(null);
  const [loiMay, setLoiMay] = useState<string | null>(null);

  /* Các môn khác cũng đang mang dấu vắng — nhiều khả năng là cùng một buổi. */
  const alsoAbsent = detail.skillSchedule.filter(
    (r) => r.required && !r.scored && r.sitStatus === 'absent' && !r.pendingMove && r.skill !== row?.skill,
  );
  const skills = [row?.skill, ...picked].filter(Boolean) as string[];

  const close = () => { setPicked([]); setReason(''); setResult(null); onClose(); };

  const submit = async () => {
    setBusy(true); setLoiMay(null);
    try {
      const res: any = await api.post(`/attempts/${detail.id}/absence-move`, {
        skills, reason,
        /* Bấm hai lần hay mạng chập không được thành hai lần dời. */
        idempotencyKey: `${detail.id}:${skills.join('+')}:${reason}`,
      });
      invalidate('/attempts'); invalidate('/tong-quan'); invalidate('/classes'); invalidate('/my-work');
      onDone();
      setResult(res.outcomes ?? []);
      toast.push('ok', t('Đã xử lý việc vắng'));
    } catch (e: any) { setLoiMay(e.message); }
    finally { setBusy(false); }
  };
  const daSua = !result && (picked.length > 0 || reason !== '');

  return (
    <KhungPanel tieuDe={t('Xử lý vắng · {label}', { label: row.label })} hocVien={detail.student.name} lop={detail.classCode} onDong={close}
      chan={{
        daSua: daSua, huy: { onClick: close, disabled: busy },
        dongTren: loiMay ? <p className="m-0 px-4 pt-2 text-xs font-semibold text-bad" role="alert">{loiMay}</p> : undefined,
        chinh: result ? undefined : (
          <button className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={submit}>
            {busy ? t('Đang xử lý…') : t('Xếp lại bài vắng')}
          </button>
        ),
      }}>
      {result ? (
        <div className="space-y-2 pt-3">
          {result.map((o: any) => (
            <p key={o.skill} className={`text-sm m-0 ${o.result === 'moved' ? 'text-slate-200' : 'text-amber-200'}`}>
              {o.message}
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-3 pt-3">
          <p className="text-xs text-slate-400 m-0">
            {t('{label} đang xếp', { label: row?.label })}{' '}{tuanLich(row?.weekStart, homNay)}{' '}{t('({weekRange}), đã xác nhận vắng.', { weekRange: row?.weekRange })}
            {(row?.absenceMoveCount ?? 0) > 0 && t(' Môn này đã dời do vắng {x} lần.', { x: row?.absenceMoveCount })}
          </p>

          {alsoAbsent.length > 0 && (
            <div>
              <span className="label">{t('Cùng buổi Test này còn môn nào vắng?')}</span>
              <div className="space-y-1 mt-1">
                {alsoAbsent.map((r) => (
                  <label key={r.skill} className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={picked.includes(r.skill)}
                      onChange={(e) => setPicked(
                        e.target.checked ? [...picked, r.skill] : picked.filter((x) => x !== r.skill),
                      )} />
                    <span>{dich(r.label)} <span className="text-slate-500 text-xs">({tuanLich(r.weekStart, homNay)})</span></span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-0">
                {t('Tick các môn làm bài CÙNG buổi. Mỗi môn vẫn được xét riêng: môn đã dời một lần thì phải xin Quản lý duyệt, môn chưa dời lần nào thì đổi được ngay.')}
              </p>
            </div>
          )}

          <Truong nhan={t('Lý do')} tuyChon>
            <input className="field" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)}
              placeholder={t('Ví dụ: em ốm, gia đình đã báo trước')} />
          </Truong>

          <SectionNote>
            {(row?.absenceMoveCount ?? 0) === 0 ? (
              <>
                {t('Đây là')}{' '}<strong>{t('lần dời thứ nhất')}</strong>{t(': lịch chuyển sang đúng tuần kế tiếp của lịch đang có — không chọn tuỳ ý, và không lấy tuần hiện tại để nhảy nhiều tuần khi xử lý muộn.')}
              </>
            ) : (
              <>
                {t('Môn này đã dời do vắng rồi, nên lần này là')}{' '}<strong>{t('đề nghị cần Quản lý duyệt')}</strong>{t('. Lịch giữ nguyên cho tới khi có quyết định. Quản lý phải trả lời TRƯỚC khi tuần mới bắt đầu; từ chối hoặc hết hạn thì kỹ năng bị huỷ và chỉ Quản lý mới khôi phục được.')}
              </>
            )}
          </SectionNote>
        </div>
      )}
    </KhungPanel>
  );
}

/**
 * QUẢN LÝ TRẢ LỜI MỘT ĐỀ NGHỊ DỜI DO VẮNG (#117, PR-XLMT): dùng ĐÚNG thẻ Lịch thi của hộp Chờ duyệt (`TheYeuCau`) — một chỗ quyết,
 * một bộ chữ hệ quả (từ chối = huỷ phần thi), không dựng hộp thứ hai. Thẻ đã được xử lý nơi khác → nói rõ và làm mới.
 */
function TraLoiDeNghiModal({ row, detail, onClose, onDone }: {
  row: SkillRow; detail: Detail; onClose: () => void; onDone: () => void;
}) {
  const ds = useApi<{ the: TheYeuCauDto[] }>(`/yeu-cau?studentId=${detail.student.id}&phanLoai=lich-thi`);
  const the = ds.data?.the.find((y) => y.loai === 'lich_thi' && y.doiTuongId === row.pendingMove?.id) ?? null;
  const xong = () => {
    invalidate('/attempts'); invalidate('/tong-quan'); invalidate('/classes'); invalidate('/my-work'); invalidate('/yeu-cau');
    onDone(); onClose();
  };
  return (
    <KhungPanel tieuDe={`${CHU_THAO_TAC['tra-loi-de-nghi']} · ${dich(row.label)}`} hocVien={detail.student.name} lop={detail.classCode}
      onDong={onClose} chan={{ huy: { nhan: t('Đóng'), onClick: onClose } }}>
      <div className="pt-3">
      {ds.loading ? <Skeleton rows={3} />
        : ds.error ? <ErrorState message={ds.error.message} onRetry={ds.reload} />
          : the ? <TheYeuCau yc={the} gon onXong={xong} />
            : (
              <div className="space-y-2">
                <p className="m-0 text-sm text-slate-300">{t('Đề nghị đã được xử lý.')}</p>
                <button type="button" className="btn btn-sm" onClick={xong}>{t('Làm mới')}</button>
              </div>
            )}
      </div>
    </KhungPanel>
  );
}
