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
import { HopHuyMt, type HeQuaHuy } from './HopHuyMt.tsx';
import { HopKyNang } from '../test/keHoach/HopKyNang.tsx';
import { DongThoiGianLuot } from './DongThoiGianLuot.tsx';
import {
  DeadlinePill, KHOA_HOAN_TAT_HINT, lockedByNoShow, useSaveScore, type Cell, type SavePatch,
} from './ScoreEntry.tsx';
import { DaiODiemLon, type LichKn } from './ODiemLon.tsx';
import { nguCanhChiTiet } from './HopNhapDiem.tsx';
import { ONhanXet } from './NhanXet.tsx';
import { NutGvCham, gvChamPayload, gvChamThanhChon } from '../cham/GvCham.tsx';
import {
  attemptHref, attemptStatusLabel, fmtBand, fmtDate, progressLabel, skillLabel,
} from '../../lib/format.ts';
import {
  ATTEMPT_KIND_SHORT, maHocVienNgan, CHU_THAO_TAC, chipSosMt0, nhanLuot, thaoTacKyNang, trangThaiTT, tuanLich,
  type AssessedSkill, type AttemptKind, type LoiTruong, type TheYeuCauDto, type ThaoTac,
  docKnMock, KY_NANG_KE_HOACH, type KyNangKH, khongDuThiTuO, oKyNangTuLich, type KetQuaHuy, type OMtVao, trangCha,
} from '@shared/domain/index.ts';
import { DuongVe } from '../../ui/ThanhTruocSau.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { TOOLTIP_TUAN_HOAN_TAT } from '../../ui/chu.ts';
import { HopKhoiPhucKetQua, HopKhoiPhucMt } from '../test/keHoach/HopKhoiPhucKetQua.tsx';
import type { KnO } from '../test/keHoach/kieu.ts';

