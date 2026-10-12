import { loadPrincipal, type Principal } from '../permissions.ts';
import { addDays, nowIso } from '../util.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { LISTENING_BY_RAW, READING_BY_RAW } from '../fasttrack/scoring.ts';
import { commitIntake } from '../classes/intake.ts';
import { apDungMotDong } from '../classes/luatLoTrinh.ts';
import { createAttempt, huyLuot, saveScore } from '../fasttrack/attempts.ts';
import { decideAbsenceMove, requestAbsenceMove, sweepExpiredMoves } from '../fasttrack/absence.ts';
import { recomputeCompletionWeek, setSitStatus } from '../fasttrack/skillSchedule.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';

/**
 * BỘ DEMO PR-MT (kế hoạch 29/09 Task 10, K5 §6 D1–D6, D16) — đi qua CHÍNH các hàm nghiệp vụ như `sosV3Seed.ts`, dựng SAU khi đặt ngày demo.
 *
 *   D1   lớp MB FT RF 12: Phan Gia Hân (mới, MT1 tuần 4, MT2 tuần 8) · Đặng Quốc Bảo (MT1 SOS 2 → PA quy chế hàng MT3, Phối hợp hàng MT4)
 *   D2/3 Lê Minh Khang — thêm hôm nay, bắt đầu 17 tuần trước: MT1–MT3 là MT lịch sử; MT2 đã nhập SOS 2 (ngoài 4 tuần → không Case);
 *        MT3 (2 tuần trước, trong cửa sổ) chưa nhập — GVCN Hà nhập thử sẽ ra Case
 *   D4   Trần Hữu Phúc — em FT KHÔNG có lượt nào (dữ liệu trước PR-MT)
 *   D5   bốn em dấu "-": máy tự dời lần 1 (Hồ Ngọc Diệp) · chờ Quản lý duyệt dời lần 2 (Ngô Bảo Châu) · đã duyệt (Lý Thanh Tâm) ·
 *        đề nghị hết hạn tự huỷ phần thi (Võ Minh Triết)
 *   D6   Phạm Khánh Linh — MT2 "Huỷ cả lượt" rồi tạo lại (cùng số, cùng dòng)
 *   D16  Đinh Gia Huy — MB FT 101 (LT1, có Case Listening) chuyển sang MB FT RF 12: lộ trình RF mới, Case đi theo
 */
