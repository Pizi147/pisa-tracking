import { loadPrincipal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { commitIntake, taoLopVaPhanCong } from '../classes/intake.ts';
import { saveRegularScore } from '../normal/regular.ts';
import { DEMO_DATE } from './journeys.ts';

/**
 * BỘ DEMO OV-6b2 — lớp PET dựng qua CHÍNH hàm nghiệp vụ (tạo lớp + phân công, thêm em, nhập điểm): `MB PET 01` khai giảng 5 tuần trước ngày demo
 * → Checkpoint 1 ở tuần học 6 = tuần demo (W3 SEP). 3 em: một Đạt (48/60 · 61/80), một "SOS · L+S" (35/60 · 58/80), một chưa nhập (để GVBM nhập thử).
 * Hai em đủ điểm đã có Checkpoint 2 (tuần học 12). Không Case / PA / việc. Nằm ở: Test › Điểm theo lớp (MB PET 01 · Checkpoint 1), hồ sơ lớp.
 */
export function buildPetDemo(conn: any, o: { adminId: number; mbId: number; userId: Map<string, number> }): { soHv: number } {
  const admin = loadPrincipal(o.adminId);
  const gv = (ma: string) => o.userId.get(ma)!;
  const khaiGiang = addDays(mondayOf(DEMO_DATE), -35);
  const lop = taoLopVaPhanCong(admin, {
    branchId: o.mbId, chuongTrinh: 'PET', so: '01', startPeriodId: ensurePeriod(khaiGiang).id,
    slots: [{ skill: null, userId: gv('T_HA'), isCore: true }, { skill: 'listening_speaking', userId: gv('T_HA'), isCore: false },
      { skill: 'reading_writing', userId: gv('T_KHOA'), isCore: false }],
  });
  const em = ['Lâm Bảo Ngọc', 'Hồ Minh Quân', 'Tạ Khánh Vy'].map((ten) => {
    commitIntake(admin, { classId: lop.id, rows: [{ fullName: ten, startWeek: khaiGiang, email: 'hv@demo.test', dob: '2012-03-01' }], idempotencyKey: `pet-demo-${ten}` } as any);
    return (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
  });
  const cp1 = (sid: number) => (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'checkpoint' AND attempt_no = 1`).get(sid) as any).id as number;
  const diem: [number, [number, number], [number, number]][] = [[em[0], [48, 60], [61, 80]], [em[1], [35, 60], [58, 80]]];
  for (const [sid, ls, rw] of diem) {
    saveRegularScore(admin, cp1(sid), 'listening_speaking', { score: ls[0], total: ls[1] }, DEMO_DATE);
    saveRegularScore(admin, cp1(sid), 'reading_writing', { score: rw[0], total: rw[1] }, DEMO_DATE);
  }
  return { soHv: em.length };
}
