/**
 * P8 MON-DANG-KY (plan.md 1.6 N13, N22 ④ — chỉ Fast Track): ĐỔI MÔN ĐĂNG KÝ của một lộ trình, xem trước hoặc lưu.
 *
 * Dùng lại phạm vi lượt có sẵn (`setSkillScope`): bài CHƯA THI (dòng lịch chưa có điểm, `scheduled` / `absent`) của môn bỏ → `required = 0`
 * lý do "Không học"; bài đã có điểm GIỮ (không xoá điểm — Q5). Bật lại môn → đúng các dòng "Không học" đó `required = 1`. Chỉ học một task
 * Writing → `bo_task` trên dòng Writing chưa thi. Case MỞ của môn bỏ → đóng "Không còn học môn" (PA đang chạy `cancelled`); bật lại không mở lại.
 * Xem trước và lưu cùng một hàm (`xemTruoc`) — web không tự suy tóm tắt.
 */
import { db, tx } from '../db.ts';
import { badRequest, forbidden, notFound } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { closeCasesBySystem } from '../cases/systemClose.ts';
import { capNhatConOCho } from './conOCho.ts';
import { setSkillScope } from './skillSchedule.ts';
import { refreshOutcome } from './attempts.ts';
import { demoToday } from '../demoConfig.ts';
import {
  ENTRY_SKILL_SHORT, LY_DO_KHONG_HOC, PERMISSIONS, boTaskCua, chuMon, kyNangKhongHoc, luuMon, monThieu, type MonVao,
} from '../../../shared/domain/index.ts';

export type TomTatMon = {
  truoc: string; sau: string; doi: boolean;
  /** Bài chưa thi của môn bỏ → khỏi đợt. */
  boKhoiDot: number;
  /** Bài của môn bỏ đã có điểm — giữ nguyên. */
  giuDaCham: number;
  /** Bài chưa thi của môn bật lại → vào lại đợt. */
  batLai: number;
  caseDong: number;
  /** "W2" khi chỉ học W2 (Writing = W2), "W1" ngược lại; null = đủ hai task hoặc không học Writing. */
  writing: string | null;
  /** Thiếu kỹ năng đánh giá hoặc một task Writing → Overall "Không đủ bộ môn". */
  khongDuBoMon: boolean;
  /** Các dòng "Khi lưu, web sẽ" (mockup k4) — web hiện nguyên, không tự ghép. */
  dong: string[];
};

const CHUA_THI = new Set(['scheduled', 'absent']);

/** Chuẩn hoá ở biên: lỗi của hàm thuần → 400 (câu lỗi hiện tại ô Môn học). */
export function docMon(mon: MonVao): string | null {
  try { return luuMon(mon); } catch (e: any) { throw badRequest(e.message); }
}

/**
 * Ai đổi được môn (chủ SP 26/10 đêm): QL, Quản trị, GVCN (`student.edit` theo phạm vi) và TVV (vai `consultant`, `student.edit_more` đúng chi nhánh).
 * CX (cũng `student.edit_more`) và GV bộ môn không đổi được.
 */
export function duocDoiMon(p: Principal, ctx: { studentId?: number; classId?: number }): boolean {
  return can(p, PERMISSIONS.STUDENT_EDIT, ctx)
    || p.grants.some((g) => g.roleKey === 'consultant' && can({ ...p, grants: [g] }, PERMISSIONS.STUDENT_EDIT_MORE, ctx));
}

