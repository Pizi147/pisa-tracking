import { loadPrincipal, type Principal } from '../permissions.ts';
import { tieuChiThu } from './tieuChiThu.ts';
import { addDays } from '../util.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { LISTENING_BY_RAW, READING_BY_RAW } from '../fasttrack/scoring.ts';
import { commitIntake } from '../classes/intake.ts';
import { saveScore, setSkillSkip } from '../fasttrack/attempts.ts';
import { baoVang } from '../fasttrack/absence.ts';
import { setSkillWeek } from '../fasttrack/skillSchedule.ts';
import { planRegularTests, reportRegularNoShow } from '../normal/regular.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';
import { emailThu } from './emailThu.ts';

/**
 * BỘ DEMO PR-XLMT (planning đặt X1–X4, Q14) — đi qua CHÍNH các hàm nghiệp vụ như `prMtSeed.ts`, dựng sau ngày demo.
 *
 *   X1  MB FT 101 · ngăn Xếp lịch MT chọn MT3: Tạ Minh Quân (MT3 đủ 4 điểm → "Tạo MT4") · Lương Bảo Anh (MT3 có L R, còn W S →
 *       "Xếp nốt W S") · Hà Gia Bình (MT3 hai tuần nữa, chưa thi → "Dời")
 *  X2  MB FT 102 · Kiều Thu Trang (S vắng, máy tự dời lần 1, vắng lần 2 → chip "chờ duyệt") · Mạc Đức Long (MT1 "Huỷ phần còn lại" W S
 *       → chip "đã huỷ" + đếm "Cần xếp lại")
 *   X3  MB FT 101 · Đoàn Khánh Chi — thêm hôm nay, MT1–MT3 là MT lịch sử (đã nhập bù); MT4 thi thật 3 tuần trước chưa có lượt → Quản lý xếp MT4
 *       vào tuần đã qua = MT lịch sử
 *   X4  MB FOU 12 · Âu Nhật Nam — ô L tuần trước đã dời sang tuần này vì Báo vắng có lý do → thử menu ⋯ + Lịch sử
 */
