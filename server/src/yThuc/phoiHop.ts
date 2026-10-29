import { db, theoLo, tx } from '../db.ts';
import {
  COORDINATION_KINDS, COORDINATION_KIND_LABEL, COORDINATION_REMOVE_REASON_LABEL, COORDINATION_STATUS_LABEL,
  CHUONG_TRINH_KHONG_CHIA_MON, COORDINATION_SYNC_REVIVE_REASONS, COORDINATION_USER_REMOVE_REASONS, GHI_CHU_MEETING_TOI_THIEU, hanPhoiHop, laMeetingCx, SIGNAL_WITHDRAW_SCORE_FIXED, coordinationSummary, moTaBoTro, ngayTheoGioVN, nhanDot, nhanKetQuaThuong, noiDungBaoPh, tenMon, tenMonNgan, kiemGhiRoKhac, reasonNeedsText, sosCoordinationFor,
  type CoordinationKind, type CoordinationRemoveReason, type CoordinationStatus, boMonTheoLuot, daGhiLuot,
} from '../../../shared/domain/index.ts';
import { napTruocPhamVi, type Principal } from '../permissions.ts';
import { badRequest, conflict, loi, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday, nowNghiepVu } from '../demoConfig.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { GhiDao, daoLai, luuGhiDao, timGhiDao } from '../platform/ghiDao.ts';
import { countAttachments } from '../platform/attachments.ts';
import { kckCuaLuot, loadBundle, resultOf, routeCuaLuot } from '../fasttrack/attempts.ts';
import { allProgrammes, evaluateRegular, nguongDatKhacMacDinh, nguongDatLop } from '../normal/regular.ts';
import { branchSql, checkClassInScope, classSql, statScope } from './thongKe.ts';
import { canManageDiscipline, requireManageDiscipline, requireViewClass, requireViewStudent } from './access.ts';

/**
 * PHỐI HỢP SOS — việc của GVCN sau một lượt Mock Test Fast Track có SOS (rulebook v3, PR-T; `thiet-ke/SOS_VA_PHOI_HOP_V3.md` §5).
 *
 * BA LUỒNG TÁCH RIÊNG, KHÔNG DÙNG CHUNG BẢNG: Case học thuật · Vi phạm + Biện pháp · Phối hợp SOS. Hoàn thành cái này không đóng cái kia (P08).
 * Không có hạn cứng, không vào "đúng hạn cập nhật", không vào bảng hiệu quả (P10) — cố ý không có cột hạn nào.
 *
 * SOS Event là chính lượt Mock (`assessment_attempts`) có `sos_level ≥ 1`; `attempt_id` là mỏ neo. Trạng thái "Hoàn thành" của một lượt là SUY RA
 * (mọi việc `done` hoặc `removed`), không lưu.
 *
 * Quyền (P04): xem = quyền xem học viên (GVBM xem được); thêm / xác nhận / bỏ = GVCN của lớp em ĐANG học + Quản lý trong phạm vi (`discipline.manage`).
 */

/** Chữ do người dùng nhập: cắt khoảng trắng, và từ chối khi quá dài — không để một ô ghi chú thành kho chứa tuỳ ý. */
function capText(value: string | null | undefined, max: number, label: string): string {
  const text = (value ?? '').trim();
  if (text.length > max) throw loi(400, '{label} quá dài (tối đa {max} ký tự).', { label, max });
  return text;
}

/* PR-S5F-b: dùng chung lượt Mock FT và Giữa khoá lớp thường — không nói "SOS" (lớp thường không có SOS). */
const ACT_MESSAGE = 'Chỉ giáo viên chủ nhiệm của lớp em đang học và Quản lý trong phạm vi mới xử lý được việc phối hợp — giáo viên bộ môn chỉ xem.';

// ---------------------------------------------------------------- điền sẵn và đồng bộ theo mức SOS (P01–P03)

/**
 * ĐỒNG BỘ VIỆC PHỐI HỢP ĐIỀN SẴN với mức SOS hiện tại của lượt. Gọi từ CÙNG điểm với việc tự tạo Case (`cases/sos.ts`), mỗi lần điểm của lượt đổi.
 * Hàm của điểm nhập, nên cho ra cùng kết quả dù gọi bao nhiêu lần (P01):
 *
 *   · việc còn thiếu trong bảng §5.3 → THÊM (P01 lần đầu, P02 khi mức SOS tăng). Khoá duy nhất (lượt, loại, tên) chặn nhân đôi;
 *   · việc bị HỆ THỐNG bỏ trước đó (`system_sos_changed`, `system_bang_doi` của OV-13n) mà bảng lại cần → HỒI LẠI `pending` (điểm sửa qua sửa lại thì việc theo mức SOS thật);
 *   · việc điền sẵn `pending` mà bảng mới không còn → tự `removed · system_sos_changed` (P03). Việc `done` GIỮ NGUYÊN — việc đã làm thật không bị xoá;
 *     việc GVCN tự thêm (`preset = 0`) và việc GVCN đã tự bỏ không bao giờ bị máy đụng.
 */
export function syncSosCoordination(attempt: { id: number; student_id: number; attempt_no: number; cycle_id?: number | null }, sosLevel: number | null) {
  if (sosLevel === null) return;
  const conn = db();
  const want = sosCoordinationFor(attempt.attempt_no, sosLevel, routeCuaLuot(attempt));   // T4: RF theo hàng MT4
  const existing = conn.prepare('SELECT * FROM sos_coordination_actions WHERE attempt_id = ?').all(attempt.id) as any[];
  const now = nowIso();
  let added = 0, revived = 0, removed = 0;

  for (const kind of want) {
    const row = existing.find((r) => r.kind === kind && !(r.custom_name ?? '').length);
    if (!row) {
      conn
        .prepare(
          `INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, custom_name, preset, status, created_at)
           VALUES (?,?,?, NULL, 1, 'pending', ?)`,
        )
        .run(attempt.id, attempt.student_id, kind, nowNghiepVu());   // mốc hạn Meeting CX theo ngày nghiệp vụ
      added += 1;
    } else if (row.status === 'removed' && COORDINATION_SYNC_REVIVE_REASONS.includes(row.remove_reason_code)) {
      conn
        .prepare(
          `UPDATE sos_coordination_actions SET status = 'pending', remove_reason_code = NULL, remove_reason_text = NULL,
                  removed_by = NULL, removed_at = NULL, updated_at = ? WHERE id = ?`,
        )
        .run(now, row.id);
      revived += 1;
    }
  }
  for (const row of existing) {
    if (row.preset === 1 && row.status === 'pending' && !want.includes(row.kind)) {
      conn
        .prepare(
          `UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = 'system_sos_changed',
                  removed_by = NULL, removed_at = ?, updated_at = ? WHERE id = ?`,
        )
        .run(now, now, row.id);
      removed += 1;
    }
  }
  if (added || revived || removed) {
    writeAudit({
      actorUserId: null, action: 'sos_coordination.sync', entityType: 'assessment_attempt', entityId: attempt.id,
      entityLabel: `MT${attempt.attempt_no} SOS ${sosLevel}`, after: { added, revived, removed },
    });
  }
}

