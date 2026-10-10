/** PHÉP KIỂM PR-TD3 — tốc độ đợt 2: đọc ít dòng (kế hoạch 2026-10-09-pr-td3-toc-do-doc-it-dong.md). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrTd3Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const att: any = await import('../fasttrack/attempts.ts');
  const ngu: any = await import('../platform/nguCanhRequest.ts');
  const cham: any = await import('../cham/canCham.ts');
  const week: any = await import('../platform/week.ts');
  console.log('\nPR-TD3 · Đọc ít dòng');

  check('TD3-0-1 · bộ đếm request giữ top 3 câu đọc nhiều dòng nhất (Lịch Test, QL): ≤ 3, giảm dần, tổng ≤ dem.dong', () => {
    const dem = ngu.chayTrongRequest('GET', () => {
      cham.lichTest(P.mbManager, week.ensurePeriod(TODAY).id, null, TODAY, { phamVi: null, classId: null });
      return ngu.demHienTai();
    });
    const top = dem.top as Array<{ sql: string; dong: number }>;
    assert(Array.isArray(top) && top.length > 0 && top.length <= 3, `top phải có 1–3 câu: ${JSON.stringify(top)}`);
    for (let i = 1; i < top.length; i++) assert(top[i - 1].dong >= top[i].dong, `top phải giảm dần: ${JSON.stringify(top)}`);
    assert(top.every((c) => c.sql.length <= 80 && !/\s\s/.test(c.sql)), `sql = 80 ký tự đầu, gộp khoảng trắng: ${JSON.stringify(top)}`);
    const tong = top.reduce((s, c) => s + c.dong, 0);
    assert(tong <= dem.dong, `tổng top ${tong} > dem.dong ${dem.dong}`);
  });

  /*
   * TD3-a-1: `chiConO` là TẬP CHA — sau lọc `conBaiCanCham` (đúng thứ `noQuaHan` dùng) ra cùng JSON. Dữ liệu cuối bộ kiểm có đủ năm loại
   * của Review Focus; thiếu Writing một ô thì thêm ở đây (bỏ band W2 của một lượt MT đã chấm đủ W).
   */
  check('TD3-a-1 · listAttempts chiConO: sau conBaiCanCham trùng JSON với không chiConO — mọi vai, có đủ "-" dời, W một ô, ô huỷ, lượt huỷ, em Tạm dừng', () => {
    const wMotO = () => (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts a WHERE a.kind = 'mock' AND a.status != 'cancelled'
      AND (SELECT COUNT(*) FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill IN ('writing1', 'writing2') AND sc.band IS NOT NULL) = 1`).get() as any).n;
    if (!wMotO()) {
      const a = conn.prepare(`SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id
        WHERE a.kind = 'mock' AND a.status != 'cancelled' AND s.status = 'active' AND a.class_id = ?
          AND (SELECT COUNT(*) FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill IN ('writing1', 'writing2') AND sc.band IS NOT NULL) = 2
        ORDER BY a.id LIMIT 1`).get(t.classId('MB FT 101')) as any;
      conn.prepare(`UPDATE assessment_scores SET band = NULL WHERE attempt_id = ? AND skill = 'writing2'`).run(a.id);
    }
    const dem = (sql: string) => (conn.prepare(sql).get() as any).n as number;
    const co = {
      doiGach: dem(`SELECT COUNT(*) n FROM assessment_scores sc JOIN assessment_attempts a ON a.id = sc.attempt_id
        JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = (CASE WHEN sc.skill IN ('writing1', 'writing2') THEN 'writing' ELSE sc.skill END)
        WHERE sc.no_show_period_id IS NOT NULL AND sc.no_show_period_id != k.planned_period_id AND a.status != 'cancelled'`),
      wMotO: wMotO(),
      oHuy: dem(`SELECT COUNT(*) n FROM attempt_skills WHERE sit_status = 'cancelled'`),
      luotHuy: dem(`SELECT COUNT(*) n FROM assessment_attempts WHERE status = 'cancelled'`),
      tamDung: dem(`SELECT COUNT(*) n FROM assessment_attempts a JOIN students s ON s.id = a.student_id WHERE s.status != 'active'`),
    };
    assert(Object.values(co).every((n) => n > 0), `thiếu loại dữ liệu: ${JSON.stringify(co)}`);
    let bot = 0;
    for (const [ten, p] of Object.entries(P)) {
      for (const lop of [undefined, t.classId('MB FT 101'), t.classId('MB FOU 12')]) {
        const f = { classId: lop, scope: 'managed', chiDangHoc: true, phamViCham: true };
        const cu = att.listAttempts(p, f).rows;
        const moi = att.listAttempts(p, { ...f, chiConO: true }).rows;
        bot += cu.length - moi.length;
        const a = JSON.stringify(cu.filter(att.conBaiCanCham)), b = JSON.stringify(moi.filter(att.conBaiCanCham));
        assert(a === b, `${ten} lớp ${lop ?? 'mọi'}: lệch sau conBaiCanCham (${a.length} vs ${b.length} ký tự)`);
      }
    }
    assert(bot > 0, 'chiConO phải bớt được lượt');
  });
}
