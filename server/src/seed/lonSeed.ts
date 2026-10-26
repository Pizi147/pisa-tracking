/**
 * R1-PHAN-CAP-TEST — DỮ LIỆU NGHIỆM THU Lịch Test (chỉ khi `SEED_LON=1`; kế hoạch `docs/superpowers/plans/2026-10-26-r1-phan-cap-test.md` Task 1).
 * Lịch Test W3 SEP nhiều lớp để chụp ảnh cặp, đo "hàng lớp dính không che", đọc thanh lớp / đầu cột khi cuộn lớp dài:
 *
 *   L1  MB FT 160 — 60 HV, MT1 tuần W3 SEP.
 *   L2  6 lớp FT 4 HV, MT1 tuần W3 SEP: MB FT 161 (một em MT2 — khác lượt), MB FT 162 (tên dài), MB FT 163 (một em có S Ex W3 SEP), MB FT 164–166.
 *
 * Mọi lớp ở MB, phân công như MB FT 101 (Trần Ngọc Hà L R + GVCN; W1 · W2 · S GV khác) — QL MB và GV 7 thấy. Đi qua hàm dịch vụ
 * (`createClass`, `commitIntake`, `saveScore`, `themSEx`). Cờ tắt: không gọi — seed y nguyên (id, ảnh chụp TD4-a / DL-2 không đổi).
 */
import { loadPrincipal } from '../permissions.ts';
import { commitIntake, createClass } from '../classes/intake.ts';
import { saveScore } from '../fasttrack/attempts.ts';
import { LISTENING_BY_RAW } from '../fasttrack/scoring.ts';
import { themSEx } from '../cham/sExpert.ts';
import { ensurePeriod } from '../platform/week.ts';
import { tieuChiThu } from './tieuChiThu.ts';
import { emailThu } from './emailThu.ts';
import { DEMO_DATE } from './data.ts';

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
const DEM = ['Minh', 'Gia', 'Thảo', 'Đức', 'Khánh', 'Quốc', 'Ngọc', 'Hải'];
const TEN = ['An', 'Huy', 'Vy', 'Long', 'Linh', 'Bảo', 'Châu', 'Nam', 'Trang'];

export function buildLonDemo(conn: any, adminId: number): { lop: number; hv: number } {
  const now = `${DEMO_DATE}T09:00:00.000Z`;
  const admin = loadPrincipal(adminId);
  const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const ql = loadPrincipal((conn.prepare(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'manager' AND ur.branch_id = ?`).get(mb) as any).id);
  /* Phân công mẫu = MB FT 101 (GV 7 L R + GVCN, GV khác W1 · W2 · S). */
  const mau = conn.prepare(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = (SELECT id FROM classes WHERE code = 'MB FT 101') AND status = 'active'`).all() as any[];
  const pc = conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,?, 'active', ?)`);
  /* Khai giảng 10/08 → MT1 tuần W3 SEP (14/09); em bắt đầu 29/06 → MT2 W3 SEP. */
  const khaiGiang = '2026-08-10';
  let soHv = 0;
  /* Tên giả không trùng em đã có (commitIntake + tra id theo tên). */
  let k = 0;
  const tenMoi = (): string => {
    const ten = `${HO[k % HO.length]} ${DEM[Math.floor(k / HO.length) % DEM.length]} ${TEN[Math.floor(k / (HO.length * DEM.length)) % TEN.length]}`;
    k += 7;   // bước lẻ: tên liền nhau khác cả họ, đệm
    return conn.prepare('SELECT 1 AS c FROM students WHERE full_name = ?').get(ten) ? tenMoi() : ten;
  };
  const lop = (code: string, n: number, som = 0) => {
    const id = (createClass(admin, { code, branchId: mb, kind: 'FT', route: 'LT1' as any, isFastTrack: true, startDate: khaiGiang, startPeriodId: ensurePeriod(khaiGiang).id }) as any).id as number;
    for (const a of mau) pc.run(a.user_id, id, a.skill, a.is_core, khaiGiang, now);
    const em: number[] = [];
    for (let i = 0; i < n; i++) {
      const ten = tenMoi();
      const startWeek = i < som ? '2026-06-29' : khaiGiang;
      commitIntake(admin, { classId: id, rows: [{ fullName: ten, target: 6.5, startWeek, email: emailThu(), dob: '2010-03-01' }], idempotencyKey: `lon-demo-${ten}` } as any);
      em.push((conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number);
    }
    soHv += n;
    conn.prepare('UPDATE assessment_attempts SET lich_su = 0 WHERE class_id = ?').run(id);
    return em;
  };

  lop('MB FT 160', 60);
  /* Em đầu MB FT 161 bắt đầu sớm: MT1 (03/08) đã đủ điểm, MT2 rơi vào W3 SEP — lưới cùng tuần có MT1 và MT2. */
  const [khacLuot] = lop('MB FT 161', 4, 1);
  const mt1 = (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND attempt_no = 1 AND kind = 'mock'`).get(khacLuot) as any).id as number;
  for (const k of ['listening', 'reading']) saveScore(admin, mt1, k, { rawScore: LISTENING_BY_RAW.indexOf(6.0), resultDate: '2026-08-07' });
  for (const k of ['writing1', 'writing2', 'speaking']) saveScore(admin, mt1, k, { criteria: tieuChiThu(6.0), resultDate: '2026-08-08' });
  lop('MB FT 162 Tối Thứ Ba – Thứ Năm (lớp ghép học bù)', 4);
  const [coSEx] = lop('MB FT 163', 4);
  themSEx(ql, { studentId: coSEx, ngay: '2026-09-14', diem: 6.5 });
  for (const c of ['MB FT 164', 'MB FT 165', 'MB FT 166']) lop(c, 4);
  return { lop: 7, hv: soHv };
}
