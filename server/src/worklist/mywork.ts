import { db } from '../db.ts';
import {
  ATTEMPT_KIND_SHORT,
  INTERVENTION_KIND_LABEL, PERMISSIONS,
  SOS_LABEL, URGENCY_LABEL, caseHeadline, caseTopicLabel, cycleDeadline,
  duongHoSoHocVien, duongLichTest, nhanDotNgan, planDueDate, trongHaiTuanCuoi, tuanLich, urgencyFromSos,
  khungCua, laLanGhiCuoi, tenMon, MEASURE_KIND_LABEL, nhanLoaiXuLy,
  type Khung, type AttemptKind, type InterventionKind,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, forbidden } from '../util.ts';
import { activeAt, bangLop, can, loadPrincipal, napTruocPhamVi, scopeFor, teachesClass, type Principal } from '../permissions.ts';
import { phamViHoSoGv } from '../giaoVien/phamVi.ts';
import { allProgrammes } from '../normal/regular.ts';
import { attemptHref, listAttempts } from '../fasttrack/attempts.ts';
import { classAlerts } from '../classes/schedule.ts';
import { demChuaLoTrinh } from '../classes/loTrinhTiep.ts';
import { myMgmtTasks } from './mgmttasks.ts';
import { listSignals, type SignalAction } from '../cases/signals.ts';
import { NOT_UNCONFIRMED_PRESET, UNCONFIRMED_PRESET, awaitingCauseCaseIds } from '../cases/sosState.ts';
import { dienMocQuyChe } from '../cases/sosAuto.ts';
import { settleNoShows, sweepExpiredMoves } from '../fasttrack/absence.ts';
import { demYeuCau, quetYeuCau } from '../duyet/yeuCau.ts';
import { mtLichSuChuaNhap } from '../cham/canCham.ts';
import { trangThaiYThuc, ungVienVaThe } from '../yThuc/trangThai.ts';

/**
 * VIỆC CỦA CHÍNH NGƯỜI ĐANG XEM.
 *
 * Màn chính cũ là một bảng số theo tuần, và giáo viên với quản lý mở ra thấy Y HỆT NHAU —
 * cùng bốn ô số, cùng một danh sách. Tệ hơn, danh sách đó liệt kê cả những việc người xem
 * KHÔNG CÓ QUYỀN LÀM: giáo viên được bảo "cập nhật ngày MT thực tế", trong khi quyền đó
 * thuộc về Admin chi nhánh.
 *
 * Ở đây đảo lại: mỗi dòng là MỘT HỌC VIÊN, một câu lý do, và một nút mà chính người đang
 * xem bấm được. Việc nào người xem không làm được thì không xuất hiện — không phải ẩn nút
 * đi mà là không đưa vào danh sách ngay từ đầu.
 *
 * Ba quy tắc:
 *   1. Chỉ đưa vào việc mà người xem THỰC SỰ làm được, kiểm bằng đúng quyền đó.
 *   2. Nhóm theo LOẠI VIỆC, nhưng việc quá hạn hoặc tới hạn hôm nay TÁCH RA lên đầu —
 *      gấp thì phải thấy trước, không để lẫn giữa nhóm.
 *   3. Mỗi dòng chỉ một hành động. Không có dòng nào bắt người đọc tự đoán phải làm gì.
 */

export type WorkUrgency = 'overdue' | 'today' | 'normal';

export type WorkItem = {
  key: string;
  group: WorkGroupKey;
  urgency: WorkUrgency;
  studentId: number | null;
  studentName: string;
  classId: number | null;
  classCode: string | null;
  attemptId: number | null;
  attemptNo: number | null;
  caseId: number | null;
  /** Nhãn MỨC ĐỘ của học viên — chỉ có ở việc liên quan tới một vấn đề đang mở. */
  level: { tone: 'ok' | 'info' | 'warn' | 'danger'; text: string } | null;
  reason: string;
  /** Nút động từ ngắn: "Nhập điểm", "Đề ra PA", "Ghi kết quả". */
  actionLabel: string;
  /**
   * TIÊU ĐỀ DÒNG (PR-UX0, B-2): động từ + đối tượng — "Nhập điểm L, R", "Ghi kết quả PA Reading". Việc cần làm là
   * tiêu đề, không nằm trong badge. Quá hạn KHÔNG có nhãn riêng: `urgency` + `due` đủ để giao diện nối "⚠ quá hạn n ngày" sau hạn.
   */
  tieuDe: string;
  href: string;
  /*
   * NĂM Ô CỦA MỘT DÒNG VIỆC (mục 5.3): học viên/lớp · việc cần làm · người phụ trách · hạn ·
   * trạng thái. Trước vòng 5 ba ô sau nằm lẫn trong câu lý do, nên muốn biết "ai đang giữ
   * việc này" hay "hạn hôm nào" thì phải đọc cả câu — và không lọc theo chúng được.
   */
  ownerId: number | null;
  owner: string | null;
  /** Người đang xem CHÍNH LÀ người phụ trách việc này. */
  mine: boolean;
  /** MH4, K1-30: khung của lớp (Fast Track / Lớp thường). `null` = việc không gắn lớp → hiện ở mọi khung. */
  khung?: Khung | null;
  due: string | null;
  statusLabel: string;
  /**
   * BÀI/CASE LIÊN QUAN — ô thứ hai của một dòng việc (mục 3.3).
   *
   * "Nói rõ MT/Test nào" là yêu cầu nguyên văn: một dòng chỉ ghi "nhập điểm Reading" mà
   * không nói của bài nào thì người nhận phải mở ra mới biết mình đang được nhắc chuyện gì.
   */
  contextLabel: string | null;
  /**
   * SỐ HỌC VIÊN trong một dòng việc gom (mục 2.2 · 3.3).
   *
   * Một dòng nhập điểm cho sáu em là MỘT nhóm việc và SÁU học viên cần nhập — hai đơn vị
   * khác nhau, nên số em đi kèm dòng chứ không biến thành sáu dòng riêng.
   */
  count: number | null;
  /**
   * DÒNG TÍN HIỆU SOS (đặc tả §3.10) — đủ để giao diện vẽ hai nút "Tạo Case · Bỏ qua" mà không phải gọi thêm. Chỉ dòng `verify` có.
   */
  signal?: {
    id: number; kind: 'normal' | 'ft'; skill: string | null; skillLabel: string;
    score: number | null; total: number | null; deadline: string; actions: SignalAction[];
  } | null;
  /** PR-Ra Q5: chỉ dòng có người phụ trách là TÀI KHOẢN KHÁC người xem, và người xem là QL/QT. */
  nhac?: { ownerId: number; daNhacLuc: string | null } | null;
};

/**
 * CHÍN LOẠI VIỆC, BA LOẠI ĐẦU LÀ HỌC THUẬT (mục 3.2).
 *
 * Ba nhóm học thuật chính — nhập điểm, thiếu phương án, cập nhật kết quả — là phần lớn việc
 * hằng ngày của giáo viên. Quản lý có thêm "Chờ tôi xử lý". Những nhóm còn lại ít gặp hơn
 * nhưng KHÔNG được bỏ: giấu một nghĩa vụ đi chỉ vì nó không thuộc ba nhóm chính là cách chắc
 * chắn nhất để nó không bao giờ được làm.
 */
export type WorkGroupKey =
  | 'verify' | 'cause' | 'xac_nhan_pa' | 'score' | 'no_plan' | 'result'
  | 'no_owner' | 'placement' | 'next_step' | 'missing_data' | 'mgmt'
  /* PR-YT4 (K5 §3 dòng 6–8): việc Ý thức THẬT có hạn — thay nhắc mềm W01–W06. */
  | 'yt_xu_ly' | 'yt_xem' | 'yt_thuc_hien';

/**
 * Mỗi nhóm có MỘT DÒNG nói rõ nhóm đó nghĩa là gì.
 *
 * Nhãn cộc lốc kiểu "Ghi kết quả" bắt người đọc tự đoán chuyện gì đã xảy ra và mình phải
 * làm gì. Một dòng giải thích ở đầu nhóm rẻ hơn nhiều so với việc mỗi người tự hiểu một kiểu.
 */