/**
 * BÁO PHỤ HUYNH QUA TVV (PR-LT2a N3, T45, K5-10, Q13) — MỘT việc mỗi bài Giữa khoá lớp thường, KHÔNG theo môn, không hạn (M-05), việc của GVCN.
 * Bài có ≥ 1 môn trượt → dòng `bao_ph_tvv` (`preset = 1`, `pending`) + thông báo GVCN MỘT lần. Điểm sửa cho hết môn trượt → dòng chưa làm tự
 * `removed · system_sos_changed` (như P03); trượt lại → hồi. Việc đã `done` không bao giờ bị đụng. Chạy lặp không sinh dòng thứ hai.
 * `monTruot`: mã kỹ năng đang trượt của bài (từ `regularResultOf`).
 */
export function dongBoBaoPh(attempt: { id: number; student_id: number; class_id?: number | null; cycle_id?: number | null }, monTruot: string[]) {
  const conn = db();
  if (kckCuaLuot(attempt)) monTruot = [];   // OV-9: em KCK — Case nhẹ, không Báo PH (việc chưa làm tự rút như hết môn trượt)
  const now = nowIso();
  const row = conn.prepare(`SELECT * FROM sos_coordination_actions WHERE attempt_id = ? AND kind = 'bao_ph_tvv'`).get(attempt.id) as any;
  if (!monTruot.length) {
    if (row?.preset === 1 && row.status === 'pending') {
      conn.prepare(`UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = 'system_sos_changed', removed_by = NULL, removed_at = ?, updated_at = ? WHERE id = ?`)
        .run(now, now, row.id);
    }
    return;
  }
  if (row) {
    if (row.status === 'removed' && row.remove_reason_code === 'system_sos_changed') {
      conn.prepare(`UPDATE sos_coordination_actions SET status = 'pending', remove_reason_code = NULL, remove_reason_text = NULL, removed_by = NULL, removed_at = NULL, updated_at = ? WHERE id = ?`)
        .run(now, row.id);
    }
    return;
  }
  conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, custom_name, preset, status, created_at) VALUES (?,?,'bao_ph_tvv', NULL, 1, 'pending', ?)`)
    .run(attempt.id, attempt.student_id, now);
  if (!attempt.class_id) return;
  const ct = (conn.prepare('SELECT programme_code FROM classes WHERE id = ?').get(attempt.class_id) as any)?.programme_code ?? null;
  const hv = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(attempt.student_id) as any;
  const mon = monTruot.map((s) => tenMonNgan(ct, s)).join(', ');
  for (const g of conn.prepare(`SELECT DISTINCT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`).all(attempt.class_id) as any[]) {
    notify({
      userId: g.user_id, kind: 'phoi_hop', title: `Báo phụ huynh qua TVV · ${hv?.full_name ?? ''} · Progress Test không đạt ${mon}`,
      body: 'Nhờ TVV báo phụ huynh (4 nội dung), xong thì đánh dấu đã làm.',
      entityType: 'assessment_attempt', entityId: attempt.id, dedupKey: `bao-ph:${attempt.id}`,
    });
  }
}

/**
 * MÔN BỊ BỎ KHỎI BÁO PHỤ HUYNH (PR-UXF-b R5-4, Câu 2 = A): Báo PH tính THEO CASE của bài Giữa khoá, không theo môn trượt. Môn nào có Case (nối qua tín hiệu của
 * CHÍNH bài đó) đã được Quản lý duyệt "Không cần theo dõi" hoặc bị rút vì sửa điểm thì không còn trong việc; Case đang mở HOẶC đã xong bình thường vẫn tính.
 * Môn trượt chưa có Case nào (lớp không tự tạo Case) vẫn tính — chỉ bỏ khi nhà trường đã quyết không theo dõi. MỘT câu theo lô 400 cho cả tập bài.
 */
export function monBoKhoiBaoPh(attemptIds: readonly number[]): Map<number, Map<string, string>> {
  const out = new Map<number, Map<string, string>>();
  theoLo(attemptIds, (lo, ph) => {
    for (const r of db().prepare(
      `SELECT cs.attempt_id, cs.skill, COALESCE(c.closed_at, c.updated_at) AS dong FROM case_signals cs JOIN sos_cases c ON c.id = cs.case_id
        WHERE cs.attempt_id IN (${ph}) AND cs.skill IS NOT NULL AND c.status = 'done'
          AND (c.dismiss_reason_code IS NOT NULL OR c.outcome_note LIKE ?)`,
    ).all(...lo, `${SIGNAL_WITHDRAW_SCORE_FIXED}%`) as any[]) {
      const ds = out.get(r.attempt_id) ?? new Map<string, string>(); out.set(r.attempt_id, ds);
      ds.set(r.skill, ngayTheoGioVN(r.dong) ?? String(r.dong ?? '').slice(0, 10));
    }
  });
  return out;
}

/**
 * "Môn tính" của Báo PH: môn trượt trừ môn đã bỏ (`bo`: môn → ngày đóng Case). Việc ĐÃ LÀM (`daLamNgay`) giữ đúng nội dung đã báo phụ huynh —
 * chỉ trừ môn có Case đóng TRƯỚC ngày làm (rà UXF-b P2: duyệt "Không cần theo dõi" sau đó không viết lại việc đã làm).
 */
export function monTinhBaoPh(monTruot: readonly string[], bo: ReadonlyMap<string, string> | undefined, daLamNgay: string | null): string[] {
  return monTruot.filter((s) => { const dong = bo?.get(s); return dong === undefined || (daLamNgay !== null && dong >= daLamNgay); });
}

export const monBaoPh = (attemptId: number, monTruot: string[]): string[] => monTinhBaoPh(monTruot, monBoKhoiBaoPh([attemptId]).get(attemptId), null);

/**
 * Đồng bộ lại Báo PH của MỘT bài Giữa khoá sau khi Case của nó đổi trạng thái (Quản lý duyệt "Không cần theo dõi", mở lại). Môn trượt lấy từ tín hiệu còn hiệu lực
 * của chính bài (cùng nguồn `turnsOf`). Bài không phải Giữa khoá lớp thường: không làm gì.
 */
export function dongBoBaoPhCuaBai(attemptId: number) {
  const conn = db();
  const a = conn.prepare(`SELECT id, student_id, class_id, kind, cycle_id FROM assessment_attempts WHERE id = ?`).get(attemptId) as any;
  if (!a || a.kind !== 'progress') return;
  const mon = (conn.prepare(`SELECT DISTINCT skill FROM case_signals WHERE attempt_id = ? AND status != 'withdrawn' AND skill IS NOT NULL ORDER BY id`).all(attemptId) as any[]).map((r) => r.skill as string);
  dongBoBaoPh(a, monBaoPh(attemptId, mon));
}

/** Những em (trong `studentIds`) còn việc Báo phụ huynh qua TVV CHƯA làm — MỘT câu theo lô 400 (cột Việc tiếp theo của GVCN, PR-LT2a).
 *  TD6: JOIN lượt thay `attempt_id IN (SELECT … FROM assessment_attempts)` — câu cũ quét cả bảng lượt. */
export function emCoBaoPhChuaLam(studentIds: readonly number[]): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < studentIds.length; i += 400) {
    const lo = studentIds.slice(i, i + 400);
    for (const r of db().prepare(`SELECT DISTINCT x.student_id FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id AND a.kind != 'final' WHERE x.kind = 'bao_ph_tvv' AND x.status = 'pending' AND x.student_id IN (${lo.map(() => '?').join(',')})`).all(...lo) as any[]) out.add(r.student_id as number);
  }
  return out;
}

// ---------------------------------------------------------------- đọc

export type CoordinationAction = {
  id: number; kind: CoordinationKind; kindLabel: string; customName: string | null; name: string;
  preset: boolean; status: CoordinationStatus; statusLabel: string;
  performedOn: string | null; performedBy: number | null; performerName: string | null; note: string | null;
  removeReasonCode: string | null; removeReasonLabel: string | null; removeReasonText: string | null; removedAt: string | null;
  attachmentCount: number;
  /** OV-12h: hạn xác nhận (meeting CX / GĐCN: ngày tạo + 5) · quá hạn khi còn Cần xử lý và hôm nay > hạn. Việc khác: null · false. */
  han: string | null; quaHan: boolean;
  /** PR-LT2a (N3): 4 nội dung Báo phụ huynh qua TVV (chỉ việc `bao_ph_tvv`) — kết quả · môn khó khăn · nguyên nhân · phương án + khả năng học lại. */
  noiDung: string[] | null;
  /** PR-PHH: true khi việc `bao_ph_tvv` đã xong mà chưa lưu bản chụp (xác nhận trước PR này) — `noiDung` là nội dung HIỆN TẠI, không phải nội dung đã báo. */
  noiDungLaHienTai: boolean;
};

export type CoordinationTurn = {
  attemptId: number; attemptNo: number; studentId: number; studentName: string; studentCode: string;
  classId: number | null; classCode: string | null;
  /** Mức SOS hiện tại của lượt (tính lại từ điểm). Lớp thường KHÔNG có SOS (T58) → null. */
  sosLevel: number | null;
  /** PR-LT2a: lượt lớp thường — `Giữa khoá` / `Cuối khoá` (thay `MT{n}`), null với lượt Mock FT. */
  nhanDot: string | null;
  /** PR-LT2a (T58): chữ kết quả lớp thường qua MỘT hàm `nhanKetQuaThuong` (`2/4 môn đạt` + `Không đạt: G+V P`), null với FT. */
  ketQua: { chinh: string; phu: string | null; pct: string | null; dat: boolean | null } | null;
  /** Kỹ năng đang trượt ở lượt này (từ tín hiệu còn hiệu lực). */
  skills: string[]; skillLabels: string[];
  /** Chữ ngắn của kỹ năng cho chip SOS ("R", "W"). */
  kyNangNgan: string[];
  summary: ReturnType<typeof coordinationSummary>;
  actions: CoordinationAction[];
  canAct: boolean;
};

function shapeAction(r: any, attachments: Map<number, number>): CoordinationAction {
  const han = hanPhoiHop(r.kind, r.created_at);
  return {
    id: r.id, kind: r.kind, kindLabel: COORDINATION_KIND_LABEL[r.kind as CoordinationKind] ?? r.kind,
    customName: r.custom_name ?? null,
    name: r.kind === 'other' && r.custom_name ? r.custom_name : COORDINATION_KIND_LABEL[r.kind as CoordinationKind] ?? r.kind,
    preset: r.preset === 1, status: r.status, statusLabel: COORDINATION_STATUS_LABEL[r.status as CoordinationStatus] ?? r.status,
    performedOn: r.performed_on ?? null, performedBy: r.performed_by ?? null, performerName: r.performer_name ?? null, note: r.note ?? null,
    removeReasonCode: r.remove_reason_code ?? null,
    removeReasonLabel: r.remove_reason_code ? COORDINATION_REMOVE_REASON_LABEL[r.remove_reason_code as CoordinationRemoveReason] ?? r.remove_reason_code : null,
    removeReasonText: r.remove_reason_text ?? null, removedAt: r.removed_at ?? null,
    attachmentCount: attachments.get(r.id) ?? 0,
    han, quaHan: r.status === 'pending' && han !== null && han < demoToday(),
    noiDung: null, noiDungLaHienTai: false,
  };
}

/** Bản chụp đã lưu (4 chuỗi). JSON hỏng/sai hình → null: coi như dòng cũ, không làm sập trang. */
function docBanChup(s: string | null): string[] | null {
  try { const v = JSON.parse(s ?? 'null'); return Array.isArray(v) && v.length === 4 && v.every((x) => typeof x === 'string') ? v : null; } catch { return null; }
}

/** Dựng các "lượt" (một lượt = một SOS Event) từ một tập việc phối hợp đã lọc quyền. */
function turnsOf(p: Principal, rows: any[]): CoordinationTurn[] {
  if (!rows.length) return [];
  const conn = db();
  const attachments = countAttachments('sos_coordination_action', rows.map((r) => r.id));
  napTruocPhamVi([...new Set(rows.map((r) => r.student_id as number))]);   // `canManageDiscipline` từng em đọc bộ nhớ, không N+1
  const byAttempt = new Map<number, any[]>();
  for (const r of rows) byAttempt.set(r.attempt_id, [...(byAttempt.get(r.attempt_id) ?? []), r]);
  const out: CoordinationTurn[] = [];
  /* PR-SOS: đọc theo TẬP (lượt, kỹ năng tín hiệu, điểm) — trước đây mỗi lượt 2 câu + `resultOf` tự hỏi điểm (N+1 theo số SOS Event). */
  const ids = [...byAttempt.keys()];
  const luot = new Map<number, any>();
  const kyNang = new Map<number, string[]>();
  for (let i = 0; i < ids.length; i += 400) {
    const lo = ids.slice(i, i + 400); const q = lo.map(() => '?').join(',');
    for (const a of conn.prepare(`SELECT a.*, s.full_name, s.student_code, c.code AS class_code, c.programme_code,
        (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route, (SELECT cy.khong_cam_ket FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS cy_kck FROM assessment_attempts a
        JOIN students s ON s.id = a.student_id LEFT JOIN classes c ON c.id = a.class_id WHERE a.id IN (${q})`).all(...lo) as any[]) luot.set(a.id, a);
    for (const r of conn.prepare(`SELECT attempt_id, skill FROM case_signals WHERE attempt_id IN (${q}) AND status != 'withdrawn' AND skill IS NOT NULL
        ORDER BY id`).all(...lo) as any[]) {
      const ds = kyNang.get(r.attempt_id) ?? [];
      if (!ds.includes(r.skill)) ds.push(r.skill);
      kyNang.set(r.attempt_id, ds);
    }
  }
  const bundle = loadBundle(ids);
  /* PR-LT2a (N3): nguyên nhân (Mô tả Xác nhận Case) của các em lớp thường — MỘT câu cho cả tập, khớp (học viên, môn). */
  const emThuong = [...new Set([...luot.values()].filter((a) => (a.kind ?? 'mock') !== 'mock').map((a) => a.student_id as number))];
  const nguyenNhan = new Map<string, string>();
  for (let i = 0; i < emThuong.length; i += 400) {
    const lo = emThuong.slice(i, i + 400);
    for (const r of conn.prepare(`SELECT sc.student_id, sc.topic, sc.summary FROM sos_cases sc
        WHERE sc.student_id IN (${lo.map(() => '?').join(',')}) AND sc.origin_kind = 'mock' AND sc.summary IS NOT NULL
          AND EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary') ORDER BY sc.id`).all(...lo) as any[]) {
      nguyenNhan.set(`${r.student_id}:${r.topic}`, r.summary);
    }
  }
  const chuongTrinh = allProgrammes();
  const nguongKhac = nguongDatKhacMacDinh();
  const boBaoPh = monBoKhoiBaoPh(ids.filter((x) => (luot.get(x)?.kind ?? 'mock') !== 'mock'));
  for (const [attemptId, list] of byAttempt) {
    const a = luot.get(attemptId);
    if (!a || a.status === 'cancelled') continue;     // lượt đã huỷ không còn là SOS Event (khớp với chỉ số)
    const laMock = (a.kind ?? 'mock') === 'mock';
    let skills = kyNang.get(attemptId) ?? [];
    let sosLevel: number | null = null, ketQua: CoordinationTurn['ketQua'] = null;
    let noiDungCua: ((daLamNgay: string | null) => string[]) | null = null;
    if (laMock) sosLevel = resultOf(a, bundle.scores.get(a.id) ?? [], bundle.skips.get(a.id) ?? [], bundle.skillRows.get(a.id) ?? []).sosLevel;
    else {
      /* Lớp thường: KHÔNG có mức SOS — chữ kết quả qua `nhanKetQuaThuong`, đọc từ điểm đã nạp (không SQL, không `resultOf` FT). */
      const r = evaluateRegular(boMonTheoLuot(chuongTrinh.get(a.programme_code)?.skills ?? [], daGhiLuot(bundle.skillRows.get(a.id), bundle.scores.get(a.id))), bundle.scores.get(a.id) ?? [], a.programme_code, nguongDatLop(a.class_id, nguongKhac));
      skills = r.skills.filter((x) => x.outcome === 'fail').map((x) => x.skill);
      const kq = ketQua = nhanKetQuaThuong({
        kind: a.kind, ct: a.programme_code ?? null, scored: r.scored, required: r.required, failedSkills: skills, tyLeTong: r.tyLeTong,
        khongChiaMon: CHUONG_TRINH_KHONG_CHIA_MON.includes(a.programme_code), nguong: r.passThreshold,
      });
      /* R5-4: Báo PH theo CASE — môn đã "Không cần theo dõi" / rút vì sửa điểm không nằm trong "môn khó khăn". Việc đã làm: chỉ môn đóng trước ngày làm. */
      const truot = skills;
      noiDungCua = (daLamNgay) => { const tinh = monTinhBaoPh(truot, boBaoPh.get(attemptId), daLamNgay); return noiDungBaoPh({
        ketQua: [kq.chinh, kq.phu].filter(Boolean).join(' · '),
        monTruot: tinh.map((s) => tenMonNgan(a.programme_code, s)),
        nguyenNhan: tinh.map((s) => nguyenNhan.get(`${a.student_id}:${s}`) ?? '').filter(Boolean),
        boTro: tinh[0] ? moTaBoTro(a.programme_code, tinh[0]) : 'chưa có PA bổ trợ',
      }) as string[]; };
    }
    out.push({
      attemptId, attemptNo: a.attempt_no, studentId: a.student_id, studentName: a.full_name, studentCode: a.student_code,
      classId: a.class_id ?? null, classCode: a.class_code ?? null,
      sosLevel, nhanDot: laMock ? null : nhanDot(a.kind, a.attempt_no), ketQua,
      skills, skillLabels: skills.map((s) => tenMon(a.programme_code, s)), kyNangNgan: skills.map((s) => tenMonNgan(a.programme_code, s)),
      summary: coordinationSummary(list.map((r) => r.status)),
      actions: list.map((r) => {
        const x = shapeAction(r, attachments);
        if (r.kind !== 'bao_ph_tvv' || !noiDungCua) return x;
        /* PR-PHH: việc đã xong → bản chụp lúc xác nhận; dòng cũ (chưa có bản chụp) → nội dung hiện tại + cờ. */
        const luu = r.status === 'done' ? docBanChup(r.noi_dung_luc_bao) : null;
        return { ...x, noiDung: luu ?? noiDungCua(r.status === 'done' ? r.performed_on ?? null : null), noiDungLaHienTai: r.status === 'done' && !luu };
      }),
      canAct: canManageDiscipline(p, a.student_id),
    });
  }
  return out;
}

