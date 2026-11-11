import { loadPrincipal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { commitIntake, taoLopVaPhanCong } from '../classes/intake.ts';
import { CHI_TIET_CP_TAY, CHI_TIET_CP_TU_SINH, saveRegularScore } from '../normal/regular.ts';
import { reviseTarget } from '../fasttrack/cycles.ts';
import { datKetQuaThiThat } from '../loTrinh/thiThat.ts';
import { DEMO_DATE } from './journeys.ts';
import { emailThu } from './emailThu.ts';
import { CONG_TAC_CP } from '../../../shared/domain/index.ts';

/**
 * BỘ DEMO OV-6b2 — lớp PET dựng qua CHÍNH hàm nghiệp vụ (tạo lớp + phân công, thêm em, nhập điểm): `MB PET 01` khai giảng 5 tuần trước ngày demo
 * → Checkpoint 1 ở tuần học 6 = tuần demo (W3 SEP). MON-CT-1311: 2 môn L+S · R+W (T_HA dạy L+S; T_KHOA dạy R+W).
 * 3 em (P13: Target 150 · Target 145 + thi thật 159 · Grade B): một Đạt (L+S 48/60 · R+W 61/80), một "SOS 1 · L+S" (L+S 35/60 dưới 70 %), một chưa nhập (để GVBM nhập thử).
 * Hai em đủ điểm đã có Checkpoint 2 (tuần học 12). Không Case / PA / việc. Nằm ở: Test › Điểm theo lớp (MB PET 01 · Checkpoint 1), hồ sơ lớp.
 */
export function buildPetDemo(conn: any, o: { adminId: number; mbId: number; userId: Map<string, number> }): { soHv: number } {
  /* TAT-CHECKPOINT: dựng bằng đường tự sinh (bật tạm — lượt, lịch, điểm như cũ, băm tốc độ giữ) rồi ghi nguồn là QL XẾP TAY: bộ demo = lịch QL đã
     xếp khi tắt tự sinh, nên migrate `prTatCp` không ẩn gì (DEPLOY-2a: migrate không đổi dữ liệu mã hiện hành ghi). */
  const cu = CONG_TAC_CP.tuSinh;
  CONG_TAC_CP.tuSinh = true;
  try {
    const kq = dungPetDemo(conn, o);
    conn.prepare(`UPDATE journey_events SET detail = ? WHERE detail = ? AND ref_table = 'assessment_attempts'`).run(CHI_TIET_CP_TAY, CHI_TIET_CP_TU_SINH);
    conn.prepare(`UPDATE attempt_schedule_history SET reason = ? WHERE reason = ? AND action = 'created'`).run(CHI_TIET_CP_TAY, CHI_TIET_CP_TU_SINH);
    return kq;
  } finally { CONG_TAC_CP.tuSinh = cu; }
}

function dungPetDemo(conn: any, o: { adminId: number; mbId: number; userId: Map<string, number> }): { soHv: number } {
  const admin = loadPrincipal(o.adminId);
  const gv = (ma: string) => o.userId.get(ma)!;
  const khaiGiang = addDays(mondayOf(DEMO_DATE), -35);
  const lop = taoLopVaPhanCong(admin, {
    branchId: o.mbId, chuongTrinh: 'PET', so: '01', startPeriodId: ensurePeriod(khaiGiang).id,
    slots: [{ skill: null, userId: gv('T_HA'), isCore: true }, { skill: 'listening_speaking', userId: gv('T_HA'), isCore: false },
      { skill: 'reading_writing', userId: gv('T_KHOA'), isCore: false }],
  });
  const em = ['Lâm Bảo Ngọc', 'Hồ Minh Quân', 'Tạ Khánh Vy'].map((ten) => {
    commitIntake(admin, { classId: lop.id, rows: [{ fullName: ten, startWeek: khaiGiang, email: emailThu(), dob: '2012-03-01' }], idempotencyKey: `pet-demo-${ten}` } as any);
    return (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
  });
  const cp1 = (sid: number) => (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'checkpoint' AND attempt_no = 1`).get(sid) as any).id as number;
  const diem: [number, Record<string, [number, number]>][] = [
    [em[0], { listening_speaking: [48, 60], reading_writing: [61, 80] }],
    [em[1], { listening_speaking: [35, 60], reading_writing: [58, 80] }],
  ];
  for (const [sid, mon] of diem) {
    for (const [k, [score, total]] of Object.entries(mon)) saveRegularScore(admin, cp1(sid), k, { score, total }, DEMO_DATE);
  }
  /* P13 KET-PET: Lâm Bảo Ngọc có Target 150; Hồ Minh Quân có Target 145 + kết quả thi thật B1 Preliminary (Overall 159 · Grade B · B1). */
  const cy = (sid: number) => (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any).id as number;
  reviseTarget(admin, cy(em[0]), { newTarget: 150, effectiveFrom: khaiGiang, reason: 'Mục tiêu B1 Preliminary khi vào lớp' });
  reviseTarget(admin, cy(em[1]), { newTarget: 145, effectiveFrom: khaiGiang, reason: 'Mục tiêu B1 Preliminary khi vào lớp' });
  datKetQuaThiThat(admin, cy(em[1]), { ngayThi: addDays(DEMO_DATE, -2), r: 160, w: 155, l: 170, s: 150 });
  return { soHv: em.length };
}