const GROUP_META: Record<WorkGroupKey, { label: string; hint: string }> = {
  /*
   * NHÓM ĐẦU TIÊN, VÌ NÓ ĐỨNG TRƯỚC MỌI THỨ KHÁC (mục 6.2).
   *
   * Điểm dưới kỳ vọng không còn tự mở case. Nó sinh một tín hiệu, và chừng nào chưa ai xác
   * minh thì chưa ai biết vấn đề thật là gì — nên không có phương án nào để làm, không có
   * kết quả nào để cập nhật. Đây là việc chặn đầu chuỗi, và hạn của nó chỉ có ba ngày.
   */
  verify: {
    label: 'Xác minh SOS',
    hint: 'Kết quả của em dưới kỳ vọng ở kỹ năng này. Hệ thống chỉ báo con số — bạn xem lại bài '
      + 'rồi mở case với tên và mô tả cụ thể. Hạn ba ngày kể từ lúc tín hiệu được ghi nhận, '
      + 'tính cả ngày đầu.',
  },

  /*
   * XÁC ĐỊNH NGUYÊN NHÂN (rulebook v3, S04) — thay `verify` cho MOCK TEST FAST TRACK.
   *
   * Mock FT nay TỰ TẠO case cho kỹ năng trượt kèm phương án điền sẵn, nên không còn tín hiệu nào để "xác minh". Việc còn lại của GVBM đúng kỹ năng có
   * đúng hạn ba ngày: xác định nguyên nhân, hoặc đóng `Không cần theo dõi`. PA theo quy chế đã tự chạy từ lúc tạo (PR-N1, S4-1) — không còn vế
   * "xác nhận PA gợi ý". Không có dòng này thì hạn ba ngày vô hình.
   */
  cause: {
    label: 'Xác nhận nguyên nhân',
    hint: 'Mock Test có SOS đã tự tạo Case cho kỹ năng này. Chọn Xác nhận nguyên nhân, hoặc Không cần theo dõi (gửi Quản lý duyệt) — '
      + '3 ngày, tính cả hôm nay.',
  },
  /* PR-SOS (§3.1d): đã Xác nhận Case mà PA theo quy chế còn chờ xác nhận — PA chưa chạy tới khi bấm Xác nhận PA. */
  xac_nhan_pa: {
    label: 'Xác nhận PA',
    hint: 'Đã xác nhận Case — còn xác nhận PA theo quy chế để PA bắt đầu.',
  },

  /* ---------------------------------------------------- ba nhóm học thuật chính (mục 3.2) */
  score: {
    label: 'Nhập điểm Test',
    hint: 'Học viên đã làm bài rồi mà kỹ năng này chưa có điểm. Các em cùng lớp, cùng bài, cùng kỹ năng gom thành một dòng để nhập một lượt.',
  },
  no_plan: {
    label: 'Thiếu PA học thuật',
    hint: 'Vấn đề đã mở nhưng chưa ai ghi sẽ làm gì cho em.',
  },
  result: {
    label: 'Ghi kết quả PA',
    hint: 'Kết quả tuần Thứ Hai → Chủ nhật ghi xong trước hết Thứ Hai tuần sau. Tuần chạm ngày dự kiến kết thúc thì ghi kết quả và kết luận PA.',
  },

  /* --------------------------------------------- những nghĩa vụ khác, vẫn phải thấy được */
  no_owner: {
    label: 'Chưa có người phụ trách',
    hint: 'Case đang mở mà chưa ai nhận điều phối. Chọn người phụ trách trước, vì mọi việc sau đó đều treo vào chỗ này.',
  },
  placement: {
    label: 'Cần xếp lớp tiếp',
    hint: 'Lớp đã học hết chương trình. Học viên còn đang học phải được xếp lớp tiếp, việc này không tự xảy ra.',
  },
  next_step: {
    label: 'Chưa có lộ trình tiếp theo',
    hint: 'Lớp sắp hết khoá. Ghi cho từng em sẽ học gì tiếp, để Quản lý xếp lớp.',
  },
  missing_data: {
    label: 'Thiếu dữ liệu cần cho đánh giá',
    hint: 'Thiếu những thông tin mà không có thì không đánh giá hay lên kế hoạch được: bài chưa xếp vào tuần nào, học viên FT chưa có mục tiêu, MT lịch sử chưa nhập (không tính hạn).',
  },
  /* ---------------------------------------------------- Ý thức (PR-YT4, V4-2…V4-5, K3-37) — người nhận = GVCN lớp đang học */
  yt_xu_ly: {
    label: 'Xử lý vi phạm',
    hint: 'Em có 3 vi phạm trở lên trong tuần này + tuần trước — phải Xác nhận xử lý trong 5 ngày (tính cả ngày ghi). Quá hạn thì Quản lý được báo.',
  },
  yt_xem: {
    label: 'Ghi nhận vi phạm mới',
    hint: 'Vi phạm do người khác ghi mà bạn chưa xem. Ghi nhận (đã xem, không cần xử lý) hoặc Xác nhận xử lý trong 5 ngày.',
  },
  yt_thuc_hien: {
    label: 'Ghi "Đã thực hiện"',
    hint: 'Quản lý đã duyệt đề xuất — ghi ngày đã thực hiện trong 5 ngày kể từ ngày duyệt.',
  },
  mgmt: {
    label: 'Công việc được giao',
    hint: 'Công việc quản lý hoặc việc con được giao cho bạn ở bảng Tiến độ công việc.',
  },
};

/**
 * Hạn xử lý một vấn đề suy thẳng từ mức độ ưu tiên: 7 · 5 · 3 ngày (owner chốt 10/09/2026).
 * Dùng chung một bảng với hạn Quản lý trả lời đề xuất — hai con số nói cùng một chuyện.
 */

function sosTone(level: number | null): 'ok' | 'info' | 'warn' | 'danger' {
  if (level === null) return 'info';
  return level === 0 ? 'ok' : level === 1 ? 'info' : level === 2 ? 'warn' : 'danger';
}

/**
 * Nhãn MỨC ĐỘ của em, lấy từ case: SOS 1/2/3 nếu vấn đề sinh ra từ một bài đánh giá,
 * còn giáo viên tự báo thì chưa có bài nên chỉ có mức độ gấp.
 */
function levelOf(c: { sos_level: number | null; urgency: string | null }): WorkItem['level'] {
  if (c.sos_level !== null) return { tone: sosTone(c.sos_level), text: SOS_LABEL[c.sos_level as 0 | 1 | 2 | 3] };
  if (c.urgency && c.urgency !== 'normal') {
    return {
      tone: c.urgency === 'urgent' ? 'danger' : 'warn',
      text: URGENCY_LABEL[c.urgency as keyof typeof URGENCY_LABEL],
    };
  }
  return null;
}

function urgencyOf(date: string | null, today: string): WorkUrgency {
  if (!date) return 'normal';
  if (date < today) return 'overdue';
  if (date === today) return 'today';
  return 'normal';
}

/** Đuôi tiêu đề: " Reading" hay "" khi case không có kỹ năng. `ct` = chương trình lớp (FOU "Grammar + Vocabulary"). */
const duoiKyNang = (topic: string | null | undefined, ct: string | null) => (topic ? ` ${caseTopicLabel(topic, ct)}` : '');

/**
 * Nhãn đợt (mockup 17 #13): bài không phải Mock thì gọi đúng tên ("Giữa khoá", "Cuối khoá"), Mock thì "MT{n}" —
 * lớp thường không còn hiện "MT1".
 */
function nhanDot(kind: string | null | undefined, no: number | null | undefined, macDinh = 'Case'): string {
  return nhanDotNgan(kind, no) ?? macDinh;
}

