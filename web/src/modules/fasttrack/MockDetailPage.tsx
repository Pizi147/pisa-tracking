import { useEffect, useRef, useState } from 'react';
import { cuonOnDinh } from '../../lib/cuonOnDinh.ts';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, ExamPlanText, Info as Tag, SectionNote, Skeleton, Status, TargetText } from '../../ui/ui.tsx';
import { OMt } from '../../ui/OMt.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import type { ExamPlan } from '../../../../shared/domain/index.ts';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { Menu, type MenuItem } from '../../ui/Menu.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { HopThaoTacMt } from './HopThaoTacMt.tsx';
import { HopKyNang } from '../test/keHoach/HopKyNang.tsx';
import { DongThoiGianLuot } from './DongThoiGianLuot.tsx';
import {
  DeadlinePill, KHOA_HOAN_TAT_HINT, coDiemChinhThuc, lockedByNoShow, useSaveScore, type Cell, type SavePatch,
} from './ScoreEntry.tsx';
import { DaiODiemLon, type LichKn } from './ODiemLon.tsx';
import { nguCanhChiTiet } from './HopNhapDiem.tsx';
import { NhomTaiCho, NhomTinh, ONhanXet } from './NhanXet.tsx';
import { NutGvCham, gvChamPayload, gvChamThanhChon } from '../cham/GvCham.tsx';
import {
  attemptHref, attemptStatusLabel, fmtBand, fmtDate, progressLabel, skillLabel,
} from '../../lib/format.ts';
import {
  ATTEMPT_KIND_SHORT, canNhomNguyenNhan, CHU_THAO_TAC, chipSosMt0, mondayOfDate, nhanLuot, thaoTacKyNang, trangThaiTT, tuanLich,
  type AssessedSkill, type AttemptKind, type LoiTruong, type TheYeuCauDto, type ThaoTac,
  docKnMock, hangCanHoTro, vaiXemHocVien, KY_NANG_KE_HOACH, type HangKyNang, type KyNangKH, khongDuThiTuO, oKyNangTuLich, type KetQuaHuy, type OMtVao, trangCha,
} from '@shared/domain/index.ts';
import { DuongVe } from '../../ui/ThanhTruocSau.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { TOOLTIP_TUAN_HOAN_TAT } from '../../ui/chu.ts';
import { HopKhoiPhucKetQua, HopKhoiPhucMt } from '../test/keHoach/HopKhoiPhucKetQua.tsx';
import type { KnO } from '../test/keHoach/kieu.ts';
import { DongCase, LUOI, LUOI_DOC, type CaseCua } from '../classes/BangCanHoTro.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useSession } from '../../lib/session.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { LichSuThayDoi } from '../../ui/LichSuThayDoi.tsx';

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
  history: any[];
  /** Điểm: ai sửa, trước → sau (PR-I). */
  scoreHistory: ScoreHistoryRow[];
  /** PR-MT (T34): MT lịch sử — nhập bù, không tính hạn, không luồng vắng. */
  lichSu: boolean;
  /** T2 (PR-MTa): kết quả đã huỷ do dời vượt, còn khôi phục được. */
  ketQuaHuy?: KetQuaHuy | null;
  /** OV-12d: Case sinh từ lượt + Case trượt lại ở lượt — null = không có khối (GV chấm chéo, Admin). */
  caseLuot: CaseCua[] | null;
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
 * Bốn cột làm việc — một dòng mỗi bài nhập. Điểm đã lên dải ô lớn (PR-HSM), bảng chỉ còn lịch · tình trạng · thao tác. Dưới
 * `md` mỗi bài là một thẻ xếp dọc, không có cột.
 */
const ROW_GRID = 'md:grid md:grid-cols-[6.5rem_minmax(13rem,1fr)_minmax(14rem,1.2fr)_11rem] md:gap-x-3';