export function apMonDangKy(p: Principal, cycleId: number, monVao: MonVao, o: { xemTruoc?: boolean; ngay?: string } = {}): TomTatMon {
  const conn = db();
  const cy = conn.prepare('SELECT id, student_id, route, status, mon_dang_ky FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  if (!cy) throw notFound('Không tìm thấy lộ trình');
  if (!duocDoiMon(p, { studentId: cy.student_id })) throw forbidden('Bạn không có quyền đổi môn học của học viên này.');
  if (!cy.route) throw badRequest('Môn học chỉ áp cho lộ trình Fast Track.');
  if (cy.status !== 'active') throw badRequest('Lộ trình đã kết thúc — không đổi môn học.');
  const luu = docMon(monVao);
  const khongHoc: string[] = kyNangKhongHoc(luu);
  const boTask = boTaskCua(luu);
  /* Một câu: mọi dòng lịch của lượt MT (không MT0 — ledger: MT0 không áp môn) còn hiệu lực + có điểm chưa (Writing: từng task). */
  const coDiemO = (o: string) => `EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = k.attempt_id AND sc.skill = ${o} AND (sc.band IS NOT NULL OR sc.raw_score IS NOT NULL))`;
  const dong = conn.prepare(
    `SELECT k.attempt_id, k.skill, k.required, k.scope_reason, k.sit_status, k.bo_task, a.attempt_no,
            CASE WHEN k.skill = 'writing' THEN ${coDiemO("'writing1'")} OR ${coDiemO("'writing2'")} ELSE ${coDiemO('k.skill')} END AS co_diem,
            ${coDiemO("'writing1'")} AS co_w1, ${coDiemO("'writing2'")} AS co_w2
       FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id
      WHERE a.cycle_id = ? AND a.status != 'cancelled' AND a.kind != 'mt0' ORDER BY a.attempt_no, k.id`,
  ).all(cycleId) as any[];
  const chuaThi = (r: any) => !r.co_diem && CHUA_THI.has(r.sit_status);
  const tat = dong.filter((r) => r.required && khongHoc.includes(r.skill) && chuaThi(r));
  const giu = dong.filter((r) => khongHoc.includes(r.skill) && r.co_diem);
  const bat = dong.filter((r) => !r.required && r.scope_reason === LY_DO_KHONG_HOC && !khongHoc.includes(r.skill));
  /*
   * Task Writing: bỏ task → đánh dấu `bo_task` ở mọi lượt mà task bỏ CHƯA có điểm (kể cả lượt đã chấm task kia — không để nợ task bỏ mãi);
   * đủ hai task lại / đổi task → chỉ lượt chưa thi gì (lượt đã chấm giữ như lúc chấm).
   */
  const doiTask = dong.filter((r) => r.skill === 'writing' && (r.required || bat.includes(r)) && !khongHoc.includes('writing') && (r.bo_task ?? null) !== boTask
    && r.sit_status !== 'cancelled' && (boTask ? !r[boTask === 'writing1' ? 'co_w1' : 'co_w2'] : chuaThi(r)));
  /* Tóm tắt theo bài (lượt × môn): bỏ = tắt kỹ năng + đánh dấu task bỏ; thêm = bật lại + gỡ / đổi task bỏ; giữ = bài môn bỏ đã có điểm. */
  const boMoi = boTask ? doiTask : [], themTask = boTask ? [] : doiTask;
  const giuW = boTask ? dong.filter((r) => r.skill === 'writing' && r[boTask === 'writing1' ? 'co_w1' : 'co_w2']) : [];
  /* Case mở của môn VỪA bỏ (không đóng lại Case mở sau lần bỏ trước): ô nhập vừa thiếu + "writing" khi vừa bỏ cả Writing. */
  const thieuCu = new Set<string>(monThieu(cy.mon_dang_ky)), khongHocCu = kyNangKhongHoc(cy.mon_dang_ky);
  const boChuDe: string[] = [...monThieu(luu).filter((k) => !thieuCu.has(k)), ...(khongHoc.includes('writing') && !khongHocCu.includes('writing') ? ['writing'] : [])];
  const caseIds = boChuDe.length ? (conn.prepare(
    `SELECT sc.id FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE COALESCE(sc.cycle_id, a.cycle_id) = ? AND sc.status != 'done' AND sc.topic IN (${boChuDe.map(() => '?').join(',')})`,
  ).all(cycleId, ...boChuDe) as any[]).map((r) => r.id as number) : [];
  const tom: TomTatMon = {
    truoc: chuMon(cy.mon_dang_ky), sau: chuMon(luu), doi: luu !== (cy.mon_dang_ky ?? null),
    boKhoiDot: tat.length, giuDaCham: giu.length, batLai: bat.length, caseDong: caseIds.length,
    writing: boTask ? ENTRY_SKILL_SHORT[boTask === 'writing1' ? 'writing2' : 'writing1'] : null,
    khongDuBoMon: khongHoc.length > 0 || !!boTask,   // mockup k4 (Q4): chỉ học một task Writing cũng Không đủ bộ môn
    dong: [],
  };
  if (tom.doi) {
    const cu = new Set(monThieu(cy.mon_dang_ky)), moi = new Set(monThieu(luu));
    const ten = (ds: string[]) => ds.map((k) => ENTRY_SKILL_SHORT[k as keyof typeof ENTRY_SKILL_SHORT]).join(' ');
    const bo = ten([...moi].filter((k) => !cu.has(k))), them = ten([...cu].filter((k) => !moi.has(k)));
    const mt = (rs: any[]) => [...new Set(rs.map((r) => `MT${r.attempt_no}`))].join(', ');
    const dsBo = [...tat, ...boMoi], dsThem = [...bat, ...themTask], dsGiu = [...giu, ...giuW];
    if (bo && dsBo.length) tom.dong.push(`Bỏ ${bo} khỏi ${mt(dsBo)} (chưa có điểm) · lịch sử giữ`);
    if (bo && dsGiu.length) tom.dong.push(`${mt(dsGiu)} đã chấm giữ nguyên`);
    if (caseIds.length) tom.dong.push(`Đóng ${caseIds.length} Case (${ten(boChuDe.filter((k) => k !== 'writing'))}) — Không còn học môn`);
    if (them && dsThem.length) tom.dong.push(`Thêm ${them} vào ${mt(dsThem)} (chưa thi)`);
    if (them) tom.dong.push('Case đã đóng không tự mở lại');
    if (tom.writing || tom.khongDuBoMon) tom.dong.push([tom.writing && `Writing = ${tom.writing}`, tom.khongDuBoMon && 'Overall: Không đủ bộ môn'].filter(Boolean).join(' · '));
  }
  if (o.xemTruoc || !tom.doi) return tom;

  return tx(() => {
    conn.prepare('UPDATE learning_cycles SET mon_dang_ky = ? WHERE id = ?').run(luu, cycleId);
    /* "Không mock lại" đổi lịch cuối tuần là ngoại lệ N15 — đổi môn cũng không phải dời lịch nên không qua khoá T6–CN. */
    for (const r of tat) setSkillScope(p, r.attempt_id, r.skill, false, LY_DO_KHONG_HOC, { khongMockLai: true, monDangKy: true });
    for (const r of bat) setSkillScope(p, r.attempt_id, r.skill, true, null, { khongMockLai: true, monDangKy: true });
    for (const r of doiTask) conn.prepare(`UPDATE attempt_skills SET bo_task = ? WHERE attempt_id = ? AND skill = 'writing'`).run(boTask, r.attempt_id);
    capNhatConOCho(doiTask.map((r) => r.attempt_id));
    if (caseIds.length) closeCasesBySystem({ actorUserId: p.userId, studentId: cy.student_id, reason: 'khong_con_hoc_mon', on: o.ngay ?? demoToday(), caseIds });
    /* R1-NO-NHO: lượt vừa đổi bài (bỏ task W1 khi W2 đã chấm…) có thể vừa đủ điểm → kết quả + tín hiệu / Case ngay, như khi lưu điểm.
       Chỉ lượt đã có điểm — lượt rỗng không đổi trạng thái / tín hiệu (lô Sửa cả lớp không làm mới hàng chục lượt tương lai). */
    const coDiem = new Set(dong.filter((r) => r.co_diem).map((r) => r.attempt_id as number));
    for (const id of new Set([...tat, ...bat, ...doiTask].map((r) => r.attempt_id as number))) if (coDiem.has(id)) refreshOutcome(p, id);
    writeAudit({
      actorUserId: p.userId, action: 'cycle.mon_dang_ky', entityType: 'learning_cycle', entityId: cycleId, entityLabel: 'Môn học',
      before: { monDangKy: tom.truoc }, after: { monDangKy: tom.sau, boKhoiDot: tom.boKhoiDot, giuDaCham: tom.giuDaCham, batLai: tom.batLai, caseDong: tom.caseDong },
    });
    return tom;
  });
}