/**
 * Sub-tab `Phối hợp SOS` của HỒ SƠ LỚP (§7.2): các lượt của học viên ĐANG học lớp này. Mặc định chỉ lượt CHƯA hoàn thành; `includeDone` hiện cả lượt đã xong.
 * `pendingCount` là số lượt chưa hoàn thành — con số trên nút sub-tab, không phụ thuộc `includeDone`.
 */
export function coordinationOfClass(p: Principal, classId: number, opts: { includeDone?: boolean } = {}) {
  const cls = db().prepare('SELECT id FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  requireViewClass(p, classId);
  const rows = db()
    .prepare(
      `SELECT x.* FROM sos_coordination_actions x
         JOIN enrollments e ON e.student_id = x.student_id AND e.class_id = ? AND e.status = 'active'
        ORDER BY x.attempt_id, x.id`,
    )
    .all(classId) as any[];
  const all = turnsOf(p, rows).sort((a, b) => a.studentName.localeCompare(b.studentName, 'vi') || a.attemptNo - b.attemptNo);
  const pending = all.filter((t) => !t.summary.complete);
  return { classId, rows: opts.includeDone ? all : pending, pendingCount: pending.length };
}

/**
 * MỘT DÒNG TRONG VIỆC CẦN LÀM CỦA GVCN (đặc tả §7 mục "Việc cần làm", PR-K): mỗi lớp mình chủ nhiệm mà còn lượt Phối hợp SOS
 * chưa hoàn thành. Cùng tinh thần P10 — không có hạn, không tô như quá hạn. Cùng luật "lượt chưa xong" với `coordinationOfClass`
 * (`coordinationSummary`) nên số ở đây khớp sub-tab `Phối hợp SOS` của chính lớp đó — phép kiểm sosV3 PR-K và VAI-a (6c) so hai đường.
 */
export function myCoordinationLines(p: Principal) {
  const today = demoToday();
  return dongPhoiHopLop([...new Set(p.assignments
    .filter((a) => a.isCore && a.effectiveFrom <= today && (!a.effectiveTo || a.effectiveTo >= today))
    .map((a) => a.classId))]);
}

/** OV-11c (CV-8): cùng dòng Phối hợp SOS cho một tập lớp bất kỳ — "Của GV" của Quản lý dựng dòng của mọi GVCN trong phạm vi, cùng luật đếm. */
export function dongPhoiHopLop(classIds: number[]) {
  /* OV-12h: `han` = hạn sớm nhất của việc meeting CX còn Cần xử lý trong các lượt chưa xong của lớp (null = không có việc có hạn). */
  const lines: Array<{ classId: number; className: string; pendingCount: number; text: string; han: string | null }> = [];
  if (!classIds.length) return lines;
  /* MỘT lượt đọc cho MỌI lớp mình chủ nhiệm (số câu không tăng theo số lớp — PR-LT2a thêm hai lớp demo làm lộ N+1 theo lớp), rồi chia lại theo lớp em đang học.
     Cùng luật đếm với `coordinationOfClass`: lượt chưa hoàn thành. Lớp mình chủ nhiệm nên không cần `requireViewClass`. */
  const conn = db();
  const ph = classIds.map(() => '?').join(',');
  /*
   * PR-VAI-a (K5-10): dòng này nay là VIỆC trong `/my-work` (gọi mỗi lần mở Tổng quan/Công việc) — không dựng cả lượt (`turnsOf`, ~10 câu)
   * chỉ để biết lượt nào chưa xong. CÙNG luật của `turnsOf`: lượt = (lượt Test, các việc của nó), xong theo `coordinationSummary` trên trạng
   * thái các việc, lượt đã huỷ không còn là SOS Event — một câu.
   */
  const rows = conn.prepare(
    `SELECT x.attempt_id, x.status, x.kind, x.created_at, e.class_id AS lop_dang_hoc FROM sos_coordination_actions x
       JOIN enrollments e ON e.student_id = x.student_id AND e.class_id IN (${ph}) AND e.status = 'active'
       JOIN assessment_attempts a ON a.id = x.attempt_id AND a.status != 'cancelled'
                                 AND COALESCE(a.kind, 'mock') = 'mock'   -- PR-S6F-a Q11: chỉ lượt Mock FT; lớp thường có việc phoi_hop riêng
      ORDER BY x.attempt_id, x.id`,
  ).all(...classIds) as any[];
  const luot = new Map<number, { lop: number; trangThai: string[]; han: string[] }>();
  for (const r of rows) {
    const l = luot.get(r.attempt_id) ?? luot.set(r.attempt_id, { lop: r.lop_dang_hoc, trangThai: [], han: [] }).get(r.attempt_id)!;
    l.trangThai.push(r.status);
    const h = r.status === 'pending' ? hanPhoiHop(r.kind, r.created_at) : null;
    if (h) l.han.push(h);
  }
  const dem = new Map<number, number>();
  const hanLop = new Map<number, string>();
  for (const l of luot.values()) {
    if (coordinationSummary(l.trangThai).complete) continue;
    dem.set(l.lop, (dem.get(l.lop) ?? 0) + 1);
    for (const h of l.han) if (!hanLop.has(l.lop) || h < hanLop.get(l.lop)!) hanLop.set(l.lop, h);
  }
  const ma = new Map((conn.prepare(`SELECT id, code FROM classes WHERE id IN (${ph})`).all(...classIds) as any[]).map((c) => [c.id as number, c.code as string]));
  for (const classId of classIds) {
    const pendingCount = dem.get(classId) ?? 0;
    if (pendingCount > 0 && ma.has(classId)) {
      const code = ma.get(classId)!;
      lines.push({ classId, className: code, pendingCount, text: `Lớp ${code} — ${pendingCount} lượt Phối hợp SOS cần xử lý`, han: hanLop.get(classId) ?? null });
    }
  }
  return lines;
}

/** Sub-tab `Phối hợp SOS` của HỒ SƠ HỌC VIÊN (§7.3): mọi lượt của em, mới nhất trước. */
export function coordinationOfStudent(p: Principal, studentId: number) {
  const st = db().prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
  if (!st) throw notFound('Không tìm thấy học viên');
  requireViewStudent(p, studentId);
  const rows = db()
    .prepare('SELECT * FROM sos_coordination_actions WHERE student_id = ? ORDER BY attempt_id, id')
    .all(studentId) as any[];
  const turns = turnsOf(p, rows).sort((a, b) => b.attemptNo - a.attemptNo);
  return { studentId, rows: turns, pendingCount: turns.filter((t) => !t.summary.complete).length, canAct: canManageDiscipline(p, studentId) };
}

// ---------------------------------------------------------------- ghi (P05–P07)

function loadAction(id: number): any {
  const r = db().prepare('SELECT * FROM sos_coordination_actions WHERE id = ?').get(id) as any;
  if (!r) throw notFound('Không tìm thấy việc phối hợp');
  return r;
}

function viewOf(id: number): CoordinationAction {
  return shapeAction(loadAction(id), countAttachments('sos_coordination_action', [id]));
}

/** P05 — GVCN THÊM một việc bất kỳ trong sáu loại. `Khác` bắt buộc có tên. Khoá (lượt, loại, tên) duy nhất — kể cả việc đã bỏ (không hồi sinh ngầm). */
export function addCoordination(p: Principal, attemptId: number, input: { kind?: string | null; customName?: string | null }): CoordinationAction {
  const a = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt Mock Test');
  requireManageDiscipline(p, a.student_id, ACT_MESSAGE);
  if (a.status === 'cancelled') throw badRequest('Lượt Mock Test này đã huỷ — không thêm việc phối hợp được.');
  const kind = String(input.kind ?? '');
  if (!(COORDINATION_KINDS as readonly string[]).includes(kind)) {
    throw loi(400, 'Chọn loại việc: {ds}.', { ds: COORDINATION_KINDS.map((k) => COORDINATION_KIND_LABEL[k]).join(' · ') });
  }
  const name = capText(input.customName, 100, 'Tên việc');
  if (kind === 'other') {
    const sai = kiemGhiRoKhac(name);
    if (sai) throw loi(400, 'Việc loại "Khác": {loi}.', { loi: sai });
  }
  if (kind !== 'other' && name) throw badRequest('Chỉ việc loại "Khác" mới có tên riêng.');
  if ((a.kind ?? 'mock') !== 'mock' || !(resultOf(a).sosLevel && resultOf(a).sosLevel! >= 1)) {
    throw badRequest('Chỉ lượt Mock Test Fast Track có SOS mới có Phối hợp SOS.');
  }
  const dup = db()
    .prepare(`SELECT id FROM sos_coordination_actions WHERE attempt_id = ? AND kind = ? AND COALESCE(custom_name, '') = ?`)
    .get(attemptId, kind, name) as any;
  if (dup) throw badRequest('Việc này đã có ở lượt này (kể cả khi đã xong hoặc đã bỏ).');
  const id = tx(() => {
    const info = db()
      .prepare(
        `INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, custom_name, preset, status, created_at)
         VALUES (?,?,?,?, 0, 'pending', ?)`,
      )
      .run(attemptId, a.student_id, kind, name || null, nowNghiepVu());
    const newId = Number(info.lastInsertRowid);
    writeAudit({
      actorUserId: p.userId, action: 'sos_coordination.add', entityType: 'sos_coordination_action', entityId: newId,
      entityLabel: `MT${a.attempt_no} · ${name || COORDINATION_KIND_LABEL[kind as CoordinationKind]}`, after: { kind, name: name || null },
    });
    return newId;
  });
  return viewOf(id);
}

/**
 * P07 — XÁC NHẬN ĐÃ XONG. Bắt buộc NGÀY THỰC HIỆN (không cho ngày tương lai); ghi chú và tệp tuỳ chọn; không hỏi tiến bộ (đó là chuyện của Case
 * học thuật, không phải của Phối hợp). Người thực hiện mặc định là người xác nhận; ghi `performerName` khi việc do người khác làm (CS, GĐCN…).
 * OV-7a: việc ĐÃ XONG lưu lại được (sửa ngày / ghi chú / người) — cùng form, cùng kiểm; Báo PH chụp lại nội dung; nhật ký giữ bản trước.
 */
export function confirmCoordination(p: Principal, id: number, input: { performedOn?: string | null; note?: string | null; performerName?: string | null }): CoordinationAction {
  const r = loadAction(id);
  requireManageDiscipline(p, r.student_id, ACT_MESSAGE);
  if (r.status === 'removed') throw badRequest('Việc này đã bỏ — bấm Khôi phục trước khi xác nhận.');
  if (!input.performedOn) throw badRequest('Cần chọn ngày thực hiện.');
  if (!isIsoDate(input.performedOn)) throw badRequest('Ngày thực hiện không hợp lệ.');
  if (input.performedOn > demoToday()) throw badRequest('Ngày thực hiện không được ở tương lai.');
  const who = capText(input.performerName, 100, 'Tên người thực hiện');
  const note = capText(input.note, 1000, 'Ghi chú');
  if (laMeetingCx(r.kind) && note.length < GHI_CHU_MEETING_TOI_THIEU) throw loi(400, 'Meeting CX/GĐCN (sau Mock): ghi chú nói rõ kết quả buổi gặp, ít nhất {n} ký tự.', { n: GHI_CHU_MEETING_TOI_THIEU });
  tx(() => {
    /* PR-PHH: bản chụp 4 nội dung bằng CHÍNH `turnsOf` đang dùng để hiển thị, tính như sau khi xong (ngày thực hiện) — trước UPDATE, cùng giao dịch. */
    const chup = r.kind === 'bao_ph_tvv'
      ? turnsOf(p, [{ ...r, status: 'done', performed_on: input.performedOn, noi_dung_luc_bao: null }])[0]?.actions[0]?.noiDung ?? null : null;
    db()
      .prepare(
        `UPDATE sos_coordination_actions SET status = 'done', performed_on = ?, performed_by = ?, performer_name = ?, note = ?, noi_dung_luc_bao = ?, updated_at = ? WHERE id = ?`,
      )
      .run(input.performedOn, who ? null : p.userId, who || null, note || null, chup ? JSON.stringify(chup) : null, nowIso(), id);
    writeAudit({
      actorUserId: p.userId, action: 'sos_coordination.confirm', entityType: 'sos_coordination_action', entityId: id,
      entityLabel: `${r.kind}${r.custom_name ? ` · ${r.custom_name}` : ''}`,
      before: r.status === 'done' ? { status: r.status, performedOn: r.performed_on, note: r.note, performerName: r.performer_name } : { status: r.status },
      after: { status: 'done', performedOn: input.performedOn, note: note || null, performerName: who || null, ...(r.kind === 'bao_ph_tvv' ? { noiDungLuu: !!chup } : {}) },
    });
  });
  return viewOf(id);
}

/**
 * P05+P06 — BỎ một việc `pending` kèm LÝ DO CHỌN NHANH ngay tại dòng. Chỉ `Khác` cần chữ. `system_sos_changed` là lý do của HỆ THỐNG — người dùng không chọn
 * được. Lưu vết vào lịch sử (`audit_logs`). Việc đã bỏ tính khỏi mẫu số `{done}/{chưa bỏ}`.
 */
export function removeCoordination(p: Principal, id: number, input: { reasonCode?: string | null; reasonText?: string | null }): CoordinationAction {
  const r = loadAction(id);
  requireManageDiscipline(p, r.student_id, ACT_MESSAGE);
  if (r.status !== 'pending') throw badRequest('Chỉ bỏ được việc đang ở trạng thái Cần xử lý — việc đã xong hoặc đã bỏ thì không bỏ nữa.');
  const code = String(input.reasonCode ?? '');
  if (!(COORDINATION_USER_REMOVE_REASONS as readonly string[]).includes(code)) {
    throw loi(400, 'Chọn một lý do: {ds}.', { ds: COORDINATION_USER_REMOVE_REASONS.map((c) => COORDINATION_REMOVE_REASON_LABEL[c]).join(' · ') });
  }
  const text = capText(input.reasonText, 300, 'Lý do');
  if (reasonNeedsText(code)) {
    const sai = kiemGhiRoKhac(text);
    if (sai) throw loi(400, 'Lý do "Khác": {loi}.', { loi: sai });
  }
  tx(() => {
    const g = new GhiDao(db());   // Q-RL2c: chụp dòng trước khi bỏ → Hoàn tác / Khôi phục trả y nguyên (ghi chú, tệp, ngày tạo…)
    g.sua('sos_coordination_actions', 'id = ?', id);
    const doi = db()
      .prepare(
        `UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = ?, remove_reason_text = ?, removed_by = ?, removed_at = ?, updated_at = ? WHERE id = ? AND status = 'pending'`,
      )
      .run(code, reasonNeedsText(code) ? text : null, p.userId, nowIso(), nowIso(), id).changes;
    if (!doi) throw badRequest('Việc vừa được cập nhật — mở lại.');
    luuGhiDao(db(), { loai: LOAI_BO_PHOI_HOP, bang: 'sos_coordination_actions', id, nguoi: p.userId, ghi: g });
    writeAudit({
      actorUserId: p.userId, action: 'sos_coordination.remove', entityType: 'sos_coordination_action', entityId: id,
      entityLabel: `${r.kind}${r.custom_name ? ` · ${r.custom_name}` : ''}`, before: { status: r.status }, after: { status: 'removed', reason: code, text: text || null },
    });
  });
  return viewOf(id);
}

const LOAI_BO_PHOI_HOP = 'bo_phoi_hop';

/**
 * OV-7a: việc "Đã xong" bấm nhầm → "Đưa lại Cần xử lý" (bỏ ngày / người / bản chụp Báo PH; ghi chú giữ để lưu lại); việc người dùng đã Bỏ → "Khôi phục".
 * Việc HỆ THỐNG bỏ (mức SOS đổi, lượt huỷ) theo điểm — không khôi phục tay. Số liệu Phối hợp đọc trạng thái hiện tại nên tự đếm lại.
 */
export function moLaiCoordination(p: Principal, id: number): CoordinationAction {
  const r = loadAction(id);
  requireManageDiscipline(p, r.student_id, ACT_MESSAGE);
  if (r.status === 'pending') throw conflict('Việc này đang ở trạng thái Cần xử lý.');   // Q-RL2c: bấm lần hai / đã có người mở lại → 409
  if (r.status === 'removed' && !(COORDINATION_USER_REMOVE_REASONS as readonly string[]).includes(r.remove_reason_code)) {
    throw badRequest('Việc này do hệ thống bỏ theo điểm — không khôi phục tay được.');
  }
  tx(() => {
    /* Q-RL2c: việc người dùng bỏ có bản ghi đảo → trả NGUYÊN dòng trước khi bỏ (409 nếu đã có thay đổi sau); việc bỏ trước Q-RL2c → cách cũ. */
    const g = r.status === 'removed' ? timGhiDao(db(), LOAI_BO_PHOI_HOP, 'sos_coordination_actions', id) : null;
    if (g) daoLai(db(), g, p.userId);
    else db().prepare(
      `UPDATE sos_coordination_actions SET status = 'pending', performed_on = NULL, performed_by = NULL, performer_name = NULL, noi_dung_luc_bao = NULL,
              remove_reason_code = NULL, remove_reason_text = NULL, removed_by = NULL, removed_at = NULL, updated_at = ? WHERE id = ?`,
    ).run(nowIso(), id);
    writeAudit({
      actorUserId: p.userId, action: 'sos_coordination.reopen', entityType: 'sos_coordination_action', entityId: id,
      entityLabel: `${r.kind}${r.custom_name ? ` · ${r.custom_name}` : ''}`,
      before: { status: r.status, performedOn: r.performed_on, performerName: r.performer_name, removeReason: r.remove_reason_code, removeText: r.remove_reason_text },
      after: { status: 'pending', ...(g ? { hoanTac: true } : {}) },
    });
  });
  return viewOf(id);
}

// ---------------------------------------------------------------- chỉ số (đặc tả §8)

export const PHOI_HOP_METRIC_IDS = ['phoi-hop-luot-sos', 'phoi-hop-dang-xu-ly', 'phoi-hop-hoan-thanh', 'phoi-hop-qua-han'] as const;
export const isPhoiHopMetric = (id: string): boolean => (PHOI_HOP_METRIC_IDS as readonly string[]).includes(id);

/**
 * BA CHỈ SỐ PHỐI HỢP SOS — đơn vị LƯỢT (một lượt Mock FT có SOS), mỗi chỉ số một hàm trả TẬP ID lượt.
 *
 *   phoi-hop-luot-sos      lượt có `sos_level ≥ 1` (tính lại từ điểm — SOS hết thì lượt thôi là SOS Event) và có việc phối hợp
 *   phoi-hop-dang-xu-ly    trong đó, lượt có ≥1 việc `pending`
 *   phoi-hop-hoan-thanh    trong đó, lượt có ≥1 việc và mọi việc `done` hoặc `removed`
 *
 * Phạm vi xem như thống kê Ý thức: chỉ Quản lý (chi nhánh của họ) và Quản trị; GVBM/GVCN nhận tập rỗng có nhãn. Kỳ (`from`/`to`) tính theo TUẦN của lượt.
 *
 * P15 (PR-Pb, Q15): còn trả `byKind` — ba tập con theo mức SOS (1 / 2 / ≥ 3) của CHÍNH `ids`, để dòng phụ "SOS 1 · SOS 2 ·
 * SOS 3" ở web bấm ra đúng từng phần; `kind` lọc `ids` xuống đúng một mức khi bấm số con. Không N+1 (trước đây `resultOf`
 * và một câu SQL trạng thái chạy MỖI LƯỢT — Turso mỗi câu một vòng mạng): nạp điểm bằng `loadBundle` một lần, đọc trạng
 * thái phối hợp bằng một câu theo lô 400.
 */
/**
 * OV-12h: `phoi-hop-qua-han` — lượt có việc meeting CX / GĐCN còn Cần xử lý đã qua hạn 5 ngày (`hanPhoiHop`), HIỆN TRẠNG (không theo kỳ). Cùng tập với
 * dòng Phối hợp SOS quá hạn ở Công việc: lớp em ĐANG học, người giữ việc = GVCN lớp đó. Hai câu.
 */
function meetingQuaHan(branchIds: number[] | null, classId: number | null) {
  const b = branchSql('c.branch_id', branchIds), cl = classSql('e.class_id', classId);
  const homNay = demoToday();
  const rows = (db().prepare(
    `SELECT x.attempt_id, x.kind, x.created_at, e.class_id FROM sos_coordination_actions x
       JOIN assessment_attempts a ON a.id = x.attempt_id AND a.status != 'cancelled' AND COALESCE(a.kind, 'mock') = 'mock'
       JOIN enrollments e ON e.student_id = x.student_id AND e.status = 'active' JOIN classes c ON c.id = e.class_id
      WHERE x.status = 'pending' AND x.kind IN ('cx_meeting_student', 'cx_meeting_family') AND ${b.sql} AND ${cl.sql} ORDER BY x.attempt_id`,
  ).all(...b.args, ...cl.args) as any[]).map((r) => ({ ...r, han: hanPhoiHop(r.kind, r.created_at) })).filter((r) => r.han && r.han < homNay);
  const lop = [...new Set(rows.map((r) => r.class_id as number))];
  const gvcn = new Map<number, number[]>();
  theoLo(lop, (lo, ph) => {
    for (const t of db().prepare(`SELECT DISTINCT class_id, user_id FROM teacher_assignments WHERE class_id IN (${ph}) AND is_core = 1 AND status = 'active'`).all(...lo) as any[]) {
      gvcn.set(t.class_id, [...(gvcn.get(t.class_id) ?? []), t.user_id]);
    }
  });
  const chiTiet = new Map<number, { nguoi: number[]; han: string[] }>();
  for (const r of rows) {
    const c = chiTiet.get(r.attempt_id) ?? { nguoi: gvcn.get(r.class_id) ?? [], han: [] };
    c.han.push(r.han);
    chiTiet.set(r.attempt_id, c);
  }
  return { none: false, ids: [...chiTiet.keys()], chiTiet };
}

export function phoiHopMetric(
  p: Principal, id: string,
  f: { branchId?: number | null; from?: string | null; to?: string | null; kind?: string | null; classId?: number | null } = {},
): { none: boolean; ids: number[]; byKind?: { sos1: number[]; sos2: number[]; sos3: number[] }; chiTiet?: Map<number, { nguoi: number[]; han: string[] }> } {
  const scope = statScope(p, f.branchId ?? null);
  if (scope.none) return { none: true, ids: [] };
  if (f.classId) checkClassInScope(f.classId, scope.branchIds);
  if (id === 'phoi-hop-qua-han') return meetingQuaHan(scope.branchIds, f.classId ?? null);
  const b = branchSql('c.branch_id', scope.branchIds), cl = classSql('a.class_id', f.classId);
  const period = `${f.from ? ' AND rp.week_start >= ?' : ''}${f.to ? ' AND rp.week_start <= ?' : ''}`;
  const args = [...b.args, ...cl.args, ...(f.from ? [f.from] : []), ...(f.to ? [f.to] : [])];
  const attempts = db()
    .prepare(
      `SELECT DISTINCT a.*, (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route, (SELECT cy.khong_cam_ket FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS cy_kck FROM assessment_attempts a
         JOIN sos_coordination_actions x ON x.attempt_id = a.id
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.status != 'cancelled' AND ${b.sql} AND ${cl.sql}${period} ORDER BY a.id`,
    )
    .all(...args) as any[];

  const bundle = loadBundle(attempts.map((a) => a.id));
  const statusByAttempt = new Map<number, string[]>();
  for (let i = 0; i < attempts.length; i += 400) {
    const chunk = attempts.slice(i, i + 400).map((a) => a.id);
    if (!chunk.length) continue;
    for (const r of db()
      .prepare(`SELECT attempt_id, status FROM sos_coordination_actions WHERE attempt_id IN (${chunk.map(() => '?').join(',')})`)
      .all(...chunk) as any[]) {
      if (!statusByAttempt.has(r.attempt_id)) statusByAttempt.set(r.attempt_id, []);
      statusByAttempt.get(r.attempt_id)!.push(r.status);
    }
  }

  const ids: number[] = [];
  const byKind = { sos1: [] as number[], sos2: [] as number[], sos3: [] as number[] };
  for (const a of attempts) {
    const level = resultOf(a, bundle.scores.get(a.id) ?? [], bundle.skips.get(a.id) ?? [], bundle.skillRows.get(a.id) ?? []).sosLevel;
    if (level === null || level < 1) continue;
    const sum = coordinationSummary(statusByAttempt.get(a.id) ?? []);
    const khop = id === 'phoi-hop-luot-sos' || (id === 'phoi-hop-dang-xu-ly' && sum.pending > 0) || (id === 'phoi-hop-hoan-thanh' && sum.complete);
    if (!khop) continue;
    const kind = level === 1 ? 'sos1' : level === 2 ? 'sos2' : 'sos3';
    if (f.kind && f.kind !== kind) continue;
    ids.push(a.id);
    byKind[kind].push(a.id);
  }
  return { none: false, ids, byKind };
}