export function buildPrMtDemo(ctx: BuildCtx): { students: number } {
  const { conn } = ctx;
  const ft101 = ctx.classId.get('MB FT 101');
  const rf12 = ctx.classId.get('MB FT RF 12');
  if (!ft101 || !rf12) return { students: 0 };
  const admin = loadPrincipal(ctx.adminId);
  const ql = loadPrincipal(ctx.userId.get('MGR_MB')!);
  const gv = (skill: string | null): Principal => {
    const r = (skill
      ? conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' LIMIT 1`).get(ft101, skill)
      : conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(ft101)) as any;
    return r ? loadPrincipal(r.id) : admin;
  };
  const tuan = (n: number) => mondayOf(addDays(DEMO_DATE, 7 * n));   // thứ Hai của tuần cách tuần demo n tuần

  const them = (classId: number, ten: string, startWeek: string, target = 6.5) => {
    commitIntake(admin, { classId, rows: [{ fullName: ten, target, startWeek, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `prmt-demo-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(st.id) as any;
    return { id: st.id as number, cycleId: cy.id as number };
  };
  const luot = (cycleId: number, no: number) =>
    conn.prepare('SELECT * FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ?').get(cycleId, no) as any;
  /* Kịch bản coi lượt này được lên lịch TỪ ĐẦU KHOÁ (trước tuần thi) → lượt thường, không phải MT lịch sử (như sosV3Seed). */
  const luotThuong = (a: any) => conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?').run(a.id);
  const nhap = (p: Principal, a: any, b: { l: number; r: number; w: number; s: number }) => {
    saveScore(p, a.id, 'listening', { rawScore: LISTENING_BY_RAW.indexOf(b.l) });
    saveScore(p, a.id, 'reading', { rawScore: READING_BY_RAW.indexOf(b.r) });
    for (const k of ['writing1', 'writing2']) saveScore(p, a.id, k, { criteria: [b.w, b.w, b.w, b.w] });
    saveScore(p, a.id, 'speaking', { criteria: [b.s, b.s, b.s, b.s] });
  };
  /* "Lần 1 đã dời do vắng" từ tuần trước nữa — ghi thẳng như các bộ dựng khác ghi mốc theo ngày demo (không có máy chạy lùi thời gian). */
  const daDoiLan1 = (a: any, skill: string, tu: string, sang: string) => {
    const den = ensurePeriod(sang);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual', absence_move_count = 1 WHERE attempt_id = ? AND skill = ?`)
      .run(den.id, a.id, skill);
    conn.prepare(
      `INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at)
       VALUES (?, 'skill_week_moved_absence', ?, ?, ?, 'Không dự thi — máy tự dời', NULL, ?)`,
    ).run(a.id, skill, ensurePeriod(tu).code, den.code, nowIso());
    recomputeCompletionWeek(a.id, null);
  };

  // ---------------------------------------------------------------- D1 · lớp RF
  them(rf12, 'Phan Gia Hân', tuan(0));
  const bao = them(rf12, 'Đặng Quốc Bảo', tuan(-4));                     // MT1 (tuần học 4) = tuần trước, lên lịch từ đầu khoá
  const baoA = luot(bao.cycleId, 1); luotThuong(baoA);
  nhap(admin, baoA, { l: 6, r: 6, w: 7, s: 7 });                         // RF: kỳ vọng = target 6.5 → L R dưới → SOS 2

  // ---------------------------------------------------------------- D2/D3 · HS cũ, MT lịch sử
  const khang = them(ft101, 'Lê Minh Khang', tuan(-17));                  // MT1 −12 tuần · MT2 −6 tuần · MT3 −2 tuần — cả ba là MT lịch sử
  conn.prepare(`UPDATE learning_cycles SET exam_month = '2027-01' WHERE id = ?`).run(khang.cycleId);
  nhap(admin, luot(khang.cycleId, 2), { l: 5, r: 5, w: 7, s: 7 });        // MT2 SOS 2 ngoài cửa sổ 4 tuần → không Case

  // ---------------------------------------------------------------- D4 · em FT không lượt nào (dữ liệu cũ)
  const phuc = them(ft101, 'Trần Hữu Phúc', tuan(-2));
  for (const t of ['attempt_schedule_history', 'attempt_skills']) {
    conn.prepare(`DELETE FROM ${t} WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE cycle_id = ?)`).run(phuc.cycleId);
  }
  conn.prepare('DELETE FROM assessment_attempts WHERE cycle_id = ?').run(phuc.cycleId);

  // ---------------------------------------------------------------- D5 · dời do vắng
  const gvL = gv('listening');
  /* Tự dời lần 1: "-" cả L R W S trong tuần trước → chốt ngay (OV-1b) → dời sang tuần này, báo GVCN + GVBM đúng kỹ năng. */
  const diep = them(ft101, 'Hồ Ngọc Diệp', tuan(-6));
  const diepA = luot(diep.cycleId, 1); luotThuong(diepA);
  for (const [k, p] of [['listening', gvL], ['reading', gv('reading')], ['writing1', gv('writing1')], ['writing2', gv('writing2')], ['speaking', gv('speaking')]] as const) {
    saveScore(p, diepA.id, k, { noShow: true }, addDays(tuan(-1), 2));
  }
  /* Lần 2: lần 1 đã dời từ tuần −2 sang tuần −1; "-" lại ở tuần −1 → chốt ngay → huỷ phần thi (vắng 2 lần, T3). */
  const chau = them(ft101, 'Ngô Bảo Châu', tuan(-7));
  const tam = them(ft101, 'Lý Thanh Tâm', tuan(-7));
  for (const st of [chau, tam]) {
    const a = luot(st.cycleId, 1); luotThuong(a);
    daDoiLan1(a, 'listening', tuan(-2), tuan(-1));
    saveScore(gvL, a.id, 'listening', { noShow: true }, addDays(tuan(-1), 2));
  }
  const deNghi = conn.prepare(
    `SELECT r.id FROM skill_move_requests r JOIN assessment_attempts a ON a.id = r.attempt_id
      WHERE a.cycle_id = ? AND r.status = 'pending'`,
  ).get(tam.cycleId) as any;
  if (deNghi) decideAbsenceMove(ql, deNghi.id, { approve: true, note: 'Đồng ý dời — em ốm có giấy' });
  /* Hết hạn: đề nghị lần 2 gửi thứ Tư tuần trước (hạn hết Chủ nhật tuần đó) mà Quản lý chưa trả lời → hôm nay tự huỷ phần thi (C09). */
  const triet = them(ft101, 'Võ Minh Triết', tuan(-7));
  const trietA = luot(triet.cycleId, 1); luotThuong(trietA);
  daDoiLan1(trietA, 'listening', tuan(-2), tuan(-1));
  setSitStatus(ql, trietA.id, 'listening', 'absent', 'GVCN báo em vắng buổi Listening');
  requestAbsenceMove(gv(null), trietA.id, ['listening'], { reason: 'Em vắng lần hai', today: addDays(tuan(-1), 2) });
  sweepExpiredMoves();

  // ---------------------------------------------------------------- D6 · huỷ cả lượt rồi tạo lại cùng số
  const linh = them(ft101, 'Phạm Khánh Linh', tuan(0));
  const mt2 = luot(linh.cycleId, 2);
  huyLuot(ql, luot(linh.cycleId, 3).id, { lyDo: 'Em xin hoãn đợt cuối' });
  huyLuot(ql, mt2.id, { lyDo: 'Em đổi lịch học' });
  createAttempt(ql, { studentId: linh.id, cycleId: linh.cycleId, periodId: mt2.planned_period_id });

  // ---------------------------------------------------------------- D16 · LT1 → RF, Case đi theo
  const huy = them(ft101, 'Đinh Gia Huy', tuan(-6));                      // MT1 (tuần học 6) = tuần trước, lên lịch từ đầu khoá
  const huyA = luot(huy.cycleId, 1); luotThuong(huyA);
  nhap(admin, huyA, { l: 5, r: 7, w: 7, s: 7 });                         // LT1 MT1 kỳ vọng 5.5 → L dưới → Case Listening
  apDungMotDong(admin, { sid: huy.id, toClassId: rf12, ngay: DEMO_DATE, lyDo: 'Chuyển sang lộ trình Refire', boiCanh: 'giua-khoa' });

  return { students: 11 };
}
