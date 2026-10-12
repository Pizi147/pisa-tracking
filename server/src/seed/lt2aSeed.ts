/**
 * BỘ DEMO PR-LT2a (K5 §6 D9, D10 phần Giữa khoá; K1-55) — lớp thường · Giữa khoá. Đi qua CHÍNH các hàm dịch vụ (thêm HV → xếp bài Giữa khoá → nhập điểm
 * → Case tự tạo + PA Bổ trợ → Xác nhận Case (PA chạy ngay — PR-CT2 bỏ nộp / duyệt kế hoạch) → ghi kết quả → Báo phụ huynh qua TVV); chỉ lùi ngày bằng SQL ở G5.
 * Hai lớp MỚI cuối mảng `CLASSES`: MB FOU 15 (khai giảng 17/08 — Giữa khoá tuần 4 = W2 SEP) và MB BE 03 (10/08 — Giữa khoá tuần 5 = W2 SEP).
 * Bài Giữa khoá đã QUA tuần nên `commitIntake` (M1b) không dựng — Quản lý xếp tay bằng `planRegularTests` (được phép với tuần đã qua).
 *
 *  G1 (D9)  FOU 15 · Lê Hoàng Anh — trượt G+V, P: G+V đã xác nhận (Khoa) → PA G+V chạy; P chưa xác nhận (PA P Chưa bắt đầu); Báo PH chưa làm.
 *  G2       FOU 15 · Bùi Minh Châu — trượt R: Hà xác nhận → PA đang chạy, một lần ghi kết quả; Báo PH đã làm.
 *  G3 (D10) BE 03  · Hoàng Quốc Bình — trượt W: Khoa xác nhận → PA 1 buổi/tuần đang chạy.
 *  G4       BE 03  · Mai Hải Long — trượt S: chưa xác nhận → việc "Xác nhận nguyên nhân" của Trang.
 *  G6       FOU 15 · Trương Gia Bảo — trượt G+V: Khoa xác nhận (không phải người dạy) → PA chạy, người dạy GVCN Hà ghi Kết quả.
 *  G5       FOU 15 · Phan Khánh Linh — trượt L, hạn xác nhận lùi → thẻ Báo lên (Case chờ nguyên nhân quá hạn) · Ngô Gia Hân — trượt P: "Không cần theo dõi" chờ QL.
 */