export default function MockDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<Detail>(id ? `/attempts/${id}` : null);
  const { save } = useSaveScore(Number(id), reload, data?.student.name);
  const { homNay } = useNgayNghiepVu();
  /* R15 — các đợt của CHÍNH học viên này, để chuyển đợt ngay trên trang (không phải quay lại hồ sơ). */
  const dsDot = useApi<{ rows: DotCuaHv[] }>(data ? `/attempts?studentId=${data.student.id}` : null);
  /* PR-HOP1: dời lịch (cả đợt hoặc một kỹ năng) = hộp một đợt `HopKyNang` như Kế hoạch Test — một đường lưu `/ke-hoach-test/dot`. */
  const [hopLich, setHopLich] = useState<{ anchor: HTMLElement; k: KyNangKH | null } | null>(null);
  const nutChinhLich = useRef<HTMLSpanElement>(null);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [khoiPhucOpen, setKhoiPhucOpen] = useState(false);
  const [khoiPhucLuot, setKhoiPhucLuot] = useState(false);
  /* PR-HSM: ô lớn đang mở khung sửa — nút chính "Nhập điểm / Sửa điểm" của bảng dưới cũng mở đúng ô này. */
  const [moO, setMoO] = useState<string | null>(null);
  /*
   * G5 / E.4 (PR-VAI-b): `?kn=` — "MT2 · Speaking" ở hồ sơ HV mở thẳng ô Speaking + cuộn tới dải điểm, một lần khi dữ liệu có (như hồ sơ HV R7).
   * Đợt không có ô kỹ năng đó → không cuộn, không lỗi.
   */
  const [thamSo] = useSearchParams();
  const knUrl = docKnMock(thamSo.get('kn'));
  useEffect(() => {
    if (!data || !knUrl) return undefined;
    if (!data.cells.some((c) => (c.skill === 'writing1' || c.skill === 'writing2' ? 'writing' : c.skill) === knUrl)) return undefined;
    setMoO(knUrl === 'writing' ? 'writing1' : knUrl);
    return cuonOnDinh(() => document.getElementById('dai-diem'), null);
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
    return <Navigate to={attemptHref({ id: data.id, kind: data.kind, classId: data.classId })} replace />;
  }

  const d = data;
  const cancelled = d.status === 'cancelled';
  /* OV-11e (TE-12): lượt chưa tới tuần (chưa kỹ năng nào tới tuần thi) thì không có "Nhập điểm" — lưới tuần đó chưa mở. */
  const daToiTuan = [d.period?.weekStart, ...d.skillSchedule.map((r) => r.weekStart)].some((w) => !!w && w.slice(0, 10) <= mondayOfDate(homNay));
  /** PR-MT0: kết luận MT0 đủ điểm — chip SOS hiển thị, hoặc `MT0 ✓` (cùng chữ Chuyển tiếp lớp, lưới Nhập điểm). */
  const ketQuaMt0 = d.mt0 && d.result.complete
    ? (d.mt0.sos.length ? <>{d.mt0.sos.map((x) => <Nhan key={x.skill} tone="bad">{chipSosMt0(x)}</Nhan>)}</> : <Nhan tone="ok">MT0 ✓</Nhan>)
    : null;
  /* Ô MT đầu trang (không bấm): cùng luật `oMt` với lưới và bảng Lộ trình. */
  const omtDau: OMtVao = {
    so: d.attemptNo, attemptId: d.id, cu: d.lichSu,
    kn: Object.fromEntries(d.skillSchedule.filter((r) => (KY_NANG_KE_HOACH as readonly string[]).includes(r.skill)).map((r) => [r.skill, oKyNangTuLich(r, khongDuThiTuO(d.cells, r.skill))])),
  };
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

  const openHistory = () => document.getElementById('lich-su')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
  const dong2 = [
    d.period ? `${tuanLich(d.period.weekStart, homNay)} · ${d.period.range}` : t('Chưa chốt tuần'),
    d.classCode, d.cycle.route ? t('Lộ trình {route}', { route: d.cycle.route }) : null, d.lichSu ? t('Nhập bù, không tính hạn') : null,
  ].filter(Boolean).join(' · ');
  const moODiem = (k: string) => { setMoO(k); document.getElementById('dai-diem')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

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

      {/* A. ĐẦU TRANG — ai · đợt nào · kết luận gì, trong ba dòng. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <DuongVe cha={trangCha('mt', { studentId: d.student.id, tenHv: d.student.name })} ten={`MT${d.attemptNo} · ${d.student.name}`} chiTiet={d.classCode} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-lg font-semibold text-slate-100 min-w-0 break-words">
              <span className="mr-2 text-sm font-medium text-slate-400">{t('Hồ sơ Mock Test ·')}</span>{d.student.name}
              <span className="ml-2 align-middle"><OMt v={omtDau} homNay={homNay} /></span>
            </h1>
            {cancelled && <Tag>{t('Đã huỷ')}</Tag>}
            {coKhoa && !cancelled && <Tag title={KHOA_HOAN_TAT_HINT}>{t('Đủ điểm')}</Tag>}
            {laRf && <span className="text-xs text-slate-400" title={t('Lộ trình RF — kỳ vọng mọi MT bằng Target.')}>RF</span>}
            <ChonDot hienTai={d.id} ds={dsDot.data?.rows ?? []} homNay={homNay} onChon={(r) => navigate(attemptHref(r), { replace: true })} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 m-0" title={d.branchName ? t('Lớp lúc đánh giá: {x} · {branchName}', { x: d.classCode ?? '—', branchName: d.branchName }) : undefined}>
            {dong2}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn min-h-[44px] no-underline sm:min-h-0" to={`/hoc-vien/${d.student.id}`}>{t('Hồ sơ học viên')}</Link>
          {d.classId && d.viewer.editableSkills.length > 0 && daToiTuan && (
            /* R16 — mở lưới cả lớp đúng TUẦN của đợt đang xem, không phải tuần hôm nay. */
            <Link className="btn min-h-[44px] no-underline sm:min-h-0"
              to={d.mt0 ? `/nhap-diem/${d.classId}?kind=mt0${d.period ? `&periodId=${d.period.id}` : ''}`
                : `/nhap-diem/${d.classId}${d.period ? `?periodId=${d.period.id}` : ''}`}>
              {t('Nhập điểm')}
            </Link>
          )}
          <span ref={nutChinhLich} className="inline-flex"><Menu label={t('Chỉnh lịch')} items={headerItems} className="btn min-h-[44px] sm:min-h-0" /></span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* Rà #119: `sosLevel` (chặn trần 3) — `failedCount` 4 môn từng ra "SOS 4". */}
        {/* PR-MT0 (planning 07/10): MT0 không có kỳ vọng — đủ điểm thì chỉ `MT0 ✓` / chip SOS, không câu "chưa có kỳ vọng". */}
        {ketQuaMt0 ?? <KetQuaDot coDiem={d.result.scoredRequired} yeuCau={d.result.required.length} dat={passed}
          sos={d.result.sosLevel ?? null} chot={d.result.chot} kckDuoi={d.result.kckDuoi} />}
        {d.mt0 ? (!ketQuaMt0 && d.mt0.sos.map((x) => <Nhan key={x.skill} tone="bad">{chipSosMt0(x)}</Nhan>)) : (
          <span className="text-sm text-slate-400 tabular-nums">
            {t('Kỳ vọng')}{' '}{fmtBand(d.result.expectation)}{laRf && d.result.expectation !== null ? ' = Target' : ''}
          </span>
        )}
        {d.deadlineOverride && (
          <Tag title={d.deadlineOverride.reason ?? undefined}>
            {t('Hạn chấm cả đợt')}{' '}{fmtDate(d.deadlineOverride.date)}{d.deadlineOverride.by ? ` · ${d.deadlineOverride.by}` : ''}
          </Tag>
        )}
      </div>

      {/* B. NĂM Ô ĐIỂM LỚN — tầng 1 của màn; bấm ô là sửa tại chỗ (YC-13.7, YC-13.8). */}
      <div id="dai-diem" className="scroll-mt-4">
        <DaiODiemLon cells={d.cells} lich={d.skillSchedule as LichKn[]} result={d.result} lichSu={d.lichSu} homNay={homNay} ketLuanOverall={ketQuaMt0}
          mo={moO} onMo={setMoO} save={save} nguCanh={nguCanhChiTiet(d)} />
      </div>

      {/* C. NHẬN XÉT 4 kỹ năng (YC-13.5, OV-4b) — không bắt buộc, không phải điểm. */}
      <KhoiNhanXet cells={d.cells} save={save} phuTrach={d.phuTrachS ? luuPhuTrach : null} />

      <details className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        <summary className="cursor-pointer text-sm text-slate-300 max-sm:py-2.5 max-sm:-my-2.5">{t('Thông tin đợt Mock Test')}</summary>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4 m-0 mt-3">
          <Info label={t('Trạng thái')}>
            <Status kind={d.status === 'done' ? 'done' : cancelled ? 'idle' : 'doing'}>
              {nhanLuot(d.status, d.result.scoredRequired, d.result.required.length)}
            </Status>
          </Info>
          <Info label={t('Tuần dự kiến hoàn tất')}
            title={TOOLTIP_TUAN_HOAN_TAT}>
            {d.period
              ? <>{tuanLich(d.period.weekStart, homNay)} <span className="text-slate-500 text-xs">({d.period.range})</span></>
              : <Tag pending>{t('Chưa chốt tuần')}</Tag>}
          </Info>
          <Info label={t('Dự kiến thi')}><ExamPlanText plan={d.cycle.examPlan} /></Info>
          <Info label={t('Target tại thời điểm đánh giá')}>
            <TargetText band={d.targetAtAttempt} kck={d.cycle.khongCamKet} />
          </Info>
          {d.studyWeekHint && (
            <Info label={t('Mốc gợi ý')} title={t('Tuần học của chương trình và mã tuần lịch là hai khái niệm khác nhau.')}>
              {t('Tuần học {studyWeekHint}', { studyWeekHint: d.studyWeekHint })}
            </Info>
          )}
        </dl>
      </details>

      {/* D. LỊCH KIỂM TRA — MỘT bảng làm việc: lịch, tình trạng, thao tác từng bài (điểm đã ở dải trên). */}
      <SkillWorkTable d={d} onMoDiem={moODiem} onDone={reload} onOpenHistory={openHistory} onDoiLich={(anchor, k) => setHopLich({ anchor, k })} />

      {/* D2. CASE & PHƯƠNG ÁN (OV-12d, Rulebook 17.5 sửa 14/10) — lượt có Case mới hiện; làm việc tại chỗ qua Ngăn Case. */}
      <KhoiCaseLuot d={d} onDoi={reload} />

      {/* E. LỊCH SỬ THAY ĐỔI — thu gọn cuối trang. */}
      <HistoryCard d={d} />

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

/**
 * R15 — CHỌN ĐỢT KHÁC của cùng học viên, cạnh tiêu đề. Nhãn `MT{n} · W3 SEP` (Mock Test) hoặc `Giữa khoá · W3 SEP` /
 * `Cuối khoá · W3 SEP` (lớp thường); đi bằng `attemptHref` nên bài lớp thường mở đúng lưới lớp thường. Đợt đang xem chọn
 * sẵn; chỉ có một đợt thì không hiện.
 */
function ChonDot({ hienTai, ds, homNay, onChon }: {
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

/**
 * OV-12d: khối "Case & phương án" — Case của lượt (+ Case trượt lại ở lượt, "lặp từ MTn"), một dòng `DongCase` như tab Cần hỗ trợ: Kỹ năng · Case
 * (nguyên nhân, trạng thái) · PA đang làm · Việc tiếp + hạn. Bấm tên Case / việc → Ngăn Case tại chỗ, đóng xong tải lại hồ sơ. TVV / CX: chỉ đọc.
 */
function KhoiCaseLuot({ d, onDoi }: { d: Detail; onDoi: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const chiDoc = !!vaiXemHocVien(useSession().session?.roles);
  const dienThoai = useDienThoai();
  const [ngan, setNgan] = useState<{ caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa' } | null>(null);
  if (!d.caseLuot?.length) return null;
  const hang = hangCanHoTro({ ct: 'FT', cases: d.caseLuot }).filter((h): h is HangKyNang<CaseCua> => h.kind === 'hang' && h.cases.length > 0);
  const luoi = chiDoc ? LUOI_DOC : LUOI;
  return (
    <Card title={t('Case & phương án')} bodyClass="p-0" action={<span className="text-xs tabular-nums text-slate-400">{d.caseLuot.length} Case</span>}>
      <div className={`hidden px-3 pt-2 text-[12px] font-semibold  text-slate-500 ${luoi}`}>
        <span>{t('Kỹ năng')}</span><span>Case</span><span>{t('PA đang làm')}</span>{!chiDoc && <span>{t('Việc tiếp · hạn')}</span>}
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
        {hang.flatMap((h) => h.cases.map((c, i) => (
          <DongCase key={c.id} h={h} c={c} dau={i === 0} ct="FT" homNay={homNay} the={dienThoai} chiDoc={chiDoc}
            onMo={(viec, paId) => setNgan({ caseId: c.id, viec, paId })} />
        )))}
      </div>
      {ngan && (
        <NganCase caseId={ngan.caseId} paId={ngan.paId} viec={ngan.viec} hocVien={d.student.name} lop={d.classCode}
          onClose={() => { setNgan(null); onDoi(); }} onChanged={onDoi} />
      )}
    </Card>
  );
}

function Info({ label, title, children }: { label: string; title?: string; children: React.ReactNode }) {
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
      khoa: r.sitStatus === 'cancelled' ? 'đã huỷ phần thi' : coDiem ? 'đã có điểm' : r.sitStatus === 'sat' ? 'đã thi' : null,
      ...(bands.length ? { diem: bands.map((b) => b.toFixed(1)).join(' / ') } : {}),
    };
  }
  return kn;
}

/**
 * KHỐI NHẬN XÉT (PR-HSM, YC-13.5, Q1; OV-4b: thêm Listening · Reading). Nằm ở: Test › một lượt MT → ngay dưới dải ô điểm lớn.
 *
 * "Nhận xét Writing" có HAI phần Task 1 · Task 2 (hai task có thể hai GV — K4-31), mỗi phần ghi người nhập điểm của bài đó;
 * "Nhận xét Speaking" kèm GV chấm (đổi là lưu ngay). Người sửa được bài đó (`cell.canEdit`) gõ tại chỗ, lưu khi rời ô; người
 * khác đọc chữ thường, phần rỗng thì ẩn. Cả khối rỗng mà không ai sửa được → không vẽ.
 * OV-12b (mockup ov12-1 §4): ô MT có điểm → "*", xoá / dưới 10 ký tự không lưu; ô dưới kỳ vọng → chip "Nhóm nguyên nhân *" ngay dưới
 * nhận xét (bấm là lưu, chip cuối không bỏ được); người không sửa được thấy chip tĩnh.
 */
function KhoiNhanXet({ cells, save, phuTrach }: {
  cells: Cell[]; save: (skill: string, patch: SavePatch) => Promise<boolean>;
  /** OV-13k: người xem là GV phụ trách S / GVCN / QL — ghi "Nhận xét GV phụ trách", sửa nhóm ô S (đường riêng). */
  phuTrach: ((body: { nhanXetPhuTrach?: string | null; nhomNguyenNhan?: string[] }) => Promise<boolean>) | null;
}) {
  const toi = useSession().session?.user?.id;
  const o = (k: string) => cells.find((c) => c.skill === k);
  const sua = (c: Cell | undefined): boolean => !!c && c.canEdit && !lockedByNoShow(c);
  const phu = (c: Cell) => (c.enteredByName ? t('Người nhập điểm: {enteredByName}', { enteredByName: c.enteredByName }) : null);
  const batBuoc = (c: Cell) => !!c.batBuocNhanXet && coDiemChinhThuc(c);
  const canNhom = (c: Cell) => batBuoc(c) && canNhomNguyenNhan(c.band, c.kyVong ?? null);
  /** `nhomSua`: chỉ đọc nhận xét người chấm nhưng sửa được nhóm (GV phụ trách S — OV-13k). */
  const phan = (c: Cell | undefined, nhan: string, nhomSua?: (v: string[]) => Promise<boolean>) => {
    if (!c) return null;
    if (sua(c) && !nhomSua) {
      return (
        <div key={c.skill} className="min-w-0 space-y-2.5">
          <ONhanXet nhan={nhan} phu={phu(c)} kyNang={c.skill} giaTri={c.nhanXet ?? null} batBuoc={batBuoc(c)} onLuu={(v) => save(c.skill, { nhanXet: v })} />
          {canNhom(c) && <NhomTaiCho skill={c.skill} giaTri={c.nhomNguyenNhan ?? []} onLuu={(v) => save(c.skill, { nhomNguyenNhan: v })} />}
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
        {c.nhanXet && <p className="m-0 mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{c.nhanXet}</p>}
        {nhomSua && canNhom(c) && <div className="mt-2.5"><NhomTaiCho skill={c.skill} giaTri={c.nhomNguyenNhan ?? []} onLuu={nhomSua} /></div>}
      </div>
    );
  };
  /* OV-4b: Listening · Reading cũng có nhận xét. */
  const lr = (['listening', 'reading'] as const).map((k) => ({ k, nx: phan(o(k), t('Nhận xét')) })).filter((x) => x.nx);
  const w = [phan(o('writing1'), 'Task 1'), phan(o('writing2'), 'Task 2')].filter(Boolean);
  const s = o('speaking');
  /* OV-13k: GV phụ trách xem bài người khác chấm — nhận xét người chấm chỉ đọc (không đè), nhóm sửa qua đường phụ trách. */
  const ptXem = !!phuTrach && !!s && coDiemChinhThuc(s) && (s.gvCham?.userId ?? null) !== toi;
  const nxS = phan(s, t('Nhận xét'), ptXem ? (v) => phuTrach!({ nhomNguyenNhan: v }) : undefined);
  const pt = s?.nhanXetPhuTrach ?? null;
  /* GV phụ trách TỰ chấm: nhận xét của họ là nhận xét người chấm — không có ô thứ hai. */
  const nxPt = !s ? null : ptXem ? (
    <ONhanXet nhan={t('Nhận xét GV phụ trách')} phu={pt?.ten ?? null} giaTri={pt?.chu ?? null} onLuu={(v) => phuTrach!({ nhanXetPhuTrach: v })} />
  ) : pt ? (
    <div className="min-w-0">
      <div className="flex items-baseline gap-2 text-xs text-slate-400">
        <span className="shrink-0 whitespace-nowrap font-medium text-slate-300">{t('Nhận xét GV phụ trách')}</span>{pt.ten && <span className="truncate text-slate-500">{pt.ten}</span>}
      </div>
      <p className="m-0 mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{pt.chu}</p>
    </div>
  ) : null;
  const coS = !!s && (sua(s) || !!s.nhanXet || !!s.gvCham);
  if (!lr.length && !w.length && !coS) return null;
  return (
    <Card title={t('Nhận xét')}>
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        {lr.map((x) => (
          <section key={x.k} className="min-w-0 space-y-3">
            <h3 className="m-0 text-sm font-semibold text-slate-200">{t('Nhận xét')}{' '}{x.k === 'listening' ? 'Listening' : 'Reading'}</h3>
            {x.nx}
          </section>
        ))}
        {w.length > 0 && (
          <section className="min-w-0 space-y-3">
            <h3 className="m-0 text-sm font-semibold text-slate-200">{t('Nhận xét Writing')}</h3>
            {w}
          </section>
        )}
        {coS && s && (
          <section className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="m-0 text-sm font-semibold text-slate-200">{t('Nhận xét Speaking')}</h3>
              {sua(s)
                ? <NutGvCham value={gvChamThanhChon(s.gvCham)} goiY={t('Lưu ngay cho bài Speaking này.')}
                  onChange={(v) => void save('speaking', { gvCham: gvChamPayload(v) })} />
                : s.gvCham && coDiemChinhThuc(s) && <span className="text-xs text-slate-400">{t('GV chấm: {ten}', { ten: s.gvCham.ten })}</span>}
            </div>
            {nxS}
            {nxPt}
          </section>
        )}
      </div>
    </Card>
  );
}

/**
 * MỘT BẢNG THAY HAI (MT-P04): mỗi bài nhập (L · R · W1 · W2 · S) là MỘT dòng, bốn cột: Kỹ năng · Lịch kiểm tra · Tình trạng và
 * hạn · Thao tác. PR-HSM: cột Điểm và dòng Writing tổng đã lên dải ô lớn; nút chính "Nhập điểm / Sửa điểm" mở ô lớn tương ứng.
 *
 * THAO TÁC THEO TRẠNG THÁI (PR-XLMT, T38, K4-27): nút chính và menu ⋯ của mỗi dòng lấy từ MỘT nguồn `thaoTacKyNang` — ≤ 1 nút
 * chính + ≤ 3 mục menu, sáu tên T38. Dòng W2 chỉ có nhập/sửa/huỷ điểm của ô W2 (lịch W đặt ở dòng W1). "Lịch sử" không nằm trong
 * menu dòng: nút ở đầu thẻ cuộn tới dòng thời gian của đợt.
 */
function SkillWorkTable({ d, onMoDiem, onDone, onOpenHistory, onDoiLich }: {
  d: Detail; onMoDiem: (k: string) => void; onDone: () => void; onOpenHistory: () => void;
  /** PR-HOP1: "Xếp lịch" / "Dời lịch thi" một kỹ năng → hộp một đợt, dòng kỹ năng đó mở sẵn ô chọn tuần. */
  onDoiLich: (anchor: HTMLElement, k: KyNangKH) => void;
}) {
  const [moveFor, setMoveFor] = useState<SkillRow | null>(null);
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
  const [decideFor, setDecideFor] = useState<SkillRow | null>(null);
  const [hop, setHop] = useState<{ t: ThaoTac; r: SkillRow; c: Cell } | null>(null);
  const { homNay } = useNgayNghiepVu();
  const cancelled = d.status === 'cancelled';

  const order = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
  const cells = [...d.cells].sort((a, b) => order.indexOf(a.skill) - order.indexOf(b.skill));
  const coDiemO = (c: Cell) => c.band !== null || c.rawScore !== null;
  /* LUAT-34: ô "-" MT cũ = Đã huỷ (`da-huy`) — như "Không dự thi" cũ: không hạn; GV đúng ô: nút chính Nhập điểm (gỡ "-" trong hộp). */
  const khongDuThiO = (c: Cell) => (c.noShow?.state === 'khong-du-thi' || c.noShow?.state === 'da-huy') && !c.daChot && !coDiemO(c);

  const renderRow = (c: Cell) => {
    const r = d.skillSchedule.find((x) => x.skill === c.assessedSkill)!;
    /* Writing có HAI dòng nhưng MỘT lịch: thao tác về lịch chỉ đặt ở dòng W1, dòng W2 chỉ nhập/sửa/huỷ điểm ô W2. */
    const ownsSchedule = c.skill !== 'writing2';
    const canScore = !cancelled && r.required && c.canEdit && !lockedByNoShow(c)
      && r.sitStatus !== 'absent' && r.sitStatus !== 'cancelled' && r.progress !== 'cancelled';
    /* OV-11a: "Không dự thi" chưa có điểm → nút chính "Nhập điểm" (không "Sửa điểm"). */
    const hasValue = c.rawScore !== null || c.band !== null || c.criteria.some((v) => v !== null) || (!!c.noShow && !khongDuThiO(c));

    /* LUAT-34 (S13): MT cũ, mọi ô của kỹ năng "Đã huỷ" → Khôi phục / Không mock lại như vắng 2 lần. */
    /* Khôi phục / Giữ huỷ chỉ là việc của Quản lý — GV giữ trạng thái MT cũ (nút Nhập điểm), không kẹt ở dòng không thao tác. */
    const huyCu = d.viewer.canPlanWeek && d.lichSu && d.cells.filter((x) => x.assessedSkill === c.assessedSkill).every((x) => x.noShow?.state === 'da-huy');
    const tt = trangThaiTT({
      batBuoc: r.required, tuanBatDau: r.weekStart, coDiem: coDiemO(c), sit: r.sitStatus, choDuyet: !!r.pendingMove, lichSu: d.lichSu, homNay, huyVang: !!r.huyVang, huyCu,
    });
    const tat = cancelled ? { chinh: null, menu: [] as ThaoTac[] }
      : thaoTacKyNang(tt, { nhapDiem: c.canEdit, quanLy: d.viewer.canPlanWeek, gvcn: d.viewer.laGvcn, laFt: true, dotHoanTat: !!c.khoa,
          huy: d.viewer.canSkipSkill, han: d.viewer.canOverrideDeadline, diemHuy: !!c.diemHuy });
    const laDiem = (x: ThaoTac | null) => x === 'nhap-diem' || x === 'sua-diem';
    const chinh0 = ownsSchedule || laDiem(tat.chinh) ? tat.chinh : null;
    /* Nhập/Sửa điểm chỉ khi ô thật sự mở (không bị dấu "-" khoá, không vắng/huỷ). */
    const chinh = laDiem(chinh0) && !canScore ? null : chinh0;
    const menu = ownsSchedule ? tat.menu : tat.menu.filter((x) => x === 'huy-diem' || x === 'khoi-phuc-diem');
    const chay = (t: ThaoTac) => {
      if (laDiem(t)) onMoDiem(c.skill);
      else if (t === 'khoi-phuc-diem') void khoiPhuc(c.skill);
      else if (t === 'xep-lai') setMoveFor(r);
      else if (t === 'tra-loi-de-nghi') setDecideFor(r);
      else if ((t === 'doi-lich' || t === 'dat-lich') && d.classId !== null) onDoiLich(document.getElementById(`kn-${c.skill}`)!, r.skill as KyNangKH);
      else setHop({ t, r, c });
    };
    const nhanChinh = chinh === 'nhap-diem' && hasValue ? CHU_THAO_TAC['sua-diem'] : chinh ? CHU_THAO_TAC[chinh] : '';

    const prog = c.progress === 'scored' ? 'scored' : r.progress;
    /* OV-11a: MỘT dòng trạng thái — Không dự thi (CA3-5) thay "Chờ nhập điểm"; huỷ vì vắng ghi số lần thật, bỏ dòng "Đã dời do vắng" (CA3-3). */
    const khongDuThi = khongDuThiO(c);
    const huy = prog === 'cancelled';
    const nhanTT = khongDuThi ? (c.noShow?.state === 'da-huy' ? t('Đã huỷ · vắng MT cũ') : t('Không dự thi'))
      : huy && r.huyVang ? t('{progressLabel} · vắng {x} lần', { progressLabel: progressLabel('cancelled'), x: r.absenceMoveCount + 1 }) : progressLabel(prog);

    return (
      <div key={c.skill} id={`kn-${c.skill}`}
        className={`${ROW_GRID} grid gap-y-2 border-t px-2 py-3 ${r.required ? '' : 'row-muted'}`}
        style={{ borderColor: 'var(--line)' }} role="row">
        <div role="cell" className="text-slate-200 whitespace-nowrap">
          <span className="font-medium">{skillLabel(c.skill)}</span>
          {ownsSchedule && r.planSource === 'manual' && (
            <span className="text-slate-500 text-xs block">{t('đã xếp riêng')}</span>
          )}
        </div>

        <div role="cell">
          <Label>{t('Lịch Test')}</Label>
          {!r.required ? <span className="text-slate-500 text-xs">—</span>
            : r.periodCode
              ? <>{tuanLich(r.weekStart, homNay)} <span className="text-slate-500 text-xs block sm:inline">({r.weekRange})</span></>
              : <Tag pending>{t('Chưa xếp tuần')}</Tag>}
          {/* K4-30: bài dời do vắng nói rõ dời từ tuần nào. */}
          {r.required && r.doiTu && r.absenceMoveCount > 0 && !huy && (
            <span className="block text-xs text-slate-500">{t('(dời từ {doiTu} · vắng lần {x})', { doiTu: r.doiTu, x: r.absenceMoveCount })}</span>
          )}
        </div>

        <div role="cell" className="space-y-1">
          <Label>{t('Trạng thái và hạn')}</Label>
          {r.required && (
            <Status kind={prog === 'scored' ? 'done'
              /* MT lịch sử: nhập bù, không hạn — xám như việc "không tính hạn", không màu chờ. */
              : khongDuThi || prog === 'skipped' || prog === 'cancelled' || prog === 'not_scheduled' || prog === 'lich_su' ? 'idle'
              : prog === 'due' || prog === 'sat' ? 'doing' : 'waiting'}>
              {nhanTT}
            </Status>
          )}
          {/* Đã có điểm thì chip trạng thái đã nói đủ; hạn chỉ còn nghĩa khi bài còn nợ. */}
          {/* MT lịch sử không có hạn (T34) — chip tình trạng "Nhập bù, không tính hạn" đã nói đủ. */}
          {prog !== 'scored' && !khongDuThi && !(prog === 'cancelled' && c.progress === 'cancelled') && !d.lichSu && <div><DeadlinePill cell={c} /></div>}
          {ownsSchedule && r.absenceMoveCount > 0 && !huy && (
            <div className="text-xs text-amber-200">{t('Đã dời do vắng {x} lần', { x: r.absenceMoveCount })}</div>
          )}
          {/* ĐANG CHỜ AI, ĐẾN NGÀY NÀO: không nói hạn thì người xem không biết còn bao lâu nữa phần thi bị huỷ. */}
          {ownsSchedule && r.pendingMove && (
            <div className="text-xs text-amber-200">
              {t('Đề nghị dời sang')}{' '}{r.pendingMove.toWeek ?? t('tuần kế tiếp')}{' '}{t('(lần {moveNo}) — Quản lý cần trả lời trước', { moveNo: r.pendingMove.moveNo })}{' '}{fmtDate(r.pendingMove.decideBy)}{r.huyVang ? '' : t(', quá hạn thì huỷ phần thi')}.
            </div>
          )}
          {!r.required && r.scopeReason && <div className="text-xs text-slate-500">{r.scopeReason}</div>}
          {r.sitNote && !c.noShow && <div className="text-xs text-slate-500">{r.sitNote}</div>}
        </div>

        <div role="cell" className="flex flex-wrap items-start gap-1.5 md:justify-end">
          {chinh && (
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => chay(chinh)}>{nhanChinh}</button>
          )}
          {!chinh && !ownsSchedule && r.required && !canScore && r.sitStatus === 'absent' && (
            <span className="text-xs text-slate-500">{t('Xử lý ở dòng W1')}</span>
          )}
          {!chinh && c.required && !c.canEdit && !cancelled && (
            <span className="text-xs text-slate-500" title={t('Bạn không được phân công kỹ năng này')}>{t('Chỉ xem')}</span>
          )}
          {/* Không có mục thì giữ chỗ cùng rộng nút ⋯ (w-7) — nút chính các dòng thẳng cột (rà #126). */}
          {menu.length ? (
            <MenuDong nhan={t('Thao tác khác · {skillLabel}', { skillLabel: skillLabel(c.skill) })} muc={menu.map((x) => ({
              key: x, nhan: CHU_THAO_TAC[x], onChon: () => chay(x), nguyHiem: x === 'bo-ky-nang' || x === 'huy-diem' || x === 'khong-mock-lai',
            }))} />
          ) : <span aria-hidden className="inline-block w-7 flex-none" />}
        </div>
      </div>
    );
  };

  /* Huỷ điểm Writing: dòng W1 tích sẵn mọi ô W đang có điểm; dòng W2 chỉ ô W2. */
  const oCoDiemCua = (c: Cell): string[] => (c.assessedSkill !== 'writing' ? [c.skill]
    : c.skill === 'writing2' ? ['writing2']
      : d.cells.filter((x) => x.assessedSkill === 'writing' && coDiemO(x)).map((x) => x.skill));

  return (
    <Card title={t('Lịch Test')}
      action={<div className="flex items-center gap-2">
        {d.splitWeeks && <Tag>{t('Đợt này thi ở nhiều tuần')}</Tag>}
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onOpenHistory}>{t('Lịch sử')}</button>
      </div>}>
      {!d.completionWeek.valid && (
        <p className="text-xs text-amber-200 mt-0 mb-3">
          {t('Chưa có kế hoạch hợp lệ cho tuần dự kiến hoàn tất:')}{' '}{d.completionWeek.blockingLabels.join(', ')}{' '}{t('chưa có tuần thi hoặc đã bị huỷ phần thi. Đợt vẫn chưa đủ kết quả cho tới khi Quản lý xếp lại.')}
        </p>
      )}
      {d.cells.length === 0 ? (
        <Empty title={t('Lớp này chưa cấu hình kỹ năng nào')} />
      ) : (
        <div role="table" aria-label={t('Lịch Test theo kỹ năng')}>
          <div role="row"
            className={`${ROW_GRID} hidden px-2 pb-2 text-[12px] font-semibold  text-slate-500`}>
            <div role="columnheader">{t('Kỹ năng')}</div>
            <div role="columnheader">{t('Lịch Test')}</div>
            <div role="columnheader">{t('Trạng thái và hạn')}</div>
            <div role="columnheader" className="text-right">{t('Thao tác')}</div>
          </div>
          {cells.map(renderRow)}
        </div>
      )}
      {d.result.scopeDetail && (
        <SectionNote>
          {t('{scopeDetail}. Kỹ năng ngoài phạm vi không tính vào mẫu số SOS và không bị coi là thiếu điểm; vì không đủ bốn kỹ năng nên đợt này không có Overall.', { scopeDetail: d.result.scopeDetail })}
        </SectionNote>
      )}
      {d.result.complete && !d.result.evaluable && (
        <SectionNote>{t('Đã đủ điểm nhưng lộ trình chưa có Target, nên chưa tính được kỳ vọng và SOS.')}</SectionNote>
      )}

      {hop && (
        <HopThaoTacMt key={`${hop.t}:${hop.c.skill}`} thaoTac={hop.t} attemptId={d.id} skill={hop.r.skill} ct={null} laThuong={false}
          quanLy={d.viewer.canPlanWeek} row={{ periodId: hop.r.periodId, weekStart: hop.r.weekStart, deadline: hop.r.deadline }}
          oCoDiem={oCoDiemCua(hop.c)} hocVien={d.student.name} lop={d.classCode} onClose={() => setHop(null)} onDone={onDone} />
      )}
      {moveFor && <AbsenceMoveModal row={moveFor} detail={d} onClose={() => setMoveFor(null)} onDone={onDone} />}
      {decideFor && <TraLoiDeNghiModal row={decideFor} detail={d} onClose={() => setDecideFor(null)} onDone={onDone} />}
    </Card>
  );
}

/** Nhãn cột chỉ hiện ở dạng thẻ (điện thoại); từ `md` trở lên đã có hàng tiêu đề. */
function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-0.5 block text-[12px] font-semibold  text-slate-500 md:hidden">{children}</span>;
}

// ---------------------------------------------------------------- lịch sử thay đổi

/** LỊCH SỬ CUỐI TRANG (YC-13.6): lịch, phạm vi và điểm trong MỘT dòng thời gian — nút "Lịch sử" đầu bảng cuộn tới đây. */
function HistoryCard({ d }: { d: Detail }) {
  const [mo, setMo] = useState(false);   // OV-15g: Lịch sử đủ chi tiết của các ô (nhận xét đủ chữ, GV chấm S, lý do)
  return (
    <div id="lich-su">
      <Card title={t('Lịch sử')} action={<button type="button" className="btn btn-ghost btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMo(true)}>{t('Lịch sử')}</button>}>
        {mo && <LichSuThayDoi loai="o" id={d.id} dong2={[d.student.name, `MT${d.attemptNo}`, d.classCode]} onClose={() => setMo(false)} />}
        <DongThoiGianLuot history={d.history} scoreHistory={d.scoreHistory} />
      </Card>
    </div>
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
        <label className="block" title={t('Hạn mặc định tính riêng cho từng môn: hết thứ Tư của tuần kế tiếp sau tuần thi môn đó. Hạn đặt ở đây áp cho CẢ ĐỢT; chỉ một môn thì dùng "{x}" ở dòng môn đó. Hết ngày hạn mới tính quá hạn.', { x: CHU_THAO_TAC['doi-han'] })}>
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
              <span className="label">{t('Cùng buổi thi này còn môn nào vắng?')}</span>
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
                {t('Tick các môn thi CÙNG buổi. Mỗi môn vẫn được xét riêng: môn đã dời một lần thì phải xin Quản lý duyệt, môn chưa dời lần nào thì đổi được ngay.')}
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
                {t('Môn này đã dời do vắng rồi, nên lần này là')}{' '}<strong>{t('đề nghị cần Quản lý duyệt')}</strong>{t('. Lịch giữ nguyên cho tới khi có quyết định. Quản lý phải trả lời TRƯỚC khi tuần mới bắt đầu; từ chối hoặc hết hạn thì phần thi bị huỷ và chỉ Quản lý mới khôi phục được.')}
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
