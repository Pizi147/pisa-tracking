/**
 * P8 MON-DANG-KY (plan.md 1.6 N13, N22 ④ — chỉ Fast Track): ĐỔI MÔN ĐĂNG KÝ của một lộ trình, xem trước hoặc lưu.
 *
 * Dùng lại phạm vi lượt có sẵn (`setSkillScope`): bài CHƯA THI (dòng lịch chưa có điểm, `scheduled` / `absent`) của môn bỏ → `required = 0`
 * lý do "Không học"; bài đã có điểm GIỮ (không xoá điểm — Q5). Bật lại môn → đúng các dòng "Không học" đó `required = 1`. Chỉ học một task
 * Writing → `bo_task` trên dòng Writing chưa thi. Case MỞ của môn bỏ → đóng "Không còn học môn" (PA đang chạy `cancelled`); bật lại không mở lại.
 * Xem trước và lưu cùng một hàm (`xemTruoc`) — web không tự suy tóm tắt.
 */
import { db, tx } from '../db.ts';
import { badRequest, notFound } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { closeCasesBySystem } from '../cases/systemClose.ts';
import { capNhatConOCho } from './conOCho.ts';
import { setSkillScope } from './skillSchedule.ts';
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
  /** Thiếu kỹ năng đánh giá → Overall "Không đủ bộ môn". */
  khongDuBoMon: boolean;
};

const CHUA_THI = new Set(['scheduled', 'absent']);

/** Chuẩn hoá ở biên: lỗi của hàm thuần → 400 (câu lỗi hiện tại ô Môn học). */
export function docMon(mon: MonVao): string | null {
  try { return luuMon(mon); } catch (e: any) { throw badRequest(e.message); }
}

export function apMonDangKy(p: Principal, cycleId: number, monVao: MonVao, o: { xemTruoc?: boolean; ngay?: string } = {}): TomTatMon {
  const conn = db();
  const cy = conn.prepare('SELECT id, student_id, route, mon_dang_ky FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  if (!cy) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId: cy.student_id }, 'Bạn không có quyền đổi môn học của học viên này.');
  if (!cy.route) throw badRequest('Môn học chỉ áp cho lộ trình Fast Track.');
  const luu = docMon(monVao);
  const khongHoc: string[] = kyNangKhongHoc(luu);
  const boTask = boTaskCua(luu);
  /* Một câu: mọi dòng lịch của lượt MT còn hiệu lực + có điểm chưa (Writing: một trong hai task). */
  const dong = conn.prepare(
    `SELECT k.attempt_id, k.skill, k.required, k.scope_reason, k.sit_status, k.bo_task,
            EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = k.attempt_id
                     AND sc.skill IN (k.skill, CASE k.skill WHEN 'writing' THEN 'writing1' END, CASE k.skill WHEN 'writing' THEN 'writing2' END)
                     AND (sc.band IS NOT NULL OR sc.raw_score IS NOT NULL)) AS co_diem
       FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id
      WHERE a.cycle_id = ? AND a.status != 'cancelled' ORDER BY a.attempt_no, k.id`,
  ).all(cycleId) as any[];
  const chuaThi = (r: any) => !r.co_diem && CHUA_THI.has(r.sit_status);
  const tat = dong.filter((r) => r.required && khongHoc.includes(r.skill) && chuaThi(r));
  const giu = dong.filter((r) => khongHoc.includes(r.skill) && r.co_diem);
  const bat = dong.filter((r) => !r.required && r.scope_reason === LY_DO_KHONG_HOC && !khongHoc.includes(r.skill));
  const doiTask = dong.filter((r) => r.skill === 'writing' && !khongHoc.includes('writing') && chuaThi(r) && (r.bo_task ?? null) !== boTask);
  /* Case mở của môn bỏ: ô nhập thiếu + "writing" khi bỏ cả Writing. */
  const boChuDe: string[] = [...monThieu(luu), ...(khongHoc.includes('writing') ? ['writing'] : [])];
  const caseIds = boChuDe.length ? (conn.prepare(
    `SELECT sc.id FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE COALESCE(sc.cycle_id, a.cycle_id) = ? AND sc.status != 'done' AND sc.topic IN (${boChuDe.map(() => '?').join(',')})`,
  ).all(cycleId, ...boChuDe) as any[]).map((r) => r.id as number) : [];
  const tom: TomTatMon = {
    truoc: chuMon(cy.mon_dang_ky), sau: chuMon(luu), doi: luu !== (cy.mon_dang_ky ?? null),
    boKhoiDot: tat.length, giuDaCham: giu.length, batLai: bat.length, caseDong: caseIds.length,
    writing: boTask ? ENTRY_SKILL_SHORT[boTask === 'writing1' ? 'writing2' : 'writing1'] : null,
    khongDuBoMon: khongHoc.length > 0,
  };
  if (o.xemTruoc || !tom.doi) return tom;

  return tx(() => {
    conn.prepare('UPDATE learning_cycles SET mon_dang_ky = ? WHERE id = ?').run(luu, cycleId);
    /* "Không mock lại" đổi lịch cuối tuần là ngoại lệ N15 — đổi môn cũng không phải dời lịch nên không qua khoá T6–CN. */
    for (const r of tat) setSkillScope(p, r.attempt_id, r.skill, false, LY_DO_KHONG_HOC, { khongMockLai: true });
    for (const r of bat) setSkillScope(p, r.attempt_id, r.skill, true, null, { khongMockLai: true });
    for (const r of doiTask) conn.prepare(`UPDATE attempt_skills SET bo_task = ? WHERE attempt_id = ? AND skill = 'writing'`).run(boTask, r.attempt_id);
    capNhatConOCho(doiTask.map((r) => r.attempt_id));
    if (caseIds.length) closeCasesBySystem({ actorUserId: p.userId, studentId: cy.student_id, reason: 'khong_con_hoc_mon', on: o.ngay ?? demoToday(), caseIds });
    writeAudit({
      actorUserId: p.userId, action: 'cycle.mon_dang_ky', entityType: 'learning_cycle', entityId: cycleId, entityLabel: 'Môn học',
      before: { monDangKy: tom.truoc }, after: { monDangKy: tom.sau, boKhoiDot: tom.boKhoiDot, giuDaCham: tom.giuDaCham, batLai: tom.batLai, caseDong: tom.caseDong },
    });
    return tom;
  });
}