export function buildXlmtDemo(ctx: BuildCtx): { students: number } {
  const { conn } = ctx;
  const ft101 = ctx.classId.get('MB FT 101');
  const ft102 = ctx.classId.get('MB FT 102');
  const fou12 = ctx.classId.get('MB FOU 12');
  if (!ft101 || !ft102 || !fou12) return { students: 0 };
  const admin = loadPrincipal(ctx.adminId);
  const ql = loadPrincipal(ctx.userId.get('MGR_MB')!);
  const gvcn = (classId: number): Principal => {
    const r = conn.prepare(`SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(classId) as any;
    return r ? loadPrincipal(r.id) : ql;
  };
  const tuan = (n: number) => mondayOf(addDays(DEMO_DATE, 7 * n));
  const them = (classId: number, ten: string, startWeek: string) => {
    commitIntake(admin, { classId, rows: [{ fullName: ten, target: 6.5, startWeek, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `xlmt-demo-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(st.id) as any;
    return { id: st.id as number, cycleId: cy.id as number };
  };
  const luot = (cycleId: number, no: number) =>
    conn.prepare('SELECT * FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ?').get(cycleId, no) as any;
  /* Kịch bản coi các lượt được lên lịch TỪ ĐẦU KHOÁ → lượt thường, không phải MT lịch sử (như prMtSeed). */
  const luotThuong = (cycleId: number) => conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE cycle_id = ?').run(cycleId);
  const nhap = (a: any, ks: Array<'l' | 'r' | 'w' | 's'>, band = 6.5) => {
    if (ks.includes('l')) saveScore(admin, a.id, 'listening', { rawScore: LISTENING_BY_RAW.indexOf(band) });
    if (ks.includes('r')) saveScore(admin, a.id, 'reading', { rawScore: READING_BY_RAW.indexOf(band) });
    if (ks.includes('w')) for (const k of ['writing1', 'writing2']) saveScore(admin, a.id, k, { criteria: tieuChiThu(band) });
    if (ks.includes('s')) saveScore(admin, a.id, 'speaking', { criteria: tieuChiThu(band) });
  };

  // ---------------------------------------------------------------- X1 · MB FT 101, đợt MT3
  const quan = them(ft101, 'Tạ Minh Quân', tuan(-16));                  // MT1 −11 · MT2 −5 · MT3 −1 tuần
  luotThuong(quan.cycleId);
  nhap(luot(quan.cycleId, 3), ['l', 'r', 'w', 's']);
  const baoAnh = them(ft101, 'Lương Bảo Anh', tuan(-16));
  luotThuong(baoAnh.cycleId);
  nhap(luot(baoAnh.cycleId, 3), ['l', 'r']);
  const binh = them(ft101, 'Hà Gia Bình', tuan(-13));                   // MT3 (tuần học 16) = 2 tuần nữa → ngăn gợi ý dời về tuần tới
  luotThuong(binh.cycleId);

  // ---------------------------------------------------------------- X2 · MB FT 102
  const trang = them(ft102, 'Kiều Thu Trang', tuan(-6));                // MT1 (tuần học 6) = tuần trước
  luotThuong(trang.cycleId);
  const trangA = luot(trang.cycleId, 1);
  baoVang(gvcn(ft102), trangA.id, 'speaking', 'Em ốm, phụ huynh đã báo', addDays(tuan(-1), 2));   // lần 1 → máy tự dời sang tuần này
  baoVang(gvcn(ft102), trangA.id, 'speaking', 'Em vẫn nghỉ ốm tuần này', DEMO_DATE);              // lần 2 → chờ Quản lý duyệt
  const long = them(ft102, 'Mạc Đức Long', tuan(-6));
  luotThuong(long.cycleId);
  const longA = luot(long.cycleId, 1);
  nhap(longA, ['l', 'r']);
  for (const k of ['writing', 'speaking']) setSkillSkip(ql, longA.id, k, true, 'Em nghỉ dài ngày, xếp lại W S sau');   // PR-MTGON: Huỷ kỹ năng

  // ---------------------------------------------------------------- X3 · HS mới, đã thi ngoài web MT1–MT4
  const chi = them(ft101, 'Đoàn Khánh Chi', tuan(-20));                 // MT1 −15 · MT2 −9 · MT3 −5 tuần — MT lịch sử; MT4 (−3) chưa có lượt
  for (const no of [1, 2, 3]) nhap(luot(chi.cycleId, no), ['l', 'r', 'w', 's']);   // "đã thi ngoài web" — nhập bù điểm MT lịch sử

  // ---------------------------------------------------------------- X4 · MB FOU 12, L đã dời vì Báo vắng
  const nam = them(fou12, 'Âu Nhật Nam', tuan(-6));
  /* PR-LT2a M1b: vào lớp thường tự có bài Cuối khoá — kịch bản X4 chỉ cần MỘT bài Giữa khoá đã qua, bỏ bài Cuối khoá tự tạo để L dời tuần được. */
  for (const a of conn.prepare(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND kind = 'final'`).all(nam.cycleId) as any[]) {
    conn.prepare('DELETE FROM attempt_skills WHERE attempt_id = ?').run(a.id);
    conn.prepare(`DELETE FROM journey_events WHERE ref_table = 'assessment_attempts' AND ref_id = ?`).run(a.id);
    conn.prepare('DELETE FROM assessment_attempts WHERE id = ?').run(a.id);
  }
  planRegularTests(ql, fou12, { studentIds: [nam.id], kinds: ['progress'] });
  const namA = conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'progress' ORDER BY id DESC LIMIT 1`).get(nam.id) as any;
  if (namA) {
    /* L thi tuần trước, em nghỉ → Báo vắng có lý do → L dời sang tuần này (không để ô ở tuần tương lai). */
    setSkillWeek(ql, namA.id, 'listening', ensurePeriod(tuan(-1)).id, { force: true, khiTao: true });
    reportRegularNoShow(gvcn(fou12), namA.id, 'listening', true, addDays(tuan(-1), 2), 'Em nghỉ ốm có phép');
  }
  return { students: 8 };
}
