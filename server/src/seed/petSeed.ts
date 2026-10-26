import { loadPrincipal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { commitIntake, taoLopVaPhanCong } from '../classes/intake.ts';
import { saveRegularScore } from '../normal/regular.ts';
import { DEMO_DATE } from './journeys.ts';
import { emailThu } from './emailThu.ts';

/**
 * BỘ DEMO OV-6b2 — lớp PET dựng qua CHÍNH hàm nghiệp vụ (tạo lớp + phân công, thêm em, nhập điểm): `MB PET 01` khai giảng 5 tuần trước ngày demo
 * → Checkpoint 1 ở tuần học 6 = tuần demo (W3 SEP). P13 KET-PET: 4 môn L · R · W · S (T_HA dạy L, S; T_KHOA dạy R, W).
 * 3 em: một Đạt (L 24/30 · R 30/40 · W 31/40 · S 24/30), một "SOS 2 · L S" (L 16/30 · S 19/30 dưới 70 %), một chưa nhập (để GVBM nhập thử).
 * Hai em đủ điểm đã có Checkpoint 2 (tuần học 12). Không Case / PA / việc. Nằm ở: Test › Điểm theo lớp (MB PET 01 · Checkpoint 1), hồ sơ lớp.
 */
export function buildPetDemo(conn: any, o: { adminId: number; mbId: number; userId: Map<string, number> }): { soHv: number } {
  const admin = loadPrincipal(o.adminId);
  const gv = (ma: string) => o.userId.get(ma)!;
  const khaiGiang = addDays(mondayOf(DEMO_DATE), -35);
  const lop = taoLopVaPhanCong(admin, {
    branchId: o.mbId, chuongTrinh: 'PET', so: '01', startPeriodId: ensurePeriod(khaiGiang).id,
    slots: [{ skill: null, userId: gv('T_HA'), isCore: true }, { skill: 'listening', userId: gv('T_HA'), isCore: false }, { skill: 'speaking', userId: gv('T_HA'), isCore: false },
      { skill: 'reading', userId: gv('T_KHOA'), isCore: false }, { skill: 'writing', userId: gv('T_KHOA'), isCore: false }],
  });
  const em = ['Lâm Bảo Ngọc', 'Hồ Minh Quân', 'Tạ Khánh Vy'].map((ten) => {
    commitIntake(admin, { classId: lop.id, rows: [{ fullName: ten, startWeek: khaiGiang, email: emailThu(), dob: '2012-03-01' }], idempotencyKey: `pet-demo-${ten}` } as any);
    return (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
  });
  const cp1 = (sid: number) => (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'checkpoint' AND attempt_no = 1`).get(sid) as any).id as number;
  const diem: [number, Record<string, [number, number]>][] = [
    [em[0], { listening: [24, 30], reading: [30, 40], writing: [31, 40], speaking: [24, 30] }],
    [em[1], { listening: [16, 30], reading: [30, 40], writing: [28, 40], speaking: [19, 30] }],
  ];
  for (const [sid, mon] of diem) {
    for (const [k, [score, total]] of Object.entries(mon)) saveRegularScore(admin, cp1(sid), k, { score, total }, DEMO_DATE);
  }
  return { soHv: em.length };
}
