/** PHÉP KIỂM PR-HOP1 — một việc dời lịch một MT: MỘT hộp (`HopKyNang`), MỘT đường lưu `/ke-hoach-test/dot`. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const nguon = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrHop1Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  console.log('\nPR-HOP1 · Một hộp, một đường lưu');
  const QL = P.mbManager;
  const LOP = classId('MB FT 101');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));

  /** Em mới: MT1 (T+1), MT2 (T+4), MT3 (T+8), lịch Quản lý chốt. */
  const em = () => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `PRHOP1 Em ${Math.random().toString(36).slice(2, 7)}`, target: 6.5, startWeek: tuanNay, email: emailThu(), dob: '2010-01-01' }] });
    assert(r.added === 1, JSON.stringify(r.failed));
    const ds = conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY attempt_no`).all(r.studentIds[0]) as any[];
    [1, 4, 8].forEach((w, i) => {
      skillSch.ensureSkillRows(ds[i].id);
      conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual' WHERE id = ?`).run(tuan(w).id, ds[i].id);
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(w).id, ds[i].id);
    });
    return { m2: ds[1].id as number, m3: ds[2].id as number };
  };
  const tuanKn = (a: number, k: string) => (conn.prepare(
    'SELECT p.week_start w FROM attempt_skills s JOIN report_periods p ON p.id = s.planned_period_id WHERE s.attempt_id = ? AND s.skill = ?').get(a, k) as any).w;
  const band = (a: number, k: string) => (conn.prepare('SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(a, k) as any)?.band ?? null;

  check('HOP1-a · web: Hồ sơ MT không còn WeekModal / POST /attempts/:id/week; "Dời lịch thi" mở HopKyNang (lưu /ke-hoach-test/dot)', () => {
    const md = nguon('web/src/modules/fasttrack/MockDetailPage.tsx');
    assert(!/WeekModal|\/week[`'"]/.test(md), 'MockDetailPage còn WeekModal hoặc gọi /week');
    assert(/<HopKyNang\b/.test(md) && /doiTuanDau=/.test(md), 'MockDetailPage chưa mở HopKyNang');
    assert(/t === 'doi-lich' \|\| t === 'dat-lich'\) && d\.classId !== null\) onDoiLich/.test(md), '⋯ Dời lịch thi một kỹ năng chưa mở hộp');
    const hop = nguon('web/src/modules/test/keHoach/HopKyNang.tsx');
    assert(hop.includes("api.post('/ke-hoach-test/dot'"), 'HopKyNang không lưu qua /dot');
    for (const chu of ["CHU_MUC_HOP['nhat-ky']", "'Mở hồ sơ MT'"]) assert(hop.includes(chu), `⋯ đầu hộp thiếu ${chu}`);
    /* OV-15c (mục 6): "Huỷ MT{n}" bỏ khỏi ⋯ đầu hộp — thay bằng Xóa (bỏ tuần) ở chân hộp. */
    assert(!hop.includes('`Huỷ MT${dot.attemptNo}`') && !/HopHuyMt/.test(hop) && hop.includes('/bo-tuan'), 'hộp còn Huỷ MT / thiếu Xóa');
    const goi = fs.readdirSync(path.join(ROOT, 'web/src'), { recursive: true }).filter((f) => /\.tsx?$/.test(String(f)))
      .filter((f) => /attempts\/\$\{[^}]+\}\/week/.test(nguon(path.join('web/src', String(f)))));
    assert(goi.length === 0, `còn gọi POST /attempts/:id/week: ${goi.join(', ')}`);
  });

  check('HOP1-b · dời từ Hồ sơ MT (payload hộp, kỹ năng có điểm): đi /dot, giữ điểm, đổi tuần', () => {
    const a = em();
    conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, raw_score) VALUES (?,?,?,?)').run(a.m2, 'listening', 6, 30);
    keHoach.luuDot(QL, { attemptId: a.m2, kyNang: [{ skill: 'listening', periodId: tuan(6).id }], lyDoBo: null, reason: null, force: false });
    assert(tuanKn(a.m2, 'listening') === t.addDays(tuanNay, 42), tuanKn(a.m2, 'listening'));
    assert(band(a.m2, 'listening') === 6, 'mất điểm');
    assert(tuanKn(a.m2, 'reading') === t.addDays(tuanNay, 28), 'kỹ năng khác bị dời theo');
  });

  check('HOP1-d · Tuần chung (Dời lịch thi cả đợt) dời cả kỹ năng có điểm: L có điểm + R chưa điểm → cả hai sang tuần mới, điểm L giữ', () => {
    const a = em();
    conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, raw_score) VALUES (?,?,?,?)').run(a.m2, 'listening', 6, 30);
    /* PR-DON: kiểm hành vi thay quét nguồn — hộp chọn dòng theo "Tuần chung" bằng đúng `theoTuanChung` (trạng thái như `ttCua` của hộp). */
    const quyen = { nhapDiem: true, quanLy: true, gvcn: false, laFt: true, dotHoanTat: false };
    const tt = (coDiem: boolean, sit: string | null = null) => d.trangThaiTT({ batBuoc: true, tuanBatDau: t.addDays(tuanNay, 28), coDiem, sit, choDuyet: false, lichSu: false, homNay: TODAY });
    const dong = { listening: tt(true), reading: tt(false), writing: tt(false, 'cancelled') } as const;
    const chung = (Object.keys(dong) as (keyof typeof dong)[]).filter((k) => d.theoTuanChung(dong[k], quyen, false));
    assert(chung.join() === 'listening,reading', `dòng theo Tuần chung: ${chung} (${JSON.stringify(dong)})`);
    /* Payload hộp khi đổi Tuần chung: mọi dòng theo chung có tuần mới. */
    keHoach.luuDot(QL, { attemptId: a.m2, kyNang: chung.map((skill) => ({ skill, periodId: tuan(6).id })), lyDoBo: null, reason: null, force: false });
    for (const k of ['listening', 'reading']) assert(tuanKn(a.m2, k) === t.addDays(tuanNay, 42), `${k}: ${tuanKn(a.m2, k)}`);
    assert(band(a.m2, 'listening') === 6, 'mất điểm L');
  });

  check('HOP1-c · dời vượt MT sau từ hộp: kiem trả dòng chặn (câu đỏ #282), lưu 400 cùng câu, không đổi gì', () => {
    const a = em();
    const tw = d.tuanLich(t.addDays(tuanNay, 56));
    const cau = `MT3 thi ${tw}. Chọn tuần trước ${tw}, hoặc dời MT3 trước.`;
    const kyNang = [{ skill: 'speaking', periodId: tuan(9).id }];
    const k = keHoach.kiemDot(QL, { attemptId: a.m2, kyNang });
    assert(k.bai.some((b: any) => b.ghiChu === 'chan' && b.cau === cau), JSON.stringify(k.bai));
    let e: any = null;
    try { keHoach.luuDot(QL, { attemptId: a.m2, kyNang, lyDoBo: null, reason: null, force: true }); } catch (x) { e = x; }
    assert(e?.status === 400 && e.message.includes(cau), `${e?.status} ${e?.message}`);
    assert(tuanKn(a.m2, 'speaking') === t.addDays(tuanNay, 28), 'lịch đã đổi');
  });
}