type Detail = {
  id: number;
  /** `mock` với Fast Track; `progress` / `final` là bài của lớp thường — màn khác hẳn. */
  kind: string;
  student: { id: number; name: string; code: string };
  cycle: { id: number; seq: number; route: string | null; target: number | null; khongCamKet?: boolean; examPlan: ExamPlan };
  classId: number | null; classCode: string | null; branchName: string | null;
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
  viewer: {
    canPlanWeek: boolean; canCancel: boolean; canHandleAbsence: boolean;
    /** PR-XLMT: GVCN của lớp — Báo vắng / Xếp lại bài vắng (`thaoTacKyNang`). */
    laGvcn: boolean;
    canSkipSkill: boolean; canOverrideDeadline: boolean;
    /** Kỹ năng dời lịch/xác nhận thi được — GVCN·GVBM Normal + Quản lý mọi kỹ năng (SCH-01). */
    moveableSkills: string[];
    canEditSos: boolean; editableSkills: string[];
    /** PR-MT (M-12): cách huỷ được phép + hệ quả thật — `null` khi không huỷ được. */
    huyLuot: HeQuaHuy | null;
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
  const [cancelOpen, setCancelOpen] = useState(false);
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
      reload(); toast.push('ok', `Đã đưa lại các kỹ năng vào MT${d.attemptNo}`);
    } catch (e: any) { toast.push('error', e.message); }
  };
  const headerItems: MenuItem[] = [
    ...(d.viewer.canSkipSkill && !cancelled && huyHet ? [{
      label: 'Đưa lại cả 4 kỹ năng', onClick: () => void duaLaiCaLuot(),
      hint: 'Tuần cũ còn hợp lệ thì giữ, không thì về Chưa xếp lịch',
    }] : []),
    ...(d.viewer.canPlanWeek && !cancelled && !huyHet ? [{
      label: `${CHU_THAO_TAC['doi-lich']} cả đợt`, onClick: () => { if (nutChinhLich.current) setHopLich({ anchor: nutChinhLich.current, k: null }); },
      hint: 'Mọi kỹ năng còn dời được sang một tuần',
    }] : []),
    ...(d.viewer.canOverrideDeadline && !cancelled && !d.lichSu ? [{
      label: `${CHU_THAO_TAC['doi-han']} cả đợt`, onClick: () => setDeadlineOpen(true),
      hint: 'Một hạn chấm riêng cho mọi kỹ năng',
    }] : []),
    /* PR-MTb T8 (T2): lượt bị vượt có kết quả đã huỷ → Quản lý khôi phục. */
    ...(d.viewer.canCancel && !cancelled && d.ketQuaHuy ? [{
      label: 'Khôi phục kết quả', onClick: () => setKhoiPhucOpen(true),
    }] : []),
    /* PR-OV4a: số MT đã xếp lại mà còn bản huỷ cũ → hộp nói rõ cách khôi phục (huỷ MT mới trước). */
    ...(d.viewer.canCancel && !cancelled && d.khoiPhuc.ban.length ? [{
      label: `Khôi phục MT${d.attemptNo} cũ`, onClick: () => setKhoiPhucLuot(true),
    }] : []),
    /* PR-MTGON (luật 4): Quản lý huỷ MT{n} mọi lượt, mọi lúc — xếp lại thì vẫn là MT{n}. */
    ...(d.viewer.huyLuot?.cachDuoc && !cancelled ? [{
      label: `Huỷ MT${d.attemptNo}`, danger: true, onClick: () => setCancelOpen(true),
      hint: `Xếp lại thì vẫn là MT${d.attemptNo}`,
    }] : []),
  ];
  const coKhoa = d.cells.some((c) => c.khoa);
  const laRf = d.cycle.route === 'RF';
  const dong2 = [
    d.period ? `${tuanLich(d.period.weekStart, homNay)} · ${d.period.range}` : 'Chưa chốt tuần',
    d.classCode, d.cycle.route ? `Lộ trình ${d.cycle.route}` : null, d.lichSu ? 'Nhập bù, không tính hạn' : null,
  ].filter(Boolean).join(' · ');
  const moODiem = (k: string) => { setMoO(k); document.getElementById('dai-diem')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div className="page space-y-4">
      {/* K4 §4h: lượt đã huỷ — dải mảnh trên cùng nói lý do · ai · ngày, và cách mở lại. Mọi ô lớn khoá (máy chủ `canEdit`). */}
      {cancelled && (
        <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--line-strong)' }}>
          <span className="font-semibold text-slate-100">Đã huỷ</span>
          <span className="min-w-0 break-words text-slate-400">
            {[d.huy?.lyDo ?? d.cancelReason, d.huy?.ai, d.huy ? fmtDate(d.huy.khi) : null].filter(Boolean).join(' · ')}
          </span>
          {d.viewer.canCancel ? (
            <button type="button" className="btn btn-sm min-h-[44px] sm:ml-auto sm:min-h-0" onClick={() => setKhoiPhucLuot(true)}>Khôi phục MT{d.attemptNo}</button>
          ) : <span className="text-xs text-slate-500 sm:ml-auto">Chỉ Quản lý khôi phục được lượt đã huỷ.</span>}
        </div>
      )}

      {/* A. ĐẦU TRANG — ai · đợt nào · kết luận gì, trong ba dòng. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <DuongVe cha={trangCha('mt', { studentId: d.student.id, tenHv: d.student.name })} ten={`MT${d.attemptNo} · ${d.student.name}`} chiTiet={d.classCode} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-lg font-semibold text-slate-100 min-w-0 break-words">
              <span className="mr-2 text-sm font-medium text-slate-400">Hồ sơ Mock Test ·</span>{d.student.name} <span className="text-slate-500 text-sm whitespace-nowrap">· {maHocVienNgan(d.student.code)}</span>
              <span className="ml-2 align-middle"><OMt v={omtDau} homNay={homNay} /></span>
            </h1>
            {cancelled && <Tag>Đã huỷ</Tag>}
            {coKhoa && !cancelled && <Tag title={KHOA_HOAN_TAT_HINT}>Đã hoàn tất</Tag>}
            {laRf && <span className="text-xs text-slate-400" title="Lộ trình RF — kỳ vọng mọi MT bằng Target.">RF</span>}
            <ChonDot hienTai={d.id} ds={dsDot.data?.rows ?? []} homNay={homNay} onChon={(r) => navigate(attemptHref(r), { replace: true })} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 m-0" title={d.branchName ? `Lớp lúc đánh giá: ${d.classCode ?? '—'} · ${d.branchName}` : undefined}>
            {dong2}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn min-h-[44px] no-underline sm:min-h-0" to={`/hoc-vien/${d.student.id}`}>Hồ sơ học viên</Link>
          {d.classId && d.viewer.editableSkills.length > 0 && (
            /* R16 — mở lưới cả lớp đúng TUẦN của đợt đang xem, không phải tuần hôm nay. */
            <Link className="btn min-h-[44px] no-underline sm:min-h-0"
              to={d.mt0 ? `/nhap-diem/${d.classId}?kind=mt0${d.period ? `&periodId=${d.period.id}` : ''}`
                : `/nhap-diem/${d.classId}${d.period ? `?periodId=${d.period.id}` : ''}`}>
              Nhập điểm
            </Link>
          )}
          <span ref={nutChinhLich} className="inline-flex"><Menu label="Chỉnh lịch" items={headerItems} className="btn min-h-[44px] sm:min-h-0" /></span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* Rà #119: `sosLevel` (chặn trần 3) — `failedCount` 4 môn từng ra "SOS 4". */}
        {/* PR-MT0 (planning 07/10): MT0 không có kỳ vọng — đủ điểm thì chỉ `MT0 ✓` / chip SOS, không câu "chưa có kỳ vọng". */}
        {ketQuaMt0 ?? <KetQuaDot coDiem={d.result.scoredRequired} yeuCau={d.result.required.length} dat={passed}
          sos={d.result.sosLevel ?? null} chot={d.result.chot} kckDuoi={d.result.kckDuoi} />}
        {d.mt0 ? (!ketQuaMt0 && d.mt0.sos.map((x) => <Nhan key={x.skill} tone="bad">{chipSosMt0(x)}</Nhan>)) : (
          <span className="text-sm text-slate-400 tabular-nums">
            Kỳ vọng {fmtBand(d.result.expectation)}{laRf && d.result.expectation !== null ? ' = Target' : ''}
          </span>
        )}
        {d.deadlineOverride && (
          <Tag title={d.deadlineOverride.reason ?? undefined}>
            Hạn chấm cả đợt {fmtDate(d.deadlineOverride.date)}{d.deadlineOverride.by ? ` · ${d.deadlineOverride.by}` : ''}
          </Tag>
        )}
      </div>

      {/* B. NĂM Ô ĐIỂM LỚN — tầng 1 của màn; bấm ô là sửa tại chỗ (YC-13.7, YC-13.8). */}
      <div id="dai-diem" className="scroll-mt-4">
        <DaiODiemLon cells={d.cells} lich={d.skillSchedule as LichKn[]} result={d.result} lichSu={d.lichSu} homNay={homNay} ketLuanOverall={ketQuaMt0}
          mo={moO} onMo={setMoO} save={save} nguCanh={nguCanhChiTiet(d)} />
      </div>

      {/* C. NHẬN XÉT 4 kỹ năng (YC-13.5, OV-4b) — không bắt buộc, không phải điểm. */}
      <KhoiNhanXet cells={d.cells} save={save} />

      <details className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        <summary className="cursor-pointer text-sm text-slate-300 max-sm:py-2.5 max-sm:-my-2.5">Thông tin đợt Mock Test</summary>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4 m-0 mt-3">
          <Info label="Trạng thái">
            <Status kind={d.status === 'done' ? 'done' : cancelled ? 'idle' : 'doing'}>
              {nhanLuot(d.status, d.result.scoredRequired, d.result.required.length)}
            </Status>
          </Info>
          <Info label="Tuần dự kiến hoàn tất"
            title={TOOLTIP_TUAN_HOAN_TAT}>
            {d.period
              ? <>{tuanLich(d.period.weekStart, homNay)} <span className="text-slate-500 text-xs">({d.period.range})</span></>
              : <Tag pending>Chưa chốt tuần</Tag>}
          </Info>
          <Info label="Dự kiến thi"><ExamPlanText plan={d.cycle.examPlan} /></Info>
          <Info label="Target tại thời điểm đánh giá">
            <TargetText band={d.targetAtAttempt} kck={d.cycle.khongCamKet} />
          </Info>
          {d.studyWeekHint && (
            <Info label="Mốc gợi ý" title="Tuần học của chương trình và mã tuần lịch là hai khái niệm khác nhau.">
              Tuần học {d.studyWeekHint}
            </Info>
          )}
        </dl>
      </details>

      {/* D. LỊCH KIỂM TRA — MỘT bảng làm việc: lịch, tình trạng, thao tác từng bài (điểm đã ở dải trên). */}
      <SkillWorkTable d={d} onMoDiem={moODiem} onDone={reload} onOpenHistory={openHistory} onDoiLich={(anchor, k) => setHopLich({ anchor, k })} />

      {/* E. LỊCH SỬ THAY ĐỔI — thu gọn cuối trang. Hồ sơ Test không còn khối Case (rule book §17.5). */}
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
      {d.viewer.huyLuot?.cachDuoc && (
        <HopHuyMt open={cancelOpen} onClose={() => setCancelOpen(false)} attemptId={d.id}
          attemptNo={d.attemptNo} heQua={d.viewer.huyLuot} onDone={reload}
          phu={[d.student.name, d.classCode, d.period ? tuanLich(d.period.weekStart, homNay) : null].filter(Boolean).join(' · ')} />
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
    const tuan = r.period ? tuanLich(r.period.weekStart, homNay) : 'chưa chốt tuần';
    return `${ten} · ${tuan}${r.status === 'cancelled' ? ` · ${attemptStatusLabel(r.status)}` : ''}`;
  };
  return (
    <select className="field w-auto max-w-full min-w-44" value={hienTai} aria-label="Chọn đợt khác của học viên này"
      title="Mở đợt khác của cùng học viên"
      onChange={(e) => { const r = xep.find((x) => x.id === Number(e.target.value)); if (r && r.id !== hienTai) onChon(r); }}>
      {xep.map((r) => <option key={r.id} value={r.id}>{nhan(r)}</option>)}
    </select>
  );
}

