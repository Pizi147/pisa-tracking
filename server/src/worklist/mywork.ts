import { db } from '../db.ts';
import {
  ASSESSED_SKILL_LABEL, ATTEMPT_KIND_SHORT, ENTRY_SKILL_LABEL,
  INTERVENTION_KIND_LABEL, PERMISSIONS,
  REGULAR_SKILL_LABEL, SOS_LABEL, URGENCY_LABEL, caseHeadline, caseTopicLabel, cycleDeadline,
  duongHoSoHocVien, nhanDotNgan, planDueDate, trongHaiTuanCuoi, tuanLich, urgencyFromSos,
  type AssessedSkill, type AttemptKind, type EntrySkill, type InterventionKind,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { can, napTruocPhamVi, scopeFor, teachesClass, type Principal } from '../permissions.ts';
import { attemptHref, listAttempts } from '../fasttrack/attempts.ts';
import { classAlerts } from '../classes/schedule.ts';
import { demChuaLoTrinh } from '../classes/loTrinhTiep.ts';
import { myMgmtTasks } from './mgmttasks.ts';
import { listSignals, type SignalAction } from '../cases/signals.ts';
import { NOT_UNCONFIRMED_PRESET, UNCONFIRMED_PRESET, awaitingCauseCaseIds } from '../cases/sosState.ts';
import { settleNoShows, sweepExpiredMoves } from '../fasttrack/absence.ts';

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
  /** PR-Ra Q6: dòng đề xuất PA học thuật chờ duyệt — đủ để mở `ApprovalDialog` ngay trên dòng. */
  duyet?: { interventionId: number; kind: string; description: string } | null;
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
  | 'verify' | 'cause' | 'score' | 'no_plan' | 'result'
  | 'decide' | 'decide_move'
  | 'do_plan' | 'no_owner' | 'placement' | 'next_step' | 'missing_data' | 'mgmt';

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
   * đúng hạn ba ngày: chọn nguyên nhân + xác nhận (sửa / thay) phương án gợi ý, hoặc đóng `Không cần theo dõi`. Không có dòng này thì hạn đó vô hình:
   * phương án gợi ý chưa xác nhận bị loại khỏi mọi thống kê và nghĩa vụ, nên một case bị lờ đi sẽ nằm im mãi mà số liệu trông như chưa có chuyện gì.
   */
  cause: {
    label: 'Xác định nguyên nhân',
    hint: 'Mock Test có SOS đã tự tạo case cho kỹ năng này. Bạn có ba ngày (tính cả ngày đầu) để chọn nguyên nhân và xác nhận, sửa hoặc thay PA học thuật gợi ý — '
      + 'hoặc đóng `Không cần theo dõi` nếu em không cần theo dõi. Quản lý chỉ thấy dòng này khi đã quá hạn.',
  },

  /*
   * DUYỆT DỜI LỊCH DO VẮNG (mục 10.6) — nhóm riêng, không gộp vào "Duyệt phương án".
   *
   * Hai việc khác hẳn nhau về hậu quả của việc KHÔNG làm: một đề xuất hỗ trợ nằm chờ thì
   * chậm, còn một đề nghị dời nằm chờ quá hạn thì PHẦN THI BỊ HUỶ. Trộn chúng vào một nhóm
   * là để cái thứ hai trôi qua trong đám cái thứ nhất.
   */
  decide_move: {
    label: 'Duyệt dời lịch do vắng',
    hint: 'Em đã vắng và đã dời một lần rồi, nên lần này cần bạn quyết. Phải trả lời TRƯỚC khi '
      + 'tuần mới bắt đầu — từ chối hoặc để quá hạn thì phần thi (Fast Track) hoặc lịch hẹn '
      + '(Normal) bị huỷ, và chỉ Quản lý mới khôi phục được.',
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
    label: 'Ghi kết quả',
    hint: 'Đã tới hẹn xem lại: ghi lại sau khi hỗ trợ em có tiến bộ không, rồi chọn bước tiếp theo.',
  },

  /* ------------------------------------------------------- việc chỉ Quản lý làm được */
  decide: {
    label: 'Chờ tôi xử lý',
    hint: 'Đề xuất PA học thuật cần bạn duyệt, và những case giáo viên đã xin ý kiến Quản lý. Chừng nào chưa có câu trả lời thì bên kia không đi tiếp được.',
  },

  /* --------------------------------------------- những nghĩa vụ khác, vẫn phải thấy được */
  do_plan: {
    label: 'Làm PA học thuật đã hẹn',
    hint: 'PA học thuật đã lên kế hoạch và tới ngày phải làm. Làm xong thì đánh dấu đã hoàn thành kèm ngày thực hiện.',
  },
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
    hint: 'Thiếu những thông tin mà không có thì không đánh giá hay lên kế hoạch được: bài chưa xếp vào tuần nào, lớp chưa có tuần bắt đầu, học viên FT chưa có mục tiêu.',
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

/** Đuôi tiêu đề: " Reading" hay "" khi case không có kỹ năng. */
const duoiKyNang = (topic: string | null | undefined) => (topic ? ` ${caseTopicLabel(topic)}` : '');

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
  const items: WorkItem[] = [];
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
   * Nay một dòng là một NHÓM VIỆC: "CP-FT110 · MT2 · Nhập điểm R cho 6 học viên". Số em là
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
      const skillLabel = ENTRY_SKILL_LABEL[d.skill as EntrySkill]
        ?? REGULAR_SKILL_LABEL[d.skill as keyof typeof REGULAR_SKILL_LABEL]
        ?? d.skill;
      const k = `${d.classId ?? 0}|${d.kind ?? 'mock'}|${d.attemptNo ?? 0}|${d.skill}|u${d.ownerId ?? 0}`;
      let b = buckets.get(k);
      if (!b) {
        b = {
          classId: d.classId, classCode: d.classCode, attemptNo: d.attemptNo,
          kind: d.kind, testLabel, skill: d.skill, skillLabel,
          students: new Map(), due: null, href: attemptHref({ id: d.attemptId, kind: d.kind, classId: d.classId }),
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

  // ------------------------------------------------- 2. phương án đang chờ Quản lý duyệt
  /*
   * Giáo viên là người quyết định phương án của mình có cần Quản lý duyệt hay không.
   * Khi có, Quản lý nợ một câu trả lời trong 3 ngày (case nặng/gấp) hoặc 7 ngày.
   * Góp ý KHÔNG xoá nợ đó — vẫn còn nằm ở đây tới khi duyệt hoặc không duyệt.
   */
  const pendingPlans = conn
    .prepare(
      `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.approval_due,
              sc.sos_level, sc.urgency, sc.summary, sc.origin_kind, sc.attempt_id, sc.topic,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no, a.kind AS attempt_kind,
              pu.full_name AS proposer_name,
              EXISTS (SELECT 1 FROM case_followups fu
                       WHERE fu.intervention_id = iv.id AND fu.next_step = 'ask_manager')
                AS asked_manager
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
         LEFT JOIN users pu ON pu.id = iv.recorded_by
        WHERE iv.approval_state = 'pending'`,
    )
    .all() as any[];

  napTruocPhamVi(pendingPlans.map((r) => r.eff_student_id));
  for (const iv of pendingPlans) {
    if (f.branchId && iv.eff_branch_id !== f.branchId) continue;
    if (!can(p, PERMISSIONS.CASE_APPROVE, { classId: iv.eff_class_id, studentId: iv.eff_student_id })) continue;
    const u = urgencyOf(iv.approval_due, today);
    const what = (iv.description ?? '').trim() || INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] || 'PA học thuật';
    items.push({
      key: `approval:${iv.id}`, group: 'decide', urgency: u,
      studentId: iv.eff_student_id, studentName: iv.full_name ?? 'Học viên',
      classId: iv.eff_class_id ?? null, classCode: iv.class_code ?? null,
      attemptId: iv.attempt_id ?? null, attemptNo: iv.attempt_no ?? null,
      caseId: iv.case_id as number, level: levelOf(iv),
      contextLabel: nhanDot(iv.attempt_kind, iv.attempt_no),
      count: null,
      /*
       * HAI LOẠI VIỆC TRONG CÙNG MỘT NHÓM, và câu lý do phải phân biệt được:
       *   - giáo viên ĐỀ XUẤT một phương án mới và chờ Quản lý duyệt;
       *   - giáo viên đã làm rồi nhưng XIN Ý KIẾN Quản lý vì tự mình không quyết được.
       * Cùng là "bên kia đang chờ tôi", nhưng người đọc cần biết mình đang được hỏi gì.
       */
      reason: iv.asked_manager
        ? `${iv.proposer_name ?? 'Giáo viên'} xin ý kiến: ${what}`
        : (iv.proposer_name ? `${iv.proposer_name} đề xuất: ${what}` : `Đề xuất: ${what}`),
      tieuDe: iv.asked_manager ? 'Trả lời giáo viên' : `Duyệt PA học thuật${duoiKyNang(iv.topic)}`,
      actionLabel: iv.asked_manager ? 'Trả lời giáo viên' : 'Duyệt PA học thuật',
      href: iv.eff_student_id ? `/hoc-vien/${iv.eff_student_id}` : `/hoc-thuat/case/${iv.case_id}`,
      /* Việc này là của QUẢN LÝ đang xem, dù người đề xuất là giáo viên khác. */
      ownerId: p.userId, owner: null, mine: true,
      due: iv.approval_due ?? null,
      statusLabel: iv.asked_manager ? 'Chờ Quản lý trả lời' : 'Chờ Quản lý duyệt',
      /*
       * PR-Ra Q6: dòng ĐỀ XUẤT (không xin ý kiến) có đủ để mở thẳng `ApprovalDialog` trên dòng,
       * không cần mở hồ sơ học viên. Dòng "xin ý kiến" giữ hành vi cũ (mở hồ sơ để đọc ngữ cảnh).
       */
      duyet: iv.asked_manager ? null : { interventionId: iv.id as number, kind: iv.kind as string, description: what },
    });
  }

  // ------------------------------------- 2a-bis. đề nghị dời lịch do vắng chờ Quản lý
  /*
   * MỤC 10.6 — và hạn ở đây KHÔNG phải một chu kỳ, mà là NGÀY TRƯỚC KHI TUẦN MỚI BẮT ĐẦU.
   *
   * Quá hạn không chỉ là chậm: phần thi (Fast Track) hoặc lịch hẹn (Normal) bị huỷ, và từ
   * đó chỉ Quản lý mới khôi phục được. Nên việc này phải nổi lên trước khi tuần ấy tới, chứ
   * không phải sau khi đã muộn.
   */
  sweepExpiredMoves();
  /* Chốt "không dự thi" cuối Chủ nhật ở đường đọc (PR-G) — cùng khuôn mẫu, không cần tác vụ nền. */
  settleNoShows();
  const pendingMoves = conn
    .prepare(
      `SELECT r.id, r.attempt_id, r.skill, r.move_no, r.decide_by, r.reason,
              a.attempt_no, a.class_id, a.student_id, a.kind,
              s.full_name, cl.code AS class_code, cl.branch_id,
              pr.code AS to_week, ru.full_name AS asker_name
         FROM skill_move_requests r
         JOIN assessment_attempts a ON a.id = r.attempt_id
         JOIN students s ON s.id = a.student_id
         LEFT JOIN classes cl ON cl.id = a.class_id
         LEFT JOIN report_periods pr ON pr.id = r.to_period_id
         LEFT JOIN users ru ON ru.id = r.requested_by
        WHERE r.status = 'pending'`,
    )
    .all() as any[];

  napTruocPhamVi(pendingMoves.map((r) => r.student_id));
  for (const r of pendingMoves) {
    if (f.branchId && r.branch_id !== f.branchId) continue;
    if (!can(p, PERMISSIONS.PLAN_WEEK, { classId: r.class_id, studentId: r.student_id })) continue;
    const u = urgencyOf(r.decide_by, today);
    items.push({
      key: `move:${r.id}`, group: 'decide_move', urgency: u,
      studentId: r.student_id, studentName: r.full_name ?? 'Học viên',
      classId: r.class_id ?? null, classCode: r.class_code ?? null,
      attemptId: r.attempt_id, attemptNo: r.attempt_no ?? null,
      caseId: null, level: { tone: u === 'overdue' ? 'danger' : 'warn', text: `Lần dời ${r.move_no}` },
      contextLabel: nhanDot(r.kind, r.attempt_no, 'Lịch thi'),
      count: null,
      reason: [
        `${r.asker_name ?? 'GVCN'} đề nghị dời ${ASSESSED_SKILL_LABEL[r.skill as AssessedSkill] ?? r.skill}`
        + `${r.to_week ? ` sang tuần ${r.to_week}` : ''} (lần ${r.move_no} do vắng)`,
        r.reason ? `Lý do: ${r.reason}` : null,
      ].filter(Boolean).join(' — '),
      tieuDe: `Duyệt dời ${ASSESSED_SKILL_LABEL[r.skill as AssessedSkill] ?? r.skill}`,
      actionLabel: 'Trả lời đề nghị',
      /* Đi thẳng vào bảng lịch kỹ năng của đợt đó — nơi có nút trả lời đề nghị. */
      href: attemptHref({ id: r.attempt_id, kind: r.kind, classId: r.class_id }),
      ownerId: p.userId, owner: null, mine: true,
      due: r.decide_by,
      statusLabel: 'Chờ Quản lý trả lời trước khi tuần mới bắt đầu',
    });
  }

  // ------------------------------------- 2b. phương án đã lên kế hoạch mà tới hạn làm
  /*
   * MỐC THỨ NHẤT trong hai mốc owner giữ: hạn LÀM XONG phương án.
   * (Mốc thứ hai là hạn BÁO KẾT QUẢ của cả case, nằm ở nhóm "Kết quả sau hỗ trợ".)
   *
   * Chỉ hiện việc ĐÃ TỚI HẠN hoặc quá hạn — bày ra từ ngày đầu thì danh sách lúc nào cũng
   * dài mà chưa cần làm gì, và một danh sách lúc nào cũng dài thì không ai đọc.
   *
   * Phương án đang CHỜ DUYỆT thì chưa được phép làm, nên không tính là tới hạn: thúc người
   * ta làm một việc Quản lý chưa đồng ý là thúc sai người.
   */
  const dueActions = conn
    .prepare(
      `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.action_due,
              iv.performer_user_id, iv.performer_name,
              sc.topic, sc.category, sc.attempt_id, sc.sos_level,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              s.full_name, cl.code AS class_code, cl.branch_id, a.attempt_no, a.kind AS attempt_kind
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN enrollments cur ON cur.student_id = sc.student_id AND cur.status = 'active'
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN classes cl ON cl.id = COALESCE(a.class_id, cur.class_id)
        WHERE iv.status IN ('planned', 'started')
          AND iv.action_due IS NOT NULL AND iv.action_due <= ?
          AND sc.status != 'done'
          AND COALESCE(iv.approval_state, '') != 'pending'
          AND ${NOT_UNCONFIRMED_PRESET('iv')}
          AND s.archived_at IS NULL`,
    )
    .all(today) as any[];
  napTruocPhamVi(dueActions.map((r) => r.eff_student_id));
  for (const iv of dueActions) {
    if (f.branchId && iv.branch_id !== f.branchId) continue;
    if (!can(p, PERMISSIONS.SOS_EDIT, {
      classId: iv.eff_class_id, studentId: iv.eff_student_id,
      skill: iv.topic ?? undefined,
    })) continue;
    /*
     * AI THẤY VIỆC NÀY: người ĐANG DẠY em. Quản lý thấy hết, vì họ là người đôn đốc khi có ai đó quên.
     */
    const isManager = can(p, PERMISSIONS.CASE_APPROVE, { classId: iv.eff_class_id, studentId: iv.eff_student_id });
    if (!isManager && !teachesClass(p, iv.eff_class_id)) continue;
    const u = urgencyOf(iv.action_due, today);
    const what = INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL]
      ?? iv.kind;
    items.push({
      key: `action:${iv.id}`, group: 'do_plan', urgency: u,
      studentId: iv.eff_student_id, studentName: iv.full_name ?? 'Học viên',
      classId: iv.eff_class_id ?? null, classCode: iv.class_code ?? null,
      attemptId: iv.attempt_id ?? null, attemptNo: iv.attempt_no ?? null,
      caseId: iv.case_id, level: null,
      contextLabel: nhanDot(iv.attempt_kind, iv.attempt_no),
      count: null,
      reason: what,
      tieuDe: `Làm PA: ${what}`,
      actionLabel: 'Đã làm',
      href: iv.eff_student_id ? `/hoc-vien/${iv.eff_student_id}` : `/hoc-thuat/case/${iv.case_id}`,
      /*
       * NGƯỜI PHỤ TRÁCH có thể là một tài khoản, hoặc chỉ là một cái tên ai đó gõ vào (người
       * ngoài hệ thống). Không có cả hai thì nói thẳng là CHƯA CÓ AI — đó là một tin quan
       * trọng, không phải một ô trống cần lấp cho đẹp.
       */
      ownerId: iv.performer_user_id ?? null,
      owner: iv.performer_user_id ? null : ((iv.performer_name ?? '').trim() || null),
      mine: iv.performer_user_id === p.userId,
      due: iv.action_due ?? null, statusLabel: 'Đang thực hiện',
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

  // ------------------------------------------------- 3. kết quả sau hỗ trợ (tới hẹn xem lại)
  /*
   * AI THẤY VIỆC NÀY: người thực hiện phương án — họ là người biết em có khá lên không.
   * Quá hạn thì Quản lý cũng thấy, để việc không rơi mất khi người thực hiện quên.
   *
   * Phương án đang chờ duyệt thì CHƯA làm, nên chưa có gì để xem lại — loại ra.
   */
  const dueReviews = conn
    .prepare(
      `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.followup_due,
              COALESCE(iv.performer_user_id, iv.recorded_by) AS owner_id, a.kind AS attempt_kind,
              sc.topic, sc.sos_level, sc.urgency, sc.summary, sc.origin_kind, sc.attempt_id,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE iv.followup_due IS NOT NULL AND iv.followup_due <= ?
          AND iv.status != 'cancelled'
          AND COALESCE(iv.approval_state, '') != 'pending'
          AND ${NOT_UNCONFIRMED_PRESET('iv')}
          AND sc.status != 'done'
          AND NOT EXISTS (SELECT 1 FROM case_followups fu WHERE fu.intervention_id = iv.id)`,
    )
    .all(today) as any[];

  napTruocPhamVi(dueReviews.map((r) => r.eff_student_id));
  const reviewedCases = new Set<number>();
  for (const iv of dueReviews) {
    if (f.branchId && iv.eff_branch_id !== f.branchId) continue;
    const u = urgencyOf(iv.followup_due, today);
    const mine = iv.owner_id === p.userId;
    const asManager = u === 'overdue'
      && can(p, PERMISSIONS.CASE_APPROVE, { classId: iv.eff_class_id, studentId: iv.eff_student_id });
    if (!mine && !asManager) continue;
    if (!can(p, PERMISSIONS.SOS_EDIT, {
      classId: iv.eff_class_id, studentId: iv.eff_student_id,
      skill: iv.topic ?? undefined,
    })) continue;
    reviewedCases.add(iv.case_id);
    items.push({
      key: `review:${iv.id}`, group: 'result', urgency: u,
      studentId: iv.eff_student_id, studentName: iv.full_name ?? 'Học viên',
      classId: iv.eff_class_id ?? null, classCode: iv.class_code ?? null,
      attemptId: iv.attempt_id ?? null, attemptNo: iv.attempt_no ?? null,
      caseId: iv.case_id as number, level: levelOf(iv),
      reason: [
        (iv.description ?? '').trim() || INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] || 'Đã hỗ trợ',
        mine ? null : 'người thực hiện chưa cập nhật',
      ].filter(Boolean).join(' — '),
      contextLabel: nhanDot(iv.attempt_kind, iv.attempt_no),
      count: null,
      tieuDe: `Ghi kết quả PA${duoiKyNang(iv.topic)}`,
      actionLabel: 'Ghi kết quả',
      /* PR-UX3 Q3: mở thẳng ngăn Case ở view Ghi kết quả của đúng PA này, không trải form trong trang. */
      href: iv.eff_student_id
        ? duongHoSoHocVien(iv.eff_student_id, { caseId: iv.case_id, paId: iv.id, viec: 'ghi-ket-qua' })
        : `/hoc-thuat/case/${iv.case_id}`,
      ownerId: iv.owner_id ?? null, owner: null, mine,
      due: iv.followup_due ?? null, statusLabel: 'Chờ ghi kết quả',
    });
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
          AND sc.disposition IS NULL
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
      tieuDe: `Đề ra PA học thuật${duoiKyNang(c.topic)}`,
      actionLabel: 'Đề ra PA',
      href: c.eff_student_id ? `/hoc-vien/${c.eff_student_id}` : `/hoc-thuat/case/${c.id}`,
      /* Chưa ai nhận — và đó chính là vấn đề, nên để trống chứ không gán bừa cho người xem. */
      ownerId: null, owner: null, mine: false,
      due: deadline, statusLabel: 'Chưa có PA học thuật',
    });
  }

  // ------------------------------------- 3b. case TỰ TẠO TỪ SOS còn chờ xác định nguyên nhân (S04)
  /*
   * MỘT DÒNG MỖI CASE. Hạn = hạn ba ngày của tín hiệu đã nối case (`verify_due`), hết ngày hạn mới tính quá hạn — cùng luật với mọi hạn khác.
   *
   * AI THẤY: người phụ trách case (GVBM đúng kỹ năng) thấy ngay từ đầu; Quản lý trong phạm vi CHỈ thấy khi đã quá hạn (cùng cách với "Cập nhật kết quả"),
   * và người khác — kể cả GVBM kỹ năng khác — không thấy. Mọi trường hợp đều kiểm đúng quyền sửa case theo kỹ năng (C02).
   */
  const causeCandidates = conn
    .prepare(
      `SELECT sc.id, sc.topic, sc.summary, sc.origin_kind, sc.sos_level, sc.urgency, sc.owner_user_id, sc.attempt_id,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no, a.kind AS attempt_kind,
              (SELECT MIN(g.verify_due) FROM case_signals g WHERE g.case_id = sc.id AND g.status = 'linked') AS due,
              EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary') AS has_cause,
              EXISTS (SELECT 1 FROM case_interventions un WHERE un.case_id = sc.id AND ${UNCONFIRMED_PRESET('un')} AND un.status = 'planned') AS has_unconfirmed
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE sc.status != 'done' AND s.archived_at IS NULL
          AND EXISTS (SELECT 1 FROM case_interventions pv WHERE pv.case_id = sc.id AND pv.preset = 1)`,
    )
    .all() as any[];
  const waiting = new Set(awaitingCauseCaseIds(causeCandidates.map((c) => c.id as number)));
  napTruocPhamVi(causeCandidates.map((r) => r.eff_student_id));
  for (const c of causeCandidates) {
    if (!waiting.has(c.id)) continue;
    if (f.branchId && c.eff_branch_id !== f.branchId) continue;
    if (!can(p, PERMISSIONS.SOS_EDIT, { classId: c.eff_class_id, studentId: c.eff_student_id, skill: c.topic ?? undefined })) continue;
    const u = urgencyOf(c.due ?? null, today);
    const mine = c.owner_user_id === p.userId;
    const asManager = u === 'overdue' && can(p, PERMISSIONS.CASE_APPROVE, { classId: c.eff_class_id, studentId: c.eff_student_id });
    if (!mine && !asManager) continue;
    const missing = [
      c.has_cause ? null : 'chưa chọn nguyên nhân',
      c.has_unconfirmed ? 'PA học thuật gợi ý chưa được xác nhận' : null,
    ].filter(Boolean) as string[];
    const skillLabel = c.topic ? caseTopicLabel(c.topic) : 'Kỹ năng';
    items.push({
      key: `cause:${c.id}`, group: 'cause', urgency: u,
      studentId: c.eff_student_id, studentName: c.full_name ?? 'Học viên',
      classId: c.eff_class_id ?? null, classCode: c.class_code ?? null,
      attemptId: c.attempt_id ?? null, attemptNo: c.attempt_no ?? null,
      caseId: c.id as number, level: levelOf(c),
      contextLabel: nhanDot(c.attempt_kind, c.attempt_no),
      count: null,
      reason: [
        `${skillLabel} dưới kỳ vọng — ${missing.join(' và ')}`,
        mine ? null : 'người phụ trách chưa làm',
      ].filter(Boolean).join(' — '),
      tieuDe: `Xác định nguyên nhân ${skillLabel}`,
      actionLabel: 'Xác định nguyên nhân',
      href: c.eff_student_id ? `/hoc-vien/${c.eff_student_id}` : `/hoc-thuat/case/${c.id}`,
      ownerId: c.owner_user_id ?? null, owner: null, mine,
      due: c.due ?? null, statusLabel: 'Chờ xác định nguyên nhân',
    });
  }

  // ---------------------------------------------------------------- 4. chốt tuần MT
  for (const a of attempts as any[]) {
    if (a.period || a.status !== 'planned') continue;
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
              s.full_name, a.attempt_no, a.kind AS attempt_kind
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
      actionLabel: 'Chọn người phụ trách',
      href: c.eff_student_id ? `/hoc-vien/${c.eff_student_id}` : `/hoc-thuat/case/${c.id}`,
      ownerId: null, owner: null, mine: false,
      due: null, statusLabel: 'Chưa có người phụ trách',
    });
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
    'verify', 'cause', 'score', 'no_plan', 'result',
    'decide', 'decide_move',
    'placement', 'next_step', 'do_plan', 'no_owner', 'mgmt', 'missing_data',
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
      /* Việc đang chờ NGƯỜI KHÁC quyết — đếm riêng vì nó không phải việc mình làm được ngay. */
      approval: items.filter((i) => i.group === 'decide').length,
      mine: items.filter((i) => i.mine).length,
    },
    items: flat,
    groups,
    scopeEmpty: false,
    xemNguoiKhac,
  };
}