import { loadPrincipal, type Principal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { commitIntake } from '../classes/intake.ts';
import { planRegularTests, saveRegularScore } from '../normal/regular.ts';
import { updateResult } from '../cases/cases.ts';
import { guiKhongTheoDoi, xacNhanCase } from '../cases/sosAuto.ts';
import { confirmCoordination } from '../yThuc/phoiHop.ts';
import { issuesForTopic } from '../../../shared/domain/index.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';

export function buildLt2aDemo(ctx: BuildCtx): { em: number } {
  const { conn } = ctx;
  const fou15 = ctx.classId.get('MB FOU 15');
  const be03 = ctx.classId.get('MB BE 03');
  if (!fou15 || !be03) return { em: 0 };
  const admin = loadPrincipal(ctx.adminId);
  const ql = loadPrincipal(ctx.userId.get('MGR_MB')!);
  const gv = (classId: number, kyNang: string | null): Principal => {
    const r = kyNang
      ? conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' LIMIT 1`).get(classId, kyNang)
      : conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(classId);
    return r ? loadPrincipal((r as any).id) : admin;
  };
  const xn = (topic: string, ct: string) => ({
    primaryCode: issuesForTopic(topic, ct)[0].code, urgency: 'attention',
    moTa: 'Em mất điểm ở phần này vì thiếu nền tảng ngữ pháp cơ bản, làm bài vội.',
  });
  /** Thêm em vào lớp, xếp bài Giữa khoá (đã qua tuần → đường Quản lý), nhập điểm /20 theo môn. */
  const dung = (classId: number, ten: string, diem: Record<string, number>) => {
    commitIntake(admin, { classId, rows: [{ fullName: ten, target: '-', email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `lt2a-demo-${ten}` } as any);
    const sid = (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
    planRegularTests(ql, classId, { studentIds: [sid], kinds: ['progress'] });
    const pt = (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress' ORDER BY id DESC LIMIT 1`).get(sid) as any).id as number;
    for (const [k, v] of Object.entries(diem)) saveRegularScore(admin, pt, k, { score: v, total: 20 } as any);
    return sid;
  };
  const caseMon = (sid: number, topic: string) =>
    (conn.prepare('SELECT id FROM sos_cases WHERE student_id = ? AND topic = ? ORDER BY id DESC LIMIT 1').get(sid, topic) as any).id as number;
  const pa = (caseId: number) => (conn.prepare(`SELECT id FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' AND status != 'cancelled' ORDER BY id LIMIT 1`).get(caseId) as any).id as number;
  const dat = { listening: 18, reading: 18, writing: 18, speaking: 18 };

  // G1 · FOU 15 — trượt G+V, P: G+V xác nhận → PA G+V chạy ngay; P chưa xác nhận (PA P chờ)
  const a = dung(fou15, 'Lê Hoàng Anh', { ...dat, writing: 11, speaking: 12 });
  xacNhanCase(gv(fou15, 'writing'), caseMon(a, 'writing'), xn('writing', 'FOU'));

  // G2 · FOU 15 — trượt R: Hà xác nhận → PA chạy + một lần ghi kết quả; Báo PH đã làm
  const b = dung(fou15, 'Bùi Minh Châu', { ...dat, reading: 10 });
  xacNhanCase(gv(fou15, 'reading'), caseMon(b, 'reading'), xn('reading', 'FOU'));
  updateResult(gv(fou15, null), pa(caseMon(b, 'reading')), {
    outcome: 'improved', note: 'Em đọc lướt tốt hơn, còn chậm ở phần Not Given.', decision: 'keep',
  } as any);
  const bao = conn.prepare(`SELECT id FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv' AND status = 'pending'`).get(b) as any;
  if (bao) confirmCoordination(gv(fou15, null), bao.id, { performedOn: DEMO_DATE, note: 'Đã gửi task cho TVV trên Base.' });

  // G3 · BE 03 — trượt W: Khoa xác nhận → PA 1 buổi/tuần chạy
  const c = dung(be03, 'Hoàng Quốc Bình', { ...dat, writing: 11 });
  xacNhanCase(gv(be03, 'writing'), caseMon(c, 'writing'), xn('writing', 'BE'));

  // G4 · BE 03 — trượt S: chưa xác nhận → việc Xác nhận nguyên nhân của Trang (PA bổ trợ "Chưa bắt đầu")
  dung(be03, 'Mai Hải Long', { ...dat, speaking: 12 });

  // G5 · FOU 15 — Case chờ nguyên nhân quá hạn (Báo lên) · Case P chờ "Không cần theo dõi"
  const e = dung(fou15, 'Phan Khánh Linh', { ...dat, listening: 10 });
  conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(addDays(DEMO_DATE, -2), caseMon(e, 'listening'));
  const f = dung(fou15, 'Ngô Gia Hân', { ...dat, speaking: 12 });
  guiKhongTheoDoi(gv(fou15, 'speaking'), caseMon(f, 'speaking'), { reasonCode: 'single_incident' });
  // G6 · FOU 15 — Khoa (không phải người dạy) xác nhận → PA chung chạy ngay, người dạy vẫn là GVCN Hà (việc Kết quả của Hà)
  const g = dung(fou15, 'Trương Gia Bảo', { ...dat, writing: 11 });
  xacNhanCase(gv(fou15, 'writing'), caseMon(g, 'writing'), xn('writing', 'FOU'));
  return { em: 7 };
}