function Info({ label, title, children }: { label: string; title?: string; children: React.ReactNode }) {
  return (
    <div title={title}>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</dt>
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
 */
function KhoiNhanXet({ cells, save }: { cells: Cell[]; save: (skill: string, patch: SavePatch) => Promise<boolean> }) {
  const o = (k: string) => cells.find((c) => c.skill === k);
  const sua = (c: Cell | undefined): boolean => !!c && c.canEdit && !lockedByNoShow(c);
  const phu = (c: Cell) => (c.enteredByName ? `Người nhập điểm: ${c.enteredByName}` : null);
  const phan = (c: Cell | undefined, nhan: string) => {
    if (!c) return null;
    if (sua(c)) return <ONhanXet key={c.skill} nhan={nhan} phu={phu(c)} giaTri={c.nhanXet ?? null} onLuu={(v) => save(c.skill, { nhanXet: v })} />;
    if (!c.nhanXet) return null;
    return (
      <div key={c.skill} className="min-w-0">
        <div className="flex items-baseline gap-2 text-xs text-slate-400">
          <span className="shrink-0 whitespace-nowrap font-medium text-slate-300">{nhan}</span>{phu(c) && <span className="truncate text-slate-500">{phu(c)}</span>}
        </div>
        <p className="m-0 mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{c.nhanXet}</p>
      </div>
    );
  };
  /* OV-4b: Listening · Reading cũng có nhận xét. */
  const lr = (['listening', 'reading'] as const).map((k) => ({ k, nx: phan(o(k), 'Nhận xét') })).filter((x) => x.nx);
  const w = [phan(o('writing1'), 'Task 1'), phan(o('writing2'), 'Task 2')].filter(Boolean);
  const s = o('speaking');
  const nxS = phan(s, 'Nhận xét');
  const coS = !!s && (sua(s) || !!s.nhanXet || !!s.gvCham);
  if (!lr.length && !w.length && !coS) return null;
  return (
    <Card title="Nhận xét">
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        {lr.map((x) => (
          <section key={x.k} className="min-w-0 space-y-3">
            <h3 className="m-0 text-sm font-semibold text-slate-200">Nhận xét {x.k === 'listening' ? 'Listening' : 'Reading'}</h3>
            {x.nx}
          </section>
        ))}
        {w.length > 0 && (
          <section className="min-w-0 space-y-3">
            <h3 className="m-0 text-sm font-semibold text-slate-200">Nhận xét Writing</h3>
            {w}
          </section>
        )}
        {coS && s && (
          <section className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="m-0 text-sm font-semibold text-slate-200">Nhận xét Speaking</h3>
              {sua(s)
                ? <NutGvCham value={gvChamThanhChon(s.gvCham)} goiY="Lưu ngay cho bài Speaking này."
                  onChange={(v) => void save('speaking', { gvCham: gvChamPayload(v) })} />
                : s.gvCham && <span className="text-xs text-slate-400">GV chấm: {s.gvCham.ten}</span>}
            </div>
            {nxS}
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
  const [decideFor, setDecideFor] = useState<SkillRow | null>(null);
  const [hop, setHop] = useState<{ t: ThaoTac; r: SkillRow; c: Cell } | null>(null);
  const { homNay } = useNgayNghiepVu();
  const cancelled = d.status === 'cancelled';

  const order = ['listening', 'reading', 'writing1', 'writing2', 'speaking'];
  const cells = [...d.cells].sort((a, b) => order.indexOf(a.skill) - order.indexOf(b.skill));
  const coDiemO = (c: Cell) => c.band !== null || c.rawScore !== null;

  const renderRow = (c: Cell) => {
    const r = d.skillSchedule.find((x) => x.skill === c.assessedSkill)!;
    /* Writing có HAI dòng nhưng MỘT lịch: thao tác về lịch chỉ đặt ở dòng W1, dòng W2 chỉ nhập/sửa/huỷ điểm ô W2. */
    const ownsSchedule = c.skill !== 'writing2';
    const canScore = !cancelled && r.required && c.canEdit && !lockedByNoShow(c)
      && r.sitStatus !== 'absent' && r.sitStatus !== 'cancelled' && r.progress !== 'cancelled';
    const hasValue = c.rawScore !== null || c.band !== null || c.criteria.some((v) => v !== null) || !!c.noShow;

    const tt = trangThaiTT({
      batBuoc: r.required, tuanBatDau: r.weekStart, coDiem: coDiemO(c), sit: r.sitStatus, choDuyet: !!r.pendingMove, lichSu: d.lichSu, homNay, huyVang: !!r.huyVang,
    });
    const tat = cancelled ? { chinh: null, menu: [] as ThaoTac[] }
      : thaoTacKyNang(tt, { nhapDiem: c.canEdit, quanLy: d.viewer.canPlanWeek, gvcn: d.viewer.laGvcn, laFt: true, dotHoanTat: !!c.khoa,
          huy: d.viewer.canSkipSkill, han: d.viewer.canOverrideDeadline });
    const laDiem = (x: ThaoTac | null) => x === 'nhap-diem' || x === 'sua-diem';
    const chinh0 = ownsSchedule || laDiem(tat.chinh) ? tat.chinh : null;
    /* Nhập/Sửa điểm chỉ khi ô thật sự mở (không bị dấu "-" khoá, không vắng/huỷ). */
    const chinh = laDiem(chinh0) && !canScore ? null : chinh0;
    const menu = ownsSchedule ? tat.menu : tat.menu.filter((x) => x === 'huy-diem');
    const chay = (t: ThaoTac) => {
      if (laDiem(t)) onMoDiem(c.skill);
      else if (t === 'xep-lai') setMoveFor(r);
      else if (t === 'tra-loi-de-nghi') setDecideFor(r);
      else if ((t === 'doi-lich' || t === 'dat-lich') && d.classId !== null) onDoiLich(document.getElementById(`kn-${c.skill}`)!, r.skill as KyNangKH);
      else setHop({ t, r, c });
    };
    const nhanChinh = chinh === 'nhap-diem' && hasValue ? CHU_THAO_TAC['sua-diem'] : chinh ? CHU_THAO_TAC[chinh] : '';

    const prog = c.progress === 'scored' ? 'scored' : r.progress;
    /* OV-11a: MỘT dòng trạng thái — Không dự thi (CA3-5) thay "Chờ nhập điểm"; huỷ vì vắng ghi số lần thật, bỏ dòng "Đã dời do vắng" (CA3-3). */
    const khongDuThi = c.noShow?.state === 'khong-du-thi' && !c.daChot && !coDiemO(c);
    const huy = prog === 'cancelled';
    const nhanTT = khongDuThi ? 'Không dự thi'
      : huy && r.huyVang ? `${progressLabel('cancelled')} · vắng ${r.absenceMoveCount + 1} lần` : progressLabel(prog);

    return (
      <div key={c.skill} id={`kn-${c.skill}`}
        className={`${ROW_GRID} grid gap-y-2 border-t px-2 py-3 ${r.required ? '' : 'row-muted'}`}
        style={{ borderColor: 'var(--line)' }} role="row">
        <div role="cell" className="text-slate-200 whitespace-nowrap">
          <span className="font-medium">{skillLabel(c.skill)}</span>
          {ownsSchedule && r.planSource === 'manual' && (
            <span className="text-slate-500 text-xs block">đã xếp riêng</span>
          )}
        </div>

        <div role="cell">
          <Label>Lịch Test</Label>
          {!r.required ? <span className="text-slate-500 text-xs">—</span>
            : r.periodCode
              ? <>{tuanLich(r.weekStart, homNay)} <span className="text-slate-500 text-xs block sm:inline">({r.weekRange})</span></>
              : <Tag pending>Chưa xếp tuần</Tag>}
          {/* K4-30: bài dời do vắng nói rõ dời từ tuần nào. */}
          {r.required && r.doiTu && r.absenceMoveCount > 0 && !huy && (
            <span className="block text-xs text-slate-500">(dời từ {r.doiTu} · vắng lần {r.absenceMoveCount})</span>
          )}
        </div>

        <div role="cell" className="space-y-1">
          <Label>Trạng thái và hạn</Label>
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
            <div className="text-xs text-amber-200">Đã dời do vắng {r.absenceMoveCount} lần</div>
          )}
          {/* ĐANG CHỜ AI, ĐẾN NGÀY NÀO: không nói hạn thì người xem không biết còn bao lâu nữa phần thi bị huỷ. */}
          {ownsSchedule && r.pendingMove && (
            <div className="text-xs text-amber-200">
              Đề nghị dời sang {r.pendingMove.toWeek ?? 'tuần kế tiếp'} (lần {r.pendingMove.moveNo}) — Quản lý cần
              trả lời trước {fmtDate(r.pendingMove.decideBy)}{r.huyVang ? '' : ', quá hạn thì huỷ phần thi'}.
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
            <span className="text-xs text-slate-500">Xử lý ở dòng W1</span>
          )}
          {!chinh && c.required && !c.canEdit && !cancelled && (
            <span className="text-xs text-slate-500" title={c.khoa ? KHOA_HOAN_TAT_HINT : 'Bạn không được phân công kỹ năng này'}>Chỉ xem</span>
          )}
          {/* Không có mục thì giữ chỗ cùng rộng nút ⋯ (w-7) — nút chính các dòng thẳng cột (rà #126). */}
          {menu.length ? (
            <MenuDong nhan={`Thao tác khác · ${skillLabel(c.skill)}`} muc={menu.map((x) => ({
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
    <Card title="Lịch Test"
      action={<div className="flex items-center gap-2">
        {d.splitWeeks && <Tag>Đợt này thi ở nhiều tuần</Tag>}
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onOpenHistory}>Lịch sử</button>
      </div>}>
      {!d.completionWeek.valid && (
        <p className="text-xs text-amber-200 mt-0 mb-3">
          Chưa có kế hoạch hợp lệ cho tuần dự kiến hoàn tất: {d.completionWeek.blockingLabels.join(', ')} chưa có tuần thi
          hoặc đã bị huỷ phần thi. Đợt vẫn chưa đủ kết quả cho tới khi Quản lý xếp lại.
        </p>
      )}
      {d.cells.length === 0 ? (
        <Empty title="Lớp này chưa cấu hình kỹ năng nào" />
      ) : (
        <div role="table" aria-label="Lịch Test theo kỹ năng">
          <div role="row"
            className={`${ROW_GRID} hidden px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500`}>
            <div role="columnheader">Kỹ năng</div>
            <div role="columnheader">Lịch Test</div>
            <div role="columnheader">Trạng thái và hạn</div>
            <div role="columnheader" className="text-right">Thao tác</div>
          </div>
          {cells.map(renderRow)}
        </div>
      )}
      {d.result.scopeDetail && (
        <SectionNote>
          {d.result.scopeDetail}. Kỹ năng ngoài phạm vi không tính vào mẫu số SOS và không bị coi là thiếu điểm; vì
          không đủ bốn kỹ năng nên đợt này không có Overall.
        </SectionNote>
      )}
      {d.result.complete && !d.result.evaluable && (
        <SectionNote>Đã đủ điểm nhưng lộ trình chưa có Target, nên chưa tính được kỳ vọng và SOS.</SectionNote>
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
  return <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:hidden">{children}</span>;
}

// ---------------------------------------------------------------- lịch sử thay đổi

/** LỊCH SỬ CUỐI TRANG (YC-13.6): lịch, phạm vi và điểm trong MỘT dòng thời gian — nút "Lịch sử" đầu bảng cuộn tới đây. */
function HistoryCard({ d }: { d: Detail }) {
  return (
    <div id="lich-su">
      <Card title="Lịch sử">
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
  const ten = `${CHU_THAO_TAC['doi-han']} cả đợt`;
  const loi: LoiTruong[] = [];   // T7 (PR-MTa): dời hạn chấm — lý do tuỳ chọn
  const daSua = date !== (detail.deadlineOverride?.date ?? '') || reason !== (detail.deadlineOverride?.reason ?? '');

  const submit = async (value: string | null) => {
    if (value) { lf.bam(); if (loi.length) return; }
    setBusy(true); setLoiMay(null);
    try {
      await api.post(`/attempts/${detail.id}/deadline`, { deadline: value, reason });
      invalidate('/attempts'); invalidate('/tong-quan');
      onDone(); onClose();
      toast.push('ok', value ? `Đã dời hạn chấm cả đợt tới ${fmtDate(value)}` : 'Đã quay lại hạn mặc định');
    } catch (e: any) { setLoiMay(e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={ten} hocVien={detail.student.name} lop={detail.classCode} onDong={onClose}
      chan={{
        daSua: daSua, huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        dongTren: loiMay ? <p className="m-0 px-4 pt-2 text-xs font-semibold text-bad" role="alert">{loiMay}</p> : undefined,
        phu: detail.deadlineOverride && (
          <button className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => submit(null)}>Dùng lại hạn mặc định</button>
        ),
        chinh: (
          <button className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !date} onClick={() => submit(date)}>
            {busy ? 'Đang lưu…' : ten}
          </button>
        ),
      }}>
      <div className="space-y-3 pt-3">
        <label className="block" title={`Hạn mặc định tính riêng cho từng môn: hết thứ Tư của tuần kế tiếp sau tuần thi môn đó. Hạn đặt ở đây áp cho CẢ ĐỢT; chỉ một môn thì dùng "${CHU_THAO_TAC['doi-han']}" ở dòng môn đó. Hết ngày hạn mới tính quá hạn.`}>
          <span className="label">Hạn chấm mới</span>
          <ONgay kieu="ngay" value={date} onChange={setDate} />
        </label>
        <Truong nhan="Lý do" tuyChon loi={lf.loiCua(loi, 'ly-do')}>
          <input className="field" {...lf.o(loi, 'ly-do')} value={reason ?? ''} onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: giáo viên Writing nghỉ phép" />
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
      toast.push('ok', 'Đã xử lý việc vắng');
    } catch (e: any) { setLoiMay(e.message); }
    finally { setBusy(false); }
  };
  const daSua = !result && (picked.length > 0 || reason !== '');

  return (
    <KhungPanel tieuDe={`Xử lý vắng · ${row.label}`} hocVien={detail.student.name} lop={detail.classCode} onDong={close}
      chan={{
        daSua: daSua, huy: { onClick: close, disabled: busy },
        dongTren: loiMay ? <p className="m-0 px-4 pt-2 text-xs font-semibold text-bad" role="alert">{loiMay}</p> : undefined,
        chinh: result ? undefined : (
          <button className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={submit}>
            {busy ? 'Đang xử lý…' : 'Xếp lại bài vắng'}
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
            {row?.label} đang xếp {tuanLich(row?.weekStart, homNay)} ({row?.weekRange}), đã xác nhận vắng.
            {(row?.absenceMoveCount ?? 0) > 0 && ` Môn này đã dời do vắng ${row?.absenceMoveCount} lần.`}
          </p>

          {alsoAbsent.length > 0 && (
            <div>
              <span className="label">Cùng buổi thi này còn môn nào vắng?</span>
              <div className="space-y-1 mt-1">
                {alsoAbsent.map((r) => (
                  <label key={r.skill} className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={picked.includes(r.skill)}
                      onChange={(e) => setPicked(
                        e.target.checked ? [...picked, r.skill] : picked.filter((x) => x !== r.skill),
                      )} />
                    <span>{r.label} <span className="text-slate-500 text-xs">({tuanLich(r.weekStart, homNay)})</span></span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-0">
                Tick các môn thi CÙNG buổi. Mỗi môn vẫn được xét riêng: môn đã dời một lần thì
                phải xin Quản lý duyệt, môn chưa dời lần nào thì đổi được ngay.
              </p>
            </div>
          )}

          <Truong nhan="Lý do" tuyChon>
            <input className="field" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: em ốm, gia đình đã báo trước" />
          </Truong>

          <SectionNote>
            {(row?.absenceMoveCount ?? 0) === 0 ? (
              <>
                Đây là <strong>lần dời thứ nhất</strong>: lịch chuyển sang đúng tuần kế tiếp của
                lịch đang có — không chọn tuỳ ý, và không lấy tuần hiện tại để nhảy nhiều tuần
                khi xử lý muộn.
              </>
            ) : (
              <>
                Môn này đã dời do vắng rồi, nên lần này là <strong>đề nghị cần Quản lý duyệt</strong>.
                Lịch giữ nguyên cho tới khi có quyết định. Quản lý phải trả lời TRƯỚC khi tuần mới bắt
                đầu; từ chối hoặc hết hạn thì phần thi bị huỷ và chỉ Quản lý mới khôi phục được.
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
    <KhungPanel tieuDe={`${CHU_THAO_TAC['tra-loi-de-nghi']} · ${row.label}`} hocVien={detail.student.name} lop={detail.classCode}
      onDong={onClose} chan={{ huy: { nhan: 'Đóng', onClick: onClose } }}>
      <div className="pt-3">
      {ds.loading ? <Skeleton rows={3} />
        : ds.error ? <ErrorState message={ds.error.message} onRetry={ds.reload} />
          : the ? <TheYeuCau yc={the} gon onXong={xong} />
            : (
              <div className="space-y-2">
                <p className="m-0 text-sm text-slate-300">Đề nghị đã được xử lý.</p>
                <button type="button" className="btn btn-sm" onClick={xong}>Làm mới</button>
              </div>
            )}
      </div>
    </KhungPanel>
  );
}