export function myWork(p: Principal, f: { branchId?: number | null; nguoi?: 'toi' | 'tat-ca' } = {}) {
  const today = demoToday();
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { summary: { total: 0, overdue: 0, today: 0 }, groups: [], scopeEmpty: true, xemNguoiKhac: false };

  const conn = db();
  quetYeuCau(today);   // PR-DUYET (K5-17): thẻ chết tự đóng, Báo lên tự tạo — một lần mỗi request
  const items: WorkItem[] = [];
  /*
   * Chương trình + cách chấm của MỌI lớp, nạp lười (MH2 tên môn, MH4 khung) — dùng lại bảng lớp và bảng chương trình
   * đã nhớ trong request (`bangLop`, `allProgrammes`), không thêm câu SQL. ponytail: cả bảng lớp (vài trăm dòng).
   */
  let lopMap: Map<number, { ct: string | null; mode: string | null }> | null = null;
  const lopCua = (classId: number | null | undefined) => {
    if (!lopMap) {
      lopMap = new Map();
      const programmes = allProgrammes();
      for (const [id, l] of bangLop()) lopMap.set(id, { ct: l.ct, mode: l.ct ? programmes.get(l.ct)?.scoringMode ?? null : null });
    }
    return classId ? lopMap.get(classId) ?? null : null;
  };
  const ctCua = (classId: number | null | undefined) => lopCua(classId)?.ct ?? null;
  const attempts = listAttempts(p, { branchId: f.branchId ?? undefined }).rows
    .filter((a: any) => a.status !== 'cancelled');
  /*
   * PR-Ra: "Tất cả trong phạm vi" (Q1) — chỉ người xem được người khác (Quản lý/Quản trị) mới
   * có chế độ này; GV luôn chỉ thấy việc của mình dù có gửi `nguoi=tat-ca` lên (chặn ở route).
   */
  const xemNguoiKhac = can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true });
  const tatCa = f.nguoi === 'tat-ca' && xemNguoiKhac;

  // ---------------------------------------------------------------- 0. xác minh tín hiệu
  /*
   * MỘT DÒNG CHO MỖI TÍN HIỆU, KHÔNG GOM.
   *
   * Khác với nhập điểm — nơi một người mở một bảng và gõ cho cả lớp — mỗi tín hiệu là một
   * nhận định riêng về một em và một kỹ năng. Gom sáu em vào một dòng "xác minh Reading" sẽ
   * mời người ta bấm một nút cho cả sáu, mà đó đúng là thứ mục 6.2 muốn bỏ.
   */
  const pushVerifyItem = (sg: any, mine: boolean) => {
    const u = urgencyOf(sg.verifyDue, today);
    items.push({
      key: `verify:${sg.id}`,
      group: 'verify', urgency: u,
      studentId: sg.studentId, studentName: sg.studentName,
      classId: sg.classId, classCode: sg.classCode,
      attemptId: sg.attemptId, attemptNo: sg.attemptNo, caseId: null,
      level: sg.sosLevel !== null ? { tone: sosTone(sg.sosLevel), text: SOS_LABEL[sg.sosLevel as 0 | 1 | 2 | 3] } : null,
      reason: sg.kind === 'normal'
        ? `${sg.label} chưa đạt${sg.score !== null && sg.total !== null ? ` (${sg.score}/${sg.total})` : ''}.`
        : `${sg.label} dưới kỳ vọng${sg.band !== null ? ` (${sg.band} so với ${sg.expectation ?? '—'})` : ''}.`
          + ' Xem lại bài rồi xác minh.',
      tieuDe: `Xác minh SOS ${sg.label}`,
      actionLabel: sg.kind === 'normal' ? 'Tạo Case' : 'Mở Case',
      signal: {
        id: sg.id, kind: sg.kind, skill: sg.skill, skillLabel: sg.label,
        score: sg.score, total: sg.total, deadline: sg.verifyDue, actions: sg.actions,
      },
      href: `/hoc-vien/${sg.studentId}`,
      ownerId: sg.ownerUserId, owner: null, mine,
      due: sg.verifyDue,
      statusLabel: 'Chờ xác minh',
      contextLabel: sg.attemptNo
        ? (sg.attemptKind && sg.attemptKind !== 'mock'
            ? `${ATTEMPT_KIND_SHORT[sg.attemptKind as AttemptKind] ?? 'Bài kiểm tra'} · ${sg.label}`
            : `MT${sg.attemptNo} · ${sg.label}`)
        : sg.label,
      count: null,
    });
  };
  for (const sg of listSignals(p, { status: 'pending', branchId: f.branchId ?? undefined, mine: true }).rows) {
    pushVerifyItem(sg, true);
  }
  /* PR-Ra Q1: "Tất cả trong phạm vi" cộng thêm tín hiệu chờ xác minh của NGƯỜI KHÁC trong phạm vi. */
  if (tatCa) {
    for (const sg of listSignals(p, { status: 'pending', branchId: f.branchId ?? undefined }).rows) {
      if (sg.ownerUserId === p.userId) continue;   // đã có ở trên
      pushVerifyItem(sg, false);
    }
  }

  // ---------------------------------------------------------------- 1. nhập điểm
  /*
   * GOM THEO LỚP · BÀI · KỸ NĂNG (mục 3.3).
   *
   * Trước đây mỗi học viên còn thiếu điểm là một dòng, nên một lớp mười hai em chưa nhập
   * Reading sinh ra mười hai dòng giống hệt nhau, đẩy mọi việc khác xuống dưới — trong khi
   * người nhập chỉ mở MỘT bảng điểm và gõ một lượt.
   *
   * Nay một dòng là một NHÓM VIỆC: "CP FT 110 · MT2 · Nhập điểm R cho 6 học viên". Số em là
   * thông tin của dòng, không phải số dòng (mục 2.2).
   *
   * Hạn của nhóm lấy hạn SỚM NHẤT trong nhóm — nhóm quá hạn khi có bất kỳ em nào quá hạn.
   */
  type ScoreBucket = {
    classId: number | null; classCode: string | null; attemptNo: number | null;
    kind: string | null; testLabel: string; skill: string; skillLabel: string;
    students: Map<number, string>; due: string | null; href: string; attemptId: number; ownerId: number | null;
  };
  type BaiChuaCham = {
    classId: number | null; classCode: string | null; attemptNo: number | null; kind: string | null;
    attemptId: number; studentId: number; studentName: string;
    skill: string; deadline: string | null; ownerId: number | null;
  };
  /*
   * PR-Ra Q1: tách phần gom thành một hàm dùng chung cho "việc của mình" (ownerId luôn là
   * chính người xem) và "việc của người khác trong phạm vi" (ownerId theo `teacher_assignments`).
   * KHOÁ mỗi dòng kèm hậu tố người phụ trách (`|u…`) — để cùng một khoá dù nhìn từ Quản lý hay
   * từ chính giáo viên (nút Nhắc dựa vào khoá này để tìm lại đúng dòng).
   */
  const gomBaiChuaCham = (dongs: BaiChuaCham[]): WorkItem[] => {
    const buckets = new Map<string, ScoreBucket>();
    for (const d of dongs) {
      const testLabel = d.kind && d.kind !== 'mock'
        ? (ATTEMPT_KIND_SHORT[d.kind as AttemptKind] ?? 'Bài kiểm tra')
        : `MT${d.attemptNo}`;
      const skillLabel = tenMon(ctCua(d.classId), d.skill);
      const k = `${d.classId ?? 0}|${d.kind ?? 'mock'}|${d.attemptNo ?? 0}|${d.skill}|u${d.ownerId ?? 0}`;
      let b = buckets.get(k);
      if (!b) {
        b = {
          classId: d.classId, classCode: d.classCode, attemptNo: d.attemptNo,
          kind: d.kind, testLabel, skill: d.skill, skillLabel,
          /* PR-UX1 Q13: bấm Chấm mở Lịch Test đúng lớp, con trỏ vào môn này; bài không có lớp giữ hồ sơ lượt. */
          students: new Map(), due: null,
          href: d.classId ? duongLichTest({ classId: d.classId, kn: d.skill }) : attemptHref({ id: d.attemptId, kind: d.kind, classId: d.classId }),
          attemptId: d.attemptId, ownerId: d.ownerId,
        };
        buckets.set(k, b);
      }
      b.students.set(d.studentId, d.studentName);
      if (d.deadline && (!b.due || d.deadline < b.due)) b.due = d.deadline;
    }
    /*
     * MỘT LỚP · MỘT BÀI · NHIỀU KỸ NĂNG · CÙNG NGƯỜI PHỤ TRÁCH vẫn nên là MỘT dòng nếu cùng
     * hạn — người nhập mở đúng một bảng điểm và gõ cả hai cột. Khác người phụ trách thì KHÔNG
     * gộp, dù cùng lớp cùng hạn — mỗi dòng chỉ một nút Nhắc cho đúng một người.
     */
    const byTest = new Map<string, ScoreBucket[]>();
    for (const b of buckets.values()) {
      const k = `${b.classId ?? 0}|${b.kind ?? 'mock'}|${b.attemptNo ?? 0}|${b.due ?? ''}|u${b.ownerId ?? 0}`;
      (byTest.get(k) ?? byTest.set(k, []).get(k)!).push(b);
    }
    const out: WorkItem[] = [];
    for (const [k, list] of byTest) {
      const first = list[0];
      const skills = list.map((b) => b.skillLabel).join(', ');
      const students = new Map<number, string>();
      for (const b of list) for (const [sid, name] of b.students) students.set(sid, name);
      const u = urgencyOf(first.due, today);
      /*
       * ĐÚNG MỘT EM thì gọi tên em, không nói "Lớp X" — người đọc đi tìm một cái tên, và
       * "cả lớp" cho một học viên là một câu nói vòng vo.
       */
      const only = students.size === 1 ? [...students.entries()][0] : null;
      const where = only ? only[1] : (first.classCode ? `Lớp ${first.classCode}` : 'Bài đánh giá');
      out.push({
        key: `score:${k}`,
        group: 'score', urgency: u,
        /*
         * Ô ĐẦU là LỚP, không phải một em đại diện: việc này làm cho cả nhóm cùng lúc. Chỉ khi
         * đúng một em còn thiếu thì mới nói tên em — lúc đó "lớp" là cách nói vòng vo.
         */
        studentId: only ? only[0] : null,
        studentName: where,
        classId: first.classId, classCode: first.classCode,
        attemptId: first.attemptId, attemptNo: first.attemptNo, caseId: null, level: null,
        contextLabel: first.testLabel,
        count: students.size,
        reason: skills,
        tieuDe: `Nhập điểm ${skills}`,
        actionLabel: 'Nhập điểm',
        href: first.href,
        ownerId: first.ownerId, owner: null, mine: first.ownerId === p.userId,
        due: first.due,
        statusLabel: first.ownerId === null ? 'Chưa phân công giáo viên' : 'Chưa nhập điểm',
      });
    }
    return out;
  };

  const minhDongs: BaiChuaCham[] = [];
  for (const a of attempts as any[]) {
    for (const c of (a.myPendingDetail ?? []) as any[]) {
      minhDongs.push({
        classId: a.classId ?? null, classCode: a.classCode ?? null, attemptNo: a.attemptNo ?? null,
        kind: a.kind ?? null, attemptId: a.id, studentId: a.studentId, studentName: a.studentName,
        skill: c.skill, deadline: c.deadline, ownerId: p.userId,
      });
    }
  }
  items.push(...gomBaiChuaCham(minhDongs));

  /* PR-Ra Q1: "Tất cả trong phạm vi" cộng thêm bài chưa chấm của GIÁO VIÊN KHÁC trong phạm vi. */
  if (tatCa) {
    const managedAttempts = listAttempts(p, { branchId: f.branchId ?? undefined, scope: 'managed' }).rows
      .filter((a: any) => a.status !== 'cancelled');
    const classIds = [...new Set(managedAttempts.map((a: any) => a.classId).filter((x: any): x is number => x !== null))];
    /* Người phụ trách môn — môn trùng người (nhiều giáo viên cùng dạy một kỹ năng) thì người ĐẦU thắng. */
    const ownerOf = new Map<string, number>();
    if (classIds.length) {
      const ph = classIds.map(() => '?').join(',');
      for (const r of conn
        .prepare(`SELECT class_id, skill, user_id FROM teacher_assignments
                    WHERE class_id IN (${ph}) AND status = 'active' AND skill IS NOT NULL ORDER BY id`)
        .all(...classIds) as any[]) {
        const key = `${r.class_id}|${r.skill}`;
        if (!ownerOf.has(key)) ownerOf.set(key, r.user_id);
      }
    }
    const khacDongs: BaiChuaCham[] = [];
    for (const a of managedAttempts as any[]) {
      for (const c of (a.pendingDetail ?? []) as any[]) {
        const ownerId = a.classId ? (ownerOf.get(`${a.classId}|${c.skill}`) ?? null) : null;
        if (ownerId === p.userId) continue;   // đã có ở phần "của mình"
        khacDongs.push({
          classId: a.classId ?? null, classCode: a.classCode ?? null, attemptNo: a.attemptNo ?? null,
          kind: a.kind ?? null, attemptId: a.id, studentId: a.studentId, studentName: a.studentName,
          skill: c.skill, deadline: c.deadline, ownerId,
        });
      }
    }
    items.push(...gomBaiChuaCham(khacDongs));
  }

  /*
   * PR-DUYET: đề xuất PA và đề nghị dời lịch lần 2 KHÔNG còn là dòng việc — chúng là thẻ ở hộp Chờ duyệt (một nơi, K1-01/K1-32).
   * Hai lời quét ở đường đọc giữ nguyên: hết hạn duyệt → huỷ phần thi (mục 10.6); chốt "không dự thi" cuối Chủ nhật (PR-G).
   */
  sweepExpiredMoves();
  settleNoShows();

  // ------------------------------------------- 2b. GHI KẾT QUẢ PA HẰNG TUẦN (K5-02, T75, §5.6) — một PA một dòng
  /*
   * Một nghĩa vụ: kết quả tuần T2→CN ghi xong trước HẾT THỨ HAI tuần sau (`action_due`). Hiện từ Chủ nhật (tuần sắp hết) tới khi
   * ghi. Mốc PA quy chế (`followup_due`) KHÔNG sinh việc riêng — tuần chạm mốc thành "Ghi kết quả cuối" (PR-SOS). Khoá dòng giữ
   * `action:{id}` để "đã nhắc hôm nay" của nút Nhắc khớp qua các PR (K5-12). QL chỉ thấy dòng của người khác khi đã quá hạn.
   */
  const reviewedCases = new Set<number>();
  const ghiKetQua = conn
    .prepare(
      `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.action_due, iv.followup_due, iv.preset,
              iv.performer_user_id, iv.performer_name, COALESCE(iv.performer_user_id, iv.recorded_by) AS owner_id,
              sc.topic, sc.sos_level, sc.urgency, sc.summary, sc.origin_kind, sc.attempt_id,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no, a.kind AS attempt_kind
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE iv.status IN ('planned', 'started')
          AND iv.action_due IS NOT NULL AND iv.action_due <= ?
          AND sc.status != 'done'
          AND COALESCE(iv.approval_state, '') != 'pending'
          AND ${NOT_UNCONFIRMED_PRESET('iv')}
          AND s.archived_at IS NULL AND s.status = 'active'`,   /* K3-41: em Tạm dừng dừng hạn */
    )
    .all(addDays(today, 1)) as any[];
  napTruocPhamVi(ghiKetQua.map((r) => r.eff_student_id));
  for (const iv of ghiKetQua) {
    if (f.branchId && iv.eff_branch_id !== f.branchId) continue;
    if (!can(p, PERMISSIONS.SOS_EDIT, { classId: iv.eff_class_id, studentId: iv.eff_student_id, skill: iv.topic ?? undefined })) continue;
    const u = urgencyOf(iv.action_due, today);
    const mine = iv.owner_id === p.userId;
    const qlQuaHan = u === 'overdue' && can(p, PERMISSIONS.CASE_APPROVE, { classId: iv.eff_class_id, studentId: iv.eff_student_id });
    if (!mine && !teachesClass(p, iv.eff_class_id) && !qlQuaHan) continue;
    reviewedCases.add(iv.case_id);
    /* PR-SOS (T22, M-17): PA theo quy chế chạm mốc → "Ghi kết quả cuối" (PA thường không có mốc — Q28-4). */
    const tuanCuoi = laLanGhiCuoi({ preset: iv.preset === 1, followupDue: iv.followup_due ?? null, actionDue: iv.action_due ?? null }, today);
    const tenPa = (iv.description ?? '').trim() || INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] || 'PA học thuật';
    items.push({
      key: `action:${iv.id}`, group: 'result', urgency: u,
      studentId: iv.eff_student_id, studentName: iv.full_name ?? 'Học viên',
      classId: iv.eff_class_id ?? null, classCode: iv.class_code ?? null,
      attemptId: iv.attempt_id ?? null, attemptNo: iv.attempt_no ?? null,
      caseId: iv.case_id as number, level: levelOf(iv),
      contextLabel: nhanDot(iv.attempt_kind, iv.attempt_no), count: null,
      reason: [tenPa, mine ? null : 'người thực hiện chưa ghi'].filter(Boolean).join(' — '),
      tieuDe: tuanCuoi ? `Ghi kết quả cuối · ${tenPa}` : `Ghi kết quả PA${duoiKyNang(iv.topic, ctCua(iv.eff_class_id))}`,
      actionLabel: tuanCuoi ? 'Ghi kết quả cuối' : 'Ghi kết quả',
      href: iv.eff_student_id
        ? duongHoSoHocVien(iv.eff_student_id, { caseId: iv.case_id, paId: iv.id, viec: 'ghi-ket-qua' })
        : `/hoc-thuat/case/${iv.case_id}`,
      ownerId: iv.performer_user_id ?? iv.owner_id ?? null,
      owner: iv.performer_user_id ? null : ((iv.performer_name ?? '').trim() || null),
      mine, due: iv.action_due, statusLabel: 'Chờ ghi kết quả',
    });
  }

  // ------------------------------------------------- 2c. lớp đã hết chương trình
  /*
   * CHỈ GIỮ LẠI MỘT VIỆC: lớp đã học hết chương trình mà học viên chưa được xếp lớp tiếp.
   *
   * "Sắp tới tuần Progress Test", "sắp tới tuần Final Test" KHÔNG còn nằm ở đây — chúng là
   * SỰ KIỆN sắp đến, không phải việc đang nợ, và một sự kiện chưa đến mà nằm trong danh sách
   * việc thì người đọc học cách bỏ qua cả danh sách (mục 3.5). Chúng chuyển sang khối "Sự
   * kiện nổi bật" ở đầu màn.
   *
   * Lớp đã hết chương trình thì khác: mỗi ngày trôi qua là mỗi ngày học viên không được học,
   * và việc đó không tự xảy ra.
   */
  for (const [classId, pr] of classAlerts(
    (conn
      .prepare(
        `SELECT c.id FROM classes c WHERE c.status = 'active'${f.branchId ? ' AND c.branch_id = ?' : ''}`,
      )
      .all(...(f.branchId ? [f.branchId] : [])) as any[]).map((r) => r.id),
  )) {
    if (pr.phase !== 'finished') continue;
    if (pr.canXepLop === 0) continue;   // đã xếp hết (hoặc đang xếp sau) rồi thì không còn việc gì (Q9)
    if (!can(p, PERMISSIONS.CLASS_EDIT, { classId })) continue;
    const cls = conn.prepare('SELECT code FROM classes WHERE id = ?').get(classId) as any;
    items.push({
      key: `class:${classId}`, group: 'placement', urgency: 'normal',
      studentId: null, studentName: `Lớp ${cls.code}`,
      classId, classCode: cls.code,
      attemptId: null, attemptNo: null, caseId: null, level: null,
      contextLabel: `Hết ${pr.totalWeeks} tuần`, count: pr.canXepLop,
      reason: `${pr.canXepLop} học viên chưa có hướng học tiếp`,
      tieuDe: 'Xếp lớp tiếp',
      actionLabel: 'Xếp lớp tiếp theo',
      href: `/hoc-vien/lop/${classId}?viec=chuyen-tiep`,
      /* Việc của cả lớp, không của riêng ai — nên không gán người phụ trách. */
      ownerId: null, owner: null, mine: false,
      due: null, statusLabel: 'Chờ xếp lớp',
    });
  }

  // ------------------------------------------------- 2d. chưa có lộ trình tiếp theo (PR-LT, Q5, Q6)
  /*
   * NHẮC GVCN TRƯỚC KHI LỚP HẾT KHOÁ: badge hộp lớp đã nhắc, nhưng GVCN cần một dòng việc
   * để thực sự MỞ panel ghi cho từng em — QL đã có việc đỏ "Cần xếp lớp tiếp" (2c) riêng,
   * nên việc này CHỈ dành cho GVCN, tránh trùng hai việc cho cùng một lớp (Q5).
   */
  {
    const lopGvcnDay = (conn
      .prepare(
        `SELECT ta.class_id FROM teacher_assignments ta
           JOIN classes c ON c.id = ta.class_id
          WHERE ta.user_id = ? AND ta.is_core = 1 AND ta.status = 'active' AND c.status = 'active'
            ${f.branchId ? 'AND c.branch_id = ?' : ''}`,
      )
      .all(...(f.branchId ? [p.userId, f.branchId] : [p.userId])) as any[]).map((r) => r.class_id as number);
    if (lopGvcnDay.length) {
      const tienDo = classAlerts(lopGvcnDay);
      const soChua = demChuaLoTrinh(lopGvcnDay);
      for (const classId of lopGvcnDay) {
        const pr = tienDo.get(classId);
        if (!pr || pr.programmeCode === 'FT') continue;
        if (!trongHaiTuanCuoi(pr.currentWeek, pr.totalWeeks, pr.phase)) continue;
        const n = soChua.get(classId) ?? 0;
        if (n === 0) continue;
        const cls = conn.prepare('SELECT code FROM classes WHERE id = ?').get(classId) as any;
        const urgency: WorkUrgency = 'normal';   // không có hạn để quá (G-4) — hết khoá chỉ đổi chữ trạng thái
        items.push({
          key: `class-next-step:${classId}`, group: 'next_step', urgency,
          studentId: null, studentName: `Lớp ${cls.code}`,
          classId, classCode: cls.code,
          attemptId: null, attemptNo: null, caseId: null, level: null,
          contextLabel: pr.finalWeekStart ? `hết khoá ${tuanLich(pr.finalWeekStart, today)}` : null,
          count: n,
          reason: `${n} HV chưa có lộ trình tiếp theo`,
          tieuDe: 'Ghi lộ trình tiếp theo',
          actionLabel: 'Ghi lộ trình tiếp theo',
          href: `/hoc-vien?open=${classId}`,
          ownerId: p.userId, owner: null, mine: true,
          due: null, statusLabel: pr.phase === 'finished' ? 'Đã hết khoá' : 'Sắp hết khoá',
        });
      }
    }
  }

  // ------------------------------------------------- 4. vấn đề mở mà chưa có phương án nào
  const caseRows = conn
    .prepare(
      `SELECT sc.*,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no, a.kind AS attempt_kind,
              (SELECT COUNT(*) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.status != 'cancelled') AS iv_count
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE sc.status != 'done' AND COALESCE(sc.sos_level, 1) > 0
          AND sc.disposition IS NULL AND COALESCE(s.status, 'active') = 'active'   /* K3-41: em Tạm dừng dừng hạn */
        GROUP BY sc.id`,
    )
    .all() as any[];

  napTruocPhamVi(caseRows.map((r) => r.eff_student_id));
  for (const c of caseRows) {
    if (f.branchId && c.eff_branch_id !== f.branchId) continue;
    if (c.iv_count > 0 || reviewedCases.has(c.id)) continue;
    // Quyền GHI NHẬN xử lý, không phải quyền xem — việc chỉ hiện với người làm được.
    if (!can(p, PERMISSIONS.SOS_EDIT, {
      classId: c.eff_class_id, studentId: c.eff_student_id,
      skill: c.topic ?? undefined,
    })) continue;
    /*
     * ĐỀ XUẤT PHƯƠNG ÁN là việc của người DẠY em, hoặc của Quản lý. Admin chi nhánh ghi hộ
     * được việc CS gọi phụ huynh nên vẫn có `sos.edit`, nhưng giao cho văn phòng năm dòng
     * "đề xuất phương án hỗ trợ" là giao một việc họ không có căn cứ chuyên môn để làm —
     * đúng kiểu danh sách việc mà người nhận chỉ biết bỏ qua.
     */
    const mayDecide = teachesClass(p, c.eff_class_id)
      || can(p, PERMISSIONS.CASE_APPROVE, { classId: c.eff_class_id, studentId: c.eff_student_id });
    if (!mayDecide) continue;

    /*
     * HẠN PHẢI CÓ PHƯƠNG ÁN THEO MỨC ĐỘ (mục 8.3): Gấp 3 ngày, Bình thường 5 ngày, tính cả
     * ngày đầu. Chỉ áp cho case học thuật.
     *
     * Trước vòng 7 hạn này bằng nguyên một chu kỳ hỗ trợ (hai tuần), nên một case Gấp nằm
     * im mười ba ngày vẫn chưa bị coi là chậm. Nay mức độ quyết định hạn — và đó là lý do
     * mức độ chỉ còn hai bậc, mỗi bậc một con số.
     */
    const detected = c.detected_at ?? (c.created_at ?? '').slice(0, 10);
    const deadline = detected
      ? planDueDate(detected, c.urgency ?? urgencyFromSos(c.sos_level ?? null))
      : null;
    const u: WorkUrgency = deadline !== null && today > deadline ? 'overdue' : 'normal';
    const head = caseHeadline({
      summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no,
      attemptKind: c.attempt_kind ?? null,
    });
    items.push({
      key: `support:${c.id}`, group: 'no_plan', urgency: u,
      studentId: c.eff_student_id, studentName: c.full_name ?? 'Học viên',
      classId: c.eff_class_id ?? null, classCode: c.class_code ?? null,
      attemptId: c.attempt_id ?? null, attemptNo: c.attempt_no ?? null,
      caseId: c.id as number, level: levelOf(c),
      reason: head,
      contextLabel: nhanDot(c.attempt_kind, c.attempt_no),
      count: null,
      tieuDe: `Đề ra PA học thuật${duoiKyNang(c.topic, ctCua(c.eff_class_id))}`,
      actionLabel: 'Đề ra PA',
      href: c.eff_student_id ? `/hoc-vien/${c.eff_student_id}` : `/hoc-thuat/case/${c.id}`,
      /* Chưa ai nhận — và đó chính là vấn đề, nên để trống chứ không gán bừa cho người xem. */
      ownerId: null, owner: null, mine: false,
      due: deadline, statusLabel: 'Chưa có PA học thuật',
    });
  }

  // ------------------------------------- 3b. case TỰ TẠO TỪ SOS: Xác nhận nguyên nhân · Xác nhận PA (S4-2, §3.1d)
  /*
   * MỘT DÒNG MỖI CASE (nguyên nhân) / MỖI PA (xác nhận PA). Hạn = `sos_cases.han_xac_nhan` (3 ngày tính cả ngày đầu), hết ngày hạn mới tính
   * quá hạn. "Chờ nguyên nhân" là của `awaitingCauseCaseIds` (đã loại thẻ Không cần theo dõi đang chờ).
   *
   * AI THẤY: người phụ trách case (GVBM đúng kỹ năng); "Của GV (nhắc)" liệt kê dòng của GV cho Quản lý. Em Tạm dừng không sinh dòng (K3-41).
   * Mọi trường hợp đều kiểm đúng quyền sửa case theo kỹ năng (C02).
   */
  const cotCase = `sc.id, sc.topic, sc.summary, sc.origin_kind, sc.sos_level, sc.urgency, sc.owner_user_id, sc.attempt_id,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no, a.kind AS attempt_kind, sc.han_xac_nhan AS due`;
  const noiCase = `LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id`;
  const causeCandidates = conn
    .prepare(
      `SELECT ${cotCase} FROM sos_cases sc ${noiCase}
        WHERE sc.status != 'done' AND s.archived_at IS NULL AND s.status = 'active'
          AND EXISTS (SELECT 1 FROM case_interventions pv WHERE pv.case_id = sc.id AND pv.preset = 1)`,
    )
    .all() as any[];
  const waiting = new Set(awaitingCauseCaseIds(causeCandidates.map((c) => c.id as number)));
  const xacNhanPa = conn
    .prepare(
      `SELECT ${cotCase}, iv.id AS iv_id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id ${noiCase}
        WHERE ${UNCONFIRMED_PRESET('iv')} AND iv.status = 'planned' AND sc.status != 'done' AND s.archived_at IS NULL AND s.status = 'active'
          AND EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')`,
    )
    .all() as any[];
  napTruocPhamVi([...causeCandidates, ...xacNhanPa].map((r) => r.eff_student_id));
  const dongCase = (c: any, loai: 'cause' | 'xac_nhan_pa') => {
    if (f.branchId && c.eff_branch_id !== f.branchId) return;
    if (!can(p, PERMISSIONS.SOS_EDIT, { classId: c.eff_class_id, studentId: c.eff_student_id, skill: c.topic ?? undefined })) return;
    const u = urgencyOf(c.due ?? null, today);
    const mine = c.owner_user_id === p.userId;
    /*
     * PR-DUYET (K1-57) + PR-SOS (K5-05): QL không có dòng này ở "Của tôi" — quá hạn thì nó là thẻ Báo lên ở hộp Chờ duyệt. "Của GV (nhắc)"
     * (`nguoi=tat-ca`) liệt kê dòng của GV kèm tên như mọi nhóm khác.
     */
    const cuaGv = tatCa && can(p, PERMISSIONS.CASE_APPROVE, { classId: c.eff_class_id, studentId: c.eff_student_id });
    if (!mine && !cuaGv) return;
    const skillLabel = c.topic ? caseTopicLabel(c.topic, ctCua(c.eff_class_id)) : 'Kỹ năng';
    const hv = c.full_name ?? 'Học viên';
    const nguyenNhan = loai === 'cause';
    items.push({
      key: nguyenNhan ? `cause:${c.id}` : `xnpa:${c.iv_id}`, group: loai, urgency: u,
      studentId: c.eff_student_id, studentName: hv,
      classId: c.eff_class_id ?? null, classCode: c.class_code ?? null,
      attemptId: c.attempt_id ?? null, attemptNo: c.attempt_no ?? null,
      caseId: c.id as number, level: levelOf(c),
      contextLabel: nhanDot(c.attempt_kind, c.attempt_no),
      count: null,
      reason: [
        nguyenNhan ? `${skillLabel} dưới kỳ vọng — chưa xác nhận nguyên nhân` : `${skillLabel} — PA theo quy chế chưa bắt đầu`,
        mine ? null : 'người phụ trách chưa làm',
      ].filter(Boolean).join(' — '),
      tieuDe: nguyenNhan ? `Xác nhận nguyên nhân ${skillLabel} · ${hv}` : `Xác nhận PA · ${skillLabel} · ${hv}`,
      actionLabel: nguyenNhan ? 'Xác nhận nguyên nhân' : 'Xác nhận PA',
      /* PR-DUYET (K5-12): mở thẳng Ngăn Case — Nhắc lưu đường này vào thông báo, chuông về đúng chỗ. */
      href: c.eff_student_id ? duongHoSoHocVien(c.eff_student_id, { caseId: c.id }) : `/hoc-thuat/case/${c.id}`,
      ownerId: c.owner_user_id ?? null, owner: null, mine,
      due: c.due ?? null, statusLabel: nguyenNhan ? 'Chờ xác nhận nguyên nhân' : 'Chờ xác nhận PA',
    });
  };
  for (const c of causeCandidates) if (waiting.has(c.id)) dongCase(c, 'cause');
  for (const c of xacNhanPa) dongCase(c, 'xac_nhan_pa');
  // ---------------------------------------------------------------- 4. chốt tuần MT
  for (const a of attempts as any[]) {
    if (a.period || a.status !== 'planned' || a.lichSu) continue;
    if (!can(p, PERMISSIONS.PLAN_WEEK, { classId: a.classId })) continue;
    items.push({
      key: `week:${a.id}`, group: 'missing_data', urgency: 'normal',
      studentId: a.studentId, studentName: a.studentName,
      classId: a.classId ?? null, classCode: a.classCode ?? null,
      attemptId: a.id, attemptNo: a.attemptNo, caseId: null, level: null,
      contextLabel: nhanDot(a.kind, a.attemptNo), count: null,
      reason: 'Bài chưa được xếp vào tuần nào nên chưa tính được hạn nhập điểm',
      tieuDe: 'Chốt tuần MT',
      actionLabel: 'Chốt tuần MT', href: attemptHref(a),
      ownerId: p.userId, owner: null, mine: true,
      due: null, statusLabel: 'Chưa có tuần',
    });
  }

  /*
   * K5-09: HỌC VIÊN FT CHƯA CÓ TARGET — không có target thì không có kỳ vọng, SOS và Case không bao giờ sinh ra. Việc của GVCN lớp
   * (người điền hồ sơ), không hạn. Một câu cho mọi lớp người xem chủ nhiệm.
   */
  {
    const lopCn = [...new Set(p.assignments.filter((x) => x.isCore && activeAt(x, today)).map((x) => x.classId))];
    if (lopCn.length) {
      for (const h of conn.prepare(
        `SELECT s.id, s.full_name, e.class_id, c.code AS class_code FROM learning_cycles cy
           JOIN students s ON s.id = cy.student_id AND s.status = 'active' AND s.archived_at IS NULL
           JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
           JOIN classes c ON c.id = e.class_id
          WHERE cy.status = 'active' AND cy.route IS NOT NULL AND cy.target_score IS NULL AND cy.khong_cam_ket = 0
            AND e.class_id IN (${lopCn.map(() => '?').join(',')}) AND (? IS NULL OR c.branch_id = ?)
          ORDER BY c.code, s.full_name`,
      ).all(...lopCn, f.branchId ?? null, f.branchId ?? null) as any[]) {
        items.push({
          key: `target:${h.id}`, group: 'missing_data', urgency: 'normal',
          studentId: h.id, studentName: h.full_name, classId: h.class_id, classCode: h.class_code,
          attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: null, count: null,
          reason: 'Chưa có target nên chưa tính được kỳ vọng từng MT',
          tieuDe: 'Điền target', actionLabel: 'Điền target', href: `/hoc-vien/${h.id}`,
          ownerId: p.userId, owner: null, mine: true, due: null, statusLabel: 'Chưa có target',
        });
      }
    }
  }

  /* K2-32: MT LỊCH SỬ chưa nhập — một việc XÁM mỗi lớp (GVCN / Quản lý), không hạn, không quá hạn. Cùng hàm với dòng nhắc Lịch Test. */
  for (const l of mtLichSuChuaNhap(p, { branchId: f.branchId ?? null })) {
    items.push({
      key: `lich-su:${l.classId}`, group: 'missing_data', urgency: 'normal',
      studentId: null, studentName: `Lớp ${l.classCode}`, classId: l.classId, classCode: l.classCode,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: null, count: l.soEm,
      reason: `Nhập MT lịch sử · ${l.soEm} em · không tính hạn`,
      tieuDe: 'Nhập MT lịch sử', actionLabel: 'Nhập điểm', href: l.href,
      ownerId: p.userId, owner: null, mine: true, due: null, statusLabel: 'Không tính hạn',
    });
  }

  /*
   * PR-SOS (K3-14, Q8): PA theo quy chế đang chạy mà CHƯA CÓ MỐC (chưa có lịch MT kế / ngày thi) → việc của Quản lý: Nhập ngày thi dự
   * kiến / Xếp lịch MT. Điền mốc trước (có lịch rồi thì hết việc), rồi đọc lại. Một câu cho cả phạm vi.
   */
  if (xemNguoiKhac) {
    const sql = `SELECT iv.id, iv.case_id, iv.moc_quy_che, COALESCE(sc.student_id, a.student_id) AS sid, s.full_name,
              COALESCE(a.class_id, cur.class_id) AS class_id, COALESCE(ac.code, cc.code) AS class_code,
              COALESCE(ac.branch_id, cc.branch_id) AS branch_id, a.attempt_no
         FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE iv.preset = 1 AND iv.status = 'started' AND iv.followup_due IS NULL AND iv.moc_quy_che IN ('until_next_mt', 'until_exam')
          AND sc.status != 'done' AND s.archived_at IS NULL AND s.status = 'active'`;
    const truoc = conn.prepare(sql).all() as any[];
    if (truoc.length) {
      dienMocQuyChe({ caseIds: [...new Set(truoc.map((r) => r.case_id as number))] });
      const sau = conn.prepare(sql).all() as any[];
      napTruocPhamVi(sau.map((r) => r.sid));   // PR-S3F #4: `can()` từng dòng đọc bộ nhớ, không N+1
      for (const r of sau) {
        if (f.branchId && r.branch_id !== f.branchId) continue;
        if (!can(p, PERMISSIONS.CASE_APPROVE, { classId: r.class_id, studentId: r.sid })) continue;
        const thi = r.moc_quy_che === 'until_exam';
        items.push({
          key: `moc:${r.id}`, group: 'missing_data', urgency: 'normal',
          studentId: r.sid, studentName: r.full_name ?? 'Học viên', classId: r.class_id ?? null, classCode: r.class_code ?? null,
          attemptId: null, attemptNo: r.attempt_no ?? null, caseId: r.case_id, level: null, contextLabel: null, count: null,
          reason: `PA theo quy chế ${thi ? 'đến lúc thi' : `đến MT${(r.attempt_no ?? 0) + 1}`} đang chạy nhưng chưa có ${thi ? 'ngày thi' : 'lịch'}`,
          tieuDe: thi ? `Nhập ngày thi dự kiến · ${r.full_name ?? 'Học viên'}` : `Xếp lịch MT${(r.attempt_no ?? 0) + 1} cho ${r.full_name ?? 'Học viên'}`,
          actionLabel: thi ? 'Nhập ngày thi' : 'Xếp lịch', href: r.sid ? `/hoc-vien/${r.sid}` : '/hoc-vien',
          ownerId: p.userId, owner: null, mine: true, due: null, statusLabel: 'Chưa có lịch',
        });
      }
    }
  }

  // ------------------------------------------------- 5. case chưa có người phụ trách
  /*
   * "CHƯA CÓ NGƯỜI PHỤ TRÁCH" LÀ MỘT VIỆC, KHÔNG PHẢI MỘT Ô TRỐNG (mục 2.3 · 3.2).
   *
   * Case không có người điều phối thì mọi việc sau đó — đề xuất phương án, làm, xem lại —
   * đều không có ai để nhắc. Nên nó phải nổi lên thành một dòng việc riêng, và người làm
   * được là người có quyền phân công.
   */
  const ownerless = conn
    .prepare(
      `SELECT sc.id, sc.summary, sc.origin_kind, sc.sos_level, sc.urgency,
              sc.detected_at, sc.created_at, sc.attempt_id,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no, a.kind AS attempt_kind,
              /* K1-05: lớp có môn của Case mà chưa ai dạy môn đó → gốc là phân công, không phải chọn người phụ trách. */
              EXISTS (SELECT 1 FROM class_skills cs WHERE cs.class_id = COALESCE(a.class_id, cur.class_id) AND cs.skill = sc.category)
                AND NOT EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = COALESCE(a.class_id, cur.class_id)
                                  AND ta.status = 'active' AND ta.skill = sc.category) AS thieu_gv_mon
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE sc.status != 'done' AND sc.owner_user_id IS NULL
          AND s.archived_at IS NULL`,
    )
    .all() as any[];
  napTruocPhamVi(ownerless.map((r) => r.eff_student_id));
  for (const c of ownerless) {
    if (f.branchId && c.eff_branch_id !== f.branchId) continue;
    if (!can(p, PERMISSIONS.CASE_APPROVE, { classId: c.eff_class_id, studentId: c.eff_student_id })
        && !teachesClass(p, c.eff_class_id)) continue;
    const head = caseHeadline({
      summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no,
      attemptKind: c.attempt_kind ?? null,
    });
    const suaPc = !!c.thieu_gv_mon && can(p, PERMISSIONS.CLASS_ASSIGN, { classId: c.eff_class_id });
    items.push({
      key: `owner:${c.id}`, group: 'no_owner', urgency: 'normal',
      studentId: c.eff_student_id, studentName: c.full_name ?? 'Học viên',
      classId: c.eff_class_id ?? null, classCode: c.class_code ?? null,
      attemptId: c.attempt_id ?? null, attemptNo: c.attempt_no ?? null,
      caseId: c.id as number, level: levelOf(c),
      contextLabel: nhanDot(c.attempt_kind, c.attempt_no),
      count: null,
      reason: `${head} — chưa ai nhận điều phối`,
      tieuDe: 'Chọn người phụ trách',
      actionLabel: suaPc ? 'Sửa phân công' : 'Chọn người phụ trách',
      href: suaPc ? `/hoc-vien/lop/${c.eff_class_id}?viec=phan-cong`
        : c.eff_student_id ? `/hoc-vien/${c.eff_student_id}` : `/hoc-thuat/case/${c.id}`,
      ownerId: null, owner: null, mine: false,
      due: null, statusLabel: 'Chưa có người phụ trách',
    });
  }

  // ------------------------------------------------- 5b. Ý thức (PR-YT4) — việc thật có hạn, người nhận = GVCN lớp ĐANG học
  /*
   * Một cửa trạng thái (`trangThaiYThuc`): quét Báo lên ở đầu request đã nạp các em này, nên ở đây không tốn thêm câu nào ngoài câu
   * ứng viên. Em Tạm dừng không sinh việc (T65). Dòng hết khi làm xong ở bất cứ đâu (Ghi nhận / Xác nhận xử lý / Đề xuất / Đã thực hiện).
   */
  {
    const uv = ungVienVaThe({ branchId: f.branchId ?? null });
    const trang = trangThaiYThuc(uv.map((r) => r.id), today);
    if (tatCa) napTruocPhamVi(uv.map((r) => r.id));   // `can()` từng em bên dưới đọc bộ nhớ, không N+1
    const duongLop = (lopId: number | null, sid: number, them: string) =>
      lopId ? `/hoc-vien/lop/${lopId}?tab=y-thuc&hv=${sid}${them}` : duongHoSoHocVien(sid, { tab: 'y-thuc' });
    for (const r of uv) {
      const em = trang.get(r.id);
      if (!em || em.tamDung || !em.gvcnId) continue;
      const mine = em.gvcnId === p.userId;
      if (!mine && !(tatCa && can(p, PERMISSIONS.CASE_APPROVE, { classId: em.lopId, studentId: r.id }))) continue;
      const chung = {
        studentId: r.id, studentName: r.ten, classId: em.lopId, classCode: r.lop,
        attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: 'Ý thức', count: null,
        ownerId: em.gvcnId, owner: null, mine,
      };
      const quaHan = [...em.viPham.values()];
      if (em.soBatBuoc > 0 && !em.coChoDuyet) {
        const ke = em.keTiep ? MEASURE_KIND_LABEL[em.keTiep.kind] : 'Đề xuất QL duyệt';
        items.push({ ...chung, key: `yt_xu_ly:${r.id}`, group: 'yt_xu_ly', urgency: urgencyOf(em.han, today),
          reason: `${em.soBatBuoc} vi phạm trong 2 tuần — bắt buộc xử lý`,
          tieuDe: `Xử lý vi phạm · ${r.ten} (${em.soBatBuoc}) · bậc kế tiếp: ${ke}`, actionLabel: 'Xác nhận xử lý',
          href: duongLop(em.lopId, r.id, '&mo=xu-ly'), due: em.han,
          statusLabel: quaHan.some((x) => x.lyDoQuaHan === 'xu-ly') ? 'Quá hạn' : 'Bắt buộc xử lý' });
      }
      if (em.soMoi > 0) {
        items.push({ ...chung, key: `yt_xem:${r.id}`, group: 'yt_xem', urgency: urgencyOf(em.hanXem, today),
          reason: `${em.soMoi} vi phạm chưa ai xem`, tieuDe: `Ghi nhận ${em.soMoi} vi phạm mới · ${r.ten}`, actionLabel: 'Ghi nhận',
          href: duongLop(em.lopId, r.id, '&loc=moi'), due: em.hanXem, statusLabel: 'Mới' });
      }
      /* PR-S3F #7: MỘT việc cho MỖI lần xử lý đã duyệt (khoá theo id lần xử lý) — hai đề xuất cùng lúc không che nhau. */
      for (const x of em.daDuyet) {
        const nhan = nhanLoaiXuLy(x.kind, x.customName);
        items.push({ ...chung, key: `yt_thuc_hien:${x.id}`, group: 'yt_thuc_hien', urgency: urgencyOf(x.han, today),
          reason: `QL đã duyệt ${nhan}`, tieuDe: `Ghi "Đã thực hiện" ${nhan} · ${r.ten}`, actionLabel: 'Đã thực hiện',
          href: duongLop(em.lopId, r.id, `&mo=da-thuc-hien&xl=${x.id}`), due: x.han, statusLabel: 'Đã duyệt · chờ thực hiện' });
      }
    }
  }

  // ------------------------------------------------- 6. công việc quản lý được giao
  /*
   * VIỆC Ở BẢNG "TIẾN ĐỘ CÔNG VIỆC" CŨNG LÀ VIỆC CỦA NGƯỜI NÀY (mục 3.2).
   *
   * Giáo viên không nhìn thấy cả bảng đó, nhưng việc con giao cho họ thì vẫn phải hiện ở
   * đây — nếu không, giao việc xong là việc biến mất khỏi tầm mắt người nhận.
   */
  for (const t of myMgmtTasks(p)) {
    const u = urgencyOf(t.due, today);
    items.push({
      key: `mgmt:${t.id}`, group: 'mgmt', urgency: u,
      studentId: null, studentName: t.title,
      classId: null, classCode: null,
      attemptId: null, attemptNo: null, caseId: null, level: null,
      contextLabel: t.parentTitle ? `Việc con của: ${t.parentTitle}` : 'Công việc quản lý',
      count: null,
      reason: t.progressLabel,
      tieuDe: t.title,
      actionLabel: 'Cập nhật',
      href: `/cong-viec?mo-viec=${t.id}`,
      ownerId: p.userId, owner: null, mine: true,
      due: t.due, statusLabel: t.progressLabel,
    });
  }

  /*
   * XẾP NHÓM.
   *
   * Bản trước gom hết việc gấp vào một nhóm "Cần làm ngay" — nhưng "quá hạn nhập điểm" và
   * "chưa ai bắt tay vào" là hai chuyện khác hẳn nhau, gộp lại thì nhìn vào không biết cái
   * nào là cái nào. Nay GIỮ ĐÚNG LOẠI VIỆC, chỉ xếp việc gấp lên đầu TRONG nhóm của nó, và
   * xếp nhóm nào có việc gấp lên trước.
   */
  /*
   * Ba nhóm học thuật đứng trước, rồi tới việc chỉ Quản lý làm được, rồi những nghĩa vụ
   * còn lại. "Cần xếp lớp tiếp" đứng ngay sau ba nhóm chính vì nó treo cả một lớp.
   */
  const order: WorkGroupKey[] = [
    'verify', 'cause', 'xac_nhan_pa', 'score', 'no_plan', 'result', 'yt_xu_ly', 'yt_xem', 'yt_thuc_hien',
    'placement', 'next_step', 'no_owner', 'mgmt', 'missing_data',
  ];
  const weight = (u: WorkUrgency) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);

  /*
   * TÊN NGƯỜI PHỤ TRÁCH, LẤY MỘT LẦN CHO CẢ DANH SÁCH.
   *
   * Hỏi từng dòng một thì một màn ba trăm việc sinh ba trăm câu truy vấn — chậm mà không
   * màn nào báo lỗi, đúng kiểu khó tìm nhất.
   */
  const ownerIds = [...new Set(items.map((i) => i.ownerId).filter((x): x is number => x !== null))];
  if (ownerIds.length) {
    const names = new Map<number, string>();
    for (const r of conn
      .prepare(`SELECT id, full_name FROM users WHERE id IN (${ownerIds.map(() => '?').join(',')})`)
      .all(...ownerIds) as any[]) names.set(r.id, r.full_name);
    for (const it of items) {
      if (it.ownerId === null) continue;   // đã có tên chữ, hoặc thật sự chưa có ai
      it.owner = it.ownerId === p.userId ? 'Bạn' : (names.get(it.ownerId) ?? null);
      it.mine = it.ownerId === p.userId;
    }
  }

  /*
   * PR-Ra Q5: nút NHẮC — chỉ QL/QT (xem được người khác), chỉ dòng có người phụ trách là một
   * TÀI KHOẢN KHÁC người xem. "Một lần/dòng/ngày": đọc lại đã nhắc lúc nào bằng MỘT câu, không
   * hỏi từng dòng — cùng lý do với khối tên người ở trên.
   */
  if (xemNguoiKhac) {
    const nhacToday = new Map<string, string>();
    for (const r of conn
      .prepare(`SELECT dedup_key, created_at FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`)
      .all(`nhac:%:${today}`) as any[]) {
      const m = /^nhac:(.+):[^:]+$/.exec(r.dedup_key);
      if (m) nhacToday.set(m[1], r.created_at);
    }
    for (const it of items) {
      if (it.ownerId === null || it.ownerId === p.userId) continue;
      it.nhac = { ownerId: it.ownerId, daNhacLuc: nhacToday.get(it.key) ?? null };
    }
  }

  ganKhung(items, lopCua);

  const groups = order
    .map((g) => {
      const list = items.filter((i) => i.group === g)
        .sort((a, b) => weight(a.urgency) - weight(b.urgency));
      return {
        key: g,
        label: GROUP_META[g].label,
        hint: GROUP_META[g].hint,
        items: list,
        overdue: list.filter((i) => i.urgency === 'overdue').length,
        today: list.filter((i) => i.urgency === 'today').length,
      };
    })
    .filter((g) => g.items.length > 0)
    .sort((a, b) => (b.overdue > 0 ? 1 : 0) - (a.overdue > 0 ? 1 : 0));

  /*
   * TRẢ VỀ CẢ DANH SÁCH PHẲNG.
   *
   * Màn Tổng quan bày MỘT khu "Việc cần làm" có bộ lọc, chứ không phải bảy danh sách mở
   * đồng thời (mục 5.3). Nhóm vẫn còn, nhưng chỉ dùng để đếm cho dải ô trên đầu và làm một
   * chiều lọc — không còn là bảy cái hộp xếp chồng nhau.
   *
   * Thứ tự: quá hạn trước, rồi tới hạn hôm nay, rồi hạn gần nhất. Việc không có hạn xuống
   * cuối — nó không cấp bằng việc có hạn đã trôi qua.
   */
  const flat = [...items].sort((a, b) => {
    const w = weight(a.urgency) - weight(b.urgency);
    if (w !== 0) return w;
    if (a.due && b.due) return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });

  return {
    summary: {
      total: items.length,
      overdue: items.filter((i) => i.urgency === 'overdue').length,
      today: items.filter((i) => i.urgency === 'today').length,
      /* Thẻ đang chờ người xem duyệt ở hộp Chờ duyệt (K5-04) — không còn là dòng việc. */
      approval: demYeuCau(p).cho,
      mine: items.filter((i) => i.mine).length,
    },
    items: flat,
    groups,
    scopeEmpty: false,
    xemNguoiKhac,
  };
}

/** MH4: gán khung cho mọi dòng việc từ bảng tra lớp đã nạp (không thêm câu SQL). Dòng không gắn lớp → `null`. */
function ganKhung(items: WorkItem[], lopCua: (classId: number | null | undefined) => { mode: string | null } | null) {
  for (const it of items) {
    const l = it.classId ? lopCua(it.classId) : null;
    it.khung = l ? khungCua(l.mode) : null;
  }
}

/**
 * VIỆC CỦA MỘT GIÁO VIÊN KHÁC, người xem là Quản lý/Quản trị (`/my-work?nguoi={id}` và hồ sơ GV — PR-GV Q4).
 * Chuyển nguyên từ route; phép kiểm chi nhánh dùng `phamViHoSoGv` (vai hoặc phân công đang hiệu lực) để Công việc
 * không 403 khi hồ sơ GV trả 200.
 */
export function viecCuaNguoi(p: Principal, nguoi: number, branchId?: number | null) {
  if (!can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true })) throw forbidden('Bạn chỉ xem được việc của mình.');
  phamViHoSoGv(p, nguoi);
  const x = loadPrincipal(nguoi);
  const w = myWork(x, { branchId }) as any;
  napTruocPhamVi(w.items.map((it: any) => it.studentId));   // `can()` từng dòng bên dưới đọc bộ nhớ, không N+1
  /* Dòng không lớp/không HV là việc Vận hành ("mgmt") — không thuộc Hỗ trợ học viên, bỏ. */
  const items = w.items
    .filter((it: any) => (it.classId !== null || it.studentId !== null)
      && can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: it.classId, studentId: it.studentId }))
    .map((it: any) => ({
      ...it,
      owner: it.ownerId === x.userId ? x.fullName : it.owner,
      mine: false,
    }));
  if (items.length) {
    const today = demoToday();
    const nhacToday = new Map<string, string>();
    for (const r of db()
      .prepare(`SELECT dedup_key, created_at FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`)
      .all(`nhac:%:${today}`) as any[]) {
      const m = /^nhac:(.+):[^:]+$/.exec(r.dedup_key);
      if (m) nhacToday.set(m[1], r.created_at);
    }
    for (const it of items) {
      if (it.ownerId === null) continue;
      it.nhac = { ownerId: it.ownerId, daNhacLuc: nhacToday.get(it.key) ?? null };
    }
  }
  const groupsByKey = new Map<string, any[]>();
  for (const it of items) (groupsByKey.get(it.group) ?? groupsByKey.set(it.group, []).get(it.group)!).push(it);
  const groups = w.groups
    .map((g: any) => ({ ...g, items: groupsByKey.get(g.key) ?? [] }))
    .filter((g: any) => g.items.length > 0)
    .map((g: any) => ({
      ...g,
      overdue: g.items.filter((i: any) => i.urgency === 'overdue').length,
      today: g.items.filter((i: any) => i.urgency === 'today').length,
    }));
  return {
    summary: {
      total: items.length,
      overdue: items.filter((i: any) => i.urgency === 'overdue').length,
      today: items.filter((i: any) => i.urgency === 'today').length,
      approval: items.filter((i: any) => i.group === 'decide').length,
      mine: 0,
    },
    items, groups, scopeEmpty: false, xemNguoiKhac: true,
  };
}
